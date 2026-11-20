# MXC SPEC — three evaluator gaps of `scripts/xray.mjs`, and a fate for `manager_notes.json`

CHECKPOINT · STOPPED at 2026-11-20T01:47:23Z · row 1175 (5) done (§3b, W8, M8) · resume from: read the neutral verdict of this tip (both legs) and wait for a ruling

Unit mxc · forks row 1161 (6) · cloud spec seat, written 2026-11-19 (UTC). Branch `claude/mxc-spec`. Resumed
2026-11-19 on his word #270 from `CHECKPOINT · STOPPED at 2026-11-19T12:38:21Z` (tip c9b1dcc); that line is superseded here.
Nothing is built. The candidate xray.mjs is GENERATED from the base by `ci/mxc/witness/make_candidate.mjs` (8 exact-once
string edits; an anchor found other than once is REFUSED) and measured only in temp trees under `os.tmpdir()`
(`ci/mxc/witness/plant_tree.mjs`). The IR is built from code only: xray lists state FILE NAMES for `on_disk`, and no
state file's content is read, printed or committed. Every act is a row in `ci/mxc/LEDGER.jsonl`.
Every count below was measured on 2026-11-19 by the command named beside it or in the fenced block above it.

**HEADLINE (2026-11-19):** four small rules in `xray.mjs` close all three gaps. **R-CWD** (gap 1): a `join` joins, a
`resolve` folds only from an absolute anchor, an empty path is an unresolved site, `relRepo` never consults the cwd.
**R-ACTX** (gap 2): a module-scope `const` arrow names its body's ctx. **R-NEST + R-MASK** (gap 3): a nested function's
locals are folded over the scope it closes over, and a local masks the outer name. On the repo the IR becomes the same
from any cwd (13 edges moved at base, 0 on the build). The mxb spec's E1 Q1 row closes once stacked on mxb. No verb set
moves, Q5 stays 0, and Q2 is unchanged on base. The witness has 8 clauses: 5 RED on base, all 8 GREEN on the build (2026-11-20).
There are 8 mutants, each RED by its own clause.
⚠ **Measured on the way, for unit mq2:** `watchman.mjs` `probeWakeEconomy` writes `thalamus_config.json` in production.
Stacked on mxb (which drops `probe` from the fixture words), Q2's row gains a THIRD writer: gate_tune, thalamus, watchman.

## 0 · The base

- Cut from `origin/main` **fb42118** (`ci/mxc/BASE`) by `git fetch origin main; git checkout -B claude/mxc-spec FETCH_HEAD`.
  `scripts/xray.mjs` is blob **47b9de0** (`git hash-object scripts/xray.mjs`). Input: `git show 4d329ff:ci/mxb/MXB_SPEC.md`, read whole.
- `acorn` is a devDependency: `npm ci --ignore-scripts` first.
- The mxb candidate, for the stacked measurements: `git show 4d329ff:ci/mxb/witness/xray_mxb.patch` applied to 47b9de0
  gives blob **70d45c4**, the mxb spec's own. All 8 mxc edits apply cleanly (each anchor exactly once) on BOTH 47b9de0 and 70d45c4.
- The mxc candidate: `node ci/mxc/witness/make_candidate.mjs --base scripts/xray.mjs --out <f>` gives blob **36f8757**.
  `--flagged` emits the measuring prototype instead; there each rule is guarded by `MXC_RULES` (`cwd`, `ctx`, `nest`, `mask`).

```
# 2026-11-19 · node ci/mxc/witness/measure.mjs --tree <tree>      (run from the tree root)
base fb42118                unresolved 2040 · files 419 · Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7
base + mxc (36f8757)        unresolved 2033 · files 420 · Q1 14 · Q2 1 · Q3 6 · Q4 3 · Q5 0 · Q6 7
mxb (70d45c4)               unresolved 2006 · files 432 · Q1 11 · Q2 1 · Q3 6 · Q4 0 · Q5 0 · Q6 1
mxb + mxc (all rules)       unresolved 1996 · files 432 · Q1 10 · Q2 1 · Q3 6 · Q4 0 · Q5 0 · Q6 1
```

