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
//        timeaudit.json · missions.json · learning_state.json (the skills lane —
//        added 10 Aug 2026; the have-line had named it since 8 Aug and this file
//        never opened it. See THE SKILLS LANE above buildBucket.)
// INPUT FAULTS (wiring pass, 10 Aug 2026 — see BLOCKING_INPUTS below): a
//        half-written input can no longer be mistaken for evidence he lost.
// OUTPUT: dressing-room/state/benchmark.json (sole writer)
// MODES:  run (default) · preview · report · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
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
// ---------------------------------------------------------------------------
// INPUT FAULTS (wiring pass, 10 Aug 2026)
// ---------------------------------------------------------------------------
// readJson() above cannot tell "file absent" from "file half-written": both come
// back null. In most of this file that is harmless — null becomes a STATED
// absence ("no timeaudit yet", "shipped: no ledger yet"). In four places it is
// not, because null there becomes a POSITIVE CLAIM about his evidence:
//   capsule_map.json → conceptGroup()'s lockedSet   ⇒ every locked count reads 0
//   concepts.json    → conceptGroup()'s core        ⇒ every bucket reads 0/0
//   course.json      → course_covered               ⇒ findRegressions' 3rd line
//   missions.json    → gateState()                  ⇒ his own audit-close word
//                                                     reads "not yet staged"
// findRegressions() then turns that 0 into "locked 3 → 0" and captains_call.mjs
// (:258-263) deals it at an anchor he already hits: he is told he LOST three
// locked capsules because mirror.mjs was mid-write. PROVEN live 10 Aug through
// the ARSENAL_BENCH_STATE_DIR seam — truncated capsule_map.json gave
// status "ok", regressions ["B1 …locked 2 → 0", "B2 …locked 3 → 0"], and
// NOTHING anywhere in the output named the broken file.
// So the rule, derived from the code above and not from taste: an input is
// BLOCKING when its malformed-ness moves a number findRegressions() compares or
// the gate that decides whether we ship at all. Everything else is non-blocking
// but still NAMED on the bus (a field that says a thing is missing is the whole
// difference between a gap and a lie).
// House precedent for the loud half: setpiece.mjs:1107 WARNs by name on a
// malformed dossier. This adds the state half too — see main()'s `run`.
const BLOCKING_INPUTS = new Set(["capsule_map.json", "concepts.json", "course.json", "missions.json"]);
const readJsonTracked = (dir, name, faults) => {
  const p = join(dir, name);
  if (!existsSync(p)) return null; // absent — an honest absence, never a fault
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) {
    faults.push({ file: name, why: String((e && e.message) || e).slice(0, 140), blocking: BLOCKING_INPUTS.has(name) });
    return null;
  }
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

// ---------------------------------------------------------------------------
// THE SKILLS LANE — wired 10 Aug 2026 (tracing pass)
// ---------------------------------------------------------------------------
// buildBucket's skills row was ONE hardcoded string: "skills named on this
// bucket: … — fluency rides python_state/learning_state, counted when reps
// exist". It named a source this file never opened — gatherInputs read nine
// JSONs and learning_state.json was not among them — and nothing anywhere in
// here ever counted a skill. So all 12 named skills (the WHOLE of B5, plus one
// each on B1/B3/B4) were decoration: no skill could move a have/need line, and
// the promise "counted when reps exist" was false while reps_log.jsonl held
// reps. Built, present, not wired.
// THE SOURCE, and why this one: learning_state.mjs:522 emits `python_fluency` =
// { skill_id → LABEL }, built ONLY from track:"skill" reps (capture.mjs:228 —
// concept and skill are separate namespaces). A skill becomes a KEY there the
// day it gets its first skill-track rep and never before, which IS "counted
// when reps exist", already computed, by its owner. It is emitted unconditionally
// even under the low-confidence gate (learning_state.mjs:430 emitted_regardless),
// so reading it never smuggles a gated number onto this bus.
// WHY NOT COUNT reps_log.jsonl DIRECTLY HERE: the fluency ladder that turns reps
// into a label (warming_up_min_reps 12 · held_streak 2 · fluent_streak 3 ·
// aided-gating) lives in learning_state.mjs and is HIS calibration. A second
// engine here would either copy those numbers or invent new ones — the guessed
// threshold his 1 Aug rule forbids. Render the owner's projection, don't rebuild
// it (the same call manager.mjs made for `projection` below).
// THE OLD STRING WAS ALSO WRONG ABOUT python_state.json: that file carries the
// Python TRACK's tier/fluency/subtopic and has no per-skill key at all (verified
// live 10 Aug — its keys are subtopic/tier/fluency/watch_list/subtopics/tiers).
// It already has its own have-line under spec.python; it is not a skills source.
// NOT BLOCKING, by this file's own derived rule (:71): learning_state.json moves
// no number findRegressions() compares — see the counts block below for why the
// skills counts are deliberately kept out of it — and it does not touch the gate.
// So a malformed one is NAMED on the bus and nothing more.
const SKILL_FLUENT = /fluent/;   // learning_state.mjs:105 LABEL — "🟢 fluent" is
                                 // the top rung of ITS ladder, read verbatim,
                                 // never re-ranked or re-thresholded here.
