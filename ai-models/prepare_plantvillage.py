"""
Downloads the open PlantVillage dataset (mohanty/PlantVillage on Hugging
Face — the modern home of the original spMohanty/PlantVillage-Dataset,
54,306 images / 14 crops / 26 diseases) and exports just the Pepper/
Potato/Tomato subset (15 classes) as a directory-of-one-subfolder-per-class,
which is what train_disease_model.py's
`image_dataset_from_directory` call expects. This mirrors the 15-class
scope of the original notebook (which used a Kaggle mirror of the same
subset) rather than training on all 38 classes, to keep dataset size and
CPU training time bounded.

Usage:
    python prepare_plantvillage.py --out_dir ./plantvillage_subset
"""

import argparse
from pathlib import Path

TARGET_CROPS = ("Pepper,_bell", "Potato", "Tomato")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out_dir", default="./plantvillage_subset")
    parser.add_argument(
        "--max_per_class",
        type=int,
        default=0,
        help="Cap images per class (0 = no cap, use everything). Useful to bound CPU training time.",
    )
    args = parser.parse_args()

    from datasets import load_dataset

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Downloading mohanty/PlantVillage (train+test splits)...")
    # The repo's README front-matter claims a "color" default config, but
    # the actual registered builder config is "default" — force it
    # explicitly rather than relying on the (inconsistent) auto-resolution.
    dataset = load_dataset("mohanty/PlantVillage", name="default")
    class_names = dataset["train"].features["label"].names

    counts = {}
    total_saved = 0
    for split in ("train", "test"):
        for example in dataset[split]:
            label_name = class_names[example["label"]]
            crop = label_name.split("___")[0]
            if crop not in TARGET_CROPS:
                continue

            counts.setdefault(label_name, 0)
            if args.max_per_class and counts[label_name] >= args.max_per_class:
                continue

            class_dir = out_dir / label_name
            class_dir.mkdir(parents=True, exist_ok=True)
            counts[label_name] += 1
            total_saved += 1
            image = example["image"].convert("RGB")
            image.save(class_dir / f"{split}_{counts[label_name]:05d}.jpg", quality=90)

    print(f"Saved {total_saved} images across {len(counts)} classes to {out_dir}")
    for name, count in sorted(counts.items()):
        print(f"  {name}: {count}")


if __name__ == "__main__":
    main()
