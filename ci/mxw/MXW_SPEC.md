# MXW SPEC — notes_corrections and brief_log: xray is BLIND, the writes_to is NOT stale

Unit mxw · forks rows 1108 / 1109 · row 1090 (2) · spec seat, cloud, written 2026-11-19 (UTC).
Base: `origin/main` 95b07a6 (2026-11-19). This file builds nothing; every number below was measured on
that base in a hermetic copy under `os.tmpdir()`, by the command printed beside it.

**HEADLINE (measured 2026-11-19).** For BOTH rows the verdict is **(a) xray is blind**. Each file has
exactly one writer at head, and it is the owner named in its own script header. xray misses both writers
for the same reason. Both writers take their path through an **options-bag default parameter**
(`f(x, { path = LEDGER } = {})` and `f(x, { dir = STATE } = {})`). But `seedDefaults`
(`scripts/xray.mjs:621-633`) only seeds a default whose left side is a bare identifier (`f(path = LEDGER)`).
So the production path of both writers stays `Unknown`, and `writers` comes out `[]`. A 14-line change to
`seedDefaults` gives each file its declared owner and no other writer. No organ gets blinder, and Q2 and Q5
stay at their base counts. No registry row is stale. No commit removed a writer, because none was removed.

A second blindness sits next to it (measured, NOT part of the smallest change, see fork F2). The SOLE WRITER
header parser (`scripts/xray.mjs:956`) reads every `x.jsonl` as `x.json`, because the alternation is
`json|jsonl` with no boundary. That is why Q5, the check that should have caught a declared writer the IR
does not see, has never been able to see a `.jsonl` lane.

---

## 1 · The two rows, read through the registry's own verb

Owner of the registry: `scripts/registry.mjs:4` (`SOLE WRITER of dressing-room/state/registry.json`).
Read with `node scripts/registry.mjs get --table lanes --subject <s> --json` in the hermetic copy. Only the
key names and paths below were printed; no row content was printed.

| row (table `lanes`) | schema_owner | writes_to | files[] | declared consumers |
|---|---|---|---|---|
| `notes_corrections` | `notes_corrections.mjs` | `notes_corrections.jsonl` | absent (row 1090: "stay undeclared") | `notes_compiler.mjs`, `him` |
| `brief_log` | `learnstate.mjs` | `brief_log.jsonl` | absent (row 1090: "stay undeclared") | `him` |

## 2 · The xray measurement (hermetic copy, base 95b07a6)

Command: `node ci/mxw/witness/silent.mjs <copy>/scripts/xray.mjs` and an in-process `build()` read of
`ir.files` (paths + organ names only).

```
base  (2026-11-19): xray build → 137 organs parsed · 413 files · 2063 unresolved sinks
  dressing-room/state/notes_corrections.jsonl  writers []  readers [notes_corrections.mjs]
  dressing-room/state/brief_log.jsonl          writers []  readers [learnstate.mjs]
  queries: Q1 15 · Q2 1 (thalamus_config.json) · Q3 5 · Q4 3 · Q5 1 (widgets.json)
build (2026-11-19, the §4 patch applied): 137 organs parsed · 418 files · 2013 unresolved sinks
  dressing-room/state/notes_corrections.jsonl  writers [notes_corrections.mjs]
  dressing-room/state/brief_log.jsonl          writers [learnstate.mjs]
  queries: Q1 14 · Q2 1 (unchanged) · Q3 5 · Q4 3 · Q5 1 (unchanged)
  per-organ unresolved: NO organ worse; 17 organs better (notes_corrections 10→6, learnstate 91→87, …)
```

Every other change between base and build adds an edge and removes none. Writers gained:
`laws_register.json ← registry.mjs`, `resume_pointer.jsonl ← resume_pointer.mjs`,
`watchman_repairs.jsonl ← watchman.mjs` (this one is the Q1 entry that disappears),
`night_log.jsonl ← night.mjs`, `post_match/<date>.md ← postmatch.mjs` (dated, filtered out of every query
by `DATED_RE`). Readers gained, each at an options-bag default: `state.mjs`, `models.mjs`, `registry.mjs`,
`audit.mjs`, `notes_compiler.mjs`, `night.mjs`, `day.mjs`, `study_scope.mjs`, `capture.mjs`, `lawpack.mjs`,
`gates.mjs`. Every gained writer is its file's own header-declared owner (checked against
`grep -n "SOLE WRITER" scripts/<organ>.mjs`). The patch creates no second writer anywhere.

## 3 · Every code path that writes the two files (file:line at 95b07a6)

