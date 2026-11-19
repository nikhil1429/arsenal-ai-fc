# unit mfactory · PROOF (B-factory:four-numbers)

CHECKPOINT · STOPPED at 2026-11-19T12:37Z · resume from: BOUND (skip untracked *.log in the walk, or run plants on LF commit trees), then mutants (ci/mfactory/run_mutants_mfactory.mjs), the build's suite + law pack counts, the proof, the effort receipt

- Base: main fb42118 (`ci/mfactory/BASE`).
- Base measured 19 Nov 2026 (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`): organism_test: 149 passed, 1 failed (the base red: _selftest_coverage_law), EXIT 2.
- Law pack on base, 19 Nov 2026 (`node scripts/lawpack.mjs gate`): already 2 RED on base (jugad-literal-subject-list 93 vs frozen 90, depcruise_errors 13 vs frozen 7).
- `node scripts/models.mjs check`: exit 0 (19 Nov 2026).
- Witness `ci/witness/mfactory/witness_factory.mjs` written (not yet final). P1-P4 GREEN on --org and RED on base. BOUND read RED only because of the untracked `scripts/tone.log` that the suite run left in the working tree. LAST GREEN.
- Cloud clause run: `--window w1` → UNREAD exit 2 (no campaign, N9), never green.
