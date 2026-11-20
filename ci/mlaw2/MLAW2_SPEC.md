# MLAW2 SPEC — unit mlaw2, the NOW half (forks rows 1137 (4) / 1205 (1)), cloud census seat

Written 20 Nov 2026 by the cloud census seat (unit mlaw2). A CENSUS and a SPEC, not a build: nothing on main moved, no
existing file edited, no PR, no live model call, no state file read into any output. Branch `claude/mlaw2-census`, cut
from `origin/main` **`6a6bdff`** (unit mmeter's land rebuild; units mlaw and mcov are on it), by `git fetch origin main &&
git checkout -b claude/mlaw2-census FETCH_HEAD` and then `git reset --keep origin/main` (the `claude/mlaw-spec` fetch had
overwritten FETCH_HEAD first; ledger row 1). Every number below was measured 20 Nov 2026 on linux x64, node 22, 4 cores,
on LF trees under `os.tmpdir()`; its command stands beside it and its row is in `ci/mlaw2/LEDGER.jsonl`. Read first, never
re-derived: the mlaw spec census, `git show da6d5e8:ci/mlaw/MLAW_SPEC.md` §2 (measured 19 Nov 2026 at `224f9b9`).

## 0. HEADLINE

1. **The census (`node ci/mlaw2/tools/summarize.mjs --claim`, 20 Nov 2026, last line):**
   `mlaw2 census: 124 full-only members · RIDE the hermetic profile on the planted tree with NO fixture 23 · VACUOUS (named, excluded) 11 · need a fixture 80 · not decidable here 10`.
   The 124 equal the hermetic run's own count at the base (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`,
   20 Nov 2026: `organism_test: 158 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 124 (hermetic: named, not run)`), split
   71 LIVE selftests (`organism_test.mjs:101-175`) · 49 LIVE asserts (`:176-226`) · 4 LIVE modes (`:227-233`), measured 20 Nov 2026.
2. **mlaw2 CLAIMS 23 members** (20 Nov 2026): the selftests of `archivist examiner exchanges fuelboard home_pin
   notes_compiler oura_coach outwork_audit postmatch python_state rails selfknowledge sitting test_coach_v2 teaching_audit
   turn_hook viz widget` (18), and the asserts at `organism_test.mjs:181 182 183 184 223` (the four GUT-WORD LAW asserts and
   "running all # selftests leaves live state untouched"). Unit mfix takes only what is NOT in this list; on an overlap
   mlaw2 wins (row 1205 (2)).
3. **Eleven members go green on the empty plant VACUOUSLY and are excluded** (20 Nov 2026, measured, §2.4): the selftests of
   `gates` (its SCHEMA LIVE clause prints `measured 0`), `heartbeat` (one more NOT MEASURED clause on Z than on T),
   `learn_digest` and `reconcile` (each SWALLOWS an error a child prints on Z: `gate: the registry lanes table is
   EMPTY/unreachable`); asserts `:219` and `:225` (`0 declaration(s) checked`), `:221` and `:222` (their subject IS the state
   dir's files: zero on a plant), `:224` (it brackets the `thalamus` selftest, which needs a fixture, so in the hermetic
   profile it brackets nothing: `organism_test.mjs:2314`); modes `alive` and `atlas` (both answer NOT MEASURABLE on the plant).
4. **Every difference from the mlaw census is named (§2.5).** mlaw's no-fixture class (ZERO, 19 Nov 2026: 23 selftests, 8 asserts and the
   lawpack mode, 19 Nov 2026) is 30 members once lawpack's two entries left LIVE at unit mlaw; mlaw2 rides 23 of them. The 7:
   `gates heartbeat learn_digest reconcile` selftests and asserts `:219` `:225` were ZERO there and are VACUOUS here (mlaw's
   own F5 had flagged the two asserts), and `:224` is VACUOUS in the hermetic profile (mlaw counted it ZERO).
5. **Found, not asked (§3):** (a) `sandbox`, a member the hermetic profile ALREADY runs, is red on the empty plant
   (`the live state file the canary aimed at was never created`) and green on the tracked one: the neutral machine reads it
   over the CI checkout's tracked state today. (b) mode `gates` is 3 RED at `6a6bdff` on the empty plant, all
   state-independent: `TYPE COUNT ROSE — 298 … baseline 296`, `LINT ROSE — no-empty 272, baseline 262`, `LINT ROSE —
   no-unused-vars 85, baseline 82` (mlaw measured no-empty 268 at `224f9b9`); unit mgat's subject, not touched here.
   (c) `blackbox` was red on BOTH trees only because the planter LINKED node_modules (`cpSync` refuses a linked dir); on a
   plant with node_modules copied it is red on Z, green on T: a fixture member, not a RED-BOTH.
6. **The build half cannot be member-file edits alone (FORK F1).** `"live": null` in a `suite/members/<organ>.json` makes the
   hermetic profile spawn the member from ROOT, which on the neutral machine is the checkout WITH his tracked state — the
   very read the LIVE rule forbids (`organism_test.mjs:89-91`). The plant must be built by the suite and the member spawned
   from it; that is one edit of `scripts/organism_test.mjs`, named in §4.

## 1. THE PLANTED TREE (row 1205 (1) (b)) — new files only, `ci/mlaw2/`

- **`ci/mlaw2/plant.mjs`** (the planter) — `node ci/mlaw2/plant.mjs <sha> [--with-tracked-state]` prints one tree's path;
  exports `plant`, `plantEnv`, `memberCmd`, `memberBound`, `liveTables`, `lastLine`, `portDoors`, `freePort`. It builds an LF
  `git archive` of `<sha>` under `os.tmpdir()`, EXCLUDES `dressing-room/state` and re-makes it EMPTY, links (Windows: a
  junction) or, with `copyModules`, copies `node_modules`, then `git init` + one commit inside (lawpack's NUL scan lists the
  tree with `git ls-files`). It never reads, prints or copies a byte of the checkout's state dir. Smoke, 20 Nov 2026:
  `mlaw2 plant HEAD: state dir EMPTY · doors ARSENAL_CORTEX_PORT,ARSENAL_JUDGE_PORT,ARSENAL_SITTING_PORT,ARSENAL_THALAMUS_PORT · member bound read off organism_test.mjs`.
