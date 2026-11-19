# UNIT mport — PROOF (19 Nov 2026)

Row 1064 (6): cortex and thalamus read their planted ports through the same keeper helper, one guard, one home.
Row 1064 (1): the env name is read only when keeper.mjs itself sits under the OS temp dir, else the fixed port.

## BASE
Cut from `origin/main` at `95b07a604ef22f2a215bfc56e4ff45990177a437` (git fetch origin main; git checkout -b claude/mport-build FETCH_HEAD).

## MEASURED AT THE BASE (file:line @ 95b07a6)
- keeper.mjs's judge-port door (unit mlj): `scripts/keeper.mjs:85-91`, the `UNDER_TMP` guard (realpath of tmpdir and of
  keeper.mjs's own URL, `relative` inside it, case-folded on win32). Not exported. `scripts/keeper.mjs:92`, `JUDGE_PORT`
  reads `ARSENAL_JUDGE_PORT` only when `UNDER_TMP`, else 4118.
- cortex.mjs keeps its OWN copy of the guard: `scripts/cortex.mjs:163-172` `export function plantedPort` (realpath of
  cortex.mjs's own URL, `startsWith` the tmp dir plus a separator). Port reads: `scripts/cortex.mjs:173` ARSENAL_CORTEX_PORT/4112,
  `:174` ARSENAL_THALAMUS_PORT/4113, `:175` ARSENAL_JUDGE_PORT over keeper's JUDGE_PORT (a SECOND read of the judge env).
- thalamus.mjs keeps its OWN copy: `scripts/thalamus.mjs:156-165` `export function plantedPort`. Port reads:
  `scripts/thalamus.mjs:166` ARSENAL_THALAMUS_PORT/4113, `:167` ARSENAL_JUDGE_PORT over keeper's JUDGE_PORT.
- Every other 4112/4113 in the two files is a log string, a comment or a selftest fixture (grep at the base); none is a port read.
- The defect the split guard carries (witness on the base, P1 (b)): with keeper.mjs OUTSIDE the temp dir and the organs under
  it, the base honours every planted env port, the judge port included, against keeper's own guard.

## WHAT CHANGED (only the named files)
- `scripts/keeper.mjs`: the existing guard is exported as `plantedPort(name, fixed, {here, env, tmp, platform})`, keyed on
  keeper.mjs's own place; `JUDGE_PORT = plantedPort("ARSENAL_JUDGE_PORT", 4118)`, the same value as before on every input.
- `scripts/cortex.mjs`, `scripts/thalamus.mjs`: their copies are deleted; `plantedPort` is imported from `./keeper.mjs`;
  `JUDGE_AT = JUDGE_PORT` (keeper already read it through the one door). Constant names are unchanged.

## WITNESS (`ci/mport/witness_mport.mjs --org <dir> --base-org <dir>`)
- Build (`--org .`, `--base-org` = base 95b07a6 materialised under the scratch temp dir), last line:
  `GREEN MPORT cortex and thalamus read every planted port through keeper's one guard; his machine reads the fixed ports · 3 clause(s)` (exit 0)
- Base (`--org` = `--base-org` = base 95b07a6), last line: `RED MPORT · P1, P2, P3` (exit 1)

## MUTANTS (`ci/mport/run_mutants_mport.mjs --org . --base-org <base>`)
`run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN`
(P1: the guard dropped · P2: the door shut · P3: thalamus re-grows its own port read)

## SELFTESTS, BEFORE (base) AND AFTER (build), by headline line
- keeper: `keeper selftest: 17 passed, 0 failed` → `keeper selftest: 17 passed, 0 failed` (19 Nov 2026)
- cortex: `ALL CHECKS PASSED` → `ALL CHECKS PASSED`
- thalamus: `ALL CHECKS PASSED` → `ALL CHECKS PASSED`

## MODELS
`node scripts/models.mjs check` → exit 0 (literal model names outside models.mjs: 0), 19 Nov 2026.

## SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026)
Exit 2 in this container. Its four UNRULED reds are environmental and not this diff: fsrs and mutagen fail on
`ERR_MODULE_NOT_FOUND` (no node_modules in this checkout), and the coverage law names orphaned selftests (deck_lint,
home_pin, probe, study_scope), none of them a named file. The neutral judge is the suite workflow on each push (LEDGER.jsonl).

## FORKS
- F1 · keeper.mjs's guard was an unexported IIFE, not a function; "export the existing helper" was done by lifting the
  same body into an exported `plantedPort` (inputs injectable for selftests). The architect may rule it a wider edit than "export".
- F2 · the import chain of cortex.mjs needs `dressing-room/state/registry.json` at load (gate.mjs's lane table); the witness
  and the mutant runner copy that ONE tracked file into the plant by node, never print it. No other state is planted.
- F3 · eslint / tsc could not be run here (no node_modules); the CI suite is their judge.
