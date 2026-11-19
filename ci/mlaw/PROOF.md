# MLAW PROOF — unit mlaw BUILD (forks rows 1137 (1)-(3), 1146), cloud build seat

Written 19 Nov 2026 by the cloud build seat (unit mlaw). Branch `claude/mlaw-build`. Nothing on main moved, no PR, no
merge, no live model call, no connector, nothing deleted. Every measurement below was made 19 Nov 2026 on linux, node 22,
on LF trees. Its command is beside it, and its row is in `ci/mlaw/LEDGER.jsonl`.

Row 1146 (the architect, 19 Nov 2026) ruled on my first proof's FK1–FK3: (1) FK1 A, (2) FK2 as one path, (3) the pass
line stays 90, reached by cause, (4) FK4 stands, FK5/FK6 belong to other units. §2–§9 are the build after that ruling. Row 1152, the last follow-up, is §10, which supersedes
the witness, mutants and neutral-run lines of §3, §4 and §8.

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

Read 19 Nov 2026 with `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` and
`…/check-runs/<id>/annotations`, no token. The runs on `c289ba2`, `b082a95`, `8e4a61f`, `44abb22` and `d7d80fb` were
cancelled, because a newer push replaced each one. The runs on `b43b7af` (the code of this build; only this proof and the
ledger change after it):

```
npm test · node 22  run 135474248776  completed/failure · B1_VERDICT RED · merge base 224f9b9 (main) · pass 210 · fail 5 · live 124 · 1 base red · 4 new red
npm test · node 24  run 135474249150  completed/failure · B1_VERDICT RED · merge base 224f9b9 (main) · pass 210 · fail 5 · live 124 · 1 base red · 4 new red
  new red (both legs): WITNESS ‹mdn2› · WITNESS ‹mdone› · WITNESS ‹mf2› · WITNESS ‹mjd3›  (each "… · GREEN at head against its BASE")
  base red (both legs): EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
```

What the neutral machine shows beside it: no law pack red. Both legs ran the law pack in the hermetic profile for the
first time, and it is not among the five fails, so it was judged green at 90 on Windows too, because `live` fell to 124.
No `LAW PACK ROSE` new red appeared either. The CI merge base is main `224f9b9`, not this seat's base, so a red the ms1 base
already carries reads NEW here. I measured each of the four witnesses locally against its own BASE (19 Nov 2026):

```
mdone  @b43b7af: RED MDONE · D-REACH, D-NOCONS, BOUND    @cf1ca54: RED MDONE · BOUND        ← this build (FK6)
mdn2   @b43b7af: RED MDN2 · N-REACH, BOUND               @cf1ca54: RED MDN2 · BOUND         ← this build (FK6)
mf2    @b43b7af: RED MF2 · F2 F4 BOUND                   @cf1ca54: RED MF2 · F2 F4 BOUND    ← inherited from the ms1 base (FK9)
mjd3   @b43b7af: RED MJD3 · J4 BOUND                     @cf1ca54: RED MJD3 · J4 BOUND      ← inherited from the ms1 base (FK9)
```

The witnesses member drops BOUND. So two of the four new reds are this build's, both from the ruled "absent row is a
named red" meeting two witnesses whose plants hold no such row (FK6). The other two are already red at `cf1ca54` with
the same clauses and are not this unit's (FK9).

## 9. FORKS

- **FK1 / FK2 / FK3: RULED (row 1146) and BUILT (§2, §7).** The pass line reads 90, by cause.
- **FK4 (ruling vs spec) stands as built** (row 1146 (4)). (i) The spec's waiver option is not ruled, and no
  `law-waiver:jugad` marker is on any line. (ii) The spec's W1 mutant has nothing to delete: it is LEGS / JUGAD / SURFACES
  here. (iii) W4 (a fall is not red) is folded into RISE (mutant M-FALL). (iv) W5 / W6 / W7 test P4 (the planted tree),
  which row 1137 (3) does not give this unit. The LIVE tables' "only shrink" check rides HERMETIC.
- **FK5 · RULED B (row 1152 (2)) and BUILT, see §10.** Was: `done.mjs` now has a selftest, and no package.json suite string names it.** The coverage law's orphan list
  gains `done` (the same assert name, red at BASE too). `package.json` is not one of my named files. (A) the seat that
  wires the four orphans (unit mcov, row 1143) adds `node scripts/done.mjs selftest` to a suite string · (B) mlaw's named
  files gain `package.json`.
