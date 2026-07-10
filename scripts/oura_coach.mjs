// ============================================================================
// oura_coach.mjs  ·  ARSENAL AI FC — THE GOALKEEPER (Oura cognitive coach)
// ----------------------------------------------------------------------------
// DETERMINISTIC. Zero LLM tokens. Pure code + rolling baselines.
//
// v2 — RECALIBRATED per MASTERPLAN §12 (the Governor). GREEN is the DEFAULT for
// a thriving grinder. The verdict is CONFIDENCE-TIERED and CONVERGENCE-GATED,
// NOT a raw readiness threshold:
//   • HIGH-confidence signals drive the verdict: sleep-architecture TRENDS
//     (deep+REM, multi-day), resilience trend, and sleep-vs-personal-baseline
//     (via Oura's own baseline-normalized `sleep_balance` contributor).
//   • LOW-confidence / med-confounded signals (RHR, HRV, temperature) are
//     surfaced as INFORMATION only — they can NEVER, on their own, produce
//     AMBER or RED. (methylphenidate + caffeine + aripiprazole + venlafaxine
//     elevate RHR / suppress HRV as a normal baseline effect.)
//   • RED is RARE: only a SUSTAINED multi-day convergence — deep+REM collapse
//     (the anchor) AND a second high/clean axis. A single night, a single low
//     readiness number, or a lone confounded reading can NEVER trigger RED.
//   • Sleep "debt" is measured against Nikhil's OWN baseline (~6–7h), never a
//     textbook 8h.
//
// LAYERING (Nikhil's principle — never replace, always layer): the pre-§12
// engine is frozen verbatim as `analyzeLegacy` and stays in the file for
// reference / diffing. `analyze` below is the RECALIBRATED plan of record and
// is what main() runs.
//
// MEDICAL BOUNDARY (non-negotiable): this is a DATA-ANALYST, not a prescriber.
//   Nikhil's meds are used ONLY to interpret his data (avoid mislabelling a
//   medicated baseline as illness). It NEVER comments on, optimises, or adjusts
//   medication. Sustained concerning physiology => DOCTOR-REFERRAL flag, full
//   stop. Any mood/agitation flag (NOT wired here, by decision) would route to
//   a "show your doctor" report listing akathisia as a differential — never
//   self-interpreted. Hard block on any dose/diagnosis language.
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const TOKENS_FILE = join(__dirname, "oura_tokens.json");
const SECRETS_FILE = join(__dirname, "oura_secrets.json");
const INTAKE_FILE = join(STATE_DIR, "intake_log.json");
const OUT_FILE    = join(STATE_DIR, "readiness.json");
const BASE = "https://api.ouraring.com/v2/usercollection";

// ----------------------------------------------------------------------------
// CONFIG — legacy engine (kept for analyzeLegacy). Evidence-informed starts.
// ----------------------------------------------------------------------------
const CFG = {
  windows:      { hrv7: 7, hrv60: 60, rhr: 21, rr: 21, arch: 14, week: 7, month: 28 },
  sleepNeedSec: 8 * 3600,          // legacy only — REPLACED by personal baseline in v2
  swcK:         0.5,
  green:        { readiness: 85, tempDev: 0.3, rhrOver: 3 },
  amber:        { readiness: 70 },
  flags:        { tempRed: 0.5, tempAmber: 0.3, rhrOver: 5, rrOver: 1.5, spo2Low: 90, bdiHigh: 40 },
  spo2Clin:     88,
  sleepDebtCapH:5,
  deload:       { hrvDropPct: 5, days: 3, rhrOver: 5 },
  lateHour:     16,
};

// ----------------------------------------------------------------------------
// CONFIG — v2 recalibrated engine (§12).
// ----------------------------------------------------------------------------
const V2 = {
  win: { arch: 7, archBase: 28, sleepBase: 28, week: 7, month: 28, hrv7: 7, hrv60: 60, rhr: 21, rr: 21 },
  archLowFrac:    0.85,   // 7d mean below 85% of 28d baseline = a sustained-low trend
  sleepShortFrac: 0.90,   // 7d mean sleep below 90% of his OWN median = shortfall
  sleepBalanceLow:55,     // Oura sleep_balance (0-100) below this = long-term sleep concern
  shortNightFrac: 0.85,   // single-night total sleep below 85% of personal need = "short night"
  rrSustainOver:  1.5,    // RR over baseline to count as a clean deviation
  rrSustainDays:  4,      // ...sustained this many days to corroborate
  lowConf:       { rhrOver: 5, tempDev: 0.3 },
  fallbackNeedH:  6.5,    // if we can't yet compute a personal median, assume 6.5h (his range), NOT 8h
};

// Nikhil's MEDICATION PROFILE — interpretation confounds ONLY. No advice, ever.
const MED = {
  hrLowConfidence: true,
  note: "HR signals (RHR/HRV) + single-night temperature are medication-influenced "
      + "(methylphenidate + caffeine + aripiprazole + venlafaxine) -> treated as "
      + "LOW-confidence and can never drive a verdict alone. Judged only vs Nikhil's "
      + "own medicated baseline, never textbook. Sleep-architecture trends, resilience, "
      + "and sleep-vs-own-baseline carry the weight. This tool never comments on "
      + "medication — see your doctor for that.",
  boundary: "Mood/agitation signal is intentionally NOT wired (by decision). If it "
      + "ever were, any such flag would route to a 'show your doctor' report listing "
      + "akathisia as a differential — never self-interpreted. Hard block on dose/diagnosis.",
};

