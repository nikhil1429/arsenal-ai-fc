# unit mcr2 — the selftests that read their own source are line-end-proof (forks row 1022 (4))

Record of 18 Nov 2026. BASE = main `d0c8c96`, the parent of this branch's first commit (`2c7a714`, the seat key).
The build commit is `2ef8d06`. Every count below is dated 18 Nov 2026 and was read from a file under `ci/mcr2/out/`. Every
step is a row in `ci/mcr2/LEDGER.jsonl`.

## 1. MEASURE (at BASE d0c8c96)

### 1.1 The one grep: every scripts/*.mjs whose code hands its own source to readFileSync

```
git grep -lE 'readFileSync\((fileURLToPath\(import\.meta\.url\)|import\.meta\.filename|__filename|(SELF[A-Z_]*|self|RAILS)\b|new URL\(import\.meta\.url\))' d0c8c96 -- 'scripts/*.mjs'
```

Its output (58 files on 18 Nov 2026, prefixed `d0c8c96:` by git):

```
scripts/archive_audit.mjs scripts/audit.mjs scripts/awayday.mjs scripts/benchmark.mjs scripts/brain.mjs
scripts/capsule_bridge.mjs scripts/captains_call.mjs scripts/capture.mjs scripts/claims.mjs scripts/claudegen.mjs
scripts/conductor.mjs scripts/context.mjs scripts/context_manifest.mjs scripts/cortex.mjs scripts/daily_green.mjs
scripts/deep.mjs scripts/dmn.mjs scripts/dugout.mjs scripts/examiner.mjs scripts/forge_session.mjs scripts/fsrs.mjs
scripts/fuelboard.mjs scripts/gaffer_brain.mjs scripts/gaffer_state.mjs scripts/gate.mjs scripts/gates.mjs
scripts/groundsman.mjs scripts/intent.mjs scripts/learn_digest.mjs scripts/learnstate.mjs scripts/limits.mjs
scripts/mutagen.mjs scripts/nightshift.mjs scripts/notes_compiler.mjs scripts/outbox.mjs scripts/outwork_audit.mjs
scripts/physio.mjs scripts/postmatch.mjs scripts/rejirah.mjs scripts/resume_pointer.mjs scripts/scoreboard.mjs
scripts/scout.mjs scripts/sitting.mjs scripts/speak.mjs scripts/sprintsync.mjs scripts/state.mjs
scripts/study_rail_replay.mjs scripts/teaching_audit.mjs scripts/teaching_bar.mjs scripts/teaching_contract.mjs
scripts/teaching_gate.mjs scripts/thalamus.mjs scripts/throwin.mjs scripts/timeaudit.mjs scripts/tokenizer_play.mjs
scripts/touchline.mjs scripts/turn_hook.mjs scripts/watchman.mjs
```

I found the SELF-style names by a second grep over `const|let|var X = fileURLToPath(import.meta.url)` at BASE. The names were
`SELF` (7), `SELF_SRC` (1), `self` (3) and `RAILS` (1). Without `self|RAILS` the grep lists the same 58 files: those
constants are handed to a spawn, never to readFileSync.

### 1.2 The proof of membership: each listed selftest on an LF copy and a CRLF copy of BASE

**How the copies were made:** the LF copy is `git clone` + `checkout d0c8c96`. The CRLF copy is `git clone --config
core.autocrlf=true` + `checkout d0c8c96`, which is how a Windows checkout writes the tree under this repo's
`.gitattributes` (`* text=auto`, with the four `eol=lf` rules kept LF). Each selftest was run as `node scripts/<f>.mjs
selftest` (claudegen bare). A fake `claude` was first on PATH, and it logged 0 spawns. The trees were run ONE AFTER THE
OTHER: a first run with both trees in parallel collided, because capture's selftest has a fixed temp dir
(`/tmp/arsenal_capture_selftest`), and that run was thrown away. `teaching_bar.mjs` has no selftest mode. Its cases are
exported as barSelfCheck() and run by turn_hook's selftest, which is GREEN on both copies. Full table:
`out/m1_table_exit_lf_crlf.txt`. The red clauses: `out/m1_red_clauses.txt`.

| class (18 Nov 2026) | files |
|---|---|
| GREEN both — not this class (51 files) | every listed file not named below |
| RED both — **not this class**, the same failing clauses on LF and CRLF | `audit` (DoD static: ROOT CANON cites 0 dead paths · 0 stale grep claims, because the clone carries no gitignored state) · `brain` (GEMINI SHIM — a spaced %APPDATA% path is QUOTED before cmd.exe parses it) · `capture` (CONCURRENT READER ×2, because on Linux a held handle does not block a rename) |
| **RED on CRLF only — THIS CLASS** | **`context`**: `S880B THE STAMP MOVES ON A POLL WITH NO WINDOW CHANGE`, `S893 F1 NEVER THE PROCESS TABLE` · **`fuelboard`**: `FUEL VERB is dispatched FIRST` · **`learnstate`**: `L3 · WIRE — learnstate imports only the pointer ledger's READ verbs` |

