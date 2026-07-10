#!/usr/bin/env node
// ============================================================================
// calibration.mjs · ARSENAL AI FC — AGENT #2: CALIBRATION
// ----------------------------------------------------------------------------
// WHAT:  Measures self-knowledge honesty — does the captain's stated confidence
//        match his actual accuracy — and flags topics where he is confident-but-
//        WRONG (the dangerous illusion). A CONSUMER of reps_log.jsonl (Agent #0);
//        never writes it.
// WHY:   "knew"-but-wrong is a blind spot; "guessed"-and-wrong is honest. The gap
//        between claimed and real accuracy is the single most useful learning
//        signal. Domain-general: reads BOTH tracks (a knew-wrong on Python is as
//        much a blind spot as on a concept).
//
// THE SCALAR — calibration_gap = ECE (Expected Calibration Error):
//        ECE = Σ_bucket (n_b / N) · | accuracy_b − target_b |   over knew/shaky/guessed
//        targets from calibration_config.json {knew,shaky,guessed}; empty bucket skipped.
//   overconfidence_rate = P(correct==false | confidence=="knew")  (danger keys off THIS).
//
// DANGER ZONE — per-topic (canonical concept id), knew-WRONG only. A topic enters iff:
//   (a) ≥ danger.min_knew_reps knew-reps, AND (b) knew-accuracy < danger.accuracy_mid.
//   confidence:"high" always; accuracy:"low" if <accuracy_low else "mid". shaky/guessed
//   wrongs NEVER enter. AXIS-SHARPEN (concept-track): if ≥2 knew-wrong reps share one axis
//   (the plurality), attach it. Bias to SILENCE (Fork 4): an early false alarm is worse
//   than a missed one.
//
// RELIABILITY FLOOR:
//   N==0            → status "awaiting_data", gap null, danger [] (nothing fabricated).
//   0<N<min_reps    → status "warming_up", gap computed, low_confidence:true, danger [] (SUPPRESSED).
//   N≥min_reps      → status "ok", low_confidence:false, danger active.
//
// TREND — rolling REP-COUNT windows (not calendar): current = ECE(last window_size),
//   prior = ECE(the window before). narrowing / widening / holding steady; <2 windows =
//   "establishing baseline (N reps)".
//
// OUTPUT: dressing-room/state/calibration.json (single writer; gitignored — derived PII).
//   { date, calibration_gap, trend, overconfidence_rate, buckets, danger_zone,
//     total_reps, status, low_confidence, generated_at }  (THE_MANAGER §4/§10 + extras).
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · no API key · Node 22 ESM · Windows-safe entry
//   guard · atomic write (temp→rename) · empty-safe · never fabricate · matches fsrs.mjs style.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const CAL       = join(STATE_DIR, "calibration.json");
const CFG_PATH  = join(STATE_DIR, "calibration_config.json");   // canon (committed)
const CONCEPTS_PATH = join(STATE_DIR, "concepts.json");         // canon (committed)

const DEFAULTS = {
  targets: { knew: 0.95, shaky: 0.65, guessed: 0.30 },
  window_size: 20, min_reps: 20, trend_delta: 0.02,
  danger: { min_knew_reps: 3, accuracy_low: 0.5, accuracy_mid: 0.67 },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF   = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const numOr = (x, dflt) => (typeof x === "number" && !Number.isNaN(x) ? x : dflt);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  const d = DEFAULTS;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        targets: { ...d.targets, ...(j.targets || {}) },
        window_size: numOr(j.window_size, d.window_size),
        min_reps: numOr(j.min_reps, d.min_reps),
        trend_delta: numOr(j.trend_delta, d.trend_delta),
        danger: { ...d.danger, ...(j.danger || {}) },
      };
    }
  } catch { /* malformed config → defaults */ }
  return { ...d };
}

function loadRegistry(path = CONCEPTS_PATH) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map() };
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      for (const [id, def] of Object.entries(j.concepts || {})) {
        reg.conceptAlias.set(normText(id), id);
        for (const a of (def?.aliases || [])) reg.conceptAlias.set(normText(a), id);
      }
      for (const [id, def] of Object.entries(j.skills || {})) {
        reg.skillAlias.set(normText(id), id);
        for (const a of (def?.aliases || [])) reg.skillAlias.set(normText(a), id);
      }
    }
  } catch { /* malformed registry → empty (topic falls back to raw id) */ }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map() };