function skillsGroup(bucketId, skills, learningState) {
  // ABSENCE IS NOT A ZERO (house rule — viz.mjs:314). learning_state.json absent
  // or malformed ⇒ `read:false` and NO count, because "0/7 with reps" would be a
  // positive claim that he has done nothing — exactly the BLOCKING_INPUTS failure
  // shape documented at :52-76, one lane over. The owner always emits
  // python_fluency (`{}` on the zero-reps path, learning_state.mjs:472), so a file
  // missing the key entirely was not written by the owner ⇒ also unread.
  const fluency = learningState && typeof learningState.python_fluency === "object" && learningState.python_fluency !== null
    ? learningState.python_fluency : null;
  const rows = skills.map((id) => ({ id, label: fluency && typeof fluency[id] === "string" && fluency[id] ? fluency[id] : null }));
  const withReps = rows.filter((r) => r.label);
  return {
    bucket: bucketId, read: !!fluency, total: skills.length,
    with_reps: withReps.length,
    with_reps_names: withReps.map((r) => `${r.id} ${r.label}`),
    no_reps_names: rows.filter((r) => !r.label).map((r) => r.id),
    // "not yet fluent" is the owner's own top-rung name, not a bar invented here.
    pending_names: withReps.filter((r) => !SKILL_FLUENT.test(r.label)).map((r) => `${r.id} ${r.label}`),
  };
}
const skillsHaveLine = (sg) => sg.read
  ? `skills: ${sg.with_reps}/${sg.total} with reps — ${sg.with_reps_names.join(" · ") || "none yet"}${sg.no_reps_names.length ? ` · no reps yet: ${sg.no_reps_names.join(", ")}` : ""} (learning_state.python_fluency — a skill counts the day it gets a track:"skill" rep)`
  : `skills on this bucket: ${sg.no_reps_names.join(", ")} — fluency UNREAD (learning_state.json absent or unreadable; learning_state.mjs owns it). No count claimed.`;

function buildBucket(spec, inputs) {
  const { registry, capsuleMap, heldMap, dossier, python, course, shipped, timeaudit, learningState } = inputs;
  const groups = spec.concept_buckets.map((cb) => conceptGroup(cb.id, cb.note, registry, capsuleMap, heldMap));
  const have = [], need = [];
  // evidence[] — the SHORT form of the have[] rows that are not concept-locks.
  // Same values, same sources; it exists so the projection line below can carry
  // real evidence off this file instead of only counts. (10 Aug 2026 wiring pass.)
  const evidence = [];
  for (const g of groups) {
    have.push(groupLine(g));
    if (g.unlocked_names.length) need.push(`${g.bucket}: unlock ${g.unlocked_names.join(", ")}`);
    if (g.locked > g.held_cold) need.push(`${g.bucket}: cold re-proof pending on ${g.locked - g.held_cold} locked (Re-Jirah)`);
  }
  const sg = spec.skills.length ? skillsGroup(spec.id, spec.skills, learningState) : null;
  if (sg) {
    have.push(skillsHaveLine(sg));
    // The need half — the same two shapes the concept groups use above, so the
    // grammar of "what to DO" is identical whichever lane produced it. Only when
    // the source was actually READ: we never tell him to go do reps on the
    // strength of a file we could not open.
    if (sg.read && sg.no_reps_names.length) need.push(`${spec.id} skills: no reps yet on ${sg.no_reps_names.join(", ")}`);
    if (sg.read && sg.pending_names.length) need.push(`${spec.id} skills: fluency pending on ${sg.pending_names.join(", ")}`);
  }
  if (spec.course) {
    if (course && Array.isArray(course.chapters)) {
      const covered = course.chapters.filter((c) => c.covered).length;
      have.push(`course "${(course.course && course.course.title) || "?"}": ${covered}/${course.chapters.length} chapters covered`);
      if (covered < course.chapters.length) need.push(`course: ${course.chapters.length - covered} chapters remain`);
    } else have.push("course: no course ingested yet");
  }
  if (spec.python) {
    if (python && (python.tier || python.subtopic)) {
      have.push(`python: tier ${python.tier || "—"} · ${python.fluency || "—"}${python.subtopic ? ` · at ${python.subtopic}` : ""}`);
      evidence.push(`python tier ${python.tier || "—"}`);
    } else {
      have.push("python: not started (tier —)"); need.push("python: Phase A tiers T0→T4-lite (syllabus §2)");
      evidence.push("python not started");
    }
  }
  if (spec.shipped) {
    if (shipped && shipped.totals) {
      have.push(`shipped (last run ${shipped.date || "?"}): ${shipped.totals.commits || 0} commit(s) · ${shipped.totals.new_files || 0} new file(s) · unpushed ${shipped.totals.unpushed || 0}`);
      evidence.push(`shipped ${shipped.totals.commits || 0} commit(s)`);
    } else { have.push("shipped: no ledger yet"); evidence.push("no shipped ledger"); }
  }
  if (spec.building) {
    const b = timeaudit && timeaudit.buckets && timeaudit.buckets.Building;
    if (b) have.push(`Building time (single-day snapshot ${timeaudit.date || "?"}): ${b.pct}% of active`);
    else have.push("Building time: no timeaudit yet");
  }
  // pushed LAST on purpose: the projection line's existing head (python, shipped)
  // is already rendered on the team sheet, the wall and SEASON.md, and appending
  // keeps those bytes stable while B5 — 7 skills by design — finally carries its
  // skills lane onto all three. Concept-cored buckets ignore evidence[] entirely;
  // their skills reach the surfaces through needs[] (flattenNeeds) instead.
  if (sg) evidence.push(sg.read ? `skills ${sg.with_reps}/${sg.total} with reps` : `skills ${sg.total} named, fluency unread`);
  const counts = {
    locked: groups.reduce((a, g) => a + g.locked, 0),
    held_cold: groups.reduce((a, g) => a + g.held_cold, 0),
    core_total: groups.reduce((a, g) => a + g.core_total, 0),
    // basis — WHAT these counts measure. B5's concept_buckets is [] by design
    // (its evidence is the shipped product, not a locked capsule), so its counts
    // are a STRUCTURAL zero, not a measured one. Without this field a consumer
    // cannot tell "he has locked none of 8" from "there was never anything here
    // to count", and all three of them rendered the second as the first.
    basis: groups.length ? "concept_core" : "evidence_only",
    // the skills lane as COUNTS (10 Aug 2026 wiring pass). skills_read carries
    // the absent-vs-zero distinction into the counts themselves, so a consumer
    // reading counts alone cannot render "0/7" as a measurement.
    // DELIBERATELY NOT REGRESSION-TRACKED — findRegressions() below compares
    // `locked` and `held_cold` only, and skills must not join them: python_fluency
    // is a DERIVED SNAPSHOT that legitimately reads `{}` whenever learning_state
    // has not recomputed (its zero-reps path, :472). A benchmark run on such a
    // morning would announce "he lost 3 fluent skills" — the identical false
    // regression the fault block at :52-76 exists to prevent, and it would reach
    // him as a captain card (captains_call.mjs:258). A skills regression needs a
    // freshness contract on learning_state.json that does not exist yet; until
    // then this lane reports and never accuses.
    skills_total: spec.skills.length,
    skills_read: sg ? sg.read : null,
    skills_with_reps: sg && sg.read ? sg.with_reps : null,
  };
  // THE PROJECTION LINE (10 Aug 2026 wiring pass) — composed HERE, by the owner,
  // because three organs render it: manager.mjs (team sheet :264), viz.mjs (the
  // wall :310), postmatch.mjs (SEASON.md :177). Each built `${id} ${locked}/
  // ${core_total}` itself, so B5 read "B5 0/0" on every surface for weeks while
  // its real evidence — 16 commits, python tier, Building% — sat in have[], which
  // NOTHING reads. manager.mjs:260 already had the right instinct in its own
  // comment ("pre-composed here so the sheet and the FEATURES table can never
  // disagree on a number"); this moves that one step upstream so all three agree.
  // NO NEW NUMBERS: the concept_core form is byte-identical to what they built,
  // and every evidence part is a value already printed in have[] above.
  const projection = counts.basis === "concept_core"
    ? `${spec.id} ${counts.locked}/${counts.core_total}`
    : `${spec.id} evidence-only${evidence.length ? ` — ${evidence.join(", ")}` : " — nothing on record yet"}`;
  return {
    id: spec.id, label: spec.label,
    rounds_line: roundsLine([...spec.concept_buckets.map((c) => c.id), ...(spec.skills.length ? ["skills"] : [])], dossier),
    have, need, counts, projection,
  };
}

