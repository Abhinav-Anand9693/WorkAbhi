"use client";

/* ==========================================
   LOAD IMAGE
========================================== */

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

/* ==========================================
   METADATA
========================================== */

export async function getImageMetadata(
  file: File
) {
  const image =
    await loadImage(file);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeFormatted:
      formatBytes(file.size),

    mimeType: file.type,

    width:
      image.naturalWidth,

    height:
      image.naturalHeight,

    aspectRatio:
      simplifyAspectRatio(
        image.naturalWidth,
        image.naturalHeight
      ),

    lastModified:
      new Date(
        file.lastModified
      ).toLocaleString(),

    fileLastModified:
      file.lastModified,

    type:
      file.type
        .split("/")
        .pop()
        ?.toUpperCase() ?? "UNKNOWN",
  };
}

/* ==========================================
   DIMENSIONS
========================================== */

export async function getImageDimensions(
  file: File
) {
  const image =
    await loadImage(file);

  return {
    width:
      image.naturalWidth,

    height:
      image.naturalHeight,

    aspectRatio:
      simplifyAspectRatio(
        image.naturalWidth,
        image.naturalHeight
      ),
  };
}

/* ==========================================
   ASPECT RATIO
========================================== */

export function simplifyAspectRatio(
  width: number,
  height: number
) {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return "0:0";
  }

  function gcd(
    a: number,
    b: number
  ): number {
    return b === 0
      ? a
      : gcd(b, a % b);
  }

  const divisor = gcd(
    Math.round(width),
    Math.round(height)
  );

  return `${Math.round(
    width / divisor
  )}:${Math.round(
    height / divisor
  )}`;
}

/* ==========================================
   BYTES
========================================== */

function formatBytes(
  bytes: number
) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.floor(
    Math.log(bytes) /
      Math.log(1024)
  );

  return `${(
    bytes /
    Math.pow(1024, index)
  ).toFixed(2)} ${
    units[index]
  }`;
}

/* ==========================================
   DATA URL
========================================== */

export function imageToDataURL(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        resolve(
          reader.result as string
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to convert image to Data URL."
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

/* ==========================================
   COLOR PICKER
========================================== */

export interface PickedColor {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  rgba: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export async function pickColor(
  file: File | Blob,
  x: number,
  y: number
): Promise<PickedColor> {
  const image =
    await loadImage(file);

  const canvas =
    document.createElement("canvas");

  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true,
      }
    );

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

  const safeX = Math.max(
    0,
    Math.min(
      image.naturalWidth - 1,
      Math.floor(x)
    )
  );

  const safeY = Math.max(
    0,
    Math.min(
      image.naturalHeight - 1,
      Math.floor(y)
    )
  );

  const pixel =
    ctx.getImageData(
      safeX,
      safeY,
      1,
      1
    ).data;

  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];
  const a = pixel[3];

  const hex =
    "#" +
    [r, g, b]
      .map((value) =>
        value
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase();

  return {
    hex,

    rgb: {
      r,
      g,
      b,
    },

    rgba: {
      r,
      g,
      b,
      a,
    },
  };
}