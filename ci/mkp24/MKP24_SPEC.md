# UNIT mkp24 · THE KEEPER FAMILY ON NODE 24 AFTER mrv (spec, forks row 1185 (5) as row 1186 (4) launches it)

Seat: cloud spec seat, unit mkp24. Branch `claude/mkp24-spec`, cut from origin/main **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**
(fetched 2026-11-20). This file is a SPEC. It builds nothing, lands nothing and quotes no state file. Every `file:line` below
is at 5759cce unless another sha is named. The mdtl spec was read first and whole (`git show 9d5c9b8:ci/mdtl/MDTL_SPEC.md`).

## 0 · THE HEADLINE

**The premise "node 24 alone" does not hold on the public record.** Read through the public check-run annotations, no token
(2026-11-20), the keeper family went red on 4 of 86 neutral legs since 5759cce:

- `WITNESS ‹mlv3›`: 3 legs. Node 24 twice (0a73a81, e10d4eb) and **node 22 once (1302da5)**.
- `WITNESS ‹mrv›`: 1 leg, **node 22 (5444815)**.
- `WITNESS ‹mlv1›` and `WITNESS ‹mlv2›`: 0 legs.

**Two of the four reds sit on trees whose only diff from main 5759cce is `.claude/settings.json`** (1302da5, 5444815,
measured by the public compare API). So the red is of main's own keeper-family bytes on the Windows runner. It is neither of
node 24 nor of any seat's diff. That is the evidence row 1185 (1) asks for on mlaw (FK13, "the red is not of mlaw bytes").
It goes to the architect as evidence; this spec rules nothing.

No annotation names a clause: each red is a name with no cause, the shape mdtl fixes. The neutral measurement therefore
**waits for mdtl on main** (row 1186 (4)). §6 names exactly what it reads then.

**A clause id alone cannot name the cause here**, because the clause most likely to red has eight distinct failing branches
that span the clock, port, process-table and filesystem-event classes. mlv3 T2 is that clause (`ci/mlv3/witness_mlv3.mjs:207-236`, the clause opens at `:207`).
§5 proposes **shape C0** for the keeper witnesses inside their own re-cut: a `CAUSE <ID> <CODE>` line whose CODE is a key of a
`CAUSES` literal in the witness's tracked source. Only that literal's text leaves. It carries no digits, and its canary safety
is a witness clause (K6).

## 1 · MEASUREMENTS (each by command, its last line, 2026-11-20)

`API=https://api.github.com/repos/nikhil1429/arsenal-ai-fc`. Every curl carries no token. The agent proxy authenticates
(M9), so "no token" is proven for this seat's own requests and not for an anonymous reader (N5).

| # | Command | Last line |
|---|---|---|
| M1 | `git fetch origin main; git rev-parse FETCH_HEAD` | `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` |
| M2 | `curl -s "$API/actions/runs?created=%3E%3D2026-11-19T21:00:00Z&per_page=100"` (pages 1-3) | `total_count 75`. The completed, non-cancelled `suite` runs give 42 distinct heads and 86 legs (43 per node) |
| M3 | for each such run: `curl -s $API/actions/runs/<id>/jobs`, then `curl -s $API/check-runs/<job>/annotations` (scratchpad `annot.mjs`) | `{"node 22":{"legs":43,…"mlv3":1,…"mrv":1},"node 24":{"legs":43,…"mlv3":2,…}}` (NEW RED witness counts per leg) |
| M4 | `curl -s $API/check-runs/136021209467/annotations` | `failure \| NEW RED · node 22 1/1 \| WITNESS ‹mlv3› · GREEN at head against its BASE`. Its verdict payload reads `"new":["WITNESS ‹mlv3› · GREEN at head against its BASE"],"base_red":1`: **a name, no clause** |
| M5 | `curl -s "$API/compare/5759cce...<sha>"` for 0a73a81, e10d4eb, 1302da5, 5444815 | `1302da5 ahead 1 behind 0 base 5759cce files .claude/settings.json`. 5444815 reads the same. 0a73a81 is ahead 117 (mlaw: `scripts/organism_test.mjs`, `scripts/ci_verdict.mjs`, …). e10d4eb is ahead 21 (mgat: `scripts/cortex.mjs`, …) |
| M6 | `grep -ln "keeper.mjs" ci/*/witness_*.mjs` | `ci/mlv0 · ci/mlv1 · ci/mland · ci/mlj · ci/mport · ci/mrt · ci/ms1` (mlv2 and mlv3 spawn their own organ as the keeper: `scripts/cortex.mjs`, `scripts/thalamus.mjs`) |
| M7 | `sed -n 1,3p ci/mrv/PROOF.md` | `# MRV PROOF — the three keeper-family witnesses stand on their own clocks and preconditions` |
| M8 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (this container, no `npm ci`), exit 2 | on 2026-11-20 the headline read `organism_test: 141 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)`. The witness line read `SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2)`. **The container measures nothing about the keeper family** (and linux is not the measurement, row 1185 (5)) |
| M9 | `curl -s https://api.github.com/rate_limit` | `core limit 15000`. The proxy is not anonymous |
| M10 | `curl -s $API/actions/runs/44686340528` (mlaw 87d72d3, row 1185 (1)) | `44686340528 87d72d3 in_progress null` at the cut. Its two legs are read after this push (§10) |
| M11 | `grep -ln keeper ci/mpool/witness_mpool.mjs` | (no output). mpool's no-cause red (mdtl §8) is **not** of the keeper family |
| M12 | canon scan over the COMMIT blobs (§11) | `canon_scan <sha> · … md blobs · … declared · 0 undeclared` |

