import glob, json, os, subprocess
import numpy as np
from faster_whisper import WhisperModel

here = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(here, "transcripts.json")
done = json.load(open(out_path, encoding="utf-8")) if os.path.exists(out_path) else {}


def load_audio(path):
    # Decode with ffmpeg ourselves: the installed PyAV is too new for faster-whisper's built-in decoder.
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


model = WhisperModel("small", device="cpu", compute_type="int8")
for f in sorted(glob.glob(os.path.join(here, "*_0*.mp4"))):
    name = os.path.basename(f)
    if name in done:
        continue
    try:
        audio = load_audio(f)
    except subprocess.CalledProcessError:  # e.g. clip with no audio track
        audio = np.zeros(0, dtype=np.float32)
    if audio.size == 0:
        done[name] = {"language": None, "text": ""}
    else:
        segs, info = model.transcribe(audio, vad_filter=True)
        done[name] = {"language": info.language, "text": " ".join(s.text.strip() for s in segs).strip()}
    json.dump(done, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(name, done[name]["language"], len(done[name]["text"]), flush=True)
print("DONE", flush=True)
