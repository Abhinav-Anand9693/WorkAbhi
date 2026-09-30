import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage } from "pdf-lib";
import type { PdfOutput, PdfProcessOptions, PdfProgress, PdfToolId } from "@/engine/pdf/pdfTypes";
import { PdfEngineError } from "@/engine/pdf/pdfTypes";

const MAX_INPUT_BYTES=256*1024*1024;
const MAX_IMAGE_INPUT_BYTES=20*1024*1024;
const MAX_MERGE_BYTES=256*1024*1024;
const MAX_PAGES=500;
const MAX_RENDER_PIXELS=24_000_000;
const MAX_IMAGE_PIXELS=25_000_000;

function browser(){if(typeof window==="undefined")throw new PdfEngineError("BROWSER_UNSUPPORTED","PDF processing is available in the browser only.");}
function abort(signal?:AbortSignal){if(signal?.aborted)throw new PdfEngineError("CANCELLED","PDF processing was cancelled.");}
function progress(v:number,m:string,cb?:(p:PdfProgress)=>void){cb?.({progress:Math.max(0,Math.min(1,v)),message:m});}
function base(n:string){return n.replace(/\.[^.]+$/,"");}
function safe(n:string){return n.replace(/[<>:"/\\|?*\u0000-\u001F]/g,"_").trim()||"workabhi";}
function ensurePdf(file:File){
  if(!file||file.size<=0)throw new PdfEngineError("EMPTY_FILE","The selected PDF is empty.");
  if(file.size>MAX_INPUT_BYTES)throw new PdfEngineError("TOO_LARGE","This PDF exceeds the 256 MB browser safety limit.");
  if(file.type!=="application/pdf"&&!/\.pdf$/i.test(file.name))throw new PdfEngineError("NOT_PDF","Please select a PDF file.");
}
async function bytes(file:File){const b=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(b.slice(0,8)).startsWith("%PDF-")===false)throw new PdfEngineError("NOT_PDF","The selected file is not a valid PDF.");return b;}
async function load(file:File,signal?:AbortSignal){
  abort(signal);ensurePdf(file);const b=await bytes(file);abort(signal);
  try{
    const pdf=await PDFDocument.load(b,{ignoreEncryption:false,updateMetadata:false});
    const count=pdf.getPageCount();
    if(!count)throw new PdfEngineError("CORRUPT_PDF","The PDF contains no pages.");
    if(count>MAX_PAGES)throw new PdfEngineError("MEMORY_RISK",`This PDF has ${count} pages. The browser limit is ${MAX_PAGES}.`);
    return pdf;
  }catch(e){
    if(e instanceof PdfEngineError)throw e;
    const msg=e instanceof Error?e.message:String(e);
    if(/encrypt|password|encrypted/i.test(msg))throw new PdfEngineError("ENCRYPTED_PDF","This PDF is encrypted or password-protected and cannot be modified by the browser PDF engine.");
    throw new PdfEngineError("CORRUPT_PDF","The PDF could not be opened. It may be malformed or use unsupported features.");
  }
}
function blob(b:Uint8Array){return new Blob([b as BlobPart],{type:"application/pdf"});}
async function save(pdf:PDFDocument,name:string,signal?:AbortSignal){abort(signal);const b=await pdf.save({useObjectStreams:true});abort(signal);const out=blob(b);return {blob:out,filename:safe(name),mimeType:"application/pdf",size:out.size};}
function color(v="#ef4444"){const m=/^#?([0-9a-f]{6})$/i.exec(v.trim());if(!m)return rgb(.94,.27,.27);const n=parseInt(m[1],16);return rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);}
function page(pdf:PDFDocument,i:number){if(!Number.isInteger(i)||i<0||i>=pdf.getPageCount())throw new PdfEngineError("PAGE_RANGE",`Page ${i+1} is outside the PDF.`);return pdf.getPage(i);}
function point(p:PDFPage,x:number,y:number){return{x:Math.max(0,x),y:Math.max(0,p.getHeight()-Math.max(0,y))};}
function validatePages(indices:number[],count:number){
  const u=[...new Set(indices)];if(!u.length)throw new PdfEngineError("INVALID_OPTIONS","Select at least one page.");
  if(u.some(i=>!Number.isInteger(i)||i<0||i>=count))throw new PdfEngineError("PAGE_RANGE","One or more selected pages are outside the PDF.");
  return u;
}
async function copyPages(pdf:PDFDocument,indices:number[],signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  const ids=validatePages(indices,pdf.getPageCount());const out=await PDFDocument.create();const pages=await out.copyPages(pdf,ids);
  for(let i=0;i<pages.length;i++){abort(signal);out.addPage(pages[i]);progress((i+1)/pages.length,`Copying page ${i+1} of ${pages.length}`,cb);}
  return out;
}
function formInfo(pdf:PDFDocument){
  const form=pdf.getForm();const fields=form.getFields();
  return {hasForm:fields.length>0,hasXFA:form.hasXFA(),formFields:fields.map(f=>({name:f.getName(),type:f.constructor.name,options:(()=>{try{return (f as unknown as {getOptions?:()=>string[]}).getOptions?.()??[]}catch{return []}})()}))};
}
function metadata(pdf:PDFDocument){
  const f=formInfo(pdf);return {pageCount:pdf.getPageCount(),title:pdf.getTitle()??"",author:pdf.getAuthor()??"",subject:pdf.getSubject()??"",keywords:pdf.getKeywords()??"",creator:pdf.getCreator()??"",producer:pdf.getProducer()??"",creationDate:pdf.getCreationDate()?.toISOString()??null,modificationDate:pdf.getModificationDate()?.toISOString()??null,encrypted:false,...f};
}
function clearMetadata(pdf:PDFDocument){
  pdf.setTitle("");pdf.setAuthor("");pdf.setSubject("");pdf.setKeywords([]);pdf.setCreator("");pdf.setProducer("");
  try{pdf.context.trailerInfo.Info=undefined;}catch{}
}
async function imagePng(file:File){
  browser();if(file.size>MAX_IMAGE_INPUT_BYTES)throw new PdfEngineError("TOO_LARGE","Image must be 20 MB or smaller.");
  const bmp=await createImageBitmap(file);try{
    if(bmp.width*bmp.height>MAX_IMAGE_PIXELS)throw new PdfEngineError("MEMORY_RISK","Image dimensions are too large for safe browser processing.");
    const c=document.createElement("canvas");c.width=bmp.width;c.height=bmp.height;const ctx=c.getContext("2d");if(!ctx)throw new PdfEngineError("BROWSER_UNSUPPORTED","Canvas is unavailable.");
    ctx.drawImage(bmp,0,0);const b=await new Promise<Blob|null>(r=>c.toBlob(r,"image/png"));if(!b)throw new PdfEngineError("UNSUPPORTED","The browser could not decode this image.");return new Uint8Array(await b.arrayBuffer());
  }finally{bmp.close();}
}
async function imageToPdf(file:File,signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  abort(signal);if(!file||file.size<=0)throw new PdfEngineError("EMPTY_FILE","The image is empty.");if(file.size>MAX_IMAGE_INPUT_BYTES)throw new PdfEngineError("TOO_LARGE","Image must be 20 MB or smaller.");
  const pdf=await PDFDocument.create();const mime=file.type.toLowerCase();let img;
  const raw=await file.arrayBuffer();
  if(mime==="image/jpeg"||/\.jpe?g$/i.test(file.name))img=await pdf.embedJpg(new Uint8Array(raw));
  else if(mime==="image/png"||/\.png$/i.test(file.name))img=await pdf.embedPng(new Uint8Array(raw));
  else if(mime==="image/webp"||mime==="image/bmp"||/\.webp$/i.test(file.name)||/\.bmp$/i.test(file.name))img=await pdf.embedPng(await imagePng(file));
  else throw new PdfEngineError("UNSUPPORTED","TIFF is not supported in this browser-only build. Please convert TIFF to PNG/JPG first.");
  const d=img.scale(1);const pw=595.28,ph=841.89,m=36;const s=Math.min((pw-2*m)/d.width,(ph-2*m)/d.height,1);const w=d.width*s,h=d.height*s;
  pdf.addPage([pw,ph]).drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});progress(1,"PDF created",cb);return save(pdf,`${base(file.name)}.pdf`,signal);
}
async function imagesToPdf(files:File[],signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  if(!files.length)throw new PdfEngineError("INVALID_INPUT","Select at least one image.");
  const total=files.reduce((s,f)=>s+f.size,0);if(total>MAX_MERGE_BYTES)throw new PdfEngineError("TOO_LARGE","Combined image input exceeds 256 MB.");
  const pdf=await PDFDocument.create();
  for(let i=0;i<files.length;i++){abort(signal);const f=files[i];if(f.size>MAX_IMAGE_INPUT_BYTES)throw new PdfEngineError("TOO_LARGE",`${f.name} exceeds the 20 MB per-image limit.`);const mime=f.type.toLowerCase();let img;
    if(mime==="image/jpeg"||/\.jpe?g$/i.test(f.name))img=await pdf.embedJpg(new Uint8Array(await f.arrayBuffer()));
    else if(mime==="image/png"||/\.png$/i.test(f.name))img=await pdf.embedPng(new Uint8Array(await f.arrayBuffer()));
    else if(mime==="image/webp"||mime==="image/bmp"||/\.webp$/i.test(f.name)||/\.bmp$/i.test(f.name))img=await pdf.embedPng(await imagePng(f));
    else throw new PdfEngineError("UNSUPPORTED",`${f.name}: TIFF and this image format are not supported.`);
    const d=img.scale(1);const pw=595.28,ph=841.89,m=36,s=Math.min((pw-2*m)/d.width,(ph-2*m)/d.height,1);const w=d.width*s,h=d.height*s;
    pdf.addPage([pw,ph]).drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});progress((i+1)/files.length,`Added ${f.name}`,cb);
  }return save(pdf,"images-to-pdf.pdf",signal);
}
async function drawNumbers(pdf:PDFDocument,start:number,pos:PdfProcessOptions["pageNumberPosition"],c:ReturnType<typeof rgb>,ids:number[]){
  const font=await pdf.embedFont(StandardFonts.Helvetica);ids.forEach((idx,n)=>{const p=page(pdf,idx),w=p.getWidth(),h=p.getHeight(),s=10,t=String(start+n),tw=font.widthOfTextAtSize(t,s);let x=24,y=h-24;if(pos?.includes("center"))x=(w-tw)/2;if(pos?.includes("right"))x=w-tw-24;if(pos?.includes("bottom"))y=14;p.drawText(t,{x,y,size:s,font,color:c});});
}
async function annotate(file:File,id:PdfToolId,o:PdfProcessOptions,signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  const pdf=await load(file,signal);const ids=validatePages(o.pages??[],pdf.getPageCount());const c=color(o.color),font=await pdf.embedFont(StandardFonts.Helvetica);const fs=Math.max(6,Math.min(96,o.fontSize??18)),op=Math.max(.05,Math.min(1,o.opacity??.35));
  for(let n=0;n<ids.length;n++){abort(signal);const p=page(pdf,ids[n]),{width,height}=p.getSize(),pt=point(p,o.x??40,o.y??40);
    if(id==="pdf-watermark")p.drawText(o.watermarkText||"WORKABHI",{x:pt.x,y:pt.y,size:fs,font,color:c,opacity:op,rotate:degrees(-35)});
    else if(id==="pdf-stamp"){const t=o.stampText||"APPROVED";p.drawRectangle({x:pt.x-8,y:pt.y-8,width:Math.max(80,t.length*fs*.6),height:fs+16,borderColor:c,borderWidth:1.5,color:rgb(1,1,1),opacity:.15});p.drawText(t,{x:pt.x,y:pt.y,size:fs,font,color:c});}
    else if(id==="add-text-to-pdf")p.drawText(o.text||"Text",{x:pt.x,y:pt.y,size:fs,font,color:c});
    else if(id==="pdf-highlight-tool"){const w=Math.min(width-pt.x,Math.max(20,o.whiteout?.width??180)),h=Math.min(pt.y,Math.max(10,o.whiteout?.height??24));p.drawRectangle({x:pt.x,y:pt.y-h,width:w,height:h,color:rgb(1,.85,.05),opacity:.32});}
    else if(id==="pdf-whiteout-tool"){const w=Math.min(width-pt.x,Math.max(20,o.whiteout?.width??180)),h=Math.min(pt.y,Math.max(20,o.whiteout?.height??40));p.drawRectangle({x:pt.x,y:pt.y-h,width:w,height:h,color:rgb(1,1,1),opacity:1});}
    else if(id==="pdf-drawing-tool"){for(const l of o.drawing??[]){const a=point(p,l.x1,l.y1),b=point(p,l.x2,l.y2);p.drawLine({start:a,end:b,thickness:Math.max(1,fs/5),color:c,opacity:op});}}
    else if(id==="pdf-annotation-tool"){p.drawRectangle({x:pt.x,y:pt.y,width:180,height:60,borderColor:c,borderWidth:1,color:rgb(1,1,.8),opacity:.85});p.drawText(o.text||"Annotation",{x:pt.x+8,y:pt.y+40,size:Math.min(fs,14),font,color:c});}
    else if(id==="add-image-to-pdf"||id==="add-signature-to-pdf"){
      const b=id==="add-image-to-pdf"?o.imageBytes:o.signatureBytes;if(!b)throw new PdfEngineError("INVALID_OPTIONS",`Choose an image before processing.`);
      const im=await pdf.embedPng(b);const scale=Math.max(.05,Math.min(1,(o.imageScale??35)/100));let w=im.width*scale,h=im.height*scale;const margin=Math.max(0,o.imageMargin??24);
      if(id==="add-signature-to-pdf"){const cap=240;const s=Math.min(scale,cap/im.width);w=im.width*s;h=im.height*s;}
      const pos=o.imagePosition??"center";let x=margin,y=margin;
      if(pos.includes("top"))y=height-margin-h;else if(pos.includes("center"))y=(height-h)/2;
      if(pos.includes("right"))x=width-margin-w;else if(pos.includes("center"))x=(width-w)/2;
      if(Number.isFinite(o.imageX))x=Math.max(0,Math.min(width-w,o.imageX!));if(Number.isFinite(o.imageY))y=Math.max(0,Math.min(height-h,o.imageY!));
      p.drawImage(im,{x,y,width:w,height:h,opacity:id==="add-image-to-pdf"?Math.max(0,Math.min(1,(o.imageOpacity??100)/100)):op});
    }
    progress((n+1)/ids.length,`Editing page ${ids[n]+1}`,cb);
  }return save(pdf,`${base(file.name)}-edited.pdf`,signal);
}
async function fill(file:File,o:PdfProcessOptions,mode:"text"|"checkbox"|"radio",flatten=false){
  const pdf=await load(file),form=pdf.getForm(),fields=form.getFields();if(!fields.length){if(flatten)return save(pdf,`${base(file.name)}-flattened.pdf`);throw new PdfEngineError("UNSUPPORTED","No standard AcroForm fields were found. XFA-only forms are not supported.");}
  const vals=o.formValues??o.formFieldValues??{};let changed=0;
  for(const f of fields){const name=f.getName(),v=vals[name];if(v===undefined)continue;try{
    if(mode==="text")form.getTextField(name).setText(String(v));
    else if(mode==="checkbox"){const x=form.getCheckBox(name);Boolean(v)?x.check():x.uncheck();}
    else form.getRadioGroup(name).select(String(v));changed++;
  }catch{}}
  if(flatten)form.flatten();return save(pdf,`${base(file.name)}-${changed?"filled":"processed"}.pdf`);
}
async function toImages(file:File,o:PdfProcessOptions,signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  browser();ensurePdf(file);const ids=o.pageIndices?.length?validatePages(o.pageIndices,MAX_PAGES):undefined;const scale=Math.max(.25,Math.min(2,o.renderScale??1));
  const data=await bytes(file);abort(signal);const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();
  const doc=await pdfjs.getDocument({data}).promise;const count=doc.numPages;if(count>MAX_PAGES)throw new PdfEngineError("MEMORY_RISK",`PDF exceeds ${MAX_PAGES} pages.`);const targets=ids??Array.from({length:count},(_,i)=>i);
  if(!ids&&targets.length>50)throw new PdfEngineError("MEMORY_RISK","For PDFs over 50 pages, select the pages to export.");
  const out:NonNullable<PdfOutput["images"]>=[];try{
    for(let n=0;n<targets.length;n++){abort(signal);const idx=targets[n];if(idx>=count)throw new PdfEngineError("PAGE_RANGE","Page is outside the PDF.");const p=await doc.getPage(idx+1);const vp=p.getViewport({scale});const pixels=vp.width*vp.height;if(pixels>MAX_RENDER_PIXELS){p.cleanup();throw new PdfEngineError("MEMORY_RISK","That page is too large to render safely.");}
      const c=document.createElement("canvas");c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const ctx=c.getContext("2d");if(!ctx){p.cleanup();throw new PdfEngineError("BROWSER_UNSUPPORTED","Canvas is unavailable.");}
      const task=p.render({canvasContext:ctx,canvas:c,viewport:vp});const cancel=()=>task.cancel();signal?.addEventListener("abort",cancel,{once:true});try{await task.promise;abort(signal);const mime=o.imageMimeType??"image/png";const b=await new Promise<Blob|null>(r=>c.toBlob(r,mime,mime==="image/jpeg"?.92:undefined));if(!b)throw new PdfEngineError("UNSUPPORTED","Could not encode rendered page.");out.push({blob:b,filename:`page-${idx+1}.${mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":"png"}`,pageIndex:idx});progress((n+1)/targets.length,`Rendered page ${idx+1}`,cb);}finally{signal?.removeEventListener("abort",cancel);p.cleanup();c.width=1;c.height=1;}}
    return {images:out};
  }finally{try{await doc.cleanup();}catch{}}
}
async function security(file:File){
  browser();ensurePdf(file);const data=await bytes(file);const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();const d=await pdfjs.getDocument({data}).promise;
  try{
    const attachments=await d.getAttachments?.();const js=await d.hasJSActions?.();const sigs=await d.getSignatures?.();const permissions=await d.getPermissions?.();
    return {javascriptActions:Boolean(js),attachmentNames:attachments?Object.keys(attachments):[],signatureCount:Array.isArray(sigs)?sigs.length:0,permissions:permissions??null};
  }finally{try{await d.cleanup();}catch{}}
}
export async function inspectPdf(file:File){const pdf=await load(file);return metadata(pdf);}

