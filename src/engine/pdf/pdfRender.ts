export interface PdfThumbnail {
  pageIndex: number;
  dataUrl: string;
}

let configured = false;

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

export class PdfRenderSession {
  private readonly file: File;
  private documentPromise: Promise<any> | null = null;
  private closed = false;
  private readonly cache = new Map<string, string>();

  constructor(file: File) {
    this.file = file;
  }

  get sourceFile() {
    return this.file;
  }

  private async getDocument() {
    if (this.closed) throw new Error("PDF render session is closed.");
    if (!this.documentPromise) {
      const pdfjs = await getPdfJs();
      const bytes = new Uint8Array(await this.file.arrayBuffer());
      this.documentPromise = pdfjs.getDocument({ data: bytes }).promise;
    }
    return this.documentPromise;
  }

  async getPageCount() {
    const pdfDocument = await this.getDocument();
    return pdfDocument.numPages as number;
  }

  async renderPage(pageIndex: number, scale = 0.75): Promise<string> {
    const normalizedScale = Math.max(0.25, Math.min(1.5, scale));
    const key = `${pageIndex}:${normalizedScale}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const pdfDocument = await this.getDocument();
    if (pageIndex < 0 || pageIndex >= pdfDocument.numPages) throw new Error("Invalid PDF page.");
    const page = await pdfDocument.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: normalizedScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    try {
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      this.cache.set(key, dataUrl);
      return dataUrl;
    } finally {
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
    }
  }

  async close() {
    this.closed = true;
    const promise = this.documentPromise;
    this.documentPromise = null;
    this.cache.clear();
    if (promise) {
      try {
        const pdfDocument = await promise;
        await pdfDocument.cleanup();
        await pdfDocument.destroy();
      } catch {
        // Cleanup must not surface as a user-facing render error.
      }
    }
  }
}

export async function renderPdfPage(file: File, pageIndex: number, scale = 0.75): Promise<string> {
  const session = new PdfRenderSession(file);
  try {
    return await session.renderPage(pageIndex, scale);
  } finally {
    await session.close();
  }
}

export async function getPdfPageCount(file: File): Promise<number> {
  const session = new PdfRenderSession(file);
  try {
    return await session.getPageCount();
  } finally {
    await session.close();
  }
}
