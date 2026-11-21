# MPLANT SPEC — unit mplant (mlaw2 fork F1 B as its own unit, with fork F5 C inside it; forks rows 1137 (4) / 1205 (1) / 1231)

Written 21 Nov 2026 by the cloud spec seat (unit mplant). A SPEC, not a build: nothing on main moved, no existing file
edited, no PR, no live model call, no state file read into any output. Branch `claude/mplant-spec`, cut from `origin/main`
**`5301f15`** (`5301f1582f7a1dbc9ec9605434c9db5d8bd19107`, unit mherm's land re-commit; units mlaw, mcov, mcrk and mherm are
on it) by `git fetch origin main && git checkout -b claude/mplant-spec FETCH_HEAD` (ledger row 1). Every number below was
measured 21 Nov 2026 on linux x64, node 22, 4 cores, on LF trees under `os.tmpdir()`; its command stands beside it and its
row is in `ci/mplant/LEDGER.jsonl`. Read first, never re-derived: the mlaw2 census spec, `git show 90b6ba7:ci/mlaw2/MLAW2_SPEC.md`
(measured 20 Nov 2026 at `6a6bdff`), its §3, §4, §8 and §9. Unit mhot is read at `claude/mhot-build f9c7ed4` (not on main).

**THE RULING (row 1231, its MLAW2 cell, the part that is this unit):** *"B is FILED as its own unit, with F5 C inside it (the
sandbox canary aims at a file it plants itself, then every hermetic member spawns from the plant)."* Where the mlaw2 spec and
the ruling differ, the ruling wins; each difference is named in §8.

## 0. HEADLINE

1. **F1 B HOLDS ON THE EMPTY PLANT** (21 Nov 2026, `node ci/mplant/tools/summarize.mjs`): every one of the 61 non-LIVE members
   the hermetic profile spawns at `5301f15` exits 0 on an empty-state plant of `5301f15` (node_modules copied, nothing
   preloaded), none touched the checkout's state dir, and none wrote under the plant's. None of them judges less there than on the tracked tree (the vacuity probe: zero of 61 vacuous, §5.4). The mlaw2 decider for B ("all green on Z", its §8 F1) holds at `5301f15`: 61 of 61 (21 Nov 2026).
2. **The code path is ONE edit of `scripts/organism_test.mjs`, hermetic profile only (§2.2):** P1 `plantedTree()` — the working
   tree's tracked files minus the state dir, the state dir made EMPTY, `git init` + add + one commit, node_modules linked AFTER the
   add, fail-closed; P2 the two spawn sites, the hermetic loop `:2264` and `suites()` `:403-410`, spawn from the plant with
   `cwd` = the plant and their `runKey` carrying it; P3 the usage_tap key `:2269`; P4 the plant env (state-dir env doors removed).
   The full profile, `coverage()`, the asserts and the modes are untouched. After mhot: `:2247`, `:393-398`, `:2252`.
3. **F5 C (question 2) is built as ruled, but its premise is WITHDRAWN by measurement (§3.1):** `sandbox` is GREEN on the empty
   plant at `6a6bdff` and at `5301f15` with nothing preloaded (`sandbox: 15 passed, 0 failed`, 21 Nov 2026). The mlaw2 red came
   from the census's own `statejournal.mjs` preload. The edit is `canary()` `sandbox.mjs:202-217` aiming its two escapes at a decoy
   it plants (a sibling temp dir with the live layout and a planted one-row ledger) instead of ROOT's real state paths
   (`:209-210`), and the selftest's clause `:343-344` judging the decoy. What it buys: a collar hole can no longer land the
   canary's escape in his state dir.
