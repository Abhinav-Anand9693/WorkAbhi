"use client";

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
      reject(
        new Error("Unable to load image.")
      );
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type:
    | "image/jpeg"
    | "image/png"
    | "image/webp" = "image/png"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Unable to create image."
            )
          );
          return;
        }

        resolve(blob);
      },
      type,
      0.92
    );
  });
}

/* ==========================================
   CROP
========================================== */

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropImage(
  source: File | Blob,
  options: CropOptions
): Promise<Blob> {
  const image = await loadImage(source);

  const x = Math.max(
    0,
    Math.floor(options.x)
  );

  const y = Math.max(
    0,
    Math.floor(options.y)
  );

  const width = Math.min(
    Math.floor(options.width),
    image.naturalWidth - x
  );

  const height = Math.min(
    Math.floor(options.height),
    image.naturalHeight - y
  );

  if (width <= 0 || height <= 0) {
    throw new Error(
      "Invalid crop dimensions."
    );
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   CIRCULAR CROP
========================================== */

export async function circularCrop(
  source: File | Blob
): Promise<Blob> {
  const image = await loadImage(source);

  const size = Math.min(
    image.naturalWidth,
    image.naturalHeight
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = size;
  canvas.height = size;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  const offsetX =
    (image.naturalWidth - size) / 2;

  const offsetY =
    (image.naturalHeight - size) / 2;

  ctx.beginPath();

  ctx.arc(
    size / 2,
    size / 2,
    size / 2,
    0,
    Math.PI * 2
  );

  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    offsetX,
    offsetY,
    size,
    size,
    0,
    0,
    size,
    size
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   OVERLAY
========================================== */

export async function overlayImages(
  background: File | Blob,
  overlay: File | Blob
): Promise<Blob> {
  const base =
    await loadImage(background);

  const top =
    await loadImage(overlay);

  const canvas =
    document.createElement("canvas");

  canvas.width =
    base.naturalWidth;

  canvas.height =
    base.naturalHeight;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.drawImage(
    base,
    0,
    0
  );

  const scale = Math.min(
    base.naturalWidth /
      top.naturalWidth,
    base.naturalHeight /
      top.naturalHeight,
    1
  );

  const width =
    top.naturalWidth * scale;

  const height =
    top.naturalHeight * scale;

  const x =
    (canvas.width - width) / 2;

  const y =
    (canvas.height - height) / 2;

  ctx.globalAlpha = 0.5;

  ctx.drawImage(
    top,
    x,
    y,
    width,
    height
  );

  ctx.globalAlpha = 1;

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   MERGE
========================================== */

export async function mergeImages(
  sources: Array<File | Blob>
): Promise<Blob> {
  if (sources.length < 2) {
    throw new Error(
      "Please provide at least two images."
    );
  }

  const images =
    await Promise.all(
      sources.map(loadImage)
    );

  const gap = 20;

  const width = Math.max(
    ...images.map(
      (image) => image.naturalWidth
    )
  );

  const height =
    images.reduce(
      (total, image) =>
        total +
        image.naturalHeight,
      0
    ) +
    gap *
      (images.length - 1);

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  let currentY = 0;

  for (const image of images) {
    const x =
      (width -
        image.naturalWidth) /
      2;

    ctx.drawImage(
      image,
      x,
      currentY
    );

    currentY +=
      image.naturalHeight +
      gap;
  }

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

/* ==========================================
   COLLAGE
========================================== */

export async function createCollage(
  sources: Array<File | Blob>
): Promise<Blob> {
  if (sources.length < 2) {
    throw new Error(
      "Please provide at least two images."
    );
  }

  const images =
    await Promise.all(
      sources.map(loadImage)
    );

  const columns =
    images.length <= 2
      ? images.length
      : Math.ceil(
          Math.sqrt(images.length)
        );

  const rows = Math.ceil(
    images.length / columns
  );

  const cellSize = 400;
  const gap = 10;

  const canvas =
    document.createElement("canvas");

  canvas.width =
    columns * cellSize +
    (columns - 1) * gap;

  canvas.height =
    rows * cellSize +
    (rows - 1) * gap;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  ctx.fillStyle = "#ffffff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  images.forEach(
    (image, index) => {
      const column =
        index % columns;

      const row =
        Math.floor(index / columns);

      const x =
        column *
        (cellSize + gap);

      const y =
        row *
        (cellSize + gap);

      const scale = Math.min(
        cellSize /
          image.naturalWidth,
        cellSize /
          image.naturalHeight
      );

      const width =
        image.naturalWidth * scale;

      const height =
        image.naturalHeight * scale;

      const drawX =
        x + (cellSize - width) / 2;

      const drawY =
        y + (cellSize - height) / 2;

      ctx.drawImage(
        image,
        drawX,
        drawY,
        width,
        height
      );
    }
  );

  return canvasToBlob(
    canvas,
    "image/jpeg"
  );
}

/* ==========================================
   SPLIT
========================================== */

export async function splitImage(
  source: File | Blob,
  rows = 2,
  columns = 2
): Promise<Blob[]> {
  const image =
    await loadImage(source);

  rows = Math.max(
    1,
    Math.floor(rows)
  );

  columns = Math.max(
    1,
    Math.floor(columns)
  );

  const pieceWidth =
    Math.floor(
      image.naturalWidth / columns
    );

  const pieceHeight =
    Math.floor(
      image.naturalHeight / rows
    );

  const results: Blob[] = [];

  for (let row = 0; row < rows; row++) {
    for (
      let column = 0;
      column < columns;
      column++
    ) {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        column === columns - 1
          ? image.naturalWidth -
            pieceWidth * column
          : pieceWidth;

      canvas.height =
        row === rows - 1
          ? image.naturalHeight -
            pieceHeight * row
          : pieceHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      ctx.drawImage(
        image,
        column * pieceWidth,
        row * pieceHeight,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      results.push(
        await canvasToBlob(
          canvas,
          "image/png"
        )
      );
    }
  }

  return results;
}