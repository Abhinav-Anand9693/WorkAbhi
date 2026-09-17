import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";
import {
  AudioSample,
  AudioSampleSource,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSink,
  VideoSampleSource,
  Input,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
} from "mediabunny";
import type { VideoProcessOptions } from "../videoTypes";
import { VideoEngineError } from "../videoTypes";

interface GifFrame {
  patch: Uint8ClampedArray;
  dims: { top: number; left: number; width: number; height: number };
  delay: number;
  disposalType: number;
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new VideoEngineError("CANCELLED", "Video processing was cancelled.");
}

export async function videoToGif(file: File, options: VideoProcessOptions = {}): Promise<Blob> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new VideoEngineError("UNSUPPORTED_FORMAT", "No video track was found.");

    const duration = await input.getDurationFromMetadata() ?? 0;
    const width = await track.getDisplayWidth();
    const height = await track.getDisplayHeight();
    const maxDimension = Math.max(width, height);
    const targetDimension = Math.min(options.width ?? maxDimension, options.height ?? maxDimension, 720);
    const scale = Math.min(1, targetDimension / maxDimension);
    const outputWidth = Math.max(2, Math.round(width * scale) & ~1);
    const outputHeight = Math.max(2, Math.round(height * scale) & ~1);
    const fps = Math.min(15, Math.max(1, options.fps ?? 10));
    const maxFrames = Math.min(180, Math.max(1, options.maxFrames ?? 120));
    const start = Math.max(0, options.start ?? 0);
    const end = Math.min(duration || Number.POSITIVE_INFINITY, (options.end ?? duration) || Number.POSITIVE_INFINITY);
    const effectiveEnd = Math.max(start, end);
    const requestedFrames = Math.ceil(Math.max(0.001, effectiveEnd - start) * fps);
    const frameCount = Math.min(maxFrames, requestedFrames);

    if (outputWidth * outputHeight > 720 * 720) {
      throw new VideoEngineError("MEMORY_LIMIT", "The GIF resolution is too high for stable browser processing.");
    }

    const sink = new VideoSampleSink(track);
    const canvas = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(outputWidth, outputHeight)
      : document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable in this browser.");

    const gif = GIFEncoder();
    for (let i = 0; i < frameCount; i += 1) {
      checkAbort(options.signal);
      const timestamp = Math.min(effectiveEnd, start + i / fps);
      const sample = await sink.getSample(timestamp);
      if (!sample) continue;
      try {
        const source = sample.toCanvasImageSource();
        ctx.clearRect(0, 0, outputWidth, outputHeight);
        ctx.drawImage(source, 0, 0, outputWidth, outputHeight);
        const rgba = ctx.getImageData(0, 0, outputWidth, outputHeight).data;
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);
        gif.writeFrame(index, outputWidth, outputHeight, {
          palette,
          delay: Math.max(20, Math.round(1000 / fps)),
          repeat: 0,
        });
      } finally {
        sample.close();
      }
      options.onProgress?.({
        stage: "encoding",
        progress: (i + 1) / frameCount,
        processedSeconds: timestamp,
        duration: effectiveEnd,
        message: "Encoding GIF frames...",
      });
    }

  gif.finish();

const encodedBytes = gif.bytes();

const blobBytes = new Uint8Array(encodedBytes.byteLength);
blobBytes.set(encodedBytes);

return new Blob([blobBytes.buffer], {
  type: "image/gif",
});
  } finally {
    input.dispose();
  }
}

export async function gifToVideo(file: File, options: VideoProcessOptions = {}): Promise<Blob> {
  if (file.size > 50 * 1024 * 1024) {
    throw new VideoEngineError("MEMORY_LIMIT", "This GIF is too large for reliable browser decoding. Try a smaller GIF.");
  }

  const buffer = await file.arrayBuffer();
  checkAbort(options.signal);
  const parsed = parseGIF(buffer);
  const frames = decompressFrames(parsed, true) as GifFrame[];
  if (!frames.length) throw new VideoEngineError("INVALID_FILE", "No animation frames were found in the GIF.");
  if (frames.length > 180) throw new VideoEngineError("MEMORY_LIMIT", "This GIF contains too many frames for stable browser conversion.");

  const sourceWidth = parsed.lsd.width;
  const sourceHeight = parsed.lsd.height;
  const scale = Math.min(1, 720 / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(2, Math.floor(sourceWidth * scale) & ~1);
  const height = Math.max(2, Math.floor(sourceHeight * scale) & ~1);

  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable in this browser.");

  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
  const videoSource = new VideoSampleSource({ codec: "avc", quality: new Quality("medium") });
  output.addVideoTrack(videoSource);
  await output.start();

  let timestamp = 0;
  let previousSnapshot: ImageData | null = null;

  try {
    for (let i = 0; i < frames.length; i += 1) {
      checkAbort(options.signal);
      const frame = frames[i];
      if (frame.disposalType === 3) {
        previousSnapshot = ctx.getImageData(0, 0, width, height);
      }

      const patchCanvas = typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(frame.dims.width, frame.dims.height)
        : document.createElement("canvas");
      patchCanvas.width = frame.dims.width;
      patchCanvas.height = frame.dims.height;
      const patchCtx = patchCanvas.getContext("2d");
      if (!patchCtx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable.");
      const patchImage = patchCtx.createImageData(frame.dims.width, frame.dims.height);
      patchImage.data.set(frame.patch);
      patchCtx.putImageData(patchImage, 0, 0);
      ctx.drawImage(
        patchCanvas,
        frame.dims.left,
        frame.dims.top,
        frame.dims.width,
        frame.dims.height,
      );

      const frameCanvasSource = canvas;
      const duration = Math.max(0.02, (frame.delay || 50) / 1000);
      const sample = new VideoSample(frameCanvasSource, {
        timestamp,
        duration,
      });
      await videoSource.add(sample);
      sample.close();
      timestamp += duration;

      if (frame.disposalType === 2) {
        ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
      } else if (frame.disposalType === 3 && previousSnapshot) {
        ctx.putImageData(previousSnapshot, 0, 0);
        previousSnapshot = null;
      }

      options.onProgress?.({
        stage: "encoding",
        progress: (i + 1) / frames.length,
        processedSeconds: timestamp,
        duration: timestamp,
        message: "Encoding GIF frames into video...",
      });
    }

    await output.finalize();
    const target = output.target as BufferTarget;
    if (!target.buffer) throw new VideoEngineError("OUTPUT_FAILED", "The video output buffer is empty.");
    return new Blob([target.buffer], { type: "video/mp4" });
  } catch (error) {
    try { await output.cancel(); } catch { /* best effort */ }
    throw error;
  }
}
