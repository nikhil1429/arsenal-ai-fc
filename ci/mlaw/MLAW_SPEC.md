# MLAW SPEC — unit mlaw (forks row 1120 (1) F4 A and (3)), cloud spec seat

Written 19 Nov 2026 by the cloud spec seat (unit mlaw). A SPEC, not a build: nothing on main moved, no PR, no live
model call. Branch `claude/mlaw-spec`, cut from `origin/main` **`224f9b9`** (`git fetch origin main && git checkout -b
claude/mlaw-spec FETCH_HEAD`, 19 Nov 2026 UTC). The clone is shallow: `git rev-list --first-parent --count origin/main`
read 49 on 19 Nov 2026, its oldest commit `1b3b2ba`, where the jugad baseline already reads 90. Every number below is a
measurement made 19 Nov 2026 on linux, node 22, on LF trees; its command is beside it and its row is in
`ci/mlaw/LEDGER.jsonl`. Read first, not re-measured: `ci/mrt/MRT_SPEC.md` at `2c66b26` (the depcruise 7 → 13 bisect,
first red `669200d` mlv1) and `ci/mrf/MRF_SPEC.md` at `13d2728` (A2 red in the FULL profile only, first red `9f6f9ab`).
The scratch scripts are committed as `ci/mlaw/tools/*.mjs` (they build no organ and write only under `os.tmpdir()`).

## 0. HEADLINE

1. **No single commit raised the literal-subject-list count from 90 to 93. Three commits did, one each.** Every
   first-parent commit was measured (49 of 49, not a bisect):
   `76b0626` B1 + mrdr 90 → 91 · `4d166d3` mdone 91 → 92 · `902b6cc` mpool 92 → 93. The FIRST is **`76b0626`, unit
   B1 + mrdr (forks rows 939 / 1006 (2) / 1012 / 1022)**. That is the same commit that made the law pack LIVE in the
   hermetic profile. So the commit that switched off the only neutral reader of the law pack was also the first
   commit the law pack would have refused.
2. **Why the red reached main with no machine reading it:** the neutral machine (`.github/workflows/suite.yml:68`,
   `ORGANISM_TEST_PROFILE: hermetic`) never enters mode `lawpack` (`organism_test.mjs:213` names it LIVE, `:2809` skips
   it) and never spawns `lawpack.mjs selftest` (`:120`). The landing verb reads that machine's verdict and nothing
   else (`land.mjs:127-135` → `ci_verdict.mjs`). The pre-commit hook runs no gate of it (`hooks/pre-commit:27,35`). The
   only reader left is the watchman's nightly FULL run on his laptop (`watchman.mjs:813`). It reads the exit code
   only (`:818`), and that exit was already non-zero from other reds (mrf §2: 21 failed in the full profile at
   `a18c167`), so a law pack red adds nothing it can see.
3. **The LIVE reason is not true for the gate's verdict.** `lawpack.mjs gate` printed byte-identical output on a tree
   with the state directory ABSENT and on the same tree with its tracked state present (§1.4). The only state bytes it
   reads come from the raw-NUL scan over `git ls-files` (`lawpack.mjs:543-557`). So the mode can ride the hermetic
   profile.
4. **Q2 · the class, by census (`node ci/mlaw/tools/summarize.mjs`, 19 Nov 2026):** `mlaw census: 126 full-only members · CAN ride hermetic on a plant 111 · CANNOT (or not shown) 15`. That is 23 selftests and the lawpack mode on an EMPTY plant, 42 selftests and 37 asserts on a named file plant, and 8 asserts on the empty plant. The class also has a SECOND member on main today: mode `gates` is red (`no-empty 268, baseline 262`), and it is LIVE as well (§2.5).

## 1. QUESTION 1 — the first commit at which the count went 90 → 93, and why it reached main unread

### 1.1 Recipe

- **Trees:** for each sha, `git -c core.autocrlf=false archive --format=tar <sha>` extracted under `os.tmpdir()` by a
  node script (`ci/mlaw/tools/tree.mjs`), with the state directory **excluded** (`--exclude`), the repo's
  `node_modules` symlinked in (`npm ci` once; the lockfile pins `@ast-grep/cli`, `knip`, `dependency-cruiser`), then
  `git init` and one commit inside, because `rawNulFiles` lists the tree with `git ls-files` (`lawpack.mjs:546`).
  Without the commit the gate printed `fatal: not a git repository`. That was measured once and then fixed in the recipe.
- **Command per tree:** `node scripts/lawpack.mjs gate`. The count is read off its `findings:` line. The named sites
  come from the tree's own exports: `judgeJugad(scan().matches)` (`lawpack.mjs:194`, `:283`).
- Scratch scripts: `tree.mjs` · `lawgate.mjs` · `jugadset.mjs` · `lawstate.mjs`.

### 1.2 The census over first-parent main (`git rev-list --first-parent --reverse origin/main`, all 49)

`node ci/mlaw/tools/lawgate.mjs $(git rev-list --first-parent --reverse origin/main)`. Each run took 3.1 to 3.7 s
(19 Nov 2026).

