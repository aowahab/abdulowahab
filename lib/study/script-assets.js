import {handleUpload} from '@vercel/blob/client';
import {privateToken} from './assets.js';
import {WrittenService} from './written.js';
import {studyStorage} from './storage.js';
import {inspectScript} from './extraction.js';
import {demand,uuid} from './validation.js';
export async function validateScriptReceipt(service,id,pathname,storage=studyStorage){
 const row=(await service.pool.query('SELECT object_key,mime_type,state FROM study.uploads WHERE id=$1',[id])).rows[0];
 demand(row&&row.object_key===pathname&&['authorized','validated'].includes(row.state),'Upload receipt unavailable',409);
 try{const file=await storage.read(pathname),result=await inspectScript(file.bytes,row.mime_type);return await service.receipt(id,{pathname,bytes:file.bytes.length,sha256:result.sha256,pages:result.pages});}
 catch(error){await service.pool.query("UPDATE study.uploads SET state='rejected',error_code='validation-failed',delete_after=clock_timestamp() WHERE id=$1 AND state='authorized'",[id]);throw error;}
}
export async function scriptUpload(request,body,db){
 const service=new WrittenService(db);
 return handleUpload({request,body,token:privateToken(),onBeforeGenerateToken:async(pathname,clientPayload)=>{
  let input;try{input=JSON.parse(clientPayload||'{}');}catch{demand(false,'Invalid upload grant');}
  const row=await service.uploadGrant(input.id,input.grant);demand(pathname===row.object_key,'Wrong upload destination',403);
  return {allowedContentTypes:[row.mime_type],maximumSizeInBytes:Number(row.bytes),addRandomSuffix:false,allowOverwrite:false,validUntil:new Date(row.authorization_expires_at).getTime(),tokenPayload:JSON.stringify({id:row.id})};
 },onUploadCompleted:async({blob,tokenPayload})=>{const input=JSON.parse(tokenPayload||'{}');demand(uuid(input.id),'Invalid receipt');await validateScriptReceipt(service,input.id,blob.pathname);}});
}
