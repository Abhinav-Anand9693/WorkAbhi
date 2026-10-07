export type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type CompressionStage =
  | "reading"
  | "optimizing-resolution"
  | "compressing"
  | "finalizing"
  | "complete";

export interface CompressionOptions {
  quality?: number;
  outputType?: OutputFormat;
  outputFormat?: OutputFormat;
  maxWidth?: number;
  maxHeight?: number;
  signal?: AbortSignal;
  onProgress?: (
    stage: CompressionStage
  ) => void;
}

export interface TargetCompressionOptions {
  targetKB: number;
  outputType?: OutputFormat;
  outputFormat?: OutputFormat;
  signal?: AbortSignal;
  onProgress?: (
    stage: CompressionStage
  ) => void;
}

const MAX_QUALITY = 0.95;
const MIN_QUALITY = 0.04;
const QUALITY_ATTEMPTS = 8;

const HEADER_READ_BYTES =
  512 * 1024;

const MAX_CANVAS_DIMENSION =
  32767;

const MIN_TARGET_PIXELS =
  300_000;

const MAX_TARGET_PIXELS =
  12_000_000;

interface ImageDimensions {
  width: number;
  height: number;
}

interface WorkerSuccess {
  id: number;
  type: "success";
  blob: Blob;
  width: number;
  height: number;
}

interface WorkerProgress {
  id: number;
  type: "progress";
  stage: CompressionStage;
}

interface WorkerError {
  id: number;
  type: "error";
  error: string;
}

type WorkerResponse =
  | WorkerSuccess
  | WorkerProgress
  | WorkerError;

interface WorkerRequest {
  id: number;
  file: Blob;
  outputType: OutputFormat;
  quality: number;
  targetBytes?: number;
  expectedWidth?: number;
  expectedHeight?: number;
  resizeWidth?: number;
  resizeHeight?: number;
}

let requestId = 0;

function throwIfAborted(
  signal?: AbortSignal
): void {
  if (signal?.aborted) {
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
  }
}

function clampQuality(
  quality: number
): number {
  return Math.min(
    MAX_QUALITY,
    Math.max(
      MIN_QUALITY,
      quality
    )
  );
}

function getOutputType(
  options: CompressionOptions
): OutputFormat {
  return (
    options.outputType ??
    options.outputFormat ??
    "image/jpeg"
  );
}

function getTargetOutputType(
  options: TargetCompressionOptions
): OutputFormat {
  return (
    options.outputType ??
    options.outputFormat ??
    "image/jpeg"
  );
}

function readUint16(
  view: DataView,
  offset: number,
  littleEndian = false
): number {
  return view.getUint16(
    offset,
    littleEndian
  );
}

function readUint32(
  view: DataView,
  offset: number,
  littleEndian = false
): number {
  return view.getUint32(
    offset,
    littleEndian
  );
}

async function readHeader(
  file: Blob
): Promise<Uint8Array> {
  const buffer =
    await file
      .slice(
        0,
        Math.min(
          HEADER_READ_BYTES,
          file.size
        )
      )
      .arrayBuffer();

  return new Uint8Array(
    buffer
  );
}

function parsePng(
  bytes: Uint8Array
): ImageDimensions | null {
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    );

  return {
    width:
      readUint32(view, 16),
    height:
      readUint32(view, 20),
  };
}

function parseGif(
  bytes: Uint8Array
): ImageDimensions | null {
  if (
    bytes.length < 10 ||
    String.fromCharCode(
      bytes[0],
      bytes[1],
      bytes[2]
    ) !== "GIF"
  ) {
    return null;
  }

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    );

  return {
    width:
      readUint16(
        view,
        6,
        true
      ),
    height:
      readUint16(
        view,
        8,
        true
      ),
  };
}

