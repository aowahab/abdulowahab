// Conversation memory is bounded to this browser chat. Never forward private Admin answers.
export function publicConversation(messages){
 const eligible=messages.filter(m=>m&&!m.privateDocument&&['user','assistant'].includes(m.role)&&typeof m.content==='string');const result=[];let bytes=0;
 for(const m of eligible.slice(-32).reverse()){const item={role:m.role,content:m.content.slice(0,1500)},size=new TextEncoder().encode(JSON.stringify(item)).length;if(bytes+size>48000)break;result.unshift(item);bytes+=size;}
 return result;
}
export function resolvedConversationQuestion(messages){
 const users=messages.filter(m=>m.role==='user'),question=users.at(-1)?.content?.trim()||'';
 // A clearly stated new topic overrides the previous topic, even in a short message.
 const topic=/\b(?:education|degree|university|icab|recruit\w*|hiring|interview|career|audit|experience|skills|tickydo|erp|projects?|contact|linkedin|facebook|family|married|personal|fees?|tax|vat)\b|পড়াশোনা|পড়াশোনা|শিক্ষা|অভিজ্ঞতা|নিয়োগ|নিয়োগ|প্রকল্প|পরিবার|যোগাযোগ/i;
 const lastAssistant=[...messages.slice(0,-1)].reverse().find(m=>m.role==='assistant')?.content||'';
 const roleAnswer=/(?:role|position|পদ).*[?？]/i.test(lastAssistant)&&/auditor|associate|manager|accountant|developer|engineer|analyst|director/i.test(question)&&question.length<100&&!/[?？]/.test(question);
 if(topic.test(question)&&!roleAnswer)return question;
 const followup=/^(?:more|details|elaborate|explain|why|how|and|what about|that|it|those|his|he|yes|no|ok|okay|sure|আরও|আরো|আর কি|বিস্তারিত|কেন|কিভাবে|কীভাবে|এটা|ওটা|তার|তিনি|হ্যাঁ|জি|না|আচ্ছা|aro|ar ki|r ki|r |eta|etar|oita|seta|tar|uni|ha|ji|hmm|bolo|bolen|tarpor|then)(?:\s|[?!.,।]|$)/i;
 const answeringQuestion=question.length<80&&/[?？]\s*$/.test(lastAssistant)&&!/[?？]/.test(question)&&!/^(?:what|who|when|where|why|how|can|could|tell|কেন|কী|কি |কখন|কোথায়)/i.test(question);
 if(!followup.test(question)&&!answeringQuestion)return question;
 const recruiter=[...users.slice(0,-1)].reverse().find(m=>/recruit|hiring|নিয়োগ|নিয়োগ/i.test(m.content));
 if(recruiter&&answeringQuestion&&/role|position|organization|company|responsibilities|interview|পদ|প্রতিষ্ঠান|দায়িত্ব/i.test(lastAssistant))return recruiter.content+'\nFollow-up: '+question;
 const anchor=[...users.slice(0,-1)].reverse().find(m=>topic.test(m.content));return anchor?anchor.content+'\nFollow-up: '+question:question;
}
