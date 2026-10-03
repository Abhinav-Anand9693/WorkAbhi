export type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type CompressionStage =
  | "reading"
  | "optimizing-resolution"
  | "compressing"
  | "finalizing"
  | "complete";

export interface CompressionOptions {
  quality?: number;
  outputType?: OutputFormat;
  outputFormat?: OutputFormat;
  maxWidth?: number;
  maxHeight?: number;
  signal?: AbortSignal;
  onProgress?: (stage: CompressionStage) => void;
}

export interface TargetCompressionOptions {
  targetKB: number;
  outputType?: OutputFormat;
  outputFormat?: OutputFormat;
  signal?: AbortSignal;
  onProgress?: (stage: CompressionStage) => void;
}

const MAX_QUALITY = 0.92;
const MIN_QUALITY = 0.05;
const QUALITY_ATTEMPTS = 7;

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}

import {
  getPreferredOutputType,
  throwIfImageProcessingAborted,
  validateCanvasDimensions,
  validateImageDimensions,
} from "./imageSafety";

function yieldToBrowser(signal?: AbortSignal): Promise<void> {
  throwIfImageProcessingAborted(signal);

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 0);

    if (!signal) return;

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Processing cancelled.", "AbortError"));
      },
      { once: true }
    );
  });
}

function getOutputType(options: CompressionOptions): OutputFormat {
  return (
    options.outputType ??
    options.outputFormat ??
    "image/jpeg"
  );
}

function getTargetOutputType(
  options: TargetCompressionOptions
): OutputFormat {
  return (
    options.outputType ??
    options.outputFormat ??
    "image/jpeg"
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: OutputFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create image."));
          return;
        }
        resolve(blob);
      },
      type,
      // PNG is lossless in the browser canvas API; quality is intentionally
      // omitted so the UI never implies JPEG-style PNG quality control.
      type === "image/png" ? undefined : quality
    );
  });
}

async function decodeImage(
  file: Blob,
  width?: number,
  height?: number,
  signal?: AbortSignal
): Promise<DecodedImage> {
  throwIfImageProcessingAborted(signal);

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap =
        width && height
          ? await createImageBitmap(file, {
              resizeWidth: width,
              resizeHeight: height,
              resizeQuality: "high",
            })
          : await createImageBitmap(file);

      throwIfImageProcessingAborted(signal);
      validateImageDimensions(bitmap.width, bitmap.height);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      // Fall through to <img> for browser compatibility.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const element = new Image();

        element.onload = () => resolve(element);
        element.onerror = () =>
          reject(new Error("Unable to decode image."));
        element.src = url;
      }
    );

    throwIfImageProcessingAborted(signal);
    validateImageDimensions(
      image.naturalWidth,
      image.naturalHeight
    );

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let scale = 1;

  if (maxWidth && width > maxWidth) {
    scale = Math.min(scale, maxWidth / width);
  }

  if (maxHeight && height > maxHeight) {
    scale = Math.min(scale, maxHeight / height);
  }

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getTargetMaxDimension(targetKB: number): number {
  if (targetKB <= 50) return 1000;
  if (targetKB <= 100) return 1200;
  if (targetKB <= 200) return 1600;
  if (targetKB <= 500) return 2200;
  return 2800;
}

function getResolutionCandidates(
  width: number,
  height: number,
  targetKB: number
): Array<{ width: number; height: number }> {
  const maxDimension = getTargetMaxDimension(targetKB);
  const ratios = [1, 0.78, 0.58, 0.42];
  const candidates: Array<{ width: number; height: number }> = [];

  for (const ratio of ratios) {
    const dimensions = calculateDimensions(
      width,
      height,
      maxDimension * ratio,
      maxDimension * ratio
    );

    validateCanvasDimensions(
      dimensions.width,
      dimensions.height,
      "Working image"
    );

    if (
      !candidates.some(
        (candidate) =>
          candidate.width === dimensions.width &&
          candidate.height === dimensions.height
      )
    ) {
      candidates.push(dimensions);
    }
  }

  return candidates;
}

async function renderAtSize(
  file: Blob,
  width: number,
  height: number,
  type: OutputFormat,
  quality: number,
  signal?: AbortSignal
): Promise<Blob> {
  throwIfImageProcessingAborted(signal);
  validateCanvasDimensions(width, height);

  const decoded = await decodeImage(
    file,
    width,
    height,
    signal
  );

  const canvas = document.createElement("canvas");
  validateCanvasDimensions(decoded.width, decoded.height);
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext("2d");

  if (!context) {
    decoded.close?.();
    throw new Error("Canvas is not supported by this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    decoded.source,
    0,
    0,
    decoded.width,
    decoded.height
  );

  decoded.close?.();

  throwIfImageProcessingAborted(signal);

  const blob = await canvasToBlob(
    canvas,
    type,
    quality
  );

  canvas.width = 1;
  canvas.height = 1;

  throwIfImageProcessingAborted(signal);
  return blob;
}

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const quality = Math.min(
    MAX_QUALITY,
    Math.max(MIN_QUALITY, options.quality ?? 0.8)
  );

  const outputType = getOutputType(options);

  options.onProgress?.("reading");

  const decoded = await decodeImage(
    file,
    undefined,
    undefined,
    options.signal
  );

  const dimensions = calculateDimensions(
    decoded.width,
    decoded.height,
    options.maxWidth,
    options.maxHeight
  );

  validateCanvasDimensions(
    dimensions.width,
    dimensions.height
  );

  decoded.close?.();

  options.onProgress?.("optimizing-resolution");
  await yieldToBrowser(options.signal);

  options.onProgress?.("compressing");

  const result = await renderAtSize(
    file,
    dimensions.width,
    dimensions.height,
    outputType,
    quality,
    options.signal
  );

  options.onProgress?.("complete");
  return result;
}

