# UNIT MTRAP · BUILD PROOF — a note under the bar of three distinct traps is refused at compile and gate, by name, with its count, before any reader is paid

Branch `claude/mtrap-build`, a seat build of 21 Nov 2026 (forks rows 1198 / 1230). Not a landing.
Every act is a row of `ci/mtrap/LEDGER.jsonl` (ts, act, cmd, last_line).

## 0 · BASE

- Cut from main **5301f1582f7a1dbc9ec9605434c9db5d8bd19107** (`ci/mtrap/BASE`, one 40-hex line), with mcrk on it.
  At the cut, `git fetch origin main && git rev-parse origin/main` gave the same sha: main had not moved past it.
- The spec is `ed6402d:ci/mtrap/MTRAP_SPEC.md` (the ruled tip of `claude/mtrap-spec`), read whole with its ledger.
- The spec cites lines at its own base 5759cce. They were re-measured at 5301f15 before any edit, with
  `git show 5301f15:<file> | grep -n`. mcrk moved them:

| Spec cite (5759cce) | At the cut (5301f15) |
|---|---|
| `notes_compiler.mjs` verdictOf `:481`, covered `:488` | `:516`, `:523` |
| stubReader `:508-514` | `:545-549` |
| gateDay `:556`, targets `:562`, expect loop `:600` | `:590`, `:597`, `:635` |
| buildNote traps `:316-353` (crack `:323`, ids `:353`) | `:319-381` (crack `:331`, ids `:381`) |
| compileDay result `:471` | `:506` |
| glanceLines `:616` · summary `:674` · say `:961` · status `:1003` | `:651` · `:709` · `:1018` · `:1059` |
| the mcrk import `937710b:…:109` | `:109` (mcrk landed) |
| `forge_session.mjs` contractLines `:625`, axes line `:654`, `case "contract"` `:2997-3007` | `:699`, `:728`, `:3111-3121` |
| `learnstate.mjs` askedFirst `:710-729`, print `:1091`, C22 cases `:2077-2102` | unchanged: `:710-730`, `:1091`, `:2077-2102` |
| `models.mjs:449` cold_reader | unchanged: `:449` |

## 1 · WHAT WAS BUILT

**One predicate, `gateableOf(note)`**, returns `{gateable, have, need, owed}`.
- `have` counts the note's distinct traps by **folded bait** (mtrap-2 b).
- Only **this lesson's cracks and corrections** count (`COUNTED_FROM`, mtrap-3 b, the ruling). A capsule trap stays in
  the note as teaching material and is never counted.
- The placeholder bait (`NO_BAIT`, a diff with no `-` line) and an empty bait never count.
- The bar is `TRAP_BAR`. `verdictOf` and `stubReader` read it in place of their literal three (mtrap-6 a).
- The predicate only counts. `buildNote` is not edited, and nothing is added to `traps`.

**The gate** (`gateDay`): a target under the bar is refused before the deadline check and before any reader, the stub
included. It is pushed as `op:"not-gateable"` with `have · need · owed` and a why that names concept, axis and note id.
- No row is written (mtrap-1 a).
- `ok` stands, so the exit is as at base for a thin day (mtrap-5 a).
- The `expect` loop skips a thin note, so no `day-unmatched` absent row is written for it.

**Every reader of a verdict derives "not gateable" from the compiled row:**
- `compileDay`'s result carries `gateable · have · need · owed`.
- The CLI `say` line prints `NOT GATEABLE (… owed)` on stderr at the compile and `op not-gateable` at the gate.
- The summary gains `/ N not gateable (< 3 traps) /`, and the `gate` CLI line gains the same count.
- The glance header gains `· N not gateable`. A thin block reads
  `gate NOT GATEABLE (h of 3 traps · o owed) · kept FAIL <gate id>`. pass/fail/absent are counted over gateable notes only.
- `status` gains `· N live note(s) not gateable (< 3 traps, kept rows beside them)`.

**C22** (`learnstate.askedFirst`, mtrap-9 b) counts over every compiled note gated at or before now, superseded ones
included: `pass p · fail f · not gateable g (…) · ungated u`.

