# Saved Posts Explorer

Static app for browsing and searching categorized Instagram saved posts (Explore tab) plus the agentic-coding tips doc (Agentic tips tab). Vite + React + TypeScript. No backend.

## Commands

```
npm install
npm run dev        # dev server (rebuilds data first)
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
npm run check      # data + keyword search + tips acceptance checks
npm run check:semantic   # runs the real embedding model in Node (needs internet on first run)
```

Open `dist/` via any static host or `npm run preview` (opening index.html straight from disk will not work because the app fetches its data files).

## Deploying (Cloudflare)

`npm run deploy` builds and publishes to https://saved-posts-explorer.evanhaacke.workers.dev. Hugging Face blocks browser requests from `*.workers.dev`, so the deployed site loads the search model through a small relay in `worker/index.js` (`/hf/...`, limited to the bge-small model). `npm run dev` / `npm run preview` provide the same `/hf/` path through Vite's proxy.

## Refreshing the data

1. Replace the files in `data/` (keep the names): `categorized_saved_posts_full.csv`, `embeddings.csv`, `agentic_tips.md`.
2. Run `npm run build` (or restart `npm run dev`). `scripts/build-data.mjs` runs automatically and regenerates `public/data/posts.json`, `embeddings.bin` and the tips file. Raw CSVs are never shipped.
3. New CSV rows in Cooking / Going out won't get cuisine or Daytime activities / Bars / Clubs subcategories until `data/extra_subcategories.json` (post id -> subcategory names) is updated; `scripts/build-data.mjs` merges it in.
4. `data/category_overrides.json` (post id -> full category list) replaces the CSV categories for hand-fixed posts; new CSV rows aren't affected, and subcategories whose parent category was removed are dropped.
5. `embeddings.csv` rows are matched to posts by `media_id`; they must be bge-small-en-v1.5 vectors (CLS pooling, normalized) or semantic search quality will drop.

## How search works

- Keyword search is instant (`src/lib/keyword.ts`).
- Typing or focusing the search box lazily loads `Xenova/bge-small-en-v1.5` (quantized) in a Web Worker from the Hugging Face hub; once ready, results are ranked by cosine similarity plus a small keyword boost, with a relevance cutoff. If the model cannot load, keyword results stay.
- Words like "videos"/"reels" in the query auto-apply the Videos filter.
