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

**MEASURED on 015d785 (run 44692270968, curl, no token, 20 Nov 2026 08:16Z).** `ci_verdict.mjs 015d785` answers
`UNREADABLE … answered 403` from this container, so the check runs were read through curl: all ten are completed/success.
They are `npm test · node 22` 136160474956 and `npm test · node 24` 136160474961 (the fold legs, J2 names),
`suite · node 22` 136140640240 and `suite · node 24` 136140639906, and `witnesses · node {22,24} · shard {1,2,3}`
136140640055 / 136140640294 / 136140640256 / 136140640146 / 136140640008 / 136140640211. F-CARRY, signed out:
`GET /actions/runs/44692270968/artifacts` lists 8 artifacts by name and size. The two suite digests are 8048 B each and the
six shard digests 392–503 B (`b1-node{22,24}-suite`, `b1-node{22,24}-shard{1,2,3}`). The archive download redirects to
`productionresultssa19.blob.core.windows.net`, which this container's egress proxy refuses (403), so **the content
check with `namesAndNumbers` on a downloaded digest is NOT measured here**. It stays open (§7). The whitelist is proved
by W-S13 PRIVACY instead.

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
- **Q4** · F-CARRY's signed-out content read: this container cannot reach the artifact blob host (proxy 403), so the
  download-and-`namesAndNumbers` half of the measurement needs a seat that can. Which seat, before landing?

## 8 · THE MERGE OF NEW MAIN cebe3eb (units mlaw + mcov), forks rows 1201 · 1187 (2) · 1181 (2) · 1200 (2)

Merge commit c68c56f (parents 7e4b95c · cebe3ebe4024c2144b934b3032b3fb837285d926), with a merge commit and no rebase. The two earlier
STOP lines in the LEDGER (3f22388, cebe3eb) were made under the runner's order that row 1201 withdrew. Git conflicted on ONE file,
`scripts/ci_verdict.mjs`, in five hunks. `scripts/organism_test.mjs` and `package.json` auto-merged; the organism:selftest line
took main's members unchanged, because mshard adds none. `ci/mshard/BASE` stays 5759cce (row 1200 (2)). Lines are those of the
resolved file.

| # | lines now | main meant (mlaw) | mshard meant | the result keeps both by |
|---|---|---|---|---|
| H1 | 56 | parseSuite's type gains `lawpack` | parseSuite's type gains `causes` (mdtl's channel) | the type names both fields |
| H2 | 57–179 | parseSuite returns `lawpack: parseLawpack(text)`; new `parseLawpack`, `lawpackRises` (a rise over the base is a NEW red by number) | parseSuite returns `causes`; new `machineLine`, `digest`, `namesAndNumbers`, `mergeParts` (the fold) | parseSuite returns both. mlaw's two functions are kept verbatim (70, 90), then mshard's block (100–179) |
| H3 | 233 | `compareLines(…, baseSrc, baseline)` passes the frozen baseline to `judge` | `compareLines(…, baseSrc, shards)` carries the fold's shard list into the payload | baseline stays the 7th positional argument (main's API as landed) and shards rides 8th; `judge(head, base, baseSrc, baseline)` |
| H4 | 472–483 | selftest: REQUIRED_LEGS equals the FIRST matrix line; frozenBaseline readable; legs derived both ways (planted) | selftest: REQUIRED_LEGS equals EVERY node list; workflowLaws; foldLaws | mshard's every-list check (it covers the first-list one) plus all of mlaw's plants, then mshard's laws |
| H5 | 500–503 | CLI compare: frozen baseline read only when the base has no law pack line | CLI compare: `--head-part` digests folded into ONE suite before the judge | the fold runs first, and mlaw's baseline rule then reads the FOLDED head; both go to compareLines |

**Beyond the markers.** Two textually clean pieces would have broken one intent each, so I kept both:

- **C1 · the digest drops the law pack (F-CARRY a × mlaw F3 A).** mshard's whitelist carried only the verdict, plan and shard
  lines. In CI, head.txt and base.txt are digests, so `ORGANISM_TEST_LAWPACK` would never have reached `judge`, and a rise would
  have passed unseen. Now `TAGS.lawpack` exists (101) and `digest` carries the line through mlaw's own `parseLawpack`
  filter, which gives `{law: n}`, names and numbers only (125). The sharded fold keeps `lawpack: head.lawpack` (179). A new fold
  law proves it (396): `fold × mlaw: … a rise is still a NEW red after the fold`.
