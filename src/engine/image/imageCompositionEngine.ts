import {
  canvasToBlob,
  createCanvas,
  loadImage,
} from "./imageTransformEngine";

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropImage(
  file: File,
  options: CropOptions
): Promise<Blob> {
  const image =
    await loadImage(file);

  const x = Math.max(
    0,
    Math.min(
      options.x,
      image.naturalWidth
    )
  );

  const y = Math.max(
    0,
    Math.min(
      options.y,
      image.naturalHeight
    )
  );

  const width = Math.min(
    options.width,
    image.naturalWidth - x
  );

  const height = Math.min(
    options.height,
    image.naturalHeight - y
  );

  if (width <= 0 || height <= 0) {
    throw new Error(
      "Invalid crop dimensions."
    );
  }

  const canvas =
    createCanvas(
      width,
      height
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
    "image/png",
    0.95
  );
}

export async function circularCrop(
  file: File
): Promise<Blob> {
  const image =
    await loadImage(file);

  const size =
    Math.min(
      image.naturalWidth,
      image.naturalHeight
    );

  const sourceX =
    (image.naturalWidth - size) /
    2;

  const sourceY =
    (image.naturalHeight - size) /
    2;

  const canvas =
    createCanvas(
      size,
      size
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.beginPath();

  context.arc(
    size / 2,
    size / 2,
    size / 2,
    0,
    Math.PI * 2
  );

  context.closePath();

  context.clip();

  context.drawImage(
    image,
    sourceX,
    sourceY,
    size,
    size,
    0,
    0,
    size,
    size
  );

  return canvasToBlob(
    canvas,
    "image/png",
    1
  );
}

export async function overlayImages(
  backgroundFile: File,
  overlayFile: File,
  options?: {
    x?: number;
    y?: number;
    width?: number;
    opacity?: number;
  }
): Promise<Blob> {
  const background =
    await loadImage(
      backgroundFile
    );

  const overlay =
    await loadImage(
      overlayFile
    );

  const canvas =
    createCanvas(
      background.naturalWidth,
      background.naturalHeight
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.drawImage(
    background,
    0,
    0
  );

  const width =
    options?.width ??
    overlay.naturalWidth;

  const ratio =
    width /
    overlay.naturalWidth;

  const height =
    overlay.naturalHeight *
    ratio;

  context.globalAlpha =
    options?.opacity ?? 1;

  context.drawImage(
    overlay,
    options?.x ?? 0,
    options?.y ?? 0,
    width,
    height
  );

  context.globalAlpha = 1;

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}

export async function mergeImages(
  files: File[],
  direction: "horizontal" | "vertical" = "vertical"
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error(
      "Select at least two images."
    );
  }

  const images =
    await Promise.all(
      files.map(loadImage)
    );

  const width =
    direction === "horizontal"
      ? images.reduce(
          (total, image) =>
            total +
            image.naturalWidth,
          0
        )
      : Math.max(
          ...images.map(
            (image) =>
              image.naturalWidth
          )
        );

  const height =
    direction === "vertical"
      ? images.reduce(
          (total, image) =>
            total +
            image.naturalHeight,
          0
        )
      : Math.max(
          ...images.map(
            (image) =>
              image.naturalHeight
          )
        );

  const canvas =
    createCanvas(
      width,
      height
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  let offset = 0;

  for (const image of images) {
    if (
      direction ===
      "horizontal"
    ) {
      context.drawImage(
        image,
        offset,
        0
      );

      offset +=
        image.naturalWidth;
    } else {
      context.drawImage(
        image,
        0,
        offset
      );

      offset +=
        image.naturalHeight;
    }
  }

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}

export async function createCollage(
  files: File[],
  columns = 2,
  gap = 10
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error(
      "Select at least two images."
    );
  }

  const images =
    await Promise.all(
      files.map(loadImage)
    );

  const cellWidth = 400;
  const cellHeight = 300;

  const rows =
    Math.ceil(
      images.length / columns
    );

  const canvas =
    createCanvas(
      columns *
        cellWidth +
        (columns - 1) * gap,
      rows *
        cellHeight +
        (rows - 1) * gap
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.fillStyle = "#ffffff";

  context.fillRect(
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
        Math.floor(
          index / columns
        );

      const x =
        column *
          (cellWidth + gap);

      const y =
        row *
          (cellHeight + gap);

      const scale =
        Math.min(
          cellWidth /
            image.naturalWidth,
          cellHeight /
            image.naturalHeight
        );

      const width =
        image.naturalWidth *
        scale;

      const height =
        image.naturalHeight *
        scale;

      const centeredX =
        x +
        (cellWidth - width) /
          2;

      const centeredY =
        y +
        (cellHeight - height) /
          2;

      context.drawImage(
        image,
        centeredX,
        centeredY,
        width,
        height
      );
    }
  );

  return canvasToBlob(
    canvas,
    "image/jpeg",
    0.92
  );
}

export async function splitImage(
  file: File,
  rows = 2,
  columns = 2
): Promise<Blob[]> {
  const image =
    await loadImage(file);

  if (rows <= 0 || columns <= 0) {
    throw new Error(
      "Rows and columns must be positive."
    );
  }

  const cellWidth =
    Math.floor(
      image.naturalWidth /
        columns
    );

  const cellHeight =
    Math.floor(
      image.naturalHeight /
        rows
    );

  const results: Blob[] = [];

  for (
    let row = 0;
    row < rows;
    row++
  ) {
    for (
      let column = 0;
      column < columns;
      column++
    ) {
      const canvas =
        createCanvas(
          cellWidth,
          cellHeight
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
        column * cellWidth,
        row * cellHeight,
        cellWidth,
        cellHeight,
        0,
        0,
        cellWidth,
        cellHeight
      );

      results.push(
        await canvasToBlob(
          canvas,
          "image/png",
          0.95
        )
      );
    }
  }

  return results;
}