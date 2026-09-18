import {
  GIFEncoder,
  applyPalette,
  quantize,
} from "gifenc";

import {
  decompressFrames,
  parseGIF,
} from "gifuct-js";

import {
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSink,
  VideoSampleSource,
  Input,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
} from "mediabunny";

import type {
  VideoProcessOptions,
} from "../videoTypes";

import {
  VideoEngineError,
  DEFAULT_VIDEO_LIMITS,
} from "../videoTypes";


/* ========================================================================= */
/* TYPES                                                                     */
/* ========================================================================= */

interface GifFrame {
  patch: Uint8ClampedArray;

  dims: {
    top: number;
    left: number;
    width: number;
    height: number;
  };

  delay: number;

  disposalType: number;
}


/* ========================================================================= */
/* CANVAS TYPES                                                              */
/* ========================================================================= */

type CanvasLike =
  | HTMLCanvasElement
  | OffscreenCanvas;

type Canvas2DContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;


/* ========================================================================= */
/* ABORT                                                                     */
/* ========================================================================= */

function checkAbort(
  signal?: AbortSignal,
): void {
  if (signal?.aborted) {
    throw new VideoEngineError(
      "CANCELLED",
      "Video processing was cancelled.",
    );
  }
}


/* ========================================================================= */
/* ARRAY BUFFER HELPERS                                                      */
/* ========================================================================= */

/**
 * Converts Uint8Array<ArrayBufferLike> into a real ArrayBuffer.
 *
 * This is important with newer TypeScript versions where
 * Uint8Array<ArrayBufferLike> is not directly accepted by Blob.
 */
function uint8ArrayToArrayBuffer(
  data: Uint8Array<ArrayBufferLike>,
): ArrayBuffer {
  const buffer =
    new ArrayBuffer(
      data.byteLength,
    );

  const output =
    new Uint8Array(
      buffer,
    );

  output.set(data);

  return buffer;
}


/**
 * Converts Uint8ClampedArray<ArrayBufferLike>
 * into an ImageData-compatible Uint8ClampedArray.
 */
function toImageData(
  data: Uint8ClampedArray<ArrayBufferLike>,
  width: number,
  height: number,
): ImageData {
  const buffer =
    new ArrayBuffer(
      data.byteLength,
    );

  const output =
    new Uint8ClampedArray(
      buffer,
    );

  output.set(data);

  return new ImageData(
    output,
    width,
    height,
  );
}


/* ========================================================================= */
/* CANVAS HELPERS                                                            */
/* ========================================================================= */

function createCanvas(
  width: number,
  height: number,
): CanvasLike {
  if (
    typeof OffscreenCanvas !==
    "undefined"
  ) {
    return new OffscreenCanvas(
      width,
      height,
    );
  }

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    width;

  canvas.height =
    height;

  return canvas;
}


/**
 * Explicitly narrow the canvas context.
 *
 * Without this helper TypeScript can infer:
 *
 * OffscreenCanvasRenderingContext2D |
 * ImageBitmapRenderingContext |
 * RenderingContext
 *
 * which causes clearRect/drawImage/getImageData/
 * putImageData errors.
 */
function getCanvas2DContext(
  canvas: CanvasLike,
  settings?: CanvasRenderingContext2DSettings,
): Canvas2DContext {
  const context =
    canvas.getContext(
      "2d",
      settings,
    );

  if (!context) {
    throw new VideoEngineError(
      "BROWSER_UNSUPPORTED",
      "Canvas 2D processing is unavailable in this browser.",
    );
  }

  return context as Canvas2DContext;
}


/* ========================================================================= */
/* VIDEO → GIF                                                               */
/* ========================================================================= */

