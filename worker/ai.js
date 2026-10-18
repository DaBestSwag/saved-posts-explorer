// Claude features shared by both engines: the Worker (API credits) and the local
// dev server (Claude Code subscription). Both build the same prompt here.

/** Model per engine and size. API defaults to Haiku, subscription to Sonnet (the client picks). */
export const API_MODELS = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5' };

const SEARCH_SYSTEM = `You help one person search their own saved Instagram posts.
You get their question and a numbered list of candidate posts (caption, category, video transcript excerpt).
Pick the posts that genuinely match what they mean, best first. Skip weak matches; picking none is fine.
For each pick give a short reason (under 15 words) pointing at the detail that matches.
If the question asks something answerable from the posts, add a one- or two-sentence answer; otherwise leave answer empty.`;

const POST_SYSTEM = `You help one person with a single Instagram post they saved.
Answer from the post's caption and video transcript. Never present anything as coming from the post unless the post says it.
If the post doesn't cover something (captions are often cut off), say so plainly, then you may add general knowledge under a line starting "Not in the post:".
Be concise and practical. Use short markdown lists when listing steps or items. No preamble.`;

export const SEARCH_SCHEMA = {
  type: 'object',
  properties: {
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: { n: { type: 'integer' }, reason: { type: 'string' } },
        required: ['n', 'reason'],
        additionalProperties: false,
      },
    },
    answer: { type: 'string' },
  },
  required: ['picks', 'answer'],
  additionalProperties: false,
};

const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '');

/** Validates the client's body and turns it into { system, messages, json }. Throws on bad input. */
export function buildPrompt(body) {
  if (!body || typeof body !== 'object') throw new Error('Missing body');
  if (body.kind === 'search') {
    const query = String(body.query || '').trim();
    const cands = Array.isArray(body.candidates) ? body.candidates.slice(0, 60) : [];
    if (!query || !cands.length) throw new Error('Need a query and candidates');
    const list = cands
      .map((c, i) => `[${i}] ${clip(String(c.text || ''), 900)}`)
      .join('\n\n');
    return {
      system: SEARCH_SYSTEM,
      messages: [{ role: 'user', content: `Candidates:\n\n${list}\n\nQuestion: ${clip(query, 500)}` }],
      json: true,
    };
  }
  if (body.kind === 'post') {
    const post = String(body.post || '').trim();
    const chat = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!post || !chat.length) throw new Error('Need a post and a message');
    const messages = chat
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: clip(m.content, 4000) }));
    if (messages[0]?.role !== 'user') throw new Error('Chat must start with a user message');
    messages[0] = { role: 'user', content: `The post:\n\n${clip(post, 12000)}\n\n---\n\n${messages[0].content}` };
    return { system: POST_SYSTEM, messages, json: false };
  }
  throw new Error('Unknown kind');
}

/** Maps search picks (candidate numbers) back to post ids the client sent. */
export function shapeResult(body, prompt, raw) {
  if (!prompt.json) return { text: raw.trim() };
  const parsed = typeof raw === 'string' ? JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) : raw;
  const cands = body.candidates;
  const picks = (parsed.picks || [])
    .filter((p) => Number.isInteger(p.n) && cands[p.n])
    .map((p) => ({ id: cands[p.n].id, reason: String(p.reason || '') }));
  return { picks, answer: String(parsed.answer || '') };
}

/** Worker engine: calls the Claude API with the ANTHROPIC_API_KEY secret. */
export async function handleApi(request, env) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'No API key set on the server (wrangler secret put ANTHROPIC_API_KEY).' }, 503);
  let body, prompt;
  try {
    body = await request.json();
    prompt = buildPrompt(body);
  } catch (e) {
    return json({ error: String(e.message || e) }, 400);
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // Explicit baseURL: a stray ANTHROPIC_BASE_URL on the dev machine must not redirect the key.
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: 'https://api.anthropic.com' });
  try {
    const res = await client.messages.create({
      model: API_MODELS[body.model] || API_MODELS.haiku,
      max_tokens: 4000,
      system: prompt.system,
      messages: prompt.messages,
      output_config: {
        effort: 'low',
        ...(prompt.json ? { format: { type: 'json_schema', schema: SEARCH_SCHEMA } } : {}),
      },
    });
    if (res.stop_reason === 'refusal') return json({ error: 'Claude declined this one.' }, 422);
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return json(shapeResult(body, prompt, text));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Rate limited, try again in a moment.' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The server API key was rejected.' }, 502);
    if (e instanceof Anthropic.APIError) return json({ error: `Claude API error ${e.status}` }, 502);
    return json({ error: 'Could not read Claude’s reply.' }, 502);
  }
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