export async function compressToTargetSize(
  file: File | Blob,
  optionsOrTarget: TargetCompressionOptions | number,
  legacyOutputType: OutputFormat = "image/jpeg"
): Promise<Blob> {
  const options: TargetCompressionOptions =
    typeof optionsOrTarget === "number"
      ? {
          targetKB: optionsOrTarget,
          outputType: legacyOutputType,
        }
      : optionsOrTarget;

  if (!Number.isFinite(options.targetKB) || options.targetKB <= 0) {
    throw new Error("Target size must be greater than zero.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const targetBytes = Math.floor(options.targetKB * 1024);
  const outputType = getTargetOutputType(options);

  /*
   * Returning the original file is only safe when it already has the
   * requested format. Otherwise the requested output format would be
   * silently ignored.
   */
  if (
    file.size <= targetBytes &&
    file.type === outputType
  ) {
    options.onProgress?.("complete");
    return file;
  }

  options.onProgress?.("reading");

  const original = await decodeImage(
    file,
    undefined,
    undefined,
    options.signal
  );

  const originalWidth = original.width;
  const originalHeight = original.height;
  original.close?.();

  const candidates = getResolutionCandidates(
    originalWidth,
    originalHeight,
    options.targetKB
  );

  for (const dimensions of candidates) {
    throwIfImageProcessingAborted(options.signal);
    options.onProgress?.("optimizing-resolution");
    await yieldToBrowser(options.signal);

    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let bestUnderTarget: Blob | null = null;

    options.onProgress?.("compressing");

    for (
      let attempt = 0;
      attempt < QUALITY_ATTEMPTS;
      attempt += 1
    ) {
      throwIfImageProcessingAborted(options.signal);

      const quality =
        attempt === 0
          ? MAX_QUALITY
          : (low + high) / 2;

      const blob = await renderAtSize(
        file,
        dimensions.width,
        dimensions.height,
        outputType,
        quality,
        options.signal
      );

      if (blob.size <= targetBytes) {
        bestUnderTarget = blob;
        low = quality;
      } else {
        high = quality;
      }

      await yieldToBrowser(options.signal);
    }

    if (bestUnderTarget) {
      options.onProgress?.("finalizing");
      await yieldToBrowser(options.signal);
      options.onProgress?.("complete");
      return bestUnderTarget;
    }
  }

  throwIfImageProcessingAborted(options.signal);
  throw new Error(
    `Unable to reach ${options.targetKB} KB while maintaining reasonable image quality. Try a larger target such as 100 KB or 200 KB.`
  );
}

async function getResizeDimensions(
  file: File | Blob,
  width?: number,
  height?: number,
  signal?: AbortSignal
): Promise<{ width: number; height: number }> {
  const image = await decodeImage(
    file,
    undefined,
    undefined,
    signal
  );

  const result = calculateDimensions(
    image.width,
    image.height,
    width,
    height
  );

  image.close?.();
  validateCanvasDimensions(result.width, result.height);
  return result;
}

export async function resizeByWidth(
  file: File | Blob,
  width: number,
  signal?: AbortSignal
): Promise<Blob> {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error("Width must be greater than zero.");
  }

  const dimensions = await getResizeDimensions(
    file,
    width,
    undefined,
    signal
  );

  return renderAtSize(
    file,
    dimensions.width,
    dimensions.height,
    getPreferredOutputType(file),
    0.9,
    signal
  );
}

export async function resizeByHeight(
  file: File | Blob,
  height: number,
  signal?: AbortSignal
): Promise<Blob> {
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error("Height must be greater than zero.");
  }

  const dimensions = await getResizeDimensions(
    file,
    undefined,
    height,
    signal
  );

  return renderAtSize(
    file,
    dimensions.width,
    dimensions.height,
    getPreferredOutputType(file),
    0.9,
    signal
  );
}

export async function resizeByPercentage(
  file: File | Blob,
  percentage: number,
  signal?: AbortSignal
): Promise<Blob> {
  if (!Number.isFinite(percentage) || percentage <= 0) {
    throw new Error("Percentage must be greater than zero.");
  }

  const image = await decodeImage(
    file,
    undefined,
    undefined,
    signal
  );

  const width = Math.max(
    1,
    Math.round(image.width * percentage / 100)
  );
  const height = Math.max(
    1,
    Math.round(image.height * percentage / 100)
  );

  image.close?.();
  validateCanvasDimensions(width, height);

  return renderAtSize(
    file,
    width,
    height,
    getPreferredOutputType(file),
    0.9,
    signal
  );
}
