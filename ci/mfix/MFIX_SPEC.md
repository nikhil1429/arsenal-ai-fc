# MFIX SPEC — unit mfix (forks row 1137 (4) / row 1205 (2)), cloud spec seat

Written 20 Nov 2026 by the cloud spec seat (unit mfix). A SPEC, not a build: nothing on main moved, no PR, no live
model call, no state file of the checkout read into any output. Branch `claude/mfix-spec`, cut from `origin/main`
**`6a6bdff`** (`git fetch origin main && git checkout -b claude/mfix-spec FETCH_HEAD`, 20 Nov 2026 UTC; mlaw `3f22388`
and mcov `cebe3eb` are on it). Every count below is printed by a command in `ci/mfix/tools/` over the rows in
`ci/mfix/census/`; the ledger is `ci/mfix/LEDGER.jsonl` (one row per act, with its last line).

## 0. HEADLINE

1. **The base, measured (20 Nov 2026).** `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` at
   `6a6bdff` printed `organism_test: 158 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 124 (hermetic: named, not run)`.
   The LIVE names split 71 selftests · 49 asserts · 4 modes (lawpack left at mlaw). This is two fewer than the mlaw
   census's 126 at `224f9b9`, and only by the lawpack mode and selftest.
2. **The split with mlaw2, by class (row 1205 (2): on an overlap mlaw2 wins).** `node ci/mfix/tools/census.mjs 6a6bdff`
   re-ran the mlaw census at this base: the same three classes, member for member. mlaw2 claims ZERO (green on an EMPTY
   plant, no fixture). **mfix takes PLANT** (red on the empty plant, green on the tracked state) plus what mlaw2
   EXCLUDED AS VACUOUS and a fixture can give a subject (`learn_digest`, `reconcile`, `heartbeat`, asserts `:219`
   `:225`, mode `atlas`: §2.2). mlaw2's own census (`cf1785c`) claims 18 ZERO selftests and 5 asserts; **no member is
   named by both units** (§12).
3. **The plants are much smaller than the LIVE reasons say.** `ci/mfix/tools/plantcheck.mjs` (one-at-a-time removal over
   the files each member really reads, measured by a read-set probe) shows **`registry.json` alone is the minimal plant
   of almost every PLANT selftest**, and inside it only `tables.mechanisms` and/or `tables.lanes`. `captain.json`,
   named in many LIVE reasons, is load-bearing for `captain` alone. The full line is in §1.
4. **Most of it can be synthetic, and the rest is code, not his data.** A transform that keeps only the row ids the code
   asks for by name (`subject`, `id`), turns every other string into a token and DROPS `tables.rulings` (his words) keeps
   18 of the 42 PLANT selftests green by itself (20 Nov 2026, `synth.mjs`). Every one of the other 24 is green once a
   CLOSED list stays verbatim — one registry row for most of them (`game_on_epoch`, the GAME-ON stamp, is the commonest),
   or one or a few keys of one config file — and everything else stays synthetic (`coupled.mjs`, `coupled_keys.mjs`;
   each greedy run ends on a measured green). Those rows are the organism's own enumerations, moved out of code by design
   (`scripts/registry.mjs:8-13`: "TABLES OF ROWS that until this rung lived as literals inside twelve mechanisms").
   Whether a fixture may carry them verbatim is **FORK F1**, the one ruling this unit turns on.
5. **The fixture can be written by its OWNER inside the plant.** `registry.mjs set --table mechanisms --json …` in an
   EMPTY planted tree exits 0 (`op: added`) and creates the file (`ci/mfix/LEDGER.jsonl`, act `owner-seed`). So the
   owners-only law holds inside the plant too: the seeder is a client of `registry.mjs`'s CLI, never a second writer.
   Two more state files need no authored byte at all: `xray.mjs build` and `registry.mjs laws collect` derive
   `xray_graph.json` and `laws_register.json` from code in an empty tree (exit 0).
6. **Found, not asked: mode `atlas` is VACUOUS on an empty plant.** `organism_test.mjs:2838-2839` asserts `true` when
   `xray_graph.json` or `flow_atlas.json` is absent. mlaw counted it SUBJECT. With the owner-derived graph plus
   `flow_atlas.mjs build` (which needs a registry plant) it judges the code itself (§4, W6).

## 1. THE CENSUS AT THE BASE (`node ci/mfix/tools/summarize.mjs`, 20 Nov 2026, the lines it prints)

