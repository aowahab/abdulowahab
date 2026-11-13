import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { handle } = require('../erp/lib/router.js');
export default async function handler(req,res) {
  const routeParam = req.query?.route;
  const route = (Array.isArray(routeParam) ? routeParam.join('/') : String(routeParam || '')).replace(/^\/+/, '');
  const u = new URL(req.url,'https://localhost');
  u.searchParams.delete('route');
  const url = '/api/' + route + (u.search ? u.search : '');
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const result = await handle({method:req.method,url,headers:req.headers,body,secure:String(req.headers['x-forwarded-proto']||'https')==='https'});
  res.statusCode=result.status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  for(const [key,value] of Object.entries(result.headers||{}))res.setHeader(key,value);
  res.end(JSON.stringify(result.body??{}));
}
