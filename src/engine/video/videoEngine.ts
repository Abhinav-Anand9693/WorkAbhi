import {
  ALL_FORMATS,
  AudioSample,
  BlobSource,
  Conversion,
  ConversionCanceledError,
  Input,
  Output,
  Quality,
  VideoSampleSink,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  canEncodeAudio,
} from "mediabunny";

import type { AudioOutputFormat, VideoMetadata, VideoOutput, VideoProcessOptions, VideoProgress, VideoQuality, VideoToolId } from "./videoTypes";
import { DEFAULT_VIDEO_LIMITS, VideoEngineError } from "./videoTypes";
import { outputFormatInstance, outputMimeType } from "./videoCapabilities";
import { resolveVideoTransformPlan, validateVideoOptions } from "./videoTransform";
import { planVideoOperation } from "./videoPlanner";
import { createAudioOutput, createVideoOutput, getOutputBuffer } from "./videoOutput";
import { createBrowserDownloadStream } from "./videoDownload";
import { gifToVideo, videoToGif } from "./adapters/gifAdapter";
import { canUseVideoNativeFallback, processVideoWithNativeFallback } from "./videoNativeFallback";

interface ProcessingJobContext {
  readonly id: string;
  readonly controller: AbortController;
  input?: Input;
  output?: Output;
  conversion?: Conversion;
  state: "running" | "cancelling" | "completed" | "failed" | "cancelled";
  lastProgress: number;
  lastProgressAt: number;
  cleanup: Set<() => void>;
  diagnostics: { createdAt: number; operation?: string; lastError?: string };
}
const processingJobs = new Map<string, ProcessingJobContext>();
let lastStartedJobId: string | null = null;
let jobSequence = 0;

function createJobContext(parentSignal?: AbortSignal, requestedId?: string): ProcessingJobContext {
  const controller = new AbortController();
  const job: ProcessingJobContext = {
    id: requestedId?.trim() || `video-${Date.now().toString(36)}-${(++jobSequence).toString(36)}`,
    controller, state: "running", lastProgress: 0, lastProgressAt: Date.now(), cleanup: new Set(),
    diagnostics: { createdAt: Date.now() },
  };
  if (parentSignal) {
    const onAbort = () => controller.abort();
    if (parentSignal.aborted) controller.abort();
    else {
      parentSignal.addEventListener("abort", onAbort, { once: true });
      job.cleanup.add(() => parentSignal.removeEventListener("abort", onAbort));
    }
  }
  if (processingJobs.has(job.id)) {
    throw new VideoEngineError("INVALID_OPTIONS", `A video job with id "${job.id}" is already running.`);
  }
  processingJobs.set(job.id, job);
  lastStartedJobId = job.id;
  return job;
}
function registerResourceCleanup(job: ProcessingJobContext, cleanup: () => void): void {
  job.cleanup.add(cleanup);
}

function cleanupJob(job: ProcessingJobContext, state: ProcessingJobContext["state"]): void {
  job.state = state;
  for (const fn of job.cleanup) { try { fn(); } catch { /* best effort */ } }
  job.cleanup.clear();
  processingJobs.delete(job.id);
  if (lastStartedJobId === job.id) lastStartedJobId = null;
}
function checkJobAbort(job: ProcessingJobContext): void { checkAbort(job.controller.signal); }
function getCancellationJob(jobId?: string): ProcessingJobContext | undefined {
  return jobId ? processingJobs.get(jobId) : (lastStartedJobId ? processingJobs.get(lastStartedJobId) : undefined);
}

function emit(options: VideoProcessOptions, progress: VideoProgress, job?: ProcessingJobContext): void {
  const effectiveJob = job ?? (options.jobId ? processingJobs.get(options.jobId) : undefined);
  const clamped = Math.max(0, Math.min(1, progress.progress));
  const value = effectiveJob ? Math.max(effectiveJob.lastProgress, clamped) : clamped;
  if (effectiveJob) {
    effectiveJob.lastProgressAt = Date.now();
    effectiveJob.lastProgress = value;
  }
  options.onProgress?.({ ...progress, progress: value });
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new VideoEngineError("CANCELLED", "Video processing was cancelled.");
}

function deviceMemoryGB(): number | null {
  if (typeof navigator === "undefined") return null;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === "number" && Number.isFinite(memory) ? memory : null;
}

function recommendedMemoryOutputLimit(): number {
  const memory = deviceMemoryGB();
  if (memory !== null && memory <= 2) return 128 * 1024 * 1024;
  if (memory !== null && memory <= 4) return 256 * 1024 * 1024;
  return DEFAULT_VIDEO_LIMITS.maxInMemoryOutputBytes;
}

function validateFile(file: File): void {
  if (!(file instanceof File) || file.size <= 0) {
    throw new VideoEngineError("INVALID_FILE", "Please select a valid, non-empty video file.");
  }

  // Do not impose a small upload-style limit. BlobSource reads the local File
  // lazily/ranged, so a 1 GB source does not need to be copied into JS memory.
  // The practical limit is the browser/device's ability to decode and encode it.
  if (file.size > DEFAULT_VIDEO_LIMITS.maxInputBytes) {
    throw new VideoEngineError(
      "MEMORY_LIMIT",
      "This local file exceeds WorkAbhi's 8 GiB source-size safety limit. Try a smaller file or split the recording first.",
    );
  }
}

function validateMergeFiles(files: File[]): void {
  if (files.length < 2) throw new VideoEngineError("INVALID_FILE", "Please select at least 2 videos to merge.");
  if (files.length > DEFAULT_VIDEO_LIMITS.maxMergeFiles) {
    throw new VideoEngineError("INVALID_OPTIONS", `You can merge up to ${DEFAULT_VIDEO_LIMITS.maxMergeFiles} videos at once.`);
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > DEFAULT_VIDEO_LIMITS.maxMergeBytes) {
    throw new VideoEngineError("MEMORY_LIMIT", "The combined videos exceed the supported local merge size. Merge fewer or smaller files.");
  }
  files.forEach(validateFile);
}

function quality(level: VideoQuality = "medium"): Quality {
  switch (level) {
    case "original": return new Quality("very-high");
    case "high": return new Quality("high");
    case "low": return new Quality("low");
    default: return new Quality("medium");
  }
}

