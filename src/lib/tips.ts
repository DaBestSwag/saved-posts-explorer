// Parser for agentic_tips.md. Format: setext headings (underlined with ---), bullets starting with "•",
// links written as bare "(https://...)" groups; final section lists "@author — url" lines.
export interface TipLink {
  url: string;
  label: 'video' | 'post';
}
export interface Tip {
  text: string;
  links: TipLink[];
}
export interface TipSection {
  title: string;
  tips: Tip[];
}
export interface TipsDoc {
  title: string;
  intro: string;
  sections: TipSection[];
  noTip: { author: string; url: string }[];
}

const labelFor = (url: string): 'video' | 'post' => (/\/(reel|tv)\//.test(url) ? 'video' : 'post');

export function parseTips(md: string): TipsDoc {
  const lines = md.replace(/\r/g, '').split('\n');
  const doc: TipsDoc = { title: '', intro: '', sections: [], noTip: [] };
  const isRule = (l: string | undefined, ch: string) => !!l && l.length >= 3 && new RegExp(`^${ch}+$`).test(l.trim());
  let cur: TipSection | null = null;
  let inNoTip = false;
  const intro: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const next = lines[i + 1];
    if (!l.trim()) continue;
    if (isRule(next, '=') && !isRule(l, '=')) {
      doc.title = l.trim();
      i++;
      continue;
    }
    const atx = /^##\s+(.*)$/.exec(l);
    if (atx || (isRule(next, '-') && !l.startsWith('•'))) {
      const title = (atx ? atx[1] : l).trim();
      if (!atx) i++;
      inNoTip = /no extractable tip/i.test(title);
      cur = inNoTip ? null : { title, tips: [] };
      if (cur) doc.sections.push(cur);
      continue;
    }
    const bullet = /^\s*(?:[•\-*])\s+(.*)$/.exec(l);
    if (bullet) {
      const body = bullet[1];
      if (inNoTip) {
        const m = /@?([\w.]+)\s*[—-]\s*(https?:\/\/\S+)/.exec(body);
        if (m) doc.noTip.push({ author: m[1], url: m[2] });
      } else if (cur) {
        const urls: string[] = [];
        const text = body
          .replace(/\[(?:video|post)\]\((https?:\/\/[^)\s]+)\)/g, (_, u) => (urls.push(u), ''))
          .replace(/\((https?:\/\/[^)\s]+)\)/g, (_, u) => (urls.push(u), ''))
          .replace(/\s+/g, ' ')
          .trim();
        cur.tips.push({ text, links: urls.map((url) => ({ url, label: labelFor(url) })) });
      }
      continue;
    }
    if (!cur && !inNoTip) intro.push(l.trim());
  }
  doc.intro = intro.join(' ');
  return doc;
}

export function filterTips(doc: TipsDoc, q: string): TipSection[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return doc.sections;
  return doc.sections
    .map((s) => ({ ...s, tips: s.tips.filter((t) => terms.every((w) => t.text.toLowerCase().includes(w))) }))
    .filter((s) => s.tips.length);
}
