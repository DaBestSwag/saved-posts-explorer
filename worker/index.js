// Serves the static site, plus a /hf/ relay for the search model.
// Hugging Face refuses browser requests from *.workers.dev, but not server-side ones.
const ALLOWED = '/hf/Xenova/bge-small-en-v1.5/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/hf/')) return env.ASSETS.fetch(request);
    if (!url.pathname.startsWith(ALLOWED) || request.method !== 'GET') return new Response('Not found', { status: 404 });

    const upstream = await fetch('https://huggingface.co/' + url.pathname.slice(4), {
      cf: { cacheEverything: true, cacheTtl: 60 * 60 * 24 * 30 },
    });
    const headers = new Headers();
    for (const h of ['content-type', 'content-length', 'etag']) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    headers.set('cache-control', 'public, max-age=2592000');
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
