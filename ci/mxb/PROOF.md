# MXB PROOF — the six Q6 blindnesses (B1-B6), one IR family in `scripts/xray.mjs` (BUILD seat)

Unit mxb · forks row 1161 (1)-(5) · **build seat, cloud, written 2026-11-19 (UTC)** · branch `claude/mxb-build`.
Spec: `ci/mxb/MXB_SPEC.md` on `claude/mxb-spec` at **4d329ff** (read whole, with its ledger, `BASE`, and the four
sibling files under `ci/mxb/witness/`). Every act is a row in `ci/mxb/LEDGER.jsonl` (ts, act, cmd, last_line).
Every count below sits in a fenced block (a command's output) or a dated line, measured 2026-11-19 by the command named
beside it. The IR is built from CODE ONLY; no state file's content is read, printed or committed.

## 0 · The base

- Cut from `origin/main` **fb4211870093e6b8657655eb02ebcfc425f1eab1** (`ci/mxb/BASE`) by
  `git fetch origin main; git checkout -b claude/mxb-build FETCH_HEAD` — main was exactly fb42118 at the cut, the spec's
  base, so **no difference in xray.mjs** is owed (main did not move past fb42118).
- `git hash-object scripts/xray.mjs` at the base: `47b9de0`. The spec patch `ci/mxb/witness/xray_mxb.patch` applied clean
  (`git apply --check`, then `git apply`): blob **70d45c4** — the candidate the architect applied on his LF clone.
- The build's blob is **157a8f0** = 70d45c4 + two acts the ruling text adds (§1). `acorn` came from `npm ci --ignore-scripts`.

## 1 · What the build is (scripts/xray.mjs alone), and where it differs from the spec

| act | where (build file:line) | ruling |
|---|---|---|
| the five rules + G-FIX, byte-for-byte the spec patch | `FIX_CTX` :117 · `ObjectExpression` :289 · `calleeValue` :363 · `bindParams` :377 · `applyFn` :406 · R-FD `writeSync→WRITE(fd)` :618 · G-FIX `fixSite` :668 · `fixtureOnly` :1044 | row 1161 (1) F-SET A; (3) F-AGREE A (agreement), F-RETL A (locals masked), F-CTX A (E7 left), F-E1 A (E1 left) |
| **DIFFERENCE 1** — the verbs query's own ctx skip derives from `FIX_CTX` | :1326 (base :1191 carried its own `…\|probe` regex) | row 1161 (2) F-CTX0 A: *probe leaves the fixture words*. The spec candidate dropped it only from `fixtureOnly`; the build derives the one remaining copy from its one owner. Measured: `node scripts/xray.mjs verbs` byte-identical before/after (`cmp`, ledger `ctx0-verbs`) — no row moves |
| **DIFFERENCE 2** — the three NUL asserts re-stated to what main holds | selftest :1422-1431, header :26-27 | row 1161 (4) F-SELFTEST (§4) |

## 2 · The query counts, base → build (repo layout, TRACKED state names only, 2026-11-19)

```
node <scratch>/m.mjs .       # build() + queries() of the tree's own scripts/xray.mjs (base = git show fb42118:scripts/xray.mjs)
base : unresolved 2040 · files 419 · Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7
build: unresolved 2006 · files 432 · Q1 11 · Q2 1 · Q3 6 · Q4 0 · Q5 0 · Q6 1
row diff (sorted rows, diff base build) — equal to the spec's §3:
Q1 - brain_outcomes.jsonl · models.json · sitting_reviews.jsonl · team_sheet.md     Q1 + gemini_quality.jsonl.quarantine.jsonl (E1, F-E1 A: left)
Q3 + manager_notes.json W=manager.mjs (E2)                                          Q4 - rails_blind.jsonl · sitting_config.json · teaching_gate.jsonl
Q6 - B1-B6 (models.json · sitting.json · brain_outcomes.jsonl · manager_notes.json · rails_blind.jsonl · teaching_gate.jsonl); D1 usage_reading.json stays
Q2 the same one row (thalamus_config.json <gate_tune.mjs+thalamus.mjs, already on main) · Q5 0 -> 0
```

## 3 · The witness, both ways (`ci/mxb/witness_mxb.mjs --org <dir> --base-org <dir>`)

Header = contract. Plants by `ci/mxb/plant_mxb.mjs` (copies under one `os.tmpdir()` root, no `.git`, no `ci/`, an EMPTY
`dressing-room/state`, `node_modules` one link — a junction on Windows); every tree judged on an **LF leg and a CRLF leg**
(every `scripts/**/*.mjs` rewritten to CRLF), a clause GREEN only when both legs are. Children by `spawnSync` (each wait
bounded by the child's exit; nothing typed). No port, no service, no daemon, no POST, no git repo planted, no model.
The base tree: `node ci/mxb/plant_mxb.mjs base --repo . --sha fb42118` (its xray blob 47b9de0).

```
# 2026-11-19 — on BASE (--org <base plant> --base-org <base plant>)
RED MXB · W1 W2 W3 W4 W5 W6 W7 W11                     (exit 1; W8 W9 W10 BOUND LAST GREEN — guards, by design)
# 2026-11-19 — on the BUILD (--org . --base-org <base plant>)
GREEN MXB the six Q6 blindnesses resolved by the five rules + the guard, no writer invented, the NUL asserts state main, LF and CRLF · 13 clause(s)   (exit 0)
```

Clauses: W1-W6 (B1-B6: the declared sole writer is the IR's one writer) · W7 (Q6 = D1 only) · W8 GUARD (Q2 = base, Q5 0,
every added writer edge onto an unshared file: 15 added, 0 shared) · W9 GUARD (no organ's unresolved sites rise:
2040 → 2006) · W10 GUARD (P10, a selftest's object value binds no production parameter) · W11 (xray's three NUL asserts
read ok) · BOUND (only `scripts/xray.mjs` differs from the base) · LAST (no node process naming the temp root).

## 4 · F-SELFTEST — the three NUL asserts (row 1161 (4))

Read at the base: `xray.mjs:1291` asserted `raw.includes(0)` ("really does contain NUL bytes (the trap is still live)")
for calibration · dmn · rejirah. Main holds no raw NUL byte in any of them (`tr -cd '\000' | wc -c` → 0 each) and holds the
join as the six-character escape `\u0000` (calibration.mjs:397, :434 · dmn.mjs:265 · rejirah.mjs:722). Why: forks row 616
(12 Oct 2026) turned the raw bytes into the escape and made the law `raw-nul-in-source` (`lawpack.mjs:127`, frozen 0).
**Re-stated, each:** `<f> holds its NUL join as the \u0000 escape, and no raw NUL byte (the grep trap stays closed)` —
raw NUL bytes 0 AND escapes > 0. Mutants: M11 (the old `raw.includes(0)` back) and M12/M13/M14 (a raw NUL byte planted
into calibration / dmn / rejirah, one each) — each RED by W11 (§5).

```
# 2026-11-19 — node scripts/xray.mjs selftest (the repo; headline before → after)
base : xray: 19 passed, 4 failed   (the three NUL asserts + the per-organ ratchet)
build: xray: 22 passed, 1 failed   (the ratchet alone: total 1475 → 2006 against the tracked xray_graph.json)
```

The ratchet is NOT this seat's: its baseline is the tracked `xray_graph.json` (owner `xray.mjs:4`, `node scripts/xray.mjs
build`), re-frozen by the runner at the landing through the owner (row 1161 (4)). The suite member line, before and after:
`LIVE selftest xray — not run in the hermetic profile: reads state/xray_graph.json` (unchanged; LIVE, named not run).

## 5 · The mutants (`ci/mxb/run_mutants_mxb.mjs --org . --base-org <base plant>`)

The whole run (2026-11-19, after the resume; the partial run before the STOP is in the ledger). One mutant per clause, plus
three tree mutants for W11 (a raw NUL byte back in each file) and one for BOUND. An anchor not found is UNAPPLIED (none).

```
# 2026-11-19 — node ci/mxb/run_mutants_mxb.mjs --org . --base-org <base plant>  (8m05s wall)
control: GREEN MXB the six Q6 blindnesses resolved by the five rules + the guard, no writer invented, the NUL asserts state main, LF and CRLF · 13 clause(s) (exit 0)
M1 RED by W1 · red=[W1,W7] · an object value no longer binds an ObjectPattern parameter (finishProbe's `{ path }`)
M2 RED by W2 · red=[W2,W7] · an object literal's arrow property is no longer a function value (`F.sitting`)
M3 RED by W3 · red=[W3,W7] · an object value no longer flattens into a plain parameter (`deps.outPath`)
M4 RED by W4 · red=[W3,W4,W7] · a closure returned by a call is not kept in scope (`const P = mkP(dir)`)
M5 RED by W5 · red=[W5,W7] · writeSync on an openSync descriptor is not a write (the sink class without the fd rule)
M6 RED by W6 · red=[W2,W4,W6,W7] · an expression-bodied function's return value is not evaluated (`GATE_LOG(dir)`)
M7 RED by W7 · red=[W1,W7] · `probe` is a test word again (finishProbe's write is a fixture, B1 stays in Q6) — F-CTX0 reversed
M8 RED by W8 · red=[W8] · openSync is a WRITE whatever its flag (the naive sink-class fix for B5: a read-open becomes a writer)
M9 RED by W9 · red=[W9] · a writeSync on a descriptor the IR cannot follow is counted as an unresolved site
M10 RED by W10 · red=[W10] · an object value built at a TEST call site binds a production parameter (G-FIX off)
M11 RED by W11 · red=[W11] · the NUL asserts state the dead trap again (`raw.includes(0)`, red on main since forks row 616)
M12 RED by W11 · red=[W11,BOUND] · a raw NUL byte comes back into calibration.mjs (the grep trap re-opened)
M13 RED by W11 · red=[W11,BOUND] · a raw NUL byte comes back into dmn.mjs (the grep trap re-opened)
M14 RED by W11 · red=[W11,BOUND] · a raw NUL byte comes back into rejirah.mjs (the grep trap re-opened)
M15 RED by BOUND · red=[BOUND] · a file beyond the named one differs from the base (one comment line in state.mjs)
LAST: 0 node process(es) naming the temp root survive · the temp root removed
run_mutants: 15 of 15 mutant(s) RED by the clause that names them · control GREEN
```

## 6 · F-CONSUMERS B — the done verdict, before and after, in this seat's trees (2026-11-19)

```
# cd <base plant> && node scripts/done.mjs --hermetic        (fb42118; empty state dir — the hermetic form reads no state file)
DONE · orphans lanes 5 · orphan verbs 120 · rungs UNREAD · rules laws 8/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
# cd <build plant> && node scripts/done.mjs --hermetic
DONE · orphans lanes 6 · orphan verbs 120 · rungs UNREAD · rules laws 8/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
# Q3 + orphanVerbs lists (xray build/queries/verbGraph, what done prints), diff base build:
> LANE dressing-room/state/manager_notes.json        (E2 — the one new lane; the orphan-verb list is identical)
```

Owed at adoption, on his laptop (named, not guessed): `node scripts/done.mjs` (reach reads the live registry) and the
on-disk Q1/Q4 rows (`node scripts/xray.mjs q`) before and after — this clone's state dir holds only tracked files.

## 7 · The suite, the law pack, LAW M (base → build)

```
# 2026-11-19 — base (repo at fb42118): ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
# 2026-11-19 — build (this branch): the same command
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
# 2026-11-19 — node scripts/lawpack.mjs report, base and build: every count identical
lawpack · 1933 raw match(es) over 8/8 rules · jugad-literal-subject-list 93 (frozen 90) · bare-catch 37 · receipt-testimony-read 5 · import-time-registry-read 2 · raw-nul-in-source 0 · depcruise_errors 13 (frozen 7)
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)
# 2026-11-19 — node scripts/models.mjs check, base and build: exit 0 both
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
```

## 8 · The neutral machine (public API, no token)

```
# 2026-11-19 — GET https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs
aa2b565  run 44524409775  completed / cancelled (superseded by the next push)
b2a17f7  run 44524616430  completed / cancelled (superseded by the next push)
054e73e  run 44525043077  completed / cancelled (superseded)
fe8ec51  run 44525466563  completed / cancelled (superseded)
8bbfcad  run 44525766483  npm test · node 22 SUCCESS · npm test · node 24 SUCCESS   (the checkpoint tip)
ca078c9  run 44585341542  in progress at the read
```
`node scripts/ci_verdict.mjs <full sha>` answered `UNREADABLE — … check-runs … answered 403` from this container (node's
fetch through the cloud proxy), while `curl` on the same URL answered 200 — so the legs are read with curl, no token.
The final tip's legs: §11.

## 9 · FORKS (each one line; nothing beyond the named files was edited)

- **F-E2** · `manager_notes.json` (Q3 + one done lane): a run log with no reader by the code — row 1161 rules F-AGREE, F-RETL, F-CTX, F-E1, not F-E2; whether a run log needs a reader (or a query exclusion) is the architect's.
- **F-Q2** · `thalamus_config.json` two writers (gate_tune.mjs, thalamus.mjs) stands on base and build alike; not this unit's.
- **F-RATCHET** · the per-organ ratchet stays RED (1475 baseline) until the runner re-emits `xray_graph.json` through its owner at the landing.
- **F-STALE-WORDS** · xray.mjs's second NUL assert ("where grep sees Binary file … matches") and the comments at :980 and :1064 still speak of raw NUL organs; beyond the three asserts row 1161 (4) names, so left — a later word-only fix.
- **F-LAWPACK** · lawpack 2 RED (jugad 93 vs frozen 90 · depcruise 13 vs frozen 7) on base and build identically — pre-existing (mxh F-C); this build raises no count.
- **F-SUITE** · the one UNRULED suite row (selftest-coverage law: deck_lint, home_pin, probe, study_scope orphaned) on base and build alike — pre-existing.
- **F-WIN** · the witness's CRLF leg is a planted CRLF copy on Linux; its run on his Windows checkout (junction link, PowerShell process table) is the architect's re-run.
- **F-RECEIPT** · `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (§10); nothing written under campaign-2026-09/.

## 10 · Peer/architect messages received

- STOP (his word #269, 2026-11-19 18:06 IST, via the usage-limits session): checkpoint pushed at 8bbfcad (CHECKPOINT · STOPPED at 2026-11-19T12:38Z).
- RESUME (his word #270, 2026-11-19 23:38 IST): resumed from 8bbfcad's CHECKPOINT line; the line is retired here, kept in the ledger.

## 11 · The final tip

The commit that carries this section is the proof tip; its sha and both neutral legs (`npm test · node 22`,
`npm test · node 24`) are the last row of `ci/mxb/LEDGER.jsonl`, written by the one commit after it (ledger only).
