"""
Text-to-speech via Meta's MMS-TTS (transformers VitsModel) — one small
VITS checkpoint per language, including a real Punjabi voice, which is
what ruled out Piper TTS (no Punjabi voice) as the sole option.
"""

import io
import threading

import numpy as np
import scipy.io.wavfile

import config

_lock = threading.Lock()
_models: dict[str, tuple] = {}  # language -> (model, tokenizer)


def _load(language: str):
    if language not in _models:
        with _lock:
            if language not in _models:
                repo = config.MMS_TTS_MODELS.get(language, config.MMS_TTS_MODELS["en"])
                from transformers import VitsModel, AutoTokenizer

                model = VitsModel.from_pretrained(repo)
                tokenizer = AutoTokenizer.from_pretrained(repo)
                _models[language] = (model, tokenizer)
    return _models[language]


def synthesize(text: str, language: str = "en") -> bytes:
    """Returns raw WAV bytes for the given text in the given language."""
    import torch

    model, tokenizer = _load(language)
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        output = model(**inputs).waveform

    waveform = output.squeeze().cpu().numpy()
    # Normalize to int16 PCM for a standard, universally-playable .wav file.
    waveform = np.clip(waveform, -1.0, 1.0)
    pcm = (waveform * 32767).astype(np.int16)

    buffer = io.BytesIO()
    scipy.io.wavfile.write(buffer, rate=model.config.sampling_rate, data=pcm)
    return buffer.getvalue()
