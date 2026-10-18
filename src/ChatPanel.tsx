import { useEffect, useRef, useState } from 'react';
import type { Post } from './lib/types';
import { askAI, postText, type AISettings, type ChatMsg } from './lib/ai';
import { AIControls } from './AIControls';
import { Markdown } from './Markdown';
import { Sheet } from './Sheet';

const CAP = 40;
const QUICK = [
  { label: 'Summarize', msg: 'Summarize this post in 3–5 bullets.' },
  { label: 'Steps / list', msg: 'Pull out any steps, recipe, list or instructions from this post as a clean list.' },
  { label: 'Key takeaways', msg: 'What are the key takeaways and anything worth trying?' },
];

const load = (id: string): ChatMsg[] => {
  try {
    const v = JSON.parse(localStorage.getItem(`spe.chat.${id}`) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
// Keep the newest CAP messages, starting on a user turn.
const cap = (m: ChatMsg[]) => {
  const t = m.slice(-CAP);
  while (t.length && t[0].role !== 'user') t.shift();
  return t;
};

function useChat(post: Post | null, ai: AISettings) {
  const id = post?.id ?? '';
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const cur = useRef(id);
  cur.current = id;

  useEffect(() => {
    setMessages(id ? load(id) : []);
    setBusy(false);
    setErr('');
  }, [id]);

  const commit = (pid: string, m: ChatMsg[]) => {
    try {
      localStorage.setItem(`spe.chat.${pid}`, JSON.stringify(m));
    } catch {
      /* ignore */
    }
    if (cur.current === pid) setMessages(m);
  };

  const send = async (text: string, base: ChatMsg[] = messages) => {
    if (!post || busy || !text.trim()) return;
    const next = cap([...base, { role: 'user', content: text.trim() }]);
    commit(id, next);
    setBusy(true);
    setErr('');
    try {
      const r = await askAI<{ text: string }>({ kind: 'post', engine: ai.engine, model: ai.model, post: postText(post), messages: next });
      commit(id, cap([...next, { role: 'assistant', content: r.text }]));
    } catch (e) {
      if (cur.current === id) setErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (cur.current === id) setBusy(false);
    }
  };
  const retry = () => {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') send(last.content, messages.slice(0, -1));
  };
  const clear = () => {
    try {
      localStorage.removeItem(`spe.chat.${id}`);
    } catch {
      /* ignore */
    }
    setMessages([]);
    setErr('');
  };
  return { messages, busy, err, send, retry, clear };
}

function Composer({ onSend, busy, inputRef }: { onSend: (t: string) => void; busy: boolean; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const [text, setText] = useState('');
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };
  const submit = () => {
    if (!text.trim() || busy) return;
    onSend(text);
    setText('');
    if (inputRef.current) inputRef.current.style.height = '';
  };
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={text}
        placeholder="Ask about this post…"
        aria-label="Message Claude"
        onChange={(e) => {
          setText(e.target.value);
          grow(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button type="submit" className="btn big send" disabled={!text.trim() || busy} aria-label="Send">
        ↑
      </button>
    </form>
  );
}

/** One chat for the post: bottom sheet on phones, right-hand drawer elsewhere. Stays mounted so it can animate out. */
export function ChatPanel({ post, open, onClose, ai, phone, onSimilar }: { post: Post | null; open: boolean; onClose: () => void; ai: AISettings; phone: boolean; onSimilar: (p: Post) => void }) {
  const chat = useChat(post, ai);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // newest message / typing dots into view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [chat.messages.length, chat.busy, chat.err]);

  // drawer: Esc closes, focus the input, give focus back afterwards
  useEffect(() => {
    if (!open || phone) return;
    const back = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, [open, phone, onClose]);

  // phone: keep the sheet above the on-screen keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !phone || !vv) return;
    const set = () => {
      const root = document.documentElement.style;
      root.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
      root.setProperty('--vvh', `${vv.height}px`);
    };
    set();
    vv.addEventListener('resize', set);
    vv.addEventListener('scroll', set);
    return () => {
      vv.removeEventListener('resize', set);
      vv.removeEventListener('scroll', set);
      document.documentElement.style.removeProperty('--kb');
      document.documentElement.style.removeProperty('--vvh');
    };
  }, [open, phone]);

  const who = post?.author ? `@${post.author}` : 'this post';
  const cap = post ? (post.caption.length > 120 ? `${post.caption.slice(0, 120).trimEnd()}…` : post.caption) : '';

  const body = post && (
    <>
      <div className="chat-post">
        <strong>{who}</strong>
        {cap && <p className="muted">{cap}</p>}
      </div>
      <AIControls ai={ai} />
      <div className="chips tight" role="group" aria-label="Quick actions">
        {QUICK.map((q) => (
          <button key={q.label} className="chip qa" disabled={chat.busy} onClick={() => chat.send(q.msg)}>
            {q.label}
          </button>
        ))}
        <button className="chip qa" onClick={() => onSimilar(post)}>Find similar</button>
      </div>
      <div className="chat-msgs" aria-live="polite">
        {chat.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === 'user' ? m.content : <Markdown text={m.content} />}
          </div>
        ))}
        {chat.busy && (
          <div className="bubble assistant typing" aria-label="Claude is typing">
            <i /><i /><i />
          </div>
        )}
        {chat.err && (
          <div className="bubble err" role="alert">
            {chat.err} <button className="link" onClick={chat.retry}>Retry</button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {chat.messages.length > 0 && (
        <button className="link clear" onClick={chat.clear}>Clear chat</button>
      )}
    </>
  );
  const composer = <Composer key={post?.id} onSend={chat.send} busy={chat.busy} inputRef={inputRef} />;
  const title = `Ask about ${who}`;

  if (phone)
    return (
      <Sheet open={open} onClose={onClose} title={title} footer={composer} className="chat-sheet">
        {body}
      </Sheet>
    );
  return (
    <div className={`drawer-wrap ${open ? 'open' : ''}`} inert={!open}>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="btn sm" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="drawer-body">{body}</div>
        <div className="drawer-foot">{composer}</div>
      </aside>
    </div>
  );
}