### 3a · `dressing-room/state/notes_corrections.jsonl`
- `scripts/notes_corrections.mjs:14` is the header: SOLE WRITER of this file.
- `scripts/notes_corrections.mjs:46` sets `LEDGER = join(__dirname, "..", "dressing-room", "state", "notes_corrections.jsonl")`.
- `scripts/notes_corrections.mjs:106` is `export function add(p = {}, { path = LEDGER, now, by } = {})`, **the shape xray misses**.
- `scripts/notes_corrections.mjs:86` is `appendChecked(path, row)`, and `:91` is the sink, `appendFileSync(path, …)`.
- `scripts/notes_corrections.mjs:187` is the CLI `add` verb. It calls `add({...})` with NO second argument, so the default is the production path.
- No other organ writes this file. `scripts/notes_compiler.mjs:692/735` calls the owner's exported `add` on a fixture path (selftest only), which is a write through the owner's door.

### 3b · `dressing-room/state/brief_log.jsonl`
- `scripts/learnstate.mjs:17` is the header: SOLE WRITER of this file, APPEND-ONLY.
- `scripts/learnstate.mjs:223` sets `STATE`, and `:651` sets `BRIEF_LOG = "brief_log.jsonl"`.
- `scripts/learnstate.mjs:794` is `export function recordBrief(printed, { dir = STATE, now } = {})`, **the same shape**. The sink is `:806`, `appendFileSync(join(dir, BRIEF_LOG), …)`.
- `scripts/learnstate.mjs:817` is `export function bornBriefLog({ dir = STATE } = {})`, **the same shape** (a bare destructured first parameter). The sink is `:823`, `appendFileSync(p, "", { flag: "ax" })`.
- `scripts/learnstate.mjs:2253` is the one production call, `recordBrief(printed, { now })`, which passes no `dir`, so the default is the production path. It fires from the SessionStart hook (`.claude/settings.json:55`, `learnstate.mjs brief`).
- Runtime evidence, 2026-11-19: this cloud container's own SessionStart left `git status` showing `M dressing-room/state/brief_log.jsonl` (`git diff --stat`: 1 insertion). That is the writer firing. The file was not staged, not committed, and its content was not printed.

### 3c · Why xray is blind: the code shape and the parser site
`scripts/xray.mjs:621-633`, `seedDefaults`:
```
if (p.type !== "AssignmentPattern" || p.left.type !== "Identifier") continue;
```
The options-bag shape is `AssignmentPattern { left: ObjectPattern { properties: [Property { value:
AssignmentPattern { left: Identifier path, right: LEDGER } }] }, right: {} }`. It is skipped, so `path` / `dir`
stays `Unknown` and the sink is counted in `unresolved_sinks` instead of becoming a writer fact. The fixpoint
binder (`:656-657`) has the same identifier-only rule. The callers that pass `{ path: P }` are all selftest
fixtures today (fork F1 (B)).

## 4 · The proposed code path (smallest parser change, ONE organ)

File `scripts/xray.mjs`, owner xray.mjs (`:4`, SOLE WRITER of `xray_graph.json`). The patch is
`ci/mxw/witness/xray_seed_defaults.patch`, and `git apply --check` is clean on 95b07a6. Inside `seedDefaults`,
a parameter now yields its `(name, defaultExpr)` slots:
- `p = X` → `[p, X]`. This is the base behaviour, unchanged.
- `{ a = X, b = Y } = {}` → the inner pattern's slots.
- `{ a = X, b }` → `[a, X]` only. A property with no default yields nothing, so nothing is invented.

Each slot is evaluated with the same `evalNode` and the same `isC` guard, and goes into the same `paramEnv`.
The fixpoint then sets each name in scope as it does today. Nothing else changes: no new query, no allowlist,
no new transfer function.

**What the build must also re-emit, through the owners' own verbs, in the same commit** (measured
2026-11-19: without it the atlas check goes STALE):
- `node scripts/xray.mjs build` regenerates `dressing-room/state/xray_graph.json` (tracked; owner xray.mjs:4).
- `node scripts/flow_atlas.mjs build` regenerates `dressing-room/state/flow_atlas.json` (tracked; owner flow_atlas.mjs).
```
hermetic copy, 2026-11-19 — flow_atlas.mjs check:
  base xray, IR rebuilt, atlas as committed       → exit 2  STALE derived 003c82071f3dde2c vs written 77675fe0b19c16c3
  base xray, atlas rebuilt                        → exit 0
  build xray, IR rebuilt, atlas from base         → exit 2  STALE derived dadc3e0a74369a79 vs written 003c82071f3dde2c
  build xray, IR + atlas rebuilt                  → exit 0
```
(The first line says that main's committed atlas already differs from one derived from main's own code. This
is NAMED in §8, not caused here.)