- **FK6 · RULED B (row 1152 (1)) and BUILT, see §10.** Was: TWO EARLIER WITNESSES PLANT A REGISTRY WITH NO `his_surfaces` ROW, so the ruled named red now shows in them.**
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
- **FK9 · two witnesses already red in the ms1 base, carried, not touched.** `ci/mf2/witness_mf2.mjs` reads `RED MF2 · F2 F4`
  (F2 "base hermetic judged 140, build 148 … judged only by the build: MPOOL · usage_tap selftest runs in the hermetic …"; F4
  "full profile: base 304 member(s), build 310", 19 Nov 2026). `ci/mjd3/witness_mjd3.mjs` reads `RED MJD3 · J4` ("round 1
  exit 9 after 2 rep(s)"). Both read the same at `cf1ca54` and at this build. They are the ms1 seat's or their own units'
  to rule. The neutral machine names them NEW only because its merge base is main.
- **FK8 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository
  (`Error: Cannot find module …`, exit 1, ledger row). Nothing was written under `campaign-2026-09/`.

## 10. ROW 1152 — THE LAST FOLLOW-UP (19 Nov 2026), and row 1154 (5)

**(3) main merged.** `git fetch origin main && git merge --no-edit fb42118`, a merge commit `d1668bb`, no rebase and no
force. The one conflict was `scripts/done.mjs`. I resolved it by keeping both sides: main's mrung rung-receipt reader
(`OLD_RECORDED_DAY` exported, `--receipts`) and mlaw's `his_surfaces` row read plus its selftest. `scripts/conductor.mjs`
and `scripts/organism_test.mjs` merged on their own. After the merge (19 Nov 2026), `node scripts/conductor.mjs selftest`
read `ALL CHECKS PASSED (111 passed, 0 failed)`. ⚠ The merge commit's message says "127 passed". That number is my
error; 111 is the measurement (ledger row "correction"). `ci/mlaw/MERGED.json` records main's LF sha256 of each of the 16
files main changed since the merge base `224f9b9`. BOUND accepts a non-named file only when its bytes are exactly main's
(mutant M-MAINBYTE).

**(1) FK6 B.** `ci/mdone/witness_mdone.mjs` and `ci/mdn2/witness_mdn2.mjs`: each plant carries the `his_surfaces` row
beside its lanes, one line each. Both witnesses at the build against each one's own BASE, and at main `fb42118` (19 Nov
2026):

```
mdone @build (cb2c57b) vs its BASE: RED MDONE · D-UNREAD, D-METER, BOUND     @main fb42118: RED MDONE · D-UNREAD, D-METER, BOUND
mdn2  @build (cb2c57b) vs its BASE: RED MDN2 · N-SUITE, BOUND                @main fb42118: RED MDN2 · N-SUITE, BOUND
```

The `his_surfaces` reds (D-NOCONS, D-REACH, N-REACH) are gone. What is left is the same at main itself, so it came in with
the merge and is not this unit's: D-UNREAD / D-METER (`rungs UNREAD · hand 1 REFUSED`: mrung's receipt reader refuses
mdone's old hand plant) and N-SUITE (`mode done GREEN hermetic, never LIVE false (6 ok)`: main's done mode now holds six
asserts where the witness counts three). **FK10** names them. ⚠ **Row 1154 (5) arrived after these two edits were pushed.**
From that moment nothing more goes to these two witnesses. The 1152 follow-up is re-cut on the ms1 ASSEMBLED tip once a
message names it.

**(2) FK5 B.** `package.json` `organism:selftest` gains `&& node scripts/done.mjs selftest`. The hermetic run (19 Nov 2026):

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
  ok   SUITE MEMBER · done selftest exits 0
  orphaned: deck_lint, home_pin, probe, study_scope          (no orphan called done)
organism_test: 152 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 124 (hermetic: named, not run)
```

Unit mcov edits the same string, so whichever of the two lands second re-cuts on the first (row 1152 (2)).

**The witness, both ways, on `e667302` (19 Nov 2026):**

```
node ci/mlaw/witness_mlaw.mjs --org <LF tree of the build> --base-org <LF tree of cf1ca54>
  ok   LEGS · ok JUGAD (90 at --org, frozen 90; gate exit 0, GREEN) · ok SURFACES · ok COVERAGE (orphans: deck_lint, home_pin, probe, study_scope)
  ok   HERMETIC · ok RISE (91 → 92 a NEW red; a fall and an equal GREEN) · ok NOLINE (90 → 92 against BASELINE) · ok PORT
  ok   BOUND · differs from BASE in 20 file(s): named ci/mdn2/witness_mdn2.mjs, ci/mdone/witness_mdone.mjs, package.json, scripts/ci_verdict.mjs, scripts/conductor.mjs, scripts/done.mjs, scripts/organism_test.mjs, scripts/usage_tap.mjs · main's own bytes (MERGED.json fb42118) 12
  ok   LAST
