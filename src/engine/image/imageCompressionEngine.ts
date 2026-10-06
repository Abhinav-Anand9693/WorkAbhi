export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

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
const MAX_WORKING_PIXELS = 16_000_000;
const MAX_CANVAS_DIMENSION = 32767;

interface ImageDimensions {
  width: number;
  height: number;
}

interface WorkerResponse {
  id: number;
  type: "progress" | "success" | "error";
  stage?: CompressionStage;
  blob?: Blob;
  width?: number;
  height?: number;
  error?: string;
}

let requestId = 0;
let worker: Worker | null = null;
let workerBroken = false;

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Processing cancelled.", "AbortError");
}

function clampQuality(value: number): number {
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, value));
}

function calculateDimensions(width: number, height: number, maxWidth?: number, maxHeight?: number): ImageDimensions {
  let scale = 1;
  if (maxWidth && width > maxWidth) scale = Math.min(scale, maxWidth / width);
  if (maxHeight && height > maxHeight) scale = Math.min(scale, maxHeight / height);

  let nextWidth = Math.max(1, Math.round(width * scale));
  let nextHeight = Math.max(1, Math.round(height * scale));

  if (nextWidth * nextHeight > MAX_WORKING_PIXELS) {
    const safetyScale = Math.sqrt(MAX_WORKING_PIXELS / (nextWidth * nextHeight));
    nextWidth = Math.max(1, Math.floor(nextWidth * safetyScale));
    nextHeight = Math.max(1, Math.floor(nextHeight * safetyScale));
  }

  return { width: nextWidth, height: nextHeight };
}

function assertDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) || !Number.isFinite(height) ||
    width < 1 || height < 1 ||
    width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error("The image dimensions are not supported by this browser.");
  }
}

function readU16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readU32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

async function inspectJpeg(file: Blob): Promise<ImageDimensions | null> {
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > bytes.length) break;

    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof && length >= 7) {
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += length;
  }
  return null;
}

async function inspectPng(file: Blob): Promise<ImageDimensions | null> {
  const bytes = new Uint8Array(await file.slice(0, 33).arrayBuffer());
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47
  ) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: readU32(view, 16, false), height: readU32(view, 20, false) };
}

async function inspectWebp(file: Blob): Promise<ImageDimensions | null> {
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (bytes.length < 30) return null;
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") return null;

  const chunk = ascii(12, 4);
  if (chunk === "VP8X") {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  if (chunk === "VP8 " && bytes.length >= 30) {
    const start = 20;
    if (bytes[start + 3] === 0x9d && bytes[start + 4] === 0x01 && bytes[start + 5] === 0x2a) {
      return {
        width: (bytes[start + 6] | (bytes[start + 7] << 8)) & 0x3fff,
        height: (bytes[start + 8] | (bytes[start + 9] << 8)) & 0x3fff,
      };
    }
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[21] === 0x2f) {
    const b0 = bytes[22];
    const b1 = bytes[23];
    const b2 = bytes[24];
    const b3 = bytes.length > 25 ? bytes[25] : 0;
    return {
      width: 1 + (b0 | ((b1 & 0x3f) << 8)),
      height: 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0xf) << 10)),
    };
  }
  return null;
}

async function inspectImageDimensions(file: Blob): Promise<ImageDimensions> {
  const type = file.type.toLowerCase();
  let dimensions: ImageDimensions | null = null;

  if (type === "image/jpeg" || type === "image/jpg") dimensions = await inspectJpeg(file);
  else if (type === "image/png") dimensions = await inspectPng(file);
  else if (type === "image/webp") dimensions = await inspectWebp(file);

  if (dimensions) {
    assertDimensions(dimensions.width, dimensions.height);
    return dimensions;
  }

  // Fallback only for formats whose container dimensions we cannot inspect cheaply.
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    try {
      assertDimensions(bitmap.width, bitmap.height);
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to decode image."));
      element.src = url;
    });
    assertDimensions(image.naturalWidth, image.naturalHeight);
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined" || workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../../workers/imageCompressionWorker.ts", import.meta.url), { type: "module" });
    return worker;
  } catch {
    workerBroken = true;
    worker = null;
    return null;
  }
}

