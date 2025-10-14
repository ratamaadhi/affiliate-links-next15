import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
  preserveExif?: boolean;
}

export const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: true,
};

export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const compressionOptions = {
    ...defaultCompressionOptions,
    ...options,
  };

  try {
    // Check if file needs compression
    if (file.size <= compressionOptions.maxSizeMB * 1024 * 1024) {
      return file;
    }

    const compressedFile = await imageCompression(file, compressionOptions);

    // If still too large, try with more aggressive settings
    if (compressedFile.size > compressionOptions.maxSizeMB * 1024 * 1024) {
      const aggressiveOptions = {
        ...compressionOptions,
        maxSizeMB: compressionOptions.maxSizeMB * 0.8, // Try 80% of target
        maxWidthOrHeight: 1280, // Smaller dimensions
      };

      return await imageCompression(compressedFile, aggressiveOptions);
    }

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function getCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}
