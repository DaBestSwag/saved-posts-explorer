// Shared semantic-search logic (used by the browser worker and by Node check scripts).
export const MODEL = 'Xenova/bge-small-en-v1.5';
export const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';
export const POOLING = 'cls' as const;

/** Detects "video(s)" intent and strips filler so it doesn't pollute the embedding or keyword score. */
export function parseQuery(raw: string): { text: string; wantsVideos: boolean } {
  const wantsVideos = /\bvideos?\b|\breels?\b/i.test(raw);
  let text = raw
    .replace(/\b(?:show me|find me|find|any|all|some)\b/gi, ' ')
    .replace(/\b(?:videos?|reels?)\b(?:\s+(?:about|of|on|with|regarding|showing))?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) text = raw.trim();
  return { text, wantsVideos };
}

type Extractor = (t: string, o: { pooling: 'cls' | 'mean'; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>;

export async function embedQuery(extractor: Extractor, text: string): Promise<Float32Array> {
  const out = await extractor(QUERY_PREFIX + text, { pooling: POOLING, normalize: true });
  return Float32Array.from(out.data as ArrayLike<number>);
}

export interface Ranked {
  i: number;
  score: number;
  cos: number;
}

export const KW_WEIGHT = 0.12; // max boost a perfect keyword hit adds to cosine
export const MIN_COS = 0.5; // absolute floor (bge-small cosines for related text sit ~0.5-0.85)
export const TOP_MARGIN = 0.12; // keep results within this of the best hybrid score

/**
 * Hybrid ranking: cosine + small keyword boost, then cut off weak tail.
 * `eligible` limits candidates (used by filters upstream; optional).
 */
export function rankHybrid(
  qvec: Float32Array,
  emb: Float32Array,
  dims: number,
  kw: ArrayLike<number> | null,
  eligible?: (i: number) => boolean,
): Ranked[] {
  const n = emb.length / dims;
  let kwMax = 0;
  if (kw) for (let i = 0; i < n; i++) if (kw[i] > kwMax) kwMax = kw[i];
  const all: Ranked[] = [];
  for (let i = 0; i < n; i++) {
    if (eligible && !eligible(i)) continue;
    let cos = 0;
    const o = i * dims;
    for (let d = 0; d < dims; d++) cos += qvec[d] * emb[o + d];
    const boost = kw && kwMax > 0 ? KW_WEIGHT * (kw[i] / kwMax) : 0;
    all.push({ i, cos, score: cos + boost });
  }
  all.sort((a, b) => b.score - a.score);
  if (!all.length) return all;
  const cut = Math.max(all[0].score - TOP_MARGIN, MIN_COS);
  return all.filter((r) => r.score >= cut);
}
