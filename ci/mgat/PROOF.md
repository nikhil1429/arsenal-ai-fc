# MGAT BUILD — PROOF (unit mgat, forks row 1145 · FK1 ruled B by forks row 1156)

> **READ §8 FIRST.** §1-§7 are the build as it stood at `920d9b5` (base `4b00cf5`, four files). FK1 was ruled B by forks row 1156,
> and §8 is what this branch is NOW: main `fb42118` merged in, `scripts/rung_receipt.mjs` the fifth file, and nine witness clauses.
> §8's numbers supersede §2-§4 and §7 wherever they differ.

Written 19 Nov 2026 by the cloud build seat. Branch `claude/mgat-build`. Nothing on main moved. No PR, no merge, no live
model call, no state file read into or written by this branch. Every number below was measured 19 Nov 2026 (linux,
node 22, LF trees under `os.tmpdir()`, state PLANTED by node scripts). Its command is beside it, and its row is in
`ci/mgat/LEDGER.jsonl`.

## 1. THE BASE
- Cut from `origin/main` **`4b00cf57b0c0c25610769fe85e110d1ffac6a3fc`** (`git fetch origin main`, `git checkout -b
  claude/mgat-build FETCH_HEAD`). This is the sha the brief names ("4b00cf5 or later"). Main had not moved past it at the cut. `ci/mgat/BASE` holds it.
- The spec was read at `370c5e6` (`git show 370c5e6:ci/mgat/MGAT_SPEC.md`, copied here as `ci/mgat/MGAT_SPEC.md`).
  The spec's tools were copied into `ci/mgat/tools/` byte for byte. This seat added `apply.mjs`, `measure.mjs` and `drift.mjs`.
- **Every EDIT matched exactly once at the cut:** `node ci/mgat/tools/apply.mjs . --check` →
  `mgat apply --check: 9 of 9 edit(s) matched exactly once`. Then `node ci/mgat/tools/apply.mjs .` →
  `mgat apply: 9 edit(s) applied · files scripts/groundsman.mjs scripts/cortex.mjs scripts/captains_call.mjs scripts/organism_test.mjs`.
  No hand rewrite and no fuzzy match: the bytes on the branch are `build.mjs` `EDITS`.
- **The sites at the cut, file:line at `4b00cf5`** (grep on a base worktree). They are the same as the spec's lines at `a583afb`, because
  a583afb..4b00cf5 moved no line above them: S1 `groundsman.mjs:263` · `retireIfArmed` `cortex.mjs:2274`, the original
  release `:2281-2285`, the copy `:2344` · S4 `captains_call.mjs:1691` · S5/S6 `:1699` · LIVE `organism_test.mjs:212` · HALF `:2670`.
- Owners (script headers): each edit stays inside its own organ's code. `captains_call.mjs:21` is the sole writer of
  `captains_call.json`, and the grade queue is READ ONLY there (`:1633`, gaffer_brain.mjs its sole writer). No edit writes a state file.

