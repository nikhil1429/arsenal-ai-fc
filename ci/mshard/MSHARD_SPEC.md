# UNIT mshard · THE WITNESSES MEMBER SPLIT ACROSS JOBS (spec, forks row 1171 (3))

A SPEC. Nothing here is built. Branch `claude/mshard-spec`, cut 20 Nov 2026 from `origin/main` =
**5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90** (`git fetch origin main` → `git log -1 --format=%H FETCH_HEAD`).
Every `file:line` below is at that base. Every number is a measurement, dated 20 Nov 2026, with its command;
a fact the cloud could not reach is in §7, never guessed.

**THE RULING (row 1171 (3), verbatim in the brief):** the landed leg runs only for a ci dir that differs from the
merge base of the push (FK8 A); the head leg ALWAYS runs every unit (it catches a later unit breaking an earlier one);
**the job bound is not raised**; if a leg still dies at the bound on the new main, unit mshard (the head leg split across
jobs) is named, spec first. This spec answers (3) only.

**HEADLINE (20 Nov 2026).** On main, a leg is about 40 minutes and fits. The witnesses member alone is 1762.8 to 2226.2 s
(member line, 8 green Windows legs), and grows by one witness per landed unit. ms2's own push adds a landed leg of about
1785.5 s and dies at the 60-minute bound. The proposal: run the witnesses member as **K shard jobs per node**, each
running a fixed, disjoint slice of `witnessUnits(head)`. Head and landed leg of a unit always ride the same shard. A
**fold job keeps the name `npm test · node N`**, so `ci_verdict.mjs <sha>` still reads ONE verdict per leg, unchanged.
The fold refuses (RED, by name) any plan where a unit is missing, doubled or not judged, or a shard is absent. The head
leg is never thinned: the plan is a function of the head tree's unit list and K only. It reads no diff and no merge base.

---

## 1. MEASUREMENTS (each by command, its last line; read 20 Nov 2026, public API, no token sent by this seat)

M1 · the bound and the matrix at base:
```
grep -n "timeout-minutes\|node: \[\|name: npm test\|fetch-depth" .github/workflows/suite.yml
→ 60: name: npm test · node ${{ matrix.node }} · 62: timeout-minutes: 60 · 66: node: [22, 24] · 72: fetch-depth: 0
```
One job (`npm-test`, suite.yml:59) per node, in sequence: checkout, setup-node, the no-API-key law, `npm ci`, the merge
base, **the head step** (suite.yml:109-116: `organism_test.mjs all`, which holds the witnesses member), the merge-base
step (suite.yml:122-145), the verdict (suite.yml:148-157). The 60-minute bound covers all of them.

