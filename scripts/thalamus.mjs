#!/usr/bin/env node
// ============================================================================
// thalamus.mjs · ARSENAL AI FC — THE THALAMUS (the relay nucleus + reticular gate)
// ----------------------------------------------------------------------------
// WHAT:  The one organ the body was missing (CYBORG_BRAIN.md §4): a persistent
//        localhost daemon on :4113 where EVERY sense lands — voice turns from
//        the Dugout, vision frame-hashes, bus deltas (a new rep, a Governor
//        transition, a due card, a Twin market resolving). It BINDS co-temporal
//        events into single "moments" (window B≈900ms, winner-take-all
//        spotlight), scores each moment's SALIENCE deterministically
//        (microseconds, zero-LLM), and rations the two brains on a ladder:
//          S < τ0                 → TIER-0  reflex already handled it (free)
//          τ0 ≤ S < τ1_eff        → TIER-1  enrichment lane (free)
//          S ≥ τ1_eff (+ gates)   → TIER-2  WAKE OPUS via wake.json → cortex.mjs
//          |S − τ1_eff| < ε       → ONE tiny-model adjudication, at most once
//        BUDGET COUPLING: τ1_eff = τ1_base + k·(1 − window_headroom_frac) from
//        brain.mjs's REAL ledger (the same guarded observed_window_ceiling) —
//        when the Claude window runs low the wake bar rises by itself.
// SALIENCE (§4.3):
//        S = clamp01(wpe·PE + wnov·NOV + wgov·GOV + werr·ERR + wself·SELF
//                    + wdead·DEAD − whab·HAB)
//        PE   Shannon surprisal −log2(p_obs) vs the Twin's book (or base rate)
//        NOV  unseen concept token / first-time confusion pair
//        GOV  Governor transition magnitude (readiness.json READ-ONLY — the
//             medical clamp: biometrics weight ATTENTION, never drive verdicts)
//        ERR  a "knew" rep that came back wrong — the calibration break
//        SELF the captain names a doubt out loud
//        DEAD a due card / staged scrimmage (time-pressure as salience)
//        HAB  per-(modality,signal_key) exponential habituation — a flapping
//             Governor or a repeated frame CANNOT re-fire the deep brain
//        EXCLUDED BY CONSTRUCTION: prosody, tone, emotion, agitation — any such
//        field is STRIPPED at the door before an event even lands in the log.
// LAWS:  single writer — this file alone writes afferent.jsonl · workspace.json
//        · salience_ledger.jsonl · wake.json (cortex answers arrive THROUGH
//        :4113/deep-answer, never as a file write). All four are gitignored
//        (they carry his words/moments; the public repo holds machinery only).
//        The gate decides what gets THOUGHT ABOUT, never what gets SAID —
//        outbound speech still passes the shadow ratify-gate + win-only law.
//        No metered key: the adjudicator rides the free Gemini pool; the deep
//        lane is claude -p (Max) in cortex.mjs. Localhost only.
// MODES: node scripts/thalamus.mjs            → daemon on http://127.0.0.1:4113
//        node scripts/thalamus.mjs selftest   → deterministic bar (§4.7)
//        node scripts/thalamus.mjs status     → workspace + today's gate ledger
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync, watch } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "thalamus_config.json");
const AFFERENT  = join(STATE_DIR, "afferent.jsonl");
const WORKSPACE = join(STATE_DIR, "workspace.json");
const SLEDGER   = join(STATE_DIR, "salience_ledger.jsonl");
const WAKE      = join(STATE_DIR, "wake.json");
const PORT = 4113;                                  // one below the Dugout's 4114

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const DEFAULT_CONFIG = {
  // calibrated so: a voiced doubt on a fresh concept (self+nov) or a
  // confident-wrong rep on a fresh concept (err+nov) crosses τ1 → wake;
  // a Governor flip or due-card alone NEVER wakes opus (attention, not verdict)
  weights: { pe: 0.35, nov: 0.20, gov: 0.25, err: 0.45, self: 0.45, dead: 0.15, hab: 0.40 },
  tiers: { tau0: 0.25, tau1_base: 0.55, epsilon: 0.08, budget_k: 0.35 },
  binding_ms: 900,
  refractory_min: 45,
  wake_cap_per_day: 15,
  hab: { tau_ms: 600000, saturation: 4 },
  pe: { norm_bits: 4, base_rates: { default: 0.5 } },
  adjudicator: { model: "gemini-flash-lite-latest", enabled: true },
  deep: { deadline_ms: 45000, min_headroom_tokens: 50000, max_thinking_tokens: 16000, timeout_ms: 300000 },
  self_markers: ["i don't get", "don't understand", "samajh nahi", "samajh nahin", "confus", "kyun nahi aata", "stuck hoon", "atka hua", "doubt hai", "yeh kaise", "wait, why", "wait why", "makes no sense"],
};
function loadConfig() {
  const c = readJson(CONFIG);
  if (!c) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...c, weights: { ...DEFAULT_CONFIG.weights, ...(c.weights || {}) }, tiers: { ...DEFAULT_CONFIG.tiers, ...(c.tiers || {}) }, hab: { ...DEFAULT_CONFIG.hab, ...(c.hab || {}) }, pe: { ...DEFAULT_CONFIG.pe, ...(c.pe || {}) } };
}

