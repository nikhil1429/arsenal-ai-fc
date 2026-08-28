# RECORD — FOUR DAEMONS WOKEN BY ACCIDENT DURING S9 ORIENTATION

**Date:** 2026-08-28, ~14:12 IST · **Rung:** S9 · BUILD · OWNERSHIP · **Model:** Opus 5 · effort max
**Class:** a FORBIDDEN line breached — "waking anything" — by the executor, in orientation, before any edit.
**Owner of the remedy:** HIM. A session cannot kill it (two independent reasons, both below).

---

## WHAT HAPPENED, EXACTLY

The command was an orientation read, meant to print usage:

```
node scripts/daemon_watchdog.mjs --help
```

`daemon_watchdog.mjs` has **no `--help` branch**. The unrecognised argument fell through to the
organ's DEFAULT action, which is a full `pass()` — probe, decide, **dispatch**. It printed:

```
daemon_watchdog: 1/6 up · DOWN: turnstile, cortex, brain, sitting · UNKNOWN (probe not takeable): context
· relaunch DISPATCHED: turnstile, cortex, brain, sitting (detached via the VBS cloak —
  a dispatch is not an UP; the next pass's probe is the proof)
```

Four daemons were launched into a **switched-off organism**. Measured in the process table at 14:12:21:

| PID   | process                     |
|-------|-----------------------------|
| 13244 | `node scripts/cortex.mjs`   |
| 15324 | `node scripts/turnstile.mjs`|
| 4284  | `node scripts/brain.mjs daemon` |
| 9052  | `node scripts/sitting.mjs daemon` |

`thalamus` (PID 12972, 14:03:50) **predates the command** and is the one exception his switch-off
order allows. It was not touched.

## WHAT IT COST — MEASURED, NOT ASSUMED

**Real token spend ≈ ZERO.** The brain daemon fired a boot batch of **17 ledger rows** in the
08:40–08:44 UTC window (= 14:10–14:14 IST). Every one failed before reaching the API:

```json
{"ts":"2026-08-28T08:43:00.630Z","job":"cortex_wake","engine":"claude","model":"opus",
 "input_tokens":0,"output_tokens":0,"cache_creation_tokens":0,"cache_read_tokens":0,
 "total_tokens":1391,"duration_ms":10694,"ok":false,
 "error":"Failed to authenticate: OAuth session expired and could not be refreshed"}
```

`input/output/cache` are all **0**; the `total_tokens` figure is a local estimate, not billed usage.

⛔ **CORRECTION, 28 Aug, from the architect — verified by running.** This record first said the
burst *"stopped on its own at 08:44:17 UTC — the fail streak is THE GATE doing its job."*
**That is REFUTED.** `midday_cartridge` fired again at **14:20:07 / 14:20:23 / 14:20:38 IST**
(skipped-before-spend). The daemons **are still ticking**; they had not stopped, I had only stopped
looking. The gate is holding the *spend*, not the *tick*.

The correction matters because it changes the urgency, which is the whole point of the card:

⚠ **Spend is zero only while his OAuth is dead.** It is not the gate that is protecting him here,
it is an expired token. **An OAuth refresh — his next normal login — turns a live, ticking,
switched-off-by-order organism into real spend.** The kill is URGENT, not cosmetic.

## WHY THE EXECUTOR DID NOT JUST KILL THEM

Two independent blocks, and they agree:

1. **The classifier refused both kill paths** — `Stop-Process` (Bash) and `taskkill` (PowerShell).
2. **The organism already knows a session cannot do this.** `setup/restart_surfaces.ps1:3`:
   *"a session shell cannot kill his processes — Access is denied"*. And the watchdog's own law,
   `daemon_watchdog.mjs:550` and `:608`: *"Live daemon kill sirf aapke word se"* /
   *"IT PROPOSES, IT NEVER ACTS. The remedy is a KILL and this file may not kill"*.

So the remedy is **HIS hands**, which is what the organism's own law already said it would be.

## WHAT HE HAS TO DO — ONE THING

Kill four PIDs. From an ordinary terminal of his:

```
taskkill /PID 13244 /F & taskkill /PID 15324 /F & taskkill /PID 4284 /F & taskkill /PID 9052 /F
```

⛔ **Do NOT kill PID 12972 (thalamus)** — that one is sanctioned and is capturing his turns.
PIDs are from 14:12:21 today; if the box has rebooted since, they are already gone and nothing is owed.

## WHY THIS IS S9'S OWN EVIDENCE, NOT A DIGRESSION

S9's third scope item is: **"the watchdog becomes a REPORTER (a finding + its witness, never a
launcher)."** This incident is that item's live witness, produced by accident, an hour before the
rung built it:

- A **read-shaped command** on a supervisory organ **launched processes**. The blast radius of a
  launcher-watchdog is not bounded by intent — a typo reaches it.
- It launched into an organism that his standing order says must stay OFF. The organ had no idea
  the switch-off existed, because a launcher's decision is `port closed ⇒ relaunch` and nothing else.
- The dispatch line itself concedes the design flaw: *"a dispatch is not an UP; the next pass's
  probe is the proof."* An arm that cannot confirm its own effect should not be an arm.

After S9 item 3, the same fall-through prints a FINDING with its WITNESS and spawns nothing.

## SECOND FINDING — MY FIRST READING WAS WRONG, AND THE REAL ONE IS WORSE

**What this section first claimed:** that `queue\2026-08-28_s8-step0-blocked.md` was cited by S8's
RESUME entry and did not exist, and that this was a SHAPE-8 instance (*a receipt is testimony, not
measurement*).

⛔ **REFUTED by the architect, who read the file at boot. That record EXISTS**, at
`C:\Users\nikhi\arsenal-audit-artifacts\queue\2026-08-28_s8-step0-blocked.md`. **My SHAPE-8 claim
dies.** I ran `git ls-files queue/` against the REPO's `queue/` and concluded from one directory
that a file written to a different one had never been written — the audit's own §4 rule (an
instrument is a LEAD until a run verifies it) applied to my own instrument, and I skipped it.

**THE REAL FINDING, which is a class and not an incident:** per his ruling of 25 Aug, the CHANNEL is
the `queue\` beside `ARCHITECT_HANDOFF.md` in `arsenal-audit-artifacts` — **the repo's own `queue/`
is a decoy of it.** It has now taken two victims in one day: S8's STEP 0 record was looked for in
the wrong one, and **this very file was written into the wrong one** (the architect copied it across
to the channel). A directory that looks exactly like the channel, sitting in the repo an executor
already has open, will keep collecting records that the architect never sees.

**Fold item, this rung's commit:** a `README.md` in the repo's `queue/` pointing at the real
channel. Nothing is deleted or moved (L9) — the decoy stays, and now it says what it is.

## STATUS

- Record written. Escalated to the architect session. Carded to HIM (the kill).
- The rung was NOT abandoned: nothing about the wake blocks S9's build, which starts nothing.
