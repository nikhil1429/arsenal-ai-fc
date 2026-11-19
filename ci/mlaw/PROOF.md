# MLAW PROOF — unit mlaw BUILD (forks rows 1137 (1)-(3), 1146), cloud build seat

Written 19 Nov 2026 by the cloud build seat (unit mlaw). Branch `claude/mlaw-build`. Nothing on main moved, no PR, no
merge, no live model call, no connector, nothing deleted. Every measurement below was made 19 Nov 2026 on linux, node 22,
on LF trees. Its command is beside it, and its row is in `ci/mlaw/LEDGER.jsonl`.

Row 1146 (the architect, 19 Nov 2026) ruled on my first proof's FK1–FK3: (1) FK1 A, (2) FK2 as one path, (3) the pass
line stays 90, reached by cause, (4) FK4 stands, FK5/FK6 belong to other units. This proof is the build after that ruling.

## 1. BASE

`git fetch origin claude/ms1-build && git checkout -b claude/mlaw-build cf1ca54` (19 Nov 2026). `cf1ca54` is unit ms1's
"PROOF §13, the mrt merge and its member line", so mrt's merge is in the base, and the cycle red is gone there:
`node scripts/lawpack.mjs gate` reads `depcruise_errors 7` against a frozen 7 (19 Nov 2026). `ci/mlaw/BASE` holds the
full sha. Spec: `git show 1779254:ci/mlaw/MLAW_SPEC.md`.

## 2. WHAT WAS BUILT (file:line at the build tip)

- **P1 · REQUIRED_LEGS (F1 B, row 1137 (1)).** `scripts/ci_verdict.mjs` `legsOf(yml)` plus
  `REQUIRED_LEGS = Object.freeze(legsOf(<suite.yml>))` replace the typed pair at BASE `scripts/ci_verdict.mjs:108`.
  Both the prefix and the nodes come from their one owner: `.github/workflows/suite.yml:60` (job name) and `:66` (matrix).
  A suite.yml with no such lines derives no leg, and the reader then says NONE, never GREEN. The selftest plants both
  ways.
