# MXH PROOF — the sole-writer header parser, Q6 SILENT, the N1 mask (build seat)

Unit mxh · forks row 1138 (1) · build seat, cloud, written 2026-11-19 (UTC). Branch `claude/mxh-build`.
Every line below was measured on 2026-11-19 by the command beside it; each act is a row in `ci/mxh/LEDGER.jsonl`.

## 1 · The base

- Cut from `origin/main` **3f84c80** (`ci/mxh/BASE`), by `git fetch origin main; git checkout -b claude/mxh-build FETCH_HEAD`.
- Unit mxw **12f1eca is an ancestor** of the base (`git merge-base --is-ancestor 12f1eca origin/main`), so F10 A holds.
- The base `scripts/xray.mjs` is blob **f62d504**: the same blob as the spec's "mxw tree" (spec §0). So every
  "mxw + mxh" figure in the spec is the figure this build must reproduce, and it does (§3).
- The spec: `git show e57b893:ci/mxh/MXH_SPEC.md` (branch `claude/mxh-spec`). Its patch
  `ci/mxh/witness/xray_mxh_full_n1.patch` applies with `git apply --check` clean on 3f84c80.

## 2 · What the build is (named files only)

| file | what |
|---|---|
| `scripts/xray.mjs` | F2 boundary (`x.jsonl` no longer read as `x.json`) · **the CLAUSE RULE** (F6 A) · **Q6 SILENT**, report-only (F5, F8 A, F11 A) · **the N1 parameter mask** (F12 B) |
| `ci/mxh/witness_mxh.mjs` | the witness, `--org <dir> --base-org <dir>` (F9: in the unit's ci dir, riding the member) |
| `ci/mxh/run_mutants_mxh.mjs` | one mutant per clause |
| `ci/mxh/q5_paths.mjs` | F7 A: the every-path against last-wins Q5 count, for the runner at the landing |
| `ci/mxh/BASE`, `ci/mxh/LEDGER.jsonl`, `ci/mxh/PROOF.md` | the base sha, the act ledger, this file |

**Where the build differs from the spec's patch (each a ruling-text rule, named):**
1. **No typed size.** The spec's `clauseBefore` capped its walk-back with `for (let i = 0; i < 6; i++)`. The brief
   says "never type a size". The cap is gone (`for (;;)`): `start` falls strictly on every step, so the walk ends at
   the head's first line, a code line, an empty `//` line or a stop. Mutant M5 moved with it
   (`const cut = txt.includes("\n") ? 0 : -1;`, the same R2 rule).
2. **The law pack's raw count.** The spec's `patternNames` held `const out = [];`, which the law pack's
   `jugad-literal-subject-list` rule matches as a raw match (1928 → 1929; no finding). It is removed at its cause:
   `patternNames` is a recursive `flatMap` (`bound`) with no array literal bound to a const. Mutant M11 re-anchored.
3. **The witness door.** The spec's witness took `--xray --tree --live`; the ruling's shape is `--org --base-org`
   with BOUND and LAST. W1-W7 are the spec's clauses, each judged on an LF plant AND the same organs in CRLF.
4. **F9.** The spec recommended (B), a hermetic `organism_test.mjs` clause. The ruling says: the witness in the
   unit's ci dir, riding the member. `scripts/organism_test.mjs` is NOT touched.

## 3 · The witness, both ways (last lines)

```
node ci/mxh/witness_mxh.mjs --org <base clone 3f84c80> --base-org <base clone>     (2026-11-19)
  RED   W1 · lf: declared a1>w1_lane.jsonl false · Q5 row 0 | crlf: … the same
  RED   W2 · lf: d2 false · c2 false · Q5 0 | crlf: … the same
  RED   W3 · lf: f3 false/false · e3 false/false | crlf: … the same
  RED   W4 · lf: w4_cfg true · w4b false | crlf: … the same
  RED   W5 · lf: no Q6 in queries() | crlf: … the same
  RED   W7 · lf: p7 invented writer facts: w7_shadow.jsonl, w7b_plain.jsonl | crlf: … the same
  RED   W6 · declared .jsonl 0 · Q5 rows 1 · rows whose declarer writes nothing there 1 (teaching_audit.mjs>widgets.json) · Q6 absent
  GREEN BOUND · 0 file(s) differ from --base-org
  GREEN LAST · 0 node process(es) naming the temp root survive · the temp root removed
RED MXH · W1 W2 W3 W4 W5 W7 W6                                                       (exit 1)

node ci/mxh/witness_mxh.mjs --org <build clone> --base-org <base clone>              (2026-11-19)
  GREEN W1 … W7 (LF and CRLF agree on every clause)
  GREEN W6 · declared .jsonl 26 · Q5 rows 0 · rows whose declarer writes nothing there 0 · Q6 7
  GREEN BOUND · 1 file(s) differ from --base-org (scripts/xray.mjs)
  GREEN LAST · 0 node process(es) naming the temp root survive · the temp root removed
GREEN MXH a sole-writer header declares only its own clause, .jsonl included, Q6 names the silent ones, a parameter shadows · 9 clause(s)   (exit 0)
```

## 4 · The mutants

```
node ci/mxh/run_mutants_mxh.mjs --org <build clone> --base-org <base clone>          (2026-11-19)
  control (unmutated) → GREEN MXH … · 9 clause(s)
  KILLED M1  boundary reverted                     → W1 RED
  KILLED M2  foreign-organ check dropped           → W2 RED
  KILLED M3  no walk-back over wrapped // (R1)     → W3 RED
  KILLED M4  `;` not a stop (R3)                   → W4 RED
  KILLED M5  walk-back always takes line above (R2) → W4 RED
  KILLED M6  Q6 reads only the last path           → W5 RED
  KILLED M7  a stop before the token ignored       → W3 RED
  KILLED M8  the whole clause rule dropped          → W6 RED
  KILLED M9  N1 mask only in the fixpoint          → W7 RED
  KILLED M10 N1 mask only in pass 1                → W7 RED
  KILLED M11 patternNames skips ObjectPattern      → W7 RED
  KILLED M12 a file beyond the named one changes   → BOUND RED
  KILLED M13 a detached node child naming the temp root survives → LAST RED (the runner reaps it)
run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN    (exit 0)
```

## 5 · What the build moves, and what it does not (base → build, 2026-11-19)

```
node ci/mxh/witness/q5.mjs <tree>/scripts/xray.mjs   (the spec's own census script, e57b893)
  base:  guarded 28 · declared 66 · declared_jsonl 0  · Q2 1 · Q5 1 (widgets.json teaching_audit>widget) · not_in_ir 33
  build: guarded 49 · declared 59 · declared_jsonl 26 · Q2 1 · Q5 0
xray queries() counts
  base:  Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 1
  build: Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7
node ci/mxh/witness/unres.mjs (base)   {"unresolved":2015,"xray_unresolved":8,"organs":137,"files":418}
```
The build's Q5 0 / Q6 7 / guarded 49 are the spec's "mxw + mxh" row exactly (spec §2, §3).

**Touched selftest, by its headline line** (`node scripts/xray.mjs selftest` in each clone):
```
base:  xray: 19 passed, 4 failed
build: xray: 19 passed, 4 failed
```
The four are the same both ways: three NUL-byte traps (calibration, dmn, rejirah) and the per-organ ratchet measured
against the committed `xray_graph.json` (spec §8 named it). mxh moves none of them.

**Members touched: none.** No `package.json` suite member is edited; `xray selftest` is the only member whose organ
changed, and its line is above. **The hermetic suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`):
```
base:  organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
build: organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```
`diff` of the FAIL lines is empty. The three are the selftest-coverage law (orphaned: deck_lint, home_pin, probe,
study_scope), the `sandbox` member (tripwire recorded 2 of 4), and the member-count line that carries it: on the base.

**`node scripts/models.mjs check`**, both clones, exit 0:
```
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
```

## 6 · THE LAW PACK COUNTS (row 1130 (2)), LF trees

```
cd <base clone> && node scripts/lawpack.mjs        (2026-11-19)
lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)

