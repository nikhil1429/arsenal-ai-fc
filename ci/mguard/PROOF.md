# mguard · THE SPEND GUARD — BUILD PROOF (forks rows 1176 / 1177 (3), 20 Nov 2026 UTC)

Branch `claude/mguard-build`, cut from `origin/main` at **`5759cce`** (`5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`, fetched
20 Nov 2026 UTC; `ci/mguard/BASE`). Spec: `ci/mguard/MGUARD_SPEC.md` on `claude/mguard-spec` at `4eb934d`, read whole with
its ledger. `scripts/usage_tap.mjs`, `scripts/presence.mjs` and `.claude/skills/runner/SKILL.md` are byte-identical
between the spec's base `fb42118` and `5759cce` (`git diff --stat fb42118 5759cce -- <the three>` printed nothing), so
every spec `file:line` holds at this base. Ledger: `ci/mguard/LEDGER.jsonl`. Nothing was landed, merged or opened.

## Built — row 1176 (1)–(3) and row 1177 (3)

| row / fork | what the build does | file |
|---|---|---|
| **(3) FIRST CLAUSE** | no root variable ⇒ the statusline line (and a stderr line) reads `RED · usage tap · no campaign root (ARSENAL_CAMPAIGN_ROOT unset) — this reading (five-hour N% · weekly N%) is DROPPED, nothing written`; `status`, `verdict` and `need` read RED by the same name (verdict still refuses by exit 3). A write that throws reads RED the same way. Exit 0, one line, inside the bound — fail open never fails open INTO a reading-shaped line | `scripts/usage_tap.mjs` |
| G1 A | the reading history `usage_readings.jsonl` beside the reading in the campaign root, appended by statusline and panel only when a pct or a reset moved (dedupe by value) or when the row records what the line showed | `scripts/usage_tap.mjs` |
| G2 A | presence's focus row records `away: [[startIso, endIso], …]` and `back_at`; read-only reader `awaySpans` (bounded tail read) | `scripts/presence.mjs` |
| G3 A | `spanSpend` (PURE): a reset inside the bracket, or an unknown reset, makes that window UNREAD | `scripts/usage_tap.mjs` |
| G4 A, as stricter | selftest W3.1 now names EXACTLY THREE writes (the reading's tmp, its rename, the history's one append); W3.3: the history's name has one home in code | `scripts/usage_tap.mjs` |
| G5 A | read and show only: no stop, no throttle, no card | — |
| G6 A (B fallback) | the statusLine prints `back · away <span> IST · spent five-hour +a% weekly +b% · left five-hour x% weekly y%` (or `spend unread (<why>)`) and the history row carries `shown`. G6 B, the learn-start note, is the named fallback and is NOT built | `scripts/usage_tap.mjs` |
| G7 A | the tap reads presence through `awaySpans` (presence's own reader), imported only on a render with a root. The render time is measured on his laptop at the re-run (below), never guessed | `scripts/usage_tap.mjs`, `scripts/presence.mjs` |
| G8 | `scripts/organism_test.mjs` OUT (the witness walker covers `ci/mguard/witness_mguard.mjs`); the runner skill line IN | `.claude/skills/runner/SKILL.md` |
| row 1177 (3) | a day with NO away-span rows reads `U1177 · UNREAD · no away-span rows …` in the judge: never a day with no spend. Planted both ways (clause U1177) | `ci/witness/mguard/witness_guard.mjs` |
| P5 | the real-day judge `node ci/witness/mguard/witness_guard.mjs --day <D> [--org <dir>]`: exit 0 holds · 1 red · 2 unread | `ci/witness/mguard/witness_guard.mjs` |

**G7's measurement, by command (his laptop, at the re-run; the number is NOT measured here):** with the root set and a
saved statusLine stdin block, `Measure-Command { Get-Content block.json | node scripts/usage_tap.mjs statusline }` at
`5759cce` and again at this build (bash: `time (node scripts/usage_tap.mjs statusline < block.json)`). The fail-open
guard inside the tap is unchanged and still ends the render inside the ruled bound.

## The witness, both ways (by last line, 20 Nov 2026, this cloud container)

```
node ci/mguard/witness_mguard.mjs --org . --base-org <LF tree of 5759cce>
GREEN MGUARD the spend guard · 7 clause(s)                                   (exit 0)

node ci/mguard/witness_mguard.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>
RED MGUARD · JUDGE                                                           (exit 1)
```

Clause by clause (build / base): R1176.3 GREEN / RED · U1177 GREEN / RED · G1 GREEN / RED · G2 GREEN / RED ·
G3 GREEN / RED · G4 GREEN / RED · LAST ok. The judge on a planted base copy reads `READER · UNREAD` (exit 2): at
`5759cce` c31 is UNREAD, never green.

## The mutants (20 Nov 2026)

```
node ci/mguard/run_mutants_mguard.mjs --org . --base-org <LF tree of 5759cce>
  M0 → R1176.3 · M1177 → U1177 · M1 → G1 · M2 → G2 (also G4) · M2b → G2 · M3 → G3 · M4 → G4
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

## Selftests touched, by headline (20 Nov 2026)

```
node scripts/usage_tap.mjs selftest | tail -1     before (5759cce): usage_tap selftest 31/31 — all clauses hold
                                                  after  (build):   usage_tap selftest 45/45 — all clauses hold
node scripts/presence.mjs selftest | tail -1      before: ALL CHECKS PASSED      after: ALL CHECKS PASSED (six MGUARD checks added)
node scripts/models.mjs check ; echo exit $?      models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0) · exit 0
```

## Members touched, before and after

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 20 Nov 2026, this container (`npm ci` of the pinned
lockfile first). BASE ran on an LF tree of `5759cce` made a git repo; the build ran in the clone.

```
                                                       BASE 5759cce        BUILD
