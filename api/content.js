import { readContent } from '../lib/store.js';
import { DEFAULT_CONTENT, publicPortfolioContent } from '../lib/portfolio-content.js';

// Public: the website reads its content from here.
export async function GET(request) {
  if(new URL(request.url).searchParams.get('workspace')==='study'){const {GET}=await import('../lib/study/handler.js');return GET(request);}
  const fresh = new URL(request.url).searchParams.has('fresh');
  let content;
  try {
    content = await readContent();
  } catch (error) {
    console.error('content read failed:', error);
    content = DEFAULT_CONTENT;
  }
  return new Response(JSON.stringify(publicPortfolioContent(content)), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': fresh
        ? 'no-store'
        : 'public, max-age=0, s-maxage=20, stale-while-revalidate=300',
    },
  });
}

export async function POST(request){
 if(new URL(request.url).searchParams.get('workspace')==='study'){const {POST}=await import('../lib/study/handler.js');return POST(request);}
 return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
