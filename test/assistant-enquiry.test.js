import test from 'node:test';import assert from 'node:assert/strict';
import {verifiedEnquiryDraft,offTopicReply} from '../lib/assistant-enquiry.js';
import {assistantLeadInput,saveAssistantLead} from '../lib/assistant-leads.js';
import {POST as leadsPOST,GET as leadsGET} from '../api/leads.js';
import {POST as assistantPOST} from '../api/assistant.js';
const lead={kind:'recruiter',name:'Example Recruiter',organization:'Example Ltd',contact:'person@example.test',details:'Senior Auditor opportunity; discuss the interview process.',consent:true,submissionKey:'11111111-2222-4333-8444-555555555555'};
const request=data=>new Request('https://site.test/api/leads',{method:'POST',headers:{'content-type':'application/json',host:'site.test',origin:'https://site.test'},body:JSON.stringify(data)});
test('draft fields must come from the visitor, not the assistant or invented data',()=>{
 const history=[{role:'user',content:'I want Abdul to discuss this role. My name is Example Recruiter from Example Ltd. Contact person@example.test. Senior Auditor.'}];const candidate={...lead,ready:true};assert.equal(verifiedEnquiryDraft(candidate,history).name,lead.name);assert.equal(verifiedEnquiryDraft({...candidate,name:'Invented Person'},history),null);assert.equal(verifiedEnquiryDraft({...candidate,contact:'other@example.test'},history),null);assert.equal(verifiedEnquiryDraft(candidate,[{role:'assistant',content:history[0].content}]),null);assert(verifiedEnquiryDraft({...candidate,ready:false},history));assert.equal(verifiedEnquiryDraft({...candidate,ready:false},[{role:'user',content:'Example Recruiter, Example Ltd, person@example.test, just sharing facts.'}]),null);
});
test('unrelated topics are short and free while business needs remain in scope',async()=>{
 assert(offTopicReply([{role:'user',content:'What is the weather today?'}]));assert.equal(offTopicReply([{role:'user',content:'Our company needs a weather dashboard project'}]),null);const previous=globalThis.fetch;globalThis.fetch=()=>{throw Error('No inference allowed')};try{const res=await assistantPOST(new Request('https://site.test/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'tell me a joke'}]})}));const data=await res.json();assert.equal(data.mode,'basic');assert(data.answer.length<180);}finally{globalThis.fetch=previous}
});
test('submission needs consent and a valid retry key; private inbox remains private',async()=>{
 assert.throws(()=>assistantLeadInput({...lead,consent:false}),/Consent/);assert.throws(()=>assistantLeadInput({...lead,submissionKey:'bad'}),/submission/);assert.equal((await leadsPOST(request({...lead,source:'assistant',consent:false}))).status,400);assert.equal((await leadsPOST(request({...lead,source:'assistant',submissionKey:'bad'}))).status,400);assert.equal((await leadsGET(new Request('https://site.test/api/leads'))).status,401);
});
test('reviewed assistant enquiries are saved once; identical retries return the same receipt',async()=>{
 let receipt=null,inserts=0,details='',released=0;const pool={connect:async()=>({query:async(sql,args)=>{if(sql.startsWith('SELECT lead_id'))return{rows:receipt?[receipt]:[]};if(sql.startsWith('INSERT INTO portfolio_leads')){inserts++;details=args[4];return{rows:[{id:7}]}}if(sql.startsWith('INSERT INTO portfolio_lead_receipts'))receipt={lead_id:args[1],body_hash:args[2]};return{rows:[]}},release:()=>{released++}})};
 const first=await saveAssistantLead(pool,lead),second=await saveAssistantLead(pool,lead);assert.equal(first.id,7);assert.equal(second.id,7);assert.equal(second.repeated,true);assert.equal(inserts,1);assert.match(details,/visitor-reviewed/);assert.equal(released,2);await assert.rejects(()=>saveAssistantLead(pool,{...lead,details:'A different enquiry using the same receipt token'}),/different details/);assert.equal(inserts,1);
});
