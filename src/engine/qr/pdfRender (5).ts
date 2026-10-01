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
  private readonly maxCacheEntries = 8;
  private activeRenders = 0;
  private idleResolvers: Array<() => void> = [];

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

  private markRenderStarted() {
    this.activeRenders += 1;
  }

  private markRenderFinished() {
    this.activeRenders = Math.max(0, this.activeRenders - 1);
    if (this.activeRenders === 0) {
      const resolvers = this.idleResolvers.splice(0);
      resolvers.forEach((resolve) => resolve());
    }
  }

  private async waitForIdle() {
    if (this.activeRenders === 0) return;
    await new Promise<void>((resolve) => this.idleResolvers.push(resolve));
  }

  releasePage(pageIndex: number, scale = 0.75) {
    const normalizedScale = Math.max(0.25, Math.min(1.5, scale));
    this.cache.delete(`${pageIndex}:${normalizedScale}`);
  }

  async renderPage(pageIndex: number, scale = 0.75): Promise<string> {
    const normalizedScale = Math.max(0.25, Math.min(1.5, scale));
    const key = `${pageIndex}:${normalizedScale}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    this.markRenderStarted();
    let page: any = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      const pdfDocument = await this.getDocument();
      if (pageIndex < 0 || pageIndex >= pdfDocument.numPages) throw new Error("Invalid PDF page.");
      page = await pdfDocument.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: normalizedScale });
      canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      this.cache.delete(key);
      this.cache.set(key, dataUrl);
      while (this.cache.size > this.maxCacheEntries) {
        const oldest = this.cache.keys().next().value as string | undefined;
        if (!oldest) break;
        this.cache.delete(oldest);
      }
      return dataUrl;
    } finally {
      if (canvas) { canvas.width = 1; canvas.height = 1; }
      try { page?.cleanup(); } catch { /* ignore page cleanup failures */ }
      this.markRenderFinished();
    }
  }

  async close() {
    this.closed = true;
    const promise = this.documentPromise;
    await this.waitForIdle();
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