```
selftests 71: ZERO 22 (mlaw2) · PLANT 42 (mfix) · RED-BOTH 7
plantcheck: 42/42 measured · minimal plant green 42 · with a load-bearing key 41 · presence-only (no bearing key) models
minimal-plant files: registry.json 35 · dossier_weights.json 3 · doubtminer_config.json 2 · captain.json 1 · tasks_expected.json 1 · brain_config.json 1 · xray_graph.json 1 · twin_config.json 1 · reps_log.jsonl 1 · ladder_config.json 1 · buckets.json 1 · thalamus_config.json 1
synthetic (ids transform of the minimal plant): 42 measured · green 18 · red acts,bootroom,capsule_bridge,captain,conductor,cortex,deep,distiller,dmn,daily_green,forge_session,gate,gate_tune,learnstate,nightshift,samjhao,rejirah,scout,shadow,sprintsync,tasks,throwin,timeaudit,thalamus
code-coupled rows: 18 members measured · green with all rows verbatim 18 · rows kept verbatim: capsule_bridge game_on_epoch · bootroom mutation:forge_profile.json · acts act_doors · cortex modalities_ambient · distiller modalities_interactive+modalities_ambient · deep game_on_epoch · daily_green game_on_epoch · forge_session core_axes_default · learnstate game_on_epoch · gate dmn_rollout+dmn_counter+ns_probe_bank+ns_distractors+ns_pre_answers+ns_grade_probes+cortex_wake+cortex_consolidate+thalamus_adjudicator+council_chair+gaffer_judge+gaffer_verify+mission_m03+haiku_pulse+selfknowledge+dmn_bg_drain+ns_field_probes+compiled_notes+notes_corrections+capsule_backups+brief_log+rejirah_log · samjhao game_on_epoch · gate_tune mutation:thalamus_config.tiers · nightshift game_on_epoch · rejirah game_on_epoch · throwin modalities_interactive · shadow interruption_types · sprintsync game_on_epoch · tasks task_kinds+dmn_counter
code-coupled keys (config files): captain captain.json number of 12 · scout dossier_weights.json bucket_round_map of 11 · timeaudit buckets.json targets+browsers+default+rules+claudeDesktop of 8 · thalamus thalamus_config.json pe of 29 · conductor tasks_expected.json expected_disabled+slots of 9 · dmn brain_config.json budget of 19 · heartbeat heartbeat_config.json order of 3
verbatim registry rows, by members needing each: game_on_epoch 8 · modalities_ambient 2 · modalities_interactive 2 · dmn_counter 2 · mutation:forge_profile.json 1 · act_doors 1 · core_axes_default 1 · dmn_rollout 1 · ns_probe_bank 1 · ns_distractors 1 · ns_pre_answers 1 · ns_grade_probes 1 · cortex_wake 1 · cortex_consolidate 1 · thalamus_adjudicator 1 · council_chair 1 · gaffer_judge 1 · gaffer_verify 1 · mission_m03 1 · haiku_pulse 1 · selfknowledge 1 · dmn_bg_drain 1 · ns_field_probes 1 · compiled_notes 1 · notes_corrections 1 · capsule_backups 1 · brief_log 1 · rejirah_log 1 · mutation:thalamus_config.tiers 1 · interruption_types 1 · task_kinds 1 · distinct 31
```

Read: every PLANT selftest has a minimal plant that keeps it green; all but one have a load-bearing key; the synthetic
transform alone keeps the members named GREEN in §2 green; every other one is green once the rows or keys of its
`verbatim rows` cell stay real and everything else stays synthetic (each greedy run ends on a measured green). The
verbatim set is CLOSED and small: the `distinct` count above is every registry row any member needs, and the most
needed is `game_on_epoch`, the GAME-ON stamp (CLAUDE.md, 30 Aug 2026), a constant, not his data.

### 1.1 Recipe

- **Trees** under `os.tmpdir()`, built by `ci/mfix/tools/lib.mjs` `mk()`: an LF `git archive` of `6a6bdff`
  (`core.autocrlf=false`), the state dir excluded and re-made, node_modules symlinked, `git init` + one commit inside.
  **Z** = state dir EMPTY · **T** = the sha's tracked state (the contrast only: its bytes are his, so a tool records exit
  codes, assert verdicts and KEY NAMES off it, never a value) · `{keep}` = only the named tracked files.
- **Doors** per spawn (the mlaw census recipe, unchanged): HOME / USERPROFILE / APPDATA / TMPDIR under a fresh temp dir,
  a refusing `claude` + `gemini` shim first on PATH, `ANTHROPIC_API_KEY` / `GITHUB_ACTIONS` / `ORGANISM_TEST_PROFILE` /
  `ARSENAL_ORGAN` removed, every `ARSENAL_*PORT` env door the tree's scripts read handed an OS-picked port (listen 0,
  read, close). The wait is `run()`'s own default read off `organism_test.mjs:67`; nothing here types one.
  ⚠ The first census run read the wait with mlaw's regex, which no longer matches at this base (`run()` moved), so
  every spawn was killed at once and read red. Caught by the `wait NaN ms` in its own last line, fixed, re-run; the
  rows in `ci/mfix/census/` are the fixed ones.
- **The read-set probe** (`ci/mfix/tools/readprobe.mjs`, `NODE_OPTIONS=--import`): every `JSON.parse` of a text read
  under the tree's state dir returns a deep Proxy that journals the folded KEY PATH of each get, with the leaf's type.
  Ids, dates and free-text keys fold to `*`, indices to `[]`. Children inherit it. It changed no verdict: 64 of 71
  exit 0 under the probe, as without it (`readset.mjs` last line, ledger).
- **The minimal plant and the non-vacuity plant** (`plantcheck.mjs`): from the read set ∩ tracked files, drop one file
  at a time while the member stays green; then, for each key path of depth ≤ 2 the member read, DELETE it from the
  minimal plant (jsonl: from every row, and the file emptied of rows) and run again. A key whose deletion turns the
  member red is **load-bearing**: it is the proof that the member judges the fixture's content, not its presence.
- **The synthetic transform** (`synth.mjs ids`): the minimal plant rebuilt by a function, never copied: keep the JSON
  shape and only `subject` / `id` / `version` strings (the code looks rows up by them), every other string → a token,
  numbers → 0 or 1 by sign of zero, booleans kept, `tables.rulings` → `[]`. **Code-coupled rows** (`coupled.mjs`): for
  a member red on the transform, start with every `mechanisms` / `lanes` row verbatim and drop rows one at a time while
  green; the rows left are the ones whose real values its asserts need.

