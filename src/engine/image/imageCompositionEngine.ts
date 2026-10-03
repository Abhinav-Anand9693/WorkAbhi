import {
  getPreferredOutputType,
  throwIfImageProcessingAborted,
  validateCanvasDimensions,
  validateImageDimensions,
} from "./imageSafety";

function loadImage(
  file: Blob,
  signal?: AbortSignal
): Promise<HTMLImageElement> {
  throwIfImageProcessingAborted(signal);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

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
      reject(
        new Error("Unable to load one of the selected images.")
      );
    };

    signal?.addEventListener("abort", onAbort, { once: true });
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
            new Error("Unable to create the processed image.")
          );
          return;
        }
        resolve(blob);
      },
      type,
      type === "image/png" ? undefined : quality
    );
  });
}

function drawContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio =
    image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > boxRatio) {
    drawHeight = width / imageRatio;
  } else {
    drawWidth = height * imageRatio;
  }

  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

export async function overlayImages(
  baseFile: File,
  overlayFile: File,
  signal?: AbortSignal
): Promise<Blob> {
  const base = await loadImage(baseFile, signal);
  const overlay = await loadImage(overlayFile, signal);

  const width = base.naturalWidth;
  const height = base.naturalHeight;
  validateCanvasDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  throwIfImageProcessingAborted(signal);

  context.drawImage(base, 0, 0, width, height);

  const maxWidth = width * 0.5;
  const scale = Math.min(
    maxWidth / overlay.naturalWidth,
    maxWidth / overlay.naturalHeight
  );

  const overlayWidth = overlay.naturalWidth * scale;
  const overlayHeight = overlay.naturalHeight * scale;

  context.drawImage(
    overlay,
    width - overlayWidth - 30,
    height - overlayHeight - 30,
    overlayWidth,
    overlayHeight
  );

  return canvasToBlob(
    canvas,
    getPreferredOutputType(baseFile)
  );
}

export async function createCollage(
  files: File[],
  signal?: AbortSignal
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error(
      "Please add at least 2 images to create a collage."
    );
  }

  if (files.length > 12) {
    throw new Error(
      "You can add up to 12 images to a collage."
    );
  }

  throwIfImageProcessingAborted(signal);
  const images = await Promise.all(
    files.map((file) => loadImage(file, signal))
  );

  const columns = Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / columns);
  const cellSize = 400;
  const gap = 12;

  const width =
    columns * cellSize + (columns + 1) * gap;
  const height =
    rows * cellSize + (rows + 1) * gap;

  validateCanvasDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  images.forEach((image, index) => {
    throwIfImageProcessingAborted(signal);

    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gap + column * (cellSize + gap);
    const y = gap + row * (cellSize + gap);

    context.fillStyle = "#f5f5f5";
    context.fillRect(x, y, cellSize, cellSize);

    drawContain(
      context,
      image,
      x,
      y,
      cellSize,
      cellSize
    );
  });

  return canvasToBlob(
    canvas,
    getPreferredOutputType(files[0], "image/jpeg")
  );
}

export async function mergeImages(
  files: File[],
  signal?: AbortSignal
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error(
      "Please add at least 2 images to merge."
    );
  }

  if (files.length > 20) {
    throw new Error(
      "You can merge up to 20 images at once."
    );
  }

  throwIfImageProcessingAborted(signal);
  const images = await Promise.all(
    files.map((file) => loadImage(file, signal))
  );

  const width = Math.max(
    ...images.map((image) => image.naturalWidth)
  );
  const gap = 12;

  const heights = images.map((image) =>
    Math.round(
      (image.naturalHeight / image.naturalWidth) * width
    )
  );

  const height =
    heights.reduce((total, value) => total + value, 0) +
    gap * (images.length - 1);

  validateCanvasDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  const outputType = files.every(
    (file) => file.type === "image/png"
  )
    ? "image/png"
    : getPreferredOutputType(files[0], "image/jpeg");

  if (outputType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  let currentY = 0;

  images.forEach((image, index) => {
    throwIfImageProcessingAborted(signal);

    const targetHeight = heights[index];

    context.drawImage(
      image,
      0,
      currentY,
      width,
      targetHeight
    );

    currentY += targetHeight;

    if (index < images.length - 1) {
      currentY += gap;
    }
  });

  return canvasToBlob(canvas, outputType);
}

export async function splitImage(
  file: File,
  signal?: AbortSignal
): Promise<Blob[]> {
  const image = await loadImage(file, signal);

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (!width || !height) {
    throw new Error("Unable to read image dimensions.");
  }

  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);

  const regions = [
    { x: 0, y: 0, width: halfWidth, height: halfHeight },
    {
      x: halfWidth,
      y: 0,
      width: width - halfWidth,
      height: halfHeight,
    },
    {
      x: 0,
      y: halfHeight,
      width: halfWidth,
      height: height - halfHeight,
    },
    {
      x: halfWidth,
      y: halfHeight,
      width: width - halfWidth,
      height: height - halfHeight,
    },
  ];

  const results: Blob[] = [];
  const outputType = getPreferredOutputType(file);

  for (const region of regions) {
    throwIfImageProcessingAborted(signal);

    if (region.width <= 0 || region.height <= 0) continue;

    validateCanvasDimensions(region.width, region.height);

    const canvas = document.createElement("canvas");
    canvas.width = region.width;
    canvas.height = region.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not supported.");
    }

    context.drawImage(
      image,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height
    );

    results.push(
      await canvasToBlob(canvas, outputType)
    );
  }

  return results;
}

export async function cropImage(
  file: File,
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(file, signal);

  const x = Math.max(0, Math.floor(crop.x));
  const y = Math.max(0, Math.floor(crop.y));
  const width = Math.min(
    Math.floor(crop.width),
    image.naturalWidth - x
  );
  const height = Math.min(
    Math.floor(crop.height),
    image.naturalHeight - y
  );

  if (width <= 0 || height <= 0) {
    throw new Error("Invalid crop dimensions.");
  }

  validateCanvasDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  throwIfImageProcessingAborted(signal);

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
    getPreferredOutputType(file)
  );
}

export async function circularCrop(
  file: File,
  signal?: AbortSignal
): Promise<Blob> {
  const image = await loadImage(file, signal);

  const size = Math.min(
    image.naturalWidth,
    image.naturalHeight
  );

  validateCanvasDimensions(size, size);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
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

  const x = (image.naturalWidth - size) / 2;
  const y = (image.naturalHeight - size) / 2;

  throwIfImageProcessingAborted(signal);

  context.drawImage(
    image,
    x,
    y,
    size,
    size,
    0,
    0,
    size,
    size
  );

  // Circular crop needs transparency outside the circle.
  return canvasToBlob(canvas, "image/png");
}
