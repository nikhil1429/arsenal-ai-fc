#!/usr/bin/env node
// ============================================================================
// dmn.mjs · ARSENAL AI FC — THE DEFAULT MODE NETWORK ("The Rest Room")
// ----------------------------------------------------------------------------
// WHAT:  The brain region that fires when the captain is AWAY (CYBORG_BRAIN.md
//        §7a): idle free tanks become scratch cortex. It pulls his REAL
//        weak-point vector (calibration danger zone + stalling concepts +
//        lowest-confidence Twin markets), fans a small MONTE-CARLO INTERVIEW
//        SIMULATION across the pool — each rollout a different interviewer
//        persona probing exactly those soft spots — then deterministically
//        clusters where the simulated candidate stalls and PRE-DRAFTS the
//        15-second reframe + next drill for each predicted stall into
//        dmn_precache.json.
// LAWS:  OUTPUT IS INERT — it only loads ammunition; nothing reads it aloud
//        (M7's Predictive Presence serves it through the earned-voice gate).
//        Dreams ONLY about real weak points from real reps — never fabricated
//        ones (no signal → no dream, honest skip). Fires ONLY when: the
//        captain is away (ActivityWatch AFK), the tone allows it (conserve =
//        MUTED — a depleted captain rests), and the tank has measured
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
import { generatePool } from "./hippocampus.mjs";
import { loadBoard, headroomOf, recordUse } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PRECACHE  = join(STATE_DIR, "dmn_precache.json");
const AW = "http://localhost:5600";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const MAX_ROLLOUTS = 8;                              // hard cap per dream pass
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

// ---------------------------------------------------------------------------
// THE DREAM — rollouts → deterministic clustering → inert precache
// ---------------------------------------------------------------------------
function rolloutPrompt(weak, persona) {
  return `Simulate ONE tough interview probe. You are ${persona}. The candidate is an AI Product Engineer applicant whose known soft spot is: "${weak.concept}" (${weak.why}). Output STRICT JSON, no fences: {"stall_point": "<the exact sub-question where such a candidate most plausibly stalls, <=120 chars>", "reframe_15s": "<the 15-second reframe that would un-stick him, spoken, <=200 chars>", "drill": "<one concrete 10-minute drill for tomorrow, <=120 chars>"}`;
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
  const genOK = async (p) => ({ ok: true, text: JSON.stringify({ stall_point: /eval/.test(p) ? "precision recall tradeoff at threshold" : "lost context after compaction", reframe_15s: "start from the confusion matrix, one cell at a time", drill: "hand-compute P/R on 10 rows" }) });
  const base = { force: true, tone: { effects: { dmn_allowed: true } }, weak: weakFix, board: boardFix(20), generate: genOK, recordUse: () => {}, write: () => {}, now: new Date("2026-07-14T15:00:00") };

  // the gates
  assert("CONSERVE tone MUTES the dream (a depleted captain rests)", (await dream({ ...base, tone: { effects: { dmn_allowed: false } } })).skipped.includes("conserve"));
  assert("present captain → no dream (the Rest Room fires only when away)", (await dream({ ...base, force: false, awayCheck: async () => ({ away: false, why: "present" }) })).skipped.includes("not away"));
  assert("no REAL weak points → honest skip (never dreams fabricated cracks)", (await dream({ ...base, weak: [] })).skipped.includes("nothing honest"));
  assert("no tank headroom → no dream (use-it-or-lose-it only, $0 blast radius)", (await dream({ ...base, board: boardFix(2) })).skipped.includes("headroom"));

  // the dream
  {
    let saved = null, uses = 0;
    const r = await dream({ ...base, recordUse: () => uses++, write: (o) => { saved = o; } });
    assert("away + tone + headroom → the dream runs and lands in the precache", r.ok && saved && saved.entries.length >= 1);
    assert("rollouts hard-capped ≤ 8 and every spend recorded on T7", r.rollouts <= 8 && uses === r.rollouts);
    assert("OUTPUT IS INERT — flagged, dated, drafts only", saved.inert === true && saved.date === "2026-07-14" && saved.entries.every(e => e.reframe && e.drill));
    assert("clustering: same stall signature merges with votes", saved.entries.some(e => e.votes >= 2));
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
  assert("all rollouts dry → honest skip, precache untouched", (await dream({ ...base, generate: async () => ({ ok: false }), write: () => { throw new Error("must not write"); } })).skipped.includes("dry"));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const p = readJson(PRECACHE);
    console.log(p ? `dmn: precache ${p.date} — ${p.entries.length} predicted stall(s) loaded (${p.rollouts} rollouts) · INERT until M7 serves it through the earned-voice gate` : "dmn: no precache yet — it dreams when he's away");
    return;
  }
  const r = await dream({ force: process.argv.includes("--force") });
  console.log(r.ok ? `dmn: dreamed — ${r.entries} stall signature(s) pre-drafted from ${r.rollouts} rollouts (INERT ammunition for M7)` : `dmn: no dream — ${r.skipped}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { weakVector, isAway, dream, clusterRollouts, rolloutPrompt, PERSONAS, MAX_ROLLOUTS };
