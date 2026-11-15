export const enquiryResponseSchema={type:'object',additionalProperties:false,required:['answer','enquiry'],properties:{answer:{type:'string'},enquiry:{type:'object',additionalProperties:false,required:['kind','name','organization','contact','details','ready'],properties:{kind:{type:'string',enum:['none','recruiter','client','collaboration','appointment']},name:{type:'string'},organization:{type:'string'},contact:{type:'string'},details:{type:'string'},ready:{type:'boolean'}}}}};
const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function verifiedEnquiryDraft(candidate,messages){
 if(!candidate?.ready||!['recruiter','client','collaboration','appointment'].includes(candidate.kind))return null;
 const given=normalize(messages.filter(m=>m.role==='user').map(m=>m.content).join('\n'));const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const name=clean(candidate.name,120),contact=clean(candidate.contact,200),organization=clean(candidate.organization,160),details=clean(candidate.details,1400);
 if(name.length<2||contact.length<5||details.length<10||!given.includes(normalize(name)))return null;
 const contactProvided=given.includes(normalize(contact))||(/^\+?[\d\s().-]+$/.test(contact)&&contact.replace(/\D/g,'').length>=7&&given.replace(/\D/g,'').includes(contact.replace(/\D/g,'')));
 if(!contactProvided||organization&&!given.includes(normalize(organization)))return null;
 return {kind:candidate.kind,name,organization,contact,details};
}
export function offTopicReply(messages){
 const q=messages.at(-1)?.content||'';
 if(/abdul|owahab|ও[য়য়]াহাব|আব্দুল|recruit|hire|customer|client|business|project|software|dashboard|accounting|audit|tax|vat|erp|ticky|প্রকল্প|নিয়োগ|ব্যবসা|কাজের|অডিট/i.test(q))return null;
 if(!/weather|cricket score|football score|movie plot|celebrity gossip|write (?:me )?(?:a )?(?:poem|song)|tell (?:me )?a joke|recipe for|solve (?:this )?equation|আবহাওয়া|ক্রিকেট স্কোর|কৌতুক|কবিতা লিখ|রান্নার রেসিপি/i.test(q))return null;
 return /[\u0980-\u09ff]|\b(ki|koto|bolo|dao|kemon)\b/i.test(q)?'আমি মূলত আব্দুল ওয়াহাবের কাজ, অভিজ্ঞতা ও পেশাগত যোগাযোগে সাহায্য করি।':'I mainly help with Abdul Owahab’s work, experience and professional enquiries.';
}
