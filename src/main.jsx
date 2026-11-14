import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { PROFILE } from '../shared/profile.js';
import { PROJECTS } from '../shared/projects.js';

const fallback = {
 name:'Abdul Owahab',
 facts:[{label:'Role',value:'Senior Associate, Audit & Assurance'},{label:'Firm',value:'Deloitte Bangladesh'},{label:'Based in',value:'Dhaka, Bangladesh'},{label:'Studying',value:'ICAB Professional Level'}],
 sections:[{id:'about',title:'About',body:'I work in audit and assurance in Dhaka, focusing on evidence-based financial reporting and reliable documentation.'},{id:'venture',title:'Tickydo',body:'Co-founder of Tickydo, a transport technology venture developing passenger ticketing and smarter counter operations. Currently in pilot testing.'}],posts:[]
};
const experience = [
 ['Audit & assurance','Statutory and group audit engagements; financial statement testing, substantive procedures and review-ready documentation.'],
 ['Industry exposure','Manufacturing, paints and coatings, agrochemicals, research and healthcare, and services.'],
 ['Financial statement areas','Revenue, receivables, inventory, payroll, payables, expenses and equity.'],
 ['Tools','Advanced Excel, Levvia, Omnia and an interest in Python-assisted analytics.']
];
const projects = [
 {title:'Tickydo',tag:'Co-founder · Pilot operations',body:'Digital ticketing and bus-counter technology. Passenger and counter-facing platforms are being tested; operator onboarding is in progress.',url:'https://tickydo.com',cta:'Explore Tickydo'},
 {title:'Tickydo ERP — Accounting',tag:'GitHub project · Node.js · PostgreSQL / SQLite',body:'Accounting module featuring a chart of accounts, balanced double-entry journal entries, reversal documents, period locking, trial balance, general ledger, income statement and balance sheet. Built with Node.js, SQLite for local development and PostgreSQL support for Vercel.',url:'/erp/',cta:'Open ERP application'},
 {title:'Audit workflows',tag:'Professional practice',body:'Evidence-based audit testing, reconciliations, financial reporting and structured documentation across diverse industries.'},
 {title:'Personal portfolio',tag:'React · Vercel',body:'A dynamic React portfolio with an editable content dashboard, serverless API and Vercel Blob storage.',url:'https://github.com/aowahab/abdulowahab',cta:'View source'}
];
function LinkText({text=''}) {
 return text.split(/(https?:\/\/[^\s]+)/g).map((part,i)=>/^https?:\/\//.test(part)?<a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>:part);
}
function RichText({body=''}) {
 return body.split(/\n\s*\n/).filter(Boolean).map((block,i)=>{
 const lines=block.split('\n').map(x=>x.trim()).filter(Boolean);
 if(lines.every(x=>x.startsWith('- ')))return <dl className="detail-list" key={i}>{lines.map((line,j)=>{const item=line.slice(2),colon=item.indexOf(': ');return <div key={j}><dt>{colon>=0?item.slice(0,colon):'•'}</dt><dd><LinkText text={colon>=0?item.slice(colon+2):item}/></dd></div>})}</dl>;
 return <p key={i}><LinkText text={lines.join(' ')}/></p>;
 });
}
function Section({id,eyebrow,title,children}) {return <section className="section" id={id}><div className="section-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><div className="section-content">{children}</div></section>}
const engagements = [
 {sector:'Paints & Coatings',items:['Statutory and group audit support; revenue recognition, inventory, trade receivables, payables and expenses','Quarterly audit procedures; reconciliations, sample testing and analytical reviews']},
 {sector:'Agrochemicals & Manufacturing',items:['Statutory audit procedures across revenue, imports, inventory and trade balances','Substantive testing, analytical review and financial statement support']},
 {sector:'Healthcare, Research & Nonprofit',items:['Grant and donor-funded income, diagnostic service revenue and fund balances','Cash and bank reconciliations, fixed assets and foreign-donation compliance procedures']},
 {sector:'Technology & Telecommunications',items:['Payroll, controls walkthroughs, reconciliations and audit documentation','Financial statement testing and substantive verification']},
 {sector:'Trading & Professional Services',items:['Lease accounting, payroll, receivables and operating expense testing','Analytical review and review-ready supporting documentation']}
];
function Engagements(){const [filter,setFilter]=useState('All');const [open,setOpen]=useState({});const sectors=['All',...engagements.map(x=>x.sector)];return <div className="engagements"><div className="filter-pills">{sectors.map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>{engagements.filter(x=>filter==='All'||x.sector===filter).map((group,i)=><div className="engagement-group" key={group.sector}><button className="engagement-toggle" aria-expanded={!!open[group.sector]} onClick={()=>setOpen(o=>({...o,[group.sector]:!o[group.sector]}))}><span>{group.sector}</span><span>{group.items.length} {open[group.sector]?'−':'+'}</span></button>{open[group.sector]&&<ul>{group.items.map(item=><li key={item}>{item}</li>)}</ul>}</div>)}<p className="muted-note">Industry-level examples only. Client identities and engagement-specific confidential information are not disclosed.</p></div>}
function CareerTimeline(){return <div className="career-timeline"><article className="career-entry"><span className="career-dot"/><div className="career-card"><h3>Deloitte Bangladesh</h3><p>Audit & Assurance</p><strong>December 2024 – Present</strong><div className="career-role"><h4>Senior Associate</h4><p>December 2025 – Present</p><p>Statutory and group audits, financial statement testing, documentation and coordination of junior team members.</p></div><div className="career-role"><h4>Audit Associate</h4><p>December 2024 – December 2025</p><p>Audit fieldwork, substantive testing and working paper preparation.</p></div></div></article></div>}
function TrainingCards(){return <div className="training-grid" aria-label="Professional training and qualification progress">{[['Audit & Assurance','Statutory audit','Group audit','Risk assessment and substantive testing'],['Financial Reporting','IFRS and IAS application','Financial statement analysis'],['Data & Technology','Advanced Excel','Deloitte Omnia','Levvia'],['Professional Development','ICAB Professional Level — in progress (not yet a qualified CA)','Accounting and business law']].map(([category,...items])=><article className="training-card" key={category}><h3>{category}</h3>{items.map(item=><p key={item}>{item}</p>)}</article>)}</div>}
function Enquiry(){const [name,setName]=useState('');const [email,setEmail]=useState('');const [topic,setTopic]=useState('Professional enquiry');const [message,setMessage]=useState('');const send=e=>{e.preventDefault();const body='Name: '+name+'\nEmail: '+email+'\n\n'+message;window.location.href='mailto:abdulowahab.jnu@gmail.com?subject='+encodeURIComponent(topic)+'&body='+encodeURIComponent(body)};return <form className="enquiry-form" onSubmit={send}><p>Request a professional discussion or collaboration. Your email app will open to review and send the message.</p><label>Full name *<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Email *<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Topic<select value={topic} onChange={e=>setTopic(e.target.value)}><option>Professional enquiry</option><option>Audit and finance discussion</option><option>Technology collaboration</option><option>Tickydo partnership</option><option>Meeting request</option></select></label><label>Message *<textarea required rows="5" value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="button primary" type="submit">Review and send enquiry</button><p className="muted-note">No booking is confirmed automatically. This form does not store your information.</p></form>}
function ContactRequest({mode='consultation'}) {
 const appointment=mode==='appointment';
 const [v,setV]=useState({name:'',organization:'',contact:'',details:'',preferredDate:'',preferredTime:'',timezone:'Asia/Dhaka',leadType:'client',consent:false,website:''});
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const update=(k,val)=>setV(prev=>({...prev,[k]:val}));
 const submit=async e=>{
  e.preventDefault();
  if(appointment && (!v.preferredDate||!v.preferredTime)){setStatus('Please choose a preferred date and time.');return;}
  setBusy(true);setStatus('');
  const details=appointment?['Meeting request', 'Preferred: '+v.preferredDate+' '+v.preferredTime+' ('+v.timezone+')','Purpose: '+v.details].join('\n'):v.details;
  try{
   const resp=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:v.name,organization:v.organization,contact:v.contact,kind:appointment?'appointment':v.leadType,details,consent:v.consent,website:v.website
   })});
   const data=await resp.json();
   if(!resp.ok)throw Error(data.error||'Unable to submit request');
   setStatus(appointment?'Appointment request received in the private inbox. This is not a confirmed booking; Abdul will follow up.':'Consultation enquiry received in the private inbox. Abdul can review and respond.');
   setV({name:'',organization:'',contact:'',details:'',preferredDate:'',preferredTime:'',timezone:'Asia/Dhaka',leadType:'client',consent:false,website:''});
  }catch(err){setStatus((err.message||'Could not submit')+'. You can email abdulowahab.jnu@gmail.com instead.');}
  finally{setBusy(false);}
 };
 return <form className="quick-request" onSubmit={submit}>
  <div className="request-fields">
   <label>Full name *<input type="text" required maxLength={120} value={v.name} onChange={e=>update('name',e.target.value)} placeholder="Your name"/></label>
   <label>Email or phone *<input type="text" required minLength={5} maxLength={200} value={v.contact} onChange={e=>update('contact',e.target.value)} placeholder="How to reach you"/></label>
   <label className="request-wide">Company / organization (optional)<input type="text" maxLength={160} value={v.organization} onChange={e=>update('organization',e.target.value)} placeholder="Organization name"/></label>
   {!appointment&&<label className="request-wide">Enquiry type<select value={v.leadType} onChange={e=>update('leadType',e.target.value)}><option value="client">Potential customer / business enquiry</option><option value="recruiter">Recruitment opportunity</option><option value="collaboration">Collaboration / professional discussion</option></select></label>}
   {appointment&&<>
    <label>Preferred date *<input type="date" required value={v.preferredDate} min={new Date().toISOString().slice(0,10)} onChange={e=>update('preferredDate',e.target.value)}/></label>
    <label>Preferred time *<input type="time" required value={v.preferredTime} onChange={e=>update('preferredTime',e.target.value)}/></label>
    <label className="request-wide">Time zone<select value={v.timezone} onChange={e=>update('timezone',e.target.value)}><option value="Asia/Dhaka">Bangladesh (UTC+6)</option><option value="Asia/Singapore">Singapore (UTC+8)</option><option value="Europe/London">London</option><option value="UTC">UTC</option><option value="Other (specify in message)">Other (specify below)</option></select></label>
   </>}
   <label className="request-wide">{appointment?'Meeting purpose *':'What would you like to discuss? *'}<textarea required minLength={10} maxLength={appointment?1200:1450} rows={4} value={v.details} onChange={e=>update('details',e.target.value)} placeholder={appointment?'Share the subject and any flexibility in timing':'Briefly describe the opportunity, question or collaboration'}/></label>
  </div>
  <input className="lead-honeypot" aria-hidden="true" tabIndex={-1} autoComplete="off" value={v.website} onChange={e=>update('website',e.target.value)}/>
  <label className="request-consent"><input type="checkbox" checked={v.consent} required onChange={e=>update('consent',e.target.checked)}/> I consent to sharing these details privately for follow-up.</label>
  <button className="request-submit" type="submit" disabled={busy}>{busy?'Sending…':appointment?'Request appointment':'Send consultation enquiry'}</button>
  {status&&<p className="request-status" role="status">{status}</p>}
  <p className="request-note">{appointment?'Date and time are preferences only; no appointment is booked until confirmed.':'Enquiries are stored privately for follow-up. No professional service or fee is promised.'}</p>
 </form>;
}
function PortfolioAI(){
 const [open,setOpen]=useState(false);
 const [messages,setMessages]=useState([{role:'assistant',content:'Welcome! I’m Abdul Owahab’s portfolio assistant. Ask me about his experience, professional projects, updates or collaboration opportunities. বাংলা ও English—দুই ভাষাতেই প্রশ্ন করতে পারেন।'}]);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [mode,setMode]=useState('unknown');
 const [error,setError]=useState('');
 const [retryText,setRetryText]=useState('');
 const send=async(text, history=messages)=>{
  const question=text.trim();
  if(!question||busy)return;
  const next=[...history,{role:'user',content:question}];
  setMessages(next);setDraft('');setBusy(true);setError('');setRetryText('');
  try{
   const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),25000);
   let res;
   try{res=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next.slice(-12)}),signal:ctrl.signal})}
   finally{clearTimeout(timeout)}
   const data=await res.json();
   if(!res.ok||typeof data.answer!=='string'||!data.answer.trim())throw Error(data.error||'Assistant could not return an answer.');
   setMode(data.mode==='ai'?'ai':data.mode==='saved'?'saved':'basic');
   setMessages(prev=>[...prev,{role:'assistant',content:data.answer}]);
  }catch(e){
   setMode('offline');
   setRetryText(question);
   setError(e.name==='AbortError'?'The assistant took too long to respond. Please try again.':'The assistant could not connect right now. You can retry your last question.');
   setMessages(prev=>[...prev,{role:'assistant',content:'I could not retrieve an answer right now. Please use Retry below, or explore the portfolio sections.'}]);
  }finally{setBusy(false)}
 };
 return <div className="portfolio-ai">
  <button className="ai-launch" type="button" aria-expanded={open} aria-controls="portfolio-ai-panel" onClick={()=>setOpen(x=>!x)}>{open?'✕ Close':'✦ Ask AI'}</button>
  {open&&<section className="ai-panel" id="portfolio-ai-panel" aria-label="Portfolio AI chat">
   <header className="ai-header"><div><strong>Ask about Abdul</strong><small>Portfolio assistant · বাংলা / English</small></div><button type="button" aria-label="Close AI chat" onClick={()=>setOpen(false)}>×</button></header>
   <div className="ai-service-status" role="status"><span className={'ai-status-indicator '+mode}/>{mode==='ai'?'AI-powered response':mode==='saved'?'Enquiry submitted':mode==='basic'?'Portfolio knowledge mode':mode==='offline'?'Connection issue':'Ask a question to begin'}</div>
   <div className="ai-messages" role="log" aria-live="polite">{messages.map((m,i)=><div key={i} className={'ai-bubble '+m.role}>{m.content}</div>)}{busy&&<div className="ai-bubble assistant">Checking portfolio information…</div>}</div>
   {messages.length===1&&<div className="ai-suggestions">{['What is Abdul’s accounting background?','Explain his audit and assurance skills','I have a business opportunity'].map(x=><button type="button" key={x} onClick={()=>send(x)}>{x}</button>)}</div>}
   {error&&<div className="ai-retry"><p role="alert">{error}</p><button type="button" disabled={busy} onClick={()=>send(retryText,messages.slice(0,-2))}>Retry last question</button></div>}
   <form className="ai-compose" onSubmit={e=>{e.preventDefault();send(draft)}}><input aria-label="Ask a question" value={draft} maxLength={700} onChange={e=>setDraft(e.target.value)} placeholder="Ask about audit, projects, updates…" /><button disabled={busy||!draft.trim()} type="submit" aria-label="Send message">➤</button></form>
   <p className="ai-disclaimer">AI can make mistakes. Answers use public portfolio information; professional enquiries and appointments require personal confirmation.</p>
  </section>}
 </div>;
}
function UpdateCard({post,featured=false,expanded=true,authorName='Abdul Owahab',avatarUrl=''}) {
 const media=Array.isArray(post.media)?post.media:[];
 const text=post.body||'';
 const date=post.date&& !Number.isNaN(Date.parse(post.date))?new Date(post.date).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'}):'';
 return <article className="update feed-post">
  <header className="feed-post-header">
   <div className="feed-post-avatar" aria-hidden="true">{avatarUrl?<img src={avatarUrl} alt="" loading="lazy"/>:<span>AO</span>}</div>
   <div className="feed-post-author"><strong>{authorName}</strong>{date&&<time dateTime={post.date}>{date}</time>}</div>
   {featured&&<span className="feed-post-latest">Latest</span>}
  </header>
  {post.title&&<h3>{post.title}</h3>}
  {text&&<div className="feed-post-body"><RichText body={text}/></div>}
  {media.length>0&&<div className={`media feed-post-media feed-media-count-${Math.min(media.filter(m=>m.type?.startsWith('image/')||m.type?.startsWith('video/')).length,4)}`}>{media.map((m,j)=>m.type?.startsWith('image/')?<a className="feed-photo-link" key={j} href={m.url} target="_blank" rel="noopener noreferrer" aria-label={`Open full photo: ${m.name||post.title||'Update photo'}`}><img loading="lazy" src={m.url} alt={m.name||post.title||'Update photo'}/></a>:m.type?.startsWith('video/')?<video key={j} controls preload="metadata" playsInline src={m.url}/>:<a key={j} className="feed-attachment-link" href={m.url} target="_blank" rel="noopener noreferrer">{m.name||'View attachment'}</a>)}</div>}
 </article>;
}

