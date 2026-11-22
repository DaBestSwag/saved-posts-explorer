# macOS version of ocr_batch.py: reads text in images with Apple's built-in Vision framework (no GPU needed).
# Same inputs and outputs as ocr_batch.py: every img_<id>_NN.jpg in this folder that isn't a video poster
# frame -> ocr/<id>[_NN]/result.md (plain text, one recognized line per line, top to bottom).
# ocr_batch.py hands over to this file automatically on macOS. Needs: pip install pyobjc-framework-Vision pyobjc-framework-Quartz
import glob, os, re, sys

import Quartz
import Vision
from Foundation import NSURL

here = os.path.dirname(os.path.abspath(__file__))
# Entries that are really videos (their picture is just a poster frame): skip them.
video_ids = {re.sub(r"_\d+$", "", os.path.splitext(os.path.basename(f))[0]) for f in glob.glob(os.path.join(here, "*_0*.mp4"))}


def read_text(path):
    """All text Vision finds in the image, as lines ordered top-to-bottom, then left-to-right."""
    src = Quartz.CGImageSourceCreateWithURL(NSURL.fileURLWithPath_(path), None)
    if src is None:
        raise RuntimeError("could not open image")
    image = Quartz.CGImageSourceCreateImageAtIndex(src, 0, None)
    req = Vision.VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    req.setUsesLanguageCorrection_(True)
    if hasattr(req, "setAutomaticallyDetectsLanguage_"):
        req.setAutomaticallyDetectsLanguage_(True)
    handler = Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(image, None)
    ok, err = handler.performRequests_error_([req], None)
    if not ok:
        raise RuntimeError(str(err))
    lines = []
    for obs in req.results() or []:
        cand = obs.topCandidates_(1)
        if not cand:
            continue
        box = obs.boundingBox()  # normalized, origin bottom-left
        lines.append((round(1 - (box.origin.y + box.size.height), 2), box.origin.x, str(cand[0].string())))
    lines.sort(key=lambda t: (t[0], t[1]))
    return "\n".join(t[2] for t in lines)


def main():
    todo = []
    for img in sorted(glob.glob(os.path.join(here, "img_*.jpg"))):
        eid = re.sub(r"_\d+$", "", os.path.basename(img)[4:-4])
        out = os.path.join(here, "ocr", eid)
        if eid in video_ids or os.path.exists(os.path.join(out, "result.md")):
            continue
        todo.append((img, out))
    print(f"{len(todo)} images to read", flush=True)
    for i, (img, out) in enumerate(todo, 1):
        os.makedirs(out, exist_ok=True)
        try:
            text = read_text(img)
            with open(os.path.join(out, "result.md"), "w", encoding="utf-8") as f:
                f.write(text + "\n")
            print(f"[{i}/{len(todo)}] {os.path.basename(out)} ok", flush=True)
        except Exception as e:
            print(f"[{i}/{len(todo)}] {os.path.basename(out)} FAILED {e}", flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    if len(sys.argv) > 1:  # ad-hoc: ocr_batch_mac.py <image> prints its text
        print(read_text(sys.argv[1]))
    else:
        main()
