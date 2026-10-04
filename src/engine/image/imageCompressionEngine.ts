"use client";

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

interface ImageDimensions {
  width: number;
  height: number;
}

interface WorkerSuccess {
  blob: Blob;
  width: number;
  height: number;
}

const MAX_QUALITY = 0.95;
const MIN_QUALITY = 0.04;
const QUALITY_ATTEMPTS = 8;
const HEADER_READ_BYTES = 512 * 1024;
const MAX_CANVAS_DIMENSION = 32767;
const MIN_TARGET_PIXELS = 300_000;
const TARGET_RESOLUTION_RETRY_FACTOR = 0.64;
const MAX_TARGET_RESOLUTION_ATTEMPTS = 5;

let workerInstance: Worker | null = null;
let workerSequence = 0;

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Processing cancelled.", "AbortError");
  }
}

function yieldToBrowser(signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

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

function clampQuality(value: number | undefined): number {
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, value ?? 0.8));
}

function getOutputType(options: CompressionOptions): OutputFormat {
  return options.outputType ?? options.outputFormat ?? "image/jpeg";
}

function getTargetOutputType(options: TargetCompressionOptions): OutputFormat {
  return options.outputType ?? options.outputFormat ?? "image/jpeg";
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
): ImageDimensions {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Unable to determine valid image dimensions.");
  }

  let scale = 1;

  if (maxWidth && width > maxWidth) scale = Math.min(scale, maxWidth / width);
  if (maxHeight && height > maxHeight) scale = Math.min(scale, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function assertCanvasDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `This browser cannot safely create a ${Math.round(width)}×${Math.round(height)} output canvas. The image was not resized.`
    );
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: OutputFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create the compressed image."));
          return;
        }
        resolve(blob);
      },
      type,
      type === "image/png" ? undefined : quality
    );
  });
}

function readUint32BE(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

async function readHeaderDimensions(file: Blob): Promise<ImageDimensions | null> {
  const buffer = await file
    .slice(0, Math.min(file.size, HEADER_READ_BYTES))
    .arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return {
      width: readUint32BE(view, 16),
      height: readUint32BE(view, 20),
    };
  }

  if (
    bytes.length >= 10 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 &&
    bytes[2] === 0x46 && bytes[3] === 0x38
  ) {
    return {
      width: view.getUint16(6, true),
      height: view.getUint16(8, true),
    };
  }

  if (bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return {
      width: Math.abs(view.getInt32(18, true)),
      height: Math.abs(view.getInt32(22, true)),
    };
  }

  if (
    bytes.length >= 16 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 &&
    bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 &&
    bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      };
    }

    if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const b0 = bytes[21];
      const b1 = bytes[22];
      const b2 = bytes[23];
      const b3 = bytes[24];
      return {
        width: 1 + (b0 | ((b1 & 0x3f) << 8)),
        height: 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)),
      };
    }

    if (chunk === "VP8 ") {
      for (let i = 20; i + 9 < bytes.length; i += 1) {
        if (bytes[i] === 0x9d && bytes[i + 1] === 0x01 && bytes[i + 2] === 0x2a) {
          return {
            width: (view.getUint16(i + 3, false) & 0x3fff),
            height: (view.getUint16(i + 5, false) & 0x3fff),
          };
        }
      }
    }
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;

    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) break;

      const marker = bytes[offset++];
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda) break;
      if (offset + 1 >= bytes.length) break;

      const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSof && segmentLength >= 7) {
        return {
          height: (bytes[offset + 3] << 8) | bytes[offset + 4],
          width: (bytes[offset + 5] << 8) | bytes[offset + 6],
        };
      }

      offset += segmentLength;
    }
  }

  return null;
}

function readJpegExifOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;

  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    if (
      marker === 0xe1 &&
      segmentLength >= 10 &&
      bytes[offset + 2] === 0x45 && bytes[offset + 3] === 0x78 &&
      bytes[offset + 4] === 0x69 && bytes[offset + 5] === 0x66 &&
      bytes[offset + 6] === 0x00 && bytes[offset + 7] === 0x00
    ) {
      const tiff = offset + 8;
      if (tiff + 8 > bytes.length) return 1;

      const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
      const big = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
      if (!little && !big) return 1;

      const read16 = (at: number) => little
        ? bytes[at] | (bytes[at + 1] << 8)
        : (bytes[at] << 8) | bytes[at + 1];

      const read32 = (at: number) => little
        ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
        : (((bytes[at] << 24) >>> 0) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;

      if (read16(tiff + 2) !== 42) return 1;
      const ifd = tiff + read32(tiff + 4);
      if (ifd + 2 > bytes.length) return 1;

      const count = read16(ifd);
      for (let i = 0; i < count; i += 1) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > bytes.length) break;
        if (read16(entry) !== 0x0112) continue;
        if (read16(entry + 2) !== 3) return 1;
        const value = read16(entry + 8);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }

    offset += segmentLength;
  }

  return 1;
}

