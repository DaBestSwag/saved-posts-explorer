// Serves the static site, a /v/ route for our own copies of the videos (R2), and a /hf/ relay for the search model.
// Hugging Face refuses browser requests from *.workers.dev, but not server-side ones.
import { handleApi, json } from './ai.js';

const ALLOWED ='/hf/Xenova/bge-small-en-v1.5/';
const MONTH = 60 * 60 * 24 * 30;
const VIDEO = /^\/v\/([\w-]+\.mp4)$/;

// Range requests are what let the player seek without downloading the whole file.
async function serveVideo(request, env, key) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const obj = await env.VIDEOS.get(key, { range: request.headers, onlyIf: request.headers });
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers({ 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'cache-control': `public, max-age=${MONTH}`, etag: obj.httpEtag });
  if (!('body' in obj)) return new Response(null, { status: 304, headers });
  const r = obj.range;
  if (r && request.headers.has('range')) {
    // R2 can include unused fields as undefined, so check values, not key presence.
    const start = r.suffix !== undefined ? obj.size - r.suffix : (r.offset ?? 0);
    const end = r.suffix === undefined && r.length !== undefined ? start + r.length - 1 : obj.size - 1;
    headers.set('content-range', `bytes ${start}-${end}/${obj.size}`);
    headers.set('content-length', String(end - start + 1));
    return new Response(request.method === 'HEAD' ? null : obj.body, { status: 206, headers });
  }
  headers.set('content-length', String(obj.size));
  return new Response(request.method === 'HEAD' ? null : obj.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const video = VIDEO.exec(url.pathname);
    if (video) return serveVideo(request, env, video[1]);
    if (url.pathname === '/api/ai/engines') return json({ sub: false, api: !!env.ANTHROPIC_API_KEY });
    if (url.pathname === '/api/ai') return handleApi(request, env);
    if (!url.pathname.startsWith('/hf/')) return env.ASSETS.fetch(request);
    if (!url.pathname.startsWith(ALLOWED) || request.method !== 'GET') return new Response('Not found', { status: 404 });

    let upstream;
    try {
      upstream = await fetch('https://huggingface.co/' + url.pathname.slice(4), {
        // Only successful files are kept long; a passing Hugging Face hiccup must not stick.
        cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': MONTH, '404': 60, '500-599': 0 } },
      });
    } catch {
      return new Response('Model host unreachable', { status: 502 });
    }
    // content-length is left out: the runtime may have decoded the body, so the upstream value can be wrong.
    const headers = new Headers({ 'cache-control': upstream.ok ? `public, max-age=${MONTH}` : 'no-store' });
    for (const h of ['content-type', 'etag']) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
