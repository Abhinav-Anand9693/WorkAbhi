export interface PdfThumbnail { pageIndex:number; dataUrl:string; }

interface PdfDocumentProxyLike {
  numPages:number;
  getPage(pageNumber:number):Promise<{
    getViewport(options:{scale:number}):{width:number;height:number};
    render(options:{canvas:HTMLCanvasElement;canvasContext:CanvasRenderingContext2D;viewport:{width:number;height:number}}):{promise:Promise<void>;cancel():void};
    cleanup():void;
  }>;
  cleanup(keepLoadedFonts?:boolean):Promise<void>;
  destroy?():Promise<void>;
}

let configured=false;
const cache=new WeakMap<File, Promise<PdfDocumentProxyLike>>();

async function getPdfJs(){
  if(typeof window==="undefined") throw new Error("PDF rendering requires a browser.");
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
  if(!configured){
    pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();
    configured=true;
  }
  return pdfjs;
}

async function getDocument(file:File){
  const existing=cache.get(file);
  if(existing) return existing;
  const promise=(async()=>{
    const pdfjs=await getPdfJs();
    const data=new Uint8Array(await file.arrayBuffer());
    return await pdfjs.getDocument({data}).promise as PdfDocumentProxyLike;
  })();
  cache.set(file,promise);
  try{return await promise;}catch(e){cache.delete(file);throw e;}
}

export async function renderPdfPage(file:File,pageIndex:number,scale=.75,signal?:AbortSignal){
  const doc=await getDocument(file);
  if(signal?.aborted) throw new Error("PDF rendering was cancelled.");
  if(pageIndex<0||pageIndex>=doc.numPages) throw new Error("Invalid PDF page.");
  const page=await doc.getPage(pageIndex+1);
  const viewport=page.getViewport({scale:Math.max(.25,Math.min(1.5,scale))});
  const canvas=document.createElement("canvas");
  canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext("2d");
  if(!ctx){page.cleanup();throw new Error("Canvas is unavailable.");}
  const task=page.render({canvas,canvasContext:ctx,viewport});
  const cancel=()=>task.cancel();
  signal?.addEventListener("abort",cancel,{once:true});
  try{await task.promise;if(signal?.aborted)throw new Error("PDF rendering was cancelled.");return canvas.toDataURL("image/jpeg",.78);}
  finally{signal?.removeEventListener("abort",cancel);page.cleanup();canvas.width=1;canvas.height=1;}
}

export async function getPdfPageCount(file:File){return (await getDocument(file)).numPages;}

export async function releasePdfDocument(file:File){
  const promise=cache.get(file); if(!promise)return;
  cache.delete(file);
  try{const doc=await promise;if(doc.destroy)await doc.destroy();else await doc.cleanup();}catch{}
}
