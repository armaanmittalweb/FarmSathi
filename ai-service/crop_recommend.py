"""
Tabular soil/crop recommendation model: scikit-learn pipeline trained by
ai-models/train_crop_recommendation.py on the open "Crop Recommendation
Dataset" (N, P, K, temperature, humidity, ph, rainfall -> crop). This
replaces the Soil Health Card notebook's ~8% accuracy attempt (too many
sparse local-crop-name classes) with a well-scoped, high-accuracy model.
"""

import os
import threading

import numpy as np

import config

_lock = threading.Lock()
_bundle = None  # {"pipeline": sklearn Pipeline, "classes": [...]}

FEATURE_ORDER = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"]


def _load():
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                if not os.path.exists(config.CROP_MODEL_PATH):
                    raise RuntimeError(
                        f"No trained model at {config.CROP_MODEL_PATH}. Run "
                        "ai-models/train_crop_recommendation.py first (see ai-models/README.md)."
                    )
                import joblib

                _bundle = joblib.load(config.CROP_MODEL_PATH)
    return _bundle


def predict(fields: dict) -> dict:
    bundle = _load()
    pipeline = bundle["pipeline"]
    classes = bundle["classes"]

    x = np.array([[fields[key] for key in FEATURE_ORDER]], dtype=np.float32)
    probabilities = pipeline.predict_proba(x)[0]

    top_indices = np.argsort(probabilities)[::-1][:3]
    alternatives = [
        {"crop": classes[i], "confidence": round(float(probabilities[i]), 4)} for i in top_indices
    ]

    return {
        "crop": alternatives[0]["crop"],
        "confidence": alternatives[0]["confidence"],
        "alternatives": alternatives,
    }
