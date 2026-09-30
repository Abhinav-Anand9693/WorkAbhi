export interface PdfThumbnail {
  pageIndex: number;
  dataUrl: string;
}

interface PdfDocumentProxyLike {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void>; cancel(): void };
    cleanup(): boolean;
  }>;
  cleanup(keepLoadedFonts?: boolean): Promise<void>;
}

let configured = false;
const documentCache = new WeakMap<File, Promise<PdfDocumentProxyLike>>();

async function getPdfJs() {
  if (typeof window === "undefined") throw new Error("PDF rendering requires a browser.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!configured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    configured = true;
  }
  return pdfjs;
}

async function getCachedDocument(file: File): Promise<PdfDocumentProxyLike> {
  const existing = documentCache.get(file);
  if (existing) return existing;
  const promise = (async () => {
    const pdfjs = await getPdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    return await pdfjs.getDocument({ data: bytes }).promise as PdfDocumentProxyLike;
  })();
  documentCache.set(file, promise);
  try {
    return await promise;
  } catch (error) {
    documentCache.delete(file);
    throw error;
  }
}

export async function renderPdfPage(
  file: File,
  pageIndex: number,
  scale = 0.75,
  signal?: AbortSignal,
): Promise<string> {
  const pdfDocument = await getCachedDocument(file);
  if (signal?.aborted) throw new Error("PDF rendering was cancelled.");
  if (pageIndex < 0 || pageIndex >= pdfDocument.numPages) throw new Error("Invalid PDF page.");
  const page = await pdfDocument.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: Math.max(0.25, Math.min(1.5, scale)) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  const renderTask = page.render({ canvas, canvasContext: context, viewport });
  const cancel = () => renderTask.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    await renderTask.promise;
    if (signal?.aborted) throw new Error("PDF rendering was cancelled.");
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    signal?.removeEventListener("abort", cancel);
    canvas.width = 1;
    canvas.height = 1;
    page.cleanup();
  }
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfDocument = await getCachedDocument(file);
  return pdfDocument.numPages;
}

export async function releasePdfDocument(file: File): Promise<void> {
  const promise = documentCache.get(file);
  if (!promise) return;
  documentCache.delete(file);
  try {
    const document = await promise;
    await document.cleanup();
  } catch {
    // A failed/cancelled renderer has no reusable document to release.
  }
}