// canonical topic id for a rep (via concepts.json; raw normalized id if unknown/missing)
function topicOf(r, reg) {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
}

function validRep(r) {
  return r && typeof r === "object"
    && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && CONF.has(r.confidence)
    && typeof r.correct === "boolean"
    && typeof r.concept === "string" && r.concept.trim() !== ""
    && TRACKS.has(r.track);
}

function loadReps(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim(); if (!s) continue;
    try { const o = JSON.parse(s); if (validRep(o)) out.push(o); } catch { /* skip */ }
  }
  return out;
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// core math
// ---------------------------------------------------------------------------
// ECE over a rep set (null if empty). Empty buckets are skipped (no div-by-zero).
function ece(reps, targets) {
  const N = reps.length;
  if (!N) return null;
  let sum = 0;
  for (const b of ["knew", "shaky", "guessed"]) {
    const br = reps.filter((r) => r.confidence === b);
    if (!br.length) continue;
    const acc = br.filter((r) => r.correct).length / br.length;
    sum += (br.length / N) * Math.abs(acc - targets[b]);
  }
  return sum;
}

function bucketsObj(reps) {
  const out = {};
  for (const b of ["knew", "shaky", "guessed"]) {
    const br = reps.filter((r) => r.confidence === b);
    out[b] = { n: br.length, accuracy: br.length ? round(br.filter((r) => r.correct).length / br.length) : null };
  }
  return out;
}

// per-topic knew-wrong danger zone (only meaningful at status "ok")
function computeDanger(reps, cfg, reg) {
  const byTopic = new Map();
  for (const r of reps) {
    const t = topicOf(r, reg);
    if (!byTopic.has(t)) byTopic.set(t, []);
    byTopic.get(t).push(r);
  }
  const scored = [];
  for (const [topic, trs] of byTopic) {
    const knew = trs.filter((r) => r.confidence === "knew");
    if (knew.length < cfg.danger.min_knew_reps) continue;                 // gate (a)
    const acc = knew.filter((r) => r.correct).length / knew.length;
    if (acc >= cfg.danger.accuracy_mid) continue;                         // gate (b): only confident-wrong
    const entry = {
      topic, confidence: "high",
      accuracy: acc < cfg.danger.accuracy_low ? "low" : "mid",
    };
    // axis-sharpen (concept-track only): plurality axis among knew-wrong reps, ≥2
    const wrongs = knew.filter((r) => !r.correct && r.track === "concept" && r.axis);
    const counts = {};
    for (const r of wrongs) counts[r.axis] = (counts[r.axis] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length && sorted[0][1] >= 2 && (sorted.length === 1 || sorted[0][1] > sorted[1][1])) {
      entry.axis = sorted[0][0];
    }
    entry.note = "confident-wrong = the dangerous illusion → tighter interval";
    scored.push({ entry, acc });
  }
  scored.sort((a, b) => a.acc - b.acc);   // worst (lowest knew-accuracy) first
  return scored.map((s) => s.entry);
}

function computeTrend(reps, cfg) {
  const N = reps.length;
  const W = cfg.window_size;
  if (N < 2 * W) return `establishing baseline (${N} reps)`;
  const ordered = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const current = ordered.slice(N - W);
  const prior   = ordered.slice(N - 2 * W, N - W);
  const ce = ece(current, cfg.targets), pe = ece(prior, cfg.targets);
  const delta = pe - ce;                  // + = gap shrinking = improving
  const f = (x) => x.toFixed(2);
  if (delta > cfg.trend_delta)  return `narrowing (${f(pe)} → ${f(ce)})`;
  if (delta < -cfg.trend_delta) return `widening (${f(pe)} → ${f(ce)})`;
  return `holding steady (~${f(ce)})`;
}