async function runWorker(
  request: Omit<WorkerRequest, "id">,
  signal?: AbortSignal,
  onProgress?: (stage: CompressionStage) => void,
): Promise<Blob> {
  const instance = getWorker();
  if (!instance) throw new Error("WORKER_UNAVAILABLE");

  const id = ++requestId;
  return new Promise<Blob>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      instance.removeEventListener("message", handleMessage);
      instance.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const handleAbort = () => {
      instance.postMessage({ type: "cancel", id });
      fail(new DOMException("Processing cancelled.", "AbortError"));
    };

    const handleError = () => {
      workerBroken = true;
      fail(new Error("Image compression worker failed."));
    };

    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.id !== id) return;
      if (message.type === "progress") {
        onProgress?.(message.stage ?? "compressing");
        return;
      }
      if (message.type === "error") {
        fail(new Error(message.error ?? "Image compression failed."));
        return;
      }
      if (!message.blob) {
        fail(new Error("Image compression produced no output."));
        return;
      }
      settled = true;
      cleanup();
      resolve(message.blob);
    };

    instance.addEventListener("message", handleMessage);
    instance.addEventListener("error", handleError);
    signal?.addEventListener("abort", handleAbort, { once: true });

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    instance.postMessage({ ...request, id });
  });
}

type WorkerRequest = {
  id: number;
  file: Blob;
  outputType: OutputFormat;
  quality: number;
  targetBytes?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
};

async function renderMainThread(
  file: Blob,
  width: number,
  height: number,
  type: OutputFormat,
  quality: number,
  signal?: AbortSignal,
): Promise<Blob> {
  throwIfAborted(signal);
  assertDimensions(width, height);

  const bitmap = typeof createImageBitmap === "function"
    ? await createImageBitmap(file, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: "high",
        imageOrientation: "from-image",
      })
    : null;

  let image: HTMLImageElement | null = null;
  let source: CanvasImageSource;
  if (bitmap) source = bitmap;
  else {
    const url = URL.createObjectURL(file);
    try {
      image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Unable to decode image."));
        element.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    source = image;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap?.close();
    throw new Error("Canvas is not supported by this browser.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0, width, height);
  bitmap?.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to create image.")), type, type === "image/png" ? undefined : clampQuality(quality));
  });
  canvas.width = 1;
  canvas.height = 1;
  throwIfAborted(signal);
  return blob;
}

async function compressWithFallback(
  file: File | Blob,
  dimensions: ImageDimensions,
  options: CompressionOptions,
): Promise<Blob> {
  const outputType = options.outputType ?? options.outputFormat ?? "image/jpeg";
  const target = calculateDimensions(dimensions.width, dimensions.height, options.maxWidth, options.maxHeight);
  options.onProgress?.("optimizing-resolution");
  return renderMainThread(file, target.width, target.height, outputType, clampQuality(options.quality ?? 0.8), options.signal);
}

export async function compressImage(file: File | Blob, options: CompressionOptions = {}): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");
  throwIfAborted(options.signal);

  const outputType = options.outputType ?? options.outputFormat ?? "image/jpeg";
  const quality = clampQuality(options.quality ?? 0.8);
  options.onProgress?.("reading");
  const dimensions = await inspectImageDimensions(file);
  throwIfAborted(options.signal);

  try {
    return await runWorker(
      {
        file,
        outputType,
        quality,
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      },
      options.signal,
      options.onProgress,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof Error && error.message !== "WORKER_UNAVAILABLE") {
      // Worker failures are retried once on the main-thread fallback to preserve browser compatibility.
    }
    return compressWithFallback(file, dimensions, options);
  }
}

