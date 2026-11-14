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
  assert.equal(bad.status,503);
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
