# mlv3 · THALAMUS (THE CAPTURE NERVE) ADOPTS THE KEEPER WITH A DEFERRED RETIRE — PROOF (forks row 1031, M0 ITEM 4, 18 Nov 2026)

Branch `claude/mlv3-build`, made from the ITEM 3 tip `claude/mlv2-build` (`78dc084`, 18 Nov 2026). Spec:
`ci/mcr/MLIVE_SPEC.md` on `claude/mcr-mlive-spec` (§1 K1-K4, §5 M0: "thalamus: every afferent event is ingested once
— the spool + idempotence set"). Ruling row 1031: idle predicate = its spool drained; the plant = every afferent event
ingested EXACTLY ONCE across a retire, with events arriving during the retire.

## Measured at the item base (`78dc084`, 18 Nov 2026)

| Fact | Where |
|---|---|
| the OS launches `scripts/thalamus.mjs` with NO mode; `selftest` · `status` · `config` return above the daemon | `scripts/daemon_watchdog.mjs:110`; `scripts/thalamus.mjs:3069-3075` (base) |
| a held :4113 stood down with exit 0 | `scripts/thalamus.mjs` server `error` handler (base) |
| ingest() appends to afferent.jsonl BEFORE the 200 answers; an `event_id` already seen is refused (S8) | `scripts/thalamus.mjs:741-776` |
| the idempotence set is seeded from the WHOLE afferent file at boot | `scripts/thalamus.mjs` main, the `bootRows` seed |
| the spool drains at boot after listen(), on every POST poke, and every `SPOOL_DRAIN_EVERY_MS` | `scripts/thalamus.mjs:1481-1540`, `:1497` |
| the nerve writes ahead to the spool, POSTs, and marks delivered only on a 2xx | `hooks/afferent-post.mjs:299-328`; `scripts/spool.mjs:120-160` |
| the binding buffer scores ingested events after `binding_ms`; `nucleus.flush()` chains onto a running flush | `scripts/thalamus.mjs:793`, `:820-834` |

## What was built (the named file only: `scripts/thalamus.mjs`)

- The no-mode path is keep() over `daemon-worker` (port 4113), after the `config` dispatch (the 818 pin holds); the
  service arguments keep their shape. A held :4113 exits 69.
- The deferred retire (`keeper.mjs retireWhenIdle`, ITEM 2). Idle = no capture request in flight AND no row pending in
  the spool that this nucleus has not already ingested (a pending row whose `event_id` is in `seenEvents` is captured;
  the nerve or the next drain only marks it). Busy defers; a held judge port defers.
- The retire stops LISTENING first (server.close lets an in-flight request finish), then FLUSHES the binding buffer
  through the nucleus's own chain, then exits 75. What arrives while it is down stays pending in the nerve's spool; the
  new worker drains it at boot through the same idempotent ingest().

**A design correction found by the witness, 18 Nov 2026:** the first cut's idle read was "spool pending = 0 and the
binding buffer empty". Under a live stream it NEVER read idle (the nerve's own row is pending until its 2xx returns,
and the buffer is refilled faster than it flushes), so T2 read "retire NO". The predicate was narrowed to what can
actually be lost (an un-ingested row, a request in flight), and the buffer moved from the predicate into the retire
(flushed before the exit).

## Witness, both ways (by last line, 18 Nov 2026)

```
node ci/mlv3/witness_mlv3.mjs --org . --base-org <copy of 78dc084>
GREEN MLV3 the capture nerve retires only when its spool is drained, and every event lands exactly once across a retire · 7 clause(s)   (exit 0)

node ci/mlv3/witness_mlv3.mjs --org <copy of 78dc084> --base-org <same>
RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE                                                                 (exit 1)
```

A REAL keeper runs on a copy under os.tmpdir(): its spool a planted temp db, its config planted with the adjudicator
and the pre-answer embedding OFF, `ANTHROPIC_API_KEY` planted to a non-key (no ingest can spend). The NERVE is planted
by the witness with the copy's own `scripts/spool.mjs`, in the hook's own order. Measured 18 Nov 2026, T2: 12 events
streamed through a retire, 5 of them arriving while nothing listened; all 12 landed exactly once (lost 0, twice 0) and
the spool ended drained. T3: a request half-sent from a lane that never spools DEFERRED the retire; it landed once;
then it retired.

## Mutants (18 Nov 2026)

