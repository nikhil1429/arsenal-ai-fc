# GEMINI_CLI_SETUP.md — the second brain (visualization + long-context)

Free with your Google account; your AI Pro subscription raises its limits.
No API key, no new money.

## Install (5 min)
```powershell
npm install -g @google/gemini-cli
```

## Auth — FREE AI Studio key (July 2026 reality)
Google deprecated the personal Google-login path for this CLI ("migrate to
Antigravity"). The working free path is the AI Studio API key — which is
exactly the masterplan's sanctioned "free Gemini pool" bulk engine.
**This is unlike the Anthropic-key ban:** an Anthropic key bills per token;
a free-tier Gemini key has NO billing attached — past quota, requests are
rejected, never charged. NEVER enable billing on its Cloud project.

1. Browser → **aistudio.google.com/apikey** — signed in as the **…2914**
   account (the AI Pro one).
2. **Create API key** → copy the `AIza…` string.
3. PowerShell (stores it as a USER env var — outside the repo, never committed):
   ```powershell
   [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "PASTE-KEY-HERE", "User")
   ```
4. Close and reopen PowerShell, then verify:
   ```powershell
   gemini -p "say exactly: second brain online"
   ```
Scheduled tasks inherit user env vars — the overnight renders start the same night.

**Privacy note (honest):** free-tier Gemini API data may be used by Google for
training. By design the organism sends Gemini ONLY wall_data/learning-state
shapes (concept names + numbers) — never your doubts verbatim, never
biometrics; those stay on the Claude lane.

**Zero-key fallback (always works):** skip the key entirely and use the paste
lane — `/paint` (or dressing-room/club/prompts/) gives you the ready-made
prompt; paste it into the Wall-Painter Gem at gemini.google.com. Your AI Pro
plan powers that at full strength with no key at all.

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
