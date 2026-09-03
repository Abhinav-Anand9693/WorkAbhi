export interface ResizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  mimeType?: string;
}

export interface TransformOptions {
  rotate?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image."));
    };

    img.src = url;
  });
}

function getOutputDimensions(
  image: HTMLImageElement,
  width?: number,
  height?: number
) {
  let outputWidth = width ?? image.naturalWidth;
  let outputHeight = height ?? image.naturalHeight;

  if (width && !height) {
    outputHeight = Math.round(
      (image.naturalHeight / image.naturalWidth) * width
    );
  }

  if (height && !width) {
    outputWidth = Math.round(
      (image.naturalWidth / image.naturalHeight) * height
    );
  }

  return {
    width: outputWidth,
    height: outputHeight,
  };
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  const image = await loadImage(file);

  const { width, height } = getOutputDimensions(
    image,
    options.width,
    options.height
  );

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create image."));
          return;
        }

        resolve(blob);
      },
      options.mimeType ?? "image/jpeg",
      options.quality ?? 0.85
    );
  });
}

export async function transformImage(
  file: File,
  options: TransformOptions
): Promise<Blob> {
  const image = await loadImage(file);

  const rotation = options.rotate ?? 0;

  const normalizedRotation =
    ((rotation % 360) + 360) % 360;

  const isSideways =
    normalizedRotation === 90 ||
    normalizedRotation === 270;

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas = document.createElement("canvas");

  canvas.width = isSideways ? height : width;
  canvas.height = isSideways ? width : height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);

  ctx.rotate((normalizedRotation * Math.PI) / 180);

  ctx.scale(
    options.flipHorizontal ? -1 : 1,
    options.flipVertical ? -1 : 1
  );

  const brightness = options.brightness ?? 100;
  const contrast = options.contrast ?? 100;
  const saturation = options.saturation ?? 100;
  const blur = options.blur ?? 0;

  const filters: string[] = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
  ];

  if (blur > 0) {
    filters.push(`blur(${blur}px)`);
  }

  if (options.grayscale) {
    filters.push("grayscale(100%)");
  }

  if (options.sepia) {
    filters.push("sepia(100%)");
  }

  if (options.invert) {
    filters.push("invert(100%)");
  }

  ctx.filter = filters.join(" ");

  ctx.drawImage(
    image,
    -width / 2,
    -height / 2,
    width,
    height
  );

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to process image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export function downloadBlob(
  blob: Blob,
  filename: string
) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}