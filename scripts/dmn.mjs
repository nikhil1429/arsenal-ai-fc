#!/usr/bin/env node
// ============================================================================
// dmn.mjs · ARSENAL AI FC — THE DEFAULT MODE NETWORK ("The Rest Room")
// ----------------------------------------------------------------------------
// WHAT:  The brain region that fires when the captain is AWAY (CYBORG_BRAIN.md
//        §7a): idle free tanks become scratch cortex. It pulls his REAL
//        weak-point vector (calibration danger zone + stalling concepts +
//        lowest-confidence Twin markets), fans a MONTE-CARLO INTERVIEW
//        SIMULATION across the pool — each rollout a different interviewer
//        persona probing exactly those soft spots — then deterministically
//        clusters where the simulated candidate stalls and PRE-DRAFTS the
//        15-second reframe + next drill for each predicted stall into
//        dmn_precache.json.
// M16 — THE DREAM STADIUM (the cyborg stretch): the old engine dreamed on ONE
//        tank, 8 serial rollouts (a wire-scar: parallelism available, unused).
//        The new engine borrows EVERY idle tank — the away-gate IS the
//        tank-borrow gate: with the captain gone there is no conversation to
//        stall, so pickTank's mid-talk T1/T2 clamp does not bind — and drains
//        them in PARALLEL (per-lane serial for RPM sanity, Promise.all across
//        lanes), up to ~100 rollouts/night. A VERIFICATION PHASE then attacks
//        every cluster with a hostile counter-rollout: a "broken" reframe is
//        DROPPED — better no ammunition than wrong ammunition. The old engine
//        is FROZEN VERBATIM below as dreamLegacy (layering, never replace).
// LAWS:  OUTPUT IS INERT — it only loads ammunition; nothing reads it aloud
//        (M7's Predictive Presence serves it through the earned-voice gate).
//        Dreams ONLY about real weak points from real reps — never fabricated
//        ones (no signal → no dream, honest skip). Fires ONLY when: the
//        captain is away (ActivityWatch AFK), the tone allows it (conserve =
//        MUTED — a depleted captain rests), and the lanes have measured
//        headroom (use-it-or-lose-it quota; blast radius $0). Rollouts are
//        hard-capped. Sole writer of dmn_precache.json (gitignored — it names
//        his weaknesses).
// MODES: node scripts/dmn.mjs            → gate-checked dream pass
//        node scripts/dmn.mjs --force    → skip the away-check (real-run/test)
//        node scripts/dmn.mjs status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool, loadHippoKeys } from "./hippocampus.mjs";
// 17 Jul: the dreams ride Claude (cognition law) — the lane/borrow machinery
// stays as the ROLLOUT BUDGET; lane.key is now just a slot label.
import { claudeGen } from "./claudegen.mjs";
import { loadBoard, headroomOf, recordUse, record429, stateOf } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";
import { pendingBg } from "./thalamus.mjs";          // M22 — read-only; the thalamus owns bg_queue.jsonl

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PRECACHE  = join(STATE_DIR, "dmn_precache.json");
const AW = "http://localhost:5600";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const MAX_ROLLOUTS = 8;                              // legacy engine's cap (frozen)
const MAX_ROLLOUTS_NIGHT = 100;                      // the stadium's hard cap (clusters saturate ~100)
const ROLLOUTS_PER_WEAK = 25;                        // depth per weak point before diminishing returns
const PERSONAS = ["a brisk recruiter screening for buzzwords", "a staff engineer mid-incident demanding ordered steps", "a principal engineer dissecting line-level mechanism", "a skeptical PM asking why an LLM at all"];

// ---------------------------------------------------------------------------
// THE WEAK-POINT VECTOR — real signal only; empty = no dream (honest)
// ---------------------------------------------------------------------------
function weakVector(deps = {}) {
  const out = [];
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  for (const d of (cal && cal.danger_zone) || []) out.push({ concept: d.topic || d.concept, why: "confident-but-wrong (danger zone)" });
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  const concepts = (ls && (ls.concepts || [])) || [];
  for (const c of (Array.isArray(concepts) ? concepts : [])) {
    if (["stalling", "regressing"].includes(String(c.trend || c.trajectory || ""))) out.push({ concept: c.name || c.concept, why: `trajectory ${c.trend || c.trajectory}` });
  }
  const twin = deps.twin !== undefined ? deps.twin : readJson(join(STATE_DIR, "twin.json"));
  for (const m of (twin && twin.markets) || []) {
    if (m.alive && m.n_resolved >= 5 && Math.abs(m.p - 0.5) < 0.15) out.push({ concept: m.desc, why: "the Twin can't call it (max uncertainty)", market: m.id });
  }
  const seen = new Set();
  return out.filter(w => w.concept && !seen.has(w.concept) && seen.add(w.concept)).slice(0, 4);
}

