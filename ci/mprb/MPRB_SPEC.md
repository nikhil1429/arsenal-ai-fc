# UNIT mprb · THE PROBE SELFTEST ON THE NEUTRAL MACHINE (spec, forks row 1209 (3))

Seat: cloud spec seat, unit mprb. Branch `claude/mprb-spec`, cut from origin/main
**6a6bdfff4349b849398b69d0748b27d37c874b85** (fetched 2026-11-20T15:48:22Z; units mlaw, mcov and mmeter are on it).
This file is a SPEC. It builds nothing, lands nothing, edits no existing file (above all not `scripts/probe.mjs`, row 1209 (3))
and quotes no state file. Every `file:line` is at 6a6bdff. `API=https://api.github.com/repos/nikhil1429/arsenal-ai-fc`.
Scratchpad tools named below (`survey.mjs`, `stamp.mjs`, `tablebound.mjs`, `tablecount.mjs`) are summarised in §1.1 so a
build can re-run each one. The acts are rows of `ci/mprb/LEDGER.jsonl`.

## 0 · THE HEADLINE

**The public bytes cannot name the segment, and they cannot even say that a segment passed its bound.** What reaches the
public record from a red leg is the member's NAME (`SUITE MEMBER · probe selftest exits 0`) and its roll-up. That is all.
Neither the failing check, nor "killed" versus "exit 1", nor any bound reaches it. The job log could not name it either, even
signed in: the workflow greps the log down to lines that open `  ok  `, `  FAIL`, `  LIVE`, the headline and section heads
(`.github/workflows/suite.yml:115`). The probe's own `FAIL <check>` lines live inside the member's captured output
(`scripts/organism_test.mjs:401`), and that output is never printed. The member's red-why line is indented nine spaces
(`:406`), so the grep drops it too. So the "30 second segment" is a HYPOTHESIS. This spec measures it as far as the cloud
can reach, and names the rest.

What was measured (2026-11-20):
- **The red is rare, and it happens on one tree whose bytes do not change.** Over the last 60 suite runs, 52 legs reached a
  verdict, and the probe member is a NEW RED on exactly 2 of them: main 6a6bdff on node 22 (job 136341665594) and
  d2d9383 on node 24 (job 136344033976). Both ran inside one 6-minute start window, together with 20 other verdict legs
  that read it green. The other leg of each of those two runs, on the identical tree, read it green.
- **It does not reproduce off Windows.** In this container the selftest reads 176/176, three runs on main, at about 11 s.
  Under 4× CPU oversubscription it reads 176/176 twice, at about 33 s. Load alone does not flip it here.
- **Its only real spawn that is both Windows-only and bounded by `SEG_TIMEOUT_MS` is the process-table read.**
  `procSnapshot()` (`scripts/probe.mjs:835`) spawns `powershell.exe … Get-CimInstance Win32_Process` with
  `timeout: SEG_TIMEOUT_MS` (`:839`) on Windows, and reads `/proc` with no spawn on Linux (`:842-847`). One selftest makes
  13 such reads (M11). A planted bound-hit on that read flips **exactly 6 checks**: `probe selftest: 170/176 ok · RED`, the
  first FAIL being `L7f-A4` (M10). That is the leading candidate. It is **not** a finding: nothing public shows it happened
  (N1).
- **The process-table and clock grounds of the hermetic profile were never measured for probe.** The profile's own law
  names "the process table" and "a clock it does not plant" as LIVE grounds (`scripts/organism_test.mjs:89-92`). Unit mcov
  admitted probe as HERMETIC on `ci/mcov/tools/readprobe.mjs`. That tool journals state-bus fs calls and network connects
  only (`ci/mcov/tools/readprobe.mjs:1-6`), and it found "none" (`ci/mcov/PROOF.md:23`). Yet `L7f-P1` reads "the REAL
  process table" (`scripts/probe.mjs:1818-1819`), and the instrument the table header cites (`ci/b1/probe.mjs`,
  `scripts/organism_test.mjs:95`) is not in this tree (M13).

