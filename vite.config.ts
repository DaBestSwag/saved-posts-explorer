import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Same /hf/ model relay the deployed Worker provides (worker/index.js).
const proxy = {
  '/hf': { target: 'https://huggingface.co', changeOrigin: true, followRedirects: true, rewrite: (p: string) => p.replace(/^\/hf/, '') },
};

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1500 },
  server: { proxy },
  preview: { proxy },
});
