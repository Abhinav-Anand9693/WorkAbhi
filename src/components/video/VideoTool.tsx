"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import VideoImageResults from "@/components/video/VideoImageResults";

import {
  processVideo,
  mergeVideos,
  extractVideoImages,
  getVideoMetadata,
} from "@/engine/video/videoEngine";

import type {
  VideoOutput,
  ImageOutput,
  VideoMetadata,
  VideoProcessOptions,
} from "@/engine/video/videoEngine";

interface VideoToolProps {
  toolId: string;
}

const VIDEO_ACCEPT =
  "video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v,.3gp";

export default function VideoTool({
  toolId,
}: VideoToolProps) {
  /* -------------------------------------------------
   * FILE STATE
   * ------------------------------------------------- */

  const [files, setFiles] = useState<File[]>([]);

  /* -------------------------------------------------
   * RESULT STATE
   * ------------------------------------------------- */

  const [result, setResult] =
    useState<VideoOutput | null>(null);

  const [imageResults, setImageResults] =
    useState<ImageOutput[]>([]);

  const [metadata, setMetadata] =
    useState<VideoMetadata | null>(null);

  /*
   * Preview URL is state because it affects rendering.
   * We NEVER access a ref during render.
   */
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  /*
   * Keep the current URL in a ref ONLY for cleanup.
   * It is never accessed during rendering.
   */
  const previewUrlRef =
    useRef<string | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* -------------------------------------------------
   * UI STATE
   * ------------------------------------------------- */

  const [loading, setLoading] =
    useState(false);

  const [metadataLoading, setMetadataLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  /* -------------------------------------------------
   * SETTINGS
   * ------------------------------------------------- */

  const [trimStart, setTrimStart] =
    useState("0");

  const [trimEnd, setTrimEnd] =
    useState("");

  const [resizeWidth, setResizeWidth] =
    useState("");

  const [resizeHeight, setResizeHeight] =
    useState("");

  const [cropX, setCropX] =
    useState("0");

  const [cropY, setCropY] =
    useState("0");

  const [cropWidth, setCropWidth] =
    useState("");

  const [cropHeight, setCropHeight] =
    useState("");

  const [rotation, setRotation] =
    useState("90");

  const [flip, setFlip] =
    useState<"horizontal" | "vertical">(
      "horizontal"
    );

  const [quality, setQuality] =
    useState<"high" | "medium" | "low">(
      "medium"
    );

  const [speed, setSpeed] =
    useState("1");

  const [volume, setVolume] =
    useState("2");

  const [frameTime, setFrameTime] =
    useState("0");

  const [extractFps, setExtractFps] =
    useState("1");

  const [maxFrames, setMaxFrames] =
    useState("20");

  /* -------------------------------------------------
   * TOOL HELPERS
   * ------------------------------------------------- */

  const isMerger =
    toolId === "video-merger";

  const isTrimTool =
    toolId === "video-trimmer" ||
    toolId === "video-cutter";

  const isCompressTool =
    toolId === "video-compressor";

  const isResizeTool =
    toolId === "video-resizer";

  const isCropTool =
    toolId === "video-cropper";

  const isRotateTool =
    toolId === "video-rotator";

  const isFlipTool =
    toolId === "video-flipper";

  const isSpeedTool =
    toolId === "video-speed-changer";

  const isVolumeTool =
    toolId === "video-volume-booster";

  const isFrameTool =
    toolId === "video-frame-extractor";

  const isImagesTool =
    toolId === "video-to-images";

  const isMetadataTool =
    toolId === "video-metadata-viewer";

  const isConversionTool =
    toolId === "mp4-to-webm" ||
    toolId === "webm-to-mp4";

  const isAudioExtractionTool =
    toolId === "extract-audio-from-video";

  /* -------------------------------------------------
   * TOOL TITLE
   * ------------------------------------------------- */

  const getToolTitle = () => {
    const titles: Record<string, string> = {
      "video-trimmer":
        "Video Trimmer",

      "video-cutter":
        "Video Cutter",

      "video-merger":
        "Video Merger",

      "video-compressor":
        "Video Compressor",

      "video-resizer":
        "Video Resizer",

      "video-cropper":
        "Video Cropper",

      "video-rotator":
        "Video Rotator",

      "video-flipper":
        "Video Flipper",

      "video-speed-changer":
        "Video Speed Changer",

      "video-volume-booster":
        "Video Volume Booster",

      "mute-video":
        "Mute Video",

      "extract-audio-from-video":
        "Extract Audio from Video",

      "video-to-gif":
        "Video to GIF",

      "gif-to-video":
        "GIF to Video",

      "mp4-to-webm":
        "MP4 to WebM",

      "webm-to-mp4":
        "WebM to MP4",

      "video-frame-extractor":
        "Video Frame Extractor",

      "video-thumbnail-generator":
        "Video Thumbnail Generator",

      "video-metadata-viewer":
        "Video Metadata Viewer",

      "video-to-images":
        "Video to Images",
    };

    return titles[toolId] ?? "Video Tool";
  };

  /* -------------------------------------------------
   * CLEAR PREVIEW URL
   * ------------------------------------------------- */

  const revokePreviewUrl = () => {
    const currentUrl =
      previewUrlRef.current;

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  };

  /* -------------------------------------------------
   * CLEAR RESULT
   * ------------------------------------------------- */

  const clearResult = () => {
    revokePreviewUrl();

    setResult(null);
    setImageResults([]);
    setMetadata(null);
    setError(null);
    setProgress(0);
  };

  /* -------------------------------------------------
   * CLEAR FILES
   * ------------------------------------------------- */

  const clearFiles = () => {
    setFiles([]);

    clearResult();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* -------------------------------------------------
   * FILE SELECTION
   * ------------------------------------------------- */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ?? []
      );

    if (selectedFiles.length === 0) {
      return;
    }

    setFiles(selectedFiles);

    clearResult();
  };

  /* -------------------------------------------------
   * OPEN FILE PICKER
   * ------------------------------------------------- */

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  /* -------------------------------------------------
   * SAFE NUMBER
   * ------------------------------------------------- */

  const numberOrUndefined = (
    value: string
  ): number | undefined => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : undefined;
  };

  /* -------------------------------------------------
   * CREATE RESULT PREVIEW
   * ------------------------------------------------- */

  const setVideoResult = (
    output: VideoOutput
  ) => {
    revokePreviewUrl();

    const url =
      URL.createObjectURL(output.blob);

    previewUrlRef.current = url;

    setPreviewUrl(url);
    setResult(output);
  };

  /* -------------------------------------------------
   * MAIN PROCESS FUNCTION
   * ------------------------------------------------- */

  const handleProcess = async () => {
    setError(null);
    setMetadata(null);
    setImageResults([]);
    setProgress(0);

    if (files.length === 0) {
      setError(
        "Please select a video first."
      );

      return;
    }

    try {
      setLoading(true);
      setProgress(10);

      /* ---------------------------------------------
       * MERGE VIDEOS
       * --------------------------------------------- */

      if (toolId === "video-merger") {
        if (files.length < 2) {
          throw new Error(
            "Please select at least 2 videos to merge."
          );
        }

        if (files.length > 10) {
          throw new Error(
            "You can merge up to 10 videos at once."
          );
        }

        const output =
          await mergeVideos(files);

        setProgress(100);
        setVideoResult(output);

        return;
      }

      /* ---------------------------------------------
       * VIDEO TO IMAGES
       * --------------------------------------------- */

      if (toolId === "video-to-images") {
        const fps =
          numberOrUndefined(
            extractFps
          ) ?? 1;

        const imageCount =
          numberOrUndefined(
            maxFrames
          ) ?? 20;

        if (fps <= 0) {
          throw new Error(
            "FPS must be greater than 0."
          );
        }

        if (
          imageCount <= 0 ||
          imageCount > 100
        ) {
          throw new Error(
            "Maximum frames must be between 1 and 100."
          );
        }

        const images =
          await extractVideoImages(
            files[0],
            fps,
            imageCount
          );

        setImageResults(images);
        setProgress(100);

        return;
      }

      /* ---------------------------------------------
       * METADATA
       * --------------------------------------------- */

      if (
        toolId ===
        "video-metadata-viewer"
      ) {
        setLoading(false);
        setMetadataLoading(true);
        setProgress(20);

        const data =
          await getVideoMetadata(
            files[0]
          );

        setMetadata(data);
        setProgress(100);

        return;
      }

      /* ---------------------------------------------
       * GENERIC OPTIONS
       * --------------------------------------------- */

      const options: VideoProcessOptions =
        {};

      /* ---------------------------------------------
       * TRIM / CUT
       * --------------------------------------------- */

      if (isTrimTool) {
        const start =
          numberOrUndefined(
            trimStart
          );

        const end =
          numberOrUndefined(
            trimEnd
          );

        if (
          start !== undefined &&
          start < 0
        ) {
          throw new Error(
            "Start time cannot be negative."
          );
        }

        if (
          end !== undefined &&
          end <= (start ?? 0)
        ) {
          throw new Error(
            "End time must be greater than start time."
          );
        }

        options.start =
          start ?? 0;

        options.end =
          end;
      }

      /* ---------------------------------------------
       * RESIZE
       * --------------------------------------------- */

      if (isResizeTool) {
        const width =
          numberOrUndefined(
            resizeWidth
          );

        const height =
          numberOrUndefined(
            resizeHeight
          );

        if (
          !width ||
          width <= 0
        ) {
          throw new Error(
            "Please enter a valid width."
          );
        }

        options.width =
          Math.floor(width);

        if (
          height &&
          height > 0
        ) {
          options.height =
            Math.floor(height);
        }
      }

      /* ---------------------------------------------
       * CROP
       * --------------------------------------------- */

      if (isCropTool) {
        const x =
          numberOrUndefined(
            cropX
          ) ?? 0;

        const y =
          numberOrUndefined(
            cropY
          ) ?? 0;

        const width =
          numberOrUndefined(
            cropWidth
          );

        const height =
          numberOrUndefined(
            cropHeight
          );

        if (
          !width ||
          width <= 0
        ) {
          throw new Error(
            "Please enter a valid crop width."
          );
        }

        if (
          !height ||
          height <= 0
        ) {
          throw new Error(
            "Please enter a valid crop height."
          );
        }

        if (x < 0 || y < 0) {
          throw new Error(
            "Crop position cannot be negative."
          );
        }

        options.cropX =
          Math.floor(x);

        options.cropY =
          Math.floor(y);

        options.cropWidth =
          Math.floor(width);

        options.cropHeight =
          Math.floor(height);
      }

      /* ---------------------------------------------
       * ROTATION
       * --------------------------------------------- */

      if (isRotateTool) {
        const value =
          Number(rotation);

        if (
          value !== 90 &&
          value !== 180 &&
          value !== 270
        ) {
          throw new Error(
            "Rotation must be 90, 180 or 270 degrees."
          );
        }

        options.rotation =
          value as 90 | 180 | 270;
      }

      /* ---------------------------------------------
       * FLIP
       * --------------------------------------------- */

      if (isFlipTool) {
        options.flip =
          flip;
      }

      /* ---------------------------------------------
       * COMPRESSION
       * --------------------------------------------- */

      if (isCompressTool) {
        options.quality =
          quality;
      }

      /* ---------------------------------------------
       * SPEED
       * --------------------------------------------- */

      if (isSpeedTool) {
        const value =
          Number(speed);

        if (
          !Number.isFinite(value) ||
          value <= 0
        ) {
          throw new Error(
            "Speed must be greater than 0."
          );
        }

        options.speed =
          value;
      }

      /* ---------------------------------------------
       * VOLUME
       * --------------------------------------------- */

      if (isVolumeTool) {
        const value =
          Number(volume);

        if (
          !Number.isFinite(value) ||
          value <= 0
        ) {
          throw new Error(
            "Volume must be greater than 0."
          );
        }

        options.volume =
          value;
      }

      /* ---------------------------------------------
       * FRAME / THUMBNAIL
       * --------------------------------------------- */

      if (
        toolId ===
          "video-frame-extractor" ||
        toolId ===
          "video-thumbnail-generator"
      ) {
        const value =
          numberOrUndefined(
            frameTime
          ) ?? 0;

        if (value < 0) {
          throw new Error(
            "Frame time cannot be negative."
          );
        }

        options.frameTime =
          value;
      }

      /* ---------------------------------------------
       * PROCESS VIDEO
       *
       * IMPORTANT:
       * Your actual engine signature is:
       *
       * processVideo(
       *   toolId,
       *   file,
       *   options
       * )
       * --------------------------------------------- */

      const output =
        await processVideo(
          toolId,
          files[0],
          options
        );

      setProgress(100);

      setVideoResult(output);
    } catch (err) {
      console.error(
        "Video processing error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while processing the video.";

      setError(message);

      revokePreviewUrl();

      setResult(null);
      setImageResults([]);
      setMetadata(null);
      setProgress(0);
    } finally {
      setLoading(false);
      setMetadataLoading(false);
    }
  };

  /* -------------------------------------------------
   * DOWNLOAD VIDEO / AUDIO / GIF
   * ------------------------------------------------- */

  const downloadResult = () => {
    if (!result) {
      return;
    }

    const url =
      URL.createObjectURL(
        result.blob
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      result.filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------
   * DOWNLOAD METADATA
   * ------------------------------------------------- */

  const downloadMetadata = () => {
    if (!metadata) {
      return;
    }

    const blob =
      new Blob(
        [
          JSON.stringify(
            metadata,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${files[0]?.name ?? "video"}-metadata.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------
   * RESULT TYPE
   * ------------------------------------------------- */

  const isAudioResult =
    result?.mimeType.startsWith(
      "audio/"
    );

  const isGifResult =
    result?.mimeType ===
    "image/gif";

  /* -------------------------------------------------
   * RENDER
   * ------------------------------------------------- */

  return (
    <div className="w-full">
      {/* -------------------------------------------
       * HEADER
       * ------------------------------------------- */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {getToolTitle()}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Process your media directly in your
          browser. Your files are not uploaded
          to a server.
        </p>
      </div>

      {/* -------------------------------------------
       * FILE PICKER
       * ------------------------------------------- */}

      <div className="rounded-2xl border bg-background p-5">
        <input
          ref={fileInputRef}
          type="file"
          accept={
            toolId ===
            "gif-to-video"
              ? "image/gif"
              : VIDEO_ACCEPT
          }
          multiple={isMerger}
          onChange={
            handleFileChange
          }
          className="hidden"
        />

        <button
          type="button"
          onClick={
            openFilePicker
          }
          disabled={loading}
          className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-3 text-4xl">
            🎬
          </div>

          <div className="font-semibold">
            {files.length > 0
              ? "Choose different file"
              : "Choose file"}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {isMerger
              ? "Select 2 to 10 videos"
              : toolId ===
                  "gif-to-video"
                ? "Select a GIF file"
                : "Select a supported video file"}
          </div>
        </button>

        {/* SELECTED FILES */}

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map(
              (
                file,
                index
              ) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {file.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {(
                        file.size /
                        (1024 *
                          1024)
                      ).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* -------------------------------------------
       * SETTINGS
       * ------------------------------------------- */}

      <div className="mt-5 rounded-2xl border bg-background p-5">
        <h3 className="text-lg font-semibold">
          Settings
        </h3>

        {/* TRIM */}

        {isTrimTool && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Start time (seconds)
              </span>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  trimStart
                }
                onChange={(e) =>
                  setTrimStart(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                End time (seconds)
              </span>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  trimEnd
                }
                onChange={(e) =>
                  setTrimEnd(
                    e.target.value
                  )
                }
                placeholder="Example: 30"
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {/* COMPRESSION */}

        {isCompressTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Compression quality
            </span>

            <select
              value={
                quality
              }
              onChange={(e) =>
                setQuality(
                  e.target
                    .value as
                    | "high"
                    | "medium"
                    | "low"
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="high">
                High quality
              </option>

              <option value="medium">
                Balanced
              </option>

              <option value="low">
                Smaller file
              </option>
            </select>
          </label>
        )}

        {/* RESIZE */}

        {isResizeTool && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Width (pixels)
              </span>

              <input
                type="number"
                min="2"
                value={
                  resizeWidth
                }
                onChange={(e) =>
                  setResizeWidth(
                    e.target.value
                  )
                }
                placeholder="Example: 1280"
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Height (optional)
              </span>

              <input
                type="number"
                min="2"
                value={
                  resizeHeight
                }
                onChange={(e) =>
                  setResizeHeight(
                    e.target.value
                  )
                }
                placeholder="Optional"
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {/* CROP */}

        {isCropTool && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                X position
              </span>

              <input
                type="number"
                min="0"
                value={
                  cropX
                }
                onChange={(e) =>
                  setCropX(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Y position
              </span>

              <input
                type="number"
                min="0"
                value={
                  cropY
                }
                onChange={(e) =>
                  setCropY(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Width
              </span>

              <input
                type="number"
                min="2"
                value={
                  cropWidth
                }
                onChange={(e) =>
                  setCropWidth(
                    e.target.value
                  )
                }
                placeholder="Example: 640"
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Height
              </span>

              <input
                type="number"
                min="2"
                value={
                  cropHeight
                }
                onChange={(e) =>
                  setCropHeight(
                    e.target.value
                  )
                }
                placeholder="Example: 360"
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {/* ROTATION */}

        {isRotateTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Rotation
            </span>

            <select
              value={
                rotation
              }
              onChange={(e) =>
                setRotation(
                  e.target.value
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
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

        {isFlipTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Flip direction
            </span>

            <select
              value={
                flip
              }
              onChange={(e) =>
                setFlip(
                  e.target
                    .value as
                    | "horizontal"
                    | "vertical"
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
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

        {isSpeedTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Playback speed
            </span>

            <select
              value={
                speed
              }
              onChange={(e) =>
                setSpeed(
                  e.target.value
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="0.25">
                0.25×
              </option>

              <option value="0.5">
                0.5×
              </option>

              <option value="0.75">
                0.75×
              </option>

              <option value="1">
                1×
              </option>

              <option value="1.25">
                1.25×
              </option>

              <option value="1.5">
                1.5×
              </option>

              <option value="2">
                2×
              </option>

              <option value="4">
                4×
              </option>
            </select>
          </label>
        )}

        {/* VOLUME */}

        {isVolumeTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Volume multiplier
            </span>

            <select
              value={
                volume
              }
              onChange={(e) =>
                setVolume(
                  e.target.value
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="1.5">
                1.5×
              </option>

              <option value="2">
                2×
              </option>

              <option value="3">
                3×
              </option>

              <option value="4">
                4×
              </option>

              <option value="5">
                5×
              </option>
            </select>
          </label>
        )}

        {/* FRAME */}

        {isFrameTool && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">
              Frame time (seconds)
            </span>

            <input
              type="number"
              min="0"
              step="0.1"
              value={
                frameTime
              }
              onChange={(e) =>
                setFrameTime(
                  e.target.value
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </label>
        )}

        {/* VIDEO TO IMAGES */}

        {isImagesTool && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Frames per second
              </span>

              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={
                  extractFps
                }
                onChange={(e) =>
                  setExtractFps(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Maximum frames
              </span>

              <input
                type="number"
                min="1"
                max="100"
                value={
                  maxFrames
                }
                onChange={(e) =>
                  setMaxFrames(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>
          </div>
        )}

        {/* INFORMATION */}

        {isMerger && (
          <p className="mt-4 text-sm text-muted-foreground">
            Select multiple videos to merge
            them into one MP4 video.
          </p>
        )}

        {isConversionTool && (
          <p className="mt-4 text-sm text-muted-foreground">
            Conversion is performed locally
            using FFmpeg.
          </p>
        )}

        {isAudioExtractionTool && (
          <p className="mt-4 text-sm text-muted-foreground">
            Audio will be extracted as an MP3
            file.
          </p>
        )}

        {isMetadataTool && (
          <p className="mt-4 text-sm text-muted-foreground">
            Video metadata is read locally in
            your browser.
          </p>
        )}

        {/* -------------------------------------------
         * ACTIONS
         * ------------------------------------------- */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              handleProcess
            }
            disabled={
              loading ||
              metadataLoading ||
              files.length === 0
            }
            className="flex-1 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ||
            metadataLoading
              ? `Processing ${progress}%`
              : isMetadataTool
                ? "Read Metadata"
                : "Process Video"}
          </button>

          <button
            type="button"
            onClick={
              clearFiles
            }
            disabled={
              loading ||
              metadataLoading
            }
            className="rounded-xl border px-5 py-3 font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        {/* -------------------------------------------
         * PROGRESS
         * ------------------------------------------- */}

        {(loading ||
          metadataLoading) && (
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>
                Processing...
              </span>

              <span>
                {progress}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------
         * ERROR
         * ------------------------------------------- */}

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* -------------------------------------------
       * VIDEO / AUDIO / GIF RESULT
       * ------------------------------------------- */}

      {result &&
        previewUrl && (
          <section className="mt-6 rounded-2xl border bg-background p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Result
                </h3>

                <p className="text-sm text-muted-foreground">
                  {result.filename}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadResult
                }
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Download
              </button>
            </div>

            {/* AUDIO */}

            {isAudioResult && (
              <audio
                className="mt-5 w-full"
                src={
                  previewUrl
                }
                controls
              />
            )}

            {/* GIF */}

            {isGifResult && (
              <div className="mt-5 overflow-hidden rounded-xl bg-black">
                <img
                  src={
                    previewUrl
                  }
                  alt="Generated GIF"
                  className="mx-auto max-h-[500px] w-full object-contain"
                />
              </div>
            )}

            {/* VIDEO */}

            {!isAudioResult &&
              !isGifResult && (
                <video
                  className="mt-5 max-h-[500px] w-full rounded-xl bg-black"
                  src={
                    previewUrl
                  }
                  controls
                  playsInline
                />
              )}
          </section>
        )}

      {/* -------------------------------------------
       * EXTRACTED IMAGES
       * ------------------------------------------- */}

      {imageResults.length >
        0 && (
        <VideoImageResults
          key={imageResults
            .map(
              (image) =>
                image.filename
            )
            .join("|")}
          images={
            imageResults
          }
        />
      )}

      {/* -------------------------------------------
       * METADATA
       * ------------------------------------------- */}

      {metadata && (
        <section className="mt-6 rounded-2xl border bg-background p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Video Metadata
              </h3>

              <p className="text-sm text-muted-foreground">
                Technical information about
                your media file.
              </p>
            </div>

            <button
              type="button"
              onClick={
                downloadMetadata
              }
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Download JSON
            </button>
          </div>

          <pre className="mt-5 max-h-[500px] overflow-auto rounded-xl bg-muted p-4 text-xs">
            {JSON.stringify(
              metadata,
              null,
              2
            )}
          </pre>
        </section>
      )}

      {/* -------------------------------------------
       * PRIVACY
       * ------------------------------------------- */}

      <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 Your file is processed locally in
          your browser. WorkAbhi does not upload
          your media file to a server for
          processing.
        </p>
      </div>
    </div>
  );
}