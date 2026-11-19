# mrj — SPEC (cloud spec seat, 19 Nov 2026)

Unit **mrj** · forks rows 1107 (2) / 1108 / 1109 · branch `claude/mrj-spec`, cut from `origin/main` @ **`a18c167`**
(`git fetch origin main`, then `git checkout -b claude/mrj-spec origin/main`, 19 Nov 2026 UTC). This seat writes ONE spec and
builds nothing: no organ file, no witness file and no state file is changed by this branch. Everything below is a measurement
made on 19 Nov 2026 with the command named; every act is a row in `ci/mrj/LEDGER.jsonl`.

## HEADLINE

**All three red clauses are fate (a) — RE-BASE. Main did not regress; two later ruled units changed the behaviour on purpose.**

| Clause | First red first-parent main commit | Unit · ruling row | Fate |
|---|---|---|---|
| **M3 CENSUS** | `074ead9` | **mtail** · forks rows 1017 (2)-(5) / 1019 (1) (F-B) | (a) re-base |
| **M5 F3-CLIP** | `3a73782` | **mjd3** · forks rows 1025 (4) / 1030 (the settle tail reserved inside the budget) | (a) re-base |
| **M6 MJD2** | `3a73782` | **mjd3** · forks rows 1025 (4) / 1030 (same) | (a) re-base |

No clause is dropped. The re-based witness (the exact diff is `ci/mrj/REBASE.diff`) reads GREEN beyond BOUND at head, RED on
all three at BASE, and each of the three mutants is RED by its own clause's name. The ms1 proof's suspect list is narrowed by
measurement: mjd4 (`15edfec`) and mjd5 (`e4a4f2c`) change none of the three (the witness detail lines are identical from
`3a73782` to head).

## 0. What was read

- The witness: `claude/ms1-build` **`3981f36`** (its newest tip, 19 Nov 2026). The brief names **`3966f61`**; between the two,
  ms1 changed its KNOWN_RED list, BASE and own witness (`014fe08`, `3981f36`) but **not `ci/mjud/`**:
  `git diff --stat 3966f61 origin/claude/ms1-build -- ci/mjud` prints nothing. So both tips carry the same mjud witness bytes.
- `ci/mjud/BASE` = `5767e2126b67788929390f3caa1089b4349fc5a0`.
- The ms1 KNOWN_RED entry for this member (`scripts/organism_test.mjs:2911` on `claude/ms1-build` `3981f36`):
  `WITNESS ‹mjud› · GREEN at head against its BASE` · detail `red beyond BOUND: M3 CENSUS M5 F3-CLIP M6 MJD2` · row 1107 ·
  owner `unit mrj`.

## 1. Reproduction (LF trees, `core.autocrlf=false`)

Trees: `sh ci/mrj/tree.sh <sha> <dir>` (`git -c core.autocrlf=false archive <sha> | tar -x`), placed under the scratchpad,
never in the live tree. Witness: `ci/mjud/witness_mjud.mjs` from `claude/ms1-build`.

```
node ci/mjud/witness_mjud.mjs --org T(a18c167) --base-org T(5767e21)
RED MJUD · M3 CENSUS · M5 F3-CLIP · M6 MJD2 · BOUND
node ci/mjud/witness_mjud.mjs --org T(5767e21) --base-org T(5767e21)
RED MJUD · M1 SITTING · M2 DUGOUT · M3 CENSUS · M4 F3-EAT · M5 F3-CLIP · M6 MJD2 · M8 MAUTH
```

The head leg is exactly the ms1 proof's §5.1 row. The red detail lines at head:

```
RED   M3 CENSUS — 3 judge-verb spawn site(s): scripts/dugout.mjs:2212, scripts/postmatch.mjs:857, scripts/sitting.mjs:1044 · NOT covered: scripts/postmatch.mjs:857
RED   M5 F3-CLIP — a check taking 100000 ms: handed [300000] · the first batch killed at 40000 ms (owed 200000)
RED   M6 MJD2 — 10 captures killed at the budget beside a fast ok row ⇒ next size 2; that size killed too ⇒ null (was 2)
```