GREEN MLAW the law pack judged hermetic, its rise a new red · 10 clause(s)          (exit 0)
node ci/mlaw/witness_mlaw.mjs --org <LF tree of cf1ca54> --base-org <LF tree of cf1ca54>
RED MLAW · LEGS · JUGAD · SURFACES · COVERAGE · HERMETIC · RISE · NOLINE · PORT          (exit 1)
```

**The mutants, on `cb2c57b` (19 Nov 2026):**

```
  control · GREEN MLAW the law pack judged hermetic, its rise a new red · 10 clause(s) (exit 0)
  M-LEGS RED by LEGS · M-JUGAD RED by JUGAD · M-SURFACES RED by SURFACES · M-LAWHOME RED by JUGAD · M-COVERAGE RED by COVERAGE
  M-MAINBYTE RED by BOUND · M-HERMETIC RED by HERMETIC · M-RISE RED by RISE · M-FALL RED by RISE · M-NOLINE RED by NOLINE
  M-PORT RED by PORT · M-BOUND RED by BOUND · M-LAST RED by LAST
run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN
```

**The law pack count line (`node scripts/lawpack.mjs gate`, 19 Nov 2026):**

```
BASE  cf1ca54  … jugad-literal-subject-list 93 … depcruise_errors 7     lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)
build cb2c57b  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
               lawpack: GREEN — no law's finding count rose, and every rule is on disk
```

`node scripts/gates.mjs report` (19 Nov 2026), checkJs / no-empty / no-unused-vars: `224f9b9` 296 / 268 / 82 · `cf1ca54`
300 / 272 / 82 · pre-merge build `d7d80fb` 300 / 272 / 82 · main `fb42118` 297 / 268 / 85 · the build 301 / 272 / 85. mlaw
adds 0 to each; the rest is the ms1 base (+4 / +4) plus main (+1 / +3). `node scripts/models.mjs check`: exit 0. The
touched selftests at the build (19 Nov 2026): ci_verdict 29 passed, 0 failed · conductor 111 passed, 0 failed · done
5 passed, 0 failed · usage_tap 31/31.

**The neutral runs of `cb2c57b` (read with curl, no token, 19 Nov 2026), merge base main `fb42118`:**

```
npm test · node 22  run 135509495593  completed/failure · B1_VERDICT RED · pass 215 · fail 5 · live 124 · 1 base red
   new: WITNESS ‹mdn2› · WITNESS ‹mdone› · WITNESS ‹mf2› · WITNESS ‹mjd3›
npm test · node 24  run 135509495217  completed/failure · B1_VERDICT RED · pass 214 · fail 6 · live 124 · 1 base red
   new: WITNESS ‹mdn2› · WITNESS ‹mdone› · WITNESS ‹mf2› · WITNESS ‹mjd3› · WITNESS ‹mlv1›
