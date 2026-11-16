import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {validateAssetBytes} from './assets.js';
import {demand} from './validation.js';
const require=createRequire(import.meta.url);
export const sha256=b=>createHash('sha256').update(b).digest('hex');
export async function pdfDocument(bytes){
 // Native geometry is installed before loading PDF.js; never evaluate embedded PDF JavaScript.
 const canvas=await import('@napi-rs/canvas');
 for(const k of ['DOMMatrix','ImageData','Path2D'])if(!globalThis[k])globalThis[k]=canvas[k];
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const task=getDocument({data:new Uint8Array(bytes),standardFontDataUrl:dirname(require.resolve('pdfjs-dist/package.json'))+'/standard_fonts/',isEvalSupported:false,useSystemFonts:false,disableFontFace:true,stopAtErrors:true});const doc=await task.promise;return {numPages:doc.numPages,getPage:n=>doc.getPage(n),destroy:()=>task.destroy()};
}
export function imageDimensions(b,type){
 let width=0,height=0;
 if(type==='image/png'&&b.length>=24){width=b.readUInt32BE(16);height=b.readUInt32BE(20);}
 if(type==='image/jpeg'){let i=2;while(i+9<b.length){if(b[i]!==255){i++;continue;}const marker=b[i+1];if(marker===0xda||marker===0xd9)break;if(marker===0xd8||marker===0x01){i+=2;continue;}const n=b.readUInt16BE(i+2);demand(n>=2&&i+n+2<=b.length,'Invalid JPEG');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){height=b.readUInt16BE(i+5);width=b.readUInt16BE(i+7);break;}i+=n+2;}}
 if(type==='image/webp'&&b.length>=30){const kind=b.toString('ascii',12,16);if(kind==='VP8X'){width=1+b.readUIntLE(24,3);height=1+b.readUIntLE(27,3);}else if(kind==='VP8 '){width=b.readUInt16LE(26)&0x3fff;height=b.readUInt16LE(28)&0x3fff;}else if(kind==='VP8L'&&b[20]===0x2f){const n=b.readUInt32LE(21);width=(n&0x3fff)+1;height=((n>>>14)&0x3fff)+1;}}
 demand(width>0&&height>0&&width*height<=25000000,'Image dimensions exceed the 25 megapixel limit');return {width,height};
}
export async function inspectScript(bytes,type){
 await validateAssetBytes(bytes,type);
 if(type.startsWith('image/')){imageDimensions(Buffer.from(bytes),type);return {pages:1,sha256:sha256(bytes)};}
 if(type==='application/pdf'){const doc=await pdfDocument(bytes);try{demand(doc.numPages>=1&&doc.numPages<=60,'Use at most 60 pages');return {pages:doc.numPages,sha256:sha256(bytes)};}finally{await doc.destroy();}}
 // DOCX pagination depends on fonts/layout. Reject excessive explicit breaks; store one logical text document. Physical Word pagination remains unverified.
 const xml=await wordXml(bytes);demand((xml.match(/w:type=["']page["']|<w:lastRenderedPageBreak\b/g)||[]).length<60,'Use at most 60 explicit Word page breaks');return {pages:1,sha256:sha256(bytes)};
}
async function wordXml(bytes){await validateAssetBytes(bytes,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(bytes);return zip.file('word/document.xml').async('string');}
async function ocrImage(bytes){
 // Local bundled language data, with no remote script/language downloads.
 const {createWorker}=await import('tesseract.js');const dir=await mkdtemp(join(tmpdir(),'study-ocr-'));let worker;
 try{for(const lang of ['eng','ben']){const root=dirname(require.resolve('@tesseract.js-data/'+lang+'/package.json'));const gzip=await readFile(join(root,'4.0.0_best_int',lang+'.traineddata.gz'));await writeFile(join(dir,lang+'.traineddata'),gunzipSync(gzip));}
 worker=await createWorker(['eng','ben'],1,{langPath:dir,gzip:false,cacheMethod:'none'});
 let timer;try{return await Promise.race([worker.recognize(bytes).then(r=>({text:r.data.text,confidence:r.data.confidence})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('OCR timeout')),60000)})]);}finally{clearTimeout(timer);}
 }finally{if(worker)await worker.terminate();await rm(dir,{recursive:true,force:true});}
}
export async function extractScript(bytes,type,{ocr=ocrImage}={}){
 const inspected=await inspectScript(bytes,type),pages=[];
 if(type==='application/pdf'){
  const doc=await pdfDocument(bytes);try{for(let n=1;n<=doc.numPages;n++){
   const p=await doc.getPage(n),content=await p.getTextContent(),text=content.items.map(i=>i.str||'').join(' ').trim();
   if(text.length>=30)pages.push({page:n,text,method:'pdf-text',confidence:null,review:false});
   else{const {createCanvas}=await import('@napi-rs/canvas');const v=p.getViewport({scale:1.5});demand(v.width*v.height<=25000000,'PDF render dimensions exceed limit');const canvas=createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;const out=await ocr(canvas.toBuffer('image/png'));pages.push({page:n,...out,method:'ocr',review:true});}p.cleanup();
  }}finally{await doc.destroy();}
 }else if(type.startsWith('image/')){const out=await ocr(bytes);pages.push({page:1,...out,method:'ocr',review:true});}
 else{const xml=await wordXml(bytes);const {XMLParser}=await import('fast-xml-parser');const tree=new XMLParser({ignoreAttributes:false,preserveOrder:true,processEntities:false}).parse(xml);let tokens=[];function visit(v){if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(k==='#text')tokens.push(String(x));else visit(x);if(k==='w:p')tokens.push('\n');}}visit(tree);pages.push({page:1,text:tokens.join(' ').trim(),method:'docx-text',confidence:null,review:/<w:(drawing|pict|object)\b/.test(xml),pagination:'Logical document; Word layout page numbers are not verified'});}
 demand(pages.reduce((n,p)=>n+p.text.length,0)<=120000,'Extracted script text exceeds worker limit');
 return {...inspected,pages,reviewRequired:pages.some(p=>p.review||p.text.trim().length<30)};
}
