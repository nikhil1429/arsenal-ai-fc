# mlv2 · CORTEX ADOPTS THE KEEPER WITH A DEFERRED RETIRE — PROOF (forks row 1031, M0 ITEM 3, 18 Nov 2026)

Branch `claude/mlv2-build`, made from the ITEM 2 tip `claude/mlv1-build` (`cbd4387`, 18 Nov 2026). Spec:
`ci/mcr/MLIVE_SPEC.md` on `claude/mcr-mlive-spec` (§1 K1-K5, §5 M0). Ruling row 1031: idle predicate = no lane in
flight; K5 rides it.

## Measured at the item base (`cbd4387`, 18 Nov 2026)

| Fact | Where |
|---|---|
| the OS launches `scripts/cortex.mjs` with NO mode; every named mode returns above the daemon path, which is the fall-through | `scripts/daemon_watchdog.mjs:109`; `scripts/cortex.mjs:2148-2210` (base) |
| lanes in flight live in `inflight` (a Set), up to `deep.concurrency`; each lane's close is a `.finally` | `scripts/cortex.mjs:2214-2290` (base) |
| a held :4112 stood down with exit 0 | `scripts/cortex.mjs` lock `error` handler (base) |
| K5: the restart door exited **0** once idle and promised a watchdog relaunch that has not existed since 28 Aug | `scripts/cortex.mjs` `retireIfArmed` (base); `ci/mcr/MLIVE_SPEC.md` §1 K5 |
| an expired queued wake is declined by a POST to the thalamus with no client timeout: the lane is in flight until it answers | `scripts/cortex.mjs:175-181`, the `expired-in-queue` branch |
| the dispatch poll is cortex's own `setInterval(…, 5000)`; the witness reads it from the source, never types it | `scripts/cortex.mjs` (the poll line at the foot of main) |

## What was built (the named file only: `scripts/cortex.mjs`)

- The no-mode path is keep() over `daemon-worker` (port 4112); the service arguments keep their shape.
- `daemon-worker` is the old loop, plus: a held :4112 exits 69 (ALREADY_RESIDENT); the deferred retire
  (`keeper.mjs retireWhenIdle`, ITEM 2) with idle = `inflight.size === 0`, re-checked at both lane-close sites.
- K5: the restart door's exit is a RETIRE (75), deferred by a held judge port, the lane count re-read after that
  async read; its printed lines and the door's note name the keeper, not the removed watchdog relaunch.

## Witness, both ways (by last line, 18 Nov 2026)

```
node ci/mlv2/witness_mlv2.mjs --org . --base-org <copy of cbd4387>
GREEN MLV2 cortex retires on a source change only when no lane is in flight and no judge round runs, and its door is a retire · 7 clause(s)   (exit 0)

node ci/mlv2/witness_mlv2.mjs --org <copy of cbd4387> --base-org <same>
RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR                                                                     (exit 1)
```

A REAL keeper runs on a copy under os.tmpdir() with the copy's wake queue planted and `ANTHROPIC_API_KEY` planted to a
non-key string (every model lane refuses). A PLANTED thalamus on :4113 holds the decline POST of an expired planted
wake open: that is the lane in flight. Measured 18 Nov 2026: the write DEFERRED on the same pid with the lane in flight;
the POST released, the lane closed, then it retired; the moment reached home exactly once (0 lost, 0 twice). On the
base, K5 reads "NOTHING answers :4112 (the clean stop: the unit is down)" after his restart door — the K5 hole.

## Mutants (18 Nov 2026)

