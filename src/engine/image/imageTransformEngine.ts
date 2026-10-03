"use client";

import {
  getPreferredOutputType,
  throwIfImageProcessingAborted,
  validateCanvasDimensions,
  validateImageDimensions,
} from "./imageSafety";

export interface TransformOptions {
  rotate?: number;
  flip?: "horizontal" | "vertical";
  signal?: AbortSignal;
}

function loadImage(
  source: File | Blob,
  signal?: AbortSignal
): Promise<HTMLImageElement> {
  throwIfImageProcessingAborted(signal);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const image = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(url);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Processing cancelled.", "AbortError"));
    };

    image.onload = () => {
      cleanup();
      try {
        throwIfImageProcessingAborted(signal);
        validateImageDimensions(
          image.naturalWidth,
          image.naturalHeight
        );
        resolve(image);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Unable to load image."));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png" | "image/webp",
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create image."));
          return;
        }
        resolve(blob);
      },
      type,
      type === "image/png" ? undefined : quality
    );
  });
}

export async function createCanvasFromImage(
  source: File | Blob,
  signal?: AbortSignal
) {
  const image = await loadImage(source, signal);
  validateCanvasDimensions(
    image.naturalWidth,
    image.naturalHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  throwIfImageProcessingAborted(signal);
  ctx.drawImage(image, 0, 0);

  return { canvas, ctx, image };
}

export async function transformImage(
  source: File | Blob,
  options: TransformOptions
): Promise<Blob> {
  const image = await loadImage(source, options.signal);

  const rotation =
    ((options.rotate ?? 0) % 360 + 360) % 360;

  const horizontalFlip =
    options.flip === "horizontal";

  const verticalFlip =
    options.flip === "vertical";

  const rotated =
    rotation === 90 || rotation === 270;

  const width = rotated
    ? image.naturalHeight
    : image.naturalWidth;

  const height = rotated
    ? image.naturalWidth
    : image.naturalHeight;

  validateCanvasDimensions(width, height);
  throwIfImageProcessingAborted(options.signal);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(
    horizontalFlip ? -1 : 1,
    verticalFlip ? -1 : 1
  );

  ctx.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2
  );

  throwIfImageProcessingAborted(options.signal);

  return canvasToBlob(
    canvas,
    getPreferredOutputType(source),
    0.92
  );
}

export async function sharpenCanvas(
  source: File | Blob,
  strength = 1,
  signal?: AbortSignal
): Promise<Blob> {
  const { canvas, ctx } =
    await createCanvasFromImage(source, signal);

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const src = imageData.data;
  const output = new Uint8ClampedArray(src);

  const amount = Math.min(
    1,
    Math.max(0.1, strength / 10)
  );

  const width = canvas.width;
  const height = canvas.height;
  let processed = 0;

  for (let y = 1; y < height - 1; y++) {
    throwIfImageProcessingAborted(signal);

    for (let x = 1; x < width - 1; x++) {
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        const center = src[index + channel];
        const top =
          src[((y - 1) * width + x) * 4 + channel];
        const bottom =
          src[((y + 1) * width + x) * 4 + channel];
        const left =
          src[(y * width + x - 1) * 4 + channel];
        const right =
          src[(y * width + x + 1) * 4 + channel];

        const sharpened =
          center * (1 + 4 * amount) -
          (top + bottom + left + right) * amount;

        output[index + channel] = Math.max(
          0,
          Math.min(255, sharpened)
        );
      }

      processed += 1;

      if (processed % 100_000 === 0) {
        throwIfImageProcessingAborted(signal);
        await new Promise<void>((resolve) =>
          window.setTimeout(resolve, 0)
        );
      }
    }
  }

  throwIfImageProcessingAborted(signal);
  imageData.data.set(output);
  ctx.putImageData(imageData, 0, 0);

  return canvasToBlob(
    canvas,
    getPreferredOutputType(source),
    0.92
  );
}

export async function addBorder(
  source: File | Blob,
  borderSize = 10,
  borderColor = "#000000",
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(source, signal);
  const size = Math.max(0, Math.round(borderSize));

  const width = image.naturalWidth + size * 2;
  const height = image.naturalHeight + size * 2;

  validateCanvasDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  throwIfImageProcessingAborted(signal);

  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, size, size);

  return canvasToBlob(
    canvas,
    getPreferredOutputType(source),
    0.92
  );
}

export async function roundedCorners(
  source: File | Blob,
  radius = 30,
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(source, signal);

  validateCanvasDimensions(
    image.naturalWidth,
    image.naturalHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  const r = Math.min(
    Math.max(0, radius),
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(
    canvas.width,
    0,
    canvas.width,
    r
  );
  ctx.lineTo(
    canvas.width,
    canvas.height - r
  );
  ctx.quadraticCurveTo(
    canvas.width,
    canvas.height,
    canvas.width - r,
    canvas.height
  );
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(
    0,
    canvas.height,
    0,
    canvas.height - r
  );
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();

  throwIfImageProcessingAborted(signal);
  ctx.drawImage(image, 0, 0);

  // Rounded corners require alpha, so PNG is the safe output.
  return canvasToBlob(canvas, "image/png");
}