**Proposal: no fate is taken blind.** The deciding channel already exists as a spec: mdtl2's K1, the member red carrying its
first failing check as a literal of `scripts/probe.mjs`. This unit opens no second channel. It rules the fate in advance on
what that channel will print (§4, F1 C). If the architect will not wait for mdtl2, the recommended fate is **B**: the
member is named LIVE on the profile's own process-table ground. That costs no edit of `probe.mjs` and loosens no bound. A
retry until green is refused, and no option here proposes one.

## 1 · MEASUREMENTS (each by command, its last line)

| # | Command | Last line (2026-11-20) |
|---|---|---|
| M1 | `git fetch origin main; git rev-parse FETCH_HEAD` | `6a6bdfff4349b849398b69d0748b27d37c874b85` |
| M2 | `grep -n SEG_TIMEOUT_MS scripts/probe.mjs` | `1201:` … `timeout: Number(o["timeout-ms"]) \|\| deps.timeout \|\| SEG_TIMEOUT_MS` (the bound itself at `205: const SEG_TIMEOUT_MS = 30000`; also `:601`, `:839`, `:849`, `:1163`) |
| M3 | `curl -s $API/check-runs/136341665594/annotations` | `failure \| B1 VERDICT · node 22 \| … "new":["SUITE MEMBER · probe selftest exits 0","all 58 hermetic suite members pass (every one RUN, not chained)"],"base_red":0 …` |
| M4 | `curl -s $API/check-runs/136344033976/annotations` | `failure \| B1 VERDICT · node 24 \| … "new":["SUITE MEMBER · probe selftest exits 0","all 59 hermetic suite members pass (every one RUN, not chained)"],"base_red":0 …` |
| M5 | `curl -s $API/actions/jobs/<id>` for the four legs, step 7 (`npm test · hermetic · head`) seconds | `6a6bdff n22 RED 2262 · n24 GREEN 2758 · d2d9383 n24 RED 1999 · n22 GREEN 2720` |
| M6 | `curl -s -o /dev/null -w '%{http_code}' $API/actions/jobs/136341665594/logs`; `curl -s $API/rate_limit` | `200` · `limit 15000`. **The agent proxy authenticates**, so a 200 here is not a signed-out read. The body was not read: the brief binds this seat to public bytes, and row 1186 measured 403 signed out |
| M7 | `node scratchpad/survey.mjs` (the last 60 `suite.yml` runs: each leg's conclusion, step-7 seconds, probe in the verdict's `new`) | `legs with a verdict: 52 probe NEW-RED: 2` (22 of them started 14:16–14:22Z, 2 red) |
| M8 | `node scratchpad/stamp.mjs` (the selftest, each stdout line stamped), before `npm ci` | `probe selftest: 175/176 ok · RED`. The red is `V32-26 … ERR_MODULE_NOT_FOUND` (acorn: this container had no node_modules), not the neutral red |
| M9 | `npm ci`, then `node scratchpad/stamp.mjs` ×3; then the same ×2 under 16 busy node loops on 4 cores | `176/176 ok · GREEN` ×3 (`total_ms 10823 / 10540 / 11922`); loaded `176/176` ×2 (`total_ms 33349 / 32671`) |
| M10 | `node --import scratchpad/tablebound.mjs scripts/probe.mjs selftest` (every process-table read ends as a bound-hit spawn) | `probe selftest: 170/176 ok · RED`. FAIL: `L7f-A4`, `L7f-P1`, `L7f-B1`, `L7f-A1`, `L7f-A2`, `L7f-A3` |
| M11 | `node --import scratchpad/tablecount.mjs scripts/probe.mjs selftest` (the spawn branch taken, each read journalled) | `TABLE-READ` count 13, max 9 ms. `174/176 · RED`: B1 and A1 need `session !== null`, and the `ps` branch has none (`:849-851`). That is a side finding for a machine with neither Windows nor /proc |
| M12 | `git show ccce4d5:ci/mdtl2/MDTL2_SPEC.md` (claude/mdtl2-spec tip at this cut) | `- **N1.** Which of probe's checks failed on node 24 of d2d9383 (136344033976) and on 6a6bdff's node 22 (136341665594).` |
| M13 | `ls ci/b1; git log --oneline --all -- ci/b1/probe.mjs` | empty: the instrument cited at `scripts/organism_test.mjs:95` is in no ref this clone holds |
| M14 | `grep -n 'tc("' scripts/probe.mjs` at the six M10 checks | all six names are whole double-quoted literals (`:1774`, `:1818`, `:1822`, `:1832`, `:1839`, `:1844`), so mdtl2's literal alphabet can carry each |

