# mcanary · PROOF (in progress)

Base `fb42118` (`fb4211870093e6b8657655eb02ebcfc425f1eab1`), cut and measured 19 Nov 2026; base measurements in `ci/mcanary/LEDGER.jsonl`.
Done: `ci/witness/mcanary/canary.mjs` (the canary file's one writer: pass and run verbs, chained by `scripts/rung_receipt.mjs` rowSha and parseReceipts, the run row measured from each seat's get_session record and its `Claude-Session` trailer on the remote branch). Not yet run or witnessed: an unrun system is a hypothesis.

CHECKPOINT · STOPPED at 2026-11-19T12:38:01Z · resume from: write `ci/witness/mcanary/witness_canary.mjs` (clause read `<id>` plus `plants --org --base-org [--only]`: L/O/D plants, BOUND, LAST), then the empty `canaries.jsonl`, `run_mutants_mcanary.mjs` (three mutants: drop the started_at check · drop the unit equality · every-seat to >= 1), the suite, lawpack and models measurements, and the proof.
