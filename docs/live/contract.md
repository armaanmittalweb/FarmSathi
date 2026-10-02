# FarmSaathi live: the contract

Two agents build against this file: **backend** (new `worker/` Hono Worker + D1, and `voice-space/` for Hugging Face) and **app** (`frontend/` rebuild, plus `frontend/src/models/` in-browser inference and `models-web/` conversion scripts).
The approved plan: https://claude.ai/artifact/9Yg4X8tp59qDnbH4Yqm2eX (all six decisions taken as recommended).
If something here is wrong or missing, change it in the same commit as the code and say so in the commit message.
`worker/src/contract.ts` holds these shapes as TypeScript; `frontend/src/contract.ts` is a byte-identical copy.

The existing `backend/` (Express + Mongo) and `ai-service/` (FastAPI, local models) stay untouched: they are the self-hosted `docker compose` path. The hosted path is `frontend/` + `worker/` + `voice-space/`.

## Hosts

- App: `https://farmsaathi.amittal.dev` (Vercel, root `frontend`). Local: `http://localhost:5176`.
- API: `https://farmsaathi-api.amittal.dev` (Worker `farmsaathi-api`, D1 `farmsaathi`, Workers AI binding `AI`). Local: `http://localhost:8790`.
- Voice: a Hugging Face Docker Space `armaanmittalweb/farmsaathi-voice`, called only by the Worker (`VOICE_URL` var, `VOICE_KEY` secret sent as `x-voice-key`).
- Session: HttpOnly cookie `fs_session` on the API host, `Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`, stored as SHA-256. `credentials: 'include'`. CORS: exact origins `https://farmsaathi.amittal.dev`, `http://localhost:5176`, credentials on. State-changing requests need `Content-Type: application/json` (or `multipart/form-data` for audio) and an allowed Origin, otherwise 403.
- Errors: `{ error: string, code: 'bad_request'|'unauthenticated'|'forbidden'|'not_found'|'conflict'|'rate_limited'|'too_large'|'unavailable'|'server', retryAfter?: number }`. `error` is written for the farmer and localised when the request carried `lang` (en, hi, pa).

## Languages

`Lang = 'en' | 'hi' | 'pa'`. Every route that returns text a farmer reads takes `lang` and answers in it. Hindi in Devanagari, Punjabi in Gurmukhi.

## Accounts (optional)

Everything works without an account. An account saves chats and the profile across phones.

| Method, path | Body → response |
|---|---|
| POST /api/auth/signup | `{ login, password, name?, lang }` → 201 `Me`, sets cookie. `login` is a 10-digit Indian mobile number (optionally +91) or an email; normalised (`+91XXXXXXXXXX` or lower-cased email). Password ≥ 8 chars. 409 if taken. **No OTP, no SMS**: the number is only a username |
| POST /api/auth/login | `{ login, password }` → `Me`, sets cookie. 401 generic, same timing for unknown logins |
| POST /api/auth/logout | → 204 |
| GET /api/auth/me | → `Me` or 401 |
| PATCH /api/me | `Partial<Profile>` → `Me` |
| DELETE /api/me | `{ password }` → 204, deletes everything |
| GET /api/me/chats?before=<id> | → `{ chats: ChatTurn[], more: boolean }`, newest first, 50 per page |
| POST /api/me/chats/import | `{ turns: ChatTurn[] }` (≤ 200) → 204: moves a guest's on-device history into the account at sign-in |

Passwords: PBKDF2-SHA256, 100k iterations (Workers CPU allows it once per login). Login rate limit 5/min per IP.

## Chat

| Method, path | |
|---|---|
| POST /api/chat | `{ message, lang, profile?: Profile, history?: {role, text}[] (last 6 turns) }` → `ChatReply`. Signed in: the turn is saved and the stored profile is used. Message ≤ 1,000 chars |
| POST /api/transcribe | multipart `audio` (webm/ogg/mp4/wav, ≤ 2 MB, ≤ 60 s) + `lang` → `{ text, lang }` |
| POST /api/speak | `{ text (≤ 600 chars), lang }` → `audio/wav`, or 503 `unavailable` with `{ fallback: 'device' }` when the voice Space is asleep, busy or failing. Responses cached by SHA-256(lang+text) in the Cache API for 30 days |
| POST /api/voice/wake | → 202. The app calls it when the Ask tab opens, so a sleeping Space is warm by the time an answer arrives |

