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

Ten runs of the landed witness per tree, each against LF BASE d0c8c96, measured 19 Nov 2026 (`t2rep`: for each tree,
ten times `node ci/mtail/witness_mtail.mjs --org <tree> --base-org <BASE>`, the T2 line kept):

```
b1fc984 T2 RED 0/10
9f6f9ab run5 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
9f6f9ab run6 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
9f6f9ab run10 a close of 316500 ms: printed its result · CLI wait 393000 ms · contrast (an instant close): NOT printed
9f6f9ab T2 RED 3/10
a18c167 run2 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 run4 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 run5 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 run7 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 run8 a close of 316500 ms: printed its result · CLI wait 393000 ms · contrast (an instant close): NOT printed
a18c167 run9 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 run10 a close of 316500 ms: NOT printed (exit 0: sitting: the sitting daemon answers on :<port> — its POST door is the only door while it ru) · CLI wait 1200 ms · contrast (an instant close): printed
a18c167 T2 RED 7/10
```

Before mday (`b1fc984`) T2 never reads RED; from mday (`9f6f9ab`) on, it reads RED in a share of the runs, every RED
with the same signature: `CLI wait 1200 ms` (the probe was the process's last wait; no /close was posted) and the local
door's 409 line. (In the run where the slow close printed and the instant contrast did not, the contrast tripped on the
same probe.) The share rose at head — more modules loaded before the first fetch is a plausible cause, not measured (N3).
Main's close itself is not regressed: whenever the probe answers in time, the CLI waits `closeWaitMs()` and prints.

### 4.3 The re-based clause (exact new expectation)

The behaviour mday ruled stays and is now ASSERTED, and the scaled clock is confined to the one wait it was built for:

- `w_preload.mjs` ABORT seam: `AbortSignal.timeout(ms)` arms the REAL wait and remembers `ms`; a `fetch` wrapper re-arms
  the signal at `ms / SCALE` ONLY for `POST /close`, and logs every wait UNSCALED with `{ ms, method, path, scaled }`.
- `witness_mtail.mjs` T2: `waitOf` reads the `POST /close` row (not the last row). New conjunct `probed(r)`: the CLI's
  FIRST request is `GET /status` on its own unscaled wait (mday F10 A), for both the slow close and the instant contrast.
