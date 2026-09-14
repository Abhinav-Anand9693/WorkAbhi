import type { FFmpeg } from "@ffmpeg/ffmpeg";

export interface VideoProcessOptions {
  start?: number;
  end?: number;
  width?: number;
  height?: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  rotation?: 90 | 180 | 270;
  flip?: "horizontal" | "vertical";
  speed?: number;
  volume?: number;
  quality?: "high" | "medium" | "low";
  fps?: number;
  frameTime?: number;
  imageCount?: number;
}

export interface VideoOutput {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export interface ImageOutput {
  blob: Blob;
  filename: string;
}

export interface VideoMetadata {
  format?: {
    filename?: string;
    format_name?: string;
    duration?: string;
    size?: string;
    bit_rate?: string;
  };
  streams?: Array<{
    codec_name?: string;
    codec_type?: string;
    width?: number;
    height?: number;
    r_frame_rate?: string;
    duration?: string;
    sample_rate?: string;
    channels?: number;
    channel_layout?: string;
    bit_rate?: string;
  }>;
}

export interface VideoEngineCallbacks {
  /** FFmpeg-reported progress. null means progress is not reliable/available. */
  onProgress?: (progress: number | null) => void;
  /** Human-readable current processing stage. */
  onStatus?: (status: string) => void;
  /** Optional technical FFmpeg log hook for diagnostics. */
  onLog?: (message: string) => void;
  /** Abort the current operation without killing the shared engine. */
  signal?: AbortSignal;
}

export class VideoProcessingError extends Error {
  readonly code?: number;
  readonly technicalDetails?: string;

  constructor(
    message: string,
    options?: {
      code?: number;
      technicalDetails?: string;
    }
  ) {
    super(message);
    this.name = "VideoProcessingError";
    this.code = options?.code;
    this.technicalDetails = options?.technicalDetails;
  }
}

export const MAX_MERGE_FILES = 10;
export const MAX_MERGE_TOTAL_SIZE = 300 * 1024 * 1024;
export const MAX_EXTRACTED_FRAMES = 50;

const DESKTOP_MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;
const LOW_MEMORY_MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;
const VERY_LOW_MEMORY_MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

const EXEC_TIMEOUT = 10 * 60 * 1000;
const PROBE_TIMEOUT = 60 * 1000;

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let operationQueue: Promise<unknown> = Promise.resolve();

export function getMaxVideoFileSizeBytes(): number {
  if (typeof navigator === "undefined") {
    return DESKTOP_MAX_VIDEO_FILE_SIZE;
  }

  const deviceMemory = Number(
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  );

  if (Number.isFinite(deviceMemory)) {
    if (deviceMemory <= 2) return VERY_LOW_MEMORY_MAX_VIDEO_FILE_SIZE;
    if (deviceMemory <= 4) return LOW_MEMORY_MAX_VIDEO_FILE_SIZE;
  }

  return DESKTOP_MAX_VIDEO_FILE_SIZE;
}

export function getMaxVideoFileSizeMB(): number {
  return Math.round(getMaxVideoFileSizeBytes() / 1024 / 1024);
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    error instanceof Error && error.name === "AbortError"
  );
}

export function createAbortError(): DOMException {
  return new DOMException("Video processing was cancelled.", "AbortError");
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

export function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isFatalWasmError(error: unknown): boolean {
  const message = errorToString(error).toLowerCase();

  return (
    message.includes("memory access out of bounds") ||
    message.includes("out of memory") ||
    message.includes("cannot enlarge memory") ||
    message.includes("abort(oom)") ||
    message.includes("wasm trap") ||
    message.includes("unreachable")
  );
}

export function resetFFmpeg(): void {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate();
    } catch {
      // The worker may already be terminated.
    }
  }

  ffmpegInstance = null;
  loadingPromise = null;
}

export function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationQueue.then(operation, operation);

  operationQueue = next.then(
    () => undefined,
    () => undefined
  );

  return next;
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();

    try {
      /*
       * WorkAbhi currently uses @ffmpeg/core single-thread.
       * The single-thread core does NOT need workerURL.
       * workerURL is only required for the multi-thread core.
       */
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      try {
        ffmpeg.terminate();
      } catch {
        // Ignore cleanup errors.
      }

      throw error;
    }
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/** Warm the engine after the user selects a file, without blocking the UI. */
export function prepareVideoEngine(): Promise<FFmpeg> {
  return getFFmpeg();
}

export function getExtension(file: File): string {
  return (
    file.name.split(".").pop()?.toLowerCase() || "mp4"
  );
}

export function getMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "webm":
      return "video/webm";
    case "gif":
      return "image/gif";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "mp4":
    default:
      return "video/mp4";
  }
}

export function safeNumber(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function positiveInteger(
  value: unknown,
  fallback: number
): number {
  return Math.max(1, Math.floor(safeNumber(value, fallback)));
}

export function evenNumber(value: number): number {
  const safe = Math.max(2, Math.floor(value));
  return safe % 2 === 0 ? safe : safe - 1;
}

export function sanitizeBaseName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "");
  const cleaned = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 80) || "video";
}