export async function videoToGif(
  file: File,
  options: VideoProcessOptions = {},
): Promise<Blob> {
  checkAbort(
    options.signal,
  );

  const input =
    new Input({
      source:
        new BlobSource(
          file,
          {
            /*
             * Keep the source cache small.
             *
             * The complete source video is NOT copied
             * into memory.
             */
            maxCacheSize:
              4 *
              1024 *
              1024,

            useStreamReader:
              true,
          },
        ),

      formats:
        ALL_FORMATS,
    });

  try {
    checkAbort(
      options.signal,
    );

    const track =
      await input.getPrimaryVideoTrack();

    if (!track) {
      throw new VideoEngineError(
        "UNSUPPORTED_FORMAT",
        "No video track was found in the selected video.",
      );
    }

    const duration =
      await input.getDurationFromMetadata() ??
      0;

    const sourceWidth =
      await track.getDisplayWidth();

    const sourceHeight =
      await track.getDisplayHeight();

    const rotation = ((await track.getRotation()) % 360 + 360) % 360;
    if (!Number.isFinite(duration) || duration < 0 || duration > 24 * 60 * 60) {
      throw new VideoEngineError("INVALID_FILE", "The video duration is invalid for GIF conversion.");
    }

    if (
      sourceWidth <= 0 ||
      sourceHeight <= 0 ||
      sourceWidth * sourceHeight > DEFAULT_VIDEO_LIMITS.maxPixels
    ) {
      throw new VideoEngineError(
        "UNSUPPORTED_FORMAT",
        "The video dimensions could not be determined.",
      );
    }

    const orientedWidth = rotation === 90 || rotation === 270 ? sourceHeight : sourceWidth;
    const orientedHeight = rotation === 90 || rotation === 270 ? sourceWidth : sourceHeight;
    const requestedWidth = options.width ?? Math.min(DEFAULT_VIDEO_LIMITS.maxGifDimension, orientedWidth);
    const requestedHeight = options.height ?? Math.min(DEFAULT_VIDEO_LIMITS.maxGifDimension, orientedHeight);
    if (!Number.isFinite(requestedWidth) || !Number.isFinite(requestedHeight) || requestedWidth <= 0 || requestedHeight <= 0) {
      throw new VideoEngineError("INVALID_OPTIONS", "GIF dimensions must be positive numbers.");
    }
    const scale = Math.min(1, DEFAULT_VIDEO_LIMITS.maxGifDimension / orientedWidth, requestedWidth / orientedWidth, requestedHeight / orientedHeight);
    const outputWidth = Math.max(2, Math.floor(orientedWidth * scale) & ~1);
    const outputHeight = Math.max(2, Math.floor(orientedHeight * scale) & ~1);

    /*
     * GIF frame rate.
     */
    const fps = options.fps ?? 10;
    if (!Number.isFinite(fps) || fps <= 0 || fps > 15) {
      throw new VideoEngineError("INVALID_OPTIONS", "GIF FPS must be between 0 and 15.");
    }

    /*
     * Maximum GIF frame count.
     */
    const maxFrames = options.maxFrames ?? 120;
    if (!Number.isFinite(maxFrames) || !Number.isInteger(maxFrames) || maxFrames < 1 || maxFrames > DEFAULT_VIDEO_LIMITS.maxGifFrames) {
      throw new VideoEngineError("INVALID_OPTIONS", `GIF frame count must be an integer from 1 to ${DEFAULT_VIDEO_LIMITS.maxGifFrames}.`);
    }

    const start = options.start ?? 0;
    const requestedEnd = options.end ?? duration;
    if (!Number.isFinite(start) || start < 0 || start >= duration) {
      throw new VideoEngineError("INVALID_OPTIONS", "GIF start time must be within the video duration.");
    }
    if (!Number.isFinite(requestedEnd) || requestedEnd <= start || requestedEnd > duration) {
      throw new VideoEngineError("INVALID_OPTIONS", "GIF end time must be after start and within the video duration.");
    }
    const effectiveEnd = requestedEnd;

    const requestedFrames =
      Math.ceil(
        Math.max(
          0.001,
          effectiveEnd -
            start,
        ) *
          fps,
      );

    const frameCount =
      Math.min(
        maxFrames,
        requestedFrames,
      );

    const estimatedRgbaBytes = outputWidth * outputHeight * 4 * frameCount;
    if (estimatedRgbaBytes > 256 * 1024 * 1024) {
      throw new VideoEngineError("MEMORY_LIMIT", "The GIF frame set would require too much browser memory.");
    }

    if (
      outputWidth *
        outputHeight >
      DEFAULT_VIDEO_LIMITS.maxGifDimension *
        DEFAULT_VIDEO_LIMITS.maxGifDimension
    ) {
      throw new VideoEngineError(
        "MEMORY_LIMIT",
        "The GIF resolution is too high for stable browser processing.",
      );
    }

    if (
      frameCount <= 0
    ) {
      throw new VideoEngineError(
        "INVALID_OPTIONS",
        "No frames are available in the selected time range.",
      );
    }

    const sink =
      new VideoSampleSink(
        track,
      );

    const canvas =
      createCanvas(
        outputWidth,
        outputHeight,
      );

    const ctx =
      getCanvas2DContext(
        canvas,
        {
          willReadFrequently:
            true,
        },
      );

    const gif =
      GIFEncoder();

    for (
      let i = 0;
      i < frameCount;
      i += 1
    ) {
      checkAbort(
        options.signal,
      );

      const timestamp =
        Math.min(
          effectiveEnd,
          start +
            i / fps,
        );

      const sample =
        await sink.getSample(
          timestamp,
        );

      if (!sample) {
        continue;
      }

      try {
        const source =
          sample.toCanvasImageSource();

        ctx.clearRect(
          0,
          0,
          outputWidth,
          outputHeight,
        );

        ctx.save();
        ctx.translate(outputWidth / 2, outputHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const drawWidth = rotation === 90 || rotation === 270 ? outputHeight : outputWidth;
        const drawHeight = rotation === 90 || rotation === 270 ? outputWidth : outputHeight;
        ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        const imageData =
          ctx.getImageData(
            0,
            0,
            outputWidth,
            outputHeight,
          );

        const rgba =
          imageData.data;

        const palette =
          quantize(
            rgba,
            256,
          );

        const index =
          applyPalette(
            rgba,
            palette,
          );

        gif.writeFrame(
          index,
          outputWidth,
          outputHeight,
          {
            palette,

            delay:
              Math.max(
                20,
                Math.round(
                  1000 /
                    fps,
                ),
              ),

            repeat:
              0,
          },
        );
      } finally {
        /*
         * Release the decoded video sample
         * immediately.
         */
        sample.close();
      }

      options.onProgress?.({
        stage:
          "encoding",

        progress:
          (i + 1) /
          frameCount,

        processedSeconds:
          timestamp,

        duration:
          effectiveEnd,

        message:
          "Encoding GIF frames...",
      });
    }

    checkAbort(
      options.signal,
    );

    gif.finish();

    /*
     * gif.bytes() returns Uint8Array.
     *
     * Convert it to a concrete ArrayBuffer
     * before creating the Blob.
     */
    const gifBytes =
      gif.bytes();

    const gifBuffer =
      uint8ArrayToArrayBuffer(
        gifBytes,
      );
    if (gifBuffer.byteLength > 128 * 1024 * 1024) {
      throw new VideoEngineError("MEMORY_LIMIT", "The generated GIF is too large to keep safely in browser memory.");
    }

    return new Blob(
      [gifBuffer],
      {
        type:
          "image/gif",
      },
    );
  } catch (error) {
    if (
      error instanceof
      VideoEngineError
    ) {
      throw error;
    }

    throw new VideoEngineError(
      "PROCESSING_FAILED",
      "The video could not be converted to GIF.",
      error,
    );
  } finally {
    input.dispose();
  }
}


/* ========================================================================= */
/* GIF → VIDEO                                                               */
/* ========================================================================= */

export async function gifToVideo(
  file: File,
  options: VideoProcessOptions = {},
): Promise<Blob> {
  checkAbort(
    options.signal,
  );

  /*
   * IMPORTANT:
   *
   * There is intentionally NO arbitrary 50 MB,
   * 100 MB, 250 MB, etc. GIF file-size restriction.
   *
   * GIF processing is controlled through frame count
   * and output dimensions instead.
   */

  const arrayBuffer =
    await file.arrayBuffer();

  checkAbort(
    options.signal,
  );

  /*
   * gifuct-js accepts the ArrayBuffer.
   *
   * IMPORTANT:
   *
   * Do NOT create another variable called
   * "arrayBuffer".
   *
   * Do NOT pass Uint8Array here.
   */
  const parsed =
    parseGIF(
      arrayBuffer,
    );

  const sourceWidth = parsed.lsd.width;
  const sourceHeight = parsed.lsd.height;
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth < 2 || sourceHeight < 2) {
    throw new VideoEngineError("INVALID_FILE", "The GIF has invalid dimensions.");
  }
  if (sourceWidth * sourceHeight > DEFAULT_VIDEO_LIMITS.maxGifDimension * DEFAULT_VIDEO_LIMITS.maxGifDimension) {
    throw new VideoEngineError("MEMORY_LIMIT", "The GIF dimensions are too large for stable browser processing.");
  }

  // parseGIF exposes frame descriptors before pixel patches are decompressed.
  // Estimate worst-case RGBA memory before calling decompressFrames().
  const rawFrameCount = Array.isArray((parsed as { frames?: unknown[] }).frames)
    ? ((parsed as { frames: unknown[] }).frames.length)
    : DEFAULT_VIDEO_LIMITS.maxGifFrames + 1;
  if (rawFrameCount > DEFAULT_VIDEO_LIMITS.maxGifFrames) {
    throw new VideoEngineError("MEMORY_LIMIT", `This GIF contains more than ${DEFAULT_VIDEO_LIMITS.maxGifFrames} frames.`);
  }
  const estimatedGifMemory = sourceWidth * sourceHeight * 4 * rawFrameCount;
  if (estimatedGifMemory > 256 * 1024 * 1024) {
    throw new VideoEngineError("MEMORY_LIMIT", "The GIF would expand beyond the safe browser memory budget.");
  }

  const frames =
    decompressFrames(
      parsed,
      true,
    ) as GifFrame[];

  if (
    frames.length === 0
  ) {
    throw new VideoEngineError(
      "INVALID_FILE",
      "No animation frames were found in the GIF.",
    );
  }

  /*
   * This protects browser memory from extremely
   * complex GIF animations.
   *
   * It is NOT an input file-size limit.
   */
  if (
    frames.length >
    180
  ) {
    throw new VideoEngineError(
      "MEMORY_LIMIT",
      "This GIF contains too many frames for stable browser conversion.",
    );
  }

  /*
   * Maximum GIF conversion dimension.
   */
  const scale =
    Math.min(
      1,
      720 /
        Math.max(
          sourceWidth,
          sourceHeight,
        ),
    );

  const width =
    Math.max(
      2,
      Math.floor(
        sourceWidth *
          scale,
      ) & ~1,
    );

  const height =
    Math.max(
      2,
      Math.floor(
        sourceHeight *
          scale,
      ) & ~1,
    );

  if (
    width *
      height >
    720 *
      720
  ) {
    throw new VideoEngineError(
      "MEMORY_LIMIT",
      "The GIF resolution is too high for stable browser processing.",
    );
  }

  const canvas =
    createCanvas(
      width,
      height,
    );

  const ctx =
    getCanvas2DContext(
      canvas,
      {
        willReadFrequently:
          true,
      },
    );

  ctx.clearRect(
    0,
    0,
    width,
    height,
  );

  /*
   * GIF → MP4 currently uses BufferTarget.
   *
   * This adapter remains isolated from the main
   * large-video processing pipeline.
   */
  const output =
    new Output({
      format:
        new Mp4OutputFormat(),

      target:
        new BufferTarget(),
    });

  const videoSource =
    new VideoSampleSource({
      codec:
        "avc",

      quality:
        new Quality(
          "medium",
        ),
    });

  output.addVideoTrack(
    videoSource,
  );

  await output.start();

  let timestamp =
    0;

  let previousSnapshot:
    | ImageData
    | null =
    null;

  try {
    for (
      let i = 0;
      i < frames.length;
      i += 1
    ) {
      checkAbort(
        options.signal,
      );

      const frame =
        frames[i];

      /*
       * GIF disposal method 3:
       *
       * Save the current canvas before
       * drawing the new patch.
       */
      if (
        frame.disposalType ===
        3
      ) {
        previousSnapshot =
          ctx.getImageData(
            0,
            0,
            width,
            height,
          );
      }

      /*
       * Create a temporary canvas
       * containing the GIF patch.
       */
      const patchCanvas =
        createCanvas(
          frame.dims.width,
          frame.dims.height,
        );

      const patchCtx =
        getCanvas2DContext(
          patchCanvas,
        );

      /*
       * Convert the gifuct-js patch into
       * ImageData-compatible memory.
       */
      const patchImageData =
        toImageData(
          frame.patch,
          frame.dims.width,
          frame.dims.height,
        );

      patchCtx.putImageData(
        patchImageData,
        0,
        0,
      );

      /*
       * Draw the patch onto the full
       * animation canvas.
       */
      ctx.drawImage(
        patchCanvas,
        frame.dims.left,
        frame.dims.top,
        frame.dims.width,
        frame.dims.height,
      );

      /*
       * GIF delay is milliseconds.
       *
       * Minimum 20ms avoids invalid/zero-duration
       * video samples.
       */
      const frameDuration =
        Math.max(
          0.02,
          (
            frame.delay ||
            50
          ) /
            1000,
        );

      const sample =
        new VideoSample(
          canvas,
          {
            timestamp,

            duration:
              frameDuration,
          },
        );

      try {
        /*
         * Await add() to preserve backpressure.
         */
        await videoSource.add(
          sample,
        );
      } finally {
        /*
         * Release sample immediately.
         */
        sample.close();
      }

      timestamp +=
        frameDuration;

      /*
       * GIF disposal method 2:
       * clear the frame area.
       */
      if (
        frame.disposalType ===
        2
      ) {
        ctx.clearRect(
          frame.dims.left,
          frame.dims.top,
          frame.dims.width,
          frame.dims.height,
        );
      }

      /*
       * GIF disposal method 3:
       * restore previous canvas state.
       */
      else if (
        frame.disposalType ===
          3 &&
        previousSnapshot
      ) {
        ctx.putImageData(
          previousSnapshot,
          0,
          0,
        );

        previousSnapshot =
          null;
      }

      options.onProgress?.({
        stage:
          "encoding",

        progress:
          (i + 1) /
          frames.length,

        processedSeconds:
          timestamp,

        duration:
          timestamp,

        message:
          "Encoding GIF frames into video...",
      });
    }

    checkAbort(
      options.signal,
    );

    await output.finalize();

    const target =
      output.target;

    if (
      !(
        target instanceof
        BufferTarget
      )
    ) {
      throw new VideoEngineError(
        "OUTPUT_FAILED",
        "The video output target is invalid.",
      );
    }

    if (
      !target.buffer
    ) {
      throw new VideoEngineError(
        "OUTPUT_FAILED",
        "The video output buffer is empty.",
      );
    }

    /*
     * BufferTarget.buffer is already a real
     * ArrayBuffer.
     *
     * DO NOT convert it with uint8ArrayToArrayBuffer().
     */
    if (target.buffer.byteLength > 256 * 1024 * 1024) {
      throw new VideoEngineError("MEMORY_LIMIT", "The generated video is too large to keep safely in browser memory.");
    }
    return new Blob(
      [target.buffer],
      {
        type:
          "video/mp4",
      },
    );
  } catch (error) {
    try {
      await output.cancel();
    } catch {
      /*
       * Best-effort cleanup.
       */
    }

    if (
      error instanceof
      VideoEngineError
    ) {
      throw error;
    }

    throw new VideoEngineError(
      "PROCESSING_FAILED",
      "The GIF could not be converted to video.",
      error,
    );
  }
}