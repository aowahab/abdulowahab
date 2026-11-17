import {useEffect,useRef,useState} from 'react';
import {studyApi} from './api.js';
import {subjectById} from '../../shared/study/catalogue.js';
export default function Exam({id,onClose}){
 const [attempt,setAttempt]=useState(null),[index,setIndex]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[remaining,setRemaining]=useState(0),[confirm,setConfirm]=useState(false);
 const offset=useRef(0),autoSubmit=useRef(false),alive=useRef(true),loadSeq=useRef(0);
 async function load(){const seq=++loadSeq.current;const a=await studyApi('attempt',undefined,'&id='+id);if(!alive.current||seq!==loadSeq.current)return;offset.current=Date.parse(a.serverNow)-Date.now();setAttempt(a);}
 useEffect(()=>{alive.current=true;load().catch(e=>setError(e.message));return()=>{alive.current=false}},[id]);
 useEffect(()=>{if(!attempt||attempt.state==='completed')return;
  const tick=()=>setRemaining(Math.max(0,Math.ceil((Date.parse(attempt.deadline)-Date.now()-offset.current)/1000)));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);
 },[attempt]);
 useEffect(()=>{if(!attempt||attempt.state!=='active')return;const timer=setInterval(()=>{load().catch(e=>setError(e.message));},10000);return()=>clearInterval(timer);},[id,attempt?.state]);
 useEffect(()=>{if(!attempt||attempt.state!=='active'||remaining!==0||Date.parse(attempt.deadline)>Date.now()+offset.current||autoSubmit.current)return;autoSubmit.current=true;
 studyApi('submit',{id}).then(load).catch(e=>{autoSubmit.current=false;setError(e.message)});
 },[remaining,attempt?.state]);
 async function change(choice,flag){if(busy)return;setBusy(true);setError('');try{await studyApi('answer',{id,questionId:attempt.questions[index].id,choice,flag});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function submit(){setBusy(true);setError('');try{await studyApi('submit',{id});await load();setConfirm(false)}catch(e){setError(e.message)}finally{setBusy(false)}}
 if(!attempt)return <div className="study-card"><p role="status">{error||'Loading saved exam…'}</p><button onClick={onClose}>Back</button></div>;
 const result=attempt.result;
 if(result)return <section className="study-result"><div className="study-card study-score"><span className="study-eyebrow">PRACTICE RESULT</span><h2>{result.score} / {result.maximum}</h2><p>{attempt.title}</p><p>{result.note}</p><button onClick={onClose}>Back to Study</button><button onClick={()=>{const blob=new Blob([JSON.stringify({title:attempt.title,result},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='study-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Download result</button></div>
 <h3>Where to focus next</h3><div className="study-grid">{result.areas.map(t=><article className="study-card" key={t.chapterId}><h4>{subjectById(attempt.subjectId)?.chapters.find(c=>c.id===t.chapterId)?.title||t.chapterId}</h4><strong>{t.percent}% · {t.correct}/{t.questions} correct</strong><p>{t.suggestion}</p></article>)}</div>
 <h3>Every answer, explained</h3>{result.questions.map((q,i)=><article className="study-card" key={q.id}><h4>{i+1}. {q.prompt}</h4><p><strong>{q.correct?'Correct':'Review needed'} · {q.marks}/{q.maxMarks}</strong> — Your choice: {q.selected||'Unanswered'}; correct: {q.correctId}</p><p>{q.explanation}</p><ul>{q.options.map(o=><li key={o.id}><strong>{o.id}. {o.text}</strong> — {o.explanation}</li>)}</ul></article>)}</section>;
 const q=attempt.questions[index],answered=Object.values(attempt.answers).filter(Boolean).length;
 return <section className="study-exam"><div className="study-exam-bar"><div><strong>{attempt.title}</strong><p>{answered}/{attempt.questions.length} answered · {attempt.questions.length-answered} unanswered</p></div><div className="study-timer" aria-label="Time remaining">{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</div></div>
 <p className="study-muted">Answers save to the server. Refresh resumes this attempt. {busy?'Saving…':'Saved answers loaded.'}</p>{error&&<p role="alert" className="study-error">{error} <button onClick={()=>load().catch(e=>setError(e.message))}>Reload saved answers</button></p>}
 <nav className="study-question-nav" aria-label="Question navigation">{attempt.questions.map((item,i)=><button key={item.id} aria-current={i===index?'step':undefined} onClick={()=>{setIndex(i);setConfirm(false)}} disabled={busy}>{i+1}{attempt.flags[item.id]?' ⚑':attempt.answers[item.id]?' ✓':''}</button>)}</nav>
 <fieldset className="study-card" disabled={busy||remaining===0}><legend>Question {index+1} · {q.maxMarks} marks</legend><p>{q.prompt}</p>{q.options.map(o=><label className="study-choice" key={o.id}><input type="radio" name={'question-'+q.id} checked={attempt.answers[q.id]===o.id} onChange={()=>change(o.id,!!attempt.flags[q.id])}/><span>{o.id}. {o.text}</span></label>)}<button onClick={()=>change(null,!!attempt.flags[q.id])}>Clear answer</button><label className="study-choice"><input type="checkbox" checked={!!attempt.flags[q.id]} onChange={e=>change(attempt.answers[q.id]??null,e.target.checked)}/> Flag for review</label></fieldset>
 <div className="study-actions"><button disabled={busy||index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button disabled={busy||index===attempt.questions.length-1} onClick={()=>setIndex(i=>i+1)}>Next</button><button disabled={busy} onClick={()=>setConfirm(true)}>Submit exam</button><button onClick={onClose}>Leave & resume later</button></div>
 {confirm&&<div className="study-card" role="region" aria-label="Confirm submission"><p>Submit now? {attempt.questions.length-answered} questions are unanswered. Answers cannot be changed after submission.</p><button disabled={busy} onClick={submit}>Confirm submission</button><button onClick={()=>setConfirm(false)}>Continue exam</button></div>}
 </section>;
}
