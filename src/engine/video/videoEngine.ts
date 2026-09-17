import {
  ALL_FORMATS,
  AudioSample,
  BlobSource,
  BufferTarget,
  Conversion,
  ConversionCanceledError,
  Input,
  Mp3OutputFormat,
  Output,
  Quality,
  VideoSampleSink,
  WavOutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  canEncodeAudio,
} from "mediabunny";

import type { AudioOutputFormat, VideoMetadata, VideoOutput, VideoProcessOptions, VideoProgress, VideoQuality, VideoToolId } from "./videoTypes";
import { DEFAULT_VIDEO_LIMITS, VideoEngineError } from "./videoTypes";
import { outputFormatInstance, outputMimeType } from "./videoCapabilities";
import { planVideoOperation } from "./videoPlanner";
import { createVideoOutput, getOutputBuffer } from "./videoOutput";
import { gifToVideo, videoToGif } from "./adapters/gifAdapter";
import { canUseVideoNativeFallback, processVideoWithNativeFallback } from "./videoNativeFallback";

let activeConversion: Conversion | null = null;
let activeOutput: Output | null = null;
let activeInput: Input | null = null;

function emit(options: VideoProcessOptions, progress: VideoProgress): void {
  options.onProgress?.({
    ...progress,
    progress: Math.max(0, Math.min(1, progress.progress)),
  });
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new VideoEngineError("CANCELLED", "Video processing was cancelled.");
}

function deviceInputLimit(): number {
  if (typeof navigator === "undefined") return DEFAULT_VIDEO_LIMITS.maxInputBytes;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory && memory <= 2) return 80 * 1024 * 1024;
  if (memory && memory <= 4) return 150 * 1024 * 1024;
  return DEFAULT_VIDEO_LIMITS.maxInputBytes;
}

function validateFile(file: File): void {
  if (!(file instanceof File) || file.size <= 0) {
    throw new VideoEngineError("INVALID_FILE", "Please select a valid, non-empty video file.");
  }
  const limit = Math.min(DEFAULT_VIDEO_LIMITS.maxInputBytes, deviceInputLimit());
  if (file.size > limit) {
    throw new VideoEngineError(
      "MEMORY_LIMIT",
      `This file is too large for reliable browser processing on this device. Please use a file smaller than ${Math.round(limit / 1048576)} MB or reduce its resolution first.`,
    );
  }
}

