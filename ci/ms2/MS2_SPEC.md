# ms2 — SPEC (cloud spec seat, 19 Nov 2026)

Unit **ms2** · forks rows 1066 F1 (C) / 1108 / 1109 · branch `claude/ms2-spec`, cut from `origin/main` @ **`95b07a6`**
(`git fetch origin main`, then `git checkout -b claude/ms2-spec FETCH_HEAD`, 19 Nov 2026 UTC). It builds on unit **ms1**
(`claude/ms1-build` tip **`3981f36`**, NOT on main at the cut). This file builds nothing. Every number below was measured
on 19 Nov 2026 by the command named beside it, or is read from ms1's `ci/ms1/PROOF.md` (§5.1 Linux, §5.3 neutral,
18 Nov 2026) and says so. Linux figures come from this container (node v22.23.5). The ledger is `ci/ms2/LEDGER.jsonl`.

## 0. Headline

**Fate C is measured to hold and ms1's fate A is measured to be too weak at one end and too strong at the other.**
Each carried witness, run at its unit's LANDED sha **L** against **P** (the first parent of the unit's first landing
commit, which is exactly what `land.mjs` step 8 judges a live witness against, `scripts/land.mjs:228` on `3981f36`),
is **GREEN with BOUND included** for 23 of the 25 carried units (19 Nov 2026, Linux). The other two are not unit defects.
mtail's BOUND needs git sides, and with them it is GREEN. mpool's witness reads a `PROOF.md` that ms1 did not carry, and
with it it is GREEN. The four units ms1 rules RED at head (mjd3 J4, mtail T3 AUTH, mjud M3/M5/M6, mf2 F2/F4) are all
**GREEN at their own landing**. Their head reds are later, deliberate changes, which is the re-base door's business, not
a defect of the unit.
Against the seat's **BASE** instead of P, 14 units are RED at L by BOUND alone, because other landings sit between BASE and
L. So "against its BASE" cannot judge BOUND at L. P can.
The L-leg roughly doubles ms1's member (projected, §5). It does **not** fit the job's bound as ms1's member is wired now
(head and merge-base trees both run it). It fits without a workflow edit only if the L-leg runs on a changed ci dir alone
AND the merge-base tree stops running the member (fork F5).

## 1. Then-head and the owners

| Path | At `95b07a6` (main) | At `3981f36` (ms1 tip) | Writer (header) |
|---|---|---|---|
| `scripts/organism_test.mjs` | no member | `witnesses()` `:2830`, `judgeLast` `:2796`, `boundIds` `:2794`, `lfTree` `:2808`, `KNOWN_RED` `:2905-2912`, `MODES` `:2951` | "READ-ONLY on dressing-room/state" (`:26`), member "Sole writer of nothing" (`:2758`) |
| `scripts/land.mjs` | parents `:173`, step 5 `:188-193`, step 8 `:209-217` (`--org dT --base-org dP`), ff `:236`, ledger `:250` | parents `:175`, NO-CI-DIR `:196-204`, step 8 `:220-228`, ff `:247`, ledger `:261`, `WITNESS_DIR = "ci/"` `:44` | "SOLE WRITER of: NOTHING in dressing-room/state/" (`:5`), writes only `.git/land_ledger.jsonl` (`:5-6`, `:66`) |
| `scripts/ci_verdict.mjs` | `parseSuite` `:36`, `keyOf` `:46`, `judge` `:63` | `parseSuite` `:36-43`, `keyOf` `:48`, `judge` `:65-69` | writes nothing (reads check runs and suite text) |
| `ci/<unit>/` | only `ci/mday/` | 25 carried dirs + `ci/ms1/` | the unit's own landing commit (not a state file; no organ writes it) |
| `.github/workflows/suite.yml` | `timeout-minutes` `:62`, head step `:109-116`, merge-base step `:122-145`, verdict `:148-157` | unchanged | **not edited by ms2** |

No clause below reads or writes `dressing-room/state`. ms2 adds no state file and needs no other organ's writer.

## 2. THE LANDED SHA — how it is derived (the code path, by file:line)

