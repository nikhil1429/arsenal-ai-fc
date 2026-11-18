# MS1 — every landed unit's witness rides the suite, judged against its own BASE

Unit **ms1** · forks rows 1054 / 1055 · spec seat · base `origin/main` @ `4d166d3` (fetched 18 Nov 2026 UTC).
His word 240 is the unit's reason (the day must work with nothing for him to remember), and his word 243 is the
pace (the runner never sits idle). Row 1055 (b) fixes B1 to B6. This file builds nothing: every fact below is
`file:line` at `4d166d3` or a measurement made on 18 Nov 2026 with the command named. What the cloud could not reach is
under **NAMED, NOT GUESSED**.

**Headline (measured 18 Nov 2026).** The fifteen landed witnesses still discriminate: each is RED on its own
BASE, as its PROOF says. But **not one of them is GREEN at main's head as written**. Each was run with `--org` = an LF
tree of `4d166d3` and `--base-org` = an LF tree of its own BASE. Twelve went RED on their `BOUND` clause only. BOUND
says "only the named files differ"; it is a *seat-time* clause, and every later landing makes it false. The other three
went RED on a behavioural clause too, where a later unit changed what the earlier witness pinned (mjd3, mtail, mjud).
mf4's red is its own BOUND clause, printed as `W6 BOUND`. So B1 as ruled, run literally, lands a member that is RED on its first push. The central
forks are **F1** (what the member does with BOUND) and **F11** (the overtaken witnesses).

Three more measured facts change the build:
- The verdict matches reds by name with digit runs folded, so `mlv0`/`mlv1`, `mjd3`/`mjd4`/`mjd5` and `mf2`/`mf4` would each collapse into ONE member (F4).
- Two landed witnesses hold the judge's fixed port, `keeper.mjs:79` `JUDGE_PORT = 4118`, so B4 refuses them (F5).
- Three BASE shas are on no main commit. They live only on build branches (F6).

---

## 0. MEASURED at the base `4d166d3` (18 Nov 2026)

### 0.1 Where things stand

| # | Fact | Where |
|---|---|---|
| M1 | **main carries no `ci/` directory.** Every witness lives only on its unit's build branch. | `git ls-tree -r --name-only origin/main -- ci` → empty |
| M2 | The neutral verdict runs the HEAD tree and its merge base, both under `ORGANISM_TEST_PROFILE=hermetic`, on `windows-latest`, legs node 22 and node 24, and is GREEN iff no member is red at HEAD that is not red at the base. | `.github/workflows/suite.yml:61` (`runs-on`), `:66` (matrix), `:68` (profile), `:108-116` (head), `:121-143` (base), `:146-157` (verdict) |
| M3 | The checkout is **already full depth**: `fetch-depth: 0`. | `.github/workflows/suite.yml:72` |
| M4 | The runner's checkout is **CRLF** (B1's own record; `core.autocrlf` on Windows). `.gitattributes:2` is `* text=auto` with no `eol`, so on Windows a `git archive` or checkout writes CRLF unless the command sets `core.autocrlf=false` **and** `core.eol=lf` (with `text=auto` and no `eol`, `core.eol` defaults to `native`, which is CRLF there). | `.gitattributes:2`; `suite.yml` header comment (B1, the CRLF throw) |
| M5 | A red is matched across trees by **its assert name with every digit run folded to `#`**. | `scripts/ci_verdict.mjs:46` `keyOf` |
| M6 | The suite's modes are one table; a new member is one more key. A mode under the hermetic profile can be named LIVE and not run. | `scripts/organism_test.mjs:2765` `MODES` · `:209` `LIVE_MODES` · `:83` `PROFILE` · `:218` `liveNamed` |
| M7 | `land.mjs` already runs a witness with `--org <T> --base-org <P>` where P is **T's parent** (step 8, the LIVE witnesses, shared clones). B1 forbids exactly this for the suite member ("never main-parent"). | `scripts/land.mjs:206-218` |
| M8 | `land.mjs` names the hermetic witness home as `ci/witness/<unit>` and its names gate covers only that prefix. **Every witness actually written lives at `ci/<unit>/witness_<unit>.mjs`.** | `scripts/land.mjs:15` (S1), `:39` `WITNESS_DIR`, `:134-152` `namesGate` |
| M9 | `land.mjs` refuses a landing that touches `dressing-room/state/` or `.claude/settings.json`; it has no rule about `ci/`. | `scripts/land.mjs:185-191` |
| M10 | Every witness's LAST line has one grammar: `GREEN <UNIT> …` (exit 0) or `RED <UNIT> · <clause ids>` (exit 1). The per-clause lines do **not** share a grammar (`  ✓ ID` in mdone, `  GREEN ID` / `  RED   ID` in mlv0/mlv1). `land.mjs` reads only the last line. | `scripts/land.mjs:215`; the witness headers (`ci/mlv1/witness_mlv1.mjs:21` on `claude/mlv1-build`) |
| M11 | Fixed service ports in the organs, read from source: cortex `4112` (`scripts/cortex.mjs:2162`, `:2232`), dugout `4114` (`scripts/dugout.mjs:179`), brain resident `4116` (`scripts/brain.mjs:7664`), sitting `4117` **with an env door** `ARSENAL_SITTING_PORT` (`scripts/sitting.mjs:108`), judge `4118` **with no env door** (`scripts/keeper.mjs:79`, held by `holdJudgePort` `:83-86`), oura auth `8080` (`scripts/oura_auth.mjs:83`). `herd.mjs` already reads locks statically by one regex. | the lines named; `scripts/herd.mjs:181` |
| M12 | No organ under `scripts/` reads a `ci/` path at run time except `land.mjs` (the names gate) and comments. | `grep -rn "ci/" scripts/*.mjs` |

