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
   - (added 10 Aug 2026 — the list above read as the whole shelf and it is not:
     the same pack writes a FOURTH file, **prompts/voice_brief.md**, and viz's
     own selftest asserts the count — `grep -n "four prompts auto-written"
     scripts/viz.mjs`. It is NOT a paint lane: it is the daily context capsule
     he pastes into the Voice Gaffer Gem (`setup/VOICE_SETUP.md`) before he
     TALKS to the organism — `grep -n "THE VOICE BRIEF" scripts/viz.mjs`. Never
     hand it to him as a render prompt; never tell him prompts/ holds three
     files. Count them live: `ls dressing-room/club/prompts/`.)
2. `node scripts/brain.mjs run gemini_render` — then tell him where the output
   landed (**dressing-room/state/brain_out/gemini_wall/<date>.md** — corrected
   10 Aug 2026: this said a bare "brain_out/gemini_wall/" and there is no
   `brain_out/` at the repo root at all, so an `ls brain_out/` from the project
   dies and the render looks like it never happened. Evidence: `grep -n "const
   OUT_DIR" scripts/brain.mjs` → `join(STATE_DIR, "brain_out")`; list the lane
   live with `ls dressing-room/state/brain_out/gemini_wall/`); viz.mjs folds a
   safe copy into club/wall_gemini.html on its next run.
   NOTE (corrected 29 Jul 2026): the old wording gated this on "if the gemini
   CLI is installed AND gemini.enabled". Both are now wrong — the 17 Jul
   migration moved this job to `"engine": "claude"` in brain_config.json, so it
   runs on the subscription and needs no gemini CLI at all. Don't skip step 2
   because gemini looks disabled; check the job's engine, not the gemini flag.
   (Verify that engine live rather than trusting this line — it is a status and
   statuses rot: `node -e "const c=require('./dressing-room/state/brain_config.json');console.log(JSON.stringify(c.jobs.find(j=>j.id==='gemini_render'),null,1))"`
   prints the job's engine, model, enabled flag and its `out` lane.)
   FOLD CONDITIONS (added 10 Aug 2026 — the "folds a safe copy" clause above is
   true but unconditional, and both conditions can silently swallow the render):
   viz only ever reads **TODAY's** dated file (`grep -n "gemini_wall" scripts/viz.mjs`
   → `join(STATE_DIR, "brain_out", "gemini_wall", today + ".md")`), and it only
   folds what `sanitizeGemini` accepts — any `<script>`, any `on*=` handler, any
   `http(s)://` / `@import` / `<link>` / `<iframe>` and the whole render is
   REJECTED, the deterministic wall stands, and viz prints "gemini render
   REJECTED by sanitizer". Read that line before telling him it's on the wall.