**What a landing is** (lines on `3981f36`; main's are §1's). `land.mjs` takes `T` = `origin/land/<unit>`. T has one parent P (`:175-176`), and
`origin/main == P` (`:184-186`). There is exactly one commit in `origin/main..T` (`:180-182`). Then
`git merge --ff-only T` (`:246-247`) makes T a **first-parent commit of main whose first parent is the main tip at land
time**. The runner writes T's subject. All 25 carried landings on `95b07a6`'s first-parent line start with
`unit <u> (`. Measured: `git log --first-parent --format='%H %s' origin/main`, one match for 23 units and two for mday and
mpool (code first, the settings line second "by the runner's hand"). No match for ms1, which has not landed. Nothing in
`land.mjs` enforces that subject today (C6 below). The verb's own record of T (`.git/land_ledger.jsonl`, `:261`) lives
inside his clone's `.git` and never reaches CI (§8 N1).

**The rule ms2 builds** (C1):
- **P is READ, never computed.** `ci/<u>/LANDED_ON` holds one 40-hex line: the main tip the landing was cut on (T^1). This
  keeps ms1's ruled B1.3 NOCALC ("the base is read, never computed", `ci/ms1/witness_ms1.mjs:190-197`). At land time,
  `land.mjs` step 5 refuses `LANDED-ON` unless the file equals T's parent (C6). ms2's own build writes the 25 carried values
  from the table in §3. Each was measured as the parent of the unit's oldest `unit <u> (` first-parent commit.
- **L is derived.** Walk the first-parent line of `refs/remotes/origin/main` (the workspace has it: `fetch-depth: 0`,
  `suite.yml:72`). L is the **newest commit of the unbroken run of commits right after P whose subjects start
  `unit <u> (`**. For mday that is `9f6f9ab → cb30003`, so L = `cb30003`. For mpool it is `902b6cc → 89d3e1c`, so
  L = `89d3e1c`.
  Measured: mday's code commit alone is RED `W7.0` against P, because it lacks the settings matcher. The newest commit is
  GREEN with 31 clauses.
- **A landing in flight** (the land/<u> push, the sha the verb will land, C1 of row 1023): if HEAD's first parent equals
  LANDED_ON (read with `git rev-list --parents -n 1 HEAD`) and HEAD's subject starts `unit <u> (`, then L = HEAD.
- **Not landed** (a seat branch, no LANDED_ON): one named line, `  witness ‹u› L · not landed — its L-leg runs at its
  landing`. No L assert is made, and the head leg is judged as ms1 does.
- A seat commit whose subject copies the landing grammar is never taken. It does not sit on main's first-parent line.
  This seat's own `64a08af` (`unit ms2 (forks row 1108 (1)): …`) is such a commit.

## 3. MEASURED — every carried witness at L (19 Nov 2026, Linux; `ci/ms2/LEDGER.jsonl` acts `measure`)