SUITE MEMBER · usage_tap selftest exits 0               ok                  ok
SUITE MEMBER · presence selftest exits 0                ok                  ok
MPOOL · usage_tap selftest runs in the hermetic chain   ok                  ok
WITNESSES (the walker)                                  SKIP (neutral machine only, B2) — both
last line (BASE)   organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
last line (BUILD)  organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
```

The build's one red, `EVERY organ with a selftest is wired into a suite` (orphaned: deck_lint, home_pin, probe,
study_scope), is also on BASE, and none of its organs is touched here. BASE's two other reds (`SUITE MEMBER · sandbox
selftest exits 0` and the all-members line that it carries) come from that scratch tree's sandbox canary. They are not
on the build run.

## The law pack counts (row 1130 (2)), by command, on LF trees (20 Nov 2026)

`node scripts/lawpack.mjs gate`, each tree an LF checkout through a private index, made a git repo with
`core.autocrlf=false`, `node_modules` linked from an `npm ci` of the pinned lockfile:

```
BASE  5759cce · lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
BUILD          · lawpack · 1945 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```

Every judged count is EQUAL; no count rises. Both trees print the same one RED,
`jugad-literal-subject-list ROSE — 93, baseline 90`. It is on BASE as cut, so it was not raised here (FORK F8).

## Canon-count replay (row 1169), over COMMIT blobs

The suite's LOAD ZERO BLOCK 7 law, replayed with `git show <sha>:<path>` over every tracked `.md` outside
`docs/archive/`, before each push that touched markdown: `canon replay <sha> · … · undeclared 0 · declared 1`
(the one declared line is main's own). Run again on the tip that carries this file.

## The neutral machine (public API, curl, no token)

Check runs read at `api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` and `…/check-runs/<id>/annotations`:

- `fa7c18f`: 136024667228 / 136024666833 · cancelled (superseded by the next push)
- `37d6a32`: 136026011388 / 136026010983 · cancelled
- `13f6889`: 136026941301 (node 22) / 136026940969 (node 24) · superseded
- **`1fe86f6`: 136027924936 (node 22) · failure · 136027925181 (node 24) · failure.** Both legs carry the same B1_VERDICT:
  `RED · "1 member(s) red that are not red at the merge base" · new: ["WITNESS ‹mpool› · GREEN at head against its BASE"]
  · base_red 1 · fixed 0 · pass 229 · fail 2 · live 126 · profile hermetic`. The ONE new red is F1 below, and it is the
  red this proof predicted. The `WITNESS ‹mguard›` member is not in the new-red list. BASE `5759cce` reads success on both legs
  (135919452425 / 135919452846).

**The verdict of the last push is RED, by F1 alone.** The fix is in `ci/mpool/witness_mpool.mjs`, a file this build may
not touch. It goes to the architect.

## RESUME · merge of main 7bf008b (21 Nov 2026, forks rows 1233 (2) / 1236)

The order was `git fetch origin main` (FETCH_HEAD `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`), then `git merge --no-edit FETCH_HEAD`
into `claude/mguard-build`. That made merge commit **`1917b8d8653a7ac640253d32fca51e09943d5f49`**: no rebase, no force.
Every landed line of the other units is kept. `scripts/organism_test.mjs`, `package.json` and `ci/` merged clean, and git
named exactly two conflicts:

- `scripts/presence.mjs`, header: unit mpres's new LAWS lines are kept verbatim ("NEVER silent", presence_input.json,
  "Sole writer of presence_log.jsonl + presence_input.json"). Mguard's AWAY SPANS note follows them. Mguard's copy of the
  old two lines it replaced is dropped.
  Exports: both units' lines are kept (`inputSnapshot, launcherDoor, PINPUT` and `backAt, awayFields, awaySpans, closedOf`).
- `scripts/usage_tap.mjs`: unit mlaw's one-path `LAW_HOME = "tools/model_law.mjs"` (and its comment) is kept, plus mguard's
  `HISTORY_NAME`. Mguard's segment-pair `LAW_HOME` is dropped. Every use of it is a `join(root, LAW_HOME)`, which takes
  either shape.

Read on the merged tree:
- `usage_tap selftest 45/45 — all clauses hold`
- presence `ALL CHECKS PASSED`
- `node scripts/models.mjs check` exit 0

**BASE is left at `5759cce`.** The brief keys BASE to the main the build was CUT from ("main measured at 5759cce"), not to
a main merged in later. The landed units that merged main after their cut (mpres, mlaw, mcap) kept their cut sha the same
way. The tree at the newer main is also read below, so both bases are on record.

The witness, by last line, on LF trees:

```
--org <merge 1917b8d>  --base-org <LF 5759cce>   GREEN MGUARD the spend guard · 7 clause(s)   (exit 0)
--org <LF 5759cce>     --base-org <LF 5759cce>   RED MGUARD · JUDGE                            (exit 1)
--org <LF 7bf008b>     --base-org <LF 5759cce>   RED MGUARD · JUDGE                            (exit 1)   main as it stands now
run_mutants (--org <merge> --base-org <LF 5759cce>): run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