3. Otherwise: print the chosen prompt file's contents in ONE fenced block —
   he pastes it into gemini.google.com (Wall-Painter Gem) and gets his visual.
   Zero authoring on his side, ever.
   (Gotcha, added 10 Aug 2026: each of the three render prompts already CONTAINS
   a fenced json block carrying the whole wall state — read the three template
   strings at `grep -n "function promptPack" scripts/viz.mjs` — so a naive
   single ``` wrapper closes on the inner fence and he pastes half a prompt.
   Use a longer outer fence, or hand him the file path.)
4. Laws travel with the prompt (they're baked into the generated files):
   numbers only from the embedded data · no hype · no streaks · no raw
   biometrics · cold-steel-warm-core palette.
   (Added 10 Aug 2026 — one law was missing from this list and it is the one
   whose breach costs the render: **SELF-CONTAINED, no external references of
   ANY kind** — no @import, no web fonts, no external images or links, system
   fonts only. That is the exact clause the sanitizer in step 2 enforces, so a
   Gem that reaches for a Google font produces a render the club rejects. Also
   in the constitutional block: no dates-as-deadlines, and "output ONLY the
   artifact, no commentary". Read the laws verbatim — they are one string:
   `grep -n "PROMPT_LAWS = " scripts/viz.mjs`.)

## FILM KIT — viz.mjs writes it, every render (LADDER E5, 9 Aug 2026 · CORRECTED 10 Aug 2026)

**CORRECTED 10 Aug 2026 — this whole section stood on a premise that was already
false on the day it was written.** It said, verbatim: *"The wall renders a
`filmkit_<date>.md` link that NOTHING has ever produced — a dead flag with no
writer and no scheduled lane (verified repo-wide, 9 Aug 2026). It is now an
on-demand verb of THIS skill, never a schedule."* Every clause of that is wrong,
and the instruction it carried would have had a session hand-write over another
organ's output file. The evidence, all re-run today:
- **It has a writer, and the writer is viz.mjs.** `buildFilmKit(d, notebook)`
  builds the kit and viz writes it at EVERY wall render, tmp+rename, plus a
  `G:\My Drive\arsenal` copy when the drive is mounted —
  `grep -n "filmkit_" scripts/viz.mjs` (the `writeAtomic(join(CLUB_DIR, ...))`
  line), and `grep -n "function buildFilmKit" scripts/viz.mjs`. repo_bundle
  already names it as viz's job: `grep -n "the film kit" scripts/repo_bundle.mjs`.
- **It shipped 12 Jul 2026**, four weeks before this section declared it dead —
  commit `b9254ce` (THE MEDIA ENGINE): `git log -S "filmkit_" -- scripts/viz.mjs`.
- **It was in the code at the exact moment this section was written.** The same
  commit that added these lines — `8b8eb34`, LADDER E, 9 Aug 2026 — carried the
  write: `git show 8b8eb34:scripts/viz.mjs | grep -n "filmkit_"`.
- **It IS on a schedule** — in the installer and in the conductor's spine both:
  `grep -n "viz.mjs" setup/INSTALL_TASKS.ps1` (Wall-AM · Wall-PM · a Wall-Live
  lane on a minute schedule) and `grep -n "viz.mjs" scripts/conductor.mjs`.
  Read the times from those two files, never from here.
- **The files are on disk right now**, one per render-day going back to July —
  count them live: `ls dressing-room/club/filmkit_*.md`.

So the verb survives, but the mechanism is the owner's, not yours. **DO NOT
hand-write `dressing-room/club/filmkit_<today>.md`** — that path belongs to
viz.mjs, a hand-written copy is an ownership breach, and the next wall render
(up to every 30 min) silently overwrites it anyway. When he says **"film kit"** /
"paint film kit":
- **Run the owner**: `node scripts/viz.mjs` — the kit is rewritten from today's
  real state as part of the render. Then read
  `dressing-room/club/filmkit_<today>.md` back to him and tell him it's on the
  wall: the wall's own "raw kit" link points at exactly that filename —
  `grep -n "raw kit" scripts/viz.mjs`.
- **What it is actually built from** (corrected 10 Aug 2026 — the old text said
  "team_sheet.md opening lines · today's reps count from reps_log.jsonl · the
  KAL-line · the season strip". The KAL-line and the season strip ARE in the kit;
  the other two are not — neither `team_sheet.md` nor `reps_log.jsonl` is read by
  it, and no rep count appears in it at all): the wall's own assembled data — season
  ledger · doubts retired + rematches waiting · weekly consistency with its
  window · calibration gap and trend · Maidan stages runnable · his KAL-line —
  plus `dressing-room/state/notebook.json` for real season moments. Read the
  function: `grep -n "function buildFilmKit" scripts/viz.mjs`.
- Same laws as every render, and here they are ENFORCED IN CODE rather than by
  your hand: numbers only from the state read, no hype, no streaks, no raw
  biometrics. If a state file is missing, its shot is OMITTED — never invented:
  an unopened season ledger prints "not yet counted … Do not narrate this as
  zero" instead of a 0, and an absent `notebook.json` simply drops the moments
  section (it does not exist today — check with
  `ls dressing-room/state/notebook.json`). The kit ends on the tone laws and the
  words "kal phir".
