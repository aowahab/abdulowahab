import {get,del} from '@vercel/blob';
import {readBounded,privateToken} from './assets.js';
import {demand} from './validation.js';
export const studyStorage={
 get available(){return !!process.env.STUDY_BLOB_READ_WRITE_TOKEN&&process.env.STUDY_PRIVATE_STORAGE_VERIFIED==='true';},
 async read(path){const r=await get(path,{access:'private',token:privateToken(),useCache:false});demand(r?.statusCode===200,'Private file unavailable',404);return {bytes:await readBounded(r.stream),type:r.blob.contentType};},
 async remove(path){await del(path,{token:privateToken()});}
};
