import pg from 'pg';
import { notifyOwnerWhatsApp } from '../lib/whatsapp.js';
import { isAdmin } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, max: 2, connectionTimeoutMillis: 5000 });
async function setup(){ await pool.query(`CREATE TABLE IF NOT EXISTS portfolio_leads (id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), name TEXT NOT NULL, organization TEXT, contact TEXT NOT NULL, kind TEXT NOT NULL, details TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new')`); }
const clean=(v,n=500)=>typeof v==='string'?v.trim().slice(0,n):'';
export async function POST(request){
 if(!sameOrigin(request))return json({error:'Cross-site request blocked'},403);
 if(Number(request.headers.get('content-length')||0)>7000)return json({error:'Too large'},413);
 let d;try{d=await request.json()}catch{return json({error:'Invalid JSON'},400)}
 if(d.website)return json({ok:true});
 if(d.consent!==true)return json({error:'Consent required'},400);
 const name=clean(d.name,120),contact=clean(d.contact,200),organization=clean(d.organization,160),details=clean(d.details,1500),kind=['recruiter','client','collaboration','other'].includes(d.kind)?d.kind:'other';
 if(!name||contact.length<5||details.length<10)return json({error:'Name, contact and enquiry details are required'},400);
 try{await setup();const saved=await pool.query('INSERT INTO portfolio_leads(name,organization,contact,kind,details) VALUES($1,$2,$3,$4,$5) RETURNING id',[name,organization,contact,kind,details]);await notifyOwnerWhatsApp({id:saved.rows[0].id,kind});return json({ok:true})}catch(e){console.error('Lead storage failed:',e.message);return json({error:'Could not save enquiry. Please email Abdul directly.'},503)}
}
export async function GET(request){
 if(!isAdmin(request))return json({error:'Unauthorized'},401);
 try{await setup();const r=await pool.query('SELECT id,created_at,name,organization,contact,kind,details,status FROM portfolio_leads ORDER BY created_at DESC LIMIT 150');return json({leads:r.rows})}catch(e){console.error('Lead read failed:',e.message);return json({error:'Could not load enquiries'},503)}
}
export async function PATCH(request){
 if(!isAdmin(request)||!sameOrigin(request))return json({error:'Unauthorized'},401);
 let d;try{d=await request.json()}catch{return json({error:'Invalid JSON'},400)}
 if(!Number.isSafeInteger(d.id)||!['new','contacted','closed'].includes(d.status))return json({error:'Invalid status'},400);
 try{await setup();await pool.query('UPDATE portfolio_leads SET status=$1 WHERE id=$2',[d.status,d.id]);return json({ok:true})}catch{return json({error:'Could not update'},503)}
}
