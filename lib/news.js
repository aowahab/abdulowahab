import { XMLParser } from 'fast-xml-parser';

export const NEWS_SOURCES = [
 {name:'The Daily Star',url:'https://www.thedailystar.net/business/tax-and-customs/rss.xml',hosts:['www.thedailystar.net','thedailystar.net'],region:'Bangladesh',topics:['Tax']},
 {name:'The Business Standard',url:'https://www.tbsnews.net/economy/rss.xml',hosts:['www.tbsnews.net','tbsnews.net'],region:'Bangladesh'},
 {name:'IFAC',url:'https://www.ifac.org/rss.xml',hosts:['www.ifac.org','ifac.org'],region:'International',topics:['Audit','Accounting']},
 {name:'Accounting Today',url:'https://www.accountingtoday.com/feed?rss=true',hosts:['www.accountingtoday.com','accountingtoday.com'],region:'United States',topics:['Accounting']},
];
const parser=new XMLParser({ignoreAttributes:false,processEntities:true,parseTagValue:false,trimValues:true});
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
function text(value){
 if(value&&typeof value==='object')return Object.entries(value).filter(([k])=>!k.startsWith('@_')).map(([,v])=>text(v)).join(' ').trim();
 return String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
export function parseNews(xml,source,now=Date.now()){
 if(xml.length>2_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Unsupported feed');
 const root=parser.parse(xml);const items=array(root.rss?.channel?.item);
 return items.slice(0,100).flatMap(item=>{
  const title=text(item.title).slice(0,250);const link=text(item.link);const published=Date.parse(text(item.pubDate||item['dc:date']));
  if(!title||!Number.isFinite(published)||published>now+86400000||now-published>90*86400000)return [];
  let url;try{url=new URL(link)}catch{return []}
  if(url.protocol!=='https:'||!source.hosts.includes(url.hostname)||url.username||url.password)return [];
  const topics=new Set(source.topics||[]);
  if(/\baudit(?:ing|or|ors)?\b|assurance|pcaob|iaasb|\bisa\b/i.test(title))topics.add('Audit');
  if(/account(?:ing|ant|ants)|\bifrs\b|\biasb\b|financial report|\bfasb\b|\bsec\b/i.test(title))topics.add('Accounting');
  if(/\btax(?:es|ation|payer|payers)?\b|\bnbr\b|\birs\b|stamp dut|customs|revenue board/i.test(title))topics.add('Tax');
  if(/\bvat\b|value.added tax/i.test(title))topics.add('VAT');
  if(!topics.size)return [];
  return [{title,url:url.href,source:source.name,region:source.region,publishedAt:new Date(published).toISOString(),topics:[...topics]}];
 });
}
export function mergeNews(groups){
 const seen=new Set();return groups.flat().sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).filter(item=>{
  const key=item.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');if(seen.has(key))return false;seen.add(key);return true;
 }).slice(0,40);
}
export async function fetchNewsSource(source,fetcher=fetch){
 const response=await fetcher(source.url,{headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'AbdulOwahab-NewsFeed/1.0'},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Source unavailable');
 if(Number(response.headers.get('content-length')||0)>2_000_000)throw Error('Feed too large');
 const reader=response.body.getReader();const chunks=[];let bytes=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2_000_000)throw Error('Feed too large');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
 const xml=Buffer.concat(chunks).toString('utf8');return parseNews(xml,source);
}
