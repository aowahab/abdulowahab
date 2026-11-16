const owner=/\b(?:abdul|owahab|owahaber|owahab er)\b|আব্দুল|ও(?:য়|য়)াহাব/i;
const banglish=/\b(?:tmi|tumi|tmr|tomar|apni|apnar|ami|amr|amar|ki|ke|k|kore|koren|koro|kaj|chakri|porashona|kothay|kemon|acho|achen|dhonnobad|valo|bhalo|tar|uni|aro|bolo|bolen|koto|thake|thaken)\b/i;
const bn=text=>/[\u0980-\u09ff]/.test(text)||banglish.test(text);
const clean=text=>text.toLowerCase().trim().replace(/[?!.,।]+$/g,'').replace(/\s+/g,' ');
const job=text=>/(?:\b(?:ki|kee)\s+(?:kore|koren|kor[eoy]|kaj)|\b(?:kaj|chakri|job|profession|occupation)\b|what does .{0,30} do|where does .{0,30} work|কী?\s*(?:কাজ|করেন|করে)|পেশা|চাকরি)/i.test(text);
const education=text=>/education|stud(?:y|ied|ies)|university|icab|degree|porashona|poralekha|পড়াশোনা|পড়াশোনা|শিক্ষা|ডিগ্রি/i.test(text);
export function basicConversationReply(messages){
 const question=messages.at(-1)?.content||'';if(question.length>180||/(?:name|contact|details)\s*:/i.test(question))return null;const q=clean(question),b=bn(question);
 if(/^(?:hi|hii+|hello|hey|হাই|হ্যালো)(?:\s+(?:there|ai|assistant))?$/.test(q))return 'Hi! কী জানতে চান?';
 if(/^(?:ass?alamu?\s*alaikum|salam|আসসালামু আলাইকুম|সালাম)$/.test(q))return 'ওয়ালাইকুম আসসালাম। বলুন, কী জানতে চান?';
 if(/^(?:(?:tmi|tumi|apni)\s+(?:k|ke|ki)|(?:tomar|tmr|apnar)\s+(?:porichoy|name|nam)|who (?:are|r) (?:you|u)|what(?:'s| is) your name|তুমি কে|আপনি কে|তোমার পরিচয়|আপনার পরিচয়)$/.test(q))return b?'আমি আব্দুল ওয়াহাবের AI assistant—ওয়াহাব নিজে নই। তাঁর প্রকাশ্য তথ্য ও এই সাইটের কাজে সাহায্য করি।':'I’m Abdul Owahab’s AI assistant, not Abdul himself. I help with his public profile and this website.';
 if(/^(?:thanks|thank you|thank u|thx|ধন্যবাদ|dhonnobad|ধন্যবাদ আপনাকে)$/.test(q))return b?'স্বাগতম।':'You’re welcome.';
 if(/^(?:kemon (?:acho|achen)|কেমন আছো|কেমন আছেন|how are you)$/.test(q))return b?'আছি, বলুন—কী জানতে চান?':'I’m here to help. What’s on your mind?';
 const previous=[...messages.slice(0,-1)].reverse().find(m=>m.role==='user'&&owner.test(m.content))?.content||'';
 const refersToOwner=owner.test(q)||/^(?:tar|uni|he|his|him|তার|তিনি|সে)\b/i.test(q);
 if(refersToOwner&&job(q))return b?'ওয়াহাব Deloitte Bangladesh-এর Audit & Assurance বিভাগে Senior Associate হিসেবে কাজ করেন। পাশাপাশি Tickydo-এর সহপ্রতিষ্ঠাতা।':'Abdul is a Senior Associate in Audit & Assurance at Deloitte Bangladesh and a co-founder of Tickydo.';
 if(refersToOwner&&education(q))return b?'তিনি জগন্নাথ বিশ্ববিদ্যালয় থেকে Accounting & Information Systems-এ BBA করেছেন। এখন ICAB Professional Level-এ পড়ছেন।':'He earned a BBA in Accounting & Information Systems at Jagannath University and is studying at ICAB Professional Level.';
 if(refersToOwner&&/(?:kothay|where).*(?:thake|thaken|live|based)|কোথা[য়য়].*(?:থাকেন|থাকে)/i.test(q))return b?'তিনি ঢাকায় কাজ করেন। ব্যক্তিগত বাসার ঠিকানা প্রকাশ করা হয়নি।':'He works in Dhaka, Bangladesh. His private home address is not published.';
 if(/^(?:r ki|ar ki|aro bolo|aro bolen|আরও বলুন|আর কি|আর কী|more|tell me more|tarpor|তারপর)$/.test(q)&&previous){
  if(job(previous)){const already=messages.filter(m=>m.role==='assistant').map(m=>m.content).join(' ');if(!/Revenue|revenue|receivables/i.test(already))return b?'অডিটে revenue, inventory, receivables ও payroll-এর মতো financial statement area নিয়ে কাজ করেছেন। Client-এর নাম confidential।':'His audit work covers revenue, inventory, receivables and payroll. Client identities remain confidential.';return b?'পাশাপাশি ICAB Professional Level-এ Chartered Accountancy পড়ছেন।':'He is also pursuing Chartered Accountancy at ICAB Professional Level.';}
  if(education(previous))return b?'তিনি এখনো qualified CA নন; ICAB Professional Level-এ অধ্যয়ন করছেন। এর বাইরে যাচাই করা বিস্তারিত আমার কাছে নেই।':'He is still studying at ICAB Professional Level and is not yet a qualified CA. I do not have further verified study details.';
 }
 if(refersToOwner&&/salary|income|age|birthday|birth date|married|wife|girlfriend|family|বেতন|বয়স|জন্মদিন|বিয়ে|বিয়ে|পরিবার/i.test(q))return b?'এ বিষয়ে যাচাই করা public তথ্য আমার কাছে নেই, তাই জানি না।':'I don’t know; I don’t have verified public information about that.';
 return null;
}
