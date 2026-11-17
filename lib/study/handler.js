import pg from 'pg';
import {get} from '@vercel/blob';
import {isAdmin,getCookie} from '../auth.js';
import {json,sameOrigin} from '../http.js';
import {StudyService} from './service.js';
import {WrittenService} from './written.js';
import {ProfileService} from './profiles.js';
import {ReviewService} from './worker.js';
import {verifyStudyIdentity,accountOwner} from './identity.js';
import {studyStorage} from './storage.js';
import {demand,StudyError} from './validation.js';
import {materialUpload,finalizeMaterialAsset,privateToken} from './assets.js';
let pool;
export function studyPool(){if(!pool){const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;demand(connectionString,'Study database is not configured',503);pool=new pg.Pool({connectionString,max:3,connectionTimeoutMillis:5000});}return pool;}
async function inputJSON(request){let size=0;const chunks=[],reader=request.body?.getReader();if(reader)try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;demand(size<=64000,'Request too large',413);chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{throw new StudyError('Invalid JSON');}}
export function createStudyHandler({db,adminCheck=isAdmin,identityCheck=verifyStudyIdentity,storage=studyStorage,secure=true}={}){
 return async function(request){try{
  const store=db||studyPool(),service=new StudyService(store),written=new WrittenService(store),profiles=new ProfileService(store),reviews=new ReviewService(store),url=new URL(request.url),op=url.searchParams.get('op')||'catalogue',admin=adminCheck(request);
  const resolve=async()=>{const identity=await identityCheck(request);return identity?accountOwner(store,identity):service.session(getCookie(request,'study_session'));};
  if(request.method==='GET'){
   if(op==='materials')return json({materials:await service.materials(false)});
   if(op==='papers')return json({papers:await service.papers(false)});
   if(op==='written-paper')return json(await service.writtenPaper(url.searchParams.get('id')));
   if(op==='admin'){demand(admin,'Admin login required',401);return json({materials:await service.materials(true),questions:await service.questions(),papers:await service.papers(true),privateUploadsConfigured:storage.available});}
   if(op==='reviews'){demand(admin,'Admin login required',401);return json({attempts:await reviews.list()});}
   if(op==='review'){demand(admin,'Admin login required',401);return json(await reviews.detail(url.searchParams.get('id')));}
   if(op==='asset'){
    const asset=await service.attachment(url.searchParams.get('id'),admin);const file=await get(asset.object_key,{access:'private',token:privateToken()});demand(file?.statusCode===200,'Attachment unavailable',404);
    return new Response(file.stream,{headers:{'content-type':asset.mime_type,'content-disposition':'attachment; filename="study-material"','cache-control':'no-store','x-content-type-options':'nosniff'}});
   }
   if(op==='script'){
    const owner=admin?null:await resolve();demand(owner||admin,'Sign in or resume your guest session',401);const file=await written.script(owner,url.searchParams.get('id'),{admin});const bytes=await storage.read(file.object_key);
    return new Response(bytes.bytes,{headers:{'content-type':file.mime_type,'content-disposition':'attachment; filename="answer-script"','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
   }
   const owner=await resolve();demand(owner,'Start a guest session first',401);
   if(op==='profile')return json({kind:(await store.query('SELECT kind FROM study.owners WHERE id=$1',[owner])).rows[0].kind});
   if(op==='attempt'){const a=await service.ownerAttempt(store,url.searchParams.get('id'),owner);return json(a.format==='mcq'?await service.attempt(owner,a.id):await written.view(owner,a.id));}
   if(op==='history')return json({attempts:await service.history(owner)});
   if(op==='progress')return json(await profiles.progress(owner));
   if(op==='export')return json(await profiles.export(owner,Number(url.searchParams.get('offset')||0)));
   throw new StudyError('Unknown operation',404);
  }
  demand(request.method==='POST','Method not allowed',405);
  if(op==='upload'||op==='script-upload'){
   const body=await inputJSON(request);if(body.type!=='blob.upload-completed')demand(sameOrigin(request),'Cross-site request blocked',403);
   if(op==='upload')return json(await materialUpload(request,body,store,admin));
   const {scriptUpload}=await import('./script-assets.js');return json(await scriptUpload(request,body,store));
  }
  demand(sameOrigin(request),'Cross-site request blocked',403);const input=await inputJSON(request);
  if(op==='session'){
   const existing=await service.session(getCookie(request,'study_session'));if(existing)return json({guest:true});
   await service.rateLimit('guest-session:'+(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local'),5);
   const guest=await service.newGuest();return json({guest:true},200,{'set-cookie':`study_session=${guest.token}; Path=/; HttpOnly; ${secure?'Secure; ':''}SameSite=Strict; Max-Age=2592000`});
  }
  if(['material','question','archive-question','paper','asset-finalize','review-save'].includes(op)){
   demand(admin,'Admin login required',401);
   if(op==='material')return json(await service.saveMaterial(input));if(op==='question')return json(await service.saveQuestion(input));if(op==='archive-question')return json(await service.archiveQuestion(input));if(op==='paper')return json(await service.createPaper(input));if(op==='asset-finalize')return json(await finalizeMaterialAsset(input,store));return json(await reviews.save(input));
  }
  const owner=await resolve();demand(owner,'Start a guest session first',401);await service.rateLimit('exam-write:'+owner,120);
  if(op==='start')return json(await service.start(owner,input));
  if(op==='written-start')return json(await written.start(owner,input,{storageReady:storage.available}));
  if(op==='script-authorize'){await service.rateLimit('script-authorize:'+owner,10);return json(await written.reserveUpload(owner,input));}
  if(op==='script-finalize'){
   const row=await written.script(owner,input.uploadId).catch(async()=>{const r=(await store.query('SELECT u.* FROM study.uploads u JOIN study.attempts a ON a.id=u.attempt_id WHERE u.id=$1 AND a.owner_id=$2 AND a.deleted_at IS NULL',[input.uploadId,owner])).rows[0];demand(r,'Upload unavailable',404);return r;});
   const {validateScriptReceipt}=await import('./script-assets.js');return json(await validateScriptReceipt(written,row.id,row.object_key,storage));
  }
  if(op==='script-order')return json(await written.reorder(owner,input));
  if(op==='script-discard')return json(await written.discard(owner,input));
  if(op==='written-submit'){await service.rateLimit('script-submit:'+owner,5);return json(await written.submit(owner,input));}
  if(op==='answer')return json(await service.answer(owner,input));
  if(op==='submit')return json(await service.submit(owner,input.id));
  if(op==='recheck')return json(await reviews.recheck(owner,input));
  if(op==='transfer'){const guest=await service.session(getCookie(request,'study_session'));demand(guest&&input.consent===true,'Guest session and transfer consent required',400);demand(await identityCheck(request),'Sign in before transferring history',401);return json(await profiles.transfer(guest,owner,input));}
  if(op==='delete')return json(await profiles.delete(owner,input));
  throw new StudyError('Unknown operation',404);
 }catch(error){if(error instanceof StudyError)return json({error:error.message},error.status);
  console.error('Study operation failed',error.code||error.name);return json({error:'Study service is unavailable. Database migrations and private services must be configured before use.'},503);
 }};
}
export const GET=createStudyHandler();export const POST=GET;