- Unchanged: the slow close (midpoint of BASE's old wait and LONGEST) must print `sitting: CLOSED sit_20990410_0000_wit0 —
  2/3 units spoken · 1 banked · 4 turns · judge ran`, exit 0, `/close` wait ≥ LONGEST; the instant close prints the same.

The patch (prototype, measured; it lives in the spec only):

```diff
--- w/ci/mtail/w_preload.mjs	2026-11-19 00:04:52.000000000 +0000
+++ w2/ci/mtail/w_preload.mjs	2026-11-19 00:27:41.695852132 +0000
@@ -45,5 +45,17 @@
 if (process.env.MTAIL_ABORT_LOG && SCALE > 0) {
   const LOG = process.env.MTAIL_ABORT_LOG;
   const orig = AbortSignal.timeout.bind(AbortSignal);
-  AbortSignal.timeout = (ms) => { log(LOG, { kind: "abort", ms }); return orig(scaled(ms)); };
+  // unit mrt (T2 re-base, mday rows 1075 / 1078 F10 A): ONLY the /close POST's wait runs on the scaled clock — the CLI's
+  // /status probe (daemonUp, added by mday) keeps its own real wait; every wait is logged UNSCALED with its path and method.
+  const ms0 = new WeakMap();
+  AbortSignal.timeout = (ms) => { const s = orig(ms); ms0.set(s, ms); return s; };
+  const realFetch = globalThis.fetch;
+  globalThis.fetch = (url, o = {}) => {
+    const ms = o && o.signal ? ms0.get(o.signal) : undefined, method = String((o && o.method) || "GET").toUpperCase();
+    const path = (() => { try { return new URL(String(url)).pathname; } catch { return null; } })();
+    if (ms === undefined) return realFetch(url, o);
+    const close = method === "POST" && path === "/close";
+    log(LOG, { kind: "abort", ms, method, path, scaled: close });
+    return realFetch(url, close ? { ...o, signal: orig(scaled(ms)) } : o);
+  };
 }
--- w/ci/mtail/witness_mtail.mjs	2026-11-19 00:04:52.000000000 +0000
+++ w2/ci/mtail/witness_mtail.mjs	2026-11-19 00:27:41.695852132 +0000
@@ -187,9 +187,11 @@
     let slow = null, fast = null;
     if (DUR !== null && DUR > OLD && DUR < LONGEST) { slow = await runCli(DUR); fast = await runCli(0); }
     const printed = (r) => !!r && r.code === 0 && /^sitting: CLOSED sit_20990410_0000_wit0 — 2\/3 units spoken · 1 banked · 4 turns · judge ran$/m.test(r.out);
-    const waitOf = (r) => (r && r.aborts.length ? r.aborts.at(-1).ms : null);
-    clause("T2 F-C", printed(slow) && waitOf(slow) >= LONGEST && printed(fast),
-      `old wait ${OLD ?? "(no --base-org)"} ms · longest close ${LONGEST ?? "?"} ms (${steps.map(([f, v]) => `${f} ${v}`).join(" + ")} + session grace ${grace ?? "?"}) · a close of ${DUR ?? "?"} ms: ${slow ? (printed(slow) ? "printed its result" : `NOT printed (exit ${slow.code}: ${(slow.out + slow.err).trim().split(/\r?\n/).at(-1)?.slice(0, 90)})`) : "not run"} · CLI wait ${waitOf(slow) ?? "?"} ms · contrast (an instant close): ${fast ? (printed(fast) ? "printed" : "NOT printed") : "not run"}`);
+    const waitOf = (r) => { const c = r ? r.aborts.filter((a) => a.method === "POST" && a.path === "/close") : []; return c.length ? c.at(-1).ms : null; };
+    // unit mrt re-base (mday rows 1075 / 1078, F10 A): the CLI asks GET /status FIRST (the daemon-up probe), then POSTs /close
+    const probed = (r) => !!r && r.aborts.length >= 2 && r.aborts[0].method === "GET" && r.aborts[0].path === "/status" && r.aborts[0].scaled === false;
+    clause("T2 F-C", printed(slow) && waitOf(slow) >= LONGEST && printed(fast) && probed(slow) && probed(fast),
+      `old wait ${OLD ?? "(no --base-org)"} ms · longest close ${LONGEST ?? "?"} ms (${steps.map(([f, v]) => `${f} ${v}`).join(" + ")} + session grace ${grace ?? "?"}) · a close of ${DUR ?? "?"} ms: ${slow ? (printed(slow) ? "printed its result" : `NOT printed (exit ${slow.code}: ${(slow.out + slow.err).trim().split(/\r?\n/).at(-1)?.slice(0, 90)})`) : "not run"} · CLI wait ${waitOf(slow) ?? "?"} ms · probe ${slow && slow.aborts[0] ? `${slow.aborts[0].method} ${slow.aborts[0].path} ${slow.aborts[0].ms} ms` : "none"} · contrast (an instant close): ${fast ? (printed(fast) ? "printed" : "NOT printed") : "not run"}`);
   }
 
   // ── T3 · ONE auth literal ──
