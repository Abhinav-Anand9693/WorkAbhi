"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { PdfToolId, PdfProcessOptions, PdfOutput } from "@/engine/pdf/pdfTypes";
import { PdfEngineError } from "@/engine/pdf/pdfTypes";
import { processPdf, inspectPdf } from "@/engine/pdf/pdfEngine";
import { renderPdfPage } from "@/engine/pdf/pdfRender";

const PDF_TOOLS = new Set<PdfToolId>([
  "merge-pdf","split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages",
  "duplicate-pdf-pages","reverse-pdf-pages","pdf-page-numbering","pdf-page-organizer","pdf-viewer",
  "pdf-metadata-viewer","remove-pdf-metadata","pdf-watermark","pdf-stamp","add-text-to-pdf",
  "add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool",
  "pdf-whiteout-tool","pdf-form-filler","pdf-checkbox-filler","pdf-radio-button-filler","pdf-flatten-tool",
  "jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf","text-to-pdf",
  "pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-images","pdf-pages-to-images","pdf-password-generator",
  "pdf-hash-generator","pdf-file-integrity-checker","pdf-metadata-cleaner","pdf-privacy-cleaner","pdf-security-checker",
]);

const PAGE_TOOLS = new Set<PdfToolId>([
  "split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages",
  "reverse-pdf-pages","pdf-page-numbering","pdf-page-organizer","pdf-watermark","pdf-stamp","add-text-to-pdf",
  "add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool","pdf-whiteout-tool",
]);

const IMAGE_TO_PDF = new Set<PdfToolId>(["jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf"]);
const IMAGE_OUTPUT_IDS = new Set<PdfToolId>(["pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-images","pdf-pages-to-images"]);
const FORM_TOOLS = new Set<PdfToolId>(["pdf-form-filler","pdf-checkbox-filler","pdf-radio-button-filler","pdf-flatten-tool"]);
const DESTRUCTIVE = new Set<PdfToolId>(["delete-pdf-pages","rotate-pdf","reverse-pdf-pages","reorder-pdf-pages","pdf-page-organizer","duplicate-pdf-pages"]);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB","MB","GB"];
  let value = bytes / 1024, unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) { value /= 1024; unit = units[i]; }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

function parsePages(value: string, pageCount?: number) {
  const result: number[] = [];
  const tokens = value.split(",").map((x) => x.trim()).filter(Boolean);
  if (!tokens.length) throw new Error("Enter at least one page.");
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const n = Number(token) - 1;
      if (pageCount !== undefined && (n < 0 || n >= pageCount)) throw new Error(`Page ${n + 1} is outside the PDF.`);
      result.push(n);
    } else if (/^\d+\s*-\s*\d+$/.test(token)) {
      const [a,b] = token.split("-").map((x) => Number(x.trim()));
      const start = Math.min(a,b), end = Math.max(a,b);
      if (pageCount !== undefined && (start < 1 || end > pageCount)) throw new Error(`Page range ${token} is outside the PDF.`);
      for (let n = start; n <= end; n++) result.push(n - 1);
    } else throw new Error(`Invalid page selection: ${token}`);
  }
  return [...new Set(result)];
}

function parseGroups(value: string, pageCount: number) {
  const groups = value.split(";").map((x) => x.trim()).filter(Boolean).map((x) => parsePages(x, pageCount));
  if (!groups.length) throw new Error("Enter split groups, for example: 1-3;4-6;7");
  return groups;
}

function bytesFromDataUrl(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime: header.match(/^data:([^;]+)/)?.[1] ?? "image/png" };
}