export function validateFile(
  file: File,
  label = "Video"
): void {
  if (!file) {
    throw new VideoProcessingError(
      `Please select a ${label.toLowerCase()} file.`
    );
  }

  if (file.size <= 0) {
    throw new VideoProcessingError(`${label} file is empty.`);
  }

  const maxBytes = getMaxVideoFileSizeBytes();

  if (file.size > maxBytes) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const maxMB = Math.round(maxBytes / 1024 / 1024);

    throw new VideoProcessingError(
      `${label} is ${sizeMB} MB. For reliable browser processing on this device, please use a file smaller than ${maxMB} MB.`
    );
  }
}

export function validateMergeFiles(files: File[]): void {
  if (files.length < 2) {
    throw new VideoProcessingError("Please select at least 2 videos.");
  }

  if (files.length > MAX_MERGE_FILES) {
    throw new VideoProcessingError(
      `You can merge up to ${MAX_MERGE_FILES} videos at once.`
    );
  }

  let totalSize = 0;

  for (const file of files) {
    validateFile(file);
    totalSize += file.size;
  }

  if (totalSize > MAX_MERGE_TOTAL_SIZE) {
    throw new VideoProcessingError(
      "The combined size of the selected videos is too large for stable browser processing. Please select smaller videos."
    );
  }
}

export async function writeInput(
  ffmpeg: FFmpeg,
  file: File,
  name = "input",
  signal?: AbortSignal
): Promise<string> {
  validateFile(file);
  throwIfAborted(signal);

  const extension = getExtension(file);
  const filename = `${name}.${extension}`;
  const { fetchFile } = await import("@ffmpeg/util");

  throwIfAborted(signal);
  const data = await fetchFile(file);
  throwIfAborted(signal);

  await ffmpeg.writeFile(filename, data);
  return filename;
}

export async function readBlob(
  ffmpeg: FFmpeg,
  filename: string,
  mimeType: string
): Promise<Blob> {
  const data = (await ffmpeg.readFile(filename)) as Uint8Array;

  // Detach the returned FFmpeg data from the worker-side representation.
  const copy = new Uint8Array(data);

  return new Blob([copy.buffer], { type: mimeType });
}

export async function safeDelete(
  ffmpeg: FFmpeg,
  filename: string
): Promise<void> {
  try {
    await ffmpeg.deleteFile(filename);
  } catch {
    // The file may not exist or the worker may already be terminated.
  }
}

export async function safeDeleteMany(
  ffmpeg: FFmpeg,
  files: string[]
): Promise<void> {
  for (const file of files) {
    await safeDelete(ffmpeg, file);
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function userFacingFFmpegError(
  code: number,
  technicalDetails: string
): VideoProcessingError {
  const details = technicalDetails.trim();
  const lower = details.toLowerCase();

  let message =
    "The video could not be processed. Please check the file format and try again.";

  if (
    lower.includes("invalid data found") ||
    lower.includes("moov atom not found") ||
    lower.includes("could not find codec parameters")
  ) {
    message =
      "This video appears to be damaged or uses a format/codec that the browser engine cannot read.";
  } else if (
    lower.includes("encoder") &&
    lower.includes("not found")
  ) {
    message =
      "This conversion requires a codec that is not available in the current browser FFmpeg build.";
  } else if (code === 1) {
    message =
      "FFmpeg could not complete this operation. Try a smaller video or a different format.";
  }

  return new VideoProcessingError(message, {
    code,
    technicalDetails: details || `FFmpeg exited with code ${code}.`,
  });
}

export async function execFFmpeg(
  ffmpeg: FFmpeg,
  args: string[],
  callbacks: VideoEngineCallbacks = {},
  timeout = EXEC_TIMEOUT
): Promise<void> {
  throwIfAborted(callbacks.signal);

  const logs: string[] = [];

  const onLog = ({ message }: { message: string }) => {
    if (message) {
      logs.push(message);
      if (logs.length > 80) logs.shift();
      callbacks.onLog?.(message);
    }
  };

  const onProgress = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) {
      callbacks.onProgress?.(clampProgress(progress));
    }
  };

  ffmpeg.on("log", onLog);
  ffmpeg.on("progress", onProgress);
  callbacks.onProgress?.(null);

  try {
    callbacks.onStatus?.("Processing video…");

    const code = await ffmpeg.exec(
      args,
      timeout,
      callbacks.signal
        ? { signal: callbacks.signal }
        : undefined
    );

    if (callbacks.signal?.aborted) {
      throw createAbortError();
    }

    if (code !== 0) {
      throw userFacingFFmpegError(
        code,
        logs.slice(-20).join("\n")
      );
    }
  } catch (error) {
    if (callbacks.signal?.aborted || isAbortError(error)) {
      throw createAbortError();
    }

    if (error instanceof VideoProcessingError) {
      throw error;
    }

    const technicalDetails = logs.slice(-20).join("\n");

    throw new VideoProcessingError(
      "Video processing failed unexpectedly. Please try again with a smaller or different video.",
      { technicalDetails }
    );
  } finally {
    ffmpeg.off("log", onLog);
    ffmpeg.off("progress", onProgress);
  }
}

export async function execFFprobe(
  ffmpeg: FFmpeg,
  args: string[],
  signal?: AbortSignal
): Promise<void> {
  throwIfAborted(signal);

  const code = await ffmpeg.ffprobe(
    args,
    PROBE_TIMEOUT,
    signal ? { signal } : undefined
  );

  if (signal?.aborted) {
    throw createAbortError();
  }

  if (code !== 0) {
    throw new VideoProcessingError(
      "Unable to read video information. The file may be damaged or unsupported.",
      { code }
    );
  }
}
