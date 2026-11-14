import { createHash } from 'node:crypto';
import pg from 'pg';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0'}});
let pool;
function database(){
 const connectionString=process.env.POSTGRES_URL||process.env.DATABASE_URL;
 if(!connectionString)return null;
 if(!pool)pool=new pg.Pool({connectionString,max:2,connectionTimeoutMillis:3000,idleTimeoutMillis:10000,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:false}});
 return pool;
}
const setup=async db=>db.query('CREATE TABLE IF NOT EXISTS portfolio_visitor_presence (visitor_id CHAR(64) PRIMARY KEY, first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW())');
export async function POST(request){
 if(Number(request.headers.get('content-length')||0)>512)return json({error:'Request too large'},413);
 let body;
 try{const raw=await request.text();if(raw.length>512)return json({error:'Request too large'},413);body=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
 const token=body?.visitorId;
 if(typeof token!=='string'||!/^[a-zA-Z0-9_-]{20,100}$/.test(token))return json({error:'Invalid visitor session'},400);
 const db=database();
 if(!db)return json({available:false,reason:'Analytics database not configured'},503);
 const visitorId=createHash('sha256').update(token).digest('hex');
 try{
  await setup(db);
  await db.query('INSERT INTO portfolio_visitor_presence(visitor_id) VALUES($1) ON CONFLICT(visitor_id) DO UPDATE SET last_seen=NOW()',[visitorId]);
  const {rows}=await db.query("SELECT COUNT(*)::int AS visitors, COUNT(*) FILTER (WHERE last_seen >= NOW()-INTERVAL '2 minutes')::int AS online FROM portfolio_visitor_presence");
  return json({available:true,visitors:rows[0].visitors,online:rows[0].online,windowMinutes:2});
 }catch(e){console.error('Visitor counter unavailable',e?.message);return json({available:false},503)}
}
export async function GET(){
 const db=database();
 if(!db)return json({available:false},503);
 try{
  await setup(db);
  const {rows}=await db.query("SELECT COUNT(*)::int AS visitors, COUNT(*) FILTER (WHERE last_seen >= NOW()-INTERVAL '2 minutes')::int AS online FROM portfolio_visitor_presence");
  return json({available:true,visitors:rows[0].visitors,online:rows[0].online,windowMinutes:2});
 }catch(e){console.error('Visitor counter unavailable',e?.message);return json({available:false},503)}
}
