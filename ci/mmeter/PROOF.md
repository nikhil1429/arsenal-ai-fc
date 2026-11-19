# unit mmeter · PROOF (in progress)

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from: add the ONE suite member to scripts/organism_test.mjs (row 1162 (2)), then ci/mmeter/run_mutants_mmeter.mjs, then the build measurements (hermetic suite, law pack gate counts, models check) and the rest of this proof

Base: main `fb42118` (`ci/mmeter/BASE`). Done and pushed so far (measured 19 Nov 2026, every line by the command named):

- `node scripts/daily_green.mjs selftest` → base `daily_green selftest: 75 passed, 0 failed` · build `daily_green selftest: 81 passed, 0 failed`
- `node ci/witness/mmeter/plant_day.mjs 5` → base `meter exit 0` · build `meter exit 3`; `… 11` → `meter exit 0` on both
- `node ci/witness/mmeter/witness_meter.mjs plants` → `PLANTS mmeter · 17 of 17 plant(s) as expected` (exit 0)
- `node ci/witness/mmeter/witness_meter.mjs --org . --base-org <base worktree>` → `GREEN MMETER strict meter exit + meter witness (day11 · oldday), RED on base and GREEN on build · 2 clause(s)` (exit 0)
- the same with `--org <base worktree>` → `RED MMETER · A:day-11, A:old-day-red`
- the tracked meter: `witness_meter.mjs day11` exit 1 (latest row 6/11) · `witness_meter.mjs oldday` exit 2 (no row carries code_sha yet, F2 A)
