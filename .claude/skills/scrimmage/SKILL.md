---
name: scrimmage
description: Run the staged R-late scrimmage — a timed adversarial 5-probe mock in DOSSIER grammar, graded, reps logged. Use when scout.json has a staged scrimmage or the captain says "scrimmage" / "mock me".
---

# /scrimmage — match conditions, declared

Being judged is the DECLARED point of this surface (the confessional laws do
not apply here — this is the one place they don't).

1. Read `dressing-room/state/scout.json` (staged brief), `dossier_weights.json`
   (probe grammar + round weights), `doubt_grammar.json` (his wrong-prior
   shapes — use them to design traps, NEVER name them to him; all three sit in
   `dressing-room/state/`, and doubt_grammar carries `machine_side: true` for
   exactly this reason — `grep -n "MACHINE-SIDE" scripts/doubtminer.mjs`, whose
   header names it sole writer of that file). If a CODE round is staged (the
   Live-Examiner lane the dugout voice scrimmage runs), run it here too —
   9 Aug 2026: this skill used to skip it, so the laptop scrimmage was quietly
   easier than the voice one.
   (corrected 10 Aug 2026: this read "if the STAGED BRIEF carries a CODE round"
   until today, and no brief has ever carried one — so a laptop scrimmage
   following this line literally looked in the wrong file, found nothing, and
   skipped the code round exactly as it did before the 9 Aug repair that claims
   to have fixed it. The CODE round is its OWN file,
   `dressing-room/state/examiner_drill.json`, written by `examiner.mjs` and
   pulled into the voice mock through a SEPARATE import, never through the brief:
   `grep -n "loadFreshDrill, drillSection" scripts/dugout.mjs` and
   `grep -n "the section the scrimmage instruction embeds" scripts/examiner.mjs`.
   Read it live — `node scripts/examiner.mjs status` (read-only) prints either
   "fresh drill staged — <template> on <concept>" or "nothing staged today".
   FRESH means staged TODAY or YESTERDAY: the scheduler stages in the evening for
   TOMORROW's mock, so a same-day-only gate would strip the code round off every
   daytime scrimmage — `grep -n "function loadFreshDrill" scripts/examiner.mjs`.
   A drill older than that does not ride, and this skill must not run it. When it
   does ride, the code's own contract is: it is the HEAVIEST probe, the `task` is
   read to him VERBATIM, the `hidden_tests` are revealed ONE AT A TIME and only as
   you RUN each, and you grade the CODE, never the coder — a miss resolves
   silently into the reps.)
   **THE MOMENT YOU READ THE `task` TO HIM, RUN
   `node scripts/examiner.mjs served scrimmage-skill`** — one command, then carry on;
   it stamps a serve receipt on the drill through its owner and writes nothing else.
   (added 11 Aug 2026, dead-wire sweep: until today the examiner staged a drill every
   night and NOTHING recorded whether any surface picked it up — "he played the code
   round and missed" and "the drill was never opened" left byte-identical traces, so
   the organ's own "a miss resolves silently into the reps" clause could not be
   checked by anyone. Evidence it had never ridden: reps_log.jsonl held 21 rows and
   ZERO tagged `scrimmage-voice`. The voice lane now stamps itself on its /config
   route; the laptop lane is out-of-process and has to say so with this command.
   `node scripts/examiner.mjs status` prints the receipt back as its SECOND line, and
   the nightly `stage` says out loud when the outgoing drill carried none. If you
   stamp one by mistake, `node scripts/examiner.mjs unserve scrimmage-skill` walks it
   back — a wrong receipt is a lie, so remove it, never leave it.)
2. If a brain-staged brief exists in `dressing-room/state/brain_out/scrimmage/`,
   use it exactly — the organism prepared that door.
   (annotated 10 Aug 2026: EXISTENCE is not the signal, and this line implied it
   was. The overnight `scrimmage_staging` job writes a `<date>.md` into that lane
   on nights it had nothing to build too, and those files open by saying so —
   `dressing-room/state/brain_out/scrimmage/2026-08-09.md` begins
   "# Scrimmage staging — no build" because scout.json's `staged` was empty that
   night. Read the file's FIRST LINE and use it only when it is a real brief.
   Owner + trigger: `grep -n "scrimmage_staging" dressing-room/state/brain_config.json`;
   the path shape is the brain's generic lane, `grep -n "brain_out/<job>/<date>.md"
   scripts/brain.mjs`. The voice lane reads this exact path and falls back to
   scout's own `brief` string when the file is absent — `grep -n '"brain_out",
   "scrimmage"' scripts/dugout.mjs` — so absence is normal, not a fault.)
3. Run 5 probes, ONE at a time, time-weighted like the real onsite
   (system_design > build > production_eval > fundamentals > behavioral).
   Mix: 🔵 recall · 🟡 reconstruct · 🟣 defend · 🔴 novel · ⚫ negative-space.
   Interrupt once mid-answer, like a real panel. Before each answer he states
   his gut-word (knew/shaky/guessed) — BEFORE you react.
   (annotated 10 Aug 2026: every claim in this step was checked and all HELD —
   the five round ids and that exact descending order are `rounds[]` in
   `dressing-room/state/dossier_weights.json`; all five probe emojis match its
   `probe_types`; the one interruption and the gut-word-before-the-answer law are
   the voice lane's own words. But the round order here is a COPY, and a copy
   rots: read the live array, never this line. The voice lane builds the same
   sentence from that file and keeps the identical hardcoded string only as its
   fallback — `grep -n "time-weighted like the real onsite" scripts/dugout.mjs`.)
4. After probe 5: score /25 · the TWO weakest answers with the exact crack
   named · ONE concrete drill for tomorrow. Honest, never cruel.
   (checked 10 Aug 2026, HELD unchanged: the voice lane runs the identical close
   and its filed report is typed `total_25` + `weakest[]` + `drill` —
   `grep -n "score /25 out loud" scripts/dugout.mjs` and
   `grep -n "scrimmage_report" scripts/dugout.mjs`. Nothing in code computes the
   /25 — the voice lane only files the number the examiner already spoke — so on
   this surface the scoring stays yours. Same for the header's "confessional laws
   do not apply here": the code says it in the same breath, `grep -in "one legal
   surface" scripts/dugout.mjs`.)
5. **⚠ BANK THE FIVE, DO NOT GRADE THEM (17 Aug 2026, THE TRUTH LAYER BLOCK 2).**
   A scrimmage answered by voice and the same scrimmage answered here used to get
   verdicts from two different models against two unwritten standards — the exact
   "it depends which surface he opened" the truth layer exists to end. Per probe,
   the instant he finishes:
   `node scripts/gaffer_brain.mjs capture scrimmage <drill-index> --gut <word> --note scrimmage <<< "<what he said>"`
   — or `voice_rep <concept> --asked "<the probe, verbatim>"` when the probe is not a
   staged drill row. Then once, after probe 5:
   `node scripts/gaffer_brain.mjs judge-round`
   It grades all five in ONE Opus call against the DOSSIER — the real onsite's rounds
   and its §7 red-flags, quoted from `OPPONENT_SCOUT.md` — and dispatches each rep to
   `capture.mjs`. The `/25`, the two weakest and the drill in step 4 stay YOURS: those
   are the examiner's read of the session, not a per-answer verdict, and nothing in
   code computes them.
   *(FROZEN, the pre-BLOCK-2 instruction, kept because it is what the paste door still
   accepts and what a Gem sitting still uses: emit the 5 reps as a JSON array (surface
   "gem", track "concept", axis = probed axis, his pre-stated confidence, correct, note
   "scrimmage") → save to temp file → `node scripts/capture.mjs paste <tmpfile> --chain`.
   Do NOT use it for a scrimmage you ran yourself — that is you grading him.)*
   (corrected 10 Aug 2026, two things:
   (a) THE FIELD LIST WAS INCOMPLETE, and a rep built from it alone is REJECTED
   at the door — capture's validator also demands `ts` (a string that actually
   PARSES as a date), `concept` (non-empty) and `question` (non-empty), and `axis`
   must be PRESENT even when it is null. Read the reject reasons themselves:
   `grep -n "concept missing/empty" scripts/capture.mjs`. `axis` is ONE letter
   a–i — not a probe name — and the probe→axis map is `probe_types.<type>.axis_types`
   in dossier_weights.json. The allowed sets are gem|colab, concept|skill and
   knew|shaky|guessed: `grep -n "const SURFACES" scripts/capture.mjs`.
   (b) `--chain` was missing from the command until today. Plain `paste` appends
   the reps and then PRINTS that the derived organs are stale — "derived state
   (cards · calibration · nemesis · learning_state) does NOT yet include these
   reps" (`grep -n "does NOT yet include these reps" scripts/capture.mjs`) — so a
   scrimmage logged the old way scored him against a calibration curve that had
   not heard the mock. `--chain` recomputes on the spot.
   Also: keep the word "scrimmage" inside `note`. It is load-bearing, not a label —
   the shadow organ decides `scrimmage_played` by regex on that field:
   `grep -n "scrimmage_played: reps.some" scripts/shadow.mjs`. Step 6 APPENDS to
   the note, which keeps the substring; never replace it.)
6. Hedge-density (the Mixed-Zone Ear, scrimmage-only): count his
   shayad/I-think/matlab per answer and append it in the note field of each
   rep — passive logging only, NEVER mentioned to him mid-session.
   (annotated 10 Aug 2026: "scrimmage-only" and "never mentioned" both HELD
   against the code — the ear fires only in scrimmage mode
   (`grep -n "THE EAR'S ONE LEGAL SURFACE" scripts/dugout.mjs`) and the voice
   lane's selftest asserts the examiner is never even told the counting exists
   (`grep -n "EAR LAW" scripts/dugout.mjs`). What is NOT complete is the word
   list: those three are examples, not the set. The club's canonical hedge
   regex carries eleven terms across Hinglish and English —
   `grep -n "const HEDGE_RE" scripts/register.mjs` — count against that (it moved from
   dugout.mjs to register.mjs so ONE meter counts every mouth; dugout imports it). The voice
   lane banks its count in `dugout_scrimmage.jsonl` and surfaces it only inside
   the filed report, off-mic: `grep -n "the ear's one legal surface, measured
   off-mic" scripts/dugout.mjs`.)
