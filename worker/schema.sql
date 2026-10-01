-- FarmSaathi (Cloudflare D1). Accounts are optional: a guest's chats stay on the phone. Times are ms
-- since epoch. Nothing here is sent to a model provider except what docs/live/contract.md allows.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,            -- random UUID
  login           TEXT NOT NULL UNIQUE,        -- +91XXXXXXXXXX or a lower-cased email; only a username, never messaged
  pass_hash       TEXT NOT NULL,               -- pbkdf2_sha256$<iter>$<salt>$<hash>
  created_at      INTEGER NOT NULL,
  -- The profile (contract `Profile`).
  name            TEXT,
  lang            TEXT NOT NULL DEFAULT 'en',  -- en | hi | pa
  state           TEXT,
  district        TEXT,
  lat             REAL,
  lon             REAL,
  crops           TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  farm_size_acres REAL
);

-- One row per signed-in device. id is SHA-256 (hex) of the cookie's token; the token itself is never stored.
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires ON sessions (expires_at);

-- Saved questions and answers of signed-in farmers (contract `ChatTurn`). Kept 180 days.
-- id is made by the server, or by the phone for imported guest turns (unique per user).
CREATE TABLE IF NOT EXISTS chats (
  user_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  at       INTEGER NOT NULL,
  lang     TEXT NOT NULL,
  question TEXT NOT NULL,
  answer   TEXT NOT NULL,
  sources  TEXT NOT NULL DEFAULT '[]',         -- JSON Source[]
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS chats_page ON chats (user_id, at DESC, id DESC);
CREATE INDEX IF NOT EXISTS chats_at ON chats (at);

-- Embeddings of the 14 knowledge passages (worker/data), made with Workers AI bge-m3. Rebuilt when
-- meta.knowledge_hash (SHA-256 of the model name and every passage's text) changes.
CREATE TABLE IF NOT EXISTS passages (
  id     TEXT PRIMARY KEY,                     -- scheme:<id> or note:<id>
  vector TEXT NOT NULL                         -- JSON array of numbers, unit length
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Daily counters (India Standard Time days, as a day number). Per-visitor keys are hashes that
-- change every day (day + IP + account), never a raw IP. Global keys count provider calls (for the
-- daily caps), answers per provider, and requests per kind.
CREATE TABLE IF NOT EXISTS usage (
  day INTEGER NOT NULL,
  key TEXT NOT NULL,
  n   INTEGER NOT NULL,
  PRIMARY KEY (day, key)
) WITHOUT ROWID;