cd <build clone> && node scripts/lawpack.mjs       (2026-11-19)
lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)
```
Every count equal. The two REDs (jugad 93 against a frozen 90, depcruise 13 against 7) are **on the base already**,
the same two on both trees. The build's first cut raised the raw count to 1929; that was removed at its cause (§2, 2).

## 7 · F7 A — the count the RUNNER runs from his repo root at the landing

I never read `dressing-room/state`, so this count is the runner's. The recipe, from his repo root on the land tree:
```
node ci/mxh/q5_paths.mjs
```
It imports `./scripts/xray.mjs`, runs `build()` + `queries()` in-process, writes nothing, and prints paths and organ
names only. **Expected last line** (what it printed on both LF clones here, 2026-11-19, also from a second cwd):
```
q5_paths: last-wins 0 · every-path 0 · equal          (build; exit 0)
q5_paths: last-wins 1 · every-path 1 · equal          (base, for reference)
```
A `DIFFER` (exit 1) names each row above the last line, and is F7's evidence for (B).
Note: `ci/mxh/q5_paths.mjs` lives on this seat branch. If the landing carries only `scripts/xray.mjs`, the runner
runs it from a checkout of `claude/mxh-build` with `cwd` = his repo root: `node <seat checkout>/ci/mxh/q5_paths.mjs`.

## 8 · F8 A — the six blindnesses Q6 names, handed to unit mxb (named, spec first, after mxh lands; nothing built)

Measured on the build, 2026-11-19 (`xray queries()` Q6): 7 rows = these six + D1 `usage_reading.json` (F11 A: kept,
outside the repo by design, `usage_tap.mjs:10`). The file:line of each real write is the spec's, at 224f9b9 (§3 B1-B6).

| # | file (declared at) | the real write | the IR idiom it cannot follow |
|---|---|---|---|
| B1 | `models.json` (`models.mjs:8`) | `models.mjs:430` renameSync in `finishProbe` `:425`, called `:423` from `probe({ … path = MODELS_JSON … } = {})` `:345` | an ObjectExpression ARGUMENT into a destructured param with no default |
| B2 | `sitting.json` (`sitting.mjs:14`) | `sitting.mjs:503` `writeAtomic(F.sitting(), S)` → `:172`; `F.sitting` an arrow in an object literal `:95` | the return value of a member call |
| B3 | `brain_outcomes.jsonl` (`scoreboard.mjs:17`) | `scoreboard.mjs:168` appendFileSync(outPath), called `:402` with `deps.outPath`; default `outPath: OUT_PATH` `:390` | a property of a deps object |
| B4 | `manager_notes.json` (`manager.mjs:21`, no IR file) | `manager.mjs:1007` `writeAtomic(dir, P("manager_notes.json"))` → `:971`; `P = mkP(dir)` `:977`, curried `:48` | a closure-returned function |
| B5 | `rails_blind.jsonl` (`rails.mjs:5`, no IR file) | `rails.mjs` `openSync(file, flag)` + `writeSync(fd, …)` (spec: `:326-327` at a583afb) | `openSync`/`writeSync` are not in `WRITE_FNS` (sink class) |
| B6 | `teaching_gate.jsonl` (`teaching_gate.mjs:58`, no IR file) | `teaching_gate.mjs:807` `appendFileSync(GATE_LOG(dir), …)`; `GATE_LOG` a const arrow `:82` | the return value of a const arrow call |

Not re-measured at 3f84c80 line by line: `scripts/services.mjs`, `rails.mjs` and `conductor.mjs` moved after the spec's
base, so the B5 line may have moved again. Unit mxb's spec re-reads each at its own base.

## 9 · A peer finding for the FORKS (received mid-build; measured, nothing built)

**notes_corrections — a declared consumer that reads none of the lane's files in the xray graph.** Measured on both
clones, 2026-11-19 (`gate.LANE_CONSUMERS` + the IR's `files[].readers`):
```
notes_corrections  right_consumer {"kind":"him","names":["notes_compiler.mjs"]}
  dressing-room/state/notes_corrections.jsonl  W= notes_corrections.mjs  R= notes_corrections.mjs     (base = build)