```
node ci/mlv3/run_mutants_mlv3.mjs --org . --base-org <copy of 78dc084>
  mutant T1 (the worker never reads itself idle (it never retires)): RED by its clause
  mutant T2 (the drain marks spooled rows delivered without ingesting them (the loss path)): RED by its clause
  mutant T3 (the idle predicate ignores a capture request in flight): RED by its clause
  mutant T4 (the thalamus retire stops reading the judge port): RED by its clause
  mutant XML (the service arguments change shape (a reinstall by his hand)): RED by its clause
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

Two earlier mutants SURVIVED and were replaced, each by a sharper plant (named, 18 Nov 2026): (a) "the boot drain
removed" survived because the POST poke drain also replays the spool — the nerve is doubly safe, so the loss mutant
is now the drain that marks without ingesting; (b) "ignore the in-flight count" survived while the T3 request was
also spooled, so T3 now sends from a lane that never spools, and only the in-flight count can hold it.

## Each touched selftest, before → after (headline lines, 18 Nov 2026)

```
thalamus  ALL CHECKS PASSED  →  ALL CHECKS PASSED
node scripts/models.mjs check → exit 0
```

The hermetic suite line is in `LEDGER.jsonl` (act `suite`). The S8 laws that pin this file (`const drainSpool`, the
drain inside the listen callback, the whole-file seed) are LIVE under the hermetic profile; their regexes were read
against the build and the lines they match are untouched.

## FORKS

1. A judge round holds its port only while it runs; a retire deferred by it alone is re-checked on the next closure
   write, the next request's end, or the keeper's poll (`KEEP_POLL_MS`), not on the port's release.
2. The witness binds thalamus's own fixed port :4113: on a box where the live thalamus runs (his laptop: the one organ
   left on), the plants cannot run there, and must run in CI or a container. In one mutant run, 18 Nov 2026, the
   CONTROL read T4 RED once; four standalone runs and the next two mutant runs read it GREEN. A timing flake under load
   is named, not hidden.
3. The invariant clauses BOUND and LAST carry no mutant of their own.

## The architect's class note: core.autocrlf (18 Nov 2026)

Measured on this unit's files: **no witness here plants git** (no clone, no init; every plant is an fs copy), and every
line it reads from a process or a log is split on `\r?\n`. Two CRLF hazards were found and closed:
- the mutant runner matched a multi-line edit site in LF only; it now matches in the file's OWN line ending;
- BOUND hashed raw bytes, so a CRLF checkout against an LF base read every file as changed; it now hashes text with
  CRLF folded to LF (a line ending is not a change).

Proven on copies converted to CRLF (scripts/ and setup/, the laptop's checkout shape), 18 Nov 2026:

```
witness --org <CRLF build> --base-org <CRLF base>    GREEN MLV3 the capture nerve retires only when its spool is drained, and every event lands exactly once across a retire · 7 clause(s)
run_mutants --org <CRLF build> --base-org <CRLF base> run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
witness --org <CRLF base>  --base-org <CRLF base>    RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE
```

## REWORK · forks row 1053 (18 Nov 2026): RETURNED RED BY NAME — the fixed service ports

**Why it was returned:** the witness bound thalamus's own fixed port :4113 — on his laptop the one organ left on holds
it. The ruling's five requirements, answered:

1. **Planted ports, honoured only under the OS temp dir.** `scripts/thalamus.mjs` gains `plantedPort(name, fixed)`
   (cortex's door, the same shape): `ARSENAL_THALAMUS_PORT` (its listen and its keeper) and `ARSENAL_JUDGE_PORT`
   (its retire's judge read) are honoured ONLY when thalamus.mjs itself (realpath) sits under `os.tmpdir()`. Unset,
   bad, or anywhere else: the fixed :4113, byte for byte (`const PORT` keeps its name, so the S8 listen pin holds).
   Its unreal-path catch is declared through `swallow()`. One thalamus selftest clause plants both ways.
2. **Every wait is bounded.** First boot: two boot REHEARSALS (a fresh node that imports the entry and brain.mjs,
   opens the spool and reads the whole afferent record — a worker's boot short of listening) plus three node starts
   (the port probe and listen, this witness's poll step, the /status round trip); every later wait the measured first
   boot plus one node start; a drain the drainer's own declared tick plus that; the in-flight request carries the same
   bound. A clause that cannot run says `cannot run: <why>`; the witness exits 1. The one unbounded step is the
   rehearsal MEASUREMENT itself (it binds no port and runs none of the unit). Named on the way: the first cut measured
   a bare import, which missed the worker's real boot work and read RED on four of six runs; the second cut's rehearsal
   died at parse (a newline literal inside its template) and measured nothing. Both fixed, both named.
3. **LIVE-SAFE (new clause, with its mutant).** The real :4112 and :4113 are held by planted counting listeners for
   the whole run; GREEN only when both were planted, every behavioural clause is GREEN and zero connections reached
   them. Mutant: the port door ignored (a planted tree binds the live :4113) → RED by LIVE-SAFE.
4. **Base and stack.** `claude/mlv2-build` (790e58c, itself cut on main 669200d) is MERGED into this branch (no rebase,
   no force push); against it only `scripts/thalamus.mjs` differs. The base reads RED with no hang: its thalamus tries
   the fixed :4113, finds the planted listener, and stands down.
5. Measured 18 Nov 2026:

```
node ci/mlv3/witness_mlv3.mjs --org . --base-org <copy of mlv2 790e58c>
GREEN MLV3 the capture nerve retires only when its spool is drained, every event lands exactly once across a retire, and no live port is touched · 8 clause(s)   (exit 0)
node ci/mlv3/witness_mlv3.mjs --org <copy of mlv2> --base-org <same>
RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE   (exit 1)
node ci/mlv3/run_mutants_mlv3.mjs --org . --base-org <copy of mlv2>
run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN
CRLF copies (build and base): GREEN MLV3 … · 8 clause(s)
thalamus selftest: ALL CHECKS PASSED · mutagen selftest: 24 passed, 0 failed · models check exit 0
hermetic suite: the one red of main (orphaned: home_pin, probe, study_scope); none other
```

**FORK (named):** on his laptop the live thalamus holds :4113, so the counting listener cannot be planted there and
LIVE-SAFE reads RED by name ("cannot plant … held by another process"); the plants never address :4113 (planted port,
the witness's request door refuses a live port). The architect rules whether LIVE-SAFE is a CI/container clause only.

**Neutral CI verdict of the rework push `3b71507` (read with curl, 18 Nov 2026):** run 44372760020 — `npm test · node 22`: success · `npm test · node 24`: success.
