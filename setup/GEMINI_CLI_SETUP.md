# GEMINI_CLI_SETUP.md — the second brain (visualization + long-context)

Free with your Google account; your AI Pro subscription raises its limits.
No API key, no new money.

## Install (5 min)
```powershell
npm install -g @google/gemini-cli
gemini          # first run opens browser → sign in with YOUR Google account
```
Choose **"Login with Google"** (NOT an API key — same law as Claude).
**⚠️ ACCOUNT:** sign in with the Google account that carries the AI Pro plan —
the **…2914** address, NOT the default …1429 one. Wrong account = free-tier
limits and the overnight renders will starve.

## Verify
```powershell
gemini -p "Say exactly: second brain online"
```

## Wire into the organism (1 min)
Edit `dressing-room/state/brain_config.json`:
```json
"gemini": { "enabled": true, "binary": "gemini" }
```
From tonight, the overnight `gemini_render` job turns `wall_data.json` into a
rich visual/infographic spec in `brain_out/gemini_wall/` — Gemini doing what
it is best at, off the Claude budget entirely (its tokens never count against
the Max window; brain.mjs tracks the two pools separately).

## What each brain owns (the split, fixed)
- **Claude (Max 5x):** the formation-read, coaching judgment, drill phrasing,
  season review — the hard reads.
- **Gemini (AI Pro):** wall/infographic generation, long-context sweeps
  (whole-season files), NotebookLM material prep, bulk drill volume
  (your existing GEMINI_LOOP.md seam is unchanged: Gemini never touches
  foundations-why, FinOps decision-defense, or first-code).