| Commits (first-parent order) | jugad | depcruise | gate |
|---|---|---|---|
| `1b3b2ba` … `d0c8c96` (19 commits) | 90 | 7 | GREEN |
| **`76b0626`** … `009f52e` (10) | **91** | 7 | 1 RED |
| `669200d` (mlv1) | 91 | **13** | 2 RED (MRT's bisect, same number) |
| **`4d166d3`** … `3824171` (13) | **92** | 13 | 2 RED |
| **`902b6cc`** … `224f9b9` (6) | **93** | 13 | 2 RED |

Last line at head `224f9b9`: `lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)` (19 Nov 2026).
The rise is monotone: no step falls, and `jugadset.mjs` shows that no finding left at any step (GONE is empty at
every boundary).

### 1.3 What each step added (`node ci/mlaw/tools/jugadset.mjs d0c8c96 76b0626 009f52e 4d166d3 3824171 902b6cc 224f9b9`)

| Step | Commit · unit · row (its message) | The new finding (site at head `224f9b9`) |
|---|---|---|
| 90 → 91 | `76b0626` · **B1 + mrdr** · forks rows 939 / 1006 (2) / 1012 / 1022. The message: "scripts/ci_verdict.mjs = the seat's" | `scripts/ci_verdict.mjs:106` `export const REQUIRED_LEGS = [<2 names>]`. These are the two job names of `suite.yml`'s matrix, typed as literals |
| 91 → 92 | `4d166d3` · **mdone** · forks row 1051 ("scripts/done.mjs (new)") | `scripts/done.mjs:41` `const SURFACES = [<2 names>]`. These are two organ file names, typed (the ledger site at the step was `:40`) |
| 92 → 93 | `902b6cc` · **mpool** · forks row 1099 ("scripts/usage_tap.mjs … from claude/mpool-build b6cb4a9") | `scripts/usage_tap.mjs:51` `const LAW_HOME = [<2 names>]`. These are two path segments, typed |

None of the three commit messages names the law pack, the jugad law or a waiver. None of the three lines carries a
`law-waiver:jugad` marker (`lawpack.mjs:300`, `waived(src, m.line, "jugad")`). `BASELINE["jugad-literal-subject-list"]`
is still 90 at head (`lawpack.mjs:129`).

### 1.4 Is the law pack's verdict a function of his state? (`node ci/mlaw/tools/lawstate.mjs 224f9b9`)

On one sha, two trees: state ABSENT (0 entries), and the sha's tracked state copied in by the node script (57
entries, never printed).

```
{"sha":"224f9b9","state_entries":0,"exit":1,"out_sha256":"145ddf2bda9ff572","last":"lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)"}
{"sha":"224f9b9","state_entries":57,"exit":1,"out_sha256":"145ddf2bda9ff572","last":"lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)"}
```

The outputs are equal. The scan paths are `scripts` and `hooks` (`lawpack.mjs:194`, depcruise `:581`). The import-graph
judge covers `scripts` and `hooks` (`:439`). The one reader of state bytes is `rawNulFiles` (`:543-557`). It reads
every tracked file with a text extension, his state included, and looks for byte 0. That is the "437,917 state reads"
of `organism_test.mjs:213`. The reads are real, but the verdict does not depend on them unless a state file carries a
raw NUL.

### 1.5 Which machine runs the law pack, in which profile, and which landing verb reads it

| Reader | Profile | Does it run the law pack? | Does a landing verb read it? |
|---|---|---|---|
| The neutral machine, `.github/workflows/suite.yml:68` (`ORGANISM_TEST_PROFILE: hermetic`), `:113` / `:133` / `:140` (`organism_test.mjs all`) | hermetic | **No.** Mode `lawpack` is in `LIVE_MODES` (`organism_test.mjs:213`), and `main()` skips it at `:2809` with `LIVE MODE lawpack`. `lawpack` selftest is in `LIVE_SELFTESTS` (`:120`) | **Yes, but only its verdict:** `land.mjs:127-135` `verdictAt(t)` → `ci_verdict.mjs`. The law pack is not in it |
| `npm test` = `node scripts/organism_test.mjs all` (`package.json` `scripts.test`) at his console | full | Yes: `lawpack()` `organism_test.mjs:2690-2700` runs `lawpack.mjs gate` | No verb reads it |
| The watchman's nightly sweep, `watchman.mjs:803-829` | full (no profile env) | Yes, inside `all` | It reads `r.status !== 0` only (`:818`). That exit is already non-zero from other full-profile reds (MRF §2), so a law pack red changes nothing it reads. Not a landing verb |
| `hooks/pre-commit` | — | No: it runs `archivist.mjs tripwire` (`:27`) and `rails.mjs orders` (`:35`) only | — |

There is a second wall, and it would hide the red even if the mode ran hermetic. The B1 verdict is GREEN iff no member
is red at HEAD **that is not red at the base**, judged BY NAME (`suite.yml:34-37`, `ci_verdict.mjs:35-42`). The law
pack is ONE assert with ONE fixed name (`organism_test.mjs:2698`). Once it is red at a base, each later rise (91 → 92
→ 93, and depcruise 7 → 13 at `669200d`) carries the same name and is red on both sides. So it reads as a **base red**
(a warning), never a new one. A rise in a law that is already over its baseline has no name of its own.

## 2. QUESTION 2 — by census, which full-profile members can ride the hermetic profile on planted state

### 2.1 What "full-only" is, by command

