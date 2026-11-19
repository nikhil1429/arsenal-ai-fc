# MLAW PROOF — unit mlaw BUILD (forks rows 1137 (1)-(3)), cloud build seat

Written 19 Nov 2026 by the cloud build seat (unit mlaw). Branch `claude/mlaw-build`. Nothing on main moved, no PR, no
merge, no live model call, no connector, nothing deleted. Every measurement below was made 19 Nov 2026 on linux, node 22,
LF trees. Its command is beside it, and its row is in `ci/mlaw/LEDGER.jsonl`.

## 1. BASE

`git fetch origin claude/ms1-build && git checkout -b claude/mlaw-build cf1ca54` (19 Nov 2026). `cf1ca54` is unit ms1's
"PROOF §13, the mrt merge and its member line", so mrt's merge is in the base. `ci/mlaw/BASE` holds its full sha. The
cycle red is gone at the base: `node scripts/lawpack.mjs gate` reads `depcruise_errors 7` against a frozen 7 (19 Nov 2026).
The spec read is `git show 1779254:ci/mlaw/MLAW_SPEC.md` (the tip the architect ruled).

## 2. WHAT WAS BUILT (file:line at the build tip)

- **P1 · F1 B.** `scripts/ci_verdict.mjs` `legsOf(yml)` plus `REQUIRED_LEGS = Object.freeze(legsOf(<suite.yml>))`. They
  replace the typed `["npm test · node 22", "npm test · node 24"]` at BASE `scripts/ci_verdict.mjs:108`. Both the leg
  name prefix and the nodes come from their one owner: `.github/workflows/suite.yml:60` (`name: npm test · node ${{
  matrix.node }}`) and `:66` (`node: [22, 24]`). A suite.yml with no such lines derives no leg, and the reader then
  answers NONE, never GREEN. The selftest plants the derivation both ways (a matrix that gains a node gains a leg; CRLF;
  no matrix gives no leg).
- **P1 · `SURFACES` (`scripts/done.mjs:41`) and `LAW_HOME` (`scripts/usage_tap.mjs:51`): NOT EDITED, they are FORKS FK1
  and FK2 (§9).** I measured and found no owner structure (§9). They were not waived and not narrowed.
- **P2 · F2 A.** `lawpack` left `LIVE_SELFTESTS` and `LIVE_MODES` (`scripts/organism_test.mjs`, a comment where each
  entry was). The NUL scan is whole: `scripts/lawpack.mjs` is not edited (the witness's JUGAD clause checks that its
  `BASELINE` is byte-equal).
- **P3 · F3 A.** `scripts/organism_test.mjs` `lawpackCounts()` + `LAWPACK_LINE`: `lawpack()` prints
  `ORGANISM_TEST_LAWPACK {"<law>":<n>,…}`. It is read off the gate's own `findings:` line (that line is
  `measure().counts`, printed by `lawpack.mjs`), so nothing is re-measured and nothing is typed. `scripts/ci_verdict.mjs`
  adds `parseLawpack`, `lawpackRises`, `frozenBaseline` and `judge(…, baseline)`: every law whose count is higher at
  head than at the merge base is a NEW red, `LAW PACK ROSE · <law> <base> → <head>`. A base with no such line is
  compared against `BASELINE` imported from `scripts/lawpack.mjs` (read from that file, never typed). A base with no
  line and no readable baseline is itself a NEW red. An equal count or a fall adds nothing.
- **F6 B.** `scripts/conductor.mjs` selftest (BASE `:990`). The closed-port probe takes an OS-picked port: listen on 0,
  read the port, close, then `portOpen(<that port>, 200)` (the existing 200 is unchanged, and no number is typed).

## 3. THE WITNESS, BOTH WAYS (`ci/mlaw/witness_mlaw.mjs`, its header is the contract)

The trees were built the way `organism_test.mjs lfTree` builds them (`git -c core.autocrlf=false -c core.eol=lf
--work-tree=<dir> checkout <sha> -- .`). Measured 19 Nov 2026:

```
node ci/mlaw/witness_mlaw.mjs --org <LF tree of the build> --base-org <LF tree of cf1ca54>
  ok   LEGS · matrix [22, 24] → 2 leg(s) · planted [+26] → 3 leg(s), last "npm test · node 26" · jugad finding(s) in ci_verdict.mjs: none
  ok   JUGAD · jugad-literal-subject-list 92 at --org, 93 at --base-org · count(s) higher at --org: none · lawpack.mjs BASELINE byte-equal · lawpack: 1 RED — …
  ok   HERMETIC · lawpack in LIVE table(s): none · keys at --org not at --base-org: none · hermetic run on an EMPTY state dir: the LAW PACK assert judged · machine line equal to the full profile's · lawpack selftest: 78 passed, 0 failed (exit 0)
  ok   RISE · planted jugad-literal-subject-list 93 (A) → 94 (B) by the gate · the suite's law pack line carries both · head B over base A: RED, new [LAW PACK ROSE · jugad-literal-subject-list 93 → 94] (exit 1) · A over B (a fall): GREEN · A over A: GREEN
  ok   NOLINE · lawpack.mjs BASELINE jugad-literal-subject-list 90 · head B over a base with no law pack line: RED, new [LAW PACK ROSE · jugad-literal-subject-list 90 → 94 …] (exit 1) · a head AT the baseline: GREEN
  ok   PORT · portOpen with a literal port: none · conductor selftest exit 0 (ALL CHECKS PASSED (111 passed, 0 failed)) · portOpen assert passed · 1 OS-picked listen(s) · connect(s) to a port not OS-picked: none · fixed listen(s): none
  ok   BOUND · differs from BASE in 3 file(s): scripts/ci_verdict.mjs, scripts/conductor.mjs, scripts/organism_test.mjs
  ok   LAST · 0 node process(es) naming the temp root survive · the fake claude / gemini logged 0 spawn(s)
GREEN MLAW the law pack judged hermetic, its rise a new red · 8 clause(s)          (exit 0)

node ci/mlaw/witness_mlaw.mjs --org <LF tree of cf1ca54> --base-org <LF tree of cf1ca54>
  RED  LEGS · matrix [22, 24] → 2 leg(s) · planted [+26] → 2 leg(s), last "npm test · node 24" · jugad finding(s) in ci_verdict.mjs: scripts/ci_verdict.mjs:108
  RED  JUGAD · jugad-literal-subject-list 93 at --org, 93 at --base-org · …
  RED  HERMETIC · lawpack in LIVE table(s): LIVE_SELFTESTS, LIVE_MODES · … · hermetic run on an EMPTY state dir: LIVE MODE lawpack (not judged) · machine line ABSENT · …
  RED  RISE · planted jugad-literal-subject-list 94 (A) → 95 (B) by the gate · the suite's law pack line ABSENT · head B over base A: GREEN, new [] (exit 0) · …
  RED  NOLINE · lawpack.mjs BASELINE jugad-literal-subject-list 90 · head B over a base with no law pack line: GREEN, new [] (exit 0) · …
  RED  PORT · portOpen with a literal port: conductor.mjs:990 · … · connect(s) to a port not OS-picked: 59999 · …
  ok   BOUND · differs from BASE in 0 file(s): none
  ok   LAST · …
RED MLAW · LEGS · JUGAD · HERMETIC · RISE · NOLINE · PORT          (exit 1)
```

Six clauses are RED on the BASE and GREEN on the build. BOUND and LAST are the frame and are GREEN on both sides by
construction, as in mrt's witness. Each of them is made RED by its own mutant (§4).

## 4. THE MUTANTS (`ci/mlaw/run_mutants_mlaw.mjs`)

MUTANTS_PENDING

## 5. EACH TOUCHED SELFTEST, BEFORE AND AFTER (headline line, 19 Nov 2026)

```
node scripts/ci_verdict.mjs selftest   BASE: ci_verdict selftest: 21 passed, 0 failed   build: ci_verdict selftest: 29 passed, 0 failed
node scripts/conductor.mjs selftest    BASE: ALL CHECKS PASSED (111 passed, 0 failed)    build: ALL CHECKS PASSED (111 passed, 0 failed)
node scripts/lawpack.mjs selftest      (not edited) BASE and build: lawpack selftest: 78 passed, 0 failed
```

## 6. THE MEMBER LINE OF EVERY MEMBER TOUCHED (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026)

```
BASE   ok   SUITE MEMBER · ci_verdict selftest exits 0
build  ok   SUITE MEMBER · ci_verdict selftest exits 0
BASE   LIVE selftest conductor — not run in the hermetic profile: reads state/registry.json, state/captain.json, state/tasks_expected.json …
build  LIVE selftest conductor — not run in the hermetic profile: (the same; the conductor is a PLANT member, P4 is not this unit)
BASE   LIVE selftest lawpack — not run in the hermetic profile: …
build  ok   SUITE MEMBER · lawpack selftest exits 0
BASE   LIVE MODE lawpack — not run in the hermetic profile: …
build  ORGANISM_TEST_LAWPACK {… "jugad-literal-subject-list":92 … "depcruise_errors":7}
build  FAIL LAW PACK — every rule file present, and no law's finding count rose (a gate may only get stricter)
BASE   organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
build  organism_test: 146 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
```