**mclk:** the witness takes no day from a second clock read. The day it hands the judge is `p.day`, the IST day of the
presence row its own planted pass wrote. Every history row is stamped off the same pass instants, so a plant near IST
midnight judges the day its rows were written on.

The law pack on LF trees:
- main `7bf008b`: `jugad-literal-subject-list 90 · bare-catch 37 · receipt-testimony-read 5 · import-time-registry-read 2
  · depcruise_errors 7`, the rest 0. `lawpack: GREEN`.
- the merge: the same counts. `lawpack: GREEN`.

No count rises, and F8's 93 → 90 was cleared on main by unit mlaw.

The mpool witness on the merged tree (`--base-org <LF b1fc984>`) still reads `RED MPOOL · W3.1`: F1, unchanged. Main
`7bf008b` reads `GREEN MPOOL the usage tap · 33 clause(s)`.

The four legs on `1917b8d` were **cancelled, never run** ("Canceling since a higher priority waiting request for
suite-refs/heads/claude/mguard-build exists"), because the push of `7819b97` replaced them. `7819b97` carries the same
merged code plus the proof and ledger rows. Its legs, read by curl:

- 136776521308 (hermetic twice · node 22) · **success**
- 136776521620 (hermetic twice · node 24) · **success**
- 136776521557 (npm test · node 22) · **failure**. B1_VERDICT RED, base `7bf008b`, "3 member(s) red that are not red at the
  merge base".
- 136776521470 (npm test · node 24) · **failure**. B1_VERDICT RED, base `7bf008b`, "2 member(s) red that are not red at the
  merge base", base_red 0, pass 270.

The new reds, each with its cause:

1. **`CLAUSE WITNESS · ci/witness/mguard/witness_guard.mjs plants — exit 0, every plant as expected (n > 0)`, both legs.
   A real red of the merge, in this unit's file.** Main gained unit mmeter's CLAUSE WITNESSES member after this unit's cut
   (`scripts/organism_test.mjs` `clauseWitnesses()`). It runs every `ci/witness/<unit>/witness_*.mjs` in a `plants` mode
   and needs `PLANTS <unit> · k of n plant(s) as expected` with k = n > 0. The judge had no such mode: it answered
   `plants` with its usage line and exit 3.
   **Fixed in this unit's own file:** the judge now has a `plants` mode (header PLANTS). It plants every clause both ways
   under one temp dir and runs the judge itself on each plant. The day comes from one clock read, as unit mclk requires:
   its IST day, with every stamp an offset from that day's IST noon. The tap's history path and figures are asked of the
   org's own tap, never typed.
   Read here: `PLANTS mguard · 15 of 15 plant(s) as expected` (exit 0). Two judge mutants put through the plants mode read
   red by name:
   - U1177 → HOLDS: `CLAUSE U1177 RED · 1/3 plant(s)` · `13 of 15`
   - G4 → never red: `CLAUSE G4 RED · 1/2 plant(s)` · `14 of 15`
2. **`WITNESS ‹mpool› · GREEN at head against its BASE`, both legs: F1, as predicted.** mpool's W3.1 allows two writes and
   G4 A rules three. Its file is not this unit's to edit, so it stays open for the architect.
3. **`WITNESS ‹mlv3› · GREEN at head against its BASE`, node 22 only.** The node 24 leg of the same commit reads it green,
   and this unit touches no file of mlv3. Its causes name mlv3's own worker clause ("T1 · IDLE … a closure write RETIRES
   the worker") and its planted listeners ("LIVE-SAFE · the real :4112 and :4113 are held by planted counting listeners").
   It is named, not retried, and not fixed here: a red on one leg of two for unchanged bytes is mlv3's to read.

After the fix, on the merged tree:
- the witness reads `GREEN MGUARD the spend guard · 7 clause(s)` at the build and `RED MGUARD · JUDGE` at the base
- `run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN`

The neutral legs of the push carrying the fix are recorded in the next commit, as read, with no retry.

CHECKPOINT · 21 Nov 2026 · merge `1917b8d` (main 7bf008b merged in); its legs were cancelled by the next push · `7819b97`: hermetic
136776521308 / 136776521620 GREEN, npm test 136776521557 / 136776521470 RED. The reds: (1) CLAUSE WITNESS mguard plants, fixed
in the judge; (2) mpool F1, open; (3) mlv3 on node 22 only, not this unit's. Witness GREEN at build and RED at base, mutants
7 of 7, plants 15 of 15.

## CHECKPOINT · merge of main 84cbc03 (22 Nov 2026, forks row 1298 (3))

**The legs of `042a9bb`, read once by curl:**
- hermetic twice: 136820633170 (node 22) and 136820633079 (node 24) · **success**
- npm test: 136820633253 (node 22) and 136820633221 (node 24) · **failure**. Both carry the same B1_VERDICT RED, base
  `7bf008b`: "1 member(s) red that are not red at the merge base", new `["WITNESS ‹mpool› · GREEN at head against its
  BASE"]`, base_red 0, pass 271, fail 1.

So the plants-mode fix cleared the CLAUSE WITNESS red, the mlv3 red of node 22 did not recur, and the one red left is F1.

**The merge.** `git fetch origin main` gave FETCH_HEAD `84cbc03126eddb85c7d5cf54b51610068800315c`. Then
`git merge --no-edit 84cbc03…` made merge commit **`d024e4289d716d4ad0887f48e3978b0325702a35`**: no rebase, no force.
Git named ONE conflicted file, `scripts/presence.mjs`, with ONE hunk:

- **Hunk 1 · the `export { … }` list (the conflict at line ~1489).** Mguard's side added the comment
  `// unit mguard (row 1176 G2 A / G7 A) — the recorded away spans and their read-only reader` and
  `backAt, awayFields, awaySpans, closedOf`. Mpres2's side added `// unit mpres2 — the reason, the launcher read, the reopen
  set` and `fetchAwRead, awReason, launcherRunning, launcherLeaf, listByLeaf, REOPEN`. **Both are kept, verbatim**:
  mpres2's two lines first, mguard's two after, with no name shared and none dropped.

The rest of mpres2's change to `scripts/presence.mjs` (177 insertions / 18 deletions vs `7bf008b`) auto-merged. Mguard's
`awayFields(afk)` still rides the focus row: `{ ts, day, kind: "focus", ...f, ...awayFields(afk), tone, posted }`.

**Selftests on the merge:**
- presence: `ALL CHECKS PASSED`
- `usage_tap selftest 45/45 — all clauses hold`
- `node scripts/models.mjs check`: exit 0

**`ci/mguard/BASE` = `84cbc03126eddb85c7d5cf54b51610068800315c`**, by the runner's order (row 1298 (3)). This supersedes
the 21 Nov choice above to keep `5759cce`.

**The witness both ways, on LF trees, base = LF `84cbc03`:**

```
--org <merge d024e42>  --base-org <LF 84cbc03>   GREEN MGUARD the spend guard · 7 clause(s)   (exit 0)
--org <LF 84cbc03>     --base-org <LF 84cbc03>   RED MGUARD · JUDGE                            (exit 1)
```

Each clause reads `build GREEN · base RED`:
- **R1176.3**: no root variable → RED by the door's name, the reading named DROPPED.
- **U1177**: a day with no away-span rows → U1177 UNREAD by name.
- **G1**: AFK and return → away + back_at recorded, the closed span found; still away → G1 UNREAD.
- **G2**: the bracket names only the span's spend; a stale edge row → unbracketed, G2 UNREAD.
- **G3**: exactly one writer; a planted second writer → G3 RED.
- **G4**: `shown` equal to the read → exit 0; a planted wrong `shown` → G4 RED.
- **LAST**: no node process naming the temp dir survives.

**Mutants:** `run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN` (7/7).

**The judge's plants mode** (the suite's CLAUSE WITNESSES member): `PLANTS mguard · 15 of 15 plant(s) as expected`.

**The law pack:** on the merge tree and on LF `84cbc03` alike, `jugad-literal-subject-list 90 · bare-catch 37 ·
receipt-testimony-read 5 · import-time-registry-read 2 · depcruise_errors 7`, the rest 0. `lawpack: GREEN — no law's
finding count rose`.

**The push.** Pushed ONCE, with `[skip ci]` in the head commit message, by the runner's order, so no leg runs on this
tip. Carried open: **F1** (mpool W3.1's two writes vs G4 A's three), still the architect's.

## CHECKPOINT · merge of main 722b72e, the own-source pin resolved (23 Nov 2026, forks rows 1300 (1) / 1328 (3))

**The merge.** `git fetch origin main` gave FETCH_HEAD `722b72e106c9f28485afe5bcc8d5f56402aecc43`, with units mpinl and mpinr on it.
`git merge --no-edit FETCH_HEAD` made merge commit **`83fcb0c24a818ef109ebb0e9dd50b29cefb2092b`**, with **no conflict**. Then
`ci/mguard/BASE` = `722b72e106c9f28485afe5bcc8d5f56402aecc43`. `scripts/organism_test.mjs` is not touched by this unit (the order).

**The pin, resolved with no waiver.** The law is the own-literal pin law (lawpack rule `own-source-pin-unresolved`, frozen
baseline 79, `scripts/lawpack.mjs:162`), read with mpinr's pin reader (`scripts/own_source.mjs`) on the tree.
- **The site:** `scripts/usage_tap.mjs` selftest W3.3. It was `(code.match(/usage_readings/g) || []).length === 1` over
  the file's own text: a pin on its own source that the range evaluator does not resolve.
- **The repair, by READ, not by text** (own_source.mjs's second repair class; no selftest needle of the file's own text).
  W3.3 now runs after every CLI mode of the selftest has worked on its temp root. It asserts that the only files the tap
  left on that root are exactly `basename(readingPath(root))` and `basename(historyPath(root))`, the history's one home,
  and that the history holds rows. A second home or a stray write would be a further file there.
- **Mutant:** a planted second history append reads `FAIL W3.3` (and W3.1), and the selftest reads 43/45. Unmutated it reads
  `usage_tap selftest 45/45 — all clauses hold`.
- **The count, by `node scripts/lawpack.mjs report`, read to its last line:**
  - **before** (the merge `83fcb0c`): `own-literal-pin 39 · own-source-pin-unresolved 80`, last line
    `lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)` (`own-source-pin-unresolved ROSE — 80, baseline 79`)
  - **after** (`cfcc5c8`): `own-literal-pin 39 · own-source-pin-unresolved 79`, last line
    `lawpack: GREEN — no law's finding count rose, and every rule is on disk`

  Every other count is equal: jugad 90 · bare-catch 37 · receipt 5 · import-time 2 · depcruise 7, the rest 0.