**Retrieval**: the 14 passages (6 schemes from `backend/data/schemes.json`, 8 notes from `ai-service/data/agri_knowledge.json`, copied into `worker/data/`) are embedded with Workers AI `@cf/baai/bge-m3` and stored in D1 the first time the Worker needs them (re-embedded when the data file's hash changes). A question is embedded the same way; the top 3 passages above a similarity floor go into the prompt. Scheme passages are also returned as `sources` so the app can link to the Schemes tab.

**The chain** (each step skipped when its key is missing, its daily cap is reached, or it fails/times out at 12 s):
1. Groq `llama-3.3-70b-versatile` (`GROQ_API_KEY`)
2. Google Gemini `gemini-2.5-flash` (`GEMINI_API_KEY`), **first** when `lang === 'pa'`
3. OpenRouter, a free model set by `OPENROUTER_MODEL` (`OPENROUTER_API_KEY`)
4. Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (no key)

Model names are vars so they can be changed without a deploy. Only the question, language, history text, matched passages and the profile's crop/state/farm size are sent; never name, phone or email. The system prompt keeps the existing FarmSaathi voice (practical, concise, honest when unsure) and adds: answer in the requested script, never invent scheme amounts or dates that aren't in the passages, suggest the nearest KVK or agri officer for anything risky (pesticide doses, livestock illness).

**Speech to text**: for Hindi and Punjabi, AI4Bharat IndicConformer on the voice container first; then Groq `whisper-large-v3-turbo`, then Workers AI `@cf/openai/whisper-large-v3-turbo`. A looping or over-long transcript is dropped; if nothing hears the recording cleanly the answer is `{text: ''}`.

**Limits**: 30 chat messages, 30 transcriptions and 60 speak requests per visitor per day (keyed by IP hash + session), and a global daily cap per provider stored in D1 (`GROQ_DAILY_CAP` etc. vars). Over the limit → 429 `rate_limited` with a localised message and `retryAfter`. A "day" is an India Standard Time day: limits reset at midnight IST and `retryAfter` is the seconds until then (details below).

## Public data

| Method, path | |
|---|---|
| GET /api/schemes?lang= | → `Scheme[]` (static, `Cache-Control: public, max-age=86400`) |
| GET /api/test | health, no D1 |
| GET /internal/stats, POST /internal/prune | `x-internal-key` = `INTERNAL_KEY`, else 404. Stats: `{ users, chats, dbBytes, today: { chat, transcribe, speak }, byProvider: Record<string, number>, lastStepToday: number }` |

Weather is called from the browser straight to Open-Meteo (no key; cache an hour per village in localStorage). Leaf check and crop advice run in the browser (below); the Worker has no routes for them.

## Backend details (decided while building `worker/`)

Gaps in the first draft, filled with the simplest consistent choice. The app can rely on all of these.

- **Error language**: the body's `lang` wins, then `?lang=`, then `Accept-Language` (hi/pa), else English. Every JSON route accepts an optional `lang`, including login, logout, import and wake.
- **CSRF details**: bodiless POSTs (`/api/auth/logout`, `/api/voice/wake`) still need `Content-Type: application/json` (send `{}`). `/api/transcribe` takes `multipart/form-data` only; every other state change takes JSON only.
- **Logins**: a mobile number may be written with `+91`, `91` or a leading `0`, with spaces or dashes, and must start with 6-9. Password 8-200 characters. Sign-up, login and account deletion share the 5/min/IP limiter. A wrong password on `DELETE /api/me` is 403 `forbidden`.
- **Profile limits**: name ≤ 80 chars, state and district ≤ 60, up to 20 crops of ≤ 40 chars (deduplicated), `farmSizeAcres` 0-100,000, lat/lon in range; `null` clears a field; unknown keys are ignored; any bad field → 400 and nothing is saved.
- **Saved chats**: `?before=` with an id the account doesn't have → 400. Import is all-or-nothing and idempotent per account (the phone's turn `id` is kept; ids match `[A-Za-z0-9_-]{1,64}`); question ≤ 1,000 chars, answer ≤ 8,000, ≤ 5 sources. Chats older than 180 days are pruned.
- **Chat**: `history` entries need `role` `user` or `assistant`; others are dropped; only the last 6 are used. A guest's `profile` is read only for `crops`, `state` and `farmSizeAcres`; for a signed-in farmer the stored profile is used instead. `sources` holds scheme passages only (`kind: 'scheme'`, `id` = the scheme id used by `/api/schemes`, `title` in the request's language); notes go into the prompt but are not returned as chips. An answer in the wrong script counts as a failed step (kept only as a last resort if no later step does better). Every step at its cap → 429 `rate_limited`; every step failing → 503 `unavailable`.
- **Daily limits**: the visitor key is SHA-256 of (IST day, IP, account id or `guest`), so it changes daily, never stores an IP, and a signed-in farmer has an allowance separate from guests on the same carrier IP. Workers rate limiter `API_LIMITER`: 120 requests/min/IP on all of `/api` except `/api/test` (429 with `retryAfter: 60`).
- **Transcription**: accepted types `audio/webm`, `video/webm`, `audio/ogg`, `audio/mp4`, `video/mp4`, `audio/x-m4a`, `audio/wav` (and its aliases); anything else → 400. Over 2 MB → 413 `too_large`. The 60-second limit is the app recorder's job (the server enforces the 2 MB cap). Empty speech returns 200 `{ text: '' }`. Both steps at their caps → 429; both failing → 503.
- **Speak**: the text is trimmed before hashing (`SHA-256(lang + text)`). A cached clip does not count toward the 60/day. A 429 from `/api/speak` also carries `fallback: 'device'`. The Worker waits up to 25 s for the Space (a long answer takes a while on 2 free vCPUs); the 12 s step timeout applies to the chat and transcription providers. `/api/voice/wake` pings the Space's `/health` at most once a minute per Worker isolate.
- **Schemes**: `category` is the stable id from `schemes.json` (`income_support`, `insurance`, `credit`, `advisory`, `irrigation`, `market_access`) for the app to label. `eligibility` and `howToApply` exist only in English in `schemes.json`; the Hindi and Punjabi versions live in `worker/data/schemes.local.json`.
- **Vars** (all in `worker/wrangler.jsonc`): models `GROQ_MODEL`, `GEMINI_MODEL`, `OPENROUTER_MODEL`, `WORKERS_AI_MODEL`, `EMBED_MODEL`, `GROQ_STT_MODEL`, `WORKERS_AI_STT_MODEL`; caps `GROQ_DAILY_CAP` (900), `GEMINI_DAILY_CAP` (200), `OPENROUTER_DAILY_CAP` (45), `WORKERS_AI_DAILY_CAP` (300), `GROQ_STT_DAILY_CAP` (1,800), `WORKERS_AI_STT_DAILY_CAP` (300), counted in calls per IST day; `RAG_MIN_SCORE` (0.4, the similarity floor); `PASSWORD_ITERATIONS` (100,000; lower it only if sign-ins hit the free plan's CPU limit, since each hash stores its own count).
- **Stats**: `today` counts requests that passed the visitor limit. `byProvider` is today's successful answers per provider: `groq`, `gemini`, `openrouter`, `workers-ai` (chat), `groq-stt`, `workers-ai-stt` (transcription) and `voice` (new clips from the Space); providers with none are absent. `lastStepToday` is the 1-based position, in that request's own chain order, of the step that answered the latest chat today (so Gemini answering Punjabi is 1), or 0 when there was none. `/internal/prune` returns `{ chats, sessions, counters }` (rows deleted).
- **Voice Space**: spells numbers out before synthesis (the MMS vocabularies have almost no digits), so "₹6,000" is read as words in all three languages.

## App details (decided while building `frontend/`)

Gaps filled on the app side with the simplest consistent choice. Nothing here changes a route or a shape.

- **Model files**: served gzipped with a content hash in the name (`/models/leaf.<hash>.onnx.gz`, `/models/crop.<hash>.onnx.gz`, `/models/ort.<hash>.wasm.gz` for onnxruntime-web's single-thread SIMD WASM), unpacked in the browser with `DecompressionStream`, and kept in the Cache API (`fs-models-v1`). Download sizes shown before the first fetch: leaf check 12.5 MB (runtime 3.7 + model 8.9), crop adviser 3.8 MB (runtime 3.7 + model 0.15); the runtime is shared. The raw `.onnx` files stay in `frontend/public/models/` as the conversion outputs but are not deployed.
- **Chat requests**: `history` is the last 3 question/answer pairs of the visit (6 entries). A guest sends `profile` (the Worker reads only crops, state and farm size); a signed-in farmer sends none.
- **Guest history**: kept in `localStorage` as `ChatTurn[]` (newest 200), with ids `g<base36 time><random>` that match the import pattern. After sign-in or sign-up the Me tab offers to import them; nothing is sent without that tap.
- **Listen**: answers longer than the 600-character limit are split at sentence ends into pieces of at most 560 characters and spoken one after another. A 503 or 429 with `fallback: 'device'`, a network failure or an unplayable clip on the first piece switches to the phone's `speechSynthesis` voice for the language (`hi-IN`, `pa-IN`, `en-IN`); if the phone has none, the answer says so. The app shows which voice read the answer, and "Getting the voice ready…" while it waits (up to the Worker's 25 s).
- **Schemes**: the Schemes tab and chat source chips use the app's own offline copy (`frontend/src/content/schemes.ts`: same six ids and categories, plus the amount, eligibility as a list, steps and documents in all three languages). The app does not call `GET /api/schemes`; it stays for other clients.
- **Weather**: Open-Meteo forecast with `past_days=30`; one hour's cache per village in `localStorage` (`fs.wx:<lat>,<lon>`), shown with "No signal. Showing what was saved at …" when offline. The Soil tab prefills temperature and humidity from the coming week's hourly mean and rainfall from the last 30 days' total.
- **Mock**: `vite --mode mock` (or `VITE_API=mock`) swaps the client for an in-memory API with canned answers in all three languages and a fake forecast; production builds do not contain it.

## Shapes

```ts
export type Lang = 'en' | 'hi' | 'pa'
export interface Profile { name: string | null; lang: Lang; state: string | null; district: string | null; lat: number | null; lon: number | null; crops: string[]; farmSizeAcres: number | null }
export interface Me { user: { id: string; login: string; createdAt: string }; profile: Profile }
export interface Source { id: string; kind: 'scheme' | 'note'; title: string }
export interface ChatReply { text: string; lang: Lang; sources: Source[]; provider: 'groq' | 'gemini' | 'openrouter' | 'workers-ai'; turnId: string | null }
export interface ChatTurn { id: string; at: string; lang: Lang; question: string; answer: string; sources: Source[] }
export interface Scheme { id: string; category: string; name: string; summary: string; eligibility: string; howToApply: string; link: string | null }
export interface ApiError { error: string; code: string; retryAfter?: number; fallback?: 'device' }
```

## In-browser models (app agent)

- `models-web/convert_leaf.py`: `ai-models/Crop_Disease_Prediction_Model/Crop_Disease_Prediction_Model.h5` → `frontend/public/models/leaf.onnx` (tf2onnx, opset 15; input `image` float32 `[N,224,224,3]` NHWC, raw 0–255 RGB because the model keeps its own `Rescaling(1/255)`; output `probs` `[N,15]`), with the class names copied beside it as `leaf.classes.json`. Preprocessing matches `ai-service/vision.py` byte for byte: `frontend/src/models/preprocess.ts` is a port of Pillow's bicubic `Image.resize((224, 224))` (antialiased, fixed-point), not the canvas's own scaler. The app first crops the photo to the square framing guide (PlantVillage images are square, so this is a no-op for the parity set) and caps very large photos at 1,600 px on the long side before that resize.
- `models-web/convert_crop.py`: `ai-models/crop_recommendation_model.joblib` → `frontend/public/models/crop.onnx` (input `features` float32 `[N,7]`, output `probabilities` `[N,22]`; the string `label` output is dropped), with the class list as `crop.classes.json`. Feature order `[n, p, k, temperature, humidity, ph, rainfall]`. The scaler is in the graph but **not** as skl2onnx's float32 `Scaler` op, which rounds differently from numpy's float64-then-float32 in-place ops and flipped tree splits (probabilities off by up to 0.055); it is Cast→Sub→Cast→Cast→Div→Cast in double, then the forest from skl2onnx.
- Parity (`models-web/parity.py` writes `frontend/tests/fixtures/{crop,leaf}-parity.json`; `frontend/tests/parity.test.ts` reads them with onnxruntime-node, plus a sample through onnxruntime-web's WASM build): crop model top class identical on all 2,200 rows of `ai-models/data/Crop_recommendation.csv` and probabilities within 1e-4; leaf model top class identical on 300 images sampled across all 15 classes of `ai-models/plantvillage_repo/` (20 per class, seed 42) and probabilities within 1e-3. The test decodes the JPEGs with sharp and checks the decoded and resized bytes against PIL's SHA-256s. Measured: crop 0 mismatches, max diff 4.2e-7; leaf 0 mismatches, 0 decode/resize byte differences, max diff 1.0e-5.
- Run with `onnxruntime-web` (WASM, single thread so no COOP/COEP is needed), lazy-loaded only on the Leaf and Soil tabs, cached by the service worker. The app shows the download size before the first fetch.

```ts
export interface LeafResult { top: { label: string; crop: string; disease: string | null; p: number }[]; ms: number }   // top 3
export interface CropResult { top: { crop: string; p: number }[]; ms: number }                                     // top 3
```

Labels map to localised crop and disease names and next-step advice in `frontend/src/content/diseases.ts` (15 classes × 3 languages; healthy classes say so). Advice is general and points to the local KVK for sprays and doses.

## Data that never leaves the phone

Leaf photos, soil values, location (only lat/lon to Open-Meteo), guest chat history (localStorage until the farmer signs in and chooses to import it).