### 0.2 The landed units, their witnesses and their BASE

A *landed unit* is one whose land commit is on main's first-parent history and whose build branch carries a witness.
The BASE is the sha its PROOF names as the tree the witness was judged RED against. Read on 18 Nov 2026 with
`git show origin/<branch>:<proof> | grep -i base` and `git merge-base --is-ancestor <BASE> origin/main`.

| Unit | Witness (on branch) | BASE (from its PROOF) | BASE on main? | Commits BASE..main |
|---|---|---|---|---|
| mdone | `ci/mdone/witness_mdone.mjs` (`claude/mdone-build`) | `4f86d59` (`ci/mdone/PROOF.md:6`) | **no**: on `claude/mdone-build`, `claude/mland-build` | — |
| mlv1 | `ci/mlv1/witness_mlv1.mjs` (`claude/mlv1-build`) | `1631e22` (`ci/mlv1/PROOF.md:6`) | **no**: on `claude/mlv0-build` … `claude/mlv3-build` | — |
| mlv0 | `ci/mlv0/witness_mlv0.mjs` (`claude/mlv0-build`) | `15edfec` (`ci/mlv0/PROOF.md:6`) | yes | 7 |
| mland | `ci/mland/witness_mland.mjs` (`claude/mland-build`) | `38dd20a` (`ci/mland/PROOF.md:7`) | **no**: on `claude/mdone-build`, `claude/mgrd-build`, `claude/mland-build` | — |
| mgrd | `ci/mgrd/witness_mgrd.mjs` (`claude/mgrd-build`) | `15edfec` (`ci/mgrd/PROOF.md:6`) | yes | 7 |
| mf2 | `ci/mf2/witness_mf2.mjs` (`claude/mf2-build`) | `15edfec` (`ci/mf2/PROOF.md:3`) | yes | 7 |
| mjd5 | `ci/mjd5/witness_mjd5.mjs` (`claude/mjd5-build`) | `15edfec` (`ci/mjd5/PROOF.md:3`) | yes | 7 |
| mjd3 | `ci/mcr/witness_mjd3.mjs` (`claude/mcr-mjd3-build`) | `074ead9` (`ci/mcr/MJD3_PROOF.md:3`) | yes | 10 |
| mjd4 | `ci/mcr/witness_mjd4.mjs` (`claude/mcr-mjd4-build`) | `3a73782` (`ci/mcr/MJD4_PROOF.md:3`) | yes | 8 |
| mcr2 | `ci/mcr2/witness_mcr2.mjs` (`claude/mcr2-crlf-selftests`) | `d0c8c96` (`ci/mcr2/PROOF.md:3`) | yes | 12 |
| mtail | `ci/mtail/witness_mtail.mjs` (`claude/mtail-judge-tail`) | `d0c8c96` (`ci/mtail/PROOF.md:3`) | yes | 12 |
| mpast | `ci/mpast/witness_mpast.mjs` (`claude/mpast-full-time`) | `c56b0a8` (`ci/mpast/PROOF.md:3`) | yes | 15 |
| mjud | `ci/mjud/witness_mjud.mjs` (`claude/judge-budget-timeouts-g7p0qg`) | `5767e21` (`ci/mjud/PROOF.md:4`) | yes | 16 |
| mf4 | `ci/mf4/witness_mf4.mjs` (`claude/mf4-study-canary-ewyyct`) | `5767e21` (`ci/mf4/PROOF.md:3`) | yes | 16 |
| mpm | `ci/mpm/witness_mpm.mjs` (`claude/mpm-close-evidence`) | `5767e21` (`ci/mpm/PROOF.md:3`) | yes | 16 |

Landed on main with **no witness found on any branch** (18 Nov 2026, the `ci/` survey over every `origin/claude/*`):
`mjdg` (`5767e21`), `mcrlf` (`02a181c`), `mcard` (`c64092d`), `mjday` (`6957567`) and every unit before them. B1 (`b1`)
carries `ci/b1/probe.mjs`, a probe, not a witness. These are named in F7.

Two witnesses live in one shared dir, `ci/mcr/` (mjd3 and mjd4), and several dirs carry more than the witness:
siblings it imports (`ci/mjud/{sides,w_drive,w_preload,ledger}.mjs`, `ci/mtail/{sides,w_preload,gates,ledger}.mjs`,
`ci/mf4/{clock,step}.mjs`), a mutant runner (`run_mutants*.mjs`), `PROOF.md`, `LEDGER.jsonl` and `out/` captures.

