import {subjectById} from '../../shared/study/catalogue.js';
export class StudyError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export function demand(ok,message,status=400){if(!ok)throw new StudyError(message,status);}
export const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function text(value,max=4000){demand(typeof value==='string'&&value.trim().length>0&&value.length<=max,'Required text is missing or too long');return value.trim();}
export function subjectChapter(input){const subject=subjectById(input.subjectId);demand(subject,'Choose a valid subject');const chapter=subject.chapters.find(c=>c.id===input.chapterId);demand(chapter,'Choose a chapter belonging to this subject');return {subject,chapter};}
export function materialInput(input){subjectChapter(input);const sourceUrl=text(input.sourceUrl,1000);let url;try{url=new URL(sourceUrl)}catch{throw new StudyError('Use a valid source URL')}
 demand(url.protocol==='https:','Use an HTTPS source URL');
 const reviewedOn=input.reviewedOn||new Date().toISOString().slice(0,10);demand(/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn)&&Number.isFinite(Date.parse(reviewedOn))&&reviewedOn<=new Date().toISOString().slice(0,10),'Use a valid review date, not a future date');
 const kind=['lesson','worked-example','revision','practice'].includes(input.kind)?input.kind:'lesson';
 demand(['draft','published','archived'].includes(input.state),'Choose draft, published or archived');
 demand(!input.assetId||uuid(input.assetId),'Invalid attachment');
 return {subjectId:input.subjectId,chapterId:input.chapterId,title:text(input.title,180),body:text(input.body,14000),sourceUrl,effectiveSession:text(input.effectiveSession,80),kind,reviewedOn,state:input.state,assetId:input.assetId||null};
}
export function questionInput(input){
 subjectChapter(input);demand(['single-choice','written','case'].includes(input.kind),'Invalid question type');
 const q={subjectId:input.subjectId,chapterId:input.chapterId,kind:input.kind,prompt:text(input.prompt,12000),explanation:text(input.explanation,8000),maxMarks:Number(input.maxMarks),sourceUrl:text(input.sourceUrl,1000)};
 demand(/^https:\/\//.test(q.sourceUrl),'Source URL required');demand(Number.isFinite(q.maxMarks)&&q.maxMarks>0&&q.maxMarks<=100,'Marks must be between 0 and 100');
 if(q.kind==='single-choice'){
  demand(Array.isArray(input.options)&&input.options.length>=2&&input.options.length<=6,'Provide 2–6 choices');
  q.options=input.options.map(o=>({id:text(o.id,20),text:text(o.text,2000),explanation:text(o.explanation,3000)}));
  demand(new Set(q.options.map(o=>o.id)).size===q.options.length,'Choice IDs must be unique');
  demand(q.options.some(o=>o.id===input.correctId),'Select a correct choice');q.correctId=input.correctId;q.rubric=[];
 }else{
  q.modelAnswer=text(input.modelAnswer,14000);demand(Array.isArray(input.rubric)&&input.rubric.length>0,'Provide marking criteria');
  q.rubric=input.rubric.map(c=>({criterion:text(c.criterion,2000),marks:Number(c.marks)}));
  demand(q.rubric.every(c=>Number.isFinite(c.marks)&&c.marks>0),'Criterion marks must be positive');
  demand(Math.abs(q.rubric.reduce((n,c)=>n+c.marks,0)-q.maxMarks)<.001,'Rubric marks must equal total marks');
 }
 return q;
}
export function scorePaper(snapshot,responses){
 let score=0;const topics={};
 const questions=snapshot.questions.map(q=>{const selected=responses[q.id]??null,correct=selected===q.correctId;score+=correct?q.maxMarks:0;
 const t=topics[q.chapterId]||={chapterId:q.chapterId,correct:0,questions:0,earned:0,maximum:0};t.questions++;t.correct+=Number(correct);t.earned+=correct?q.maxMarks:0;t.maximum+=q.maxMarks;
 return {id:q.id,prompt:q.prompt,selected,correctId:q.correctId,correct,marks:correct?q.maxMarks:0,maxMarks:q.maxMarks,explanation:q.explanation,options:q.options};});
 const areas=Object.values(topics).map(t=>({...t,percent:Math.round(t.earned/t.maximum*100),suggestion:t.earned/t.maximum<.6?'Revisit the lesson, work an example, then retry new questions.':'Keep revising and practise a different question set.'}));
 return {score,maximum:snapshot.questions.reduce((n,q)=>n+q.maxMarks,0),questions,areas,note:'Practice feedback from this paper only; not a complete exam-readiness assessment.'};
}
export function publicQuestion(q){return {id:q.id,chapterId:q.chapterId,prompt:q.prompt,maxMarks:q.maxMarks,options:q.options?.map(o=>({id:o.id,text:o.text}))||[]};}