4. **FOUND, NOT ASKED — F-A, a hole in the collar (§3.1, FORK F9):** any `--import` preload that imports `node:fs` as ESM ahead
   of the collar (`sandbox.mjs:146` puts the caller's `NODE_OPTIONS` first) disarms `audit_preload.mjs`'s write guard for every
   `import { writeFileSync } from "node:fs"` in a collared child — a ONE-LINE preload does it (21 Nov 2026: `sandbox: 12 passed, 3 failed`,
   measured), and the canary is what catches it. One line in the collar, `syncBuiltinESMExports()` after its patches, closes it
   (measured in a plant copy: `sandbox: 15 passed, 0 failed` under both preloads). Not this unit's file.
5. **The node_modules door (question 3, §4): LINK, AFTER the plant's `git add`.** mlaw2 §3 (c)'s cause is that `plant.mjs` links
   BEFORE its `git add -A`, so the link is COMMITTED (`120000` in `git ls-files -s`; `.gitignore:26` `node_modules/` matches a
   directory only) and `sandbox.mjs`'s per-path `cpSync` follows it. Linked after the add, `sandbox probe mutagen blackbox` read
   exactly as with a copy (21 Nov 2026, `doors.mjs`).
6. **Seven witness clauses with one mutant each (§6), eleven forks (§8), seven facts named for his laptop (§9).**

## 1. THE TOOLS (new files only, `ci/mplant/`)

| File | What | Provenance |
|---|---|---|
| `plant.mjs`, `plant_inputs.json`, `tools/statejournal.mjs`, `tools/census_selftests.mjs`, `tools/canon_scan.mjs` | the mlaw2 planter, its inputs, its journal, its census and its canon replay | **verbatim copies** of `90b6ba7:ci/mlaw2/…` (blob of `plant.mjs` `b8af93f`, equal on both; the mlaw2 files are never edited) |
| `tools/sets.mjs` | the member sets of a tree, read off its own source: selftest targets, LIVE selftests, suite members, the non-LIVE ones the hermetic profile spawns | new |
| `tools/mask.mjs` | one non-LIVE organ's file name carries a person's name: every tool prints it as `<masked organ a99ba3>` (the mask holds a 16-hex sha256 prefix, never the name) | new |
| `tools/journal2.mjs` | the mlaw2 journal widened to TWO watched dirs (the plant's state dir AND the checkout's), tagged; ops, relative paths, existence, never a byte | new |
| `tools/census_nonlive.mjs` | question 4: every non-LIVE member on four fresh trees (ZL · ZC · ZJ · T, §5.1) | new |
| `tools/doors.mjs` | question 3: one member on three node_modules doors (LB · LA · CP, §4) | new |
| `tools/probes/{one,two,three}.mjs` | the `sandbox.mjs` probes of §3 (one empty plant; an optional `--import` preload; the plant COPY of the collar given one line) | new |
| `tools/summarize.mjs` | derives every census count of §5 from `census/nonlive.jsonl`; nothing typed | new |

## 2. QUESTION 1 — THE CODE PATH: every non-LIVE member spawned from the plant, never from the checkout

### 2.1 Where the hermetic profile spawns a member today (`scripts/organism_test.mjs` at `5301f15`)

- **The member sets** (`node ci/mplant/tools/sets.mjs`, 21 Nov 2026, last line):
  `mplant sets: targets 131 · LIVE selftests 71 · suite members 132 · suite non-LIVE 61 · loop-only non-LIVE 0 · hermetic spawns 61 distinct organs`.
  So on 21 Nov 2026 the hermetic profile spawns 61 distinct organs, all of them suite members (none is a loop-only target).
  The mlaw2 contrast class was 58 at `6a6bdff` (20 Nov 2026); the difference is §5.3.
- **Spawn site S1 · `hermetic()`'s loop**, `organism_test.mjs:2264`:
  `const args = [join(ROOT, "scripts", f), "selftest"]; const r = run(args, { timeout: MEMBER_BOUND_MS }); … hermeticRuns.set(runKey(args), r);`
  — `targets = scripts().filter(hasSelftest)` (`:2256`; `scripts()` `:269` and `hasSelftest` `:315` both read ROOT), a LIVE one
  skipped by `liveSelftest` (`:268`).
- **Spawn site S2 · `suites()`**, `organism_test.mjs:400-410`: `const file = join(ROOT, "scripts", m + ".mjs")` (`:403`), the
  argv (`:405`, `test_coach_v2` bare), the identical-command key (`:408`, `runKey` `:387-389`, whose key carries `opts.cwd || ROOT`),
  and the spawn `run(args, { timeout: MEMBER_BOUND_MS })` (`:410`) when hermetic()'s kept result is not reused.
- **Read site S3 · the usage_tap judge**, `organism_test.mjs:2269`: `hermeticRuns.get(runKey([join(ROOT, "scripts", "usage_tap.mjs"), "selftest"]))`
  — not a spawn, but its key must name the same argv and cwd as S1, or it reads `never ran`.
- **The spawn helper**, `run()`, `organism_test.mjs:75-80`: `spawnSync(NODE, args, { cwd: opts.cwd || ROOT, … })`; with no
  `opts.env` the child inherits `process.env`, whose TMPDIR/TEMP/TMP are this run's `RUN_TMP` (`:48-49`).
- **Why ROOT is the read:** a member resolves its state dir from its own file (`join(HERE, "..", "dressing-room", "state")`, e.g.
  `sandbox.mjs:52` `ROOT = join(HERE, "..")`). Spawned as `ROOT/scripts/<organ>.mjs`, it reads ROOT's state dir — on the neutral
  machine the CI checkout, which holds his tracked state files (`git ls-files` lists 57 paths under the state dir at `5301f15`,
  measured 21 Nov 2026). Spawned as `P/scripts/<organ>.mjs`, it reads P's.

**After mhot** (`claude/mhot-build f9c7ed4`, `/tmp` copy of its `scripts/organism_test.mjs`): S1 is `:2247` (same text), S2 is
`suites()` `:378-399` with `const args = [join(ROOT, "scripts", m + ".mjs"), ...mem.argv]` at `:393` (the argv now from the member
file), S3 is `:2252`, LIVE is read by `roll()`/`liveSelftest` (`:242-250`) from `suite/members/<organ>.json` `live`, and the key
check `keys !== "argv,live,suite"` is `:232`.

### 2.2 The proposed code path (one edit of `scripts/organism_test.mjs`; the hermetic profile only)

- **P1 · `plantedTree()`** — new, beside `lfTree()` (`:2980`). Built ONCE per run, lazily, under `RUN_TMP` (`:48`, removed on
  exit `:50`), only when `PROFILE === "hermetic"`:
  1. `git ls-files -z` in ROOT (the recipe `mhermClauses()` already uses, `:2355-2357`, and `sandbox.mjs buildSandbox` `:69-79`):
     every tracked path EXCEPT those under the state dir, copied byte-for-byte from the WORKING TREE (CRLF on the Windows runner,
     exactly the bytes the members read today — FORK F2).
  2. The state dir made, EMPTY (`mkdirSync(join(P, "dressing-room", "state"), { recursive: true })`): no fixture, none of his
     bytes (the mlaw2 plant's rule, `plant_inputs.json` `state_plant: "EMPTY"`, `fixtures: []`).
  3. `git init -q`, `git add -A`, one commit (`-c user.email=… -c user.name=…`, `--no-verify`) — the measured recipe of
     `ci/mlaw2/plant.mjs:35`; some members list their tree with `git ls-files` (lawpack's NUL scan, `sandbox.mjs:69`).
  4. node_modules LINKED (a junction on win32) **after** step 3 — the door of question 3 (§4): the link is then outside the
     index, so a member that copies its tree by `git ls-files` never meets it.
  5. FAIL CLOSED (FORK F8): if any step fails, the plant is `null`, every non-LIVE member is a named red
     (`SUITE MEMBER · <organ> selftest exits 0` with the tail `the planted tree could not be built: <step>`), and NOTHING is
     spawned from ROOT. A fall-back to ROOT is the forbidden read itself.
- **P2 · S1 and S2 spawn from the plant**: `const P = plantedTree(); const args = [join(P, "scripts", f), "selftest"]; const r = run(args, { cwd: P, env: plantEnv, timeout: MEMBER_BOUND_MS });`
  and `hermeticRuns.set(runKey(args, { cwd: P, env: plantEnv }), r)`; S2 builds `file` from P (`:403`) and its key the same way
  (`:408`), so the one-run reuse of row 880 (1) still pairs the two calls. After mhot: the same edit at `:2247` and `:393`.
- **P3 · S3's key** names the plant's argv and cwd (`:2269`; after mhot `:2252`).
- **P4 · `plantEnv`** = `process.env` minus the state-dir env doors (every `ARSENAL_*STATE_DIR`, `ARSENAL_STATE_DIR`: each names a
  state dir, and the plant's point is that there is none — 13 distinct `process.env.ARSENAL_*STATE_DIR` doors read at `5301f15`, measured 21 Nov 2026 by `grep -ohE "process\.env\.(ARSENAL_[A-Z_]*STATE_DIR)" scripts/*.mjs | sort -u`, e.g. `benchmark.mjs:47`,
  `captains_call.mjs:85`, `intent.mjs:42`, `manager.mjs:976`, `night.mjs:47`), with the home doors under `RUN_TMP` (FORK F6).
  TMPDIR/TEMP/TMP stay `RUN_TMP` (`run()` `:77` sets them whenever `opts.env` is given).
- **What does NOT move:** the full profile (his laptop, the watchman, plain `npm test`) spawns from ROOT exactly as today;
  `coverage()` and `scripts()`/`hasSelftest` still read ROOT's source (a member's EXISTENCE is ROOT's; its RUN is P's); the
  asserts of `integrity`/`laws` and the modes keep their own spawns (FORK F1); `sandbox()` (`:2668`, the suite's mutating-test
  copy) is untouched (mlaw2 F3 A moves the GUT-WORD block's copy, not this unit).
- **Owners:** `organism_test.mjs:26` — `LAWS: READ-ONLY on dressing-room/state`; the plant lives under `RUN_TMP`, so the law holds
  and no state file gains or loses a writer. `scripts/sandbox.mjs:37-38` — `READ-ONLY on the live tree … owns no state file`.
  `scripts/audit_preload.mjs` owns no state file. Every tool of `ci/mplant/` writes only under `os.tmpdir()`.

## 3. QUESTION 2 — F5 C: the sandbox canary aims at a file it plants itself

### 3.1 Measured first: the mlaw2 red of `sandbox` was the census's own instrument (21 Nov 2026)

| Probe (`ci/mplant/tools/probes/`) | Tree | Last line |
|---|---|---|
| `two.mjs 5301f15` (empty plant, node_modules copied, NO preload) | `5301f15`, 21 Nov 2026 | `sandbox: 15 passed, 0 failed` |
| `two.mjs 6a6bdff` (the same, at the mlaw2 base) | `6a6bdff`, 21 Nov 2026 | `sandbox: 15 passed, 0 failed` |
| `two.mjs 5301f15 ci/mplant/tools/statejournal.mjs` (the mlaw2 journal preloaded, as its census ran Z) | `5301f15`, 21 Nov 2026 | `sandbox: 12 passed, 3 failed` |
| `two.mjs 5301f15 <a one-line preload: import "node:fs";>` | `5301f15`, 21 Nov 2026 | `sandbox: 12 passed, 3 failed` |
| `three.mjs 5301f15 <the one-line preload> patch` (the plant COPY of `audit_preload.mjs` + one line, below) | `5301f15`, 21 Nov 2026 | `sandbox: 15 passed, 0 failed` |
| `three.mjs 5301f15 ci/mplant/tools/journal2.mjs patch` | `5301f15`, 21 Nov 2026 | `sandbox: 15 passed, 0 failed` |

The three FAILs under a preload, both times: `NEGATIVE CONTROL · writing LIVE dressing-room/state is DENIED`, `the tripwire
recorded EXACTLY four attempts`, `…and the live state file the canary aimed at was never created`.

- **So mlaw2 §3 (a) is withdrawn by measurement:** `sandbox` is GREEN on the empty plant at `6a6bdff` and at `5301f15` when
  nothing is preloaded. Its red there came from `statejournal.mjs` riding `NODE_OPTIONS`; the "brain_ledger.jsonl absent"
  journal row is real (its money oracle reads ROOT's ledger, `sandbox.mjs:222-224`), the red is not.
- **FOUND, NOT ASKED · F-A, A HOLE IN THE COLLAR.** `audit_preload.mjs:33-40` relies on "patching via createRequire("fs") DOES
  reach destructured ESM named imports". That holds only while nothing has instantiated Node's ESM facade of `node:fs` before
  the collar loads. `sandbox.mjs:146` builds the child's `NODE_OPTIONS` as the CALLER's `NODE_OPTIONS` followed by the collar,
  so any caller preload that imports `node:fs` as ESM freezes the facade first, and every `import { writeFileSync } from "node:fs"`
  in a collared child then skips the guard. The canary is what caught it (the negative control works). The plant copy of
  `audit_preload.mjs` with ONE line, `require_("module").syncBuiltinESMExports();` before `process.on("exit", …)`, went green
  under both preloads (rows above). Not this unit's file: FORK F9.
- **What F5 C still buys** (the ruling stands; its premise "red on the empty plant" does not reproduce): today the canary's two
  escape targets are ROOT's REAL state paths (`sandbox.mjs:209-210`: `CANARY_MUST_NEVER_EXIST.json` and `brain_ledger.jsonl`
  under ROOT's state dir), and the selftest's last canary clause checks ROOT's state dir (`:343-344`). So the day the collar
  has a hole — the F-A preload is one — the canary's escape lands IN HIS STATE DIR on his laptop (a one-line file and a `{}`
  row appended to his brain ledger), and on the neutral machine in the checkout's tracked state. Aimed at a file it plants
  itself, the same escape lands in a decoy, and the selftest reads no path of the state dir at all for the canary.

### 3.2 The exact edit (owner: `scripts/sandbox.mjs` itself — a measurement organ of `audit:selftest`, `package.json:21`; it owns no state file, `:37-38`)

- **`canary(sb)` (`sandbox.mjs:202-217`)** plants the decoy before the child runs, in the PARENT (uncollared) process:
  `const decoy = mkdtempSync(join(tmpdir(), "arsenal-canary-"))`, then `mkdirSync(join(decoy, "dressing-room", "state"), { recursive: true })`
  and `writeFileSync(join(decoy, "dressing-room", "state", "brain_ledger.jsonl"), "{\"planted\":\"canary\"}\n")` (a planted
  one-row ledger, so the append target EXISTS as the live one does). The two env lines `:209-210` become
  `CANARY_LIVE_STATE: join(decoy, "dressing-room", "state", "CANARY_MUST_NEVER_EXIST.json")` and
  `CANARY_LIVE_LEDGER: join(decoy, "dressing-room", "state", "brain_ledger.jsonl")`. It returns `{ results, rows, out, code, decoy }`
  plus the decoy ledger's bytes after the run. The decoy mirrors the live layout so the collar cannot special-case it; the collar's
  rule is path-agnostic beyond the sandbox root (`audit_preload.mjs:121-134`: `under(p, SANDBOX)` or its own files, else denied),
  so a denial of the decoy is the same measurement as a denial of the live path. The decoy is a SIBLING of `sb.root` under the
  parent's temp dir, outside `SANDBOX` (`under()` `:83-87` compares with a trailing `/`, so a shared name prefix never matches).
- **`selftest()` `:343-344`** becomes: `…and the file the canary aimed at was never created, and the planted ledger is byte-equal`
  over `c.decoy`, and the decoy is removed in the `finally` beside `destroy(sb)` (`:359`). The canary mode (`:399`) removes it too.
- **Unchanged:** the four NEGATIVE CONTROL clauses (`:337-342`), the tripwire count, the grandchild clause, and the money oracle
  (`ledgerFingerprint()` `:222-230` still reads ROOT's ledger: its subject is "did the audit spend", which is ROOT's).
- **Who reads the canary's old targets** (`grep -rln CANARY_MUST_NEVER_EXIST`, 21 Nov 2026): `scripts/sandbox.mjs`,
  `scripts/organism_test.mjs:2374-2378` (mherm W1 in the suite: `!existsSync(canary) && !existsSync(ledger)` in its tree),
  `ci/mherm/witness_mherm.mjs:132-144` and `ci/mherm/PROOF.md`. After the edit those two `existsSync` checks still pass, now
  vacuously (the canary no longer aims there); their meaning moves to `w1.code === 0`, which includes sandbox's own decoy clause.
  FORK F10.

## 4. QUESTION 3 — the node_modules door (mlaw2 §3 (c))

- **The cause, measured** (21 Nov 2026): `git -C <plant> ls-files -s node_modules` on a `plant.mjs` tree prints
  `120000 … 0	node_modules` — the planter links node_modules (`plant.mjs:32-33`) BEFORE its `git add -A` (`:35`), and `.gitignore:26`
  `node_modules/` matches a DIRECTORY, which a symlink is not to git. So the LINK IS COMMITTED, `git ls-files` lists it, and a
  member that copies its tree path by path with a non-recursive `cpSync` (`sandbox.mjs:71-77`, `cpSync(src, dst)` at `:77`) follows it into a directory:
  `Error: Recursive option not enabled, cannot copy a directory: <plant>/node_modules/`. Linking is not the defect; committing
  the link is.
- **The doors, one member at a time** (`node ci/mplant/tools/doors.mjs 5301f15 sandbox probe mutagen blackbox`, 21 Nov 2026;
  `ci/mplant/census/doors.jsonl`; last line `mplant doors 5301f15: 4 member(s) · LB link-before-commit · LA link-after-commit · CP copied · bound read off organism_test.mjs`):

| member | LB (link before commit: committed) | LA (link after commit: not in the index) | CP (copied) |
|---|---|---|---|
| sandbox | 1 · `Error: Recursive option not enabled, cannot copy a directory` | 0 | 0 |
| probe | 0 | 0 | 0 |
| mutagen | 0 | 0 | 0 |
| blackbox (LIVE) | 1 · the same error | 1 · its fixture red (mlaw2: NEEDS-FIXTURE) | 1 · the same fixture red |

- **The profile's door: LA, link AFTER the plant's `git add`** — the order `organism_test.mjs mhermClauses()` already uses
  (`:2361` init and add, `:2362` link). Why: it equals CP on every member measured, it copies nothing (CP copies the whole of
  node_modules once per run), and it keeps the plant's `git ls-files` equal to ROOT's minus the state dir. The census of §5
  measures LA's sibling on all members: ZL is LB (plant.mjs as is), ZC is CP. FORK F4.
- `sandbox()` (`:2668-2673`) copies ROOT's `node_modules` with `cpSync(…, { recursive: true })`; under P2 it is never handed the
  plant, so it is unaffected. ms1's witness trees (`:3037`) link after their own checkout and are untouched.

## 5. QUESTION 4 — the non-LIVE members on the empty plant at `5301f15`

### 5.1 Recipe (`ci/mplant/tools/census_nonlive.mjs`, every member on FOUR fresh trees of `5301f15`, pool 2)

- **ZL** — the empty plant, node_modules linked BEFORE the plant's commit (`plant.mjs` as is: the LB door of §4), no preload.
- **ZC** — the empty plant, node_modules COPIED, no preload. **The verdict of question 4.**
- **ZJ** — ZC under `journal2.mjs`, watching the plant's state dir AND the checkout's: the READS, never the verdict (§3.1: a
  preload that imports `node:fs` as ESM disarms the collar, so a member that asserts its collar reds under any journal).
- **T** — the same sha with its tracked state, no preload: the exit only, never a line (his bytes).
- Each member by the suite's own command (`plant.mjs memberCmd`), the env `plantEnv` (home doors under a temp dir, the refusing
  `claude`/`gemini` shims first on PATH, every port door OS-picked, `ORGANISM_TEST_PROFILE=hermetic`), the wait the tree's own
  member bound. The members are `sets.mjs`'s `hermeticSpawned`: every organ the hermetic profile spawns today.
- **The journal is itself tested** (21 Nov 2026, ledger): a `node -e` that probes one path of the checkout's state dir under
  `journal2.mjs` (watch = checkout) journals `1 checkout r:existsSync`. So "zero rows tag checkout" below is a measurement.

### 5.2 The census (`node ci/mplant/tools/summarize.mjs`, 21 Nov 2026, last line; generated from `ci/mplant/census/nonlive.jsonl`)

```
mplant census: 61 non-LIVE members · ZC (empty plant, modules copied, no preload) green 61 · ZL (linked before commit) green 60 · ZJ (journaled) green 60 · T green 61 · killed 0 · ZC red [] · ZL red [sandbox] · ZJ red [sandbox] · T red [] · touch the checkout's state dir from the plant 0 · write under the plant's state dir 0 [] · read an absent plant state path 13
```

- **All 61 non-LIVE members are green on the empty plant** (ZC, 21 Nov 2026). The one red on ZL is `sandbox` (the LB door, §4);
  the one red on ZJ is `sandbox` (the journal, §3.1). None was killed by the bound.
- **No member spawned from the plant touched the checkout's state dir** (zero `checkout` rows across every ZJ run, 21 Nov 2026)
  — the measurement F1 B's "each hermetic member proves it reads no state" asks for. A member's own `ROOT` is its file's
  parent, so the plant is the only state dir it reaches.
- **No member wrote under the plant's state dir** (zero `w:` rows tag `plant`, 21 Nov 2026) — so a member can never be the next
  member's fixture, and ONE plant per run is safe (FORK F3 A).
- **13 members read a state path the plant lacks** (21 Nov 2026; `course fsrs gaffer_state hippocampus mutagen rung_receipt sandbox
  session_meter shipped study_rail_replay swallow teaching_contract treasury`) and are still green: spawned from ROOT on the
  neutral machine, each of them reads the checkout's state dir today — W1's base RED (§6). Whether any of the 13 judges LESS on the
  plant than on the tracked tree is §5.4.

### 5.3 Every difference from the mlaw2 contrast census (`90b6ba7:ci/mlaw2/census/nonlive.jsonl`, 20 Nov 2026 at `6a6bdff`)

`node ci/mplant/tools/summarize.mjs --mlaw2 <that file>` (21 Nov 2026, its first line):

```
vs mlaw2: added 4 (<masked organ a99ba3> parked senses witness_cause) · gone 1 (<masked: its file name carries a person name>) · verdict moved on the empty plant 1 (sandbox: mlaw2 Z 1 → ZC 0)
```

| # | mlaw2 (20 Nov 2026, `6a6bdff`) | mplant (21 Nov 2026, `5301f15`) | Why |
|---|---|---|---|
| E1 | 58 members | 61 | three organs joined the suites between the two cuts and are not LIVE: `parked`, `senses`, `witness_cause` (the "added 4 / gone 1" above is ONE organ counted twice: mlaw2 masked its row by hand and this census masks it by hash, so the two masks differ; it is in both) |
| E2 | `sandbox` red on Z (`the live state file the canary aimed at was never created`) | green on ZC; red on ZJ only | mlaw2's Z ran under its statejournal preload; that preload is what reds it (§3.1, measured at both shas) |
| E3 | `sandbox` red on the linked plant (`Recursive option not enabled`) | the same on ZL | unchanged: the LB door commits the link (§4) |
| E4 | journal on the plant's state dir only | `journal2.mjs`: the plant's AND the checkout's | F1 B asks for "reads no state", which is a claim about the checkout's dir; measured zero |
| E5 | modules copied for two members only (`--copy-modules`) | ZC copies for every member; ZL links for every member | so each member's verdict is read on both doors |

### 5.4 Vacuity on the plant (the 61, `ci/mplant/tools/vacuity.mjs` — a verbatim copy of the mlaw2 probe — 21 Nov 2026)

The probe (rules in its header) runs each member on a fresh Z (empty plant) and a fresh T (tracked state) and compares the
folded output lines, COUNTS only off T. Its plants use `plant.mjs`'s default LB door, so `sandbox` reds on both of its trees
(§4) and is judged by ZC above. Rows: `ci/mplant/census/vacuity.jsonl` (organ names through `mask.mjs`).

- **Vacuous: zero of 61, swallowed: zero of 61** (21 Nov 2026). Every member prints exactly as many NOT-MEASURED lines on Z as
  on T (30 members print at least one, equal on both sides, 21 Nov 2026), and one prints a zero-subject line, equal on both
  (`benchmark`, 1/1).
- **One member prints one line differently:** `awayday` — on Z `awayday: checkout exposure: no tracked file under dressing-room/
  matches the personal lane.`; on T its sibling naming the tracked files (never printed here). That line is a REPORT, not a
  clause: `exposure()` (`awayday.mjs:102-108`) "REPORTS and never refuses", and its selftest clauses judge it on fixtures
  (`:872-878`, `:1122`). So it is not vacuity; it is the plant showing the very difference it exists to make.
- So under F1 B no hermetic member judges less than it does on the checkout today (measured on linux; N1 names Windows).

## 6. WITNESS CLAUSES AND MUTANTS (for the build: each plant RED on base `5301f15`, GREEN on the build)

The build seat writes `ci/mplant/witness_mplant.mjs` (its BASE `ci/mplant/BASE` = the build's merge base) and
`ci/mplant/run_mutants_mplant.mjs`. Every clause runs on LF trees under `os.tmpdir()` (an LF `git archive` of BASE and of HEAD,
`ci/mplant/plant.mjs`'s recipe), node_modules linked AFTER each tree's commit (§4), every port door OS-picked, every wait the
tree's own member bound. **The trimmed roll (FORK F11 B):** each tree's suite roll is cut, in the TEMP tree only, to TWO members
— `validators` (reads no state: `plant absent_reads []` in §5) and one member whose ZJ row reads the state dir (the fastest such
row of `census/nonlive.jsonl`, named by the build seat from the file, never typed). On base that is the `organism:selftest`
chain string of `package.json`; after mhot it is two `suite/members/*.json` files. Each tree's state dir carries ONE planted
file, `planted_by_witness.json` (`{"planted":"mplant witness"}`, written by node, never a shell) — the stand-in for "his
tracked state on the checkout".

| Clause | What the witness runs | Base `5301f15` | Build |
|---|---|---|---|
| **W1 SPAWNED-IN-PLANT** | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs suites` in the tree, under `journal2.mjs` watching the TREE's state dir (tag `checkout`); rows whose `organ` is not `organism_test.mjs` | **RED**: the state-reading member touches the tree's state dir (≥ 1 row tag `checkout`) | **GREEN**: zero rows tag `checkout` from any member, and ≥ 2 member processes journaled at all (so the clause cannot pass on no run) |
| **W2 NO-HIS-BYTES** | the same run: the suite's own line `ok   MPLANT · the planted tree's state dir holds zero files before the first member` (a new assert of P1), and every `journal2` row tag `plant` | **RED**: no such line (no plant exists on base) | **GREEN**: the line is `ok`, and no row tag `plant` names `planted_by_witness.json` (the tree's planted file never entered the plant) |
| **W3 FAIL-CLOSED** | the same run with `git` taken off PATH (a PATH of only the node binary's dir and the refusing shims) | **RED**: members spawn from ROOT and the run judges them (no plant exists to fail) | **GREEN**: every non-LIVE member is a named red with the tail `the planted tree could not be built`, and zero member processes journaled (none spawned from ROOT) |
| **W4 DOOR** | `git -C <the build's plant> ls-files node_modules` (the suite prints the plant's path into its `MPLANT ·` line; the witness reads it under the temp dir) and `sandbox` as one roll member | **RED**: no plant (the clause demands a plant); with `plant.mjs`'s LB door instead, `sandbox` reds `Recursive option not enabled` (§4) | **GREEN**: `ls-files node_modules` is empty and `sandbox` exits 0 from the plant |
| **W5 FULL-UNCHANGED** | the full profile (`ORGANISM_TEST_PROFILE` unset) `suites` on the trimmed tree under `journal2` | GREEN (the full profile spawns from ROOT: rows tag `checkout` ≥ 1) | **GREEN, the same**: rows tag `checkout` ≥ 1 — the plant is the hermetic profile's only. A guard clause, green on both; its mutant is what bites |
| **W6 CANARY-AIMS-AT-ITS-PLANT** (F5 C) | the tree's `scripts/sandbox.mjs selftest`, from the tree, with the F-A hole OPENED on purpose: `NODE_OPTIONS=--import=<a one-line preload: import "node:fs";>` (§3.1) | **RED**: the escape lands in the TREE's state dir — it holds a file beyond `planted_by_witness.json` afterwards (`CANARY_MUST_NEVER_EXIST.json`: the selftest's own FAIL `…and the live state file the canary aimed at was never created` names it, §3.1) | **GREEN**: the tree's state dir holds exactly `planted_by_witness.json` afterwards (the escape, if the hole is still open, landed in the decoy); `sandbox` itself is allowed to red here — its canary catching the hole is the negative control working |
| **W7 CANARY-STILL-BITES** (F5 C) | the same selftest, no preload | GREEN (`sandbox: 15 passed, 0 failed`, 21 Nov 2026, §3.1) | **GREEN**: exit 0, the four NEGATIVE CONTROL lines `ok`, and the decoy removed afterwards (no `arsenal-canary-*` dir left under the child's temp dir) |
| **BOUND** | every clause | each run's own member bound | a kill is `BOUND` in the witness grammar (`organism_test.mjs` `boundIds`, `:2965`), never a verdict |

W5 and W7 are green on base by design (they guard what must NOT change); the rule "each plant RED on base" is met by W1-W4
and W6, and W5/W7 are judged by their mutants alone. Named so it is not mistaken for a gap.

**MUTANTS (one per clause; each must turn its clause RED on the build; `run_mutants_mplant.mjs` applies each to a copy of the
build tree, never to ROOT):**

| Clause | Mutant |
|---|---|
| W1 | S1 spawns with `cwd: ROOT` and `join(ROOT, "scripts", f)` again (P2 reverted at the loop only) |
| W2 | P1 copies the state dir too (the `git ls-files` filter for the state dir dropped) |
| W3 | P1's failure falls back to ROOT (`plantedTree() || ROOT`) |
| W4 | P1 links node_modules BEFORE its `git add -A` |
| W5 | the full profile routed through `plantedTree()` as well (`PROFILE === "hermetic"` guard removed) |
| W6 | `canary()`'s two env lines put back to `join(ROOT, "dressing-room", "state", …)` |
| W7 | the decoy's ledger left unplanted AND the decoy dir not removed (two edits, one mutant: the decoy's lifecycle) |

## 7. THE PORT CLASS (row 1053)

No tool here binds a port: every `ARSENAL_*PORT` door a planted tree's own scripts read gets `freePort()` (listen 0 on
127.0.0.1, read, close; `plant.mjs`). No live service is named or reached, nothing POSTs at a daemon, nothing restarts. Every
member wait is the tree's own `HEAVY_BOUND_MS` (`organism_test.mjs:66`), read off the tree, never typed. The proposed P1-P4 add
no port: a member spawned from the plant gets the same port doors it gets from ROOT today. The witness of §6 binds none, spawns
`organism_test.mjs suites` on temp trees only, and hands every port door an OS-picked port through `plantEnv`. `ci/mplant/`
carries no `witness_mplant.mjs`, so the neutral machine's `witnesses` member (`organism_test.mjs:3001`) runs none of these tools.

## 8. FORKS (each the architect's to rule)

Each fork: options lettered, the recommendation, and the measurement that decides it. Where this unit's ruling (row 1231)
differs from the mlaw2 spec's text, the difference is named first.

**Differences from the mlaw2 spec, named (the ruling wins):**
- D1 · mlaw2 §8 F1 said "B as its own unit" and its §3 (a) said `sandbox` reds on the empty plant and "has been judging over
  his tracked bytes". Measured here (§3.1): the red was the census journal; `sandbox` is green on the empty plant at `6a6bdff`
  and `5301f15` with nothing preloaded. F5 C is built as ruled; its motivating red is withdrawn, and what it buys is §3.1's last item.
- D2 · mlaw2 §8 F1's decider was "B holds iff all 58 are green on Z". The class is 61 at `5301f15` (21 Nov 2026), and the census
  verdict of §5 is taken on ZC (no preload), not on a journaled Z.
- D3 · mlaw2 §4.3 P1 built the plant from "an LF `git ls-files` copy of ROOT's own HEAD (ms1's `lfTree`)". This spec builds it
  from the WORKING TREE's tracked bytes (FORK F2) and links node_modules after the add instead of copying it (FORK F4,
  measured LA = CP).

**F1 · the scope of "every non-LIVE member".** (A) the selftest members only: spawn sites S1 and S2 (and S3's key) · (B) also
every organ spawn of the non-LIVE asserts inside `integrity`/`laws` and the hermetic-run modes (`lawpack`, `done`, `clauses`).
**Recommend A**: the asserts are mlaw2's (F3 A, the five) and mfix's (the rest), and a mode's organ spawn is that mode's own
subject. Decides: nothing more to measure; A is the ruling's word "member".

**F2 · the plant's bytes.** (A) the working tree's tracked files (`git ls-files`, bytes as on disk: CRLF on the Windows runner,
exactly what the members read today) · (B) an LF tree of HEAD (`lfTree`, `:2980-2985`). **Recommend A**: the plant then differs
from what a member reads today by the state dir ALONE, so any red the build brings is a state read by construction; B also
moves line endings and drops uncommitted edits on his laptop. Decides: N2 (the census on the Windows runner's CRLF bytes).

**F3 · one plant per run, or one per member.** (A) ONE plant per run, shared by every member (the plant built once, ~1.3 s on
linux, `plant.mjs` timed 21 Nov 2026) · (B) a fresh plant per member (the mlaw2 census's way). **Recommend A, iff** no member
writes under the plant's state dir — then no member can become the next one's fixture. Decides: §5's ZJ `writes` column
(`summarize.mjs`: "write under the plant's state dir"). **Measured: zero writers of 61** (21 Nov 2026), so A holds.

**F4 · the node_modules door (question 3).** (A) LINK after the plant's `git add` (LA) · (B) COPY (CP) · (C) link before (LB,
`plant.mjs` as is). **Recommend A**: LA = CP on all four tree-copying members (§4), it copies nothing, and the plant's index
equals ROOT's minus the state dir. C is forbidden by measurement (`sandbox` reds). Decides: N3 (a junction on win32 under `git add`).

**F5 · the plant's git history.** (A) one commit (the measured recipe: `plant.mjs:35`, every census row of §5 ran on it) ·
(B) `git init` + `git add` only, no commit (`sandbox.mjs:84-85`'s way). **Recommend A**: it is what was measured. Decides: the
census again on B, if B is wanted (no member was measured without a HEAD).

**F6 · the plant's env.** (A) `process.env` as today (the suite's TMP doors only) · (B) also the state-dir env doors removed
and the home doors under `RUN_TMP` (`plant.mjs plantEnv` minus nothing else). **Recommend B**, the stricter gate: a state-dir door
names a state dir; and §5's census ran every member under B (`plantEnv`), so B is the measured env. Decides: N2 on Windows.

**F7 · the order against the mlaw2 build (row 1205 (1): its build half stays behind mhot).** (A) mlaw2's build first (F1 A, the
`"plant": "empty"` key, P1 and P2 for the 18 moved members), then this build generalises P2 and retires the key · (B) this build
first, right after mhot; mlaw2's build then reduces to `"live": null` in its 18 member files (and its F3 A assert moves), with no
fourth key. **Recommend B if the architect re-rules the order; row 1231 says "F1 A now", so A stands until then.** Under A the
same lines are edited twice (§10). Decides: nothing measurable; it is churn against the ruling's order.

**F8 · a plant that cannot be built.** (A) fail closed: every non-LIVE member a named red, none spawned from ROOT · (B) fall back
to ROOT with a printed warning. **Recommend A** (B is the forbidden read). Decides: W3.

**F9 · F-A, the collar hole (§3.1, found).** (A) its own unit: `audit_preload.mjs` gains `require_("module").syncBuiltinESMExports();`
after its patches (measured green under both preloads in a plant copy), with a witness that preloads `import "node:fs";` · (B)
inside this unit · (C) named only. **Recommend A**: it is a file beyond this unit's, and a collar change wants its own neutral
verdict. Decides: `probes/three.mjs` on Windows (N1).

**F10 · mherm W1's canary checks after F5 C** (`organism_test.mjs:2374-2378`, `ci/mherm/witness_mherm.mjs:132-144`). (A) leave
them: still green, their meaning carried by `w1.code === 0`, which now includes sandbox's own decoy clause · (B) the build
re-aims them at the decoy (needs `canary()` to print its decoy path) · (C) remove them. **Recommend A**: a landed unit's witness
is never edited by another unit; B can ride a later mherm pass. Decides: nothing more to measure.

**F11 · the witness's weight.** (A) the whole `suites` roll per tree (every non-LIVE member, twice per clause) · (B) a trimmed
roll of two members in the temp trees (§6). **Recommend B**: each clause needs one state-reading and one non-reading member;
the whole roll is already the suite's own run on the neutral machine. Decides: the witness's wall time on the runner (N5).

## 9. NAMED NOT GUESSED (what the cloud cannot reach; what measures it on his laptop)

- **N1 · Windows, the neutral machine's OS** (`.github/workflows/suite.yml:61` `runs-on: windows-latest`; this spec is linux).
  The census (§5), the doors (§4) and the sandbox probes (§3.1) were all run here. Measured by, on his laptop, one at a time when
  free memory allows: `node ci/mplant/tools/census_nonlive.mjs <sha>` · `node ci/mplant/tools/doors.mjs <sha> sandbox probe mutagen blackbox`
  · `node ci/mplant/tools/probes/two.mjs <sha> <a one-line import "node:fs" preload>` and `three.mjs … patch`. Counts only.
- **N2 · the CRLF bytes** — the Windows runner checks out CRLF (`suite.yml:30`); F2 A plants those bytes. Every census tree
  here is LF. Measured by the build's own neutral run (the W1 leg on `windows-latest`).
- **N3 · a junction under `git add -A` on win32** — `plant.mjs` makes a junction on win32 (`:33`); whether git for Windows
  records a junction as a 120000 link (as linux records the symlink) or walks it as a directory (then `.gitignore:26` hides it,
  and LB would not red there) is not measured. Measured by: `node ci/mplant/tools/doors.mjs <sha> sandbox` on his laptop (its
  `tracked` field per door).
- **N4 · node 24** — the CI legs are node 22 and node 24 (`suite.yml:66` matrix); this box is node 22. The F-A hole rides
  Node's ESM facade for builtins, which is version-dependent. Measured by: `probes/two.mjs` under node 24 on his laptop, or by
  the node 24 leg of the F9 unit's witness.
- **N5 · the witness's wall time on the runner** (F11) and the plant's build time on Windows (a per-file copy of the tracked
  tree; ~1.3 s here, 21 Nov 2026) — measured by the build's first neutral run.
- **N6 · members whose verdict moves under CI load** — the census ran at pool 2 on 4 cores; none was killed (§5). Measured by
  the build's neutral run.
- **N7 · mhot's final line numbers** — §2 and §10 name mhot's shape at `claude/mhot-build f9c7ed4`; mhot has not landed, and
  its land re-merge can move them. Measured by the build seat, at its own cut, by the same greps (`ledger` rows name them).

## 10. FILES A BUILD WOULD TOUCH, AND WHERE IT MEETS THE mlaw2 BUILD

**The build would touch, and only these:**

| File | What changes | Owner, by its header |
|---|---|---|
| `scripts/organism_test.mjs` | P1 `plantedTree()` (new, beside `lfTree()` `:2980`), its one assert (W2's `ok` line); P2 at S1 `:2264` and S2 `:403-410`; P3 at S3 `:2269`; P4 the plant env (new const beside `run()` `:75`) | the suite: `LAWS: READ-ONLY on dressing-room/state` (`:26`), owns no state file |
| `scripts/sandbox.mjs` | F5 C: `canary()` `:202-217` (the decoy, `:209-210` re-aimed), `selftest()` `:343-344` (the decoy clause) and `:359` (the decoy removed), canary mode `:399` (removed there too) | the measurement organ itself (`:37-38`: owns no state file) |
| `ci/mplant/witness_mplant.mjs`, `ci/mplant/BASE`, `ci/mplant/run_mutants_mplant.mjs` | new: §6 | the build seat's |

**Beyond them, only as forks:** `scripts/audit_preload.mjs` (F9 A: its own unit) · `organism_test.mjs:2374-2378` and
`ci/mherm/witness_mherm.mjs:132-144` (F10 B) · mhot's `suiteRoll` key check (`:232` on `claude/mhot-build`, F7 A: the
`plant` key retired). **Not touched by any option:** `package.json`, `.github/workflows/suite.yml`, any state file, any other
organ, any `suite/members/*.json` (under F1 B as ruled a member's file says nothing about the plant: every non-LIVE member rides it).

**Where this unit and the mlaw2 BUILD (F1 A, behind mhot) touch the same code** — mhot's shape, `claude/mhot-build f9c7ed4`
(main's line in brackets):
- `scripts/organism_test.mjs` **P1** — both builds need the same `plantedTree()`. Under F7 A mlaw2 writes it and this build
  only re-points its callers; under F7 B this build writes it and mlaw2 calls it.
- **S1, the hermetic loop** `:2247` (main `:2264`) — mlaw2 spawns its 18 moved members from P when their file says
  `"plant": "empty"`; this build spawns every non-LIVE member from P. The same line, edited by both.
- **S2, `suites()`** `:393` args and its `runKey` / `run` lines `:396-398` (main `:403-410`) — the same.
- **S3, the usage_tap key** `:2252` (main `:2269`) — the same.
- **`suiteRoll`'s key check** `:232` — mlaw2 F1 A admits a fourth key `plant`; under this unit the key carries nothing (F7).
- **`liveSelftest`** `:245-250` (main `:268`) — read by both, edited by neither.
- **the trip metric** `:2242` (main `:2259`, mlaw2 F2 A: it hashes the plant) — mlaw2's, not this build's; under F3 A the one
  shared plant is exactly what F2 A's trip metric hashes, so the two compose.
- **`sandbox()`** `:2603` (main `:2668`, mlaw2 F3 A: the GUT-WORD block's copy from the plant) — mlaw2's, not this build's.
- `scripts/sandbox.mjs` — mlaw2's build does not touch it (its §10 names it only as F5 C, which is this unit).

## 11. THE NEUTRAL MACHINE ON THIS BRANCH

Read with no token: `R=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##'); curl -s https://api.github.com/repos/$R/commits/<sha>/check-runs` (the slug is derived, not typed).

| Push | Run | Legs | Verdict |
|---|---|---|---|
@@ROWS@@

The run of the push that carries this table is named in the seat's FINAL MESSAGE (a spec cannot name the run of its own commit).
