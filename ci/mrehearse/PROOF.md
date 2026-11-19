# mrehearse · PROOF (in progress)

Base: main `fb42118` (fb4211870093e6b8657655eb02ebcfc425f1eab1), see `ci/mrehearse/BASE`. Spec: `ci/mwit/MWIT_SPEC.md` @ 88bf69d.

Done so far (unwitnessed; the witness is the next step):
- `scripts/night.mjs`: one mark kind `rehearse` (its row carries `head`, measured by `git rev-parse HEAD`). Selftest before: `night selftest: 22 passed, 0 failed` · after: `night selftest: 23 passed, 0 failed` (19 Nov 2026, `node scripts/night.mjs selftest`).
- `scripts/rehearse.mjs` (new, sole writer of rehearsal_log.jsonl): `run` / `last`; F3 A (snapshot + HEAD's scripts/ from git under os.tmpdir()), F4 A (clauses 9-11 carried from the recorded meter row). Syntax checked only, never run.

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from: write ci/witness/mrehearse/witness_rehearse.mjs (plants W1-W6 + BOUND + LAST, base RED / build GREEN), then ci/mrehearse/run_mutants_mrehearse.mjs, then suite/lawpack/models re-measure and the full PROOF