### The neutral-leg reds of the keeper family since 5759cce (M3, M5)

| head | run | leg · check run | NEW RED | the head's diff from 5759cce |
|---|---|---|---|---|
| 0a73a81 (mlaw-build) | 44653619183 | node 24 · 136014324380 | `WITNESS ‹mlv3›` (1/1) | mlaw code (117 commits ahead); node 22 leg 136014324830 GREEN |
| 5444815 (mshard-queue) | 44653194131 | node 22 · 136012910676 | `WITNESS ‹mrv›` (1/1) | `.claude/settings.json` only; node 24 leg 136012910530 GREEN |
| 1302da5 (mguardb-queue) | 44655686109 | node 22 · 136021209467 | `WITNESS ‹mlv3›` (1/1) | `.claude/settings.json` only; node 24 leg 136021208912 GREEN |
| e10d4eb (mgat-build) | 44657947058 | node 24 · 136028733378 | `WITNESS ‹mlv3›` (1 of 3) | mgat code (touches `scripts/cortex.mjs`, not thalamus); node 22 leg red on mgat and LOAD ZERO only |

Main 5759cce itself is GREEN on all four of its legs (runs 44625877530 and 44616410095). Every red is one leg of two.

## 2 · THE KEEPER FAMILY, NAMED (and how each was found)

- **K-core (ruled, row 1139 (1)):** `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs` and `ci/mlv3/witness_mlv3.mjs`.
  M7 names them; `ci/mrv/witness_mrv.mjs:45` names them again (`NAMED = (f) => /^ci\/(mlv1|mlv2|mlv3|mrv)\//`).
  - mlv1's keeper is `scripts/sitting.mjs` with `scripts/keeper.mjs` (`:49`, NAMED).
  - mlv2's keeper is `scripts/cortex.mjs` (`:46`, NAMED).
  - mlv3's keeper is `scripts/thalamus.mjs` (`:52`).
- **K-own:** `ci/mrv/witness_mrv.mjs`, the family's own witness. It runs all three under its plants (`ci/mrv/plant_mrv.mjs`),
  so it inherits every dependency below. It is red once (5444815).
- **K-adjacent (found by M6, not ruled into the family):** mlv0, mland, mlj, mport, mrt and ms1 spawn `scripts/keeper.mjs`.
  On the public record they show 0 reds of 86 legs since 5759cce (M3). Whether they belong is FORK K-F1.

## 3 · WHAT EACH DEPENDS ON (file:line at 5759cce)

The three core witnesses share one skeleton. Lines are given as mlv1 / mlv2 / mlv3.