**Selftests on the tree:**
- `usage_tap selftest 45/45 — all clauses hold`
- presence: `ALL CHECKS PASSED`
- `own_source selftest: 30 passed, 0 failed`
- `node scripts/models.mjs check`: exit 0

**The witness both ways (LF trees):**

```
--org <tree cfcc5c8>   --base-org <LF 722b72e>   GREEN MGUARD the spend guard · 7 clause(s)   (exit 0)
--org <LF 722b72e>     --base-org <LF 722b72e>   RED MGUARD · JUDGE                            (exit 1)
```

R1176.3 · U1177 · G1 · G2 · G3 · G4 each read `build GREEN · base RED`, and LAST is ok.

**Mutants:** `CONTROL · GREEN MGUARD the spend guard · 7 clause(s) (exit 0)` · `run_mutants: 7 of 7 mutant(s) RED by the
clause that names them · control GREEN`.

**The judge's plants mode** (CLAUSE WITNESSES): `PLANTS mguard · 15 of 15 plant(s) as expected`.

**The WITNESSES member over the tree.** Command: `GITHUB_ACTIONS=true GITHUB_WORKSPACE=<repo> ORGANISM_TEST_PROFILE=hermetic
node scripts/organism_test.mjs witnesses`, every unit's BASE commit present (three fetched by sha). Its last line:
`organism_test: 155 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 0`. Every red:
1. `WITNESS ‹mpool› · GREEN at head against its BASE`, red beyond BOUND: **W3.1**. This is **F1**: mpool allows the tap
   two writes, and G4 A rules three.
