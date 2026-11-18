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

The neutral machine's verdict on this branch is RED on exactly these members, plus whatever §5.3 records.

### 5.3 The neutral machine (suite workflow, `windows-latest`, node 22 and 24)

Read with curl, no token: `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`. Each push's run ids and
verdict are in `LEDGER.jsonl` (act `ci-read`) and in the seat's final message. The member's seconds per unit on the
runner are its own `  witness ‹unit› <s> s` lines in the job log; see the CHECKPOINT/CI lines at the end of this file.

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
7. The effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (§8).

## 8. Effort receipt

`node campaign-2026-09/tools/effort_receipt.mjs --fleet ms1b --seat 00 --model claude-opus-5-5`. Its error is in the
final message. Nothing is written under `campaign-2026-09/`.
