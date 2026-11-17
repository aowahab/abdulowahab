import {randomUUID} from 'node:crypto';
import {transaction} from './db.js';
import {studyStorage} from './storage.js';
import {MarkingWorker} from './worker.js';
export async function retentionSweep(pool,{storage=studyStorage,limit=10}={}){
 // Tombstone expired guest data first; requests can no longer read it while deletion retries.
 await transaction(pool,async db=>{const rows=(await db.query("SELECT a.id FROM study.attempts a JOIN study.owners o ON o.id=a.owner_id WHERE a.deleted_at IS NULL AND o.kind='guest' AND o.created_at<clock_timestamp()-interval '30 days' ORDER BY a.id FOR UPDATE OF a LIMIT $1",[limit])).rows;
  for(const {id}of rows){await db.query('UPDATE study.attempts SET deleted_at=clock_timestamp() WHERE id=$1',[id]);await db.query("UPDATE study.marking_jobs SET state='failed',lease_token=NULL,lease_until=NULL,error_code='retention-deleted' WHERE attempt_id=$1 AND state IN ('queued','running')",[id]);await db.query("INSERT INTO study.deletion_jobs(id,attempt_id,state) VALUES($1,$2,'queued') ON CONFLICT DO NOTHING",[randomUUID(),id]);}
 });
 const pending=(await pool.query("SELECT id,attempt_id FROM study.deletion_jobs WHERE state IN ('queued','failed') ORDER BY created_at LIMIT $1",[limit])).rows;let purged=0,failed=0;
 for(const job of pending){try{
  const files=(await pool.query("SELECT object_key FROM study.uploads WHERE attempt_id=$1 AND state<>'deleted'",[job.attempt_id])).rows;
  for(const file of files)await storage.remove(file.object_key);
  await transaction(pool,async db=>{
   const jobs=(await db.query('SELECT id FROM study.marking_jobs WHERE attempt_id=$1',[job.attempt_id])).rows;for(const j of jobs)await new MarkingWorker(pool).settle(db,j.id);
   await db.query('DELETE FROM study.feedback_overrides WHERE feedback_id IN (SELECT f.id FROM study.feedback f JOIN study.marking_jobs j ON j.id=f.job_id WHERE j.attempt_id=$1)',[job.attempt_id]);
   for(const table of ['feedback','transcriptions','grading_reservations'])await db.query(`DELETE FROM study.${table} WHERE job_id IN (SELECT id FROM study.marking_jobs WHERE attempt_id=$1)`,[job.attempt_id]);
   for(const table of ['marking_jobs','uploads','responses','audit_events','deletion_jobs'])await db.query(`DELETE FROM study.${table} WHERE attempt_id=$1`,[job.attempt_id]);
   await db.query('DELETE FROM study.attempts WHERE id=$1 AND deleted_at IS NOT NULL',[job.attempt_id]);
  });purged++;
 }catch{failed++;await pool.query("UPDATE study.deletion_jobs SET state='failed',error_code='storage-or-purge-retry' WHERE id=$1",[job.id]);}}
 // Account assessment results remain; private originals/OCR expire after 180 days.
 const expired=(await pool.query("SELECT u.id,u.attempt_id,u.object_key FROM study.uploads u JOIN study.attempts a ON a.id=u.attempt_id WHERE u.state<>'deleted' AND ((u.delete_after<=clock_timestamp()) OR (a.submission_manifest IS NULL AND u.authorized_at<clock_timestamp()-interval '24 hours')) ORDER BY u.authorized_at LIMIT $1",[limit])).rows;
 for(const file of expired){try{await transaction(pool,async db=>{await db.query('SELECT id FROM study.attempts WHERE id=$1 FOR UPDATE',[file.attempt_id]);await db.query("UPDATE study.uploads SET state='rejected',error_code='retention-expired' WHERE id=$1 AND state<>'deleted'",[file.id]);const cancelled=(await db.query("UPDATE study.marking_jobs SET state='review-required',lease_token=NULL,lease_until=NULL,error_code='script-retention-expired' WHERE attempt_id=$1 AND state IN ('queued','running') RETURNING id",[file.attempt_id])).rows;for(const job of cancelled)await new MarkingWorker(pool).settle(db,job.id);if(cancelled.length)await db.query("UPDATE study.attempts SET state='review-required' WHERE id=$1",[file.attempt_id]);});await storage.remove(file.object_key);await pool.query("UPDATE study.uploads SET state='deleted' WHERE id=$1",[file.id]);}catch{failed++;}}
 await pool.query('DELETE FROM study.transcriptions WHERE delete_after<=clock_timestamp()');
 await pool.query("DELETE FROM study.audit_events WHERE action='admin-marking-review' AND created_at<clock_timestamp()-interval '180 days'");
 await pool.query("DELETE FROM study.sessions WHERE expires_at<=clock_timestamp() OR revoked_at IS NOT NULL");
 await pool.query("DELETE FROM study.request_limits WHERE bucket<clock_timestamp()-interval '2 days'");
 return {purged,failed};
}