| class | the dependence | where |
|---|---|---|
| **clock** | SLACK is ONE node start, sampled once: `Math.max(1, Date.now() - t0)` | `:59` / `:56` / `:62` |
| clock | IMPORT is one rehearsal process; BOOT0 is two IMPORTs plus three SLACKs | — / `:84,:88` / `:101,:105` |
| clock | BOUND is the first boot plus SLACK, measured ONCE. **Every later retire, defer and drain wait is bounded by it** | mlv2 `:170`, mlv3 `:188` |
| clock | mlv3 T2's drain wait is `DRAIN_MS + BOUND`; DRAIN_MS is read from the organ (`scripts/thalamus.mjs:1503`) | mlv3 `:231-232` |
| **filesystem events** | the retire is triggered by `touchClosure()` appending to the entry. The organ sees it through `fs.watch` on each closure dir, with a poll floor of `KEEP_POLL_MS` (`scripts/keeper.mjs:161`, `:190-196`). The witness bound sits far below that poll, so **a missed or late `fs.watch` event on the Windows runner is a red**. `staleSources` is a strict `>` against the boot time (`scripts/keeper.mjs:143`) | `:91` / `:131` / `:141` |
| **port** | `freePort()` binds port 0, reads it and releases it, then hands it to the child (a window in which the port can be taken) | `:60` / `:57` / `:63` |
| port | after a kill, `portFreed()` waits for the planted port to bind again, bounded by BOUND. It prints the `PORT_HELD` machine line | `:106` / `:146` / `:164` |
| port | **LIVE-SAFE binds the FIXED `4112` and `4113`** as counting listeners for the whole run. If either is held, it reds `cannot plant`. The member's B4 (`scripts/organism_test.mjs:2826`, `:2907`) lets it pass. FORK K-F6 | mlv2 `:46,:61-66` · mlv3 `:52,:66-72` |
| **process table** | `killTree` runs `taskkill /PID … /T /F` on win32 and waits for exit, bounded by BOUND | `:83` / `:117` / `:127` |
| process table | LAST reads `Get-CimInstance Win32_Process` for survivors naming the witness's own temp dir | `:225` / `:265` / `:312` |
| process table | the member sweeps `namingProcs(<member tmp>)` after each witness (`scripts/organism_test.mjs:2858-2870`, `:2933`). That is the member's tmp, **not** the witness's own `mkdtemp` (`ci/mlv3/witness_mlv3.mjs:54`) | — |
| **order** | witnesses run one after another in ONE member process, in `readdirSync(ci).sort()` order (`scripts/organism_test.mjs:2805`). mlv1, mlv2 and mlv3 run back to back, and `left` shrinks with every unit (`:2921`) | — |
| order | since mrv, each clause after the first stands on its own keeper through `ready()`. I1 / C1 / T1 still stand on the first boot | `:94-118` / `:134-160` / `:152-178` |
| order | T2 needs **at least one event to arrive while nothing listens** (`fates.pending > 0`, mlv3 `:234`). A respawn fast enough to fall between two sends reds it with no fault in the organ | mlv3 `:213-230,:234` |
| **network** | loopback only: `fetch(http://127.0.0.1:<planted>)` with `AbortSignal.timeout(BOUND)`. There is no external host | `:—` / `:126` / `:136` |
| **node version** | nothing in the family branches on `process.version`. A node-24-only cause would ride the clock or event classes above (N3, N4) | — |

## 4 · WHAT THE PUBLIC RECORD CAN AND CANNOT SAY

- **Can:** which witness went red, on which leg and at which head (§1), and whether the head carried code (M5).
- **Cannot:** which clause went red, or why. The witness's own clause lines and its LAST line stay on the runner:
  - `scripts/organism_test.mjs:2932` prints `  witness ‹unit› … · <last>`;
  - `.github/workflows/suite.yml:115` lets only `^  (ok  |FAIL|LIVE) ` lines out.
- The `PORT_HELD` lines **do** leave the runner today: they are promoted to ok assert names (`scripts/organism_test.mjs:2937`),
  but in the job log, not in an annotation. Row 1186 F5 A gives the port-held printers their own row at the build.

## 5 · SHAPE C0 FOR THE KEEPER WITNESSES (row 1186 (4): "if a clause id alone cannot name the cause")

