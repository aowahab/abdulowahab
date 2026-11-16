import {randomUUID} from 'node:crypto';
import {get} from '@vercel/blob';
import {handleUpload} from '@vercel/blob/client';
import {inflateRawSync} from 'node:zlib';
import {demand,text,uuid,StudyError} from './validation.js';
const TYPES=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'];
export async function validateAssetBytes(bytes,type){
 demand(bytes.length>0&&bytes.length<=20*1024*1024,'Attachment must be 20 MiB or smaller');const b=Buffer.from(bytes);
 const head=b.subarray(0,16),ascii=head.toString('ascii');let valid=false;
 if(type==='application/pdf')valid=ascii.startsWith('%PDF-');
 if(type==='image/jpeg')valid=b[0]===255&&b[1]===216&&b[2]===255;
 if(type==='image/png')valid=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/webp')valid=ascii.startsWith('RIFF')&&b.subarray(8,12).toString()==='WEBP';
 if(type===TYPES[1]){
  let end=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(b.readUInt32LE(i)===0x06054b50){end=i;break;}
  demand(end>=0&&end+22+b.readUInt16LE(end+20)===b.length,'Invalid DOCX archive');
  const count=b.readUInt16LE(end+10),directory=b.readUInt32LE(end+16),directorySize=b.readUInt32LE(end+12);
  demand(count>0&&count<=2000&&directory+directorySize<=end,'Unsafe document archive');
  let cursor=directory,total=0,main=null,hasTypes=false;
  for(let i=0;i<count;i++){
   demand(cursor+46<=end&&b.readUInt32LE(cursor)===0x02014b50,'Invalid archive directory');
   const flags=b.readUInt16LE(cursor+8),method=b.readUInt16LE(cursor+10),compressed=b.readUInt32LE(cursor+20),size=b.readUInt32LE(cursor+24),nameLength=b.readUInt16LE(cursor+28),extra=b.readUInt16LE(cursor+30),comment=b.readUInt16LE(cursor+32),local=b.readUInt32LE(cursor+42);
   const next=cursor+46+nameLength+extra+comment;demand(next<=directory+directorySize,'Invalid archive entry');
   const name=b.subarray(cursor+46,cursor+46+nameLength).toString('utf8');total+=size;
   demand(!(flags&1)&&[0,8].includes(method)&&size!==0xffffffff&&compressed!==0xffffffff&&total<=100*1024*1024&&size<=Math.max(1,compressed)*100,'Unsafe document archive');
   demand(!name.includes('..')&&!name.startsWith('/')&&!/vbaProject|word\/embeddings\//i.test(name),'Embedded executable objects are not accepted');
   if(name==='[Content_Types].xml')hasTypes=true;
   if(name==='word/document.xml')main={local,compressed,size,method};cursor=next;
  }
  demand(main&&hasTypes,'DOCX document is missing');demand(main.size<=300000,'Word document text is too large');
  demand(main.local+30<=directory&&b.readUInt32LE(main.local)===0x04034b50,'Invalid local archive entry');
  const start=main.local+30+b.readUInt16LE(main.local+26)+b.readUInt16LE(main.local+28);demand(start+main.compressed<=directory,'Invalid compressed data');
  const compressed=b.subarray(start,start+main.compressed);let xmlBytes;
  try{xmlBytes=main.method===0?compressed:inflateRawSync(compressed,{maxOutputLength:300000});}catch{throw new StudyError('Unsafe or corrupt Word document');}
  demand(xmlBytes.length===main.size&&xmlBytes.length<=300000,'Invalid Word document size');
  const xml=xmlBytes.toString('utf8');demand(!/<!DOCTYPE|<!ENTITY/i.test(xml)&&/<(?:[A-Za-z]+:)?document\b/.test(xml),'Unsafe Word document');valid=true;
 }
 demand(valid,'File signature does not match the selected format');return true;
}
async function readBounded(stream,max=20*1024*1024){const reader=stream.getReader(),chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;demand(size<=max,'Attachment exceeds limit');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}return Buffer.concat(chunks);}
export function privateToken(){demand(process.env.STUDY_BLOB_READ_WRITE_TOKEN,'Private study storage is not configured. Set STUDY_BLOB_READ_WRITE_TOKEN for a verified private store.',503);return process.env.STUDY_BLOB_READ_WRITE_TOKEN;}
export async function materialUpload(request,body,db,admin){
 const token=privateToken();return handleUpload({request,body,token,
 onBeforeGenerateToken:async(pathname,clientPayload)=>{
  demand(admin,'Admin login required',401);let input;try{input=JSON.parse(clientPayload||'{}')}catch{throw Error('Invalid upload metadata')}
  const id=randomUUID(),name=text(input.name,180);demand(TYPES.includes(input.type),'Use PDF, DOCX, JPEG, PNG or WebP');
  demand(/^study-materials\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+$/.test(pathname),'Invalid attachment path');
  await db.query('INSERT INTO study.material_assets(id,object_key,name,mime_type,uploaded_by) VALUES($1,$2,$3,$4,$5)',[id,pathname,name,input.type,'portfolio-admin']);
  return {allowedContentTypes:[input.type],maximumSizeInBytes:20*1024*1024,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+5*60000,tokenPayload:JSON.stringify({id})};
 },
 onUploadCompleted:async({blob,tokenPayload})=>{
  const payload=JSON.parse(tokenPayload||'{}');demand(uuid(payload.id),'Invalid upload receipt');
  const r=await db.query('SELECT * FROM study.material_assets WHERE id=$1',[payload.id]);const row=r.rows[0];demand(row&&row.object_key===blob.pathname,'Attachment receipt mismatch');
  try{const result=await get(row.object_key,{access:'private',token,useCache:false});demand(result?.statusCode===200,'Private attachment unavailable');const bytes=await readBounded(result.stream);await validateAssetBytes(bytes,row.mime_type);await db.query("UPDATE study.material_assets SET state='validated',bytes=$2 WHERE id=$1",[row.id,bytes.length]);}
  catch(e){await db.query("UPDATE study.material_assets SET state='rejected' WHERE id=$1",[row.id]);throw e;}
 }});
}
export async function finalizeMaterialAsset(input,db){
 demand(typeof input.pathname==='string'&&input.pathname.startsWith('study-materials/'),'Invalid asset path');
 const r=await db.query('SELECT * FROM study.material_assets WHERE object_key=$1',[input.pathname]);const row=r.rows[0];demand(row,'Attachment missing',404);
 // Callback may still be in flight. Independently validate private bytes so retry is safe.
 demand(row.state!=='rejected','Attachment rejected');
 if(row.state!=='validated'){
  const result=await get(row.object_key,{access:'private',token:privateToken(),useCache:false});demand(result?.statusCode===200,'Wait for attachment upload');
  const bytes=await readBounded(result.stream);await validateAssetBytes(bytes,row.mime_type);await db.query("UPDATE study.material_assets SET state='validated',bytes=$2 WHERE id=$1",[row.id,bytes.length]);
 }
 return {id:row.id,name:row.name};
}