// ---------------------------------------------------------------------------
// THE DOOR — sanitation. The affect firewall's first brick: no prosody/emotion
// field may even ENTER the nucleus. Stripped before logging, scoring, binding.
// ---------------------------------------------------------------------------
const AFFECT_FIELDS = ["prosody", "emotion", "tone", "affect", "stress", "agitation", "mood", "sentiment"];
function sanitizeAfferent(evt) {
  const e = { ...evt };
  for (const k of Object.keys(e)) if (AFFECT_FIELDS.includes(k.toLowerCase())) delete e[k];
  return e;
}

// ---------------------------------------------------------------------------
// SALIENCE COMPONENTS — each ∈ [0,1], deterministic, zero-LLM
// ---------------------------------------------------------------------------
function surprisalPE(pObs, normBits) { return clamp01(-Math.log2(Math.max(1e-6, Math.min(1, pObs))) / normBits); }

function computeComponents(evt, ctx) {
  // ctx: { cfg, markets(id→p), seen:Set, hab:Map, now }
  const { cfg } = ctx;
  const comps = { pe: 0, nov: 0, gov: 0, err: 0, self: 0, dead: 0, hab: 0 };

  // PE — the Twin's book first; Laplace base-rate table second
  if (evt.market_id && ctx.markets && ctx.markets[evt.market_id] !== undefined) {
    const p = ctx.markets[evt.market_id];
    const pObs = evt.observed === false ? 1 - p : p;
    comps.pe = surprisalPE(pObs, cfg.pe.norm_bits);
  } else if (evt.p_obs !== undefined) {           // pre-resolved probability (slip rows)
    comps.pe = surprisalPE(evt.p_obs, cfg.pe.norm_bits);
  } else if (evt.event_key) {
    const base = cfg.pe.base_rates[evt.event_key] ?? cfg.pe.base_rates.default;
    comps.pe = surprisalPE(evt.observed === false ? 1 - base : base, cfg.pe.norm_bits) * 0.5; // base-rate PE is weak evidence
  }

  // NOV — unseen concept / first-time confusion pair
  const tokens = Array.isArray(evt.concept_tokens) ? evt.concept_tokens.map(t => String(t).toLowerCase()) : [];
  if (tokens.some(t => !ctx.seen.has(t))) comps.nov = 1;
  if (evt.confused_with && !ctx.seen.has(`pair:${String(evt.confused_with).toLowerCase()}`)) comps.nov = 1;

  // GOV — transition magnitude only; readiness is READ-ONLY attention weight
  if (evt.gov_from && evt.gov_to && evt.gov_from !== evt.gov_to) {
    comps.gov = (evt.gov_from === "RED" || evt.gov_to === "RED") ? 1 : 0.5;
  }

  // ERR — the calibration break (confident-and-wrong is the most teachable instant)
  if (evt.rep && evt.rep.correct === false) {
    comps.err = evt.rep.confidence === "knew" ? 1 : evt.rep.confidence === "shaky" ? 0.4 : 0.15;
  }

  // SELF — he names the doubt
  const text = String(evt.text || "").toLowerCase();
  if (evt.modality === "voice" && text && cfg.self_markers.some(m => text.includes(m))) comps.self = 1;

  // DEAD — due work as time-pressure (voicing still obeys the humane clamp)
  if (Number.isFinite(evt.due_count) && evt.due_count > 0) comps.dead = clamp01(evt.due_count / 5);
  if (evt.staged_scrimmage) comps.dead = 1;

  // VISION — a changed surface carries novelty proportional to how much changed
  if (evt.modality === "vision" && Number.isFinite(evt.hamming)) comps.nov = Math.max(comps.nov, clamp01(evt.hamming / 24));

  // HAB — exponential habituation per (modality, signal_key)
  const key = signalKey(evt);
  const h = ctx.hab.get(key);
  if (h) {
    const dt = Math.max(0, ctx.now - h.ts);
    const decayed = h.h * Math.exp(-dt / cfg.hab.tau_ms);
    comps.hab = clamp01(decayed / cfg.hab.saturation);
  }
  return comps;
}
function salience(comps, w) {
  return clamp01(w.pe * comps.pe + w.nov * comps.nov + w.gov * comps.gov + w.err * comps.err + w.self * comps.self + w.dead * comps.dead - w.hab * comps.hab);
}
function signalKey(evt) {
  if (evt.event_key) return `${evt.modality}:${evt.event_key}`;
  if (evt.modality === "vision") return `vision:${evt.kind || "screen"}`;
  const t = Array.isArray(evt.concept_tokens) && evt.concept_tokens.length ? evt.concept_tokens[0] : String(evt.text || "").slice(0, 40);
  return `${evt.modality}:${String(t).toLowerCase()}`;
}

