import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDY_LIMITS as L,validateUploadManifest,validateExtraction,gradingReservation,retryDecision} from '../shared/study/resource-policy.js';
const pdf=bytes=>({mimeType:'application/pdf',bytes});
test('manifest enforces individual, aggregate and type limits at boundaries',()=>{
 assert.equal(validateUploadManifest([pdf(L.fileBytes)]).bytes,L.fileBytes);
 assert.throws(()=>validateUploadManifest([pdf(L.fileBytes+1)]));
 assert.throws(()=>validateUploadManifest([pdf(L.fileBytes),pdf(L.fileBytes),pdf(L.fileBytes)]));
 assert.throws(()=>validateUploadManifest([{mimeType:'application/msword',bytes:5}]));
 assert.throws(()=>validateUploadManifest([]));assert.throws(()=>validateUploadManifest([pdf(NaN)]));
});
test('extraction rejects bombs, excess pages and unreadable zero text',()=>{
 assert.equal(validateExtraction({pages:60,characters:300000}),true);
 assert.throws(()=>validateExtraction({pages:61,characters:100}));
 assert.throws(()=>validateExtraction({pages:1,characters:0}));
 assert.throws(()=>validateExtraction({pages:1,characters:10,archiveBytes:100,expandedBytes:10001}));
 assert.throws(()=>validateExtraction({pages:1,characters:10,imagePixels:L.imagePixels+1}));
});
test('grading reserves all retries and fails closed on missing pricing or insufficient funds',()=>{
 const args={inputTokens:1000,outputTokens:500,estimatedUnits:20,remainingUnits:60};
 assert.equal(gradingReservation(args).reservedUnits,60);
 assert.throws(()=>gradingReservation({...args,remainingUnits:59}));
 assert.throws(()=>gradingReservation({...args,estimatedUnits:null}));
 assert.throws(()=>gradingReservation({...args,inputTokens:L.gradingInputTokens+1}));
});
test('transient retries respect provider delays and stop after bounded attempts',()=>{
 assert.deepEqual(retryDecision({attempt:1,status:429,retryAfterSeconds:1000}),{action:'retry',delaySeconds:1000});
 assert.equal(retryDecision({attempt:2,status:503}).delaySeconds,60);
 assert.equal(retryDecision({attempt:3,status:503}).action,'failed');
 assert.equal(retryDecision({attempt:1,status:401}).action,'failed');
 assert.equal(retryDecision({attempt:1,code:'unreadable'}).action,'review-required');
 assert.equal(retryDecision({attempt:1,code:'invalid-output'}).action,'review-required');
 assert.throws(()=>retryDecision({attempt:0}));
});
