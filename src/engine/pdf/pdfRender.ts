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

export async function renderPdfPage(
  file: File,
  pageIndex: number,
  scale = 0.75,
): Promise<string> {
  const pdfjs = await getPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  try {
    if (pageIndex < 0 || pageIndex >= pdfDocument.numPages) throw new Error("Invalid PDF page.");
    const page = await pdfDocument.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: Math.max(0.25, Math.min(1.5, scale)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    canvas.width = 1;
    canvas.height = 1;
    return dataUrl;
  } finally {
    await pdfDocument.cleanup();
  }
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  try {
    return pdfDocument.numPages;
  } finally {
    await pdfDocument.cleanup();
  }
}
