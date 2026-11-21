# MPRES2 SPEC — a repair record written before the repair row exists must not close the door for the whole span

Unit **mpres2** · forks row 1235 (5), the mpres class · seat: cloud spec seat, 21 Nov 2026 · branch `claude/mpres2-spec`
**Base: `origin/main` = `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`** (measured `git fetch origin main && git rev-parse FETCH_HEAD`, 21 Nov 2026 07:4x UTC; units mdet, mdtl2, mclk on it).
Every line number below is at that sha. This is a SPEC: nothing here is built, nothing lands. Ledger: `ci/mpres2/LEDGER.jsonl`.

**HEADLINE.** At 7bf008b a dead pass that finds no eligible `self_repair` row writes `repair.result:"none"`, and `inputSnapshot`
carries that record for the whole dead span, so `recordDeadInput` never consults the door again — the planted 20→21 Nov sequence
reads **0 asks** after the row is seeded (RED). The smallest change is ONE condition on `scripts/presence.mjs:701`: a `none`
record is not carried, so the next pass in the same span asks the door again; any record of an ask that ran (`asking`, `asked`,
`failed`) still closes the door for the span. Planted at the cut with that condition: **1 ask**, and none after (GREEN); the
landed mpres proof stays whole over the changed tree (measured, §3).

---

## 0. The runner's read is the ground (not re-derived)

Row 1235, on his laptop, 21 Nov 2026, read-only: activitywatch dead from 21:50 IST 20 Nov; the `self_repair` row `activitywatch`
seeded 21:52 IST; the pass in the gap found no row and wrote the span's repair record with result `none`; the door never asked again
in that span; the span ended when the runner started the watcher by its own launcher at 12:34 IST 21 Nov. This seat cannot reach his
state and does not re-derive any of it; §1 plants the same sequence on module-level seams.

Row 1235 (1)–(4) (unit mjset and its laptop counts) are NOT this seat's item; they are named in §7 as facts this seat cannot reach.

## 1. THE CASE — the planted sequence at the cut

### 1.1 The code path at 7bf008b

| file:line | what it does |
|---|---|
| `scripts/presence.mjs:695-703` `inputSnapshot` | pure; `dead_since` carries over dead passes; **line 701** carries `p.repair` whenever `p.alive === false && p.repair.span === dead_since` — whatever its `result` |
| `scripts/presence.mjs:708-718` `launcherDoor` | env `ARSENAL_AW_LAUNCHER` first (line 710; **when set, the registry row is never read**); else `deps.repairRow` or `registry.mjs rowOf("self_repair","activitywatch")` (line 712); no row / retired / not reversible / no report_anchor / no launcher / unreadable ⇒ `{launcher:null, why}` (713-717) |
| `scripts/presence.mjs:731-746` `recordDeadInput` | **line 733** `if (!snap.repair)` — the door is asked only when no record rides the snapshot; 735 writes `result:"none"` when the door has no launcher; 738-739 write `asking` BEFORE the ask (the bound); 741 `asked`/`failed` |
| `scripts/presence.mjs:748-761` `sense` | a null fetch on a file-backed pass calls `recordDeadInput` (758) |

Writer: `scripts/presence.mjs` is the SOLE writer of `presence_input.json` (header `scripts/presence.mjs:24`, again at `:52`). The
registry's sole writer is `scripts/registry.mjs` (header `:4`); a witness plants the row through `deps.repairRow` (module level) or
`node scripts/registry.mjs set` with `ARSENAL_REGISTRY` under the temp dir (`scripts/registry.mjs:59`, CLI level) — never by hand.

So the door closes on `none`: pass 1 (no row) writes `none`; line 701 carries it on every later dead pass of the span; line 733 sees a
record and skips the door. The record that was meant to say "nothing to ask" is read as "already asked".

### 1.2 The plant (the measurement; run from the scratchpad, never committed as code)

