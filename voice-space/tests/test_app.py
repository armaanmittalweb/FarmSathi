"""Request handling with a stub synthesizer (no models needed). Run: python -m pytest tests"""
import io
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import MAX_AUDIO_BYTES, MAX_CHARS, RATE, create_app  # noqa: E402
from spoken_numbers import spell, spell_numbers  # noqa: E402

KEY = {"x-voice-key": "secret"}
FAKE_WAV = b"RIFF" + b"\0" * 60


class Stub:
    def __init__(self):
        self.calls = []

    def __call__(self, text, lang):
        self.calls.append((text, lang))
        if text == "explode":
            raise RuntimeError("boom")
        return FAKE_WAV


class Ear:
    def __init__(self):
        self.calls = []

    def __call__(self, wave, lang):
        self.calls.append((wave, lang))
        if lang == "hi" and wave.size > 3 * RATE:
            raise RuntimeError("boom")
        return " ਕਣਕ ਕਦੋਂ ਬੀਜੀਏ "


@pytest.fixture
def stub():
    return Stub()


@pytest.fixture
def ear():
    return Ear()


@pytest.fixture
def client(stub, ear):
    with TestClient(create_app(lambda: stub, voice_key="secret", make_transcriber=lambda: ear)) as c:
        yield c


def tone(seconds=1.5, rate=48_000, fmt="wav", codec=None):
    """A real recording: a 220 Hz tone, encoded the way a phone would send it."""
    import av
    import numpy as np

    buf = io.BytesIO()
    with av.open(buf, mode="w", format=fmt) as box:
        stream = box.add_stream(codec or "pcm_s16le", rate=rate, layout="mono")
        samples = (np.sin(2 * np.pi * 220 * np.arange(int(seconds * rate)) / rate) * 8000).astype(np.int16)
        frame = av.AudioFrame.from_ndarray(samples.reshape(1, -1), format="s16", layout="mono")
        frame.sample_rate = rate
        for packet in stream.encode(frame):
            box.mux(packet)
        for packet in stream.encode(None):
            box.mux(packet)
    return buf.getvalue()


def test_health_needs_no_key(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"ok": True, "voices": ["en", "hi", "pa"], "hears": ["hi", "pa"]}


def test_speak_returns_wav(client, stub):
    res = client.post("/speak", json={"text": "  नमस्ते किसान भाई  ", "lang": "hi"}, headers=KEY)
    assert res.status_code == 200
    assert res.headers["content-type"] == "audio/wav"
    assert res.content == FAKE_WAV
    assert stub.calls == [("नमस्ते किसान भाई", "hi")]


@pytest.mark.parametrize("headers", [{}, {"x-voice-key": "wrong"}, {"x-voice-key": ""}])
def test_speak_needs_the_key(client, stub, headers):
    res = client.post("/speak", json={"text": "hello", "lang": "en"}, headers=headers)
    assert res.status_code == 401
    assert stub.calls == []


def test_unset_voice_key_refuses_everyone(stub, ear):
    with TestClient(create_app(lambda: stub, voice_key="", make_transcriber=lambda: ear)) as c:
        assert c.post("/speak", json={"text": "hello", "lang": "en"}, headers={"x-voice-key": ""}).status_code == 401
        assert c.post("/transcribe?lang=pa", content=tone(), headers={"x-voice-key": ""}).status_code == 401


def test_key_is_checked_before_the_body(client):
    assert client.post("/speak", content=b"not json", headers={"content-type": "application/json"}).status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        {"text": "hello", "lang": "fr"},
        {"text": "hello"},
        {"text": "", "lang": "en"},
        {"text": "   ", "lang": "en"},
        {"text": 42, "lang": "en"},
        {"text": "x" * (MAX_CHARS + 1), "lang": "en"},
        ["text", "lang"],
    ],
)
def test_speak_rejects_bad_input(client, stub, body):
    res = client.post("/speak", json=body, headers=KEY)
    assert res.status_code == 400
    assert "error" in res.json()
    assert stub.calls == []


def test_speak_accepts_600_characters(client):
    assert client.post("/speak", json={"text": "x" * MAX_CHARS, "lang": "en"}, headers=KEY).status_code == 200


def test_speak_rejects_non_json(client):
    assert client.post("/speak", content=b"{", headers={**KEY, "content-type": "application/json"}).status_code == 400


