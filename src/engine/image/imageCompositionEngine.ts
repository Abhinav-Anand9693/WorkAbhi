function loadImage(
  file: Blob
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error(
          "Unable to load one of the selected images."
        )
      );
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Unable to create the processed image."
            )
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

function drawContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio =
    image.naturalWidth /
    image.naturalHeight;

  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > boxRatio) {
    drawHeight =
      width / imageRatio;
  } else {
    drawWidth =
      height * imageRatio;
  }

  const offsetX =
    x + (width - drawWidth) / 2;

  const offsetY =
    y + (height - drawHeight) / 2;

  context.drawImage(
    image,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight
  );
}

export async function overlayImages(
  baseFile: File,
  overlayFile: File
): Promise<Blob> {
  const base = await loadImage(baseFile);
  const overlay = await loadImage(
    overlayFile
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.drawImage(
    base,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const maxWidth =
    canvas.width * 0.5;

  const scale =
    Math.min(
      maxWidth / overlay.naturalWidth,
      maxWidth / overlay.naturalHeight
    );

  const overlayWidth =
    overlay.naturalWidth * scale;

  const overlayHeight =
    overlay.naturalHeight * scale;

  context.drawImage(
    overlay,
    canvas.width -
      overlayWidth -
      30,
    canvas.height -
      overlayHeight -
      30,
    overlayWidth,
    overlayHeight
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

export async function createCollage(
  files: File[]
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

  const images = await Promise.all(
    files.map(loadImage)
  );

  const columns =
    Math.ceil(Math.sqrt(images.length));

  const rows =
    Math.ceil(
      images.length / columns
    );

  const cellSize = 400;
  const gap = 12;

  const canvas =
    document.createElement("canvas");

  canvas.width =
    columns * cellSize +
    (columns + 1) * gap;

  canvas.height =
    rows * cellSize +
    (rows + 1) * gap;

  const context = canvas.getContext("2d");

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

  images.forEach((image, index) => {
    const column =
      index % columns;

    const row =
      Math.floor(index / columns);

    const x =
      gap +
      column *
        (cellSize + gap);

    const y =
      gap +
      row *
        (cellSize + gap);

    context.fillStyle =
      "#f5f5f5";

    context.fillRect(
      x,
      y,
      cellSize,
      cellSize
    );

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
    "image/jpeg",
    0.92
  );
}

export async function mergeImages(
  files: File[]
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

  const images = await Promise.all(
    files.map(loadImage)
  );

  const width = Math.max(
    ...images.map(
      (image) =>
        image.naturalWidth
    )
  );

  const gap = 12;

  const height =
    images.reduce(
      (total, image) =>
        total +
        Math.round(
          (image.naturalHeight /
            image.naturalWidth) *
            width
        ),
      0
    ) +
    gap *
      (images.length - 1);

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    width,
    height
  );

  let currentY = 0;

  images.forEach((image, index) => {
    const targetHeight =
      Math.round(
        (image.naturalHeight /
          image.naturalWidth) *
          width
      );

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

  return canvasToBlob(
    canvas,
    "image/jpeg",
    0.92
  );
}

export async function splitImage(
  file: File
): Promise<Blob[]> {
  const image = await loadImage(file);

  const width =
    image.naturalWidth;

  const height =
    image.naturalHeight;

  if (!width || !height) {
    throw new Error(
      "Unable to read image dimensions."
    );
  }

  /*
   * Split into four equal sections:
   *
   * 1 | 2
   * -------
   * 3 | 4
   */

  const halfWidth =
    Math.floor(width / 2);

  const halfHeight =
    Math.floor(height / 2);

  const regions = [
    {
      x: 0,
      y: 0,
      width: halfWidth,
      height: halfHeight,
    },
    {
      x: halfWidth,
      y: 0,
      width:
        width - halfWidth,
      height: halfHeight,
    },
    {
      x: 0,
      y: halfHeight,
      width: halfWidth,
      height:
        height - halfHeight,
    },
    {
      x: halfWidth,
      y: halfHeight,
      width:
        width - halfWidth,
      height:
        height - halfHeight,
    },
  ];

  const results: Blob[] = [];

  for (const region of regions) {
    if (
      region.width <= 0 ||
      region.height <= 0
    ) {
      continue;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      region.width;

    canvas.height =
      region.height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Canvas is not supported."
      );
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
      await canvasToBlob(
        canvas,
        "image/png"
      )
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
  }
): Promise<Blob> {
  const image = await loadImage(file);

  const x = Math.max(
    0,
    Math.floor(crop.x)
  );

  const y = Math.max(
    0,
    Math.floor(crop.y)
  );

  const width = Math.min(
    Math.floor(crop.width),
    image.naturalWidth - x
  );

  const height = Math.min(
    Math.floor(crop.height),
    image.naturalHeight - y
  );

  if (
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "Invalid crop dimensions."
    );
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

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
    "image/png"
  );
}

export async function circularCrop(
  file: File
): Promise<Blob> {
  const image = await loadImage(file);

  const size = Math.min(
    image.naturalWidth,
    image.naturalHeight
  );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = size;
  canvas.height = size;

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

  const x =
    (image.naturalWidth -
      size) /
    2;

  const y =
    (image.naturalHeight -
      size) /
    2;

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

  return canvasToBlob(
    canvas,
    "image/png"
  );
}