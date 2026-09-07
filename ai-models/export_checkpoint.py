"""
Exports the best checkpoint saved mid-training by train_disease_model.py's
ModelCheckpoint callback as the final served model, without needing
model.fit() to finish/return first. Useful when you've decided the current
best epoch is good enough and don't want to wait for EarlyStopping to
notice a plateau on its own.

Usage:
    python export_checkpoint.py --data_dir ./plantvillage_repo/raw/color
"""

import argparse
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR / "Crop_Disease_Prediction_Model"
DEFAULT_DATA_DIR = BASE_DIR / "plantvillage_repo" / "raw" / "color"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default=str(DEFAULT_DATA_DIR), help="Same --data_dir used for training (to recover class order)")
    parser.add_argument("--checkpoint", default=str(OUT_DIR / "checkpoint.keras"))
    args = parser.parse_args()

    # image_dataset_from_directory sorts subdirectory names alphabetically —
    # recover the same order without needing the original training process.
    class_names = sorted(p.name for p in Path(args.data_dir).iterdir() if p.is_dir())
    print(f"Recovered {len(class_names)} classes: {class_names}")

    import tensorflow as tf

    model = tf.keras.models.load_model(args.checkpoint)

    model_path = OUT_DIR / "Crop_Disease_Prediction_Model.h5"
    model.save(model_path)
    with open(OUT_DIR / "class_names.json", "w") as f:
        json.dump(class_names, f, indent=2)

    print(f"Exported {args.checkpoint} -> {model_path}")
    print(f"Wrote {OUT_DIR / 'class_names.json'}")


if __name__ == "__main__":
    main()
