import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {transaction} from './db.js';
import {StudyService} from './service.js';
import {demand,uuid,text} from './validation.js';
import {STUDY_LIMITS} from '../../shared/study/resource-policy.js';
const digest=value=>createHash('sha256').update(value).digest('hex');
export const SCRIPT_TYPES=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'];
const time=value=>new Date(value).getTime();
export class WrittenService {
 constructor(pool){this.pool=pool;this.base=new StudyService(pool);}
 async locked(db,id,owner){const a=await this.base.ownerAttempt(db,id,owner,true);demand(a.format!=='mcq','Choose a written paper');return a;}
 async sync(db,a){if(a.state==='active'&&time(a.server_now)>=time(a.exam_deadline)){a.state=time(a.server_now)>=time(a.upload_deadline)?'expired':'uploading';await db.query('UPDATE study.attempts SET state=$2 WHERE id=$1',[a.id,a.state]);}else if(a.state==='uploading'&&time(a.server_now)>=time(a.upload_deadline)){a.state='expired';await db.query("UPDATE study.attempts SET state='expired' WHERE id=$1",[a.id]);}return a;}
 async start(owner,input,{storageReady=false}={}){
  demand(storageReady,'Private written-script storage must be connected before starting an exam',503);
  demand(uuid(input.paperId)&&uuid(input.startKey),'Invalid start request');
  return transaction(this.pool,async db=>{
   const who=(await db.query('SELECT kind FROM study.owners WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[owner])).rows[0];demand(who,'Session expired',401);
   const previous=(await db.query('SELECT id,paper_id FROM study.attempts WHERE owner_id=$1 AND start_key=$2 AND deleted_at IS NULL',[owner,input.startKey])).rows[0];
   if(previous){demand(previous.paper_id===input.paperId,'Start key already used',409);return {id:previous.id};}
   const p=(await db.query("SELECT * FROM study.papers WHERE id=$1 AND format IN ('written','written-case')",[input.paperId])).rows[0];demand(p,'Written paper not found',404);
   const active=(await db.query("SELECT count(*)::int AS n FROM study.attempts WHERE owner_id=$1 AND deleted_at IS NULL AND state IN ('active','uploading') AND upload_deadline>clock_timestamp()",[owner])).rows[0].n;demand(active===0,'Finish your current exam first',409);
   const count=(await db.query("SELECT count(*)::int AS n FROM study.attempts a JOIN study.papers p ON p.id=a.paper_id WHERE a.owner_id=$1 AND p.format<>'mcq' AND a.started_at>clock_timestamp()-interval '1 day'",[owner])).rows[0].n;
   demand(count<(who.kind==='account'?3:1),'Daily written-practice allowance reached',429);
   const id=randomUUID();await db.query("INSERT INTO study.attempts(id,owner_id,paper_id,start_key,state,started_at,exam_deadline,upload_deadline) VALUES($1,$2,$3,$4,'active',clock_timestamp(),clock_timestamp()+($5*interval '1 second'),clock_timestamp()+(($5+1800)*interval '1 second'))",[id,owner,p.id,input.startKey,p.duration_seconds]);return {id};
  });
 }
 async view(owner,id){return transaction(this.pool,async db=>{
  const a=await this.sync(db,await this.locked(db,id,owner));
  const uploads=(await db.query("SELECT id,filename,mime_type,bytes,page_order,question_id,state,error_code,page_count FROM study.uploads WHERE attempt_id=$1 AND state<>'deleted' ORDER BY page_order",[id])).rows;
  const job=(await db.query('SELECT id,state,error_code FROM study.marking_jobs WHERE attempt_id=$1 ORDER BY generation DESC LIMIT 1',[id])).rows[0];
  const feedback=job?(await db.query('SELECT f.id,f.score,f.maximum,f.criteria,f.summary,f.transcription_status FROM study.feedback f WHERE job_id=$1',[job.id])).rows[0]:null;
  let override=null;if(feedback)override=(await db.query('SELECT replacement,reason,created_at FROM study.feedback_overrides WHERE feedback_id=$1 ORDER BY created_at DESC LIMIT 1',[feedback.id])).rows[0]||null;
  return {id:a.id,format:a.format,state:a.state,title:a.blueprint.title,subjectId:a.subject_id,sessionId:a.session_id,serverNow:a.server_now,deadline:a.exam_deadline,uploadDeadline:a.upload_deadline,rules:a.blueprint.allowedResources,questions:a.private_snapshot.questions.map(q=>({id:q.id,prompt:q.prompt,maxMarks:q.maxMarks})),uploads,job:job?{state:job.state,errorCode:job.error_code}:null,feedback:feedback?{...feedback,override}:null};
 });}
 async reserveUpload(owner,input){
  demand(uuid(input.id),'Invalid attempt');demand(SCRIPT_TYPES.includes(input.type),'Use PDF, DOCX, JPEG, PNG or WebP');
  demand(Number.isSafeInteger(input.bytes)&&input.bytes>0&&input.bytes<=STUDY_LIMITS.fileBytes,'Choose a file up to 20 MiB');const filename=text(input.name,180);
  return transaction(this.pool,async db=>{
   const a=await this.sync(db,await this.locked(db,input.id,owner));demand(a.state==='uploading'&&time(a.server_now)<time(a.upload_deadline),'Script uploads are allowed only during the 30-minute window',409);
   demand(!a.submission_manifest,'Script already submitted',409);
   demand(!input.questionId||a.private_snapshot.questions.some(q=>q.id===input.questionId),'Unknown question');
   await db.query("UPDATE study.uploads SET state='rejected',error_code='authorization-expired' WHERE attempt_id=$1 AND state='authorized' AND authorization_expires_at<clock_timestamp()",[a.id]);
   const stats=(await db.query("SELECT count(*)::int AS n,COALESCE(sum(bytes),0)::bigint AS bytes,COALESCE(max(page_order),0)::int AS last FROM study.uploads WHERE attempt_id=$1 AND state NOT IN ('rejected','deleted')",[a.id])).rows[0];
   demand(stats.n<40&&Number(stats.bytes)+input.bytes<=50*1024*1024,'Attempt upload limit reached');
   const last=(await db.query('SELECT COALESCE(max(page_order),0)::int AS n FROM study.uploads WHERE attempt_id=$1',[a.id])).rows[0].n;
   const id=randomUUID(),grant=randomBytes(32).toString('hex'),pathname=`study-scripts/${a.id}/${id}`;
   await db.query("INSERT INTO study.uploads(id,attempt_id,object_key,mime_type,bytes,page_order,state,authorized_at,authorization_expires_at,filename,question_id,authorization_hash,delete_after) VALUES($1,$2,$3,$4,$5,$6,'authorized',clock_timestamp(),LEAST(clock_timestamp()+interval '5 minutes',$7),$8,$9,$10,clock_timestamp()+interval '180 days')",[id,a.id,pathname,input.type,input.bytes,last+1,a.upload_deadline,filename,input.questionId||null,digest(grant)]);
   return {id,pathname,grant,expiresAt:a.upload_deadline};
  });
 }
 async uploadGrant(id,grant){demand(uuid(id)&&/^[a-f0-9]{64}$/.test(grant||''),'Invalid upload grant',401);const r=await this.pool.query("SELECT u.*,a.owner_id,a.upload_deadline FROM study.uploads u JOIN study.attempts a ON a.id=u.attempt_id WHERE u.id=$1 AND u.authorization_hash=$2 AND u.state='authorized' AND u.authorization_expires_at>clock_timestamp() AND a.state='uploading' AND a.submission_manifest IS NULL AND a.deleted_at IS NULL AND a.upload_deadline>clock_timestamp()",[id,digest(grant)]);demand(r.rows.length,'Upload grant expired or unavailable',403);return r.rows[0];}
 async receipt(id,{pathname,bytes,sha256,pages}){return transaction(this.pool,async db=>{
  demand(uuid(id),'Invalid receipt');let row=(await db.query('SELECT * FROM study.uploads WHERE id=$1',[id])).rows[0];demand(row,'Upload not found',404);
  const a=await this.sync(db,await this.locked(db,row.attempt_id,(await db.query('SELECT owner_id FROM study.attempts WHERE id=$1',[row.attempt_id])).rows[0]?.owner_id));
  row=(await db.query('SELECT * FROM study.uploads WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(row.state==='validated'){demand(row.object_key===pathname&&Number(row.bytes)===bytes&&row.sha256===sha256,'Upload version conflict',409);return {id,repeated:true};}
  demand(a.state==='uploading'&&!a.submission_manifest&&time(a.server_now)<time(a.upload_deadline),'Upload receipt arrived after the submission cutoff',409);
  demand(row.object_key===pathname&&Number(row.bytes)===bytes,'Uploaded file does not match its authorization');
  demand(Number.isSafeInteger(pages)&&pages>=1&&pages<=60,'Script page limit exceeded');
  const sum=(await db.query("SELECT COALESCE(sum(page_count),0)::int AS n FROM study.uploads WHERE attempt_id=$1 AND state='validated' AND id<>$2",[a.id,id])).rows[0].n;demand(sum+pages<=60,'Use at most 60 pages per attempt');
  demand(row.state==='authorized'||row.state==='received','Upload rejected',409);
  await db.query("UPDATE study.uploads SET state='validated',received_at=clock_timestamp(),validated_at=clock_timestamp(),sha256=$2,page_count=$3 WHERE id=$1",[id,sha256,pages]);return {id};
 });}
 async reorder(owner,input){demand(Array.isArray(input.uploadIds)&&input.uploadIds.length>0&&input.uploadIds.every(uuid)&&new Set(input.uploadIds).size===input.uploadIds.length,'Invalid page ordering');return transaction(this.pool,async db=>{
  const a=await this.sync(db,await this.locked(db,input.id,owner));demand(a.state==='uploading'&&!a.submission_manifest,'Ordering is closed',409);
  const ids=(await db.query("SELECT id FROM study.uploads WHERE attempt_id=$1 AND state='validated'",[a.id])).rows.map(r=>r.id);demand(ids.length===input.uploadIds.length&&ids.every(id=>input.uploadIds.includes(id)),'Order every validated file exactly once');
  const all=(await db.query('SELECT id FROM study.uploads WHERE attempt_id=$1 ORDER BY page_order',[a.id])).rows.map(r=>r.id);
  const ordered=[...input.uploadIds,...all.filter(id=>!input.uploadIds.includes(id))];
  for(let i=0;i<ordered.length;i++)await db.query('UPDATE study.uploads SET page_order=$2 WHERE id=$1',[ordered[i],i+1]);return {ok:true};
 });}
 async submit(owner,input){demand(input.consent===true,'Review the script and consent before submission');return transaction(this.pool,async db=>{
  const a=await this.sync(db,await this.locked(db,input.id,owner));if(a.submission_manifest)return {id:a.id,repeated:true};
  demand(a.state==='uploading'&&time(a.server_now)<time(a.upload_deadline),'Submission window has closed',409);
  const files=(await db.query("SELECT id,object_key,mime_type,bytes,page_order,sha256,question_id,page_count FROM study.uploads WHERE attempt_id=$1 AND state='validated' ORDER BY page_order",[a.id])).rows;
  demand(files.length>0,'Upload and validate at least one answer file');
  demand(!(await db.query("SELECT 1 FROM study.uploads WHERE attempt_id=$1 AND state IN ('authorized','received') LIMIT 1",[a.id])).rows.length,'Wait for pending file receipts or remove incomplete files before submission',409);
  const manifest=files.map(f=>({...f,bytes:Number(f.bytes)})),hash=digest(JSON.stringify(manifest)),jobId=randomUUID();
  await db.query("UPDATE study.attempts SET state='submitted',submitted_at=clock_timestamp(),submission_manifest=$2,submission_digest=$3,consent=$4 WHERE id=$1",[a.id,JSON.stringify(manifest),hash,JSON.stringify({version:'study-script-review-v1',aiAndAdminReview:true,at:new Date(a.server_now).toISOString()})]);
  await db.query("INSERT INTO study.marking_jobs(id,attempt_id,generation,state,input_digest,rubric_version) VALUES($1,$2,1,'queued',$3,'paper-snapshot-v1')",[jobId,a.id,hash]);return {id:a.id,jobId,repeated:false};
 });}
 async discard(owner,input){return transaction(this.pool,async db=>{const a=await this.sync(db,await this.locked(db,input.id,owner));demand(a.state==='uploading'&&!a.submission_manifest,'Uploads are closed',409);demand(uuid(input.uploadId),'Invalid file');await db.query("UPDATE study.uploads SET state='rejected',error_code='discarded',delete_after=clock_timestamp() WHERE id=$1 AND attempt_id=$2",[input.uploadId,a.id]);return {ok:true};});}
 async script(owner,id,{admin=false}={}){demand(uuid(id),'Invalid file');const r=await this.pool.query("SELECT u.* FROM study.uploads u JOIN study.attempts a ON a.id=u.attempt_id WHERE u.id=$1 AND a.deleted_at IS NULL AND u.state='validated' AND (a.owner_id=$2 OR $3::boolean)",[id,owner||null,admin]);demand(r.rows.length,'Script not found',404);return r.rows[0];}
}
