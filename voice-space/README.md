---
title: FarmSaathi Voice
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: cc-by-nc-4.0
short_description: FarmSaathi voice: read-aloud and Hindi/Punjabi speech to text
---

# FarmSaathi voice

[FarmSaathi](https://farmsaathi.amittal.dev)'s voice, both ways, behind a tiny FastAPI app on CPU:

- **Read-aloud:** Meta's MMS-TTS (one small VITS model per language, `facebook/mms-tts-eng`, `-hin`,
  `-pan`, the same as the self-hosted `ai-service/`).
- **Speech to text for Hindi and Punjabi:** AI4Bharat's IndicConformer (`indicconformer_stt_{hi,pa}_hybrid_ctc_rnnt_large`,
  MIT, trained on Indian speech), as the ONNX exports `OpenVoiceOS/ai4bharat-indicconformer-{hi,pa}-onnx`
  run with [onnx-asr](https://github.com/istupakov/onnx-asr); PyAV decodes whatever the phone recorded.
  On 8 FLEURS Punjabi clips it got 8% of characters wrong where Whisper large-v3-turbo got 43%
  (Hindi: 11% against 16%), and as a CTC model it can't loop the way Whisper does. English stays on
  Whisper, in the Worker.

Only the FarmSaathi Worker calls it; the app never does. When the voice is asleep or busy the Worker
answers `503 {fallback: 'device'}` for read-aloud and falls back to Whisper for speech to text.

| Route | |
|---|---|
| `GET /health` | `{"ok": true, "voices": ["en", "hi", "pa"], "hears": ["hi", "pa"]}`. No key. The Worker calls it to wake the voice when the Ask tab opens. It answers only once the models are loaded |
| `POST /speak` | `{"text": "...", "lang": "en" \| "hi" \| "pa"}` → `audio/wav` (16 kHz mono PCM). Header `x-voice-key` must equal the `VOICE_KEY` secret, else 401 (and if `VOICE_KEY` is unset, everyone gets 401). Text 1-600 characters, else 400 |
| `POST /transcribe?lang=hi\|pa` | The recording as the body (webm/opus, ogg, mp4/aac or wav, at most 2 MB and 65 s), same key → `{"text", "lang", "seconds"}`. 400 for another language or a recording that can't be read, 413 over 2 MB |

Numbers are spelled out before synthesis (`spoken_numbers.py`), because the MMS vocabularies have
almost no digits and would skip them: "₹6,000" becomes "छह हज़ार रुपये", "55%" becomes
"ਪਚਵੰਜਾ ਪ੍ਰਤੀਸ਼ਤ", with Indian numbering (lakh, crore) in all three languages.

The models (three voices of about 145 MB, two speech-to-text models of about 480 MB, pinned to a
revision) are downloaded into the image at build time (`download_models.py`) and the container
runs with `HF_HUB_OFFLINE=1`, so waking up costs only the model load (a few seconds), not a
download. One request is synthesised at a time; a free CPU container produces speech at roughly real
time or faster.

## Run locally

```sh
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-dev.txt
python -m pytest tests                              # request handling with a stub voice, no models
VOICE_KEY=local-voice-key uvicorn app:app --port 7860
curl -s localhost:7860/health
curl -s -X POST localhost:7860/speak -H 'x-voice-key: local-voice-key' -H 'content-type: application/json' \
  -d '{"text":"ਸਤ ਸ੍ਰੀ ਅਕਾਲ","lang":"pa"}' -o hello.wav
```

Or with Docker: `docker build -t farmsaathi-voice . && docker run -p 7860:7860 -e VOICE_KEY=local-voice-key farmsaathi-voice`.

## Deploy (Modal)

Hugging Face Docker Spaces need a paid plan now, so the voice runs on Modal's free Starter plan
($30 of compute a month, no card, so it cannot bill past that):

1. GitHub Actions (`.github/workflows/voice-image.yml`) builds this folder's Dockerfile on every
   push to `main` that touches it and publishes `ghcr.io/armaanmittalweb/farmsaathi-voice`.
2. `modal secret create farmsaathi-voice VOICE_KEY=<the Worker's VOICE_KEY>`
3. `modal deploy voice-space/modal_app.py`: one container at most, 2 cores and 6 GB, scaled to
   zero after 3 idle minutes. The URL it prints is the Worker's `VOICE_URL` var.
4. Check: `curl <that URL>/health`.

When no container is up, the Worker's wake-up call (on opening Ask) starts one, and the phone's
own voice covers the answers that arrive before it is ready.

## Licence

MMS-TTS weights are CC-BY-NC 4.0 (Meta), which is why this Space carries that licence: fine for
FarmSaathi as a free, non-commercial project; a commercial deployment would need another voice.
IndicConformer is MIT (AI4Bharat).