def test_synthesis_failure_is_a_500(client):
    res = client.post("/speak", json={"text": "explode", "lang": "en"}, headers=KEY)
    assert res.status_code == 500
    assert res.json() == {"error": "synthesis failed"}


def test_numbers_are_spoken_as_words(client, stub):
    client.post("/speak", json={"text": "₹6,000 हर साल, 3 किस्तों में", "lang": "hi"}, headers=KEY)
    assert stub.calls[-1] == ("छह हज़ार रुपये हर साल, तीन किस्तों में", "hi")


def test_spell():
    assert spell(0, "en") == "zero"
    assert spell(42, "en") == "forty two"
    assert spell(101, "en") == "one hundred one"
    assert spell(1_250_000, "en") == "twelve lakh fifty thousand"
    assert spell(30_000_000, "hi") == "तीन करोड़"
    assert spell(55, "hi") == "पचपन"
    assert spell(55, "pa") == "ਪਚਵੰਜਾ"
    assert spell(2000, "pa") == "ਦੋ ਹਜ਼ਾਰ"


def test_spell_numbers():
    assert spell_numbers("up to ₹3 lakh at 4%.", "en") == "up to three lakh rupees at four percent."
    assert spell_numbers("1.5-2% premium", "en") == "one point five to two percent premium"
    assert spell_numbers("५-१० टन", "hi") == "पाँच से दस टन"
    assert spell_numbers("੨੦ ਏਕੜ", "pa") == "ਵੀਹ ਏਕੜ"
    assert spell_numbers("no numbers here", "en") == "no numbers here"


# ---- /transcribe ------------------------------------------------------------


def test_transcribe_hears_a_wav_at_16k_mono(client, ear):
    res = client.post("/transcribe?lang=pa", content=tone(1.5, rate=48_000), headers={**KEY, "content-type": "audio/wav"})
    assert res.status_code == 200
    assert res.json() == {"text": "ਕਣਕ ਕਦੋਂ ਬੀਜੀਏ", "lang": "pa", "seconds": 1.5}
    [(wave, lang)] = ear.calls
    assert lang == "pa" and wave.dtype.name == "float32" and abs(wave.size - 1.5 * RATE) < RATE * 0.05


@pytest.mark.parametrize("fmt,codec", [("webm", "libopus"), ("ogg", "libopus"), ("mp4", "aac")])
def test_transcribe_reads_what_phones_record(client, ear, fmt, codec):
    res = client.post("/transcribe?lang=hi", content=tone(1.0, fmt=fmt, codec=codec), headers=KEY)
    assert res.status_code == 200, res.text
    assert abs(ear.calls[0][0].size - RATE) < RATE * 0.1


@pytest.mark.parametrize("headers", [{}, {"x-voice-key": "wrong"}])
def test_transcribe_needs_the_key(client, ear, headers):
    assert client.post("/transcribe?lang=pa", content=tone(), headers=headers).status_code == 401
    assert ear.calls == []


@pytest.mark.parametrize("query", ["", "?lang=en", "?lang=fr"])
def test_transcribe_only_hindi_and_punjabi(client, ear, query):
    res = client.post("/transcribe" + query, content=tone(), headers=KEY)
    assert res.status_code == 400
    assert ear.calls == []


@pytest.mark.parametrize("body,message", [
    (b"", "no recording"),
    (b"definitely not audio" * 50, "the recording can't be read"),
    (None, "the recording is empty"),
    ("long", "the recording is longer than 65 seconds"),
])
def test_transcribe_rejects_bad_recordings(client, ear, body, message):
    if body is None:
        body = tone(0.1)
    elif body == "long":
        body = tone(66, rate=8_000)
    res = client.post("/transcribe?lang=pa", content=body, headers=KEY)
    assert res.status_code == 400
    assert res.json() == {"error": message}
    assert ear.calls == []


def test_transcribe_refuses_over_2_mb(client, ear):
    res = client.post("/transcribe?lang=pa", content=bytes(1) * (MAX_AUDIO_BYTES + 1), headers=KEY)
    assert res.status_code == 413
    assert ear.calls == []


def test_transcription_failure_is_a_500(client):
    res = client.post("/transcribe?lang=hi", content=tone(4), headers=KEY)
    assert res.status_code == 500
    assert res.json() == {"error": "transcription failed"}
