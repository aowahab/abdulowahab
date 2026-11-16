import test from 'node:test';
import assert from 'node:assert/strict';
import {SUBJECTS,subjectsForLevel,subjectById,validateChapter} from '../shared/study/catalogue.js';
import {createBlueprint,publicationBlockers} from '../shared/study/blueprints.js';
test('catalogue covers 7 CL, 7 PL and 3 AL with unique stable IDs',()=>{
 assert.equal(SUBJECTS.length,17);assert.equal(new Set(SUBJECTS.map(s=>s.id)).size,17);
 for(const [level,count] of [['CL',7],['PL',7],['AL',3]]) assert.equal(subjectsForLevel(level).length,count);
 assert.equal(subjectById('absent'),null);assert.deepEqual(subjectsForLevel('bad'),[]);
});
test('subject-specific timing and ITG conflict remain explicit',()=>{
 assert.equal(createBlueprint('cl-laws').durationMinutes,60);
 assert.equal(createBlueprint('cl-accounting').durationMinutes,90);
 assert.equal(createBlueprint('pl-far').durationMinutes,210);
 const itg=createBlueprint('pl-itg');assert.equal(itg.format,'online-unspecified');assert.equal(itg.itemTypes,null);
 assert.match(itg.durationStatus,/conflicting/);
 const cs=createBlueprint('al-case');assert.equal(cs.durationMinutes,270);assert.equal(cs.advanceInformationRequired,true);
 assert.equal(cs.uploadWindowMinutes,30);assert.equal(createBlueprint('cl-it').uploadWindowMinutes,0);
});
test('independent immutable session templates cannot publish incomplete exams',()=>{
 const a=createBlueprint('pl-far'),b=createBlueprint('pl-far','2026-november');
 assert.notEqual(a.id,b.id);assert.ok(Object.isFrozen(a));assert.ok(Object.isFrozen(a.questions));
 assert.throws(()=>a.questions.push('changed'),TypeError);
 assert.ok(publicationBlockers(a).includes('session-rules-unverified'));
 assert.ok(publicationBlockers(a).includes('rubric-required'));
 assert.equal(a.passMark,null);assert.equal(a.totalMarks,null);assert.equal(a.negativeMarking,null);
 assert.throws(()=>createBlueprint('missing'));assert.throws(()=>createBlueprint('pl-far','bad session'));
});
test('unreviewed chapter imports reject missing provenance and invalid order',()=>{
 assert.throws(()=>validateChapter({id:'chapter-1',title:'Topic',order:1,sourceIds:[]}));
 assert.throws(()=>validateChapter({id:'chapter-1',title:'Topic',order:0,sourceIds:['syllabus']}));
 assert.equal(validateChapter({id:'chapter-1',title:'Topic',order:1,sourceIds:['syllabus']}),true);
 assert.ok(SUBJECTS.filter(s=>!s.chapters.length).every(s=>s.chapterStatus==='awaiting-reviewed-import')); 
});

test('reviewed syllabus areas preserve provenance and independent immutable snapshots',()=>{
 const populated=SUBJECTS.filter(s=>s.chapters.length);assert.equal(populated.length,8);
 for(const subject of populated){
  assert.equal(new Set(subject.chapters.map(c=>c.id)).size,subject.chapters.length);
  subject.chapters.forEach((chapter,index)=>{assert.equal(validateChapter(chapter),true);assert.equal(chapter.order,index+1);assert.ok(chapter.sourcePage>0);assert.equal(chapter.kind,'syllabus-area');assert.equal(chapter.materialStatus,'not-published')});
  assert.deepEqual(createBlueprint(subject.id).chapters,subject.chapters.map(c=>c.id));
 }
 assert.throws(()=>subjectById('pl-far').chapters[0].title='changed',TypeError);
 assert.equal(subjectById('pl-tax').chapterStatus,'awaiting-reviewed-import');
});
