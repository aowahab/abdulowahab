import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,degrees} from 'pdf-lib';
import {mergePdfFiles,validatePdfFiles,PDF_LIMITS} from '../src/pdfMerge.js';
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>bytes});
async function fixture(sizes,rotation=0){const doc=await PDFDocument.create();for(const size of sizes){const page=doc.addPage(size);page.setRotation(degrees(rotation))}return doc.save()}
test('PDF merge preserves file order, all pages, page sizes and rotation',async()=>{
 const a=file('first.pdf',await fixture([[200,300]]));const b=file('second.pdf',await fixture([[400,500],[600,700]],90));
 const result=await mergePdfFiles([b,a]);const pdf=await PDFDocument.load(result.bytes);
 assert.equal(result.pages,3);assert.deepEqual(pdf.getPages().map(p=>[p.getWidth(),p.getHeight(),p.getRotation().angle]),[[400,500,90],[600,700,90],[200,300,0]]);
});
test('PDF merge rejects corrupt files and requires two files',async()=>{
 const valid=file('valid.pdf',await fixture([[200,300]]));
 await assert.rejects(()=>mergePdfFiles([valid]),/at least two/);
 await assert.rejects(()=>mergePdfFiles([valid,file('broken.pdf',new TextEncoder().encode('not a PDF'))]),/Could not read “broken.pdf”/);
});
test('selection rejects unsupported files and excess size/count before reading',()=>{
 assert.throws(()=>validatePdfFiles([{name:'notes.docx',size:100}]),/PDF files/);
 assert.throws(()=>validatePdfFiles([{name:'large.pdf',size:PDF_LIMITS.each+1}]),/25 MB/);
 assert.throws(()=>validatePdfFiles(Array.from({length:21},()=>({name:'a.pdf',size:1}))),/20 PDF/);
 assert.throws(()=>validatePdfFiles(Array.from({length:5},()=>({name:'a.pdf',size:PDF_LIMITS.each}))),/100 MB/);
});
test('cancelled merge produces no output',async()=>{
 const valid=file('valid.pdf',await fixture([[200,300]]));const controller=new AbortController();controller.abort();
 await assert.rejects(()=>mergePdfFiles([valid,valid],{signal:controller.signal}),{name:'AbortError'});
});