## 2. THE WITNESS, BOTH WAYS — `node ci/mgat/witness_mgat.mjs --org <build> --base-org <base worktree at 4b00cf5>`
On build tip `1458be5`, and re-run on `a431182` after W4 was sharpened (19 Nov 2026), each clause ran RED on the base copy and GREEN on the build copy:
- W1 base `gates report exit 1 · no-empty 268 · frozen 262` → org `exit 1 · no-empty 262 · frozen 262`. The frozen value is read from `scripts/gates.mjs`.
- W2 base `groundsman.mjs 2 (≤ 1) · cortex.mjs 10 (≤ 8) · captains_call.mjs 5 (≤ 2)` → org `1 · 8 · 2`.
- W3 base `LIVE MODE gates — not run` → org `LIVE gates schema half … | FAIL GATES —`. The mode is entered, and no no-empty red is in it (§5 FK1).
- W4 base `Z {"pass":4,"fail":0,"live":["MODE gates"]} · gate reds 1` → org `Z {"pass":4,"fail":1,"live":["gates schema half"]} · gate reds 6 · X the same` (the gate's own RED lines are compared too, §5.1).
- W5 base `hermetic LIVE ["MODE gates"]` → org `full on X: fail 1 · SCHEMA red on the planted registry.json yes · hermetic LIVE ["gates schema half"]`.
- W6 base `releaseLock() calls 0 · retire line bare catches 2` → org `calls 2 · bare catches 0`.
- W7 base `LIVE MODE gates — not run` → org `FAIL GATES — … · LINT ROSE — no-empty 263, baseline 262`.
- BOUND `differing tracked files 25 · outside the named files 0` (on `a431182`) · LAST `node processes naming <run dir>: 0`.
- **LAST LINE (build): `GREEN MGAT gates hermetic half + six site fates · 7 clause(s) · RED on base, GREEN on org · BOUND · LAST` (exit 0).**

### 2.1 Base judged as org (the other way)
`node ci/mgat/witness_mgat.mjs --org <base> --base-org <base>`, 19 Nov 2026: every clause RED on org (W1 `no-empty 268 ·
frozen 262` … W7 `LIVE MODE gates — not run`), BOUND `differing tracked files 0`, LAST `0`.
**LAST LINE: `RED MGAT · W1 (RED on org) · W2 (RED on org) · W3 (RED on org) · W4 (RED on org) · W5 (RED on org) · W6 (RED on org) · W7 (RED on org)` (exit 1).**

## 3. MUTANTS — `node ci/mgat/run_mutants_mgat.mjs --org <build> --base-org <base>`
Each mutant tree is a `git clone -c core.autocrlf=false` of the base with `applyBuild(tree, Mk)`. CONTROL is `applyBuild(tree)`:
its four files must equal the branch's bytes, and every clause must read GREEN on it.
On `a431182`, 19 Nov 2026:
- `CONTROL · named files equal to --org 4 of 4 · witness org side 7 of 7 GREEN`
- M1 → `W1 org RED … no-empty 263 · frozen 262` · M2 → `W2 org RED … captains_call.mjs 3 (≤ 2 at 8c729c8)` · M3 → `W3 org RED … LIVE MODE gates`
  · M4 → `W4 org RED … Z gate reds 6 · X gateReds 8` · M5 → `W5 org RED … hermetic LIVE []` · M6 → `W6 org RED releaseLock() calls 1 · retire line bare catches 2`
  · M7 → `W7 org RED`. LAST `node processes naming <run dir>: 0`.
- **LAST LINE: `run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN` (exit 0).**
- History, named: the first run (on `1458be5`) read `run_mutants: 6 of 7 … · control GREEN`. M4 survived because, at this cut, main drift
  (FK1) already makes the hermetic gate red on Z and X alike, so the bare verdicts compared equal. W4 now compares the gate's own RED
  lines as well, and M4 reads RED.

## 4. MEASUREMENTS, BASE vs BUILD — `node ci/mgat/tools/measure.mjs <sha>` (E plant for gates/lawpack/member, T plant for selftests, 19 Nov 2026)

| What | BASE `4b00cf5` | BUILD `b6595d1` (the four files are the same bytes at every later tip) |
|---|---|---|
| `gates.mjs report` (E) | exit 1 · no-empty 268 · frozen 262 · ABOVE · 3 RED (TYPE 297/296, no-empty 268/262, no-unused-vars 85/82) | exit 1 · **no-empty 262 · frozen 262 · AT OR UNDER** · 2 RED (TYPE 297/296, no-unused-vars 85/82) |
| lint line | `353 error(s) · 2 warning(s) · no-empty 268 · no-unused-vars 85` | `347 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 85` |
| `lawpack.mjs gate` (E) findings | owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · 1933 raw | **identical findings** · 1927 raw (fell) |
| lawpack reds | jugad 93 > 90 · depcruise_errors 13 > 7 | the same two, the same numbers (no count raised) |
| groundsman selftest headline | exit 0 · `ALL CHECKS PASSED` | exit 0 · `ALL CHECKS PASSED` |
| cortex selftest headline | exit 0 · `ALL CHECKS PASSED` | exit 0 · `ALL CHECKS PASSED` |
| captains_call selftest headline | exit 0 · `captains_call selftest: 156 passed, 0 failed` (19 Nov 2026) | exit 0 · `captains_call selftest: 156 passed, 0 failed` (19 Nov 2026) |
| member `gates` (hermetic `organism_test.mjs gates`) | `LIVE MODE gates — not run in the hermetic profile` | `LIVE gates schema half — …` + `FAIL GATES — …` (FK1) |
| `models.mjs check` | exit 0 | **exit 0** |
| hermetic suite (`ci/mgat/tools/suite.mjs <sha> base`, T plant), 19 Nov 2026 | `exit 2 · organism_test: 147 passed, 3 failed` | `exit 2 · organism_test: 147 passed, 4 failed` (19 Nov 2026) |

- The suite's three base reds (coverage law, `SUITE MEMBER · sandbox selftest exits 0`, the roll-up) are the spec's N6, the same on
  both sides. The build's one new red is the `GATES —` assert, which is FK1. LIVE names differ by exactly one: base `MODE gates`, build `gates schema half`.
- The lawpack's two reds also read at `a583afb` (`measure.mjs a583afb gates,lawpack`, ledger). They are not this unit's.
- The law pack gate raises NO count on the build, and none of its findings is new.
- **OWED TO THE ARCHITECT (named, never guessed):** `node scripts/gates.mjs report` on his LIVE state on the build branch, and
  the laptop lint count. Also N2/N4/N5 of the spec: the groundsman and cortex selftests on Windows on the build branch, one at a time, and
  never from a witness against the live keeper.

## 5. WHERE THE RULING AND THE SPEC DIFFER (THE RULING WINS) · and FORKS

### 5.1 Differences, named
- **W1:** the spec asserts `exit 0`. The ruling reads "no-empty must read at or under its frozen baseline on the build, read from
  the file". The witness asserts the ruling and prints the exit beside it. At this cut the exit is 1 for counts this unit
  does not own (FK1).
- **W3:** the spec asserts `ok GATES —`. This build asserts that the mode is ENTERED (a GATES assert, no `LIVE MODE gates`) and that
  no no-empty red is in its block. **W7:** sharpened to require the red BE `LINT ROSE — no-empty`. **W5:** sharpened to
  require the ajv half's own `SCHEMA — registry.json does NOT match`. All three were sharpened because, at `4b00cf5`, the gate is
  red for other reasons (FK1). The spec's looser clause would pass on any red.
- **Plant X:** the spec used T plus a bad registry.json. This witness uses E plus a bad registry.json, so it reads no
  tracked state of either checkout. It copies only `git ls-files` paths, with `dressing-room/state` excluded.
- **Base cut:** the spec measured at `a583afb`. The ruling (4) cuts from `4b00cf5`. All nine edits still matched once.

### 5.2 FORKS (each the architect's to rule; nothing here was edited)
- **FK1 · MAIN DRIFT IN `scripts/rung_receipt.mjs` makes the new hermetic GATES member red.** `node ci/mgat/tools/drift.mjs
  a583afb 4b00cf5` → `no-unused-vars 82 -> 85 · tsc 296 -> 297`, every new site in `scripts/rung_receipt.mjs` (landed
  with mrung `4b00cf5`): no-unused-vars `sep` (the `node:path` import line), `row_sha256` (`rowSha`), `row` (the `red`
  append), and tsc `rung_receipt.mjs(275,71) TS2339 Property 'why' does not exist on type '{ ok: true; dir: string; } | …'`.
  So F1 A's purpose ("nothing new is red") cannot be met at this cut by the four named files. The landing's head ADDS
  the GATES member and it reads FAIL (TYPE + no-unused-vars). This is the same hazard F1 named, from a file not this unit's.
  (A) a small mrung fix (the three unused bindings and the one narrowing) lands first, and mgat re-cuts on it (F7's rule) ·
  (B) the architect names `scripts/rung_receipt.mjs` a fifth file of this build · (C) land the site fates now and the LIVE exit
  after the fix (reverses F1 A). **Recommend A.** The fix is mrung's file, and the gate stays as strict. What decides it: the neutral run of
  this branch (its head adds a red member; §6).
- **FK2 · the lawpack reds `jugad-literal-subject-list 93 > 90` and `depcruise_errors 13 > 7`** read on the LF E plant at
  both `a583afb` and `4b00cf5`, and are unchanged by this build. Not chased: whether they are this plant's environment
  (state folder empty) or real drift. Measured by: `node scripts/lawpack.mjs gate` on his laptop.

## 6. THE NEUTRAL MACHINE (check runs through the public API, no token)
`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (and `/check-runs/<id>/annotations`), 19 Nov 2026:

| Push | node 22 | node 24 |
|---|---|---|
| `b6595d1` (step 2), `c17ad3f`, `1458be5`, `6205245`, `9ecfbd6` (`12a2aad` and `f749e2f`: not read) | cancelled (each superseded by the next push) | cancelled |
| `a431182` (W4) | `135479646260` completed **failure** (run `44500742874`) | `135479645998` completed **failure** (run `44500742874`) |

`a431182`'s B1 verdict on both nodes is `RED · 1 member(s) red that are not red at the merge base`. Its `new` field names exactly ONE red:
`GATES — undefined-symbol families 0 on both sides, every schema-d state file matches, and no frozen count rose`. Its base red is
the one coverage law (`_selftest_coverage_law`), and pass/fail are 149/2 (19 Nov 2026). **This is FK1, read by the neutral machine (windows, CRLF):** the new member is
entered and red for the rung_receipt.mjs counts. No other member changed. The runs of the final push are named in the FINAL message,
because a file cannot carry its own sha's verdict.

## 7. FILES ON THIS BRANCH vs `4b00cf5`
`scripts/groundsman.mjs`, `scripts/cortex.mjs`, `scripts/captains_call.mjs`, `scripts/organism_test.mjs`, and `ci/mgat/**`.
Nothing else (`git diff --stat 4b00cf5 HEAD`; witness BOUND). `.claude/settings.json` is not carried.

## 8. FORKS ROW 1156 (FK1 ruled B), 19 Nov 2026 — what the branch is now

### 8.1 The ruling, by clause
- **(4) main merged first:** `git merge --no-edit fb42118` gave `b5ea3fe` (a plain merge, no conflict; main a4338f0, 980e953, fb42118 touch
  `scripts/acts.mjs`, `claims.mjs`, `conductor.mjs`, `xray.mjs`, none of them this unit's). **Further rises at that head:**
  `node ci/mgat/tools/drift.mjs 4b00cf5 fb42118` → `mgat drift 4b00cf5 -> fb42118: no-unused-vars 85 -> 85 · tsc 297 -> 297`. On the
  merged head, no-empty reads 262 (`measure.mjs b5ea3fe gates`). **None:** main fb42118 brought no new rise of any of the three counts.
  `ci/mgat/BASE` now names `fb42118`, the merge base the neutral verdict judges against. The cut was `4b00cf5` (§1).
- **(1) the fifth file, each site's fate by measurement** (`scripts/rung_receipt.mjs`, file:line at `fb42118`; its header names
  it the SOLE WRITER of its own receipts file, and no edit touches a write):

| Site | What reads it (grep) | Fate |
|---|---|---|
| `:37` `sep` in the `node:path` import | nothing: `grep -n "\bsep\b"` hits only the import | **removed** (a name nothing reads) |
| `:101` `row_sha256` in `rowSha`'s `const { row_sha256, ...rest } = row` | nothing: the binding exists only to keep the key out of `rest` | **removed**: `const rest = { ...row }; delete rest.row_sha256;`. The same object reaches `canon` (keys sorted), so every chain hash is unchanged. The selftest's chain asserts still pass (below) |
| `:307` `const row = append(…red…)` | nothing: the red line prints the witness's exit, out sha and head, never the row. The green verb finds its red by key (`:313`), never by this binding | **removed** (`append(…)` kept: the write is the act) |
| `:275` TS2339 `Property 'why' does not exist` | the cause, measured on a planted file under the repo's own tsconfig: `strict` is off, so `!sd.ok` does not narrow the declared `{ok:true,…}\|{ok:false,why}` union (it stays an error). `sd.ok === false` does narrow (no error) | **repaired at its cause**: `if (sd.ok === false)`, with a two-line comment naming why. No cast, no ignore comment, and the JSDoc `@returns` (`:84`) is unchanged |

  Both frozen baselines are untouched: `git diff fb42118 HEAD -- scripts/gates.mjs` is empty. The bytes are `build.mjs` EDITS `RR-sep`,
  `RR-rowsha`, `RR-red` and `RR-ts`. All thirteen EDITS matched exactly once at `fb42118`.
- **(2) the witness gains the two counts:** W8 is no-unused-vars at or under `LINT_BASELINE["no-unused-vars"]`. W9 is "other checkJs
  diagnostics" at or under `TYPE_BASELINE.soft_errors`. Both are read from the tree's own `scripts/gates.mjs`, never typed. Each has a mutant: M8
  leaves `sep` in, M9 leaves the negation in. W3 is back to the spec's `ok GATES —`, because the gate is now green.
- **(3)** The LIVE exit and every fate ride this one branch. **(5)** FK2 is unit mlaw's, and it is not touched here.

### 8.2 The witness both ways (base worktree at `fb42118`, build `07d74db`), 19 Nov 2026
- Build: W1 `exit 0 · no-empty 262 · frozen 262` · W2 `1 · 8 · 2` · W3 `ok GATES —` · W4 `Z {"pass":5,"fail":0,"live":["gates schema half"]} · gate reds 1 · X the same`
  · W5 `full on X: fail 1 · SCHEMA red on the planted registry.json yes · hermetic LIVE ["gates schema half"]` · W6 `calls 2 · bare catches 0`
  · W7 `FAIL GATES — … LINT ROSE — no-empty 263, baseline 262` · W8 `no-unused-vars 82 · frozen 82` · W9 `other checkJs diagnostics 296 · frozen soft_errors 296`
  · BOUND `differing tracked files 26 · outside the named files 0` · LAST `0`. Base: every clause RED (W8 `85 · frozen 82`, W9 `297 · frozen 296`).
- **LAST LINE (build): `GREEN MGAT gates hermetic half + six site fates + four rung_receipt fates · 9 clause(s) · RED on base, GREEN on org · BOUND · LAST` (exit 0).**
- **LAST LINE (base as org): `RED MGAT · W1 (RED on org) · W2 (RED on org) · W3 (RED on org) · W4 (RED on org) · W5 (RED on org) · W6 (RED on org) · W7 (RED on org) · W8 (RED on org) · W9 (RED on org)` (exit 1).**

### 8.3 Mutants (`run_mutants_mgat.mjs --org . --base-org <fb42118>`), 19 Nov 2026
`CONTROL · named files equal to --org 5 of 5 · witness org side 9 of 9 GREEN`. M1-M7 are RED by W1-W7 as in §3. M8 → `W8 org RED … no-unused-vars 83 · frozen 82`.
M9 → `W9 org RED … other checkJs diagnostics 297 · frozen soft_errors 296`. LAST `0`.
**LAST LINE: `run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN` (exit 0).**

### 8.4 Measurements, BASE `fb42118` vs BUILD `07d74db` (`measure.mjs`), 19 Nov 2026

| What | BASE `fb42118` | BUILD `07d74db` |
|---|---|---|
| `gates.mjs report` (E) | exit 1 · 3 RED: TYPE 297/296 · no-empty 268/262 · no-unused-vars 85/82 | **exit 0 · `gates: GREEN — nothing rose`** · no-empty 262 · no-unused-vars 82 · types 296 |
| lint line | `353 error(s) · 2 warning(s) · no-empty 268 · no-unused-vars 85` | `344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82` |
| law pack findings | jugad 93 · bare-catch 37 · receipt-testimony-read 5 · the rest 0 · raw 1933 | **identical findings** · raw 1927. The two reds (jugad 93/90, depcruise 13/7) are the same on both sides. That is FK2, unit mlaw's |
| groundsman / cortex selftest | exit 0 `ALL CHECKS PASSED` / exit 0 `ALL CHECKS PASSED` | the same |
| captains_call selftest | exit 0 `captains_call selftest: 156 passed, 0 failed` (19 Nov 2026) | the same (19 Nov 2026) |
| **rung_receipt selftest** | exit 0 `rung_receipt selftest: all 13 pass` | exit 0 `rung_receipt selftest: all 13 pass` |
| member `gates` (hermetic) | `LIVE MODE gates — not run` | `LIVE gates schema half` + **`ok GATES —`** |
| `models.mjs check` | exit 0 | **exit 0** |
| hermetic suite (`suite.mjs <sha> base`, T plant), 19 Nov 2026 | `organism_test: 147 passed, 3 failed` | `organism_test: 148 passed, 3 failed` (19 Nov 2026): the same three linux reds (N6), and the one new pass is `GATES —` |

Still OWED TO THE ARCHITECT, never guessed: `gates.mjs report` on his live state on this branch, the laptop lint count, and the
groundsman, cortex and rung_receipt selftests on Windows, one at a time.

### 8.5 Files on this branch vs main `fb42118`
`scripts/groundsman.mjs`, `scripts/cortex.mjs`, `scripts/captains_call.mjs`, `scripts/organism_test.mjs`, `scripts/rung_receipt.mjs`,
and `ci/mgat/**`. Nothing else (`git diff --stat fb42118 HEAD`; witness BOUND). `.claude/settings.json` is not carried.

### 8.6 The neutral machine
- `920d9b5` → merge `b5ea3fe`, `2a0d56a` (the fifth file), `07d74db` (the witness): each superseded by the next push before it finished.
- **`46103cac4203f721991cf3ed30c2bb897534921e`** (PROOF §8; the last tip carrying code or witness bytes), run `44519772101`, 19 Nov 2026:
  node 22 job `135545121457` **success** · node 24 job `135545121089` **success**. B1 verdict on both legs: `GREEN · no member red that is not red at the merge base`.
  Base `fb42118`, `new: []`, `base_red 1` (the coverage law, as at the base), pass/fail 150/1 (19 Nov 2026).

### 8.7 THE TIP
The tip judged by the neutral machine is **`46103cac4203f721991cf3ed30c2bb897534921e`**. The commit after it adds only this §8.6/§8.7 text and
ledger rows (`ci/mgat/PROOF.md`, `ci/mgat/LEDGER.jsonl`), because a file cannot carry its own sha's verdict. Its two legs are read after the push.

## 9. THE RE-CUT ON MAIN `5759cce` (runner M, 20 Nov 2026) — the two new reds of land/mgat `1b8c379`, named. No organ byte changed

### 9.1 The merge
`git merge --no-edit 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` → `08b7e15` (no conflict). `git diff --stat origin/land/mgat HEAD -- . ':!ci'`
is **empty**: outside `ci/` the merged tip is byte-identical to land/mgat `1b8c379`. `ci/mgat/BASE` now names `5759cce`.

### 9.2 (a) the GATES red — which frozen count rose (`node ci/mgat/tools/measure.mjs <sha> gates`, E plant, 20 Nov 2026)

| Rule | frozen (`scripts/gates.mjs`, untouched) | main `5759cce` | merged tip `08b7e15` | the sites that add it at the tip (`MGAT_RULE=no-empty,no-unused-vars node ci/mgat/tools/drift.mjs a5f8693 08b7e15`) |
|---|---|---|---|---|
| no-empty | 262 | 272 | **266** | `scripts/organism_test.mjs:2870` `namingProcs` `/proc` read `catch {}` · `:2928` `process.kill(p)` `catch {}` · `:2943` `unlinkSync(… node_modules)` `catch {}` · `:2944` `rmSync(tmp …)` `catch {}` |
| checkJs diagnostics | 296 | 298 | **297** | `scripts/organism_test.mjs:2932:68` TS2339 `Property 'code' does not exist on type 'Error'` (`r.error.code`, the F-9 bound kill) |
| no-unused-vars | 82 | 85 | 82 | none (this unit's rung_receipt fates hold it at the frozen value) |

- `gates.mjs report` exits 1 on BOTH (main `5759cce`: 3 RED · the merged tip: 2 RED, `LINT ROSE — no-empty 266` and `TYPE COUNT ROSE — 297`).
- **Whose bytes:** every one of the five sites is in main's own `scripts/organism_test.mjs` (`git blame` → `5759cce`). Its assembled tree carries unit
  ms1's commits: `git log -S` on `claude/ms1-build` `179a0ee` gives `f052188` (unit ms1, the witnesses member) for all four no-empty sites, and
  `0b3f8a8` (unit ms1, forks row 1153 (3) F-9) for the TS2339. Not one is in a line this unit wrote.
- **Why it is NEW at land/mgat and not on main:** on main the `gates` mode is in `LIVE_MODES`, so the hermetic profile never runs the gate.
  This unit's LIVE exit (row 1145 (1)) makes the neutral machine read the gate. So the first landing that carries it reads main's own five
  rises as a new member red. That is the same class FK1 named (forks row 1156 (1)), from a later landing.

### 9.3 (b) WITNESS ‹mf2› · GREEN at head against its BASE — its red clause and cause (`node ci/mgat/tools/mf2run.mjs`, the member's own recipe: LF trees, refusing model stubs, 20 Nov 2026)

| org → base | last line | the clause lines that are red |
|---|---|---|
| `08b7e15` → `15edfec` (mf2's own BASE, as the member runs it) | `RED MF2 · F3 BOUND` | F3 `named LIVE only by the build: gates schema half` · BOUND |
| `08b7e15` → `5759cce` (as asked) | `RED MF2 · F3 BOUND` | F3 `… named LIVE only by the build: gates schema half` · BOUND `differs: scripts/captains_call.mjs, scripts/cortex.mjs, scripts/groundsman.mjs, scripts/organism_test.mjs, scripts/rung_receipt.mjs` |
| `5759cce` → `15edfec` (control: main) | `RED MF2 · BOUND` | BOUND only |

- The member forgives BOUND (`judgeLast`, `scripts/organism_test.mjs:2843-2852`, the bid ids), so main reads GREEN. At the tip it reads
  **red beyond BOUND: F3**.
- **The red clause is F3** (`ci/mf2/witness_mf2.mjs:16`, `:101`): "the build names LIVE no member the base did not". The LIVE count is equal (126 build, 126 base).
  The new NAME is `gates schema half`, which this unit's HALF edit prints through `liveNamed` (`scripts/organism_test.mjs`, the `gates()` function)
  in place of `MODE gates`. F1, F2 and F4 are GREEN on both runs. F2 names the GATES member as "added (named, never red)".
- **The cause** is this unit's own design: the spec's §3.4 HALF names the ajv half LIVE under a new name. mf2's F3 counts any new LIVE name as
  red, even when one leaves the table as the other arrives.

### 9.4 What the architect rules (named, nothing done)
- (a) The five ms1 sites: fates by measurement, as the mgat six and the rung_receipt four. Either `scripts/organism_test.mjs`'s ms1 lines join
  this unit (it already owns that file) or unit ms1 takes them, and mgat re-cuts.
- (b) mf2 F3 against the HALF name. Either the ajv half is named LIVE under a name the base already prints, or mf2's F3 is re-cut to compare
  the LIVE names that LEFT against the ones that ARRIVED (owner unit mrf, like F2/F4).

CHECKPOINT · STOPPED after the 5759cce re-cut · tip: the commit that carries this line, its parent the merge `08b7e15`; its sha is in the runner's read of claude/mgat-build · resume from the architect's ruling on §9.4
