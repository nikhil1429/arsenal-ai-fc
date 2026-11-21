# UNIT mclk · THE CONTROL RUN (forks row 1227 (4)/(5)) — the census door at offset ZERO, sites S2–S7

Measured 21 Nov 2026 (IST) on main `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`, branch claude/mclk-control. The door is the census's
own: the Date preload, MOVING form, handed to every node child, planted at T = the real instant read once at start
(2026-11-21T06:33:28.571Z, offset 0). Each site ran ONCE under it, through the census code of `ci/mclk/witness_mclk.mjs`
run from a scratch copy with exactly these replacements (no file of any unit edited): the clocks became `ZERO` (that door)
+ `REAL` (no door, the control); the plants modes and every unit outside S2–S7 were skipped; the per-run bound is the job's
timeout-minutes (.github/workflows/suite.yml, read) shared over the runs. The census judgement drops BOUND ids, as the suite
member does; it records the last line, not the numeric exit (a RED line is the exit-1 grammar; "killed at the bound" ended
by signal, no exit).

| site | exit at offset 0 | last line at offset 0 | REAL (no door) | class |
|---|---|---|---|---|
| S2 `ci/mday/witness_mday.mjs` | none (killed) | `(killed at the bound)` | `RED MDAY · BOUND` (GREEN, BOUND dropped) | RED at offset 0 → ARTIFACT OF THE DOOR, closed · its hang: a defect of that witness's wait, to its owner |
| S3 `ci/mfac/witness_mfac.mjs` | 1 | `RED MFAC · W1.3 BOUND` | `RED MFAC · BOUND` | RED at offset 0 → ARTIFACT OF THE DOOR, closed |
| S4 `ci/mlv1/witness_mlv1.mjs` | none (killed) | `(killed at the bound)` | `RED MLV1 · BOUND` | RED at offset 0 → ARTIFACT OF THE DOOR, closed · its hang: a defect of that witness's wait, to its owner |
| S5 `ci/mlv2/witness_mlv2.mjs` | 1 | `RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE, BOUND` | `RED MLV2 · BOUND` | RED at offset 0 → ARTIFACT OF THE DOOR, closed |
| S6 `ci/mlv3/witness_mlv3.mjs` | 1 | `RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE, BOUND` | `RED MLV3 · BOUND` | RED at offset 0 → ARTIFACT OF THE DOOR, closed |
| S7 `ci/mpool/witness_mpool.mjs` | 1 | `RED MPOOL · W4.3, W4.5, J` | `GREEN MPOOL the usage tap · 33 clause(s)` | RED at offset 0 → ARTIFACT OF THE DOOR, closed |

## Counts (21 Nov 2026)
- Run: 6 sites, once each at offset 0. RED at offset 0: **6** → door artifacts, closed. GREEN at offset 0: **0** → no
  clock-sensitive site; nothing goes to the mkp24 seat or to any owner as clock-sensitive.
- Hangs: **2** (S2 mday, S4 mlv1), killed at the bound at offset 0 as at both shifted instants — named, per the ruling, a
  defect of that witness's wait, to be fixed by its owner, never by mclk.
- Measured, not ruled: the moving door restarts its clock at T in EVERY node process it loads in (S = each process's own
  start), so a child started later reads an instant earlier than its parent's — time runs backward across a process tree.
  That alone can split a witness that compares stamps written by different processes, which fits every site reading RED at
  offset 0. The unit witness of mclk uses the FIXED form of the door and is not affected.

## CI (the neutral machine, read through the public API) — see ci/mclk/LEDGER.jsonl