2. `WITNESS ‹mxb› · GREEN at head against its BASE`, red beyond BOUND: **W7**. This is **NEW, F13**. mxb's W7 pins xray's Q6
   to exactly `[usage_reading.json<usage_tap.mjs]`. On this tree Q6 reads
   `[usage_reading.json<usage_tap.mjs, usage_readings.jsonl<usage_tap.mjs]` (LF and CRLF), because the history row 1176
   G1 A rules is a second file the tap writes outside the repo. On LF `722b72e` the same witness reads `GREEN W7` and
   `GREEN MXB … 13 clause(s)`. The cause is this unit's ruled write, and its file is mxb's, not this unit's.

**What is left (for the architect):** F1 and F13 are the same shape. A landed unit's witness pins the tap's write set as
it stood before G4 A. Each needs either its pin moved to the three-write tap (the reading, its rename, the history) or a
ruled KNOWN_RED row. This unit does not edit either file. Every other open question stands as listed below.

## FORKS

- **F13 · the mxb witness's W7 against G1 A / G4 A.** `ci/mxb/witness_mxb.mjs:141` pins xray's Q6 to the tap's ONE outside-repo write. The ruled history is a second, so W7 reads RED at this tree and GREEN at main 722b72e. It is not this unit's file: architect.

- **F1 · the mpool witness's W3.1 against G4 A.** `ci/mpool/witness_mpool.mjs:157-160` (a landed unit's witness, judged
  at HEAD by the suite's walker) asserts that the tap makes EXACTLY TWO writes. Row 1176 G4 A rules three. At this build
  `node ci/mpool/witness_mpool.mjs --org . --base-org <LF tree b1fc984>` reads `RED MPOOL · W3.1`, and every other clause
  of it stays green, so on the neutral machine the WITNESSES member `WITNESS ‹mpool› · GREEN at head against its BASE`
  is expected RED. `ci/mpool/` is not a named file, so it was NOT edited. The fix is the architect's: either that clause
  counts the three writes G4 A names, or a KNOWN_RED row. The ruling was not bent to dodge it (the history is a true
  one-line append, not a tmp+rename rewrite).
