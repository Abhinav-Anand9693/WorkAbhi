"use client";

import type {
  ImageToolDefinition,
} from "@/types/image";

interface ImageControlsProps {
  definition: ImageToolDefinition;

  quality: number;
  setQuality: (value: number) => void;

  width: string;
  setWidth: (value: string) => void;

  height: string;
  setHeight: (value: string) => void;

  percentage: string;
  setPercentage: (value: string) => void;

  rotation: string;
  setRotation: (value: string) => void;

  flipDirection:
    | "horizontal"
    | "vertical";
  setFlipDirection: (
    value:
      | "horizontal"
      | "vertical"
  ) => void;

  effectValue: number;
  setEffectValue: (value: number) => void;

  brightness: number;
  setBrightness: (value: number) => void;

  contrast: number;
  setContrast: (value: number) => void;

  saturation: number;
  setSaturation: (value: number) => void;

  hue: number;
  setHue: (value: number) => void;

  exposure: number;
  setExposure: (value: number) => void;

  opacity: number;
  setOpacity: (value: number) => void;

  borderSize: number;
  setBorderSize: (value: number) => void;

  borderColor: string;
  setBorderColor: (value: string) => void;

  radius: number;
  setRadius: (value: number) => void;

  text: string;
  setText: (value: string) => void;

  textSize: number;
  setTextSize: (value: number) => void;

  textColor: string;
  setTextColor: (value: string) => void;

  watermarkOpacity: number;
  setWatermarkOpacity: (
    value: number
  ) => void;

  cropX: string;
  setCropX: (value: string) => void;

  cropY: string;
  setCropY: (value: string) => void;

  cropWidth: string;
  setCropWidth: (value: string) => void;

  cropHeight: string;
  setCropHeight: (value: string) => void;

  onProcess: () => void;
  loading?: boolean;
  error?: string;
}