The hermetic profile names every member it does not run as one `  LIVE <name>` line (`organism_test.mjs:218`). The
three tables are `LIVE_SELFTESTS` (`organism_test.mjs:84-157`), `LIVE_ASSERTS` (`:158-208`) and `LIVE_MODES`
(`:209-215`). `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` at `224f9b9` (19 Nov 2026) printed
`organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)`. The distinct LIVE
names split 72 selftests · 49 asserts · 5 modes (`grep "^  LIVE " | sed 's/ — not run.*//' | sort -u`, 19 Nov 2026),
which matches the three tables one to one. The one hermetic red is the coverage law (`deck_lint, home_pin, probe,
study_scope` orphaned). It is not this unit's, and FORKS F7 names it so it is not lost.

The modes hold more asserts than one line: a LIVE mode is one name in the hermetic run and many asserts in the full one.
MRF §2 counted the members both ways at `a18c167` (146 hermetic, 310 full). This census works at the hermetic
profile's own grain (the 126 names), because that is the unit the hermetic table moves.

### 2.2 Recipe (`ci/mlaw/tools/census.mjs`, `census_r.mjs`, `census_min.mjs`, `census_modes.mjs`, `census_ports.mjs`)

- **Trees** under `os.tmpdir()`, one sha (`224f9b9`), made by a node script: **Z** = the state dir planted EMPTY (none
  of his bytes) · **T** = the sha's tracked state copied in. T is the contrast, and it is what a fresh clone's full
  profile reads. **R** = only the files the member's LIVE reason names, copied from the tracked set. R is a
  SUFFICIENCY probe for the plant's file list. It is not the plant: its bytes are still his.
- **Doors planted per spawn:** HOME / USERPROFILE / APPDATA / TMPDIR under the temp dir, and a refusing `claude` +
  `gemini` shim first on PATH. `ANTHROPIC_API_KEY`, `GITHUB_ACTIONS`, `ORGANISM_TEST_PROFILE` and `ARSENAL_ORGAN` are
  removed. Every `ARSENAL_*PORT` env door found in `scripts/*.mjs` gets an OS-picked port (listen 0, read, release).
  At head those doors are `ARSENAL_CORTEX_PORT`, `ARSENAL_THALAMUS_PORT`, `ARSENAL_JUDGE_PORT` and
  `ARSENAL_SITTING_PORT`. The wait per spawn is `organism_test.mjs`'s own `run()` default, read off its source
  (`:54`). This spec does not type it.
- **The member's command** is its segment in one of the three `SUITE_NAMES` chains (`organism_test.mjs:70`,
  `package.json`), else `<organ>.mjs selftest`. ⚠ The first census run took the first `package.json` script of any name.
  That ran `brain.mjs tick` and bare `heartbeat`, `postmatch` and `viz` instead of their suite segments. The tick ran
  inside the temp tree, and the shim refused any model call. It was caught by the port probe (a `listen 4115`), the
  lookup was fixed, and those four were re-measured (`census_fix`). The rows below are the fixed ones.
- **Port probe** (`portprobe.mjs`, `NODE_OPTIONS=--import`): it journals every `listen()` and `connect()` a member
  makes. After the fix, no member listens on a fixed port. One member CONNECTS to a fixed port:
  `conductor.mjs:990` `portOpen(59999, …) === false`, a probe that the port is closed. FORKS F6 names it.
- His real state was hashed before the census (`statehash_before`, a sha256 over the directory). The hash is in
  the ledger. Nothing in the census writes outside `os.tmpdir()`.

### 2.3 The counts (`node ci/mlaw/tools/summarize.mjs`, 19 Nov 2026, last line)

```
selftests 72: ZERO 23 · PLANT 42 · RED-BOTH 7 · UNPLANTED 0
asserts 49: ZERO 8 · PLANT 37 · RED-ON-PLANT 2 · SUBJECT 2 · UNREACHED 0
modes 5: lawpack ZERO · gates SPLIT · alive PLANT-UNRUN · atlas SUBJECT · path NETWORK
mlaw census: 126 full-only members · CAN ride hermetic on a plant 111 · CANNOT (or not shown) 15
```

- **ZERO**: green on the EMPTY plant. The member needs no fixture, only a planted tree.
- **PLANT**: red on the empty plant and green on R. The plant is the file list named beside it. Two LIVE reasons are
  INCOMPLETE, so `census_min.mjs` (one-at-a-time removal from the whole tracked set) found the true minimum:
  **dugout** needs `reps_log.jsonl` beyond its reason (`organism_test.mjs:107`), and **limits** needs
  `doubtminer_config.json` beyond its reason (`:123`).
- **RED-BOTH** (selftests): red even on T on this linux box. That covers blackbox (wall clock), herd (process table),
  brain (the GEMINI SHIM cmd.exe assert, MRT N2), audit, capture, daykey and xray. On linux, a census cannot tell a
  Windows-only assert from a live dependency (NAMED NOT GUESSED N1). They are counted as CANNOT.
- **SUBJECT** (asserts 203 / 204, mode atlas): the assert's SUBJECT is his live bytes ("every state .json parses").
  On a plant it measures the plant, which says nothing. It cannot ride, by what it is.
- **RED-ON-PLANT** (asserts 161 / 176): reached on T, and FAIL there. What they read on his laptop is not
  measurable here (N2). They are counted as CANNOT.
- **Vacuity caveat:** asserts 201 / 207 read ZERO with zero declarations to check. A green over an empty set is
  vacuous. Each needs `brain_config.json` planted to mean anything (FORKS F5).

### 2.4 The census, per member (generated: `node ci/mlaw/tools/summarize.mjs --table`)