**Why R2 (clause id plus its header claim) is not enough for this family.** mlv3 T2 alone has these failing branches, each of
a different class:

| branch | class | site |
|---|---|---|
| `cannot run: no daemon up` (ready: port still held / keeper waiting / worker exit / keeper exit) | port · process · order | `:208`, `:172-178` |
| `no RETIRING line within BOUND` | filesystem events · clock | `:224` |
| `the respawn did not come up` | process · clock | `:226` |
| `fates.pending > 0` false | order · clock | `:234` |
| `cannot run: the drainer's tick is not readable` | source | `:231` |
| spool not drained within `DRAIN_MS + BOUND` | clock | `:232` |
| `lost > 0` · `twice > 0` | organ behaviour (a REAL defect) | `:233-234` |

R2 would print `T2 · ONCE a stream of events runs THROUGH a retire …` for all of them. **It cannot tell a timer from a lost
event**, and that is the one distinction the architect needs before ruling the family flaky or broken.

**C0, proposed for the re-cut:**

1. Each core witness gains ONE literal object near its header:

       const CAUSES = { "NOT-UP-PORT": "the planted port was still held after the kill", …, "LOST": "an event never landed" };

   The CODE grammar is `/^[A-Z][A-Z0-9-]*$/`, the same as mdtl's `ID`. Each why-branch of §5's table (and the same for T1, T3,
   T4, I1-I3, C1-C3 and K5, LIVE-SAFE and LAST) gets one CODE. The clause's printed `why` is UNCHANGED.
2. Before its RED clause line, the witness prints `CAUSE <ID> <CODE>`, one line per failing clause. It prints only CODEs that
   are keys of CAUSES, chosen by the code path (never built from runtime text).
3. mdtl's channel carries it. The member collects `^CAUSE ` lines into the same `causes[]` that mdtl's `causesOf` builds.
   mdtl's `verifyCause` gains one rule: `<CODE>` must be a key literal of `CAUSES` in `readSrc(ci/<unit>/witness_<unit>.mjs)`,
   and the text that leaves is **that literal's value, read from the tracked source by the verifier**, never the witness's
   stdout. Anything else becomes mdtl's WITHHELD literal.
4. **No digits leave in C0.** The ms figures stay in the `PORT_HELD` names, which already leave (row 1186 F5 A). C1 (codes plus
   digit slots) is FORK K-F2's option B.

**Canary safety.** What leaves is a key and a value of a literal in a tracked public file, re-read by a second file (the
verifier) from the workspace. A runtime string can select a CODE but never become text. K6 below plants a canary in the copy's
state, a forged CODE and a forged value, and asserts zero leaving lines carry either.

## 6 · THE NEUTRAL MEASUREMENT (WAITS for mdtl on main, row 1186 (4))

Once mdtl is on main, and on every neutral run after it, read by `node scripts/ci_verdict.mjs <sha>` (the anonymous reader) or
by curl of the annotations:

1. For each NEW RED `WITNESS ‹mlv1|mlv2|mlv3|mrv›` on either leg: its `cause · <id> · <claim>` lines (R2). These name the
   **clause**, and for mrv the mlv clause it carried (M1 RESTART, M2 ALONE, …).
2. The tally by (witness, clause, node, head-diff class: settings-only, or code). The question it settles is whether one clause
   carries the reds or they spread over several.
3. The head's diff class by the compare API (M5), so a red on a settings-only tree is counted apart.
4. If (1) shows a clause of §5's multi-branch kind (T2, or a `cannot run` of any clause), **R2 cannot name the cause**, and K-F2
   C0 is the re-cut's first job.
5. If mdtl is adopted before a keeper red recurs, the measurement waits for the next red. This spec types no count of runs to
   wait for (K-F4).

## 7 · THE CODE PATH PROPOSED (the re-cut, after mdtl is on main and its first keeper red is read)

The re-cut is made in place, the old text struck (the row 1135 (2) F-1 A precedent); each `ci/<w>/BASE` is kept.

- `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs` and `ci/mlv3/witness_mlv3.mjs` each gain:
  - the `CAUSES` literal;
  - one `CAUSE <ID> <CODE>` print per failing clause.

  **No wait, bound, clause id or claim changes.**
