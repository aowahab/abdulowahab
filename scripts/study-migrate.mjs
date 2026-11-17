// Explicit operator command: never invoked by build or API requests.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {seedCatalogue} from '../lib/study/service.js';
import {seedPilot} from '../lib/study/pilot.js';
if(!process.argv.includes('--apply'))throw Error('Review migration and target first; pass --apply to intentionally apply it.');
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required; this script never selects a project automatically.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
try{
 const exists=(await client.query("SELECT to_regclass('study.schema_versions') AS name")).rows[0].name;
 let versions=exists?(await client.query('SELECT version FROM study.schema_versions')).rows.map(r=>r.version):[];
 for(const [version,file] of [[1,'001_foundation.sql'],[2,'002_learning_runtime.sql'],[3,'003_written_profiles.sql']])if(!versions.includes(version)){await client.query(await readFile(new URL('../migrations/study/'+file,import.meta.url),'utf8'));console.log('Applied Study schema version',version);}
 await seedCatalogue(client);
 if(process.argv.includes('--seed-pilot')){
  // service requires a transaction-capable pool adapter for the one connected client.
  await seedPilot({query:(...args)=>client.query(...args),connect:async()=>({query:(...args)=>client.query(...args),release(){}})});
  console.log('Seeded original pilot content.');
 }
}finally{await client.end()}
