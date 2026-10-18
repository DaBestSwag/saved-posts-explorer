import type { Post } from './lib/types';
import type { AISettings } from './lib/ai';
import { AIControls } from './AIControls';
import { PostCard } from './PostCard';

export type AskState = {
  query: string;
  count: number;
  status: 'loading' | 'done' | 'error';
  answer: string;
  picks: { post: Post; reason: string }[];
  error: string;
};

export function AISearchPanel({ ask, input, ai, open, setOpen, onClose, onRetry, onAsk }: { ask: AskState; input: string; ai: AISettings; open: boolean; setOpen: (v: boolean) => void; onClose: () => void; onRetry: () => void; onAsk?: (p: Post) => void }) {
  return (
    <section className="ai-panel" aria-label="Claude results" aria-busy={ask.status === 'loading'}>
      <div className="ai-head">
        <button className="ai-title" aria-expanded={open} onClick={() => setOpen(!open)}>
          <b>✨ Claude</b>
          <span className="muted ai-q">“{ask.query}”</span>
          <span className={`chev ${open ? 'open' : ''}`} aria-hidden>▾</span>
        </button>
        <button className="btn sm" onClick={onClose} aria-label="Close Claude results">×</button>
      </div>
      <div className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner">
          <AIControls ai={ai} />
          {input.trim() !== ask.query && <p className="muted ai-note">Showing the answer for “{ask.query}”. Press Enter to ask about “{input.trim()}”.</p>}
          {ask.status === 'loading' && (
            <div className="shimmer" role="status">
              <span>Reading {ask.count} posts…</span>
            </div>
          )}
          {ask.status === 'error' && (
            <p className="ai-error" role="alert">
              {ask.error} <button className="btn sm" onClick={onRetry}>Retry</button>
            </p>
          )}
          {ask.status === 'done' && (
            <>
              {ask.answer && <p className="ai-answer">{ask.answer}</p>}
              {ask.picks.length === 0 ? (
                <p className="muted">Claude didn’t find a strong match.</p>
              ) : (
                <div className="grid ai-grid">
                  {ask.picks.map((k, i) => (
                    <PostCard key={k.post.id} post={k.post} index={i} reason={k.reason} onAsk={onAsk} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
