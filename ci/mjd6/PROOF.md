# MJD6 PROOF — a failed retire never leaves a settled card live (forks row 1037 (2), fork F1)

**Base:** `origin/main` at `4d166d3` (it carries mjd5). **Branch:** `claude/mjd6-build`, cut from that commit.
**Named files:** `scripts/captains_call.mjs` (the card owner; the only file changed) and `scripts/gaffer_brain.mjs` (named by
the spec; read, unchanged). Everything else is under `ci/mjd6/`.

## Measured before writing (at `4d166d3`)
- The round's retire is ONE spawn of the card owner: `scripts/gaffer_brain.mjs:2157-2164` (`cardsOwner`, `cardRetire`).
- It runs only after the settled row landed, `scripts/gaffer_brain.mjs:2212-2218`; a failed spawn is put on the receipt
  (`card_retired.ok:false`), `:2217-2218`, and nothing retries it.
- That settled row is `{...d, kind:"settled", resolved_from:"in-doubt"}` with `of` = the capture id, `scripts/gaffer_brain.mjs:2212`;
  the card's key is `judge:in-doubt:<of>`, `:2216` and `:2224`.
- Once settled, the capture leaves the in-doubt set (`inDoubtGrades`, `scripts/gaffer_brain.mjs:1438-1442`), so no later round
  files or retires its card again. That is the gap mjd5 FORK 1 names.
- The grade queue is `STATE_DIR/gaffer_grade_queue.jsonl`, `scripts/gaffer_brain.mjs:893`. gaffer_brain.mjs is its only writer.
- In the card owner, `sync` is `scripts/captains_call.mjs:1422-1441`, and `deal` syncs before it picks a card, `:1642-1647`.
  `retireCard` already holds every guard a retire needs, `:1595-1609`: the declared key class, live cards only, no minting,
  and no second retire.
- The owner's state dir, including the grade queue path the sweep reads, follows `ARSENAL_CALL_STATE_DIR`, `scripts/captains_call.mjs:77`.

## What was built
| Ruled | Where |
|---|---|
| a sweep: a settled-from-doubt row whose card is live gets retired | `captains_call.mjs` `sweepSettledFromDoubt(state, rows, now)` (pure, exported). For every LIVE card keyed `judge:in-doubt:<id>` whose capture has a row `kind:"settled"`, `resolved_from:"in-doubt"`, `of:<id>`, it retires the card through `retireCard`, so all of that door's guards apply. The epitaph is `SWEEP_WHY`. |
| so a failed retire never leaves a settled card live | `sync` runs the sweep right after `deriveCards`, before the decision gate and before the one `writeAtomic(CALL, …)`. It reads `GRADE_QUEUE` and never writes it. `deal` syncs first, so the anchor never deals a settled card. |
| owners-only | the card owner writes only its own deck. The judge's queue is a read-only module-level const (`GRADE_QUEUE`), so xray can resolve it: `node scripts/xray.mjs report` read Q2 (0) and Q5 (0) on 18 Nov 2026. |