- **P1 · SURFACES (FK1 A, row 1146 (1)).** `scripts/done.mjs` reads `SURFACES` as `lazySubjects("his_surfaces")`, the
  registry mechanisms row through the shape `registry.mjs:144` owns. It replaces the typed pair at BASE
  `scripts/done.mjs:41`. There is no fallback literal. `surfacesOrRed()` makes an absent or retired row a NAMED RED on the
  reach line (`reach RED — no live mechanisms row "his_surfaces" in the registry …`), checked before any other reach read.
  The hermetic form never touches it (reach is LIVE there). A NEW `selftest` mode plants the row both ways, in registry
  files under `os.tmpdir()` written by registry.mjs's OWN exported writers (`upsertRow`, `retireRow`). done.mjs still
  carries no write call (mdone's D-WRITE), and its temp dir is left to the OS. The runner seeds the live row at landing,
  not this seat.
- **P1 · LAW_HOME (FK2, row 1146 (2)).** `scripts/usage_tap.mjs` `LAW_HOME = "tools/model_law.mjs"`: ONE path under the
  campaign root door, read with `join(root, LAW_HOME)`. It replaces the segment pair at BASE `scripts/usage_tap.mjs:51`.
  The selftest's plant builds its path from `LAW_HOME` too.
- **P2 · F2 A.** `lawpack` left `LIVE_SELFTESTS` and `LIVE_MODES` (`scripts/organism_test.mjs`, a comment where each
  entry was). The NUL scan is whole: `scripts/lawpack.mjs` is not edited, and its BASELINE is byte-equal (JUGAD).
- **P3 · F3 A.** `organism_test.mjs` `lawpack()` prints `ORGANISM_TEST_LAWPACK {"<law>":<n>,…}`, read off the gate's own
  `findings:` line (`measure().counts`). `ci_verdict.mjs` `parseLawpack` / `lawpackRises` / `frozenBaseline` /
  `judge(…, baseline)` make a count higher at head than at the merge base a NEW red, `LAW PACK ROSE · <law> <base> →
  <head>`. A base with no such line is compared against the `BASELINE` imported from `scripts/lawpack.mjs`. A base with
  no line and no readable baseline is itself a NEW red. An equal count or a fall adds nothing.
- **F6 B.** The `scripts/conductor.mjs` selftest (BASE `:990`) takes an OS-picked closed port: listen 0, read, close, then
  `portOpen(<that port>, 200)`. The existing 200 is unchanged.

## 3. THE WITNESS, BOTH WAYS (`ci/mlaw/witness_mlaw.mjs`, its header is the contract)

The trees were built the way `organism_test.mjs lfTree` builds them. Measured 19 Nov 2026 on `d7d80fb`:

```
node ci/mlaw/witness_mlaw.mjs --org <LF tree of the build> --base-org <LF tree of cf1ca54>
  ok   LEGS · matrix [22, 24] → 2 leg(s) · planted [+26] → 3 leg(s), last "npm test · node 26" · jugad finding(s) in ci_verdict.mjs: none
  ok   JUGAD · jugad-literal-subject-list 90 at --org (frozen 90), 93 at --base-org · count(s) higher at --org: none · jugad sites in the three: none · lawpack.mjs BASELINE byte-equal · gate exit 0: lawpack: GREEN — …
  ok   SURFACES · literal SURFACES list absent · lazySubjects(his_surfaces) yes · empty registry: DONE reach RED — no live mechanisms row "his_surfaces" in the registry — … · row planted (seed exit 0): DONE reach the consumer map could not be read (gate: the registry lan… · done selftest exit 0
  ok   HERMETIC · lawpack in LIVE table(s): none · keys at --org not at --base-org: none · hermetic run on an EMPTY state dir: the LAW PACK assert judged · machine line equal to the full profile's · lawpack selftest: 78 passed, 0 failed (exit 0)
  ok   RISE · planted jugad-literal-subject-list 91 (A) → 92 (B) by the gate · the suite's law pack line carries both · head B over base A: RED, new [LAW PACK ROSE · …] (exit 1) · A over B (a fall): GREEN · A over A: GREEN
  ok   NOLINE · lawpack.mjs BASELINE jugad-literal-subject-list 90 · head B over a base with no law pack line: RED, new [LAW PACK ROSE · jugad-literal-subject-list 90 → 92 …] (exit 1) · a head AT the baseline: GREEN
  ok   PORT · portOpen with a literal port: none · conductor selftest exit 0 (ALL CHECKS PASSED (111 passed, 0 failed)) · portOpen assert passed · 1 OS-picked listen(s) · connect(s) to a port not OS-picked: none · fixed listen(s): none
  ok   BOUND · differs from BASE in 5 file(s): scripts/ci_verdict.mjs, scripts/conductor.mjs, scripts/done.mjs, scripts/organism_test.mjs, scripts/usage_tap.mjs
  ok   LAST · 0 node process(es) naming the temp root survive · the fake claude / gemini logged 0 spawn(s)
GREEN MLAW the law pack judged hermetic, its rise a new red · 9 clause(s)          (exit 0)

node ci/mlaw/witness_mlaw.mjs --org <LF tree of cf1ca54> --base-org <LF tree of cf1ca54>
  RED  LEGS · … planted [+26] → 2 leg(s) · jugad finding(s) in ci_verdict.mjs: scripts/ci_verdict.mjs:108
  RED  JUGAD · jugad-literal-subject-list 93 at --org (frozen 90), 93 at --base-org · … jugad sites in the three: scripts/usage_tap.mjs:51, scripts/done.mjs:41, scripts/ci_verdict.mjs:108 · …
  RED  SURFACES · literal SURFACES list PRESENT · lazySubjects(his_surfaces) NO · …
  RED  HERMETIC · lawpack in LIVE table(s): LIVE_SELFTESTS, LIVE_MODES · … LIVE MODE lawpack (not judged) · machine line ABSENT · …
  RED  RISE · … the suite's law pack line ABSENT · head B over base A: GREEN, new [] (exit 0) · …
  RED  NOLINE · … head B over a base with no law pack line: GREEN, new [] (exit 0) · …
  RED  PORT · portOpen with a literal port: conductor.mjs:990 · … connect(s) to a port not OS-picked: 59999 · …
  ok   BOUND · differs from BASE in 0 file(s): none
  ok   LAST · …
RED MLAW · LEGS · JUGAD · SURFACES · HERMETIC · RISE · NOLINE · PORT          (exit 1)
```

Seven clauses are RED on BASE and GREEN on the build. BOUND and LAST are the frame and are GREEN on both sides by
construction, as in mrt's witness. Each of them is made RED by its own mutant (§4). BOUND names the two files the
ruling added (done.mjs, usage_tap.mjs). With the row planted, SURFACES shows the reach line passing the row guard. Its
next stop ("the consumer map could not be read") is the copy's lanes-less registry, not the surfaces.

## 4. THE MUTANTS (`ci/mlaw/run_mutants_mlaw.mjs`)

`node ci/mlaw/run_mutants_mlaw.mjs --org <LF tree of the build> --base-org <LF tree of cf1ca54>` (19 Nov 2026, on `d7d80fb`):

```
  control · GREEN MLAW the law pack judged hermetic, its rise a new red · 9 clause(s) (exit 0)
  M-LEGS · RED by LEGS · RED MLAW · LEGS · JUGAD (exit 1)
  M-JUGAD · RED by JUGAD · RED MLAW · JUGAD (exit 1)
  M-SURFACES · RED by SURFACES · RED MLAW · JUGAD · SURFACES (exit 1)
  M-LAWHOME · RED by JUGAD · RED MLAW · JUGAD (exit 1)
  M-HERMETIC · RED by HERMETIC · RED MLAW · HERMETIC (exit 1)
  M-RISE · RED by RISE · RED MLAW · RISE · NOLINE (exit 1)
  M-FALL · RED by RISE · RED MLAW · RISE (exit 1)
  M-NOLINE · RED by NOLINE · RED MLAW · NOLINE (exit 1)
  M-PORT · RED by PORT · RED MLAW · PORT (exit 1)
  M-BOUND · RED by BOUND · RED MLAW · BOUND (exit 1)
  M-LAST · RED by LAST · RED MLAW · LAST (exit 1)
run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN
```

Every clause has at least one mutant: RISE has two (the rise unseen; a fall made red), and JUGAD has two (a new list; the
LAW_HOME pair typed back). Two earlier runs, before row 1146, read 9 of 9 (19 Nov 2026, on `44205b3` and `b2854c6`;
M-NOLINE was narrowed between them). After each run, `ps` showed no process naming the M-LAST marker.

## 5. EACH TOUCHED SELFTEST, BEFORE AND AFTER (headline line, 19 Nov 2026)

```
node scripts/ci_verdict.mjs selftest   BASE: ci_verdict selftest: 21 passed, 0 failed    build: ci_verdict selftest: 29 passed, 0 failed
node scripts/conductor.mjs selftest    BASE: ALL CHECKS PASSED (111 passed, 0 failed)     build: ALL CHECKS PASSED (111 passed, 0 failed)
node scripts/done.mjs selftest         BASE: (no selftest mode; prints its usage line)    build: done selftest: 5 passed, 0 failed
node scripts/usage_tap.mjs selftest    BASE: usage_tap selftest 31/31 — all clauses hold  build: usage_tap selftest 31/31 — all clauses hold
node scripts/lawpack.mjs selftest      (not edited) BASE and build: lawpack selftest: 78 passed, 0 failed
```

## 6. THE MEMBER LINE OF EVERY MEMBER TOUCHED (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026)

```
BASE   ok   SUITE MEMBER · ci_verdict selftest exits 0
build  ok   SUITE MEMBER · ci_verdict selftest exits 0
BASE   ok   SUITE MEMBER · usage_tap selftest exits 0
build  ok   SUITE MEMBER · usage_tap selftest exits 0
BASE   LIVE selftest conductor — not run in the hermetic profile: reads state/registry.json, state/captain.json, state/tasks_expected.json …
build  LIVE selftest conductor — (the same; a PLANT member, P4 is not this unit)
BASE   LIVE selftest lawpack — not run in the hermetic profile: …
build  ok   SUITE MEMBER · lawpack selftest exits 0
BASE   LIVE MODE lawpack — not run in the hermetic profile: …
build  ORGANISM_TEST_LAWPACK {"owners-only-state-write":0,…,"jugad-literal-subject-list":90,…,"depcruise_errors":7}
build  ok   LAW PACK — every rule file present, and no law's finding count rose (a gate may only get stricter)
BASE   ok   WHAT IS LEFT · done.mjs --hermetic exits 0 and prints exactly ONE `DONE · ` line   (and its two siblings ok)
build  ok   WHAT IS LEFT · done.mjs --hermetic exits 0 and prints exactly ONE `DONE · ` line   (and its two siblings ok)
BASE   organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
build  organism_test: 147 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 124 (hermetic: named, not run)
```

The one red on both sides is the coverage law. At the build its orphan list gains `done`, because done.mjs now has a
selftest that no package.json suite string names: FK5.

## 7. THE LAW PACK COUNTS (`node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026)

```
BASE  cf1ca54  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
               lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)
build d7d80fb  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
               lawpack: GREEN — no law's finding count rose, and every rule is on disk
frozen BASELINE (unchanged, lawpack.mjs not edited): jugad-literal-subject-list 90 · depcruise_errors 7 · every other law as above
```

No count rose. jugad went 93 → 90, each of its three sites fixed at its cause: one derived from suite.yml, one made a
registry row, one written as one path. There was no waiver, no re-base and no narrowed law. The lazy read keeps
`import-time-registry-read` at 2. `node scripts/gates.mjs report` reads the same on BASE and on the build (19 Nov 2026):
checkJs diagnostics 300 · no-empty 272. The gates mode is LIVE and is red at BASE, which is spec F8 and not this unit.
`node scripts/models.mjs check`: exit 0 (19 Nov 2026).

## 8. THE NEUTRAL MACHINE (the suite workflow, read through the public API with curl, no token)

CI_PENDING

## 9. FORKS

- **FK1 / FK2 / FK3: RULED (row 1146) and BUILT (§2, §7).** The pass line reads 90, by cause.
- **FK4 (ruling vs spec) stands as built** (row 1146 (4)). (i) The spec's waiver option is not ruled, and no
  `law-waiver:jugad` marker is on any line. (ii) The spec's W1 mutant has nothing to delete: it is LEGS / JUGAD / SURFACES
  here. (iii) W4 (a fall is not red) is folded into RISE (mutant M-FALL). (iv) W5 / W6 / W7 test P4 (the planted tree),
  which row 1137 (3) does not give this unit. The LIVE tables' "only shrink" check rides HERMETIC.
- **FK5 · `done.mjs` now has a selftest, and no package.json suite string names it.** The coverage law's orphan list
  gains `done` (the same assert name, red at BASE too). `package.json` is not one of my named files. (A) the seat that
  wires the four orphans (unit mcov, row 1143) adds `node scripts/done.mjs selftest` to a suite string · (B) mlaw's named
  files gain `package.json`.
- **FK6 · TWO EARLIER WITNESSES PLANT A REGISTRY WITH NO `his_surfaces` ROW, so the ruled named red now shows in them.**
  Measured at `d7d80fb` against each unit's own BASE (19 Nov 2026): `ci/mdone/witness_mdone.mjs` reads `RED MDONE ·
  D-REACH, D-NOCONS, BOUND`. D-NOCONS's line is `reach RED — no live mechanisms row "his_surfaces" …`, and D-REACH reads
  reach REACHED false. At BASE `cf1ca54` it read `RED MDONE · BOUND`. `ci/mdn2/witness_mdn2.mjs` reads `RED MDN2 ·
  N-REACH, BOUND` (at BASE: `RED MDN2 · BOUND`). BOUND is dropped by the witnesses member (`boundIds`). D-WRITE was red
  on my first FK1 cut, because a selftest write call was in done.mjs, and it is GREEN since `b952cfc` (the plants go
  through registry.mjs's writers). The cause is their plant (`ci/mdone/witness_mdone.mjs:59` and
  `ci/mdn2/witness_mdn2.mjs:71` write a registry holding only lanes), which is outside my named files. On the neutral
  machine the witnesses member will read `WITNESS ‹mdone›` and `WITNESS ‹mdn2›` RED at head: NEW reds against a base
  where they were GREEN. (A) each plant gains the `his_surfaces` row (their units' files, one line each) · (B) mlaw's
  named files gain those two witnesses. A fallback in done.mjs is not an option: the ruling forbids one.
- **FK7 · carried, not touched** (row 1146 (4)): the spec's F7 (hermetic coverage red) and F8 (`gates` no-empty red, mode
  LIVE) belong to mlaw2 / mcov / mgat. The conductor selftest stays LIVE in hermetic (a PLANT member).
- **FK8 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository
  (`Error: Cannot find module …`, exit 1, ledger row). Nothing was written under `campaign-2026-09/`.
