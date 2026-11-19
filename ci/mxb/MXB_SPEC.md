# MXB SPEC — the six blindnesses Q6 names (B1-B6), one IR family in `scripts/xray.mjs`

Unit mxb · forks rows 1138 (1) F8 A and 1150 · **spec seat, cloud, written 2026-11-19 (UTC)**. Branch `claude/mxb-spec`.
Nothing is built: the candidate lives as a patch (`ci/mxb/witness/xray_mxb.patch`) and is measured only in temp trees
under `os.tmpdir()`. Every act is a row in `ci/mxb/LEDGER.jsonl` (its `ts` is the moment the row was logged, 2026-11-19).
Every count below was measured on 2026-11-19 by the command named beside it; the IR is built from CODE ONLY (xray
lists state FILE NAMES for `on_disk`; no state file's content is read, printed or committed).

**HEADLINE (2026-11-19):** five transfer rules in `scripts/xray.mjs` (an OBJECT value, a FUNCTION value / return value,
a block body's agreed return, the `openSync`→`writeSync` descriptor, and `probe` dropped from the fixture words) plus one
guard (a test call site's object value binds nothing) resolve **all six** blindnesses. Q6 goes from 7 rows to 1 (only D1,
kept outside the repo by F11 A). **Q2 stays at its base row** (1, `thalamus_config.json`, already on main, not this unit's),
**Q5 stays 0**, no organ gets blinder (unresolved sites 2040 → 2006), the law pack and the hermetic suite are identical,
base vs build. The witness has 10 clauses (7 RED on base, all 10 GREEN on the build) and 10 mutants, each RED by its clause.

## 0 · The base

- Cut from `origin/main` **fb42118** (`ci/mxb/BASE`) by `git fetch origin main; git checkout -b claude/mxb-spec FETCH_HEAD`.
  Main holds unit mxh: `scripts/xray.mjs` is blob **47b9de0** (`git hash-object scripts/xray.mjs`), the mxh build's bytes.
- The input: `git show ac14bad:ci/mxh/PROOF.md` §8 (fetched from `origin/claude/mxh-build`).
- `acorn` (the IR's parser) is a devDependency; this clone had no `node_modules`: `npm ci --ignore-scripts` first.
- **No line moved at this cut.** `git rev-parse <cut>:scripts/<organ>.mjs` for each organ: models `e553bee`, sitting
  `7f88e35`, scoreboard `ee3149f`, manager `0a03773`, teaching_gate `80cb302`, usage_tap `0ef1fee` are the SAME blob at
  224f9b9 (the table's cut) and fb42118; rails is `992cacf` at 224f9b9 and `2616cf9` at both a583afb (the spec's B5
  cut) and fb42118. So every file:line of the table stands at fb42118, and B5's `:326-327` (a583afb) stands too.

### The base measurement (code only; `m.mjs` = `build()` + `queries()` imported from the tree's own `scripts/xray.mjs`)

```
node <scratch>/m.mjs /home/user/arsenal-ai-fc        # fb42118, 2026-11-19
unresolved 2040 · files 419 · Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7
Q2: dressing-room/state/thalamus_config.json W=gate_tune.mjs,thalamus.mjs          <- ALREADY ON MAIN (named, §6 F-Q2)
Q6: brain_outcomes.jsonl<scoreboard.mjs  manager_notes.json<manager.mjs(no IR file)  models.json<models.mjs
    rails_blind.jsonl<rails.mjs(no IR file)  sitting.json<sitting.mjs  teaching_gate.jsonl<teaching_gate.mjs(no IR file)
    usage_reading.json<usage_tap.mjs(no IR file)                                     <- D1, F11 A
```

**The temp trees.** `node ci/mxb/witness/plant_tree.mjs --repo <repo> [--xray <file>] --tag <w>` copies `scripts/` and
SYMLINKS every other top-level entry (read only), under `os.tmpdir()`. Control, 2026-11-19: the Q1-Q6 rows of a planted
base tree equal the repo's rows exactly (`true`, unresolved 2040 = 2040). One layout artifact, named: `ir.files` counts
421 in a planted tree against 419 in the repo, because paths built as `join(ROOT, "..", …)` or from `"."` resolve outside
the temp root (e.g. `no-such-dir-xyz/afferent.jsonl`, `CyborgArchive/README.md`); none is under `dressing-room/state/`,
so no query row moves. Base and build are always compared in trees of the SAME layout.

## 1 · Each blindness, re-read at fb42118 (file:line), and the rule that follows it

Each declaring header is the organ's own (the owner, by `grep -n "SOLE WRITER" scripts/<organ>.mjs`): models.mjs:8 ·
sitting.mjs:14 · scoreboard.mjs:17 · manager.mjs:21 · rails.mjs:5 · teaching_gate.mjs:58 · usage_tap.mjs:10. A rule
here is in the IR only; it changes no organ, and no organ's file gains or loses a writer in the code.

| # | the real write at fb42118 | why the base IR loses it | the rule(s) that resolve it (measured alone, §2) |
|---|---|---|---|
| B1 | `models.mjs:430` `renameSync(tmp, path)` in `finishProbe` `:425` (param `{ write, path, prev, t0 }`, no default), called `:423` (and `:348`) as `finishProbe(out, { write, path, prev, t0 })` from `probe({ … path = MODELS_JSON … } = {})` `:345`; `MODELS_JSON` `:88` | (a) an ObjectExpression argument never binds an ObjectPattern parameter (`xray.mjs:679-686` binds Identifier/AssignmentPattern slots only); (b) **a second, unnamed blindness**: once bound, the write is classed a FIXTURE, because `fixtureOnly` (`xray.mjs:909`) tests the ctx `finishProbe` against `/…|probe/i` | **R-OBJ + R-CTX** (neither alone) |
| B2 | `sitting.mjs:503` `writeAtomic(F.sitting(), S)` (and `:1735`) → `writeAtomic` `:172` `renameSync(tmp, p)`; `F.sitting` is `() => join(STATE_DIR, "sitting.json")` in the object literal `F` `:94-95` | `collectDecls` evaluates an object property's VALUE (`xray.mjs:385`): an arrow is Unknown; the zero-arg thunk seed (`:372-375`) covers only `const X = () => …`, and the call lookup (`:299`) asks for `sitting()` not `F.sitting()` | **R-CALL** |
| B3 | `scoreboard.mjs:168` `appendFileSync(outPath, …)` in `appendMissing` `:160`, called `:402-403` with `deps.outPath`; `deps` is `runDay`'s plain param `:394`, bound at `:633` to `liveDeps(now)` whose block body returns `{ … outPath: OUT_PATH }` `:377-391`; `OUT_PATH` `:86` | the return value of a BLOCK-bodied call is Unknown (`xray.mjs:297-301`), and an object value never reaches a plain parameter as `deps.outPath` | **R-OBJ + R-RET** |
| B4 | `manager.mjs:1007` `writeAtomic(dir, P("manager_notes.json"), …)` → `writeAtomic` `:964` `renameSync(tmp, path)` `:971`; `P = mkP(dir)` `:977`; `mkP = (dir) => (f) => join(dir, f)` `:48`; `dir = stateDir \|\| process.env.ARSENAL_STATE_DIR \|\| DEFAULT_STATE` `:976` | a call's return value that is itself a FUNCTION (a closure) is Unknown, so `P(...)` is Unknown | **R-CALL** (the closure kept in scope) |
| B5 | `rails.mjs:326-327` `const fd = openSync(file, flag); … writeSync(fd, text)` in `blindDoor(file, flag, text)` `:325`, called by `recordBlind` `:336` and `bornBlind` `:349` with `file = railsBlindFile(env)` `:333`/`:347`; `railsBlindFile` `:317-323` returns `RAILS_BLIND_FILE` `:313` or a temp-dir-only env door | (a) `openSync`/`writeSync` are not in the sink class (`WRITE_FNS`, `xray.mjs:436`); (b) the path is the return value of a block-bodied call | **R-FD + R-RET** |
| B6 | `teaching_gate.mjs:807` `appendFileSync(GATE_LOG(dir), …)` in `stopHook({ … dir = STATE_DIR … } = {})` `:785`; `GATE_LOG = (dir = STATE_DIR) => join(dir, "teaching_gate.jsonl")` `:82` | the return value of a const-arrow call with an argument is Unknown (only zero-arg thunks are seeded) | **R-CALL** |
| D1 | `usage_reading.json` (`usage_tap.mjs:10`) lives in the campaign root, outside the repo (F11 A) | kept by design | none — it stays the one Q6 row |

## 2 · The rules, and which blindness each resolves (measured alone and together, 2026-11-19)

The rules were measured as a FLAGGED PROTOTYPE (scratch only, `MXB_RULES=<set>`), one tree, one rule set per run; the
build candidate is the same code with the flags removed (its rows equal the all-rules prototype's, `true`).

```
rule set (MXB_RULES)            unresolved  Q1 Q2 Q3 Q4 Q5 Q6   Q6 rows left
(none = base)                   2040        14  1  5  3  0  7   all six + D1
obj                             2039        14  1  5  3  0  7   (B1 bound but classed fixture; B3 needs ret)
call                            2008        13  1  6  1  0  4   B1 B3 B5 D1          -> resolves B2 B4 B6
ret                             2039        14  1  5  2  0  7   (B5 needs fd; B3 needs obj)
fd                              2040        14  1  5  3  0  7   (B5 needs ret)
ctx0                            2040        14  1  5  3  0  7   (B1 needs obj)
obj,ctx0                        2039        13  1  5  3  0  6   -> resolves B1
obj,ret                         2037        13  1  5  2  0  6   -> resolves B3
fd,ret                          2039        14  1  5  2  0  6   -> resolves B5
obj,call,ret,fd,ctx0,objprod    2006        11  1  6  0  0  1   D1 only  (= THE CANDIDATE, blob 70d45c4)
```

**The rules (the candidate, `ci/mxb/witness/xray_mxb.patch` against blob 47b9de0; hunks at base lines):**

- **R-OBJ — the object value** (`@@ -270` `@@ -297` `@@ -676`). `evalNode` gains `ObjectExpression → {k:"o", p}` (its
  non-computed properties' values) and `x.key` on an object value. In the fixpoint (`xray.mjs:679-686`) an object value
  binds an ObjectPattern parameter's named slots, and a plain parameter `deps` as the dotted slots `deps.outPath`, which
  the existing `flatMember` lookup (`:272-273`) already reads. Resolves B1 (with R-CTX) and B3 (with R-RET).
- **R-CALL — the function value and the return value of an expression body** (`@@ -297` `@@ -318` `@@ -382` `@@ -415`).
  `evalNode` gains `Arrow/FunctionExpression → {k:"f", params, body, scope}`; an object literal's arrow property is kept
  as `F.key` (`:378-387`); a `const` bound to a closure or an object value is kept (`:416-417`); a call whose callee is a
  function value (a closure in scope, a function this file declares, or `F.key`) is APPLIED: parameters bound to the
  arguments (a missing one takes its default, an Unknown one stays MASKED, the mxh N1 discipline), and an expression
  body is evaluated. Resolves B2, B4, B6.
- **R-RET — a block body's return** (same hunk). Every `return` the body may take is collected (nested functions
  excluded; a conditional return is BOTH arms). The value is the one Const path all evaluable returns agree on, or the
  one evaluable object value; an Unknown return is the env door and does not veto (`xray.mjs:259-263`'s `||` precedent).
  **A block body's locals are MASKED, not evaluated** — measured: evaluating them (`retl`) re-blinds B5, because
  `railsBlindFile`'s `resolve(v)` with `v = ""` folds to THIS MACHINE's cwd (a phantom path; Q6 2). Re-entry on the
  same body is Unknown (no depth cap is typed). Resolves B3 (with R-OBJ) and B5 (with R-FD).
- **R-FD — the descriptor** (`@@ -495`). `const fd = openSync(<Const path>, …)` remembers its path; `writeSync(fd, …)`
  on that name is a WRITE of that path. `openSync` alone records nothing. Measured: the naive fix (`openSync` in
  `WRITE_FNS`, whatever its flag) INVENTS a writer — `viz.mjs` becomes a second writer of `reps_log.jsonl` (a Q2 row);
  that is mutant M8. Resolves B5 (with R-RET).
- **R-CTX — `probe` is not a test word** (`@@ -109` `@@ -906`). `FIX_CTX = /selftest|selfTest|_test|fixture|demo|canary/i`,
  one module const used by `fixtureOnly` and by the guard below. Measured alone (`fix.mjs`, 2026-11-19): it flips NINE
  edges from fixture to live, every one a production function — `watchman.mjs` `probeSittingReview` `:1290`,
  `probeUnleashVerdict` `:1335`, `probeSentinel` `:1834`, `probeOutcomes` `:1982` and their siblings (reads of
  sitting_reviews, brain_ledger, throwin_topic, recital_audit, brain_outcomes, two dated night_coach files,
  setup/CLOUD_SENTINEL.md) and `archivist.mjs` `hookProbe` `:3378` (hooks/afferent-post.mjs). Negative probes stay
  fixtures by their PATH (`NEGATIVE_PROBE`, `xray.mjs:908`). Resolves B1 (with R-OBJ).
- **G-FIX — a test call site's object value binds nothing** (`@@ -544`, at `xray.mjs:547`). Measured without it:
  `state.mjs` gains live reads of `scripts/daemon_watchdog.json`, `scripts/watchman_last.json`, `scripts/sitting.json`,
  `scripts/captains_call.json` — its selftest's `daemonFacts({ stateDir: bare })` (`state.mjs:401-403`, `bare` =
  scripts/) bound the production parameter, and the callee records its sinks under its OWN ctx. Also `claims.mjs`
  `:255`, `heartbeat.mjs` `:370-371`. The guard removes all of them but one (§3 E7).

**No single rule covers all six; R-CALL alone covers three (B2 B4 B6). Each of the five rules is NECESSARY** —
leave-one-out on the prototype, 2026-11-19 (`MXB_RULES` = all but one):

```
without obj    unresolved 2007  Q6 3  brain_outcomes.jsonl, models.json, usage_reading.json
without call   unresolved 2038  Q6 4  manager_notes.json, sitting.json, teaching_gate.jsonl, usage_reading.json
without ret    unresolved 2008  Q6 3  brain_outcomes.jsonl, rails_blind.jsonl, usage_reading.json
without fd     unresolved 2006  Q6 2  rails_blind.jsonl, usage_reading.json
without ctx0   unresolved 2006  Q6 2  models.json, usage_reading.json
without objprod unresolved 2005 Q6 1  usage_reading.json   (G-FIX resolves no B; it removes the false state.mjs/claims/heartbeat edges)
```

## 3 · Every NEW row the candidate adds to every query on main (base → build, 2026-11-19)

```
node <scratch>/diff-rows (base tree, candidate tree)      # Q1-Q6 row sets
Q1 + dressing-room/state/gemini_quality.jsonl.quarantine.jsonl  W= R=1     (NEW ROW)
Q1   dressing-room/state/throwin_topic.txt  readers 2 -> 3                 (same row, one more reader: watchman, R-CTX)
Q1 - brain_outcomes.jsonl · models.json · sitting_reviews.jsonl · team_sheet.md        (four false dead reads gone)
Q3 + dressing-room/state/manager_notes.json  W=manager.mjs R=0             (NEW ROW)
Q4 - rails_blind.jsonl · sitting_config.json · teaching_gate.jsonl         (three false ghosts gone)
Q6 - B1 B2 B3 B4 B5 B6                                                     (D1 stays)
Q2  unchanged: thalamus_config.json <gate_tune.mjs+thalamus.mjs (the base row)   ·   Q5 0 -> 0
```

**Each new row, named (a rule that invents a writer is a false finding — none is hidden):**
- **E1 · Q1 + `gemini_quality.jsonl.quarantine.jsonl` — a TRUE read, a remaining WRITER blindness, no invented writer.**
  R-CALL lets the IR see the read: `geminiQuarantineTriage` `capture.mjs:1355` takes `sidecar = geminiQuarantinePathFor(
  ledgerPath)` `:1356` (`const geminiQuarantinePathFor = (ledgerPath) => ledgerPath + ".quarantine.jsonl"` `:1347`) and
  reads it at `:1357`/`:1380`. Its writer is `capture.mjs:962` `appendFileSync(sidecar, …)`, with `sidecar = path +
  ".quarantine.jsonl"` `:960`, inside the NESTED arrow `fail` `:959` of `recordGeminiQuality(path, stats)` `:954`. The
  parameter `path` IS bound (`recordGeminiQuality(GEMINI_QUALITY, stats)` `:1577`, `GEMINI_QUALITY` `:95`), but the
  fixpoint walks every collected function, `fail` among them, in the MODULE scope (`xray.mjs:690-707`), so a nested
  closure's free variable from its enclosing function's parameter is Unknown there. Not cross-file: a remaining
  per-file blindness, named (§6 F-E1).
- **E2 · Q3 + `manager_notes.json` (W=manager.mjs, R=0) — a TRUE orphan by the code.** `grep -ln manager_notes
  scripts/*.mjs` names `brain.mjs` and `manager.mjs`; brain.mjs's one hit (`:4454`) is a comment, and manager.mjs's own
  read (`:1075`) is in its selftest (a fixture). Its own header calls it a run log (`manager.mjs:21`). Whether a run log
  needs a reader is the architect's (§6 F-E2).
- **No writer is invented.** The build ADDS 15 writer edges (`witness_mxb.mjs` W8, 2026-11-19); every one is onto a
  file no other organ writes (`onto a shared file 0`), Q2 holds exactly the base row, Q5 is 0. By organ, from the IR
  diff: scoreboard→brain_outcomes.jsonl (B3) · models→models.json (B1) · manager→team_sheet.md, manager_notes.json
  (B4; both its own, `manager.mjs:21`) · rails→rails_blind.jsonl (B5) · teaching_gate→teaching_gate.jsonl (B6) ·
  sitting→sitting.json (B2), sitting_out/log/reviews.jsonl (its own, `sitting.mjs:14-20`), sitting_agenda.jsonl (its
  own, `sitting.mjs:102`), brain_out/sitting/sitting_system.md (NOISE_RE, no query row) · three `.lock` files
  (capture reps_log.jsonl.lock, sitting.json.lock, tasks.jsonl.lock; their own locks; the query extension filter
  `xray.mjs:1093` keeps `.lock` out of every query).
- **New IR edges outside every query (named, not rows):**
  - E3 `manager.mjs` reads `loop_vitals.json` (true: `manager.mjs:994` says it reads it, physio its sole writer).
  - E4 `archivist.mjs` reads `hooks/afferent-post.mjs` (true: R-CTX un-fixtures `hookProbe` `:3378`).
  - E5 `watchman.mjs` reads its eight probe inputs (true: R-CTX, §2).
  - E6 `sitting.mjs` reads `sitting_config.json`, `sitting.json`, its own ledgers (true: `F.*` thunks `:94-102`).
  - **E7 · `study_scope.mjs` reads `scripts/no-such-dir/sitting.json` — a FALSE edge, outside every query.** Its
    selftest's object value `{ dir: join(HERE, "no-such-dir") }` (`study_scope.mjs:768`) is built inside a `const`
    ARROW whose ctx the walker never names (CTX moves only on a NAMED FunctionDeclaration/Expression, `xray.mjs:589-591`),
    so G-FIX does not see a test site. Not a state path, no query row; §6 F-CTX names the fix that would remove it.

**Q2 and Q5 (2026-11-19): Q2 is 1 on base and 1 on the build, the SAME row; Q5 is 0 on both.** The brief's "stay 0"
cannot hold for Q2 at this cut because main's Q2 is already 1 (`thalamus_config.json`, written by `gate_tune.mjs`
`:67` `CONFIG` and by `thalamus.mjs`): pre-existing, beyond this unit (§6 F-Q2).

**Unresolved sites (2026-11-19), per organ, base → build — only falls:** capture 123→115 · manager 52→51 · rails 19→18 ·
scoreboard 6→5 · sitting 32→16 · tasks 8→4 · teaching_gate 12→9; total 2040 → 2006. No organ rises (W9).

## 4 · The witness (clauses, both ways)

`ci/mxb/witness/witness_mxb.mjs --org <tree> --base-org <tree> --p10 <mini tree>`. In-process `build()`/`queries()` of each
tree's own `scripts/xray.mjs` (a fresh module instance per tree). No port, no service, no daemon, no spawn, no model
call, no wait (THE PORT CLASS, row 1053: nothing to bind, nothing to POST, nothing to restart).

| clause | judges | base | build |
|---|---|---|---|
| W1-W6 | B1-B6: the declared sole writer is the IR's ONE non-fixture writer of its state file | RED (writers=[]) | GREEN |
| W7 | Q6 is exactly `usage_reading.json<usage_tap.mjs` (D1, F11 A) | RED (7 rows) | GREEN |
| W8 | GUARD · no writer invented: Q2 rows build = base, Q5 = 0, every added writer edge onto an unshared file | GREEN by design | GREEN |
| W9 | GUARD · no organ's unresolved sites rise | GREEN by design | GREEN |
| W10 | GUARD · P10, a planted idiom: a selftest's `facts({ stateDir: bare })` must not make `p10_testdir` a live read | GREEN by design | GREEN |

A guard cannot be RED on base (base IS the reference); its RED is shown by its mutant (§5). W10's plant is a mini tree
(`plant_tree.mjs --plant-p10`: `scripts/xray.mjs`, one organ `scripts/p10.mjs`, a stub `package.json` because
`rootSets` reads it unguarded at `xray.mjs:834`, and `node_modules` linked).

```
# 2026-11-19, the final candidate (blob 70d45c4) — last lines
on BASE  (--org base --base-org base):    witness_mxb: 3 GREEN, 7 RED     (W1-W7 RED; W8-W10 GREEN)
on BUILD (--org build --base-org base):   witness_mxb: 10 GREEN, 0 RED
```

## 5 · The mutants (one per clause; each must turn ITS clause RED)

`ci/mxb/witness/run_mutants_mxb.mjs --repo <repo> --xray <candidate> --base-org <base tree>`: one string replacement in a
copy of the candidate per mutant, an anchor not found exactly once is UNAPPLIED (a RED runner, never skipped), the
witness runs in a synchronous child (each wait bounded by the child's own exit; nothing typed — the mxh runner's
precedent). Control: the unmutated candidate must be all GREEN.

| mutant | kills | the one replacement |
|---|---|---|
| M1 | W1 | an object value no longer binds an ObjectPattern parameter (`else if (pat)` → `else if (false)`) |
| M2 | W2 | an object literal's arrow property is not a function value (`F.sitting`) |
| M3 | W3 | an object value no longer flattens into a plain parameter (`deps.outPath`) |
| M4 | W4 | a call's closure is not kept in scope (`const P = mkP(dir)`) |
| M5 | W5 | `writeSync` on an `openSync` descriptor is not a write |
| M6 | W6 | an expression body's return value is not evaluated (`GATE_LOG(dir)`) |
| M7 | W7 | `probe` is a test word again (B1's write a fixture; Q6 keeps models.json) |
| M8 | W8 | `openSync` is a WRITE whatever its flag — the naive B5 fix; invents viz.mjs → reps_log.jsonl (Q2) |
| M9 | W9 | a `writeSync` on a descriptor the IR cannot follow counts as an unresolved site |
| M10 | W10 | the G-FIX guard off (`const fixSite = false;`) |

```
# 2026-11-19, the final candidate — the runner's last lines
control: witness_mxb: 10 GREEN, 0 RED (exit 0)
M1 RED by W1 · red=[W1,W7] · an object value no longer binds an ObjectPattern parameter (finishProbe's `{ path }`)
M2 RED by W2 · red=[W2,W7] · an object literal's arrow property is no longer a function value (`F.sitting`)
M3 RED by W3 · red=[W3,W7] · an object value no longer flattens into a plain parameter (`deps.outPath`)
M4 RED by W4 · red=[W3,W4,W7] · a closure returned by a call is not kept in scope (`const P = mkP(dir)`)
M5 RED by W5 · red=[W5,W7] · writeSync on an openSync descriptor is not a write (the sink class without the fd rule)
M6 RED by W6 · red=[W2,W4,W6,W7] · an expression-bodied function's return value is not evaluated (`GATE_LOG(dir)`)
M7 RED by W7 · red=[W1,W7] · `probe` is a test word again (finishProbe's write is a fixture, B1 stays in Q6)
M8 RED by W8 · red=[W8] · openSync is a WRITE whatever its flag (the naive sink-class fix for B5: a read-open becomes a writer)
M9 RED by W9 · red=[W9] · a writeSync on a descriptor the IR cannot follow is counted as an unresolved site
M10 RED by W10 · red=[W10] · an object value built at a TEST call site binds a production parameter
run_mutants_mxb: 10 of 10 mutant(s) RED by the clause that names them · control GREEN
```

A mutant measured and REJECTED, named: "a block body's returns need not agree — the first evaluable return wins"
SURVIVED W8 on this tree (no writer invented at fb42118). The agreement rule is kept as a sound default, not as a
measured necessity (§6 F-AGREE).

## 6 · FORKS (each with its options, the recommendation, and what would decide it)

- **F-SET · which rules land.** (A) all five + G-FIX (Q6 7→1, every B resolved). (B) R-CALL alone (the cheapest: B2 B4 B6;
  Q6 7→4). (C) per blindness, one unit each. **Recommend A** — the measurement (§2) shows every rule is necessary for at
  least one B, and A adds two new query rows (E1, E2), both true by code. Decides: §2's table, re-run at the landing cut.
- **F-CTX0 · the fixture word `probe`.** (A) drop it (R-CTX; nine production edges become live, B1 resolves). (B) anchor
  it `^probe` (keeps the watchman's `probe*` as fixtures; still resolves B1, since `finishProbe` does not START with it;
  measured: only `hookProbe` flips). (C) keep it; B1 stays in Q6. **Recommend A**: `probeSentinel`, `probeOutcomes` and
  their siblings are the nightly sweep, production by their own header (`watchman.mjs:795`). Decides: his word on
  whether a watchman probe is a lane.
- **F-AGREE · the block-return rule.** (A) agreement (every evaluable Const return equal, else the one object value).
  (B) the first evaluable return. **Recommend A**: B invents nothing at fb42118 (the rejected mutant, §5) but returns
  ONE branch's path as if it were the only one. Decides: a function with two different Const returns landing in a
  later cut.
- **F-RETL · a block body's locals.** (A) masked (the candidate). (B) evaluated. **Recommend A**: B re-blinds B5 through
  `resolve("")` = the analysing machine's cwd (§2). Also named, beyond this unit: that phantom is a base evaluator flaw
  (`xray.mjs:282-286` folds `resolve("")`/`join(".")` to `process.cwd()`); it is how E7's family and `claims.mjs:255`
  print `/home/user/…` paths on the cloud.
- **F-CTX · E7 and the arrow-ctx gap.** (A) leave it (one false edge, outside every query). (B) name the ctx of a `const`
  arrow too (`xray.mjs:589-591`, the walker). **Recommend A for this unit**; B moves the fixture flag of every
  arrow-bodied selftest in the repo — its own unit, measured first.
- **F-E2 · `manager_notes.json` orphan (Q3).** (A) a run log with no consumer is a finding (Q3 holds it). (B) declare it
  a log the query excludes. **The architect's call**; the IR now reports what the code does.
- **F-E1 · a nested closure's free variable.** (A) leave E1 as a named Q1 row. (B) walk a nested function in its
  ENCLOSING function's scope (the fixpoint at `xray.mjs:690-707` uses `env`). **Recommend A for this unit**: B changes
  the scope of every nested function in every organ; measured first in its own seat (the decider: its row diff on all
  six queries). Related but distinct, mxh's F-P (notes_corrections, an IMPORTED reader function's read attributed to
  the exporter) is the cross-file family; neither is in B1-B6.
- **F-Q2 · the base Q2 row.** `thalamus_config.json` has two writers on main (gate_tune.mjs `:67`, thalamus.mjs) — not
  in `MULTI_WRITER_ALLOWLIST` (`xray.mjs:1066-1068`), and `gate_tune.mjs:18` calls itself its DECLARED OWNER. Whose unit
  rules it is the architect's; this unit moves it neither way.
- **F-SELFTEST · xray's own selftest is RED on main** (`xray: 19 passed, 4 failed`, repo and build alike, 2026-11-19):
  the three NUL-byte asserts (the committed `calibration.mjs`/`dmn.mjs`/`rejirah.mjs` blobs carry no NUL byte on main,
  `git show HEAD:scripts/dmn.mjs` → 0) and the unresolved ratchet against the tracked `xray_graph.json` (baseline 1475).
  It is LIVE in the hermetic profile (not run). The build takes rails and sitting off the ratchet's "blinder" list
  (measured 2026-11-19) and adds none. Who re-freezes the baseline (owner `xray.mjs:4`, `node scripts/xray.mjs build`) is the
  runner's act at a landing (mxh F-B).
- **F-CONSUMERS · the IR's readers move.** `done.mjs:38` imports `build`/`queries` (L5's static leg: "did it reach its
  RIGHT consumer"); `audit.mjs`, `flow_atlas.mjs`, `blackbox.mjs`, `herd.mjs` read `xray_graph.json`. New readers and
  writers (E3-E6, the sitting lanes) change their verdicts. (A) land and re-measure them at the landing. (B) measure
  first in a seat. **Recommend B for done.mjs only** (it is a gate); the rest report.

## 7 · NAMED, NOT GUESSED (what the cloud could not reach, and what would measure it on his laptop)

- **Q1 and Q4 on his disk.** Both read `on_disk` (`xray.mjs:1033`), and this clone's `dressing-room/state/` holds only
  TRACKED files. His laptop's rows will differ. Measure: `node scripts/xray.mjs q` before and after the patch, on his
  root, and diff the Q1/Q4 rows.
- **CRLF.** Every measurement here is on an LF checkout. Measure: the witness on a CRLF copy of the trees (the mxh
  witness's CRLF leg is the precedent), on his Windows checkout.
- **The ratchet baseline after re-emit.** What `xray_graph.json`'s `unresolved_sinks` becomes after
  `node scripts/xray.mjs build` on his root (it lists his state dir).
- **`done.mjs` verdicts** (F-CONSUMERS): `node scripts/done.mjs` before/after on his root; it reads the registry.
- **The live suite.** `npm test` and the LIVE xray/audit/blackbox/flow_atlas/herd selftests — never run here (the brief).
- **The patch with `git apply` on Windows** (the cloud used `git apply --check` and GNU `patch`, both CLEAN, blob 70d45c4).

## 8 · The named files a build would touch

| file | what |
|---|---|
| `scripts/xray.mjs` | the patch `ci/mxb/witness/xray_mxb.patch` (owner of `xray_graph.json`, `xray.mjs:4`; no state file is written by the rules) |
| `ci/mxb/witness/witness_mxb.mjs` | the witness (W1-W10) |
| `ci/mxb/witness/run_mutants_mxb.mjs` | the mutants (M1-M10) |
| `ci/mxb/witness/plant_tree.mjs` | the temp-tree planter (base / build / P10) |

**Beyond them, each a fork:** `dressing-room/state/xray_graph.json` (re-emit, F-SELFTEST) · `scripts/done.mjs`
(F-CONSUMERS) · `scripts/organism_test.mjs` (only if the architect wants the witness as a suite member; not proposed).

### Reproduce (the runner, his root or a cloud clone)

```
npm ci --ignore-scripts                                            # acorn
T=$(node -p "require('fs').mkdtempSync(require('path').join(require('os').tmpdir(),'mxb-c-'))")
git show fb42118:scripts/xray.mjs > $T/xray.mjs && patch -s $T/xray.mjs ci/mxb/witness/xray_mxb.patch   # -> blob 70d45c4
B=$(node ci/mxb/witness/plant_tree.mjs --repo . --tag base | tail -1)
O=$(node ci/mxb/witness/plant_tree.mjs --repo . --xray $T/xray.mjs --tag build | tail -1)
PB=$(node ci/mxb/witness/plant_tree.mjs --repo . --plant-p10 --tag p10b | tail -1)
PO=$(node ci/mxb/witness/plant_tree.mjs --repo . --xray $T/xray.mjs --plant-p10 --tag p10o | tail -1)
node ci/mxb/witness/witness_mxb.mjs --org $B --base-org $B --p10 $PB     # RED on base
node ci/mxb/witness/witness_mxb.mjs --org $O --base-org $B --p10 $PO     # GREEN on the build
node ci/mxb/witness/run_mutants_mxb.mjs --repo . --xray $T/xray.mjs --base-org $B
```

### The suite and the law pack, base vs build

```
# 2026-11-19 — ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all (repo; build = patch applied in place, then git apply -R, blob back to 47b9de0)
base : organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
build: organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
       (the same one row on both, already on main: the selftest-coverage law, orphaned deck_lint, home_pin, probe, study_scope)
# 2026-11-19 — node scripts/lawpack.mjs report (base tree vs build tree: IDENTICAL output)
lawpack · 1933 raw match(es) over 8/8 rules · jugad-literal-subject-list 93 (frozen 90) · depcruise_errors 13 (frozen 7)
repo: lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)     (already on main: mxh F-C)
```
The candidate adds no `const X = [ … ]` (the jugad shape): its return collector is a recursive `flatMap`, the mxh
precedent. `git worktree add` for the build measurement was REFUSED by the repo's worktree rail (not overridden); the
build was measured in place and reverted.

## 9 · The neutral machine (public API, no token)

```
GET https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs
5b7cf3b  run 44511562686  jobs 135516829744 (npm test · node 22) / 135516829267 (npm test · node 24)  completed / SUCCESS   (the first spec push, 2026-11-19)
```

## 10 · Peer/architect messages received

None received in this session up to the last push (2026-11-19). This §9 update rides the next push; its run is the next row of `ci/mxb/LEDGER.jsonl`.
