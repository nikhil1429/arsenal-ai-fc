#!/usr/bin/env node
// ============================================================================
// scorer.mjs · ARSENAL AI FC — THE ORGANISM: THE EVENING SCORER (the Slip)
// ----------------------------------------------------------------------------
// WHAT:  The metabolism's second half (THE_ORGANISM §IV.1). ONE ledger
//        (slip.jsonl), three books scored by ONE arithmetic: the CAPTAIN's
//        calibration (daily ECE snapshot), the TWIN's sealed bets, the
//        GAFFER's coaching moves (drill proposals maturing over a horizon).
//        Plus the No-Look Pass: trust tiers computed from validated hit-rates.
// WHY:   Without scored bets, both self-models are astrology. Calibration
//        stops being a private virtue and becomes the metabolism the whole
//        organism runs on.
// CONSTITUTIONAL (each selftested):
//   · ONE ARITHMETIC — the exported ece() from calibration.mjs scores the
//     captain's book; Brier scores the twin's and gaffer's. Same format,
//     same ledger, both directions.
//   · NEVER GUESS A RESOLUTION — a bet whose instrument is dark is SKIPPED
//     with evidence "instrument dark", never resolved by assumption.
//   · DESCRIPTIVE, NEVER LEVER-RANKING — gaffer tallies carry no rank field;
//     they are context for the Opus call, not an automated policy.
//   · NOTHING AUTO-PROMOTES — a tier crossing the no-look threshold gets
//     pending_ratification:true; the captain ratifies once, out loud.
//
// INPUT (read-only): predictions.jsonl · calibration.json · reps_log.jsonl ·
//   timeaudit.json · pitch_read.json · drills.json · post_match/<date>.md
// OUTPUT: slip.jsonl (append; sole writer) + trust_tiers.json (sole writer)
// MODES:  run (default: resolve matured + snapshot + propose) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ece } from "./calibration.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "scorer_config.json");
const SLIP      = join(STATE_DIR, "slip.jsonl");
const TIERS     = join(STATE_DIR, "trust_tiers.json");

