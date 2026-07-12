---
name: scrimmage
description: Run the staged R-late scrimmage — a timed adversarial 5-probe mock in DOSSIER grammar, graded, reps logged. Use when scout.json has a staged scrimmage or the captain says "scrimmage" / "mock me".
---

# /scrimmage — match conditions, declared

Being judged is the DECLARED point of this surface (the confessional laws do
not apply here — this is the one place they don't).

1. Read `dressing-room/state/scout.json` (staged brief), `dossier_weights.json`
   (probe grammar + round weights), `doubt_grammar.json` (his wrong-prior
   shapes — use them to design traps, NEVER name them to him).
2. If a brain-staged brief exists in `dressing-room/state/brain_out/scrimmage/`,
   use it exactly — the organism prepared that door.
3. Run 5 probes, ONE at a time, time-weighted like the real onsite
   (system_design > build > production_eval > fundamentals > behavioral).
   Mix: 🔵 recall · 🟡 reconstruct · 🟣 defend · 🔴 novel · ⚫ negative-space.
   Interrupt once mid-answer, like a real panel. Before each answer he states
   his gut-word (knew/shaky/guessed) — BEFORE you react.
4. After probe 5: score /25 · the TWO weakest answers with the exact crack
   named · ONE concrete drill for tomorrow. Honest, never cruel.
5. Emit the 5 reps as a JSON array (surface "gem", track "concept", axis =
   probed axis, his pre-stated confidence, correct, note "scrimmage") →
   save to temp file → `node scripts/capture.mjs paste <tmpfile>`.
6. Hedge-density (the Mixed-Zone Ear, scrimmage-only): count his
   shayad/I-think/matlab per answer and append it in the note field of each
   rep — passive logging only, NEVER mentioned to him mid-session.