// THE NEEDS, FLATTENED — the wire that was missing (tracing pass, 10 Aug 2026).
// This organ's stated product is "HAVE/NEED as COUNTS and NAMES only" (:6-7),
// but `grep -rn "differentiators|need\[" --include=*.mjs .` came back with ZERO
// readers outside this file: all seven consumers (manager:264 · viz:310 ·
// postmatch:177 · learnstate:110-114 · captains_call:258 · scout:386 ·
// watchman:238) touch counts and regressions only. So every surface he actually
// hits read "B2 1/5" and never "unlock chunking, retrieval, rag_eval" or
// "6 chapters remain" — the only half that says what to DO. Built, present,
// not wired. renderBenchmark() did read them, but nothing shells `report`
// (forge's lock-chain shells `run`, scout's wire shells `run`), so the names
// died in this file.
// ORDER: the ROADMAP's own bucket order, then the differentiators — NOT a
// ranking. A "top 3 needs" here would be an invented priority, which is exactly
// the guessed number his 1 Aug rule forbids; there is no cap and no sort.
// DEDUPE: B1 and B2 both carry the 1-fundamentals neenv group (the ROADMAP's own
// sharing, :64/:67), so its need line is produced twice and listed once.
// DIFFERENTIATORS: this is the ONLY place their unlocked names exist as a need
// at all — conceptGroup() gives them names but buildBucket()'s need[] never sees
// them, so pre-10-Aug the #1 senior signal and the fintech moat had no "do this"
// anywhere in the organism. Same two need shapes as buildBucket, verbatim.
function flattenNeeds(buckets, differentiators) {
  const out = [];
  for (const b of buckets || []) for (const n of (b.need || [])) if (!out.includes(n)) out.push(n);
  for (const d of differentiators || []) {
    if (d.unlocked_names && d.unlocked_names.length) out.push(`${d.bucket}: unlock ${d.unlocked_names.join(", ")}`);
    if (d.locked > d.held_cold) out.push(`${d.bucket}: cold re-proof pending on ${d.locked - d.held_cold} locked (Re-Jirah)`);
  }
  return out;
}

