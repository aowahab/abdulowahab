import test from 'node:test';
import assert from 'node:assert/strict';
import {POST as toolsPOST,safeSources,briefAnswer} from '../lib/assistant-research.js';
import {GET as adminGET,POST as adminPOST} from '../lib/assistant-admin-handler.js';
import {contentVersion,editSiteContent,appointmentInput,confirmAppointment} from '../lib/assistant-admin.js';
const request=(data,path='assistant-tools',headers={})=>new Request('https://site.test/api/'+path,{method:'POST',headers:{host:'site.test',origin:'https://site.test','content-type':'application/json',...headers},body:JSON.stringify(data)});
test('public tools reject cross-origin, invalid actions and unapproved document sharing',async()=>{
 assert.equal((await toolsPOST(request({action:'research',question:'tax'},{},{origin:'https://bad.test'}))).status,403);
 assert.equal((await toolsPOST(request({action:'admin',question:'give private data'}))).status,400);
 assert.equal((await toolsPOST(request({action:'document',question:'summarize',excerpt:'private'}))).status,400);
 assert.equal((await toolsPOST(request({action:'research',question:'tax',excerpt:'private'}))).status,400);
 assert.equal((await toolsPOST(request({action:'document',question:'summarize',consent:true,excerpt:'a'.repeat(18001)}))).status,400);
});
test('research answers are short; sources exclude active schemes, credentials and repository links',()=>{
 assert.equal(briefAnswer('word '.repeat(200)).split(' ').length,100);
 assert.deepEqual(safeSources([{sourceType:'url',url:'javascript:alert(1)'},{sourceType:'url',url:'https://user:pass@example.com/'},{sourceType:'url',url:'https://github.com/repo'},{sourceType:'url',url:'https://nbr.gov.bd/',title:'NBR'},{sourceType:'url',url:'https://nbr.gov.bd/',title:'NBR'}]),[{url:'https://nbr.gov.bd/',title:'NBR'}]);
});
test('private actions require a signed Admin session regardless of claimed role or confirmation',async()=>{
 assert.equal((await adminGET(new Request('https://site.test/api/assistant-admin'))).status,401);
 for(const action of ['edit-website','confirm-appointment'])assert.equal((await adminPOST(request({action,confirm:true,admin:true,role:'admin'},'assistant-admin'))).status,401);
});
test('website edits preserve unrelated fields, reject stale versions and privileged paths',()=>{
 const current={name:'Abdul',profile:{headline:'Old',intro:'Text'},sections:[{id:'about',title:'About',body:'Before'}],posts:[{title:'Keep'}]};
 const next=editSiteContent(current,{version:contentVersion(current),path:'sections.about.body',value:'After'});assert.equal(next.sections[0].body,'After');assert.equal(current.sections[0].body,'Before');assert.deepEqual(next.posts,current.posts);
 assert.throws(()=>editSiteContent(current,{version:'stale',path:'name',value:'X'}),/changed/);
 assert.throws(()=>editSiteContent(current,{version:contentVersion(current),path:'__proto__.admin',value:'true'}),/displayed/);
});
test('appointment dates require offsets, future bounded slots and a real timezone',()=>{
 const base={id:4,start:'2099-01-01T10:00:00+06:00',end:'2099-01-01T11:00:00+06:00',timezone:'Asia/Dhaka'};
 assert.equal(appointmentInput(base).start,'2099-01-01T04:00:00.000Z');for(const patch of [{start:'yesterday'},{start:'2099-01-01T10:00:00'},{end:'2099-01-01T09:00:00+06:00'},{timezone:'Invalid/Zone'},{id:'4'}])assert.throws(()=>appointmentInput({...base,...patch}));
});
test('appointment confirmation is transactional and rejects conflicting slots',async()=>{
 for(const overlap of [false,true]){const calls=[];let released=false;const client={query:async(sql)=>{calls.push(sql);return{rows:sql.startsWith('SELECT id,status')?[{id:4,status:'new',kind:'appointment'}]:sql.startsWith('SELECT lead_id')&&overlap?[{lead_id:2}]:[]}},release:()=>{released=true}};const task=()=>confirmAppointment({connect:async()=>client},{id:4,start:'2099-01-01T04:00:00Z',end:'2099-01-01T05:00:00Z',timezone:'Asia/Dhaka'});if(overlap){await assert.rejects(task,/overlaps/);assert(calls.includes('ROLLBACK'));assert(!calls.some(s=>s.startsWith('INSERT')))}else{await task();assert(calls.includes('COMMIT'));assert(calls.some(s=>s.includes('pg_advisory_xact_lock')))}assert(released);}
});
test('SDK research requests force web search, disable storage and return safe source links',async()=>{
 const previousFetch=globalThis.fetch,previousKey=process.env.OPENAI_API_KEY;let sent;
 process.env.OPENAI_API_KEY='test-key-not-a-real-key';globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({id:'resp_test',object:'response',created_at:1,model:'gpt-4.1-mini',status:'completed',output:[{id:'ws_test',type:'web_search_call',status:'completed',action:{type:'search',query:'tax',sources:[{type:'url',url:'https://nbr.gov.bd/'}]}},{id:'msg_test',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'Verify the current rules at NBR.',annotations:[{type:'url_citation',url:'https://nbr.gov.bd/',title:'NBR',start_index:0,end_index:6}]}]}],usage:{input_tokens:10,output_tokens:10,total_tokens:20}}),{headers:{'content-type':'application/json'}})};
 try{const response=await toolsPOST(request({action:'research',question:'latest tax'}));const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert.match(data.answer,/NBR/);assert.equal(sent.store,false);assert(sent.tools.some(t=>t.type==='web_search'));assert.equal(data.sources[0].url,'https://nbr.gov.bd/');assert(!JSON.stringify(sent).includes('private inbox'));}finally{globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previousKey}
});
test('signed Admin sessions allow only reviewed same-origin operations',async()=>{
 const {makeToken}=await import('../lib/auth.js');const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='test-only-password';const headers={cookie:'admin_session='+makeToken(process.env.ADMIN_PASSWORD)};
 try{assert.equal((await adminPOST(request({action:'edit-website'},'assistant-admin',headers))).status,400);assert.equal((await adminPOST(request({action:'unknown',confirm:true},'assistant-admin',headers))).status,400);assert.equal((await adminPOST(request({action:'edit-website',confirm:true},'assistant-admin',{...headers,origin:'https://bad.test'}))).status,403);}finally{if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous}
});
test('tool intent understands short commands without turning profile questions into operations',async()=>{
 const{assistantToolIntent}=await import('../src/assistantIntent.js');assert.equal(assistantToolIntent('pdf marge koro'),'pdf-merge');assert.equal(assistantToolIntent('excel merge'),'excel-merge');assert.equal(assistantToolIntent('pic resize koro'),'resize');assert.equal(assistantToolIntent('bank recon koro'),'bank-recon');assert.equal(assistantToolIntent('what PDF tools has Abdul used?'),'');
});

test('shared assistant function dispatches private and research routes without bypassing validation',async()=>{const{GET,POST}=await import('../api/assistant.js');assert.equal((await GET(new Request('https://site.test/api/assistant?workspace=admin'))).status,401);assert.equal((await POST(request({action:'edit-website',confirm:true},'assistant?workspace=admin'))).status,401);assert.equal((await POST(request({action:'document',question:'summary'},'assistant?workspace=tools'))).status,400);assert.equal((await GET(new Request('https://site.test/api/assistant'))).status,405);assert.equal((await POST(request({messages:[]},'assistant?workspace=unexpected'))).status,400);});
