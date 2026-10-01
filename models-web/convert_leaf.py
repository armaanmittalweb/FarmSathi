"""
Convert the leaf-disease classifier (Keras .h5, MobileNetV2 + head) to ONNX
for in-browser inference with onnxruntime-web.

    models-web/.venv/Scripts/python models-web/convert_leaf.py

Input:  ai-models/Crop_Disease_Prediction_Model/Crop_Disease_Prediction_Model.h5
Output: frontend/public/models/leaf.onnx            (NHWC float32 [1,224,224,3], raw 0..255 pixels)
        frontend/public/models/leaf.classes.json    (the 15 class names, same order as the softmax)

The model keeps its own Rescaling(1/255) layer, so the browser feeds the
same thing ai-service/vision.py feeds Keras: RGB, resized to 224x224 with
PIL's bicubic filter, as float32 0..255.
"""

import json
import os
import shutil
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import numpy as np
import tensorflow as tf
import tf2onnx

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "Crop_Disease_Prediction_Model.h5"
CLASSES = ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "class_names.json"
OUT_DIR = ROOT / "frontend" / "public" / "models"
OPSET = 15


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    model = tf.keras.models.load_model(SRC, compile=False)

    @tf.function(input_signature=[tf.TensorSpec([None, 224, 224, 3], tf.float32, name="image")])
    def infer(image):
        return {"probs": model(image, training=False)}

    out = OUT_DIR / "leaf.onnx"
    spec = [tf.TensorSpec([None, 224, 224, 3], tf.float32, name="image")]
    tf2onnx.convert.from_function(infer, input_signature=spec, opset=OPSET, output_path=str(out))
    shutil.copyfile(CLASSES, OUT_DIR / "leaf.classes.json")

    # quick self-check against Keras
    import onnxruntime as ort

    x = np.random.default_rng(0).uniform(0, 255, (2, 224, 224, 3)).astype(np.float32)
    ref = model.predict(x, verbose=0)
    sess = ort.InferenceSession(str(out), providers=["CPUExecutionProvider"])
    got = sess.run(None, {sess.get_inputs()[0].name: x})[0]
    diff = float(np.abs(ref - got).max())
    print(f"wrote {out} ({out.stat().st_size / 1e6:.2f} MB), opset {OPSET}, input {sess.get_inputs()[0].name} "
          f"{sess.get_inputs()[0].shape}, output {sess.get_outputs()[0].name}; max |keras-onnx| = {diff:.2e}")
    return 0 if diff < 1e-4 else 1


if __name__ == "__main__":
    sys.exit(main())