**The door** (mtrap-4 a): when the latest live note of (concept, ON axis) is under the bar, the pacer's per-turn
`axes:` line carries
` · note <axis>: <have>/<need> traps — <owed> trap owed (from the lesson's own bait, never made up; a new day's note counts
only the windows that touched its day)` (mtrap-7 b).

**The skill line** (mtrap-10 b): one line each in `.claude/skills/forge/SKILL.md` and `.claude/skills/learn/SKILL.md`,
beside mcrk's crack line.

**Not built:** mtrap-8 b, the live in-lesson count. It is ruled as its own later unit.

## 2 · NAMED FILES — exactly these differ from 5301f15

`scripts/notes_compiler.mjs` · `scripts/forge_session.mjs` · `scripts/learnstate.mjs` · `.claude/skills/forge/SKILL.md` ·
`.claude/skills/learn/SKILL.md` · `ci/mtrap/BASE` · `ci/mtrap/witness_mtrap.mjs` · `ci/mtrap/run_mutants_mtrap.mjs` ·
`ci/mtrap/PROOF.md` · `ci/mtrap/LEDGER.jsonl` · `ci/witness/mtrap/witness_traps.mjs`.

The witness's BOUND clause reads it: `GREEN BOUND · 10 file(s) differ` (PROOF.md is the eleventh, committed after the run).
Untouched: `scripts/models.mjs`, `postmatch.mjs`, `state.mjs`, `done.mjs`, `daily_green.mjs`, `ci/witness/mcap/*`, and
everything under `dressing-room/state` (the tracked `compiled_notes.jsonl` blob is `22a8494` at both cut and tip).
`.claude/settings.json` is not on this branch.

## 3 · THE WITNESS, BOTH WAYS (last lines)

```
$ node ci/mtrap/witness_mtrap.mjs --org <git archive of the tip> --base-org <git archive of 5301f15>
GREEN MTRAP a note under the bar of three distinct traps (…) · 12 clause(s)                       (exit 0)

$ node ci/mtrap/witness_mtrap.mjs --org <git archive of 5301f15> --base-org <same>
RED MTRAP · W1, W2, W3, W4, W5, W6, W7, W8, W9, SKILL                                          (exit 1)

$ node ci/witness/mtrap/witness_traps.mjs plants --base-tree <5301f15 archive>          # the clause witness at head
PLANTS mtrap · 10 of 10 plant(s) as expected
$ node ci/witness/mtrap/witness_traps.mjs plants --tree <5301f15 archive> --base-tree <same>
PLANTS mtrap · 0 of 10 plant(s) as expected
```

- **Every behaviour clause is RED at base and GREEN at the build.** The capsule clause is W9, the ruling's added
  clause for mtrap-3 b. It is planted both ways: the base's stub gate PASSES a note whose third trap is a capsule trap,
  and the build REFUSES it.
- **BOUND and LAST are seat-time clauses**, mcrk's shape: they read GREEN on any honest tree pair.
- **Every plant is a copy under os.tmpdir().** The archive is written through the copy's own archivist, the reader is the
  compiler's stub or a counting wrapper of it, and a refusing `claude`/`gemini` shim sits first on the PATH.
- **The port class holds:** no port, no service, no POST, no restart. Every wait is a child's exit.
- **One piece of tracked state is copied:** the tree's tracked `registry.json`, because learnstate's import graph
  reads its lanes. That is `ci/witness/mmeter/plant_day.mjs`'s precedent.

## 4 · THE MUTANTS

```
$ node ci/mtrap/run_mutants_mtrap.mjs --org <tip archive> --base-org <5301f15 archive>
run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN
```

