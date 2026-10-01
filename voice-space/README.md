---
title: FarmSaathi Voice
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: cc-by-nc-4.0
short_description: Read-aloud voice for FarmSaathi in English, Hindi, Punjabi
---

# FarmSaathi voice

The read-aloud voice for [FarmSaathi](https://farmsaathi.amittal.dev): Meta's MMS-TTS (one small
VITS model per language, `facebook/mms-tts-eng`, `-hin`, `-pan`, the same as the self-hosted
`ai-service/`) behind a tiny FastAPI app on CPU. Only the FarmSaathi Worker calls it; the app never
does. When this Space is asleep or busy the Worker answers `503 {fallback: 'device'}` and the
phone reads the answer with its own voice.

| Route | |
|---|---|
| `GET /health` | `{"ok": true, "voices": ["en", "hi", "pa"]}`. No key. The Worker calls it to wake the Space when the Ask tab opens. It answers only once the models are loaded |
| `POST /speak` | `{"text": "...", "lang": "en" \| "hi" \| "pa"}` → `audio/wav` (16 kHz mono PCM). Header `x-voice-key` must equal the `VOICE_KEY` secret, else 401 (and if `VOICE_KEY` is unset, everyone gets 401). Text 1-600 characters, else 400 |

Numbers are spelled out before synthesis (`spoken_numbers.py`), because the MMS vocabularies have
almost no digits and would skip them: "₹6,000" becomes "छह हज़ार रुपये", "55%" becomes
"ਪਚਵੰਜਾ ਪ੍ਰਤੀਸ਼ਤ", with Indian numbering (lakh, crore) in all three languages.

The models are downloaded into the image at build time (`download_models.py`) and the container
runs with `HF_HUB_OFFLINE=1`, so waking up costs only the model load (a few seconds), not a
download. One request is synthesised at a time; a free CPU Space produces speech at roughly real
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

## Create the Space

1. On huggingface.co: New Space → owner `armaanmittalweb`, name `farmsaathi-voice`, SDK **Docker**
   (blank template), hardware **CPU basic (free)**, visibility **Public** (the Worker calls it
   without a Hugging Face token; `x-voice-key` is what keeps others out of `/speak`).
2. Settings → Variables and secrets → New secret `VOICE_KEY` = a long random string. Put the same
   value into the Worker: `npx wrangler secret put VOICE_KEY`.
3. Push this folder's contents to the Space repo (`git clone https://huggingface.co/spaces/armaanmittalweb/farmsaathi-voice`,
   copy the files in, commit, push). The first build downloads torch and the three voices (a few minutes).
4. Check: `curl https://armaanmittalweb-farmsaathi-voice.hf.space/health`. That URL is the Worker's `VOICE_URL` var.

A free Space sleeps after 48 hours without traffic; the Worker's wake-up call and the phone's own
voice cover that.

## Licence

MMS-TTS weights are CC-BY-NC 4.0 (Meta), which is why this Space carries that licence: fine for
FarmSaathi as a free, non-commercial project; a commercial deployment would need another voice.
