# UNIT mshard · BUILD PROOF (forks rows 1171 (3) / 1188)

Branch `claude/mshard-build`, cut 20 Nov 2026 from `origin/main` = **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**
(`git fetch origin main` → `FETCH_HEAD`; `ci/mshard/BASE` holds it). Spec: `ci/mshard/MSHARD_SPEC.md` on
`claude/mshard-spec` at c82a0e6, read whole with its ledger, and `ci/mdtl/MDTL_SPEC.md` on `claude/mdtl-spec` at 9d5c9b8
(the cause channel). **Where the spec and row 1188 differ, the ruling won; every difference is in §1.** Nothing here is
landed, nothing is merged into main, and no state file was read into or written by this unit. Every measurement below
is dated 20 Nov 2026 and named by its command. The act-by-act record is `ci/mshard/LEDGER.jsonl`.

## 0 · THE FILES (BOUND: only these differ from 5759cce)

`.github/workflows/suite.yml` · `scripts/organism_test.mjs` · `scripts/ci_verdict.mjs` · `ci/mshard/BASE` ·
`ci/mshard/witness_mshard.mjs` · `ci/mshard/run_mutants_mshard.mjs` · `ci/mshard/TIMES` · `ci/mshard/PROOF.md` ·
`ci/mshard/LEDGER.jsonl`. The witness's BOUND clause checks it (§2).

## 1 · WHAT WAS BUILT, CLAUSE BY CLAUSE OF ROW 1188

- **F-SHAPE B** · `witnessPlan(units, n, times)` in organism_test.mjs: LPT, the heaviest unit first onto the lightest
  shard, a tie to the lower k. A unit absent from the table weighs the mean of the table's rows over the tree's units
  (derived; equal weights when the table is empty), and a row naming no unit is reported as `stale` and ignored. The
  plan depends on the head tree's `witnessUnits`, K and the table only. It reads no diff and no merge base (W-S12).
  Over `ci/mshard/TIMES` the plan of main's 38 units reproduces the spec's M7 LPT reading:
  ```
  node scripts/organism_test.mjs witness-plan   (20 Nov 2026, the 38 units of 5759cce)
  → shard seconds 712.0 / 709.0 / 709.5 (3 / 17 / 18 units) · unknown none · stale none
  ```
  With this unit's own witness on the branch, `mshard` is the one unknown unit and weighs the table's mean.
- **F-K b, and its condition: read the account's concurrent-job limit first.** The documented limit is not readable
  from this container: `curl https://docs.github.com/en/actions/reference/limits` answered `000`, and the docs reader
  agent got `ENOTFOUND docs.github.com`. **So the limit was read off the account itself**, from every live run's jobs
  through the public API:
  ```
  2026-11-20T06:57:14.577Z jobs by status across live runs {"in_progress":20,"completed":1,"queued":21}
  ```
  Twenty jobs run and twenty-one wait, so **the account's concurrent-job limit reads 20**. One K=3 push asks for
  2 suite + 6 shard jobs = 8 at once (then 2 folds), and 8 ≤ 20. **K stays three; it does not drop to two.** K lives in
  ONE place, the `shard: [1, 2, 3]` list of suite.yml. organism_test.mjs reads its length and never types it (W-S21).
  Dropping to two is a one-line edit of that list. The spec-time overlap reading (`peak running at once 30`, ledger row
  `concurrency`) is **retracted as a limit reading**: the overlap of started/completed windows over-counts (a cancelled
  job keeps a started time). The live saturation reading stands. What it costs: the fleet already saturates the 20.
  While this unit was built, all eight of its jobs queued behind other branches' runs. A queued job has not started, so
  its `timeout-minutes` has not started either, and the fold waits unstarted on `needs`. Queueing lengthens the wall
  clock and never the bound. It is still open question Q1.