```

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

### 5.1 Witness clauses (proposed for the build, `ci/mrt/witness_mrt.mjs`; the landed mtail witness carries T3 unchanged and T2 re-based)

| Clause | Plant | BASE of the build (head a18c167) | The build (repaired) |
|---|---|---|---|
| **R1 CYCLES** (= mtail T3's count conjunct) | dependency-cruiser no-circular on `--org` vs `--base-org` d0c8c96: the count does not rise AND the from→to edge set is a subset of BASE's | RED (13 vs 7; seven new edges) | GREEN (7, equal set) |
| **R2 LEAF** | `keeper.mjs` carries no local import, static or dynamic (`from "./…"` / `import("./…")` in its code); `brain.mjs` exports `sourceGraph` / `staleSources` and they ARE keeper's objects (`===`, imported in a child on a temp copy) | RED (keeper.mjs:116 imports ./brain.mjs; brain's are its own) | GREEN |
| **R3 MLV1 KEPT** (the contrast — the repair must not undo mlv1) | `node scripts/keeper.mjs selftest` on a temp copy, judge port planted through `ARSENAL_JUDGE_PORT` from a listen(0) port: exit 0 and its RETIRE WHEN IDLE assert present and ok | GREEN | GREEN |
| **R4 LAWPACK** | `node scripts/lawpack.mjs gate` on the tree prints no `depcruise_errors ROSE` line (the jugad line is not this clause — F4) | RED | GREEN |
| **T2 F-C (re-based)** | §4.3, in the mtail witness | GREEN at head (0 RED in 10 runs, measured 19 Nov 2026), RED at d0c8c96 | GREEN |

### 5.2 Mutants — one per clause, each a copy of the repaired tree with ONE edit, the re-based witness on each (measured 19 Nov 2026)

```
repaired build                                   → RED MTAIL · BOUND          (BOUND only: dropped by the ms1 member)
M-T3  keeper.mjs re-gains await import("./brain.mjs") → RED MTAIL · T3 AUTH · BOUND
M-T2a sitting.mjs close posts /close with BASE's typed old wait instead of closeWaitMs() → RED MTAIL · T2 F-C · BOUND
M-T2b sitting.mjs close skips the daemonUp() probe (mday F10 A undone)                  → RED MTAIL · T2 F-C · BOUND
```

For the build's own clauses: M-R1 = M-T3 (RED on R1 and R4 by the same edge); M-R2 = brain.mjs keeps its own copy of the
two functions beside the re-export removed (R2 RED by identity, R1 GREEN — proves R2 is not R1 restated); M-R3 = keeper.mjs
`retireWhenIdle` loses its `idle()` check (keeper's own RETIRE WHEN IDLE assert RED). M-R2 and M-R3 are specified, not
yet run (the build runs them; `run_mutants_mrt.mjs` with a GREEN control).

## 6. THE PORT CLASS (row 1053)

Every proposed plant binds port 0 only (`createServer().listen(0, "127.0.0.1")` — the witness's existing fake daemon),
names no live service, POSTs nothing at a live daemon and restarts nothing. The judge port reaches keeper's selftest only
through its env door `ARSENAL_JUDGE_PORT`, honoured only for a tree under `os.tmpdir()` (`keeper.mjs:80-92`). Every wait is
the organ's own (scaled for the one /close wait) or the witness's existing bounded spawn.

## 7. FORKS (the architect's to rule)

- **F1 · where the two functions go.** (A) into `keeper.mjs`, brain re-exports — two files, no new module. (B) a new
  leaf `scripts/source_closure.mjs` imported by keeper and brain (and later conductor / services directly) — cleaner owner
  name, one new file. (C) keeper takes the walk as an injected dependency from each caller (`retireWhenIdle({ graph,
  stale })`, sitting passes brain's) — no move, but sitting.mjs must import brain.mjs, which it already does (cycle unchanged
  by that). **Recommend A** — measured: 7 cycles, BASE's edge set, keeper / brain selftests unchanged. Decides between A and
  B: whether the architect wants keeper.mjs to own a non-keeper helper; no measurement separates them (both read 7).
- **F2 · T2's fate.** (A) re-base the witness seam (§4.3) naming mday rows 1075 / 1078 — recommended; measured 0 RED in 10
  at head with the probe asserted. (B) repair main: make `daemonUp()`'s probe wait derived and longer — NOT recommended:
  main's behaviour is right on an unscaled clock (no RED appears without the witness's scaling; N1 is the laptop proof).
  (C) keep the seam and warm the CLI's first fetch in the preload — hides the probe rather than asserting it.
  Decides: N1 (the probe on his laptop's real clock answers a live-shaped fake daemon every time).
- **F3 · where the T2 re-base lands.** (A) the mrt build edits `ci/mtail/w_preload.mjs` + `witness_mtail.mjs` on its own
  branch and ms1 carries those bytes into `ci/mtail` (KNOWN_RED row 1107 owner mrt clears). (B) ms1's seat edits them. (C)
  the clause moves to `ci/mrt` and mtail's T2 is retired by name (a re-base, not a drop — row 1107 forbids dropping).
  **Recommend A.** Decides: whether ms1's KNOWN_RED reads the mtail witness by its path on the build branch.
- **F4 · the second lawpack red at head, `jugad-literal-subject-list` 93 vs 90.** Not in this unit's clause; found by the
  same command. (A) a new repair unit, its first red commit bisected the same way. (B) fold into mrt. (C) assign to the
  unit whose commit raised it once bisected. **Recommend A.** Decides: the bisect (`lawpack.mjs gate` per first-parent
  step), not run here — outside the brief.
- **F5 · the landed mtail T3 conjunct.** (A) keep `cOrg <= cBase` (a count) — it already turns GREEN with the repair. (B)
  tighten it to the edge-set subset (R1), so a cycle swapped for another does not pass. **Recommend B**, a gate may only get
  stricter. Decides: nothing further to measure; it is a strictness choice.

## 8. NAMED NOT GUESSED (what the cloud could not reach)

- **N1** — T2 on Windows (his laptop, windows-latest) with the re-based witness, both node 22 and 24: the neutral
  machine's two legs measure it once the re-based files are on a pushed branch (`suite.yml`); his laptop: ten runs of
  `node ci/mtail/witness_mtail.mjs --org <LF head> --base-org <LF d0c8c96>` (sides.mjs), T2 line kept.
- **N2** — brain selftest's GEMINI SHIM assert (a spaced %APPDATA% path quoted before cmd.exe) fails on linux on BOTH
  sides; on win32 it should pass both sides: `node scripts/brain.mjs selftest` on LF head and the repaired tree.
- **N3** — why the probe's cold first fetch is slower at head than at 9f6f9ab (more imports at load is a guess): a timing
  of `sitting.mjs close`'s first fetch on both trees on his laptop.
- **N4** — mlv1's ruling row ("architect adoption message, row to follow"): the forks register on his laptop names it.
- **N5** — whether a resident brain / sitting daemon on his laptop, booted before a landing of this repair, retires on
  the moved bytes: keeper's own retire rule sees keeper.mjs and brain.mjs change, so it should; `node scripts/services.mjs
  status` after the landing (his laptop only; no daemon is touched from here, and the organism is switched off by his order).

## 9. FILES A BUILD WOULD TOUCH

- `scripts/keeper.mjs` — the two functions in, line 116 out (T3 repair).
- `scripts/brain.mjs` — the two definitions out, one re-export in, line 89 gains two names (T3 repair).
- `ci/mtail/w_preload.mjs`, `ci/mtail/witness_mtail.mjs` — the T2 re-base (they live on `claude/ms1-build`; F3).
- `ci/mrt/witness_mrt.mjs`, `ci/mrt/run_mutants_mrt.mjs`, `ci/mrt/BASE`, `ci/mrt/LEDGER.jsonl`, `ci/mrt/PROOF.md` — the build's own.

Anything beyond these is a fork (F1 B names the one candidate: a new leaf module).

## 10. NEUTRAL MACHINE (suite workflow, check runs of this branch's pushes)

Read through the public API, no token (`curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`):

| Push (sha) | Run | Check run | Conclusion |
|---|---|---|---|
| `c0faeb7` (draft) | `44429641549` | `135243395854` npm test · node 22 | success |
| `c0faeb7` (draft) | `44429641549` | `135243395504` npm test · node 24 | success |

The last push's runs are named in the seat's final message (this file cannot carry its own sha).
