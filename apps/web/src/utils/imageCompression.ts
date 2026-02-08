
/**
 * Utility for client-side image compression.
 * Uses HTMLCanvasElement to resize and compress images.
 */

interface CompressionOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0 to 1
    type: string; // 'image/jpeg' or 'image/png'
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1600, // Reasonable for evidence (HD)
    maxHeight: 1600,
    quality: 0.7,   // Good balance
    type: 'image/jpeg'
};

export const compressImage = async (file: File, options: Partial<CompressionOptions> = {}): Promise<Blob> => {
    const settings = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = (e) => reject(e);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
                if (width > settings.maxWidth) {
                    height = Math.round((height * settings.maxWidth) / width);
                    width = settings.maxWidth;
                }
            } else {
                if (height > settings.maxHeight) {
                    width = Math.round((width * settings.maxHeight) / height);
                    height = settings.maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to Blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Image compression failed'));
                    }
                },
                settings.type,
                settings.quality
            );
        };

        img.onerror = (e) => reject(e);

        reader.readAsDataURL(file);
    });
};

export const generateThumbnail = async (file: File): Promise<string> => {
    // Generate a very small data URL for immediate preview
    const blob = await compressImage(file, { maxWidth: 200, maxHeight: 200, quality: 0.5 });
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
