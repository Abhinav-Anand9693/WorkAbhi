import type { VideoOutput, VideoProcessOptions, VideoProgress, VideoToolId } from "./videoTypes";
import { VideoEngineError } from "./videoTypes";
import { resolveVideoTransformPlan } from "./videoTransform";

interface FallbackResult extends VideoOutput { fallback: true }

const MAX_FALLBACK_OUTPUT_BYTES = 256 * 1024 * 1024;
const MAX_FALLBACK_DURATION_SECONDS = 20 * 60;
const MEDIA_EVENT_TIMEOUT_MS = 45_000;

function emit(options: VideoProcessOptions, progress: VideoProgress): void {
  const p = Math.max(0, Math.min(1, progress.progress));
  options.onProgress?.({ ...progress, progress: p });
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new VideoEngineError("CANCELLED", "Video processing was cancelled.");
}

function baseName(name: string): string { return name.replace(/\.[^.]+$/, ""); }

function qualityBitrate(level: VideoProcessOptions["quality"], pixels: number): number {
  const perPixel = level === "low" ? 0.035 : level === "high" ? 0.12 : level === "original" ? 0.18 : 0.07;
  const estimated = Math.round(pixels * perPixel);
  return Math.max(350_000, Math.min(level === "original" ? 12_000_000 : 6_000_000, estimated));
}

function chooseRecorderMime(preferred: VideoProcessOptions["outputFormat"]): { mimeType: string; extension: "mp4" | "webm" } {
  const candidates: string[] = [];
  if (preferred === "mp4" || preferred === "mov" || preferred === "mkv" || !preferred) {
    candidates.push("video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4");
  }
  candidates.push("video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm");
  for (const mimeType of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
        return { mimeType, extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm" };
      }
    } catch { /* try next */ }
  }
  throw new VideoEngineError("BROWSER_UNSUPPORTED", "This browser cannot create a compatible native video recording format.");
}

function supportsFallback(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const canvas = document.createElement("canvas");
  return typeof canvas.captureStream === "function";
}

function waitForMediaReady(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      cleanup();
      reject(new VideoEngineError("TIMEOUT", "The browser media decoder did not load the video in time."));
    }, MEDIA_EVENT_TIMEOUT_MS);
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      video.removeEventListener("abort", onAbortEvent);
      video.removeEventListener("stalled", onStalled);
      signal?.removeEventListener("abort", onSignalAbort);
    };
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new VideoEngineError("NOT_DECODABLE", "The browser could not decode this video with its native media engine.")); };
    const onAbortEvent = () => { cleanup(); reject(new VideoEngineError("DECODING_FAILED", "The browser aborted video loading.")); };
    const onStalled = () => { /* The timeout protects against a permanent stall. */ };
    const onSignalAbort = () => { cleanup(); reject(new VideoEngineError("CANCELLED", "Video processing was cancelled.")); };
    video.addEventListener("loadedmetadata", onReady, { once: true });
    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.addEventListener("abort", onAbortEvent, { once: true });
    video.addEventListener("stalled", onStalled);
    signal?.addEventListener("abort", onSignalAbort, { once: true });
  });
}