**The registry act** (fork F3 decides it). The row is NOT stale, so its `writes_to` is untouched. The only
registry change on the table is row 1090's deferred one: declare `files` on both rows, only through
`node scripts/registry.mjs set --table lanes --json '<the full row, files added>'` (`upsertRow` validates the
row it is given, `scripts/registry.mjs:471-473`, then merges). The builder must therefore read the row through
`get --json` inside a node script and add `files` without printing the row:
- `notes_corrections` gets `files: ["dressing-room/state/notes_corrections.jsonl"]`
- `brief_log` gets `files: ["dressing-room/state/brief_log.jsonl"]`

## 5 · Witness clauses: each plant RED on base, GREEN on the build

Runnable now: `node ci/mxw/witness/witness.mjs <xray.mjs to judge> <node_modules dir>`. It plants a temp tree
under `os.tmpdir()` holding the xray.mjs under test, a stub `package.json`, and ONE fixture organ with the four
shapes, runs `build()`, reads the fixture's writer facts, removes the tree, and prints one JSON line. It binds
no port, names no service, and touches nothing in the repo.

| clause | plant (fixture organ) | base 95b07a6 | build |
|---|---|---|---|
| **W1** options bag + `= {}` default (the notes_corrections.mjs:106 shape, through a helper: :86/:91) | `add(p = {}, { path = LEDGER } = {}) → appendChecked(path)` | **RED** (`W1:false`) | GREEN |
| **W2** options bag, `join(dir, NAME)` (the learnstate.mjs:794/806 shape) | `record(t, { dir = STATE } = {}) → appendFileSync(join(dir,"w2_dir.jsonl"))` | **RED** (`W2:false`) | GREEN |
| **W3** nothing invented: a destructured slot with NO default stays Unknown | `noDefault(t, { path } = {})` | GREEN (`true`) | GREEN (`true`) |
| **W4** the old shape is still read | `plain(t, path = join(STATE,"w4_plain.jsonl"))` | GREEN | GREEN |
| **W5** live: on the real tree, each of the two files has exactly its declared owner as writer, and Q2/Q5 do not grow | in-process `build()` on the checkout | **RED** (`writers []`) | GREEN |

```
measured 2026-11-19 (witness.mjs):
base  {"W1":false,"W2":false,"W3_nothing_invented":true,"W4":true}
build {"W1":true,"W2":true,"W3_nothing_invented":true,"W4":true}
```
W3 and W4 are invariants. They hold on both trees by design, and their job is to catch the mutants below. A
witness that is GREEN on base cannot prove the fix, so W1, W2 and W5 carry the proof.

## 6 · Mutants, one per clause (each must turn its clause RED)

| mutant | change | killed by | measured 2026-11-19 |
|---|---|---|---|
| **M1** (W1+W5) | revert `seedDefaults` to identifier-only (= base) | W1, W2, W5 | `W1:false W2:false` |
| **M2** (W4) | `slots()` loses its `p = X` arm | W4 | `{"W1":true,"W2":true,"W3":true,"W4":false}` |
| **M3** (W2, the `= {}` unwrap) | `slots()` reads a bare `ObjectPattern` but not `AssignmentPattern(ObjectPattern)` | W1, W2, W5 (both real writers carry `= {}`) | `{"W1":false,"W2":false,"W3":true,"W4":true}` |
| **M4** (W3) | seed a no-default destructured slot from the enclosing default | W3 | not measured. Its only honest form is `evalNode({})`, which `isC` already refuses, so this mutant may be EQUIVALENT (named, §8) |

## 7 · FORKS — for the architect

**F1 · how wide the xray change is**
- (A) only options-bag DEFAULTS in `seedDefaults` (§4). **Recommended.** It is the smallest change that ends both blindnesses.
- (B) (A), plus the fixpoint binder (`:656`) binds an ObjectExpression argument `{ path: P }` into the named slots. Today every such caller is a selftest fixture (§3a).
- (C) (A) + (B), plus destructured slots in arrow and nested function params.
- *Measurement that decides it:* the before/after diff of `fixture_writers` and the Q counts under (B). If (B) changes no non-fixture fact, it is noise for this unit.

**F2 · the header-parser blindness** (`scripts/xray.mjs:956`, `\.(?:json|jsonl)` turns `x.jsonl` into `x.json`)
- (A) out of scope, its own unit. **Recommended.**
- (B) fix it in this landing.
- *Measured 2026-11-19, hermetic copy, my own probe copies' self-noise subtracted.* Regex fix alone: Q5 goes 1 → 4. Regex fix + §4: Q5 goes 1 → 6 (`outbox.jsonl`, `night_log.jsonl`, `resume_pointer.jsonl`, `rejirah_log.jsonl` ×2, plus `widgets.json`). Several of these look like header prose that NAMES another organ's file on a "sole writer" line (for example fsrs.mjs and gaffer_brain.mjs on `rejirah_log.jsonl`). That would make them parser false positives, not breaches. Each needs its own triage, which is why this is not part of the smallest change.

