"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { PdfOutput, PdfProcessOptions, PdfToolId } from "@/engine/pdf/pdfTypes";
import { PdfEngineError } from "@/engine/pdf/pdfTypes";
import { inspectPdf, processPdf } from "@/engine/pdf/pdfEngine";
import { releasePdfDocument, renderPdfPage } from "@/engine/pdf/pdfRender";

const IDS = new Set<PdfToolId>([
  "merge-pdf","split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages","reverse-pdf-pages","pdf-page-numbering","pdf-page-organizer","pdf-viewer","pdf-metadata-viewer","remove-pdf-metadata","pdf-watermark","pdf-stamp","add-text-to-pdf","add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool","pdf-whiteout-tool","pdf-form-filler","pdf-checkbox-filler","pdf-radio-button-filler","pdf-flatten-tool","jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf","text-to-pdf","pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-images","pdf-pages-to-images","pdf-password-generator","pdf-hash-generator","pdf-file-integrity-checker","pdf-metadata-cleaner","pdf-privacy-cleaner","pdf-security-checker",
]);
const IMAGE_INPUT=new Set<PdfToolId>(["jpg-to-pdf","png-to-pdf","webp-to-pdf","bmp-to-pdf","tiff-to-pdf","images-to-pdf"]);
const IMAGE_OUTPUT=new Set<PdfToolId>(["pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-images","pdf-pages-to-images"]);
const PAGE_WORK=new Set<PdfToolId>(["split-pdf","rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages","reverse-pdf-pages","pdf-page-organizer","pdf-watermark","pdf-stamp","add-text-to-pdf","add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool","pdf-whiteout-tool"]);
const FORM=new Set<PdfToolId>(["pdf-form-filler","pdf-checkbox-filler","pdf-radio-button-filler","pdf-flatten-tool"]);

function bytes(n:number){if(!Number.isFinite(n))return "—";const u=["B","KB","MB","GB"];let x=n,i=0;while(x>=1024&&i<u.length-1){x/=1024;i++;}return `${x.toFixed(x>=100||i===0?0:1)} ${u[i]}`;}
function parsePages(s:string,count:number){const out:number[]=[];for(const t of s.split(",").map(x=>x.trim()).filter(Boolean)){if(/^\d+$/.test(t)){const n=+t-1;if(n<0||n>=count)throw new Error(`Page ${+t} is outside the PDF.`);out.push(n);}else if(/^\d+\s*-\s*\d+$/.test(t)){const [a,b]=t.split("-").map(Number),lo=Math.min(a,b),hi=Math.max(a,b);if(lo<1||hi>count)throw new Error(`Page range ${t} is outside the PDF.`);for(let n=lo;n<=hi;n++)out.push(n-1);}else throw new Error(`Invalid page selection: ${t}`);}return [...new Set(out)];}
function parseGroups(s:string,count:number){const g=s.split(";").map(x=>x.trim()).filter(Boolean).map(x=>parsePages(x,count));if(!g.length)throw new Error("Enter groups such as 1-3;4-6;7.");return g;}
function download(blob:Blob,name:string){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30_000);}

export default function PDFTool({toolId}:{toolId:string}){return <PDFToolInstance key={toolId} toolId={toolId as PdfToolId}/>;}

