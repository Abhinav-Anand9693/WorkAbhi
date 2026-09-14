import type { FFmpeg } from "@ffmpeg/ffmpeg";

/* =========================================================
   TYPES
========================================================= */

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

  /** Optional UI progress callback for long-running operations. */
  onProgress?: (progress: number) => void;

  /** Abort/cancel the current operation. */
  signal?: AbortSignal;
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
  }>;
}

/* =========================================================
   CONSTANTS
========================================================= */

/*
 * Browser/WASM video processing is memory intensive.
 *
 * This is a safety limit, not an FFmpeg hard limit.
 * The purpose is to prevent the browser tab from becoming
 * unstable when a huge video is selected.
 */
const MAX_VIDEO_FILE_SIZE =
  200 * 1024 * 1024; // 200 MB

const MAX_MERGE_FILES = 10;

const MAX_MERGE_TOTAL_SIZE =
  300 * 1024 * 1024; // 300 MB

const MAX_EXTRACTED_FRAMES = 50;

const EXEC_TIMEOUT =
  10 * 60 * 1000; // 10 minutes

const METADATA_TIMEOUT =
  15 * 1000; // browser metadata timeout

/* =========================================================
   FFmpeg SINGLETON
========================================================= */

let ffmpegInstance: FFmpeg | null = null;

let loadingPromise: Promise<FFmpeg> | null = null;

/*
 * FFmpeg's WASM runtime should not receive multiple commands
 * simultaneously.
 *
 * Every public engine operation goes through this queue.
 */
let operationQueue: Promise<unknown> =
  Promise.resolve();

/* Only one public operation runs at a time, so one shared progress
 * callback is sufficient and avoids wiring a callback through every
 * individual FFmpeg command. */
let activeProgressCallback: ((progress: number) => void) | null = null;
let activeAbortController: AbortController | null = null;
let activeSignal: AbortSignal | undefined;

/* =========================================================
   OPERATION QUEUE
========================================================= */

function runExclusive<T>(
  operation: () => Promise<T>
): Promise<T> {
  const next = operationQueue.then(
    operation,
    operation
  );

  operationQueue = next.then(
    () => undefined,
    () => undefined
  );

  return next;
}

/* =========================================================
   FFmpeg RESET
========================================================= */

/**
 * Completely destroys the current FFmpeg worker.
 *
 * Important:
 * After terminate(), FFmpeg must be loaded again.
 */
export function resetFFmpeg(): void {
  const current = ffmpegInstance;
  ffmpegInstance = null;
  loadingPromise = null;

  if (current) {
    try {
      current.terminate();
    } catch {
      // Worker may already be dead.
    }
  }

}

/** Cancel the active video operation and destroy the WASM runtime. */
export function cancelVideoProcessing(): void {
  activeAbortController?.abort();
  resetFFmpeg();
}

function throwIfAborted(): void {
  if (activeSignal?.aborted) {
    throw new DOMException("Video processing was cancelled.", "AbortError");
  }
}

/* =========================================================
   ERROR HELPERS
========================================================= */