// ---------------------------------------------------------------------------
// THE GATES — away · tone · headroom (all three, or no dream)
// ---------------------------------------------------------------------------
async function isAway(deps = {}) {
  const fetchFn = deps.fetchFn || fetch;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetchFn(`${AW}/api/0/buckets`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { away: false, why: "ActivityWatch unreachable — assume present" };
    const buckets = await r.json();
    const afk = Object.keys(buckets).find(b => b.startsWith("aw-watcher-afk"));
    if (!afk) return { away: false, why: "no AFK bucket — assume present" };
    const ev = await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(afk)}/events?limit=1`)).json();
    const last = ev && ev[0];
    if (!last) return { away: false, why: "no AFK events" };
    const away = last.data && last.data.status === "afk" && (Date.now() - new Date(last.timestamp).getTime()) < 3600000 * 6;
    return { away, why: away ? "AFK per ActivityWatch" : "present per ActivityWatch" };
  } catch { return { away: false, why: "AFK check failed — assume present (never dream over his shoulder)" }; }
}

// M16 — THE TANK-BORROW GATE: when the captain is away there is no live
// conversation a borrow could stall, so pickTank's mid-talk T1/T2 clamp does
// not bind — every enabled, keyed, non-COLD tank with measured headroom is
// legal scratch cortex. Each lane may spend ONLY its own headroom
// (ceiling·(1−reserve) − used): use-it-or-lose-it quota, blast radius $0.
function borrowableTanks(board, keys = []) {
  return board.tanks
    .filter(t => t.enabled && t.key_index !== null && ["HOT", "WARM"].includes(stateOf(t)) && keys[t.key_index])
    .map(t => ({ tank: t, key: keys[t.key_index], budget: headroomOf(t) }))
    .filter(l => l.budget > 0);
}

// ---------------------------------------------------------------------------
// THE DREAM — rollouts → deterministic clustering → verification → precache
// ---------------------------------------------------------------------------
function rolloutPrompt(weak, persona) {
  return `Simulate ONE tough interview probe. You are ${persona}. The candidate is an AI Product Engineer applicant whose known soft spot is: "${weak.concept}" (${weak.why}). Output STRICT JSON, no fences: {"stall_point": "<the exact sub-question where such a candidate most plausibly stalls, <=120 chars>", "reframe_15s": "<the 15-second reframe that would un-stick him, spoken, <=200 chars>", "drill": "<one concrete 10-minute drill for tomorrow, <=120 chars>"}`;
}
// M16 — the counter-rollout: hostile review before ammunition may be racked
function counterPrompt(c) {
  return `You are a hostile staff-engineer REVIEWER verifying pre-drafted coaching ammunition before it may ever be served to a learner. Concept: "${c.concept}". Claimed stall-point: "${c.stall_point}". The 15-second reframe: "${c.reframe_15s}". The drill: "${c.drill}". Attack all three: (1) is the reframe TECHNICALLY CORRECT — no subtle wrongness a junior would absorb? (2) is the drill concrete and doable in ~10 minutes? (3) is the stall plausible for an AI Product Engineer candidate? If ALL three hold answer sound, else broken. Output STRICT JSON, no fences: {"verdict":"sound"|"broken","why":"<=100 chars"}`;
}
const normKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(w => w.length > 3).sort().slice(0, 6).join("-");

function clusterRollouts(rollouts) {
  const clusters = new Map();
  for (const r of rollouts) {
    if (!r || !r.stall_point || !r.reframe_15s) continue;
    const k = normKey(r.stall_point);
    if (!k) continue;
    const c = clusters.get(k) || { ...r, votes: 0 };
    c.votes++;
    clusters.set(k, c);
  }
  return [...clusters.values()].sort((a, b) => b.votes - a.votes);
}

// M16 — THE DREAM STADIUM (the plan of record)
async function dream(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — a depleted captain rests; no dreaming" };
  if (!deps.force) {
    const a = deps.awayCheck ? await deps.awayCheck() : await isAway(deps);
    if (!a.away) return { ok: false, skipped: `not away (${a.why}) — the Rest Room only fires when he's gone` };
  }
  const weak = deps.weak || weakVector(deps);
  if (!weak.length) return { ok: false, skipped: "no real weak points on the bus — nothing honest to dream about" };
  const board = deps.board || loadBoard();
  const keys = deps.keys || loadHippoKeys();
  const lanes = borrowableTanks(board, keys);
  const totalBudget = lanes.reduce((a, l) => a + l.budget, 0);
  if (totalBudget < 8) return { ok: false, skipped: `idle-tank headroom ${totalBudget} < 8 — the stadium only spends use-it-or-lose-it quota` };
  const nRoll = Math.min(MAX_ROLLOUTS_NIGHT, totalBudget, weak.length * ROLLOUTS_PER_WEAK);
  // round-robin the rollouts onto lanes, capped by each lane's OWN budget
  const plan = lanes.map(l => ({ ...l, jobs: [] }));
  let placed = 0;
  while (placed < nRoll && plan.some(l => l.jobs.length < l.budget)) {
    for (const lane of plan) {
      if (placed >= nRoll) break;
      if (lane.jobs.length >= lane.budget) continue;
      lane.jobs.push({ w: weak[placed % weak.length], persona: PERSONAS[placed % PERSONAS.length] });
      placed++;
    }
  }
  const gen = deps.generate || ((p, lane) => claudeGen(p, "sonnet"));
  const use = deps.recordUse || recordUse;
  const fault = deps.record429 || record429;
  const rollouts = [];
  // THE STADIUM — lanes drain in PARALLEL; inside a lane the calls stay serial
  // (per-project RPM is the real ceiling, not concurrency). A wire 429 STANDS
  // THE LANE DOWN and records the fault on the fuelboard (starvation guard
  // floors the learned ceiling) — a dry lane never burns its whole budget.
  await Promise.all(plan.map(async (lane) => {
    for (const job of lane.jobs) {
      const r = await gen(rolloutPrompt(job.w, job.persona), lane).catch(() => ({ ok: false }));
      use(lane.tank.id, 1, 3000);                    // measured spend on ITS OWN gauge + naive-shadow
      if (!r.ok) {
        if (r.status === 429) { fault(lane.tank.id); lane.dry = true; break; }
        continue;
      }
      try {
        const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
        const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
        rollouts.push({ ...obj, concept: job.w.concept, persona: job.persona, lane: lane.tank.id });
      } catch { }
    }
  }));
  if (!rollouts.length) return { ok: false, skipped: "every rollout failed/dry — no dream tonight" };
  const clusters = clusterRollouts(rollouts).slice(0, 8);
  // THE VERIFICATION PHASE — every cluster faces ONE hostile counter-rollout.
  // "broken" → DROPPED (better no ammunition than wrong ammunition); a lane
  // hiccup keeps the draft but marks it unverified (drafts are inert by law).
  const entries = [];
  const liveLanes = plan.filter(l => !l.dry);
  await Promise.all(clusters.map(async (c, i) => {
    const lane = liveLanes.length ? liveLanes[i % liveLanes.length] : plan[i % plan.length];
    const r = await gen(counterPrompt(c), lane).catch(() => ({ ok: false }));
    use(lane.tank.id, 1, 2000);
    if (!r.ok && r.status === 429) fault(lane.tank.id);
    let verified = null;
    if (r.ok) {
      try {
        const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
        const v = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
        verified = v.verdict === "sound" ? true : v.verdict === "broken" ? false : null;
      } catch { }
    }
    if (verified === false) return;
    entries.push({ concept: c.concept, stall_signature: c.stall_point, reframe: c.reframe_15s, drill: c.drill, votes: c.votes, verified: verified === true });
  }));
  if (!entries.length) return { ok: false, skipped: "verification killed every cluster — better no ammunition than wrong ammunition" };
  entries.sort((a, b) => (Number(b.verified) - Number(a.verified)) || (b.votes - a.votes));
  const out = { date: localDate(now), dreamed_at: now.toISOString(), engine: "stadium", lanes: plan.filter(l => l.jobs.length).map(l => l.tank.id), rollouts: rollouts.length, verified: entries.filter(e => e.verified).length, entries: entries.slice(0, 6), inert: true };
  (deps.write || ((o) => writeAtomic(PRECACHE, o)))(out);
  return { ok: true, entries: out.entries.length, rollouts: rollouts.length, verified: out.verified, lanes: out.lanes };
}