- **F2 · two witness paths.** The spec puts its witness at `ci/witness/mguard/witness_guard.mjs`, and the real-day judge
  (P5) is built there. The suite's walker (`scripts/organism_test.mjs:2800`, `witnessFile`) only finds
  `ci/<unit>/witness_<unit>.mjs`, so the plant witness the brief names is `ci/mguard/witness_mguard.mjs` and runs
  `--org`'s judge. Both paths are named in the brief.
- **F3 · `shown` is a list.** The spec writes `shown: { span, five, week }`. The build writes
  `shown: [{ span, read, why, bracket, five, week }]`, so two spans closed in one presence row are both recorded (G4
  covers "every READ span"). The line names the newest span plus "(+k earlier span(s) recorded)".
- **F4 · G3's scope.** The spec scans "the tracked tree". The judge scans `scripts/*.mjs` (the organs, the owners-only
  law's domain), with comments stripped. A writer is a file that names the history (its name, or the tap's
  `historyPath(` door) AND carries a write call. The history's name has ONE home (tap selftest W3.3), and everyone
  else derives the path from `historyPath`.
- **F5 · dedupe by value has a cost.** Suppose a span has no percent change across it and its edge rows are older than
  the age bound. It reads UNREAD (unbracketed): stricter, never a green. How often that happens is measured from the
  history on his laptop.