```js
// plant_mpres2.mjs — node plant_mpres2.mjs --org <tree> [--patch]
// A COPY of <tree>/scripts + package.json under os.tmpdir(); no port, no fetch (dead fetchFn throws ECONNREFUSED), no spawn
// (the launch seam counts and starts nothing). env is {} so the registry door is the one read (line 710 would bypass it).
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path"; import { tmpdir } from "node:os"; import { pathToFileURL } from "node:url";
const a = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(a("--org")); const PATCH = process.argv.includes("--patch");
const root = mkdtempSync(join(tmpdir(), "plant-mpres2-"));
try {
  cpSync(join(ORG, "scripts"), join(root, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(root, "package.json"));
  const P = join(root, "scripts", "presence.mjs");
  if (PATCH) {   // fork F1 option A, for comparison (the gate line)
    const src = readFileSync(P, "utf8"), anchor = "  if (!snap.repair) {\n";
    if (src.split(anchor).length !== 2) { console.log("RED PLANT · patch anchor not unique"); process.exit(1); }
    writeFileSync(P, src.replace(anchor, "  if (!snap.repair || snap.repair.result === \"none\") {\n"));
  }
  const m = await import(pathToFileURL(P).href);
  const f = join(root, "presence_input.json");
  const dead = async () => { throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }); };
  const asks = []; const launch = async (cmd) => { asks.push(cmd); return { ok: false, why: "ENOENT" }; };
  const tone = { arousal: "open", effects: {} };
  const row = { subject: "activitywatch", artifact: "aw", verified_by: "next pass alive", report_anchor: "the state line", witness: "w", reversible: true, launcher: join(root, "no-such-aw-launcher") };
  const pass = async (iso, repairRow) => { await m.sense({ now: new Date(iso), tone, fetchFn: dead, inputFile: f, env: {}, repairRow, launch }); return JSON.parse(readFileSync(f, "utf8")); };
  const s1 = await pass("2026-11-20T16:20:00.000Z", null);               // 21:50 IST dead, no row
  console.log(`pass1 21:50 IST row:absent  repair=${s1.repair.result} (${s1.repair.why}) asks=${asks.length}`);
  let s;
  for (const iso of ["2026-11-20T16:25:00.000Z", "2026-11-20T18:30:00.000Z", "2026-11-21T02:00:00.000Z", "2026-11-21T07:00:00.000Z"]) {
    s = await pass(iso, row); console.log(`pass ${iso} row:seeded  repair=${s.repair.result} span=${s.repair.span === s.dead_since ? "same" : "other"} asks=${asks.length}`);
  }
  const ok = asks.length === 1 && s.repair.result === "failed" && s.repair.span === s.dead_since && s.dead_since === "2026-11-20T16:20:00.000Z";
  console.log(ok ? `GREEN PLANT · the seeded row is asked ONCE in the same span (asks=${asks.length})` : `RED PLANT · no later pass in the span asked (asks=${asks.length}, repair ${s.repair.result})`);
  process.exitCode = ok ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
```

### 1.3 What it printed at 7bf008b (21 Nov 2026)

```
$ node plant_mpres2.mjs --org .            # base 7bf008b
pass1 21:50 IST row:absent  repair=none (no self_repair row activitywatch) asks=0
pass 2026-11-20T16:25:00.000Z row:seeded  repair=none span=same asks=0
pass 2026-11-20T18:30:00.000Z row:seeded  repair=none span=same asks=0
pass 2026-11-21T02:00:00.000Z row:seeded  repair=none span=same asks=0
pass 2026-11-21T07:00:00.000Z row:seeded  repair=none span=same asks=0
RED PLANT · no later pass in the span asked (asks=0, repair none)          (exit 1)
```

The runner's laptop read, reproduced on seams: a row present from 16:22Z, four later dead passes in the same span, zero asks.

## 2. THE SMALLEST CHANGE

**Which results close the door for a span** (the code's own vocabulary; the brief's "started" = `asked`, "refused" = `failed`):

| `repair.result` | written at | an ask ran? | closes the span's door? |
|---|---|---|---|
| `asking` | `presence.mjs:738` (before the ask — the bound) | yes, begun | **yes** — a pass that died mid-launch must never ask twice |
| `asked` | `presence.mjs:741` | yes, the OS started it | **yes** |
| `failed` | `presence.mjs:741` | yes, the OS refused it | **yes** — a failed ask reads red by name (`senses.mjs:67`), never re-tried in the span |
| `none` | `presence.mjs:735` | **no** — no eligible row / no launcher / registry unreadable | **no** — the next pass in the span asks the door again |