### 1.1 · the scratchpad tools (none committed; each is a measurement, never a gate)
- `survey.mjs`: lists `GET $API/actions/workflows/suite.yml/runs?per_page=60`. For every job it reads `/actions/runs/<id>/jobs`
  and `/check-runs/<job>/annotations`, and parses the `B1 VERDICT` payload's `new`. Transport is `curl` (node's fetch ignores
  the proxy).
- `stamp.mjs`: spawns `node scripts/probe.mjs selftest` and prints every stdout line with ms since start and since the
  previous line.
- `tablebound.mjs`: a `--import` preload. It hides `/proc/self/stat` from `fs.existsSync` so `procSnapshot` takes its spawn
  branch, and answers that spawn `{status: null, error: ETIMEDOUT}`, the shape a bounded spawn returns when it runs past its
  bound. It never waits, and it changes no other call.
- `tablecount.mjs`: the same branch, the real `ps` run, each call's wall ms journalled to stderr.

## 2 · QUESTION 1 · WHICH SEGMENT PASSES ITS BOUND, AND BY HOW MUCH, ON THE TWO LEGS

**Answer: not nameable from public bytes, on either leg.** By leg:

| leg | public | not public |
|---|---|---|
| 6a6bdff node 22 (136341665594) | the member name and its roll-up (M3); the head step 2262 s (M5); the verdict `base_red 0` | the failing check(s); the exit or the kill; any segment, any seconds |
| d2d9383 node 24 (136344033976) | the same (M4); 1999 s (M5) | the same |

**What the public bytes do bound.**
- (i) **No member-bound kill is evidenced.** A kill at the member bound (`HEAVY_BOUND_MS`, `scripts/organism_test.mjs:57`,
  taken by `:62`) would add that bound to the probe member's wall time. Both red head steps sit inside the green legs' range
  (M7), and d2d9383/n24 is the fastest of its four. This is weak evidence: the variance between legs is larger than the
  bound.
- (ii) **The red is not a date or wall-clock-hour effect.** 20 legs that started in the same window read the member green
  (M7).
- (iii) **The red is not the tree.** On each red tree the other leg is green, and so is the base run on the same runner
  minutes later (`base_red 0`). For d2d9383 the base is 6a6bdff, whose probe bytes are identical.

**The static census of every wall-clock bound the selftest crosses** (the candidates; one of them, or a race, is the cause):

| bound | where | direction | Windows-only | sensitivity |
|---|---|---|---|---|
| `SEG_TIMEOUT_MS` on the process-table read | `procSnapshot` `:839`, called from `:874` and `:1819` | must finish | **yes** (Linux reads /proc) | **6 checks flip** (M10); 13 reads per run (M11) |
| `SEG_TIMEOUT_MS` on every predicate segment (git, grep, sed, wc, node) | `runPlan` `:601` via `ctx.timeout` `:1201`; the selftest passes none (`ctxFor` `:1409`) | must finish | no | not planted; under M9 load, 176/176 |
| `SEG_TIMEOUT_MS` on `gitAt` | `:1163` | must finish | no | not planted |
| typed bounds on selftest children: 30000 on the grep-crash probe (`:1384`) and the orphan spawn (`:1796`); 60000 on CLI children (`:1556` L4 LAZY COLLAR, `:1580` REPORT FACE, `:2258` CLI) | the selftest | must finish | no | not planted |
| the orphan sleeper's own life (300000 ms literal in `:1796`), needed live through `:1797-:1863` | L7f | must outlive the family | no | it spans about 3 s here (M9 stamps) |
| `settleMs` 2500 (`:1802`, `:1849`) / 600 (`:1828`, `:1847`); default `SETTLE_MS` (`:206`, `:882`) | L7f | 2500 must see a removal; 600 must not | no | an in-process 40 ms remover; under M9 load, green |
| `RETRY_BASE_MS` ×`RETRY_TRIES` on EBUSY/EDOM (`:206`, `retryLocked` `:706`, `:726`, `:735`) | collar builds | a lock must clear | **lock semantics are Windows'** | not plantable here |
| 700 ms (`:1470`, L2 TIMEOUT) | L2 | must time out | no | direction-safe: more load still times out |

