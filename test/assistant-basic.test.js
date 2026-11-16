import test from 'node:test';import assert from 'node:assert/strict';
import {basicConversationReply} from '../lib/assistant-basic.js';import {POST} from '../api/assistant.js';
const u=content=>({role:'user',content}),a=content=>({role:'assistant',content});
test('the screenshot questions get distinct direct answers in sequence',()=>{
 const greeting=basicConversationReply([u('hi')]);assert.match(greeting,/Hi/);assert(greeting.length<60);
 const identity=basicConversationReply([u('hi'),a(greeting),u('tmi k?')]);assert.match(identity,/AI assistant/);assert.doesNotMatch(identity,/Senior Associate/);
 const work=basicConversationReply([u('hi'),a(greeting),u('ki kore owahab')]);assert.match(work,/Deloitte Bangladesh/);assert.notEqual(identity,work);assert.doesNotMatch(work,/কোন বিষয়/);
});
test('Banglish, Bengali and English variants keep assistant and owner identities separate',()=>{
 for(const q of ['tumi ke?','apni ke','তুমি কে','who are you?'])assert.match(basicConversationReply([u(q)]),/AI assistant/);
 for(const q of ['owahab ki kore?','ki kaj kore owahab','ওয়াহাব কী কাজ করেন?','what does Abdul do?'])assert.match(basicConversationReply([u(q)]),/Senior Associate/);
 assert.match(basicConversationReply([u('owahab porashona ki')]),/ICAB/);
 assert.equal(basicConversationReply([u('hi\nName: Person\nContact: example@example.test\nDetails: Request')]),null);
});
test('short follow-ups add relevant details rather than repeat the same introduction',()=>{
 const history=[u('ki kore owahab'),a(basicConversationReply([u('ki kore owahab')]))];const more=basicConversationReply([...history,u('r ki')]);assert.match(more,/revenue/i);assert.doesNotMatch(more,/Senior Associate/);assert.match(basicConversationReply([...history,a(more),u('aro bolo')]),/ICAB/);
 assert.match(basicConversationReply([u('owahab salary koto')]),/জানি না/);
 assert.match(basicConversationReply([u('owahab kothay thake')]),/ঢাকায়/);
});
test('common greetings and identity questions work without calling a paid provider',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=()=>{throw Error('No external calls permitted')};try{for(const q of ['hi','tmi k?','ki kore owahab']){const r=await POST(new Request('https://site.test/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:[u(q)]})}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.mode,'basic');assert(data.answer.length<240);}}finally{globalThis.fetch=previous}
});
