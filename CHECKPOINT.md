# CHECKPOINT · unit mcr (the cloud builder with a queue)

CHECKPOINT · RESTED at 2026-11-18 (context near its working limit, per the architect's row 1031/1032 message) · resume from **mgrd**

## Done (each on its own branch, pushed; nothing landed, no main moved)
| Item | Branch | Tip | File | CI (npm test · node 22 / 24) |
|---|---|---|---|---|
| B2 spec | claude/mcr-b2-spec | e826121 | ci/mcr/B2_SPEC.md | 134755425634 / 134755425282 success (ruled: row 1029) |
| mjd3 build | claude/mcr-mjd3-build | f9149f8 | ci/mcr/MJD3_PROOF.md | 134755747705 / 134755747294 success (adopted: row 1030) |
| mcr2 land branch | claude/mcr2-landing | e819c0d | (3 scripts) | 134753581188 / 134753581538 success |
| mjd3 land branch | claude/mjd3-landing | 3a73782 | scripts/gaffer_brain.mjs | 134755761632 / 134755761080 success |
| B3 spec | claude/mcr-b3-spec | 56e9ecb | ci/mcr/B3_SPEC.md | 134755258579 / 134755257998 success (ruled: row 1032) |
| mlive spec | claude/mcr-mlive-spec | 45b8f5e | ci/mcr/MLIVE_SPEC.md | 134756983777 / 134756983278 success (ruled: row 1031) |
| mjd4 build | claude/mcr-mjd4-build | dbc9717 | ci/mcr/MJD4_PROOF.md | not yet registered at checkpoint time — read with `node scripts/ci_verdict.mjs dbc9717` |

## Next, in the architect's order (row 1032 message)
mgrd (B2 §4, clauses G1-G3 + MUT, base origin main) · mland (B2 §2, V1-V8, CR1-CR4 + MUT, with row 1029's corrections:
no git worktree in step 8, step 11 prints stale units only, the names-gate result handed in fail-closed) · mlv0 (status
line + judge port) · mlv1 sitting · mlv2 cortex · mlv3 thalamus · mdone (row 1032) · F2 build.

## Notes for the next seat
- A spec or proof `.md` must pass the suite's LOAD ZERO BLOCK 7 canon-count law (a number beside "organs", "selftests",
  "N passed" …): date the line or name the command. B2's first push read NEW RED on exactly that.
- `node scripts/ci_verdict.mjs <sha>` answered 403 from this container's Node fetch; curl to the same API answered 200.
- The repo's rail hook refuses any shell write under a `dressing-room/state` path, even inside a temp tree.
