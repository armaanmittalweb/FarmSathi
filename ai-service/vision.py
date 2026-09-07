"""
Crop disease classifier: MobileNetV2 transfer-learning model trained by
ai-models/train_disease_model.py (finishes what
ai-models/notebooks/crop-disease-prediction-model.ipynb started — that
notebook's exported .h5 was empty/broken, see ROADMAP.md phase 4).
"""

import json
import os
import threading

import numpy as np

import config

_lock = threading.Lock()
_model = None
_class_names: list[str] | None = None

# Short, generic follow-up advice keyed by a substring of the trained class
# name (PlantVillage-style labels, e.g. "Tomato_Late_blight"). Intentionally
# general — always paired with "consult a local agriculture extension
# officer for confirmation" since this is a screening aid, not a diagnosis.
_ADVICE = {
    "healthy": "No disease detected. Continue regular monitoring and balanced fertilization.",
    "bacterial_spot": "Likely bacterial spot. Remove and destroy infected leaves, avoid overhead "
    "watering, and consider a copper-based bactericide.",
    "early_blight": "Likely early blight. Remove affected lower leaves, rotate crops next season, "
    "and consider a chlorothalonil or copper-based fungicide.",
    "late_blight": "Likely late blight — spreads fast in cool, wet weather. Remove infected plants "
    "promptly and apply a recommended fungicide; avoid working in wet fields.",
    "leaf_mold": "Likely leaf mold. Improve airflow/ventilation, reduce leaf wetness, and consider "
    "a fungicide labeled for leaf mold.",
    "septoria": "Likely Septoria leaf spot. Remove infected lower leaves, mulch to reduce soil "
    "splash, and rotate crops.",
    "spider_mite": "Likely spider mite damage. Rinse leaves with water, introduce natural predators "
    "if possible, and use a miticide/insecticidal soap if severe.",
    "target_spot": "Likely target spot. Improve air circulation and apply a recommended fungicide.",
    "yellow_leaf": "Likely Tomato Yellow Leaf Curl Virus (whitefly-transmitted). Control whiteflies "
    "and remove infected plants — there is no cure once infected.",
    "mosaic_virus": "Likely mosaic virus. Remove and destroy infected plants; disinfect tools between "
    "plants to avoid spreading it.",
}


def _advice_for(class_name: str) -> str:
    key = class_name.lower()
    for token, advice in _ADVICE.items():
        if token in key:
            return advice
    return "Consult a local agriculture extension officer to confirm the diagnosis and treatment."


_NOT_TRAINED_MSG = (
    f"No usable trained model at {config.VISION_MODEL_PATH}. Run "
    "ai-models/train_disease_model.py first (see ai-models/README.md)."
)


def _load():
    global _model, _class_names
    if _model is None:
        with _lock:
            if _model is None:
                # Check class_names.json first — cheap, and required either way.
                if not os.path.exists(config.VISION_CLASS_NAMES_PATH):
                    raise RuntimeError(_NOT_TRAINED_MSG)
                with open(config.VISION_CLASS_NAMES_PATH) as f:
                    class_names = json.load(f)

                if not os.path.exists(config.VISION_MODEL_PATH):
                    raise RuntimeError(_NOT_TRAINED_MSG)

                import tensorflow as tf

                try:
                    model = tf.keras.models.load_model(config.VISION_MODEL_PATH)
                except Exception as exc:
                    # The file exists but isn't a valid model — e.g. the
                    # original repo's ~800-byte empty .h5 stub. Surface the
                    # same clear, actionable error instead of a raw
                    # Keras/h5py stack trace.
                    raise RuntimeError(f"{_NOT_TRAINED_MSG} (underlying error: {exc})") from exc

                _model, _class_names = model, class_names
    return _model, _class_names


def predict(image_path: str) -> dict:
    from PIL import Image

    model, class_names = _load()

    img = Image.open(image_path).convert("RGB").resize(config.VISION_IMG_SIZE)
    arr = np.asarray(img, dtype=np.float32)  # model has an internal Rescaling(1/255) layer
    arr = np.expand_dims(arr, axis=0)

    predictions = model.predict(arr, verbose=0)[0]
    top_idx = int(np.argmax(predictions))
    disease = class_names[top_idx]

    return {
        "disease": disease,
        "confidence": round(float(predictions[top_idx]), 4),
        "recommendation": _advice_for(disease),
    }