**F3 · the registry act**
- (A) declare `files[]` on both rows through `registry.mjs set` in the same landing (§4). Row 1090's "until then" has ended.
- (B) leave both rows undeclared. `done.mjs:147`'s fallback already resolves `dressing-room/state/<subject>.jsonl` to the same file.
- **Recommended: (A).** The declaration wins (mdn2), and the fallback is a guess by name.
- *Measurement:* on his laptop, `node scripts/done.mjs report` before and after. The `reach` rows for the two subjects must keep the same `files` count and flip `decl` to yes.

**F4 · where the witness lives**
- (A) as fixture asserts in `xray.mjs selftest`, in-process via `analyzeFile`, the LAYER B′ pattern at `:1303`.
- (B) as a hermetic `organism_test.mjs` clause running a temp-tree plant like `ci/mxw/witness/witness.mjs`.
- (C) both.
- **Recommended: (B)**, or (C) if he wants the selftest copy too. Measured 2026-11-19: `xray` selftest is **LIVE-only** in the hermetic profile ("not run in the hermetic profile: reads state/xray_graph.json"), so (A) alone is never judged by the neutral machine. It is also already RED at head on its NUL-byte trap (§8).

**F5 · a Q5 sibling for "declared, zero writers"**
- (A) not now. **Recommended.**
- (B) add a report-only query.
- *Measured 2026-11-19 with `silent.mjs`:* base 5 silent, build 4 (two are `no-such-dir-for-cases/` fixtures, plus `models.json` and `sitting.json`). With the F2 regex fix it rises to 10, the ones under `scripts/` included. That is a separate investigation.

## 8 · NAMED, NOT GUESSED

- **xray selftest at head, 2026-11-19 (hermetic copy):** `xray: 20 passed, 3 failed`, identical on base and build. The 3 are "calibration/dmn/rejirah.mjs really does contain NUL bytes". In this checkout those files carry 0 NUL bytes (`tr -cd '\000' | wc -c`). *To measure on his laptop:* the same count on his checkout, and `node scripts/xray.mjs selftest`.
- **The committed atlas is already STALE against main's own code** (§4 table, line 1). *Laptop:* `node scripts/xray.mjs build && node scripts/flow_atlas.mjs check` on clean main. This decides whether the drift predates this unit.
- **Hermetic suite, 2026-11-19, in a copy carrying `.git`:** base and build give the same verdict, `143 passed, 3 failed` each, all UNRULED. The fails are the selftest-coverage law (`deck_lint, home_pin, probe, study_scope` orphaned), the `sandbox` selftest, and the 52-member line that carries it, where the sandbox tripwire recorded 2 of 4 attempts. I could not reach whether these are container artifacts or real on main. *Laptop:* `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` on clean main.
- **The LIVE verdicts this unit moves cannot be reached from the cloud:** `xray` selftest, `flow_atlas` selftest, ATLAS mode, `audit` / `blackbox` / `herd` selftests (all read `xray_graph.json`), and `done.mjs report`'s reach rows. *Laptop:* the full suite on the land branch.
- **M4's equivalence** (§6). *Measure:* run M4 with W3 and see whether any honest mutant kills it.
- **History depth:** the cloud clone's visible history starts at 67e5a29 (2026-11-14). The (b) branch needs no removal commit because both writers exist at head, but the authorship commit of `:106` and `:794` sits outside the visible history. *Laptop:* `git log -S"{ path = LEDGER" -- scripts/notes_corrections.mjs`.

## 9 · Files a build would touch

1. `scripts/xray.mjs`: the `seedDefaults` slot reader (§4). Owner: xray.mjs.
2. `scripts/organism_test.mjs`: the hermetic W1–W5 clause, if F4 (B)/(C). Owner: organism_test.mjs.
3. `dressing-room/state/xray_graph.json`: regenerated ONLY by `node scripts/xray.mjs build`.
4. `dressing-room/state/flow_atlas.json` (and anything else `flow_atlas.mjs build` emits): regenerated ONLY by that verb.
5. `dressing-room/state/registry.json`: ONLY by `node scripts/registry.mjs set`, if F3 (A).
- Beyond these, each one a fork: `scripts/xray.mjs:956` (F2) and a new query (F5). Nothing else.

## 10 · The neutral machine on this branch

This branch is main plus `ci/mxw/` only, so its verdict is the BASE verdict the build will be compared against.

## 11 · Check runs (public API, `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`, no token)

| sha | workflow run | job id | name | conclusion | completed |
|---|---|---|---|---|---|
| e3e39aa | 44428770869 | 135240408092 | npm test · node 22 | success | 2026-11-19T00:28:31Z |
| e3e39aa | 44428770869 | 135240408287 | npm test · node 24 | success | 2026-11-19T00:29:40Z |

The check runs for this push (the one that adds this table) are named in the seat's FINAL MESSAGE.