// budget coupling — the wake bar rises as the real Claude window drains
function tau1Effective(cfg, headroomFrac) {
  return cfg.tiers.tau1_base + cfg.tiers.budget_k * (1 - clamp01(headroomFrac));
}

// ---------------------------------------------------------------------------
// THE NUCLEUS — binding + gate. Pure-ish: every side effect goes through deps,
// so the selftest drives it with an injected clock and captured writes.
// ---------------------------------------------------------------------------
function createNucleus(cfg, deps = {}) {
  const D = {
    now: deps.now || (() => Date.now()),
    appendAfferent: deps.appendAfferent || ((row) => appendFileSync(AFFERENT, JSON.stringify(row) + "\n")),
    appendLedger: deps.appendLedger || ((row) => appendFileSync(SLEDGER, JSON.stringify(row) + "\n")),
    writeWorkspace: deps.writeWorkspace || ((o) => writeAtomic(WORKSPACE, o)),
    writeWake: deps.writeWake || ((o) => writeAtomic(WAKE, o)),
    markets: deps.markets || (() => { const t = readJson(join(STATE_DIR, "twin.json")); const m = {}; for (const mk of (t && t.markets) || []) m[mk.id] = mk.p; return m; }),
    headroomFrac: deps.headroomFrac || defaultHeadroomFrac,
    adjudicate: deps.adjudicate || adjudicateLive,
    schedule: deps.schedule || ((ms, fn) => setTimeout(fn, ms)),
    readWake: deps.readWake || (() => readJson(WAKE)),
    log: deps.log || (() => {}),
  };
  const N = {
    buffer: [], flushTimer: null,
    seen: new Set(), hab: new Map(), wakeKeys: new Map(), lastPhash: new Map(),
    wakesToday: 0, wakeDate: localDate(new Date(D.now())),
    workspace: readJson(WORKSPACE) || { version: 0, moment: null, deep: null },
    adjudications: 0,
  };

  async function ingest(raw) {
    const now = D.now();
    const evt = sanitizeAfferent(raw);
    evt.ts = evt.ts || new Date(now).toISOString();
    // vision: the page sends only a 64-bit perceptual hash (raw pixels never
    // persist); salience of a frame = Hamming distance from the last one
    if (evt.modality === "vision" && evt.phash) {
      const k = evt.kind || "screen";
      const prev = N.lastPhash.get(k);
      evt.hamming = prev === undefined ? 64 : phashHamming(prev, evt.phash);
      N.lastPhash.set(k, evt.phash);
      delete evt.phash;                              // the hash itself needn't persist either
    }
    // vision static-frame gate: distance ~0 = filtered at the door, free
    if (evt.modality === "vision" && Number.isFinite(evt.hamming) && evt.hamming <= 1) return { filtered: true };
    D.appendAfferent(evt);
    const comps = computeComponents(evt, { cfg, markets: D.markets(), seen: N.seen, hab: N.hab, now });
    // habituation charges AFTER scoring; novelty burns AFTER scoring
    const key = signalKey(evt);
    const h = N.hab.get(key) || { h: 0, ts: now };
    const dt = Math.max(0, now - h.ts);
    N.hab.set(key, { h: h.h * Math.exp(-dt / cfg.hab.tau_ms) + 1, ts: now });
    for (const t of evt.concept_tokens || []) N.seen.add(String(t).toLowerCase());
    if (evt.confused_with) N.seen.add(`pair:${String(evt.confused_with).toLowerCase()}`);
    N.buffer.push({ evt, comps, S: salience(comps, cfg.weights), key, at: now });
    if (!N.flushTimer) N.flushTimer = D.schedule(cfg.binding_ms, () => flush().catch(() => {}));
    return { ok: true, S: N.buffer[N.buffer.length - 1].S };
  }

  // temporal binding — winner-take-all spotlight; co-temporal cross-modality or
  // shared concept token fuses; unlinked same-modality events become their own moments
  function bindGroups(buf) {
    const groups = [];
    let rest = buf.slice().sort((a, b) => b.S - a.S);
    while (rest.length) {
      const spot = rest.shift();
      const spotTokens = new Set((spot.evt.concept_tokens || []).map(t => String(t).toLowerCase()));
      const linked = [], unlinked = [];
      for (const e of rest) {
        const share = (e.evt.concept_tokens || []).some(t => spotTokens.has(String(t).toLowerCase()));
        (e.evt.modality !== spot.evt.modality || share) ? linked.push(e) : unlinked.push(e);
      }
      groups.push({ spotlight: spot, context: linked });
      rest = unlinked;
    }
    return groups;
  }

  async function flush() {
    N.flushTimer = null;
    const buf = N.buffer.splice(0);
    if (!buf.length) return [];
    const now = D.now();
    const today = localDate(new Date(now));
    if (today !== N.wakeDate) { N.wakeDate = today; N.wakesToday = 0; }
    const frac = D.headroomFrac();
    const t1 = tau1Effective(cfg, frac);
    const results = [];
    for (const g of bindGroups(buf)) {
      const S = g.spotlight.S;
      const momentId = `m_${now}_${Math.abs(hash32(g.spotlight.key + S))}`;
      let tier = S < cfg.tiers.tau0 ? 0 : 1;
      let outcome = tier === 0 ? "reflex" : "enrich";
      let adjudicated = false;
      if (Math.abs(S - t1) < cfg.tiers.epsilon) {
        adjudicated = true; N.adjudications++;
        const hard = await D.adjudicate(g.spotlight.evt, S).catch(() => false);
        if (hard) { tier = 2; outcome = "adjudicated_up"; } else { tier = Math.max(tier, 1); outcome = "adjudicated_down"; }
      } else if (S >= t1) { tier = 2; outcome = "wake"; }
      if (tier === 2) {
        const lastWake = N.wakeKeys.get(g.spotlight.key);
        if (lastWake && now - lastWake < cfg.refractory_min * 60000) { tier = 1; outcome = "refractory"; }
        else if (N.wakesToday >= cfg.wake_cap_per_day) { tier = 1; outcome = "capped"; }
      }
      const moment = {
        moment_id: momentId, ts: new Date(now).toISOString(), tier,
        modalities: [...new Set([g.spotlight.evt.modality, ...g.context.map(c => c.evt.modality)])],
        spotlight: { ...g.spotlight.evt, S, comps: g.spotlight.comps },
        context: g.context.map(c => ({ ...c.evt, S: c.S })),
      };
      // THE BROADCAST IS THE WRITE — version-stamped; every region subscribes
      N.workspace = { version: (N.workspace.version || 0) + 1, updated_at: moment.ts, moment, deep: N.workspace.deep || null };
      D.writeWorkspace(N.workspace);
      if (tier === 2) {
        N.wakesToday++; N.wakeKeys.set(g.spotlight.key, now);
        D.writeWake({ moment_id: momentId, ts: moment.ts, status: "pending", deadline_ms: (cfg.deep && cfg.deep.deadline_ms) || 45000, spotlight: moment.spotlight, bound_context: moment.context });
        D.log(`thalamus: WAKE → opus (S=${S.toFixed(2)} ≥ τ1=${t1.toFixed(2)}, ${N.wakesToday}/${cfg.wake_cap_per_day} today)`);
      }
      D.appendLedger({ ts: moment.ts, day: today, moment_id: momentId, tier, S: Math.round(S * 1000) / 1000, comps: roundComps(g.spotlight.comps), key: g.spotlight.key, modalities: moment.modalities, tau1_eff: Math.round(t1 * 1000) / 1000, headroom_frac: Math.round(frac * 1000) / 1000, outcome, adjudicated });
      results.push({ moment_id: momentId, tier, S, outcome });
    }
    return results;
  }

  // the deep answer flows back THROUGH the nucleus (single-writer preserved)
  function foldDeepAnswer(body) {
    const cur = N.workspace;
    N.workspace = {
      ...cur, version: (cur.version || 0) + 1, updated_at: new Date(D.now()).toISOString(),
      deep: { moment_id: String(body.moment_id || ""), text: body.declined ? null : String(body.text || "").slice(0, 4000), declined: !!body.declined, reason: body.reason || null, provenance: body.provenance || "opus", ts: new Date(D.now()).toISOString() },
    };
    D.writeWorkspace(N.workspace);
    const wake = D.readWake();
    if (wake && wake.moment_id === body.moment_id) {
      D.writeWake({ consumed: { moment_id: wake.moment_id, at: new Date(D.now()).toISOString(), status: body.declined ? "declined" : "served" } });  // consumed-on-success, like brain_queue.triggers
    }
    return { ok: true, version: N.workspace.version };
  }

  return { ingest, flush, foldDeepAnswer, state: N, cfg };
}
function hash32(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }
// Hamming distance between two 16-hex-char (64-bit) perceptual hashes
function phashHamming(a, b) {
  let d = 0;
  for (let i = 0; i < 16; i++) {
    let x = (parseInt(String(a)[i] || "0", 16) ^ parseInt(String(b)[i] || "0", 16));
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}
const roundComps = (c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v * 100) / 100]));