| organ | `organism_test.mjs` line | class | plant (or the live dependency) |
|---|---|---|---|
| blackbox | 88 | RED-BOTH | reads state/xray_graph.json · times the wall clock: red under instrumentation load alone |
| acts | 85 | PLANT | registry.json + captain.json |
| bootroom | 89 | PLANT | registry.json |
| calibration | 91 | PLANT | registry.json |
| brain | 90 | RED-BOTH | reads state/registry.json, state/brain_config.json, state/learning_state.json … |
| capsule_bridge | 92 | PLANT | registry.json + forge_profile.json |
| captain | 93 | PLANT | captain.json |
| audit | 87 | RED-BOTH | reads state/registry.json, state/xray_graph.json, state/audit_ledger.jsonl … |
| capture | 94 | RED-BOTH | reads state/heartbeat_config.json |
| conductor | 95 | PLANT | registry.json + captain.json + tasks_expected.json |
| context | 96 | PLANT | registry.json + captain.json |
| context_manifest | 97 | PLANT | registry.json + resume_pointer.jsonl + compiled_notes.jsonl |
| council | 99 | PLANT | registry.json + council_config.json + brain_config.json |
| cortex | 98 | PLANT | registry.json + captain.json |
| daemon_watchdog | 100 | PLANT | registry.json + captain.json + conductor.json |
| daykey | 102 | RED-BOTH | reads state/tasks_expected.json |
| deep | 103 | PLANT | registry.json |
| distiller | 104 | PLANT | registry.json |
| doubtminer | 106 | PLANT | doubtminer_config.json |
| dmn | 105 | PLANT | registry.json + brain_config.json + concepts.json |
| daily_green | 101 | PLANT | captain.json + registry.json + daily_green.jsonl |
| examiner | 108 | ZERO | empty state dir |
| exchanges | 109 | ZERO | empty state dir |
| forge_session | 111 | PLANT | concepts.json + registry.json |
| flow_atlas | 110 | PLANT | registry.json + xray_graph.json + archive_audit.jsonl |
| fuelboard | 112 | ZERO | empty state dir |
| gate | 114 | PLANT | registry.json |
| gate_tune | 115 | PLANT | registry.json |
| gaffer_brain | 113 | PLANT | dossier_weights.json + registry.json |
| gates | 116 | ZERO | empty state dir |
| archivist | 86 | ZERO | empty state dir |
| herd | 118 | RED-BOTH | reads state/xray_graph.json · probes the process table |
| heartbeat | 117 | ZERO | empty state dir |
| learn_digest | 121 | ZERO | empty state dir |
| learnstate | 122 | PLANT | registry.json + forge_profile.json + python_state.json |
| limits | 123 | PLANT | doubtminer_config.json + nemesis_config.json + physio_config.json + reps_log.jsonl (reason names 3, +doubtminer_config.json) |
| manager | 124 | PLANT | registry.json |
| dugout | 107 | PLANT | captain.json + readiness.json + registry.json + reps_log.jsonl (reason names 3, +reps_log.jsonl) |
| home_pin | 119 | ZERO | empty state dir |
| mcp-memory | 125 | PLANT | registry.json |
| models | 126 | PLANT | brain_config.json + calibration_config.json + council_config.json |
| notes_compiler | 128 | ZERO | empty state dir |
| oura_coach | 129 | ZERO | empty state dir |
| outbox | 130 | PLANT | registry.json |
| outwork_audit | 131 | ZERO | empty state dir |
| python_state | 133 | ZERO | empty state dir |
| postmatch | 132 | ZERO | empty state dir |
| nightshift | 127 | PLANT | registry.json + captain.json + gate_tune_ledger.jsonl |
| rejirah | 136 | PLANT | registry.json |
| samjhao | 137 | PLANT | registry.json |
| scout | 138 | PLANT | dossier_weights.json |
| selfknowledge | 139 | ZERO | empty state dir |
| services | 140 | PLANT | registry.json + captain.json |
| setpiece | 141 | PLANT | registry.json + ladder_config.json + dossier_weights.json |
| shadow | 142 | PLANT | reps_log.jsonl + registry.json |
| lawpack | 120 | ZERO | empty state dir |
| sprintsync | 144 | PLANT | registry.json |
| talk | 145 | PLANT | registry.json |
| tasks | 146 | PLANT | registry.json |
| reconcile | 135 | ZERO | empty state dir |
| test_coach_v2 | 148 | ZERO | empty state dir |
| thalamus | 149 | PLANT | thalamus_config.json + registry.json |
| rails | 134 | ZERO | empty state dir |
| timeaudit | 151 | PLANT | buckets.json |
| throwin | 150 | PLANT | registry.json |
| viz | 153 | ZERO | empty state dir |
| sitting | 143 | ZERO | empty state dir |
| turn_hook | 152 | ZERO | empty state dir |
| widget | 155 | ZERO | empty state dir |
| watchman | 154 | PLANT | registry.json + captain.json + unleash_baseline.json |
| teaching_audit | 147 | ZERO | empty state dir |
| xray | 156 | RED-BOTH | reads state/xray_graph.json |

