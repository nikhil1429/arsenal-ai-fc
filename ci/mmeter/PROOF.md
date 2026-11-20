# unit mmeter · PROOF (forks rows 1162 / 1163; spec `ci/mwit/MWIT_SPEC.md` @ 88bf69d, clauses A:day-11 + A:old-day-red)

CHECKPOINT · MERGED (forks row 1172) at 2026-11-20 · merged tip 18a9c26 (main 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90 into 8e648f5) · BASE now 5759cce (`ci/mmeter/BASE`) · resolution hunks: scripts/organism_test.mjs auto-merged clean but held TWO top-level `function witnesses` (SyntaxError at load) — ms1's member keeps `witnesses`; this unit's member renamed `clauseWitnesses`, mode `clauses`, both in MODES and the CLI line; no member of either side removed · witness on the merged tree: `GREEN MMETER strict meter exit + meter witness (day11 · oldday), RED on base and GREEN on build · 2 clause(s)`, base-as-org `RED MMETER · A:day-11, A:old-day-red` · mutants `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN` · STOPPED: resume only on the runner's word.
Merged-tree measurements (20 Nov 2026): law pack findings line identical base 5759cce vs build (both `lawpack: 1 RED`, the base's jugad-literal-subject-list 93 / baseline 90) · `done.mjs line --hermetic` orphan verbs 120 / lanes 5 on both · hermetic suite base `organism_test: 157 passed, 3 failed` vs build `organism_test: 151 passed, 1 failed` (measured 20 Nov 2026) — the build's one red is the base's coverage-orphans red; the base run's ten extra passes (LOAD ZERO ledger lanes, S7 RATCHET, RUNG A) read a gitignored brain_ledger.jsonl its own run leaked into the base worktree beside its sandbox canary (the base's sandbox red); this checkout holds no such file, so that block reads nothing in either tree's clean form — named, not claimed.
Earlier: CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from the suite member — RESUMED 2026-11-19 on his word 270; every step after it is below.

**Base:** main `fb4211870093e6b8657655eb02ebcfc425f1eab1` (`ci/mmeter/BASE`), fetched 19 Nov 2026. Branch `claude/mmeter-build`.
Every number below is a command's last line, measured 19 Nov 2026 on LF trees in the cloud (the base in a `git worktree` of
`fb42118`, the build in this checkout); `ci/mmeter/LEDGER.jsonl` holds one row per act.

## Files (BOUND: only these differ from the base)

| file | what |
|---|---|
| `scripts/daily_green.mjs` | EDIT · `exitOf(row)` + `process.exit(exitOf(out.row))`: exit 0 only at 11/11 on a study day, 3 below, 1 unreadable as before; the printed line unchanged · `export function latestByDate` · `code_sha` on every appended row (git HEAD at its root, null when git cannot say), kept OUT of the row identity · selftest asserts both ways |
| `scripts/done.mjs` | EDIT · `export function oldDayRed` (no other change) |
| `scripts/organism_test.mjs` | EDIT ONCE (row 1162 (2)) · the member `witnesses`: walks `ci/witness/<unit>/witness_*.mjs`, runs each `plants`; a witness with no plants reads red |
| `ci/witness/mmeter/witness_meter.mjs` | the clause witness (`day11` · `oldday`), its `plants`, and the unit mode (`--org --base-org`) |
| `ci/witness/mmeter/plant_day.mjs` | from `ci/mwit/plant_day.mjs`, extended to plant 11/11 (git init + bare origin, core.autocrlf=false) |
| `ci/mmeter/{BASE,LEDGER.jsonl,PROOF.md,run_mutants_mmeter.mjs}` | this proof's own |

## The witness, both ways (last line)

```
node ci/witness/mmeter/witness_meter.mjs --org . --base-org <worktree fb42118>
  A:day-11 · base RED (6 plant(s) fail: the meter CLI on a planted 5/11 study day exits 3 …) · build GREEN (11/11)
  A:old-day-red · base RED (2 plant(s) fail: the old day red, the latest row stamped by the org's own meter → 0…) · build GREEN (7/7)
  BOUND · GREEN · LAST · GREEN
GREEN MMETER strict meter exit + meter witness (day11 · oldday), RED on base and GREEN on build · 2 clause(s)      (exit 0)

node ci/witness/mmeter/witness_meter.mjs --org <worktree fb42118> --base-org <worktree fb42118>
RED MMETER · A:day-11, A:old-day-red                                                                                (exit 1)

node ci/witness/mmeter/witness_meter.mjs plants
PLANTS mmeter · 18 of 18 plant(s) as expected                                                                       (exit 0)
```

The planter alone: `plant_day.mjs 5` → base `meter exit 0`, build `meter exit 3`; `plant_day.mjs 11` → `got 11/11 · meter exit 0` on both.

**The clause witnesses on the tracked meter (the red-before the receipt organ will record — run on his tree, never here):**
`witness_meter.mjs day11` → `RED · the latest meter row 2026-11-18 reads 6/11` (exit 1) ·
`witness_meter.mjs oldday` → `UNREAD · 2026-11-13 reads red, but no later meter row carries code_sha (the stamping code has not run — F2 A)` (exit 2).
`rung_receipt.mjs red` accepts both (it refuses only exit 0, `scripts/rung_receipt.mjs:306`). This cloud records no receipt
(row 1162 (5): the receipt and the real day are his laptop's).

## Mutants

```
node ci/mmeter/run_mutants_mmeter.mjs
  M1 RED  by A:day-11 · the owner's strict exit → always 0
  M2 RED  by A:day-11 · the witness's `greens === 11` → `greens >= 5`
  M3 RED  by A:old-day-red · the old-day verdict `green === true` → `green !== false` (the null row must stay 2)
run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN
```
M2 first lived (2 of 3): the every-GREEN check already reds every honest row below 11, so `greens` was masked. A plant was
added — a row that disagrees with itself (count 10, clauses all GREEN) reads 1 — and M2 now dies by it.

## Selftests and members touched (headline, before → after)

- `node scripts/daily_green.mjs selftest` → `daily_green selftest: 75 passed, 0 failed` → `daily_green selftest: 81 passed, 0 failed` (measured 19 Nov 2026)
  (it is LIVE-named in the hermetic profile, so the suite does not run it; measured by hand both ways).
- `done.mjs` has no selftest; its suite member `WHAT IS LEFT` reads the same six `ok` lines before and after.
- the new member: `ok   CLAUSE WITNESS · ci/witness/mmeter/witness_meter.mjs plants — exit 0, every plant as expected (n > 0)`
  (no line before). Planted red: a throwaway `ci/witness/zzprobe/witness_probe.mjs` printing `0 of 0` → `FAIL` (removed).
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` →
  base `organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (exit 2) · (measured 19 Nov 2026)
  build `organism_test: 151 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` (exit 2). (measured 19 Nov 2026)
  The build's one red is the base's own `EVERY organ with a selftest is wired into a suite` (orphaned: deck_lint, home_pin,
  probe, study_scope — none of them touched here); the base's other two (`sandbox selftest`, `all 53 hermetic suite
  members`) were green in the build run — a flake of this container, named, not claimed as a fix.
- `node scripts/models.mjs check` → `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`, exit 0 (base and build).

## The law pack counts (row 1130 (2)) — `node scripts/lawpack.mjs gate`, LF trees, after `npm ci`

```
BASE  fb42118: lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD     : lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```
Every count equal. Both trees exit 1 on the SAME two base reds (`jugad-literal-subject-list ROSE — 93, baseline 90`,
`depcruise_errors ROSE — 13, baseline 7`) — present at `fb42118` before this unit, not raised by it.
`node scripts/done.mjs line --hermetic`: `orphan verbs 120` base. A first build read **121**: xray read the selftest's
`args[0] === "rev-parse"` as a CLI verb of daily_green. Removed at its cause (`args.includes("rev-parse")`), not by an
ignore: the build reads `orphan verbs 120`, `orphans lanes 5`, as the base.

## Where the spec and the ruling differ (the ruling wins)

- **F1 A + "on a study day" (row 1162 (1)):** `exitOf` also requires `study === true` and eleven GREEN clauses, not only `greens === 11`.
- **F11 (row 1162 (2)):** the spec's "every unit edits organism_test.mjs" is overruled; this unit adds ONE member that walks `ci/witness`.
- **F2 A / F5 A-then-B for A:old-day-red:** F5 A reads the 13 Nov row's own `green === false`; F2 A's honest red is the stricter
  fact that a LATER meter row carries `code_sha` (no row does at the cut → 2). F5 B "once rows carry the code sha" is read as:
  an old-day row stamped with the latest row's own `code_sha` was re-read by today's code → 2. A replay of a 13 Nov snapshot
  at its code (the spec's F5 (b)) needs a snapshot only his laptop may hold (N10) — not built; named here.
- **The old-day mutant** sits in the witness's 1-vs-2 split (`green === true` → `green !== false`), because the red verdict
  itself is read through `done.mjs`'s `oldDayRed` (one read path), where the spec's `green === false` literal lives.

## FORKS

- **FK1 · bare checkout.** A tree with no `node_modules` cannot import `done.mjs` (xray needs acorn); the member then says
  NOT MEASURABLE, as `lawpack` and `done` do. Other units' witnesses inherit this door — the architect may want it narrower.
- **FK2 · N3, the meter's callers on his laptop.** Exit 3 below 11/11 is new; nothing in this repo reads the meter's exit
  (`git grep -n daily_green` names no spawner). Whatever his Task Scheduler / conductor does with a nonzero exit is unread here.
- **FK3 · `code_sha` is HEAD, not the meter file's blob.** A dirty tree's edits are not in the stamp. Named, not widened.
- **FK4 · the plants mode contract** (`CLAUSE … GREEN|RED`, `PLANTS <unit> · k of n plant(s) as expected`) is set by this unit;
  later units must print it or their witness reads red.

## CI

Read through the public API with curl and `NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs <full sha>`, no token; rows `ci` in the ledger.

Tip `659cb71da732eaf7d5d3ac4ddea3d203de294aa6` (19 Nov 2026), read once:
```
135778636966 npm test · node 22 completed success
135778636657 npm test · node 24 completed success
ci_verdict 659cb71 GREEN — npm test · node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135778636966] | npm test · node 24: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135778636657] (3 calls)
```
The commit carrying this section adds only these lines (proof + ledger); its own runs are judged by its push.

Effort receipt (the brief's last step): `node campaign-2026-09/tools/effort_receipt.mjs --fleet mmeter --seat 00 --model claude-opus-5-5`
→ `Error: Cannot find module '…/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1); nothing written under campaign-2026-09/.