M2 · step timings, `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/jobs/<id>` (steps' started/completed):

| sha · job id | leg | npm ci | head step | merge-base step | conclusion |
|---|---|---|---|---|---|
| 5759cce · 135919452425 | node 22 | 57 s | 2105 s | 136 s | success |
| 5759cce · 135919452846 | node 24 | 68 s | 2157 s | 135 s | success |
| 179a0ee · 135776070753 | node 22 | 66 s | 2230 s | 146 s | success |
| 179a0ee · 135776071204 | node 24 | 61 s | 2072 s | 126 s | success |
| e789487 (ms2-build tip) · 135938095709 | node 22 | 41 s | 3491 s | **55 s, cancelled** | cancelled at the bound |
| e789487 · 135938095372 | node 24 | 66 s | **3524 s, cancelled** | skipped | cancelled at the bound |

(5759cce has a second green suite, jobs 135886176499 / 135886177254. ms2's earlier deaths, 6f42b9d / 7be797e, are
in `git show origin/claude/ms2-build:ci/ms2/PROOF.md` §12.1. They are not re-read here.)

M3 · the witnesses member's own seconds. The job log is read with `curl …/actions/jobs/<id>/logs` (it answered 200 through
this container's proxy; see §7 N1). The command is `grep -E "WITNESSES · [0-9]+ unit"`:
```
5759cce: 1971.9 s (n22, 135919452425) · 2015.2 s (n24, 135919452846) · 2074.5 s (n22, 135886176499) · 1762.8 s (n24, 135886177254)
179a0ee: 2080.9 s (n22, 135776070753) · 1939.3 s (n24, 135776071204)  ·  4dd0e51 (ms1-build tip): 2125.6 s · 2226.2 s
e789487: ok   WITNESSES · 39 unit(s) judged in 3383.8 s   (node 22; node 24's head step was cancelled before its grep printed)
```
**The brief's 2112.6 s / 2027.3 s "on 179a0ee" are not reproduced.** Its two jobs read 2080.9 s / 1939.3 s, and no other
run on that sha exists in `commits/179a0ee/check-runs`. The 20 Nov readings stand. The source of the brief's pair is in
§7 N2.

M4 · the rest of the head step. On 5759cce node 22, the head step minus the member is 2105 − 1971.9 = **133.1 s**
(node 24: 2157 − 2015.2 = 141.8 s). That is the whole non-witness suite. The merge-base step is 126 to 146 s, and the
witnesses never run there (organism_test.mjs:2883, C5 BASETREE).

M5 · per unit (the `WITNESS ‹u› · ran in N s (B5)` assert line, organism_test.mjs:2935). The parser is
`<scratchpad>/units.mjs` (§9), run over the six green logs of M3. The maximum per unit over those six:
```
units 38 · head-leg sum of per-unit max 2130.5 s · largest mf2 703.5 s
```
Heavy tail: mf2 597.7 to 703.5 s, mland 180.8 to 214.2 s, ms1 129.4 to 142.2 s, mrv 88.4 to 96.8 s, mdone 85.4 to 113.1 s,
mrung 64.1 to 88.3 s. Twenty-two units are under 30 s each. One unit, mf2, is about a third of the member.

M6 · the landed leg (ms2, not on main). On e789487 node 22, the B5 lines sum to **1598.3 s** for 39 units. The member's
own total is 3383.8 s. So the L-legs took **1785.5 s by difference**. ms2 prints no per-unit seconds for an L-leg (its
`landedLeg` asserts only GREEN/RED: `git show origin/claude/ms2-build:scripts/organism_test.mjs`, `landedLeg`), so the
per-unit L cost is **§7 N3, not measured**. All 39 L-legs ran on that push. FK8 A spares nothing on ms2's own push,
because ms2 adds `LANDED_ON` to every ci dir:
```
git diff --name-only 5759cce origin/claude/ms2-build | awk -F/ '$1=="ci"{print $2}' | sort -u | wc -l   → 39
```
So the push that lands ms2, and any later push that touches many `ci/<u>/` dirs, pays head plus L in one job.

M7 · partitions of the 38 measured head-leg units (`node <scratchpad>/part.mjs <scratchpad>/tab.tsv`, §9). The value is the
largest shard's head-leg seconds:
```
K=2 · round-robin 650/1480 (max 1480) · contiguous 1537/594 (max 1537) · LPT 1065/1066 (max 1066)
K=3 · round-robin 492/506/1133 (max 1133) · contiguous 1181/414/535 (max 1181) · LPT 712/709/710 (max 712)
K=4 · round-robin 410/1188/241/292 (max 1188) · contiguous 1024/512/182/412 (max 1024) · LPT 704/473/477/477 (max 704)
```
Round-robin over the sorted list is lopsided because mf2, mland and ms1 fall on one stride. No partition gets under
mf2's 703.5 s. That is the floor for any shape that keeps a unit whole. Per-job overhead before the member (M2:
checkout, setup-node, `npm ci`) is 58 to 85 s.

M8 · the hermetic suite at base, this container (Linux, no `GITHUB_ACTIONS`, so the witnesses member prints its one
skip line, organism_test.mjs:2797 / 2876):
```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   (before npm ci: modules absent)
→ organism_test: 141 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)   (20 Nov 2026)
```
The re-run after `npm ci` is in §8 and in the ledger.

M9 · this spec's own neutral legs: §8.

---

## 2. WHAT IT TOUCHES (files and owners at base 5759cce)

