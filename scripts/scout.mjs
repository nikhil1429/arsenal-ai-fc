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
//         dressing-room/state/missions.json (sole writer — THE MISSIONS DESK, 8 Aug 2026)
//         dressing-room/missions/T-*.md · L-*.md (generated mission prompts; M01–M04 are
//         hand-authored audit missions this organ only REGISTERS, never rewrites)
//         dressing-room/state/scout_reports/mission_*.md (ingested returns, verbatim)
// MODES:  run (default) · selftest · mission <stage-audit|stage-topic|stage-lock|ingest|
//         audit-close|list> · outward
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

// WAR-ROOM (compressed-season protocol): interview_dates land in season.json via
// ITS OWNER — `node scripts/postmatch.mjs interview --date YYYY-MM-DD` (D14,
// 9 Aug 2026: this comment used to tell the captain to hand-log an owned file,
// against the owners-only law). Inside the taper window the whole body shifts — short sharp
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
// THE MISSIONS DESK — the outward loop's Gemini arm (his rulings, 7–8 Aug 2026)
// ---------------------------------------------------------------------------
// Ruling 1 (Gemini Pro doctrine, his words: "leave the internet things to
//   gemini ai pro"): his Pro subscription is the INTERNET ARM — the machine
//   writes missions, HE fires them on Gemini, the output returns through the
//   ingest door below. No API, no automation of his account, ever.
// Ruling 6 layer 1: FIRST MISSION EVER = the full-syllabus audit (M01–M04,
//   one per bucket-cluster, hand-authored in dressing-room/missions/). The
//   benchmark organ stays GATED until `mission audit-close` records his word —
//   an EVENT on his study, never a date (his 1 Aug rule).
// Ruling 6 layer 2: TOPIC-OPEN scouting — forge `start` stages T-<concept>.
//   GUARD (non-negotiable): missions tune EMPHASIS, never reopen the SYLLABUS.
// Ruling 2: LOCK harvest — forge step 10 stages L-<concept>. Plus the ≥2×/week
//   outward floor (HIS ruled number, not a guess): `outward` counts the week.
// WHO ELSE COULD ACT ON THIS OUTPUT (Ruling 5 standing question, answered):
//   captains_call.mjs (mints mission cards — PULL-DERIVE, zero code here) ·
//   benchmark.mjs (reads the audit gate) · forge_session.mjs (stages T-/L-) ·
//   learnstate kickoff + /matchday (mission lines) · watchman (floor INFO).
// ---------------------------------------------------------------------------
const MISSIONS      = join(STATE_DIR, "missions.json");
const MISSIONS_DIR  = join(__dirname, "..", "dressing-room", "missions");
const REPORTS_DIR   = join(STATE_DIR, "scout_reports");
const BENCH_PATH    = join(STATE_DIR, "benchmark.json");
const OUTWARD_FLOOR = 2; // per week — HIS ruling (7 Aug 2026 night), not an invented threshold

const AUDIT_MISSIONS = [
  { id: "M01", cluster: "fundamentals + the rubric itself", file: "M01__audit_fundamentals_rubric.md" },
  { id: "M02", cluster: "RAG cluster",                      file: "M02__audit_rag_cluster.md" },
  { id: "M03", cluster: "agents + LLM-API cluster",         file: "M03__audit_agents_api_cluster.md" },
  { id: "M04", cluster: "LLMOps + Python/shipping + market", file: "M04__audit_llmops_python_market.md" },
];

const AXES_LINE = "kya/analogy · kyun/first-principles · mechanism · math+range · limits/failure-modes · tradeoffs · FinOps-spot · scale/cost · 3-ways";

const emptyMissions = () => ({
  version: 1,
  missions: [],
  syllabus_audit: { returns_complete_at: null, closed_at: null, note: null },
  events: [],
});

function stageAudit(state, now) {
  const added = [];
  for (const m of AUDIT_MISSIONS) {
    if (state.missions.some(r => r.id === m.id)) continue;
    state.missions.push({
      id: m.id, type: "audit", cluster: m.cluster, concept: null,
      file: `dressing-room/missions/${m.file}`,
      staged_at: now.toISOString(), ingested_at: null, report: null,
    });
    state.events.push({ ts: now.toISOString(), kind: "stage_audit", id: m.id });
    added.push(m.id);
  }
  return { state, added };
}