**"By how much"** cannot be measured without the channel (N1, N2). The smallest public channel is §3.

## 3 · QUESTION 2 · THE SMALLEST PUBLIC CHANNEL THAT WOULD NAME IT (the mdtl rule, F2 R2)

By unit mdtl's rule (`git show 9d5c9b8:ci/mdtl/MDTL_SPEC.md`, F2 R2), only bytes that are already public may leave the
runner, and a raw tail of red lines is refused. **mdtl2 has already specced exactly this channel for this member**: its
kind K1, `SUITE MEMBER · <m> selftest exits 0`, rebuilt by the verdict from a closed alphabet (whole literals of the
tracked file, skeletons, tracked paths, digits only where computed). Its §0 prints the probe red as
`… — cause: exit 1 · FAIL <the first failing check, as the literal of scripts/probe.mjs that names it> · and <n> more`
(M12). For the leading candidate the channel would print `FAIL L7f-A4 … · and 5 more` (M10), and each of the six names is
a whole literal (M14), so none of them would be WITHHELD.

**This unit proposes no second channel.** One more public byte would still be missing for "by how much": the seconds of the
failing run. mdtl2 F3 (digits) decides whether a member-computed seconds value may ride. A probe-only `seconds` slot is
named here as F3 of this spec, not built.

**Overlaps with mdtl2, every one named** (read at `ccce4d5`, the tip when this seat started; re-read before the last push,
see §9):
- O1. mdtl2 uses this very red as its live example (its §0, its M3/M4, its N1). Both specs name the same two jobs.
- O2. mdtl2 K1 is the channel §3 depends on. This unit's F1 C waits on it.
- O3. **Fate B removes mdtl2's live example from the neutral machine**: a LIVE member is never spawned, so K1 has no probe
  red to carry. F1 says this out loud.
- O4. mdtl2 M9 (probe: checks 176 · whole 134) is the measurement M14 relies on for the six candidate names.
- O5. mdtl2 F11 (selftest wiring) and its witness BASE (N5) sit at the sha where mdtl lands. Any fate here that edits
  `scripts/organism_test.mjs` (B) touches the same file as mdtl2's code path (its §5). The second landing must merge.

## 4 · QUESTION 3 · THE FATE, BY FORK

- **(A) The bound read from the job's own timeout, as other witnesses do.** The selftest's real spawns that must finish
  take the job's own `timeout-minutes` (`.github/workflows/suite.yml:62`) in place of `SEG_TIMEOUT_MS`. They are the
  predicate segments through `ctxFor`'s `timeout` (`:1409`), and the process-table read, through a new bound parameter on
  `procSnapshot` (`:835`; its callers `:874`, `:1819`). The product `run` keeps its 30 s exactly. Precedents that read the
  job's own `timeout-minutes` and never type it: `scripts/organism_test.mjs:2952-2953` (the WITNESSES member),
  `ci/mrf/witness_mrf.mjs:49`, `ci/mrf/run_mutants_mrf.mjs:24`, `ci/mrj/witness_mrj.mjs:51`,
  `ci/mrj/run_mutants_mrj.mjs:35`, `ci/ms1/witness_ms1.mjs:15`.
  - Cost: it edits `scripts/probe.mjs`, which needs this fork ruled (row 1209 (3)). It cures a TIMEOUT cause only: a race
    (settle, lock) stays red.
  - What it does not loosen: no assert about the product bound moves, because L2 (`:1469-1471`) still plants its own 700 ms.
  - The precedent for a long hang guard over a race bound is mcov's (`scripts/organism_test.mjs:53-62`).