async function getImageDimensions(file: Blob, signal?: AbortSignal): Promise<ImageDimensions> {
  throwIfAborted(signal);

  const header = await readHeaderDimensions(file);
  if (header && header.width > 0 && header.height > 0) {
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      const buffer = await file.slice(0, Math.min(file.size, HEADER_READ_BYTES)).arrayBuffer();
      const orientation = readJpegExifOrientation(new Uint8Array(buffer));
      return orientation >= 5 && orientation <= 8
        ? { width: header.height, height: header.width }
        : header;
    }
    return header;
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

function canUseWorker(): boolean {
  // The codec worker has a WASM path that does not depend on OffscreenCanvas
  // or createImageBitmap. Requiring graphics APIs here was the reason Samsung
  // devices were incorrectly pushed onto the failing canvas fallback.
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../../workers/imageCompressionWorker.ts", import.meta.url),
      { type: "module" }
    );
  }
  return workerInstance;
}

async function runWorkerCompression(
  file: Blob,
  options: {
    outputType: OutputFormat;
    quality: number;
    targetBytes?: number;
    expected: ImageDimensions;
    resize?: ImageDimensions;
    signal?: AbortSignal;
    onProgress?: (stage: CompressionStage) => void;
  }
): Promise<WorkerSuccess> {
  const worker = getWorker();
  const id = ++workerSequence;

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      options.signal?.removeEventListener("abort", onAbort);
    };

    const finishError = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const finishSuccess = (result: WorkerSuccess) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      const message = event.data as {
        id: number;
        type: string;
        stage?: CompressionStage;
        blob?: Blob;
        width?: number;
        height?: number;
        error?: string;
      };

      if (message.id !== id) return;

      if (message.type === "progress" && message.stage) {
        options.onProgress?.(message.stage);
        return;
      }

      if (message.type === "error") {
        finishError(new Error(message.error ?? "Image compression failed."));
        return;
      }

      if (message.type === "success" && message.blob && message.width && message.height) {
        if (message.width !== options.expected.width || message.height !== options.expected.height) {
          finishError(
            new Error(
              `Compression returned ${message.width}×${message.height} instead of ${options.expected.width}×${options.expected.height}. The result was rejected.`
            )
          );
          return;
        }
        finishSuccess({
          blob: message.blob,
          width: message.width,
          height: message.height,
        });
      }
    };

    const onError = () => {
      if (workerInstance === worker) {
        workerInstance.terminate();
        workerInstance = null;
      }
      finishError(new Error("The image worker could not process this image on this device."));
    };

    const onAbort = () => {
      try {
        worker.postMessage({ type: "cancel", id });
      } catch {
        // Worker may already have failed.
      }
      finishError(new DOMException("Processing cancelled.", "AbortError"));
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    options.signal?.addEventListener("abort", onAbort, { once: true });

    worker.postMessage({
      id,
      file,
      outputType: options.outputType,
      quality: options.quality,
      targetBytes: options.targetBytes,
      expectedWidth: options.expected.width,
      expectedHeight: options.expected.height,
      resizeWidth: options.resize?.width,
      resizeHeight: options.resize?.height,
    });
  });
}