- **C2 · legsOf reads the wrong job (mlaw F1 B × mshard F-JOB J2).** Main's `legsOf` took the FIRST `name: … ${{ matrix.node }}`
  line. Under mshard that line is `suite · node N`, which would derive REQUIRED_LEGS = `suite · node 22/24`, and the reader would
  then wait for legs that are not the fold. Now `legsOf` (252) takes the NAME from the job whose name derives the leg's form
  (`LEG`, already in the file, so nothing new is typed). The NODES stay mlaw's own read, the file's first node list, so mlaw's
  LEGS plant (on the first list) still gains a leg. The selftest holds every node list equal to REQUIRED_LEGS, so the two cannot
  part while the suite is green. Derived: `[ 'npm test · node 22', 'npm test · node 24' ]`.

**The bound against the parent (row 1200 (2)).** `witness_mshard.mjs` gains `--parent-org <tree>`. BOUND diffs against it,
while every clause still runs on `--base-org` (BASE). Without the flag, BOUND is judged against BASE, as before.

**Measured on the merged tree** (LF exports under os.tmpdir(): merged c68c56f + the resolution commit, base 5759cce, parent cebe3eb):
- witness `--org merged --base-org base --parent-org parent`: `GREEN MSHARD the witnesses member split across jobs, folded by name · 23 clause(s)`
  (BOUND · 9 file(s) differ from the parent, every one named · LAST · 0 survive)
