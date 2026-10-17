// Uploads data/videos/*.mp4 (downloaded with yt-dlp) to the R2 bucket, skipping ones already up.
// Each success is appended to data/video_ids.txt, which build-data reads to turn on the in-page player.
// Safe to re-run: picks up where it stopped.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'data', 'videos');
const listFile = path.join(root, 'data', 'video_ids.txt');
const BUCKET = 'saved-posts-videos';
const PARALLEL = 6;

const done = new Set(fs.existsSync(listFile) ? fs.readFileSync(listFile, 'utf8').split(/\s+/).filter(Boolean) : []);
// Only finished files: yt-dlp's in-progress pieces look like X.temp.mp4 / X.f123.mp4.
const todo = fs.readdirSync(dir).filter((f) => /^[\w-]+\.mp4$/.test(f) && !done.has(f.slice(0, -4)));
console.log(`[upload] ${done.size} already up, ${todo.length} to go`);

let ok = 0;
let failed = 0;
async function upload(file) {
  try {
    await run('npx', ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${file}`, '--file', path.join(dir, file), '--content-type', 'video/mp4', '--remote'], {
      cwd: root,
      shell: true,
      maxBuffer: 1 << 24,
    });
    fs.appendFileSync(listFile, file.slice(0, -4) + '\n');
    ok++;
  } catch (e) {
    failed++;
    console.warn(`[upload] failed ${file}: ${String(e.stderr || e.message).trim().split('\n').pop()}`);
  }
  if ((ok + failed) % 25 === 0) console.log(`[upload] ${ok + failed}/${todo.length}`);
}

const queue = [...todo];
await Promise.all(Array.from({ length: PARALLEL }, async () => {
  while (queue.length) await upload(queue.shift());
}));
console.log(`[upload] done: ${ok} uploaded, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
