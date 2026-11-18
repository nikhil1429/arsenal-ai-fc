# MJD5 PROOF — the in-doubt card retires at source (forks row 1033 (2))

**Base:** `origin/main` at `15edfec` (it carries mjd4). **Branch:** `claude/mjd5-build`.
**Named files:** `scripts/gaffer_brain.mjs` (the filer of the card), `scripts/captains_call.mjs` (the card owner, named by the ruling).

## Measured before writing (at `15edfec`)
- The in-doubt card is filed at `scripts/gaffer_brain.mjs:2211` (`cardFile(line, "judge:in-doubt:<capture id>", …)`), only when a re-dispatch could not resolve; a resolve pushes to `resolved` at `:2206` and touches no card.
- `cardFile` is the one spawn of the card owner, `scripts/gaffer_brain.mjs:2155-2160` (`captains_call.mjs file --line --key --why-code-cannot-decide`).
- The card owner has NO verb that retires a hand-filed card by key: its modes are `sync · deal · answer · file · status · list · reline` (`scripts/captains_call.mjs:1600-1805`); `reline` refuses a non-rolling key (`:1553`) and never retires. Every retire-at-source it has lives inside `deriveCards` for derived sources (`:446-686`), none for `hand-filed`.
- `fileGuard` (`scripts/captains_call.mjs:1477-1488`) mints nothing for a key ever seen, live or settled — so a retired in-doubt card is never re-minted under its key.
- The only path that settles an in-doubt capture is the mjd4 loop (`scripts/gaffer_brain.mjs:2193-2213`): `inDoubtGrades` excludes it from `outstandingGrades` (`:1420`), so no batch can settle it.

## What was built
| Ruled | Where |
|---|---|
| a door of the card owner that retires at source | `captains_call.mjs` `retireCard` (pure, exported) + the `retire --key <k> --why "…"` verb: only a key of the declared class `RETIRE_AT_SOURCE_KEYS` (`judge:in-doubt:<id>`; a class joins only by a row), only a LIVE card (his word is history), never mints; no card under the key or an already-settled card = a named no-op, exit 0, nothing written; refusals exit 1, nothing written |
| when the capture resolves, its card retires in the same act | `gaffer_brain.mjs`: the moment its settled row lands (owner wrote it now, or already had it under `--idem` — landed once either way), `cardRetire("judge:in-doubt:<id>", …)` runs through the owner's CLI; its answer rides the receipt as `resolved_in_doubt[].card_retired` |
| the xray sink count does not rise | `cardFile` and `cardRetire` share ONE `execFileSync` of `captains_call.mjs` (`cardsOwner`); `deps.retireCard` is the seam, as `deps.fileCard` is |

## Witness, both ways — `node ci/mjd5/witness_mjd5.mjs --org <tree> --base-org <tree>`
The REAL judge round (gradeJudge), the REAL `captains_call.mjs file`/`retire` (the round's own default spawn, the deck planted
under the temp dir through `ARSENAL_CALL_STATE_DIR`) and the REAL `capture.mjs rep` run in a copy of each tree.
Trees: LF `git archive` of `15edfec` (base) and of the build commit.

- Build vs base (`ci/mjd5/out/witness_build.txt`): R1 · R3 · R2 · BOUND · LAST GREEN —
  `GREEN MJD5 the in-doubt card retires at source when its capture resolves, once · 5 clause(s)`
- Base vs base (`ci/mjd5/out/witness_base.txt`): `RED MJD5 · R1 R3 R2` — R1: three live in-doubt cards after every capture
  resolved; R3: no card ever carries a retire epitaph; R2: three live cards where only the refused capture's should stand.

| Clause | Plant |
|---|---|
| R1 resolved | refused twice (three cards), then every owner through → no live card under any of the three keys |
| R2 still in doubt | refused twice, then one capture refused and two through → exactly one live in-doubt card, the refused one's, same id |
| R3 second resolve | after R1: a round 4 and a second `retire` of the same key → deck bytes unmoved, each card retired once with the round-3 epitaph |

## Mutants — `node ci/mjd5/run_mutants_mjd5.mjs --org <build> --base-org <base>` (`ci/mjd5/out/run_mutants.txt`)
`run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN` — R1 (the round never calls the door),
R2 (it retires every re-dispatched capture, resolved or not), R3 (the door re-retires a settled card), BOUND (a third file
touched), LAST (the door leaves a node process naming its tree; the runner kills it after the witness named it).

## Gates (measured 18 Nov 2026, this container)
- `node scripts/captains_call.mjs selftest`: base `captains_call selftest: 142 passed, 0 failed` → build `captains_call selftest: 147 passed, 0 failed` (five AT-SOURCE RETIRE asserts added; none removed)
- `node scripts/gaffer_brain.mjs selftest`: base `gaffer_brain selftest: 194 passed, 0 failed` → build `gaffer_brain selftest: 194 passed, 0 failed`
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in the repo checkout, measured 18 Nov 2026: base scripts and build scripts read the SAME headline, `organism_test: 139 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126` — the one red is `EVERY organ with a selftest is wired into a suite` (orphaned: home_pin, probe, study_scope), on the base too, outside this unit's files
- `node scripts/models.mjs check` exit 0

## FORKS
1. **A retire that fails is named, not retried.** If the card owner's spawn fails after the settled row landed, the capture is
   no longer in doubt, so no later round re-tries the retire: the card stays live until his answer. The failure is on the
   receipt (`card_retired.ok:false` + error). Closing it needs a sweep (a settled `resolved_from:"in-doubt"` row whose card is
   live) — a reading of captains_call.json by gaffer_brain or a derived source in captains_call; a separate unit.
2. **The retire spawn is not charged to the round's budget**, the same as `cardFile` today (`budget` gates only the owner
   dispatch). It is one local spawn per capture resolved from doubt, bounded by `JUDGE_DISPATCH_MS` like every owner call.
3. **One spawn per resolved capture even when no card was ever filed** (a capture resolved by the first round after its kill):
   the door answers a no-op. Avoiding it needs gaffer_brain to read the deck; left as is, because the ruling routes through the owner.
4. **The doubtminer retire path stays RED BY NAME** (mjd4 FORK 1): unwitnessed until a capsule-dir seam unit; not in scope.
5. The witness runs on LF `git archive` trees with the repo's `node_modules` linked in (gaffer_brain imports `acorn`); the
   suite's archive-tree run reads extra reds that need `.git` (the same five on base and build), so the suite headline above is
   the repo-checkout run.
