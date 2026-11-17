import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('footer replaces old copy and back-to-top link with counters',()=>{
 assert.doesNotMatch(main,/Designed for clarity · Built with React/);
 assert.doesNotMatch(main,/<a href="#top">Back to top/);
 assert.match(main,/<VisitorTraffic\/>/);
 assert.match(main,/Visitor sessions/);
 assert.match(main,/Online now/);
});
test('traffic API requires session token and never invents metrics',async()=>{
 const old=process.env.POSTGRES_URL,old2=process.env.DATABASE_URL;
 delete process.env.POSTGRES_URL;delete process.env.DATABASE_URL;
 try{
  const {GET,POST}=await import('../api/traffic.js');
  const result=await GET();assert.equal(result.status,503);
  assert.equal((await result.json()).available,false);
  const bad=await POST(new Request('http://localhost/api/traffic',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visitorId:'bad'})}));
  assert.equal(bad.status,400);
 }finally{if(old!==undefined)process.env.POSTGRES_URL=old;if(old2!==undefined)process.env.DATABASE_URL=old2}
});
test('responsive footer styling exists',()=>assert.match(css,/\.footer-traffic\{display:flex/));

test('traffic endpoint rejects malformed sessions and oversized payloads before database access',async()=>{
 const {POST}=await import('../api/traffic.js');
 const invalid=await POST(new Request('http://localhost/api/traffic',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visitorId:'bad'})}));
 assert.equal(invalid.status,400);
 const oversized=await POST(new Request('http://localhost/api/traffic',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visitorId:'x'.repeat(600)})}));
 assert.equal(oversized.status,413);
});

test('traffic endpoint rejects third-party origins and accepts same-origin validation',async()=>{
 const {POST}=await import('../api/traffic.js');
 const token='a'.repeat(24);
 const cross=await POST(new Request('https://aowahab.vercel.app/api/traffic',{method:'POST',headers:{origin:'https://untrusted.example','content-type':'application/json'},body:JSON.stringify({visitorId:token})}));
 assert.equal(cross.status,403);
 assert.equal((await cross.json()).error,'Cross-origin request denied');
 const malformed=await POST(new Request('https://aowahab.vercel.app/api/traffic',{method:'POST',headers:{origin:'not-a-url','content-type':'application/json'},body:JSON.stringify({visitorId:token})}));
 assert.equal(malformed.status,403);
 const same=await POST(new Request('https://aowahab.vercel.app/api/traffic',{method:'POST',headers:{origin:'https://aowahab.vercel.app','content-type':'application/json'},body:JSON.stringify({visitorId:'invalid'})}));
 assert.equal(same.status,400);
});
