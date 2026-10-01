# FarmSaathi API

`farmsaathi-api.amittal.dev`: a Cloudflare Worker (Hono) on D1 and Workers AI behind the hosted
FarmSaathi app (`frontend/`, at `farmsaathi.amittal.dev`). It answers farmers' questions in English,
Hindi and Punjabi, turns speech into text and back, serves the scheme list and keeps optional
accounts. The spec is [`docs/live/contract.md`](../docs/live/contract.md); the TypeScript shapes are
in [`src/contract.ts`](src/contract.ts) (a byte-identical copy lives in `frontend/src/contract.ts`).

The self-hosted path (`backend/` + `ai-service/` with `docker compose`) is separate and untouched.

## Routes

All JSON unless noted. Errors are `{ error, code, retryAfter?, fallback? }`; `error` is written for
the farmer in their language (the body's `lang`, else `?lang=`, else `Accept-Language`, else English;
the copy is in [`src/i18n.ts`](src/i18n.ts)).

| Route | What it does |
|---|---|
| `POST /api/auth/signup` | `{login, password, name?, lang}` → 201 `Me`, sets the cookie; 409 if taken |
| `POST /api/auth/login` | `{login, password}` → `Me`; generic 401, same work for unknown logins |
| `POST /api/auth/logout` | 204, ends this session |
| `GET /api/auth/me` | `Me` or 401 |
| `PATCH /api/me` | `Partial<Profile>` → `Me` |
| `DELETE /api/me` | `{password}` → 204; deletes the account, its sessions and chats |
| `GET /api/me/chats?before=` | `{chats, more}`, newest first, 50 a page |
| `POST /api/me/chats/import` | `{turns}` (≤ 200) → 204; a guest's on-phone history, all or nothing, idempotent |
| `POST /api/chat` | `{message, lang, profile?, history?}` → `ChatReply`; saved when signed in |
| `POST /api/transcribe` | multipart `audio` (≤ 2 MB) + `lang` → `{text, lang}` |
| `POST /api/speak` | `{text (≤ 600), lang}` → `audio/wav`, or 503 `{fallback: 'device'}` |
| `POST /api/voice/wake` | 202; pings the voice Space so it is warm by the time an answer arrives |
| `GET /api/schemes?lang=` | the six schemes, localised, `Cache-Control: public, max-age=86400` |
| `GET /api/test` | health, no D1 |
| `GET /internal/stats`, `POST /internal/prune` | need `x-internal-key` = `INTERNAL_KEY`, else 404 |

A login is a 10-digit Indian mobile number (stored as `+91XXXXXXXXXX`) or an email (lower-cased).
There is no OTP and no SMS: the number is only a username and is never messaged or shared.
Passwords are hashed with PBKDF2-SHA256 at 100,000 rounds (`PASSWORD_ITERATIONS`).

