// Dev-server only: the same /api/ai routes as the Worker, plus a "subscription" engine
// that runs Claude Code on this computer (your Claude login) instead of API credits.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPrompt, shapeResult, handleApi, SEARCH_SCHEMA } from './ai.js';

const SUB_MODELS = { haiku: 'haiku', sonnet: 'sonnet' };

/**
 * An API key in the environment makes Claude Code bill API credits instead of the subscription,
 * and a parent Claude Code session's own login variables override the stored login. Drop both.
 */
function subscriptionEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^(ANTHROPIC_|CLAUDE_CODE_|CLAUDECODE$)/i.test(k)) delete env[k];
  return env;
}

/** Runs one headless Claude Code turn with no tools and returns its text. */
function runClaude(system, prompt, model) {
  const dir = mkdtempSync(join(tmpdir(), 'spe-ai-'));
  const sysFile = join(dir, 'system.txt');
  writeFileSync(sysFile, system);
  const args = [
    '-p', '--output-format', 'json', '--model', model,
    '--tools', '""', '--strict-mcp-config', '--setting-sources', '""',
    '--no-session-persistence', '--system-prompt-file', `"${sysFile}"`,
  ];
  return new Promise((resolve, reject) => {
    // shell: npm installs claude as a .cmd shim on Windows, which spawn can't run directly.
    const child = spawn('claude', args, { shell: true, cwd: tmpdir(), windowsHide: true, env: subscriptionEnv() });
    let out = '', err = '';
    const timer = setTimeout(() => child.kill(), 120_000);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', () => {
      clearTimeout(timer);
      // Windows can hold the file briefly after exit; a leftover temp file must never crash the server.
      try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
      try {
        const res = JSON.parse(out);
        if (res.is_error) return reject(new Error(res.result || 'Claude Code failed'));
        resolve(String(res.result || ''));
      } catch {
        reject(new Error((err || out || 'Claude Code gave no reply').trim().slice(0, 300)));
      }
    });
    child.stdin.end(prompt);
  });
}

/** Claude Code takes one prompt, so the chat history is written out as a transcript. */
function flatten(p) {
  if (p.messages.length === 1) return p.messages[0].content;
  const turns = p.messages.map((m) => `${m.role === 'user' ? 'USER' : 'YOU'}: ${m.content}`).join('\n\n');
  return `Conversation so far:\n\n${turns}\n\nReply to the last USER message.`;
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw;
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(data));
}

/** Vite plugin: serves /api/ai and /api/ai/engines on the dev and preview servers. */
export function localAi() {
  const apiKey = () => process.env.ANTHROPIC_API_KEY;
  const middleware = async (req, res, next) => {
    const path = req.url.split('?')[0];
    if (path === '/api/ai/engines') return send(res, 200, { sub: true, api: !!apiKey() });
    if (path !== '/api/ai') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    const raw = await readBody(req);
    let body, prompt;
    try {
      body = JSON.parse(raw);
      prompt = buildPrompt(body);
    } catch (e) {
      return send(res, 400, { error: String(e.message || e) });
    }
    if (body.engine === 'api') {
      const r = await handleApi(new Request('http://local/api/ai', { method: 'POST', body: raw }), { ANTHROPIC_API_KEY: apiKey() });
      return send(res, r.status, await r.json());
    }
    const system = prompt.json
      ? `${prompt.system}\n\nReply with only a JSON object matching this schema, nothing else:\n${JSON.stringify(SEARCH_SCHEMA)}\n"n" is the candidate number in brackets.`
      : prompt.system;
    try {
      const text = await runClaude(system, flatten(prompt), SUB_MODELS[body.model] || SUB_MODELS.sonnet);
      send(res, 200, shapeResult(body, prompt, text));
    } catch (e) {
      const msg = String(e.message || e);
      send(res, 502, { error: /authenticate|login|oauth/i.test(msg) ? 'Claude Code is logged out. Run `claude` in a terminal and type /login.' : msg });
    }
  };
  return {
    name: 'local-ai',
    // Braces matter: a returned function would be treated as a post-middleware hook.
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
