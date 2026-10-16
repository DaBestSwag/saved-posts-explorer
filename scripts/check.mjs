// Acceptance checks for data, keyword search and tips. Run: npm run check
// Imports the app's real TS modules directly (Node 22+ strips types; those modules only use `import type`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { buildKeywordIndex, rankByScore } = await import('../src/lib/keyword.ts');
const { parseTips, filterTips } = await import('../src/lib/tips.ts');
const { posts } = JSON.parse(fs.readFileSync(path.join(root, 'public/data/posts.json'), 'utf8'));

let failed = 0;
const ok = (name, cond, detail = '') => {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
};
const tally = (key) => {
  const m = {};
  for (const p of posts) for (const c of p[key]) m[c] = (m[c] ?? 0) + 1;
  return m;
};
const same = (got, want) => Object.keys(want).every((k) => got[k] === want[k]) && Object.keys(got).length === Object.keys(want).length;

ok('posts count 1668', posts.length === 1668, String(posts.length));
const wantCats = { Politics: 463, Other: 395, Filmmaking: 354, Basketball: 125, 'Agentic coding': 114, 'Movies and TV': 62, Music: 60, Memes: 53, 'Going out': 26, Gaming: 47, Cooking: 29, 'Food out': 34, Workout: 26, 'Other sports': 20, Massage: 11, Science: 10 };
const wantSubs = { 'Music videos': 76, Cinematography: 22, Lighting: 19, 'Color grading': 12, Editing: 8, American: 10, Asian: 7, Italian: 3, Mexican: 3, 'Baking & desserts': 2, 'Daytime activities': 12, Bars: 9, Clubs: 5 };
const cats = tally('categories');
const subs = tally('subcategories');
ok('category counts', same(cats, wantCats), JSON.stringify(cats));
ok('subcategory counts', same(subs, wantSubs), JSON.stringify(subs));
const fl = posts.filter((p) => p.categories.includes('Filmmaking') && p.subcategories.includes('Lighting')).length;
ok('Filmmaking ∩ Lighting = 19', fl === 19, String(fl));

const idx = buildKeywordIndex(posts);
for (const q of ['the K-shaped economy']) {
  const r = rankByScore(idx.search(q));
  const top = posts[r[0]];
  ok(`keyword "${q}" ranks @wehavethedata #1`, top?.author === 'wehavethedata', `top=@${top?.author} url=${top?.url} (${r.length} hits)`);
}
const r2 = rankByScore(idx.search('sub agents in Claude Code')).slice(0, 10).map((i) => posts[i].author);
console.log('info  keyword top10 for "sub agents in Claude Code":', r2.join(', '));

const doc = parseTips(fs.readFileSync(path.join(root, 'public/data/agentic_tips.md'), 'utf8'));
const total = doc.sections.reduce((n, s) => n + s.tips.length, 0);
ok('tips: 65 tips under 8 sections', total === 65 && doc.sections.length === 8, `${total} tips, ${doc.sections.length} sections`);
ok('tips: every tip has >=1 link', doc.sections.every((s) => s.tips.every((t) => t.links.length > 0)));
const wt = filterTips(doc, 'worktree').flatMap((s) => s.tips);
ok('tips: "worktree" matches exactly 1', wt.length === 1, wt[0]?.text.slice(0, 70));
console.log(`info  no-tip posts: ${doc.noTip.length}`);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
