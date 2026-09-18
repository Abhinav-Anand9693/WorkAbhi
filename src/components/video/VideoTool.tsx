"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  cancelVideoProcessing,
  extractVideoFrame,
  extractVideoImages,
  getVideoMetadata,
  getVideoToolErrorMessage,
  mergeVideos,
  processVideo,
} from "@/engine/video/videoEngine";

import { downloadBlob } from "@/engine/video/videoDownload";

import type {
  VideoMetadata,
  VideoOutput,
  VideoProcessOptions,
  VideoProgress,
  VideoQuality,
} from "@/engine/video/videoTypes";
import { VideoEngineError } from "@/engine/video/videoTypes";

interface VideoToolProps {
  toolId: string;
}

const VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,video/x-matroska,video/*,.mp4,.webm,.mov,.mkv,.m4v,.mpeg,.mpg,.ts,.ogv";

const GIF_ACCEPT = "image/gif,.gif";

const TITLES: Record<string, string> = {
  "video-trimmer": "Video Trimmer",
  "video-cutter": "Video Cutter",
  "video-merger": "Video Merger",
  "video-compressor": "Video Compressor",
  "video-resizer": "Video Resizer",
  "video-cropper": "Video Cropper",
  "video-rotator": "Video Rotator",
  "video-flipper": "Video Flipper",
  "video-speed-changer": "Video Speed Changer",
  "video-volume-booster": "Video Volume Booster",
  "mute-video": "Mute Video",
  "extract-audio-from-video": "Extract Audio from Video",
  "video-to-gif": "Video to GIF",
  "gif-to-video": "GIF to Video",
  "mp4-to-webm": "MP4 to WebM",
  "webm-to-mp4": "WebM to MP4",
  "video-frame-extractor": "Video Frame Extractor",
  "video-thumbnail-generator": "Video Thumbnail Generator",
  "video-metadata-viewer": "Video Metadata Viewer",
  "video-to-images": "Video to Images",
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const decimals =
    index === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(decimals)} ${units[index]}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.0s";

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0",
  )}`;
}

export default function VideoTool({ toolId }: VideoToolProps) {
  const title = TITLES[toolId] ?? "Video Tool";

  const merger = toolId === "video-merger";
  const metadataTool = toolId === "video-metadata-viewer";
  const frameTool =
    toolId === "video-frame-extractor" ||
    toolId === "video-thumbnail-generator" ||
    toolId === "video-to-images";
  const gifInput = toolId === "gif-to-video";
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<VideoOutput | null>(null);
  const [images, setImages] = useState<
    Array<{ blob: Blob; filename: string }>
  >([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quality, setQuality] = useState<VideoQuality>("medium");
  const [format, setFormat] = useState<"mp4" | "webm" | "mov" | "mkv">(
    toolId === "mp4-to-webm" ? "webm" : "mp4",
  );
  const [audioFormat, setAudioFormat] = useState<"wav" | "mp3">("wav");

  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [cropLeft, setCropLeft] = useState("0");
  const [cropTop, setCropTop] = useState("0");
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [flip, setFlip] = useState<"horizontal" | "vertical">("horizontal");
  const [speed, setSpeed] = useState("1");
  const [volume, setVolume] = useState("2");
  const [fps, setFps] = useState(frameTool ? "1" : "10");
  const [maxFrames, setMaxFrames] = useState(frameTool ? "20" : "120");
  const [frameTime, setFrameTime] = useState("0");

  const [elapsedMs, setElapsedMs] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const currentGenerationRef = useRef(0);
  const resultVideoRef = useRef<HTMLVideoElement | null>(null);

  const imageUrls = useMemo(
    () => images.map((item) => URL.createObjectURL(item.blob)),
    [images],
  );

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  useEffect(() => {
    const video = resultVideoRef.current;
    if (!video) return;

    if (!result?.blob || result.streamedDownload || result.blob.size <= 0) {
      video.removeAttribute("src");
      video.load();
      return;
    }

    const url = URL.createObjectURL(result.blob);
    video.src = url;
    video.load();

    return () => {
      if (video.src === url) {
        video.removeAttribute("src");
        video.load();
      }
      URL.revokeObjectURL(url);
    };
  }, [result]);

  const startElapsedClock = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const started = performance.now();
    startedAtRef.current = started;
    setElapsedMs(0);

    timerRef.current = setInterval(() => {
      if (startedAtRef.current === null) return;
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 100);
  }, []);

  const stopElapsedClock = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startedAtRef.current !== null) {
      setElapsedMs(performance.now() - startedAtRef.current);
    }

    startedAtRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      controllerRef.current?.abort();
      void cancelVideoProcessing(jobIdRef.current ?? undefined);
    };
  }, []);

  function resetResults() {
    setResult(null);
    setImages([]);
    setMetadata(null);
    setError(null);
    setProgress(null);
    setElapsedMs(0);
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

  function parseOptionalNumber(value: string, label: string): number | undefined {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new VideoEngineError("INVALID_OPTIONS", `${label} must be a valid number.`);
    }
    return parsed;
  }

  function parseRequiredNumber(value: string, label: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new VideoEngineError("INVALID_OPTIONS", `${label} must be a valid number.`);
    }
    return parsed;
  }

  function optionsFor(controller: AbortController, jobId: string): VideoProcessOptions {
    const startValue = ["video-trimmer", "video-cutter", "video-speed-changer"].includes(toolId)
      ? parseOptionalNumber(start, "Start time")
      : undefined;
    const endValue = ["video-trimmer", "video-cutter", "video-speed-changer"].includes(toolId)
      ? parseOptionalNumber(end, "End time")
      : undefined;

    const resizeWidth = toolId === "video-resizer" ? parseOptionalNumber(width, "Width") : undefined;
    const resizeHeight = toolId === "video-resizer" ? parseOptionalNumber(height, "Height") : undefined;

    let crop: VideoProcessOptions["crop"];
    if (toolId === "video-cropper") {
      const left = parseRequiredNumber(cropLeft, "Crop left");
      const top = parseRequiredNumber(cropTop, "Crop top");
      const cropWidth = parseRequiredNumber(width, "Crop width");
      const cropHeight = parseRequiredNumber(height, "Crop height");
      crop = { left, top, width: cropWidth, height: cropHeight };
    }

    const speedValue = toolId === "video-speed-changer" ? parseRequiredNumber(speed, "Speed") : undefined;
    const volumeValue = toolId === "video-volume-booster" ? parseRequiredNumber(volume, "Volume") : undefined;
    const frameFps = frameTool || toolId === "video-to-gif" ? parseRequiredNumber(fps, "FPS") : undefined;
    const frameLimit = frameTool || toolId === "video-to-gif" ? parseRequiredNumber(maxFrames, "Maximum frames") : undefined;
    const frameTimestamp = toolId === "video-thumbnail-generator" ? parseRequiredNumber(frameTime, "Frame time") : undefined;

    return {
      quality,
      outputFormat: format,
      audioOutputFormat: audioFormat,
      start: startValue,
      end: endValue,
      width: resizeWidth,
      height: resizeHeight,
      crop,
      rotation: toolId === "video-rotator" ? rotation : undefined,
      flip: toolId === "video-flipper" ? flip : undefined,
      speed: speedValue,
      volume: volumeValue,
      fps: frameFps,
      maxFrames: frameLimit,
      frameTime: frameTimestamp,
      preferCopy: true,
      signal: controller.signal,
      jobId,
      onProgress: (value) => {
        if (generationRef.current === currentGenerationRef.current) {
          setProgress(value);
        }
      },
    };
  }

  async function process() {
    if (loading || !files.length) {
      if (!files.length) {
        setError(
          merger
            ? "Please select at least 2 videos."
            : "Please select a file first.",
        );
      }
      return;
    }

    if (merger && files.length < 2) {
      setError("Please select at least 2 videos to merge.");
      return;
    }

    resetResults();

    const controller = new AbortController();
    controllerRef.current = controller;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    currentGenerationRef.current = generation;

    setLoading(true);

    try {
      /*
       * No File System Access save picker is used. For normal video/audio
       * outputs we create a browser download stream immediately from the
       * Process click. StreamSaver hands that stream to the browser's normal
       * download manager, which avoids constructing a 1–2 GB Blob.
       */
      const jobId = `video-ui-${generation}`;
      jobIdRef.current = jobId;

      // Output strategy belongs to the engine. The UI only supplies the job
      // identity and abort signal; it must not independently decide whether
      // an output is streamed or buffered.
      const options = {
        ...optionsFor(controller, jobId),
        downloadStream: null,
        streamDownload: false,
      } satisfies VideoProcessOptions;

      /* The clock starts after the download transport is prepared, so it
       * measures actual media-engine work rather than setup/picker time. */
      startElapsedClock();
      /*
       * ---------------------------------------------
       * METADATA TOOL
       * ---------------------------------------------
       */
      if (metadataTool) {
        const data = await getVideoMetadata(files[0], options);

        if (generationRef.current === generation) {
          setMetadata(data);
        }

        return;
      }

      /*
       * ---------------------------------------------
       * FRAME / THUMBNAIL / IMAGE TOOLS
       * ---------------------------------------------
       */
      if (frameTool) {
        if (toolId === "video-thumbnail-generator") {
          const image = await extractVideoFrame(
            files[0],
            options.frameTime ?? 0,
            options,
          );

          if (
            generationRef.current === generation &&
            image
          ) {
            setImages([image]);
          }
        } else {
          const extracted = await extractVideoImages(
            files[0],
            options.fps ?? 1,
            options.maxFrames ?? 20,
            options,
          );

          if (generationRef.current === generation) {
            setImages(extracted);
          }
        }

        return;
      }

      /*
       * ---------------------------------------------
       * VIDEO MERGER
       *
       * IMPORTANT:
       * The merger has its own engine API.
       * It must NOT go through processVideo().
       * ---------------------------------------------
       */
      if (merger) {
        const output = await mergeVideos(
          files,
          options,
        );

        if (
          generationRef.current === generation
        ) {
          setResult(output);
          if (!output.streamedDownload && output.blob.size > 0) {
            downloadBlob(output.blob, output.filename);
          }
        }

        return;
      }

      /*
       * ---------------------------------------------
       * ALL OTHER VIDEO TOOLS
       * ---------------------------------------------
       */
      const output = await processVideo(
        toolId as Parameters<typeof processVideo>[0],
        files[0],
        options,
      );

      if (
        generationRef.current === generation
      ) {
        setResult(output);
        if (!output.streamedDownload && output.blob.size > 0) {
          downloadBlob(output.blob, output.filename);
        }
      }
    } catch (err) {
      if (
        generationRef.current === generation
      ) {
        setError(
          getVideoToolErrorMessage(err),
        );
      }
    } finally {
      if (
        generationRef.current === generation
      ) {
        stopElapsedClock();
        controllerRef.current = null;
        jobIdRef.current = null;
        setLoading(false);
      }
    }
  }

  async function cancel() {
    generationRef.current += 1;

    controllerRef.current?.abort();
    controllerRef.current = null;

    await cancelVideoProcessing(jobIdRef.current ?? undefined);
    jobIdRef.current = null;

    stopElapsedClock();
    setLoading(false);

    setProgress({
      stage: "complete",
      progress: 0,
      message: "Processing cancelled.",
    });
  }

  const canProcess =
    files.length > 0 &&
    !loading &&
    (!merger || files.length >= 2);

  const elapsedSeconds = elapsedMs / 1000;

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* ======================================================
       * HEADER
       * ====================================================== */}

      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Your selected file is processed locally in your
          browser. It does not need to be uploaded to WorkAbhi&apos;s
          processing servers.
        </p>
      </div>

      {/* ======================================================
       * FILE INPUT
       * ====================================================== */}

      <div className="rounded-2xl border bg-background p-4 sm:p-6">
        <input
          ref={inputRef}
          type="file"
          accept={
            gifInput
              ? GIF_ACCEPT
              : VIDEO_ACCEPT
          }
          multiple={merger}
          onChange={handleFiles}
          className="sr-only"
          aria-label={`Select file for ${title}`}
        />

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            inputRef.current?.click()
          }
          className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition hover:bg-muted/40 disabled:opacity-50"
        >
          <span
            className="text-4xl"
            aria-hidden="true"
          >
            🎬
          </span>

          <span className="mt-3 font-semibold">
            {files.length
              ? "Choose different file"
              : "Choose file"}
          </span>

          <span className="mt-1 text-sm text-muted-foreground">
            {merger
              ? "Select 2 or more videos"
              : gifInput
                ? "Select an animated GIF"
                : "Select a supported local video"}
          </span>
        </button>

        {/* SELECTED FILES */}

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map(
              (file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span className="min-w-0 break-all font-medium">
                    {file.name}
                  </span>

                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(
                      file.size,
                    )}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        {/* ====================================================
         * TOOL-SPECIFIC OPTIONS
         * ==================================================== */}

        {!metadataTool &&
          !frameTool &&
          toolId !== "mute-video" &&
          toolId !==
            "extract-audio-from-video" &&
          toolId !== "video-to-gif" &&
          toolId !== "gif-to-video" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* QUALITY */}

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Quality
                </span>

                <select
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      e.target.value as VideoQuality,
                    )
                  }
                  disabled={loading}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                >
                  <option value="high">
                    High
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="low">
                    Low
                  </option>

                  <option value="original">
                    Very High
                  </option>
                </select>
              </label>

              {/* OUTPUT */}

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Output
                </span>

                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(
                      e.target.value as typeof format,
                    )
                  }
                  disabled={loading}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                >
                  <option value="mp4">
                    MP4
                  </option>

                  <option value="webm">
                    WebM
                  </option>

                  <option value="mov">
                    MOV
                  </option>

                  <option value="mkv">
                    MKV
                  </option>
                </select>
              </label>

              {/* TRIM / CUT */}

              {(toolId ===
                "video-trimmer" ||
                toolId ===
                  "video-cutter") && (
                <>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">
                      Start (seconds)
                    </span>

                    <input
                      inputMode="decimal"
                      value={start}
                      onChange={(e) =>
                        setStart(
                          e.target.value,
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="mb-1 block font-medium">
                      End (seconds)
                    </span>

                    <input
                      inputMode="decimal"
                      value={end}
                      onChange={(e) =>
                        setEnd(
                          e.target.value,
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </>
              )}

              {/* RESIZER / CROP */}

              {(toolId ===
                "video-resizer" ||
                toolId ===
                  "video-cropper") && (
                <>
                  {toolId === "video-cropper" && (
                    <>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Crop left (px)</span>
                        <input inputMode="numeric" value={cropLeft} onChange={(e) => setCropLeft(e.target.value)} disabled={loading} className="w-full rounded-lg border px-3 py-2" />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Crop top (px)</span>
                        <input inputMode="numeric" value={cropTop} onChange={(e) => setCropTop(e.target.value)} disabled={loading} className="w-full rounded-lg border px-3 py-2" />
                      </label>
                    </>
                  )}
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">
                      Width
                    </span>

                    <input
                      inputMode="numeric"
                      value={width}
                      onChange={(e) =>
                        setWidth(
                          e.target.value,
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="mb-1 block font-medium">
                      Height
                    </span>

                    <input
                      inputMode="numeric"
                      value={height}
                      onChange={(e) =>
                        setHeight(
                          e.target.value,
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </>
              )}

              {/* ROTATION */}

              {toolId ===
                "video-rotator" && (
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Rotation
                  </span>

                  <select
                    value={rotation}
                    onChange={(e) =>
                      setRotation(
                        Number(
                          e.target.value,
                        ) as 90 | 180 | 270,
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="90">
                      90°
                    </option>
                    <option value="180">
                      180°
                    </option>
                    <option value="270">
                      270°
                    </option>
                  </select>
                </label>
              )}

              {/* FLIP */}

              {toolId ===
                "video-flipper" && (
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Direction
                  </span>

                  <select
                    value={flip}
                    onChange={(e) =>
                      setFlip(
                        e.target.value as typeof flip,
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="horizontal">
                      Horizontal
                    </option>

                    <option value="vertical">
                      Vertical
                    </option>
                  </select>
                </label>
              )}

              {/* SPEED */}

              {toolId ===
                "video-speed-changer" && (
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Speed
                  </span>

                  <input
                    inputMode="decimal"
                    value={speed}
                    onChange={(e) =>
                      setSpeed(
                        e.target.value,
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="0.25 - 4"
                  />
                </label>
              )}

              {/* VOLUME */}

              {toolId ===
                "video-volume-booster" && (
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Volume multiplier
                  </span>

                  <input
                    inputMode="decimal"
                    value={volume}
                    onChange={(e) =>
                      setVolume(
                        e.target.value,
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="1 - 4"
                  />
                </label>
              )}
            </div>
          )}

        {/* AUDIO */}

        {toolId ===
          "extract-audio-from-video" && (
          <div className="mt-5 max-w-xs">
            <label className="text-sm">
              <span className="mb-1 block font-medium">
                Audio format
              </span>

              <select
                value={audioFormat}
                onChange={(e) =>
                  setAudioFormat(
                    e.target.value as typeof audioFormat,
                  )
                }
                disabled={loading}
                className="w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="wav">
                  WAV
                </option>

                <option value="mp3">
                  MP3
                </option>
              </select>
            </label>
          </div>
        )}

        {/* FRAME OPTIONS */}

        {frameTool && (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">
                Frame time (s)
              </span>

              <input
                value={frameTime}
                onChange={(e) =>
                  setFrameTime(
                    e.target.value,
                  )
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">
                FPS
              </span>

              <input
                value={fps}
                onChange={(e) =>
                  setFps(
                    e.target.value,
                  )
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">
                Max frames
              </span>

              <input
                value={maxFrames}
                onChange={(e) =>
                  setMaxFrames(
                    e.target.value,
                  )
                }
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
        )}


        {/* ====================================================
         * BUTTONS
         * ==================================================== */}

        <div className="mt-6 flex flex-wrap gap-3">
          {!loading ? (
            <button
              type="button"
              disabled={!canProcess}
              onClick={() => void process()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {merger
                ? "Merge Videos"
                : "Process"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void cancel()}
              className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          )}

          {files.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                resetResults();
                setFiles([]);

                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
       * PROCESSING
       * ====================================================== */}

      {progress && loading && (
        <div className="rounded-xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
            <div>
              <span className="font-medium">
                {progress.message}
              </span>

              <span className="ml-2 text-xs text-muted-foreground">
                {progress.stage}
              </span>
            </div>

            <span className="font-semibold">
              {Math.round(
                progress.progress * 100,
              )}
              %
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width]"
              style={{
                width: `${Math.round(
                  progress.progress * 100,
                )}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.processedSeconds !==
                undefined &&
              progress.duration !==
                undefined
                ? `${formatDuration(
                    progress.processedSeconds,
                  )} / ${formatDuration(
                    progress.duration,
                  )}`
                : "Processing locally in your browser"}
            </span>

            <span>
              Time:{" "}
              {formatDuration(
                elapsedSeconds,
              )}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
       * ERROR
       * ====================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </div>
      )}

      {/* ======================================================
       * METADATA
       * ====================================================== */}

      {metadata && (
        <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Format", metadata.format],
              [
                "Duration",
                metadata.duration == null
                  ? "Unknown"
                  : `${metadata.duration.toFixed(
                      2,
                    )} s`,
              ],
              [
                "Resolution",
                metadata.width &&
                metadata.height
                  ? `${metadata.width} × ${metadata.height}`
                  : "Unknown",
              ],
              [
                "Video codec",
                metadata.videoCodec ??
                  "Unknown",
              ],
              [
                "Audio codec",
                metadata.audioCodec ??
                  "None",
              ],
              [
                "Frame rate",
                metadata.frameRate == null
                  ? "Unknown"
                  : `${metadata.frameRate.toFixed(
                      2,
                    )} fps`,
              ],
            ] as const
          ).map(
            ([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground">
                  {label}
                </div>

                <div className="mt-1 break-words font-medium">
                  {value}
                </div>
              </div>
            ),
          )}
        </div>
      )}


      {result?.streamedDownload && (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm">
          <div className="font-semibold">Download started</div>
          <p className="mt-1 text-muted-foreground">
            The processed file is being sent to your browser download.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Processing time: <strong>{formatDuration(elapsedSeconds)}</strong>
          </p>
        </div>
      )}

      {result &&
        !result.streamedDownload && (
          <div className="rounded-xl border p-4">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">
                  Result ready
                </div>

                <div className="text-sm text-muted-foreground">
                  {result.filename}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Time taken:{" "}
                <strong className="text-foreground">
                  {formatDuration(
                    elapsedSeconds,
                  )}
                </strong>
              </div>
            </div>

            {result.blob &&
              result.blob.size > 0 && (
                <>
                  <video
                    controls
                    playsInline
                    ref={resultVideoRef}
                    className="max-h-[520px] w-full rounded-lg bg-black"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      downloadBlob(
                        result.blob,
                        result.filename,
                      )
                    }
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Download {result.filename}
                  </button>

                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    Output size:{" "}
                    {formatBytes(
                      result.size,
                    )}{" "}
                    · Processing time:{" "}
                    {formatDuration(
                      elapsedSeconds,
                    )}
                  </div>
                </>
              )}
          </div>
        )}

      {/* ======================================================
       * IMAGE RESULTS
       * ====================================================== */}

      {images.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold">
              Extracted images
            </div>

            <div className="text-xs text-muted-foreground">
              Time taken:{" "}
              {formatDuration(
                elapsedSeconds,
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map(
              (item, index) => (
                <div
                  key={item.filename}
                  className="overflow-hidden rounded-lg border"
                >
                  {/* Blob URLs cannot use next/image without losing the local-only preview path. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrls[index]}
                    alt={item.filename}
                    className="aspect-video w-full object-contain bg-muted/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      downloadBlob(
                        item.blob,
                        item.filename,
                      )
                    }
                    className="w-full border-t px-3 py-2 text-sm font-medium"
                  >
                    Download
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}