- `ci/mrv/witness_mrv.mjs`: its `verdict()` passes the inner witness's CAUSE lines through as its own, mapped to mrv's clause
  id. Its NAMED set is unchanged.
- `scripts/witness_cause.mjs` (mdtl's module, once on main): `verifyCause` gains the CAUSES-key rule (§5 step 3). This is
  another unit's file, so the edit goes through its owner's build (FORK K-F3).
- `scripts/organism_test.mjs`: the member collects `^CAUSE ` lines from the witness output into mdtl's `causes[]`. Because the
  judged name and detail stay byte-identical, KNOWN_RED keeps its match.
- New `ci/mkp24/witness_mkp24.mjs`, `ci/mkp24/plant_mkp24.mjs`, `ci/mkp24/run_mutants_mkp24.mjs` and `ci/mkp24/BASE`.

**Owners.** No state file is written. Each organ on the path declares it writes nothing: `scripts/ci_verdict.mjs:5`
(`SOLE WRITER of: NOTHING`), `scripts/organism_test.mjs:2795` ("Sole writer of nothing"), and mdtl's `scripts/witness_cause.mjs`
(`SOLE WRITER of: NOTHING`, mdtl §3). The witnesses write only under `os.tmpdir()`, the copy's planted state included. The repo's
`dressing-room/state` is never touched.

## 8 · THE WITNESS (ci/mkp24/witness_mkp24.mjs; BASE = main at the build's cut, which carries mdtl)

The witness is shaped like mrv: a copy of `--org` under `os.tmpdir()`, and the core witnesses run under a preload plant
(`plant_mkp24.mjs`). The preload is inert unless `MKP24_PLANT` is set, `MKP24_DIR` is under the temp dir, and the process is a
planted keeper or worker. The member's chain then runs on the copy, with `compare` and `readVerdict` fed by a planted fetch
(mdtl §4's harness). "Leaves the machine" means mdtl's three channels.

| Clause | Plant | Claim | base | build |
|---|---|---|---|---|
| **K1 RETIRE-LATE** | p-watch: the worker's `fs.watch` handed a no-op (the `watch` parameter of `retireWhenIdle`, `scripts/keeper.mjs:164-165`; thalamus calls it at `scripts/thalamus.mjs:3211`), so only the poll floor can retire | mlv3 red at T1, and its cause reads `T1 · RETIRE-LATE · <the CAUSES value>` | RED: no CAUSE line, R2 at most | GREEN |
| **K2 NO-GAP** | p-gap: the keeper respawns before the witness's next send (mrv's p1 inverted: the respawn is not slowed) | T2 red with cause `NO-GAP`, **and not** `LOST` | RED | GREEN |
| **K3 PORT** | mrv's p2 holder (outside the keeper's tree) | mlv1 red at I2 or I3 with cause `NOT-UP-PORT` | RED | GREEN |
| **K4 LOST** | p-drop: the planted worker drops one `/afferent` body after its 2xx | T2 red with cause `LOST`. The organ-defect code is separable from every clock code | RED | GREEN |
| **K5 UNPLANTED** | none | the core witnesses read GREEN, print no CAUSE line, and their judged name and detail are byte-identical to base | GREEN (guard) | GREEN |
| **K6 NO-LEAK** | a canary in the copy's planted state; a toy witness prints `CAUSE P1 <canary>` and `CAUSE P1 KNOWN` with a forged `CAUSES` value in stdout | the canary and the forged value appear in zero leaving lines; `WITHHELD` is readable for the first, the SOURCE value for the second | RED (the WITHHELD and source-value halves are absent at base) | GREEN |
| **BOUND** | — | outside `ci/`, only `scripts/organism_test.mjs` and `scripts/witness_cause.mjs` differ | RED | GREEN |
| **LAST** | — | no node process naming the temp dir survives | GREEN | GREEN |

**THE PORT CLASS (row 1053).**
- No clause of mkp24 binds a fixed port. K-F6 names the core witnesses' own `4112`/`4113` LIVE-SAFE listeners; they are
  untouched here, and the mkp24 copy runs them as they are.