| line | class | mode | assert key (folded) |
|---|---|---|---|
| 159 | PLANT | laws | A# · PLANTED VIOLATION — an off-list organ and a deny-listed one are both caught |
| 160 | PLANT | laws | A# · both study skills were readable (a gate that cannot see its subject is not  |
| 161 | RED-ON-PLANT | laws | A# · every organ the two study skills name is on the registry's study_entry_poin |
| 162 | PLANT | laws | A# · no study skill offers a DAEMON or a transport as a runnable command — wakin |
| 163 | ZERO | laws | GUT-WORD LAW · capture.mjs REFUSES a rep with no gut-word (exit non-zero) |
| 164 | ZERO | laws | GUT-WORD LAW · capture.mjs rejects a gut-word outside knew\|shaky\|guessed |
| 165 | ZERO | laws | GUT-WORD LAW · rejirah.mjs holds the SAME law on a Re-Jirah round |
| 166 | ZERO | laws | GUT-WORD LAW · rejirah.mjs rejects an out-of-vocabulary gut-word |
| 167 | PLANT | laws | HIS ANSWERS ARE HIS · ...and the same call against a SANDBOX ledger is allowed — |
| 168 | PLANT | laws | HIS ANSWERS ARE HIS · a FIXTURE may NEVER write a guess into his LIVE samjhao —  |
| 169 | PLANT | laws | LOAD ZERO BLOCK # · RUNTIME ASSERTION: an idempotency key may never be executed  |
| 170 | PLANT | laws | LOAD ZERO BLOCK # · THE # AUG REPLAY: his one ask fired #x from # processes make |
| 171 | PLANT | laws | LOAD ZERO BLOCK # · no organ spawns work for him OUTSIDE tasks.mjs (a bare call  |
| 172 | PLANT | laws | LOAD ZERO BLOCK # · the act lane's `job` verb names tasks.mjs as its owner (the  |
| 173 | PLANT | laws | LOAD ZERO BLOCK # · ...and an axis he never reached is UNTOUCHED — only what was |
| 174 | PLANT | laws | LOAD ZERO BLOCK # · NO NEW FACTS — every samjhao unit of all four topics asserts |
| 175 | PLANT | laws | LOAD ZERO BLOCK # · PREDICT-THEN-REVEAL is a gate: an answer before the guess is |
| 176 | RED-ON-PLANT | laws | LOAD ZERO BLOCK # · THE COLDNESS RATCHET: once samjhao OPENS an axis, the Re-Jir |
| 177 | PLANT | laws | LOAD ZERO BLOCK # · THE RATCHET: close is REFUSED while units/doubts are open, a |
| 178 | PLANT | laws | LOAD ZERO BLOCK # · a concept with no locked capsule is REFUSED — samjhao is REV |
| 179 | PLANT | laws | LOAD ZERO BLOCK # · a samjhao takes its id from the TASK layer, so it resumes on |
| 180 | PLANT | laws | LOAD ZERO BLOCK # · all four topics are RUNNABLE and every one is a #-axis revis |
| 181 | PLANT | laws | LOAD ZERO BLOCK # · before any samjhao, the cold round DOES serve the capsule's  |
| 182 | PLANT | laws | LOAD ZERO BLOCK # · the GUT-WORD LAW holds here too — samjhao refuses knew\|shak |
| 183 | PLANT | laws | LOAD ZERO BLOCK # · a row that would ASK him for a decision is refused unless it |
| 184 | PLANT | laws | LOAD ZERO BLOCK # · output produced with NO session open reaches the next surfac |
| 185 | PLANT | laws | LOAD ZERO BLOCK # · the dead-man's switch exists and does NOT fire on a road he  |
| 186 | PLANT | laws | LOAD ZERO BLOCK # · ...and a dugout REOPEN does not restart it — the row stays c |
| 187 | PLANT | laws | LOAD ZERO BLOCK # · an ask created at the GAFFER door is open on the agenda |
| 188 | PLANT | laws | LOAD ZERO BLOCK # · no ask may be created without a CLOSE PATH — an `ask` with n |
| 189 | PLANT | laws | LOAD ZERO BLOCK # · the relay's DELIVERED stamp CLOSES it — through the owner, f |
| 190 | PLANT | laws | ONE SCHEDULE — all THREE derivations agree that a pre-epoch capsule is not due:  |
| 191 | PLANT | laws | ONE SCHEDULE — and all three agree on the SAME open round and the SAME due date  |
| 192 | PLANT | laws | S# · ...and a spool that cannot open DEGRADES rather than throws — the nerve's f |
| 193 | PLANT | laws | S# · ...and it marks its own row delivered on a #xx, so a healthy bus never leav |
| 194 | PLANT | laws | S# · ...and the idempotence set is seeded from the WHOLE afferent file at boot,  |
| 195 | PLANT | laws | S# · NEW LANE ONLY — the spool names spool.db and NO existing state file (the ru |
| 196 | PLANT | laws | S# · THE CONSUMER IS IDEMPOTENT — thalamus.ingest() refuses an event_id it has a |
| 197 | PLANT | laws | S# · THE NERVE WRITES AHEAD — hooks/afferent-post.mjs spools the event BEFORE it |
| 198 | PLANT | laws | S# · THE THALAMUS DRAINS ON BOOT, AFTER listen() — the port must be open first,  |
| 199 | PLANT | laws | S# · node:sqlite IS AVAILABLE on this runtime, so the write-ahead is REAL and no |
| 200 | PLANT | laws | SNAPSHOT RIDES THE BUILD · every scheduled task a setup script registers is KNOW |
| 201 | ZERO | integrity | a declared external producer is a REAL organ in this tree (# declaration(s) chec |
| 202 | PLANT | integrity | all # brain triggers armed anywhere in the organism reach live work (a declared  |
| 203 | SUBJECT | integrity | every state .json parses (the bus is the contract between organs) |
| 204 | SUBJECT | integrity | every state .jsonl parses on every row (one bad row poisons a whole reader) |
| 205 | ZERO | hermetic | running all # selftests leaves live state untouched |
| 206 | ZERO | hermetic | the one sanctioned selftest write lands in the organ's OWN log, never on the sta |
| 207 | ZERO | integrity | …and that organ really BUILDS that brain_out directory — a producer that names t |

| mode | `organism_test.mjs` line | class | plant (or the live dependency) — measured by |
|---|---|---|---|
| lawpack | 213 | ZERO | gate output byte-identical, state dir absent vs present (`lawstate.mjs`, §1.4). Red on Z and T alike, on the real red |
| gates | 212 | SPLIT | the lint / tsc half reads no state. The ajv half's subject IS the schema'd state files (`gatesz.mjs` on Z: `0/0 state file(s) match … 4 NOT MEASURED`). And the mode is RED on Z and on T: `LINT ROSE — no-empty 268, baseline 262` (§2.5) |
| alive | 211 | PLANT-UNRUN | `pulse.mjs` already has fixture doors: `ARSENAL_PULSE_TASKS_JSON` (`pulse.mjs:74`), `ARSENAL_PULSE_STATE_DIR` (`:64`), `ARSENAL_PULSE_NOW` (`:228`). On linux the mode answers `bare checkout: pulse answered NOT-MEASURABLE`, so the plant is named, not shown. Counted as CANNOT |
| atlas | 214 | SUBJECT | `flow_atlas.mjs check` re-derives the atlas from `xray_graph.json`, the live IR. Z read `ok` because there was nothing to derive; T read FAIL |
| path | 210 | NETWORK | `mirror.mjs:157` fetches his gist (`mirror.mjs:73`). Not run from the cloud: the port class forbids a live service |

### 2.5 THE CLASS HAS A SECOND MEMBER ON MAIN TODAY — `gates` (found by this census, not asked)

`node ci/mlaw/tools/gatesz.mjs 224f9b9` (`gates.mjs report` on the empty plant, 19 Nov 2026) printed `RED  LINT ROSE —
no-empty 268, baseline 262. A gate may only get stricter.` The mode is in `LIVE_MODES` (`organism_test.mjs:212`), so
the neutral machine has never read it either. That is the same shape as the law pack, a second time. The first commit
is measured by `node ci/mlaw/tools/gatesbis.mjs` (every first-parent commit). See §2.6.

### 2.6 The `gates` no-empty census

GATES_BISECT_PENDING

## 3. THE CODE PATH (proposed; built by nobody here)

**P1 · the three jugad sites (Q1's repair, fate (b): main regressed against its own frozen gate; re-basing to 93 is
the gate getting looser).** Each owner fixes its own line, and `BASELINE` stays 90 (`lawpack.mjs:129`, not touched):
- `scripts/ci_verdict.mjs:106` `REQUIRED_LEGS`: DERIVE it from `suite.yml`'s matrix line. The selftest already reads
  that line and reds on disagreement (the comment at `:103-105`), so the reader exists and the literal is a second copy.
- `scripts/done.mjs:41` `SURFACES` and `scripts/usage_tap.mjs:51` `LAW_HOME`: these are path segments, not subject
  lists. Each gets a `law-waiver:jugad <reason>` marker on its line (the form `waived()` reads, `lawpack.mjs:300`),
  or each is derived (FORKS F1).
- After P1: `node scripts/lawpack.mjs gate` must print no `jugad-literal-subject-list ROSE` line. The depcruise red
  is MRT's repair (MRT §3.3) and is out of this unit.

**P2 · the law pack rides the hermetic profile.** Remove `lawpack` from `LIVE_MODES` (`organism_test.mjs:213`) and
from `LIVE_SELFTESTS` (`:120`). The verdict was measured independent of his state (§1.4). What stays open is the
NUL scan's read of tracked state bytes in the CI checkout (FORKS F2).

**P3 · a rise is a NEW red, by number, not by name.** `ci_verdict.mjs` keys a red by its name with digits folded
(`keyOf`, `ci_verdict.mjs:46`). So a law already over its baseline that rises again is "a base red", forever.
Proposed: `lawpack()` (`organism_test.mjs:2690`) prints one machine line beside its assert,
`ORGANISM_TEST_LAWPACK {"<law>":<count>,…}`, from `measure().counts` (`lawpack.mjs:615-651`). The suite already prints
`ORGANISM_TEST_VERDICT` the same way (`ci_verdict.mjs:36`). Then `ci_verdict.mjs compare` reads the line on both
sides and makes any `head[law] > base[law]` a NEW red named `LAW PACK ROSE · <law> <base> → <head>`. This is
stricter only: a fall or an equal count adds nothing (FORKS F3).

**P4 · the planted tree.** Members of class ZERO or PLANT leave the LIVE tables only by running in a tree under
`os.tmpdir()`: a `git ls-files` copy (ms1's `lfTree` recipe), with the state dir holding SYNTHETIC fixtures and never
his bytes. A new `plantedTree(files)` in `organism_test.mjs` builds it once per run. A moved selftest is spawned from
the planted tree's own `scripts/` (ROOT is anchored to the script's location, so it reads the plant). A moved assert
block points its sandbox source at the planted dir. The tables only shrink, and row 1022 (3)'s ratchet holds. The 23
ZERO selftests and the lawpack mode need no fixture and move first. The PLANT members move as their fixtures land
(FORKS F4 · F5).

**Files and owners at base `224f9b9`:**

| File | Line(s) | Change | Owner rule |
|---|---|---|---|
| `scripts/organism_test.mjs` | 84-157, 120, 209-215, 213, 2690-2700, 2809 | P2 · P3 machine line · P4 `plantedTree` | header `:26` "READ-ONLY on dressing-room/state". The plant lives under `os.tmpdir()`, so the law holds |
| `scripts/ci_verdict.mjs` | 46, 106, compare | P1 (derive the legs) · P3 (the numeric rise) | `:5` "SOLE WRITER of: NOTHING" |
| `scripts/done.mjs` | 41 | P1 | `:5` "SOLE WRITER of: NOTHING" |
| `scripts/usage_tap.mjs` | 51 | P1 | `:10` SOLE WRITER of `usage_reading.json` only (campaign root): the line is a constant, so no write moves |
| `scripts/lawpack.mjs` | — | not touched (`BASELINE` stays; `measure()` is imported, not edited) | `:6` "SOLE WRITER of: NOTHING" |
| `ci/mlaw/witness_mlaw.mjs` (new) | — | the witness (§4) | writes only under `os.tmpdir()` |
| fixtures (new, location = FORKS F4) | — | the synthetic state plants for PLANT members | no organ writes them; the build's seat authors them, and the plant is copied into the temp tree only |

No state file is written by any change. `suite.yml` is not touched: the profile env is unchanged, only the tables
move.

## 4. WITNESS CLAUSES (each plant RED on base `224f9b9`, GREEN on the build)

Every clause runs on LF trees under `os.tmpdir()`, with ports from listen-0 env doors only, the refusing model shim
first on PATH, no daemon reached, nothing restarted, and every wait being the tree's own `run()` default.

| Clause | Plant | Base `224f9b9` | Build |
|---|---|---|---|
| **W1 JUGAD** | the build tree as is | RED: `lawpack.mjs gate` prints `jugad-literal-subject-list ROSE — 93, baseline 90` | GREEN: no jugad ROSE line, and `BASELINE` byte-equal to base |
| **W2 LAWPACK-HERMETIC** | `ORGANISM_TEST_PROFILE=hermetic organism_test.mjs lawpack` in a tree whose state dir is EMPTY | RED: prints `LIVE MODE lawpack` and judges nothing | GREEN: no LIVE line for it, its assert is judged, and the verdict equals the full profile's on the same tree |
| **W3 RISE-IS-NEW** | two trees: a base with one planted literal list over the jugad baseline (red), a head with one more | RED: `ci_verdict.mjs compare` reads the head's law pack red as a BASE red (same folded name), so GREEN | GREEN: `LAW PACK ROSE · jugad-literal-subject-list <n> → <n+1>` is a NEW red, verdict RED |
| **W4 RISE-NOT-FALL** | the same pair with the head one list FEWER | — (control) | the verdict adds no red: a fall is never a red |
| **W5 PLANTED-SELFTEST** | the hermetic run in a tree whose checkout state dir is ABSENT | RED: each moved organ is printed `LIVE selftest <organ>` | GREEN: each moved organ is spawned from the planted tree and exits 0, and the LIVE count is lower by exactly the moved set |
| **W6 NO-HIS-BYTES** | the W5 run under `portprobe.mjs`'s sibling, a read journal on the checkout's state prefix | — | GREEN: zero reads under the CHECKOUT's state dir by any moved member (the plant's dir is under `os.tmpdir()`) |
| **W7 RATCHET** | the build's three LIVE tables against the base's | — | GREEN: every build key is a base key (the tables only shrink), and each removed key is a judged member in the build's hermetic run |

