#!/usr/bin/env node
// ============================================================================
// scout.mjs · ARSENAL AI FC — THE ORGANISM: THE ADVANCE SCOUT
// ----------------------------------------------------------------------------
// WHAT:  Feedforward, finally a mechanism (THE_ORGANISM §IV.3): THRESHOLD
//        TRIGGERS on real state — never extrapolation (the review killed
//        trend-fitting; this is the honest fill). ≥3 DEFEND-grade core
//        concepts → stage the first SCRIMMAGE tonight, in idle tokens, so it
//        sits ready the morning his numbers arrive. Python core held →
//        stage the next FinOps milestone brief. Plus the EDGE LEDGER's
//        LEARN/RATIFY split — the loop carries a model of his CHOSEN
//        ignorance, the one part of a learner no generic system has modeled.
// CONSTITUTIONAL (each selftested):
//   · NO PROJECTED DATE IS EVER SHOWN — the schema has no eta/deadline/
//     projected/days_to field; no date strings outside {date, generated_at}.
//     Projection steers what the loop PREPARES, never what he owes.
//   · A staged challenge is a DOOR THAT OPENS, never a day he owes — briefs
//     carry no "you should/must/owe" language.
//   · The LEARN/RATIFY split is a PROPOSAL — the captain approves; the loop
//     never decides what he won't know.
//
// FIELD CONTRACT (audit #37, 4 Aug 2026): every staged row carries
//   `trigger_met: true` alongside the human-readable `trigger` string. It is
//   redundant by construction — a row only EXISTS once its threshold passed —
//   but `shadow.mjs:196` has always read `s.trigger_met`, a field this file had
//   never emitted, so `staged_scrimmage` was false on every scrimmage the scout
//   genuinely staged and the scrimmage_door shadow could never fire. The flag is
//   also what ORGANISM_ANATOMY.md:180 documents the schema as carrying. Emitting
//   it makes the reader and the doc true at once; shadow.mjs accepts both shapes.
//
// INPUT (read-only): learning_state.json · concepts.json · dossier_weights.json ·
//   season.json · scout_config.json (canon)
// OUTPUT: dressing-room/state/scout.json (sole writer)
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "scout_config.json");
const OUT       = join(STATE_DIR, "scout.json");