### 0.3 The run: each witness at main's head against its own BASE (the member as ruled, by hand)

Recipe, the seats' own (`ci/mf2/PROOF.md:27` on `claude/mf2-build`): LF `git archive` trees of `4d166d3` and of the
BASE, `node_modules` linked in, a refusing `claude` first on `PATH` (no live model call was possible), each witness
run from a copy of its own ci dir. Linux container, node v22, 18 Nov 2026. Leg *head* = `--org <main> --base-org <BASE>`;
leg *base* = `--org <BASE> --base-org <BASE>` (its RED, re-taken). Command: `scratchpad measure.sh` (its body is in
`ci/ms1/LEDGER.jsonl`, act `measure`).

| Unit | head leg: exit · seconds · LAST line | base leg: exit · seconds · LAST line | Behavioural red at head (beyond BOUND) |
|---|---|---|---|
| mdone | 1 · 71.5 · `RED MDONE · BOUND` | 1 · 8.9 · `RED MDONE · D-ORPH, D-UNREAD, D-METER, D-RULE, D-REACH, D-NOCONS, D-LINE, D-WRITE, D-MORNI…` | none |
| mlv1 | 1 · 1.6 · `RED MLV1 · BOUND` | 1 · 1.1 · `RED MLV1 · I1 IDLE, I2 MID, I3 JUDGE` | none |
| mlv0 | 1 · 0.3 · `RED MLV0 · BOUND` | 1 · 0.3 · `RED MLV0 · S1 CLOSURE, S2 K6, S3 UNVERIFIED, M2 BOOT, M4 JUDGE` | none |
| mland | 1 · 22.6 · `RED MLAND · BOUND` | 1 · 16.6 · `RED MLAND · V1, V2, V3, V4, V5, V6, V7, V8, CR1, CR2, CR3, CR4, L2, L3, L4, Q4, S8, BOUND` | none |
| mgrd | 1 · 5.2 · `RED MGRD · BOUND` | 1 · 4.9 · `RED MGRD · G1, G2, G3, BOUND` | none |
| mf2 | 1 · 229.3 · `RED MF2 · BOUND` | 1 · 233.0 · `RED MF2 · F1` | none |
| mjd5 | 1 · 1.7 · `RED MJD5 · BOUND` | 1 · 1.5 · `RED MJD5 · R1 R3 R2` | none |
| mjd3 | 1 · 11.9 · `RED MJD3 · J4 BOUND` | 1 · 37.8 · `RED MJD3 · J1 J2 J3 J4` | **J4** |
| mjd4 | 1 · 1.8 · `RED MJD4 · BOUND` | 1 · 1.7 · `RED MJD4 · I1 I3 I4 I5` | none |
| mcr2 | 1 · 2.5 · `RED MCR2 · BOUND` | 1 · 2.7 · `RED MCR2 · C-context C-fuelboard C-learnstate BOUND` | none |
| mtail | 1 · 20.5 · `RED MTAIL · T3 AUTH · BOUND` | 1 · 23.0 · `RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1 · BOUND` | **T3 AUTH** |
| mpast | 1 · 9.5 · `RED MPAST · BOUND` | 1 · 9.9 · `RED MPAST · MP1 MP4 MP6 MP3 MP2 MP5 MP7 MB2 MB4 BOUND` | none |
| mjud | 1 · 1.1 · `RED MJUD · M3 CENSUS · M5 F3-CLIP · M6 MJD2 · BOUND` | 1 · 1.1 · `RED MJUD · M1 SITTING · M2 DUGOUT · M3 CENSUS · M4 F3-EAT · M5 F3-CLIP · M6 MJD2 · M8 MAUT…` | **M3 CENSUS M5 F3-CLIP M6 MJD2** |
| mf4 | 1 · 2.4 · `RED MF4 · W6 BOUND` | 1 · 2.1 · `RED MF4 · W1 CANARY · W5 STREAK · W4 SELFTEST` | none |
| mpm | 1 · 0.9 · `RED MPM · BOUND` | 1 · 0.9 · `RED MPM · Q1 Q3 BOUND` | none |
| **sum** | 382.8 s | 345.5 s | |

