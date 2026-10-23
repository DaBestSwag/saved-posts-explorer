import glob, os, re, sys
import torch
from transformers import AutoModel, AutoTokenizer

here = os.path.dirname(os.path.abspath(__file__))
# Entries that are really videos (their picture is just a poster frame): skip them.
video_ids = {re.sub(r"_\d+$", "", os.path.splitext(os.path.basename(f))[0]) for f in glob.glob(os.path.join(here, "*_0*.mp4"))}

todo = []
for img in sorted(glob.glob(os.path.join(here, "img_*.jpg"))):
    eid = re.sub(r"_\d+$", "", os.path.basename(img)[4:-4])
    out = os.path.join(here, "ocr", eid)
    if eid in video_ids or os.path.exists(os.path.join(out, "result.md")):
        continue
    todo.append((img, out))
print(f"{len(todo)} images to read", flush=True)

name = "baidu/Unlimited-OCR"
tok = AutoTokenizer.from_pretrained(name, trust_remote_code=True)
model = AutoModel.from_pretrained(name, trust_remote_code=True, use_safetensors=True, torch_dtype=torch.bfloat16).eval().cuda()

for i, (img, out) in enumerate(todo, 1):
    os.makedirs(out, exist_ok=True)
    try:
        model.infer(
            tok, prompt="<image>document parsing.", image_file=img, output_path=out,
            base_size=1024, image_size=640, crop_mode=True, max_length=32768,
            no_repeat_ngram_size=35, ngram_window=128, save_results=True,
        )
        print(f"[{i}/{len(todo)}] {os.path.basename(out)} ok", flush=True)
    except Exception as e:
        print(f"[{i}/{len(todo)}] {os.path.basename(out)} FAILED {e}", flush=True)
print("DONE", flush=True)
