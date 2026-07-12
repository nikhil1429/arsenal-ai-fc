# setup/ — THE ORGANISM's complete wiring pack ⚪🔴

> Follow top to bottom, once. Every step is paste-ready. When you finish,
> every surface is wired and the organism runs itself. Nothing here costs
> money beyond the plans you already pay for (Claude Max 5x + Google AI Pro).
> Anything that WOULD cost money is in ORGANISM_BUILD_LOG.md → Money-gate list.

## Order of wiring (≈25 minutes total, one sitting)

| # | Step | File | Time |
|---|------|------|------|
| 1 | Install the schedule (all ArsenalFC-* tasks) | `INSTALL_TASKS.ps1` | 2 min |
| 2 | The throw-in (phone → organism) | `NTFY_SETUP.md` | 5 min |
| 3 | Gemini CLI (the second brain) | `GEMINI_CLI_SETUP.md` | 5 min |
| 4 | Colab per-rep flush cell | `COLAB_SETUP.md` | 3 min |
| 5 | Gems (Drill Gem v4 add-on · Interview Examiner · Wall-Painter) | `GEMS_SETUP.md` | 5 min |
| 6 | NotebookLM | `NOTEBOOKLM_SETUP.md` | 2 min |
| 7 | Verify Oura / ActivityWatch / GitHub / Supabase | `SURFACES.md` | 2 min |
| 8 | (optional) Ambient Maidan wallpaper | `WALLPAPER.ps1` header | 1 min |
| 9 | (when you two decide) The Twelfth Player | `12TH_PLAYER_DECISION.md` | — |

## The zero-guesswork test
After step 7, run:

```powershell
cd C:\Users\nikhi\GitHub\arsenal-ai-fc
node scripts/heartbeat.mjs
node scripts/brain.mjs status
node scripts/viz.mjs
start dressing-room\club\wall.html
```

If the wall opens and the brain reports its budget phase, the organism is alive.
Daily life inside it: see `MORNING_RUNBOOK.md` (repo root).