async function textToPdf(text:string,signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  browser();
  if(!text.trim()) throw new PdfEngineError("INVALID_OPTIONS","Enter some text before creating the PDF.");
  const pdf=await PDFDocument.create();
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const width=595.28,height=841.89,margin=50,size=12,lineHeight=18,maxWidth=width-margin*2;
  const wrap=(value:string)=>{
    const result:string[]=[]; let current="";
    for(const word of value.split(/\s+/)){
      const candidate=current?`${current} ${word}`:word;
      if(font.widthOfTextAtSize(candidate,size)<=maxWidth){current=candidate;continue;}
      if(current)result.push(current);
      if(font.widthOfTextAtSize(word,size)<=maxWidth){current=word;continue;}
      let chunk="";
      for(const ch of word){
        const next=chunk+ch;
        if(font.widthOfTextAtSize(next,size)>maxWidth&&chunk){result.push(chunk);chunk=ch;}else chunk=next;
      }
      current=chunk;
    }
    if(current||!result.length)result.push(current);
    return result;
  };
  let page=pdf.addPage([width,height]),y=height-margin;
  const lines=text.replace(/\r\n/g,"\n").split("\n").flatMap(wrap);
  for(let i=0;i<lines.length;i++){
    abort(signal);
    if(y<margin){page=pdf.addPage([width,height]);y=height-margin;}
    page.drawText(lines[i],{x:margin,y,size,font,color:rgb(.12,.12,.12),maxWidth});
    y-=lineHeight;
    if(i%25===0)progress(i/Math.max(1,lines.length),"Creating PDF",cb);
  }
  progress(1,"PDF created",cb);
  return save(pdf,"text-to-pdf.pdf",signal);
}