- Every planted port is OS-picked and handed through an env door (`ARSENAL_THALAMUS_PORT`, `ARSENAL_JUDGE_PORT` and
  `ARSENAL_CORTEX_PORT`, honoured only under the temp dir).
- Nothing POSTs at a live daemon and nothing restarts one.
- Every wait is bounded by the inner witness's own BOUND, or by the member's derived `left`. No budget is typed.
- The member's `claude`/`gemini` refusing shims stand (`scripts/organism_test.mjs:2911-2914`).

### Mutants (one per clause, each must turn its clause RED on the build)

- **K1-m**: T1 prints no CAUSE line.
- **K2-m**: the `fates.pending > 0` branch maps to `LOST`.
- **K3-m**: `ready()`'s port branch maps to the keeper-exit code.
- **K4-m**: `LOST` and `TWICE` share one code.
- **K5-m**: a CAUSE line is printed on GREEN.
- **K6-m**: `verifyCause` returns the witness's printed value instead of re-reading the source.
- **BOUND-m**: a third file outside `ci/` is touched.
- **LAST-m**: a planted worker is detached past its keeper.

## 9 · FORKS (each for the architect to rule)

- **K-F1 · the family's scope.**
  - (A) mlv1, mlv2 and mlv3, plus mrv as their own witness;
  - (B) A plus the six keeper-spawning witnesses of M6.

  **Rec A.** B shows 0 reds of 86 legs (M3). *Decides it:* a K-adjacent red in §6's tally.
- **K-F2 · the cause shape for this family.**
  - (R2) mdtl's clause id and claim only;
  - (C0) §5: CAUSES codes, no digits;
  - (C1) C0 plus digit slots for the measured bound and elapsed time.

  **Rec C0.** R2 cannot split T2 (§5). C1 leaks any digit-only canary by construction. The ms figures already leave as
  `PORT_HELD`. *Decides it:* §6 (1) — the first keeper red read through mdtl. A single-branch clause (T1, T4) would leave R2
  enough.
- **K-F3 · who edits `verifyCause`.**
  - (A) the mkp24 build edits `scripts/witness_cause.mjs` once mdtl is on main;
  - (B) unit mdtl2 (row 1186 F7) carries the CAUSES rule.

  **Rec A**, after mdtl lands: one rule, one file, a BOUND name. *Decides it:* whether mdtl2 is launched first.
