import {createRemoteJWKSet,jwtVerify} from 'jose';
import {randomUUID} from 'node:crypto';
import {demand} from './validation.js';
let keys,keyUrl;
export async function verifyAccountToken(token,keySet,issuer){const {payload}=await jwtVerify(token,keySet,{issuer,algorithms:['EdDSA'],requiredClaims:['sub','exp','iat']});demand(typeof payload.sub==='string'&&payload.sub.length>0&&payload.sub.length<=200,'Invalid identity',401);return `neon:${payload.iss}:${payload.sub}`;}
export async function verifyStudyIdentity(request){
 const authorization=request.headers.get('authorization');if(!authorization)return null;
 demand(authorization.startsWith('Bearer '),'Invalid account authorization',401);
 demand(process.env.NEON_AUTH_BASE_URL&&process.env.NEON_AUTH_JWKS_URL,'Study account verification is not configured',503);
 const endpoint=new URL(process.env.NEON_AUTH_JWKS_URL);demand(endpoint.protocol==='https:','Secure identity keys required',503);
 if(keyUrl!==endpoint.href){keys=createRemoteJWKSet(endpoint);keyUrl=endpoint.href;}
 try{return await verifyAccountToken(authorization.slice(7),keys,new URL(process.env.NEON_AUTH_BASE_URL).origin);}catch{demand(false,'Account session expired; sign in again',401);}
}
export async function accountOwner(db,identity){if(!identity)return null;const id=randomUUID();const row=(await db.query("INSERT INTO study.owners(id,kind,identity_subject) VALUES($1,'account',$2) ON CONFLICT(identity_subject) DO UPDATE SET identity_subject=EXCLUDED.identity_subject RETURNING id,deleted_at",[id,identity])).rows[0];demand(!row.deleted_at,'This Study profile has been deleted',410);return row.id;}
