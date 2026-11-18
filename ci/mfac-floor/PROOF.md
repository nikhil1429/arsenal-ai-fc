# MFAC-FLOOR — the night's memory line, ruled (forks row 1103 (2))

Branch `claude/mfac-floor`, cut 19 Nov 2026 from `origin/main` @ `a18c167` (the landing of mfac `922db41`, row 1104).
New commits only, no force push. Every line with a count is dated 19 Nov 2026 (UTC) or names its command.

## The change (one file)

- `scripts/night.mjs`: `NIGHT_CONFIG.memory_floor_mb` is **1536** (MB), the ruled value, and its line names forks row 1103
  and the standing 1.5 GB line of row 477 (5). That line replaces the blind-rail source the F4 A text named, which is
  empty on his laptop (row 1103). The header and the refusal text say the same; `FLOOR_UNSET` stays as the named
  non-value, and any floor that is not a positive number still answers `NO floor-unset`.
- The selftest clause "the shipped floor is the placeholder and REFUSES (F4 A)" is now "a non-number floor refuses",
  planted both ways: `FLOOR_UNSET` and the string `"1536"` each give `NO floor-unset`; the shipped numeric floor passes.
- Nothing else: no `day.mjs`, no `package.json`, no settings (witness BOUND: only `scripts/night.mjs` differs).

## Measurements (19 Nov 2026)

- `node scripts/night.mjs selftest` → before (a18c167) `night selftest: 22 passed, 0 failed` (with the placeholder
  clause) · after, 19 Nov 2026: `night selftest: 22 passed, 0 failed` (with "a non-number floor refuses").
- `node ci/mfac-floor/witness_mfac_floor.mjs --org <build> --base-org <main a18c167>` →
  `GREEN MFAC-FLOOR the night's memory line is the ruled 1536 MB and a non-number floor still refuses · 5 clause(s)` (exit 0)
- `--org <main a18c167>` → `RED MFAC-FLOOR · F4.1 F4.2 F4.3` (exit 1; BOUND and LAST GREEN)
- `node ci/mfac-floor/run_mutants_mfac_floor.mjs --org <build> --base-org <main a18c167>` →
  `run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN` (two of them restore the placeholder:
  F4.1 and F4.2 each read it RED).
- 19 Nov 2026, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` → `organism_test: 145 passed, 1 failed · ruled 0 ·
  UNRULED 1 · LIVE 126` (19 Nov 2026); `SUITE MEMBER · night selftest exits 0`; the one red is main's own coverage-orphans
  line (`deck_lint, home_pin, probe, study_scope`), detail unchanged.
- `node scripts/models.mjs check` → exit 0, `literal model names outside models.mjs: 0`.

## Named

1. `ci/mfac/` is not on main (the landing carried the five code files only). Its witness, on `claude/mfac-build`, still
   asserts the placeholder in clause F4: run against this branch it reads `RED F4` by design — that clause is superseded
   by F4.1–F4.3 here (row 1103).
2. The witness and the mutants ran on Linux (node 22) only; the Windows path is written, not measured here.
3. `hooks/pre-commit` did not run on these commits (`core.hooksPath` unset in this container).
