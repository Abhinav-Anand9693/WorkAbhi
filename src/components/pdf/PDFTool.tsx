"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PdfToolId, PdfProcessOptions, PdfOutput } from "@/engine/pdf/pdfTypes";
import { PdfEngineError } from "@/engine/pdf/pdfTypes";
import { processPdf, inspectPdf } from "@/engine/pdf/pdfEngine";
import { PdfRenderSession } from "@/engine/pdf/pdfRender";

const PDF_TOOLS = new Set<PdfToolId>([
  "merge-pdf","split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages",
  "duplicate-pdf-pages","reverse-pdf-pages","pdf-page-numbering","pdf-page-organizer","pdf-viewer",
  "pdf-metadata-viewer","remove-pdf-metadata","pdf-watermark","pdf-stamp","add-text-to-pdf",
  "add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool",
  "pdf-whiteout-tool","pdf-form-filler","pdf-checkbox-filler","pdf-radio-button-filler","pdf-flatten-tool",
  "jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf","text-to-pdf",
  "pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-images","pdf-pages-to-images","pdf-password-generator",
  "pdf-hash-generator","pdf-file-integrity-checker","pdf-metadata-cleaner","pdf-privacy-cleaner","pdf-security-checker"
]);

const PAGE_TOOLS = new Set<PdfToolId>([
  "split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages",
  "reverse-pdf-pages","pdf-page-numbering","pdf-page-organizer","pdf-watermark","pdf-stamp","add-text-to-pdf",
  "add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool","pdf-whiteout-tool"
]);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  queueMicrotask(() => URL.revokeObjectURL(url));
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

function parsePages(value: string, pageCount?: number) {
  const pages: number[] = [];
  const tokens = value.split(",").map((x) => x.trim());

  if (!value.trim()) return pages;

  for (const token of tokens) {
    if (!token) throw new PdfEngineError("INVALID_OPTIONS", "Page selection contains an empty item.");

    let start: number;
    let end: number;

    if (/^\d+$/.test(token)) {
      start = end = Number(token);
    } else if (/^\d+-\d+$/.test(token)) {
      const [a, b] = token.split("-").map(Number);
      start = Math.min(a, b);
      end = Math.max(a, b);
    } else {
      throw new PdfEngineError(
        "INVALID_OPTIONS",
        `Invalid page selection \"${token}\". Use values like 1,3-5,8.`,
      );
    }

    if (start < 1 || end < 1 || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
      throw new PdfEngineError("PAGE_RANGE", `Invalid page number in \"${token}\".`);
    }

    if (pageCount !== undefined && end > pageCount) {
      throw new PdfEngineError(
        "PAGE_RANGE",
        `Page ${end} is outside this PDF. It contains ${pageCount} pages.`,
      );
    }

    for (let n = start; n <= end; n++) pages.push(n - 1);
  }

  return pages;
}

interface PDFToolProps { toolId: string; }

export default function PDFTool({ toolId }: PDFToolProps) {
  return <PDFToolInstance key={toolId} toolId={toolId} />;
}