// ----------------------------------------------------------------------------
// small stats helpers (null-guarded — Oura fields can legitimately be null)
// ----------------------------------------------------------------------------
const num = (x) => (typeof x === "number" && !Number.isNaN(x) ? x : null);
const clean = (a) => a.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
const mean = (a) => { const c = clean(a); return c.length ? c.reduce((s, x) => s + x, 0) / c.length : null; };
const median = (a) => { const c = clean(a).slice().sort((x, y) => x - y); if (!c.length) return null; const m = Math.floor(c.length / 2); return c.length % 2 ? c[m] : (c[m - 1] + c[m]) / 2; };
const sd = (a) => {
  const c = clean(a); if (c.length < 2) return null;
  const m = mean(c); return Math.sqrt(c.reduce((s, x) => s + (x - m) ** 2, 0) / (c.length - 1));
};
const last = (a, n) => a.slice(-n);
const round = (x, d = 1) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const hoursFromSec = (s) => (s === null ? null : round(s / 3600, 2));
const RES_RANK = { limited: 0, adequate: 1, solid: 2, strong: 3, exceptional: 4 };

// ============================================================================
// ============  RECALIBRATED v2 ENGINE (§12) — PLAN OF RECORD  ================
// ============================================================================
// analyze(nights, intakeLog).  PURE (no network) => fully testable.
//   nights: array (oldest->newest) of per-day merged records (see fetchNights).
export function analyze(nights, intakeLog = {}) {
  if (!nights || nights.length === 0) return { ok: false, error: "no nights of data" };
  const t = nights[nights.length - 1];         // today (latest night)
  const hist = nights;
  const N = hist.length;
  const mode = N < 14 ? "baseline-building" : "full-coach";
  const haveBaseline = N >= 14;                 // RED needs a real baseline to assert a trend

  const series = (k) => hist.map((d) => d[k]);
  const meanLastN = (k, n) => mean(last(series(k), n));

  // ---- HIGH CONFIDENCE #1: SLEEP ARCHITECTURE TREND (deep+REM, multi-day) ---
  const deep7 = meanLastN("deep", V2.win.arch), deepBase = meanLastN("deep", V2.win.archBase);
  const rem7  = meanLastN("rem",  V2.win.arch), remBase  = meanLastN("rem",  V2.win.archBase);
  const deepLowTrend = deep7 !== null && deepBase !== null && deep7 < deepBase * V2.archLowFrac;
  const remLowTrend  = rem7  !== null && remBase  !== null && rem7  < remBase  * V2.archLowFrac;
  const archCollapse = deepLowTrend && remLowTrend;     // BOTH sustained-low = anchor RED axis
  const archPartial  = (deepLowTrend || remLowTrend) && !archCollapse;

  // ---- HIGH CONFIDENCE #2: SLEEP vs PERSONAL BASELINE (fixes 8h bug) --------
  // Primary = Oura's own `sleep_balance` contributor (2wk vs 2mo, already
  // personal-baseline-normalized). Secondary = his OWN median total sleep.
  const sleepBal7      = meanLastN("c_sleepBalance", V2.win.week);
  const ownSleepMedSec = median(last(series("totalSleep"), V2.win.sleepBase));
  const personalNeedSec = ownSleepMedSec !== null ? ownSleepMedSec : V2.fallbackNeedH * 3600;
  const sleep7 = meanLastN("totalSleep", V2.win.week);
  const sleepShortTrend =
      (sleepBal7 !== null && sleepBal7 < V2.sleepBalanceLow) ||
      (sleep7 !== null && sleep7 < personalNeedSec * V2.sleepShortFrac);

  // ---- HIGH CONFIDENCE #3: RESILIENCE TREND (when available; never blocks GREEN) --
  const resSeq = last(series("resilience"), V2.win.month);
  const resVals = clean(resSeq.map((s) => RES_RANK[s]));
  const resAvailable = resVals.length > 0;
  const resFalling = resTrendFalling(resSeq);           // false if unavailable

  // ---- CLEAN CORROBORATION (moderate; sustained RR only) -------------------
  const rrBase = meanLastN("rr", V2.win.rr);
  let rrSustainedDays = 0;
  for (let i = N - 1; i >= Math.max(0, N - 7); i--) {
    const d = hist[i];
    if (num(d.rr) !== null && rrBase !== null && d.rr > rrBase + V2.rrSustainOver) rrSustainedDays++; else break;
  }
  const cleanCorrob = rrSustainedDays >= V2.rrSustainDays;

  // ---- LOW CONFIDENCE (med-confounded): INFORMATION ONLY, never verdict-driving --
  const hrv7 = meanLastN("hrv", V2.win.hrv7), hrv60 = meanLastN("hrv", V2.win.hrv60);
  const hrvSD = sd(last(series("hrv"), V2.win.hrv60)); const SWC = hrvSD !== null ? CFG.swcK * hrvSD : null;
  const rhrBase = meanLastN("rhr", V2.win.rhr);
  const lowConfNotes = [];
  if (hrv7 !== null && hrv60 !== null && SWC !== null && hrv7 < hrv60 - SWC)
    lowConfNotes.push("HRV 7d below your own baseline — medication-influenced, low weight (not counted).");
  if (num(t.rhr) !== null && rhrBase !== null && t.rhr > rhrBase + V2.lowConf.rhrOver)
    lowConfNotes.push(`RHR +${round(t.rhr - rhrBase)}bpm vs baseline — medication-influenced, low weight (not counted).`);
  if (num(t.tempDev) !== null && Math.abs(t.tempDev) > V2.lowConf.tempDev)
    lowConfNotes.push(`temp dev ${t.tempDev > 0 ? "+" : ""}${round(t.tempDev)}°C — single-signal, low weight (safety scan handles sustained temp separately).`);

  // ---- INTAKE / late-dose explanation (kept) -------------------------------
  const todayIntake = intakeLog[t.day] || {};
  const lateStimulant = lateDose(todayIntake);
  const remLowToday  = num(t.rem)  !== null && remBase  !== null && t.rem  < remBase * 0.85;
  const highLatency  = num(t.latency) !== null && t.latency > 30 * 60;
  const remExplainedByMeds = (remLowToday || highLatency) && lateStimulant;

  // ---- CONVERGENCE GATE (§12 S3) -------------------------------------------
  // archCollapse is the ANCHOR. RED only if it converges with >=1 more axis.
  const highAxes = [archCollapse, resFalling, sleepShortTrend].filter(Boolean).length + (cleanCorrob ? 1 : 0);
  let verdict = "GREEN", ceiling = "HIGH";

  if (haveBaseline && archCollapse && (resFalling || sleepShortTrend || cleanCorrob)) {
    verdict = "RED"; ceiling = "LOW";                    // sustained convergence — rare
  } else if (archCollapse || archPartial || resFalling || sleepShortTrend || highAxes >= 2) {
    verdict = "AMBER"; ceiling = "MODERATE";             // one sustained high-confidence deviation
  } else {
    verdict = "GREEN"; ceiling = "HIGH";                 // DEFAULT — grind honored, no resilience needed
  }

  // ---- HARD GUARD: a lone confounded/single-day signal can never escalate ---
  // Every escalation above is a multi-day trend by construction. This makes
  // the invariant explicit: if the only "concern" is low-confidence (HR/HRV/
  // temp) or a single bad night, the verdict is GREEN.
  const anyRealAxis = archCollapse || archPartial || resFalling || sleepShortTrend || cleanCorrob;
  if (verdict !== "GREEN" && !anyRealAxis) { verdict = "GREEN"; ceiling = "HIGH"; }

  // ---- WORK-TYPE OVERLAY (sleep architecture -> cognitive work type) -------
  const workType = [];
  const deepGood = num(t.deep) !== null && deepBase !== null && t.deep >= deepBase * 0.9;
  const remGood  = num(t.rem)  !== null && remBase  !== null && t.rem  >= remBase  * 0.9;
  const shortNight = num(t.totalSleep) !== null && t.totalSleep < personalNeedSec * V2.shortNightFrac;
  if ((!deepGood && !remGood) || shortNight) {
    workType.push("RETRIEVE/REVIEW known material (encoding capacity reduced) — favour consolidation over first-exposure learning");
  } else {
    if (deepGood) workType.push("ENCODE: front-load new factual/declarative learning + memorisation");
    if (remGood)  workType.push("SYNTHESISE: creative synthesis, architecture / system-design, connecting concepts");
    if (workType.length === 0) workType.push("MIXED: balanced review + moderate new material");
  }
  if (num(t.spo2) !== null && t.spo2 < CFG.flags.spo2Low)
    workType.push("Expect blunted sustained attention -> more breaks, defer attention-heavy tasks");

  // ---- CIRCADIAN TIMING ----------------------------------------------------
  const timing = circadian(t.bedEnd);

  // ---- PERIODIZATION (sleep-debt vs PERSONAL baseline, not 8h) -------------
  const periodization = periodizeV2(hist, { personalNeedSec, sleepShortTrend, sleepBal7 });

  // ---- SAFETY (unchanged): sustained concerning physiology => doctor referral --
  const safety = safetyScan(hist, rhrBase, rrBase, CFG);

  // ---- NOCEBO / ORTHOSOMNIA guardrail --------------------------------------
  const guardrail = "Read this once, act on it, then close the app. Coach on TRENDS, not a single day. "
    + "If you feel great, a mediocre score DOWNGRADES the plan — it does not abort it (nocebo guard).";

  const verdictDriver = verdict === "RED"
    ? "sustained multi-day convergence: sleep-architecture collapse (deep+REM) + a second axis"
    : verdict === "AMBER"
      ? "one sustained HIGH-confidence deviation (or two mixed) — not a red day"
      : "no sustained HIGH-confidence deviation — GREEN by default (the grind is honored)";

  return {
    ok: true,
    engine: "v2-recalibrated",
    day: t.day,
    mode,
    nights: N,
    verdict, ceiling,
    workType,
    timing,
    signals: {
      readiness_raw: num(t.readiness),  // Oura's own composite — shown for context, NOT a verdict trigger
      // HIGH-confidence
      deep_7d_h: hoursFromSec(deep7), deep_base_h: hoursFromSec(deepBase),
      rem_7d_h: hoursFromSec(rem7), rem_base_h: hoursFromSec(remBase),
      total_sleep_today_h: hoursFromSec(t.totalSleep),
      total_sleep_7d_h: hoursFromSec(sleep7),
      personal_sleep_need_h: round(personalNeedSec / 3600, 2),
      oura_sleep_balance_7d: round(sleepBal7),
      resilience_today: t.resilience, resilience_available: resAvailable,
      // contributors (Oura's own 0-100 baseline-normalized sub-scores)
      contributors_today: {
        sleep_balance: num(t.c_sleepBalance), previous_night: num(t.c_previousNight),
        recovery_index: num(t.c_recoveryIndex), body_temperature: num(t.c_bodyTemp),
        hrv_balance: num(t.c_hrvBalance), resting_heart_rate: num(t.c_restingHr),
        activity_balance: num(t.c_activityBalance), previous_day_activity: num(t.c_prevDayActivity),
        sleep_regularity: num(t.c_sleepRegularity),
      },
      // LOW-confidence (informational)
      hrv_today: num(t.hrv), hrv_7d: round(hrv7), hrv_60d: round(hrv60), SWC: round(SWC, 2),
      rhr: num(t.rhr), rhr_baseline: round(rhrBase),
      rr: num(t.rr), rr_baseline: round(rrBase),
      temp_dev: num(t.tempDev), temp_trend: num(t.tempTrend),
      efficiency: num(t.efficiency), latency_min: t.latency !== null ? round(t.latency / 60) : null,
      spo2: num(t.spo2), bdi: num(t.bdi), vo2max: num(t.vo2max), vascular_age: num(t.vascularAge),
    },
    tiers: {
      high_confidence: {
        sleep_architecture_trend: { deep_low: deepLowTrend, rem_low: remLowTrend, collapse: archCollapse, partial: archPartial },
        sleep_vs_personal_baseline: { short: sleepShortTrend, oura_sleep_balance_7d: round(sleepBal7) },
        resilience: { available: resAvailable, falling: resFalling },
      },
      clean_corroboration: { rr_sustained_days: rrSustainedDays, fired: cleanCorrob },
      low_confidence_med_informational: lowConfNotes,
      verdict_driver: verdictDriver,
    },
    medication: {
      hr_low_confidence: MED.hrLowConfidence,
      rem_explained_by_late_dose: remExplainedByMeds,
      note: MED.note,
      boundary: MED.boundary,
      intake_today: todayIntake,
    },
    periodization,
    safety,
    guardrail,
  };
}

