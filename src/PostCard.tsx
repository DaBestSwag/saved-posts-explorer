import { useState } from 'react';
import type { Post } from './lib/types';
import { catHue } from './lib/cats';

const num = new Intl.NumberFormat('en-US');
const TYPE_LABEL: Record<string, string> = { VIDEO: 'Video', IMAGE: 'Image', CAROUSEL_ALBUM: 'Carousel' };

function fmtDate(s: string) {
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PostCard({ post: p, index = 0 }: { post: Post; index?: number }) {
  const [open, setOpen] = useState(false);
  const long = p.caption.length > 200 || p.caption.split('\n').length > 3;
  return (
    <article className="card" style={{ '--i': Math.min(index, 12) } as React.CSSProperties}>
      <header className="card-head">
        <div className="who">
          <strong>{p.author ? `@${p.author}` : 'Unavailable post'}</strong>
          {p.authorName && <span className="muted"> {p.authorName}</span>}
        </div>
        <span className={`badge t-${p.mediaType.toLowerCase()}`}>{TYPE_LABEL[p.mediaType] ?? (p.mediaType || 'Post')}</span>
      </header>
      <div className="meta muted">
        {fmtDate(p.published) && <span>{fmtDate(p.published)}</span>}
        <span>♥ {num.format(p.likes)}</span>
        <span>💬 {num.format(p.comments)}</span>
      </div>
      {p.caption && (
        <div className="cap">
          <p className={open ? 'open' : 'clamped'}>{p.caption}</p>
          {long && (
            <button className="link" onClick={() => setOpen(!open)} aria-expanded={open}>
              {open ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
      {p.desc && (
        <details className="desc">
          <summary>In the video</summary>
          <p>{p.desc}</p>
        </details>
      )}
      <div className="chips tight">
        {p.categories.map((c) => (
          <span key={c} className="chip static" style={{ '--h': catHue(c) } as React.CSSProperties}>{c}</span>
        ))}
        {p.subcategories.map((c) => (
          <span key={c} className="chip static sub" style={{ '--h': 215 } as React.CSSProperties}>{c}</span>
        ))}
      </div>
      {p.url && (
        <a className="btn open-ig" href={p.url} target="_blank" rel="noopener noreferrer">
          Open on Instagram ↗
        </a>
      )}
    </article>
  );
}
