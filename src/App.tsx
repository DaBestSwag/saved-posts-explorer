import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Post, PostsFile } from './lib/types';
import { buildKeywordIndex, rankByScore } from './lib/keyword';
import { parseQuery, rankHybrid } from './lib/semantic';
import { CATEGORIES, SUB_PARENTS, catHue } from './lib/cats';
import { useStored } from './useStored';
import { PostCard } from './PostCard';
import { Sheet } from './Sheet';
import { useLayout } from './useLayout';

const BASE = import.meta.env.BASE_URL;
const PAGE = 60;
const TYPES = [
  { v: 'ALL', label: 'All' },
  { v: 'VIDEO', label: 'Videos' },
  { v: 'IMAGE', label: 'Images' },
  { v: 'CAROUSEL_ALBUM', label: 'Carousels' },
];
type Sort = 'best' | 'new' | 'old' | 'liked';
type SemStatus = 'idle' | 'loading' | 'ready' | 'error';

const num = new Intl.NumberFormat('en-US');

export default function App() {
  const [filtersOpen, setFiltersOpen] = useStored<boolean>('spe.filtersOpen', true);
  const [data, setData] = useState<PostsFile | null>(null);
  const [loadError, setLoadError] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [type, setType] = useState('ALL');
  const [sort, setSort] = useState<Sort>('best');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState(''); // debounced
  const [shown, setShown] = useState(PAGE);
  const [surprise, setSurprise] = useState<Post | null>(null);
  const layout = useLayout();
  const [sheet, setSheet] = useState(false); // phone filter sheet
  const closeSheet = useCallback(() => setSheet(false), []);
  useEffect(() => {
    if (layout !== 'phone') setSheet(false);
  }, [layout]);

  // --- data
  useEffect(() => {
    fetch(`${BASE}data/posts.json`)
      .then((r) => r.json())
      .then((d: PostsFile) => setData(d))
      .catch((e) => setLoadError(String(e)));
  }, []);
  const posts = data?.posts ?? [];
  const kwIndex = useMemo(() => (data ? buildKeywordIndex(data.posts) : null), [data]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) for (const c of p.categories) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [posts]);
  const subCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) for (const c of p.subcategories) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [posts]);

  // --- semantic worker (lazy: started on first search focus/typing)
  const workerRef = useRef<Worker | null>(null);
  const embRef = useRef<Float32Array | null>(null);
  const [status, setStatus] = useState<SemStatus>('idle');
  const [vec, setVec] = useState<{ text: string; v: Float32Array } | null>(null);
  const [progress, setProgress] = useState(0); // 0..1 of the model file

  const startSemantic = () => {
    if (workerRef.current || !data) return;
    setStatus('loading');
    const w = new Worker(new URL('./semantic.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      // Track only the 32 MB .onnx file: the small config/tokenizer files finish first
      // and would make a combined percentage jump to 100% and back.
      if (m.type === 'progress') {
        if (m.file.endsWith('.onnx') && m.total) setProgress(m.loaded / m.total);
      } else if (m.type === 'ready') {
        fetch(`${BASE}data/embeddings.bin`)
          .then((r) => r.arrayBuffer())
          .then((buf) => {
            embRef.current = new Float32Array(buf);
            setStatus('ready');
          })
          .catch(() => setStatus('error'));
      } else if (m.type === 'vec') setVec({ text: m.text, v: m.vec });
      else if (m.type === 'error') setStatus('error');
    };
    w.onerror = () => setStatus('error');
    w.postMessage({ type: 'init' });
  };
  const retrySemantic = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setProgress(0);
    startSemantic();
  };
  useEffect(() => () => workerRef.current?.terminate(), []);

  const parsed = useMemo(() => parseQuery(query), [query]);
  const searchText = query.trim() ? parsed.text : '';

  useEffect(() => {
    if (status === 'ready' && searchText) workerRef.current?.postMessage({ type: 'embed', text: searchText });
  }, [status, searchText]);

  // debounce typing
  useEffect(() => {
    const t = setTimeout(() => setQuery(input), 200);
    return () => clearTimeout(t);
  }, [input]);

  const onInput = (v: string) => {
    setInput(v);
    startSemantic();
    if (parseQuery(v).wantsVideos && v.trim()) setType('VIDEO');
  };

  // --- filtering + ranking
  const passes = useMemo(() => {
    // A post matches a picked category; if subcategories of that category are picked too,
    // it must also have one of them. Other picked categories are unaffected.
    const inCat = (p: Post, c: string) => {
      if (!p.categories.includes(c)) return false;
      const picked = (SUB_PARENTS[c] ?? []).filter((s) => subs.includes(s));
      return !picked.length || p.subcategories.some((s) => picked.includes(s));
    };
    return (p: Post) => (!cats.length || cats.some((c) => inCat(p, c))) && (type === 'ALL' || p.mediaType === type);
  }, [cats, subs, type]);

  const semanticLive = status === 'ready' && !!searchText && vec?.text === searchText && !!embRef.current;

  const results: Post[] = useMemo(() => {
    if (!data) return [];
    let ordered: Post[];
    if (searchText && kwIndex) {
      const kw = kwIndex.search(searchText);
      if (semanticLive && embRef.current) {
        const ranked = rankHybrid(vec!.v, embRef.current, data.dims, kw, (i) => passes(data.posts[i]));
        ordered = ranked.map((r) => data.posts[r.i]);
      } else {
        ordered = rankByScore(kw).map((i) => data.posts[i]).filter(passes);
      }
    } else ordered = data.posts.filter(passes);

    const eff: Sort = sort === 'best' && !searchText ? 'new' : sort;
    if (eff === 'new') return [...ordered].sort((a, b) => b.published.localeCompare(a.published));
    if (eff === 'old') return [...ordered].sort((a, b) => a.published.localeCompare(b.published));
    if (eff === 'liked') return [...ordered].sort((a, b) => b.likes - a.likes);
    return ordered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, kwIndex, searchText, passes, sort, semanticLive, vec]);

  useEffect(() => setShown(PAGE), [cats, subs, type, sort, searchText]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  // Un-picking a category also drops its subcategories, which are hidden with it.
  const toggleCat = (c: string) => {
    if (cats.includes(c)) setSubs(subs.filter((s) => !SUB_PARENTS[c]?.includes(s)));
    toggle(cats, setCats, c);
  };
  const clearFilters = () => {
    setCats([]);
    setSubs([]);
    setType('ALL');
  };
  const clearAll = () => {
    clearFilters();
    setSort('best');
    setInput('');
    setQuery('');
    setSurprise(null);
  };
  const active = cats.length + subs.length + (type !== 'ALL' ? 1 : 0);
  const dirty = active || input || sort !== 'best';
  const doSurprise = () => {
    const pool = data ? (results.length ? results : []) : [];
    if (pool.length) setSurprise(pool[Math.floor(Math.random() * pool.length)]);
  };

  const statusLabel =
    status === 'ready' ? 'Semantic search ready' : status === 'loading' ? `Downloading search model… ${Math.round(progress * 100)}%` : status === 'error' ? 'Keyword search (semantic model unavailable)' : 'Keyword search';

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <h1 className="brand">Saved Posts</h1>
          {(
            <div className="search">
              <input
                type="search"
                placeholder="Search by meaning, e.g. “videos about ICE”"
                value={input}
                onFocus={startSemantic}
                onChange={(e) => onInput(e.target.value)}
                aria-label="Search posts"
              />
              <div className="sem">
                <span className={`status ${status}`} title={statusLabel}>
                  <i /> {statusLabel}
                </span>
                {status === 'idle' && (
                  <button className="btn sm dl" onClick={startSemantic} disabled={!data}>
                    Download <span className="not-phone">search </span>model · 32 MB
                  </button>
                )}
                {status === 'loading' && (
                  <span className="dl-bar" role="progressbar" aria-label="Search model download" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                    <span style={{ transform: `scaleX(${progress})` }} />
                  </span>
                )}
                {status === 'error' && (
                  <button className="btn sm dl" onClick={retrySemantic}>
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={layout}>
        {loadError ? (
          <p className="empty">Could not load data: {loadError}</p>
        ) : !data ? (
          <p className="empty">Loading…</p>
        ) : (
          (() => {
            const catChip = (c: string) => (
              <button key={c} className={`chip ${cats.includes(c) ? 'on' : ''}`} style={{ '--h': catHue(c) } as React.CSSProperties} aria-pressed={cats.includes(c)} onClick={() => toggleCat(c)}>
                {c} <b>{catCounts.get(c) ?? 0}</b>
              </button>
            );
            const subChip = (c: string) => (
              <button key={c} className={`chip ${subs.includes(c) ? 'on' : ''}`} style={{ '--h': catHue(c) } as React.CSSProperties} aria-pressed={subs.includes(c)} onClick={() => toggle(subs, setSubs, c)}>
                {c} <b>{subCounts.get(c) ?? 0}</b>
              </button>
            );
            // Picked categories that have subcategories, in category order.
            const subGroups = CATEGORIES.filter((c) => cats.includes(c) && SUB_PARENTS[c]?.length);
            // One set of filter controls, placed per device: sidebar (desktop), folding panel (iPad), sheet (phone).
            const filterBody = (
              <>
                <div className="group-label">Categories</div>
                <div className="chips">{CATEGORIES.map(catChip)}</div>
                {subGroups.map((parent) => (
                  <div key={parent} className="sub-group">
                    <div className="group-label">{parent} types</div>
                    <div className="chips">{SUB_PARENTS[parent].map(subChip)}</div>
                  </div>
                ))}
                <div className="group-label">Media type</div>
                <div className="seg" role="group" aria-label="Media type">
                  {TYPES.map((t) => (
                    <button key={t.v} className={type === t.v ? 'on' : ''} aria-pressed={type === t.v} onClick={() => setType(t.v)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            );
            const filtersLabel = `Filters${active ? ` · ${active} active` : ''}`;
            const feed = (
              <>
            <div className="toolbar">
              <div className="count" aria-live="polite">
                Showing {num.format(Math.min(shown, results.length))} of {num.format(data.posts.length)}
                {results.length !== data.posts.length && <span className="muted"> · {num.format(results.length)} match</span>}
              </div>
              <div className="tools">
                {layout === 'phone' && (
                  <button className={`btn filt ${active ? 'has' : ''}`} onClick={() => setSheet(true)} aria-haspopup="dialog">
                    Filters{active ? ` · ${active}` : ''}
                  </button>
                )}
                <label className="sort">
                  <span className="sr">Sort</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="best">Best match</option>
                    <option value="new">Newest</option>
                    <option value="old">Oldest</option>
                    <option value="liked">Most liked</option>
                  </select>
                </label>
                <button className="btn" onClick={doSurprise} disabled={!results.length}>Surprise me</button>
                <button className="btn ghost" onClick={clearAll} disabled={!dirty}>Clear all</button>
              </div>
            </div>

            {surprise && (
              <div className="surprise">
                <div className="surprise-head">
                  <span>Surprise pick</span>
                  <span>
                    <button className="btn ghost sm" onClick={doSurprise}>Another</button>
                    <button className="btn ghost sm" onClick={() => setSurprise(null)}>Close</button>
                  </span>
                </div>
                <PostCard key={surprise.id} post={surprise} />
              </div>
            )}

            {results.length === 0 ? (
              <p className="empty">No posts match. Try clearing a filter.</p>
            ) : (
              <>
                <div className="grid">
                  {results.slice(0, shown).map((p, i) => (
                    <PostCard key={p.id} post={p} index={i % PAGE} />
                  ))}
                </div>
                {shown < results.length && (
                  <div className="more">
                    <button className="btn big" onClick={() => setShown(shown + PAGE)}>
                      Show more ({num.format(results.length - shown)} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
              </>
            );

            if (layout === 'desktop')
              return (
                <div className="layout">
                  <aside className="side" aria-label="Filters">
                    <div className="side-head">
                      <span>{filtersLabel}</span>
                      <button className="btn ghost sm" onClick={clearFilters} disabled={!active}>Reset</button>
                    </div>
                    {filterBody}
                  </aside>
                  <div className="content">{feed}</div>
                </div>
              );
            if (layout === 'phone')
              return (
                <>
                  <div className="quick" role="group" aria-label="Categories">{CATEGORIES.map(catChip)}</div>
                  {subGroups.length > 0 && (
                    <div className="quick sub-row" role="group" aria-label="Subcategories">
                      {subGroups.flatMap((p) => SUB_PARENTS[p]).map(subChip)}
                    </div>
                  )}
                  {feed}
                  <Sheet
                    open={sheet}
                    onClose={closeSheet}
                    title={filtersLabel}
                    footer={
                      <div className="sheet-actions">
                        <button className="btn ghost" onClick={clearFilters} disabled={!active}>Reset</button>
                        <button className="btn big" onClick={closeSheet}>Show {num.format(results.length)} posts</button>
                      </div>
                    }
                  >
                    {filterBody}
                  </Sheet>
                </>
              );
            return (
              <>
                <section className="panel">
                  <button className="panel-head" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
                    <span>{filtersLabel}</span>
                    <span className={`chev ${filtersOpen ? 'open' : ''}`} aria-hidden>▾</span>
                  </button>
                  <div className={`collapse ${filtersOpen ? 'open' : ''}`}>
                    <div className="collapse-inner">{filterBody}</div>
                  </div>
                </section>
                {feed}
              </>
            );
          })()
        )}
      </main>
    </>
  );
}
