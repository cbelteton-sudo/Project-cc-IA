/**
 * Utility for client-side image compression.
 * Resizes images to a maximum width while maintaining aspect ratio,
 * and converts them to WebP format for optimal storage.
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  base64: string;
  originalSizeKB: string;
  compressedSizeKB: string;
  compressionRatio: string;
}

export const compressImage = async (
  file: File,
  maxWidth = 1600,
  quality = 0.85,
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const originalSizeKB = (file.size / 1024).toFixed(2);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/webp', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            const compressedSizeKB = (blob.size / 1024).toFixed(2);
            const ratio = (((file.size - blob.size) / file.size) * 100).toFixed(1);

            const extension = 'webp';
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            console.log(
              `[Image Compression] Original: ${originalSizeKB} KB -> Compressed: ${compressedSizeKB} KB (Reduced by ${ratio}%)`,
            );

            resolve({
              file: compressedFile,
              previewUrl,
              base64,
              originalSizeKB,
              compressedSizeKB,
              compressionRatio: ratio,
            });
          },
          'image/webp',
          quality,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
