// Appends the rows in new-rows.json to data/categorized_saved_posts_full.csv and their bge-small embeddings to data/embeddings.csv.
// Append-only (existing lines are not rewritten) and safe to re-run: ids already present are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { pipeline } from '@xenova/transformers';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dir, '..', 'data');
const csvPath = path.join(dataDir, 'categorized_saved_posts_full.csv');
const embPath = path.join(dataDir, 'embeddings.csv');

const rows = JSON.parse(fs.readFileSync(path.join(dir, 'new-rows.json'), 'utf8'));
const text = fs.readFileSync(csvPath, 'utf8');
const header = Papa.parse(text.split(/\r?\n/, 1)[0]).data[0];
const have = new Set(Papa.parse(text, { header: true, skipEmptyLines: true }).data.map((r) => r.media_id));
const fresh = rows.filter((r) => !have.has(r.media_id));
console.log(`${rows.length} new rows, ${fresh.length} not yet in the CSV`);
if (!fresh.length) process.exit(0);

const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', { quantized: true });
const embLines = [];
for (const r of fresh) {
  // Same recipe as the existing vectors: caption + hashtags + description + author + categories.
  const t = [r.caption, r.hashtags, r.media_description, r.author, r.categories.split('; ').join(', ')].join(' ').slice(0, 2000);
  const out = await extractor(t, { pooling: 'cls', normalize: true });
  embLines.push([r.media_id, ...Array.from(out.data).map((v) => v.toFixed(4))].join(','));
}

const csvChunk = Papa.unparse({ fields: header, data: fresh.map((r) => header.map((h) => r[h] ?? '')) }, { header: false, newline: '\r\n' });
fs.appendFileSync(csvPath, csvChunk + '\r\n');
fs.appendFileSync(embPath, embLines.join('\r\n') + '\r\n');
console.log(`appended ${fresh.length} rows to the CSV and ${embLines.length} vectors (${embLines[0].split(',').length - 1} dims)`);
