/*
 * WorkAbhi Image Compression Worker
 *
 * All compression work happens off the React/main thread when the browser
 * supports module workers + OffscreenCanvas + createImageBitmap.
 *
 * Important design rule:
 * - JPEG/PNG -> JPEG uses @standardagents/sip: a scanline/WASM codec path
 *   that does not depend on browser canvas texture limits.
 * - Normal compression preserves encoded dimensions.
 * - Target-size tools may intentionally resize, preserving aspect ratio.
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
  resizeWidth?: number;
  resizeHeight?: number;
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


async function compressWithSip(
  request: RequestMessage,
  signalCheck: () => void
): Promise<{ blob: Blob; width: number; height: number }> {
  // SIP's WASM codec path is the production path for JPEG/PNG inputs when the
  // requested output is JPEG. It decodes JPEG scanlines and feeds them directly
  // into a JPEG encoder, avoiding createImageBitmap()/HTML canvas entirely.
  // That is what prevents Samsung/Android's ~8K graphics-surface limit from
  // silently turning 9248x6936 into 8092x6069.
  const input = await request.file.arrayBuffer();
  signalCheck();

  // Load the codec from WorkAbhi's own static asset copy. This deliberately
  // avoids importing a .wasm file through Next/Turbopack's module graph.
  // The build preparation script copies the three SIP runtime files to
  // /workabhi-codecs/sip/.
  // The codec is a runtime asset copied to /public by the prebuild script.
  // TypeScript cannot resolve a public URL as a module specifier, so keep this
  // import intentionally runtime-only.
  const codecUrl = new URL("/workabhi-codecs/sip/index.js", self.location.origin).href;

  // The codec lives in /public and must stay outside Next/Turbopack's module graph.
  // Use a runtime URL plus webpackIgnore so the bundler does not try to resolve
  // the public asset as a server-relative package import.
  const { ready: sipReady, transform: sipTransform, collect: sipCollect } =
    await import(/* webpackIgnore: true */ codecUrl);

  await sipReady();
  signalCheck();

  const transformOptions: { width?: number; height?: number; quality: number } = {
    quality: Math.round(clampQuality(request.quality) * 100),
  };

  if (request.resizeWidth && request.resizeHeight) {
    transformOptions.width = request.resizeWidth;
    transformOptions.height = request.resizeHeight;
  } else if (request.expectedWidth && request.expectedHeight) {
    transformOptions.width = request.expectedWidth;
    transformOptions.height = request.expectedHeight;
  }

  const encoded = sipTransform(input, transformOptions);
  const result = await sipCollect(encoded);
  signalCheck();

  const width = result.info.width;
  const height = result.info.height;

  return {
    blob: new Blob([result.data], { type: "image/jpeg" }),
    width,
    height,
  };
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

    if (request.outputType === "image/jpeg") {
      const result = await compressWithSip(request, () => {
        if (cancelled.has(request.id)) {
          throw new DOMException("Processing cancelled.", "AbortError");
        }
      });

      if (
        request.expectedWidth &&
        request.expectedHeight &&
        (result.width !== request.expectedWidth || result.height !== request.expectedHeight)
      ) {
        throw new Error(
          `The codec returned ${result.width}×${result.height}, but WorkAbhi expected ${request.expectedWidth}×${request.expectedHeight}. The result was rejected.`
        );
      }

      post({ id: request.id, type: "progress", stage: "finalizing" });
      post({
        id: request.id,
        type: "success",
        blob: result.blob,
        width: result.width,
        height: result.height,
      });
      return;
    }

    if (typeof createImageBitmap !== "function") {
      throw new Error("This browser does not support worker image decoding.");
    }

    bitmap = await createImageBitmap(request.file, {
      ...(request.resizeWidth && request.resizeHeight
        ? {
            resizeWidth: request.resizeWidth,
            resizeHeight: request.resizeHeight,
            resizeQuality: "high" as const,
          }
        : {}),
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
      // JPEG is handled by SIP above; this fallback is only PNG/WebP.
      alpha: true,
    });

    if (!context) {
      throw new Error("OffscreenCanvas 2D is not available on this device.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

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
