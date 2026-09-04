"use client";

import { useEffect, useMemo, useState } from "react";

import { imageTools } from "@/config/imageTools";
import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import ImageControls from "./ImageController";

import {
  compressImage,
  compressToTargetSize,
  resizeByHeight,
  resizeByPercentage,
  resizeByWidth,
} from "@/engine/image/imageCompressionEngine";

import {
  circularCrop,
  cropImage,
  createCollage,
  mergeImages,
  overlayImages,
  splitImage,
} from "@/engine/image/imageCompositionEngine";

import {
  addTextToImage,
  addWatermark,
} from "@/engine/image/imageExportEngine";

import {
  addBorder,
  loadImage,
  roundedCorners,
  transformImage,
} from "@/engine/image/imageTransformEngine";

import {
  getImageMetadata,
  imageToDataURL,
} from "@/engine/image/imageUtilityEngine";

interface Props {
  toolId: string;
}

export default function ImageTool({ toolId }: Props) {
  const definition = useMemo(
    () =>
      imageTools.find(
        (tool) => tool.toolId === toolId
      ),
    [toolId]
  );
   
  const [originalPreview, setOriginalPreview] =
  useState<string | null>(null);

const [resultPreview, setResultPreview] =
  useState<string | null>(null);

  
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const [result, setResult] = useState<Blob | null>(null);
  const [resultFiles, setResultFiles] = useState<Blob[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quality, setQuality] = useState(80);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [percentage, setPercentage] = useState("100");

  const [rotation, setRotation] = useState("90");

  const [flipDirection, setFlipDirection] = useState<
    "horizontal" | "vertical"
  >("horizontal");

  const [effectValue, setEffectValue] = useState(10);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [opacity, setOpacity] = useState(100);

  const [borderSize, setBorderSize] = useState(10);
  const [borderColor, setBorderColor] = useState("#000000");

  const [radius, setRadius] = useState(30);

  const [text, setText] = useState("WorkAbhi");
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#ffffff");

  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);

  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");

  const [metadata, setMetadata] = useState<
    Awaited<ReturnType<typeof getImageMetadata>> | null
  >(null);

  const [dataURL, setDataURL] = useState("");

  /*
   * Cleanup the current preview URL when the component unmounts
   * or when preview changes.
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /*
   * If the toolId doesn't exist in imageTools,
   * don't render the rest of the component.
   */
  if (!definition) {
    return (
      <div className="rounded-2xl border p-8">
        Image tool not found.
      </div>
    );
  }

  function handleFiles(
  selectedFiles: File[]
) {
  if (!selectedFiles.length) {
    return;
  }

  if (originalPreview) {
    URL.revokeObjectURL(
      originalPreview
    );
  }

  if (resultPreview) {
    URL.revokeObjectURL(
      resultPreview
    );
  }

  setFiles(selectedFiles);

  setResult(null);
  setResultFiles([]);
  setMetadata(null);
  setDataURL("");
  setError("");

  const previewUrl =
    URL.createObjectURL(
      selectedFiles[0]
    );

  setOriginalPreview(
    previewUrl
  );

  setResultPreview(null);
}

  async function process() {
    /*
     * IMPORTANT:
     *
     * The outer component has already checked definition,
     * but process() is a nested function/closure.
     *
     * TypeScript does not always preserve that narrowing here.
     * Therefore we explicitly guard it again.
     */
    if (!definition) {
      setError("Image tool not found.");
      return;
    }

    if (!files.length) {
      setError("Please select an image first.");
      return;
    }

    const currentDefinition = definition;

    setLoading(true);
    setError("");
    setResult(null);
    setResultFiles([]);
    setDataURL("");

    try {
      let blob: Blob;

      switch (currentDefinition.mode) {
        /*
         * ---------------------------------------------------------
         * COMPRESS
         * ---------------------------------------------------------
         */
        case "compress": {
          if (currentDefinition.targetKB) {
            blob = await compressToTargetSize(
              files[0],
              currentDefinition.targetKB,
              currentDefinition.outputFormat ?? "image/jpeg"
            );
          } else {
            blob = await compressImage(files[0], {
              quality: quality / 100,
              outputFormat:
                currentDefinition.outputFormat ?? "image/jpeg",
            });
          }

          break;
        }

        /*
         * ---------------------------------------------------------
         * RESIZE
         * ---------------------------------------------------------
         */
        case "resize": {
          if (toolId === "resize-image-by-width") {
            const targetWidth = Number(width);

            if (
              !Number.isFinite(targetWidth) ||
              targetWidth <= 0
            ) {
              throw new Error(
                "Please enter a valid width."
              );
            }

            blob = await resizeByWidth(
              files[0],
              targetWidth
            );
          } else if (
            toolId === "resize-image-by-height"
          ) {
            const targetHeight = Number(height);

            if (
              !Number.isFinite(targetHeight) ||
              targetHeight <= 0
            ) {
              throw new Error(
                "Please enter a valid height."
              );
            }

            blob = await resizeByHeight(
              files[0],
              targetHeight
            );
          } else if (
            toolId === "resize-image-by-percentage"
          ) {
            const value = Number(percentage);

            if (
              !Number.isFinite(value) ||
              value <= 0
            ) {
              throw new Error(
                "Please enter a valid percentage."
              );
            }

            blob = await resizeByPercentage(
              files[0],
              value
            );
          } else {
            /*
             * General resize:
             *
             * Width only:
             *   calculate height automatically.
             *
             * Height only:
             *   calculate width automatically.
             *
             * Both:
             *   use both values exactly.
             *
             * Neither:
             *   keep original dimensions.
             */
            const image = await loadImage(files[0]);

            let targetWidth: number;
            let targetHeight: number;

            const hasWidth =
              width.trim() !== "";

            const hasHeight =
              height.trim() !== "";

            if (hasWidth) {
              targetWidth = Number(width);

              if (
                !Number.isFinite(targetWidth) ||
                targetWidth <= 0
              ) {
                throw new Error(
                  "Please enter a valid width."
                );
              }

              if (hasHeight) {
                targetHeight = Number(height);

                if (
                  !Number.isFinite(targetHeight) ||
                  targetHeight <= 0
                ) {
                  throw new Error(
                    "Please enter a valid height."
                  );
                }
              } else {
                targetHeight = Math.round(
                  image.naturalHeight *
                    (targetWidth /
                      image.naturalWidth)
                );
              }
            } else if (hasHeight) {
              targetHeight = Number(height);

              if (
                !Number.isFinite(targetHeight) ||
                targetHeight <= 0
              ) {
                throw new Error(
                  "Please enter a valid height."
                );
              }

              targetWidth = Math.round(
                image.naturalWidth *
                  (targetHeight /
                    image.naturalHeight)
              );
            } else {
              targetWidth = image.naturalWidth;
              targetHeight = image.naturalHeight;
            }

            if (
              targetWidth <= 0 ||
              targetHeight <= 0
            ) {
              throw new Error(
                "Resize dimensions must be greater than zero."
              );
            }

            const canvas =
              document.createElement("canvas");

            canvas.width = targetWidth;
            canvas.height = targetHeight;

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
              0,
              targetWidth,
              targetHeight
            );

            blob = await new Promise<Blob>(
              (resolve, reject) => {
                canvas.toBlob(
                  (value) => {
                    if (!value) {
                      reject(
                        new Error(
                          "Unable to resize image."
                        )
                      );

                      return;
                    }

                    resolve(value);
                  },
                  "image/jpeg",
                  quality / 100
                );
              }
            );
          }

          break;
        }

        /*
         * ---------------------------------------------------------
         * CROP
         * ---------------------------------------------------------
         */
        case "crop": {
          if (
            toolId === "circular-image-cropper"
          ) {
            blob = await circularCrop(files[0]);
          } else {
            const x = Number(cropX);
            const y = Number(cropY);
            const cropW = Number(cropWidth);
            const cropH = Number(cropHeight);

            if (
              !Number.isFinite(x) ||
              !Number.isFinite(y)
            ) {
              throw new Error(
                "Please enter valid crop coordinates."
              );
            }

            if (
              !Number.isFinite(cropW) ||
              cropW <= 0
            ) {
              throw new Error(
                "Please enter a valid crop width."
              );
            }

            if (
              !Number.isFinite(cropH) ||
              cropH <= 0
            ) {
              throw new Error(
                "Please enter a valid crop height."
              );
            }

            if (x < 0 || y < 0) {
              throw new Error(
                "Crop X and Y cannot be negative."
              );
            }

            blob = await cropImage(files[0], {
              x,
              y,
              width: cropW,
              height: cropH,
            });
          }

          break;
        }

        /*
         * ---------------------------------------------------------
         * TRANSFORM
         * ---------------------------------------------------------
         */
        case "transform": {
          const image = await loadImage(files[0]);

          const rotationValue =
            toolId === "image-rotator"
              ? Number(rotation)
              : 0;

          if (
            toolId === "image-rotator" &&
            ![90, 180, 270].includes(
              rotationValue
            )
          ) {
            throw new Error(
              "Please select a valid rotation."
            );
          }

          blob = await transformImage(image, {
            rotation: rotationValue,

            flipHorizontal:
              toolId === "image-flipper" &&
              flipDirection === "horizontal",

            flipVertical:
              toolId === "image-flipper" &&
              flipDirection === "vertical",
          });

          break;
        }

        /*
         * ---------------------------------------------------------
         * EFFECT
         * ---------------------------------------------------------
         */
        case "effect": {
          const image = await loadImage(files[0]);

          blob = await transformImage(image, {
            blur:
              toolId === "image-blur"
                ? effectValue
                : 0,

            sharpen:
              toolId === "image-sharpening"
                ? effectValue / 10
                : 0,

            pixelate:
              toolId === "pixelate-image"
                ? Math.max(2, effectValue)
                : undefined,

            grayscale:
              toolId === "grayscale-image",

            blackAndWhite:
              toolId ===
              "black-and-white-image",
          });

          break;
        }

        /*
         * ---------------------------------------------------------
         * ADJUST
         * ---------------------------------------------------------
         */
        case "adjust": {
          const image = await loadImage(files[0]);

          blob = await transformImage(
            image,
            {
              brightness:
                toolId ===
                "brightness-adjuster"
                  ? brightness
                  : 100,

              contrast:
                toolId === "contrast-adjuster"
                  ? contrast
                  : 100,

              saturation:
                toolId ===
                "saturation-adjuster"
                  ? saturation
                  : 100,

              hue:
                toolId === "hue-adjuster"
                  ? hue
                  : 0,

              exposure:
                toolId ===
                "exposure-adjuster"
                  ? exposure
                  : 0,

              opacity:
                toolId ===
                "opacity-adjuster"
                  ? opacity
                  : 100,
            },
            toolId === "opacity-adjuster"
              ? "image/png"
              : "image/jpeg"
          );

          break;
        }

        /*
         * ---------------------------------------------------------
         * BORDER
         * ---------------------------------------------------------
         */
        case "border": {
          const image = await loadImage(files[0]);

          if (
            toolId ===
            "image-border-generator"
          ) {
            if (
              !Number.isFinite(borderSize) ||
              borderSize < 0
            ) {
              throw new Error(
                "Please enter a valid border size."
              );
            }

            blob = await addBorder(
              image,
              {
                size: borderSize,
                color: borderColor,
              }
            );
          } else {
            blob = await roundedCorners(
              image,
              radius
            );
          }

          break;
        }

        /*
         * ---------------------------------------------------------
         * WATERMARK
         * ---------------------------------------------------------
         */
        case "watermark": {
          if (!text.trim()) {
            throw new Error(
              "Please enter watermark text."
            );
          }

          blob = await addWatermark(
            files[0],
            {
              text,
              opacity: watermarkOpacity,
              fontSize: textSize,
              color: textColor,
              position: "bottom-right",
            }
          );

          break;
        }

        /*
         * ---------------------------------------------------------
         * TEXT
         * ---------------------------------------------------------
         */
        case "text": {
          if (!text.trim()) {
            throw new Error(
              "Please enter text."
            );
          }

          blob = await addTextToImage(
            files[0],
            {
              text,
              fontSize: textSize,
              color: textColor,
              x: 30,
              y: 30,
              bold: true,
            }
          );

          break;
        }

        /*
         * ---------------------------------------------------------
         * OVERLAY
         * ---------------------------------------------------------
         */
        case "overlay": {
          if (files.length < 2) {
            throw new Error(
              "Select two images."
            );
          }

          blob = await overlayImages(
            files[0],
            files[1]
          );

          break;
        }

        /*
         * ---------------------------------------------------------
         * COLLAGE
         * ---------------------------------------------------------
         */
        case "collage": {
          if (files.length < 2) {
            throw new Error(
              "Select at least two images."
            );
          }

          blob = await createCollage(files);

          break;
        }

        /*
         * ---------------------------------------------------------
         * SPLIT
         * ---------------------------------------------------------
         */
        case "split": {
          const pieces = await splitImage(
            files[0]
          );

          if (!pieces.length) {
            throw new Error(
              "Unable to split image."
            );
          }

          setResultFiles(pieces);
          setResult(pieces[0]);

          const splitPreviewURL =
            URL.createObjectURL(pieces[0]);

          setPreview(splitPreviewURL);

          return;
        }

        /*
         * ---------------------------------------------------------
         * MERGE
         * ---------------------------------------------------------
         */
        case "merge": {
          if (files.length < 2) {
            throw new Error(
              "Select at least two images."
            );
          }

          blob = await mergeImages(files);

          break;
        }

        /*
         * ---------------------------------------------------------
         * METADATA / EXIF
         * ---------------------------------------------------------
         */
        case "metadata": {
          const info =
            await getImageMetadata(files[0]);

          setMetadata(info);

          /*
           * Normal metadata viewer only displays information.
           * It doesn't create a result image.
           */
          if (toolId !== "exif-remover") {
            return;
          }

          const image =
            await loadImage(files[0]);

          const canvas =
            document.createElement("canvas");

          canvas.width =
            image.naturalWidth;

          canvas.height =
            image.naturalHeight;

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

          blob = await new Promise<Blob>(
            (resolve, reject) => {
              canvas.toBlob(
                (value) => {
                  if (!value) {
                    reject(
                      new Error(
                        "Unable to remove metadata."
                      )
                    );

                    return;
                  }

                  resolve(value);
                },
                "image/png"
              );
            }
          );

          break;
        }

        /*
         * ---------------------------------------------------------
         * DATA URL
         * ---------------------------------------------------------
         */
        case "data-url": {
          const value =
            await imageToDataURL(files[0]);

          setDataURL(value);

          return;
        }

        /*
         * ---------------------------------------------------------
         * UNKNOWN MODE
         * ---------------------------------------------------------
         */
        default:
          throw new Error(
            "This image operation is not supported."
          );
      }

      /*
       * Store normal processing result.
       */
      setResult(blob);

      /*
       * Create preview for the processed image.
       */
      const resultPreviewURL =
        URL.createObjectURL(blob);

      setPreview(resultPreviewURL);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Image processing failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadBlob(
    blob: Blob,
    name: string
  ) {
    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = name;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function downloadResult() {
    if (!result) {
      return;
    }

    downloadBlob(
      result,
      `${toolId}-workabhi.png`
    );
  }

  function downloadSplit(
    blob: Blob,
    index: number
  ) {
    downloadBlob(
      blob,
      `${toolId}-${index + 1}.png`
    );
  }

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------
          Upload
      -------------------------------------------------------- */}
        <ImageUploader
  multiple={definition.multiple}
  onFilesSelected={handleFiles}
  disabled={loading}
/>

      {/* -------------------------------------------------------
          File Info
      -------------------------------------------------------- */}

      {files.length > 0 && (
        <section className="rounded-2xl border p-6">
          <div className="flex flex-wrap gap-2">
            {files.map(
              (file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  {file.name}
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------
          Controls
      -------------------------------------------------------- */}

      {files.length > 0 && (
        <section className="rounded-2xl border p-6">
          <h2 className="mb-5 text-lg font-semibold">
            Tool Settings
          </h2>

          <div className="space-y-5">
            {/* Compression */}

            {definition.mode ===
              "compress" && (
              <Range
                label="Quality"
                value={quality}
                min={10}
                max={100}
                onChange={setQuality}
              />
            )}

            {/* Resize */}

            {definition.mode ===
              "resize" && (
              <>
                {toolId !==
                  "resize-image-by-percentage" && (
                  <>
                    <NumberInput
                      label="Width"
                      value={width}
                      onChange={setWidth}
                    />

                    <NumberInput
                      label="Height"
                      value={height}
                      onChange={setHeight}
                    />
                  </>
                )}

                {toolId ===
                  "resize-image-by-percentage" && (
                  <NumberInput
                    label="Percentage"
                    value={percentage}
                    onChange={setPercentage}
                  />
                )}
              </>
            )}

            {/* Crop */}

            {definition.mode ===
              "crop" &&
              toolId !==
                "circular-image-cropper" && (
                <>
                  <NumberInput
                    label="X"
                    value={cropX}
                    onChange={setCropX}
                  />

                  <NumberInput
                    label="Y"
                    value={cropY}
                    onChange={setCropY}
                  />

                  <NumberInput
                    label="Crop Width"
                    value={cropWidth}
                    onChange={setCropWidth}
                  />

                  <NumberInput
                    label="Crop Height"
                    value={cropHeight}
                    onChange={setCropHeight}
                  />
                </>
              )}

            {/* Rotation */}

            {toolId ===
              "image-rotator" && (
              <div>
                <label className="text-sm font-medium">
                  Rotation
                </label>

                <select
                  value={rotation}
                  onChange={(event) =>
                    setRotation(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border px-3 py-2"
                >
                  <option value="90">
                    90°
                  </option>

                  <option value="180">
                    180°
                  </option>

                  <option value="270">
                    270°
                  </option>
                </select>
              </div>
            )}

            {/* Flip */}

            {toolId ===
              "image-flipper" && (
              <div>
                <label className="text-sm font-medium">
                  Flip Direction
                </label>

                <select
                  value={flipDirection}
                  onChange={(event) =>
                    setFlipDirection(
                      event.target.value as
                        | "horizontal"
                        | "vertical"
                    )
                  }
                  className="mt-2 w-full rounded-lg border px-3 py-2"
                >
                  <option value="horizontal">
                    Horizontal
                  </option>

                  <option value="vertical">
                    Vertical
                  </option>
                </select>
              </div>
            )}

            {/* Effects */}

            {definition.mode ===
              "effect" && (
              <Range
                label="Effect Strength"
                value={effectValue}
                min={2}
                max={30}
                onChange={setEffectValue}
              />
            )}

            {/* Brightness */}

            {toolId ===
              "brightness-adjuster" && (
              <Range
                label="Brightness"
                value={brightness}
                min={0}
                max={200}
                onChange={setBrightness}
              />
            )}

            {/* Contrast */}

            {toolId ===
              "contrast-adjuster" && (
              <Range
                label="Contrast"
                value={contrast}
                min={0}
                max={200}
                onChange={setContrast}
              />
            )}

            {/* Saturation */}

            {toolId ===
              "saturation-adjuster" && (
              <Range
                label="Saturation"
                value={saturation}
                min={0}
                max={200}
                onChange={setSaturation}
              />
            )}

            {/* Hue */}

            {toolId ===
              "hue-adjuster" && (
              <Range
                label="Hue"
                value={hue}
                min={-180}
                max={180}
                onChange={setHue}
              />
            )}

            {/* Exposure */}

            {toolId ===
              "exposure-adjuster" && (
              <Range
                label="Exposure"
                value={exposure}
                min={-3}
                max={3}
                onChange={setExposure}
              />
            )}

            {/* Opacity */}

            {toolId ===
              "opacity-adjuster" && (
              <Range
                label="Opacity"
                value={opacity}
                min={0}
                max={100}
                onChange={setOpacity}
              />
            )}

            {/* Border */}

            {toolId ===
              "image-border-generator" && (
              <>
                <NumberInput
                  label="Border Size"
                  value={String(borderSize)}
                  onChange={(value) =>
                    setBorderSize(
                      Number(value)
                    )
                  }
                />

                <div>
                  <label className="text-sm font-medium">
                    Border Color
                  </label>

                  <input
                    type="color"
                    value={borderColor}
                    onChange={(event) =>
                      setBorderColor(
                        event.target.value
                      )
                    }
                    className="mt-2 h-10 w-full"
                  />
                </div>
              </>
            )}

            {/* Rounded corners */}

            {toolId ===
              "rounded-corners" && (
              <Range
                label="Corner Radius"
                value={radius}
                min={0}
                max={300}
                onChange={setRadius}
              />
            )}

            {/* Text / Watermark */}

            {(toolId ===
              "image-watermark" ||
              toolId ===
                "add-text-to-image") && (
              <>
                <TextInput
                  label="Text"
                  value={text}
                  onChange={setText}
                />

                <NumberInput
                  label="Font Size"
                  value={String(textSize)}
                  onChange={(value) =>
                    setTextSize(
                      Number(value)
                    )
                  }
                />

                <div>
                  <label className="text-sm font-medium">
                    Text Color
                  </label>

                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) =>
                      setTextColor(
                        event.target.value
                      )
                    }
                    className="mt-2 h-10 w-full"
                  />
                </div>
              </>
            )}

            {/* Watermark opacity */}

            {toolId ===
              "image-watermark" && (
              <Range
                label="Watermark Opacity"
                value={Math.round(
                  watermarkOpacity * 100
                )}
                min={10}
                max={100}
                onChange={(value) =>
                  setWatermarkOpacity(
                    value / 100
                  )
                }
              />
            )}
          </div>

          {/* Error */}

          {error && (
            <div className="mt-5 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Process */}

          <button
            type="button"
            onClick={process}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Process Image"}
          </button>
        </section>
      )}

      {/* -------------------------------------------------------
          Metadata
      -------------------------------------------------------- */}

      {metadata && (
        <section className="rounded-2xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Image Metadata
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              label="File Name"
              value={metadata.name}
            />

            <Info
              label="Type"
              value={metadata.type}
            />

            <Info
              label="Size"
              value={`${metadata.sizeKB} KB`}
            />

            <Info
              label="Dimensions"
              value={`${metadata.width} × ${metadata.height}`}
            />

            <Info
              label="Aspect Ratio"
              value={metadata.aspectRatio}
            />

            <Info
              label="Modified"
              value={metadata.lastModified}
            />
          </div>
        </section>
      )}

      {/* -------------------------------------------------------
          Data URL
      -------------------------------------------------------- */}

      {dataURL && (
        <section className="rounded-2xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Data URL
          </h2>

          <textarea
            readOnly
            value={dataURL}
            className="min-h-56 w-full rounded-xl border p-3 font-mono text-xs"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                dataURL
              )
            }
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Copy Data URL
          </button>
        </section>
      )}

      {/* -------------------------------------------------------
          Preview
      -------------------------------------------------------- */}

      {preview && (
        <section className="rounded-2xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Preview
          </h2>

          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-muted/30 p-4">
            <img
              src={preview}
              alt={`${definition.title} preview`}
              className="max-h-[600px] max-w-full object-contain"
            />
          </div>

          {/* Normal result */}

          {result && (
            <button
              type="button"
              onClick={downloadResult}
              className="mt-5 w-full rounded-xl bg-black px-6 py-3 font-medium text-white"
            >
              Download Result
            </button>
          )}

          {/* Split results */}

          {resultFiles.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {resultFiles.map(
                (file, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      downloadSplit(
                        file,
                        index
                      )
                    }
                    className="rounded-xl border px-4 py-3 text-sm font-medium"
                  >
                    Download Part{" "}
                    {index + 1}
                  </button>
                )
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/*
 * =============================================================
 * NUMBER INPUT
 * =============================================================
 */

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border px-3 py-2"
      />
    </div>
  );
}

/*
 * =============================================================
 * TEXT INPUT
 * =============================================================
 */

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border px-3 py-2"
      />
    </div>
  );
}

/*
 * =============================================================
 * RANGE INPUT
 * =============================================================
 */

function Range({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between">
        <label className="text-sm font-medium">
          {label}
        </label>

        <span className="text-sm text-muted-foreground">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-2 w-full"
      />
    </div>
  );
}

/*
 * =============================================================
 * INFO
 * =============================================================
 */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 break-all text-sm font-medium">
        {value}
      </div>
    </div>
  );
}