Sessions are an HttpOnly cookie `fs_session` (`Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
`Secure` is dropped on plain-http local dev). D1 keeps SHA-256 of the token. A session slides
forward when used (at most once an hour). Every POST, PATCH and DELETE under `/api` needs an Origin
from `ALLOWED_ORIGINS` and `Content-Type: application/json` (`multipart/form-data` on
`/api/transcribe` only); otherwise 403.

## How a question is answered

1. **Retrieval.** The 14 passages (6 schemes from [`data/schemes.json`](data/schemes.json), a copy
   of `backend/data/schemes.json`; 8 notes from [`data/agri_knowledge.json`](data/agri_knowledge.json),
   a copy of `ai-service/data/agri_knowledge.json`) are embedded once with Workers AI
   `@cf/baai/bge-m3` and kept in D1. `meta.knowledge_hash` is SHA-256 of the model name and every
   passage, so editing a data file or changing `EMBED_MODEL` re-embeds on the next question. The
   question is embedded the same way; the top 3 passages with cosine similarity ≥ `RAG_MIN_SCORE`
   (0.4) go into the prompt, and the scheme ones come back as `sources`. If embedding fails, the
   question is answered without passages.
2. **The chain** ([`src/chain.ts`](src/chain.ts)). Each step is skipped when its key is missing or
   its daily cap (`*_DAILY_CAP`, calls per India day) is reached, and abandoned when it fails, times
   out at 12 s or answers in the wrong script:
   1. Groq `llama-3.3-70b-versatile`
   2. Gemini `gemini-2.5-flash` (thinking off), **first for Punjabi**
   3. OpenRouter, a free model (`OPENROUTER_MODEL`)
   4. Workers AI `@cf/meta/llama-3.1-8b-instruct` (no key)

   Every step at its cap → 429; every step failing → 503. The system prompt keeps the FarmSaathi
   voice from `ai-service/llm.py` (practical, concise, honest when unsure) and adds: answer in the
   requested script, plain text that reads well aloud, never invent scheme amounts or dates that are
   not in the passages, and send risky questions (pesticide doses, livestock illness) to the nearest
   KVK or agriculture officer.
3. **Speech.** Transcription tries Groq `whisper-large-v3-turbo`, then Workers AI
   `@cf/openai/whisper-large-v3-turbo`. Read-aloud calls the voice Space ([`../voice-space`](../voice-space)),
   caches each clip for 30 days in the Cache API under SHA-256(lang + text), and answers 503
   `{fallback: 'device'}` when the Space is asleep, busy, slow (25 s) or failing, so the phone reads
   the answer with its own voice.

**Limits.** Per visitor per India day: 30 questions, 30 transcriptions, 60 new clips (cached clips
are free). The visitor key is SHA-256 of the day, the IP and the account (or `guest`), so no IP is
stored and it changes daily. Over a limit → 429 `rate_limited` with `retryAfter` (seconds to
midnight IST). Plus the Workers rate limiters: 5 sign-ins per minute per IP, 120 API requests per
minute per IP.

## Privacy

- A provider sees only: the system prompt, the question, up to 6 earlier turns' text, the matched
  passages, and the profile's crops, state and farm size. Never a name, phone number, email,
  district, location or account id; `test/chat.test.ts` checks every captured provider request for
  them.
- Transcription sends the recording itself (and the language) and nothing else.
- Saved chats exist only for farmers who sign in; a guest's history stays on the phone until they
  choose to import it. Chats are deleted after 180 days, and all of an account's data when it is deleted.
- Usage counters hold hashes that change daily, not IPs. Logs carry no question text.

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 execute farmsaathi --local --file schema.sql
npm run dev            # wrangler dev --port 8790 → http://localhost:8790
```

The app (`frontend/`, port 5176) talks to it at `http://localhost:8790`; `http://localhost:5176` is
already an allowed origin. Workers AI has no local emulation: under `wrangler dev` the `AI` binding
calls your Cloudflare account. For read-aloud, run `voice-space/` locally and set `VOICE_URL` and
`VOICE_KEY` in `.dev.vars`.

```sh
npm test               # vitest: the Worker on node:sqlite with fake Workers AI, providers and cache
npm run typecheck
```

The tests run the real SQL (`schema.sql`) on `node:sqlite` through the same `Sql` interface as D1,
and inject `fetch`, the AI binding, the Cache API and the clock, so they run offline.

## Deploy checklist

1. `npx wrangler d1 create farmsaathi` and put the printed `database_id` into `wrangler.jsonc`
   (it is a placeholder, `00000000-0000-0000-0000-000000000000`, until then).
2. `npx wrangler d1 execute farmsaathi --remote --file schema.sql`
3. Create the voice Space (steps in [`../voice-space/README.md`](../voice-space/README.md)) and
   check `VOICE_URL` in `wrangler.jsonc` matches its URL.
4. Secrets (`npx wrangler secret put <NAME>`):
   - `INTERNAL_KEY`: the Switchboard's shared key.
   - `VOICE_KEY`: the same long random string as the Space's `VOICE_KEY` secret.
   - Optional, one per chain step (a missing key just skips that step): `GROQ_API_KEY`
     (console.groq.com, also used for Whisper), `GEMINI_API_KEY` (aistudio.google.com),
     `OPENROUTER_API_KEY` (openrouter.ai). With none, every answer comes from Workers AI.
5. `npm run deploy`. The custom domain `farmsaathi-api.amittal.dev` is created from `routes`
   (one subdomain level, so the free certificate covers it). Workers AI and the rate limiters need
   no setup; the daily cron (21:41 UTC, 03:11 IST) prunes old chats, sessions and counters.
6. Check: `curl https://farmsaathi-api.amittal.dev/api/test` and
   `curl "https://farmsaathi-api.amittal.dev/api/schemes?lang=pa"`; then ask one question from the app
   (the first one embeds the 14 passages).
7. In `frontend/`, allow `https://farmsaathi-api.amittal.dev` in the CSP `connect-src`. For the
   Switchboard, add a service binding to `farmsaathi-api` to read `/internal/stats`.

Model names, caps, `RAG_MIN_SCORE` and `PASSWORD_ITERATIONS` are vars in `wrangler.jsonc`, so they
change with a config deploy, not a code change. If sign-ins fail with error 1102 (CPU limit on the
free plan), lower `PASSWORD_ITERATIONS` (e.g. to 20000); existing hashes keep their own count.
