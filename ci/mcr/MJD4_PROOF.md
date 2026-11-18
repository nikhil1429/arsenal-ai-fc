# MJD4 PROOF — a capture in doubt is re-dispatched EXACTLY once (forks row 1030 (2))

**Base:** `claude/mjd3-landing` at `3a73782` (as ruled). **Branch:** `claude/mcr-mjd4-build`.
**Files:** `scripts/gaffer_brain.mjs`, `scripts/capture.mjs`, `scripts/rejirah.mjs`, `scripts/doubtminer.mjs` (+89 / −13).

## What was built
| Ruled | Where |
|---|---|
| an idempotency key the three owners read | `--idem <capture id>`: `capture.mjs rep` (the rep carries `idem`; ingest counts a second arrival under it as a duplicate; only the judge's `rep` door may carry it, like its stamp) · `rejirah.mjs grade` (a row already under the key → nothing appended, exit 0, named) · `doubtminer.mjs retire` (a retire already under the key is never applied again — an un-retire he made since stays his) |
| the judge hands it | `gaffer_brain.mjs ownerCommand` → `idemArgv(s)` on all three owner commands |
| an in-doubt capture is re-dispatched exactly once | the write-ahead row now carries the whole verdict; `inDoubtDispatches(rows)`; at the start of a round each is handed to its owner again under the same key, then its settled row (`resolved_from: "in-doubt"`) is appended — inside the round's budget |
| until resolved it is one card at his anchor, one key per capture, never silent | `cardFile(…, "judge:in-doubt:<capture id>")` for every capture the round could not resolve (no budget, owner refusal, a write-ahead row with no verdict, the settled write failing); `in_doubt` and `resolved_in_doubt` on every receipt |

## Witness, both ways — `node ci/mcr/witness_mjd4.mjs --org <tree> --base-org <tree>`
The REAL `capture.mjs rep` and `rejirah.mjs grade` run on a copy of each tree under the temp dir.

Build vs base (`ci/mcr/out_mjd4/witness_build.txt`): I1 · I2 · I3 · I4 · I5 · BOUND · LAST all GREEN —
`GREEN MJD4 a capture in doubt lands exactly once, and until it does it is one card · 7 clause(s)`.

Base vs base (`ci/mcr/out_mjd4/witness_base.txt`): `RED MJD4 · I1 I3 I4 I5` — I1: the capture killed before its owner
wrote reads `[1,0,1]` (counted zero times: mjd3's fork 1); I3/I4: two rows under one verdict; I5: no card. I2 is GREEN on
the base too: mjd3's write-ahead row already stopped the double count after the owner's write.

## Mutants — `node ci/mcr/run_mutants_mjd4.mjs` (`ci/mcr/out_mjd4/run_mutants.txt`)
`run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN` — I1 (no re-dispatch), I2 (no key
handed), I3 (capture ignores the key), I4 (rejirah ignores it), I5 (no card), BOUND (a caller touched).

## Gates (measured 18 Nov 2026, in LF archive trees of base and build)
- gaffer_brain selftest 194 / 0 → 194 / 0 (the argv-contract assert's predicate now names `--idem`; its name unchanged)
- rejirah selftest 107 / 0 → 107 / 0 · doubtminer ALL CHECKS PASSED both sides
- capture selftest: the SAME two reds on both sides (`CONCURRENT READER …` ×2 — a held-handle rename, a Windows
  behaviour this Linux container does not reproduce); no new red
- `node scripts/models.mjs check` exit 0

## FORKS
1. **doubtminer's real `retire` is not driven by the witness.** It refuses an unknown capsule, no capsule ships in the
   repo (`capsules/` is the gitignored mirror, `mirror.mjs` its sole writer), and the repo's rail forbids planting one
   under a state dir by hand. Its key check is the same shape as rejirah's (a row under the key → nothing applied);
   witnessing it needs a capsule-dir seam in doubtminer (`CAPS_DIR` is a module const) — a separate unit.
2. An owner that REFUSES leaves its write-ahead row, so that capture is in doubt next round (re-dispatched once, carded
   until then). Safe because the owner is idempotent; named so it is not read as a kill.
3. An in-doubt card is not retired at source when the next round resolves it; it waits for his answer. Retiring it needs
   captains_call's at-source door for this key class.
