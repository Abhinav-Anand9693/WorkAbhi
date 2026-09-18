import {
  ALL_FORMATS,
  BlobSource,
  Input,
  MovOutputFormat,
  MkvOutputFormat,
  Mp4OutputFormat,
  WebMOutputFormat,
  getDecodableAudioCodecs,
  getDecodableVideoCodecs,
  getEncodableAudioCodecs,
  getEncodableVideoCodecs,
} from "mediabunny";

import type { VideoCapabilityReport, VideoOutputFormat } from "./videoTypes";
import { VideoEngineError } from "./videoTypes";

const VIDEO_OUTPUT_FORMATS = ["mp4", "webm", "mov", "mkv"] as const satisfies readonly VideoOutputFormat[];

export async function getVideoCapabilities(): Promise<VideoCapabilityReport> {
  const [
    decodableVideoCodecs,
    encodableVideoCodecs,
    decodableAudioCodecs,
    encodableAudioCodecs,
  ] = await Promise.all([
    getDecodableVideoCodecs(),
    getEncodableVideoCodecs(),
    getDecodableAudioCodecs(),
    getEncodableAudioCodecs(),
  ]);

  return {
    canUseWebCodecs:
      typeof VideoDecoder !== "undefined" &&
      typeof VideoEncoder !== "undefined",
    decodableVideoCodecs: [...decodableVideoCodecs],
    encodableVideoCodecs: [...encodableVideoCodecs],
    decodableAudioCodecs: [...decodableAudioCodecs],
    encodableAudioCodecs: [...encodableAudioCodecs],
    // These are containers implemented by WorkAbhi, not a claim that every
    // browser can encode every codec in every container.
    supportedOutputFormats: [...VIDEO_OUTPUT_FORMATS],
    fileSystemAccess:
      typeof window !== "undefined" &&
      "showSaveFilePicker" in window,
    deviceMemoryGB:
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
        : null,
    hardwareConcurrency:
      typeof navigator !== "undefined"
        ? navigator.hardwareConcurrency ?? null
        : null,
  };
}

export function getSupportedOutputFormats(): VideoOutputFormat[] {
  return [...VIDEO_OUTPUT_FORMATS];
}

export function isSupportedOutputFormat(value: unknown): value is VideoOutputFormat {
  return typeof value === "string" && (VIDEO_OUTPUT_FORMATS as readonly string[]).includes(value);
}

export async function canReadVideoFile(file: File): Promise<boolean> {
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  try {
    return await input.canRead();
  } finally {
    input.dispose();
  }
}

export function outputMimeType(
  format: VideoOutputFormat | "wav" | "mp3" | "gif",
): string {
  switch (format) {
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "mov": return "video/quicktime";
    case "mkv": return "video/x-matroska";
    case "wav": return "audio/wav";
    case "mp3": return "audio/mpeg";
    case "gif": return "image/gif";
    default: throw new VideoEngineError("INVALID_OPTIONS", `Unsupported output format: ${String(format)}`);
  }
}

export function outputFormatInstance(format: VideoOutputFormat) {
  switch (format) {
    case "mp4": return new Mp4OutputFormat();
    case "webm": return new WebMOutputFormat();
    case "mov": return new MovOutputFormat();
    case "mkv": return new MkvOutputFormat();
    default: throw new VideoEngineError("INVALID_OPTIONS", `Unsupported output format: ${String(format)}`);
  }
}

export function streamingOutputFormatInstance(format: VideoOutputFormat) {
  switch (format) {
    case "mp4": return new Mp4OutputFormat({ fastStart: "fragmented" });
    case "webm": return new WebMOutputFormat({ appendOnly: true });
    case "mov": return new MovOutputFormat({ fastStart: "fragmented" });
    case "mkv": return new MkvOutputFormat({ appendOnly: true });
    default: throw new VideoEngineError("INVALID_OPTIONS", `Unsupported output format: ${String(format)}`);
  }
}
