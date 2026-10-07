/* WorkAbhi browser image compression worker. */

type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

type Stage =
  | "reading"
  | "compressing"
  | "finalizing"
  | "complete";

interface RequestMessage {
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

type ResponseMessage =
  | {
      id: number;
      type: "progress";
      stage: Stage;
    }
  | {
      id: number;
      type: "success";
      blob: Blob;
      width: number;
      height: number;
    }
  | {
      id: number;
      type: "error";
      error: string;
    };

const MAX_QUALITY = 0.95;
const MIN_QUALITY = 0.04;
const QUALITY_ATTEMPTS = 8;

const MAX_CANVAS_DIMENSION = 32767;

const cancelled = new Set<number>();

function post(message: ResponseMessage): void {
  self.postMessage(message);
}

function checkCancelled(id: number): void {
  if (cancelled.has(id)) {
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
  }
}

/**
 * Creates a real ArrayBuffer from a Uint8Array.
 *
 * This avoids the newer TypeScript
 * ArrayBufferLike -> BlobPart incompatibility.
 */
function toArrayBuffer(
  bytes: Uint8Array
): ArrayBuffer {
  const buffer = new ArrayBuffer(
    bytes.byteLength
  );

  new Uint8Array(buffer).set(bytes);

  return buffer;
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

function assertDimensions(
  width: number,
  height: number
): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new Error(
      "Invalid image dimensions."
    );
  }

  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `This browser cannot safely create a ${Math.round(
        width
      )}×${Math.round(
        height
      )} output image.`
    );
  }
}

/**
 * Load SIP inside the worker.
 *
 * IMPORTANT:
 * Do not use a variable named `module`.
 * Next.js reserves that identifier in its
 * module environment and ESLint reports it.
 */
async function loadSip(): Promise<any> {
  const url = new URL(
    "/workabhi-codecs/sip/index.js",
    self.location.origin
  ).href;

  const codecModule = await import(
    /* webpackIgnore: true */
    url
  );

  return codecModule;
}

async function sipEncode(
  input: Blob,
  width: number | undefined,
  height: number | undefined,
  quality: number
): Promise<{
  data: Uint8Array;
  info: {
    width: number;
    height: number;
  };
}> {
  /*
   * Important:
   *
   * SIP is intentionally loaded inside
   * the worker. The main UI thread never
   * needs to decode the original JPEG.
   */
  const bytes =
    await input.arrayBuffer();

  const sip = await loadSip();

  await sip.ready();

  const options: Record<
    string,
    unknown
  > = {
    quality: Math.round(
      clampQuality(
        quality
      ) * 100
    ),
  };

  if (
    width &&
    height
  ) {
    options.width = width;
    options.height = height;
  }

  const image =
    sip.transform(
      bytes,
      options
    );

  return await sip.collect(
    image
  );
}

async function compressJpeg(
  request: RequestMessage
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  checkCancelled(
    request.id
  );

  post({
    id: request.id,
    type: "progress",
    stage: "reading",
  });

  const width =
    request.resizeWidth ??
    request.expectedWidth;

  const height =
    request.resizeHeight ??
    request.expectedHeight;

  /*
   * Normal JPEG compression.
   */
  if (
    !request.targetBytes
  ) {
    const encoded =
      await sipEncode(
        request.file,
        width,
        height,
        request.quality
      );

    checkCancelled(
      request.id
    );

    return {
      /*
       * IMPORTANT:
       * Convert Uint8Array to a real
       * ArrayBuffer before passing it
       * to Blob().
       */
      blob: new Blob(
        [
          toArrayBuffer(
            encoded.data
          ),
        ],
        {
          type: "image/jpeg",
        }
      ),

      width:
        encoded.info.width,

      height:
        encoded.info.height,
    };
  }

  /*
   * Target-size JPEG compression.
   */
  let low =
    MIN_QUALITY;

  let high =
    MAX_QUALITY;

  let best:
    | Blob
    | null = null;

  let bestSize =
    Infinity;

  for (
    let attempt = 0;
    attempt <
      QUALITY_ATTEMPTS;
    attempt++
  ) {
    checkCancelled(
      request.id
    );

    post({
      id: request.id,
      type: "progress",
      stage: "compressing",
    });

    const quality =
      attempt === 0
        ? MAX_QUALITY
        : (low + high) / 2;

    const encoded =
      await sipEncode(
        request.file,
        width,
        height,
        quality
      );

    checkCancelled(
      request.id
    );

    const blob =
      new Blob(
        [
          toArrayBuffer(
            encoded.data
          ),
        ],
        {
          type: "image/jpeg",
        }
      );

    if (
      blob.size <=
      request.targetBytes
    ) {
      if (
        blob.size <
        bestSize
      ) {
        best = blob;

        bestSize =
          blob.size;
      }

      low = quality;
    } else {
      high = quality;
    }
  }

  if (!best) {
    throw new Error(
      `Unable to reach ${Math.round(
        request.targetBytes / 1024
      )} KB at the planned resolution.`
    );
  }

  return {
    blob: best,
    width: width!,
    height: height!,
  };
}

