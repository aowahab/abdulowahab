import pg from 'pg';
import {get} from '@vercel/blob';
import {isAdmin,getCookie} from '../auth.js';
import {json,sameOrigin} from '../http.js';
import {StudyService} from './service.js';
import {demand,StudyError} from './validation.js';
import {materialUpload,finalizeMaterialAsset,privateToken} from './assets.js';
let pool;
export function studyPool(){if(!pool){const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;demand(connectionString,'Study database is not configured',503);pool=new pg.Pool({connectionString,max:3,connectionTimeoutMillis:5000});}return pool;}
export function createStudyHandler({db,adminCheck=isAdmin,secure=true}={}){
 return async function(request){try{
  const store=db||studyPool(),service=new StudyService(store),op=new URL(request.url).searchParams.get('op')||'catalogue';const admin=adminCheck(request);
  if(request.method==='GET'){
   if(op==='materials')return json({materials:await service.materials(false)});
   if(op==='papers')return json({papers:await service.papers(false)});
   if(op==='written-paper')return json(await service.writtenPaper(new URL(request.url).searchParams.get('id')));
   if(op==='admin'){demand(admin,'Admin login required',401);return json({materials:await service.materials(true),questions:await service.questions(),papers:await service.papers(true),privateUploadsConfigured:!!process.env.STUDY_BLOB_READ_WRITE_TOKEN});}
   if(op==='asset'){
    const asset=await service.attachment(new URL(request.url).searchParams.get('id'),admin);const file=await get(asset.object_key,{access:'private',token:privateToken()});demand(file?.statusCode===200,'Attachment unavailable',404);
    return new Response(file.stream,{headers:{'content-type':asset.mime_type,'content-disposition':`attachment; filename="study-material.${asset.mime_type==='application/pdf'?'pdf':asset.mime_type.includes('wordprocessing')?'docx':asset.mime_type.split('/')[1]}"`,'cache-control':'no-store','x-content-type-options':'nosniff'}});
   }
   const owner=await service.session(getCookie(request,'study_session'));demand(owner,'Start a guest session first',401);
   if(op==='attempt')return json(await service.attempt(owner,new URL(request.url).searchParams.get('id')));
   if(op==='history')return json({attempts:await service.history(owner)});
   throw new StudyError('Unknown operation',404);
  }
  demand(request.method==='POST','Method not allowed',405);
  // Blob callback authenticates its signed payload in handleUpload; no owner-cookie requirement.
  if(op==='upload'){
   const raw=await request.text();demand(Buffer.byteLength(raw)<=64000,'Request too large',413);let body;try{body=JSON.parse(raw)}catch{throw new StudyError('Invalid JSON')}
   if(body.type!=='blob.upload-completed')demand(sameOrigin(request),'Cross-site request blocked',403);
   return json(await materialUpload(request,body,store,admin));
  }
  demand(sameOrigin(request),'Cross-site request blocked',403);
  const raw=await request.text();demand(Buffer.byteLength(raw)<=64000,'Request too large',413);let input;try{input=JSON.parse(raw||'{}')}catch{throw new StudyError('Invalid JSON')}
  if(op==='session'){
   const existing=await service.session(getCookie(request,'study_session'));if(existing)return json({guest:true});
   await service.rateLimit('guest-session:'+(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local'),5);
   const guest=await service.newGuest();return json({guest:true},200,{'set-cookie':`study_session=${guest.token}; Path=/; HttpOnly; ${secure?'Secure; ':''}SameSite=Strict; Max-Age=2592000`});
  }
  if(['material','question','archive-question','paper','asset-finalize'].includes(op)){
   demand(admin,'Admin login required',401);
   if(op==='material')return json(await service.saveMaterial(input));
   if(op==='question')return json(await service.saveQuestion(input));
   if(op==='archive-question')return json(await service.archiveQuestion(input));
   if(op==='paper')return json(await service.createPaper(input));
   return json(await finalizeMaterialAsset(input,store));
  }
  let owner=await service.session(getCookie(request,'study_session'));
  demand(owner,'Start a guest session first',401);
  await service.rateLimit('exam-write:'+owner,120);
  if(op==='start')return json(await service.start(owner,input));
  if(op==='answer')return json(await service.answer(owner,input));
  if(op==='submit')return json(await service.submit(owner,input.id));
  throw new StudyError('Unknown operation',404);
 }catch(error){if(error instanceof StudyError)return json({error:error.message},error.status);
  console.error('Study operation failed',error.code||error.name);return json({error:'Study service is unavailable. Database migrations and private storage must be configured before use.'},503);
 }};
}
export const GET=createStudyHandler();export const POST=GET;