function validateMergeFiles(files: File[]): void {
  if (files.length < 2) throw new VideoEngineError("INVALID_FILE", "Please select at least 2 videos to merge.");
  if (files.length > DEFAULT_VIDEO_LIMITS.maxMergeFiles) {
    throw new VideoEngineError("INVALID_OPTIONS", `You can merge up to ${DEFAULT_VIDEO_LIMITS.maxMergeFiles} videos at once.`);
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > Math.min(DEFAULT_VIDEO_LIMITS.maxMergeBytes, deviceInputLimit() * 2)) {
    throw new VideoEngineError("MEMORY_LIMIT", "The combined videos are too large for stable browser processing on this device.");
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
  return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

async function ensureBrowserAudioEncoders(): Promise<void> {
  if (!(await canEncodeAudio("aac"))) {
    const { registerAacEncoder } = await import("@mediabunny/aac-encoder");
    registerAacEncoder();
  }
}

function hasNativeWebCodecs(): boolean {
  return typeof VideoDecoder !== "undefined" && typeof VideoEncoder !== "undefined";
}

function shouldUseNativeFallback(error: unknown): boolean {
  if (!canUseVideoNativeFallback()) return false;
  if (error instanceof VideoEngineError) {
    return ["BROWSER_UNSUPPORTED", "NOT_DECODABLE", "NOT_ENCODABLE", "UNSUPPORTED_CODEC", "PROCESSING_FAILED"].includes(error.code);
  }
  return true;
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

export async function getVideoMetadata(file: File, options: Pick<VideoProcessOptions, "signal" | "onProgress"> = {}): Promise<VideoMetadata> {
  validateFile(file);
  checkAbort(options.signal);
  emit({ ...options }, { stage: "reading", progress: 0, message: "Reading video metadata..." });
  const input = inputFor(file);
  activeInput = input;
  try {
    const metadata = await readMetadata(input, file);
    emit({ ...options }, { stage: "complete", progress: 1, processedSeconds: metadata.duration ?? undefined, duration: metadata.duration ?? undefined, message: "Video information ready." });
    return metadata;
  } catch (error) {
    throw classifyError(error);
  } finally {
    if (activeInput === input) activeInput = null;
    input.dispose();
  }
}

function safeDimensions(width: number | undefined, height: number | undefined, maxPixels: number): { width?: number; height?: number } {
  const w = width && Number.isFinite(width) ? Math.max(2, Math.floor(width)) : undefined;
  const h = height && Number.isFinite(height) ? Math.max(2, Math.floor(height)) : undefined;
  if (w && h && w * h > maxPixels) throw new VideoEngineError("MEMORY_LIMIT", "The requested output resolution is too large for stable browser processing.");
  return { width: w, height: h };
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
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (direction === "horizontal") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    sample.draw(ctx, 0, 0, width, height);
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

function makeSpeedAudioProcessor(speed: number) {
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
    return AudioSample.fromAudioBuffer(output, sample.timestamp / speed);
  };
}

async function convertSingle(file: File, toolId: VideoToolId, options: VideoProcessOptions): Promise<VideoOutput> {
  validateFile(file);
  if (!hasNativeWebCodecs()) {
    return processVideoWithNativeFallback(file, toolId, options);
  }
  await ensureBrowserAudioEncoders();
  const plan = planVideoOperation(toolId, options);
  const input = inputFor(file);
  activeInput = input;
  emit(options, { stage: "planning", progress: 0.03, message: plan.reason });

  let output: Output | null = null;
  let conversion: Conversion | null = null;

  try {
    const metadata = await readMetadata(input, file);
    checkAbort(options.signal);
    const dimensions = safeDimensions(options.width, options.height, DEFAULT_VIDEO_LIMITS.maxPixels);

    if (plan.execution === "copy" || plan.execution === "transcode") {
      const format = options.outputFormat ?? (toolId === "mp4-to-webm" ? "webm" : toolId === "webm-to-mp4" ? "mp4" : "mp4");
      const q = quality(options.quality);
      const outputFormat = outputFormatInstance(format);
      const needsVideo = toolId !== "extract-audio-from-video";
      const needsAudio = metadata.hasAudio && toolId !== "mute-video";
      const targetContext = await createVideoOutputForTool(format, filenameFor(file, format), options.saveDirectlyToDisk === true);
      output = targetContext.output;
      activeOutput = output;

      const videoNeedsEncoding = Boolean(
        needsVideo && (
          dimensions.width ||
          dimensions.height ||
          options.rotation ||
          options.crop ||
          toolId === "video-flipper" ||
          toolId === "video-speed-changer" ||
          plan.requiresVideoEncode
        ),
      );
      const audioNeedsEncoding = Boolean(
        needsAudio && (
          plan.requiresAudioEncode ||
          toolId === "video-volume-booster" ||
          toolId === "video-speed-changer"
        ),
      );

      const videoCodec = videoNeedsEncoding
        ? await chooseVideoCodec(outputFormat, dimensions.width ?? metadata.width ?? 640, dimensions.height ?? metadata.height ?? 360, q)
        : undefined;
      const audioCodec = audioNeedsEncoding
        ? await chooseAudioCodec(outputFormat)
        : undefined;

      if (videoNeedsEncoding && !videoCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible video encoder is available in this browser for the selected output.");
      if (audioNeedsEncoding && !audioCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible audio encoder is available in this browser for the selected output.");

      const trim = options.start !== undefined || options.end !== undefined
        ? { start: Math.max(0, options.start ?? 0), end: options.end !== undefined ? Math.max(0.001, options.end) : undefined }
        : undefined;
      if (trim?.end !== undefined && trim.end <= (trim.start ?? 0)) throw new VideoEngineError("INVALID_OPTIONS", "The end time must be greater than the start time.");

      const flipProcessor = toolId === "video-flipper"
        ? makeFlipProcessor(options.flip === "vertical" ? "vertical" : "horizontal", dimensions.width ?? metadata.width ?? 640, dimensions.height ?? metadata.height ?? 360)
        : undefined;
      const speed = Math.max(0.25, Math.min(4, options.speed ?? 1));
      const volumeMultiplier = Math.max(0, Math.min(4, options.volume ?? 1));

      const videoOptions: import("mediabunny").ConversionVideoOptions = {
        width: dimensions.width,
        height: dimensions.height,
        fit: dimensions.width && dimensions.height ? (options.fit ?? "contain") : undefined,
        rotate: options.rotation,
        crop: options.crop,
        codec: videoCodec ?? undefined,
        quality: videoCodec ? q : undefined,
        hardwareAcceleration: options.hardwareAcceleration ?? "no-preference",
        forceTranscode: plan.requiresVideoEncode || Boolean(flipProcessor) || toolId === "video-speed-changer",
        process: flipProcessor,
      };

      if (toolId === "video-speed-changer") {
        videoOptions.process = (sample: import("mediabunny").VideoSample) => {
          sample.setTimestamp(sample.timestamp / speed);
          sample.setDuration(sample.duration / speed);
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
            ? makeSpeedAudioProcessor(speed)
            : undefined,
      };

      conversion = await Conversion.init({
        input,
        output,
        tracks: "primary",
        video: needsVideo ? videoOptions : { discard: true },
        audio: needsAudio ? audioOptions : { discard: true },
        trim,
        copy: options.preferCopy === false || plan.requiresVideoEncode || plan.requiresAudioEncode ? false : { mode: "preferred", boundaryPolicy: "expand" },
        showWarnings: false,
      });
      activeConversion = conversion;

      if (!conversion.isValid) {
        throw new VideoEngineError("UNSUPPORTED_CODEC", "This browser cannot create the requested output from this file.");
      }

      const stopWriteListener = output.target.on("write", ({ end }: { start: number; end: number }) => {
        emit(options, { stage: "writing", progress: 0.95, outputBytes: end, message: "Writing output..." });
      });
      conversion.onProgress = (progress, processedTime) => {
        emit(options, {
          stage: progress < 0.05 ? "decoding" : progress < 0.9 ? "encoding" : "finalizing",
          progress: Math.max(0.05, Math.min(0.94, progress * 0.89 + 0.05)),
          processedSeconds: processedTime,
          duration: metadata.duration ?? undefined,
          message: progress < 0.9 ? "Processing video..." : "Finalizing output...",
        });
      };

      checkAbort(options.signal);
      await conversion.execute({ pauseSignal: options.signal });
      stopWriteListener();

      if (targetContext.directToDisk) {
        emit(options, { stage: "complete", progress: 1, message: "Saved directly to disk." });
        return {
          blob: new Blob(),
          filename: filenameFor(file, format),
          mimeType: outputFormat.mimeType,
          size: 0,
          directToDisk: true,
        };
      }

      const buffer = getOutputBuffer(output);
      if (buffer.byteLength > DEFAULT_VIDEO_LIMITS.maxInMemoryOutputBytes) {
        throw new VideoEngineError("MEMORY_LIMIT", "The output is too large to safely keep in browser memory. Use direct-to-disk saving for large outputs.");
      }
      const blob = new Blob([buffer], { type: outputFormat.mimeType || outputMimeType(format) });
      emit(options, { stage: "complete", progress: 1, outputBytes: blob.size, message: "Processing complete." });
      return { blob, filename: filenameFor(file, format), mimeType: blob.type, size: blob.size };
    }

    throw new VideoEngineError("PROCESSING_FAILED", "This operation is not supported by the selected engine path.");
  } catch (error) {
    throw classifyError(error);
  } finally {
    if (conversion && activeConversion === conversion) activeConversion = null;
    if (output && activeOutput === output) activeOutput = null;
    if (activeInput === input) activeInput = null;
    try { input.dispose(); } catch { /* best effort */ }
    if (output && output.state === "started") {
      try { await output.cancel(); } catch { /* best effort */ }
    }
  }
}

async function createVideoOutputForTool(format: "mp4" | "webm" | "mov" | "mkv", filename: string, direct: boolean) {
  return createVideoOutput(format, filename, direct);
}

async function extractFrames(file: File, options: VideoProcessOptions): Promise<Array<{ blob: Blob; filename: string }>> {
  validateFile(file);
  const input = inputFor(file);
  activeInput = input;
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new VideoEngineError("UNSUPPORTED_FORMAT", "No video track was found.");
    const duration = await input.getDurationFromMetadata() ?? 0;
    const fps = Math.max(0.1, Math.min(30, options.fps ?? 1));
    const maxFrames = Math.max(1, Math.min(DEFAULT_VIDEO_LIMITS.maxExtractFrames, options.maxFrames ?? 20));
    const start = Math.max(0, options.start ?? 0);
    const end = Math.min(duration || start + maxFrames / fps, (options.end ?? duration) || start + maxFrames / fps);
    const availableFrames = Math.max(1, Math.ceil(Math.max(0.001, end - start) * fps));
    const count = Math.min(maxFrames, availableFrames);
    const sink = new VideoSampleSink(track);
    const width = Math.min(DEFAULT_VIDEO_LIMITS.maxExtractDimension, await track.getDisplayWidth());
    const height = Math.min(DEFAULT_VIDEO_LIMITS.maxExtractDimension, await track.getDisplayHeight());
    const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable.");
    const results: Array<{ blob: Blob; filename: string }> = [];

    for (let i = 0; i < count; i += 1) {
      checkAbort(options.signal);
      const timestamp = Math.min(end, start + i / fps);
      const sample = await sink.getSample(timestamp);
      if (!sample) continue;
      try {
        const source = sample.toCanvasImageSource();
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(source, 0, 0, width, height);
        const blob = await canvasToJpeg(canvas);
        results.push({ blob, filename: `${baseName(file.name)}-${String(i + 1).padStart(3, "0")}.jpg` });
      } finally {
        sample.close();
      }
      emit(options, { stage: "decoding", progress: (i + 1) / count, processedSeconds: timestamp, duration, message: `Extracting frame ${i + 1} of ${count}...` });
    }
    return results;
  } finally {
    if (activeInput === input) activeInput = null;
    input.dispose();
  }
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
  checkAbort(options.signal);
  if (toolId === "video-to-gif") {
    const blob = await videoToGif(file, options);
    return { blob, filename: `${baseName(file.name)}-workabhi.gif`, mimeType: "image/gif", size: blob.size };
  }
  if (toolId === "gif-to-video") {
    const blob = await gifToVideo(file, options);
    return { blob, filename: `${baseName(file.name)}-workabhi.mp4`, mimeType: "video/mp4", size: blob.size };
  }
  if (toolId === "video-frame-extractor" || toolId === "video-thumbnail-generator" || toolId === "video-to-images") {
    throw new VideoEngineError("INVALID_OPTIONS", "Use the frame extraction API for this tool.");
  }
  if (toolId === "extract-audio-from-video") {
    return extractAudio(file, options);
  }
  try {
    return await convertSingle(file, toolId, options);
  } catch (error) {
    if (shouldUseNativeFallback(error)) {
      try {
        return await processVideoWithNativeFallback(file, toolId, options);
      } catch (fallbackError) {
        // Keep the original codec/engine error if the compatibility path also fails.
        throw error instanceof VideoEngineError ? error : fallbackError;
      }
    }
    throw error;
  }
}

async function extractAudio(file: File, options: VideoProcessOptions): Promise<VideoOutput> {
  validateFile(file);
  const format: AudioOutputFormat = options.audioOutputFormat ?? "wav";
  const input = inputFor(file);
  activeInput = input;
  let output: Output | null = null;
  let conversion: Conversion | null = null;
  try {
    const outputFormat = format === "mp3" ? new Mp3OutputFormat() : new WavOutputFormat();
    if (format === "mp3" && !(await canEncodeAudio("mp3"))) {
      const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
      registerMp3Encoder();
    }
    const target = new BufferTarget();
    output = new Output({ format: outputFormat, target });
    activeOutput = output;
    conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      video: { discard: true },
      audio: { quality: quality(options.quality), forceTranscode: format === "mp3" },
      copy: format === "wav" ? false : { mode: "preferred" },
      showWarnings: false,
    });
    activeConversion = conversion;
    if (!conversion.isValid) throw new VideoEngineError("UNSUPPORTED_CODEC", "The audio track cannot be decoded or encoded in this browser.");
    conversion.onProgress = (progress, processedSeconds) => emit(options, { stage: "encoding", progress, processedSeconds, message: "Extracting audio..." });
    await conversion.execute({ pauseSignal: options.signal });
    const buffer = target.buffer;
    if (!buffer) throw new VideoEngineError("OUTPUT_FAILED", "Audio output is empty.");
    const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
    const blob = new Blob([buffer], { type: mimeType });
    return { blob, filename: `${baseName(file.name)}-workabhi.${format}`, mimeType, size: blob.size };
  } catch (error) {
    throw classifyError(error);
  } finally {
    if (conversion && activeConversion === conversion) activeConversion = null;
    if (output && activeOutput === output) activeOutput = null;
    if (activeInput === input) activeInput = null;
    try { input.dispose(); } catch { /* best effort */ }
    if (output && output.state === "started") {
      try { await output.cancel(); } catch { /* best effort */ }
    }
  }
}

export async function extractVideoFrame(file: File, timestamp: number, options: VideoProcessOptions = {}) {
  const frames = await extractFrames(file, { ...options, start: timestamp, end: timestamp + 0.001, fps: 1, maxFrames: 1 });
  return frames[0] ?? null;
}

export async function cancelVideoProcessing(): Promise<void> {
  const conversion = activeConversion;
  const output = activeOutput;
  const input = activeInput;
  activeConversion = null;
  activeOutput = null;
  activeInput = null;
  await Promise.allSettled([
    conversion ? conversion.cancel() : Promise.resolve(),
    output && output.state !== "finalized" && output.state !== "canceled" ? output.cancel() : Promise.resolve(),
  ]);
  if (input) {
    try { input.dispose(); } catch { /* best effort */ }
  }
}

export function getVideoToolErrorMessage(error: unknown): string {
  if (error instanceof VideoEngineError) return error.message;
  return classifyError(error).message;
}

export async function mergeVideos(files: File[], options: VideoProcessOptions = {}): Promise<VideoOutput> {
  validateMergeFiles(files);
  checkAbort(options.signal);

  const inputs = files.map(inputFor);
  const metadata = await Promise.all(inputs.map((input, index) => readMetadata(input, files[index])));
  const format = options.outputFormat ?? "mp4";
  const outputFormat = outputFormatInstance(format);
  const outputContext = await createVideoOutput(format, `merged-video-workabhi.${format}`, options.saveDirectlyToDisk === true);
  const output = outputContext.output;
  const target = outputContext.bufferTarget;
  activeOutput = output;
  const q = quality(options.quality);
  const width = Math.max(...metadata.map((m) => m.width ?? 0), 2);
  const height = Math.max(...metadata.map((m) => m.height ?? 0), 2);
  const videoCodec = await chooseVideoCodec(outputFormat, Math.min(width, 3840), Math.min(height, 2160), q);
  const audioCodec = await chooseAudioCodec(outputFormat);
  if (!videoCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible video encoder is available for merging on this browser.");
  if (metadata.some((m) => m.hasAudio) && !audioCodec) throw new VideoEngineError("NOT_ENCODABLE", "No compatible audio encoder is available for merging on this browser.");

  const videoSource = new (await import("mediabunny")).VideoSampleSource({ codec: videoCodec, quality: q });
  const audioSource = audioCodec && metadata.some((m) => m.hasAudio)
    ? new (await import("mediabunny")).AudioSampleSource({ codec: audioCodec, quality: q })
    : null;
  output.addVideoTrack(videoSource);
  if (audioSource) output.addAudioTrack(audioSource);

  try {
    await output.start();
    let offset = 0;
    for (let fileIndex = 0; fileIndex < inputs.length; fileIndex += 1) {
      checkAbort(options.signal);
      const input = inputs[fileIndex];
      const videoTrack = await input.getPrimaryVideoTrack();
      const audioTrack = await input.getPrimaryAudioTrack();
      if (!videoTrack) throw new VideoEngineError("UNSUPPORTED_FORMAT", `Video ${fileIndex + 1} has no video track.`);
      const duration = metadata[fileIndex].duration ?? 0;
      const videoSink = new VideoSampleSink(videoTrack);
      for await (const sample of videoSink.samples(0, duration)) {
        checkAbort(options.signal);
        sample.setTimestamp(sample.timestamp + offset);
        await videoSource.add(sample);
        sample.close();
      }
      if (audioSource && audioTrack) {
        const audioSink = new (await import("mediabunny")).AudioSampleSink(audioTrack);
        for await (const sample of audioSink.samples(0, duration)) {
          checkAbort(options.signal);
          sample.setTimestamp(sample.timestamp + offset);
          await audioSource.add(sample);
          sample.close();
        }
      }
      offset += duration;
      emit(options, { stage: "encoding", progress: (fileIndex + 1) / inputs.length, processedSeconds: offset, duration: metadata.reduce((sum, item) => sum + (item.duration ?? 0), 0), message: `Merging video ${fileIndex + 1} of ${inputs.length}...` });
    }
    await output.finalize();
    if (outputContext.directToDisk) {
      return { blob: new Blob(), filename: `merged-video-workabhi.${format}`, mimeType: outputFormat.mimeType, size: 0, directToDisk: true };
    }
    if (!target?.buffer) throw new VideoEngineError("OUTPUT_FAILED", "The merged video output is empty.");
    if (target.buffer.byteLength > DEFAULT_VIDEO_LIMITS.maxInMemoryOutputBytes) {
      throw new VideoEngineError("MEMORY_LIMIT", "The merged output is too large to keep safely in browser memory. Use direct-to-disk saving.");
    }
    const blob = new Blob([target.buffer], { type: outputFormat.mimeType });
    return { blob, filename: `merged-video-workabhi.${format}`, mimeType: outputFormat.mimeType, size: blob.size };
  } catch (error) {
    throw classifyError(error);
  } finally {
    inputs.forEach((input) => input.dispose());
    if (activeOutput === output) activeOutput = null;
  }
}
