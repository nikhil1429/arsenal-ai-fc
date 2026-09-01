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
// MODES:  run (default) · selftest · mission <stage-audit|stage-topic|stage-lock|ingest|fired|
//         claude|compare|audit-close|retire|unretire|list> (alias: missions) · outward · chrome-stamp <fire|
//         harvest|gem-sync|gist-patch>
//   `mission retire <ID> --why "<reason>"` — W0-A (1 Sep 2026, OL-05): the desk's only lawful
//   exit. Stamps the row, journals the event, MOVES the prompt to missions/retired/. Nothing
//   is deleted and the retired row stays readable in `mission list`. `mission unretire <ID>
//   --why "<reason>"` is the full way back — the row re-opens and the prompt returns to the desk.
//   `mission claude <ID>` + `mission compare <ID>` — Block 5.3 (18 Aug 2026, §17-B): the Claude
//   WebSearch leg of a mission and the one-pass merge of the two returns; see the block above auditClose.
//   `chrome-stamp` (:800) and the `missions` alias (:792) were DISPATCHED and unnamed
//   here until the wiring audit, 10 Aug 2026. THE_DAILY_LOOP.md:82 (now verbatim at
//   docs/archive/THE_DAILY_LOOP_2026-08-18.md:82 — Block 1, 18 Aug 2026) sends a session to
//   this exact line for scout's surface, so the verb four Chrome skills must press
//   after every successful drive (/fire · /harvest · /gem-sync · /gist-patch) was
//   invisible on the only discovery path the docs name. Header and dispatch are held
//   together now — organism_test.mjs, THE DISCOVERY-PATH CONTRACT.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";   // appendFileSync: Block 5.3, the shared brain-ledger append (mission_<id> rows)
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// THE BENCHMARK WIRE (10 Aug 2026) — see refreshBenchmark() below. Same
// cross-organ shell pattern forge_session.mjs's LOCK-CHAIN already uses
// (chainCommands → execFileSync, fail-silent): the owner is invoked, never
// bypassed. This file still writes only missions.json + its own outputs.
import { execFileSync } from "node:child_process";
import { dayKey, addDays } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW

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
    date: dayKey(now),   // Block 6 — day-key
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
const CONCEPTS_JSON = join(STATE_DIR, "concepts.json");   // the syllabus roster the mission gate reads (read-only — another organ owns it)
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
<!-- outward loop · Ruling 6 layer 2 (staged at forge start, ${dayKey(now)}) -->
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
<!-- outward loop · Ruling 2 cadence (outward check rides every topic completion, ${dayKey(now)}) -->
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

// ---------------------------------------------------------------------------
// W0-A · THE SLUG LAW AND THE SYLLABUS GATE (1 Sep 2026 — SB-10, H-12, OL-03, OL-04)
// ---------------------------------------------------------------------------
// Line 286 of this file has always carried the GUARD as a COMMENT: "missions tune
// EMPHASIS, never reopen the SYLLABUS." A comment is not a law (L4). On 19 Aug his
// entire kickoff sentence — 190 characters of plan — arrived here as `concept`, and
// because nothing checked it, it became THREE things at once: a mission id, an open
// row in his fire queue that then occupied the ONE generated-mission slot the kickoff
// brief shows him, and a 195-character FILENAME inside a tracked directory. It is
// still all three today. Three belts, in the order a bad input meets them:
//   1. THE SYLLABUS GATE — a concept that concepts.json does not know is REFUSED.
//      Aliases resolve to their canonical id (capture.mjs's own normalisation law) so
//      `bpe` can never mint T-bpe beside T-tokenization — that is OL-04's duplicate
//      class arriving through the front door.
//   2. SHAPE — ≤64 chars, no sentence punctuation. A second belt for the day something
//      lands on the roster with a shape that should never be a path.
//   3. THE SLUG LAW — the FILENAME is slugged, always, even for a clean id. HIS WORDS
//      ARE NOT CAPPED: the mission BODY carries his sentence verbatim. Only the PATH is.
// Existing rows keep the `file` already stored on them — L9, nothing on disk is renamed.
const MISSION_SLUG_MAX = 48;
function slugForFile(id) {
  const s = String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (s || "mission").slice(0, MISSION_SLUG_MAX).replace(/-+$/, "");
}
/**
 * The filename a mission id gets. Collisions take a numeric suffix, never an overwrite.
 * THE DESK'S OWN RECORD ANSWERS THE COLLISION QUESTION, not the disk: missions.json holds
 * the `file` of every prompt this organ ever created, so no fs call is needed — and an fs
 * call on a computed path is a permanent blind spot in xray's per-organ budget. Names are
 * compared case-insensitively because Windows would collide on case alone.
 */
function missionFileName(id, deps = {}) {
  const used = new Set((deps.names || []).map((n) => String(n).replace(/^.*[\\/]/, "").toLowerCase()));
  const taken = deps.taken || ((n) => used.has(String(n).toLowerCase()));
  const base = slugForFile(id);
  if (!taken(`${base}.md`)) return `${base}.md`;
  for (let i = 2; i < 100; i++) { const n = `${base.slice(0, MISSION_SLUG_MAX - 3)}-${i}.md`; if (!taken(n)) return n; }
  return `${base.slice(0, MISSION_SLUG_MAX - 3)}-x.md`;
}
/**
 * The syllabus gate. Returns the CANONICAL concept id, or a refusal that says why and
 * where the valid ids live. concepts.json is read-only here — its owner is elsewhere.
 */
function validateConcept(raw, registry) {
  const c = String(raw || "").toLowerCase().trim();
  if (!c) return { ok: false, why: "empty concept" };
  if (c.length > 64) return { ok: false, why: `${c.length} characters — a concept id, not a sentence (max 64)` };
  if (/[.!?,;:\n]/.test(c)) return { ok: false, why: "sentence punctuation in a concept id — his words belong in the mission BODY, never in its id" };
  const reg = registry || {};
  const concepts = reg.concepts || {};
  const skills = reg.skills || {};
  if (concepts[c] || skills[c]) return { ok: true, concept: c };
  for (const [id, row] of [...Object.entries(concepts), ...Object.entries(skills)]) {
    for (const a of (row && row.aliases) || []) if (String(a).toLowerCase().trim() === c) return { ok: true, concept: id, via_alias: c };
  }
  return { ok: false, why: `"${c}" is not on the syllabus roster`, roster: `${Object.keys(concepts).length} concept(s) + ${Object.keys(skills).length} skill(s) in dressing-room/state/concepts.json` };
}

// Stage a generated mission row.
// IDEMPOTENT BY (concept, kind, still-open) — NOT by exact base id (OL-04, 1 Sep 2026).
// The old check asked for a row whose id equals the BASE id, while the minter two lines
// below produces TWO id shapes: the base, and `base@<day>` once a base row exists. So a
// re-stage after an ingest could never see the open dated row it had itself minted, and
// minted another with the identical id: missions.json today carries
// T-hallucinations@2026-08-19 TWICE, and the second can never be ingested (ingestMission
// resolves by id and finds the first). Asking the question the desk actually means — is
// there an OPEN, un-retired mission for this concept and kind — answers for both shapes.
function stageGenerated(state, concept, kind, now, deps = {}) {
  const reg = deps.registry !== undefined ? deps.registry : readJson(CONCEPTS_JSON);
  const v = validateConcept(concept, reg);
  if (!v.ok) return { state, row: null, skipped: false, refused: v.why, roster: v.roster || null };
  concept = v.concept;
  const base = (kind === "topic_open" ? "T-" : "L-") + concept;
  const open = state.missions.find(r => r.concept === concept && r.type === kind && !r.ingested_at && !r.retired_at);
  if (open) return { state, row: open, skipped: true };
  const id = state.missions.some(r => r.id === base) ? `${base}@${dayKey(now)}` : base;   // Block 6 — day-key
  const row = {
    id, type: kind, cluster: null, concept,
    file: `dressing-room/missions/${missionFileName(id, { ...deps, names: deps.names || state.missions.map((r) => r.file) })}`,
    staged_at: now.toISOString(), ingested_at: null, report: null,
  };
  state.missions.push(row);
  state.events.push({ ts: now.toISOString(), kind: kind === "topic_open" ? "stage_topic" : "stage_lock", id });
  return { state, row, skipped: false };
}

