# MRT SPEC — unit mrt (mtail T3 AUTH · and on node 22 T2 F-C), forks rows 1107 (2) / 1108 / 1109

Written 19 Nov 2026 by the cloud spec seat (unit mrt). A SPEC, not a build: nothing on main moved, no PR, no live model
call. Every count below is the output of the command beside it, measured 19 Nov 2026 on linux, node 22, on LF trees.

## 0. HEADLINE

| Clause | First red main commit (first-parent) | Unit · row of that commit | Fate |
|---|---|---|---|
| **T3 AUTH** (`depcruise no-circular` 13 vs BASE 7) | `669200d` (the step before, `009f52e`, reads 7) | **mlv1** (architect adoption message, row to follow; its code comment names forks row 1031 M0 A) | **(b) REPAIR** — main regressed against its OWN frozen gate: `lawpack.mjs` `BASELINE.depcruise_errors` is still 7 and `node scripts/lawpack.mjs gate` is RED at head on exactly this count. mlv1 never re-based it, and a lawpack baseline may only fall. |
| **T2 F-C** (node 22; flaky) | `9f6f9ab` (first commit where T2 ever reads RED; it reads GREEN at most later commits too) | **mday** (forks rows 1075 / 1078, F10 A — the CLI's local door) | **(a) RE-BASE** — mday on purpose put a `/status` probe (`daemonUp()`, a 1200 ms `AbortSignal.timeout`) in front of the `/close` POST. The witness's clock seam scales EVERY `AbortSignal.timeout`, so the probe runs at 1/100 of its wait and, when the first fetch of the process is cold, times out: the CLI falls to the local door, which re-probes warm and refuses with 409. That is the witness's seam, not main's close. |

T1 F-B and T4 F1 are GREEN at head; BOUND is RED at head by design (the ms1 member drops every BOUND id, PROOF §5.1).

## 1. REPRODUCTION (by command)

Trees: LF `git archive` of each ref with `core.autocrlf=false`, `git init` + one commit inside, `node_modules` linked (the
shape of `ci/mtail/sides.mjs`, made by hand because sides.mjs resolves ROOT from its own location). The witness is
`ci/mtail/*` of `claude/ms1-build` — tip `3981f36` today; `git diff --stat 3966f61 3981f36 -- ci/mtail` is EMPTY, so
the witness the brief names (3966f61) and the newest tip are the same bytes.

```
node ci/mtail/witness_mtail.mjs --org <LF a18c167> --base-org <LF d0c8c96>
  RED  T2 F-C · … a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
  RED  T3 AUTH · claudegen AUTH_REFUSAL_RE exported · gaffer_brain JUDGE_AUTH_RE IS it · brain AUTH_FAIL_RE IS it · matches 3/3, limit wall not matched · files carrying the OAuth words as a pattern: claudegen.mjs · depcruise no-circular 13 vs BASE 7
RED MTAIL · T2 F-C · T3 AUTH · BOUND

node ci/mtail/witness_mtail.mjs --org <LF d0c8c96> --base-org <LF d0c8c96>
RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1
```

Every T3 sub-condition but the cycle count is GREEN at head; the clause is red on the count alone.

## 2. THE BISECT (first-parent main, BASE d0c8c96 .. head a18c167, every step measured — 26 commits plus BASE)

Each step: LF tree of the commit, `dependency-cruise --config .dependency-cruiser.cjs --output-type json scripts hooks`
(the witness's own call), no-circular violations counted and listed; then the witness against BASE.

```
d0c8c96  7 | RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1
76b0626  7 | RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1 · BOUND
074ead9  7 | RED MTAIL · BOUND            ← mtail itself lands: T1 T2 T3 T4 GREEN
e819c0d  7 | RED MTAIL · BOUND
3a73782  7 | RED MTAIL · BOUND
15edfec  7 | RED MTAIL · BOUND
0b209b2  7 | RED MTAIL · BOUND
e4a4f2c  7 | RED MTAIL · BOUND
7fde711  7 | RED MTAIL · BOUND
33d1432  7 | RED MTAIL · BOUND
009f52e  7 | RED MTAIL · BOUND
669200d 13 | RED MTAIL · T3 AUTH · BOUND  ← FIRST T3 RED (unit mlv1)
4d166d3 13 | RED MTAIL · T3 AUTH · BOUND
5e43987 13 | RED MTAIL · T3 AUTH · BOUND
40347a6 13 | RED MTAIL · T3 AUTH · BOUND
90f55dd 13 | RED MTAIL · T3 AUTH · BOUND
b1fc984 13 | RED MTAIL · T3 AUTH · BOUND
9f6f9ab 13 | RED MTAIL · T3 AUTH · BOUND  ← mday lands (the /status probe in front of /close)
cb30003 13 | RED MTAIL · T2 F-C · T3 AUTH · BOUND  ← T2 reads RED (one run)
d0c8f06 13 | RED MTAIL · T3 AUTH · BOUND
7c3c279 13 | RED MTAIL · T3 AUTH · BOUND
3e3ce63 13 | RED MTAIL · T3 AUTH · BOUND
54c5dce 13 | RED MTAIL · T3 AUTH · BOUND
3824171 13 | RED MTAIL · T3 AUTH · BOUND
902b6cc 13 | RED MTAIL · T3 AUTH · BOUND
89d3e1c 13 | RED MTAIL · T2 F-C · T3 AUTH · BOUND  ← T2 reads RED (one run)
a18c167 13 | RED MTAIL · T3 AUTH · BOUND
```

T3 is monotone: 7 through `009f52e`, 13 from `669200d` to head, and the head set of 13 is byte-equal to `669200d`'s.
T2 is NOT monotone — §4 measures it by repetition.

## 3. CLAUSE T3 AUTH — fate (b) REPAIR

### 3.1 The six cycles mlv1 added, by files (head a18c167 == 669200d, listed by dependency-cruiser as from → to [cycle])

```
NEW (7 rows):
  scripts/brain.mjs    -> scripts/keeper.mjs        [keeper > brain]
  scripts/brain.mjs    -> scripts/captains_call.mjs [captains_call > forge_session > gaffer_brain > keeper > brain]
  scripts/brain.mjs    -> scripts/state.mjs         [state > captains_call > forge_session > gaffer_brain > keeper > brain]
  scripts/learnstate.mjs -> scripts/forge_session.mjs [forge_session > gaffer_brain > keeper > brain > sitting > learnstate]
  scripts/sitting.mjs  -> scripts/forge_session.mjs [forge_session > gaffer_brain > keeper > brain > sitting]
  scripts/sitting.mjs  -> scripts/gaffer_brain.mjs  [gaffer_brain > keeper > brain > sitting]
  scripts/sitting.mjs  -> scripts/keeper.mjs        [keeper > brain > sitting]
GONE (1 row, re-reported on a longer path above):
  scripts/brain.mjs    -> scripts/state.mjs         [state > learnstate > brain]
```

Every new cycle runs through ONE new edge: **`keeper.mjs → brain.mjs`**. Before mlv1, `keeper.mjs` was a leaf (node
builtins only); `brain.mjs:89` and `gaffer_brain.mjs:113` already imported it (unit mlv0 and the 15 Oct keeper). mlv1's
`retireWhenIdle` needed brain's import-closure walk and took it by a dynamic import back into brain:

- **`scripts/keeper.mjs:116`** (head) — `const { sourceGraph, staleSources } = await import("./brain.mjs");` (added by
  `669200d`, where it sat at line 103). dependency-cruiser counts a dynamic import as an edge.
- `scripts/sitting.mjs:88` (head) — `import { keep, KEEP_EXIT, retireWhenIdle } from "./keeper.mjs";` (also `669200d`):
  not a defect by itself — it is a cycle only because keeper now reaches brain, which reaches sitting.
- `scripts/brain.mjs:7070` `export function sourceGraph(entry, readSrc)` and `scripts/brain.mjs:7097`
  `export function staleSources(paths, bootMs, mtimeOf)` — pure functions of `node:path` (`join`, `dirname`) and their
  two injected readers; no state, no brain internals.

### 3.2 Why (b) and not (a)

Main's own law says so, by command, at head and at BASE:

```
node scripts/lawpack.mjs gate   (in the head tree)
  RED  jugad-literal-subject-list ROSE — 93, baseline 90. A gate may only get stricter (§10-D rule 6).
  RED  depcruise_errors ROSE — 13, baseline 7. A gate may only get stricter (§10-D rule 6).
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)

node scripts/lawpack.mjs gate   (in the BASE tree)
lawpack: GREEN — no law's finding count rose, and every rule is on disk
```

`scripts/lawpack.mjs` `BASELINE.depcruise_errors` (head line 154) is 7, and the file's header (lines 40-44) names cycles
as one of dependency-cruiser's three ERROR rules that "are real defects and they do gate". No commit between BASE and
head raised it. mlv1's commit message names no cycle and no baseline. So no later ruled unit changed this on purpose:
a re-base to 13 would be the gate getting looser, which lawpack itself forbids. **Fate (b).**

(The `jugad-literal-subject-list` 93 vs 90 red is NOT in this unit's clause; it is named in FORKS F4 so it is not lost.)

### 3.3 The repair — the smallest code path that restores 7 without undoing mlv1

Move the two pure functions DOWN into the leaf that already exists, and keep every importer working by a re-export:

1. `scripts/keeper.mjs` — append `sourceGraph` and `staleSources` verbatim (their bodies from `brain.mjs:7070-7106`,
   comments with them), exported. Delete line 116 (`await import("./brain.mjs")`); `retireWhenIdle` uses the local
   functions. keeper.mjs stays a LEAF: node builtins only (it already imports `join`, `dirname` from `node:path`).
2. `scripts/brain.mjs` — replace the two definitions (7070-7106) with
   `export { sourceGraph, staleSources } from "./keeper.mjs";` and add both names to the existing import on line 89 (brain's
   own selftest at 6588-6605 and its retire path at 7676 / 7695 call them unqualified). Every other importer —
   `conductor.mjs:40` (static), `services.mjs:1110` and `cortex.mjs` (dynamic, from brain) — is untouched.

mlv1's behaviour is kept bit for bit: the same functions, the same retire rule, `retireWhenIdle` unchanged except where it
gets them. Measured on a temp tree (the repair applied by a node script, nothing committed to main):

```
dependency-cruiser no-circular on the repaired tree       : 7, and its from→to edge set == BASE d0c8c96's edge set
node scripts/lawpack.mjs gate (repaired tree)             : the depcruise_errors RED is gone (the jugad RED remains, F4)
node ci/mtail/witness_mtail.mjs --org <repaired> --base-org <BASE>
  ok   T3 AUTH · … depcruise no-circular 7 vs BASE 7
RED MTAIL · BOUND                                          (BOUND only — dropped by the ms1 member)
node scripts/keeper.mjs selftest  (head and repaired, ARSENAL_JUDGE_PORT planted from a listen(0) port under the temp tree)
  equal on both sides, 0 failed — the RETIRE WHEN IDLE assert (units mlv1-mlv3) included
node scripts/brain.mjs selftest   (head and repaired, HOME / USERPROFILE / ARSENAL_ARCHIVE under a temp dir)
  the same assert set on both sides; the one failing assert is the same on both (GEMINI SHIM, a cmd.exe quoting assert
  that cannot pass on linux) — NAMED NOT GUESSED N2
```

### 3.4 Files and owners at then-head (a18c167)

| File:line | What | Owner law |
|---|---|---|
| `scripts/keeper.mjs:116` | the dynamic import of brain.mjs (the regressing line) | keeper.mjs is code; it writes no state file (header lines 1-45 name no SOLE WRITER) |
| `scripts/keeper.mjs:104-` | `retireWhenIdle` (mlv1, row 1031 M0 A) — kept | — |
| `scripts/brain.mjs:89` | the static import of keeper.mjs — gains two names | brain.mjs is the SOLE WRITER of its own lanes (e.g. header line 106 `pulse_session.json`, line 128 the consumption lane); the repair writes none of them |
| `scripts/brain.mjs:7070-7106` | `sourceGraph` / `staleSources` — become a re-export | — |
| `scripts/lawpack.mjs:154` | `depcruise_errors: 7` — **NOT touched** (the repair makes main meet it again) | lawpack writes nothing outside its selftest temp dir |

No state file is read or written by the repair. No other organ's file is written.

## 4. CLAUSE T2 F-C — fate (a) RE-BASE, naming mday (forks rows 1075 / 1078, F10 A), commit 9f6f9ab

### 4.1 The mechanism (read in the head tree)

- `scripts/sitting.mjs:1294` — `async function daemonUp() { try { const s = await get("/status", 1200); … } catch { return false; } }`
- `scripts/sitting.mjs:1474-1477` — `case "close":` (mday F10 A): `if (!(await daemonUp())) { … closeLocal(…) … }` then
  `post("/close", …, closeWaitMs())`. Before `9f6f9ab` the case was the bare `post("/close", …, closeWaitMs())`
  (`b1fc984:scripts/sitting.mjs:1405`).
- `scripts/sitting.mjs:1355` — `localDoor` re-probes `daemonUp()` and refuses with 409 "the sitting daemon answers on
  :<port> — its POST door is the only door while it runs".
- `ci/mtail/w_preload.mjs:45-49` (the witness) — `AbortSignal.timeout = (ms) => { log(…); return orig(scaled(ms)); }`:
  EVERY timeout of the CLI process at 1/SCALE. SCALE is 100, so the probe's wait becomes 12 ms of real time.

The failing run reads exactly that: `CLI wait 1200 ms` (the last logged abort is the probe, no /close was ever posted) and
the printed line is the 409 of the local door. A cold first `fetch` of a node process can take longer than 12 ms (undici's
first-request set-up); the second probe, inside `localDoor`, is warm and answers — so the CLI refuses itself. That is why
node 22 and node 24 legs differ (PROOF §7 item 8) and why the walk shows T2 RED at single, non-adjacent commits.

### 4.2 Measured by repetition (10 witness runs per tree)

T2REP_PLACEHOLDER

### 4.3 The re-based clause (exact new expectation)

The behaviour mday ruled stays and is now ASSERTED, and the scaled clock is confined to the one wait it was built for:

- `w_preload.mjs` ABORT seam: `AbortSignal.timeout(ms)` arms the REAL wait and remembers `ms`; a `fetch` wrapper re-arms
  the signal at `ms / SCALE` ONLY for `POST /close`, and logs every wait UNSCALED with `{ ms, method, path, scaled }`.
- `witness_mtail.mjs` T2: `waitOf` reads the `POST /close` row (not the last row). New conjunct `probed(r)`: the CLI's
  FIRST request is `GET /status` on its own unscaled wait (mday F10 A), for both the slow close and the instant contrast.
- Unchanged: the slow close (midpoint of BASE's old wait and LONGEST) must print `sitting: CLOSED sit_20990410_0000_wit0 —
  2/3 units spoken · 1 banked · 4 turns · judge ran`, exit 0, `/close` wait ≥ LONGEST; the instant close prints the same.

The patch (prototype, measured; it lives in the spec only):

T2PATCH_PLACEHOLDER

Measured with the prototype:

```
--org <LF a18c167> --base-org <LF d0c8c96>
  ok   T2 F-C · old wait 240000 ms · longest close 393000 ms (…) · a close of 316500 ms: printed its result · CLI wait 393000 ms · probe GET /status 1200 ms · contrast (an instant close): printed
--org <LF d0c8c96> --base-org <LF d0c8c96>
  RED  T2 F-C · … NOT printed (exit 1: …) · CLI wait 240000 ms · probe POST /close 240000 ms · …
```

### 4.4 Files and owners

| File:line | What |
|---|---|
| `ci/mtail/w_preload.mjs:45-49` | the ABORT seam (re-based) — unit mtail's own witness file, on `claude/ms1-build` |
| `ci/mtail/witness_mtail.mjs:190-192` | T2's `waitOf` and its conjuncts (re-based) |
| `scripts/sitting.mjs:1294, 1355, 1474-1477` | read only — mday's ruled behaviour, NOT changed |

sitting.mjs is the SOLE WRITER of `dressing-room/state/sitting.json` (header line 14). Every T2 plant runs on its own tree
copy with its own empty `dressing-room/state` under `os.tmpdir()` (the witness's CONTRACT): nothing reaches his state.

## 5. WITNESS CLAUSES AND MUTANTS (the build's proof)

MUTANTS_PLACEHOLDER

## 6. THE PORT CLASS (row 1053)

Every proposed plant binds port 0 only (`createServer().listen(0, "127.0.0.1")` — the witness's existing fake daemon),
names no live service, POSTs nothing at a live daemon and restarts nothing. The judge port reaches keeper's selftest only
through its env door `ARSENAL_JUDGE_PORT`, honoured only for a tree under `os.tmpdir()` (`keeper.mjs:80-92`). Every wait is
the organ's own (scaled for the one /close wait) or the witness's existing bounded spawn.

## 7. FORKS (the architect's to rule)

FORKS_PLACEHOLDER

## 8. NAMED NOT GUESSED (what the cloud could not reach)

NNG_PLACEHOLDER

## 9. FILES A BUILD WOULD TOUCH

- `scripts/keeper.mjs` — the two functions in, line 116 out (T3 repair).
- `scripts/brain.mjs` — the two definitions out, one re-export in, line 89 gains two names (T3 repair).
- `ci/mtail/w_preload.mjs`, `ci/mtail/witness_mtail.mjs` — the T2 re-base (they live on `claude/ms1-build`; F3).
- `ci/mrt/witness_mrt.mjs`, `ci/mrt/run_mutants_mrt.mjs`, `ci/mrt/BASE`, `ci/mrt/LEDGER.jsonl`, `ci/mrt/PROOF.md` — the build's own.

Anything beyond these is a fork (F1 B names the one candidate: a new leaf module).

## 10. NEUTRAL MACHINE (suite workflow, check runs of this branch's pushes)

CI_PLACEHOLDER
