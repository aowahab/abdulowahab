import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const assistant=readFileSync(new URL('../api/assistant.js',import.meta.url),'utf8');
const routes=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));

test('all five portfolio routes preserve SPA rewrites',()=>{
 for(const path of ['/feed','/profile','/consultation','/workstation','/appointment'])
  assert.ok(routes.rewrites.some(r=>r.source===path&&r.destination==='/'),path);
});
test('mobile navigation has five distinct destinations and accessible current state',()=>{
 assert.match(main,/mobilePages=\['feed','profile','consultation','workstation','appointment'\]/);
 assert.match(main,/aria-label="Mobile quick navigation"/);
 assert.match(main,/aria-current=\{activePage===page\?'page':undefined\}/);
});
test('footer, workstation and AI remain mounted',()=>{
 assert.match(main,/<footer className="footer"/);
 assert.match(main,/<PortfolioAI\/>/);
 assert.match(main,/<Section id="workstation"/);
 assert.match(main,/href="\/erp\/"/);
});
test('mobile screenshot-approved navigation overrides remain present',()=>{
 assert.match(css,/Screenshot-matched mobile bottom navigation/);
 assert.match(css,/\.mobile-bottom-nav a\.is-active/);
});
test('AI retains safe provider fallback and bounded input',()=>{
 assert.match(assistant,/publicKnowledgeFallback/);
 assert.match(assistant,/Request too large/);
 assert.match(assistant,/Invalid messages/);
 assert.match(assistant,/AbortController/);
});

test('feed photos preserve full images on mobile without cropping',()=>{
 assert.match(css,/#updates \.update \.media img,[\s\S]*?object-fit:contain/);
 assert.match(css,/@media\(max-width:580px\)[\s\S]*?#updates \.update \.media img\{[\s\S]*?aspect-ratio:auto/);
});
