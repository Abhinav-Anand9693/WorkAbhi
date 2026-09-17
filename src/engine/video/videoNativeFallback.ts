import type { VideoOutput, VideoProcessOptions, VideoProgress, VideoToolId } from "./videoTypes";
import { VideoEngineError } from "./videoTypes";

interface FallbackResult extends VideoOutput {
  fallback: true;
}

function emit(options: VideoProcessOptions, progress: VideoProgress): void {
  options.onProgress?.({
    ...progress,
    progress: Math.max(0, Math.min(1, progress.progress)),
  });
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new VideoEngineError("CANCELLED", "Video processing was cancelled.");
  }
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function qualityBitrate(level: VideoProcessOptions["quality"], pixels: number): number {
  const perPixel = level === "low" ? 0.035 : level === "high" ? 0.12 : level === "original" ? 0.18 : 0.07;
  const estimated = Math.round(pixels * perPixel);
  return Math.max(350_000, Math.min(level === "original" ? 12_000_000 : 6_000_000, estimated));
}

function chooseRecorderMime(preferred: VideoProcessOptions["outputFormat"]): { mimeType: string; extension: "mp4" | "webm" } {
  const candidates: string[] = [];

  if (preferred === "mp4" || preferred === "mov" || preferred === "mkv" || !preferred) {
    candidates.push(
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
    );
  }

  candidates.push(
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  );

  for (const mimeType of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return {
          mimeType,
          extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm",
        };
      }
    } catch {
      // Continue with the next candidate.
    }
  }

  throw new VideoEngineError(
    "BROWSER_UNSUPPORTED",
    "This mobile browser cannot create a compatible video recording format.",
  );
}

function supportsFallback(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const canvas = document.createElement("canvas");
  return typeof canvas.captureStream === "function";
}

