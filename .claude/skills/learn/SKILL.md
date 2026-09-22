---
name: learn
description: The session-agnostic front door to the day's learning — reads the kickoff STATE (not chat), routes the current task by track (concept→FORGE, Python→the CLOSE-PACKET loop, course→guided Colab pass), ingests the Gemini handoff, captures the reps with zero tax, and closes with a cold retrieval test on the day's concept. Use when the captain says "learn", "seekhna shuru", "aaj ka session", "continue", "where was I", "start my session" — a start with NO concept named. If he names a concept ("forge embeddings"), that's /forge, not this.
---

# /learn — run today's session, oriented from ONE SCREEN

> ## ⭐ THE DIGEST FIRST — 22 Sep 2026, his word ("please make it right now", forks ruling row 242)
> **Measured before this change:** the Desktop study session held **204,096 cached tokens before its first
> teaching word** — this skill's 43 KB body, SAMJHAO_MERGED, VISUAL_CONTRACT, the forge skill twice, the act
> skill, sitting.mjs — and re-ran all of it every turn, on his study pool. LAW T: a deterministic render is free
> and better. So the body of this skill moved VERBATIM to `REFERENCE.md` beside this file (L9), and the boot is
> now ONE command:
>
> ```
> node scripts/learn_digest.mjs
> ```
>
> **Run it as your FIRST tool call and OBEY THE SCREEN.** It reads the state bus by code (zero tokens, writes
> nothing) and prints: where he is (concept · step · axis · the exact unanswered micro-question, verbatim) ·
> this axis's own doubts, traps and calibration from the immutable capsule · the four live duties · every
> command you type, with the live concept:axis already filled in · the turn shape · where the full wording lives.
>
> **DO NOT READ, at boot or ever "just in case":** `REFERENCE.md` whole · `docs/archive/SAMJHAO_MERGED__2026-08-30.md`
> whole · `learning-layer/VISUAL_CONTRACT.md` whole · `.claude/skills/forge/SKILL.md` whole · `scripts/*.mjs`
> bodies · `memory/`. The digest names the one section a step needs; open THAT section by grep, when that step
> arrives, not before. A session that loads the canon "to be safe" is spending his study pool to re-read what
> the hook already prints every turn.

## The boot, in order (each line is a command or a rule, never a memory)

1. `node scripts/learn_digest.mjs` — the screen. Read it whole; it is ≤ 16 KB by contract (selftest).
2. `node scripts/sitting.mjs open --surface code --no-spawn --task "<what the digest says>"` — the day's
   container. Without it nothing lands at full-time (his 7 Aug captain's-call law).
3. If the digest shows an OPEN forge session: your **first message to him is the pointer question, word for
   word** — no recap, no summary of yesterday, no "you already know this" (HOW_HE_LEARNS #10). Then teach.
   If it shows NO open session: follow its route line (`forge_session.mjs start <concept>` for a concept task;
   `REFERENCE.md §1` by track for Python/course/domain tasks).
4. **Every stop** (axis end, mid-axis exit, his "bas", context near the line): `node scripts/forge_session.mjs
   pointer "<the exact unanswered micro-question + the gut-word ask + where in the axis>"` BEFORE anything else.
5. Day end: `node scripts/gaffer_brain.mjs judge-round` → `node scripts/sitting.mjs close --reason fulltime` →
   `/full-time`. (Full text: `REFERENCE.md §4`.)

## The laws the digest cannot print for you (they bind the MODEL, not the screen)

- **THE NOTES LAW (22 Sep, his "okay let's do it.", act `amucdnagn7o`, row 240).** Notes are EXTRACTED from the
  archive by code at the week's end and ratified by him cold — never written from memory, never hand-written
  mid-lesson. Extraction cannot recover what was never SPOKEN, so your only live job is the **four elicitations**:
  (1) gut-word before every answer · (2) the stuck-story in HIS words the moment a crack fires, with the ONE
  ```diff block written right there — it IS the crack log, never log a crack later · (3) Bolo at axis close,
  pasted verbatim · (4) the English interview line. Plus the pointer at every stop and THE BANK line at its
  three moments (the digest prints it filled in). No note block, no `build_exchanges` mid-lesson.
- **GAME ON (30 Aug 2026):** the pre-cyborg era is closed; the four locked capsules are re-opened as UNLEARNED
  and are the teaching RESOURCE (his own doubts, traps, calibration — the digest serves this axis's). Never a
  Re-Jirah on them; a burned strike is burned; teach from zero WITH them open.
- **The teaching contract is the hook line, every turn.** Obey what it prints (one idea · one check-question ·
  dheema not lamba · three layers · no tables · position by name · the diff block only at a correction).
  Drift is self-reported in the same turn: `node scripts/teaching_contract.mjs flag <rule-id> --why "…"`.
- **His rulings become receipts in the same turn:** `node scripts/acts.mjs do rule --door claude-code --text "…"`.
- **No system / notes / tool work mid-concept** (HOW_HE_LEARNS #12) — name it, park it in one line, hand the
  micro-question back. An architect question goes to the architect terminal, not into his lesson.
- **Desktop trap (22 Sep):** text written ABOVE a tool call is replaced on his screen — every tool first, the
  whole teaching message LAST, self-contained.
- **Owners only.** You never hand-edit a state file; every write above goes through the organ that owns it.

## Where the rest of the method lives (open a SECTION by name, never the file)

- `REFERENCE.md §0 Orient` — the pre-digest orientation rules (kept for the record; the digest does them by code).
- `REFERENCE.md §1 ROUTE by track` — Python (CLOSE-PACKET loop), course (Colab pass), domain (finance from zero).
- `REFERENCE.md §2 THE CLOSE-PACKET` · `§3 INGEST + CAPTURE` (Gemini handoff, paste capture) · `§4 DAY-END CLOSE`
  · `§ Laws (inviolable)`.
- `.claude/skills/forge/SKILL.md` — THE METHOD's 12 steps in detail, THE BANK, the three gates. Open the step's
  section when the step arrives (the digest names it). For step 3 SAMJHAO the digest + the hook are enough.
- `learning-layer/VISUAL_CONTRACT.md §4` — the one DRIVEN widget after axis g (step 4 DIKHAO), stepper, no autoplay.
- `docs/archive/SAMJHAO_MERGED__2026-08-30.md §3` — the axis loop's substance; `§6` the per-turn laws (also in the hook).