The witness bytes are ms1's carried ones. Sides are LF trees under `os.tmpdir()` made through a private index,
node_modules is linked, claude/gemini are refused on PATH, and every port door is an OS-picked port. The command was
`node <scratchpad>/measure_ms2.mjs` (its body is the member's recipe, plus git sides where marked).

| Unit | L (landed) | P = LANDED_ON | BASE | L vs BASE | L vs P (the L-leg) | s |
|---|---|---|---|---|---|---|
| mcr2 | `e819c0d` | `074ead9` | `d0c8c96` | RED BOUND | GREEN | 2.6 |
| mday | `cb30003` (+`9f6f9ab`) | `b1fc984` | `669200d` | RED BOUND (oldest: W7.0, BOUND) | GREEN (31) | 8.1 |
| mday2 | `54c5dce` | `3e3ce63` | = P | GREEN | GREEN | 1.4 |
| mdn2 | `d0c8f06` | `cb30003` | `4d166d3` | RED BOUND | GREEN | 28.1 |
| mdone | `4d166d3` | `669200d` | = P | GREEN | GREEN | 66.8 |
| mf2 | `7fde711` | `e4a4f2c` | `15edfec` | RED BOUND | **GREEN** (F2, F4 green at L) | 206.2 |
| mf4 | `ffe3213` | `c56b0a8` | `5767e21` | RED W6 BOUND | GREEN | 1.8 |
| mfac | `a18c167` | `89d3e1c` | `7c3c279` | RED W3.2 BOUND | GREEN (28) | 11.7 |
| mgrd | `0b209b2` | `15edfec` | = P | GREEN | GREEN | 5.1 |
| mgs | `3824171` | `54c5dce` | `7c3c279` | GREEN | GREEN | 4.4 |
| mjd3 | `3a73782` | `e819c0d` | `074ead9` | RED BOUND | **GREEN** (J4 green at L) | 10.9 |
| mjd4 | `15edfec` | `3a73782` | = P | GREEN | GREEN | 2.1 |
| mjd5 | `e4a4f2c` | `0b209b2` | `15edfec` | RED BOUND | GREEN | 2.5 |
| mjd6 | `b1fc984` | `90f55dd` | `4d166d3` | RED BOUND | GREEN | 2.3 |
| mjud | `9ff901a` | `ffe3213` | `5767e21` | RED BOUND | **GREEN** (M3, M5, M6 green at L) | 1.5 |
| mland | `33d1432` | `7fde711` | = P | GREEN | GREEN (19) | 21.4 |
| mlj | `3e3ce63` | `7c3c279` | `4d166d3` | RED BOUND | GREEN | 10.2 |
| mlv0 | `009f52e` | `33d1432` | `15edfec` | RED BOUND | GREEN | 0.7 |
| mlv1 | `669200d` | `009f52e` | = P | GREEN | GREEN | 2.0 |
| mlv2 | `5e43987` | `4d166d3` | = P | GREEN | GREEN | 2.4 |
| mlv3 | `90f55dd` | `40347a6` | = P | GREEN | GREEN | 1.6 |
| mpast | `d0c8c96` | `9ff901a` | `c56b0a8` | RED BOUND | GREEN | 8.6 |
| mpm | `c56b0a8` | `5767e21` | = P | GREEN | GREEN | 2.0 |
| mpool | `89d3e1c` (+`902b6cc`) | `3824171` | `b1fc984` | RED WA.i, S | RED WA.i, S as carried · **GREEN (33) with `ci/mpool/PROOF.md`** | 4.8 |
| mtail | `074ead9` | `76b0626` | `d0c8c96` | RED BOUND | RED BOUND (plain sides) · **GREEN with git sides** (T3 AUTH green at L) | 20.9 |

**Three facts the table forces, each a clause below:**
1. **The L-leg's base is P, not BASE** (14 RED-by-BOUND rows). That is fork F1, measured. mfac's `W3.2` and mf4's
   `W6 BOUND` are BOUND-shaped. W3.2 is "land.mjs byte-identical to base" (`ci/mfac/witness_mfac.mjs:237-241`).
2. **The sides of the L-leg are git trees**: `git init` and one commit, the `ci/mtail/sides.mjs` shape. mtail's BOUND reads
   `git -C <side> ls-files` (`ci/mtail/witness_mtail.mjs:242-258`). ms1's head leg drops BOUND, so this never showed
   there.
3. **ms1's carry of mpool is incomplete.** `ci/mpool/witness_mpool.mjs:54-56` reads `PROOF.md` beside itself for the
   SETTINGS line, and ms1 carried only the witness. Measured on ms1's own tip: `RED MPOOL · WA.i, S` at head. That is
   an **unruled** red member beyond ms1's four. Likewise `RED MFAC · W3.2 BOUND` at head, because ms1 itself changed
   land.mjs on purpose. Neither is in `KNOWN_RED`, and ms1's last push `3981f36` was cancelled on the neutral machine
   (§9), so neither has been judged there yet. **For the architect: ms1 as it stands would land two unruled reds**
   (Q1).

## 4. THE CLAUSES (code path · files:lines at then-head · witness clauses · one mutant each)

The witness is `ci/ms2/witness_ms2.mjs --org <build> --base-org <base>`. Its base is main once ms1 has landed (fork F7).
Every plant is a throwaway git repo under `os.tmpdir()` (a bare origin and a clone, `core.autocrlf=false`). A member plant
holds the tree's `scripts/organism_test.mjs` and `.github/workflows/suite.yml`, plus a planted `ci/pu/` whose witness is a
few lines of node that print a marker naming its `--org` and `--base-org` and then a chosen LAST line. The member always
runs over the PLANT, never over a real witness. Each clause must be RED on `--base-org` and GREEN on `--org`, unless it is
marked GUARD (GREEN on both). The mutant runner `ci/ms2/run_mutants_ms2.mjs` applies one textual mutant per clause to a
copy of the build tree and must see exactly that clause RED.

### C1 · THE L-LEG (organism_test.mjs, inside `witnesses()` after the head leg, `:2875-2881` on `3981f36`)
Code path: for each unit, read `ci/<u>/LANDED_ON` (40-hex, or the not-landed line). Derive L as in §2 with
`git rev-list --first-parent --format=%H%x09%s refs/remotes/origin/main` (no merge-base, no `^1`, no `HEAD^`, so B1.3
holds). Build `lfTree(L)` and `lfTree(P)`, each followed by `git init -q && git add -A && git commit -q` inside the side
(the sides.mjs shape). Run the witness exactly as the head leg does. Judge the **LAST line in full: nothing is dropped,
BOUND included**. Assert `WITNESS ‹u› · GREEN at its LANDED sha against its landing's parent` with detail
`red at L: <ids>`. One seconds line: `  witness ‹u› L <s> s · <LAST>`.

| Clause | Plant | RED on base (`3981f36` shape) | GREEN on build | Mutant |
|---|---|---|---|---|
| W-L1 READ | origin main: P → L (`unit pu (`) → X; `ci/pu/LANDED_ON` = P | no L assert (ms1 has no L-leg) | the witness's marker names org = L, base = P | org = HEAD instead of L |
| W-L2 RUN | P → L1 → L2 (both `unit pu (`) → X | no L assert | org = L2 | take the oldest of the run |
| W-L3 SPOOF | a seat commit `unit pu (` with parent P, merged as 2nd parent | no L assert | org = the first-parent L, never the seat commit | walk every parent (drop `--first-parent`) |
| W-L4 INFLIGHT | origin main = P, HEAD = one commit `unit pu (` on P | no L assert | org = HEAD | drop the in-flight rule (not-landed line instead) |
| W-L5 NOTLANDED (GUARD) | no LANDED_ON | head leg judged, one not-landed line, no L assert | the same | n/a (guard) |
| W-L6 FULL | witness prints `RED PU · BOUND` at (L, P) | no L assert, so the expected red is absent | L assert RED `red at L: BOUND` | the L-leg drops BOUND ids |
| W-L7 GITSIDE | witness exits 0 iff `git -C <org> ls-files` and `git -C <base> ls-files` both succeed | no L assert | L assert ok | sides built without `git init` |
| W-L8 OFFMAIN | LANDED_ON names a commit off origin/main's first-parent line | no L assert | RED `its LANDED_ON is on main's first-parent line` | skip the membership check |
| W-L9 SECONDS | any landed plant | no `witness ‹pu› L` line | one `  witness ‹pu› L <s> s · <LAST>` line | the line removed |

### C2 · THE HEAD LEG JUDGES ONLY THE CLAUSES THAT STILL BIND (organism_test.mjs `judgeLast` `:2796-2806`, its call `:2875`)
Code path: the head leg's dropped ids = `boundIds(src)` ∪ the ids of `ci/<u>/REBASE` that pass validation (C3). The assert
name and the detail grammar stay exactly as ms1 has them (`WITNESS ‹u› · GREEN at head against its BASE`,
`red beyond BOUND: …`), so ms1's four `KNOWN_RED` entries (`:2909-2912`) keep matching until each repair landing replaces
its entry with a REBASE line. The L-leg (C1) never drops a REBASE id.

| Clause | Plant | RED on base | GREEN on build | Mutant |
|---|---|---|---|---|
| W-R1 DROP | `ci/pu/REBASE` = `X1 · pv · row 9`, pv landed after pu; head prints `RED PU · X1` | head assert RED (ms1 reads no REBASE) | head assert ok | REBASE ignored |
| W-R2 KEEPATL | the same REBASE, and the witness prints `RED PU · X1` at (L, P) | no L assert | L assert RED `X1` | REBASE applied at L too |
| W-R6 NEWDEATH | REBASE X1, head prints `RED PU · X1 X2` | RED (both ids) | RED naming **X2 only** | drop every id the witness prints |

### C3 · THE RE-BASE DOOR (organism_test.mjs, a validator beside `boundIds` `:2794`)
`ci/<u>/REBASE` holds one line per clause, `<ID> · <unit v> · row <n> · <why>`. The repair unit's own landing writes it
(mr3 for mjd3, mrt for mtail, mrj for mjud, mrf for mf2), touching `ci/<u>/REBASE` beside its own `ci/<v>/`
(NO-CI-DIR, `land.mjs:196-204`). A line is valid iff all four hold:
- (a) `<ID>` is a quoted literal in the witness's own source;
- (b) v has a LANDED_ON and an L_v (C1), and L_u lies on L_v's first-parent line, so v landed after u;
- (c) `row` is an integer > 0 (the `KNOWN_RED` `ok()` shape, `:2925`);
- (d) at the head leg the id IS red.
If (d) fails, the line is STALE: a red `REBASE ‹u› <ID> · STALE — it is green at head; remove the line in this
landing`, the KNOWN_RED STALE law at clause grain. If (a), (b) or (c) fails, the line is INVALID and drops nothing.

| Clause | Plant | RED on base | GREEN on build | Mutant |
|---|---|---|---|---|
| W-R3 STALE | REBASE X1, head green | no stale red (ms1 ignores the file) | RED `… X1 · STALE` | the stale check removed |
| W-R4 ORDER | REBASE names pv landed BEFORE pu (or not landed) | no INVALID red | RED `INVALID`, X1 not dropped | skip the ancestry check (b) |
| W-R5 UNKNOWN | REBASE names `ZZ`, absent from the witness source | no INVALID red | RED `INVALID` | skip check (a) |

**Measured first users of the door** (19 Nov 2026): ms1's own changes to `land.mjs` turn mfac's `W3.2` red at head
(§3 fact 3). ms2 changes land.mjs again (C6). So the build carries `W3.2 · ms1 · row 1066 · land.mjs changed by NO-CI-DIR`
in `ci/mfac/REBASE`, plus a line for ms2's own change once ms2 has a row. That is the one REBASE a build writes for
another unit (fork F3 (b)).

### C4 · WHEN THE L-LEG RUNS (organism_test.mjs `witnesses()`, before C1) — fork F5's recommendation
Code path: run the L-leg of u iff `git diff --quiet refs/remotes/origin/main HEAD -- ci/<u>/` exits 1 (the unit's dir
differs from main's: a landing in flight, a REBASE edit, a witness edit), or the ref is absent. Otherwise print one line,
`  witness ‹u› L · carried — ci/<u>/ equals main's; judged at its landing`, and spawn nothing. The inputs of a carried
L-leg are immutable: two fixed commits, and witness bytes equal to main's. Only the runner image can change it unseen
(§8 N4).

| Clause | Plant | RED on base | GREEN on build | Mutant |
|---|---|---|---|---|
| W-T1 TRIGGER | ci/pu equal to origin/main's | no carried line | carried line, the witness marker absent | always run |
| W-T2 CHANGED | ci/pu differs (a REBASE line added) | no L assert | L assert present | never run |

### C5 · THE MERGE-BASE TREE RUNS NO WITNESS (organism_test.mjs `:2832` gate; ci_verdict.mjs `judge` `:65-69`) — fork F5 (c)
Code path, two parts:
- The member runs only when `ROOT` resolves to `process.env.GITHUB_WORKSPACE`. The merge-base step runs the base's own
  instrument from `$RUNNER_TEMP/b1_base` (`suite.yml:127-133`), so there it prints one line,
  `  SKIP WITNESSES · the merge-base tree — witnesses are judged at head (C5)`, and makes no assert.
- In `ci_verdict.mjs`, `parseSuite` (`:36-43`) also keeps the machine line's `ruled` list. `judge` treats a head red
  named `WITNESS ‹…›` or `REBASE ‹…›` as FRESH unless the head's own `ruled` list names it. Base membership no longer
  decides it, because the base never ran it.
This is a **law change of the neutral verdict** for these members only, and it is stricter: an unruled witness red is red
on every push until a row rules it (LAW T: a gate may only get stricter).

| Clause | Plant | RED on base | GREEN on build | Mutant |
|---|---|---|---|---|
| W-T3 BASETREE | the member run with `GITHUB_WORKSPACE` naming another dir | the planted witness runs | one skip line, nothing spawned | gate removed |
| W-V1 RULED | compare: head red `WITNESS ‹pu› …` ruled in head's line, base without it | RED (fresh) | GREEN | ruled list ignored |
| W-V2 UNRULED | the same red, unruled | RED | RED (a GUARD of strictness) | witness reds treated as old |

### C6 · THE LAND VERB WRITES THE CONTRACT (land.mjs step 5, after NO-CI-DIR `:196-204` on `3981f36`)
Code path: when the NO-CI-DIR law binds, two refusals are added:
- `SUBJECT`: T's subject (`git log -1 --format=%s T`) does not start `unit <unit> (`.
- `LANDED-ON`: `ci/<unit>/LANDED_ON` at T is absent, is not 40-hex, or differs from P (`:175-176`).
Both are REFUSED (exit 1), neither is in `HUMAN_STOPS` (`:47`), and both are read before the verdict (step 6, `:213`).
The witness drives `land.mjs <u> --dry` in a planted laptop clone with stubs: the ci_verdict stub GREEN, sitting CLOSED,
the tripwire passing, and a keeper whose `judgeHeld` answers free and binds nothing. This is the shape of
`ci/mland/witness_mland.mjs` and `ci/ms1/witness_ms1.mjs` B3.x.

| Clause | Plant | RED on base | GREEN on build | Mutant |
|---|---|---|---|---|
| W-G1 SUBJECT | T subject `wip` | DRY | REFUSED SUBJECT | gate removed |
| W-G2 LANDEDON | LANDED_ON ≠ T^1 | DRY | REFUSED LANDED-ON | compare skipped |
| W-G3 GOOD (GUARD) | subject `unit pu (…`, LANDED_ON = T^1 | DRY | DRY | n/a |

### C7 · THE CARRY, COMPLETED (files under ci/ only)
`ci/<u>/LANDED_ON` for each of the 25 carried units holds the P column of §3, and `ci/mpool/PROOF.md` is carried from
`claude/mpool-build` with its bytes unchanged.
- W-C1 CARRY: static on the tree. Every `ci/<u>/` with a witness and a BASE whose unit has a first-parent `unit <u> (`
  commit carries a LANDED_ON equal to that commit's run's P. Base RED (no file), build GREEN. Mutant: one LANDED_ON
  shifted to its L.
- W-C2 MPOOL: `ci/mpool/PROOF.md` is present and its SETTINGS fence parses as the witness reads it
  (`witness_mpool.mjs:54-56`). Base RED, build GREEN. Mutant: the file deleted in the copy.

### Standing clauses of ms2's witness
- **PORTS (the port class, row 1053):** ms1's own static read (`fixedPortHits`, `organism_test.mjs` on `3981f36`) is
  applied to `ci/ms2/`. No `listen(<non-zero>`, no live service named, no POST, nothing restarted. A port is planted only
  through an env door under the temp dir (ARSENAL_JUDGE_PORT / ARSENAL_SITTING_PORT, read back from the planted witness's
  env, ms1 B4.5 shape). Every spawn is bounded by the job's `timeout-minutes` read from the tree's `suite.yml`, never
  typed.
- **BOUND:** only the files of §7 differ from the base (CRLF folded to LF). **LAST:** no node process naming the temp dir
  survives.
- LAST LINE: `GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · <n> clause(s)` /
  `RED MS2 · <clauses>`.

## 5. COST PER LEG ON THE NEUTRAL MACHINE, AND THE FIT

**Measured.** The head leg per unit is ms1 PROOF §5.3, push `f98e914`, run `44417920009`, jobs `135202961143` (node 22)
and `135202961645` (node 24). Job wall time was read with curl (19 Nov 2026) from `check-runs` `started_at` /
`completed_at`: **1713 s (node 22)** and **1618 s (node 24)**. The member's own total in those jobs was 1420.6 s and
1316.7 s. The rest of the job (npm ci twice, the merge-base suite without a member, the head suite's other modes) is
therefore about 292 s and 301 s. The bound is `timeout-minutes` at `suite.yml:62`, read on `95b07a6` (×60 = the job's
seconds).

**Not measured on the neutral machine, projected.** The L-leg per unit = this seat's Linux L-leg seconds × (that unit's
neutral head seconds ÷ ms1's Linux head seconds, §5.1). Over the 21 units with both figures that gives
**1179.7 s (node 22)** and **1093.5 s (node 24)**. The measured head-leg sum is 1352.4 s and 1240.1 s. The four
follow-up units (mday2, mfac, mgs, mpool) have no neutral figure, and on Linux they take 22.3 s together. mf2 alone is
about half of either sum. (`node <scratchpad>/cost.mjs`, ledger act `cost`.)

| Wiring (node 22, the slower) | Seconds per job, projected | Fits `suite.yml:62`? |
|---|---|---|
| ms1 as landed: member on head AND merge-base trees, no L-leg | 292 + 1421 + 1421 ≈ 3134 | yes, thin |
| C, full L-sweep on every push, both trees | 3134 + 2 × 1180 ≈ 5494 | **no** |
| C, L-sweep in the head tree only (C5 skip half) | 3134 + 1180 ≈ 4314 | **no** |
| C with the trigger (C4), merge-base tree still runs the member | 3134 + L of the changed units; a unit's landing ≈ 3134 + its L (mf2-size ≈ 3701); **ms2's own landing touches 25 dirs ≈ 4314** | ordinary pushes yes; mf2-size landing **no**; ms2's landing **no** |
| **C with C4 + C5 (recommended)** | 292 + 1421 + changed L; ms2's own landing ≈ 292 + 1421 + 1180 ≈ 2893 | **yes**, every case projected |
| C with a workflow edit (its own job / schedule) | n/a | outside the brief, F5 (d) |

**Answer: C does not fit as ms1 wires the member. It fits without a workflow edit only with C4 and C5 both built**
(projection, fork F5). The build's first neutral run (§8 N2) is the measurement that settles it.

## 6. FORKS (the architect rules; each option lettered; the measurement that decides)

- **F1 · the L-leg's base.** (a) ci/<u>/BASE: BOUND dropped at L too, and 14 units cannot be judged on BOUND at L. (b) P,
  derived from history (`^1` of the oldest match): this breaks ms1's ruled B1.3 NOCALC. (c) **P written as
  `ci/<u>/LANDED_ON`, verified by land.mjs (C6)**. *Recommend (c).* Decided by §3 (14 RED-by-BOUND rows vs BASE, 0 vs
  P) and by B1.3 being a ruled clause.
- **F2 · L for a multi-commit landing.** (a) **The newest commit of the run** (mday `cb30003`). (b) The oldest (mday is RED
  W7.0 there). (c) Forbid multi-commit landings: the settings-line commits were made "by the runner's hand", outside the
  verb, which refuses `.claude/settings.json` (`land.mjs:195`). *Recommend (a).* Decided by §3 mday's two rows.
- **F3 · the re-base door** (the four repair units decide; this is what they decide between). (a) **`ci/<u>/REBASE`
  clause lines (C3)**: clause-grain, the L-leg still binds every id, and a line expires itself (STALE). (b) (a), and the
  unit that overtook a clause may write the line itself in its own landing (ms2 for mfac W3.2) instead of a separate
  repair unit. (c) Re-cut the witness and re-take its BASE: this breaks the L-leg, because the re-cut clause must still be
  GREEN at the old L, where the old behaviour holds. (d) KNOWN_RED stays the only door (ms1 as is). This works only at
  member grain: a whole unit is ruled RED. (e) Once overtaken, the head leg is retired and only the L-leg judges the unit.
  *Recommend (a) for mr3/mrt/mrj/mrf and (b) for a unit's own planned overtake.* Decided by the repair units'
  per-clause measurement: the first first-parent commit at which the clause turns red names the overtaking unit for (b)
  of C3.
- **F4 · git sides.** (a) **The L-leg's sides are git trees (C1)**. (b) The head leg too, so mtail's BOUND-free head ids
  are measured on the same shape. (c) Plain trees, with mtail ruled. *Recommend (a).* Decided by mtail, GREEN only on git
  sides (§3), plus the Windows cost of `git add -A` over a whole tree (§8 N3).
- **F5 · the fit.** (a) Full L-sweep every push. (b) The trigger alone (C4). (c) **C4 + C5** (the merge-base tree runs no
  witness; ci_verdict judges witness reds by the head's ruling). (d) A workflow edit: a separate job with its own bound, or
  a scheduled full sweep that also covers runner-image drift. *Recommend (c).* Decided by the projection in §5 and then by
  the build's first neutral run (N2). (c) is also ms1's FORK 7 answer: the member is no longer paid twice.
- **F6 · the subject grammar** of a multi-unit landing (`unit B1 + mrdr (`, main `76b0626`). (a) **One unit per landing
  (C6 refuses the `+` form)**. (b) Accept `unit <a> + <b> (`, so that L is shared. *Recommend (a)*: NO-CI-DIR already
  pairs one landing with one ci dir.
- **F7 · ms2's base.** (a) **main after ms1 lands**. (b) ms1's tip `3981f36`, if ms2 is built first. *Recommend (a)*: the
  member's file is ms1's.
- **F8 · mfac-floor** (landed `95b07a6`, after ms1's carry; no ci dir is on main). (a) **ms1 carries it before landing**,
  so ms2's C7 gains a LANDED_ON `a18c167`. (b) ms2 carries it. (c) Leave it uncarried and name it. *Recommend (a).*

## 7. FILES A BUILD WOULD TOUCH

- `scripts/organism_test.mjs`: C1 to C5 inside the witnesses member, and no other mode.
- `scripts/land.mjs`: C6, step 5.
- `scripts/ci_verdict.mjs`: C5's `ruled` read and the WITNESS/REBASE rule, with its selftest planted both ways.
- `ci/<u>/LANDED_ON` × 25 (C7), `ci/mpool/PROOF.md` (C7), `ci/mfac/REBASE` (C3, F3 (b)).
- `ci/ms2/`: `witness_ms2.mjs`, `run_mutants_ms2.mjs`, `BASE`, `LANDED_ON` (its own, written by its land branch),
  `PROOF.md`, `LEDGER.jsonl`.
- **Beyond them, as forks:** `.claude/skills/runner/SKILL.md` (F9: the runner's landing recipe must write LANDED_ON and the
  subject; (a) edit it in ms2, (b) a runner unit). `.github/workflows/suite.yml` is **not touched** (F5 (d) only).

## 8. NAMED, NOT GUESSED

- **N1** · the land verb's own record of each landing's T (`.git/land_ledger.jsonl`, `land.mjs:66`, `:261`) lives only in
  his clone. Measure on his laptop: `node -e "require('fs').readFileSync(require('child_process').execSync('git rev-parse
  --git-path land_ledger.jsonl').toString().trim(),'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.outcome==='LANDED').forEach(r=>console.log(r.unit,r.sha))"`,
  then compare it with §3's L column (which units passed through the verb and which by hand).
- **N2** · the L-leg's seconds on `windows-latest`, and the job's wall time with C4 + C5, are not measured (§5 is a
  projection). Measured by the build's first push: the same curl of `check-runs` and the `witness ‹u› L` lines in its job
  log.
- **N3** · the Windows cost of git sides (`git init` + `git add -A` + commit over a whole tree, twice per L-leg). Measured
  by the same neutral run, or on his laptop by timing `node ci/mtail/sides.mjs --ref 074ead9 --dir <tmp>`.
- **N4** · runner-image drift on a carried L-leg (C4 skips it) is invisible to git. Measured only by a periodic full sweep
  (F5 (d)) or by `GITHUB_ACTIONS=true ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses` on his
  laptop with C4 forced off.
- **N5** · ms1's tip `3981f36` has no neutral verdict: both jobs were **cancelled** (§9). Whether mfac W3.2 and mpool
  WA.i/S are red there, as they are on Linux (§3 fact 3), is unmeasured. Measured by a re-run of that workflow.
- **N6** · mpool's WA.i is a clock-bound clause (`witness_mpool.mjs:21`, a ruled second plus a measured slack). It was
  GREEN here once PROOF.md was present. Its margin on the Windows runner is unmeasured (N2).

## 9. THE NEUTRAL MACHINE ON THIS BRANCH'S PUSHES

Read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token).

| Push | Check runs | Verdict |
|---|---|---|
| ms1 `f98e914` (for §5) | node 22 `135202961143` failure 1713 s · node 24 `135202961645` failure 1618 s | RED (ms1's four, ms1 PROOF §5.3) |
| ms1 `3981f36` (for N5) | node 22 `135231308170` cancelled · node 24 `135231308681` cancelled | none |
| ms2 spec `352e5f2` | run `44429320779`: node 22 `135242307473` success 286 s · node 24 `135242307602` success 302 s | GREEN (both legs) |
| ms2 spec, this push (ledger + §9 only) | the ledger act `ci-read` of the final message | — |

## 10. OPEN QUESTIONS FOR THE ARCHITECT

- **Q1** ms1 as it stands would land two unruled red members (mfac W3.2, mpool WA.i/S; Linux, 19 Nov 2026). Should ms1 add
  them before landing: carry PROOF.md and a ruling for W3.2? Or does ms2 carry both (C7, C3)?
- **Q2** C5 changes the neutral verdict's law for witness members: they are judged by the head's ruling, not by base
  membership. Is that a ruling for row 1066, or does it need its own row?
- **Q3** F3: do the four repair units rule the REBASE door before ms2 is built, or does ms2 ship the door and they use it?
