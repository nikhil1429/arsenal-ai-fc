# MKP24 PROOF — each keeper-family red carries a CODED cause (shape C0), and a multi-word clause id is read whole

Seat: cloud build seat, unit mkp24 (forks rows 1185 (5) / 1186 (4) / 1213 (3) / 1215 (4) / 1216). Branch `claude/mkp24-build`.
Spec: `ci/mkp24/MKP24_SPEC.md` at 229fbed, carried here as it is. Where the spec and row 1216 differ, the row wins, and each
difference is named in section 6. Every measurement below is dated 2026-11-20 and was taken in this cloud container
(linux, node v22.23.5, no `npm ci`). Linux is not the measurement (row 1185 (5)); the neutral legs are in section 7.

## 1 · THE BASE

- **Cut from `25f13f270cc513cfa18ac6cf7bee35fc38001013`** (land/mdtl: main b6de26b plus the adopted mdtl bytes), by row 1216 K-F4.
  It is not main.
- **No `ci/mkp24/BASE` is written.** Row 1216 K-F4: BASE is the main that holds mdtl, written when a message names it. Until then
  the witness runs with `--base-org` on the tree of 25f13f2. **That base is INTERIM.**
- The mdtl bytes the third readable red ran on (land/mdtl 6178e62) are the cut's bytes for every file of this unit.
  `git diff --stat 6178e62 25f13f2 -- ci/mlv1 ci/mlv2 ci/mlv3 ci/mrv scripts/witness_cause.mjs scripts/cortex.mjs scripts/keeper.mjs`
  prints nothing.

## 2 · THE NAMED FILES (exactly the spec section 12 list; nothing else differs)

