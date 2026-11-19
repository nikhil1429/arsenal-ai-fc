# UNIT mpin-law (mpinl) · PROOF

Seat 2 of 3 under forks row 1160 (2). It builds the law that holds the own-literal pin class by a count, in `scripts/lawpack.mjs`.
Branch `claude/mpinl-build`. The work tip is **579b0ef9c4052bd54be32f3038fb3a1b39a558b0**; the commit after it carries only this
proof and the ledger. Every number below is a command's printed line, dated 19 Nov 2026, or sits in a fence.

The run was stopped at his pause (#269) after e96a143. It resumed on his word (#270) from that checkpoint: the build witness
first, then the mutants.
The checkpoint line itself is kept in `ci/mpinl/LEDGER.jsonl`.

## BASE
- Cut from origin/main **fb4211870093e6b8657655eb02ebcfc425f1eab1** (`ci/mpinl/BASE`). That is the floor fb42118 named in the
  brief, measured as main's tip at the cut. Main already carries mcon's landing (980e953, the conductor repair).
- Every measurement used two LF clones under /tmp (`git clone -c core.autocrlf=false`), with `npm ci` on the base and the
  build borrowing the base's node_modules:
  - base = fb42118;
  - build = the branch tip.

## NAMED FILES
- `scripts/lawpack.mjs`
- `ci/mpinl/`:
  - `BASE` · `LEDGER.jsonl` · `PROOF.md`
  - `witness_mpinl.mjs` · `run_mutants_mpinl.mjs`
  - `instruments/census_mcon.mjs`: verbatim from 4c4feb8, blob 02bb94b
  - `instruments/classify_mpin.mjs`: verbatim from fb7c6b2, blob c6ac462
- Nothing else differs from the base (witness clause BOUND: `7 file(s) differ from --base-org · beyond the named files: none`).
- `.claude/settings.json` is not touched. Neither is `dressing-room/state`, nor `scripts/own_source.mjs`, which is mpin-read's.

## WHAT WAS BUILT (spec Q3 L1-L9, with the ruling's differences)

### The judge
- `ownLiteralPins({root, dirs, kit})` is a new export. It ports mcon's census definition from 4c4feb8:
  `isSelfPath`, `range`, `selfSatisfied`, and the walk with its ancestors.
- It uses the pack's own lazy `acornKit()`.
- Text is read with CRLF folded.

### The two keys on the machine line (row 1160 (4), F6 C)
- **`own-literal-pin`** counts pins whose subject covers the pin's own literal.
- **`own-source-pin-unresolved`** counts self-source pins whose range the evaluator does not resolve (F6 b).
  - A site that declares `law-waiver:own-literal-pin` is listed as waived and not counted. That is the pack's existing
    `WAIVER()` form.
- **F6 (a):** the whole-line-comment filter is now a resolved range. The shape is
  `S.split("\n" | /\r?\n/).filter((l) => !/re/.test(l)).join("\n")`.
  - That resolves `scripts/mutagen.mjs:967`.
  - Any other predicate stays unresolved.
- The "own-assert" kind is listed and never counted, as in the census.

### Dead and blind instrument
- With no acorn, `judgeMeasured` prints `INSTRUMENT DEAD — own-literal census`.
- When a walked file does not parse, it prints `INSTRUMENT BLIND — own-literal census`.
- In both cases neither key prints a FALL.

### The baseline (row 1160 (2))
- Read from the tree by the law itself, `node scripts/lawpack.mjs report` on the build (19 Nov 2026):
  `own-literal census · walk scripts+hooks · 140 file(s) · own-literal 39 · unresolved 77 · own-assert 1 (listed) · waived 0 · parse errors 0`
- It is frozen as `"own-literal-pin": 39`, `"own-source-pin-unresolved": 77`.
- **39** is mcon's census 38 on this base plus mutagen:967. **77** is mcon's 78 minus that one site.
- A multiset compare of the judge's lists against mcon's census `--json` on the base found exactly one difference: mutagen:967
  moved from unresolved to own-literal.

### The walk, F7 (row 1160 (5))
- Census over `ci/` on the main I cut from, `node ci/mcon/census_mcon.mjs --org <fb42118 clone>/ci --modules <clone>` (19 Nov 2026):
  `CENSUS MCON · 0 own-literal pin(s) in 0 assert(s) · 0 own-assert · 0 unresolved · 2 file(s) walked`
- **Branch: zero hits, so the walk stays scripts plus hooks.**
- The witness clause F7 re-reads this on the tree it judges. At landing, one or more hits there turns RED and sends the walk
  back to take `ci/`.

### The report and the selftest
- `report` prints the census line plus the OWN-LITERAL PIN and OWN-SOURCE PIN UNRESOLVED lists.
- The selftest's 4d block plants 4 RED and 6 CLEAN files, both ways, in a throwaway tree.
- It also covers CRLF, BLIND, DEAD, and measure() carrying both keys.
- The RATCHET loop over `BASELINE` covers the two new keys with no new code.

## THE WITNESS, BOTH WAYS (`node ci/mpinl/witness_mpinl.mjs --org <tree> --base-org <base clone> --modules <base clone>`)

```
BASE  (org = base fb42118, 19 Nov 2026):   RED MPINL · W1, W1u, W2, W2u, W3, W4, W5, W6, F7                         (exit 1)
BUILD (org = build 579b0ef, 19 Nov 2026):  GREEN MPINL the own-literal pin class held by a count, its baseline the tree's own read · 11 clause(s)   (exit 0)
```

What the build run measured, clause by clause (19 Nov 2026):

```
W1  own-literal-pin 39 on the machine line · classifier same-shape 39 over scripts+hooks · sites equal, file:line by file:line
W1u own-source-pin-unresolved 77 · census unresolved over scripts+hooks minus the classifier's same-shape among them = 77 · waived 0 · sites equal
W2  planted +1 whole-file pin → own-literal-pin 40 (was 39) · RED own-literal-pin ROSE — 40, baseline 39
W2u planted +1 unresolved and +1 waived → 78 (was 77; exactly +1, so the waiver held) · RED own-source-pin-unresolved ROSE — 78, baseline 77
W3  acorn hidden (a resolver preload) → RED INSTRUMENT DEAD — own-literal census · FALL lines for the two keys: 0
W4  frozen 39 vs read 39 · frozen 77 vs read 77
W5  5 clean plants → zero pins of any kind · the real tree's concatenated needle as a finding: 0
W6  kept line → own-literal:7 · dropped line → nothing · other predicate → unresolved:7
F7  census over ci/ (ci/mpinl excluded) → 0 hit(s) in 2 file(s) · the law's walk: scripts+hooks
BOUND 7 file(s) differ from --base-org · beyond the named files: none
LAST  no node process names the temp root
```

- The witness reads the machine line's keys, never the gate's exit. The gate is RED on both trees for mlaw's reasons (below).
- **No port is bound.**
- **No timeout is typed.** Every child is bounded by `WITNESS_TIMEOUT_MS` from `scripts/rung_receipt.mjs`, which reads
  postmatch's `CHILD_TIMEOUT_MS`.
- Each copy is made a git repo by `git init` with core.autocrlf=false.

## THE MUTANTS (`node ci/mpinl/run_mutants_mpinl.mjs --org <build clone> --base-org <base clone> --modules <base clone>`, 19 Nov 2026)

```
KILLED W1    the key dropped from counts                                  → RED MPINL · W1
KILLED W1u   the unresolved key also counts the listed own-assert         → RED MPINL · W1u
KILLED W2    judge() skips the key                                        → RED MPINL · W2
KILLED W2u   every unresolved site read as waived                         → RED MPINL · W2u
KILLED W3    the dead branch returns a live 0                             → RED MPINL · W3
KILLED W4    the baseline typed one higher than the tree's read           → RED MPINL · W4
KILLED W5    range() treats any call on a self path as the whole file     → RED MPINL · W5
KILLED W6    the comment filter read as not-self                          → RED MPINL · W6
KILLED F7    the walk loses hooks/                                        → RED MPINL · F7
KILLED BOUND a file beyond the named set edited                           → RED MPINL · BOUND
KILLED LAST  the witness leaves a node child naming the temp root         → RED MPINL · LAST
control → GREEN MPINL … · 11 clause(s)
run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN
```

## THE TOUCHED SELFTEST, BEFORE AND AFTER (`node scripts/lawpack.mjs selftest`, LF clones, 19 Nov 2026)
- base fb42118: `lawpack selftest: 78 passed, 0 failed`
- build 579b0ef: `lawpack selftest: 89 passed, 0 failed`

## THE MEMBER LINES TOUCHED (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026)

The hermetic profile names lawpack's two members and does not run them:
- `LIVE selftest lawpack — not run in the hermetic profile`
- `LIVE MODE lawpack — not run in the hermetic profile`

Both lines read the same on base and build, so I ran each member's command directly. The selftest is above; the gate is below.

```
base  fb42118: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
build 579b0ef: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```

The three reds are the same on both trees, and none is this unit's:
- the selftest-coverage law (orphaned: deck_lint, home_pin, probe, study_scope);
- the sandbox member;
- the hermetic roll-up.

## THE LAW PACK COUNTS (row 1130 (2); `node scripts/lawpack.mjs gate`, LF clones, 19 Nov 2026)

```
BASE  fb42118: lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD 579b0ef: lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · own-literal-pin 39 · own-source-pin-unresolved 77 · depcruise_errors 13
both:          lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)   (jugad 93 vs 90 · depcruise 13 vs 7 — mlaw's F2, on base already)
```

- **No count rose.**
- The first draft of the law raised the raw-match count 1933 → 1937. The cause was four empty `const x = []` shapes in the new
  code, which the jugad rule matches raw. All four were removed at the cause by restructuring the code. No ignore line was
  added.
- `node scripts/gates.mjs` (19 Nov 2026) prints the same lines on both trees: tsc diagnostics 297, no-empty 268,
  no-unused-vars 85, `gates: 3 RED` (all three are the base's). `tsc` reports nothing in `scripts/lawpack.mjs`.
- **`node scripts/models.mjs check`, build 579b0ef (19 Nov 2026): exit 0** (`hits 0 · declared 0`).

## THE NEUTRAL MACHINE (anonymous `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)
- 1106834 (BASE + first ledger): run 44524179344 · node 22 135560274782 `success` · node 24 135560274144 `success`.
- 0291f61 (the law): run 44525206584 · both legs `cancelled`. The next push superseded it, so the run never finished.
- e96a143 (witness, checkpoint): run 44525775058 · node 22 135565865217 `success` · node 24 135565865711 `success`.
- 579b0ef (mutants, the work tip): run 44585680575 · node 22 135777831176 · node 24 135777831564. Both read
  `in_progress`/`queued` when this was written. Their verdict is in LEDGER.jsonl and the final message, read by
  `node scripts/ci_verdict.mjs <full sha>`.

## WHERE THE SPEC AND THE RULING DIFFER (the ruling wins; each one named)
1. **Baseline (row 1160 (2) vs spec F2).**
   - The spec recommended freezing at the count after mcon (38).
   - The ruling reads it from the tree at the law's landing. This tree reads 39, because F6 (a) resolves mutagen:967.
   - Witness W4 re-reads it on whatever tree it judges.
2. **F6 C (vs the spec's L1, which ports range() verbatim).**
   - range() gains the whole-line-comment filter.
   - The second key `own-source-pin-unresolved` is frozen with its waiver form.
3. **F7 branch (row 1160 (5) vs spec F7 "recommend (a)").** Decided by a census run, not a recommendation: zero hits, so
   scripts plus hooks.
4. **Spec W1** compares n with classify_mpin over the whole tree. Here the compare runs over the law's own walk
   (scripts + hooks), because `ci/` is F7's question. The copied instruments in `ci/mpinl/` never land.
5. **Spec W5's acorn plant** became W5 (clean) plus W6 (F6 a, both ways). Neither the spec nor the ruling asked for W6; it
   exists because F6 C adds behaviour.

## FORKS (files beyond the named set, or a choice the architect may want back)
- **FK1 · the witness bound.**
  - Row 1160 (1) puts the ONE named bound for new selftest child runs in `scripts/own_source.mjs`, which is mpin-read's file
    and is not on main.
  - This unit adds no selftest child run: lawpack's 4d block spawns nothing.
  - The witness's own children are bounded by `WITNESS_TIMEOUT_MS` (`scripts/rung_receipt.mjs`), an existing exported bound.
  - Should it switch to own_source's bound once mpin-read lands?
- **FK2 · F7 excludes `ci/mpinl`.** The F7 clause leaves this unit's own `ci/mpinl` out of the census over `ci/`, because a
  seat's ci dir never lands. On a land tree `ci/mpinl` is absent, so the exclusion has no effect there.
- **FK3 · a lower count lands first.** Suppose mpin-read or mpin-narrow lands before this law. Then the frozen 39 / 77 sits
  above the land tree's count:
  - the gate prints a FALL, which is green;
  - W4 reads RED until the number is re-read from the land tree.
  That is the ruling's "read from the tree at its own landing". Re-reading it is one edit to two numbers in `BASELINE`, and
  this seat cannot make it in advance.
- **FK4 · the lawpack selftest is slower.**
  - base 2.1 s → build 9.5 s (`time node scripts/lawpack.mjs selftest`, 19 Nov 2026). The selftest's existing injected
    `measure()` calls now also run the real census over the repo.
  - No bound is near it. The suite runs lawpack under its own existing timeout.
  - Injecting a stub `olpFn` into those calls would make it faster again, but would change their inputs.
- **FK5 · the effort receipt.** The brief's command names `campaign-2026-09/tools/effort_receipt.mjs`, which this repository
  does not carry. Its error is in the final message, and nothing is written under `campaign-2026-09/`.

## NAMED, NOT MEASURED
- **Windows.** Several pieces are written for Windows and were not run on it:
  - the junction link, PowerShell's process list, CRLF folding, and the `--import` preload given as a file URL;
  - the selftest's CRLF plant ran on Linux.
  To measure, run the witness line above on his laptop.