**Proposed code path (fork F1, recommended option B)** — one condition, `scripts/presence.mjs:701`:

```js
// at 7bf008b
  if (p && p.alive === false && p.repair && p.repair.span === dead_since) out.repair = p.repair;
// the build
  if (p && p.alive === false && p.repair && p.repair.span === dead_since && p.repair.result !== "none") out.repair = p.repair;
```

plus the docstring at `:693-694` gains one clause ("…a `none` record — no ask ran — is not carried, so the next dead pass asks the
door again"). Effect, pass by pass: while no eligible row exists, each dead pass re-reads the door (one `rowOf` file read — the same
read the first pass already makes) and writes a fresh `none` record (its `at` is that pass); the first pass that finds an eligible
row writes `asking` before the ask (the bound at `:737-739` is untouched) and then `asked`/`failed`; every later pass of the span
carries that record and asks nothing. **One ask per span still holds.**

Measured with option B applied to a temp copy of the cut (21 Nov 2026):

```
$ node plant_mpres2.mjs --org <7bf008b + B>
pass1 21:50 IST row:absent  repair=none (no self_repair row activitywatch) asks=0
pass 2026-11-20T16:25:00.000Z row:seeded  repair=failed span=same asks=1
pass 2026-11-20T18:30:00.000Z row:seeded  repair=failed span=same asks=1
pass 2026-11-21T02:00:00.000Z row:seeded  repair=failed span=same asks=1
pass 2026-11-21T07:00:00.000Z row:seeded  repair=failed span=same asks=1
GREEN PLANT · the seeded row is asked ONCE in the same span (asks=1)       (exit 0)
$ node <7bf008b + B>/scripts/presence.mjs selftest | tail -1
ALL CHECKS PASSED
```

Option A (the gate line `:733` → `if (!snap.repair || snap.repair.result === "none")`) plants GREEN identically (`--patch`, same
output), but deletes the anchor the landed mpres mutant F9-ONCE edits — measured in §3.

## 3. EVERY OTHER READER OF THE REPAIR RECORD

Measured: `grep -rn "\.repair\b\|repair\.result\|repair\.span\|presence_input\|PINPUT" --include=*.mjs scripts ci tests` at 7bf008b.