### 1.3 Why each class member is RED on CRLF (file:line at BASE)

- `scripts/context.mjs:1057` reads `SRC`. `workerArm` is sliced from it at `:1061-1062`. `:1100` then tests it with
  `/\n {6}\}\n(?: {6}\/\/[^\n]*\n)* {6}try \{ stampPoll…/`, and `}\r\n` never matches that → S880B.
- `scripts/context.mjs:1192` reads `SRC`. `:1194` splits it with `/\nfunction lane\(deps = \{\}\) \{\n/`, which `{\r\n` never
  matches. So `laneCode` is `""` and `/readStamp\(\)/` fails → S893 F1. Both are the measurements of ci/b1/PROOF.md (f).
- `scripts/fuelboard.mjs:620` reads `src`. `:622` takes `src.indexOf("// selftest\n")`, which is -1 on CRLF (the line sits at
  `:386`). So `verbSrc` runs to the end of the file, it holds `saveBoard(`, and the assert at `:624` fails → FUEL VERB
  dispatched FIRST.
- `scripts/learnstate.mjs:2014` reads `srcL3`. `:2015` splits it on `"\n"` and strips comments with `/\/\/.*$/`. On CRLF
  the `.` stops at the `\r` and the `$` (no `m` flag) is the end of the string, so NO comment is stripped. The comment at
  `:598` names `toISOString().slice(0, 10)`, and that trips the assert at `:2017` → L3 WIRE.
- All four reads sit inside `selftest()` (context `:692-1244`, fuelboard `:388-642`, learnstate `:1329-2174`), and none
  of them is shared with runtime code. In each file, the other own-source reads are GREEN on CRLF already (context
  `:953`, `:992` · learnstate `:2026`), so this unit leaves them alone.

### 1.4 Outside the grep — measured, not built

These files read their own source by NAME (`readFileSync(join(__dirname, "<self>.mjs"))`), a form the brief's grep does
not list. Seven of them are already on the grep's list. The other two are `daemon_watchdog` and `mcp-memory`, and both are
GREEN on the LF and the CRLF copy (18 Nov 2026). No hidden member.

## 2. BUILD

The fix is the shape of unit mcrlf (02a181c). The own-source read that each failing clause uses gains
`.replace(/\r\n/g, "\n")` where it is read:

```
scripts/context.mjs:1057    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
scripts/context.mjs:1192    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
scripts/fuelboard.mjs:620   const src = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
scripts/learnstate.mjs:2014 const srcL3 = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
```

Four lines changed and none added. No runtime path is touched. None of these files is on the never-edit list.

## 3. WITNESS — `ci/mcr2/witness_mcr2.mjs --org <dir> [--base-org <dir>]` (its header is the contract)

The clauses are C-context, C-fuelboard, C-learnstate, BOUND and LAST. Every run is on a copy under os.tmpdir(), and each
child has its own TMPDIR, so the copy is its only state. TZ is UTC and ANTHROPIC_API_KEY is removed. A fake `claude` and a
`claude.cmd` beside it come first on PATH, and node_modules is linked as a junction. On Windows the process table is read
through Win32_Process, never /proc.

## P1 — the witness both ways (18 Nov 2026; `out/p1_*.txt`)

```
build vs BASE  (exit 0): GREEN MCR2 own-source selftest reads are line-end-proof (3 files) · 5 clause(s)
BASE vs BASE   (exit 1): RED MCR2 · C-context C-fuelboard C-learnstate BOUND
build vs a core.autocrlf=true git clone of BASE (exit 0): GREEN MCR2 own-source selftest reads are line-end-proof (3 files) · 5 clause(s)
```

A first P3 control read `RED MCR2 · BOUND`. The cause was P2's selftests, which had left `spool.db-wal`/`-shm` in the
archive trees. BOUND saw those stray files correctly. P1 and P3 were then re-run on freshly extracted trees, and the
outputs above come from those trees.

## P2 — selftests, BASE and build side by side, by their last lines (18 Nov 2026; LF trees; `out/p2_*.txt`)