// Generated mission prompts. Both are REGULAR Gemini Pro research (Deep
// Research is reserved for the four audits + rare deep-dives — rig cost rule).
function topicMissionMd(concept, now) {
  return `# MISSION T-${concept} — topic-open scouting: ${concept}
<!-- outward loop · Ruling 6 layer 2 (staged at forge start, ${now.toISOString().slice(0, 10)}) -->
<!-- GUARD (his ruling, non-negotiable): missions tune EMPHASIS, never reopen the SYLLABUS. -->
<!-- Fire on: Gemini Pro (regular research — NOT Deep Research; that is reserved for audits). -->
<!-- Return door: paste back in a Claude session, or: node scripts/scout.mjs mission ingest T-${concept} --file <path> -->

---- PASTE FROM HERE (into Gemini) ----

Research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India (Aug–Oct 2026, product/applied ladder, ₹20–25 LPA band). TODAY I am opening the concept "${concept}" for deep study. Before I start, scout the live field on THIS topic only:

1. The 8–12 most-reported REAL interview questions on ${concept} right now (July–August 2026 sources preferred; candidate-reported over prep-guides). Verbatim where possible, each with source + date.
2. Which angles interviewers currently push hardest on ${concept} — with evidence. My study axes are: ${AXES_LINE}. Tell me which of these deserve extra weight.
3. One thing that CHANGED about how ${concept} is asked vs early 2026, if anything (evidence, else say "no visible shift").

OUTPUT FORMAT (strict):
## LIVE PROBES — the questions, verbatim, sourced + dated
## EMPHASIS READ — which axes deserve extra weight, one line of evidence each
## SHIFT — what moved since early 2026 (or "none found")
## SOURCES — dated list

Rules: this steers EMPHASIS inside a FIXED syllabus — do NOT propose adding or removing topics; date every claim; no padding — an empty section says "nothing found".
`;
}

function lockMissionMd(concept, now) {
  return `# MISSION L-${concept} — lock-harvest: ${concept} just LOCKED
<!-- outward loop · Ruling 2 cadence (outward check rides every topic completion, ${now.toISOString().slice(0, 10)}) -->
<!-- Fire on: Gemini Pro (regular research — NOT Deep Research). -->
<!-- Return door: paste back in a Claude session, or: node scripts/scout.mjs mission ingest L-${concept} --file <path> -->

---- PASTE FROM HERE (into Gemini) ----

Research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India (Aug–Oct 2026, product/applied ladder, ₹20–25 LPA band). I have just finished deep study of "${concept}" (9 angles: ${AXES_LINE}). Validate my coverage against the live field:

1. The 10 HARDEST real questions currently asked on ${concept} at product-company interviews (dated sources; candidate-reported preferred) — I will answer these cold as a self-test.
2. The 3 most common WRONG answers candidates give on ${concept} — so I can check I do not hold them.
3. Any live probe on ${concept} that my 9 angles above would NOT have prepared me for — name the gap. (EMPHASIS evidence only — my syllabus itself is fixed; do not propose new topics.)

OUTPUT FORMAT (strict):
## HARDEST 10 — verbatim, sourced + dated
## COMMON WRONG ANSWERS — each with why it is wrong
## GAP READ — probes my angles miss (or "none found")
## SOURCES — dated list

Rules: date every claim; candidate-reported sources over prep-guides; no padding.
`;
}

// Stage a generated mission row. Idempotent while a same-id row sits
// un-ingested; after ingestion a re-stage gets a dated suffix (rare path —
// a concept re-opened or re-locked).
function stageGenerated(state, concept, kind, now) {
  const base = (kind === "topic_open" ? "T-" : "L-") + concept;
  const open = state.missions.find(r => r.id === base && !r.ingested_at);
  if (open) return { state, row: open, skipped: true };
  const id = state.missions.some(r => r.id === base) ? `${base}@${localDate(now)}` : base;
  const row = {
    id, type: kind, cluster: null, concept,
    file: `dressing-room/missions/${id}.md`,
    staged_at: now.toISOString(), ingested_at: null, report: null,
  };
  state.missions.push(row);
  state.events.push({ ts: now.toISOString(), kind: kind === "topic_open" ? "stage_topic" : "stage_lock", id });
  return { state, row, skipped: false };
}

