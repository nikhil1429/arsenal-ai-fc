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

CHECKPOINT · STOPPED at 2026-11-19T12:38:15Z · resume from: re-run the member (GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses) on the tree merged with 1582be0 (merges f69de73 + 0f182b1 are on this branch; witness GREEN 30 clauses vs 1582be0, mutants 28 of 28, ledger), write the measured RECUT lines (PROOF §9) into ci/<u>/REBASE, re-run witness + member, add the new PROOF section with the tip sha and both neutral legs (node scripts/ci_verdict.mjs <full sha>)
RESUMED (his word #270, relayed by the runner, 19 Nov 2026) from the CHECKPOINT line above.

## 10. THE ASSEMBLED TIP MERGED (architect orders after row 1158, 19 Nov 2026)

- **Merges** (merge commits, never a rebase, never a force push): `f69de73` merges **db3e01d** (the assembled tip:
  ms1 + mrj + mrt + mr3 + mrf + mrv, main fb42118 merged); `0f182b1` merges **1582be0** on top (db3e01d + the dated
  count line at `ci/mrv/PROOF.md:105`). The one conflict (`scripts/organism_test.mjs`, the per-unit loop of
  `witnesses()`) keeps ms2's head leg / door / L-leg shape and carries ms1's two head-leg additions into it: the
  killed-at-the-bound named red (row 1153 (3) F-9, now in BOTH legs) and the PORT_HELD measurement lines (row 1153 (2)).
  1582be0's `organPorts` reads `plantedPort("ARSENAL_JUDGE_PORT", …)` as a door: **FK1 is answered upstream**.
- `ci/ms2/BASE` = `1582be0…` (the tree ms2 builds on). LANDED_ON added for the three units 1582be0 carries from main
  (mrung `3f84c80`, mtxt3 `12f1eca`, mxw `0f39835`): 32 in all; W-C1 CARRY names them.
- **The witness both ways (19 Nov 2026)**, LF trees of the merged work tree and of 1582be0:
  `--org merged --base-org 1582be0` → `GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · 30 clause(s)` (exit 0) ·
  `--org 1582be0 --base-org 1582be0` → `RED MS2 · W-L1 READ, W-L2 RUN, W-L3 SPOOF, W-L4 INFLIGHT, W-L6 FULL, W-L7 GITSIDE, W-L8 OFFMAIN, W-L9 SECONDS, W-L10 PLUS, W-R1 DROP, W-R2 KEEPATL, W-R3 STALE, W-R4 ORDER, W-R5 UNKNOWN, W-R6 NEWDEATH, W-R7 RECUT, W-R9 PENDING, W-T1 TRIGGER, W-T2 CHANGED, W-G1 SUBJECT, W-G2 LANDEDON, W-G4 PLUS, W-C1 CARRY, BOUND` (exit 1).
- **Mutants**: `run_mutants: 28 of 28 mutant(s) RED by the clause that names them · control GREEN`.

### 10.1 The member on the merged tree, and the door lines it measured

`GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses` at
`a1bd8a2` (19 Nov 2026, Linux, no door lines yet): `organism_test: 108 passed, 9 failed · ruled 0 · UNRULED 9 · LIVE 0` ·
`witnesses · 39 unit(s) · 1154.0 s`. The L-leg is GREEN for 24 landed units; ms1, mr3, mrj, mrt, mrf, mrv and ms2 print
`not landed`. The L reds, each traced to the commit that re-cut the witness, became the door lines (`2e4ec3b`):

| `ci/<u>/REBASE` | red at L (a1bd8a2) | the re-cut, by `git log c637496..1582be0 -- ci/<u>/` |
|---|---|---|
| mjd3 | `J4` | `RECUT J4 · mr3 · row 1112` (c76c378) |
| mjud | `M3 CENSUS M5 F3-CLIP` | `RECUT M3 CENSUS` / `RECUT M5 F3-CLIP · mrj · row 1112` (eeba921) |
| mtail | `T2 F-C` | `RECUT T2 F-C · mrt · row 1120` (08629d1) |
| mdone | `D-UNREAD D-METER` | `RECUT D-UNREAD` / `RECUT D-METER · ms1 · row 1154` (dfbc99d, ms1's own landing) |
| mfac | `F4` | `RECUT F4 · ms1 · row 1125` (20de517, ms1's own landing) — this also answers FK3 |

ms1 is the landing unit of the assembled landing, so its two re-cuts are written beside the five units' (the ruling's
"the overtaking unit writes the line in its own landing"). Every id is a quoted literal of its witness (checked by
`grep` for `"<ID>"`). mf2 needs no line: its re-cut is GREEN at L (6 clauses). **Measured after the lines** (each unit
with its overtaking unit's dir kept, `<scratchpad>/only2.sh 2e4ec3b <u> <v>`): mjd3, mjud, mtail, mdone, mfac each print
their L red and NO FAIL; mfac's lines in full: `ok REBASE ‹mfac› · every line is valid …`, `ok … every DROP id is still
red at head …`, `ok WITNESS ‹mfac› · GREEN at its LANDED sha against its landing's parent`. Every line is PENDING-valid
(§1 call 1, FK4) until the assembled landing lands, after which each is valid by order.

**Reds left after the door (a1bd8a2's member run, the door lines aside):**
- `WITNESS ‹mlv0›` / `‹mlv1› · binds no fixed service port (B4)` at L (`scripts/keeper.mjs:78` / `:79` at their L, no
  door then): FK2 stands. mrv re-cut mlv1 (a84558f) and still names JUDGE_PORT, so its L-leg cannot spawn.
- `WITNESS ‹mport› · GREEN at its LANDED sha` `red at L: WITNESS` (`RED MPORT · WITNESS` at L `8c729c8` vs P `95b07a6`;
  mport's witness is unchanged since c637496): **FK7**, new: mport's own clause `WITNESS` is red at its own landing.
- `WITNESS ‹mf2› · GREEN at head` `F4`, once, in the full sequence. **Not reproduced**: mf2 alone on `2e4ec3b` → head
  `ok`, L `GREEN MF2 … · 6 clause(s)` `ok`; on 1582be0 alone → head `ok` (N5, the same shape as N3).

### 10.2 The neutral machine on this tip

### 10.3 The neutral legs of `6f42b9db1b2607f82fdd5788f1d0137c48409c03` (run 44592550788, read once, 19 Nov 2026)

`node scripts/ci_verdict.mjs 6f42b9db1b2607f82fdd5788f1d0137c48409c03` → `ci_verdict 6f42b9d UNREADABLE — … answered 403`
(as for 42188fc), so the legs were read with curl (check-runs and their annotations, no token):

| leg | job | started → completed | conclusion | annotation |
|---|---|---|---|---|
| node 22 | `135802231416` | 18:53:41Z → 19:53:53Z | **cancelled** | `The job has exceeded the maximum execution time of 1h0m0s` |
| node 24 | `135802230787` | 18:53:41Z → 19:53:52Z | **cancelled** | `The job has exceeded the maximum execution time of 1h0m0s` |

**No verdict: both legs ran into the job's own bound (`timeout-minutes: 60`, `suite.yml:62`).** This is N1/N2 measured,
and it settles F5 against the projection of the spec's §5. On a SEAT branch every `ci/<u>/` differs from main (main
carries one ci dir), so C4 runs every landed unit's L-leg on every push. Here that was 32 L-legs on git sides, beside 39
head legs, with the assembled tip's slower witnesses. On Linux the same member took `1154.0 s` (§10.1). On
`windows-latest` it does not fit inside the job, after npm ci twice and the suite's other modes.
The earlier push `42188fc` (29 landed units, before the merge) finished in 57 / 54 min (§7, run 44446257679).

**FK8 · the fit (for the architect; nothing here widens a bound, the workflow is untouched):** (a) C4 also compares
`ci/<u>/` with the **merge-base's** tree (or with the seat's own BASE), not only main's, so a seat push runs only the
L-legs of the dirs the seat itself changed; (b) F5 (d): the L-leg gets its own job with its own bound; (c) the head
leg runs only for changed dirs too; (d) once the assembled landing and ms2 land, main carries every ci dir and an
ordinary push runs ~0 L-legs (C4 as built): only seat pushes pay. Measured fact for the ruling: the cost is paid by
**seat** pushes, not by landings.

### 10.4 Where this seat stops

Tip pushed; no later assembled tip has been named to this seat (the runner said one may follow). On such a message:
merge it, re-run the witness and the mutants, read both legs, add §10.5.

## 11. THE ADOPTED ASSEMBLED TIP MERGED (forks rows 1167 / 1168, 19 Nov 2026)

- `fc8890b` reverts `2e4ec3b` (the five `ci/<u>/REBASE` files of §10.1). The architect's order binds the diff from `a1bd8a2`
  to proof, ledger, BASE and the merge only. The lines and their measurement stay recorded in §10.1 and at `2e4ec3b`,
  for the ruling. Without them the L-leg reds of §10.1 (mjd3 J4, mjud M3/M5, mtail T2 F-C, mdone D-UNREAD/D-METER,
  mfac F4) stand unruled on this tip.
- `d2830b2` merges **179a0ee3525aca1ab018bce11fd940346a040463** (claude/ms1-build: 1582be0 + doc-only commits, adopted, GREEN
  on both neutral legs) with a merge commit, no conflict. `ci/ms2/BASE` = that sha.
- `git diff --name-only a1bd8a2 <this tip>`: the merge's paths (ci/ms1/, ci/mrv/ docs) plus `ci/ms2/BASE`,
  `ci/ms2/PROOF.md` and `ci/ms2/LEDGER.jsonl`. Nothing else.
- This tip is pushed ONCE. Its two neutral legs are read once each, with `node scripts/ci_verdict.mjs <full sha>`, and
  written in the seat's final message only, so the verdict stays on this tip.

## 12. MAIN 5759cce MERGED, ROW 1171 APPLIED (rows 1170 (3) / 1171, 19 Nov 2026)

Row 1168 is withdrawn for ms2 (the architect names it his miss), so `e17c00d` restores the five door lines (it reverts
`fc8890b`; the files are byte-identical to `2e4ec3b`).
- **(b) the merge.** `f2ab18e` merges main **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90** (the assembled landing, subject
  `unit ms1 + mrj + mrt + mr3 + mrf + mrv (`, the plus form F6 (b) reads). Its `scripts/organism_test.mjs` and
  `scripts/land.mjs` are byte-identical to 179a0ee's (`git diff --quiet 179a0ee 5759cce -- <file>`). So the two
  history-only conflicts resolve to this branch's version, and `scripts/`, `ci/` and `.claude/` are unchanged against
  `e17c00d` by the merge. `ci/ms2/BASE` = 5759cce.
- **(c) the landed-commit file** of the six units just landed: `ci/{ms1,mr3,mrj,mrt,mrf,mrv}/LANDED_ON` = `fb42118…`,
  5759cce's parent, so L = 5759cce for all six (the plus form shares the landing). 38 LANDED_ON in all. W-C1 names the six.
  The door lines are now valid by ORDER, not by PENDING (FK4): each overtaking unit's L (5759cce) is newer than its
  overtaken unit's.
- **(d) row 1171.**
  - **FK2 A.** The L-leg's port refusal has its own name: `WITNESS ‹u› · binds no fixed service port at its LANDED sha
    (B4)`. The head leg's `binds no fixed service port (B4)` binds as before. Three entries join KNOWN_RED (row 1171,
    owner unit ms2, the port class): mlv0 and mlv1 by that L name, with a detail pattern that admits JUDGE_PORT hits
    only (a new fixed bind beside them is UNRULED), and mport's `GREEN at its LANDED sha against its landing's parent`
    with detail `red at L: WITNESS`.
  - **FK8 A.** `ciChanged` compares `ci/<u>/` with its tree at the MERGE BASE of the push (`git merge-base HEAD
    refs/remotes/origin/main`; none = it runs). A helper outside `witnesses()`, so ms1's B1.3 NOCALC holds. The head
    leg runs every unit; `.github/workflows/suite.yml` is untouched and the bound is not raised. New clause **W-T3
    MERGEBASE**: main changes `ci/pu/` after the seat's cut and the seat's `ci/pu/` equals the merge base → one carried
    line, one spawn. Its mutant compares with main's tip instead.
  - **FK7.** No completed Windows leg reads mport's L-leg yet. 42188fc's legs predate the B4 door fix and refused mport
    before it spawned, and 6f42b9d / 7be797e died at the bound. It is read from this tip's legs when one completes:
    the seat's final message, not a push.
  - **FK4 / FK5 stand.**
  - **mf2** (N5: `F4` red once in the full Linux member sequence, GREEN alone on 2e4ec3b and on 1582be0) is recorded as a
    **second no-cause red beside mlv3's**, evidence for unit mdtl. mlv2's LIVE-SAFE (N3) has the same shape.
- **The witness both ways (19 Nov 2026)**, LF trees of this tree and of 5759cce:
  `--org build --base-org 5759cce` → `GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · 31 clause(s)` (exit 0) ·
  `--org 5759cce --base-org 5759cce` → `RED MS2 · W-L1 READ, W-L2 RUN, W-L3 SPOOF, W-L4 INFLIGHT, W-L6 FULL, W-L7 GITSIDE, W-L8 OFFMAIN, W-L9 SECONDS, W-L10 PLUS, W-R1 DROP, W-R2 KEEPATL, W-R3 STALE, W-R4 ORDER, W-R5 UNKNOWN, W-R6 NEWDEATH, W-R7 RECUT, W-R9 PENDING, W-T1 TRIGGER, W-T2 CHANGED, W-T3 MERGEBASE, W-G1 SUBJECT, W-G2 LANDEDON, W-G4 PLUS, W-C1 CARRY, BOUND` (exit 1).
  Mutants: `run_mutants: 29 of 29 mutant(s) RED by the clause that names them · control GREEN`.

### 12.1 The step timings of the legs that died at the bound (curl `actions/runs/<id>/jobs`, read 19 Nov 2026)

| run · tip | leg | npm ci | `npm test · hermetic · head` | merge base | verdict step |
|---|---|---|---|---|---|
| 44446257679 · 42188fc | node 22 | 24 s | 3281 s (success) | 116 s | failure (RED) |
| 44446257679 · 42188fc | node 24 | 20 s | 3082 s (success) | 118 s | failure (RED) |
| 44592550788 · 6f42b9d | node 22 | 59 s | **3527 s, cancelled** | skipped | skipped |
| 44592550788 · 6f42b9d | node 24 | 66 s | **3524 s, cancelled** | skipped | skipped |
| 44604478134 · 7be797e | node 22 | 48 s | **3531 s, cancelled** | skipped | skipped |
| 44604478134 · 7be797e | node 24 | 59 s | **3531 s, cancelled** | skipped | skipped |

The head step alone (the suite with the witnesses member, head leg + L-legs) fills the hour. On THIS tip FK8 A cannot
spare an L-leg: its own LANDED_ON files and door lines change every `ci/<u>/` against the 5759cce merge base, so ms2's
own push pays the full sweep, about the same as 6f42b9d. After ms2 lands, a seat pays only for the dirs it changes.

### 12.2 The member on this tree (Linux, 19 Nov 2026, before `ci/mr3/REBASE`)

`GITHUB_ACTIONS=true GITHUB_WORKSPACE=$PWD ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses` →
(19 Nov 2026) `organism_test: 123 passed, 10 failed · ruled 3 · UNRULED 7 · LIVE 0 (hermetic: named, not run)` · `witnesses · 39 unit(s) · 1371.9 s`.
29 L-legs `ok`; 10 `ok   REBASE` lines (the five door files valid by order, none STALE); the three row 1171 entries
read `[RULED row 1171 · unit ms2 …]`. The seven UNRULED, each named:
- **mr3 at head `K3`.** Overtaken by ms2 itself: K3 holds "the ‹mjd3› entry is gone and NOTHING JOINS KNOWN_RED", and row
  1171's FK2 A entries join it. ms2 writes the door line in its own landing: `ci/mr3/REBASE` =
  `DROP K3 · ms2 · row 1171 · …`. Measured after it (`<scratchpad>/only2.sh <tip> mr3 "mjd3 ms2"`): `ok WITNESS ‹mr3› ·
  GREEN at head` · `ok REBASE ‹mr3› · every line is valid` · `ok … every DROP id is still red at head`.
- **The six units of the shared landing at L = 5759cce vs P = fb42118: `red at L: BOUND`** (ms1, mrj, mrt, mrf, mrv) and
  **`K2 BOUND`** (mr3). **FK9, new.** A plus-form landing (F6 (b)) carries the UNION of its units' files, and each
  witness's BOUND names only its own, so at the shared L every BOUND is red. mr3's K2 also reads `ci/mjd3/BASE` on
  `--base-org`, and P (main before the assembled landing) carries no ci dir. These are reds of how the landing was
  made, not overtakes, so no door line fits them; this seat writes none. Options: (a) the L-leg of a plus-form landing
  judges BOUND as ms1's head leg does (drop BOUND ids); (b) rule the six L asserts; (c) each unit's BOUND names its
  co-landed units' files.

CHECKPOINT · STOPPED at the push of this commit (its parent and the merge are named in §12; the tip is this commit, read with `git rev-parse origin/claude/ms2-build`) · resume from: read both neutral legs of the tip once each (`node scripts/ci_verdict.mjs <full sha>`, curl when it answers 403), FK7 (mport's L-leg on the Windows leg) and the step timings if a leg dies at the bound — in the final message only; then the architect's ruling on FK9.

## 13. RESUMED: MAIN 7bf008b MERGED (forks rows 1233 (2) / 1236, 21 Nov 2026)

Read before acting: §12's CHECKPOINT line and every message after it. They still bind: row 1171 (FK2 A, FK8 A, FK7 open, FK4 and
FK5 stand, mf2 is a second no-cause red beside mlv3), FK9 is open, and no retry for green.
- **The merge.** `42faaa39955c860d5483d80c47c76329534ea7e1` merges main **7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f** (`git fetch
  origin main; git merge FETCH_HEAD`, a merge commit). **One conflicted file: `scripts/organism_test.mjs`**, the
  per-unit loop of `witnesses()`. How it was resolved: ms2's shape is kept (headLeg / the door / landedLeg), and main's ONE new
  line set in that loop (unit mdtl, row 1186 F1 A · F2 R2) is carried into `headLeg` with the same text and meaning:
  - the guarded import of `witness_cause.mjs` (now `ctx.wc`);
  - the CAUSE lines pushed to `causes` after a head red, from `r.code` / `r.killed`.
  Every other landed line of main in that file, in `package.json` and in `ci/` merged without conflict and is kept as
  landed. `package-lock.json` is unchanged from 5759cce to 7bf008b. The body of `witnesses()` still names no merge-base, no
  `HEAD^` and no `^1` (ms1 B1.3).
- **BASE.** `ci/ms2/BASE` = 7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f. Rows 1170 (3) / 1171 keyed this seat's BASE to the main it
  merges.
- **C7 carried forward.** Twelve units landed on main since 5759cce and carried no LANDED_ON. Each now holds its P, derived as
  in §2: mcap, mclk, mcov, mcrk, mdet, mdtl, mdtl2, mherm, mlaw, mmeter, mpres, mprk. That makes 50 in all, and every
  existing LANDED_ON still equals its derivation. W-C1 names all 50.
- **The witness both ways** (21 Nov 2026, LF trees of the merged work tree and of 7bf008b):
  `--org merged --base-org 7bf008b` → `GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · 31 clause(s)` (exit 0) ·
  `--org 7bf008b --base-org 7bf008b` → `RED MS2 · W-L1 READ, W-L2 RUN, W-L3 SPOOF, W-L4 INFLIGHT, W-L6 FULL, W-L7 GITSIDE, W-L8 OFFMAIN, W-L9 SECONDS, W-L10 PLUS, W-R1 DROP, W-R2 KEEPATL, W-R3 STALE, W-R4 ORDER, W-R5 UNKNOWN, W-R6 NEWDEATH, W-R7 RECUT, W-R9 PENDING, W-T1 TRIGGER, W-T2 CHANGED, W-T3 MERGEBASE, W-G1 SUBJECT, W-G2 LANDEDON, W-G4 PLUS, W-C1 CARRY, BOUND` (exit 1).
  Mutants: `run_mutants: 29 of 29 mutant(s) RED by the clause that names them · control GREEN`.
- **The full hermetic suite** (21 Nov 2026, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`):
  `organism_test: 166 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` (exit 0).
- **The clock (mclk).** No clause of `ci/ms2/witness_ms2.mjs` derives a day from the clock. Its planted commit dates are
  fixed epochs (`1700000000 + n`), so no midnight plant exists here.
- **Its neutral legs:** read once each, after this push, through the public API (curl, no token). They are named in the
  CHECKPOINT line below (a push of its own, made only to name them) and in the final message. If a leg is red, its red and
  cause are named; there is no retry.