| file | what changed |
|---|---|
| `scripts/witness_cause.mjs` | **ONE edit** (K-F3 A and K-F10 A): the multi-word clause id (`claimLines`, `idsInSource`, and `causesOf` matched greedily, longest known id first) and the C0 code rule (`codesOf`, a `cause` input to `causesOf`, and `verifyCause` re-reading a code's text from the source). `judgeLast` is untouched |
| `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs`, `ci/mlv3/witness_mlv3.mjs` | one `CAUSES` literal (the family's, byte-identical in all four), one `CAUSE <ID> <CODE>` print in `clause()`, and a `code:` beside each red `why`. **No wait, bound, clause id, claim or printed reason changes** (K-F11) |
| `ci/mrv/witness_mrv.mjs` | the same literal and print; `verdict()` passes the first judged inner red's own code through, mapped to mrv's clause id. NAMED, every plant, wait, clause id and claim are unchanged |
| `scripts/organism_test.mjs` | the CAUSE collection only: the witness's `^CAUSE ` lines are handed to `causesOf` |
| `ci/mkp24/witness_mkp24.mjs`, `plant_mkp24.mjs`, `run_mutants_mkp24.mjs`, `PROOF.md`, `LEDGER.jsonl` | this unit's own files (`MKP24_SPEC.md` is carried unchanged) |

**What leaves.** A CAUSE code leaves only as `<ID> · <CODE> · <text>`. The `<text>` is the value of that key in the witness's
tracked `CAUSES` literal, re-read from the source by both checks: the member's `causesOf` and ci_verdict's `verifyCause`. It
never comes from stdout. No key and no text carries a digit (K-F2 C0). A CAUSE line whose code is no key becomes the one
`WITHHELD` entry.

## 3 · THE WITNESS BOTH WAYS (by its last line; 2026-11-20)

The trees are node exports of the commit (`git show <sha>:<path>`, under the scratchpad): `<head>` is the build's commit and
`<cut>` is 25f13f2.

- **Build:** `node <head>/ci/mkp24/witness_mkp24.mjs --org <head> --base-org <cut>` exits 0 in 12 s.
  `GREEN MKP24 each keeper-family red carries a coded cause read from its own source, multi-word ids are read whole, and no runtime text leaves · 10 clause(s)`
- **Base:** `node <head>/ci/mkp24/witness_mkp24.mjs --org <cut> --base-org <cut>` exits 1 in 12 s.
  `RED MKP24 · K1 RETIRE-LATE, K2 NO-GAP, K3 PORT, K4 LOST, K5 UNPLANTED, K6 NO-LEAK, K7 REPLAY, K8 MRV, BOUND`
  LAST is GREEN both ways, as in every unit of this queue (section 6, D4).

The clause lines at the build (2026-11-20, abridged):
- K1: mlv3 under p-stale. T1 IDLE carries RETIRE-LATE.
- K2: mlv3 under p-gap. T2 ONCE carries NO-GAP and not LOST.
- K3: mlv1 under p-hold. I2 MID carries NOT-UP-PORT.
- K4: mlv3 under p-drop. T2 ONCE carries LOST and no clock code.
- K5: the CAUSES literal is byte-identical in the four, and mlv1 unplanted is GREEN with no CAUSE line.
- K6: no leaving line carries the canary or the forged text. The known code's source text, the toy's multi-word claim and
  WITHHELD are all readable.
- K7: `T1 IDLE LIVE-SAFE` gives the two clauses' own claims and no WITHHELD. `M1 PORTHELD` gives its own claim. `C4 CENSUS`
  (section 10) gives its own claim and no WITHHELD.
- K8: mrv's M3 BOOT carries RETIRE-LATE.
- BOUND: no file beyond the named ones differs.

## 4 · THE MUTANTS (2026-11-20)

`node <head>/ci/mkp24/run_mutants_mkp24.mjs --org <head> --base-org <cut>` exits 0 in 132 s:
`run_mutants: 10 of 10 mutant(s) RED by the clause that names them · control GREEN`. After section 10 (2026-11-21, 169 s):
`run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`, the new one K7b-m.

The mutants are K1-m (T1 prints no CAUSE line), K2-m (NO-GAP maps to LOST), K3-m (the port branch maps to NOT-UP-KEEPER),
K4-m (LOST and TWICE share a code), K5-m (a CAUSE line on GREEN), K6-m (the code rule trusts the witness, in both checks),
K7-m (one word at a time), K8-m (mrv drops the inner code), BOUND-m (a touch of `scripts/keeper.mjs`) and LAST-m (a detached
survivor).

## 5 · EVERY TOUCHED MEMBER, BEFORE (cut 25f13f2) AND AFTER (tip), by its headline line

- `node scripts/witness_cause.mjs selftest`: 2026-11-20 at the cut, `witness_cause selftest: 11 passed, 0 failed`.
  At the tip (same day), `witness_cause selftest: 17 passed, 0 failed`. The new checks are the K-F10 replay, the M1 PORTHELD
  claim, `codesOf`, the code rule, a canary code and the verifier.
- `node scripts/ci_verdict.mjs selftest` (it imports the module): 2026-11-20, `ci_verdict selftest: 34 passed, 0 failed` both at the cut and the tip.
- `node ci/mdtl/witness_mdtl.mjs --org <head> --base-org <cut>` (the mdtl channel this unit edits): 2026-11-20,
  `GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)`.
- `node ci/<u>/witness_<u>.mjs --org <tree>` for mlv1, mlv2 and mlv3: GREEN at the cut and at the tip (2026-11-20). They read
  `GREEN MLV1 … · 4 clause(s)`, `GREEN MLV2 … · 6 clause(s)` and `GREEN MLV3 … · 6 clause(s)`, and print no CAUSE line at the tip.
  `node ci/mrv/witness_mrv.mjs --org . --only "M3 BOOT"` at the tip reads `GREEN MRV … · 2 clause(s)`.
- **`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`**, exit 2 both, the same headline at the cut and the
  tip (2026-11-20): `organism_test: 149 passed, 6 failed · ruled 0 · UNRULED 6 · LIVE 124 (hermetic: named, not run)`.
  - The sorted assert sets, digits folded, are identical (`diff` prints nothing).
  - The fails are the same at both: `SUITE MEMBER · lawpack / done / probe / fsrs / mutagen selftest exits 0` and the
    roll-up. They were red at the cut, in this container without `npm ci`.
  - No member turned red. The member lines touched (`SUITE MEMBER · witness_cause selftest exits 0` and
    `SUITE MEMBER · ci_verdict selftest exits 0`) read `ok` at both.
  - The container skips the witnesses member (B2), so the family's neutral reading is section 7.
- `node scripts/models.mjs check`: exit 0, `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`.

## 6 · WHERE THIS BUILD DIFFERS FROM THE SPEC (the row wins; each named)

- **D1 · K1's plant.** The spec's p-watch (the worker's `fs.watch` a no-op, "so only the poll floor can retire") does **not**
  hold T1. Measured on 2026-11-20: under p-watch, T1 and T2 read GREEN. thalamus calls the retirer's `check()` itself as each
  request ends, so a closure write is seen without any watch event.
  - The plant used is **p-stale**: the watch is a no-op, and the worker's `statSync` of a `scripts/*.mjs` reads no later than
    its own start. The write is never surfaced, which is the filesystem-event class.
  - The same plant drives K8.
- **D2 · K5 is RED at base, not a guard.** It also holds the family literal: one literal, byte-identical in the four
  witnesses, with code grammar and no digit. The base has no literal, so K5 is RED there, as every clause of this brief must be.
- **D3 · BOUND is stricter than the spec's.** Outside `ci/` only `scripts/organism_test.mjs` and `scripts/witness_cause.mjs`
  may differ, **and both must** (so BOUND is RED at the base). Inside `ci/` only the four family witness files and
  `ci/mkp24/` may differ.
- **D4 · LAST is GREEN at base.** It is a hygiene clause, GREEN both ways, as in the spec's table and every unit of this queue.
- **D5 · K7 REPLAY and K8 MRV are added.** K7 is row 1216's "the replay of the first red as a witness clause". K8 is the
  spec's section 7 mrv pass-through, which the spec's section 8 table gave no clause.
- **D6 · the family carries ONE CAUSES literal**, not one per witness. mrv's pass-through can only carry a code that sits in
  its own literal, and one table keeps the texts identical. K5 holds the byte-identity.
- **D7 · K-F9 (where the unit witness lives).** It is `ci/mkp24/witness_mkp24.mjs` under the ms1 `witnesses` member, as the
  brief names it (the spec's recommendation A).

## 7 · THE NEUTRAL MACHINE (curl of the public check runs, no token; recorded in LEDGER.jsonl)

- Each earlier push of this branch (27d0948, d277ea8, cf718fb) had both legs `cancelled` by the next push.
  8c7911b's legs were in progress when this file was written.
- **Expected on every leg until BASE exists:** one NEW RED, `WITNESS ‹mkp24› · carries a BASE file (B6)`. It is the member's
  own red for a unit dir with no BASE, which row 1216 K-F4 orders. So the member does not run `witness_mkp24.mjs` on the
  neutral machine until mdtl is on main and BASE is written.
- Every other keeper-family member runs as before. The member runs the C0-carrying mlv1, mlv2, mlv3 and mrv against their own
  BASEs, and their BOUND ids are dropped by `judgeLast`.
- **3898668, read 2026-11-21 by curl (run of check runs 136641868209 node 24 and 136641867873 node 22): both legs RED.**
  - node 24 RED, one NEW RED: `WITNESS ‹mkp24› · carries a BASE file (B6)`, the expected one (FK1). The payload read
    `"pass":255,"fail":1`.
  - node 22 RED, two NEW REDs: the same B6 red, and **`WITNESS ‹mlv3› · GREEN at head against its BASE`**. The payload read
    `"pass":255,"fail":2`. **The first CODED keeper-family red on the neutral machine.** Its cause lines, as the annotation
    printed them:
    `cause · T1 IDLE · spool drained, nothing in flight: …` ·
    `cause · T1 IDLE · RESPAWN-LATE · the worker logged RETIRING but no new boot answered by the bound: the respawn came late` ·
    `cause · LIVE-SAFE · the real :4112 …` · `cause · LIVE-SAFE · BEHAVIOUR-RED · a behaviour clause above is red`.
  - **What it reads (for K-F11, ruled by the architect, not here):**
    - T1's retire DECISION came within the bound: the RETIRING line was there. The respawned worker's boot did not answer
      inside T1's single bound. That is the process / clock link of the chain, not the filesystem event.
    - LIVE-SAFE is a cascade of T1 (BEHAVIOUR-RED), not a held port.
    - No WITHHELD: the multi-word ids were read whole (K-F10).
    - mlv3 is untouched in its waits by this unit, and the same tree's node 24 leg read mlv3 GREEN. **No re-run is made for
      green** (row 1213 (3)).
- A tip's own verdict cannot be in its own file. The verdict of the last push is read after it, and named in the seat's final
  message and the ledger.

## 8 · THE THIRD READABLE RED, NAMED (row 1215 (4))

land/mdtl 6178e62, node 24, check run 136602973575 (job log read by curl). mlv2's ONLY red clause was LAST:
- the cause line read `LAST · (no header claim for this id in its source)`;
- no WITHHELD;
- the same job's `WITNESS ‹mlv1›` printed `PORT_HELD … held 2 ms after the kill · bound 387 ms`.

**What LAST means in mlv2, at the cut** (`git show 25f13f2:ci/mlv2/witness_mlv2.mjs`, byte-identical at 6178e62): the clause
opens at `:261`. It has two red branches:
- **`:263-267`** reads the process table. On win32 that is `powershell.exe … Get-CimInstance Win32_Process`, with
  `timeout: BOOT0 + BOUND` (`:265`). A throw, including that timeout, is `process table unreadable: …`. **Under C0 it carries
  `TABLE-UNREADABLE`.**
- **`:268-269`** finds a node process whose command line names the witness's temp dir: `N survivor(s)`. **Under C0 it carries
  `SURVIVOR`.**

**Why the claim reads NO_CLAIM.** LAST has no claim line of its own. Its header names it only inside the id list
`//   XML · BOUND · LAST  as in every unit of this queue.` (`:19`), and K-F10's grammar keys that line by its first id (`XML`).

**The reading: not proven.** The bound on the powershell call is the measured `BOOT0 + BOUND`, a sub-second figure on that leg
by mlv1's line. A cold powershell start can exceed it, so `TABLE-UNREADABLE` is the likelier code. No public byte decides it.
The first LAST red after this unit lands prints the code. **No wait is changed here (K-F11).**

## 9 · FORKS (each for the architect; none is decided here)

- **FK1 · BASE.** No BASE until a message names the main that holds mdtl (row 1216 K-F4). Until then every leg of this branch
  reds `WITNESS ‹mkp24› · carries a BASE file (B6)`, and the unit witness is unjudged by the neutral machine.
- **FK2 · mlv2/mlv3 LAST's process-table bound.** `timeout: BOOT0 + BOUND` (`ci/mlv2/witness_mlv2.mjs:265`,
  `ci/mlv3/witness_mlv3.mjs` LAST) is a wait that K-F11 forbids this unit to change. mlv1 and mrv read the table unbounded.
  Its own row, if the next LAST red reads `TABLE-UNREADABLE`.
- **FK3 · the header id list.** `XML · BOUND · LAST  <claim>` gives LAST (and BOUND) no claim of its own. Reading the id list
  as a shared claim is a grammar beyond the multi-word id of K-F10. It is not built, and it would be a second edit of the module.
- **FK4 · the spec's p-watch premise** (section 6, D1). The keeper's own poll floor is not the only path without an event:
  thalamus calls `check()` as each request ends. Whether T1's neutral reds are `RETIRE-LATE` or `RESPAWN-LATE` is still the
  next T1 red's code (K-F11).
- **FK5 · wall time.** The neutral head step took 40-50 min of the job's 60 (job 136602973575: 22:15:53 → 23:05:20). Measured
  2026-11-20, this witness ran in 12 s on linux, and the family's own witnesses ran 4-6 s each on the runner. Once BASE exists
  this witness joins the witnesses member. The mutants are not run by the member.
- **FK6 · `.claude/settings.json`** is not carried on this branch (the brief): the build was cut from land/mdtl, not from
  claude/mkp24b-queue.

## 10 · THE SECOND REPLAY CASE: C4 CENSUS (the architect's message, 21 Nov 2026, under row 1216 K-F10)

**The ruling.** land/mdet 72c9add (runs 136698084278 / 136698084564) read
`cause: C4 · (no header claim for this id in its source) ; WITHHELD · …`. The clause id is the two-word `C4 CENSUS`
(`ci/mdet/witness_mdet.mjs` at claude/mdet-build ee23f4a). The ruling: a red at `C4 CENSUS` must print C4 CENSUS's own header
claim and no WITHHELD.

**Measured on ee23f4a's bytes (2026-11-21).**
- With step 1's edit, `C4 CENSUS` was already matched whole: no WITHHELD, since `"C4 CENSUS"` is a quoted literal (`CLAUSES`, `:47`).
- But it still read NO_CLAIM, for a second reason. mdet's header opens its BOUND section at ONE space
  (`// BOUND (not a both-ways clause)…`, `:30`), and the claim rule takes BOUND's indent. So every clause claim at three spaces
  (`//   C4 CENSUS   · …`, `:26`) was skipped.

**The fix, still the ONE edit of `scripts/witness_cause.mjs`.** A multi-word header id at another indent than BOUND's is a
claim when that id is a quoted clause literal of the source (`quotedIds`, factored out of `idsInSource`). Nothing else
moves: mlv1, mlv2, mlv3, mrv and mdtl read `LAST` exactly as before.

**The replay in K7.** The fixture is mdet ee23f4a's header lines 1-39, its first import and its `CLAUSES` line, verbatim; the
member never fetches, and `ci/mdet` is not on this branch.
- At the cut it reproduces the neutral leg: `C4 · (no header claim …)` plus WITHHELD (K7 RED).
- At the build it gives `C4 CENSUS · the planted tree's census, every row but the mdet_ plants, equals the table between …`,
  no WITHHELD, and the claim rebuilds through `verifyCause`.

**Measured 2026-11-21.**
- The witness both ways: build `GREEN MKP24 … · 10 clause(s)`, cut `RED MKP24 · K1 RETIRE-LATE, K2 NO-GAP, K3 PORT, K4 LOST, K5 UNPLANTED, K6 NO-LEAK, K7 REPLAY, K8 MRV, BOUND`.
- New mutant K7b-m (the claim read only at BOUND's indent) is RED by K7.
- `witness_cause selftest: 17 passed, 0 failed` and `ci_verdict selftest: 34 passed, 0 failed`, unchanged (2026-11-21).
- mdtl's chain stays `GREEN MDTL … · 8 clause(s)`.
- The hermetic profile reads `organism_test: 149 passed, 6 failed · … LIVE 124`, with the same assert set as the cut (2026-11-21).
- `node scripts/models.mjs check` exits 0.

## 11 · THE MERGE WITH MAIN AND THE BASE (the architect, by the runner: forks rows 1216 K-F4 / 1232 (2) / 1233 (1), 21 Nov 2026)

**The merge.**
- `git fetch origin main` gave `git rev-parse FETCH_HEAD` = `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`.
- `git merge --no-edit FETCH_HEAD` made merge commit **1492987** (parents 11b2c10 and 7bf008b). It is a merge, not a rebase,
  and nothing was force-pushed.
- **No file conflicted.** Main moved `scripts/organism_test.mjs`, `package.json`, `scripts/ci_verdict.mjs` and
  `.github/workflows/suite.yml`, and each merged automatically beside this unit's lines. Every landed line of mdtl, mcrk, mherm,
  mdet, mdtl2 and mclk is kept as main has it.
- `scripts/red_cause.mjs` and `scripts/ci_verdict.mjs` are byte-identical to main.

**The BASE.** `ci/mkp24/BASE` = `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` (commit 6b5c0ae). It is the main the branch now
carries, and mdtl is on it (row 1216 K-F4). The interim base of section 1 is retired.

**Re-run on the merged tree (2026-11-21).**
- The witness against BASE = main:
  - at the merged head it reads `GREEN MKP24 … · 10 clause(s)`, BOUND with 13 files differing and none beyond the named;
  - at main itself it reads `RED MKP24 · K1 RETIRE-LATE, K2 NO-GAP, K3 PORT, K4 LOST, K5 UNPLANTED, K6 NO-LEAK, K7 REPLAY, K8 MRV, BOUND`.
- `node ci/mkp24/run_mutants_mkp24.mjs` (the default trees, HEAD and ci/mkp24/BASE) exits 0 in 193 s:
  `run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`.
- `witness_cause selftest: 17 passed, 0 failed` (2026-11-21), and `node scripts/models.mjs check` exits 0.
- The hermetic profile at the merged tip reads `organism_test: 150 passed, 8 failed · … LIVE 125` (2026-11-21).
  - The two fails beyond the cut's six are `SUITE MEMBER · ci_verdict selftest` and `SUITE MEMBER · red_cause selftest`
    (mdtl2's).
  - In this container they need the `acorn` parser of `node_modules`, and there is no `npm ci` here.
  - Main 7bf008b's own tree fails them the same way here (measured 2026-11-21, on both trees): `ci_verdict selftest: 36 passed, 2 failed`
    and (2026-11-21) `red_cause selftest: 14 passed, 10 failed`. So they are not of this merge.
  - The neutral machine, which runs `npm ci`, reads them green (below).
- mclk: no clause of this witness derives a day from the clock.

**The two neutral legs of 6b5c0ae** (run 44877861591, read by curl of the public API, 2026-11-21):
- **node 24, check run 136766445352: GREEN.**
  `B1_VERDICT {"v":"GREEN", … "head":"6b5c0ae…","base":"7bf008b…", "new":[], "pass":271,"fail":0 …}`.
  `WITNESS ‹mkp24› · GREEN at head against its BASE` (ran in 27.7 s).
- **node 22, check run 136766445185: CANCELLED by the job's own 60-minute limit**, not by a red.
  - The annotation reads `The job has exceeded the maximum execution time of 1h0m0s`.
  - The head step `npm test · hermetic · head` ended **success** (06:58:07 → 07:53:47). In its log every keeper-family
    witness is GREEN: `WITNESS ‹mkp24›` GREEN in 33.4 s, and mlv1, mlv2, mlv3 and mrv GREEN.
  - The merge-base step was cut at the limit, so no verdict was written.
  - For scale: main 7bf008b's own node 22 leg took 06:40:55 → 07:30:05 (136760736371), and its node 24 leg read failure
    (136760736638).
  - **This is FK5 (wall time) made real.** No re-run for green is made (row 1213 (3)). The architect decides whether the
    cancelled leg is read as a red, as no verdict, or as a fresh neutral run.

CHECKPOINT · RESUMED at 2026-11-21 · merge 1492987 (main 7bf008b) · BASE 7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f · legs of 6b5c0ae: node 24 136766445352 GREEN, node 22 136766445185 CANCELLED at the 60-minute job limit after a GREEN head step · resume from: the architect's reading of the node 22 leg

## 12 · THE MERGE WITH MAIN 84cbc03 (RUNNER M under the architect's row 1304 (3), 22 Nov 2026)

**The merge.** `git merge --no-edit origin/main` (84cbc03126eddb85c7d5cf54b51610068800315c) gave merge commit **3d4007a**.
- **Conflicted:** `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs` and `ci/mlv3/witness_mlv3.mjs`, the three keeper
  witnesses that unit mt1's clock repair re-cut (`retireThenBoot`).
- **How each was resolved:** take MAIN'S BYTES WHOLE (`git checkout --theirs`), then re-apply only what this unit needs on top:
  - the family `CAUSES` literal, still byte-identical with `ci/mrv` (K5);
  - the `CAUSE <ID> <CODE>` print in `clause()`;
  - a `code:` beside each red `why`.
- `retireThenBoot`'s two reds carry `RETIRE-LATE` (no RETIRING line by the bound) and `RESPAWN-FAIL` (the respawn did not
  come up). No wait, bound, clause id, claim or printed reason of main's re-cut changed.
- `scripts/organism_test.mjs` auto-merged with main's lines. No other file conflicted.

**Not empty.** `git diff --stat 84cbc03 HEAD` reads `13 files changed`. BASE = `84cbc03126eddb85c7d5cf54b51610068800315c`.

**Measured 2026-11-22 (this container).**
- The witness both ways:
  - at the merged head against BASE: `GREEN MKP24 … · 10 clause(s)` (BOUND: 13 differ, none beyond the named);
  - at main itself: `RED MKP24 · K1 RETIRE-LATE, K2 NO-GAP, K3 PORT, K4 LOST, K5 UNPLANTED, K6 NO-LEAK, K7 REPLAY, K8 MRV, BOUND`.
- Mutants, default trees and an unchanged control: `run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN` (189 s).
- The suite's WITNESSES member, `GITHUB_ACTIONS=true GITHUB_WORKSPACE=<repo> ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`,
  exit 2 in 1172 s, measured 2026-11-22: `witnesses · 64 unit(s)`, headline `organism_test: 103 passed, 22 failed` (2026-11-22).
  - **42 of 64 units read `GREEN at head against its BASE`.** Among them are `WITNESS ‹mkp24›` (16.8 s), `‹mlv0›`, `‹mlv1›`,
    `‹mlv2›` and `‹mlv3›`.
  - **9 red as `its BASE is in the clone`:** mf4, mjud, mpast, mpm, mr3, mrf, mrj, mrt and mrv. This clone does not hold
    their BASE commits, and the member never fetches, so those witnesses never ran here, mrv among them.
  - **13 red at head:** mclk, mcov, mdn2, mdone, mdtl2, mf2, mgat, mlaw, mmeter, mprk, mrung, mtail and mxw. Several read
    `SETUP`, or clauses that need `node_modules`, which this container has no `npm ci` for.
  - Each of the 13 belongs to another unit, and none names a keeper-family file. Their reading on main is the neutral
    machine's, not this container's.
- `witness_cause selftest: 17 passed, 0 failed` (2026-11-22). mlv1, mlv2 and mlv3 unplanted read GREEN with no CAUSE line.

CHECKPOINT · 2026-11-22 · tip (this commit, on 6707dde) · merge 3d4007a with main 84cbc03 · BASE 84cbc03126eddb85c7d5cf54b51610068800315c · witness GREEN at head / RED at main · mutants 11 of 11, control GREEN · WITNESSES 42 of 64 GREEN in this container (mkp24 GREEN; 9 BASE-not-in-clone, 13 others red at head) · pushed [skip ci]