// ---- v2 periodization: sleep-debt vs HIS OWN baseline, never textbook 8h ----
function periodizeV2(hist, ctx) {
  const need = ctx.personalNeedSec;
  const dbt = last(hist, 14).map((d) => (num(d.totalSleep) !== null ? need - d.totalSleep : 0));
  const debtH = round(dbt.reduce((s, x) => s + Math.max(0, x), 0) / 3600);
  const wkReadiness = round(mean(last(hist, 7).map((d) => d.readiness)));  // reported, NOT verdict-driving
  const sleepBal7 = round(ctx.sleepBal7);
  const note = ctx.sleepShortTrend
    ? `Running below your OWN sleep baseline (~${round(need / 3600, 1)}h) this week — worth banking sleep. (Measured vs YOUR normal, not a textbook 8h.)`
    : `Sleep tracking near your own baseline (~${round(need / 3600, 1)}h). Load OK — coach on trends, not one night.`;
  return {
    sleep_debt_h_14d_vs_personal: debtH,
    personal_sleep_need_h: round(need / 3600, 2),
    oura_sleep_balance_7d: sleepBal7,
    week_mean_readiness: wkReadiness,
    note,
  };
}

// ============================================================================
// ============  LEGACY ENGINE (FROZEN — pre-§12, for reference/diff)  =========
// ============================================================================
export function analyzeLegacy(nights, intakeLog = {}) {
  if (!nights || nights.length === 0) {
    return { ok: false, error: "no nights of data" };
  }
  const t = nights[nights.length - 1];               // today (latest night)
  const hist = nights;

  const hrvSeries = hist.map((d) => d.hrv);
  const hrv7  = mean(last(hrvSeries, CFG.windows.hrv7));
  const hrv60 = mean(last(hrvSeries, CFG.windows.hrv60));
  const hrvSD = sd(last(hrvSeries, CFG.windows.hrv60));
  const SWC   = hrvSD !== null ? CFG.swcK * hrvSD : null;
  const rhrBase  = mean(last(hist.map((d) => d.rhr),  CFG.windows.rhr));
  const rrBase   = mean(last(hist.map((d) => d.rr),   CFG.windows.rr));
  const deepBase = mean(last(hist.map((d) => d.deep), CFG.windows.arch));
  const remBase  = mean(last(hist.map((d) => d.rem),  CFG.windows.arch));

  const nightsCount = hist.length;
  const baselineMode = nightsCount < 14 ? "baseline-building" : "full-coach";

  const flagsClean = [];
  const flagsHR = [];
  if (num(t.tempDev) !== null && t.tempDev > CFG.flags.tempRed) flagsClean.push(`temp +${round(t.tempDev)}C`);
  if (num(t.rr) !== null && rrBase !== null && t.rr > rrBase + CFG.flags.rrOver) flagsClean.push(`resp +${round(t.rr - rrBase)}/min`);
  if (num(t.spo2) !== null && t.spo2 < CFG.flags.spo2Low) flagsClean.push(`SpO2 ${round(t.spo2)}%`);
  if (num(t.bdi) !== null && t.bdi > CFG.flags.bdiHigh) flagsClean.push(`BDI ${round(t.bdi)}`);
  if (num(t.rhr) !== null && rhrBase !== null && t.rhr > rhrBase + CFG.flags.rhrOver) flagsHR.push(`RHR +${round(t.rhr - rhrBase)}bpm`);
  if (hrv7 !== null && hrv60 !== null && SWC !== null && hrv7 < hrv60 - SWC) flagsHR.push(`HRV 7d below SWC`);

  let hrvSuppressedDays = 0;
  for (let i = hist.length - 1; i >= Math.max(0, hist.length - 6); i--) {
    const w7 = mean(hist.slice(Math.max(0, i - 6), i + 1).map((d) => d.hrv));
    if (w7 !== null && hrv60 !== null && SWC !== null && w7 < hrv60 - SWC) hrvSuppressedDays++;
    else break;
  }

  const todayIntake = intakeLog[t.day] || {};
  const lateStimulant = lateDose(todayIntake);
  const remLow  = num(t.rem)  !== null && remBase  !== null && t.rem  < remBase * 0.85;
  const deepLow = num(t.deep) !== null && deepBase !== null && t.deep < deepBase * 0.85;
  const highLatency = num(t.latency) !== null && t.latency > 30 * 60;
  const remExplainedByMeds = (remLow || highLatency) && lateStimulant;

  let verdict = "AMBER", ceiling = "MODERATE";
  const R = num(t.readiness);
  const resOK = ["solid", "strong", "exceptional"].includes(t.resilience);
  const resLimited = t.resilience === "limited";

  if (R !== null && R >= CFG.green.readiness
      && num(t.tempDev) !== null && t.tempDev <= CFG.green.tempDev
      && resOK && flagsClean.length === 0) {
    verdict = "GREEN"; ceiling = "HIGH";
  } else if ((R !== null && R < CFG.amber.readiness) || flagsClean.length >= 2
             || resLimited || hrvSuppressedDays >= 2) {
    verdict = "RED"; ceiling = "LOW";
  } else {
    verdict = "AMBER"; ceiling = "MODERATE";
  }

  let medGateApplied = false;
  if (verdict === "RED" && flagsClean.length === 0 && !resLimited && flagsHR.length > 0) {
    verdict = "AMBER"; ceiling = "MODERATE"; medGateApplied = true;
  }

  const workType = [];
  const encodingReduced =
    (deepLow && remLow) ||
    (num(t.totalSleep) !== null && t.totalSleep < CFG.sleepNeedSec * 0.8) ||
    (num(t.efficiency) !== null && t.efficiency < 80);
  if (encodingReduced) {
    workType.push("RETRIEVE/REVIEW known material (encoding capacity reduced ~up to 40%) — not first-exposure learning");
  } else {
    if (num(t.deep) !== null && deepBase !== null && t.deep >= deepBase)
      workType.push("ENCODE: front-load new factual/declarative learning + memorisation");
    if (num(t.rem) !== null && remBase !== null && t.rem >= remBase)
      workType.push("SYNTHESISE: creative synthesis, architecture / system-design, connecting concepts");
    if (workType.length === 0) workType.push("MIXED: balanced review + moderate new material");
  }
  const attentionBlunted = (num(t.bdi) !== null && t.bdi > CFG.flags.bdiHigh) ||
                           (num(t.spo2) !== null && t.spo2 < CFG.flags.spo2Low);
  if (attentionBlunted) workType.push("Expect blunted sustained attention -> more breaks, defer attention-heavy tasks");

  const timing = circadian(t.bedEnd);
  const periodization = periodize(hist, { hrv7, hrv60, rhrBase }, CFG);
  const safety = safetyScan(hist, rhrBase, rrBase, CFG);
  const guardrail = "Read this once, act on it, then close the app. Coach on TRENDS, not a single day. "
    + "If you feel great, a mediocre score DOWNGRADES the plan — it does not abort it (nocebo guard).";

  return {
    ok: true,
    engine: "legacy",
    day: t.day,
    mode: baselineMode,
    nights: nightsCount,
    verdict, ceiling,
    workType,
    timing,
    signals: {
      readiness: R,
      hrv_today: num(t.hrv), hrv_7d: round(hrv7), hrv_60d: round(hrv60), SWC: round(SWC, 2),
      hrv_suppressed_days: hrvSuppressedDays,
      rhr: num(t.rhr), rhr_baseline: round(rhrBase),
      rr: num(t.rr), rr_baseline: round(rrBase),
      temp_dev: num(t.tempDev), temp_trend: num(t.tempTrend),
      deep_h: hoursFromSec(t.deep), deep_base_h: hoursFromSec(deepBase),
      rem_h: hoursFromSec(t.rem), rem_base_h: hoursFromSec(remBase),
      total_sleep_h: hoursFromSec(t.totalSleep), efficiency: num(t.efficiency), latency_min: t.latency !== null ? round(t.latency / 60) : null,
      spo2: num(t.spo2), bdi: num(t.bdi), resilience: t.resilience,
      vo2max: num(t.vo2max), vascular_age: num(t.vascularAge),
    },
    flags: { clean: flagsClean, hr_low_confidence: flagsHR },
    medication: {
      hr_low_confidence: MED.hrLowConfidence,
      gate_applied: medGateApplied,
      rem_explained_by_late_dose: remExplainedByMeds,
      note: MED.note,
      intake_today: todayIntake,
    },
    periodization,
    safety,
    guardrail,
  };
}

