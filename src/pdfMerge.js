export const PDF_LIMITS={files:20,each:25*1024*1024,total:100*1024*1024,pages:1000};
export function validatePdfFiles(files){
 if(files.length>PDF_LIMITS.files)throw Error('Choose up to 20 PDF files.');
 if(files.some(file=>!file.name||!/\.pdf$/i.test(file.name)||file.size>PDF_LIMITS.each))throw Error('Choose PDF files up to 25 MB each.');
 if(files.reduce((total,file)=>total+file.size,0)>PDF_LIMITS.total)throw Error('The selected PDFs must total 100 MB or less.');
}
export async function mergePdfFiles(files,{onProgress=()=>{},signal}={}){
 validatePdfFiles(files);if(files.length<2)throw Error('Choose at least two PDF files to merge.');
 const {PDFDocument}=await import('pdf-lib');const merged=await PDFDocument.create();let pages=0;
 for(let index=0;index<files.length;index++){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  onProgress(index+1,files.length);
  let source;
  try{source=await PDFDocument.load(await files[index].arrayBuffer())}catch(e){
   if(e.name==='EncryptedPDFError'||/encrypted/i.test(e.message||''))throw Error(`“${files[index].name}” is password-protected. Unlock it before merging.`);
   throw Error(`Could not read “${files[index].name}”. Choose a valid, unencrypted PDF.`);
  }
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const count=source.getPageCount();if(!count)throw Error(`“${files[index].name}” has no pages.`);
  pages+=count;if(pages>PDF_LIMITS.pages)throw Error('Merge up to 1,000 pages at a time.');
  const copied=await merged.copyPages(source,source.getPageIndices());for(const page of copied)merged.addPage(page);
 }
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 return {bytes:await merged.save(),pages};
}
