# macOS version of transcribe.py: mlx-whisper on Apple Silicon, same Whisper "small" model as the Windows
# faster-whisper run, same output (transcripts.json: {"<file>.mp4": {"language": ..., "text": ...}}).
# transcribe.py hands over to this file automatically on macOS. Needs: pip install mlx-whisper; ffmpeg on PATH.
import glob, json, os, subprocess, sys

import numpy as np
import mlx_whisper

MODEL = "mlx-community/whisper-small-mlx"
here = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(here, "transcripts.json")


def load_audio(path):
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def transcribe(path):
    try:
        audio = load_audio(path)
    except subprocess.CalledProcessError:  # e.g. clip with no audio track
        audio = np.zeros(0, dtype=np.float32)
    if audio.size == 0:
        return {"language": None, "text": ""}
    # faster-whisper used vad_filter=True; the closest mlx-whisper settings: drop segments Whisper itself
    # marks as no-speech, and don't let a hallucinated line seed the next window.
    r = mlx_whisper.transcribe(audio, path_or_hf_repo=MODEL, condition_on_previous_text=False,
                               no_speech_threshold=0.6, verbose=None)
    segs = [s for s in r.get("segments", []) if not (s.get("no_speech_prob", 0) > 0.6 and s.get("avg_logprob", 0) < -1)]
    return {"language": r.get("language"), "text": " ".join(s["text"].strip() for s in segs).strip()}


def main():
    done = json.load(open(out_path, encoding="utf-8")) if os.path.exists(out_path) else {}
    for f in sorted(glob.glob(os.path.join(here, "*_0*.mp4"))):
        name = os.path.basename(f)
        if name in done:
            continue
        done[name] = transcribe(f)
        json.dump(done, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(name, done[name]["language"], len(done[name]["text"]), flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    if len(sys.argv) > 1:  # ad-hoc: transcribe_mac.py <video> prints its result as JSON
        print(json.dumps(transcribe(sys.argv[1]), ensure_ascii=False))
    else:
        main()