## Witness, both ways — `node ci/mjd6/witness_mjd6.mjs --org <tree> --base-org <tree>`
Each run uses the REAL judge round (`gradeJudge`), the REAL `captains_call.mjs file` (the round's own default spawn), the REAL
`capture.mjs rep`, and then the REAL card owner `sync` and `deal`. Everything runs in a copy of each tree. The deck and the
judge's queue are planted under the temp dir through `ARSENAL_CALL_STATE_DIR`. One seam is planted: the round's retire door
fails, as in mjd5 FORK 1. Every child is bounded by a node start measured in the run. No port, no service.
The trees are LF `git archive` exports of `4d166d3` (base) and of the build commit `f427795`.

- Build vs base (`ci/mjd6/out/witness_build.txt`): S1 · S3 · S2 · BOUND · LAST GREEN, last line
  `GREEN MJD6 a failed retire never leaves a settled card live — the owner's sync sweeps it, once · 5 clause(s)` (exit 0)
- Base vs base (`ci/mjd6/out/witness_base.txt`): `RED MJD6 · S1 S3 S2` (exit 1). S1: after the owner's sync, three live cards
  remain and the anchor deals one. S3: no card carries the sweep's epitaph. S2: three live cards where only the refused
  capture's should stand.

| Clause | Plant |
|---|---|
| S1 swept | Rounds 1 and 2 are refused (three cards). Round 3 lets every owner through and every retire fails, which is the gap: three cards stay live. Then `sync`: no live card under any of the three keys, and `deal` deals none of them. |
| S2 still in doubt | Rounds 1 and 2 are refused. Round 3 refuses one capture and lets two through, and their retires fail. Then `sync`: exactly one live in-doubt card stands, the refused capture's, with the same id. |
| S3 once | After S1, a second `sync` and a `deal` leave every in-doubt card unchanged. Each card is retired once, with the sweep's epitaph, at the first sweep's instant. |

## Mutants — `node ci/mjd6/run_mutants_mjd6.mjs --org <build> --base-org <base>` (`ci/mjd6/out/run_mutants.txt`)
`run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN`

| Mutant | Change | RED by |
|---|---|---|
| S1 | `sync` never runs the sweep | S1 (S3 and S2 also go RED) |
| S2 | the sweep retires every live in-doubt card, settled or not | S2 |
| S3 | the sweep re-stamps a card it already retired | S3 |
| BOUND | a third file is touched | BOUND |
| LAST | `sync` leaves a node process naming its tree; the runner kills it after the witness has named it | LAST |

## Gates (measured 18 Nov 2026, this container)
- `node scripts/captains_call.mjs selftest` on 18 Nov 2026: base `captains_call selftest: 147 passed, 0 failed` → build `captains_call selftest: 150 passed, 0 failed`. Three SWEEP asserts were added and none removed.
- `node scripts/gaffer_brain.mjs selftest` on 18 Nov 2026 (the file is unchanged): base and build both `gaffer_brain selftest: 194 passed, 0 failed`.
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in the repo checkout, 18 Nov 2026: base scripts and build scripts read the same headline, `organism_test: 139 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)`. The one red is `EVERY organ with a selftest is wired into a suite` (orphaned: home_pin, probe, study_scope). It is red on the base too and lies outside this unit's files.
- `node scripts/models.mjs check` exit 0.
- Neutral machine: see `ci/mjd6/LEDGER.jsonl` (check runs of each pushed sha, read through the public API).

## FORKS
1. **The sweep lives in the card owner, not in gaffer_brain.** The spec offered either side. Here the owner reads the judge's
   queue (read-only) in its own `sync`. That pass needs no spawn, so it cannot fail the way the round's retire did, and it runs
   before every deal. `gaffer_brain.mjs` is unchanged, and the round's own retire (mjd5) still runs first.
2. **Between a failed retire and the next sync, the card is still live in the deck file.** `status` and `list` do not sync,
   so they show it. `deal` syncs first, so it can never deal that card.
3. **The sweep's retire is recorded only on the card's epitaph.** The `sync` stdout line is unchanged, so no reader of that
   line moves.
4. **The sweep reads the whole grade queue on every sync.** It has no cursor, so its cost grows with the queue. Bounding that
   is a separate unit.
5. **Only a `resolved_from:"in-doubt"` settled row retires a card**, as the ruling reads ("settled-from-doubt"). A plain
   settled row does not. Today the two are the same: only the mjd4 loop settles a capture in doubt (`scripts/gaffer_brain.mjs:1438-1442`).
6. **The mutant runner bounds one witness run at 20 × the measured per-child bound.** The 20 is a count of children per
   witness, not a typed number of milliseconds. It is named here.
7. **Witness trees are LF `git archive` exports with the repo's `node_modules` linked in** (`gaffer_brain` imports `acorn`), the same as mjd5 FORK 5.
8. **Branch naming.** The brief says the seat sits on `claude/mjd6-queue`. This session's seat branch is
   `claude/mjd6-queue-setup-rmra3m`. It was not edited. The build is on `claude/mjd6-build`, as the brief names.
9. **The effort receipt.** `node campaign-2026-09/tools/effort_receipt.mjs` fails with
   `Error: Cannot find module '…/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1). Nothing was written under `campaign-2026-09/`.
