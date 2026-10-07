/* WorkAbhi image compression worker — production codec path. */

type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

type Stage =
  | "reading"
  | "compressing"
  | "finalizing"
  | "complete";

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

type CancelMessage = {
  type: "cancel";
  id: number;
};

type WorkerRequest =
  | RequestMessage
  | CancelMessage;

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

const cancelled =
  new Set<number>();

function post(
  message: ResponseMessage
): void {
  self.postMessage(message);
}

function check(
  id: number
): void {
  if (
    cancelled.has(id)
  ) {
    throw new DOMException(
      "Processing cancelled.",
      "AbortError"
    );
  }
}

function clamp(
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
    height < 1 ||
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

/*
 * Convert Uint8Array into a standalone ArrayBuffer.
 *
 * This avoids newer TypeScript/lib.dom BlobPart
 * incompatibilities involving ArrayBufferLike /
 * SharedArrayBuffer.
 */
function uint8ArrayToArrayBuffer(
  value: Uint8Array
): ArrayBuffer {
  const copy =
    new Uint8Array(
      value.byteLength
    );

  copy.set(value);

  return copy.buffer;
}

async function canvasBlob(
  canvas: OffscreenCanvas,
  type: OutputFormat,
  quality: number
): Promise<Blob> {
  return canvas.convertToBlob({
    type,

    ...(type ===
    "image/png"
      ? {}
      : {
          quality:
            clamp(quality),
        }),
  });
}

/*
 * SIP is copied during the production build to:
 *
 * /public/workabhi-codecs/sip/
 *
 * We intentionally load it dynamically so that
 * Next.js does not try to bundle the WASM codec
 * into the application worker bundle.
 */
async function loadSip(): Promise<any> {
  const url =
    new URL(
      "/workabhi-codecs/sip/index.js",
      self.location.origin
    ).href;

  return await import(
    /* webpackIgnore: true */
    url
  );
}

/*
 * IMPORTANT:
 *
 * SIP processing is:
 *
 * input bytes
 *      ↓
 * sip.transform()
 *      ↓
 * processing pipeline
 *      ↓
 * sip.collect()
 *      ↓
 * actual encoded bytes
 *
 * We MUST collect the transformed pipeline before
 * creating the output Blob.
 */
async function sipEncode(
  input: Blob,
  width:
    | number
    | undefined,
  height:
    | number
    | undefined,
  quality: number
): Promise<any> {
  const bytes =
    await input.arrayBuffer();

  const sip =
    await loadSip();

  await sip.ready();

  const transformOptions: Record<
    string,
    unknown
  > = {
    quality: Math.round(
      clamp(quality) * 100
    ),
  };

  if (
    width &&
    height
  ) {
    transformOptions.width =
      width;

    transformOptions.height =
      height;
  }

  /*
   * Do NOT return sip.transform()
   * directly.
   *
   * collect() is required to obtain
   * the actual encoded output.
   */
  const image =
    sip.transform(
      bytes,
      transformOptions
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
  check(request.id);

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

  if (
    !width ||
    !height
  ) {
    throw new Error(
      "Missing JPEG dimensions."
    );
  }

  assertDimensions(
    width,
    height
  );

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

    check(request.id);

    if (
      !encoded ||
      !encoded.data
    ) {
      throw new Error(
        "The JPEG codec did not return encoded image data."
      );
    }

    const encodedData =
      encoded.data instanceof
      Uint8Array
        ? uint8ArrayToArrayBuffer(
            encoded.data
          )
        : encoded.data;

    const blob =
      new Blob(
        [encodedData],
        {
          type:
            "image/jpeg",
        }
      );

    if (
      blob.size <= 0
    ) {
      throw new Error(
        "The JPEG codec returned an empty image."
      );
    }

    return {
      blob,

      width:
        encoded.info?.width ??
        width,

      height:
        encoded.info?.height ??
        height,
    };
  }

  /*
   * Target-size JPEG compression.
   *
   * Binary-search JPEG quality while keeping
   * the planned dimensions unchanged.
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
    attempt += 1
  ) {
    check(request.id);

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

    check(request.id);

    if (
      !encoded ||
      !encoded.data
    ) {
      throw new Error(
        "The JPEG codec did not return encoded image data."
      );
    }

    const encodedData =
      encoded.data instanceof
      Uint8Array
        ? uint8ArrayToArrayBuffer(
            encoded.data
          )
        : encoded.data;

    const blob =
      new Blob(
        [encodedData],
        {
          type:
            "image/jpeg",
        }
      );

    if (
      blob.size <= 0
    ) {
      throw new Error(
        "The JPEG codec returned an empty image."
      );
    }

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
      )} KB at ${width}×${height} without changing the planned dimensions.`
    );
  }

  return {
    blob: best,
    width,
    height,
  };
}

self.onmessage =
  async (
    event: MessageEvent<WorkerRequest>
  ) => {
    const message =
      event.data;

    /*
     * Cancellation request.
     */
    if (
      "type" in message &&
      message.type ===
        "cancel"
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
      check(request.id);

      post({
        id: request.id,
        type: "progress",
        stage: "reading",
      });

      /*
       * ==================================================
       * JPEG
       * ==================================================
       *
       * CRITICAL LARGE-IMAGE PATH
       *
       * JPEG compression uses SIP instead of
       * createImageBitmap().
       *
       * This avoids unnecessarily decoding a
       * 30 MB / 64 MP JPEG into a full browser
       * bitmap before compression.
       */
      if (
        request.outputType ===
        "image/jpeg"
      ) {
        const result =
          await compressJpeg(
            request
          );

        check(request.id);

        /*
         * Validate dimensions returned by
         * the codec.
         */
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

        /*
         * Make sure we never send an empty
         * or invalid-looking Blob back.
         */
        if (
          !result.blob ||
          result.blob.size <= 0
        ) {
          throw new Error(
            "The JPEG codec returned an empty output."
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
          blob:
            result.blob,
          width:
            result.width,
          height:
            result.height,
        });

        return;
      }

      /*
       * ==================================================
       * PNG / WEBP
       * ==================================================
       *
       * These formats continue to use the
       * browser worker image pipeline.
       */
      if (
        typeof createImageBitmap !==
        "function"
      ) {
        throw new Error(
          "This browser does not support worker image decoding."
        );
      }

      /*
       * Decode with resize when requested.
       *
       * This path is intentionally kept separate
       * from JPEG/SIP because the large-JPEG
       * memory problem is handled by SIP.
       */
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

      check(request.id);

      const width =
        bitmap.width;

      const height =
        bitmap.height;

      assertDimensions(
        width,
        height
      );

      /*
       * Validate the browser decode against
       * the dimensions detected before processing.
       */
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
            alpha:
              true,
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

      /*
       * Release the ImageBitmap as soon as
       * the pixels have been copied to the
       * OffscreenCanvas.
       */
      bitmap.close();

      bitmap = null;

      check(request.id);

      post({
        id: request.id,
        type: "progress",
        stage: "compressing",
      });

      /*
       * Target-size compression is intentionally
       * restricted to JPEG/SIP.
       */
      if (
        request.targetBytes
      ) {
        throw new Error(
          "Target-size compression is supported only by the JPEG codec path."
        );
      }

      const blob =
        await canvasBlob(
          canvas,
          request.outputType,
          request.quality
        );

      check(request.id);

      if (
        !blob ||
        blob.size <= 0
      ) {
        throw new Error(
          "The image encoder returned an empty output."
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
        blob,
        width,
        height,
      });
    } catch (error) {
      post({
        id: request.id,
        type: "error",
        error:
          error instanceof
          Error
            ? error.message
            : "Image compression failed.",
      });
    } finally {
      /*
       * Always release browser image resources.
       */
      bitmap?.close();

      /*
       * Remove cancellation state after
       * processing has finished.
       */
      cancelled.delete(
        request.id
      );

      /*
       * Release OffscreenCanvas backing
       * storage.
       */
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  };