export type PdfToolId =
  | "merge-pdf"
  | "split-pdf"
  | "rotate-pdf"
  | "delete-pdf-pages"
  | "extract-pdf-pages"
  | "reorder-pdf-pages"
  | "duplicate-pdf-pages"
  | "reverse-pdf-pages"
  | "pdf-page-numbering"
  | "pdf-page-organizer"
  | "pdf-viewer"
  | "pdf-metadata-viewer"
  | "remove-pdf-metadata"
  | "pdf-watermark"
  | "pdf-stamp"
  | "add-text-to-pdf"
  | "add-image-to-pdf"
  | "add-signature-to-pdf"
  | "pdf-highlight-tool"
  | "pdf-drawing-tool"
  | "pdf-annotation-tool"
  | "pdf-whiteout-tool"
  | "pdf-form-filler"
  | "pdf-checkbox-filler"
  | "pdf-radio-button-filler"
  | "pdf-flatten-tool"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "webp-to-pdf"
  | "bmp-to-pdf"
  | "tiff-to-pdf"
  | "images-to-pdf"
  | "text-to-pdf"
  | "pdf-to-jpg"
  | "pdf-to-png"
  | "pdf-to-webp"
  | "pdf-to-images"
  | "pdf-pages-to-images"
  | "pdf-password-generator"
  | "pdf-hash-generator"
  | "pdf-file-integrity-checker"
  | "pdf-metadata-cleaner"
  | "pdf-privacy-cleaner"
  | "pdf-security-checker";

export interface PdfPageSelection {
  index: number;
  rotation?: 0 | 90 | 180 | 270;
}

export interface PdfProcessOptions {
  pages?: number[];
  rotate?: 0 | 90 | 180 | 270;
  pageOrder?: number[];
  duplicatePage?: number;
  duplicatePosition?: number;
  pageGroups?: number[][];
  formFieldValues?: Record<string, string | boolean>;
  text?: string;
  watermarkText?: string;
  stampText?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  opacity?: number;
  color?: string;
  pageNumberStart?: number;
  pageNumberPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  imageBytes?: Uint8Array;
  imageMimeType?: string;
  imagePosition?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  imageScale?: number;
  imageOpacity?: number;
  imageMargin?: number;
  imageX?: number;
  imageY?: number;
  imageKeepAspectRatio?: boolean;
  signatureBytes?: Uint8Array;
  drawing?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  whiteout?: { x: number; y: number; width: number; height: number };
  formValues?: Record<string, string | boolean>;
  passwordLength?: number;
  hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512";
  renderScale?: number;
  pageIndices?: number[];
}

export interface PdfOutput {
  blob?: Blob;
  filename?: string;
  mimeType?: string;
  size?: number;
  text?: string;
  metadata?: Record<string, unknown>;
  images?: Array<{ blob: Blob; filename: string; pageIndex: number }>;
  outputs?: PdfOutput[];
}

export interface PdfProgress {
  progress: number;
  message: string;
}

export class PdfEngineError extends Error {
  readonly code:
    | "INVALID_INPUT"
    | "EMPTY_FILE"
    | "NOT_PDF"
    | "CORRUPT_PDF"
    | "ENCRYPTED_PDF"
    | "UNSUPPORTED"
    | "TOO_LARGE"
    | "PAGE_RANGE"
    | "MEMORY_RISK"
    | "CANCELLED"
    | "INVALID_OPTIONS"
    | "BROWSER_UNSUPPORTED";

  constructor(
    code: PdfEngineError["code"],
    message: string,
  ) {
    super(message);
    this.name = "PdfEngineError";
    this.code = code;
  }
}