function parseWebp(
  bytes: Uint8Array
): ImageDimensions | null {
  if (
    bytes.length < 30 ||
    String.fromCharCode(
      bytes[0],
      bytes[1],
      bytes[2],
      bytes[3]
    ) !== "RIFF" ||
    String.fromCharCode(
      bytes[8],
      bytes[9],
      bytes[10],
      bytes[11]
    ) !== "WEBP"
  ) {
    return null;
  }

  const chunk =
    String.fromCharCode(
      bytes[12],
      bytes[13],
      bytes[14],
      bytes[15]
    );

  if (
    chunk === "VP8X" &&
    bytes.length >= 30
  ) {
    const width =
      1 +
      bytes[24] +
      (bytes[25] << 8) +
      (bytes[26] << 16);

    const height =
      1 +
      bytes[27] +
      (bytes[28] << 8) +
      (bytes[29] << 16);

    return {
      width,
      height,
    };
  }

  return null;
}

function parseJpeg(
  bytes: Uint8Array
): ImageDimensions | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8
  ) {
    return null;
  }

  let offset = 2;

  while (
    offset + 9 <
    bytes.length
  ) {
    if (
      bytes[offset] !==
      0xff
    ) {
      offset++;
      continue;
    }

    while (
      offset < bytes.length &&
      bytes[offset] === 0xff
    ) {
      offset++;
    }

    const marker =
      bytes[offset++];

    if (
      marker === 0xd8 ||
      marker === 0xd9
    ) {
      continue;
    }

    if (
      offset + 2 >
      bytes.length
    ) {
      break;
    }

    const segmentLength =
      (bytes[offset] << 8) |
      bytes[offset + 1];

    if (
      segmentLength < 2 ||
      offset +
        segmentLength >
        bytes.length
    ) {
      break;
    }

    const isSof =
      (
        marker >= 0xc0 &&
        marker <= 0xc3
      ) ||
      (
        marker >= 0xc5 &&
        marker <= 0xc7
      ) ||
      (
        marker >= 0xc9 &&
        marker <= 0xcb
      ) ||
      (
        marker >= 0xcd &&
        marker <= 0xcf
      );

    if (
      isSof &&
      segmentLength >= 7
    ) {
      const height =
        (bytes[offset + 3] << 8) |
        bytes[offset + 4];

      const width =
        (bytes[offset + 5] << 8) |
        bytes[offset + 6];

      return {
        width,
        height,
      };
    }

    offset +=
      segmentLength;
  }

  return null;
}

async function getImageDimensions(
  file: Blob
): Promise<ImageDimensions> {
  const bytes =
    await readHeader(file);

  const parsers = [
    parseJpeg,
    parsePng,
    parseGif,
    parseWebp,
  ];

  for (
    const parser of parsers
  ) {
    const result =
      parser(bytes);

    if (
      result &&
      result.width > 0 &&
      result.height > 0
    ) {
      return result;
    }
  }

  /*
   * This fallback is intentionally
   * only for formats that cannot be
   * inspected from their header.
   *
   * JPEG never reaches this path.
   */
  if (
    typeof createImageBitmap ===
    "function"
  ) {
    const bitmap =
      await createImageBitmap(
        file
      );

    try {
      return {
        width:
          bitmap.width,
        height:
          bitmap.height,
      };
    } finally {
      bitmap.close();
    }
  }

  throw new Error(
    "Unable to determine image dimensions."
  );
}

function calculateTargetResolution(
  original: ImageDimensions,
  targetBytes: number
): ImageDimensions {
  const sourcePixels =
    original.width *
    original.height;

  /*
   * Conservative bytes-per-pixel
   * estimate for JPEG.
   */
  const estimatedPixels =
    targetBytes / 0.25;

  const targetPixels =
    Math.min(
      sourcePixels,
      Math.max(
        MIN_TARGET_PIXELS,
        Math.min(
          MAX_TARGET_PIXELS,
          estimatedPixels
        )
      )
    );

  if (
    sourcePixels <=
    targetPixels
  ) {
    return {
      ...original,
    };
  }

  const scale =
    Math.sqrt(
      targetPixels /
        sourcePixels
    );

  return {
    width: Math.max(
      1,
      Math.round(
        original.width *
          scale
      )
    ),
    height: Math.max(
      1,
      Math.round(
        original.height *
          scale
      )
    ),
  };
}

function assertOutputDimensions(
  width: number,
  height: number
): void {
  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `Output dimensions ${width}×${height} exceed the browser canvas limit.`
    );
  }
}

