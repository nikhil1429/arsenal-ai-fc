# MXH SPEC — the sole-writer header parser (F2) and Q6 SILENT (F5)

Unit mxh · forks rows 1122 (1) (F2 A as unit mxh, F5 A handed to mxh) and 1123 (1) · spec seat, cloud,
written 2026-11-19 (UTC). Base: `origin/main` **224f9b9** (2026-11-19). This file builds nothing. Every number
was measured on that base in hermetic copies under `os.tmpdir()`, by the command beside it. The commands and
their last lines are in `ci/mxh/LEDGER.jsonl`.

**Has mxw landed? No (measured 2026-11-19).** `scripts/xray.mjs:621-633` (`seedDefaults`) still holds the
identifier-only rule on main. `claude/mxw-build` ab98546 is cut from the same base 224f9b9 and changes only
that function. So every measurement below was taken on **two** trees: main, and main with mxw-build's
`xray.mjs`. The mxh patch applies cleanly on both.

**HEADLINE (measured 2026-11-19).** The F2 fix is one regex at `scripts/xray.mjs:956`. On its own it takes Q5
from 1 to 5 on main, and from 1 to 7 with mxw. **Every one of those rows is a parser false positive. There is
no real breach and no stale header.** In each row the declaring organ writes nothing, and the "undeclared"
writer is the file's own header-declared owner. These rows are prose on a sole-writer line that names
ANOTHER organ's file, e.g. `day.mjs:94` "night.mjs is sole writer of night_log.jsonl". The pre-existing base
row (`widgets.json`, `teaching_audit.mjs:150`) is the same class.

One rule separates the prose from the claims, the **CLAUSE RULE**. A token counts only if it sits in the
marker's own clause (no `. ` or `;` between them), and that clause names no other organ's `.mjs`. With it:
- Q5 goes to 0 on both trees.
- No guarded declaration is lost. Guarded rises from 27 to 44 on main and from 28 to 49 with mxw.

F5 lands as **Q6 SILENT**, a report-only query: a header declares a file and no IR path with that name has a
writer. Its census, with every row triaged:
- main: 12 rows, 5 of them with no IR file at all;
- with mxw: 7 rows;
- **with mxw, every remaining row is an IR blindness** with its writer named by file:line, or a file outside
  the repo by design. None is a breach or a stale header.

The witness plants 6 clauses (each RED on base, GREEN on the build, on both trees), and 8 of 8 mutants are
killed by their clause.

---

## 1 · The parser fix (F2), by file:line at 224f9b9

Owner of the file: `scripts/xray.mjs:4` (`SOLE WRITER of dressing-room/state/xray_graph.json`).

`scripts/xray.mjs:949-959` is the declared-headers loop. The defect is at `:956`:
```
for (const fm of line.matchAll(/([A-Za-z0-9_\-.]+\.(?:json|jsonl))/g)) declared.push({ organ: f, file: fm[1] });
```
The alternation tries `json` first and has no boundary, so `x.jsonl` matches as `x.json`. Measured on main,
2026-11-19, with `node ci/mxh/witness/q5.mjs <copy>/scripts/xray.mjs`:
```
declared 66 · declared_jsonl 0 · Q5_n 1 · F5_n 5 · not_in_ir_n 33
```
Not one `.jsonl` lane is declared. 32 of the 33 declarations missing from the IR are the truncated `x.json`
names.

**The fix, exact form** (`ci/mxh/witness/xray_f2_fix.patch`, `git apply --check` clean on 224f9b9):
```
for (const fm of line.matchAll(/([A-Za-z0-9_\-.]+\.jsonl?)(?![A-Za-z0-9_])/g)) declared.push({ organ: f, file: fm[1] });
```

## 2 · TRIAGE — every Q5 row the fix surfaces (one row each)

Command: `node ci/mxh/witness/q5.mjs <tree>/scripts/xray.mjs` for the census, and
`node ci/mxh/witness/decls.mjs <tree>/scripts/xray.mjs` for each declaration's line, its IR writers, and
whether it names a foreign organ. The writer lines are the IR's own sink lines (`ir.organs[o].writes[].lines`).

