"""
Trains the crop-recommendation model that ai-service/crop_recommend.py
serves, replacing notebooks/Soil-health-Model.ipynb's attempt (~8%
accuracy — too many sparse "local_crop_name" classes on the Soil Health
Card dataset it used) with the standard, well-scoped open "Crop
Recommendation Dataset": N, P, K, temperature, humidity, ph, rainfall ->
one of 22 crops. This combination of features is realistic to collect
(farmer types them in, or temperature/humidity come from the Weather tab)
and the dataset is clean enough for a small model to do well on it.

Dataset (open license, Kaggle: "Crop Recommendation Dataset" /
atharvaingle/crop-recommendation-dataset): a CSV with columns
    N,P,K,temperature,humidity,ph,rainfall,label
already included at data/Crop_recommendation.csv (verified: 2200 rows,
22 balanced crop classes) — no download needed.

Usage:
    python train_crop_recommendation.py                    # uses the bundled dataset
    python train_crop_recommendation.py --csv_path other.csv  # or point at your own
"""

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "data" / "Crop_recommendation.csv"
OUT_PATH_DEFAULT = "crop_recommendation_model.joblib"

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv_path", default=str(DEFAULT_CSV_PATH))
    parser.add_argument("--out_path", default=OUT_PATH_DEFAULT)
    parser.add_argument("--test_size", type=float, default=0.2)
    args = parser.parse_args()

    data = pd.read_csv(args.csv_path)
    # .values (plain ndarray, no column-name metadata) so the fitted
    # pipeline doesn't warn at inference time when crop_recommend.py
    # passes it a bare array in the same column order.
    x = data[FEATURE_COLUMNS].values
    y = data["label"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=args.test_size, random_state=42, stratify=y
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(n_estimators=200, random_state=42)),
        ]
    )
    pipeline.fit(x_train, y_train)

    y_pred = pipeline.predict(x_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Test accuracy: {accuracy:.4f}")
    print(classification_report(y_test, y_pred))

    bundle = {"pipeline": pipeline, "classes": sorted(y.unique().tolist())}
    joblib.dump(bundle, args.out_path)
    print(f"Saved model bundle to {args.out_path}")


if __name__ == "__main__":
    main()
