export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'en';

  const targetUrl = new URL('https://my-api.plantnet.org/v2/identify/all');
  targetUrl.searchParams.set('api-key', apiKey);
  targetUrl.searchParams.set('lang', lang);

  const body = await req.arrayBuffer();

  const response = await fetch(targetUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': req.headers.get('Content-Type') || 'multipart/form-data' },
    body,
  });

  const data = await response.arrayBuffer();

  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
