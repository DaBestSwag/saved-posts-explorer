import type { ReactNode } from 'react';

const inline = (s: string): ReactNode[] =>
  s.split(/(\*\*[^*]+\*\*)/g).map((t, i) => (t.startsWith('**') && t.endsWith('**') && t.length > 4 ? <strong key={i}>{t.slice(2, -2)}</strong> : t));

/** Tiny safe renderer: paragraphs, "- " bullets, "1." lists, **bold**. React elements only. */
export function Markdown({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((t, i) => <li key={i}>{inline(t)}</li>);
    out.push(list.ordered ? <ol key={out.length}>{items}</ol> : <ul key={out.length}>{items}</ul>);
    list = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const b = /^[-*•]\s+(.*)/.exec(line);
    const n = /^\d+[.)]\s+(.*)/.exec(line);
    const m = b || n;
    if (m) {
      const ordered = !!n;
      if (list && list.ordered !== ordered) flush();
      (list ??= { ordered, items: [] }).items.push(m[1]);
    } else {
      flush();
      if (line) out.push(<p key={out.length}>{inline(line)}</p>);
    }
  }
  flush();
  return <div className="md">{out}</div>;
}
