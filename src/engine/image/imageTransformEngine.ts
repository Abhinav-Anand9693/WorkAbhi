"use client";

export interface TransformOptions {
  rotate?: number;
  flip?: "horizontal" | "vertical";
}

function loadImage(
  source: File | Blob
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image."));
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png" | "image/webp" = "image/png",
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error("Unable to create image.")
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function createCanvasFromImage(
  source: File | Blob
) {
  const image = await loadImage(source);

  const canvas =
    document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.drawImage(image, 0, 0);

  return {
    canvas,
    ctx,
    image,
  };
}

/* ==========================================
   ROTATE / FLIP
========================================== */

export async function transformImage(
  source: File | Blob,
  options: TransformOptions
): Promise<Blob> {
  const image = await loadImage(source);

  const rotation =
    ((options.rotate ?? 0) % 360 + 360) %
    360;

  const horizontalFlip =
    options.flip === "horizontal";

  const verticalFlip =
    options.flip === "vertical";

  const rotated =
    rotation === 90 ||
    rotation === 270;

  const canvas =
    document.createElement("canvas");

  canvas.width = rotated
    ? image.naturalHeight
    : image.naturalWidth;

  canvas.height = rotated
    ? image.naturalWidth
    : image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.rotate(
    (rotation * Math.PI) / 180
  );

  ctx.scale(
    horizontalFlip ? -1 : 1,
    verticalFlip ? -1 : 1
  );

  ctx.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   SHARPEN
========================================== */

export async function sharpenCanvas(
  source: File | Blob,
  strength = 1
): Promise<Blob> {
  const { canvas, ctx } =
    await createCanvasFromImage(
      source
    );

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const src = imageData.data;
  const output = new Uint8ClampedArray(
    src
  );

  const amount = Math.min(
    1,
    Math.max(0.1, strength / 10)
  );

  const width = canvas.width;
  const height = canvas.height;

  for (
    let y = 1;
    y < height - 1;
    y++
  ) {
    for (
      let x = 1;
      x < width - 1;
      x++
    ) {
      const index =
        (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        const center =
          src[index + channel];

        const top =
          src[
            ((y - 1) * width + x) *
              4 +
              channel
          ];

        const bottom =
          src[
            ((y + 1) * width + x) *
              4 +
              channel
          ];

        const left =
          src[
            (y * width + x - 1) *
              4 +
              channel
          ];

        const right =
          src[
            (y * width + x + 1) *
              4 +
              channel
          ];

        const sharpened =
          center * (1 + 4 * amount) -
          (top +
            bottom +
            left +
            right) *
            amount;

        output[index + channel] =
          Math.max(
            0,
            Math.min(
              255,
              sharpened
            )
          );
      }
    }
  }

  imageData.data.set(output);

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   BORDER
========================================== */

export async function addBorder(
  source: File | Blob,
  borderSize = 10,
  borderColor = "#000000"
): Promise<Blob> {
  const image = await loadImage(source);

  const size = Math.max(
    0,
    Math.round(borderSize)
  );

  const canvas =
    document.createElement("canvas");

  canvas.width =
    image.naturalWidth + size * 2;

  canvas.height =
    image.naturalHeight + size * 2;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.fillStyle =
    borderColor;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.drawImage(
    image,
    size,
    size
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   ROUNDED CORNERS
========================================== */

export async function roundedCorners(
  source: File | Blob,
  radius = 30
): Promise<Blob> {
  const image = await loadImage(source);

  const canvas =
    document.createElement("canvas");

  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
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

  ctx.quadraticCurveTo(
    0,
    0,
    r,
    0
  );

  ctx.closePath();

  ctx.clip();

  ctx.drawImage(
    image,
    0,
    0
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}