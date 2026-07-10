import { analyze, analyzeLegacy, brief } from "./oura_coach.mjs";

// Nikhil's MEDICATED baseline (his "normal", not illness): meds elevate RHR
// (~62) + suppress HRV (~35); temp/RR/SpO2 normal; sleep ~6.8h; deep ~1.5h,
// REM ~1.7h. Now WITH Oura's own baseline-normalized readiness contributors.
function baseline(n, over = {}) {
  const days = [];
  const start = new Date("2026-05-25");
  for (let i = 0; i < n; i++) {
    const d = new Date(start.getTime() + i * 864e5);
    days.push({
      day: d.toISOString().slice(0, 10),
      readiness: 82 + (i % 5),
      tempDev: 0.0 + (i % 3) * 0.05, tempTrend: 0.0,
      hrv: 34 + (i % 6), rhr: 61 + (i % 3), rr: 15.5 + (i % 2) * 0.2,
      deep: 5400 + (i % 4) * 200, rem: 6000 + (i % 5) * 200,
      light: 12000, awake: 1500,
      totalSleep: 24600 + (i % 6) * 300,           // ~6.8h (his real range, NOT 8h)
      efficiency: 88 + (i % 4), latency: 700,
      bedEnd: d.toISOString().slice(0, 10) + "T07:00:00+05:30",
      resilience: ["solid", "strong", "solid", "adequate"][i % 4],
      spo2: 96 + (i % 2), bdi: 3 + (i % 3),
      steps: 5000, inactivityAlerts: 4, vo2max: 42, vascularAge: 30,
      // Oura's own 0-100 baseline-normalized contributors (healthy medicated)
      c_sleepBalance: 78 + (i % 5), c_previousNight: 74 + (i % 6),
      c_recoveryIndex: 70 + (i % 4), c_bodyTemp: 90 + (i % 3),
      c_hrvBalance: 55 + (i % 5), c_restingHr: 60 + (i % 4),
      c_activityBalance: 70 + (i % 4), c_prevDayActivity: 60 + (i % 5),
      c_sleepRegularity: 72 + (i % 4),
      ...over,
    });
  }
  return days;
}
function withLast(nights, patch) { const c = nights.map((x) => ({ ...x })); c[c.length - 1] = { ...c[c.length - 1], ...patch }; return c; }
// force resilience null across ALL nights (mimics dev-mode where daily_resilience 401s)
function noResilience(nights) { return nights.map((x) => ({ ...x, resilience: null })); }

const P = (t) => console.log("\n" + "=".repeat(74) + "\n" + t + "\n" + "=".repeat(74));
let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log("   ❌ ASSERT FAILED: " + msg); } else console.log("   ✓ " + msg); };

// ---------------------------------------------------------------------------
// BUG #1 — GREEN must be reachable WITHOUT resilience (dev-mode 401)
// ---------------------------------------------------------------------------
P("V2-1 — GREEN by DEFAULT even with resilience UNAVAILABLE (bug #1 fix)");
let a = analyze(noResilience(baseline(45)));
console.log(brief(a));
check(a.verdict === "GREEN", "GREEN reached with resilience=null (was structurally impossible in legacy)");
check(a.signals.resilience_available === false, "resilience correctly flagged unavailable");

// ---------------------------------------------------------------------------
// BUG #2 — his ACTUAL 2026-07-10 night on a HEALTHY baseline.
//   legacy fires RED off readiness 65<70; v2 must NOT (single dip, trends fine)
// ---------------------------------------------------------------------------
P("V2-2 — REAL 07-10 numbers on healthy baseline: legacy RED vs v2 (bug #2)");
const night0710 = {
  day: "2026-07-10", readiness: 65,
  deep: 2988, rem: 3960, totalSleep: 19548, efficiency: 85, latency: 1170,
  tempDev: 0.06, tempTrend: null, hrv: 26, rhr: 75, rr: 15.125,
  spo2: 96.353, bdi: 30, bedEnd: "2026-07-10T10:06:00+05:30",
  c_sleepBalance: 62, c_previousNight: 58, c_recoveryIndex: 55,
};
// his REAL medicated baseline from readiness.json: rhr_baseline 76.4, hrv_60d 22.7
// (on 07-10 his rhr 75 was BELOW baseline + hrv not suppressed -> NO HR flag ->
//  legacy med-gate did NOT fire -> the readiness<70 RED stuck. This reproduces it.)
let base0710 = noResilience(baseline(45, { rhr: 76, hrv: 23 }));   // dev-mode: resilience null
let n2 = withLast(base0710, night0710);
let legacy2 = analyzeLegacy(n2);
let v2_2 = analyze(n2);
console.log("LEGACY says:", legacy2.verdict, "| V2 says:", v2_2.verdict);
console.log(brief(v2_2));
check(legacy2.verdict === "RED", "legacy reproduces the FALSE RED (readiness 65<70)");
check(v2_2.verdict !== "RED", "v2 does NOT call RED on a single-day dip with healthy trends");
check(v2_2.tiers.high_confidence.sleep_architecture_trend.collapse === false, "no sleep-architecture collapse (deep/REM 7d holding)");

