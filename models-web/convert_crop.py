"""
Convert the crop-recommendation pipeline (StandardScaler + RandomForest,
scikit-learn joblib bundle) to ONNX for in-browser inference.

    models-web/.venv/Scripts/python models-web/convert_crop.py

Input:  ai-models/crop_recommendation_model.joblib  ({"pipeline", "classes"})
Output: frontend/public/models/crop.onnx            (float32 features [N,7] -> probabilities [N,22])
        frontend/public/models/crop.classes.json    (the 22 crop names, same order as the probabilities)

Feature order is ai-service/crop_recommend.py's FEATURE_ORDER:
[n, p, k, temperature, humidity, ph, rainfall].

Why the scaler is not skl2onnx's Scaler op: scikit-learn scales a float32 row
with numpy in-place ops (X -= mean_; X /= scale_), each computed in float64 and
rounded back to float32. ONNX's Scaler works in float32 throughout, which
rounds differently and flips a few tree splits (probabilities off by up to
0.055 on the training CSV). So the graph does the same thing numpy does:
Cast to double, Sub, Cast to float, Cast to double, Div, Cast to float, then
the forest (converted by skl2onnx).
"""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "ai-models" / "crop_recommendation_model.joblib"
OUT_DIR = ROOT / "frontend" / "public" / "models"
FEATURES = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"]
OPSET = 15


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bundle = joblib.load(SRC)
    pipeline, classes = bundle["pipeline"], list(bundle["classes"])
    assert list(pipeline.classes_) == classes, "bundle classes differ from pipeline.classes_"
    scaler, forest = pipeline.steps[0][1], pipeline.steps[-1][1]
    assert scaler.with_mean and scaler.with_std

    onx = convert_sklearn(
        forest,
        initial_types=[("scaled", FloatTensorType([None, len(FEATURES)]))],
        options={id(forest): {"zipmap": False}},  # plain tensor output, no ZipMap
        target_opset={"": OPSET, "ai.onnx.ml": 3},
    )
    g = onx.graph
    # Keep only the probabilities output (the string label output is not needed in the app).
    keep = [o for o in g.output if o.name == "probabilities"]
    del g.output[:]
    g.output.extend(keep)

    mean = numpy_helper.from_array(scaler.mean_.astype(np.float64), "scaler_mean")
    scale = numpy_helper.from_array(scaler.scale_.astype(np.float64), "scaler_scale")
    pre = [
        helper.make_node("Cast", ["features"], ["f64_a"], to=TensorProto.DOUBLE),
        helper.make_node("Sub", ["f64_a", "scaler_mean"], ["centered64"]),
        helper.make_node("Cast", ["centered64"], ["centered32"], to=TensorProto.FLOAT),
        helper.make_node("Cast", ["centered32"], ["f64_b"], to=TensorProto.DOUBLE),
        helper.make_node("Div", ["f64_b", "scaler_scale"], ["scaled64"]),
        helper.make_node("Cast", ["scaled64"], ["scaled"], to=TensorProto.FLOAT),
    ]
    nodes = pre + list(g.node)
    del g.node[:]
    g.node.extend(nodes)
    g.initializer.extend([mean, scale])
    del g.input[:]
    g.input.extend([helper.make_tensor_value_info("features", TensorProto.FLOAT, [None, len(FEATURES)])])
    onnx.checker.check_model(onx)

    out = OUT_DIR / "crop.onnx"
    onnx.save(onx, out)
    (OUT_DIR / "crop.classes.json").write_text(json.dumps(classes, indent=2) + "\n", encoding="utf-8")

    import onnxruntime as ort

    sess = ort.InferenceSession(str(out), providers=["CPUExecutionProvider"])
    x = np.array([[90, 42, 43, 20.88, 82.0, 6.5, 202.9]], dtype=np.float32)
    got = sess.run(["probabilities"], {"features": x})[0]
    diff = float(np.abs(got - pipeline.predict_proba(x)).max())
    print(f"wrote {out} ({out.stat().st_size / 1e6:.2f} MB), {len(classes)} classes; self-check max diff {diff:.1e}")
    return 0 if diff < 1e-5 else 1


if __name__ == "__main__":
    sys.exit(main())