interface PDFToolProps { toolId: string; }
interface FormFieldInfo { name: string; type: string; options?: string[]; }

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
  const [pageOrderInput, setPageOrderInput] = useState("");
  const [splitGroupsInput, setSplitGroupsInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormFieldInfo[]>([]);
  const [formValues, setFormValues] = useState<Record<string,string|boolean>>({});
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<Array<{x1:number;y1:number;x2:number;y2:number}>>([]);
  const [drawingStart, setDrawingStart] = useState<{x:number;y:number}|null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const thumbnailBusy = useRef(new Set<number>());

  const needsPdf = !IMAGE_TO_PDF.has(id) && id !== "text-to-pdf" && id !== "pdf-password-generator";
  const needsImages = IMAGE_TO_PDF.has(id);
  const pageTool = PAGE_TOOLS.has(id);

  useEffect(() => () => { abortRef.current?.abort(); }, []);
  useEffect(() => () => { if (viewerUrl) URL.revokeObjectURL(viewerUrl); }, [viewerUrl]);
  useEffect(() => () => { if (signaturePreview) URL.revokeObjectURL(signaturePreview); }, [signaturePreview]);

  async function loadFileSelection(next: File[]) {
    setError(""); setResult(null); setPageImages({}); setFormFields([]); setFormValues({});
    if (!next.length) return;
    if (needsPdf && next.some((file) => file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) return setError("Please select PDF files.");
    if (next.some((file) => file.size <= 0)) return setError("One of the selected files is empty.");
    if (next.some((file) => file.size > 256 * 1024 * 1024)) return setError("A selected file is too large for safe browser processing.");
    if (!needsImages && id !== "merge-pdf" && next.length > 1 && !FORM_TOOLS.has(id)) return setError("This tool accepts one PDF at a time.");
    setFiles(next);
    if (needsPdf) {
      try {
        const info = await inspectPdf(next[0]);
        const count = Number(info.pageCount ?? 0);
        setPages(Array.from({length:count},(_,i)=>i));
        setSelected([]);
        setFormFields(Array.isArray(info.formFields) ? info.formFields as FormFieldInfo[] : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The PDF could not be opened.");
      }
    }
  }

  async function renderThumbnail(index: number) {
    if (!files[0] || pageImages[index] || thumbnailBusy.current.has(index)) return;
    thumbnailBusy.current.add(index);
    try {
      const dataUrl = await renderPdfPage(files[0], index, 0.42);
      setPageImages((current) => ({...current, [index]: dataUrl}));
    } catch { /* preview failure never blocks processing */ }
    finally { thumbnailBusy.current.delete(index); }
  }

  function togglePage(index:number) {
    setSelected((current) => current.includes(index) ? current.filter((p)=>p!==index) : [...current,index]);
  }

  function setOption<K extends keyof PdfProcessOptions>(key: K, value: PdfProcessOptions[K]) {
    setOptions((current) => ({...current, [key]: value}));
  }

  async function loadImageForTool(file: File, key: "imageBytes"|"signatureBytes") {
    if (file.size > 20 * 1024 * 1024) throw new Error("Image must be 20 MB or smaller.");
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable.");
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bitmap,0,0);
      const blob = await new Promise<Blob|null>((resolve)=>canvas.toBlob(resolve,"image/png"));
      if (!blob) throw new Error("Could not encode the image.");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      setOption(key, bytes);
      if (key === "imageBytes") setOption("imageMimeType","image/png");
      if (key === "signatureBytes") {
        if (signaturePreview) URL.revokeObjectURL(signaturePreview);
        setSignaturePreview(URL.createObjectURL(blob));
      }
    } finally { bitmap.close(); }
  }

  async function handleProcess() {
    setError(""); setResult(null); abortRef.current?.abort();
    const controller = new AbortController(); abortRef.current = controller;
    setBusy(true); setProgress(0); setMessage("");
    try {
      const processOptions: PdfProcessOptions = {...options, formValues, drawing};
      if (textValue) {
        processOptions.text = textValue;
        processOptions.watermarkText = textValue;
        processOptions.stampText = textValue;
      }
      if (passwordLength) processOptions.passwordLength = Number(passwordLength);

      if (id === "split-pdf" && splitGroupsInput.trim()) processOptions.pageGroups = parseGroups(splitGroupsInput, pages.length);
      else if (pageOrderInput.trim() && (id === "reorder-pdf-pages" || id === "pdf-page-organizer")) processOptions.pageOrder = parsePages(pageOrderInput, pages.length);
      else if (pageInput.trim()) {
        const parsed = parsePages(pageInput, pages.length);
        if (IMAGE_OUTPUT_IDS.has(id)) processOptions.pageIndices = parsed;
        else processOptions.pages = parsed;
      }
      else if (pageTool && selected.length) processOptions.pages = selected;

      if (DESTRUCTIVE.has(id) && !processOptions.pages?.length && !processOptions.pageOrder?.length && id !== "split-pdf") {
        throw new Error("Select pages first. This prevents accidental changes to the whole document.");
      }
      if (id === "duplicate-pdf-pages") {
        if (!processOptions.pages?.length) throw new Error("Select the page you want to duplicate.");
        processOptions.duplicatePage = processOptions.pages[0];
        processOptions.duplicatePosition = Number(options.duplicatePosition ?? processOptions.duplicatePage + 1);
      }

      if (id === "pdf-drawing-tool" && !drawing.length) throw new Error("Draw at least one line on the canvas.");
      if (id === "add-image-to-pdf" && !processOptions.imageBytes) throw new Error("Choose an image first.");
      if (id === "add-signature-to-pdf" && !processOptions.signatureBytes) throw new Error("Choose a signature image first.");

      if (id !== "pdf-password-generator" && !files.length) throw new PdfEngineError("INVALID_INPUT","Select a file first.");
      const output = await processPdf(id, files, processOptions, controller.signal, (p) => {
        setProgress(p.progress); setMessage(p.message);
      });
      setResult(output);
      if (output.blob && id === "pdf-viewer") {
        if (viewerUrl) URL.revokeObjectURL(viewerUrl);
        setViewerUrl(URL.createObjectURL(output.blob));
      }
      setProgress(1); setMessage("Completed");
    } catch (e) {
      setError(e instanceof PdfEngineError || e instanceof Error ? e.message : "PDF processing failed.");
    } finally {
      setBusy(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    Object.values(pageImages).forEach((url)=>URL.revokeObjectURL(url));
    if (signaturePreview) URL.revokeObjectURL(signaturePreview);
    setViewerUrl(null); setSignaturePreview(null); setFiles([]); setPages([]); setSelected([]);
    setPageImages({}); setResult(null); setError(""); setProgress(0); setMessage("");
    setTextValue(""); setPageInput(""); setPageOrderInput(""); setSplitGroupsInput(""); setOptions({});
    setFormFields([]); setFormValues({}); setDrawing([]);
    if (inputRef.current) inputRef.current.value="";
    if (imageInputRef.current) imageInputRef.current.value="";
    if (signatureInputRef.current) signatureInputRef.current.value="";
  }

  function drawPointer(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const point = {x:(e.clientX-rect.left)*(canvas.width/rect.width), y:(e.clientY-rect.top)*(canvas.height/rect.height)};
    if (!drawingStart) { setDrawingStart(point); return; }
    setDrawing((current)=>[...current,{x1:drawingStart.x,y1:drawingStart.y,x2:point.x,y2:point.y}]);
    setDrawingStart(point);
    const ctx=canvas.getContext("2d");
    if (ctx) { ctx.strokeStyle=options.color ?? "#ef4444"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(drawingStart.x,drawingStart.y); ctx.lineTo(point.x,point.y); ctx.stroke(); }
  }

  if (!PDF_TOOLS.has(id)) return <div className="rounded-2xl border p-6">Unsupported PDF tool.</div>;

  const showPagesInput = ["delete-pdf-pages","extract-pdf-pages","rotate-pdf","reverse-pdf-pages"].includes(id) || IMAGE_OUTPUT_IDS.has(id);
  const showPageOrder = ["reorder-pdf-pages","pdf-page-organizer"].includes(id);
  const showAnnotation = ["pdf-watermark","pdf-stamp","add-text-to-pdf","pdf-annotation-tool","pdf-highlight-tool","pdf-whiteout-tool","add-image-to-pdf","add-signature-to-pdf"].includes(id);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed p-6 text-center transition hover:border-primary" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();void loadFileSelection(Array.from(e.dataTransfer.files));}}>
        <input ref={inputRef} type="file" accept={needsImages ? "image/*" : "application/pdf,.pdf"} multiple={id==="merge-pdf"||id==="images-to-pdf"} className="sr-only" onChange={(e)=>void loadFileSelection(Array.from(e.target.files??[]))}/>
        <button type="button" className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={()=>inputRef.current?.click()}>Select {needsImages ? "image" : "PDF"} file{needsImages ? "s" : ""}</button>
        <p className="mt-2 text-sm text-muted-foreground">Files stay in your browser. Nothing is uploaded by this module.</p>
        {files.length>0&&<p className="mt-3 text-sm">{files.map((f)=>`${f.name} (${formatBytes(f.size)})`).join(" • ")}</p>}
      </div>

      {id==="text-to-pdf"&&<textarea className="min-h-52 w-full rounded-xl border p-4" value={textValue} onChange={(e)=>setTextValue(e.target.value)} placeholder="Enter text to convert to PDF"/>}
      {id==="pdf-password-generator"&&<label className="block text-sm">Password length<input className="mt-2 w-full rounded-xl border p-3" type="number" min={8} max={128} value={passwordLength} onChange={(e)=>setPasswordLength(e.target.value)}/></label>}

      {pageTool&&files.length>0&&pages.length>0&&<div className="rounded-2xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">PDF Page Workspace</h2><p className="text-sm text-muted-foreground">Choose pages explicitly for page operations.</p></div><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={()=>setSelected(selected.length===pages.length?[]:pages)}>Select all</button></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{pages.map((index)=><button key={index} type="button" className={`overflow-hidden rounded-xl border text-left ${selected.includes(index)?"ring-2 ring-primary":""}`} onClick={()=>{togglePage(index);void renderThumbnail(index);}} onFocus={()=>void renderThumbnail(index)}>{pageImages[index]?<Image src={pageImages[index]} alt={`Page ${index+1} preview`} width={600} height={800} unoptimized className="aspect-[3/4] w-full object-cover"/>:<div className="flex aspect-[3/4] items-center justify-center bg-muted text-sm">Page {index+1}</div>}<div className="p-2 text-xs">Page {index+1}</div></button>)}</div>
      </div>}

      {showPagesInput&&<label className="block text-sm">{IMAGE_OUTPUT_IDS.has(id) ? "Pages (optional; leave empty for all pages)" : "Pages"}<input className="mt-2 w-full rounded-xl border p-3" placeholder="Example: 1,3-5" value={pageInput} onChange={(e)=>setPageInput(e.target.value)}/></label>}
      {id==="split-pdf"&&<label className="block text-sm">Split groups<input className="mt-2 w-full rounded-xl border p-3" placeholder="Example: 1-3;4-6;7" value={splitGroupsInput} onChange={(e)=>setSplitGroupsInput(e.target.value)}/><span className="mt-1 block text-xs text-muted-foreground">Use semicolons to create separate PDF outputs.</span></label>}
      {showPageOrder&&<label className="block text-sm">Complete page order<input className="mt-2 w-full rounded-xl border p-3" placeholder="Example: 3,1,2,4" value={pageOrderInput} onChange={(e)=>setPageOrderInput(e.target.value)}/></label>}
      {id==="duplicate-pdf-pages"&&<label className="block text-sm">Duplicate insertion position<input className="mt-2 w-full rounded-xl border p-3" type="number" min={1} max={Math.max(1,pages.length+1)} value={Number(options.duplicatePosition ?? ((selected[0]??0)+2))} onChange={(e)=>setOption("duplicatePosition",Math.max(0,Number(e.target.value)-1))}/></label>}

      {id==="pdf-page-numbering"&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Starting number<input className="mt-1 w-full rounded-xl border p-3" type="number" min={0} value={options.pageNumberStart??1} onChange={(e)=>setOption("pageNumberStart",Number(e.target.value))}/></label><label className="text-sm">Position<select className="mt-1 w-full rounded-xl border p-3" value={options.pageNumberPosition??"bottom-center"} onChange={(e)=>setOption("pageNumberPosition",e.target.value as PdfProcessOptions["pageNumberPosition"])}>{["top-left","top-center","top-right","bottom-left","bottom-center","bottom-right"].map((p)=><option key={p} value={p}>{p}</option>)}</select></label></div>}\n\n{id==="rotate-pdf"&&<label className="block text-sm">Rotation<select className="mt-2 rounded-xl border p-3" value={options.rotate??90} onChange={(e)=>setOption("rotate",Number(e.target.value) as 90|180|270)}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>}

      {["pdf-watermark","pdf-stamp","add-text-to-pdf","pdf-annotation-tool"].includes(id)&&<div className="grid gap-3 sm:grid-cols-2"><input className="rounded-xl border p-3" placeholder="Text" value={textValue} onChange={(e)=>setTextValue(e.target.value)}/><input className="rounded-xl border p-3" type="number" min="6" max="96" value={options.fontSize??18} onChange={(e)=>setOption("fontSize",Number(e.target.value))}/></div>}

      {showAnnotation&&<div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">X<input className="mt-1 w-full rounded-xl border p-3" type="number" value={options.x??40} onChange={(e)=>setOption("x",Number(e.target.value))}/></label>
        <label className="text-sm">Y<input className="mt-1 w-full rounded-xl border p-3" type="number" value={options.y??40} onChange={(e)=>setOption("y",Number(e.target.value))}/></label>
        <label className="text-sm">Opacity<input className="mt-1 w-full" type="range" min={0} max={100} value={Math.round((options.opacity??0.35)*100)} onChange={(e)=>setOption("opacity",Number(e.target.value)/100)}/></label>
        <label className="text-sm">Color<input className="mt-1 h-10 w-full rounded border" type="color" value={options.color??"#ef4444"} onChange={(e)=>setOption("color",e.target.value)}/></label>
      </div>}

      {["pdf-highlight-tool","pdf-whiteout-tool"].includes(id)&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Width<input className="mt-1 w-full rounded-xl border p-3" type="number" min={10} value={options.whiteout?.width??180} onChange={(e)=>setOption("whiteout",{x:options.x??40,y:options.y??40,width:Number(e.target.value),height:options.whiteout?.height??40})}/></label><label className="text-sm">Height<input className="mt-1 w-full rounded-xl border p-3" type="number" min={10} value={options.whiteout?.height??40} onChange={(e)=>setOption("whiteout",{x:options.x??40,y:options.y??40,width:options.whiteout?.width??180,height:Number(e.target.value)})}/></label></div>}

      {id==="add-image-to-pdf"&&<div className="rounded-2xl border p-4 space-y-4"><input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" onChange={async(e)=>{try{const f=e.target.files?.[0];if(f)await loadImageForTool(f,"imageBytes");}catch(err){setError(err instanceof Error?err.message:"Image could not be loaded.");}}}/><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Position<select className="mt-1 w-full rounded-xl border p-3" value={options.imagePosition??"center"} onChange={(e)=>setOption("imagePosition",e.target.value as PdfProcessOptions["imagePosition"])}>{["top-left","top-center","top-right","center-left","center","center-right","bottom-left","bottom-center","bottom-right"].map((p)=><option key={p} value={p}>{p}</option>)}</select></label><label className="text-sm">Size<input className="mt-1 w-full" type="range" min={5} max={100} value={options.imageScale??35} onChange={(e)=>setOption("imageScale",Number(e.target.value))}/><span className="text-xs">{options.imageScale??35}% page width</span></label><label className="text-sm">Transparency<input className="mt-1 w-full" type="range" min={0} max={100} value={100-(options.imageOpacity??100)} onChange={(e)=>setOption("imageOpacity",100-Number(e.target.value))}/></label><label className="text-sm">Margin<input className="mt-1 w-full rounded-xl border p-3" type="number" min={0} value={options.imageMargin??24} onChange={(e)=>setOption("imageMargin",Number(e.target.value))}/></label></div></div>}

      {id==="add-signature-to-pdf"&&<div className="rounded-2xl border p-4 space-y-3"><input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={async(e)=>{try{const f=e.target.files?.[0];if(f)await loadImageForTool(f,"signatureBytes");}catch(err){setError(err instanceof Error?err.message:"Signature could not be loaded.");}}}/>{signaturePreview&&<Image src={signaturePreview} alt="Signature preview" width={320} height={120} unoptimized className="max-h-28 w-auto border object-contain"/>}<label className="text-sm">Signature size<input className="mt-1 w-full" type="range" min={5} max={100} value={options.imageScale??35} onChange={(e)=>setOption("imageScale",Number(e.target.value))}/></label></div>}

      {id==="pdf-drawing-tool"&&<div className="rounded-2xl border p-4"><p className="mb-2 text-sm text-muted-foreground">Draw on the canvas, then select the target pages.</p><canvas ref={drawingCanvasRef} width={595} height={842} className="mx-auto block w-full max-w-xl touch-none rounded border bg-white" onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);drawPointer(e)}} onPointerMove={(e)=>{if(e.buttons===1)drawPointer(e)}} onPointerUp={()=>setDrawingStart(null)}/><button type="button" className="mt-3 rounded-lg border px-3 py-2" onClick={()=>{setDrawing([]);const c=drawingCanvasRef.current;c?.getContext("2d")?.clearRect(0,0,c.width,c.height)}}>Clear drawing</button></div>}

      {FORM_TOOLS.has(id)&&formFields.length>0&&<div className="rounded-2xl border p-4 space-y-3"><h3 className="font-semibold">Form fields</h3>{formFields.map((field)=><label key={field.name} className="block text-sm"><span>{field.name} <span className="text-xs text-muted-foreground">({field.type})</span></span>{field.type.includes("CheckBox")?<input className="ml-3 h-4 w-4" type="checkbox" checked={Boolean(formValues[field.name])} onChange={(e)=>setFormValues(v=>({...v,[field.name]:e.target.checked}))}/>:field.options?.length?<select className="mt-1 w-full rounded-xl border p-3" value={String(formValues[field.name]??"")} onChange={(e)=>setFormValues(v=>({...v,[field.name]:e.target.value}))}><option value="">Select…</option>{field.options.map((o)=><option key={o} value={o}>{o}</option>)}</select>:<input className="mt-1 w-full rounded-xl border p-3" value={String(formValues[field.name]??"")} onChange={(e)=>setFormValues(v=>({...v,[field.name]:e.target.value}))}/>}</label>)}</div>}

      {FORM_TOOLS.has(id)&&files.length>0&&formFields.length===0&&<div className="rounded-xl border p-4 text-sm text-muted-foreground">No standard AcroForm fields were found. XFA-only forms are not editable by pdf-lib.</div>}

      {busy&&<div className="rounded-xl border p-4" role="status"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{width:`${Math.round(progress*100)}%`}}/></div><p className="mt-2 text-sm">{Math.round(progress*100)}% — {message}</p></div>}
      {error&&<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</div>}
      {result?.metadata&&<pre className="max-h-96 overflow-auto rounded-xl border bg-muted p-4 text-xs">{JSON.stringify(result.metadata,null,2)}</pre>}
      {result?.text&&<div className="rounded-xl border p-4"><pre className="whitespace-pre-wrap break-all text-sm">{result.text}</pre><button type="button" className="mt-3 rounded-lg border px-3 py-2" onClick={()=>void navigator.clipboard?.writeText(result.text!)}>Copy</button></div>}
      {viewerUrl&&<div className="space-y-2"><div className="overflow-hidden rounded-xl border"><iframe title="PDF preview" src={viewerUrl} className="h-[70vh] w-full"/></div><p className="text-xs text-muted-foreground">If your browser does not display PDFs in the embedded viewer, use the original-file download below.</p></div>}
      {result?.images&&<PdfImageResults images={result.images}/>}
      {result?.outputs&&<div className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">Generated PDFs ({result.outputs.length})</h3><div className="space-y-2">{result.outputs.map((out)=><div key={out.filename} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><span className="text-sm">{out.filename} • {formatBytes(out.size??out.blob?.size??0)}</span>{out.blob&&<button type="button" className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={()=>downloadBlob(out.blob!,out.filename??"workabhi.pdf")}>Download</button>}</div>)}</div></div>}
      {result?.blob&&<div className="flex flex-wrap items-center gap-3 rounded-xl border p-4"><span className="text-sm text-muted-foreground">{result.filename} • {formatBytes(result.size??result.blob.size)}</span><button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={()=>downloadBlob(result.blob!,result.filename??"workabhi.pdf")}>Download</button></div>}

      <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50" onClick={()=>void handleProcess()}>{busy?"Processing…":"Process PDF"}</button>{busy&&<button type="button" className="rounded-xl border px-5 py-3" onClick={()=>abortRef.current?.abort()}>Cancel</button>}<button type="button" className="rounded-xl border px-5 py-3" onClick={reset}>Reset</button></div>
      <p className="text-xs text-muted-foreground">Privacy-first: PDF processing is performed locally in the browser. Complex XFA, digital-signature validation, and malware scanning are outside this browser-only engine.</p>
    </section>
  );
}

function PdfImageResults({images}:{images:NonNullable<PdfOutput["images"]>}) {
  const urls=useMemo(()=>Object.fromEntries(images.map((image)=>[image.pageIndex,URL.createObjectURL(image.blob)])),[images]);
  useEffect(()=>()=>Object.values(urls).forEach((url)=>URL.revokeObjectURL(url)),[urls]);
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{images.map((image)=>{const url=urls[image.pageIndex];return <div key={image.pageIndex} className="rounded-xl border p-2">{url&&<Image src={url} alt={`PDF page ${image.pageIndex+1}`} width={800} height={1100} unoptimized className="h-auto w-full"/>}<button type="button" className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" onClick={()=>downloadBlob(image.blob,image.filename)}>Download page {image.pageIndex+1}</button></div>})}</div>;
}
