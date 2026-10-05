import exifr from "exifr";

import {
  throwIfImageProcessingAborted,
  validateImageDimensions,
} from "./imageSafety";

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
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function simplifyAspectRatio(
  width: number,
  height: number,
): string {
  if (!width || !height) return "Unknown";

  let a = Math.abs(Math.round(width));
  let b = Math.abs(Math.round(height));

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return `${Math.round(width / a)}:${Math.round(height / a)}`;
}

function formatMetadataValue(
  value: unknown,
): unknown {
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

export function getImageDimensions(
  file: Blob,
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    image.onload = () => {
      cleanup();

      try {
        validateImageDimensions(
          image.naturalWidth,
          image.naturalHeight,
        );

        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();

      reject(
        new Error(
          "Unable to read image dimensions.",
        ),
      );
    };

    image.src = url;
  });
}

export async function getImageMetadata(
  file: File,
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
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      sanitize: true,
      mergeOutput: true,
    });

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      exif =
        parsed as Record<
          string,
          unknown
        >;
    }
  } catch (error) {
    console.warn(
      "EXIF metadata could not be parsed:",
      error,
    );
  }

  const metadata: ImageMetadata = {
    fileName: file.name,
    fileType: file.type || "Unknown",
    fileSize: file.size,
    fileSizeFormatted: formatBytes(file.size),
    lastModified:
      new Date(
        file.lastModified,
      ).toISOString(),
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: simplifyAspectRatio(
      dimensions.width,
      dimensions.height,
    ),
  };

  for (const [key, value] of Object.entries(
    exif,
  )) {
    metadata[key] =
      formatMetadataValue(value);
  }

  return metadata;
}

