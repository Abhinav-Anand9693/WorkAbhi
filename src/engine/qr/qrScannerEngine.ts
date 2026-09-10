import jsQR from "jsqr";

export async function scanQRCode(
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image.");
  }

  const bitmap = await createImageBitmap(file);

  try {
    const maxDimension = 2000;

    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      throw new Error("Canvas is not supported.");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const imageData = context.getImageData(
      0,
      0,
      width,
      height
    );

    const result = jsQR(
      imageData.data,
      imageData.width,
      imageData.height,
      {
        inversionAttempts: "attemptBoth",
      }
    );

    canvas.width = 1;
    canvas.height = 1;

    if (!result) {
      throw new Error(
        "No QR code was detected. Try a clearer image."
      );
    }

    return result.data;
  } finally {
    bitmap.close();
  }
}