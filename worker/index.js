// Serves the static site, plus a /hf/ relay for the search model.
// Hugging Face refuses browser requests from *.workers.dev, but not server-side ones.
const ALLOWED = '/hf/Xenova/bge-small-en-v1.5/';
const MONTH = 60 * 60 * 24 * 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
