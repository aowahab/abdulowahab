import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
export async function localStudyDatabase(){
 const pg=new PGlite();
 for(const file of ['001_foundation.sql','002_learning_runtime.sql'])await pg.exec(await readFile(new URL('../../migrations/study/'+file,import.meta.url),'utf8'));
 let queue=Promise.resolve();
 const pool={query:(sql,args)=>pg.query(sql,args),connect:async()=>{let release;const next=new Promise(r=>{release=r});const prior=queue;queue=next;await prior;return {query:(sql,args)=>pg.query(sql,args),release};}};
 return {pg,pool};
}