export async function compressToTargetSize(
  file: File | Blob,
  optionsOrTarget: TargetCompressionOptions | number,
  legacyOutputType: OutputFormat = "image/jpeg",
): Promise<Blob> {
  const options: TargetCompressionOptions = typeof optionsOrTarget === "number"
    ? { targetKB: optionsOrTarget, outputType: legacyOutputType }
    : optionsOrTarget;

  if (!Number.isFinite(options.targetKB) || options.targetKB <= 0) throw new Error("Target size must be greater than zero.");
  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");

  const targetBytes = Math.floor(options.targetKB * 1024);
  if (file.size <= targetBytes && (!options.outputType || options.outputType === file.type)) {
    options.onProgress?.("complete");
    return file;
  }

  const outputType = options.outputType ?? options.outputFormat ?? "image/jpeg";
  if (outputType === "image/png") {
    throw new Error("PNG target-size compression is not supported by the JPEG-style target algorithm. Choose JPEG target-size compression.");
  }

  options.onProgress?.("reading");
  const dimensions = await inspectImageDimensions(file);
  throwIfAborted(options.signal);

  try {
    const blob = await runWorker(
      {
        file,
        outputType,
        quality: MAX_QUALITY,
        targetBytes,
        width: dimensions.width,
        height: dimensions.height,
      },
      options.signal,
      options.onProgress,
    );
    options.onProgress?.("complete");
    return blob;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof Error && error.message !== "WORKER_UNAVAILABLE") throw error;

    // Compatibility fallback: still resize before decoding so large images do not
    // take the old full-resolution decode path.
    const maxDimension = options.targetKB <= 50 ? 1000 : options.targetKB <= 100 ? 1200 : options.targetKB <= 200 ? 1600 : options.targetKB <= 500 ? 2200 : 2800;
    let width = Math.min(dimensions.width, maxDimension);
    let height = Math.min(dimensions.height, Math.round(dimensions.height * (width / dimensions.width)));
    if (dimensions.height > dimensions.width) {
      height = Math.min(dimensions.height, maxDimension);
      width = Math.min(dimensions.width, Math.round(dimensions.width * (height / dimensions.height)));
    }

    let best: Blob | null = null;
    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      throwIfAborted(options.signal);
      options.onProgress?.("compressing");
      const quality = attempt === 0 ? MAX_QUALITY : (low + high) / 2;
      const blob = await renderMainThread(file, width, height, outputType, quality, options.signal);
      if (blob.size <= targetBytes) {
        best = blob;
        low = quality;
      } else {
        high = quality;
      }
    }
    if (best) {
      options.onProgress?.("complete");
      return best;
    }
    throw new Error(`Unable to reach ${options.targetKB} KB on this device. Try a larger target size.`);
  }
}

export async function resizeByWidth(file: File | Blob, width: number): Promise<Blob> {
  if (!Number.isFinite(width) || width <= 0) throw new Error("Width must be greater than zero.");
  const dimensions = await inspectImageDimensions(file);
  const height = Math.max(1, Math.round(dimensions.height * (width / dimensions.width)));
  return compressImage(file, { maxWidth: Math.round(width), maxHeight: height, quality: 0.9, outputType: "image/jpeg" });
}

export async function resizeByHeight(file: File | Blob, height: number): Promise<Blob> {
  if (!Number.isFinite(height) || height <= 0) throw new Error("Height must be greater than zero.");
  const dimensions = await inspectImageDimensions(file);
  const width = Math.max(1, Math.round(dimensions.width * (height / dimensions.height)));
  return compressImage(file, { maxWidth: width, maxHeight: Math.round(height), quality: 0.9, outputType: "image/jpeg" });
}

export async function resizeByPercentage(file: File | Blob, percentage: number): Promise<Blob> {
  if (!Number.isFinite(percentage) || percentage <= 0) throw new Error("Percentage must be greater than zero.");
  const dimensions = await inspectImageDimensions(file);
  return compressImage(file, {
    maxWidth: Math.max(1, Math.round(dimensions.width * percentage / 100)),
    maxHeight: Math.max(1, Math.round(dimensions.height * percentage / 100)),
    quality: 0.9,
    outputType: "image/jpeg",
  });
}
