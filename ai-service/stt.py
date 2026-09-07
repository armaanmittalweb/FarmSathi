"""
Speech-to-text via faster-whisper (CTranslate2-optimized Whisper). CPU
friendly, int8 quantized by default — see config.WHISPER_MODEL_SIZE.
"""

import threading

import config

_lock = threading.Lock()
_model = None

# faster-whisper uses Whisper's own language codes, which happen to match
# our app's for these three languages.
_SUPPORTED = {"en", "hi", "pa"}


def get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                from faster_whisper import WhisperModel

                _model = WhisperModel(
                    config.WHISPER_MODEL_SIZE, device="cpu", compute_type=config.WHISPER_COMPUTE_TYPE
                )
    return _model


def transcribe(file_path: str, language: str | None = None) -> dict:
    model = get_model()
    lang = language if language in _SUPPORTED else None  # None = auto-detect
    segments, info = model.transcribe(file_path, language=lang, vad_filter=True)
    text = " ".join(seg.text.strip() for seg in segments).strip()
    return {"text": text, "language": info.language}
