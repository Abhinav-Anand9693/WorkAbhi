import { getPreferredOutputType, throwIfImageProcessingAborted, validateCanvasDimensions, validateImageDimensions } from "./imageSafety";

type DecodedImage = ImageBitmap;
async function loadImage(file:Blob,signal?:AbortSignal):Promise<DecodedImage>{
  throwIfImageProcessingAborted(signal);
  if(typeof createImageBitmap!=="function") throw new Error("This browser does not support memory-efficient image decoding.");
  const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
  try{validateImageDimensions(bitmap.width,bitmap.height);throwIfImageProcessingAborted(signal);return bitmap}catch(e){bitmap.close();throw e}
}
function canvasToBlob(canvas:HTMLCanvasElement,type:"image/jpeg"|"image/png"|"image/webp",quality=0.92):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Unable to create the processed image.")),type,type==="image/png"?undefined:quality))}
function compositionOutputType(files:File[]):"image/jpeg"|"image/png"|"image/webp"{if(files.some(f=>f.type==="image/png"))return "image/png";if(files.every(f=>f.type==="image/webp"))return "image/webp";return "image/jpeg"}
function drawContain(ctx:CanvasRenderingContext2D,image:CanvasImageSource,iw:number,ih:number,x:number,y:number,w:number,h:number){const ir=iw/ih,br=w/h;let dw=w,dh=h;if(ir>br)dh=w/ir;else dw=h*ir;ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}

export async function overlayImages(baseFile:File,overlayFile:File,signal?:AbortSignal):Promise<Blob>{
  const base=await loadImage(baseFile,signal); const width=base.width,height=base.height; validateCanvasDimensions(width,height); const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");if(!ctx){base.close();throw new Error("Canvas is not supported.")}
  ctx.drawImage(base,0,0,width,height);base.close();throwIfImageProcessingAborted(signal);
  const overlay=await loadImage(overlayFile,signal);try{const maxWidth=width*.5;const scale=Math.min(maxWidth/overlay.width,maxWidth/overlay.height);const ow=overlay.width*scale,oh=overlay.height*scale;ctx.drawImage(overlay,width-ow-30,height-oh-30,ow,oh);}finally{overlay.close()}
  return canvasToBlob(canvas,getPreferredOutputType(baseFile));
}

export async function createCollage(files:File[],signal?:AbortSignal):Promise<Blob>{
  if(files.length<2)throw new Error("Please add at least 2 images to create a collage.");if(files.length>12)throw new Error("You can add up to 12 images to a collage.");
  const columns=Math.ceil(Math.sqrt(files.length)),rows=Math.ceil(files.length/columns),cell=400,gap=12,width=columns*cell+(columns+1)*gap,height=rows*cell+(rows+1)*gap;validateCanvasDimensions(width,height);const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas is not supported.");ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);
  for(let i=0;i<files.length;i++){throwIfImageProcessingAborted(signal);const bitmap=await loadImage(files[i],signal);try{const col=i%columns,row=Math.floor(i/columns),x=gap+col*(cell+gap),y=gap+row*(cell+gap);ctx.fillStyle="#f5f5f5";ctx.fillRect(x,y,cell,cell);drawContain(ctx,bitmap,bitmap.width,bitmap.height,x,y,cell,cell)}finally{bitmap.close()}}
  return canvasToBlob(canvas,getPreferredOutputType(files[0],"image/jpeg"));
}

export async function mergeImages(files:File[],signal?:AbortSignal):Promise<Blob>{
  if(files.length<2)throw new Error("Please add at least 2 images to merge.");if(files.length>20)throw new Error("You can merge up to 20 images at once.");
  const dims:{width:number;height:number}[]=[];for(const file of files){throwIfImageProcessingAborted(signal);const img=await loadImage(file,signal);dims.push({width:img.width,height:img.height});img.close()}
  const width=Math.max(...dims.map(d=>d.width)),gap=12,heights=dims.map(d=>Math.round(d.height/d.width*width)),height=heights.reduce((a,b)=>a+b,0)+gap*(files.length-1);validateCanvasDimensions(width,height);
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas is not supported.");const outputType=compositionOutputType(files);if(outputType==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height)}
  let y=0;for(let i=0;i<files.length;i++){throwIfImageProcessingAborted(signal);const img=await loadImage(files[i],signal);try{ctx.drawImage(img,0,y,width,heights[i])}finally{img.close()}y+=heights[i]+(i<files.length-1?gap:0)}
  return canvasToBlob(canvas,outputType);
}

export async function splitImage(file:File,signal?:AbortSignal):Promise<Blob[]>{
  const probe=await loadImage(file,signal);const width=probe.width,height=probe.height;probe.close();if(!width||!height)throw new Error("Unable to read image dimensions.");
  const hw=Math.floor(width/2),hh=Math.floor(height/2);const regions=[{x:0,y:0,width:hw,height:hh},{x:hw,y:0,width:width-hw,height:hh},{x:0,y:hh,width:hw,height:height-hh},{x:hw,y:hh,width:width-hw,height:height-hh}];const results:Blob[]=[];const outputType=getPreferredOutputType(file);
  for(const region of regions){throwIfImageProcessingAborted(signal);if(region.width<=0||region.height<=0)continue;validateCanvasDimensions(region.width,region.height);const canvas=document.createElement("canvas");canvas.width=region.width;canvas.height=region.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas is not supported.");const bitmap=await createImageBitmap(file,region.x,region.y,region.width,region.height,{resizeWidth:region.width,resizeHeight:region.height,imageOrientation:"from-image"});try{ctx.drawImage(bitmap,0,0,region.width,region.height)}finally{bitmap.close()}results.push(await canvasToBlob(canvas,outputType))}
  return results;
}

export async function cropImage(file:File,crop:{x:number;y:number;width:number;height:number},signal?:AbortSignal):Promise<Blob>{const img=await loadImage(file,signal);try{const x=Math.max(0,Math.floor(crop.x)),y=Math.max(0,Math.floor(crop.y)),w=Math.min(Math.floor(crop.width),img.width-x),h=Math.min(Math.floor(crop.height),img.height-y);if(w<=0||h<=0)throw new Error("Invalid crop dimensions.");validateCanvasDimensions(w,h);const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas is not supported.");ctx.drawImage(img,x,y,w,h,0,0,w,h);return canvasToBlob(c,getPreferredOutputType(file))}finally{img.close()}}
export async function circularCrop(file:File,signal?:AbortSignal):Promise<Blob>{const img=await loadImage(file,signal);try{const size=Math.min(img.width,img.height);validateCanvasDimensions(size,size);const c=document.createElement("canvas");c.width=size;c.height=size;const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas is not supported.");ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,size,size);return canvasToBlob(c,"image/png")}finally{img.close()}}