async function renderOnMainThread(
  file: Blob,
  dimensions: ImageDimensions,
  outputType: OutputFormat,
  quality: number,
  signal?: AbortSignal,
  allowResize = false
): Promise<Blob> {
  assertCanvasDimensions(dimensions.width, dimensions.height);
  throwIfAborted(signal);

  const bitmap = await createImageBitmap(file, {
    ...(allowResize
      ? {
          resizeWidth: dimensions.width,
          resizeHeight: dimensions.height,
          resizeQuality: "high" as const,
        }
      : {}),
    imageOrientation: "from-image",
  });

  try {
    if (
      !allowResize &&
      (bitmap.width !== dimensions.width || bitmap.height !== dimensions.height)
    ) {
      throw new Error(
        `The browser decoded this image as ${bitmap.width}×${bitmap.height} instead of ${dimensions.width}×${dimensions.height}. The result was rejected.`
      );
    }

    const canvas = document.createElement("canvas");
    try {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
        throw new Error("This device cannot allocate the requested image buffer safely.");
      }

      const context = canvas.getContext("2d", {
        alpha: outputType !== "image/jpeg",
      });
      if (!context) throw new Error("Canvas 2D is not available on this device.");

      if (outputType === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
      throwIfAborted(signal);
      return await canvasToBlob(canvas, outputType, quality);
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    bitmap.close();
  }
}

async function compressWithFallback(
  file: Blob,
  options: {
    outputType: OutputFormat;
    quality: number;
    targetBytes?: number;
    expected: ImageDimensions;
    signal?: AbortSignal;
    onProgress?: (stage: CompressionStage) => void;
  }
): Promise<Blob> {
  if (canUseWorker()) {
    try {
      const workerResult = await runWorkerCompression(file, options);
      return workerResult.blob;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;

      // Worker failure is not permission to resize or corrupt the image.
      // Fall back only when the browser does not actually support the worker path.
      const workerLikelyUnsupported =
        /worker|OffscreenCanvas|module|could not process/i.test(
          error instanceof Error ? error.message : ""
        );

      if (!workerLikelyUnsupported) throw error;
    }
  }

  options.onProgress?.("reading");
  options.onProgress?.("compressing");
  const blob = await renderOnMainThread(
    file,
    options.expected,
    options.outputType,
    options.quality,
    options.signal
  );
  options.onProgress?.("finalizing");
  return blob;
}

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const outputType = getOutputType(options);
  const quality = clampQuality(options.quality);

  options.onProgress?.("reading");
  const original = await getImageDimensions(file, options.signal);
  const dimensions = calculateDimensions(
    original.width,
    original.height,
    options.maxWidth,
    options.maxHeight
  );

  if (dimensions.width !== original.width || dimensions.height !== original.height) {
    // Explicit resize callers are preserved for the existing resize tools.
    options.onProgress?.("optimizing-resolution");
    const resized = await renderOnMainThread(
      file,
      dimensions,
      outputType,
      quality,
      options.signal,
      true
    );
    options.onProgress?.("complete");
    return resized;
  }

  options.onProgress?.("compressing");
  const output = await compressWithFallback(file, {
    outputType,
    quality,
    expected: original,
    signal: options.signal,
    onProgress: options.onProgress,
  });

  // Never turn a compression operation into a larger file when the requested
  // output format is already the source format. Returning the original is a
  // safe no-op and preserves its exact pixels and dimensions.
  const finalOutput =
    file.type.toLowerCase() === outputType && output.size >= file.size
      ? file
      : output;

  const resultDimensions = await getImageDimensions(finalOutput, options.signal);
  if (resultDimensions.width !== original.width || resultDimensions.height !== original.height) {
    throw new Error(
      `Compression produced ${resultDimensions.width}×${resultDimensions.height} instead of ${original.width}×${original.height}. The result was rejected.`
    );
  }

  options.onProgress?.("complete");
  return finalOutput;
}

interface TargetResolutionPlan {
  width: number;
  height: number;
  changed: boolean;
}

/**
 * Very large source images are the one case where a target-size compressor
 * should not insist on decoding the full-resolution bitmap on the client.
 *
 * A 64 MP JPEG needs roughly 256 MB for one RGBA frame before the browser's
 * canvas/encoder overhead is counted. On mobile WebViews that can fail even
 * when the original JPEG file is only 20–30 MB.
 *
 * Target-size tools have a legitimate resolution budget: a 50 KB JPEG cannot
 * retain useful 64 MP detail anyway. We therefore choose a conservative,
 * target-driven pixel budget and ask createImageBitmap() to decode directly at
 * that size. This is an explicit resolution optimization, never a silent
 * distortion: aspect ratio is preserved and the caller is told through the
 * `optimizing-resolution` progress stage.
 */
function calculateTargetResolution(
  original: ImageDimensions,
  targetBytes: number
): TargetResolutionPlan {
  const sourcePixels = original.width * original.height;

  // A target-size JPEG typically needs a fraction of a byte per output pixel
  // at the lower quality range. Use 0.25 bytes/pixel as a conservative
  // planning heuristic, then let the quality search decide the final encode.
  // This keeps 50 KB jobs around 0.5 MP while allowing a 1 MB job several MP
  // of detail without ever asking a mobile browser to render the full source.
  const derivedPixels = targetBytes / 0.25;
  const minPixels = MIN_TARGET_PIXELS;
  const maxPixels = 12_000_000;
  const targetPixels = Math.min(
    sourcePixels,
    Math.max(minPixels, Math.min(maxPixels, derivedPixels))
  );

  if (sourcePixels <= targetPixels) {
    return {
      width: original.width,
      height: original.height,
      changed: false,
    };
  }

  const scale = Math.sqrt(targetPixels / sourcePixels);
  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
    changed: true,
  };
}

