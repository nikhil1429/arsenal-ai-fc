#!/usr/bin/env node
// ============================================================================
// nemesis.mjs · ARSENAL AI FC — AGENT #3: NEMESIS (self-scout)
// ----------------------------------------------------------------------------
// WHAT:  Surfaces the ONE recurring "kind of thinking" that keeps breaking — the
//        cross-concept AXIS pattern no per-card view can see — as a self-SCOUT
//        report, never a shame-list. A CONSUMER of reps_log.jsonl (Agent #0);
//        never writes it. Single writer of weaknesses.json (Fork A3: Nemesis
//        writes the FILE, the Manager writes the surfaced team-sheet LINE —
//        exactly the FSRS→cards.json / Calibration→calibration.json precedent).
// WHY:   Recurrence is FSRS's job; confident-wrong is Calibration's. Nemesis's
//        UNIQUE signal = misses on different concepts CLUSTERING on one axis
//        ("tokenization+chunking+retrieval all break on axis-e / failure-modes")
//        → the nemesis is a KIND OF THINKING, not a topic. That is the payoff
//        for capturing `axis` from day 1. Frame = self-scout; no hype/10x.
//
// MISS-SIGNAL (Fork B — what COUNTS, grouped per topic; guessed-wrong alone does NOT):
//   RELAPSE         — correct earlier, later incorrect (replay reps in ts order per concept)
//   confident-wrong — correct=false AND confidence="knew"
//   shaky-wrong     — correct=false AND confidence="shaky"   (Calibration excludes this; it lands here)
//   guessed-wrong with no relapse ⇒ NOT a miss (that recurrence is FSRS's job — no duplication)
//   BOTH tracks count (a Python relapse is real); axis-clustering is concept-track ONLY.
//
// RANKING (Fork C): per-entry score = recency-weighted recurrence (halflife decay).
//   headline = single highest-score OPEN weakness (or null — bias-to-silence).
//   axis_pattern (CEILING) surfaces ONLY when BOTH: (i) distinct concepts on one axis ≥
//   axis_cluster_min_concepts AND (ii) total_reps ≥ warming_up_min_reps. Else null.
// HEALED (Fork D): last healed_clean_streak reps clean + no knew-wrong ⇒ status:"closed"
//   (kept as history — beaten opponent = trophy — off active rank; pruned after closed_prune_days).
//
// INPUT (reads-only; reps_log is the SOLE truth source — calibration.json NOT read):
//   dressing-room/state/reps_log.jsonl  (Agent #0, both tracks)
//   dressing-room/state/concepts.json   (canon vocab — axis authority + alias normalize;
//                                        MISSING ⇒ raw topic id + axis null, still runs)
//
// OUTPUT: dressing-room/state/weaknesses.json (single writer; gitignored — derived PII):
//   canonical (THE_MANAGER §4/§5/§10): weaknesses:[{id,topic,recurrence,last_seen,status,evidence[]}]
//   additive: date, generated_at, total_reps, status(envelope), low_confidence, headline,
//   axis_pattern{axis,concepts[],strength,note}, per-entry {axis, score}.
//   id = STABLE topic-derived slug (never positional). recurrence = RAW int; score = weighted float.
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic write (temp→rename) · empty-safe · never fabricate · matches fsrs/calibration.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const WEAK      = join(STATE_DIR, "weaknesses.json");
const CFG_PATH  = join(STATE_DIR, "nemesis_config.json");     // canon (committed)
const CONCEPTS_PATH = join(STATE_DIR, "concepts.json");       // canon (committed)

const DEFAULTS = {
  axis_cluster_min_concepts: 3, recency_halflife_days: 10, warming_up_min_reps: 20,
  healed_clean_streak: 3, closed_prune_days: 30,
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF   = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const slugify  = (s) => normText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "topic";
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const numOr = (x, dflt) => (typeof x === "number" && !Number.isNaN(x) ? x : dflt);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const mmdd = (ts) => String(ts).slice(5, 10);
const isoDate = (ts) => String(ts).slice(0, 10);

function loadConfig(path = CFG_PATH) {
  const d = DEFAULTS;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        axis_cluster_min_concepts: numOr(j.axis_cluster_min_concepts, d.axis_cluster_min_concepts),
        recency_halflife_days: numOr(j.recency_halflife_days, d.recency_halflife_days),
        warming_up_min_reps: numOr(j.warming_up_min_reps, d.warming_up_min_reps),
        healed_clean_streak: numOr(j.healed_clean_streak, d.healed_clean_streak),
        closed_prune_days: numOr(j.closed_prune_days, d.closed_prune_days),
      };
    }
  } catch { /* malformed config → defaults */ }
  return { ...d };
}

