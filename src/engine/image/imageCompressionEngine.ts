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

function throwIfAborted(
  signal?: AbortSignal
): void {
  if (signal?.aborted) {
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
  }
}

function yieldToBrowser(
  signal?: AbortSignal
): Promise<void> {
  throwIfAborted(signal);

  return new Promise(
    (resolve, reject) => {
      const timer =
        window.setTimeout(
          resolve,
          0
        );

      if (!signal) {
        return;
      }

      signal.addEventListener(
        "abort",
        () => {
          window.clearTimeout(
            timer
          );

          reject(
            new DOMException(
              "Processing cancelled.",
              "AbortError"
            )
          );
        },
        { once: true }
      );
    }
  );
}

function getOutputType(
  options: CompressionOptions
): OutputFormat {
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
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Unable to create image."
              )
            );

            return;
          }

          resolve(blob);
        },
        type,
        type === "image/png"
          ? undefined
          : quality
      );
    }
  );
}

async function decodeImage(
  file: Blob,
  width?: number,
  height?: number,
  signal?: AbortSignal
): Promise<DecodedImage> {
  throwIfAborted(signal);

  /*
   * Prefer createImageBitmap because
   * the browser can decode directly at
   * the requested working resolution.
   */
  if (
    typeof createImageBitmap ===
    "function"
  ) {
    try {
      const bitmap =
        width && height
          ? await createImageBitmap(
              file,
              {
                resizeWidth:
                  width,
                resizeHeight:
                  height,
                resizeQuality:
                  "high",
              }
            )
          : await createImageBitmap(
              file
            );

      throwIfAborted(signal);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () =>
          bitmap.close(),
      };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      /*
       * Fall back to <img> for browsers
       * with incomplete ImageBitmap support.
       */
    }
  }

  const url =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (
          resolve,
          reject
        ) => {
          const element =
            new Image();

          element.onload =
            () =>
              resolve(
                element
              );

          element.onerror =
            () =>
              reject(
                new Error(
                  "Unable to decode image."
                )
              );

          element.src =
            url;
        }
      );

    throwIfAborted(signal);

    return {
      source: image,
      width:
        image.naturalWidth,
      height:
        image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
): {
  width: number;
  height: number;
} {
  let scale = 1;

  if (
    maxWidth &&
    width > maxWidth
  ) {
    scale = Math.min(
      scale,
      maxWidth / width
    );
  }

  if (
    maxHeight &&
    height > maxHeight
  ) {
    scale = Math.min(
      scale,
      maxHeight / height
    );
  }

  return {
    width: Math.max(
      1,
      Math.round(
        width * scale
      )
    ),

    height: Math.max(
      1,
      Math.round(
        height * scale
      )
    ),
  };
}

/*
 * Target-size resolution heuristic.
 *
 * Smaller targets get smaller working
 * resolutions because there is no benefit
 * in encoding a 7000px image when the
 * final file must be approximately 50 KB.
 */
function getTargetMaxDimension(
  targetKB: number
): number {
  if (targetKB <= 50) {
    return 1000;
  }

  if (targetKB <= 100) {
    return 1200;
  }

  if (targetKB <= 200) {
    return 1600;
  }

  if (targetKB <= 500) {
    return 2200;
  }

  return 2800;
}