function waitForEvent(target: EventTarget, event: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(new VideoEngineError("CANCELLED", "Video processing was cancelled."));
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      signal?.removeEventListener("abort", onAbort);
    };
    target.addEventListener(event, onEvent, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function loadVideo(file: File, signal?: AbortSignal): Promise<{ video: HTMLVideoElement; url: string }> {
  checkAbort(signal);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.playsInline = true;
  video.muted = false;
  video.src = url;

  try {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await waitForEvent(video, "loadedmetadata", signal);
    }
    if (!Number.isFinite(video.duration) || video.videoWidth <= 0 || video.videoHeight <= 0) {
      throw new VideoEngineError("UNSUPPORTED_FORMAT", "This browser could not decode the selected video with its native media player.");
    }
    return { video, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function waitForRecorderStop(recorder: MediaRecorder, chunks: Blob[], signal?: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const onStop = () => {
      cleanup();
      if (!chunks.length) {
        reject(new VideoEngineError("OUTPUT_FAILED", "The mobile browser produced an empty video."));
        return;
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
    };
    const onError = () => {
      cleanup();
      reject(new VideoEngineError("PROCESSING_FAILED", "The mobile browser stopped video recording unexpectedly."));
    };
    const onAbort = () => {
      cleanup();
      try { recorder.stop(); } catch { /* best effort */ }
      reject(new VideoEngineError("CANCELLED", "Video processing was cancelled."));
    };
    const cleanup = () => {
      recorder.removeEventListener("stop", onStop);
      recorder.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    recorder.addEventListener("stop", onStop, { once: true });
    recorder.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function calculateCanvasSize(video: HTMLVideoElement, options: VideoProcessOptions, toolId: VideoToolId): { width: number; height: number } {
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;

  if (options.crop && toolId === "video-cropper") {
    sourceWidth = Math.min(sourceWidth, Math.max(2, options.crop.width));
    sourceHeight = Math.min(sourceHeight, Math.max(2, options.crop.height));
  }

  let width = options.width && options.width > 0 ? Math.round(options.width) : sourceWidth;
  let height = options.height && options.height > 0 ? Math.round(options.height) : sourceHeight;

  if (toolId === "video-compressor" && options.quality === "low") {
    const maxDimension = 1280;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  if (options.rotation === 90 || options.rotation === 270) {
    [width, height] = [height, width];
  }

  width = Math.max(2, Math.min(3840, width));
  height = Math.max(2, Math.min(3840, height));

  // Encoders are generally happier with even dimensions.
  width -= width % 2;
  height -= height % 2;

  return { width: Math.max(2, width), height: Math.max(2, height) };
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number,
  options: VideoProcessOptions,
  toolId: VideoToolId,
): void {
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const rotation = options.rotation ?? 0;
  const flipX = toolId === "video-flipper" && options.flip === "horizontal" ? -1 : 1;
  const flipY = toolId === "video-flipper" && options.flip === "vertical" ? -1 : 1;

  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipX, flipY);

  const drawWidth = rotation === 90 || rotation === 270 ? canvasHeight : canvasWidth;
  const drawHeight = rotation === 90 || rotation === 270 ? canvasWidth : canvasHeight;

  let sx = 0;
  let sy = 0;
  let sw = video.videoWidth;
  let sh = video.videoHeight;

  if (options.crop && toolId === "video-cropper") {
    sx = Math.max(0, Math.min(video.videoWidth - 2, options.crop.left));
    sy = Math.max(0, Math.min(video.videoHeight - 2, options.crop.top));
    sw = Math.max(2, Math.min(video.videoWidth - sx, options.crop.width));
    sh = Math.max(2, Math.min(video.videoHeight - sy, options.crop.height));
  }

  const sourceRatio = sw / sh;
  const targetRatio = drawWidth / drawHeight;
  let dw = drawWidth;
  let dh = drawHeight;

  const fit = options.fit ?? "contain";
  if (fit === "contain") {
    if (sourceRatio > targetRatio) dh = dw / sourceRatio;
    else dw = dh * sourceRatio;
  } else if (fit === "cover") {
    if (sourceRatio > targetRatio) dw = dh * sourceRatio;
    else dh = dw / sourceRatio;
  }

  ctx.drawImage(video, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

async function createAudioTrack(
  video: HTMLVideoElement,
  volume: number,
  muted: boolean,
): Promise<{ stream: MediaStream; cleanup: () => void }> {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor || muted) {
    return { stream: new MediaStream(), cleanup: () => undefined };
  }

  const audioContext = new AudioContextCtor();
  await audioContext.resume().catch(() => undefined);
  const source = audioContext.createMediaElementSource(video);
  const gain = audioContext.createGain();
  gain.gain.value = Math.max(0, Math.min(4, volume));
  const destination = audioContext.createMediaStreamDestination();
  source.connect(gain);
  gain.connect(destination);

  return {
    stream: destination.stream,
    cleanup: () => {
      try { source.disconnect(); } catch { /* best effort */ }
      try { gain.disconnect(); } catch { /* best effort */ }
      void audioContext.close().catch(() => undefined);
    },
  };
}

export function canUseVideoNativeFallback(): boolean {
  return supportsFallback();
}

export async function processVideoWithNativeFallback(
  file: File,
  toolId: VideoToolId,
  options: VideoProcessOptions = {},
): Promise<FallbackResult> {
  if (!supportsFallback()) {
    throw new VideoEngineError("BROWSER_UNSUPPORTED", "This browser does not provide a compatible mobile video processing path.");
  }

  if (toolId === "video-merger" || toolId === "extract-audio-from-video" || toolId === "video-to-gif" || toolId === "gif-to-video") {
    throw new VideoEngineError("BROWSER_UNSUPPORTED", "This operation needs a media codec that is unavailable in this browser.");
  }

  checkAbort(options.signal);
  emit(options, { stage: "reading", progress: 0.02, message: "Opening video with the mobile browser media engine..." });

const { video, url } = await loadVideo(file, options.signal);

let audioCleanup: () => void = () => {};
let recorder: MediaRecorder | null = null;

try {
  checkAbort(options.signal);

  const duration = Number.isFinite(video.duration)
    ? video.duration
    : 0;

  /*
   * Start time
   *
   * Never allow start to be:
   * - negative
   * - greater than the video duration
   */
  const start = Math.max(
    0,
    Math.min(
      duration,
      options.start ?? 0
    )
  );

  /*
   * End time
   *
   * We intentionally use ?? instead of mixing ?? with ||.
   *
   * If options.end is provided, use it.
   * Otherwise process until the end of the video.
   */
  const requestedEnd = options.end ?? duration;

  const end = Math.max(
    start + 0.001,
    Math.min(
      duration,
      requestedEnd
    )
  );

  /*
   * Playback speed
   *
   * Keep the browser-native fallback within
   * a safe range.
   */
  const speed = Math.max(
    0.25,
    Math.min(
      4,
      options.speed ?? 1
    )
  );

  /*
   * Audio volume
   *
   * 0   = muted
   * 1   = original volume
   * >1  = boosted volume
   */
  const volume = Math.max(
    0,
    Math.min(
      4,
      options.volume ?? 1
    )
  );

  /*
   * Calculate the final canvas dimensions.
   *
   * This handles:
   * - resize
   * - crop
   * - rotation
   * - normal video processing
   */
  const { width, height } = calculateCanvasSize(
    video,
    options,
    toolId
  );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas video processing is unavailable on this device.");

    const fps = Math.max(15, Math.min(30, options.fps && options.fps > 0 ? options.fps : 30));
    const canvasStream = canvas.captureStream(fps);
    const audio = await createAudioTrack(
      video,
      toolId === "video-volume-booster" ? volume : 1,
      toolId === "mute-video",
    );
    audioCleanup = audio.cleanup;

    for (const track of audio.stream.getAudioTracks()) canvasStream.addTrack(track);

    const recorderInfo = chooseRecorderMime(options.outputFormat);
    const pixels = width * height;
    const videoBitsPerSecond = qualityBitrate(options.quality, pixels);
    const audioBitsPerSecond = toolId === "mute-video" ? undefined : 128_000;

    recorder = new MediaRecorder(canvasStream, {
      mimeType: recorderInfo.mimeType,
      videoBitsPerSecond,
      ...(audioBitsPerSecond ? { audioBitsPerSecond } : {}),
    });

    const chunks: Blob[] = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });

    const stopped = waitForRecorderStop(recorder, chunks, options.signal);

    if (Math.abs(video.currentTime - start) > 0.01) {
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => {
          cleanup();
          resolve();
        };
        const onAbort = () => {
          cleanup();
          reject(new VideoEngineError("CANCELLED", "Video processing was cancelled."));
        };
        const cleanup = () => {
          video.removeEventListener("seeked", onSeeked);
          options.signal?.removeEventListener("abort", onAbort);
        };
        video.addEventListener("seeked", onSeeked, { once: true });
        options.signal?.addEventListener("abort", onAbort, { once: true });
        video.currentTime = start;
      });
    }
    video.playbackRate = speed;

    let raf = 0;
    let ended = false;

    const render = () => {
      if (ended) return;
      try {
        checkAbort(options.signal);
        drawFrame(ctx, video, width, height, options, toolId);
        const current = video.currentTime;
        const effectiveProgress = duration > 0 ? Math.max(0, Math.min(1, (current - start) / Math.max(0.001, end - start))) : 0;
        emit(options, {
          stage: "encoding",
          progress: 0.05 + effectiveProgress * 0.88,
          processedSeconds: current,
          duration,
          message: "Processing video on the mobile browser engine...",
        });
        if (current >= end || video.ended) {
          ended = true;
          try { video.pause(); } catch { /* best effort */ }
          try { recorder?.stop(); } catch { /* best effort */ }
          return;
        }
        raf = requestAnimationFrame(render);
      } catch {
        ended = true;
        try { recorder?.stop(); } catch { /* best effort */ }
      }
    };

    recorder.start(1000);
    try {
      await video.play();
    } catch (playError) {
      // Some mobile browsers reject unmuted programmatic playback after an async operation.
      // Retry muted so the video pipeline can still run; the audio track, when available,
      // is supplied independently through Web Audio.
      video.muted = true;
      try {
        await video.play();
      } catch {
        throw new VideoEngineError("BROWSER_UNSUPPORTED", "The mobile browser did not allow local video playback for processing.", playError);
      }
    }
    render();

    const blob = await stopped;
    if (raf) cancelAnimationFrame(raf);

    emit(options, {
      stage: "complete",
      progress: 1,
      duration,
      processedSeconds: duration,
      outputBytes: blob.size,
      message: `Processed locally using the mobile-compatible ${recorderInfo.extension.toUpperCase()} engine.`,
    });

    const filename = `${baseName(file.name)}-workabhi.${recorderInfo.extension}`;
    return {
      blob,
      filename,
      mimeType: blob.type || `video/${recorderInfo.extension}`,
      size: blob.size,
      directToDisk: false,
      fallback: true,
    };
  } catch (error) {
    if (error instanceof VideoEngineError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new VideoEngineError("CANCELLED", "Video processing was cancelled.", error);
    }
    throw new VideoEngineError(
      "PROCESSING_FAILED",
      "The mobile browser could not process this video. Try a shorter video or a lower resolution.",
      error,
    );
  } finally {
    try { if (recorder && recorder.state !== "inactive") recorder.stop(); } catch { /* best effort */ }
    audioCleanup();
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
