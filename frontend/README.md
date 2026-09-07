# FarmSaathi frontend

React (Vite) + Tailwind + Redux Toolkit + react-i18next. See the
[repo root README](../README.md) for how this fits into the full stack.

## Design system

The visual language is deliberately restrained — one palette, one type
pairing, a handful of reusable primitives — rather than ad hoc styling per
page. If you're adding a new page, reach for what's already here first.

**Palette** (`tailwind.config.js`) — three scales, chosen with actual
color theory rather than defaults:
- `moss` — the primary brand green (muted/earthy, not a neon "success"
  green). Structure, primary actions, active states.
- `clay` — a warm terracotta accent, ~60-70° from moss on the color wheel
  (a warm/cool split rather than a loud complementary clash). Used
  sparingly — icon accents, the odd highlight — never as a base color.
- `sand` — a warm cream/charcoal neutral scale (never stark white or cold
  gray) that both other scales sit comfortably against. Backgrounds, body
  text, borders.
- Roughly a 60/30/10 split across a screen: sand dominant, moss for
  structure, clay reserved for the few moments that should pop.
- Semantic colors (`success`/`warning`/`error`/`info`) are tuned into the
  same warm family instead of Tailwind's stock red/amber/blue.

**Type** — Manrope (Latin) paired with Noto Sans Devanagari + Noto Sans
Gurmukhi (loaded in `index.html`), so Hindi and Punjabi are typeset on
purpose instead of falling back to whatever the OS ships. Base size is
17px, a notch above the browser default, for outdoor/mobile legibility.

**Icons** — [lucide-react](https://lucide.dev) throughout; no emoji as UI
elements (a couple survive only as literal chat content, e.g. a farmer's
own message text, never as interface chrome). The logo mark and hero
illustration are bespoke inline SVG, built from the same leaf-shape
language so the brand feels systematic rather than "icon library + logo
bolted on."

**Primitives** (`src/components/ui/`) — `Button`, `Card`, `Input`,
`Select`. Small, deliberately un-clever wrappers: consistent radius,
focus rings, disabled states, and touch-target sizing in one place instead
of copy-pasted Tailwind per page.

**Navigation** — a full top `Navbar` on desktop; on mobile, a thumb-reach
`BottomNav` tab bar instead of a hidden hamburger menu (a persistent,
icon+label bar is more discoverable for first-time/low-literacy
smartphone users than something that has to be found and opened first).
Both read from the same `src/nav.js` config so they can't drift apart.

**i18n** — `src/locales/{en,hi,pa}.json` cover the UI chrome (buttons,
labels, empty states). The chatbot's actual *content* is translated
separately, server-side, by `ai-service` — the two are intentionally
decoupled; see the root README's architecture section.

## Commands

```bash
npm install
cp .env.example .env
npm run dev       # http://localhost:5173
npm run build
npm run lint
```
