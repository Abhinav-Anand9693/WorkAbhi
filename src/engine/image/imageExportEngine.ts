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
  canvas: HTMLCanvasElement
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
      "image/png"
    );
  });
}

/* ==========================================
   TEXT
========================================== */

export interface TextOptions {
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

export async function addTextToImage(
  source: File | Blob,
  options: TextOptions
): Promise<Blob> {
  const image =
    await loadImage(source);

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

  ctx.drawImage(
    image,
    0,
    0
  );

  const fontSize =
    options.fontSize ?? 48;

  const color =
    options.color ?? "#ffffff";

  const position =
    options.position ??
    "bottom-center";

  ctx.font = `600 ${fontSize}px ${
    options.fontFamily ??
    "Arial"
  }`;

  ctx.fillStyle = color;
  ctx.textBaseline = "middle";

  const padding = 30;

  const textWidth =
    ctx.measureText(
      options.text
    ).width;

  let x =
    canvas.width / 2;

  let y =
    canvas.height / 2;

  if (
    position ===
    "top-left"
  ) {
    x = padding;
    y = padding + fontSize / 2;
    ctx.textAlign = "left";
  }

  else if (
    position ===
    "top-center"
  ) {
    x = canvas.width / 2;
    y = padding + fontSize / 2;
    ctx.textAlign = "center";
  }

  else if (
    position ===
    "top-right"
  ) {
    x = canvas.width - padding;
    y = padding + fontSize / 2;
    ctx.textAlign = "right";
  }

  else if (
    position === "center"
  ) {
    x = canvas.width / 2;
    y = canvas.height / 2;
    ctx.textAlign = "center";
  }

  else if (
    position ===
    "bottom-left"
  ) {
    x = padding;
    y =
      canvas.height -
      padding -
      fontSize / 2;
    ctx.textAlign = "left";
  }

  else if (
    position ===
    "bottom-right"
  ) {
    x = canvas.width - padding;
    y =
      canvas.height -
      padding -
      fontSize / 2;
    ctx.textAlign = "right";
  }

  else {
    x = canvas.width / 2;
    y =
      canvas.height -
      padding -
      fontSize / 2;
    ctx.textAlign = "center";
  }

  /*
   * Subtle shadow improves readability.
   */
  ctx.shadowColor =
    "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(
    options.text,
    x,
    y
  );

  ctx.shadowColor =
    "transparent";

  return canvasToBlob(
    canvas
  );
}

/* ==========================================
   WATERMARK
========================================== */

export interface WatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
}

export async function addWatermark(
  source: File | Blob,
  options: WatermarkOptions
): Promise<Blob> {
  const image =
    await loadImage(source);

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

  ctx.drawImage(
    image,
    0,
    0
  );

  const fontSize =
    options.fontSize ??
    Math.max(
      18,
      Math.round(
        canvas.width / 25
      )
    );

  ctx.font = `600 ${fontSize}px Arial`;

  ctx.fillStyle =
    options.color ??
    "#ffffff";

  ctx.globalAlpha =
    Math.min(
      1,
      Math.max(
        0,
        options.opacity ?? 0.5
      )
    );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /*
   * Repeating diagonal watermark.
   */
  ctx.save();

  ctx.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.rotate(
    (-30 * Math.PI) / 180
  );

  const spacing =
    Math.max(
      180,
      fontSize * 5
    );

  for (
    let y =
      -canvas.height * 2;
    y <
    canvas.height * 2;
    y += spacing
  ) {
    for (
      let x =
        -canvas.width * 2;
      x <
      canvas.width * 2;
      x += spacing
    ) {
      ctx.fillText(
        options.text,
        x,
        y
      );
    }
  }

  ctx.restore();

  ctx.globalAlpha = 1;

  return canvasToBlob(
    canvas
  );
}