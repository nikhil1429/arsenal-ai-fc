# PROOF — unit mpm (forks rows 956 (2) / 960 (4) / 1013 (b)) · branch claude/mpm-close-evidence

BASE = main 5767e21 (the parent of the branch's first commit 3ef4b34, the seat's effort key). Named file: `scripts/postmatch.mjs`.
PART 1 (F5) built in commit 6129c2b. PART 2 (mpast) is a spec only: `ci/mpm/MPAST_SPEC.md`. Full outputs: `ci/mpm/out/`. One
row per step: `ci/mpm/LEDGER.jsonl`.

## 1 · MEASURE FIRST (each fact at BASE)

| # | Fact | file:line at BASE |
|---|---|---|
| M1 | The close's evidence is the archive's study sessions and their captured study turns, nothing else | `scripts/postmatch.mjs:659-662` |
| M2 | No study session or no captured turn ⇒ ONE "no evidence · nothing run" line, exit 0, nothing written | `scripts/postmatch.mjs:663-666` |
| M3 | postmatch.mjs never reads the gaffer grade queue at BASE (0 hits for `gaffer_grade_queue`, `outstandingBank`, `outstandingGrades`) | `git show 5767e21:scripts/postmatch.mjs \| grep -c …` = 0 |
| M4 | The queue's outstanding captures have ONE owner reader, exported: `outstandingBank` (the whole file, through `outstandingGrades`) | `scripts/gaffer_brain.mjs:909-917`, `:1411-1414` |
| M5 | The mjday rule: a capture's day = its `ts` through the IST helper; with no instant, the day it carries; with neither, null. `captureDay` is NOT exported | `scripts/gaffer_brain.mjs:206`, `:1889-1896` |
| M6 | The judge step is `judge-due --trigger day.close`; the judge's own rule (`judgeDue`, the idle rule over the whole queue) decides | `scripts/postmatch.mjs:710-718`; `scripts/gaffer_brain.mjs:1851-1862` |
| M7 | The compile step needs a study session (`compile --date D --session <each>`) | `scripts/postmatch.mjs:693` |
| M8 | A machine record's state is parsed from its COMPILE / JUDGE / EVIDENCE lines (`turns_until` drives the idempotence) | `scripts/postmatch.mjs:467-476`, `:490-500` |
| M9 | So a day whose ONLY trace is outstanding captures on the queue is "no evidence": never closed, its judge step never fired for it | M1 + M2 + M3 |

## 2 · THE BUILD (postmatch.mjs only)

- `captureDay` — a copy of the owner's rule, its IST helper named `istDayOf` (`scripts/postmatch.mjs:639-648`); the selftest pins it
  to gaffer_brain.mjs's byte for byte (`:1158`). The rule's ONE home stays gaffer_brain.mjs: **FORK F1** below.
- `queueEvidenceOf(day, outstanding)` PURE (`:651-655`): the outstanding captures of D by their own IST day, their ids, the newest instant.
- Step (ii) (`:697-706`): when the archive shows no study turn, the queue is read through `outstandingBank()`; a day with outstanding
  captures of D closes (its evidence instant = the newest capture), a day with neither prints the BASE line unchanged.
- A queue-only day spawns no compile: `COMPILE: DONE · nothing to compile — no study session on D; …` (`:729`), names its captures on
  one EVIDENCE sub-line (`:515`, `:778`), and runs its judge step as before.
- Selftest 71 → 74 passed, 0 failed (three new checks: the pin, the rule both ways, the gate's shape).

## P1 · the witness both ways (`ci/mpm/witness_mpm.mjs`, on LF git-archive trees)

- build 6129c2b vs BASE: `GREEN MPM queue evidence closes its day · 5 clause(s)` (exit 0) — `out/P1_build.txt`
- BASE vs BASE: `RED MPM · Q1 Q3 BOUND` (exit 1) — `out/P1_base.txt` (Q2 and LAST are not fed by the build; GREEN on both sides)

## P2 · selftests, BASE | build (last lines)

| command | BASE | build |
|---|---|---|
| `postmatch.mjs selftest` | `ALL CHECKS PASSED` (71 ✓, 0 ✗) | `ALL CHECKS PASSED` (74 ✓, 0 ✗) |
| `daily_green.mjs selftest` | `daily_green selftest: 68 passed, 0 failed` | `daily_green selftest: 68 passed, 0 failed` (count unmoved) |
| `organism_test.mjs laws` | exit 2 · `…the burned strike is still being served as cold: fixture strike a?` | exit 2 · the same line |

`organism_test laws` is RED at BASE already: the SAME two UNRULED FAILs on both sides (A9 study_entry_points · LOAD ZERO BLOCK 2
coldness ratchet), neither in postmatch.mjs; the build adds none (`diff` of the FAIL lines is empty).

## P3 · mutants (`ci/mpm/run_mutants.mjs`) — `out/P3_mutants.txt`

Q1 the queue never opens a day → `RED MPM · Q1 Q3` · Q2 the no-evidence gate removed → `RED MPM · Q2` · Q3 the UTC date instead of the
IST day → `RED MPM · Q3` · BOUND a byte in scripts/daykey.mjs → `RED MPM · BOUND` · LAST the close spawns claude → `RED MPM · LAST` ·
control → `GREEN MPM queue evidence closes its day · 5 clause(s)`.

Last line: `run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN`

## P4 · `node scripts/models.mjs check` — exit 0 both sides

`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`

## P5 · lawpack · gates types · gates lint, BASE | build (no count rises)

The bare clone has no node_modules (each gate says NOT MEASURABLE HERE); `npm ci --ignore-scripts` (the pinned lockfile, gitignored
output) made them measurable, and both sides ran on it.

| command | BASE | build |
|---|---|---|
| `lawpack.mjs` | `lawpack: GREEN — no law's finding count rose, and every rule is on disk` | the same |
| `gates.mjs types` | `… 14 organ(s) @ts-check'd · undefined-symbol family 0 · other checkJs diagnostics 296 (baseline 296, may only fall)` | the same |
| `gates.mjs lint` | `gates lint · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2` | the same |

## CI (a note)

- run 44265068460 (the seat commit 3ef4b34, BASE + the effort key): `suite` **failure**
- run 44267566351 (6129c2b, this build): `suite` **failure** — the same red the seat commit had before any change of this unit
  (02a181c's landing names the suite.yml red, "npm test prints no headline line on the CI machine", as a different class).

## FORKS (any other file a fix needs)

- **F1** `scripts/gaffer_brain.mjs:1889` — export `captureDay` so postmatch.mjs imports the mjday rule instead of carrying a pinned
  copy (`scripts/postmatch.mjs:639-648`, pin `:1158`). Until then the pin turns any drift into a RED selftest.
- **F2** `.claude/skills/full-time/SKILL.md` step 3 and `scripts/postmatch.mjs:1185-1186` — unit mpast, as specified in
  `ci/mpm/MPAST_SPEC.md` (not built here by the brief).

## NOTES (named, not hidden)

- A queue-only day's JUDGE line reads whatever the judge's own rule answers. In the witness it is NOT DUE: the planted day is in
  2099 and `judgeDue` reads the REAL clock, so the newest capture's age is negative and no model is reached (by design of the plant).
- If the archive later shows study turns for a day closed on the queue alone, the newer evidence instant refreshes the record
  whole (M8), and the compile then runs; a study turn OLDER than the queue's newest capture would not refresh it. Named for the
  architect; not fed by this unit.
- The effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is absent from this repository (see FINAL MESSAGE).
