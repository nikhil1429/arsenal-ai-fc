# ms1 — PROOF (build seat, 18 Nov 2026)

Unit **ms1** · forks rows 1066 / 1064 (3) / 1065 (4) · branch `claude/ms1-build`, cut from `origin/main` @ **`3e3ce63`**
(fetched 18 Nov 2026 UTC: `git fetch origin main`, the branch made from FETCH_HEAD in a fresh clone, because the session's
own tree holds a hook-written state file this seat never touches). Spec: `ci/ms1/MS1_SPEC.md` on `claude/ms1-spec`.
Where the spec and the ruling differ, the ruling won. Each difference is in §7.
Every number below is a measurement made on 18 Nov 2026 with the command named. The Linux figures come from this
container (node v22). The neutral machine's figures are in §5.

## 1. What landed in the build (named files only)

| File | What | Where |
|---|---|---|
| `scripts/organism_test.mjs` | the `witnesses` member (B1, B2, B4, B5, B6, F1 A, F2 A, F3 A, F5 B, F11 A) and its `MODES` key | `:2822` `witnesses()` · `:2930` `MODES` |
| `scripts/land.mjs` | step 5 `NO-CI-DIR` (F7 A) · `WITNESS_DIR = "ci/"` (F10 A), so the names gate covers every new `ci/` file | `:196-204` · `:44` |
| `scripts/ci_verdict.mjs` | `keyOf` keeps the text inside `‹ ›` unfolded (F4 A), with its selftest planted both ways | `:48` |
| `ci/ms1/` | `witness_ms1.mjs`, `run_mutants_ms1.mjs`, `BASE`, this file, `LEDGER.jsonl` | — |
| `ci/<unit>/BASE` × 21 | one 40-hex line each (§2) | — |
| `ci/<unit>/witness_<unit>.mjs` + imported siblings × 21 | carried from each unit's build branch, **bytes unchanged** except the two ADDED edits (§4) | — |
| F9 B | `ci/mcr/` (two units) is split into `ci/mjd3/witness_mjd3.mjs` and `ci/mjd4/witness_mjd4.mjs` | — |