function errorToString(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isFatalWasmError(
  error: unknown
): boolean {
  const message =
    errorToString(error).toLowerCase();

  return (
    message.includes(
      "memory access out of bounds"
    ) ||
    message.includes(
      "out of memory"
    ) ||
    message.includes(
      "cannot enlarge memory"
    ) ||
    message.includes(
      "abort(oom)"
    ) ||
    message.includes(
      "wasm trap"
    ) ||
    message.includes(
      "unreachable"
    )
  );
}

function createUserError(
  message: string
): Error {
  return new Error(message);
}

/* =========================================================
   FFmpeg LOADER
========================================================= */

async function getFFmpeg(): Promise<FFmpeg> {
  if (
    ffmpegInstance &&
    ffmpegInstance.loaded
  ) {
    return ffmpegInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise =
    (async () => {
      const {
        FFmpeg,
      } = await import(
        "@ffmpeg/ffmpeg"
      );

      const ffmpeg =
        new FFmpeg();

      try {
        await ffmpeg.load({
          coreURL:
            "/ffmpeg/ffmpeg-core.js",

          wasmURL:
            "/ffmpeg/ffmpeg-core.wasm",
        });

        ffmpegInstance =
          ffmpeg;

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

/* =========================================================
   FILE HELPERS
========================================================= */

function getExtension(
  file: File
): string {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  return extension || "mp4";
}

function getMimeType(
  extension: string
): string {
  switch (
    extension.toLowerCase()
  ) {
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

function validateFile(
  file: File,
  label = "Video"
): void {
  if (!file) {
    throw createUserError(
      `Please select a ${label.toLowerCase()} file.`
    );
  }

  if (file.size <= 0) {
    throw createUserError(
      `${label} file is empty.`
    );
  }

  if (
    file.size >
    MAX_VIDEO_FILE_SIZE
  ) {
    const sizeMB =
      (
        file.size /
        1024 /
        1024
      ).toFixed(1);

    throw createUserError(
      `${label} is ${sizeMB} MB. For reliable browser processing, please use a file smaller than 200 MB.`
    );
  }
}

function validateMergeFiles(
  files: File[]
): void {
  if (files.length < 2) {
    throw createUserError(
      "Please select at least 2 videos."
    );
  }

  if (
    files.length >
    MAX_MERGE_FILES
  ) {
    throw createUserError(
      `You can merge up to ${MAX_MERGE_FILES} videos at once.`
    );
  }

  let totalSize = 0;

  for (const file of files) {
    validateFile(file);
    totalSize += file.size;
  }

  if (
    totalSize >
    MAX_MERGE_TOTAL_SIZE
  ) {
    throw createUserError(
      "The combined size of the selected videos is too large for stable browser processing. Please select smaller videos."
    );
  }
}

/* =========================================================
   NUMBER HELPERS
========================================================= */

function safeNumber(
  value: unknown,
  fallback: number
): number {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}

function positiveInteger(
  value: unknown,
  fallback: number
): number {
  return Math.max(
    1,
    Math.floor(
      safeNumber(
        value,
        fallback
      )
    )
  );
}

function evenNumber(
  value: number
): number {
  const safe =
    Math.max(
      2,
      Math.floor(value)
    );

  return safe % 2 === 0
    ? safe
    : safe - 1;
}

/* =========================================================
   QUALITY
========================================================= */

function qualityArgs(
  quality:
    VideoProcessOptions["quality"]
): string[] {
  switch (quality) {
    case "high":
      return [
        "-crf",
        "18",
      ];

    case "low":
      return [
        "-crf",
        "30",
      ];

    case "medium":
    default:
      return [
        "-crf",
        "23",
      ];
  }
}

/* =========================================================
   AUDIO SPEED
========================================================= */

function atempoFilters(
  speed: number
): string {
  const safeSpeed =
    Math.max(
      0.25,
      Math.min(
        4,
        speed
      )
    );

  let remaining =
    safeSpeed;

  const filters: string[] =
    [];

  while (
    remaining > 2
  ) {
    filters.push(
      "atempo=2"
    );

    remaining /= 2;
  }

  while (
    remaining < 0.5
  ) {
    filters.push(
      "atempo=0.5"
    );

    remaining /= 0.5;
  }

  filters.push(
    `atempo=${remaining.toFixed(
      4
    )}`
  );

  return filters.join(",");
}

/* =========================================================
   FFmpeg COMMAND HELPERS
========================================================= */

async function execFFmpeg(
  ffmpeg: FFmpeg,
  args: string[],
  timeout = EXEC_TIMEOUT
): Promise<void> {
  throwIfAborted();

  const onProgress = ({ progress }: { progress: number }) => {
    if (activeProgressCallback) {
      const percent = Math.round(
        Math.max(0, Math.min(1, progress)) * 100
      );
      activeProgressCallback(percent);
    }
  };

  ffmpeg.on("progress", onProgress);

  try {
    const code = await ffmpeg.exec(
      args,
      timeout,
      { signal: activeSignal }
    );

    throwIfAborted();

    if (code !== 0) {
      throw createUserError(
        `FFmpeg processing failed (code ${code}).`
      );
    }
  } catch (error) {
    if (activeSignal?.aborted) {
      throw new DOMException(
        "Video processing was cancelled.",
        "AbortError"
      );
    }
    throw error;
  } finally {
    ffmpeg.off("progress", onProgress);
  }
}

/* =========================================================
   INPUT / OUTPUT FILE HELPERS
========================================================= */

async function writeInput(
  ffmpeg: FFmpeg,
  file: File,
  name = "input"
): Promise<string> {
  validateFile(file);

  const extension =
    getExtension(file);

  const filename =
    `${name}.${extension}`;

  const {
    fetchFile,
  } = await import(
    "@ffmpeg/util"
  );

  const data =
    await fetchFile(file);

  await ffmpeg.writeFile(
    filename,
    data
  );

  return filename;
}

async function readBlob(
  ffmpeg: FFmpeg,
  filename: string,
  mimeType: string
): Promise<Blob> {
  const data =
    (await ffmpeg.readFile(
      filename
    )) as Uint8Array;

  /*
   * Create a standalone ArrayBuffer.
   *
   * This avoids accidentally retaining a larger
   * WASM-backed buffer.
   */
  const copy =
    new Uint8Array(data);

  return new Blob(
    [copy.buffer],
    {
      type: mimeType,
    }
  );
}

async function safeDelete(
  ffmpeg: FFmpeg,
  filename: string
): Promise<void> {
  try {
    await ffmpeg.deleteFile(
      filename
    );
  } catch {
    // File may not exist.
  }
}

async function safeDeleteMany(
  ffmpeg: FFmpeg,
  files: string[]
): Promise<void> {
  for (const file of files) {
    await safeDelete(
      ffmpeg,
      file
    );
  }
}

/* =========================================================
   METADATA HELPERS
========================================================= */

interface BrowserVideoInfo {
  duration: number;
  width: number;
  height: number;
}

function getVideoStream(
  metadata: VideoMetadata
) {
  return metadata.streams?.find(
    (stream) =>
      stream.codec_type ===
      "video"
  );
}

async function getBrowserVideoInfo(
  file: File
): Promise<BrowserVideoInfo> {
  throwIfAborted();

  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw createUserError(
      "Video metadata is not available in this browser context."
    );
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = false;
  video.playsInline = true;

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      finishReject(new Error("The browser could not read the video's metadata."));
    }, METADATA_TIMEOUT);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      activeSignal?.removeEventListener("abort", onAbort);
    };

    const finishResolve = (value: BrowserVideoInfo) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const onLoadedMetadata = () => {
      const duration = Number(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!Number.isFinite(duration) || duration <= 0 || width <= 0 || height <= 0) {
        finishReject(new Error("The browser returned incomplete video metadata."));
        return;
      }

      finishResolve({ duration, width, height });
    };

    const onError = () => {
      finishReject(new Error("The browser could not decode this video's metadata."));
    };

    const onAbort = () => {
      finishReject(new DOMException("Video processing was cancelled.", "AbortError"));
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    video.addEventListener("error", onError, { once: true });
    activeSignal?.addEventListener("abort", onAbort, { once: true });
    video.src = url;
    video.load();
  });
}

function browserInfoToMetadata(
  file: File,
  info: BrowserVideoInfo
): VideoMetadata {
  const duration = info.duration.toFixed(3);
  const bitRate = info.duration > 0
    ? Math.round((file.size * 8) / info.duration).toString()
    : undefined;

  return {
    format: {
      filename: file.name,
      format_name: file.type || getExtension(file),
      duration,
      size: String(file.size),
      bit_rate: bitRate,
    },
    streams: [
      {
        codec_type: "video",
        width: info.width,
        height: info.height,
        duration,
      },
    ],
  };
}

async function getVideoMetadataForProcessing(
  file: File
): Promise<{ metadata: VideoMetadata; info: BrowserVideoInfo }> {
  const info = await getBrowserVideoInfo(file);
  return {
    info,
    metadata: browserInfoToMetadata(file, info),
  };
}

async function detectAudioStream(
  ffmpeg: FFmpeg,
  input: string
): Promise<boolean> {
  throwIfAborted();
  const logs: string[] = [];
  const onLog = ({ message }: { message: string }) => logs.push(message);
  ffmpeg.on("log", onLog);

  try {
    const code = await ffmpeg.exec(
      [
        "-hide_banner",
        "-loglevel",
        "info",
        "-i",
        input,
        "-map",
        "0:a:0",
        "-t",
        "0.001",
        "-f",
        "null",
        "-",
      ],
      5000,
      { signal: activeSignal }
    );

    if (code === 0) return true;

    const text = logs.join("\n");
    return /Stream #\d+:\d+.*Audio:/i.test(text);
  } catch (error) {
    if (activeSignal?.aborted) throw error;
    return /Stream #\d+:\d+.*Audio:/i.test(logs.join("\n"));
  } finally {
    ffmpeg.off("log", onLog);
  }
}

/* =========================================================
   CROPPING HELPERS
========================================================= */

function normalizeCrop(
  options: VideoProcessOptions,
  videoWidth: number,
  videoHeight: number
) {
  const requestedWidth =
    positiveInteger(
      options.cropWidth,
      Math.min(
        640,
        videoWidth
      )
    );

  const requestedHeight =
    positiveInteger(
      options.cropHeight,
      Math.min(
        360,
        videoHeight
      )
    );

  /*
   * Clamp the default crop to the real video dimensions.
   *
   * This fixes the old bug where a 320x240 video could
   * receive the default 640x360 crop.
   */
  let width =
    Math.min(
      requestedWidth,
      videoWidth
    );

  let height =
    Math.min(
      requestedHeight,
      videoHeight
    );

  width =
    evenNumber(width);

  height =
    evenNumber(height);

  let x =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          options.cropX,
          0
        )
      )
    );

  let y =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          options.cropY,
          0
        )
      )
    );

  x =
    Math.min(
      x,
      Math.max(
        0,
        videoWidth - width
      )
    );

  y =
    Math.min(
      y,
      Math.max(
        0,
        videoHeight - height
      )
    );

  /*
   * YUV420 videos work best with even crop
   * coordinates.
   */
  x -= x % 2;
  y -= y % 2;

  return {
    width,
    height,
    x,
    y,
  };
}

