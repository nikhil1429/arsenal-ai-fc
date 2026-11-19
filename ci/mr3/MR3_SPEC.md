# MR3 SPEC — repair unit mr3 · mjd3 clause J4 (forks rows 1107 (2), 1108, 1109)

**HEADLINE · J4 is fate (a), RE-BASE.** The landed mjd3 witness reads `RED MJD3 · J4 BOUND` at head `a18c167`
because unit **mjd4** (`15edfec`, forks rows 1030 (3) / 1033, ruling **row 1030 (2)**) changed the behaviour ON
PURPOSE: a capture a kill left in doubt is now **re-dispatched exactly once under `--idem <capture id>`**, its owner
writes nothing for a key already on its own log, and the receipt names it under `resolved_in_doubt` (no longer
`in_doubt`). mjd3's J4 ("hands no rep to its owner a second time … names the capture in doubt") was the pre-mjd4
contract. Main did not regress: the bisect over first-parent main names `15edfec` as the first red, and every unit
after it (mjd5 `e4a4f2c`, mlv0 `009f52e`, head) keeps the mjd4 contract, measured. The re-based J4 below is RED at
the witness BASE `074ead9` and GREEN at head; two mutants of head kill it. No code under `scripts/` is repaired.

Spec seat: unit mr3, branch `claude/mr3-spec`, cut from `origin/main` `a18c167` (19 Nov 2026). Witness read from
`claude/ms1-build` **`3981f36`** (newer than the brief's `3966f61`; `ci/mjd3/` is byte-equal between them:
`git diff --quiet 3966f61 3981f36 -- ci/mjd3` exits 0; the two later ms1 commits touch `ci/ms1/`, `scripts/organism_test.mjs`
KNOWN_RED and carried ci dirs). Every act is a row of `ci/mr3/LEDGER.jsonl`.

## 1. Reproduce (LF trees, `git -c core.autocrlf=false archive <sha> | tar -x`, under the session scratch dir)

| Tree (`--org`) | `--base-org` | Witness | Last line | J4 line |
|---|---|---|---|---|
| `a18c167` (head) | `074ead9` (ci/mjd3/BASE) | landed `witness_mjd3.mjs` | `RED MJD3 · J4 BOUND` | `round 1 exit 9 after 2 rep(s) · round 2 reps {"c:0":1,"c:1":2,"c:2":1,"c:3":1} · twice c:1 · in doubt []` |
| `074ead9` (BASE) | `074ead9` | landed | `RED MJD3 · J1 J2 J3 J4` | `… twice c:1 · in doubt null` |

The brief's gloss "round 1 exits 9 after 2 reps" is the clause's *prefix*, and it is the plant's kill (`process.exit(9)` at
the second dispatch) — the expected part. What is red is `twice c:1` and `in doubt []`.

## 2. Bisect (first-parent main, each step by command)

