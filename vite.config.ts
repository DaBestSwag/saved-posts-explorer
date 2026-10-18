import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error plain JS module shared with the Worker
import { localAi } from './worker/local-ai.mjs';

// Same /hf/ model relay the deployed Worker provides (worker/index.js).
const proxy = {
  '/hf': { target: 'https://huggingface.co', changeOrigin: true, followRedirects: true, rewrite: (p: string) => p.replace(/^\/hf/, '') },
};

export default defineConfig({
  base: './',
  plugins: [react(), localAi()],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1500 },
  server: { proxy },
  preview: { proxy },
});