The suite workflow is not edited (F3 A: the member reads `GITHUB_ACTIONS`, which the runner sets itself), and neither is
`scripts/keeper.mjs` (F5 B: unit mlj's door is already on main, `scripts/keeper.mjs:85-92`).

## 2. §0.2 re-measured at the cut `3e3ce63`

Units landed on main's first-parent history since the spec's base `4d166d3`
(`git log --first-parent --oneline 4d166d3..origin/main`): **mlv2** (`5e43987`), **mlv3** (`90f55dd`), **mjd6**
(`b1fc984`), **mday** (`9f6f9ab` + its settings line `cb30003`), **mdn2** (`d0c8f06`) and **mlj** (`3e3ce63`). The
other two commits are not units: the deck rules (`40347a6`) and a groundsman state push (`7c3c279`).
mday's ci dir is already on main (`ci/mday/`, bytes equal to `claude/mday-build`); the other five live only on their
build branches.

BASE = the sha the unit's PROOF names (`git show origin/<branch>:<proof> | grep -i base`). "Written" = the sha in
`ci/<unit>/BASE` on this branch (F6 B, §3).

| Unit | Witness carried from | PROOF BASE | on main? | BASE written |
|---|---|---|---|---|
| mdone | `claude/mdone-build` `781894f` | `4f86d59` | **no** | `669200d` (F6 B) |
| mlv1 | `claude/mlv1-build` `b1ef02e` | `1631e22` | **no** | `009f52e` (F6 B) |
| mlv0 | `claude/mlv0-build` `6532410` | `15edfec` | yes | `15edfec` |
| mland | `claude/mland-build` `d76f9bd` | `38dd20a` | **no** | `7fde711` (F6 B) |
| mgrd | `claude/mgrd-build` `8998e45` | `15edfec` | yes | `15edfec` |
| mf2 | `claude/mf2-build` `3e40630` | `15edfec` | yes | `15edfec` |
| mjd5 | `claude/mjd5-build` `471311a` | `15edfec` | yes | `15edfec` |
| mjd3 | `claude/mcr-mjd3-build` `f9149f8` (`ci/mcr/`) | `074ead9` | yes | `074ead9` |
| mjd4 | `claude/mcr-mjd4-build` `dbc9717` (`ci/mcr/`) | `3a73782` | yes | `3a73782` |
| mcr2 | `claude/mcr2-crlf-selftests` `7d6d529` | `d0c8c96` | yes | `d0c8c96` |
| mtail | `claude/mtail-judge-tail` `83a01ea` (+ sides, w_preload, gates, ledger) | `d0c8c96` | yes | `d0c8c96` |
| mpast | `claude/mpast-full-time` `137e77d` | `c56b0a8` | yes | `c56b0a8` |
| mjud | `claude/judge-budget-timeouts-g7p0qg` `3c3649d` (+ sides, w_drive, w_preload, ledger) | `5767e21` | yes | `5767e21` |
| mf4 | `claude/mf4-study-canary-ewyyct` `289f630` (+ clock, step) | `5767e21` | yes | `5767e21` |
| mpm | `claude/mpm-close-evidence` `0492a51` | `5767e21` | yes | `5767e21` |
| **mlv2** (new) | `claude/mlv2-build` `26d3f12` | `cbd4387` (`ci/mlv2/PROOF.md:7`) | **no** | `4d166d3` (F6 B) |
| **mlv3** (new) | `claude/mlv3-build` `6b08151` | `78dc084` (`ci/mlv3/PROOF.md:8`) | **no** | `40347a6` (F6 B) |
| **mjd6** (new) | `claude/mjd6-build` `e125541` | `4d166d3` (`ci/mjd6/PROOF.md:3`) | yes | `4d166d3` |
| **mday** (new) | main (`ci/mday/`) = `claude/mday-build` `00bd701` | `669200d` (`ci/mday/PROOF.md:9`) | yes | `669200d` |
| **mdn2** (new) | `claude/mdn2-build` `fe7e618` | `4d166d3` (`ci/mdn2/PROOF.md:8`) | yes | `4d166d3` |
| **mlj** (new) | `claude/mlj-build` `9ae56d7` | `4d166d3` (`ci/mlj/PROOF.md:7`) | yes | `4d166d3` |
| **ms1** | this branch | `3e3ce63` (the cut) | yes | `3e3ce63` |

**Five** BASEs are on no main commit, not the three the spec measured: mlv2's and mlv3's are stacked seat builds too.

## 3. F6 B: each off-main BASE re-taken on a main ancestor

The candidate is the first-parent main commit just before the unit's own land commit
(`git log --first-parent origin/main | grep "unit <u> ("`, then its `^1`). The witness ran at the candidate both ways
(`--org cand --base-org cand`) and was compared with its leg at the PROOF BASE. Command: scratchpad `measure.sh`
(`LIST=list_f6`), its body in `LEDGER.jsonl`, act `measure`.

| Unit | candidate | RED at candidate (base leg) | RED at PROOF BASE (base leg) | same behavioural clauses? | head vs candidate |
|---|---|---|---|---|---|
| mdone | `669200d` | D-ORPH, D-UNREAD, D-METER, D-RULE, D-REACH, D-NOCONS, D-LINE, D-WRITE, D-MORNING, D-CARD, BOUND | the same eleven | **yes → written** | `RED MDONE · BOUND` |
| mlv1 | `009f52e` | I1 IDLE, I2 MID, I3 JUDGE | the same | **yes → written** | `RED MLV1 · BOUND` |
| mland | `7fde711` | V1–V8, CR1–CR4, L2, L3, L4, Q4, S8, BOUND | the same | **yes → written** | `RED MLAND · BOUND` |
| mlv2 | `4d166d3` | C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE | the same | **yes → written** | `RED MLV2 · BOUND` |
| mlv3 | `40347a6` | T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE | the same | **yes → written** | `RED MLV3 · BOUND` |

No candidate failed, so none is named-and-unwritten.

## 4. The two ADDED edits, each re-judged RED at its BASE

| Witness | Edit | Why (measured) | head leg after | RED at its PROOF BASE after | RED at the written BASE after |
|---|---|---|---|---|---|
| `ci/mland/witness_mland.mjs:78` (row 1064 (3)) | the planted `scripts/keeper.mjs` stub gains `JUDGE_PORT` and `judgeHeld` (answers free) | before: head leg `RED MLAND · V1, V2, V3, V4, V5, V6, V7, V8, L2, L3, Q4, S8, BOUND`, because land.mjs's judge gate (unit mlj) read the stub and refused `JUDGE-UNREADABLE` | `RED MLAND · BOUND` | `38dd20a`: `RED MLAND · V1 … S8, BOUND` (eighteen) | `7fde711`: the same |
| `ci/mdone/witness_mdone.mjs:113-114` (row 1065 (4)) | D-RULE's plant adds the entry to an existing `CLEAN_PLANTS` export (unit mdn2), and declares the export only when there is none | before: head leg `RED MDONE · D-RULE, BOUND` (a duplicate `export const CLEAN_PLANTS`, a SyntaxError in the planted lawpack) | `RED MDONE · BOUND` | `4f86d59`: `RED MDONE · D-ORPH … D-CARD, BOUND` (eleven) | `669200d`: the same |

## 5. The member: every witness at head against its BASE

### 5.1 Linux, this container, by hand (the member's own recipe, `measure.sh`, legs run one after another)

| Unit | head leg (`--org 3e3ce63 --base-org BASE`) · seconds | base leg (`--org BASE --base-org BASE`) |
|---|---|---|
| mdone | `RED MDONE · BOUND` · 82.4 (with the edit) | RED (§4) |
| mlv1 | `RED MLV1 · BOUND` · 1.7 | `I1 IDLE, I2 MID, I3 JUDGE` |
| mlv0 | `RED MLV0 · BOUND` · 0.3 | `S1 CLOSURE, S2 K6, S3 UNVERIFIED, M2 BOOT, M4 JUDGE` |
| mland | `RED MLAND · BOUND` · 27.8 (with the edit) | RED (§4) |
| mgrd | `RED MGRD · BOUND` · 5.7 | `G1, G2, G3, BOUND` |
| mf2 | **`RED MF2 · F2 F4 BOUND`** · 248.2 | (spec: `F1`) |
| mjd5 | `RED MJD5 · BOUND` · 1.8 | `R1 R3 R2` |
| mjd3 | **`RED MJD3 · J4 BOUND`** · 14.5 | `J1 J2 J3 J4` |
| mjd4 | `RED MJD4 · BOUND` · 2.0 | `I1 I3 I4 I5` |
| mcr2 | `RED MCR2 · BOUND` · 2.7 | `C-context C-fuelboard C-learnstate BOUND` |
| mtail | **`RED MTAIL · T3 AUTH · BOUND`** · 20.5 | `T1 F-B · T2 F-C · T3 AUTH · T4 F1 · BOUND` |
| mpast | `RED MPAST · BOUND` · 8.8 | `MP1 MP4 MP6 MP3 MP2 MP5 MP7 MB2 MB4 BOUND` |
| mjud | **`RED MJUD · M3 CENSUS · M5 F3-CLIP · M6 MJD2 · BOUND`** · 1.0 | `M1 SITTING · M2 DUGOUT · M3 CENSUS · M4 F3-EAT · …` |
| mf4 | `RED MF4 · W6 BOUND` · 2.3 | `W1 CANARY · W5 STREAK · W4 SELFTEST` |
| mpm | `RED MPM · BOUND` · 1.0 | `Q1 Q3 BOUND` |
| mlv2 | `RED MLV2 · BOUND` · 2.5 | §3 |
| mlv3 | `RED MLV3 · BOUND` · 1.9 | §3 |
| mjd6 | `RED MJD6 · BOUND` · 1.8 | `S1 S3 S2` |
| mday | `RED MDAY · BOUND` · 10.7 | `F4, W1.1, W6.1, … W10` (22 ids) |
| mdn2 | `RED MDN2 · BOUND` · 26.0 | `N-FIELD, N-REACH, N-CLEAN, N-SUITE, BOUND` |
| mlj | `RED MLJ · BOUND` · 11.4 | `J1, J2, J3, J4, J5, K1, BOUND` |

Under F1 A the member drops every BOUND id. It reads them from the witness's own source: `"BOUND"`, plus every literal
`"<ID> BOUND"`, which gives mf4's `W6 BOUND`. Read that way, mjd3's `J4 BOUND` is two ids, and `J4` stays.

### 5.2 Every RED member expected on the neutral machine (F11 A: a RED member, named, not fixed)

| Member | Clause(s) beyond BOUND | What overtook it (measured, not ruled) |
|---|---|---|
| `WITNESS ‹mjd3› · GREEN at head against its BASE` | **J4** (round 1 exits 9 after 2 reps) | the judge round's batch logic re-cut after it (mjd4, mjd5, mlv0) |
| `WITNESS ‹mtail› · GREEN at head against its BASE` | **T3 AUTH** (`depcruise no-circular` vs its BASE's count) | cycles added since, by any unit |
| `WITNESS ‹mjud› · GREEN at head against its BASE` | **M3 CENSUS · M5 F3-CLIP · M6 MJD2** | mtail's `fits()`/`spawnMs()` rewrite of `postmatch.mjs:848-852`; mjd3–5's batch rulings |
| `WITNESS ‹mf2› · GREEN at head against its BASE` | **F2 · F4** (new since the spec's §0.3) | F2 names the members judged only by the build: mdn2's `WHAT IS LEFT` asserts (`organism_test.mjs` `done()`). F4 counts members too (base fewer than build), and its first difference is a sitting assert |

The neutral machine's verdict on this branch is RED on exactly these members (§5.3, push `f98e914`, both legs).

### 5.3 The neutral machine (suite workflow, `windows-latest`, node 22 and 24)

Read with curl, no token: `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`, the check run's
`/annotations`, and its job log (`/actions/jobs/<id>/logs`, which answers anonymously for this public repo).

| Push | Run | node 22 | node 24 | New reds (both legs) |
|---|---|---|---|---|
| `f052188` | `44413149704` | cancelled (superseded) | cancelled | — |
| `3ed6c9c` | `44413918338` | `135189162294` failure | `135189162604` failure | ‹mf2› ‹mjd3› ‹mjud› ‹mtail› + **‹ms1› B4** (its own header comment spelled a literal bind; fixed in `f98e914`) |
| `f98e914` | `44417920009` | `135202961143` failure | `135202961645` failure | **exactly ‹mf2› ‹mjd3› ‹mjud› ‹mtail›** (`B1_VERDICT … RED — 4 member(s) red that are not red at the merge base · 1 base red`) |

The member's seconds per unit on the neutral machine, push `f98e914`, read from the assert lines of the job logs. The
workflow prints assert lines only, so each judged assert carries its seconds (`keyOf` folds them):

| Unit | node 22 s | node 24 s | | Unit | node 22 s | node 24 s |
|---|---|---|---|---|---|---|
| mcr2 | 8.0 | 10.0 | | mland | 197.1 | 196.1 |
| mday | 22.5 | 18.4 | | mlj | 61.8 | 59.6 |
| mdn2 | 39.0 | 32.4 | | mlv0 | 2.6 | 3.1 |
| mdone | 99.9 | 78.9 | | mlv1 | 4.9 | 4.2 |
| **mf2** (RED F2 F4) | 682.7 | 586.9 | | mlv2 | 5.7 | 4.6 |
| mf4 | 7.6 | 8.2 | | mlv3 | 5.3 | 5.5 |
| mgrd | 35.7 | 36.3 | | mpast | 20.8 | 20.1 |
| **mjd3** (RED J4) | 25.3 | 20.7 | | mpm | 4.7 | 4.8 |
| mjd4 | 52.0 | 62.0 | | ms1 | 61.4 | 60.6 |
| mjd5 | 22.8 | 26.8 | | **mtail** (RED T3 AUTH; node 22 also T2 F-C) | 26.5 | 30.0 |
| mjd6 | 23.7 | 26.8 | | **total, 22 units** | **1420.6** | **1316.7** |
| **mjud** (RED M3 M5 M6) | 3.8 | 4.7 | | | | |

The member's own Linux run (`GITHUB_ACTIONS=true ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs
witnesses`, this container) took 472.6 s, RED on the same four, ‹ms1› GREEN.
**ms1's own witness is GREEN on the Windows runner**, W-B1.2 LF included. That answers the spec's N3: the private-index
checkout with `core.autocrlf=false` + `core.eol=lf` gives LF bytes there.

## 6. Witness, mutants, selftests, models

The witness, both ways, against an LF `git archive` of the cut:

```
node ci/ms1/witness_ms1.mjs --org . --base-org <git archive 3e3ce63>
GREEN MS1 every landed witness rides the suite · 27 clause(s)                     (exit 0)
node ci/ms1/witness_ms1.mjs --org <git archive 3e3ce63> --base-org <same>
RED MS1 · B1.1 BASE, B1.2 LF, B1.3 NOCALC, B2.1 FULL, B2.2 LAPTOP, B2.3 NEUTRAL, B3.1 CARRIED, B3.2 NOCI, B3.5 GATE,
  B4.1 LISTEN, B4.2 DERIVED, B4.3 ADMIT, B4.4 NOSPAWN, B4.5 DOOR, B5.1 SECONDS, B5.2 NOFETCH, B6.1 NOBASE, B6.2 SHORT,
  B6.3 SKIPWINS, F1 BOUND, F1W BOUNDID, F11 BEHAVE, V1 KEYOF, BOUND                (exit 1)
```

B3.3 CIDIR and B3.4 BEFORE are guards (GREEN on both). BOUND is RED at the base by construction (no named file differs).

The mutants:

```
node ci/ms1/run_mutants_ms1.mjs --org . --base-org <git archive 3e3ce63>
run_mutants: 25 of 25 mutant(s) RED by the clause that names them · control GREEN
```

The touched selftest, each headline before and after (18 Nov 2026):

```
node scripts/ci_verdict.mjs selftest   at 3e3ce63:  ci_verdict selftest: 19 passed, 0 failed
node scripts/ci_verdict.mjs selftest   at build:    ci_verdict selftest: 21 passed, 0 failed
```

Its new checks, planted both ways: the build's `keyOf` keeps `‹mlv0›` and `‹mlv1›` apart, while the cut's folds them
(`keyOf("WITNESS ‹mlv0› · x") === keyOf("WITNESS ‹mlv1› · x")` is true at `3e3ce63`). The mutant `V1 KEYOF` restores
the fold and turns the witness RED.

`land.mjs` and `organism_test.mjs` have no selftest. Below, the suite, measured as the brief orders (no
`GITHUB_ACTIONS` here, so the member prints its skip line):

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   (build, 18 Nov 2026)
  SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2): a witness may bind ports
organism_test: 142 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
```

The one red is `EVERY organ with a selftest is wired into a suite` (orphaned: deck_lint, home_pin, probe, study_scope).
It is red at the cut too, so it is a base red, not ms1's.

```
node scripts/models.mjs check   → models check: … literal model names outside models.mjs: 0 …   exit 0
```

F5 B, measured: with `ARSENAL_JUDGE_PORT=45555` set, `scripts/keeper.mjs` copied under the temp dir reads `JUDGE_PORT`
**45555**. The same bytes in the repo tree read **4118**. The member builds every `--org` tree under `os.tmpdir()`, so
the door it sets (an OS-picked free port) is honoured for mlv0 and mlv1. W-B4.5 proves the planted witness's env carries
it.

## 7. Where the build differs from the spec (the ruling wins), and FORKS

**Differences from the spec, each by the ruling or a measurement:**
- **F1 A**, not "A with C": the member judges the LAST line without BOUND. No `LANDED` sha (that is unit ms2).
- **F11 A**, not the spec's B: the four units of §5.2 are RED members and stay RED. ms1 does not fix them.
- **F5 B** rides unit mlj's door. `keeper.mjs` is not edited.
- **F6 B** covers **five** units, not three (mlv2 and mlv3 landed after the spec).
- **NO-CI-DIR binds from the landing that puts the first `ci/<unit>/BASE` on main** (`land.mjs:198`), i.e. from ms1's
  landing on. Without this condition, the landed mland and mlj witnesses would go RED: their planted origins carry no ci
  dir, and they are not among the two witnesses ms1 may edit. W-B3.4 holds that guard.
- **B4**: the member sets **every** env door an organ exports (today `ARSENAL_JUDGE_PORT` and `ARSENAL_SITTING_PORT`) to
  an OS-picked port for every witness, not only for mlv0 and mlv1. It refuses a literal `listen(<non-zero>` or a
  door-less exported `*PORT` named by a witness.
- **The witness runs from a COPY of its dir under the temp dir**, as the spec's own measurement did, not with cwd = the
  repo root. So a witness's `out/` writes never touch the checkout.
- **The bound** on each witness spawn is the job's own `timeout-minutes` (read from `.github/workflows/suite.yml:62` at
  run time), shared across all witnesses. Nothing is typed.

**FORKS (for the architect):**
1. `ci/mday/` on main already carries `PROOF.md`, `LEDGER.jsonl` and `run_mutants_mday.mjs` beyond F8 A's set. Left
   as is: nothing is deleted.
2. **mf2 is a fourth behavioural red** at the cut (F2, F4), absent from the spec's §0.3 at `4d166d3`. It is overtaken
   by mdn2's `done()` members. F11 A makes it a RED member. Whether it is a regression or a superseded ruling is not a
   seat's call.
3. Once ms1 lands, the merge-base leg of every later push runs the member too (`suite.yml:121-143`), so the member's
   seconds are paid twice per leg. mf2 alone is minutes. The 60-minute job is the shared bound.
4. B3.1 inside the member: the witness runs from a copy with no repository, so main ancestry is NAMED unreachable
   there. It is checked only when the witness runs from the repo (this seat, `B3.1 · 21 units carried, every BASE a
   main commit`).
5. The CRLF question (spec N3): W-B1.2 measures it on the runner. On Linux it is measured by the plant's own
   `core.eol=crlf` and the `B1.2 LF` mutant.
6. The coverage red (orphaned deck_lint, home_pin, probe, study_scope) is a base red on main. Not this unit's.
7. **The member's cost on the neutral machine** (§5.3): 1316.7 s (node 24) to 1420.6 s (node 22) for one tree, mf2
   nearly half of it. Once ms1 lands, the merge-base leg runs the member too, so a leg pays it twice inside the job's
   60-minute `timeout-minutes` (`suite.yml:62`), with the rest of the suite on top. The architect's call: F12-style
   (mf2 off the member, the base leg skips it, or the bound raised). This seat edits no workflow and types no budget.
8. **mtail's clause set differs between legs**: node 22 reds `T2 F-C` beside `T3 AUTH`, node 24 only `T3 AUTH`. The
   assert name carries the ids, so the member's key differs by leg; both legs are RED either way.
9. The effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (§8).

## 8. Effort receipt

`node campaign-2026-09/tools/effort_receipt.mjs --fleet ms1b --seat 00 --model claude-opus-5-5`. Its error is in the
final message. Nothing is written under `campaign-2026-09/`.

## 9. FOLLOW-UP · forks row 1107 (1), relayed 19 Nov 2026 (new commits, never force)

**(a) main brought in.** `git merge origin/main` at **`a18c167`** (merge `77c5a55`) was clean: no conflict in
`scripts/organism_test.mjs`, `scripts/land.mjs` or `package.json`. Main's mpool lines in `organism_test.mjs` and its
`package.json` are kept as main has them. `ci/ms1/BASE` is now `a18c167`, the tree the witness is re-judged RED against.

**(b) ci dirs carried** (the witness + BASE, plus mpool's one sibling, all bytes unchanged). mfac-floor is not on main
(`land/mfac-floor` only), so it is not carried.

| Unit | carried from | BASE (from its PROOF) | on main | head leg (`--org 501c5ed`) | base leg |
|---|---|---|---|---|---|
| mday2 | `claude/mday2-build` `9dba1c8` | `3e3ce63` | yes | `RED MDAY2 · BOUND` | `RED MDAY2 · D1, D2, D3, D4, BOUND` |
| mgs | `claude/mgs-build` `ebfbb1e` | `7c3c279` | yes | `GREEN MGS land wait · 7 clause(s)` (it has no BOUND) | `RED MGS · C1, C2, C3, C4, C6, C7` |
| mpool | `claude/mpool-build` `b6cb4a9` (+ `PROOF.md`) | `b1fc984` | yes | `GREEN MPOOL the usage tap · 33 clause(s)` | `RED MPOOL · W1.1 … S` (32 ids) |
| mfac | `claude/mfac-build` `922db41` | `7c3c279` | yes | **`RED MFAC · W3.2 BOUND`** | `RED MFAC · F4 W1.1 … W9` (26 ids) |

`ci/mpool/PROOF.md` rides as a sibling because the witness READS it at run time (`ci/mpool/witness_mpool.mjs:56`: the
settings line it plants). Without it the head leg read `RED MPOOL · WA.i, S`; with it, GREEN. No other carried witness
reads a file beside itself (`grep -n 'readFileSync(join(HERE' ci/*/witness_*.mjs`).

**(c) the ruled-red door.** `KNOWN_RED` in `scripts/organism_test.mjs` holds four entries, one per member. Each has
`row: 1107`, its owner unit and an `until`. The judged assert name is now **stable** (`WITNESS ‹unit› · GREEN at head
against its BASE`), its reds ride the detail (`red beyond BOUND: <ids>`) and the entry matches the detail EXACTLY. The
seconds moved to their own measurement assert `WITNESS ‹unit› · ran in <s> s (B5)`, the line the workflow prints.

| Member | detail ruled | owner |
|---|---|---|
| `WITNESS ‹mjd3› · GREEN at head against its BASE` | `red beyond BOUND: J4` | unit mr3 |
| `WITNESS ‹mtail› · GREEN at head against its BASE` | `red beyond BOUND: T3 AUTH` | unit mrt |
| `WITNESS ‹mjud› · GREEN at head against its BASE` | `red beyond BOUND: M3 CENSUS M5 F3-CLIP M6 MJD2` | unit mrj |
| `WITNESS ‹mf2› · GREEN at head against its BASE` | `red beyond BOUND: F2 F4` | unit mrf |

The list only shrinks: a member that turns green makes its entry STALE (exit 2, `rulingOf`). A new clause red beside the
ruled one is UNRULED. Three new witness clauses plant both on the suite's own door: **R1 RULED**, **R2 STALE**,
**R3 NEWDEATH**. On the laptop the member skips (B2), so no entry ever reads STALE there
(`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`: the only red is main's coverage base red, no STALE).

**(d) witness and mutants, both ways, against an LF `git archive` of `a18c167`:**

```
node ci/ms1/witness_ms1.mjs --org . --base-org <a18c167>       GREEN MS1 every landed witness rides the suite · 30 clause(s)   (exit 0)
node ci/ms1/witness_ms1.mjs --org <a18c167> --base-org <same>   RED MS1 · B1.1 BASE, … R1 RULED, R2 STALE, R3 NEWDEATH, V1 KEYOF, BOUND (exit 1)
node ci/ms1/run_mutants_ms1.mjs --org . --base-org <a18c167>    run_mutants: 28 of 28 mutant(s) RED by the clause that names them · control GREEN
node scripts/ci_verdict.mjs selftest                            ci_verdict selftest: 21 passed, 0 failed   (19 Nov 2026)
node scripts/models.mjs check                                   exit 0
```

The member over the whole repo, Linux, `GITHUB_ACTIONS=true` (before the mpool sibling, 19 Nov 2026): 26 units in
465.4 s · `ruled 4 · UNRULED 2` (mfac, mpool). With the sibling, mpool is GREEN, so the expectation is **ruled 4 ·
UNRULED 1 (mfac) + main's coverage base red**.

**FORKS of the follow-up (for the architect):**
- **F-a · mfac W3.2 is overtaken by ms1 itself.** The clause demands `scripts/land.mjs` byte-identical to mfac's BASE,
  and ms1 edits land.mjs (NO-CI-DIR, F10 A). It is a RED member that row 1107 does not rule, and this seat may not edit
  the mfac witness (two ADDED edits only). Options: a row ruling it into KNOWN_RED; a third ADDED edit (mfac's W3.2
  reads land.mjs against main's land at its land commit); or mfac's BASE re-taken once ms1 has landed.
- **F-b · "zero UNRULED" cannot read zero** while main's own coverage red (`EVERY organ with a selftest is wired into a
  suite`, orphaned deck_lint, home_pin, probe, study_scope) is red. It is UNRULED in the suite's headline, red at
  `a18c167` and not ms1's. The neutral verdict counts it as a base red.
- **F-c · mtail's detail is exact**: when node 22 also reds `T2 F-C` (seen once, push `f98e914`), that leg reads mtail
  UNRULED. That is the door working (a new clause red is news), but a flake can trip it.
- **F-d · mlv1 I2 MID, I3 JUDGE** red once on node 24 (push `3966f61`), GREEN on every other Windows leg: a
  clock-bound landed witness, unruled, outside ms1's edits.

## 10. SECOND FOLLOW-UP · forks row 1112 (mr3 fork F2 C), 19 Nov 2026 (new commits, never force)

**R1 RULED, R2 STALE and R3 NEWDEATH now plant their OWN known-red entry.** `memberRun(…, { knownRed })` writes the
entry into the KNOWN_RED of the organism_test.mjs COPY it plants:
`{ assert: "WITNESS ‹pr› · GREEN at head against its BASE", detail: "red beyond BOUND: J4", row: 9999, owner: "unit plant" }`.
The planted unit is `‹pr›`, so no live entry (row 1107's four) can make or break these clauses. When an owner unit
(mr3 …) retires its entry, R1 to R3 still stand. Measured: the same three clauses over a copy whose live list holds none
of the four row-1107 entries:

```
node ci/ms1/witness_ms1.mjs --org <build, the four live entries removed> --base-org <95b07a6> --only "R1 RULED,R2 STALE,R3 NEWDEATH"
GREEN MS1 every landed witness rides the suite · 4 clause(s)
```

The R1 mutant no longer edits the live list: it breaks the ruled match in `rulingOf`
(`e.assert === f.name` → `` e.assert === `${f.name} ` ``). R2's (`stale = []`) and R3's (the detail check → `true`)
already targeted the mechanism.

**Main `95b07a6` merged in** (clean; mfac-floor's `scripts/night.mjs`). **`ci/mfac-floor/` carried**: its witness
`witness_mfac_floor.mjs` (from `claude/mfac-floor` `fc1ed3b`, bytes unchanged) and its BASE `a18c167`. That witness
writes the dir's `-` as `_` in its file name, so the member (`witnessFile`), land.mjs's NO-CI-DIR and B3.1 accept
`witness_<unit>.mjs` or `witness_<unit with - as _>.mjs`. Head leg `RED MFAC-FLOOR · BOUND` · base leg
`RED MFAC-FLOOR · F4.1 F4.2 F4.3`. `ci/ms1/BASE` is now `95b07a6`.

**The two last lines, both ways, against an LF `git archive` of `95b07a6` (19 Nov 2026):**

```
node ci/ms1/witness_ms1.mjs --org . --base-org <95b07a6>
GREEN MS1 every landed witness rides the suite · 30 clause(s)                                         (exit 0)
node ci/ms1/witness_ms1.mjs --org <95b07a6> --base-org <95b07a6>
RED MS1 · B1.1 BASE, B1.2 LF, B1.3 NOCALC, B2.1 FULL, B2.2 LAPTOP, B2.3 NEUTRAL, B3.1 CARRIED, B3.2 NOCI, B3.5 GATE,
  B4.1 LISTEN, B4.2 DERIVED, B4.3 ADMIT, B4.4 NOSPAWN, B4.5 DOOR, B5.1 SECONDS, B5.2 NOFETCH, B6.1 NOBASE, B6.2 SHORT,
  B6.3 SKIPWINS, F1 BOUND, F1W BOUNDID, F11 BEHAVE, R1 RULED, R2 STALE, R3 NEWDEATH, V1 KEYOF, BOUND          (exit 1)
node ci/ms1/run_mutants_ms1.mjs --org . --base-org <95b07a6>
run_mutants: 28 of 28 mutant(s) RED by the clause that names them · control GREEN                     (exit 0)
```

Everything in §9 (row 1107 (1)) still stands, its forks F-a to F-d included. F-a: mfac W3.2 still pins land.mjs to
mfac's base bytes.

## 11. THIRD FOLLOW-UP · forks row 1119, 19 Nov 2026 (new commits, never force; each step pushed when done)

Main `224f9b9` is merged in (merge `2911fc8`, clean). `ci/ms1/BASE` is `224f9b9`. No repair branch is merged (row 1119
(2)): mr3, mrj, mrt, mrf and mrv come one tip at a time, each named by a later message. The KNOWN_RED list of row 1107
(1)(c) stays on this branch as scaffolding, and the land branch carries it EMPTY.

**(3)(a) · `cfc172b` · the merge-base tree runs no witness** (C5 first half, `ci/ms2/MS2_SPEC.md` on `claude/ms2-spec`
`929e7e6`). After the B2 gate, `witnesses()` runs only when `realpath(ROOT)` is `realpath(GITHUB_WORKSPACE)`
(case-folded on win32). Elsewhere it prints `  SKIP WITNESSES · the merge-base tree — witnesses are judged at head (C5)`
and makes no assert. The merge-base step's clone under `$RUNNER_TEMP/b1_base` is never the workspace, so a leg pays the
member once, and a witness red at head is never "old". Clause **T3 BASETREE** plants `GITHUB_WORKSPACE` naming another
dir: one C5 line, nothing spawned, no assert. Every member plant now sets `GITHUB_WORKSPACE` to its own repo. Its
mutant removes the gate.

**(3)(b) · `0191132` · fork F-a, the third ADDED edit** (`ci/mfac/witness_mfac.mjs`): W3.2's did-not-touch conjunct
(land.mjs byte-identical to base) moves into that witness's own BOUND clause. W3.2 keeps its static night.mjs reads.
Re-judged:
- head (`cfc172b` tree, BASE `7c3c279`): `RED MFAC · F4 BOUND` (W3.2 green)
- base (`7c3c279`, both ways): `RED MFAC · F4 W1.1 … W3.1 W3.2 W4.1 … W9` (26 ids)

**NEW, fork F-e (for the architect): mfac F4 is overtaken by mfac-floor.** F4 pins "the SHIPPED night.mjs carries
`memory_floor_mb: FLOOR_UNSET`". mfac-floor (`95b07a6`, row 1103 (2)) replaced that placeholder with the ruled 1536 MB.
The head leg reds `F4: shipped key absent/typed`. It is a behavioural red (F11 A), not mine to edit (three ADDED edits
only). A fourth ADDED edit, an owner, or mfac-floor's witness taking F4's place: the architect's call.

**(3)(c) · `cba2757` · ci dirs carried**, witness bytes unchanged:

| Unit | from | BASE | head leg | base leg |
|---|---|---|---|---|
| mport | `claude/mport-build` `878dd07` | `95b07a6` | `RED MPORT · BOUND` | `RED MPORT · P1, P2, P3` |
| mjd7 | `claude/mjd7-build` `b0c06f3` (its own `BASE` as shipped) | `95b07a6` | `RED MJD7 · BOUND` | `RED MJD7 · C1 F1 F2 F3` |
| mtxt | `claude/mtxt-build` `471b7fe` | `95b07a6` | `RED MTXT · BOUND` | `RED MTXT · S1, S2, S3, S4, C1, C2, C3, C4, N1, BOUND` |

B3.1 now names 29 carried units (`B3.1 CARRIED · 29 units carried, every BASE a main commit`, 19 Nov 2026).

**(4) and (5), as ruled:** F-b the coverage red is an old red (main's own, named). F-c mtail T2 belongs to unit mrt. F-d
unit mrv carries mlv1 I2, I3 (node 24). Forks 1, 4, 5, 6, 8 and 9 stand as built.

**The two last lines, both ways, against an LF `git archive` of `224f9b9` (19 Nov 2026):**

```
node ci/ms1/witness_ms1.mjs --org . --base-org <224f9b9>
GREEN MS1 every landed witness rides the suite · 31 clause(s)                                         (exit 0)
node ci/ms1/witness_ms1.mjs --org <224f9b9> --base-org <224f9b9>
RED MS1 · B1.1 BASE, B1.2 LF, B1.3 NOCALC, B2.1 FULL, B2.2 LAPTOP, B2.3 NEUTRAL, T3 BASETREE, B3.1 CARRIED, B3.2 NOCI,
  B3.5 GATE, B4.1 LISTEN, B4.2 DERIVED, B4.3 ADMIT, B4.4 NOSPAWN, B4.5 DOOR, B5.1 SECONDS, B5.2 NOFETCH, B6.1 NOBASE,
  B6.2 SHORT, B6.3 SKIPWINS, F1 BOUND, F1W BOUNDID, F11 BEHAVE, R1 RULED, R2 STALE, R3 NEWDEATH, V1 KEYOF, BOUND (exit 1)
node ci/ms1/run_mutants_ms1.mjs --org . --base-org <224f9b9>
run_mutants: 29 of 29 mutant(s) RED by the clause that names them · control GREEN                     (exit 0)
```

## 12. FOURTH FOLLOW-UP · forks row 1125, 19 Nov 2026 (new commits, never force)

- **(2) `20de517` · F-e fate (a), the fourth ADDED edit:** mfac F4 is re-cut to the form row 1103 (2) ruled and unit
  mfac-floor shipped. The shipped `night.mjs` carries `memory_floor_mb: 1536`, and on an armed, begun night a
  free-memory plant one MB under it makes `may --act launch` answer `NO memory`. The old text is struck in its header.
  Re-judged: head `RED MFAC · BOUND`; base `7c3c279` `RED MFAC · F4 W1.1 … W9` (26 ids); `a18c167` (the
  placeholder form) `RED MFAC · F4`.
- **(3) `7fea11d` · the gate fails closed:** hermetic + `GITHUB_ACTIONS=true` with no `GITHUB_WORKSPACE` is the RED assert
  `WITNESSES · the neutral machine names its workspace (GITHUB_WORKSPACE): the gate fails closed`, never a skip. Clause
  **T4 NOWORKSPACE** + its mutant.
- **Measured on the cancelled `c637496` run (node 22 log):** B4 refused **mland, mlj, mlv0, mlv1, mport and ms1**. Unit mport
  had moved keeper's export to `JUDGE_PORT = plantedPort("ARSENAL_JUDGE_PORT", 4118)` (`scripts/keeper.mjs:100`), and
  the member read only a `process.env.X` door. It now also reads a door handed as a quoted `ARSENAL_…PORT` literal on
  the export's line. Clause **B4.6 DOORLIT** + its mutant. After it, no B4 refusal (the member line below).
- Witness and mutants against `224f9b9`, 19 Nov 2026: `GREEN MS1 every landed witness rides the suite · 33 clause(s)` ·
  base `RED MS1 · B1.1 BASE, …` · `run_mutants: 31 of 31 mutant(s) RED by the clause that names them · control GREEN`.

## 13. THE ASSEMBLED BRANCH · repair tips merged one at a time (row 1119 (2); merge commits, never a rebase)

- **mrj `0fff2e2`** (row 1129) → merge `ff9f6af`, clean. It brings `ci/mrj/` (witness, BASE `52b51c1`), re-cuts
  `ci/mjud/witness_mjud.mjs` + `w_drive.mjs`, and removes the mjud KNOWN_RED entry. Witness after: `GREEN MS1 · 33
  clause(s)`, base RED. Member after (Linux, `GITHUB_ACTIONS=true GITHUB_WORKSPACE=<repo>`, 19 Nov 2026):
  `WITNESS ‹mjud› · GREEN at head against its BASE` ok · `‹mrj›` ok · `organism_test: 64 passed, 3 failed · ruled 2 ·
  UNRULED 1`. The reds are ‹mf2› and ‹mjd3› (ruled) and ‹mtail› (`red beyond BOUND: T2 F-C T3 AUTH`, unruled: T2 is
  mrt's, F-c). Nothing is red that was not red at `c637496`.