// window headroom straight from the brain's guarded budget accounting
function defaultHeadroomFrac() {
  try {
    // lazy import keeps selftest free of brain.mjs I/O
    const { headroom, loadConfig: loadBrainCfg } = brainMod || {};
    if (!headroom) return 1;
    const cfg = loadBrainCfg();
    const hr = headroom(cfg, readLines(join(STATE_DIR, "brain_ledger.jsonl")), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date());
    return hr.cap > 0 ? clamp01((hr.cap - hr.used) / hr.cap) : 0;
  } catch { return 0.5; }   // unknown budget → lean conservative, not open
}
let brainMod = null;

// the ONLY sub-Opus paid thought: one Flash-Lite adjudication in the ε-band
async function adjudicateLive(evt, S) {
  const cfg = loadConfig();
  if (!cfg.adjudicator.enabled) return false;
  const { loadKeys } = await import("./dugout.mjs");
  const keys = loadKeys();
  const q = `A personal learning system must decide if a moment needs its EXPENSIVE deep-reasoning brain or the free reflex is enough. Moment: ${JSON.stringify({ modality: evt.modality, text: String(evt.text || "").slice(0, 300), event_key: evt.event_key || null }).slice(0, 500)}. Is this a genuinely reasoning-hard moment (conceptual confusion, strategy question, contradiction) rather than routine chat/logging? Answer with exactly one word: yes or no.`;
  for (const key of keys.slice(0, 3)) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cfg.adjudicator.model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ contents: [{ parts: [{ text: q }] }], generationConfig: { maxOutputTokens: 5, temperature: 0 } }),
      });
      clearTimeout(t);
      if (!r.ok) continue;
      const j = await r.json();
      const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || "").join("").trim().toLowerCase();
      if (text) return text.startsWith("y");
    } catch { }
  }
  return false;                                     // every key dry → conservative: no wake
}

