import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFPage,
} from "pdf-lib";
import type {
  PdfOutput,
  PdfProcessOptions,
  PdfProgress,
  PdfToolId,
} from "@/engine/pdf/pdfTypes";
import { PdfEngineError } from "@/engine/pdf/pdfTypes"

const MAX_INPUT_BYTES = 256 * 1024 * 1024;
const MAX_PAGES = 500;
const MAX_RENDER_PIXELS = 24_000_000;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new PdfEngineError("BROWSER_UNSUPPORTED", "PDF processing is available in the browser only.");
  }
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new PdfEngineError("CANCELLED", "PDF processing was cancelled.");
  }
}

function report(progress: PdfProgress["progress"], message: string, onProgress?: (p: PdfProgress) => void) {
  onProgress?.({ progress: Math.max(0, Math.min(1, progress)), message });
}

function sanitizeName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "workabhi";
}

function ensurePdfFile(file: File) {
  if (!file || file.size <= 0) {
    throw new PdfEngineError("EMPTY_FILE", "The selected PDF is empty.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new PdfEngineError("TOO_LARGE", "This PDF is too large for safe browser processing. Try a smaller file.");
  }
  const looksPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!looksPdf) {
    throw new PdfEngineError("NOT_PDF", "Please select a valid PDF file.");
  }
}

async function loadPdf(file: File, signal?: AbortSignal): Promise<PDFDocument> {
  assertNotAborted(signal);
  ensurePdfFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  assertNotAborted(signal);
  const header = new TextDecoder().decode(bytes.slice(0, 8));
  if (!header.startsWith("%PDF-")) throw new PdfEngineError("NOT_PDF", "The selected file does not contain a valid PDF header.");
  try {
    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
    const pages = pdf.getPageCount();
    if (pages <= 0) throw new PdfEngineError("CORRUPT_PDF", "The PDF contains no pages.");
    if (pages > MAX_PAGES) {
      throw new PdfEngineError("MEMORY_RISK", `This PDF has ${pages} pages. Browser processing is limited to ${MAX_PAGES} pages at a time.`);
    }
    return pdf;
  } catch (error) {
    if (error instanceof PdfEngineError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (/encrypt|password|encrypted/i.test(message)) {
      throw new PdfEngineError("ENCRYPTED_PDF", "This PDF is password-protected or encrypted and cannot be modified by the current browser library.");
    }
    throw new PdfEngineError("CORRUPT_PDF", "The PDF could not be opened. It may be corrupt, malformed, or use unsupported features.");
  }
}

function bytesToBlob(bytes: Uint8Array) {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

async function savePdf(pdf: PDFDocument, filename: string, signal?: AbortSignal): Promise<PdfOutput> {
  assertNotAborted(signal);
  const bytes = await pdf.save({ useObjectStreams: true });
  assertNotAborted(signal);
  const blob = bytesToBlob(bytes);
  return {
    blob,
    filename: sanitizeName(filename),
    mimeType: "application/pdf",
    size: blob.size,
  };
}

function parsePageNumbers(value: string, pageCount: number): number[] {
  const result: number[] = [];
  const parts = value.split(",").map((x) => x.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part) - 1;
      if (n < 0 || n >= pageCount) throw new PdfEngineError("PAGE_RANGE", `Page ${part} is outside the PDF page range.`);
      result.push(n);
    } else if (/^\d+\s*-\s*\d+$/.test(part)) {
      const [aRaw, bRaw] = part.split("-").map((x) => Number(x.trim()));
      const a = Math.min(aRaw, bRaw) - 1;
      const b = Math.max(aRaw, bRaw) - 1;
      if (a < 0 || b >= pageCount) throw new PdfEngineError("PAGE_RANGE", "One or more page ranges are outside the PDF.");
      for (let i = a; i <= b; i++) result.push(i);
    } else {
      throw new PdfEngineError("PAGE_RANGE", `Invalid page selection: ${part}`);
    }
  }
  return [...new Set(result)];
}