## 1 · GAP 1 — an empty / relative path folded to the ANALYSING machine's folder

**The code path at fb42118.** `xray.mjs:281-286` evaluates `join`, `resolve` and `pathResolve` all as
`pathResolve(...)`, so a relative part folds onto `process.cwd()` of whoever runs xray. `join(ROOT, join("docs", x))`
therefore DROPS `ROOT` whenever the cwd is not the root. `relRepo` (`xray.mjs:100-104`) calls `relative(ROOT, p)`, which
resolves a relative or empty `p` against `process.cwd()` too. So the IR is a function of WHERE it ran.

**The sites it hides, by command (2026-11-19).** `build()` was run from the tree root and from a temp dir, and the edges
were diffed (`ci/mxc/witness/diff.mjs`): 13 edges move and `ir.files` is 419 vs 421. The mxb spec's "layout artifact" is this gap.

| organ | line(s) of the sink | why it folds |
|---|---|---|
| archive_audit.mjs | `:407 :412 :414 :427 :742 :743` | `archiveRoot()` `:105` yields a relative root |
| brain.mjs | `:248 :282` | selftest dir `"no-such-dir-xyz"` (`:5107`) bound into `readLinesTail` |
| distiller.mjs | `:90` | selftest dir `"no-dir"` (`:833`) bound into `readLines` |
| registry.mjs | `:383` | `join("scripts", String(r.owner \|\| ""))` (`:397`) |
| sandbox.mjs | `:101` (a WRITE) | `trace = opts.trace === false ? "" : join(audit, …)` (`:98`): the `""` arm |
| selfknowledge.mjs | `:503` | `join(ROOT, d)` with `d = join("docs", "archive", …)` (`:84`): ROOT dropped off-root, a WRONG path |
| session_meter.mjs | `:197 :237 :524` | `tx = … ? … : ""` (`:521`) bound into `foldFile`/`readFrom` |
| teaching_audit.mjs | `:1453` | `p = typeof path === "string" ? path.trim() : ""` (`:1446`) |

None is under `dressing-room/state/`, so **no query row moves at base** from either cwd measured.

**The code path that closes it (R-CWD, three edits in `xray.mjs`).**
- (a) `xray.mjs:281-286`: a `join` is `path.join`, so a relative part stays relative. A `resolve` folds only from its
  LAST absolute anchor (`win32.isAbsolute`: POSIX or a drive letter, on any OS); with no anchor it is Unknown.
- (b) `addSink` (`xray.mjs:217`): an empty path (`""`, `"."`, `"./"`) is an UNRESOLVED site (`empty-path`), never an edge.
- (c) `relRepo` (`xray.mjs:100`): a non-absolute path is reported AS WRITTEN.

**The counts it moves (2026-11-19).** Base → base+cwd: `edges -3 +0 · unresolved 2040 -> 2050`. The three dropped edges
are the empty paths: sandbox `.` W, session_meter `.` R, teaching_audit `.` R. Unresolved sites rise only in those three
organs, honestly, because each of those sites never named a file. The same holds on the mxb stack (2006 → 2016 for cwd
alone). The full candidate built from two cwds gives `edges -0 +0`. **Query rows: none move.**
A first variant, where every relative sink path became unresolved, was measured and REJECTED: `edges -41 +0 ·
unresolved 2040 -> 2072`, and on Linux it also dropped two Windows-drive paths (in `learn_digest.mjs` and `speak.mjs`).
Hence `win32.isAbsolute`, and hence reporting relative paths as written (F-CWD).

## 2 · GAP 2 — the ctx of a `const` arrow

**The code path at fb42118.** The walker names CTX only on a NAMED FunctionDeclaration/Expression (`xray.mjs:589-591`,
and `:461` in the parameter-shadow branch). A module-scope `const selftest = () => {…}` is therefore walked in pass 1
with CTX `"module"`. The fixpoint walks the same body again with CTX = its name (`xray.mjs:703`). `fixtureOnly`
(`xray.mjs:909`) needs EVERY touch to carry a test ctx, so the one `"module"` touch from pass 1 makes a fixture LIVE.