| file:line | what it is | owner (its header) |
|---|---|---|
| `.github/workflows/suite.yml:59-66` | the one job `npm-test`, `name: npm test · node ${{ matrix.node }}`, `timeout-minutes: 60`, matrix `node: [22, 24]` | the workflow file; no state file |
| `.github/workflows/suite.yml:109-116` | the head step: `organism_test.mjs all > $RUNNER_TEMP/b1_head.txt`, then a grep of NAMES only to the log | — |
| `.github/workflows/suite.yml:39-40` | "The log carries NAMES only … the full outputs stay on the runner" | — (a rule this spec must keep: §3.4) |
| `.github/workflows/suite.yml:148-157` | `ci_verdict.mjs compare --head --base --label` → the ONE `B1 VERDICT · node N` annotation; its exit is the job's | — |
| `scripts/ci_verdict.mjs:5` | `SOLE WRITER of: NOTHING. It prints` | itself |
| `scripts/ci_verdict.mjs:32` | `LEG = /^npm test · node (\d+)$/`, which check run is a leg | — |
| `scripts/ci_verdict.mjs:36-43` | `parseSuite`, reads `ORGANISM_TEST_VERDICT {pass, fail, reds, live, profile}` | — |
| `scripts/ci_verdict.mjs:65-73` / `93-104` | `judge` / `compareLines`: GREEN iff every head red is red at base | — |
| `scripts/ci_verdict.mjs:108` / `115-126` | `REQUIRED_LEGS` and `pickLegs` (the newest run per leg NAME) | — |
| `scripts/ci_verdict.mjs:209-212` | selftest: `REQUIRED_LEGS` equals suite.yml's FIRST `node: [...]` line | — |
| `scripts/organism_test.mjs:2795` | the member's header: "Sole writer of nothing" | itself |
| `scripts/organism_test.mjs:2802-2806` | `witnessUnits(root)`: sorted `ci/<d>/` dirs that hold a witness | — |
| `scripts/organism_test.mjs:2874-2948` | `witnesses()`: gate (2876), workspace (2882-2883), `units` (2884), `jobMin` = the FIRST `timeout-minutes:` of suite.yml (2887), the loop (2892), total (2945-2947) | — |
| `scripts/organism_test.mjs:3013-3017` | `MODES` and `main()`'s pre-mode branch (`selftest`, 3016) | — |
| `scripts/organism_test.mjs:3032` | `ORGANISM_TEST_VERDICT` line; its `unruled[]` carries `detail` (can quote a state file) | — |

No state file is read or written by anything proposed. `dressing-room/state` is untouched. All three files are
"sole writer of nothing" organs. The only new outputs are runner temp files and per-run workflow artifacts that carry
names only (§3.4).

---

## 3. THE CODE PATH PROPOSED

### 3.1 The plan (organism_test.mjs, pure)
`witnessPlan(units, k, times)` returns `{ n: k, shards: string[][] }`. Every unit appears in exactly one shard. The
result depends only on the head tree's `witnessUnits(ROOT)`, `k` and (shape B only) a measured times table. It never
calls `git diff`, `merge-base` or `ciChanged`. That is row 1171 (3): the head leg runs every unit. K is read, never typed
in a script: it is the length of the shard matrix list in suite.yml, read the way `jobMin` is read (2887).

### 3.2 The shard (organism_test.mjs `witnesses()`)
New env door `ORGANISM_WITNESS_SHARD=<k>/<n>`, read only inside `witnesses()`:
- **malformed** (not two integers with `1 ≤ k ≤ n`), or n differing from suite.yml's matrix length → ONE red assert
  `WITNESSES · the shard door names a shard of the plan (<value>)`. Never "run all", never "run none".
- **set** → `units` = `plan.shards[k-1]`. The loop body (2892-2944) is unchanged, so a unit's head leg, and ms2's L-leg
  when ms2 lands, run together in one shard. The shard prints ONE machine line, names only:
  `WITNESS_SHARD {"k":…,"n":…,"head":"<sha>","plan":[…units of k…],"judged":[…units that reached "GREEN at head against
  its BASE" or a named refusal assert…],"secs":{"<u>":…}}`.
