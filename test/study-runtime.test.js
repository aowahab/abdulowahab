import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localStudyDatabase} from './support/study-db.js';
import {StudyService} from '../lib/study/service.js';
import {seedPilot} from '../lib/study/pilot.js';
import {createStudyHandler} from '../lib/study/handler.js';
import {validateAssetBytes} from '../lib/study/assets.js';
import {questionInput} from '../lib/study/validation.js';
import {SOURCES} from '../shared/study/catalogue.js';
test('Study runtime: Admin publication, actual durable MCQ flow, isolation and written preparation',async()=>{
 const {pg,pool}=await localStudyDatabase();
 try{
 await seedPilot(pool);const service=new StudyService(pool);const handler=createStudyHandler({db:pool,adminCheck:r=>r.headers.get('x-test-admin')==='yes',secure:false});
 const call=async(op,body,cookie='',admin=false)=>handler(new Request('http://localhost/api/study?op='+op,{method:body===undefined?'GET':'POST',headers:{host:'localhost',origin:'http://localhost',cookie,...(admin?{'x-test-admin':'yes'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 const materials=(await (await call('materials')).json()).materials;assert.equal(materials.length,13);
 const material={subjectId:'cl-assurance',chapterId:'cl-assurance-area-1',title:'Unpublished lesson',body:'Private draft lesson',sourceUrl:SOURCES.syllabus,effectiveSession:'2027-may-june',kind:'lesson',state:'draft'};
 assert.equal((await call('material',material)).status,401);
 const saved=await (await call('material',material,'',true)).json();assert.ok(saved.logicalId);
 assert.ok(!(await service.materials()).some(m=>m.title===material.title));
 await service.saveMaterial({...material,logicalId:saved.logicalId,state:'published'});assert.ok((await service.materials()).some(m=>m.title===material.title));
 await service.saveMaterial({...material,logicalId:saved.logicalId,state:'archived'});assert.ok(!(await service.materials()).some(m=>m.title===material.title));
 const papers=await service.papers();assert.equal(papers.length,10);assert.equal(papers.filter(p=>p.format!=='mcq').length,9);
 assert.ok(!JSON.stringify(papers).includes('correctId'));assert.ok(!JSON.stringify(papers).includes('modelAnswer'));
 const paper=papers.find(p=>p.format==='mcq');const session=await call('session',{});assert.equal(session.status,200);const cookie=session.headers.get('set-cookie').split(';')[0];
 const startKey=randomUUID();const started=await (await call('start',{paperId:paper.id,startKey},cookie)).json();assert.ok(started.id);
 assert.equal((await (await call('start',{paperId:paper.id,startKey},cookie)).json()).id,started.id);
 let state=await service.attempt(await service.session(cookie.split('=')[1]),started.id);assert.equal(state.questions.length,3);assert.ok(!JSON.stringify(state).includes('correctId'));assert.ok(!JSON.stringify(state).includes('explanation'));
 const secret=(await service.papers(true)).find(p=>p.id===paper.id).private_snapshot;
 await assert.rejects(()=>service.createPaper({subjectId:'cl-assurance',title:'Incomplete full mock',sessionId:'2027-may-june',durationMinutes:90,allowedResources:'Closed book',purpose:'full-mock',sessionVerified:true,questionIds:secret.questions.map(q=>q.id)}),/specification/);
 const raw=(await service.questions()).find(q=>q.id===secret.questions[0].id);
 await service.saveQuestion({logicalId:raw.logical_id,subjectId:raw.subject_id,chapterId:raw.chapter_id,kind:'single-choice',prompt:raw.prompt.text,options:raw.answer_key.options,correctId:raw.answer_key.options.find(o=>o.id!==raw.answer_key.correctId).id,explanation:'Changed bank revision; old paper must stay unchanged.',maxMarks:Number(raw.max_marks),sourceUrl:SOURCES.syllabus});
 await service.archiveQuestion({logicalId:raw.logical_id});
 assert.equal((await service.papers(true)).find(p=>p.id===paper.id).private_snapshot.questions[0].correctId,secret.questions[0].correctId);
 
 await call('answer',{id:started.id,questionId:state.questions[0].id,choice:secret.questions[0].correctId,flag:true},cookie);
 state=await (await call('attempt&id='+started.id,undefined,cookie)).json();assert.equal(state.flags[state.questions[0].id],true);assert.equal(Object.keys(state.answers).length,1);
 const stranger=await service.newGuest();await assert.rejects(()=>service.attempt(stranger.owner,started.id),/not found/);
 assert.equal((await call('answer',{id:started.id,questionId:state.questions[0].id,choice:'INVALID'},cookie)).status,400);
 assert.equal((await call('submit',{id:started.id},cookie)).status,200);
 state=await (await call('attempt&id='+started.id,undefined,cookie)).json();assert.equal(state.state,'completed');assert.equal(state.result.score,1);assert.equal(state.result.questions.length,3);assert.ok(state.result.questions.every(q=>q.options.every(o=>o.explanation)));
 assert.equal((await call('answer',{id:started.id,questionId:state.questions[0].id,choice:null},cookie)).status,409);
 assert.equal((await call('submit',{id:started.id},cookie)).status,200);
 assert.equal((await call('admin',undefined,cookie)).status,401);
 const cross=await handler(new Request('http://localhost/api/study?op=submit',{method:'POST',headers:{host:'localhost',origin:'http://attacker.example',cookie},body:JSON.stringify({id:started.id})}));assert.equal(cross.status,403);
 // Server-created expired attempt simulates a closed browser: no client clock is trusted.
 const expired=randomUUID();await pg.query("INSERT INTO study.attempts(id,owner_id,paper_id,start_key,state,started_at,exam_deadline,upload_deadline) VALUES($1,$2,$3,$4,'active',now()-interval '2 hours',now()-interval '1 hour',now()-interval '1 hour')",[expired,stranger.owner,paper.id,randomUUID()]);
 assert.equal((await service.answer(stranger.owner,{id:expired,questionId:secret.questions[0].id,choice:secret.questions[0].correctId})).expired,true);
 assert.equal((await service.attempt(stranger.owner,expired)).result.score,0);
 await assert.rejects(()=>pg.query("UPDATE study.attempts SET exam_deadline=now() WHERE id=$1",[expired]),/immutable/);
 const written=papers.find(p=>p.format==='written');await assert.rejects(()=>service.start(stranger.owner,{paperId:written.id,startKey:randomUUID()}),/next phase/);
 const before=(await pg.query('SELECT count(*)::int AS n FROM study.material_revisions')).rows[0].n;await seedPilot(pool);assert.equal((await pg.query('SELECT count(*)::int AS n FROM study.material_revisions')).rows[0].n,before);
 }finally{await pg.close()}
});
test('question and attachment validation reject unsafe inputs before publishing',async()=>{
 assert.throws(()=>questionInput({subjectId:'pl-far',chapterId:'pl-far-area-1',kind:'written',prompt:'Calculate depreciation',modelAnswer:'Model',explanation:'Explanation',maxMarks:10,rubric:[{criterion:'Workings',marks:9}],sourceUrl:SOURCES.syllabus}),/equal/);
 await assert.rejects(()=>validateAssetBytes(Buffer.from('not a PDF'),'application/pdf'),/signature/);
 await assert.rejects(()=>validateAssetBytes(Buffer.from('PKfake'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
});
test('DOCX validator bounds decompression and rejects entities and embedded programs',async()=>{
 const {default:JSZip}=await import('jszip');
 async function doc(xml,extra=false){const zip=new JSZip();zip.file('[Content_Types].xml','<Types/>');zip.file('word/document.xml',xml);if(extra)zip.file('word/vbaProject.bin','program');return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});}
 assert.equal(await validateAssetBytes(await doc('<w:document xmlns:w="test"><w:body>Original lesson</w:body></w:document>'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),true);
 await assert.rejects(()=>doc('<!DOCTYPE doc><w:document/>').then(b=>validateAssetBytes(b,'application/vnd.openxmlformats-officedocument.wordprocessingml.document')));
 await assert.rejects(()=>doc('<w:document/>',true).then(b=>validateAssetBytes(b,'application/vnd.openxmlformats-officedocument.wordprocessingml.document')));
 await assert.rejects(()=>doc('<w:document>'+('a'.repeat(350000))+'</w:document>').then(b=>validateAssetBytes(b,'application/vnd.openxmlformats-officedocument.wordprocessingml.document')));
});