const DEFAULTS = {
  scrimmage: { min_defend_grade_concepts: 3 },
  finops: { skills: ["pydantic", "fastapi", "async"], min_state: "held" },
  edges: { high_weight_rounds: ["system_design", "production_eval", "build"] },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        scrimmage: { ...DEFAULTS.scrimmage, ...(j.scrimmage || {}) },
        finops: { ...DEFAULTS.finops, ...(j.finops || {}) },
        edges: { ...DEFAULTS.edges, ...(j.edges || {}) },
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
const isFluent = (c) => String(c.fluency || "").includes("🟢") || /fluent/i.test(String(c.fluency || ""));
const isHeldPlus = (c) => isFluent(c) || String(c.fluency || "").includes("🟡") || /held/i.test(String(c.fluency || ""));

function stageTriggers(ls, cfg, dossier, season) {
  const staged = [];
  const concepts = ls && Array.isArray(ls.concepts) ? ls.concepts : [];

  // SCRIMMAGE — DEFEND-grade = fluent AND core, on the concept track
  const ready = concepts.filter(c => c.track !== "skill" && c.core && isFluent(c));
  if (ready.length >= cfg.scrimmage.min_defend_grade_concepts) {
    const modes = (dossier && dossier.round_mode_map && dossier.round_mode_map.R_late) || ["novel", "negative_space"];
    staged.push({
      kind: "scrimmage",
      trigger_met: true,                     // #37 — the field shadow.mjs reads
      trigger: `${ready.length}/${cfg.scrimmage.min_defend_grade_concepts} core concepts at DEFEND grade`,
      brief: `R-late scrimmage staged over ${ready.map(c => c.id).join(" · ")} — probe modes: ${modes.join(", ")}. A door, open whenever you want it.`,
    });
  }

  // FINOPS MILESTONE — every named core skill at held-or-better
  const skillMap = new Map(concepts.filter(c => c.track === "skill").map(c => [c.id, c]));
  const skillsReady = cfg.finops.skills.every(s => {
    const c = skillMap.get(s);
    return c && (cfg.finops.min_state === "held" ? isHeldPlus(c) : isFluent(c));
  });
  if (cfg.finops.skills.length && skillsReady) {
    const item = season && season.pipeline_item ? ` (${season.pipeline_item})` : "";
    staged.push({
      kind: "finops_milestone",
      trigger_met: true,                     // #37 — same contract, every kind
      trigger: `python core ${cfg.finops.skills.length}/${cfg.finops.skills.length} [${cfg.finops.skills.join(", ")}] all ≥ ${cfg.finops.min_state}`,
      brief: `The next FinOps milestone${item} is buildable on what you now hold. Spec sits ready when you want the ball.`,
    });
  }
  return staged;
}

// #106 — HAVE/NEED, not a bare word. `status:"awaiting_data"` tells him the
// scout found nothing; it does not tell him how close nothing is to something.
// This is a pure read of the SAME predicates stageTriggers uses (kept separate
// so stageTriggers' return contract is untouched), so the counter can never
// disagree with what actually staged. Every `need` is the configured threshold —
// no number is invented here.
function stageReadiness(ls, cfg) {
  const concepts = ls && Array.isArray(ls.concepts) ? ls.concepts : [];
  const ready = concepts.filter(c => c.track !== "skill" && c.core && isFluent(c));
  const skillMap = new Map(concepts.filter(c => c.track === "skill").map(c => [c.id, c]));
  const skillsHeld = cfg.finops.skills.filter(s => {
    const c = skillMap.get(s);
    return !!(c && (cfg.finops.min_state === "held" ? isHeldPlus(c) : isFluent(c)));
  });
  return {
    scrimmage: { have: ready.length, need: cfg.scrimmage.min_defend_grade_concepts, of: "core concepts at DEFEND grade" },
    finops: { have: skillsHeld.length, need: cfg.finops.skills.length, of: `python core skills ≥ ${cfg.finops.min_state}` },
  };
}
const readinessLine = (r) => `scrimmage ${r.scrimmage.have}/${r.scrimmage.need} ${r.scrimmage.of} · finops ${r.finops.have}/${r.finops.need} ${r.finops.of}`;

// LEARN/RATIFY — edges × DOSSIER round-weights, via concepts.json buckets.
function edgeSplit(ls, registry, dossier, cfg) {
  const learn = [], ratify = [];
  const edgeMap = (ls && ls.edge_map) || {};
  const bucketOf = (id) => {
    const c = registry && registry.concepts && registry.concepts[id];
    if (c && c.bucket) return c.bucket;
    if (registry && registry.skills && registry.skills[id]) return "skills";
    return null;
  };
  const roundsOf = (bucket) => (dossier && dossier.bucket_round_map && dossier.bucket_round_map[bucket]) || [];
  for (const [concept, edge] of Object.entries(edgeMap)) {
    if (!edge) continue;
    const rounds = roundsOf(bucketOf(concept));
    const high = rounds.some(r => cfg.edges.high_weight_rounds.includes(r));
    if (high) learn.push({ concept, edge_verbatim: edge, why: `edge sits on high-weight interview ground (${rounds.join("/")})` });
    else ratify.push({ concept, edge_verbatim: edge,
      negative_space_line: `"yeh main nahi karta, aur zaroorat bhi nahi, kyunki — ${edge}" (rehearsed honesty, the #1 senior signal)` });
  }
  return { learn, ratify };
}

// WAR-ROOM (compressed-season protocol): the captain logs interview_dates in
// season.json; inside the taper window the whole body shifts — short sharp
// mocks, DEFEND/NOVEL polish, no first-exposure, sleep-first. CONSTITUTIONAL:
// the flag carries NO date and NO days-remaining — the body prepares; it never
// counts down at him.
function warRoomRead(season, cfg, now) {
  const dates = season && Array.isArray(season.interview_dates) ? season.interview_dates : [];
  const taperDays = (cfg.war_room && cfg.war_room.taper_days) || 10;
  for (const d of dates) {
    const t = new Date(String(d).slice(0, 10));
    if (Number.isNaN(t.getTime())) continue;
    const ahead = (t - now) / 86400000;
    if (ahead >= 0 && ahead <= taperDays) return { active: true, mode: "taper" };
  }
  return { active: false, mode: null };
}

// APPLY WINDOW: canon — apply in parallel the moment M1 is demo-able. A door
// that opens, never a deadline.
const applyWindow = (staged) => ({ open: staged.some(s => s.kind === "finops_milestone") });

function buildScout(staged, edges, now, war_room = { active: false, mode: null }, readiness = null) {
  const any = staged.length || edges.learn.length || edges.ratify.length || war_room.active;
  return {
    date: localDate(now),
    // status stays in the house data-sufficiency vocabulary (manager.mjs:159/:167
    // pattern-matches === "ok"); the have/need counter rides BESIDE it, #106.
    status: any ? "ok" : "awaiting_data",
    low_confidence: false,
    generated_at: now.toISOString(),
    staged,
    readiness,
    readiness_line: readiness ? readinessLine(readiness) : null,
    edges,
    war_room,
    apply_window: applyWindow(staged),
    note: edges.learn.length + edges.ratify.length
      ? "edge split is a proposal — your word decides what enters the queue and what becomes a declared boundary"
      : null,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const dossier = JSON.parse(readFileSync(join(STATE_DIR, "dossier_weights.json"), "utf8"));
  const now = new Date(2026, 6, 12, 22, 0, 0);
  const registry = { concepts: { tokenization: { bucket: "1-fundamentals" }, chunking: { bucket: "2-rag" }, embeddings: { bucket: "2-rag" }, jagged: { bucket: "0-light" } }, skills: { pydantic: {}, fastapi: {}, async: {} } };

  const ls = {
    concepts: [
      { id: "tokenization", core: true, fluency: "🟢 fluent" },
      { id: "embeddings", core: true, fluency: "🟢 fluent" },
      { id: "inference", core: true, fluency: "🟢 fluent" },
      { id: "chunking", core: true, fluency: "🔴 learning" },
      { id: "pydantic", track: "skill", fluency: "🟡 held" },
      { id: "fastapi", track: "skill", fluency: "🟢 fluent" },
      { id: "async", track: "skill", fluency: "🟡 held" },
    ],
    edge_map: { chunking: "can size chunks, shaky on overlap tradeoffs", jagged: "jagged-frontier internals beyond me, don't need them" },
  };

  const staged = stageTriggers(ls, cfg, dossier, { pipeline_item: "M1 parser" });
  assert("scrimmage stages at ≥3 DEFEND-grade core", staged.some(s => s.kind === "scrimmage"));
  assert("finops milestone stages when python core held", staged.some(s => s.kind === "finops_milestone"));
  assert("brief is a door, not a debt", staged.every(s => !/you (should|must|owe)|by (mon|tue|wed|thu|fri|sat|sun)/i.test(s.brief)));

  // #37 — THE FIELD CONTRACT shadow.mjs:196 reads. Without this the scrimmage
  // door shadow can never fire, however genuinely the scout stages one.
  assert("#37 EVERY staged row emits trigger_met:true (the field shadow.mjs reads)",
    staged.length > 0 && staged.every(s => s.trigger_met === true));
  assert("#37 the human-readable trigger string survives beside the flag",
    staged.find(s => s.kind === "scrimmage").trigger.includes("DEFEND grade"));

  const below = stageTriggers({ concepts: ls.concepts.slice(2) }, cfg, dossier, null);
  assert("below threshold → no scrimmage staged", !below.some(s => s.kind === "scrimmage"));
  assert("#37 no staged row means no trigger_met to read (absence, not a false flag)",
    !below.some(s => s.kind === "scrimmage" && s.trigger_met));

  // #106 — have/need beside the status word
  const rdy = stageReadiness(ls, cfg);
  assert("#106 readiness counts the SAME predicate that staged (3/3 core at DEFEND)",
    rdy.scrimmage.have === 3 && rdy.scrimmage.need === cfg.scrimmage.min_defend_grade_concepts);
  assert("#106 finops counter is have/need over the named skills", rdy.finops.have === 3 && rdy.finops.need === 3);
  const rdyThin = stageReadiness({ concepts: ls.concepts.slice(2) }, cfg);
  assert("#106 a scout that staged nothing still says how far off it is, not just 'awaiting_data'",
    rdyThin.scrimmage.have < rdyThin.scrimmage.need && /\d+\/\d+/.test(readinessLine(rdyThin)));
  assert("#106 readiness survives a bloodless world without inventing a number",
    stageReadiness(null, cfg).scrimmage.have === 0 && stageReadiness(null, cfg).finops.have === 0);

  const edges = edgeSplit(ls, registry, dossier, cfg);
  assert("edge on high-weight ground → LEARN", edges.learn.some(e => e.concept === "chunking"));
  assert("edge on low-weight ground → RATIFY with negative-space line", edges.ratify.some(e => e.concept === "jagged" && e.negative_space_line.includes("yeh main nahi karta")));
  assert("edge text carried VERBATIM", edges.learn[0].edge_verbatim === "can size chunks, shaky on overlap tradeoffs");

  const scout = buildScout(staged, edges, now, undefined, rdy);
  assert("split marked as a proposal (captain decides)", /proposal/.test(scout.note));
  assert("#106 the counter ships on scout.json, not just the console", /3\/3/.test(scout.readiness_line));

  // WAR-ROOM — compressed-season protocol
  const wrCfg = { ...cfg, war_room: { taper_days: 10 } };
  const wrOn = warRoomRead({ interview_dates: ["2026-07-18"] }, wrCfg, new Date(2026, 6, 12));
  assert("war-room activates inside the taper window", wrOn.active === true && wrOn.mode === "taper");
  assert("war-room silent outside the window", warRoomRead({ interview_dates: ["2026-09-20"] }, wrCfg, new Date(2026, 6, 12)).active === false);
  assert("war-room safe on garbage dates / no season", warRoomRead({ interview_dates: ["soon"] }, wrCfg, now).active === false && warRoomRead(null, wrCfg, now).active === false);
  const wrScout = buildScout(staged, edges, now, wrOn, rdy);
  assert("NO-COUNTDOWN LAW — war_room carries no date/days field", !JSON.stringify(wrScout.war_room).match(/\d{4}-\d{2}-\d{2}|days|until|left/i));
  assert("apply window opens with the finops door", wrScout.apply_window.open === true);

  // NO-DATES LAW — structural: no forbidden field names, no date strings
  // outside the envelope.
  const json = JSON.stringify(scout);
  assert("NO-DATES LAW — no eta/deadline/projected/days_to fields", !/"(eta|deadline|projected|days_to|due_by|target_date)"/i.test(json));
  const stripped = JSON.stringify({ ...scout, date: "", generated_at: "" });
  assert("NO-DATES LAW — no date strings outside envelope", !/\d{4}-\d{2}-\d{2}/.test(stripped));

  const bloodless = buildScout(stageTriggers(null, cfg, dossier, null), edgeSplit(null, null, dossier, cfg), now, undefined, stageReadiness(null, cfg));
  assert("bloodless world → awaiting_data, no crash", bloodless.status === "awaiting_data");
  assert("#106 even awaiting_data reports 0/3 — the distance, not just the word", /0\/3/.test(bloodless.readiness_line));
  assert("NO-DATES LAW holds with the new readiness fields", !/\d{4}-\d{2}-\d{2}/.test(JSON.stringify({ ...bloodless, date: "", generated_at: "" })));

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
  const ls = readJson(join(STATE_DIR, "learning_state.json"));
  const registry = readJson(join(STATE_DIR, "concepts.json"));
  const dossier = readJson(join(STATE_DIR, "dossier_weights.json"));
  const season = readJson(join(STATE_DIR, "season.json"));
  const staged = stageTriggers(ls, cfg, dossier, season);
  const out = buildScout(staged, edgeSplit(ls, registry, dossier, cfg), now, warRoomRead(season, cfg, now), stageReadiness(ls, cfg));
  writeAtomic(OUT, out);
  // #106 — the console line carries the counter too, so "0 staged" is readable
  // as distance-to-the-door rather than as a dead organ.
  console.log(`scout: ${out.staged.length} staged (${out.readiness_line}) · learn=${out.edges.learn.length} ratify=${out.edges.ratify.length}${out.war_room.active ? " · WAR-ROOM taper" : ""} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { stageTriggers, stageReadiness, readinessLine, edgeSplit, buildScout, warRoomRead, loadConfig };