- **(B) The member named among those that time the wall clock.** One entry in `LIVE_SELFTESTS`
  (`scripts/organism_test.mjs:101`), on the profile's own grounds (`:89-92`): "probes the process table (`L7f-P1`,
  `scripts/probe.mjs:1818-1819`; powershell `Get-CimInstance` on Windows, `:839`) · times the wall clock (settle and segment
  bounds)". The reason shape is that of `herd` (`:135`), `blackbox` (`:105`) and `turn_hook` (`:170`).
  - Cost: all 176 checks leave the neutral machine. His laptop's full profile and the watchman still run every one. The
    hermetic member count drops by one (a count the profile computes, `:409`; no count is typed).
  - O3 applies. The table header asks for a measured instrument (`:95-98`, M13); this entry's measurement is the static
    census of §2 plus M10.
  - It needs no `probe.mjs` edit and loosens no bound. One line reverts it.
- **(C) The channel first, the fate pre-ruled on what it prints.** Land nothing for probe until mdtl2's K1 is on main. Then
  the first red leg's `FAIL <check>` decides:
  - one of the M10 six, **or** any check whose run reads `timed_out` → **A**, scoped to that spawn;
  - a settle or lock check (L7f-B*, L7f-A3, `retryLocked`) → **D** if it is an L7f process-table case, otherwise that
    check's own bound becomes the next fork;
  - a typed CLI bound (`:1556`, `:1580`, `:2258`) → A on that spawn.
  - Until then the interim class of row 1209 (2) holds.
- **(D) Plant the table in the five L7f cases that only USE it.** `L7f-A4`, `B1`, `A1`, `A2` and `A3` take a planted
  process table through the door that already exists (`ctx.deps.procSnapshot`, `:874`; already planted by `B6` `:1830` and
  `:2102`): a Map holding `process.pid`'s own chain and the orphan as foreign. `L7f-P1` stays the one real read of the table,
  and its fate is A or B at check level.
  - Cost: it edits `probe.mjs`'s selftest only, not product code.
  - It turns 6 wall-clock checks into 1 (M10 would read 175/176 with only P1 red).
  - It does not cover a non-table cause.
- **(E) Measured and refused.** A retry of the member, the check, or the leg until green is refused in advance (row 1209
  (3)), and so is any variant: re-running the read inside the selftest, raising `RETRY_TRIES`, or treating a second green
  as cancelling a red. None is proposed.

**Recommendation: C, with the fate pre-ruled as above.** Row 1209 (3) says "measures first", and nothing has measured the
cause yet. **If the architect rules that the interim class must retire before mdtl2 lands: B**, for three reasons. It is
the profile's own law applied to a ground mcov never measured. It edits no `probe.mjs` byte. It loosens no bound. A is not
recommended blind: it would raise a bound, from 30 s to the job's minutes, for a cause nobody has named, and it would leave
a race red.

### 4.1 · the interim class of row 1209 (2), until this unit lands
Until then, a leg whose only new reds are `SUITE MEMBER · probe selftest exits 0` and its hermetic roll-up, on a tree whose
path diff against main holds no probe file, is read as NO VERDICT. The runner takes one fresh neutral run of the same tree
and reads that one. Two such reds on one tree go back to the architect. No count, bound or known-red entry moves.

**What retires it:**
- under **B**, the landing commit of the LIVE entry: from it the member is never spawned in the hermetic profile, so the
  class has nothing to match;
- under **A or D**, the landing commit of the bound or plant. After it, a probe member red on the neutral machine is a red of
  the tree, read as any other;
- under **C**, nothing retires it until the fate's own landing. mdtl2's landing only makes each red NAMED. It stays NO
  VERDICT, now with a cause.

The class never retires by a count of green legs: that would be a retry until green, renamed.

## 5 · THE CODE PATH PROPOSED, PER FATE (files and owners at 6a6bdff)

