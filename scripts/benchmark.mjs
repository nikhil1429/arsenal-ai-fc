#!/usr/bin/env node
// ============================================================================
// benchmark.mjs · ARSENAL AI FC — THE BENCHMARK (outward loop, 8 Aug 2026)
// ----------------------------------------------------------------------------
// WHAT:  Where he stands vs the interview map — AI_PE_ROADMAP's 5 buckets ×
//        THE DOSSIER's round-weights (§1) × LIVE evidence. HAVE/NEED as COUNTS
//        and NAMES only. No composite score, no percentage-readiness, no grade:
//        a single invented number here would be exactly the guessed threshold
//        his 1 Aug rule forbids. The weights shown are the DOSSIER's own (§1),
//        arithmetic on them is shown as arithmetic ("17.8% + 26.7% = 44.5%").
// GATE (Ruling 6, his word 8 Aug 2026 ~01:00): "Benchmark ships AFTER this
//        refresh (measuring against a stale map is half a lie)." Until
//        missions.json carries syllabus_audit.closed_at (scout.mjs `mission
//        audit-close` — an EVENT on his study, never a date), `run` writes only
//        the gate status. `preview` computes for the console, labelled PRE-AUDIT,
//        and never rides the bus.
// BUCKET MAP: sourced from AI_PE_ROADMAP.md "ROADMAP ↔ FORGE" — not invented
//        here. 1-fundamentals is the neenv of B1+B2 (the ROADMAP's own words),
//        so its group appears under both, labelled shared.
// WHO ELSE COULD ACT ON THIS OUTPUT (Ruling 5 standing question, answered):
//        viz.mjs (wall line) · manager.mjs (team-sheet squad report) ·
//        learnstate.mjs (kickoff brief line) · captains_call.mjs (regression
//        card — PULL-DERIVE, zero code here) · scout.mjs `outward` (runs[]
//        feed the ≥2×/week floor) · /matchday · watchman (INFO line).
// INPUT (read-only): dossier_weights.json · concepts.json · capsule_map.json ·
//        rejirah_log.jsonl · python_state.json · course.json · shipped.json ·
//        timeaudit.json · missions.json
// OUTPUT: dressing-room/state/benchmark.json (sole writer)
// MODES:  run (default) · preview · report · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_BENCH_STATE_DIR is the selftest's seam and nothing else's (house
// pattern: captains_call ARSENAL_CALL_STATE_DIR, outwork ARSENAL_OUTWORK_STATE_DIR).
const STATE_DIR = process.env.ARSENAL_BENCH_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const OUT = join(STATE_DIR, "benchmark.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readJsonl = (p) => {
  try {
    if (!existsSync(p)) return [];
    return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
};
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// THE BUCKET MAP — AI_PE_ROADMAP.md's own 5 buckets and its own ROADMAP↔FORGE
// wiring, projected once. Skill→bucket rows follow the same section (skills
// have no bucket field in concepts.json, so the mapping of record lives here).
// ---------------------------------------------------------------------------
const ROADMAP_BUCKETS = [
  { id: "B1", label: "AI se baat karna (LLM APIs + Output Mgmt)",
    concept_buckets: [{ id: "4-llm-api" }, { id: "1-fundamentals", note: "neenv — shared with B2" }],
    skills: ["anthropic_api", "prompt_engineering", "streaming"], course: true },
  { id: "B2", label: "RAG (AI ko apne data pe smart banana)",
    concept_buckets: [{ id: "2-rag" }, { id: "1-fundamentals", note: "neenv — shared with B1" }],
    skills: [] },
  { id: "B3", label: "AI Agents",
    concept_buckets: [{ id: "3-agents" }], skills: ["tool_use_api"] },
  { id: "B4", label: "AI ko reliable banana (Guardrails + LLMOps)",
    concept_buckets: [{ id: "5-llmops" }], skills: ["evaluations"] },
  { id: "B5", label: "Full Stack foundation (shipped product)",
    concept_buckets: [], skills: ["python_basics", "pydantic", "fastapi", "async", "api_error_handling", "parsers", "react_ui"],
    python: true, shipped: true, building: true },
];
// #1 senior signal + the fintech moat — not a 6th bucket (ROADMAP has 5); they
// ride beside the buckets as differentiators, same evidence grammar.
const DIFFERENTIATOR_BUCKETS = [{ id: "6-cross-cut" }, { id: "7-domain" }];

const pct = (w) => `${+(w * 100).toFixed(1)}%`;

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
const isGrade = (r) => r && r.axis && !r.kind;
function heldColdByConcept(rejirahRows) {
  const m = new Map();
  for (const r of rejirahRows) {
    if (!isGrade(r) || r.result !== "held" || r.cold === false) continue;
    m.set(r.concept, (m.get(r.concept) || 0) + 1);
  }
  return m;
}

function roundsLine(bucketIds, dossier) {
  // union of the DOSSIER rounds these concept-buckets feed, weights verbatim,
  // sum shown AS arithmetic (his quoted form: "17.8 + 26.7 = 44.5%").
  const byId = new Map(((dossier && dossier.rounds) || []).map((r) => [r.id, r]));
  const seen = new Set();
  for (const b of bucketIds) for (const rid of ((dossier && dossier.bucket_round_map && dossier.bucket_round_map[b]) || [])) seen.add(rid);
  const rounds = [...seen].map((id) => byId.get(id)).filter(Boolean);
  if (!rounds.length) return "rounds: (dossier missing — no weight claimed)";
  const sum = rounds.reduce((a, r) => a + r.weight, 0);
  return `rides: ${rounds.map((r) => `${r.id} ${pct(r.weight)}`).join(" + ")}${rounds.length > 1 ? ` = ${pct(sum)}` : ""} of the interview`;
}

function conceptGroup(bucketId, note, registry, capsuleMap, heldMap) {
  const core = Object.entries((registry && registry.concepts) || {})
    .filter(([, v]) => v.bucket === bucketId && v.core).map(([k]) => k);
  const lockedSet = new Set(((capsuleMap && capsuleMap.concepts) || []).filter((c) => c.locked_on).map((c) => c.concept));
  const locked = core.filter((c) => lockedSet.has(c));
  const held = locked.filter((c) => (heldMap.get(c) || 0) > 0);
  return {
    bucket: bucketId, note: note || null,
    core_total: core.length, locked: locked.length, held_cold: held.length,
    locked_names: locked, unlocked_names: core.filter((c) => !lockedSet.has(c)),
  };
}
const groupLine = (g) =>
  `${g.bucket}${g.note ? ` (${g.note})` : ""}: locked ${g.locked}/${g.core_total} · cold re-proof ${g.held_cold}/${g.locked || 0}`;

function buildBucket(spec, inputs) {
  const { registry, capsuleMap, heldMap, dossier, python, course, shipped, timeaudit } = inputs;
  const groups = spec.concept_buckets.map((cb) => conceptGroup(cb.id, cb.note, registry, capsuleMap, heldMap));
  const have = [], need = [];
  for (const g of groups) {
    have.push(groupLine(g));
    if (g.unlocked_names.length) need.push(`${g.bucket}: unlock ${g.unlocked_names.join(", ")}`);
    if (g.locked > g.held_cold) need.push(`${g.bucket}: cold re-proof pending on ${g.locked - g.held_cold} locked (Re-Jirah)`);
  }
  if (spec.skills.length) {
    have.push(`skills named on this bucket: ${spec.skills.join(", ")} — fluency rides python_state/learning_state, counted when reps exist`);
  }
  if (spec.course) {
    if (course && Array.isArray(course.chapters)) {
      const covered = course.chapters.filter((c) => c.covered).length;
      have.push(`course "${(course.course && course.course.title) || "?"}": ${covered}/${course.chapters.length} chapters covered`);
      if (covered < course.chapters.length) need.push(`course: ${course.chapters.length - covered} chapters remain`);
    } else have.push("course: no course ingested yet");
  }
  if (spec.python) {
    if (python && (python.tier || python.subtopic)) have.push(`python: tier ${python.tier || "—"} · ${python.fluency || "—"}${python.subtopic ? ` · at ${python.subtopic}` : ""}`);
    else { have.push("python: not started (tier —)"); need.push("python: Phase A tiers T0→T4-lite (syllabus §2)"); }
  }
  if (spec.shipped) {
    if (shipped && shipped.totals) have.push(`shipped (last run ${shipped.date || "?"}): ${shipped.totals.commits || 0} commit(s) · ${shipped.totals.new_files || 0} new file(s) · unpushed ${shipped.totals.unpushed || 0}`);
    else have.push("shipped: no ledger yet");
  }
  if (spec.building) {
    const b = timeaudit && timeaudit.buckets && timeaudit.buckets.Building;
    if (b) have.push(`Building time (single-day snapshot ${timeaudit.date || "?"}): ${b.pct}% of active`);
    else have.push("Building time: no timeaudit yet");
  }
  const counts = {
    locked: groups.reduce((a, g) => a + g.locked, 0),
    held_cold: groups.reduce((a, g) => a + g.held_cold, 0),
    core_total: groups.reduce((a, g) => a + g.core_total, 0),
  };
  return {
    id: spec.id, label: spec.label,
    rounds_line: roundsLine([...spec.concept_buckets.map((c) => c.id), ...(spec.skills.length ? ["skills"] : [])], dossier),
    have, need, counts,
  };
}

// Regressions = a COUNTED cumulative went DOWN since the last full run. No
// thresholds — any decrease is named. Daily %s (Building) are deliberately not
// regression-tracked: a snapshot wobbling is weather, not a lost hold.
function findRegressions(prev, buckets, courseCovered) {
  if (!prev || prev.status !== "ok" || !Array.isArray(prev.buckets)) return [];
  const out = [];
  const prevBy = new Map(prev.buckets.map((b) => [b.id, b]));
  for (const b of buckets) {
    const p = prevBy.get(b.id);
    if (!p || !p.counts) continue;
    if (b.counts.locked < p.counts.locked) out.push(`${b.id} ${b.label}: locked ${p.counts.locked} → ${b.counts.locked}`);
    if (b.counts.held_cold < p.counts.held_cold) out.push(`${b.id} ${b.label}: cold-held ${p.counts.held_cold} → ${b.counts.held_cold}`);
  }
  if (typeof prev.course_covered === "number" && courseCovered < prev.course_covered)
    out.push(`course: chapters covered ${prev.course_covered} → ${courseCovered}`);
  return out;
}

function gateState(missions) {
  const closed = !!(missions && missions.syllabus_audit && missions.syllabus_audit.closed_at);
  if (closed) return { open: true, line: `audit closed ${missions.syllabus_audit.closed_at.slice(0, 10)} on his word: "${missions.syllabus_audit.note || ""}"` };
  const rows = (missions && missions.missions) || [];
  const audit = rows.filter((r) => r.type === "audit");
  const done = audit.filter((r) => r.ingested_at).length;
  const line = audit.length
    ? `full-syllabus audit ${done}/4 returned${done === 4 ? " — awaiting audit-close (his word)" : ` — next fire: ${(audit.find((r) => !r.ingested_at) || {}).id || "?"}`}`
    : "audit not yet staged — node scripts/scout.mjs mission stage-audit";
  return { open: false, line };
}

function computeBenchmark(inputs, now, prev) {
  const gate = gateState(inputs.missions);
  const runs = ((prev && prev.runs) || []).slice(-59);
  if (!gate.open) {
    return {
      date: localDate(now), status: "gated_pre_audit",
      gate: { reason: "Ruling 6 — benchmark ships AFTER the full-syllabus audit refresh (measuring against a stale map is half a lie; DOSSIER researched 29 Jun 2026)", missions_line: gate.line },
      runs, generated_at: now.toISOString(),
    };
  }
  const heldMap = heldColdByConcept(inputs.rejirahRows || []);
  const buckets = ROADMAP_BUCKETS.map((spec) => buildBucket(spec, { ...inputs, heldMap }));
  const differentiators = DIFFERENTIATOR_BUCKETS.map((cb) => {
    const g = conceptGroup(cb.id, null, inputs.registry, inputs.capsuleMap, heldMap);
    return { ...g, rounds_line: roundsLine([cb.id], inputs.dossier) };
  });
  const courseCovered = inputs.course && Array.isArray(inputs.course.chapters) ? inputs.course.chapters.filter((c) => c.covered).length : 0;
  const regressions = findRegressions(prev, buckets, courseCovered);
  return {
    date: localDate(now), status: "ok",
    gate: { reason: null, missions_line: gate.line },
    buckets, differentiators, course_covered: courseCovered,
    regressions,
    runs: [...runs, now.toISOString()],
    generated_at: now.toISOString(),
  };
}

function renderBenchmark(b) {
  const L = [];
  if (b.status === "gated_pre_audit") {
    L.push(`== THE BENCHMARK ==   GATED (pre-audit)`);
    L.push(`  ${b.gate.reason}`);
    L.push(`  ${b.gate.missions_line}`);
    return L.join("\n");
  }
  L.push(`== THE BENCHMARK ==   ${b.date} · have/need per bucket (counts + names — no scores, by law)`);
  L.push(`  gate: ${b.gate.missions_line}`);
  for (const bk of b.buckets) {
    L.push(`\n  ${bk.id} — ${bk.label}`);
    L.push(`     ${bk.rounds_line}`);
    for (const h of bk.have) L.push(`     have: ${h}`);
    for (const n of bk.need) L.push(`     need: ${n}`);
  }
  L.push(`\n  differentiators (not a 6th bucket — the #1 senior signal + the fintech moat):`);
  for (const d of b.differentiators) L.push(`     ${groupLine(d)} · ${d.rounds_line}`);
  if (b.regressions.length) { L.push(`\n  ⚠ REGRESSIONS (counted evidence went DOWN):`); for (const r of b.regressions) L.push(`     ${r}`); }
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// selftest — fixtures only, disk-free
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  console.log("== benchmark selftest ==\n");
  const now = new Date(2026, 7, 8, 12, 0, 0);

  const dossier = { rounds: [
    { id: "system_design", label: "x", minutes: 60, weight: 0.267 },
    { id: "build", label: "x", minutes: 50, weight: 0.222 },
    { id: "production_eval", label: "x", minutes: 45, weight: 0.2 },
    { id: "fundamentals", label: "x", minutes: 40, weight: 0.178 },
    { id: "behavioral", label: "x", minutes: 30, weight: 0.133 },
  ], bucket_round_map: {
    "1-fundamentals": ["fundamentals", "system_design"], "2-rag": ["system_design", "production_eval", "build"],
    "3-agents": ["system_design", "build"], "4-llm-api": ["system_design", "build"],
    "5-llmops": ["production_eval", "system_design"], "6-cross-cut": ["system_design", "production_eval"],
    "7-domain": ["fundamentals", "system_design"], "skills": ["build", "production_eval"],
  } };
  const registry = { concepts: {
    tokenization: { bucket: "1-fundamentals", core: true }, inference: { bucket: "1-fundamentals", core: true },
    embeddings: { bucket: "2-rag", core: true }, chunking: { bucket: "2-rag", core: true },
    tool_use: { bucket: "3-agents", core: true }, structured_output: { bucket: "4-llm-api", core: true },
    golden_dataset: { bucket: "5-llmops", core: true }, where_not_ai: { bucket: "6-cross-cut", core: true },
    tds: { bucket: "7-domain", core: true }, neuralnet: { bucket: "1-fundamentals", core: false },
  }, skills: {} };
  const capsuleMap = { concepts: [
    { concept: "tokenization", locked_on: "2026-06-15" }, { concept: "embeddings", locked_on: "2026-06-21" },
  ] };
  const rejirahRows = [
    { concept: "embeddings", axis: "a", result: "held", gut: "shaky", cold: true, ts: "2026-08-05T10:00:00Z" },
    { concept: "embeddings", axis: "b", result: "cracked", gut: "knew", cold: true, ts: "2026-08-05T10:05:00Z" },
    { concept: "embeddings", kind: "round-close", ts: "2026-08-05T10:10:00Z" },
    { concept: "tokenization", axis: "a", result: "held", gut: "knew", cold: false, ts: "2026-08-05T10:15:00Z" },
  ];
  const missionsGated = { missions: [
    { id: "M01", type: "audit", staged_at: "x", ingested_at: "y" }, { id: "M02", type: "audit", staged_at: "x", ingested_at: null },
    { id: "M03", type: "audit", staged_at: "x", ingested_at: null }, { id: "M04", type: "audit", staged_at: "x", ingested_at: null },
  ], syllabus_audit: { closed_at: null } };
  const missionsOpen = { missions: [], syllabus_audit: { closed_at: "2026-08-10T09:00:00Z", note: "dossier holds" } };
  const python = { tier: null, fluency: "🔴", subtopic: null };
  const course = { course: { title: "Anthropic API Fundamentals" }, chapters: [{ covered: true }, { covered: false }, { covered: false }] };
  const shipped = { date: "2026-08-07", totals: { commits: 2, new_files: 3, unpushed: 0 } };
  const timeaudit = { date: "2026-08-07", buckets: { Building: { pct: 0.7 } } };
  const base = { dossier, registry, capsuleMap, rejirahRows, python, course, shipped, timeaudit };

  // THE GATE (Ruling 6)
  const gated = computeBenchmark({ ...base, missions: missionsGated }, now, null);
  assert("GATE — pre-audit run ships NO buckets (half a lie stays off the bus)",
    gated.status === "gated_pre_audit" && !gated.buckets && /Ruling 6/.test(gated.gate.reason));
  assert("GATE — the gate line says where the audit stands + what fires next",
    /1\/4 returned/.test(gated.gate.missions_line) && /M02/.test(gated.gate.missions_line));
  assert("GATE — a gated run does NOT stamp the outward runs ledger", gated.runs.length === 0);
  assert("GATE — audit-close (his word) opens it",
    computeBenchmark({ ...base, missions: missionsOpen }, now, null).status === "ok");

  // THE BUCKETS
  const b = computeBenchmark({ ...base, missions: missionsOpen }, now, null);
  assert("5 roadmap buckets + differentiators beside them (never a 6th bucket)",
    b.buckets.length === 5 && b.differentiators.length === 2);
  const b1 = b.buckets.find((x) => x.id === "B1"), b2 = b.buckets.find((x) => x.id === "B2"), b5 = b.buckets.find((x) => x.id === "B5");
  assert("counts are COUNTS: B2 locked 1/2 (embeddings) + shared neenv group visible in both B1 and B2",
    b2.have.some((h) => /2-rag: locked 1\/2/.test(h)) && b1.have.some((h) => /1-fundamentals \(neenv/.test(h)) && b2.have.some((h) => /1-fundamentals \(neenv/.test(h)));
  assert("cold re-proof counts ONLY cold held grades (embeddings yes; tokenization's warm held no)",
    b2.have.some((h) => /2-rag: locked 1\/2 · cold re-proof 1\/1/.test(h))
    && b1.have.some((h) => /1-fundamentals[^:]*: locked 1\/2 · cold re-proof 0\/1/.test(h)));
  assert("need names the unlocked by NAME (no invented priority)",
    b2.need.some((n) => /unlock chunking/.test(n)) && b1.need.some((n) => /unlock inference/.test(n)));
  assert("round weights are the DOSSIER's own, sum shown as arithmetic",
    /fundamentals 17\.8% \+ system_design 26\.7% = 44\.5%/.test(roundsLine(["1-fundamentals"], dossier)));
  assert("B5 carries python/course-free evidence: shipped + Building% labelled single-day",
    b5.have.some((h) => /shipped \(last run 2026-08-07\): 2 commit/.test(h)) && b5.have.some((h) => /single-day snapshot/.test(h)));
  assert("python not-started is stated + Phase-A named as the need",
    b5.have.some((h) => /python: not started/.test(h)) && b5.need.some((n) => /T0→T4-lite/.test(n)));
  assert("course evidence rides B1 (1/3 covered) and the remainder is the need",
    b1.have.some((h) => /1\/3 chapters covered/.test(h)) && b1.need.some((n) => /2 chapters remain/.test(n)));
  assert("NO-SCORE LAW — no score/grade/readiness_pct field anywhere in the output",
    !/"(score|grade|readiness_pct|percent_ready|rating)"/i.test(JSON.stringify(b)));
  assert("NO-COUNTDOWN LAW — no deadline/days-left language",
    !/deadline|days left|due by/i.test(JSON.stringify(b)));

  // REGRESSIONS (Ruling 5 edge)
  const prevOk = JSON.parse(JSON.stringify(b));
  const shrunkMap = { concepts: [{ concept: "tokenization", locked_on: "2026-06-15" }] }; // embeddings vanished
  const b3 = computeBenchmark({ ...base, capsuleMap: shrunkMap, missions: missionsOpen }, now, prevOk);
  // B2's count sums its groups (2-rag 1→0 plus the shared neenv's steady 1) → 2→1.
  assert("a counted cumulative going DOWN is named as a regression (bucket + numbers)",
    b3.regressions.some((r) => /B2[\s\S]*locked 2 → 1/.test(r)));
  assert("equal counts ⇒ zero regressions (no noise)",
    computeBenchmark({ ...base, missions: missionsOpen }, now, prevOk).regressions.length === 0);
  assert("a gated prev never feeds regressions (nothing to compare against)",
    computeBenchmark({ ...base, missions: missionsOpen }, now, gated).regressions.length === 0);
  assert("runs ledger accumulates on full runs and carries the prev ledger",
    computeBenchmark({ ...base, missions: missionsOpen }, now, prevOk).runs.length === prevOk.runs.length + 1);

  // BLOODLESS WORLD
  const empty = computeBenchmark({ dossier: null, registry: null, capsuleMap: null, rejirahRows: [], python: null, course: null, shipped: null, timeaudit: null, missions: missionsOpen }, now, null);
  assert("bloodless world computes without crashing, states absence honestly",
    empty.status === "ok" && empty.buckets.length === 5
    && empty.buckets.every((bk) => bk.counts.core_total === 0)
    && JSON.stringify(empty).includes("no timeaudit yet"));
  assert("render — gated render is 3 honest lines, full render carries have/need",
    /GATED \(pre-audit\)/.test(renderBenchmark(gated)) && /have: /.test(renderBenchmark(b)) && /need: /.test(renderBenchmark(b)));

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function gatherInputs() {
  return {
    dossier: readJson(join(STATE_DIR, "dossier_weights.json")),
    registry: readJson(join(STATE_DIR, "concepts.json")),
    capsuleMap: readJson(join(STATE_DIR, "capsule_map.json")),
    rejirahRows: readJsonl(join(STATE_DIR, "rejirah_log.jsonl")),
    python: readJson(join(STATE_DIR, "python_state.json")),
    course: readJson(join(STATE_DIR, "course.json")),
    shipped: readJson(join(STATE_DIR, "shipped.json")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    missions: readJson(join(STATE_DIR, "missions.json")),
  };
}

function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const now = new Date();
  if (mode === "report") {
    const b = readJson(OUT);
    console.log(b ? renderBenchmark(b) : "benchmark: never run — node scripts/benchmark.mjs run");
    return;
  }
  const prev = readJson(OUT);
  const b = computeBenchmark(gatherInputs(), now, prev);
  if (mode === "preview") {
    if (b.status === "gated_pre_audit") {
      // preview computes what run refuses to ship — same inputs, forced open,
      // console-only, loudly labelled. The bus never sees it.
      const forced = computeBenchmark({ ...gatherInputs(), missions: { missions: [], syllabus_audit: { closed_at: "preview", note: "PREVIEW — not his word" } } }, now, null);
      console.log("⚠ PRE-AUDIT PREVIEW — by his ruling this is measured against a 29 Jun map (half a lie). Console-only; benchmark.json stays gated.\n");
      console.log(renderBenchmark({ ...forced, runs: [] }));
    } else {
      console.log(renderBenchmark(b));
    }
    return;
  }
  // run
  writeAtomic(OUT, b);
  if (b.status === "gated_pre_audit") console.log(`benchmark: GATED (pre-audit) — ${b.gate.missions_line} → ${OUT}`);
  else console.log(`benchmark: ok · ${b.buckets.length} buckets · regressions ${b.regressions.length} · run #${b.runs.length} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeBenchmark, renderBenchmark, roundsLine, conceptGroup, heldColdByConcept, findRegressions, gateState, ROADMAP_BUCKETS };