// registry: concepts.json is the AXIS AUTHORITY. loaded=false ⇒ axis null everywhere (capsule).
function loadRegistry(path = CONCEPTS_PATH) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };
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
      reg.loaded = true;
    }
  } catch { /* malformed registry → loaded stays false */ }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };

const topicOf = (r, reg) => {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
};

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
// core
// ---------------------------------------------------------------------------
// qualifying misses for ONE topic's reps (ts order). axisEnabled gates axis capture.
function analyzeTopic(reps, axisEnabled) {
  const sorted = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  let seenCorrect = false;
  const misses = [];   // { ts, type, axis }
  for (const r of sorted) {
    if (r.correct) { seenCorrect = true; continue; }
    const relapse = seenCorrect;
    const qualifies = relapse || r.confidence === "knew" || r.confidence === "shaky";
    if (!qualifies) continue;                       // guessed-wrong w/o relapse ⇒ FSRS's job, skip
    const type = relapse ? "relapse" : (r.confidence === "knew" ? "knew-wrong" : "shaky-wrong");
    const axis = (axisEnabled && r.track === "concept" && r.axis) ? r.axis : null;
    misses.push({ ts: r.ts, type, axis });
  }
  return { sorted, misses };
}

function modeAxis(misses) {
  const c = {};
  for (const m of misses) if (m.axis) c[m.axis] = (c[m.axis] || 0) + 1;
  const s = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return s.length ? s[0][0] : null;
}

function isHealed(sorted, cfg) {
  const k = cfg.healed_clean_streak;
  if (sorted.length < k) return false;
  const lastK = sorted.slice(-k);
  const allClean = lastK.every((r) => r.correct);
  const noKnewWrong = lastK.every((r) => !(r.confidence === "knew" && !r.correct));
  return allClean && noKnewWrong;
}

function scoreOf(misses, nowMs, halflifeDays) {
  let s = 0;
  for (const m of misses) {
    const ageDays = (nowMs - Date.parse(m.ts)) / 86400000;
    s += Math.pow(0.5, ageDays / halflifeDays);
  }
  return s;
}

function headlineLine(e) {
  const ax = e.axis ? ` — axis ${e.axis} keeps breaking` : "";
  return `${e.recurrence}× miss on ${e.topic}${ax}. today's #1 to scout — drill it before it drills you.`;
}
function axisPatternNote(axis, concepts) {
  return `${concepts.length} concepts (${concepts.join(", ")}) all break on axis ${axis} — the pattern is the opponent, not the topic. scout the KIND of thinking.`;
}

