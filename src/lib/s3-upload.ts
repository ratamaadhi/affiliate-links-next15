import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { deleteFileFromS3, generatePresignedUrlAction } from './s3/actions';

export interface S3UploadOptions {
  bucket?: string;
  key: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  onProgress?: (progress: number) => void;
}

export interface S3UploadResult {
  location: string;
  key: string;
  bucket: string;
  etag?: string;
}

export interface S3DeleteOptions {
  bucket?: string;
  key: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface S3DeleteResult {
  success: boolean;
  key: string;
  bucket: string;
}

export const computeSHA256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
};

function sanitizeTagValue(value: string): string {
  // Remove or replace characters that might cause issues in S3 tags
  return value
    .substring(0, 256) // Truncate to max 256 chars
    .replace(/[^\w\s\-._:/@#=+$]/g, '_') // Replace invalid chars with underscore
    .trim();
}

function createSafeTags(
  file: File
): Array<{ Key: string; Value: string }> | null {
  try {
    return [
      {
        Key: 'original-name',
        Value: sanitizeTagValue(file.name),
      },
      {
        Key: 'upload-date',
        Value: new Date().toISOString().split('T')[0],
      },
    ];
  } catch (error) {
    console.warn('Failed to create S3 tags:', error);
    return null;
  }
}

export async function uploadToS3(
  file: File,
  options: S3UploadOptions
): Promise<S3UploadResult> {
  const {
    bucket = process.env.S3_BUCKET,
    key,
    region = process.env.S3_REGION || 'us-east-1',
    accessKeyId = process.env.S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.S3_SECRET_ACCESS_KEY,
    endpoint = process.env.S3_ENDPOINT,
    forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true',
    onProgress,
  } = options;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 credentials are required. Please check your S3_* environment variables.'
    );
  }

  if (!bucket) {
    throw new Error(
      'S3 bucket is required. Please set S3_BUCKET environment variable.'
    );
  }

  // Configure S3 client with optional custom endpoint
  const clientConfig: any = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  // Add custom endpoint if provided (for S3-compatible services like MinIO, DigitalOcean Spaces, etc.)
  if (endpoint) {
    clientConfig.endpoint = endpoint;
    clientConfig.forcePathStyle = forcePathStyle;
  }

  const s3Client = new S3Client(clientConfig);

  try {
    // Prepare upload parameters
    const uploadParams: any = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    // Only add tags if they're likely to be supported
    // Some S3-compatible services don't support tags or have strict validation
    const safeTags = createSafeTags(file);
    if (safeTags && (!endpoint || endpoint.includes('amazonaws.com'))) {
      // Only add tags for AWS S3 or known compatible services
      uploadParams.TagSet = safeTags;
    }

    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = Math.round(
            (progress.loaded / progress.total) * 100
          );
          onProgress(percentage);
        }
      });
    }

    const result = await upload.done();

    // Generate appropriate location URL based on whether custom endpoint is used
    let location: string;
    if (endpoint) {
      // For custom endpoints, construct URL based on the endpoint
      const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
      if (forcePathStyle) {
        location = `${baseUrl}/${bucket}/${key}`;
      } else {
        location = `${baseUrl}/${key}`;
      }
    } else {
      // For AWS S3, use the standard format
      location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    return {
      location,
      key,
      bucket,
      etag: result.ETag?.replace(/"/g, ''),
    };
  } catch (error) {
    console.error('S3 upload failed:', error);

    // Handle specific S3 tag errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('InvalidTag')) {
      // Retry without tags if tag validation fails
      console.warn('Retrying upload without tags due to InvalidTag error');
      try {
        const uploadWithoutTags = new Upload({
          client: s3Client,
          params: {
            Bucket: bucket,
            Key: key,
            Body: file,
            ContentType: file.type,
            CacheControl: 'max-age=31536000',
          },
        });

        if (onProgress) {
          uploadWithoutTags.on('httpUploadProgress', (progress) => {
            if (progress.loaded && progress.total) {
              const percentage = Math.round(
                (progress.loaded / progress.total) * 100
              );
              onProgress(percentage);
            }
          });
        }

        const result = await uploadWithoutTags.done();

        // Generate appropriate location URL
        let location: string;
        if (endpoint) {
          const baseUrl = endpoint.replace(/\/$/, '');
          if (forcePathStyle) {
            location = `${baseUrl}/${bucket}/${key}`;
          } else {
            location = `${baseUrl}/${key}`;
          }
        } else {
          location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        }

        return {
          location,
          key,
          bucket,
          etag: result.ETag?.replace(/"/g, ''),
        };
      } catch (retryError) {
        console.error('Retry without tags also failed:', retryError);
        throw new Error(
          `Failed to upload to S3 (tag error and retry failed): ${errorMessage}`
        );
      }
    }

    throw new Error(`Failed to upload to S3: ${errorMessage}`);
  }
}

export function getS3Config() {
  return {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  };
}

