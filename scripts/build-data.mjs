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

// Hand-curated extra subcategories (id -> names); optional, "_parents" is metadata and skipped.
const extraFile = path.join(dataDir, 'extra_subcategories.json');
const extra = fs.existsSync(extraFile) ? JSON.parse(fs.readFileSync(extraFile, 'utf8')) : {};

// Hand-curated category fixes (id -> full category list); optional.
const overrideFile = path.join(dataDir, 'category_overrides.json');
const overrides = fs.existsSync(overrideFile) ? JSON.parse(fs.readFileSync(overrideFile, 'utf8')) : {};
// Subcategory -> parent categories; a subcategory is dropped when its post no longer has any parent.
const parentsOf = {};
for (const [parent, subs] of Object.entries({ ...(extra._parents || {}), Filmmaking: ['Music videos', 'Cinematography', 'Lighting', 'Color grading', 'Editing'] }))
  for (const s of subs) (parentsOf[s] ||= []).push(parent);

const rows = parseCsv('categorized_saved_posts_full.csv');
const posts = rows.map((r) => ({
  id: r.media_id,
  url: r.url || '',
  author: r.author || '',
  authorName: r.author_name || '',
  categories: split(r.categories),
  subcategories: [...new Set([...split(r.subcategories), ...(r.media_id === '_parents' ? [] : extra[r.media_id] || [])])],
  published: r.published || '',
  mediaType: r.media_type || '',
  postType: r.post_type || '',
  likes: int(r.likes),
  comments: int(r.comments),
  caption: r.caption || '',
  hashtags: r.hashtags || '',
  desc: r.media_description || '',
}));
for (const p of posts) {
  if (overrides[p.id]) p.categories = overrides[p.id];
  p.subcategories = p.subcategories.filter((s) => !parentsOf[s] || parentsOf[s].some((c) => p.categories.includes(c)));
}

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
