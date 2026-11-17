import test from 'node:test';
import assert from 'node:assert/strict';
import {retentionDeadline,canAccessAttempt,attemptExport,migrationDecision,localHistoryProvenance} from '../shared/study/privacy-policy.js';
const attempt={id:'a1',ownerId:'guest-1',subjectId:'pl-far',sessionId:'2027-may-june',state:'completed',startedAt:'2026-11-16T00:00:00Z',responses:[{questionId:'q1',response:'answer',answerKey:'private'}],privateSnapshot:{secret:true},token_hash:'secret',object_key:'private/script',feedback:{released:true,score:5,maximum:10,summary:'Revise',internalPrompt:'secret',questions:[{questionId:'q1',marks:5,explanation:'Explain workings',improvedAnswer:'Show calculation',rubricSecret:'private'}]}};
test('retention boundaries use UTC and reject ambiguous policy kinds',()=>{
 assert.equal(retentionDeadline('guestServer','2026-11-16T00:00:00Z'),'2026-12-16T00:00:00.000Z');
 assert.equal(retentionDeadline('abandonedUpload','2026-11-16T00:00:00Z'),'2026-11-17T00:00:00.000Z');
 assert.throws(()=>retentionDeadline('unknown','2026-11-16'));assert.throws(()=>retentionDeadline('guestServer','invalid'));
});
test('export requires ownership and removes internal records and premature feedback',()=>{
 assert.equal(canAccessAttempt('',{ownerId:''}),false);assert.throws(()=>attemptExport('other',attempt));
 const output=JSON.stringify(attemptExport('guest-1',attempt));
 for(const key of ['token_hash','object_key','privateSnapshot','answerKey','internalPrompt','rubricSecret'])assert.ok(!output.includes(key));
 assert.equal(attemptExport('guest-1',{...attempt,state:'active'}).feedback,undefined);
 assert.equal(attemptExport('guest-1',{...attempt,feedback:{...attempt.feedback,released:false}}).feedback,undefined);
 assert.equal(attemptExport('guest-1',attempt).feedback.score,5);
});
test('history transfer requires consent, guest credential ownership and settled attempt',()=>{
 const args={guestOwnerId:'guest-1',targetOwnerId:'account-1',attempt,consent:true};
 assert.equal(migrationDecision(args).preserveAttemptId,true);
 assert.throws(()=>migrationDecision({...args,consent:false}));
 assert.throws(()=>migrationDecision({...args,guestOwnerId:'other'}));
 assert.throws(()=>migrationDecision({...args,attempt:{...attempt,state:'active'}}));
 assert.equal(localHistoryProvenance().includeInVerifiedReadiness,false);
});
