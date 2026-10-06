/* WorkAbhi browser image compression worker. */

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type Stage = "reading" | "optimizing-resolution" | "compressing" | "finalizing" | "complete";

type RequestMessage = {
  id: number;
  file: Blob;
  outputType: OutputFormat;
  quality: number;
  targetBytes?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
};

type ResponseMessage =
  | { id: number; type: "progress"; stage: Stage }
  | { id: number; type: "success"; blob: Blob; width: number; height: number }
  | { id: number; type: "error"; error: string };

const MIN_QUALITY = 0.04;
const MAX_QUALITY = 0.92;
const MAX_QUALITY_ATTEMPTS = 7;
const MAX_TARGET_RESOLUTION_ATTEMPTS = 4;
const MAX_CANVAS_DIMENSION = 32767;
const MAX_WORKING_PIXELS = 16_000_000;
const cancelled = new Set<number>();

function post(message: ResponseMessage): void {
  self.postMessage(message);
}

function throwIfCancelled(id: number): void {
  if (cancelled.has(id)) {
    throw new DOMException("Processing cancelled.", "AbortError");
  }
}

function clampQuality(value: number): number {
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, value));
}

function assertDimensions(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION ||
    width * height > MAX_WORKING_PIXELS
  ) {
    throw new Error(
      `The image is too large for safe browser processing at ${Math.round(width)}×${Math.round(height)}. Use a resize or a larger target size.`
    );
  }
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  let scale = 1;
  if (maxWidth && width > maxWidth) scale = Math.min(scale, maxWidth / width);
  if (maxHeight && height > maxHeight) scale = Math.min(scale, maxHeight / height);

  let nextWidth = Math.max(1, Math.round(width * scale));
  let nextHeight = Math.max(1, Math.round(height * scale));

  const pixels = nextWidth * nextHeight;
  if (pixels > MAX_WORKING_PIXELS) {
    const safetyScale = Math.sqrt(MAX_WORKING_PIXELS / pixels);
    nextWidth = Math.max(1, Math.floor(nextWidth * safetyScale));
    nextHeight = Math.max(1, Math.floor(nextHeight * safetyScale));
  }

  return { width: nextWidth, height: nextHeight };
}

function targetMaxDimension(targetKB: number): number {
  if (targetKB <= 50) return 1000;
  if (targetKB <= 100) return 1200;
  if (targetKB <= 200) return 1600;
  if (targetKB <= 500) return 2200;
  if (targetKB <= 1024) return 2800;
  return 3600;
}

async function render(
  file: Blob,
  width: number,
  height: number,
  outputType: OutputFormat,
  quality: number,
  id: number,
): Promise<Blob> {
  throwIfCancelled(id);
  assertDimensions(width, height);

  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot decode images in the compression worker.");
  }

  let bitmap: ImageBitmap | null = await createImageBitmap(file, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
    imageOrientation: "from-image",
  });

  let canvas: OffscreenCanvas | null = null;
  try {
    throwIfCancelled(id);
    canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", {
      alpha: outputType !== "image/jpeg",
    });
    if (!context) throw new Error("OffscreenCanvas 2D is unavailable on this device.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, bitmap.width, bitmap.height);
    }
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    bitmap = null;

    throwIfCancelled(id);
    return canvas.convertToBlob({
      type: outputType,
      ...(outputType === "image/png" ? {} : { quality: clampQuality(quality) }),
    });
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}

async function compressTarget(
  request: RequestMessage,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (request.outputType === "image/png") {
    throw new Error("PNG target-size compression requires a PNG-specific optimizer; choose JPEG target-size compression.");
  }

  if (!request.width || !request.height || !request.targetBytes) {
    throw new Error("Missing image dimensions for target-size compression.");
  }

  const baseMax = targetMaxDimension(request.targetBytes / 1024);
  const initial = calculateDimensions(request.width, request.height, baseMax, baseMax);
  const candidates = [
    initial,
    calculateDimensions(request.width, request.height, baseMax * 0.8, baseMax * 0.8),
    calculateDimensions(request.width, request.height, baseMax * 0.62, baseMax * 0.62),
    calculateDimensions(request.width, request.height, baseMax * 0.45, baseMax * 0.45),
  ];

  const unique = candidates.filter((candidate, index, array) =>
    array.findIndex((item) => item.width === candidate.width && item.height === candidate.height) === index,
  );

  let lastSize = 0;
  for (let candidateIndex = 0; candidateIndex < Math.min(unique.length, MAX_TARGET_RESOLUTION_ATTEMPTS); candidateIndex += 1) {
    const dimensions = unique[candidateIndex];
    throwIfCancelled(request.id);
    post({ id: request.id, type: "progress", stage: "optimizing-resolution" });

    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < MAX_QUALITY_ATTEMPTS; attempt += 1) {
      throwIfCancelled(request.id);
      post({ id: request.id, type: "progress", stage: "compressing" });
      const quality = attempt === 0 ? MAX_QUALITY : (low + high) / 2;
      const blob = await render(fileFromRequest(request), dimensions.width, dimensions.height, request.outputType, quality, request.id);
      lastSize = blob.size;

      if (blob.size <= request.targetBytes) {
        best = blob;
        low = quality;
      } else {
        high = quality;
      }
    }

    if (best) {
      return { blob: best, width: dimensions.width, height: dimensions.height };
    }
  }

  throw new Error(
    `Unable to reach ${Math.round(request.targetBytes / 1024)} KB. The closest attempt was ${Math.round(lastSize / 1024)} KB. Try a larger target size.`,
  );
}

// Blob/File objects are retained in the request object by structured clone.
function fileFromRequest(request: RequestMessage): Blob {
  return request.file;
}

self.onmessage = async (event: MessageEvent<RequestMessage | { type: "cancel"; id: number }>) => {
  const message = event.data;
  if ("type" in message && message.type === "cancel") {
    cancelled.add(message.id);
    return;
  }

  const request = message as RequestMessage;
  try {
    throwIfCancelled(request.id);
    post({ id: request.id, type: "progress", stage: "reading" });

    if (!request.width || !request.height) {
      throw new Error("Image dimensions were not supplied by the browser-side inspector.");
    }

    const dimensions = calculateDimensions(
      request.width,
      request.height,
      request.maxWidth,
      request.maxHeight,
    );

    if (request.targetBytes) {
      const result = await compressTarget(request);
      post({ id: request.id, type: "progress", stage: "finalizing" });
      post({ id: request.id, type: "success", ...result });
      return;
    }

    const blob = await render(
      fileFromRequest(request),
      dimensions.width,
      dimensions.height,
      request.outputType,
      request.quality,
      request.id,
    );

    post({ id: request.id, type: "progress", stage: "finalizing" });
    post({ id: request.id, type: "success", blob, width: dimensions.width, height: dimensions.height });
  } catch (error) {
    post({
      id: request.id,
      type: "error",
      error: error instanceof Error ? error.message : "Image compression failed.",
    });
  } finally {
    cancelled.delete(request.id);
  }
};