```
                     BASE d0c8c96                                    build 2ef8d06
context              ALL CHECKS PASSED (71 checks)                   ALL CHECKS PASSED (71 checks)
fuelboard            ALL CHECKS PASSED (37 checks)                   ALL CHECKS PASSED (37 checks)
learnstate           ALL CHECKS PASSED (149 checks)                  ALL CHECKS PASSED (149 checks)
daily_green          daily_green selftest: 75 passed, 0 failed       daily_green selftest: 75 passed, 0 failed
organism_test laws   organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2 (exit 2)   identical, the same two FAILs
```

On CRLF, the three changed files' counts are the witness's C clauses: 71 / 37 / 149 checks on both copies (18 Nov 2026).
No count fell. The two organism_test laws FAILs (`A9 · every organ the two study skills name…`, `LOAD ZERO BLOCK 2 · THE
COLDNESS RATCHET…`) are the same at BASE and at the build. They are not this unit's reds.

## P3 — mutants (`ci/mcr2/run_mutants.mjs`, 18 Nov 2026; `out/p3_run_mutants.txt`)

```
  ✓ M1 context.mjs:1192 read un-normalised — RED MCR2 · C-context
  ✓ M2 fuelboard.mjs:620 read un-normalised — RED MCR2 · C-fuelboard BOUND
  ✓ M3 learnstate.mjs:2014 read un-normalised — RED MCR2 · C-learnstate BOUND
  ✓ M4 README.md gains a line — RED MCR2 · BOUND
  ✓ M5 a child leaves a node naming the temp root and spawns claude — RED MCR2 · LAST
  ✓ control — GREEN MCR2 own-source selftest reads are line-end-proof (3 files) · 5 clause(s)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

M2 and M3 also red BOUND, because reverting a file's only changed line means that file no longer differs from BASE. A
separate plant that only spawns claude read `✗ LAST — … fake claude spawns 9`.

## P4 — `node scripts/models.mjs check` (18 Nov 2026)

```
BASE  exit 0: models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
build exit 0: models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
```

## P5 — lawpack, gates types, gates lint, BASE and build (18 Nov 2026; LF git clones)

```
lawpack      BASE exit 0 / build exit 0: lawpack: GREEN — no law's finding count rose, and every rule is on disk
gates types  BASE = build, exit 0: 14 organ(s) @ts-check'd · undefined-symbol family 0 · other checkJs diagnostics 296 (baseline 296)
gates lint   BASE = build, exit 0: 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 (frozen at the same)
```

No count rose. The lawpack count lines are identical. Only the order of the sample findings it lists differs.
`ci/mcr2/*.mjs` is outside the tsconfig/eslint scope (`scripts/**`, `hooks/**`), and both files pass `node --check`.

## CI (notes)

```
suite.yml  2c7a714 (seat key, no script change)  run 44285820013  failure
suite.yml  2ef8d06 (this build)                  run 44286766934  failure (npm test, node 22 and node 24, windows-latest)
suite.yml  d0c8c96 (BASE, main)                  run 44279219321  failure
```

The branch's suite reds sit on BASE as well. Here, suite.yml is BASE's, which predates B1's neutral
verdict. `main` has since moved to 76b0626 (B1 + mrdr). That commit touches organism_test, package.json, suite.yml and
ci_verdict, and none of this unit's named files.

## FORKS

- **No never-edit member is in this class.** Of the never-edit files on the grep's list, `postmatch`, `sitting`,
  `gaffer_brain` and `claudegen` are GREEN on both copies. `brain` is RED on both copies (GEMINI SHIM), which is not this
  class. `organism_test`, `ci_verdict` and `package.json` are not on the list. So there is nothing to fork for CRLF.
- **FORK A (not this class, named):** `scripts/capture.mjs` CONCURRENT READER ×2 is red on a Linux root runner, where a
  held handle never blocks a rename. It is an environment class, out of this lend.
- **FORK B (the instrument):** `scripts/capture.mjs` selftest uses a fixed `/tmp/arsenal_capture_selftest`, so two selftest
  runs at once collide. Fix shape: `mkdtempSync(join(tmpdir(), …))`.
- **FORK C (the grep):** the brief's grep does not see by-name self-reads (`join(__dirname, "<self>.mjs")`). They were
  measured in §1.4 and are GREEN today. A standing CRLF sweep should take the wider pattern.
- **The effort receipt:** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository. Its error is named in the
  runner's final message, and nothing is written under `campaign-2026-09/`.

## LANDING ITEMS

`scripts/context.mjs`, `scripts/fuelboard.mjs`, `scripts/learnstate.mjs` (each a one-line change per read, listed in §2;
the blobs at 2ef8d06). The witness is `ci/mcr2/` and stays on this branch. The Windows away-day run after the landing should read
S880B, S893 F1, FUEL VERB and L3 WIRE GREEN.
