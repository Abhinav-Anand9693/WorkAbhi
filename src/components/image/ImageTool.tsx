"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";

import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import ImageControls from "./ImageController";
import SplitResults from "./SplitResults";

import {
  compressImage,
  compressToTargetSize,
  resizeByWidth,
  resizeByHeight,
  resizeByPercentage,
} from "@/engine/image/imageCompressionEngine";

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
  pickColor,
} from "@/engine/image/imageUtilityEngine";

import { imageTools } from "@/config/imageTools";
import type { ImageToolDefinition } from "@/types/image";

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

function downloadBlob(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function getOutputExtension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";

  return "jpg";
}

function loadImageFromBlob(
  blob: Blob
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);

    const image = document.createElement("img");

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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: OutputFormat
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error("Unable to create processed image.")
          );
          return;
        }

        resolve(blob);
      },
      type,
      type === "image/png"
        ? undefined
        : 0.92
    );
  });
}

/**
 * Generic canvas image processor
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
    throw new Error(
      "Canvas is not supported by this browser."
    );
  }

  if (mode === "blur") {
    const radius = Math.max(
      1,
      Math.round(settings.effectValue)
    );

    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(image, 0, 0);
    ctx.filter = "none";

    return canvasToBlob(canvas, "image/png");
  }

  if (mode === "pixelate") {
    const size = Math.max(
      2,
      Math.round(settings.effectValue)
    );

    const smallCanvas =
      document.createElement("canvas");

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

    const smallCtx =
      smallCanvas.getContext("2d");

    if (!smallCtx) {
      throw new Error(
        "Unable to create pixelation canvas."
      );
    }

    smallCtx.imageSmoothingEnabled = false;

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

    return canvasToBlob(canvas, "image/png");
  }

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const data = imageData.data;

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {
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

      const value =
        gray > 128 ? 255 : 0;

      r = value;
      g = value;
      b = value;
    }

    if (mode === "brightness") {
      const amount =
        settings.brightness * 2.55;

      r += amount;
      g += amount;
      b += amount;
    }

    if (mode === "contrast") {
      const factor =
        (259 *
          (settings.contrast + 255)) /
        (255 *
          (259 - settings.contrast));

      r =
        factor * (r - 128) + 128;

      g =
        factor * (g - 128) + 128;

      b =
        factor * (b - 128) + 128;
    }

    if (mode === "saturation") {
      const amount =
        settings.saturation / 100;

      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      r =
        gray +
        (r - gray) * (1 + amount);

      g =
        gray +
        (g - gray) * (1 + amount);

      b =
        gray +
        (b - gray) * (1 + amount);
    }

    if (mode === "hue") {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      const delta = max - min;

      let h = 0;

      if (delta !== 0) {
        if (max === r) {
          h =
            60 *
            (((g - b) / delta) % 6);
        } else if (max === g) {
          h =
            60 *
            ((b - r) / delta + 2);
        } else {
          h =
            60 *
            ((r - g) / delta + 4);
        }
      }

      if (h < 0) {
        h += 360;
      }

      h =
        (h + settings.hue + 360) %
        360;

      const s =
        max === 0
          ? 0
          : delta / max;

      const v = max / 255;

      const c = s * v;

      const x =
        c *
        (1 -
          Math.abs(
            ((h / 60) % 2) - 1
          ));

      const m = v - c;

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
      const factor = Math.pow(
        2,
        settings.exposure / 100
      );

      r *= factor;
      g *= factor;
      b *= factor;
    }

    if (mode === "opacity") {
      a *= settings.opacity / 100;
    }

    data[i] = Math.max(
      0,
      Math.min(255, r)
    );

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

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvasToBlob(
    canvas,
    "image/png"
  );
}

async function createSafePreviewUrl(file: File): Promise<string> {
  const MAX_PREVIEW_DIMENSION = 1600;

  if (typeof createImageBitmap !== "function") {
    return URL.createObjectURL(file);
  }

  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: MAX_PREVIEW_DIMENSION,
      resizeQuality: "high",
      imageOrientation: "from-image",
    });

    const scale = Math.min(
      1,
      MAX_PREVIEW_DIMENSION / bitmap.width,
      MAX_PREVIEW_DIMENSION / bitmap.height
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return URL.createObjectURL(file);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const previewBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    canvas.width = 1;
    canvas.height = 1;

    if (!previewBlob) {
      return URL.createObjectURL(file);
    }

    return URL.createObjectURL(previewBlob);
  } catch {
    return URL.createObjectURL(file);
  }
}

export default function ImageTool({
  toolId,
}: ImageToolProps) {
  const definition =
    useMemo<ImageToolDefinition | undefined>(
      () =>
        imageTools.find(
          (tool) =>
            tool.toolId === toolId
        ),
      [toolId]
    );

  const [files, setFiles] =
    useState<File[]>([]);

  const [
    originalPreview,
    setOriginalPreview,
  ] = useState<string | null>(null);

  const [
    resultPreview,
    setResultPreview,
  ] = useState<string | null>(null);

  const [result, setResult] =
    useState<Blob | null>(null);

  const [
    resultFiles,
    setResultFiles,
  ] = useState<Blob[]>([]);

  const [settings, setSettings] =
    useState<ProcessingSettings>(
      DEFAULT_SETTINGS
    );

  const [loading, setLoading] =
    useState(false);
    
    const [processingStage, setProcessingStage] =
  useState<
    | "idle"
    | "reading"
    | "optimizing-resolution"
    | "compressing"
    | "finalizing"
    | "complete"
  >("idle");

const abortControllerRef =
  useRef<AbortController | null>(null);
  const [error, setError] =
    useState("");

  const [dataUrl, setDataUrl] =
    useState("");

  const [metadata, setMetadata] =
    useState<Record<
      string,
      unknown
    > | null>(null);

  const [pickedColor, setPickedColor] =
    useState<string | null>(null);

  /**
   * Cleanup URLs only when component
   * is finally unmounted.
   */
  useEffect(() => {
  return () => {
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
  };
}, [originalPreview, resultPreview]);

  /**
   * Tool not found.
   */
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
  function cancelProcessing() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setProcessingStage("idle");
    setError("Processing cancelled.");
  }


  function updateSetting<
    K extends keyof ProcessingSettings
  >(
    key: K,
    value: ProcessingSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /**
   * Determine whether this tool supports
   * multiple images.
   */
  const isMultiple =
    definition.multiple === true ||
    toolId === "image-overlay" ||
    toolId === "image-collage-maker" ||
    toolId === "image-merger";

  const maxFiles =
    toolId === "image-merger"
      ? 20
      : toolId === "image-collage-maker"
        ? 12
        : toolId === "image-overlay"
          ? 2
          : 1;

  /**
   * Handle file selection.
   *
   * IMPORTANT:
   * For multiple-image tools we APPEND
   * new files instead of replacing them.
   */
  async function handleFiles(
    selectedFiles: File[]
  ) {
    if (!selectedFiles.length) {
      return;
    }

    let nextFiles: File[];

    if (isMultiple) {
      const combined = [
        ...files,
        ...selectedFiles,
      ];

      const uniqueFiles =
        combined.filter(
          (file, index, array) =>
            array.findIndex(
              (candidate) =>
                candidate.name ===
                  file.name &&
                candidate.size ===
                  file.size &&
                candidate.lastModified ===
                  file.lastModified
            ) === index
        );

      nextFiles =
        uniqueFiles.slice(
          0,
          maxFiles
        );
    } else {
      nextFiles = [
        selectedFiles[0],
      ];
    }

    /**
     * If the first image changed,
     * recreate the original preview.
     */
    if (
      !files.length ||
      nextFiles[0] !== files[0]
    ) {
      if (originalPreview) {
        URL.revokeObjectURL(
          originalPreview
        );
      }

      const previewUrl =
        await createSafePreviewUrl(
          nextFiles[0]
        );

      setOriginalPreview(
        previewUrl
      );
    }

    if (resultPreview) {
      URL.revokeObjectURL(
        resultPreview
      );
    }

    setFiles(nextFiles);

    setResult(null);
    setResultFiles([]);
    setResultPreview(null);

    setMetadata(null);
    setDataUrl("");
    setPickedColor(null);

    setError("");
  }

  /**
   * Reset everything.
   */
  function resetTool() {
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

    setFiles([]);

    setResult(null);
    setResultFiles([]);

    setOriginalPreview(null);
    setResultPreview(null);

    setMetadata(null);
    setDataUrl("");
    setPickedColor(null);

    setError("");

    setSettings({
      ...DEFAULT_SETTINGS,
    });
  }

  /**
   * Main processing function.
   */
  async function processTool() {
    if (!files.length) {
      setError(
        "Please upload an image first."
      );

      return;
    }
     const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    setLoading(true);
    setError("");
    setProcessingStage("reading");

    setDataUrl("");
    setMetadata(null);
    setResultFiles([]);

    try {
      const primaryFile =
        files[0];

      let output:
        | Blob
        | null = null;

      let outputs: Blob[] = [];

      /*
       * ========================================
       * COMPRESSION
       * ========================================
       */

      if (
        toolId ===
        "image-compressor"
      ) {
        output =
          await compressImage(
            primaryFile,
            {
              quality:
                settings.quality / 100,
            }
          );
      }

      else if (
        toolId ===
          "compress-image-to-50kb" ||
        toolId ===
          "compress-image-to-100kb" ||
        toolId ===
          "compress-image-to-200kb" ||
        toolId ===
          "compress-image-to-500kb" ||
        toolId ===
          "compress-image-to-1mb"
      ) {
        const targetMap:
          Record<string, number> =
          {
            "compress-image-to-50kb":
              50,

            "compress-image-to-100kb":
              100,

            "compress-image-to-200kb":
              200,

            "compress-image-to-500kb":
              500,

            "compress-image-to-1mb":
              1024,
          };

                output = await compressToTargetSize(
          primaryFile,
          {
            targetKB: targetMap[toolId],
            outputType: "image/jpeg",
            signal: controller.signal,
            onProgress: setProcessingStage,
          }
        );
      }

      else if (
        toolId ===
        "jpg-compressor"
      ) {
        output = await compressImage(
  primaryFile,
  {
    quality:
      settings.quality / 100,
    outputType: "image/jpeg",
    signal: controller.signal,
    onProgress: setProcessingStage,
  }
);
      }

      else if (
        toolId ===
        "png-compressor"
      ) {
        output =
          await compressImage(
            primaryFile,
            {
              quality: 1,

              outputType:
                "image/png",
            }
          );
      }

      else if (
        toolId ===
        "webp-compressor"
      ) {
                output = await compressImage(
            primaryFile,
            {
              quality:
                settings.quality / 100,
              outputType: "image/webp",
              signal: controller.signal,
              onProgress: setProcessingStage,
            }
          );
      }

      /*
       * ========================================
       * RESIZE
       * ========================================
       */

      else if (
        toolId ===
        "image-resizer"
      ) {
        output =
          await compressImage(
            primaryFile,
            {
              quality: 0.9,
              maxWidth:
                settings.width,
              maxHeight:
                settings.height,
            }
          );
      }

      else if (
        toolId ===
        "resize-image-by-width"
      ) {
        output =
          await resizeByWidth(
            primaryFile,
            settings.width
          );
      }

      else if (
        toolId ===
        "resize-image-by-height"
      ) {
        output =
          await resizeByHeight(
            primaryFile,
            settings.height
          );
      }

      else if (
        toolId ===
        "resize-image-by-percentage"
      ) {
        output =
          await resizeByPercentage(
            primaryFile,
            settings.percentage
          );
      }

      /*
       * ========================================
       * CROP
       * ========================================
       */

      else if (
        toolId ===
        "image-cropper"
      ) {
        output =
          await cropImage(
            primaryFile,
            {
              x: settings.cropX,
              y: settings.cropY,
              width:
                settings.cropWidth,
              height:
                settings.cropHeight,
            }
          );
      }

      else if (
        toolId ===
        "circular-image-cropper"
      ) {
        output =
          await circularCrop(
            primaryFile
          );
      }

      /*
       * ========================================
       * ROTATE / FLIP
       * ========================================
       */

      else if (
        toolId ===
        "image-rotator"
      ) {
        output =
          await transformImage(
            primaryFile,
            {
              rotate:
                settings.rotate,
            }
          );
      }

      else if (
        toolId ===
        "image-flipper"
      ) {
        output =
          await transformImage(
            primaryFile,
            {
              flip:
                settings.flip,
            }
          );
      }

      /*
       * ========================================
       * EFFECTS
       * ========================================
       */

      else if (
        toolId ===
        "image-sharpening"
      ) {
        output =
          await sharpenCanvas(
            primaryFile,
            settings.effectValue
          );
      }

      else if (
        toolId ===
        "image-blur"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "blur"
          );
      }

      else if (
        toolId ===
        "pixelate-image"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "pixelate"
          );
      }

      else if (
        toolId ===
        "grayscale-image"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "grayscale"
          );
      }

      else if (
        toolId ===
        "black-and-white-image"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "black-white"
          );
      }

      /*
       * ========================================
       * ADJUSTMENTS
       * ========================================
       */

      else if (
        toolId ===
        "brightness-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "brightness"
          );
      }

      else if (
        toolId ===
        "contrast-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "contrast"
          );
      }

      else if (
        toolId ===
        "saturation-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "saturation"
          );
      }

      else if (
        toolId ===
        "hue-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "hue"
          );
      }

      else if (
        toolId ===
        "exposure-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "exposure"
          );
      }

      else if (
        toolId ===
        "opacity-adjuster"
      ) {
        output =
          await processCanvasImage(
            primaryFile,
            settings,
            "opacity"
          );
      }

      /*
       * ========================================
       * BORDER
       * ========================================
       */

      else if (
        toolId ===
        "image-border-generator"
      ) {
        output =
          await addBorder(
            primaryFile,
            settings.borderSize,
            settings.borderColor
          );
      }

      else if (
        toolId ===
        "rounded-corners"
      ) {
        output =
          await roundedCorners(
            primaryFile,
            settings.radius
          );
      }

      /*
       * ========================================
       * TEXT / WATERMARK
       * ========================================
       */

      else if (
        toolId ===
        "add-text-to-image"
      ) {
        output =
          await addTextToImage(
            primaryFile,
            {
              text: settings.text,
              fontSize:
                settings.textSize,
              color:
                settings.textColor,
            }
          );
      }

      else if (
        toolId ===
        "image-watermark"
      ) {
        output =
          await addWatermark(
            primaryFile,
            {
              text: settings.text,
              opacity:
                settings.watermarkOpacity /
                100,
            }
          );
      }

      /*
       * ========================================
       * OVERLAY
       * ========================================
       */

      else if (
        toolId ===
        "image-overlay"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please add 2 images for overlay."
          );
        }

        output =
          await overlayImages(
            files[0],
            files[1]
          );
      }

      /*
       * ========================================
       * COLLAGE
       * ========================================
       */

      else if (
        toolId ===
        "image-collage-maker"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please add at least 2 images for the collage."
          );
        }

        output =
          await createCollage(
            files
          );
      }

      /*
       * ========================================
       * MERGE
       * ========================================
       */

      else if (
        toolId ===
        "image-merger"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Please add at least 2 images to merge."
          );
        }

        output =
          await mergeImages(
            files
          );
      }

      /*
       * ========================================
       * SPLITTER
       * ========================================
       */

      else if (
        toolId ===
        "image-splitter"
      ) {
        outputs =
          await splitImage(
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
       * ========================================
       * METADATA VIEWER
       * ========================================
       */

      else if (
        toolId ===
        "image-metadata-viewer"
      ) {
        const info =
          await getImageMetadata(
            primaryFile
          );

        if (
          !info ||
          Object.keys(info).length === 0
        ) {
          setMetadata({
            Message:
              "No readable metadata found in this image.",
          });
        } else {
          setMetadata(
            info as Record<
              string,
              unknown
            >
          );
        }

        return;
      }

      /*
       * ========================================
       * EXIF REMOVER
       * ========================================
       */

      else if (
        toolId ===
        "exif-remover"
      ) {
        /**
         * Drawing the image onto a fresh
         * canvas removes embedded EXIF/
         * metadata from the exported file.
         */
        output =
          await compressImage(
            primaryFile,
            {
              quality: 1,
              outputType:
                "image/png",
            }
          );
      }

      /*
       * ========================================
       * IMAGE -> DATA URL
       * ========================================
       */

      else if (
        toolId ===
        "image-to-data-url"
      ) {
        const url =
          await imageToDataURL(
            primaryFile
          );

        setDataUrl(url);

        /**
         * Data URL is a representation of
         * the original image, so use the
         * original file as the result.
         */
        setResult(
          primaryFile
        );

        setResultFiles([
          primaryFile,
        ]);

        if (resultPreview) {
          URL.revokeObjectURL(
            resultPreview
          );
        }

        const previewUrl =
          URL.createObjectURL(
            primaryFile
          );

        setResultPreview(
          previewUrl
        );

        return;
      }

      /*
       * ========================================
       * COLOR PICKER
       * ========================================
       *
       * No processing is required here.
       * User picks the color by clicking
       * directly on the image.
       */

      else if (
        toolId ===
        "image-color-picker"
      ) {
        return;
      }

      else {
        throw new Error(
          `Processing is not implemented for ${toolId}.`
        );
      }

      if (controller.signal.aborted) {
        throw new DOMException("Processing cancelled.", "AbortError");
      }

      if (!output) {
        throw new Error(
          "No result was generated."
        );
      }

      setResult(output);

      setResultFiles(
        outputs.length
          ? outputs
          : [output]
      );

      if (resultPreview) {
        URL.revokeObjectURL(
          resultPreview
        );
      }

      const previewUrl =
        URL.createObjectURL(
          output
        );

      setResultPreview(
        previewUrl
      );
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        setError("Processing cancelled.");
        return;
      }

      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while processing the image."
      );
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setProcessingStage("idle");
    }
  }

  /**
   * Download main result.
   */
  function downloadResult() {
    if (!result) {
      return;
    }

    const extension =
      getOutputExtension(
        result.type
      );

    downloadBlob(
      result,
      `workabhi-${toolId}.${extension}`
    );
  }

  /**
   * Download all split results.
   */
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

  /**
   * Color picker.
   */
  async function handlePreviewClick(
    event: React.MouseEvent<HTMLImageElement>
  ) {
    if (
      toolId !==
        "image-color-picker" ||
      !files[0]
    ) {
      return;
    }

    try {
      const image =
        event.currentTarget;

      const rect =
        image.getBoundingClientRect();

      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        throw new Error(
          "Unable to read the image."
        );
      }

      const x = Math.max(
        0,
        Math.min(
          image.naturalWidth - 1,
          Math.round(
            ((event.clientX -
              rect.left) /
              rect.width) *
              image.naturalWidth
          )
        )
      );

      const y = Math.max(
        0,
        Math.min(
          image.naturalHeight - 1,
          Math.round(
            ((event.clientY -
              rect.top) /
              rect.height) *
              image.naturalHeight
          )
        )
      );

      const color =
        await pickColor(
          files[0],
          x,
          y
        );

      setPickedColor(
        color.hex
      );

      setError("");
    } catch (err) {
      console.error(
        "Color picker error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to pick color."
      );
    }
  }

  const needsQuality =
    toolId ===
      "image-compressor" ||
    toolId ===
      "jpg-compressor" ||
    toolId ===
      "webp-compressor";

  const needsWidth =
    toolId ===
      "image-resizer" ||
    toolId ===
      "resize-image-by-width";

  const needsHeight =
    toolId ===
      "image-resizer" ||
    toolId ===
      "resize-image-by-height";

  const needsPercentage =
    toolId ===
    "resize-image-by-percentage";

  const needsEffect =
    toolId ===
      "image-sharpening" ||
    toolId ===
      "image-blur" ||
    toolId ===
      "pixelate-image";

  const needsAdjustment =
    toolId ===
      "brightness-adjuster" ||
    toolId ===
      "contrast-adjuster" ||
    toolId ===
      "saturation-adjuster" ||
    toolId ===
      "hue-adjuster" ||
    toolId ===
      "exposure-adjuster" ||
    toolId ===
      "opacity-adjuster";

  return (
    <div className="space-y-6">

      {/* ========================================
          UPLOADER
      ======================================== */}

      <ImageUploader
        multiple={isMultiple}
        selectedCount={files.length}
        maxFiles={maxFiles}
        disabled={loading}
        onFilesSelected={
          handleFiles
        }
      />

      {/* ========================================
          MULTIPLE FILE INFORMATION
      ======================================== */}

      {isMultiple &&
        files.length > 0 && (
          <div className="rounded-2xl border bg-background p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {files.length} image
                  {files.length === 1
                    ? ""
                    : "s"}{" "}
                  selected
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Maximum {maxFiles} images
                  can be used.
                </p>
              </div>

              <button
                type="button"
                onClick={resetTool}
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Clear Images
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {files.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <p className="truncate text-sm font-medium">
                      {index + 1}.{" "}
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBytes(
                        file.size
                      )}
                    </p>
                  </div>
                )
              )}
            </div>

            {files.length <
              maxFiles && (
              <p className="mt-4 text-sm text-muted-foreground">
                Need more? Click the upload
                area above to add more images.
              </p>
            )}
          </div>
        )}

      {/* ========================================
          SINGLE FILE INFO
      ======================================== */}

      {!isMultiple &&
        files.length > 0 && (
          <div className="rounded-2xl border bg-background p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {files[0].name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBytes(
                    files[0].size
                  )}
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

      {/* ========================================
          MULTIPLE IMAGE REQUIREMENT
      ======================================== */}

      {toolId ===
        "image-overlay" &&
        files.length === 1 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
            <strong>Add one more image.</strong>{" "}
            Overlay requires 2 images.
          </div>
        )}

      {toolId ===
        "image-collage-maker" &&
        files.length === 1 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
            <strong>Add at least one more image.</strong>{" "}
            Collage requires 2 or more images.
          </div>
        )}

      {toolId ===
        "image-merger" &&
        files.length === 1 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
            <strong>Add at least one more image.</strong>{" "}
            Merge requires 2 or more images.
          </div>
        )}

      {/* ========================================
          CONTROLS
      ======================================== */}

      <ImageControls
        definition={definition}

        quality={settings.quality}
        setQuality={(value: number) =>
          updateSetting(
            "quality",
            value
          )
        }

        width={settings.width}
        setWidth={(value: number) =>
          updateSetting(
            "width",
            value
          )
        }

        height={settings.height}
        setHeight={(value: number) =>
          updateSetting(
            "height",
            value
          )
        }

        percentage={
          settings.percentage
        }
        setPercentage={(value: number) =>
          updateSetting(
            "percentage",
            value
          )
        }

        rotate={settings.rotate}
        setRotate={(value: number) =>
          updateSetting(
            "rotate",
            value
          )
        }

        flip={settings.flip}
        setFlip={(
          value:
            | "horizontal"
            | "vertical"
        ) =>
          updateSetting(
            "flip",
            value
          )
        }

        effectValue={
          settings.effectValue
        }
        setEffectValue={(value: number) =>
          updateSetting(
            "effectValue",
            value
          )
        }

        brightness={
          settings.brightness
        }
        setBrightness={(value: number) =>
          updateSetting(
            "brightness",
            value
          )
        }

        contrast={
          settings.contrast
        }
        setContrast={(value: number) =>
          updateSetting(
            "contrast",
            value
          )
        }

        saturation={
          settings.saturation
        }
        setSaturation={(value: number) =>
          updateSetting(
            "saturation",
            value
          )
        }

        hue={settings.hue}
        setHue={(value: number) =>
          updateSetting(
            "hue",
            value
          )
        }

        exposure={
          settings.exposure
        }
        setExposure={(value: number) =>
          updateSetting(
            "exposure",
            value
          )
        }

        opacity={
          settings.opacity
        }
        setOpacity={(value: number) =>
          updateSetting(
            "opacity",
            value
          )
        }

        borderSize={
          settings.borderSize
        }
        setBorderSize={(value: number) =>
          updateSetting(
            "borderSize",
            value
          )
        }

        borderColor={
          settings.borderColor
        }
        setBorderColor={(value: string) =>
          updateSetting(
            "borderColor",
            value
          )
        }

        radius={settings.radius}
        setRadius={(value: number) =>
          updateSetting(
            "radius",
            value
          )
        }

        text={settings.text}
        setText={(value: string) =>
          updateSetting(
            "text",
            value
          )
        }

        textSize={
          settings.textSize
        }
        setTextSize={(value: number) =>
          updateSetting(
            "textSize",
            value
          )
        }

        textColor={
          settings.textColor
        }
        setTextColor={(value: string) =>
          updateSetting(
            "textColor",
            value
          )
        }

        watermarkOpacity={
          settings.watermarkOpacity
        }
        setWatermarkOpacity={(
          value: number
        ) =>
          updateSetting(
            "watermarkOpacity",
            value
          )
        }

        cropX={settings.cropX}
        setCropX={(value: number) =>
          updateSetting(
            "cropX",
            value
          )
        }

        cropY={settings.cropY}
        setCropY={(value: number) =>
          updateSetting(
            "cropY",
            value
          )
        }

        cropWidth={
          settings.cropWidth
        }
        setCropWidth={(value: number) =>
          updateSetting(
            "cropWidth",
            value
          )
        }

        cropHeight={
          settings.cropHeight
        }
        setCropHeight={(value: number) =>
          updateSetting(
            "cropHeight",
            value
          )
        }

        onProcess={processTool}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={processTool}
          disabled={loading || !files.length}
          className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Process Image"}
        </button>

        {loading && (
          <button
            type="button"
            onClick={cancelProcessing}
            className="rounded-xl border border-destructive/30 px-6 py-3 font-medium text-destructive hover:bg-destructive/5"
          >
            Cancel
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-5 rounded-xl border bg-muted/20 p-4">
          <p className="text-sm font-medium">
            {processingStage === "reading" && "Reading image..."}
            {processingStage === "optimizing-resolution" && "Optimizing resolution..."}
            {processingStage === "compressing" && "Finding optimal quality..."}
            {processingStage === "finalizing" && "Finalizing result..."}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Your image is being processed locally in your browser.
          </p>
        </div>
      )}
      

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ========================================
          COLOR PICKER
      ======================================== */}

      {toolId ===
        "image-color-picker" &&
        originalPreview && (
          <section className="rounded-2xl border bg-background p-6">
            <p className="mb-4 text-sm font-medium">
              Click anywhere on the image to
              pick a color.
            </p>

            <div className="overflow-hidden rounded-xl border bg-muted/10">
                            <Image
                src={originalPreview}
                alt="Color picker image"
                width={1600}
                height={1200}
                unoptimized
                onClick={handlePreviewClick}
                draggable={false}
                className="block max-h-[650px] w-full cursor-crosshair object-contain"
              />
                          </div>

            {pickedColor && (
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className="h-16 w-16 rounded-lg border"
                  style={{
                    backgroundColor:
                      pickedColor,
                  }}
                />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Selected color
                  </p>

                  <p className="font-mono text-lg font-semibold">
                    {pickedColor}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

      {/* ========================================
          DATA URL
      ======================================== */}

      {dataUrl && (
        <section className="rounded-2xl border bg-background p-6">
          <h3 className="font-semibold">
            Image Data URL
          </h3>

          <textarea
            value={dataUrl}
            readOnly
            className="mt-4 min-h-[220px] w-full rounded-xl border bg-muted/30 p-4 font-mono text-xs"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    dataUrl
                  );

                  setError("");
                } catch {
                  setError(
                    "Unable to copy Data URL."
                  );
                }
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Copy Data URL
            </button>

            {result && (
              <button
                type="button"
                onClick={
                  downloadResult
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Download Image
              </button>
            )}
          </div>
        </section>
      )}

      {/* ========================================
          METADATA
      ======================================== */}

      {metadata && (
        <section className="rounded-2xl border bg-background p-6">
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
                        {formatMetadataValue(
                          value
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================
          NORMAL IMAGE PREVIEW
      ======================================== */}

      {files.length > 0 &&
        toolId !==
          "image-color-picker" &&
        toolId !==
          "image-metadata-viewer" && (
          <ImagePreview
            originalPreview={
              originalPreview
            }
            resultPreview={
              resultPreview
            }
            originalName={
              files[0]?.name
            }
            originalSize={
              files[0]?.size
            }
            resultSize={
              result?.size
            }
            result={result}
            loading={loading}
            onDownload={
              downloadResult
            }
            onReset={
              resetTool
            }
          />
        )}

      {/* ========================================
          SPLIT RESULTS
      ======================================== */}

      {toolId === "image-splitter" &&
        resultFiles.length > 1 && (
          <SplitResults
            files={resultFiles}
            onDownload={(blob, index) =>
              downloadBlob(
                blob,
                `workabhi-split-${index + 1}.${getOutputExtension(blob.type)}`
              )
            }
            onDownloadAll={downloadAllResults}
          />
        )}
    </div>
  );
}

function formatMetadataValue(
  value: unknown
): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "—";
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}