No state file is touched by any fate: `scripts/probe.mjs` owns no state file (`:55`, law 6), and
`scripts/organism_test.mjs` is "Sole writer of nothing" (`:2860`).
- **B:** `scripts/organism_test.mjs`, one `"probe": "<reason>"` key in `LIVE_SELFTESTS` (`:101`). Nothing else.
- **A:**
  - `scripts/probe.mjs`: `procSnapshot(bound = SEG_TIMEOUT_MS)` (`:835`, `:839`, `:849`); `deps.tableBound` read at `:874`;
    the selftest's `ctxFor` (`:1409`) and `L7f-P1` (`:1819`) pass `jobBound`.
  - `jobBound` is read once at selftest start from `<DEFAULT_ROOT>/.github/workflows/suite.yml` by the precedent regex
    (`scripts/organism_test.mjs:2952`).
  - It is absent or unreadable → the selftest says so on one NOTE line and keeps `SEG_TIMEOUT_MS`. That is never a pass by
    absence, and the bound only ever tightens back.
- **D:** `scripts/probe.mjs`, the selftest only (`:1774-:1863`): one `plantedTable()` Map, passed as `deps.procSnapshot` to
  the five cases.
- **C:** nothing in this unit until mdtl2's K1 lands; then the A or D path above.

## 6 · THE WITNESS (`ci/mprb/witness_mprb.mjs`, BASE = the main sha the build is cut from)

It is planted under `os.tmpdir()` only. It binds no port, names no live service, POSTs nothing and restarts nothing (row
1053). Every wait is bounded by the tree's own `timeout-minutes`, read from `.github/workflows/suite.yml`. It makes no
model call.

| clause | plant | base | build |
|---|---|---|---|
| **B1** the member is LIVE under hermetic | a git copy of the tree under tmp, `scripts/probe.mjs` replaced by a stub whose `selftest` exits 1; `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs` (the suites section) | RED: `FAIL SUITE MEMBER · probe selftest exits 0` | GREEN: `LIVE selftest probe — … process table …`, the stub never spawned (the stub journals a spawn marker under tmp: absent) |
| **B2** the full profile still runs it | the same stub, profile unset | RED | RED (the same FAIL): the full profile is untouched |
| **B3** the reason names its ground | read the build's `LIVE_SELFTESTS.probe` | RED (absent) | GREEN: it matches `/process table/` and cites `probe.mjs` |
| **A1** the table read takes the job's bound | `--import` a preload that answers the table spawn ETIMEDOUT iff its `timeout` is ≤ `MPRB_NEEDS_MS`; `PROBE_SELFTEST_ONLY="L7f-P1"`; `MPRB_NEEDS_MS` = one more than the base's `SEG_TIMEOUT_MS` | RED `0/1` | GREEN `1/1` |
| **A2** the bound is READ, never typed | a tree copy whose `suite.yml` says `timeout-minutes: 1`; `MPRB_NEEDS_MS` = that minute plus one | (n/a on base) | RED `0/1`. With the real `suite.yml`: GREEN. This proves the value comes from the file |
| **A3** the product bound is unmoved | `run` CLI on a planted probe, the preload's needs at one more than `SEG_TIMEOUT_MS` | `timed_out` | `timed_out` (the same) |
| **D1** five L7f cases do not read the table | the M10 preload (every table read a bound-hit) | RED `170/176`, 6 FAIL | RED `175/176`, the one FAIL being `L7f-P1` |

On Linux the preloads hide `/proc/self/stat` (as M10 does), so the spawn branch is the one judged. On Windows they
intercept `powershell.exe`.

**Mutants, one per clause** (`ci/mprb/run_mutants_mprb.mjs`; each must turn its clause RED):

| mutant | turns RED |
|---|---|
| the LIVE key misspelt `prob` | B1 |
| `liveSelftest` returning true in the full profile | B2 |
| the reason with no ground | B3 |
| `procSnapshot`'s spawn keeping `SEG_TIMEOUT_MS` | A1 |
| `jobBound` typed as a literal | A2 |
| the product default replaced by `jobBound` | A3 |
| one of the five cases dropping its `deps.procSnapshot` | D1 |

## 7 · FORKS (each for the architect to rule)