- **`ci/mlaw2/plant_inputs.json`** (its inputs) — `state_plant: "EMPTY"`, `fixtures: []` (plant.mjs throws if any is
  named), the home doors (HOME · USERPROFILE · APPDATA · LOCALAPPDATA · TMPDIR · TMP · TEMP, all under a fresh temp dir),
  the removed names (ANTHROPIC_API_KEY · GITHUB_ACTIONS · ARSENAL_ORGAN · NODE_OPTIONS), the set name
  (ORGANISM_TEST_PROFILE=hermetic), the refusing `claude` + `gemini` shims (sh and .cmd), the port-door pattern read off the
  TREE's own `scripts/*.mjs`, and the rule that every door takes an OS-picked port (listen 0, read, close). No port, wait,
  size or model id is typed: the member bound is `HEAVY_BOUND_MS` read off the tree's `organism_test.mjs:57` (the value
  `MEMBER_BOUND_MS` takes when its door is unset, `:62`).
- **The member command** is the suite's own (`suites()`, `organism_test.mjs:393-397`): `node scripts/<organ>.mjs selftest`,
  `test_coach_v2` bare. `hermetic()`'s loop spawns `test_coach_v2 selftest` too (`:2250`): measured green on Z as well
  (`ci/mlaw2/census/test_coach_v2_selftest_argv.jsonl`, 20 Nov 2026).
