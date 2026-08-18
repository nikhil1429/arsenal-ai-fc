# The Goalkeeper — v2 recalibration (MASTERPLAN §12)

**Layering, not replacing.** The pre-§12 engine is frozen verbatim in the same
file as `analyzeLegacy` (still exported, for reference/diffing). The recalibrated
`analyze` is the plan of record and is what `main()` runs. Both live in the
codebase; nothing was deleted.

(verified 10 Aug 2026 — every clause of that paragraph HOLDS; nothing corrected here.
`grep -n "export function analyzeLegacy" scripts/oura_coach.mjs` finds it still exported;
`grep -n "recalibrated v2 is the plan of record" scripts/oura_coach.mjs` lands on the line
inside `main()` that calls `analyze(nights, intake)`. "Frozen VERBATIM" was checked
byte-for-byte rather than eyeballed: the `analyzeLegacy` body at HEAD is identical (modulo
line endings) to the one committed in `097121b`, the recalibration commit that also created
this file. `periodize`, `lateDose`, `circadian`, `resTrendFalling` and the legacy `CFG`
block are byte-identical too. "For reference/diffing" is literal, not aspirational — the
only importer of `analyzeLegacy` anywhere in the repo is the v2 suite, which runs the two
engines side by side: `grep -rn "analyzeLegacy" scripts/*.mjs`.
ONE NUANCE this paragraph does not carry, and it matters if you ever diff the two engines:
legacy's own code is frozen, but legacy is not hermetic. It calls the SHARED helper
`safetyScan` (`grep -n "HARD SAFETY" scripts/oura_coach.mjs`), and that helper WAS changed
after this note was written — the 25 Jul 2026 E2E audit made "consecutive days" mean the
calendar instead of array neighbours. So `analyzeLegacy` is verbatim; the doctor-referral
behaviour underneath BOTH engines is not.)

## Why (3 bugs the old engine had)

1. **GREEN was structurally impossible.** Old GREEN required `resilience ∈
   {solid,strong,exceptional}`, but the `daily_resilience` endpoint returns 401
   in dev-mode → `resilience` is always `null` → every verdict came out AMBER/RED.
   **Fix:** GREEN is the DEFAULT and never depends on resilience; `null` resilience
   is treated as "no signal", not a blocker.

   (checked 10 Aug 2026. The CAUSE and the FIX both hold; only the HTTP status is
   unsettled. Cause: legacy GREEN really does require `resOK` —
   `grep -n "const resOK" scripts/oura_coach.mjs` shows
   `["solid","strong","exceptional"].includes(t.resilience)` — so `null` makes GREEN
   unreachable by construction, exactly as written. Fix: `grep -n "DEFAULT — grind honored"
   scripts/oura_coach.mjs` is the else-branch that returns GREEN with no resilience term in
   it, and `resTrendFalling` returns `false` outright when fewer than 4 ranked values exist,
   i.e. absence is "no signal", never a blocker. The `null` is not theoretical: every live
   run in `scripts/coach.log` prints `resilience: unavailable (dev-mode) — not counted, does
   NOT block GREEN`, and `dressing-room/state/readiness.json` carries
   `signals.resilience_available: false`.
   **NOT VERIFIED 10 Aug 2026 — the "401" specifically.** No log line in this repo prints the
   status for that endpoint. Two clues point opposite ways, so treat the number as a claim:
   `fetchNights` lists an endpoint under "skipped unavailable endpoints" only when its promise
   REJECTED, and `pull()` turns a first-page 403/404/422 into an empty FULFILLED array — so
   daily_resilience throwing (as coach.log shows it does, on every run) is consistent with 401
   and NOT with a plain 403; yet the coach's own inline comment says 403
   (`grep -n "dev-mode 403 on" scripts/oura_coach.mjs`). Either way the consequence is the
   same and it is the consequence this bug was about: resilience arrives `null`.)

