// Product defaults, not legal retention requirements. No background jobs run here.
export const PRIVACY_POLICY_VERSION='study-privacy-v1';
export const RETENTION = Object.freeze({
 guestServerDays:30,guestLocalDays:90,accountScriptDays:180,
 abandonedUploadHours:24,temporaryExportHours:24,operationalLogDays:30,
 deletedBackupMaximumDays:30
});
const DAY=86400000;
export function retentionDeadline(kind,createdAt){
 const date=new Date(createdAt).getTime();
 if(!Number.isFinite(date))throw Error('Valid creation date required');
 const units={guestServer:RETENTION.guestServerDays*DAY,guestLocal:RETENTION.guestLocalDays*DAY,
 accountScript:RETENTION.accountScriptDays*DAY,abandonedUpload:RETENTION.abandonedUploadHours*3600000,
 temporaryExport:RETENTION.temporaryExportHours*3600000,operationalLog:RETENTION.operationalLogDays*DAY};
 if(!Object.hasOwn(units,kind))throw Error('Unknown retention kind');
 return new Date(date+units[kind]).toISOString();
}
export function canAccessAttempt(ownerId,attempt){
 return typeof ownerId==='string'&&ownerId.length>0&&attempt?.ownerId===ownerId;
}
// Never spread database rows into a learner export. Only released results qualify.
export function attemptExport(ownerId,attempt){
 if(!canAccessAttempt(ownerId,attempt))throw Error('Attempt not found');
 const result={id:attempt.id,subjectId:attempt.subjectId,sessionId:attempt.sessionId,
 state:attempt.state,startedAt:attempt.startedAt,submittedAt:attempt.submittedAt??null,
 responses:(attempt.responses||[]).map(r=>({questionId:r.questionId,response:r.response})),
 policyVersion:PRIVACY_POLICY_VERSION};
 if(attempt.state==='completed'&&attempt.feedback?.released===true){
  const f=attempt.feedback;
  result.feedback={score:f.score,maximum:f.maximum,summary:f.summary,
   questions:(f.questions||[]).map(q=>({questionId:q.questionId,marks:q.marks,
    explanation:q.explanation,improvedAnswer:q.improvedAnswer}))};
 }
 return result;
}
export function migrationDecision({guestOwnerId,targetOwnerId,consent,attempt}){
 if(consent!==true)throw Error('Explicit history-transfer consent required');
 if(!canAccessAttempt(guestOwnerId,attempt)||!targetOwnerId||targetOwnerId===guestOwnerId)throw Error('Invalid transfer');
 if(!['completed','expired','failed','submitted','review-required'].includes(attempt.state))throw Error('Finish the attempt before transfer');
 return {attemptId:attempt.id,fromOwnerId:guestOwnerId,toOwnerId:targetOwnerId,
 provenance:'server-verified',preserveAttemptId:true};
}
// A browser-local score may be imported only as an unverified history item.
export function localHistoryProvenance(){return {source:'guest-browser-import',verified:false,includeInVerifiedReadiness:false};}