function inputFor(file: File): Input {
  return new Input({
    source: new BlobSource(file, {
      // Keep only a small rolling cache. The source itself remains the user's
      // File object and Mediabunny can request byte ranges as needed.
      maxCacheSize: 4 * 1024 * 1024,
      useStreamReader: true,
    }),
    formats: ALL_FORMATS,
  });
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function filenameFor(input: File, format: string): string {
  return `${baseName(input.name)}-workabhi.${format}`;
}

function classifyError(error: unknown): VideoEngineError {
  if (error instanceof VideoEngineError) return error;
  if (error instanceof ConversionCanceledError) return new VideoEngineError("CANCELLED", "Video processing was cancelled.", error);
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("unsupported") || lower.includes("undecodable") || lower.includes("no_encodable")) {
    return new VideoEngineError("UNSUPPORTED_CODEC", "This browser cannot decode or encode one of the media codecs used by this file.", error);
  }
  if (lower.includes("memory") || lower.includes("allocation") || lower.includes("out of memory")) {
    return new VideoEngineError("MEMORY_LIMIT", "This video is too demanding for the available browser memory. Try a smaller or lower-resolution file.", error);
  }
  return new VideoEngineError("PROCESSING_FAILED", "The video could not be processed on this device. Try again with a smaller file or a different output format.", error);
}

async function readMetadata(input: Input, file: File): Promise<VideoMetadata> {
  if (!(await input.canRead())) throw new VideoEngineError("UNSUPPORTED_FORMAT", "This video format or container is not supported by this browser.");
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new VideoEngineError("UNSUPPORTED_FORMAT", "No video track was found in this file.");
  const audio = await input.getPrimaryAudioTrack();
  const metrics = await track.computeFrameRateMetrics();
  return {
    mimeType: await input.getMimeType(),
    format: (await input.getFormat()).name,
    duration: await input.getDurationFromMetadata(),
    width: await track.getDisplayWidth(),
    height: await track.getDisplayHeight(),
    rotation: await track.getRotation(),
    videoCodec: await track.getCodec(),
    audioCodec: audio ? await audio.getCodec() : null,
    frameRate: metrics.bestGuessFrameRate ?? null,
    hasAudio: Boolean(audio),
    fileSize: file.size,
  };
}

export async function getVideoMetadata(file: File, options: Pick<VideoProcessOptions, "signal" | "onProgress" | "jobId"> = {}): Promise<VideoMetadata> {
  validateFile(file);
  const job = createJobContext(options.signal, options.jobId);
  const input = inputFor(file);
  job.input = input;
  try {
    checkJobAbort(job);
    emit(options, { stage: "reading", progress: 0, message: "Reading video metadata..." }, job);
    const metadata = await readMetadata(input, file);
    validateSourceSafety(metadata);
    emit(options, { stage: "complete", progress: 1, processedSeconds: metadata.duration ?? undefined, duration: metadata.duration ?? undefined, message: "Video information ready." }, job);
    cleanupJob(job, "completed");
    return metadata;
  } catch (error) {
    cleanupJob(job, job.controller.signal.aborted ? "cancelled" : "failed");
    throw classifyError(error);
  } finally {
    try { input.dispose(); } catch { /* best effort */ }
  }
}
function validateSourceSafety(metadata: VideoMetadata): void {
  const { width, height, duration, frameRate } = metadata;
  if (!Number.isFinite(width ?? NaN) || !Number.isFinite(height ?? NaN) || (width ?? 0) < 2 || (height ?? 0) < 2) {
    throw new VideoEngineError("INVALID_FILE", "The video dimensions could not be determined.");
  }
  if ((width as number) > 16384 || (height as number) > 16384 || (width as number) * (height as number) > DEFAULT_VIDEO_LIMITS.maxPixels) {
    throw new VideoEngineError("MEMORY_LIMIT", "This video resolution is too large for stable browser processing.");
  }
  if (duration !== null && (!Number.isFinite(duration) || duration < 0 || duration > 24 * 60 * 60)) {
    throw new VideoEngineError("INVALID_FILE", "The video duration is invalid or exceeds the safe browser processing limit.");
  }
  if (frameRate !== null && (!Number.isFinite(frameRate) || frameRate <= 0 || frameRate > 240)) {
    throw new VideoEngineError("INVALID_FILE", "The video frame rate is outside the safe browser processing range.");
  }
  if ((width as number) * (height as number) * 8 > recommendedMemoryOutputLimit() * 0.8) {
    throw new VideoEngineError("MEMORY_LIMIT", "A decoded frame from this video would exceed the safe browser memory budget.");
  }
}
function fitWithinBounds(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) throw new VideoEngineError("INVALID_OPTIONS", "Invalid frame dimensions.");
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(2, Math.floor(width * scale)), height: Math.max(2, Math.floor(height * scale)) };
}
function normalizeFrameTimestamp(timestamp: number, duration: number): number {
  if (!Number.isFinite(timestamp)) throw new VideoEngineError("INVALID_OPTIONS", "Frame timestamp must be a finite number.");
  if (timestamp < 0) return 0;
  if (duration > 0 && timestamp >= duration) return Math.max(0, duration - 0.001);
  return timestamp;
}
function validateResourceBudget(_fileSize: number, metadata: VideoMetadata, streaming: boolean): void {
  const memory = deviceMemoryGB();
  const budget = memory !== null && memory <= 2 ? 96 * 1024 * 1024 :
    memory !== null && memory <= 4 ? 192 * 1024 * 1024 : DEFAULT_VIDEO_LIMITS.maxInMemoryOutputBytes;
  const frameBytes = (metadata.width ?? 0) * (metadata.height ?? 0) * 4;
  if (!streaming && frameBytes > budget * 0.45) {
    throw new VideoEngineError("MEMORY_LIMIT", "The decoded video frame is too large for the available browser memory.");
  }
}

async function chooseVideoCodec(format: ReturnType<typeof outputFormatInstance>, width: number, height: number, q: Quality) {
  return getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), { width, height, quality: q });
}

async function chooseAudioCodec(format: ReturnType<typeof outputFormatInstance>) {
  return getFirstEncodableAudioCodec(format.getSupportedAudioCodecs());
}

function makeFlipProcessor(direction: "horizontal" | "vertical", width: number, height: number) {
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable in this browser.");
  return (sample: import("mediabunny").VideoSample) => {
    const source = sample.toCanvasImageSource();
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (direction === "horizontal") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(source, 0, 0, width, height);
    ctx.restore();
    return canvas;
  };
}

function makeVolumeProcessor(multiplier: number) {
  return (sample: AudioSample) => {
    const buffer = sample.toAudioBuffer();
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.max(-1, Math.min(1, data[i] * multiplier));
    }
    return AudioSample.fromAudioBuffer(buffer, sample.timestamp);
  };
}

