import React, { useEffect, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import ProfessionalNews from './ProfessionalNews.jsx';
import PortfolioAI from './PortfolioAI.jsx';
const TickyTools=lazy(()=>import('./TickyTools.jsx'));
import { PROFILE } from '../shared/profile.js';
import { PROJECTS } from '../shared/projects.js';
import { publicContentOnly } from '../shared/public-content.js';

const fallback = {
 name:'Abdul Owahab',
 avatarUrl:'/profile-photo.jpg',
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
 {title:'Tickydo ERP — Accounting',tag:'Accounting application · Node.js · PostgreSQL / SQLite',body:'Accounting module featuring a chart of accounts, balanced double-entry journal entries, reversal documents, period locking, trial balance, general ledger, income statement and balance sheet. Built with Node.js, SQLite for local development and PostgreSQL support for Vercel.',url:'/erp/',cta:'Open ERP application'},
 {title:'Audit workflows',tag:'Professional practice',body:'Evidence-based audit testing, reconciliations, financial reporting and structured documentation across diverse industries.'},
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
function ContactRequest({initialMeeting=false}) {
 const [appointment,setAppointment]=useState(initialMeeting);
 const [v,setV]=useState({name:'',organization:'',contact:'',details:'',preferredDate:'',preferredTime:'',timezone:'Asia/Dhaka',leadType:'recruiter',consent:false,website:''});
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const update=(k,val)=>setV(prev=>({...prev,[k]:val}));
 const submit=async e=>{
  e.preventDefault();
  if(appointment && (!v.preferredDate||!v.preferredTime)){setStatus('Please choose a preferred date and time.');return;}
  setBusy(true);setStatus('');
  const details=appointment?['Meeting request', 'Enquiry: '+v.leadType, 'Preferred: '+v.preferredDate+' '+v.preferredTime+' ('+v.timezone+')','Purpose: '+v.details].join('\n'):v.details;
  try{
   const resp=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:v.name,organization:v.organization,contact:v.contact,kind:appointment?'appointment':v.leadType,details,consent:v.consent,website:v.website
   })});
   const data=await resp.json();
   if(!resp.ok)throw Error(data.error||'Unable to submit request');
   setStatus(appointment?'Appointment request received in the private inbox. This is not a confirmed booking; Abdul will follow up.':'Message received in the private inbox. Abdul can review and follow up using your contact details.');
   setV({name:'',organization:'',contact:'',details:'',preferredDate:'',preferredTime:'',timezone:'Asia/Dhaka',leadType:'recruiter',consent:false,website:''});
  }catch(err){setStatus((err.message||'Could not submit')+'. You can email abdulowahab.jnu@gmail.com instead.');}
  finally{setBusy(false);}
 };
 return <form className="quick-request contact-request" onSubmit={submit}>
  <div className="contact-form-intro"><span className="contact-form-kicker">DIRECT MESSAGE</span><h3>Let’s start a conversation</h3><p>Share an opportunity, ask a question, or tell me what you have in mind.</p></div>
  <div className="request-fields">
   <label>Full name *<input type="text" autoComplete="name" required maxLength={120} value={v.name} onChange={e=>update('name',e.target.value)} placeholder="Your name"/></label>
   <label>Email or phone *<input type="text" required minLength={5} maxLength={200} value={v.contact} onChange={e=>update('contact',e.target.value)} placeholder="How to reach you"/></label>
   <label className="request-wide">Company / organization (optional)<input type="text" autoComplete="organization" maxLength={160} value={v.organization} onChange={e=>update('organization',e.target.value)} placeholder="Organization name"/></label>
   {<label className="request-wide">I’m reaching out about<select aria-label="I’m reaching out about" value={v.leadType} onChange={e=>update('leadType',e.target.value)}><option value="recruiter">Recruitment / career opportunity</option><option value="collaboration">Professional collaboration</option><option value="client">Business / project enquiry</option><option value="other">Something else</option></select></label>}
   <label className="meeting-option request-wide"><input type="checkbox" checked={appointment} onChange={e=>{setAppointment(e.target.checked);setStatus('')}}/> Suggest a meeting time (optional)</label>
   {appointment&&<>
    <label>Preferred date *<input type="date" required value={v.preferredDate} min={new Date().toISOString().slice(0,10)} onChange={e=>update('preferredDate',e.target.value)}/></label>
    <label>Preferred time *<input type="time" required value={v.preferredTime} onChange={e=>update('preferredTime',e.target.value)}/></label>
    <label className="request-wide">Time zone<select value={v.timezone} onChange={e=>update('timezone',e.target.value)}><option value="Asia/Dhaka">Bangladesh (UTC+6)</option><option value="Asia/Singapore">Singapore (UTC+8)</option><option value="Europe/London">London</option><option value="UTC">UTC</option><option value="Other (specify in message)">Other (specify below)</option></select></label>
   </>}
   <label className="request-wide">{appointment?'Meeting purpose *':'What would you like to discuss? *'}<textarea required minLength={10} maxLength={appointment?1200:1450} rows={4} value={v.details} onChange={e=>update('details',e.target.value)} placeholder={appointment?'Share the subject and any flexibility in timing':'Tell me about the role, project, or how we could work together…'}/></label>
  </div>
  <input className="lead-honeypot" aria-hidden="true" tabIndex={-1} autoComplete="off" value={v.website} onChange={e=>update('website',e.target.value)}/>
  <label className="request-consent"><input type="checkbox" checked={v.consent} required onChange={e=>update('consent',e.target.checked)}/> I consent to sharing these details privately for follow-up.</label>
  <button className="request-submit" type="submit" disabled={busy}>{busy?'Sending…':'Send message'}</button>
  {status&&<p className="request-status" role="status">{status}</p>}
  <p className="request-note">{appointment?'Date and time are preferences only; no appointment is booked until confirmed.':'Your message is shared privately for follow-up. You can also reach me directly by email or LinkedIn.'}</p>
 </form>;
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

 return <div className="case-studies">{publicContentOnly(cases).map((p,i)=><article className="case-study" key={p.title}><span className="eyebrow">0{i+1} / {p.tag}</span><h3>{p.title}</h3><ol className="project-flow" aria-label={p.title+' workflow'}>{p.flow.map(step=><li key={step}>{step}</li>)}</ol><p className="diagram-caption">Illustrative workflow</p><dl><div><dt>Purpose</dt><dd>{p.problem}</dd></div><div><dt>Contribution</dt><dd>{p.contribution}</dd></div><div><dt>Current state</dt><dd>{p.result}</dd></div></dl><a className="hub-link" href={p.link} {...(p.link.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{p.cta} ↗</a>{i===0&&<p className="muted-note">Business records require sign-in. <a href="/erp-preview">See application screenshots</a> before opening the workspace.</p>}</article>)}</div>;
}
function App(){
 const mobilePages=['feed','profile','consultation','workstation'];
 const initialPage=()=>{const route=window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();const page=({contact:'consultation',appointment:'consultation',tickytools:'workstation',resources:'workstation','erp-preview':'workstation'})[route]||route;return mobilePages.includes(page)?page:'profile'};
 const [activePage,setActivePage]=useState(initialPage);
 useEffect(()=>{
  const nav=document.querySelector('header.nav');
  if(!nav)return;
  const measure=()=>document.documentElement.style.setProperty('--portfolio-nav-height',`${nav.getBoundingClientRect().height}px`);
  measure();
  const observer=new ResizeObserver(measure);observer.observe(nav);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{const sync=()=>setActivePage(initialPage());window.addEventListener('popstate',sync);return ()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{document.documentElement.dataset.activePage=activePage;window.scrollTo(0,0)},[activePage]);
 const mobileNavigate=(event,page)=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;if(activePage==='workstation'||page==='workstation')return;event.preventDefault();if(activePage!==page){window.history.pushState({},'',page==='profile'?'/':page==='workstation'?'/tickytools':page==='consultation'?'/contact':'/'+page);setActivePage(page)}setMenu(false)};
 useEffect(()=>{const onHashClick=event=>{const link=event.target.closest?.('a[href^="#"]');if(!link)return;const requestedTarget=link.getAttribute('href');const target=requestedTarget==='#appointment'?'#consultation':requestedTarget;if(!target||target==='#')return;const page=target==='#updates'?'feed':target==='#workstation'?'workstation':target==='#consultation'?'consultation':'profile';if(activePage!==page){event.preventDefault();const destination=(page==='profile'?'/':page==='workstation'?'/tickytools':page==='consultation'?'/contact':'/'+page)+target;if(activePage==='workstation'||page==='workstation'){window.location.assign(destination);return}window.history.pushState({},'',destination);setActivePage(page);requestAnimationFrame(()=>document.querySelector(target)?.scrollIntoView())}};document.addEventListener('click',onHashClick);return ()=>document.removeEventListener('click',onHashClick)},[activePage]);
 const mobileDestinations=[['Profile','profile'],['News Feed','feed'],['TickyTools','workstation'],['Contact','consultation']];
 const [content,setContent]=useState(fallback);
 const profile={...PROFILE,...content.profile};
 const [menu,setMenu]=useState(false);
 useEffect(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.layout='editorial';document.documentElement.dataset.font='inter';document.documentElement.dataset.accent='teal';},[]);
 useEffect(()=>{if(activePage==='workstation')return;const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(data=>{if(data&&Array.isArray(data.sections))setContent(publicContentOnly(data))}).catch(()=>{});return ()=>controller.abort()},[activePage]);
 useEffect(()=>{document.title=activePage==='workstation'?'TickyTools | Private browser tools':activePage==='consultation'?'Contact | Abdul Owahab':(content.name||'Abdul Owahab')+' | Audit & Assurance · Deloitte Bangladesh'},[content.name,activePage]);
 const ids=new Set((content.sections||[]).map(x=>x.id));
 const sortedUpdates=[...(content.posts||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 return <>
 <a className="skip" href="#main">Skip to content</a>
 {menu&&<button type="button" className="nav-drawer-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}<header className="nav"><a className="brand" href="/" onClick={e=>mobileNavigate(e,'profile')} aria-label="Portfolio home"><span className="brand-monogram">{(content.avatarUrl||fallback.avatarUrl)?<img className="brand-avatar" src={content.avatarUrl||fallback.avatarUrl} alt="" loading="eager" />:(content.name||"Abdul Owahab").trim().split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><span className="brand-name">{content.name||"Abdul Owahab"}</span></a><button className="menu-button" type="button" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)} aria-label={menu?"Close navigation":"Open navigation"}><span aria-hidden="true">{menu?"×":"☰"}</span></button><nav id="navigation" className={menu?'nav-links open':'nav-links'} aria-label="Main navigation"><div className="drawer-heading">Navigation <button type="button" aria-label="Close menu" onClick={()=>setMenu(false)}>×</button></div>{mobileDestinations.map(([label,page])=><a key={page} className={'nav-destination'+(activePage===page?' is-active':'')} aria-current={activePage===page?'page':undefined} href={page==='profile'?'/':page==='workstation'?'/tickytools':page==='consultation'?'/contact':'/'+page} onClick={e=>{mobileNavigate(e,page);setMenu(false)}}>{label}</a>)}<a className="nav-admin" href="/admin" onClick={()=>setMenu(false)}>Admin</a></nav></header>
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
 <Section id="updates" eyebrow="01 / FEED" title="News Feed">
  {activePage==='feed'&&<ProfessionalNews/>}
  <div className="hub-intro"><p>Personal posts, photos and professional milestones.</p><span>{sortedUpdates.length} {sortedUpdates.length===1?'update':'updates'}</span></div>
  {sortedUpdates.length>0?<div className="updates updates-social-feed" aria-label="Latest updates, newest first">
   {sortedUpdates.map((p,i)=><UpdateCard key={p.id||i} post={p} featured={i===0} authorName={content.name||'Abdul Owahab'} avatarUrl={content.avatarUrl||''}/>)}
  </div>:<div className="hub-empty">No public updates yet. New posts and photos published from the Admin Panel will appear here.</div>}
 </Section>
 <Section id="consultation" eyebrow="03 / CONTACT" title="Get in touch">
  <div className="hub-intro contact-intro"><p>For recruitment, professional opportunities, or collaboration, feel free to reach out.</p></div>
  <div className="hub-shell contact-shell">
   <div className="hub-detail contact-welcome"><span className="hub-kicker">LET’S CONNECT</span><div className="contact-person"><img src={content.avatarUrl||fallback.avatarUrl} alt="Abdul Owahab"/><div><h3>Abdul Owahab</h3><p>Audit &amp; Assurance · Accounting · Technology</p></div></div><h4>A good conversation can open a new door.</h4><p>Have a role in mind, a project to discuss, or an idea worth exploring? I’d be glad to hear from you.</p><div className="hub-tags"><span>Recruitment</span><span>Collaboration</span><span>Professional enquiries</span></div><div className="contact-direct-links"><a href="mailto:abdulowahab.jnu@gmail.com"><span>Email me</span><strong>abdulowahab.jnu@gmail.com <i className="contact-link-arrow" aria-hidden="true"/></strong></a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer"><span>Connect professionally</span><strong>Find me on LinkedIn <i className="contact-link-arrow" aria-hidden="true"/></strong></a></div><div className="contact-ai-invite"><span className="contact-ai-symbol" aria-hidden="true">✦</span><div><h4>Get to know my work</h4><p>Ask my portfolio assistant about experience, skills and projects.</p></div><button type="button" className="contact-ask-ai" aria-label="Ask AI in full-page conversation" onClick={()=>window.dispatchEvent(new CustomEvent('open-portfolio-ai',{detail:{expanded:true}}))}>✦ Ask AI <i className="contact-link-arrow" aria-hidden="true"/></button><small>বাংলা / English · Opens a full conversation</small></div></div>
   <ContactRequest initialMeeting={window.location.pathname==='/appointment'||window.location.hash==='#appointment'}/>
  </div>
 </Section>
 <Section id="workstation" eyebrow="04 / TOOLS" title="TickyTools">
  {activePage==='workstation'&&<Suspense fallback={<p role="status">Loading TickyTools…</p>}><TickyTools/></Suspense>}
 </Section>
 <Section id="contact" eyebrow="LET'S CONNECT" title="Have something in mind?"><p>I'm interested in conversations about accounting, audit and assurance, reporting, technology and entrepreneurship.</p><div className="contact-links"><a href="mailto:abdulowahab.jnu@gmail.com">Email ↗</a><a href="tel:+8801521577910">Phone ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>{[['Facebook',content.social?.facebook],['Messenger',content.social?.messenger],['Instagram',content.social?.instagram]].filter(([,url])=>/^https:\/\//.test(url||'')).map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a>)}</div></Section>
 </div></main>{activePage!=='workstation'&&<PortfolioAI/>}<nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">{mobileDestinations.map(([label,page])=><a key={page} href={page==='profile'?'/':page==='workstation'?'/tickytools':page==='consultation'?'/contact':'/'+page} className={activePage===page?'is-active':''} aria-current={activePage===page?'page':undefined} onClick={e=>mobileNavigate(e,page)}><span className="bottom-nav-icon" aria-hidden="true">{({feed:'▣',profile:'♙',consultation:'✉',workstation:'▤',appointment:'▦'})[page]}</span><span>{label}</span></a>)}</nav><a className="back-to-top" href="#top" aria-label="Back to top">↑</a><footer className="footer" aria-label="Site footer">
 <div className="footer-main">
  <div className="footer-intro"><a className="footer-identity" href="#top"><span className="footer-mark">{(content.name||'Abdul Owahab').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><span>{content.name||'Abdul Owahab'}</span></a><p>Audit &amp; Assurance professional, Chartered Accountancy student and technology co-founder. Grounded in accounting, assurance, practical innovation and meaningful collaboration.</p><span className="footer-location">Dhaka, Bangladesh</span></div>
  <div className="footer-column"><h3>Explore</h3><a href="#about">About</a><a href="#career">Experience</a><a href="#expertise">Expertise</a><a href="#projects">Projects</a><a href="#education">Education</a><a href="#updates">News Feed</a></div>
  <div className="footer-column"><h3>Projects</h3><a href="https://tickydo.com" target="_blank" rel="noopener noreferrer">Tickydo Ticketing ↗</a><a href="/erp/">Tickydo ERP ↗</a><a href="#projects">Other projects</a><a href="/admin">Admin login</a></div>
  <div className="footer-column"><h3>Connect</h3><a href="mailto:abdulowahab.jnu@gmail.com">Email me ↗</a><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="#consultation">Contact me</a></div>
 </div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} {content.name||'Abdul Owahab'}. All rights reserved.</span>{activePage!=='workstation'?<VisitorTraffic/>:<span>Local file processing · No document uploads</span>}</div>
 </footer></>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