- **F6 · a new READ door, `ARSENAL_PRESENCE_LOG`** (default absent ⇒ presence's own ledger). The tap and the judge
  honour it. The tap's selftest uses it to stay off his live ledger. It reads only, and no organ writes through it.
- **F7 · G4's "first history row".** This was narrowed to the first `source: statusline` row at or after the presence
  row that first closed the span. A `his-panel` row never carries `shown`.
- **F8 · BASE's law pack is already RED** (`jugad-literal-subject-list` 93 vs baseline 90 at `5759cce`, this container).
  It is not raised here. Whether the neutral machine sees the same is read from its law-pack member.
- **F9 · G6 B (the learn-start note) is not built:** it is the ruled fallback, for a span after which no render follows.
- **F10 · the statusline's write-failure path also reads RED.** This extends row 1176 (3) to the one other place where a
  reading could vanish while a line still printed.
- **F11 · hermetic suite in this container:** see "Members touched". The bare `npm test` was never run whole.
- **F12 · the session-start hook rewrote a tracked state file** (`dressing-room/state/brief_log.jsonl`) in this working
  tree. It was never staged, committed or read.
- **Ruling vs spec, named:** the ruling adds R1176.3 (not in the spec) and the peer ruling row 1177 (3) adds U1177. G8
  drops the spec's suite-file plant. G7's number is deferred to his laptop.
- **Not mine, per row 1176 (4)/(5):** no variable was set and no settings file of any kind was written; the zero
  sense-pass reads are the runner's.

## NAMED NOT GUESSED

N-G1 … N-G6 of the spec stand unchanged (his AFK data, the campaign launch ledger, whether the sense pass runs while
he is away, whether his surface renders statusLine with the root set, the render wall time, the age bound's value).