2. **A single readiness number forced RED.** Old rule: `readiness < 70 → RED`.
   On 2026-07-10 readiness was 65 → RED, even though the underlying biology was
   fine and it was one dipped night. (The med-gate didn't catch it because that
   day's RHR happened not to flag.)
   **Fix:** the raw readiness threshold is GONE. RED requires a SUSTAINED
   multi-day convergence — deep+REM architecture collapse (the anchor) AND a
   second high/clean axis. A single night can never trigger RED.

   (verified 10 Aug 2026, and this one is still REPRODUCIBLE on demand — do not take it
   on trust, run it: `node scripts/test_coach_v2.mjs` prints
   `LEGACY says: RED | V2 says: GREEN` on the 07-10 fixture. The old rule is real —
   `grep -n "amber:" scripts/oura_coach.mjs` shows `amber: { readiness: 70 }`, read by the
   legacy RED branch as `R < CFG.amber.readiness`. The threshold really is GONE from v2:
   `readiness_raw` is emitted for context only and `week_mean_readiness` is reported by
   `periodizeV2`, but no comparison anywhere in `analyze()` reads either one.
   NOT VERIFIED 10 Aug 2026 — the RAW HISTORICAL NUMBERS in this bullet ("readiness was 65 on
   2026-07-10", and the "~34h debt over 14d" in bug #3 below). No 2026-07-10 verdict survives
   on disk; `readiness.json` holds one day and it is `2026-08-04`. They are corroborated only
   by the suite's own fixture, which states them as his actual night — treat them as a claim,
   not as evidence. The MECHANISM they illustrate is independently proven by the flip above.)

3. **Sleep-debt measured against a textbook 8h.** Old ledger: `8h − totalSleep`,
   inflating debt for someone whose real baseline is ~6–7h (07-10 showed ~34h
   "debt" over 14d). **Fix:** debt is measured against *his own* baseline —
   primarily via Oura's own `sleep_balance` contributor (2-week-vs-2-month,
   already personal), secondarily his own median total sleep. Never 8h.

   (corrected 10 Aug 2026 — the DIAGNOSIS holds, the description of the FIX has two errors
   that would send you looking in the wrong place in the code.
   Diagnosis, verified: `grep -n "sleepNeedSec" scripts/oura_coach.mjs` shows
   `sleepNeedSec: 8 * 3600` and the legacy ledger computing `cfg.sleepNeedSec - d.totalSleep`
   per night. Still true, still frozen, still legacy-only.
   ERROR 1 — the primary/secondary split is backwards for the DEBT. The debt NUMBER
   (`sleep_debt_h_14d_vs_personal`) is computed entirely from `personalNeedSec`; `sleep_balance`
   contributes nothing to it and is only reported alongside. `sleep_balance` IS primary, but for
   the SHORTFALL FLAG, not the ledger: `sleepShortTrend` fires on `sleepBal7 < 55` OR on
   7d-mean-sleep below 90% of `personalNeedSec`. Two different outputs, two different inputs.
   ERROR 2 — "his own median total sleep" is no longer the whole story, because the code moved
   after this note was written. `grep -n "personalNeedSec = Math.max" scripts/oura_coach.mjs`:
   the need is `Math.max(own median, 6.5h)`, and the median is taken from the window EXCLUDING
   the 7 nights being judged. The 25 Jul 2026 E2E audit put both guards in for a reason this
   note predates: taking the median of the same nights it judged let five weeks at 5.6h simply
   redefine 5.6h as his normal and report GREEN on a burnout. So 6.5h is a FLOOR that can only
   raise the need, not the "fallback if the median is null" its config comment still calls it.
   The floor is live, not theoretical — `readiness.json` currently shows
   `personal_sleep_need_h: 6.5`.
   "Never 8h" is intact: no v2 path reads `CFG.sleepNeedSec`.)

## Signal confidence tiers (§12)

- **HIGH (drive the verdict):** sleep-architecture TRENDS (deep+REM, multi-day),
  resilience trend (when available), sleep-vs-personal-baseline.
- **LOW / medication-confounded (INFO only, never escalate alone):** RHR, HRV,
  temperature. Surfaced in the brief, weighted to zero in the verdict.
- **SAFETY (separate lane):** sustained concerning physiology (multi-day
  temp/RR/SpO2) → DOCTOR-REFERRAL flag. Never any dose/diagnosis language.

(verified 10 Aug 2026 — the three tiers are accurate, with ONE LANE MISSING from the list.
HIGH: the three named signals are exactly the three the convergence gate reads. LOW: they are
collected into `lowConfNotes` and never touch the verdict, and a hard guard makes the invariant
explicit — if the only "concern" is low-confidence or a single bad night, the verdict is forced
back to GREEN. SAFETY: `grep -n "HARD SAFETY" scripts/oura_coach.mjs` gives the exact criterion
this line summarises — ≥3 CALENDAR-consecutive days carrying ≥2 clean flags each (temp, RR, SpO2),
OR SpO2 at-or-below the clinical floor on ≥3 of the last 5 nights.
THE MISSING LANE: there is a FOURTH, which this list omits and the verdict rule below then cites
by name ("sustained clean corroboration"). `grep -n "CLEAN CORROBORATION" scripts/oura_coach.mjs`
— sustained respiratory-rate elevation over baseline, held for 4 calendar-adjacent days. It sits
between HIGH and LOW: it is labelled *moderate*, it can never anchor a verdict, but it CAN serve
as the second axis that turns an architecture collapse into RED, and it counts toward the
two-mixed-axes AMBER. Read as written, this section says RR is not a verdict input. It is one.)

## Verdict logic (summary)

- **RED** (rare): `archCollapse (deep+REM both sustained-low) AND (resilience
  falling OR sleep-short-trend OR sustained clean corroboration)`, and only with
  ≥14 nights of baseline.
- **AMBER:** one sustained HIGH-confidence deviation (or two mixed).
- **GREEN** (default): none of the above — the grind is honored.

(verified 10 Aug 2026 — this summary still matches the gate clause for clause; read it live at
`grep -n "haveBaseline && archCollapse" scripts/oura_coach.mjs`, which is
`if (haveBaseline && archCollapse && (resFalling || sleepShortTrend || cleanCorrob))`, with
`haveBaseline = N >= 14` two dozen lines above it. Two details the summary compresses, both
worth knowing before you predict a verdict: the AMBER branch ALSO fires on `archPartial` —
deep OR REM sustained-low on its own, without the collapse — and the "or two mixed" is literal
arithmetic, `highAxes >= 2` counting the three high axes plus the RR corroboration. And the
≥14-nights guard binds RED ONLY; AMBER and GREEN are reachable in baseline-building mode.)

## New data wired

All 8 `daily_readiness` contributors (verified field names): `sleep_balance,
previous_night, recovery_index, body_temperature, hrv_balance,
resting_heart_rate, activity_balance, previous_day_activity` (+ `sleep_regularity`
null-guarded). These are Oura's own 0-100 baseline-normalized sub-scores.

(verified 10 Aug 2026 — all eight field names still match the API mapping exactly, plus the
null-guarded ninth; read them live at
`grep -n "c_sleepBalance: num(rc.sleep_balance)" scripts/oura_coach.mjs` and the four lines
under it. "Wired" is the honest word and it is worth being precise about what it buys:
`sleep_balance` is the only one of the nine that reaches the verdict — via `sleepShortTrend`.
The other eight are carried into `signals.contributors_today` for context and read by nothing
in the gate. Note too that on a live run they can all come back `null` — `readiness.json`
currently shows every contributor null for `2026-08-04`. They ride the `daily_readiness`
record, and for that day there is none at all: `signals.readiness_raw` is null too, and the
day entered the history through the sleep endpoint (`days` is the union of the readiness days
and the sleep days). The wiring is correct; the data arriving is not guaranteed.)

## Proof status

Logic verified by `test_coach_v2.mjs` (13/13), including the faithful
legacy-RED → v2-GREEN flip on the real 07-10 numbers. **Live proof still pending:**
this must be run once on the actual 45-night Oura pull on Nikhil's machine
(an unrun system is a hypothesis). Container can't reach his Oura account.

**(corrected 10 Aug 2026 — THE PARAGRAPH ABOVE IS THE EXPENSIVE KIND OF STALE. Both of its
claims were true on 10 Jul 2026 and neither has been true for weeks. This file has not been
touched since the recalibration commit that created it — `git log --oneline --follow -- GOALKEEPER_v2_migration.md`
returns exactly one commit, `097121b` — so it has been telling
every reader since then that the Goalkeeper is an unrun hypothesis. CLAUDE.md's build order
carries a scar for this same sentence in its own words — "this said 'pending live run' long
after it had run, so every session read the capstone's predecessor as unfinished". That scar
was written into CLAUDE.md and the source doc was left saying it.**

**LIVE PROOF IS NOT PENDING. It has run, repeatedly, on his own body.** Evidence, none of it
from another document:
- `dressing-room/state/readiness.json` → `"engine": "v2-recalibrated"`, `"ok": true`, a real
  `AMBER` verdict for day `2026-08-04`, `"mode": "full-coach"`, with his own sleep values in
  it. `main()` only ever writes that file after `isPersistableVerdict` passes, so its
  existence IS the live run — a fixture cannot produce it.
- `scripts/coach.log` holds a run of live morning briefs from 2026-07-16 onward, each one
  ending `(full verdict written -> …\readiness.json)`, each one tagged `[v2]` by `brief()`.
  Count them yourself rather than trusting a number here:
  `grep -c "THE GOALKEEPER \[v2\]" scripts/coach.log`.
- It is not a manual ritual either: `grep -n "goalkeeper" scripts/conductor.mjs` shows the
  body read wired into the ordered morning chain at 08:30, declaring `writes: readiness.json`.

One clarification on "the actual 45-night Oura pull", which is easy to misread as a
precondition that was never met: 45 is the LOOKBACK WINDOW (`fetchNights(45)`), not a required
night count. The history only ever contains the days Oura actually returned — no null-filling —
so a live full-coach run on a 45-day window can legitimately hold far fewer nights. The current
`readiness.json` is one: `"nights": 23`, `"mode": "full-coach"`. That is the pull working, not
the pull failing.

**The suite count was 13 and is not 13.** `node scripts/test_coach_v2.mjs` currently runs 21
assertions and prints `ALL V2 CHECKS PASSED ✅` — the 25 Jul 2026 E2E audit added the
convergence-isolation guards and the V2-5b negative case (anchor alone must be AMBER, not RED).
Any number written here rots on the next audit, so **read it live, never from this line**:
`node scripts/test_coach_v2.mjs; echo "exit=$?"`.

**A second proof this paragraph never knew about:** `oura_coach.mjs` grew its own selftest —
`node scripts/oura_coach.mjs selftest` — a bank of dormant-safe regression checks, one per E2E
audit finding, no network and no credentials (scratch files go to the OS temp dir). It prints
`ALL CHECKS PASSED` or names the failures; no count is written here for the same reason the 13
above rotted. Both suites are in the squad lane and run together: `npm run squad:selftest`.

The legacy-RED → v2-GREEN flip is the one clause of the original paragraph that survives
intact, and it is still checkable in one line — `node scripts/test_coach_v2.mjs | grep "LEGACY says"`
→ `LEGACY says: RED | V2 says: GREEN`.

"Container can't reach his Oura account" was a statement about the build sandbox of 10 Jul
2026, not about this machine. It is now moot: the credentials live at
`scripts/oura_tokens.json` + `scripts/oura_secrets.json`, present here and tracked by nothing —
`git ls-files | grep -i oura` returns only `scripts/oura_auth.mjs` and `scripts/oura_coach.mjs`,
i.e. the two credential files are on disk and gitignored, exactly as the public-repo rule
requires.)