brief_log          right_consumer {"kind":"him","names":[]}
  dressing-room/state/brief_log.jsonl          W= learnstate.mjs         R= learnstate.mjs           (base = build)
```
The cross-file path: `notes_compiler.mjs:104` imports `readRows` from `notes_corrections.mjs` and calls it at `:422`.
The IR attributes that read to the EXPORTING organ, so the declared consumer `notes_compiler.mjs` is never a reader.
Then `done.mjs:151` (the kind-"him" branch) checks the readers against skill roots ∪ `SURFACES` (`done.mjs:41`:
manager.mjs, captains_call.mjs) and ignores `right_consumer.names`. `notes_corrections.mjs` is neither, so the row
prints `static NO (its declared consumer reads none of its files)` (`done.mjs:191`). `brief_log`'s reader
`learnstate.mjs` is a skill root (`ir.roots.skills`), so its static leg can read yes. **mxh does not move either**
(the IR rows are identical base and build). It is a fork (F-P below), beyond this unit's files.

## 10 · The neutral machine (public API, no token)

```
GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs
0a806df  run 44449464936  jobs 135309655574 (node 24) / 135309655110 (node 22)  completed / cancelled (superseded)
fc2892e  run 44449696556  jobs 135310410201 (node 24) / 135310409759 (node 22)  in_progress when read
```
The runs of the last push are named in the seat's FINAL MESSAGE and in the ledger.

## 11 · FORKS (each one line)

- **F-A · a landing carrying `ci/mxh/q5_paths.mjs`**: F7's count needs it at his root; it is in `ci/mxh/` (named), so it rides only if the landing carries `ci/mxh/`.
- **F-B · `xray_graph.json` re-emit**: the tracked graph carries `declared_sole_writers`; only `node scripts/xray.mjs build` (owner `xray.mjs:4`) re-emits it at the landing, the runner's act, not this seat's.
- **F-C · the base law pack is RED (jugad 93/90, depcruise 13/7)** before mxh: whose unit lowers it, or re-freezes it, is the architect's.
- **F-P · notes_corrections reach (the peer's finding, §9)**: the fix is either the IR attributing an imported reader function's read to the importer (xray transfer function, mxb's family) or `done.mjs:151` honouring `right_consumer.names` for kind "him" — both beyond `scripts/xray.mjs`'s header/Q6 lines and `ci/mxh/`.
- **F-D · the effort receipt**: `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository; its error is named in the FINAL MESSAGE, and nothing is written under `campaign-2026-09/`.