function createWorker(): Worker {
  return new Worker(
    new URL(
      "../../workers/imageCompressionWorker.ts",
      import.meta.url
    ),
    {
      type: "module",
    }
  );
}

function runWorker(
  request: Omit<
    WorkerRequest,
    "id"
  >,
  signal?: AbortSignal,
  onProgress?: (
    stage: CompressionStage
  ) => void
): Promise<WorkerSuccess> {
  return new Promise(
    (resolve, reject) => {
      throwIfAborted(signal);

      const worker =
        createWorker();

      const id =
        ++requestId;

      let settled =
        false;

      const cleanup =
        () => {
          worker.onmessage =
            null;
          worker.onerror =
            null;
          worker.terminate();

          signal?.removeEventListener(
            "abort",
            abort
          );
        };

      const finishError =
        (error: unknown) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();

          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Image processing failed."
                )
          );
        };

      const abort =
        () => {
          if (settled) {
            return;
          }

          worker.postMessage({
            type: "cancel",
            id,
          });

          finishError(
            new DOMException(
              "Processing cancelled.",
              "AbortError"
            )
          );
        };

      worker.onmessage =
        (
          event: MessageEvent<WorkerResponse>
        ) => {
          const message =
            event.data;

          if (
            message.id !== id
          ) {
            return;
          }

          if (
            message.type ===
            "progress"
          ) {
            onProgress?.(
              message.stage
            );

            return;
          }

          if (
            message.type ===
            "error"
          ) {
            finishError(
              new Error(
                message.error
              )
            );

            return;
          }

          if (
            message.type ===
            "success"
          ) {
            if (
              !message.blob
            ) {
              finishError(
                new Error(
                  "Worker returned an empty image."
                )
              );

              return;
            }

            settled = true;
            cleanup();

            resolve(
              message
            );
          }
        };

      worker.onerror =
        (event) => {
          finishError(
            new Error(
              event.message ||
                "Image worker failed."
            )
          );
        };

      signal?.addEventListener(
        "abort",
        abort,
        { once: true }
      );

      worker.postMessage({
        ...request,
        id,
      });
    }
  );
}

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please select a valid image file."
    );
  }

  throwIfAborted(
    options.signal
  );

  const quality =
    clampQuality(
      options.quality ??
        0.8
    );

  const outputType =
    getOutputType(
      options
    );

  options.onProgress?.(
    "reading"
  );

  const dimensions =
    await getImageDimensions(
      file
    );

  throwIfAborted(
    options.signal
  );

  let width =
    dimensions.width;

  let height =
    dimensions.height;

  if (
    options.maxWidth ||
    options.maxHeight
  ) {
    const scale =
      Math.min(
        options.maxWidth
          ? options.maxWidth /
              width
          : 1,
        options.maxHeight
          ? options.maxHeight /
              height
          : 1,
        1
      );

    width =
      Math.max(
        1,
        Math.round(
          width * scale
        )
      );

    height =
      Math.max(
        1,
        Math.round(
          height * scale
        )
      );
  }

  assertOutputDimensions(
    width,
    height
  );

  options.onProgress?.(
    "optimizing-resolution"
  );

  /*
   * JPEG uses SIP.
   *
   * PNG/WebP retain the existing
   * browser worker path.
   */
  const result =
    await runWorker(
      {
        file,
        outputType,
        quality,
        expectedWidth:
          dimensions.width,
        expectedHeight:
          dimensions.height,
        resizeWidth:
          width !==
          dimensions.width
            ? width
            : undefined,
        resizeHeight:
          height !==
          dimensions.height
            ? height
            : undefined,
      },
      options.signal,
      options.onProgress
    );

  options.onProgress?.(
    "complete"
  );

  return result.blob;
}