J4 is RED at the BASE too (the BASE is the tree before mjd3's code), so the GREEN anchor is mjd3's own landing commit
`3a73782` (measured: `GREEN J4 · twice none · in doubt [{"of":"m1",…}]`). The state file the session hook rewrites is
never touched, so the bisect runs without a checkout:

```
git bisect start --no-checkout --first-parent a18c167 3a73782
git bisect run sh -c '<scratch>/j4.sh $(git rev-parse BISECT_HEAD)'   # j4.sh: archive LF tree, run the landed witness, exit 0 iff the J4 line is GREEN
```

Steps (RED each): `90f55dd` (mlv3) · `33d1432` (mland) · `0b209b2` (mgrd) · `15edfec` (mjd4) →
**`15edfecc128df74f9f77f51210b5f128b5c456e4` is the first bad commit.** Its message: *unit mjd4 (forks rows 1030 (3) /
1033): land branch — claude/mjd3-landing 3a73782 plus scripts/gaffer_brain.mjs, scripts/capture.mjs,
scripts/rejirah.mjs, scripts/doubtminer.mjs from claude/mcr-mjd4-build dbc9717.* Its parent is mjd3's landing, so the
range is one unit wide: nothing else could have turned it.

## 3. The decision, by measurement — fate (a)

What mjd4 put on main, at head `a18c167`:

- `scripts/gaffer_brain.mjs:1794-1797` — *"mjd4 (forks row 1030 (2)) — THE IDEMPOTENCY KEY THE THREE OWNERS READ … Each owner
  writes NOTHING for a key already on its own log, so a capture a kill left in doubt is re-dispatched and lands EXACTLY once"*;
  `idemArgv` rides every owner command (`:1803` rejirah, `:1811` doubtminer, `:1855` capture).
- `scripts/gaffer_brain.mjs:1431-1437` — `inDoubtDispatches` (the newest write-ahead row of each capture in doubt).
- `scripts/gaffer_brain.mjs:2190-2228` — the re-dispatch loop: *"A CAPTURE IN DOUBT IS RE-DISPATCHED EXACTLY ONCE"*; a
  resolved capture gets a `settled` row with `resolved_from: "in-doubt"` (`:2212`), is pushed on `resolved` (`:2217`), and
  leaves `in_doubt` (`:2227-2228`); mjd5 (row 1033 (2)) adds the card retire in the same act (`:2216`).
- The owners' doors: `scripts/capture.mjs:488-493` (idem rides only the judge's door), `:714` + `:728` (a rep whose idem
  is on disk is a duplicate, not appended); `scripts/rejirah.mjs:1283-1293`; `scripts/doubtminer.mjs:1389-1391`.

So the landed J4 plant (`ci/mjd3/witness_mjd3.mjs:71-78` on `3981f36`), whose owner appends every hand-off and ignores
`--idem`, now counts mjd4's deliberate second hand-off as a second rep. The rep is NOT written twice by a real owner —
that is the mjd3 intent ("no rep reaches its owner's log twice"), and mjd4 keeps it by a different mechanism. **Fate (a):
the witness clause is re-based, naming unit mjd4, commit `15edfec`, row 1030 (2) (landed under rows 1030 (3) / 1033).**

### 3.1 The exact new expectation (J4, re-based)

> **J4 KILL MID-SETTLE (re-based on mjd4, `15edfec`, row 1030 (2))** · a process killed after an owner wrote a rep and
> before its settled row: the next round, in a fresh process over the same queue, **re-dispatches the capture in doubt
> exactly once, under the same `--idem` key as its first hand-off**; an owner that honours the key (writes nothing for a
> key already on its own log) ends with **every capture on its log exactly once**; **every** hand-off carries `--idem` =
> its capture id; no capture other than the doubted one is handed twice; the receipt names the doubted capture in
> `resolved_in_doubt` (exactly one, `of` = it) and `in_doubt` is empty; the queue carries its `settled` row with
> `resolved_from: "in-doubt"`.

The ~~old~~ J4 text stays in the witness header struck, with the row that overtook it (L9).

### 3.2 Measured — the re-based clause on every gaffer_brain commit of first-parent main

Probe = the landed witness with exactly the plant + clause edits of §4 (generator in §4.3), `--base-org` = BASE tree.

| sha | unit | J4 (re-based) | detail |
|---|---|---|---|
| `074ead9` | BASE | **RED** | doubted null · handed `{"c:0":1,"c:1":2,…}` · owner log c:1 twice · keyed false |
| `3a73782` | mjd3 | RED | doubted m1 · handed once each · keyed false · resolved null · in doubt [m1] |
| `15edfec` | mjd4 | GREEN | doubted m1 · handed `{"c:0":1,"c:1":2,"c:2":1,"c:3":1}` · owner log once each · keyed true · resolved [m1] · in doubt [] · settled from in-doubt true |
| `e4a4f2c` | mjd5 | GREEN | same |
| `009f52e` | mlv0 | GREEN | same |
| `a18c167` | head | **GREEN** | same; full last line `RED MJD3 · BOUND` (J1 J2 J3 J4 LAST GREEN) |

