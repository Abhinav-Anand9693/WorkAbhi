import {
  canvasToBlob,
  createCanvas,
  loadImage,
} from "./imageTransformEngine";

export interface TextOptions {
  text: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  bold?: boolean;
  fontFamily?: string;
}

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  position:
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";
}

export async function addTextToImage(
  file: File,
  options: TextOptions
): Promise<Blob> {
  const image =
    await loadImage(file);

  const canvas =
    createCanvas(
      image.naturalWidth,
      image.naturalHeight
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.drawImage(
    image,
    0,
    0
  );

  context.fillStyle =
    options.color;

  context.font =
    `${options.bold ? "bold " : ""}${options.fontSize}px ${options.fontFamily ?? "Arial"}`;

  context.textBaseline =
    "top";

  context.fillText(
    options.text,
    options.x,
    options.y
  );

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  const image =
    await loadImage(file);

  const canvas =
    createCanvas(
      image.naturalWidth,
      image.naturalHeight
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.drawImage(
    image,
    0,
    0
  );

  context.font =
    `bold ${options.fontSize}px Arial`;

  context.fillStyle =
    options.color;

  context.globalAlpha =
    Math.max(
      0,
      Math.min(
        1,
        options.opacity
      )
    );

  const textWidth =
    context.measureText(
      options.text
    ).width;

  const padding = 30;

  let x = padding;
  let y =
    options.fontSize +
    padding;

  switch (options.position) {
    case "top-right":
      x =
        canvas.width -
        textWidth -
        padding;
      y =
        options.fontSize +
        padding;
      break;

    case "center":
      x =
        (canvas.width -
          textWidth) /
        2;

      y =
        (canvas.height +
          options.fontSize) /
        2;

      break;

    case "bottom-left":
      x = padding;

      y =
        canvas.height -
        padding;

      break;

    case "bottom-right":
      x =
        canvas.width -
        textWidth -
        padding;

      y =
        canvas.height -
        padding;

      break;

    case "top-left":
    default:
      break;
  }

  context.fillText(
    options.text,
    x,
    y
  );

  context.globalAlpha = 1;

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}