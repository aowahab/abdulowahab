import {createHash} from 'node:crypto';
export const contentVersion=content=>createHash('sha256').update(JSON.stringify(content)).digest('hex');
export function editSiteContent(current,input){
 if(input.version!==contentVersion(current))throw Error('The website changed. Reload the draft before saving.');
 if(typeof input.value!=='string'||!input.value.trim())throw Error('Enter the replacement text.');
 const copy=structuredClone(current),path=input.path;
 if(path==='name'){if(input.value.length>100)throw Error('Name is too long.');copy.name=input.value;}
 else if(['profile.headline','profile.intro','profile.location'].includes(path)){const key=path.split('.')[1],max={headline:160,intro:600,location:100}[key];if(input.value.length>max)throw Error('Text exceeds the field limit.');copy.profile={...copy.profile,[key]:input.value};}
 else if(/^sections\.[a-zA-Z0-9_-]+\.(title|body)$/.test(path||'')){const[,id,key]=path.split('.'),section=copy.sections.find(s=>s.id===id);if(!section)throw Error('Section does not exist.');if(input.value.length>(key==='title'?120:10000))throw Error('Text exceeds the field limit.');section[key]=input.value;}
 else throw Error('Only the displayed portfolio text fields can be edited.');
 return copy;
}
export function appointmentInput(input,now=Date.now()){
 if(!Number.isSafeInteger(input.id)||input.id<1)throw Error('Choose an appointment request.');
 const start=new Date(input.start),end=new Date(input.end);if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input.start||'')||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input.end||'')||!Number.isFinite(+start)||!Number.isFinite(+end)||+start<now||+end<=+start||+end-+start>8*60*60*1000)throw Error('Choose a future start and end, up to eight hours apart.');
 try{new Intl.DateTimeFormat('en',{timeZone:input.timezone}).format(start)}catch{throw Error('Choose a valid timezone.');}
 if(typeof input.timezone!=='string'||input.timezone.length>80)throw Error('Choose a valid timezone.');return{id:input.id,start:start.toISOString(),end:end.toISOString(),timezone:input.timezone};
}
export async function confirmAppointment(pool,input){
 const slot=appointmentInput(input),client=await pool.connect();
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(79420631)');
 await client.query(`CREATE TABLE IF NOT EXISTS portfolio_appointments (lead_id BIGINT PRIMARY KEY REFERENCES portfolio_leads(id), starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, timezone TEXT NOT NULL, confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 const lead=await client.query("SELECT id,status,kind FROM portfolio_leads WHERE id=$1 FOR UPDATE",[slot.id]);if(!lead.rows.length||lead.rows[0].kind!=='appointment')throw Error('This is not an appointment request.');if(!['new','contacted'].includes(lead.rows[0].status))throw Error('This request is already confirmed or closed.');
 const conflict=await client.query('SELECT lead_id FROM portfolio_appointments WHERE starts_at < $2 AND ends_at > $1 LIMIT 1',[slot.start,slot.end]);if(conflict.rows.length)throw Error('This time overlaps an existing confirmed appointment.');
 await client.query('INSERT INTO portfolio_appointments(lead_id,starts_at,ends_at,timezone) VALUES($1,$2,$3,$4)',[slot.id,slot.start,slot.end,slot.timezone]);await client.query("UPDATE portfolio_leads SET status='confirmed' WHERE id=$1",[slot.id]);await client.query('COMMIT');return slot;
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