### 1.2 The plant files: what each is, and who may write it (headers at `6a6bdff`)

Only the files that appear in some member's MINIMAL plant are listed: the rest of the read set is inert (F4).

| File | What it is | Writer (file:line) | Seeded by (FX2) |
|---|---|---|---|
| `registry.json` | the organism's enumerations as rows (`mechanisms`, `lanes`, …) plus `rulings` (his words, never seeded) | `scripts/registry.mjs:4` SOLE WRITER | `registry.mjs set --table … --json …` (measured: exit 0 on an empty tree) |
| `tasks_expected.json` | the scheduled-task snapshot | `scripts/watchman.mjs:83` SOLE WRITER, "by `expect` only" | `watchman.mjs expect` (its inputs are F2's question: on linux there is no schtasks to read) |
| `xray_graph.json` | the code's read/write graph, DERIVED from `scripts/` | `scripts/xray.mjs:4` SOLE WRITER | `xray.mjs build` — no authored byte (measured: exit 0 on an empty tree) |
| `laws_register.json` | the standing-laws register, DERIVED | `scripts/registry.mjs:5` SOLE WRITER | `registry.mjs laws collect` — no authored byte (measured: exit 0) |
| `reps_log.jsonl` | his reps (HIS DATA) | `scripts/capture.mjs:6` single writer | `capture.mjs rep …` with synthetic concept/axis/gut-word |
| `thalamus_config.json` | thalamus tuning | `scripts/gate_tune.mjs:18` declared owner | the owner's verb, or F2 A |
| `captain.json` | his identity profile | none: `scripts/captain.mjs:11` "owns no state file (captain.json is hand-edited" | F2 (synthetic identity, never his name) |
| `brain_config.json` · `dossier_weights.json` · `doubtminer_config.json` · `ladder_config.json` · `buckets.json` · `twin_config.json` | hand-edited organ config | none declared in a header (`grep -n "SOLE WRITER" scripts/*.mjs` names none of them) | F2 |

## 2. WHAT MFIX TAKES, PER MEMBER (generated: `node ci/mfix/tools/summarize.mjs --table`)

The read site is the first non-comment line naming the file in the member's own script, else in a module it imports
(two hops, `readers.mjs`); the registry is read through `registry.mjs`'s exported readers (`tableRows`, `rowOf`,
`subjectsOf`: `scripts/registry.mjs:121-135`, path `REGISTRY_PATH` at `:59`). The non-vacuity plant is one load-bearing
key, deleted. "verbatim rows" is F1's subject.

| organ | LIVE line | minimal plant | read site (file:line) | load-bearing keys | non-vacuity plant (delete → red) | synthetic | verbatim rows |
|---|---|---|---|---|---|---|---|
| acts | 102 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | act_doors |
| bootroom | 106 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | mutation:forge_profile.json |
| calibration | 108 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | GREEN | none |
| capsule_bridge | 109 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | game_on_epoch |
| captain | 110 | captain.json | scripts/captain.mjs:29 | 11 | captain.json:voice | red | keys: number |
| context | 113 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| conductor | 112 | registry.json + tasks_expected.json | scripts/registry.mjs:59 · scripts/conductor.mjs:1485 | 4 | tasks_expected.json:slots | red | keys: expected_disabled + slots |
| context_manifest | 114 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| council | 116 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| cortex | 115 | registry.json | scripts/registry.mjs:59 | 3 | registry.json:tables.mechanisms | red | modalities_ambient |
| daemon_watchdog | 117 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| deep | 120 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | game_on_epoch |
| distiller | 121 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | modalities_interactive + modalities_ambient |
| doubtminer | 123 | doubtminer_config.json | scripts/doubtminer.mjs:49 | 2 | doubtminer_config.json:lexicon.max_anchors | GREEN | none |
| dmn | 122 | brain_config.json + registry.json | scripts/thalamus.mjs:2144 · scripts/registry.mjs:59 | 4 | registry.json:tables.lanes | red | keys: budget |
| daily_green | 118 | registry.json | scripts/registry.mjs:59 | 3 | registry.json:tables.mechanisms | red | game_on_epoch |
| forge_session | 128 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | core_axes_default |
| flow_atlas | 127 | registry.json + xray_graph.json | scripts/registry.mjs:59 · scripts/flow_atlas.mjs:45 | 4 | xray_graph.json:roots | GREEN | none |
| gate | 131 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | red | dmn_rollout + dmn_counter + ns_probe_bank + ns_distractors + ns_pre_answers + ns_grade_probes + cortex_wake + cortex_consolidate + thalamus_adjudicator + council_chair + gaffer_judge + gaffer_verify + mission_m03 + haiku_pulse + selfknowledge + dmn_bg_drain + ns_field_probes + compiled_notes + notes_corrections + capsule_backups + brief_log + rejirah_log |
| gate_tune | 132 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | mutation:thalamus_config.tiers |
| gaffer_brain | 130 | dossier_weights.json + registry.json | scripts/gaffer_brain.mjs:153 · scripts/registry.mjs:59 | 3 | registry.json:tables.mechanisms | GREEN | none |
| learnstate | 140 | registry.json | scripts/registry.mjs:59 | 3 | registry.json:tables.mechanisms | red | game_on_epoch |
| limits | 141 | doubtminer_config.json | scripts/limits.mjs:232 | 2 | doubtminer_config.json:lexicon.max_anchors | GREEN | none |
| manager | 142 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | GREEN | none |
| mcp-memory | 143 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| models | 144 | twin_config.json | (indirect: a helper beyond two import hops) | 0 | — (presence only) | GREEN | none |
| outbox | 148 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| nightshift | 145 | registry.json | scripts/registry.mjs:59 | 3 | registry.json:tables.mechanisms | red | game_on_epoch |
| dugout | 124 | registry.json + reps_log.jsonl | scripts/registry.mjs:59 · scripts/dugout.mjs:1420 | 3 | reps_log.jsonl:(no rows) | GREEN | none |
| samjhao | 155 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | game_on_epoch |
| rejirah | 154 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | game_on_epoch |
| scout | 156 | dossier_weights.json | scripts/scout.mjs:713 | 1 | dossier_weights.json:bucket_round_map | red | keys: bucket_round_map |
| services | 158 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| shadow | 160 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | interruption_types |
| setpiece | 159 | dossier_weights.json + ladder_config.json + registry.json | scripts/setpiece.mjs:1013 · scripts/setpiece.mjs:1012 · scripts/registry.mjs:59 | 16 | registry.json:tables.mechanisms | GREEN | none |
| sprintsync | 162 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | game_on_epoch |
| talk | 163 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |
| tasks | 164 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | task_kinds + dmn_counter |
| throwin | 168 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.mechanisms | red | modalities_interactive |
| timeaudit | 169 | buckets.json | scripts/timeaudit.mjs:27 | 4 | buckets.json:rules.Meta | red | keys: targets + browsers + default + rules + claudeDesktop |
| thalamus | 167 | thalamus_config.json | scripts/thalamus.mjs:136 | 2 | thalamus_config.json:pe.base_rates | red | keys: pe |
| watchman | 172 | registry.json | scripts/registry.mjs:59 | 2 | registry.json:tables.lanes | GREEN | none |

