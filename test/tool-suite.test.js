import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import ExcelJS from 'exceljs';
import {parsePageRange} from '../src/toolFiles.js';
import {organisePdf,protectPdf} from '../src/pdfOperations.js';
import {mergeExcelFiles} from '../src/excelMerge.js';
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>bytes});
async function fixture(){const doc=await PDFDocument.create();doc.addPage([200,300]);doc.addPage([400,500]);return file('test.pdf',await doc.save())}
test('page ranges validate bounds and retain selected order',()=>{assert.deepEqual(parsePageRange('2,1-2',3),[1,0]);assert.deepEqual(parsePageRange('all',2),[0,1]);assert.throws(()=>parsePageRange('0-9',3));assert.throws(()=>parsePageRange('one',3))});
test('page organisation preserves sizes, order and requested rotation',async()=>{const bytes=await organisePdf(await fixture(),[{index:1,rotation:90},{index:0,rotation:0}]);const doc=await PDFDocument.load(bytes);assert.deepEqual(doc.getPages().map(p=>[p.getWidth(),p.getHeight(),p.getRotation().angle]),[[400,500,90],[200,300,0]])});
test('password protection encrypts and known-password unlock restores pages',async()=>{const protectedBytes=await protectPdf(await fixture(),'test-password');await assert.rejects(()=>PDFDocument.load(protectedBytes),/encrypted/i);const unlocked=await protectPdf(file('protected.pdf',protectedBytes),'test-password',true);assert.equal((await PDFDocument.load(unlocked)).getPageCount(),2);await assert.rejects(()=>protectPdf(file('protected.pdf',protectedBytes),'wrong',true),/incorrect/) });
async function workbook(name,headers,values){const wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet('Data');sheet.addRow(headers);sheet.addRow(values);return file(name,await wb.xlsx.writeBuffer())}
test('Excel merge stacks compatible headers and preserves value order',async()=>{const a=await workbook('a.xlsx',['Name','Amount'],['A',10]),b=await workbook('b.xlsx',['Name','Amount'],['B',20]);const out=await mergeExcelFiles([b,a],'rows'),doc=new ExcelJS.Workbook();await doc.xlsx.load(out.bytes);assert.equal(doc.worksheets.length,1);assert.equal(doc.worksheets[0].getCell('A2').value,'B');assert.equal(doc.worksheets[0].getCell('B3').value,10)});
test('Excel merge keeps distinct sheets or rejects incompatible stacked headers',async()=>{const a=await workbook('a.xlsx',['Name','Amount'],['A',10]),b=await workbook('b.xlsx',['Different','Header'],['B',20]);assert.equal((await mergeExcelFiles([a,b],'sheets')).sheets,2);await assert.rejects(()=>mergeExcelFiles([a,b],'rows'),/Headers differ/)});