// ----------------------------------------------------------------------------
// shared helpers (used by BOTH engines)
// ----------------------------------------------------------------------------
function lateDose(intake) {
  const items = [].concat(intake.caffeine || [], intake.stimulant || [], intake.methylphenidate || []);
  return items.some((h) => {
    const hr = parseInt(String(h).split(":")[0], 10);
    return !Number.isNaN(hr) && hr >= CFG.lateHour;
  });
}

function circadian(bedEnd) {
  let wake = 7;
  if (bedEnd) { const m = String(bedEnd).match(/T(\d{2}):(\d{2})/); if (m) wake = parseInt(m[1], 10) + parseInt(m[2], 10) / 60; }
  const fmt = (h) => { const hh = Math.floor(((h % 24) + 24) % 24); const mm = Math.round((h - Math.floor(h)) * 60); return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; };
  return {
    wake: fmt(wake),
    peak1: `${fmt(wake + 4)}–${fmt(wake + 7)}  (hardest adversarial work: mocks, timed system-design, novel problems)`,
    dip:   `${fmt(wake + 8)}–${fmt(wake + 9.5)}  (admin, email, easy review, MOVEMENT)`,
    peak2: `${fmt(wake + 10)}–${fmt(wake + 13)}  (second hard block)`,
    blocks: "~90-min deep-focus blocks; genuine non-screen break between; movement snack every 30–60 min",
  };
}