// ---------------------------------------------------------------------------
// BUG #3 — same 07-10 night but on a genuinely SLEEP-SHORT 2 weeks (~5.6h).
//   legacy debt is inflated vs 8h; v2 debt is vs his OWN ~6.8h + calls AMBER.
// ---------------------------------------------------------------------------
P("V2-3 — sleep genuinely short 2wks: legacy 8h-debt vs v2 personal-debt (bug #3)");
let shortBase = noResilience(baseline(45));
for (let i = 31; i < 45; i++) {                     // last 14 nights ~5.6h, sleep_balance low
  shortBase[i] = { ...shortBase[i], totalSleep: 20200, c_sleepBalance: 44 };
}
let n3 = withLast(shortBase, night0710);
let legacy3 = analyzeLegacy(n3);
let v2_3 = analyze(n3);
console.log(`LEGACY debt(vs 8h): ${legacy3.periodization.sleep_debt_h_14d}h  ->  ${legacy3.verdict}`);
console.log(`V2 debt(vs personal ~${v2_3.periodization.personal_sleep_need_h}h): ${v2_3.periodization.sleep_debt_h_14d_vs_personal}h  ->  ${v2_3.verdict}`);
console.log(brief(v2_3));
check(v2_3.periodization.sleep_debt_h_14d_vs_personal < legacy3.periodization.sleep_debt_h_14d, "v2 personal-baseline debt is smaller (not 8h-inflated)");
check(v2_3.verdict === "AMBER", "v2 calls AMBER (sleep-first) on a REAL sustained shortfall — honest, not RED");
check(v2_3.verdict !== "RED", "still not RED — sleep short but architecture/resilience not collapsed");

// ---------------------------------------------------------------------------
// MED-CONFOUND — HR-only alarm + temp dev, everything clean -> v2 GREEN
//   (temp is now low-confidence; HR/HRV/temp can NEVER escalate alone)
// ---------------------------------------------------------------------------
P("V2-4 — HR-only + temp deviation, clean otherwise -> v2 stays GREEN");
let v2_4 = analyze(noResilience(withLast(baseline(45), { readiness: 66, rhr: 74, hrv: 20, tempDev: 0.45 })));
console.log(brief(v2_4));
check(v2_4.verdict === "GREEN", "GREEN — HR/HRV/temp are low-confidence, cannot drive the verdict");
check(v2_4.tiers.low_confidence_med_informational.length >= 1, "low-confidence signals surfaced as INFO only");

// ---------------------------------------------------------------------------
// GENUINE RED — sustained deep+REM COLLAPSE + resilience FALLING (convergence)
// ---------------------------------------------------------------------------
P("V2-5 — sustained deep+REM collapse + resilience falling -> genuine RED");
let n5 = baseline(45).map((x) => ({ ...x }));
for (let i = 34; i < 45; i++) {                     // last 11 nights: architecture collapses
  n5[i] = { ...n5[i], deep: 2400, rem: 2600, c_sleepBalance: 40,
            resilience: i > 41 ? "limited" : (i > 37 ? "adequate" : "solid") };
}
let v2_5 = analyze(n5);
console.log(brief(v2_5));
check(v2_5.verdict === "RED", "RED fires ONLY on sustained multi-day convergence");
check(v2_5.tiers.high_confidence.sleep_architecture_trend.collapse === true, "deep+REM collapse detected as the anchor axis");

// ---------------------------------------------------------------------------
// SINGLE-NIGHT collapse must NOT be RED (only sustained trends count)
// ---------------------------------------------------------------------------
P("V2-6 — ONE night of deep+REM collapse -> NOT RED (single-day guard)");
let v2_6 = analyze(noResilience(withLast(baseline(45), { deep: 1800, rem: 1900, readiness: 60 })));
console.log("V2 says:", v2_6.verdict);
check(v2_6.verdict !== "RED", "one bad night cannot trigger RED");

// ---------------------------------------------------------------------------
// SAFETY preserved — 3 sustained concerning nights -> doctor referral (v2)
// ---------------------------------------------------------------------------
P("V2-7 — 3 sustained concerning nights -> DOCTOR REFERRAL preserved");
let n7 = baseline(45).map((x) => ({ ...x }));
for (const i of [42, 43, 44]) n7[i] = { ...n7[i], tempDev: 0.6, rr: 17.8, spo2: 87 };
let v2_7 = analyze(n7);
console.log(brief(v2_7));
check(v2_7.safety.refer_doctor === true, "doctor-referral safety net still fires");
check(!JSON.stringify(v2_7).toLowerCase().includes("increase your") &&
      !JSON.stringify(v2_7).toLowerCase().includes("your dose"), "zero medication advice anywhere in output");

console.log("\n" + "=".repeat(74));
console.log(fails === 0 ? "ALL V2 CHECKS PASSED ✅" : `${fails} CHECK(S) FAILED ❌`);
console.log("=".repeat(74));
process.exit(fails === 0 ? 0 : 1);
