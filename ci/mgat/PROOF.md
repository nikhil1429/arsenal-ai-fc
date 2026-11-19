# MGAT BUILD — PROOF (unit mgat, forks row 1145)

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
On build tip `1458be5` (19 Nov 2026), each clause ran RED on the base copy and GREEN on the build copy:
- W1 base `gates report exit 1 · no-empty 268 · frozen 262` → org `exit 1 · no-empty 262 · frozen 262`. The frozen value is read from `scripts/gates.mjs`.
- W2 base `groundsman.mjs 2 (≤ 1) · cortex.mjs 10 (≤ 8) · captains_call.mjs 5 (≤ 2)` → org `1 · 8 · 2`.
- W3 base `LIVE MODE gates — not run` → org `LIVE gates schema half … | FAIL GATES —`. The mode is entered, and no no-empty red is in it (§5 FK1).
- W4 base `Z {"pass":4,"fail":0,"live":["MODE gates"]}` → org `Z {"pass":4,"fail":1,"live":["gates schema half"]} · X the same`.
- W5 base `hermetic LIVE ["MODE gates"]` → org `full on X: fail 1 · SCHEMA red on the planted registry.json yes · hermetic LIVE ["gates schema half"]`.
- W6 base `releaseLock() calls 0 · retire line bare catches 2` → org `calls 2 · bare catches 0`.
- W7 base `LIVE MODE gates — not run` → org `FAIL GATES — … · LINT ROSE — no-empty 263, baseline 262`.
- BOUND `differing tracked files 24 · outside the named files 0` · LAST `node processes naming <run dir>: 0`.
- **LAST LINE (build): `GREEN MGAT gates hermetic half + six site fates · 7 clause(s) · RED on base, GREEN on org · BOUND · LAST` (exit 0).**
- **LAST LINE (base as org), 19 Nov 2026:** see §2.1.

### 2.1 Base judged as org (the other way)
MUTANTS_AND_BASE_PLACEHOLDER

## 3. MUTANTS — `node ci/mgat/run_mutants_mgat.mjs --org <build> --base-org <base>`
Each mutant tree is a `git clone -c core.autocrlf=false` of the base with `applyBuild(tree, Mk)`. CONTROL is `applyBuild(tree)`:
its four files must equal the branch's bytes, and every clause must read GREEN on it.
MUTANTS_PLACEHOLDER

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
NEUTRAL_PLACEHOLDER

## 7. FILES ON THIS BRANCH vs `4b00cf5`
`scripts/groundsman.mjs`, `scripts/cortex.mjs`, `scripts/captains_call.mjs`, `scripts/organism_test.mjs`, and `ci/mgat/**`.
Nothing else (`git diff --stat 4b00cf5 HEAD`; witness BOUND). `.claude/settings.json` is not carried.
