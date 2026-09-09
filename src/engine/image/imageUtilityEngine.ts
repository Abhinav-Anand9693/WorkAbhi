import exifr from "exifr";

export interface ImageMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSizeFormatted: string;
  lastModified: string;
  width: number;
  height: number;
  aspectRatio: string;
  [key: string]: unknown;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${
    units[index]
  }`;
}

function formatMetadataValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(formatMetadataValue);
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return value;
}

function simplifyAspectRatio(
  width: number,
  height: number
): string {
  if (!width || !height) {
    return "Unknown";
  }

  function gcd(a: number, b: number): number {
    while (b !== 0) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }

    return Math.abs(a);
  }

  const divisor = gcd(width, height);

  return `${Math.round(width / divisor)}:${Math.round(
    height / divisor
  )}`;
}

export function getImageDimensions(
  file: Blob
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;

      URL.revokeObjectURL(url);

      resolve({
        width,
        height,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error("Unable to read image dimensions.")
      );
    };

    image.src = url;
  });
}

export async function getImageMetadata(
  file: File
): Promise<ImageMetadata> {
  const dimensions = await getImageDimensions(file);

  let exif: Record<string, unknown> = {};

  try {
    const parsed = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      silentErrors: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      sanitize: true,
      mergeOutput: true,
    });

    if (parsed && typeof parsed === "object") {
      exif = parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.warn(
      "EXIF metadata could not be parsed:",
      error
    );
  }

  const metadata: ImageMetadata = {
    fileName: file.name,
    fileType: file.type || "Unknown",
    fileSize: file.size,
    fileSizeFormatted: formatBytes(file.size),
    lastModified: new Date(
      file.lastModified
    ).toISOString(),
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: simplifyAspectRatio(
      dimensions.width,
      dimensions.height
    ),
  };

  for (const [key, value] of Object.entries(exif)) {
    metadata[key] =
      formatMetadataValue(value);
  }

  return metadata;
}

export function imageToDataURL(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = reader.result;

      if (typeof value !== "string") {
        reject(
          new Error(
            "Unable to convert image to Data URL."
          )
        );

        return;
      }

      resolve(value);
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Unable to read the image file."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

export interface PickedColor {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  rgba: string;
}

export async function pickColor(
  file: File,
  x: number,
  y: number
): Promise<PickedColor> {
  const image = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            "Unable to load image for color picking."
          )
        );
      };

      img.src = url;
    }
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error(
      "Canvas is not supported by this browser."
    );
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const safeX = Math.max(
    0,
    Math.min(
      canvas.width - 1,
      Math.round(x)
    )
  );

  const safeY = Math.max(
    0,
    Math.min(
      canvas.height - 1,
      Math.round(y)
    )
  );

  const pixel = context.getImageData(
    safeX,
    safeY,
    1,
    1
  ).data;

  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];
  const a = pixel[3] / 255;

  const hex = `#${[r, g, b]
    .map((value) =>
      value
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

  return {
    hex,
    rgb: {
      r,
      g,
      b,
    },
    rgba: `rgba(${r}, ${g}, ${b}, ${a.toFixed(
      2
    )})`,
  };
}