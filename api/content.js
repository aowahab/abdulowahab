import { readContent } from '../lib/store.js';
import { DEFAULT_CONTENT } from '../lib/content.js';

// Public: the website reads its content from here.
export async function GET(request) {
  const fresh = new URL(request.url).searchParams.has('fresh');
  let content;
  try {
    content = await readContent();
  } catch (error) {
    console.error('content read failed:', error);
    content = DEFAULT_CONTENT;
  }
  return new Response(JSON.stringify(content), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': fresh
        ? 'no-store'
        : 'public, max-age=0, s-maxage=20, stale-while-revalidate=300',
    },
  });
}
