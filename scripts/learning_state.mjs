#!/usr/bin/env node
// ============================================================================
// learning_state.mjs · ARSENAL AI FC — AGENT #4: LEARNING-STATE (the Maidan)
// ----------------------------------------------------------------------------
// WHAT:  The fluency / positional map — per concept & skill fluency-state
//        (🔴🟡🟢), velocity/trajectory, per-axis rollup, Re-Jirah decay-due,
//        edge-map, confusion-pairs, and the Maidan field-formation. The learning
//        layer's positional read for the Manager. CONSUMER only (never writes reps).
// WHY:   FSRS says WHEN to review, Calibration says how HONEST, Nemesis says the
//        recurring KIND-of-thinking. Learning-state says WHERE you stand and which
//        way you're moving — the shape, so the Manager can pick the sharpest block.
//
// NIDHI BOUNDARY (law): tracks OUTCOMES / STATE only (WHAT/SHAPE/INTENSITY/DONE).
//   HOW you learn — pedagogy, drill mechanics, learning-order — is UNTOUCHED.
//   v0 SEED: stage/handoff STRUCTURE is real domain architecture; the fluency/runnable
//   THRESHOLDS are v0 hypotheses in config, calibrated at first R1 run (lossless re-run).
//
// INPUTS (reads-only; each missing ⇒ graceful skip, never crash):
//   reps_log.jsonl          — fluency, velocity, edge, confusions (BOTH tracks)
//   fsrs_store.json         — per-card `due` → rejirah_due (decay stays FSRS-owned; we only join axis)
//   concepts.json           — axis authority + bucket + `core` flag + canonicalize
//   learning_state_config.json — thresholds + Maidan structure (missing ⇒ built-in defaults)
//
// OUTPUT: dressing-room/state/learning_state.json (single writer; gitignored — derived PII).
//   Manager §10 surface fields (maidan_stage_focus, weak_connection, python_fluency,
//   rejirah_due, core_vs_light) + rich additive (concepts[], axes[], maidan{}).
//
// FLUENCY LADDER: 🔴 learning → 🟡 held (≥held_streak consecutive correct) →
//   🟢 fluent (≥fluent_streak consecutive COLD-FAST). cold-fast = correct ∧ knew ∧
//   (latency ≤ fast | latency absent) ∧ (skill ⇒ aided:false). A miss resets toward 🔴;
//   a correct-but-slow rep drops 🟢→🟡 (held ≠ fluent). aided:true never earns skill 🟢.
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic write (temp→rename) · empty-safe · never fabricate · matches house style.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG   = join(STATE_DIR, "reps_log.jsonl");
const FSRS_STORE = join(STATE_DIR, "fsrs_store.json");
const CONCEPTS   = join(STATE_DIR, "concepts.json");
const CFG_PATH   = join(STATE_DIR, "learning_state_config.json");
const OUT        = join(STATE_DIR, "learning_state.json");

const DEFAULTS = {
  thresholds: { held_streak: 2, fluent_streak: 3, latency_fast_ms: 8000, stage_runnable_frac: 0.75, warming_up_min_reps: 12, stall_reps: 6 },
  maidan: {
    stages: [
      { id: "fundamentals", label: "Fundamentals", order: 1, concepts: ["tokenization"] },
      { id: "rag_pipeline", label: "RAG pipeline", order: 2, concepts: ["chunking", "embeddings", "retrieval", "rag_eval"] },
      { id: "agents", label: "Agents", order: 3, concepts: ["tool_use"] },
    ],
    handoffs: [
      { from: "tokenization", to: "embeddings", label: "text → vectors" },
      { from: "chunking", to: "embeddings", label: "chunks → vectors" },
      { from: "embeddings", to: "retrieval", label: "vectors → top-k" },
      { from: "retrieval", to: "rag_eval", label: "results → eval" },
    ],
  },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const numOr = (x, d) => (typeof x === "number" && !Number.isNaN(x) ? x : d);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const isoDate = (ts) => String(ts).slice(0, 10);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const RANK  = { learning: 0, held: 1, fluent: 2 };
const LABEL = { learning: "🔴 learning", held: "🟡 held", fluent: "🟢 fluent" };
const EMOJI = { learning: "🔴", held: "🟡", fluent: "🟢" };

function loadConfig(path = CFG_PATH) {
  const d = DEFAULTS;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      const t = j.thresholds || {};
      return {
        thresholds: {
          held_streak: numOr(t.held_streak, d.thresholds.held_streak),
          fluent_streak: numOr(t.fluent_streak, d.thresholds.fluent_streak),
          latency_fast_ms: numOr(t.latency_fast_ms, d.thresholds.latency_fast_ms),
          stage_runnable_frac: numOr(t.stage_runnable_frac, d.thresholds.stage_runnable_frac),
          warming_up_min_reps: numOr(t.warming_up_min_reps, d.thresholds.warming_up_min_reps),
          stall_reps: numOr(t.stall_reps, d.thresholds.stall_reps),
        },
        maidan: (j.maidan && Array.isArray(j.maidan.stages)) ? j.maidan : d.maidan,
      };
    }
  } catch { /* malformed ⇒ defaults */ }
  return JSON.parse(JSON.stringify(d));
}