**The sites it hides (2026-11-19).** On the repo: **0** fixture flags and **0** query rows, on base and on the mxb stack.
The only edges that move are two spawn ctx labels in `rails.mjs`: the `day.mjs` and `sitting.mjs` spawns go from
`module` to `spawnDayHandoff` / `spawnHandoff`. Exposure: by regex, there are 114 module-scope const arrows with a block body
(2026-11-19). The fixture-named ones are predicates that hold no folding sink today: `acts.mjs:67`, `council.mjs:484`,
`organism_test.mjs:241 :288`, `registry.mjs:67`, `samjhao.mjs:99 :516`, `thalamus.mjs:1238`. The planted P2 shows the
gap: base RED, the read is LIVE.
**A correction to the mxb spec, named.** Its E7 (`study_scope.mjs` reads `scripts/no-such-dir/sitting.json`) is NOT this
gap. The call is in the NAMED `function scopeSelfCheck()` (`study_scope.mjs:750`, the call at `:768`). The fixture words
`/selftest|selfTest|_test|fixture|demo|canary|probe/i` do not match `SelfCheck`. That is a vocabulary fork (F-VOCAB), not a ctx fork.

**The code path that closes it (R-ACTX, one edit).** In `xray.mjs:589`, a `VariableDeclarator` bound to an anonymous
arrow or function expression names CTX, **only when CTX is `"module"`**. Measured and REJECTED first: naming it from
any ctx flips `cortex.mjs` `gateStat` from fixture to LIVE. `gateStat` is nested in `async function selftest`
(`:1046`) and reads at `:1053`, so that would be a false live read (mutant M6).

## 3 · GAP 3 — a nested closure read in its enclosing scope

**The code path at fb42118.** A nested function's OWN locals are never collected over the scope it closes over.
Pass 1, and the enclosing function's fixpoint walk (`xray.mjs:690-707`), descend into the nested body without its
declarations. Meanwhile the nested function, registered in `localFns` by `collectDecls` (`xray.mjs:365`), is walked
ALONE in module scope (`xray.mjs:692`). A nested local of the same name as a module const reads the MODULE value, which
is a false edge (plant P5, read on 3 visits at base).

**The code path that closes it.**
- **R-NEST**, at `xray.mjs:457`: every function node whose block body declares variables gets a new
  `collectLocals(body, inner)`. It folds the body's VALUE bindings over the enclosing scope, and records no verb taint,
  no dispatch table and no `localFns` entry. It first DELETES every name the body declares, so a local it cannot fold
  masks the outer binding.
  Measured and REJECTED first: reusing `collectDecls` there leaked argv taint into nested locals. Six organs' verb sets
  moved (2026-11-19), and `gaffer_brain.mjs` gained about forty bogus verbs (mutant M4).
- **R-MASK**, at `xray.mjs:701`: in the fixpoint, a function's own declarations mask the module binding before
  `collectDecls` re-binds the ones it can fold. On the repo it moves 0 edges, alone and with R-NEST, on base and on the
  mxb stack. It closes P5 through the nested function's OWN fixpoint walk, which R-NEST does not reach.

**The counts it moves (2026-11-19).**
- Base → base+nest: `edges -0 +4 · unresolved 2040 -> 2025`, with falls only, in 11 organs: benchmark, capture,
  daily_green, harvest, hippocampus, outbox, presence, probe, samjhao, tasks, watchman.
- **Q3 +1** `gemini_quality.jsonl.quarantine.jsonl`. Its writer is `capture.mjs:962`, inside the nested `fail` (`:959`)
  of `recordGeminiQuality(path, …)` (`:954`). Its reader is still blind at base without mxb's R-CALL.