function makeSpeedAudioProcessor(speed: number, origin = 0) {
  return (sample: AudioSample) => {
    const buffer = sample.toAudioBuffer();
    const outputLength = Math.max(1, Math.round(buffer.length / speed));
    const output = new AudioBuffer({ numberOfChannels: buffer.numberOfChannels, length: outputLength, sampleRate: buffer.sampleRate });
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const input = buffer.getChannelData(channel);
      const out = output.getChannelData(channel);
      for (let i = 0; i < out.length; i += 1) {
        const sourcePosition = i * speed;
        const left = Math.floor(sourcePosition);
        const right = Math.min(input.length - 1, left + 1);
        const mix = sourcePosition - left;
        out[i] = input[Math.min(input.length - 1, left)] * (1 - mix) + input[right] * mix;
      }
    }
    return AudioSample.fromAudioBuffer(output, Math.max(0, (sample.timestamp - origin) / speed));
  };
}

function startProgressWatchdog(
  job: ProcessingJobContext,
  inactivityMs = 10 * 60 * 1000,
): void {
  const timer = setInterval(() => {
    if (job.state !== "running" || job.controller.signal.aborted) return;
    if (Date.now() - job.lastProgressAt < inactivityMs) return;
    job.state = "cancelling";
    job.controller.abort();
    void job.conversion?.cancel().catch(() => undefined);
    void job.output?.cancel().catch(() => undefined);
  }, 60_000);
  registerResourceCleanup(job, () => clearInterval(timer));
}

function stallWindowForDuration(duration: number | null): number {
  return Math.max(5 * 60 * 1000, Math.min(20 * 60 * 1000, Math.max(1, duration ?? 1) * 20 * 1000));
}


function browserStreamingCapabilityAvailable(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof WritableStream !== "undefined";
}

async function prepareDownloadStream(
  filename: string,
  options: VideoProcessOptions,
  strategy: OutputStrategy,
): Promise<{ writable: WritableStream<Uint8Array> | null; streamed: boolean }> {
  if (strategy.mode !== "stream") return { writable: options.downloadStream ?? null, streamed: false };
  if (options.downloadStream) return { writable: options.downloadStream, streamed: true };

  const browserDownload = await createBrowserDownloadStream(filename);
  if (browserDownload) return { writable: browserDownload.writable, streamed: true };

  if (options.largeFileStrategy === "disk" || options.streamDownload === true ||
      (strategy.estimatedOutputBytes ?? 0) > recommendedMemoryOutputLimit()) {
    throw new VideoEngineError(
      "OUTPUT_FAILED",
      "A streaming browser download is required for this output, but this browser could not create one.",
    );
  }
  return { writable: null, streamed: false };
}

interface OutputStrategy {
  mode: "memory" | "stream";
  reason: string;
  estimatedOutputBytes?: number;
}

function resolveOutputStrategy(
  inputBytes: number,
  metadata: VideoMetadata,
  options: VideoProcessOptions,
  requiresTranscode: boolean,
  operation: string,
): OutputStrategy {
  const streamAvailable = Boolean(options.downloadStream) || browserStreamingCapabilityAvailable();
  const memoryLimit = recommendedMemoryOutputLimit();
  const duration = Math.max(0, metadata.duration ?? 0);
  const fps = Math.max(1, Math.min(60, metadata.frameRate ?? 30));
  const pixels = Math.max(1, (metadata.width ?? 0) * (metadata.height ?? 0));
  // Conservative estimate used only for memory policy. It is deliberately
  // not presented as an exact encoded file size.
  const bytesPerFrame = requiresTranscode ? 0.12 : 0.08;
  const estimatedOutputBytes = duration * fps * pixels * bytesPerFrame;

  if (options.largeFileStrategy === "memory") {
    return { mode: "memory", reason: "Memory output was explicitly requested.", estimatedOutputBytes };
  }
  if (options.largeFileStrategy === "disk" || options.saveDirectlyToDisk === true) {
    if (!streamAvailable) throw new VideoEngineError("OUTPUT_FAILED", "Streaming output was requested, but no browser download stream is available.");
    return { mode: "stream", reason: "Streaming output was explicitly requested.", estimatedOutputBytes };
  }
  if (options.streamDownload === true && streamAvailable) {
    return { mode: "stream", reason: "The caller explicitly requested browser streaming.", estimatedOutputBytes };
  }
  const large = inputBytes >= 128 * 1024 * 1024 || estimatedOutputBytes > memoryLimit * 0.7 || operation === "merge" && inputBytes >= 64 * 1024 * 1024;
  if (large && streamAvailable) {
    return { mode: "stream", reason: "The output is large enough that streaming avoids a large in-memory Blob.", estimatedOutputBytes };
  }
  if (estimatedOutputBytes > memoryLimit) {
    throw new VideoEngineError("MEMORY_LIMIT", "The estimated output is too large for browser memory, and no streaming download is available.");
  }
  return { mode: "memory", reason: "The estimated output fits the browser memory budget.", estimatedOutputBytes };
}

