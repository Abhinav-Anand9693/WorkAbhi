"use client";

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
}

export interface TargetCompressionOptions {
  targetKB: number;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  maxWidth?: number;
  maxHeight?: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image."));
    };

    img.src = url;
  });
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
) {
  let newWidth = width;
  let newHeight = height;

  if (maxWidth && newWidth > maxWidth) {
    const ratio = maxWidth / newWidth;
    newWidth = maxWidth;
    newHeight = Math.round(newHeight * ratio);
  }

  if (maxHeight && newHeight > maxHeight) {
    const ratio = maxHeight / newHeight;
    newHeight = maxHeight;
    newWidth = Math.round(newWidth * ratio);
  }

  return {
    width: Math.max(1, Math.round(newWidth)),
    height: Math.max(1, Math.round(newHeight)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png" | "image/webp",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function renderImage(
  file: File,
  options: CompressionOptions
): Promise<Blob> {
  const image = await loadImage(file);

  const { width, height } = calculateDimensions(
    image.naturalWidth,
    image.naturalHeight,
    options.maxWidth,
    options.maxHeight
  );

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Your browser does not support Canvas.");
  }

  /*
   * JPEG/WebP images can have transparent backgrounds.
   * Fill with white before converting to JPEG.
   */
  if (options.outputType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(image, 0, 0, width, height);

  /*
   * PNG does not use JPEG-style quality in the browser.
   * For PNG we intentionally omit quality.
   */
  const quality =
    options.outputType === "image/png"
      ? undefined
      : Math.min(1, Math.max(0.05, options.quality ?? 0.8));

  return canvasToBlob(
    canvas,
    options.outputType ?? "image/jpeg",
    quality
  );
}

/**
 * Normal image compression.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  return renderImage(file, {
    outputType: options.outputType ?? "image/jpeg",
    quality: options.quality ?? 0.8,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
  });
}

/**
 * Compress an image to a target file size.
 *
 * Strategy:
 *
 * 1. Try different JPEG/WebP quality values.
 * 2. If still too large, reduce dimensions.
 * 3. Repeat.
 *
 * This gives much better results than simply passing maxSizeMB.
 */
export async function compressToTargetSize(
  file: File,
  options: TargetCompressionOptions
): Promise<Blob> {
  const targetBytes = Math.max(1, Math.round(options.targetKB * 1024));

  /*
   * PNG cannot reliably be reduced to an arbitrary target
   * size while remaining PNG using browser Canvas alone.
   *
   * Therefore, when the requested output is PNG, we first
   * try PNG encoding and return the smallest browser-generated
   * PNG. We don't falsely claim an exact target.
   */
  if (options.outputType === "image/png") {
    const blob = await renderImage(file, {
      outputType: "image/png",
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    });

    return blob;
  }

  const outputType = options.outputType ?? "image/jpeg";

  const image = await loadImage(file);

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  /*
   * Respect optional maximum dimensions.
   */
  const initial = calculateDimensions(
    width,
    height,
    options.maxWidth,
    options.maxHeight
  );

  width = initial.width;
  height = initial.height;

  /*
   * First pass: quality search.
   */
  let bestBlob: Blob | null = null;

  for (let i = 0; i < 10; i++) {
    let low = 0.05;
    let high = 0.95;

    let localBest: Blob | null = null;

    for (let iteration = 0; iteration < 8; iteration++) {
      const quality = (low + high) / 2;

      const blob = await renderImage(file, {
        outputType,
        quality,
        maxWidth: width,
        maxHeight: height,
      });

      /*
       * Keep the smallest result we've found.
       */
      if (!localBest || blob.size < localBest.size) {
        localBest = blob;
      }

      if (blob.size <= targetBytes) {
        /*
         * We reached the target.
         *
         * Try slightly higher quality to get the best possible
         * visual quality while remaining under the target.
         */
        low = quality;
      } else {
        high = quality;
      }
    }

    if (localBest) {
      bestBlob = localBest;

      if (localBest.size <= targetBytes) {
        /*
         * Final verification using a few nearby qualities.
         */
        let bestUnderTarget = localBest;

        for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
          const blob = await renderImage(file, {
            outputType,
            quality,
            maxWidth: width,
            maxHeight: height,
          });

          if (
            blob.size <= targetBytes &&
            blob.size > bestUnderTarget.size
          ) {
            bestUnderTarget = blob;
          }
        }

        return bestUnderTarget;
      }
    }

    /*
     * Quality alone couldn't reach the target.
     *
     * Reduce dimensions by roughly 15%.
     */
    width = Math.max(16, Math.floor(width * 0.85));
    height = Math.max(16, Math.floor(height * 0.85));

    /*
     * Stop if the image has become extremely small.
     */
    if (width <= 16 || height <= 16) {
      break;
    }
  }

  /*
   * If we couldn't reach the requested target, return the
   * smallest result we could produce.
   */
  if (bestBlob) {
    return bestBlob;
  }

  throw new Error(
    `Unable to compress this image to approximately ${options.targetKB}KB.`
  );
}

/**
 * Resize image to a specific width.
 */
export async function resizeByWidth(
  file: File,
  width: number,
  outputType:
    | "image/jpeg"
    | "image/png"
    | "image/webp" = "image/jpeg"
): Promise<Blob> {
  if (
    !Number.isFinite(width) ||
    width <= 0
  ) {
    throw new Error(
      "Width must be greater than 0."
    );
  }

  const image =
    await loadImage(file);

  const ratio =
    width / image.naturalWidth;

  const height = Math.max(
    1,
    Math.round(
      image.naturalHeight * ratio
    )
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = Math.round(width);
  canvas.height = height;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  if (
    outputType === "image/jpeg"
  ) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvasToBlob(
    canvas,
    outputType,
    0.92
  );
}

export async function resizeByHeight(
  file: File,
  height: number,
  outputType:
    | "image/jpeg"
    | "image/png"
    | "image/webp" = "image/jpeg"
): Promise<Blob> {
  if (
    !Number.isFinite(height) ||
    height <= 0
  ) {
    throw new Error(
      "Height must be greater than 0."
    );
  }

  const image =
    await loadImage(file);

  const ratio =
    height / image.naturalHeight;

  const width = Math.max(
    1,
    Math.round(
      image.naturalWidth * ratio
    )
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = Math.round(height);

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  if (
    outputType === "image/jpeg"
  ) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvasToBlob(
    canvas,
    outputType,
    0.92
  );
}
/**
 * Resize image by percentage.
 */
export async function resizeByPercentage(
  file: File,
  percentage: number,
  outputType?: "image/jpeg" | "image/png" | "image/webp"
): Promise<Blob> {
  if (!Number.isFinite(percentage) || percentage <= 0) {
    throw new Error("Percentage must be greater than 0.");
  }

  const image = await loadImage(file);

  const scale = percentage / 100;

  const width = Math.max(
    1,
    Math.round(image.naturalWidth * scale)
  );

  const height = Math.max(
    1,
    Math.round(image.naturalHeight * scale)
  );

  return renderImage(file, {
    outputType: outputType ?? "image/jpeg",
    quality: 0.9,
    maxWidth: width,
    maxHeight: height,
  });
}