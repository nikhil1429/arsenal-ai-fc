# MHOT SPEC — the suite's member tables and the package.json chains stop being single shared lines

Unit **mhot**, forks row 1172 (3). Spec seat (cloud), 2026-11-20. This file builds nothing. Everything in it is a
measurement taken by command at the base named below. Each command's last line is quoted. Where a fact could not be
reached from the cloud it is listed under NAMED NOT GUESSED and never guessed.

**HEADLINE (2026-11-20).** The contention is real, but it is narrower than the brief assumed, and one conflict is open
right now. Over the last twenty unit landings on main, the **package.json `organism:selftest` string** is the only shared
line that more than one *separate* landing edited (three landings: `4b00cf5` mrung, `a18c167` mfac, `902b6cc` mpool).
`MODES` was edited by two landings, but both edits were appends with no conflict. **`KNOWN_RED`** cost three real
conflicts inside the ms1 assembly (`e54e3b6`, `b88d7f0`, `5368b82`, now landed as `5759cce`). In the queue today,
**mcov × mlaw conflicts in `package.json` `organism:selftest`** (both append to the same one-line JSON string). The
brief's "mlaw against mgat inside LIVE_SELFTESTS" conflict, measured, sat in **`LIVE_MODES`**
(`scripts/organism_test.mjs:214`, adjacent `gates` / `lawpack` deletions); mlaw does also edit `LIVE_SELFTESTS`, but that
hunk merged clean. `LIVE_ASSERTS` shows **zero** contention: no landing and no queued branch touched it after it was
created (`76b0626`). **Recommended shape: option B.** Each selftest member gets one JSON file under a directory the suite
walks (`suite/members/<organ>.json`, holding its suite, its argv and its hermetic-LIVE reason). The three chain strings
become one fixed command each (`node scripts/organism_test.mjs chain <suite>`), written once and never edited again.
The coverage law reads the walk, so "exactly one suite" becomes structural: one file cannot name two suites.
`LIVE_ASSERTS`, `MODES` and `KNOWN_RED` stay where they are; the measurement does not show they need to move.

---

## 0 · BASE

```
$ git fetch origin main && git rev-parse FETCH_HEAD
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
$ git checkout -b claude/mhot-spec FETCH_HEAD
Switched to a new branch 'claude/mhot-spec'
```

Base = main **`5759cce`** (the ms1 + mrj + mrt + mr3 + mrf + mrv assembled landing). Its check runs, read from the public
API with no token (`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/5759cce…/check-runs`):

```
135919452846 npm test · node 24 completed success
135919452425 npm test · node 22 completed success
135919450866 public-safe-chores completed success
135886177254 npm test · node 24 completed success
135886176499 npm test · node 22 completed success
```

The suite at base, measured in this container (first without `node_modules`, then after `npm ci`):

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # before npm ci
organism_test: 141 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)
   (fsrs + mutagen: ERR_MODULE_NOT_FOUND — node_modules absent in the fresh container; environment, not the tree)
$ npm ci --no-audit --no-fund ; ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
  · [UNRULED] EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
      orphaned: deck_lint, home_pin, probe, study_scope