async function convertSingle(file: File, toolId: VideoToolId, options: VideoProcessOptions, job: ProcessingJobContext): Promise<VideoOutput> {
  validateFile(file);
  const plan = planVideoOperation(toolId, options);
  job.diagnostics.operation = toolId;
  const input = inputFor(file);
  job.input = input;
  emit(options, { stage: "planning", progress: 0.03, message: plan.reason });

  let output: Output | null = null;
  let conversion: Conversion | null = null;

  try {
    emit(options, { stage: "reading", progress: 0.04, message: "Reading video structure..." });
    const metadata = await readMetadata(input, file);
    emit(options, { stage: "planning", progress: 0.07, duration: metadata.duration ?? undefined, message: "Checking browser codec support..." });
    checkAbort(options.signal);
    validateSourceSafety(metadata);
    validateVideoOptions(metadata, options, toolId);
    const transformPlan = resolveVideoTransformPlan(metadata, options, toolId);
    const dimensions = { width: transformPlan.outputWidth, height: transformPlan.outputHeight };

    if (plan.execution === "copy" || plan.execution === "transcode") {
      const format = options.outputFormat ?? (toolId === "mp4-to-webm" ? "webm" : toolId === "webm-to-mp4" ? "mp4" : "mp4");
      const q = quality(options.quality);
      const outputFormat = outputFormatInstance(format);
      const needsVideo = toolId !== "extract-audio-from-video";
      const needsAudio = metadata.hasAudio && toolId !== "mute-video";
      const strategy = resolveOutputStrategy(file.size, metadata, options, plan.execution === "transcode", toolId);
      const filename = filenameFor(file, format);
      const preparedDownload = await prepareDownloadStream(filename, options, strategy);
      const streamDownload = preparedDownload.streamed;
      validateResourceBudget(file.size, metadata, streamDownload || !plan.requiresVideoEncode && !plan.requiresAudioEncode);

      const targetContext = await createVideoOutputForTool(
        format,
        filename,
        streamDownload,
        preparedDownload.writable,
      );
      output = targetContext.output;
      job.output = output;

      const videoCodec =
        needsVideo && plan.requiresVideoEncode
          ? await chooseVideoCodec(
              outputFormat,
              dimensions.width ?? metadata.width ?? 640,
              dimensions.height ?? metadata.height ?? 360,
              q,
            )
          : undefined;

      /*
       * Preserve source audio whenever the tool does not actually modify it.
       * Mediabunny will copy it when the output container can carry the codec,
       * and only transcode when necessary.
       */
      const audioCodec =
        needsAudio && plan.requiresAudioEncode
          ? await chooseAudioCodec(outputFormat)
          : undefined;

      if (needsVideo && plan.requiresVideoEncode && !videoCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible video encoder is available in this browser for the selected output.");
      if (needsAudio && plan.requiresAudioEncode && !audioCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible audio encoder is available in this browser for the selected output.");

      const trim = options.start !== undefined || options.end !== undefined
        ? { start: options.start ?? 0, end: options.end }
        : undefined;

      const flipProcessor = toolId === "video-flipper"
        ? makeFlipProcessor(options.flip === "vertical" ? "vertical" : "horizontal", dimensions.width ?? metadata.width ?? 640, dimensions.height ?? metadata.height ?? 360)
        : undefined;
      const speed = options.speed ?? 1;
      const volumeMultiplier = options.volume ?? 1;

      const videoOptions: import("mediabunny").ConversionVideoOptions = {
        width: plan.requiresVideoEncode ? dimensions.width : undefined,
        height: plan.requiresVideoEncode ? dimensions.height : undefined,
        fit: plan.requiresVideoEncode ? transformPlan.fit : undefined,
        rotate: plan.requiresVideoEncode ? transformPlan.rotation : undefined,
        crop: plan.requiresVideoEncode ? transformPlan.sourceRect : undefined,
        codec: videoCodec ?? undefined,
        quality: videoCodec ? q : undefined,
        hardwareAcceleration: options.hardwareAcceleration ?? "no-preference",
        forceTranscode: plan.requiresVideoEncode || Boolean(flipProcessor) || toolId === "video-speed-changer",
        process: flipProcessor,
      };

      if (toolId === "video-speed-changer") {
        videoOptions.process = (sample: import("mediabunny").VideoSample) => {
          sample.setTimestamp(Math.max(0, (sample.timestamp - (trim?.start ?? 0)) / speed));
          sample.setDuration(Math.max(0, sample.duration / speed));
          return sample;
        };
      }

      const audioOptions: import("mediabunny").ConversionAudioOptions = {
        codec: audioCodec ?? undefined,
        quality: audioCodec ? q : undefined,
        discard: toolId === "mute-video",
        forceTranscode: plan.requiresAudioEncode || toolId === "video-volume-booster" || toolId === "video-speed-changer",
        process: toolId === "video-volume-booster"
          ? makeVolumeProcessor(volumeMultiplier)
          : toolId === "video-speed-changer"
            ? makeSpeedAudioProcessor(speed, trim?.start ?? 0)
            : undefined,
      };

      emit(options, { stage: "planning", progress: 0.10, duration: metadata.duration ?? undefined, message: "Preparing the local video pipeline..." });
      conversion = await Conversion.init({
        input,
        output,
        tracks: "primary",
        video: needsVideo ? videoOptions : { discard: true },
        audio: needsAudio ? audioOptions : { discard: true },
        trim,
        copy: options.preferCopy === false ? false : { mode: "preferred", boundaryPolicy: "expand" },
        showWarnings: false,
      });
      job.conversion = conversion;
      emit(options, { stage: "planning", progress: 0.12, duration: metadata.duration ?? undefined, message: "Video pipeline ready. Starting processing..." });

      if (!conversion.isValid) {
        throw new VideoEngineError("UNSUPPORTED_CODEC", "This browser cannot create the requested output from this file.");
      }
      registerResourceCleanup(job, () => { /* conversion lifecycle is owned by the job */ });
      // Conversion progress heartbeats reset the job watchdog.
      const stallTimer = setInterval(() => {
        if (job.state !== "running" || job.controller.signal.aborted) return;
        if (Date.now() - job.lastProgressAt < stallWindowForDuration(metadata.duration)) return;
        job.state = "cancelling";
        job.controller.abort();
        void conversion?.cancel().catch(() => undefined);
      }, 60_000);
      registerResourceCleanup(job, () => clearInterval(stallTimer));

      let outputBytes = 0;
      let stopWriteListener: (() => void) | undefined;
      stopWriteListener = output.target.on(
        "write",
        ({ end }: { start: number; end: number }) => {
          outputBytes = Math.max(outputBytes, end);
        },
      );
      registerResourceCleanup(job, () => {
        stopWriteListener?.();
        stopWriteListener = undefined;
      });

      /*
       * Mediabunny's conversion progress is the real media-processing
       * progress. Keep the UI mapping monotonic while reserving a small
       * amount of progress for metadata/planning and finalization.
       */
      conversion.onProgress = (conversionProgress, processedTime) => {
        const p = Math.max(0, Math.min(1, conversionProgress));
        emit(options, {
          stage:
            p < 0.08
              ? "decoding"
              : p < 0.96
                ? "encoding"
                : "finalizing",
          progress: 0.08 + p * 0.88,
          processedSeconds: processedTime,
          duration: metadata.duration ?? undefined,
          outputBytes: outputBytes || undefined,
          message:
            p < 0.96
              ? "Processing video..."
              : "Finalizing output...",
        }, job);
      };

      checkAbort(options.signal);
      await conversion.execute({ pauseSignal: options.signal });
      stopWriteListener?.();
      stopWriteListener = undefined;

      if (targetContext.streamedDownload) {
        if (outputBytes <= 0) throw new VideoEngineError("OUTPUT_FAILED", "The streaming output completed without writing any bytes.");
        emit(options, {
          stage: "complete",
          progress: 1,
          outputBytes: outputBytes || undefined,
          message: "Download started. Streaming output to the browser...",
        });
        return {
          blob: new Blob(),
          filename: filenameFor(file, format),
          mimeType: outputFormat.mimeType,
          size: outputBytes,
          streamedDownload: true,
        };
      }

      const buffer = getOutputBuffer(output);
      const memoryLimit = recommendedMemoryOutputLimit();
      if (buffer.byteLength > memoryLimit) {
        throw new VideoEngineError("MEMORY_LIMIT", "The output is too large to safely keep in browser memory on this device. Use a browser with streaming download support for large files.");
      }
      const blob = new Blob([buffer], { type: outputFormat.mimeType || outputMimeType(format) });
      emit(options, { stage: "complete", progress: 1, outputBytes: blob.size, message: "Processing complete." });
      return { blob, filename: filenameFor(file, format), mimeType: blob.type, size: blob.size };
    }

    throw new VideoEngineError("PROCESSING_FAILED", "This operation is not supported by the selected engine path.");
  } catch (error) {
    throw classifyError(error);
  } finally {
    try { input.dispose(); } catch { /* best effort */ }
    if (output && output.state === "started") {
      try { await output.cancel(); } catch { /* best effort */ }
    }
    job.input = undefined; job.output = undefined; job.conversion = undefined;
  }
}

async function createVideoOutputForTool(
  format: "mp4" | "webm" | "mov" | "mkv",
  filename: string,
  streamDownload: boolean,
  downloadStream?: VideoProcessOptions["downloadStream"],
) {
  return createVideoOutput(format, filename, streamDownload, downloadStream);
}

async function extractFrames(file: File, options: VideoProcessOptions): Promise<Array<{ blob: Blob; filename: string }>> {
  validateFile(file);
  const job = createJobContext(options.signal, options.jobId);
  const input = inputFor(file);
  job.input = input;
  startProgressWatchdog(job, 5 * 60 * 1000);
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new VideoEngineError("UNSUPPORTED_FORMAT", "No video track was found.");
    const metadata = await readMetadata(input, file);
    validateSourceSafety(metadata);
    validateVideoOptions(metadata, options, "video-frame-extractor");
    const duration = metadata.duration ?? 0;
    const fps = options.fps ?? 1;
    const maxFrames = options.maxFrames ?? 20;
    const start = normalizeFrameTimestamp(options.start ?? 0, duration);
    const rawEnd = options.end ?? Math.min(duration, start + maxFrames / fps);
    if (!Number.isFinite(rawEnd)) throw new VideoEngineError("INVALID_OPTIONS", "Frame end time must be finite.");
    const end = duration > 0 ? Math.min(duration, Math.max(start + 0.001, rawEnd)) : rawEnd;
    if (end <= start) throw new VideoEngineError("INVALID_OPTIONS", "The selected frame range is empty.");
    const count = Math.min(maxFrames, Math.max(1, Math.ceil((end - start) * fps)));
    const estimatedOutputBytes = count * Math.min(DEFAULT_VIDEO_LIMITS.maxExtractDimension ** 2, (metadata.width ?? 0) * (metadata.height ?? 0)) * 4;
    if (estimatedOutputBytes > 256 * 1024 * 1024) throw new VideoEngineError("MEMORY_LIMIT", "The extracted frame set would require too much browser memory.");
    const sink = new VideoSampleSink(track);
    const sourceWidth = await track.getDisplayWidth();
    const sourceHeight = await track.getDisplayHeight();
    const rotation = ((await track.getRotation()) % 360 + 360) % 360;
    const orientedWidth = rotation === 90 || rotation === 270 ? sourceHeight : sourceWidth;
    const orientedHeight = rotation === 90 || rotation === 270 ? sourceWidth : sourceHeight;
    const fitted = fitWithinBounds(orientedWidth, orientedHeight, DEFAULT_VIDEO_LIMITS.maxExtractDimension, DEFAULT_VIDEO_LIMITS.maxExtractDimension);
    const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(fitted.width, fitted.height) : document.createElement("canvas");
    canvas.width = fitted.width; canvas.height = fitted.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable.");
    const results: Array<{ blob: Blob; filename: string }> = [];
    let totalOutputBytes = 0;
    for (let i = 0; i < count; i += 1) {
      checkJobAbort(job);
      const timestamp = Math.min(Math.max(start, end - 0.001), start + i / fps);
      const sample = await sink.getSample(timestamp);
      if (!sample) continue;
      try {
        const source = sample.toCanvasImageSource();
        ctx.save(); ctx.clearRect(0, 0, fitted.width, fitted.height);
        ctx.translate(fitted.width / 2, fitted.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const dw = rotation === 90 || rotation === 270 ? fitted.height : fitted.width;
        const dh = rotation === 90 || rotation === 270 ? fitted.width : fitted.height;
        ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        const blob = await canvasToJpeg(canvas);
        totalOutputBytes += blob.size;
        if (totalOutputBytes > 128 * 1024 * 1024) {
          throw new VideoEngineError("MEMORY_LIMIT", "The extracted images exceed the safe total output size.");
        }
        results.push({ blob, filename: `${baseName(file.name)}-${String(i + 1).padStart(3, "0")}.jpg` });
      } finally { sample.close(); }
      emit(options, { stage: "decoding", progress: (i + 1) / count, processedSeconds: timestamp, duration, message: `Extracting frame ${i + 1} of ${count}...` }, job);
    }
    cleanupJob(job, "completed");
    return results;
  } catch (error) {
    cleanupJob(job, job.controller.signal.aborted ? "cancelled" : "failed");
    throw classifyError(error);
  } finally { try { input.dispose(); } catch { /* best effort */ } }
}

async function canvasToJpeg(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => blob ? resolve(blob) : reject(new VideoEngineError("OUTPUT_FAILED", "Could not create the extracted image.")), "image/jpeg", 0.92);
  });
}

