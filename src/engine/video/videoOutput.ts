import {
  AppendOnlyStreamTarget,
  BufferTarget,
  Mp3OutputFormat,
  Output,
  WavOutputFormat,
} from "mediabunny";

import type { AudioOutputFormat, VideoOutputFormat } from "./videoTypes";
import { outputFormatInstance, streamingOutputFormatInstance } from "./videoCapabilities";
import { VideoEngineError } from "./videoTypes";

export interface OutputContext {
  output: Output;
  bufferTarget: BufferTarget | null;
  streamedDownload: boolean;
}

/**
 * Creates an output target.
 *
 * Large browser downloads use AppendOnlyStreamTarget + StreamSaver's
 * WritableStream. No File System Access save picker is involved.
 */
export async function createVideoOutput(
  format: VideoOutputFormat,
  _filename: string,
  streamDownload: boolean,
  downloadStream?: WritableStream<Uint8Array> | null,
): Promise<OutputContext> {
  if (streamDownload) {
    if (!downloadStream) {
      throw new VideoEngineError(
        "OUTPUT_FAILED",
        "The browser download stream could not be created.",
      );
    }

    return {
      output: new Output({
        format: streamingOutputFormatInstance(format),
        target: new AppendOnlyStreamTarget(downloadStream),
      }),
      bufferTarget: null,
      streamedDownload: true,
    };
  }

  const bufferTarget = new BufferTarget();

  return {
    output: new Output({
      format: outputFormatInstance(format),
      target: bufferTarget,
    }),
    bufferTarget,
    streamedDownload: false,
  };
}

export async function createAudioOutput(
  format: AudioOutputFormat,
  _filename: string,
  streamDownload: boolean,
  downloadStream?: WritableStream<Uint8Array> | null,
): Promise<OutputContext> {
  // MP3 can be made append-only by disabling its Xing header. WAVE needs
  // final header information, so it intentionally remains a memory output.
  if (streamDownload && format === "mp3") {
    if (!downloadStream) {
      throw new VideoEngineError(
        "OUTPUT_FAILED",
        "The browser download stream could not be created.",
      );
    }

    return {
      output: new Output({
        format: new Mp3OutputFormat({ xingHeader: false }),
        target: new AppendOnlyStreamTarget(downloadStream),
      }),
      bufferTarget: null,
      streamedDownload: true,
    };
  }

  const bufferTarget = new BufferTarget();
  const outputFormat = format === "mp3"
    ? new Mp3OutputFormat({ xingHeader: false })
    : new WavOutputFormat();

  return {
    output: new Output({
      format: outputFormat,
      target: bufferTarget,
    }),
    bufferTarget,
    streamedDownload: false,
  };
}

export function getOutputBuffer(output: Output): ArrayBuffer {
  const target = output.target;

  if (!(target instanceof BufferTarget) || !target.buffer) {
    throw new VideoEngineError(
      "OUTPUT_FAILED",
      "The video output was not kept in browser memory.",
    );
  }

  return target.buffer;
}
