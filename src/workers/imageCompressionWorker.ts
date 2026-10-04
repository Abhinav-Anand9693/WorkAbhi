/* WorkAbhi image compression worker — production codec path. */
type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type Stage = "reading" | "compressing" | "finalizing" | "complete";
type RequestMessage = { id:number; file:Blob; outputType:OutputFormat; quality:number; targetBytes?:number; expectedWidth?:number; expectedHeight?:number; resizeWidth?:number; resizeHeight?:number };
type ResponseMessage =
  | {id:number;type:"progress";stage:Stage}
  | {id:number;type:"success";blob:Blob;width:number;height:number}
  | {id:number;type:"error";error:string};
const MAX_QUALITY=.95, MIN_QUALITY=.04, QUALITY_ATTEMPTS=8, MAX_CANVAS_DIMENSION=32767;
const cancelled=new Set<number>();
const post=(m:ResponseMessage)=>self.postMessage(m);
const check=(id:number)=>{if(cancelled.has(id))throw new DOMException("Processing cancelled.","AbortError")};
const clamp=(q:number)=>Math.min(MAX_QUALITY,Math.max(MIN_QUALITY,q));
function assertDims(w:number,h:number){if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>MAX_CANVAS_DIMENSION||h>MAX_CANVAS_DIMENSION)throw new Error(`This browser cannot safely create a ${Math.round(w)}×${Math.round(h)} output image.`)}
async function canvasBlob(c:OffscreenCanvas,type:OutputFormat,q:number){return c.convertToBlob({type,...(type==="image/png"?{}:{quality:q})})}

async function loadSip(){
  const url=new URL("/workabhi-codecs/sip/index.js",self.location.origin).href;
  return await import(/* webpackIgnore: true */ url) as any;
}

async function sipEncode(input:Blob,width:number|undefined,height:number|undefined,quality:number){
  const bytes=await input.arrayBuffer();
  const sip=await loadSip();
  await sip.ready();
  const image=sip.transform(bytes,{...(width&&height?{width,height}:{}),quality:Math.round(clamp(quality)*100)});
  return await sip.collect(image);
}

async function compressJpeg(req:RequestMessage):Promise<{blob:Blob;width:number;height:number}>{
  check(req.id); post({id:req.id,type:"progress",stage:"reading"});
  const target=req.targetBytes;
  const width=req.resizeWidth??req.expectedWidth;
  const height=req.resizeHeight??req.expectedHeight;
  if(!target){
    const r=await sipEncode(req.file,width,height,req.quality); check(req.id);
    return {blob:new Blob([r.data],{type:"image/jpeg"}),width:r.info.width,height:r.info.height};
  }
  let low=MIN_QUALITY, high=MAX_QUALITY, best:Blob|null=null, bestSize=Infinity;
  for(let i=0;i<QUALITY_ATTEMPTS;i++){
    check(req.id); post({id:req.id,type:"progress",stage:"compressing"});
    const q=i===0?MAX_QUALITY:(low+high)/2;
    const r=await sipEncode(req.file,width,height,q); check(req.id);
    const blob=new Blob([r.data],{type:"image/jpeg"});
    if(blob.size<=target){if(blob.size<bestSize){best=blob;bestSize=blob.size} low=q}else high=q;
  }
  if(!best) throw new Error(`Unable to reach ${Math.round(target/1024)} KB at ${width}×${height} without changing the planned dimensions.`);
  return {blob:best,width:width!,height:height!};
}

self.onmessage=async(event:MessageEvent<RequestMessage|{type:"cancel";id:number}>)=>{
 const m=event.data;
 if("type" in m&&m.type==="cancel"){cancelled.add(m.id);return}
 const req=m as RequestMessage; let bitmap:ImageBitmap|null=null; let canvas:OffscreenCanvas|null=null;
 try{
  check(req.id); post({id:req.id,type:"progress",stage:"reading"});
  if(req.outputType==="image/jpeg"){
   const r=await compressJpeg(req);
   if(req.expectedWidth&&req.expectedHeight&&(r.width!==req.expectedWidth||r.height!==req.expectedHeight))throw new Error(`The codec returned ${r.width}×${r.height}, but WorkAbhi expected ${req.expectedWidth}×${req.expectedHeight}.`);
   post({id:req.id,type:"progress",stage:"finalizing"}); post({id:req.id,type:"success",blob:r.blob,width:r.width,height:r.height}); return;
  }
  if(typeof createImageBitmap!=="function")throw new Error("This browser does not support worker image decoding.");
  bitmap=await createImageBitmap(req.file,{...(req.resizeWidth&&req.resizeHeight?{resizeWidth:req.resizeWidth,resizeHeight:req.resizeHeight,resizeQuality:"high" as const}:{}),imageOrientation:"from-image"});
  check(req.id); const w=bitmap.width,h=bitmap.height; assertDims(w,h);
  if(req.expectedWidth&&req.expectedHeight&&(w!==req.expectedWidth||h!==req.expectedHeight))throw new Error(`The browser decoded this image as ${w}×${h}, but the source dimensions are ${req.expectedWidth}×${req.expectedHeight}.`);
  canvas=new OffscreenCanvas(w,h); const ctx=canvas.getContext("2d",{alpha:true}); if(!ctx)throw new Error("OffscreenCanvas 2D is not available on this device.");
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(bitmap,0,0,w,h);bitmap.close();bitmap=null;
  post({id:req.id,type:"progress",stage:"compressing"});
  if(req.targetBytes)throw new Error("Target-size compression is supported only by the JPEG codec path.");
  const blob=await canvasBlob(canvas,req.outputType,clamp(req.quality));
  post({id:req.id,type:"progress",stage:"finalizing"});post({id:req.id,type:"success",blob,width:w,height:h});
 }catch(e){post({id:req.id,type:"error",error:e instanceof Error?e.message:"Image compression failed."})}
 finally{bitmap?.close();cancelled.delete(req.id);if(canvas){canvas.width=1;canvas.height=1}}
};
