# PROOF · unit mdn2 — lane files · clean plants · done in the suite (forks row 1051 (4))

Branch `claude/mdn2-build`, cut 18 Nov 2026 from **`origin/main` `4d166d3`**, which already carries `scripts/done.mjs`
(the unit mdone landing), so `claude/mdone-landing` was not needed (that ref does not exist on origin: `git fetch origin
claude/mdone-landing` answered "couldn't find remote ref"). Spec: proof forks 3, 5 and 6 of `ci/mdone/PROOF.md` §8 on
`claude/mdone-build` `781894f`, with that branch's `scripts/done.mjs`, byte-equal to main's at the base.

## 1 · MEASURED at the base `4d166d3` (18 Nov 2026)

| Fact | Where |
|---|---|
| done.mjs guesses a lane's file from its SUBJECT (`brain_out/<subject>`, `<subject>.json(l)`): fork 3's cause | `scripts/done.mjs:143` |
| done.mjs already counts a law "both ways" iff `lawpack.CLEAN_PLANTS[id]` is a string, so fork 5 needs no done.mjs edit | `scripts/done.mjs:116-118` |
| the hermetic form (`--hermetic` / `ORGANISM_TEST_PROFILE=hermetic`) returns reach LIVE before any registry read | `scripts/done.mjs:44`, `:134` |
| reach iterates `gate.LANE_CONSUMERS`, the registry-derived off-road view (rows with `declared_elsewhere` excluded) | `scripts/done.mjs:141`; `scripts/gate.mjs:144-158`, `:147` |
| the registry's `lanes` table: required `subject · schema_owner · witness` plus the R1 consumer set; NO file field is validated | `scripts/registry.mjs:73`, `:272-302` |
| the live registry's lanes rows carry no `files` key (keys counted over every row, no value printed; 18 Nov 2026) | `dressing-room/state/registry.json` (keys only) |
| the RED plants, one per rule id; `grep -n CLEAN scripts/lawpack.mjs` → no line; the plant project writer | `scripts/lawpack.mjs:695-704`, `:717` |
| the suite runner's modes; a package.json member is spawned with `selftest`, and done.mjs has none by ruling D1 A | `scripts/organism_test.mjs:2765`; `:376` |
| the hermetic profile's LIVE tables (a member named there is not run on the neutral machine) | `scripts/organism_test.mjs:84`, `:209` |

At the base, from the commands named (18 Nov 2026):

```
node scripts/done.mjs line --hermetic
DONE · orphans lanes 5 · orphan verbs 121 · rungs UNREAD · rules laws 0/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
node scripts/done.mjs line        (counts only; this cloud has no consumption file)
… reach 0/21 (static 3/21 · window 0/21) · NO CONSUMER 0
```

## 2 · BUILT (four named files, 18 Nov 2026)

- `scripts/registry.mjs` (sole writer of registry.json): lanes rows take an OPTIONAL `files` field, the lane → file
  field. A malformed one is refused (a non-array or empty array · an absolute path · a drive · a backslash · an
  empty, `.` or `..` segment · a duplicate). New reader `laneFiles()` → `{ subject: [paths] }`, read at call time.
  A row without `files` is absent from the map, never `[]`. Selftest: two new asserts, planted both ways.
- `scripts/done.mjs` (writes nothing; no write call added): static reach reads the row's DECLARED files through
  `registry.laneFiles()`. The declaration REPLACES the subject-name guess and is never unioned with it, and only a row
  declaring none keeps the old guess. The line gains `files declared d/n` inside the reach parentheses. A report row
  whose declared files are absent from the xray graph says so.
- `scripts/lawpack.mjs` (writes nothing outside its temp dir): `CLEAN_PLANTS`, one per rule id, is the fixed form of
  its RED plant. `plantAndScan({ plants })` scans either set in its own throwaway project. Selftest: one `CLEAN PLANT`
  assert per id requires a clean plant that NO rule bites.
