import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    bucket = process.env.NEXT_PUBLIC_S3_BUCKET,
    key,
    region = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
    accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT,
    forcePathStyle = process.env.NEXT_PUBLIC_S3_FORCE_PATH_STYLE === 'true',
    onProgress,
  } = options;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 credentials are required. Please check your NEXT_PUBLIC_S3_* environment variables.'
    );
  }

  if (!bucket) {
    throw new Error(
      'S3 bucket is required. Please set NEXT_PUBLIC_S3_BUCKET environment variable.'
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
    bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
    region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    forcePathStyle: process.env.NEXT_PUBLIC_S3_FORCE_PATH_STYLE === 'true',
  };
}

function sanitizeFileName(fileName: string): string {
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

export function generateS3Key(
  file: File,
  prefix = 'uploads',
  originalFileName?: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileName = originalFileName || file.name;
  const extension = fileName?.split('.').pop() || '';

  // Sanitize the filename without extension
  const sanitizedFileName = sanitizeFileName(fileName);

  // Create the new key format: original-filename-timestamp-randomString.extension
  return `${prefix}/${sanitizedFileName}-${timestamp}-${randomString}.${extension}`;
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
  const fileKey = key || generateS3Key(file);

  return uploadToS3(file, {
    ...s3Config,
    ...options,
    key: fileKey,
  });
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
 * Generate a presigned URL for secure S3 object access
 */
export async function generatePresignedUrl(
  options: PresignedUrlOptions
): Promise<string> {
  const {
    bucket = process.env.NEXT_PUBLIC_S3_BUCKET,
    key,
    region = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
    accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT,
    forcePathStyle = process.env.NEXT_PUBLIC_S3_FORCE_PATH_STYLE === 'true',
    expiresIn = 3600,
  } = options;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 credentials are required. Please check your NEXT_PUBLIC_S3_* environment variables.'
    );
  }

  if (!bucket) {
    throw new Error(
      'S3 bucket is required. Please set NEXT_PUBLIC_S3_BUCKET environment variable.'
    );
  }

  // Configure S3 client
  const clientConfig: any = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  // Add custom endpoint if provided (for S3-compatible services like MinIO)
  if (endpoint) {
    clientConfig.endpoint = endpoint;
    clientConfig.forcePathStyle = forcePathStyle;
  }

  const s3Client = new S3Client(clientConfig);

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    throw new Error(
      `Failed to generate presigned URL: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Generate presigned URL using environment variables by default
 */
export async function generateObjectUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  return generatePresignedUrl({ key, expiresIn });
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
    return await generatePresignedUrl({ key, expiresIn });
  } catch (error) {
    console.warn('Failed to generate presigned URL, using fallback:', error);

    // Fallback to direct URL if endpoint is provided
    if (fallbackEndpoint) {
      const baseUrl = fallbackEndpoint.replace(/\/$/, '');
      const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
      if (bucket) {
        return `${baseUrl}/${bucket}/${key}`;
      }
    }

    throw error;
  }
}