// ---------------------------------------------------------------------------
// THE BUS NERVE — fs.watch on the state dir turns machine events into afferents
// (event-driven, near-zero cost; 60s poll as the Windows fs.watch safety net)
// ---------------------------------------------------------------------------
function createBusWatcher(nucleus, deps = {}) {
  const snap = {
    verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || null,
    reps: readLines(join(STATE_DIR, "reps_log.jsonl")).length,
    slip: readLines(join(STATE_DIR, "slip.jsonl")).length,
    due: (readJson(join(STATE_DIR, "cards.json")) || {}).due_today || 0,
  };
  const today = () => localDate(new Date());
  function sweep() {
    const out = [];
    const r = readJson(join(STATE_DIR, "readiness.json"));
    const v = (r || {}).verdict || null;
    if (v && snap.verdict && v !== snap.verdict) out.push({ modality: "bus", source: "readiness", event_key: `gov:${snap.verdict}->${v}`, gov_from: snap.verdict, gov_to: v });
    if (v) snap.verdict = v;
    const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
    if (reps.length > snap.reps) {
      const fresh = reps.slice(snap.reps);
      const firstToday = !reps.slice(0, snap.reps).some(x => String(x.ts || "").slice(0, 10) === today());
      fresh.forEach((rep, i) => out.push({
        modality: "bus", source: "reps", event_key: `rep:${rep.concept || "?"}`,
        concept_tokens: rep.concept ? [rep.concept] : [], rep: { confidence: rep.confidence, correct: rep.correct },
        market_id: firstToday && i === 0 ? "session_happened" : undefined, observed: true,
      }));
      snap.reps = reps.length;
    }
    const slip = readLines(join(STATE_DIR, "slip.jsonl"));
    if (slip.length > snap.slip) {
      for (const row of slip.slice(snap.slip)) if (row.book === "twin" && row.resolved && Number.isFinite(row.p)) {
        const c = Math.max(row.p, 1 - row.p);
        out.push({ modality: "bus", source: "slip", event_key: `twin:${row.type}`, p_obs: row.hit ? c : 1 - c });
      }
      snap.slip = slip.length;
    }
    const due = (readJson(join(STATE_DIR, "cards.json")) || {}).due_today || 0;
    if (due > snap.due) out.push({ modality: "bus", source: "fsrs", event_key: "dead:due", due_count: due });
    snap.due = due;
    return out;
  }
  const fire = () => { for (const e of sweep()) nucleus.ingest(e).catch(() => {}); };
  let deb = null;
  try { watch(STATE_DIR, () => { clearTimeout(deb); deb = setTimeout(fire, 250); }); } catch { }
  setInterval(fire, 60000);
  return { sweep, snap };
}