- `scripts/organism_test.mjs`: a new mode `done`, a member of `all`, NOT named LIVE. It spawns `done.mjs line
  --hermetic` and asserts three things: exit 0 with exactly one `DONE · ` line; reach and the three laptop rule sets
  print LIVE; every laws/*.yml rule is planted both ways (`laws n/n both ways (n/n RED-planted)`). A bare checkout
  with no acorn is NOT MEASURABLE, named.

**Ruling vs spec, named:** fork 6 named "organism_test.mjs / package.json". The ruling says "done.mjs --hermetic as a
suite member", and package.json members are spawned with `selftest` (`scripts/organism_test.mjs:376`), a mode D1 A
denies done.mjs. So the member is an organism_test.mjs MODE that runs that exact command; package.json is untouched.
Fork 3 named "the registry rows" as the field's home. The live rows are data in `dressing-room/state/registry.json`,
which this seat may not touch, so the field is built and validated in the registry's code, and the live rows stay
undeclared (FORK A).

After the build, from the commands named (18 Nov 2026):

```
node scripts/done.mjs line --hermetic
DONE · orphans lanes 5 · orphan verbs 121 · rungs UNREAD · rules laws 8/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
node scripts/done.mjs line        (counts only)
… reach 0/21 (static 3/21 · window 0/21 · files declared 0/21) · NO CONSUMER 0
```

## 3 · WITNESS — `ci/mdn2/witness_mdn2.mjs` (tree copies under `os.tmpdir()`, synthetic state written by node)

Run 18 Nov 2026, `--org` a clean worktree of `2e6fe3a` (the code is byte-equal at this branch's tip; only ci/mdn2/
differs after it), `--base-org` a clean worktree of `4d166d3`:

```
  · node start measured 24 ms → each child waits at most 31104 ms
  ✓ N-FIELD · base RED · build GREEN — malformed refused 7/7 · well-formed lands true · read back true · laneFiles maps it true
  ✓ N-REACH · base RED · build GREEN — name fallback REACHED true · declared file REACHED true · declaration wins over the name true · line counts declared 2/3 true
  ✓ N-CLEAN · base RED · build GREEN — clean plant per id true (8/8) · every RED plant bites true · no rule bites a clean plant true · done reads laws 8/8 both ways (8/8 RED-planted)
  ✓ N-SUITE · base RED · build GREEN — mode done GREEN hermetic, never LIVE true (3 ok) · in `all` true · a second line RED true · a clean plant away RED true
  ✓ BOUND · 7 differing path(s), all named
  ✓ LAST · 0 node process(es) naming the temp dir survive
GREEN MDN2 lane files · clean plants · done in the suite · 6 clause(s)
```

The other way, the same 18 Nov 2026 run (`--org` the base worktree, `--base-org` the base worktree):

```
RED MDN2 · N-FIELD, N-REACH, N-CLEAN, N-SUITE, BOUND
```

The port class (row 1053): no port, no service, no POST, no restart. Every env door (`ARSENAL_REGISTRY`, `_QUEUE_DIR`,
`_LAWS_REGISTER`, `_MEMORY_DIR`, `_RAW_FACTS`) points under the temp dir or is blanked to the copy's default. Every
child is bounded by this process's own measured node start (`process.uptime()`) times a counted number of children,
never a typed time. The one clock-bound plant is the consumption row's stamp, which is now minus that node start. No git
repo is planted, so row 1036's `core.autocrlf=false` has no subject; reads split on `/\r?\n/`; the anchors in the
mutant runner are matched on LF-normalised text.

## 4 · MUTANTS — `ci/mdn2/run_mutants_mdn2.mjs` (18 Nov 2026, same two trees)

```
  ✓ M1 N-FIELD · the registry no longer checks a lane's files → RED MDN2 · N-FIELD
  ✓ M2 N-REACH · the declared files are a UNION with the subject-name guess, not the reading → RED MDN2 · N-REACH
  ✓ M3 N-CLEAN · a clean plant is one the rule bites (a window of two) → RED MDN2 · N-CLEAN
  ✓ M4 N-SUITE · the suite member counts RED-planted as planted both ways → RED MDN2 · N-SUITE
  ✓ control → GREEN MDN2 lane files · clean plants · done in the suite · 6 clause(s)
run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
```

## 5 · TOUCHED SELFTESTS, before and after (18 Nov 2026, by their headline lines)

```
node scripts/lawpack.mjs selftest     base: lawpack selftest: 70 passed, 0 failed     build: lawpack selftest: 78 passed, 0 failed
node scripts/registry.mjs selftest    base: registry selftest: 59 passed, 0 failed    build: registry selftest: 61 passed, 0 failed
```

`done.mjs` has no selftest by ruling D1 A. `organism_test.mjs` is the suite, and its new mode is measured in §6.
`tsc -p tsconfig.json --noEmit` diagnostics on the four files are identical to the base's. An em dash inside a JSDoc
`@param` first cost one TS1127, which was fixed before the push. `eslint` prints nothing for the four files.

## 6 · SUITE (hermetic), both trees, 18 Nov 2026

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
4d166d3  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
2e6fe3a  organism_test: 140 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```

The three reds are identical by name on both trees: the coverage law, `SUITE MEMBER · sandbox`, and the all-members
roll-up. That gives three more passes and no new red; the three passes are the `done` mode's asserts. On this cloud,
`node scripts/lawpack.mjs gate` and `node scripts/gates.mjs report` print the same RED counts on the base as on the
build (jugad 92/90, depcruise 13/7, no-empty 263/262): none is this unit's.

## 7 · `node scripts/models.mjs check` → exit 0 (18 Nov 2026, at `2e6fe3a`)

## 8 · FORKS

A. **The live lanes rows declare no `files` yet** (`files declared 0/21`, 18 Nov 2026). Filling them is a ROW act
   through `node scripts/registry.mjs set --table lanes --json …`. It happens at the laptop by the registry's CLI, never
   by this seat (no state file touched), and static reach moves with no code change. Six live rows already carry
   `writes_to` (the appenders' file). It is NOT read as `files`, because its meaning is "where appenders write", and
   folding the two is a ruling.
B. **The mdone witness's D-RULE plant collides with this unit.** It appends `export const CLEAN_PLANTS` to lawpack.mjs.
   On a lawpack that already exports it, that is a duplicate export, so done.mjs's lawpack import fails and D-RULE reads
   RED on this build (18 Nov 2026, `ci/mdone/witness_mdone.mjs --only D-RULE`). Its D-REACH, D-NOCONS and D-LINE stay
   GREEN on the build (the subject-name fallback is kept). The mdone witness binds its own base `4f86d59` and is not
   this unit's file.
C. **The suite member asserts `laws n/n both ways`**, so a new laws/*.yml rule without a CLEAN plant reds the suite.
   That is a gate made stricter, chosen here; the architect may rule it a printed count instead.
D. **The suite member is a mode, not a package.json member** (§2: package.json spawns `selftest`, which D1 A denies).
   The coverage law therefore does not count it; `all` runs it.
E. The effort receipt command named by the brief, `node campaign-2026-09/tools/effort_receipt.mjs`, exits 1 with
   `Error: Cannot find module …/campaign-2026-09/tools/effort_receipt.mjs` (MODULE_NOT_FOUND). This repository carries
   no `campaign-2026-09/`, and nothing was written there.
