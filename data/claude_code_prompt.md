# Build: Saved Posts Explorer

Build me a static single-page web app called **Saved Posts Explorer** — a UI for browsing and searching my categorized Instagram saved posts. All data is local files (below); there is no backend and no API. Pick React or vanilla TypeScript with Vite — your choice — but the output must be a static site I can open locally or host anywhere.

## Input files (in this project folder)

1. **`categorized_saved_posts_full.csv`** — 1,668 rows, one per saved post. Columns:
   - `media_id` (unique key), `url` (Instagram link), `author` (username, no @), `author_name`
   - `categories` — one or more of the 16 categories, separated by `"; "` (posts are multi-tagged)
   - `subcategories` — only for some Filmmaking posts, `"; "`-separated: Cinematography, Lighting, Color grading, Editing, Music videos
   - `published` — ISO publish date (there is no saved-at date; don't invent one)
   - `media_type` — VIDEO, IMAGE, or CAROUSEL_ALBUM; `post_type` — reel/post/story highlight etc.
   - `likes`, `comments` — integers
   - `caption` — full caption (may contain newlines, quotes, emoji — parse with a real CSV parser, e.g. Papa Parse, never by splitting)
   - `hashtags` — space-separated
   - `media_description` — a description of what is actually in the video/image (spoken content, visuals), present for 992 of 1,668 posts, empty otherwise
   - `why`, `confidence`, `manual_collections`, `instagram_status` — categorization metadata; you don't need to display these
   - Two rows have empty author fields (deleted posts) — render them gracefully, never crash on nulls.
2. **`embeddings.csv`** — one row per post: `media_id` + 384 float columns (`dim_0`…`dim_383`). These are L2-normalized bge-small-en-v1.5 embeddings of each post's caption + hashtags + media_description + author + categories. Use them for semantic search (below). Convert to a compact binary/JSON form at build time; don't ship the raw CSV to the browser if you can avoid it.
3. **`agentic_tips.md`** — a Markdown doc: 65 deduplicated agentic-coding tips under 8 `##` headings, each bullet ending with one or more `[video](url)` / `[post](url)` links, plus a final "Posts with no extractable tip" list. This is the content of the Tips tab.

## The app

Two tabs: **Explore** and **Agentic tips**.

### Explore tab
- A responsive card grid (mobile-first, works well on a phone). Each card shows: `@author` and author name, publish date, a media-type badge (Video / Image / Carousel), likes and comments, the caption (truncated with a Read more / Show less toggle), an **"In the video"** section showing `media_description` when it's non-empty, chips for the post's categories and subcategories, and a button that opens `url` on Instagram in a new tab.
- **Category filter**: chips for all 16 categories, each with its live count. Counts are tag counts (a multi-tagged post counts under each of its categories). Expected counts: Politics 463, Other 389, Filmmaking 352, Basketball 125, Agentic coding 115, Movies and TV 62, Music 58, Memes 54, Going out 52, Gaming 47, Cooking 40, Food out 34, Workout 26, Other sports 20, Massage 11, Science 10. Multiple categories selectable; a post shows if it matches ANY selected category.
- **Subcategory filter**: when Filmmaking is in play (or always visible — your call, keep it clean), show subcategory chips with counts: Music videos 76, Cinematography 22, Lighting 19, Color grading 12, Editing 8.
- **Media-type filter**: All / Videos / Images / Carousels segmented control. Filters combine (category AND subcategory AND type AND search).
- **Sorting**: Best match (default while a search is active), Newest, Oldest, Most liked.
- **Result count** always visible ("Showing X of 1,668"), a **Clear all** reset, and **Show more** pagination (render ~60 cards at a time with the remaining count on the button — do not render all 1,668 cards at once).
- **Surprise me** button: shows one random post from the currently filtered pool.

### Search (this is the important part)
Search must find posts by meaning, not just keywords. Two layers:
1. **Instant keyword fallback** (available immediately, before any model loads): tokenized scoring over author, caption, hashtags, and `media_description`; word-boundary matching; ignore common stopwords; strong boost for exact-phrase matches. It must be good enough that "the K-shaped economy" ranks the @wehavethedata post ("Turns out the social economy is also k-shaped 😅") **#1**.
2. **Semantic search** (the real engine): lazily load `@xenova/transformers` in the browser with the model `Xenova/bge-small-en-v1.5` (quantized), embed the user's query, and cosine-rank against the vectors in `embeddings.csv`. Once the model is ready, replace the keyword results with semantic results and show a small status indicator ("Semantic search ready" / "Keyword search"). If the model fails to load, keep keyword results and note it subtly — never block the UI on the model. If the query contains the word "videos", auto-apply the Videos media-type filter.

### Agentic tips tab
- Render `agentic_tips.md`: the 8 sections as headings with their tip bullets; render the `[video](url)` / `[post](url)` links as clickable source links. Add a text filter box that filters tips live (e.g. filtering "worktree" should leave exactly the orchestrator–worker tip). Render the final "Posts with no extractable tip" list inside a collapsed `<details>` element.

## Design
- Clean, modern, content-first. System font stack or one Google font. Dark mode following `prefers-color-scheme`. Category chips color-coded subtly but consistently. No stock photos or thumbnails (none exist in the data — don't hotlink Instagram CDN images, they expire).
- Fast first paint: data loads from a bundled JSON you generate at build time from the CSV.

## Acceptance checks (verify these before you finish and show me the results)
1. Category counts on the chips exactly match the list above.
2. Filtering Filmmaking → Lighting shows the 19 Lighting posts.
3. Search "the K-shaped economy" → @wehavethedata's post is result #1, and its Instagram link works.
4. Search "videos about ICE" → top results are all immigration-enforcement videos (not ice baths, ice cream, or Vanilla Ice) and the Videos filter is auto-applied.
5. Search "sub agents in Claude Code" → the Arena Skill post ("spin up 100 sub agents") is in the top results.
6. Tips tab: filtering "worktree" isolates exactly one tip; all 65 tips render with working links.
7. No console errors; no layout overflow on a 390px-wide mobile viewport.

Also add a short README section explaining how I refresh the data later (replace the CSVs, re-run the build) and give me the exact commands to run it locally (`npm install`, `npm run dev`, `npm run build`).