// ---------------------------------------------------------------------------
// THE RETIRE DOOR — W0-A (1 Sep 2026, OL-05)
// ---------------------------------------------------------------------------
// The missions desk was append-only with no lawful way out: `grep retire scout.mjs`
// returned nothing. A mission staged by mistake could only be ingested (a lie — no
// return ever came) or hand-edited out of missions.json (forbidden — this file is its
// sole writer). So junk stayed forever, and because missionLines shows exactly ONE
// generated mission — the OLDEST open one — the junk permanently occupied the single
// slot he sees at kickoff. Retiring is L9-clean: the row STAYS with a retired_at stamp
// and his reason, the event is journalled, and the .md is MOVED to missions/retired/.
// Nothing is deleted, and every reader can still see what was retired and why.
//
// ALL rows carrying the id are stamped, on purpose: OL-04 left two rows sharing
// T-hallucinations@2026-08-19, and retiring "the first one" would leave a ghost.
function retireMission(state, id, why, now) {
  const want = String(id || "").toLowerCase().trim();
  if (!want) return { ok: false, error: "usage: scout.mjs mission retire <ID> --why \"<reason>\"" };
  if (!String(why || "").trim()) return { ok: false, error: "retire refused: --why \"<reason>\" is required — a retirement with no reason is a deletion with extra steps" };
  const rows = state.missions.filter(r => String(r.id).toLowerCase() === want && !r.retired_at);
  if (!rows.length) {
    const known = state.missions.some(r => String(r.id).toLowerCase() === want);
    return { ok: false, error: known ? `mission "${id}" is already retired` : `no mission "${id}" — see: node scripts/scout.mjs mission list` };
  }
  for (const r of rows) { r.retired_at = now.toISOString(); r.retired_why = String(why).trim(); }
  state.events.push({ ts: now.toISOString(), kind: "retire", id: rows[0].id, rows: rows.length, why: String(why).trim() });
  return { ok: true, rows, id: rows[0].id };
}
// AND THE WAY BACK. A door with no reverse is a delete wearing a stamp, and this one was
// built without it: the very session that added `retire` retired T-tokenization — his LIVE
// topic mission — by running the verb as a probe, and had no lawful way to undo it without
// hand-editing missions.json, which this file's own sole-writer law forbids. Every verdict
// in this organism has a way back; this one does now too. It is a full undo, not a second
// stamp: the row returns to open, the prompt returns to the desk, and both moves are journalled.
function unretireMission(state, id, why, now) {
  const want = String(id || "").toLowerCase().trim();
  if (!want) return { ok: false, error: "usage: scout.mjs mission unretire <ID> --why \"<reason>\"" };
  if (!String(why || "").trim()) return { ok: false, error: "unretire refused: --why \"<reason>\" is required — a reversal is a decision too" };
  const rows = state.missions.filter(r => String(r.id).toLowerCase() === want && r.retired_at);
  if (!rows.length) return { ok: false, error: state.missions.some(r => String(r.id).toLowerCase() === want) ? `mission "${id}" is not retired` : `no mission "${id}" — see: node scripts/scout.mjs mission list` };
  const back = [];
  for (const r of rows) { back.push(r.retired_file || null); delete r.retired_at; delete r.retired_why; delete r.retired_file; }
  state.events.push({ ts: now.toISOString(), kind: "unretire", id: rows[0].id, rows: rows.length, why: String(why).trim() });
  return { ok: true, rows, id: rows[0].id, parked: back };
}
/** Bring a parked prompt back to the live desk, under the name the row still points at. */
function unparkRetiredFile(parkedRel, relFile, deps = {}) {
  const exists = deps.exists || existsSync; const move = deps.move || renameSync;
  if (!parkedRel || !relFile) return { moved: false, why: "nothing parked for this row" };
  const from = join(__dirname, "..", parkedRel), to = join(__dirname, "..", relFile);
  if (!exists(from)) return { moved: false, why: "no parked file on disk" };
  if (exists(to)) return { moved: false, why: "the live desk already holds that name" };
  move(from, to);
  return { moved: true, to };
}
/** Move a retired mission's prompt out of the live desk. A MOVE — freeze/fold/move, never delete. */
function parkRetiredFile(relFile, deps = {}) {
  // NOTE THE NAME. This alias was called `mkdir`, and `mkdir` is one of the fs verbs xray
  // matches BY NAME when it builds the call graph — so a local helper wearing that name was
  // read as a real directory sink on a path the analyser cannot follow, and cost this organ
  // a permanent blind spot for nothing. A local alias must never borrow an fs verb's name.
  const exists = deps.exists || existsSync; const makeDir = deps.mkdir || mkdirSync; const move = deps.move || renameSync;
  if (!relFile) return { moved: false, why: "the row names no prompt file" };
  // THE PARKED COPY IS SLUGGED. The row being retired is often the very row whose
  // filename is the defect — the live desk carries a 195-character path built out of his
  // kickoff sentence. Moving it under its own name would carry that path forward forever.
  // The FILE IS UNTOUCHED: every byte of his words is inside it. Only the path is capped.
  //
  // THE TARGET IS RESOLVED BEFORE THE SOURCE IS CHECKED, and that ordering is the whole
  // point: a re-run must be able to say WHERE the prompt already sits. Checking the source
  // first answered "no prompt file on disk" for a mission that was parked perfectly well a
  // minute earlier, so the caller had no path to record and `mission list` pointed at a file
  // that no longer existed. An idempotent move reports the destination either way.
  const dir = join(MISSIONS_DIR, "retired");
  const to = join(dir, deps.name || `${slugForFile(relFile.replace(/^.*[\\/]/, "").replace(/\.md$/i, ""))}.md`);
  if (exists(to)) return { moved: false, why: "already parked", to };
  const from = join(__dirname, "..", relFile);
  if (!exists(from)) return { moved: false, why: "no prompt file on disk" };
  makeDir(dir, { recursive: true });
  move(from, to);
  return { moved: true, to };
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

// ── §17-B MISSIONS AUTOMATIC (OVERHAUL Block 5.3, 18 Aug 2026) ────────────────
// His 13 Aug 21:11 ruling, on record: "do the same research on what gemini does every time
// from your end … after getting two researches make a final research document, full
// permission do M01–M04 by yourself and by gemini as well" — corrected on 18 Aug 08:45 to
// supersede the 8 Aug "HE fires" law. So a mission now has TWO research legs and one merge:
//   · GEMINI leg — /fire drives his Chrome, pastes the mission from the PASTE marker and
//     CLICKS START ITSELF (his own account, reversible, not a publish); the return is
//     `mission ingest <ID>` (verbatim, unchanged).
//   · CLAUDE leg — `mission claude <ID>`: the SAME prompt (from the marker) through the §9.1
//     lane (claudegen claudeGen + `--allowedTools WebSearch`, opus by default), written
//     verbatim to scout_reports/mission_<ID>_<day>_claude.md, metered on the shared brain
//     ledger as job `mission_<id>` (gaffer_verify's row shape), stamped on the row
//     (`claude_report` · `claude_at`). Refuses a second run unless --force (a report is a spend).
//   · `mission compare <ID>` — ONE opus merge of the two returns into
//     scout_reports/mission_<ID>_<day>_merged.md: every finding from both kept, agreements
//     marked with both sources, DISAGREEMENTS NAMED under their own heading, every URL kept,
//     nothing added that neither report holds. The Gemini return stays the verbatim `report`
//     (never overwritten); the merged one rides `report_merged` — the diff review reads it.
//   `benchmark` still opens on `audit-close` (Ruling 6, his word on the diffs; the 4th ingest
//   deals that card by itself — captains_call mission:audit-close) — PLAN-vs-CODE: §17-B said
//   "unlocks on ingest"; measuring against a map he has not yet ruled on is the half-lie
//   Ruling 6 names, so his word stays the gate and the card is what asks for it.
export function missionPromptFrom(text) {
  const s = String(text || "");
  const i = s.indexOf("---- PASTE FROM HERE");
  const body = i >= 0 ? s.slice(s.indexOf("\n", i) + 1) : s;
  return body.trim();
}
export function buildClaudeMissionPrompt(id, cluster, missionPrompt) {
  return `You are running RESEARCH MISSION ${id}${cluster ? ` (${cluster})` : ""} for Arsenal AI FC — the same brief a Gemini Deep Research run receives, verbatim below. Use WebSearch as many times as the brief needs. OUTPUT CONTRACT: reply with ONLY the finished research report in markdown — a title line \`# MISSION ${id} — Claude research return\`, then the sections the brief asks for. EVERY factual claim carries a source URL in the same line or paragraph (never a bare claim, never an invented URL — if you could not find a source, write "[no source found]" and keep the claim marked as unverified). Numbers only from sources. No preface, no meta ("I searched…"), no questions back, no tools other than WebSearch. Length: as long as the brief needs; do not pad.\n\n══════ THE MISSION BRIEF (verbatim) ══════\n${missionPrompt}`;
}
export function buildCompareMissionPrompt(id, gemini, claude) {
  return `You are merging TWO independent research returns for RESEARCH MISSION ${id} of Arsenal AI FC: report A (Gemini Deep Research) and report B (Claude + WebSearch). Both answered the SAME brief. Produce ONE MERGED REPORT in markdown, and obey these laws exactly:\n1. NOTHING DROPPED — every finding, number, recommendation and source from A and from B appears in the merge (fold duplicates into one line marked [A+B]; a finding only in one report is marked [A only] or [B only]).\n2. DISAGREEMENTS NAMED — where A and B disagree (a number, a ranking, a claim, a recommendation), put it under a heading \`## DISAGREEMENTS (named, not resolved)\` with both versions and both sources; do NOT pick a winner, do NOT average.\n3. SOURCES KEPT — every URL from either report survives, next to the claim it supports; add no URL that is not in A or B.\n4. ADD NOTHING — no new facts, no opinion, no advice; you are a merger, not a third researcher.\n5. Structure: \`# MISSION ${id} — merged return (A: Gemini · B: Claude)\` · \`## Where they agree\` · \`## DISAGREEMENTS (named, not resolved)\` · \`## Only in A\` · \`## Only in B\` · \`## Sources (all)\`. Reply with ONLY the merged markdown.\n\n══════ REPORT A (Gemini Deep Research, verbatim) ══════\n${gemini}\n\n══════ REPORT B (Claude + WebSearch, verbatim) ══════\n${claude}`;
}
export function claudeMissionRow(state, id, reportRelPath, now, meta = {}) {
  const row = state.missions.find(r => r.id.toLowerCase() === String(id || "").toLowerCase());
  if (!row) return { ok: false, error: `no mission "${id}" — see: node scripts/scout.mjs mission list` };
  row.claude_report = reportRelPath;
  row.claude_at = now.toISOString();
  if (meta.tokens != null) row.claude_tokens = meta.tokens;
  state.events.push({ ts: now.toISOString(), kind: "claude_return", id: row.id });
  return { ok: true, state, row };
}
export function compareMissionRow(state, id, mergedRelPath, now, meta = {}) {
  const row = state.missions.find(r => r.id.toLowerCase() === String(id || "").toLowerCase());
  if (!row) return { ok: false, error: `no mission "${id}"` };
  if (!row.report) return { ok: false, error: `${row.id} has no Gemini return yet (mission ingest first) — compare needs BOTH reports` };
  if (!row.claude_report) return { ok: false, error: `${row.id} has no Claude return yet (mission claude ${row.id} first) — compare needs BOTH reports` };
  row.report_merged = mergedRelPath;
  row.merged_at = now.toISOString();
  if (meta.tokens != null) row.merged_tokens = meta.tokens;
  state.events.push({ ts: now.toISOString(), kind: "compare", id: row.id });
  return { ok: true, state, row };
}
// the metered call — the §9.1 lane's row shape (gaffer_brain VERIFY_JOB), job mission_<id>
async function claudeResearchCall(prompt, { model = "opus", timeoutMs = 1200000, job = "mission", search = true, gen = null, meter = null } = {}) {
  const call = gen || (async (p) => { const { claudeGen } = await import("./claudegen.mjs"); return claudeGen(p, model, timeoutMs, search ? ["--allowedTools", "WebSearch"] : []); });
  const r = await call(prompt);
  const row = { ts: new Date().toISOString(), job, engine: "claude", model,
    input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null, cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
    total_tokens: r.total_tokens || 0, tokens_estimated: r.tokens_estimated !== false && !(r.input_tokens || r.output_tokens),
    duration_ms: r.duration_ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit, search };
  try { (meter || ((x) => appendFileSync(join(STATE_DIR, "brain_ledger.jsonl"), JSON.stringify(x) + "\n")))(row); } catch { /* an unmetered call is still a made call — never fail the mission on the meter */ }
  return { ...r, ledger_row: row };
}

// ONE read site + ONE write site for every mission/report file this organ touches (Block 5.3):
// the ingest's --file read, the mission brief, both returns and the merge all ride these two,
// so xray's per-organ unresolved-sink ratchet stays where it was (computed paths are Unknown
// statically by construction; the number of SITES is what the ratchet counts).
function readTextAt(absPath) { try { return readFileSync(absPath, "utf8"); } catch { return ""; } }
function reportAbs(rel) { return /^scout_reports\//.test(String(rel)) ? join(STATE_DIR, rel) : join(__dirname, "..", rel); }
function writeReport(name, text) { mkdirSync(REPORTS_DIR, { recursive: true }); writeFileSync(join(REPORTS_DIR, name), text, "utf8"); }

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
//
// THE GATED TERM (wiring pass, 11 Aug 2026). This read `benchmark ${benchRuns}`
// on every branch, and pre-audit-close that term is STRUCTURALLY zero, not
// merely zero-so-far: computeBenchmark's gated branch (benchmark.mjs:406 +
// its early return at :417) carries `runs` through untouched, and that organ's
// own selftest asserts it on purpose ("GATE — a gated run does NOT stamp the
// outward runs ledger", benchmark.mjs:543). Proof it is not theory: the live
// dressing-room/state/benchmark.json is stamped generated_at 2026-08-10T17:15Z
// with `runs: []` — it RAN and recorded nothing, because the gate was shut.
// So the old line read "benchmark 0" at a man who could not have made it
// anything else, and the kickoff's twin (learnstate.mjs:134) went further and
// promised "a benchmark run touches it" — a promise the producer cannot keep
// until `mission audit-close`. THE COUNT AND THE FLOOR ARE UNCHANGED (both his:
// Ruling 2's ≥2, and the composition that says only RETURNS are outward work —
// a gated run measures nothing, so it should not count, and the lock-chain
// firing benchmark.mjs on every capsule lock must never auto-satisfy his
// floor). What changes is only that the SHUT GATE now reaches the sentence:
// benchmark.json's `status` was sitting right here, read by nobody on this path.
function outwardWeek(state, bench, now) {
  const cutoff = now.getTime() - 7 * 86400000;
  const inWin = (iso) => { const t = new Date(iso).getTime(); return !Number.isNaN(t) && t >= cutoff && t <= now.getTime(); };
  const missionEvents = ((state && state.events) || []).filter(e => (e.kind === "ingest" || e.kind === "audit_close") && inWin(e.ts)).length;
  const benchRuns = ((bench && bench.runs) || []).filter(inWin).length;
  const count = missionEvents + benchRuns;
  const benchGated = !!(bench && bench.status === "gated_pre_audit");
  const benchNote = !bench ? "benchmark not run yet"
    : benchGated ? "benchmark GATED — a gated run stamps nothing, so a mission return is what moves this"
    : `benchmark ${benchRuns}`;
  return { count, floor: OUTWARD_FLOOR, missionEvents, benchRuns, benchGated,
    line: `outward checks this week: ${count}/${OUTWARD_FLOOR} (missions ${missionEvents} · ${benchNote}) — floor is his 7 Aug ruling` };
}

// P6.1 → Ruling 5: gemini_quality.jsonl gets its first reader. COUNT only —
// "recorded, judged by no one until the 30-45d review" (his rule). No dates
// ride scout.json (NO-DATES law), so the lane carries a count and a note.
//
// WORDING REPAIRED 10 Aug 2026 (wiring audit). This line said "gemini N batch(es)
// recorded" and rode the kickoff/talk readiness line. It was harmless only because
// the lane was DEAD — capture.mjs recorded a row solely on its `paste` door, and
// nothing pastes, so the file had never existed. Closing that wire (capture.mjs
// geminiBatchStats, same audit) makes this line FIRE, and it would have fired the
// word "gemini" over dugout-voice, turnstile-clipboard and throwin batches, which
// all hardcode surface "gem" and never touch Gemini. capture.mjs cannot prove a
// Gemini origin — nothing in the rep schema carries one — so this reader stops
// claiming it. The key `out.gemini` and the {batches,note} shape are UNCHANGED (a
// rename would be a second, unrelated break); what changes is the sentence a human
// reads. The lane's own rows now carry `door` + `notes`, which is what HIS 30-45d
// review slices on.
function attachGemini(out, batches) {
  if (!Number.isInteger(batches) || batches <= 0) return out;
  out.gemini = { batches, note: "rep-batch outcomes recorded at the capture door (paste + rep); origin is NOT verified as Gemini — unjudged till the 30-45d review" };
  const line = `rep-batch outcomes ${batches} recorded (unjudged)`;
  out.readiness_line = out.readiness_line ? `${out.readiness_line} · ${line}` : line;
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
  const gen = rows.filter(r => r.type !== "audit" && !r.ingested_at && !r.retired_at);   // W0-A: the dead never occupy his one slot
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

    // W0-A: pinned roster + no disk probe. These four ran against the LIVE concepts.json and
    // the LIVE missions directory, so the day he renames a concept the suite would have gone
    // red for a reason that has nothing to do with the code under test.
    const mreg = { concepts: { hallucinations: { aliases: ["hallucination"] }, tokenization: { aliases: ["bpe"] } }, skills: { fastapi: {} } };
    const md_ = { registry: mreg, taken: () => false };
    const g1 = stageGenerated(st, "hallucinations", "topic_open", t0, md_);
    const g2 = stageGenerated(st, "hallucinations", "topic_open", new Date(2026, 7, 9), md_);
    assert("missions: topic mission idempotent while open", g1.skipped === false && g2.skipped === true && g2.row.id === "T-hallucinations");
    ingestMission(st, "T-hallucinations", "rt.md", t0);
    const g3 = stageGenerated(st, "hallucinations", "topic_open", new Date(2026, 7, 20), md_);
    assert("missions: re-stage after ingest gets a dated suffix", g3.skipped === false && /^T-hallucinations@\d{4}-/.test(g3.row.id));
    const gl = stageGenerated(st, "hallucinations", "lock_harvest", t0, md_);
    assert("missions: lock mission stages as L-<concept>", gl.row.id === "L-hallucinations");

    // ── W0-A · THE SYLLABUS GATE, THE SLUG LAW, THE (concept,kind,open) KEY, THE RETIRE DOOR ──
    // (1 Sep 2026 — OL-03/H-12 · SB-10 · OL-04 · OL-05). Every one of these reproduces a row
    // that is in his LIVE missions.json today.
    {
      const sentence = "i am going in claude code and starting the entire organism. i have to get a job in the next 45 days.";
      const junk = stageGenerated(emptyMissions(), sentence, "topic_open", t0, md_);
      assert("W0-A GATE: his kickoff SENTENCE is refused — it never becomes an id, a row, or a filename (OL-03/H-12)",
        junk.row === null && !!junk.refused && /characters|punctuation|roster/.test(junk.refused));
      assert("W0-A GATE: a short off-roster word is refused too, and the refusal names where the valid ids live",
        (() => { const r = stageGenerated(emptyMissions(), "quantum", "topic_open", t0, md_); return r.row === null && /not on the syllabus roster/.test(r.refused) && /concepts\.json/.test(r.roster || ""); })());
      assert("W0-A GATE: an ALIAS resolves to its canonical id — `bpe` can never mint T-bpe beside T-tokenization",
        (() => { const r = stageGenerated(emptyMissions(), "BPE", "topic_open", t0, md_); return r.row.id === "T-tokenization" && r.row.concept === "tokenization"; })());
      assert("W0-A GATE: a skill id is a legal mission concept too (the roster is concepts + skills)",
        stageGenerated(emptyMissions(), "fastapi", "topic_open", t0, md_).row.id === "T-fastapi");

      // OL-04 — the live duplicate, reproduced then refused.
      const d = emptyMissions();
      stageGenerated(d, "hallucinations", "topic_open", t0, md_);
      ingestMission(d, "T-hallucinations", "r.md", t0);
      const dated1 = stageGenerated(d, "hallucinations", "topic_open", new Date(2026, 7, 19), md_);
      const dated2 = stageGenerated(d, "hallucinations", "topic_open", new Date(2026, 7, 19), md_);
      const dated3 = stageGenerated(d, "hallucinations", "topic_open", new Date(2026, 7, 25), md_);
      assert("W0-A OL-04: once a DATED row is open, every re-stage of that concept is skipped — the id-shape blind spot that minted T-hallucinations@2026-08-19 twice is closed",
        dated1.skipped === false && dated2.skipped === true && dated3.skipped === true
        && d.missions.filter(r => !r.ingested_at && !r.retired_at).length === 1);

      // SB-10 — the slug law. His words stay in the BODY; only the PATH is capped.
      const longId = "T-" + "a".repeat(300);
      const fn = missionFileName(longId, { taken: () => false });
      assert("W0-A SB-10: a 300-char id yields a filename ≤ 52 chars, lowercase [a-z0-9-] only",
        fn.length <= 52 && /^[a-z0-9-]+\.md$/.test(fn));
      assert("W0-A SB-10: a colliding slug takes a numeric suffix — never an overwrite",
        (() => { const seen = new Set(["t-tokenization.md"]); return missionFileName("T-tokenization", { taken: (n) => seen.has(n) }) === "t-tokenization-2.md"; })());
      assert("W0-A SB-10: the mission BODY still carries the concept verbatim — the ceiling is on the path, never on his words",
        topicMissionMd("hallucinations", t0).includes("hallucinations") && slugForFile("T-hallucinations@2026-08-19") === "t-hallucinations-2026-08-19");

      // OL-05 — the retire door.
      const rr = emptyMissions();
      stageGenerated(rr, "hallucinations", "topic_open", t0, md_);
      assert("W0-A OL-05: retire REFUSES without a reason — a retirement with no why is a deletion with extra steps",
        retireMission(rr, "T-hallucinations", "", t0).ok === false && retireMission(rr, "T-nope", "x", t0).ok === false);
      const ret = retireMission(rr, "t-HALLUCINATIONS", "wrong topic, staged by mistake", t0);
      assert("W0-A OL-05: retire is case-insensitive, STAMPS the row and journals the event — the row stays, nothing is deleted (L9)",
        ret.ok && rr.missions.length === 1 && !!rr.missions[0].retired_at && rr.missions[0].retired_why === "wrong topic, staged by mistake"
        && rr.events.some(e => e.kind === "retire"));
      assert("W0-A OL-05: a retired mission vanishes from his ONE kickoff slot, and re-retiring is refused",
        missionLines(rr, t0).every(l => !/T-hallucinations/.test(l)) && retireMission(rr, "T-hallucinations", "again", t0).ok === false);
      assert("W0-A OL-05: retiring frees the concept — the desk can stage it again afterwards",
        stageGenerated(rr, "hallucinations", "topic_open", new Date(2026, 7, 21), md_).skipped === false);
      // the live shape: TWO rows carrying one id must both be stamped, or a ghost survives
      const twin = emptyMissions();
      twin.missions.push({ id: "T-x@2026-08-19", type: "topic_open", concept: "x", file: "dressing-room/missions/t-x.md", staged_at: t0.toISOString(), ingested_at: null, report: null });
      twin.missions.push({ id: "T-x@2026-08-19", type: "topic_open", concept: "x", file: "dressing-room/missions/t-x.md", staged_at: t0.toISOString(), ingested_at: null, report: null });
      const tw = retireMission(twin, "T-x@2026-08-19", "duplicate row, OL-04", t0);
      assert("W0-A OL-05: BOTH rows sharing one id are retired together — no ghost left behind",
        tw.ok && tw.rows.length === 2 && twin.missions.every(r => !!r.retired_at));
      const un = unretireMission(twin, "T-X@2026-08-19", "retired by mistake", t0);
      assert("W0-A OL-05: the retire door has a WAY BACK — unretire re-opens every row it stamped, and journals it",
        un.ok && un.rows.length === 2 && twin.missions.every(r => !r.retired_at && !r.retired_why)
        && twin.events.some(e => e.kind === "unretire"));
      assert("W0-A OL-05: parking a prompt is idempotent and always NAMES its destination — a second retire of the same row must not report the file as missing",
        (() => { const seen = new Set(); const d = { exists: (f) => seen.has(f), mkdir: () => {}, move: (_f, t) => seen.add(t) };
          const a = parkRetiredFile("dressing-room/missions/T-Long Name.md", { ...d, exists: (f) => seen.has(f) || /T-Long Name/.test(f) });
          const b = parkRetiredFile("dressing-room/missions/T-Long Name.md", d);
          return a.moved === true && b.moved === false && b.why === "already parked" && a.to === b.to && /t-long-name\.md$/.test(a.to); })());
      assert("W0-A OL-05: unretire refuses a row that is not retired, and refuses a reversal with no reason",
        unretireMission(twin, "T-x@2026-08-19", "x", t0).ok === false && retireMission(twin, "T-x@2026-08-19", "", t0).ok === false);
    }

    const tMd = topicMissionMd("embeddings", t0), lMd = lockMissionMd("embeddings", t0);
    assert("missions: topic prompt carries the EMPHASIS-not-SYLLABUS guard",
      /tune EMPHASIS, never reopen the SYLLABUS/.test(tMd) && /do NOT propose adding or removing topics/.test(tMd));
    assert("missions: both prompts carry the paste marker + the ingest door",
      [tMd, lMd].every(m => /PASTE FROM HERE/.test(m) && /mission ingest/.test(m)));
    assert("missions: prompts are doors, not debts (no owe/should/deadline language)",
      [tMd, lMd].every(m => !/you (should|must|owe)|deadline/i.test(m)));

    // ── §17-B MISSIONS AUTOMATIC (Block 5.3) — the Claude leg + the merge, pure and hermetic ──
    {
      const md = "<!-- machine header — not prompt -->\nFire on: Gemini Pro → Deep Research\n---- PASTE FROM HERE (into Gemini) ----\nAUDIT the agents + LLM-API cluster of the syllabus against the live market. List sources.\nSecond line of the brief.";
      const brief = missionPromptFrom(md);
      assert("5.3 missionPromptFrom — the brief is everything BELOW the paste marker (machine header never reaches a model); no marker ⇒ the whole text",
        brief.startsWith("AUDIT the agents") && /Second line/.test(brief) && !/machine header/.test(brief) && missionPromptFrom("plain brief") === "plain brief");
      const cp = buildClaudeMissionPrompt("M03", "agents + LLM-API cluster", brief);
      assert("5.3 the Claude leg's prompt carries the brief VERBATIM + the source law (every claim a URL, [no source found] never invented) + WebSearch only + no meta",
        cp.includes(brief) && /MISSION M03/.test(cp) && /source URL/.test(cp) && /\[no source found\]/.test(cp) && /never an invented URL/.test(cp) && /no tools other than WebSearch/.test(cp) && /no meta/.test(cp));
      const mp = buildCompareMissionPrompt("M03", "GEMINI SAYS 42 https://a.test", "CLAUDE SAYS 41 https://b.test");
      assert("5.3 the merge prompt names the FIVE laws — nothing dropped · disagreements NAMED not resolved · sources kept · add nothing · the fixed section list — and carries both returns verbatim",
        /NOTHING DROPPED/.test(mp) && /DISAGREEMENTS NAMED/.test(mp) && /do NOT pick a winner/.test(mp) && /SOURCES KEPT/.test(mp) && /ADD NOTHING/.test(mp) && /## DISAGREEMENTS \(named, not resolved\)/.test(mp) && mp.includes("GEMINI SAYS 42 https://a.test") && mp.includes("CLAUDE SAYS 41 https://b.test"));
      const s3 = emptyMissions(); stageAudit(s3, t0);
      const c0 = compareMissionRow(JSON.parse(JSON.stringify(s3)), "M03", "x", t0);
      const cr = claudeMissionRow(s3, "m03", "scout_reports/mission_M03_2026-08-18_claude.md", t0, { tokens: 51234 });
      const c1 = compareMissionRow(JSON.parse(JSON.stringify(s3)), "M03", "x", t0);
      ingestMission(s3, "M03", "scout_reports/mission_M03_2026-08-18.md", t0);
      const c2 = compareMissionRow(s3, "M03", "scout_reports/mission_M03_2026-08-18_merged.md", t0, { tokens: 9000 });
      assert("5.3 claudeMissionRow — stamps claude_report · claude_at · claude_tokens on the row (case-insensitive id) and journals a claude_return event; an unknown id is refused",
        cr.ok && cr.row.id === "M03" && cr.row.claude_report.endsWith("_claude.md") && cr.row.claude_tokens === 51234 && s3.events.some(e => e.kind === "claude_return" && e.id === "M03") && claudeMissionRow(s3, "M99", "x", t0).ok === false);
      assert("5.3 compareMissionRow — refuses until BOTH returns exist (names which is missing), then stamps report_merged · merged_at and journals a compare event; the Gemini `report` stays what ingest wrote (verbatim, never overwritten)",
        c0.ok === false && /no Gemini return/.test(c0.error) && c1.ok === false && /no Gemini return/.test(c1.error)
        && c2.ok && c2.row.report_merged.endsWith("_merged.md") && c2.row.report === "scout_reports/mission_M03_2026-08-18.md" && c2.row.merged_tokens === 9000 && s3.events.some(e => e.kind === "compare"));
      const c3 = compareMissionRow((() => { const s = emptyMissions(); stageAudit(s, t0); ingestMission(s, "M04", "r.md", t0); return s; })(), "M04", "x", t0);
      assert("5.3 compareMissionRow — a Gemini return with no Claude leg yet is refused naming the claude step", c3.ok === false && /no Claude return/.test(c3.error) && /mission claude M04/.test(c3.error));
      // the metered call: the §9.1 row shape (job mission_<id>), gen + meter injected — no claude, no ledger
      const metered = [];
      const rr = await claudeResearchCall("p", { model: "opus", job: "mission_m03", gen: async () => ({ ok: true, text: "# MISSION M03 — Claude research return\n…", input_tokens: 1000, output_tokens: 3000, total_tokens: 4000, duration_ms: 12000, tokens_estimated: false }), meter: (row) => metered.push(row) });
      assert("5.3 claudeResearchCall — ONE ledger row in gaffer_verify's shape: job mission_<id> · engine claude · model · tokens · duration · ok · search:true; the reply rides back with the row",
        rr.ok && metered.length === 1 && metered[0].job === "mission_m03" && metered[0].engine === "claude" && metered[0].model === "opus" && metered[0].total_tokens === 4000 && metered[0].search === true && metered[0].ok === true && rr.ledger_row === metered[0]);
      const rf = await claudeResearchCall("p", { job: "mission_compare_m03", search: false, gen: async () => ({ ok: false, error: "boom", total_tokens: 0 }), meter: (row) => metered.push(row) });
      assert("5.3 claudeResearchCall — a failed call is STILL metered (ok:false, error kept, search:false for the merge) — an unmetered call is a lie on the spend board", rf.ok === false && metered.length === 2 && metered[1].ok === false && metered[1].error === "boom" && metered[1].search === false);
    }

    const week = outwardWeek(st, { runs: [new Date(2026, 7, 7).toISOString(), new Date(2026, 6, 1).toISOString()] }, new Date(2026, 7, 9));
    assert("missions: outward floor counts only the trailing 7 days (bench 1 of 2 in-window)", week.benchRuns === 1 && week.floor === 2);
    assert("missions: staging is machine prep — only RETURNS count toward the floor",
      outwardWeek({ events: [{ ts: t0.toISOString(), kind: "stage_audit" }, { ts: t0.toISOString(), kind: "stage_topic" }] }, null, t0).count === 0
      && outwardWeek({ events: [{ ts: t0.toISOString(), kind: "ingest" }] }, null, t0).count === 1);
    assert("missions: outward line is have/need, never shame", /\d+\/2/.test(week.line) && !/behind|failed|late/i.test(week.line));
    assert("missions: outward safe on a bloodless world", outwardWeek(null, null, t0).count === 0);
    // THE GATED TERM (11 Aug 2026). Fails the moment the floor line goes back to
    // reading "benchmark 0" at a producer that structurally cannot stamp runs[]
    // pre-audit-close (benchmark.mjs:406/:417, and its own selftest at :543).
    const wGated = outwardWeek(st, { status: "gated_pre_audit", runs: [] }, t0);
    assert("missions: a GATED benchmark is NAMED as gated — never counted as a missed check",
      wGated.benchGated === true && /benchmark GATED/.test(wGated.line) && !/benchmark 0/.test(wGated.line));
    assert("missions: the gate changes the WORDING only — his floor and his composition are untouched",
      wGated.count === outwardWeek(st, { status: "gated_pre_audit", runs: [t0.toISOString()] }, t0).count - 1
      && wGated.floor === 2
      && /benchmark 1/.test(outwardWeek(st, { status: "ok", runs: [t0.toISOString()] }, t0).line));

    const g0 = buildScout([], { learn: [], ratify: [] }, t0, undefined, stageReadiness(null, loadConfig("__no_such__")));
    assert("gemini lane: batches attach as a COUNT + unjudged note, and ride the readiness line",
      attachGemini({ ...g0 }, 3).gemini.batches === 3
      && /unjudged till the 30-45d/.test(attachGemini({ ...g0 }, 3).gemini.note)
      && /rep-batch outcomes 3 recorded/.test(attachGemini({ ...g0 }, 3).readiness_line));
    // 10 Aug 2026 — the lane went LIVE this day (capture.mjs's paste-only gate was the
    // reason it had never been written). The count is real now, so the word must be
    // true: dugout-voice / turnstile / throwin batches all carry surface "gem" without
    // ever meeting Gemini, and nothing in the rep schema proves an origin. If a future
    // pass re-introduces the claim, this goes red.
    assert("gemini lane: the reader does NOT claim a Gemini origin it cannot prove (dugout-voice batches would be 'gem' too)",
      !/gemini/i.test(attachGemini({ ...g0 }, 3).readiness_line)
      && /NOT verified as Gemini/.test(attachGemini({ ...g0 }, 3).gemini.note));
    assert("gemini lane: zero batches attach NOTHING (absence, not a zero-claim)",
      attachGemini({ ...g0 }, 0).gemini === undefined && attachGemini({ ...g0 }, null).gemini === undefined);
    assert("gemini lane: NO-DATES law still holds with the lane attached",
      !/\d{4}-\d{2}-\d{2}/.test(JSON.stringify({ ...attachGemini({ ...g0 }, 5), date: "", generated_at: "" })));

    const linesFire = missionLines({ missions: st.missions.filter(r => r.type === "audit").map(r => ({ ...r, ingested_at: null })), syllabus_audit: { closed_at: null } }, t0);
    assert("missions: kickoff line says which mission to fire NEXT", /next fire: M01/.test(linesFire[0]));
    const linesIn = missionLines({ missions: st.missions.filter(r => r.type === "audit"), syllabus_audit: { closed_at: null } }, t0);
    assert("missions: all-returned line routes to diff review + his word", /diff review \+ audit-close/.test(linesIn[0]));
    assert("missions: no mission rows → no lines (absence, not noise)", missionLines(emptyMissions(), t0).length === 0);

    // THE BENCHMARK WIRE (10 Aug 2026) — these fail the moment the wire is cut.
    // Source-read assertions follow dugout.mjs:2589 / scoreboard.mjs:421.
    const bcmd = benchmarkRefreshCmd();
    assert("benchmark wire: exact spawn argv — the OWNER's CLI (benchmark.mjs run), never a raw write here",
      /benchmark\.mjs$/.test(bcmd.args[0]) && bcmd.args[1] === "run" && bcmd.args.length === 2);
    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8");
    // lastIndexOf, not indexOf: this very assertion mentions the name, and the
    // selftest sits ABOVE the CLI in the file. The refreshBenchmark DEFINITION
    // also sits above missionCli, so only its CALL SITES fall inside `cli`.
    const cli = SRC.slice(SRC.lastIndexOf("function missionCli(mode)"));
    assert("benchmark wire: every missions.json write that moves the gate line refreshes it (stage-audit · ingest · audit-close)",
      (cli.match(/refreshBenchmark\(/g) || []).length === 3);
    const closeBlock = cli.slice(cli.indexOf('sub === "audit-close"'), cli.indexOf('sub === "outward"'));
    assert("benchmark wire: audit-close FIRES the benchmark, never hands him a command to remember (ANCHOR LAW)",
      /refreshBenchmark\(/.test(closeBlock) && !/run: node scripts\/benchmark\.mjs/.test(closeBlock));
    assert("benchmark wire: scout still never writes benchmark.json itself (sole-writer law)",
      !/writeAtomic\([^)]*benchmark\.json|writeFileSync\([^)]*benchmark\.json/.test(SRC));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// THE BENCHMARK WIRE (10 Aug 2026 — his "everything connected to everywhere
// where it is required")
// ---------------------------------------------------------------------------
// BUILT BUT NOT WIRED, found live: benchmark.json's stored `gate.missions_line`
// is printed verbatim by manager.mjs:263 (team sheet), postmatch.mjs:176
// (SEASON.md) and viz.mjs:309 (the wall), and learnstate's kickoff brief reads
// the same file. Every event that CHANGES that line is a missions.json write in
// THIS file — stage-audit, ingest, audit-close — and none of them told the
// benchmark. Only forge_session's LOCK-CHAIN ever re-ran it, i.e. on a capsule
// lock, an event with nothing to do with the audit. Proof it bit: M01 came back
// 2026-08-10T15:41 and benchmark.json still read "full-syllabus audit 0/4
// returned — next fire: M01", generated 2026-08-07T21:01. audit-close was worse:
// it only PRINTED "run: node scripts/benchmark.mjs run" — a command to remember,
// which THE ANCHOR LAW forbids outright.
// WHY A SHELL, NOT AN IMPORT: benchmark.mjs is the SOLE WRITER of benchmark.json
// (its header says so). The precedent for crossing an organ boundary is the
// owner's own CLI — dugout.mjs shells doubtminer.mjs, forge_session shells this
// file and benchmark.mjs. Nothing here touches benchmark.json.
// NOT AUTO-ACTING: `run` only re-derives a read from state he already moved by
// his own command. The GATE still opens only on his word (--note); a gated
// benchmark refreshes its gate line and stays gated.
// TIMEOUT: 20000ms, taken verbatim from forge_session.mjs's benchmark lane
// (chainCommands, 8 Aug 2026) — not a new number.
function benchmarkRefreshCmd() {
  return { name: "benchmark", args: [join(__dirname, "benchmark.mjs"), "run"], timeout: 20000 };
}

// Fail-silent by design, same as the LOCK-CHAIN: an outward refresh must never
// break the mission write that already landed on disk.
function refreshBenchmark(why) {
  const cmd = benchmarkRefreshCmd();
  try {
    const out = execFileSync(process.execPath, cmd.args, { encoding: "utf8", timeout: cmd.timeout });
    console.log(`  benchmark refreshed (${why}): ${out.trim().split("\n").pop() || "ran"}`);
  } catch (e) {
    console.log(`  benchmark refresh skipped (${String(e.message || e).slice(0, 70)}) — non-blocking; the wire retries on the next mission event`);
  }
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
    refreshBenchmark("audit staged — gate line moves from 'not yet staged' to 0/4");
    return;
  }

  if (sub === "stage-topic" || sub === "stage-lock") {
    const concept = (process.argv[4] || "").toLowerCase().trim();
    if (!concept) { console.error(`usage: scout.mjs mission ${sub} <concept>`); process.exit(1); }
    const kind = sub === "stage-topic" ? "topic_open" : "lock_harvest";
    const { row, skipped, refused, roster } = stageGenerated(state, concept, kind, now);
    if (refused) {
      console.error(`MISSIONS DESK · REFUSED — ${refused}. A mission tunes EMPHASIS inside a FIXED syllabus, so its concept must already be an id on the roster${roster ? `: ${roster}` : ""}.`);
      process.exit(1);
    }
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
    text = readTextAt(file || 0);   // --file <path>, else stdin (fd 0) — the one read site
    if (!text || text.trim().length < 40) {
      console.error("ingest refused: return is empty/too thin (<40 chars). Pass --file <path> or pipe the Gemini output on stdin.");
      process.exit(1);
    }
    const reportName = `mission_${id.toUpperCase()}_${dayKey(now)}.md`;   // Block 6 — day-key
    const res = ingestMission(state, id, `scout_reports/${reportName}`, now);
    if (!res.ok) { console.error(`ingest refused: ${res.error}`); process.exit(1); }
    writeReport(reportName, text);
    writeAtomic(MISSIONS, state);
    console.log(`MISSIONS DESK · ${res.row.id} ingested → dressing-room/state/scout_reports/${reportName} (verbatim).`);
    console.log(`  next: diff review rides the next session anchor — canon (OPPONENT_SCOUT/ROADMAP) changes only with his word.`);
    if (res.auditComplete) console.log(`  🔓 all 4 audit returns in — after the diffs are dealt: mission audit-close --note "<his word>" (opens the benchmark gate).`);
    refreshBenchmark(`${res.row.id} returned — the gate line the sheet/SEASON/wall print just changed`);
    return;
  }

  // §17-B (Block 5.3) — THE CLAUDE LEG: the same brief, through the §9.1 WebSearch lane, verbatim to disk, metered, stamped
  if (sub === "claude") {
    const id = process.argv[4];
    if (!id) { console.error("usage: scout.mjs mission claude <ID> [--model opus|sonnet] [--force] [--dry]"); process.exit(1); }
    const row = state.missions.find(r => r.id.toLowerCase() === String(id).toLowerCase());
    if (!row) { console.error(`mission claude refused: no mission "${id}" — see: node scripts/scout.mjs mission list`); process.exit(1); }
    if (row.claude_report && !process.argv.includes("--force")) { console.error(`mission claude refused: ${row.id} already has a Claude return (${row.claude_report}) — a report is a spend; --force runs it again`); process.exit(1); }
    const brief = missionPromptFrom(readTextAt(reportAbs(row.file)));
    if (brief.length < 40) { console.error(`mission claude refused: the mission file is missing on disk or carries no prompt below its PASTE marker (${row.file})`); process.exit(1); }
    const model = argAfter("--model") || "opus";
    const prompt = buildClaudeMissionPrompt(row.id, row.cluster || row.concept || null, brief);
    if (process.argv.includes("--dry")) { console.log(`MISSIONS DESK · ${row.id} claude leg DRY — ${prompt.length} chars would go to ${model} + WebSearch (job mission_${row.id.toLowerCase()}); nothing spent, nothing written.`); return; }
    console.log(`MISSIONS DESK · ${row.id} claude leg — ${model} + WebSearch on the mission brief (${brief.length} chars). Minutes, not seconds.`);
    return (async () => {
      const r = await claudeResearchCall(prompt, { model, job: `mission_${row.id.toLowerCase()}` });
      if (!r.ok || !String(r.text || "").trim() || String(r.text).trim().length < 400) { console.error(`mission claude FAILED: ${r.error || "empty/too-thin return"} (${r.total_tokens || 0} tok spent, metered)`); process.exit(1); }
      const reportName = `mission_${row.id.toUpperCase()}_${dayKey(now)}_claude.md`;   // Block 6 — day-key
      writeReport(reportName, String(r.text).trim() + "\n");
      const res = claudeMissionRow(state, row.id, `scout_reports/${reportName}`, now, { tokens: r.total_tokens || 0 });
      writeAtomic(MISSIONS, state);
      console.log(`MISSIONS DESK · ${res.row.id} CLAUDE RETURN → dressing-room/state/scout_reports/${reportName} (${String(r.text).length.toLocaleString()} chars · ${(r.total_tokens || 0).toLocaleString()} tok · ${Math.round((r.duration_ms || 0) / 1000)} s).`);
      console.log(row.report ? `  both returns in — merge: node scripts/scout.mjs mission compare ${res.row.id}` : `  Gemini leg still out — when it lands (mission ingest ${res.row.id}), then: mission compare ${res.row.id}`);
    })();
  }
  // §17-B (Block 5.3) — THE MERGE: one opus pass over the two returns; disagreements named, sources kept, nothing dropped
  if (sub === "compare") {
    const id = process.argv[4];
    if (!id) { console.error("usage: scout.mjs mission compare <ID> [--model opus|sonnet] [--dry]"); process.exit(1); }
    const row = state.missions.find(r => r.id.toLowerCase() === String(id).toLowerCase());
    if (!row) { console.error(`mission compare refused: no mission "${id}"`); process.exit(1); }
    const pre = compareMissionRow(JSON.parse(JSON.stringify(state)), row.id, "(dry)", now);   // the refusal rules, without touching state
    if (!pre.ok) { console.error(`mission compare refused: ${pre.error}`); process.exit(1); }
    if (row.report_merged && !process.argv.includes("--force")) { console.error(`mission compare refused: ${row.id} is already merged (${row.report_merged}) — --force merges again`); process.exit(1); }
    const gem = readTextAt(reportAbs(row.report)), cl = readTextAt(reportAbs(row.claude_report));
    if (gem.trim().length < 40 || cl.trim().length < 40) { console.error(`mission compare refused: a return is empty on disk (gemini ${gem.length} chars · claude ${cl.length} chars)`); process.exit(1); }
    const model = argAfter("--model") || "opus";
    const prompt = buildCompareMissionPrompt(row.id, gem, cl);
    if (process.argv.includes("--dry")) { console.log(`MISSIONS DESK · ${row.id} compare DRY — ${prompt.length} chars would go to ${model} (job mission_compare_${row.id.toLowerCase()}); nothing spent, nothing written.`); return; }
    console.log(`MISSIONS DESK · ${row.id} compare — merging Gemini (${gem.length.toLocaleString()} chars) + Claude (${cl.length.toLocaleString()} chars) on ${model}…`);
    return (async () => {
      const r = await claudeResearchCall(prompt, { model, job: `mission_compare_${row.id.toLowerCase()}`, search: false, timeoutMs: 900000 });
      if (!r.ok || String(r.text || "").trim().length < 400) { console.error(`mission compare FAILED: ${r.error || "empty/too-thin merge"} (${r.total_tokens || 0} tok spent, metered)`); process.exit(1); }
      const name = `mission_${row.id.toUpperCase()}_${dayKey(now)}_merged.md`;   // Block 6 — day-key
      writeReport(name, String(r.text).trim() + "\n");
      const res = compareMissionRow(state, row.id, `scout_reports/${name}`, now, { tokens: r.total_tokens || 0 });
      writeAtomic(MISSIONS, state);
      console.log(`MISSIONS DESK · ${res.row.id} MERGED → dressing-room/state/scout_reports/${name} (${String(r.text).length.toLocaleString()} chars · ${(r.total_tokens || 0).toLocaleString()} tok). Gemini's verbatim return is untouched (${row.report}); the diff review reads the merge.`);
    })();
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
    // ANCHOR LAW (10 Aug 2026): this line used to print the command and stop —
    // so the sheet, SEASON.md and the wall kept saying GATED until a human
    // remembered it. His word already fired here; the gate opens in the same breath.
    console.log(`  🔓 THE BENCHMARK GATE IS OPEN — firing it now (no command to remember).`);
    refreshBenchmark("audit-close on his word — the gate is open");
    return;
  }

  if (sub === "unretire") {
    const id = process.argv[4];
    const why = argAfter("--why");
    const r = unretireMission(state, id, why, now);
    if (!r.ok) { console.error(r.error); process.exit(1); }
    writeAtomic(MISSIONS, state);
    let backs = 0;
    for (let i = 0; i < r.rows.length; i++) if (unparkRetiredFile(r.parked[i], r.rows[i].file).moved) backs++;
    console.log(`MISSIONS DESK · un-retired ${r.id}${r.rows.length > 1 ? ` (${r.rows.length} rows)` : ""} — \"${why}\". It is an open mission again${backs ? " and its prompt is back on the desk" : ""}.`);
    return;
  }

  if (sub === "retire") {
    const id = process.argv[4];
    const why = argAfter("--why");
    const r = retireMission(state, id, why, now);
    if (!r.ok) { console.error(r.error); process.exit(1); }
    writeAtomic(MISSIONS, state);
    // stamp WHERE it went. `file` stays as provenance (where it was staged); a list that
    // keeps printing the old path after the move is a reader pointing at nothing.
    let parked = 0;
    for (const x of r.rows) {
      const mv = parkRetiredFile(x.file);
      if (mv.moved) parked++;
      if (mv.to) x.retired_file = `dressing-room/missions/retired/${mv.to.replace(/^.*[\\/]/, "")}`;
    }
    if (parked || r.rows.some(x => x.retired_file)) writeAtomic(MISSIONS, state);
    console.log(`MISSIONS DESK · retired ${r.id}${r.rows.length > 1 ? ` (${r.rows.length} rows carried that id)` : ""} — "${why}". The row stays with its stamp (nothing deleted); ${parked ? `the prompt moved to dressing-room/missions/retired/` : "no prompt file to move"}.`);
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
    // Block 5.3: the three legs read side by side — gemini (fired/ingested) · claude · merged
    const legs = [r.fired_at && !r.ingested_at ? "fired, in flight" : null, r.claude_report ? "claude ✓" : (r.claude_at ? "claude ?" : "claude —"), r.report_merged ? "merged ✓" : (r.report && r.claude_report ? "merge pending" : null)].filter(Boolean).join(" · ");
    console.log(`  ${String(r.id).slice(0, 22).padEnd(22)} ${r.type.padEnd(12)} ${r.retired_at ? `✕ retired — ${r.retired_why || "no reason recorded"}` : r.ingested_at ? "✓ ingested" : `staged ${age}d`}  ${r.retired_at ? (r.retired_file || r.file) : (r.report || r.file)}${legs ? `   [${legs}]` : ""}`);
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
  // LADDER E7 (9 Aug 2026) — THE CHROME-RAIL STAMP. Four skills drive his Chrome
  // (/fire · /harvest · /gem-sync · /gist-patch) and nothing recorded that a
  // drive ever SUCCEEDED — so a rail that quietly broke (extension dead, login
  // lost) stayed broken until he noticed by hand. Each skill now presses this
  // after a successful drive; physio bleeds when the newest stamp goes stale.
  // Sole writer of chrome_rail_stamp.json (same ownership ruling as nightshift's
  // gem-stamp — a skill never writes state raw).
  if (mode === "chrome-stamp") {
    const rail = process.argv[3];
    if (!rail) { console.error("scout: chrome-stamp <fire|harvest|gem-sync|gist-patch>"); process.exit(1); }
    writeAtomic(join(STATE_DIR, "chrome_rail_stamp.json"), { at: new Date().toISOString(), rail });
    console.log(`scout: chrome rail stamped — ${rail} drove successfully`);
    return;
  }
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
  retireMission, unretireMission, parkRetiredFile, unparkRetiredFile, validateConcept, missionFileName, slugForFile,
  topicMissionMd, lockMissionMd, AUDIT_MISSIONS, attachGemini };
