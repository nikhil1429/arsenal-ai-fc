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
//     AMBER or RED. (the stimulant + caffeine + antipsychotic + SNRI classes
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

import { readFileSync, writeFileSync, existsSync, renameSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const TOKENS_FILE = join(__dirname, "oura_tokens.json");
const SECRETS_FILE = join(__dirname, "oura_secrets.json");
const INTAKE_FILE = join(STATE_DIR, "intake_log.json");
const OUT_FILE    = join(STATE_DIR, "readiness.json");
const BASE = "https://api.ouraring.com/v2/usercollection";

// ----------------------------------------------------------------------------
// DURABLE I/O — every file this script owns is either the organism's Governor
// (readiness.json) or the ONLY surviving copy of a rotated credential
// (oura_tokens.json). Neither may ever be written non-atomically.
// ----------------------------------------------------------------------------
// [E2E audit 25 Jul 2026 — findings 7c1db339 + ede93838] writeFileSync truncates
// FIRST and writes second. Six long-running daemons poll readiness.json
// (heartbeat, thalamus, dugout, physio, tone, shadow) and every one of them maps
// an unparseable file to null and then to "GREEN" — so a reader landing in that
// truncation window on a RED morning acts on a fabricated GREEN. The same tear
// on oura_tokens.json is worse than transient: Oura has already invalidated the
// old refresh_token server-side, so a half-written file destroys the chain for
// good. tmp-then-rename: rename over an existing file on the same volume is
// atomic on NTFS, so a reader sees either the old bytes or the new ones, never
// a half file.
function writeJsonAtomic(file, obj) {
  // C2 (9 Aug 2026): per-pid tmp — a fixed `.tmp` name means two concurrent writers
  // of the SAME file clobber each other's tmp (the 7 Aug sweep fixed this class in
  // 35 organs; this one kept the shared name).
  const tmp = `${file}.tmp${process.pid}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, file);
}

// [E2E audit 25 Jul 2026 — finding 42cb354c] intake_log.json is a HAND-MAINTAINED
// state file (medication/caffeine timing). One trailing comma used to throw an
// unhandled SyntaxError out of main() before a single byte was fetched: no brief,
// no verdict, and a failure that read like a code crash rather than a data typo.
// The intake log is an INTERPRETATION AID, never required for a verdict — so a
// broken one degrades to {} with a warning instead of taking the morning down.
function readJsonSafe(file, fallback, label = file) {
  if (!existsSync(file)) return fallback;
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (e) {
    console.warn(`(note: ${label} is not valid JSON (${e.message}) — continuing without it)`);
    return fallback;
  }
}

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
      + "(stimulant + caffeine + antipsychotic + SNRI classes) -> treated as "
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

// [E2E audit 25 Jul 2026 — findings ad65d14f + 9a7f3933] the fetch window was
// built with toISOString(), i.e. the UTC calendar day, on a UTC+5:30 machine,
// against an API that labels every night with the user's LOCAL day. Any run
// between 00:00 and 05:29 IST therefore asked for end_date = YESTERDAY: last
// night — the entire point of the run — was excluded, and the night BEFORE it
// was presented as "today" (wrong verdict, wrong date, downstream freshness
// checks fooled). Build both ends of the window from LOCAL calendar components.
export const localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// [E2E audit 25 Jul 2026 — finding 3a973f69] "consecutive days" used to mean
// consecutive ARRAY ELEMENTS. fetchNights emits a record only for days Oura
// actually returned (no null-filling), so with the ring off in between, three
// separate hot evenings weeks apart became three ADJACENT elements and fired the
// "SEE A DOCTOR. Sustained concerning physiology (multi-day...)" message off
// three unrelated nights. Adjacency has to be checked on the calendar.
// Conservative on malformed/missing day strings: assume adjacent (preserves the
// old behaviour) so a parsing quirk can never SUPPRESS a genuine referral.
function isAdjacentDay(prevDay, day) {
  const a = Date.parse(`${prevDay}T00:00:00Z`), b = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  return Math.round((b - a) / 864e5) === 1;
}

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

  // [E2E audit 25 Jul 2026 — finding 2cdc2141] the baselines used to INCLUDE the
  // very window being judged against them (28d mean vs the last 7 of those same
  // 28), so a deviation quietly redefined its own normal: fire RED in week 2,
  // and by week 5 the 28d mean had absorbed the collapse, deep7 was no longer
  // below 85% of it, and the coach printed GREEN + "the grind is honored" at a
  // man who was still collapsed. Baselines now come from the PRIOR window only —
  // records [N-baseWin, N-recentWin) — so the comparison period cannot drag the
  // thing it is compared against. (The pre-§12 inclusive maths stays frozen and
  // untouched in analyzeLegacy, per the layering principle.)
  const priorSlice = (k, baseWin, recentWin) => {
    const s = series(k);
    return s.slice(Math.max(0, s.length - baseWin), Math.max(0, s.length - recentWin));
  };

  // ---- HIGH CONFIDENCE #1: SLEEP ARCHITECTURE TREND (deep+REM, multi-day) ---
  const deep7 = meanLastN("deep", V2.win.arch), deepBase = mean(priorSlice("deep", V2.win.archBase, V2.win.arch));
  const rem7  = meanLastN("rem",  V2.win.arch), remBase  = mean(priorSlice("rem",  V2.win.archBase, V2.win.arch));
  const deepLowTrend = deep7 !== null && deepBase !== null && deep7 < deepBase * V2.archLowFrac;
  const remLowTrend  = rem7  !== null && remBase  !== null && rem7  < remBase  * V2.archLowFrac;
  const archCollapse = deepLowTrend && remLowTrend;     // BOTH sustained-low = anchor RED axis
  const archPartial  = (deepLowTrend || remLowTrend) && !archCollapse;

  // ---- HIGH CONFIDENCE #2: SLEEP vs PERSONAL BASELINE (fixes 8h bug) --------
  // Primary = Oura's own `sleep_balance` contributor (2wk vs 2mo, already
  // personal-baseline-normalized). Secondary = his OWN median total sleep.
  const sleepBal7      = meanLastN("c_sleepBalance", V2.win.week);
  // [E2E audit 25 Jul 2026 — findings e7fe900a + 2cdc2141] "need" used to be the
  // rolling median of the SAME 28 nights it was judging, and the 6.5h floor was
  // reachable ONLY when that median came back null. So five weeks at 5.6h simply
  // redefined 5.6h as Nikhil's normal: sleepShortTrend cleared, the 14d debt fell
  // toward zero, and a textbook slow burnout — precisely what the Goalkeeper
  // exists to catch — reported GREEN. Two guards now: (1) the median is taken
  // from the window EXCLUDING the last 7 nights being judged, and (2) it can only
  // ever RAISE the need above the 6.5h floor, never sink below it. His documented
  // range is ~6–7h, so the floor is his own biology, not a textbook 8h.
  const ownSleepMedSec = median(priorSlice("totalSleep", V2.win.sleepBase, V2.win.week));
  const personalNeedSec = Math.max(ownSleepMedSec ?? 0, V2.fallbackNeedH * 3600);
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
    // calendar adjacency, not array adjacency — audit 25 Jul 2026, finding 3a973f69
    if (i < N - 1 && !isAdjacentDay(d.day, hist[i + 1].day)) break;
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
      // [E2E audit 25 Jul 2026 — finding a86d566c] daily_sleep was fetched, mapped
      // into DS and destructured per day, then read by nothing: every run paid for
      // the call (twice when the token needed refreshing) and binned the answer.
      // Now surfaced — context ONLY. Like readiness_raw it can never move the
      // verdict: a single 0-100 composite is exactly the kind of number §12
      // refuses to be governed by.
      oura_sleep_score: num(t.sleepScore),
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
    // [E2E audit 25 Jul 2026 — finding 3a973f69] this walked ARRAY neighbours and
    // called them "consecutive days". With the ring off in between, three hot
    // evenings weeks apart sat next to each other in the array and tripped the
    // doctor referral. A day with no record is not evidence of anything — break
    // the run at a real calendar gap. (Only ever makes the referral HARDER to
    // fire on non-evidence; a genuine 3-night run is calendar-adjacent.)
    if (i < hist.length - 1 && !isAdjacentDay(d.day, hist[i + 1].day)) break;
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
  // [E2E audit 25 Jul 2026 — finding 42cb354c] a truncated or hand-edited token
  // file used to surface as a raw SyntaxError thrown out of the middle of
  // fetchNights, which reads as a code bug rather than "your token file is torn".
  try { return JSON.parse(readFileSync(TOKENS_FILE, "utf8")); }
  catch (e) {
    const err = new Error(`oura_tokens.json is not valid JSON (${e.message}). Run:  node oura_auth.mjs   to re-create it.`);
    err.auth = true; throw err;
  }
}

// [E2E audit 25 Jul 2026 — findings ede93838 + f94245e4] Oura ROTATES the
// refresh_token on every refresh (oura_auth.mjs's own header: "must be saved or
// the chain breaks"), so what gets written here is the ONLY surviving copy of a
// credential the server has already invalidated. The old write was
// `writeFileSync(TOKENS_FILE, JSON.stringify(nt))` — the raw response body,
// wholesale, over the entire file. Three ways that ends the chain permanently:
// (a) a 200 whose body omits refresh_token silently DELETED the stored one;
// (b) writeFileSync truncates-then-writes, so a crash mid-write left a corrupt
//     file and there is no second copy anywhere;
// (c) no cross-process guard, so when the 08:30 schtasks run and a manual run
//     overlapped, the loser's refresh was rejected (already rotated) and the
//     coach told the captain to "delete oura_tokens.json + oura_secrets.json" —
//     i.e. to destroy credentials that had just been successfully renewed.
// mergeTokens is split out as a pure function so the merge rule is selftestable.
export function mergeTokens(oldTok, resp) {
  const merged = { ...(oldTok || {}), ...(resp || {}) };
  // never let an absent/blank rotation field wipe a live refresh_token
  if (!merged.refresh_token && oldTok && oldTok.refresh_token) merged.refresh_token = oldTok.refresh_token;
  merged.expires_at = Date.now() + (((resp && resp.expires_in) || 86400) * 1000);
  return merged;
}
// returns { token, fatal, why } — `fatal` distinguishes a genuinely dead chain
// (invalid_grant) from a transient failure the captain must NOT respond to by
// deleting credentials.
async function refreshToken(tok, fetchFn = fetch) {
  if (!existsSync(SECRETS_FILE)) return { token: null, fatal: true, why: "no oura_secrets.json" };
  const s = readJsonSafe(SECRETS_FILE, null, "oura_secrets.json");
  if (!s || !s.client_id) return { token: null, fatal: true, why: "oura_secrets.json unreadable" };
  let cur = tok;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!cur || !cur.refresh_token) return { token: null, fatal: true, why: "no refresh_token stored" };
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: cur.refresh_token, client_id: s.client_id, client_secret: s.client_secret });
    const r = await fetchFn("https://api.ouraring.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!r.ok) {
      // a concurrent run may have rotated the chain under us — re-read the file
      // once and retry with whatever is actually on disk before giving up.
      const onDisk = readJsonSafe(TOKENS_FILE, null, "oura_tokens.json");
      if (attempt === 0 && onDisk && onDisk.refresh_token && onDisk.refresh_token !== cur.refresh_token) { cur = onDisk; continue; }
      return { token: null, fatal: r.status === 400 || r.status === 401, why: `refresh -> HTTP ${r.status}` };
    }
    const nt = await r.json();
    if (!nt || !nt.access_token) return { token: null, fatal: false, why: "refresh returned no access_token" };
    const merged = mergeTokens(cur, nt);
    writeJsonAtomic(TOKENS_FILE, merged);
    return { token: merged.access_token, fatal: false, why: "refreshed" };
  }
  return { token: null, fatal: false, why: "refresh exhausted its one retry" };
}
async function pull(ep, token, start, end, fetchFn = fetch) {
  const url = `${BASE}/${ep}?start_date=${start}&end_date=${end}`;
  const out = []; let next = url; let pages = 0;
  for (; pages < 20 && next; pages++) {
    const r = await fetchFn(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      if (r.status === 401) { const e = new Error(`${ep} -> 401`); e.auth = true; throw e; }
      // [E2E audit 25 Jul 2026 — finding 848a3044] these statuses mean "this
      // endpoint isn't available to this token" (dev-mode 403 on
      // daily_resilience, 422 on an unsupported range) — but `return []` also
      // threw away every page ALREADY in hand. A page-2 422 on the 45-day sleep
      // pull therefore deleted ~40 real nights, every sleep-derived field went
      // null across the whole history, and the coach carried on as if the ring
      // had never been worn. Hand back what we actually have.
      if ([403, 404, 422].includes(r.status)) {
        if (out.length) console.warn(`(note: ${ep} -> HTTP ${r.status} mid-pagination after ${pages} page(s) — keeping the ${out.length} record(s) already fetched)`);
        return out;
      }
      throw new Error(`${ep} -> HTTP ${r.status}`);
    }
    const j = await r.json(); out.push(...(j.data || []));
    // next_token is opaque and may carry '+' or '=' padding; interpolated raw it
    // was mangled by the query parser (audit 25 Jul 2026, finding 848a3044).
    next = j.next_token ? `${url}&next_token=${encodeURIComponent(j.next_token)}` : null;
  }
  // the 20-page cap used to truncate in total silence (same finding)
  if (next) console.warn(`(note: ${ep} hit the 20-page pagination cap — this endpoint's results are TRUNCATED)`);
  return out;
}

// [E2E audit 25 Jul 2026 — finding 80349755] fetchNights escalated ONLY core
// rejections whose reason carried .auth (the 401 path). Every other rejection —
// offline TypeError, HTTP 429, a transient Oura 500 — was quietly turned into []
// by the `val()` helper with nothing but a console.warn, and the run continued
// to a fabricated verdict. Split out as a pure helper so the escalation rule is
// selftestable without a network call.
const CORE_EPS = new Set(["daily_readiness", "sleep"]);
export function coreRejections(eps, settled) {
  return eps
    .map((ep, i) => ({ ep, res: settled[i] }))
    .filter((x) => CORE_EPS.has(x.ep) && x.res && x.res.status === "rejected");
}

// pure per-day record builder — extracted out of fetchNights (audit 25 Jul 2026)
// so the merge shape can be asserted without touching the network.
export function buildNight(day, src = {}) {
  const r = src.r || {}, s = src.s || {}, ds = src.ds || {}, rs = src.rs || {}, sp = src.sp || {}, ac = src.ac || {}, vo = src.vo || {}, cva = src.cva || {};
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
    // finding a86d566c: daily_sleep was fetched + mapped + destructured and then
    // never read. Consumed now, informational only — never verdict-driving.
    sleepScore: num(ds.score),
    spo2: num(sp?.spo2_percentage?.average), bdi: num(sp?.breathing_disturbance_index),
    steps: num(ac.steps), inactivityAlerts: num(ac.inactivity_alerts),
    vo2max: num(vo.vo2_max), vascularAge: num(cva.vascular_age),
    // readiness contributors (verified field names) — used by v2 for personal-baseline signals
    c_sleepBalance: num(rc.sleep_balance), c_previousNight: num(rc.previous_night),
    c_recoveryIndex: num(rc.recovery_index), c_bodyTemp: num(rc.body_temperature),
    c_hrvBalance: num(rc.hrv_balance), c_restingHr: num(rc.resting_heart_rate),
    c_activityBalance: num(rc.activity_balance), c_prevDayActivity: num(rc.previous_day_activity),
    c_sleepRegularity: num(rc.sleep_regularity),   // may be absent in the API -> null, safely ignored
  };
}
async function fetchNights(lookback = 45) {
  const tok = loadTokens();
  let token = tok.access_token;
  const end = new Date(), start = new Date(end.getTime() - lookback * 864e5);
  // LOCAL calendar days, and end padded +1 day (Oura simply ignores future days)
  // so a pre-dawn run can never miss the night that just ended — findings
  // ad65d14f / 9a7f3933, audit 25 Jul 2026.
  const endPad = new Date(end.getTime() + 864e5);
  const eps = ["daily_readiness", "sleep", "daily_sleep", "daily_resilience", "daily_spo2", "daily_activity", "vo2_max", "daily_cardiovascular_age"];
  const runAll = (tk) => Promise.allSettled(eps.map((ep) => pull(ep, tk, localISO(start), localISO(endPad))));
  const coreAuthFail = (s) => coreRejections(eps, s).some((x) => x.res.reason?.auth);

  let settled = await runAll(token);
  let refreshed = false, refreshFatal = false, refreshWhy = null;
  if (coreAuthFail(settled)) {
    const rt = await refreshToken(tok);
    refreshWhy = rt.why; refreshFatal = rt.fatal;
    if (rt.token) { refreshed = true; token = rt.token; settled = await runAll(token); }
  }
  if (coreAuthFail(settled)) {
    // finding f94245e4: the old message told the captain to delete BOTH credential
    // files no matter why the refresh failed — including the concurrent-run race,
    // where the chain was perfectly healthy and had just been rotated by the other
    // process. Only say "re-auth" when the chain is genuinely dead.
    const dead = refreshed || refreshFatal;
    const e = new Error(dead
      ? "Oura token rejected on core data (401) even after refresh. Delete oura_tokens.json + oura_secrets.json and run `node oura_auth.mjs` again (logged into your ring's Oura account)."
      : `Oura token could not be refreshed (${refreshWhy}) — this looks TRANSIENT, not a dead credential. Do NOT delete oura_tokens.json / oura_secrets.json; just run the coach again later.`);
    e.auth = true; throw e;
  }
  // finding 80349755: a CORE endpoint that failed for any non-401 reason must be
  // fatal. Downgrading it to [] produced either zero nights (readiness.json
  // clobbered with ok:false) or a readiness-only history in which every
  // sleep-architecture trend is null — i.e. a manufactured GREEN on top of a
  // genuine RED, with schtasks recording a clean success.
  const coreDead = coreRejections(eps, settled);
  if (coreDead.length) {
    const e = new Error(`core Oura endpoint(s) failed: ${coreDead.map((x) => `${x.ep} (${x.res.reason?.message || "unknown error"})`).join(", ")}. Refusing to compute a verdict from partial data.`);
    e.fetch = true; throw e;
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
  // the record literal that used to live here is now buildNight() above, so its
  // shape (including the newly-consumed daily_sleep score) is testable offline.
  return days.map((day) => buildNight(day, {
    r: R[day], s: SL[day], ds: DS[day], rs: RES[day], sp: SP[day], ac: AC[day], vo: V[day], cva: C[day],
  }));
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
// [E2E audit 25 Jul 2026 — finding 80349755] main() used to write readiness.json
// UNCONDITIONALLY, including the `{ok:false,"error":"no nights of data"}` that a
// transient Oura 500 produced. readiness.json is the organism's Governor and
// every consumer (heartbeat, thalamus, dugout, physio, tone, shadow) maps an
// unusable file to "GREEN" — so a network blip on a genuine RED morning became a
// full-ceiling GREEN one, and schtasks logged the run as a success. A verdict is
// persistable ONLY if it is a real verdict; otherwise the last real one stands.
export const isPersistableVerdict = (a) => !!(a && a.ok === true && a.verdict);

// LADDER B4 (9 Aug 2026): an auth-FATAL used to exit 1 leaving NO on-disk trace —
// readiness.json is (correctly) untouched, so the only witness was a console line
// in a scheduled-task window nobody sees. The captains_call organ needs ONE
// readable field to derive its card from. This sibling file is that field, and
// this organ is its sole writer: fatal:true on an auth death, fatal:false on the
// next successful verdict. It never carries biometrics — status only.
const AUTH_STATE_FILE = join(STATE_DIR, "oura_auth_state.json");

async function main() {
  // finding 42cb354c: this parse used to sit OUTSIDE the try/catch below, so one
  // trailing comma in the hand-maintained intake log killed the run outright.
  const intake = readJsonSafe(INTAKE_FILE, {}, "intake_log.json");
  let nights;
  try { nights = await fetchNights(45); }
  catch (e) {
    if (e.auth) {
      writeJsonAtomic(AUTH_STATE_FILE, { fatal: true, why: String(e.message).slice(0, 200), at: new Date().toISOString() });
      console.error("\n🔑 " + e.message + "\n"); process.exit(1);
    }
    console.error("\nCould not fetch Oura data:", e.message, "\n");
    console.error(`(${OUT_FILE} left UNTOUCHED — stale-but-real beats fresh-but-fabricated.)\n`);
    process.exit(1);
  }
  const a = analyze(nights, intake);              // <-- recalibrated v2 is the plan of record
  if (!isPersistableVerdict(a)) {
    console.error(`\nCoach could not produce a verdict: ${a.error || "unknown"}`);
    console.error(`(${OUT_FILE} left UNTOUCHED — the last real verdict stands. Exiting non-zero so the scheduler and physio's freshness check both notice.)\n`);
    process.exit(1);
  }
  writeJsonAtomic(OUT_FILE, a);                   // atomic — finding 7c1db339
  // B4 — a verdict that landed proves the token works: clear the auth flag.
  writeJsonAtomic(AUTH_STATE_FILE, { fatal: false, at: new Date().toISOString() });
  console.log("\n" + brief(a) + "\n");
  console.log(`(full verdict written -> ${OUT_FILE})`);
}

// ----------------------------------------------------------------------------
// selftest — added by the E2E audit (25 Jul 2026). Dormant-safe: no network, no
// credentials, no real state touched (scratch files go to the OS temp dir).
// Every assertion below is a REGRESSION guard for a specific audit finding and
// genuinely fails against the pre-audit code.
// ----------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

  // Nikhil's medicated normal, held CONSTANT so every threshold below is exact
  // arithmetic rather than a fixture accident: ~6.83h sleep, deep 1.5h, REM 1.67h.
  const day0 = new Date("2026-06-11T00:00:00Z");
  const mk = (n, over = {}) => Array.from({ length: n }, (_, i) => ({
    day: new Date(day0.getTime() + i * 864e5).toISOString().slice(0, 10),
    readiness: 82, tempDev: 0.05, tempTrend: 0,
    hrv: 35, rhr: 61, rr: 15.5,
    deep: 5400, rem: 6000, light: 12000, awake: 1500,
    totalSleep: 24600, efficiency: 88, latency: 700,
    bedEnd: null, resilience: "solid",
    spo2: 96, bdi: 3, steps: 5000, inactivityAlerts: 4, vo2max: 42, vascularAge: 30,
    c_sleepBalance: 78, c_previousNight: 74, c_recoveryIndex: 70, c_bodyTemp: 90,
    c_hrvBalance: 55, c_restingHr: 60, c_activityBalance: 70, c_prevDayActivity: 60,
    c_sleepRegularity: 72,
    ...over,
  }));

  console.log("\nTHE GOALKEEPER — selftest (v2 engine + E2E audit regressions)\n");

  // --- baseline sanity: the medicated normal must still read GREEN -----------
  assert("healthy medicated baseline still reads GREEN (the grind is honored)", analyze(mk(45)).verdict === "GREEN");

  // --- finding e7fe900a: chronic short sleep must not self-normalize ----------
  // 45 nights at 5.6h. Pre-audit: need = median(last 28) = 5.6h, so 5.6h was
  // never < 0.9 x 5.6h -> sleepShortTrend cleared -> GREEN on a burnout.
  const aShort = analyze(mk(45, { totalSleep: 20160 }));
  assert("5 weeks at 5.6h cannot redefine 'normal': need floored at 6.5h, shortfall still fires",
    aShort.signals.personal_sleep_need_h === 6.5
    && aShort.tiers.high_confidence.sleep_vs_personal_baseline.short === true
    && aShort.verdict !== "GREEN");

  // --- finding 2cdc2141: the baseline must exclude the window it judges -------
  // A 25-night-old deep+REM collapse. Pre-audit the 28d mean (which INCLUDED all
  // 25 collapsed nights) had sunk to 2507s, so deep 2230 was no longer below 85%
  // of it and the collapse flag cleared itself. The prior-window baseline (2683s)
  // still sees it. Exact arithmetic — margins are ~2% on both sides.
  const chronic = mk(45);
  for (let i = 20; i < 45; i++) chronic[i] = { ...chronic[i], deep: 2230, rem: 2478 };
  const aChronic = analyze(chronic);
  assert("a 25-night-old collapse STILL reads as a collapse — baselines exclude the window they judge",
    aChronic.tiers.high_confidence.sleep_architecture_trend.collapse === true && aChronic.verdict !== "GREEN");

  // --- finding 3a973f69: 'consecutive days' means the calendar, not the array --
  const gappy = mk(45);
  [[42, "2026-07-17"], [43, "2026-07-21"], [44, "2026-07-25"]].forEach(([i, d]) => {
    gappy[i] = { ...gappy[i], day: d, tempDev: 0.6, rr: 18.5 };
  });
  const aGap = analyze(gappy);
  assert("3 concerning nights across ring-off gaps are NOT consecutive days — no false doctor referral",
    aGap.safety.consecutive_concerning_days === 1 && aGap.safety.refer_doctor === false);
  const adj = mk(45);
  for (const i of [42, 43, 44]) adj[i] = { ...adj[i], tempDev: 0.6, rr: 18.5 };
  assert("3 genuinely consecutive concerning nights STILL fire the doctor referral (no over-suppression)",
    analyze(adj).safety.refer_doctor === true);

  // --- findings ad65d14f + 9a7f3933: local calendar day, not UTC --------------
  // 02:00 local fails for any zone east of UTC+2 (incl. IST) under toISOString();
  // 23:30 local fails for any zone west of UTC-0:30. Together: the real bug.
  assert("fetch window uses the LOCAL calendar day (a pre-dawn IST run no longer drops last night)",
    localISO(new Date(2026, 6, 25, 2, 0, 0)) === "2026-07-25" && localISO(new Date(2026, 6, 25, 23, 30, 0)) === "2026-07-25");

  // --- findings ede93838 + f94245e4: the rotated refresh chain survives -------
  assert("token refresh MERGES: a response without refresh_token cannot destroy the chain",
    mergeTokens({ access_token: "old", refresh_token: "R1", scope: "daily" }, { access_token: "new", expires_in: 86400 }).refresh_token === "R1"
    && mergeTokens({ access_token: "old", refresh_token: "R1", scope: "daily" }, { access_token: "new" }).scope === "daily");
  assert("token refresh still ADOPTS the rotated refresh_token when Oura sends one",
    mergeTokens({ refresh_token: "R1" }, { access_token: "new", refresh_token: "R2" }).refresh_token === "R2");

  // --- finding 80349755: a non-auth CORE failure is fatal --------------------
  const epsFx = ["daily_readiness", "sleep", "daily_spo2"];
  const settledFx = [
    { status: "fulfilled", value: [] },
    { status: "rejected", reason: new Error("sleep -> HTTP 500") },   // no .auth
    { status: "rejected", reason: new Error("daily_spo2 -> 403") },
  ];
  const cr = coreRejections(epsFx, settledFx);
  assert("a NON-auth failure on a core endpoint is fatal (was silently downgraded to zero nights)",
    cr.length === 1 && cr[0].ep === "sleep");
  assert("a non-verdict is never persistable over the last real verdict",
    isPersistableVerdict({ ok: false, error: "no nights of data" }) === false && isPersistableVerdict(analyze(mk(45))) === true);

  // --- finding 848a3044: partial pages survive a mid-pagination 4xx ----------
  const seen = [];
  const stubFetch = async (u) => {
    seen.push(u);
    if (seen.length === 1) return { ok: true, status: 200, json: async () => ({ data: [{ day: "2026-07-01" }], next_token: "tok+en=" }) };
    return { ok: false, status: 422 };
  };
  const pulled = await pull("sleep", "T", "2026-06-01", "2026-07-15", stubFetch);
  assert("a mid-pagination 422 keeps the pages already fetched instead of deleting the endpoint",
    pulled.length === 1 && pulled[0].day === "2026-07-01");
  assert("next_token is URL-encoded ('+' and '=' used to be mangled by the query parser)",
    (seen[1] || "").includes("next_token=tok%2Ben%3D"));

  // --- finding a86d566c: daily_sleep is actually consumed now ----------------
  assert("Oura's daily_sleep score is consumed (was fetched, mapped and binned every run)",
    buildNight("2026-07-25", { ds: { score: 77 } }).sleepScore === 77
    && analyze(mk(45).map((d) => ({ ...d, sleepScore: 77 }))).signals.oura_sleep_score === 77);

  // --- findings 42cb354c + 7c1db339: scratch-dir I/O guards ------------------
  const dir = mkdtempSync(join(tmpdir(), "goalkeeper-selftest-"));
  writeFileSync(join(dir, "intake_log.json"), '{ "2026-07-25": { "caffeine": ["17:00",] }');
  assert("a hand-broken intake_log.json degrades to {} instead of killing the run before a byte is fetched",
    JSON.stringify(readJsonSafe(join(dir, "intake_log.json"), {}, "intake_log.json(fixture)")) === "{}");
  const outFx = join(dir, "readiness.json");
  writeJsonAtomic(outFx, { ok: true, verdict: "RED" });
  assert("state-bus write goes through tmp+rename and leaves no .tmp behind",
    JSON.parse(readFileSync(outFx, "utf8")).verdict === "RED" && !existsSync(`${outFx}.tmp`));

  // --- medical boundary: still no dose/diagnosis language anywhere -----------
  const dump = JSON.stringify(analyze(adj)).toLowerCase();
  assert("zero medication advice anywhere in the output (hard boundary)",
    !dump.includes("increase your") && !dump.includes("your dose") && !dump.includes("mg "));

  const passed = checks.every((c) => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : `\nSELFTEST FAILED (${checks.filter((c) => !c[1]).length} of ${checks.length})`);
  return passed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  // C5 (9 Aug 2026): a typo'd mode ("selftst") used to fall straight through to a
  // LIVE Oura run — the unknown-argv guard manager.mjs already carries. Bare = live
  // (the conductor's chain calls it bare); anything else must say what it means.
  if (mode) { console.error(`oura_coach: unknown mode "${mode}" — run bare for the live pass, or: selftest`); process.exit(1); }
  main();
}