- mxb → mxb+nest: `unresolved 2006 -> 1988`, and **Q1 −1**: the mxb spec's E1 row closes, its writer now seen. Q3 stays 6.
- **⚠ A THIRD WRITER OF `thalamus_config.json` (unit mq2's file).** `watchman.mjs` `probeWakeEconomy` writes it in
  production (`watchman.mjs:1917-1925`): `deps.writeCfg || ((f) => { const p = join(STATE_DIR, "thalamus_config.json");
  … renameSync(…, p) })`. Its receipt string names it a ruled ladder lane (G15). Base hides it twice: its local `p`
  lives in a nested arrow, and its ctx matches `probe`.
  - Base+mxc: the write is SEEN and classed a FIXTURE, so Q2 is unchanged.
  - mxb+mxc: the write is LIVE: `Q2 ~ thalamus_config.json writers gate_tune.mjs+thalamus.mjs ->
    gate_tune.mjs+thalamus.mjs+watchman.mjs`.

  So the "two writers on main" is three by the code. Named here; not ruled (F-Q2).

### 3b · Row 1175 (5): the DEFAULT writer behind a logical-or (watchman `probeWakeEconomy`) — added 2026-11-20

**The shape at my cut.** `watchman.mjs` blob ee43176 is the same at fb42118 and at the mq2 spec's base
(`git rev-parse 7460be5:scripts/watchman.mjs`), so mq2's line numbers stand here.
- `export function probeWakeEconomy(deps = {})` is at `:1902`. At `:1917`:
  `const write = deps.writeCfg || ((f) => { const p = join(STATE_DIR, "thalamus_config.json"); … })`. It reads
  `readJson(p)` at `:1919`, which reaches the sink inside `readJson` at `:191`. It writes
  `writeFileSync(p + ".tmp" + pid)` and then `renameSync(…, p)` at `:1925`.
- The production call is `:2137`, `findings.push(...probeWakeEconomy())`. The selftest injects `writeCfg` at `:2638` and `:2642`.

**Why base is blind (2026-11-20).** The arrow is not a `const` arrow. The declarator's init is a `LogicalExpression`, so
`collectDecls` (`xray.mjs:364`) neither registers it in `localFns` nor names it. `evalNode`'s `||` returns the right
arm (`xray.mjs:259-263`), which is an arrow, so the value is Unknown. The arrow is walked only INLINE, inside
`probeWakeEconomy`'s own walk, and there its local `p` is never collected. This is exactly gap 3, a nested closure's
local, not gap 2.

**Which rule resolves it, each alone.** The flagged prototype, a mini tree with plant P6, `MXC_RULES=<rule>`, 2026-11-20:

```
none: (no p6 edge)    cwd: (no p6 edge)    ctx: (no p6 edge)    mask: (no p6 edge)
nest: p6.mjs W dressing-room/state/p6_probe_cfg.json fx | p6.mjs W dressing-room/state/p6_tune_cfg.json live
```

**R-NEST alone resolves it**, and no new rule is needed. R-ACTX need not name a LogicalExpression init: the write keeps
its ENCLOSING ctx (`probeWakeEconomy`). That is the right ctx, because the arrow is that function's own default lane. Its CLASS
is then the fixture words' verdict, not mxc's:
- base vocabulary: `probe` matches, so the write is classed a fixture;
- mxb's R-CTX drops `probe`, so the write is LIVE.

The real site, by `build()` in each tree (2026-11-20):

```
base fb42118        watchman.mjs: no thalamus_config.json edge · writers gate_tune.mjs+thalamus.mjs
base + mxc 36f8757  watchman.mjs reads :191 (live) · writes :1925 (fixture) · writers gate_tune.mjs+thalamus.mjs · fixture_writers watchman.mjs
mxb + mxc 862c087   watchman.mjs reads :191 (live) · writes :1925 (LIVE)    · writers gate_tune.mjs+thalamus.mjs+watchman.mjs
plant P6 on mxb+mxc: p6_probe_cfg.json W live · p6_tune_cfg.json W live
```

**Planted both ways.** `ci/mxc/witness/plants/p6.mjs` holds the shape twice: `probeRefit` (a probe name) and
`refitTune` (a neutral name, live under any vocabulary). The new clause **W8** judges that both P6 writers are seen,
that the neutral one is LIVE, and that the repo tree has watchman.mjs writing `thalamus_config.json` with line 1925.
It is RED on base and GREEN on the build. **M8** collects nested locals only for a FunctionDeclaration, so an arrow
behind `||` stays unfolded; it is RED by W8 (and by W3 and W5).
For mq2's F5: mq2's option (a), removing the inline writer, makes the shape moot for that file. Either way, mxc's
R-NEST is the rule that sees it, and on the mxb stack it makes W7 flag the writer as a true third writer.

## 4 · `manager_notes.json` — the run log with no consumer

- **Writer:** `manager.mjs:1007`, `writeAtomic(dir, P("manager_notes.json"), …)`. The record is built at `:1006`
  (last run, matchday, phase, source, reason, staleness). The header declares it at `manager.mjs:21`: "WRITES (sole
  writer): team_sheet.md · manager_notes.json (run log …)". The file is gitignored (`.gitignore:70`), so it lives only
  on his disk.
