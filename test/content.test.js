import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONTENT, normalizeContent, publicPortfolioContent } from '../lib/portfolio-content.js';
import { PROFILE } from '../shared/profile.js';
test('legacy saved content receives profile and project defaults',()=>{
 const legacy={...DEFAULT_CONTENT};delete legacy.profile;delete legacy.projects;
 const result=normalizeContent(legacy);
 assert.equal(result.profile.headline,PROFILE.headline);
 assert.equal(result.projects.length,2);
 assert.equal(result.profile.cvUrl,'');
});
test('editor changes survive normalization and unsafe links are rejected',()=>{
 const result=normalizeContent({...DEFAULT_CONTENT,profile:{headline:'Updated headline',intro:'Updated introduction',cvUrl:'javascript:alert(1)'},projects:[{title:'Updated project',link:'javascript:alert(1)',flow:['Entry','Report']}]});
 assert.equal(result.profile.headline,'Updated headline');assert.equal(result.profile.cvUrl,'');assert.equal(result.projects[0].link,'');assert.deepEqual(result.projects[0].flow,['Entry','Report']);
});
test('public case studies retain their approved profile fields',()=>{
 const result=publicPortfolioContent(DEFAULT_CONTENT);
 assert.equal(result.profile.headline,PROFILE.headline);assert.equal(result.projects.length,2);
});

test('public content removes saved repository links and portfolio case studies',()=>{
 const content={...DEFAULT_CONTENT,sections:[{id:'projects',title:'Projects',body:'Tickydo ticketing\nPersonal portfolio: React and Vercel\nSource: https://github.com/example/repo'}],projects:[...DEFAULT_CONTENT.projects,{title:'Personal portfolio',link:'https://github.com/example/repo'}]};
 const result=publicPortfolioContent(content);
 assert.equal(/github|personal portfolio/i.test(JSON.stringify(result)),false);
 assert.match(result.sections[0].body,/Tickydo ticketing/);
 assert.equal(result.projects.length,2);
});