## 2. The bisect (every first-parent main commit, `5767e21..a18c167`, each by command)

`for c in $(git log --first-parent --reverse --format=%h 5767e21..origin/main); do tree.sh $c T; node witness_mjud.mjs --org T; done`
(no `--base-org`, so BOUND is out of the walk; each row is in the ledger as `bisect <sha>`).

| first-parent commit | unit | witness last line |
|---|---|---|
| `c56b0a8` | mpm | RED · M1 M2 M3 M4 M5 M6 M8 (before mjud) |
| `ffe3213` | mf4 | same |
| **`9ff901a`** | **mjud** (its landing) | **GREEN MJUD** |
| `d0c8c96` | mpast | GREEN |
| `76b0626` | B1 + mrdr | GREEN |
| **`074ead9`** | **mtail** | **RED · M3 CENSUS** ← M3 turns red |
| `e819c0d` | mcr2 | RED · M3 |
| **`3a73782`** | **mjd3** | **RED · M3 · M5 F3-CLIP · M6 MJD2** ← M5, M6 turn red |
| `15edfec` … `a18c167` (22 commits) | mjd4, mgrd, mjd5, mf2, mland, mlv0, mlv1, mdone, mlv2, deck rules, mlv3, mjd6, mday ×2, mdn2, groundsman, mlj, mday2, mgs, mpool ×2, mfac | RED · M3 · M5 · M6, **detail lines byte-identical** to `3a73782`'s |

The witness's own landing (`9ff901a`) is GREEN on every clause, so each red is a later change, not a witness born red.

## 3. Clause by clause

### 3.1 M3 CENSUS — fate (a), re-base on **mtail `074ead9`**, rows 1017 (2)-(5) / 1019 (1)

**What changed (measured, `git show 074ead9 -- scripts/postmatch.mjs`).** mtail F-B added
`export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS;` (head `scripts/postmatch.mjs:409`) and changed the
judge child's reserve from `fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS)` to `fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS)`
(head `scripts/postmatch.mjs:853`); `spawnMs(f, CHILD_TIMEOUT_MS)` (`:855`) and the `judge-due … timeout: s.ms` spawn (`:857`)
are unchanged. The commit message: *"F-B: the close's judge-due child waits JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS (read from
gaffer_brain's exports); the close budget does not move."* mtail's own selftest pins the new form
(`scripts/postmatch.mjs:1172-1180`, `/fits\(JUDGE_CHILD_MS \+ CHILD_TIMEOUT_MS\)/`).

**Why it is not a regression.** M3's intent is "postmatch.mjs spawns the judge through its JUDGE_BUDGET_MS reserve". The
reserve now covers the budget PLUS the dispatch margin — the same covered-by-the-owner's-budget law sitting.mjs (`:220`) and
dugout.mjs already meet with `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS`. The witness's regex matched the literal text of the
pre-mtail line, so a stricter reserve read as "not covered".

**The exact new expectation** (`ci/mjud/witness_mjud.mjs:127` on `claude/ms1-build`): postmatch.mjs is covered iff
`export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS;` is in the file AND the judge run reads
`const f = fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);` → `const s = spawnMs(f, CHILD_TIMEOUT_MS);` →
`"judge-due", "--trigger", "day.close"] … timeout: s.ms`. The sitting and dugout arms do not move.