export async function extractVideoImages(file: File, fps: number, maxFrames: number, options: VideoProcessOptions = {}) {
  return extractFrames(file, { ...options, fps, maxFrames });
}

export async function processVideo(toolId: VideoToolId, file: File, options: VideoProcessOptions = {}): Promise<VideoOutput> {
  validateFile(file);
  const job = createJobContext(options.signal, options.jobId);
  const jobOptions = { ...options, signal: job.controller.signal };
  try {
    checkJobAbort(job);
    if (toolId === "video-to-gif") {
      const blob = await videoToGif(file, jobOptions);
      cleanupJob(job, "completed");
      return { blob, filename: `${baseName(file.name)}-workabhi.gif`, mimeType: "image/gif", size: blob.size };
    }
    if (toolId === "gif-to-video") {
      const blob = await gifToVideo(file, jobOptions);
      cleanupJob(job, "completed");
      return { blob, filename: `${baseName(file.name)}-workabhi.mp4`, mimeType: "video/mp4", size: blob.size };
    }
    if (toolId === "video-frame-extractor" || toolId === "video-thumbnail-generator" || toolId === "video-to-images") {
      throw new VideoEngineError("INVALID_OPTIONS", "Use the frame extraction API for this tool.");
    }
    if (toolId === "extract-audio-from-video") {
      const result = await extractAudio(file, jobOptions, job);
      cleanupJob(job, "completed");
      return result;
    }
    try {
      const result = await convertSingle(file, toolId, jobOptions, job);
      cleanupJob(job, "completed");
      return result;
    } catch (error) {
      const classified = classifyError(error);
      const largeFile = file.size >= 256 * 1024 * 1024;
      if (!largeFile && !jobOptions.streamDownload && canUseVideoNativeFallback() &&
        (classified.code === "UNSUPPORTED_CODEC" || classified.code === "NOT_ENCODABLE" || classified.code === "BROWSER_UNSUPPORTED")) {
        const result = await processVideoWithNativeFallback(file, toolId, jobOptions);
        cleanupJob(job, "completed");
        return result;
      }
      throw classified;
    }
  } catch (error) {
    cleanupJob(job, job.controller.signal.aborted ? "cancelled" : "failed");
    throw classifyError(error);
  }
}