M1 gateDay ignores the predicate → W1 · M2 traps padded to the bar → W1 · M3 say drops not-gateable → W2 ·
M4 distinct by id → W3 · M5 predicate always false → W4 · M6 no contract fragment → W5 · M7 a not_gateable row appended
for the old notes → W6 · M8 `covered` reads `>= 2` → W7 · M9 every failed note called not gateable → W8 ·
**M10 a capsule trap counted → W9** (the ruling's mutant) · M11 no forge skill line → SKILL.

## 5 · MEMBERS AND SELFTESTS, CUT → TIP (headline lines)

```
notes_compiler.mjs selftest   5301f15: notes_compiler selftest: 48 passed, 0 failed
                              tip:     notes_compiler selftest: 55 passed, 0 failed
forge_session.mjs selftest    5301f15: forge_session selftest: 243 passed, 0 failed
                              tip:     forge_session selftest: 243 passed, 0 failed
learnstate.mjs selftest       5301f15: ALL CHECKS PASSED (149 ok lines)
                              tip:     ALL CHECKS PASSED (152 ok lines)
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
                              5301f15: organism_test: 165 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
                              94043a4: organism_test: 165 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
                              da21af9: organism_test: 166 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run) — +1 = the clauses member over ci/witness/mtrap/
ORGANISM_TEST_LAWPACK         identical at 5301f15, 94043a4 and da21af9 (depcruise_errors 7 · bare-catch 37 · …)
node scripts/models.mjs check exit 0 · literal model names outside models.mjs: 0
```

**Two selftest fixtures changed in substance.** A gate may only get stricter, and both were made to stand at the new bar.
- **notes_compiler.** The fixture lesson held 1 crack, 1 correction and 2 capsule traps, which is 2 counted traps under
  mtrap-3 b. It gained a second lesson correction, added through `notes_corrections.mjs add`, its own owner's door. Its
  match text occurs in no other fixture line. The STRIKE AND TRAPS assertion now reads
  `crack,correction,correction,capsule,capsule` / `T1…T5`.
- **learnstate.** The C22 fixture `n-pass` carried no `note` body. It now carries one at the bar.

Every other old assertion is byte-unchanged.

## 6 · THE CYCLE AND THE LEDGER, CUT → TIP

```
npx depcruise scripts --config .dependency-cruiser.cjs
  5301f15: x 7 dependency violations (7 errors, 0 warnings) — the pre-existing brain/sitting/state and context_manifest/learnstate/brain cycles
  tip:     the same 7 (sorted diff empty); learnstate.mjs → notes_compiler.mjs is a static edge, NOT circular
  spec §3.4's lazy import of the compiler from the pacer, measured: x 8 — +1 no-circular forge_session → notes_compiler → forge_session
node scripts/xray.mjs report      Q2 (0) · Q5 (0) at the cut and at the tip
git rev-parse <sha>:dressing-room/state/compiled_notes.jsonl     22a8494… at 5301f15 and at the tip (no row rewritten)
notes_compiler status   5301f15: 8 compiled · 3 live · 5 superseded · 7 gate row(s) · 0 live gate-passed
                        tip:     the same, plus · 2 live note(s) not gateable (< 3 traps, kept rows beside them)
gate rows by verdict    {"fail":7} at both — no verdict row moves
C22 (askedFirst, 21 Nov) tip: pass 0 · fail 2 · not gateable 5 (fewer than 3 traps, kept fail rows beside them) · ungated 0
```

The cloud copy holds 7 gate rows; the five a/b notes read not gateable, the two tracked axis-c notes stay true fails.

## 7 · THE PARALLEL BUILD (mbank, `claude/mbank-build` 7347d55, read 21 Nov 2026)

At my cut the branch did not exist (`fatal: couldn't find remote ref`). Read before the last push:
- **forge_session.mjs.** mbank inserts at base `:651` and edits crackRow `:659-676`, `:797`, `:873`, and the selftest
  `:2701`. Mine: one inserted block after appendCrack (base `:699`), the contractLines signature and axes line
  (`:699`, `:729`), and `case "contract"` (`:3121`). **No shared line.** The nearest pair is its `:676` and my `:699`.
- **notes_compiler.mjs.** mbank edits base `:354` (buildNote's crack stamp, its turn_id). I do not touch buildNote.
  **No shared line.**
- **forge/SKILL.md.** mbank inserts after `:48`, mine after `:32`. **learn/SKILL.md**: mbank does not touch it (it edits
  learn/REFERENCE.md). **No shared line.**
- `git merge-tree --write-tree HEAD origin/claude/mbank-build` exits 0. The two trees merge clean, no conflict.

## 8 · FORKS (each one line; the ruling wins over the spec, each difference named)

- **mtrap-B1 · THE BAR'S HOME.** Spec §3.4 put `gateableOf` in the compiler and had the pacer lazy-import it. Measured,
  that is an 8th depcruise error, and the lawpack ratchet holds 7, so it would read RED. The predicate and its constants
  therefore live in `forge_session.mjs`, and the compiler RE-EXPORTS them, so every reader still asks the compiler. The
  brief bounded forge_session to "the contract case and contractLines only"; this block sits directly above contractLines.
  The alternatives were a new leaf file (a file beyond the named list) or a spawn (a typed timeout). Architect's call.
- **mtrap-B2 · THE PACER READS THE LEDGER ITSELF.** The contract case parses `compiled_notes.jsonl` read-only for the
  newest live row of (concept, axis): a 4-line twin of the compiler's `noteState`/`latestLive`. It is forced by B1, since
  the compiler cannot be imported from the pacer.
- **mtrap-B3 · A THIN NOTE NEVER SERVES A STRIKE.** Spec §3.3 kept C22's candidates unchanged. Under mtrap-3 b, a note
  passed on a capsule trap would otherwise serve a strike while its glance reads NOT GATEABLE. It is excluded, the
  stricter reading. No tracked note holds a capsule trap, so no verdict moves.
- **mtrap-B4 · mtrap-7 b's sentence rides the CONTRACT line too**, not only the skill line, because the ruling is b for
  the line as a whole.
- **mtrap-B5 · no forge_session selftest case was added.** The brief bounds that file to the contract case and
  contractLines. W5 (planted both ways) and M6 carry the door instead.
- **mtrap-B6 · glance's pass/fail/absent counts exclude thin notes**, so the header never counts a kept fail twice.
- **mtrap-3 · RULED B, not the spec's A** (row 1230, a working ruling on the open-with-him list, reversible by his
  word). Built as ruled, with W9 and M10.

## 9 · NAMED, NOT GUESSED — owed to the runner, on his laptop, counts only

- **The eighth gate.** The laptop ledger has one more axis-c note. Run `node scripts/notes_compiler.mjs status` and C22
  under the tip. Expect `not gateable 5 · fail 3`.
- **His live `forge_session.json`.** Run `node scripts/forge_session.mjs status` to see whether an axis is ON and the
  fragment would print.
- **The hook cost** of the contract's one extra ledger read per study turn. Time `node scripts/turn_hook.mjs prompt` at
  base vs tip.
- **Multi-day axis windows** (mtrap-7). Run `glance --date D` per study day.
- **The rung L1 witness** (`cloud/ml1/witness/rung_L1.mjs`) is not in this tree, so whether it pins the gate's `op` set
  is unmeasured.

## 10 · CI

The check runs of each push are read through the public API with no token, and recorded in the ledger as `ci` rows.


## 11 · NEW MAIN 7bf008b (mdet dfe26a1 · mdtl2 4d582d5 · mclk 7bf008b), merged 21 Nov 2026

- **The merge:** `git fetch origin main` → `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`, then `git merge --no-edit FETCH_HEAD` →
  merge commit **f9c4002**. It is a merge commit, never a rebase or a force push.
- **No file conflicted.** Main changed none of the named files since 5301f15, so every landed line of mdet, mdtl2 and mclk
  is kept as is (`scripts/organism_test.mjs`, `package.json` and `ci/` included).
- **`ci/mtrap/BASE` stays 5301f15.** It is written once and never rewritten after a merge.
- **BOUND, measured against 5301f15:** RED. Its "beyond the named" list is the three landed units' own files, which the
  suite member tolerates as red beyond BOUND.
- **BOUND, measured against 7bf008b:** GREEN, with only the named files differing.
- **mclk:** no clause of this witness derives a day from the clock. Every plant passes a fixed instant, `now` /
  `--date 2026-10-06`, or C22's `2026-11-21T00:00:00.000Z`.

```
witness  --org <f9c4002> --base-org <7bf008b>   GREEN MTRAP … · 12 clause(s)        (BOUND · 11 file(s) differ)
witness  --org <7bf008b> --base-org <7bf008b>   RED MTRAP · W1, W2, W3, W4, W5, W6, W7, W8, W9, SKILL
mutants  --org <f9c4002> --base-org <7bf008b>   run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN
hermetic suite at f9c4002                       organism_test: 167 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
CI 5839264 (pre-merge tip)                      136754495430 hermetic twice · node 22 success · 136754495422 hermetic twice · node 24 success · npm test legs in progress at the read
```


## 12 · THE FOURTH FAIL (forks row 1249, 21 Nov 2026) — the runner's laptop at 86355a7 reads C22 `pass 0 · fail 4 · not gateable 5 · ungated 0`

**The runner's other laptop counts** (as handed, counts only):
- The owed fragment printed 0 of 9 times, because axis e has no live note.
- The contract costs about +86 ms at the median.
- Glance 13–21 Nov shows one note on each of 15, 17 and 20 Nov, and no day with two.
- The L1 witness pins no row-kind set, and both trees read the same.

**What the cloud copy holds.** The tracked ledger's last commit is `7c3c279` (19 Nov). It is the same blob at 5301f15, 7bf008b
and the tip. Read by `gateableOf` (concept, axis, day and counts only):

```
neuralnet · axis a · 13, 14 (superseded), 15 Nov (live) · 2 traps each · kept FAIL  → not gateable 3
neuralnet · axis b · 16 (superseded), 17 Nov (live)     · 2 traps each · kept FAIL  → not gateable 2
neuralnet · axis c · 17 Nov (superseded)                · 5 traps      · FAIL       → fail
neuralnet · axis c · 18 Nov (live in the cloud copy)    · 5 traps      · FAIL       → fail
```

The cloud copy alone reads `fail 2`.

**Which note is the fourth.** Two laptop axis-c notes are absent from the cloud copy. Both are **neuralnet · axis c** notes
with five or more counted traps, each with a FAIL gate.
- **One is the spec's "eighth gate"** (ed6402d §1/§8): the third axis-c note, unpushed at the spec's probe on 20 Nov.
- **The other is the one the runner's glance places on 20 Nov.**
  - On the laptop, axis a's live note is the 15 Nov one and axis b's is the 17 Nov one.
  - The runner's glance shows no note on 18 Nov, so the 18 Nov axis-c note has been superseded there.
  - The only later day with a note is 20 Nov. So the live **neuralnet · axis c · 20 Nov** note is a recompile, gated FAIL
    at the 20 Nov day close.
- **That 20 Nov note is the fourth fail.** If the eighth gate and the 20 Nov note were one note, the reading would be
  fail 3. It reads fail 4, so they are two.
- **This is inferred, not read.** The cloud holds neither row. The count-only command that settles it on the laptop:
  `node --input-type=module -e "<per gated compiled row: day, concept, axis, counted traps, last verdict, live>"`, the same
  one that printed the cloud table above.

**Why my expectation said 3.**
- I copied the spec's §8 expectation, "3 axis-c with 5". It counted the gates standing at the spec's probe on 20 Nov,
  before the 20 Nov day close compiled and gated one more axis-c note.
- I did not ask the laptop's ledger for its newest gate. Under mtrap-9 b (row 1230), C22 counts **every** compiled note
  gated at or before now, superseded ones included. So each recompile and re-gate of the same axis adds one fail.
- That is the ruled reading. The error was in my expectation's date, not in the count.

**Does any line of the build change? No.**
- `not gateable 5` matches.
- The four fails are four distinct gated notes. Each has at least 3 distinct counted traps and a kept FAIL row, which is
  exactly what mtrap-9 b counts.
- The build wrote no row. The laptop's gate rows were written by main's own day close, which the build does not run.
- One reading is named for the architect, not changed: under b, the fail count grows with every recompile of the same
  axis. It counts gated notes, not axes. A per-axis count would be a new fork, not a fix.

CHECKPOINT · the fourth fail named (neuralnet · axis c · 20 Nov, the laptop's live recompile; inferred, the cloud holds neither row) · no build line changes · STOPPED at 2026-11-21T08:41 UTC · resume from the next ruling
