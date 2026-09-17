"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { resolveTool } from "@/lib/toolRegistry";
import {
  cancelVideoProcessing,
  extractVideoFrame,
  extractVideoImages,
  getVideoMetadata,
  getVideoToolErrorMessage,
  mergeVideos,
  processVideo,
} from "@/engine/video/videoEngine";
import type { VideoMetadata, VideoOutput, VideoProcessOptions, VideoProgress, VideoQuality } from "@/engine/video/videoTypes";

interface VideoToolProps {
  toolId: string;
}

const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-matroska,video/*,.mp4,.webm,.mov,.mkv,.m4v,.mpeg,.mpg,.ts,.ogv";
const GIF_ACCEPT = "image/gif,.gif";



export default function VideoTool({ toolId }: VideoToolProps) {
 const title = (() => {
  try {
    return resolveTool(toolId)?.name ?? "Video Tool";
  } catch {
    return "Video Tool";
  }
})();
  const isGifOutput = toolId === "video-to-gif";
  const merger = toolId === "video-merger";
  const metadataTool = toolId === "video-metadata-viewer";
  const frameTool = toolId === "video-frame-extractor" || toolId === "video-thumbnail-generator" || toolId === "video-to-images";
  const gifInput = toolId === "gif-to-video";

  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<VideoOutput | null>(null);
  const [images, setImages] = useState<Array<{ blob: Blob; filename: string }>>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
   const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quality, setQuality] = useState<VideoQuality>("medium");
  const [format, setFormat] = useState<"mp4" | "webm" | "mov" | "mkv">(toolId === "mp4-to-webm" ? "webm" : "mp4");
  const [audioFormat, setAudioFormat] = useState<"wav" | "mp3">("wav");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [cropLeft, setCropLeft] = useState("0");
  const [cropTop, setCropTop] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [flip, setFlip] = useState<"horizontal" | "vertical">("horizontal");
  const [speed, setSpeed] = useState("1");
  const [volume, setVolume] = useState("2");
  const [fps, setFps] = useState(frameTool ? "1" : "10");
  const [maxFrames, setMaxFrames] = useState(frameTool ? "20" : "120");
  const [frameTime, setFrameTime] = useState("0");
  const [directToDisk, setDirectToDisk] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
      void cancelVideoProcessing();
    };
  }, []);

  const previewUrl = useMemo(() => {
  if (!result?.blob || result.blob.size === 0) {
    return null;
  }

  return URL.createObjectURL(result.blob);
}, [result]);

const imageUrls = useMemo(() => {
  return images.map((item) => URL.createObjectURL(item.blob));
}, [images]);

useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);

useEffect(() => {
  return () => {
    imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
  };
}, [imageUrls]);

  function resetResults() {
    setResult(null);
    setImages([]);
    setMetadata(null);
    setError(null);
    setProgress(null);
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (loading) return;
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    controllerRef.current?.abort();
    resetResults();
    generationRef.current += 1;
    setFiles(merger ? selected : [selected[0]]);
  }

  function optionsFor(controller: AbortController): VideoProcessOptions {
    return {
      quality,
      outputFormat: format,
      audioOutputFormat: audioFormat,
      start: start ? Number(start) : undefined,
      end: end ? Number(end) : undefined,
      width: toolId === "video-resizer" ? (width ? Number(width) : undefined) : undefined,
      height: toolId === "video-resizer" ? (height ? Number(height) : undefined) : undefined,
      crop: toolId === "video-cropper" && cropWidth && cropHeight
        ? {
            left: Math.max(0, Number(cropLeft) || 0),
            top: Math.max(0, Number(cropTop) || 0),
            width: Math.max(2, Number(cropWidth) || 0),
            height: Math.max(2, Number(cropHeight) || 0),
          }
        : undefined,
      rotation: toolId === "video-rotator" ? rotation : undefined,
      flip: toolId === "video-flipper" ? flip : undefined,
      speed: toolId === "video-speed-changer" ? Number(speed) : undefined,
      volume: toolId === "video-volume-booster" ? Number(volume) : undefined,
      fps: Number(fps) || 1,
      maxFrames: Number(maxFrames) || 20,
      frameTime: Number(frameTime) || 0,
      preferCopy: true,
      saveDirectlyToDisk: directToDisk,
      signal: controller.signal,
      onProgress: (value) => {
        if (generationRef.current === currentGenerationRef.current) setProgress(value);
      },
    };
  }

  const currentGenerationRef = useRef(0);

  async function process() {
    if (loading || !files.length) {
      if (!files.length) setError("Please select a file first.");
      return;
    }
    resetResults();
    const controller = new AbortController();
    controllerRef.current = controller;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    currentGenerationRef.current = generation;
    setLoading(true);

    const options = optionsFor(controller);
    try {
      if (metadataTool) {
        const data = await getVideoMetadata(files[0], options);
        if (generationRef.current === generation) setMetadata(data);
      } else if (frameTool) {
        if (toolId === "video-thumbnail-generator") {
          const image = await extractVideoFrame(files[0], Number(frameTime) || 0, options);
          if (generationRef.current === generation && image) setImages([image]);
        } else {
          const extracted = await extractVideoImages(files[0], Number(fps) || 1, Number(maxFrames) || 20, options);
          if (generationRef.current === generation) setImages(extracted);
        }
      } else if (merger) {
        const output = await mergeVideos(files, options);
        if (generationRef.current === generation) setResult(output);
      } else {
        const output = await processVideo(toolId as Parameters<typeof processVideo>[0], files[0], options);
        if (generationRef.current === generation) setResult(output);
      }
    } catch (err) {
      if (generationRef.current === generation) setError(getVideoToolErrorMessage(err));
    } finally {
      if (generationRef.current === generation) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }

  async function cancel() {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    await cancelVideoProcessing();
    setLoading(false);
    setProgress({ stage: "complete", progress: 0, message: "Processing cancelled." });
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const canProcess = useMemo(() => files.length > 0 && !loading, [files.length, loading]);

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your selected file is processed locally in your browser. It does not need to be uploaded to WorkAbhi&apos;s processing servers.
        </p>
      </div>

      <div className="rounded-2xl border bg-background p-4 sm:p-6">
        <input
          ref={inputRef}
          type="file"
          accept={gifInput ? GIF_ACCEPT : VIDEO_ACCEPT}
          multiple={merger}
          onChange={handleFiles}
          className="sr-only"
          aria-label={`Select file for ${title}`}
        />

        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center hover:bg-muted/40 disabled:opacity-50"
        >
          <span className="text-4xl" aria-hidden="true">🎬</span>
          <span className="mt-3 font-semibold">{files.length ? "Choose different file" : "Choose file"}</span>
          <span className="mt-1 text-sm text-muted-foreground">
            {merger ? "Select 2 or more videos" : gifInput ? "Select an animated GIF" : "Select a supported local video"}
          </span>
        </button>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <span className="min-w-0 break-all font-medium">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{(file.size / 1048576).toFixed(1)} MB</span>
              </div>
            ))}
          </div>
        )}

        {!metadataTool && !frameTool && toolId !== "mute-video" && toolId !== "extract-audio-from-video" && toolId !== "video-to-gif" && toolId !== "gif-to-video" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm"><span className="mb-1 block font-medium">Quality</span><select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="original">Very High</option></select></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Output</span><select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="mp4">MP4</option><option value="webm">WebM</option><option value="mov">MOV</option><option value="mkv">MKV</option></select></label>
            {(toolId === "video-trimmer" || toolId === "video-cutter") && <><label className="text-sm"><span className="mb-1 block font-medium">Start (seconds)</span><input inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">End (seconds)</span><input inputMode="decimal" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label></>}
            {toolId === "video-resizer" && <><label className="text-sm"><span className="mb-1 block font-medium">Width</span><input inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 1280" className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Height</span><input inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 720" className="w-full rounded-lg border px-3 py-2" /></label></>}
            {toolId === "video-cropper" && <><label className="text-sm"><span className="mb-1 block font-medium">Left</span><input inputMode="numeric" value={cropLeft} onChange={(e) => setCropLeft(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Top</span><input inputMode="numeric" value={cropTop} onChange={(e) => setCropTop(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Crop width</span><input inputMode="numeric" value={cropWidth} onChange={(e) => setCropWidth(e.target.value)} placeholder="e.g. 1080" className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Crop height</span><input inputMode="numeric" value={cropHeight} onChange={(e) => setCropHeight(e.target.value)} placeholder="e.g. 1080" className="w-full rounded-lg border px-3 py-2" /></label></>}
            {toolId === "video-rotator" && <label className="text-sm"><span className="mb-1 block font-medium">Rotation</span><select value={rotation} onChange={(e) => setRotation(Number(e.target.value) as 90 | 180 | 270)} className="w-full rounded-lg border px-3 py-2"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>}
            {toolId === "video-flipper" && <label className="text-sm"><span className="mb-1 block font-medium">Direction</span><select value={flip} onChange={(e) => setFlip(e.target.value as typeof flip)} className="w-full rounded-lg border px-3 py-2"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label>}
            {toolId === "video-speed-changer" && <label className="text-sm"><span className="mb-1 block font-medium">Speed</span><input inputMode="decimal" value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="0.25 - 4" /></label>}
            {toolId === "video-volume-booster" && <label className="text-sm"><span className="mb-1 block font-medium">Volume multiplier</span><input inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="1 - 4" /></label>}
          </div>
        )}

        {(toolId === "extract-audio-from-video") && <div className="mt-5 max-w-xs"><label className="text-sm"><span className="mb-1 block font-medium">Audio format</span><select value={audioFormat} onChange={(e) => setAudioFormat(e.target.value as typeof audioFormat)} className="w-full rounded-lg border bg-background px-3 py-2"><option value="wav">WAV</option><option value="mp3">MP3</option></select></label></div>}
        {frameTool && <div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm"><span className="mb-1 block font-medium">Frame time (s)</span><input value={frameTime} onChange={(e) => setFrameTime(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">FPS</span><input value={fps} onChange={(e) => setFps(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Max frames</span><input value={maxFrames} onChange={(e) => setMaxFrames(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label></div>}

        {!metadataTool && <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={directToDisk} onChange={(e) => setDirectToDisk(e.target.checked)} /> Save large output directly to disk when supported</label>}

        <div className="mt-6 flex flex-wrap gap-3">
          {!loading ? <button type="button" disabled={!canProcess} onClick={process} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Process</button> : <button type="button" onClick={() => void cancel()} className="rounded-lg border px-5 py-2.5 text-sm font-semibold">Cancel</button>}
          {files.length > 0 && <button type="button" disabled={loading} onClick={() => { resetResults(); setFiles([]); }} className="rounded-lg border px-5 py-2.5 text-sm font-semibold">Clear</button>}
        </div>
      </div>

      {progress && loading && <div className="rounded-xl border p-4"><div className="flex justify-between gap-4 text-sm"><span>{progress.message}</span><span>{Math.round(progress.progress * 100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress.progress * 100)}%` }} /></div></div>}

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{error}</div>}

      {metadata && <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">{([['Format', metadata.format], ['Duration', metadata.duration == null ? 'Unknown' : `${metadata.duration.toFixed(2)} s`], ['Resolution', metadata.width && metadata.height ? `${metadata.width} × ${metadata.height}` : 'Unknown'], ['Video codec', metadata.videoCodec ?? 'Unknown'], ['Audio codec', metadata.audioCodec ?? 'None'], ['Frame rate', metadata.frameRate == null ? 'Unknown' : `${metadata.frameRate.toFixed(2)} fps`]] as const).map(([label, value]) => <div key={label}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 break-words font-medium">{value}</div></div>)}</div>}

      {previewUrl && result && !result.directToDisk && <div className="rounded-xl border p-4">
        {isGifOutput ? (
          <img src={previewUrl} alt={result.filename} className="max-h-[520px] w-full rounded-lg bg-muted/20 object-contain" />
        ) : (
          <video controls playsInline preload="metadata" src={previewUrl} className="max-h-[520px] w-full rounded-lg bg-black" />
        )}
        <button type="button" onClick={() => downloadBlob(result.blob, result.filename)} className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Download {result.filename}</button>
      </div>}

      {images.length > 0 && <div className="rounded-xl border p-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((item, index) => <div key={item.filename} className="overflow-hidden rounded-lg border"><img src={imageUrls[index]} alt={item.filename} className="aspect-video w-full object-contain bg-muted/20" /><button type="button" onClick={() => downloadBlob(item.blob, item.filename)} className="w-full border-t px-3 py-2 text-sm font-medium">Download</button></div>)}</div></div>}
    </div>
  );
}