- **The contrast tree T** = the same sha with its tracked state (what a fresh clone's full profile reads). Its bytes are his,
  so off T the census keeps exit codes, counts and a 16-hex output-shape hash only — never a line.
- **THE SCRUB** (`plant.mjs lastLine`): the one line kept of a Z run is the error line rather than the runtime banner, with
  the temp path masked, and any line that is a JSON value is WITHHELD. Why it exists: the first census run (stopped, its
  files deleted before any commit; ledger row 7) showed the `captain` selftest printing, as its last line on the empty
  plant, a JSON record its code carries, with a person's name in it. One non-LIVE organ's file name carries a person's
  name; its row in `census/nonlive.jsonl` is masked.

## 2. THE CENSUS (row 1205 (1) (a))

### 2.1 Recipe, per member (every command in `ci/mlaw2/tools/`)

| Tool | What it measures | Last line, 20 Nov 2026 |
|---|---|---|
| `census_selftests.mjs 6a6bdff` | each LIVE selftest on a FRESH Z and a FRESH T per member (a member that writes under the state dir never becomes the next one's fixture; mlaw shared one Z and one T across members), under `statejournal.mjs` on Z | `mlaw2 census 6a6bdff: 71 LIVE selftests · Z exit 0 22 · T exit 0 64 · pool 2 · bound read off organism_test.mjs` |
| `statejournal.mjs` (preload) | every fs read and write under the PLANT's state dir: op, relative path (digit runs folded), existed or not. Never a byte | — |
| `vacuity.mjs 6a6bdff <the 22 Z-green>` | per member, folded output lines on Z vs T: NOT-MEASURED lines, zero-subject lines (`measured 0`, `0 file(s)`, `(0 … checked)`), error lines Z prints and T does not (SWALLOWED) — counts only | vacuous: `gates heartbeat learn_digest reconcile` |
| `census_asserts.mjs 6a6bdff` | modes `integrity laws hermetic alive gates atlas` in the FULL profile (the only one that judges a LIVE member) on Z and T; each LIVE_ASSERTS key matched as `liveAssert()` matches it (`organism_test.mjs:238-243`). `path` is never run | `mlaw2 assert census 6a6bdff: modes integrity,laws,hermetic,alive,gates,atlas · 49 LIVE asserts · bound read off organism_test.mjs` |
| `refusal_probe.mjs 6a6bdff` | the GUT-WORD block's four commands (`organism_test.mjs:834-847`) on Z: does a refusal NAME the gut-word law, or is it a crash? Three of the four asserts read only `exit !== 0` | all four name the law, none crashes |
| `throws.mjs 6a6bdff laws integrity` | where a full-profile mode throws on Z (the first `organism_test.mjs:<n>` stack frame) | laws `:924` (`registry: no live mechanisms row "study_deny_list"`) · integrity `:578` (`ENOENT … brain_config.json`) |
| `census_selftests.mjs 6a6bdff --non-live` | the CONTRAST class: the 58 suite members the hermetic profile already runs, on the same plant (20 Nov 2026) | 57 of 58 green on Z (§3 (a)) |
| `census_selftests.mjs … --copy-modules` | members whose Z red named the planter's linked node_modules | blackbox Z 1 · T 0 · sandbox Z 1 · T 0 |
| `summarize.mjs [--claim] [--table] [--mlaw <file>]` | derives every class and count from `ci/mlaw2/census/*.jsonl`; nothing typed | §0 item 1 |

### 2.2 The classes (rules in `summarize.mjs`'s header)

- **RIDES** — green on Z, not killed, and the vacuity probe finds it judging as much on Z as on T. For an `exit !== 0`
  assert, the refusal must name its own law on Z.
- **VACUOUS** — green on Z by judging less: more NOT-MEASURED lines than T, a zero-subject line T does not print, a
  swallowed error, a `(0 … checked)` name, a subject that IS the state dir's files, or a subject that is another member's run
  while that member stays LIVE. **Named and EXCLUDED.**
- **NEEDS-FIXTURE** — red on Z (or its mode threw at the member's OWN read), green on T. The fixture is what the statejournal
  shows it tried to read and the plant lacked, or the file the throw names.
- **BLOCKED** — an assert unreached on Z because its mode threw EARLIER, at another block's read (`laws` at `:924`, the A9
  block, `:915`); reached and judged on T. It needs at least the file that throw names; its own need is unmeasured on the
  plant. It is a fixture member: mfix's.
- **RED-BOTH** — red on Z and on T on this linux box: not decidable here (§7 N1).

### 2.3 The census, per member (generated 20 Nov 2026: `node ci/mlaw2/tools/summarize.mjs --table`, verbatim; fenced as command output)

```
| organ | `organism_test.mjs` line | class | Z exit · last line | what the plant lacks (statejournal: absent reads) · or the vacuity measured |
|---|---|---|---|---|
| acts | 102 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "act_doors" in <plant>/dressing-room/sta` | acts.jsonl, registry.json |
| archivist | 103 | RIDES | 0 · `archivist selftest: 151 passed, 0 failed` | vacuity: unmeasured 0/0 · zero-subject 0/0 · swallowed no |
| audit | 104 | RED-BOTH | 1 · `audit: registry: no live mechanisms row "doc_claim_extensions" in <plant>/dressi` | registry.json |
| blackbox | 105 | NEEDS-FIXTURE | 1 · `· …and the process still exited 0, which is exactly why exit codes cannot be the` | brain_ledger.jsonl, xray_graph.json |
| bootroom | 106 | NEEDS-FIXTURE | 1 · `Error: bootroom: registry row mutation:forge_profile.json is absent/foreign/targ` | registry.json |
| brain | 107 | RED-BOTH | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| calibration | 108 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "calibration_known_root" in <plant>/dres` | registry.json |
| capsule_bridge | 109 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "game_on_epoch" in <plant>/dressing-room` | registry.json |
| captain | 110 | NEEDS-FIXTURE | 1 · `<a JSON line, withheld by the scrub>` | captain.json |
| capture | 111 | RED-BOTH | 1 · `SELFTEST FAILED` | heartbeat_config.json |
| conductor | 112 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| context | 113 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| context_manifest | 114 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | brain_out/intent_digest/#-#-#.json, registry.json, session_intent.jsonl |
| cortex | 115 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| council | 116 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| daemon_watchdog | 117 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| daily_green | 118 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | captain.json, registry.json |
| daykey | 119 | RED-BOTH | 1 · `no slots — run `node scripts/herd.mjs slots` and paste into tasks_expected.json` | tasks_expected.json |
| deep | 120 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "game_on_epoch" in <plant>/dressing-room` | registry.json |
| distiller | 121 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "modalities_ambient" in <plant>/dressing` | registry.json |
| dmn | 122 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| doubtminer | 123 | NEEDS-FIXTURE | 1 · `SELFTEST FAILED` | capsules, doubtminer_config.json, mirror_manifest.json |
| examiner | 125 | RIDES | 0 · `ALL CHECKS PASSED` | output shape equal on Z and T |
| dugout | 124 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| exchanges | 126 | RIDES | 0 · `exchanges selftest: 20 passed, 0 failed` | output shape equal on Z and T |
| flow_atlas | 127 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| forge_session | 128 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "core_axes_default" in <plant>/dressing-` | concepts.json, registry.json |
| fuelboard | 129 | RIDES | 0 · `ALL CHECKS PASSED` | output shape equal on Z and T |
| gaffer_brain | 130 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "probe_kinds" in <plant>/dressing-room/s` | brain_out/nightshift/field_probes.json, dossier_weights.json, registry.json |
| gate | 131 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| gate_tune | 132 | NEEDS-FIXTURE | 1 · `Error: gate_tune: registry row mutation:thalamus_config.tiers is absent/foreign/` | registry.json |
| gates | 133 | VACUOUS | 0 · `gates selftest: 32 passed, 0 failed` | vacuity: unmeasured Z 1 / T 1 · zero-subject 1/0 · swallowed no |
| heartbeat | 134 | VACUOUS | 0 · `ALL CHECKS PASSED (1 NOT MEASURED: DEFAULTS.order vs canon heartbeat_config.json` | vacuity: unmeasured Z 3 / T 1 · zero-subject 0/0 · swallowed no |
| herd | 135 | RED-BOTH | 1 · `· DAY-KEY — interval tasks and daemons are stated as CLOCK by the law itself (ne` | xray_graph.json |
| learn_digest | 139 | VACUOUS | 0 · `learn_digest selftest 16/16 — all clauses hold` | vacuity: unmeasured Z 0 / T 0 · zero-subject 0/0 · swallowed YES |
| home_pin | 136 | RIDES | 0 · `home_pin selftest: 16 passed, 0 failed` | output shape equal on Z and T |
| learnstate | 140 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| limits | 141 | NEEDS-FIXTURE | 1 · `2 FAILED (70 passed)` | afferent.jsonl, brain_ledger.jsonl, calibration.json, capsules, cards.json, distiller_latency.jsonl … (20) |
| manager | 142 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "game_on_epoch" in <plant>/dressing-room` | registry.json |
| mcp-memory | 143 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| models | 144 | NEEDS-FIXTURE | 1 · `models check · config scan: 0 file(s) · hits 0 · declared 0 (fuelboard_config.js` | brain_config.json, models.json |
| nightshift | 145 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| notes_compiler | 146 | RIDES | 0 · `notes_compiler selftest: 45 passed, 0 failed` | output shape equal on Z and T |
| oura_coach | 147 | RIDES | 0 · `(note: intake_log.json(fixture) is not valid JSON (Unexpected token ']', ..." ["` | output shape equal on Z and T |
| outbox | 148 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| outwork_audit | 149 | RIDES | 0 · `ALL CHECKS PASSED (17 passed, 0 failed)` | output shape equal on Z and T |
| postmatch | 150 | RIDES | 0 · `ALL CHECKS PASSED` | output shape equal on Z and T |
| python_state | 151 | RIDES | 0 · `python_state selftest: 30 passed, 0 failed` | output shape equal on Z and T |
| reconcile | 153 | VACUOUS | 0 · `ALL CHECKS PASSED (42 passed, 0 failed)` | vacuity: unmeasured Z 0 / T 0 · zero-subject 0/0 · swallowed YES |
| rails | 152 | RIDES | 0 · `rails selftest: 106 passed, 0 failed` | output shape equal on Z and T |
| rejirah | 154 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "game_on_epoch" in <plant>/dressing-room` | capsules, registry.json |
| samjhao | 155 | NEEDS-FIXTURE | 1 · `samjhao: 50 passed, 2 failed` | capsules, registry.json, samjhao.jsonl |
| scout | 156 | NEEDS-FIXTURE | 1 · `Error: ENOENT: no such file or directory, open '<plant>/dressing-room/state/doss` | dossier_weights.json |
| selfknowledge | 157 | RIDES | 0 · `ALL CHECKS PASSED` | output shape equal on Z and T |
| services | 158 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| setpiece | 159 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| shadow | 160 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "interruption_types" in <plant>/dressing` | pitch_read_history.jsonl, registry.json, reps_log.jsonl |
| sprintsync | 162 | NEEDS-FIXTURE | 1 · `TypeError: Cannot read properties of null (reading 'id')` | registry.json |
| talk | 163 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| sitting | 161 | RIDES | 0 · `sitting selftest: 99 passed, 0 failed` | vacuity: unmeasured 6/6 · zero-subject 7/7 · swallowed no |
| tasks | 164 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "task_kinds" in <plant>/dressing-room/st` | registry.json |
| test_coach_v2 | 166 | RIDES | 0 · `==========================================================================` | output shape equal on Z and T |
| teaching_audit | 165 | RIDES | 0 · `ALL CHECKS PASSED (151 passed, 0 failed)` | output shape equal on Z and T |
| thalamus | 167 | NEEDS-FIXTURE | 1 · `(Use `node --trace-warnings ...` to show where the warning was created)` | dossier.json, registry.json, salience_ledger.jsonl, thalamus_config.json, workspace.json |
| throwin | 168 | NEEDS-FIXTURE | 1 · `Error: registry: no live mechanisms row "modalities_interactive" in <plant>/dres` | registry.json |
| timeaudit | 169 | NEEDS-FIXTURE | 1 · `Time-Auditor error: buckets.json not found at <plant>/dressing-room/state/bucket` | buckets.json |
| turn_hook | 170 | RIDES | 0 · `ok   R-01 planted both ways (forks row 639) — a module an earlier callee importe` | output shape equal on Z and T |
| viz | 171 | RIDES | 0 · `ALL CHECKS PASSED` | output shape equal on Z and T |
| watchman | 172 | NEEDS-FIXTURE | 1 · `Error: gate: the registry lanes table is EMPTY/unreachable — the consumer map ca` | registry.json |
| widget | 173 | RIDES | 0 · `widget selftest: 19 passed, 0 failed` | output shape equal on Z and T |
| xray | 174 | RED-BOTH | 1 · `· rejirah.mjs really does contain NUL bytes (the trap is still live)` | xray_graph.json |

| line | class | mode | Z | T | assert key (folded) |
|---|---|---|---|---|---|
| 177 | NEEDS-FIXTURE | laws | unreached | ok | A# · PLANTED VIOLATION — an off-list organ and a deny-listed one are both caught |
| 178 | NEEDS-FIXTURE | laws | unreached | ok | A# · both study skills were readable (a gate that cannot see its subject is not  |
| 179 | RED-BOTH | laws | unreached | FAIL | A# · every organ the two study skills name is on the registry's study_entry_poin |
| 180 | NEEDS-FIXTURE | laws | unreached | ok | A# · no study skill offers a DAEMON or a transport as a runnable command — wakin |
| 181 | RIDES | laws | ok | ok | GUT-WORD LAW · capture.mjs REFUSES a rep with no gut-word (exit non-zero) |
| 182 | RIDES | laws | ok | ok | GUT-WORD LAW · capture.mjs rejects a gut-word outside knew\|shaky\|guessed |
| 183 | RIDES | laws | ok | ok | GUT-WORD LAW · rejirah.mjs holds the SAME law on a Re-Jirah round |
| 184 | RIDES | laws | ok | ok | GUT-WORD LAW · rejirah.mjs rejects an out-of-vocabulary gut-word |
| 185 | BLOCKED | laws | unreached | ok | HIS ANSWERS ARE HIS · ...and the same call against a SANDBOX ledger is allowed — |
| 186 | BLOCKED | laws | unreached | ok | HIS ANSWERS ARE HIS · a FIXTURE may NEVER write a guess into his LIVE samjhao —  |
| 187 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · RUNTIME ASSERTION: an idempotency key may never be executed  |
| 188 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · THE # AUG REPLAY: his one ask fired #x from # processes make |
| 189 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · no organ spawns work for him OUTSIDE tasks.mjs (a bare call  |
| 190 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · the act lane's `job` verb names tasks.mjs as its owner (the  |
| 191 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · ...and an axis he never reached is UNTOUCHED — only what was |
| 192 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · NO NEW FACTS — every samjhao unit of all four topics asserts |
| 193 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · PREDICT-THEN-REVEAL is a gate: an answer before the guess is |
| 194 | RED-BOTH | laws | unreached | FAIL | LOAD ZERO BLOCK # · THE COLDNESS RATCHET: once samjhao OPENS an axis, the Re-Jir |
| 195 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · THE RATCHET: close is REFUSED while units/doubts are open, a |
| 196 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · a concept with no locked capsule is REFUSED — samjhao is REV |
| 197 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · a samjhao takes its id from the TASK layer, so it resumes on |
| 198 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · all four topics are RUNNABLE and every one is a #-axis revis |
| 199 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · before any samjhao, the cold round DOES serve the capsule's  |
| 200 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · the GUT-WORD LAW holds here too — samjhao refuses knew\|shak |
| 201 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · a row that would ASK him for a decision is refused unless it |
| 202 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · output produced with NO session open reaches the next surfac |
| 203 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · the dead-man's switch exists and does NOT fire on a road he  |
| 204 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · ...and a dugout REOPEN does not restart it — the row stays c |
| 205 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · an ask created at the GAFFER door is open on the agenda |
| 206 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · no ask may be created without a CLOSE PATH — an `ask` with n |
| 207 | BLOCKED | laws | unreached | ok | LOAD ZERO BLOCK # · the relay's DELIVERED stamp CLOSES it — through the owner, f |
| 208 | BLOCKED | laws | unreached | ok | ONE SCHEDULE — all THREE derivations agree that a pre-epoch capsule is not due:  |
| 209 | BLOCKED | laws | unreached | ok | ONE SCHEDULE — and all three agree on the SAME open round and the SAME due date  |
| 210 | BLOCKED | laws | unreached | ok | S# · ...and a spool that cannot open DEGRADES rather than throws — the nerve's f |
| 211 | BLOCKED | laws | unreached | ok | S# · ...and it marks its own row delivered on a #xx, so a healthy bus never leav |
| 212 | BLOCKED | laws | unreached | ok | S# · ...and the idempotence set is seeded from the WHOLE afferent file at boot,  |
| 213 | BLOCKED | laws | unreached | ok | S# · NEW LANE ONLY — the spool names spool.db and NO existing state file (the ru |
| 214 | BLOCKED | laws | unreached | ok | S# · THE CONSUMER IS IDEMPOTENT — thalamus.ingest() refuses an event_id it has a |
| 215 | BLOCKED | laws | unreached | ok | S# · THE NERVE WRITES AHEAD — hooks/afferent-post.mjs spools the event BEFORE it |
| 216 | BLOCKED | laws | unreached | ok | S# · THE THALAMUS DRAINS ON BOOT, AFTER listen() — the port must be open first,  |
| 217 | BLOCKED | laws | unreached | ok | S# · node:sqlite IS AVAILABLE on this runtime, so the write-ahead is REAL and no |
| 218 | NEEDS-FIXTURE | laws | FAIL | ok | SNAPSHOT RIDES THE BUILD · every scheduled task a setup script registers is KNOW |
| 219 | VACUOUS | integrity | ok | ok | a declared external producer is a REAL organ in this tree (# declaration(s) chec |
| 220 | NEEDS-FIXTURE | integrity | unreached | ok | all # brain triggers armed anywhere in the organism reach live work (a declared  |
| 221 | VACUOUS | integrity | ok | ok | every state .json parses (the bus is the contract between organs) |
| 222 | VACUOUS | integrity | ok | ok | every state .jsonl parses on every row (one bad row poisons a whole reader) |
| 223 | RIDES | hermetic | ok | ok | running all # selftests leaves live state untouched |
| 224 | VACUOUS | hermetic | ok | ok | the one sanctioned selftest write lands in the organ's OWN log, never on the sta |
| 225 | VACUOUS | integrity | ok | ok | …and that organ really BUILDS that brain_out directory — a producer that names t |

| mode | class | measured on Z |
|---|---|---|
| path | NETWORK | not run: mirror.mjs reaches his gist (the port class forbids a live service) |
| alive | VACUOUS | ok ALIVE — bare checkout: pulse answered NOT-MEASURABLE and exited 0 (measurability is an answer, silence is not) |
| gates | RED-BOTH | RED  LINT ROSE — no-unused-vars 85, baseline 82. A gate may only get stricter. |
| atlas | VACUOUS | ok FLOW ATLAS — bare checkout: no IR/atlas built here; NOT MEASURABLE is the honest answer |
```

### 2.4 How vacuity was measured, member by member (`ci/mlaw2/census/vacuity.jsonl`, `refusal.jsonl`, 20 Nov 2026)

- Of the 22 selftests green on Z, 14 print an output SHAPE equal on Z and T (paths masked, digits folded): the plant changes
  nothing they print. `archivist`, `sitting` differ only by temp paths and session ids (NOT-MEASURED 0/0 and 6/6,
  zero-subject 0/0 and 7/7, no swallowed error): they ride.
- `gates` selftest: Z prints `✓ SCHEMA LIVE — 4 schema(s) on disk, … (measured 0 · not in this checkout: captains_call.json,
  laws_register.json, models.json, registry.json)`; T measures them. One clause judges an empty set: VACUOUS.
- `heartbeat`: Z prints 3 NOT-MEASURED lines, T 1 (`DEFAULTS.order vs canon parity — NOT MEASURED (heartbeat_config.json
  unreadable)`): VACUOUS.
- `learn_digest`: all 16 clauses hold on Z, but its render spawns `learnstate.mjs nextup` (`learn_digest.mjs:120`), which
  throws on the empty registry; the digest catches it and renders `(learnstate nextup did not answer …)`, and its clauses
  pass over that degraded render. `reconcile` likewise spawns `brain.mjs gate json` (`reconcile.mjs:66`) and passes over its
  error. SWALLOWED, so VACUOUS.
- Asserts `:181 :183 :184` read only `exit !== 0`. `refusal_probe.mjs` ran the block's own commands on Z: capture prints
  `GUT-WORD LAW: --gut is what he committed BEFORE answering. No gut-word, no rep. Never re-graded after.`; rejirah prints its
  gut-word usage line and `rejirah: gut must be knew|shaky|guessed (got "maybe")`; no stack, no ENOENT. `:182` matches its
  rejection text. They refuse for their own law: they ride.
- `:219` prints `(0 declaration(s) checked)` on Z, and `:225` (its `…and` sibling in the same block, `organism_test.mjs:477-478`)
  judges the same zero-entry set: VACUOUS. `:221` / `:222`: their subject is every file of the state dir; a plant has zero.
- `:224` brackets `thalamus selftest` (`:2309-2316`); `thalamus` is NEEDS-FIXTURE, and the hermetic profile spawns it only
  when it is not LIVE (`:2314`), so in that profile the snapshot brackets no run: VACUOUS (it judged ok in the full-profile
  census only because the full profile spawns thalamus regardless).
- `:223` (the trip metric, `:2245-2246`) hashes the state dir before and after the selftest loop. On an empty plant every
  write a selftest makes is a CREATION, which the before/after comparison sees, so it judges: it rides — over the members
  spawned IN the plant (FORK F2).
- Modes: `alive` prints `ALIVE — bare checkout: pulse answered NOT-MEASURABLE and exited 0` on Z and T alike on linux;
  `atlas` prints `FLOW ATLAS — bare checkout: no IR/atlas built here; NOT MEASURABLE is the honest answer` on Z (T reds):
  both VACUOUS on the plant. `gates` is RED on Z and T (§3 (b)). `path` is never run (port class: mirror reaches his gist).

### 2.5 Every difference from the mlaw census (`da6d5e8:ci/mlaw/MLAW_SPEC.md` §2, measured 19 Nov 2026 at `224f9b9`)

| # | mlaw (19 Nov 2026, `224f9b9`) | mlaw2 (20 Nov 2026, `6a6bdff`) | Why |
|---|---|---|---|
| D1 | 126 full-only | 124 | lawpack's selftest and mode left LIVE at unit mlaw (`organism_test.mjs:137-138`, `:231`); measured by the hermetic LIVE count |
| D2 | ZERO selftests incl. `gates heartbeat learn_digest reconcile` | VACUOUS, excluded | mlaw classed on the exit only; mlaw2 measured what each judged on Z vs T (§2.4) |
| D3 | asserts 201 / 207 ZERO, with a vacuity caveat (its F5) | `:219` / `:225` VACUOUS | measured: `(0 declaration(s) checked)` |
| D4 | assert 206 ZERO | `:224` VACUOUS in the hermetic profile | its subject `thalamus` stays LIVE (`:2314`) |
| D5 | `blackbox` RED-BOTH | NEEDS-FIXTURE (brain_ledger.jsonl, xray_graph.json) | its red on T was the planter's linked node_modules; re-measured with them copied (§3 (c)) |
| D6 | "PLANT" asserts 37, judged on R (the reason-named files COPIED from his tracked set) | NEEDS-FIXTURE 5 + BLOCKED 32 | mlaw2 plants nothing (no fixture is the question); 32 sit behind the `laws` throw at `:924` and are unreached on Z |
| D7 | modes: gates SPLIT · alive PLANT-UNRUN · atlas SUBJECT | gates RED-BOTH · alive VACUOUS · atlas VACUOUS | gates is 3 RED state-independently (§3 (b)); alive answered NOT-MEASURABLE on Z here as there; atlas's Z ok is NOT MEASURABLE |
| D8 | the member command: the `package.json` chain segment; wait = `run()`'s default; profile env REMOVED; one shared Z and T | the suite's own `suites()` argv; the member bound off `:57`; `ORGANISM_TEST_PROFILE=hermetic` SET; a fresh Z and T per member | what the hermetic profile would actually spawn; no cross-member fixture |
| D9 | the mlaw census ran under a port probe; one fixed port: `conductor.mjs:990` connects to 59999 (its F6) | `conductor` is NEEDS-FIXTURE here, so not claimed; F6 B (OS-picked) is mlaw's ruling (row 1137 (3)) | not re-measured |

## 3. FOUND BY THIS CENSUS, NOT ASKED (each named, none touched)

- **(a) `sandbox` reads the checkout's tracked state in the hermetic profile today.** It is NOT in LIVE_SELFTESTS (the
  `--non-live` census lists it as a member the profile runs), yet on the empty plant (node_modules copied) it reds:
  `· …and the live state file the canary aimed at was never created`, and on T it is green. Its statejournal names
  `brain_ledger.jsonl` absent. So the neutral machine has been judging it over his tracked bytes. 57 of the 58 non-LIVE
  members are green on Z (20 Nov 2026), which is the measurement that decides FORK F1's option B. Named for the architect
  (FORK F6); not this unit's to fix.
- **(b) Mode `gates` is 3 RED at `6a6bdff`, independent of state** (`gates.mjs report` on the empty plant, 20 Nov 2026):
  `gates lint · 357 error(s) · 2 warning(s) · no-empty 272 · no-unused-vars 85 · (directive) 2 (frozen: no-empty 262 ·
  no-unused-vars 82 · warnings 2)` and `RED  TYPE COUNT ROSE — 298 checkJs diagnostics, baseline 296`; last line
  `gates: 3 RED — a gate may only get stricter (§10-D rule 6)`. mlaw measured one RED there (no-empty 268, 19 Nov 2026).
  Its schema half is `0/0 state file(s) match … 4 NOT MEASURED` on the plant. Unit mgat's (row 1137 (5) F8 A).
- **(c) A planter that LINKS node_modules breaks any member that `cpSync`s the tree** (`sandbox.mjs:79`,
  `organism_test.mjs:2611` in `sandbox()`): `Error: Recursive option not enabled, cannot copy a directory: <plant>/node_modules/`.
  ms1's witness trees link too (`organism_test.mjs:2974`). The planter keeps both doors (`copyModules`).
- **(d) The `laws` mode throws on a bare state dir at `:924`** (the A9 block's registry read), so every LIVE assert after
  it is unreached on a plant; `integrity` throws at `:578` (`ENOENT … brain_config.json`, `:220`'s own read). Neither is
  reached in the hermetic profile today, because `skipLive` skips those blocks whole (`:251-257`).

## 4. THE BUILD HALF (named, not built: cut from main after unit mhot lands, row 1205 (1))

### 4.1 Each move the census supports, in the shape a member file would carry it

mhot's member file, read at `claude/mhot-build fb54819` (20 Nov 2026): `suite/members/<organ>.json` =
`{"suite": …, "argv": […], "live": "<reason>" | null}`, and `suiteRoll` refuses any other key set
(`organism_test.mjs:232` on that branch: `holds keys {…}: a member file holds exactly suite, argv and live`). Every one of
the 18 claimed selftests has a member file there with `live` a reason (checked organ by organ, 20 Nov 2026; ledger).

| organ | suite (main `6a6bdff` chain = mhot member file) | argv | the move (FORK F1 A shape) |
|---|---|---|---|
| archivist · examiner · fuelboard · home_pin · outwork_audit · postmatch · rails · selfknowledge · teaching_audit · turn_hook · viz | organism:selftest | `["selftest"]` | `"live": null, "plant": "empty"` |
| exchanges · notes_compiler · oura_coach · python_state · sitting · widget | squad:selftest | `["selftest"]` | `"live": null, "plant": "empty"` |
| test_coach_v2 | squad:selftest | `[]` | `"live": null, "plant": "empty"` |

`"plant": "empty"` is the fourth key FORK F1 A asks for; under F1 B the move is `"live": null` alone and the plant is
every hermetic member's. **The asserts are not member files in either shape**: mhot folds the selftest table only, and
LIVE_ASSERTS stays in `organism_test.mjs` (`:116` on mhot-build). Their move is FORK F3.

### 4.2 If mhot returns a fork that undoes the fold (row 1137 (4) as written)

Each of the 18 lines leaves `LIVE_SELFTESTS` (`organism_test.mjs:102-174` at `6a6bdff`), leaving the comment
`// "<organ>" LEFT this table at unit mlaw2 (forks rows 1137 (4) / 1205 (1)): green on the planted tree with no fixture,
ci/mlaw2/MLAW2_SPEC.md §2` in its place (the lawpack precedent, `:137-138`), and the organ joins one new frozen table,
`PLANTED_SELFTESTS`, beside it. The five assert keys leave `LIVE_ASSERTS` (`:181-184`, `:223`) the same way.

### 4.3 The code path (one edit of `scripts/organism_test.mjs`, in either shape)

- **P1 · `plantedTree()`**: built once per run under `os.tmpdir()` by the recipe of `ci/mlaw2/plant.mjs` — an LF
  `git ls-files` copy of ROOT's own HEAD (ms1's `lfTree`, `:2917`), the state dir EXCLUDED and made EMPTY, node_modules
  COPIED (§3 (c)), the home doors and the refusing shims of `plant_inputs.json`, each `ARSENAL_*PORT` door OS-picked. The
  suite owns it; `ci/mlaw2/plant.mjs` stays the census tool (the suite imports no file of `ci/`).
- **P2 · a moved selftest is spawned from the plant** (`suites()` `:391-407`, `hermetic()`'s loop `:2250`): `run([join(P,
  "scripts", f), …argv], { cwd: P, env: plantEnv })`, with its key (`runKey`, `:378`) carrying the plant's cwd so the
  one-run reuse of row 880 (1) still pairs the two calls.
- **P3 · the moved GUT-WORD block** (`:832-848`) takes `sandbox(P)`: `sandbox()` (`:2606-2611`) copies ROOT's
  `dressing-room`, so its source becomes the plant's.
- **P4 · the trip metric `:223`** hashes the PLANT's state dir around the moved members' runs (`:2245-2246`); under F2 A
  it still never walks ROOT's state.
- Owners: `organism_test.mjs:26` — `LAWS: READ-ONLY on dressing-room/state`: the plant lives under `os.tmpdir()`, so the law
  holds; no state file has a writer that changes. `ci/mlaw2/*` writes only under `os.tmpdir()`.

## 5. WITNESS CLAUSES (for the build: each plant RED on base `6a6bdff`, GREEN on the build)

All under `os.tmpdir()`, LF trees, OS-picked ports through the env doors only, the refusing shims first on PATH, no daemon
reached, nothing restarted, every wait the tree's own member bound.

| Clause | Plant | Base `6a6bdff` | Build |
|---|---|---|---|
| **W1 MOVED-JUDGED** | the hermetic run of the build tree | RED: each of the 18 prints `LIVE selftest <organ>` | GREEN: none prints LIVE; each is judged as `SUITE MEMBER · <organ> selftest exits 0` |
| **W2 SPAWNED-IN-PLANT** | the W1 run under `ci/mlaw2/tools/statejournal.mjs` aimed at the CHECKOUT's state dir | RED: (vacuously, no moved member runs) → the clause demands ≥ 1 moved run journaled | GREEN: ≥ 18 moved runs, and zero reads under the CHECKOUT's state dir by any of them |
| **W3 NO-HIS-BYTES** | the build's plant | — | GREEN: the plant's state dir holds zero files before the first moved run (`plant_inputs.json fixtures: []`) |
| **W4 VACUOUS-STAY** | the build's tables / member files | — | GREEN: the 11 VACUOUS members of §0 item 3 are still LIVE (none moved by this unit) |
| **W5 RATCHET** | the build's LIVE set against the base's | — | GREEN: every build LIVE name is a base LIVE name, and the removed ones are exactly the 23 of §0 item 2 |
| **W6 ASSERTS-JUDGED** (F3 A) | the hermetic run | RED: `:181-184`, `:223` print LIVE | GREEN: judged, and `refusal_probe.mjs` on the plant shows each refusal naming its law |

## 6. MUTANTS (one per clause; each must turn its clause RED on the build)

| Clause | Mutant |
|---|---|
| W1 | put `live` back to its reason in one moved member file (or its line back into LIVE_SELFTESTS) |
| W2 | spawn one moved member with `cwd: ROOT` instead of the plant |
| W3 | copy the checkout's `dressing-room/state` into the plant |
| W4 | move `heartbeat` (VACUOUS) out of LIVE |
| W5 | add one new LIVE name |
| W6 | make `sandbox()` copy ROOT's state for the GUT-WORD block |

## 7. THE PORT CLASS (row 1053)

No tool here binds a fixed port: every `ARSENAL_*PORT` door gets `freePort()` (listen 0 on 127.0.0.1, read, close;
`plant.mjs`). No live service is named or reached; mode `path` (mirror reaches his gist) is never run. Nothing POSTs at a
daemon and nothing restarts. Every wait is the tree's own `HEAVY_BOUND_MS` (`organism_test.mjs:57`), read, never typed.
The census tools carry no `ci/mlaw2/witness_mlaw2.mjs`, so the neutral machine's `witnesses` member (`:2867-2871`, any
`ci/<unit>/witness_<unit>.mjs`) does not run them.

## 8. FORKS (each the architect's to rule)

- **F1 · how a moved member says "run me on the plant".** (A) a fourth member-file key `"plant": "empty"`, and mhot's
  `suiteRoll` key check (`organism_test.mjs:232` on mhot-build) admits it · (B) `"live": null` alone, and the hermetic
  profile spawns EVERY non-LIVE member from the plant (stricter: each hermetic member then proves it reads no state) ·
  (C) `"live": null` and the member runs from ROOT (forbidden: on the neutral machine ROOT holds his tracked state).
  **Recommend A now, B as its own unit.** Decides: the `--non-live` census — B holds iff all 58 are green on Z; measured
  57 (20 Nov 2026), `sandbox` red (§3 (a)).
- **F2 · the trip metric `:223`** — (A) it hashes the plant's state dir only (its subject becomes "no moved member writes
  the state bus") · (B) it hashes the plant AND keeps ROOT's walk in the full profile only. **Recommend A** (the full
  profile is unchanged either way). Decides: W2 on the build.
- **F3 · the five claimed asserts are not member files** (LIVE_ASSERTS is not folded by mhot). (A) the build moves them too,
  as `organism_test.mjs` edits (P3 / P4) · (B) a separate unit · (C) they stay LIVE until a fold of LIVE_ASSERTS.
  **Recommend A**: P1 is an `organism_test.mjs` edit in any case (§0 item 6).
- **F4 · the swallowed-error class** (`learn_digest`, `reconcile`). (A) VACUOUS, excluded (this census) · (B) they ride,
  since every clause they print holds. **Recommend A**: their render or verdict on Z includes a child's failure that T does
  not have. Decides: a clause-level map of which clause reads the child (their owners' call).
- **F5 · `sandbox` (§3 (a))** — (A) it joins LIVE_SELFTESTS / its member file gets a reason (the table grows: forbidden by
  the ratchet of row 1022 (3) unless ruled) · (B) a fixture for its canary from mfix · (C) its owner makes the canary aim at
  a file it plants itself. **Recommend C.** Decides: `sandbox.mjs selftest` green on Z.
- **F6 · mode `gates`' 3 RED (§3 (b))** — unit mgat's, named so it is not lost; the counts rose since mlaw's census.
- **F7 · BLOCKED asserts (32, 20 Nov 2026)** — (A) mfix's, each needing at least `registry.json`'s `study_deny_list` row for
  the A9 throw · (B) a guard that lets `laws` reach later blocks on a bare state dir, then re-census. **Recommend B before
  A**: it is the only way to measure the 32 on a plant with no fixture.

## 9. NAMED NOT GUESSED (what the cloud cannot reach; what measures it on his laptop)

- **N1 · the census on Windows** (the neutral machine is `windows-latest`, `.github/workflows/suite.yml:61`; this census is
  linux). Six selftests are RED-BOTH here (`audit brain capture daykey herd xray`), and `alive` answered NOT-MEASURABLE.
  Measured by: `node ci/mlaw2/tools/census_selftests.mjs 6a6bdff` and `node ci/mlaw2/tools/census_asserts.mjs 6a6bdff` on
  his laptop (git and tar are on PATH there; plant.mjs makes a junction for node_modules on win32).
- **N2 · `:179` and `:194` red on the fresh clone's tracked state** (T), as mlaw's 161 / 176: green on HIS state? Measured
  by `node scripts/organism_test.mjs laws` on his laptop, those two lines.
- **N3 · the timing-sensitive riders under CI load** (`turn_hook` names a wall-clock dependence in its LIVE reason): rode
  at pool 2 here. Measured by the build's own neutral run (W1).
- **N4 · whether the 18 riders ride on his node version** — measured here on node 22; CI legs are node 22 and node 24.

## 10. FILES A BUILD WOULD TOUCH

`scripts/organism_test.mjs` (P1-P4; the assert keys of F3 A) · `suite/members/<organ>.json` for the 18 (F1 A: `live: null`,
`plant: "empty"`) — or, if mhot is undone, the LIVE_SELFTESTS lines (§4.2) · `ci/mlaw2/witness_mlaw2.mjs` and
`ci/mlaw2/BASE` (new, the build seat's) · `ci/mlaw2/run_mutants_mlaw2.mjs` (new). Beyond them, only as forks: mhot's
`suiteRoll` key check (F1 A) · `scripts/sandbox.mjs` (F5 C) · `scripts/gates.mjs` / its baseline (F6, mgat's). Not touched by
any change: `package.json`, `.github/workflows/suite.yml`, any state file, any organ.

## 11. THE NEUTRAL MACHINE ON THIS BRANCH

Read with no token: `R=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##'); curl -s https://api.github.com/repos/$R/commits/<sha>/check-runs` (the slug is derived, not typed).

