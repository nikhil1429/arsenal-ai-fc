# MXC SPEC — three evaluator gaps of `scripts/xray.mjs` + the fate of `manager_notes.json` (PARTIAL · CHECKPOINT)

CHECKPOINT · STOPPED at 2026-11-19T12:38:21Z · resume from: write the witness (`ci/mxc/witness/witness_mxc.mjs`, clauses W1-W7 below; mini-tree plants p1/p2/p3) and its mutant runner (M1-M7), run both on base and on the candidate, then the hermetic suite (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`) and `node scripts/xray.mjs selftest` in base vs candidate trees, then FORKS / NAMED NOT GUESSED in final form, then push and read the check runs.

Unit mxc · forks row 1161 (6) · cloud spec seat, written 2026-11-19 (UTC). Branch `claude/mxc-spec`, cut from `origin/main`
**fb42118** (`git fetch origin main; git checkout -B claude/mxc-spec FETCH_HEAD`); `scripts/xray.mjs` at the cut is blob
**47b9de0** (`git hash-object scripts/xray.mjs`). Input: `git show 4d329ff:ci/mxb/MXB_SPEC.md` (read whole). Nothing is
built: the candidate is GENERATED from the base by `ci/mxc/witness/make_candidate.mjs` (exact-once string anchors, else
REFUSED) and measured only in temp trees under `os.tmpdir()` (`ci/mxc/witness/plant_tree.mjs`). The IR is built from code
only (state FILE NAMES for `on_disk`; no state file's content is read or printed). Every count below: 2026-11-19, by the
command named.

## 0 · The base (2026-11-19)

```
node ci/mxc/witness/measure.mjs --tree <planted base tree>        # run from the tree root
unresolved 2040 · files 419 · Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7          (= the mxb spec's base)
mxb candidate (blob 70d45c4 = 47b9de0 + git show 4d329ff:ci/mxb/witness/xray_mxb.patch), same command:
unresolved 2006 · files 432 · Q1 11 · Q2 1 · Q3 6 · Q4 0 · Q5 0 · Q6 1
```
My edits apply cleanly (each anchor exactly once) on BOTH the base and the mxb candidate.

## 1 · Gap 1 — an empty / relative path folded to the ANALYSING machine's folder

**Where:** `xray.mjs:281-286` evaluates `join` AND `resolve` as `pathResolve(...)` (a relative part folds onto
`process.cwd()`), and `relRepo` `xray.mjs:100-104` calls `relative(ROOT, p)`, which resolves a relative or empty `p`
against `process.cwd()` too. So the IR is a function of WHERE xray ran.

**Measured (2026-11-19):** the same base IR built from two cwds (the tree root vs a temp dir), `ci/mxc/witness/diff.mjs`:
`cwd-dependent edges: A-only 13 · B-only 13` and `ir.files` 419 vs 421 — the mxb spec's "layout artifact" is this gap.
The 13 edges, by organ and line: archive_audit.mjs `:407 :412 :414 :427 :742 :743` (CyborgArchive/…) · brain.mjs `:248
:282` (selftest dir `no-such-dir-xyz`, `brain.mjs:5107`) · distiller.mjs `:90` (`"no-dir"`, `:833`) · registry.mjs `:383`
(`join("scripts", …)` `:397`) · sandbox.mjs `:101` (a WRITE of `"."` — `trace = cond ? "" : join(…)` `:98`) ·
selfknowledge.mjs `:503` (`join(ROOT, join("docs", …))` `:84` — base drops ROOT: a WRONG path off-root) ·
session_meter.mjs `:197 :237 :524` (`tx = … : ""` `:521`) · teaching_audit.mjs `:1453` (`: ""` `:1446`).
None is under `dressing-room/state/`, so **no query row moves at base** from any cwd measured.

**Closing code path (R-CWD, three edits):** (a) `join` uses `path.join` (a relative part stays relative); `resolve`
folds only from its LAST absolute anchor (`win32.isAbsolute`: POSIX or a drive letter, on any OS), else Unknown;
(b) `addSink`: an empty path (`""`, `"."`, `"./"`) is an UNRESOLVED site (`empty-path`), never an edge; (c) `relRepo`
returns a non-absolute path AS WRITTEN. Measured: base → base+cwd `edges -3 +0 · unresolved 2040 -> 2050` (the three empty
paths: sandbox `.` W, session_meter `.` R, teaching_audit `.` R; sites rise sandbox 25→27 · session_meter 24→30 ·
teaching_audit 36→38 — honest: those sites never named a file); the full candidate built from two cwds:
`edges -0 +0` (cwd-invariant). Query rows: unchanged (base and mxb stack).
A first variant (every relative sink path → unresolved) was measured and REJECTED: `edges -41 +0 · unresolved 2040 ->
2072`, and on Linux it dropped two Windows-drive paths (`learn_digest.mjs`, `speak.mjs`) — hence `win32.isAbsolute`.

## 2 · Gap 2 — the ctx of a `const` arrow

**Where:** the walker names CTX only on a NAMED FunctionDeclaration/Expression (`xray.mjs:589-591`, and `:461`); a
module-scope `const selftest = () => {…}` body is walked in pass 1 with CTX `"module"`, and `fixtureOnly`
(`xray.mjs:909`) needs EVERY touch to carry a test ctx — one `"module"` touch makes a fixture LIVE.

**Measured (2026-11-19):** R-ACTX alone moves **0** fixture flags and **0** query rows at base and on the mxb stack; it
renames two spawn ctx labels, `rails.mjs` `day.mjs` and `sitting.mjs` spawns `module` → `spawnDayHandoff` /
`spawnHandoff`. So today the gap hides no site; a planted case is needed for RED on base (W2).
**Correction to the mxb spec, named:** its E7 (`study_scope.mjs` reads `scripts/no-such-dir/sitting.json`) is NOT this
gap — the call sits in the NAMED `function scopeSelfCheck()` (`study_scope.mjs:750`, call `:768`); the fixture words
(`/selftest|selfTest|_test|fixture|demo|canary|probe/i`) do not match `SelfCheck`. A vocabulary fork, not a ctx fork.
**Closing code path (R-ACTX):** a `VariableDeclarator` bound to an anonymous arrow / function expression names CTX —
**only when CTX is `"module"`**. Measured: naming it from any ctx flipped `cortex.mjs` `gateStat` (nested in
`async function selftest` `:1046`, read `:1053`) from fixture to LIVE — a false live read; the module-only rule moves it
nowhere. Exposure: 114 module-scope const arrows with block bodies (count by regex, 2026-11-19); fixture-named ones
include production predicates `organism_test.mjs:241 liveSelftest`, `:288 hasSelftest` (would read as fixtures if a sink
in them ever folds — a fork).

## 3 · Gap 3 — a nested closure read in its enclosing scope

**Where:** a nested function's OWN locals are never collected over the scope it closes over: pass 1 and the enclosing
function's fixpoint walk (`xray.mjs:690-707`) descend into the nested body without its declarations; the nested
function, registered in `localFns` by `collectDecls` (`xray.mjs:365`), is walked alone in MODULE scope (`:692`).

**Closing code path (R-NEST):** at every function node with a block body that declares variables, a new
`collectLocals(body, inner)` folds the body's VALUE bindings over the enclosing scope (no verb taint, no dispatch table,
no `localFns` entry) and DELETES every name it declares first, so an unfoldable local masks the outer binding. Measured
and REJECTED first: reusing `collectDecls` there leaked argv taint — 6 organs' verb sets moved (gaffer_brain.mjs gained
~40 bogus verbs). With `collectLocals`: `verb sets changed 0`.

**Measured (2026-11-19), base → base+nest:** `edges -0 +4 · unresolved 2040 -> 2025`, falls only (benchmark, capture,
daily_green, harvest, hippocampus, outbox, presence, probe, samjhao, tasks, watchman); **Q3 +1**
`gemini_quality.jsonl.quarantine.jsonl` (writer `capture.mjs:962` in nested `fail` `:959`; its reader is blind at base
without mxb R-CALL). **mxb → mxb+nest:** **Q1 −1** (the mxb spec's E1 row closes: writer seen), unresolved 2006 → 1988.
⚠ **A THIRD WRITER OF `thalamus_config.json`:** `watchman.mjs` `probeWakeEconomy` writes it in production
(`deps.writeCfg || ((f) => { const p = join(STATE_DIR, "thalamus_config.json") … renameSync(…, p) })`, `watchman.mjs:1917-1925`).
At base+nest the write is classed FIXTURE (ctx matches `probe`); on mxb+nest (mxb drops `probe`) it is LIVE:
`Q2 ~ thalamus_config.json writers gate_tune.mjs+thalamus.mjs -> gate_tune.mjs+thalamus.mjs+watchman.mjs`. This is unit
mq2's file: mq2's "two writers on main" is three by the code. Named for the architect; not ruled here.
A fixpoint-side mask (R-MASK, flagged) was measured: 0 moves on base and on the mxb stack (R-NEST already masks).

**All three together (2026-11-19):** base → `unresolved 2033 · files 420 · Q1 14 · Q2 1 · Q3 6 · Q4 3 · Q5 0 · Q6 7`;
mxb → `unresolved 1996 · files 432 · Q1 10 · Q2 1 (writer set +watchman) · Q3 6 · Q4 0 · Q5 0 · Q6 1`.

## 4 · `manager_notes.json` — the run log with no consumer

- **Writer:** `manager.mjs:1007` `writeAtomic(dir, P("manager_notes.json"), …)` (fields built `:1006`), declared
  `manager.mjs:21` "WRITES (sole writer): team_sheet.md · manager_notes.json (run log …)". Gitignored (`.gitignore:70`).
- **Readers (`git grep -n manager_notes -- . ':!dressing-room/state'`, 2026-11-19):** code readers: only the selftest
  `manager.mjs:1075` (a cold temp dir). Everything else is comment or doc: `manager.mjs:152 :1071 :1227 :1728`,
  `brain.mjs:4454` (which says it "holds only the LAST run"), docs/archive and learning-layer prose. The run's
  source/reason already reach `brain_ledger.jsonl` per run via `brain.mjs:3869`/`:3916` (`note: sheet source=…`);
  staleness/phase/matchday do not.
- **Fates (lettered; recommendation pending the witness):** (A) declared run log — a header marker xray reads, Q3
  excludes it, the declaration cited (a code path, the `MULTI_WRITER_ALLOWLIST` precedent `xray.mjs:1066`). (B) give it
  a consumer (state.mjs / doctor reads staleness) — needs his word on which consumer. (C) fold (L9): its fields ride the
  brain_ledger note; the write is frozen as `*Legacy`, the file never deleted. (D) leave it: Q3 holds a TRUE finding.

## 5 · Witness and mutants — designed, NOT yet written or run (resume here)

W1 gap 1: full tree from two cwds → identical edges; mini plant p1 (`: ""` arm into `existsSync`; `join(ROOT, join("docs",…))`) — RED base.
W2 gap 2: mini p2, module `const selftest = () => readFileSync(join(STATE_DIR,"p2_fixture.json"))` is FIXTURE — RED base.
W3 gap 3: mini p3 nested `fail` writes `path + ".side.jsonl"`; full tree capture.mjs → quarantine writer — RED base.
W4 guard: no verb set changes (mutant: collectDecls in place of collectLocals).
W5 nested shadow: a nested local of an outer const's name never reads the outer path — RED base.
W6 guard: a nested const arrow inside a selftest keeps the selftest ctx (cortex gateStat) (mutant: R-ACTX from any ctx).
W7 guard: Q2 rows and writer sets build = base, Q5 0 (mutant: the nested body walked with CTX "module").
Mutants M1-M7, one per clause. Port class: no port, no service, no spawn, no model call (in-process build()).

## 6 · Files a build would touch

`scripts/xray.mjs` (the candidate, from `make_candidate.mjs`) · `ci/mxc/witness/*`. Beyond, each a fork:
`manager.mjs` (fates A/C) · `brain.mjs` (fate C) · `dressing-room/state/xray_graph.json` re-emit (the ratchet; owner `xray.mjs:4`).

## 7 · NAMED, NOT GUESSED (so far)

The live xray selftest ratchet base vs build (three organs' unresolved rise under R-CWD) — not run before the stop. CRLF
checkout; his Windows `path.isAbsolute` on drive paths; Q1/Q4 on his disk. The neutral machine's verdict on this push:
not read before the stop.

## 8 · Messages received

2026-11-19 (~12:38Z): STOP from the runner session (his word #269). This checkpoint is the answer.