function getResolutionCandidates(
  width: number,
  height: number,
  targetKB: number
): Array<{
  width: number;
  height: number;
}> {
  const maxDimension =
    getTargetMaxDimension(
      targetKB
    );

  const ratios = [
    1,
    0.78,
    0.58,
    0.42,
  ];

  const candidates: Array<{
    width: number;
    height: number;
  }> = [];

  for (
    const ratio of ratios
  ) {
    const dimensions =
      calculateDimensions(
        width,
        height,
        maxDimension * ratio,
        maxDimension * ratio
      );

    const exists =
      candidates.some(
        (candidate) =>
          candidate.width ===
            dimensions.width &&
          candidate.height ===
            dimensions.height
      );

    if (!exists) {
      candidates.push(
        dimensions
      );
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
  throwIfAborted(signal);

  const decoded =
    await decodeImage(
      file,
      width,
      height,
      signal
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    decoded.width;

  canvas.height =
    decoded.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    decoded.close?.();

    throw new Error(
      "Canvas is not supported by this browser."
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  context.drawImage(
    decoded.source,
    0,
    0,
    decoded.width,
    decoded.height
  );

  /*
   * Release ImageBitmap immediately.
   */
  decoded.close?.();

  const blob =
    await canvasToBlob(
      canvas,
      type,
      quality
    );

  /*
   * Release canvas backing memory.
   */
  canvas.width = 1;
  canvas.height = 1;

  throwIfAborted(signal);

  return blob;
}

/**
 * Normal image compression.
 *
 * Existing callers remain compatible.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please select a valid image file."
    );
  }

  const quality =
    Math.min(
      MAX_QUALITY,
      Math.max(
        MIN_QUALITY,
        options.quality ?? 0.8
      )
    );

  const outputType =
    getOutputType(options);

  options.onProgress?.(
    "reading"
  );

  const decoded =
    await decodeImage(
      file,
      undefined,
      undefined,
      options.signal
    );

  const dimensions =
    calculateDimensions(
      decoded.width,
      decoded.height,
      options.maxWidth,
      options.maxHeight
    );

  decoded.close?.();

  options.onProgress?.(
    "optimizing-resolution"
  );

  await yieldToBrowser(
    options.signal
  );

  return renderAtSize(
    file,
    dimensions.width,
    dimensions.height,
    outputType,
    quality,
    options.signal
  );
}

/**
 * Target-size compression.
 *
 * Supports both:
 *
 * compressToTargetSize(file, {
 *   targetKB: 100
 * })
 *
 * and the older positional form:
 *
 * compressToTargetSize(
 *   file,
 *   100,
 *   "image/jpeg"
 * )
 */
export async function compressToTargetSize(
  file: File | Blob,
  optionsOrTarget:
    | TargetCompressionOptions
    | number,
  legacyOutputType:
    OutputFormat =
      "image/jpeg"
): Promise<Blob> {
  const options:
    TargetCompressionOptions =
    typeof optionsOrTarget ===
    "number"
      ? {
          targetKB:
            optionsOrTarget,
          outputType:
            legacyOutputType,
        }
      : optionsOrTarget;

  if (
    !Number.isFinite(
      options.targetKB
    ) ||
    options.targetKB <= 0
  ) {
    throw new Error(
      "Target size must be greater than zero."
    );
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please select a valid image file."
    );
  }

  const targetBytes =
    Math.floor(
      options.targetKB * 1024
    );

  const outputType =
    getTargetOutputType(
      options
    );

  /*
   * Already small enough.
   * Avoid decoding and re-encoding.
   */
  if (
    file.size <= targetBytes
  ) {
    options.onProgress?.(
      "complete"
    );

    return file;
  }

  options.onProgress?.(
    "reading"
  );

  const original =
    await decodeImage(
      file,
      undefined,
      undefined,
      options.signal
    );

  const originalWidth =
    original.width;

  const originalHeight =
    original.height;

  original.close?.();

  const candidates =
    getResolutionCandidates(
      originalWidth,
      originalHeight,
      options.targetKB
    );

  for (
    const dimensions of candidates
  ) {
    throwIfAborted(
      options.signal
    );

    options.onProgress?.(
      "optimizing-resolution"
    );

    await yieldToBrowser(
      options.signal
    );

    /*
     * Binary search for the highest
     * quality that fits the target.
     */
    let low =
      MIN_QUALITY;

    let high =
      MAX_QUALITY;

    let bestUnderTarget:
      Blob | null = null;

    options.onProgress?.(
      "compressing"
    );

    for (
      let attempt = 0;
      attempt <
        QUALITY_ATTEMPTS;
      attempt += 1
    ) {
      throwIfAborted(
        options.signal
      );

      /*
       * First attempt uses maximum
       * reasonable quality.
       */
      const quality =
        attempt === 0
          ? MAX_QUALITY
          : (low + high) / 2;

      const blob =
        await renderAtSize(
          file,
          dimensions.width,
          dimensions.height,
          outputType,
          quality,
          options.signal
        );

      if (
        blob.size <=
        targetBytes
      ) {
        /*
         * Keep the highest quality
         * successful result.
         */
        bestUnderTarget =
          blob;

        low = quality;
      } else {
        high = quality;
      }

      /*
       * Give React/browser a chance
       * to update the UI.
       */
      await yieldToBrowser(
        options.signal
      );
    }

    if (
      bestUnderTarget
    ) {
      options.onProgress?.(
        "finalizing"
      );

      await yieldToBrowser(
        options.signal
      );

      options.onProgress?.(
        "complete"
      );

      return bestUnderTarget;
    }
  }

  throwIfAborted(
    options.signal
  );

  throw new Error(
    `Unable to reach ${options.targetKB} KB while maintaining reasonable image quality. Try a larger target such as 100 KB or 200 KB.`
  );
}

export async function resizeByWidth(
  file: File | Blob,
  width: number
): Promise<Blob> {
  if (
    !Number.isFinite(width) ||
    width <= 0
  ) {
    throw new Error(
      "Width must be greater than zero."
    );
  }

  const image =
    await decodeImage(file);

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          (width /
            image.width)
      )
    );

  image.close?.();

  return renderAtSize(
    file,
    Math.round(width),
    height,
    "image/jpeg",
    0.9
  );
}

export async function resizeByHeight(
  file: File | Blob,
  height: number
): Promise<Blob> {
  if (
    !Number.isFinite(height) ||
    height <= 0
  ) {
    throw new Error(
      "Height must be greater than zero."
    );
  }

  const image =
    await decodeImage(file);

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          (height /
            image.height)
      )
    );

  image.close?.();

  return renderAtSize(
    file,
    width,
    Math.round(height),
    "image/jpeg",
    0.9
  );
}

export async function resizeByPercentage(
  file: File | Blob,
  percentage: number
): Promise<Blob> {
  if (
    !Number.isFinite(
      percentage
    ) ||
    percentage <= 0
  ) {
    throw new Error(
      "Percentage must be greater than zero."
    );
  }

  const image =
    await decodeImage(file);

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          percentage /
          100
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          percentage /
          100
      )
    );

  image.close?.();

  return renderAtSize(
    file,
    width,
    height,
    "image/jpeg",
    0.9
  );
}