import { compressImage, type CompressionOptions } from './image-compression';

export interface UrlToFileOptions {
  fileName?: string;
  compressionOptions?: Partial<CompressionOptions>;
  onProgress?: (_progress: number) => void;
}

/**
 * Converts an image from URL to a File object
 * @param imageUrl - The URL of the image to convert
 * @param options - Optional configuration for the conversion
 * @returns Promise<File> - The converted file
 */
export async function convertUrlToFile(
  imageUrl: string,
  options: UrlToFileOptions = {}
): Promise<File> {
  const { fileName, compressionOptions, onProgress } = options;

  // Validate URL
  try {
    new URL(imageUrl);
  } catch {
    throw new Error('Invalid image URL provided');
  }

  try {
    // Fetch the image
    onProgress?.(10);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    onProgress?.(30);

    // Get content type from response headers or infer from URL
    const contentType =
      response.headers.get('content-type') || inferContentType(imageUrl);

    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }

    onProgress?.(50);

    // Convert response to blob
    const blob = await response.blob();

    onProgress?.(70);

    // Generate filename if not provided
    const finalFileName = fileName || generateFileName(imageUrl, contentType);

    // Create initial file from blob
    let file = new File([blob], finalFileName, { type: contentType });

    onProgress?.(85);

    // Compress the image if compression options are provided
    if (compressionOptions && Object.keys(compressionOptions).length > 0) {
      try {
        file = await compressImage(file, compressionOptions);
      } catch (compressionError) {
        console.warn(
          'Image compression failed, using original file:',
          compressionError
        );
        // Continue with original file if compression fails
      }
    }

    onProgress?.(100);

    return file;
  } catch (error) {
    console.error('Error converting URL to file:', error);
    throw new Error(
      `Failed to convert image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Infers content type from file extension
 */
function inferContentType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Generates a filename from URL and content type
 */
function generateFileName(url: string, contentType: string): string {
  // Try to extract filename from URL
  const urlPath = new URL(url).pathname;
  const urlFileName = urlPath.split('/').pop();

  if (urlFileName && urlFileName.includes('.')) {
    return urlFileName;
  }

  // Generate filename based on content type
  const extension = contentType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);

  return `image-${timestamp}-${randomString}.${extension}`;
}

/**
 * Validates if a URL points to an image
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    new URL(url);

    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');

    return contentType ? contentType.startsWith('image/') : false;
  } catch {
    return false;
  }
}

/**
 * Downloads an image from URL and returns it as a data URL
 */
export async function imageUrlToDataUrl(
  imageUrl: string,
  onProgress?: (_progress: number) => void
): Promise<string> {
  try {
    const file = await convertUrlToFile(imageUrl, { onProgress });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error('Failed to convert file to data URL'));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error converting image URL to data URL:', error);
    throw error;
  }
}