async function renderTargetOnMainThread(
  file: Blob,
  dimensions: ImageDimensions,
  outputType: OutputFormat,
  targetBytes: number,
  signal?: AbortSignal,
  onProgress?: (stage: CompressionStage) => void
): Promise<Blob> {
  throwIfAborted(signal);
  assertCanvasDimensions(dimensions.width, dimensions.height);
  onProgress?.("optimizing-resolution");

  const bitmap = await createImageBitmap(file, {
    resizeWidth: dimensions.width,
    resizeHeight: dimensions.height,
    resizeQuality: "high",
    imageOrientation: "from-image",
  });

  try {
    throwIfAborted(signal);

    if (bitmap.width !== dimensions.width || bitmap.height !== dimensions.height) {
      throw new Error(
        `The browser decoded the optimized image as ${bitmap.width}×${bitmap.height} instead of ${dimensions.width}×${dimensions.height}.`
      );
    }

    const canvas = document.createElement("canvas");
    try {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas 2D is not available on this device.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, dimensions.width, dimensions.height);
      context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

      let low = MIN_QUALITY;
      let high = MAX_QUALITY;
      let best: Blob | null = null;

      for (let attempt = 0; attempt < QUALITY_ATTEMPTS; attempt += 1) {
        throwIfAborted(signal);
        onProgress?.("compressing");
        const quality = attempt === 0 ? MAX_QUALITY : (low + high) / 2;
        const blob = await canvasToBlob(canvas, outputType, quality);

        if (blob.size <= targetBytes) {
          best = blob;
          low = quality;
        } else {
          high = quality;
        }
      }

      if (!best) {
        throw new Error(
          `Unable to reach ${Math.round(targetBytes / 1024)} KB even after optimizing resolution to ${dimensions.width}×${dimensions.height}.`
        );
      }

      return best;
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    bitmap.close();
  }
}


function isRecoverableTargetSizeFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unable to reach|could not process this image|cannot allocate|memory|out of memory|offscreen/i.test(
    message
  );
}

function reduceTargetResolution(plan: TargetResolutionPlan): TargetResolutionPlan {
  const pixels = plan.width * plan.height;
  const nextPixels = Math.max(MIN_TARGET_PIXELS, Math.floor(pixels * TARGET_RESOLUTION_RETRY_FACTOR));
  const scale = Math.sqrt(nextPixels / pixels);

  return {
    width: Math.max(1, Math.round(plan.width * scale)),
    height: Math.max(1, Math.round(plan.height * scale)),
    changed: true,
  };
}