// legacy periodization (used only by analyzeLegacy — kept frozen)
function periodize(hist, b, cfg) {
  const dbtNights = last(hist, 14).map((d) => (num(d.totalSleep) !== null ? cfg.sleepNeedSec - d.totalSleep : 0));
  const debtSec = dbtNights.reduce((s, x) => s + Math.max(0, x), 0);
  const debtH = round(debtSec / 3600);
  const wk = last(hist, cfg.windows.week).map((d) => d.readiness);
  const wkReadiness = round(mean(wk));
  const m = last(hist, cfg.windows.month);
  const drift = (sel) => {
    if (m.length < 14) return null;
    const h1 = mean(m.slice(0, Math.floor(m.length / 2)).map(sel));
    const h2 = mean(m.slice(Math.floor(m.length / 2)).map(sel));
    return h1 !== null && h2 !== null ? round(h2 - h1, 2) : null;
  };
  const rhrDrift = drift((d) => d.rhr);
  const hrvDrift = drift((d) => d.hrv);
  const resSeq = last(hist, cfg.windows.month).map((d) => d.resilience);
  let hrvDropDays = 0;
  for (let i = hist.length - 1; i >= Math.max(0, hist.length - 6); i--) {
    const w = mean(hist.slice(Math.max(0, i - 6), i + 1).map((d) => d.hrv));
    if (w !== null && b.hrv60 !== null && w < b.hrv60 * (1 - cfg.deload.hrvDropPct / 100)) hrvDropDays++; else break;
  }
  const resFalling = resTrendFalling(resSeq);
  const rhrElevated = rhrDrift !== null && rhrDrift > 0.5;
  const mandatoryDeload = hrvDropDays >= cfg.deload.days && rhrElevated && resFalling;
  const progressionGreenLight = wkReadiness !== null && wkReadiness >= 80 &&
    (hrvDrift === null || hrvDrift >= 0) && ["solid", "strong", "exceptional"].includes(resSeq[resSeq.length - 1]);
  return {
    sleep_debt_h_14d: debtH,
    sleep_first_week: debtH > cfg.sleepDebtCapH,
    week_mean_readiness: wkReadiness,
    rhr_baseline_drift_28d: rhrDrift,
    hrv_baseline_drift_28d: hrvDrift,
    resilience_falling: resFalling,
    mandatory_deload: mandatoryDeload,
    progression_green_light: progressionGreenLight,
    note: mandatoryDeload
      ? "MANDATORY DELOAD: HRV suppressed + RHR baseline rising + resilience falling together. Take a deload week NOW, before symptoms."
      : (debtH > cfg.sleepDebtCapH
        ? `Sleep-debt ${debtH}h over 14d (> ${cfg.sleepDebtCapH}h) — cap load, extend sleep regardless of today's score.`
        : (progressionGreenLight ? "Green-light: you may add load next week." : "Hold current load; watch 28-day trends.")),
  };
}

