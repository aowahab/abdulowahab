import {randomUUID} from 'node:crypto';
import {transaction} from './db.js';
import {studyStorage} from './storage.js';
import {extractScript,sha256} from './extraction.js';
import {gradingConfiguration,gradeWithProvider,gradingPrompt,validateGrade} from './grading.js';
import {demand,uuid,text} from './validation.js';
const terminal=['completed','review-required','failed'];
export class MarkingWorker {
 constructor(pool,{storage=studyStorage,extract=extractScript,grade=gradeWithProvider,config=gradingConfiguration()}={}){Object.assign(this,{pool,storage,extract,grade,config});}
 async claim(){return transaction(this.pool,async db=>{
  // Serialize claims against deletion by taking the attempt lock first, consistently with submission/review.
  const a=(await db.query("SELECT a.id FROM study.attempts a WHERE a.deleted_at IS NULL AND EXISTS(SELECT 1 FROM study.marking_jobs j WHERE j.attempt_id=a.id AND ((j.state='queued' AND j.available_at<=clock_timestamp()) OR (j.state='running' AND j.lease_until<clock_timestamp()))) ORDER BY a.started_at FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];if(!a)return null;
  const j=(await db.query("SELECT j.*,a.owner_id,p.private_snapshot FROM study.marking_jobs j JOIN study.attempts a ON a.id=j.attempt_id JOIN study.papers p ON p.id=a.paper_id WHERE j.attempt_id=$1 AND ((j.state='queued' AND j.available_at<=clock_timestamp()) OR (j.state='running' AND j.lease_until<clock_timestamp())) ORDER BY j.generation DESC FOR UPDATE OF j LIMIT 1",[a.id])).rows[0];if(!j)return null;
  if(j.retries>=3){await db.query("UPDATE study.marking_jobs SET state='review-required',error_code='retry-limit',lease_token=NULL WHERE id=$1",[j.id]);await db.query("UPDATE study.attempts SET state='review-required' WHERE id=$1",[a.id]);await this.settle(db,j.id);return null;}
  const lease=randomUUID();await db.query("UPDATE study.marking_jobs SET state='running',retries=retries+1,lease_token=$2,lease_until=clock_timestamp()+interval '10 minutes' WHERE id=$1",[j.id,lease]);await db.query("UPDATE study.attempts SET state='marking' WHERE id=$1",[a.id]);return {...j,lease_token:lease,retries:j.retries+1};
 });}
 async fenced(db,j){const a=(await db.query('SELECT deleted_at FROM study.attempts WHERE id=$1 FOR UPDATE',[j.attempt_id])).rows[0];demand(a&&!a.deleted_at,'deleted');const row=(await db.query("SELECT * FROM study.marking_jobs WHERE id=$1 AND state='running' AND lease_token=$2 AND lease_until>clock_timestamp() FOR UPDATE",[j.id,j.lease_token])).rows[0];demand(row,'stale-lease');return row;}
 async reserve(j){return transaction(this.pool,async db=>{await this.fenced(db,j);const c=this.config,units=c.callUnits*3;demand(Number.isSafeInteger(units)&&units>0,'pricing-unavailable');let r=(await db.query('SELECT * FROM study.grading_reservations WHERE job_id=$1',[j.id])).rows[0];
  const day=r?.budget_day||(await db.query('SELECT CURRENT_DATE::text AS day')).rows[0].day;
  for(const [key,limit]of [['global',c.globalUnits],['owner:'+j.owner_id,c.ownerUnits]]){
   await db.query('INSERT INTO study.grading_budgets(budget_key,budget_day,limit_units) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[key,day,limit]);
   const b=(await db.query('SELECT * FROM study.grading_budgets WHERE budget_key=$1 AND budget_day=$2 FOR UPDATE',[key,day])).rows[0];
   if(!r){demand(Number(b.spent_units)+Number(b.reserved_units)+units<=Math.min(Number(b.limit_units),limit),'budget-exhausted');await db.query('UPDATE study.grading_budgets SET reserved_units=reserved_units+$3 WHERE budget_key=$1 AND budget_day=$2',[key,day,units]);}
  }
  if(!r){await db.query("INSERT INTO study.grading_reservations(job_id,budget_day,owner_id,reserved_units,state) VALUES($1,$2,$3,$4,'reserved')",[j.id,day,j.owner_id,units]);r={reserved_units:units,spent_units:0,state:'reserved'};}
  demand(r.state==='reserved'&&Number(r.spent_units)+c.callUnits<=Number(r.reserved_units),'budget-exhausted');
  // Charge the verified worst-case ceiling BEFORE dispatch. A crash cannot make a call free.
  await db.query('UPDATE study.grading_reservations SET spent_units=spent_units+$2 WHERE job_id=$1',[j.id,c.callUnits]);
  for(const key of ['global','owner:'+j.owner_id])await db.query('UPDATE study.grading_budgets SET reserved_units=reserved_units-$3,spent_units=spent_units+$3 WHERE budget_key=$1 AND budget_day=$2',[key,day,c.callUnits]);
 });}
 async settle(db,id){const r=(await db.query('SELECT * FROM study.grading_reservations WHERE job_id=$1 FOR UPDATE',[id])).rows[0];if(!r||r.state==='settled')return;const remaining=Number(r.reserved_units)-Number(r.spent_units);for(const key of ['global','owner:'+r.owner_id])await db.query('UPDATE study.grading_budgets SET reserved_units=reserved_units-$3 WHERE budget_key=$1 AND budget_day=$2',[key,r.budget_day,remaining]);await db.query("UPDATE study.grading_reservations SET state='settled' WHERE job_id=$1",[id]);}
 async finish(j,{state,errorCode=null,result=null,pages=null}){return transaction(this.pool,async db=>{
  await this.fenced(db,j);
  if(pages)await db.query("INSERT INTO study.transcriptions(job_id,body,delete_after) VALUES($1,$2,clock_timestamp()+interval '180 days') ON CONFLICT(job_id) DO NOTHING",[j.id,JSON.stringify(pages)]);
  if(result)await db.query("INSERT INTO study.feedback(id,job_id,score,maximum,criteria,transcription_status,summary) VALUES($1,$2,$3,$4,$5,'readable',$6) ON CONFLICT(job_id) DO NOTHING",[randomUUID(),j.id,result.score,result.maximum,JSON.stringify(result.criteria),JSON.stringify(result.summary)]);
  await db.query('UPDATE study.marking_jobs SET state=$2,error_code=$3,model_version=$4,provider_metadata=$5,lease_token=NULL,lease_until=NULL WHERE id=$1',[j.id,state,errorCode,this.config.model||null,JSON.stringify({provider:'groq',calibration:this.config.calibration||null,pricing:this.config.priceVersion||null,currency:this.config.currency||null,promptVersion:'study-grading-v1'})]);
  await db.query('UPDATE study.attempts SET state=$2,completed_at=CASE WHEN $2=\'completed\' THEN clock_timestamp() ELSE completed_at END WHERE id=$1',[j.attempt_id,state]);if(terminal.includes(state))await this.settle(db,j.id);
 });}
 async runOne(){const j=await this.claim();if(!j)return {worked:false};let pages=[];
 try{
  if(!this.config.ready){await this.finish(j,{state:'review-required',errorCode:'grading-configuration-required'});return {worked:true,state:'review-required'};}
  const a=(await this.pool.query('SELECT submission_manifest,submission_digest FROM study.attempts WHERE id=$1 AND deleted_at IS NULL',[j.attempt_id])).rows[0];demand(a&&a.submission_digest===j.input_digest,'manifest-conflict');
  let needsReview=false,totalPages=0;const began=Date.now();
  for(const file of a.submission_manifest){demand(Date.now()-began<8*60*1000,'processing-time-limit');const out=await this.storage.read(file.object_key);demand(out.bytes.length===file.bytes&&sha256(out.bytes)===file.sha256,'script-version-conflict');const extraction=await this.extract(out.bytes,file.mime_type);totalPages+=extraction.pages.length;demand(totalPages<=60,'page-limit');needsReview||=extraction.reviewRequired;pages.push(...extraction.pages.map(p=>({...p,uploadId:file.id,questionId:file.question_id})));}
  if(needsReview){await this.finish(j,{state:'review-required',errorCode:'transcription-review-required',pages});return {worked:true,state:'review-required'};}
  demand(Buffer.byteLength(gradingPrompt(j.private_snapshot.questions,pages),'utf8')<=30000,'grading-input-limit');
  await this.reserve(j);const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);let output;
  try{output=await this.grade({questions:j.private_snapshot.questions,pages,config:this.config,signal:controller.signal});}finally{clearTimeout(timeout);}
  // Revalidate injected/custom provider adapters as well as the default adapter.
  const result=validateGrade(output,j.private_snapshot.questions,pages);
  await this.finish(j,{state:'completed',result,pages});return {worked:true,state:'completed'};
 }catch(error){if(['deleted','stale-lease'].includes(error.message))return {worked:true,state:'cancelled'};
  const transient=error.statusCode===429||error.statusCode>=500||error.name==='AbortError'||error.name==='TimeoutError'||error.code==='ECONNRESET';
  try{if(transient&&j.retries<3){await transaction(this.pool,async db=>{await this.fenced(db,j);const retryAfter=Number(error.responseHeaders?.['retry-after']);const delay=Math.max(30*2**(j.retries-1),Number.isFinite(retryAfter)?retryAfter:0);await db.query("UPDATE study.marking_jobs SET state='queued',available_at=clock_timestamp()+($3*interval '1 second'),lease_token=NULL,lease_until=NULL,error_code='provider-retry' WHERE id=$1 AND lease_token=$2",[j.id,j.lease_token,delay]);await db.query("UPDATE study.attempts SET state='submitted' WHERE id=$1",[j.attempt_id]);});return {worked:true,state:'queued'};}
   await this.finish(j,{state:'review-required',errorCode:transient?'provider-unavailable':['invalid-output','invalid-rubric','budget-exhausted','grading-input-limit'].includes(error.message)?error.message:'processing-review-required',pages:pages.length?pages:null});
  }catch(fenceError){if(!['deleted','stale-lease'].includes(fenceError.message))throw fenceError;}return {worked:true,state:'review-required'};
 }}
}
export class ReviewService {
 constructor(pool){this.pool=pool;}
 async list(){return (await this.pool.query("SELECT a.id,a.state,p.blueprint,a.submitted_at FROM study.attempts a JOIN study.papers p ON p.id=a.paper_id WHERE a.deleted_at IS NULL AND a.consent IS NOT NULL ORDER BY a.submitted_at DESC LIMIT 100")).rows;}
 async detail(id){demand(uuid(id),'Invalid review');const a=(await this.pool.query('SELECT a.id,a.submission_manifest,p.private_snapshot FROM study.attempts a JOIN study.papers p ON p.id=a.paper_id WHERE a.id=$1 AND a.deleted_at IS NULL AND a.consent IS NOT NULL',[id])).rows[0];demand(a,'Review unavailable',404);const j=(await this.pool.query('SELECT id FROM study.marking_jobs WHERE attempt_id=$1 ORDER BY generation DESC LIMIT 1',[id])).rows[0];return {id:a.id,questions:a.private_snapshot.questions,files:a.submission_manifest.map(f=>({id:f.id,name:f.id,type:f.mime_type,pages:f.page_count})),pages:(await this.pool.query('SELECT body FROM study.transcriptions WHERE job_id=$1',[j.id])).rows[0]?.body||[]};}
 async save(input){demand(uuid(input.id),'Invalid review');demand(input.confirmed===true,'Confirm every original script page was reviewed');const reason=text(input.reason,2000);return transaction(this.pool,async db=>{
  const a=(await db.query('SELECT a.*,p.private_snapshot FROM study.attempts a JOIN study.papers p ON p.id=a.paper_id WHERE a.id=$1 AND a.deleted_at IS NULL AND a.consent IS NOT NULL FOR UPDATE OF a',[input.id])).rows[0];demand(a,'Review unavailable',404);
  const j=(await db.query('SELECT * FROM study.marking_jobs WHERE attempt_id=$1 ORDER BY generation DESC LIMIT 1 FOR UPDATE',[a.id])).rows[0];demand(j&&j.state!=='running','Wait for current marking to finish',409);
  demand(Array.isArray(input.pages)&&input.pages.length>0&&input.pages.length<=60,'Confirm script transcription pages');let count=0;for(const p of input.pages){const file=a.submission_manifest.find(f=>f.id===p.uploadId);demand(file&&Number.isSafeInteger(p.page)&&p.page>0&&p.page<=file.page_count,'Unknown script page');p.text=text(p.text,30000);count+=p.text.length;}demand(count<=120000,'Transcription exceeds limit');
  demand(new Set(input.pages.map(p=>p.uploadId+':'+p.page)).size===input.pages.length,'Duplicate transcription page');
  demand(a.submission_manifest.every(f=>input.pages.filter(p=>p.uploadId===f.id).length===f.page_count),'Confirm every submitted script page, including blank pages');
  const grade=validateGrade(input.grade,a.private_snapshot.questions,input.pages);grade.summary.label='Admin-reviewed practice assessment; not official ICAB marking';
  const old=(await db.query('SELECT id FROM study.feedback WHERE job_id=$1',[j.id])).rows[0];
  if(old)await db.query('INSERT INTO study.feedback_overrides(id,feedback_id,reviewer,reason,replacement) VALUES($1,$2,$3,$4,$5)',[randomUUID(),old.id,'portfolio-admin',reason,JSON.stringify(grade)]);
  else await db.query("INSERT INTO study.feedback(id,job_id,score,maximum,criteria,transcription_status,summary) VALUES($1,$2,$3,$4,$5,'readable',$6)",[randomUUID(),j.id,grade.score,grade.maximum,JSON.stringify(grade.criteria),JSON.stringify(grade.summary)]);
  // Original OCR remains intact; confirmed transcription is an audited, separate review input.
  await db.query('INSERT INTO study.audit_events(id,attempt_id,action,metadata) VALUES($1,$2,$3,$4)',[randomUUID(),a.id,'admin-marking-review',JSON.stringify({reason,reviewer:'portfolio-admin',confirmedPages:input.pages})]);
  await db.query("UPDATE study.marking_jobs SET state='completed',error_code=NULL,lease_token=NULL,lease_until=NULL WHERE id=$1",[j.id]);await db.query("UPDATE study.attempts SET state='completed',completed_at=clock_timestamp() WHERE id=$1",[a.id]);await new MarkingWorker(this.pool).settle(db,j.id);return {ok:true};
 });}
 async recheck(owner,input){demand(uuid(input.id),'Invalid attempt');return transaction(this.pool,async db=>{const a=(await db.query('SELECT * FROM study.attempts WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL AND submission_manifest IS NOT NULL FOR UPDATE',[input.id,owner])).rows[0];demand(a,'Submitted attempt not found',404);const reason=text(input.reason,2000);const j=(await db.query('SELECT * FROM study.marking_jobs WHERE attempt_id=$1 ORDER BY generation DESC LIMIT 1',[a.id])).rows[0];demand(j&&terminal.includes(j.state),'Marking is still in progress',409);const n=(await db.query("SELECT count(*)::int AS n FROM study.audit_events WHERE attempt_id=$1 AND action='recheck-request'",[a.id])).rows[0].n;demand(n<2,'Recheck allowance reached',429);await db.query('INSERT INTO study.audit_events(id,owner_id,attempt_id,action,metadata) VALUES($1,$2,$3,$4,$5)',[randomUUID(),owner,a.id,'recheck-request',JSON.stringify({reason})]);await db.query("UPDATE study.marking_jobs SET state='review-required',error_code='student-recheck-request' WHERE id=$1",[j.id]);await db.query("UPDATE study.attempts SET state='review-required' WHERE id=$1",[a.id]);return {ok:true};});}
}
