# MDAYQ PROOF — two cold questions at his day end, banked, then the close (unit mdayq, forks rows 1241 / 1242 / 1257 / 1269)

Cloud build seat, 21 Nov 2026. Branch `claude/mdayq-build`. Built, witnessed both ways, mutants run. Not a landing: no PR,
no merge, nothing moved on main. No live model call anywhere (every model spawn a plant drew was a refusing shim's).

## 1 · THE BASE (row 1269 (1) / (2): PROVISIONAL)

- Cut from the mbank BUILD tip `f635d68b1bce300b58aa031ed49278b8bbe3e5a8` (`ci/mdayq/BASE`). Measured 21 Nov 2026:
  `git rev-parse origin/claude/mbank-build` → `f635d68b1bce300b58aa031ed49278b8bbe3e5a8` — the branch had NOT moved past it.
- mbank is adopted at that tip provisionally until its two legs read green; it is not on main. A re-cut mbank tip or a main
  that carries mbank, when a message names it, is merged here (a merge commit), the unit witness re-run at the merge, and
  named in this file.
- The spec (`ci/mdayq/MDAYQ_SPEC.md` on `claude/mdayq-spec` @ `d9ee129`, read whole) cites lines at its own base `7bf008b`.
  Re-measured at the cut by `grep -n` before any edit (§6).

## 2 · WHAT IS BUILT (the ruling, row 1257)

| fork | ruled | built at |
|---|---|---|
| F1 A | step 0 prints the day's material by code; the teacher composes both questions from it; a capsule may inform, never be the source | `scripts/day.mjs` `dayqAsk` (the DAYQ block: concept, axes declared on D by letter and name, moment kinds of D, banked k of 2, the next probe) |
| F2 A | a teaching turn is a pacer ledger entry of that day | `scripts/forge_session.mjs` `dayCloseDue` (an `axes_now_history` or `moments_log` entry stamped on IST day D) |
| F3 B | the day-close row is excluded from the axis-done gate AND from the LOCK's negative-space count | `axisDoneGate` `mine` filter · `lockGate` negative-space line, both `r.moment !== DAY_CLOSE`; the row field `moment` written by `gaffer_brain.mjs gradeCapture` |
| F4 A | step 0 inside the end | `scripts/day.mjs end`: after the scope guard and the already-closed read, before the pointer; due and no `--dayq` → the DAYQ block, nothing written, exit 0 |
| F5 split | built on mbank, not waiting for mjset; the pair waits in the judge queue like any capture | no judge path added; W9 shows the close fires the judge by its own code on the two rows |
| F6 A | the runner counts (owed, §9) | nothing built |
| F7 A, B fallback | the last axis declared on D; none declared on D → not due | `dayCloseDue` |
| F8 A | one question a turn | the DAYQ block asks for ONE question this turn, Q1 recall then Q2 negative_space |
| F9 | goes to mcrk2 | `crackRow` untouched |
| F10 A + W13/W14 | no session id refuses; one re-ask; then the close runs with the line answer not banked, no card, nothing red on him | **BRANCH read at the cut (below)**: only the no-session refusal is built (`gradeCapture` reason `no-session`), and `day.mjs end --dayq lost` is the close after a refused answer |

**THE BRANCH OF ROW 1257 AT THIS BUILD.** The mbank per-session record IS at the cut: `git log --oneline f635d68 | grep d6cc229`
→ `d6cc229 unit mbank (forks row 1246): the prompt record kept PER SESSION by its owner teaching_audit.mjs …`, and the landed
mbank witness at the cut reads its parallel clause green (`ci/mbank/witness_mbank.mjs --org <cut>` → line `B15` GREEN; last
line in §4). So W13 is UNREACHABLE by plant (another session's prompt cannot reach this session's own record), the re-ask path
is NOT written, and only the no-session refusal (W14) is. Difference from the spec's F10 text, named: the spec's
`--dayq lost` close is kept as the one way the close runs after the door refuses an answer — the ruling's "then the close
runs with the line answer not banked, no card, nothing red on him" — with no re-ask before it.

The skill lines (`.claude/skills/learn/SKILL.md` step 5, `.claude/skills/forge/SKILL.md` THE BANK): one sentence each.

## 3 · THE WITNESS, BOTH WAYS (21 Nov 2026)

Unit witness `ci/mdayq/witness_mdayq.mjs` over the clause witness `ci/witness/mdayq/witness_dayq.mjs`; the trees are git
worktrees of the cut and the tip (core.autocrlf=false), node_modules from `npm ci --ignore-scripts`.

```
node ci/mdayq/witness_mdayq.mjs --org <tip> --base-org <cut>   → GREEN MDAYQ the day end asks the two day-close questions by code before it closes, the bank keeps them as moment day_close rows that pay neither the axis-done gate nor the LOCK's negative-space count, and the close judges them · 14 clause(s)   (exit 0)
node ci/mdayq/witness_mdayq.mjs --org <cut> --base-org <cut>   → RED MDAYQ · W1, W2, W3, W4, W5, W5L, W7, W8, W9, W10, W14   (exit 1)
node ci/witness/mdayq/witness_dayq.mjs plants --tree <tip>     → PLANTS mdayq · 11 of 11 plant(s) as expected
node ci/witness/mdayq/witness_dayq.mjs plants --tree <cut>     → PLANTS mdayq · 0 of 11 plant(s) as expected
```

Clauses: W1 KIND · W2 FENCE · W3 DUE · W4 ROW · W5 AXIS · W5L LOCK · W7 SKIP · W8 ORDER · W9 ANSWERED · W10 LEFT · W14 NOSESS
(each GREEN on the tip and RED on the cut), seat W11 (org only), BOUND (only the named files differ), LAST (no survivor).
Differences from the spec's §7 table, named:
- **W6** (no per-idea bank) is green at the base on its own — a pass-through. It is carried INSIDE W3 (per-idea moments
  never due, never in BANKED_MOMENTS), and its mutant M6 turns W3 red.
- **W11** (no live call) cannot be red at the base either; it is a SEAT clause judged on `--org` only, like BOUND and LAST:
  the plants put a refusing `claude` / `gemini` shim first on PATH that writes one line per spawn and no argument, and the
  clause names the count (the close's judge in W9 reaches it, and fails, by design). The spec's M11 ("call the real judge")
  would be a live model call: not built.
- **W12** (no regression) is a measurement, not a clause (it is green on both sides by definition): §4.
- **W13** is unreachable at this base (§2, the BRANCH).
- **W5L** is the spec's W5' (the LOCK half of F3 B).
- **W2**: the skeleton's `[EK CHECK]` line keeps its five kinds; the fence is asserted as "gate kinds minus day_close,
  exactly" — FORK mdayq-1.

## 4 · MUTANTS AND MEMBERS (21 Nov 2026)

```
node ci/mdayq/run_mutants_mdayq.mjs --org <tip> --base-org <cut>   → run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN
```
M1 MOMENTS → W1 · M2 the gate's fence drops it → W2 · M3 BANKED_MOMENTS drops it → W3 · M6 check_q banked → W3 · M4 absent
moment defaults to day_close → W4 · M5 axis-gate exclusion removed → W5 · M5L LOCK exclusion removed → W5L · M7 deferred counted
as a close → W7 · M8 step 0 does not stop the close → W8 · M9 the bank read skipped → W9 · M10 a card filed on `left` → W10 ·
M14 a null session id let through → W14.

Each touched selftest or member, cut → tip, by its headline line (21 Nov 2026, cloud, both trees):

| command | at the cut `f635d68` | at the tip |
|---|---|---|
| 21 Nov 2026 · `node scripts/forge_session.mjs selftest` | `forge_session selftest: 244 passed, 0 failed` | `forge_session selftest: 248 passed, 0 failed` |
| `node scripts/day.mjs selftest` | the usage line, exit 2 (day.mjs has no selftest verb at the cut) | the usage line (now naming `[--dayq left\|lost]`), exit 2 — unchanged in kind |
| 21 Nov 2026 · `node scripts/teaching_gate.mjs selftest` | `teaching_gate selftest: 130 passed, 0 failed` | `teaching_gate selftest: 130 passed, 0 failed` (the FENCE assert re-worded, FORK mdayq-1) |
| 21 Nov 2026 · `node scripts/study_scope.mjs selftest` | `study_scope selftest: 61 passed, 0 failed` | `study_scope selftest: 62 passed, 0 failed` |
| 21 Nov 2026 · `node scripts/gaffer_brain.mjs selftest` | `gaffer_brain selftest: 198 passed, 0 failed` | `gaffer_brain selftest: 198 passed, 0 failed` |
| `node scripts/learn_digest.mjs selftest` | `learn_digest selftest 16/16 — all clauses hold` | the same |
| 21 Nov 2026 · `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | `organism_test: 167 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` | `organism_test: 168 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` — the one new member is `CLAUSE WITNESS · ci/witness/mdayq/witness_dayq.mjs plants — exit 0`, ok |
| `node ci/mbank/witness_mbank.mjs --org <tree>` (the landed mbank witness, no base leg) | `GREEN MBANK the code-surface bank keeps HIS bytes … · 21 clause(s)` (B15 GREEN) | the same, `· 21 clause(s)`, exit 0 |
| `node ci/mday/witness_mday.mjs --org <tree>` (no base leg: its BOUND is RED on both for want of `--base-org`) | `RED MDAY · BOUND` — every other clause GREEN | `RED MDAY · BOUND` — the same clause lines, identical to the cut's (diffed) |
| `node scripts/models.mjs check` | exit 0 | exit 0 · `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)` |

## 5 · FORKS (each a choice for the architect; nothing beyond the named files was edited)

- **mdayq-1 · the skeleton's moment list.** `scripts/teaching_bar.mjs:350` (`[EK CHECK] … moment check_q|pehle_guess|widget_gate|jirah|sharp_check`)
  is beyond the named files. The gate's FENCE assert (`teaching_gate.mjs` selftest) compared it EQUAL to MOMENT_KINDS, so
  adding `day_close` to the gate alone turns it red. Built: the assert names `day_close` as the ONE kind the skeleton does not
  print (it is asked by code at `day.mjs end`, never as a mid-lesson check) and keeps the list exact otherwise. (a) as built ·
  (b) teaching_bar prints `day_close` too and the fence returns to full equality (a teaching_bar edit). Spec W2 assumed (b).
- **mdayq-2 · the forge skill's verb list.** `.claude/skills/forge/SKILL.md:31` still lists five moment kinds; the brief
  allows the two skill lines only, so `day_close` is named in THE BANK line instead. (a) leave · (b) add it to :31.
- **mdayq-3 · F7's "declared on D".** Read strictly as an `axis <x> now` stamped on D. A day where he works an axis
  declared on an earlier day and never re-declares it reads not due (F7 B), though its `moments_log` carries that axis.
  (a) as built · (b) an axis-bearing `moments_log` entry on D also counts as declared.
- **mdayq-4 · `moment day_close` on a day whose forge session is closed or stale.** The pacer's `moment` verb runs
  `live(need(load()))`: it refuses with no open, live session. Step 0 still prints the ask (the day was taught); the
  model then cannot declare the moment and the gate's B.moment would read the question undeclared. Not measured on his
  laptop. (a) leave (the close after `--dayq lost`) · (b) `day_close` bypasses `live()`.
- **mdayq-5 · step 0's import graph.** `day.mjs end` imports `forge_session.mjs` and `gaffer_brain.mjs` dynamically, only
  inside `end` (never on the hook path: `start` and `brief` do not load them). `gaffer_brain.mjs` loads `models.mjs` at
  import (no call). mday's W2.5 static check reads day.mjs's own source and stays green. (a) as built · (b) a leaf
  reader of the bank rows.
- **mdayq-6 · a step-0 read that fails** → the close runs as before and its line says `day-close: not due (the day-close
  read failed …)`: his day end is never blocked by this read. (a) as built · (b) refuse the close.
- **Beyond the files, named by the spec and not edited:** `scripts/daily_green.mjs` (F6 b — not ruled), `scripts/learn_digest.mjs`
  (its moments line is derived from MOMENTS and now prints six), `scripts/teaching_bar.mjs` (mdayq-1; `bankDueAt` read as is).

## 6 · THE SPEC'S LINES, RE-MEASURED AT THE CUT (spec base `7bf008b` → cut `f635d68`, `grep -n`)

`forge_session.mjs` MOMENTS :148 → :149 · axisDoneGate :782-797 → :788 (filter in it) · lockGate negative space :872 → :878 ·
the `MOMENTS.length === 5` assert :1715-1716 → :1722 · usage line :3319 → :3339. `study_scope.mjs` GUT_BEARING_MOMENTS :231 →
:283 · BANKED_MOMENTS :266 → :318 · bankDueAt :267 → :319. `teaching_gate.mjs` B.moment / B.moment-kind :145-146 and
MOMENT_KINDS :391 unchanged. `gaffer_brain.mjs` gradeCapture :1327 → :1365 · the row's register field → :1434 · the CLI
capture call → :2759. `day.mjs` end :127 unchanged, its step list :135. `learn/SKILL.md` step 5's end line :45 → :46.
`forge/SKILL.md` THE BANK :41 → :42.

## 7 · NO LIVE MODEL CALL · THE PORT CLASS

No clause reaches `claude -p`, an API key or the network: the shim refuses every spawn and the API key is deleted from every
child's env. No fixed port is bound: a full plant takes an ephemeral port (bound to 127.0.0.1:0 and released) and hands it to
the sitting through its env door `ARSENAL_SITTING_PORT`; nothing listens on it, so the sitting's local door runs. Nothing is
POSTed, nothing restarts. Every plant's state is written under `os.tmpdir()` by node; no `dressing-room/state` path of the
repository was opened or written.

## 8 · CANON-COUNT LAW (row 1169)

Replayed over the COMMIT blobs (`git show <sha>:<path>` for every tracked .md) before the push: the ledger row
`canon-count replay` names its last line.

## 9 · OWED BY THE RUNNER (his laptop only — never guessed here)

- The registry row `probe_kinds` holds `recall` and `negative_space` on his laptop (spec §9; the plants seed it through the
  registry's own `set` verb): `node -e "import('./scripts/gaffer_brain.mjs').then(m=>console.log([...m.PROBE_KINDS].join(' ')))"`.
- F2: any day of his history with teaching turns and no pacer entry (study-scoped `teaching_audit.jsonl` rows vs
  `moments_log` / `axes_now_history`, IST days).
- F6: the study days since 13 Nov whose meter reads red with nothing banked; then the meter owner's one small unit.
- Whether the close's ONE judge settles the two day-close rows on his machine before mjset lands (mjset §9).
- How often he ends a day by leaving (`--dayq left` lines in `sitting_reviews.jsonl` closes), once live.

## 10 · CI

Each checkpoint push is judged by the neutral machine; the check runs of the pushed sha are read through the public API and
named in `ci/mdayq/LEDGER.jsonl`.
