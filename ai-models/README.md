# ai-models

Both the training dataset and the trained model outputs are **committed to
this repo** — a fresh clone already has everything `ai-service` needs to
serve `/analyze-plant` and `/analyze-soil` with no download or training
step. The scripts below exist for retraining/extending, not because
they're required to get the app running.

| Path | What it is | Committed? |
|---|---|---|
| `plantvillage_repo/raw/color/` | ~22.8k training images, 15 classes | ✅ (~415MB) |
| `data/Crop_recommendation.csv` | 2,200-row tabular training set | ✅ |
| `Crop_Disease_Prediction_Model/Crop_Disease_Prediction_Model.h5` | trained vision model | ✅ (~11MB) |
| `Crop_Disease_Prediction_Model/class_names.json` | label order for the above | ✅ |
| `crop_recommendation_model.joblib` | trained tabular model | ✅ (~7MB) |
| `Crop_Disease_Prediction_Model/checkpoint.keras` | mid-training snapshot | ❌ gitignored — redundant with the .h5 |

## 1. Crop disease classifier (`train_disease_model.py`)

- **Model**: MobileNetV2 transfer learning (frozen ImageNet backbone + a
  small trainable head) — ~9MB, fast CPU inference.
- **Current trained result**: stopped at epoch 7 of a 15-epoch run once
  val_accuracy plateaued around 90.5% (see training log reasoning in git
  history) — a broader 45-image spot-check across all 15 classes came back
  at 93.3%. The three observed misses were all plausible cross-disease
  confusions (e.g. Potato Late blight ↔ Tomato Late blight — same disease,
  related host plants), not random noise.
- **Retrain / extend it**:
  ```bash
  pip install tensorflow-cpu pillow
  python train_disease_model.py            # uses the bundled dataset, 15 epochs
  ```
  On CPU, expect roughly 650ms/training-step at batch size 32 (measured on
  a modern laptop CPU) — with ~18k training images that's ~6-7 minutes per
  epoch. If you stop it early (Ctrl+C) once val_accuracy plateaus, use
  `export_checkpoint.py` to promote the last-saved best checkpoint to the
  served model without waiting for `EarlyStopping` to notice on its own:
  ```bash
  python export_checkpoint.py               # exports checkpoint.keras -> the served .h5
  ```
- **Output**: `Crop_Disease_Prediction_Model/Crop_Disease_Prediction_Model.h5`
  and `Crop_Disease_Prediction_Model/class_names.json`, both read directly
  by `ai-service/vision.py`.

### Where the dataset came from (for refreshing/extending it later)

- Kaggle's copy needs `kaggle.json` credentials — this repo's copy avoids
  that requirement entirely.
- The Hugging Face mirror (`mohanty/PlantVillage`) looks promising but is
  actually a *manifest* dataset — its rows are file path strings, not
  image bytes, so `datasets.load_dataset()` alone won't get you images.
  (`prepare_plantvillage.py` is kept for reference/in case HF fixes this,
  but doesn't currently work.)
- **What actually worked**: a sparse/partial git clone of the original
  GitHub repo, fetching only the three needed crop folders instead of the
  full 2.1GB (54k images, all 14 crops):
  ```bash
  git clone --filter=blob:none --no-checkout --depth 1 \
    https://github.com/spMohanty/PlantVillage-Dataset.git plantvillage_repo
  cd plantvillage_repo
  git sparse-checkout init --no-cone
  cat > .git/info/sparse-checkout << 'EOF'
  raw/color/Pepper,_bell___*/
  raw/color/Potato___*/
  raw/color/Tomato___*/
  EOF
  git checkout master
  rm -rf .git   # done fetching — this repo tracks the images directly, not as a submodule
  ```
  That pulls ~415MB of real JPEGs instead of the full repo.

## 2. Crop recommendation model (`train_crop_recommendation.py`)

- **Dataset**: the "Crop Recommendation Dataset" (Kaggle, open license,
  `atharvaingle/crop-recommendation-dataset`) — bundled at
  `data/Crop_recommendation.csv` (2,200 rows, 22 balanced crop classes,
  verified).
- **Model**: scikit-learn `StandardScaler` + `RandomForestClassifier` —
  small (a few MB), trains in seconds.
- **Current trained result**: 99.55% test accuracy (verified via the full
  backend → ai-service stack, not just the training script's own report).
- **Retrain it**:
  ```bash
  pip install scikit-learn pandas joblib
  python train_crop_recommendation.py   # uses the bundled CSV
  ```
- **Output**: `crop_recommendation_model.joblib`, read directly by
  `ai-service/crop_recommend.py`.

## Why not the original Soil Health Card dataset?

`notebooks/Soil-health-Model.ipynb` trained on a Soil Health Card dataset
with a `recommended_crop` / `local_crop_name` target that turned out to
have far too many sparse classes for the row count (0.08 accuracy — worse
than random guessing among the top few crops). The Crop Recommendation
Dataset above targets the same real feature set (soil N/P/K + climate) but
with a clean, balanced 22-class label, and is the standard open dataset
for this exact task. If you want to go back to Soil Health Card data
later, treat it as a *fertilizer-dosage* regression problem instead of a
crop-classification one — that's a better fit for what it measures.

## Optional: OCR'ing a physical Soil Health Card photo

The current `/analyze-soil` flow expects typed N/P/K/pH/etc. values (the
reliable path). If you want to prefill those fields from a photo of a
physical Soil Health Card, `pytesseract` (already in
`ai-service/requirements.txt`) plus a few regexes for the card's standard
line format is enough for a best-effort extractor — treat it as an
autofill convenience with a manual-correction step in the UI, not a
guaranteed-accurate parser.
