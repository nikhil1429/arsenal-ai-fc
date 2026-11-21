# MBARE PROOF — unit mbare (mlaw2 fork F7 B, forks row 1231), cloud census seat

Written 21 Nov 2026 by the cloud census seat. Branch `claude/mbare-build`, cut from `origin/main` **`5301f1582f7a1dbc9ec9605434c9db5d8bd19107`**
(`ci/mbare/BASE`; main measured at the cut: `git rev-parse origin/main` = 5301f15, units mlaw, mcov, mcrk and mherm on it) by
`git fetch origin main && git checkout -b claude/mbare-build origin/main` (a multi-branch fetch had overwritten FETCH_HEAD; origin/main
was read instead and equals 5301f15, ledger row 1). Nothing landed, nothing merged into main, no PR, no live model call, no fixture
written, no byte of his state read into any output: every tree that carries his tracked state (T) gives up only exit codes, counts and
16-hex hashes. Every number below was measured 21 Nov 2026 on linux x64, node 22, on LF trees under `os.tmpdir()`; its command stands
beside it and its row is in `ci/mbare/LEDGER.jsonl`.

## 0. HEADLINE (21 Nov 2026)

1. **THE GUARD** (`scripts/organism_test.mjs:61-101` at the build): `bareGuard(block, names, body)` runs ONE `laws()` block. A throw whose
   cause is a state input that is ABSENT — an ENOENT under a `dressing-room/state` dir (the throw itself proves the absence), or a throw
   that NAMES a state file ROOT's state dir does not hold (registry.mjs's `no live mechanisms row "<m>" in …/registry.json`, gate.mjs's
   `seed registry.json`) — prints each not-yet-judged assert of the block as `BLOCKED <assert> — not judged: its input <x> is absent
   from the state dir`, files ONE red `BLOCKED BY ITS INPUT · <block> — the state input <x> is absent, so the block is not judged (a
   blocked block is never a pass)` naming the read site (`read at registry.mjs:134 ← …`), and the mode goes on to the next block. Any
   other throw, and any throw while the input exists, is re-thrown untouched. `liveBlock(block, names, body)` = `skipLive` + `bareGuard`
   in one door (a LIVE block is still skipped whole in the hermetic profile, exactly as before).
2. **FIVE blocks guarded**, each found by its OWN throw on the empty plant (the find-throw → wrap loop, ledger rows 7-9), base line → build line:
   A9 (the A9 block registry read, row `study_deny_list`) `:924 → :965` · ONE SCHEDULE W0-B (`game_on_epoch`, via rejirah.mjs:353)
   `:1231 → :1272` · THE WITNESS SURVIVES THE SEAM W0-C (`gate.mjs:146`, the lanes table) `:1430 → :1471` · LOAD ZERO BLOCK 6
   `:1515 → :1556` · LOAD ZERO, AFTER BLOCK 6 `:1627 → :1668`. After the fifth, the laws mode throws nowhere on the empty plant.
3. **On the empty plant** (`node ci/mbare/tools/recensus.mjs 5301f15 a3cadcf`, 21 Nov 2026): laws at the base reads 13 assert lines and
   THROWS (`MODE laws · ran to its end`, organism_test.mjs:933, registry row `study_deny_list`); at the build it reads 98 assert lines,
   5 guard reds, 6 BLOCKED assert lines, and runs to its end — identical on two fresh plants.
