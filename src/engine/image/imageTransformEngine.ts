"use client";

import {
  getPreferredOutputType,
  throwIfImageProcessingAborted,
  validateCanvasDimensions,
  validateImageDimensions
} from "./imageSafety";

export interface TransformOptions {
  rotate?: number;
  flip?: "horizontal" | "vertical";
  signal?: AbortSignal;
}

type DecodedImage = ImageBitmap;

async function loadImage(
  source: File | Blob,
  signal?: AbortSignal
): Promise<DecodedImage> {
  throwIfImageProcessingAborted(signal);

  if (typeof createImageBitmap !== "function")
    throw new Error(
      "This browser does not support orientation-aware image decoding."
    );

  const img = await createImageBitmap(source, {
    imageOrientation: "from-image"
  });

  try {
    validateImageDimensions(img.width, img.height);
    return img;
  } catch (e) {
    img.close();
    throw e;
  }
}

function canvasToBlob(
  c: HTMLCanvasElement,
  type: "image/jpeg" | "image/png" | "image/webp",
  q = 0.92
): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob(
      b =>
        b
          ? res(b)
          : rej(new Error("Unable to create image.")),
      type,
      type === "image/png" ? undefined : q
    )
  );
}

export async function createCanvasFromImage(
  source: File | Blob,
  signal?: AbortSignal
) {
  const image = await loadImage(source, signal);

  validateCanvasDimensions(image.width, image.height);

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    image.close();
    throw new Error("Canvas is not supported.");
  }

  ctx.drawImage(image, 0, 0);

  return {
    canvas,
    ctx,
    image
  };
}

export async function transformImage(
  source: File | Blob,
  options: TransformOptions
): Promise<Blob> {
  const image = await loadImage(source, options.signal);

  try {
    const rotation =
      ((options.rotate ?? 0) % 360 + 360) % 360;

    const rotated =
      rotation === 90 || rotation === 270;

    const width = rotated
      ? image.height
      : image.width;

    const height = rotated
      ? image.width
      : image.height;

    validateCanvasDimensions(width, height);

    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;

    const ctx = c.getContext("2d");

    if (!ctx)
      throw new Error("Canvas is not supported.");

    ctx.translate(width / 2, height / 2);

    ctx.rotate(rotation * Math.PI / 180);

    ctx.scale(
      options.flip === "horizontal" ? -1 : 1,
      options.flip === "vertical" ? -1 : 1
    );

    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2
    );

    return canvasToBlob(
      c,
      getPreferredOutputType(source)
    );
  } finally {
    image.close();
  }
}

export async function sharpenCanvas(
  source: File | Blob,
  strength = 1,
  signal?: AbortSignal
): Promise<Blob> {
  const { canvas, ctx, image } =
    await createCanvasFromImage(source, signal);

  try {
    const d = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const src = d.data;
    const out = new Uint8ClampedArray(src);

    const amount = Math.min(
      1,
      Math.max(0.1, strength / 10)
    );

    for (let y = 1; y < canvas.height - 1; y++) {
      throwIfImageProcessingAborted(signal);

      for (let x = 1; x < canvas.width - 1; x++) {
        const i =
          (y * canvas.width + x) * 4;

        for (let ch = 0; ch < 3; ch++) {
          const center = src[i + ch];

          const top =
            src[((y - 1) * canvas.width + x) * 4 + ch];

          const bottom =
            src[((y + 1) * canvas.width + x) * 4 + ch];

          const left =
            src[(y * canvas.width + x - 1) * 4 + ch];

          const right =
            src[(y * canvas.width + x + 1) * 4 + ch];

          out[i + ch] = Math.max(
            0,
            Math.min(
              255,
              center * (1 + 4 * amount) -
                (top + bottom + left + right) * amount
            )
          );
        }
      }
    }

    d.data.set(out);
    ctx.putImageData(d, 0, 0);

    return canvasToBlob(
      canvas,
      getPreferredOutputType(source)
    );
  } finally {
    image.close();
  }
}

export async function addBorder(
  source: File | Blob,
  borderSize = 10,
  borderColor = "#000000",
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(source, signal);

  try {
    const s = Math.max(
      0,
      Math.round(borderSize)
    );

    const w = image.width + s * 2;
    const h = image.height + s * 2;

    validateCanvasDimensions(w, h);

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d");

    if (!ctx)
      throw new Error("Canvas is not supported.");

    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(image, s, s);

    return canvasToBlob(
      c,
      getPreferredOutputType(source)
    );
  } finally {
    image.close();
  }
}

export async function roundedCorners(
  source: File | Blob,
  radius = 30,
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(source, signal);

  try {
    validateCanvasDimensions(
      image.width,
      image.height
    );

    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;

    const ctx = c.getContext("2d");

    if (!ctx)
      throw new Error("Canvas is not supported.");

    const r = Math.min(
      Math.max(0, radius),
      c.width / 2,
      c.height / 2
    );

    ctx.beginPath();

    ctx.moveTo(r, 0);
    ctx.lineTo(c.width - r, 0);

    ctx.quadraticCurveTo(
      c.width,
      0,
      c.width,
      r
    );

    ctx.lineTo(
      c.width,
      c.height - r
    );

    ctx.quadraticCurveTo(
      c.width,
      c.height,
      c.width - r,
      c.height
    );

    ctx.lineTo(r, c.height);

    ctx.quadraticCurveTo(
      0,
      c.height,
      0,
      c.height - r
    );

    ctx.lineTo(0, r);

    ctx.quadraticCurveTo(
      0,
      0,
      r,
      0
    );

    ctx.closePath();
    ctx.clip();

    ctx.drawImage(image, 0, 0);

    return canvasToBlob(c, "image/png");
  } finally {
    image.close();
  }
}