function compute(reps, cfg, reg, now) {
  const N = reps.length;
  const gap = ece(reps, cfg.targets);
  const knew = reps.filter((r) => r.confidence === "knew");
  const overconfidence_rate = knew.length ? round(knew.filter((r) => !r.correct).length / knew.length) : null;
  const trend = computeTrend(reps, cfg);
  let status, low_confidence, danger_zone;
  if (N === 0) { status = "awaiting_data"; low_confidence = true; danger_zone = []; }
  else if (N < cfg.min_reps) { status = "warming_up"; low_confidence = true; danger_zone = []; }
  else { status = "ok"; low_confidence = false; danger_zone = computeDanger(reps, cfg, reg); }
  return {
    date: localDate(now),
    calibration_gap: round(gap),
    trend,
    overconfidence_rate,
    buckets: bucketsObj(reps),
    danger_zone,
    total_reps: N,
    status, low_confidence,
    generated_at: new Date(now).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks (no real state touched)
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_such_config__");   // ⇒ DEFAULTS (also tests config-missing)
  const reg = EMPTY_REG;                           // ⇒ topic = raw id (also tests registry-missing)
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  let T = 0;
  const ts = () => new Date(Date.parse("2026-07-01T00:00:00Z") + (T++) * 60000).toISOString();
  const mk = (concept, confidence, correct, o = {}) => ({
    ts: ts(), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept",
    concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "a"),
    question: `q${T}`, confidence, correct,
  });
  const rep = (n, concept, confidence, correct, o) => Array.from({ length: n }, () => mk(concept, confidence, correct, o));
  const find = (dz, t) => dz.find((e) => e.topic === t);

  // 1) empty-safe
  const e0 = compute([], cfg, reg, now);
  assert("empty-safe: awaiting_data, gap null, danger []", e0.status === "awaiting_data" && e0.calibration_gap === null && e0.danger_zone.length === 0);

  // 2) warming_up: 10 reps incl a qualifying danger topic ⇒ danger SUPPRESSED
  const warm = [...rep(3, "chunking", "knew", false), ...rep(7, "filler", "shaky", true)];
  const w = compute(warm, cfg, reg, now);
  assert("warming_up: <20 reps ⇒ low_confidence + danger [] (suppressed)", w.status === "warming_up" && w.low_confidence === true && w.danger_zone.length === 0);

  // 3) ECE math: knew 4(3✓) shaky 2(1✓) guessed 2(0✓) ⇒ hand ECE = 0.2125
  const m3 = [...rep(3, "c", "knew", true), ...rep(1, "c", "knew", false), ...rep(1, "c", "shaky", true), ...rep(1, "c", "shaky", false), ...rep(2, "c", "guessed", false)];
  assert("ECE math matches hand-computed (0.2125)", Math.abs(ece(m3, cfg.targets) - 0.2125) < 1e-9);

  // 4) overconfidence_rate = P(wrong|knew); empty knew ⇒ null
  assert("overconfidence_rate correct (0.25) ", Math.abs(compute(m3, cfg, reg, now).overconfidence_rate - 0.25) < 1e-9);
  assert("overconfidence_rate null when no knew reps", compute([...rep(3, "c", "shaky", true)], cfg, reg, now).overconfidence_rate === null);

  // 5) buckets: n/accuracy correct; empty bucket ⇒ n:0, accuracy:null
  const b5 = compute([...rep(4, "c", "knew", true), ...rep(2, "c", "guessed", false)], cfg, reg, now).buckets;
  assert("buckets n/accuracy correct + empty bucket null", b5.knew.n === 4 && b5.knew.accuracy === 1 && b5.guessed.accuracy === 0 && b5.shaky.n === 0 && b5.shaky.accuracy === null);

  // 6-9) danger (needs status ok, N≥20). One rich mock:
  // NB: topics are normalized to lowercase by topicOf — keep mock concept ids lowercase.
  const ok = [
    ...rep(8, "filler", "shaky", true),                                   // reach N≥20, no knew
    ...rep(1, "chunking", "knew", false, { axis: "a" }), ...rep(1, "chunking", "knew", false, { axis: "b" }), ...rep(1, "chunking", "knew", true, { axis: "c" }), // 0.33 low, mixed wrong-axes ⇒ no axis
    ...rep(3, "midtopic", "knew", true), ...rep(2, "midtopic", "knew", false),  // 3/5=0.60 ⇒ mid
    ...rep(2, "twoknew", "knew", false),                                  // <3 knew ⇒ NOT danger
    ...rep(3, "shakytopic", "shaky", false),                             // no knew ⇒ NOT danger
    ...rep(2, "axisf", "knew", false, { axis: "f" }), ...rep(1, "axisf", "knew", true, { axis: "a" }), // 0.33, 2 wrong axis f ⇒ axis f
    ...rep(1, "axismix", "knew", false, { axis: "f" }), ...rep(1, "axismix", "knew", false, { axis: "c" }), ...rep(1, "axismix", "knew", true, { axis: "a" }), // mixed ⇒ no axis
    ...rep(2, "pydantic", "knew", false, { track: "skill" }), ...rep(1, "pydantic", "knew", true, { track: "skill" }), // skill 0.33 ⇒ danger no axis
  ];
  const oc = compute(ok, cfg, reg, now);
  const dz = oc.danger_zone;
  assert("status ok at N≥min_reps", oc.status === "ok" && oc.low_confidence === false);
  assert("danger fires: chunking low (no axis)", find(dz, "chunking")?.accuracy === "low" && find(dz, "chunking")?.confidence === "high" && !("axis" in find(dz, "chunking")));
  assert("danger label mid: midtopic (0.60)", find(dz, "midtopic")?.accuracy === "mid");
  assert("gate: 2-knew topic NOT in danger", !find(dz, "twoknew"));
  assert("gate: shaky-wrong topic NOT in danger", !find(dz, "shakytopic"));
  assert("axis-sharpen: shared axis ⇒ axis f", find(dz, "axisf")?.axis === "f");
  assert("axis-sharpen: mixed axes ⇒ no axis", find(dz, "axismix") && !("axis" in find(dz, "axismix")));
  assert("domain-general: skill (Python) topic CAN enter danger, no axis", find(dz, "pydantic") && !("axis" in find(dz, "pydantic")));

  // 10-12) trend
  const narrow = [...rep(20, "g", "guessed", true), ...rep(6, "g", "guessed", true), ...rep(14, "g", "guessed", false)]; // prior ECE 0.70 → current ~0.00
  assert("trend narrowing (2 full windows, gap shrinks)", compute(narrow, cfg, reg, now).trend.startsWith("narrowing"));
  const steady = rep(40, "g", "guessed", true);                          // both windows ECE 0.70 ⇒ delta 0
  assert("trend holding steady (delta < trend_delta)", compute(steady, cfg, reg, now).trend.startsWith("holding steady"));
  assert("trend establishing baseline (<40 reps)", compute(rep(30, "g", "shaky", true), cfg, reg, now).trend.includes("establishing baseline"));

  // 13) config missing ⇒ defaults used
  assert("config missing ⇒ defaults", loadConfig("__nope__").targets.knew === 0.95 && loadConfig("__nope__").min_reps === 20);

  // 14) concepts.json missing ⇒ topic = raw id
  const raw = [...rep(2, "Brand New Topic", "knew", false), ...rep(1, "Brand New Topic", "knew", false), ...rep(20, "filler", "shaky", true)];
  assert("concepts.json missing ⇒ topic = raw normalized id", !!find(compute(raw, cfg, EMPTY_REG, now).danger_zone, "brand new topic"));

  const passed = checks.every(([, ok2]) => ok2);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "recompute").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  const cfg = loadConfig();
  const reg = loadRegistry();
  const reps = loadReps(REPS_LOG);
  const out = compute(reps, cfg, reg, new Date());
  writeAtomic(CAL, out);
  console.log(`calibration: ${out.status} — gap ${out.calibration_gap} · overconf ${out.overconfidence_rate} · danger ${out.danger_zone.length} · ${out.trend}  →  ${CAL}`);
  process.exit(0);
}

// Windows-safe entry guard (like timeaudit.mjs / fsrs.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, ece, computeDanger, computeTrend, bucketsObj, loadReps, loadConfig, loadRegistry, topicOf };