### 2.1 The PLANT asserts (the `laws` and `integrity` modes; generated: `modeplant.mjs`, `coupled.mjs mode:laws`)

The asserts ride their mode's spawn, so their plant is measured at the mode's grain. `readset_modes.mjs` on T: mode
`laws` reads four state files (`registry.json`, `captain.json`, `tasks_expected.json`, `brain_config.json`); mode
`integrity` reads every state file, because two of its asserts' SUBJECT is "every state file parses".

```
atlas (W6 plant): seeded exit 0 · ok · edited-after-build exit 2 · FAIL
integrity mode: Z 219:ok,221:ok,222:ok,225:ok · R 219:ok,220:ok,221:ok,222:ok,225:ok · R-brain_config.json 219:ok,221:ok,222:ok,225:ok · R-registry.json 219:ok,220:ok,221:ok,222:ok,225:ok · R-tasks_expected.json 219:ok,220:ok,221:ok,222:ok,225:ok · S 219:FAIL,220:FAIL,221:ok,222:ok,225:ok
laws mode: Z ok 4/5 · R ok 40/42 · R-registry.json ok 4/5 · R-captain.json ok 40/42 · R-tasks_expected.json ok 39/42 · R-brain_config.json ok 40/42 · S ok 21/32
laws mode code-coupled rows: task_kinds+game_on_epoch+study_skills (live ok 40)
```

- **Per assert line** (`organism_test.mjs` LIVE_ASSERTS at `:176-226`): the A9 block (`:177`, `:180`), LOAD ZERO BLOCK
  1 / 2 / 4, S8 and the plain `reads state/registry.json` rows ride `laws` and need `registry.json` +
  `tasks_expected.json` (`captain.json` and `brain_config.json` measured inert there: the `R-<file>` variants).
  Line `:215` (S8 · the nerve writes ahead, reason `brain_config.json`) rides `laws` and is green there with
  `brain_config.json` absent (variant `R-brain_config.json`). Line `:218` (SNAPSHOT RIDES THE BUILD) needs
  `registry.json` + `tasks_expected.json` (its reason also names `captain.json`, measured inert), and it is the one
  `laws` assert a SYNTHETIC `tasks_expected.json` turns red: its subject is that file's task list (variant
  `S+task_kinds,game_on_epoch,study_skills`, `census/modeplant_laws_real.jsonl`). Line `:220` (all brain triggers reach
  live work) rides `integrity` and needs `brain_config.json`; it is red on the synthetic one (variant `S`).
