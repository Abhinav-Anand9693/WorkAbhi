"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import {
  compressImage,
  compressToTargetSize,
  resizeByWidth,
  resizeByHeight,
  resizeByPercentage,
} from "@/engine/image/imageCompressionEngine";

import Image from "next/image";
import {
  addBorder,
  roundedCorners,
  sharpenCanvas,
  transformImage,
} from "@/engine/image/imageTransformEngine";

import {
  cropImage,
  circularCrop,
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
  getImageMetadata,
  imageToDataURL,
  pickColor
} from "@/engine/image/imageUtilityEngine";

import { imageTools } from "@/config/imageTools";
import type { ImageToolDefinition } from "@/types/image";

import ImageControls from "./ImageController";

interface ImageToolProps {
  toolId: string;
}

type OutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

interface ProcessingSettings {
  quality: number;

  width: number;
  height: number;
  percentage: number;

  rotate: number;
  flip: "horizontal" | "vertical";

  effectValue: number;

  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
  opacity: number;

  borderSize: number;
  borderColor: string;

  radius: number;

  text: string;
  textSize: number;
  textColor: string;

  watermarkOpacity: number;

  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

const DEFAULT_SETTINGS: ProcessingSettings = {
  quality: 80,

  width: 1200,
  height: 800,
  percentage: 50,

  rotate: 90,
  flip: "horizontal",

  effectValue: 5,

  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  exposure: 0,
  opacity: 100,

  borderSize: 10,
  borderColor: "#000000",

  radius: 30,

  text: "WorkAbhi",
  textSize: 48,
  textColor: "#ffffff",

  watermarkOpacity: 50,

  cropX: 0,
  cropY: 0,
  cropWidth: 500,
  cropHeight: 500,
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${
    units[index]
  }`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getOutputExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function getMimeTypeForTool(toolId: string): OutputFormat {
  if (toolId === "jpg-compressor") {
    return "image/jpeg";
  }

  if (toolId === "png-compressor") {
    return "image/png";
  }

  if (toolId === "webp-compressor") {
    return "image/webp";
  }

  return "image/jpeg";
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
   const image =
  document.createElement("img");

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

/**
 * Generic canvas renderer used by adjustment/effect tools.
 */
async function processCanvasImage(
  file: File,
  settings: ProcessingSettings,
  mode:
    | "brightness"
    | "contrast"
    | "saturation"
    | "hue"
    | "exposure"
    | "opacity"
    | "blur"
    | "pixelate"
    | "grayscale"
    | "black-white"
): Promise<Blob> {
  const image = await loadImageFromBlob(file);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!ctx) {
    throw new Error("Canvas is not supported by this browser.");
  }

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const data = imageData.data;

  if (mode === "blur") {
    const radius = Math.max(1, settings.effectValue);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(image, 0, 0);
    ctx.filter = "none";

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to create image."));
          } else {
            resolve(blob);
          }
        },
        "image/png"
      );
    });
  }

  if (mode === "pixelate") {
    const size = Math.max(2, settings.effectValue);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const smallCanvas = document.createElement("canvas");

    const smallWidth = Math.max(
      1,
      Math.floor(canvas.width / size)
    );

    const smallHeight = Math.max(
      1,
      Math.floor(canvas.height / size)
    );

    smallCanvas.width = smallWidth;
    smallCanvas.height = smallHeight;

    const smallCtx = smallCanvas.getContext("2d");

    if (!smallCtx) {
      throw new Error("Unable to create pixelation canvas.");
    }

    smallCtx.drawImage(
      image,
      0,
      0,
      smallWidth,
      smallHeight
    );

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      smallCanvas,
      0,
      0,
      smallWidth,
      smallHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to create image."));
          } else {
            resolve(blob);
          }
        },
        "image/png"
      );
    });
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    let a = data[i + 3];

    if (mode === "grayscale") {
      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      r = gray;
      g = gray;
      b = gray;
    }

    if (mode === "black-white") {
      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      const value = gray > 128 ? 255 : 0;

      r = value;
      g = value;
      b = value;
    }

    if (mode === "brightness") {
      const amount = settings.brightness * 2.55;

      r += amount;
      g += amount;
      b += amount;
    }

    if (mode === "contrast") {
      const factor =
        (259 * (settings.contrast + 255)) /
        (255 * (259 - settings.contrast));

      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
    }

    if (mode === "saturation") {
      const amount = settings.saturation / 100;

      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      r = gray + (r - gray) * (1 + amount);
      g = gray + (g - gray) * (1 + amount);
      b = gray + (b - gray) * (1 + amount);
    }

    if (mode === "hue") {
      const shift = settings.hue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      let h = 0;
      const delta = max - min;

      if (delta !== 0) {
        if (max === r) {
          h = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
          h = 60 * ((b - r) / delta + 2);
        } else {
          h = 60 * ((r - g) / delta + 4);
        }
      }

      if (h < 0) h += 360;

      h = (h + shift + 360) % 360;

      const s =
        max === 0
          ? 0
          : (delta / max) * 255;

      const v = max;

      const c = (s / 255) * (v / 255);
      const x =
        c *
        (1 -
          Math.abs(((h / 60) % 2) - 1));

      const m = v / 255 - c;

      let rr = 0;
      let gg = 0;
      let bb = 0;

      if (h < 60) {
        rr = c;
        gg = x;
      } else if (h < 120) {
        rr = x;
        gg = c;
      } else if (h < 180) {
        gg = c;
        bb = x;
      } else if (h < 240) {
        gg = x;
        bb = c;
      } else if (h < 300) {
        rr = x;
        bb = c;
      } else {
        rr = c;
        bb = x;
      }

      r = (rr + m) * 255;
      g = (gg + m) * 255;
      b = (bb + m) * 255;
    }

    if (mode === "exposure") {
      const factor =
        Math.pow(2, settings.exposure / 100);

      r *= factor;
      g *= factor;
      b *= factor;
    }

    if (mode === "opacity") {
      a =
        a *
        (settings.opacity / 100);
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(
      0,
      Math.min(255, g)
    );
    data[i + 2] = Math.max(
      0,
      Math.min(255, b)
    );
    data[i + 3] = Math.max(
      0,
      Math.min(255, a)
    );
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to create processed image."));
          return;
        }

        resolve(blob);
      },
      "image/png"
    );
  });
}

/**
 * Main controller
 */
export default function ImageTool({
  toolId,
}: ImageToolProps) {
  const definition = useMemo<ImageToolDefinition | undefined>(
    () =>
      imageTools.find(
        (tool) => tool.toolId === toolId
      ),
    [toolId]
  );

  const [files, setFiles] = useState<File[]>([]);

  const [originalPreview, setOriginalPreview] =
    useState<string | null>(null);

  const [resultPreview, setResultPreview] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<Blob | null>(null);

  const [resultFiles, setResultFiles] =
    useState<Blob[]>([]);

  const [settings, setSettings] =
    useState<ProcessingSettings>(
      DEFAULT_SETTINGS
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [dataUrl, setDataUrl] =
    useState("");

  const [metadata, setMetadata] =
    useState<Record<string, unknown> | null>(
      null
    );

  const [pickedColor, setPickedColor] =
    useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (originalPreview) {
        URL.revokeObjectURL(originalPreview);
      }

      if (resultPreview) {
        URL.revokeObjectURL(resultPreview);
      }
    };
  }, [originalPreview, resultPreview]);

  if (!definition) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-xl font-semibold">
          Image tool not found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The requested image tool does not exist.
        </p>
      </div>
    );
  }

  function updateSetting<K extends keyof ProcessingSettings>(
    key: K,
    value: ProcessingSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleFiles(selectedFiles: File[]) {
    if (!selectedFiles.length) return;

    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
    }

    if (resultPreview) {
      URL.revokeObjectURL(resultPreview);
    }

    setFiles(selectedFiles);
    setResult(null);
    setResultFiles([]);
    setResultPreview(null);
    setMetadata(null);
    setDataUrl("");
    setPickedColor(null);
    setError("");

    const previewUrl = URL.createObjectURL(
      selectedFiles[0]
    );

    setOriginalPreview(previewUrl);
  }

  function resetTool() {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
    }

    if (resultPreview) {
      URL.revokeObjectURL(resultPreview);
    }

    setFiles([]);
    setResult(null);
    setResultFiles([]);
    setOriginalPreview(null);
    setResultPreview(null);
    setMetadata(null);
    setDataUrl("");
    setPickedColor(null);
    setError("");
    setSettings(DEFAULT_SETTINGS);
  }

  async function processTool() {
    if (!files.length) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setDataUrl("");
    setMetadata(null);
    setResultFiles([]);

    try {
      const primaryFile = files[0];

      let output: Blob | null = null;
      let outputs: Blob[] = [];

      /*
       * ==========================================
       * COMPRESSION
       * ==========================================
       */

      if (toolId === "image-compressor") {
        output = await compressImage(
          primaryFile,
          {
            quality: settings.quality / 100,
          }
        );
      }

      else if (
        toolId === "compress-image-to-50kb" ||
        toolId === "compress-image-to-100kb" ||
        toolId === "compress-image-to-200kb" ||
        toolId === "compress-image-to-500kb" ||
        toolId === "compress-image-to-1mb"
      ) {
        const targetMap: Record<string, number> = {
          "compress-image-to-50kb": 50,
          "compress-image-to-100kb": 100,
          "compress-image-to-200kb": 200,
          "compress-image-to-500kb": 500,
          "compress-image-to-1mb": 1024,
        };

        output = await compressToTargetSize(
          primaryFile,
          {
            targetKB: targetMap[toolId],
            outputType: "image/jpeg",
          }
        );
      }

      else if (
        toolId === "jpg-compressor"
      ) {
        output = await compressImage(
          primaryFile,
          {
            quality:
              settings.quality / 100,
            outputType: "image/jpeg",
          }
        );
      }

      else if (
        toolId === "png-compressor"
      ) {
        output = await compressImage(
          primaryFile,
          {
            quality: 1,
            outputType: "image/png",
          }
        );
      }

      else if (
        toolId === "webp-compressor"
      ) {
        output = await compressImage(
          primaryFile,
          {
            quality:
              settings.quality / 100,
            outputType: "image/webp",
          }
        );
      }

      /*
       * ==========================================
       * RESIZE
       * ==========================================
       */

      else if (
        toolId === "image-resizer"
      ) {
        output = await compressImage(
          primaryFile,
          {
            quality: 0.9,
            maxWidth: settings.width,
            maxHeight: settings.height,
          }
        );
      }

      else if (
        toolId === "resize-image-by-width"
      ) {
        output = await resizeByWidth(
          primaryFile,
          settings.width
        );
      }

      else if (
        toolId === "resize-image-by-height"
      ) {
        output = await resizeByHeight(
          primaryFile,
          settings.height
        );
      }

      else if (
        toolId ===
        "resize-image-by-percentage"
      ) {
        output = await resizeByPercentage(
          primaryFile,
          settings.percentage
        );
      }

      /*
       * ==========================================
       * CROP
       * ==========================================
       */

      else if (
        toolId === "image-cropper"
      ) {
        output = await cropImage(
          primaryFile,
          {
            x: settings.cropX,
            y: settings.cropY,
            width: settings.cropWidth,
            height: settings.cropHeight,
          }
        );
      }

      else if (
        toolId ===
        "circular-image-cropper"
      ) {
        output = await circularCrop(
          primaryFile
        );
      }

      /*
       * ==========================================
       * ROTATE / FLIP
       * ==========================================
       */

      else if (
        toolId === "image-rotator"
      ) {
        output = await transformImage(
          primaryFile,
          {
            rotate: settings.rotate,
          }
        );
      }

      else if (
        toolId === "image-flipper"
      ) {
        output = await transformImage(
          primaryFile,
          {
            flip: settings.flip,
          }
        );
      }

      /*
       * ==========================================
       * EFFECTS
       * ==========================================
       */

      else if (
        toolId === "image-sharpening"
      ) {
        output = await sharpenCanvas(
          primaryFile,
          settings.effectValue
        );
      }

      else if (
        toolId === "image-blur"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "blur"
        );
      }

      else if (
        toolId === "pixelate-image"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "pixelate"
        );
      }

      else if (
        toolId === "grayscale-image"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "grayscale"
        );
      }

      else if (
        toolId === "black-and-white-image"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "black-white"
        );
      }

      /*
       * ==========================================
       * ADJUSTMENTS
       * ==========================================
       */

      else if (
        toolId === "brightness-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "brightness"
        );
      }

      else if (
        toolId === "contrast-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "contrast"
        );
      }

      else if (
        toolId === "saturation-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "saturation"
        );
      }

      else if (
        toolId === "hue-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "hue"
        );
      }

      else if (
        toolId === "exposure-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "exposure"
        );
      }

      else if (
        toolId === "opacity-adjuster"
      ) {
        output = await processCanvasImage(
          primaryFile,
          settings,
          "opacity"
        );
      }

      /*
       * ==========================================
       * BORDER / ROUNDED
       * ==========================================
       */

      else if (
        toolId ===
        "image-border-generator"
      ) {
        output = await addBorder(
          primaryFile,
          settings.borderSize,
          settings.borderColor
        );
      }

      else if (
        toolId === "rounded-corners"
      ) {
        output = await roundedCorners(
          primaryFile,
          settings.radius
        );
      }

      /*
       * ==========================================
       * TEXT / WATERMARK
       * ==========================================
       */

      else if (
        toolId === "add-text-to-image"
      ) {
        output = await addTextToImage(
          primaryFile,
          {
            text: settings.text,
            fontSize: settings.textSize,
            color: settings.textColor,
          }
        );
      }

      else if (
        toolId === "image-watermark"
      ) {
        output = await addWatermark(
          primaryFile,
          {
            text: settings.text,
            opacity:
              settings.watermarkOpacity / 100,
          }
        );
      }

      /*
       * ==========================================
       * OVERLAY
       * ==========================================
       */

      else if (
        toolId === "image-overlay"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please upload at least two images for overlay."
          );
        }

        output = await overlayImages(
          files[0],
          files[1]
        );
      }

      /*
       * ==========================================
       * COLLAGE
       * ==========================================
       */

      else if (
        toolId ===
        "image-collage-maker"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please upload at least two images for a collage."
          );
        }

        output = await createCollage(
          files
        );
      }

      /*
       * ==========================================
       * MERGE
       * ==========================================
       */

      else if (
        toolId === "image-merger"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please upload at least two images to merge."
          );
        }

        output = await mergeImages(
          files
        );
      }

      /*
       * ==========================================
       * SPLIT
       * ==========================================
       */

      else if (
        toolId === "image-splitter"
      ) {
        outputs = await splitImage(
          primaryFile
        );

        if (!outputs.length) {
          throw new Error(
            "Unable to split the image."
          );
        }

        output = outputs[0];
      }

      /*
       * ==========================================
       * METADATA
       * ==========================================
       */

      else if (
        toolId ===
        "image-metadata-viewer"
      ) {
        const info =
          await getImageMetadata(
            primaryFile
          );

        setMetadata(
          info as Record<string, unknown>
        );

        setLoading(false);
        return;
      }

      /*
       * ==========================================
       * EXIF REMOVER
       * ==========================================
       */

      else if (
        toolId === "exif-remover"
      ) {
        /*
         * Re-rendering through Canvas strips
         * embedded image metadata.
         */
        output = await compressImage(
          primaryFile,
          {
            quality: 1,
            outputType: "image/png",
          }
        );
      }

      /*
       * ==========================================
       * DATA URL
       * ==========================================
       */

      else if (
        toolId === "image-to-data-url"
      ) {
        const url =
          await imageToDataURL(
            primaryFile
          );

        setDataUrl(url);
        setLoading(false);
        return;
      }

      /*
       * ==========================================
       * COLOR PICKER
       * ==========================================
       */

      else if (
        toolId === "image-color-picker"
      ) {
        /*
         * Color picker is handled from
         * the preview click interaction.
         */
        setError(
          "Click on the image preview to pick a color."
        );

        setLoading(false);
        return;
      }

      else {
        throw new Error(
          `Processing is not implemented for ${toolId}.`
        );
      }

      if (!output) {
        throw new Error(
          "No result was generated."
        );
      }

      setResult(output);
      setResultFiles(
        outputs.length ? outputs : [output]
      );

      if (resultPreview) {
        URL.revokeObjectURL(
          resultPreview
        );
      }

      const previewUrl =
        URL.createObjectURL(output);

      setResultPreview(
        previewUrl
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while processing the image."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!result) return;

    const extension =
      getOutputExtension(
        result.type
      );

    downloadBlob(
      result,
      `workabhi-${toolId}.${extension}`
    );
  }

  function downloadAllResults() {
    resultFiles.forEach(
      (blob, index) => {
        const extension =
          getOutputExtension(
            blob.type
          );

        downloadBlob(
          blob,
          `workabhi-${toolId}-${index + 1}.${extension}`
        );
      }
    );
  }

async function handlePreviewClick(
  event: React.MouseEvent<HTMLImageElement>
) {
  if (
    toolId !== "image-color-picker" ||
    !files[0]
  ) {
    return;
  }

  try {
    const image = event.currentTarget;
    const rect =
      image.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) /
        rect.width) *
      image.naturalWidth;

    const y =
      ((event.clientY - rect.top) /
        rect.height) *
      image.naturalHeight;

    const color =
      await pickColor(
        files[0],
        x,
        y
      );

    setPickedColor(color.hex);
    setError("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to pick color."
    );
  }
}

  const isMultiple =
    definition.multiple ||
    toolId === "image-overlay" ||
    toolId === "image-collage-maker" ||
    toolId === "image-merger";

  const needsQuality =
    toolId === "image-compressor" ||
    toolId === "jpg-compressor" ||
    toolId === "webp-compressor";

  const needsWidth =
    toolId === "image-resizer" ||
    toolId === "resize-image-by-width";

  const needsHeight =
    toolId === "image-resizer" ||
    toolId === "resize-image-by-height";

  const needsPercentage =
    toolId ===
    "resize-image-by-percentage";

  const needsEffect =
    toolId === "image-sharpening" ||
    toolId === "image-blur" ||
    toolId === "pixelate-image";

  const needsAdjustment =
    toolId === "brightness-adjuster" ||
    toolId === "contrast-adjuster" ||
    toolId === "saturation-adjuster" ||
    toolId === "hue-adjuster" ||
    toolId === "exposure-adjuster" ||
    toolId === "opacity-adjuster";

  return (
    <div className="space-y-6">
      {/* =====================================
          UPLOADER
      ====================================== */}

      <ImageUploader
        multiple={isMultiple}
        disabled={loading}
        onFilesSelected={handleFiles}
      />

      {/* =====================================
          FILE INFO
      ====================================== */}

      {files.length > 0 && (
        <div className="rounded-2xl border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {files.length === 1
                  ? files[0].name
                  : `${files.length} images selected`}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {files.length === 1
                  ? formatBytes(
                      files[0].size
                    )
                  : files
                      .map(
                        (file) =>
                          formatBytes(
                            file.size
                          )
                      )
                      .join(" • ")}
              </p>
            </div>

            <button
              type="button"
              onClick={resetTool}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Change Image
            </button>
          </div>
        </div>
      )}

      {/* =====================================
          CONTROLS
      ====================================== */}

     <ImageControls
  definition={definition}

  quality={settings.quality}
  setQuality={(value: number) =>
    updateSetting("quality", value)
  }

  width={settings.width}
  setWidth={(value: number) =>
    updateSetting("width", value)
  }

  height={settings.height}
  setHeight={(value: number) =>
    updateSetting("height", value)
  }

  percentage={settings.percentage}
  setPercentage={(value: number) =>
    updateSetting("percentage", value)
  }

  rotate={settings.rotate}
  setRotate={(value: number) =>
    updateSetting("rotate", value)
  }

  flip={settings.flip}
  setFlip={(
    value: "horizontal" | "vertical"
  ) => updateSetting("flip", value)}

  effectValue={settings.effectValue}
  setEffectValue={(value: number) =>
    updateSetting(
      "effectValue",
      value
    )
  }

  brightness={settings.brightness}
  setBrightness={(value: number) =>
    updateSetting(
      "brightness",
      value
    )
  }

  contrast={settings.contrast}
  setContrast={(value: number) =>
    updateSetting(
      "contrast",
      value
    )
  }

  saturation={settings.saturation}
  setSaturation={(value: number) =>
    updateSetting(
      "saturation",
      value
    )
  }

  hue={settings.hue}
  setHue={(value: number) =>
    updateSetting("hue", value)
  }

  exposure={settings.exposure}
  setExposure={(value: number) =>
    updateSetting(
      "exposure",
      value
    )
  }

  opacity={settings.opacity}
  setOpacity={(value: number) =>
    updateSetting(
      "opacity",
      value
    )
  }

  borderSize={settings.borderSize}
  setBorderSize={(value: number) =>
    updateSetting(
      "borderSize",
      value
    )
  }

  borderColor={settings.borderColor}
  setBorderColor={(value: string) =>
    updateSetting(
      "borderColor",
      value
    )
  }

  radius={settings.radius}
  setRadius={(value: number) =>
    updateSetting("radius", value)
  }

  text={settings.text}
  setText={(value: string) =>
    updateSetting("text", value)
  }

  textSize={settings.textSize}
  setTextSize={(value: number) =>
    updateSetting(
      "textSize",
      value
    )
  }

  textColor={settings.textColor}
  setTextColor={(value: string) =>
    updateSetting(
      "textColor",
      value
    )
  }

  watermarkOpacity={
    settings.watermarkOpacity
  }
  setWatermarkOpacity={(value: number) =>
    updateSetting(
      "watermarkOpacity",
      value
    )
  }

  cropX={settings.cropX}
  setCropX={(value: number) =>
    updateSetting("cropX", value)
  }

  cropY={settings.cropY}
  setCropY={(value: number) =>
    updateSetting("cropY", value)
  }

  cropWidth={settings.cropWidth}
  setCropWidth={(value: number) =>
    updateSetting(
      "cropWidth",
      value
    )
  }

  cropHeight={settings.cropHeight}
  setCropHeight={(value: number) =>
    updateSetting(
      "cropHeight",
      value
    )
  }

  onProcess={processTool}
  loading={loading}
/>
      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* =====================================
          COLOR PICKER RESULT
      ====================================== */}

      {toolId ===
        "image-color-picker" &&
        originalPreview && (
          <div className="rounded-2xl border bg-background p-6">
            <p className="mb-3 text-sm font-medium">
              Click anywhere on the image
              to pick a color.
            </p>

            <Image
              src={originalPreview}
              alt="Color picker"
              onClick={
                handlePreviewClick
              }
              className="max-h-[600px] w-full cursor-crosshair rounded-xl object-contain"
            />

            {pickedColor && (
              <div className="mt-5 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg border"
                  style={{
                    backgroundColor:
                      pickedColor,
                  }}
                />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Selected color
                  </p>

                  <p className="font-mono font-semibold">
                    {pickedColor}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* =====================================
          DATA URL
      ====================================== */}

      {dataUrl && (
        <div className="rounded-2xl border bg-background p-6">
          <h3 className="font-semibold">
            Image Data URL
          </h3>

          <textarea
            value={dataUrl}
            readOnly
            className="mt-4 min-h-[220px] w-full rounded-xl border bg-muted/30 p-4 font-mono text-xs"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                dataUrl
              )
            }
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Copy Data URL
          </button>
        </div>
      )}

      {/* =====================================
          METADATA
      ====================================== */}

      {metadata && (
        <div className="rounded-2xl border bg-background p-6">
          <h3 className="font-semibold">
            Image Metadata
          </h3>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(
                  metadata
                ).map(
                  ([key, value]) => (
                    <tr
                      key={key}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-3 font-medium">
                        {key}
                      </td>

                      <td className="px-3 py-3 text-muted-foreground">
                        {String(
                          value
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================
          IMAGE PREVIEW
      ====================================== */}

     {files.length > 0 &&
        toolId !== "image-color-picker" &&
        toolId !== "image-metadata-viewer" &&
        toolId !== "image-to-data-url" && (
          <ImagePreview
            originalPreview={originalPreview}
            resultPreview={resultPreview}
            originalName={files[0]?.name}
            originalSize={files[0]?.size}
            resultSize={result?.size}
            result={result}
            loading={loading}
            onDownload={downloadResult}
            onReset={resetTool}
          />
        )}


      {/* =====================================
          SPLIT RESULTS
      ====================================== */}

      {toolId ===
        "image-splitter" &&
        resultFiles.length > 1 && (
          <div className="rounded-2xl border bg-background p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  Split Images
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {resultFiles.length} images
                  generated
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadAllResults
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Download All
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resultFiles.map(
                (blob, index) => {
                  const url =
                    URL.createObjectURL(
                      blob
                    );

                  return (
                    <div
                      key={index}
                      className="overflow-hidden rounded-xl border"
                    >
                      <Image
                        src={url}
                        alt={`Split ${index + 1}`}
                        className="aspect-square w-full object-contain bg-muted/20"
                        onLoad={() =>
                          URL.revokeObjectURL(
                            url
                          )
                        }
                      />

                      <div className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            downloadBlob(
                              blob,
                              `workabhi-split-${
                                index + 1
                              }.${getOutputExtension(
                                blob.type
                              )}`
                            )
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
    </div>
  );
}