function ingestMission(state, id, reportRelPath, now) {
  const row = state.missions.find(r => r.id.toLowerCase() === String(id || "").toLowerCase());
  if (!row) return { ok: false, error: `no mission "${id}" — see: node scripts/scout.mjs mission list` };
  row.ingested_at = now.toISOString();
  row.report = reportRelPath;
  state.events.push({ ts: now.toISOString(), kind: "ingest", id: row.id });
  const auditIds = AUDIT_MISSIONS.map(m => m.id);
  const allIn = auditIds.every(a => state.missions.some(r => r.id === a && r.ingested_at));
  let auditComplete = false;
  if (allIn && !state.syllabus_audit.returns_complete_at) {
    state.syllabus_audit.returns_complete_at = now.toISOString();
    auditComplete = true;
  }
  return { ok: true, state, row, auditComplete };
}

// LADDER C2 (9 Aug 2026) — THE FIRE STAMP. /fire drives his Chrome and HE clicks
// Start, but nothing ever recorded THAT the click happened — so a mission could
// sit fired-and-forgotten with no return-leg watcher possible. `mission fired
// <ID>` is the stamp /fire presses right after his click; the card organ reads
// fired_at + !ingested_at (>24h, the ladder's own number) into ONE 'le lo?' card.
// Re-firing re-stamps (a mission genuinely re-fired restarts its clock).
function fireMission(state, id, now) {
  const row = state.missions.find(r => r.id.toLowerCase() === String(id || "").toLowerCase());
  if (!row) return { ok: false, error: `no mission "${id}" — see: node scripts/scout.mjs mission list` };
  if (row.ingested_at) return { ok: false, error: `${row.id} already returned (${row.report}) — firing an ingested mission is a no-op` };
  row.fired_at = now.toISOString();
  state.events.push({ ts: now.toISOString(), kind: "fired", id: row.id });
  return { ok: true, state, row };
}

// THE BENCHMARK GATE EVENT. Canon edits = his word — the --note carries it.
// Refuses until all four audit returns are in (event-gate on HIS study).
function auditClose(state, note, now) {
  const missing = AUDIT_MISSIONS.map(m => m.id).filter(a => !state.missions.some(r => r.id === a && r.ingested_at));
  if (missing.length) return { ok: false, missing };
  if (!note || !String(note).trim()) return { ok: false, error: "canon = his word — pass it with --note \"<what he ruled on the diffs>\"" };
  state.syllabus_audit.closed_at = now.toISOString();
  state.syllabus_audit.note = String(note).trim();
  state.events.push({ ts: now.toISOString(), kind: "audit_close" });
  return { ok: true, state };
}

// ≥2×/week outward floor (Ruling 2). Counts REAL outward work in the trailing
// 7 local days: mission RETURNS (ingest/audit_close — his fire came back) +
// benchmark runs. Staging is machine prep and deliberately does NOT count —
// else the floor reads "met" on a week where nothing outward actually happened.
// Distance-surfacing only — never a block, never a debt.
function outwardWeek(state, bench, now) {
  const cutoff = now.getTime() - 7 * 86400000;
  const inWin = (iso) => { const t = new Date(iso).getTime(); return !Number.isNaN(t) && t >= cutoff && t <= now.getTime(); };
  const missionEvents = ((state && state.events) || []).filter(e => (e.kind === "ingest" || e.kind === "audit_close") && inWin(e.ts)).length;
  const benchRuns = ((bench && bench.runs) || []).filter(inWin).length;
  const count = missionEvents + benchRuns;
  return { count, floor: OUTWARD_FLOOR, missionEvents, benchRuns,
    line: `outward checks this week: ${count}/${OUTWARD_FLOOR} (missions ${missionEvents} · benchmark ${benchRuns}) — floor is his 7 Aug ruling` };
}

