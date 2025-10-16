import imageCompression from 'browser-image-compression';
import { decode, decodeFrames, encode } from 'modern-gif';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
  preserveExif?: boolean;
}

export interface GifCompressionOptions {
  quality?: number; // 0-100, higher = better quality
  colors?: number; // 2-256, number of colors
  lossy?: number; // 0-200, lossy compression level
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

/**
 * Mengonversi File Gambar (JPG/PNG) menjadi WebP Blob di sisi klien.
 * @param {File} imageFile - Objek File gambar yang akan dikonversi (dari <input type="file">).
 * @param {number} quality - Kualitas WebP (0.0 hingga 1.0). Default 0.9 (90%).
 * @returns {Promise<Blob>} Sebuah Promise yang me-resolve ke WebP Blob.
 */
export function convertImageToWebP(
  imageFile: File,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      return reject(new Error('Input bukan file gambar yang valid.'));
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Gagal mendapatkan konteks canvas 2D.'));
      }
      ctx.drawImage(image, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal membuat WebP Blob.'));
          }
        },
        'image/webp',
        quality
      );
    };

    image.onerror = () => {
      // Menangani error pemuatan, misalnya file rusak atau tidak valid
      reject(new Error('Gagal memuat gambar.'));
    };

    image.src = URL.createObjectURL(imageFile);
  });
}

export function createWebpFile(webpBlob: Blob, originalFileName: string): File {
  // 1. Tentukan nama file baru
  // Ganti ekstensi asli (.jpg, .png) dengan .webp
  const fileNameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, '');
  const newFileName = `${fileNameWithoutExtension}.webp`;

  // 2. Tentukan tipe MIME
  // Tipe MIME untuk WebP adalah 'image/webp'
  const mimeType = 'image/webp';

  // 3. Buat objek File baru dari Blob
  const webpFile = new File(
    [webpBlob], // Array berisi Blob data
    newFileName, // Nama file yang diinginkan
    {
      type: mimeType, // Tipe MIME
      lastModified: Date.now(), // Opsional: Atur tanggal modifikasi saat ini
    }
  );

  return webpFile;
}

/**
 * Compress GIF animation using modern-gif library while preserving animation
 * @param {File} gifFile - GIF file to compress
 * @param {GifCompressionOptions} options - Compression options
 * @returns {Promise<File>} Compressed GIF file
 */
export async function compressGif(
  gifFile: File,
  options: GifCompressionOptions = {}
): Promise<File> {
  if (!gifFile.type.includes('gif')) {
    throw new Error('File is not a GIF');
  }

  const { colors = 64, lossy = 0 } = options;
  let finalColors = colors;

  if (lossy > 100) {
    finalColors = Math.max(16, Math.floor(colors * 0.5));
  } else if (lossy > 50) {
    finalColors = Math.max(32, Math.floor(colors * 0.75));
  }

  try {
    // Check if file needs compression (skip if already small)
    const minSizeToCompress = 500 * 1024; // 500KB
    if (gifFile.size <= minSizeToCompress) {
      console.log('GIF is small enough, skipping compression');
      return gifFile;
    }

    console.log('Compressing GIF with modern-gif:', {
      originalSize: `${(gifFile.size / 1024).toFixed(2)}KB`,
      maxColors: finalColors,
    });

    const arrayBuffer = await gifFile.arrayBuffer();

    // Decode the GIF to get frames
    const decodedGif = decode(arrayBuffer);

    // Extract frames with compression
    const frames = decodeFrames(arrayBuffer);

    // Re-encode with reduced colors for compression
    const compressedArrayBuffer = await encode({
      width: decodedGif.width,
      height: decodedGif.height,
      frames: frames.map((frame) => ({
        data: frame.data,
        delay: frame.delay,
        left: 0,
        top: 0,
        width: frame.width,
        height: frame.height,
      })),
      maxColors: finalColors,
      looped: decodedGif.looped,
      loopCount: decodedGif.loopCount,
      format: 'arrayBuffer',
    });

    const compressedFile = new File([compressedArrayBuffer], gifFile.name, {
      type: 'image/gif',
      lastModified: Date.now(),
    });

    const compressionRatio = getCompressionRatio(
      gifFile.size,
      compressedFile.size
    );
    console.log('GIF compression completed:', {
      originalSize: `${(gifFile.size / 1024).toFixed(2)}KB`,
      compressedSize: `${(compressedFile.size / 1024).toFixed(2)}KB`,
      compressionRatio: `${compressionRatio}%`,
    });

    // If compression didn't help much, return original
    if (compressedFile.size >= gifFile.size * 0.9) {
      console.log('Compression not effective, using original file');
      return gifFile;
    }

    return compressedFile;
  } catch (error) {
    console.error('GIF compression failed:', error);
    // Return original file if compression fails
    console.warn('Using original GIF file due to compression failure');
    return gifFile;
  }
}

/**
 * Universal image compression function that handles both regular images and GIFs
 * @param {File} file - Image file to compress
 * @param {Partial<CompressionOptions>} imageOptions - Options for regular images
 * @param {GifCompressionOptions} gifOptions - Options for GIF files
 * @returns {Promise<File>} Compressed file
 */
export async function compressImageUniversal(
  file: File,
  imageOptions: Partial<CompressionOptions> = {},
  gifOptions: GifCompressionOptions = {}
): Promise<File> {
  if (file.type.includes('gif')) {
    return compressGif(file, gifOptions);
  } else {
    return compressImage(file, imageOptions);
  }
}
