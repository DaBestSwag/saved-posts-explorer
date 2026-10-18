import type { AISettings, Engine, Model } from './lib/ai';

const ENGINES: { v: Engine; label: string }[] = [
  { v: 'sub', label: 'Subscription' },
  { v: 'api', label: 'API' },
];
const MODELS: { v: Model; label: string }[] = [
  { v: 'haiku', label: 'Haiku' },
  { v: 'sonnet', label: 'Sonnet' },
];

/** Engine (only when both exist) and model pickers. Switching engine brings back that engine's model. */
export function AIControls({ ai }: { ai: AISettings }) {
  return (
    <div className="ai-controls">
      {ai.engines.sub && ai.engines.api && (
        <div className="seg" role="group" aria-label="Engine">
          {ENGINES.map((e) => (
            <button key={e.v} className={ai.engine === e.v ? 'on' : ''} aria-pressed={ai.engine === e.v} onClick={() => ai.setEngine(e.v)}>
              {e.label}
            </button>
          ))}
        </div>
      )}
      <div className="seg" role="group" aria-label="Model">
        {MODELS.map((m) => (
          <button key={m.v} className={ai.model === m.v ? 'on' : ''} aria-pressed={ai.model === m.v} onClick={() => ai.setModel(m.v)}>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