```
node ci/mlv2/run_mutants_mlv2.mjs --org . --base-org <copy of cbd4387>
  mutant C1 (the worker never reads itself idle (it never retires)): RED by its clause
  mutant C2 (the idle predicate ignores a lane in flight): RED by its clause
  mutant C3 (cortex's retire stops reading the judge port): RED by its clause
  mutant K5 (the restart door exits clean again (the K5 hole)): RED by its clause
  mutant XML (the service arguments change shape (a reinstall by his hand)): RED by its clause
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

## Each touched selftest, before → after (headline lines, 18 Nov 2026)

```
cortex   ALL CHECKS PASSED  →  ALL CHECKS PASSED
node scripts/models.mjs check → exit 0
```

The hermetic suite line is in `LEDGER.jsonl` (act `suite`).

## The ruling vs the spec (named)

- Spec §7 Q3 asked whether K5 is fixed in this unit or a separate one; the ruling says K5 rides this item: fixed here.

## FORKS

1. `captains_call.mjs` (its `RESTART_DOOR` card) and `daemon_watchdog.mjs` still carry prose that promises the
   watchdog relaunches cortex after a restart; they are not named files and are not edited. The cortex selftest's
   cross-organ check still passes (it reads the door's argv, not that prose).
2. The witness binds cortex's own fixed ports (:4112, and :4113 for the planted thalamus). On a box where a live cortex
   or thalamus holds them, the plants cannot run (C2 says so by name); in CI and in this container both are free.
3. The invariant clauses BOUND and LAST carry no mutant of their own.

## The architect's class note: core.autocrlf (18 Nov 2026)

Measured on this unit's files: **no witness here plants git** (no clone, no init; every plant is an fs copy), and every
line it reads from a process or a log is split on `\r?\n`. Two CRLF hazards were found and closed:
- the mutant runner matched a multi-line edit site in LF only; it now matches in the file's OWN line ending;
- BOUND hashed raw bytes, so a CRLF checkout against an LF base read every file as changed; it now hashes text with
  CRLF folded to LF (a line ending is not a change).

Proven on copies converted to CRLF (scripts/ and setup/, the laptop's checkout shape), 18 Nov 2026:

```
witness --org <CRLF build> --base-org <CRLF base>    GREEN MLV2 cortex retires on a source change only when no lane is in flight and no judge round runs, and its door is a retire · 7 clause(s)
run_mutants --org <CRLF build> --base-org <CRLF base> run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
witness --org <CRLF base>  --base-org <CRLF base>    RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR
```

## REWORK · forks row 1053 (18 Nov 2026): RETURNED RED BY NAME — the fixed service ports

**Why it was returned (the architect's measurement):** the witness bound cortex's own fixed ports (:4112, :4113). On
his laptop the live services hold them: the re-run hung twice with no line printed, and K5 would have POSTed /restart
at whatever answers :4112 — his live cortex. Both are the witness's defects; the ruling's five requirements, answered:

1. **Planted ports, honoured only under the OS temp dir.** `scripts/cortex.mjs` gains `plantedPort(name, fixed)`:
   `ARSENAL_CORTEX_PORT` (the lock, the keeper, the tick lock, the restart knock), `ARSENAL_THALAMUS_PORT` (where every
   deep answer is POSTed) and `ARSENAL_JUDGE_PORT` (both retires' judge read) are honoured ONLY when cortex.mjs itself
   (realpath) sits under `os.tmpdir()` (realpath; case-folded on win32). Anywhere else, or with the env unset or bad,
   the fixed port stands: service behaviour is byte for byte what it was. Its unreal-path catch is declared through
   `swallow()` (BLOCK 7). One cortex selftest clause plants both ways.
2. **Every wait is bounded.** First boot: two cold imports of the copy's entry plus one node start (measured in the
   run); every later wait: the measured first boot plus one node start; a lane: cortex's own declared poll plus that.
   Every fetch carries that bound; every child kill is bounded, then forced. A clause that cannot run says
   `cannot run: <why>`, and the witness exits 1. The one unbounded step is the cold-import MEASUREMENT itself (a fresh
   node that imports the entry and exits; it binds no port and runs none of the unit) — named here, not hidden.
3. **LIVE-SAFE (new clause, with its mutant).** The real :4112 and :4113 are held by planted COUNTING listeners for the
   whole run; the clause is GREEN only when both were planted, every behavioural clause is GREEN, zero connections
   reached them, and the witness's own request door refused zero calls at a live port. Mutant: the thalamus port door
   ignored (a planted tree POSTs to the live :4113) → RED by LIVE-SAFE.
4. **Base and stack.** `origin/main` 669200d (mlv1 landed) was MERGED into this branch (no rebase, no force push);
   against it only `scripts/cortex.mjs` differs. The base now reads RED with no hang: its cortex tries the fixed :4112,
   finds the planted listener, and stands down.
5. Measured 18 Nov 2026:

```
node ci/mlv2/witness_mlv2.mjs --org . --base-org <copy of 669200d>
GREEN MLV2 cortex retires on a source change only when no lane is in flight and no judge round runs, its door is a retire, and no live port is touched · 8 clause(s)   (exit 0)
node ci/mlv2/witness_mlv2.mjs --org <copy of 669200d> --base-org <same>
RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE                                                          (exit 1)
node ci/mlv2/run_mutants_mlv2.mjs --org . --base-org <copy of 669200d>
run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN
CRLF copies (build and base): GREEN MLV2 … · 8 clause(s)
cortex selftest: ALL CHECKS PASSED · mutagen selftest: 24 passed, 0 failed · models check exit 0
hermetic suite: the one red of main (orphaned: home_pin, probe, study_scope); none other
```

**FORK (named):** on his laptop the live services hold :4112 and :4113, so the counting listeners cannot be planted
there and LIVE-SAFE reads RED by name ("cannot plant … held by another process"). The plants themselves never address
those ports (planted ports, the witness's request door refuses a live port), so the other clauses can run there; the
architect rules whether LIVE-SAFE should be a CI/container clause only.