- witness on base: `RED MSHARD · W-S1 PLAN, … W-S21 KREAD` (every clause but the guard). Without `--parent-org`, merged: `RED MSHARD · BOUND`
- mutants: `run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN`
- 20 Nov 2026 · `node scripts/ci_verdict.mjs selftest`: `ci_verdict selftest: 42 passed, 0 failed` (41 before C1's law; build before the merge: 33)
- mlaw's own witness (`ci/mlaw/witness_mlaw.mjs --base-org 5759cce`): merged `RED MLAW · BOUND` = parent cebe3eb `RED MLAW · BOUND`,
  with LEGS ok (planted +26 → 3 legs) and JUGAD ok (90 = frozen 90). Its BOUND is mlaw's own file set against ITS BASE, so it is red
  on any later tree. Before C2, merged read `RED MLAW · LEGS · JUGAD · BOUND`.
- 20 Nov 2026 · hermetic suite: merged `153 passed, 3 failed` = parent `153 passed, 3 failed`, with the same three reds by name (export-tree
  artifacts: no history, sandbox); the `ORGANISM_TEST_LAWPACK` line is byte-equal (md5 4a295a6b…). No count rose.
- `node scripts/models.mjs check`: exit 0.

## 9 · THE MERGE OF NEW MAIN 6a6bdff (unit mmeter), forks rows 1187 (2) · 1181 (2) · 1201 · 1200 (2)

Merge commit d43cff7 (parents 1a54f72 · 6a6bdfff4349b849398b69d0748b27d37c874b85), made as a merge commit with no rebase. **No
hunk conflicted**, so there is no hunk to name. `scripts/organism_test.mjs` merged automatically. main's new `clauses` mode
(`clauseWitnesses`, which walks `ci/witness/<unit>/`) is a member of the suite job's `all` and is separate from the `witnesses`
member that mshard shards. `ci/witness/` holds no `witness_witness.mjs`, so it is not a unit of the plan. `ci/mmeter` is a new
unit of the plan. `ci/mshard/BASE` stays 5759cce (row 1200 (2)).

Measured on 20 Nov 2026 on LF exports under os.tmpdir() (merged d43cff7, base 5759cce, parent 6a6bdff):
- witness `--org merged --base-org base --parent-org parent`: `GREEN MSHARD the witnesses member split across jobs, folded by name · 23 clause(s)`
  (BOUND · 9 file(s) differ from the parent, every one named)
- witness on base: `RED MSHARD · W-S1 PLAN, … W-S21 KREAD` (every clause but the guard)
- mutants: `run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN`
- 20 Nov 2026 · `ci_verdict selftest: 42 passed, 0 failed` · `models.mjs check` exit 0
- 20 Nov 2026 · hermetic suite: merged `155 passed, 3 failed` = parent `155 passed, 3 failed`, the same three reds by name, and the
  law pack line is byte-equal. No count rose.
- the plan: three shards of 9 / 16 / 17 units. `unknown` = mcov, mlaw, mmeter, mshard (no TIMES row yet, so each is weighed at
  the mean, never dropped). Q3 asks who refreshes TIMES after landing.

## 10 · THE MERGE OF NEW MAIN 5301f15 (units since 6a6bdff, mdtl's cause channel and mherm's hermetic-twice among them), forks rows 1232 (1) · 1200 (2) · 1215 (1)

A fresh seat checked out `claude/mshard-build` at 011c21d (`git checkout -b claude/mshard-build origin/claude/mshard-build`) and ran
`git merge origin/main`, giving merge commit **1f97532** (parents 011c21d · 5301f1582f7a1dbc9ec9605434c9db5d8bd19107). It is a merge commit, with no
rebase and no force push. Git conflicted in ONE file, `scripts/ci_verdict.mjs`, in six hunks. `suite.yml`, `organism_test.mjs` and
`package.json` auto-merged. Measured line by line (21 Nov 2026, this seat): every line that main or mshard ADDED since the merge base
6a6bdff and that is absent from the merge is one of the both-changed lines in the table below. For organism_test.mjs, suite.yml and
package.json that count is 0 on both sides. `ci/mshard/BASE` stays 5759cce (row 1200 (2)), and no BASE file is rewritten.

**The six hunks, each with main's text and mshard's** (line numbers are those of the resolved file at ed0cbed):

| # | lines now | main 5301f15 held | mshard 011c21d held | the merge carries both by |
|---|---|---|---|---|
| K1 | 22–35 | the header line `Annotations carry NAMES only …` extended with mdtl's paragraph (the cause rides its own NEW RED message and the payload, verifyCause, WITHHELD), and `// MODES: compare · selftest · <sha>` | the bare `Annotations carry NAMES only …` line, mshard's THE FOLD paragraph, and `// MODES: compare · digest · times · selftest · <sha>` | main's mdtl paragraph verbatim, then mshard's fold paragraph verbatim. MODES is the union `compare · digest · times · selftest · <sha>` |
| K2 | 60 | parseSuite's type `… profile: string, lawpack: Record<string, number> \| null, causes: string[] }` | `… profile: string, causes: string[], lawpack: Record<string, number> \| null }` | the same key set on both sides, so main's line is kept verbatim |
| K3 | 67–68 | parseSuite returns `…, lawpack: parseLawpack(text),` / `causes: Array.isArray(j.causes) ? … : [] };` | `…,` / `causes: …, lawpack: parseLawpack(text) };` | the same keys and values, so main's two lines are kept verbatim (the fold's `mergeParts` names both keys itself) |
| K4 | 236–261 | new `causesFor`, `workspaceSrc`, and `compareLines(…, baseline = null, readSrc = () => "")` with its JSDoc | `compareLines(…, baseline = null, shards = null)` | main's two functions and doc verbatim. **readSrc stays the 8th positional argument (main's API as landed) and `shards` rides 9th** (`readSrc = () => "", shards = null`), with one JSDoc line `@param … [shards]` added |
| K5 | 270–271 | the payload's `instrument: …, ...(Object.keys(cause).length ? { cause } : {}) };` | `instrument: …,` / `...(shards ? { shards } : {}) };` | main's line ends `{ cause } : {}),` and mshard's `...(shards ? { shards } : {}) };` follows, so the payload carries `cause` AND `shards` |
| K6 | 567 | CLI compare `… baseline, workspaceSrc);` | `… baseline, folded.shards);` | `… baseline, workspaceSrc, folded.shards);`. The fold runs first, then mdtl's verified causes are read off the FOLDED head (`head.causes`, which mergeParts sums over the suite job and every part) |

The reader's line `const why = …` (mdtl) and the selftest's mdtl plants merged without a conflict, and they read the folded payload unchanged.

**Beyond the markers.** Three textually clean pieces would each have broken one intent, so each now carries both:

