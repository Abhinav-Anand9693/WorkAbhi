import type {
  ImageAdjustOptions,
  ImageBorderOptions,
  ImageTransformOptions,
} from "@/types/image";

export function loadImage(
  file: File | Blob
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

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

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType = "image/jpeg",
  quality = 0.9
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
      mimeType,
      quality
    );
  });
}

export function createCanvas(
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return canvas;
}

export function resizeCanvasImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  mimeType = "image/jpeg",
  quality = 0.9
): Promise<Blob> {
  const canvas = createCanvas(width, height);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return canvasToBlob(
    canvas,
    mimeType,
    quality
  );
}

export function transformImage(
  image: HTMLImageElement,
  options: ImageTransformOptions & ImageAdjustOptions,
  mimeType = "image/jpeg"
): Promise<Blob> {
  const rotation =
    ((options.rotation ?? 0) % 360 + 360) % 360;

  const sideways =
    rotation === 90 ||
    rotation === 270;

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas = createCanvas(
    sideways ? height : width,
    sideways ? width : height
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  const brightness =
    options.brightness ?? 100;

  const contrast =
    options.contrast ?? 100;

  const saturation =
    options.saturation ?? 100;

  const hue =
    options.hue ?? 0;

  const exposure =
    options.exposure ?? 0;

  const opacity =
    options.opacity ?? 100;

  const blur =
    options.blur ?? 0;

  const filters: string[] = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    `hue-rotate(${hue}deg)`,
    `opacity(${opacity}%)`,
  ];

  if (exposure !== 0) {
    const exposureValue =
      Math.pow(2, exposure);

    filters.push(
      `brightness(${exposureValue * 100}%)`
    );
  }

  if (blur > 0) {
    filters.push(`blur(${blur}px)`);
  }

  if (options.grayscale) {
    filters.push("grayscale(100%)");
  }

  context.save();

  context.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  context.rotate(
    (rotation * Math.PI) / 180
  );

  context.scale(
    options.flipHorizontal ? -1 : 1,
    options.flipVertical ? -1 : 1
  );

  context.filter = filters.join(" ");

  context.drawImage(
    image,
    -width / 2,
    -height / 2,
    width,
    height
  );

  context.restore();

  if (options.blackAndWhite) {
    convertCanvasToBlackAndWhite(canvas);
  }

  if (options.pixelate) {
    pixelateCanvas(
      canvas,
      options.pixelate
    );
  }

  if (options.sharpen) {
    sharpenCanvas(
      canvas,
      options.sharpen
    );
  }

  return canvasToBlob(
    canvas,
    mimeType,
    0.92
  );
}

function convertCanvasToBlackAndWhite(
  canvas: HTMLCanvasElement
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const average =
      0.299 * data[index] +
      0.587 * data[index + 1] +
      0.114 * data[index + 2];

    const value =
      average >= 128 ? 255 : 0;

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(
    imageData,
    0,
    0
  );
}

export function pixelateCanvas(
  canvas: HTMLCanvasElement,
  pixelSize = 10
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;

  const imageData = context.getImageData(
    0,
    0,
    width,
    height
  );

  const data = imageData.data;

  for (
    let y = 0;
    y < height;
    y += pixelSize
  ) {
    for (
      let x = 0;
      x < width;
      x += pixelSize
    ) {
      const index =
        (y * width + x) * 4;

      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;

      for (
        let py = y;
        py < Math.min(y + pixelSize, height);
        py++
      ) {
        for (
          let px = x;
          px < Math.min(x + pixelSize, width);
          px++
        ) {
          const target =
            (py * width + px) * 4;

          data[target] = red;
          data[target + 1] = green;
          data[target + 2] = blue;
        }
      }
    }
  }

  context.putImageData(
    imageData,
    0,
    0
  );
}

export function sharpenCanvas(
  canvas: HTMLCanvasElement,
  strength = 1
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;

  const source = context.getImageData(
    0,
    0,
    width,
    height
  );

  const output = context.createImageData(
    width,
    height
  );

  const input = source.data;
  const result = output.data;

  const center = 1 + strength * 4;

  const kernel = [
    0,
    -strength,
    0,

    -strength,
    center,
    -strength,

    0,
    -strength,
    0,
  ];

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
      let red = 0;
      let green = 0;
      let blue = 0;

      let kernelIndex = 0;

      for (
        let ky = -1;
        ky <= 1;
        ky++
      ) {
        for (
          let kx = -1;
          kx <= 1;
          kx++
        ) {
          const sourceIndex =
            ((y + ky) * width +
              (x + kx)) *
            4;

          const weight =
            kernel[kernelIndex++];

          red +=
            input[sourceIndex] * weight;

          green +=
            input[sourceIndex + 1] * weight;

          blue +=
            input[sourceIndex + 2] * weight;
        }
      }

      const targetIndex =
        (y * width + x) * 4;

      result[targetIndex] =
        Math.max(0, Math.min(255, red));

      result[targetIndex + 1] =
        Math.max(0, Math.min(255, green));

      result[targetIndex + 2] =
        Math.max(0, Math.min(255, blue));

      result[targetIndex + 3] =
        input[targetIndex + 3];
    }
  }

  context.putImageData(
    output,
    0,
    0
  );
}

export function addBorder(
  image: HTMLImageElement,
  options: ImageBorderOptions
): Promise<Blob> {
  const size = Math.max(
    0,
    Math.round(options.size)
  );

  const canvas = createCanvas(
    image.naturalWidth + size * 2,
    image.naturalHeight + size * 2
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.fillStyle = options.color;

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(
    image,
    size,
    size
  );

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}

export function roundedCorners(
  image: HTMLImageElement,
  radius: number
): Promise<Blob> {
  const canvas = createCanvas(
    image.naturalWidth,
    image.naturalHeight
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  const r = Math.min(
    radius,
    canvas.width / 2,
    canvas.height / 2
  );

  context.beginPath();

  context.moveTo(r, 0);

  context.lineTo(
    canvas.width - r,
    0
  );

  context.quadraticCurveTo(
    canvas.width,
    0,
    canvas.width,
    r
  );

  context.lineTo(
    canvas.width,
    canvas.height - r
  );

  context.quadraticCurveTo(
    canvas.width,
    canvas.height,
    canvas.width - r,
    canvas.height
  );

  context.lineTo(
    r,
    canvas.height
  );

  context.quadraticCurveTo(
    0,
    canvas.height,
    0,
    canvas.height - r
  );

  context.lineTo(0, r);

  context.quadraticCurveTo(
    0,
    0,
    r,
    0
  );

  context.closePath();

  context.clip();

  context.drawImage(
    image,
    0,
    0
  );

  return canvasToBlob(
    canvas,
    "image/png",
    0.95
  );
}