## 5. MUTANTS (one per clause; each must turn its clause RED on the build)

| Clause | Mutant |
|---|---|
| W1 | delete the `law-waiver:jugad` marker on `usage_tap.mjs:51` (or restore the `REQUIRED_LEGS` literal) |
| W2 | put `lawpack` back into `LIVE_MODES` |
| W3 | make `compare` skip the `ORGANISM_TEST_LAWPACK` line (names only, as today) |
| W4 | make `compare` red on `head[law] !== base[law]` (a fall turns red) |
| W5 | spawn the moved selftest from ROOT instead of the planted tree (it reads the absent dir and throws: the census's Z column) |
| W6 | copy the checkout's own state into the planted tree instead of the fixture |
| W7 | add one new key to `LIVE_SELFTESTS` |

## 6. FORKS (each the architect's to rule)

- **F1 · the three jugad sites.** (A) derive `REQUIRED_LEGS` from `suite.yml`, and waive `SURFACES` and `LAW_HOME` as
  path segments · (B) derive all three · (C) narrow `judgeJugad` so that a list of path segments is not a subject
  list (a law change; it lowers the count of every such site, not only these) · (D) re-base to 93: forbidden by
  `lawpack.mjs:31-36` and §10-D rule 6. **Recommend A.** Decides: whether `done.mjs` and `usage_tap.mjs` have a
  reader to derive from (their owners' call), measured by `lawpack.mjs gate` on the built tree = 90.
- **F2 · the NUL scan in the hermetic profile.** (A) the scan stays whole, so hermetic reads the CI checkout's tracked
  state bytes for byte 0 only (the verdict is unchanged, measured), and the LIVE rule is read as "a verdict that
  depends on his state" · (B) the hermetic profile excludes the state prefix from `rawNulFiles` and names the
  exclusion (looser in hermetic only; the full profile keeps it) · (C) the law pack runs in the planted tree (the same
  as B, by construction). **Recommend A**: it is the only one where no gate gets looser anywhere. Decides: his reading
  of B1's LIVE rule (`organism_test.mjs:72-74`, "a sandbox COPY … its bytes are still his").
- **F3 · how a rise is seen.** (A) the numeric machine line (P3) · (B) one assert per law (it catches a SECOND law
  going red, but not the same law rising again: the digits fold) · (C) both. **Recommend A.** Decides: W3 and W4 on
  the built `compare`.
- **F4 · where the synthetic fixtures live, and who authors them.** (A) `ci/fixtures/state/` in the repo, authored by
  the build seat from each organ's own reader, schema-checked by `validators.mjs` (where one exists) · (B) generated
  at run time by each organ's own exported seeder (no file; slower to build, never stale) · (C) only ZERO members move
  now, and PLANT waits for a fixture unit. **Recommend C, then A.** C is pure gain with no new data. Decides: whether
  `registry.json` is his data or organism config. It is in the plant of 36 PLANT members (19 Nov 2026: `summarize.mjs --table | grep "| PLANT |" | grep -c registry.json`), and a synthetic registry is the single largest unlock.
- **F5 · vacuous greens.** Asserts 201 and 207 (and any ZERO member whose subject is a count of state items) read ok
  over an empty set. (A) they move only with a non-empty planted fixture · (B) they move as ZERO. **Recommend A.**
  Decides: a W5 run with the fixture planted, where the declaration count must be > 0.
- **F6 · `conductor.mjs:990` connects to fixed port 59999 to prove that it is closed.** No bind, no POST. (A) it stays
  (a connect to a closed port reaches no service, and the PORT CLASS forbids a bind, not a refused connect) · (B) it
  takes an OS-picked closed port (listen 0, close, connect). **Recommend B**: on his laptop a live service on 59999
  would flip the assert, which is the same disease as a fixed port.
- **F7 · the hermetic coverage red** (`deck_lint, home_pin, probe, study_scope` orphaned, 19 Nov 2026 hermetic run).
  It is not in this unit's rows. (A) it goes to a unit of its own · (B) it folds into mlaw's build. **Recommend A.**
- **F8 · the `gates` no-empty red (§2.5–2.6).** It is the same class, found by this census. (A) a unit of its own,
  its first commit taken from §2.6 · (B) it folds into mlaw (P2's twin: remove `gates` from `LIVE_MODES` for its
  lint half). **Recommend A**: its fate (repair or re-base) is that commit's question, not this one's.

## 7. NAMED NOT GUESSED (a cloud seat cannot reach these; what measures each on his laptop)

- **N1 · the seven RED-BOTH selftests on Windows** (blackbox, herd, brain, audit, capture, daykey, xray). On linux
  they are red even on the tracked state. Measured by: on his laptop, `node ci/mlaw/tools/census.mjs <sha> blackbox
  herd brain audit capture daykey xray` (it builds the same Z / T trees under `os.tmpdir()`).
- **N2 · asserts 161 and 176 (RED-ON-PLANT).** These are red on the fresh clone's tracked state. Whether they are
  green on HIS state is a full-profile run on his laptop: `node scripts/organism_test.mjs laws`, reading those two lines.
- **N3 · whether the watchman's nightly sweep ran, and its exit.** The kickoff brief in this cloud reads `WATCHMAN:
  never run yet`, but the cloud's state is the clone's, not his. Measured by: `node scripts/watchman.mjs report` on his
  laptop.
- **N4 · `alive` on a planted task list.** `ARSENAL_PULSE_TASKS_JSON` and the other doors exist, but on linux the
  mode answers NOT-MEASURABLE first. Measured by: `organism_test.mjs alive` on his laptop with the three pulse doors
  planted under `%TEMP%`.
- **N5 · the 437,917 state reads of `organism_test.mjs:213`.** That count is B1's probe on Windows. This seat shows
  only that the gate's verdict is independent of them (§1.4), not their count.
- **N6 · the neutral machine's own run of this branch** (Windows, both legs): §8.

## 8. THE NEUTRAL MACHINE ON THIS BRANCH

CI_RUNS_PENDING

## 9. FILES A BUILD WOULD TOUCH

`scripts/organism_test.mjs` · `scripts/ci_verdict.mjs` · `scripts/done.mjs` · `scripts/usage_tap.mjs` ·
`ci/mlaw/witness_mlaw.mjs` (new). Beyond them, and only as forks: the fixtures location (F4) · `scripts/conductor.mjs:990` (F6)
· `scripts/gates.mjs` / its baseline (F8, a unit of its own). Not touched: `scripts/lawpack.mjs` (`BASELINE` stays 90),
`.github/workflows/suite.yml`, any state file.

CHECKPOINT · step 2 (Q2 census) pushed 2026-11-19 UTC · resume from §2.6 gates census and §8 CI runs
