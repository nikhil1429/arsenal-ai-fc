# mrulew · C:rule-witnesses — PROOF (in progress, 19 Nov 2026)

Base: `fb4211870093e6b8657655eb02ebcfc425f1eab1` (origin/main at the cut, 19 Nov 2026), branch `claude/mrulew-build`.

## Measured so far (19 Nov 2026, at the base)

- `scripts/teaching_contract.mjs` exports no reader of the rules (`grep -n '^export'`: :274, :275, :281, :319, :1701); `load()` (:945) is
  file-private and returns `seed()` when the state file is absent, so on the cloud a rule read is UNREAD, never the seed.
- The per-rule checker is `scripts/teaching_audit.mjs` `auditTurn` (:852, pure) plus `pictureDrift`/`pictureFacts` (:1473/:1390) for
  `act-mueywvag`; its rule ids are `CHECKED_RULES` (:186).
- Plan for the map (`ci/witness/mrulew/rule_witness.json`): each rule id → `node ci/witness/mrulew/witness_rules.mjs rule <id>`, with a
  RED and a CLEAN planted turn per id run through the org tree's own `auditTurn`; the clause witness requires both ways per id.
- Suite at the base, 19 Nov 2026, by `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`:
  `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` (exit 2; the one red is the
  selftest-coverage law: deck_lint, home_pin, probe, study_scope).

## FORKS (named so far)

- The ms1 member walks `ci/<unit>/witness_<unit>.mjs`; this unit's witness sits at `ci/witness/mrulew/witness_rules.mjs` (UNITS row 10), so
  that member will not find it — it rides unit mmeter's `ci/witness` plants member (row 1162 (2)).

CHECKPOINT · STOPPED at 2026-11-19T12:37:57Z · resume from: write ci/witness/mrulew/rule_witness.json (RED/CLEAN plants per rule id, probed against auditTurn) and ci/witness/mrulew/witness_rules.mjs (clause mode, rule mode, plants mode, --org/--base-org), then ci/mrulew/run_mutants_mrulew.mjs, the law pack counts and the proof