export async function compressToTargetSize(
  file: File | Blob,
  optionsOrTarget:
    | TargetCompressionOptions
    | number,
  legacyOutputType:
    OutputFormat =
      "image/jpeg"
): Promise<Blob> {
  const options =
    typeof optionsOrTarget ===
    "number"
      ? {
          targetKB:
            optionsOrTarget,
          outputType:
            legacyOutputType,
        }
      : optionsOrTarget;

  if (
    !Number.isFinite(
      options.targetKB
    ) ||
    options.targetKB <= 0
  ) {
    throw new Error(
      "Target size must be greater than zero."
    );
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please select a valid image file."
    );
  }

  const targetBytes =
    Math.floor(
      options.targetKB *
        1024
    );

  const outputType =
    getTargetOutputType(
      options
    );

  if (
    outputType !==
    "image/jpeg"
  ) {
    throw new Error(
      "Target-size compression currently requires JPEG output."
    );
  }

  if (
    file.size <=
    targetBytes
  ) {
    options.onProgress?.(
      "complete"
    );

    return file;
  }

  options.onProgress?.(
    "reading"
  );

  const original =
    await getImageDimensions(
      file
    );

  throwIfAborted(
    options.signal
  );

  let dimensions =
    calculateTargetResolution(
      original,
      targetBytes
    );

  /*
   * Retry with lower resolution
   * if the requested target cannot
   * be reached at the first resolution.
   */
  for (
    let attempt = 0;
    attempt < 5;
    attempt++
  ) {
    throwIfAborted(
      options.signal
    );

    options.onProgress?.(
      "optimizing-resolution"
    );

    try {
      const result =
        await runWorker(
          {
            file,
            outputType:
              "image/jpeg",
            quality:
              options.outputType ===
              "image/jpeg"
                ? 0.8
                : 0.8,
            targetBytes,
            expectedWidth:
              dimensions.width,
            expectedHeight:
              dimensions.height,
            resizeWidth:
              dimensions.width,
            resizeHeight:
              dimensions.height,
          },
          options.signal,
          options.onProgress
        );

      if (
        result.blob.size <=
        targetBytes
      ) {
        options.onProgress?.(
          "complete"
        );

        return result.blob;
      }
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        throw error;
      }
    }

    dimensions = {
      width: Math.max(
        1,
        Math.round(
          dimensions.width *
            0.64
        )
      ),
      height: Math.max(
        1,
        Math.round(
          dimensions.height *
            0.64
        )
      ),
    };
  }

  throw new Error(
    `Unable to reach ${options.targetKB} KB while maintaining reasonable image quality.`
  );
}

export async function resizeByWidth(
  file: File | Blob,
  width: number
): Promise<Blob> {
  if (
    !Number.isFinite(width) ||
    width <= 0
  ) {
    throw new Error(
      "Width must be greater than zero."
    );
  }

  const original =
    await getImageDimensions(
      file
    );

  const height =
    Math.max(
      1,
      Math.round(
        original.height *
          (width /
            original.width)
      )
    );

  return compressImage(
    file,
    {
      outputType:
        "image/jpeg",
      quality: 0.9,
      maxWidth:
        Math.round(width),
      maxHeight:
        height,
    }
  );
}

export async function resizeByHeight(
  file: File | Blob,
  height: number
): Promise<Blob> {
  if (
    !Number.isFinite(height) ||
    height <= 0
  ) {
    throw new Error(
      "Height must be greater than zero."
    );
  }

  const original =
    await getImageDimensions(
      file
    );

  const width =
    Math.max(
      1,
      Math.round(
        original.width *
          (height /
            original.height)
      )
    );

  return compressImage(
    file,
    {
      outputType:
        "image/jpeg",
      quality: 0.9,
      maxWidth:
        width,
      maxHeight:
        Math.round(height),
    }
  );
}

export async function resizeByPercentage(
  file: File | Blob,
  percentage: number
): Promise<Blob> {
  if (
    !Number.isFinite(
      percentage
    ) ||
    percentage <= 0
  ) {
    throw new Error(
      "Percentage must be greater than zero."
    );
  }

  const original =
    await getImageDimensions(
      file
    );

  const width =
    Math.max(
      1,
      Math.round(
        original.width *
          percentage /
          100
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        original.height *
          percentage /
          100
      )
    );

  return compressImage(
    file,
    {
      outputType:
        "image/jpeg",
      quality: 0.9,
      maxWidth: width,
      maxHeight: height,
    }
  );
}