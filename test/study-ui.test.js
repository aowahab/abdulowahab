import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {localStudyDatabase} from './support/study-db.js';
import {seedPilot} from '../lib/study/pilot.js';
import {createStudyHandler} from '../lib/study/handler.js';
test('Study UI: browse levels, take MCQ, review explanations, and edit Admin materials',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/study'});
 const keys=['window','document','navigator','location','sessionStorage','HTMLElement','Node','MutationObserver','getComputedStyle'];const descriptors=new Map();
 for(const key of keys){descriptors.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value:key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key],configurable:true,writable:true})}
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {pg,pool}=await localStudyDatabase();const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
 const previousFetch=globalThis.fetch;let cookie='',admin=false;
 try{
 await seedPilot(pool);const handler=createStudyHandler({db:pool,secure:false,adminCheck:()=>admin});
 globalThis.fetch=async(url,options={})=>{const headers=new Headers(options.headers);headers.set('host','localhost');headers.set('origin','http://localhost');headers.set('cookie',cookie);const r=await handler(new Request(new URL(url,'http://localhost'),{...options,headers}));const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return r;};
 const React=await import('react');const {render,screen,waitFor,cleanup}=await import('@testing-library/react');const {default:userEvent}=await import('@testing-library/user-event');const user=userEvent.setup({document:dom.window.document});
 const {default:Study}=await vite.ssrLoadModule('/src/study/Study.jsx');
 render(React.createElement(Study));
 await screen.findByText('Reasonable assurance: a clear starting point');
 await user.click(screen.getByRole('button',{name:/PL Professional/}));
 await screen.findByRole('heading',{name:'Audit and Assurance'});
 await user.click(screen.getByRole('button',{name:/CL Certificate/}));
 await user.selectOptions(screen.getByLabelText('Subject'),'cl-accounting');
 await screen.findByRole('heading',{name:'Materials are being prepared'});
 await user.selectOptions(screen.getByLabelText('Subject'),'cl-assurance');
 await user.click(screen.getByRole('button',{name:'Exam',exact:true}));
 await user.click(await screen.findByRole('button',{name:'Review & start'}));
 await user.click(screen.getByRole('button',{name:'Start exam',exact:true}));
 await screen.findByText('A financial statement audit provides which level of assurance?');
 await user.click(screen.getByRole('radio',{name:'B. Reasonable assurance'}));
 await waitFor(()=>assert.equal(screen.getByRole('radio',{name:'B. Reasonable assurance'}).checked,true));
 await user.click(screen.getByRole('checkbox',{name:'Flag for review'}));
 await waitFor(()=>assert.equal(screen.getByRole('checkbox',{name:'Flag for review'}).checked,true));
 await user.click(screen.getByRole('button',{name:'Leave & resume later'}));
 await user.click(screen.getByRole('button',{name:'Resume / review saved attempt'}));
 await screen.findByRole('checkbox',{name:'Flag for review'});
 assert.equal(screen.getByRole('checkbox',{name:'Flag for review'}).checked,true);
 await user.click(screen.getByRole('button',{name:'Submit exam',exact:true}));
 await user.click(screen.getByRole('button',{name:'Confirm submission'}));
 await screen.findByRole('heading',{name:'Every answer, explained'});
 assert.ok(screen.getByRole('heading',{name:'1 / 3'}));
 await user.click(screen.getByRole('button',{name:'Back to Study'}));
 admin=true;await user.click(screen.getByRole('button',{name:'Study Admin',exact:true}));
 await screen.findByText('Materials · create / edit / publish');
 await user.type(screen.getByLabelText('Title'),'UI draft example');
 await user.type(screen.getByLabelText('Explanation / worked example'),'A draft saved from the actual React Admin form.');
 await user.click(screen.getByRole('button',{name:'Preview',exact:true}));
 assert.ok(screen.getByRole('heading',{name:'UI draft example'}));
 await user.click(screen.getByRole('button',{name:'Save draft'}));
 await screen.findByText('Saved successfully.');
 const service=new (await import('../lib/study/service.js')).StudyService(pool);
 assert.ok(!(await service.materials(false)).some(m=>m.title==='UI draft example'));
 assert.ok((await service.materials(true)).some(m=>m.title==='UI draft example'));
 cleanup();
 }finally{
 globalThis.fetch=previousFetch;await vite.close();await pg.close();dom.window.close();
 for(const key of keys){const descriptor=descriptors.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 delete globalThis.IS_REACT_ACT_ENVIRONMENT;
 }
});

