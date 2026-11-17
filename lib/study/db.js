import pg from 'pg';
let pool;
export function studyPool(){
 const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!connectionString)throw Object.assign(Error('Study database is not configured'),{status:503});
 return pool||=new pg.Pool({connectionString,max:3,connectionTimeoutMillis:5000});
}
export async function transaction(pool,run){const db=await pool.connect();try{await db.query('BEGIN');const result=await run(db);await db.query('COMMIT');return result}catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}}
