/*
 * WorkAbhi Image Compression Worker
 *
 * All compression work happens off the React/main thread when the browser
 * supports module workers + OffscreenCanvas + createImageBitmap.
 *
 * Important design rule:
 * - Compression NEVER changes pixel dimensions.
 * - Target-size tools change encoding quality only.
 * - Images are processed one at a time by the caller.
 */

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type Stage = "reading" | "compressing" | "finalizing" | "complete";

type RequestMessage = {
  id: number;
  file: Blob;
  outputType: OutputFormat;
  quality: number;
  targetBytes?: number;
  expectedWidth?: number;
  expectedHeight?: number;
};

type ResponseMessage =
  | { id: number; type: "progress"; stage: Stage }
  | { id: number; type: "success"; blob: Blob; width: number; height: number }
  | { id: number; type: "error"; error: string };

const MAX_QUALITY = 0.95;
const MIN_QUALITY = 0.04;
const QUALITY_ATTEMPTS = 8;
const MAX_CANVAS_DIMENSION = 32767;
const cancelled = new Set<number>();

function post(message: ResponseMessage): void {
  self.postMessage(message);
}

function assertDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `This browser cannot safely create a ${Math.round(width)}×${Math.round(height)} output canvas. The image was not resized.`
    );
  }
}

async function canvasToBlob(
  canvas: OffscreenCanvas,
  type: OutputFormat,
  quality: number
): Promise<Blob> {
  return canvas.convertToBlob({
    type,
    ...(type === "image/png" ? {} : { quality }),
  });
}

function clampQuality(value: number): number {
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, value));
}

self.onmessage = async (event: MessageEvent<RequestMessage | { type: "cancel"; id: number }>) => {
  const message = event.data;

  if ("type" in message && message.type === "cancel") {
    cancelled.add(message.id);
    return;
  }

  const request = message as RequestMessage;

  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;

  try {
    if (cancelled.has(request.id)) throw new DOMException("Processing cancelled.", "AbortError");
    post({ id: request.id, type: "progress", stage: "reading" });

    if (typeof createImageBitmap !== "function") {
      throw new Error("This browser does not support worker image decoding.");
    }

    bitmap = await createImageBitmap(request.file, {
      imageOrientation: "from-image",
    });

    if (cancelled.has(request.id)) throw new DOMException("Processing cancelled.", "AbortError");

    const width = bitmap.width;
    const height = bitmap.height;

    assertDimensions(width, height);

    if (
      request.expectedWidth &&
      request.expectedHeight &&
      (width !== request.expectedWidth || height !== request.expectedHeight)
    ) {
      throw new Error(
        `The browser decoded this image as ${width}×${height}, but the source dimensions are ${request.expectedWidth}×${request.expectedHeight}. The result was rejected to prevent dimension changes.`
      );
    }

    canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", {
      alpha: request.outputType !== "image/jpeg",
    });

    if (!context) {
      throw new Error("OffscreenCanvas 2D is not available on this device.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (request.outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(bitmap, 0, 0, width, height);
    if (cancelled.has(request.id)) throw new DOMException("Processing cancelled.", "AbortError");
    bitmap.close();
    bitmap = null;

    const render = async (quality: number): Promise<Blob> => {
      if (!canvas) throw new Error("Image canvas was released.");
      return canvasToBlob(canvas, request.outputType, quality);
    };

    if (!request.targetBytes) {
      post({ id: request.id, type: "progress", stage: "compressing" });

      const blob = await render(clampQuality(request.quality));

      post({
        id: request.id,
        type: "progress",
        stage: "finalizing",
      });

      post({
        id: request.id,
        type: "success",
        blob,
        width,
        height,
      });
      return;
    }

    if (request.outputType === "image/png") {
      throw new Error(
        "PNG target-size compression cannot use JPEG-style quality. Use the PNG Compressor or choose a JPEG target-size tool."
      );
    }

    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < QUALITY_ATTEMPTS; attempt += 1) {
      if (cancelled.has(request.id)) throw new DOMException("Processing cancelled.", "AbortError");
      post({ id: request.id, type: "progress", stage: "compressing" });

      const quality = attempt === 0 ? MAX_QUALITY : (low + high) / 2;
      const blob = await render(quality);

      if (blob.size <= request.targetBytes) {
        best = blob;
        low = quality;
      } else {
        high = quality;
      }
    }

    if (!best) {
      throw new Error(
        `Unable to reach ${Math.round(request.targetBytes / 1024)} KB while preserving the original ${width}×${height} dimensions. The image was not downscaled.`
      );
    }

    post({ id: request.id, type: "progress", stage: "finalizing" });
    post({
      id: request.id,
      type: "success",
      blob: best,
      width,
      height,
    });
  } catch (error) {
    post({
      id: request.id,
      type: "error",
      error: error instanceof Error ? error.message : "Image compression failed.",
    });
  } finally {
    bitmap?.close();
    cancelled.delete(request.id);
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
};