async function extractAudio(file: File, options: VideoProcessOptions, job: ProcessingJobContext): Promise<VideoOutput> {
  validateFile(file);
  const format: AudioOutputFormat = options.audioOutputFormat ?? "wav";
  const input = inputFor(file);
  job.input = input;
  let output: Output | null = null;
  let conversion: Conversion | null = null;
  try {
    const metadata = await readMetadata(input, file);
    validateSourceSafety(metadata);
    if (!metadata.hasAudio) throw new VideoEngineError("INVALID_FILE", "This video does not contain an audio track.");
    const estimatedWavBytes = Math.max(0, metadata.duration ?? 0) * 48_000 * 2 * 4;
    const audioStrategy: OutputStrategy = format === "mp3"
      ? resolveOutputStrategy(file.size, metadata, options, true, "audio")
      : estimatedWavBytes > recommendedMemoryOutputLimit()
        ? (() => { throw new VideoEngineError("MEMORY_LIMIT", "WAV output would exceed the browser memory budget. Use MP3 for large audio extraction."); })()
        : { mode: "memory", reason: "WAV requires a finalized in-memory output.", estimatedOutputBytes: estimatedWavBytes };
    const preparedDownload = await prepareDownloadStream(`${baseName(file.name)}-workabhi.${format}`, options, audioStrategy);
    const streamDownload = preparedDownload.streamed && format === "mp3";

    if (format === "mp3" && !(await canEncodeAudio("mp3"))) {
      const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
      registerMp3Encoder();
    }
    const outputContext = await createAudioOutput(
      format,
      `${baseName(file.name)}-workabhi.${format}`,
      streamDownload,
      preparedDownload.writable,
    );
    output = outputContext.output;
    const target = outputContext.bufferTarget;
    job.output = output;

    let outputBytes = 0;
    let stopWriteListener: (() => void) | undefined = output.target.on(
      "write",
      ({ end }: { start: number; end: number }) => {
        outputBytes = Math.max(outputBytes, end);
      },
    );
    registerResourceCleanup(job, () => {
      stopWriteListener?.();
      stopWriteListener = undefined;
    });

    conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      video: { discard: true },
      audio: { quality: quality(options.quality), forceTranscode: format === "mp3" },
      copy: format === "wav" ? false : { mode: "preferred" },
      showWarnings: false,
    });
    job.conversion = conversion;
    startProgressWatchdog(job, stallWindowForDuration(metadata.duration));
    if (!conversion.isValid) throw new VideoEngineError("UNSUPPORTED_CODEC", "The audio track cannot be decoded or encoded in this browser.");
    conversion.onProgress = (progress, processedSeconds) =>
      emit(options, {
        stage: progress < 0.96 ? "encoding" : "finalizing",
        progress: 0.08 + Math.max(0, Math.min(1, progress)) * 0.88,
        processedSeconds,
        message: progress < 0.96 ? "Extracting audio..." : "Finalizing audio...",
      }, job);

    await conversion.execute({ pauseSignal: options.signal });
    stopWriteListener?.();
    stopWriteListener = undefined;

    const filename = `${baseName(file.name)}-workabhi.${format}`;
    const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";

    if (outputContext.streamedDownload) {
      if (outputBytes <= 0) throw new VideoEngineError("OUTPUT_FAILED", "The audio stream completed without writing any bytes.");
      emit(options, {
        stage: "complete",
        progress: 1,
        message: "Download started. Streaming audio to the browser...",
      });
      return {
        blob: new Blob(),
        filename,
        mimeType,
        size: outputBytes,
        streamedDownload: true,
      };
    }

    if (!target?.buffer) {
      throw new VideoEngineError("OUTPUT_FAILED", "Audio output is empty.");
    }

    if (target.buffer.byteLength > recommendedMemoryOutputLimit()) {
      throw new VideoEngineError(
        "MEMORY_LIMIT",
        "The audio output is too large to keep safely in browser memory. Enable direct-to-disk saving.",
      );
    }

    const blob = new Blob([target.buffer], { type: mimeType });
    emit(options, {
      stage: "complete",
      progress: 1,
      outputBytes: blob.size,
      message: "Audio extraction complete.",
    });
    return { blob, filename, mimeType, size: blob.size };
  } catch (error) {
    cleanupJob(job, job.controller.signal.aborted ? "cancelled" : "failed");
    throw classifyError(error);
  } finally {
    try { input.dispose(); } catch { /* best effort */ }
    if (output && output.state === "started") {
      try { await output.cancel(); } catch { /* best effort */ }
    }
    job.input = undefined; job.output = undefined; job.conversion = undefined;
  }
}

export async function extractVideoFrame(file: File, timestamp: number, options: VideoProcessOptions = {}) {
  const frames = await extractFrames(file, { ...options, start: timestamp, end: timestamp + 0.001, fps: 1, maxFrames: 1 });
  return frames[0] ?? null;
}