- **C3 · ONEBOUND × mherm's `hermetic-twice` job** (ci_verdict.mjs 391–410, witness W-S10). Main landed a fourth job, `hermetic twice ·
  node N` (unit mherm), with NO `timeout-minutes`: it runs the whole hermetic suite twice, each run bounded by the leg's own bound
  read from suite.yml. mshard's `workflowLaws` and W-S10 read "every job of suite.yml carries ONE timeout-minutes, all equal", and
  went red on it (selftest `47 passed, 1 failed`, measured 21 Nov 2026). Adding a bound to main's job would cut its double run, and the
  brief forbids typing a timeout, so main's job is untouched. The law now judges **the jobs that make the leg**: `legJobs(wf)` returns the
  job named like a leg (the fold) plus every job its `needs:` names. Each must carry exactly one timeout-minutes, all equal, and (W-S10)
  none above the base's. A selftest plant holds it both ways: a job outside the leg with no bound holds, and a needed job's second or
  raised bound is refused. W-S10 reads the leg's jobs with its own parse, never through the tree's `legJobs`. This is a fork (§10 F-vi). C3's ci_verdict.mjs half was staged with the hunk resolution, so it rides in the merge commit 1f97532 itself; its witness half is 4f7442d.
- **C4 · the fold plants and the mutants copy ci_verdict.mjs alone.** Main's ci_verdict.mjs now imports `./witness_cause.mjs` (mdtl).
  The witness's `cvCopy` and the mutant runner's `copyTree` copied only the named files, so eleven fold clauses read RED by
  `ERR_MODULE_NOT_FOUND`, not by the law. Both now read the copied file's relative imports off its source and follow them
  transitively. Nothing is typed.
- **C5 · W-S11's refusal was masked by C3.** Under the leg-scoped ONEBOUND, the W-S11 plant (a shard job renamed `npm test · node N`)
  is also refused by the bound law, so the leg-name mutant survived (`20 of 21`). W-S11 now asks the leg-name law ITSELF, read by its
  own text (`named like a leg`), to refuse the plant and to hold on the tree.

**Measured on the merged tree** (21 Nov 2026, this container, Linux, LF `git archive` exports under the temp dir: build ed0cbed, base
5759cce, parent 5301f15):
- witness `--org ed0cbed --base-org 5759cce --parent-org 5301f15`: `GREEN MSHARD the witnesses member split across jobs, folded by name · 23 clause(s)`
  (exit 0; BOUND · 9 file(s) differ from the parent, every one named · LAST · 0 node process(es) naming the temp dir survive)
- witness `--org 5759cce --base-org 5759cce`: `RED MSHARD · W-S1 PLAN, W-S2 COVER, W-S3 UNJUDGED, W-S4 DOUBLE, W-S5 EQUIV, W-S6 SHA,
  W-S7 FAILCLOSED, W-S8 SHARDRUN, W-S9 BADDOOR, W-S10 ONEBOUND, W-S11 LEGNAME, W-S12 HEADALL, W-S13 PRIVACY, W-S15 LPT, W-S16 DOORLESS,
  W-S17 PLANRUN, W-S18 CAUSE, W-S19 TIMES, W-S20 WIRING, W-S21 KREAD` (exit 1; the guard W-S14 GREEN on both)
- witness on ed0cbed without `--parent-org` (BOUND against BASE): `RED MSHARD · BOUND`, the bound class of row 1200 (2)
- mutants `--org ed0cbed --base-org 5759cce`: `run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN`
- `node scripts/ci_verdict.mjs selftest`, 21 Nov 2026: 011c21d `ci_verdict selftest: 42 passed, 0 failed` · main 5301f15 `34 passed, 0 failed`
  · the merge before C3 `47 passed, 1 failed` · ed0cbed `48 passed, 0 failed` (ALL CHECKS PASSED)
- `node scripts/models.mjs check`, 21 Nov 2026: exit 0 on 011c21d, 5301f15, ed0cbed and this checkout (`config scan: 19 file(s) · hits 0`)
- law pack gate, 21 Nov 2026 (`node scripts/lawpack.mjs gate`, LF exports, node_modules from `npm ci` of this lockfile linked):
  BASE 5759cce `jugad-literal-subject-list 93 · bare-catch 37 · receipt-testimony-read 5 · import-time-registry-read 2 · depcruise_errors 7`,
  every other law 0 · parent 5301f15 and the build: `jugad-literal-subject-list 90 · bare-catch 37 · receipt-testimony-read 5 ·
  import-time-registry-read 2 · depcruise_errors 7`, every other law 0. **No count rose** (against BASE jugad falls 93 → 90, by main's own
  units). `node scripts/gates.mjs`, 21 Nov 2026, equal on all three: TYPE COUNT 298 checkJs diagnostics · LINT no-empty 272 · no-unused-vars 85
  (the base's own ratchet reds, unchanged).
- hermetic suite, 21 Nov 2026 (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, git checkouts with node_modules linked):
  ed0cbed, run alone in a `--no-local` clone: `organism_test: 165 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125` = parent 5301f15
  `165 passed, 0 failed`. The `ORGANISM_TEST_LAWPACK` line is byte-equal (md5 4a295a6b…). An earlier run of 23e2e48 ran BESIDE the
  parent's run (two suites at once) and read one red, `CLAUSE WITNESS · ci/witness/mcap/witness_capability.mjs plants`. Its detail
  still read `86 of 86 plant(s) as expected`, so the exit was not 0 under the doubled load. Run alone it reads `exit 0 · 86 of 86`, and
  `organism_test.mjs clauses` reads `8 passed, 0 failed` (21 Nov 2026). This is a load reading, not a merge red; it is named here and not hidden.
- member lines touched (the merge and the parent, identical): `ok   SUITE MEMBER · ci_verdict selftest exits 0`.

**FORKS added by this merge** (measured and named, not edited):
- **F-vi · hermetic-twice has no bound of its own.** It is main's job and outside mshard's named intent. It inherits GitHub's job default
  and reads its per-run bound from the FIRST `timeout-minutes` in suite.yml. Under mshard that first one is the `suite` job's, which the
  leg-scoped ONEBOUND holds equal to the fold's, so mherm's read is unchanged in value. Whether ONEBOUND should cover jobs outside the leg is Q5.
- **F-vii · ten jobs per push before the folds** (2 suite + 6 shard + 2 hermetic-twice), then 2 folds, on the account whose concurrent-job
  limit read 20 (§1 F-K b). K stays three. This adds to Q1.
- **F-viii · the rail refused `git worktree add`.** This seat made two bare worktrees under the temp dir before the rail fired on a
  third. Both were removed (`git worktree remove --force` + `prune`; `git worktree list` shows the checkout alone). The last hermetic
  run used a `git clone --no-local -c core.autocrlf=false` instead.

**Q5** · Should ONEBOUND judge only the leg's jobs (this build), or every job of suite.yml, which would ask main's `hermetic-twice` for a bound of its own?

## 11 · THE MERGE OF NEW MAIN 7bf008b (mdet dfe26a1 · mdtl2 4d582d5 · mclk 7bf008b), forks rows 1226 / 1228

**The legs of the previous tip first** (read 21 Nov 2026 by curl, no token, `GET /commits/40419e0/check-runs` and each leg's
annotations). Every check run of 40419e0 is completed/success. `npm test · node 22` 136765183532 reads GREEN (base 5301f15 · 0 new red ·
0 base red · 3 shards). `npm test · node 24` 136765183520 reads GREEN (base 5301f15 · 0 new red · 0 base red · 3 shards). The other
check runs are `suite · node {22,24}` 136754284455 / 136754284586, the six `witnesses · node {22,24} · shard {1,2,3}` jobs, and
`hermetic twice · node {22,24}` 136754284170 / 136754284480.

`git fetch origin main` (FETCH_HEAD 7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f), then `git merge FETCH_HEAD`, giving merge commit **a9e2f03** (parents
40419e0 · 7bf008b). It is a merge commit, with no rebase and no force push. **Conflicted files: `scripts/ci_verdict.mjs` (three hunks) and
`scripts/organism_test.mjs` (one hunk)**. `package.json`, `ci/`, `ci/witness/mmeter/plant_day.mjs`, `scripts/red_cause.mjs` and the units'
own dirs auto-merged. Measured line by line against the merge base 5301f15 (21 Nov 2026): in organism_test.mjs, suite.yml and package.json,
NO line that main or mshard added is absent from the merge. In ci_verdict.mjs the only absent added lines are the both-changed lines below,
plus mshard's own `digest` signature, CLI line and doc line, which C6 rewrote.

| # | file · lines now (a9e2f03) | main 7bf008b held | mshard 40419e0 held | the merge carries both by |
|---|---|---|---|---|
| L1 | ci_verdict.mjs 26–39 | mdtl2's paragraph (red_cause verify, F7 A `cause["(head)"]`/`["(base)"]`, F6 A one more call) and `// MODES: compare · selftest · <sha>` | mshard's THE FOLD paragraph and `// MODES: compare · digest · times · selftest · <sha>` | mdtl2's paragraph verbatim, then mshard's. MODES is the union |
| L2 | ci_verdict.mjs 276–286 | `compareLines(…, readSrc = () => "", io = {})` with mdtl2's io destructuring and `judge(…, text, …)` | `compareLines(…, readSrc = () => "", shards = null)` | main's signature and body verbatim. **io stays the 9th positional argument (main's API as landed) and `shards` rides 10th**, with an `[io]` and a `[shards]` JSDoc line. The payload line `...(shards ? { shards } : {})` merged clean beside mdtl's `cause` |
| L3 | ci_verdict.mjs CLI compare | `… baseline, workspaceSrc,` / `{ readFile: workspaceFile, tracked: workspaceTracked, text: {…} });` | `… baseline, workspaceSrc, folded.shards);` | main's two lines, ending `text: {…} }, folded.shards);` |
| L4 | organism_test.mjs main() | mdet's `if (mode === "census") { … }` (a read, never a mode of `all`) | mshard's `if (mode === "witness-plan") { … }` | both blocks, side by side (mshard's, then mdet's). Each exits on its own mode |

**Beyond the markers. C6 · the digest and mdtl2's F7 A (`sectionCause`).** mdtl2 names the last section a run reached when it died before its
machine line, read off the run's WHOLE output. Under the fold, `--head`/`--base` are DIGESTS, and the digest drops every `── ` line, so on
the neutral machine F7 A would always have read `no section reached`. Now `digest(raw, osSrc)` carries ONE section line, and only for a run
with NO verdict line: the last section as `sectionCause` rebuilds it from the workspace's organism_test.mjs, in its public spelling and never
the raw line. A section that is not public bytes becomes `── (withheld) ──`, and no section gives no line. Compare's own `sectionCause` then
reads the same answer the whole output would have given. Measured on the merged tree with node_modules: real, skeleton (`… — LIVE`) and
forged sections round-trip. A new fold law proves it (real · forged · none, and a run WITH a verdict line carries no section line). The CLI
passes `workspaceFile("scripts/organism_test.mjs")`. A run with a verdict line digests byte for byte as before (W-S13 PRIVACY unchanged).

**mclk's clock note.** mshard's witness derives NO day from the clock. Its one `Date.now()` builds a unique canary string (W-S13), and the
`times` header date is printed by a seat and never judged by a clause (W-S19 judges the table's grammar). So no midnight plant of mshard's exists.

**Measured on the merged tree** (21 Nov 2026, this container, Linux; LF `git archive` exports and `--no-local` clones under the temp dir):
- witness `--org a9e2f03 --base-org 5759cce --parent-org 7bf008b`: `GREEN MSHARD the witnesses member split across jobs, folded by name · 23 clause(s)`
  (exit 0; BOUND · 9 file(s) differ from the parent, every one named · LAST · 0 node process(es) naming the temp dir survive)
- witness `--org 5759cce --base-org 5759cce`: `RED MSHARD · W-S1 PLAN, … W-S21 KREAD` (every clause but the guard W-S14; exit 1)
- witness on a9e2f03 without `--parent-org`: `RED MSHARD · BOUND` (the bound class of row 1200 (2); no BASE file is rewritten)
- mutants `--org a9e2f03 --base-org 5759cce`: `run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN`
- `node scripts/ci_verdict.mjs selftest`, 21 Nov 2026, node_modules linked: 7bf008b `ci_verdict selftest: 38 passed, 0 failed` · a9e2f03 `53 passed, 0 failed`.
  Without node_modules (this checkout, 21 Nov 2026), both read their two mdtl2 plants red (7bf008b `36 passed, 2 failed`, a9e2f03 `51 passed, 2 failed`), the
  same two by name: red_cause needs acorn. That is main's own, named and not touched.
- `node scripts/models.mjs check`, 21 Nov 2026: exit 0 on both
- hermetic suite (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, clones run one after the other), 21 Nov 2026: a9e2f03
  `organism_test: 166 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125` = parent 7bf008b `166 passed, 0 failed`. The law pack line is
  byte-equal (md5 4a295a6b…). Member line touched, both: `ok   SUITE MEMBER · ci_verdict selftest exits 0`.
- law pack gate, 21 Nov 2026, equal on both: `jugad-literal-subject-list 90 · bare-catch 37 · receipt-testimony-read 5 · import-time-registry-read 2 ·
  depcruise_errors 7`, every other law 0 (BASE 5759cce: jugad 93, §10). `node scripts/gates.mjs`, equal on both: TYPE COUNT 298 · no-empty 272 ·
  no-unused-vars 85. **No count rose.**
