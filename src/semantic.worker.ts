/// <reference lib="webworker" />
// Loads the embedding model off the main thread so the UI never blocks.
import { pipeline, env } from '@xenova/transformers';
import { embedQuery, MODEL } from './lib/semantic';

env.allowLocalModels = false;
// Hugging Face blocks browser requests from *.workers.dev, so the model always comes
// through this site's own /hf/ relay (worker/index.js deployed, vite.config.ts locally).
env.remoteHost = `${self.location.origin}/hf/`;

let extractor: any = null;
const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    if (m.type === 'init') {
      extractor = await pipeline('feature-extraction', MODEL, { quantized: true });
      post({ type: 'ready' });
    } else if (m.type === 'embed' && extractor) {
      const vec = await embedQuery(extractor, m.text);
      post({ type: 'vec', text: m.text, vec }, );
    }
  } catch (err) {
    post({ type: 'error', message: String(err) });
  }
};
