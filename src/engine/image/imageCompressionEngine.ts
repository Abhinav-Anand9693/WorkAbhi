import imageCompression from "browser-image-compression";

import {
  canvasToBlob,
  loadImage,
} from "./imageTransformEngine";

export async function compressImage(
  file: File,
  options?: {
    quality?: number;
    outputFormat?: string;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<Blob> {
  const quality =
    options?.quality ?? 0.8;

  const mimeType =
    options?.outputFormat ??
    "image/jpeg";

  const compressed =
    await imageCompression(file, {
      maxSizeMB: 10,
      maxWidthOrHeight:
        Math.max(
          options?.maxWidth ?? 2400,
          options?.maxHeight ?? 2400
        ),
      initialQuality: quality,
      useWebWorker: true,
      fileType: mimeType,
    });

  return compressed;
}

export async function compressToTargetSize(
  file: File,
  targetKB: number,
  outputFormat = "image/jpeg"
): Promise<Blob> {
  if (targetKB <= 0) {
    throw new Error(
      "Target size must be greater than zero."
    );
  }

  const targetBytes =
    targetKB * 1024;

  let quality = 0.95;

  let maxWidthOrHeight =
    4096;

  let bestBlob: Blob | null = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const result =
      await imageCompression(file, {
        maxSizeMB:
          targetKB / 1024,
        maxWidthOrHeight,
        initialQuality: quality,
        useWebWorker: true,
        fileType: outputFormat,
      });

    bestBlob = result;

    if (result.size <= targetBytes) {
      return result;
    }

    quality -= 0.07;

    if (quality < 0.2) {
      quality = 0.2;

      maxWidthOrHeight =
        Math.round(
          maxWidthOrHeight * 0.8
        );
    }
  }

  if (!bestBlob) {
    throw new Error(
      "Unable to compress image."
    );
  }

  return bestBlob;
}

export async function resizeByWidth(
  file: File,
  width: number
): Promise<Blob> {
  if (width <= 0) {
    throw new Error(
      "Width must be greater than zero."
    );
  }

  const image =
    await loadImage(file);

  const height =
    Math.round(
      image.naturalHeight *
        (width /
          image.naturalWidth)
    );

  return resizeImage(
    image,
    width,
    height
  );
}

export async function resizeByHeight(
  file: File,
  height: number
): Promise<Blob> {
  if (height <= 0) {
    throw new Error(
      "Height must be greater than zero."
    );
  }

  const image =
    await loadImage(file);

  const width =
    Math.round(
      image.naturalWidth *
        (height /
          image.naturalHeight)
    );

  return resizeImage(
    image,
    width,
    height
  );
}

export async function resizeByPercentage(
  file: File,
  percentage: number
): Promise<Blob> {
  if (percentage <= 0) {
    throw new Error(
      "Percentage must be greater than zero."
    );
  }

  const image =
    await loadImage(file);

  const multiplier =
    percentage / 100;

  const width =
    Math.round(
      image.naturalWidth *
        multiplier
    );

  const height =
    Math.round(
      image.naturalHeight *
        multiplier
    );

  return resizeImage(
    image,
    width,
    height
  );
}

async function resizeImage(
  image: HTMLImageElement,
  width: number,
  height: number
): Promise<Blob> {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return canvasToBlob(
    canvas,
    "image/jpeg",
    0.9
  );
}