// ---------------------------------------------------------------------------
// M22 — THE BG DRAIN: the gate suppressed a wake (refractory/capped) but the
// THOUGHT queued in bg_queue.jsonl (thalamus-owned). Idle free lanes give each
// its second spotlight; results fold back THROUGH :4113/bg-drained (single-
// writer preserved) and wait on the nucleus's shelf for his next recall-match.
// Thalamus down / lane dry → entries simply stay queued (honest retry).
// Mid-day the mouth/eyes lanes (T1/T2) are NEVER borrowed — pickTank's law.
// ---------------------------------------------------------------------------
const BG_DRAIN_CAP = 6;
async function drainBg(deps = {}) {
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — the drain rests too" };
  const rows = deps.readBgQueue ? deps.readBgQueue() : readLines(join(STATE_DIR, "bg_queue.jsonl"));
  const open = pendingBg(rows);
  if (!open.length) return { ok: true, drained: 0, note: "no suppressed thoughts waiting" };
  const board = deps.board || loadBoard();
  const keys = deps.keys || loadHippoKeys();
  const lanes = borrowableTanks(board, keys).filter(l => deps.away === true || !["T1", "T2"].includes(l.tank.id));
  if (!lanes.length) return { ok: false, skipped: "no borrowable lane — the thoughts keep waiting (never spend the core)" };
  const gen = deps.generate || ((p, lane) => claudeGen(p, "sonnet"));
  const use = deps.recordUse || recordUse;
  const post = deps.post || (async (body) => { const r = await fetch("http://127.0.0.1:4113/bg-drained", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json(); });
  const batch = open.slice(0, BG_DRAIN_CAP);
  let drained = 0;
  for (let i = 0; i < batch.length; i++) {
    const b = batch[i];
    const lane = lanes[i % lanes.length];
    const spot = b.spotlight || {};
    const r = await gen(`A learning system's attention gate suppressed this moment (reason: ${b.reason} — it deserved deep thought but the deep lane was busy). Give it its second spotlight now, briefly. THE MOMENT: ${JSON.stringify({ text: spot.text, event_key: spot.event_key, concept_tokens: spot.concept_tokens }).slice(0, 600)}. Output STRICT JSON, no fences: {"concept":"<the one concept this is really about>","insight":"<the short useful read he'd want when he next touches this ground, <=280 chars, honest, no hype>"}`, lane).catch(() => ({ ok: false }));
    use(lane.tank.id, 1, 2500);
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      if (!obj.insight || String(obj.insight).length < 20) continue;   // a thin read never shelves
      const res = await post({ moment_id: b.moment_id, concept: obj.concept, insight: obj.insight, tokens: spot.concept_tokens || [] }).catch(() => null);
      if (res && res.ok) drained++;
    } catch { }
  }
  return { ok: true, drained, waiting: open.length - drained };
}

