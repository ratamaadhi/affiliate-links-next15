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
