---
name: paint
description: Fire the Gemini visualization lane — hand the captain tonight's ready-made Wall-Painter prompt, or run gemini CLI directly if wired. Use when he says "paint", "poster", "visual", "dikhao".
---

# /paint — the second brain draws what the first brain knows

The organism WRITES his Gemini prompts (viz.mjs regenerates them at every wall
render, current numbers embedded — dressing-room/club/prompts/).

1. Ask which (or infer from his words):
   - **wall** → prompts/wall_painter.md (rich dashboard render)
   - **poster** → prompts/match_poster.md (this week's match poster)
   - **film** → prompts/season_film.md (Veo video prompt for the Gemini app)
2. `node scripts/brain.mjs run gemini_render` — then tell him where the output
   landed (brain_out/gemini_wall/); viz.mjs folds a safe copy into
   club/wall_gemini.html on its next run.
   NOTE (corrected 29 Jul 2026): the old wording gated this on "if the gemini
   CLI is installed AND gemini.enabled". Both are now wrong — the 17 Jul
   migration moved this job to `"engine": "claude"` in brain_config.json, so it
   runs on the subscription and needs no gemini CLI at all. Don't skip step 2
   because gemini looks disabled; check the job's engine, not the gemini flag.
3. Otherwise: print the chosen prompt file's contents in ONE fenced block —
   he pastes it into gemini.google.com (Wall-Painter Gem) and gets his visual.
   Zero authoring on his side, ever.
4. Laws travel with the prompt (they're baked into the generated files):
   numbers only from the embedded data · no hype · no streaks · no raw
   biometrics · cold-steel-warm-core palette.

## FILM KIT — on demand only (LADDER E5, 9 Aug 2026)

The wall renders a `filmkit_<date>.md` link that NOTHING has ever produced — a
dead flag with no writer and no scheduled lane (verified repo-wide, 9 Aug 2026).
It is now an on-demand verb of THIS skill, never a schedule:
- When he says **"film kit"** / "paint film kit": assemble the kit yourself from
  the day's real state (team_sheet.md opening lines · today's reps count from
  reps_log.jsonl · the KAL-line · the season strip) as a short shot-list
  markdown, write it to `dressing-room/club/filmkit_<today>.md` (the wall's own
  link target), and tell him it's on the wall.
- Same laws as every render: numbers only from the state you read, no hype, no
  streaks, no raw biometrics. If a state file is missing, its shot is OMITTED —
  never invented.