function loadRegistry(path = CONCEPTS) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), axes: {}, conceptMeta: {}, skillMeta: {}, loaded: false };
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      reg.axes = j.axes || {};
      for (const [id, def] of Object.entries(j.concepts || {})) { reg.conceptMeta[id] = def || {}; reg.conceptAlias.set(normText(id), id); for (const a of (def?.aliases || [])) reg.conceptAlias.set(normText(a), id); }
      for (const [id, def] of Object.entries(j.skills || {})) { reg.skillMeta[id] = def || {}; reg.skillAlias.set(normText(id), id); for (const a of (def?.aliases || [])) reg.skillAlias.set(normText(a), id); }
      reg.loaded = true;
    }
  } catch { /* malformed ⇒ loaded false */ }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), axes: {}, conceptMeta: {}, skillMeta: {}, loaded: false };

const canonId = (r, reg) => {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
};
const coreOf = (id, track, reg) => ((track === "skill" ? reg.skillMeta[id] : reg.conceptMeta[id])?.core === true);
const axisLabel = (reg, ax) => (ax ? (reg.axes[ax] ? `${ax} (${reg.axes[ax]})` : ax) : null);

function validRep(r) {
  return r && typeof r === "object" && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && CONF.has(r.confidence) && typeof r.correct === "boolean"
    && typeof r.concept === "string" && r.concept.trim() !== "" && TRACKS.has(r.track);
}
function loadReps(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const s = line.trim(); if (!s) continue; try { const o = JSON.parse(s); if (validRep(o)) out.push(o); } catch { /* skip */ } }
  return out;
}
function loadFsrsCards(path = FSRS_STORE) {
  try { if (existsSync(path)) { const j = JSON.parse(readFileSync(path, "utf8")); if (Array.isArray(j.cards)) return j.cards; } } catch { /* skip */ }
  return [];
}
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// per-id fluency + velocity (reps of ONE id, any order)
// ---------------------------------------------------------------------------
function isColdFast(r, cfg) {
  const latOK = (r.latency_ms == null) || (r.latency_ms <= cfg.thresholds.latency_fast_ms);
  const aidedOK = (r.track === "concept") || (r.aided === false);     // aided-gating: skill 🟢 needs aided:false
  return r.correct && r.confidence === "knew" && latOK && aidedOK;
}
function idFluency(reps, cfg) {
  const sorted = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const states = [];
  let correctStreak = 0, coldFastStreak = 0;
  for (const r of sorted) {
    if (!r.correct) { correctStreak = 0; coldFastStreak = 0; }
    else { correctStreak++; if (isColdFast(r, cfg)) coldFastStreak++; else coldFastStreak = 0; }
    states.push(coldFastStreak >= cfg.thresholds.fluent_streak ? "fluent" : correctStreak >= cfg.thresholds.held_streak ? "held" : "learning");
  }
  const n = states.length;
  const final = n ? states[n - 1] : "learning";
  // reps_to_state = 1-based index where the final contiguous run began
  let k = n - 1; while (k >= 0 && states[k] === final) k--;
  const reps_to_state = n ? (k + 2) : 0;
  // velocity
  const ranks = states.map((s) => RANK[s]);
  const maxBefore = ranks.slice(0, -1).reduce((m, x) => Math.max(m, x), -1);
  let lastAdvance = -1; for (let i = 1; i < n; i++) if (ranks[i] > ranks[i - 1]) lastAdvance = i;
  const repsSinceAdvance = lastAdvance < 0 ? n : (n - 1 - lastAdvance);
  const finalRank = n ? ranks[n - 1] : 0;
  const regressing = finalRank < maxBefore;
  const stalled = !regressing && finalRank < 2 && repsSinceAdvance >= cfg.thresholds.stall_reps;
  const slope = regressing ? "regressing" : stalled ? "stalling" : (lastAdvance >= 0 && repsSinceAdvance < cfg.thresholds.stall_reps) ? "improving" : "holding";
  // dominant miss/rep axis (concept-track, non-null)
  const axc = {}; for (const r of sorted) if (r.track === "concept" && r.axis) axc[r.axis] = (axc[r.axis] || 0) + 1;
  const domAxis = Object.entries(axc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
  // latest edge
  let edge = null; for (const r of sorted) if (r.edge != null) edge = r.edge;
  return { state: final, reps: n, last_seen: n ? isoDate(sorted[n - 1].ts) : null, velocity: { slope, reps_to_state, stalled }, domAxis, edge };
}

// ---------------------------------------------------------------------------
// full compute
// ---------------------------------------------------------------------------
function compute(reps, fsrsCards, reg, cfg, now) {
  const N = reps.length;
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  const nowMs = (now instanceof Date ? now.getTime() : now);
  const th = cfg.thresholds;

  // Maidan skeleton from config (canon structure — present even when empty)
  const stageSkeleton = () => (cfg.maidan.stages || []).map((s) => ({ id: s.id, label: s.label, concepts: s.concepts.slice(), runnable_frac: 0, status: "awaiting_data" }));

  if (N === 0) {
    return {
      date, generated_at, total_reps: 0, status: "awaiting_data", low_confidence: true,
      maidan_stage_focus: null, weak_connection: null, python_fluency: {}, rejirah_due: [], core_vs_light: {},
      concepts: [], axes: [],
      maidan: { stages: stageSkeleton(), handoffs: (cfg.maidan.handoffs || []).map((h) => ({ from: h.from, to: h.to, combined_fluency: EMOJI.learning })) },
    };
  }

  // group reps by canonical id
  const byId = new Map();
  for (const r of reps) { const id = canonId(r, reg); if (!byId.has(id)) byId.set(id, { track: r.track, reps: [] }); byId.get(id).reps.push(r); }
  const fl = new Map();
  for (const [id, g] of byId) fl.set(id, { track: g.track, core: coreOf(id, g.track, reg), ...idFluency(g.reps, cfg) });

  // confusion-pairs (global) + attach per concept
  const pairCount = new Map();
  for (const r of reps) if (r.confused_with != null) { const from = canonId(r, reg); const key = `${from}␟${r.confused_with}`; pairCount.set(key, (pairCount.get(key) || 0) + 1); }
  const confusion_pairs = [...pairCount.entries()].map(([k, count]) => { const [from, to] = k.split("␟"); return { from, to, count }; }).sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));

  // concepts[] (track concept)
  const concepts = [];
  for (const [id, f] of fl) if (f.track === "concept") {
    concepts.push({
      id, track: "concept", axis: f.domAxis, fluency: LABEL[f.state], core: f.core, reps: f.reps, last_seen: f.last_seen,
      velocity: f.velocity, edge: f.edge,
      confusions: confusion_pairs.filter((p) => p.from === id).map((p) => ({ with: p.to, count: p.count })),
    });
  }
  concepts.sort((a, b) => (RANK[b.fluency.split(" ")[1] === "fluent" ? "fluent" : b.fluency.includes("held") ? "held" : "learning"] - RANK[a.fluency.split(" ")[1] === "fluent" ? "fluent" : a.fluency.includes("held") ? "held" : "learning"]) || a.id.localeCompare(b.id));

  // python_fluency (track skill)
  const python_fluency = {};
  for (const [id, f] of fl) if (f.track === "skill") python_fluency[id] = LABEL[f.state];

  // per-axis rollup (concept-track)
  const axisConcepts = {};   // axis -> Set of concept ids
  for (const r of reps) if (r.track === "concept" && r.axis) { (axisConcepts[r.axis] ||= new Set()).add(canonId(r, reg)); }
  // rejirah_due (join fsrs due<now + concept dominant axis)
  const rejirah_due = [];
  for (const c of fsrsCards) {
    if (!c || c.due == null) continue;
    const dueMs = Date.parse(c.due); if (Number.isNaN(dueMs) || dueMs >= nowMs) continue;
    const id = c.id || normText(c.concept || "");
    const f = fl.get(id);
    rejirah_due.push({ concept: c.concept ?? id, axis: axisLabel(reg, f?.domAxis || null), overdue_days: Math.floor((nowMs - dueMs) / 86400000) });
  }
  rejirah_due.sort((a, b) => b.overdue_days - a.overdue_days);
  const dueCountByAxis = {}; for (const c of fsrsCards) { if (!c || c.due == null) continue; const dueMs = Date.parse(c.due); if (Number.isNaN(dueMs) || dueMs >= nowMs) continue; const f = fl.get(c.id || normText(c.concept || "")); if (f?.domAxis) dueCountByAxis[f.domAxis] = (dueCountByAxis[f.domAxis] || 0) + 1; }

  const axes = [];
  for (const ax of Object.keys(axisConcepts).sort()) {
    const ids = [...axisConcepts[ax]];
    const counts = { learning: 0, held: 0, fluent: 0 };
    for (const id of ids) counts[fl.get(id)?.state || "learning"]++;
    const total = ids.length;
    axes.push({ axis: ax, label: reg.axes[ax] || null, fluent_frac: total ? round(counts.fluent / total) : 0, counts, due_count: dueCountByAxis[ax] || 0 });
  }

  // edge-map
  const edge_map = {};
  for (const [id, f] of fl) if (f.track === "concept" && f.edge != null) edge_map[id] = f.edge;

  // Maidan stages + handoffs
  const stateEmojiOf = (id) => EMOJI[fl.get(id)?.state || "learning"];
  const rankOf = (id) => RANK[fl.get(id)?.state || "learning"];
  const stages = (cfg.maidan.stages || []).map((s) => {
    const members = s.concepts;
    const withReps = members.filter((id) => fl.has(id));
    const fluent = members.filter((id) => fl.get(id)?.state === "fluent").length;
    const runnable_frac = members.length ? round(fluent / members.length) : 0;
    const status = runnable_frac >= th.stage_runnable_frac ? "runnable" : (withReps.length ? "building" : "awaiting_data");
    return { id: s.id, label: s.label, concepts: members.slice(), runnable_frac, status };
  });
  const handoffs = (cfg.maidan.handoffs || []).map((h) => ({ from: h.from, to: h.to, label: h.label, combined_fluency: EMOJI[Object.keys(RANK).find((k) => RANK[k] === Math.min(rankOf(h.from), rankOf(h.to)))] }));
  // weak_connection = lowest combined; prefer both-core spine
  let weakHandoff = null;
  for (const h of (cfg.maidan.handoffs || [])) {
    const combined = Math.min(rankOf(h.from), rankOf(h.to));
    const bothCore = coreOf(h.from, "concept", reg) && coreOf(h.to, "concept", reg);
    const cand = { h, combined, bothCore };
    if (!weakHandoff || combined < weakHandoff.combined || (combined === weakHandoff.combined && bothCore && !weakHandoff.bothCore)) weakHandoff = cand;
  }
  let weak_connection = weakHandoff ? `${weakHandoff.h.from} → ${weakHandoff.h.to} (${weakHandoff.h.label})` : null;
  let maidan_stage_focus = weakHandoff ? `${weakHandoff.h.from} → ${weakHandoff.h.to} handoff` : null;

  // core_vs_light (concepts with reps)
  const conceptFl = [...fl.entries()].filter(([, f]) => f.track === "concept");
  const coreIds = conceptFl.filter(([, f]) => f.core);
  const lightIds = conceptFl.filter(([, f]) => !f.core);
  const fluentFrac = (arr) => `${arr.filter(([, f]) => f.state === "fluent").length}/${arr.length} fluent`;
  const core_vs_light = {
    core: coreIds.length ? `spine: ${fluentFrac(coreIds)}` : "spine: no reps yet",
    light: lightIds.length ? fluentFrac(lightIds) : "no light concepts drilled",
  };

  // envelope health + bias-to-silence
  const status = N < th.warming_up_min_reps ? "warming_up" : "ok";
  const low_confidence = status !== "ok";
  if (low_confidence) { weak_connection = null; maidan_stage_focus = null; }   // suppress headline until enough data

  return {
    date, generated_at, total_reps: N, status, low_confidence,
    maidan_stage_focus, weak_connection, python_fluency, rejirah_due, core_vs_light,
    edge_map, confusion_pairs,
    concepts, axes,
    maidan: { stages, handoffs },
  };
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_cfg__");            // ⇒ DEFAULTS
  const reg = loadRegistry("__no_reg__");          // start with NO registry (graceful path)
  // a loaded registry for axis/core tests
  const REG = { conceptAlias: new Map(), skillAlias: new Map(), axes: { e: "limits/failure-modes", f: "tradeoffs" }, conceptMeta: { chunking: { core: true }, embeddings: { core: true }, retrieval: { core: true }, rag_eval: { core: true }, tokenization: { core: true } }, skillMeta: { pydantic: { core: true } }, loaded: true };
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const nowMs = now.getTime();
  const checks = [];
  const assert = (n, c) => { checks.push([n, !!c]); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  let T = 0;
  const ts = (d = 0) => new Date(Date.parse("2026-07-01T00:00:00Z") + d * 86400000 + (T++) * 60000).toISOString();
  const rp = (o) => ({ ts: ts(o.day), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept", concept: o.concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "f"), question: `q${T}`, confidence: o.confidence || "knew", correct: o.correct !== false, latency_ms: ("lat" in o) ? o.lat : null, aided: ("aided" in o) ? o.aided : (o.track === "skill" ? false : null), confused_with: o.confused_with ?? null, edge: o.edge ?? null });
  const cf = (concept, over = {}) => rp({ concept, confidence: "knew", correct: true, lat: 100, ...over });        // cold-fast
  const findC = (o, id) => o.concepts.find((c) => c.id === id);

  // 1) empty-safe
  const e0 = compute([], [], REG, cfg, now);
  assert("empty-safe: awaiting_data, lists empty, maidan skeleton present", e0.status === "awaiting_data" && e0.concepts.length === 0 && e0.rejirah_due.length === 0 && e0.maidan.stages.length === 3 && e0.maidan.stages[0].status === "awaiting_data");

  // 2) fluency ladder: 3 cold-fast ⇒ 🟢
  assert("fluency ladder: cold-fast streak ⇒ 🟢 fluent", findC(compute([cf("chunking"), cf("chunking"), cf("chunking")], [], REG, cfg, now), "chunking")?.fluency === "🟢 fluent");
  // 3) held≠fluent: correct-but-SLOW stays 🟡
  assert("held≠fluent: correct-but-slow ⇒ 🟡 held", findC(compute([rp({ concept: "chunking", lat: 20000 }), rp({ concept: "chunking", lat: 20000 }), rp({ concept: "chunking", lat: 20000 })], [], REG, cfg, now), "chunking")?.fluency === "🟡 held");
  // 4) regression: a miss drops the state
  assert("regression: miss after fluent drops state", findC(compute([cf("chunking"), cf("chunking"), cf("chunking"), rp({ concept: "chunking", correct: false, confidence: "shaky" })], [], REG, cfg, now), "chunking")?.fluency === "🔴 learning");
  // 5) aided-gating: skill fluent requires aided:false
  const skAided = compute([cf("pydantic", { track: "skill", aided: true }), cf("pydantic", { track: "skill", aided: true }), cf("pydantic", { track: "skill", aided: true })], [], REG, cfg, now);
  assert("aided-gating: aided:true streak ⇒ NOT 🟢 (skill)", skAided.python_fluency.pydantic !== "🟢 fluent");
  assert("aided-gating: aided:false streak ⇒ 🟢 (skill)", compute([cf("pydantic", { track: "skill", aided: false }), cf("pydantic", { track: "skill", aided: false }), cf("pydantic", { track: "skill", aided: false })], [], REG, cfg, now).python_fluency.pydantic === "🟢 fluent");
  // 6) latency-absent path: knew+correct ⇒ 🟢 via proxy
  assert("latency-absent: knew+correct streak ⇒ 🟢", findC(compute([rp({ concept: "chunking" }), rp({ concept: "chunking" }), rp({ concept: "chunking" })], [], REG, cfg, now), "chunking")?.fluency === "🟢 fluent");
  // 7) velocity: improving vs stalling
  const impr = findC(compute([rp({ concept: "chunking", correct: false }), cf("chunking"), cf("chunking")], [], REG, cfg, now), "chunking");
  assert("velocity: improving detected", impr?.velocity.slope === "improving");
  const stall = findC(compute(Array.from({ length: 7 }, () => rp({ concept: "chunking", correct: false, confidence: "guessed" })), [], REG, cfg, now), "chunking");
  assert("velocity: stalling detected (no advance in stall_reps)", stall?.velocity.slope === "stalling" && stall.velocity.stalled === true);
  // 8) per-axis rollup counts + fluent_frac
  const axmock = compute([...[cf("chunking"), cf("chunking"), cf("chunking")], rp({ concept: "retrieval", axis: "f", correct: true }), rp({ concept: "retrieval", axis: "f", correct: false })], [], REG, cfg, now);
  const axf = axmock.axes.find((a) => a.axis === "f");
  assert("per-axis rollup: counts + fluent_frac", axf && axf.counts.fluent === 1 && axf.counts.learning === 1 && Math.abs(axf.fluent_frac - 0.5) < 1e-9);
  // 9) rejirah_due: overdue + axis join; fsrs_store missing ⇒ []
  const cards = [{ id: "retrieval", concept: "retrieval", due: "2026-07-30T00:00:00Z" }];   // 2 days before now
  const rj = compute([rp({ concept: "retrieval", axis: "e", correct: true }), rp({ concept: "retrieval", axis: "e", correct: false })], cards, REG, cfg, now).rejirah_due;
  assert("rejirah_due: overdue_days + axis label from join", rj.length === 1 && rj[0].overdue_days === 2 && rj[0].axis === "e (limits/failure-modes)");
  assert("rejirah_due: fsrs_store missing ⇒ []", compute([cf("chunking")], [], REG, cfg, now).rejirah_due.length === 0);
  // 10) edge-map: latest edge per concept wins
  const em = compute([rp({ concept: "chunking", edge: "old edge" }), rp({ concept: "chunking", edge: "newest edge" })], [], REG, cfg, now);
  assert("edge-map: latest edge wins", em.edge_map.chunking === "newest edge");
  // 11) confusion-pairs: counts + rank
  const cp = compute([rp({ concept: "chunking", correct: false, confused_with: "tokenization" }), rp({ concept: "chunking", correct: false, confused_with: "tokenization" }), rp({ concept: "retrieval", correct: false, confused_with: "embeddings" })], [], REG, cfg, now);
  assert("confusion-pairs: counted + ranked", cp.confusion_pairs[0].from === "chunking" && cp.confusion_pairs[0].to === "tokenization" && cp.confusion_pairs[0].count === 2);
  assert("confusion-pairs attached to concept entry", findC(cp, "chunking").confusions[0]?.with === "tokenization");
  // 12) Maidan: runnable_frac + weak_connection derivation (need ok: ≥warming_up_min_reps)
  const big = [];
  for (const c of ["chunking", "embeddings", "retrieval", "rag_eval"]) { big.push(cf(c), cf(c), cf(c)); }   // all 4 fluent, 12 reps
  const mv = compute(big, [], REG, cfg, now);
  assert("Maidan: full stage ⇒ runnable", mv.maidan.stages.find((s) => s.id === "rag_pipeline").status === "runnable" && mv.maidan.stages.find((s) => s.id === "rag_pipeline").runnable_frac === 1);
  assert("Maidan: weak_connection surfaces at ok volume", typeof mv.weak_connection === "string" && typeof mv.maidan_stage_focus === "string");
  // 13) warming_up suppresses headline
  const wu = compute([cf("chunking"), cf("chunking"), cf("chunking")], [], REG, cfg, now);
  assert("warming_up: <min_reps ⇒ low_confidence + weak_connection null (suppressed)", wu.status === "warming_up" && wu.low_confidence === true && wu.weak_connection === null);
  // 14) Manager surface fields present + §10 shape
  assert("Manager surface fields present", ["maidan_stage_focus", "weak_connection", "python_fluency", "rejirah_due", "core_vs_light"].every((k) => k in mv) && typeof mv.core_vs_light.core === "string");
  // 15) concepts.json / config missing ⇒ graceful (raw ids, no crash, no axis label)
  const g = compute([cf("brandnew"), cf("brandnew"), cf("brandnew")], [{ id: "brandnew", concept: "brandnew", due: "2026-07-30T00:00:00Z" }], EMPTY_REG, cfg, now);
  assert("registry missing ⇒ graceful (raw id, bare axis letter, no crash)", findC(g, "brandnew")?.fluency === "🟢 fluent" && g.rejirah_due[0]?.axis === "f");

  const passed = checks.every(([, c]) => c);
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
  const cards = loadFsrsCards();
  const out = compute(reps, cards, reg, cfg, new Date());
  writeAtomic(OUT, out);
  console.log(`learning-state: ${out.status} — concepts ${out.concepts.length} · skills ${Object.keys(out.python_fluency).length} · due ${out.rejirah_due.length} · focus ${out.maidan_stage_focus || "-"}  →  ${OUT}`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, idFluency, isColdFast, loadReps, loadConfig, loadRegistry, loadFsrsCards };
