import { NEWS_SOURCES,fetchNewsSource,mergeNews } from '../lib/news.js';
let cache=null;let pending=null;
const TTL=15*60*1000;
async function refresh(){
 const results=await Promise.allSettled(NEWS_SOURCES.map(source=>fetchNewsSource(source)));
 const groups=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
 const items=mergeNews(groups);
 if(!items.length){if(cache&&Date.now()-cache.timestamp<86400000)return {...cache.data,stale:true};throw Error('News unavailable')}
 const data={items,updatedAt:new Date().toISOString(),partial:results.some(r=>r.status==='rejected'),stale:false};cache={timestamp:Date.now(),data};return data;
}
export async function GET(){
 try{
  let data;
  if(cache&&Date.now()-cache.timestamp<TTL)data=cache.data;
  else {if(!pending)pending=refresh().finally(()=>{pending=null});data=await pending}
  return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':data.stale?'public, max-age=0, s-maxage=60':'public, max-age=0, s-maxage=900, stale-while-revalidate=3600'}});
 }catch{return new Response(JSON.stringify({items:[],error:'News sources are temporarily unavailable. Please try again later.'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
}
