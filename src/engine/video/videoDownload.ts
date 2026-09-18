"use client";

/**
 * StreamSaver is deliberately loaded dynamically. Its module touches
 * `document` during evaluation, so a static import would put browser-only
 * code into the Next.js server dependency graph and cause SSR failures.
 */
export interface BrowserDownloadStream {
  writable: WritableStream<Uint8Array>;
  filename: string;
  streamed: true;
}

type StreamSaverModule = {
  createWriteStream?: (filename: string) => WritableStream<Uint8Array>;
};

export async function createBrowserDownloadStream(
  filename: string,
): Promise<BrowserDownloadStream | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (typeof WritableStream === "undefined") return null;
  if (!filename.trim()) return null;

  try {
    const streamSaverModule = (await import("streamsaver")) as StreamSaverModule & { default?: StreamSaverModule };
    const streamSaver = streamSaverModule.default ?? streamSaverModule;
    if (typeof streamSaver.createWriteStream !== "function") return null;
    const writable = streamSaver.createWriteStream(filename);
    if (!writable || typeof writable.getWriter !== "function") return null;
    return { writable, filename, streamed: true };
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!blob || blob.size <= 0) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