- **unset with `ORGANISM_WITNESS_SHARDS=<n>`** (the suite job) → no witness is spawned. The member prints ONE machine
  line `WITNESS_PLAN {"n":…,"head":"<sha>","units":[…all of witnessUnits(ROOT)…]}` and makes no assert. Coverage is
  the fold's to judge (3.3). This fails closed: a plan line with no shard parts is RED (W-S7).
- **both unset** → today's behaviour, byte for byte (a laptop, or a workflow that is not sharded).

The assert NAMES do not change (`WITNESS ‹u› · …`, no shard index in them). So `keyOf` (ci_verdict.mjs:48) and every
`KNOWN_RED` entry (organism_test.mjs:2962) match exactly as today, whichever shard a unit rides.

### 3.3 The fold (ci_verdict.mjs, pure + CLI)
`compare` gains `--head-part <file>`, repeatable (one per shard digest). A new pure `mergeParts(head, parts)`:
1. reads the suite job's `WITNESS_PLAN` line (absent while parts are given → RED `the head names no witness plan`);
2. needs exactly one part per k in 1..n, each `head` sha equal to the plan's. A missing part is a red named
   `WITNESS SHARD <k>/<n> · produced its machine line`. Its job ended cancelled, timed out or failed, and that red is
   NEW by construction: the base never has it;
3. needs the union of `plan` over parts to equal `WITNESS_PLAN.units` exactly, pairwise disjoint, and each part's
   `judged` to equal its `plan`. Every missing, doubled or unjudged unit is a red named `WITNESS ‹u› · judged in
   exactly one shard`;
4. sums pass/fail, concatenates reds, live, stale, ruled and unruled NAMES. The result is ONE parsed suite, handed to
   the unchanged `judge` / `compareLines`. So the fold prints the same reds, the same ONE `B1 VERDICT · node N`
   annotation and the same exit that one process holding every red would have printed (W-S5 EQUIV).

The payload (ci_verdict.mjs:98) gains `shards: [{k, units, secs}]`. The reader (`readVerdict`, 130-151) reads `v`, `new`,
`base_red` and `live` only, so it is unchanged and still reads ONE verdict per leg.

### 3.4 Names only across jobs (privacy, suite.yml:39-40)
Raw outputs never leave their runner. Each job writes a **digest**: `ci_verdict.mjs digest <raw>` prints only the
`ORGANISM_TEST_VERDICT` line with every `detail` key removed, plus the `WITNESS_SHARD` / `WITNESS_PLAN` line. The digest
travels by artifact (F-CARRY). The fold reads digests only (W-S13 PRIVACY).