BOUND stays red at head (a single-file bound against a BASE many landings old); ms1's member drops every BOUND id (its
F1 A, `ci/ms1/PROOF.md` §5.1 on `3981f36`), so the member line reads GREEN with the re-based J4. That is measured only on
this container (Linux, node of the session); the neutral machine's leg is NAMED in §8.

## 4. The code path (the build touches only `ci/` and the ruled list)

### 4.1 Files and owners, by file:line at then-head (`claude/ms1-build` `3981f36`; `main` `a18c167`)

| File:line | Owner | Change |
|---|---|---|
| `ci/mjd3/witness_mjd3.mjs:19-20` | unit mjd3's witness (carried by ms1) | J4 header: old text struck, new text of §3.1 naming mjd4 / `15edfec` / row 1030 (2) |
| `ci/mjd3/witness_mjd3.mjs:71-78` | same | the plant `dispatch`: read `--idem` from `cmd.argv`; append every hand-off `{q, idem}` to the hand-off log; append to a sibling OWNER log only when the key is not already on it (the owners' law, `capture.mjs:714,728`); return `{ ok, noop, note }` on a duplicate |
| `ci/mjd3/witness_mjd3.mjs:89` | same | the child receipt also carries `resolved_in_doubt` |
| `ci/mjd3/witness_mjd3.mjs:118` | same | `runIn` also reads the owner log |
| `ci/mjd3/witness_mjd3.mjs:165-169` | same | the J4 predicate of §3.1 |
| `ci/mjd3/BASE` | same | **unchanged** `074ead9` (F1 A) |
| `scripts/organism_test.mjs:2909` (ms1-build) | organism_test.mjs (the suite; KNOWN_RED law at `:2900-2903`) | the mjd3 entry LEAVES KNOWN_RED in the same landing (a ruled entry whose member turns GREEN is STALE, exit 2), one RETIRED line added below `:2917` (L9) |
| `ci/ms1/witness_ms1.mjs:309-323`, `ci/ms1/run_mutants_ms1.mjs:51` | unit ms1's witness | **FORK F2** — R1/R2 plant the live mjd3 entry; measured RED when it leaves (§5) |
| `ci/mr3/PROOF.md`, `ci/mr3/LEDGER.jsonl`, `ci/mr3/run_mutants_mr3.mjs` | unit mr3 | new |

No state file is written by the build or its witness: the plant's queue, hand-off log and owner log are files under
`os.tmpdir()` the witness itself makes (`runChild`, `:99-105`); `gaffer_grade_queue.jsonl` (sole writer
`scripts/gaffer_brain.mjs:7`) and `reps_log.jsonl` (single writer `scripts/capture.mjs:6`) are never opened — the child
hands `gradeJudge` its `appendRow`/`dispatch` doors through `deps`, the organ's own injection seam.

### 4.2 Port class (row 1053)

The witness binds no port, names no live service, POSTs nothing, restarts nothing. The second-opinion `fetchFn` is a
plant that answers only by abort; every child has a measured cap (`2·bound + 20·S`); `LAST` checks no process naming the
temp dir survives. Unchanged by this build.

### 4.3 The probe the measurements of §3.2 and §6 ran (scratch; the build writes the same edits into the witness)

```js
// mkprobe.mjs <landed witness> <out> — anchors are exact strings of ci/mjd3/witness_mjd3.mjs @ 3981f36
rep(`    appendFileSync(rf, JSON.stringify({ q }) + "\n");`,
`    const ix = cmd && cmd.argv ? cmd.argv.indexOf("--idem") : -1, idem = ix >= 0 ? cmd.argv[ix + 1] : null;
    const ol = rf + ".owner";
    const have = existsSync(ol) ? readFileSync(ol, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
    const dup = !!idem && have.some((x) => x.idem === idem);
    appendFileSync(rf, JSON.stringify({ q, idem }) + "\n");
    if (!dup) appendFileSync(ol, JSON.stringify({ q, idem }) + "\n");`);
rep(`    return { ok: true };\n  },\n  appendRow`, `    return dup ? { ok: true, noop: true, note: "already on its log under " + idem } : { ok: true };\n  },\n  appendRow`);
rep(`in_doubt: res.in_doubt || null,`, `in_doubt: res.in_doubt || null, resolved_in_doubt: res.resolved_in_doubt || null,`);
rep(`      res({ ...f, code, capped,`, `      const owner = existsSync(f.rf + ".owner") ? readFileSync(f.rf + ".owner", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      res({ ...f, owner, code, capped,`);
// J4 (round 2 re-uses round 1's files, so k2.reps / k2.owner hold BOTH rounds)
const doubted = (k1.q.find((x) => x.kind === "dispatching" && !k1.q.some((y) => y.kind === "settled" && y.of === x.of)) || {}).of || null;
const all = k2.reps, keyOf = (q) => "m" + String(q).split(":")[1];
const raw = {}; for (const x of all) raw[x.q] = (raw[x.q] || 0) + 1;
const ownerN = {}; for (const x of k2.owner) ownerN[x.q] = (ownerN[x.q] || 0) + 1;
const keyed = all.every((x) => x.idem && x.idem === keyOf(x.q));
const onceEach = Array.from({ length: 4 }, (_, i) => ownerN["c:" + i] === 1).every(Boolean);
const reOnce = !!doubted && Object.entries(raw).every(([q, n]) => n === (keyOf(q) === doubted ? 2 : 1));
const rid = k2.o && k2.o.res.resolved_in_doubt, idl = k2.o && k2.o.res.in_doubt;
const named = Array.isArray(rid) && rid.length === 1 && rid[0].of === doubted && Array.isArray(idl) && idl.length === 0;
const settledRow = k2.q.some((x) => x.kind === "settled" && x.of === doubted && x.resolved_from === "in-doubt");
clause("J4", k1.code === 9 && !!k2.o && keyed && onceEach && reOnce && named && settledRow, /* detail line */);
```

## 5. Witness clauses of the build (each RED on base, GREEN on the build)

| Clause | Base (`074ead9`) | Build (head + the §4 witness) | Measured |
|---|---|---|---|
| mjd3 **J4** re-based | RED (keyed false, owner log c:1 twice, no resolved) | GREEN | §3.2 |
| mjd3 J1 J2 J3 LAST | RED / RED / RED / GREEN | GREEN | §3.2 full run at head (unchanged clauses) |
| mr3 **K1 STALE-GONE** — the suite member for ‹mjd3› reads GREEN and KNOWN_RED holds no mjd3 entry | RED (entry present ⇒ STALE exit 2 once the member is green) | GREEN | NAMED §8 (member run not yet made with the new witness) |
| ms1 R1 RULED / R2 STALE (if F2 B) | — | must stay GREEN | measured RED today if the entry just leaves: `RED MS1 · R1 RULED, R2 STALE` (ms1 tree with `scripts/organism_test.mjs:2909` deleted, `--only "R1 RULED,R2 STALE,R3 NEWDEATH"`; as-is tree GREEN) |

## 6. Mutants (one per clause; each run on head + the §4 witness)

| Mutant | Edit of head's `scripts/gaffer_brain.mjs` | Kills | Measured J4 line |
|---|---|---|---|
| **M-J4** (registered) | `:1855` `argv.push(...idemArgv(s));` removed (the capture door carries no key) | J4 | `RED J4 · on the owner's log {"c:1":2,…} · every hand-off keyed false` |
| M-J4b (spare, F4) | `:2217` `resolved.push(...)` never called | J4 | `RED J4 · resolved [] · in doubt [m1]` |
| M-K1 | the mjd3 KNOWN_RED entry kept | K1 | NAMED §8 (exit 2 STALE by `organism_test.mjs:2900-2903`'s law) |

## 7. FORKS (the architect rules)

**F1 — the witness BASE.** (A) keep `074ead9`; (B) re-take it at mjd3's landing `3a73782`; (C) re-take at `15edfec`.
*Recommend A.* Measurement: at `3a73782` the landed witness reads `RED MJD3 · J4 BOUND` (J1 J2 J3 GREEN), so a B or C
BASE makes J1–J3 GREEN on base and they stop proving anything; on `074ead9` all four are RED on base (§1).

**F2 — ms1's R1/R2 plants lean on the live mjd3 KNOWN_RED entry.** (A) the mr3 build re-points them at a member still
ruled (‹mtail› T3 AUTH), and each later repair unit (mrt, mrj, mrf) repeats the move; (B) the mr3 build re-cuts
`ci/ms1/witness_ms1.mjs:309-323` (+ `run_mutants_ms1.mjs:51`) to plant its OWN KNOWN_RED entry inside the member tree it
builds, decoupled from the live list; (C) ms1 re-cuts it itself before mr3 lands (ms1's file, ms1's seat).
*Recommend C, else B* — the file is ms1's witness; B or C ends the cascade for all four repair units. Measurement: the
§5 row — with the entry gone, `RED MS1 · R1 RULED, R2 STALE`; R3 NEWDEATH stays GREEN.

**F3 — the owner in the plant.** (A) a plant owner that mirrors the owners' idem law (§4.3); (B) drive the real
`capture.mjs rep --idem` door into a temp state dir. *Recommend A*: mjd3's witness bounds `gaffer_brain.mjs` alone;
the owners' idempotence has its own selftests (`capture.mjs:714,728`, `rejirah.mjs:1283-1293`, `doubtminer.mjs:1389`), and
B needs a state-dir env door on capture.mjs that NAMED §8 has not measured. M-J4 proves the key is load-bearing under A.

**F4 — one mutant or two for J4.** (A) M-J4 only (one per clause, the brief); (B) register M-J4b too (it kills a different
half: the receipt naming). *Recommend A*, keep B measured in the PROOF as a spare.

**F5 — where the build lands.** (A) on `claude/ms1-build` (the witness and KNOWN_RED live there today); (B) cut from main
after ms1 lands. *Recommend B if ms1 has landed at the launch window, else A.* Measurement:
`git merge-base --is-ancestor 3981f36 origin/main`.

**F6 — the two stale comments on main** that still state mjd3's contract: `scripts/gaffer_brain.mjs:1426-1428` (*"never
outstanding again, so the next round can never hand the same rep to its owner a second time … never silently re-graded"*)
and `:2066` (*"never re-dispatched"*). (A) leave them (mr3 stays ci-only); (B) a comment-only edit in the build, which puts
`scripts/gaffer_brain.mjs` beyond the named files; (C) hand them to the next unit that owns gaffer_brain. *Recommend C*:
they are drift (prose contradicting `:2190-2228`), not behaviour; no clause reads them.

## 8. NAMED, NOT GUESSED

| Fact | Why not reached here | What measures it on his laptop / the neutral machine |
|---|---|---|
| The re-based witness on Windows (node 22 and 24) | this container is Linux | the suite workflow's witnesses member on the build push: the ‹mjd3› assert line and its seconds |
| K1 / M-K1: the member reads ‹mjd3› GREEN and KNOWN_RED is clean | no member run with the new witness yet (spec builds nothing) | `GITHUB_ACTIONS=true ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses` on the build tree |
| Whether his live grade queue holds a capture in doubt from before mjd4 (a write-ahead row with no verdict ⇒ a card every round, `gaffer_brain.mjs:2205`) | data private; state not readable here | on his laptop, a count only: `node -e "import('./scripts/gaffer_brain.mjs').then(g=>console.log(g.inDoubtDispatches(require('fs').readFileSync('dressing-room/state/gaffer_grade_queue.jsonl','utf8').split('\n').filter(Boolean).map(JSON.parse)).filter(r=>!r.verdict).length))"` (prints one number, never a row) |
| F3 B's state-dir door on capture.mjs | not read to the end | `grep -n "STATE_DIR\|process.env" scripts/capture.mjs` |
| The effort receipt | `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository | the FINAL MESSAGE names its error |

## 9. The neutral machine on this spec's pushes

<!-- the check runs of each push are read with curl, no token: GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs -->
(filled after the push)