export function sanitizeFileName(fileName: string): string {
  // Remove extension if present
  const nameWithoutExt = fileName.includes('.')
    ? fileName.substring(0, fileName.lastIndexOf('.'))
    : fileName;

  // Replace spaces and special characters with hyphens
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit to 50 characters
}

export function generateS3Key(prefix = 'uploads'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);

  // Create the new key format: original-filename-timestamp-randomString.extension
  return `${prefix}/${timestamp}-${randomString}`;
}

/**
 * Extract S3 key from various URL formats
 * Supports AWS S3 URLs and custom endpoint URLs
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Handle AWS S3 URLs: https://bucket.s3.region.amazonaws.com/key
    if (hostname.includes('.s3.') && hostname.includes('.amazonaws.com')) {
      // Extract bucket from hostname and get the key from pathname
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        // Remove leading slash from pathname
        return pathname.startsWith('/') ? pathname.substring(1) : pathname;
      }
    }

    // Handle custom endpoint URLs with path style: https://endpoint.com/bucket/key
    // Handle custom endpoint URLs with virtual host style: https://bucket.endpoint.com/key
    const pathSegments = pathname
      .split('/')
      .filter((segment) => segment.length > 0);

    if (pathSegments.length >= 2) {
      // Check if first segment is a bucket name (common pattern)
      // For path style: /bucket/key
      // For virtual host style: bucket is in hostname, so key starts from first segment
      return pathSegments.join('/');
    } else if (pathSegments.length === 1) {
      // Only key is in the path (bucket is in hostname)
      return pathSegments[0];
    }

    // If we can't determine the pattern, return the full pathname without leading slash
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  } catch (error) {
    console.error('Failed to extract S3 key from URL:', error);
    return null;
  }
}

/**
 * Extract bucket and key from S3 URL
 * Returns both bucket and key for more complete URL parsing
 */
export function parseS3Url(
  url: string
): { bucket: string | null; key: string | null } | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Handle AWS S3 URLs: https://bucket.s3.region.amazonaws.com/key
    if (hostname.includes('.s3.') && hostname.includes('.amazonaws.com')) {
      const parts = hostname.split('.');
      const bucket = parts[0];
      const key = pathname.startsWith('/') ? pathname.substring(1) : pathname;

      return { bucket, key };
    }

    // Handle custom endpoint URLs with path style: https://endpoint.com/bucket/key
    const pathSegments = pathname
      .split('/')
      .filter((segment) => segment.length > 0);

    if (pathSegments.length >= 2) {
      // Assume first segment is bucket name
      const bucket = pathSegments[0];
      const key = pathSegments.slice(1).join('/');

      return { bucket, key };
    } else if (pathSegments.length === 1) {
      // Only key is in the path, bucket might be in hostname
      const key = pathSegments[0];

      // Try to extract bucket from hostname (virtual host style)
      const bucketParts = hostname.split('.');
      const bucket = bucketParts[0];

      return { bucket, key };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse S3 URL:', error);
    return null;
  }
}

/**
 * Check if S3 URL belongs to our configured bucket
 * This prevents accidental deletion of files from other buckets
 */
export function isUrlFromOurBucket(url: string, ourBucket?: string): boolean {
  try {
    const parsed = parseS3Url(url);
    if (!parsed || !parsed.bucket) {
      return false;
    }

    const bucket = ourBucket || process.env.S3_BUCKET;
    if (!bucket) {
      console.warn('No bucket configured for validation');
      return false;
    }

    return parsed.bucket === bucket;
  } catch (error) {
    console.error('Error checking bucket ownership:', error);
    return false;
  }
}

/**
 * Validate that the URL belongs to our bucket before proceeding with operations
 * Throws an error if the URL is from a different bucket
 */
export function validateUrlFromOurBucket(
  url: string,
  ourBucket?: string
): { bucket: string; key: string; success: boolean } {
  const parsed = parseS3Url(url);

  if (!parsed || !parsed.bucket || !parsed.key) {
    console.error('Invalid S3 URL format');
    return { bucket: null, key: null, success: false };
  }

  const bucket = ourBucket || '';
  if (!bucket) {
    console.error('No bucket configured for validation');
    return { bucket: parsed.bucket, key: parsed.key, success: false };
  }

  if (parsed.bucket !== bucket) {
    console.error(
      `URL is from bucket "${parsed.bucket}" but our configured bucket is "${bucket}". ` +
        'For security reasons, you can only delete files from your own bucket.'
    );
    return { bucket: parsed.bucket, key: parsed.key, success: false };
  }

  return { bucket: parsed.bucket, key: parsed.key, success: true };
}

