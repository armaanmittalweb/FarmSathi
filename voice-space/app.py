"""
FarmSaathi voice, both directions. Answers become speech with Meta's MMS-TTS (one small VITS model
per language, the same ones as ai-service/config.py). Hindi and Punjabi questions become text with
AI4Bharat's IndicConformer (one CTC model per language, trained on Indian speech; Whisper garbles
Punjabi and can loop until the text runs past the question limit). Only the FarmSaathi Worker calls
it, with the shared secret in x-voice-key.

  GET  /health                         {"ok": true, "voices": [...], "hears": [...]}, no key (the wake-up ping)
  POST /speak {"text", "lang"}         audio/wav; 401 without the key, 400 for bad input
  POST /transcribe?lang=hi|pa          the recording as the body (webm, ogg, mp4 or wav) -> {"text", "lang", "seconds"}
"""
import hmac
import io
import os
import threading
import time
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

# Exports of AI4Bharat's indicconformer_stt_{hi,pa}_hybrid_ctc_rnnt_large (MIT) for onnx-asr, pinned.
HEARS = {
    "hi": ("OpenVoiceOS/ai4bharat-indicconformer-hi-onnx", "8960b8611af5b8c375d442d52907360176410c8b"),
    "pa": ("OpenVoiceOS/ai4bharat-indicconformer-pa-onnx", "a02bd2a0b75d41bd26c9f1e6d7e520a8f83f468d"),
}
HEAR_FILES = ["config.json", "vocab.txt", "model.onnx", "model.onnx_data"]
# A plain directory per language, not the Hugging Face cache: onnxruntime refuses external weights
# reached through the cache's symlinks ("External data path escapes model directory").
HEAR_DIR = os.environ.get("HEAR_DIR", os.path.join(os.path.expanduser("~"), "stt"))
MAX_AUDIO_BYTES = 2 * 1024 * 1024 + 64 * 1024
MAX_SECONDS = 65  # the app stops recording at 60
RATE = 16_000

Synthesizer = Callable[[str, str], bytes]
Transcriber = Callable[["np.ndarray", str], str]


class BadRecording(Exception):
    """A recording that can't be transcribed; the message is safe to send back."""


def decode_audio(data: bytes, limit_s: float = MAX_SECONDS) -> "np.ndarray":
    """Any recording the app sends (webm/opus, ogg, mp4/aac, wav) as mono float32 at 16 kHz.
    BadRecording when it can't be read, is empty, or runs longer than `limit_s`."""
    import av
    import numpy as np

    parts = []
    try:
        with av.open(io.BytesIO(data), mode="r") as box:
            if not box.streams.audio:
                raise BadRecording("no audio in the recording")
            resampler = av.AudioResampler(format="flt", layout="mono", rate=RATE)
            for frame in box.decode(audio=0):
                for out in resampler.resample(frame):
                    parts.append(out.to_ndarray().reshape(-1))
                if sum(len(p) for p in parts) > limit_s * RATE:
                    raise BadRecording(f"the recording is longer than {limit_s} seconds")
            for out in resampler.resample(None):
                parts.append(out.to_ndarray().reshape(-1))
    except BadRecording:
        raise
    except Exception as exc:  # av.error.* for anything that is not a recording
        raise BadRecording("the recording can't be read") from exc
    wave = np.concatenate(parts).astype(np.float32) if parts else np.zeros(0, np.float32)
    if wave.size < RATE // 4:
        raise BadRecording("the recording is empty")
    return wave


class IndicTranscriber:
    """The Hindi and Punjabi models, loaded once from the image. Calls are serialised like the voices'."""

    def __init__(self) -> None:
        import onnx_asr
        import onnxruntime as ort

        opts = ort.SessionOptions()
        opts.intra_op_num_threads = max(1, os.cpu_count() or 1)
        self._lock = threading.Lock()
        self._models = {}
        for lang in HEARS:
            self._models[lang] = onnx_asr.load_model("nemo-conformer-ctc", os.path.join(HEAR_DIR, lang), sess_options=opts)

    def __call__(self, wave: "np.ndarray", lang: str) -> str:
        with self._lock:
            return str(self._models[lang].recognize(wave, sample_rate=RATE))


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


def create_app(make_synthesizer: Callable[[], Synthesizer] = MmsSynthesizer, voice_key: str | None = None,
               make_transcriber: Callable[[], Transcriber] = IndicTranscriber) -> FastAPI:
    state: dict = {}
    key = (voice_key if voice_key is not None else os.environ.get("VOICE_KEY", "")).encode()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        # Before the port opens, so a woken Space answers /health only once it can speak.
        state["synth"] = make_synthesizer()
        state["hear"] = make_transcriber()
        yield

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    def error(status: int, message: str) -> JSONResponse:
        return JSONResponse({"error": message}, status_code=status)

    @app.get("/health")
    def health():
        return {"ok": True, "voices": sorted(VOICES), "hears": sorted(HEARS)}

    def allowed(request: Request) -> bool:
        # The key is checked before the body is read. An unset VOICE_KEY refuses everyone.
        sent = request.headers.get("x-voice-key", "").encode()
        return bool(key) and hmac.compare_digest(sent, key)

    @app.post("/speak")
    async def speak(request: Request):
        if not allowed(request):
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

    @app.post("/transcribe")
    async def transcribe(request: Request):
        if not allowed(request):
            return error(401, "unauthorized")
        lang = request.query_params.get("lang")
        if lang not in HEARS:
            return error(400, "lang must be hi or pa")
        if int(request.headers.get("content-length") or 0) > MAX_AUDIO_BYTES:
            return error(413, "the recording is larger than 2 MB")
        data = await request.body()
        if not data:
            return error(400, "no recording")
        if len(data) > MAX_AUDIO_BYTES:
            return error(413, "the recording is larger than 2 MB")
        try:
            wave = await run_in_threadpool(decode_audio, data)
        except BadRecording as exc:
            return error(400, str(exc))
        started = time.perf_counter()
        try:
            text = " ".join((await run_in_threadpool(state["hear"], wave, lang)).split())
        except Exception:
            return error(500, "transcription failed")
        took = (time.perf_counter() - started) * 1000
        return JSONResponse({"text": text, "lang": lang, "seconds": round(wave.size / RATE, 2)},
                            headers={"cache-control": "no-store", "server-timing": f"asr;dur={took:.0f}"})

    return app


app = create_app()