function compute(reps, cfg, reg, now) {
  const N = reps.length;
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  const nowMs = now instanceof Date ? now.getTime() : now;
  if (N === 0) {
    return { date, status: "awaiting_data", low_confidence: true, headline: null, axis_pattern: null, weaknesses: [], total_reps: 0, generated_at };
  }

  // group by topic
  const byTopic = new Map();
  for (const r of reps) {
    const t = topicOf(r, reg);
    if (!byTopic.has(t)) byTopic.set(t, { reps: [], track: r.track });
    byTopic.get(t).reps.push(r);
  }

  let entries = [];
  for (const [topic, g] of byTopic) {
    const { sorted, misses } = analyzeTopic(g.reps, reg.loaded);
    if (!misses.length) continue;                    // no qualifying miss ⇒ not a weakness (never fabricate)
    const healed = isHealed(sorted, cfg);
    entries.push({
      id: slugify(topic), topic,
      recurrence: misses.length,                     // RAW int
      last_seen: isoDate(misses[misses.length - 1].ts),
      status: healed ? "closed" : "open",
      evidence: misses.map((m) => `${mmdd(m.ts)} ${m.type}`),
      axis: modeAxis(misses),                         // null for skill / no-axis / registry-absent
      score: round(scoreOf(misses, nowMs, cfg.recency_halflife_days)),
      _track: g.track,
    });
  }

  // prune long-stale CLOSED entries (open never pruned)
  entries = entries.filter((e) => e.status !== "closed" || (nowMs - Date.parse(e.last_seen)) / 86400000 <= cfg.closed_prune_days);

  // envelope health
  const status = N < cfg.warming_up_min_reps ? "warming_up" : "ok";
  const low_confidence = status !== "ok";

  // headline = highest-score OPEN weakness (floor signal; bias-to-silence ⇒ null if none)
  const open = entries.filter((e) => e.status === "open").sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const headline = open.length ? { id: open[0].id, topic: open[0].topic, axis: open[0].axis, one_line: headlineLine(open[0]) } : null;

  // axis_pattern = CEILING — volume-gated (total_reps ≥ warming_up_min_reps) + ≥ min distinct concepts on one axis
  let axis_pattern = null;
  if (N >= cfg.warming_up_min_reps) {
    const byAxis = new Map();
    for (const e of open) if (e._track === "concept" && e.axis) {
      if (!byAxis.has(e.axis)) byAxis.set(e.axis, new Set());
      byAxis.get(e.axis).add(e.topic);
    }
    let best = null;
    for (const [ax, set] of byAxis) {
      const cnt = set.size;
      if (cnt >= cfg.axis_cluster_min_concepts && (!best || cnt > best.cnt || (cnt === best.cnt && ax < best.axis))) {
        best = { axis: ax, cnt, concepts: [...set].sort() };
      }
    }
    if (best) axis_pattern = { axis: best.axis, concepts: best.concepts, strength: best.cnt, note: axisPatternNote(best.axis, best.concepts) };
  }

  // final weaknesses[]: open-first, then score desc — strip internal _track
  const weaknesses = entries
    .sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || b.score - a.score || a.id.localeCompare(b.id))
    .map((e) => ({ id: e.id, topic: e.topic, recurrence: e.recurrence, last_seen: e.last_seen, status: e.status, evidence: e.evidence, axis: e.axis, score: e.score }));

  return { date, status, low_confidence, headline, axis_pattern, weaknesses, total_reps: N, generated_at };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks (no real state touched)
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_such_config__");    // ⇒ DEFAULTS
  const REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: true };   // axis authority present
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const nowIso = "2026-08-01T09:00:00Z";
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  let T = 0;
  const at = (day) => new Date(Date.parse("2026-07-01T00:00:00Z") + day * 86400000 + (T++) * 60000).toISOString();
  const mk = (o) => ({ ts: o.ts || at(o.day ?? 0), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept", concept: o.concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "a"), question: o.q || `q${T}`, confidence: o.confidence || "knew", correct: !!o.correct });
  const find = (w, id) => w.weaknesses.find((e) => e.id === id);

  // 1) empty-safe
  const e0 = compute([], cfg, REG, now);
  assert("empty-safe: awaiting_data, weaknesses [], headline null", e0.status === "awaiting_data" && e0.weaknesses.length === 0 && e0.headline === null);

  // 2) relapse vs never-learned
  const m2 = [
    mk({ concept: "relapser", confidence: "shaky", correct: true, day: 0 }), mk({ concept: "relapser", confidence: "guessed", correct: false, day: 5 }), // correct→wrong = relapse
    ...[0, 1, 2].map((d) => mk({ concept: "neverlearned", confidence: "guessed", correct: false, day: d })), // always guessed-wrong ⇒ NOT (FSRS's)
  ];
  const r2 = compute(m2, cfg, REG, now);
  assert("relapse qualifies; always-guessed-wrong does NOT (FSRS)", !!find(r2, "relapser") && !find(r2, "neverlearned"));

  // 3) confident-wrong (knew+wrong, no prior) qualifies
  assert("confident-wrong (knew+wrong) qualifies", !!find(compute([mk({ concept: "cw", confidence: "knew", correct: false })], cfg, REG, now), "cw"));
  // 4) shaky-wrong qualifies
  assert("shaky-wrong qualifies (Calibration-excluded lands here)", !!find(compute([mk({ concept: "sw", confidence: "shaky", correct: false })], cfg, REG, now), "sw"));
  // 5) guessed-wrong-only does NOT
  assert("guessed-wrong-only does NOT qualify", !find(compute([mk({ concept: "gw", confidence: "guessed", correct: false })], cfg, REG, now), "gw"));

  // 6) recency-weighting: equal recurrence, recent out-ranks old (headline by score)
  const m6 = [
    mk({ concept: "recent", confidence: "knew", correct: false, ts: "2026-07-30T09:00:00Z" }), mk({ concept: "recent", confidence: "knew", correct: false, ts: "2026-07-31T09:00:00Z" }),
    mk({ concept: "oldone", confidence: "knew", correct: false, ts: "2026-06-01T09:00:00Z" }), mk({ concept: "oldone", confidence: "knew", correct: false, ts: "2026-06-02T09:00:00Z" }),
  ];
  const r6 = compute(m6, cfg, REG, now);
  assert("recency-weighting: recent out-ranks equal-count old (headline)", r6.headline?.topic === "recent" && find(r6, "recent").recurrence === 2 && find(r6, "oldone").recurrence === 2);

  // 7) id-stability across recomputes
  const idA = compute(m6, cfg, REG, now).weaknesses.find((e) => e.topic === "recent").id;
  const idB = compute(m6, cfg, REG, now).weaknesses.find((e) => e.topic === "recent").id;
  assert("id-stability: same topic ⇒ same slug id", idA === "recent" && idA === idB);

  // 8) recurrence RAW int, score separate float
  const e8 = find(r6, "recent");
  assert("recurrence is RAW int; score is a separate weighted float", Number.isInteger(e8.recurrence) && e8.recurrence === 2 && typeof e8.score === "number" && Math.abs(e8.score - e8.recurrence) > 1e-9);

  // 9) axis-cluster: 3 concepts on axis e ⇒ axis_pattern=e strength 3; mixed ⇒ null
  const relOn = (c, ax) => [mk({ concept: c, axis: ax, confidence: "knew", correct: true, day: 0 }), mk({ concept: c, axis: ax, confidence: "shaky", correct: false, day: 3 })];
  const filler = Array.from({ length: 14 }, (_, i) => mk({ concept: "filler", axis: "a", confidence: "knew", correct: true, day: 10 + i }));
  const clusterE = [...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e"), ...filler]; // N=20
  const r9 = compute(clusterE, cfg, REG, now);
  assert("axis-cluster: 3 concepts on e ⇒ axis_pattern e, strength 3", r9.axis_pattern?.axis === "e" && r9.axis_pattern?.strength === 3 && r9.axis_pattern.concepts.length === 3);
  const mixed = [...relOn("tokenization", "e"), ...relOn("chunking", "f"), ...relOn("retrieval", "c"), ...filler];
  assert("axis-cluster: mixed axes ⇒ axis_pattern null", compute(mixed, cfg, REG, now).axis_pattern === null);

  // 10) axis_pattern volume-gated (total_reps < warming_up_min_reps ⇒ null even with a cluster)
  const clusterNoVol = [...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e")]; // N=6 < 20
  assert("axis_pattern volume-gated: N<min_reps ⇒ null", compute(clusterNoVol, cfg, REG, now).axis_pattern === null);

  // 11) skill relapse ⇒ weakness, axis null, never in axis_pattern
  const r11 = compute([...clusterE, mk({ concept: "async", track: "skill", confidence: "knew", correct: true, day: 0 }), mk({ concept: "async", track: "skill", confidence: "shaky", correct: false, day: 4 })], cfg, REG, now);
  assert("skill relapse ⇒ weakness (axis null), not in axis_pattern", find(r11, "async")?.axis === null && !(r11.axis_pattern?.concepts || []).includes("async"));

  // 12) healed ⇒ status closed, retained, off headline
  const m12 = [
    mk({ concept: "healed", confidence: "knew", correct: true, day: 0 }), mk({ concept: "healed", confidence: "shaky", correct: false, day: 2 }), // relapse
    mk({ concept: "healed", confidence: "knew", correct: true, day: 5 }), mk({ concept: "healed", confidence: "knew", correct: true, day: 6 }), mk({ concept: "healed", confidence: "knew", correct: true, day: 7 }), // last 3 clean
  ];
  const r12 = compute(m12, cfg, REG, now);
  assert("healed ⇒ status closed, retained, not headline", find(r12, "healed")?.status === "closed" && r12.headline?.topic !== "healed");

  // 13) single-focus: one headline object (or null)
  assert("single-focus: exactly one headline object", r9.headline && typeof r9.headline === "object" && "id" in r9.headline);

  // 14) receipts non-empty
  assert("receipts: every real entry has non-empty evidence[]", r9.weaknesses.length > 0 && r9.weaknesses.every((e) => Array.isArray(e.evidence) && e.evidence.length > 0));

  // 15) schema: canonical keys present + typed
  const s = find(r9, "tokenization");
  assert("schema: {id,topic,recurrence,last_seen,status,evidence[]} present", typeof s.id === "string" && typeof s.topic === "string" && Number.isInteger(s.recurrence) && /^\d{4}-\d{2}-\d{2}$/.test(s.last_seen) && ["open", "closed"].includes(s.status) && Array.isArray(s.evidence));

  // 16) concepts.json absent ⇒ raw topic + axis null
  const r16 = compute([...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e"), ...filler], cfg, EMPTY_REG, now);
  assert("concepts.json absent ⇒ axis null + no axis_pattern", find(r16, "tokenization")?.axis === null && r16.axis_pattern === null);

  const passed = checks.every(([, ok]) => ok);
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
  writeAtomic(WEAK, out);
  const hl = out.headline ? out.headline.topic : "-";
  const ap = out.axis_pattern ? `axis ${out.axis_pattern.axis}×${out.axis_pattern.strength}` : "-";
  console.log(`nemesis: ${out.status} — weaknesses ${out.weaknesses.length} · headline ${hl} · axis_pattern ${ap}  →  ${WEAK}`);
  process.exit(0);
}

// Windows-safe entry guard (like fsrs.mjs / calibration.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, analyzeTopic, isHealed, scoreOf, loadReps, loadConfig, loadRegistry, topicOf, slugify };