- **F-JOB J2** · three jobs per node: `suite · node N` (today's steps; its head step carries
  `ORGANISM_WITNESS_SHARDS: plan`, so the witnesses member prints ONE `WITNESS_PLAN` line and spawns nothing) ·
  `witnesses · node N · shard k` (`ORGANISM_WITNESS_SHARD: ${{ matrix.shard }}`, `organism_test.mjs witnesses`) ·
  `npm test · node N`, **the fold, keeping the leg's name**, `needs: [suite, witnesses]`, `if: ${{ !cancelled() }}`.
  `ci_verdict.mjs <sha>` reads ONE verdict per leg exactly as before. `pickLegs`, `readVerdict` and `REQUIRED_LEGS` are
  unchanged. The selftest now checks that EVERY `node:` list equals REQUIRED_LEGS and that exactly one job is named like
  a leg (W-S11).
- **F-CARRY a** · `actions/upload-artifact@v4` / `download-artifact@v4`, digests only. `ci_verdict.mjs digest` picks
  every key by name and checks every value's type. It drops `unruled[].detail` and every printed line, and a key it
  does not name never travels. The fold reads the base's own instrument from its OWN clone by the base sha
  (`git show <base>:scripts/organism_test.mjs`), so no source file is carried. **The condition's measurement, a
  signed-out read of the carried digests, is §5: it needs a completed run of this branch.**
- **F-TABLE a** · `node scripts/ci_verdict.mjs times <sha>` prints the table from the fold payloads' `shards[].secs`
  (one map per leg, the largest per unit). `times --from-log <job log>…` prints it from B5 lines. The seat redirects it
  into `ci/mshard/TIMES`, and the suite never reaches the network. This branch's table was printed from the six green
  job logs the spec measured (5759cce 135919452425 / 135919452846 / 135886176499 / 135886177254, 179a0ee 135776070753 /
  135776071204), because no fold payload exists on main yet. After landing, `times <sha>` is the source.
- **F-ORDER a** · built from main alone. ms2 merges main after this lands. Its `for (const unit of units)` loop is the
  same seam, and `units` is now the shard's slice.
- **F-UNSHARDED a** · both doors unset = today's member, byte for byte (W-S14, a guard, GREEN on both trees).
- **(2) THE FOLD LOSES NOTHING** · `mergeParts(head, parts)`: the suite job's reds, then every part's reds, by the same
  names; pass and fail summed. Each of these is a red BY NAME and never a pass: a missing shard (`WITNESS SHARD k/n ·
  produced its machine line (unit mshard)`, plus each unit the plan gave it), a doubled part, a part naming another
  head or another n, a unit that is planned twice, planned in the wrong shard, never judged, or missing from every part
  (`WITNESS ‹u› · judged in exactly one shard (unit mshard)`), and parts with no plan line. A plan line with no part at
  all is red for every shard (W-S7). **mdtl's cause channel rides through**: `parseSuite` reads `causes`, `digest`
  keeps it (strings only), and `mergeParts` concatenates the suite job's and then each part's, in order (W-S18).
- **The bound of 60 minutes is not raised.** Every job carries the one `timeout-minutes`, all equal and none above the
  base's. That is a ci_verdict selftest law (`workflowLaws`) and W-S10.

**Where the build departs from the spec's text (the ruling and the measured seams won):**
1. The door is `ORGANISM_WITNESS_SHARD=<k>` or `<k>/<n>`, and the plan door is `ORGANISM_WITNESS_SHARDS=plan` or `<n>`.
   n is always read from the `shard:` list, so the workflow never types K twice.
2. **The doors never reach a spawned witness's env** (W-S16, not in the spec). Without this, every witness that runs
   the member inside its own plant (ms1, mrv, mf2 and others; `grep -ln organism_test.mjs ci/*/witness_*.mjs`) would
   meet a SHARDED member in its plant and go red on the neutral machine.
3. The member keeps reading the FIRST `timeout-minutes` (code unchanged). "The bound of the job it runs in" holds
   because every job's bound is equal, and that equality is enforced. This keeps ms1's B5.3 HANG plant, which rewrites
   only the first bound to 1, meaning what it meant (fork (ii), §6).
