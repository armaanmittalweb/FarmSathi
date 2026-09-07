# FarmSaathi — Completion Roadmap (Open-Source / Self-Hosted AI Stack)

## Implementation status

All code for phases 0-7 below has been written. What that does and doesn't
mean in practice:

**Done (code-complete, in this repo):**
- All bugfixes in section 1.
- Phase 1 (MongoDB models, phone+OTP auth, JWT) — `backend/models/`,
  `backend/controllers/authController.js`.
- Phase 2 (`ai-service` FastAPI skeleton, lazy model loading) — `ai-service/`.
- Phase 3 + 3b (RAG chat, STT, TTS, translation fallback) —
  `ai-service/llm.py`, `rag.py`, `stt.py`, `tts.py`, `translate.py`.
- Phase 4 (vision + tabular training scripts, ai-service serving code) —
  `ai-models/train_disease_model.py`, `train_crop_recommendation.py`,
  `ai-service/vision.py`, `crop_recommend.py`.
- Phase 5 (Open-Meteo weather, curated schemes dataset + RAG seeding) —
  `backend/routes/weather.js`, `backend/data/schemes.json`,
  `ai-service/seed_knowledge.py`.
- Phase 6 (full React frontend: routing, Redux Toolkit auth state,
  Tailwind UI, react-i18next in 3 languages, voice recording) — `frontend/src/`.
- Phase 7 (Docker Compose for the full stack, Jest + pytest test suites,
  this README rewrite) — `docker-compose.yml`, `*/Dockerfile`, `*/tests/`.

**What you still need to do on your own machine (not doable from here):**
1. `npm install` in `backend/` and `frontend/` (no Node.js in this
   environment — code was syntax-checked by hand, not executed).
2. Install MongoDB locally (or `docker compose up mongo`).
3. `pip install -r ai-service/requirements.txt` and let the LLM/embedding/
   STT/TTS models auto-download on first use (~3.3GB total, one-time).
4. Download the two open datasets (PlantVillage; Crop Recommendation
   Dataset) and run the two training scripts in `ai-models/` — the actual
   multi-GB dataset download and GPU/CPU training time is impractical to
   do inside this session. Until you do, `/analyze-plant` and
   `/analyze-soil` respond with a clear 503 explaining exactly that,
   instead of crashing.
5. Run `python seed_knowledge.py` once ai-service's dependencies are
   installed, to populate the RAG knowledge base.
6. Run the test suites (`npm test` in `backend/`, `pytest` in
   `ai-service/`) on your machine to confirm everything actually executes
   — see each directory's README for exact commands.

---

Target: a fully working, independently-hostable version of FarmSaathi with **no paid API keys required** — every AI component is an open-weight model run locally. Frontend stays a React web app (not React Native). LLM/ASR/TTS/vision models run in-process inside a persistent Python inference service (not spawned per request).

---

## 0. Architecture decision (baseline for everything below)

**Problem with the current design:** `server.js` does `spawn("python3", [...])` per request. That reloads whatever model the script imports on *every single call* — for an LLM or Whisper model that's 5–30s of dead time per message, and it will not scale past one concurrent user.

**Fix:** introduce a long-running **Python FastAPI inference service** (`ai-service/`) that loads every model once at startup and exposes HTTP endpoints. The Node backend becomes a thin proxy that calls this service instead of spawning processes.

```
FarmSathi/
├── backend/           # Node/Express — auth, chat orchestration, DB, file uploads
├── ai-service/        # NEW — FastAPI, loads all models once, serves HTTP
│   ├── main.py
│   ├── llm.py            # chat/RAG via llama-cpp-python
│   ├── stt.py             # faster-whisper
│   ├── tts.py             # MMS-TTS / Piper
│   ├── translate.py       # IndicTrans2 / NLLB (only if needed)
│   ├── vision.py           # crop disease classifier
│   ├── crop_recommend.py  # tabular soil/crop model
│   ├── rag.py              # ChromaDB retrieval
│   └── requirements.txt
├── frontend/           # React web app (Vite)
└── ai-models/           # training notebooks + trained weights
```

---

## 1. Fix existing bugs first (do this before adding anything)