| reader (file:line) | what it reads | at 7bf008b in the row-1235 span | after option B |
|---|---|---|---|
| `scripts/presence.mjs:701` `inputSnapshot` | carries the record | carries `none` all span | carries only `asking`/`asked`/`failed` |
| `scripts/presence.mjs:733` `recordDeadInput` | skips the door if a record rides | skipped all span | asks once when the row appears |
| `scripts/presence.mjs:1242` CLI `sense` line | prints `repair <result> (<why>)` | `repair none (no self_repair row activitywatch)` all span | `none` until the row, then `repair failed (ENOENT)` / `repair asked (the launcher started)` — the ask is SAID |
| `scripts/senses.mjs:65-67` `DEAD.presence` (the state line's senses wound) | `result` → evidence | `no repair door` all span | `no repair door` until the row, then `launcher asked` or `repair FAILED (…)` — red by name, on the line he reads |
| `scripts/senses.mjs:166` selftest plant | a planted `failed` record | — | unchanged (it plants a record; never passes through line 701) |
| `scripts/presence.mjs:1167-1178` selftest (mpres F9) | env door set ⇒ never `none`, except `f2` (one pass, no row ⇒ `none`) | green | green — measured `ALL CHECKS PASSED` (§2) |
| `ci/mpres/witness_mpres.mjs:140-174` (F9-ONCE, F9-RED, W12) | env door `ARSENAL_AW_LAUNCHER` set ⇒ never `none` | green | green — measured (below) |
| `ci/mpres/run_mutants_mpres.mjs:43` mutant F9-ONCE | anchor `  if (!snap.repair) {\n` (exactly once) | lands | **B: lands (anchor untouched). A: anchor occurs 0 times ⇒ that mutant reads "cannot land"** |
| `ci/mpres/run_mutants_mpres.mjs:39` mutant W2 | anchor `const dead_since = …` (line 699) | lands | lands under A and B |

The landed mpres proof replayed over each changed tree (21 Nov 2026; base = a copy of 7bf008b; the tracked `registry.json`
written into each temp tree by a node script, never a shell write under a state path):

```
$ node ci/mpres/run_mutants_mpres.mjs --org <7bf008b + B> --base-org <7bf008b>
  control · GREEN MPRES a sensor whose input is dead reads red by name on the one state line, exits non-zero, and asks its launcher once per dead span · 18 clause(s)
run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mpres/run_mutants_mpres.mjs --org <7bf008b + A> --base-org <7bf008b>
  RED   mutant F9-ONCE · its anchor occurs 0 time(s) in scripts/presence.mjs: the edit cannot land
run_mutants: 15 of 16 mutant(s) RED by the clause that names them · control GREEN
```

No reader outside `scripts/presence.mjs`, `scripts/senses.mjs` and `ci/mpres/` names the record (the grep above; `tests/` holds none).

## 4. NO LIVE SERVICE — the witness's doors

- **Module level** (clauses M1–M5): import a COPY of `--org`'s `scripts/` under `os.tmpdir()`; `fetchFn` a thrower (ECONNREFUSED,
  nothing dialled); `inputFile` under the temp dir; `launch` a seam that counts and starts nothing; the row planted through
  `deps.repairRow` (`presence.mjs:712`) with `launcher` a path under the temp dir that does not exist. **`env` is `{}` on these
  passes**: `ARSENAL_AW_LAUNCHER` short-circuits the row at `:710`, so a witness that sets it can never reproduce `none` (fork F2).