export async function uploadWithRetry(
  file: File,
  options: S3UploadOptions,
  maxRetries = 3
): Promise<S3UploadResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToS3(file, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Simplified upload function that uses environment variables by default
 */
export async function uploadFileToS3(
  file: File,
  key?: string,
  options: Partial<Omit<S3UploadOptions, 'key'>> = {}
): Promise<S3UploadResult> {
  const s3Config = getS3Config();
  const fileKey = key || generateS3Key();

  return uploadToS3(file, {
    ...s3Config,
    ...options,
    key: fileKey,
  });
}

/**
 * Simplified delete function that uses environment variables by default
 */
export async function deleteFileFromS3Simple(
  key: string,
  options: Partial<Omit<S3DeleteOptions, 'key'>> = {}
): Promise<S3DeleteResult> {
  const s3Config = getS3Config();

  return deleteFileFromS3({
    ...s3Config,
    ...options,
    key,
  });
}

/**
 * Delete file from S3 with retry logic
 */
export async function deleteWithRetry(
  options: S3DeleteOptions,
  maxRetries = 3
): Promise<S3DeleteResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await deleteFileFromS3(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Delete failed after retries');
}

export interface PresignedUrlOptions {
  bucket?: string;
  key: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  expiresIn?: number; // Default: 3600 (1 hour)
}

/**
 * Generate presigned URL using environment variables by default
 */
export async function generateObjectUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  return generatePresignedUrlAction({ key, expiresIn });
}

/**
 * Check if object exists and return presigned URL or fallback URL
 */
export async function getAccessibleUrl(
  key: string,
  fallbackEndpoint?: string,
  expiresIn = 3600
): Promise<string> {
  try {
    // Try to generate presigned URL first
    return await generatePresignedUrlAction({ key, expiresIn });
  } catch (error) {
    console.warn('Failed to generate presigned URL, using fallback:', error);

    // Fallback to direct URL if endpoint is provided
    if (fallbackEndpoint) {
      const baseUrl = fallbackEndpoint.replace(/\/$/, '');
      const bucket = process.env.S3_BUCKET;
      if (bucket) {
        return `${baseUrl}/${bucket}/${key}`;
      }
    }

    throw error;
  }
}

/*
 * USAGE EXAMPLES FOR DELETE FUNCTIONS
 *
 * // Basic usage with environment variables
 * try {
 *   const result = await deleteFileFromS3Simple('uploads/my-file-123456.jpg');
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file:', error);
 * }
 *
 * // With custom options
 * try {
 *   const result = await deleteFileFromS3({
 *     key: 'uploads/my-file-123456.jpg',
 *     bucket: 'my-custom-bucket',
 *     region: 'us-west-2',
 *     endpoint: 'https://nyc3.digitaloceanspaces.com',
 *     forcePathStyle: true
 *   });
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file:', error);
 * }
 *
 * // Delete using URL (automatically extracts key and validates bucket)
 * try {
 *   const imageUrl = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/my-file-123456.jpg';
 *   const result = await deleteFileFromS3ByUrl(imageUrl);
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file:', error);
 *   // If URL is from different bucket, you'll get:
 *   // "URL is from bucket 'other-bucket' but our configured bucket is 'my-bucket'"
 * }
 *
 * // Check if URL belongs to our bucket before deleting
 * const imageUrl = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/my-file-123456.jpg';
 * if (isUrlFromOurBucket(imageUrl)) {
 *   await deleteFileFromS3ByUrl(imageUrl);
 * } else {
 *   console.warn('URL is not from our bucket, skipping delete');
 * }
 *
 * // Delete using URL with validation options
 * try {
 *   const imageUrl = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/my-file-123456.jpg';
 *   const result = await deleteFileFromS3ByUrlWithOptions(imageUrl, {
 *     validateBucket: true // Default: true
 *   });
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file:', error);
 * }
 *
 * // Skip bucket validation (not recommended, use with caution)
 * try {
 *   const imageUrl = 'https://any-bucket.s3.us-east-1.amazonaws.com/uploads/file.jpg';
 *   const result = await deleteFileFromS3ByUrlWithOptions(imageUrl, {
 *     validateBucket: false,
 *     bucket: 'any-bucket' // Must specify bucket when skipping validation
 *   });
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file:', error);
 * }
 *
 * // Extract key from URL manually
 * const imageUrl = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/my-file-123456.jpg';
 * const key = extractS3KeyFromUrl(imageUrl); // Returns: 'uploads/my-file-123456.jpg'
 * const parsed = parseS3Url(imageUrl); // Returns: { bucket: 'my-bucket', key: 'uploads/my-file-123456.jpg' }
 *
 * // Validate URL belongs to our bucket
 * try {
 *   const validated = validateUrlFromOurBucket(imageUrl);
 *   console.log('Bucket:', validated.bucket, 'Key:', validated.key);
 * } catch (error) {
 *   console.error('URL validation failed:', error.message);
 * }
 *
 * // With retry logic
 * try {
 *   const result = await deleteWithRetry({
 *     key: 'uploads/my-file-123456.jpg'
 *   }, 5); // 5 retries
 *   console.log('File deleted successfully:', result);
 * } catch (error) {
 *   console.error('Failed to delete file after retries:', error);
 * }
 */