export async function cancelVideoProcessing(jobId?: string): Promise<void> {
  const job = getCancellationJob(jobId);
  if (!job) return;
  job.state = "cancelling";
  if (!job.controller.signal.aborted) job.controller.abort();
  await Promise.allSettled([
    job.conversion ? job.conversion.cancel() : Promise.resolve(),
    job.output && job.output.state === "started" ? job.output.cancel() : Promise.resolve(),
  ]);
  try { job.input?.dispose(); } catch { /* best effort */ }
  cleanupJob(job, "cancelled");
}

export function getVideoToolErrorMessage(error: unknown): string {
  if (error instanceof VideoEngineError) return error.message;
  return classifyError(error).message;
}

function resolveMergeDimensions(metadata: VideoMetadata[], options: VideoProcessOptions): { width: number; height: number } {
  const firstWidth = metadata[0]?.width ?? 640;
  const firstHeight = metadata[0]?.height ?? 360;
  let width = options.width ?? firstWidth;
  let height = options.height ?? firstHeight;
  if (!Number.isFinite(width) || width <= 0 || !Number.isInteger(width)) throw new VideoEngineError("INVALID_OPTIONS", "Merge width must be a positive integer.");
  if (!Number.isFinite(height) || height <= 0 || !Number.isInteger(height)) throw new VideoEngineError("INVALID_OPTIONS", "Merge height must be a positive integer.");
  if (options.width !== undefined && options.height === undefined) height = Math.round(width * firstHeight / firstWidth);
  if (options.height !== undefined && options.width === undefined) width = Math.round(height * firstWidth / firstHeight);
  width = Math.max(2, Math.min(3840, Math.floor(width) & ~1));
  height = Math.max(2, Math.min(2160, Math.floor(height) & ~1));
  if (width * height > DEFAULT_VIDEO_LIMITS.maxPixels) throw new VideoEngineError("MEMORY_LIMIT", "The merge output resolution is too large for stable browser processing.");
  return { width, height };
}