export async function compressToTargetSize(
  file: File | Blob,
  optionsOrTarget: TargetCompressionOptions | number,
  legacyOutputType: OutputFormat = "image/jpeg"
): Promise<Blob> {
  const options: TargetCompressionOptions =
    typeof optionsOrTarget === "number"
      ? { targetKB: optionsOrTarget, outputType: legacyOutputType }
      : optionsOrTarget;

  if (!Number.isFinite(options.targetKB) || options.targetKB <= 0) {
    throw new Error("Target size must be greater than zero.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const outputType = getTargetOutputType(options);
  if (outputType === "image/png") {
    throw new Error("Target-size compression is available in JPEG output only. Use PNG Compressor for PNG files.");
  }

  const targetBytes = Math.floor(options.targetKB * 1024);
  options.onProgress?.("reading");
  const original = await getImageDimensions(file, options.signal);

  if (file.size <= targetBytes && file.type.toLowerCase() === outputType) {
    options.onProgress?.("complete");
    return file;
  }

  const resolution = calculateTargetResolution(original, targetBytes);

  // Normal-sized images keep their original dimensions and use the fast
  // worker-first path. Huge images take the target-size mobile path, which
  // decodes directly at the planned output resolution instead of allocating a
  // full-resolution 64 MP bitmap on Android.
  let output: Blob | undefined;

  let finalResolution = resolution;

  if (!resolution.changed) {
    output = await compressWithFallback(file, {
      outputType,
      quality: MAX_QUALITY,
      targetBytes,
      expected: original,
      signal: options.signal,
      onProgress: options.onProgress,
    });
  } else {
    // Worker-first low-memory path: createImageBitmap() is asked to decode
    // directly at the reduced resolution, so WorkAbhi does not intentionally
    // allocate a full-resolution 64 MP OffscreenCanvas on mobile. If the
    // browser still rejects the allocation or the target cannot be reached at
    // the first plan, progressively reduce the working resolution.
    let completed = false;

    for (let attempt = 0; attempt < MAX_TARGET_RESOLUTION_ATTEMPTS; attempt += 1) {
      throwIfAborted(options.signal);

      try {
        if (!canUseWorker()) throw new Error("Worker image processing is unavailable.");

        const workerResult = await runWorkerCompression(file, {
          outputType,
          quality: MAX_QUALITY,
          targetBytes,
          expected: finalResolution,
          resize: finalResolution,
          signal: options.signal,
          onProgress: options.onProgress,
        });
        output = workerResult.blob;
        completed = true;
        break;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;

        if (isRecoverableTargetSizeFailure(error)) {
          const next = reduceTargetResolution(finalResolution);
          const nextPixels = next.width * next.height;
          const currentPixels = finalResolution.width * finalResolution.height;

          if (nextPixels < currentPixels) {
            finalResolution = next;
            options.onProgress?.("optimizing-resolution");
            continue;
          }
        }

        const workerUnavailable = /worker|offscreen|module|unavailable/i.test(
          error instanceof Error ? error.message : ""
        );
        if (!workerUnavailable) throw error;

        output = await renderTargetOnMainThread(
          file,
          finalResolution,
          outputType,
          targetBytes,
          options.signal,
          options.onProgress
        );
        completed = true;
        break;
      }
    }

    if (!completed) {
      throw new Error(
        `This device could not create a small enough working image for the ${options.targetKB} KB target. Try a larger target size.`
      );
    }
  }

  if (!output) {
    throw new Error("Image compression did not produce an output file.");
  }

  const resultDimensions = await getImageDimensions(output, options.signal);

  if (resolution.changed) {
    if (
      resultDimensions.width !== finalResolution.width ||
      resultDimensions.height !== finalResolution.height
    ) {
      throw new Error(
        `Target compression produced ${resultDimensions.width}×${resultDimensions.height} instead of the planned ${finalResolution.width}×${finalResolution.height}. The result was rejected.`
      );
    }
  } else if (
    resultDimensions.width !== original.width ||
    resultDimensions.height !== original.height
  ) {
    throw new Error(
      `Target compression produced ${resultDimensions.width}×${resultDimensions.height} instead of ${original.width}×${original.height}. The result was rejected.`
    );
  }

  if (output.size > targetBytes) {
    throw new Error(
      `Unable to reach ${options.targetKB} KB at ${resultDimensions.width}×${resultDimensions.height}. Try a larger target size.`
    );
  }

  options.onProgress?.("complete");
  return output;
}

export async function createImagePreviewURL(
  file: File | Blob,
  signal?: AbortSignal,
  maxDimension = 1600
): Promise<string> {
  throwIfAborted(signal);
  const dimensions = await getImageDimensions(file, signal);
  const scale = Math.min(1, maxDimension / Math.max(dimensions.width, dimensions.height));
  const width = Math.max(1, Math.round(dimensions.width * scale));
  const height = Math.max(1, Math.round(dimensions.height * scale));

  const bitmap = await createImageBitmap(file, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
    imageOrientation: "from-image",
  });

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not available.");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
    return URL.createObjectURL(blob);
  } finally {
    bitmap.close();
  }
}

async function resizeWithCanvas(
  file: File | Blob,
  width: number,
  height: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
    imageOrientation: "from-image",
  });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not available.");
    context.drawImage(bitmap, 0, 0, width, height);
    return canvasToBlob(canvas, "image/jpeg", 0.9);
  } finally {
    bitmap.close();
  }
}

export async function resizeByWidth(file: File | Blob, width: number): Promise<Blob> {
  if (!Number.isFinite(width) || width <= 0) throw new Error("Width must be greater than zero.");
  const original = await getImageDimensions(file);
  const height = Math.max(1, Math.round(original.height * (width / original.width)));
  return resizeWithCanvas(file, Math.round(width), height);
}

export async function resizeByHeight(file: File | Blob, height: number): Promise<Blob> {
  if (!Number.isFinite(height) || height <= 0) throw new Error("Height must be greater than zero.");
  const original = await getImageDimensions(file);
  const width = Math.max(1, Math.round(original.width * (height / original.height)));
  return resizeWithCanvas(file, width, Math.round(height));
}

export async function resizeByPercentage(file: File | Blob, percentage: number): Promise<Blob> {
  if (!Number.isFinite(percentage) || percentage <= 0) throw new Error("Percentage must be greater than zero.");
  const original = await getImageDimensions(file);
  const width = Math.max(1, Math.round(original.width * percentage / 100));
  const height = Math.max(1, Math.round(original.height * percentage / 100));
  return resizeWithCanvas(file, width, height);
}