```
census 2026-11-19 (q5.mjs)          declared  jsonl  guarded  Q2  Q5  F5(old silent.mjs)  not_in_ir
base (main 224f9b9)                    66       0      27      1   1        5                33
base + F2 fix alone                    66      32      44      1   5       14                 7
base + fix + clause rule               59      26      44      1   0       13                 6
mxw  (mxw-build ab98546 xray)          66       0      28      1   1        4                33
mxw  + F2 fix alone                    66      32      49      1   7        9                 5
mxw  + fix + clause rule               59      26      49      1   0        9                 5
```
`guarded` is the number of declarations Q5 really checks: the declaring organ is an IR writer of a file with
that name. The clause rule drops 7 tokens, and **none of them is guarded**. The gate gets stricter.

| # | file | the sole-writer line that declares it | the actual IR writer (code line that writes) | fate |
|---|---|---|---|---|
| 1 | `outbox.jsonl` | `brain.mjs:85` "…READ ONLY: outbox.mjs stays the sole writer of outbox.jsonl" | `outbox.mjs:152` appendFileSync; its own header `outbox.mjs:4` | **parser FP** (same-line foreign organ) |
| 2 | `night_log.jsonl` (mxw tree only) | `day.mjs:94` "(night.mjs is sole writer of night_log.jsonl)" | `night.mjs:96` appendFileSync; header `night.mjs:11` | **parser FP** (same-line foreign organ) |
| 3 | `presence_log.jsonl` | `distiller.mjs:28` "sole writer). presence_log.jsonl now rolls…" (the marker closes `:27`'s "owned by presence.mjs (the ledger's") | `presence.mjs:682` appendFileSync | **parser FP** (the token sits in the NEXT sentence; the foreign organ is on the wrapped line above) |
| 4 | `resume_pointer.jsonl` (mxw tree only) | `forge_session.mjs:29` "resume_pointer.mjs is the SOLE WRITER of …/resume_pointer.jsonl" | `resume_pointer.mjs:97` appendFileSync; header `resume_pointer.mjs:14` | **parser FP** (same-line foreign organ) |
| 5 | `rejirah_log.jsonl` | `fsrs.mjs:159` "rejirah.mjs is the single writer of rejirah_log.jsonl" | `rejirah.mjs:278/305` appendFileSync; header `rejirah.mjs:56` | **parser FP** (same-line foreign organ) |
| 6 | `rejirah_log.jsonl` | `gaffer_brain.mjs:110` "because that organ is the sole writer of rejirah_log.jsonl" (`:109` names rejirah.mjs) | same as row 5 | **parser FP** (wrapped sentence, anaphora) |
| 7 | `widgets.json` (on base already) | `teaching_audit.mjs:150` "widget.mjs stays the sole writer of widgets.json" | `widget.mjs:94` renameSync→dst; header `widget.mjs:21` | **parser FP** (same-line foreign organ) |

**Real breaches: 0. Stale headers: 0. Parser false positives: all of them.** On main the count is 5 rows
(1, 3, 5, 6, 7). With mxw it is 7 rows. Rows 2 and 4 need mxw, because without it the owner's write is
invisible and the file has no writers for Q5 to compare against.

*Why this matters downstream (the cross-file path):* `xray.mjs:1068-1076` Q5 feeds
`audit.mjs:240`, which raises one `sole-writer-drift` finding per row. If the fix landed alone, audit would
gain 4 false findings on main and 6 with mxw, each one telling a session to "repair" a working organ.

### The smallest rule that separates them — the CLAUSE RULE, scored by measurement

`node ci/mxh/witness/fp_rules.mjs <tree>/scripts/xray.mjs` scores each candidate. A declaration is TRUE when
the declarer is an IR writer of the file. Results, measured 2026-11-19:
```
tree: base+fix        kept_true  dropped_false  kept_false                             dropped_true
R1 same line             46          3          distiller:28, gaffer_brain:110         —
R2 + line above          44          5          —                                      forge_session:102, fuelboard:26
R3 same sentence         45          4          distiller:28                           fuelboard:26
R4 CLAUSE (proposed)     46          5          —                                      —
tree: mxw+fix
R1                       51          5          distiller:28, gaffer_brain:110         —
R2                       48          7          —                                      forge_session:102, fuelboard:26, night:11
R4 CLAUSE (proposed)     51          7          —                                      —
```
R4 is the only rule with zero errors on both trees. As code (`ci/mxh/witness/xray_f2_clause.patch`, inside
the `:949` loop): a token is skipped when either
- `lastStop(line.slice(0, fm.index)) >= 0`, meaning a `. ` or `;` lies between the marker and the token, or
- `foreignNamed(f, clauseBefore(head, at))`, meaning the clause names a `<x>.mjs` other than this organ.

`clauseBefore` walks back over wrapped `//` lines until a `. `, a `;`, an empty `//` line, or code, at most a
few lines. It adds no fs call, and xray's own unresolved count is unchanged (8 → 8, 2026-11-19).

## 3 · F5 — Q6 SILENT, report-only: "declared, zero writers"

**The query** (`ci/mxh/witness/xray_f5_q6.patch` on top of the clause patch; the whole of mxh is
`xray_mxh_full.patch`, `git apply --check` clean on 224f9b9):
- `queries()` gains `Q6`. A declaration (directories skipped) is reported when **no IR path with that
  basename** has any writer.
- Each row carries `in_ir: false` when the IR holds no file of that name at all.
- Q6 reads **every** path with the basename. Today's `silent.mjs` / Q5 shape is a `Map` where the last path
  wins. Here a selftest fixture path such as `scripts/reps_log.jsonl` or `no-such-dir-for-cases/x.json` sorts
  after `dressing-room/state/…`, wins the map, and fakes "zero writers".
- `report()` gains one `show("Q6 SILENT (report-only) …")` line.
- No gate, no audit finding and no organ reads Q6. Its only consumers are `xray.mjs` itself
  (`q` and the report). `audit.mjs:232-240` iterates named keys Q1-Q5, so it is untouched.

**The census both ways** (`node scripts/xray.mjs q` in each copy, 2026-11-19):
```
base + mxh:  Q1 15 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 12
mxw  + mxh:  Q1 14 · Q2 1 · Q3 5 · Q4 3 · Q5 0 · Q6 7
```
The old last-wins census had more rows: 13 on base+clause, 9 on mxw+clause. The extra rows were the 6
basename collisions, gone under Q6 (class C below).

**Triage of each silent file.** None is a breach. None is a stale header: in every row the header's organ
really writes the file, at the line named.

| # | file | declared at | the real write (file:line) | why the IR sees no writer | fate | mxw tree |
|---|---|---|---|---|---|---|
| A1 | `brief_log.jsonl` | `learnstate.mjs:17` | `learnstate.mjs:806` via `recordBrief(…, { dir = STATE } = {})` `:794` | options-bag default | IR blind, **fixed by mxw** | gone |
| A2 | `notes_corrections.jsonl` | `notes_corrections.mjs:14` | `:91` via `add(p, { path = LEDGER } = {})` `:106` | options-bag default | IR blind, **fixed by mxw** | gone |
| A3 | `resume_pointer.jsonl` | `resume_pointer.mjs:14` | `resume_pointer.mjs:97` | options-bag default | IR blind, **fixed by mxw** | gone |
| A4 | `laws_register.json` | `registry.mjs:5` | registry.mjs (mxw §2 "writers gained") | options-bag default | IR blind, **fixed by mxw** | gone |
| A5 | `night_log.jsonl` (`in_ir:false`) | `night.mjs:11` | `night.mjs:96` | options-bag default | IR blind, **fixed by mxw** | gone |
| B1 | `models.json` | `models.mjs:8` | `models.mjs:430` renameSync(tmp, path) in `finishProbe(out, { write, path, prev, t0 })` `:425`, called `:423` from `probe({ … path = MODELS_JSON … } = {})` `:345` | an ObjectExpression ARGUMENT into a destructured param with no default (mxw's fork F1 (B)) | IR blind | stays |
| B2 | `sitting.json` | `sitting.mjs:14` | `sitting.mjs:503` `writeAtomic(F.sitting(), S)` → `:172`; `F.sitting` is an arrow in an object literal `:95` | the return value of a member call | IR blind | stays |
| B3 | `brain_outcomes.jsonl` | `scoreboard.mjs:17` | `scoreboard.mjs:168` appendFileSync(outPath), called `:402` with `deps.outPath`; the deps default holds `outPath: OUT_PATH` `:390` (`:86`) | a property of a deps object | IR blind | stays |
| B4 | `manager_notes.json` (`in_ir:false`) | `manager.mjs:21` | `manager.mjs:1007` `writeAtomic(dir, P("manager_notes.json"))` → `:971`; `P = mkP(dir)` `:977`, `mkP` a curried closure `:48` | a closure-returned function | IR blind | stays |
| B5 | `rails_blind.jsonl` (`in_ir:false`) | `rails.mjs:5` | `rails.mjs:324-325` `openSync(file, flag)` + `writeSync(fd, …)` | `openSync`/`writeSync` are not in `WRITE_FNS` (`xray.mjs:436`) | IR blind (sink class) | stays |
| B6 | `teaching_gate.jsonl` (`in_ir:false`) | `teaching_gate.mjs:58` | `teaching_gate.mjs:807` `appendFileSync(GATE_LOG(dir), …)`; `GATE_LOG` a const arrow `:82` | the return value of a const arrow call | IR blind | stays |
| D1 | `usage_reading.json` (`in_ir:false`) | `usage_tap.mjs:10` (its header: "lives in the CAMPAIGN ROOT") | `usage_tap.mjs:118-121` writeReading(root) | outside the repo, by design | out of xray's scope | stays |
| C* | `scripts/{audit_ledger,reps_log,distiller_latency,afferent}.jsonl`, `no-such-dir-for-cases/{forge_session,teaching_contract}.json` | the six headers | the state lane HAS its owner as writer: `audit.mjs:88`, `capture.mjs:633/787`, `distiller.mjs:711`, `thalamus.mjs:675`, `forge_session.mjs:1180`, `teaching_contract.mjs:966` | basename collision, last-wins `Map` | **query FP**, retired by Q6's every-path read | gone |

Each B row is a separate IR transfer-function gap. Each has its own idiom, and none is in this unit (fork F8).

## 4 · Witness — each plant RED on base, GREEN on the build

`node ci/mxh/witness/witness_mxh.mjs --xray <xray.mjs to judge> --tree <copy with node_modules/acorn> --live`.
It plants a tree under `os.tmpdir()` holding the judged `xray.mjs`, a stub `package.json`, an EMPTY
`dressing-room/state`, and fixture organs. It runs `build()` + `queries()` in a synchronous child, removes
the tree, and prints paths and organ names only. It binds no port, names no service, touches no daemon, and
calls no model. Every wait is bounded by the child's own exit, and no timeout is typed.

| clause | plant | base | fix alone | **build** |
|---|---|---|---|---|
| **W1** boundary | `a1.mjs` declares `w1_lane.jsonl`, `z1.mjs` is a second writer → declared as .jsonl AND a Q5 row | RED | GREEN | **GREEN** |
| **W2** same-line prose | `c2.mjs` "d2.mjs stays the sole writer of w2_lane.jsonl" (the brain.mjs:85 shape) → not c2's; d2's is | RED | RED | **GREEN** |
| **W3** wrapped prose | the two cross-line shapes (distiller.mjs:27-28, gaffer_brain.mjs:109-110) → not e3's; f3's are | RED | RED | **GREEN** |
| **W4** nothing lost | a true claim after a `;` clause naming another organ (fuelboard.mjs:24-26), and after a full stop on the line above (forge_session.mjs:102) | RED | GREEN | **GREEN** |
| **W5** Q6 | `k5` declared + never written → reported; `m5`'s lane beside a same-basename fixture path → NOT reported | RED | RED | **GREEN** |
| **W6** live | on the real `scripts/`: .jsonl declarations exist, and every Q5 row's declarer writes that file | RED (0 jsonl; widgets row) | RED (4 rows) | **GREEN** |

```
measured 2026-11-19 (witness_mxh.mjs, last line):
base 224f9b9        RED MXH · W1 W2 W3 W4 W5 W6
base + fix alone    RED MXH · W2 W3 W5 W6
base + mxh          GREEN MXH · 6 clause(s)
mxw ab98546         RED MXH · W1 W2 W3 W4 W5 W6
mxw + mxh           GREEN MXH · 6 clause(s)
```

## 5 · Mutants — one per clause, each turns its clause RED

`node ci/mxh/witness/run_mutants_mxh.mjs --xray <built xray.mjs> --tree <copy>`. Each mutant is a string
replacement on a temp copy. An anchor that is not found exactly once is RED (UNAPPLIED), never skipped.

| mutant | change | killed by |
|---|---|---|
| M1 | the boundary reverted (`json\|jsonl`) | W1 |
| M2 | the foreign-organ check dropped | W2 |
| M3 | the clause never walks back (= R1) | W3 |
| M4 | `;` not a stop (= R3) | W4 |
| M5 | the walk-back always takes the line above (= R2) | W4 |
| M6 | Q6 reads only the last path of a basename | W5 |
| M7 | a stop between the marker and the token no longer ends the claim | W3 |
| M8 | the whole clause rule dropped (the F2 fix alone) | W6 |
```
measured 2026-11-19: GREEN MXH MUTANTS · 8 of 8 killed by their clause, control GREEN   (base tree AND mxw tree)
```
M7 was first aimed at W6 and **lived**. In the live copy, the distiller row's file is shadowed by an absolute
fixture path the IR resolved from the cwd (a last-wins collision), so Q5 never saw the row. It is named in §8,
re-aimed at W3, and M8 now carries W6.

## 6 · What else the build moves (measured 2026-11-19)

- **IR facts: unchanged.** Run `node ci/mxh/witness/unres.mjs <copy>/scripts/xray.mjs`: unresolved stays 2065 on main and 2015 with mxw;
  xray.mjs's own count stays 8; the organs and files counts are the same base vs build. mxh changes only
  `declared_sole_writers` and `queries()`.
- **Hermetic suite, base vs build, in a clone carrying `.git`:**
  `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, last line identical on both:
  ```
  2026-11-19 · organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
  ```
  The failing lines are the same set on both trees (`diff` of the FAIL lines is empty). They are the
  selftest-coverage law, the `sandbox` selftest (the tripwire recorded 2 of 4), and the 52-member line that
  carries it, the same three mxw measured. mxh moves none of them.
- **`node scripts/xray.mjs selftest` in the clones** gives the same result base and build:
  ```
  2026-11-19 · xray: 19 passed, 4 failed
  ```
  The failures are the three NUL-byte traps, plus the per-organ ratchet measured against the committed
  `xray_graph.json`, whose `built_at` is 2026-09-07. mxw measured 3 failed, presumably on a rebuilt graph. Named in §8.
- **flow_atlas:** after `xray build` + `flow_atlas build`, `flow_atlas check` exits 0 on all four trees. The
  atlas hash differs **even base vs base** across two runs, so it is time-dependent. It cannot show whether
  mxh changes the atlas. The tracked `xray_graph.json` carries `declared_sole_writers`, so the landing must
  re-emit it through its owner's verb (§9).

## 7 · FORKS — for the architect

**F6 · the false-positive rule**
- (A) the CLAUSE RULE (R4). **Recommended.** It makes 0 errors on both trees (§2) and it is mutant-proven.
- (B) R1 (same line only). It is simpler, and it leaves 2 FPs (distiller:28, gaffer_brain:110) as Q5 rows,
  which become audit findings.
- (C) no rule. Instead, rewrite the 7 prose lines so that "sole writer" names only the organ's own file. This
  touches the comments of the organs named in §2 (measured 2026-11-19), beyond this unit's files.
- (D) the boundary fix alone. It adds 4 false audit findings on main and 6 with mxw.
- *What decides it:* `fp_rules.mjs` on the land tree. A rule must have `dropped_true` empty and
  `kept_false` empty.

**F7 · Q5's own last-wins `Map`** (`xray.mjs:1069-1072`)
- (A) leave Q5 as it is. **Recommended for this unit.** Measured 2026-11-19 in the hermetic copies: Q5 over
  every path equals Q5 last-wins on all four trees.
- (B) give Q5 the same every-path read as Q6.
- *What decides it:* the live witness showed that last-wins depends on cwd-resolved absolute fixture paths
  (§5, M7). Run the same every-path vs last-wins count on his laptop, from his repo root.

**F8 · the B-class IR blindnesses** (B1-B6)
- (A) report only. Q6 names them, and each later gets its own unit. **Recommended.**
- (B) fix the sink class B5 (`openSync`/`writeSync` into `WRITE_FNS`) here.
- (C) fix the others here.
- *What decides it:* the per-organ unresolved ratchet and the Q2/Q5 delta of each fix, measured alone. B5 is
  the smallest. It is one Set entry plus fd tracking, and fd tracking is NOT a one-line change.

**F9 · where the witness lives** (the same question as mxw F4)
- (A) `xray.mjs selftest` fixtures. These are LIVE-only in the hermetic profile, so the neutral machine
  never judges them.
- (B) a hermetic `organism_test.mjs` clause running `witness_mxh.mjs`. **Recommended.**
- (C) both.

**F10 · the order with mxw**
- (A) mxw lands first, then mxh re-emits `xray_graph.json` on top. **Recommended.** The patch was
  measured GREEN on both trees, and rows 2 and 4 of §2 only exist with mxw.
- (B) mxh first.
- (C) one landing.
- *What decides it:* `git apply --check ci/mxh/witness/xray_mxh_full.patch` on mxw's land tip. It applies via
  `patch -p1` on ab98546 today, because the two edits do not overlap.

**F11 · D1 `usage_reading.json`**
- (A) keep it as a Q6 row: true and harmless. **Recommended.**
- (B) Q6 skips headers that say their file lives outside the repo. That is a prose rule, the very thing F6
  removes.

## 8 · NAMED, NOT GUESSED

- **The committed `xray_graph.json` is stale against main's code.** The `xray q`/report path on the clone
  showed `built_at` 2026-09-07 and organs 115/115. The live build parses 137. This is why xray's ratchet
  fails 4 here, not 3.
  *Laptop:* `node scripts/xray.mjs build && node scripts/xray.mjs selftest` on clean main.
- **cwd-dependent IR paths.** Some organs' fixture paths resolve to absolute paths under whatever cwd xray
  runs from (e.g. `<cwd>/no-such-dir-xyz/presence_log.jsonl`, `/tmp/no-dir/afferent.jsonl`). They collide
  by basename with the state lane, so Q5's last-wins result can depend on the cwd (§5 M7).
  *Laptop:* `node ci/mxh/witness/q5.mjs scripts/xray.mjs` from the repo root vs from another directory.
- **The `scripts/*.jsonl` reads** by `limits.mjs` and `pulse.mjs` (the C rows). The IR holds a reader of
  `scripts/reps_log.jsonl` and others. Whether that is a real mis-resolved read or an IR artifact was not
  reached. *Laptop:* `node scripts/xray.mjs q` and the `limits.mjs`/`pulse.mjs` lines that build those paths.
- **The LIVE verdicts this unit moves:** `audit` (Q5 → `sole-writer-drift` findings), `xray`/`flow_atlas`/
  `blackbox`/`herd` selftests. All of them read the tracked IR, and the cloud judges none of them.
  *Laptop:* `node scripts/audit.mjs report` before/after (the `sole-writer-drift` rows), and the full suite
  on the land branch.
- **The hermetic suite's 3 UNRULED fails:** a container artifact, or real on main? This was not reached
  (the same as mxw's §8). *Laptop:* the same hermetic command on clean main.
- **Doubtminer's declaration is invisible either way.** `doubtminer.mjs:37` puts the marker AFTER its tokens
  ("doubt_grammar.json · lexicon.json · tape_room.json (sole writer of all 3)"), so the parser declares none
  of them, before and after mxh. mutagen's lexicon mutant (`mutagen.mjs:810`) is caught by Q2, not Q5, so
  nothing regresses. It is a known hole, named, and not in this unit.

## 9 · Files a build would touch

1. `scripts/xray.mjs` — the `:949-959` declared loop (boundary + clause rule), plus `queries()`
   `:1040-1078` (Q6) and `report()` (`:1205`, one `show`). Owner: xray.mjs. The patch is
   `ci/mxh/witness/xray_mxh_full.patch`.
2. `scripts/organism_test.mjs` — the hermetic clause, if F9 (B)/(C). Owner: organism_test.mjs.
3. `dressing-room/state/xray_graph.json` — regenerated ONLY by `node scripts/xray.mjs build` (owner `xray.mjs:4`).
4. `dressing-room/state/flow_atlas.json` (and what `flow_atlas.mjs build` emits) — ONLY by that verb, if the
   land tree's `flow_atlas check` goes STALE after step 3.
5. Each one a fork, beyond these: the §2 organs' prose (F6 C), any IR transfer function (F8), and Q5's own
   Map (F7 B). No registry act: no row is touched.

## 10 · The neutral machine on this branch

This branch is main 224f9b9 plus `ci/mxh/` only, so its verdict is the BASE verdict. Check runs are read
from the public API (`GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`, no token):

| sha | workflow run | job | name | conclusion |
|---|---|---|---|---|
| e589330 | 44440464810 | 135279805160 / 135279804902 | npm test · node 22 / 24 | cancelled (superseded by the next push) |
| c64f54f | 44440743356 | 135280739043 / 135280740295 | npm test · node 22 / 24 | cancelled (superseded) |
| 4294572 | 44441328605 | 135282683758 / 135282684213 | npm test · node 22 / 24 | queued when read |

The runs of the push that carries this file are named in the seat's FINAL MESSAGE.
