"""
FarmSaathi voice: a Hugging Face Docker Space that turns an answer into speech with Meta's MMS-TTS
(one small VITS model per language, the same ones as ai-service/config.py). Only the FarmSaathi
Worker calls it, with the shared secret in x-voice-key.

  GET  /health                         {"ok": true, "voices": [...]}, no key (the Worker's wake-up ping)
  POST /speak {"text", "lang"}         audio/wav; 401 without the key, 400 for bad input
"""
import hmac
import io
import os
import threading
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, Response

from spoken_numbers import spell_numbers

VOICES = {
    "en": "facebook/mms-tts-eng",
    "hi": "facebook/mms-tts-hin",
    "pa": "facebook/mms-tts-pan",
}
MAX_CHARS = 600

Synthesizer = Callable[[str, str], bytes]


class MmsSynthesizer:
    """The three voices, loaded once. Calls are serialised: the free CPU Space has 2 vCPUs."""

    def __init__(self) -> None:
        import torch
        from transformers import AutoTokenizer, VitsModel

        torch.set_num_threads(max(1, os.cpu_count() or 1))
        self._torch = torch
        self._lock = threading.Lock()
        self._voices = {}
        for lang, repo in VOICES.items():
            self._voices[lang] = (VitsModel.from_pretrained(repo).eval(), AutoTokenizer.from_pretrained(repo))

    def __call__(self, text: str, lang: str) -> bytes:
        import numpy as np
        import scipy.io.wavfile

        model, tokenizer = self._voices[lang]
        inputs = tokenizer(text, return_tensors="pt")
        if inputs["input_ids"].shape[-1] == 0:
            raise ValueError("nothing the voice can say")
        with self._lock, self._torch.no_grad():
            waveform = model(**inputs).waveform
        pcm = (np.clip(waveform.squeeze().cpu().numpy(), -1.0, 1.0) * 32767).astype(np.int16)
        buffer = io.BytesIO()
        scipy.io.wavfile.write(buffer, rate=model.config.sampling_rate, data=pcm)
        return buffer.getvalue()


def create_app(make_synthesizer: Callable[[], Synthesizer] = MmsSynthesizer, voice_key: str | None = None) -> FastAPI:
    state: dict[str, Synthesizer] = {}
    key = (voice_key if voice_key is not None else os.environ.get("VOICE_KEY", "")).encode()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        # Before the port opens, so a woken Space answers /health only once it can speak.
        state["synth"] = make_synthesizer()
        yield

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    def error(status: int, message: str) -> JSONResponse:
        return JSONResponse({"error": message}, status_code=status)

    @app.get("/health")
    def health():
        return {"ok": True, "voices": sorted(VOICES)}

    @app.post("/speak")
    async def speak(request: Request):
        # The key is checked before the body is read. An unset VOICE_KEY refuses everyone.
        sent = request.headers.get("x-voice-key", "").encode()
        if not key or not hmac.compare_digest(sent, key):
            return error(401, "unauthorized")
        try:
            body = await request.json()
        except Exception:
            return error(400, "expected JSON {text, lang}")
        if not isinstance(body, dict):
            return error(400, "expected JSON {text, lang}")
        text, lang = body.get("text"), body.get("lang")
        if lang not in VOICES:
            return error(400, "lang must be en, hi or pa")
        if not isinstance(text, str) or not text.strip():
            return error(400, "text is empty")
        if len(text) > MAX_CHARS:
            return error(400, f"text is longer than {MAX_CHARS} characters")
        try:
            audio = await run_in_threadpool(state["synth"], spell_numbers(text.strip(), lang), lang)
        except ValueError as exc:
            return error(400, str(exc))
        except Exception:
            return error(500, "synthesis failed")
        return Response(audio, media_type="audio/wav", headers={"cache-control": "no-store"})

    return app


app = create_app()
