import {
  ALL_FORMATS,
  BlobSource,
  Input,
  Mp4OutputFormat,
  WebMOutputFormat,
  MovOutputFormat,
  MkvOutputFormat,
  getDecodableAudioCodecs,
  getDecodableVideoCodecs,
  getEncodableAudioCodecs,
  getEncodableVideoCodecs,
} from "mediabunny";

import type { VideoCapabilityReport, VideoOutputFormat } from "@/engine/video/videoTypes";

export async function getVideoCapabilities(): Promise<VideoCapabilityReport> {
  const [decodableVideoCodecs, encodableVideoCodecs, decodableAudioCodecs, encodableAudioCodecs] = await Promise.all([
    getDecodableVideoCodecs(),
    getEncodableVideoCodecs(),
    getDecodableAudioCodecs(),
    getEncodableAudioCodecs(),
  ]);

  return {
    canUseWebCodecs:
      typeof VideoDecoder !== "undefined" && typeof VideoEncoder !== "undefined",
    decodableVideoCodecs: [...decodableVideoCodecs],
    encodableVideoCodecs: [...encodableVideoCodecs],
    decodableAudioCodecs: [...decodableAudioCodecs],
    encodableAudioCodecs: [...encodableAudioCodecs],
    supportedOutputFormats: getSupportedOutputFormats(),
    fileSystemAccess:
      typeof window !== "undefined" && "showSaveFilePicker" in window,
    deviceMemoryGB:
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
        : null,
    hardwareConcurrency:
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? null : null,
  };
}

export function getSupportedOutputFormats(): VideoOutputFormat[] {
  return ["mp4", "webm", "mov", "mkv"];
}

/**
 * Cheap local capability probe for a particular file. BlobSource is lazy/ranged;
 * it does not require copying the complete file into a second ArrayBuffer.
 */
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

export function outputMimeType(format: VideoOutputFormat | "wav" | "mp3" | "gif"): string {
  switch (format) {
    case "webm": return "video/webm";
    case "mov": return "video/quicktime";
    case "mkv": return "video/x-matroska";
    case "wav": return "audio/wav";
    case "mp3": return "audio/mpeg";
    case "gif": return "image/gif";
    default: return "video/mp4";
  }
}

export function outputFormatInstance(format: VideoOutputFormat) {
  switch (format) {
    case "webm": return new WebMOutputFormat();
    case "mov": return new MovOutputFormat();
    case "mkv": return new MkvOutputFormat();
    default: return new Mp4OutputFormat();
  }
}