**What the table says (18 Nov 2026):**
- **Every witness still discriminates.** On the base leg every one is RED, on the clauses its PROOF names, so the BASE shas of §0.2 are the right ones (F6 aside).
- **Twelve units are RED at head on their BOUND clause only:** mdone, mlv1, mlv0, mland, mgrd, mf2, mjd5, mjd4, mcr2, mpast, mf4, mpm. The id is not uniform: mf4 prints `W6 BOUND`, the rest print `BOUND`. BOUND fails because the BASE..main diff holds files beyond the unit's named set, other units' `ci/` dirs included (mdone's line names `ci/mgrd/…` and `ci/mland/…`).
- **Three units are RED at head on a behavioural clause as well.** In each case a LATER landing changed what the earlier witness pinned:
  - **mjd3 J4** (round 1 exits 9 after 2 reps). The judge round's batch logic was re-cut after mjd3 by mjd4, mjd5 and mlv0 (`git log origin/main -- scripts/gaffer_brain.mjs`).
  - **mtail T3 AUTH.** Its OAuth-pattern probes hold. The red part is `depcruise no-circular 13 vs BASE 7`: a ratchet the witness compares against its own BASE, so any cycle added since, by any unit, reds it.
  - **mjud M3 CENSUS.** The census finds three judge-verb spawn sites and calls `scripts/postmatch.mjs:852` NOT covered. mtail (`074ead9`) rewrote that spawn into the `fits()` / `spawnMs()` budget form (`postmatch.mjs:848-852`), which the census pattern does not recognise. Whether that is an overtaken pattern or a real hole is a ruling (F11). **mjud M5 F3-CLIP and M6 MJD2:** the batch-budget behaviour mjud pinned was re-ruled by mjd3, mjd4 and mjd5.
  - Whether each of these is a regression or a superseded ruling is not a seat's call. F11 carries it.
- **Seconds** (Linux, one process each, run one after another): the last row has both sums. mf2 is most of it, because it runs a suite mode inside its plant. B5's per-leg figure is the head-leg sum. It is paid twice per CI leg (head tree + merge-base tree, `suite.yml:113`, `:133`), and F12-B would add the base leg on top.


---

## 1. The design

ONE new suite mode, **`witnesses`**, in `scripts/organism_test.mjs` (`MODES`, `:2765`). It is the member. It writes
nothing outside `os.tmpdir()` and reads `dressing-room/state` never. It is the sole writer of nothing.

```
for each dir D under ci/ that holds a witness_*.mjs           (a unit dir; ci/ms1 itself has none until its build)
  B2  not (PROFILE hermetic AND the neutral machine)  → print ONE line "  SKIP WITNESSES — …" and return
  B6  D/BASE absent or not one 40-hex line            → RED  "WITNESS ‹unit› · carries a BASE file (B6)"
  F6  BASE not a commit in this clone                 → RED  "WITNESS ‹unit› · its BASE is in the clone"
  B4  a static read of the witness and its siblings names a fixed service port
                                                      → RED  "WITNESS ‹unit› · binds no fixed service port (B4)" + the token and the organ file:line
  B1  BASE → an LF tree under os.tmpdir() (temp index, core.autocrlf=false, core.eol=lf); HEAD → the same (F2)
      node_modules linked in (a junction on Windows); claude and gemini that refuse, first on PATH
      node D/witness --org <HEAD tree> --base-org <BASE tree>   (cwd: the repo root)
      judged on the LAST line only (M10), filtered by F1   → ok / RED "WITNESS ‹unit› · GREEN at head against its BASE"
  every temp tree removed in a finally
```

The unit name sits inside `‹ ›` in every assert name; F4 decides how the verdict keeps `mlv0` and `mlv1` apart.

---

## 2. B1 to B6: touch points, code path, witness clauses, mutants

ms1's own witness is **`ci/ms1/witness_ms1.mjs`**, in the shape every landed witness has (`--org`, `--base-org`, the
one LAST line). Each plant is a throwaway git repo under `os.tmpdir()` holding a copy of `--org`'s
`scripts/organism_test.mjs` and a tiny planted unit dir, so the member runs over plants and never over the real
witnesses. **RED on base** = the plant against `4d166d3`'s `organism_test.mjs` (no `witnesses` mode, so the clause's
expected line never prints). **GREEN on build** = the same plant against the build's.

### B1 — each unit's ci dir carries BASE; the member builds that sha as an LF tree under the temp dir for `--base-org`

