// Build-time data step: CSV -> compact JSON + binary embeddings. Raw CSVs are never shipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const outDir = path.join(root, 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });

const parseCsv = (file) => {
  const text = fs.readFileSync(path.join(dataDir, file), 'utf8').replace(/^﻿/, '');
  const res = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (res.errors.length) console.warn(`[build-data] ${file}: ${res.errors.length} parse warnings`, res.errors[0]);
  return res.data;
};

const split = (s) => (s ? s.split(';').map((x) => x.trim()).filter(Boolean) : []);
const int = (s) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

const rows = parseCsv('categorized_saved_posts_full.csv');
const posts = rows.map((r) => ({
  id: r.media_id,
  url: r.url || '',
  author: r.author || '',
  authorName: r.author_name || '',
  categories: split(r.categories),
  subcategories: split(r.subcategories),
  published: r.published || '',
  mediaType: r.media_type || '',
  postType: r.post_type || '',
  likes: int(r.likes),
  comments: int(r.comments),
  caption: r.caption || '',
  hashtags: r.hashtags || '',
  desc: r.media_description || '',
}));

const emb = parseCsv('embeddings.csv');
const dims = Object.keys(emb[0]).filter((k) => k.startsWith('dim_')).length;
const byId = new Map(emb.map((r) => [r.media_id, r]));
const buf = new Float32Array(posts.length * dims);
let missing = 0;
posts.forEach((p, i) => {
  const r = byId.get(p.id);
  if (!r) {
    missing++;
    return;
  }
  for (let d = 0; d < dims; d++) buf[i * dims + d] = parseFloat(r[`dim_${d}`]);
});

fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify({ dims, posts }));
fs.writeFileSync(path.join(outDir, 'embeddings.bin'), Buffer.from(buf.buffer));
fs.copyFileSync(path.join(dataDir, 'agentic_tips.md'), path.join(outDir, 'agentic_tips.md'));
console.log(`[build-data] ${posts.length} posts, ${dims} dims, ${missing} missing embeddings`);
