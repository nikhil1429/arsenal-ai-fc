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
  const tmp = path + ".tmp";
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
      trigger: `${ready.length} core concepts at DEFEND grade (threshold ${cfg.scrimmage.min_defend_grade_concepts})`,
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
      trigger: `python core [${cfg.finops.skills.join(", ")}] all ≥ ${cfg.finops.min_state}`,
      brief: `The next FinOps milestone${item} is buildable on what you now hold. Spec sits ready when you want the ball.`,
    });
  }
  return staged;
}

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

function buildScout(staged, edges, now) {
  const any = staged.length || edges.learn.length || edges.ratify.length;
  return {
    date: localDate(now),
    status: any ? "ok" : "awaiting_data",
    low_confidence: false,
    generated_at: now.toISOString(),
    staged,
    edges,
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
  const registry = { concepts: { tokenization: { bucket: "1-fundamentals" }, chunking: { bucket: "2-rag" }, embeddings: { bucket: "2-rag" } }, skills: { pydantic: {}, fastapi: {}, async: {} } };

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
    edge_map: { chunking: "can size chunks, shaky on overlap tradeoffs", tokenization: "byte-level BPE internals beyond me, don't need them" },
  };

  const staged = stageTriggers(ls, cfg, dossier, { pipeline_item: "M1 parser" });
  assert("scrimmage stages at ≥3 DEFEND-grade core", staged.some(s => s.kind === "scrimmage"));
  assert("finops milestone stages when python core held", staged.some(s => s.kind === "finops_milestone"));
  assert("brief is a door, not a debt", staged.every(s => !/you (should|must|owe)|by (mon|tue|wed|thu|fri|sat|sun)/i.test(s.brief)));

  const below = stageTriggers({ concepts: ls.concepts.slice(2) }, cfg, dossier, null);
  assert("below threshold → no scrimmage staged", !below.some(s => s.kind === "scrimmage"));

  const edges = edgeSplit(ls, registry, dossier, cfg);
  assert("edge on high-weight ground → LEARN", edges.learn.some(e => e.concept === "chunking"));
  assert("edge on low-weight ground → RATIFY with negative-space line", edges.ratify.some(e => e.concept === "tokenization" && e.negative_space_line.includes("yeh main nahi karta")));
  assert("edge text carried VERBATIM", edges.learn[0].edge_verbatim === "can size chunks, shaky on overlap tradeoffs");

  const scout = buildScout(staged, edges, now);
  assert("split marked as a proposal (captain decides)", /proposal/.test(scout.note));

  // NO-DATES LAW — structural: no forbidden field names, no date strings
  // outside the envelope.
  const json = JSON.stringify(scout);
  assert("NO-DATES LAW — no eta/deadline/projected/days_to fields", !/"(eta|deadline|projected|days_to|due_by|target_date)"/i.test(json));
  const stripped = JSON.stringify({ ...scout, date: "", generated_at: "" });
  assert("NO-DATES LAW — no date strings outside envelope", !/\d{4}-\d{2}-\d{2}/.test(stripped));

  assert("bloodless world → awaiting_data, no crash", buildScout(stageTriggers(null, cfg, dossier, null), edgeSplit(null, null, dossier, cfg), now).status === "awaiting_data");

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
  const out = buildScout(stageTriggers(ls, cfg, dossier, season), edgeSplit(ls, registry, dossier, cfg), now);
  writeAtomic(OUT, out);
  console.log(`scout: ${out.staged.length} staged · learn=${out.edges.learn.length} ratify=${out.edges.ratify.length} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { stageTriggers, edgeSplit, buildScout, loadConfig };
