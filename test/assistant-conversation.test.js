import test from 'node:test';import assert from 'node:assert/strict';
import {publicConversation,resolvedConversationQuestion} from '../shared/assistant-conversation.js';
import {POST} from '../api/assistant.js';
const u=content=>({role:'user',content}),a=content=>({role:'assistant',content});
const request=messages=>new Request('https://site.test/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages})});
test('short follow-ups use the latest topic and topic changes override old subjects',()=>{
 const history=[u('His education'),a('ICAB studies.'),u('Tell me about Tickydo'),a('Ticketing project.'),u('r ki')];assert.match(resolvedConversationQuestion(history),/Tickydo/);assert.doesNotMatch(resolvedConversationQuestion(history),/education/);
 assert.equal(resolvedConversationQuestion([...history,u('education')]),'education');assert.equal(resolvedConversationQuestion([u('family'),a('Unknown'),u('audit experience')]),'audit experience');
 assert.match(resolvedConversationQuestion([u('I am a recruiter'),a('Which role?'),u('Senior auditor')]),/recruiter/);assert.match(resolvedConversationQuestion([u('I am a recruiter'),a('Which role?'),u('Senior Audit Associate')]),/recruiter/);
});
test('conversation memory retains more than six turns, excludes private results and stays bounded',()=>{
 const messages=Array.from({length:40},(_,i)=>i%2?u('message '+i):a('reply '+i));messages.splice(20,0,{...a('PRIVATE_ADMIN_RESULT'),privateDocument:true});const sent=publicConversation(messages);assert.equal(sent.length,32);assert(!JSON.stringify(sent).includes('PRIVATE_ADMIN_RESULT'));assert.equal(sent.at(-1).content,'message 39');assert(!JSON.stringify(sent).includes('privateDocument'));
 const large=publicConversation(Array.from({length:32},()=>u('আ'.repeat(1500))));assert(new TextEncoder().encode(JSON.stringify(large)).length<64000);assert(large.length>0);
});
test('fallback advances recruiter follow-up without asking for the supplied role again',async()=>{
 const previous=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;try{let res=await POST(request([u('I am a recruiter'),a('Which role?'),u('Senior auditor')]));let data=await res.json();assert.match(data.answer,/organization/i);res=await POST(request([u('I am a recruiter'),u('Role: Senior Auditor'),u('Organization: Example Company'),u('r ki')]));data=await res.json();assert.match(data.answer,/responsibilities|দায়িত্ব/i);}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous}
});
test('provider receives extended dialogue and explicit natural continuation instructions',async()=>{
 const previous=process.env.OPENAI_API_KEY,previousFetch=globalThis.fetch;process.env.OPENAI_API_KEY='test-only-placeholder';let payload;globalThis.fetch=async(url,options)=>{if(String(url).includes('chat/completions')){payload=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:'Which interview step would you prefer?'}}]}),{headers:{'content-type':'application/json'}})}throw Error('No storage access in this test')};
 try{const history=[u('I am a recruiter')];for(let i=0;i<7;i++)history.push(a('Discussion '+i),u('Detail '+i));history.push(a('Which interview step?'),u('same role, next week'));const response=await POST(request(history));assert.equal(response.status,200);assert(payload.messages.length>13);assert.match(payload.messages[0].content,/CONTINUE THE CONVERSATION/);assert.equal(payload.messages.at(-1).content,'same role, next week');assert(payload.messages.some(m=>m.content==='I am a recruiter'));}finally{globalThis.fetch=previousFetch;if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous}
});

test('rate-limited primary chat falls back to the verified alternate model with the same public dialogue',async()=>{
 const previous=process.env.OPENAI_API_KEY,previousFetch=globalThis.fetch;process.env.OPENAI_API_KEY='test-only-placeholder';let alternatePayload;
 globalThis.fetch=async(url,options)=>{if(String(url).includes('chat/completions'))return new Response('{}',{status:429});if(String(url).includes('/responses')){alternatePayload=JSON.parse(options.body);return new Response(JSON.stringify({id:'resp_fallback',object:'response',created_at:1,model:'gpt-4.1-mini',status:'completed',output:[{id:'msg_fallback',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'You mentioned Senior Audit Associate. What would the next interview step be?',annotations:[]}]}],usage:{input_tokens:10,output_tokens:15,total_tokens:25}}),{headers:{'content-type':'application/json'}})}throw Error('No other network allowed')};
 try{const result=await POST(request([u('We are discussing Senior Audit Associate.'),a('Understood.'),u('Which role?')]));const data=await result.json();assert.equal(result.status,200);assert.equal(data.mode,'ai');assert.equal(data.providerFallback,true);assert.match(data.answer,/Senior Audit Associate/);assert.equal(alternatePayload.store,false);assert(JSON.stringify(alternatePayload.input).includes('Which role?'));}finally{globalThis.fetch=previousFetch;if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous}
});
