#!/usr/bin/env node
// ============================================================================
// shadow.mjs · ARSENAL AI FC — THE ORGANISM: THE SHADOW ENGINE (U3b)
// ----------------------------------------------------------------------------
// WHAT:  Earned proactivity (L2 — the crown mechanism of the continuous-time
//        organism). The proactive mouth trains SILENTLY: every would-have-
//        spoken moment is logged as a SHADOW (never voiced); the evening pass
//        resolves each against what actually happened ("would it have
//        helped?"); an interruption-type earns VOICE only at proven shadow
//        hit-rate PLUS the captain's one-time spoken ratification — the
//        no-look-pass machinery pointed at the mouth.
// LAWS:  bias-to-silence (shadows are silent BY CONSTRUCTION) · RED = the
//        engine doesn't even shadow (rest is rest) · the captain's own
//        reminders are EXEMPT upstream (his voice echoed ≠ ping — dugout's
//        lane, not this engine's business) · nothing auto-ratifies: a proven
//        hit-rate only OPENS the door; his word walks through it · one shadow
//        per type per day (no spam even in the dark).
// WRITER OF: shadow_log.jsonl · proactivity_ledger.json (single-writer law)
// MODES: detect · score · ratify <type> · status · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SHADOW_LOG = join(STATE_DIR, "shadow_log.jsonl");
const LEDGER = join(STATE_DIR, "proactivity_ledger.json");

// the candidate interruption-types being shadow-trained (from the captain's
// approved brainstorm; his own timed reminders are exempt and NOT here)
const TYPES = ["stoppage_next_drill", "wall_breaker", "due_at_kickoff", "scrimmage_door"];
const VOICE_GATE = { min_shadows: 10, min_hit_rate: 0.7 };   // proven, not vibes

const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const hhmmOf = (now) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch { } return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch { } } } catch { } return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// DETECTION (pure) — would-have-spoken moments from the live bus
// world = { verdict, struggle_verdict, reps_today, last_rep_ago_min,
//           drills_pending, staged_scrimmage, hhmm }
// ---------------------------------------------------------------------------
function detectShadows(world, alreadyToday = new Set(), now = new Date()) {
  const out = [];
  if (String(world.verdict || "GREEN").toUpperCase() === "RED") return out;   // RED: not even shadows
  const push = (type, evidence, would) => { if (!alreadyToday.has(type)) out.push({ ts: now.toISOString(), type, evidence, would, resolved: false }); };

  if (world.struggle_verdict === "spinning")
    push("wall_breaker", "struggle=spinning", "the green-ball line — same crack, a different door is queued");
  if ((world.reps_today || 0) > 0 && (world.last_rep_ago_min ?? Infinity) >= 60 && world.hhmm >= "10:00" && world.hhmm <= "20:00" && world.drills_pending)
    push("stoppage_next_drill", `last rep ${world.last_rep_ago_min}min ago, drills pending`, "offer the next set piece at the stoppage");
  if (world.hhmm >= "10:30" && world.hhmm <= "12:00" && (world.reps_today || 0) === 0 && world.drills_pending)
    push("due_at_kickoff", "no reps by late morning, packet compiled", "the kickoff nudge — first ball is winnable");
  if (world.staged_scrimmage)
    push("scrimmage_door", "scout staged a scrimmage, trigger met", "offer the scrimmage door, once");
  return out;
}

// ---------------------------------------------------------------------------
// SCORING (pure) — evening resolution: would it have helped?
// dayFacts = { rep_times_iso: [..], spinning_persisted, first_rep_hhmm, scrimmage_played }
// ---------------------------------------------------------------------------
function scoreShadow(moment, facts) {
  if (moment.type === "wall_breaker")
    return { hit: !!facts.spinning_persisted, basis: facts.spinning_persisted ? "spinning persisted — the line would have helped" : "he broke out himself — silence was right" };
  if (moment.type === "stoppage_next_drill") {
    const t0 = new Date(moment.ts).getTime();
    const resumed = (facts.rep_times_iso || []).some(t => { const ms = new Date(t).getTime() - t0; return ms > 0 && ms <= 45 * 60000; });
    return { hit: !resumed, basis: resumed ? "he resumed on his own inside 45min" : "no return inside 45min — the offer would have helped" };
  }
  if (moment.type === "due_at_kickoff") {
    const late = !facts.first_rep_hhmm || facts.first_rep_hhmm >= "12:00";
    return { hit: late, basis: late ? "kickoff slid past noon — the nudge would have helped" : "he kicked off soon after — no nudge needed" };
  }
  if (moment.type === "scrimmage_door")
    return { hit: !facts.scrimmage_played, basis: facts.scrimmage_played ? "he walked through the door himself" : "door stayed shut — the offer would have helped" };
  return { hit: false, basis: "unknown type — never counts a hit it can't explain" };
}