### 3.5 The workflow (suite.yml), shape J2 (recommended; F-JOB)
- `witnesses` job: matrix `node: [22, 24]` × `shard: [1 … K]`, named `witnesses · node N · shard k`. Steps: checkout
  (fetch-depth 0, because each unit's BASE must be in the clone, organism_test.mjs:2898), setup-node, the no-API-key
  law, `npm ci`, `ORGANISM_WITNESS_SHARD=k/K node scripts/organism_test.mjs witnesses`, digest, upload. Exit 0 always,
  like the head step today (suite.yml:116).
- `suite` job: today's job minus the verdict step, with `ORGANISM_WITNESS_SHARDS=K` on the head step. Named `suite ·
  node N`. It uploads the head digest and the base digest (the base step is unchanged, and witnesses never run on the
  base tree, 2883).
- `npm-test` job (the fold): `needs: [suite, witnesses]`, `if: always()`, matrix `node: [22, 24]`, **name `npm test ·
  node ${{ matrix.node }}`**. Checkout, setup-node (no `npm ci`: ci_verdict.mjs imports only builtins,
  ci_verdict.mjs:27-28), download the digests of its node, `compare --head <suite digest> --head-part <each shard> --base
  <base digest> …`. Its exit is the leg's.
- Every job carries the same `timeout-minutes` as base (60). The bound is not raised and gets a clause (W-S10).
  Wall-clock per push ≈ max(slowest shard, suite job) plus the fold.

---

## 4. LETTERED SHAPES (row 1171 (3): "a matrix of shards by unit list, by measured time, or other")

- **(A) by unit list.** Round-robin over the sorted `witnessUnits` (or contiguous slices). No table. Deterministic.
  Measured max shard (M7): K=2 1480 s, K=3 1133 s, K=4 1188 s. The skew comes from where mf2, mland and ms1 fall, and it
  moves every time a unit is born.
- **(B) by measured time.** LPT (the longest unit first, onto the lightest shard) over a measured table `ci/mshard/TIMES`
  (unit → seconds, dated, produced by a command from the fold's `secs`, never typed). A unit absent from the table goes
  to the lightest shard. A table entry for a unit not in the tree is named on the plan line and ignored. Measured max
  (M7): K=2 1066 s, K=3 712 s, K=4 704 s (the mf2 floor). The cost is one more file, and a stale table only unbalances
  shards. It never drops a unit, because coverage is judged from `witnessUnits`, not from the table.
- **(C) by stable hash** of the unit name mod K. Adding a unit never moves another unit. Balance is like (A) or worse.
  Not measured here.
- **(D) one witnesses job per node** (K=1, the member just moved out of the suite job). Main: about 2130 + 85 s, fits
  today. ms2's own push: about 2130 + 1785.5 + 85 ≈ 4000 s > 3600 s. **Refuted by M2 / M6 for the case that named this
  unit.**
- **(E) witnesses on ONE node only.** It halves the runner minutes, but the node-24 leg would never judge a witness. That
  thins the guarding leg per node, so this spec does not recommend it. It is listed because the architect may rule it.

**Recommendation: (B) with K=3.** Head-leg max 712 s. With ms2's landed leg at the measured 1785.5 s total, even a
skew that put all of mf2's L-leg on one shard keeps that shard around half the bound. The per-unit L split is §7 N3,
measured at the build.

---

## 5. WITNESS CLAUSES (a build's `ci/mshard/witness_mshard.mjs`, `--org <build> --base-org <base 5759cce>`)

Grammar as ms1's (`ci/ms1/witness_ms1.mjs:61`). LAST line `GREEN MSHARD … · <n> clause(s)` (exit 0) or `RED MSHARD ·
<ids>` (exit 1). Every plant is under `os.tmpdir()` by a node script. A member plant copies the tree's
`scripts/organism_test.mjs` + `.github/workflows/suite.yml` + planted `ci/<u>/` dirs with trivial witnesses (the
ms1 shape, `ci/ms1/witness_ms1.mjs:121-137`), with `GITHUB_ACTIONS=true` and `GITHUB_WORKSPACE`=the plant set
only in the child's env. **The port class (row 1053):** no plant binds a port. A planted witness only prints its
last line, names no live service, POSTs nothing and restarts nothing. Every spawn is bounded by the tree's own
suite.yml `timeout-minutes`, read and never typed. Each clause is RED on base (the door, the mode or the flag does not
exist there) and GREEN on the build. One mutant per clause, in `ci/mshard/run_mutants_mshard.mjs`: each mutant must turn
exactly its clause RED, with the control GREEN.

| id | clause (GREEN on build) | why RED on base | its mutant |
|---|---|---|---|
| W-S1 PLAN | `witness-plan` over a planted ci/ of 7 units, K=3: every unit in exactly one shard, union = `witnessUnits`, two runs byte-identical | no `witness-plan` mode (usage, exit 1) | the slice drops the last unit |
| W-S2 COVER | fold given parts 1, 3 of 3 → RED naming `WITNESS SHARD 2/3` | no `--head-part` flag | a missing part is treated as zero reds |
| W-S3 UNJUDGED | a part whose `judged` lacks one of its `plan` → RED naming `WITNESS ‹u›` | — (no fold) | the fold checks `plan` only, not `judged` |
| W-S4 DOUBLE | two parts both plan ‹u› → RED naming it | — | the union is a Set (a duplicate is silently merged) |
| W-S5 EQUIV | planted reds split across suite + 3 parts → `compareLines` output equals that of one file holding every red (pass/fail summed) | — | the merge drops the last part's reds |
| W-S6 SHA | a part naming another head sha → RED | — | no sha check |
| W-S7 FAILCLOSED | head digest carries `WITNESS_PLAN`, no `--head-part` → RED | base has no plan line (it judges in-process) | absent parts with a plan line read GREEN |
| W-S8 SHARDRUN | member plant with `ORGANISM_WITNESS_SHARD=2/3` spawns exactly plan[2]'s witnesses (each planted witness prints a marker), prints `WITNESS_SHARD` | base spawns all 7 | the door is read but the filter is skipped |
| W-S9 BADDOOR | `0/3`, `4/3`, `x`, `2/5` (n ≠ matrix) → ONE named red assert and no spawn | base ignores the door and spawns all | a malformed door runs nothing, silently |
| W-S10 BOUND | every `timeout-minutes` in the tree's suite.yml is equal and ≤ the base's; the member reads the bound of the job it runs in | base has no bound check across jobs: a plant whose shard job's bound is raised is not refused | one job's bound raised and the check reads only the first |
| W-S11 LEGNAME | exactly one job name in suite.yml matches `LEG` per node; ci_verdict's matrix check reads EVERY `node:` list and each equals `REQUIRED_LEGS` | base reads only the first `node:` line | a shard job named `npm test · node N` (pickLegs would read it) |
| W-S12 HEADALL | static: `witnessPlan` and the shard branch name no `merge-base`, `diff`, `ciChanged`, `LANDED_ON`; plus a plant where a unit's ci dir equals the merge base still lands in a shard and is judged | — | the plan filters by `ciChanged` |
| W-S13 PRIVACY | `digest` of a raw output with an `unruled[].detail` and a detail line → no `detail` key, no line but the two machine lines | no `digest` mode | the digest copies the raw `ORGANISM_TEST_VERDICT` |
| W-S14 UNSHARDED | both doors unset → the member's output equals base's on the same plant (today's behaviour, byte for byte, the seconds folded) | GUARD, GREEN on both | the plan line is printed when unsharded |
| BOUND | seat-time: the build tip's own neutral legs complete under the bound (read once per leg with `ci_verdict.mjs <sha>`) | — | — (dropped by the member, F1 A) |

---

## 6. FORKS (the architect rules each one)

- **F-SHAPE** (A) by unit list · (B) by measured time · (C) by hash · (D) K=1 · (E) one node. **Recommend (B).** Decided by
  M7 (B's max 712 s at K=3 against A's 1133 s). D is refuted by M2 / M6.
- **F-K** (a) K=2 · (b) K=3 · (c) K=4. **Recommend (b).** K=4 buys 8 s over K=3 (mf2's floor, M7) for one more runner per
  node. Decided at the build by the per-unit L seconds (§7 N3) and the account's concurrent-job limit (§7 N4).
- **F-JOB** (J1) the shards run first, then the leg job (`npm test · node N`) runs suite + base + fold after them (wall ≈
  shard + 6 min) · (J2) suite and shards in parallel, then a small fold job named `npm test · node N` (wall ≈ max + fold).
  **Recommend J2.** Decided by wall-clock on the build tip's legs.
- **F-CARRY** (a) `actions/upload-artifact` / `download-artifact` with digests (names only) · (b) job `outputs:` (no new
  action; but matrix job outputs collapse to the last writer, so it needs K non-matrix jobs) · (c) the fold re-reads the
  shards' annotations through the API. **Recommend (a).** Decided by §7 N5 (artifact visibility on a public repo, and
  whether `permissions: contents: read` suffices).
- **F-TABLE** (only under B): who writes `ci/mshard/TIMES`. (a) a seat by `node scripts/ci_verdict.mjs times <sha>` (reads
  the fold's `secs` from its verdict annotation payload, prints the table, writes nothing; the seat redirects it) ·
  (b) never committed: the plan is LPT over the previous fold's annotation, fetched at plan time. That needs the network
  inside the suite, so it is not recommended. **Recommend (a).**
- **F-ORDER** (a) mshard lands on main first, then ms2 merges main (its `for (const unit of units)` loop is the same
  seam, so the shard filter sits before it) · (b) mshard builds on `claude/ms2-build` · (c) one assembled landing.
  **Recommend (a).** ms2 cannot go green without it (M2), and mshard's diff to `witnesses()` is the `units` line only.
- **F-UNSHARDED** (a) both doors unset = today's in-process member (laptops, a fork without the matrix) · (b) refuse
  outside the sharded workflow. **Recommend (a)** (W-S14 guards it).

---

## 7. NAMED, NOT GUESSED (what the cloud could not reach, and what would measure it)

- **N1** whether `GET /actions/jobs/<id>/logs` answers WITHOUT a token. This container's proxy answered 200 (M3), and the
  proxy may add credentials. Measure on his laptop: `curl -s -o NUL -w "%{http_code}" https://api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/jobs/135919452425/logs`.
  If it is not 200, M3 / M5 are readable only signed in. The step timings (M2) do not depend on it.
- **N2** the source of the brief's "2112.6 s and 2027.3 s on 179a0ee". Not on either of that sha's jobs (2080.9 / 1939.3)
  nor 4dd0e51's (2125.6 / 2226.2). Measure: the runner's own ledger row that quotes them.
- **N3** the per-unit seconds of ms2's L-leg (only the total, 1785.5 s by difference, M6). Measure: a build of ms2 that
  prints `WITNESS ‹u› · L ran in N s (B5)`, read on one neutral leg.
- **N4** the concurrent-job limit and Windows-runner queueing for this account. K × 2 shard jobs + 2 suite jobs run at
  once. Measure: the queued-to-started gap of each shard job on the build tip (`actions/runs/<id>/jobs`, created_at vs
  started_at).
- **N5** whether workflow artifacts of this public repo are listable or downloadable by others, and whether
  `upload-artifact` needs more than `contents: read`. Measure: the build tip's run, `GET /actions/runs/<id>/artifacts`
  anonymously, and the upload step's result.
- **N6** whether a fresh checkout per shard (fetch-depth 0, `npm ci`) stays in M2's 58 to 85 s under K×2 parallel jobs
  (npm cache contention). Measure: the shard jobs' step timings on the build tip.
- **N7** the Windows behaviour of W-S8's member plant (junctions, `namingProcs` via PowerShell). The Linux run is
  reachable here; the Windows leg is read on the build's neutral legs.

---

## 8. THIS SPEC'S OWN RUN

The hermetic suite after `npm ci`. At base 5759cce, this container (Linux), 20 Nov 2026:
```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
→ organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
  FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)   orphaned: deck_lint, home_pin, probe, study_scope
```
That one red is the base's, on this Linux container. Both Windows legs of 5759cce are GREEN (M2), so it is not news to
the neutral verdict. The same command at this branch's commit is the ledger row `hermetic-branch`.
Neutral legs of this branch's tip: read once per leg with curl (no token), named in the ledger row `ci-legs` and in
the seat's final message. A spec push that adds only `ci/mshard/` changes no witness. `ci/mshard/` holds no
`witness_mshard.mjs` yet, so `witnessUnits` does not list it and the member's unit count is unchanged.

---

## 9. FILES A BUILD WOULD TOUCH

`.github/workflows/suite.yml` · `scripts/organism_test.mjs` (`witnesses()` door + plan line, a `witness-plan` pre-mode in
`main()` beside `selftest`) · `scripts/ci_verdict.mjs` (`mergeParts`, `digest`, `--head-part`, `times` under F-TABLE (a),
selftest planted both ways, the every-`node:`-line check) · `ci/mshard/{BASE, witness_mshard.mjs, run_mutants_mshard.mjs,
TIMES (shape B), PROOF.md, LEDGER.jsonl}`.
**Beyond them, a fork each:** (i) the flow atlas / xray IR, if the graph `flow_atlas.mjs check` re-derives (organism_test.mjs
atlas member, LIVE under hermetic) moves with the two scripts. Measure with `node scripts/xray.mjs build && node
scripts/flow_atlas.mjs check` on his laptop. (ii) `ci/ms1/witness_ms1.mjs`, if its member plant reads `jobMin` from a
suite.yml shape the matrix change alters (its line 82 reads the tree's `timeout-minutes`). Measure: ms1's witness on the
build tree.

Scratch tools of this seat (not committed): `units.mjs` (B5 lines → per-unit table) and `part.mjs` (A / contiguous /
LPT sums), in the seat's scratchpad.