| # | Bug | Fix |
|---|---|---|
| 1 | [chat.js](backend/routes/chat.js) requires `../controllers/chatController` — file is actually `chatControllers.js` | Rename import to match, or rename file to `chatController.js` for consistency |
| 2 | [init_chroma.py](backend/chroma-db/init_chroma.py) / `update_chroma.py` use deprecated `chromadb.Client(Settings(persist_directory=...))` | Switch to `chromadb.PersistentClient(path="./chroma_db")` (current Chroma API) |
| 3 | `server.js` calls `python-scripts/analyze_soil.py` and `analyze_plant.py` — neither file exists | Create both (Phase 4 below), or point routes at the new `ai-service` endpoints instead of spawning Python directly |
| 4 | `Crop_Disease_Prediction_Model.h5` is an ~800-byte empty HDF5 shell, not a trained model | Retrain from scratch (Phase 4) |
| 5 | Root `.env` is empty/untracked; no `.env.example` | Add `.env.example` documenting every var (Phase 1) |
| 6 | Root README's install steps reference `server/`, `client/`, `ml/` folders that don't exist (actual: `backend/`, `frontend/`, `ai-models/`) | Rewrite README once the stack is finalized (Phase 6) |
| 7 | `chatbot.py`'s `process_with_rag` and `text_to_speech` are stubs returning fake strings | Replace with real LLM + TTS calls (Phase 3) |

---

## 2. Phase 1 — Core infrastructure (backend + DB + auth)

**Goal:** a real persistence layer and real authentication before layering AI on top.

- **Database:** MongoDB (matches README). Use **MongoDB Community Server** locally (free, open-source) or a free-tier Atlas cluster for dev — no vendor lock-in either way. Add `mongoose` to `backend/package.json`.
  - Migrate `farmers.json` → a `Farmer` Mongoose model (name, phone, language, age, farm_size, crop_type, location, createdAt).
  - Add a `ChatHistory` collection (farmer_id, role, message, timestamp) so conversations persist and can feed the RAG context.
- **Auth:** phone-number-based, matching the README's "easy authentication":
  - `POST /api/register` — phone + basic profile.
  - `POST /api/login` — phone + OTP. Since there's no paid SMS provider, **for local/independent operation, generate the OTP and log it to console / return it in the API response in a `DEV_MODE` flag** (document clearly this is not production-secure). Optionally support a free-tier provider later.
  - Issue a JWT (`jsonwebtoken`) on successful OTP verification; store it client-side; add `authMiddleware.js` to protect chat/profile routes.
- **Env config:** create `backend/.env.example`:
  ```
  MONGO_URI=mongodb://localhost:27017/farmsathi
  JWT_SECRET=change-me
  AI_SERVICE_URL=http://localhost:8001
  PORT=5000
  DEV_MODE=true
  ```

---

## 3. Phase 2 — Stand up `ai-service` (the model-serving backbone)

New FastAPI app, `ai-service/main.py`, loading everything once at boot:

```
uvicorn main:app --host 0.0.0.0 --port 8001
```

Dependencies (`ai-service/requirements.txt`):
```
fastapi
uvicorn
llama-cpp-python
faster-whisper
transformers
torch --index-url https://download.pytorch.org/whl/cpu
sentence-transformers
chromadb
scikit-learn
tensorflow-cpu  (or torch + timm, see Phase 4 note)
soundfile
```

All models below are open-weight, run on CPU (no GPU required, though one speeds things up), and have no usage fees or API keys.

---

## 4. Phase 3 — Chat / RAG pipeline (replace the stub)

| Component | Model | Why |
|---|---|---|
| LLM | **Qwen2.5-3B-Instruct** (GGUF, Q4_K_M quant, ~2GB) via `llama-cpp-python` | Best small open model for Hindi + reasonable multilingual quality; runs comfortably on CPU (4-8GB RAM) |
| Alt. LLM | Phi-3.5-mini-instruct (GGUF) | Smaller/faster fallback if Qwen is too slow on target hardware |
| Embeddings for RAG | **intfloat/multilingual-e5-small** (via sentence-transformers) | Multilingual (covers Hindi), small (~470MB), works well for retrieval over farmer profiles + agri knowledge base |
| Vector store | ChromaDB `PersistentClient` (already scaffolded, just fix the API call) | Already in repo, just needs the bugfix above |