async function mergePdfs(files:File[],signal?:AbortSignal,cb?:(p:PdfProgress)=>void){
  if(files.length<2)throw new PdfEngineError("INVALID_INPUT","Select at least two PDF files to merge.");
  const total=files.reduce((s,f)=>s+f.size,0);
  if(total>MAX_MERGE_BYTES)throw new PdfEngineError("TOO_LARGE","Combined PDF input exceeds the 256 MB browser safety limit.");
  const out=await PDFDocument.create();
  for(let i=0;i<files.length;i++){
    abort(signal);
    const src=await load(files[i],signal);
    const copied=await out.copyPages(src,src.getPageIndices());
    for(const p of copied){abort(signal);out.addPage(p);}
    progress((i+1)/files.length,`Merged ${i+1} of ${files.length} PDFs`,cb);
  }
  return save(out,"merged.pdf",signal);
}

export async function processPdf(id:PdfToolId,files:File[],o:PdfProcessOptions={},signal?:AbortSignal,cb?:(p:PdfProgress)=>void):Promise<PdfOutput>{
  browser();abort(signal);
  if(id==="pdf-password-generator"){const len=Math.max(8,Math.min(128,Math.floor(o.passwordLength??24))),alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=",v=new Uint32Array(len);crypto.getRandomValues(v);return{text:[...v].map(x=>alphabet[x%alphabet.length]).join("")};}
  if(!files.length)throw new PdfEngineError("INVALID_INPUT","Select a file first.");
  if(id==="text-to-pdf")return textToPdf(o.text??"",signal,cb);
  if(id==="merge-pdf")return mergePdfs(files,signal,cb);
  if(id==="jpg-to-pdf"||id==="png-to-pdf"||id==="webp-to-pdf"||id==="bmp-to-pdf"||id==="tiff-to-pdf")return imageToPdf(files[0],signal,cb);
  if(id==="images-to-pdf")return imagesToPdf(files,signal,cb);
  if(id==="pdf-to-jpg"||id==="pdf-to-png"||id==="pdf-to-webp"||id==="pdf-to-images"||id==="pdf-pages-to-images")return toImages(files[0],{...o,imageMimeType:id==="pdf-to-jpg"?"image/jpeg":id==="pdf-to-webp"?"image/webp":"image/png"},signal,cb);
  if(id==="pdf-hash-generator"){ensurePdf(files[0]);const d=await crypto.subtle.digest(o.hashAlgorithm??"SHA-256",await files[0].arrayBuffer());return{text:`${o.hashAlgorithm??"SHA-256"}: ${[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}`};}
  if(id==="pdf-file-integrity-checker"){ensurePdf(files[0]);const b=await bytes(files[0]);const head=new TextDecoder().decode(b.slice(0,8));const tail=new TextDecoder().decode(b.slice(-64));let parsed=false;try{await load(files[0]);parsed=true;}catch{}return{text:JSON.stringify({fileName:files[0].name,bytes:files[0].size,headerLooksValid:head.startsWith("%PDF-"),eofMarkerPresent:tail.includes("%%EOF"),startXrefMarkerPresent:new TextDecoder().decode(b.slice(Math.max(0,b.length-4096))).includes("startxref"),parserOpenedDocument:parsed,verdict:parsed?"Basic structural checks passed":"The PDF failed parser validation"},null,2)};}
  if(id==="pdf-security-checker"){const info=await inspectPdf(files[0]),sec=await security(files[0]);return{metadata:{...info,...sec},text:JSON.stringify({...info,...sec,note:"Parser-level inspection only; this is not malware scanning or a complete PDF security audit."},null,2)};}
  if(id==="pdf-metadata-viewer")return{metadata:await inspectPdf(files[0])};
  if(id==="pdf-viewer"){ensurePdf(files[0]);return{blob:files[0],filename:files[0].name,mimeType:"application/pdf",size:files[0].size};}
  if(id==="remove-pdf-metadata"||id==="pdf-metadata-cleaner"||id==="pdf-privacy-cleaner"){const pdf=await load(files[0],signal);clearMetadata(pdf);return save(pdf,`${base(files[0].name)}-clean.pdf`,signal);}
  if(id==="pdf-form-filler")return fill(files[0],o,"text");
  if(id==="pdf-checkbox-filler")return fill(files[0],o,"checkbox");
  if(id==="pdf-radio-button-filler")return fill(files[0],o,"radio");
  if(id==="pdf-flatten-tool")return fill(files[0],o,"text",true);
  const pdf=await load(files[0],signal),count=pdf.getPageCount(),all=Array.from({length:count},(_,i)=>i);
  if(id==="pdf-page-numbering"){const ids=o.pages?.length?validatePages(o.pages,count):all;await drawNumbers(pdf,o.pageNumberStart??1,o.pageNumberPosition??"bottom-center",color(o.color),ids);return save(pdf,`${base(files[0].name)}-numbered.pdf`,signal);}
  if(["rotate-pdf","delete-pdf-pages","extract-pdf-pages","reorder-pdf-pages","duplicate-pdf-pages","reverse-pdf-pages","split-pdf","pdf-page-organizer"].includes(id)){
    let ids=o.pages?.length?validatePages(o.pages,count):[];if(id!=="split-pdf"&&!ids.length&&id!=="delete-pdf-pages")throw new PdfEngineError("INVALID_OPTIONS","Select pages first.");
    if(id==="delete-pdf-pages"){ids=all.filter(i=>!ids.includes(i));if(!ids.length)throw new PdfEngineError("INVALID_OPTIONS","You cannot delete every page.");}
    else if(id==="rotate-pdf"){for(const i of ids)page(pdf,i).setRotation(degrees(o.rotate??90));return save(pdf,`${base(files[0].name)}-rotated.pdf`,signal);}
    else if(id==="reorder-pdf-pages"||id==="pdf-page-organizer"){const order=o.pageOrder??[];if(order.length!==count||new Set(order).size!==count)throw new PdfEngineError("INVALID_OPTIONS","Page order must contain every page exactly once.");ids=validatePages(order,count);}
    else if(id==="duplicate-pdf-pages"){const idx=o.duplicatePage??ids[0];if(idx===undefined)throw new PdfEngineError("INVALID_OPTIONS","Select a page to duplicate.");const pos=Math.max(0,Math.min(count,Math.floor(o.duplicatePosition??idx+1)));ids=all.slice();ids.splice(pos,0,idx);}
    else if(id==="reverse-pdf-pages")ids=[...ids].reverse();
    if(id==="split-pdf"){const groups=o.pageGroups?.length?o.pageGroups:o.pages?.length?[o.pages]:all.map(i=>[i]);const outputs:PdfOutput[]=[];for(let i=0;i<groups.length;i++){const s=await copyPages(pdf,groups[i],signal,cb);outputs.push(await save(s,`${base(files[0].name)}-split-${i+1}.pdf`,signal));}return outputs.length===1?outputs[0]:{outputs};}
    const out=await copyPages(pdf,ids,signal,cb);return save(out,`${base(files[0].name)}-pages.pdf`,signal);
  }
  if(["pdf-watermark","pdf-stamp","add-text-to-pdf","add-image-to-pdf","add-signature-to-pdf","pdf-highlight-tool","pdf-drawing-tool","pdf-annotation-tool","pdf-whiteout-tool"].includes(id))return annotate(files[0],id,o,signal,cb);
  throw new PdfEngineError("UNSUPPORTED",`The PDF tool "${id}" is not supported by this browser engine.`);
}