function PDFToolInstance({toolId:id}:{toolId:PdfToolId}){
  const [files,setFiles]=useState<File[]>([]),[pages,setPages]=useState<number[]>([]),[selected,setSelected]=useState<number[]>([]),[thumbs,setThumbs]=useState<Record<number,string>>({});
  const [result,setResult]=useState<PdfOutput|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[progress,setProgress]=useState(0),[busy,setBusy]=useState(false);
  const [text,setText]=useState(""),[pagesText,setPagesText]=useState(""),[groupsText,setGroupsText]=useState(""),[orderText,setOrderText]=useState(""),[passwordLength,setPasswordLength]=useState(24);
  const [options,setOptions]=useState<PdfProcessOptions>({}),[formFields,setFormFields]=useState<Array<{name:string;type:string;options?:string[]}>>([]),[formValues,setFormValues]=useState<Record<string,string|boolean>>({});
  const [signature,setSignature]=useState<string|null>(null),[drawing,setDrawing]=useState<Array<{x1:number;y1:number;x2:number;y2:number}>>([]),[drawStart,setDrawStart]=useState<{x:number;y:number}|null>(null),[viewer,setViewer]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null),imageRef=useRef<HTMLInputElement>(null),sigRef=useRef<HTMLInputElement>(null),canvasRef=useRef<HTMLCanvasElement>(null),abortRef=useRef<AbortController|null>(null),thumbAbort=useRef(new AbortController()),busyThumb=useRef(new Set<number>());
  const needsPdf=!IMAGE_INPUT.has(id)&&id!=="text-to-pdf"&&id!=="pdf-password-generator";

  useEffect(()=>()=>{abortRef.current?.abort();thumbAbort.current.abort();if(files[0])void releasePdfDocument(files[0]);},[files]);
  useEffect(()=>()=>{if(viewer)URL.revokeObjectURL(viewer);},[viewer]);
  useEffect(()=>()=>{if(signature)URL.revokeObjectURL(signature);},[signature]);

  const clearThumbs=()=>{Object.values(thumbs).forEach(u=>URL.revokeObjectURL(u));setThumbs({});};
  async function selectFiles(next:File[]){
    setError("");setResult(null);clearThumbs();setSelected([]);setFormFields([]);setFormValues({});
    if(!next.length)return;
    if(needsPdf&&next.some(f=>f.type!=="application/pdf"&&!/\.pdf$/i.test(f.name)))return setError("Please select PDF files.");
    if(next.some(f=>f.size<=0))return setError("One of the selected files is empty.");
    if(next.some(f=>f.size>256*1024*1024)&&needsPdf)return setError("A PDF cannot exceed 256 MB.");
    if(IMAGE_INPUT.has(id)&&next.some(f=>f.size>20*1024*1024))return setError("Each image must be 20 MB or smaller.");
    const multi=id==="merge-pdf"||id==="images-to-pdf";
    if(next.length>1&&!multi)return setError("This tool accepts one file at a time.");
    setFiles(next);
    if(needsPdf){try{const info=await inspectPdf(next[0]);const n=Number(info.pageCount??0);setPages(Array.from({length:n},(_,i)=>i));setFormFields(Array.isArray(info.formFields)?info.formFields as never:[]);}catch(e){setFiles([]);setPages([]);setError(e instanceof Error?e.message:"The PDF could not be opened.");}}
  }
  async function thumb(i:number){if(!files[0]||thumbs[i]||busyThumb.current.has(i))return;busyThumb.current.add(i);try{const u=await renderPdfPage(files[0],i,.42,thumbAbort.current.signal);setThumbs(x=>({...x,[i]:u}));}catch{}finally{busyThumb.current.delete(i);}}
  function setOpt<K extends keyof PdfProcessOptions>(k:K,v:PdfProcessOptions[K]){setOptions(x=>({...x,[k]:v}));}
  async function loadImage(f:File,key:"imageBytes"|"signatureBytes"){if(f.size>20*1024*1024)throw new Error("Image must be 20 MB or smaller.");const b=await createImageBitmap(f);try{const c=document.createElement("canvas");c.width=b.width;c.height=b.height;const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas unavailable.");ctx.drawImage(b,0,0);const out=await new Promise<Blob|null>(r=>c.toBlob(r,"image/png"));if(!out)throw new Error("Could not decode image.");setOpt(key,new Uint8Array(await out.arrayBuffer()));if(key==="signatureBytes"){if(signature)URL.revokeObjectURL(signature);setSignature(URL.createObjectURL(out));}else setOpt("imageMimeType","image/png");}finally{b.close();}}
  async function process(){
    setError("");setResult(null);abortRef.current?.abort();const ac=new AbortController();abortRef.current=ac;setBusy(true);setProgress(0);setMessage("");
    try{
      const o:PdfProcessOptions={...options,formValues,drawing};if(text){o.text=text;o.watermarkText=text;o.stampText=text;}if(id==="pdf-password-generator")o.passwordLength=passwordLength;
      if(id==="split-pdf"&&groupsText.trim())o.pageGroups=parseGroups(groupsText,pages.length);
      else if((id==="reorder-pdf-pages"||id==="pdf-page-organizer")&&orderText.trim())o.pageOrder=parsePages(orderText,pages.length);
      else if(pagesText.trim()){const p=parsePages(pagesText,pages.length);if(IMAGE_OUTPUT.has(id))o.pageIndices=p;else o.pages=p;}
      else if(PAGE_WORK.has(id)&&selected.length)o.pages=selected;
      if(id==="duplicate-pdf-pages"){if(!o.pages?.length)throw new Error("Select a page first.");o.duplicatePage=o.pages[0];}
      if(id==="pdf-drawing-tool"&&!drawing.length)throw new Error("Draw at least one line.");
      if(id==="add-image-to-pdf"&&!o.imageBytes)throw new Error("Choose an image first.");
      if(id==="add-signature-to-pdf"&&!o.signatureBytes)throw new Error("Choose a signature image first.");
      if(needsPdf&&!files.length)throw new PdfEngineError("INVALID_INPUT","Select a file first.");
      const out=await processPdf(id,files,o,ac.signal,p=>{setProgress(p.progress);setMessage(p.message);});setResult(out);setProgress(1);setMessage("Completed");
      if(out.blob&&id==="pdf-viewer"){if(viewer)URL.revokeObjectURL(viewer);setViewer(URL.createObjectURL(out.blob));}
    }catch(e){setError(e instanceof Error?e.message:"PDF processing failed.");}finally{if(abortRef.current===ac)abortRef.current=null;setBusy(false);}
  }
  function reset(){abortRef.current?.abort();thumbAbort.current.abort();if(files[0])void releasePdfDocument(files[0]);clearThumbs();if(viewer)URL.revokeObjectURL(viewer);if(signature)URL.revokeObjectURL(signature);thumbAbort.current=new AbortController();setFiles([]);setPages([]);setSelected([]);setResult(null);setError("");setMessage("");setProgress(0);setText("");setPagesText("");setGroupsText("");setOrderText("");setOptions({});setFormFields([]);setFormValues({});setSignature(null);setDrawing([]);if(fileRef.current)fileRef.current.value="";if(imageRef.current)imageRef.current.value="";if(sigRef.current)sigRef.current.value="";}
  function pointer(e:PointerEvent<HTMLCanvasElement>){const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect(),p={x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};if(!drawStart){setDrawStart(p);return;}setDrawing(x=>[...x,{x1:drawStart.x,y1:drawStart.y,x2:p.x,y2:p.y}]);setDrawStart(p);const ctx=c.getContext("2d");if(ctx){ctx.strokeStyle=options.color??"#ef4444";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(drawStart.x,drawStart.y);ctx.lineTo(p.x,p.y);ctx.stroke();}}

  if(!IDS.has(id))return <div className="rounded-2xl border p-4">Unsupported PDF tool.</div>;
  const pageInput=["delete-pdf-pages","extract-pdf-pages","rotate-pdf","reverse-pdf-pages"].includes(id)||IMAGE_OUTPUT.has(id);
  const orderInput=["reorder-pdf-pages","pdf-page-organizer"].includes(id);
  const textInput=["pdf-watermark","pdf-stamp","add-text-to-pdf","pdf-annotation-tool"].includes(id);
  return <section className="w-full min-w-0 space-y-4 sm:space-y-6">
    <div className="rounded-2xl border-2 border-dashed p-4 text-center sm:p-6" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void selectFiles(Array.from(e.dataTransfer.files));}}>
      <input ref={fileRef} type="file" className="sr-only" accept={needsPdf?"application/pdf,.pdf":"image/*"} multiple={id==="merge-pdf"||id==="images-to-pdf"} onChange={e=>void selectFiles(Array.from(e.target.files??[]))}/>
      <button type="button" className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground sm:w-auto" onClick={()=>fileRef.current?.click()}>Select {needsPdf?"PDF":"image"} file{IMAGE_INPUT.has(id)?"s":""}</button>
      <p className="mt-2 text-xs text-muted-foreground sm:text-sm">Files are processed locally in your browser.</p>
      {files.length>0&&<div className="mt-3 break-words text-xs sm:text-sm">{files.map(f=>`${f.name} (${bytes(f.size)})`).join(" • ")}</div>}
    </div>

    {id==="text-to-pdf"&&<textarea className="min-h-48 w-full resize-y rounded-xl border p-3 text-sm sm:min-h-52 sm:p-4" value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text to convert to PDF"/>}
    {id==="pdf-password-generator"&&<label className="block text-sm">Password length<input className="mt-2 w-full rounded-xl border p-3" type="number" min={8} max={128} value={passwordLength} onChange={e=>setPasswordLength(Math.max(8,Math.min(128,+e.target.value||24)))}/></label>}

    {PAGE_WORK.has(id)&&files.length>0&&pages.length>0&&<div className="rounded-2xl border p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">PDF Page Workspace</h2><p className="text-xs text-muted-foreground sm:text-sm">Tap pages to select them.</p></div><button type="button" className="w-full rounded-lg border px-3 py-2 text-sm sm:w-auto" onClick={()=>setSelected(selected.length===pages.length?[]:pages)}>{selected.length===pages.length?"Clear all":"Select all"}</button></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">{pages.map(i=><button key={i} type="button" className={`min-w-0 overflow-hidden rounded-xl border text-left ${selected.includes(i)?"ring-2 ring-primary":""}`} onClick={()=>{setSelected(s=>s.includes(i)?s.filter(x=>x!==i):[...s,i]);void thumb(i)}} onFocus={()=>void thumb(i)}>{thumbs[i]?<Image src={thumbs[i]} alt={`Page ${i+1}`} width={500} height={700} unoptimized className="aspect-[3/4] w-full object-cover"/>:<div className="flex aspect-[3/4] items-center justify-center bg-muted text-xs">Page {i+1}</div>}<div className="truncate p-2 text-xs">Page {i+1}</div></button>)}</div>
    </div>}

    {pageInput&&<label className="block text-sm">Pages {IMAGE_OUTPUT.has(id)?"(optional)":"(required)"}<input className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Example: 1,3-5" value={pagesText} onChange={e=>setPagesText(e.target.value)}/></label>}
    {id==="split-pdf"&&<label className="block text-sm">Split groups<input className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Example: 1-3;4-6;7" value={groupsText} onChange={e=>setGroupsText(e.target.value)}/></label>}
    {orderInput&&<label className="block text-sm">Complete page order<input className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Example: 3,1,2,4" value={orderText} onChange={e=>setOrderText(e.target.value)}/></label>}
    {textInput&&<div className="grid gap-3 sm:grid-cols-2"><input className="w-full rounded-xl border p-3 text-sm" placeholder="Text" value={text} onChange={e=>setText(e.target.value)}/><input className="w-full rounded-xl border p-3 text-sm" type="number" min={6} max={96} value={options.fontSize??18} onChange={e=>setOpt("fontSize",+e.target.value)}/></div>}
    {(textInput||["pdf-highlight-tool","pdf-whiteout-tool","add-image-to-pdf","add-signature-to-pdf"].includes(id))&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">X<input className="mt-1 w-full rounded-xl border p-3" type="number" value={options.x??40} onChange={e=>setOpt("x",+e.target.value)}/></label><label className="text-sm">Y<input className="mt-1 w-full rounded-xl border p-3" type="number" value={options.y??40} onChange={e=>setOpt("y",+e.target.value)}/></label></div>}
    {["pdf-highlight-tool","pdf-whiteout-tool"].includes(id)&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Width<input className="mt-1 w-full rounded-xl border p-3" type="number" min={10} value={options.whiteout?.width??180} onChange={e=>setOpt("whiteout",{x:options.x??40,y:options.y??40,width:+e.target.value,height:options.whiteout?.height??40})}/></label><label className="text-sm">Height<input className="mt-1 w-full rounded-xl border p-3" type="number" min={10} value={options.whiteout?.height??40} onChange={e=>setOpt("whiteout",{x:options.x??40,y:options.y??40,width:options.whiteout?.width??180,height:+e.target.value})}/></label></div>}
    {id==="add-image-to-pdf"&&<div className="rounded-2xl border p-3 sm:p-4"><input ref={imageRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="w-full text-sm" onChange={async e=>{try{const f=e.target.files?.[0];if(f)await loadImage(f,"imageBytes")}catch(x){setError(x instanceof Error?x.message:"Image could not be loaded.")}}}/><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Position<select className="mt-1 w-full rounded-xl border p-3" value={options.imagePosition??"center"} onChange={e=>setOpt("imagePosition",e.target.value as PdfProcessOptions["imagePosition"])}>{["top-left","top-center","top-right","center-left","center","center-right","bottom-left","bottom-center","bottom-right"].map(p=><option key={p}>{p}</option>)}</select></label><label className="text-sm">Size<input className="mt-2 w-full" type="range" min={5} max={100} value={options.imageScale??35} onChange={e=>setOpt("imageScale",+e.target.value)}/></label></div></div>}
    {id==="add-signature-to-pdf"&&<div className="rounded-2xl border p-3 sm:p-4"><input ref={sigRef} type="file" accept="image/png,image/jpeg,image/webp" className="w-full text-sm" onChange={async e=>{try{const f=e.target.files?.[0];if(f)await loadImage(f,"signatureBytes")}catch(x){setError(x instanceof Error?x.message:"Signature could not be loaded.")}}}/>{signature&&<Image src={signature} alt="Signature preview" width={320} height={120} unoptimized className="mt-3 max-h-28 w-auto max-w-full border object-contain" />}<label className="mt-3 block text-sm">Signature size<input className="mt-2 w-full" type="range" min={5} max={100} value={options.imageScale??35} onChange={e=>setOpt("imageScale",+e.target.value)}/></label></div>}
    {id==="pdf-drawing-tool"&&<div className="rounded-2xl border p-3 sm:p-4"><canvas ref={canvasRef} width={595} height={842} className="mx-auto block h-auto w-full max-w-xl touch-none rounded border bg-white" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointer(e)}} onPointerMove={e=>{if(e.buttons===1)pointer(e)}} onPointerUp={()=>setDrawStart(null)}/><button type="button" className="mt-3 w-full rounded-lg border px-3 py-2 sm:w-auto" onClick={()=>{setDrawing([]);canvasRef.current?.getContext("2d")?.clearRect(0,0,595,842)}}>Clear drawing</button></div>}
    {FORM.has(id)&&formFields.length>0&&<div className="space-y-3 rounded-2xl border p-3 sm:p-4"><h3 className="font-semibold">Form fields</h3>{formFields.map(f=><label key={f.name} className="block text-sm"><span className="break-all">{f.name} <span className="text-xs text-muted-foreground">({f.type})</span></span>{f.type.includes("CheckBox")?<input className="ml-3 h-4 w-4 align-middle" type="checkbox" checked={Boolean(formValues[f.name])} onChange={e=>setFormValues(v=>({...v,[f.name]:e.target.checked}))}/>:f.options?.length?<select className="mt-1 w-full rounded-xl border p-3" value={String(formValues[f.name]??"")} onChange={e=>setFormValues(v=>({...v,[f.name]:e.target.value}))}><option value="">Select…</option>{f.options.map(x=><option key={x}>{x}</option>)}</select>:<input className="mt-1 w-full rounded-xl border p-3" value={String(formValues[f.name]??"")} onChange={e=>setFormValues(v=>({...v,[f.name]:e.target.value}))}/>}</label>)}</div>}
    {busy&&<div className="rounded-xl border p-3" role="status"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width] duration-150" style={{width:`${Math.round(progress*100)}%`}}/></div><p className="mt-2 break-words text-xs sm:text-sm">{Math.round(progress*100)}% — {message}</p></div>}
    {error&&<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</div>}
    {result?.metadata&&<pre className="max-h-96 overflow-auto rounded-xl border bg-muted p-3 text-xs">{JSON.stringify(result.metadata,null,2)}</pre>}
    {result?.text&&<div className="rounded-xl border p-3"><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs sm:text-sm">{result.text}</pre><button type="button" className="mt-3 w-full rounded-lg border px-3 py-2 sm:w-auto" onClick={()=>void navigator.clipboard?.writeText(result.text!)}>Copy</button></div>}
    {viewer&&<div className="overflow-hidden rounded-xl border"><iframe title="PDF preview" src={viewer} className="h-[55vh] w-full sm:h-[70vh]"/></div>}
    {result?.images&&<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">{result.images.map(im=><PdfImageCard key={im.pageIndex} image={im} />)}</div>}
    {result?.outputs&&<div className="space-y-2 rounded-xl border p-3"><h3 className="font-semibold">Generated PDFs ({result.outputs.length})</h3>{result.outputs.map((x,i)=><div key={`${x.filename}-${i}`} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><span className="break-all text-xs sm:text-sm">{x.filename} • {bytes(x.size??0)}</span>{x.blob&&<button type="button" className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground sm:w-auto" onClick={()=>download(x.blob!,x.filename??"workabhi.pdf")}>Download</button>}</div>)}</div>}
    {result?.blob&&<div className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><span className="break-all text-xs sm:text-sm">{result.filename} • {bytes(result.size??result.blob.size)}</span><button type="button" className="w-full rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground sm:w-auto" onClick={()=>download(result.blob!,result.filename??"workabhi.pdf")}>Download</button></div>}
    <div className="flex flex-col gap-2 sm:flex-row"><button type="button" disabled={busy} className="w-full rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-50 sm:w-auto" onClick={()=>void process()}>{busy?"Processing…":"Process PDF"}</button>{busy&&<button type="button" className="w-full rounded-xl border px-5 py-3 text-sm sm:w-auto" onClick={()=>abortRef.current?.abort()}>Cancel</button>}<button type="button" className="w-full rounded-xl border px-5 py-3 text-sm sm:w-auto" onClick={reset}>Reset</button></div>
    <p className="text-xs leading-5 text-muted-foreground">Browser-only PDF engine. Complex XFA, true PDF annotations/redactions, password encryption/decryption and digital-signature preservation require capabilities not provided by pdf-lib and are reported instead of being silently faked.</p>
  </section>;
}


function PdfImageCard({image}:{image:{blob:Blob;filename:string;pageIndex:number}}){
  const [url,setUrl]=useState<string|null>(null);
  useEffect(()=>{const u=URL.createObjectURL(image.blob);setUrl(u);return()=>URL.revokeObjectURL(u)},[image.blob]);
  return <div className="min-w-0 rounded-xl border p-2">
    {url&&<Image src={url} alt={`Page ${image.pageIndex+1}`} width={800} height={1100} unoptimized className="h-auto w-full"/>}
    <button type="button" className="mt-2 w-full rounded-lg border px-2 py-2 text-xs" onClick={()=>download(image.blob,image.filename)}>Download page {image.pageIndex+1}</button>
  </div>;
}