- **K-F4 · when.**
  - (A) the re-cut waits for mdtl on main and the first keeper red read through it (row 1185 (5): "it rides after (4) reads
    its first red");
  - (B) build C0 now on mdtl's spec.

  **Rec A**, by the row's words.
- **K-F5 · the node-24 premise.** The public record shows the family red on node 22 too (§1).
  - (A) the unit covers both Windows legs;
  - (B) node 24 only, as named.

  **Rec A.** *Decides it:* §1's table, now.
- **K-F6 · LIVE-SAFE's fixed `4112`/`4113` listeners** (mlv2 `:61-66`, mlv3 `:66-72`) sit against row 1053's letter.
  - (A) out of scope here, as a named row;
  - (B) inside this re-cut.

  **Rec A.** Its red would read `LIVE-SAFE · LIVE-PORT-HELD` under C0. *Decides it:* a LIVE-SAFE cause in §6's tally.
- **K-F7 · mlaw at 87d72d3** (row 1185 (1)).
  - (A) the two settings-only reds (1302da5, 5444815) are read as evidence that a keeper-family red is not of mlaw bytes;
  - (B) row 1185 (1) stands as worded: a keeper-family red on node 24 alone holds mlaw.

  **No rec: it is the architect's own branch rule.** This spec only measures. 87d72d3's legs: §10.
- **K-F8 · mpool's no-cause red** (mdtl §8; M11).
  - (A) not of this family, so not this unit;
  - (B) folded in.

  **Rec A.**

## 10 · CHECK RUNS OF THIS BRANCH, AND OF 87d72d3

Pushed 2026-11-20. The check runs of each tip of `claude/mkp24-spec` are read by curl after the push and recorded in
`ci/mkp24/LEDGER.jsonl`. A file cannot carry its own verdict. The diff is `ci/mkp24/` only, and `ci/mkp24` holds no witness,
so the member does not run it; a red on this branch is evidence of the §1 kind. The legs of mlaw's 87d72d3
(run 44686340528) are recorded in the same ledger.

## 11 · NAMED NOT GUESSED

- **N1.** Which clause of mlv3 went red on 136014324380, 136021209467 and 136028733378, and which mrv clause on 136012910676.
  Those lines never left the runner (§4); **no channel recovers them**. *Measure:* §6, on the next red after mdtl.
- **N2.** SLACK, IMPORT, BOUND and the port-held ms on the Windows legs. They ride the `PORT_HELD` ok-names in the job logs
  (`scripts/organism_test.mjs:2937`), and this seat reads no job logs (row 1185 (5): annotations). *Measure on his laptop:*
  `curl -s <API>/actions/jobs/136021209467/logs`, signed out, then grep `PORT_HELD`.
- **N3.** Whether `fs.watch` on the Windows runner delivers the append to the entry within BOUND every time. *Measure on his
  laptop:* the mrv seat's repetition script over mlv3, Windows, node 22 and node 24, counting T1 reds.
- **N4.** Whether the node 24 Windows build differs from node 22 in child-spawn or watch latency. *Measure:* the same
  repetition, with SLACK and IMPORT printed per run.
- **N5.** Whether an anonymous client reads these annotations: the proxy here authenticates (M9). *Measure on his laptop:*
  `curl -s -o NUL -w "%{http_code}" <API>/check-runs/136021209467/annotations`, signed out.
- **N6.** Whether a held `4112`/`4113` ever occurs on the runner (K-F6). *Measure:* §6's tally after C0.

## 12 · WHAT A BUILD TOUCHES

- `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs`, `ci/mlv3/witness_mlv3.mjs` and `ci/mrv/witness_mrv.mjs` (§7).
- `scripts/organism_test.mjs` (the `^CAUSE ` collection beside `:2937-2938`).
- `scripts/witness_cause.mjs` (K-F3 A).
- `ci/mkp24/witness_mkp24.mjs`, `plant_mkp24.mjs`, `run_mutants_mkp24.mjs` and `BASE`.

**Beyond these, each a fork:**
- `scripts/keeper.mjs`, `scripts/thalamus.mjs` and `scripts/cortex.mjs` (none is proposed; a C0 red naming an organ defect
  would open its own row);
- `.github/workflows/suite.yml` (none);
- `scripts/ci_verdict.mjs` (none beyond mdtl's).

## 13 · THE CANON-COUNT REPLAY (row 1169)

Before each push, the LOAD ZERO BLOCK 7 scan (`scripts/organism_test.mjs:1874-1923`) is replayed over `git show <sha>:<path>`
for every tracked `.md` of the commit (scratchpad `canon_scan.mjs`). Any undeclared line means no push.

## 14 · NEW MAIN 3f22388 (unit mlaw landed; the runner's new-main line, read 2026-11-20)

The base section is read against `3f2238887947e5827d2ce8f07a480e9dea3f527c`. Measured by
`git diff --name-only 5759cce 3f22388` (its stat reads `14 files changed, 1261 insertions(+), 26 deletions(-)`).

- **The keeper family is untouched.** No file of `ci/mlv1`, `ci/mlv2`, `ci/mlv3` or `ci/mrv` changed. Neither did
  `scripts/keeper.mjs`, `scripts/thalamus.mjs`, `scripts/cortex.mjs`, `scripts/sitting.mjs` or `.github/workflows/suite.yml`
  (the grep for them prints nothing). §2, §3 and §5 stand as written.
- **`scripts/organism_test.mjs` shifted; none of its witness-member logic changed.** The diff adds nothing that names
  witness, KNOWN_RED, judgeLast or PORT_HELD. The hunks are at `:121`, `:214`, `:2696` (+12) and `:2703` (+5). So every
  anchor this spec gives:
  - **at `:2795` or later moves by +18** (`:2795`→`:2813`, `:2805`→`:2823`, `:2826`→`:2844`, `:2858-2870`→`:2876-2888`,
    `:2907`→`:2925`, `:2911-2914`→`:2929-2932`, `:2921`→`:2939`, `:2932`→`:2950`, `:2933`→`:2951`, `:2937-2938`→`:2955-2956`);
  - **in `:1874-1923` moves by +1** (`:1875-1924`);
  - **at `:46-50` is unchanged.**

  Each was re-found by its text in `git show 3f22388:scripts/organism_test.mjs`.
- **`scripts/ci_verdict.mjs` changed** (mlaw's law-pack lane). Its header `:5` (`SOLE WRITER of`) and `:22` are unchanged,
  so §7's owner line stands. Two things move for this unit:
  1. `compareLines` now also emits NEW REDs named by law and numbers (`lawpackRises`). These share the cap of nine NEW RED
     annotations that mdtl's cause channel rides. A head with more new reds than the cap would lose the later ones' causes.
     That is mdtl's question; it is named here as **N7**. *Measure it:* mdtl's build, at its own base.
  2. mdtl's spec anchors in `ci_verdict.mjs` (`parseSuite`, `compareLines`, `annotate`) moved. §5 step 3 and §7 name mdtl's
     functions, not their lines, so nothing here is re-cut.
- **`package.json`** gained `node scripts/done.mjs selftest` on the `organism:selftest` line. It touches no file of §12.
- **mlaw's other witnesses** (`ci/mdn2`, `ci/mdone`, `ci/mlaw`) are not of the keeper family (K-F1).
- **K-F7 is answered by the landing itself.** mlaw landed after 87d72d3 read GREEN on both legs (run 44686340528, §10).
- **The §1 record is unchanged.** It counts reds since 5759cce. The measurement in §6 still waits for mdtl on main.

## 15 · NEW MAIN cebe3eb (unit mcov landed; the runner's new-main line, read 2026-11-20)

The base section is read against `cebe3ebe4024c2144b934b3032b3fb837285d926`. Measured by
`git diff --name-only 3f22388 cebe3eb` (its stat reads `9 files changed, 786 insertions(+), 16 deletions(-)`).

- **The keeper family is untouched again.** None of these changed: `ci/mlv1`, `ci/mlv2`, `ci/mlv3`, `ci/mrv`, the keeper,
  thalamus, cortex and sitting organs, `scripts/ci_verdict.mjs` and `.github/workflows/suite.yml` (the grep for them prints
  nothing). §2, §3, §5 and §14's compare note stand.
- **`scripts/organism_test.mjs` shifted again.** Every anchor of §14 from `:1875` onward moves by a further +21: the canon block
  sits at `:1896-1945`; the member's header (`Sole writer of nothing`) at `:2834`; `witnessUnits`' sort at `:2844`;
  `fixedPortHits` at `:2865`; `namingProcs` at `:2898`; the B4 check at `:2946`; the refusing shims at `:2951`; `left` at
  `:2960`; the sweep at `:2964`; the witness's runner line at `:2971`; PORT_HELD at `:2976`; the judged assert at `:2977`.
  `assert` at `:46-50` is unchanged (the first hunk is at `:52`). Each was re-found by its text in
  `git show cebe3eb:scripts/organism_test.mjs`.
- **The new member bound does not bind the keeper witnesses.** `MEMBER_BOUND_MS` (and `HEAVY_BOUND_MS`, the value the heavy
  modes already had) bounds the member runs made through `run()`. `witnesses` is a MODE run in-process
  (`const MODES = { …, witnesses }`, `:3052`), and its children are spawned with their own `left`, derived from `suite.yml`'s
  timeout-minutes (`:2960`, unchanged). So §3's order row and §8's bound line stand.
- **The "killed by the suite bound" wording** (`redWhy`) names a killed member run in the hermetic roll-up. The witness member's
  own killed literal (`killed at the member's bound …`) is unchanged, so mdtl's `KILLED` member literal, which §5 step 3 leans
  on, keeps its match.
- **`ORGANISM_TEST_MEMBER_BOUND_MS`** is a lower-only door. mkp24's witness plants nothing through it: no clause of §8 needs a
  hanging member.
- **`package.json` and `scripts/study_scope.mjs`** touch no file of §12. mcov's `ci/mcov` is not of the keeper family (K-F1).
- **The §1 record is unchanged.** The measurement in §6 still waits for mdtl on main.