async function blobToBase64(
  blob: Blob,
  signal?: AbortSignal,
): Promise<string> {
  const reader = blob.stream().getReader();

  const chunks: string[] = [];

  let carry = new Uint8Array(0);

  const encodeChunk = (
    bytes: Uint8Array,
  ): string => {
    let binary = "";

    const step = 0x8000;

    for (
      let offset = 0;
      offset < bytes.length;
      offset += step
    ) {
      throwIfImageProcessingAborted(
        signal,
      );

      const part = bytes.subarray(
        offset,
        Math.min(
          offset + step,
          bytes.length,
        ),
      );

      binary += String.fromCharCode(
        ...part,
      );
    }

    return btoa(binary);
  };

  try {
    while (true) {
      throwIfImageProcessingAborted(
        signal,
      );

      const {
        done,
        value,
      } = await reader.read();

      if (done) break;

      let data =
        value instanceof Uint8Array
          ? value
          : new Uint8Array(value);

      if (carry.length) {
        const merged =
          new Uint8Array(
            carry.length +
              data.length,
          );

        merged.set(carry);

        merged.set(
          data,
          carry.length,
        );

        data = merged;

        carry =
          new Uint8Array(0);
      }

      const usableLength =
        data.length -
        (data.length % 3);

      if (usableLength > 0) {
        chunks.push(
          encodeChunk(
            data.subarray(
              0,
              usableLength,
            ),
          ),
        );
      }

      if (
        usableLength <
        data.length
      ) {
        carry =
          data.slice(
            usableLength,
          );
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (carry.length) {
    chunks.push(
      encodeChunk(carry),
    );
  }

  return chunks.join("");
}

export async function imageToDataURL(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  throwIfImageProcessingAborted(
    signal,
  );

  const base64 =
    await blobToBase64(
      file,
      signal,
    );

  return `data:${
    file.type ||
    "application/octet-stream"
  };base64,${base64}`;
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
  y: number,
): Promise<PickedColor> {
  const {
    width,
    height,
  } = await getImageDimensions(
    file,
  );

  const sourceX = Math.max(
    0,
    Math.min(
      width - 1,
      Math.round(x),
    ),
  );

  const sourceY = Math.max(
    0,
    Math.min(
      height - 1,
      Math.round(y),
    ),
  );

  let pixel: Uint8ClampedArray;

  if (
    typeof createImageBitmap ===
    "function"
  ) {
    const maxSide = 2048;

    const scale = Math.min(
      1,
      maxSide /
        Math.max(
          width,
          height,
        ),
    );

    const renderWidth =
      Math.max(
        1,
        Math.round(
          width * scale,
        ),
      );

    const renderHeight =
      Math.max(
        1,
        Math.round(
          height * scale,
        ),
      );

    const bitmap =
      await createImageBitmap(
        file,
        {
          resizeWidth:
            renderWidth,
          resizeHeight:
            renderHeight,
          imageOrientation:
            "from-image",
        },
      );

    try {
      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width = 1;
      canvas.height = 1;

      const context =
        canvas.getContext(
          "2d",
          {
            willReadFrequently:
              true,
          },
        );

      if (!context) {
        throw new Error(
          "Canvas is not supported by this browser.",
        );
      }

      const renderX =
        Math.min(
          renderWidth - 1,
          Math.floor(
            sourceX * scale,
          ),
        );

      const renderY =
        Math.min(
          renderHeight - 1,
          Math.floor(
            sourceY * scale,
          ),
        );

      context.drawImage(
        bitmap,
        renderX,
        renderY,
        1,
        1,
        0,
        0,
        1,
        1,
      );

      pixel =
        context.getImageData(
          0,
          0,
          1,
          1,
        ).data;

      canvas.width = 1;
      canvas.height = 1;
    } finally {
      bitmap.close();
    }
  } else {
    const url =
      URL.createObjectURL(file);

    const image =
      document.createElement(
        "img",
      );

    try {
      await new Promise<void>(
        (resolve, reject) => {
          image.onload = () =>
            resolve();

          image.onerror = () =>
            reject(
              new Error(
                "Unable to load image for color picking.",
              ),
            );

          image.src = url;
        },
      );

      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width = 1;
      canvas.height = 1;

      const context =
        canvas.getContext(
          "2d",
          {
            willReadFrequently:
              true,
          },
        );

      if (!context) {
        throw new Error(
          "Canvas is not supported by this browser.",
        );
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        1,
        1,
        0,
        0,
        1,
        1,
      );

      pixel =
        context.getImageData(
          0,
          0,
          1,
          1,
        ).data;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const [
    r,
    g,
    b,
    alphaByte,
  ] = pixel;

  const alpha =
    alphaByte / 255;

  const hex = `#${[
    r,
    g,
    b,
  ]
    .map(
      (value) =>
        value
          .toString(16)
          .padStart(2, "0"),
    )
    .join("")}`;

  return {
    hex,

    rgb: {
      r,
      g,
      b,
    },

    rgba: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(
      2,
    )})`,
  };
}

function stripJpegMetadata(
  bytes: Uint8Array,
): Uint8Array {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8
  ) {
    return bytes;
  }

  const output: number[] = [
    0xff,
    0xd8,
  ];

  let offset = 2;

  while (
    offset < bytes.length
  ) {
    if (
      bytes[offset] !== 0xff
    ) {
      output.push(
        bytes[offset++],
      );

      continue;
    }

    const marker =
      bytes[offset + 1];

    if (
      marker === undefined
    ) {
      break;
    }

    // Start Of Scan.
    // From here onward the bytes
    // contain compressed JPEG data.
    if (marker === 0xda) {
      for (
        ;
        offset < bytes.length;
        offset++
      ) {
        output.push(
          bytes[offset],
        );
      }

      break;
    }

    // End Of Image.
    if (marker === 0xd9) {
      output.push(
        0xff,
        0xd9,
      );

      break;
    }

    const length =
      ((bytes[offset + 2] ??
        0) <<
        8) |
      (bytes[offset + 3] ??
        0);

    if (
      length < 2 ||
      offset +
        2 +
        length >
        bytes.length
    ) {
      for (
        ;
        offset < bytes.length;
        offset++
      ) {
        output.push(
          bytes[offset],
        );
      }

      break;
    }

    // APP1 = EXIF
    // APP13 = IPTC / Photoshop
    // COM = JPEG comments
    const remove =
      marker === 0xe1 ||
      marker === 0xed ||
      marker === 0xfe;

    if (!remove) {
      for (
        let index = 0;
        index <
        2 + length;
        index++
      ) {
        output.push(
          bytes[
            offset + index
          ],
        );
      }
    }

    offset +=
      2 + length;
  }

  return new Uint8Array(
    output,
  );
}

export async function removeImageMetadata(
  file: File,
): Promise<Blob> {
  // --------------------------------------------------
  // JPEG
  // --------------------------------------------------

  if (
    file.type ===
    "image/jpeg"
  ) {
    const bytes =
      new Uint8Array(
        await file.arrayBuffer(),
      );

    const stripped =
      stripJpegMetadata(
        bytes,
      );

    // IMPORTANT:
    // Use stripped bytes rather
    // than the original bytes.
    //
    // Copy into a fresh Uint8Array
    // so Blob receives a normal
    // ArrayBuffer-compatible value.

    const blobBytes =
      new Uint8Array(
        stripped.byteLength,
      );

    blobBytes.set(
      stripped,
    );

    return new Blob(
      [blobBytes.buffer],
      {
        type: "image/jpeg",
      },
    );
  }

  // --------------------------------------------------
  // PNG / WebP
  // --------------------------------------------------

  if (
    file.type ===
      "image/png" ||
    file.type ===
      "image/webp"
  ) {
    const url =
      URL.createObjectURL(file);

    const image =
      document.createElement(
        "img",
      );

    try {
      await new Promise<void>(
        (resolve, reject) => {
          image.onload = () =>
            resolve();

          image.onerror = () =>
            reject(
              new Error(
                "Unable to load image.",
              ),
            );

          image.src = url;
        },
      );

      validateImageDimensions(
        image.naturalWidth,
        image.naturalHeight,
        "Image",
      );

      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width =
        image.naturalWidth;

      canvas.height =
        image.naturalHeight;

      const context =
        canvas.getContext(
          "2d",
        );

      if (!context) {
        throw new Error(
          "Canvas is not supported.",
        );
      }

      context.drawImage(
        image,
        0,
        0,
      );

      return await new Promise<Blob>(
        (
          resolve,
          reject,
        ) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Unable to remove image metadata.",
                  ),
                );

                return;
              }

              resolve(blob);
            },
            file.type,
            file.type ===
              "image/png"
              ? undefined
              : 0.92,
          );
        },
      );
    } finally {
      URL.revokeObjectURL(
        url,
      );

      // Release the image
      // resource where supported.
      image.src = "";
    }
  }

  // --------------------------------------------------
  // Unknown / unsupported
  // --------------------------------------------------

  return new Blob(
    [file],
    {
      type:
        file.type ||
        "application/octet-stream",
    },
  );
}