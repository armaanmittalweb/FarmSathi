# FarmSaathi 🌾
<img align="center" src="assets/FarmSaathi.png" alt="FarmSaathi Logo" width="300" />

## Empowering Farmers with AI-Driven Agricultural Assistance

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Open Source Models](https://img.shields.io/badge/AI-Open--Weight%20Models-orange?style=for-the-badge)](./ROADMAP.md)

## Overview

FarmSaathi is an accessible agricultural assistance platform for farmers
across India: voice-enabled chat in Hindi, English, and Punjabi; crop
disease detection from a leaf photo; a soil/climate-based crop
recommendation; weather forecasts; and a government-schemes directory.

Every AI component is an **open-weight model run locally** — no paid API
keys, no per-request billing, fully self-hostable. See
[ROADMAP.md](./ROADMAP.md) for the full architecture write-up and model
choices.

## Architecture

```
FarmSathi/
├── backend/       # Node/Express — auth (phone+OTP → JWT), MongoDB, proxies to ai-service
├── ai-service/    # Python/FastAPI — LLM, RAG, STT, TTS, vision, crop-recommendation (all local models)
├── frontend/      # React (Vite) + Tailwind + Redux Toolkit + react-i18next
└── ai-models/     # Training dataset + trained model outputs + training scripts
```

The backend never spawns Python per request — `ai-service` is a
persistent process that loads every model once and serves it over HTTP.

## What's in this repo vs. what downloads on first run

To make cloning this repo as close to zero-friction as possible, **the
training dataset and both of this project's own trained models are
committed directly** — no Kaggle account, no training run, no separate
download needed for those:

| | Included in repo | Size |
|---|---|---|
| PlantVillage training images (`ai-models/plantvillage_repo/`) | ✅ | ~415MB |
| Crop recommendation training CSV (`ai-models/data/`) | ✅ | ~150KB |
| Trained crop-disease model (`.h5`) | ✅ | ~11MB |
| Trained crop-recommendation model (`.joblib`) | ✅ | ~7MB |

**What is *not* committed** (and downloads automatically the first time
you actually use that feature): the third-party pretrained AI models —
the chat LLM, embeddings, speech-to-text, text-to-speech, and translation
models — several GB total, redistributed verbatim from Hugging
Face/Meta/Qwen. These aren't this project's own artifacts, so they're not
part of the repo; see [Step 3](#step-3-ai-service-the-ai-backbone) for
sizes and timing.

## Feature status (all verified working, not just "should work")

| Feature | Status |
|---|---|
| Voice + text chat, grounded by RAG (Hindi/English/Punjabi) | ✅ verified — responses cite real seeded scheme data, not hallucinated; Punjabi confirmed via LLM→NLLB translation path |
| Crop disease detection from a leaf photo | ✅ verified — 93.3% on a 45-image spot-check |
| Soil/climate-based crop recommendation | ✅ verified — 99.5% test accuracy |
| 7-day weather forecast (Open-Meteo, no API key) | ✅ verified — live data |
| Government schemes directory (PM-KISAN, PMFBY, KCC, etc.) | ✅ |
| Phone-number + OTP authentication (JWT) | ✅ verified — dev-mode OTP, no SMS provider needed |
| Text-to-speech / speech-to-text | ✅ verified — round-trip tested (TTS output fed back through STT, got the same sentence back) |

---

## Setup — step by step, for Windows, macOS, and Linux

### Prerequisites

You need **Node.js 18+**, **Python 3.10+**, and **Git**. MongoDB is
optional — see [Step 1](#step-1-mongodb) for a no-install alternative.

<details>
<summary><b>Windows</b></summary>

Using [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/) (built into Windows 10/11):
```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```
Verify (**open a new terminal first** — PATH changes need a fresh shell):
```powershell
node --version   # v18+ 
python --version # 3.10+ (python.org installer, or `winget install --id Python.Python.3.12`)
git --version
```
</details>

<details>
<summary><b>macOS</b></summary>

Using [Homebrew](https://brew.sh/):
```bash
brew install node python@3.12 git
```
Verify:
```bash
node --version
python3 --version
git --version
```
</details>

<details>
<summary><b>Linux (Debian/Ubuntu)</b></summary>

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-venv python3-pip git
```
Verify:
```bash
node --version
python3 --version
git --version
```
</details>

### Clone

```bash
git clone https://github.com/armaanmittalweb/FarmSathi.git
cd FarmSathi
```

---

### Step 1: MongoDB

Pick **one**:

**Option A — no install, use the bundled dev script (recommended for trying this out):**
```bash
cd backend
npm install
npm run dev:mongo
```
This runs a real, disk-persisted local `mongod` (via `mongodb-memory-server`'s
binary manager) with no Windows service, no admin/root, nothing to
configure. It downloads a standalone `mongod` binary the first time
(smaller than a full MongoDB installer), then persists data to
`backend/.mongo-data/` across restarts. Leave this running in its own
terminal.

**Option B — a real MongoDB install:**
- Windows: `winget install --id MongoDB.Server -e` (the installer opens a
  setup wizard — accept the defaults, "Install as a Service")
- macOS: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- Linux: follow [MongoDB's Ubuntu/Debian install docs](https://www.mongodb.com/docs/manual/administration/install-on-linux/)

**Option C — Docker:** `docker compose up mongo` (see [Docker section](#or-everything-at-once-with-docker) below)

---

### Step 2: Backend

```bash
cd backend
npm install                 # skip if you already ran this in Step 1
```

Copy the env template:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```
The defaults work as-is for local dev (`DEV_MODE=true` means OTPs show up
in the API response instead of needing a real SMS provider). Open `.env`
and change `JWT_SECRET` to any random string if you like.

Start it:
```bash
npm run dev
```
Leave this running. Verify: open http://localhost:5000/health — should
show `{"status":"ok"}`.

**If you hit `npm warn allow-scripts ... has install scripts not yet
covered`** (a newer-npm supply-chain safety gate): run
`npm approve-scripts esbuild` (and/or whichever package it names) once,
then re-run `npm install`.

---

### Step 3: ai-service (the AI backbone)

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```
</details>

<details>
<summary><b>macOS / Linux</b></summary>

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```
</details>

Seed the RAG knowledge base (schemes + farming tips — quick, one-time):
```bash
python seed_knowledge.py
```

Start it:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```
Leave this running. Verify: http://localhost:8001/health should show
`{"status":"ok"}`.

**Nothing downloads yet** — every model here loads lazily, the first time
you actually use that feature:

| Feature | Model | Approx. size | When it downloads |
|---|---|---|---|
| Chat | Qwen2.5-3B-Instruct (GGUF) | ~2GB | first `/chat` call |
| RAG retrieval | multilingual-e5-small | ~470MB | first `/chat` call |
| Speech-to-text | faster-whisper (small) | ~460MB | first `/transcribe` call |
| Text-to-speech | MMS-TTS (per language) | ~120MB each | first `/speak` call in that language |
| Punjabi translation | NLLB-200-distilled | ~2.4GB | first Punjabi `/chat` reply |

So: trying the **Chat** feature in English/Hindi the first time downloads
~2.5GB; adding Punjabi and voice brings the one-time total to roughly
5-5.5GB. All of it is cached afterward (`~/.cache/huggingface` and
`ai-service/models/`) — every run after the first is instant.

**If a download seems stuck at 0 bytes for a while**: Hugging Face's
newer "Xet" transfer protocol can hang in some network environments. Set
`HF_HUB_DISABLE_XET=1` before starting `uvicorn` to fall back to plain
HTTPS downloads (confirmed fix, went from stalled to ~2MB/s):
```bash
# Windows (PowerShell)
$env:HF_HUB_DISABLE_XET = "1"
# macOS / Linux
export HF_HUB_DISABLE_XET=1
```

**If `pip install llama-cpp-python` (inside `requirements.txt`) tries to
compile from source and fails** (no C++ compiler on your machine): install
it from the maintainer's prebuilt-wheel index first, then re-run
`pip install -r requirements.txt`:
```bash
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

---

### Step 4: Frontend

```bash
cd frontend
npm install
```
```bash
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```
```bash
npm run dev
```
Open **http://localhost:5173** — that's the app.

---

### Or: everything at once with Docker

```bash
docker compose up --build
```
The dataset and trained models are already in the repo, so this works
out of the box for the soil/crop-disease features immediately — only the
third-party pretrained models (chat/voice) still download on first use,
same as above. See [docker-compose.yml](./docker-compose.yml).

---

## Verify it's all working

1. Open http://localhost:5173 → **Register** → **Login** (the OTP shows
   right in the UI, no SMS needed).
2. **Weather** → "Use my location" — should work immediately (Open-Meteo,
   no setup).
3. **Schemes** — should list 6 schemes immediately (no AI model needed).
4. **Soil Analysis** — try N=90, P=42, K=43, temperature=20.8,
   humidity=82, pH=6.5, rainfall=202 → should return "rice".
5. **Crop Analysis** — upload any leaf photo (or one from
   `ai-models/plantvillage_repo/raw/color/<any class>/`) — should return a
   disease name + confidence.
6. **Chat** — ask a question. First reply downloads the LLM (~2GB, see
   Step 3) so it'll be slow the very first time; instant after that.

## Tests
```bash
cd backend && npm test          # Jest + Supertest (spins up an in-memory MongoDB)
cd ai-service && pip install -r requirements-dev.txt && pytest
```

## Contact

Open an issue on this repository with questions or feedback.

---

Made with ❤️ for Indian Farmers