// ---------------------------------------------------------------------------
// LEDGER (pure) — hit-rates open the door; ONLY the captain's word walks through
// ---------------------------------------------------------------------------
function updateLedger(prev, resolvedMoments) {
  const led = prev && prev.types ? JSON.parse(JSON.stringify(prev)) : { types: {} };
  for (const t of TYPES) led.types[t] = led.types[t] || { shadows: 0, hits: 0, hit_rate: null, eligible: false, ratified: false, voice: false };
  for (const m of resolvedMoments) {
    const e = led.types[m.type]; if (!e) continue;
    e.shadows += 1; e.hits += m.hit ? 1 : 0;
  }
  for (const t of TYPES) {
    const e = led.types[t];
    e.hit_rate = e.shadows ? Math.round(100 * e.hits / e.shadows) / 100 : null;
    e.eligible = e.shadows >= VOICE_GATE.min_shadows && (e.hit_rate || 0) >= VOICE_GATE.min_hit_rate;
    e.voice = !!(e.eligible && e.ratified);   // ratification NEVER survives losing eligibility
  }
  led.gate = VOICE_GATE;
  led.updated = new Date().toISOString();
  return led;
}
function ratifyType(led, type) {
  const e = led && led.types && led.types[type];
  if (!e) return { ok: false, why: `unknown type '${type}'` };
  if (!e.eligible) return { ok: false, why: `not proven yet — ${e.shadows}/${VOICE_GATE.min_shadows} shadows, hit-rate ${e.hit_rate ?? "—"} (needs ≥${VOICE_GATE.min_hit_rate})` };
  if (e.ratified) return { ok: false, why: "already ratified" };
  e.ratified = true; e.voice = true;
  return { ok: true, why: "ratified by the captain's word — the mouth is earned for this type" };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 12, 11, 0, 0);

  // detection
  const spin = detectShadows({ verdict: "GREEN", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(), now);
  assert("spinning → wall_breaker shadow (silent by construction)", spin.length === 1 && spin[0].type === "wall_breaker" && spin[0].resolved === false);
  assert("RED → not even shadows (rest is rest)", detectShadows({ verdict: "RED", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(), now).length === 0);
  assert("one shadow per type per day (no spam in the dark)", detectShadows({ verdict: "GREEN", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(["wall_breaker"]), now).length === 0);
  const stop = detectShadows({ verdict: "GREEN", reps_today: 5, last_rep_ago_min: 75, drills_pending: true, hhmm: "14:00" }, new Set(), now);
  assert("long stoppage with drills pending → next-drill shadow", stop.some(m => m.type === "stoppage_next_drill"));
  assert("no stoppage shadow while he's working (rep 10min ago)", detectShadows({ verdict: "GREEN", reps_today: 5, last_rep_ago_min: 10, drills_pending: true, hhmm: "14:00" }, new Set(), now).length === 0);
  assert("no reps by 10:30 + packet ready → kickoff shadow", detectShadows({ verdict: "GREEN", reps_today: 0, drills_pending: true, hhmm: "10:45" }, new Set(), now).some(m => m.type === "due_at_kickoff"));
  assert("staged scrimmage → door shadow", detectShadows({ verdict: "GREEN", staged_scrimmage: true, hhmm: "15:00" }, new Set(), now).some(m => m.type === "scrimmage_door"));

  // scoring
  const wb = { ts: now.toISOString(), type: "wall_breaker" };
  assert("wall_breaker HIT when spinning persisted", scoreShadow(wb, { spinning_persisted: true }).hit === true);
  assert("wall_breaker MISS when he broke out himself", scoreShadow(wb, { spinning_persisted: false }).hit === false);
  const sd = { ts: now.toISOString(), type: "stoppage_next_drill" };
  assert("stoppage MISS when he resumed inside 45min (silence was right)", scoreShadow(sd, { rep_times_iso: [new Date(now.getTime() + 20 * 60000).toISOString()] }).hit === false);
  assert("stoppage HIT when no return inside 45min", scoreShadow(sd, { rep_times_iso: [] }).hit === true);
  assert("kickoff HIT when first rep slid past noon", scoreShadow({ type: "due_at_kickoff" }, { first_rep_hhmm: "13:10" }).hit === true);
  assert("kickoff MISS when he kicked off himself", scoreShadow({ type: "due_at_kickoff" }, { first_rep_hhmm: "11:05" }).hit === false);
  assert("unknown type never counts a hit", scoreShadow({ type: "??" }, {}).hit === false);

  // ledger + the two-key gate
  let led = updateLedger(null, Array(9).fill({ type: "wall_breaker", hit: true }));
  assert("9 perfect shadows still NOT eligible (volume gate)", led.types.wall_breaker.eligible === false);
  led = updateLedger(led, [{ type: "wall_breaker", hit: true }]);
  assert("10th shadow at 100% → door OPENS (eligible)", led.types.wall_breaker.eligible === true && led.types.wall_breaker.voice === false);
  assert("eligibility alone NEVER voices (his word is the second key)", led.types.wall_breaker.voice === false);
  const r1 = ratifyType(led, "wall_breaker");
  assert("captain's ratification walks through the open door", r1.ok === true && led.types.wall_breaker.voice === true);
  const led2 = updateLedger(null, [{ type: "due_at_kickoff", hit: false }, { type: "due_at_kickoff", hit: true }]);
  const r2 = ratifyType(led2, "due_at_kickoff");
  assert("ratify REFUSED before the proof (honest refusal, with numbers)", r2.ok === false && r2.why.includes("not proven"));
  assert("hit-rate math honest", led2.types.due_at_kickoff.hit_rate === 0.5);
  led.types.wall_breaker.hits = 2; led.types.wall_breaker.shadows = 10;
  const led3 = updateLedger(led, []);
  assert("voice REVOKED if the hit-rate decays (ratification can't outlive proof)", led3.types.wall_breaker.voice === false);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function gatherWorld(now) {
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl")).filter(r => String(r.ts || "").slice(0, 10) === localDate(now));
  const lastRep = reps.length ? new Date(reps[reps.length - 1].ts) : null;
  const drills = readJson(join(STATE_DIR, "drills.json")) || {};
  const pr = readJson(join(STATE_DIR, "pitch_read.json")) || {};
  return {
    verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || "GREEN",
    struggle_verdict: pr.struggle ? pr.struggle.verdict : "no_data",
    reps_today: reps.length,
    last_rep_ago_min: lastRep ? Math.round((now - lastRep) / 60000) : null,
    drills_pending: Array.isArray(drills.drills) && drills.drills.length > 0,
    staged_scrimmage: ((readJson(join(STATE_DIR, "scout.json")) || {}).staged || []).some(s => s.kind === "scrimmage" && s.trigger_met),
    hhmm: hhmmOf(now),
  };
}

async function main() {
  const mode = (process.argv[2] || "detect").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const now = new Date();

  if (mode === "detect") {
    const today = localDate(now);
    const already = new Set(readLines(SHADOW_LOG).filter(l => String(l.ts || "").slice(0, 10) === today).map(l => l.type));
    const moments = detectShadows(gatherWorld(now), already, now);
    for (const m of moments) appendFileSync(SHADOW_LOG, JSON.stringify(m) + "\n");
    console.log(`shadow: ${moments.length} shadow(s) logged silently${moments.length ? " [" + moments.map(m => m.type).join(", ") + "]" : ""} — the mouth stays shut`);
    return;
  }
  if (mode === "score") {
    const lines = readLines(SHADOW_LOG);
    const unresolved = lines.filter(l => !l.resolved);
    if (!unresolved.length) { console.log("shadow: nothing to score"); return; }
    const today = localDate(now);
    const reps = readLines(join(STATE_DIR, "reps_log.jsonl")).filter(r => String(r.ts || "").slice(0, 10) === today);
    const hist = readLines(join(STATE_DIR, "pitch_read_history.jsonl")).slice(-4);
    const facts = {
      rep_times_iso: reps.map(r => r.ts),
      first_rep_hhmm: reps.length ? hhmmOf(new Date(reps[0].ts)) : null,
      spinning_persisted: hist.filter(h => h.struggle === "spinning").length >= 2,
      scrimmage_played: reps.some(r => /scrimmage/i.test(r.note || "")),
    };
    const resolved = [];
    for (const m of unresolved) {
      const { hit, basis } = scoreShadow(m, facts);
      m.resolved = true; m.hit = hit; m.basis = basis; m.scored_at = now.toISOString();
      resolved.push(m);
    }
    writeFileSync(SHADOW_LOG, lines.map(l => JSON.stringify(l)).join("\n") + "\n");
    const led = updateLedger(readJson(LEDGER), resolved);
    writeAtomic(LEDGER, led);
    console.log(`shadow: scored ${resolved.length} shadow(s) [${resolved.map(m => `${m.type}:${m.hit ? "hit" : "miss"}`).join(", ")}] → proactivity_ledger.json`);
    return;
  }
  if (mode === "ratify") {
    const type = process.argv[3];
    const led = readJson(LEDGER) || updateLedger(null, []);
    const r = ratifyType(led, type);
    if (r.ok) writeAtomic(LEDGER, led);
    console.log(`shadow: ratify ${type} → ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  if (mode === "status") {
    const led = readJson(LEDGER) || updateLedger(null, []);
    for (const [t, e] of Object.entries(led.types)) console.log(`  ${t}: ${e.shadows} shadows · hit-rate ${e.hit_rate ?? "—"} · ${e.voice ? "VOICE EARNED" : e.eligible ? "door open, awaiting his word" : "training silently"}`);
    return;
  }
  console.log("shadow: modes — detect · score · ratify <type> · status · selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { detectShadows, scoreShadow, updateLedger, ratifyType, TYPES, VOICE_GATE };
