# UNIT mclk · THE CENSUS (forks row 1214 (4)) — counts and names only, nothing edited

Measured 21 Nov 2026 (IST) on main `56ed4ffaa304a4b303245cbedab4db025e02a3f0` (ci/mclk/BASE), by one command:
`node ci/mclk/witness_mclk.mjs census` (its header states the scan rule, the door and the bound). No site below was edited,
none was retried until green. Each red is a NAMED SITE with a lettered fork for the architect.

## Counts (21 Nov 2026)

- **Scanned: 45** — 2 plants modes (`ci/witness/mcap/witness_capability.mjs`, `ci/witness/mmeter/witness_meter.mjs`) + 43 unit witnesses `ci/<u>/witness_<u>.mjs`.
- **Derive a day, a date or a window from now: 15 unit witnesses** (static read of the witness file, comment lines dropped), by file:line:
  `ci/mday/witness_mday.mjs:80,153` · `ci/mdn2/witness_mdn2.mjs:115` · `ci/mdone/witness_mdone.mjs:67` · `ci/mfac/witness_mfac.mjs:80,133,187` ·
  `ci/mfac-floor/witness_mfac_floor.mjs:44` · `ci/mgs/witness_mgs.mjs:86,180` · `ci/mjd4/witness_mjd4.mjs:48,74` · `ci/mjd5/witness_mjd5.mjs:51,71` ·
  `ci/mjd6/witness_mjd6.mjs:64,86` · `ci/mjd7/witness_mjd7.mjs:72,73` · `ci/mlv0/witness_mlv0.mjs:65,82` · `ci/mlv1/witness_mlv1.mjs:139` ·
  `ci/mlv2/witness_mlv2.mjs:97` · `ci/mlv3/witness_mlv3.mjs:111` · `ci/mpool/witness_mpool.mjs:98,99,112,115,120,143,144,145,146,166,169,173,179`.
  The scan reads the witness file only; the mmeter plants derive their day in a sibling, `ci/witness/mmeter/plant_day.mjs:48-50` at main (`const now = new Date()` · the IST day of it · `now − m min` stamps) — the site row 1214 named, fixed on this branch.
- **Run: 17** (both plants modes + the 15), each under three clocks: AFTER = 2026-11-21 00:02 IST, BEFORE = 2026-11-20 23:58 IST
  (the Date preload door in its MOVING form, handed to every node child), and REAL (no door, the control).
- **RED at an instant: 7 sites, every one a CLOCK SITE** (REAL reads GREEN with BOUND dropped, the suite member's judgement).

## The named sites (21 Nov 2026, last line as printed)

| # | site | AFTER | BEFORE | REAL |
|---|---|---|---|---|
| S1 | `ci/witness/mmeter/witness_meter.mjs plants` | `PLANTS mmeter · 15 of 18 plant(s) as expected` | 18 of 18 | 18 of 18 |
| S2 | `ci/mday/witness_mday.mjs` | `(killed at the bound)` | `(killed at the bound)` | `RED MDAY · BOUND` |
| S3 | `ci/mfac/witness_mfac.mjs` | `RED MFAC · W1.3 BOUND` | same | `RED MFAC · BOUND` |
| S4 | `ci/mlv1/witness_mlv1.mjs` | `(killed at the bound)` | `(killed at the bound)` | `RED MLV1 · BOUND` |
| S5 | `ci/mlv2/witness_mlv2.mjs` | `RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE, BOUND` | same | `RED MLV2 · BOUND` |
| S6 | `ci/mlv3/witness_mlv3.mjs` | `RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE, BOUND` | same | `RED MLV3 · BOUND` |
| S7 | `ci/mpool/witness_mpool.mjs` | `RED MPOOL · W4.3, W4.5, J, D` | same | `GREEN MPOOL the usage tap · 33 clause(s)` |

Green at all three clocks (10, 21 Nov 2026): mcap plants (86 of 86), mdn2, mdone, mfac-floor, mgs, mjd4, mjd5, mjd6, mjd7, mlv0.

**What the measurement can and cannot say (measured, not ruled).** S1 is the only site whose AFTER and BEFORE differ: it is a
midnight defect (row 1214's cause, re-measured). S2–S7 read RED identically at BOTH instants, so their red is not the midnight
boundary: the door planted a clock about four hours away from the real one while file mtimes, process start times and the
keeper daemons those witnesses boot stayed real, and Date-only time travel splits them. S2 and S4 never ended under the door
(the bound: suite.yml timeout-minutes shared over the runs left). No site was opened past its last line.

## FORKS for the architect (one per site class; nothing edited)

- **S1 (mmeter plants):** A · this branch's fix (the planter stamps inside its planted day, the meter read at its one instant), witnessed by `ci/mclk/witness_mclk.mjs` · B · refuse it and keep row 1214 (2)'s interim NO VERDICT rule.
- **S2–S7 (red at both instants alike):** A · re-run each under a planted clock on the SAME real day at the real hour's offset (a door control) to separate the door's skew from a real date defect, then fork per site · B · rule them door artifacts (the Date preload does not move mtimes or daemons) and close the census at S1 · C · cut a census unit per site owner, each its own witness under a clock door that also plants mtimes.
- **S2 / S4 (never ended):** A · treat a hang under a planted clock as a defect of the witness's own wait (it trusts Date for a bound) · B · out of mclk's scope; name it in each owner's next unit.

## CLOSED BY THE CONTROL RUN (21 Nov 2026, forks row 1227 (4)/(5) — ci/mclk/CONTROL.md)
S2–S7 each read RED under the same door at offset ZERO (main 7bf008b): every one is an **artifact of the door, closed**.
No clock-sensitive site remains. S2 (mday) and S4 (mlv1) hang under the door at any offset: named a defect of that
witness's wait, to be fixed by its owner, never by mclk. S1 (mmeter plants) stands as the one midnight defect, fixed by mclk.