// Regressions = a COUNTED cumulative went DOWN since the last full run. No
// thresholds — any decrease is named. Daily %s (Building) are deliberately not
// regression-tracked: a snapshot wobbling is weather, not a lost hold.
//
// FROZEN VERBATIM 10 Aug 2026 (LAYERING law) — this is the engine as it shipped
// 8 Aug. It is correct about arithmetic and blind about provenance: it compares
// a 0 that means "he unlocked nothing" against a 0 that means "the file that
// holds his locks would not parse", and calls both a loss. Kept as written, in
// this file, so the diff between the two is readable forever.
function findRegressionsLegacy(prev, buckets, courseCovered) {
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

// THE PLAN OF RECORD (10 Aug 2026): same arithmetic, one guard in front of it.
// A regression is a CLAIM ABOUT HIS EVIDENCE, dealt at his anchor by
// captains_call.mjs:258-263 — so it may only be made from inputs we could read.
// If a BLOCKING_INPUTS file was malformed this run, every count derived from it
// is unknown, not zero, and no loss is claimed. The fault is not smuggled into
// regressions[] either: a half-written state file is a machine problem (its
// owner is mirror.mjs / scout.mjs), and THE ANCHOR LAW says what does not need
// the captain does not reach him. It rides input_faults instead.
function findRegressions(prev, buckets, courseCovered, blockingFiles = []) {
  if (blockingFiles.length) return [];
  return findRegressionsLegacy(prev, buckets, courseCovered);
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
  // input_faults rides EVERY branch, `[]` when clean — a field that names the
  // absence, which is the whole difference between a gap and a lie. blocking[]
  // is the subset main() refuses to ship on (see BLOCKING_INPUTS).
  const faults = Array.isArray(inputs.faults) ? inputs.faults : [];
  const blockingFiles = faults.filter((f) => f && f.blocking).map((f) => f.file);
  if (!gate.open) {
    return {
      date: localDate(now), status: "gated_pre_audit",
      gate: { reason: "Ruling 6 — benchmark ships AFTER the full-syllabus audit refresh (measuring against a stale map is half a lie; DOSSIER researched 29 Jun 2026)", missions_line: gate.line },
      input_faults: faults, blocking_faults: blockingFiles,
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
  const regressions = findRegressions(prev, buckets, courseCovered, blockingFiles);
  return {
    date: localDate(now), status: "ok",
    gate: { reason: null, missions_line: gate.line },
    input_faults: faults, blocking_faults: blockingFiles,
    buckets, differentiators, course_covered: courseCovered,
    // needs = the flat, ROADMAP-ordered union of every need[] plus the
    // differentiators' own (10 Aug 2026 wiring pass). It exists because the
    // per-bucket need[] reached no reader — see flattenNeeds. Consumers render
    // from THIS so the kickoff brief, the team sheet, the wall and SEASON.md
    // cannot drift into four different wordings of the same debt.
    needs: flattenNeeds(buckets, differentiators),
    regressions,
    runs: [...runs, now.toISOString()],
    generated_at: now.toISOString(),
  };
}

// The fault block prints FIRST and on both branches — above the gate, above the
// counts. A reader who stops after one line still learns the numbers below it
// are not evidence. (setpiece.mjs:1107 is the house precedent for naming the
// broken file out loud; this names its owner too, so the fix is one hop away.)
const FAULT_OWNER = { "capsule_map.json": "mirror.mjs", "missions.json": "scout.mjs", "concepts.json": "capture.mjs", "course.json": "course.mjs", "learning_state.json": "learning_state.mjs" };
function faultLines(b) {
  const f = (b && b.input_faults) || [];
  if (!f.length) return [];
  const L = [`  ⚠ INPUT FAULT — unreadable JSON, NOT an empty file:`];
  for (const x of f) L.push(`     ${x.file} ${x.blocking ? "(BLOCKING — no counts, no regression claimed from it)" : "(non-blocking — display only)"} · owner ${FAULT_OWNER[x.file] || "?"} · ${x.why}`);
  return L;
}

function renderBenchmark(b) {
  const L = [];
  if (b.status === "gated_pre_audit") {
    L.push(`== THE BENCHMARK ==   GATED (pre-audit)`);
    L.push(...faultLines(b));
    L.push(`  ${b.gate.reason}`);
    L.push(`  ${b.gate.missions_line}`);
    return L.join("\n");
  }
  L.push(`== THE BENCHMARK ==   ${b.date} · have/need per bucket (counts + names — no scores, by law)`);
  L.push(...faultLines(b));
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
// selftest — fixtures, plus ONE disk-touching check in an OS temp dir (see the
// end-to-end gatherInputs assertion; 10 Aug 2026 — a fixture-only suite is
// structurally blind to "the reader never opened the file", which is the exact
// defect that lived here for two days). It never touches dressing-room/state.
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
  // learning_state.mjs:522's shape verbatim: skill_id → its LABEL, and a skill is
  // a KEY here only once it has a track:"skill" rep. Two of B5's seven and one of
  // B1's three, deliberately across all three rungs of the owner's ladder.
  const learningState = { python_fluency: { pydantic: "🟢 fluent", fastapi: "🟡 held", anthropic_api: "🔴 learning" } };
  const base = { dossier, registry, capsuleMap, rejirahRows, python, course, shipped, timeaudit, learningState };

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

  // THE PROJECTION REACHES THE THREE RENDERERS (10 Aug 2026 wiring pass).
  // These are the assertions that fail if the wire is cut again. Pre-10-Aug
  // manager.mjs:264, viz.mjs:310 and postmatch.mjs:177 each built
  // `${id} ${locked}/${core_total}` themselves, so B5 — concept_buckets: [] BY
  // DESIGN, its evidence being the shipped product — printed "B5 0/0" on the team
  // sheet, the wall and SEASON.md while its real evidence sat unread in have[].
  // consumerLine is those three call sites' shared expression, verbatim.
  const consumerLine = (bench) => (bench.buckets || []).map((x) => x.projection || `${x.id} ${x.counts.locked}/${x.counts.core_total}`).join(" · ");
  assert("WIRE — a bucket with NO concept core is never rendered as a count: basis names it, projection carries its own evidence",
    b5.counts.basis === "evidence_only"
    && !/\b0\/0\b/.test(b5.projection)
    && /shipped 2 commit\(s\)/.test(b5.projection) && /python not started/.test(b5.projection));
  assert("WIRE — the sheet/wall/SEASON.md line no longer says 'B5 0/0'; B5's shipped evidence arrives instead",
    !/B5 0\/0/.test(consumerLine(b)) && /B5 evidence-only — python not started, shipped 2 commit\(s\)/.test(consumerLine(b)));
  assert("WIRE — concept-cored buckets project BYTE-IDENTICALLY to the pre-wire expression (B1-B4 unchanged on every surface)",
    b.buckets.filter((x) => x.counts.basis === "concept_core").every((x) => x.projection === `${x.id} ${x.counts.locked}/${x.counts.core_total}`)
    && /^B1 1\/3 · B2 2\/4 · B3 0\/1 · B4 0\/1 · B5 /.test(consumerLine(b)));
  assert("WIRE — an old benchmark.json (no projection field) still renders exactly as it did (fallback path lives)",
    consumerLine({ buckets: [{ id: "B1", counts: { locked: 3, core_total: 8 } }] }) === "B1 3/8");

  // THE NEEDS REACH THE BUS (10 Aug 2026 wiring pass — this is the assertion
  // that fails if the wire is cut again). Pre-10-Aug the names lived only inside
  // buckets[].need and no organ read them, so the whole "what to DO" half of
  // this organ died in this file.
  assert("WIRE — needs[] carries the unlock NAMES, the course remainder and the python need onto the bus",
    Array.isArray(b.needs)
    && b.needs.some((n) => /2-rag: unlock chunking/.test(n))
    && b.needs.some((n) => /course: 2 chapters remain/.test(n))
    && b.needs.some((n) => /python: Phase A tiers/.test(n)));
  assert("WIRE — the shared 1-fundamentals neenv need is listed ONCE, not once per bucket (B1+B2 both produce it)",
    b.needs.filter((n) => /1-fundamentals: unlock inference/.test(n)).length === 1);
  assert("WIRE — the differentiators' unlocked names become needs (they exist NOWHERE else — buildBucket's need[] never sees them)",
    b.needs.some((n) => /6-cross-cut: unlock where_not_ai/.test(n))
    && b.needs.some((n) => /7-domain: unlock tds/.test(n))
    && b.buckets.every((bk) => !bk.need.some((n) => /cross-cut|7-domain/.test(n))));
  assert("WIRE — ROADMAP order, no ranking: B1's need precedes B2's, differentiators last",
    b.needs.findIndex((n) => /4-llm-api|1-fundamentals/.test(n)) < b.needs.findIndex((n) => /^2-rag/.test(n))
    && b.needs.findIndex((n) => /^2-rag/.test(n)) < b.needs.findIndex((n) => /^6-cross-cut/.test(n)));
  assert("WIRE — a GATED run ships no needs (Ruling 6: a half-lie never rides a surface)",
    gated.needs === undefined);

  // THE SKILLS LANE REACHES THE BUS (10 Aug 2026 wiring pass — these are the
  // assertions that fail if THIS wire is cut again). Pre-10-Aug the row was a
  // hardcoded string naming learning_state, a file gatherInputs never opened, so
  // all 12 skills were decoration and none could move a have/need line.
  assert("WIRE — the skills lane COUNTS from learning_state.python_fluency instead of printing a decorative string",
    b5.have.some((h) => /^skills: 2\/7 with reps — pydantic 🟢 fluent · fastapi 🟡 held/.test(h))
    && b1.have.some((h) => /^skills: 1\/3 with reps — anthropic_api 🔴 learning/.test(h)));
  assert("WIRE — the DEAD STRING cannot come back: no have-line claims a source this file does not open",
    !JSON.stringify(b).includes("fluency rides python_state/learning_state"));
  assert("WIRE — a skill with no rep becomes a NEED by name and reaches needs[] (the only half that says what to DO)",
    b5.need.some((n) => n === "B5 skills: no reps yet on python_basics, async, api_error_handling, parsers, react_ui")
    && b.needs.some((n) => /^B5 skills: no reps yet on python_basics/.test(n))
    && b.needs.some((n) => n === "B1 skills: no reps yet on prompt_engineering, streaming"));
  assert("WIRE — a skill below the owner's top rung is named fluency-pending (learning_state's ladder, never a bar invented here)",
    b.needs.some((n) => n === "B5 skills: fluency pending on fastapi 🟡 held")
    && !JSON.stringify(b.needs).includes("pending on pydantic"));
  assert("WIRE — B5's projection carries the skills lane to sheet/wall/SEASON.md, pre-wire head byte-stable",
    /B5 evidence-only — python not started, shipped 2 commit\(s\), skills 2\/7 with reps/.test(consumerLine(b))
    && b5.counts.skills_total === 7 && b5.counts.skills_with_reps === 2 && b5.counts.skills_read === true);
  assert("ABSENCE IS NOT A ZERO — no learning_state ⇒ fluency UNREAD, no count, and not one 'go do reps' need",
    (() => {
      const u = computeBenchmark({ ...base, learningState: null, missions: missionsOpen }, now, null);
      const u5 = u.buckets.find((x) => x.id === "B5");
      return u5.have.some((h) => /fluency UNREAD/.test(h)) && !u5.have.some((h) => /with reps/.test(h))
        && u5.counts.skills_read === false && u5.counts.skills_with_reps === null
        && !u.needs.some((n) => /skills: no reps yet/.test(n));
    })());
  // THE ONE ASSERTION THAT TOUCHES DISK, and the only one that can catch the
  // ORIGINAL defect. Everything above hands computeBenchmark a fixture — but the
  // bug was never in the compute, it was that gatherInputs read nine files and
  // learning_state.json was not one of them. A fixture cannot see that. So this
  // runs the REAL reader against a REAL directory: delete the line from
  // gatherInputs and this fails, which is the whole point of writing it.
  assert("WIRE (end-to-end) — gatherInputs actually OPENS learning_state.json off disk; a fixture-only test cannot catch this",
    (() => {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-bench-"));
      try {
        writeFileSync(join(tmp, "learning_state.json"), JSON.stringify({ python_fluency: { pydantic: "🟢 fluent" } }));
        const got = gatherInputs(tmp);
        // reads it, AND the read feeds the lane end-to-end (not just a parked field)
        const built = buildBucket(ROADMAP_BUCKETS.find((s) => s.id === "B5"), { ...base, ...got, heldMap: new Map() });
        // null-safe on purpose: a CUT wire must print a named ✗ here, not a
        // TypeError stack that the next reader mistakes for an unrelated crash.
        return got.learningState?.python_fluency?.pydantic === "🟢 fluent"
          && built.have.some((h) => /^skills: 1\/7 with reps — pydantic 🟢 fluent/.test(h));
      } finally { rmSync(tmp, { recursive: true, force: true }); }
    })());

  // DEAD-WIRE SWEEP (10 Aug 2026) — same disk seam, same reason: the wire is IN
  // gatherInputs, so only a real directory can prove it. A capsule_map that parses
  // fine while declaring one of its own capsules unreadable must arrive here as a
  // NAMED non-blocking fault (with mirror.mjs on it), and a complete one must add
  // no noise at all. Cut the four lines in gatherInputs and both halves fail.
  assert("WIRE (end-to-end) — a capsule_map declaring capsules_complete:false is NAMED off disk, non-blocking, owner mirror.mjs",
    (() => {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-bench-cap-"));
      try {
        writeFileSync(join(tmp, "capsule_map.json"), JSON.stringify({
          date: "2026-08-09", status: "ok", capsules_complete: false,
          blocking_faults: ["capsules/embeddings.json"],
          concepts: [{ concept: "tokenization", locked_on: "2026-06-15" }],
        }));
        const got = gatherInputs(tmp);
        const f = got.faults.find((x) => x.file === "capsule_map.json");
        const rendered = renderBenchmark(computeBenchmark({ ...base, ...got, missions: missionsOpen }, now, null));
        return !!f && f.blocking === false && /capsules\/embeddings\.json/.test(f.why) && /2026-08-09/.test(f.why)
          && /capsule_map\.json \(non-blocking[\s\S]*mirror\.mjs/.test(rendered);
      } finally { rmSync(tmp, { recursive: true, force: true }); }
    })());
  assert("WIRE — a COMPLETE capsule_map adds no fault noise (the healthy path is untouched)",
    (() => {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-bench-cap2-"));
      try {
        writeFileSync(join(tmp, "capsule_map.json"), JSON.stringify({ date: "2026-08-10", status: "ok", capsules_complete: true, concepts: [] }));
        return gatherInputs(tmp).faults.length === 0;
      } finally { rmSync(tmp, { recursive: true, force: true }); }
    })());

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

  // INPUT FAULTS (10 Aug 2026 wiring pass — the assertions that fail if this
  // wire is cut again). The scenario is the PROVEN one: capsule_map.json is
  // half-written, so readJsonTracked hands back null + a blocking fault; the
  // counts collapse to 0 exactly as they did on 8 Aug, and the ONLY thing that
  // must not happen is calling that collapse a loss.
  const faultCapsule = [{ file: "capsule_map.json", why: "Unexpected end of JSON input", blocking: true }];
  const bFault = computeBenchmark({ ...base, capsuleMap: null, faults: faultCapsule, missions: missionsOpen }, now, prevOk);
  assert("FAULT — a malformed capsule_map.json claims ZERO regressions (its 3→0 collapse is unreadable input, never a lost lock)",
    bFault.regressions.length === 0
    && bFault.buckets.find((x) => x.id === "B2").counts.locked === 0
    && findRegressionsLegacy(prevOk, bFault.buckets, bFault.course_covered).some((r) => /locked 2 → 0/.test(r)));
  assert("FAULT — the broken file is NAMED on the bus, blocking, with its parse error (a field that says a thing is missing)",
    bFault.input_faults.length === 1 && bFault.input_faults[0].file === "capsule_map.json"
    && /JSON/.test(bFault.input_faults[0].why) && bFault.blocking_faults.join() === "capsule_map.json");
  assert("FAULT — the render says it FIRST and names the owner (setpiece.mjs:1107 precedent), so no reader mistakes 0 for evidence",
    /INPUT FAULT[\s\S]*capsule_map\.json \(BLOCKING[\s\S]*mirror\.mjs/.test(renderBenchmark(bFault))
    && renderBenchmark(bFault).split("\n")[1].includes("INPUT FAULT"));
  assert("FAULT — a malformed missions.json is blocking too: it would read his own audit-close word as 'not yet staged'",
    computeBenchmark({ ...base, missions: null, faults: [{ file: "missions.json", why: "x", blocking: true }] }, now, prevOk)
      .blocking_faults.join() === "missions.json");
  assert("FAULT — a NON-blocking fault is named but never suppresses a true regression (display files are not evidence files)",
    (() => {
      const nb = computeBenchmark({ ...base, capsuleMap: shrunkMap, timeaudit: null, faults: [{ file: "timeaudit.json", why: "x", blocking: false }], missions: missionsOpen }, now, prevOk);
      return nb.blocking_faults.length === 0 && nb.input_faults.length === 1 && nb.regressions.some((r) => /locked 2 → 1/.test(r));
    })());
  assert("FAULT — ABSENT is not MALFORMED: a clean run carries input_faults [] on both the ok and the gated branch",
    Array.isArray(b.input_faults) && b.input_faults.length === 0
    && Array.isArray(gated.input_faults) && gated.input_faults.length === 0 && gated.blocking_faults.length === 0);
  assert("FAULT — the fault never becomes a captain card: it rides input_faults, NOT regressions (THE ANCHOR LAW — mirror.mjs owns the file, not him)",
    !JSON.stringify(bFault.regressions).includes("capsule_map"));
  assert("FAULT — a malformed learning_state.json is NAMED with its owner but is NOT blocking (it moves no compared count, by design)",
    (() => {
      const f = computeBenchmark({ ...base, learningState: null, faults: [{ file: "learning_state.json", why: "Unexpected token }", blocking: false }], missions: missionsOpen }, now, prevOk);
      return f.blocking_faults.length === 0 && f.input_faults[0].file === "learning_state.json"
        && /learning_state\.json \(non-blocking[\s\S]*learning_state\.mjs/.test(renderBenchmark(f));
    })());
  assert("NO SKILLS REGRESSION — python_fluency emptying (owner simply not recomputed yet) never claims he LOST a skill",
    computeBenchmark({ ...base, learningState: { python_fluency: {} }, missions: missionsOpen }, now, prevOk).regressions.length === 0);

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
// dir is a DEFAULTED parameter, not a new mode: main() still calls gatherInputs()
// and gets STATE_DIR exactly as before. It exists so the selftest can point the
// real reader at a real directory — the ORIGINAL defect here was that this
// function did not open learning_state.json at all, and a fixture-only test can
// never catch that (it hands computeBenchmark the input this function forgot).
function gatherInputs(dir = STATE_DIR) {
  // every JSON input reads through the tracker now: absent stays absent (no
  // fault, the have-lines already say so honestly), malformed gets NAMED.
  // rejirah_log.jsonl stays on readJsonl — it drops bad lines per line, which is
  // the right grammar for an append lane and loses no cumulative.
  const faults = [];
  const R = (name) => readJsonTracked(dir, name, faults);
  const capsuleMap = R("capsule_map.json");
  // DEAD-WIRE SWEEP, 10 Aug 2026 — the consumer half of capsule_bridge's own refusal.
  // readJsonTracked can tell "capsule_map.json is half-written" from "it is fine". It could
  // never tell "it is fine, but ONE OF ITS CAPSULES could not be read", because that
  // vanished silently one organ upstream (capsule_bridge's readJson empty-catch feeding
  // .filter(Boolean)) — a locked capsule dropped out of concepts[] with no name anywhere,
  // and conceptGroup's lockedSet then lost a "have" that this file states as evidence.
  // capsule_bridge now refuses to ship a short count: it keeps its LAST TRUE map and stamps
  // capsules_complete:false + blocking_faults on it. So by the time we read it the numbers
  // have NOT moved — lockedSet is the preserved one and findRegressions compares like with
  // like — which under this file's own derived rule (BLOCKING_INPUTS above: blocking = the
  // malformed-ness moves a number findRegressions compares, or the ship gate) makes this
  // NON-BLOCKING, display-only. Named anyway: a stale-but-true count read as today's is
  // just the quieter version of the same lie. Owner is already right in FAULT_OWNER —
  // mirror.mjs owns capsules/, and mirror.mjs is the one hop that fixes it.
  if (capsuleMap && capsuleMap.capsules_complete === false) {
    faults.push({ file: "capsule_map.json", blocking: false,
      why: `capsule_bridge refused to ship a short count — ${(capsuleMap.blocking_faults || []).join(", ") || "a capsule"} unreadable; locked counts below are ${capsuleMap.date || "an earlier run"}'s` });
  }
  return {
    dossier: R("dossier_weights.json"),
    registry: R("concepts.json"),
    capsuleMap,
    rejirahRows: readJsonl(join(dir, "rejirah_log.jsonl")),
    python: R("python_state.json"),
    course: R("course.json"),
    shipped: R("shipped.json"),
    timeaudit: R("timeaudit.json"),
    missions: R("missions.json"),
    // the skills lane's actual source (10 Aug 2026 wiring pass) — the file the
    // have-line has claimed to ride since 8 Aug and never opened. Non-blocking:
    // see skillsGroup's header for the derivation from this file's own rule.
    learningState: R("learning_state.json"),
    faults,
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
  // REFUSE TO SHIP A LIE (10 Aug 2026). A blocking fault means the numbers this
  // run computed are not evidence, so they never reach the bus: the LAST TRUE
  // record is preserved verbatim — its own date, its own counts, its own runs[]
  // — and only the fault fields are stamped on top. Nothing is fabricated and
  // nothing true is lost. Three consequences are deliberate:
  //   · runs[] does not grow, so the ≥2×/week outward floor readers that already
  //     exist (learnstate.mjs:110 · watchman.mjs:238) start surfacing on their
  //     own — no new organ needed to notice this.
  //   · `date` stays yesterday's, so a stale read is visibly stale.
  //   · no prev ⇒ we write NOTHING. Absence is already handled honestly
  //     downstream (manager.mjs:1024 asserts "absence, not a zero").
  // Exit stays 0 on purpose: both shell callers (forge_session.mjs's lock-chain,
  // scout.mjs refreshBenchmark) are fail-silent by design and PIPE stdio, so a
  // non-zero exit would turn a named fault back into an anonymous "skipped".
  // The WARN is the FIRST console line, and it also SELF-NAMES (`benchmark: …`).
  // Either one is now enough: forge_session.mjs's lock-chain door (chainReport)
  // keeps every self-named line and falls back to line 1 for organs that name none.
  // (10 Aug 2026 — it used to print ONLY `out.trim().split("\n")[0]`, which is why
  // this line was placed first; the placement stays, the single point of failure goes.)
  if (b.blocking_faults.length) {
    console.log(`benchmark: WARN ${b.blocking_faults.join(", ")} MALFORMED (unreadable JSON, not empty) — refusing to overwrite ${prev ? "the last true benchmark" : "anything"}; no counts, no regression claimed. Fix the file (owner: ${b.blocking_faults.map((f) => FAULT_OWNER[f] || "?").join(", ")}).`);
    for (const f of b.input_faults) console.log(`  ${f.file}: ${f.why}`);
    if (prev) {
      writeAtomic(OUT, { ...prev, input_faults: b.input_faults, blocking_faults: b.blocking_faults, last_attempt_at: now.toISOString() });
      console.log(`  kept: ${prev.date || "?"}'s record verbatim (runs[] frozen at ${((prev.runs) || []).length}) → ${OUT}`);
    } else console.log(`  no prior benchmark to keep — nothing written (absence, not a zero).`);
    return;
  }
  writeAtomic(OUT, b);
  if (b.status === "gated_pre_audit") console.log(`benchmark: GATED (pre-audit) — ${b.gate.missions_line} → ${OUT}`);
  // The need rides the FIRST console line on purpose: forge_session.mjs's
  // lock-chain runs this very command at step 10 of every lock and prints ONE line
  // per self-named `benchmark: …` line (chainReport, repaired 10 Aug 2026; before
  // that it was line 1 only, so a second line was swallowed outright). Keeping the
  // need on this line keeps it in his terminal either way. First need +
  // a count of the rest — the same brevity learnstate.mjs:114 already uses for
  // regressions[0]. Not a ranking (see flattenNeeds): first in ROADMAP order.
  else console.log(`benchmark: ok · ${b.buckets.length} buckets · regressions ${b.regressions.length} · run #${b.runs.length}${b.needs.length ? ` · need: ${b.needs[0]}${b.needs.length > 1 ? ` (+${b.needs.length - 1} more — benchmark.mjs report)` : ""}` : ""} → ${OUT}`);
  // non-blocking faults still get said out loud, below the summary line so the
  // lock-chain's first-line read is untouched. Named on the console AND on the
  // bus (input_faults) — a fault nobody can see is the defect we just fixed.
  for (const f of b.input_faults) console.log(`  ⚠ ${f.file} MALFORMED (non-blocking — display only, owner ${FAULT_OWNER[f.file] || "?"}): ${f.why}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeBenchmark, renderBenchmark, roundsLine, conceptGroup, heldColdByConcept, findRegressions, flattenNeeds, gateState, ROADMAP_BUCKETS };
