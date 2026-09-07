"""
FarmSaathi ai-service — a single persistent FastAPI process serving every
open-weight model the app needs (LLM, embeddings/RAG, STT, TTS, vision,
crop recommendation). Replaces the old pattern of spawning a fresh Python
process (and reloading models) per request. See ROADMAP.md section 0.

Run with:  uvicorn main:app --host 0.0.0.0 --port 8001
Every model below is lazy-loaded on first use and cached in memory, so
startup is instant and only the endpoints you actually call pay the
(one-time) model-load cost.
"""

import shutil
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

import crop_recommend
import llm
import rag
import stt
import tts
import vision

app = FastAPI(title="FarmSaathi ai-service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Chat / RAG -------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    farmer_id: Optional[str] = None
    farmer_profile_text: Optional[str] = None


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        reply = llm.generate_reply(
            message=req.message,
            language=req.language,
            farmer_id=req.farmer_id,
            farmer_profile_text=req.farmer_profile_text,
        )
        return {"reply": reply}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# --- Speech-to-text -----------------------------------------------------
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    suffix = Path(audio.filename or "audio").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        return stt.transcribe(tmp_path, language=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    finally:
        Path(tmp_path).unlink(missing_ok=True)


# --- Text-to-speech -----------------------------------------------------
class SpeakRequest(BaseModel):
    text: str
    language: str = "en"


@app.post("/speak")
def speak(req: SpeakRequest):
    try:
        wav_bytes = tts.synthesize(req.text, req.language)
        return Response(content=wav_bytes, media_type="audio/wav")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# --- Vision: plant/crop disease -----------------------------------------
@app.post("/analyze-plant")
async def analyze_plant(image: UploadFile = File(...)):
    suffix = Path(image.filename or "image").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name

    try:
        return vision.predict(tmp_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    finally:
        Path(tmp_path).unlink(missing_ok=True)


# --- Tabular: soil / crop recommendation --------------------------------
class SoilRequest(BaseModel):
    n: float
    p: float
    k: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@app.post("/analyze-soil")
def analyze_soil(req: SoilRequest):
    try:
        return crop_recommend.predict(req.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# --- RAG maintenance ------------------------------------------------------
class FarmerEmbedRequest(BaseModel):
    id: str
    name: Optional[str] = None
    language: Optional[str] = None
    age: Optional[int] = None
    farm_size: Optional[float] = None
    crop_type: Optional[str] = None
    location: Optional[dict] = None


@app.post("/rag/farmer")
def upsert_farmer(req: FarmerEmbedRequest):
    return rag.upsert_farmer(req.model_dump())
