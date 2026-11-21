# UNIT mclk · PROOF (forks row 1214 (3) + (4)) — branch claude/mclk-build

A build, no spec. Measured 21 Nov 2026 (IST) in a cloud build seat; every line below names the command that produces it.

## Base
- Cut from main `56ed4ffaa304a4b303245cbedab4db025e02a3f0` (`git fetch origin main`, `git checkout -b claude/mclk-build FETCH_HEAD`), written to `ci/mclk/BASE`.

## The cause, re-measured at the cut (21 Nov 2026)
- `ci/witness/mmeter/plant_day.mjs:48-50` at 56ed4ff: `const now = new Date()`; the day is its IST date; every row stamped `now − m min` (m = 1..5).
- The meter reads the clock only through `new Date()` / `Date.now()` (`scripts/daily_green.mjs:404` `witness({ now = new Date() })`, `:104` `todayIst`; `scripts/state.mjs:62,69` facts default `now = new Date()`); it has no clock flag and no env var.
- `witness_meter.mjs plants` under a Date preload handed to every node child: 23:58 IST → `PLANTS mmeter · 18 of 18`; 00:02 IST → `15 of 18` (the 11/11 day reads 9/11, clause A:day-11 RED); 00:07 IST → `18 of 18`. Row 1214's numbers, reproduced.

## The fix (named files only)
- `ci/witness/mmeter/plant_day.mjs`: `plantedInstant(now)` reads the clock ONCE; D = its IST day; T = that read moved forward to D 00:06 IST when earlier, so every stamp `T − m min` lies inside D. T is HANDED to the meter child by a Date preload written into the temp root (`mclk_clock.mjs`) and appended to that child's `NODE_OPTIONS` as `--import=<file URL>` — never a second read of now. No organ edited.
- `ci/witness/mmeter/witness_meter.mjs`: not edited (it calls `plantDay` with the default one read).

## The unit witness, both ways (21 Nov 2026) — `node ci/mclk/witness_mclk.mjs --org <tree> --base-org <tree>`
- head tree vs base tree 56ed4ff: `GREEN MCLK the mmeter plants 18 of 18 at AFTER · 18 of 18 at BEFORE (base 15 of 18 at AFTER) on both sides of IST midnight, the meter read at the planter's one instant, RED at base and GREEN at head · 2 clause(s)` (exit 0)
- base read as head: `RED MCLK · M:midnight, M:one-instant` (exit 1) · no --base-org: `RED MCLK · M:midnight, M:one-instant` (exit 1)
- The door (named in its header): a Date preload via `NODE_OPTIONS=--import`, ALL-CHILDREN for M:midnight, PLANTER-ONLY for M:one-instant (the preload strips itself from the env the planter's children inherit). Precedent: `ci/mf4/clock.mjs`.

## Mutants (21 Nov 2026) — `node ci/mclk/run_mutants_mclk.mjs`
- `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN` — M1 the now-minus-minutes stamp restored (RED by M:midnight, row 1214's one mutant) · M2 the instant not handed to the meter (RED by M:one-instant) · M3 the unit witness ignores the base (RED by M:midnight).

## Members before and after (21 Nov 2026)
- mmeter unit witness `node ci/mmeter/witness_mmeter.mjs --org <tree> --base-org <3f22388 tree>`: at the cut `RED MMETER · BOUND`; at the tip `RED MMETER · BOUND` — the same last line (BOUND is dropped by the suite member; its two clauses HOLD both times). Its beyond-BOUND list grows by this unit's ci/mclk files, as by every landed unit's.
- mmeter mutants `node ci/mmeter/run_mutants_mmeter.mjs`: cut and tip `run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN`.
- `node ci/witness/mmeter/witness_meter.mjs plants`, real clock: cut and tip `PLANTS mmeter · 18 of 18 plant(s) as expected`.
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` on the tip, 21 Nov 2026: `organism_test: 160 passed, 0 failed · ruled 0 · UNRULED 0` (the witnesses member skips off the neutral machine).
- `node scripts/models.mjs check`: exit 0 (21 Nov 2026).

## Census (row 1214 (4)) — ci/mclk/CENSUS.md
- `CENSUS mclk · scanned 45 · derive 15 · run 17 · red at an instant 7 site(s)` (21 Nov 2026, main 56ed4ff).

## CI (the neutral machine) — check runs read through the public API
- See ci/mclk/LEDGER.jsonl for each push's run ids and verdicts.

## FORKS
- F1 · the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository: A · the runner carries it · B · drop the step for cloud seats.
- F2 · the census sites S1–S7 (CENSUS.md): their forks are lettered there.
- F3 · the census mode lives in `ci/mclk/witness_mclk.mjs` (a named file) so it is re-runnable; A · keep it there · B · move it to its own file in a later unit.
- F4 · the planter's instant is moved forward up to six minutes inside the first minutes of an IST day (so `T − 5 min` stays inside D): A · keep · B · instead compress the stamps between D 00:00 and the raw read.