// ---------------------------------------------------------------------------
// selftest — the §4.7 bar, deterministic, injected afferents, zero network
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig();

  // harness: virtual clock + captured writes + injected markets/headroom/adjudicator
  function rig(over = {}) {
    let t = 1000000;
    const wr = { afferents: [], ledger: [], workspaces: [], wakes: [], adjCalls: 0 };
    const n = createNucleus(over.cfg || cfg, {
      now: () => t,
      appendAfferent: (r) => wr.afferents.push(r), appendLedger: (r) => wr.ledger.push(r),
      writeWorkspace: (o) => wr.workspaces.push(JSON.parse(JSON.stringify(o))), writeWake: (o) => wr.wakes.push(JSON.parse(JSON.stringify(o))),
      markets: () => over.markets || { session_happened: 0.9 },
      headroomFrac: () => (over.frac !== undefined ? over.frac : 1),
      adjudicate: async () => { wr.adjCalls++; return over.adjVerdict || false; },
      schedule: () => null,                          // manual flush in tests
      readWake: () => (wr.wakes.length ? wr.wakes[wr.wakes.length - 1] : null),
    });
    n.state.workspace = { version: 0, moment: null, deep: null };
    return { n, wr, tick: (ms) => { t += ms; }, now: () => t };
  }

  // (1) a low-p Twin event outscores a predicted one
  {
    const { n } = rig({ markets: { m1: 0.9 } });
    const predicted = await n.ingest({ modality: "bus", event_key: "k1", market_id: "m1", observed: true });
    const against = await n.ingest({ modality: "bus", event_key: "k2", market_id: "m1", observed: false });
    assert("PE: the event the Twin bet AGAINST outscores the predicted one", against.S > predicted.S && predicted.S < 0.1);
  }

  // (2) a repeated event is refractory-suppressed — no double-wake
  {
    const { n, wr, tick } = rig({ markets: { m1: 0.9 } });
    // a doubt voiced against a confident Twin bet — reliably S ≥ τ1 both times
    const hot = { modality: "voice", text: "i don't get attention scaling", market_id: "m1", observed: false, event_key: "doubt:attention" };
    await n.ingest({ ...hot }); let r = await n.flush();
    assert("a genuine surprise wakes opus (TIER-2 → wake.json)", r[0].tier === 2 && wr.wakes.length === 1 && wr.wakes[0].status === "pending");
    tick(5 * 60000);                                  // 5 min later, same signal
    await n.ingest({ ...hot }); r = await n.flush();
    assert("REFRACTORY: the same surprise cannot re-fire the deep brain", r[0].tier === 1 && r[0].outcome === "refractory" && wr.wakes.length === 1);
  }

  // (3) τ1_effective rises as the window drains
  {
    const full = tau1Effective(cfg, 1), empty = tau1Effective(cfg, 0);
    assert("BUDGET COUPLING: wake bar rises as headroom → 0", empty > full && Math.abs(empty - (cfg.tiers.tau1_base + cfg.tiers.budget_k)) < 1e-9);
    const { n, wr } = rig({ frac: 0 });               // window empty
    await n.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    const r = await n.flush();
    assert("an empty window demotes a would-be wake to the free lane", r[0].tier < 2 && wr.wakes.length === 0);
  }

  // (4) voice+frame+bus inside B fuse into ONE moment, winner-take-all
  {
    const { n, wr, tick } = rig();
    await n.ingest({ modality: "vision", kind: "screen", hamming: 30 });
    tick(200);
    await n.ingest({ modality: "voice", text: "wait, why does attention scale like this", concept_tokens: ["attention"] });
    tick(200);
    await n.ingest({ modality: "bus", source: "fsrs", event_key: "dead:due", due_count: 2, concept_tokens: ["attention"] });
    const r = await n.flush();
    const m = wr.workspaces[wr.workspaces.length - 1].moment;
    assert("BINDING: three senses in 900ms = ONE moment, three modalities", r.length === 1 && m.modalities.length === 3);
    assert("winner-take-all: the doubt is the spotlight, the rest bound context", m.spotlight.modality === "voice" && m.context.length === 2);
    assert("the broadcast IS the write: workspace version-stamped upward", wr.workspaces.every((w, i) => w.version === i + 1));
  }

  // (5) prosody/emotion are ignored — stripped at the door, never scored
  {
    const { n, wr } = rig();
    const clean = await n.ingest({ modality: "voice", text: "cosine question", concept_tokens: ["cosine"] });
    const { n: n2, wr: wr2 } = rig();
    const affect = await n2.ingest({ modality: "voice", text: "cosine question", concept_tokens: ["cosine"], prosody: { stress: 0.99 }, emotion: "agitated", tone: "flat" });
    assert("AFFECT FIREWALL: prosody/emotion change NOTHING in the score", Math.abs(clean.S - affect.S) < 1e-12);
    assert("affect fields never even land in the afferent log", !JSON.stringify(wr2.afferents).match(/prosody|emotion|agitated|"tone"/i) && wr.afferents.length === 1);
  }

  // (6) the ambiguous band calls the tiny model AT MOST once
  {
    const t1 = tau1Effective(cfg, 1);
    const w = { ...cfg.weights, self: t1 + 0.02 };    // engineer S inside the ε-band
    const cfgBand = { ...cfg, weights: w };
    const { n, wr } = rig({ cfg: cfgBand, adjVerdict: true });
    await n.ingest({ modality: "voice", text: "i don't get x", concept_tokens: [] });
    const r = await n.flush();
    assert("ε-band: ONE adjudication, verdict yes → TIER-2", wr.adjCalls === 1 && r[0].tier === 2 && r[0].outcome === "adjudicated_up");
    const { n: n3, wr: wr3 } = rig();
    await n3.ingest({ modality: "bus", event_key: "boring" }); await n3.flush();
    assert("clear cases never pay the adjudicator", wr3.adjCalls === 0);
  }

  // the door + the gates
  {
    const { n, wr } = rig();
    const f = await n.ingest({ modality: "vision", kind: "screen", hamming: 0 });
    assert("static screen = hamming 0 = filtered at the door, free", f.filtered === true && wr.afferents.length === 0);
    const { n: nv, wr: wrv } = rig();
    await nv.ingest({ modality: "vision", kind: "screen", phash: "ffffffffffffffff" });
    const same = await nv.ingest({ modality: "vision", kind: "screen", phash: "ffffffffffffffff" });
    const changed = await nv.ingest({ modality: "vision", kind: "screen", phash: "00000000ffffffff" });
    assert("phash: identical frame filtered; changed surface carries salience", same.filtered === true && !changed.filtered && changed.S > 0);
    assert("raw hash never persists in the afferent log (hash-in, distance-only)", !JSON.stringify(wrv.afferents).includes("ffffffffffffffff") && phashHamming("ffffffffffffffff", "0000000000000000") === 64);
    assert("GOV magnitudes: any RED transition = 1.0, GREEN↔AMBER = 0.5",
      computeComponents({ modality: "bus", gov_from: "AMBER", gov_to: "RED" }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).gov === 1 &&
      computeComponents({ modality: "bus", gov_from: "GREEN", gov_to: "AMBER" }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).gov === 0.5);
    assert("ERR: knew-but-wrong = 1.0 (the calibration break), shaky-wrong = 0.4",
      computeComponents({ modality: "bus", rep: { confidence: "knew", correct: false } }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).err === 1 &&
      computeComponents({ modality: "bus", rep: { confidence: "shaky", correct: false } }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).err === 0.4);
  }

  // wake cap + deep-answer fold (consumed-on-success)
  {
    const capCfg = { ...cfg, wake_cap_per_day: 1, refractory_min: 0 };
    const { n, wr, tick } = rig({ cfg: capCfg });
    await n.ingest({ modality: "voice", text: "i don't get tokenization", concept_tokens: ["tokenization"] }); await n.flush();
    tick(60000);
    await n.ingest({ modality: "voice", text: "i don't get embeddings", concept_tokens: ["embeddings"] });
    const r2 = await n.flush();
    assert("hard daily wake_cap: the second wake is capped to the free lane", wr.wakes.length === 1 && r2[0].outcome === "capped");
    const mid = wr.wakes[0].moment_id;
    const fold = n.foldDeepAnswer({ moment_id: mid, text: "the deep read", provenance: "opus" });
    const wsp = wr.workspaces[wr.workspaces.length - 1];
    assert("deep answer folds THROUGH the thalamus into workspace.deep", fold.ok && wsp.deep && wsp.deep.text === "the deep read" && wsp.deep.moment_id === mid);
    const lastWake = wr.wakes[wr.wakes.length - 1];
    assert("wake.json is CONSUMED-on-success (like brain_queue.triggers)", lastWake.consumed && lastWake.consumed.moment_id === mid && lastWake.consumed.status === "served");
  }

  // habituation decays — after a long silence the same signal can fire again
  {
    const { n, tick } = rig();
    const e1 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" }); await n.flush();
    const e2 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" }); await n.flush();
    tick(cfg.hab.tau_ms * 12);
    const e3 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" });
    assert("HAB: a flapping signal decays; a long-quiet signal recovers", e2.S < e1.S && e3.S > e2.S);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main — the relay daemon (localhost only)
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "status") {
    const w = readJson(WORKSPACE) || {};
    const rows = readLines(SLEDGER).filter(r => (r.day || String(r.ts || "").slice(0, 10)) === localDate());
    const byTier = rows.reduce((a, r) => { a[r.tier] = (a[r.tier] || 0) + 1; return a; }, {});
    console.log(`thalamus: workspace v${w.version || 0} · today ${rows.length} moment(s) — tier0 ${byTier[0] || 0} · tier1 ${byTier[1] || 0} · tier2 ${byTier[2] || 0} · deep=${w.deep ? (w.deep.declined ? "declined" : "served") : "—"}`);
    return;
  }
  brainMod = await import("./brain.mjs");
  const cfg = loadConfig();
  const nucleus = createNucleus(cfg, { log: console.log });
  // boot re-seed: yesterday's tail keeps NOV/HAB honest across restarts
  for (const row of readLines(AFFERENT).slice(-500)) {
    for (const t of row.concept_tokens || []) nucleus.state.seen.add(String(t).toLowerCase());
  }
  nucleus.state.wakesToday = readLines(SLEDGER).filter(r => (r.day || String(r.ts || "").slice(0, 10)) === localDate() && r.tier === 2).length;
  createBusWatcher(nucleus);
  const server = createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    try {
      if (req.method === "GET" && req.url === "/status") {
        return send(200, { ok: true, version: nucleus.state.workspace.version, wakes_today: nucleus.state.wakesToday, wake_cap: cfg.wake_cap_per_day, tau1_eff: Math.round(tau1Effective(cfg, defaultHeadroomFrac()) * 1000) / 1000 });
      }
      if (req.method === "GET" && req.url === "/workspace") return send(200, nucleus.state.workspace);
      if (req.method === "POST") {
        let raw = ""; for await (const c of req) raw += c;
        const body = raw ? JSON.parse(raw) : {};
        if (req.url === "/afferent") return send(200, await nucleus.ingest(body));
        if (req.url === "/deep-answer") return send(200, nucleus.foldDeepAnswer(body));
      }
      send(404, { error: "not found" });
    } catch (e) { send(500, { error: String(e.message).slice(0, 200) }); }
  });
  server.on("error", (e) => {
    if (e && e.code === "EADDRINUSE") { console.log(`thalamus: nucleus already live on :${PORT} — standing down.`); process.exit(0); }
    throw e;
  });
  server.listen(PORT, "127.0.0.1", () => console.log(`thalamus: relay nucleus LIVE on http://127.0.0.1:${PORT} — τ0=${cfg.tiers.tau0} τ1=${cfg.tiers.tau1_base}+${cfg.tiers.budget_k}·(1−headroom) ε=${cfg.tiers.epsilon} · B=${cfg.binding_ms}ms · wake cap ${cfg.wake_cap_per_day}/day`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeComponents, salience, tau1Effective, signalKey, sanitizeAfferent, createNucleus, createBusWatcher, surprisalPE, loadConfig, phashHamming };
