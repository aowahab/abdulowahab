import test from 'node:test';
import assert from 'node:assert/strict';
import {studyReadiness} from '../shared/study/capabilities.js';
test('configuration presence never enables private submission or AI marking',()=>{
 for(const result of Object.values(studyReadiness()))assert.equal(result.ready,false);
 assert.equal(studyReadiness({privateStore:'configured',gradingProvider:'key-present'}).writtenMarking.ready,false);
});
test('public Admin materials cannot implicitly enable student script access',()=>{
 const evidence={adminIdentity:true,metadataDatabase:true,adminUploadAuthorization:true,materialValidation:true,publicationReview:true};
 const r=studyReadiness(evidence);assert.equal(r.adminMaterials.ready,true);assert.equal(r.writtenSubmission.ready,false);
 assert.ok(r.writtenSubmission.missing.includes('privateStore'));assert.ok(r.writtenMarking.missing.includes('rubricCalibration'));
});
test('marking stays blocked until deletion fencing and rubric calibration are verified',()=>{
 const keys=studyReadiness().writtenMarking.missing;
 const evidence=Object.fromEntries(keys.map(k=>[k,true]));
 assert.equal(studyReadiness(evidence).writtenMarking.ready,true);
 assert.equal(studyReadiness({...evidence,deletionFencing:false}).writtenMarking.ready,false);
 assert.equal(studyReadiness({...evidence,rubricCalibration:false}).writtenMarking.ready,false);
});
