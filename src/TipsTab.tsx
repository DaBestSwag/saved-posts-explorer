import { useEffect, useMemo, useState } from 'react';
import { filterTips, parseTips, type TipsDoc } from './lib/tips';

export function TipsTab() {
  const [doc, setDoc] = useState<TipsDoc | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/agentic_tips.md`)
      .then((r) => r.text())
      .then((t) => setDoc(parseTips(t)))
      .catch((e) => setErr(String(e)));
  }, []);

  const sections = useMemo(() => (doc ? filterTips(doc, q) : []), [doc, q]);
  const total = doc?.sections.reduce((n, s) => n + s.tips.length, 0) ?? 0;
  const shown = sections.reduce((n, s) => n + s.tips.length, 0);

  if (err) return <p className="empty">Could not load tips: {err}</p>;
  if (!doc) return <p className="empty">Loading…</p>;

  return (
    <div className="tips">
      <h2>{doc.title}</h2>
      <p className="muted intro">{doc.intro}</p>
      <div className="tips-filter">
        <input type="search" placeholder="Filter tips…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter tips" />
        <span className="muted" aria-live="polite">{shown} of {total} tips</span>
      </div>
      {sections.map((s) => (
        <details key={s.title} className="tip-section" open>
          <summary>
            <h3>{s.title}</h3>
            <span className="muted">{s.tips.length}</span>
          </summary>
          <ul>
            {s.tips.map((t, i) => (
              <li key={i} className="tip">
                <span>{t.text}</span>{' '}
                <span className="srcs">
                  {t.links.map((l, k) => (
                    <a key={k} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
      {shown === 0 && <p className="empty">No tips match “{q}”.</p>}
      <details className="tip-section notip">
        <summary>
          <h3>Posts with no extractable tip</h3>
          <span className="muted">{doc.noTip.length}</span>
        </summary>
        <ul>
          {doc.noTip.map((n, i) => (
            <li key={i}>
              <a href={n.url} target="_blank" rel="noopener noreferrer">@{n.author}</a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
