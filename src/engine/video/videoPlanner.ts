import type { VideoEnginePlan, VideoProcessOptions, VideoToolId } from "./videoTypes";
import { VideoEngineError } from "./videoTypes";
import { isSupportedOutputFormat } from "./videoCapabilities";

const VIDEO_TOOLS = new Set<VideoToolId>([
  "video-trimmer", "video-cutter", "video-merger", "video-compressor", "video-resizer",
  "video-cropper", "video-rotator", "video-flipper", "video-speed-changer", "video-volume-booster",
  "mute-video", "extract-audio-from-video", "video-to-gif", "gif-to-video", "mp4-to-webm", "webm-to-mp4",
  "video-frame-extractor", "video-thumbnail-generator", "video-metadata-viewer", "video-to-images",
]);

export function planVideoOperation(
  toolId: VideoToolId,
  options: VideoProcessOptions = {},
): VideoEnginePlan {
  if (!VIDEO_TOOLS.has(toolId)) {
    throw new VideoEngineError("INVALID_OPTIONS", `Unknown video tool: ${toolId}`);
  }

  if (options.outputFormat !== undefined && !isSupportedOutputFormat(options.outputFormat)) {
    throw new VideoEngineError("INVALID_OPTIONS", `Unsupported output format: ${String(options.outputFormat)}`);
  }

  if (toolId === "video-metadata-viewer") {
    return base("metadata", "mp4", false, false, false, false, false,
      "Metadata only; no encode required.", options);
  }

  if (toolId === "video-to-gif") {
    return base("gif-encode", "gif", false, false, false, true, false,
      "Decode selected video frames and encode a GIF locally.", options);
  }

  if (toolId === "gif-to-video") {
    return base("gif-decode", options.outputFormat ?? "mp4", true, true, false, true, true,
      "Decode GIF frames locally and encode a browser-supported video.", options);
  }

  if (toolId === "video-merger") {
    return base("merge", options.outputFormat ?? "mp4", true, true, false, true, true,
      "Multiple inputs require a normalized output timeline.", options);
  }

  if (toolId === "video-frame-extractor" || toolId === "video-thumbnail-generator" || toolId === "video-to-images") {
    return base("frame-extract", "mp4", false, false, false, false, false,
      "Sparse/sequential frame decode; no video output encoding.", options);
  }

  const requiresCustomVideo = [
    "video-resizer", "video-cropper", "video-rotator", "video-flipper", "video-speed-changer",
  ].includes(toolId);
  const requiresCustomAudio = [
    "video-volume-booster", "video-speed-changer",
  ].includes(toolId);
  const removesAudio = toolId === "mute-video";
  const extractsAudio = toolId === "extract-audio-from-video";
  const compressor = toolId === "video-compressor";

  const format = extractsAudio ? (options.audioOutputFormat ?? "wav") : (options.outputFormat ?? "mp4");
  const trimLike = toolId === "video-trimmer" || toolId === "video-cutter";
  const containerChange = toolId === "mp4-to-webm" || toolId === "webm-to-mp4";

  // Copy/remux is a preferred attempt, never a guarantee. The container and
  // actual source codec determine whether Mediabunny can retain the streams.
  const copyEligible = Boolean(options.preferCopy ?? true) &&
    !compressor && !requiresCustomVideo && !requiresCustomAudio && !removesAudio && !extractsAudio;

  const requiresVideoEncode = compressor || requiresCustomVideo;
  const requiresAudioEncode = requiresCustomAudio;
  const execution = requiresVideoEncode || requiresAudioEncode
    ? "transcode"
    : copyEligible || trimLike || containerChange
      ? "copy"
      : "transcode";

  return base(
    execution,
    format,
    requiresVideoEncode,
    !removesAudio && requiresAudioEncode,
    copyEligible,
    requiresCustomVideo || compressor,
    requiresCustomAudio,
    compressor
      ? "Compression requires video re-encoding; unaffected audio can remain on the copy path when compatible."
      : trimLike
        ? "Fast trim/cut prefers stream copy and only transcodes when required."
        : requiresCustomVideo || requiresCustomAudio
          ? "This operation requires decoding and re-encoding the affected media track(s)."
          : "Encoded media is copied whenever the requested container and codecs are compatible.",
    options,
  );
}

function base(
  execution: VideoEnginePlan["execution"],
  outputFormat: VideoEnginePlan["outputFormat"],
  requiresVideoEncode: boolean,
  requiresAudioEncode: boolean,
  usesCopyPath: boolean,
  customVideo: boolean,
  customAudio: boolean,
  reason: string,
  options: VideoProcessOptions,
): VideoEnginePlan {
  return {
    execution,
    outputFormat,
    requiresVideoEncode,
    requiresAudioEncode,
    usesCopyPath,
    usesCustomVideoProcessing: customVideo,
    usesCustomAudioProcessing: customAudio,
    usesStreamingTarget: Boolean(options.streamDownload || options.downloadStream),
    hardwareAcceleration: options.hardwareAcceleration ?? "no-preference",
    reason,
  };
}