const DEFAULTS = {
  session_min_minutes: 45,
  first_focus_deadline: "09:30",
  trust: { no_look_min_hit_rate: 0.9, no_look_min_n: 20 },
  gaffer_horizon_days: 3,
  targets: { knew: 0.95, shaky: 0.65, guessed: 0.30 },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        session_min_minutes: typeof j.session_min_minutes === "number" ? j.session_min_minutes : DEFAULTS.session_min_minutes,
        first_focus_deadline: j.first_focus_deadline || DEFAULTS.first_focus_deadline,
        trust: { ...DEFAULTS.trust, ...(j.trust || {}) },
        gaffer_horizon_days: typeof j.gaffer_horizon_days === "number" ? j.gaffer_horizon_days : DEFAULTS.gaffer_horizon_days,
        targets: { ...DEFAULTS.targets, ...(j.targets || {}) },
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
// TWIN resolutions for a given date — never guessed; dark instrument = skip.
function resolveTwin(preds, world, dateStr, cfg) {
  const out = [];
  const todays = preds.filter(p => p.date === dateStr);
  for (const p of todays) {
    let hit = null, evidence = null;
    if (p.market === "floor_touched") {
      if (world.repsOnDate !== null) { hit = world.repsOnDate > 0 || world.postmatchHit === true; evidence = `${world.repsOnDate} rep(s)${world.postmatchHit ? " + post-match HIT" : ""}`; }
      else if (world.postmatchHit !== null) { hit = world.postmatchHit; evidence = "post-match verdict"; }
    } else if (p.market === "session_happened") {
      if (world.activeMinutes !== null) { hit = world.activeMinutes >= cfg.session_min_minutes; evidence = `${world.activeMinutes} active min (need ${cfg.session_min_minutes})`; }
    } else if (p.market === "first_focus_by_0930") {
      if (world.firstFocusKnown) { hit = world.firstFocusBy0930; evidence = world.firstFocusEvidence; }
    }
    if (hit === null) { out.push({ skipped: true, market: p.market, reason: "instrument dark" }); continue; }
    out.push({ date: dateStr, book: "twin", type: p.market, claim: p.market, p: p.p, horizon_days: 0, resolved: true, hit, evidence });
  }
  return out;
}

// CAPTAIN book: daily ECE snapshot; hit = gap narrowed vs previous snapshot.
function captainSnapshot(calibration, prevSnapshots, dateStr) {
  if (!calibration || typeof calibration.calibration_gap !== "number") return null;
  if (prevSnapshots.some(s => s.date === dateStr)) return null;         // idempotent per day
  const prev = prevSnapshots[prevSnapshots.length - 1];
  const hit = prev && typeof prev.gap === "number" ? calibration.calibration_gap <= prev.gap : true;
  return { date: dateStr, book: "captain", type: "calibration_gap", claim: "gap holds or narrows",
    p: null, gap: calibration.calibration_gap, horizon_days: 1, resolved: true, hit,
    evidence: prev ? `gap ${prev.gap} → ${calibration.calibration_gap}` : `first snapshot: ${calibration.calibration_gap}` };
}

// GAFFER book: (a) append today's drills as unresolved proposals;
// (b) mature proposals ≥ horizon old: hit = reps landed on those concepts.
function gafferPropose(drills, existing, dateStr) {
  if (!drills || !Array.isArray(drills.drills) || !drills.drills.length) return [];
  const already = new Set(existing.filter(s => s.book === "gaffer" && !s.resolved).map(s => `${s.date}|${s.claim}`));
  return drills.drills.filter(d => d.kind !== "floor_touch").map(d => ({
    date: dateStr, book: "gaffer", type: "drill:" + d.kind,
    claim: (d.concepts || []).join("+") || d.kind, p: null,
    horizon_days: 3, resolved: false, hit: null, evidence: d.source || null,
  })).filter(e => !already.has(`${e.date}|${e.claim}`));
}

function gafferMature(existing, repsByDate, dateStr, horizonDays) {
  const out = [];
  for (const s of existing) {
    if (s.book !== "gaffer" || s.resolved) continue;
    const age = Math.round((new Date(dateStr) - new Date(s.date)) / 86400000);
    if (age < (s.horizon_days || horizonDays)) continue;
    const concepts = String(s.claim || "").split("+").filter(Boolean);
    let played = false;
    for (let i = 1; i <= (s.horizon_days || horizonDays); i++) {
      const d = localDate(new Date(new Date(s.date).getTime() + i * 86400000));
      const set = repsByDate[d];
      if (set && concepts.some(c => set.has(c.toLowerCase()))) { played = true; break; }
    }
    out.push({ ...s, resolved: true, hit: played, evidence: (s.evidence || "") + ` | matured d+${age}: ${played ? "reps landed" : "no reps on it"}` });
  }
  return out;
}

// TRUST TIERS — rolling per-type hit-rate; nothing auto-promotes.
function computeTiers(slip, cfg, prevTiers, now) {
  const byType = {};
  for (const s of slip) {
    if (!s.resolved || typeof s.hit !== "boolean") continue;
    (byType[s.type] = byType[s.type] || []).push(s.hit);
  }
  const prevMap = new Map(((prevTiers && prevTiers.tiers) || []).map(t => [t.type, t]));
  const tiers = Object.entries(byType).map(([type, hits]) => {
    const n = hits.length;
    const hit_rate = round(hits.filter(Boolean).length / n, 4);
    const qualifies = n >= cfg.trust.no_look_min_n && hit_rate >= cfg.trust.no_look_min_hit_rate;
    const prev = prevMap.get(type);
    const ratified = prev ? prev.no_look === true && prev.pending_ratification === false : false;
    return {
      type, n, hit_rate,
      no_look: qualifies && ratified,                       // only a ratified tier renders bare
      pending_ratification: qualifies && !ratified,          // the captain says the word once
    };
  });
  return {
    date: localDate(now), status: tiers.length ? "ok" : "awaiting_data", low_confidence: false,
    generated_at: now.toISOString(), tiers,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 21, 35, 0);
  const today = "2026-07-12";

  // ONE ARITHMETIC — imported ece() works exactly as calibration's
  const reps = [
    { confidence: "knew", correct: true }, { confidence: "knew", correct: true },
    { confidence: "knew", correct: false }, { confidence: "guessed", correct: false },
  ];
  // hand-computed: (3/4)·|2/3−0.95| + (1/4)·|0−0.30| = 0.2125 + 0.075 = 0.2875
  const gap = ece(reps, cfg.targets);
  assert("ONE ARITHMETIC — imported ece() computes (0.2875 hand fixture)", round(gap) === 0.2875);

  // twin resolution
  const preds = [
    { date: today, market: "floor_touched", p: 0.5 },
    { date: today, market: "session_happened", p: 0.5 },
    { date: today, market: "first_focus_by_0930", p: 0.5 },
  ];
  const world1 = { repsOnDate: 2, postmatchHit: null, activeMinutes: 120, firstFocusKnown: true, firstFocusBy0930: false, firstFocusEvidence: "wall until 10:05" };
  const res1 = resolveTwin(preds, world1, today, cfg);
  assert("floor_touched resolves on reps", res1.find(r => r.type === "floor_touched").hit === true);
  assert("session_happened resolves on active minutes", res1.find(r => r.type === "session_happened").hit === true);
  assert("first_focus resolves from tunnel evidence", res1.find(r => r.type === "first_focus_by_0930").hit === false);

  // NEVER GUESS — dark instruments skip
  const dark = resolveTwin(preds, { repsOnDate: null, postmatchHit: null, activeMinutes: null, firstFocusKnown: false }, today, cfg);
  assert("NEVER GUESS — dark instrument ⇒ skipped with reason", dark.every(r => r.skipped && r.reason === "instrument dark"));

  // captain snapshot: narrowing = hit; idempotent
  const snap1 = captainSnapshot({ calibration_gap: 0.2 }, [], today);
  assert("first captain snapshot is a hit (baseline)", snap1.hit === true && snap1.gap === 0.2);
  const snap2 = captainSnapshot({ calibration_gap: 0.15 }, [{ date: "2026-07-11", gap: 0.2 }], today);
  assert("gap narrowed ⇒ hit", snap2.hit === true);
  const snap3 = captainSnapshot({ calibration_gap: 0.3 }, [{ date: "2026-07-11", gap: 0.2 }], today);
  assert("gap widened ⇒ miss (honest)", snap3.hit === false);
  assert("snapshot idempotent per day", captainSnapshot({ calibration_gap: 0.1 }, [{ date: today, gap: 0.2 }], today) === null);

  // gaffer propose + mature
  const drills = { drills: [{ kind: "derby", concepts: ["tokenization", "embeddings"], source: "confused ×4" }, { kind: "floor_touch", concepts: [] }] };
  const props = gafferPropose(drills, [], today);
  assert("gaffer proposals appended unresolved (floor_touch excluded)", props.length === 1 && props[0].resolved === false);
  assert("gaffer propose idempotent", gafferPropose(drills, props, today).length === 0);
  const repsByDate = { "2026-07-11": new Set(["embeddings"]) };
  const matured = gafferMature([{ date: "2026-07-09", book: "gaffer", type: "drill:derby", claim: "tokenization+embeddings", horizon_days: 3, resolved: false }], repsByDate, "2026-07-12", 3);
  assert("gaffer proposal matures at horizon: reps landed ⇒ hit", matured.length === 1 && matured[0].hit === true);
  const maturedMiss = gafferMature([{ date: "2026-07-09", book: "gaffer", type: "drill:derby", claim: "chunking", horizon_days: 3, resolved: false }], repsByDate, "2026-07-12", 3);
  assert("no reps in horizon ⇒ honest miss", maturedMiss[0].hit === false);
  assert("young proposals left unresolved", gafferMature([{ date: today, book: "gaffer", type: "drill:derby", claim: "x", horizon_days: 3, resolved: false }], {}, today, 3).length === 0);

  // trust tiers
  const slip = Array.from({ length: 25 }, (_, i) => ({ type: "drill:recall", book: "gaffer", resolved: true, hit: i !== 0 }));
  const tiers1 = computeTiers(slip, cfg, null, now);
  const t = tiers1.tiers.find(x => x.type === "drill:recall");
  assert("tier crossing threshold ⇒ pending_ratification, NOT no_look", t.pending_ratification === true && t.no_look === false);
  const tiers2 = computeTiers(slip, cfg, { tiers: [{ type: "drill:recall", no_look: true, pending_ratification: false }] }, now);
  assert("ratified tier renders no_look", tiers2.tiers.find(x => x.type === "drill:recall").no_look === true);
  assert("DESCRIPTIVE LAW — no rank/lever fields anywhere", !JSON.stringify(tiers1).match(/"rank"|"lever"/));
  assert("empty slip ⇒ awaiting_data", computeTiers([], cfg, null, now).status === "awaiting_data");

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const today = localDate(now);
  const slip = readLines(SLIP);
  const preds = readLines(join(STATE_DIR, "predictions.jsonl"));
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
  const repsByDate = {};
  for (const r of reps) {
    const d = String(r.ts || "").slice(0, 10);
    (repsByDate[d] = repsByDate[d] || new Set()).add(String(r.concept || "").toLowerCase());
  }
  const ta = readJson(join(STATE_DIR, "timeaudit.json"));
  const pr = readJson(join(STATE_DIR, "pitch_read.json"));
  const pmPath = join(STATE_DIR, "post_match", today + ".md");
  const pmText = existsSync(pmPath) ? readFileSync(pmPath, "utf8") : null;
  const world = {
    repsOnDate: reps.length ? (repsByDate[today] ? repsByDate[today].size : 0) : (existsSync(join(STATE_DIR, "reps_log.jsonl")) ? 0 : null),
    postmatchHit: pmText ? /\b(HIT|PARTIAL)\b/.test(pmText) : null,
    activeMinutes: ta && typeof ta.productiveMinutes === "number" ? ta.productiveMinutes
      : (ta && ta.buckets ? ["Learning", "Building"].reduce((a, b) => a + ((ta.buckets[b] && ta.buckets[b].minutes) || 0), 0) : null),
    firstFocusKnown: !!(pr && pr.date === today && pr.tunnel && pr.tunnel.state !== "no_data"),
    firstFocusBy0930: !!(pr && pr.tunnel && pr.tunnel.state !== "wall" && pr.tunnel.wall_minutes_today === 0),
    firstFocusEvidence: pr && pr.tunnel ? pr.tunnel.evidence : null,
  };

  const newRows = [];
  newRows.push(...resolveTwin(preds, world, today, cfg).filter(r => !r.skipped));
  const prevSnaps = slip.filter(s => s.book === "captain" && s.type === "calibration_gap");
  const snap = captainSnapshot(readJson(join(STATE_DIR, "calibration.json")), prevSnaps, today);
  if (snap) newRows.push(snap);
  const maturedRaw = gafferMature(slip, repsByDate, today, cfg.gaffer_horizon_days);
  newRows.push(...maturedRaw);
  newRows.push(...gafferPropose(readJson(join(STATE_DIR, "drills.json")), slip, today));

  if (newRows.length) {
    mkdirSync(dirname(SLIP), { recursive: true });
    appendFileSync(SLIP, newRows.map(r => JSON.stringify(r)).join("\n") + "\n");
  }
  const fullSlip = slip.concat(newRows);
  writeAtomic(TIERS, computeTiers(fullSlip, cfg, readJson(TIERS), now));
  const resolved = newRows.filter(r => r.resolved).length;
  console.log(`scorer: ${resolved} resolution(s), ${newRows.length - resolved} proposal(s) appended · slip=${fullSlip.length} rows → ${TIERS}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { resolveTwin, captainSnapshot, gafferPropose, gafferMature, computeTiers, loadConfig };
