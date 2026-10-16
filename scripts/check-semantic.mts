// Runs the real model (same code path as the browser worker) against embeddings.bin.
import fs from 'node:fs';
import { pipeline, env } from '@xenova/transformers';
import { buildKeywordIndex } from '../src/lib/keyword';
import { embedQuery, parseQuery, rankHybrid, MODEL, QUERY_PREFIX } from '../src/lib/semantic';
import type { PostsFile } from '../src/lib/types';

env.allowLocalModels = false;
const { dims, posts } = JSON.parse(fs.readFileSync('public/data/posts.json', 'utf8')) as PostsFile;
const b = fs.readFileSync('public/data/embeddings.bin');
const emb = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
const kwIndex = buildKeywordIndex(posts);
const extractor: any = await pipeline('feature-extraction', MODEL, { quantized: true });

const show = (r: { i: number; score: number; cos: number }, n: number) => {
  const p = posts[r.i];
  const t = (p.caption || p.desc).replace(/\s+/g, ' ').slice(0, 80);
  console.log(`  ${String(n).padStart(2)}. cos=${r.cos.toFixed(3)} sc=${r.score.toFixed(3)} @${p.author || '(none)'} | ${t}`);
};

// Pooling sanity: embed a post's text, compare with its stored vector.
const p0 = posts.find((p) => p.caption && p.desc)!;
const idx0 = posts.indexOf(p0);
const text = [p0.caption, p0.hashtags, p0.desc, p0.author, p0.categories.join(', ')].join(' ').slice(0, 2000);
for (const pooling of ['cls', 'mean'] as const) {
  const o = await extractor(text, { pooling, normalize: true });
  let c = 0;
  for (let d = 0; d < dims; d++) c += o.data[d] * emb[idx0 * dims + d];
  console.log(`pooling=${pooling} cosine vs stored vector: ${c.toFixed(4)}`);
}

const queries = ['videos about ICE', 'sub agents in Claude Code', 'the K-shaped economy'];
for (const raw of queries) {
  const { text, wantsVideos } = parseQuery(raw);
  const kw = kwIndex.search(text);
  for (const prefix of [true, false]) {
    const q = prefix
      ? await embedQuery(extractor, text)
      : Float32Array.from((await extractor(text, { pooling: 'cls', normalize: true })).data);
    const res = rankHybrid(q, emb, dims, kw, (i) => !wantsVideos || posts[i].mediaType === 'VIDEO');
    console.log(`\n"${raw}" -> "${text}" videosFilter=${wantsVideos} prefix=${prefix} results=${res.length}`);
    res.slice(0, 10).forEach((r, n) => show(r, n + 1));
  }
}
void QUERY_PREFIX;