function PDFToolInstance({ toolId }: PDFToolProps) {
  const id = toolId as PdfToolId;
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [pageImages, setPageImages] = useState<Record<number,string>>({});
  const [result, setResult] = useState<PdfOutput | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [options, setOptions] = useState<PdfProcessOptions>({});
  const [textValue, setTextValue] = useState("");
  const [passwordLength, setPasswordLength] = useState("24");
  const [pageInput, setPageInput] = useState("");
  const [duplicateMode, setDuplicateMode] = useState<"before" | "after">("after");
  const [busy, setBusy] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerPages, setViewerPages] = useState<Record<number, string>>({});
  const [viewerPageCount, setViewerPageCount] = useState(0);
  const [viewerBusy, setViewerBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerAbortRef = useRef<AbortController | null>(null);
  const viewerSessionRef = useRef<PdfRenderSession | null>(null);
  const thumbnailSessionRef = useRef<PdfRenderSession | null>(null);
  const viewerPageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const viewerRenderedRef = useRef<Set<number>>(new Set());

  const needsPdf = !["jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf","text-to-pdf","pdf-password-generator"].includes(id);
  const needsImages = ["jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf"].includes(id);
  const pageTool = PAGE_TOOLS.has(id);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      viewerAbortRef.current?.abort();
      void viewerSessionRef.current?.close();
      void thumbnailSessionRef.current?.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    };
  }, [viewerUrl]);


  useEffect(() => {
    if (!viewerUrl || !viewerPageCount || !viewerSessionRef.current) return;
    const session = viewerSessionRef.current;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = Number((entry.target as HTMLElement).dataset.pageIndex);
        if (!Number.isInteger(index) || viewerRenderedRef.current.has(index)) continue;
        viewerRenderedRef.current.add(index);
        void session.renderPage(index, 1.05)
          .then((dataUrl) => setViewerPages((current) => ({ ...current, [index]: dataUrl })))
          .catch((e) => {
            viewerRenderedRef.current.delete(index);
            if (!viewerAbortRef.current?.signal.aborted) {
              setError(e instanceof Error ? e.message : "PDF could not be rendered on this device.");
            }
          });
      }
    }, { rootMargin: "1000px 0px" });

    for (let index = 0; index < viewerPageCount; index++) {
      const element = viewerPageRefs.current[index];
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [viewerUrl, viewerPageCount]);

  async function loadFileSelection(next: File[]) {
    setError("");
    setResult(null);
    setPageImages({});
    if (!next.length) return;
    if (needsPdf && next.some((file) => file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) {
      setError("Please select PDF files.");
      return;
    }
    if (next.some((file) => file.size <= 0)) {
      setError("One of the selected files is empty.");
      return;
    }
    if (next.some((file) => file.size > 256 * 1024 * 1024)) {
      setError("A selected file is too large for safe browser processing.");
      return;
    }
    setFiles(next);
    if (needsPdf) {
      try {
        const info = await inspectPdf(next[0]);
        const count = Number(info.pageCount ?? 0);
        setPages(Array.from({ length: count }, (_, i) => i));
        setSelected([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The PDF could not be opened.");
      }
    }
  }

  async function handleProcess() {
    setError("");
    setResult(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress(0);
    try {
      let processOptions: PdfProcessOptions = { ...options };
      if (textValue) processOptions.text = textValue;
      if (passwordLength) processOptions.passwordLength = Number(passwordLength);
      if (pageInput) {
        const parsed = parsePages(pageInput, pages.length || undefined);
        if (id === "reorder-pdf-pages" || id === "pdf-page-organizer") {
          if (parsed.length !== pages.length || new Set(parsed).size !== pages.length) {
            throw new PdfEngineError(
              "INVALID_OPTIONS",
              `Reorder must contain every page exactly once (${pages.length} pages).`,
            );
          }
          processOptions.pageOrder = parsed;
        } else {
          processOptions.pages = [...new Set(parsed)];
        }
      } else if (pageTool && selected.length) {
        processOptions.pages = selected;
      }
      if (id === "duplicate-pdf-pages") {
        const duplicatePages = processOptions.pages?.length ? processOptions.pages : selected;
        if (!duplicatePages.length) throw new PdfEngineError("INVALID_OPTIONS", "Select at least one page to duplicate.");
        processOptions.duplicatePages = [...new Set(duplicatePages)];
        processOptions.duplicateMode = duplicateMode;
      }

      if (id === "pdf-password-generator") {
        const output = await processPdf(id, [], processOptions, controller.signal, (p) => {
          setProgress(p.progress); setMessage(p.message);
        });
        setResult(output);
      } else {
        if (!files.length) throw new PdfEngineError("INVALID_INPUT", "Select a file first.");
        const output = await processPdf(id, files, processOptions, controller.signal, (p) => {
          setProgress(p.progress); setMessage(p.message);
        });
        setResult(output);
        if (output.blob && id === "pdf-viewer") {
          if (viewerUrl) URL.revokeObjectURL(viewerUrl);
          viewerAbortRef.current?.abort();
          await viewerSessionRef.current?.close();
          const viewerFile = new File([output.blob], output.filename ?? files[0]?.name ?? "document.pdf", { type: "application/pdf" });
          const controller = new AbortController();
          const session = new PdfRenderSession(viewerFile);
          viewerAbortRef.current = controller;
          viewerSessionRef.current = session;
          viewerRenderedRef.current = new Set();
          viewerPageRefs.current = {};
          setViewerUrl(URL.createObjectURL(output.blob));
          setViewerPages({});
          setViewerPageCount(await session.getPageCount());
          setViewerBusy(false);
        }
      }
      setProgress(1);
      setMessage("Completed");
    } catch (e) {
      const message = e instanceof PdfEngineError || e instanceof Error ? e.message : "PDF processing failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function renderThumbnail(index: number) {
    const file = files[0];
    if (!file || pageImages[index]) return;
    try {
      let session = thumbnailSessionRef.current;
      if (!session || session.sourceFile !== file) {
        await session?.close();
        session = new PdfRenderSession(file);
        thumbnailSessionRef.current = session;
      }
      const dataUrl = await session.renderPage(index, 0.42);
      setPageImages((current) => ({ ...current, [index]: dataUrl }));
    } catch {
      // Thumbnail failures must not break the page workspace.
    }
  }

  function togglePage(index: number) {
    setSelected((current) => current.includes(index) ? current.filter((p) => p !== index) : [...current, index]);
  }

  function reset() {
    abortRef.current?.abort();
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    viewerAbortRef.current?.abort();
    void viewerSessionRef.current?.close();
    void thumbnailSessionRef.current?.close();
    viewerSessionRef.current = null;
    thumbnailSessionRef.current = null;
    Object.values(pageImages).forEach((url) => URL.revokeObjectURL(url));
    setViewerUrl(null);
    setViewerPages({});
    setViewerPageCount(0);
    setViewerBusy(false);
    setFiles([]);
    setPages([]);
    setSelected([]);
    setPageImages({});
    setResult(null);
    setError("");
    setProgress(0);
    setMessage("");
    setTextValue("");
    setPageInput("");
    setDuplicateMode("after");
    setOptions({});
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!PDF_TOOLS.has(id)) return <div className="rounded-2xl border p-6">Unsupported PDF tool.</div>;

  return (
    <section className="space-y-6">
      <div
        className="rounded-2xl border-2 border-dashed p-6 text-center transition hover:border-primary"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void loadFileSelection(Array.from(e.dataTransfer.files)); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={needsImages ? "image/*" : "application/pdf,.pdf"}
          multiple={id === "merge-pdf" || id === "images-to-pdf"}
          className="sr-only"
          onChange={(e) => void loadFileSelection(Array.from(e.target.files ?? []))}
          aria-label="Select PDF files"
        />
        <button type="button" className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => inputRef.current?.click()}>
          Select {needsImages ? "image" : "PDF"} file{needsImages ? "s" : ""}
        </button>
        <p className="mt-2 text-sm text-muted-foreground">Drag and drop files here. Processing stays in your browser.</p>
        {files.length > 0 && <p className="mt-3 text-sm">{files.map((f) => `${f.name} (${formatBytes(f.size)})`).join(" • ")}</p>}
      </div>

      {id === "text-to-pdf" && (
        <textarea className="min-h-48 w-full rounded-xl border p-4" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Enter text to convert to PDF" />
      )}

      {["pdf-password-generator"].includes(id) && (
        <label className="block text-sm">Password length
          <input className="mt-2 w-full rounded-xl border p-3" type="number" min={8} max={128} value={passwordLength} onChange={(e) => setPasswordLength(e.target.value)} />
        </label>
      )}

      {pageTool && files.length > 0 && pages.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="font-semibold">PDF Page Workspace</h2><p className="text-sm text-muted-foreground">Select pages for this operation. Thumbnails load lazily.</p></div>
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setSelected(selected.length === pages.length ? [] : pages)}>Select all</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {pages.map((index) => (
              <button
                key={index}
                type="button"
                className={`overflow-hidden rounded-xl border text-left ${selected.includes(index) ? "ring-2 ring-primary" : ""}`}
                onClick={() => { togglePage(index); void renderThumbnail(index); }}
                onFocus={() => void renderThumbnail(index)}
              >
                {pageImages[index] ? <Image src={pageImages[index]} alt={`Page ${index + 1} preview`} width={600} height={800} unoptimized className="aspect-[3/4] w-full object-cover" /> : <div className="flex aspect-[3/4] items-center justify-center bg-muted text-sm">Page {index + 1}</div>}
                <div className="p-2 text-xs">Page {index + 1}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {["delete-pdf-pages","extract-pdf-pages","split-pdf"].includes(id) && (
        <label className="block text-sm">Pages
          <input className="mt-2 w-full rounded-xl border p-3" placeholder="Example: 1,3-5" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
        </label>
      )}

      {["reorder-pdf-pages","pdf-page-organizer"].includes(id) && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div><h3 className="font-semibold">Reorder settings</h3><p className="text-xs text-muted-foreground">Enter the complete final page order. Every page must appear exactly once.</p></div>
          <input className="w-full rounded-xl border p-3" placeholder="Example: 3,1,2,4" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPageInput(pages.map((_, i) => i + 1).join(","))}>Reset order</button>
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPageInput(pages.slice().reverse().map((p) => p + 1).join(","))}>Reverse order</button>
            {selected.length > 0 && <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPageInput([...selected, ...pages.filter((p) => !selected.includes(p))].map((p) => p + 1).join(","))}>Selected pages first</button>}
          </div>
        </div>
      )}

      {id === "duplicate-pdf-pages" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <h3 className="font-semibold">Duplicate settings</h3>
          <p className="text-xs text-muted-foreground">Select one or more pages above. Every selected page will be duplicated.</p>
          <label className="block text-sm">Insert duplicate
            <select className="mt-2 w-full rounded-xl border p-3" value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value as "before" | "after")}>
              <option value="after">After original page</option><option value="before">Before original page</option>
            </select>
          </label>
          <label className="block text-sm">Pages to duplicate
            <input
              className="mt-2 w-full rounded-xl border p-3"
              placeholder="Optional: 1,3-5"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
            />
          </label>
          {selected.length > 0 && <p className="text-xs text-muted-foreground">Selected: {selected.map((p) => p + 1).join(", ")}</p>}
          <p className="text-xs text-muted-foreground">You can select multiple pages above or enter multiple page numbers/ranges here.</p>
        </div>
      )}

      {id === "pdf-page-numbering" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <h3 className="font-semibold">Page numbering settings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Start numbering at
              <input className="mt-2 w-full rounded-xl border p-3" type="number" min={0} max={999999} value={options.pageNumberStart ?? 1} onChange={(e) => {
                const value = Number(e.target.value);
                setOptions((o) => ({ ...o, pageNumberStart: Number.isFinite(value) ? Math.max(0, Math.min(999999, value)) : 1 }));
              }} />
            </label>
            <label className="text-sm">Position
              <select className="mt-2 w-full rounded-xl border p-3" value={options.pageNumberPosition ?? "bottom-center"} onChange={(e) => setOptions((o) => ({ ...o, pageNumberPosition: e.target.value as PdfProcessOptions["pageNumberPosition"] }))}>
                <option value="top-left">Top left</option><option value="top-center">Top center</option><option value="top-right">Top right</option>
                <option value="bottom-left">Bottom left</option><option value="bottom-center">Bottom center</option><option value="bottom-right">Bottom right</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">Pages to number
            <input className="mt-2 w-full rounded-xl border p-3" placeholder="Leave empty for all pages, or e.g. 2-5,8" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
          </label>
          <label className="block text-sm">Number color
            <input className="mt-2 h-11 w-full rounded-xl border p-1" type="color" value={options.color ?? "#ef4444"} onChange={(e) => setOptions((o) => ({ ...o, color: e.target.value }))} />
          </label>
        </div>
      )}

      {["rotate-pdf"].includes(id) && (
        <label className="block text-sm">Rotation
          <select className="mt-2 rounded-xl border p-3" value={options.rotate ?? 90} onChange={(e) => setOptions((o) => ({ ...o, rotate: Number(e.target.value) as 90|180|270 }))}>
            <option value="90">90°</option><option value="180">180°</option><option value="270">270°</option>
          </select>
        </label>
      )}

      {["pdf-watermark","pdf-stamp","add-text-to-pdf"].includes(id) && (
        <div className="rounded-2xl border p-4 space-y-4">
          <div><h3 className="font-semibold">{id === "pdf-watermark" ? "Watermark settings" : id === "pdf-stamp" ? "Stamp settings" : "Add text settings"}</h3><p className="text-xs text-muted-foreground">Configure exactly where and how the content is added. Leave page selection empty to apply to every page.</p></div>
          <input className="w-full rounded-xl border p-3" placeholder={id === "pdf-watermark" ? "Watermark text" : id === "pdf-stamp" ? "Stamp text" : "Text to add"} value={textValue} onChange={(e) => { setTextValue(e.target.value); setOptions((o) => ({ ...o, text: e.target.value, watermarkText: e.target.value, stampText: e.target.value })); }} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">Font size<input className="mt-2 w-full rounded-xl border p-3" type="number" min="6" max="96" value={options.fontSize ?? 18} onChange={(e) => setOptions((o) => ({ ...o, fontSize: Number(e.target.value) }))} /></label>
            <label className="text-sm">Opacity<input className="mt-2 w-full" type="range" min="5" max="100" value={Math.round((options.opacity ?? 0.35) * 100)} onChange={(e) => setOptions((o) => ({ ...o, opacity: Number(e.target.value) / 100 }))} /></label>
            <label className="text-sm">Text color<input className="mt-2 h-11 w-full rounded-xl border p-1" type="color" value={options.color ?? "#ef4444"} onChange={(e) => setOptions((o) => ({ ...o, color: e.target.value }))} /></label>
            {id === "pdf-watermark" && <label className="text-sm">Rotation<input className="mt-2 w-full rounded-xl border p-3" type="number" min="-180" max="180" value={options.rotation ?? -35} onChange={(e) => setOptions((o) => ({ ...o, rotation: Number(e.target.value) }))} /></label>}
            {id === "pdf-stamp" && <label className="text-sm">Border width<input className="mt-2 w-full rounded-xl border p-3" type="number" min="0.5" max="8" step="0.5" value={options.borderWidth ?? 1.5} onChange={(e) => setOptions((o) => ({ ...o, borderWidth: Number(e.target.value) }))} /></label>}
            {id === "pdf-stamp" && <label className="text-sm">Background opacity<input className="mt-2 w-full" type="range" min="0" max="100" value={Math.round((options.backgroundOpacity ?? 0.15) * 100)} onChange={(e) => setOptions((o) => ({ ...o, backgroundOpacity: Number(e.target.value) / 100 }))} /></label>}
            <label className="text-sm">X position<input className="mt-2 w-full rounded-xl border p-3" type="number" value={options.x ?? 40} onChange={(e) => setOptions((o) => ({ ...o, x: Number(e.target.value) }))} /></label>
            <label className="text-sm">Y position<input className="mt-2 w-full rounded-xl border p-3" type="number" value={options.y ?? 40} onChange={(e) => setOptions((o) => ({ ...o, y: Number(e.target.value) }))} /></label>
          </div>
          <label className="block text-sm">Pages to apply<input className="mt-2 w-full rounded-xl border p-3" placeholder="Leave empty for all pages, or e.g. 1,3-5" value={pageInput} onChange={(e) => setPageInput(e.target.value)} /></label>
        </div>
      )}

      {id === "add-image-to-pdf" && (
        <div className="rounded-2xl border p-4 space-y-4">
          <div><h3 className="font-semibold">Image placement settings</h3><p className="text-xs text-muted-foreground">Choose an image, placement, size and target pages.</p></div>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="w-full rounded-xl border p-3 text-sm" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const bitmap = await createImageBitmap(file);
              try {
                const canvas = document.createElement("canvas");
                canvas.width = bitmap.width; canvas.height = bitmap.height;
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas is unavailable.");
                context.drawImage(bitmap, 0, 0);
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
                if (!blob) throw new Error("The image could not be decoded.");
                const imageBytes = new Uint8Array(await blob.arrayBuffer());
                setOptions((o) => ({ ...o, imageBytes, imageMimeType: "image/png" }));
              } finally { bitmap.close(); }
            } catch (e) { setError(e instanceof Error ? e.message : "The image could not be loaded."); }
          }} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">Position<select className="mt-2 w-full rounded-xl border p-3" value={options.imagePosition ?? "center"} onChange={(e) => setOptions((o) => ({ ...o, imagePosition: e.target.value as PdfProcessOptions["imagePosition"] }))}>{["top-left","top-center","top-right","center-left","center","center-right","bottom-left","bottom-center","bottom-right"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-sm">Size<input className="mt-2 w-full" type="range" min="5" max="100" value={options.imageScale ?? 35} onChange={(e) => setOptions((o) => ({ ...o, imageScale: Number(e.target.value) }))} /></label>
            <label className="text-sm">Opacity<input className="mt-2 w-full" type="range" min="0" max="100" value={options.imageOpacity ?? 100} onChange={(e) => setOptions((o) => ({ ...o, imageOpacity: Number(e.target.value) }))} /></label>
            <label className="text-sm">Margin<input className="mt-2 w-full rounded-xl border p-3" type="number" min="0" max="200" value={options.imageMargin ?? 24} onChange={(e) => setOptions((o) => ({ ...o, imageMargin: Number(e.target.value) }))} /></label>
            <label className="text-sm">Custom X (optional)<input className="mt-2 w-full rounded-xl border p-3" type="number" placeholder="Auto" value={options.imageX ?? ""} onChange={(e) => setOptions((o) => ({ ...o, imageX: e.target.value === "" ? undefined : Number(e.target.value) }))} /></label>
            <label className="text-sm">Custom Y (optional)<input className="mt-2 w-full rounded-xl border p-3" type="number" placeholder="Auto" value={options.imageY ?? ""} onChange={(e) => setOptions((o) => ({ ...o, imageY: e.target.value === "" ? undefined : Number(e.target.value) }))} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.imageKeepAspectRatio ?? true} onChange={(e) => setOptions((o) => ({ ...o, imageKeepAspectRatio: e.target.checked }))} /> Keep aspect ratio</label>
          <label className="block text-sm">Pages to apply<input className="mt-2 w-full rounded-xl border p-3" placeholder="Leave empty for all pages, or e.g. 1,3-5" value={pageInput} onChange={(e) => setPageInput(e.target.value)} /></label>
        </div>
      )}

      {["pdf-highlight-tool","pdf-whiteout-tool"].includes(id) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border p-3" type="number" placeholder="X" value={options.x ?? 40} onChange={(e) => setOptions((o) => ({ ...o, x: Number(e.target.value) }))} />
          <input className="rounded-xl border p-3" type="number" placeholder="Y" value={options.y ?? 40} onChange={(e) => setOptions((o) => ({ ...o, y: Number(e.target.value) }))} />
        </div>
      )}

      {busy && (
        <div className="rounded-xl border p-4" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          <p className="mt-2 text-sm">{Math.round(progress * 100)}% — {message}</p>
        </div>
      )}

      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</div>}

      {result?.metadata && (
        <pre className="max-h-96 overflow-auto rounded-xl border bg-muted p-4 text-xs">{JSON.stringify(result.metadata, null, 2)}</pre>
      )}

      {result?.text && (
        <div className="rounded-xl border p-4">
          <pre className="whitespace-pre-wrap break-all text-sm">{result.text}</pre>
          <button type="button" className="mt-3 rounded-lg border px-3 py-2" onClick={() => void navigator.clipboard?.writeText(result.text!)}>Copy</button>
        </div>
      )}

      {viewerUrl && (
        <div className="rounded-xl border bg-muted/30 p-2 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-semibold">PDF Viewer</h3><p className="text-xs text-muted-foreground">Browser-native rendering is avoided so the viewer also works on mobile browsers.</p></div>
            <span className="text-xs text-muted-foreground">{Object.keys(viewerPages).length}/{viewerPageCount || "…"} pages rendered</span>
          </div>
          {viewerBusy && <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${viewerPageCount ? Math.round((Object.keys(viewerPages).length / viewerPageCount) * 100) : 8}%` }} /></div>}
          <div className="space-y-4">
            {Array.from({ length: viewerPageCount }, (_, index) => (
              <div
                key={index}
                ref={(element) => { viewerPageRefs.current[index] = element; }}
                data-page-index={index}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                {viewerPages[index] ? <Image src={viewerPages[index]} alt={`PDF page ${index + 1}`} width={1200} height={1600} unoptimized className="mx-auto h-auto w-full max-w-5xl" /> : <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted-foreground">Rendering page {index + 1}…</div>}
                <div className="border-t px-3 py-2 text-center text-xs text-muted-foreground">Page {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.images && <PdfImageResults images={result.images} />}

      {result?.blob && id !== "pdf-viewer" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
          <span className="text-sm text-muted-foreground">{result.filename} • {formatBytes(result.size ?? result.blob.size)}</span>
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={() => downloadBlob(result.blob!, result.filename ?? "workabhi.pdf")}>Download</button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50" onClick={() => void handleProcess()}>{busy ? "Processing…" : "Process PDF"}</button>
        {busy && <button type="button" className="rounded-xl border px-5 py-3" onClick={() => abortRef.current?.abort()}>Cancel</button>}
        <button type="button" className="rounded-xl border px-5 py-3" onClick={reset}>Reset</button>
      </div>

      <p className="text-xs text-muted-foreground">Privacy: selected files are processed locally in your browser. No PDF upload is performed by this module.</p>
    </section>
  );
}


function PdfImageResults({ images }: { images: NonNullable<PdfOutput["images"]> }) {
  const urls = useMemo(() => {
    const next: Record<number, string> = {};
    for (const image of images) next[image.pageIndex] = URL.createObjectURL(image.blob);
    return next;
  }, [images]);

  useEffect(() => {
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [urls]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {images.map((image) => {
        const url = urls[image.pageIndex];
        return (
          <div key={image.pageIndex} className="rounded-xl border p-2">
            {url && (
              <Image
                src={url}
                alt={`PDF page ${image.pageIndex + 1}`}
                width={800}
                height={1100}
                unoptimized
                className="h-auto w-full"
              />
            )}
            <button type="button" className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" onClick={() => downloadBlob(image.blob, image.filename)}>Download page {image.pageIndex + 1}</button>
          </div>
        );
      })}
    </div>
  );
}
