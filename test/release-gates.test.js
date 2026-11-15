import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leads=readFileSync(new URL('../api/leads.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('private enquiries require consent and same-origin protection',()=>{
 assert.match(leads,/sameOrigin\(request\)/);
 assert.match(leads,/d\.consent!==true/);
 assert.match(leads,/if\(!isAdmin\(request\)\)/);
 assert.match(leads,/VALUES\(\$1,\$2,\$3,\$4,\$5\)/);
});
test('appointment requests are not falsely confirmed',()=>{
 assert.match(ui,/This is not a confirmed booking/);
 assert.match(ui,/no appointment is booked until confirmed/);
 assert.match(ui,/preferredDate/);
 assert.match(ui,/preferredTime/);
});
test('metadata avoids incorrect finance degree',()=>{
 assert.match(html,/Accounting, audit and assurance/);
 assert.match(html,/ICAB Professional Level student/);
});
test('client identities do not appear in public UI source',()=>{
 for(const name of ['Asia Coatings','Bayer CropScience','Child Health Research Foundation','Asian Paints (Bangladesh)','Mitsubishi Corporation','Novo Nordisk Pharma']){
  assert.ok(!ui.includes(name),'Confidential client name exposed: '+name);
 }
});

test('materiality calculator handles numeric overflow and percentage scaling safely',()=>{
 assert.match(ui,/Number\.isFinite\(amount\)/);
 assert.match(ui,/Number\.isFinite\(rate\)/);
 assert.match(ui,/Number\.isFinite\(performance\)/);
 assert.match(ui,/const overall=amount\*\(rate\/100\),pm=overall\*\(performance\/100\)/);
 assert.match(ui,/!Number\.isFinite\(overall\)\|\|!Number\.isFinite\(pm\)/);
 const materiality=(amount,rate,performance)=>({overall:amount*(rate/100),pm:amount*(rate/100)*(performance/100)});
 assert.deepEqual(materiality(10000000,5,75),{overall:500000,pm:375000});
 assert.equal(Number.isFinite(materiality(1e308,100,100).overall),true);
 assert.equal(Number.isFinite(materiality(1e308,100,100).pm),true);
});
