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

## Creative direction: FULL FREEDOM (the captain's words)
**"I want to feel like a cyborg living in 2035 inside an organism."** That is the entire brief. Within the laws above, Antigravity has total creative freedom — layout, typography, motion, metaphor, all of it. Directions the captain will love (suggestions, not constraints):
- The wall as living TISSUE: panels as organs/membranes that breathe (slow CSS pulse), data flowing as bioluminescent threads between them, the Maidan as a real pitch under floodlights, odometers as heartbeats.
- Neural-interface HUD aesthetics: thin luminous rules, depth, glassmorphism on near-black, Arsenal red as the blood of the organism, white as bone.
- Motion everywhere but calm — nothing blinks, nothing counts down, everything breathes. A 2035 cockpit, not a casino.
- **MEDIA — THE CLUB'S CHANNEL is the hero panel**: poster as framed art, team talks as living waveforms, the one-click lanes (they copy content + open the account — keep their onclick behavior) as glowing organelles. The empty state must still say the night shift stocks it.
- Keep the 5-minute self-refresh meta tag. Keep every number's meaning; reinvent every pixel.

## Context files Antigravity should read first
- `dressing-room/state/wall_data.json` — the ONLY numbers that exist.
- `dressing-room/club/wall.html` — the current deterministic render (the baseline to beat).
- `scripts/viz.mjs` → `sanitizeGemini()` + `allowedNumbers()` — the gate its output must pass.
- `dressing-room/club/prompts/` — the nightly prompt pack (last night's design-coach critique rides in it).
