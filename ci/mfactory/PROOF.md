# unit mfactory · PROOF (B-factory:four-numbers · forks rows 1162 / 1163)

~~CHECKPOINT · STOPPED at 2026-11-19T12:37Z · resume from: BOUND (skip untracked *.log in the walk, or run plants on LF commit trees), then mutants (ci/mfactory/run_mutants_mfactory.mjs), the build's suite + law pack counts, the proof, the effort receipt~~
RESUMED 2026-11-19 on his word 270 from `e0f84d4`; every step after it is below.

## Base

Cut from `origin/main` at **`fb42118`** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched 19 Nov 2026), named in `ci/mfactory/BASE`.
Spec: `ci/mwit/MWIT_SPEC.md` on `claude/mwit-spec` @ `88bf69d`, §B-factory:four-numbers, UNITS row 9.

## What was built (ci-only, row 1162 (4): no organ file edited · no suite edit, row 1162 (2))

- `ci/witness/mfactory/witness_factory.mjs` — ONE file, two modes:
  - **the clause** `--window <id> --campaign <dir> [--table <file>]`: exit 0 iff the window's row carries `landings`,
    `hands`, `memory_wait`, `test_loads`, each `{ value: <finite number>, source: <reader> }`, the source naming its
    owner organ; 1 on a missing / non-finite / unowned field; 2 (UNREAD) when there is no campaign, no table, a corrupt
    line or no row for the window. It prints field names only, never a value.
  - **plants** (`plants [--org] [--base-org] [--only]`, or `--org <dir> --base-org <dir>`): the plant clauses P1-P4 (spec
    plants, plus sources, unread-never-green and owners-derived), BOUND, LAST. This is the mode unit mmeter's member
    runs (row 1162 (2)).
- `ci/mfactory/run_mutants_mfactory.mjs`, `ci/mfactory/BASE`, `ci/mfactory/LEDGER.jsonl`, this file.

Owners, read at fb42118 (file:line): landings — `scripts/land.mjs:65` (ledgerPath/record), the LANDED outcome counted at
`:68` (countSince), the row written at `:162`. Hands — `HUMAN_STOPS` `scripts/land.mjs:45`, stamped `human:` at `:162`.
Memory-wait — `scripts/night.mjs:59` (`REASONS` holds `"memory"`), the stop row at `:154`, the floor `:56`. Laptop
test-loads — **no recorder in this repo** (NAMED N9). The spec cites `night.mjs:24-25` for the floor; at fb42118 it is
`:21-22` (header) / `:56` (config) — the line moved, the fact stands.

## The witness, both ways (19 Nov 2026, last lines)

```
node ci/witness/mfactory/witness_factory.mjs plants --base-org <LF tree of fb42118>          (build)
GREEN MFACTORY the factory window's four numbers are read, each from its owner, and an unread window is never green · 6 clause(s)   exit 0

node ci/witness/mfactory/witness_factory.mjs plants --org <LF tree of fb42118> --base-org <same>   (base)
RED MFACTORY · P1, P2, P3, P4   exit 1

node ci/witness/mfactory/witness_factory.mjs --window w1                    → FACTORY w1 · UNREAD · no --campaign <dir> … (NAMED N9) …   exit 2
node ci/witness/mfactory/witness_factory.mjs --window w1 --campaign /nonexistent → FACTORY w1 · UNREAD · the window table is absent or unreadable …   exit 2
```

On the cloud the clause reads **UNREAD, never green** (row 1162 (5)): the window table lives in the campaign tree.
**RED before** (for `rung_receipt.mjs red`): exit 2 at the cut, no window row. **GREEN**: the first window closed after the
build, with its row written by the campaign's window writer (N9).

## Mutants (19 Nov 2026)

```
node ci/mfactory/run_mutants_mfactory.mjs
run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN
```
P1 the spec's μ (`Number.isFinite` → `!= null`: the "n/a" plant goes 0) · P2 owner match dropped · P3 corrupt line
skipped · P4 owners not derived · BOUND scripts/land.mjs edited · LAST the reader leaves a detached node naming the temp root.

## Selftests and members touched

None. No organ, no selftest and no suite member is edited (ci-only unit). The suite, measured
(`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026):
- base fb42118 (19 Nov 2026): `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)`, EXIT 2
- build (19 Nov 2026): `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)`, EXIT 2
The one FAIL on both is the base red: `EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)`.

`node scripts/models.mjs check` → exit 0 (19 Nov 2026).

## The law pack counts (row 1130 (2); `node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026)

```
BASE  lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```
No count rises. The gate reads `2 RED` on BOTH (jugad 93 vs frozen 90, depcruise 13 vs frozen 7): this is a red on main that
existed before this unit, not from it (FORK MF-5).

## FORKS

- **MF-1 · the window table's file.** N9: the campaign's window table and its writer are not in this repo. The witness reads
  `--table <file>`, else `<campaign>/factory_windows.jsonl` (a proposed name). (a) the campaign's writer adopts this name;
  (b) the architect names the real file and the default changes (a witness change, so the receipt refuses an old green).
- **MF-2 · the row shape.** Proposed `{ window, landings|hands|memory_wait|test_loads: { value, source } }`, the LAST row of
  a window wins (append-only). Rule it, or name the writer's shape.
- **MF-3 · test_loads has no owner here.** Any non-empty source passes for it; the other three must name `scripts/land.mjs`
  / `scripts/night.mjs`. Once a laptop test-load recorder exists it joins `OWNER_OF`.
- **MF-4 · ms1's member will not judge this witness.** It looks only for `ci/<unit>/witness_<unit>.mjs`. The witness sits at
  `ci/witness/mfactory/` (row 1162 / UNITS row), and `ci/mfactory/BASE` is written as the brief asks. Unit mmeter's
  `plants` member is the one that runs it.
- **MF-5 · the law pack is already RED on main** (2 RED at fb42118, above). This unit raises no count; whose fix it is is the architect's call.
- **MF-6 · spec vs ruling.** The spec's UNITS note (every unit edits `organism_test.mjs`) is overruled by row 1162 (2):
  no suite edit here. The spec's `night.mjs:24-25` citation is stale by line number (above).

## Effort receipt

See the last ledger row: `node campaign-2026-09/tools/effort_receipt.mjs …` — this repo carries no such file.

## CI

The neutral legs of each push are read through the public API (curl, no token) and named in `LEDGER.jsonl`; the final
tip's legs are named in the session's final message.

### CI of the work tip (19 Nov 2026)

```
NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs 3ce7e2c85c627e8e1cf530ac14d8bb8bad8b2dac
ci_verdict 3ce7e2c GREEN — npm test · node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135778546010] | npm test · node 24: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135778545339] (3 calls)
```
The commit that carries this section changes only this file and the ledger; its own legs are named in the seat's final message.
