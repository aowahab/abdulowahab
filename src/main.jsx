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
function App(){
 const [content,setContent]=useState(fallback);
 const [menu,setMenu]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(data=>{if(data&&Array.isArray(data.sections))setContent(data)}).catch(()=>{});return ()=>controller.abort()},[]);
 useEffect(()=>{document.title=(content.name||'Abdul Owahab')+' | Audit & Assurance · Deloitte Bangladesh'},[content.name]);
 const ids=new Set((content.sections||[]).map(x=>x.id));
 return <>
 <a className="skip" href="#main">Skip to content</a>
 <header className="nav"><a className="brand" href="#top" aria-label="Abdul Owahab home">AO<span>.</span></a><button className="menu-button" type="button" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)}>{menu?'Close':'Menu'} <span aria-hidden="true">{menu?'×':'☰'}</span></button><nav id="navigation" className={menu?'nav-links open':'nav-links'} aria-label="Main navigation">{[['About','#about'],['Experience','#experience'],['Projects','#projects'],['Education','#education'],['Contact','#contact']].map(([label,href])=><a key={href} href={href} onClick={()=>setMenu(false)}>{label}</a>)}</nav></header>
 <main id="main">
 <section className="hero" id="top"><div className="hero-inner"><div className="hero-copy"><p className="overline"><span className="status-dot"/> AUDIT · FINANCE · TECHNOLOGY</p><h1>{content.name||'Abdul Owahab'}<span className="hero-period">.</span></h1><p className="hero-subtitle">Senior Associate, Audit & Assurance at Deloitte Bangladesh. Chartered Accountancy student and technology co-founder.</p><div className="hero-actions"><a className="button primary" href="#experience">Explore my work <span aria-hidden="true">↗</span></a><a className="button secondary" href="#contact">Get in touch</a></div></div><div className="hero-aside"><span className="aside-label">AT A GLANCE</span>{(content.facts||[]).map((f,i)=><div className="fact" key={i}><span>{f.label}</span><strong>{f.value}</strong></div>)}</div></div><div className="hero-bottom"><span>BASED IN DHAKA, BANGLADESH</span><span>SCROLL TO EXPLORE ↓</span></div></section>
 <div className="content-wrap">
 {(content.sections||[]).map((s,i)=><Section key={s.id||i} id={s.id||'section-'+i} eyebrow={String(i+1).padStart(2,'0')} title={s.title}><RichText body={s.body||''}/></Section>)}
 {!ids.has('experience')&&<Section id="experience" eyebrow="EXPERTISE" title="Professional experience"><p>Working across statutory and group audit engagements at Deloitte Bangladesh, with exposure to a range of sectors and financial statement areas.</p><dl className="detail-list">{experience.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Section>}
 {!ids.has('projects')&&<Section id="projects" eyebrow="SELECTED WORK" title="Projects & ventures"><div className="project-grid">{projects.map((p,i)=><article className="project-card" key={p.title}><span className="project-number">0{i+1} / {p.tag}</span><h3>{p.title}</h3><p>{p.body}</p>{p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer">{p.cta} ↗</a>}</article>)}</div></Section>}
 {!ids.has('education')&&<Section id="education" eyebrow="BACKGROUND" title="Education & development"><p>BBA in Accounting & Information Systems from Jagannath University, Dhaka. Pursuing Chartered Accountancy at ICAB Professional Level.</p></Section>}
 {(content.posts||[]).length>0&&<Section id="updates" eyebrow="LATEST" title="Updates"><div className="updates">{content.posts.map((p,i)=><article className="update" key={p.id||i}><time dateTime={p.date}>{p.date?new Date(p.date).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'}):''}</time><h3>{p.title}</h3><RichText body={p.body||''}/>{(p.media||[]).length>0&&<div className="media">{p.media.map((m,j)=>m.type?.startsWith('image/')?<img key={j} loading="lazy" src={m.url} alt={m.name||p.title}/>:m.type?.startsWith('video/')?<video key={j} controls preload="metadata" src={m.url}/>:<a key={j} href={m.url} target="_blank" rel="noopener noreferrer">{m.name||'View attachment'}</a>)}</div>}</article>)}</div></Section>}
 <Section id="contact" eyebrow="LET'S CONNECT" title="Have something in mind?"><p>I'm interested in conversations about audit, financial reporting, technology and entrepreneurship.</p><div className="contact-links"><a href="https://www.linkedin.com/in/abdulowahab/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://github.com/aowahab" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></Section>
 </div></main><footer className="footer"><span>© {new Date().getFullYear()} Abdul Owahab</span><span>Built with React · Dhaka, Bangladesh</span><a href="/admin">Admin</a></footer></>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
