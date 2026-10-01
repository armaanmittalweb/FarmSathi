"""Request handling with a stub synthesizer (no models needed). Run: python -m pytest tests"""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import MAX_CHARS, create_app  # noqa: E402
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


@pytest.fixture
def stub():
    return Stub()


@pytest.fixture
def client(stub):
    with TestClient(create_app(lambda: stub, voice_key="secret")) as c:
        yield c


def test_health_needs_no_key(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"ok": True, "voices": ["en", "hi", "pa"]}


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


def test_unset_voice_key_refuses_everyone(stub):
    with TestClient(create_app(lambda: stub, voice_key="")) as c:
        assert c.post("/speak", json={"text": "hello", "lang": "en"}, headers={"x-voice-key": ""}).status_code == 401


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
