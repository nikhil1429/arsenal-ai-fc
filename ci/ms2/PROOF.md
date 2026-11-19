# ms2 — PROOF (cloud build seat, 19 Nov 2026 UTC)

Unit **ms2** · forks rows 1121 / 1123 (2) / 1125 · branch `claude/ms2-build`. Every number below was measured on
19 Nov 2026 in this container (Linux, node v22.23.5) by the command named beside it; the ledger is `ci/ms2/LEDGER.jsonl`.

## 0. THE BASE

- Cut from **`c6374964776885eb9486b008b0bd259a78eb94ba`** (`c637496`, the ms1 seat's third follow-up tip, row 1125):
  `git fetch origin claude/ms1-build`, then `git checkout -b claude/ms2-build c637496`. `ci/ms2/BASE` holds it.
- The spec read whole: `git show 929e7e6:ci/ms2/MS2_SPEC.md` (branch `claude/ms2-spec`), with its ledger.
- **The assembled tip (rows 1119 (2), 1123 (2)): NO message naming an assembled `claude/ms1-build` tip has reached this
  seat** by the time of this proof. So nothing is merged; the build stands on `c637496` (§9 says what the merge does).

## 1. THE RULING APPLIED, AND WHERE IT DIFFERS FROM THE SPEC (the ruling wins)

| Fork | Ruling (row 1121) | What is built | Spec text it overrides |
|---|---|---|---|
| F1 | (c) | `ci/<u>/LANDED_ON` holds P (one 40-hex line), READ by the member, never computed | — |
| F2 | (a) | L = the newest commit of the unbroken run right after P whose subjects name the unit | — |
| F3 | the door, two kinds of line | `ci/<u>/REBASE`: `RECUT <ID> · <v> · row <n> · <why>` (head judges the new form, the L-leg drops the id) and `DROP <ID> · <v> · row <n> · <why>` (head drops, L binds; green at head ⇒ STALE red); unknown id / wrong order / bad line ⇒ INVALID red, drops nothing | spec C3 had ONE kind of line, dropped at head only |
| F4 | (a) | the L-leg's sides are git trees (LF tree + `git init` + one commit), the head leg keeps ms1's plain trees | — |
| F5 | C4 + the base-tree skip ms1 builds | C4 built (`ciChanged`); the merge-base skip is ms1's `cfc172b` (T3 BASETREE), unchanged here. **C5's second half is NOT built: `scripts/ci_verdict.mjs` is untouched**, W-V1 / W-V2 are not clauses | spec C5 second half, W-V1, W-V2 |
| F6 | (b) | the plus form `unit <a> + <b> (` is accepted: every named unit shares the landing (member `landingUnits`, land.mjs C6 checks EVERY named unit's LANDED_ON) | spec recommended (a), C6 refusing `+` |
| F7 | (a), read as main after the assembled landing | the witness's base today is `c637496` (no assembled tip named yet, §0) | — |
| F8 | (a), done by ms1 | ms1 carried `ci/mfac-floor/`; ms2 writes its LANDED_ON `a18c167…` | — |
| F9 | (a) | `.claude/skills/runner/SKILL.md` gains THE LAND BRANCH section (subject, LANDED_ON = P in the same commit, the REBASE line) | spec named it a fork |
| C7 | — | 29 LANDED_ON files (ms1's 25 + mfac-floor, mjd7, mport, mtxt, which ms1 carried after the spec). **W-C2 MPOOL is not a clause**: ms1 already carries `ci/mpool/PROOF.md` (`501c5ed`), so it cannot discriminate. **`ci/mfac/REBASE` is not written**: ms1's `0191132` moved mfac's W3.2 into that witness's own BOUND (row 1119 (3)(b)) | spec C7 W-C2, C3's ci/mfac/REBASE |

**Three calls this seat made inside the ruling — each a fork for the architect (§8), each a clause:**
1. **PENDING (W-R9).** A door line whose overtaking unit v has a `ci/<v>/` in the tree but has not landed is VALID. The
   ruling says "valid only if the overtaking unit landed after" and "the overtaking unit writes the line in its own
   landing": on v's seat branch, before that landing, v has not landed yet, and once it lands it lands after u (u has
   landed). Read strictly, every line would be INVALID until its own landing, so no seat push could ever judge it green.
   v landed before or with u is INVALID (W-R4).
2. **C6 binds from the first LANDED_ON on main**, not from the first BASE (spec: "when the NO-CI-DIR law binds"). If it
   bound when NO-CI-DIR binds, ms1's own B3.3 CIDIR guard (subject `unit u1`, no LANDED_ON) would turn RED at head: an
   overtake of ms1 by ms2 that would need a re-cut of `ci/ms1/witness_ms1.mjs`, a file outside this build. Measured:
   ms1's witness stays `GREEN MS1 … · 31 clause(s)` before and after (§4). After ms2 lands, the two readings bind the
   same landings.
3. **No landing after P.** LANDED_ON on main's first-parent line, the next commit not naming the unit and HEAD not in
   flight ⇒ RED `its LANDED_ON is followed by its landing on main's first-parent line (C1)`. P = main's tip and not in
   flight ⇒ the not-landed line.

## 2. FILES (BOUND: only these differ from `c637496`)

`scripts/organism_test.mjs` (the witnesses member only) · `scripts/land.mjs` (step 5 + two header lines) ·
`.claude/skills/runner/SKILL.md` (F9 a) · `ci/<u>/LANDED_ON` × 29 · `ci/ms2/` (`BASE`, `witness_ms2.mjs`,
`run_mutants_ms2.mjs`, `PROOF.md`, `LEDGER.jsonl`). No `ci/<u>/REBASE` yet (§9). `scripts/ci_verdict.mjs`,
`.github/workflows/suite.yml`, `.claude/settings.json` and `dressing-room/state` are untouched.

## 3. THE WITNESS BOTH WAYS (by last line)

Trees: LF trees under `os.tmpdir()` (`git archive c637496`; the build's tracked files), node `ci/ms2/witness_ms2.mjs`:

```
--org build  --base-org c637496   GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · 30 clause(s)   (exit 0)
--org c637496 --base-org c637496  RED MS2 · W-L1 READ, W-L2 RUN, W-L3 SPOOF, W-L4 INFLIGHT, W-L6 FULL, W-L7 GITSIDE, W-L8 OFFMAIN, W-L9 SECONDS, W-L10 PLUS, W-R1 DROP, W-R2 KEEPATL, W-R3 STALE, W-R4 ORDER, W-R5 UNKNOWN, W-R6 NEWDEATH, W-R7 RECUT, W-R9 PENDING, W-T1 TRIGGER, W-T2 CHANGED, W-G1 SUBJECT, W-G2 LANDEDON, W-G4 PLUS, W-C1 CARRY, BOUND   (exit 1)
```
The five guards (W-L5 NOTLANDED, W-R8 RECUTHEAD, W-G3 GOOD, W-G5 PLUSOK, W-G6 BEFORE) are GREEN on both, as a guard must be.
Mutants (`node ci/ms2/run_mutants_ms2.mjs --org <build> --base-org <c637496>`):
`run_mutants: 28 of 28 mutant(s) RED by the clause that names them · control GREEN`.

## 4. THE MEMBER BEFORE AND AFTER (the one member touched: `witnesses`)

`GITHUB_ACTIONS=true GITHUB_WORKSPACE=<tree> ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`
(19 Nov 2026, Linux; before = a shared clone at `c637496`, after = this branch at `385899e`):

| | headline line | witnesses line |
|---|---|---|
| before `c637496` (19 Nov 2026) | `organism_test: 48 passed, 11 failed · ruled 4 · UNRULED 7 · LIVE 0 (hermetic: named, not run)` | `witnesses · 30 unit(s) · 350.2 s` |
| after `385899e` (19 Nov 2026) | `organism_test: 73 passed, 16 failed · ruled 4 · UNRULED 12 · LIVE 0 (hermetic: named, not run)` | `witnesses · 31 unit(s) · 735.9 s` |

**The L-leg at every landed unit (after):** 26 of the 29 landed units `ok   WITNESS ‹u› · GREEN at its LANDED sha against its
landing's parent`, BOUND judged in full, git sides. mtail's T3 AUTH, mjd3's J4, mjud's M3/M5/M6 and mf2's F2/F4 are all
GREEN at their landing, which is the spec's §3 measured again by the member itself. ms1 and ms2 print
`not landed — its L-leg runs at its landing`. Three are refused before they spawn, at L: see B4 below.

**Every red after, accounted for:**
- **Ruled (4), the same as before:** mjd3 J4 · mtail T3 AUTH · mjud M3 M5 M6 · mf2 F2 F4 (KNOWN_RED, row 1107; the
  repair units of the assembled landing retire them).
- **Unruled and ALREADY RED at `c637496` (7 before → the same 7 after, plus their L-legs):** `WITNESS ‹mfac› · GREEN at
  head` (`F4`, ms1's own named overtake by mfac-floor) and **B4 `binds no fixed service port` for mland, mlj, mlv0, mlv1,
  mport, ms1**. Cause, measured: mport's landing (`8c729c8`) made keeper's export
  `export const JUDGE_PORT = plantedPort("ARSENAL_JUDGE_PORT", 4118);` (`scripts/keeper.mjs:100`). ms1's static read
  (`organPorts`, `organism_test.mjs`) finds a door only as `process.env.<NAME>` on that line, so the door reads absent
  and every witness naming JUDGE_PORT is refused. This is ms1's member against mport's change: not ms2's, not fixed here
  (fork FK1).
- **New with ms2, each explained:**
  - **B4 at L for mlv0, mlv1, mport** (3 asserts): at their L the keeper's JUDGE_PORT had no door
    (`scripts/keeper.mjs:78`/`:79` at L), so the L-leg refuses to spawn a witness that would bind the live judge port.
    That is the port class doing its job (row 1053). These three units cannot be judged at L as their witnesses stand
    (fork FK2).
  - **`WITNESS ‹ms2› · binds no fixed service port (B4)`**: my witness's stub keeper named the export
    (`witness_ms2.mjs:169`). Fixed in `4e9dd9c`: the name is spelled in two pieces, as ms1's FIXED_BIND fixture is.
  - **`WITNESS ‹mlv2› · GREEN at head against its BASE` `red beyond BOUND: LIVE-SAFE`**, once, in the full sequence.
    NOT reproduced: mlv2 alone through the same member on this branch, twice → `RED MLV2 · BOUND` (GREEN beyond BOUND);
    on `c637496` alone → the same. Named, not guessed (N3).

## 5. THE FULL HERMETIC SUITE BEFORE AND AFTER

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (no GITHUB_ACTIONS: the witnesses member prints its
one skip line):

| 19 Nov 2026 | headline line | exit · wall |
|---|---|---|
| before `c637496` (19 Nov 2026) | `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` | 2 · 25.5 s |
| after `345fde9` (19 Nov 2026) | `organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` | 2 · 30.2 s |

The one red after is red before too: `EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)`
(`orphaned: deck_lint, home_pin, probe, study_scope`), no file of ms2's. The two reds only before (`SUITE MEMBER · sandbox
selftest exits 0` and `all … hermetic suite members pass`, the sandbox tripwire recording two of four canary attempts)
were measured in a shared clone under the OS temp dir, not in this checkout; they are named, not attributed (N4).
No selftest of an organ is touched by ms2: `land.mjs` has no selftest mode (its witness is `ci/mland/`, judged by the
member, §4: `GREEN MLAND landing verb · 19 clause(s)` at L).

## 6. MODELS

`node scripts/models.mjs check` → exit 0 (`models check · config scan: 19 file(s) · hits 0 · declared 0 …`, 19 Nov 2026).

## 7. THE NEUTRAL MACHINE (read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`, no token)

@CI@

## 8. FORKS (for the architect)

- **FK1 · B4 against mport's keeper.** ms1's `organPorts` does not read `plantedPort("ARSENAL_JUDGE_PORT", …)` as a door,
  so six carried witnesses are refused at head on `c637496` already. (a) ms1's assembled tip widens the door read to that
  call (ms1's member, ms1's seat). (b) ms2 does it here (organism_test.mjs is a named file, but the clause is ms1's B4, not
  one of ms2's). (c) mport's keeper writes the door as `process.env.ARSENAL_JUDGE_PORT` on that line. Not edited here.
- **FK2 · witnesses that can never run at L.** mlv0, mlv1 and mport name JUDGE_PORT, and at their L keeper had no door,
  so the L-leg refuses them (correctly, the port class). (a) Rule the three L asserts. (b) Their own re-cut names the port
  through a door the old tree honours. (c) The L-leg plants the door into the L side's keeper (changes the tree under
  judgement: not recommended).
- **FK3 · mfac F4 at head.** Red on `c637496` and after; GREEN at mfac's L (28 clauses). mfac-floor overtook it and
  landed after mfac, so the door fits: a `DROP F4 · mfac-floor · row 1106 · …` line in `ci/mfac/REBASE`, or a RECUT.
  The ruling gives ms2 the lines of the FIVE assembled units only, so it is not written here.
- **FK4 · PENDING** (§1 call 1), **FK5 · C6 binds from the first LANDED_ON** (§1 call 2).
- **FK6 · mrv** has a spec branch and no build here: its door line (if mlv1's clause is the overtaken one) is written
  when the assembled tip arrives.

## 9. THE ASSEMBLED TIP (open)

When a message names the assembled `claude/ms1-build` tip: `git merge` it (never rebase, never force), re-run the
witness and the member, and name both here. **The door lines, measured now (19 Nov 2026, Linux)** by the ms2 member over a
shared clone of this branch whose `ci/` holds only the four re-cut dirs, each taken from its repair branch's tip
(mr3 `08b4772`, mrj `0fff2e2`, mrt `d45adaa`, mrf `5378193`), LANDED_ON as §2 (`<scratchpad>/recut_measure.sh`):

| re-cut witness | its L-leg (L vs P, BOUND judged) | the line its overtaking unit's landing needs |
|---|---|---|
| mjd3 (mr3) | `RED MJD3 · J4` | `ci/mjd3/REBASE`: `RECUT J4 · mr3 · row 1112 · …` |
| mjud (mrj) | `RED MJUD · M3 CENSUS · M5 F3-CLIP` (M6 GREEN at L) | `ci/mjud/REBASE`: `RECUT M3 CENSUS · mrj · row 1112 · …`, `RECUT M5 F3-CLIP · mrj · row 1112 · …` |
| mtail (mrt) | `RED MTAIL · T2 F-C` (T3 AUTH GREEN at L) | `ci/mtail/REBASE`: `RECUT T2 F-C · mrt · row 1120 · …` |
| mf2 (mrf) | `GREEN MF2 … · 6 clause(s)` (the monotone re-cut holds at L) | none |
| mlv1? (mrv) | no build branch reachable (`claude/mrv-spec` only) | measured when the assembled tip arrives |

Each id is a quoted literal of its re-cut witness only if the re-cut keeps it so; (a) is judged at the merge. The head
results of that clone are NOT readings of the repairs (their organ changes are absent from it) and are not cited.

## NAMED, NOT GUESSED

- **N1** the L-leg's seconds and the job's wall time on `windows-latest`: read from this branch's first un-cancelled run (§7).
- **N2** the Windows cost of git sides (`git init` + `git add -A` + commit, twice per L-leg): the same run.
- **N4** the sandbox selftest's two reds in the `c637496` clone (§5): a clone-path effect or a real red at that tip is not measured here.
- **N3** mlv2 LIVE-SAFE, red once in the full Linux sequence, green alone twice: whether a sequence effect (a port a
  previous witness left) or a flake is not measured.
