import type { ImageToolDefinition } from "@/types/image";

export const imageTools: ImageToolDefinition[] = [
  {
    toolId: "image-compressor",
    title: "Image Compressor",
    description: "Compress images and reduce their file size.",
    mode: "compress",
  },

  {
    toolId: "image-resizer",
    title: "Image Resizer",
    description: "Resize images to custom dimensions.",
    mode: "resize",
  },

  {
    toolId: "resize-image-by-width",
    title: "Resize Image by Width",
    description: "Resize an image using a custom width.",
    mode: "resize",
  },

  {
    toolId: "resize-image-by-height",
    title: "Resize Image by Height",
    description: "Resize an image using a custom height.",
    mode: "resize",
  },

  {
    toolId: "resize-image-by-percentage",
    title: "Resize Image by Percentage",
    description: "Resize an image by percentage.",
    mode: "resize",
  },

  {
    toolId: "compress-image-to-50kb",
    title: "Compress Image to 50KB",
    description: "Compress an image to approximately 50KB.",
    mode: "compress",
    targetKB: 50,
  },

  {
    toolId: "compress-image-to-100kb",
    title: "Compress Image to 100KB",
    description: "Compress an image to approximately 100KB.",
    mode: "compress",
    targetKB: 100,
  },

  {
    toolId: "compress-image-to-200kb",
    title: "Compress Image to 200KB",
    description: "Compress an image to approximately 200KB.",
    mode: "compress",
    targetKB: 200,
  },

  {
    toolId: "compress-image-to-500kb",
    title: "Compress Image to 500KB",
    description: "Compress an image to approximately 500KB.",
    mode: "compress",
    targetKB: 500,
  },

  {
    toolId: "compress-image-to-1mb",
    title: "Compress Image to 1MB",
    description: "Compress an image to approximately 1MB.",
    mode: "compress",
    targetKB: 1024,
  },

  {
    toolId: "jpg-compressor",
    title: "JPG Compressor",
    description: "Compress JPG images.",
    mode: "compress",
    outputFormat: "image/jpeg",
  },

  {
    toolId: "png-compressor",
    title: "PNG Compressor",
    description: "Compress PNG images.",
    mode: "compress",
    outputFormat: "image/png",
  },

  {
    toolId: "webp-compressor",
    title: "WEBP Compressor",
    description: "Compress WEBP images.",
    mode: "compress",
    outputFormat: "image/webp",
  },

  {
    toolId: "image-cropper",
    title: "Image Cropper",
    description: "Crop an image to custom dimensions.",
    mode: "crop",
  },

  {
    toolId: "circular-image-cropper",
    title: "Circular Image Cropper",
    description: "Crop an image into a circle.",
    mode: "crop",
  },

  {
    toolId: "image-rotator",
    title: "Image Rotator",
    description: "Rotate images by 90, 180 or 270 degrees.",
    mode: "transform",
  },

  {
    toolId: "image-flipper",
    title: "Image Flipper",
    description: "Flip images horizontally or vertically.",
    mode: "transform",
  },

  {
    toolId: "image-sharpening",
    title: "Image Sharpening",
    description: "Sharpen an image.",
    mode: "effect",
  },

  {
    toolId: "image-blur",
    title: "Image Blur",
    description: "Blur an image.",
    mode: "effect",
  },

  {
    toolId: "pixelate-image",
    title: "Pixelate Image",
    description: "Apply a pixelation effect.",
    mode: "effect",
  },

  {
    toolId: "grayscale-image",
    title: "Grayscale Image",
    description: "Convert an image to grayscale.",
    mode: "effect",
  },

  {
    toolId: "black-and-white-image",
    title: "Black & White Image",
    description: "Convert an image to black and white.",
    mode: "effect",
  },

  {
    toolId: "brightness-adjuster",
    title: "Brightness Adjuster",
    description: "Adjust image brightness.",
    mode: "adjust",
  },

  {
    toolId: "contrast-adjuster",
    title: "Contrast Adjuster",
    description: "Adjust image contrast.",
    mode: "adjust",
  },

  {
    toolId: "saturation-adjuster",
    title: "Saturation Adjuster",
    description: "Adjust image saturation.",
    mode: "adjust",
  },

  {
    toolId: "hue-adjuster",
    title: "Hue Adjuster",
    description: "Adjust image hue.",
    mode: "adjust",
  },

  {
    toolId: "exposure-adjuster",
    title: "Exposure Adjuster",
    description: "Adjust image exposure.",
    mode: "adjust",
  },

  {
    toolId: "opacity-adjuster",
    title: "Opacity Adjuster",
    description: "Adjust image opacity.",
    mode: "adjust",
    outputFormat: "image/png",
  },

  {
    toolId: "image-border-generator",
    title: "Image Border Generator",
    description: "Add a custom border to an image.",
    mode: "border",
  },

  {
    toolId: "rounded-corners",
    title: "Rounded Corners",
    description: "Create an image with rounded corners.",
    mode: "border",
  },

  {
    toolId: "image-watermark",
    title: "Image Watermark",
    description: "Add a watermark to an image.",
    mode: "watermark",
  },

  {
    toolId: "add-text-to-image",
    title: "Add Text to Image",
    description: "Add custom text to an image.",
    mode: "text",
  },

  {
    toolId: "image-overlay",
    title: "Image Overlay",
    description: "Overlay one image on another.",
    mode: "overlay",
    multiple: true,
  },

  {
    toolId: "image-collage-maker",
    title: "Image Collage Maker",
    description: "Create a collage from multiple images.",
    mode: "collage",
    multiple: true,
  },

  {
    toolId: "image-splitter",
    title: "Image Splitter",
    description: "Split an image into multiple sections.",
    mode: "split",
  },

  {
    toolId: "image-merger",
    title: "Image Merger",
    description: "Merge multiple images into one image.",
    mode: "merge",
    multiple: true,
  },

  {
    toolId: "image-color-picker",
    title: "Image Color Picker",
    description: "Pick colors from an image.",
    mode: "color-picker",
  },

  {
    toolId: "image-metadata-viewer",
    title: "Image Metadata Viewer",
    description: "View image file metadata and dimensions.",
    mode: "metadata",
  },

  {
    toolId: "exif-remover",
    title: "EXIF Remover",
    description: "Remove image metadata by recreating the image.",
    mode: "metadata",
  },

  {
    toolId: "image-to-data-url",
    title: "Image to Data URL",
    description: "Convert an image into a Data URL.",
    mode: "data-url",
  },
];