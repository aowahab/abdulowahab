import {CATALOGUE_VERSION, TARGET_SESSION, subjectById, deepFreeze} from './catalogue.js';
// These templates contain no answer keys, questions or private learner records.
export function createBlueprint(subjectId, sessionId=TARGET_SESSION) {
 const subject=subjectById(subjectId);
 if(!subject) throw Error('Unknown subject');
 if(typeof sessionId!=='string'||!/^\d{4}-[a-z]+(?:-[a-z]+)*$/.test(sessionId)) throw Error('Invalid session');
 return deepFreeze({
  id:`${subjectId}:${sessionId}:v2`,version:2,catalogueVersion:CATALOGUE_VERSION,
  subjectId,sessionId,status:'draft',purpose:'practice',
  format:subject.format,durationMinutes:subject.durationMinutes,
  durationStatus:subject.durationStatus,sessionVerification:'pending',
  sourceIds:[...subject.sourceIds],
  totalMarks:null,questionCount:null,passMark:null,negativeMarking:null,
  allowedResources:null,itemTypes:subject.format==='mcq'?['single-choice']:null,
  advanceInformationRequired:subject.requiresAdvanceInformation,
  uploadWindowMinutes:subject.format.startsWith('written')?30:0,
  uploadWindowAuthority:'platform-policy',
  chapters:subject.chapters.map(chapter=>chapter.id),questions:[],rubricVersion:null,reviewedBy:null
 });
}
export function publicationBlockers(blueprint) {
 const b=blueprint;
 if(!b || !subjectById(b.subjectId)) return ['unknown-subject'];
 const blockers=[];
 if(b.sessionVerification!=='verified') blockers.push('session-rules-unverified');
 if(b.status!=='reviewed'||!b.reviewedBy) blockers.push('review-required');
 if(!Number.isFinite(b.durationMinutes)||b.durationMinutes<=0) blockers.push('duration-required');
 if(!Number.isFinite(b.totalMarks)||b.totalMarks<=0) blockers.push('marks-required');
 if(!Number.isSafeInteger(b.questionCount)||b.questionCount<=0||!Array.isArray(b.questions)||b.questions.length!==b.questionCount) blockers.push('paper-incomplete');
 if(!Array.isArray(b.allowedResources)) blockers.push('resource-rules-required');
 if(!Array.isArray(b.itemTypes)||!b.itemTypes.length) blockers.push('item-types-required');
 if(!Number.isFinite(b.passMark)||b.passMark<0||b.passMark>b.totalMarks) blockers.push('pass-rule-required');
 if(b.format?.startsWith('written')&&!b.rubricVersion) blockers.push('rubric-required');
 return blockers;
}