4. **On the tracked-state tree (the inputs present), every assert line is identical at base and build**: laws, FULL profile, T(5301f15)
   and T(build) each 116 assert lines, 0 BLOCKED, one hash (`h c3f29abb4e22bb62` scratch run, ledger row 6; `h 22dcbfcf6e31f817` in the
   witness's own count, which also hashes the BLOCKED lines it looks for — 0 of them on either tree).
5. **THE RE-CENSUS** (`node ci/mbare/tools/recensus.mjs 5301f15 a3cadcf`, 21 Nov 2026, last line):
   `mbare re-census: 33 BLOCKED asserts at base · RIDES 15 · NEEDS-FIXTURE 13 · VACUOUS 4 · NOT-DECIDABLE 1`.
   **33, not 32 (the difference, named):** mlaw2 counted `:194` at `6a6bdff` (= `:203` LIVE_ASSERTS line here, the COLDNESS RATCHET)
   as RED-BOTH, outside its BLOCKED 32; this census takes every LIVE laws assert unreached on Z(base) behind the throw, so it is in the
   set and classed NOT-DECIDABLE (red on T too). The other 32 are mlaw2's `:185-:193`, `:195-:217` exactly (LIVE_ASSERTS lines
   `:194-:202`, `:204-:226` at 5301f15: the table moved by 9 lines, mherm's).
6. **Unit mfix takes only the 13 NEEDS-FIXTURE** (§3): every one needs `registry.json` — its mechanisms row `task_kinds` (`:196 :197`,
   read at registry.mjs:134 ← :148 ← :150 through tasks.mjs), a mechanisms row whose NAME samjhao's own message cuts off (`:194 :202
   :204 :206`, read at registry.mjs:134 through the task layer), the row `game_on_epoch` (`:200 :208` through deep.mjs, `:217 :218`
   BLOCKED by the guard through rejirah.mjs:353), or the lanes table (`:211 :213 :216`, gate.mjs:146) — the read's file:line in each row.

## 1. THE WITNESS, BOTH WAYS (`ci/mbare/witness_mbare.mjs --org <dir> --base-org <dir>`, 21 Nov 2026; trees by the member's lfTree recipe)

| run | last line | exit |
|---|---|---|
| `--org` = base 5301f15 · `--base-org` = base | `RED MBARE · REACH · NEVER-A-PASS · TRANSPARENT · RETHROW` | 1 |
| `--org` = build · `--base-org` = base 5301f15 | `GREEN MBARE the laws mode passes a bare state dir by naming each blocked input, and changes nothing where the inputs exist · 4 clause(s)` | 0 |

Clauses (the header of the witness is the contract): **REACH** (Z(org) runs to its end, every LIVE laws key T(org) judges is printed
on Z) · **NEVER-A-PASS** (the guard fires, each red names an input, no BLOCKED assert is also ok, exit non-zero) · **TRANSPARENT** (T(org)
prints zero BLOCKED lines and assert lines byte-identical to T(base-org), and the guard is armed) · **RETHROW** (a planted throw at the
head of the A9 block ends the mode untouched — never BLOCKED — while the unplanted run reaches its end). Checks: **BOUND** (only
`scripts/organism_test.mjs` and `ci/mbare/**` differ, base-org → org: 11 paths, 0 outside, 21 Nov 2026) · **LAST** (no node process names
the temp dir; `ls /tmp | grep -c ^mbare-` after a run: 0). Port class (row 1053): no port is bound or typed (every `ARSENAL_*PORT` door
of the tree gets an OS-picked port, listen 0), no service named, nothing POSTed, nothing restarted, every wait the tree's own
`HEAVY_BOUND_MS`; claude and gemini are refusing shims first on PATH. Runs on Windows too: paths by `join`, a junction for node_modules,
powershell for LAST, every output split on `\r?\n`, every source edit CR-tolerant. Wall time on this box: 11 s (21 Nov 2026).

## 2. THE MUTANTS (`node ci/mbare/run_mutants_mbare.mjs --org <build> --base-org <base>`, 21 Nov 2026)

| mutant (one edit of a copy of the build's organism_test.mjs) | witness last line |
|---|---|
| REACH — laws() ends silently after the A9 block on a bare state dir | `RED MBARE · REACH` |
| NEVER-A-PASS — the guard's red becomes a pass (`assert(…, true, …)`) | `RED MBARE · NEVER-A-PASS` |
| TRANSPARENT — the guard adds one ok line to every block that ran | `RED MBARE · TRANSPARENT` |
| RETHROW — `absentStateInput` calls every throw an absent input | `RED MBARE · RETHROW` |
| control — the unmutated build | `GREEN MBARE … · 4 clause(s)` |

Last line: `run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN` (21 Nov 2026). Each mutant reds ONLY its clause.

## 3. THE RE-CENSUS (`ci/mbare/census/`, generated by `node ci/mbare/tools/recensus.mjs 5301f15 a3cadcf`, 21 Nov 2026)

Rules in the tool's header (nothing typed per assert). Runs: Z(base) once, T(base) once, Z(build) twice on fresh plants (stability), T(build)
once, then a PROBE pair (a temp copy of the build's organism_test.mjs on a fresh Z and a fresh T prints the exit and output of the very
command an assert's condition reads; off T only an exit and a 16-hex shape hash). Classes:
- **RIDES** — ok on both Z(build) runs and on T; its condition reads more than an exit code; or, if exit-only / a lone negative test, its
  probed refusal is CLEAN (no throw signature) and its output shape equals T's. Ten of the 15 read only source (the eight S8 asserts
  `:219-:226` read `hooks/afferent-post.mjs`, `thalamus.mjs`, `spool.mjs`; `:198 :199` read the organs' source); `:195 :201 :205 :207`
  ride on the suite's OWN CI fixture capsules, which `sandbox()` seeds when the state dir holds none (`organism_test.mjs` `sandbox()`,
  the `hasCapsule` branch): not mfix's; `:214` runs `sitting.mjs agenda` in the sandbox.
- **VACUOUS** (named, how measured) — `:209` exit-only, its refusal on Z is `samjhao: no samjhao session x` (the session the task layer
  could not open), shape ≠ T's: it answers for the absent input, not the gut-word law · `:210` and `:215` exit-only, Z's refusal is
  gate.mjs's import throw · `:212` negative-only, Z's `outbox status` is that same throw (exit 1; T exit 0).
- **NEEDS-FIXTURE** — the input and the read's file:line, from its own detail, the guard's line, or the probe; where the organ's own
  message cuts the row name off (samjhao quotes registry.mjs's throw cut short), the row is named as cut, and an INFERRED row is labelled so.
- **NOT-DECIDABLE** — `:203` (the COLDNESS RATCHET) is red on T(base) too: mlaw2 §9 N2, measured on his laptop.

```
| base line | build line | class | Z · Z · T | the assert (folded key) | input (file:line of the read) · or how measured |
|---|---|---|---|---|---|
| 194 | 1199 | NEEDS-FIXTURE | FAIL · FAIL · ok | HIS ANSWERS ARE HIS · ...and the same call against a SANDBOX ledger is allowed — | registry.json · row name cut by the organ's message · read at registry.mjs:134 · from the probe: the output of the command its condition reads |
| 195 | 1197 | RIDES | ok · ok · ok | HIS ANSWERS ARE HIS · a FIXTURE may NEVER write a guess into his LIVE samjhao —  | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 196 | 1080 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · RUNTIME ASSERTION: an idempotency key may never be executed  | registry.json · mechanisms row "task_kinds" · read at registry.mjs:134 ← registry.mjs:148 ← registry.mjs:150 · from INFERRED: the nearest earlier red of its block that names an input (its own command's output, probed, names none) |
| 197 | 1076 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · THE # AUG REPLAY: his one ask fired #x from # processes make | registry.json · mechanisms row "task_kinds" · read at registry.mjs:134 ← registry.mjs:148 ← registry.mjs:150 · from its own detail (the guard's line for a BLOCKED one) |
| 198 | 1066 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · no organ spawns work for him OUTSIDE tasks.mjs (a bare call  | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 199 | 1068 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · the act lane's 'job' verb names tasks.mjs as its owner (the  | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 200 | 1147 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · ...and an axis he never reached is UNTOUCHED — only what was | registry.json · mechanisms row "game_on_epoch" · read at registry.mjs:134 ← registry.mjs:227 · from the probe: the output of the command its condition reads |
| 201 | 1108 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · NO NEW FACTS — every samjhao unit of all four topics asserts | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 202 | 1123 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · PREDICT-THEN-REVEAL is a gate: an answer before the guess is | registry.json · row name cut by the organ's message · read at registry.mjs:134 · from INFERRED: the nearest earlier red of its block that names an input (its own command's output, probed, names none) |
| 203 | 1144 | NOT-DECIDABLE | FAIL · FAIL · FAIL | LOAD ZERO BLOCK # · THE COLDNESS RATCHET: once samjhao OPENS an axis, the Re-Jir | red on T(base) too (FAIL): the fresh clone's tracked state does not judge it green (mlaw2 §9 N2) |
| 204 | 1120 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · THE RATCHET: close is REFUSED while units/doubts are open, a | registry.json · row name cut by the organ's message · read at registry.mjs:134 · from INFERRED: the nearest earlier red of its block that names an input (its own command's output, probed, names none) |
| 205 | 1112 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · a concept with no locked capsule is REFUSED — samjhao is REV | exit-only, probed on a fresh Z(build) and T(build): Z exit 1 · T exit 1 · a CLEAN refusal whose output SHAPE equals T's (the same answer the full state gives) |
| 206 | 1118 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · a samjhao takes its id from the TASK layer, so it resumes on | registry.json · row name cut by the organ's message · read at registry.mjs:134 · from its own detail (the guard's line for a BLOCKED one) |
| 207 | 1110 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · all four topics are RUNNABLE and every one is a #-axis revis | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 208 | 1140 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · before any samjhao, the cold round DOES serve the capsule's  | registry.json · mechanisms row "game_on_epoch" · read at registry.mjs:134 ← registry.mjs:227 · from the probe: the output of the command its condition reads |
| 209 | 1126 | VACUOUS | ok · ok · ok | LOAD ZERO BLOCK # · the GUT-WORD LAW holds here too — samjhao refuses knew\|shaky | exit-only, probed on a fresh Z(build) and T(build): Z exit 1 · T exit 1 · clean on Z, but its output SHAPE differs from T's: it answers for another cause (the absent input upstream), not for its law |
| 210 | 1160 | VACUOUS | ok · ok · ok | LOAD ZERO BLOCK # · a row that would ASK him for a decision is refused unless it | exit-only, probed on a fresh Z(build) and T(build): Z exit 1 · T exit 1 · Z NOT clean: its output carries a throw signature or is empty, so the assert passes on the absent input |
| 211 | 1158 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · output produced with NO session open reaches the next surfac | registry.json · registry.json lanes table · read at gate.mjs:146 ← gate.mjs:158 · from its own detail (the guard's line for a BLOCKED one) |
| 212 | 1162 | VACUOUS | ok · ok · ok | LOAD ZERO BLOCK # · the dead-man's switch exists and does NOT fire on a road he  | negative-only, probed on a fresh Z(build) and T(build): Z exit 1 · T exit 0 · Z NOT clean: its output carries a throw signature or is empty, so the assert passes on the absent input |
| 213 | 1182 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · ...and a dugout REOPEN does not restart it — the row stays c | registry.json · registry.json lanes table · read at gate.mjs:146 ← gate.mjs:158 · from INFERRED: the nearest earlier red of its block that names an input (its own command's output, probed, names none) |
| 214 | 1176 | RIDES | ok · ok · ok | LOAD ZERO BLOCK # · an ask created at the GAFFER door is open on the agenda | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 215 | 1184 | VACUOUS | ok · ok · ok | LOAD ZERO BLOCK # · no ask may be created without a CLOSE PATH — an 'ask' with n | exit-only, probed on a fresh Z(build) and T(build): Z exit 1 · T exit 1 · Z NOT clean: its output carries a throw signature or is empty, so the assert passes on the absent input |
| 216 | 1180 | NEEDS-FIXTURE | FAIL · FAIL · ok | LOAD ZERO BLOCK # · the relay's DELIVERED stamp CLOSES it — through the owner, f | registry.json · registry.json lanes table · read at gate.mjs:146 ← gate.mjs:158 · from INFERRED: the nearest earlier red of its block that names an input (its own command's output, probed, names none) |
| 217 | 1283 | NEEDS-FIXTURE | BLOCKED · BLOCKED · ok | ONE SCHEDULE — all THREE derivations agree that a pre-epoch capsule is not due:  | registry.json · mechanisms row "game_on_epoch" · read at registry.mjs:134 ← registry.mjs:227 ← registry.mjs:241 ← rejirah.mjs:353 · from its own detail (the guard's line for a BLOCKED one) |
| 218 | 1291 | NEEDS-FIXTURE | BLOCKED · BLOCKED · ok | ONE SCHEDULE — and all three agree on the SAME open round and the SAME due date  | registry.json · mechanisms row "game_on_epoch" · read at registry.mjs:134 ← registry.mjs:227 ← registry.mjs:241 ← rejirah.mjs:353 · from its own detail (the guard's line for a BLOCKED one) |
| 219 | 1894 | RIDES | ok · ok · ok | S# · ...and a spool that cannot open DEGRADES rather than throws — the nerve's f | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 220 | 1892 | RIDES | ok · ok · ok | S# · ...and it marks its own row delivered on a #xx, so a healthy bus never leav | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 221 | 1900 | RIDES | ok · ok · ok | S# · ...and the idempotence set is seeded from the WHOLE afferent file at boot,  | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 222 | 1905 | RIDES | ok · ok · ok | S# · NEW LANE ONLY — the spool names spool.db and NO existing state file (the ru | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 223 | 1896 | RIDES | ok · ok · ok | S# · THE CONSUMER IS IDEMPOTENT — thalamus.ingest() refuses an event_id it has a | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 224 | 1887 | RIDES | ok · ok · ok | S# · THE NERVE WRITES AHEAD — hooks/afferent-post.mjs spools the event BEFORE it | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 225 | 1902 | RIDES | ok · ok · ok | S# · THE THALAMUS DRAINS ON BOOT, AFTER listen() — the port must be open first,  | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
| 226 | 1907 | RIDES | ok · ok · ok | S# · node:sqlite IS AVAILABLE on this runtime, so the write-ahead is REAL and no | ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject |
```

## 4. EVERY MEMBER TOUCHED, BEFORE AND AFTER

The one organ file touched is `scripts/organism_test.mjs` — the suite itself (its `selftest` verb prints a pointer to `all`; it has no
selftest of its own). Its member lines, base 5301f15 → build (21 Nov 2026):

| measurement (command) | base | build |
|---|---|---|
| `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, T plant, node_modules copied, sequential, 21 Nov 2026 (ledger row 7) | `organism_test: 165 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` | identical |
| laws, FULL profile, T plant | exit 2 · 116 assert lines · 114 ok · 2 FAIL · 0 BLOCKED | identical, one hash |
| laws, FULL profile, empty plant Z | exit 2 · 13 assert lines · the mode THREW | exit 2 · 98 assert lines · 5 guard reds · 6 BLOCKED · ran to its end |
| `xray build()` on a Z plant: `organism_test.mjs` unresolved sinks (the per-organ ratchet) | 77 | 77 (a first draft read 79: two `existsSync` on computed paths; fixed at its cause, ledger row 9) |

Note (a run with node_modules LINKED, in parallel, read 5 / 3 reds at base / build: `sandbox selftest` and `MODE hermetic` red on both
— mlaw2 §3 (c), cpSync refuses a linked node_modules — and two CLAUSE WITNESS reds at base only under parallel load; re-run sequentially
with node_modules copied: both 0 red. Ledger row 7.)

`node scripts/models.mjs check` → `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`, exit 0 (21 Nov 2026).

## 5. THE LAW PACK COUNTS (row 1130 (2)) — `node ci/mbare/tools/lawpack_counts.mjs <sha>`, LF plants, 21 Nov 2026

```
5301f15 · exit 0 · lawpack · 1945 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
<build> · exit 0 · lawpack · 1945 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
(the two gates lines abridged from the tool's own line, which prints the gate's lint and type lines verbatim)
5301f15 · gates report exit 1 · checkJs other diagnostics 298 (baseline 296) · lint no-empty 272 (frozen 262) · no-unused-vars 85 (frozen 82) · gates: 3 RED
<build>  · gates report exit 1 · checkJs other diagnostics 298 (baseline 296) · lint no-empty 272 (frozen 262) · no-unused-vars 85 (frozen 82) · gates: 3 RED
```

No count rose. The 3 gates REDs are state-independent and the same at base (mlaw2 §3 (b), unit mgat's; not touched).

## 6. FOUND BY THIS UNIT, NOT ASKED (each named, none touched)

- **(a) Three NON-LIVE laws blocks read state.** W0-C (the witness seam), LOAD ZERO BLOCK 6 and the block after it are not in
  LIVE_ASSERTS, so the hermetic profile RUNS them; each imports an organ whose import reads `registry.json` (gate.mjs:158 calls
  `laneConsumersFromRegistry` at module top). On the neutral machine they read the CI checkout's tracked registry; on a bare dir they
  throw (now: BLOCKED). The same class as mlaw2 §3 (a) (`sandbox`). FORK K2.
- **(b) gate.mjs throws at IMPORT**, so its error is the module's CACHED evaluation error: every later importer re-throws the SAME
  Error, whose stack names the FIRST importer (`organism_test.mjs:860`, the SNAPSHOT block) — the guard's `read at` for those three
  blocks therefore names :860, not the block. The census found the true sites by an import trace on a temp copy (ledger row 8).
- **(c) The integrity mode still throws on a bare dir** at its own `brain_config.json` read (`organism_test.mjs:587` base → `:628` build):
  the brief names the laws mode only. FORK K1.
- **(d) mhot's shapes.** On main (5301f15) `LIVE_ASSERTS` is `organism_test.mjs:185`; on `claude/mhot-build f9c7ed4` it stays in the
  suite at `:116` (mhot folds LIVE_SELFTESTS only). This unit moves no LIVE name in either shape. `git merge-tree --write-tree HEAD
  origin/claude/mhot-build` (21 Nov 2026): `scripts/organism_test.mjs` auto-merges; the one conflict is `package.json`, which is
  mhot-vs-main's own (`git merge-tree origin/main origin/claude/mhot-build` conflicts on it alone).

## 7. FORKS (each the architect's to rule)

- **K1 · integrity's bare-dir throw** — (A) the same guard on `integrity()` (one more block, `:628`) · (B) mfix's fixture (`brain_config.json`).
  Recommend A: the guard is built; it is the only way to census integrity's later asserts on a plant.
- **K2 · the three non-LIVE laws blocks that read state (§6 (a))** — (A) their asserts join LIVE_ASSERTS (the table grows: the ratchet of
  row 1022 (3) forbids unless ruled) · (B) a fixture from mfix · (C) the owner organ (gate.mjs) reads its registry lazily, at first use
  (registry.mjs `lazySubjects` already exists for this class; laws/import-time-registry-read.yml counts 2). Recommend C.
- **K3 · the four VACUOUS (`:209 :210 :212 :215`)** — (A) they stay LIVE until a fixture makes their subject real · (B) their owners
  tighten each condition to read its refusal TEXT (the four GUT-WORD asserts of mlaw2 show the shape). Recommend A now, B named for the owners.
- **K4 · the guard's name rule** — (A) as built: a throw naming any state file absent from ROOT's state dir counts (broad on a bare dir,
  but a blocked block is always red, so breadth cannot hide a pass) · (B) only registry.mjs's and ENOENT's shapes, plus a list the organs
  export. Recommend A.
- **K5 · the 15 RIDES** — whether they leave LIVE_ASSERTS (judged in the hermetic profile) is mlaw2 F3's or a later unit's; this unit moves
  none. The samjhao riders ride on the suite's own CI fixture capsules (§3).
- **K6 · the census ran on linux only.** The neutral machine is `windows-latest`; the witness runs there through the `witnesses` member on
  every push. The census on his laptop: `node ci/mbare/tools/recensus.mjs <BASE> <build>` (git and tar on PATH).
- **K7 · the effort receipt.** The brief's command names `campaign-2026-09/tools/effort_receipt.mjs`, which this repository does not carry;
  its error is in the FINAL MESSAGE and nothing is written under `campaign-2026-09/`.

## 8. THE NEUTRAL MACHINE ON THIS BRANCH (`curl -s https://api.github.com/repos/<slug>/commits/<sha>/check-runs`, no token; slug from `git remote get-url origin`)

| push | run | verdict (21 Nov 2026) |
|---|---|---|
| c680ec0 · 558392e · 5ca8de3 · a3cadcf · 92b2e73 | 44873146237 · 44873439691 · 44873989850 · 44874748782 · 44874799545 | cancelled by the next push (the workflow's concurrency); `hermetic twice · node 24` on 5ca8de3 completed success before its cancel |
| a495a4a (the witness) | 44875211526 | queued when this proof was written; its verdict and the run of this proof's own push are named in the FINAL MESSAGE |

DONE · the guard, its witness and mutants, the re-census · 21 Nov 2026 UTC · nothing landed