/* =========================================================
   PROCESS VIDEO
========================================================= */

async function processVideoInternal(
  toolId: string,
  file: File,
  options: VideoProcessOptions
): Promise<VideoOutput> {
  validateFile(file);

  const ffmpeg =
    await getFFmpeg();

  const input =
    await writeInput(
      ffmpeg,
      file
    );

  let output =
    "output.mp4";

  let mimeType =
    "video/mp4";

  let shouldResetOnError =
    false;

  try {
    /*
     * Probe once for operations that need
     * duration/audio/dimensions.
     */
    let metadata: VideoMetadata | null = null;
    const needsDimensionsOrDuration =
      toolId === "video-cropper";

    if (needsDimensionsOrDuration) {
      const inspected = await getVideoMetadataForProcessing(file);
      metadata = inspected.metadata;
    }

    const needsAudioDetection =
      toolId === "video-speed-changer" ||
      toolId === "video-volume-booster" ||
      toolId === "extract-audio-from-video" ||
      toolId === "mp4-to-webm";

    const hasAudio = needsAudioDetection
      ? await detectAudioStream(ffmpeg, input)
      : false;

    /* =====================================================
       TRIM / CUT
    ===================================================== */

    if (
      toolId ===
        "video-trimmer" ||
      toolId ===
        "video-cutter"
    ) {
      const start = Math.max(
        0,
        safeNumber(options.start, 0)
      );

      const requestedEnd =
        options.end !== undefined
          ? Math.max(
              start,
              safeNumber(
                options.end,
                start
              )
            )
          : null;



      const args = [
        "-ss",
        String(start),

        "-i",
        input,

        "-map",
        "0:v:0",

        "-map",
        "0:a:0?",

        "-c:v",
        "libx264",

        "-preset",
        "ultrafast",

        "-crf",
        "23",
      ];

      if (
        hasAudio
      ) {
        args.push(
          "-c:a",
          "aac",
          "-b:a",
          "128k"
        );
      } else {
        args.push(
          "-an"
        );
      }

      if (
        requestedEnd !== null
      ) {
        args.push(
          "-t",
          String(
            Math.max(
              0.1,
              requestedEnd -
                start
            )
          )
        );
      }

      args.push(
        "-movflags",
        "+faststart",
        output
      );

      await execFFmpeg(
        ffmpeg,
        args
      );
    }

    /* =====================================================
       COMPRESS
    ===================================================== */

    else if (
      toolId ===
      "video-compressor"
    ) {
      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0?",

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          ...qualityArgs(
            options.quality
          ),

          "-c:a",
          "aac",

          "-b:a",
          "96k",

          "-movflags",
          "+faststart",

          output,
        ]
      );
    }

    /* =====================================================
       RESIZE
    ===================================================== */

    else if (
      toolId ===
      "video-resizer"
    ) {
      const width =
        evenNumber(
          positiveInteger(
            options.width,
            1280
          )
        );

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0?",

          "-vf",
          `scale=${width}:-2:flags=bicubic`,

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-c:a",
          "aac",

          "-b:a",
          "128k",

          "-movflags",
          "+faststart",


          output,
        ]
      );
    }

    /* =====================================================
       CROP
    ===================================================== */

    else if (
      toolId ===
      "video-cropper"
    ) {
      const videoStream =
        metadata
          ? getVideoStream(
              metadata
            )
          : undefined;

      const sourceWidth =
        videoStream?.width;

      const sourceHeight =
        videoStream?.height;

      if (
        !sourceWidth ||
        !sourceHeight
      ) {
        throw createUserError(
          "Unable to determine the video's dimensions."
        );
      }

      const crop =
        normalizeCrop(
          options,
          sourceWidth,
          sourceHeight
        );

      if (
        crop.width < 2 ||
        crop.height < 2
      ) {
        throw createUserError(
          "The crop area is too small."
        );
      }

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0?",

          "-vf",
          `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-c:a",
          "aac",

          "-b:a",
          "128k",

          "-movflags",
          "+faststart",


          output,
        ]
      );
    }

    /* =====================================================
       ROTATE
    ===================================================== */

    else if (
      toolId ===
      "video-rotator"
    ) {
      const rotation =
        options.rotation ??
        90;

      let filter =
        "transpose=1";

      if (
        rotation === 180
      ) {
        filter =
          "hflip,vflip";
      }

      if (
        rotation === 270
      ) {
        filter =
          "transpose=2";
      }

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0?",

          "-vf",
          filter,

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-c:a",
          "aac",

          "-b:a",
          "128k",

          "-movflags",
          "+faststart",


          output,
        ]
      );
    }

    /* =====================================================
       FLIP
    ===================================================== */

    else if (
      toolId ===
      "video-flipper"
    ) {
      const filter =
        options.flip ===
        "vertical"
          ? "vflip"
          : "hflip";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0?",

          "-vf",
          filter,

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-c:a",
          "aac",

          "-b:a",
          "128k",

          "-movflags",
          "+faststart",


          output,
        ]
      );
    }

    /* =====================================================
       SPEED CHANGER
    ===================================================== */

    else if (
      toolId ===
      "video-speed-changer"
    ) {
      const speed =
        Math.max(
          0.25,
          Math.min(
            4,
            safeNumber(
              options.speed,
              1
            )
          )
        );

      if (hasAudio) {
        await execFFmpeg(
          ffmpeg,
          [
            "-i",
            input,

            "-filter_complex",
            `[0:v]setpts=PTS/${speed}[v];[0:a]${atempoFilters(
              speed
            )}[a]`,

            "-map",
            "[v]",

            "-map",
            "[a]",

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-crf",
            "23",

            "-c:a",
            "aac",

            "-b:a",
            "128k",

            "-movflags",
            "+faststart",

            output,
          ]
        );
      } else {
        await execFFmpeg(
          ffmpeg,
          [
            "-i",
            input,

            "-filter:v",
            `setpts=PTS/${speed}`,

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-crf",
            "23",

            "-an",

            "-movflags",
            "+faststart",

            output,
          ]
        );
      }
    }

    /* =====================================================
       VOLUME BOOSTER
    ===================================================== */

    else if (
      toolId ===
      "video-volume-booster"
    ) {
      if (!hasAudio) {
        throw createUserError(
          "This video does not contain an audio track."
        );
      }

      const volume =
        Math.max(
          0.1,
          Math.min(
            5,
            safeNumber(
              options.volume,
              2
            )
          )
        );

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-map",
          "0:a:0",

          "-af",
          `volume=${volume}`,

          "-c:v",
          "copy",

          "-c:a",
          "aac",

          "-b:a",
          "192k",

          "-movflags",
          "+faststart",

          output,
        ]
      );
    }

    /* =====================================================
       MUTE
    ===================================================== */

    else if (
      toolId ===
      "mute-video"
    ) {
      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-map",
          "0:v:0",

          "-an",

          "-c:v",
          "copy",

          output,
        ]
      );
    }

    /* =====================================================
       EXTRACT AUDIO
    ===================================================== */

    else if (
      toolId ===
      "extract-audio-from-video"
    ) {
      if (!hasAudio) {
        throw createUserError(
          "This video does not contain an audio track."
        );
      }

      output =
        "audio.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-map",
          "0:a:0",

          "-c:a",
          "libmp3lame",

          "-q:a",
          "2",

          output,
        ]
      );
    }

    /* =====================================================
       VIDEO → GIF
    ===================================================== */

    else if (
      toolId ===
      "video-to-gif"
    ) {
      output =
        "output.gif";

      mimeType =
        "image/gif";

      const fps =
        Math.max(
          1,
          Math.min(
            15,
            safeNumber(
              options.fps,
              10
            )
          )
        );

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vf",
          `fps=${fps},scale=640:-2:flags=bicubic`,

          "-an",


          "-loop",
          "0",

          output,
        ]
      );
    }

    /* =====================================================
       GIF → VIDEO
    ===================================================== */

    else if (
      toolId ===
      "gif-to-video"
    ) {
      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vf",
          "fps=15,format=yuv420p",

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-pix_fmt",
          "yuv420p",

          "-an",

          "-movflags",
          "+faststart",


          output,
        ]
      );
    }

    /* =====================================================
       MP4 → WEBM
    ===================================================== */

    else if (
      toolId ===
      "mp4-to-webm"
    ) {
      output = "output.webm";
      mimeType = "video/webm";

      /*
       * Do not start with VP9 here.
       *
       * libvpx-vp9 is noticeably more memory-hungry in ffmpeg.wasm,
       * and a failed WASM memory access can poison the FFmpeg runtime.
       * The old implementation then tried several more encoders in the
       * same poisoned runtime, which produced the same error repeatedly.
       *
       * VP8 + Opus is a much safer browser-side WebM baseline. We also
       * cap very large dimensions so a 4K/8K source does not force an
       * unnecessarily large WASM frame buffer.
       */
      const info = await getBrowserVideoInfo(file);
      const needsScale =
        info.width > 1920 ||
        info.height > 1920;

      const videoFilter = needsScale
        ? "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease"
        : null;

      const args = [
        "-i",
        input,
        "-map",
        "0:v:0",
        "-c:v",
        "libvpx",
        "-deadline",
        "realtime",
        "-cpu-used",
        "8",
        "-crf",
        "10",
        "-b:v",
        "0",
        "-threads",
        "1",
      ];

      if (videoFilter) {
        args.push("-vf", videoFilter);
      }

      if (hasAudio) {
        args.push(
          "-map",
          "0:a:0?",
          "-c:a",
          "libopus",
          "-b:a",
          "96k"
        );
      } else {
        args.push("-an");
      }

      args.push(
        "-y",
        output
      );

      try {
        await execFFmpeg(
          ffmpeg,
          args
        );
      } catch (error) {
        if (isFatalWasmError(error)) {
          /*
           * Reset immediately. Never retry another encoder inside the
           * same WASM instance after a memory trap. The outer cleanup
           * will also make the next operation start with a clean runtime.
           */
          resetFFmpeg();
          throw createUserError(
            "MP4 to WebM ran out of browser WebAssembly memory. Try a smaller/shorter video or a 1080p-or-lower source."
          );
        }

        throw createUserError(
          `MP4 to WebM failed: ${errorToString(error)}`
        );
      }
    }

    /* =====================================================
       WEBM → MP4
    ===================================================== */

    else if (
      toolId ===
      "webm-to-mp4"
    ) {
      const args = [
        "-i",
        input,

        "-map",
        "0:v:0",

        "-map",
        "0:a:0?",

        "-c:v",
        "libx264",

        "-preset",
        "ultrafast",

        "-crf",
        "23",
      ];

      if (hasAudio) {
        args.push(
          "-c:a",
          "aac",
          "-b:a",
          "128k"
        );
      } else {
        args.push(
          "-an"
        );
      }

      args.push(
        "-movflags",
        "+faststart",


        output
      );

      await execFFmpeg(
        ffmpeg,
        args
      );
    }

    /* =====================================================
       FRAME / THUMBNAIL
    ===================================================== */

    else if (
      toolId ===
        "video-frame-extractor" ||
      toolId ===
        "video-thumbnail-generator"
    ) {
      /*
       * PNG is intentionally used instead of JPEG.
       *
       * This avoids unnecessary JPEG/MJPEG encoder work
       * inside the WASM runtime and is safer for repeated
       * frame extraction.
       */
      output =
        toolId ===
        "video-thumbnail-generator"
          ? "thumbnail.png"
          : "frame.png";

      mimeType =
        "image/png";

      const time = Math.max(
        0,
        safeNumber(options.frameTime, 0)
      );

      await execFFmpeg(
        ffmpeg,
        [
          "-ss",
          String(time),
          "-i",
          input,
          "-frames:v",
          "1",
          "-vf",
          "scale='min(1280,iw)':-2",
          "-y",
          output,
        ]
      );
    }

    else {
      throw createUserError(
        `Unsupported video operation: ${toolId}`
      );
    }

    const blob =
      await readBlob(
        ffmpeg,
        output,
        mimeType
      );

    return {
      blob,
      filename: output,
      mimeType,
    };
  } catch (error) {
    /*
     * A fatal WASM memory error can poison the existing
     * FFmpeg worker. Destroy it so the NEXT operation gets
     * a completely fresh WASM runtime.
     */
    if (
      isFatalWasmError(
        error
      )
    ) {
      shouldResetOnError =
        true;
    }

    throw error;
  } finally {
    await safeDelete(
      ffmpeg,
      input
    );

    await safeDelete(
      ffmpeg,
      output
    );

    if (
      shouldResetOnError
    ) {
      resetFFmpeg();
    }

    activeProgressCallback = null;
  }
}

async function runCancellable<T>(
  operation: () => Promise<T>,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<T> {
  return runExclusive(async () => {
    const controller = new AbortController();
    activeAbortController = controller;
    activeSignal = controller.signal;
    activeProgressCallback = onProgress ?? null;

    const callerAbort = () => {
      controller.abort();
      resetFFmpeg();
    };

    signal?.addEventListener("abort", callerAbort, { once: true });

    try {
      throwIfAborted();
      return await operation();
    } finally {
      signal?.removeEventListener("abort", callerAbort);
      if (activeAbortController === controller) {
        activeAbortController = null;
        activeSignal = undefined;
        activeProgressCallback = null;
      }
    }
  });
}

/* =========================================================
   NATIVE BROWSER MP4 → WEBM
========================================================= */

/**
 * Prefer the browser's native MediaRecorder pipeline for MP4 → WebM.
 *
 * This is deliberately separate from ffmpeg.wasm. WebM encoding with
 * libvpx can hit the fixed WebAssembly memory ceiling even for small
 * inputs, while MediaRecorder uses the browser's native media stack.
 */
async function convertMp4ToWebmNative(
  file: File,
  options: Pick<VideoProcessOptions, "signal" | "onProgress">
): Promise<VideoOutput> {
  throwIfAborted();

  if (
    typeof document === "undefined" ||
    typeof URL === "undefined" ||
    typeof MediaRecorder === "undefined"
  ) {
    throw createUserError(
      "Your browser does not support native MP4 to WebM conversion. Try the latest Chrome or Edge."
    );
  }

  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  const mimeType = candidates.find((type) =>
    MediaRecorder.isTypeSupported(type)
  );

  if (!mimeType) {
    throw createUserError(
      "This browser cannot encode WebM directly. Try the latest Chrome or Edge."
    );
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.playsInline = true;
  video.muted = false;
  video.controls = false;

  const chunks: Blob[] = [];
  let recorder: MediaRecorder | null = null;
  let captureStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  let settled = false;
  let abortHandler: (() => void) | null = null;

  const cleanup = () => {
    if (abortHandler && options.signal) {
      options.signal.removeEventListener("abort", abortHandler);
    }

    try {
      recorder?.stop();
    } catch {
      // Already inactive.
    }

    captureStream?.getTracks().forEach((track) => track.stop());
    audioDestination?.stream.getTracks().forEach((track) => track.stop());

    if (audioContext) {
      void audioContext.close().catch(() => undefined);
    }

    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  };

  return new Promise<VideoOutput>((resolve, reject) => {
    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const finishResolve = (blob: Blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      options.onProgress?.(1);
      resolve({
        blob,
        filename: file.name.replace(/\.[^.]+$/i, "") + ".webm",
        mimeType: blob.type || "video/webm",
      });
    };

    const abort = () => {
      if (settled) return;

      finishReject(
        new DOMException(
          "Video processing was cancelled.",
          "AbortError"
        )
      );
    };

    abortHandler = abort;
    options.signal?.addEventListener("abort", abort, { once: true });

    video.onerror = () => {
      finishReject(
        new Error(
          "The browser could not decode this MP4. Try a standard H.264 MP4 file."
        )
      );
    };

    video.onplay = async () => {
      try {
        throwIfAborted();

        const capture = (
          video as HTMLVideoElement & {
            captureStream?: () => MediaStream;
          }
        ).captureStream;

        captureStream =
          typeof capture === "function"
            ? capture.call(video)
            : null;

        if (!captureStream) {
          finishReject(
            new Error(
              "This browser does not support video capture for WebM conversion. Try the latest Chrome or Edge."
            )
          );
          return;
        }

        /*
         * Route source audio into a MediaStreamDestination rather than the
         * speakers. The video element itself remains unmuted so the captured
         * audio track is not silenced.
         */
        try {
          audioContext = new AudioContext();
          audioDestination =
            audioContext.createMediaStreamDestination();

          const source =
            audioContext.createMediaElementSource(video);
          source.connect(audioDestination);

          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }
        } catch {
          // Video-only WebM is still valid if Web Audio is unavailable.
          audioContext = null;
          audioDestination = null;
        }

        const tracks = [
          ...captureStream.getVideoTracks(),
          ...(audioDestination?.stream.getAudioTracks() ?? []),
        ];

        const recordingStream = new MediaStream(tracks);

        const videoBitsPerSecond =
          video.videoWidth >= 1920 || video.videoHeight >= 1080
            ? 5_000_000
            : video.videoWidth >= 1280 || video.videoHeight >= 720
              ? 3_500_000
              : 2_000_000;

        recorder = new MediaRecorder(recordingStream, {
          mimeType,
          videoBitsPerSecond,
          audioBitsPerSecond: 128_000,
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onerror = () => {
          finishReject(
            new Error(
              "The browser's WebM encoder failed. Try the latest Chrome or Edge."
            )
          );
        };

        recorder.onstop = () => {
          if (settled) return;

          const blob = new Blob(chunks, {
            type: mimeType.split(";")[0],
          });

          if (blob.size === 0) {
            finishReject(
              new Error(
                "The browser produced an empty WebM file. Try another MP4."
              )
            );
            return;
          }

          finishResolve(blob);
        };

        video.ontimeupdate = () => {
          if (video.duration > 0) {
            options.onProgress?.(
              Math.min(0.99, video.currentTime / video.duration)
            );
          }
        };

        video.onended = () => {
          options.onProgress?.(0.99);
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        };

        recorder.start(250);
      } catch (error) {
        finishReject(error);
      }
    };

    video.src = url;
    video.load();

    // Call play immediately so browser user-activation from the Process
    // button can be used for playback/autoplay permission.
    void video.play().catch((error) => {
      finishReject(
        new Error(
          `The browser could not start video playback for conversion: ${errorToString(error)}`
        )
      );
    });
  });
}

/* =========================================================
   PUBLIC PROCESS VIDEO
========================================================= */

export async function processVideo(
  toolId: string,
  file: File,
  options: VideoProcessOptions = {}
): Promise<VideoOutput> {
  if (toolId === "mp4-to-webm") {
    return runCancellable(
      () => convertMp4ToWebmNative(file, options),
      options.signal,
      options.onProgress
    );
  }

  return runCancellable(
    () => processVideoInternal(toolId, file, options),
    options.signal,
    options.onProgress
  );
}

/* =========================================================
   MERGE VIDEOS
========================================================= */

async function mergeVideosInternal(
  files: File[]
): Promise<VideoOutput> {
  validateMergeFiles(
    files
  );

  const ffmpeg =
    await getFFmpeg();

  const inputs: string[] =
    [];

  const normalized: string[] =
    [];

  const temporaryFiles: string[] =
    [];

  try {
    /* -----------------------------------------------------
       Write inputs
    ----------------------------------------------------- */

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const name =
        `merge_${index}`;

      const input =
        await writeInput(
          ffmpeg,
          files[index],
          name
        );

      inputs.push(
        input
      );
    }

    /* -----------------------------------------------------
       Normalize videos
    ----------------------------------------------------- */

    for (
      let index = 0;
      index < inputs.length;
      index++
    ) {
      const normalizedName =
        `normalized_${index}.mp4`;

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          inputs[index],

          "-map",
          "0:v:0",

          /*
           * Audio is intentionally removed.
           *
           * This allows videos with different audio layouts
           * to be merged without stream mismatch errors.
           */
          "-an",

          "-vf",
          "scale=trunc(iw/2)*2:trunc(ih/2)*2",

          "-c:v",
          "libx264",

          "-preset",
          "ultrafast",

          "-crf",
          "23",

          "-pix_fmt",
          "yuv420p",


          normalizedName,
        ]
      );

      normalized.push(
        normalizedName
      );

      temporaryFiles.push(
        normalizedName
      );
    }

    /* -----------------------------------------------------
       Concat file
    ----------------------------------------------------- */

    const concatFile =
      "concat.txt";

    const list =
      normalized
        .map(
          (name) =>
            `file '${name}'`
        )
        .join("\n");

    await ffmpeg.writeFile(
      concatFile,
      new TextEncoder().encode(
        list
      )
    );

    temporaryFiles.push(
      concatFile
    );

    /* -----------------------------------------------------
       Final merge
    ----------------------------------------------------- */

    const output =
      "merged.mp4";

    await execFFmpeg(
      ffmpeg,
      [
        "-f",
        "concat",

        "-safe",
        "0",

        "-i",
        concatFile,

        "-c",
        "copy",

        "-movflags",
        "+faststart",

        output,
      ]
    );

    temporaryFiles.push(
      output
    );

    const blob =
      await readBlob(
        ffmpeg,
        output,
        "video/mp4"
      );

    return {
      blob,
      filename: output,
      mimeType:
        "video/mp4",
    };
  } catch (error) {
    if (
      isFatalWasmError(
        error
      )
    ) {
      resetFFmpeg();
    }

    throw error;
  } finally {
    await safeDeleteMany(
      ffmpeg,
      [
        ...inputs,
        ...temporaryFiles,
      ]
    );
  }
}

export async function mergeVideos(
  files: File[],
  options: Pick<VideoProcessOptions, "signal" | "onProgress"> = {}
): Promise<VideoOutput> {
  return runCancellable(
    () => mergeVideosInternal(files),
    options.signal,
    options.onProgress
  );
}

/* =========================================================
   EXTRACT VIDEO IMAGES
========================================================= */

async function extractVideoImagesInternal(
  file: File,
  fps = 1,
  maxFrames = 30
): Promise<ImageOutput[]> {
  validateFile(file);

  const ffmpeg =
    await getFFmpeg();

  const input =
    await writeInput(
      ffmpeg,
      file
    );

  const safeFPS =
    Math.max(
      0.1,
      Math.min(
        5,
        safeNumber(
          fps,
          1
        )
      )
    );

  const safeMax =
    Math.max(
      1,
      Math.min(
        MAX_EXTRACTED_FRAMES,
        Math.floor(
          safeNumber(
            maxFrames,
            30
          )
        )
      )
    );

  const frameFiles: string[] =
    [];

  try {
    /*
     * PNG is used instead of JPEG to reduce the chance of
     * encoder-related WASM failures.
     */
    await execFFmpeg(
      ffmpeg,
      [
        "-i",
        input,

        "-vf",
        `fps=${safeFPS},scale='min(1280,iw)':-2`,

        "-frames:v",
        String(safeMax),


        "frame_%03d.png",
      ]
    );

    const entries =
      await ffmpeg.listDir(
        "/"
      );

    const names =
      entries
        .filter(
          (entry) =>
            !entry.isDir &&
            /^frame_\d+\.png$/.test(
              entry.name
            )
        )
        .map(
          (entry) =>
            entry.name
        )
        .sort();

    frameFiles.push(
      ...names
    );

    const outputs:
      ImageOutput[] = [];

    for (
      const name of names
    ) {
      const blob =
        await readBlob(
          ffmpeg,
          name,
          "image/png"
        );

      outputs.push({
        blob,
        filename: name,
      });
    }

    return outputs;
  } catch (error) {
    if (
      isFatalWasmError(
        error
      )
    ) {
      resetFFmpeg();
    }

    throw error;
  } finally {
    await safeDelete(
      ffmpeg,
      input
    );

    await safeDeleteMany(
      ffmpeg,
      frameFiles
    );

    /*
     * Defensive cleanup for partially generated frames.
     */
    try {
      const entries =
        await ffmpeg.listDir(
          "/"
        );

      const leftoverFrames =
        entries
          .filter(
            (entry) =>
              !entry.isDir &&
              /^frame_\d+\.png$/.test(
                entry.name
              )
          )
          .map(
            (entry) =>
              entry.name
          );

      await safeDeleteMany(
        ffmpeg,
        leftoverFrames
      );
    } catch {
      // Worker may have been terminated after a fatal error.
    }
  }
}

export async function extractVideoImages(
  file: File,
  fps = 1,
  maxFrames = 30,
  options: Pick<VideoProcessOptions, "signal" | "onProgress"> = {}
): Promise<ImageOutput[]> {
  return runCancellable(
    () => extractVideoImagesInternal(file, fps, maxFrames),
    options.signal,
    options.onProgress
  );
}

/* =========================================================
   VIDEO METADATA
========================================================= */

async function getVideoMetadataInternal(
  file: File
): Promise<VideoMetadata> {
  validateFile(file);

  try {
    const { metadata } = await getVideoMetadataForProcessing(file);
    return metadata;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw createUserError(
      "Unable to read video information. The browser cannot read this video's metadata. Try MP4 (H.264) or WebM (VP8/VP9)."
    );
  }
}

export async function getVideoMetadata(
  file: File,
  options: Pick<VideoProcessOptions, "signal"> = {}
): Promise<VideoMetadata> {
  return runCancellable(
    () => getVideoMetadataInternal(file),
    options.signal
  );
}