const workspaceGroups=[
 {title:'Audit & assurance',items:[
  {name:'Audit Materiality Calculator',action:'materiality',detail:'Calculate overall and performance materiality from a selected benchmark; illustrative only.'},
  {name:'Audit Planning Checklist',action:'audit-planning',detail:'Interactive engagement planning checklist with exportable progress; no client details required.'},
  {name:'Risk Assessment & Assertions Matrix',action:'risk-matrix',detail:'Reference assertions by financial statement area; no client data collected.'},
  {name:'Audit Sampling Calculator',action:'sampling',detail:'Illustrative random index selection, not a statistical audit sample-size determination.'},
  {name:'Audit Completion Checklist',action:'completion',detail:'Interactive generic completion checklist with downloadable progress.'}
 ]},
 {title:'Everyday toolkit',items:[
  {name:'Word to PDF',url:'https://www.ilovepdf.com/word_to_pdf',detail:'Convert Word documents to PDF using an external service.'},
  {name:'Image to PDF',url:'https://www.ilovepdf.com/jpg_to_pdf',detail:'Combine image files into a PDF using an external service.'},
  {name:'Image Resizer',action:'resize',detail:'Resize an image locally in your browser; no upload required.'},
  {name:'Age Calculator',action:'age',detail:'Calculate age from a date of birth.'}
 ]},
 {title:'Puzzles & exploration',items:[
  {name:'Visited Districts Map',url:'https://en.wikipedia.org/wiki/Districts_of_Bangladesh',detail:'Explore the districts of Bangladesh (reference map).'}
 ]},
 {title:'Tax & revenue',items:[
  {name:'National Board of Revenue',url:'https://nbr.gov.bd/'},
  {name:'e-Return',url:'https://etaxnbr.gov.bd/'},
  {name:'TIN Registration',url:'https://secure.incometax.gov.bd/TINHome'},
  {name:'VAT Online Services',url:'https://vat.gov.bd/'},
  {name:'NBR Customs',url:'https://customs.gov.bd/'}
 ]},
 {title:'Banking & markets',items:[
  {name:'Bangladesh Bank',url:'https://www.bb.org.bd/'},
  {name:'BSEC',url:'https://sec.gov.bd/'},
  {name:'Dhaka Stock Exchange',url:'https://www.dsebd.org/'},
  {name:'Chittagong Stock Exchange',url:'https://www.cse.com.bd/'}
 ]},
 {title:'Business & law',items:[
  {name:'RJSC',url:'https://roc.gov.bd/'},
  {name:'Ministry of Commerce',url:'https://mincom.gov.bd/'},
  {name:'Ministry of Finance',url:'https://mof.gov.bd/'},
  {name:'e-GP (Government Procurement)',url:'https://www.eprocure.gov.bd/'}
 ]},
 {title:'Accounting & learning',items:[
  {name:'IFRS Foundation',url:'https://www.ifrs.org/'},
  {name:'Financial Reporting Council',url:'https://frc.gov.bd/'},
  {name:'ICAB',url:'https://www.icab.org.bd/'},
  {name:'Microsoft Excel Help',url:'https://support.microsoft.com/excel'}
 ]},
 {title:'Citizen services',items:[
  {name:'Bangladesh National Portal',url:'https://bangladesh.gov.bd/'},
  {name:'NID Services',url:'https://services.nidw.gov.bd/'},
  {name:'e-Passport',url:'https://www.epassport.gov.bd/'},
  {name:'Birth and Death Registration',url:'https://bdris.gov.bd/'},
  {name:'Police Clearance',url:'https://pcc.police.gov.bd/'},
  {name:'BRTA',url:'https://brta.gov.bd/'},
  {name:'Land Services (e-Porcha / e-Mutation)',url:'https://land.gov.bd/'}
 ]},
 {title:'Utilities & travel',items:[
  {name:'DESCO',url:'https://desco.gov.bd/'},
  {name:'DPDC',url:'https://dpdc.gov.bd/'},
  {name:'Dhaka WASA',url:'https://dwasa.org.bd/'},
  {name:'Titas Gas',url:'https://titasgas.gov.bd/'},
  {name:'Bangladesh Railway e-ticket',url:'https://eticket.railway.gov.bd/'},
  {name:'BTRC',url:'https://btrc.gov.bd/'}
 ]}
];
const auditPlanningSteps=[
 {phase:'Acceptance & ethics',items:['Engagement acceptance or continuance assessed','Independence and ethical requirements considered','Engagement terms and scope agreed']},
 {phase:'Understand the entity',items:['Industry and business model understood','Applicable financial reporting framework identified','Relevant laws and regulations considered','Processes and internal control environment understood']},
 {phase:'Risk assessment',items:['Fraud brainstorming and team discussion completed','Material classes of transactions and balances identified','Risks of material misstatement assessed','Significant risks and related controls identified']},
 {phase:'Audit strategy',items:['Overall materiality and performance materiality documented','Audit approach and nature, timing and extent planned','Team responsibilities and specialist needs considered','Planned procedures responsive to assessed risks prepared']},
 {phase:'Documentation & review',items:['Planning documentation reviewed','Outstanding planning matters resolved']}
];
function WorkspaceDirectory(){
 const [search,setSearch]=useState('');
 const [planningChecks,setPlanningChecks]=useState({});
 const [completionChecks,setCompletionChecks]=useState({});
 const [sampling,setSampling]=useState({population:'',count:''});
 const [sampleResult,setSampleResult]=useState([]);
 const [tool,setTool]=useState('');
 const [materiality,setMateriality]=useState({benchmark:'Profit before tax',amount:'',rate:'5',performance:'75'});
 const [birth,setBirth]=useState('');
 const [imageFile,setImageFile]=useState(null);
 const [width,setWidth]=useState('800');
 const [result,setResult]=useState('');
 const [toolError,setToolError]=useState('');
 const today=new Date();
 const birthDate=birth?new Date(birth+'T00:00:00'):null;
 const validBirth=birthDate&&!Number.isNaN(birthDate.getTime())&&birthDate<=today;
 let ageText='';
 if(validBirth){let years=today.getFullYear()-birthDate.getFullYear(),months=today.getMonth()-birthDate.getMonth(),days=today.getDate()-birthDate.getDate();if(days<0){months--;days+=new Date(today.getFullYear(),today.getMonth(),0).getDate()}if(months<0){years--;months+=12}ageText=years+' years, '+months+' months, '+days+' days';}
 const resize=async()=>{
  if(!imageFile)return setToolError('Choose an image first.');
  const w=Number(width);
  if(!Number.isInteger(w)||w<32||w>5000)return setToolError('Enter a width between 32 and 5000 pixels.');
  setToolError('');
  try{
   const bmp=await createImageBitmap(imageFile);
   const h=Math.round(bmp.height*w/bmp.width);
   if(h>10000)throw Error('Resulting image is too tall.');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   canvas.getContext('2d').drawImage(bmp,0,0,w,h);bmp.close();
   canvas.toBlob(blob=>{
    if(!blob){setToolError('Could not create the image.');return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='resized-'+imageFile.name.replace(/\.[^.]+$/,'')+'.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    setResult('Resized image downloaded ('+w+' × '+h+' px).');
   },'image/png');
  }catch(e){setToolError(e.message||'Could not resize this image.')}
 };
 return <div className="workspace-directory">
  <div className="workspace-directory-head"><div><span className="hub-kicker">EVERYDAY PROFESSIONAL WORK</span><h3>Workspace Essentials</h3><p>Useful tools, official portals and references for accounting, work and daily life.</p></div><label className="workspace-search">Search tools<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search links and utilities…" /></label></div>
  {workspaceGroups.map(group=>{
   const items=group.items.filter(x=>(x.name+' '+group.title+' '+(x.detail||'')).toLowerCase().includes(search.trim().toLowerCase()));
   return items.length>0&&<section className="workspace-category" key={group.title}><h4>{group.title}</h4><div className="workspace-tool-grid">{items.map(item=><article className="workspace-tool" key={item.name}><div><strong>{item.name}</strong>{item.detail&&<small>{item.detail}</small>}</div>{item.action?<button type="button" onClick={()=>{setTool(tool===item.action?'':item.action);setToolError('');setResult('')}}>{tool===item.action?'Close':'Open tool'} ↗</button>:item.url?<a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={'Open '+item.name+' in a new tab'}>Visit ↗</a>:<span className="workspace-coming-soon">Planned</span>}</article>)}</div></section>;
  })}
  {tool==='audit-planning'&&<div className="workspace-tool-panel workspace-audit-planning"><h4>Audit Planning Checklist</h4><p>Generic educational planning checklist. It is not a substitute for engagement-specific methodology, professional judgment or review. Do not enter client information.</p><div className="workspace-planning-progress"><strong>{Object.values(planningChecks).filter(Boolean).length} / {auditPlanningSteps.reduce((n,p)=>n+p.items.length,0)} completed</strong><button type="button" onClick={()=>setPlanningChecks({})}>Reset checklist</button></div>{auditPlanningSteps.map((phase,i)=><fieldset key={phase.phase} className="workspace-planning-group"><legend>{i+1}. {phase.phase}</legend>{phase.items.map((item,j)=>{const id=i+'-'+j;return <label key={id}><input type="checkbox" checked={!!planningChecks[id]} onChange={e=>setPlanningChecks(prev=>({...prev,[id]:e.target.checked}))}/><span>{item}</span></label>})}</fieldset>)}<button type="button" onClick={()=>{const lines=['AUDIT PLANNING CHECKLIST','Generic reference only — do not include confidential information','',...auditPlanningSteps.flatMap((phase,i)=>[phase.phase,...phase.items.map((item,j)=>(planningChecks[i+'-'+j]?'[x] ':'[ ] ')+item),''])];const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='audit-planning-checklist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}}>Download checklist (.txt)</button><p className="workspace-disclaimer">Checklist progress is held in this page only and resets when reloaded. No information is sent to the server.</p></div>}
  {tool==='risk-matrix'&&<div className="workspace-tool-panel"><h4>Risk Assessment & Assertions Matrix</h4><p>General reference only. Select an area to view commonly relevant assertions; actual risks and procedures require engagement-specific judgment.</p><div className="workspace-reference-grid">{[['Revenue','Occurrence, completeness, accuracy, cut-off, classification'],['Receivables','Existence, rights, valuation, completeness, presentation'],['Inventory','Existence, completeness, rights, valuation, presentation'],['Payables','Completeness, existence, obligations, accuracy, cut-off'],['Cash','Existence, rights, completeness, accuracy'],['Expenses','Occurrence, completeness, accuracy, cut-off, classification']].map(([area,assertions])=><article key={area}><strong>{area}</strong><p>{assertions}</p></article>)}</div><p className="workspace-disclaimer">No confidential client information should be entered here.</p></div>}
  {tool==='completion'&&<div className="workspace-tool-panel workspace-audit-planning"><h4>Audit Completion Checklist</h4><p>Generic educational checklist; follow your firm's methodology and reviewer requirements.</p><div className="workspace-planning-progress"><strong>{Object.values(completionChecks).filter(Boolean).length} / 8 completed</strong><button type="button" onClick={()=>setCompletionChecks({})}>Reset checklist</button></div><fieldset className="workspace-planning-group"><legend>Completion and reporting</legend>{['Evaluate uncorrected misstatements','Complete subsequent events procedures','Evaluate going concern','Obtain required written representations','Review financial statement disclosures','Resolve outstanding review notes','Assess overall evidence and conclusions','Complete reporting and final documentation'].map((item,i)=><label key={item}><input type="checkbox" checked={!!completionChecks[i]} onChange={e=>setCompletionChecks(p=>({...p,[i]:e.target.checked}))}/><span>{item}</span></label>)}</fieldset><button type="button" onClick={()=>{const items=['AUDIT COMPLETION CHECKLIST','Generic reference only','',...['Evaluate uncorrected misstatements','Complete subsequent events procedures','Evaluate going concern','Obtain required written representations','Review financial statement disclosures','Resolve outstanding review notes','Assess overall evidence and conclusions','Complete reporting and final documentation'].map((x,i)=>(completionChecks[i]?'[x] ':'[ ] ')+x)];const a=document.createElement('a'),url=URL.createObjectURL(new Blob([items.join('\n')],{type:'text/plain'}));a.href=url;a.download='audit-completion-checklist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}}>Download checklist (.txt)</button></div>}
  {tool==='sampling'&&<div className="workspace-tool-panel"><h4>Random Index Selector</h4><p>Generate unique random item numbers for a numbered population. This does not calculate an appropriate audit sample size or guarantee representativeness.</p><div className="workspace-materiality-fields"><label>Population size<input type="number" min="1" max="1000000" step="1" value={sampling.population} onChange={e=>setSampling(p=>({...p,population:e.target.value}))}/></label><label>Number to select<input type="number" min="1" max="500" step="1" value={sampling.count} onChange={e=>setSampling(p=>({...p,count:e.target.value}))}/></label></div><button type="button" onClick={()=>{const n=Number(sampling.population),k=Number(sampling.count);if(!Number.isSafeInteger(n)||n<1||n>1000000||!Number.isSafeInteger(k)||k<1||k>500||k>n){setToolError('Enter a population of 1–1,000,000 and a selection count of 1–500 not exceeding the population.');setSampleResult([]);return}const selected=new Set();const random=new Uint32Array(1);while(selected.size<k){crypto.getRandomValues(random);const limit=Math.floor(4294967296/n)*n;if(random[0]<limit)selected.add(random[0]%n+1)}setSampleResult([...selected].sort((a,b)=>a-b));setToolError('')}}>Generate indices</button>{toolError&&<p role="alert">{toolError}</p>}{sampleResult.length>0&&<div className="workspace-result" role="status"><strong>Selected indices ({sampleResult.length}):</strong><p>{sampleResult.join(', ')}</p><button type="button" onClick={()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([sampleResult.join('\n')],{type:'text/plain'}));a.href=url;a.download='random-indices.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}}>Download indices</button></div>}</div>}
  {tool==='materiality'&&<div className="workspace-tool-panel" aria-label="Audit materiality calculator"><h4>Audit Materiality Calculator</h4><p>Illustrative planning aid only; actual benchmark and percentage require professional judgment and engagement methodology.</p><div className="workspace-materiality-fields"><label>Benchmark<select value={materiality.benchmark} onChange={e=>setMateriality(p=>({...p,benchmark:e.target.value}))}>{['Profit before tax','Revenue','Total assets','Total expenses','Equity','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Benchmark amount (BDT)<input type="number" min="0" step="any" placeholder="e.g. 10000000" value={materiality.amount} onChange={e=>setMateriality(p=>({...p,amount:e.target.value}))}/></label><label>Overall materiality rate (%)<input type="number" min="0.01" max="100" step="0.01" value={materiality.rate} onChange={e=>setMateriality(p=>({...p,rate:e.target.value}))}/></label><label>Performance materiality (% of overall)<input type="number" min="1" max="100" step="1" value={materiality.performance} onChange={e=>setMateriality(p=>({...p,performance:e.target.value}))}/></label></div>{(()=>{const amount=Number(materiality.amount),rate=Number(materiality.rate),performance=Number(materiality.performance),valid=materiality.amount.trim()!==''&&Number.isFinite(amount)&&amount>=0&&Number.isFinite(rate)&&rate>0&&rate<=100&&Number.isFinite(performance)&&performance>0&&performance<=100;if(!valid)return <p role="status">Enter valid amounts and percentages to calculate materiality.</p>;const overall=amount*rate/100,pm=overall*performance/100;const fmt=n=>new Intl.NumberFormat('en-BD',{maximumFractionDigits:2}).format(n);return <div className="workspace-materiality-result" role="status"><div><span>Overall materiality</span><strong>BDT {fmt(overall)}</strong></div><div><span>Performance materiality</span><strong>BDT {fmt(pm)}</strong></div><small>Formula: benchmark × materiality rate; overall materiality × performance materiality percentage. No client data is stored or transmitted by this calculator.</small></div>})()}</div>}
  {tool==='age'&&<div className="workspace-tool-panel"><h4>Age Calculator</h4><label>Date of birth <input type="date" max={today.toLocaleDateString('en-CA')} value={birth} onChange={e=>setBirth(e.target.value)}/></label>{validBirth&&<p className="workspace-result">Age: <strong>{ageText}</strong></p>}{birth&&!validBirth&&<p role="alert">Choose a valid past date.</p>}</div>}
  {tool==='resize'&&<div className="workspace-tool-panel"><h4>Image Resizer</h4><p>Images are processed on your device; they are not uploaded to this portfolio.</p><label>Select image <input type="file" accept="image/*" onChange={e=>{setImageFile(e.target.files?.[0]||null);setToolError('');setResult('')}}/></label><label>Output width (pixels) <input type="number" min="32" max="5000" value={width} onChange={e=>setWidth(e.target.value)}/></label><button type="button" onClick={resize}>Resize & download PNG</button>{toolError&&<p role="alert">{toolError}</p>}{result&&<p className="workspace-result" role="status">{result}</p>}</div>}
  <p className="workspace-disclaimer">External links open third-party websites. Check their privacy terms before uploading confidential documents. Portal addresses and availability may change.</p>
 </div>;
}
function VisitorTraffic(){
 const [stats,setStats]=useState(null);
 useEffect(()=>{
  let active=true;let id;
  try{id=sessionStorage.getItem('portfolio_visitor_session');if(!id){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);id=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem('portfolio_visitor_session',id)}}catch{return}
  const refresh=async()=>{if(document.visibilityState==='hidden')return;try{const response=await fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:id}),cache:'no-store'});const data=await response.json();if(active)setStats(response.ok&&data.available?data:null)}catch{if(active)setStats(null)}};
  refresh();const interval=setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);
  return ()=>{active=false;clearInterval(interval);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 return <div className="footer-traffic" aria-label="Website visitor statistics"><span><strong>{stats?.visitors?.toLocaleString('en-US')??'—'}</strong><small>Visitor sessions</small></span><span><i className="traffic-live-dot" aria-hidden="true"/><strong>{stats?.online?.toLocaleString('en-US')??'—'}</strong><small>Online now</small></span>{!stats&&<small className="traffic-unavailable">Visitor data unavailable</small>}</div>;
}
function SelectedProjects({cases=PROJECTS}){

 return <div className="case-studies">{cases.map((p,i)=><article className="case-study" key={p.title}><span className="eyebrow">0{i+1} / {p.tag}</span><h3>{p.title}</h3><ol className="project-flow" aria-label={p.title+' workflow'}>{p.flow.map(step=><li key={step}>{step}</li>)}</ol><p className="diagram-caption">Illustrative workflow</p><dl><div><dt>Purpose</dt><dd>{p.problem}</dd></div><div><dt>Contribution</dt><dd>{p.contribution}</dd></div><div><dt>Current state</dt><dd>{p.result}</dd></div></dl><a className="hub-link" href={p.link} {...(p.link.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{p.cta} ↗</a>{i===0&&<p className="muted-note">Business records require sign-in. <a href="/erp-preview">See application screenshots</a> before opening the workspace.</p>}</article>)}</div>;
}
function App(){
 const mobilePages=['feed','profile','consultation','workstation','appointment'];
 const initialPage=()=>{const route=window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();const page=({contact:'consultation',resources:'workstation','erp-preview':'workstation'})[route]||route;return mobilePages.includes(page)?page:'profile'};
 const [activePage,setActivePage]=useState(initialPage);
 useEffect(()=>{const sync=()=>setActivePage(initialPage());window.addEventListener('popstate',sync);return ()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{document.documentElement.dataset.activePage=activePage;window.scrollTo(0,0)},[activePage]);
 const mobileNavigate=(event,page)=>{event.preventDefault();if(activePage!==page){window.history.pushState({},'',page==='profile'?'/':'/'+page);setActivePage(page)}setMenu(false)};
 useEffect(()=>{const onHashClick=event=>{const link=event.target.closest?.('a[href^="#"]');if(!link)return;const target=link.getAttribute('href');if(!target||target==='#')return;const page=target==='#updates'?'feed':target==='#workstation'?'workstation':target==='#consultation'?'consultation':target==='#appointment'?'appointment':'profile';if(activePage!==page){event.preventDefault();window.history.pushState({},'',(page==='profile'?'/':'/'+page)+target);setActivePage(page);requestAnimationFrame(()=>document.querySelector(target)?.scrollIntoView())}};document.addEventListener('click',onHashClick);return ()=>document.removeEventListener('click',onHashClick)},[activePage]);
 const mobileDestinations=[['Updates/Feed','feed'],['Profile','profile'],['Consultation','consultation'],['Workstation','workstation'],['Appointment','appointment']];
 const [content,setContent]=useState(fallback);
 const profile={...PROFILE,...content.profile};
 const [menu,setMenu]=useState(false);
 useEffect(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.layout='editorial';document.documentElement.dataset.font='inter';document.documentElement.dataset.accent='teal';},[]);
 useEffect(()=>{const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(data=>{if(data&&Array.isArray(data.sections))setContent(data)}).catch(()=>{});return ()=>controller.abort()},[]);
 useEffect(()=>{document.title=(content.name||'Abdul Owahab')+' | Audit & Assurance · Deloitte Bangladesh'},[content.name]);
 const ids=new Set((content.sections||[]).map(x=>x.id));
 const sortedUpdates=[...(content.posts||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 return <>
 <a className="skip" href="#main">Skip to content</a>
 {menu&&<button type="button" className="nav-drawer-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}<header className="nav"><a className="brand" href="/" onClick={e=>mobileNavigate(e,'profile')} aria-label="Portfolio home"><span className="brand-monogram">{content.avatarUrl?<img className="brand-avatar" src={content.avatarUrl} alt="" loading="eager" />:(content.name||"Abdul Owahab").trim().split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><span className="brand-name">{content.name||"Abdul Owahab"}</span></a><button className="menu-button" type="button" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)} aria-label={menu?"Close navigation":"Open navigation"}><span aria-hidden="true">{menu?"×":"☰"}</span></button><nav id="navigation" className={menu?'nav-links open':'nav-links'} aria-label="Main navigation"><div className="drawer-heading">Navigation <button type="button" aria-label="Close menu" onClick={()=>setMenu(false)}>×</button></div>{mobileDestinations.map(([label,page])=><a key={page} className={'nav-destination'+(activePage===page?' is-active':'')} aria-current={activePage===page?'page':undefined} href={page==='profile'?'/':'/'+page} onClick={e=>{mobileNavigate(e,page);setMenu(false)}}>{label}</a>)}<a className="nav-admin" href="/admin" onClick={()=>setMenu(false)}>Admin</a></nav></header>
 <main id="main">
 <section className="hero" id="top"><div className="hero-inner"><div className="hero-copy">{content.avatarUrl&&<div className="hero-photo-wrap"><img className="hero-profile-photo" src={content.avatarUrl} alt={`${content.name||"Abdul Owahab"} profile photo`} loading="eager" /></div>}<p className="overline"><span className="status-dot"/> 02 / PROFILE · ACCOUNTING · AUDIT · TECHNOLOGY</p><h1>{content.name||'Abdul Owahab'}<span className="hero-period">.</span></h1><h2 className="profile-headline">{profile.headline}</h2><p className="hero-subtitle">{profile.intro}</p><div className="hero-actions"><a className="button primary" href="#experience">Explore my work <span aria-hidden="true">↗</span></a><a className="button secondary" href="#contact">Get in touch</a></div></div><div className="hero-aside"><span className="aside-label">AT A GLANCE</span>{(content.facts||[]).map((f,i)=><div className="fact" key={i}><span>{f.label}</span><strong>{f.value}</strong></div>)}</div></div><div className="hero-bottom"><span>BASED IN DHAKA, BANGLADESH</span><span>SCROLL TO EXPLORE ↓</span></div></section>
 <div className="reference-breadcrumb"><a href="#top">Profile</a> <span>›</span> <span>Overview</span></div>
 <div className="reference-stats">{(content.facts||[]).map((f,i)=><div className="stat-card" key={i}><strong>{f.value}</strong><span>{f.label}</span></div>)}</div>
 <div className="content-wrap">
 <Section id="career" eyebrow="CAREER" title="Experiences"><CareerTimeline/><h3 className="subsection-title">Industry-wise audit exposure</h3><Engagements/></Section>
 <Section id="expertise" eyebrow="SKILLS" title="Expertise & professional development"><TrainingCards/></Section>
 {(content.sections||[]).map((s,i)=><Section key={s.id||i} id={s.id||'section-'+i} eyebrow={String(i+1).padStart(2,'0')} title={s.title}><RichText body={s.body||''}/>{s.id==='projects'&&<SelectedProjects cases={content.projects||PROJECTS}/>}</Section>)}
 {!ids.has('experience')&&<Section id="experience" eyebrow="EXPERTISE" title="Professional experience"><p>Working across statutory and group audit engagements at Deloitte Bangladesh, with exposure to a range of sectors and financial statement areas.</p><dl className="detail-list">{experience.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Section>}
 {!ids.has('projects')&&<Section id="projects" eyebrow="SELECTED WORK" title="Projects & ventures"><div className="project-grid">{projects.map((p,i)=><article className="project-card" key={p.title}><span className="project-number">0{i+1} / {p.tag}</span><h3>{p.title}</h3><p>{p.body}</p>{p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer">{p.cta} ↗</a>}</article>)}</div></Section>}
 {!ids.has('education')&&<Section id="education" eyebrow="BACKGROUND" title="Education & development"><p>BBA in Accounting & Information Systems from Jagannath University, Dhaka. Pursuing Chartered Accountancy at ICAB Professional Level.</p></Section>}
 <Section id="updates" eyebrow="01 / FEED" title="Updates & Feed">
  <div className="hub-intro"><p>Posts, photos and milestones from my work, professional learning and technology projects.</p><span>{sortedUpdates.length} {sortedUpdates.length===1?'update':'updates'}</span></div>
  {sortedUpdates.length>0?<div className="updates updates-social-feed" aria-label="Latest updates, newest first">
   {sortedUpdates.map((p,i)=><UpdateCard key={p.id||i} post={p} featured={i===0} authorName={content.name||'Abdul Owahab'} avatarUrl={content.avatarUrl||''}/>)}
  </div>:<div className="hub-empty">No public updates yet. New posts and photos published from the Admin Panel will appear here.</div>}
 </Section>
 <Section id="consultation" eyebrow="03 / DISCUSS" title="Consultation">
  <div className="hub-intro"><p>For professional conversations, recruitment opportunities, knowledge exchange and technology collaboration.</p></div>
  <div className="hub-shell">
   <div className="hub-detail"><span className="hub-kicker">START A CONVERSATION</span><h3>Discuss an idea or opportunity</h3><p>Share the scope of your question or proposal. I can review relevant enquiries and respond directly where appropriate.</p><div className="hub-tags"><span>Professional discussion</span><span>Career opportunities</span><span>Technology & projects</span></div><p className="hub-caution">This is an enquiry channel, not an offer of independent regulated audit or tax services.</p></div>
   <ContactRequest mode="consultation"/>
  </div>
 </Section>
 <Section id="workstation" eyebrow="04 / TOOLS" title="Workstation">
  <div className="hub-intro"><p>Applications and project environments I build or contribute to. Open a workspace or explore its purpose.</p></div>
  <div className="workstation-grid">
   <article className="workstation-card"><span className="hub-kicker">ACCOUNTING APPLICATION</span><h3>Tickydo ERP</h3><p>Chart of Accounts, journals, trial balance, general ledger and financial reports. Sign-in is required to access business records.</p><a href="/erp/" className="hub-link">Open ERP workstation ↗</a></article>
   <article className="workstation-card"><span className="hub-kicker">VENTURE</span><h3>Tickydo Ticketing</h3><p>Digital passenger ticketing and smart bus-counter operations currently in pilot testing.</p><a href="https://tickydo.com" target="_blank" rel="noopener noreferrer" className="hub-link">Explore Tickydo ↗</a></article>
   <article className="workstation-card"><span className="hub-kicker">DEVELOPMENT</span><h3>Portfolio source</h3><p>React portfolio with content management and Vercel-backed features. Browse the public source repository.</p><a href="https://github.com/aowahab/abdulowahab" target="_blank" rel="noopener noreferrer" className="hub-link">View GitHub project ↗</a></article>
  </div>
  <WorkspaceDirectory/><details className="erp-preview-details" open={window.location.pathname==='/erp-preview'}><summary>Preview Tickydo ERP with sample data</summary><div className="erp-gallery">{[['dashboard','Dashboard'],['journal','Journal entries'],['reports','Trial balance']].map(([file,label])=><figure key={file}><img src={'/previews/erp-'+file+'.png'} alt={label+' with synthetic sample data'} loading="lazy"/><figcaption>{label} · illustrative sample data</figcaption></figure>)}</div></details>
 </Section>
 <Section id="appointment" eyebrow="05 / MEET" title="Appointment">
  <div className="hub-intro"><p>Prefer a scheduled conversation? Send your requested date, time and purpose for review.</p></div>
  <div className="hub-shell">
   <div className="hub-detail"><span className="hub-kicker">MEETING REQUEST</span><h3>Propose a time to connect</h3><p>Request a discussion about a career opportunity, partnership or project. Your preferred time will be shared privately, not automatically booked.</p><div className="hub-tags"><span>Online discussion</span><span>Time-zone aware request</span><span>Private follow-up</span></div><p className="hub-caution">Availability is not confirmed here. Please wait for a personal response before considering the meeting scheduled.</p></div>
   <ContactRequest mode="appointment"/>
  </div>
 </Section>
 <Section id="contact" eyebrow="LET'S CONNECT" title="Have something in mind?"><p>I'm interested in conversations about accounting, audit and assurance, reporting, technology and entrepreneurship.</p><div className="contact-links"><a href="mailto:abdulowahab.jnu@gmail.com">Email ↗</a><a href="tel:+8801521577910">Phone ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>{[['Facebook',content.social?.facebook],['Messenger',content.social?.messenger],['Instagram',content.social?.instagram]].filter(([,url])=>/^https:\/\//.test(url||'')).map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a>)}</div></Section>
 </div></main><PortfolioAI/><nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">{mobileDestinations.map(([label,page])=><a key={page} href={page==='profile'?'/':'/'+page} className={activePage===page?'is-active':''} aria-current={activePage===page?'page':undefined} onClick={e=>mobileNavigate(e,page)}><span className="bottom-nav-icon" aria-hidden="true">{({feed:'▣',profile:'♙',consultation:'✉',workstation:'▤',appointment:'▦'})[page]}</span><span>{label}</span></a>)}</nav><a className="back-to-top" href="#top" aria-label="Back to top">↑</a><footer className="footer" aria-label="Site footer">
 <div className="footer-main">
  <div className="footer-intro"><a className="footer-identity" href="#top"><span className="footer-mark">{(content.name||'Abdul Owahab').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><span>{content.name||'Abdul Owahab'}</span></a><p>Audit &amp; Assurance professional, Chartered Accountancy student and technology co-founder. Grounded in accounting, assurance, practical innovation and meaningful collaboration.</p><span className="footer-location">Dhaka, Bangladesh</span></div>
  <div className="footer-column"><h3>Explore</h3><a href="#about">About</a><a href="#career">Experience</a><a href="#expertise">Expertise</a><a href="#projects">Projects</a><a href="#education">Education</a><a href="#updates">Updates &amp; Feed</a></div>
  <div className="footer-column"><h3>Projects</h3><a href="https://tickydo.com" target="_blank" rel="noopener noreferrer">Tickydo Ticketing ↗</a><a href="/erp/">Tickydo ERP ↗</a><a href="#projects">Other projects</a></div>
  <div className="footer-column"><h3>Connect</h3><a href="mailto:abdulowahab.jnu@gmail.com">Email me ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://github.com/aowahab" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="#consultation">Consultation enquiry</a><a href="#appointment">Appointment request</a></div>
 </div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} {content.name||'Abdul Owahab'}. All rights reserved.</span><VisitorTraffic/><a href="/admin">Admin login</a></div>
 </footer></>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