- **Readers.** Searched 2026-11-19 with `git grep -n manager_notes -- . ':!dressing-room/state'`; that covers scripts,
  hooks, `.claude`, setup and docs.
  - The only CODE reader is manager's selftest, `manager.mjs:1075`, on a cold temp dir.
  - Every other hit is a comment or doc: `manager.mjs:152 :1071 :1227 :1728`, and `brain.mjs:4454`, which says it
    "holds only the LAST run". The rest are docs/archive and learning-layer prose.
- **Where its fields already go.** Every run through the brain job logs source and reason in `brain_ledger.jsonl`
  (`brain.mjs:3869` calls `runManager`; `:3916` writes `note: sheet source=…`). Staleness, phase and matchday reach no
  other file. A bare `node scripts/manager.mjs` run writes no ledger row, so this file is that run's only trace.
- **In the IR (2026-11-19):** at base the write is blind (the mxb spec's B4). On the mxb candidate it is the Q3 row
  `manager_notes.json W=manager.mjs R=0` (mxb E2). The mxc rules do not move it.
- **Fates (lettered; F-E2 below):**
  - (A) **a declared run log.** manager.mjs's header carries a marker that xray reads, the way it reads SOLE WRITER, and
    Q3 excludes a declared run log, citing the declaration. This follows the `MULTI_WRITER_ALLOWLIST` precedent
    (`xray.mjs:1066`), but it lives in the organ's own header, not in a list. It touches `xray.mjs` and `manager.mjs`'s header.
  - (B) **give it its consumer**, for example the state line or the doctor reads `staleness`. Which consumer is his word.
  - (C) **fold it (L9):** the fields ride the brain_ledger note, and the write is frozen as `*Legacy`, never deleted.
    That touches manager.mjs and brain.mjs, and the bare-run trace is lost.
  - (D) **leave it.** Q3 holds a TRUE finding, and the IR reports what the code does.

## 5 · The witness (clauses, both ways)

`ci/mxc/witness/witness_mxc.mjs --org <tree> --base-org <tree> --mini <mini tree>`. It runs `build()`/`queries()`
in-process against each tree's own `scripts/xray.mjs`, with a fresh module instance per tree. Its second cwd is a fresh
temp dir. **THE PORT CLASS, row 1053:** no port, no service, no daemon, no spawn, no model call, no wait. There is nothing
to bind, POST or restart.
The mini tree is `plant_tree.mjs --mini ci/mxc/witness/plants`. It holds scripts/xray.mjs, the plants P1, P2, P3 and P5,
a stub package.json and a node_modules link, and it is judged from a cwd that is NOT its root.

| clause | judges | base | build |
|---|---|---|---|
| W1 | gap 1: repo edges identical from two cwds, `ir.files` equal; P1 reads only `docs/p1_doc.md` (no `""`, no cwd path) | RED (26 edge moves; P1 reads the temp cwd's docs and `""`) | GREEN |
| W2 | gap 2: P2's module `const selftest = () => …` read is a FIXTURE | RED (live) | GREEN |
| W3 | gap 3: P3's nested `fail` writes `path + ".side.jsonl"`; capture.mjs writes the quarantine sidecar | RED (neither) | GREEN |
| W4 | GUARD · verb sets build = base, every organ | GREEN by design | GREEN |
| W5 | gap 3 (shadow): P5's nested `const OUTER` reads no `p5_outer.json` | RED (false read) | GREEN |
| W6 | GUARD · cortex.mjs `gateStat` (nested in selftest) read stays a fixture, base and build | GREEN by design | GREEN |
| W7 | GUARD · Q2 rows AND writer sets build = base, Q5 = 0 | GREEN by design | GREEN |
| W8 | row 1175 (5): P6's `||`-arrow default writers seen (neutral name LIVE); watchman.mjs writes thalamus_config.json at :1925 | RED (none seen) | GREEN |

A guard cannot be RED on base, because base IS the reference. Each guard's RED is shown by its mutant (§6).

```
# 2026-11-19 · base tree, mini base tree / candidate 36f8757 trees — last lines
node ci/mxc/witness/witness_mxc.mjs --org $B --base-org $B --mini $PB   ->  witness_mxc: 3 GREEN, 5 RED   (W1 W2 W3 W5 W8 RED; 2026-11-20)
node ci/mxc/witness/witness_mxc.mjs --org $O --base-org $B --mini $PO   ->  witness_mxc: 8 GREEN, 0 RED
```

**On the mxb stack, named:** W7 is RED there by design. The third writer (§3) is a TRUE finding, not an invented one;
that is why the build measures W7 against base fb42118. Landing on top of mxb makes F-Q2 the architect's before W7 can
be re-based.

## 6 · The mutants (one per clause; each must turn ITS clause RED)

`ci/mxc/witness/run_mutants_mxc.mjs --repo . --xray <candidate> --base-org <base tree>`. Each mutant is one string
replacement in a copy of the candidate. An anchor not found exactly once is UNAPPLIED, which makes the runner RED; it is
never skipped. The witness runs in a synchronous child, each wait bounded by the child's own exit, with nothing typed.
Control: the unmutated candidate must be all GREEN.

| mutant | kills | the one replacement |
|---|---|---|
| M1 | W1 | `join` evaluated as `pathResolve` again (folds onto the cwd) |
| M2 | W2 | a module const arrow no longer names its ctx |
| M3 | W3 | `collectLocals` not called (nested locals unfolded) |
| M4 | W4 | the nested collect is `collectDecls` (argv taint leaks into nested locals) |
| M5 | W5 | a nested local no longer masks the outer binding |
| M6 | W6 | a const arrow names the ctx from ANY ctx |
| M7 | W7 | a nested body is walked with ctx `"module"` (watchman's probe write goes live: a third Q2 writer) |
| M8 | W8 | nested locals are collected only for a FunctionDeclaration (an arrow behind `||` stays unfolded) |

```
# 2026-11-20, candidate 36f8757 — the runner's last lines
control: witness_mxc: 8 GREEN, 0 RED (exit 0)
M1 RED by W1 · red=[W1]          M2 RED by W2 · red=[W2]          M3 RED by W3 · red=[W3,W5]
M4 RED by W4 · red=[W4,W5]       M5 RED by W5 · red=[W5]          M6 RED by W6 · red=[W6]
M7 RED by W7 · red=[W6,W7]       M8 RED by W8 · red=[W3,W5,W8]
run_mutants_mxc: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
```

## 7 · The suite, the xray selftest, the ratchet (base vs build)

```
# 2026-11-19 · node scripts/xray.mjs selftest, in the base tree and in the candidate tree
base : xray: 19 passed, 4 failed      build: xray: 19 passed, 4 failed      (the SAME four: three NUL-byte asserts + the ratchet)
# the ratchet's BLINDER list vs the tracked baseline (1475): base 30 organs, build 31 organs (2026-11-19)
build adds:  sandbox.mjs 25→26                     (an empty-path site, R-CWD (b))
build moves: session_meter 21→24 becomes 21→29 · teaching_audit 11→36 becomes 11→37   (empty-path sites)
             watchman 24→37 becomes 24→35            (falls, R-NEST)
```

The ratchet is RED on main already (mxb F-SELFTEST). The build adds one organ to its list, and every rise is an
empty-path site that never named a file (F-RATCHET).
```
# 2026-11-19 · ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all  (repo with this spec on disk; build =
#   candidate 36f8757 copied over scripts/xray.mjs in place, then `git checkout -- scripts/xray.mjs`, blob back to 47b9de0)
base : organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
build: organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
       the same one row on both, already on main: the selftest-coverage law (deck_lint, home_pin, probe, study_scope)
# 2026-11-19 · node scripts/lawpack.mjs report, base vs build in place: the summary lines are IDENTICAL
lawpack · 1933 raw match(es) over 8/8 rules · jugad-literal-subject-list 93 · bare-catch 37 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)          (already on main: mxh F-C)
       the per-finding SAMPLE lines differ between two runs of the same report (7 lines); they are a sample, not a count
```
The checkpoint spec (c9b1dcc) carried one undated organ count. The base run before this rewrite named it a second
UNRULED row: LOAD ZERO BLOCK 7 at line 76. This file passes that law (the run above). `git worktree` was not used: the
mxb seat found the repo's worktree rail refuses it.

## 8 · FORKS (each with its options, the recommendation, and what would decide it)

- **F-SET · which rules land.**
  - (A) all four: R-CWD, R-ACTX, R-NEST, R-MASK.
  - (B) R-NEST alone: the only rule that moves a query row.
  - (C) R-CWD + R-NEST.

  **Recommend A.** Each rule is the only one that turns its clause GREEN (§6), and none invents a writer on base (W7).
  Decides: §0's table, re-run at the landing cut.
- **F-CWD · a relative path at a sink.**
  - (A) reported as written: the candidate, cwd-invariant, and equal to base at cwd = root.
  - (B) an unresolved site: measured +32 sites, 41 edges dropped, and Windows-drive paths lost on Linux.
  - (C) anchored at ROOT, on the convention that organs run from the root.

  **Recommend A.** Decides: his word on whether an organ may rely on its cwd.
- **F-RATCHET · the three empty-path organs rise.**
  - (A) re-freeze the baseline at the landing (owner `xray.mjs:4`, `node scripts/xray.mjs build`, the runner's act, as mxh F-B).
  - (B) count an empty path as neither resolved nor unresolved.

  **Recommend A**, because B hides a site the analyser truly cannot follow.
- **F-ACTX · where an arrow's name becomes ctx.**
  - (A) module scope only: the candidate.
  - (B) any ctx: false live reads (M6).
  - (C) not at all: P2 stays a live read.

  **Recommend A.** Decides: a fixture-named production arrow (§2's list) gaining a folding sink in a later cut.
- **F-VOCAB · the fixture words.** E7 hides behind `SelfCheck` (§2).
  - (A) leave it.
  - (B) add `selfcheck|SelfCheck` to the words: its own seat, measured first.

  **Recommend B in its own unit**, not this one.
- **F-Q2 · the third writer of `thalamus_config.json`** (§3).
  - (A) hand it to unit mq2 now: that unit's subject is this file, and on the mxb stack the code names three writers.
  - (B) this unit waits for mq2's ruling before landing on mxb.
  - (C) add the file to `MULTI_WRITER_ALLOWLIST`, if his ruling is that the probe lane may write it.

  **Recommend A.** Decides: his word on whether `probeWakeEconomy` is a writer (its receipt cites ladder G15).
- **F-STACK · land order with mxb.**
  - (A) mxb first, then mxc on top: the edits apply cleanly, measured.
  - (B) mxc first.

  **Recommend A**, with W7's reference moved to the mxb tip and F-Q2 ruled first. Decides: the runner's landing cut.
- **F-E2 · the fate of `manager_notes.json`:** (A) declared run log · (B) give it a consumer · (C) fold it · (D) leave it (§4).
  **Recommend D for now, then A** if he rules that a last-run file is a lane. D is true by the code and costs nothing.
  A is the cheapest code-path closure, a header declaration rather than a list. C changes two working organs for one
  row. B needs a consumer he wants.
  Decides: his word on whether a run log needs a reader.

## 9 · NAMED, NOT GUESSED (what the cloud could not reach, and what would measure it on his laptop)

- **Windows paths.** `win32.isAbsolute` was exercised on Linux only. Measure: `node ci/mxc/witness/witness_mxc.mjs` on
  his Windows checkout, base and candidate.
- **CRLF.** Every measurement here is on an LF checkout. Measure: the witness on a CRLF copy of the trees.
- **Q1 and Q4 on his disk.** Both read `on_disk`, and this clone's `dressing-room/state/` holds only tracked files.
  Measure: `node scripts/xray.mjs q` on his root, base vs candidate.
- **His scheduled cwd.** Which cwd ArsenalFC tasks run xray from. Measure: the task's "Start in" on his Task Scheduler.
  If it is not the root, his tracked `xray_graph.json` carries gap 1's folds today.
- **Whether watchman's `probeWakeEconomy` write has ever fired on his machine.** Measure: the `_wake_economy_refit`
  receipt key in his `thalamus_config.json`. Read the key's presence only; never print the content.
- **The live suite.** `npm test`, and the LIVE xray/audit/blackbox/flow_atlas/herd selftests, were never run here.

## 10 · The named files a build would touch

| file | what |
|---|---|
| `scripts/xray.mjs` | the 8 edits of `ci/mxc/witness/make_candidate.mjs` (owner of `xray_graph.json`, `xray.mjs:4`; no state file is written by the rules) |
| `ci/mxc/witness/witness_mxc.mjs` · `run_mutants_mxc.mjs` · `plant_tree.mjs` · `plants/p1,p2,p3,p5,p6.mjs` | the witness, the mutants, the planter, the plants |

**Beyond them, each a fork:**
- `dressing-room/state/xray_graph.json`: re-emit at the landing (F-RATCHET).
- `scripts/manager.mjs` header, plus `xray.mjs` Q3: fate A. `scripts/manager.mjs` + `scripts/brain.mjs`: fate C (F-E2).
- `scripts/watchman.mjs` / `scripts/gate_tune.mjs` / `scripts/thalamus.mjs`: unit mq2's, never this unit's (F-Q2).

### Reproduce

```
npm ci --ignore-scripts
T=$(node -p "require('fs').mkdtempSync(require('path').join(require('os').tmpdir(),'mxc-c-'))")
node ci/mxc/witness/make_candidate.mjs --base scripts/xray.mjs --out $T/xray.mjs          # -> blob 36f8757
B=$(node ci/mxc/witness/plant_tree.mjs --repo . --tag base | tail -1)
O=$(node ci/mxc/witness/plant_tree.mjs --repo . --xray $T/xray.mjs --tag build | tail -1)
PB=$(node ci/mxc/witness/plant_tree.mjs --repo . --mini ci/mxc/witness/plants --tag pb | tail -1)
PO=$(node ci/mxc/witness/plant_tree.mjs --repo . --mini ci/mxc/witness/plants --xray $T/xray.mjs --tag po | tail -1)
node ci/mxc/witness/witness_mxc.mjs --org $B --base-org $B --mini $PB     # RED on base
node ci/mxc/witness/witness_mxc.mjs --org $O --base-org $B --mini $PO     # GREEN on the build
node ci/mxc/witness/run_mutants_mxc.mjs --repo . --xray $T/xray.mjs --base-org $B
(cd $B && node /path/to/repo/ci/mxc/witness/measure.mjs --tree . --json $T/a.json); (cd $O && node /path/to/repo/ci/mxc/witness/measure.mjs --tree . --json $T/b.json)
node ci/mxc/witness/diff.mjs $T/a.json $T/b.json
```

## 11 · The neutral machine (public API, no token)

```
GET https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs
c9b1dcc (2026-11-19, the checkpoint)  run 44525881308  jobs 135566195570 (node 22) / 135566194834 (node 24)  completed / failure
```

c9b1dcc's red is consistent with this repo's BLOCK 7 law, which the local hermetic run named on the checkpoint spec's
line 76 (an undated organ count). The job log needs a token, so this is named, not read. Later tips: see `ci/mxc/LEDGER.jsonl`.

## 12 · Messages received

- 2026-11-19 ~12:38Z: STOP from the runner session (his word #269). Answered by the checkpoint c9b1dcc.
- 2026-11-19: a second CHECKPOINT order (his word #269). Already satisfied at c9b1dcc.
- 2026-11-19: RESUME (his word #270). This file is the resumed work.
- 2026-11-20: CONDITIONAL LINE (row 1175 (5), the runner): the `||`-arrow default writer. Answered in §3b, with W8 and M8. Pushed once, then CHECKPOINT.
- Final tip of 2026-11-19, b9b0459: no check run had appeared when it was read once (never polled).
