import jsQR from "jsqr";

export function scanQRCodeFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): string | null {
  if (width < 1 || height < 1) return null;
  const imageData = context.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data ?? null;
}

const MAX_PRIMARY_DIMENSION = 1600;
const MAX_SECONDARY_DIMENSION = 2400;

type ResizeImageBitmapOptions = ImageBitmapOptions & {
  resizeWidth?: number;
  resizeHeight?: number;
  resizeQuality?: ResizeQuality;
};

async function decodeAtSize(file: File, maxDimension: number): Promise<string | null> {
  let bitmap: ImageBitmap | null = null;

  try {
    const options: ResizeImageBitmapOptions = {
      resizeWidth: maxDimension,
      resizeHeight: maxDimension,
      resizeQuality: "high",
    };

    bitmap = await createImageBitmap(file, options);

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    try {
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas is not supported.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      const imageData = context.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      return result?.data ?? null;
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    bitmap?.close();
  }
}

export async function scanQRCode(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image.");
  }

  if (!file.size) {
    throw new Error("The selected image is empty.");
  }

  // Decode directly at a bounded size instead of first allocating the camera
  // image at its full native resolution. This is important for large mobile photos.
  const primary = await decodeAtSize(file, MAX_PRIMARY_DIMENSION);
  if (primary) return primary;

  // A second, larger pass improves detection for small QR codes while remaining
  // bounded. It is only allocated after the low-memory pass fails.
  const secondary = await decodeAtSize(file, MAX_SECONDARY_DIMENSION);
  if (secondary) return secondary;

  throw new Error("No QR code was detected. Try a clearer image or crop closer to the QR code.");
}