// ---------------------------------------------------------------------------
// dreamLegacy — the pre-M16 engine, FROZEN VERBATIM (layering, never replace):
// one tank (T7), up to 8 serial rollouts, no verification. Kept runnable as
// the fallback floor and the reference for what the stadium replaced.
// ---------------------------------------------------------------------------
async function dreamLegacy(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — a depleted captain rests; no dreaming" };
  if (!deps.force) {
    const a = deps.awayCheck ? await deps.awayCheck() : await isAway(deps);
    if (!a.away) return { ok: false, skipped: `not away (${a.why}) — the Rest Room only fires when he's gone` };
  }
  const weak = deps.weak || weakVector(deps);
  if (!weak.length) return { ok: false, skipped: "no real weak points on the bus — nothing honest to dream about" };
  const board = deps.board || loadBoard();
  const t7 = board.tanks.find(t => t.id === "T7");
  const head = headroomOf(t7);
  if (head < 4) return { ok: false, skipped: `T7 headroom ${head} < 4 — the dream only spends use-it-or-lose-it quota` };
  const nRoll = Math.min(MAX_ROLLOUTS, head, weak.length * 2);
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048, json: true }));   // thinking models spend thoughts from the same budget
  const use = deps.recordUse || recordUse;
  const rollouts = [];
  for (let i = 0; i < nRoll; i++) {
    const w = weak[i % weak.length];
    const persona = PERSONAS[i % PERSONAS.length];
    const r = await gen(rolloutPrompt(w, persona));
    use("T7", 1, 3000);                              // measured spend + naive-shadow
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      rollouts.push({ ...obj, concept: w.concept, persona });
    } catch { }
  }
  if (!rollouts.length) return { ok: false, skipped: "every rollout failed/dry — no dream tonight" };
  const clusters = clusterRollouts(rollouts).slice(0, 6);
  const out = { date: localDate(now), dreamed_at: now.toISOString(), rollouts: rollouts.length, entries: clusters.map(c => ({ concept: c.concept, stall_signature: c.stall_point, reframe: c.reframe_15s, drill: c.drill, votes: c.votes })), inert: true };
  (deps.write || ((o) => writeAtomic(PRECACHE, o)))(out);
  return { ok: true, entries: out.entries.length, rollouts: rollouts.length };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const weakFix = [{ concept: "eval metrics", why: "danger zone" }, { concept: "context windows", why: "stalling" }];
  const boardFix = (head) => ({ tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 250 * 0.85 - head, enabled: true, key_index: 5 }] });
  const keysFix = ["k0", "k1", "k2", "k3", "k4", "k5"];
  const genOK = async (p) => ({ ok: true, text: p.includes("hostile staff-engineer") ? JSON.stringify({ verdict: "sound", why: "holds" }) : JSON.stringify({ stall_point: /eval/.test(p) ? "precision recall tradeoff at threshold" : "lost context after compaction", reframe_15s: "start from the confusion matrix, one cell at a time", drill: "hand-compute P/R on 10 rows" }) });
  const base = { force: true, tone: { effects: { dmn_allowed: true } }, weak: weakFix, board: boardFix(20), keys: keysFix, generate: genOK, recordUse: () => {}, record429: () => {}, write: () => {}, now: new Date("2026-07-14T15:00:00") };

  // the gates (shared by both engines; exercised on the plan of record)
  assert("CONSERVE tone MUTES the dream (a depleted captain rests)", (await dream({ ...base, tone: { effects: { dmn_allowed: false } } })).skipped.includes("conserve"));
  assert("present captain → no dream (the Rest Room fires only when away)", (await dream({ ...base, force: false, awayCheck: async () => ({ away: false, why: "present" }) })).skipped.includes("not away"));
  assert("no REAL weak points → honest skip (never dreams fabricated cracks)", (await dream({ ...base, weak: [] })).skipped.includes("nothing honest"));
  assert("no lane headroom → no dream (use-it-or-lose-it only, $0 blast radius)", (await dream({ ...base, board: boardFix(2) })).skipped.includes("headroom"));

  // M16 — THE DREAM STADIUM: parallel lanes, per-lane budgets, verification
  {
    const stadiumBoard = { tanks: [
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T5", name: "Scout", region: "research", key_index: 3, quota_est: 50, observed_ceiling: 0, used_today: 30, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    let saved = null; const spends = {};
    const r = await dream({ ...base, board: stadiumBoard, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, write: (o) => { saved = o; } });
    assert("STADIUM: the away-gate legalizes the borrow — rollouts fan across ALL idle lanes", r.ok && r.lanes.length === 3 && Object.keys(spends).length === 3);
    assert("STADIUM: 2 weak points × depth 25 = 50 rollouts (was 8 serial)", r.rollouts === 50 && r.rollouts <= MAX_ROLLOUTS_NIGHT);
    assert("STADIUM: a lane never spends past its OWN measured headroom", spends.T5 <= Math.floor(50 * 0.85) - 30 + 3);   // budget 12 + its ≤3 counter-rollouts
    assert("STADIUM: verification ran — entries land VERIFIED, engine stamped", saved.engine === "stadium" && saved.verified >= 1 && saved.entries.every(e => e.verified === true) && saved.inert === true);
    assert("clustering: same stall signature merges with votes", saved.entries.some(e => e.votes >= 2));
  }
  // the counter-rollout kills a broken reframe; a lane hiccup keeps-but-marks
  {
    const genBroken = async (p) => {
      if (p.includes("hostile staff-engineer")) return { ok: true, text: JSON.stringify({ verdict: p.includes("lost context") ? "broken" : "sound", why: "x" }) };
      return genOK(p);
    };
    let saved = null;
    const r = await dream({ ...base, generate: genBroken, write: (o) => { saved = o; } });
    assert("VERIFICATION: a broken reframe is DROPPED, never racked", r.ok && saved.entries.every(e => !e.stall_signature.includes("lost context")));
    const genHiccup = async (p) => p.includes("hostile staff-engineer") ? { ok: false } : genOK(p);
    let saved2 = null;
    await dream({ ...base, generate: genHiccup, write: (o) => { saved2 = o; } });
    assert("VERIFICATION: a lane hiccup keeps the draft but marks it unverified", saved2 && saved2.entries.length >= 1 && saved2.entries.every(e => e.verified === false));
    const genAllBroken = async (p) => p.includes("hostile staff-engineer") ? { ok: true, text: '{"verdict":"broken","why":"wrong"}' } : genOK(p);
    const rAB = await dream({ ...base, generate: genAllBroken, write: () => { throw new Error("must not write"); } });
    assert("VERIFICATION: all clusters broken → NO precache (better none than wrong)", rAB.ok === false && rAB.skipped.includes("wrong ammunition"));
  }
  // M16 — a 429'd lane stands down and the fuelboard LEARNS (starvation-guarded)
  {
    const twoLanes = { tanks: [
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 200, enabled: true },
    ] };
    const spends = {}, faults = [];
    const genDryT2 = async (p, lane) => {
      if (lane.tank.id === "T2" && !p.includes("hostile staff-engineer")) return { ok: false, status: 429 };
      return genOK(p);
    };
    const r = await dream({ ...base, board: twoLanes, generate: genDryT2, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, record429: (id) => faults.push(id), write: () => {} });
    assert("STADIUM: a wire-429 lane STANDS DOWN after one call (never burns its budget)", r.ok && spends.T2 <= 2 && faults.includes("T2"));
    assert("STADIUM: the surviving lane still dreams (dry pool ≠ dead dream)", r.rollouts >= 1 && r.lanes.includes("T7"));
  }

  // M22 — THE BG DRAIN: second spotlight on idle lanes, folded back via :4113
  {
    const bgRows = [
      { moment_id: "bg1", status: "queued", reason: "capped", spotlight: { text: "i don't get attention scaling", concept_tokens: ["attention"] } },
      { moment_id: "bg2", status: "queued", reason: "refractory", spotlight: { text: "kv cache doubt again", concept_tokens: ["kv"] } },
      { moment_id: "bg0", status: "queued", reason: "capped", spotlight: { text: "already handled" } },
      { moment_id: "bg0", status: "drained" },
    ];
    const twoLanes = { tanks: [
      { id: "T5", name: "Scout", region: "research", key_index: 3, quota_est: 50, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    const posts = []; const spends = {};
    const genBG = async () => ({ ok: true, text: JSON.stringify({ concept: "attention", insight: "the suppressed read: caching kills recompute, the handshakes stay — hold that distinction" }) });
    const r = await drainBg({ tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: twoLanes, keys: keysFix, generate: genBG, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, post: async (b) => { posts.push(b); return { ok: true }; } });
    assert("DRAIN: open thoughts drained on idle lanes, folded back via :4113", r.ok && r.drained === 2 && posts.length === 2 && posts[0].moment_id === "bg1" && posts[0].tokens.includes("attention"));
    assert("DRAIN: already-drained entries never re-drain (event-sourced)", !posts.some(p => p.moment_id === "bg0"));
    assert("DRAIN: every spend recorded on ITS lane", Object.keys(spends).length >= 1);
    const rMute = await drainBg({ tone: { effects: { dmn_allowed: false } }, readBgQueue: () => bgRows });
    assert("DRAIN: conserve tone mutes the drain too", rMute.ok === false && rMute.skipped.includes("conserve"));
    const t12 = { tanks: [
      { id: "T1", name: "Gaffer", region: "mouth", key_index: 0, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    const rT12 = await drainBg({ tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: t12, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => ({ ok: true }) });
    assert("DRAIN: mouth/eyes lanes NEVER borrowed mid-day (pickTank's law)", rT12.ok === false && rT12.skipped.includes("never spend the core"));
    const rAway = await drainBg({ away: true, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: t12, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => ({ ok: true }) });
    assert("DRAIN: away-time legalizes the borrow (same law as the stadium)", rAway.ok && rAway.drained === 2);
    const rDown = await drainBg({ tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: twoLanes, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => { throw new Error("nucleus down"); } });
    assert("DRAIN: thalamus down → thoughts stay queued (honest retry, nothing lost)", rDown.ok && rDown.drained === 0 && rDown.waiting === 2);
    const rNone = await drainBg({ tone: { effects: { dmn_allowed: true } }, readBgQueue: () => [{ moment_id: "x", status: "queued" }, { moment_id: "x", status: "returned" }] });
    assert("DRAIN: empty queue → quiet no-op", rNone.ok && rNone.drained === 0 && rNone.note);
  }

  // clustering determinism
  {
    const rolls = [
      { stall_point: "precision recall tradeoff threshold", reframe_15s: "a", drill: "d", concept: "x" },
      { stall_point: "threshold precision-recall tradeoff!", reframe_15s: "b", drill: "d", concept: "x" },
      { stall_point: "kv cache growth unbounded", reframe_15s: "c", drill: "d", concept: "y" },
      { stall_point: "", reframe_15s: "junk", drill: "d" },
    ];
    const c = clusterRollouts(rolls);
    assert("normalized stall keys merge word-order/punctuation variants", c.length === 2 && c[0].votes === 2);
    assert("malformed rollouts dropped, never crash", c.every(x => x.stall_point));
  }
  // failure honesty
  assert("all rollouts dry → honest skip, precache untouched", (await dream({ ...base, generate: async (p) => p.includes("hostile") ? genOK(p) : { ok: false }, write: () => { throw new Error("must not write"); } })).skipped.includes("dry"));

  // dreamLegacy — the frozen floor still runs green (layering, never replace)
  {
    let saved = null, uses = 0;
    const genLegacy = async (p) => ({ ok: true, text: JSON.stringify({ stall_point: /eval/.test(p) ? "precision recall tradeoff at threshold" : "lost context after compaction", reframe_15s: "start from the confusion matrix, one cell at a time", drill: "hand-compute P/R on 10 rows" }) });
    const r = await dreamLegacy({ ...base, generate: genLegacy, recordUse: () => uses++, write: (o) => { saved = o; } });
    assert("LEGACY: the frozen serial engine still dreams (rollouts ≤ 8, T7 only)", r.ok && r.rollouts <= MAX_ROLLOUTS && uses === r.rollouts && saved.inert === true);
    assert("LEGACY: output shape unchanged (no engine stamp — the old contract)", saved.engine === undefined && saved.entries.every(e => e.reframe && e.drill));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const p = readJson(PRECACHE);
    console.log(p ? `dmn: precache ${p.date} — ${p.entries.length} predicted stall(s) loaded (${p.rollouts} rollouts${p.engine === "stadium" ? ` · stadium across ${(p.lanes || []).join("+")} · ${p.verified || 0} verified` : " · legacy"}) · INERT until M7 serves it through the earned-voice gate` : "dmn: no precache yet — it dreams when he's away");
    return;
  }
  if (mode === "drain") {
    const d = await drainBg({});
    console.log(d.ok ? `dmn: second spotlight — ${d.drained} suppressed thought(s) drained${d.waiting ? `, ${d.waiting} waiting` : ""}${d.note ? ` (${d.note})` : ""}` : `dmn: no drain — ${d.skipped}`);
    return;
  }
  // the drain rides every pass first (cheap, ≤6, mouth/eyes lanes excluded mid-day)
  const bg = await drainBg({}).catch(() => ({ ok: false, skipped: "drain error" }));
  if (bg.ok && bg.drained) console.log(`dmn: second spotlight — ${bg.drained} suppressed thought(s) drained`);
  const r = await dream({ force: process.argv.includes("--force") });
  console.log(r.ok ? `dmn: dreamed — ${r.entries} stall signature(s) from ${r.rollouts} rollouts across ${(r.lanes || []).join("+")} (${r.verified} verified; INERT ammunition for M7)` : `dmn: no dream — ${r.skipped}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { weakVector, isAway, dream, dreamLegacy, drainBg, borrowableTanks, clusterRollouts, rolloutPrompt, counterPrompt, PERSONAS, MAX_ROLLOUTS, MAX_ROLLOUTS_NIGHT, ROLLOUTS_PER_WEAK, BG_DRAIN_CAP };
