// Instant keyword search. Plain TS, no browser APIs, so Node (tsx) can import it too.
import type { Post } from './types';

const STOP = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by
  can could did do does doing down during each few for from further had has have having he her here hers him his how i if in
  into is it its just me more most my no nor not of off on once only or other our out over own same she should so some such
  than that the their them then there these they this those through to too under until up very was we were what when where
  which while who whom why will with would you your`
    .split(/\s+/)
    .filter(Boolean),
);

const FIELD_W = { author: 3, hashtags: 2, caption: 2, desc: 1, transcript: 1, imageText: 1 } as const;
type Field = keyof typeof FIELD_W;

/** Lowercase, split on non-letters/digits, light plural stemming. Keeps stopwords out only if `dropStop`. */
export function tokenize(text: string, dropStop = true): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    if (dropStop && STOP.has(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

const norm = (text: string) => ' ' + tokenize(text, false).join(' ') + ' ';

interface Doc {
  tf: Map<string, number>[]; // one per field, same order as FIELDS
  phrase: string; // normalized full text for phrase match
}
const FIELDS: Field[] = ['author', 'hashtags', 'caption', 'desc', 'transcript', 'imageText'];

export interface KeywordIndex {
  /** Score for every post (0 = no match). Aligned with the posts array given to buildKeywordIndex. */
  search(query: string): Float64Array;
}

export function buildKeywordIndex(posts: Post[]): KeywordIndex {
  const df = new Map<string, number>();
  const docs: Doc[] = posts.map((p) => {
    const seen = new Set<string>();
    const tf = FIELDS.map((f) => {
      const m = new Map<string, number>();
      for (const t of tokenize(p[f] ?? '')) {
        m.set(t, (m.get(t) ?? 0) + 1);
        seen.add(t);
      }
      return m;
    });
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
    return { tf, phrase: norm(`${p.author} ${p.caption} ${p.hashtags} ${p.desc} ${p.transcript} ${p.imageText}`) };
  });
  const N = posts.length;
  const idf = (t: string) => Math.log(1 + N / (1 + (df.get(t) ?? 0)));

  return {
    search(query: string) {
      const scores = new Float64Array(N);
      const qt = [...new Set(tokenize(query))];
      if (!qt.length) return scores;
      const qIdf = qt.map(idf);
      const idfSum = qIdf.reduce((a, b) => a + b, 0);
      const phrase = qt.length > 1 ? ' ' + tokenize(query).join(' ') + ' ' : '';
      for (let i = 0; i < N; i++) {
        const d = docs[i];
        let s = 0;
        let covered = 0; // idf mass of matched terms
        for (let k = 0; k < qt.length; k++) {
          let best = 0;
          for (let f = 0; f < FIELDS.length; f++) {
            const c = d.tf[f].get(qt[k]);
            if (c) best += FIELD_W[FIELDS[f]] * (1 + Math.log(c));
          }
          if (best) {
            s += qIdf[k] * best;
            covered += qIdf[k];
          }
        }
        if (!covered) continue;
        const coverage = covered / idfSum;
        s *= coverage * coverage; // posts matching all terms beat posts repeating one term
        if (phrase && d.phrase.includes(phrase)) s *= 3;
        scores[i] = s;
      }
      return scores;
    },
  };
}

/** Indices with score > 0, best first. */
export function rankByScore(scores: ArrayLike<number>): number[] {
  const idx: number[] = [];
  for (let i = 0; i < scores.length; i++) if (scores[i] > 0) idx.push(i);
  return idx.sort((a, b) => scores[b] - scores[a]);
}
