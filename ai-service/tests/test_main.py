"""
Smoke tests for the FastAPI endpoints in main.py.

These deliberately avoid triggering any real model load/download (LLM,
Whisper, TTS, embeddings all pull multi-hundred-MB weights from Hugging
Face on first use — not something a fast offline test suite should do).
What IS safe and tested here:
  - endpoints that fail fast with a clear 503 when a *trained* model file
    is simply missing from disk (vision, crop-recommendation) — no network
    involved, just an os.path.exists() check;
  - request validation (422s) on the endpoints that *would* trigger a
    network download if the handler ran, exercised only up to the point
    Pydantic rejects the malformed request.
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_analyze_soil_valid_shape_but_no_trained_model_yet():
    # No network involved: crop_recommend._load() checks os.path.exists()
    # before doing anything else. Run ai-models/train_crop_recommendation.py
    # to make this endpoint actually work.
    payload = {"n": 90, "p": 42, "k": 43, "temperature": 20.8, "humidity": 82, "ph": 6.5, "rainfall": 202}
    res = client.post("/analyze-soil", json=payload)
    assert res.status_code == 503
    assert "train_crop_recommendation.py" in res.json()["detail"]


def test_analyze_soil_rejects_missing_fields():
    res = client.post("/analyze-soil", json={"n": 90})
    assert res.status_code == 422


def test_analyze_plant_no_trained_model_yet(tmp_path):
    # Same reasoning as above, for the vision model.
    dummy_image = tmp_path / "leaf.jpg"
    dummy_image.write_bytes(b"not a real jpeg, just needs to reach the model-load check")

    with dummy_image.open("rb") as f:
        res = client.post("/analyze-plant", files={"image": ("leaf.jpg", f, "image/jpeg")})

    assert res.status_code == 503
    assert "train_disease_model.py" in res.json()["detail"]


def test_chat_rejects_missing_message():
    # Validated by Pydantic before llm.generate_reply() (and its
    # network-touching model load) ever runs.
    res = client.post("/chat", json={"language": "en"})
    assert res.status_code == 422


def test_speak_rejects_missing_text():
    res = client.post("/speak", json={"language": "en"})
    assert res.status_code == 422
