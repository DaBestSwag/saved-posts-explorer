import { useEffect, useState } from 'react';
import type { Post } from './types';
import { useStored } from '../useStored';

export type Engine = 'sub' | 'api';
export type Model = 'haiku' | 'sonnet';
export type Engines = { sub: boolean; api: boolean };
export type ChatMsg = { role: 'user' | 'assistant'; content: string };
export type AIBody =
  | { kind: 'search'; query: string; candidates: { id: string; text: string }[] }
  | { kind: 'post'; post: string; messages: ChatMsg[] };
export type SearchReply = { picks: { id: string; reason: string }[]; answer: string };

const URL_AI = `${import.meta.env.BASE_URL}api/ai`;

export async function fetchEngines(): Promise<Engines> {
  try {
    const r = await fetch(`${URL_AI}/engines`);
    if (!r.ok) throw new Error();
    const j = await r.json();
    return { sub: !!j.sub, api: !!j.api };
  } catch {
    return { sub: false, api: false };
  }
}

export async function askAI<T = unknown>(body: AIBody & { engine: Engine; model: Model }): Promise<T> {
  let r: Response;
  try {
    r = await fetch(URL_AI, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Couldn't reach Claude. Check your connection and try again.");
  }
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) throw new Error(j?.error || `Claude request failed (${r.status}).`);
  return j as T;
}

/** The post as labelled plain text, for Claude to read. */
export function postText(p: Post): string {
  const parts: [string, string][] = [
    ['Author', [p.author && `@${p.author}`, p.authorName].filter(Boolean).join(' ')],
    ['Categories', [...p.categories, ...p.subcategories].join(', ')],
    ['Caption', p.caption],
    ['In the video', p.desc],
    [p.transcript ? 'Transcript' : 'Text in image', p.transcript || p.imageText],
    ['Hashtags', p.hashtags],
  ];
  return parts.filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v.trim()}`).join('\n\n');
}

let cached: Engines | null = null;

/** Which Claude engines exist plus the user's persisted engine/model choice (model is remembered per engine). */
export function useAISettings() {
  const [engines, setEngines] = useState<Engines | null>(cached);
  useEffect(() => {
    if (cached) return;
    fetchEngines().then((e) => {
      cached = e;
      setEngines(e);
    });
  }, []);
  const [stored, setStored] = useStored<Engine | ''>('spe.aiEngine', '');
  const [mSub, setMSub] = useStored<Model>('spe.aiModel.sub', 'sonnet');
  const [mApi, setMApi] = useStored<Model>('spe.aiModel.api', 'haiku');

  const avail = engines ?? { sub: false, api: false };
  const pref: Engine = stored || (avail.sub ? 'sub' : 'api');
  const other: Engine = pref === 'sub' ? 'api' : 'sub';
  const engine: Engine = !avail[pref] && avail[other] ? other : pref;
  return {
    engines: avail,
    available: avail.sub || avail.api,
    engine,
    setEngine: setStored as (e: Engine) => void,
    model: engine === 'sub' ? mSub : mApi,
    setModel: engine === 'sub' ? setMSub : setMApi,
  };
}
export type AISettings = ReturnType<typeof useAISettings>;
