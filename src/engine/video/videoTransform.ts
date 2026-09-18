import type { VideoMetadata, VideoProcessOptions, VideoToolId } from "./videoTypes";
import { DEFAULT_VIDEO_LIMITS, VideoEngineError } from "./videoTypes";

export interface VideoTransformPlan {
  sourceRect: { left: number; top: number; width: number; height: number };
  outputWidth: number;
  outputHeight: number;
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  fit: "contain" | "cover" | "fill";
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function evenDimension(value: number): number {
  const result = Math.floor(value);
  return result % 2 === 0 ? result : result - 1;
}

export function validateVideoOptions(
  metadata: VideoMetadata,
  options: VideoProcessOptions,
  toolId?: VideoToolId,
): void {
  const { width: sourceWidth, height: sourceHeight, duration } = metadata;
  if (!finite(sourceWidth) || !finite(sourceHeight) || sourceWidth < 2 || sourceHeight < 2) {
    throw new VideoEngineError("INVALID_FILE", "The video has invalid dimensions.");
  }

  const checkPositiveInteger = (value: number | undefined, label: string) => {
    if (value === undefined) return;
    if (!finite(value) || !Number.isInteger(value) || value <= 0) {
      throw new VideoEngineError("INVALID_OPTIONS", `${label} must be a positive integer.`);
    }
  };

  checkPositiveInteger(options.width, "Width");
  checkPositiveInteger(options.height, "Height");

  if (options.width !== undefined && options.width > 3840 || options.height !== undefined && options.height > 3840) {
    throw new VideoEngineError("INVALID_OPTIONS", "Output dimensions cannot exceed 3840 pixels per side.");
  }

  if (options.width && options.height && options.width * options.height > DEFAULT_VIDEO_LIMITS.maxPixels) {
    throw new VideoEngineError("MEMORY_LIMIT", "The requested output resolution is too large for stable browser processing.");
  }

  if (options.fit !== undefined && !["contain", "cover", "fill"].includes(options.fit)) {
    throw new VideoEngineError("INVALID_OPTIONS", "Invalid fit mode.");
  }

  if (options.rotation !== undefined && ![0, 90, 180, 270].includes(options.rotation)) {
    throw new VideoEngineError("INVALID_OPTIONS", "Rotation must be 0, 90, 180, or 270 degrees.");
  }

  if (options.speed !== undefined && (!finite(options.speed) || options.speed < 0.25 || options.speed > 4)) {
    throw new VideoEngineError("INVALID_OPTIONS", "Speed must be between 0.25x and 4x.");
  }
  if (options.volume !== undefined && (!finite(options.volume) || options.volume < 0 || options.volume > 4)) {
    throw new VideoEngineError("INVALID_OPTIONS", "Volume must be between 0x and 4x.");
  }

  const hasDuration = finite(duration) && duration > 0;
  if (options.start !== undefined) {
    if (!finite(options.start) || options.start < 0) throw new VideoEngineError("INVALID_OPTIONS", "Start time must be a non-negative number.");
    if (hasDuration && options.start >= duration) throw new VideoEngineError("INVALID_OPTIONS", "Start time must be before the video duration.");
  }
  if (options.end !== undefined) {
    if (!finite(options.end) || options.end <= 0) throw new VideoEngineError("INVALID_OPTIONS", "End time must be a positive number.");
    if (hasDuration && options.end > duration) throw new VideoEngineError("INVALID_OPTIONS", "End time cannot exceed the video duration.");
  }
  if (options.start !== undefined && options.end !== undefined && options.end <= options.start) {
    throw new VideoEngineError("INVALID_OPTIONS", "End time must be greater than start time.");
  }

  if (options.flip !== undefined && options.flip !== "horizontal" && options.flip !== "vertical") {
    throw new VideoEngineError("INVALID_OPTIONS", "Invalid flip direction.");
  }

  if (options.crop !== undefined) {
    const { left, top, width, height } = options.crop;
    if (![left, top, width, height].every(finite) || left < 0 || top < 0 || width <= 0 || height <= 0 ||
      left + width > sourceWidth || top + height > sourceHeight) {
      throw new VideoEngineError("INVALID_OPTIONS", "Crop must stay completely inside the source video bounds.");
    }
  }

  if (options.fps !== undefined && (!finite(options.fps) || options.fps <= 0 || options.fps > 30)) {
    throw new VideoEngineError("INVALID_OPTIONS", "FPS must be greater than 0 and no more than 30.");
  }
  if (options.maxFrames !== undefined && (!finite(options.maxFrames) || !Number.isInteger(options.maxFrames) || options.maxFrames < 1 || options.maxFrames > DEFAULT_VIDEO_LIMITS.maxExtractFrames)) {
    throw new VideoEngineError("INVALID_OPTIONS", `Maximum frames must be an integer from 1 to ${DEFAULT_VIDEO_LIMITS.maxExtractFrames}.`);
  }
  if (options.frameTime !== undefined && (!finite(options.frameTime) || options.frameTime < 0 || (hasDuration && options.frameTime >= duration))) {
    throw new VideoEngineError("INVALID_OPTIONS", "Frame time must be within the video duration.");
  }

  if (toolId === "video-cropper" && !options.crop) {
    throw new VideoEngineError("INVALID_OPTIONS", "Crop coordinates and dimensions are required.");
  }
}

export function resolveVideoTransformPlan(
  metadata: VideoMetadata,
  options: VideoProcessOptions = {},
  toolId?: VideoToolId,
): VideoTransformPlan {
  validateVideoOptions(metadata, options, toolId);

  const sourceWidth = metadata.width as number;
  const sourceHeight = metadata.height as number;
  const crop = options.crop;
  const sourceRect = crop
    ? { left: crop.left, top: crop.top, width: crop.width, height: crop.height }
    : { left: 0, top: 0, width: sourceWidth, height: sourceHeight };

  let outputWidth = options.width ?? sourceRect.width;
  let outputHeight = options.height ?? sourceRect.height;

  // A single requested dimension preserves the source aspect ratio. Two
  // explicit dimensions are honored and the selected fit mode controls how
  // pixels are placed inside that canvas.
  if (options.width !== undefined && options.height === undefined) {
    outputHeight = Math.round(options.width * sourceRect.height / sourceRect.width);
  } else if (options.height !== undefined && options.width === undefined) {
    outputWidth = Math.round(options.height * sourceRect.width / sourceRect.height);
  }

  if (toolId === "video-cropper" && !options.width && !options.height) {
    outputWidth = sourceRect.width;
    outputHeight = sourceRect.height;
  }

  if (!finite(outputWidth) || !finite(outputHeight) || outputWidth <= 0 || outputHeight <= 0) {
    throw new VideoEngineError("INVALID_OPTIONS", "Output dimensions must be finite positive numbers.");
  }

  const rotation = (options.rotation ?? 0) as 0 | 90 | 180 | 270;
  if (rotation === 90 || rotation === 270) [outputWidth, outputHeight] = [outputHeight, outputWidth];

  outputWidth = Math.max(2, Math.min(3840, evenDimension(outputWidth)));
  outputHeight = Math.max(2, Math.min(3840, evenDimension(outputHeight)));

  if (outputWidth * outputHeight > DEFAULT_VIDEO_LIMITS.maxPixels) {
    throw new VideoEngineError("MEMORY_LIMIT", "The requested output resolution is too large for stable browser processing.");
  }

  return {
    sourceRect,
    outputWidth,
    outputHeight,
    rotation,
    flipX: toolId === "video-flipper" && options.flip === "horizontal",
    flipY: toolId === "video-flipper" && options.flip === "vertical",
    fit: options.fit ?? "contain",
  };
}