export default function ImageControls(
  props: ImageControlsProps
) {
  const {
    definition,

    quality,
    setQuality,

    width,
    setWidth,

    height,
    setHeight,

    percentage,
    setPercentage,

    rotation,
    setRotation,

    flipDirection,
    setFlipDirection,

    effectValue,
    setEffectValue,

    brightness,
    setBrightness,

    contrast,
    setContrast,

    saturation,
    setSaturation,

    hue,
    setHue,

    exposure,
    setExposure,

    opacity,
    setOpacity,

    borderSize,
    setBorderSize,

    borderColor,
    setBorderColor,

    radius,
    setRadius,

    text,
    setText,

    textSize,
    setTextSize,

    textColor,
    setTextColor,

    watermarkOpacity,
    setWatermarkOpacity,

    cropX,
    setCropX,

    cropY,
    setCropY,

    cropWidth,
    setCropWidth,

    cropHeight,
    setCropHeight,

    onProcess,
    loading,
    error,
  } = props;

  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          {definition.title} Settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Adjust the settings and process your image.
        </p>
      </div>

      <div className="space-y-5">
        {definition.mode ===
          "compress" && (
          <RangeControl
            label="Quality"
            value={quality}
            min={10}
            max={100}
            suffix="%"
            onChange={setQuality}
          />
        )}

        {definition.mode ===
          "resize" && (
          <>
            {definition.toolId !==
              "resize-image-by-height" &&
              definition.toolId !==
                "resize-image-by-percentage" && (
                <NumberControl
                  label="Width"
                  value={width}
                  placeholder="e.g. 1200"
                  onChange={
                    setWidth
                  }
                />
              )}

            {definition.toolId !==
              "resize-image-by-width" &&
              definition.toolId !==
                "resize-image-by-percentage" && (
                <NumberControl
                  label="Height"
                  value={height}
                  placeholder="e.g. 800"
                  onChange={
                    setHeight
                  }
                />
              )}

            {definition.toolId ===
              "image-resizer" && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                Enter width and/or height.
                The image will be resized while
                preserving the requested dimensions.
              </div>
            )}

            {definition.toolId ===
              "resize-image-by-percentage" && (
              <NumberControl
                label="Resize Percentage"
                value={percentage}
                placeholder="e.g. 50"
                onChange={
                  setPercentage
                }
              />
            )}
          </>
        )}

        {definition.mode ===
          "crop" &&
          definition.toolId !==
            "circular-image-cropper" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberControl
                label="X"
                value={cropX}
                onChange={
                  setCropX
                }
              />

              <NumberControl
                label="Y"
                value={cropY}
                onChange={
                  setCropY
                }
              />

              <NumberControl
                label="Width"
                value={cropWidth}
                placeholder="Crop width"
                onChange={
                  setCropWidth
                }
              />

              <NumberControl
                label="Height"
                value={cropHeight}
                placeholder="Crop height"
                onChange={
                  setCropHeight
                }
              />
            </div>
          )}

        {definition.toolId ===
          "circular-image-cropper" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            The tool automatically creates a
            centered circular crop using the
            largest possible square area.
          </div>
        )}

        {definition.toolId ===
          "image-rotator" && (
          <SelectControl
            label="Rotation"
            value={rotation}
            onChange={setRotation}
            options={[
              {
                label: "90°",
                value: "90",
              },
              {
                label: "180°",
                value: "180",
              },
              {
                label: "270°",
                value: "270",
              },
            ]}
          />
        )}

        {definition.toolId ===
          "image-flipper" && (
          <SelectControl
            label="Flip Direction"
            value={flipDirection}
            onChange={(value) =>
              setFlipDirection(
                value as
                  | "horizontal"
                  | "vertical"
              )
            }
            options={[
              {
                label: "Horizontal",
                value: "horizontal",
              },
              {
                label: "Vertical",
                value: "vertical",
              },
            ]}
          />
        )}

        {definition.mode ===
          "effect" && (
          <RangeControl
            label="Effect Strength"
            value={effectValue}
            min={2}
            max={30}
            onChange={
              setEffectValue
            }
          />
        )}

        {definition.toolId ===
          "brightness-adjuster" && (
          <RangeControl
            label="Brightness"
            value={brightness}
            min={0}
            max={200}
            onChange={
              setBrightness
            }
          />
        )}

        {definition.toolId ===
          "contrast-adjuster" && (
          <RangeControl
            label="Contrast"
            value={contrast}
            min={0}
            max={200}
            onChange={
              setContrast
            }
          />
        )}

        {definition.toolId ===
          "saturation-adjuster" && (
          <RangeControl
            label="Saturation"
            value={saturation}
            min={0}
            max={200}
            onChange={
              setSaturation
            }
          />
        )}

        {definition.toolId ===
          "hue-adjuster" && (
          <RangeControl
            label="Hue"
            value={hue}
            min={-180}
            max={180}
            suffix="°"
            onChange={setHue}
          />
        )}

        {definition.toolId ===
          "exposure-adjuster" && (
          <RangeControl
            label="Exposure"
            value={exposure}
            min={-3}
            max={3}
            step={1}
            onChange={
              setExposure
            }
          />
        )}

        {definition.toolId ===
          "opacity-adjuster" && (
          <RangeControl
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            suffix="%"
            onChange={
              setOpacity
            }
          />
        )}

        {definition.toolId ===
          "image-border-generator" && (
          <>
            <NumberControl
              label="Border Size"
              value={String(
                borderSize
              )}
              onChange={(value) =>
                setBorderSize(
                  Number(value)
                )
              }
            />

            <ColorControl
              label="Border Color"
              value={borderColor}
              onChange={
                setBorderColor
              }
            />
          </>
        )}

        {definition.toolId ===
          "rounded-corners" && (
          <RangeControl
            label="Corner Radius"
            value={radius}
            min={0}
            max={300}
            onChange={setRadius}
          />
        )}

        {(definition.toolId ===
          "image-watermark" ||
          definition.toolId ===
            "add-text-to-image") && (
          <>
            <TextControl
              label="Text"
              value={text}
              placeholder="Enter text"
              onChange={setText}
            />

            <NumberControl
              label="Font Size"
              value={String(
                textSize
              )}
              onChange={(value) =>
                setTextSize(
                  Number(value)
                )
              }
            />

            <ColorControl
              label="Text Color"
              value={textColor}
              onChange={
                setTextColor
              }
            />
          </>
        )}

        {definition.toolId ===
          "image-watermark" && (
          <RangeControl
            label="Watermark Opacity"
            value={Math.round(
              watermarkOpacity *
                100
            )}
            min={10}
            max={100}
            suffix="%"
            onChange={(value) =>
              setWatermarkOpacity(
                value / 100
              )
            }
          />
        )}

        {(definition.toolId ===
          "image-overlay" ||
          definition.toolId ===
            "image-collage-maker" ||
          definition.toolId ===
            "image-merger") && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Select multiple images above,
            then click Process Image.
          </div>
        )}

        {definition.toolId ===
          "image-splitter" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            The image will be split into
            multiple sections.
          </div>
        )}

        {definition.toolId ===
          "image-color-picker" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Color picking interaction will
            be available on the image preview.
          </div>
        )}

        {definition.toolId ===
          "image-metadata-viewer" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Click Process Image to inspect
            the selected image.
          </div>
        )}

        {definition.toolId ===
          "exif-remover" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            The image will be recreated in
            the browser to remove embedded
            metadata.
          </div>
        )}

        {definition.toolId ===
          "image-to-data-url" && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Convert your image into a Data URL
            without uploading it.
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onProcess}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : definition.mode ===
              "metadata"
            ? "Read Image"
            : definition.mode ===
                "data-url"
              ? "Generate Data URL"
              : "Process Image"}
      </button>
    </section>
  );
}

function NumberControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}

function TextControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
        </label>

        <span className="text-sm text-muted-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-3 w-full"
      />
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5"
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
      </label>

      <div className="mt-2 flex gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-10 w-14 cursor-pointer rounded-lg border p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm"
        />
      </div>
    </div>
  );
}