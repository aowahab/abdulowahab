// Isolated browser QA. Ephemeral PostgreSQL-compatible database; no production secrets.
import {createServer as createViteServer} from 'vite';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {localStudyDatabase} from '../test/support/study-db.js';
import {seedPilot} from '../lib/study/pilot.js';
import {createStudyHandler} from '../lib/study/handler.js';
import {isAdmin} from '../lib/auth.js';
const {pool,pg}=await localStudyDatabase();await seedPilot(pool);
const study=createStudyHandler({db:pool,secure:false,adminCheck:isAdmin});
const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
const port=Number(process.env.STUDY_DEV_PORT||5173);
const server=createServer(async(req,res)=>{
 try{
 if(req.url.startsWith('/api/study')){
  const url=new URL(req.url,'http://127.0.0.1:'+port),headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,String(v));
  const chunks=[];for await(const chunk of req){chunks.push(chunk);if(chunks.reduce((n,b)=>n+b.length,0)>64000)throw Error('Request too large')}
  const request=new Request(url,{method:req.method,headers,...(req.method==='GET'?{}:{body:Buffer.concat(chunks)})});
  const response=await study(request);res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();return;
 }
 // No mocked success for the actual portfolio endpoints in isolated QA.
 if(req.url.startsWith('/api/')){res.statusCode=503;res.setHeader('content-type','application/json');res.end(JSON.stringify({error:'Portfolio services are not connected in isolated Study QA'}));return;}
 vite.middlewares(req,res);
 }catch(e){res.statusCode=500;res.end('Local QA request failed');console.error(e.message)}
});server.listen(port,'0.0.0.0',()=>console.log('Isolated Study QA ready on port',port));
process.on('SIGTERM',async()=>{server.close();await vite.close();await pg.close();process.exit(0)});
