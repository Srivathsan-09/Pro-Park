/**
 * Client-Side Image Compression & Optimization Utility
 * Resizes high-resolution mobile camera photos (4000x3000 -> 1000px max)
 * and compresses to lightweight JPEG data URI (~80KB - 150KB per photo)
 * to ensure blazing fast submissions and comply with Vercel's 4.5MB payload limit.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1000,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw and compress to JPEG format
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback to original data URL if canvas rendering fails
        resolve(event.target?.result as string);
      };
    };

    reader.onerror = (err) => reject(err);
  });
}
