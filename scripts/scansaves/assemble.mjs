// Builds CSV rows (same columns as data/categorized_saved_posts_full.csv) for the new saved posts from
// yt-dlp info files, transcripts.json (faster-whisper) and ocr/*/result.md (Unlimited-OCR).
// Usage: node assemble.mjs            -> writes new-rows.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const transcripts = read('transcripts.json');
const files = fs.readdirSync(dir);

// Hand-written per post (categories + short description from caption / transcript / slide text), in posts.json next to this script:
// [{ code, cats, subs?, desc, itemPrefix?: "regex source for carousel item shortcodes", manual?: {author, authorName, ts, likes, comments, caption, mediaType} }]
const POSTS = read('posts.json');

const clean = (md) => md.replace(/!\[\]\([^)]*\)/g, '').replace(/<\|det\|>[\s\S]*?<\|\/det\|>/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const noSpeech = (t) => (t || '').trim().length < 15; // whisper hallucinates "You" on music-only clips
const iso = (ts) => new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);

const rows = [];
for (const p of POSTS) {
  const m = p.manual;
  const infoName = files.find((f) => f.startsWith(p.code + '_') && f.endsWith('.info.json')) || files.find((f) => f.startsWith('img_' + p.code + '_') && f.endsWith('.info.json'));
  const info = infoName ? read(infoName) : null;
  const videos = files.filter((f) => /_0\d+\.mp4$/.test(f) && f.startsWith(p.code + '_'));

  // Carousel items have their own shortcodes, so match them through the playlist info file.
  // yt-dlp does not list a carousel's items in its info file, so they are found by their shared code prefix and ordered by slide number.
  const itemIds = p.itemPrefix
    ? files.map((f) => f.match(/^img_(.+)_(\d{5})\.jpg$/)).filter((x) => x && new RegExp(p.itemPrefix).test(x[1])).sort((a, b) => a[2] - b[2]).map((x) => x[1])
    : [];
  const isCarousel = itemIds.length > 0;

  let transcript = '', imageText = '', status = '', note = '';
  if (m) {
    status = 'video_not_downloaded_needs_login';
    note = 'Instagram only serves this reel to a logged-in session, so no transcript was made. Description comes from the page and on-screen text.';
  } else if (isCarousel) {
    const parts = [], slides = [];
    itemIds.forEach((id, i) => {
      const vid = files.find((f) => f.startsWith(id + '_') && f.endsWith('.mp4'));
      const t = vid ? transcripts[vid]?.text : '';
      if (vid && !noSpeech(t)) parts.push(`[Slide ${i + 1}] ${t.trim()}`);
      const ocr = path.join(dir, 'ocr', id, 'result.md');
      if (!vid && fs.existsSync(ocr)) slides.push(`[Slide ${i + 1}] ${clean(fs.readFileSync(ocr, 'utf8'))}`);
    });
    transcript = parts.join(' ');
    imageText = slides.join('\n');
    status = parts.length ? 'transcribed_carousel_slides' : imageText ? 'image_ocr_only' : 'carousel_slides_no_speech';
  } else if (videos.length) {
    const t = transcripts[videos[0]]?.text || '';
    transcript = noSpeech(t) ? '' : t.trim();
    status = transcript ? 'transcribed' : 'no_speech_detected';
  } else {
    const ocr = path.join(dir, 'ocr', p.code, 'result.md');
    imageText = fs.existsSync(ocr) ? clean(fs.readFileSync(ocr, 'utf8')) : '';
    status = 'image_ocr_only';
  }

  const caption = m ? m.caption : (info.description || info.title || '').trim();
  rows.push({
    rank_saved_order: '',
    author: m ? m.author : info.channel,
    author_name: m ? m.authorName : (info.uploader || info.channel),
    categories: p.cats.join('; '),
    subcategories: (p.subs || []).join('; '),
    confidence: 'medium',
    why: `${p.cats[0]}: new save, categorized by hand`,
    published: iso(m ? m.ts : info.timestamp),
    media_type: m ? m.mediaType : isCarousel ? 'CAROUSEL_ALBUM' : videos.length ? 'VIDEO' : 'IMAGE',
    post_type: videos.length || m ? 'reel' : 'post',
    likes: m ? m.likes : info.like_count ?? 0,
    comments: m ? m.comments : info.comment_count ?? 0,
    url: `https://www.instagram.com/${videos.length || m ? 'reel' : 'p'}/${p.code}/`,
    manual_collections: '',
    instagram_status: 'Saved (added from Chrome)',
    caption,
    hashtags: (caption.match(/#[\p{L}\p{N}_]+/gu) || []).join(' '),
    media_id: p.code,
    media_description: p.desc,
    transcript,
    transcript_status: status,
    transcript_note: note,
    image_text: imageText,
  });
}
fs.writeFileSync(path.join(dir, 'new-rows.json'), JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`${r.media_id} | ${r.media_type} | ${r.categories}${r.subcategories ? ' / ' + r.subcategories : ''} | ${r.transcript_status} | transcript ${r.transcript.length} | ocr ${r.image_text.length} | ${r.author} | ${r.published}`);
