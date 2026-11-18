# PROOF — unit mpast (forks rows 956 (3) / 1015 (2)-(4)) · branch claude/mpast-full-time

BASE = main c56b0a8 (the parent of the branch's first commit 64fa640, the seat's effort key). Named files: `scripts/postmatch.mjs`,
`.claude/skills/full-time/SKILL.md` (step 3 only). The ruling: A1 + B1 with the architect's changes (1)-(3). The spec
(`ci/mpm/MPAST_SPEC.md` on `claude/mpm-close-evidence`) measured at 5767e21; every fact below is RE-MEASURED at c56b0a8.
Full outputs: `ci/mpast/out/`. One row per step: `ci/mpast/LEDGER.jsonl`.

## 1 · MEASURE FIRST (each fact at BASE c56b0a8)

| # | Fact | file:line at BASE |
|---|---|---|
| M1 | His full time keys the day off the real clock, never a named day: `const now = new Date(); const dateStr = localDate(now);` (`--date` is read by no line of main) | `scripts/postmatch.mjs:1259-1260` |
| M2 | Every write of his close uses that `dateStr`: the double-click guard, post_match, season.json, notebook | `scripts/postmatch.mjs:1267-1273`, `:1320`, `:1322`, `:1323` |
| M3 | The upgrade over a machine record (his RESULT on top, the block kept below, L9) reads only `<today>.md` | `scripts/postmatch.mjs:1265-1266`, `:1314` |
| M4 | A machine record = CLOSED-BY by code and no legal RESULT of his; `openDaysOf` counts exactly those | `scripts/postmatch.mjs:469-478`, `:590-603`; HIS_RESULT_RE `:394` |
| M5 | The kept day-close card's line is rewritten by the door to name `openDaysOf(<its key's day>, <the day closed>)` | `scripts/postmatch.mjs:607-622` (`:612`, `:616`, `:620`) |
| M6 | With NO kept card the evening `file`s `dayclose:<D>` naming D alone | `scripts/postmatch.mjs:624` |
| M7 | The card asks "your HIT/MISS and tomorrow's line, if you want (/full-time)"; the skill runs `postmatch.mjs --hit …` with no date | `scripts/postmatch.mjs:570`; `.claude/skills/full-time/SKILL.md:36` |
| M8 | The MORNING close files no card and rewrites none (row 877) — the card step is reached only on the evening path | `scripts/postmatch.mjs:793`, `:796`; pinned by the selftest `:1143-1145` |
| M9 | A hand-filed card's answer runs nothing: `na`/`haan` set `answer`, `answered_at`, `retired_at`; `baad` sets only `sleep_until` | `scripts/captains_call.mjs:1044-1056`, `:1075`, `:1118-1120` |
| M10 | KEPT = a hand-filed live card of the family (a sleeping card counts); the deck's bound is 140 | `scripts/captains_call.mjs:1546-1568`, `:1544`; `loadState` exported `:2563` |
| M11 | season.json rows are APPENDED in close order and the streak reads the tail | `scripts/postmatch.mjs:144-146`, `:163-166` |
| M12 | daily_green rung 8 reads a legal RESULT (`/^RESULT:\s*(HIT\|MISS\|PARTIAL\|LOAD-MANAGED)/m`) on `post_match/<day>.md` | `scripts/daily_green.mjs:246-255` (`:252`) |
| M13 | The KAL-line is read only from YESTERDAY's file | `scripts/manager.mjs:86`, `:317` |
| M14 | The step's clock door (honoured only for a copy under os.tmpdir()) exists for autoclose only | `scripts/postmatch.mjs:418-425`; main does not read it (M1) |
| M15 | So at BASE: when the card names past days his HIT/MISS lands on TODAY, the named past days stay open, and a morning-closed day before the evening's day with no kept card is named on no card | M1 + M4 + M6 |

## 2 · THE BUILD (line numbers at the build)

- **The absence line** (`scripts/postmatch.mjs:481-484`): `NO LINE OF HIS for this day — closed by <his full time on D | his na on
  the day-close card <id>> at <instant>, a recorded decision (never re-asked; no RESULT, no matchday)`. `parseMachineRecord` reads
  it as closed (`:491`), `autocloseDecision` answers `decided` (`:516`) and autoclose never touches the day again (`:817`).
- **`--date D` on main** (`:1421-1434`): refused BY NAME, exit 1, nothing written, for a malformed or impossible date, a future
  day, no machine record, his own closed day (with `--force` too), a day closed by a recorded decision. The guard reads `dateStr`
  = the day closed. Main reads the step's clock door (`:1402`). After his close, every OLDER day the card named gets ONE
  appended absence line (`:1501-1509`); no season row, no RESULT, no KAL for them.
- **The card's named days** (`:630-668`): the dates its line spells plus its `+k more` counted open days; the card is the KEPT one,
  else the newest answered `haan`. `postmatch.mjs named` (`:1406-1418`, read-only) prints the day his line closes, the older
  ones, and `KAL asked` only when that day is yesterday or today (`kalAsked` `:668`, also gating the TTY prompt `:1467`).
- **season.json row INSERTED BY DATE** (`:148-153`); `last_played`/`last_result` are the newest day's.
- **B1** (`dayCloseCard` `:694-720`): with no kept card, `file` as before (the call text unchanged, so mcard's pin holds), then the
  door relines that new card to name every open day since the day AFTER the newest ANSWERED card's day (`:714-718`); with none
  answered, D alone (BASE). The morning path is untouched (M8). **na**: the evening step first closes every day the newest
  answered card named when its word is `na` (`settleNaCard` `:680-691`, called `:699`); `baad` is no answer and closes nothing.
- **Skill step 3** reads `postmatch.mjs named` before the ask and passes `--date <that day>`.
- Selftest 74 → 82 passed, 0 failed (eight new checks).

## P1 · the witness both ways (`ci/mpast/witness_mpast.mjs`, on LF git-archive trees)

- build vs BASE: `GREEN MPAST his full time closes the newest named day · 13 clause(s)` (exit 0) — `out/P1_build.txt`
- BASE vs BASE: `RED MPAST · MP1 MP4 MP6 MP3 MP2 MP5 MP7 MB2 MB4 BOUND` (exit 1) — `out/P1_base.txt`. MB1 (row 877 stands), MB3 (the
  kept reline path unchanged) and LAST are not fed by the build: GREEN on both sides by design.

## P2 · selftests, BASE | build (last lines)

| command | BASE | build |
|---|---|---|
| `postmatch.mjs selftest` | `ALL CHECKS PASSED` (74 ✓, 0 ✗) | `ALL CHECKS PASSED` (82 ✓, 0 ✗) |
| `daily_green.mjs selftest` | `daily_green selftest: 68 passed, 0 failed` | the same (count unmoved) |
| `organism_test.mjs laws` | exit 2 · `the burned strike is still being served as cold: fixture strike a?` | exit 2 · the same line |

`organism_test laws` is RED at BASE already: the SAME two UNRULED FAILs on both sides (A9 study_entry_points · LOAD ZERO BLOCK 2
coldness ratchet), neither in a named file; the `diff` of the FAIL lines is empty. The SKILL file has no selftest.
`organism_test laws` and `lawpack` need a git work tree: run on scratch trees made local repos (`git init`, one commit).

## P3 · mutants (`ci/mpast/run_mutants.mjs`) — `out/P3_mutants.txt`

One per clause, each RED by its own name: MP1 the machine block dropped · MP2 the absence line not read as closed · MP3 a future
day not refused (its machine record planted, so no other rule refuses it) · MP4 the absence line carries a RESULT · MP5 rows
appended in close order · MP6 KAL asked for every day · MP7 na closes nothing · MB1 the morning reaches the card step · MB2 the B1
window shut · MB3 the kept reline window moved · MB4 the uncounted overflow dropped · BOUND a byte in scripts/daykey.mjs · LAST
his full time spawns claude. Control GREEN.

Last line: `run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN`

## P4 · `node scripts/models.mjs check` — exit 0 both sides

`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`

## P5 · lawpack · gates types · gates lint, BASE | build (no count rises)

The clone has no node_modules; `npm ci --ignore-scripts` (the pinned lockfile) in the BASE scratch tree, linked into the build's.

| command | BASE | build |
|---|---|---|
| `lawpack.mjs` | `lawpack: GREEN — no law's finding count rose, and every rule is on disk` | the same |
| `gates.mjs types` | `… 14 organ(s) @ts-check'd · undefined-symbol family 0 · other checkJs diagnostics 296 (baseline 296, may only fall)` | the same |
| `gates.mjs lint` | `gates lint · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2` | the same |

