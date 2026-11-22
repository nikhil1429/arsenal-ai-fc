# MQ2 PROOF — thalamus is the sole writer of thalamus_config.json (forks row 1175)

**HEADLINE (2026-11-20):** built as ruled, (1)–(6). `thalamus.mjs` is the declared SOLE WRITER of
`thalamus_config.json` through three named lane exports: `applyTiers`, `refitWakeEconomy` and `setAdjudicatorRole`.
Each one is fenced to its own keys, writes one format (indent 1), and refuses a stale read. `gate_tune`'s apply and
auto-revert and the watchman wake-economy re-fit write through them. No allowlist entry is added, and his file is not
written. Clauses A1–A8 hold both ways and **all 8 mutants are killed** (§3).
**The added race clause (A9) does NOT hold, and the cause is measured, not guessed.** F3 A is a re-read-and-compare
with no lock. Under a real two-process race it loses a key that both writers reported written: 6 of 6 witness passes
were RED on 2026-11-20. Closing that needs mutual exclusion, which is F3 b. This is fork **F9** (§6), the one open
ruling this build needs.

Unit mq2 · CLOUD BUILD SEAT · branch `claude/mq2-build` · never landed, never merged · ledger `ci/mq2/LEDGER.jsonl`
(on this branch; the spec branch is untouched, so the spec's rows are carried here verbatim and continued).

## 0 · The base

- Cut from `origin/main` **5759cce** (`5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`, `ci/mq2/BASE`), by `git fetch origin
  main; git checkout -b claude/mq2-build origin/main`, 2026-11-20.
- The spec cut was fb42118. At 5759cce the four blobs the spec names are **byte-identical** to the spec's cut
  (`git hash-object`: thalamus f529fcf · gate_tune f998c7e · watchman ee43176 · xray 47b9de0). So every file:line in
  `ci/mq2/MQ2_SPEC.md` §1–§4 holds at this base unchanged.
- The spec probe on the base, 2026-11-20 (`node ci/mq2/witness/probe_base.mjs --repo .` at 5759cce): `mq2 probe: 3 RED of 3`.
  On the build: `mq2 probe: 0 RED of 3`.
- The base tree for the witness was `git archive 5759cce -- . ':!dressing-room/state'` into the scratchpad, made a git
  tree (`git init`, core.autocrlf=false) so the law pack's `git ls-files` can read it. The rail refuses a bare
  `git worktree add`, and the state dir is never copied.

## 1 · What was built (the named files only)

| file | change |
|---|---|
| `scripts/thalamus.mjs` | header: `SOLE WRITER of thalamus_config.json too (unit mq2, forks row 1175 F1 A)`; the stale "ONE file outside that five" sentence corrected (F6 A). New section THE ONE WRITER OF THE CONFIG: a closed frozen lane table `CONFIG_LANES` (tiers · wake_economy · adjudicator), the private `writeConfigLane`, and the three exports, each with no lane argument (F2 B). The 818 `config adjudicator-role` verb writes through `setAdjudicatorRole` and keeps every refusal it had. Five selftest asserts (F8 B). |
| `scripts/gate_tune.mjs` | `apply` and `score`'s revert call `applyTiers`, so the decision is judged on the bytes the sole writer read. The indent-2 `writeAtomic` is gone with the edit. The header says the organ OWNS the tiers proposal lane and WRITES THROUGH the thalamus. |
| `scripts/watchman.mjs` | `probeWakeEconomy`'s default writer calls `refitWakeEconomy`, and the inline whole-file writer is gone (F5 A). The STATE_DIR gains the planted-tree door `ARSENAL_WATCHMAN_STATE_DIR`, honoured ONLY under os.tmpdir() through the organ's own `tmpDoor`. That is stricter than gate_tune's door, which is unguarded. |
| `ci/mq2/witness_mq2.mjs` (moved from `ci/mq2/witness/` by row 1313, §14) | the witness (§2) |
| `ci/mq2/run_mutants_mq2.mjs` | the mutants (§3) |
| `ci/mq2/BASE`, `PROOF.md`, `LEDGER.jsonl`, `MQ2_SPEC.md`, `witness/probe_base.mjs` | the record (the last two are carried verbatim from `claude/mq2-spec` 7460be5) |

**The lane contract** (each export: `door(edit, { path })`). The path must be NAMED `thalamus_config.json` (the
setter's own fence). The bytes are read once. `edit(obj, text, buf)` returns the next object, or null for "no
write". **THE LANE FENCE**: every key outside the lane, both its value and its order, must be byte-identical, or the
write is refused by name. **THE STALE GUARD**: the bytes are read again just before the organ's own `writeAtomic`
(tmp + rename), and a change refuses. There is no retry, no lock and no typed number. The output is
`JSON.stringify(o, null, 1)` with no trailing newline (F4 A).

**Where the build differs from the spec, the ruling won.** The spec recommended F2 a, one export
`patchThalamusConfig(lane, …)`. Row 1175 (2) ruled F2 B, so there are three exports, and the spec's own suggested
names are used. So the spec's A4 "an unknown lane is refused" has no lane to name: A4 checks instead that no generic
door is exported and that each door takes exactly (edit, opts). The spec put "re-read bytes just before the rename"; the
compare sits just before `writeAtomic`. The tighter form (tmp, then compare, then rename) adds unresolved fs sites to
thalamus, which A8's budget forbids, and it loses the race too (§6 F9 has both measurements).

## 2 · The witness, both ways

```
node ci/mq2/witness_mq2.mjs --org . --base-org <base tree>     (2026-11-20, build tip 92be65c)
A1 base RED (apply exit 0 · tiers moved true · file indent2 · 818 setter exit 2) · build GREEN (apply exit 0 · tiers moved true · file indent1 · 818 setter exit 0) → held
A2 base RED (score exit 0 · reverted true · file indent2 · 818 setter exit 2) · build GREEN (score exit 0 · reverted true · file indent1 · 818 setter exit 0) → held
A3 base RED (child exit 0 · finding none · landed false · ...) · build GREEN (... RE-FIT — est_tokens_per_wake 1 → 2000 ... · landed true · others byte-identical true · file indent1) → held
A4 base RED (no such export(s): applyTiers, refitWakeEconomy, setAdjudicatorRole) · build GREEN (cross-lane edits refused true · generic door none · arity 2,2,2 · file unchanged true) → held
A5 base RED (no such export(s) ... — no guard to hold a stale read) · build GREEN (first writer refused · second's key survives true · tmp left 0) → held
A6 base RED (Q2 rows for it 1 · Q5 0 · allowlisted false · allowlist as the base true) · build GREEN (Q2 rows for it 0 · ...) → held
A7 base RED (declared sole none · IR writers gate_tune.mjs,thalamus.mjs · Q5 0 · Q6 0) · build GREEN (declared sole thalamus.mjs · IR writers thalamus.mjs · Q5 0 · Q6 0) → held
A8 base vs build GREEN — law pack rose: none · unresolved sinks 2060 → 2056
A9 base RED (no such export(s) ...) · build RED (free race tiers+wake: wrote tiers+wake, LOST tiers · tiers+adjudicator: wrote tiers+adjudicator, no key lost · wake+adjudicator: wrote wake+adjudicator, LOST wake · forced overlap: holder refused out loud, partner's key kept true) → NOT HELD
BOUND GREEN — 7 path(s) differ · beyond the named files: none
LAST GREEN — 10 child process(es) started, 0 alive
RED MQ2 · A9
```

- **Last line on the build: `RED MQ2 · A9` (exit 1).** Every other clause holds. A9's forced overlap holds every
  time: the holder refuses out loud and the partner's key survives. A9's free race does not hold, because a pair lands
  a reported write that is not on disk (§6 F9).
- **Last line on the base**, with the base given both ways (`--org <base> --base-org <base>`, 2026-11-20):
  `RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9` (exit 1). A8 and BOUND are GREEN there by construction, because the
  base is compared with itself.
- A9 is not deterministic. One pass can land GREEN by luck, never RED by luck: a lost key is a lost key. Measured on
  2026-11-20 over repeated witness passes: GREEN 1 of the first 2, then RED 6 of 6.
- The PORT CLASS holds: no port, no service, no POST, no restart, no model call. Every spin ends on a flag or on a
  dead process, with no typed number, and LAST proves that no child outlives the witness.

## 3 · The mutants

```
node ci/mq2/run_mutants_mq2.mjs --org . --base-org <base tree>     (2026-11-20, tree at 92be65c)
control: GREEN MQ2 thalamus is the sole writer of thalamus_config.json through three lane doors · 11 clause(s)
M1 (the writer emits indent 2) → A1 RED — killed · witness: RED MQ2 · A1, A2, A3, A9
M2 (score's revert keeps its own indent-2 whole-file write) → A2 RED — killed · witness: RED MQ2 · A2, A6, A7, A9
M3 (the watchman door removed) → A3 RED — killed · witness: RED MQ2 · A3, A9
M4 (the lane-key check dropped) → A4 RED — killed · witness: RED MQ2 · A4, A9
M5 (the re-read compare dropped) → A5 RED — killed · witness: RED MQ2 · A5, A9
M6 (gate_tune apply keeps a direct write of the config) → A6 RED — killed · witness: RED MQ2 · A6, A7, A9
M7 (the SOLE WRITER header line removed) → A7 RED — killed · witness: RED MQ2 · A7
M8 (the stale header sentence kept AND a new state write added to thalamus) → A8 RED — killed · witness: RED MQ2 · A8, A9
run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
```

- **8 of 8 killed**, each by the clause that names it.
- **The control went GREEN on this pass by luck.** Its A9 free race happened to land with no lost key. An earlier
  pass the same day printed `control RED (A9)`, and the build witness right after this run was RED on A9 again
  (§2). A9 can be GREEN by luck and never RED by luck. That is fork F9.
- **M8, on its first run, SURVIVED.** It wrote `gate_tune_ledger.jsonl`, and the law pack did not count the write.
  The cause: gate_tune's header puts `SOLE WRITER of` and `gate_tune_ledger.jsonl` on two lines, so neither xray's
  nor the law pack's owner map holds that declaration. M8's write now targets `xray_graph.json`, whose owner is
  declared on one line, and A8 kills it: owners-only-state-write rises from 0. The two-line header is fork **F11**.
- No mutant targets A9 by name, because row 1175 (6) names M1–M8. M5 (the compare dropped) kills A5, and A9's forced
  overlap with it.

## 4 · Selftests, members, models, the law pack, the suite (each before → after)

```
selftest (run directly; the hermetic profile names all three LIVE)        base 5759cce            build
thalamus.mjs selftest      ALL CHECKS PASSED, exit 0, 180 ✓       →   ALL CHECKS PASSED, exit 0, 185 ✓ (+5 mq2 asserts)
gate_tune.mjs selftest     gate_tune selftest: 11 passed, 0 failed →  gate_tune selftest: 11 passed, 0 failed
watchman.mjs selftest      ALL CHECKS PASSED (145 passed, 0 failed) → ALL CHECKS PASSED (145 passed, 0 failed)
xray.mjs selftest          exit 1 (graph frozen at thalamus 7, watchman 24; base 10, 37) → exit 1 (thalamus 10, watchman 35)
node scripts/models.mjs check   exit 0  →  exit 0
```

- **The member lines** (hermetic suite) are identical both ways for the three touched members. Each one is
  `LIVE selftest thalamus|gate_tune|watchman — not run in the hermetic profile: reads state/…`. They name state reads,
  which the hermetic profile never runs.
- **xray's selftest is RED on the base and on the build alike**, measured 2026-11-20. The frozen graph
  `xray_graph.json` trails main for organs this unit never touched (acts, archivist, brain, captains_call …). For the
  three organs touched here, the build only falls (unresolved, per organ):

```
xray unresolved sinks (2026-11-20)   base → build
thalamus.mjs                          10 → 10
gate_tune.mjs                          4 → 2
watchman.mjs                          37 → 35
total                               2060 → 2056
```

- **The law pack** (`node scripts/lawpack.mjs gate`, both LF trees, 2026-11-20). The counts are identical base and build:

```
findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```
  Main itself is already RED there: `jugad-literal-subject-list ROSE — 93, baseline 90` is RED at 5759cce, before
  any byte of this unit. This build raises no count, and it adds no ignore line.
- **ESLint** on the three files, rule by rule, matches the base exactly (no-empty and no-unused-vars counts unchanged).
- **The hermetic suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`), 2026-11-20:

```
build 92be65c: organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
               · [UNRULED] EVERY organ with a selftest is wired into a suite — orphaned: deck_lint, home_pin, probe, study_scope
base 5759cce:  organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
               (the same one RED; the pass/fail/LIVE line set is identical to the build's, diffed 2026-11-20)
```
  The one RED is the selftest-orphans law, already on main. The spec measured the same RED at fb42118.

## 5 · The graph baseline (NOT re-frozen here; the runner's act at the landing)

When the runner re-freezes `dressing-room/state/xray_graph.json`, the expected change for this unit is:
`dressing-room/state/thalamus_config.json` writers `gate_tune.mjs, thalamus.mjs` → `thalamus.mjs`; readers
`dugout.mjs, gate_tune.mjs, thalamus.mjs` → `dugout.mjs, thalamus.mjs`; `declared_sole_writers` gains
`{ organ: thalamus.mjs, file: thalamus_config.json }`; the Q2 row for the file leaves; unresolved per organ as in §4.
The frozen graph is already stale for other organs (§4, xray selftest), so a re-freeze moves more than this unit.

## 6 · FORKS (the architect rules)

- **F9 · NEW, from the measurement: the race clause against F3 A.** Under F3 A (a re-read and compare, no lock), two
  processes that read together both pass their compare before either one renames, and the second rename drops the
  first one's keys. Both report "wrote". Measured on 2026-11-20 with a scratch counter over the free race
  (tiers+wake): the compare before `writeAtomic` lost a reported write in 17 of 20 races; the tighter
  tmp-compare-rename lost one in 8 of 20. The witness's A9 was RED 6 of 6. The cases F3 A was written for are held
  every time: a write that lands between a read and its compare (A5 and A9's forced overlap).
  (a) **F3 b**: an exclusive lock next to the config (`openSync(<config>.lock, "wx")`), held from the read to the
  rename and released by unlink. The stale-lock story needs no number and no clock: the lock holds the writer's pid, a
  lock whose pid is not alive is taken over once, and a live one refuses out loud. A9 then holds, M5 stays killed, and
  a new mutant "lock dropped" kills A9.
  (b) keep F3 A and narrow A9 to the forced overlap. A key lost to a truly simultaneous race stays a named residual.
  The opportunity is the `StartWhenAvailable` catch-up after a missed night (spec §4 (2); his laptop, N1).
  (c) a lock-free claim, renaming the live file away so the second claimer gets ENOENT. Rejected: during the gap
  every reader (`loadConfig`, cortex per wake) sees no file and falls to DEFAULT_CONFIG.
  **Recommend a.** Decider: A9 GREEN on repeated witness passes, with A1–A8 unchanged.
- **F10 · the graph re-freeze scope.** The runner's re-freeze at landing also absorbs the unrelated drift §4 measured
  (acts, archivist, brain …). (a) re-freeze whole, as mxb and mxh did · (b) hold this unit's re-freeze until that drift
  has its own row. **Recommend a**, naming the extra movement in the landing.
- **F11 · gate_tune's two-line SOLE WRITER header.** `SOLE WRITER of` and `gate_tune_ledger.jsonl` sit on two lines,
  so xray's declared_sole_writers and the law pack's owner map do not hold gate_tune as that ledger's owner.
  (a) put the token on the marker's line in a later unit (one header line; Q5 and Q6 then judge it) · (b) leave it.
  **Recommend a.** It is not done here: it would grow this unit's graph movement beyond the ruled row.
- **F12 · the watchman door's guard.** The door is honoured only under os.tmpdir() (`tmpDoor`), which is stricter than
  gate_tune's unguarded `ARSENAL_GATETUNE_STATE_DIR`. (a) keep it, a gate may only get stricter · (b) match gate_tune's
  shape. **Recommend a.**
- **F13 · where the ledger lives.** The brief names the ledger "on the spec branch". This seat pushes only its build
  branch, so the spec rows are carried here verbatim and continued. (a) the runner moves them at landing · (b) they
  stay on the build branch. **Recommend b.**

## 7 · NAMED, NOT GUESSED

- The spec's N1–N6 stand (`ci/mq2/MQ2_SPEC.md` §7). N1 now decides F9 (b): whether `StartWhenAvailable` is live, and
  whether the two nightly writers have ever fired in the same minute.
- **The witness on Windows** has not been run. It is written to be CRLF-proof and shell-free (node and git only,
  junctions for node_modules, pid probes through `process.kill(pid, 0)`), but it is measured on Linux only. On his
  laptop: `node ci/mq2/witness_mq2.mjs --org <worktree> --base-org <main worktree>`.
- **His live file**: the tracked `thalamus_config.json` is byte-equal on the indent-1 round trip (a boolean, no
  content printed, 2026-11-20; last commit touching it a4d3430). So after landing, the first lane write keeps its format
  (F7 A: no write at landing). The live (untracked-change) copy on his laptop is unmeasured:
  `node -e "const t=require('fs').readFileSync('dressing-room/state/thalamus_config.json','utf8');console.log(JSON.stringify(JSON.parse(t),null,1)===t)"`.
- **The thalamus daemon loads the config once.** A lane write bites only after a restart (spec N6), and that is
  unchanged by this unit.

## 8 · The neutral machine

Read through the public API with no token:
`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (workflow `.github/workflows/suite.yml`,
push on `**`). As of 2026-11-20:

| sha | run | jobs |
|---|---|---|
| 77506ef | 44656418778 | node 22 136023643868 cancelled · node 24 136023644244 cancelled (superseded by the next push) |
| a3886e8 | 44657671812 | node 22 136027832563 cancelled · node 24 136027831898 cancelled (superseded) |
| 92be65c | 44658184054 | node 22 136029531952 queued · node 24 136029532174 queued |

The verdict of this proof's own push is read after it lands, and is recorded in `ci/mq2/LEDGER.jsonl` and in the
final message.

## 9 · Effort receipt

`node campaign-2026-09/tools/effort_receipt.mjs --fleet mq2b --seat 00 --model claude-opus-5-5` (2026-11-20) →
`Error: Cannot find module '/home/user/arsenal-ai-fc/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1). This
repository does not carry `campaign-2026-09/`, so nothing was written under it. It is run once more as the seat's
last step, and its result is in the final message.

## 10 · RESUME · the merge of main 7bf008b (forks rows 1233 (2) / 1236, 2026-11-21)

- `git fetch origin main` → `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`; `git merge FETCH_HEAD` → merge commit
  **a0b39c6** (parents b6cf269 · 7bf008b). A merge, never a rebase, never a force push.
- **Conflicted files: none.** Main's blobs for `scripts/thalamus.mjs`, `scripts/gate_tune.mjs` and
  `scripts/watchman.mjs` did not move between 5759cce and 7bf008b, so git took this unit's bytes for those three and
  main's bytes for everything else. That includes `scripts/organism_test.mjs`, `package.json` and every `ci/` path
  main landed. `git diff 7bf008b a0b39c6 --stat` lists only the three named scripts and `ci/mq2/**`.
- **`ci/mq2/BASE` is left at 5759cce, on purpose.** The brief keys BASE to "the sha you cut from", not to the main
  merged in. The witness's base tree for this re-run is 7bf008b (`git archive 7bf008b`, state left out, a git tree
  with core.autocrlf=false).
- **The clock (mclk on main):** no witness clause derives a day boundary. A2 plants an apply on 1970-01-01, so its
  window and age never cross a midnight, and its salience rows are judged only as `>= applied_on`. A midnight run
  cannot flip it.
- **On the merged tree**, 2026-11-21:

```
node ci/mq2/witness_mq2.mjs --org . --base-org <7bf008b tree>
A1-A7 base RED · build GREEN → held · A8 base vs build GREEN — law pack rose: none · unresolved sinks 2112 → 2108
A9 build RED (free race tiers+wake: LOST wake · tiers+adjudicator: LOST tiers · wake+adjudicator: LOST wake · forced overlap: holder refused out loud)
BOUND GREEN — 10 path(s) differ · beyond the named files: none · LAST GREEN — 10 child process(es) started, 0 alive
RED MQ2 · A9
node ci/mq2/witness_mq2.mjs --org <7bf008b tree> --base-org <7bf008b tree>
RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9
node ci/mq2/run_mutants_mq2.mjs --org . --base-org <7bf008b tree>
run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control RED (A9)
```
  The law pack on the merged tree: `jugad-literal-subject-list 90` (main's own RED at 5759cce is gone on 7bf008b),
  every other count as §4, none raised. The one open RED is still A9, which is fork F9 (§6).

CHECKPOINT · MERGED main 7bf008b at a0b39c6 · witness RED MQ2 · A9 (F9) · mutants 8 of 8, control RED (A9) · legs of a0b39c6: run 44879636984 (npm test node 22 + node 24, hermetic twice node 22 + node 24) queued at 2026-11-21 · resume from: read those legs, then await the F9 ruling

CHECKPOINT · 2026-11-21 · MERGED main 7bf008b at a0b39c6 (pushed tip 159e430) · legs of 159e430, run 44879917708: npm test node 22 136772774840 success · npm test node 24 136772775069 success · hermetic twice node 22 136772775068 success · hermetic twice node 24 136772775061 success (a0b39c6 run 44879636984 cancelled, superseded) · witness RED MQ2 · A9 (F9) · mutants 8 of 8, control RED (A9) · resume from: the F9 ruling

## 11 · CHECKPOINT · forks row 1298 (1): main 84cbc03 merged, the 10 checkJs diagnostics fixed (2026-11-22)

- **Merge:** `git fetch origin main` → 84cbc03126eddb85c7d5cf54b51610068800315c; `git merge FETCH_HEAD` → **7cc2b3f**
  (parents 501bc83 · 84cbc03). No conflict: main never moved the three named scripts.
  `git diff 84cbc03 HEAD --stat` lists only them and `ci/mq2/**`.
- **`ci/mq2/BASE` = 84cbc03126eddb85c7d5cf54b51610068800315c**, by this order.
- **The 10 diagnostics, fixed in the organ** (`@ts-check` kept, the frozen 296 kept). All were checkJs failing to
  follow a variable assigned inside a lane door's edit closure:
  - `configMain`: six TS18047 (`ed` is possibly 'null') and two TS2339 on 'never' (`ok`, `why`). `ed`, `buf` and
    `early` are now typed by a JSDoc cast on their initializer. A null guard was added before the success path; it
    refuses by name, never with a silent default.
  - The selftest's `inner`: two TS2339 on 'never' (`ok`, `wrote`), typed the same way.
  - No behaviour moved. The thalamus selftest still passes ALL CHECKS (185 ✓, exit 0). The errors left in
    thalamus.mjs (TS2362/TS2363 on date arithmetic, TS2339 `code` on Error) are main's, inside the frozen 296.
- **Gates** (`node scripts/gates.mjs`, this tree):

```
gates types  · 21 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 296 (baseline 296, may only fall)
gates: GREEN — nothing rose, the undefined-symbol families are 0 on both sides, and every schema'd state file matches
```

- **The witness** (`node ci/mq2/witness_mq2.mjs --org . --base-org <84cbc03 tree>`):
  `RED MQ2 · A9`. A1–A7 held both ways · A8 GREEN (law pack rose: none · unresolved sinks 2128 → 2124) · BOUND GREEN
  (10 paths, none beyond the named files) · LAST GREEN. A9 is RED, which is fork F9 (§6), unruled.
- **The mutants** (`node ci/mq2/run_mutants_mq2.mjs --org . --base-org <84cbc03 tree>`):
  `run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control RED (A9)`.
- **The WITNESSES member**, run here with the neutral flags
  (`ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD node scripts/organism_test.mjs witnesses`):

```
organism_test: 121 passed, 6 failed · ruled 0 · UNRULED 6 · LIVE 0 (hermetic: named, not run)
```
  - mq2 was NOT a member then (until row 1313 moved it, §14). Its witness sat at `ci/mq2/witness/witness_mq2.mjs` (the spec's path, which the runner
    ruled wins), and the member looks for `ci/<unit>/witness_<unit>.mjs`. That matters at landing: if mq2 joins the
    member, A9 makes it RED until F9 is ruled.
  - Five of the six FAILs are this container's clone, not this unit: `mr3`, `mrf`, `mrj`, `mrt`, `mrv` · "its BASE is
    in the clone". Their BASE commits are absent from a shallow clone (`git rev-parse --is-shallow-repository` → true),
    and the neutral machine fetches full history.
  - The sixth is `mday` W7.1, a TIMING clause: the Skill-door start against a measured bound. It never names
    thalamus, gate_tune or watchman (grep count 0). Re-run alone on this tree
    (`node ci/mday/witness_mday.mjs --org . --base-org <669200d tree>`) it is `GREEN W7.1 · … planted SLOW by 445 ms
    (the old single-sample bound was 421 ms) … settled after 854 ms`. The RED came from running under the member's
    own load, so the member does not hold it against this unit.
- **The push:** once, `[skip ci]` in the head commit message, by this order. So this tip has no neutral legs. The
  last legs read are those of 159e430 (§10), all four success.

CHECKPOINT · 2026-11-22 · MERGED main 84cbc03 at 7cc2b3f · checkJs 296 = baseline (gates GREEN) · witness RED MQ2 · A9 (F9) · mutants 8 of 8, control RED (A9) · WITNESSES member 121 passed, 6 failed (5 shallow-clone BASE, 1 mday timing, none mq2) · pushed once [skip ci] · resume from: the F9 ruling

## 12 · F9 RULED (row 1305): THE LOCK, built on main 84cbc03 (2026-11-22)

**The rulings, verbatim (row 1305 (1)–(3), by the runner's resend):** (1) F9 (a): an exclusive lock file beside the
config, taken before the read and held to the rename, released by unlink. The lock holds the writer's pid; a lock whose
pid is not alive is taken over once; a live one REFUSES by name, never waits without a bound and never writes through;
the caller reports the refusal as a refusal. Row 1175 (3) is amended to this: the compare stays inside the lock. (2)
The witness adds: the lock-dropped mutant red at A9; a planted dead-pid lock is taken over; a planted live-pid lock
refuses and the file is byte-unchanged; the lock file is never left behind on any exit path the witness can plant,
and is not a tracked or published path. A9 green on repeated passes with A1 to A8 unchanged decides it. (3) F10 a,
the extra movement named in the landing. F11 a as a later one-line unit, named in the runner's lane file. F12 a. F13 b.
(The first copy of the order arrived with the rulings text empty; the resend above is what was built.)

- **Base:** main is still **84cbc03** (`git fetch origin main` → 84cbc03126eddb85c7d5cf54b51610068800315c), and the
  branch already carries it (merge 7cc2b3f, §11). So `ci/mq2/BASE` stays **84cbc03126eddb85c7d5cf54b51610068800315c**.
- **(1) in `scripts/thalamus.mjs`:** `acquireConfigLock` / `releaseConfigLock` around the whole of `writeConfigLane`,
  with `try/finally`, so every return, refusal or throw after the take releases the lock.
  - **Take:** `<config>.lock` is created exclusively (`writeFileSync(lock, pid, { flag: "wx" })`) BEFORE the read.
  - **Release:** unlink, and only when the lock still holds this pid.
  - **Live holder:** refused by name (`THE LOCK: … held by live pid N`), with no wait and no retry. The stale guard
    stays inside the lock.
  - **Dead holder:** a lock whose pid is not alive (`process.kill(pid, 0)` → ESRCH, the same call on win32; EPERM
    reads as alive) is taken over ONCE.
  - **Same process:** a nested door call inside an edit (same pid) proceeds without re-taking the lock. The stale
    guard then catches that write, which keeps A5 unchanged.
  - **Not tracked, not published:** the lock path is under the existing `.gitignore:541` `dressing-room/state/*.lock`.
    No file beyond the named ones was touched.
  - **Named residuals:** a pid the OS has reused reads as alive, so a stale lock then refuses until that process exits.
    An EMPTY lock (a writer between create and its pid write) is read as held, never as stale.
- **Graph movement at the re-freeze (F10 a):** the IR gains `dressing-room/state/thalamus_config.json.lock`, written
  and read by thalamus.mjs only (Q2 0 · Q3 0 · Q4 0 · Q6 0). The unresolved sinks per organ do not rise
  (thalamus 10 → 10).
- **Selftest (F8 b):** two lock asserts were added. No lock is left after every door call above it, and a live-pid lock
  refuses with the file byte-unchanged and the holder's lock left in place.
  `node scripts/thalamus.mjs selftest` → `ALL CHECKS PASSED` (exit 0).
- **Gates:** `node scripts/gates.mjs` →
  `other checkJs diagnostics 296 (baseline 296, may only fall)` · `gates: GREEN — nothing rose, …`.
- **(2) in the witness, A9:**
  - The forced overlap is now deterministic: the holder writes, and the partner is refused BY THE LOCK.
  - (iii) a dead-pid lock (the pid of a node child that has exited) is taken over and the write lands. A live-pid lock
    (the witness's own pid) refuses, the file is byte-unchanged and the lock is untouched.
  - (iv) no `.lock` is left in any planted dir of the tree, across every clause's refusal and write paths.
  - (v) the lock path is `git check-ignore`d and untracked in the tree under judgement.
- **The witness, repeated** (`node ci/mq2/witness_mq2.mjs --org . --base-org <84cbc03 tree>`, 6 passes,
  2026-11-22):

```
pass 1..6 · exit 0 · A8 base vs build GREEN — law pack rose: none · unresolved sinks 2128 → 2124 · A9 build GREEN
GREEN MQ2 thalamus is the sole writer of thalamus_config.json through three lane doors · 11 clause(s)    (each of the 6)
A9 (pass 1): free race tiers+wake: wrote wake, no key lost · tiers+adjudicator: wrote tiers, no key lost · wake+adjudicator: wrote adjudicator, no key lost · forced overlap: holder wrote, partner refused by THE LOCK · dead-pid lock taken over true · live-pid lock refused, file unchanged true · locks left none · lock path ignored true untracked true
base both ways (--org <84cbc03 tree> --base-org <84cbc03 tree>): RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9
```

- **The mutants** (`node ci/mq2/run_mutants_mq2.mjs --org . --base-org <84cbc03 tree>`), with M9 the lock dropped:

```
control: GREEN MQ2 thalamus is the sole writer of thalamus_config.json through three lane doors · 11 clause(s)
M9 (the lock dropped (row 1305 (2))) → A9 RED — killed · witness: RED MQ2 · A9
run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN
```

- **The WITNESSES member**
  (`ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD node scripts/organism_test.mjs witnesses`):

```
WITNESSES · 63 unit(s) judged in 1530.8 s
organism_test: 122 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 0 (hermetic: named, not run)
```
  All five FAILs are `mr3`, `mrf`, `mrj`, `mrt`, `mrv` · "its BASE is in the clone". This container's clone is shallow
  and lacks those BASE commits, and the neutral machine fetches full history. mday is GREEN this run. mq2 is not a
  member then, because its witness was at `ci/mq2/witness/witness_mq2.mjs` (§11; moved by row 1313, §14).
- **Windows:** the lock path is `path + ".lock"` (node:path, no separator typed), and liveness is
  `process.kill(pid, 0)`. The witness plants with node and git only. Not yet run on win32: the architect's laptop
  re-run is its first.

CHECKPOINT · 2026-11-22 · tip = this commit ([skip ci]) · BASE 84cbc03126eddb85c7d5cf54b51610068800315c · witness build GREEN MQ2 · 11 clause(s) on 6 of 6 passes (A9 GREEN each, A1–A8 unchanged) · base RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9 · mutants 9 of 9, control GREEN · WITNESSES 122 passed, 5 failed (all 5 shallow-clone BASE) · resume from: the architect's Windows re-run

## 13 · Row 1311: A8 is a BOUND-class clause (2026-11-22)

**The ruling, items (1)–(2), verbatim (by the runner):** (1) THE WITNESS LAW, second half of row 1307: a clause whose
verdict compares a whole-tree count or list between the base and the head is a BOUND-class clause. It carries an id of
the form ID BOUND as a literal in its source, so the member drops it; it is judged at adoption against the unit's
parent, by the seat, the runner and the architect, and its mutant stays. The neutral readers of those counts stay the
judges on main: the law pack line of row 1137 (2), the graph query, the gates. (2) mq2 and mxb come OUT of the train
now, nothing rides above them. Each seat renames exactly the measured clauses (mq2 A8; mxb W8 and W9), checks its other
clauses for the same shape and names any, re-measures both ways against current main, mutants, checkpoint; each
returns as a top car for the architect's re-run.

- **Renamed: A8 → `A8 BOUND`.** It is a literal in the witness source (`const A8_ID = "A8 BOUND"`). The witness prints
  `A8 BOUND base vs build …` and, on a red, pushes `A8 BOUND` into its RED line. The member's own `boundIds` reads the
  source as `["A8 BOUND","BOUND"]`, and its drop applied to `RED MQ2 · A8 BOUND, BOUND` leaves nothing. M8 stays, now
  judged at `A8 BOUND`.
- **Named, same shape, not renamed (as ordered): A6's allowlist sub-check.** `witness_mq2.mjs:209` compares xray's
  whole `MULTI_WRITER_ALLOWLIST` list between base and head ("allowlist as the base"). A car below that adds an
  allowlist entry would turn A6 RED for a reason outside this unit. The rest of A6 (Q2/Q5 rows for this ONE file) and
  every other clause (A1–A5, A7, A9 are planted, per-tree; BOUND is already BOUND; LAST counts its own children) do
  not compare a whole-tree count or list.
- **Main:** `git fetch origin main` → 84cbc03126eddb85c7d5cf54b51610068800315c, unchanged, already merged (7cc2b3f).
  BASE stays 84cbc03126eddb85c7d5cf54b51610068800315c.
- **Re-measured against main 84cbc03**, LF trees:

```
witness, build (3 passes): GREEN MQ2 thalamus is the sole writer of thalamus_config.json through three lane doors · 11 clause(s)   (3 of 3, exit 0)
  A8 BOUND base vs build GREEN — law pack rose: none · unresolved sinks 2128 → 2124 · A9 build GREEN (each pass)
witness, base both ways: RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9
mutants: run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN
  M8 … → A8 BOUND RED — killed · witness: RED MQ2 · A8 BOUND
  M9 (the lock dropped) → A9 RED — killed · witness: RED MQ2 · A9
WITNESSES member: organism_test: 122 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 0 (hermetic: named, not run)   (63 units)
```
  The 5 FAILs are `mr3`, `mrf`, `mrj`, `mrt`, `mrv` · "its BASE is in the clone" (this container's shallow clone),
  unchanged from §12. mq2 is not a member (§11).

CHECKPOINT · 2026-11-22 · tip = this commit ([skip ci]) · BASE 84cbc03126eddb85c7d5cf54b51610068800315c · renamed A8 → "A8 BOUND" · named, same shape: A6's allowlist-equality sub-check (witness_mq2.mjs:209) · witness build GREEN MQ2 · 11 clause(s) 3 of 3 · base RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9 · mutants 9 of 9, control GREEN · WITNESSES 122 passed, 5 failed (shallow-clone BASE only) · resume from: the architect's re-run

## 14 · Row 1313: the witness moved to where the WITNESSES member finds it (2026-11-22)

- **The move:** `git mv ci/mq2/witness/witness_mq2.mjs ci/mq2/witness_mq2.mjs` (pushed alone first as 9f91e7d, so the
  history follows). The member's `witnessFile` looks only for `ci/<unit>/witness_<unit>.mjs`, so until now mq2 was
  never judged on main.
  - **Paths that name it, all updated:** the mutant runner (`WITNESS = …/witness_mq2.mjs`, beside BASE); the witness's
    own header and usage line; every command in this PROOF; the spec's file list (`MQ2_SPEC.md` §8, which notes the
    first path).
  - **`ci/mq2/witness/probe_base.mjs` keeps its folder.** It is the spec seat's standalone base probe, and nothing
    imports it. The witness imports no file by a relative path; it re-invokes ITSELF for its children through
    `import.meta.url`, so it runs from the member's copy under its working dir.
- **One change the move required: A9 (v) now judges a plain tree.**
  - **Why:** the member hands a witness two LF checkouts made with `git --work-tree=… checkout` and a private index.
    They have no `.git`, so `git -C <tree> check-ignore` could not answer, and A9 would have been a real RED there.
  - **Ignore check:** (v) now judges the tree's OWN `.gitignore` inside a throwaway git repo (`git init`, then
    core.autocrlf=false).
  - **Tracked check:** "untracked" is git's index when the tree is a git work tree (realpath-compared, case-folded on
    win32). Otherwise it is "the checkout does not carry the file", since a checkout of HEAD would carry it.
  - **BOUND in a plain tree** prints `NOT MEASURABLE — a tree is not a git tree`. The member drops BOUND by its own
    law, and BOUND is judged at adoption on git trees, where it is GREEN (10 paths, none beyond the named files).
- **Re-measured on main 84cbc03** (`git fetch origin main` → 84cbc03126eddb85c7d5cf54b51610068800315c, unchanged; BASE
  stays it), LF trees:

```
node ci/mq2/witness_mq2.mjs --org . --base-org <84cbc03 tree>   (3 passes)
GREEN MQ2 thalamus is the sole writer of thalamus_config.json through three lane doors · 11 clause(s)   (3 of 3, exit 0; A8 BOUND GREEN, A9 GREEN)
node ci/mq2/witness_mq2.mjs --org <84cbc03 tree> --base-org <84cbc03 tree>
RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9
node ci/mq2/run_mutants_mq2.mjs --org . --base-org <84cbc03 tree>
run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN
ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD node scripts/organism_test.mjs witnesses
  witness ‹mq2› 13.4 s · RED MQ2 · BOUND
  ok   WITNESS ‹mq2› · ran in 13.4 s (B5)
  ok   WITNESS ‹mq2› · GREEN at head against its BASE
  ok   WITNESSES · 64 unit(s) judged in 1567.7 s
organism_test: 124 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 0 (hermetic: named, not run)
```
  mq2 is now among the units the member judges: 64, one more than §12–§13's 63. It is GREEN after the BOUND drop.
  The 5 FAILs are unchanged: `mr3`, `mrf`, `mrj`, `mrt`, `mrv` · "its BASE is in the clone" (this container's shallow
  clone).

CHECKPOINT · 2026-11-22 · tip = this commit ([skip ci]) · BASE 84cbc03126eddb85c7d5cf54b51610068800315c · A8 BOUND (row 1311) · moved: ci/mq2/witness/witness_mq2.mjs → ci/mq2/witness_mq2.mjs (probe_base.mjs keeps ci/mq2/witness/) · witness build GREEN MQ2 · 11 clause(s) 3 of 3 · base RED MQ2 · A1, A2, A3, A4, A5, A6, A7, A9 · mutants 9 of 9, control GREEN · WITNESSES 64 units judged, mq2 GREEN at head (RED MQ2 · BOUND, dropped), 124 passed 5 failed (shallow-clone BASE only) · resume from: the architect's re-run
