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
2. If `gemini` CLI is installed AND `brain_config.json` gemini.enabled:
   run `node scripts/brain.mjs run gemini_render` and tell him where the
   output landed (brain_out/gemini_wall/); viz.mjs will fold a safe copy into
   club/wall_gemini.html on its next run.
3. Otherwise: print the chosen prompt file's contents in ONE fenced block —
   he pastes it into gemini.google.com (Wall-Painter Gem) and gets his visual.
   Zero authoring on his side, ever.
4. Laws travel with the prompt (they're baked into the generated files):
   numbers only from the embedded data · no hype · no streaks · no raw
   biometrics · cold-steel-warm-core palette.