4. The base instrument is read from the fold's own clone and never carried. The spec carried it in the base digest.
5. The plan clause ids avoid the word BOUND (`W-S10 ONEBOUND`): the member's `boundIds` drops every literal
   `"<ID> BOUND"` of a witness's source as seat-time, so a clause named `W-S10 BOUND` would never be judged.
6. Seven clauses beyond the spec's fourteen: W-S15 LPT, W-S16 DOORLESS, W-S17 PLANRUN, W-S18 CAUSE, W-S19 TIMES,
   W-S20 WIRING, W-S21 KREAD.

## 2 · THE WITNESS BOTH WAYS (LF exports of each commit under the temp dir, this container, Linux, 20 Nov 2026)

```
node ci/mshard/witness_mshard.mjs --org <build> --base-org <5759cce>
→ GREEN MSHARD the witnesses member split across jobs, folded by name · 23 clause(s)
node ci/mshard/witness_mshard.mjs --org <5759cce> --base-org <5759cce>
→ RED MSHARD · W-S1 PLAN, W-S2 COVER, W-S3 UNJUDGED, W-S4 DOUBLE, W-S5 EQUIV, W-S6 SHA, W-S7 FAILCLOSED, W-S8 SHARDRUN,
  W-S9 BADDOOR, W-S10 ONEBOUND, W-S11 LEGNAME, W-S12 HEADALL, W-S13 PRIVACY, W-S15 LPT, W-S16 DOORLESS, W-S17 PLANRUN,
  W-S18 CAUSE, W-S19 TIMES, W-S20 WIRING, W-S21 KREAD
```
Every non-guard clause is RED at base and GREEN at the build. W-S14 (the guard) is GREEN on both, and so are BOUND
(only the named files differ) and LAST (no node process naming the temp dir survives). The witness binds no port, names
no live service and plants every tree under `os.tmpdir()` with `core.autocrlf=false`. It uses node and git only, with
no POSIX shell, and reads its bound from the tree's suite.yml. Its Windows run is the neutral machine's: this unit's own
witness is one of the units the shard jobs judge (§5).

## 3 · THE MUTANTS

```
node ci/mshard/run_mutants_mshard.mjs --org <build> --base-org <5759cce>   (20 Nov 2026)
→ run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN
```
One mutant per clause, each RED by exactly the clause that names it (`RED MSHARD · <clause>`). BOUND and LAST are
seat-time clauses and carry none.

## 4 · SELFTESTS, MEMBER LINES, MODELS, LAW-PACK COUNTS (before = 5759cce, after = the build; 20 Nov 2026)

```
node scripts/ci_verdict.mjs selftest
  before → ci_verdict selftest: 21 passed, 0 failed · ALL CHECKS PASSED
  after  → ci_verdict selftest: 33 passed, 0 failed · ALL CHECKS PASSED
node scripts/organism_test.mjs selftest   (both) → organism_test is itself the test suite — run `node scripts/organism_test.mjs all`
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   (this checkout; the base reading is the spec seat's, ledger hermetic-base)
  before → organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
  after  → organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
  (the one red on both: EVERY organ with a selftest is wired into a suite, the base's own, on Linux)
  in git worktrees of each sha (both sides, the same three reds: the coverage law, sandbox selftest, the hermetic roll-up)
  before → organism_test: 147 passed, 3 failed · after → organism_test: 147 passed, 3 failed
member lines touched (both sides, identical):
  ok   SUITE MEMBER · ci_verdict selftest exits 0
  SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2): a witness may bind ports
node scripts/models.mjs check   (both) → models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0) · exit 0
node scripts/lawpack.mjs gate   (LF exports, node_modules linked)
  before → lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
  after  → lawpack · 1945 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
node scripts/gates.mjs   (LF exports)
  before → TYPE COUNT 298 checkJs diagnostics · LINT no-empty 272 · no-unused-vars 85
  after  → TYPE COUNT 298 checkJs diagnostics · LINT no-empty 272 · no-unused-vars 85
```
**No count rose.** The build's first cut raised two counts, and both were removed at their cause, never by an ignore
line: `jugad-literal-subject-list` 93 → 94 came from the literal door list `SHARD_DOORS`, now the predicate
`isShardDoor`; checkJs 298 → 302 came from parseSuite's JSDoc return type, which lacked `causes` and now names it
(ledger rows `lawpack-build-first` and `gates-types`). The base's own over-baseline reds (gates' lint and type ratchets,
lawpack's jugad 93 against the frozen 90) are the base's, unchanged here.