- **F1 · the fate.**
  - Options: (A) the job's own bound; (B) the member named LIVE; (C) the channel first, the fate pre-ruled by §4; (D) the
    table planted in five cases, with P1 at check level.
  - **Rec C; if the interim class must retire first, B.**
  - *Decides it:* the first `FAIL <check>` mdtl2's K1 prints on a red leg (N1).
- **F2 · B's cost to mdtl2.**
  - Options: (A) accept that B removes the live example (O3); (B) land B only after mdtl2's K1 has printed one probe red.
  - **Rec B.**
  - *Decides it:* whether mdtl2 is ruled before the next probe red.
- **F3 · "by how much".**
  - Options: (A) no seconds leave; (B) the failing run's `seconds`, a value the member computes (`:637`), rides under
    mdtl2 F3's digit rule.
  - **Rec A until mdtl2 F3 is ruled.**
  - *Decides it:* mdtl2 F3.
- **F4 · the scope of A, if A.**
  - Options: (A) the process-table read only; (B) every real spawn the selftest makes; (C) only the spawn K1 names.
  - **Rec C.**
  - *Decides it:* N1.
- **F5 · the side finding, M11.**
  - On a machine with neither Windows nor `/proc`, `L7f-B1` and `L7f-A1` are red by construction (`session` null on the
    `ps` branch, `:849-851`).
  - Options: (A) record only; (B) a separate unit.
  - **Rec A** (neither CI nor his laptop is such a machine).
- **F6 · the hermetic table's instrument.**
  - `scripts/organism_test.mjs:95` cites `ci/b1/probe.mjs`, which is absent (M13).
  - Options: (A) record only; (B) name the instrument's location as a fork for the unit that owns the table.
  - **Rec B.**
  - *Decides it:* N4.

## 8 · NAMED NOT GUESSED

- **N1.** Which of probe's checks failed on 136341665594 and 136344033976, and whether it was an exit or a kill.
  *Measure:* mdtl2's K1 on the next red leg. On his laptop, no measure: it does not reproduce off the neutral machine.
- **N2.** The wall time of `Get-CimInstance Win32_Process` on `windows-latest`, cold and warm, against the 30 s bound.
  *Measure on his laptop (Windows):* `Measure-Command { Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,SessionId,Name | ConvertTo-Csv -NoTypeInformation }`,
  run 13 times in a row. On the runner, only through a channel.
- **N3.** Whether the job log, signed in, holds anything beyond names. By `suite.yml:115` it should not. *Measure:*
  a signed-in read of 136341665594's log by the architect. This seat did not read it (M6).
- **N4.** Where `ci/b1/probe.mjs` lives, and whether it journals process-table spawns on Windows. *Measure:*
  `git log --all -- ci/b1/probe.mjs` on his laptop's clone.
- **N5.** Whether the `RETRY_BASE_MS` lock path (`:706`) fired on either red leg. *Measure:* N1's channel, which would
  name a collar check.
- **N6.** Why the merge-base step runs in 100–152 s while the head step runs 1999–2920 s (M5). It is not this unit's
  question. It is named so that nobody reads it as evidence.

## 9 · THE FILES A BUILD WOULD TOUCH

- B: `scripts/organism_test.mjs` (`:101` only).
- A: `scripts/probe.mjs` (`:835`, `:839`, `:849`, `:874`, `:1409`, `:1819`).
- D: `scripts/probe.mjs` (`:1774-:1863`).
- Every fate: `ci/mprb/witness_mprb.mjs`, `ci/mprb/run_mutants_mprb.mjs`, `ci/mprb/BASE`, `ci/mprb/PROOF.md`,
  `ci/mprb/LEDGER.jsonl`.
- Beyond these, as a fork: `package.json` (no change is needed by any fate, so none is proposed) and `.github/workflows/suite.yml` (read only, never edited).

mdtl2 re-read before the last push: see the LEDGER row `read` that follows the spec commit.

## 10 · CHECK RUNS OF THIS BRANCH

See the LEDGER rows `checks` (each sha, run ids and conclusion, read by `curl -s $API/commits/<sha>/check-runs`, no token
sent by this seat). A spec branch adds no witness file under `ci/mprb/`, so the witnesses member judges nothing new here.