async function loadVideo(file: File, signal?: AbortSignal): Promise<{ video: HTMLVideoElement; url: string }> {
  checkAbort(signal);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.playsInline = true;
  video.src = url;
  try {
    await waitForMediaReady(video, signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.videoWidth < 2 || video.videoHeight < 2) {
      throw new VideoEngineError("NOT_DECODABLE", "The browser could not read valid video metadata.");
    }
    return { video, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number,
  plan: ReturnType<typeof resolveVideoTransformPlan>,
): void {
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((plan.rotation * Math.PI) / 180);
  ctx.scale(plan.flipX ? -1 : 1, plan.flipY ? -1 : 1);

  const { left, top, width: sourceWidth, height: sourceHeight } = plan.sourceRect;
  const rotatedWidth = plan.rotation === 90 || plan.rotation === 270 ? canvasHeight : canvasWidth;
  const rotatedHeight = plan.rotation === 90 || plan.rotation === 270 ? canvasWidth : canvasHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = rotatedWidth / rotatedHeight;
  let drawWidth = rotatedWidth;
  let drawHeight = rotatedHeight;
  if (plan.fit === "contain") {
    if (sourceRatio > targetRatio) drawHeight = drawWidth / sourceRatio;
    else drawWidth = drawHeight * sourceRatio;
  } else if (plan.fit === "cover") {
    if (sourceRatio > targetRatio) drawWidth = drawHeight * sourceRatio;
    else drawHeight = drawWidth / sourceRatio;
  }
  ctx.drawImage(video, left, top, sourceWidth, sourceHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

async function createAudioTrack(video: HTMLVideoElement, volume: number, muted: boolean): Promise<{ stream: MediaStream; cleanup: () => void }> {
  if (muted) return { stream: new MediaStream(), cleanup: () => undefined };
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return { stream: new MediaStream(), cleanup: () => undefined };

  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaElementSource(video);
  const gain = audioContext.createGain();
  gain.gain.value = volume;
  source.connect(gain);

  // For boosts, a dynamics compressor is used after gain so values are not
  // simply hard-clipped at [-1, 1]. It is intentionally deterministic rather
  // than pretending to be a transparent mastering limiter.
  let compressor: DynamicsCompressorNode | null = null;
  if (volume > 1) {
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    gain.connect(compressor);
  }
  const destination = audioContext.createMediaStreamDestination();
  (compressor ?? gain).connect(destination);
  await audioContext.resume().catch(() => undefined);

  return {
    stream: destination.stream,
    cleanup: () => {
      try { source.disconnect(); } catch { /* best effort */ }
      try { gain.disconnect(); } catch { /* best effort */ }
      try { compressor?.disconnect(); } catch { /* best effort */ }
      void audioContext.close().catch(() => undefined);
    },
  };
}

function waitForRecorderStop(
  recorder: MediaRecorder,
  chunks: Blob[],
  signal: AbortSignal | undefined,
  getFailure: () => VideoEngineError | null,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      recorder.removeEventListener("stop", onStop);
      recorder.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    const onStop = () => {
      cleanup();
      const failure = getFailure();
      if (failure) { reject(failure); return; }
      if (!chunks.length) { reject(new VideoEngineError("OUTPUT_FAILED", "The native browser recorder produced an empty video.")); return; }
      resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
    };
    const onError = () => { cleanup(); reject(new VideoEngineError("ENCODING_FAILED", "The native browser recorder failed.")); };
    const onAbort = () => {
      cleanup();
      try { if (recorder.state !== "inactive") recorder.stop(); } catch { /* best effort */ }
      reject(new VideoEngineError("CANCELLED", "Video processing was cancelled."));
    };
    recorder.addEventListener("stop", onStop, { once: true });
    recorder.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function canUseVideoNativeFallback(): boolean { return supportsFallback(); }

export async function processVideoWithNativeFallback(
  file: File,
  toolId: VideoToolId,
  options: VideoProcessOptions = {},
): Promise<FallbackResult> {
  if (!supportsFallback()) throw new VideoEngineError("BROWSER_UNSUPPORTED", "This browser does not provide the native video fallback.");
  if (["video-merger", "extract-audio-from-video", "video-to-gif", "gif-to-video"].includes(toolId)) {
    throw new VideoEngineError("BROWSER_UNSUPPORTED", "The native fallback does not support this operation without changing its semantics.");
  }

  const { video, url } = await loadVideo(file, options.signal);
  let audioCleanup: () => void = () => undefined;
  let recorder: MediaRecorder | null = null;
  let raf = 0;
  try {
    checkAbort(options.signal);
    const duration = video.duration;
    if (duration > MAX_FALLBACK_DURATION_SECONDS) {
      throw new VideoEngineError("MEMORY_LIMIT", "The native browser fallback is limited to shorter videos to avoid unbounded MediaRecorder memory usage.");
    }

    const metadata = {
      mimeType: video.currentSrc ? "video/*" : "video/*",
      format: "native",
      duration,
      width: video.videoWidth,
      height: video.videoHeight,
      rotation: 0,
      videoCodec: null,
      audioCodec: null,
      frameRate: 30,
      hasAudio: true,
      fileSize: file.size,
    };
    const plan = resolveVideoTransformPlan(metadata, options, toolId);
    const { width, height } = { width: plan.outputWidth, height: plan.outputHeight };

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new VideoEngineError("BROWSER_UNSUPPORTED", "Canvas processing is unavailable on this browser.");

    const fps = options.fps ?? 30;
    const canvasStream = canvas.captureStream(Math.max(15, Math.min(30, fps)));
    const audio = await createAudioTrack(video, toolId === "video-volume-booster" ? (options.volume ?? 1) : 1, toolId === "mute-video");
    audioCleanup = audio.cleanup;
    for (const track of audio.stream.getAudioTracks()) canvasStream.addTrack(track);

    const recorderInfo = chooseRecorderMime(options.outputFormat);
    const recorderBits = qualityBitrate(options.quality, width * height);
    recorder = new MediaRecorder(canvasStream, {
      mimeType: recorderInfo.mimeType,
      videoBitsPerSecond: recorderBits,
      audioBitsPerSecond: toolId === "mute-video" ? undefined : 128_000,
    });

    const chunks: Blob[] = [];
    let recordedBytes = 0;
    let recordingFailure: VideoEngineError | null = null;
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size <= 0 || recordingFailure) return;
      recordedBytes += event.data.size;
      if (recordedBytes > MAX_FALLBACK_OUTPUT_BYTES) {
        recordingFailure = new VideoEngineError("MEMORY_LIMIT", "The native fallback output exceeded the safe in-memory limit.");
        try { if (recorder?.state !== "inactive") recorder?.stop(); } catch { /* best effort */ }
        return;
      }
      chunks.push(event.data);
    });

    const start = options.start ?? 0;
    const end = options.end ?? duration;

    if (Math.abs(video.currentTime - start) > 0.01) {
      await new Promise<void>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => { cleanup(); reject(new VideoEngineError("TIMEOUT", "The browser video seek stalled.")); }, MEDIA_EVENT_TIMEOUT_MS);
        const cleanup = () => { if (timer) clearTimeout(timer); timer = null; video.removeEventListener("seeked", onSeeked); video.removeEventListener("error", onError); options.signal?.removeEventListener("abort", onAbort); };
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new VideoEngineError("DECODING_FAILED", "The browser failed while seeking the video.")); };
        const onAbort = () => { cleanup(); reject(new VideoEngineError("CANCELLED", "Video processing was cancelled.")); };
        video.addEventListener("seeked", onSeeked, { once: true });
        video.addEventListener("error", onError, { once: true });
        options.signal?.addEventListener("abort", onAbort, { once: true });
        video.currentTime = start;
      });
    }

    video.playbackRate = options.speed ?? 1;
    try {
      recorder.start(1000);
    } catch (error) {
      throw new VideoEngineError("ENCODING_FAILED", "The browser could not start its native recorder.", error);
    }
    const stopped = waitForRecorderStop(recorder, chunks, options.signal, () => recordingFailure);
    try {
      video.muted = true;
      await video.play();
    } catch (error) {
      throw new VideoEngineError("BROWSER_UNSUPPORTED", "The browser did not allow local video playback for the fallback engine.", error);
    }

    let lastMediaTime = video.currentTime;
    let lastMediaAdvanceAt = performance.now();
    const render = () => {
      if (recordingFailure || options.signal?.aborted) return;
      try {
        checkAbort(options.signal);
        drawFrame(ctx, video, width, height, plan);
        const current = video.currentTime;
        if (current > lastMediaTime + 0.001) {
          lastMediaTime = current;
          lastMediaAdvanceAt = performance.now();
        } else if (performance.now() - lastMediaAdvanceAt > 30_000) {
          throw new VideoEngineError("TIMEOUT", "The native video renderer stalled.");
        }
        const p = Math.max(0, Math.min(1, (current - start) / Math.max(0.001, end - start)));
        emit(options, { stage: "encoding", progress: 0.05 + p * 0.88, processedSeconds: current, duration, outputBytes: recordedBytes || undefined, message: "Processing locally with the browser fallback..." });
        if (current >= end || video.ended) {
          try { video.pause(); } catch { /* best effort */ }
          try { if (recorder?.state !== "inactive") recorder?.stop(); } catch { /* best effort */ }
          return;
        }
        raf = requestAnimationFrame(render);
      } catch (error) {
        recordingFailure = error instanceof VideoEngineError ? error : new VideoEngineError("PROCESSING_FAILED", "The native fallback failed while rendering the video.", error);
        try { if (recorder?.state !== "inactive") recorder?.stop(); } catch { /* best effort */ }
      }
    };

    emit(options, { stage: "reading", progress: 0.02, message: "Opening video with the browser fallback..." });
    render();
    const blob = await stopped;
    if (raf) cancelAnimationFrame(raf);
    if (blob.size <= 0) throw new VideoEngineError("OUTPUT_FAILED", "The browser fallback produced an empty output.");

    emit(options, { stage: "complete", progress: 1, duration, processedSeconds: end, outputBytes: blob.size, message: `Processed locally using the ${recorderInfo.extension.toUpperCase()} browser fallback.` });
    return { blob, filename: `${baseName(file.name)}-workabhi.${recorderInfo.extension}`, mimeType: blob.type || `video/${recorderInfo.extension}`, size: blob.size, streamedDownload: false, fallback: true };
  } catch (error) {
    if (error instanceof VideoEngineError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new VideoEngineError("CANCELLED", "Video processing was cancelled.", error);
    throw new VideoEngineError("PROCESSING_FAILED", "The browser fallback could not process this video.", error);
  } finally {
    if (raf) cancelAnimationFrame(raf);
    try { if (recorder && recorder.state !== "inactive") recorder.stop(); } catch { /* best effort */ }
    audioCleanup();
    try { video.pause(); } catch { /* best effort */ }
    video.removeAttribute("src");
    try { video.load(); } catch { /* best effort */ }
    URL.revokeObjectURL(url);
  }
}