function resTrendFalling(seq) {
  const vals = seq.map((s) => RES_RANK[s]).filter((x) => x !== undefined);
  if (vals.length < 4) return false;
  const h1 = mean(vals.slice(0, Math.floor(vals.length / 2)));
  const h2 = mean(vals.slice(Math.floor(vals.length / 2)));
  return h2 < h1 - 0.25;
}

// HARD SAFETY: >=3 consecutive days of >=2 CLEAN concerning signals => doctor referral.
function safetyScan(hist, rhrBase, rrBase, cfg) {
  let consecutive = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    const d = hist[i];
    let cleanFlags = 0;
    if (num(d.tempDev) !== null && d.tempDev > cfg.flags.tempRed) cleanFlags++;
    if (num(d.rr) !== null && rrBase !== null && d.rr > rrBase + cfg.flags.rrOver) cleanFlags++;
    if (num(d.spo2) !== null && d.spo2 <= cfg.spo2Clin) cleanFlags++;
    if (cleanFlags >= 2) consecutive++; else break;
  }
  const lowSpo2Persistent = last(hist, 5).filter((d) => num(d.spo2) !== null && d.spo2 <= cfg.spo2Clin).length >= 3;
  const referDoctor = consecutive >= 3 || lowSpo2Persistent;
  return {
    consecutive_concerning_days: consecutive,
    low_spo2_persistent: lowSpo2Persistent,
    refer_doctor: referDoctor,
    message: referDoctor
      ? "SEE A DOCTOR. Sustained concerning physiology (multi-day temp/respiratory/SpO2). This tool is not a diagnostician and will NOT suggest anything about medication or treatment — take this to your physician."
      : "No sustained red-flag physiology detected. (This tool never comments on medication; anything med-related is a doctor question.)",
  };
}

