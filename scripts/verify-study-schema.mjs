// Isolated validation only. Never connects to DATABASE_URL or production.
// Usage: node scripts/verify-study-schema.mjs /absolute/path/to/pglite/dist/index.js
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(!process.argv[2]) throw Error('Provide a local PGlite module path; no remote database is used');
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
try {
 await db.exec(await readFile(new URL('../migrations/study/001_foundation.sql',import.meta.url),'utf8'));
 const {rows}=await db.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='study'");
 assert.equal(rows[0].count,17);
 const owner='00000000-0000-4000-8000-000000000001',paper='00000000-0000-4000-8000-000000000002';
 await db.query('INSERT INTO study.owners(id,kind) VALUES($1,$2)',[owner,'guest']);
 await assert.rejects(()=>db.query("INSERT INTO study.owners(id,kind) VALUES('00000000-0000-4000-8000-000000000003','account')"));
 await db.exec("INSERT INTO study.syllabus_versions VALUES('v1','[]','2026-11-16',now()); INSERT INTO study.subjects VALUES('v1','pl-far','PL','FAR'); INSERT INTO study.chapters VALUES('v1','pl-far','area-1','Reporting',1,'{}');");
 await db.query("INSERT INTO study.papers(id,syllabus_id,subject_id,logical_id,revision,session_id,format,duration_seconds,upload_seconds,total_marks,blueprint,private_snapshot,reviewed_by) VALUES($1,'v1','pl-far',$1,1,'2027-may-june','written',12600,1800,100,'{}','{}','reviewer')",[paper]);
 await assert.rejects(()=>db.query('UPDATE study.papers SET total_marks=90 WHERE id=$1',[paper]));
 await assert.rejects(()=>db.query("INSERT INTO study.attempts(id,owner_id,paper_id,start_key,state,started_at,exam_deadline,upload_deadline) VALUES('00000000-0000-4000-8000-000000000004',$1,$2,'00000000-0000-4000-8000-000000000005','active',now(),now()-interval '1 hour',now())",[owner,paper]));
 await db.exec('BEGIN; CREATE TABLE study.rollback_probe(id int); ROLLBACK;');
 assert.equal((await db.query("SELECT to_regclass('study.rollback_probe') AS name")).rows[0].name,null);
 console.log('Isolated schema checks passed: 17 tables, identity constraints, immutable papers, invalid deadlines and transaction rollback.');
} finally {await db.close();}
