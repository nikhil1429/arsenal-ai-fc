# PROOF · unit mjd7 — the card owner's sweep reads the grade queue from a cursor

Forks row 1063 (4). Branch `claude/mjd7-build`, cut from `origin/main` **95b07a604ef22f2a215bfc56e4ff45990177a437** (`ci/mjd7/BASE`).
Named files touched: `scripts/captains_call.mjs`, `ci/mjd7/`. Nothing else.

## MEASURED AT THE BASE (95b07a6, file:line)

- The sweep reads the WHOLE queue every sync: `scripts/captains_call.mjs:1425`
  `sweepSettledFromDoubt(deriveCards(loadState(), gatherSources(), now), readLinesJson(GRADE_QUEUE), now)`;
  `readLinesJson` is a whole `readFileSync` (`scripts/captains_call.mjs:100`). `deal` syncs first, so every deal paid it too.
- The queue is append-only by its sole writer: `scripts/gaffer_brain.mjs:7` (header) and `appendRowChecked`
  (`scripts/gaffer_brain.mjs:231`, `appendFileSync` only).
- The deck's sole writer is this organ: `scripts/captains_call.mjs:21`; every deck write is `writeAtomic(CALL, …)` of a
  state that spreads the loaded deck (`deriveCards` at `scripts/captains_call.mjs:385`, `retireCard` at `:1605`), so a new
  top-level field survives every verb.
- The judge round files the in-doubt card BEFORE it settles the capture: `scripts/gaffer_brain.mjs:2224` (file) and
  `:2216` (retire at resolve).
- NOT REACHED: the cost on his real queue (no state file is read by this seat; row 1063 (4) gives that to the runner).

## THE BUILD

- `grade_cursor`, a field of `captains_call.json`, named in the header WRITES/READS block (`scripts/captains_call.mjs:56`).
  It holds `offset` (just past the last complete line read), `anchor_len` and `anchor` (that line's sha256).
- `readGradeQueueSince` (`scripts/captains_call.mjs:1704`): reads the anchor line back, then only `[offset, size)`.
  ONE whole read and a re-seat when the cursor is MISSING (absent or malformed), AHEAD (`offset > size`), or
  REWRITTEN (the anchor bytes differ). A half-written tail row is never passed. Its disk door opens the queue `"r"` only.
- `sync` (`scripts/captains_call.mjs:1425`) sweeps the rows since the cursor and seats the new cursor in the deck's one write.

## WITNESS — `node ci/mjd7/witness_mjd7.mjs --org <tree> --base-org <base tree>` (19 Nov 2026)

Trees are `git archive` exports (the base at 95b07a6, the build at its commit), so the working tree's hook-touched files
never enter the BOUND walk.

- on the BUILD: `GREEN MJD7 the sweep reads the grade queue from its cursor — one whole read only when the cursor is missing, ahead or rewritten · 6 clause(s)` (exit 0)
- on the BASE: `RED MJD7 · C1 F1 F2 F3` (exit 1)

C1 measured, build: a sync after one settled row read `whole 0 ranged 328B` (anchor 223B + new row 105B, of a 774B queue);
base: `whole 1`.

## THE mjd6 WITNESS ON THIS BUILD — `ci/mjd6/witness_mjd6.mjs` from `claude/ms1-build` 3966f61 (19 Nov 2026)

`git diff 3966f61 origin/claude/ms1-build -- ci/mjd6` is empty (the branch tip has moved to 3981f36; the witness has not).
`node witness_mjd6.mjs --org <build> --base-org <base>`:
`GREEN MJD6 a failed retire never leaves a settled card live — the owner's sync sweeps it, once · 5 clause(s)` (exit 0) — S1, S2, S3 GREEN.

## MUTANTS — `node ci/mjd7/run_mutants_mjd7.mjs --org <build> --base-org <base>` (19 Nov 2026)

`run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN` — each mutant RED by its own clause only.

## SELFTESTS AND GATES, before → after

- `node scripts/captains_call.mjs selftest` (19 Nov 2026): base `captains_call selftest: 150 passed, 0 failed` →
  build `captains_call selftest: 156 passed, 0 failed`. The mjd6 sync assertion now names the cursor read (stricter:
  it still refuses any write to GRADE_QUEUE); six CURSOR assertions added.
- `node scripts/models.mjs check` (19 Nov 2026): exit 0 (`hits 0`).
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (19 Nov 2026, after `npm ci --ignore-scripts`):
  base and build print the same line, `organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1`; the one FAIL is
  the coverage law naming four orphaned selftests on main (`deck_lint, home_pin, probe, study_scope`), not this unit.
- `node scripts/xray.mjs report` (19 Nov 2026): Q2 (0), Q5 (0).

## FORKS

1. A rewrite that leaves the anchor line byte-identical at the same offset but changes rows BEFORE it is invisible to
   the cursor: only the anchor is checked, because checking the whole prefix is the whole read this unit removes. The
   queue's owner declares it append-only (`scripts/gaffer_brain.mjs:7`), so such a rewrite is itself a breach there.
2. A `judge:in-doubt` card minted AFTER the cursor has passed its capture's settled row is not swept (the base would
   sweep it at any later sync). The judge round files before it settles (`scripts/gaffer_brain.mjs:2224` / `:2216`), so
   this needs a hand `file` of an already-settled capture's key. A fix would live in the `file` verb (this file) or in
   gaffer_brain's order of acts; not built — the architect's call.
3. The cost on his real queue stays the runner's to measure and write in its landing row (row 1063 (4)).
4. The seat environment carried no `node_modules`; `npm ci --ignore-scripts` (gitignored) was run so xray, fsrs and
   mutagen could load. Without it, 19 Nov 2026, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` printed `140 passed, 4 failed` on base and build alike.
5. The session's harness named branch `claude/mjd7-queue-setup-plql7a` (carrying the settings commit 9bfc50a); this
   build is on `claude/mjd7-build` from main, per the brief, and carries no `.claude/settings.json` change.
