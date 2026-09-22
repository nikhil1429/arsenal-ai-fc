---
name: forge
description: Run a full FORGE study session INSIDE Claude Code with ZERO capture tax — Claude is the teacher-examiner, THE METHOD's 12-step pipeline is paced by forge_session.mjs, the gut-word law is enforced, and at session end the reps are captured automatically (no copy, no paste). Use when the captain NAMES a concept to forge — "forge <concept>", or names a specific concept to lock. A generic study-start with NO concept named ("padhai karte hain", "aaj ka session", "continue", "where was I") goes to /learn, which reads state and delegates back here when the current task is a concept.
---

# /forge — the zero-tax study session, booted from ONE SCREEN

> ## ⭐ THE DIGEST FIRST — 22 Sep 2026, his word ("please make it right now", forks ruling rows 242 / 243)
> **Measured:** the Desktop study session held **204,096 cached tokens before its first teaching word**, this
> skill's 57 KB body read twice among them. LAW T: a deterministic render is free and better. The body moved
> VERBATIM to `REFERENCE.md` beside this file (L9 — moved, not edited, not deleted). The boot is ONE command:
>
> ```
> node scripts/learn_digest.mjs
> ```
>
> Run it as your FIRST tool call (if /learn already ran it this session, do not run it again) and OBEY THE
> SCREEN: position · the exact unanswered micro-question, verbatim · this axis's capsule doubts/traps/calibration
> · the four live duties · every command with the live concept:axis filled in · the turn shape · where the full
> wording lives. **Do not read `REFERENCE.md` whole, ever** — open the one section the current step needs, by
> grep, when that step arrives. The hook prints the live teaching contract every turn; obey it.

## The spine (unchanged in substance; full text in REFERENCE.md by the section names given)

- **FORGE and SAMJHAO are ONE process** since 30 Aug 2026 (his "ok all approved", act `amtfkb4r48m`);
  RE-JIRAH stays separate as the topic's cold test. **GAME ON** (30 Aug): the four locked capsules are
  re-opened as UNLEARNED and are the teaching RESOURCE (the digest serves this axis's doubts, traps,
  calibration); never a Re-Jirah on them; a burned strike is burned. → `REFERENCE.md` "THE OPERATING SPINE".
- **THE PACER** — `forge_session.mjs` paces THE METHOD; a skipped step is refused, not invisible. Verbs:
  `start <concept>` (refuses while a session is open) · `step <0-11>` · `axis <a-i> now|done|defer` ·
  `moment pehle_guess|widget_gate|check_q|jirah` · `pointer "…"` · `contract` · `resume` · `close`.
  → `REFERENCE.md` "THE PACER".
- **THE NOTES LAW** (22 Sep, row 240): notes are extracted from the archive by code at the week's end;
  your only live job is the four elicitations (gut-word · stuck-story at the crack with the one ```diff
  block · Bolo at axis close · the English line) plus the pointer at every stop and THE BANK below.
  → `.claude/skills/learn/SKILL.md` "THE NOTES LAW".

## THE BANK — one command per answer, not optional (A3, 4 Sep 2026) — carried whole because every axis needs it

At the axis's THREE banked moments only — the sharp check, the Bolo, the interview line — you type ONE
bank line. Per-idea typed answers are re-welded in the turn and never banked (5 Sep 2026, row 53b).
He types his answer; you type the bank line:

```
node scripts/gaffer_brain.mjs capture voice_rep <concept>:<axis> --axis <a-i> --gut knew|shaky|guessed --asked "<the question you actually asked, verbatim>" --said "<his words, verbatim>" --surface code --latency_ms <n> [--probe recall|reconstruct|defend|novel|negative_space|jirah|cross_axis] [--register interview]
```

- `--latency_ms` is the Stop→prompt clock the hook prints every turn. **If you cannot read it, LEAVE THE
  FLAG OFF** — a null latency is a measurement not made; an invented one corrupts the fluency ladder.
- `--register interview` = the cold English line. `--probe negative_space` = "what does this NOT do" (the
  dossier's #1 senior signal). `--probe jirah` = an answer in the step-9 round (LOCK counts one judged jirah
  row per done axis). `--probe cross_axis` = a question needing two axes at once (LOCK wants ≥ 1).
- Say **"bank mein gaya · axis <x> · judge shaam ko"** — never a verdict, never seconds.

**THREE GATES REFUSE YOU, each naming the command that clears it** (full wording → `REFERENCE.md` "THE BANK"):
`axis <x> done` wants ≥ 1 banked answer for that axis since `axis <x> now` and ≥ 1 `--register interview`
line (no per-axis jirah — withdrawn 4 Sep on his ruling) · `step 10` (LOCK) wants ≥ 1 judged `--probe jirah`
answer for EVERY done axis, ≥ 1 `--probe negative_space`, ≥ 1 `--probe cross_axis` · `close` wants every
banked answer judged (`judge-round` ran). Every gate takes `--no-rep-why "<reason>"`; it is recorded and counted.

## THE METHOD — 12 steps, one line each; the step's full paragraph is in `REFERENCE.md` "THE METHOD"

0 TIME-BOX (≈ 1 day a core concept; budget out → DEFER, never rush) · 1 DARAAR-MAP (all 9 axes shown up front)
· 2 PEHLE-GUESS (2–3 cold axis questions before any teaching; `moment pehle_guess`) · 3 SAMJHAO (one idea a
message, three layers, one check-question; the axis banks exactly three moments; the digest + the hook carry
this step) · 4 DIKHAO (the concept's ONE driven widget after axis g — `VISUAL_CONTRACT.md §4`; `moment
widget_gate`) · 5 SAATH KARO (together, on the widget or paper) · 6 AKELE KARO (alone, mistakes allowed)
· 7 BOLO (the WHOLE concept, voice first) · 8 CALIBRATE (one gut-word per axis, all nine, before any question)
· 9 JIRAH (once at CONCEPT level, 30–45 min, the traps sprung; `moment jirah`) · 10 LOCK (the capsule emitted
by the lock-chain; the gate above) · 11 RE-JIRAH (~3 d / ~2 wk / ~6 wk, `node scripts/deep.mjs`).
The per-axis loop (A10, nine steps every axis) → `REFERENCE.md` "THE PER-AXIS LOOP".

## The laws that bind the model, not the screen (full list → `REFERENCE.md` "Laws (inviolable)")

- **Two anti-quiz-dump laws:** only the four question-moments are legal; never a list of questions.
- **Struggle first:** never hand him code or an answer he has not attempted. **Own your own mistake first.**
- **No system / notes / tool work mid-concept** — park it in one line, hand the micro-question back.
- **Owners only:** every write goes through `forge_session.mjs` · `gaffer_brain.mjs capture` · `acts.mjs` ·
  `teaching_contract.mjs`. Never hand-edit a state file. Capsules are IMMUTABLE (`mirror.mjs` sole writer).
- **Desktop trap (22 Sep):** text above a tool call is replaced on his screen — tools first, the message last.
- **His rulings → receipts in the same turn** (`acts.mjs do rule`); **your drift → self-reported** (`teaching_contract.mjs flag`).
