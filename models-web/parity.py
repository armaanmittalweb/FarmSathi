"""
Write the parity fixtures that frontend/tests/parity.test.ts checks the
browser pipeline against. The reference is exactly what ai-service does:

  crop: crop_recommend.predict, i.e. pipeline.predict_proba on a float32 row
        [n, p, k, temperature, humidity, ph, rainfall], for all 2,200 rows of
        ai-models/data/Crop_recommendation.csv
  leaf: vision.predict, i.e. PIL open -> RGB -> resize((224, 224)) with PIL's
        default (bicubic) filter -> float32 0..255 -> Keras model, for 300 images
        (20 per class, fixed seed) from ai-models/plantvillage_repo/

    models-web/.venv/Scripts/python models-web/parity.py

Outputs (frontend/tests/fixtures/):
  crop-parity.json  {classes, rows: [[7 features]], top: [class idx], probs: [[22]]}
  leaf-parity.json  {classes, items: [{path, decodedSha, resizedSha, top, probs}]}
The sha256 values let the test tell a decoder difference from a resize
difference if parity ever fails.
"""

import csv
import hashlib
import json
import os
import random
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FIX = ROOT / "frontend" / "tests" / "fixtures"
PER_CLASS = 20
SEED = 42


def crop() -> None:
    import joblib

    bundle = joblib.load(ROOT / "ai-models" / "crop_recommendation_model.joblib")
    pipeline, classes = bundle["pipeline"], list(bundle["classes"])
    with open(ROOT / "ai-models" / "data" / "Crop_recommendation.csv", newline="") as f:
        rows = [[float(r[k]) for k in ("N", "P", "K", "temperature", "humidity", "ph", "rainfall")] for r in csv.DictReader(f)]
    x = np.array(rows, dtype=np.float32)  # crop_recommend.py builds a float32 row
    probs = pipeline.predict_proba(x)
    out = {
        "classes": classes,
        "rows": [[float(v) for v in r] for r in x.tolist()],
        "top": [int(i) for i in probs.argmax(1)],
        "probs": [[round(float(v), 7) for v in p] for p in probs],
    }
    (FIX / "crop-parity.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"crop: {len(rows)} rows, {len(classes)} classes")


def leaf() -> None:
    import tensorflow as tf
    from PIL import Image

    model = tf.keras.models.load_model(
        ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "Crop_Disease_Prediction_Model.h5", compile=False
    )
    classes = json.loads((ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "class_names.json").read_text())
    base = ROOT / "ai-models" / "plantvillage_repo" / "raw" / "color"
    rng = random.Random(SEED)
    items = []
    for name in classes:
        files = sorted(p for p in (base / name).iterdir() if p.is_file())
        for path in rng.sample(files, PER_CLASS):
            im = Image.open(path).convert("RGB")
            decoded = np.asarray(im, dtype=np.uint8)
            resized = np.asarray(im.resize((224, 224)), dtype=np.uint8)  # vision.py: .resize(VISION_IMG_SIZE)
            items.append({
                "path": path.relative_to(ROOT).as_posix(),
                "w": im.width,
                "h": im.height,
                "decodedSha": hashlib.sha256(decoded.tobytes()).hexdigest(),
                "resizedSha": hashlib.sha256(resized.tobytes()).hexdigest(),
                "label": classes.index(name),
                "_x": resized.astype(np.float32),
            })
    x = np.stack([it.pop("_x") for it in items])
    probs = model.predict(x, batch_size=32, verbose=0)
    for it, p in zip(items, probs):
        it["top"] = int(p.argmax())
        it["probs"] = [round(float(v), 7) for v in p]
    acc = sum(it["top"] == it["label"] for it in items) / len(items)
    (FIX / "leaf-parity.json").write_text(json.dumps({"classes": classes, "items": items}, separators=(",", ":")), encoding="utf-8")
    print(f"leaf: {len(items)} images, Keras accuracy on the sample {acc:.3f}")


if __name__ == "__main__":
    FIX.mkdir(parents=True, exist_ok=True)
    which = sys.argv[1:] or ["crop", "leaf"]
    if "crop" in which:
        crop()
    if "leaf" in which:
        leaf()