// ----------------------------------------------------------------------------
// human-readable morning brief (handles both v2 and legacy output shapes)
// ----------------------------------------------------------------------------
export function brief(a) {
  if (!a.ok) return `Coach could not run: ${a.error}`;
  const dot = { GREEN: "🟢", AMBER: "🟡", RED: "🔴" }[a.verdict];
  const L = [];
  const tag = a.engine === "v2-recalibrated" ? " [v2]" : (a.engine === "legacy" ? " [legacy]" : "");
  L.push(`${dot} THE GOALKEEPER${tag} — ${a.day}   [${a.mode}, ${a.nights} nights]`);
  L.push(`VERDICT: ${a.verdict}  ·  cognitive-load ceiling: ${a.ceiling}`);

  if (a.tiers) {
    L.push(`WHY: ${a.tiers.verdict_driver}`);
  } else if (a.medication && a.medication.gate_applied) {
    L.push(`  (note: an HR-only alarm was NOT counted as RED — medication elevates RHR/suppresses HRV; no clean corroboration.)`);
  }
  L.push("");
  L.push("WORK TYPE today:");
  a.workType.forEach((w) => L.push(`  • ${w}`));
  L.push("");
  L.push("TIMING (from your wake ~" + a.timing.wake + "):");
  L.push(`  peak 1  ${a.timing.peak1}`);
  L.push(`  dip     ${a.timing.dip}`);
  L.push(`  peak 2  ${a.timing.peak2}`);
  L.push(`  ${a.timing.blocks}`);
  L.push("");

  if (a.tiers) {
    const h = a.tiers.high_confidence;
    L.push("HIGH-confidence read:");
    L.push(`  sleep architecture (7d vs 28d): deep ${a.signals.deep_7d_h}h/${a.signals.deep_base_h}h · REM ${a.signals.rem_7d_h}h/${a.signals.rem_base_h}h${h.sleep_architecture_trend.collapse ? "  ⚠ COLLAPSE" : (h.sleep_architecture_trend.partial ? "  · partial dip" : "  · holding")}`);
    L.push(`  sleep vs YOUR baseline (~${a.signals.personal_sleep_need_h}h): 7d ${a.signals.total_sleep_7d_h}h · Oura sleep_balance ${a.signals.oura_sleep_balance_7d ?? "n/a"}${h.sleep_vs_personal_baseline.short ? "  ⚠ short" : "  · ok"}`);
    L.push(`  resilience: ${a.signals.resilience_available ? (a.signals.resilience_today || "n/a") + (h.resilience.falling ? "  ⚠ falling" : "  · steady") : "unavailable (dev-mode) — not counted, does NOT block GREEN"}`);
    if (a.tiers.low_confidence_med_informational.length) {
      L.push("");
      L.push("low-confidence (med-influenced — NOT counted toward the verdict):");
      a.tiers.low_confidence_med_informational.forEach((n) => L.push(`  · ${n}`));
    }
    if (a.medication.rem_explained_by_late_dose) L.push(`  · REM/latency dip today is explained by a LATE caffeine/stimulant dose — expected, not under-recovery.`);
  } else {
    if (a.flags && a.flags.clean.length) L.push(`⚠  clean flags: ${a.flags.clean.join(", ")}`);
    if (a.flags && a.flags.hr_low_confidence.length) L.push(`   (HR flags, low-confidence/med: ${a.flags.hr_low_confidence.join(", ")})`);
    if (a.medication && a.medication.rem_explained_by_late_dose) L.push(`   REM/latency dip today is explained by a LATE caffeine/stimulant dose — expected, NOT under-recovery. Not counted against you.`);
  }
  L.push("");
  L.push(`PERIODIZATION: ${a.periodization.note}`);
  if (a.periodization.sleep_debt_h_14d_vs_personal !== undefined) {
    L.push(`  sleep-debt(14d, vs your ~${a.periodization.personal_sleep_need_h}h): ${a.periodization.sleep_debt_h_14d_vs_personal}h  ·  wk readiness: ${a.periodization.week_mean_readiness}  ·  Oura sleep_balance(7d): ${a.periodization.oura_sleep_balance_7d ?? "n/a"}`);
  } else {
    L.push(`  sleep-debt(14d): ${a.periodization.sleep_debt_h_14d}h  ·  wk readiness: ${a.periodization.week_mean_readiness}  ·  RHR drift(28d): ${a.periodization.rhr_baseline_drift_28d}  ·  HRV drift(28d): ${a.periodization.hrv_baseline_drift_28d}`);
  }
  L.push("");
  if (a.safety.refer_doctor) { L.push(`🚑 ${a.safety.message}`); L.push(""); }
  L.push(a.guardrail);
  return L.join("\n");
}

