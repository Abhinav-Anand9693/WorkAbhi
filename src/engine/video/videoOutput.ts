import { BufferTarget, Output, StreamTarget } from "mediabunny";
import type { VideoOutputFormat } from "@/engine/video/videoTypes";
import { outputFormatInstance } from "./videoCapabilities";
import { VideoEngineError } from "@/engine/video/videoTypes";

interface SaveFilePickerOptionsLike {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface WindowWithSavePicker extends Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptionsLike) => Promise<FileSystemFileHandleLike>;
}

export interface OutputContext {
  output: Output;
  bufferTarget: BufferTarget | null;
  directToDisk: boolean;
}

export async function createVideoOutput(
  format: VideoOutputFormat,
  filename: string,
  directToDisk: boolean,
): Promise<OutputContext> {
  const outputFormat = outputFormatInstance(format);

  if (directToDisk) {
    const picker = (window as WindowWithSavePicker).showSaveFilePicker;
    if (!picker) {
      throw new VideoEngineError(
        "BROWSER_UNSUPPORTED",
        "Direct-to-disk saving is not supported by this browser. Turn off direct saving and use the normal download instead.",
      );
    }

    const handle = await picker({ suggestedName: filename });
    const writable = await handle.createWritable();
    return {
      output: new Output({
        format: outputFormat,
        target: new StreamTarget(writable, { chunked: true }),
      }),
      bufferTarget: null,
      directToDisk: true,
    };
  }

  const bufferTarget = new BufferTarget();
  return {
    output: new Output({
      format: outputFormat,
      target: bufferTarget,
    }),
    bufferTarget,
    directToDisk: false,
  };
}

export function getOutputBuffer(output: Output): ArrayBuffer {
  const target = output.target;
  if (!(target instanceof BufferTarget) || !target.buffer) {
    throw new VideoEngineError("OUTPUT_FAILED", "The video output was written directly to disk and has no in-memory buffer.");
  }
  return target.buffer;
}