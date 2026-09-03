export interface ImageMetadata {
  name: string;
  type: string;
  size: number;
  sizeKB: number;
  sizeMB: number;
  width: number;
  height: number;
  aspectRatio: string;
  lastModified: string;
}

export async function getImageMetadata(
  file: File
): Promise<ImageMetadata> {
  const dimensions =
    await getImageDimensions(
      file
    );

  const ratio =
    dimensions.width /
    dimensions.height;

  return {
    name: file.name,
    type: file.type || "unknown",
    size: file.size,
    sizeKB:
      Number(
        (file.size / 1024).toFixed(2)
      ),
    sizeMB:
      Number(
        (
          file.size /
          (1024 * 1024)
        ).toFixed(2)
      ),
    width:
      dimensions.width,
    height:
      dimensions.height,
    aspectRatio:
      simplifyAspectRatio(
        dimensions.width,
        dimensions.height
      ),
    lastModified:
      new Date(
        file.lastModified
      ).toLocaleString(),
  };
}

export function getImageDimensions(
  file: File
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(
          file
        );

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve({
          width:
            image.naturalWidth,
          height:
            image.naturalHeight,
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            "Unable to read image dimensions."
          )
        );
      };

      image.src = url;
    }
  );
}

export function simplifyAspectRatio(
  width: number,
  height: number
): string {
  const divisor =
    greatestCommonDivisor(
      width,
      height
    );

  return `${Math.round(
    width / divisor
  )}:${Math.round(
    height / divisor
  )}`;
}

function greatestCommonDivisor(
  a: number,
  b: number
): number {
  let x = Math.abs(
    Math.round(a)
  );

  let y = Math.abs(
    Math.round(b)
  );

  while (y !== 0) {
    const remainder =
      x % y;

    x = y;
    y = remainder;
  }

  return x || 1;
}

export async function imageToDataURL(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "Unable to generate Data URL."
            )
          );

          return;
        }

        resolve(
          reader.result
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read image."
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

export async function pickColor(
  file: File,
  x: number,
  y: number
): Promise<{
  hex: string;
  rgb: string;
}> {
  const url =
    URL.createObjectURL(
      file
    );

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload = () =>
            resolve(img);

          img.onerror = () =>
            reject(
              new Error(
                "Unable to load image."
              )
            );

          img.src = url;
        }
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      image.naturalWidth;

    canvas.height =
      image.naturalHeight;

    const context =
      canvas.getContext(
        "2d"
      );

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

    const pixel =
      context.getImageData(
        Math.round(x),
        Math.round(y),
        1,
        1
      ).data;

    const red = pixel[0];
    const green = pixel[1];
    const blue = pixel[2];

    return {
      hex:
        "#" +
        [red, green, blue]
          .map((value) =>
            value
              .toString(16)
              .padStart(2, "0")
          )
          .join("")
          .toUpperCase(),

      rgb:
        `rgb(${red}, ${green}, ${blue})`,
    };
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}