- **Touches.** `scripts/organism_test.mjs` (new function `witnesses()`, one key in `MODES` at `:2765`); `ci/<unit>/BASE`
  (new, one line, the full 40-hex sha, LF). The tree builder is `git -c core.autocrlf=false -c core.eol=lf
  --work-tree=<tmp> checkout <sha> -- .` with `GIT_INDEX_FILE` pointing at a temp index (the private-index pattern
  `land.mjs:192-196` already uses). No `tar` (it is not certain on the runner's PATH for a node child), no
  `worktree add` (`land.mjs:15`, step 8's rule), no clone of the repo per unit.
- **Path.** `BASE` read → `rev-parse --verify <sha>^{commit}` → temp index checkout → `--base-org`. The base is never
  `HEAD^1`, never `merge-base`, never computed: the member has no code that reaches either (W-B1.3 is a static read).
- **Clauses.**
  - **W-B1.1** A planted unit whose witness prints `GREEN` iff `--base-org` holds the planted BASE's marker file
    (a file only that sha has) → the member's assert is ok. *Base RED* (no mode) · *build GREEN*.
  - **W-B1.2** The same plant, the BASE file in the planted repo committed with CRLF bytes and `core.autocrlf=true`
    set in the plant repo → the witness reads every file of `--base-org` with no `\r`. *Base RED* · *GREEN*.
  - **W-B1.3** Static: `witnesses()`'s body names no `merge-base`, no `HEAD^`, no `^1`. *Base RED* (no function) · *GREEN*.
- **Mutants.** μB1.1 `--base-org` given the HEAD tree → W-B1.1 RED · μB1.2 drop `core.eol=lf` → W-B1.2 RED on a
  Windows runner only (named in N3) and on Linux by the plant's `core.eol=crlf` · μB1.3 base := `merge-base HEAD
  origin/main` → W-B1.3 RED.

### B2 — the member runs under the hermetic profile on the neutral machine only; on his laptop ONE named skip line

- **Touches.** `witnesses()` first lines; the neutral machine is read from the environment the workflow already has
  (F3 rules which variable). `.github/workflows/suite.yml` needs **no** change for B2 (`:68` already sets the profile).
- **Path.** `PROFILE === "hermetic" && <neutral>` → run; else print
  `  SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2): a witness may bind ports` and return
  with **no assert** (a skip is not a red and not a pass; `liveNamed` at `:218` is the model, but B2's line is its own
  word so the LIVE count does not change meaning).
- **Clauses.**
  - **W-B2.1** Full profile (no env) → exactly one line matching `^  SKIP WITNESSES — ` and no witness process spawned
    (the plant witness writes a marker; the marker is absent). *Base RED* (no line) · *GREEN*.
  - **W-B2.2** Hermetic profile without the neutral variable (his laptop running the CI profile by hand) → the same
    one line. *Base RED* · *GREEN*.
  - **W-B2.3** Hermetic + neutral → the plant witness runs (marker present). *Base RED* · *GREEN*.
- **Mutants.** μB2.1 gate on the profile only → W-B2.2 RED · μB2.2 skip silently (no line) → W-B2.1 RED · μB2.3
  invert the gate → W-B2.3 RED.

### B3 — ci dirs reach main two ways

- **(i) ms1's own landing carries the ci dir and BASE of every unit already landed.** The land branch for ms1 is
  main + `scripts/organism_test.mjs` + `ci/ms1/` + for each unit in §0.2 its witness and the siblings it imports
  (F8 rules whether `PROOF.md`, `LEDGER.jsonl`, `out/`, `run_mutants*` ride too) + one new `BASE` file per dir.
  `ci/mcr/` is shared by mjd3 and mjd4 and needs two BASEs (F9).
- **(ii) from then every land branch carries its unit's ci dir.** **Touches** `scripts/land.mjs` step 5
  (`:185-191`): a new refusal `NO-CI-DIR` when the landing adds or changes no `ci/<unit>/witness_*.mjs` with a
  `ci/<unit>/BASE`, unless the unit is ruled witness-less (F7). It sits beside `STATE-PATH` and `SETTINGS-PATH`, in
  the owner of the landing (land.mjs is sole writer of nothing in state, `:5`). The names gate (`:39`, `:134`) moves
  from `ci/witness/` to `ci/` (F10), or the layout moves to `ci/witness/` (the same fork).
- **Clauses.**
  - **W-B3.1** Static on the ms1 build tree: every unit of §0.2 has `ci/<dir>/BASE` and its witness file at the path
    the table names. *Base RED* (M1) · *GREEN*.
  - **W-B3.2** land.mjs over a planted bare origin (the `ci/mland/witness_mland.mjs` sandbox pattern): a land branch
    with no ci dir → `REFUSED NO-CI-DIR`. *Base RED* (land.mjs has no such stop; it would reach its verdict step) · *GREEN*.
  - **W-B3.3** The same plant with `ci/<unit>/witness_x.mjs` + `BASE` → passes step 5. *Base GREEN* (guard, kept).
- **Mutants.** μB3.1 drop one unit's BASE from the build tree → W-B3.1 RED · μB3.2 drop the `NO-CI-DIR` check →
  W-B3.2 RED · μB3.3 require the ci dir on a state-only push → W-B3.3 RED.

### B4 — a witness with a fixed service port is refused by the member, by a static read, named

- **Touches.** `witnesses()`; no organ. The forbidden set is **derived from the organs at run time, never typed**:
  a scan of `scripts/*.mjs` for `listen(<numeric literal ≠ 0>` and `export const <NAME>_PORT = <numeric literal>`
  (the `herd.mjs:181` shape, widened), giving the literal ports and the exported names (today, read 18 Nov 2026:
  `JUDGE_PORT`, plus the literals of M11). A port whose organ reads an env door (`sitting.mjs:108`) is admitted only
  if the witness source names that env variable. The witness and every sibling `.mjs` in its dir are read; a hit is
  RED with the token, the witness `file:line` and the organ `file:line` it resolves to.
- **Measured consequence (18 Nov 2026):** `ci/mlv0/witness_mlv0.mjs` M4 holds the judge port through
  `k.holdJudgePort()` and `ci/mlv1/witness_mlv1.mjs` I3 does `listen(${jport})` with `jport = k.JUDGE_PORT`; mlv0's
  output on the head leg reads `port 4118 held true`. **B4 refuses both** (F5).
- **Clauses.**
  - **W-B4.1** A plant witness with `listen(4117` → RED naming `4117` and the plant line. *Base RED* (no read) · *GREEN*.
  - **W-B4.2** A plant witness that imports a planted organ's `export const PLANT_PORT = 4999` and names `PLANT_PORT`
    → RED naming the organ line (the derived set, not a list). *Base RED* · *GREEN*.
  - **W-B4.3** `listen(0, …)` and `ARSENAL_SITTING_PORT: String(port)` beside a sitting spawn → admitted. *Base GREEN* (guard).
  - **W-B4.4** The refused witness is never spawned (its marker absent). *Base RED* · *GREEN*.
- **Mutants.** μB4.1 a typed port list instead of the scan → W-B4.2 RED · μB4.2 refuse `listen(0` → W-B4.3 RED ·
  μB4.3 read but spawn anyway → W-B4.4 RED.

### B5 — the added minutes per leg, and the fetch depth the workflow needs (both forks)

- **Touches.** Nothing at build time beyond the member printing, per unit, `witness ‹unit› <seconds> s` and one
  total line, so every CI run measures it again (the numbers are never typed into code or canon).
- **Measured, Linux, 18 Nov 2026:** §0.3's seconds column. Per CI leg the member runs **twice** (the HEAD tree and the
  merge-base tree each run `organism_test.mjs all`, `suite.yml:113` and `:133`), so the leg's added time is the head
  sum plus the merge-base sum, and both matrix legs pay it in parallel. The Windows number is N2.
- **Fetch depth.** `suite.yml:72` is already `fetch-depth: 0`, which fetches every branch, so today every BASE of
  §0.2 is in the clone. What it needs at minimum: the deepest main-ancestor BASE is 16 commits behind `4d166d3`
  (`5767e21`), and three BASEs are reachable from **no** main commit (§0.2). F6.
- **Clauses.** **W-B5.1** the member prints one seconds line per unit and one total. *Base RED* · *GREEN*.
  **W-B5.2** a BASE absent from the clone → RED `its BASE is in the clone`, never a fetch by the member (the member
  never touches the network). *Base RED* · *GREEN*.
- **Mutants.** μB5.1 drop the seconds line → W-B5.1 RED · μB5.2 `git fetch` the missing sha → W-B5.2 RED (the plant
  repo has an unreachable remote; a fetch attempt is caught by the plant's `GIT_TRACE` file).

### B6 — a missing BASE is RED, never a skip

- **Touches.** `witnesses()`.
- **Clauses.** **W-B6.1** a unit dir with a witness and no BASE → RED `carries a BASE file (B6)`. *Base RED* (no
  member, so no red line) · *GREEN*. **W-B6.2** a BASE that is not 40 hex (a short sha, a blank) → RED. *Base RED* ·
  *GREEN*. **W-B6.3** the missing-BASE red is a red under the neutral gate only; on the laptop the B2 skip line covers
  it (B2 wins: the laptop never judges). *Base RED* · *GREEN*.
- **Mutants.** μB6.1 `continue` on a missing BASE → W-B6.1 RED · μB6.2 accept a 7-char sha → W-B6.2 RED.

### Where ms1 meets the day end (mday)

Read at `claude/mday-spec` `9421614` (`ci/mday/MDAY_SPEC.md`) and `claude/mday-build` tip **`ba842cf`** (18 Nov 2026:
`scripts/day.mjs` and `ci/mday/LEDGER.jsonl`; its message says "Witness to follow", so no `ci/mday/witness_mday.mjs`
and no BASE exist yet).

- **mday is the first unit B3 (ii) binds.** Its land branch must carry `ci/mday/witness_mday.mjs` + `ci/mday/BASE`.
  Its spec's base is `33d1432`, but its build tip sits on `669200d`; the BASE file must name the sha its witness is
  actually judged RED against (the build seat's PROOF), not the spec's base. If mday lands **before** ms1, it is a
  "unit already landed" and rides ms1's landing under B3 (i); after, `NO-CI-DIR` holds it. Either order works; the
  runner should not wait on one for the other (his word 243).
- **mday's witness must pass B4.** MDAY_SPEC R1 opens the sitting daemonless (`openLocal`) and through the daemon
  when it is up (`MDAY_SPEC.md` §2 R1). A witness that boots the sitting daemon must set `ARSENAL_SITTING_PORT`
  (`sitting.mjs:108`) beside the spawn, and any plant that touches the judge (R2 step 2 fires `judge-due` through
  `sitting.mjs close`) must not hold `JUDGE_PORT` unless F5-B lands first. Named here so the mday build seat reads it
  before writing its witness.
- **The day end opens the landing window.** `land.mjs` step 7 refuses while a sitting is open (`land.mjs:202-205`).
  `day.mjs end` closes the sitting (MDAY_SPEC R2 step 2), so after his "chalo, aaj bas" in any words, the runner's next
  `land.mjs` passes step 7 with nothing for him to remember. The member itself never reads the live sitting
  (`dressing-room/state` is never read; B2 keeps it off his laptop), so a day in progress never colours a verdict.
- **mday's `day.mjs selftest` joins the hermetic chain** (MDAY_SPEC R7). That is a selftest member, not a witness;
  the `witnesses` member and it are independent and neither waits on the other.

### The member's own verdict plumbing

- **W-V.1** ms1's witness feeds `ci_verdict.mjs compare` a HEAD output carrying `WITNESS ‹mlv1› …` red and a base
  output carrying `WITNESS ‹mlv0› …` red → the verdict is RED (two units are two members). *Base RED* (`keyOf` folds
  both to `WITNESS ‹mlv#› …`, `ci_verdict.mjs:46`) · *GREEN* under F4-A. μV.1 restore the fold inside `‹ ›` → RED.

---

## 3. FORKS — for the architect to rule

| Fork | Question | Options | Recommend | The measurement that decides |
|---|---|---|---|---|
| **F1** | Every landed witness is RED at head on its `BOUND` clause, and for twelve it is the only red (§0.3). What does the member judge? | (A) read the LAST line's red list (M10's grammar, shared by all fifteen) and judge GREEN iff every red id is a BOUND id (an id whose words include `BOUND`; mf4 prints `W6 BOUND`) · (B) `--base-org` stays the BASE tree, and BOUND is fed a *bound tree*: HEAD with the unit's named files at their BASE bytes (deterministic, but no longer "builds that sha") · (C) re-cut every witness so BOUND reads `--org` vs the unit's own land commit (a new `ci/<unit>/LANDED` sha) · (D) land it RED and let the base-red rule carry it (every later push then shows fifteen permanent warnings) | **A**, with C as the long road | §0.3: for twelve units BOUND is the only head-leg red, so A makes those twelve GREEN with no witness byte changed. The other three go to F11 |
| **F2** | Which tree is `--org`? | (A) an LF tree of HEAD built the same way as the BASE · (B) the runner's own CRLF checkout | **A** | Every BASE tree is LF (B1); a witness that compares bytes (BOUND, mlv1's XML) across an LF base and a CRLF head reports every file. N3 measures it on the runner |
| **F3** | How the member knows it is on the neutral machine (B2) | (A) `GITHUB_ACTIONS === "true"` (set by the runner itself, never by the workflow file) · (B) a new variable set in `suite.yml` · (C) `CI` | **A** | A needs no workflow edit; B touches `.github/workflows/suite.yml` (a file beyond) |
| **F4** | `keyOf` folds digits (M5): `mlv0`/`mlv1`, `mjd3`/`mjd4`/`mjd5`, `mf2`/`mf4` collapse into one member each | (A) `ci_verdict.mjs` `keyOf` keeps the text inside `‹ ›` unfolded, with its selftest planted both ways · (B) the member spells unit digits as letters in the assert name · (C) one assert for all units together | **A** | W-V.1. B works with no change to `ci_verdict.mjs` but makes names he cannot read; C hides which unit went red |
| **F5** | B4 refuses mlv0 (M4) and mlv1 (I3): they hold `JUDGE_PORT` `4118` (`keeper.mjs:79`, no env door) | (A) the member lands them refused: two RED members on ms1's first push, so ms1 cannot land GREEN until they are fixed · (B) `keeper.mjs` gains an env door `ARSENAL_JUDGE_PORT` (the `sitting.mjs:108` shape) and B4 admits `JUDGE_PORT` when the member sets it to a free port; the witnesses' bytes do not change (they read `k.JUDGE_PORT` from `--org`) · (C) ms1 carries mlv0 and mlv1 without their ci dirs; their units go to F7 | **B** | B is a file beyond (`scripts/keeper.mjs`); W-B4.2's derived set must then read the env door. Run mlv0/mlv1 on the runner with the door set and a real listener on `4118` in the same job: GREEN means the door holds |
| **F6** | Three BASEs are on no main commit (`4f86d59`, `1631e22`, `38dd20a`); they live only while their build branches live | (A) keep `fetch-depth: 0` and never delete a branch that holds a BASE (a rule land.mjs can check) · (B) re-take those three units' RED on a main-ancestor sha and write that sha as their BASE (a measurement per unit, then B1 holds by main alone) · (C) a tag per BASE (`ci-base/<unit>`) | **B** | §0.2's column. For each of the three, run the witness at the candidate main sha (`--org <sha> --base-org <sha>`): RED on the same behavioural clauses as its PROOF means the sha is a true BASE |
| **F7** | Units landed with no witness on any branch (`mjdg`, `mcrlf`, `mcard`, `mjday`, and earlier) | (A) none of them is a member; the member covers witnessed units only, and land.mjs's `NO-CI-DIR` binds from ms1 on · (B) back-fill a witness per unit (a seat each) | **A** | The ruling's own words, "every unit already landed", read with "ci dir": a unit with no ci dir has nothing to carry |
| **F8** | What of a ci dir rides ms1's landing | (A) the witness, its imported siblings and `BASE` only · (B) the whole dir (`PROOF.md`, `LEDGER.jsonl`, `out/`, `run_mutants*`) | **A** | `out/` files are captured outputs; the names gate (Q4, `land.mjs:134`) must pass over every new file. A carries the fewest bytes past it |
| **F9** | `ci/mcr/` holds two units (mjd3, mjd4) | (A) `ci/mcr/BASE.<unit>` per witness · (B) split into `ci/mjd3/` and `ci/mjd4/` on ms1's landing (the witness files' bytes unchanged, their home moved) · (C) one BASE per dir and one of the two goes to F7 | **B** | B keeps "one dir, one unit, one BASE" true for every later unit |
| **F10** | Where hermetic witnesses live: `ci/witness/<unit>` (`land.mjs:15`, `:39`) or `ci/<unit>/` (every one written) | (A) `ci/<unit>/`, and `WITNESS_DIR` becomes `ci/` · (B) move every witness to `ci/witness/<unit>/` on ms1's landing | **A** | M8: zero files exist at `ci/witness/` on any branch (18 Nov 2026 survey) |
| **F11** | Three witnesses are RED at head on a behavioural clause (§0.3: mjd3 J4 · mtail T3 · mjud M3 M5 M6) | (A) each is a RED member, and ms1 cannot land GREEN until each is resolved · (B) **ms1 lands first with the units that are GREEN under F1-A** (and F5); each of the three gets its own re-judge seat in parallel (a regression is fixed; a superseded ruling gets its witness re-cut and its BASE re-taken) and rides its own land branch under B3 (ii) · (C) a KNOWN_RED entry per clause (`organism_test.mjs:2738` `rulingOf`). C rules the suite's exit, but the neutral verdict still counts the clause as a new red, so C does not land ms1 | **B** | §0.3, per unit. B keeps the runner moving (his word 243): ms1 does not wait on three judgements |
| **F12** | Does the member also re-take each witness's RED at BASE (`--org BASE`) on every run, to prove the witness still discriminates? | (A) no; once, at the seat, recorded in PROOF · (B) yes, every run (doubles the seconds) | **A** | §0.3's base-leg column against B5's budget, his call |

---

## 4. NAMED, NOT GUESSED

- **N1** The memory MCP (`organism-memory`) did not connect in this seat; no `get_context` was read, and nothing here rests on it.
- **N2** **The Windows minutes.** §0.3 is Linux. The runner's per-unit seconds come from the member's own seconds lines (W-B5.1) on the first CI run of the ms1 build. On his laptop: `node ci/<unit>/witness_<unit>.mjs --org <LF tree> --base-org <LF tree>` timed, for the order of magnitude only (the laptop never judges, B2).
- **N3** Whether `git -c core.autocrlf=false -c core.eol=lf checkout` into a temp work tree gives LF bytes on the Windows runner. Linux cannot show it. Measured by W-B1.2 on the runner, or on his laptop by the same command and `node -e` counting `\r` in one checked-out file.
- **N4** Whether the four fixed ports of M11 other than the judge's are free on the runner. Irrelevant under B4 (no witness may bind them), named because the B4 read is what makes it irrelevant.
- **N5** The rows 1053, 1054 and 1055 themselves. I have only the words this seat's brief quotes; "witnesses may bind ports (row 1053)" is taken from that quote.
- **N6** Whether a branch that holds a BASE (F6) is ever deleted, and when GitHub would collect an unreachable commit. Not visible from the API without a token; the branch list is the only reachable truth (`git ls-remote origin`).
- **N7** The `CHECKPOINT` contract with the runner: whether the runner reads this file or only the final message. Assumed both.

---

## 5. Files a build would touch

| File | What changes | Owner law |
|---|---|---|
| `scripts/organism_test.mjs` | new mode `witnesses` (B1, B2, B4, B5, B6) and its key in `MODES` | the suite; writes nothing outside `os.tmpdir()` |
| `ci/ms1/witness_ms1.mjs` | **new**: the W-* clauses on plants | — |
| `ci/ms1/run_mutants_ms1.mjs` | **new**: one mutant per clause, μ above | — |
| `ci/<unit>/BASE` × every unit of §0.2 | **new**, one sha line | — |
| `ci/<unit>/witness_<unit>.mjs` + imported siblings × every unit of §0.2 | **carried** from their build branches, bytes unchanged (F8, F9) | — |
| `scripts/land.mjs` | step 5 `NO-CI-DIR` (B3 ii); `WITNESS_DIR` per F10 | sole writer of nothing in state (`:5`) |
| **beyond these, as forks** | `scripts/ci_verdict.mjs` `keyOf` (F4-A) · `scripts/keeper.mjs` env door (F5-B) · `.github/workflows/suite.yml` (F3-B only; F6-A keeps `:72` as it is) | — |

---

## 6. CI — the neutral machine's verdict on this branch

Read through the public API with curl, no token: `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`.

**Push `28ae3b9` (18 Nov 2026), read with curl, no token:** workflow run `44373592870` (suite) · completed · **success**.
Check runs: `135046667808` npm test · node 22 → success · `135046668307` npm test · node 24 → success.

The push carrying this line is judged again; its run ids and verdict are in `ci/ms1/LEDGER.jsonl` (act `ci-read`) and
in the seat's final message.