// P6.1 → Ruling 5: gemini_quality.jsonl gets its first reader. COUNT only —
// "recorded, judged by no one until the 30-45d review" (his rule). No dates
// ride scout.json (NO-DATES law), so the lane carries a count and a note.
function attachGemini(out, batches) {
  if (!Number.isInteger(batches) || batches <= 0) return out;
  out.gemini = { batches, note: "recorded, unjudged till the 30-45d review" };
  out.readiness_line = out.readiness_line ? `${out.readiness_line} · gemini ${batches} batch(es) recorded` : `gemini ${batches} batch(es) recorded`;
  return out;
}

// One–two lines for the kickoff brief / matchday. Doors, never debts.
function missionLines(state, now) {
  const lines = [];
  const rows = (state && state.missions) || [];
  if (!rows.length) return lines;
  const audit = (state && state.syllabus_audit) || {};
  const auditRows = rows.filter(r => r.type === "audit");
  if (auditRows.length && !audit.closed_at) {
    const done = auditRows.filter(r => r.ingested_at).map(r => r.id);
    const todo = auditRows.filter(r => !r.ingested_at).map(r => r.id);
    lines.push(todo.length
      ? `OUTWARD · full-syllabus audit ${done.length}/4 returned — next fire: ${todo[0]} (Gemini Deep Research, file in dressing-room/missions/)`
      : `OUTWARD · all 4 audit returns in — diff review + audit-close ride this session (benchmark unlocks on his word)`);
  }
  const gen = rows.filter(r => r.type !== "audit" && !r.ingested_at);
  if (gen.length) {
    const r = gen[0];
    const age = Math.floor((now.getTime() - new Date(r.staged_at).getTime()) / 86400000);
    lines.push(`OUTWARD · ${r.id} staged${age > 0 ? ` ${age}d ago` : ""} — fire on Gemini when you sit (EMPHASIS only, syllabus canon)`);
  }
  return lines.slice(0, 2);
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

  // -------------------------------------------------------------------------
  // THE MISSIONS DESK (8 Aug 2026) — pure-core checks, no disk
  // -------------------------------------------------------------------------
  {
    const t0 = new Date(2026, 7, 8, 10, 0, 0);
    let st = emptyMissions();
    const s1 = stageAudit(st, t0);
    assert("missions: stage-audit stages all four, once", s1.added.length === 4 && st.missions.length === 4);
    const s2 = stageAudit(st, new Date(2026, 7, 9));
    assert("missions: stage-audit idempotent (re-run adds zero)", s2.added.length === 0 && st.missions.length === 4);
    assert("missions: staged rows are un-ingested and point at the hand-authored files",
      st.missions.every(r => !r.ingested_at && /^dressing-room\/missions\/M0[1-4]__/.test(r.file)));

    const bad = ingestMission(st, "M99", "x.md", t0);
    assert("missions: ingest refuses an unknown id", bad.ok === false && /no mission/.test(bad.error));
    // LADDER C2 — the fire stamp
    const f1 = fireMission(st, "m01", t0);
    assert("C2: fired stamps fired_at (case-insensitive) + a 'fired' event; unknown id refuses",
      f1.ok === true && !!st.missions.find(r => r.id === "M01").fired_at
      && st.events.some(e => e.kind === "fired" && e.id === "M01")
      && fireMission(st, "M99", t0).ok === false);
    ingestMission(st, "M01", "scout_reports/mission_M01.md", t0);
    assert("C2: firing an already-returned mission is refused out loud",
      fireMission(st, "M01", t0).ok === false && /already returned/.test(fireMission(st, "M01", t0).error));
    ingestMission(st, "m02", "scout_reports/mission_M02.md", t0);
    assert("missions: ingest is case-insensitive and stamps the report path",
      st.missions.find(r => r.id === "M02").report === "scout_reports/mission_M02.md");
    assert("missions: audit NOT complete at 2/4", !st.syllabus_audit.returns_complete_at);
    const early = auditClose(st, "his word", t0);
    assert("missions: audit-close REFUSES before all four are in (names the missing)",
      early.ok === false && early.missing.join(",") === "M03,M04");
    ingestMission(st, "M03", "r3.md", t0);
    const last = ingestMission(st, "M04", "r4.md", t0);
    assert("missions: fourth return completes the audit returns", last.auditComplete === true && !!st.syllabus_audit.returns_complete_at);
    const noWord = auditClose(st, "  ", t0);
    assert("missions: audit-close refuses an empty note — canon = his word", noWord.ok === false && /his word/.test(noWord.error));
    const closed = auditClose(st, "dossier holds, 2 SHIFTED cards dealt", t0);
    assert("missions: audit-close with his word opens THE BENCHMARK GATE", closed.ok === true && !!st.syllabus_audit.closed_at);

    const g1 = stageGenerated(st, "hallucinations", "topic_open", t0);
    const g2 = stageGenerated(st, "hallucinations", "topic_open", new Date(2026, 7, 9));
    assert("missions: topic mission idempotent while open", g1.skipped === false && g2.skipped === true && g2.row.id === "T-hallucinations");
    ingestMission(st, "T-hallucinations", "rt.md", t0);
    const g3 = stageGenerated(st, "hallucinations", "topic_open", new Date(2026, 7, 20));
    assert("missions: re-stage after ingest gets a dated suffix", g3.skipped === false && /^T-hallucinations@\d{4}-/.test(g3.row.id));
    const gl = stageGenerated(st, "hallucinations", "lock_harvest", t0);
    assert("missions: lock mission stages as L-<concept>", gl.row.id === "L-hallucinations");

    const tMd = topicMissionMd("embeddings", t0), lMd = lockMissionMd("embeddings", t0);
    assert("missions: topic prompt carries the EMPHASIS-not-SYLLABUS guard",
      /tune EMPHASIS, never reopen the SYLLABUS/.test(tMd) && /do NOT propose adding or removing topics/.test(tMd));
    assert("missions: both prompts carry the paste marker + the ingest door",
      [tMd, lMd].every(m => /PASTE FROM HERE/.test(m) && /mission ingest/.test(m)));
    assert("missions: prompts are doors, not debts (no owe/should/deadline language)",
      [tMd, lMd].every(m => !/you (should|must|owe)|deadline/i.test(m)));

    const week = outwardWeek(st, { runs: [new Date(2026, 7, 7).toISOString(), new Date(2026, 6, 1).toISOString()] }, new Date(2026, 7, 9));
    assert("missions: outward floor counts only the trailing 7 days (bench 1 of 2 in-window)", week.benchRuns === 1 && week.floor === 2);
    assert("missions: staging is machine prep — only RETURNS count toward the floor",
      outwardWeek({ events: [{ ts: t0.toISOString(), kind: "stage_audit" }, { ts: t0.toISOString(), kind: "stage_topic" }] }, null, t0).count === 0
      && outwardWeek({ events: [{ ts: t0.toISOString(), kind: "ingest" }] }, null, t0).count === 1);
    assert("missions: outward line is have/need, never shame", /\d+\/2/.test(week.line) && !/behind|failed|late/i.test(week.line));
    assert("missions: outward safe on a bloodless world", outwardWeek(null, null, t0).count === 0);

    const g0 = buildScout([], { learn: [], ratify: [] }, t0, undefined, stageReadiness(null, loadConfig("__no_such__")));
    assert("gemini lane: batches attach as a COUNT + unjudged note, and ride the readiness line",
      attachGemini({ ...g0 }, 3).gemini.batches === 3
      && /unjudged till the 30-45d/.test(attachGemini({ ...g0 }, 3).gemini.note)
      && /gemini 3 batch\(es\) recorded/.test(attachGemini({ ...g0 }, 3).readiness_line));
    assert("gemini lane: zero batches attach NOTHING (absence, not a zero-claim)",
      attachGemini({ ...g0 }, 0).gemini === undefined && attachGemini({ ...g0 }, null).gemini === undefined);
    assert("gemini lane: NO-DATES law still holds with the lane attached",
      !/\d{4}-\d{2}-\d{2}/.test(JSON.stringify({ ...attachGemini({ ...g0 }, 5), date: "", generated_at: "" })));

    const linesFire = missionLines({ missions: st.missions.filter(r => r.type === "audit").map(r => ({ ...r, ingested_at: null })), syllabus_audit: { closed_at: null } }, t0);
    assert("missions: kickoff line says which mission to fire NEXT", /next fire: M01/.test(linesFire[0]));
    const linesIn = missionLines({ missions: st.missions.filter(r => r.type === "audit"), syllabus_audit: { closed_at: null } }, t0);
    assert("missions: all-returned line routes to diff review + his word", /diff review \+ audit-close/.test(linesIn[0]));
    assert("missions: no mission rows → no lines (absence, not noise)", missionLines(emptyMissions(), t0).length === 0);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// missions CLI (impure — the only writer of missions.json + generated T-/L- files)
// ---------------------------------------------------------------------------
function missionCli(mode) {
  const now = new Date();
  const state = readJson(MISSIONS) || emptyMissions();
  const sub = mode === "outward" ? "outward" : (process.argv[3] || "list").toLowerCase();
  const argAfter = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };

  if (sub === "stage-audit") {
    const missingFiles = AUDIT_MISSIONS.filter(m => !existsSync(join(MISSIONS_DIR, m.file))).map(m => m.file);
    const { added } = stageAudit(state, now);
    writeAtomic(MISSIONS, state);
    console.log(added.length
      ? `MISSIONS DESK · staged ${added.join(", ")} — the FIRST MISSION EVER (full-syllabus audit, Ruling 6).`
      : `MISSIONS DESK · audit already staged (${state.missions.filter(r => r.type === "audit").length}/4 rows).`);
    if (missingFiles.length) console.log(`  ⚠ prompt file(s) missing on disk: ${missingFiles.join(", ")}`);
    console.log(`  fire: open dressing-room/missions/M01…M04, paste each into Gemini Pro → Deep Research.`);
    console.log(`  return: node scripts/scout.mjs mission ingest M01 --file <saved-output.md>  (or paste in a Claude session)`);
    console.log(`  gate: benchmark ships only after: node scripts/scout.mjs mission audit-close --note "<his word>"`);
    return;
  }

  if (sub === "stage-topic" || sub === "stage-lock") {
    const concept = (process.argv[4] || "").toLowerCase().trim();
    if (!concept) { console.error(`usage: scout.mjs mission ${sub} <concept>`); process.exit(1); }
    const kind = sub === "stage-topic" ? "topic_open" : "lock_harvest";
    const { row, skipped } = stageGenerated(state, concept, kind, now);
    if (!skipped) {
      mkdirSync(MISSIONS_DIR, { recursive: true });
      writeFileSync(join(__dirname, "..", row.file), kind === "topic_open" ? topicMissionMd(concept, now) : lockMissionMd(concept, now), "utf8");
      writeAtomic(MISSIONS, state);
    }
    console.log(skipped
      ? `MISSIONS DESK · ${row.id} already staged (${row.file}) — fire it, don't re-stage.`
      : `MISSIONS DESK · staged ${row.id} → ${row.file} — paste into Gemini Pro when he sits. EMPHASIS only; syllabus stays canon.`);
    return;
  }

  if (sub === "ingest") {
    const id = process.argv[4];
    if (!id) { console.error("usage: scout.mjs mission ingest <ID> [--file <path>]"); process.exit(1); }
    const file = argAfter("--file");
    let text = "";
    try { text = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8"); } catch { text = ""; }
    if (!text || text.trim().length < 40) {
      console.error("ingest refused: return is empty/too thin (<40 chars). Pass --file <path> or pipe the Gemini output on stdin.");
      process.exit(1);
    }
    const reportName = `mission_${id.toUpperCase()}_${localDate(now)}.md`;
    const res = ingestMission(state, id, `scout_reports/${reportName}`, now);
    if (!res.ok) { console.error(`ingest refused: ${res.error}`); process.exit(1); }
    mkdirSync(REPORTS_DIR, { recursive: true });
    writeFileSync(join(REPORTS_DIR, reportName), text, "utf8");
    writeAtomic(MISSIONS, state);
    console.log(`MISSIONS DESK · ${res.row.id} ingested → dressing-room/state/scout_reports/${reportName} (verbatim).`);
    console.log(`  next: diff review rides the next session anchor — canon (OPPONENT_SCOUT/ROADMAP) changes only with his word.`);
    if (res.auditComplete) console.log(`  🔓 all 4 audit returns in — after the diffs are dealt: mission audit-close --note "<his word>" (opens the benchmark gate).`);
    return;
  }

  if (sub === "fired") {
    const id = process.argv[4];
    if (!id) { console.error("usage: scout.mjs mission fired <ID>"); process.exit(1); }
    const res = fireMission(state, id, now);
    if (!res.ok) { console.error(`fired refused: ${res.error}`); process.exit(1); }
    writeAtomic(MISSIONS, state);
    console.log(`MISSIONS DESK · ${res.row.id} FIRED (${res.row.fired_at}) — the return-leg watcher wakes if 24h pass without a return.`);
    return;
  }

  if (sub === "audit-close") {
    const res = auditClose(state, argAfter("--note"), now);
    if (!res.ok) {
      console.error(res.missing ? `audit-close refused — still awaiting: ${res.missing.join(", ")}` : `audit-close refused — ${res.error}`);
      process.exit(1);
    }
    writeAtomic(MISSIONS, state);
    console.log(`MISSIONS DESK · FULL-SYLLABUS AUDIT CLOSED on his word: "${state.syllabus_audit.note}"`);
    console.log(`  🔓 THE BENCHMARK GATE IS OPEN — run: node scripts/benchmark.mjs run`);
    return;
  }

  if (sub === "outward") {
    const week = outwardWeek(state, readJson(BENCH_PATH), now);
    console.log(week.line);
    for (const l of missionLines(state, now)) console.log(l);
    return;
  }

  // list (default)
  const rows = state.missions;
  if (!rows.length) { console.log("MISSIONS DESK · empty — first move: node scripts/scout.mjs mission stage-audit"); return; }
  console.log(`== MISSIONS DESK ==   audit gate: ${state.syllabus_audit.closed_at ? "OPEN (closed on his word)" : state.syllabus_audit.returns_complete_at ? "returns in — awaiting audit-close (his word)" : "gated — audit in flight"}`);
  for (const r of rows) {
    const age = Math.max(0, Math.floor((now.getTime() - new Date(r.staged_at).getTime()) / 86400000));
    console.log(`  ${r.id.padEnd(22)} ${r.type.padEnd(12)} ${r.ingested_at ? "✓ ingested" : `staged ${age}d`}  ${r.report || r.file}`);
  }
  for (const l of missionLines(state, now)) console.log(l);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "mission" || mode === "missions" || mode === "outward") return missionCli(mode);
  const cfg = loadConfig();
  const now = new Date();
  const ls = readJson(join(STATE_DIR, "learning_state.json"));
  const registry = readJson(join(STATE_DIR, "concepts.json"));
  const dossier = readJson(join(STATE_DIR, "dossier_weights.json"));
  const season = readJson(join(STATE_DIR, "season.json"));
  const staged = stageTriggers(ls, cfg, dossier, season);
  const out = buildScout(staged, edgeSplit(ls, registry, dossier, cfg), now, warRoomRead(season, cfg, now), stageReadiness(ls, cfg));
  try {
    const gq = join(STATE_DIR, "gemini_quality.jsonl");
    attachGemini(out, existsSync(gq) ? readFileSync(gq, "utf8").split("\n").filter((l) => l.trim()).length : 0);
  } catch { /* an unreadable lane makes no claim */ }
  writeAtomic(OUT, out);
  // #106 — the console line carries the counter too, so "0 staged" is readable
  // as distance-to-the-door rather than as a dead organ.
  console.log(`scout: ${out.staged.length} staged (${out.readiness_line}) · learn=${out.edges.learn.length} ratify=${out.edges.ratify.length}${out.war_room.active ? " · WAR-ROOM taper" : ""} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { stageTriggers, stageReadiness, readinessLine, edgeSplit, buildScout, warRoomRead, loadConfig,
  // THE MISSIONS DESK (8 Aug 2026)
  emptyMissions, stageAudit, stageGenerated, ingestMission, fireMission, auditClose, outwardWeek, missionLines,
  topicMissionMd, lockMissionMd, AUDIT_MISSIONS, attachGemini };
