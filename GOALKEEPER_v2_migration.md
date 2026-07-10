# The Goalkeeper — v2 recalibration (MASTERPLAN §12)

**Layering, not replacing.** The pre-§12 engine is frozen verbatim in the same
file as `analyzeLegacy` (still exported, for reference/diffing). The recalibrated
`analyze` is the plan of record and is what `main()` runs. Both live in the
codebase; nothing was deleted.

## Why (3 bugs the old engine had)

1. **GREEN was structurally impossible.** Old GREEN required `resilience ∈
   {solid,strong,exceptional}`, but the `daily_resilience` endpoint returns 401
   in dev-mode → `resilience` is always `null` → every verdict came out AMBER/RED.
   **Fix:** GREEN is the DEFAULT and never depends on resilience; `null` resilience
   is treated as "no signal", not a blocker.

2. **A single readiness number forced RED.** Old rule: `readiness < 70 → RED`.
   On 2026-07-10 readiness was 65 → RED, even though the underlying biology was
   fine and it was one dipped night. (The med-gate didn't catch it because that
   day's RHR happened not to flag.)
   **Fix:** the raw readiness threshold is GONE. RED requires a SUSTAINED
   multi-day convergence — deep+REM architecture collapse (the anchor) AND a
   second high/clean axis. A single night can never trigger RED.

3. **Sleep-debt measured against a textbook 8h.** Old ledger: `8h − totalSleep`,
   inflating debt for someone whose real baseline is ~6–7h (07-10 showed ~34h
   "debt" over 14d). **Fix:** debt is measured against *his own* baseline —
   primarily via Oura's own `sleep_balance` contributor (2-week-vs-2-month,
   already personal), secondarily his own median total sleep. Never 8h.

## Signal confidence tiers (§12)

- **HIGH (drive the verdict):** sleep-architecture TRENDS (deep+REM, multi-day),
  resilience trend (when available), sleep-vs-personal-baseline.
- **LOW / medication-confounded (INFO only, never escalate alone):** RHR, HRV,
  temperature. Surfaced in the brief, weighted to zero in the verdict.
- **SAFETY (separate lane):** sustained concerning physiology (multi-day
  temp/RR/SpO2) → DOCTOR-REFERRAL flag. Never any dose/diagnosis language.

## Verdict logic (summary)

- **RED** (rare): `archCollapse (deep+REM both sustained-low) AND (resilience
  falling OR sleep-short-trend OR sustained clean corroboration)`, and only with
  ≥14 nights of baseline.
- **AMBER:** one sustained HIGH-confidence deviation (or two mixed).
- **GREEN** (default): none of the above — the grind is honored.

## New data wired

All 8 `daily_readiness` contributors (verified field names): `sleep_balance,
previous_night, recovery_index, body_temperature, hrv_balance,
resting_heart_rate, activity_balance, previous_day_activity` (+ `sleep_regularity`
null-guarded). These are Oura's own 0-100 baseline-normalized sub-scores.

## Proof status

Logic verified by `test_coach_v2.mjs` (13/13), including the faithful
legacy-RED → v2-GREEN flip on the real 07-10 numbers. **Live proof still pending:**
this must be run once on the actual 45-night Oura pull on Nikhil's machine
(an unrun system is a hypothesis). Container can't reach his Oura account.
