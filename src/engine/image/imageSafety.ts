
"use client";

export const MAX_IMAGE_PIXELS = 30_000_000;
export const MAX_CANVAS_DIMENSION = 16_384;

export type SupportedImageType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export function throwIfImageProcessingAborted(
  signal?: AbortSignal
): void {
  if (signal?.aborted) {
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
  }
}

export function validateImageDimensions(
  width: number,
  height: number,
  label = "Image"
): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(`${label} has invalid dimensions.`);
  }

  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `${label} is too large for safe browser processing. Maximum dimension is ${MAX_CANVAS_DIMENSION}px.`
    );
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    throw new Error(
      `${label} is too large for safe browser processing. Maximum supported area is ${MAX_IMAGE_PIXELS.toLocaleString()} pixels.`
    );
  }
}

export function validateCanvasDimensions(
  width: number,
  height: number,
  label = "Output image"
): void {
  validateImageDimensions(width, height, label);
}

export function getPreferredOutputType(
  file: Blob,
  fallback: SupportedImageType = "image/png"
): SupportedImageType {
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return file.type;
  }

  return fallback;
}

export function normalizeOutputType(
  type: string | undefined,
  fallback: SupportedImageType = "image/png"
): SupportedImageType {
  if (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp"
  ) {
    return type;
  }

  return fallback;
}

export function throwIfInvalidTargetSize(
  width: number,
  height: number,
  label = "Output image"
): void {
  validateCanvasDimensions(width, height, label);
}
