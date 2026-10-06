"use client";

export const MAX_SOURCE_PIXELS = 100_000_000;
export const MAX_CANVAS_PIXELS = 40_000_000;
export const MAX_CANVAS_DIMENSION = 32_767;

export type SupportedImageType =
  "image/jpeg" |
  "image/png" |
  "image/webp";

export function throwIfImageProcessingAborted(
  signal?: AbortSignal
): void {
  if (signal?.aborted)
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
}

function validateBasic(
  width: number,
  height: number,
  label: string
): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error(
      `${label} has invalid dimensions.`
    );

  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  )
    throw new Error(
      `${label} exceeds the browser's maximum supported image dimension.`
    );
}

export function validateImageDimensions(
  width: number,
  height: number,
  label = "Image"
): void {
  validateBasic(width, height, label);

  if (width * height > MAX_SOURCE_PIXELS)
    throw new Error(
      `${label} is too large for safe browser processing. Maximum source area is ${MAX_SOURCE_PIXELS.toLocaleString()} pixels.`
    );
}

export function validateCanvasDimensions(
  width: number,
  height: number,
  label = "Output image"
): void {
  validateBasic(width, height, label);

  if (width * height > MAX_CANVAS_PIXELS)
    throw new Error(
      `${label} is too large for safe canvas processing. Maximum output area is ${MAX_CANVAS_PIXELS.toLocaleString()} pixels.`
    );
}

export function getPreferredOutputType(
  file: Blob,
  fallback: SupportedImageType = "image/png"
): SupportedImageType {
  return file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
    ? file.type
    : fallback;
}

export function normalizeOutputType(
  type: string | undefined,
  fallback: SupportedImageType = "image/png"
): SupportedImageType {
  return type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp"
    ? type
    : fallback;
}

export function throwIfInvalidTargetSize(
  width: number,
  height: number,
  label = "Output image"
): void {
  validateCanvasDimensions(width, height, label);
}