- **CLI level** (clause M6): a temp tree with its own `dressing-room/state/registry.json` (the tracked one, copied by node), the row
  seeded by `node scripts/registry.mjs set --table self_repair --json …` with `ARSENAL_REGISTRY` under the temp dir; `AW_API_BASE`
  an RFC 6761 `.invalid` host and `--import <temp>/deadnet.mjs` (the mpres witness's own pattern, `ci/mpres/witness_mpres.mjs:14-19`);
  the row's `launcher` a non-existent path under the temp dir, so the one real `spawn` gets ENOENT from the OS and starts nothing.
- THE PORT CLASS (row 1053): no port bound, no live service named, nothing POSTed at a daemon, nothing restarted; every wait is a
  child's exit or the OS's own `spawn`/`error` event (`presence.mjs:721-730`). No budget, timeout or size is typed.

## 5. WITNESS CLAUSES AND MUTANTS (what a build would carry)

Witness file: `ci/witness/mpres2/witness_mpres2.mjs` — the shape the suite member CLAUSE WITNESSES walks
(`scripts/organism_test.mjs:2963-2989`: `plants` mode, last line `PLANTS mpres2 · k of n plant(s) as expected`), plus the unit mode
`--org <build> --base-org <base>` and `run_mutants_mpres2.mjs` beside it (the mpres pattern). Sequence times are the row-1235 span
(`2026-11-20T16:20Z` dead, row from `16:22Z`, later passes to `2026-11-21T07:00Z`).

| id | plant | base 7bf008b | build | mutant (one per clause, applied to the build copy; anchor must occur exactly once) |
|---|---|---|---|---|
| **M1 CASE** | pass 1 dead, `repairRow:null` ⇒ `none`; passes 2..5 dead, same span, eligible row | **RED** asks=0 (measured §1.3) | GREEN asks=1, at pass 2, `result failed`, `span === dead_since` | **revert B**: `&& p.repair.result !== "none"` → removed — `none` closes the door again (the mutant the brief requires) |
| **M2 BOUND** | M1's sequence; count asks after pass 2 | RED (asks never reaches 1) | GREEN — exactly 1 ask over passes 2..5; pass 5's record `at` is pass 2's | carry nothing: line 701's condition → `false &&` … — every dead pass asks |
| **M3 STILL-NONE** | five dead passes, never a row | GREEN (guard) | GREEN — 0 asks, every pass `none` with `why /no self_repair row/`; `senses.DEAD.presence` evidence `no repair door` | `presence.mjs:735`'s branch made to ask: `if (!door.launcher)` → `if (false)` — a null launcher is asked |
| **M4 INELIGIBLE→ELIGIBLE** | pass 1 row `reversible:false` (`:714` ⇒ `none`); pass 2 the row made eligible | **RED** asks=0 | GREEN asks=1 | narrow the reopen to the absent-row why only: `p.repair.result !== "none"` → `!/^no self_repair row/.test(p.repair.why \|\| "")` |
| **M5 ASKING-CLOSES** | plant a snapshot whose record is `asking` (a pass that died mid-launch), then a dead pass with an eligible row | GREEN (guard) | GREEN — 0 asks | reopen `asking` too: `!== "none"` → `!== "none" && p.repair.result !== "asking"` |
| **M6 END TO END** | CLI `presence.mjs sense` ×2 in a temp tree: first with no row, then after `registry.mjs set` seeds the row; then `senses` over that tree | **RED** second line `repair none`, evidence `no repair door` | GREEN second line `repair failed (ENOENT)`; senses evidence `repair FAILED (ENOENT)` | the CLI row read short-circuited: `(await import("./registry.mjs")).rowOf("self_repair", "activitywatch")` → `null` |
| **MPRES-HOLDS** | `ci/mpres/run_mutants_mpres.mjs --org <build> --base-org <base>` | n/a | `16 of 16 … control GREEN` (measured §3) | — (a seat-time clause: it IS a mutant run) |
| **BOUND-FILES** | only the named files differ vs base | — | GREEN | — (seat-time) |
| **LAST** | no node process naming the temp root survives | — | GREEN | — (seat-time) |

## 6. FILES A BUILD WOULD TOUCH

- `scripts/presence.mjs` — line 701 (one condition) and the docstring `:693-694`; optionally a selftest assert beside `:1178` (fork F3).
- `ci/witness/mpres2/witness_mpres2.mjs`, `ci/witness/mpres2/run_mutants_mpres2.mjs` — new (the walk at `organism_test.mjs:2976` picks the witness up with no suite edit).
- `ci/mpres2/` — this spec, the ledger, a build's PROOF.
- **Nothing else.** `scripts/senses.mjs`, `scripts/state.mjs`, `scripts/registry.mjs`, `ci/mpres/*` are READ, not edited (option B keeps every mpres anchor).

## 7. FORKS — for the architect

- **F1 · where the one condition sits.** (A) the gate `presence.mjs:733` reopens on `none`; (B) `inputSnapshot` `:701` does not carry
  `none`; (C) a line before `:733` deletes a `none` record. **Recommend B**: one condition in a pure, exported function, and it keeps the
  landed mpres mutant F9-ONCE's anchor — measured: B `16 of 16`, A `15 of 16` (§3). C also keeps the anchor but adds a mutation of a
  shared object. Decided by: the §3 replay.
- **F2 · the brief's witness door vs the code's precedence.** The brief names both `ARSENAL_AW_LAUNCHER` under the temp dir and the row via
  `deps.repairRow`; at `:710` the env door wins and the row is never read, so with the env set `none` cannot occur. (A) module clauses run
  `env:{}` with the row's `launcher` under the temp dir; env door used only in a control clause; (B) change precedence so the row is read
  first — a behaviour change beyond the class. **Recommend A.** Decided by: `presence.mjs:710` (read it).
- **F3 · a selftest assert in presence.mjs.** (A) the build adds one M1-shaped assert beside `:1178` (the organ proves its own bound);
  (B) the witness only. **Recommend A** (the mpres unit put its F9 asserts in the selftest, `:1167-1178`). Decided by: the architect's
  rule on unit-in-selftest vs witness-only.
- **F4 · the `none` record's stamp across a no-row stretch.** (A) each pass writes a fresh `none` (its `at` = that pass, says when the
  door was last read) — what B does; (B) keep the first `none` and only re-read the door. **Recommend A** — no extra code. Decided by: whether
  any reader wants the first-none time (§3: none does).
