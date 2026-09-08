"use client";

import type { ImageToolDefinition } from "@/types/image";

interface Props {
  definition: ImageToolDefinition;

  quality: number;
  setQuality: (value: number) => void;

  width: number;
  setWidth: (value: number) => void;

  height: number;
  setHeight: (value: number) => void;

  percentage: number;
  setPercentage: (value: number) => void;

  rotate: number;
  setRotate: (value: number) => void;

  flip: "horizontal" | "vertical";
  setFlip: (value: "horizontal" | "vertical") => void;

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
  setWatermarkOpacity: (value: number) => void;

  cropX: number;
  setCropX: (value: number) => void;

  cropY: number;
  setCropY: (value: number) => void;

  cropWidth: number;
  setCropWidth: (value: number) => void;

  cropHeight: number;
  setCropHeight: (value: number) => void;

  onProcess: () => void;
  loading?: boolean;
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="w-full rounded-xl border bg-background px-3 py-2.5"
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm font-medium">
          {label}
        </span>

        <span className="text-sm text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="w-full"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">
        {label}
      </span>

      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-14 rounded-lg border"
        />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="flex-1 rounded-xl border bg-background px-3 py-2"
        />
      </div>
    </label>
  );
}

export default function ImageControls({
  definition,

  quality,
  setQuality,

  width,
  setWidth,

  height,
  setHeight,

  percentage,
  setPercentage,

  rotate,
  setRotate,

  flip,
  setFlip,

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
  loading = false,
}: Props) {
  const id = definition.toolId;

  const targetSizes: Record<string, string> = {
    "compress-image-to-50kb": "50 KB",
    "compress-image-to-100kb": "100 KB",
    "compress-image-to-200kb": "200 KB",
    "compress-image-to-500kb": "500 KB",
    "compress-image-to-1mb": "1 MB",
  };

  const isTargetCompression =
    id in targetSizes;

  const isQualityTool =
    id === "image-compressor" ||
    id === "jpg-compressor" ||
    id === "webp-compressor";

  return (
    <section className="rounded-2xl border bg-background p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          {definition.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {definition.description}
        </p>
      </div>

      {isTargetCompression && (
        <div className="mb-6 rounded-xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Target file size
          </p>

          <p className="mt-1 text-2xl font-bold">
            {targetSizes[id]}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            The browser will automatically adjust
            quality and dimensions.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {isQualityTool && (
          <RangeField
            label="Image Quality"
            value={quality}
            min={5}
            max={100}
            suffix="%"
            onChange={setQuality}
          />
        )}

        {id === "image-resizer" && (
          <>
            <NumberField
              label="Maximum Width"
              value={width}
              min={1}
              onChange={setWidth}
            />

            <NumberField
              label="Maximum Height"
              value={height}
              min={1}
              onChange={setHeight}
            />
          </>
        )}

        {id === "resize-image-by-width" && (
          <NumberField
            label="Width"
            value={width}
            min={1}
            onChange={setWidth}
          />
        )}

        {id === "resize-image-by-height" && (
          <NumberField
            label="Height"
            value={height}
            min={1}
            onChange={setHeight}
          />
        )}

        {id === "resize-image-by-percentage" && (
          <RangeField
            label="Percentage"
            value={percentage}
            min={1}
            max={300}
            suffix="%"
            onChange={setPercentage}
          />
        )}

        {id === "image-rotator" && (
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Rotation
            </span>

            <select
              value={rotate}
              onChange={(event) =>
                setRotate(
                  Number(event.target.value)
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5"
            >
              <option value={90}>90°</option>
              <option value={180}>180°</option>
              <option value={270}>270°</option>
            </select>
          </label>
        )}

        {id === "image-flipper" && (
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Flip Direction
            </span>

            <select
              value={flip}
              onChange={(event) =>
                setFlip(
                  event.target.value as
                    | "horizontal"
                    | "vertical"
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5"
            >
              <option value="horizontal">
                Horizontal
              </option>

              <option value="vertical">
                Vertical
              </option>
            </select>
          </label>
        )}

        {id === "image-sharpening" && (
          <RangeField
            label="Sharpness"
            value={effectValue}
            min={1}
            max={30}
            onChange={setEffectValue}
          />
        )}

        {id === "image-blur" && (
          <RangeField
            label="Blur"
            value={effectValue}
            min={1}
            max={30}
            onChange={setEffectValue}
          />
        )}

        {id === "pixelate-image" && (
          <RangeField
            label="Pixel Size"
            value={effectValue}
            min={2}
            max={30}
            onChange={setEffectValue}
          />
        )}

        {id === "brightness-adjuster" && (
          <RangeField
            label="Brightness"
            value={brightness}
            min={-100}
            max={100}
            onChange={setBrightness}
          />
        )}

        {id === "contrast-adjuster" && (
          <RangeField
            label="Contrast"
            value={contrast}
            min={-100}
            max={100}
            onChange={setContrast}
          />
        )}

        {id === "saturation-adjuster" && (
          <RangeField
            label="Saturation"
            value={saturation}
            min={-100}
            max={100}
            onChange={setSaturation}
          />
        )}

        {id === "hue-adjuster" && (
          <RangeField
            label="Hue"
            value={hue}
            min={-180}
            max={180}
            suffix="°"
            onChange={setHue}
          />
        )}

        {id === "exposure-adjuster" && (
          <RangeField
            label="Exposure"
            value={exposure}
            min={-100}
            max={100}
            onChange={setExposure}
          />
        )}

        {id === "opacity-adjuster" && (
          <RangeField
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            suffix="%"
            onChange={setOpacity}
          />
        )}

        {id === "image-border-generator" && (
          <>
            <NumberField
              label="Border Size"
              value={borderSize}
              min={1}
              max={300}
              onChange={setBorderSize}
            />

            <ColorField
              label="Border Color"
              value={borderColor}
              onChange={setBorderColor}
            />
          </>
        )}

        {id === "rounded-corners" && (
          <RangeField
            label="Corner Radius"
            value={radius}
            min={0}
            max={500}
            suffix="px"
            onChange={setRadius}
          />
        )}

        {id === "add-text-to-image" && (
          <>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">
                Text
              </span>

              <input
                type="text"
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                className="w-full rounded-xl border bg-background px-3 py-2.5"
                placeholder="Enter text"
              />
            </label>

            <NumberField
              label="Text Size"
              value={textSize}
              min={8}
              max={500}
              onChange={setTextSize}
            />

            <ColorField
              label="Text Color"
              value={textColor}
              onChange={setTextColor}
            />
          </>
        )}

        {id === "image-watermark" && (
          <>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">
                Watermark Text
              </span>

              <input
                type="text"
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                className="w-full rounded-xl border bg-background px-3 py-2.5"
              />
            </label>

            <RangeField
              label="Watermark Opacity"
              value={watermarkOpacity}
              min={5}
              max={100}
              suffix="%"
              onChange={setWatermarkOpacity}
            />
          </>
        )}

        {id === "image-cropper" && (
          <>
            <NumberField
              label="X"
              value={cropX}
              min={0}
              onChange={setCropX}
            />

            <NumberField
              label="Y"
              value={cropY}
              min={0}
              onChange={setCropY}
            />

            <NumberField
              label="Width"
              value={cropWidth}
              min={1}
              onChange={setCropWidth}
            />

            <NumberField
              label="Height"
              value={cropHeight}
              min={1}
              onChange={setCropHeight}
            />
          </>
        )}
      </div>

      {!(
        id === "image-color-picker" ||
        id === "image-metadata-viewer" ||
        id === "image-to-data-url"
      ) && (
        <button
          type="button"
          onClick={onProcess}
          disabled={loading}
          className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : "Process Image"}
        </button>
      )}
    </section>
  );
}