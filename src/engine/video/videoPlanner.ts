import type { VideoEnginePlan, VideoProcessOptions, VideoToolId } from "./videoTypes";

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
  if (!VIDEO_TOOLS.has(toolId)) throw new Error(`Unknown video tool: ${toolId}`);

  if (toolId === "video-metadata-viewer") {
    return base("metadata", "mp4", false, false, false, false, false, "Metadata only; no encode required.", options);
  }

  if (toolId === "video-to-gif") {
    return base("gif-encode", "gif", true, false, false, true, false, "Decode selected frames and encode a GIF locally.", options);
  }

  if (toolId === "gif-to-video") {
    return base("gif-decode", options.outputFormat ?? "mp4", true, false, false, true, false, "Decode GIF frames locally and encode a browser-supported video.", options);
  }

  if (toolId === "video-merger") {
    return base("merge", options.outputFormat ?? "mp4", true, true, false, true, true, "Multiple inputs require a single normalized output timeline.", options);
  }

  if (toolId === "video-frame-extractor" || toolId === "video-thumbnail-generator" || toolId === "video-to-images") {
    return base("frame-extract", "mp4", false, false, false, false, false, "Sparse/sequential frame decode; no video output encoding.", options);
  }

  const requiresCustomVideo = [
    "video-resizer", "video-cropper", "video-rotator", "video-flipper", "video-speed-changer",
  ].includes(toolId);
  const requiresCustomAudio = ["video-volume-booster", "video-speed-changer"].includes(toolId);
  const requiresCompression = toolId === "video-compressor";
  const removesAudio = toolId === "mute-video";
  const extractsAudio = toolId === "extract-audio-from-video";
  const onlyContainerChange = toolId === "mp4-to-webm" || toolId === "webm-to-mp4";
  const trimLike = toolId === "video-trimmer" || toolId === "video-cutter";

  const requiresVideoEncode = requiresCompression || requiresCustomVideo || onlyContainerChange;
  const requiresAudioEncode = requiresCompression || requiresCustomAudio || onlyContainerChange;
  const copyEligible = Boolean(options.preferCopy ?? true) && !requiresVideoEncode && !requiresAudioEncode && !removesAudio && !extractsAudio;
  const format = extractsAudio ? (options.audioOutputFormat ?? "wav") : (options.outputFormat ?? "mp4");

  let execution: VideoEnginePlan["execution"] = "transcode";
  if (copyEligible || trimLike) execution = "copy";

  let reason = "Mediabunny will copy encoded media when possible and transcode only when required.";
  if (requiresCompression) reason = "Compression requires re-encoding so the selected quality can reduce media bitrate/size.";
  else if (requiresCustomVideo) reason = "Video-frame processing requires video decoding and re-encoding; compatible audio can remain copied.";
  else if (requiresCustomAudio) reason = "Audio processing requires audio decoding and re-encoding; compatible video can remain copied.";
  else if (removesAudio) reason = "The primary audio track is discarded; video can remain stream-copied when the output container permits it.";
  else if (onlyContainerChange) reason = "The output container changes, so compatible tracks are copied and incompatible tracks are transcoded.";
  else if (trimLike) reason = "Trimming prefers stream-copy at packet/keyframe boundaries when possible.";

  return base(
    execution,
    format,
    requiresVideoEncode,
    requiresAudioEncode,
    copyEligible || trimLike,
    requiresCustomVideo,
    requiresCustomAudio,
    reason,
    options,
  );
}

function base(
  execution: VideoEnginePlan["execution"],
  outputFormat: VideoEnginePlan["outputFormat"],
  requiresVideoEncode: boolean,
  requiresAudioEncode: boolean,
  usesCopyPath: boolean,
  usesCustomVideoProcessing: boolean,
  usesCustomAudioProcessing: boolean,
  reason: string,
  options: VideoProcessOptions,
): VideoEnginePlan {
  return {
    execution,
    outputFormat,
    requiresVideoEncode,
    requiresAudioEncode,
    usesCopyPath,
    usesCustomVideoProcessing,
    usesCustomAudioProcessing,
    usesStreamingTarget: Boolean(options.saveDirectlyToDisk),
    hardwareAcceleration: options.hardwareAcceleration ?? "no-preference",
    reason,
  };
}
