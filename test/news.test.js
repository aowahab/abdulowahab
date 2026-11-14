import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNews,mergeNews,fetchNewsSource} from '../lib/news.js';
const now=Date.parse('2026-11-14T12:00:00Z');
const source={name:'Example publisher',hosts:['example.com'],region:'Bangladesh'};
const feed=items=>`<?xml version="1.0"?><rss><channel>${items.join('')}</channel></rss>`;
const item=(title,url='https://example.com/story',date='Sat, 14 Nov 2026 10:00:00 GMT')=>`<item><title>${title}</title><link>${url}</link><pubDate>${date}</pubDate></item>`;
test('RSS HTML titles become plain text, retain attribution and classify VAT',()=>{
 const rows=parseNews(feed([item('<a href="/story">NBR announces VAT update &amp; guidance</a>')]),source,now);
 assert.equal(rows.length,1);assert.equal(rows[0].title,'NBR announces VAT update & guidance');assert.deepEqual(rows[0].topics,['Tax','VAT']);assert.equal(rows[0].source,'Example publisher');
});
test('unrelated, stale, future, missing-date and off-site stories are excluded',()=>{
 const rows=parseNews(feed([item('Football victory'),item('VAT update','https://evil.example/story'),item('Tax update','javascript:alert(1)'),item('Tax update','https://example.com/old','Wed, 01 Jan 2020 10:00:00 GMT'),item('Tax update','https://example.com/future','Wed, 01 Jan 2030 10:00:00 GMT'),item('Tax update','https://example.com/no-date','')]),source,now);
 assert.equal(rows.length,0);
});
test('merged feeds sort newest first and deduplicate syndicated headlines',()=>{
 const old=parseNews(feed([item('Tax update','https://example.com/old','Fri, 13 Nov 2026 10:00:00 GMT')]),source,now);
 const fresh=parseNews(feed([item('Audit standards update','https://example.com/new')]),source,now);
 const rows=mergeNews([old,fresh,[{...fresh[0],url:'https://example.com/duplicate'}]]);assert.equal(rows.length,2);assert.equal(rows[0].url,'https://example.com/new');
});
test('external entities, oversized feeds and publisher failures are rejected',async()=>{
 assert.throws(()=>parseNews('<!DOCTYPE rss SYSTEM "file:///etc/passwd"><rss/>',source,now));
 assert.throws(()=>parseNews('x'.repeat(2_000_001),source,now));
 await assert.rejects(()=>fetchNewsSource({...source,url:'https://example.com/rss'},async()=>new Response('',{status:503})),/Source unavailable/);
});
