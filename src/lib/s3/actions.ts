'use server';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { headers } from 'next/headers';
import { auth } from '../auth';
import {
  parseS3Url,
  PresignedUrlOptions,
  S3DeleteOptions,
  S3DeleteResult,
  validateUrlFromOurBucket,
} from '../s3-upload';

const S3Config = {
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
};

/**
 * Generate a presigned URL for secure S3 object access
 */
export async function generatePresignedUrlAction(
  options: PresignedUrlOptions & {
    checksum?: string;
    size?: number;
    type?: string;
  }
): Promise<string> {
  const {
    bucket = S3Config.bucket,
    key,
    region = S3Config.region || 'us-east-1',
    accessKeyId = S3Config.accessKeyId,
    secretAccessKey = S3Config.secretAccessKey,
    endpoint = S3Config.endpoint,
    forcePathStyle = S3Config.forcePathStyle,
    expiresIn = 3600,
    checksum,
    size,
    type,
  } = options;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('No Authenticated User');
  }

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
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: type,
      ContentLength: size,
      ChecksumSHA256: checksum,
      Metadata: {
        userId: session.user.id,
      },
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
 * Delete a file from S3
 */
export async function deleteFileFromS3(
  options: S3DeleteOptions
): Promise<S3DeleteResult> {
  const {
    bucket = S3Config.bucket,
    key,
    region = S3Config.region || 'us-east-1',
    accessKeyId = S3Config.accessKeyId,
    secretAccessKey = S3Config.secretAccessKey,
    endpoint = S3Config.endpoint,
    forcePathStyle = S3Config.forcePathStyle,
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

  if (!key) {
    throw new Error('S3 object key is required for deletion.');
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
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    return {
      success: true,
      key,
      bucket,
    };
  } catch (error) {
    console.error('S3 delete failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete from S3: ${errorMessage}`);
  }
}

/**
 * Delete file from S3 using URL
 * Automatically extracts the key from the URL and validates it belongs to our bucket
 */
export async function deleteFileFromS3ByUrlAction(
  url: string,
  options: Partial<Omit<S3DeleteOptions, 'key'>> = {}
): Promise<S3DeleteResult> {
  // Validate that the URL belongs to our bucket for security
  const validated = validateUrlFromOurBucket(url, S3Config.bucket);

  if (!validated.success) {
    return {
      success: false,
      bucket: null,
      key: null,
    };
  }

  return deleteFileFromS3({
    ...options,
    key: validated.key,
    bucket: validated.bucket,
  });
}

/**
 * Delete file from S3 using URL with optional validation
 * Set validateBucket to false if you want to skip bucket validation (not recommended)
 */
export async function deleteFileFromS3ByUrlWithOptions(
  url: string,
  options: Partial<Omit<S3DeleteOptions, 'key'>> & {
    validateBucket?: boolean;
  } = {}
): Promise<S3DeleteResult> {
  const { validateBucket = true, ...deleteOptions } = options;

  if (validateBucket) {
    // Validate that the URL belongs to our bucket for security
    const validated = validateUrlFromOurBucket(url, deleteOptions.bucket);

    return deleteFileFromS3({
      ...deleteOptions,
      key: validated.key,
      bucket: validated.bucket,
    });
  } else {
    // Skip validation (use with caution)
    const parsed = parseS3Url(url);

    if (!parsed || !parsed.key) {
      throw new Error('Could not extract S3 key from URL');
    }

    return deleteFileFromS3({
      ...deleteOptions,
      key: parsed.key,
      bucket: deleteOptions.bucket || parsed.bucket || undefined,
    });
  }
}
