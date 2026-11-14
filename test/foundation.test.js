import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const assistant=readFileSync(new URL('../api/assistant.js',import.meta.url),'utf8');
const routes=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));

test('all five portfolio routes preserve SPA rewrites',()=>{
 for(const path of ['/feed','/profile','/consultation','/workstation','/appointment'])
  assert.ok(routes.rewrites.some(r=>r.source===path&&r.destination==='/'),path);
});
test('mobile navigation has five distinct destinations and accessible current state',()=>{
 assert.match(main,/mobilePages=\['feed','profile','consultation','workstation','appointment'\]/);
 assert.match(main,/aria-label="Mobile quick navigation"/);
 assert.match(main,/aria-current=\{activePage===page\?'page':undefined\}/);
});
test('footer, workstation and AI remain mounted',()=>{
 assert.match(main,/<footer className="footer"/);
 assert.match(main,/<PortfolioAI\/>/);
 assert.match(main,/<Section id="workstation"/);
 assert.match(main,/href="\/erp\/"/);
});
test('mobile screenshot-approved navigation overrides remain present',()=>{
 assert.match(css,/Screenshot-matched mobile bottom navigation/);
 assert.match(css,/\.mobile-bottom-nav a\.is-active/);
});
test('AI retains safe provider fallback and bounded input',()=>{
 assert.match(assistant,/publicKnowledgeFallback/);
 assert.match(assistant,/Request too large/);
 assert.match(assistant,/Invalid messages/);
 assert.match(assistant,/AbortController/);
});

test('feed photos preserve full images on mobile without cropping',()=>{
 assert.match(css,/#updates \.update \.media img,[\s\S]*?object-fit:contain/);
 assert.match(css,/@media\(max-width:580px\)[\s\S]*?#updates \.update \.media img\{[\s\S]*?aspect-ratio:auto/);
});

test('social feed renders all posts chronologically without truncation',()=>{
 assert.match(main,/sortedUpdates\.map\(\(p,i\)=>\s*<UpdateCard/);
 assert.match(main,/sort\(\(a,b\)=>\(b\.date\|\|''\)\.localeCompare\(a\.date\|\|''\)\)/);
 assert.match(main,/media\.map\(\(m,j\)=>/);
 assert.match(main,/updates-social-feed/);
 assert.match(css,/#updates \.updates-social-feed\{display:flex;flex-direction:column/);
 assert.match(css,/feed-post-media img,[\s\S]*?object-fit:contain/);
});

test('feed images have compact previews and full-size links',()=>{
 assert.match(main,/className="feed-photo-link"/);
 assert.match(main,/Open full photo:/);
 assert.match(main,/feed-media-count-/);
 assert.match(css,/feed-media-count-2/);
 assert.match(css,/feed-media-count-3/);
 assert.match(css,/feed-photo-link img\{[\s\S]*?object-fit:contain/);
});

test('traffic API rejects malformed and oversized sessions before database access',async()=>{
 const {POST}=await import('../api/traffic.js');
 const malformed=await POST(new Request('https://example.com/api/traffic',{method:'POST',body:'{bad'}));
 assert.equal(malformed.status,400);
 const invalid=await POST(new Request('https://example.com/api/traffic',{method:'POST',body:JSON.stringify({visitorId:'short'})}));
 assert.equal(invalid.status,400);
 const oversized=await POST(new Request('https://example.com/api/traffic',{method:'POST',body:'x'.repeat(513)}));
 assert.equal(oversized.status,413);
});
test('admin login blocks cross-origin requests',async()=>{
 const {POST}=await import('../api/login.js');
 const response=await POST(new Request('https://example.com/api/login',{method:'POST',headers:{origin:'https://attacker.example'},body:JSON.stringify({password:'guess'})}));
 assert.equal(response.status,403);
});
test('enquiry API requires explicit consent before notification',async()=>{
 const {POST}=await import('../api/lead.js');
 const response=await POST(new Request('https://example.com/api/lead',{method:'POST',body:JSON.stringify({type:'recruiter',name:'Test Person',contact:'test@example.com',details:'A legitimate recruiting enquiry'})}));
 assert.equal(response.status,400);
 assert.match((await response.json()).error,/Consent/);
});

test('enquiry rejects null JSON and oversized body without crashing',async()=>{
 const {POST}=await import('../api/lead.js');
 const base='https://example.com/api/lead';
 const nullBody=await POST(new Request(base,{method:'POST',body:'null'}));
 assert.equal(nullBody.status,400);
 const arrayBody=await POST(new Request(base,{method:'POST',body:'[]'}));
 assert.equal(arrayBody.status,400);
 const oversized=await POST(new Request(base,{method:'POST',body:JSON.stringify({details:'x'.repeat(4100)})}));
 assert.equal(oversized.status,413);
});
test('enquiry does not claim WhatsApp delivery when credentials are missing',async()=>{
 const {POST}=await import('../api/lead.js');
 const priorToken=process.env.WHATSAPP_ACCESS_TOKEN,priorPhone=process.env.WHATSAPP_PHONE_NUMBER_ID;
 try{
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  const response=await POST(new Request('https://example.com/api/lead',{method:'POST',body:JSON.stringify({consent:true,type:'recruiter',name:'Test Recruiter',contact:'test@example.com',details:'Discussing a legitimate accounting role'})}));
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/not configured/i);
 }finally{
  if(priorToken===undefined)delete process.env.WHATSAPP_ACCESS_TOKEN;else process.env.WHATSAPP_ACCESS_TOKEN=priorToken;
  if(priorPhone===undefined)delete process.env.WHATSAPP_PHONE_NUMBER_ID;else process.env.WHATSAPP_PHONE_NUMBER_ID=priorPhone;
 }
});

test('admin login rejects malformed, non-object and oversized requests before authentication',async()=>{
 const {POST}=await import('../api/login.js');
 const url='https://example.com/api/login';
 for(const payload of ['null','[]','{broken']){
  const res=await POST(new Request(url,{method:'POST',body:payload}));
  assert.equal(res.status,400);
 }
 const oversized=await POST(new Request(url,{method:'POST',body:JSON.stringify({password:'x'.repeat(1200)})}));
 assert.equal(oversized.status,413);
});
test('visitor counter does not fabricate analytics when database is unconfigured',async()=>{
 const {GET}=await import('../api/traffic.js');
 const beforePostgres=process.env.POSTGRES_URL,beforeDatabase=process.env.DATABASE_URL;
 try{
  delete process.env.POSTGRES_URL;delete process.env.DATABASE_URL;
  const res=await GET();
  assert.equal(res.status,503);
  assert.equal((await res.json()).available,false);
 }finally{
  if(beforePostgres===undefined)delete process.env.POSTGRES_URL;else process.env.POSTGRES_URL=beforePostgres;
  if(beforeDatabase===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=beforeDatabase;
 }
});