- **So the `laws` asserts need, measured:** a synthetic registry with THREE rows verbatim (`task_kinds`,
  `game_on_epoch`, `study_skills`: `coupled.mjs … mode:laws`, `census/coupled_laws.jsonl`) and a synthetic
  `tasks_expected.json`, for every PLANT assert of the mode but `:218`; `:218` needs `tasks_expected.json`'s
  `expected_disabled` + `slots` verbatim (`coupled_keys.mjs`, measured on conductor's selftest, the same reader).
- **The two vacuous ZERO asserts** (`:219` "a declared external producer is a REAL organ in this tree (# declaration(s)
  checked)" and `:225` "…and that organ really BUILDS that brain_out directory"): ok on the empty plant over ZERO
  declarations. They are mfix's by row 1137 (4) ("vacuous ones excluded" from mlaw2). Their fixture is a
  `brain_config.json` with at least one external-producer declaration naming a real organ of the tree. Measured: on
  the synthetic transform, whose declaration names the token organ `fx`, `:219` reads **FAIL** (variant `S`), so the
  assert is not vacuous once a declaration exists, and an absent organ is W4's red plant. `:225` stayed ok on `S`; its
  non-vacuity is the build's W4 measurement (N6).

### 2.2 What mlaw2 EXCLUDED AS VACUOUS, and is mfix's to give a subject (`vacuity_fx.mjs`, `coupled_keys.mjs`)

mlaw2's census (`claude/mlaw2-census` `cf1785c`, `ci/mlaw2/census/SUMMARY.txt`) names, as VACUOUS and excluded: selftests
`gates` `heartbeat` `learn_digest` `reconcile` · asserts `:219` `:221` `:222` `:224` `:225` · modes `alive` `atlas`. Its
vacuity probe reads them green on the empty plant over a swallowed throw or a NOT-MEASURED line
(`ci/mlaw2/census/vacuity.jsonl`). Row 1205 (2): unclaimed by mlaw2, so they are this unit's to fixture, or to name.

| Member | Its empty-plant vacuity (mlaw2) | On the mfix plant, measured (20 Nov 2026) | Fate here |
|---|---|---|---|
| `learn_digest` · `reconcile` | gate.mjs's throw "the registry lanes table is EMPTY/unreachable" swallowed | on the SYNTHETIC registry: zero swallowed throws, still exit 0 (`census/vacuity_fx.jsonl`) | mfix, plant = the synthetic registry (no verbatim row) |
| `heartbeat` | "DEFAULTS.order vs canon parity — NOT MEASURED (heartbeat_config.json unreadable)" | on a synthetic `heartbeat_config.json`: zero NOT MEASURED, and RED; green with key `order` verbatim (`census/coupled_keys.jsonl`) | mfix, F1 prices the one key |
| `gates` selftest · gates mode ajv half · asserts `:221` `:222` | the schema'd files are absent | SUBJECT: a fixture would make them measure the fixture | named in §3, never moved; they are FX5's validator |
| asserts `:219` `:225` | zero declarations | §2.1 | mfix (W4) |
| assert `:224` (the one sanctioned selftest write lands in the organ's OWN log) | its subject is a snapshot of the whole state dir around a thalamus selftest | not measured here: its subject is the state dir's bytes, so it is SUBJECT-shaped | named, N8 |
| mode `atlas` | `organism_test.mjs:2838-2839` asserts `true` | W6's plant: real `check`, green, and red on a code edit (`census/atlas_real.jsonl`) | mfix (F5) |
| mode `alive` | pulse NOT-MEASURABLE on linux | — | N4 |

## 3. WHAT CANNOT GET A SYNTHETIC FIXTURE, AND WHY

| Member | Class | Why no fixture can serve it |
|---|---|---|
| assert `:221` "every state .json parses" · `:222` "every state .jsonl parses on every row" | SUBJECT | its subject IS his bytes; on a fixture it measures the fixture. It is the fixture VALIDATOR in the build (W5), never a moved member |
| gates mode, ajv half | SUBJECT | validates the schema'd state files (`schemas/*.schema.json`, `gates.mjs:220-246`); on a fixture it says the fixture is valid. Same use as above. Its lint half is unit mgat's (mlaw spec F8, row 1137 (5)) |
| asserts `:179` (A9 · every organ the two study skills name is on the registry's study entry points) · `:194` (THE COLDNESS RATCHET) | RED-ON-PLANT | red on the tracked state of a fresh clone (`modeplant.mjs` variant `R`). A fixture that turned them green would be authored to agree with code that the tracked state disagrees with: N2 |
| selftests blackbox · brain · capture · audit · daykey · herd · xray | RED-BOTH | red even on the tracked state on linux. Measured for xray (20 Nov 2026, `derive.mjs`): on an EMPTY plant plus the owner-derived graph (`xray.mjs build`) it is 20 passed / 3 failed, BETTER than on the tracked state; the 3 left are "<organ>.mjs really does contain NUL bytes (the trap is still live)" for calibration / dmn / rejirah, and `git show 6a6bdff:scripts/<organ>.mjs` holds zero NUL bytes, so the red is code, not state. herd's 2 reds are DAY-KEY asserts, red on both. **blackbox**: mlaw2 (`cf1785c`, its spec §0 item 5 (c)) found it red on both only because a LINKED node_modules breaks its sandbox copy; measured here with node_modules COPIED and untracked, on an EMPTY plant plus the owner-derived graph it is still red on three tracer asserts ("the tracer sees a read", "…records a SWALLOWED ENOENT", "…and the process still exited 0"; `census/derived.jsonl`), so its plant is more than the graph (N9). The rest: N1 |
| mode `path` | NETWORK | `mirror.mjs` fetches his gist; the port class forbids it |
| mode `alive` | PLANT-UNRUN | pulse answers NOT-MEASURABLE on linux first (`organism_test.mjs` `alive()`); its doors exist (mlaw §2.4), the plant is N4 |

## 4. THE CODE PATH (proposed; built by nobody here)

**FX1 · where the fixtures live (F4 A, ruled).** `ci/fixtures/state/` in the repo. It holds NO state file. It holds one
SEED SCRIPT per owner, `ci/fixtures/state/seed.mjs`, and the authored synthetic inputs it hands the owners
(`ci/fixtures/state/rows/*.json`, one file per registry table row set, every string a token unless F1 admits it).

**FX2 · who writes the fixture: the OWNER, inside the planted tree.** `seed.mjs <tree>` runs, with cwd = the planted
tree and the planted tree's own scripts:
- `registry.mjs set --table <t> --json <row>` per row (the owner's CLI; `scripts/registry.mjs` header `:4` SOLE WRITER,
  `:30-31` "Seeding happens through this CLI"). Measured: exit 0 and `op: added` on an empty tree.
- `registry.mjs laws collect` (`laws_register.json`, `:5`) and `xray.mjs build` (`xray_graph.json`, `scripts/xray.mjs:4`):
  derived from code, no authored byte. `flow_atlas.mjs build` after them (needs the registry plant).
- `watchman.mjs expect` for `tasks_expected.json` (`scripts/watchman.mjs:83` SOLE WRITER, "by `expect` only").
- For files whose header declares NO writer (hand-edited config: e.g. `captain.json`, `scripts/captain.mjs:11` "owns no
  state file (captain.json is hand-edited"), and `brain_config.json`, `doubtminer_config.json`, `dossier_weights.json`
  where a member's minimal plant names them): the authored synthetic file is COPIED into the plant by `seed.mjs`, the
  one declared writer of the temp tree only (F2).
- `capture.mjs` is the sole writer of `reps_log.jsonl` (`scripts/capture.mjs:6`): a member whose minimal plant names it
  gets its rows through `capture.mjs rep …` (its gut-word law refuses a rep without one, `organism_test.mjs` asserts
  `:181-184`), never by an appended line.

**FX3 · who consumes it.** The planted tree of mlaw2 (`ci/mlaw2/plant.mjs` on `claude/mlaw2-census` `6322110`), whose
`plant_inputs.json` carries `"fixtures": []` and whose `plant()` THROWS if any fixture is named: the build turns
`fixtures` into the list of `seed.mjs` steps a member needs, and `plant()` runs them after the tree is made. Or
`organism_test.mjs`'s own `plantedTree(files)` (mlaw P4). Which one is F3. Either way a moved member is spawned from the
planted tree's own `scripts/` (ROOT anchors to the script), exactly like `sandbox()` (`organism_test.mjs:2606`), which
already seeds a minimal FIXTURE capsule set when the copy has none (`:2612-2618`, `:2634`, "in the SANDBOX only, never the live
mirror (mirror.mjs stays its only writer)"): that is this unit's precedent in the suite itself.

**FX4 · the LIVE tables shrink only by mfix members with a passing witness.** A member leaves `LIVE_SELFTESTS`
(`organism_test.mjs:101-175`) / `LIVE_ASSERTS` (`:176-226`) / `LIVE_MODES` (`:227-233`) in the same commit that adds its
seed steps, and only if W1-W4 hold for it. Row 1022 (3)'s ratchet holds: the tables only shrink.

**FX5 · the no-copy law, as a code path.** `seed.mjs check`: (a) no fixture file's sha256 equals any tracked state
file's (`git ls-files -s dressing-room/state`); (b) no string leaf longer than a token in any authored input appears
verbatim in the tracked state, except the rows F1 admits, each listed with its row of the forks sheet; (c) no
`rulings` row, ever (his words). A fixture that copies his bytes is refused by code, not by review.

**Files and owners at base `6a6bdff`:**

| File | Line(s) | Change | Owner rule |
|---|---|---|---|
| `ci/fixtures/state/seed.mjs` (new) | — | FX2 seeder · FX5 `check` | writes only inside a planted tree under `os.tmpdir()`; every state write is an owner's CLI |
| `ci/fixtures/state/rows/*.json` (new) | — | the authored synthetic inputs | no organ reads them; only `seed.mjs` |
| `ci/mlaw2/plant.mjs` + `plant_inputs.json` (mlaw2's, F3 A) or `scripts/organism_test.mjs` (F3 B) | `plant()` · `fixtures` / `:101-233` | run the seed steps · shrink the tables | `organism_test.mjs` header `:26` READ-ONLY on the state dir: the plant lives under `os.tmpdir()`, so it holds |
| `scripts/organism_test.mjs` | `:101-233` | the moved keys leave the tables (FX4) | as above |
| `ci/mfix/witness_mfix.mjs` (new) | — | §5 | writes only under `os.tmpdir()` |

No state file of the checkout is written, read into an output, or copied by any change. `.github/workflows/suite.yml`
is not touched. `scripts/registry.mjs`, `xray.mjs`, `flow_atlas.mjs`, `watchman.mjs`, `capture.mjs` are called, not edited.

## 5. WITNESS CLAUSES (each plant RED on base `6a6bdff`, GREEN on the build)

Every clause runs on LF trees under `os.tmpdir()`, ports from listen-0 env doors only, the refusing model shim first on
PATH, no daemon reached, nothing restarted, every wait the tree's own `run()` default.

| Clause | Plant | Base `6a6bdff` | Build |
|---|---|---|---|
| **W1 MOVED-AND-JUDGED** | the hermetic run in a tree whose checkout state dir is ABSENT | RED: each mfix member is printed `LIVE …` and judged nothing | GREEN: each moved member runs on its seeded plant and is green, and LIVE is lower by exactly the moved set |
| **W2 NON-VACUOUS** | per moved member, its seeded plant with its named load-bearing key deleted (the table in §2) | — (the member is not run on base) | RED for every member: the deletion turns it red. A member green on the deletion is refused as presence-only |
| **W3 OWNER-WRITTEN** | `seed.mjs` under a write journal (the read-set probe's sibling on `writeFileSync` / `appendFileSync` / `renameSync` under the plant's state dir) | — | GREEN: every write under the plant's state dir is made by a process whose `argv[1]` is the file's declared owner, or by `seed.mjs` for a file with no declared writer (F2) |
| **W4 VACUITY-CLOSED** | asserts `:219` / `:225` on the seeded `brain_config.json`, then the same with the declaration naming an organ absent from the tree | GREEN over ZERO declarations (vacuous) | GREEN with a declaration count > 0, and RED on the absent organ |
| **W5 NO-COPY** | `seed.mjs check` on the build's fixtures, then with one tracked state file copied in as a fixture | — | GREEN, then RED naming the copied file |
| **W6 ATLAS-REAL** | mode `atlas` on the seeded plant (`xray.mjs build` + `flow_atlas.mjs build`), then the same with one organ's read edited after the build | GREEN and vacuous: `organism_test.mjs:2839` asserts `true` on an empty plant | GREEN with `check` really run, then RED on the edited organ |
| **W7 RATCHET** | the build's three LIVE tables against the base's | — | GREEN: every build key is a base key, and every removed key is an mfix member (none of mlaw2's) |

## 6. MUTANTS (one per clause; each must turn its clause RED on the build)

| Clause | Mutant |
|---|---|
| W1 | spawn a moved member from ROOT instead of the planted tree (it reads the absent dir: the census's Z column) |
| W2 | seed the load-bearing key with the member's own default (a fixture that cannot fail) |
| W3 | make `seed.mjs` write `registry.json` with `writeFileSync` instead of `registry.mjs set` |
| W4 | seed `brain_config.json` with an empty declaration list |
| W5 | copy `dressing-room/state/registry.json` of the checkout into the plant |
| W6 | skip `flow_atlas.mjs build` in the seed (the mode falls back to `assert(…, true)`) |
| W7 | remove one ZERO member (mlaw2's) from `LIVE_SELFTESTS` in the mfix build |

## 7. THE PORT CLASS (row 1053)

No tool here or in the proposed build binds a fixed port, names a live service, POSTs at a daemon or restarts anything.
Every `ARSENAL_*PORT` door gets an OS-picked port under the plant; every spawn is bounded by the suite's own `run()`
default. The one fixed port in the class (`conductor.mjs:990` → 59999) is unit mlaw's F6 B, already ruled.

## 8. FORKS (each the architect's to rule)

- **F1 · may a fixture carry a code-coupled registry row VERBATIM?** The rows `coupled.mjs` keeps are `mechanisms` /
  `lanes` rows: enumerations that were literals in code until rung S10 (`registry.mjs:8-13`), not his words, not his
  learning data. (A) yes, each row listed by subject in `ci/fixtures/state/rows/` with its row of the forks sheet, and
  FX5 (b) admits exactly those · (B) no: a member that needs one stays LIVE · (C) the row's value is DERIVED by its
  owner at seed time from the code that consumes it (needs a reader per row; none exists today: `registry.mjs` holds no
  code-side seed, `grep -n "SEED" scripts/registry.mjs` finds only the cadence default). **Recommend A**: the bytes are
  organism config the public repo already carries, the list is closed and checked by code, and B leaves the largest
  unlock on the table. Decides: the `real_rows` column of §2 (its size is the cost of B).
- **F2 · the hand-edited config files (no declared writer).** (A) `seed.mjs` is the declared writer of the plant copy
  only, the authored synthetic file under `ci/fixtures/state/rows/` · (B) each such file gets an owner first (a new
  `expect`-style verb in the organ that reads it), then is seeded through it. **Recommend A**; B is a unit of its own
  per file. Decides: W3 on `captain.json` (`scripts/captain.mjs:11`).
- **F3 · which planted tree consumes the seed.** (A) mlaw2's `ci/mlaw2/plant.mjs` (`fixtures` becomes the seed list;
  one planter for both units) · (B) `organism_test.mjs`'s own `plantedTree()` (mlaw P4). **Recommend A**, cut after
  mlaw2's BUILD half lands, so the two units share one planter and mfix edits none of mlaw2's moves. Decides: whether
  mlaw2's build ships `plant()` as an export of the suite or of `ci/`.
- **F4 · the minimal plant or the read set.** (A) seed exactly the measured minimal plant per member · (B) seed every
  file the member reads (larger, closer to his laptop). **Recommend A**: what is not load-bearing judges nothing, and W2
  proves each seeded key. Decides: W2 on (B)'s extra files (they are inert, measured: `plantcheck.jsonl` `inert`).
- **F5 · atlas.** (A) it moves with the seeded plant (W6) · (B) it stays LIVE and its vacuous `assert(…, true)` branch
  is named as a defect for its owner's unit. **Recommend A**, and name B's defect regardless. Decides: W6.
- **F6 · the RED-BOTH seven.** (A) they stay LIVE until his laptop's N1 run names which are state and which are platform
  · (B) xray moves on the owner-derived graph now, its NUL-trap asserts named as a code red for their own unit.
  **Recommend A**: a member that is red on a fresh clone cannot leave the LIVE table green.
- **F7 · `models`, presence-only.** Red on the empty plant, green on a minimal plant of `twin_config.json` alone, and NO
  read key of depth ≤ 2 is load-bearing (`plantcheck.jsonl`: `bearing` empty); its synthetic transform is green. It needs
  the file to EXIST and judges nothing in it, so W2 refuses it. (A) it moves with an empty-object `twin_config.json`
  seeded, named presence-only in its witness row, W2 waived for it by its row · (B) it stays LIVE until its owner names
  what it should judge in the file · (C) it is handed to mlaw2 as a no-fixture member with a presence plant.
  **Recommend B**: a member that cannot fail on its fixture is the vacuous class row 1137 (4) excludes. Decides: one
  deeper probe (depth > 2, or the file's mere existence: `plantcheck.mjs` with the file emptied to `{}`).
- **F8 · `gate` needs many verbatim rows.** `coupled.mjs` keeps a large set of `lanes` / `mechanisms` rows verbatim for
  `gate` (the L5 gate walks every lane), against one row for most members (§1). (A) it moves under F1 A with its rows
  listed · (B) it moves last, after its owner derives the lane list it walks from one row. **Recommend A** if F1 is A;
  the size is the cost F1 already prices.

## 9. NAMED NOT GUESSED (what a cloud seat cannot reach; what measures each on his laptop)

- **N1 · the seven RED-BOTH selftests on Windows.** `node ci/mfix/tools/census.mjs <sha> blackbox brain capture audit
  daykey herd xray` on his laptop (it builds the same Z / T trees under `%TEMP%`).
- **N2 · asserts `:179` / `:194` on HIS state.** `node scripts/organism_test.mjs laws` on his laptop, those two lines.
- **N3 · whether the minimal plants hold on Windows.** `node ci/mfix/tools/plantcheck.mjs <sha>` there: a member whose
  Windows minimal plant is larger names a platform-only read.
- **N4 · `alive` on a planted task list** (mlaw N4, unchanged).
- **N5 · the neutral machine on this branch (Windows legs)**: §11.
- **N6 · whether assert `:225` judges a seeded producer.** It stayed ok on the synthetic `brain_config.json` (§2.1).
  Measured by the build's W4 run, on linux or his laptop alike; the cloud seat has not built the seed.
- **N9 · blackbox's tracer plant.** Its three tracer asserts need a state read the tracer can see; the read-set probe
  cannot see a child that sets its own `NODE_OPTIONS`. Measured by `node ci/mfix/tools/plantcheck.mjs <sha> blackbox`
  with node_modules copied (as `blackbox_derived.mjs` does), on linux or his laptop.
- **N8 · assert `:224` on a plant.** Its subject is the whole state dir around a thalamus selftest; whether a plant of
  `thalamus_config.json` alone gives it a real subject is the build's measurement (`modeplant.mjs <sha> hermetic
  thalamus_config.json`).
- **N7 · whether the synthetic transform holds on Windows.** `node ci/mfix/tools/synth.mjs <sha> ids registry.json
  <organ…>` on his laptop: a member green here and red there names a platform read.

## 10. FILES A BUILD WOULD TOUCH

`ci/fixtures/state/seed.mjs` · `ci/fixtures/state/rows/*.json` · `ci/mfix/witness_mfix.mjs` (all new) ·
`scripts/organism_test.mjs` (the LIVE tables only). Beyond them, only as forks: `ci/mlaw2/plant.mjs` +
`plant_inputs.json` (F3 A) · an owner verb per hand-edited config (F2 B) · `scripts/organism_test.mjs:2838-2839` (F5 B).

## 11. THE NEUTRAL MACHINE ON THIS BRANCH

RUNS-BLOCK

## 12. THE OVERLAP WITH MLAW2 (read twice: at the start and before the last push)

Read at the start (20 Nov 2026: `git fetch origin claude/mlaw2-census` → no such ref) and again before the last push
(`origin/claude/mlaw2-census` at `6018a70`, census step 2 `cf1785c`, `ci/mlaw2/census/SUMMARY.txt`).

- **mlaw2 CLAIMS** (no fixture): selftests `archivist examiner exchanges fuelboard home_pin notes_compiler oura_coach
  outwork_audit postmatch python_state rails selfknowledge sitting test_coach_v2 teaching_audit turn_hook viz widget`
  · asserts `:181 :182 :183 :184 :223` · modes none.
- **mfix TAKES** (a fixture): the PLANT selftests of §2, `learn_digest` `reconcile` `heartbeat` (§2.2), the PLANT
  asserts of §2.1, asserts `:219` `:225`, mode `atlas`.
- **Members both of us name as our own: NONE.** Every mlaw2 claim is a ZERO member here (green on the empty plant,
  `census/selftests.jsonl` Z column; asserts `:181-184` and `:223` ok on Z, `census/modes.jsonl`); no mfix member is in
  its claim list. Row 1205 (2)'s tie-break (mlaw2 wins) has nothing to decide.
- **Where the two censuses CLASS a member differently** (not an overlap of claims, named so neither is lost):
  `blackbox` (mlaw2: needs a fixture; here: red on the derived plant, N9) · the RED-BOTH count (mlaw2 counts one fewer,
  that same member) · mlaw2's NEEDS-FIXTURE set is one larger than this unit's PLANT set by exactly `blackbox`.
- **The planter.** mlaw2's `ci/mlaw2/plant.mjs` refuses any fixture today (`plant_inputs.json` `"fixtures": []`, and
  `plant()` throws on one). That is F3: this unit's seed would fill it.