```

No law pack red appears on either Windows leg. The new reds are all witnesses, and each is carried: mdone / mdn2 by
FK10 (the same at main), mf2 / mjd3 by FK9 (the same at `cf1ca54`). **mlv1 is red on node 24 only. NAMED, NOT GUESSED:**
locally its witness reads `RED MLV1 · BOUND` (BOUND alone, which the member drops) both at the build and at `cf1ca54`, and
the node 22 leg reads it green. The annotations carry names only, so what node 24 on Windows read is not reachable
here.

- **FK10 · reds main brought in, carried, not touched:** mdone D-UNREAD / D-METER and mdn2 N-SUITE (above), the same at
  `fb42118`. They belong to unit mrung's landing or to those witnesses' owners.
- **FK11 · after row 1154 (5)** the two witness plants wait for the ms1 assembled tip. The re-cut is the next act, and it
  waits for the message that names that tip.

## 11. ROW 1154 (5) — THE RE-CUT ON THE ms1 ASSEMBLED TIP (19 Nov 2026). Final code tip `fdd0fd6`

**The merge.** `git fetch origin claude/ms1-build && git merge --no-edit db3e01d` produced merge commit `1504969`. There
was no rebase, no force push and no conflict. `db3e01d` is ms1 + mrj + mrt + mr3 + mrf + mrv with main `fb42118` merged
in (its PROOF §13.1). The row 1152 (1)-(3) edits carried through the merge intact: each re-stated plant
(`ci/mdone/witness_mdone.mjs`, `ci/mdn2/witness_mdn2.mjs`) still holds its one `his_surfaces` line beside its lanes, and
`package.json` still runs `node scripts/done.mjs selftest`. `ci/mlaw/MERGED.json` was re-derived from `db3e01d`'s own LF
bytes (51 files changed since `cf1ca54`), so BOUND accepts a non-named file only when it carries the assembled tip's
bytes (`fdd0fd6`).

**Both re-stated witnesses at the build, each against its own BASE** (19 Nov 2026):

```
node ci/mdone/witness_mdone.mjs --org <LF tree of fdd0fd6> --base-org <LF tree of ci/mdone/BASE>   →  RED MDONE · BOUND
node ci/mdn2/witness_mdn2.mjs   --org <LF tree of fdd0fd6> --base-org <LF tree of ci/mdn2/BASE>    →  RED MDN2 · BOUND
```

BOUND alone is left, and the witnesses member drops it, so both are GREEN on the neutral machine (below). FK10 is
closed by the re-statements.

**The witness, both ways** (on `fdd0fd6`, 19 Nov 2026):

```
node ci/mlaw/witness_mlaw.mjs --org <LF tree of fdd0fd6> --base-org <LF tree of cf1ca54>
  ok LEGS · ok JUGAD (90 at --org, frozen 90, gate exit 0, GREEN) · ok SURFACES · ok COVERAGE · ok HERMETIC · ok RISE (91 → 92 NEW) · ok NOLINE (90 → 92) · ok PORT
  ok   BOUND · differs from BASE in 53 file(s): named ci/mdn2/witness_mdn2.mjs, ci/mdone/witness_mdone.mjs, package.json, scripts/ci_verdict.mjs, scripts/conductor.mjs, scripts/done.mjs, scripts/organism_test.mjs, scripts/usage_tap.mjs · the merged-in bytes …
  ok   LAST
GREEN MLAW the law pack judged hermetic, its rise a new red · 10 clause(s)          (exit 0)
node ci/mlaw/witness_mlaw.mjs --org <LF tree of cf1ca54> --base-org <LF tree of cf1ca54>
RED MLAW · LEGS · JUGAD · SURFACES · COVERAGE · HERMETIC · RISE · NOLINE · PORT          (exit 1)
```

**The mutants** (on `fdd0fd6`, 19 Nov 2026):

```
  control · GREEN MLAW the law pack judged hermetic, its rise a new red · 10 clause(s) (exit 0)
  M-LEGS · M-JUGAD · M-SURFACES · M-LAWHOME · M-COVERAGE · M-MAINBYTE · M-HERMETIC · M-RISE · M-FALL · M-NOLINE · M-PORT · M-BOUND · M-LAST — each RED by the clause that names it
run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN
```

**The law pack count line** (`node scripts/lawpack.mjs gate`, 19 Nov 2026):

```
BASE  cf1ca54  … jugad-literal-subject-list 93 … depcruise_errors 7       lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)
build fdd0fd6  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
               lawpack: GREEN — no law's finding count rose, and every rule is on disk
```

The touched selftests at `fdd0fd6` (19 Nov 2026): ci_verdict 29 passed, 0 failed · conductor 111 passed, 0 failed · done
5 passed, 0 failed · usage_tap 31/31. `node scripts/models.mjs check`: exit 0. Hermetic suite: `organism_test: 151
passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124` (19 Nov 2026). The two reds are the coverage law (orphans
`deck_lint, home_pin, probe, study_scope`, no `done`) and LOAD ZERO BLOCK 7 (FK12).

**The neutral runs of `fdd0fd6`** (read with curl, no token, 19 Nov 2026; merge base main `fb42118`):

```
npm test · node 22  run 135541015426  completed/failure · B1_VERDICT RED · pass 232 · fail 2 · live 124 · 1 base red
   new: LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (98 files scanned, 1 declared)
npm test · node 24  run 135541015067  completed/failure · B1_VERDICT RED · pass 232 · fail 2 · live 124 · 1 base red
   new: LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (98 files scanned, 1 declared)
