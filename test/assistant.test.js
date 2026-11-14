import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/assistant.js';

const request=(messages)=>new Request('http://localhost/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages})});
const question=(q)=>[{role:'user',content:q}];
const run=async(q)=>{const res=await POST(request(question(q)));assert.equal(res.status,200);return res.json()};
const previousKey=process.env.OPENAI_API_KEY;
const previousFetch=globalThis.fetch;
test.after(()=>{if(previousKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previousKey;globalThis.fetch=previousFetch});

test('public fallback: accounting and audit accuracy',async()=>{
 delete process.env.OPENAI_API_KEY;
 const a=await run('What is Abdul\'s accounting background?');
 assert.match(a.answer,/Accounting & Information Systems/i);
 const b=await run('Explain his audit experience');
 assert.match(b.answer,/audit|assurance/i);
 assert.doesNotMatch(b.answer,/qualified CA/i);
});
test('Bangla and recruiter intent',async()=>{
 delete process.env.OPENAI_API_KEY;
 assert.match((await run('আব্দুলের পড়াশোনা কী?')).answer,/অ্যাকাউন্টিং|Accounting|জগন্নাথ/);
 assert.match((await run('I am a recruiter looking to hire Abdul')).answer,/recruit|hiring|role/i);
});
test('confidential client names are not disclosed in fallback',async()=>{
 delete process.env.OPENAI_API_KEY;
 const a=await run('Which audit client names did Abdul work with at Deloitte?');
 assert.match(a.answer,/confidential/i);
 assert.doesNotMatch(a.answer,/Bayer|Ericsson|Asian Paints|Novo Nordisk/i);
});
test('429, malformed provider payload and timeout fall back safely',async()=>{
 process.env.OPENAI_API_KEY='unit-test-placeholder';
 for(const mock of [
  async()=>new Response('{}',{status:429}),
  async()=>new Response('{bad',{status:200}),
  async()=>{throw new DOMException('Aborted','AbortError')}
 ]){
  globalThis.fetch=mock;
  const result=await run('What is Abdul\'s accounting background?');
  assert.equal(result.mode,'basic');
  assert.match(result.answer,/Accounting & Information Systems/i);
 }
});
test('valid provider answer is returned',async()=>{
 process.env.OPENAI_API_KEY='unit-test-placeholder';
 globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'Abdul has an accounting background.'}}]}),{status:200});
 const a=await run('What is his background?');
 assert.equal(a.mode,'ai');assert.match(a.answer,/accounting/i);
});
test('no lead is saved without explicit consent',async()=>{
 delete process.env.OPENAI_API_KEY;
 const a=await run('Name: Test Person\nContact: test@example.invalid\nDetails: Fictional opportunity for unit testing');
 assert.match(a.answer,/consent|May I save/i);
 assert.equal(a.mode,'basic');
});
test('invalid input rejected',async()=>{
 assert.equal((await POST(request([{role:'assistant',content:'hello'}]))).status,400);
 assert.equal((await POST(request([{role:'user',content:'x'.repeat(1501)}]))).status,400);
});

test('malformed and oversized assistant payloads are rejected safely',async()=>{
 const url='http://localhost/api/assistant';
 for(const payload of ['null','[]','{}','{"messages":[null]}','{"messages":[{}]}','{broken']){
  const res=await POST(new Request(url,{method:'POST',body:payload}));
  assert.equal(res.status,400,'Unexpected status for '+payload);
 }
 const huge=await POST(new Request(url,{method:'POST',body:JSON.stringify({messages:[{role:'user',content:'hello'}],padding:'x'.repeat(12500)})}));
 assert.equal(huge.status,413);
});