```

The one red is unit mcov's subject, and mcov's queued branch already gives those four organs their fate. The neutral
machine passes `5759cce` because `witnesses` and the coverage member run as GitHub Actions; this container is not the
neutral machine. See NAMED NOT GUESSED N3.

The unlanded branches measured here, each fetched by name into `refs/mhot/*` (a local ref, never pushed):

```
claude/mcov-build 1de84e5 · claude/mlaw-build 908bf76 · claude/mgat-build a5f8693 · land/mgat 1b8c379
```

---

## 1 · THE SHARED LINES, AND EVERY READER OF THEM (file:line at `5759cce`)

### 1.1 The shared lines

| Shared line | Where | Shape today |
|---|---|---|
| `SUITE_NAMES` | `scripts/organism_test.mjs:71` | one-line array of the three suite names |
| `LIVE_SELFTESTS` | `scripts/organism_test.mjs:85-158` | `Object.freeze({…})`, one line per organ, alphabetical |
| `LIVE_ASSERTS` | `scripts/organism_test.mjs:159-209` | one line per assert-name prefix |
| `LIVE_MODES` | `scripts/organism_test.mjs:210-216` | one line per mode |
| `KNOWN_RED` | `scripts/organism_test.mjs:2962-2971` | array of entries, appended at the end (empty of entries at base) |
| `MODES` | `scripts/organism_test.mjs:3013` | ONE line holding every mode key |
| `organism:selftest` | `package.json:18` | ONE JSON string, an `&&` chain of `node scripts/<organ>.mjs selftest` |
| `squad:selftest` | `package.json:19` | same |
| `audit:selftest` | `package.json:21` | same |
| law prose | `package.json:17` `_selftest_coverage_law` · `:20` `_audit_suite_law` · `:22` `_runner_law` | text that describes the chain shape |

The sizes are measured, not recalled. The command is in the fence and its output was taken on 2026-11-20:

```
$ node -e '…count members / bytes per chain string, keys per LIVE table…'
organism:selftest members 81 bytes 3068
squad:selftest members 32 bytes 1274
audit:selftest members 11 bytes 413
LIVE_SELFTESTS keys 72
LIVE_ASSERTS keys 49
```

### 1.2 Every reader of those lines

**The chain strings (package.json:18/19/21):**

- `scripts/organism_test.mjs:293-299` coverage(): all three suites exist (reads `SUITE_NAMES`).
- `scripts/organism_test.mjs:300-306` coverage(): `inSuite` map by regex `scripts\/([A-Za-z0-9_\-]+)\.mjs`, giving the orphan rule (`:308-310`), the double-billing rule (`:312-314`) and the ghost rule (`:316-318`).
- `scripts/organism_test.mjs:324-326`: `test` points at organism_test.mjs.
- `scripts/organism_test.mjs:331-332`: the floor, members ≥ the literal at `:332`.
- `scripts/organism_test.mjs:336-345` suiteMembers(): the parser the runner and the floor share.
- `scripts/organism_test.mjs:365-392` suites(): runs each member independently. `:377` holds the `test_coach_v2` bare-argv special case.
- `scripts/audit.mjs:582-587` "suite members" counter: its OWN copy of the three names and the regex.
- `scripts/xray.mjs:833-838`: every `pkg.scripts` value is scanned with `VERB_AFTER_PATH` (`:773`). The `selftest` verb itself is also reached by its definition (`scripts/xray.mjs:743-748`), so a chain string that stops naming organs orphans no verb.
- `ci_manifest.json:4-5`: the away-day CI lane EXECUTES `npm run organism:selftest` / `npm run squad:selftest`, read by `scripts/awayday.mjs:53` (MANIFEST) and run by `.github/workflows/awayday.yml:37`. **The chains are executed, not only parsed.** Any shape must keep `npm run <suite>` a runnable fast-fail command.
- `scripts/watchman.mjs:800-806` probeSuite(): runs `organism_test.mjs all`. It reads no string itself.
- LANDED WITNESSES that read the strings and run at HEAD in the `witnesses` member (`scripts/organism_test.mjs:2874`):
  - `ci/mfac/witness_mfac.mjs:315-319` W7: `night.mjs selftest` occurs exactly once across the three strings, and no `OWN_MEMBERS` appears in organism_test.mjs.
  - `ci/mpool/witness_mpool.mjs:200-204` P: `usage_tap.mjs selftest` appears in exactly one string, matched by an `&&`-delimited regex.

**The LIVE tables:**

- `LIVE_SELFTESTS` is read by `liveSelftest` (`scripts/organism_test.mjs:242`). It is called from suites() (`:373`), from hermetic()'s loop (`:2228`) and for thalamus (`:2292`).
- `LIVE_ASSERTS` is read by `liveAssert` (`:221-226`, called from `assert` at `:47`) and `skipLive` (`:234-240`), and by `ci/mf2/witness_mf2.mjs:55`, which slices the source between `const LIVE_ASSERTS = Object.freeze({` and `const LIVE_MODES`.
- `LIVE_MODES` is read by main() (`:3026`).
- The printed LIVE names (`selftest <organ>`, `MODE <c>`) reach `scripts/ci_verdict.mjs:35-42` through the `live` field of `ORGANISM_TEST_VERDICT`. A shape that keeps the printed names keeps that reader unchanged.

**`KNOWN_RED` (the literal `const KNOWN_RED = [`)** is read by `ci/mr3/witness_mr3.mjs:85-86`, `ci/mrf/witness_mrf.mjs:152`,
`ci/mrf/run_mutants_mrf.mjs:46`, `ci/mrj/run_mutants_mrj.mjs:47` and `ci/ms1/witness_ms1.mjs:129-130`.

**The CI base leg:** `.github/workflows/suite.yml:122-141` runs the merge base with **its own** organism_test.mjs, and only
when that dies does it run the head's instrument over the base. A new shape therefore has to be read correctly by the old
instrument on the old tree (it is: the old tree carries the old strings). The head's instrument laid over an old base must
fail closed, never silently pass. That is clause H8 below.

**Owners.** None of these is a state file, so no SOLE WRITER header applies, and no state file is read or written by
anything this spec proposes. `package.json` and `scripts/organism_test.mjs` are repository code. By the brief's own rule
the RUNNER is the only hand that lands them on main.

---

## 2 · Q1 — WHICH SHARED LINES DID TWO UNITS TOUCH TOGETHER (the last twenty landings)

A landing is a first-parent commit of main whose subject starts with `unit ` (the groundsman's state push `7c3c279` is not
a unit). The table set is derived from the file at each parent, never typed.

```
$ node ci/mhot/measure_mhot.mjs landings origin/main 20
{"sha":"5759cce","units":["ms1","mrj","mrt","mr3","mrf","mrv"],"tables":["KNOWN_RED","MODES"],"keyMoves":{"MODES":{"add":["witnesses"],"del":[]}},"chains":{}}
{"sha":"4b00cf5","units":["mrung"],…,"chains":{"organism:selftest":{"add":["rung_receipt"],"del":[]}}}
{"sha":"a18c167","units":["mfac"],…,"chains":{"organism:selftest":{"add":["night"],"del":[]}}}
{"sha":"902b6cc","units":["mpool"],…,"chains":{"organism:selftest":{"add":["usage_tap"],"del":[]}}}
{"sha":"d0c8f06","units":["mdn2"],"tables":["MODES"],"keyMoves":{"MODES":{"add":["done"],"del":[]}},"chains":{}}
   (the other fifteen landings touched no shared line)
SHARED organism_test.mjs KNOWN_RED · 1 landing(s): 5759cce
SHARED organism_test.mjs MODES · 2 landing(s): 5759cce d0c8f06
SHARED package.json organism:selftest · 3 landing(s): 4b00cf5 a18c167 902b6cc
MHOT_LANDINGS {"ref":"origin/main","landings":20,"first":"d0c8f06","last":"5759cce","touched_any":5,"shared_lines_touched_by_two_or_more":2,"assembled_landings_touching":["5759cce(ms1+mrj+mrt+mr3+mrf+mrv)"]}
```

Widened to every unit landing on main (46, back to `a4d3430`):

```
$ node ci/mhot/measure_mhot.mjs landings origin/main 60 | grep -E "^SHARED|^MHOT"
SHARED organism_test.mjs KNOWN_RED · 1 landing(s): 5759cce
SHARED organism_test.mjs MODES · 2 landing(s): 5759cce d0c8f06
SHARED package.json organism:selftest · 5 landing(s): 4b00cf5 a18c167 902b6cc 76b0626 a4d3430
MHOT_LANDINGS {"ref":"origin/main","landings":46,"first":"a4d3430","last":"5759cce","touched_any":7,"shared_lines_touched_by_two_or_more":2,…}
```

What this means:

- **Every member added to a chain in the window was appended to `organism:selftest`.** Each add was a brand-new organ
  created in the same unit (`rung_receipt`, `night`, `usage_tap`). With a member-file door, that unit writes only files it
  creates.
- `LIVE_SELFTESTS` / `LIVE_ASSERTS` / `LIVE_MODES` were born at `76b0626` (B1 + mrdr, 2026-11-18). No later landing
  edited them. Their contention is in the **queue**, below.
- `KNOWN_RED` and `MODES` were touched inside ONE assembled landing. KNOWN_RED's cost appears in the assembly's own merges
  (§3).

The queue, each branch measured from its own merge base with main:

```
$ node ci/mhot/measure_mhot.mjs queue origin/main refs/mhot/claude_mcov-build refs/mhot/claude_mlaw-build refs/mhot/land_mgat refs/mhot/claude_mgat-build
{"ref":"refs/mhot/claude_mcov-build","base":"5759cce","tables":["LIVE_MODES"],"keyMoves":{"LIVE_MODES":{"add":[],"del":["gates"]}},"chains":{"organism:selftest":{"add":["deck_lint","home_pin","probe","study_scope"],"del":[]}}}
{"ref":"refs/mhot/claude_mlaw-build","base":"5759cce","tables":["LIVE_SELFTESTS","LIVE_MODES"],"keyMoves":{"LIVE_SELFTESTS":{"add":[],"del":["lawpack"]},"LIVE_MODES":{"add":[],"del":["gates","lawpack"]}},"chains":{"organism:selftest":{"add":["done"],"del":[]}}}
{"ref":"refs/mhot/land_mgat","base":"5759cce","tables":["LIVE_MODES"],"keyMoves":{"LIVE_MODES":{"add":[],"del":["gates"]}},"chains":{}}
{"ref":"refs/mhot/claude_mgat-build","base":"fb42118","tables":["LIVE_MODES"],"keyMoves":{"LIVE_MODES":{"add":[],"del":["gates"]}},"chains":{}}
MHOT_QUEUE {"main":"origin/main","refs":4,"touching":["refs/mhot/claude_mcov-build","refs/mhot/claude_mlaw-build","refs/mhot/land_mgat","refs/mhot/claude_mgat-build"]}
```

All four branches in the queue touch a shared line. mcov and mlaw both append to `organism:selftest`. All three units
delete `gates` from `LIVE_MODES`; mcov and mlaw carry that deletion because they merged land/mgat.

---

## 3 · Q2 — WHAT THE CONFLICTS COST (reproduced with `git merge-tree --write-tree`, no ref moved)

```
$ node ci/mhot/measure_mhot.mjs conflict 2684b64 1b8c379        # mcov's re-cut merge d74f9d4 (mcov vs land/mgat on main)
  CONFLICT package.json:18 · package.json scripts["organism:selftest"]
  CONFLICT scripts/organism_test.mjs:2689 · function gates() (not a table)
MHOT_CONFLICT {"ours":"2684b64","theirs":"1b8c379","clean":false,"files":["package.json","scripts/organism_test.mjs"],…}

$ node ci/mhot/measure_mhot.mjs conflict 7119175 1b8c379        # mlaw's merge 140be7f (mlaw vs land/mgat)
  CONFLICT ci/mdn2/witness_mdn2.mjs:74 · (outside every shared line)
  CONFLICT ci/mdone/witness_mdone.mjs:65 · (outside every shared line)
  CONFLICT scripts/organism_test.mjs:214 · LIVE_MODES
MHOT_CONFLICT {"ours":"7119175","theirs":"1b8c379","clean":false,…}

$ node ci/mhot/measure_mhot.mjs conflict refs/mhot/claude_mlaw-build refs/mhot/claude_mcov-build   # TODAY: the two waiting seats
  CONFLICT package.json:18 · package.json scripts["organism:selftest"]
MHOT_CONFLICT {"ours":"refs/mhot/claude_mlaw-build","theirs":"refs/mhot/claude_mcov-build","clean":false,"files":["package.json"],"shared":["package.json scripts[\"organism:selftest\"]"]}

$ node ci/mhot/measure_mhot.mjs conflict cf1ca54 08b4772        # ms1 assembly, mr3 merge e54e3b6
  CONFLICT scripts/organism_test.mjs:2923 · KNOWN_RED
$ node ci/mhot/measure_mhot.mjs conflict 82f6e1e e2de691        # ms1 assembly, mrt merge b88d7f0
  CONFLICT scripts/organism_test.mjs:2924 · KNOWN_RED
$ node ci/mhot/measure_mhot.mjs conflict 38ae428 542dec7        # ms1 assembly, mrf merge 5368b82
  CONFLICT scripts/organism_test.mjs:2929 · KNOWN_RED
```

Findings:

1. **package.json chain string, two conflicts.** One already cost mcov a hand resolution (d74f9d4). One is open now:
   whichever of mcov and mlaw lands second will conflict. That bears directly on row 1172 (2)'s "whichever returns first
   with a clean merge": against the other's landing, neither merges clean. The cause is structural. The chain is one JSON
   line, so any two appends to it always conflict.
2. **LIVE_MODES, one conflict.** Two adjacent deletions (`gates` by mgat, `lawpack` by mlaw) with no unchanged line
   between them. The brief named it as LIVE_SELFTESTS; measured, it sits in LIVE_MODES at `:214`. mlaw's
   LIVE_SELFTESTS deletion (`lawpack`) merged clean. Alphabetical one-line-per-member tables conflict only on adjacency.
3. **KNOWN_RED, three conflicts**, all inside one assembly. Each unit retired its own entry, and the entries were adjacent.
4. **gates() body, one conflict** (mcov `HEAVY_BOUND_MS` vs mgat's hermetic half). This is a function both units changed,
   not a member table. It is out of this unit's scope and named so that nobody counts it as a table conflict.
5. **ci/mdn2, ci/mdone witness plants, two add/add conflicts.** These are landed witness files carried by two branches, not
   suite tables. Out of scope; named.

---

## 4 · Q3 — THE SHAPE (lettered options, recommendation, the measurement that decides)

The requirement (row 1172 (3)): a unit adds its member without editing a line another unit edits. The coverage law still
reads every member. `npm test`'s runner still runs every member independently. Nothing a member list hides.

### Option A — membership declared in the organ's own header line
`// SUITE: organism` (and `// HERMETIC-LIVE: <reason>`) at the top of each organ, read by regex the way `hasSelftest`
already reads source (`scripts/organism_test.mjs:290`).
- For: zero shared lines, and the organ is the unit's own file.
- Against, and this is decisive: the migration edits the top of **every organ that has a selftest** in one commit. Row
  1172 (2) already records that "organ bytes moved in the merge" forces one architect re-run per waiting unit. A
  whole-organ sweep moves organ bytes under **every** unit in flight. It also makes every future change to an organ's
  membership an edit to that organ's file, so it collides with whichever unit owns that organ that week.

### Option B — one file per member under a directory the suite walks (RECOMMENDED)
`suite/members/<organ>.json` = `{ "suite": "organism:selftest", "argv": ["selftest"], "live": null | "<reason>" }`.
- Adding a member creates one new file. Making a member hermetic-LIVE, or the reverse, edits that member's file and no
  other. Two units collide only if they change **the same member**, which is a real conflict about the same fact.
- "Exactly one suite" becomes structural, which is stricter: a file has one `suite`. The double-billing assert stays as a
  guard on the walk.
- `test_coach_v2`'s bare argv moves from the special case at `scripts/organism_test.mjs:377` into its own file
  (`"argv": []`), so the runner names no organ.
- The three chain strings become `node scripts/organism_test.mjs chain organism:selftest` (and the same for squad and
  audit). Each is written ONCE at the build and never edited by a unit again. `chain` is a verb dispatched like
  `selftest` (`:3016`), NOT a `MODES` key, so `all` never runs it. It reads the same walk and spawns each member in walk
  order with inherited stdio, **stopping at the first red**, so the `&&` fast-fail that `ci_manifest.json:4-5`, awayday and
  a human `npm run` rely on is kept.
- The suite's runner (suites(), hermetic()) and the coverage law read the walk through ONE exported pure reader,
  `suiteRoll(root)`. `scripts/audit.mjs:585` stops keeping its own copy of the names and regex and reads the roll by
  spawning `organism_test.mjs roll --json`. organism_test's law is that it spawns organs and never imports them; audit
  spawning the suite keeps that direction.
- `LIVE_SELFTESTS` folds into the member files (L9: moved, not deleted; the struck record stays at `:85` as a comment
  naming `organism_test.mjs roll`). `liveSelftest` reads `roll.live` and prints the SAME `selftest <organ>` name, so
  `scripts/ci_verdict.mjs:35-42` is unchanged.
- Readers that must move: `organism_test.mjs:293-345, 365-392, 2228, 2292, 242`, `audit.mjs:582-587`,
  `ci/mfac/witness_mfac.mjs:315-319` (W7), `ci/mpool/witness_mpool.mjs:200-204` (P). The last two are re-cut in place as
  ADDED edits: the same property ("in exactly one suite") stated against the roll. This is ms1's precedent. See fork F6.

### Option C — one package.json key per member
`"organism:selftest:<organ>": "node scripts/<organ>.mjs selftest"`, sorted, with the chain made a verb that reads the
prefix.
- For: xray's `VERB_AFTER_PATH` and a human's single-member `npm run` keep working unchanged.
- Against: every unit still edits the SAME file (package.json), so adjacent inserts conflict. The LIVE reason has nowhere
  to live, so `LIVE_SELFTESTS` stays a shared table. It is a halfway house.

### Option D — keep the strings, generated by the runner at landing from A/B's source
- Against: between a unit's build and its landing, the string disagrees with the source. Either the unit carries a named
  red for its whole life, or it regenerates the string, and then the conflict comes back. Rejected. It is listed so the
  architect sees it was weighed.

**Recommendation: B.** The measurement that decides it is §2–§3. Every member-add in the window was a NEW organ, so B
gives it a NEW file. The open conflict, mcov × mlaw, is two appends to one line, and B removes exactly that line from
every future unit's diff. And under A, the cost row 1172 (2) names (re-runs whenever organ bytes move) would apply to
every unit in flight.

**What B leaves where it is, by measurement:**
- `LIVE_ASSERTS`: no contention in 46 landings and none in the queue. A move would cost mf2's landed witness
  (`ci/mf2/witness_mf2.mjs:55`) a re-cut and gain nothing measured. Fork F3.
- `MODES`: two appends in 46 landings, zero conflicts. Fork F4.
- `LIVE_MODES`: one conflict, by adjacency. Fork F4.
- `KNOWN_RED`: three conflicts in one assembly, and empty of entries today. Fork F5.

---

## 5 · THE CODE PATH (what a build writes; nothing here is built by this seat)

1. `suite/members/<organ>.json`: one file for each member of the three strings at base. Each holds its suite, its argv
   (`["selftest"]`, or `[]` for test_coach_v2) and `live` (the base's LIVE_SELFTESTS reason, byte-equal, or `null`).
2. `scripts/organism_test.mjs`:
   - `export function suiteRoll(root)` walks `suite/members/*.json` and returns `[{ organ, suite, argv, live, file }]`
     sorted by organ. A file that does not parse, a suite not in `SUITE_NAMES`, or an argv that is not an array is
     returned as a named defect, never dropped.
   - coverage() asserts four things off the roll. **orphan**: an organ with a selftest has no member file. **ghost**: a
     member file names a missing organ. **malformed**: a defect from the walk. **exactly one**: kept as a guard. The floor
     at `:332` stays and may only rise.
   - suites() and hermetic() take the argv and the LIVE flag from the roll.
   - New verbs `chain <suite>` (fast-fail, inherited stdio, exit = the first red's code) and `roll [--json]` (prints the
     roll, one line per member). Both are dispatched beside `selftest` at `:3016`, outside `MODES`.
   - `LIVE_SELFTESTS` is folded into the files, with a struck record comment.
3. `package.json:18/19/21`: the three strings become the `chain` command, once. `:17/:20/:22`: the law prose names the
   directory and the verb (fork F7).
4. `scripts/audit.mjs:582-587` counts `roll --json`.
5. `ci/mfac/witness_mfac.mjs` W7 and `ci/mpool/witness_mpool.mjs` P are re-cut in place as ADDED edits (fork F6).

---

## 6 · THE WITNESS (`ci/mhot/witness_mhot.mjs`, proposed): each plant RED on base, GREEN on the build

Every plant is built under `os.tmpdir()` (`mkdtempSync`). It copies only `scripts/organism_test.mjs`, `package.json` and,
for the build, `suite/`, using `git show <sha>:<path>`; nothing comes from the working tree. It adds the planted organs
`scripts/zz_mhot_a.mjs` (selftest prints `MHOT_A_RAN`, exit 0), `zz_mhot_b.mjs` (prints `MHOT_B_RED`, exit 1) and
`zz_mhot_c.mjs` (prints `MHOT_C_RAN`, exit 0). A plant "adds a member BY THE TREE'S OWN DOOR". On a tree whose chain
strings name organs (the base), the door is: append `&& node scripts/<organ>.mjs selftest` to the string, and insert the
LIVE key before the table's closing line. On a tree with `suite/members/` (the build), the door is: write the member
file. The planted tree has no `dressing-room/` at all.

| Clause | Plant | RED on base because | GREEN on the build because |
|---|---|---|---|
| **H1 DISJOINT ADD** | temp `git init`; base commit; branch A adds zz_mhot_a and branch B adds zz_mhot_b, both to `organism:selftest` by the door; `git merge-tree --write-tree A B` | both append to the one JSON line, so exit ≠ 0 | two new files, so exit 0 |
| **H2 DISJOINT LIVE** | both planted organs start LIVE; A un-LIVEs a, B un-LIVEs b | adjacent table lines conflict | each edits its own file |
| **H3 COVERAGE READS EVERY MEMBER** | `organism_test.mjs coverage` in the plant, then the plant with zz_mhot_c's membership removed | the base ignores member files, so a and c are named orphans | no orphan; with c's file removed, the orphan line names exactly `zz_mhot_c` |
| **H4 EVERY MEMBER RUN INDEPENDENTLY** | `organism_test.mjs suites` in the plant | the planted members are not members | `SUITE MEMBER · zz_mhot_a` ok, `· zz_mhot_b` FAIL, `· zz_mhot_c` ok: c ran AFTER b's red |
| **H5 THE CHAIN FAST-FAILS** | `npm run organism:selftest` in the plant (through `npm_execpath` when set, else the shell; Windows runner) | base string names absent organs, so `MHOT_A_RAN` is never printed | `MHOT_A_RAN` and `MHOT_B_RED` printed, `MHOT_C_RAN` NOT printed, exit ≠ 0 |
| **H6 ONE READER** | `git grep` of the tree for the three-name literal or the member regex outside `scripts/organism_test.mjs` | `scripts/audit.mjs:585` and the two witnesses | none outside organism_test.mjs; audit reads `roll --json` |
| **H7 NOTHING LOST IN THE MOVE** | the build's `roll --json` on a `git archive` copy of the build vs the base's three strings and LIVE_SELFTESTS | no `roll` verb | per suite, the member SET equals the base's; every LIVE reason is byte-equal; test_coach_v2 argv `[]` |
| **H8 FAILS CLOSED ON AN OLD TREE** | the build's instrument over a base copy (suite.yml's fallback, `.github/workflows/suite.yml:129-141`) | no `suite/` exists, so the base instrument reads its strings (GREEN, a guard) | the build instrument on a tree with no `suite/` reds by name ("no member directory"), never 0 members passing |
| **H9 LANDED READERS HOLD** | `--only` runs of mfac W7, mpool P, mf2 F1, mr3/mrf/mrj/ms1's KNOWN_RED readers at the build | (guard, GREEN on both) | GREEN, re-cut where fork F6 rules |
| **BOUND** | `git diff --name-only <base> <build>` | (guard) | exactly the files of §9 |
| **LAST** | the witness's last line is `MHOT_WITNESS {…}` | (guard) | ok |

**THE PORT CLASS (row 1053).** No clause binds a port, names a live service, POSTs at a daemon or restarts anything. The
plants spawn only node, git and npm, on temp trees. Every spawn has a bound, and the bound is derived, never typed: the
job's own `timeout-minutes` read from `.github/workflows/suite.yml`, the way the witnesses member reads it
(`scripts/organism_test.mjs:2886-2888`).

**MUTANTS (`ci/mhot/run_mutants_mhot.mjs`, one per clause, each RED by its own clause only):**

| Mutant | Edit to the build | Clause it must red |
|---|---|---|
| M-H1 | the door also appends a roster line in organism_test.mjs | H1 |
| M-H2 | `liveSelftest` reads a restored LIVE_SELFTESTS table | H2 |
| M-H3 | `suiteRoll` skips files of one suite | H3 |
| M-H4 | suites() `break`s at the first red | H4 |
| M-H5 | `chain` runs every member (no stop at red) | H5 |
| M-H6 | audit.mjs keeps its own regex | H6 |
| M-H7 | the member file of test_coach_v2 is dropped | H7 |
| M-H8 | `suiteRoll` returns `[]` with no defect when the directory is absent | H8 |
| M-H9 | mpool P left unre-cut | H9 |
| M-BOUND | one extra organ byte | BOUND |

---

## 7 · FORKS (each one the architect rules)

- **F1 · the shape.** A organ header · **B member file per organ (RECOMMENDED)** · C a package.json key per member · D
  generated strings. Decided by §2–§3: every add was a new organ, and the open conflict is one JSON line. A is ruled out
  by row 1172 (2)'s re-run cost under a sweep of organ bytes. *What would overturn B:* a measurement that most member
  changes are made by the organ's own unit in the same commit as its bytes. That favours A. Today all three adds were,
  so A and B tie on adds, but B wins on every LIVE move by a non-owner (mlaw's lawpack, mcov's home_pin).
- **F2 · the directory.** **A `suite/members/` (RECOMMENDED)** · B `scripts/suite_members/` · C under `ci/`. C is wrong
  because `scripts/land.mjs:44,141` treats every new `ci/` path as a witness. B puts non-organ files inside the organ walk.
  *Decides:* N2 (does any guard refuse a new top-level path?).
- **F3 · LIVE_ASSERTS.** **A stays (RECOMMENDED; zero contention measured)** · B moves to a `{ live }` option at each
  assert call. *Decides:* a re-run of `landings` once twenty more units land; a second editor of LIVE_ASSERTS means B.
- **F4 · MODES and LIVE_MODES.** **A stay (RECOMMENDED)** · B each mode's LIVE reason sits beside its function
  (`gates.live = "…"`), so a removal edits the mode's own lines. The one measured conflict (`:214`) was adjacency; B would
  have moved it into gates(), which mcov and mgat were already editing (§3 finding 4). *Decides:* whether the next LIVE_MODES
  edit comes from a unit that does not also edit that mode's function.
- **F5 · KNOWN_RED.** **A stays (RECOMMENDED; empty today, its conflicts arose only inside an assembly)** · B one file per
  entry under `suite/known_red/` · C sorted with a blank line between entries. Four landed witnesses read the literal
  (§1.2), so B costs four re-cuts. *Decides:* whether the next assembly carries more than one KNOWN_RED edit.
- **F6 · the landed witnesses that read the chain strings (mfac W7, mpool P).** **A re-cut in place as ADDED edits, the
  same property against the roll (RECOMMENDED; ms1's precedent)** · B a KNOWN_RED entry each until their units re-judge ·
  C keep the strings as a mirror. C hides nothing, but it is a second list that rots, and that is the failure this unit
  exists to remove.
- **F7 · the law prose at `package.json:17/20/22`.** **A rewritten once to name the directory and the verb (RECOMMENDED)**
  · B left, with a struck line pointing at `organism_test.mjs roll`. The prose is the only place `npm run` users read the
  law.
- **F8 · where `chain` lives.** **A a verb of organism_test.mjs outside `MODES` (RECOMMENDED)** · B a new organ, which
  would itself need a member file and a selftest.
- **F9 · the interim, until mhot lands (row 1172 (3)'s last sentence, which is the runner's rule, not this seat's).**
  Measured now: mcov × mlaw conflicts only at `package.json:18`, and land/mgat merges clean with each of them. Whichever
  lands second needs a one-line hand resolution (keep both appends) and one architect re-run. **The resolution is
  mechanical: the union of both member sets.** The architect may rule A: the runner resolves by union and re-runs that
  unit's witness. Or B: mhot lands first and both re-cut onto it (each then adds member files instead).
  *Decides:* which of mcov and mlaw is green first. That is a runner reading, not reachable from this seat.

---

## 8 · NAMED NOT GUESSED

- **N1 · the full profile on his laptop.** The full profile could not be run here: it reads `dressing-room/state`, his
  daemons and the Windows task table. What would measure it: `node scripts/organism_test.mjs all` on his laptop at the
  build, compared with the same at `5759cce`. Expect equal reds.
- **N2 · whether a new top-level `suite/` path is refused by a guard** (freeze guard `scripts/freeze.mjs`, the groundsman's
  `PUBLISH_ALLOWLIST` `scripts/groundsman.mjs:126-130`, the `hooks/pre-commit` tripwire). The groundsman only PUSHES its
  allowlist, so the runner's pushes are a separate path. The pre-commit hook runs on his machine only. What measures it:
  `node scripts/freeze.mjs status` and a dry `git commit` of a planted `suite/members/x.json` on his laptop.
- **N3 · why the neutral machine is green at `5759cce` while this container reds coverage on four orphans.** Not
  established here. The CI log of run 135919452425 says it. Reading it needs a token or the web UI, which this seat does
  not use.
- **N4 · npm on the Windows runner for H5.** Whether `npm_execpath` is set inside a node child on `windows-latest` cannot
  be measured from Linux. The first CI run of the witness measures it; the shell fallback is named in H5.
- **N5 · the mgat-spec, mlaw-spec and mcov-queue branches' own statements of these conflicts.** Not read (scope: this unit
  reads code and git, not other seats' prose).

---

## 9 · THE FILES A BUILD WOULD TOUCH

`suite/members/*.json` (new; one for each member of the three base strings) · `scripts/organism_test.mjs` ·
`package.json` (`:17-22` only) · `scripts/audit.mjs` (`:582-587`) · `ci/mfac/witness_mfac.mjs` (W7) ·
`ci/mpool/witness_mpool.mjs` (P) · `ci/mhot/witness_mhot.mjs`, `ci/mhot/run_mutants_mhot.mjs`, `ci/mhot/BASE`,
`ci/mhot/PROOF.md`, `ci/mhot/LEDGER.jsonl`. Any other file is a fork. In particular, **no organ under `scripts/` other
than organism_test.mjs and audit.mjs, and no file under `dressing-room/`.**

---

## 10 · THIS BRANCH'S CHECK RUNS

Recorded in the ledger (`ci/mhot/LEDGER.jsonl`) after each push. The FINAL MESSAGE names the last push's runs and verdict.