// ----------------------------------------------------------------------------
// NETWORK — fetch ~lookback days across all endpoints, merge by day.
// ----------------------------------------------------------------------------
function loadTokens() {
  if (!existsSync(TOKENS_FILE)) throw new Error(`No token file. Run:  node oura_auth.mjs   (creates ${TOKENS_FILE})`);
  return JSON.parse(readFileSync(TOKENS_FILE, "utf8"));
}
async function refreshToken(tok) {
  if (!tok.refresh_token || !existsSync(SECRETS_FILE)) return null;
  const s = JSON.parse(readFileSync(SECRETS_FILE, "utf8"));
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: s.client_id, client_secret: s.client_secret });
  const r = await fetch("https://api.ouraring.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) return null;
  const nt = await r.json();
  nt.expires_at = Date.now() + (nt.expires_in || 86400) * 1000;
  writeFileSync(TOKENS_FILE, JSON.stringify(nt, null, 2));
  return nt.access_token;
}
async function pull(ep, token, start, end) {
  const url = `${BASE}/${ep}?start_date=${start}&end_date=${end}`;
  const out = []; let next = url;
  for (let i = 0; i < 20 && next; i++) {
    const r = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      if (r.status === 401) { const e = new Error(`${ep} -> 401`); e.auth = true; throw e; }
      if ([403, 404, 422].includes(r.status)) return [];
      throw new Error(`${ep} -> HTTP ${r.status}`);
    }
    const j = await r.json(); out.push(...(j.data || []));
    next = j.next_token ? `${url}&next_token=${j.next_token}` : null;
  }
  return out;
}
async function fetchNights(lookback = 45) {
  const tok = loadTokens();
  let token = tok.access_token;
  const end = new Date(), start = new Date(end - lookback * 864e5);
  const iso = (d) => d.toISOString().slice(0, 10);
  const eps = ["daily_readiness", "sleep", "daily_sleep", "daily_resilience", "daily_spo2", "daily_activity", "vo2_max", "daily_cardiovascular_age"];
  const runAll = (tk) => Promise.allSettled(eps.map((ep) => pull(ep, tk, iso(start), iso(end))));
  const CORE = new Set(["daily_readiness", "sleep"]);
  const coreAuthFail = (s) => s.some((x, i) => CORE.has(eps[i]) && x.status === "rejected" && x.reason?.auth);

  let settled = await runAll(token);
  if (coreAuthFail(settled)) {
    const nt = await refreshToken(tok);
    if (nt) { token = nt; settled = await runAll(token); }
  }
  if (coreAuthFail(settled)) {
    const e = new Error("Oura token rejected on core data (401) even after refresh. Delete oura_tokens.json + oura_secrets.json and run `node oura_auth.mjs` again (logged into your ring's Oura account).");
    e.auth = true; throw e;
  }
  const val = (i) => (settled[i].status === "fulfilled" ? settled[i].value : []);
  const skipped = eps.filter((_, i) => settled[i].status === "rejected");
  if (skipped.length) console.warn(`(note: skipped unavailable endpoints: ${skipped.join(", ")} — coach continues on the rest)`);
  const [rd, sl, dsl, res, spo, act, vo2, cva] = eps.map((_, i) => val(i));

  const by = (arr, k = "day") => Object.fromEntries(arr.map((x) => [x[k] || (x.timestamp || "").slice(0, 10), x]));
  const R = by(rd), DS = by(dsl), RES = by(res), SP = by(spo), AC = by(act), V = by(vo2), C = by(cva);
  const SL = {};
  for (const s of sl) { const day = (s.day || (s.bedtime_start || "").slice(0, 10)); if (!SL[day] || (s.total_sleep_duration || 0) > (SL[day].total_sleep_duration || 0)) SL[day] = s; }
  const days = [...new Set([...Object.keys(R), ...Object.keys(SL)])].sort();
  return days.map((day) => {
    const r = R[day] || {}, s = SL[day] || {}, ds = DS[day] || {}, rs = RES[day] || {}, sp = SP[day] || {}, ac = AC[day] || {};
    const rc = r.contributors || {};   // Oura's own 0-100 baseline-normalized readiness sub-scores
    return {
      day,
      readiness: num(r.score),
      tempDev: num(r.temperature_deviation), tempTrend: num(r.temperature_trend_deviation),
      hrv: num(s.average_hrv), rhr: num(s.lowest_heart_rate), rr: num(s.average_breath),
      deep: num(s.deep_sleep_duration), rem: num(s.rem_sleep_duration), light: num(s.light_sleep_duration),
      awake: num(s.awake_time), totalSleep: num(s.total_sleep_duration), efficiency: num(s.efficiency), latency: num(s.latency),
      bedEnd: s.bedtime_end || null,
      resilience: rs.level || null,
      spo2: num(sp?.spo2_percentage?.average), bdi: num(sp?.breathing_disturbance_index),
      steps: num(ac.steps), inactivityAlerts: num(ac.inactivity_alerts),
      vo2max: num((V[day] || {}).vo2_max), vascularAge: num((C[day] || {}).vascular_age),
      // readiness contributors (verified field names) — used by v2 for personal-baseline signals
      c_sleepBalance: num(rc.sleep_balance), c_previousNight: num(rc.previous_night),
      c_recoveryIndex: num(rc.recovery_index), c_bodyTemp: num(rc.body_temperature),
      c_hrvBalance: num(rc.hrv_balance), c_restingHr: num(rc.resting_heart_rate),
      c_activityBalance: num(rc.activity_balance), c_prevDayActivity: num(rc.previous_day_activity),
      c_sleepRegularity: num(rc.sleep_regularity),   // may be absent in the API -> null, safely ignored
    };
  });
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  const intake = existsSync(INTAKE_FILE) ? JSON.parse(readFileSync(INTAKE_FILE, "utf8")) : {};
  let nights;
  try { nights = await fetchNights(45); }
  catch (e) {
    if (e.auth) { console.error("\n🔑 " + e.message + "\n"); process.exit(1); }
    console.error("\nCould not fetch Oura data:", e.message, "\n"); process.exit(1);
  }
  const a = analyze(nights, intake);              // <-- recalibrated v2 is the plan of record
  writeFileSync(OUT_FILE, JSON.stringify(a, null, 2));
  console.log("\n" + brief(a) + "\n");
  console.log(`(full verdict written -> ${OUT_FILE})`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
