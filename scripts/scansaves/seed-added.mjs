// One-off: writes data/added_dates.json (post id -> date it was added to the site) for rows appended after the original export.
// Rows with a rank_saved_order came from the original export and get no date ("Earlier").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const rows = Papa.parse(fs.readFileSync(path.join(dataDir, 'categorized_saved_posts_full.csv'), 'utf8').replace(/^﻿/, ''), { header: true, skipEmptyLines: true }).data;
const appended = rows.filter((r) => !r.rank_saved_order).map((r) => r.media_id);
const out = {};
// First 11 appended rows were added 2026-10-18, the next 19 on 2026-10-23.
appended.forEach((id, i) => (out[id] = i < 11 ? '2026-10-18' : '2026-10-23'));
fs.writeFileSync(path.join(dataDir, 'added_dates.json'), JSON.stringify(out, null, 1) + '\n');
console.log(appended.length, 'appended rows dated');