The build's second red is the law pack itself. It is red because FK1 and FK2 keep `jugad-literal-subject-list` at 92
against its frozen 90. The neutral machine now SEES this red; before the build nothing read it (spec §1.5). It is not
hidden and not waived (FK3).

## 7. THE LAW PACK COUNTS (`node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026)

```
BASE  cf1ca54  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
build          findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 92 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
frozen BASELINE (unchanged): jugad-literal-subject-list 90 · depcruise_errors 7 · every other law as above
```

No count rose. jugad fell 93 → 92 because one of its three sites was derived at its cause. `node scripts/gates.mjs report`
read the same on BASE and on the build (19 Nov 2026): checkJs diagnostics 300 · no-empty 272. A parseSuite JSDoc that had
raised checkJs to 306 was fixed before it was pushed (ledger row F6). The gates mode is still LIVE and is still red at
BASE: that is spec F8, not this unit.

`node scripts/models.mjs check`: exit 0 (19 Nov 2026).

## 8. THE NEUTRAL MACHINE (the suite workflow, read through the public API with curl, no token)

CI_PENDING

## 9. FORKS

- **FK1 · `SURFACES` (`scripts/done.mjs:41`, `["manager.mjs", "captains_call.mjs"]`) has no one owner structure.**
  Measured 19 Nov 2026: `outbox.mjs:73 SURFACES` names transports (code / dugout / gemini / ntfy / sheet), not organ files.
  `gate.mjs:127 CONSUMER_KINDS` and `:191-200` map a `surface.kind` to "him", not to a file. xray's IR roots
  (`xray.mjs:992-998`) hold scheduled / skills / hooks / doc_cited, not "his reading surfaces". Of the registry's tables,
  only two mechanisms rows (`study_entry_points`, `input_cadence_default`) name either organ, and each names one, not
  both. So it stays as it is (F1 B: "where none does the seat names it as a fork"). (A) a registry row
  `mechanisms/his_surfaces` read by `done.mjs`, which would be a state write through registry's own CLI and is out of
  this seat's named files · (B) derive the pair from the sole-writer headers of the sheet file and the card file. That
  still types two file names, so it moves the literal and does not derive it.
- **FK2 · `LAW_HOME` (`scripts/usage_tap.mjs:51`, `["tools", "model_law.mjs"]`) has no owner in this repository.**
  Measured: `grep -rn model_law` outside `ci/` finds only `usage_tap.mjs:14/51/245` and the prose in
  `.claude/skills/runner/SKILL.md:98`. The owner is the campaign tree, which this repository does not carry (D5 A).
  It stays. (A) the campaign exports its law home through an env door beside `ARSENAL_CAMPAIGN_ROOT` · (B) a waiver,
  which is not ruled.
- **FK3 · CONSEQUENCE: the brief's "its count line reads 90 on the build" cannot hold while FK1 and FK2 stand.** It reads
  92. So the hermetic run carries the law pack red (`FAIL LAW PACK …`, a NEW red by name against a base where the mode
  was LIVE) and the neutral verdict carries `LAW PACK ROSE · jugad-literal-subject-list 90 → 92` (the base has no law
  pack line, so it is compared against BASELINE). The build's own CI verdict is therefore RED by that measurement (§8),
  and the same holds at any landing until FK1 / FK2 are ruled. I did no re-base, no waiver, no narrowing and no
  cosmetic rewrite of a literal (for example `join("tools", …)`): each would remove the finding without removing its
  cause.
- **FK4 · RULING VS SPEC, named.** (i) The spec's P1 option A (waive `SURFACES` / `LAW_HOME`) is not ruled. F1 B was
  built: no `law-waiver:jugad` marker is on any line. (ii) The spec's W1 mutant (delete a waiver) has nothing to delete.
  Its clause is LEGS + JUGAD here. (iii) The spec's W4 (a fall is not red) is folded into RISE, and mutant M-FALL breaks
  it. (iv) The spec's W5 / W6 / W7 test P4 (the planted tree), which row 1137 (3) does not give this unit. The LIVE
  tables' "only shrink" check rides HERMETIC instead. (v) The spec's W3 reads "RED on base: … GREEN". The witness
  states it as the RISE clause being RED on the BASE.
- **FK5 · the conductor selftest stays LIVE in the hermetic profile** (a PLANT member, spec §2.4). F6 B changes its
  probe only, so the neutral machine still does not run it. The witness's PORT clause runs it on a planted copy.
- **FK6 · not this unit's, carried so it is not lost:** spec F7 (hermetic coverage red, `deck_lint, home_pin, probe,
  study_scope` orphaned) is still red at BASE and on the build. Spec F8 (`gates` no-empty red, mode LIVE) is unchanged.
- **FK7 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository. Its error is in
  the ledger and the final message, and nothing was written under `campaign-2026-09/`.