async function canvasBlob(
  canvas: OffscreenCanvas,
  type: OutputFormat,
  quality: number
): Promise<Blob> {
  return canvas.convertToBlob({
    type,

    ...(type === "image/png"
      ? {}
      : {
          quality:
            clampQuality(
              quality
            ),
        }),
  });
}

self.onmessage = async (
  event: MessageEvent<
    | RequestMessage
    | {
        type: "cancel";
        id: number;
      }
  >
) => {
  const message =
    event.data;

  if (
    "type" in message &&
    message.type === "cancel"
  ) {
    cancelled.add(
      message.id
    );

    return;
  }

  const request =
    message as RequestMessage;

  let bitmap:
    | ImageBitmap
    | null = null;

  let canvas:
    | OffscreenCanvas
    | null = null;

  try {
    checkCancelled(
      request.id
    );

    post({
      id: request.id,
      type: "progress",
      stage: "reading",
    });

    /*
     * JPEG MUST use SIP.
     *
     * Do not fall through to
     * createImageBitmap for JPEG.
     */
    if (
      request.outputType ===
      "image/jpeg"
    ) {
      const result =
        await compressJpeg(
          request
        );

      checkCancelled(
        request.id
      );

      if (
        request.expectedWidth &&
        request.expectedHeight &&
        (
          result.width !==
            request.expectedWidth ||
          result.height !==
            request.expectedHeight
        )
      ) {
        throw new Error(
          `The codec returned ${result.width}×${result.height}, but WorkAbhi expected ${request.expectedWidth}×${request.expectedHeight}.`
        );
      }

      post({
        id: request.id,
        type: "progress",
        stage: "finalizing",
      });

      post({
        id: request.id,
        type: "success",
        blob: result.blob,
        width: result.width,
        height: result.height,
      });

      return;
    }

    /*
     * PNG/WebP continue using the existing
     * browser-native path.
     *
     * This keeps the rest of the image
     * tools stable.
     */
    if (
      typeof createImageBitmap !==
      "function"
    ) {
      throw new Error(
        "This browser does not support worker image decoding."
      );
    }

    bitmap =
      await createImageBitmap(
        request.file,
        {
          ...(request.resizeWidth &&
          request.resizeHeight
            ? {
                resizeWidth:
                  request.resizeWidth,

                resizeHeight:
                  request.resizeHeight,

                resizeQuality:
                  "high" as const,
              }
            : {}),

          imageOrientation:
            "from-image",
        }
      );

    checkCancelled(
      request.id
    );

    const width =
      bitmap.width;

    const height =
      bitmap.height;

    assertDimensions(
      width,
      height
    );

    if (
      request.expectedWidth &&
      request.expectedHeight &&
      (
        width !==
          request.expectedWidth ||
        height !==
          request.expectedHeight
      )
    ) {
      throw new Error(
        `The browser decoded this image as ${width}×${height}, but WorkAbhi expected ${request.expectedWidth}×${request.expectedHeight}.`
      );
    }

    canvas =
      new OffscreenCanvas(
        width,
        height
      );

    const context =
      canvas.getContext(
        "2d",
        {
          alpha: true,
        }
      );

    if (!context) {
      throw new Error(
        "OffscreenCanvas 2D is not available on this device."
      );
    }

    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      bitmap,
      0,
      0,
      width,
      height
    );

    bitmap.close();

    bitmap = null;

    post({
      id: request.id,
      type: "progress",
      stage: "compressing",
    });

    if (
      request.targetBytes
    ) {
      throw new Error(
        "Target-size compression is supported only for JPEG."
      );
    }

    const blob =
      await canvasBlob(
        canvas,
        request.outputType,
        request.quality
      );

    checkCancelled(
      request.id
    );

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
  } catch (error) {
    /*
     * AbortError is intentionally returned
     * as an error message to the caller.
     * The main thread already handles the
     * AbortError from its own signal.
     */
    post({
      id: request.id,
      type: "error",
      error:
        error instanceof Error
          ? error.message
          : "Image compression failed.",
    });
  } finally {
    bitmap?.close();

    cancelled.delete(
      request.id
    );

    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
};