## 5 · THE NEUTRAL MACHINE (the public API through curl, no token sent by this seat)

Every push of this branch so far queued all eight of its jobs behind the fleet (§1, F-K b), and each newer push
cancelled the older run (`cancel-in-progress`): 058f8e1 run jobs 136133817751…136133818248 and 579ae3e jobs
136136021676…136136022210 queued at 06:46:28Z and 06:52:18Z. **The verdict of record is the verdict of this proof's
tip**, read once per leg with `node scripts/ci_verdict.mjs <sha>` (curl when it answers 403 from this container). It
is recorded in the ledger row `ci-verdict` of the next push and in the seat's final message. The F-CARRY signed-out
read of the digests is measured on that same run: `GET /actions/runs/<id>/artifacts` anonymously, then the archive of
one digest, checked with `namesAndNumbers`.

## 6 · FORKS (measured and named, not edited)

- **(i) the flow atlas** (spec §9 (i)). Measured in LF exports under the temp dir (`node scripts/xray.mjs build && node
  scripts/flow_atlas.mjs check`, 20 Nov 2026): base `xray: 138 organs · 421 files · 2060 unresolved`, derived
  ee7bceb64d234e9e; build `… 2062 unresolved`, derived 540f50a67d9abdc8. Both read `STALE` against the tracked
  77675fe0b19c16c3, so the atlas is already stale at base in this container. The derived graph moves with the two
  scripts. Its rebuild belongs to `flow_atlas.mjs` (its sole writer), on his laptop: the atlas member is LIVE under
  hermetic. Not edited.
- **(ii) `ci/ms1/witness_ms1.mjs`** (spec §9 (ii)). Measured: `node ci/ms1/witness_ms1.mjs --org <build> --base-org
  <ci/ms1/BASE 224f9b9>` → `RED MS1 · BOUND`, the same last line as the same command on 5759cce, with the same number of
  passing clauses on each side. BOUND is seat-time, and the member drops it. Every behavioural clause of ms1, B5.3 HANG
  included, is GREEN on the build, because the member still reads the first `timeout-minutes` and every job's bound is
  equal. No edit needed.
- **(iii) unit mdtl, whichever lands second adapts.** mshard lands first (F-ORDER a), so mdtl adapts. Both edit
  `parseSuite`'s return (mdtl adds `causes`, and so does mshard), so mdtl's merge of main keeps ONE `causes` read. mdtl's
  `compareLines` cause annotations read `head.causes`, which is the folded suite's: they work unchanged. mdtl's witness
  reads the names-only grep from suite.yml. That grep now appears twice (the suite head step and the shard step) and is
  byte-identical, so its D2 channel is the union of both and reads the same regex.
- **(iv) the fleet's queue** (F-K b). Eight jobs per push instead of two, on an account whose limit reads 20 and which
  the fleet already saturates. This is a cost in wall clock, never in the bound. It is open question Q1.
- **(v) artifact retention**: the repository default (no `retention-days` typed: the brief forbids typing a time).
  Digests are names and numbers. Q2 asks whether a shorter retention is wanted.

## 7 · OPEN QUESTIONS FOR THE ARCHITECT

- **Q1** · Under a fleet that saturates the 20 concurrent jobs, should mshard stay at K=3 (8 jobs per push, the 712 s
  shard) or drop to K=2 (6 jobs, the 1066 s shard), which the ruling's condition does not require?
- **Q2** · Artifact retention for the digests: the repository default, or a ruled shorter one?
- **Q3** · `times <sha>` after landing: which seat refreshes `ci/mshard/TIMES`, and when? A stale table only unbalances
  the shards and never drops a unit, because coverage is judged from `witnessUnits`.