- **F5 · the fate of an in-flight span at landing.** A snapshot on his laptop holding a `none` record in a still-dead span: under B the first
  pass after landing re-reads the door and asks once if a row is eligible. (A) accept (it is the repair); (B) the lander runs one `sense` by
  hand and reads the line. **Recommend A.** Decided by: §8's laptop read of `presence_input.json`'s `repair.result` at landing.
- **F6 · order.** Row 1235 (5): "one small build after the study-facing ones" (mjset). (A) hold this build until mjset lands; (B) build now, land
  after. **Recommend B** (no file overlap with mjset is known — NAMED NOT GUESSED §8). Decided by: mjset's file list.

## 8. NAMED NOT GUESSED — facts this seat could not reach from the cloud

- His laptop's `presence_input.json` now (alive? which `repair.result`?) — measure: `node scripts/presence.mjs status` and `node scripts/state.mjs` on his laptop.
- The live `self_repair` row `activitywatch` (eligible? `launcher` set?) — measure: `node scripts/registry.mjs` read of `self_repair` on his laptop (the lander seeded it; no cloud seat may).
- The sense pass cadence on his laptop (how many passes a span holds) — measure: `node scripts/pulse.mjs report` / the scheduled task's history.
- Whether the runner-started watcher's launcher is the same path the row names — measure: compare the row's `launcher` with the task the runner used, on his laptop.
- Row 1235 (1)–(4) (mjset): every per-IST-day count since 18 Nov (closes per carrier, judge rounds started / ok / failed by reason, unsettled captures, the 57 old captures' fate) — measure: the runner's light count act on his laptop, as row 1235 (2) orders; not this seat's item, and no fix here leans on them.
- mjset's file list (for F6) — measure: the mjset spec once its counts land.
- The neutral machine on Windows with `npm ci` — this container has no `node_modules`; read §9's check runs.

## 9. MEASUREMENTS (each by command, its last line)

| act | command | last line |
|---|---|---|
| base | `git fetch origin main && git rev-parse FETCH_HEAD` | `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` |
| case, base | `node plant_mpres2.mjs --org .` | `RED PLANT · no later pass in the span asked (asks=0, repair none)` |
| case, option A | `node plant_mpres2.mjs --org . --patch` | `GREEN PLANT · the seeded row is asked ONCE in the same span (asks=1)` |
| case, option B | `node plant_mpres2.mjs --org <7bf008b + B>` | `GREEN PLANT · the seeded row is asked ONCE in the same span (asks=1)` |
| selftest, base / A / B | `node scripts/presence.mjs selftest` | `ALL CHECKS PASSED` (each) |
| mpres proof over B | `node ci/mpres/run_mutants_mpres.mjs --org <B> --base-org <base>` | `run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN` |
| mpres proof over A | same, `--org <A>` | `run_mutants: 15 of 16 mutant(s) RED by the clause that names them · control GREEN` |
| suite, base, this container (21 Nov 2026, Node v22.23.5, no node_modules) | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | `organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)` (21 Nov 2026; the 8 reds are lawpack, ci_verdict, red_cause, done, probe, fsrs, mutagen and their roll-up — ERR_MODULE_NOT_FOUND / bare-checkout causes at the BASE; this spec edits no code) |
| neutral machine | public API `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` | §10 |

## 10. CHECK RUNS (the neutral machine, read with curl, no token)

Read with `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token), 21 Nov 2026 08:50 UTC.

**Spec sha `a71c11c2736546a2aceacdb09adedf1ac1f33c4d`** — workflow run `44882030754` (suite.yml, windows-latest):

| job id | name | status at 08:50 UTC |
|---|---|---|
| 136779200049 | hermetic twice · node 24 | completed · **success** (07:57:46 UTC) |
| 136779200190 | hermetic twice · node 22 | queued (since 07:49:43 UTC) |
| 136779200137 | npm test · node 22 | queued (since 07:49:43 UTC) |
| 136779200210 | npm test · node 24 | queued (since 07:49:43 UTC) |

Three legs sat in the runner queue for an hour; this seat does not re-trigger CI (no empty commit, no dispatch). This commit is the
next push: its own run is named in the seat's FINAL MESSAGE (the workflow's concurrency cancels the older run once a newer one exists
on the branch, `.github/workflows/suite.yml:49`).

## 11. THE SECOND CLASS, MEASURED ON HIS LAPTOP — a relaunch beside a running launcher (runner M, 21 Nov 2026 15:15 IST)

**THE ARCHITECT'S CLAUSE (verbatim, binding on this spec):** *the repair door never starts a launcher while one launcher process of
that sensor is already running; a sensor that reads dead beside a running launcher is a named red of its own, not a relaunch.*

### 11.1 The runner's counts (his laptop, 21 Nov 2026; this seat's ground, not re-derived)

- He saw 15 ActivityWatch tray icons. Measured: 15 `aw-qt` launchers started at 12:34:11 (the runner's own start, row 1177 (1)), then
  12:36, 12:40, 12:44, 12:48, 12:54, 12:58, 13:09, 13:29, 13:49, 13:51, 13:56, 14:05, 14:28, 15:04 IST — each with its own watcher
  pair. Only the 12:34 set's server held real memory; most later servers sat near 1 MB (could not bind the port). The runner stopped
  the 14 later sets by pid at ~15:12 and kept the 12:34 set; one launcher remains.
- `presence.log`, one sense pass a minute, 12:30–15:10 IST: short LIVE runs (1–4 passes) alternating with DEAD spans, every dead pass
  reading `ActivityWatch unreachable — no telemetry, no guess` while the 12:34 launcher and its server were running. The 14 dead spans
  after 12:34 (start · passes): 12:36·1, 12:40·3, 12:44·2, 12:48·2, 12:54·3, 12:58·9, 13:09·19, 13:29·19, 13:49·1, 13:51·4, 13:56·8,
  14:05·21, 14:28·35, 15:04·6. Each span's FIRST pass wrote `asked (the launcher started)` and started one launcher — 14 spans, 14
  launchers, launch minutes equal to the `aw-qt` start minutes one for one. The pass before each span read LIVE (`calm`).
- Dead reason every time: the window-events fetch returned null, never a missing launcher.
- Not measured: why the fetch reads unreachable beside a running server.

### 11.2 The mechanism, by the code at 7bf008b

| file:line | the step |
|---|---|
| `scripts/presence.mjs:698` | a LIVE pass returns `dead_since:null` and no `repair` — the span's record is dropped |
| `scripts/presence.mjs:699` | the next dead pass opens a NEW span (`dead_since = at`) |
| `scripts/presence.mjs:701` | the old record's `span` ≠ the new `dead_since`, so nothing is carried |
| `scripts/presence.mjs:733-741` | no record ⇒ the door is asked ⇒ `spawnOnce` starts ANOTHER launcher; nothing asks whether one is already running |
| `scripts/presence.mjs:591-603` `fetchAwEvents` | **every** failure collapses to `null`: the 4 s abort on either leg (`:595`, `:600`), a refused connection, a buckets map with no `aw-watcher-window` key (`:598`), a body that is not JSON — so "unreachable" cannot say WHICH, and the runner's open question is unmeasurable from the log by construction |

So the bound "one ask per span" holds exactly as written and still multiplies launchers: a flapping input (LIVE 1–4 passes, DEAD again)
is a new span every time. The mpres2 change in §2 does not cause this and does not fix it; it would make it no worse (it reopens only
`none`, and every one of the 14 records was `asked`).

### 11.3 What the build must add (the clause as a code path)

1. **A running-launcher check before the ask** — in `recordDeadInput`, after `launcherDoor` names a launcher and BEFORE the `asking`
   record at `:738`: ask a seam `deps.launcherRunning(door)` (default: one process listing). Running ⇒ write
   `repair = { span, at, result: "beside-running", why: "<launcher leaf> running, input dead" }`, spawn nothing. That result is an ask
   that did not run, but it IS a verdict on the span: it **closes** the span (no re-list every pass) — fork F8.
2. **The named red** — `scripts/senses.mjs:67` maps `beside-running` to its own evidence (`dead beside a running launcher`), distinct
   from `repair FAILED` and `no repair door`; the `sense` CLI line at `presence.mjs:1242` prints it as it prints every result already.
3. **The fetch names its reason** — `fetchAwEvents` returns a reason with the null (`abort` · `refused` · `no-window-bucket` · `bad-json`)
   and the dead snapshot carries it as `dead_reason`, so the next laptop read answers 11.1's open question from the log (fork F9).

### 11.4 Witness clauses and mutants (added to §5's table)

| id | plant | base 7bf008b | build | mutant |
|---|---|---|---|---|
| **R1 NO-RELAUNCH** | the 21 Nov flap on seams: dead, live, dead, live, dead (3 spans), `launcherRunning` → true from the first ask on | **RED** 3 asks (3 launchers) | GREEN 1 ask, later spans `beside-running` | drop the check: `deps.launcherRunning` call → `false` |
| **R2 NAMED-RED** | R1's last snapshot through `senses.DEAD.presence` | **RED** evidence `launcher asked` | GREEN evidence `dead beside a running launcher` | map `beside-running` to `null` evidence |
| **R3 NOT-RUNNING-ASKS** | dead, `launcherRunning` → false | GREEN (guard) | GREEN 1 ask, `asked`/`failed` | invert the check (`!running` → `running`) |
| **R4 REASON-NAMED** | four planted fetchFns: abort, ECONNREFUSED, buckets with no window key, non-JSON body | **RED** no `dead_reason` | GREEN each `dead_reason` by name | collapse every reason to one string |

Doors as §4: the process listing is a seam (`deps.launcherRunning`), planted true/false; no witness lists real processes, names a live
service or binds a port. The default lister on the laptop is NAMED NOT GUESSED (below).

### 11.5 Files, forks, and what only the laptop can measure

- Files a build adds to §6: `scripts/presence.mjs` (`recordDeadInput`, `fetchAwEvents`, the default lister), `scripts/senses.mjs:67`
  (one evidence mapping) — **a new file touched beyond §6, so fork F7**.
- **F7 · scope.** (A) one build: mpres2 (§2) + the clause (§11); (B) two builds, the clause first (it is the live harm — 14 launchers in
  2.5 h), mpres2 after. **Recommend B**: the relaunch is happening on his laptop now; the `none` case needs a row seeded mid-span.
- **F8 · does `beside-running` close the span?** (A) yes — one listing per span, the red stands until a live pass; (B) no — re-list every
  pass, and ask once if the launcher has died. **Recommend B** with the ask bound kept: a launcher that died mid-span is exactly what
  the door exists for, and a listing is not a launch. Decided by: the cost of one listing on his laptop (`conductor.mjs:446` records
  `Get-CimInstance Win32_Process` at seconds per call on this laptop).
- **F9 · the reason field.** (A) in the snapshot only; (B) also in `presence.log`'s dead line. **Recommend A** (one writer, one file).
- **F10 · how "running" is known.** (A) list processes by the launcher's leaf name; (B) a pid file written by `spawnOnce` on its
  `spawn` event, checked alive; (C) both. **Recommend B** — it knows only what THIS door started, never a launcher the runner or he
  started by hand, so (C) if the architect wants the 12:34 runner start counted too (it was not started by the door).
- NAMED NOT GUESSED: why the fetch reads null beside a running 73 MB server (abort at 4 s vs refused vs a later launcher's server holding
  the port vs no window bucket) — measure on his laptop: `curl -s -m 10 http://localhost:5600/api/0/buckets` timed, and the bucket keys,
  during a dead span; the cost of one process listing — measure: time `Get-CimInstance Win32_Process -Filter "Name='aw-qt.exe'"` there.

CHECKPOINT · STOPPED at 2026-11-21T09:50Z · resume from: the architect's rulings on F1–F10, then a build seat (spec complete; nothing built).
