# FarmSaathi: design brief

The owner's standing instruction for every Lab app: "they all should feel like products, not some animated picture … PLEASE DON'T GIVE ME AI SLOP that just looks like any other site." EduSched and SafeSpace were rebuilt to that bar; FarmSaathi must match it.

## Who and where

A farmer in Punjab, Haryana or UP on a ₹8,000 Android phone, outdoors in bright sun, often one-handed, on a weak 3G/4G signal, more comfortable speaking than typing, reading Hindi or Punjabi first. Also: a recruiter opening it on a laptop, who should see a serious product in seconds.

## The feel

A sturdy field tool, like a good government-issue app done right, or a well-made seed-company app: high contrast, big type, plain words, nothing decorative. Voice is the primary input. The current hero + illustration + five feature cards landing is deleted.

## Hard rules (a reviewer checks every one)

- No hero section, feature-card grid, illustration, gradient, glow, glassmorphism, emoji, stock imagery, confetti or marketing copy inside the app.
- The first screen is the Ask tab, ready to listen, in the phone's language (navigator.language: hi → Hindi, pa → Punjabi, else English), with the language switch one tap away at the top.
- Five bottom tabs, always labelled with words and an icon: Ask, Leaf, Soil, Weather, Schemes. "Me" (profile, sign in/out, saved chats, language) sits behind the avatar at the top right. On desktop the tabs become a left rail and the content a centred 720 px column; it must still feel designed at 1440 px.
- Base type 18 px on phones, line-height 1.5; touch targets ≥ 48 px; contrast ≥ 7:1 for body text (sunlight).
- Fonts, self-hosted woff2 subsets with OFL licences: **Mukta** (Latin + Devanagari) for UI and body, **Noto Sans Gurmukhi** for Punjabi, **IBM Plex Mono** only for numbers like N-P-K values, temperatures and confidence. Never let Gurmukhi fall back to a system font.
- Colour: one field green for primary actions, turmeric amber for warnings (rain, disease), a deep ink, warm-neutral paper. Light and dark themes (dark is its own palette). Status colours mean one thing each.
- Motion only to explain: the mic level meter while listening, a progress bar while a model downloads. `prefers-reduced-motion` → none.
- Every screen has designed states: first run, empty, loading (skeletons shaped like the content), offline ("No signal. Showing what was saved at 10:42."), permission denied (mic, camera, location) with what to do, model downloading (size and progress), daily limit reached, and error with a way forward.
- Copy is spoken-language plain in all three languages, written by hand per language (not machine-translated English): "Ask by speaking", "Check a leaf", "Rain likely Thursday afternoon. Don't spray on Wednesday evening." Never "AI-powered", "smart", "revolutionary".
- 0 axe violations. Works at 360 px. PWA: installable, app shell and last data offline, leaf and soil models offline once downloaded.
- App shell (HTML + JS + CSS, gzipped) under 200 KB; the ONNX runtime and models load only on the tabs that need them.

## Tokens (start here; refine, keep the roles)

```css
:root {
  --paper: #f5f6f1; --card: #ffffff; --ink: #18221b; --ink-2: #33413a; --muted: #5d6a62; --line: #d9dfd6;
  --field: #2b6a3c; --field-ink: #ffffff; --field-soft: #e3efe1;
  --turmeric: #9a6400; --turmeric-soft: #f7ecd4; --danger: #a8321f; --focus: #1f5fbf;
  --radius: 12px; --radius-sm: 8px; --tab-h: 68px;
  --f-ui: 'Mukta', system-ui, sans-serif; --f-pa: 'Noto Sans Gurmukhi', 'Mukta', sans-serif; --f-num: 'IBM Plex Mono', ui-monospace, monospace;
}
[data-theme="dark"] {
  --paper: #111611; --card: #182019; --ink: #e6ece6; --ink-2: #c4cec6; --muted: #9aa79e; --line: #2a342c;
  --field: #8fd09f; --field-ink: #0f1a12; --field-soft: #1d3324; --turmeric: #e9b64e; --turmeric-soft: #372b13; --danger: #f08a73; --focus: #8fb4f5;
}
/* plus the same dark values under prefers-color-scheme: dark for :root:not([data-theme='light']) */
```

## Screens

- **Ask** (home): the conversation; a large mic button at the bottom (hold or tap to talk, with a live level meter and "Listening…"), a text field beside it; each answer has a Listen button (server voice, else the phone's voice, and it says which), source chips that open the matching scheme, and the time. First run shows four real example questions in the current language as tappable chips (e.g. "When will the next PM-KISAN installment come?", "My wheat leaves are turning yellow, what should I do?"). Daily-limit and offline states designed.
- **Leaf**: "Take a photo" (rear camera via `<input type=file accept=image/* capture=environment>`) or choose one; a framing guide (one leaf, filling the frame, daylight); the result card: most likely disease with confidence bar, two runner-up guesses with percentages, crop, what to do this week, "Ask FarmSaathi about this" (prefills Ask). Healthy leaves say so plainly. A note that it knows 15 conditions across tomato, potato and pepper, and what to do for other crops.
- **Soil**: the seven inputs (N, P, K in kg/ha, pH, plus temperature, humidity and rainfall prefilled from the saved village's weather with "from this week's weather" labels), each with the Soil Health Card's own wording and typical ranges; result: top three crops with a confidence bar each and a one-line reason in words; "Save to my crops".
- **Weather**: today large (temperature, rain chance, wind), seven days as rows, and plain advice lines derived from the forecast: spraying windows (no rain for 6 h, wind < 15 km/h), irrigation skip days, heat warnings. Village picked by GPS (permission asked on tap) or by searching the Open-Meteo geocoder.
- **Schemes**: searchable list of the six schemes with category chips; a detail view with amount, who is eligible, how to apply step by step, the official link; works offline.
- **Me**: language, village, crops, farm size; sign in / create account (mobile number or email + password; it says plainly there is no OTP and the number is never shared or messaged); saved chats; import guest chats prompt after sign-in; sign out; delete account; About (how it works, privacy in plain words, link to the case study on amittal.dev and the GitHub repo).
- **Signed-out web visitors** see the same app (no separate landing page). Index.html carries real prerendered text for search engines below the app root: what it does in all three languages.
- 404 page in the app language.

## Quality loop

Playwright screenshots of every screen and state at 390×844 and 1440×900, light and dark, in English and Hindi, plus Punjabi for Ask, Leaf result and Schemes. Look at every PNG and critique it as a demanding product designer; iterate until it looks like a product a state agriculture department would be proud to ship.
