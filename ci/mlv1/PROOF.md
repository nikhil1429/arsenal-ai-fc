# mlv1 · SITTING ADOPTS THE KEEPER WITH A DEFERRED RETIRE — PROOF (forks row 1031, M0 ITEM 2, 18 Nov 2026)

Branch `claude/mlv1-build`, made from the ITEM 1 tip `claude/mlv0-build` (`1631e22`, 18 Nov 2026). Spec:
`ci/mcr/MLIVE_SPEC.md` on `claude/mcr-mlive-spec` (§1 K1-K4, §5 M0). Ruling row 1031: idle predicate = no open sitting.

## Measured at the item base (`1631e22`, 18 Nov 2026)

| Fact | Where |
|---|---|
| `daemon` was the loop itself (createSitting · serve · SIGINT), no keeper, no retire rule | `scripts/sitting.mjs:1325-1331` (base) |
| a held port stood down with exit 0 (under a keeper that is a CLEAN stop: the keeper would stop too) | `scripts/sitting.mjs:1328` (base) |
| "open" ⇔ `S && S.id && !S.closed_at`; a restarted daemon resumes the open sitting from `sitting.json` | `scripts/sitting.mjs:479-498` |
| the close path: file, review launch (its own process), intent line through its owner | `scripts/sitting.mjs:1020-1078` |
| the service XML is emitted from `DAEMONS.args` = `["scripts/sitting.mjs", "daemon"]`, unchanged here | `scripts/daemon_watchdog.mjs:111`; `scripts/services.mjs:127` |
| the brain's retire rule (closure, strict `>`, no tolerance) | `scripts/brain.mjs:7070-7106` |

## What was built (the named files only)

- `scripts/keeper.mjs` — `retireWhenIdle({ name, entry, idle, retire })`: the brain's retire rule for a resident
  holding live work. It retires ONLY when `idle()` is true AND no judge round holds `JUDGE_PORT`; busy = one DEFERRED
  line per reason, re-checked on every write in the closure's directories (fs.watch), on every `check()` the unit
  calls when it becomes idle, and on the keeper's own poll as the floor. `KEEP_POLL_MS` names the keeper's existing
  default (the same number keep() and decide() already used; no new number). One selftest clause.
- `scripts/sitting.mjs` — `daemon` is keep() over `daemon-worker` (port `PORT`); `daemon-worker` is the old body,
  frozen, plus: a stand-down exits 69 (ALREADY_RESIDENT), the deferred retire with idle = no open sitting, and
  `close()` calls `deps.onClosed` so a deferred retire is re-checked the moment the sitting closes.

## Witness, both ways (by last line, 18 Nov 2026)

```
node ci/mlv1/witness_mlv1.mjs --org . --base-org <copy of 1631e22>
GREEN MLV1 sitting retires on a source change only when no sitting is open and no judge round runs · 6 clause(s)   (exit 0)

node ci/mlv1/witness_mlv1.mjs --org <copy of 1631e22> --base-org <same>
RED MLV1 · I1 IDLE, I2 MID, I3 JUDGE                                                                              (exit 1)
```

The plants run a REAL keeper (`scripts/sitting.mjs daemon`, the service's own arguments) on a copy under os.tmpdir(),
on a free port, with the sitting's state in a planted temp dir and `ANTHROPIC_API_KEY` planted to a non-key string so
every model lane refuses by the organism's own law (no live model call can happen). I2 measured, 18 Nov 2026: the
open sitting deferred the retire on the same pid with its undelivered units intact; his close landed through the door;
then it retired; 0 item(s) lost (plan, cursor, every unit row) and the closed sitting carries its own close reason.
Every wait is bounded by the first keeper's measured start plus one measured node start (row 1025 (2)).

## Mutants (18 Nov 2026)

```
node ci/mlv1/run_mutants_mlv1.mjs --org . --base-org <copy of 1631e22>
  mutant I1 (the closure watch removed (only the keeper's poll is left)): RED by its clause
  mutant I2 (the idle predicate ignores an open sitting): RED by its clause
  mutant I3 (the deferred retire stops reading the judge port): RED by its clause
  mutant XML (the service arguments change shape (a reinstall by his hand)): RED by its clause
run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
```

## Each touched selftest, before → after (headline lines, 18 Nov 2026)

```
sitting   sitting selftest: 99 passed, 0 failed  →  sitting selftest: 99 passed, 0 failed
keeper    keeper selftest: 16 passed, 0 failed   →  keeper selftest: 17 passed, 0 failed
node scripts/models.mjs check → exit 0
```

The hermetic suite line is in `LEDGER.jsonl` (act `suite`).

## The ruling vs the spec (named)

- The spec's M0 A says "the XML arguments unchanged in shape (`daemon` → keeper, `daemon-worker` → loop)"; the ruling
  adds that a changed argument STOPS the item. Measured: the emitted XML is byte-identical (witness clause XML, roots
  normalised), so no reinstall by his hand.
- The ruling says the retire never cuts live work and a judge round held = no retire; the witness plants both.

## FORKS

1. A retire that was DEFERRED only by the judge port is re-checked on the next closure write or the keeper's poll
   (`KEEP_POLL_MS`), not on the judge port's release: a held port pushes no event. The poll is the floor.
2. The sitting's boot instant for the retire is the PROCESS boot (`Date.now() - process.uptime()`, the brain's
   formula); its `/status` `booted_at` stays the module-load instant (unchanged). The two differ by the import time;
   the retire side is the stricter (earlier) one.
3. The invariant clauses BOUND and LAST carry no mutant of their own.