export async function mergeVideos(files: File[], options: VideoProcessOptions = {}): Promise<VideoOutput> {
  validateMergeFiles(files);
  const job = createJobContext(options.signal, options.jobId);
  const jobOptions = { ...options, signal: job.controller.signal };
  startProgressWatchdog(job, 10 * 60 * 1000);
  let inputs: Input[] = [];
  let output: Output | null = null;
  let videoSource: import("mediabunny").VideoSampleSource | null = null;
  let audioSource: import("mediabunny").AudioSampleSource | null = null;
  let stopWriteListener: (() => void) | undefined;

  try {
    checkJobAbort(job);
    inputs = files.map(inputFor);
    emit(options, { stage: "reading", progress: 0.02, message: "Reading videos..." });
    const metadata = await Promise.all(inputs.map((input, index) => readMetadata(input, files[index])));
    metadata.forEach(validateSourceSafety);
    if (jobOptions.width !== undefined && (!Number.isFinite(jobOptions.width) || jobOptions.width <= 0 || !Number.isInteger(jobOptions.width))) {
      throw new VideoEngineError("INVALID_OPTIONS", "Merge width must be a positive integer.");
    }
    if (jobOptions.height !== undefined && (!Number.isFinite(jobOptions.height) || jobOptions.height <= 0 || !Number.isInteger(jobOptions.height))) {
      throw new VideoEngineError("INVALID_OPTIONS", "Merge height must be a positive integer.");
    }
    checkAbort(jobOptions.signal);

    const format = jobOptions.outputFormat ?? "mp4";
    const outputFormat = outputFormatInstance(format);
    const totalInputBytes = files.reduce((sum, file) => sum + file.size, 0);
    const aggregateMetadata: VideoMetadata = { ...metadata[0], fileSize: totalInputBytes, duration: metadata.reduce((sum, item) => sum + Math.max(0, item.duration ?? 0), 0) };
    const strategy = resolveOutputStrategy(totalInputBytes, aggregateMetadata, jobOptions, true, "merge");
    const preparedDownload = await prepareDownloadStream(`merged-video-workabhi.${format}`, jobOptions, strategy);
    const streamDownload = preparedDownload.streamed;
    const { width, height } = resolveMergeDimensions(metadata, jobOptions);
    const largestFrameBytes = Math.max(...metadata.map((m) => (m.width ?? 0) * (m.height ?? 0) * 4));
    const memory = deviceMemoryGB();
    const mergeBudget = memory !== null && memory <= 2 ? 96 * 1024 * 1024 : memory !== null && memory <= 4 ? 192 * 1024 * 1024 : DEFAULT_VIDEO_LIMITS.maxInMemoryOutputBytes;
    if (!streamDownload && largestFrameBytes > mergeBudget * 0.45) throw new VideoEngineError("MEMORY_LIMIT", "The merge resolution is too demanding for this device.");

    const estimatedDuration = metadata.reduce((sum, item) => sum + Math.max(0, item.duration ?? 0), 0);
    const estimatedFps = Math.min(60, Math.max(1, ...metadata.map((m) => m.frameRate ?? 30)));
    const estimatedOutputBytes = estimatedDuration * estimatedFps * width * height * 0.12;
    const outputMemoryLimit = recommendedMemoryOutputLimit();
    if (!streamDownload && estimatedOutputBytes > outputMemoryLimit * 0.75) {
      throw new VideoEngineError("MEMORY_LIMIT", "The estimated merged output is too large to keep safely in browser memory. Enable streamed output or reduce the target resolution.");
    }

    const outputContext = await createVideoOutput(
      format,
      `merged-video-workabhi.${format}`,
      streamDownload,
      preparedDownload.writable,
    );
    output = outputContext.output;
    const target = outputContext.bufferTarget;
    job.output = output;

    let outputBytes = 0;
    stopWriteListener = output.target.on(
      "write",
      ({ end }: { start: number; end: number }) => {
        outputBytes = Math.max(outputBytes, end);
      },
    );
    registerResourceCleanup(job, () => {
      stopWriteListener?.();
      stopWriteListener = undefined;
    });

    const q = quality(jobOptions.quality);
    const videoCodec = await chooseVideoCodec(outputFormat, width, height, q);
    const hasAnyAudio = metadata.some((m) => m.hasAudio);
    const audioCodec = hasAnyAudio ? await chooseAudioCodec(outputFormat) : null;

    if (!videoCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible video encoder is available for merging on this browser.");
    if (hasAnyAudio && !audioCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible audio encoder is available for merging on this browser.");

    const mb = await import("mediabunny");
    videoSource = new mb.VideoSampleSource({
      codec: videoCodec,
      quality: q,
      hardwareAcceleration: jobOptions.hardwareAcceleration ?? "no-preference",
      transform: { width, height, fit: "contain" },
      sizeChangeBehavior: "contain",
    });
    audioSource = audioCodec ? new mb.AudioSampleSource({ codec: audioCodec, quality: q }) : null;

    output.addVideoTrack(videoSource);
    if (audioSource) output.addAudioTrack(audioSource);

    emit(options, { stage: "planning", progress: 0.06, message: "Preparing merge pipeline..." });
    await output.start();

    const totalDuration = metadata.reduce((sum, item) => sum + Math.max(0, item.duration ?? 0), 0);
    let offset = 0;

    for (let fileIndex = 0; fileIndex < inputs.length; fileIndex += 1) {
      checkAbort(jobOptions.signal);
      const input = inputs[fileIndex];
      const videoTrack = await input.getPrimaryVideoTrack();
      const audioTrack = await input.getPrimaryAudioTrack();
      if (!videoTrack) throw new VideoEngineError("UNSUPPORTED_FORMAT", `Video ${fileIndex + 1} has no video track.`);

      const duration = Math.max(0, metadata[fileIndex].duration ?? 0);
      const clipOffset = offset;
      const videoSink = new VideoSampleSink(videoTrack);

      // Feed audio and video concurrently. Sequentially writing the complete
      // video track before audio can cause packet buffering/backpressure stalls.
      const pumpVideo = async () => {
        for await (const sample of videoSink.samples(0, duration || undefined)) {
          checkAbort(jobOptions.signal);
          try {
            sample.setTimestamp(sample.timestamp + clipOffset);
            await videoSource!.add(sample);

            if (totalDuration > 0) {
              emit(options, {
                stage: "encoding",
                progress: Math.min(
                  0.94,
                  0.06 + ((clipOffset + Math.max(0, sample.timestamp)) / totalDuration) * 0.88,
                ),
                processedSeconds: Math.min(totalDuration, clipOffset + Math.max(0, sample.timestamp)),
                duration: totalDuration,
                outputBytes: outputBytes || undefined,
                message: `Merging video ${fileIndex + 1} of ${inputs.length}...`,
              });
            }
          } finally {
            sample.close();
          }
        }
      };

      const pumpAudio = async () => {
        if (!audioSource) return;
        if (audioTrack) {
          const audioSink = new mb.AudioSampleSink(audioTrack);
          for await (const sample of audioSink.samples(0, duration || undefined)) {
            checkAbort(jobOptions.signal);
            try {
              sample.setTimestamp(sample.timestamp + clipOffset);
              await audioSource.add(sample);
            } finally {
              sample.close();
            }
          }
          return;
        }

        // Deterministic silence for clips without an audio track. A 48 kHz
        // stereo silence source is used in small chunks to avoid allocating
        // the whole silent duration at once.
        const sampleRate = 48_000;
        const channels = 2;
        const chunkSeconds = 1;
        for (let cursor = 0; cursor < duration; cursor += chunkSeconds) {
          checkAbort(jobOptions.signal);
          const seconds = Math.min(chunkSeconds, duration - cursor);
          const buffer = new AudioBuffer({ numberOfChannels: channels, length: Math.max(1, Math.round(seconds * sampleRate)), sampleRate });
          const silenceSamples = AudioSample.fromAudioBuffer(buffer, clipOffset + cursor);
          try {
            for (const silenceSample of silenceSamples) {
              checkAbort(jobOptions.signal);
              await audioSource.add(silenceSample);
            }
          } finally {
            for (const silenceSample of silenceSamples) {
              try { silenceSample.close(); } catch { /* best effort */ }
            }
          }
        }
      };

      const videoPromise = pumpVideo();
      const audioPromise = pumpAudio();
      try {
        await Promise.all([videoPromise, audioPromise]);
      } catch (error) {
        // Abort the owning job so the sibling pump observes cancellation.
        if (!job.controller.signal.aborted) job.controller.abort();
        await Promise.allSettled([videoPromise, audioPromise]);
        throw error;
      }
      offset += duration;

      emit(options, {
        stage: "encoding",
        progress: totalDuration > 0 ? Math.min(0.94, 0.06 + (offset / totalDuration) * 0.88) : Math.min(0.94, 0.06 + ((fileIndex + 1) / inputs.length) * 0.88),
        processedSeconds: offset,
        duration: totalDuration || undefined,
        message: `Merged ${fileIndex + 1} of ${inputs.length} videos...`,
      });
    }

    videoSource.close();
    audioSource?.close();
    emit(options, { stage: "finalizing", progress: 0.96, processedSeconds: offset, duration: totalDuration || undefined, message: "Finalizing merged video..." });
    await output.finalize();
    stopWriteListener?.();
    stopWriteListener = undefined;

    if (outputContext.streamedDownload) {
      emit(options, {
        stage: "complete",
        progress: 1,
        processedSeconds: offset,
        duration: totalDuration || undefined,
        outputBytes: outputBytes || undefined,
        message: "Download started. Streaming merged video to the browser...",
      });
      cleanupJob(job, "completed");
      return {
        blob: new Blob(),
        filename: `merged-video-workabhi.${format}`,
        mimeType: outputFormat.mimeType,
        size: outputBytes,
        streamedDownload: true,
      };
    }

    if (!target?.buffer || target.buffer.byteLength === 0) throw new VideoEngineError("OUTPUT_FAILED", "The merged video output is empty.");
    if (target.buffer.byteLength > recommendedMemoryOutputLimit()) {
      throw new VideoEngineError("MEMORY_LIMIT", "The merged output is too large to keep safely in browser memory on this device. Enable direct-to-disk saving.");
    }
    const blob = new Blob([target.buffer], { type: outputFormat.mimeType });
    emit(options, { stage: "complete", progress: 1, outputBytes: blob.size, processedSeconds: offset, duration: totalDuration || undefined, message: "Merge complete." });
    cleanupJob(job, "completed");
    return { blob, filename: `merged-video-workabhi.${format}`, mimeType: outputFormat.mimeType, size: blob.size };
  } catch (error) {
    cleanupJob(job, job.controller.signal.aborted ? "cancelled" : "failed");
    throw classifyError(error);
  } finally {
    try { videoSource?.close(); } catch { /* best effort */ }
    try { audioSource?.close(); } catch { /* best effort */ }
    inputs.forEach((input) => { try { input.dispose(); } catch { /* best effort */ } });
    job.output = undefined;
    stopWriteListener?.();
    if (output && output.state === "started") {
      try { await output.cancel(); } catch { /* best effort */ }
    }
  }
}