import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

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
function TrainingCards(){return <div className="training-grid">{[['Audit & Assurance','Statutory audit','Group audit','Risk assessment and substantive testing'],['Financial Reporting','IFRS and IAS application','Financial statement analysis'],['Data & Technology','Advanced Excel','Deloitte Omnia','Levvia'],['Professional Development','ICAB Professional Level studies','Accounting and business law']].map(([category,...items])=><article className="training-card" key={category}><h3>{category}</h3>{items.map(item=><p key={item}>{item}</p>)}</article>)}</div>}
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
  const details=appointment?['Meeting request', 'Preferred: '+v.preferredDate+' '+v.preferredTime+' ('+v.timezone+')','Purpose: '+v.details].join('\\n'):v.details;
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
function UpdateCard({post,featured=false,expanded=false}) {
 const media=Array.isArray(post.media)?post.media:[];
 const visibleMedia=expanded?media:media.slice(0,1);
 const text=post.body||'';
 const summary=!expanded&&!featured&&text.length>165?text.slice(0,162).trimEnd()+'…':text;
 return <article className={'update'+(featured?' update-featured':' update-preview')}>
  {featured&&<span className="update-featured-label">LATEST UPDATE</span>}
  <time dateTime={post.date}>{post.date?new Date(post.date).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'}):''}</time>
  {post.title&&<h3>{post.title}</h3>}
  {summary&&<RichText body={summary}/>}
  {visibleMedia.length>0&&<div className="media">{visibleMedia.map((m,j)=>m.type?.startsWith('image/')?<img key={j} loading="lazy" src={m.url} alt={m.name||post.title||'Update photo'}/>:m.type?.startsWith('video/')?<video key={j} controls preload="metadata" src={m.url}/>:<a key={j} href={m.url} target="_blank" rel="noopener noreferrer">{m.name||'View attachment'}</a>)}</div>}
  {!expanded&&media.length>1&&<span className="update-photo-count">+{media.length-1} more attachments</span>}
 </article>;
}
function App(){
 const [content,setContent]=useState(fallback);
 const [menu,setMenu]=useState(false);
 const [showAllUpdates,setShowAllUpdates]=useState(false);
 useEffect(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.layout='editorial';document.documentElement.dataset.font='inter';document.documentElement.dataset.accent='teal';},[]);
 useEffect(()=>{const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(data=>{if(data&&Array.isArray(data.sections))setContent(data)}).catch(()=>{});return ()=>controller.abort()},[]);
 useEffect(()=>{document.title=(content.name||'Abdul Owahab')+' | Audit & Assurance · Deloitte Bangladesh'},[content.name]);
 const ids=new Set((content.sections||[]).map(x=>x.id));
 const sortedUpdates=[...(content.posts||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 return <>
 <a className="skip" href="#main">Skip to content</a>
 {menu&&<button type="button" className="nav-drawer-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}<header className="nav"><a className="brand" href="#top" aria-label="Portfolio home"><span className="brand-monogram">{content.avatarUrl?<img className="brand-avatar" src={content.avatarUrl} alt="" loading="eager" />:(content.name||"Abdul Owahab").trim().split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><span className="brand-name">{content.name||"Abdul Owahab"}</span></a><button className="menu-button" type="button" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)} aria-label={menu?"Close navigation":"Open navigation"}><span aria-hidden="true">{menu?"×":"☰"}</span></button><nav id="navigation" className={menu?'nav-links open':'nav-links'} aria-label="Main navigation"><div className="drawer-heading">Navigation <button type="button" aria-label="Close menu" onClick={()=>setMenu(false)}>×</button></div>{[['Updates/Feed','#updates'],['Profile','#top'],['Consultation','#consultation'],['Workstation','#workstation'],['Appointment','#appointment']].map(([label,href])=><a key={href} className="nav-destination" href={href} onClick={()=>setMenu(false)}>{label}</a>)}<a className="nav-admin" href="/admin" onClick={()=>setMenu(false)}>Admin</a></nav></header>
 <main id="main">
 <section className="hero" id="top"><div className="hero-inner"><div className="hero-copy">{content.avatarUrl&&<div className="hero-photo-wrap"><img className="hero-profile-photo" src={content.avatarUrl} alt={`${content.name||"Abdul Owahab"} profile photo`} loading="eager" /></div>}<p className="overline"><span className="status-dot"/> 02 / PROFILE · ACCOUNTING · AUDIT · TECHNOLOGY</p><h1>{content.name||'Abdul Owahab'}<span className="hero-period">.</span></h1><p className="hero-subtitle">Accounting & Information Systems graduate, Senior Associate in Audit & Assurance at Deloitte Bangladesh, ICAB Professional Level student and technology co-founder.</p><div className="hero-actions"><a className="button primary" href="#experience">Explore my work <span aria-hidden="true">↗</span></a><a className="button secondary" href="#contact">Get in touch</a></div></div><div className="hero-aside"><span className="aside-label">AT A GLANCE</span>{(content.facts||[]).map((f,i)=><div className="fact" key={i}><span>{f.label}</span><strong>{f.value}</strong></div>)}</div></div><div className="hero-bottom"><span>BASED IN DHAKA, BANGLADESH</span><span>SCROLL TO EXPLORE ↓</span></div></section>
 <div className="reference-breadcrumb"><a href="#top">Profile</a> <span>›</span> <span>Overview</span></div>
 <div className="reference-stats">{(content.facts||[]).map((f,i)=><div className="stat-card" key={i}><strong>{f.value}</strong><span>{f.label}</span></div>)}</div>
 <div className="content-wrap">
 <Section id="career" eyebrow="CAREER" title="Experiences"><CareerTimeline/><h3 className="subsection-title">Industry-wise audit exposure</h3><Engagements/></Section>
 <Section id="expertise" eyebrow="SKILLS" title="Expertise & professional development"><TrainingCards/></Section>
 {(content.sections||[]).map((s,i)=><Section key={s.id||i} id={s.id||'section-'+i} eyebrow={String(i+1).padStart(2,'0')} title={s.title}><RichText body={s.body||''}/></Section>)}
 {!ids.has('experience')&&<Section id="experience" eyebrow="EXPERTISE" title="Professional experience"><p>Working across statutory and group audit engagements at Deloitte Bangladesh, with exposure to a range of sectors and financial statement areas.</p><dl className="detail-list">{experience.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Section>}
 {!ids.has('projects')&&<Section id="projects" eyebrow="SELECTED WORK" title="Projects & ventures"><div className="project-grid">{projects.map((p,i)=><article className="project-card" key={p.title}><span className="project-number">0{i+1} / {p.tag}</span><h3>{p.title}</h3><p>{p.body}</p>{p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer">{p.cta} ↗</a>}</article>)}</div></Section>}
 {!ids.has('education')&&<Section id="education" eyebrow="BACKGROUND" title="Education & development"><p>BBA in Accounting & Information Systems from Jagannath University, Dhaka. Pursuing Chartered Accountancy at ICAB Professional Level.</p></Section>}
 <Section id="updates" eyebrow="01 / FEED" title="Updates & Feed">
  <div className="hub-intro"><p>Posts, photos and milestones from my work, professional learning and technology projects.</p><span>{sortedUpdates.length} {sortedUpdates.length===1?'update':'updates'}</span></div>
  {sortedUpdates.length>0?<><div className={showAllUpdates?'updates updates-expanded':'updates updates-preview-layout'}>
   {(showAllUpdates?sortedUpdates:sortedUpdates.slice(0,3)).map((p,i)=><UpdateCard key={p.id||i} post={p} featured={!showAllUpdates&&i===0} expanded={showAllUpdates}/>)}
  </div>
  {sortedUpdates.length>1&&<div className="updates-actions"><button className="updates-see-more" type="button" aria-expanded={showAllUpdates} onClick={()=>setShowAllUpdates(!showAllUpdates)}>{showAllUpdates?'Show Less ↑':'See More Updates ('+sortedUpdates.length+') →'}</button></div>}</>
  :<div className="hub-empty">No public updates yet. New posts and photos published from the Admin Panel will appear here.</div>}
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
 </Section>
 <Section id="appointment" eyebrow="05 / MEET" title="Appointment">
  <div className="hub-intro"><p>Prefer a scheduled conversation? Send your requested date, time and purpose for review.</p></div>
  <div className="hub-shell">
   <div className="hub-detail"><span className="hub-kicker">MEETING REQUEST</span><h3>Propose a time to connect</h3><p>Request a discussion about a career opportunity, partnership or project. Your preferred time will be shared privately, not automatically booked.</p><div className="hub-tags"><span>Online discussion</span><span>Time-zone aware request</span><span>Private follow-up</span></div><p className="hub-caution">Availability is not confirmed here. Please wait for a personal response before considering the meeting scheduled.</p></div>
   <ContactRequest mode="appointment"/>
  </div>
 </Section>
 <Section id="contact" eyebrow="LET'S CONNECT" title="Have something in mind?"><p>I'm interested in conversations about accounting, audit and assurance, reporting, technology and entrepreneurship.</p><div className="contact-links"><a href="mailto:abdulowahab.jnu@gmail.com">Email ↗</a><a href="tel:+8801521577910">Phone ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>{[['Facebook',content.social?.facebook],['Messenger',content.social?.messenger],['Instagram',content.social?.instagram]].filter(([,url])=>/^https:\/\//.test(url||'')).map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a>)}</div></Section>
 </div></main><PortfolioAI/><nav className="mobile-bottom-nav" aria-label="Mobile quick navigation"><a href="#updates"><span className="bottom-nav-icon" aria-hidden="true">▣</span><span>Updates/Feed</span></a><a href="#top"><span className="bottom-nav-icon" aria-hidden="true">♙</span><span>Profile</span></a><a href="#consultation"><span className="bottom-nav-icon" aria-hidden="true">✉</span><span>Consultation</span></a><a href="#workstation"><span className="bottom-nav-icon" aria-hidden="true">▤</span><span>Workstation</span></a><a href="#appointment"><span className="bottom-nav-icon" aria-hidden="true">▦</span><span>Appointment</span></a></nav><a className="back-to-top" href="#top" aria-label="Back to top">↑</a><footer className="footer" aria-label="Site footer">
 <div className="footer-main">
  <div className="footer-intro"><a className="footer-identity" href="#top"><span className="footer-mark">{(content.name||'Abdul Owahab').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><span>{content.name||'Abdul Owahab'}</span></a><p>Audit &amp; Assurance professional, Chartered Accountancy student and technology co-founder. Grounded in accounting, assurance, practical innovation and meaningful collaboration.</p><span className="footer-location">Dhaka, Bangladesh</span></div>
  <div className="footer-column"><h3>Explore</h3><a href="#about">About</a><a href="#career">Experience</a><a href="#expertise">Expertise</a><a href="#projects">Projects</a><a href="#education">Education</a><a href="#updates">Updates &amp; Feed</a></div>
  <div className="footer-column"><h3>Projects</h3><a href="https://tickydo.com" target="_blank" rel="noopener noreferrer">Tickydo Ticketing ↗</a><a href="/erp/">Tickydo ERP ↗</a><a href="#projects">Other projects</a></div>
  <div className="footer-column"><h3>Connect</h3><a href="mailto:abdulowahab.jnu@gmail.com">Email me ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://github.com/aowahab" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="#consultation">Consultation enquiry</a><a href="#appointment">Appointment request</a></div>
 </div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} {content.name||'Abdul Owahab'}. All rights reserved.</span><span>Designed for clarity · Built with React &amp; Vercel</span><a href="#top">Back to top ↑</a></div>
 </footer></>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