function hexColor(value = "#ef4444") {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return rgb(0.94, 0.27, 0.27);
  const n = Number.parseInt(match[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function pagePoint(page: PDFPage, x: number, y: number) {
  const { height } = page.getSize();
  return { x, y: height - y };
}

function pageForIndex(pdf: PDFDocument, index: number) {
  const page = pdf.getPage(index);
  if (!page) throw new PdfEngineError("PAGE_RANGE", `Page ${index + 1} does not exist.`);
  return page;
}

async function makePdfFromImage(file: File, signal?: AbortSignal, onProgress?: (p: PdfProgress) => void) {
  assertNotAborted(signal);
  if (file.size > MAX_INPUT_BYTES) throw new PdfEngineError("TOO_LARGE", "The image is too large for safe browser processing.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFDocument.create();
  let image;
  const mime = file.type.toLowerCase();
  if (mime === "image/jpeg" || /\.jpe?g$/i.test(file.name)) {
    image = await pdf.embedJpg(bytes);
  } else if (mime === "image/png" || /\.png$/i.test(file.name)) {
    image = await pdf.embedPng(bytes);
  } else if (mime === "image/webp" || /\.webp$/i.test(file.name) || mime === "image/bmp" || /\.bmp$/i.test(file.name)) {
    image = await imageFileToPngBytes(file);
    image = await pdf.embedPng(image);
  } else if (mime === "image/tiff" || /\.tiff?$/i.test(file.name)) {
    throw new PdfEngineError("UNSUPPORTED", "TIFF to PDF requires a browser TIFF decoder; the current dependency stack does not provide one safely.");
  } else {
    throw new PdfEngineError("UNSUPPORTED", "Unsupported image format.");
  }
  const dims = image.scale(1);
  const pageWidth = 595.28, pageHeight = 841.89, margin = 36;
  const fit = Math.min((pageWidth - margin * 2) / dims.width, (pageHeight - margin * 2) / dims.height, 1);
  const width = dims.width * fit, height = dims.height * fit;
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
  report(1, "PDF created", onProgress);
  return savePdf(pdf, `${file.name.replace(/\.[^.]+$/, "")}.pdf`);
}

async function imageFileToPngBytes(file: File): Promise<Uint8Array> {
  assertBrowser();
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PdfEngineError("BROWSER_UNSUPPORTED", "Canvas is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new PdfEngineError("UNSUPPORTED", "The browser could not decode this image.");
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

async function imagesToPdf(files: File[], signal?: AbortSignal, onProgress?: (p: PdfProgress) => void) {
  if (!files.length) throw new PdfEngineError("INVALID_INPUT", "Select at least one image.");
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (files.some((file) => file.size > MAX_INPUT_BYTES) || totalBytes > MAX_INPUT_BYTES) throw new PdfEngineError("TOO_LARGE", "The selected images exceed the safe browser processing limit of 256 MB combined.");
  const pdf = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    assertNotAborted(signal);
    const file = files[i];
    if (file.size <= 0) throw new PdfEngineError("EMPTY_FILE", `${file.name} is empty.`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    let image;
    const mime = file.type.toLowerCase();
    if (mime === "image/jpeg" || /\.jpe?g$/i.test(file.name)) image = await pdf.embedJpg(bytes);
    else if (mime === "image/png" || /\.png$/i.test(file.name)) image = await pdf.embedPng(bytes);
    else if (mime === "image/webp" || /\.webp$/i.test(file.name) || mime === "image/bmp" || /\.bmp$/i.test(file.name)) image = await pdf.embedPng(await imageFileToPngBytes(file));
    else if (mime === "image/tiff" || /\.tiff?$/i.test(file.name)) throw new PdfEngineError("UNSUPPORTED", `TIFF is not supported by the current browser image decoder: ${file.name}`);
    else throw new PdfEngineError("UNSUPPORTED", `Unsupported image format: ${file.name}`);
    const dims = image.scale(1);
    const pageWidth = 595.28, pageHeight = 841.89, margin = 36;
    const fit = Math.min((pageWidth - margin * 2) / dims.width, (pageHeight - margin * 2) / dims.height, 1);
    const width = dims.width * fit, height = dims.height * fit;
    pdf.addPage([pageWidth, pageHeight]).drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    report((i + 1) / files.length, `Added ${file.name}`, onProgress);
  }
  return savePdf(pdf, "images-to-pdf.pdf");
}

async function copySelectedPages(
  source: PDFDocument,
  indices: number[],
  signal?: AbortSignal,
  onProgress?: (p: PdfProgress) => void,
) {
  if (!indices.length) throw new PdfEngineError("INVALID_OPTIONS", "Select at least one page.");
  const unique = [...new Set(indices)];
  const count = source.getPageCount();
  if (unique.some((index) => !Number.isInteger(index) || index < 0 || index >= count)) throw new PdfEngineError("PAGE_RANGE", "One or more selected pages are outside the PDF page range.");
  const out = await PDFDocument.create();
  const pages = await out.copyPages(source, unique);
  for (let i = 0; i < pages.length; i++) {
    assertNotAborted(signal);
    out.addPage(pages[i]);
    report((i + 1) / pages.length, `Copying page ${i + 1} of ${pages.length}`, onProgress);
  }
  return out;
}

function metadata(pdf: PDFDocument) {
  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle() ?? "",
    author: pdf.getAuthor() ?? "",
    subject: pdf.getSubject() ?? "",
    keywords: pdf.getKeywords() ?? "",
    creator: pdf.getCreator() ?? "",
    producer: pdf.getProducer() ?? "",
    creationDate: pdf.getCreationDate()?.toISOString() ?? null,
    modificationDate: pdf.getModificationDate()?.toISOString() ?? null,
    encrypted: pdf.isEncrypted,
    hasForm: pdf.getForm().getFields().length > 0,
    hasXFA: pdf.getForm().hasXFA(),
    formFields: pdf.getForm().getFields().map((field) => ({ name: field.getName(), type: field.constructor.name, options: (() => { try { return (field as unknown as { getOptions?: () => string[] }).getOptions?.() ?? []; } catch { return []; } })() })),
  };
}

function clearMetadata(pdf: PDFDocument) {
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setCreator("");
  pdf.setProducer("");
  // pdf-lib exposes setters but no public "clear date" API.
  // Normalize these dates instead of pretending they can be removed safely.
  pdf.setCreationDate(new Date(0));
  pdf.setModificationDate(new Date(0));
}

function drawPageNumbers(pdf: PDFDocument, start: number, position: PdfProcessOptions["pageNumberPosition"], color: ReturnType<typeof rgb>, indices?: number[]) {
  const font = pdf.embedStandardFont(StandardFonts.Helvetica);
  const targetIndices = indices?.length ? indices : pdf.getPageIndices();
  targetIndices.forEach((pageIndex, index) => {
    const page = pageForIndex(pdf, pageIndex);
    const { width, height } = page.getSize();
    const label = String(start + index);
    const size = 10;
    const textWidth = font.widthOfTextAtSize(label, size);
    let x = 24;
    let y = height - 24;
    if (position?.includes("center")) x = (width - textWidth) / 2;
    if (position?.includes("right")) x = width - textWidth - 24;
    if (position?.includes("bottom")) y = 14;
    page.drawText(label, { x, y, size, font, color });
  });
}

async function annotatePdf(
  file: File,
  toolId: PdfToolId,
  options: PdfProcessOptions,
  signal?: AbortSignal,
  onProgress?: (p: PdfProgress) => void,
): Promise<PdfOutput> {
  const pdf = await loadPdf(file);
  const pages = pdf.getPages();
  const selected = options.pages?.length ? [...new Set(options.pages)] : [];
  if (!selected.length) throw new PdfEngineError("INVALID_OPTIONS", "Select at least one page for this operation.");
  const color = hexColor(options.color);
  const font = pdf.embedStandardFont(StandardFonts.Helvetica);
  const size = Math.max(6, Math.min(96, options.fontSize ?? 18));
  const opacity = Math.max(0.05, Math.min(1, options.opacity ?? 0.35));

  for (let i = 0; i < selected.length; i++) {
    assertNotAborted(signal);
    const page = pageForIndex(pdf, selected[i]);
    const { width, height } = page.getSize();
    const point = pagePoint(page, Math.max(0, options.x ?? 40), Math.max(0, options.y ?? 40));

    if (toolId === "pdf-watermark") {
      page.drawText(options.watermarkText || "WORKABHI", {
        x: point.x,
        y: point.y,
        size,
        font,
        color,
        opacity,
        rotate: degrees(-35),
      });
    } else if (toolId === "pdf-stamp") {
      const stamp = options.stampText || "APPROVED";
      page.drawRectangle({ x: point.x - 8, y: point.y - 8, width: Math.max(80, stamp.length * size * 0.6), height: size + 16, borderColor: color, borderWidth: 1.5, color: rgb(1, 1, 1), opacity: 0.15 });
      page.drawText(stamp, { x: point.x, y: point.y, size, font, color });
    } else if (toolId === "add-text-to-pdf") {
      page.drawText(options.text || "Text", { x: point.x, y: point.y, size, font, color });
    } else if (toolId === "pdf-highlight-tool") {
      const w = Math.min(width - point.x, Math.max(40, options.whiteout?.width ?? 180));
      const h = Math.min(height - point.y, Math.max(12, options.whiteout?.height ?? 24));
      page.drawRectangle({ x: point.x, y: point.y, width: w, height: h, color: rgb(1, 0.85, 0.05), opacity: 0.32 });
    } else if (toolId === "pdf-whiteout-tool") {
      const w = Math.min(width - point.x, Math.max(20, options.whiteout?.width ?? 180));
      const h = Math.min(height - point.y, Math.max(20, options.whiteout?.height ?? 40));
      page.drawRectangle({ x: point.x, y: point.y, width: w, height: h, color: rgb(1, 1, 1), opacity: 1 });
    } else if (toolId === "pdf-drawing-tool") {
      for (const line of options.drawing ?? []) {
        const a = pagePoint(page, line.x1, line.y1);
        const b = pagePoint(page, line.x2, line.y2);
        page.drawLine({ start: a, end: b, thickness: Math.max(1, size / 5), color, opacity });
      }
    } else if (toolId === "pdf-annotation-tool") {
      page.drawRectangle({ x: point.x, y: point.y, width: 180, height: 60, borderColor: color, borderWidth: 1, color: rgb(1, 1, 0.8), opacity: 0.85 });
      page.drawText(options.text || "Annotation", { x: point.x + 8, y: point.y + 40, size: Math.min(size, 14), font, color });
    } else if (toolId === "pdf-page-numbering") {
      drawPageNumbers(pdf, options.pageNumberStart ?? 1, options.pageNumberPosition ?? "bottom-center", color);
      break;
    } else if (toolId === "add-image-to-pdf") {
      if (!options.imageBytes) {
        throw new PdfEngineError(
          "INVALID_OPTIONS",
          "No image was provided.",
        );
      }

      const image = options.imageMimeType === "image/jpeg" ? await pdf.embedJpg(options.imageBytes) : await pdf.embedPng(options.imageBytes);

      const position =
        options.imagePosition ?? "center";

      const scale = Math.max(
        5,
        Math.min(100, options.imageScale ?? 35),
      );

      const imageOpacity = Math.max(
        0,
        Math.min(1, (options.imageOpacity ?? 100) / 100),
      );

      const margin = Math.max(
        0,
        options.imageMargin ?? 24,
      );

      const keepAspectRatio =
        options.imageKeepAspectRatio ?? true;

      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      let imageWidth = Math.max(1, (pageWidth * scale) / 100);
      let imageHeight = keepAspectRatio
        ? imageWidth * (image.height / image.width)
        : imageWidth;

      const maxWidth = Math.max(1, pageWidth - margin * 2);
      const maxHeight = Math.max(1, pageHeight - margin * 2);
      const fitScale = Math.min(1, maxWidth / imageWidth, maxHeight / imageHeight);

      imageWidth *= fitScale;
      imageHeight *= fitScale;

      let x = margin;
      let y = margin;

      switch (position) {
        case "top-left":
          x = margin;
          y = pageHeight - margin - imageHeight;
          break;
        case "top-center":
          x = (pageWidth - imageWidth) / 2;
          y = pageHeight - margin - imageHeight;
          break;
        case "top-right":
          x = pageWidth - margin - imageWidth;
          y = pageHeight - margin - imageHeight;
          break;
        case "center-left":
          x = margin;
          y = (pageHeight - imageHeight) / 2;
          break;
        case "center":
          x = (pageWidth - imageWidth) / 2;
          y = (pageHeight - imageHeight) / 2;
          break;
        case "center-right":
          x = pageWidth - margin - imageWidth;
          y = (pageHeight - imageHeight) / 2;
          break;
        case "bottom-left":
          x = margin;
          y = margin;
          break;
        case "bottom-center":
          x = (pageWidth - imageWidth) / 2;
          y = margin;
          break;
        case "bottom-right":
          x = pageWidth - margin - imageWidth;
          y = margin;
          break;
      }

      if (Number.isFinite(options.imageX)) {
        x = Math.max(0, Math.min(pageWidth - imageWidth, options.imageX!));
      }

      if (Number.isFinite(options.imageY)) {
        y = Math.max(0, Math.min(pageHeight - imageHeight, options.imageY!));
      }

      page.drawImage(image, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
        opacity: imageOpacity,
      });
    } else if (toolId === "add-signature-to-pdf") {
      if (!options.signatureBytes) {
        throw new PdfEngineError(
          "INVALID_OPTIONS",
          "No signature image was provided.",
        );
      }

      const signature = await pdf.embedPng(options.signatureBytes);
      const signatureScale = Math.max(5, Math.min(100, options.imageScale ?? 35)) / 100;
      const dims = signature.scale(Math.min(signatureScale, 240 / signature.width));
      page.drawImage(signature, {
        x: point.x,
        y: point.y,
        width: dims.width,
        height: dims.height,
        opacity,
      });
    }
    report((i + 1) / selected.length, `Editing page ${selected[i] + 1}`, onProgress);
  }
  return savePdf(pdf, `${file.name.replace(/\.pdf$/i, "")}-edited.pdf`);
}

async function fillForm(file: File, options: PdfProcessOptions, mode: "text" | "checkbox" | "radio", flatten = false) {
  const pdf = await loadPdf(file);
  const form = pdf.getForm();
  const fields = form.getFields();
  if (!fields.length) throw new PdfEngineError("UNSUPPORTED", "This PDF does not contain standard AcroForm fields. XFA forms are not supported.");
  const values = options.formValues ?? options.formFieldValues ?? {};
  for (const field of fields) {
    const name = field.getName();
    const value = values[name];
    if (value === undefined) continue;
    try {
      if (mode === "text") form.getTextField(name).setText(String(value));
      else if (mode === "checkbox") {
        const checkbox = form.getCheckBox(name);
        if (Boolean(value)) checkbox.check(); else checkbox.uncheck();
      } else if (mode === "radio") {
        form.getRadioGroup(name).select(String(value));
      }
    } catch {
      // A field of a different type is left unchanged rather than corrupting the document.
    }
  }
  if (flatten) form.flatten();
  return savePdf(pdf, `${file.name.replace(/\.pdf$/i, "")}-filled.pdf`);
}

async function pdfToImages(
  file: File,
  options: PdfProcessOptions,
  signal?: AbortSignal,
  onProgress?: (p: PdfProgress) => void,
): Promise<PdfOutput> {
  assertBrowser();
  const scale = Math.max(0.25, Math.min(2, options.renderScale ?? 1));
  const indices = options.pageIndices?.length ? options.pageIndices : Array.from({ length: Math.min(MAX_PAGES, 50) }, (_, i) => i);
  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const outputImages: PdfOutput["images"] = [];
  try {
    const pageCount = doc.numPages;
    const selected = indices.filter((i) => i >= 0 && i < pageCount);
    if (!selected.length) throw new PdfEngineError("PAGE_RANGE", "No valid PDF pages were selected.");
    for (let n = 0; n < selected.length; n++) {
      assertNotAborted(signal);
      const page = await doc.getPage(selected[n] + 1);
      const viewport = page.getViewport({ scale });
      const pixels = viewport.width * viewport.height;
      if (pixels > MAX_RENDER_PIXELS) throw new PdfEngineError("MEMORY_RISK", "This page is too large to render safely. Reduce the render scale.");
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new PdfEngineError("BROWSER_UNSUPPORTED", "Canvas is unavailable in this browser.");
      const renderTask = page.render({ canvas, canvasContext: ctx, viewport });
      signal?.addEventListener("abort", () => renderTask.cancel(), { once: true });
      try { await renderTask.promise; } catch (error) { if (signal?.aborted) throw new PdfEngineError("CANCELLED", "PDF rendering was cancelled."); throw error; }
      const mime = options.imageMimeType ?? "image/png";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
      if (!blob) throw new PdfEngineError("UNSUPPORTED", "The browser could not encode the rendered page.");
      outputImages!.push({ blob, filename: `page-${selected[n] + 1}.${mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png"}`, pageIndex: selected[n] });
      canvas.width = 1;
      canvas.height = 1;
      report((n + 1) / selected.length, `Rendered page ${selected[n] + 1} of ${selected.length}`, onProgress);
    }
  } finally {
    await doc.cleanup();
  }
  return { images: outputImages };
}

export async function inspectPdf(file: File): Promise<Record<string, unknown>> {
  const pdf = await loadPdf(file);
  return {
    ...metadata(pdf),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/pdf",
  };
}

export async function processPdf(
  toolId: PdfToolId,
  files: File[],
  options: PdfProcessOptions = {},
  signal?: AbortSignal,
  onProgress?: (progress: PdfProgress) => void,
): Promise<PdfOutput> {
  assertBrowser();
  assertNotAborted(signal);

  if (toolId === "pdf-password-generator") {
    const length = Math.max(8, Math.min(128, Math.floor(options.passwordLength ?? 24)));
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let password = "";
    for (const value of values) password += alphabet[value % alphabet.length];
    return { text: password };
  }

  if (toolId === "text-to-pdf") {
    const text = options.text ?? "";
    if (!text.trim()) throw new PdfEngineError("INVALID_OPTIONS", "Enter some text before creating the PDF.");
    const pdf = await PDFDocument.create();
    const font = pdf.embedStandardFont(StandardFonts.Helvetica);
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const fontSize = 12;
    const lineHeight = 18;
    const maxWidth = pageWidth - margin * 2;
    const wrap = (value: string) => {
      const words = value.split(/\s+/);
      const result: string[] = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? current + " " + word : word;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) current = candidate;
        else if (current) { result.push(current); current = word; }
        else {
          let chunk = "";
          for (const char of word) {
            const next = chunk + char;
            if (font.widthOfTextAtSize(next, fontSize) > maxWidth && chunk) { result.push(chunk); chunk = char; } else chunk = next;
          }
          current = chunk;
        }
      }
      if (current || !result.length) result.push(current);
      return result;
    };
    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    for (const line of lines.flatMap(wrap)) {
      assertNotAborted(signal);
      if (y < margin) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.12, 0.12, 0.12), maxWidth });
      y -= lineHeight;
    }
    return savePdf(pdf, "text-to-pdf.pdf", signal);
  }

  if (toolId === "pdf-hash-generator") {
    const file = files[0];
    ensurePdfFile(file);
    assertNotAborted(signal);\n    const data = await file.arrayBuffer();\n    assertNotAborted(signal);\n    const algorithm = options.hashAlgorithm ?? "SHA-256";
    const digest = await crypto.subtle.digest(algorithm, data);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { text: `${algorithm}: ${hex}` };
  }

  if (toolId === "pdf-file-integrity-checker") {
    const file = files[0];
    ensurePdfFile(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const head = new TextDecoder().decode(bytes.slice(0, 8));
    const tail = new TextDecoder().decode(bytes.slice(Math.max(0, bytes.length - 64)));
    let parsed = false;
    let pageCount = 0;
    try {
      const pdf = await loadPdf(file);
      parsed = true;
      pageCount = pdf.getPageCount();
    } catch {
      parsed = false;
    }
    return {
      text: JSON.stringify({
        fileName: file.name,
        bytes: file.size,
        headerLooksValid: head.startsWith("%PDF-"),
        eofMarkerPresent: tail.includes("%%EOF"),
        parserOpenedDocument: parsed,
        pageCount,
        verdict: parsed && head.startsWith("%PDF-") ? "Basic structural checks passed" : "The file failed one or more basic structural checks",
      }, null, 2),
    };
  }

  if (toolId === "pdf-security-checker") {
    const info = await inspectPdf(files[0]);
    return {
      metadata: info,
      text: JSON.stringify({
        encrypted: info.encrypted,
        standardAcroFormFields: info.hasForm,
        xfaForm: info.hasXFA,
        metadataPresent: Boolean(info.title || info.author || info.subject || info.keywords || info.creator || info.producer),
        note: "This checker reports only properties verifiable by the browser PDF parser. It does not claim to detect every possible PDF exploit, embedded object, or signature issue.",
      }, null, 2),
    };
  }

  if (toolId === "pdf-metadata-viewer") return { metadata: await inspectPdf(files[0]) };

  if (toolId === "pdf-viewer") {
    ensurePdfFile(files[0]);
    return { blob: files[0], filename: files[0].name, mimeType: "application/pdf", size: files[0].size };
  }

  if (["jpg-to-pdf", "png-to-pdf", "webp-to-pdf", "bmp-to-pdf", "tiff-to-pdf"].includes(toolId)) {
    return makePdfFromImage(files[0], signal, onProgress);
  }

  if (toolId === "images-to-pdf") return imagesToPdf(files, signal, onProgress);

  if (["pdf-to-jpg", "pdf-to-png", "pdf-to-webp", "pdf-to-images", "pdf-pages-to-images"].includes(toolId)) {
    const mime = toolId === "pdf-to-jpg" ? "image/jpeg" : toolId === "pdf-to-webp" ? "image/webp" : "image/png";
    return pdfToImages(files[0], { ...options, imageMimeType: mime }, signal, onProgress);
  }

  if (toolId === "merge-pdf") {
    if (files.length < 2) throw new PdfEngineError("INVALID_INPUT", "Select at least two PDF files to merge.");
    const out = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      assertNotAborted(signal);
      const source = await loadPdf(files[i]);
      const copied = await out.copyPages(source, source.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      report((i + 1) / files.length, `Merged ${i + 1} of ${files.length} PDFs`, onProgress);
    }
    return savePdf(out, "merged.pdf");
  }

  const pdf = await loadPdf(files[0]);


  if (toolId === "remove-pdf-metadata" || toolId === "pdf-metadata-cleaner" || toolId === "pdf-privacy-cleaner") {
    clearMetadata(pdf);
    return savePdf(pdf, `${files[0].name.replace(/\.pdf$/i, "")}-clean.pdf`);
  }

  if (toolId === "pdf-form-filler") return fillForm(files[0], options, "text");
  if (toolId === "pdf-checkbox-filler") return fillForm(files[0], options, "checkbox");
  if (toolId === "pdf-radio-button-filler") return fillForm(files[0], options, "radio");
  if (toolId === "pdf-flatten-tool") return fillForm(files[0], options, "text", true);

  if (toolId === "pdf-page-numbering") {
    const targetPages = options.pages?.length ? [...new Set(options.pages)] : pdf.getPageIndices();
    if (targetPages.some((i) => i < 0 || i >= pdf.getPageCount())) throw new PdfEngineError("PAGE_RANGE", "One or more page numbers are outside the PDF.");
    drawPageNumbers(pdf, options.pageNumberStart ?? 1, options.pageNumberPosition ?? "bottom-center", hexColor(options.color), targetPages);
    return savePdf(pdf, `${files[0].name.replace(/\.pdf$/i, "")}-numbered.pdf`);
  }

  if (["rotate-pdf", "delete-pdf-pages", "extract-pdf-pages", "reorder-pdf-pages", "duplicate-pdf-pages", "reverse-pdf-pages", "split-pdf", "pdf-page-organizer"].includes(toolId)) {
    const count = pdf.getPageCount();
    const all = Array.from({ length: count }, (_, i) => i);
    let indices = options.pages?.length ? [...new Set(options.pages)] : [];
    const destructive = new Set<PdfToolId>(["rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages","reverse-pdf-pages","split-pdf","pdf-page-organizer"]);
    if (destructive.has(toolId) && !indices.length && toolId !== "split-pdf") throw new PdfEngineError("INVALID_OPTIONS", "Select or enter at least one page before processing.");
    if (indices.some((i) => !Number.isInteger(i) || i < 0 || i >= count)) throw new PdfEngineError("PAGE_RANGE", "One or more selected pages are outside the PDF.");
    if (toolId === "delete-pdf-pages") {
      const remove = new Set(indices);
      indices = all.filter((i) => !remove.has(i));
      if (!indices.length) throw new PdfEngineError("INVALID_OPTIONS", "You cannot delete every page.");
    } else if (toolId === "reverse-pdf-pages") {
      indices = [...indices].reverse();
    } else if (toolId === "reorder-pdf-pages" || toolId === "pdf-page-organizer") {
      if (!options.pageOrder?.length) throw new PdfEngineError("INVALID_OPTIONS", "Provide a complete page order, for example 3,1,2.");
      const order = options.pageOrder;
      if (order.length !== count || new Set(order).size !== count || order.some((i) => !Number.isInteger(i) || i < 0 || i >= count)) throw new PdfEngineError("INVALID_OPTIONS", "Page order must contain every page exactly once.");
      indices = [...order];
    } else if (toolId === "duplicate-pdf-pages") {
      const index = options.duplicatePage ?? indices[0];
      if (index === undefined || index < 0 || index >= count) throw new PdfEngineError("PAGE_RANGE", "Choose a valid page to duplicate.");
      const position = Math.max(0, Math.min(count, Math.floor(options.duplicatePosition ?? index + 1)));
      const order = all.slice();
      order.splice(position, 0, index);
      indices = order;
    }

    if (toolId === "rotate-pdf") {
      const rotation = options.rotate ?? 90;
      for (const index of indices) {
        const page = pageForIndex(pdf, index);
        page.setRotation(degrees(rotation));
      }
      return savePdf(pdf, `${files[0].name.replace(/\.pdf$/i, "")}-rotated.pdf`, signal);
    }

    if (toolId === "split-pdf") {
      const chunks = options.pageGroups?.length ? options.pageGroups : options.pages?.length ? [options.pages] : Array.from({ length: count }, (_, i) => [i]);
      const outputs: PdfOutput[] = [];
      for (let i = 0; i < chunks.length; i++) { assertNotAborted(signal); const split = await copySelectedPages(pdf, chunks[i], signal, onProgress); outputs.push(await savePdf(split, `${files[0].name.replace(/\.pdf$/i, "")}-split-${i + 1}.pdf`, signal)); }
      return { outputs, ...(outputs.length === 1 ? outputs[0] : {}) };
    }

    const out = await copySelectedPages(pdf, indices, signal, onProgress);
    return savePdf(out, `${files[0].name.replace(/\.pdf$/i, "")}-pages.pdf`, signal);
  }

  if (["pdf-watermark", "pdf-stamp", "add-text-to-pdf", "add-image-to-pdf", "add-signature-to-pdf", "pdf-highlight-tool", "pdf-drawing-tool", "pdf-annotation-tool", "pdf-whiteout-tool"].includes(toolId)) {
    return annotatePdf(files[0], toolId, options, signal, onProgress);
  }

  throw new PdfEngineError("UNSUPPORTED", `The PDF tool "${toolId}" is not implemented by the browser engine.`);
}
