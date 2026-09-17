export type VideoToolId =
  | "video-trimmer"
  | "video-cutter"
  | "video-merger"
  | "video-compressor"
  | "video-resizer"
  | "video-cropper"
  | "video-rotator"
  | "video-flipper"
  | "video-speed-changer"
  | "video-volume-booster"
  | "mute-video"
  | "extract-audio-from-video"
  | "video-to-gif"
  | "gif-to-video"
  | "mp4-to-webm"
  | "webm-to-mp4"
  | "video-frame-extractor"
  | "video-thumbnail-generator"
  | "video-metadata-viewer"
  | "video-to-images";

export type VideoQuality = "original" | "high" | "medium" | "low";
export type VideoOutputFormat = "mp4" | "webm" | "mov" | "mkv";
export type AudioOutputFormat = "wav" | "mp3";
export type VideoHardwarePreference = "no-preference" | "prefer-hardware" | "prefer-software";

export type VideoStage =
  | "validating"
  | "reading"
  | "planning"
  | "decoding"
  | "encoding"
  | "writing"
  | "finalizing"
  | "complete";

export interface VideoProgress {
  stage: VideoStage;
  progress: number;
  processedSeconds?: number;
  duration?: number;
  outputBytes?: number;
  message: string;
}

export interface VideoProcessOptions {
  quality?: VideoQuality;
  outputFormat?: VideoOutputFormat;
  audioOutputFormat?: AudioOutputFormat;
  width?: number;
  height?: number;
  fit?: "contain" | "cover" | "fill";
  crop?: { left: number; top: number; width: number; height: number };
  rotation?: 90 | 180 | 270;
  flip?: "horizontal" | "vertical";
  start?: number;
  end?: number;
  speed?: number;
  volume?: number;
  frameTime?: number;
  fps?: number;
  maxFrames?: number;
  hardwareAcceleration?: VideoHardwarePreference;
  /** Prefer remux/stream-copy whenever the requested operation allows it. */
  preferCopy?: boolean;
  /** Use the File System Access API when available for large outputs. */
  saveDirectlyToDisk?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: VideoProgress) => void;
}

export interface VideoOutput {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  directToDisk?: boolean;
}

export interface VideoMetadata {
  mimeType: string;
  format: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  rotation: number;
  videoCodec: string | null;
  audioCodec: string | null;
  frameRate: number | null;
  hasAudio: boolean;
  fileSize: number;
}

export interface VideoCapabilityReport {
  canUseWebCodecs: boolean;
  decodableVideoCodecs: string[];
  encodableVideoCodecs: string[];
  decodableAudioCodecs: string[];
  encodableAudioCodecs: string[];
  supportedOutputFormats: VideoOutputFormat[];
  fileSystemAccess: boolean;
  deviceMemoryGB: number | null;
  hardwareConcurrency: number | null;
}

export type VideoExecutionPlan =
  | "metadata"
  | "copy"
  | "transcode"
  | "frame-extract"
  | "merge"
  | "gif-encode"
  | "gif-decode";

export interface VideoEnginePlan {
  execution: VideoExecutionPlan;
  outputFormat: VideoOutputFormat | AudioOutputFormat | "gif";
  requiresVideoEncode: boolean;
  requiresAudioEncode: boolean;
  usesCopyPath: boolean;
  usesCustomVideoProcessing: boolean;
  usesCustomAudioProcessing: boolean;
  usesStreamingTarget: boolean;
  hardwareAcceleration: VideoHardwarePreference;
  reason: string;
}

export type VideoErrorCode =
  | "INVALID_FILE"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_CODEC"
  | "NOT_DECODABLE"
  | "NOT_ENCODABLE"
  | "MEMORY_LIMIT"
  | "CANCELLED"
  | "PROCESSING_FAILED"
  | "OUTPUT_FAILED"
  | "BROWSER_UNSUPPORTED"
  | "INVALID_OPTIONS"
  | "UNKNOWN";

export class VideoEngineError extends Error {
  readonly code: VideoErrorCode;
  readonly cause?: unknown;

  constructor(code: VideoErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "VideoEngineError";
    this.code = code;
    this.cause = cause;
  }
}

export interface VideoEngineLimits {
  maxInputBytes: number;
  maxMergeFiles: number;
  maxMergeBytes: number;
  maxPixels: number;
  maxExtractFrames: number;
  maxExtractDimension: number;
  maxGifFrames: number;
  maxGifDimension: number;
  maxInMemoryOutputBytes: number;
}

export const DEFAULT_VIDEO_LIMITS: VideoEngineLimits = {
  maxInputBytes: 250 * 1024 * 1024,
  maxMergeFiles: 12,
  maxMergeBytes: 500 * 1024 * 1024,
  maxPixels: 3840 * 2160,
  maxExtractFrames: 300,
  maxExtractDimension: 1920,
  maxGifFrames: 180,
  maxGifDimension: 720,
  maxInMemoryOutputBytes: 100 * 1024 * 1024,
};
