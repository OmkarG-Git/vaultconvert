import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
export { pdfjsLib };

const A4 = { width: 595.28, height: 841.89 };

export const stripExtension = (name = "") => name.replace(/\.[^/.]+$/, "");
export function bytesToSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export async function readPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjsLib.getDocument({ data }).promise;
}
export async function getPdfPageCount(file) {
  const pdf = await readPdf(file);
  return pdf.numPages;
}

export async function renderPdfPage(file, pageNumber, scale = 1.35, rotation = 0) {
  const pdf = await readPdf(file);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("This browser cannot create a 2D canvas.");
  await page.render({ canvasContext: ctx, viewport, background: "white" }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

export async function createThumbnail(file, pageNumber = 1, scale = 0.28, rotation = 0) {
  const { canvas } = await renderPdfPage(file, pageNumber, scale, rotation);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not create thumbnail.")), "image/jpeg", .72));
  canvas.width = 1; canvas.height = 1;
  return URL.createObjectURL(blob);
}

async function decodeImage(file) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Unable to decode ${file.name}.`));
      img.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

export async function imageInfo(file) {
  const img = await decodeImage(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export async function imageToCanvas(file, transform = {}) {
  const img = await decodeImage(file);
  const rotation = ((transform.rotation || 0) % 360 + 360) % 360;
  const flipX = transform.flipX ? -1 : 1;
  const flipY = transform.flipY ? -1 : 1;
  const resize = transform.width && transform.height ? { width: transform.width, height: transform.height } : null;
  const baseW = resize?.width || img.naturalWidth;
  const baseH = resize?.height || img.naturalHeight;
  const swap = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? baseH : baseW;
  canvas.height = swap ? baseW : baseH;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("This browser cannot create a 2D canvas.");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale(flipX, flipY);
  ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
  return canvas;
}

export async function canvasBlob(canvas, type = "image/png", quality = .92) {
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not encode the image.")), type, quality));
}

function imageDimensions(iw, ih, pw, ph, margin, fit) {
  const uw = Math.max(1, pw - margin * 2), uh = Math.max(1, ph - margin * 2);
  if (fit === "stretch") return { width: uw, height: uh };
  const scale = fit === "width" ? uw / iw : Math.min(uw / iw, uh / ih);
  return { width: iw * scale, height: ih * scale };
}

export async function imagesToPdf(files, opts = {}) {
  const { pageSize = "a4", fit = "contain", margin = 18, quality = .92, transforms = {}, onProgress } = opts;
  const pdf = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const canvas = await imageToCanvas(file, transforms[file.name] || {});
    const jpeg = await canvasBlob(canvas, "image/jpeg", quality);
    const embedded = await pdf.embedJpg(await jpeg.arrayBuffer());
    const pw = pageSize === "a4" ? A4.width : embedded.width;
    const ph = pageSize === "a4" ? A4.height : embedded.height;
    const page = pdf.addPage([pw, ph]);
    const dim = imageDimensions(embedded.width, embedded.height, pw, ph, margin, fit);
    page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(1, 1, 1) });
    page.drawImage(embedded, { x: (pw-dim.width)/2, y: (ph-dim.height)/2, width: dim.width, height: dim.height });
    canvas.width = 1; canvas.height = 1;
    onProgress?.(i + 1, files.length);
  }
  return pdf.save({ useObjectStreams: true });
}

export async function exportPdfWithEdits(file, edits = {}, options = {}) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const order = edits.order?.length ? edits.order : Array.from({ length: source.getPageCount() }, (_, i) => i);
  const out = await PDFDocument.create();
  const kept = order.filter(i => !edits.deleted?.includes(i));
  const copied = await out.copyPages(source, kept);
  copied.forEach((page, position) => {
    const sourceIndex = kept[position];
    const turns = edits.rotations?.[sourceIndex] || 0;
    if (turns) page.setRotation(degrees(turns));
    out.addPage(page);
  });
  if (edits.duplicates?.length) {
    // duplicates are represented directly in order; this branch is retained for compatibility.
  }
  if (options.watermark) {
    const font = await out.embedFont(StandardFonts.Helvetica);
    out.getPages().forEach(page => {
      const { width, height } = page.getSize();
      page.drawText(options.watermark, { x: width*.16, y: height*.48, size: Math.max(14, Math.min(width,height)*.035), font, color: rgb(.2,.65,.45), opacity: options.opacity ?? .18, rotate: degrees(options.rotation ?? 35) });
    });
  }
  if (options.removeMetadata) {
    out.setTitle(""); out.setAuthor(""); out.setSubject(""); out.setKeywords([]); out.setCreator(""); out.setProducer("");
  }
  return out.save({ useObjectStreams: true });
}

export async function extractFromEdits(file, edits, pages) {
  const data = await exportPdfWithEdits(file, edits);
  const source = await PDFDocument.load(data);
  const out = await PDFDocument.create();
  const valid = pages.map(n => n - 1).filter(n => n >= 0 && n < source.getPageCount());
  const copied = await out.copyPages(source, valid);
  copied.forEach(p => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

export async function mergePdfs(files, onProgress) {
  const out = await PDFDocument.create();
  for (let i=0;i<files.length;i++) {
    const source = await PDFDocument.load(await files[i].arrayBuffer());
    const pages = await out.copyPages(source, source.getPageIndices());
    pages.forEach(p=>out.addPage(p)); onProgress?.(i+1,files.length);
  }
  return out.save({ useObjectStreams: true });
}

export async function renderPdfImages(file, { scale=1.5, format="image/jpeg", quality=.92, onProgress }={}) {
  const pdf = await readPdf(file), outputs=[];
  for(let n=1;n<=pdf.numPages;n++) {
    const {canvas}=await renderPdfPage(file,n,scale);
    const blob=await canvasBlob(canvas,format,quality);
    outputs.push({blob,name:`${stripExtension(file.name)}-page-${n}.${format==="image/png"?"png":"jpg"}`});
    canvas.width=1;canvas.height=1;onProgress?.(n,pdf.numPages);
  }
  return outputs;
}

export async function zipBlobs(files, filename="document-images.zip") {
  const zip = new JSZip();
  files.forEach(({name,blob})=>zip.file(name,blob));
  return zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
}

export async function compressPdf(file, { quality=.88, mode="standard", onProgress }={}) {
  const targetQuality = Math.min(Math.max(Number(quality) || 0.88, 0.65), 1);
  if(mode === "standard") {
    const pdf=await PDFDocument.load(await file.arrayBuffer());
    return {data:await pdf.save({useObjectStreams:true}),originalSize:file.size};
  }
  const source=await PDFDocument.load(await file.arrayBuffer());
  const rendered=await renderPdfImages(file,{scale:1.5,format:"image/jpeg",quality:targetQuality,onProgress});
  const out=await PDFDocument.create();
  for(let i=0;i<rendered.length;i++) {
    const image=await out.embedJpg(await rendered[i].blob.arrayBuffer());
    const size=source.getPage(i).getSize();
    const page=out.addPage([size.width,size.height]);
    page.drawImage(image,{x:0,y:0,width:size.width,height:size.height});
  }
  return {data:await out.save({useObjectStreams:true}),originalSize:file.size};
}

export async function getPdfMetadata(file){const pdf=await PDFDocument.load(await file.arrayBuffer());return {title:pdf.getTitle()||"",author:pdf.getAuthor()||"",subject:pdf.getSubject()||"",creator:pdf.getCreator()||"",producer:pdf.getProducer()||"",keywords:pdf.getKeywords()||[],pageCount:pdf.getPageCount()};}
export async function removeMetadata(file){const pdf=await PDFDocument.load(await file.arrayBuffer());pdf.setTitle("");pdf.setAuthor("");pdf.setSubject("");pdf.setKeywords([]);pdf.setCreator("");pdf.setProducer("");return pdf.save({useObjectStreams:true});}
export function downloadBlob(blob, filename){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