```

Every witness reads GREEN on both Windows legs now, including mdone, mdn2, mf2, mjd3, mlv1 and mlaw itself. No law
pack red appears.

- **FK12 · the one new red, inherited from the assembled tip:** LOAD ZERO BLOCK 7 trips on `ci/mrv/PROOF.md:105` (a
  suite headline undated within two lines). That file is byte-equal to `db3e01d`'s (`git diff --quiet db3e01d HEAD --
  ci/mrv/PROOF.md`). It is unit mrv's or the ms1 seat's to date, and this seat did not edit it. This PROOF passes the
  same law. Its check was run by the rule's own regex before each push.
- FK9 and FK10 are closed by the assembled tip's re-statements: mf2, mjd3, mdone and mdn2 are GREEN on the neutral
  machine.

CHECKPOINT · STOPPED at 2026-11-19T12:37:54Z · resume from: merged 1582be0 at c9f713b, MERGED.json re-derived at fb8cbda (witness GREEN MLAW · 10 clause(s), lawpack GREEN 90, mdone/mdn2 BOUND only); next: re-run run_mutants_mlaw.mjs on fb8cbda (interrupted by the stop), read both neutral legs of fb8cbda, write PROOF §12 (one new BLOCK 7 hit on this tree: ci/ms1/PROOF.md:569, byte-equal to 1582be0 — the ms1 seat's)

## 12. RESUMED (his word #270) — THE ms1 ASSEMBLED TIP 1582be0 MERGED; final measurements (19 Nov 2026)

The CHECKPOINT above is resumed. `git merge --no-edit 1582be0` gave `c9f713b`: a doc-only merge (the dated
`ci/mrv/PROOF.md` line, ms1's PROOF and ledger), with no conflict, no rebase and no force. `ci/mlaw/MERGED.json` was
re-derived from `1582be0`'s own LF bytes at `fb8cbda`. `claude/ms1-build` has moved only by its own CHECKPOINT commit
`c35f7dd` since then, and no message names a new assembled tip, so nothing more was merged. The code is the same at `fb8cbda`
and `c23b28f`. The tip this section is pushed on is a proof-only commit after `c23b28f`.

Measured on `c23b28f` (19 Nov 2026):

```
node ci/mlaw/witness_mlaw.mjs --org <LF tree of c23b28f> --base-org <LF tree of cf1ca54>   →  GREEN MLAW the law pack judged hermetic, its rise a new red · 10 clause(s)
node ci/mlaw/run_mutants_mlaw.mjs --org <same> --base-org <same>                            →  run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN
node scripts/lawpack.mjs gate                                                               →  … jugad-literal-subject-list 90 … depcruise_errors 7 · lawpack: GREEN
node ci/mdone/witness_mdone.mjs (vs its BASE)  →  RED MDONE · BOUND        node ci/mdn2/witness_mdn2.mjs (vs its BASE)  →  RED MDN2 · BOUND
```

After the mutant run, no process named the M-LAST marker. The BASE-way witness line is §11's (`RED MLAW · LEGS · JUGAD ·
SURFACES · COVERAGE · HERMETIC · RISE · NOLINE · PORT`), because the BASE tree did not change.

**The neutral runs of `c23b28f`** (full sha `c23b28f4aac3c9028d28f92302bcdb987daa4861`; the runs on `fb8cbda` were cancelled
by the checkpoint push). Read with curl, no token, 19 Nov 2026:

```
npm test · node 22  run 135565591720  completed/failure · B1_VERDICT RED · base fb42118 · pass 232 · fail 2 · live 124 · 1 base red
   new: LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (98 files scanned, 1 declared)
npm test · node 24  run 135565592266  completed/failure · B1_VERDICT RED · base fb42118 · pass 232 · fail 2 · live 124 · 1 base red
   new: LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (98 files scanned, 1 declared)
```

`node scripts/ci_verdict.mjs c23b28f4aac3c9028d28f92302bcdb987daa4861` answered `UNREADABLE — … answered 403` from this
container: its anonymous `fetch` is refused here, while curl through the same proxy is served. That is this container's
network, not the reader. The legs above were read through the same API the reader calls.

- **FK12, moved:** `1582be0` dated the `ci/mrv/PROOF.md` line, and BLOCK 7 now trips on `ci/ms1/PROOF.md:569`
  (`node scripts/organism_test.mjs laws`, 19 Nov 2026). That line came in with `1582be0`'s own PROOF addition, and the
  file is byte-equal to `1582be0`'s (`git diff --quiet 1582be0 HEAD -- ci/mlaw/../ms1/PROOF.md`). It is the ms1 seat's to
  date; this seat does not edit it. This PROOF passes the law by the rule's own regex.