**Files and owners at then-head:** `scripts/postmatch.mjs` (read-only to the witness; its own header names what it writes; not
touched). Witness file `ci/mjud/witness_mjud.mjs` (unit mjud's witness, on `claude/ms1-build`).

### 3.2 M5 F3-CLIP — fate (a), re-base on **mjd3 `3a73782`**, rows 1025 (4) / 1030

**What changed (measured, `git show 3a73782 -- scripts/gaffer_brain.mjs`).** mjd3 reserves each batch's settle tail inside the
one budget: `settleReserveMs` (head `scripts/gaffer_brain.mjs:2024`) and `judgeBatchWithTail` (`:2029`) size the batch against
what remains after its tail, and the judge call is now killed at `sz.call_ms` = remaining − tail (`:2411`,
`budget_ms: sz.call_ms`), where before it was `budget_ms: remaining`. The check's own time is still spent first
(`left()` at `:2394` reads `Math.max(clock() - t0, spent)` with `spent = extMs`).

**Why it is not a regression.** F3's law is "the first batch is killed at what the CHECK left, never at a fresh budget" — at head
the check is handed the whole budget (`handed [JUDGE_BUDGET_MS]`) and the first call gets (budget − the check's third) − its
settle tail, which is still never a fresh budget. mjd3 re-based **the same assertion in its own organ's selftest**
(`scripts/gaffer_brain.mjs:3557-3560`: *"mjd3 (row 1025 (4)): what the check left, minus the batch's own reserved settle tail —
still never a fresh budget"*, asserting `budget_ms === JUDGE_BUDGET_MS - JUDGE_BUDGET_MS / 3 - tail_ms` and
`tail_ms === settleReserveMs(batch)`). The witness was the one place not re-based. The decisive measurement: mutant MU-M5
(`budget_ms: remaining`, i.e. undoing mjd3's kill point) turns the **original** M5 GREEN and the re-based M5 RED (§5).

**The exact new expectation** (`ci/mjud/witness_mjud.mjs:143`): `handed[0] === JUDGE_BUDGET_MS` AND the first batch's
`tail_ms` is finite, `> 0`, and equals `settleReserveMs(<that batch's planted rows>)` AND
`first_budget === JUDGE_BUDGET_MS − JUDGE_BUDGET_MS/3 − tail_ms`. The driver (`ci/mjud/w_drive.mjs:63`) adds two facts:
`tail` (from `r.batches[0].tail_ms`) and `reserve` (from the copy's exported `settleReserveMs`, `null` where the copy exports
none — so BASE reads RED). Measured at head: first batch killed at 40000 ms = 200000 − 160000.

**Files and owners:** `scripts/gaffer_brain.mjs` (SOLE WRITER of its own files per its header, `:5`; read-only here, not
touched). `ci/mjud/witness_mjud.mjs`, `ci/mjud/w_drive.mjs`.

### 3.3 M6 MJD2 — fate (a), re-base on **mjd3 `3a73782`**, rows 1025 (4) / 1030

**What changed.** The same tail reserve. With `hidden_test` plants (a second-judge type, tail
`2·JUDGE_DISPATCH_MS + WATCHER_DEADLINE_MS` per capture), the size after a kill of 10 falls from 6 (pre-mjd3, `76b0626`) to 2;
a kill of 2 then leaves no size at which even ONE capture plus its tail fits, so the round starts **no** batch. Probe
(`ledger: probe`): `{"ok":false,"reason":"judge-batch-cannot-fit","batches":0,"sizing":{"size":0,…}}` — the identical answer
at `3a73782` and at head.

**Why it is not a regression.** The mjd2 rule's own text (`scripts/gaffer_brain.mjs`, the `mjd2 · A KILLED BATCH TEACHES THE
SIZE` block above `judgeFloors`): *"a size that keeps dying shrinks by at least one capture each time, down to the RED of 'not
even ONE capture fits'."* s2 = 0 < s1 = 2 IS that rule. The witness read s2 from `r2.batches[0].size` and so wrote `null` for a
round that (correctly) started nothing; `Number.isInteger(null)` failed. The clause measured the plant, not the rule.

**The exact new expectation** (`ci/mjud/w_drive.mjs:72`, `ci/mjud/witness_mjud.mjs:148`): s2 = the first batch's size if a
batch ran, else **0** when the round's reason is `judge-batch-cannot-fit` and its `sizing.size === 0`, else `null`; the clause
holds `first_size < 10` AND `s1` is a positive integer AND `s2` is an integer AND `s2 < s1`. (s1 > 0 is added so a round that
can start nothing at all can never pass by `0 < 0`-style vacuity.) At `9ff901a`/`76b0626` it still reads GREEN (6 → 3): the
re-base widens, it never narrows the pre-mjd3 reading.

**Files and owners:** as 3.2.

## 4. Witness clauses — each plant RED on BASE and GREEN on the build

The "build" here is the re-based witness (`ci/mrj/REBASE.diff`) run over the unchanged head tree; there is no organ build.

| Clause | BASE `5767e21` (re-based witness) | head `a18c167` (re-based witness) | head (witness as landed) |
|---|---|---|---|
| M3 CENSUS | RED (sitting, dugout, postmatch uncovered) | **GREEN** (3 sites, each covered) | RED |
| M5 F3-CLIP | RED (`handed [null]`, tail null) | **GREEN** (40000 = 200000 − 160000) | RED |
| M6 MJD2 | RED (12 → 12) | **GREEN** (2 → 0) | RED |
| whole line | `RED MJUD · M1 M2 M3 M4 M5 M6 M8` | `RED MJUD · BOUND` (BOUND is dropped by the ms1 member) | `RED MJUD · M3 · M5 · M6 · BOUND` |

Walk of the re-based witness (ledger `proto-walk`): `9ff901a` RED M3 M5 · `76b0626` RED M3 M5 · `074ead9` RED M5 ·
`e819c0d` RED M5 · **`3a73782` GREEN** · `a18c167` GREEN. It turns green exactly where the two ruled units land.

## 5. Mutants — one per clause (`sh ci/mrj/mutants.sh T(a18c167) <re-based witness>`)

| Mutant (on a temp copy of the head tree) | re-based witness | witness as landed |
|---|---|---|
| CONTROL (no change) | `GREEN MJUD … 10 clause(s)` | `RED MJUD · M3 CENSUS · M5 F3-CLIP · M6 MJD2` |
| MU-M3 `postmatch.mjs:409` JUDGE_CHILD_MS = JUDGE_BUDGET_MS (drop the dispatch margin) | `RED MJUD · M3 CENSUS` | RED M3 M5 M6 |
| MU-M5 `gaffer_brain.mjs:2411` `budget_ms: remaining` (undo mjd3's kill point) | `RED MJUD · M5 F3-CLIP` | RED M3 **M6** — its M5 turns GREEN |
| MU-M6 `judgeBatchSize` ignores floors (undo mjd2) | `RED MJUD · M6 MJD2` | RED M3 M5 M6 |

Each mutant is RED by its own name only; the control is GREEN.

## 6. The port class (row 1053)

The re-based witness changes no transport: it binds no fixed service port, names no live service, POSTs nothing at a live
daemon and restarts nothing. The one listener in the witness is M1's `d.serve(0, "127.0.0.1")` (port 0, an ephemeral port the
OS hands a child under the temp dir, already in the landed witness and untouched here); every child is bounded by the witness's
own `spawnSync` timeout; every spawner inside a driver is a recorder (`ci/mjud/w_preload.mjs`); the fake `claude` first on PATH
logged no spawn (`LAST` GREEN on every run above).

## 7. The build (named files)

| File (on the branch the build is cut from, F1) | Line at `claude/ms1-build` `3981f36` | Change |
|---|---|---|
| `ci/mjud/witness_mjud.mjs` | `:127` (M3 postmatch arm) · `:143-144` (M5) · `:148` (M6) | per `ci/mrj/REBASE.diff`, plus a header note naming the two re-bases (unit, commit, row) |
| `ci/mjud/w_drive.mjs` | `:63` (facts.third) · `:72` (facts.kill2) | per `ci/mrj/REBASE.diff` |
| `scripts/organism_test.mjs` | `:2911` (the KNOWN_RED entry owned by unit mrj) | **removed in the same landing** — the member turns GREEN, so the entry reads STALE and exits 2 until it goes (the list's own rule, `:2985`) |

No organ (`scripts/postmatch.mjs`, `scripts/gaffer_brain.mjs`, `scripts/sitting.mjs`, `scripts/dugout.mjs`, `scripts/brain.mjs`)
is touched: there is no fate (b). `ci/mjud/BASE` stays `5767e21` (F3). Anything beyond these three files is a fork.

## 8. FORKS (the architect rules)

**F1 · Where the build is cut.** The mjud witness and the KNOWN_RED entry exist only on `claude/ms1-build`, not on main.
- (A) cut the mrj build from `claude/ms1-build`'s tip (stacked); it lands with or after ms1. **Recommended** — the three files
  live there, and the STALE rule forces the entry's removal in the same diff.
- (B) wait until ms1 is on main, then cut from main.
- (C) land the witness edit alone on main now (carries `ci/mjud/` to main ahead of ms1).
Decides it: whether ms1 is on main at the next launch window (`git log --first-parent origin/main --grep "unit ms1 ("`).

**F2 · M3: the new form only, or either form.**
- (A) accept ONLY `fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS)` with `JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS` in the
  file. **Recommended** — a revert of mtail F-B then reads RED (MU-M3), the same law sitting and dugout are held to.
- (B) accept the pre-mtail `fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS)` too (keeps the witness GREEN at `9ff901a`, but a
  revert of mtail would pass silently).
Decides it: MU-M3 — under (B) it would still be RED only by the definition line; under (A) by both.

**F3 · BASE.** The re-based M5 reads RED at `9ff901a` (the mjud landing) by design.
- (A) keep `ci/mjud/BASE = 5767e21`. **Recommended** — every re-based clause is RED there (§4), which is the member's test.
- (B) re-take BASE at `3a73782^1`.
Decides it: the re-based witness's base leg at the candidate (RED on M5 at `e819c0d`, ledger `proto-walk`) — (B) buys nothing.

**F4 · M6: read the cannot-fit stop as size 0, or re-plant.**
- (A) s2 = 0 on `judge-batch-cannot-fit` with `sizing.size === 0`. **Recommended** — it tests mjd2's own terminal.
- (B) re-plant M6 with a type outside `SECOND_JUDGE_TYPES` so the chain stays above 0. Measured at head (ledger `probe-voice_rep`,
  the same plant with type `voice_rep`): s1 = 2 and the second round is `judge-batch-cannot-fit`, size 0 — so (B) does not
  avoid the terminal; it changes nothing.
- (C) drive M6 at `judgeBatchWithTail` directly (weaker: off the round's own path).

## 9. NAMED, NOT GUESSED

| Fact not reachable from the cloud | What would measure it on his laptop |
|---|---|
| The re-based witness on Windows (junction for node_modules, PowerShell CIM for LAST) | the build seat: `node ci/mjud/witness_mjud.mjs --org <LF tree a18c167> --base-org <LF tree 5767e21>` on Windows, both legs |
| The ms1 member's seconds for mjud on the neutral machine after the re-base | the suite workflow job log of the build's push (assert `WITNESS ‹mjud› · ran in … s (B5)`) |
| Whether the live grade queue holds a real `judge-batch-cannot-fit` round (a live, not planted, M6 terminal) | `node scripts/gaffer_brain.mjs status` on his laptop (reads his state; never from the cloud) |

## 10. The neutral machine

Read with curl, no token: `GET https://api.github.com/repos/<owner>/arsenal-ai-fc/commits/<sha>/check-runs` (the owner is this repository's own). See §11.

## 11. CI of this branch

(filled after the push)
