# ANTIGRAVITY WALL BRIEF — the UI/UX overhaul lane

**Mission for Antigravity:** redesign THE CLUB WALL (`dressing-room/club/wall.html`) into a stunning, living dashboard — especially the MEDIA shelf — while obeying the club's laws. Antigravity does the art; the organism stays the source of truth.

## How to run this (captain's 3 steps)
1. Open **Antigravity** → open this repo folder → paste this whole file as the task.
2. Antigravity writes its render to **`dressing-room/state/brain_out/gemini_wall/<TODAY>.md`** (a single complete HTML document, inline CSS/JS only).
3. Done. The next Wall render (every 30 min, or `node scripts/viz.mjs`) passes it through the sanitizer and publishes it as **`dressing-room/club/wall_gemini.html`** — open it from the Media shelf's "🎨 the Gemini render" button (or `localhost:4114/club/wall_gemini.html`).

## The laws Antigravity must obey (the sanitizer enforces them — violations are REJECTED)
- **Zero invented numbers.** Every number shown must come verbatim from `dressing-room/state/wall_data.json` (read it; render only what's there). A number not in that file = the whole render is rejected and the deterministic wall stands.
- **No hype, no shame, no streaks, no countdowns, no red accusations.** Odometers count UP only. An empty panel says who fills it and when — it never looks broken.
- **The body panel shows the verdict COLOR only** — never biometrics, never numbers. Any medical detail = rejection.
- **Self-contained single file**: no CDN, no external fonts/images (inline SVG fine), works offline from `file://` and from `localhost:4114/club/`.
- Audio/poster paths are relative: `media/teamtalk_<date>_am.mp3`, `media/teamtalk_<date>_pm.mp3`, `poster.svg`, `filmkit_<date>.md`.

## Design direction (where Antigravity shines)
- Dark, cinematic, Arsenal white-red on near-black; one display serif for the club name, clean sans for data; generous whitespace; subtle motion (CSS only) on the odometers and the Maidan pitch.
- **MEDIA — THE CLUB'S CHANNEL is the hero fix**: poster as a framed art piece, team talks as beautiful players with waveform-feel styling, film kit / Veo / prompt-pack as pill buttons. Empty state = "the night shift stocks this shelf 🌙", styled, never blank.
- The Maidan as an actual pitch (SVG), calibration as a book spread, the season as a fixture strip. Refresh meta tag stays (the page reloads itself every 5 min).

## Context files Antigravity should read first
- `dressing-room/state/wall_data.json` — the ONLY numbers that exist.
- `dressing-room/club/wall.html` — the current deterministic render (the baseline to beat).
- `scripts/viz.mjs` → `sanitizeGemini()` + `allowedNumbers()` — the gate its output must pass.
- `dressing-room/club/prompts/` — the nightly prompt pack (last night's design-coach critique rides in it).