**Build steps:**
1. `ai-service/rag.py`: embed and store two collections in Chroma — `farmer_profiles` (existing) and a new `agri_knowledge` collection seeded with curated agricultural Q&A / crop guides / government scheme text (see Phase 5).
2. `ai-service/llm.py`: `POST /chat` — takes `{message, farmer_id, language}`, retrieves top-k chunks from both collections, builds a grounded prompt, calls the local Qwen2.5 model, returns the reply.
3. Replace `chatbot.py`'s fake `process_with_rag` with a call to this endpoint (or delete `chatbot.py` entirely and have `chatControllers.js` call `ai-service` over HTTP directly — cleaner, avoids the spawn-per-request problem).
4. **Language handling:** ask the LLM to answer directly in the target language (Qwen2.5 handles Hindi natively at reasonable quality). For Punjabi, where base LLM quality is weaker, add a translation fallback:
   - **AI4Bharat IndicTrans2** (distilled, open-source, built specifically for Indian languages including Punjabi) — translate LLM's English/Hindi answer → Punjabi. Lighter alternative: `facebook/nllb-200-distilled-600M`.

---

## 5. Phase 3b — Voice (STT + TTS)

| Component | Model | Notes |
|---|---|---|
| Speech-to-text | **faster-whisper**, `small` or `base` model | CTranslate2-optimized Whisper, CPU-friendly, decent Hindi/Punjabi/English recognition. `base` (~140MB) for speed, `small` (~460MB) for better accuracy — make it configurable |
| Text-to-speech | **facebook/mms-tts-hin**, **mms-tts-eng**, **mms-tts-pan** (Meta's Massively Multilingual Speech, via 🤗 transformers `VitsModel`) | Only realistic open-source option with an actual Punjabi voice; each language model is small (~100-150MB), simple `transformers` inference, no training needed |
| Alt. TTS | Piper TTS (`hi_IN` voice) | Faster/lighter for Hindi+English if MMS is too slow, but has no Punjabi voice — use MMS for Punjabi specifically |

**Build steps:**
1. `ai-service/stt.py`: `POST /transcribe` — accepts uploaded audio, returns transcript + detected/declared language.
2. `ai-service/tts.py`: `POST /speak` — accepts `{text, language}`, picks the matching MMS model, returns a `.wav` file (save under `backend/uploads/audio/`, matching the existing `audio_url` convention in `chatControllers.js`).
3. Wire `chatControllers.js`'s existing audio branch (`isAudio`) to call `/transcribe` first, then feed the transcript into `/chat`, then `/speak` the reply — this already matches the endpoint's current shape (`reply || audio_url`), just needs real calls instead of the Python stub.

---

## 6. Phase 4 — Image-based crop/soil analysis (train real models)

Current `.h5` file is empty and `analyze_soil.py` / `analyze_plant.py` don't exist. Build both from scratch using free, open datasets:

### Crop disease detection
- **Dataset:** PlantVillage (Kaggle, ~54k labeled leaf images, 38 classes, open license).
- **Model:** transfer-learning on **MobileNetV2** (ImageNet-pretrained, lightweight — ~14MB, fast CPU inference). Fine-tune the notebook already in `ai-models/notebooks/crop-disease-prediction-model.ipynb` (it already scaffolds this — finish training it and export a real `.h5`/`SavedModel`).
- **Serve:** `ai-service/vision.py` → `POST /analyze-plant`, loads the trained model once, returns `{disease, confidence, recommendation}`.

### Soil health / crop recommendation
- **Dataset:** "Crop Recommendation Dataset" (Kaggle, open) — N/P/K, temperature, humidity, pH, rainfall → recommended crop. Tabular, no image needed for the core recommendation (much lighter than trying to CV-parse a Soil Health Card).
- **Model:** scikit-learn `RandomForestClassifier` (tiny, <5MB, trains in seconds, finish the existing `Soil-health-Model.ipynb`).
- If actual Soil Health Card *image* OCR is wanted later: add **Tesseract OCR** (open-source) to extract N/P/K values from the uploaded card image, then feed into the same tabular model. Treat this as a stretch goal — the tabular path alone delivers the feature.
- **Serve:** `ai-service/crop_recommend.py` → `POST /analyze-soil`.

### Backend wiring
Update `server.js`'s `/analyze-soil` and `/analyze-plant` handlers to forward the uploaded file to `ai-service` via HTTP instead of `spawn`-ing a nonexistent script.

---

## 7. Phase 5 — Weather + government schemes (no API-key dependency)

- **Weather:** switch from OpenWeatherMap (needs a key, 1000 calls/day free cap) to **Open-Meteo** — fully free, no API key, no rate-limit signup, open-source project. Add `backend/routes/weather.js` → `GET /weather?lat=&lon=` → fetch Open-Meteo forecast, map to simple crop-relevant fields (rainfall, temp range, humidity).
- **Weather-based crop suggestion:** combine Open-Meteo forecast + the RandomForest crop-recommendation model from Phase 4 (feed forecast averages as the N/P/K-adjacent inputs where available, or as a secondary heuristic layer on top of the model's output).
- **Government schemes:** no open API exists for this — curate it:
  1. Manually compile a JSON dataset of major schemes (PM-KISAN, Soil Health Card Scheme, PMFBY crop insurance, KCC loans, state-specific subsidies) with eligibility text, in English/Hindi/Punjabi.
  2. Store as `backend/data/schemes.json`, embed into the `agri_knowledge` Chroma collection (Phase 3) so the chatbot can answer scheme questions via RAG, and also expose a plain `GET /api/schemes` for a dedicated UI page.

---

## 8. Phase 6 — Frontend (React web app)

Current `App.jsx` is the untouched Vite starter. Build out:

- **Routing:** `react-router-dom` — pages: Landing, Register/Login, Chat, Crop Analysis (image upload), Soil Analysis, Weather, Schemes, Profile.
- **State:** Redux Toolkit (keeps the README's stated intent) or Zustand if you want less boilerplate — either is fine; Redux Toolkit if closeness to the original spec matters.
- **Styling:** Tailwind (already a frontend dependency, currently unused — wire up `tailwind.config.js` and actually use it).
- **Voice UI:** browser `MediaRecorder` API to capture mic audio → upload to `/chat` (audio branch) → play back returned `audio_url`. No extra library needed for basic record/playback.
- **Language switcher:** simple context/localStorage-backed `language` state (`en`/`hi`/`pa`), passed through to every API call.
- **i18n for UI chrome** (buttons, labels — not the AI content): `react-i18next` with three translation JSON files, so the interface itself is trilingual, not just the chatbot.

---

## 9. Phase 7 — Wiring, hardening, polish

- Point `backend` at `ai-service` via `AI_SERVICE_URL` env var; replace every remaining `spawn("python3", ...)` call in `server.js`/controllers with an `axios`/`fetch` call to the service.
- Add request validation (`express-validator`) and centralized error handling middleware.
- Add basic tests: Jest for backend routes, pytest for `ai-service` endpoints.
- Add a root `docker-compose.yml` (MongoDB + backend + ai-service + frontend) so the whole stack runs with one command and is genuinely self-hostable/independent.
- Rewrite root `README.md`: correct folder names, real setup instructions (`ai-service` requirements, model download/caching step since GGUF/MMS weights are pulled from Hugging Face on first run), and a note that everything runs offline after the first model download.

---

## Suggested build order (dependency-respecting)

1. Bugfixes (Section 1) — unblocks everything else.
2. Phase 1 (DB + auth) — needed before chat history / personalization make sense.
3. Phase 2 (`ai-service` skeleton, empty endpoints) — the integration point everything else plugs into.
4. Phase 3 + 3b (chat, RAG, STT/TTS) — the headline feature.
5. Phase 4 (vision + soil models) — independent of chat, can be built in parallel by someone else / another session.
6. Phase 5 (weather + schemes) — mostly data + a thin route, quick once Phase 2 exists.
7. Phase 6 (frontend) — can start in parallel from day one against a mocked API, then swap to real endpoints as each phase lands.
8. Phase 7 (hardening/docker/docs) — last, once features are stable.

## Model download footprint (approximate, one-time)

| Model | Size |
|---|---|
| Qwen2.5-3B-Instruct GGUF Q4 | ~2.0 GB |
| multilingual-e5-small | ~470 MB |
| faster-whisper small | ~460 MB |
| mms-tts-hin / eng / pan (×3) | ~350 MB total |
| MobileNetV2 (fine-tuned) | ~15 MB |
| RandomForest crop model | <5 MB |

Total ≈ 3.3 GB disk, runs on CPU with 8GB+ RAM (16GB recommended if running LLM + Whisper concurrently).

---

Everything above is open-weight and free to run indefinitely with no API keys — the only external calls the finished app makes are the initial one-time Hugging Face model downloads and Open-Meteo's free, keyless weather API.
