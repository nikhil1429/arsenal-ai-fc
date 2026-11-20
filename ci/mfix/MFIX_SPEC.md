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
   plant, no fixture). **mfix takes PLANT** (red on the empty plant, green on the tracked state) plus the two vacuous
   ZERO asserts (F5 A: "vacuous ones excluded" from mlaw2) and the modes whose only honest plant is a fixture or an
   owner-derived file. The census line is in §1.
3. **The plants are much smaller than the LIVE reasons say.** `ci/mfix/tools/plantcheck.mjs` (one-at-a-time removal over
   the files each member really reads, measured by a read-set probe) shows **`registry.json` alone is the minimal plant
   of almost every PLANT selftest**, and inside it only `tables.mechanisms` and/or `tables.lanes`. `captain.json`,
   named in many LIVE reasons, is load-bearing for `captain` alone. The full line is in §1.
4. **Most of it can be synthetic, and the rest is code, not his data.** A transform that keeps only the row ids the code
   asks for by name (`subject`, `id`), turns every other string into a token and DROPS `tables.rulings` (his words) keeps
   a share of the members green (`synth.mjs`). For the rest, `coupled.mjs` finds the few rows whose REAL values the
   member needs — and those rows are the organism's own enumerations, moved out of code into the registry by design
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

SUMMARY-BLOCK

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

## 2. WHAT MFIX TAKES, PER MEMBER (generated: `node ci/mfix/tools/summarize.mjs --table`)

The read site is the first non-comment line naming the file in the member's own script, else in a module it imports
(two hops, `readers.mjs`); the registry is read through `registry.mjs`'s exported readers (`tableRows`, `rowOf`,
`subjectsOf`: `scripts/registry.mjs:121-135`, path `REGISTRY_PATH` at `:59`). The non-vacuity plant is one load-bearing
key, deleted. "verbatim rows" is F1's subject.

MEMBER-TABLE

### 2.1 The PLANT asserts (the `laws` and `integrity` modes; generated: `modeplant.mjs`, `coupled.mjs mode:laws`)

The asserts ride their mode's spawn, so their plant is measured at the mode's grain. `readset_modes.mjs` on T: mode
`laws` reads four state files (`registry.json`, `captain.json`, `tasks_expected.json`, `brain_config.json`); mode
`integrity` reads every state file, because two of its asserts' SUBJECT is "every state file parses".

LAWS-BLOCK

- **Per assert line** (`organism_test.mjs` LIVE_ASSERTS at `:176-226`): the A9 block (`:177`, `:180`), LOAD ZERO BLOCK
  1 / 2 / 4, S8 and the plain `reads state/registry.json` rows ride `laws` and need `registry.json` +
  `tasks_expected.json` (`captain.json` and `brain_config.json` measured inert there: the `R-<file>` variants).
  Lines `:215` and `:220` ride `integrity` and need `brain_config.json`; line `:218` needs `registry.json` +
  `tasks_expected.json` (its reason also names `captain.json`, measured inert).
- **The two vacuous ZERO asserts** (`:219` "a declared external producer is a REAL organ in this tree (# declaration(s)
  checked)" and `:225` "…and that organ really BUILDS that brain_out directory"): ok on the empty plant over ZERO
  declarations. They are mfix's by row 1137 (4) ("vacuous ones excluded" from mlaw2). Their fixture is a
  `brain_config.json` with at least one external-producer declaration naming a real organ of the tree; the plant that
  proves them non-vacuous names an organ that does not exist (W4).

## 3. WHAT CANNOT GET A SYNTHETIC FIXTURE, AND WHY

| Member | Class | Why no fixture can serve it |
|---|---|---|
| assert `:221` "every state .json parses" · `:222` "every state .jsonl parses on every row" | SUBJECT | its subject IS his bytes; on a fixture it measures the fixture. It is the fixture VALIDATOR in the build (W5), never a moved member |
| gates mode, ajv half | SUBJECT | validates the schema'd state files (`schemas/*.schema.json`, `gates.mjs:220-246`); on a fixture it says the fixture is valid. Same use as above. Its lint half is unit mgat's (F8) |
| asserts `:179` (A9 · every organ the two study skills name is on the registry's study entry points) · `:194` (THE COLDNESS RATCHET) | RED-ON-PLANT | red on the tracked state of a fresh clone (`modeplant.mjs` variant `R`). A fixture that turned them green would be authored to agree with code that the tracked state disagrees with: N2 |
| selftests blackbox · brain · capture · audit · daykey · herd · xray | RED-BOTH | red even on the tracked state on linux. Measured for xray (20 Nov 2026, `derive.mjs`): on an EMPTY plant plus the owner-derived graph (`xray.mjs build`) it is 20 passed / 3 failed, BETTER than on the tracked state; the 3 left are "<organ>.mjs really does contain NUL bytes (the trap is still live)" for calibration / dmn / rejirah, and `git show 6a6bdff:scripts/<organ>.mjs` holds zero NUL bytes, so the red is code, not state. herd's 2 reds are DAY-KEY asserts, red on both. The rest: N1 |
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

## 9. NAMED NOT GUESSED (what a cloud seat cannot reach; what measures each on his laptop)

- **N1 · the seven RED-BOTH selftests on Windows.** `node ci/mfix/tools/census.mjs <sha> blackbox brain capture audit
  daykey herd xray` on his laptop (it builds the same Z / T trees under `%TEMP%`).
- **N2 · asserts `:179` / `:194` on HIS state.** `node scripts/organism_test.mjs laws` on his laptop, those two lines.
- **N3 · whether the minimal plants hold on Windows.** `node ci/mfix/tools/plantcheck.mjs <sha>` there: a member whose
  Windows minimal plant is larger names a platform-only read.
- **N4 · `alive` on a planted task list** (mlaw N4, unchanged).
- **N5 · the neutral machine on this branch (Windows legs)**: §11.

## 10. FILES A BUILD WOULD TOUCH

`ci/fixtures/state/seed.mjs` · `ci/fixtures/state/rows/*.json` · `ci/mfix/witness_mfix.mjs` (all new) ·
`scripts/organism_test.mjs` (the LIVE tables only). Beyond them, only as forks: `ci/mlaw2/plant.mjs` +
`plant_inputs.json` (F3 A) · an owner verb per hand-edited config (F2 B) · `scripts/organism_test.mjs:2838-2839` (F5 B).

## 11. THE NEUTRAL MACHINE ON THIS BRANCH

RUNS-BLOCK

## 12. THE OVERLAP WITH MLAW2 (read twice: at the start and before the last push)

OVERLAP-BLOCK

CHECKPOINT · 20 Nov 2026 · spec drafted, census running (plantcheck / coupled) · resume from: fill SUMMARY / MEMBER / LAWS / RUNS / OVERLAP blocks from `node ci/mfix/tools/summarize.mjs --table`
