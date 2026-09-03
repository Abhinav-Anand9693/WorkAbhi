export type ImageToolMode =
  | "compress"
  | "resize"
  | "crop"
  | "transform"
  | "adjust"
  | "effect"
  | "border"
  | "watermark"
  | "text"
  | "overlay"
  | "collage"
  | "split"
  | "merge"
  | "color-picker"
  | "metadata"
  | "data-url";

export type ImageOutputFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface ImageToolDefinition {
  toolId: string;
  title: string;
  description: string;
  mode: ImageToolMode;
  multiple?: boolean;
  outputFormat?: ImageOutputFormat;
  targetKB?: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageTransformOptions {
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface ImageAdjustOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  exposure?: number;
  opacity?: number;
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
  blackAndWhite?: boolean;
  pixelate?: number;
}

export interface ImageBorderOptions {
  size: number;
  color: string;
}

export interface TextOverlayOptions {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
}

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  position:
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";
}