## CI (a note)

- run 44270129069 (the seat commit 64fa640, BASE + the effort key): `suite` **failure**
- run 44271353186 (749b3d7, the build): `suite` **failure** — the same red the seat commit had before any change of this unit
  (02a181c's landing names the suite.yml red as a different class).

## FORKS (any other file a fix needs)

- **F1** `scripts/captains_call.mjs:1044-1120` — `applyAnswer` runs nothing for a hand-filed card, so a `na` closes its days only at
  the NEXT evening close (`settleNaCard`); until then `openDaysOf` still counts them open. Closing them at the answer would need a
  dispatch kind on the day-close card (captains_call's file), not built here.
- **F2** `scripts/captains_call.mjs:1546-1568` — `wordIsOn`/the answered-card rule is not exported; postmatch re-reads "answered"
  as `source hand-filed ∧ answer` (`scripts/postmatch.mjs:648-658`). An export would give the rule one home.
- **F3** `scripts/gaffer_brain.mjs:1889` — mpm's F1 (export `captureDay`) still stands; untouched here.

## NOTES (named, not hidden)

- **haan without a full time.** A `haan` on the card records his word and runs nothing (M9). If no /full-time follows, the days it
  named stay open, and B1's window (from the day AFTER that card's day) names them again from its day + 1 on. Named for the
  architect; the skill's step 3 makes the haan path run the close.
- **No answered card ever.** B1's no-kept window then is D alone (BASE's line) — the ruling names the window from the newest
  ANSWERED card and says nothing for none; reading the whole post_match directory back to its first day was not built.
- **`+k more` days** are counted from the line's last spelled day up to the answer's IST day (na) or today (kept).
- The effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is absent from this repository (see FINAL MESSAGE).

## LANDING ITEMS

- `scripts/postmatch.mjs` · `.claude/skills/full-time/SKILL.md` (never `.claude/settings.json`; `ci/mpast/**` is the record).
