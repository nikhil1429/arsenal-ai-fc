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
//        rejirah_log.jsonl (ABSENT on this machine — see THE COLD-RE-PROOF LANE;
//        its read-state now rides the output instead of a fabricated zero) ·
//        python_state.json · course.json · shipped.json ·
//        timeaudit.json · missions.json · learning_state.json (the skills lane —
//        added 10 Aug 2026; the have-line had named it since 8 Aug and this file
//        never opened it. See THE SKILLS LANE above buildBucket.)
// INPUT FAULTS (wiring pass, 10 Aug 2026 — see BLOCKING_INPUTS below): a
//        half-written input can no longer be mistaken for evidence he lost.
// OUTPUT: dressing-room/state/benchmark.json (sole writer)
// MODES:  run (default) · preview · report · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process"; // selftest ONLY — spawns THIS file to prove a main()-only wire (precedent: manager.mjs:43)
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_BENCH_STATE_DIR is the selftest's seam and nothing else's (house
// pattern: captains_call ARSENAL_CALL_STATE_DIR, outwork ARSENAL_OUTWORK_STATE_DIR).
const STATE_DIR = process.env.ARSENAL_BENCH_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const OUT = join(STATE_DIR, "benchmark.json");

// KEPT, BUT NO LONGER CALLED (dead-wire sweep, 11 Aug 2026). Its last two callers were
// main()'s reads of our OWN benchmark.json, and that silent null was the whole defect —
// see BLOCKING_INPUTS. Frozen here verbatim rather than deleted (LAYERING) because the
// comments below explain the fault line by reference to it. If you reach for it for a new
// input, don't: readJsonTracked is the standard every input in this file is held to.
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
// benchmark.json (dead-wire sweep, 11 Aug 2026): OUR OWN prior record was the one
// input this file did not hold to the rule above — main() read it with the plain
// readJson() at both call sites, so a half-written one came back prev=null and was
// indistinguishable from "never run". Run the rule on it and it is BLOCKING twice
// over: prev IS the number findRegressions() compares against (a null prev makes
// findRegressionsLegacy return [] outright), and prev.runs is the ≥2×/week outward
// ledger the floor readers count (learnstate.mjs · watchman.mjs). PROVEN live 11 Aug
// through the ARSENAL_BENCH_STATE_DIR seam: two clean runs → runs[] 2 entries;
// truncated benchmark.json to half its bytes and dropped a lock from capsule_map in
// the same breath; the next `run` printed `benchmark: ok · … run #1` and wrote
// runs[]=1, regressions [], input_faults [] — the ledger restarted from scratch, a
// REAL B2 locked 1 → 0 swallowed, and nothing anywhere named the file. It is the only
// entry here that gatherInputs never reads (its R() has no benchmark.json call); it
// rides this set so the blocking rule lives in ONE place, not two.
const BLOCKING_INPUTS = new Set(["capsule_map.json", "concepts.json", "course.json", "missions.json", "benchmark.json"]);
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

// ---------------------------------------------------------------------------
// THE COLD-RE-PROOF LANE — wired 11 Aug 2026 (dead-wire sweep)
// ---------------------------------------------------------------------------
// THE DEFECT: `held_cold` rode rejirah_log.jsonl and NOTHING ELSE, and that file has
// never existed on this machine — `ls dressing-room/state/rejirah_log.jsonl` → no such
// file, `git log --all -- <path>` → empty, and rejirah.mjs:934 measures and says so
// itself. So heldColdByConcept() returned an EMPTY MAP on every run, every locked
// capsule read "cold re-proof 0", and two of the fifteen live needs were arithmetic on
// a file that is not there — with no field anywhere naming the absence. The skills lane
// ONE FUNCTION AWAY (skillsGroup, below) already refuses this exact shape: source absent
// ⇒ read:false ⇒ NO count claimed. That house rule (viz.mjs:314, "absence is not a
// zero") was applied to learning_state.json and not to this.
//
// TWO SOURCES, TWO DIFFERENT FACTS — deliberately NOT merged into one number:
//   · rejirah_log.jsonl = MEASURED GRADES. result:"held", cold not false. It is the only
//     thing in the organism that can say an AXIS HELD. Absent ⇒ unmeasured, never zero.
//   · capsule_map.json  = THE MASTER RECORD, and it has been in this file's hands since
//     8 Aug (gatherInputs reads it for lockedSet). capsule_bridge projects the capsule's
//     own `reJirahDone` — his gist paste, the canonical proof a round was SAT — into
//     rejirah.rounds_done. Live today: tokenization 2, context/embeddings/inference 0.
// A closed round is NOT a clean hold (rejirah.mjs buildCloseRow carries `forced`, and
// fsrs.mjs's audit-#108 scar is precisely what happens when a close is read as a pass),
// so rounds_done may NEVER be counted as held_cold. It answers the OTHER question — and
// it is the one the need line was actually asking: has this locked capsule been
// re-proofed AT ALL? That answer is measurable right now, and it was wrong: benchmark
// has been sending him back to Re-Jirah tokenization, which he re-proofed twice.
// UNKNOWN, NOT ZERO, HERE TOO: a capsule_map entry with no `rejirah` block (a map
// written before capsule-bridge-v1) yields null for that concept, and one null unreads
// the whole group — the same refusal, applied to this lane's own source.
function roundsSatByConcept(capsuleMap) {
  const m = new Map();
  for (const c of ((capsuleMap && capsuleMap.concepts) || [])) {
    const n = c && c.rejirah && c.rejirah.rounds_done;
    if (c && c.concept && Number.isInteger(n)) m.set(c.concept, n);
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

// coldRead defaults FALSE — the conservative default, because a caller that says
// nothing about rejirah_log.jsonl has not read it, and this function may not invent a
// measurement on its behalf. The arithmetic below is byte-for-byte what it was; the two
// lanes gain a read-state beside their count, nothing more (see THE COLD-RE-PROOF LANE).
function conceptGroup(bucketId, note, registry, capsuleMap, heldMap, coldRead = false) {
  const core = Object.entries((registry && registry.concepts) || {})
    .filter(([, v]) => v.bucket === bucketId && v.core).map(([k]) => k);
  const lockedSet = new Set(((capsuleMap && capsuleMap.concepts) || []).filter((c) => c.locked_on).map((c) => c.concept));
  const locked = core.filter((c) => lockedSet.has(c));
  const held = locked.filter((c) => (heldMap.get(c) || 0) > 0);
  const satMap = roundsSatByConcept(capsuleMap);
  // one unknown unreads the group: a partial count would be a positive claim built
  // on the concepts that happened to carry the block.
  const roundsRead = locked.every((c) => satMap.has(c));
  const sat = locked.filter((c) => (satMap.get(c) || 0) > 0);
  return {
    bucket: bucketId, note: note || null,
    core_total: core.length, locked: locked.length,
    held_cold: coldRead ? held.length : null, cold_read: coldRead,
    rounds_sat: roundsRead ? sat.length : null, rounds_read: roundsRead,
    // the names behind the rounds count — "counts + names only" is this organ's
    // whole product, and the need line below is the only half that says what to DO.
    never_sat_names: roundsRead ? locked.filter((c) => !(satMap.get(c) > 0)) : [],
    locked_names: locked, unlocked_names: core.filter((c) => !lockedSet.has(c)),
  };
}
const groupLine = (g) => {
  const parts = [
    `${g.bucket}${g.note ? ` (${g.note})` : ""}: locked ${g.locked}/${g.core_total}`,
    g.cold_read ? `cold re-proof ${g.held_cold}/${g.locked || 0}`
      : "cold re-proof UNMEASURED (rejirah_log.jsonl absent — rejirah.mjs owns it; no count claimed)",
  ];
  // the rounds lane speaks only where there IS something to re-proof. With nothing
  // locked the question has no subject, and this same string is the differentiators'
  // grammar too (differentiators_line, wired earlier today) — both of those sit at
  // locked 0/1 and would otherwise carry a parenthetical tail about an empty set,
  // immediately before their DOSSIER-weight parens. Measured-path bytes for a
  // 0-locked group are therefore exactly what they were before this lane existed.
  if (g.locked > 0) parts.push(g.rounds_read
    ? `Re-Jirah rounds sat ${g.rounds_sat}/${g.locked} (capsule reJirahDone)`
    : "rounds sat UNREAD (capsule_map carries no rejirah block — capsule_bridge.mjs owns it)");
  return parts.join(" · ");
};

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
  const { registry, capsuleMap, heldMap, coldRead, dossier, python, course, shipped, timeaudit, learningState } = inputs;
  const groups = spec.concept_buckets.map((cb) => conceptGroup(cb.id, cb.note, registry, capsuleMap, heldMap, coldRead));
  const have = [], need = [];
  // evidence[] — the SHORT form of the have[] rows that are not concept-locks.
  // Same values, same sources; it exists so the projection line below can carry
  // real evidence off this file instead of only counts. (10 Aug 2026 wiring pass.)
  const evidence = [];
  for (const g of groups) {
    have.push(groupLine(g));
    if (g.unlocked_names.length) need.push(`${g.bucket}: unlock ${g.unlocked_names.join(", ")}`);
    // NEEDS RIDE THE MEASURED LANE (11 Aug 2026). The second line is byte-identical to
    // the one that shipped 8 Aug — it is now GATED on cold_read, by the skills lane's
    // own rule two screens down: "we never tell him to go do reps on the strength of a
    // file we could not open". Since rejirah_log.jsonl has never existed, that line has
    // never once been evidence, so the first line takes over the question it was really
    // asking, from the source that CAN answer it today (capsule reJirahDone). Both stay:
    // the day he runs `rejirah.mjs grade`, the graded half starts speaking again beside it.
    if (g.rounds_read && g.never_sat_names.length)
      need.push(`${g.bucket}: Re-Jirah never sat on ${g.never_sat_names.join(", ")} (${g.never_sat_names.length} of ${g.locked} locked)`);
    if (g.cold_read && g.locked > g.held_cold) need.push(`${g.bucket}: cold re-proof pending on ${g.locked - g.held_cold} locked (Re-Jirah)`);
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
  // read-states first: they decide whether the two lanes below are a count or a null.
  // every() on an empty groups[] is vacuously true, which is right — B5 has no concept
  // core by design, so its 0 here is the same STRUCTURAL zero `basis` already names.
  const coldLaneRead = groups.every((g) => g.cold_read);
  const roundsLaneRead = groups.every((g) => g.rounds_read);
  const counts = {
    locked: groups.reduce((a, g) => a + g.locked, 0),
    // null, not 0, when unmeasured (11 Aug 2026) — a consumer reading counts alone must
    // not be able to render "0 cold re-proofs" out of a file that does not exist.
    held_cold: coldLaneRead ? groups.reduce((a, g) => a + g.held_cold, 0) : null,
    cold_read: coldLaneRead,
    // the lane that CAN be counted today, from capsule_map's reJirahDone projection.
    rounds_sat: roundsLaneRead ? groups.reduce((a, g) => a + g.rounds_sat, 0) : null,
    rounds_read: roundsLaneRead,
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
    // same two shapes as buildBucket's loop, same gating (11 Aug 2026) — the
    // differentiators' needs exist ONLY here, so an ungated line here is an unmeasured
    // claim reaching the kickoff brief with nothing above it to qualify it.
    if (d.rounds_read && d.never_sat_names && d.never_sat_names.length)
      out.push(`${d.bucket}: Re-Jirah never sat on ${d.never_sat_names.join(", ")} (${d.never_sat_names.length} of ${d.locked} locked)`);
    if (d.cold_read && d.locked > d.held_cold) out.push(`${d.bucket}: cold re-proof pending on ${d.locked - d.held_cold} locked (Re-Jirah)`);
  }
  return out;
}

// THE HAVES, FLATTENED — the OTHER half of a have/need organ (dead-wire sweep,
// 11 Aug 2026, same shape as the two orphans found earlier today). needs[] was
// wired 10 Aug and `have[]` was left exactly where it was: `grep -rn "\.have\b"
// --include=*.mjs scripts/` returns bootroom.mjs's unrelated `gate.have` and
// nothing else, so every have row died inside renderBenchmark() — and nothing
// shells `report` (forge_session:1652 and scout's wire both shell `run`).
// WHAT WAS ACTUALLY LOST, once the gate opens: the surfaces carry `projection`
// (`B1 3/8`), so the LOCKED half of a concept group escapes — but the cold
// re-proof and rounds-sat halves of groupLine() do not, and the whole skills
// lane on B1/B3/B4, the course line and the Building% line have no other door
// at all (evidence[] is read only for evidence-only buckets, and Building is not
// even in it). The asymmetry is the tell: the two DIFFERENTIATORS have shipped
// their full groupLine to the sheet since this morning (differentiators_line,
// manager.mjs:337) while the five ROADMAP buckets — his actual syllabus — ship a
// bare locked/core.
// SAME LAWS AS flattenNeeds, one screen up: ROADMAP order, NOT a ranking; no cap
// and no sort (a "top 3" here is the invented priority his 1 Aug rule forbids);
// rows VERBATIM, so one have-grammar exists in the organism and `report` and the
// sheet can never word the same fact differently.
// DEDUPE BY IDENTICAL STRING, and it bites LESS here than in flattenNeeds — a
// need is `${bucket}: unlock …` and B1's and B2's shared 1-fundamentals group
// collides into one row, but a have is groupLine, which carries the bucket's
// NOTE, and those two notes are different sentences on purpose ("neenv — shared
// with B2" / "… with B1", :127/:130). So the shared group rides twice, each row
// naming its sibling. Deliberately NOT merged: picking one note over the other
// is a choice this file has no basis for, and rewording them into a third
// sentence would invent a second have-grammar. The numbers are identical by
// construction and there is an assertion holding them that way.
// DIFFERENTIATORS ARE DELIBERATELY NOT RE-LISTED HERE — unlike their needs,
// which existed nowhere else, their have IS already wired as differentiators_line
// to the same consumer; appending them would print the identical string twice on
// one sheet. If that field is ever dropped, they belong back in this function.
// NO NEW NUMBERS: every row is a string buildBucket already composed above.
function flattenHaves(buckets) {
  const out = [];
  for (const b of buckets || []) for (const h of (b.have || [])) if (!out.includes(h)) out.push(h);
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
// AMENDED 11 Aug 2026 (dead-wire sweep) — two changes, both about provenance:
//   1. A cold-held claim is DROPPED unless BOTH runs measured the lane. The frozen
//      engine above compares with `<`, and in JS `null < 3` is TRUE (null coerces to 0),
//      so the first run after rejirah_log.jsonl appears and then goes missing again
//      would announce "cold-held 3 → null" at his anchor. That is absence read as a
//      loss — the exact failure the blockingFiles guard exists for, arriving by a
//      different door. Filtered by EXACT string, rebuilt from the same template the
//      legacy engine uses, so no other regression line can be caught by accident.
//   2. rounds_sat JOINS the comparison, because held_cold has never been ABLE to fire —
//      its producer has never run (see THE COLD-RE-PROOF LANE), which left this engine
//      with one working half out of two. rounds_sat is a counted cumulative off
//      capsule_map.json, already BLOCKING here, so a malformed map still claims nothing.
//      A drop means a `reJirahDone` date vanished from the gist mirror — a real loss of
//      counted evidence, named under this engine's own stated rule (any decrease, no
//      threshold), in the same grammar as `locked`.
function findRegressions(prev, buckets, courseCovered, blockingFiles = []) {
  if (blockingFiles.length) return [];
  const legacy = findRegressionsLegacy(prev, buckets, courseCovered);
  if (!prev || prev.status !== "ok" || !Array.isArray(prev.buckets)) return legacy;
  const prevBy = new Map(prev.buckets.map((b) => [b.id, b]));
  const drop = new Set(), added = [];
  for (const b of buckets) {
    const p = prevBy.get(b.id);
    if (!p || !p.counts) continue;
    if (typeof b.counts.held_cold !== "number" || typeof p.counts.held_cold !== "number")
      drop.add(`${b.id} ${b.label}: cold-held ${p.counts.held_cold} → ${b.counts.held_cold}`);
    if (typeof b.counts.rounds_sat === "number" && typeof p.counts.rounds_sat === "number"
      && b.counts.rounds_sat < p.counts.rounds_sat)
      added.push(`${b.id} ${b.label}: Re-Jirah rounds sat ${p.counts.rounds_sat} → ${b.counts.rounds_sat}`);
  }
  return [...legacy.filter((l) => !drop.has(l)), ...added];
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
  // rejirahRead is gatherInputs' existsSync answer, carried explicitly rather than
  // inferred from an empty rejirahRows[] — readJsonl() returns [] for "not there" and
  // for "there and empty" alike, and telling those apart is the whole repair.
  const coldRead = !!inputs.rejirahRead;
  const buckets = ROADMAP_BUCKETS.map((spec) => buildBucket(spec, { ...inputs, heldMap, coldRead }));
  const differentiators = DIFFERENTIATOR_BUCKETS.map((cb) => {
    const g = conceptGroup(cb.id, null, inputs.registry, inputs.capsuleMap, heldMap, coldRead);
    return { ...g, rounds_line: roundsLine([cb.id], inputs.dossier) };
  });
  // THE DIFFERENTIATORS' LINE (11 Aug 2026 dead-wire sweep) — composed HERE, by
  // the owner, for exactly the reason `projection` is (:320). `differentiators[]`
  // was written to the bus on every ok run and read by NOTHING:
  // `grep -rn "differentiators" --include=*.mjs scripts/` returned this file and
  // no other, because all four renderers map over `bj.buckets` alone
  // (manager.mjs:328 · viz.mjs:316 · postmatch.mjs:192 · learnstate.mjs:117-160).
  // Only their unlock NAMES ever escaped, through flattenNeeds — so he could be
  // told "unlock where_not_ai" and never be shown that the #1 senior signal
  // stands at 0/1 while riding 46.7% of the interview. renderBenchmark:552 did
  // print the whole block, but nothing shells `report` (the lock-chain and
  // scout's wire both shell `run`), so it died in this file. Same shape as the
  // two orphans found earlier today: built, present, not wired.
  // GRAMMAR: groupLine(d) verbatim — the identical string `report` prints — so
  // ONE differentiator grammar exists in the organism, and the rounds_line in
  // PARENS because the DOSSIER weight is the whole reason these two ride at all.
  // Parens and not another " · " separator: the round arithmetic already speaks
  // in " + " and a flat join left "0/1 · rides…" ambiguous about whose weight it is.
  // NOT A 6TH BUCKET (:133 — his ROADMAP has five): they stay out of buckets[],
  // the label says so out loud, and a consumer mapping over buckets sees exactly
  // what it saw before this field existed.
  // NO NEW NUMBERS: every count and every % here is already computed above.
  // STILL NOT REGRESSION-TRACKED, deliberately: findRegressionsLegacy compares
  // prev.buckets only, so a differentiator that LOSES a lock is silent. That is a
  // second wire and it ends in a captain card (captains_call.mjs:352) — a lane
  // that reaches him is not opened in a sweep like this one. Named here so it is
  // not lost.
  const differentiatorsLine = differentiators.length
    ? `differentiators (not a 6th bucket — the #1 senior signal + the fintech moat): ${differentiators.map((d) => `${groupLine(d)} (${d.rounds_line})`).join(" · ")}`
    : null;
  const courseCovered = inputs.course && Array.isArray(inputs.course.chapters) ? inputs.course.chapters.filter((c) => c.covered).length : 0;
  const regressions = findRegressions(prev, buckets, courseCovered, blockingFiles);
  return {
    date: localDate(now), status: "ok",
    gate: { reason: null, missions_line: gate.line },
    input_faults: faults, blocking_faults: blockingFiles,
    buckets, differentiators, differentiators_line: differentiatorsLine, course_covered: courseCovered,
    // needs = the flat, ROADMAP-ordered union of every need[] plus the
    // differentiators' own (10 Aug 2026 wiring pass). It exists because the
    // per-bucket need[] reached no reader — see flattenNeeds. Consumers render
    // from THIS so the kickoff brief, the team sheet, the wall and SEASON.md
    // cannot drift into four different wordings of the same debt.
    needs: flattenNeeds(buckets, differentiators),
    // haves = the same flattening for the half that says what he ALREADY HOLDS
    // (11 Aug 2026 dead-wire sweep — see flattenHaves). Sits beside needs[] on
    // purpose: a consumer that renders one and not the other is showing him a
    // debt column with no credit column, which is what every surface did.
    haves: flattenHaves(buckets),
    regressions,
    runs: [...runs, now.toISOString()],
    generated_at: now.toISOString(),
  };
}

// The fault block prints FIRST and on both branches — above the gate, above the
// counts. A reader who stops after one line still learns the numbers below it
// are not evidence. (setpiece.mjs:1107 is the house precedent for naming the
// broken file out loud; this names its owner too, so the fix is one hop away.)
// benchmark.json's owner is this file itself (sole writer, declared in the header) —
// which is exactly why the one-hop fix it names is "delete or restore it", not "go
// nudge another organ". Added 11 Aug 2026 with the prev-read repair.
const FAULT_OWNER = { "capsule_map.json": "mirror.mjs", "missions.json": "scout.mjs", "concepts.json": "capture.mjs", "course.json": "course.mjs", "learning_state.json": "learning_state.mjs", "benchmark.json": "benchmark.mjs (this file — restore or delete it)" };
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
  // rejirahRead: true — this fixture HANDS the reader rows, so it is stating that the
  // log was there to read. The absent case is its own fixture below (THE COLD-RE-PROOF
  // LANE); keeping the flag explicit here is what stops an empty [] ever standing in
  // for a missing file again.
  const base = { dossier, registry, capsuleMap, rejirahRows, rejirahRead: true, python, course, shipped, timeaudit, learningState };

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

  // THE DIFFERENTIATORS REACH THE THREE RENDERERS (11 Aug 2026 dead-wire sweep —
  // these fail if THAT wire is cut again). Pre-today `differentiators[]` was on
  // the bus and read by nothing: manager/viz/postmatch all map over buckets[],
  // so the two lanes carrying 46.7% and 44.5% of the interview had a standing
  // nowhere. consumerDx is those three call sites' shared expression, verbatim.
  const consumerDx = (bench) => bench.differentiators_line || null;
  assert("WIRE — differentiators_line puts BOTH lanes' counts AND their DOSSIER weight on the bus (report printed them; nothing shells report)",
    typeof consumerDx(b) === "string"
    && consumerDx(b).startsWith("differentiators (not a 6th bucket — the #1 senior signal + the fintech moat): ")
    // counts + weights only. The cold/rounds lanes inside groupLine are pinned by
    // their OWN assertions above and by the groupLine-verbatim check below; naming
    // their wording twice would make this test fail on an honest edit one lane over.
    && /6-cross-cut: locked 0\/1\b/.test(consumerDx(b)) && /\(rides: [^)]*= 46\.7% of the interview\)/.test(consumerDx(b))
    && /7-domain: locked 0\/1\b/.test(consumerDx(b)) && /\(rides: [^)]*= 44\.5% of the interview\)/.test(consumerDx(b)));
  assert("WIRE — the line is groupLine's grammar VERBATIM (one differentiator grammar in the organism; report:639 and the surfaces cannot drift)",
    b.differentiators.every((d) => consumerDx(b).includes(`${groupLine(d)} (${d.rounds_line})`)));
  assert("WIRE — they ride BESIDE the buckets, never inside them (his ROADMAP has FIVE — a 6th bucket is the one thing this must never become)",
    b.buckets.length === 5 && !b.buckets.some((x) => /cross-cut|7-domain/.test(x.id))
    && !/\bB[1-5]\b/.test(consumerDx(b)));
  assert("WIRE — a GATED run ships no differentiators line (Ruling 6: a half-lie never rides a surface)",
    gated.differentiators_line === undefined && !gated.differentiators);

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

  // THE HAVES REACH THE BUS (11 Aug 2026 dead-wire sweep — these fail if THIS
  // wire is cut again). needs[] was wired 10 Aug and have[] was not: it had zero
  // readers in the organism (`grep -rn "\.have\b" --include=*.mjs scripts/` →
  // bootroom's unrelated gate.have and nothing else), and nothing shells `report`,
  // so the CREDIT half of a have/need organ died in this file while the debt half
  // rode four surfaces. consumerHave is the sheet's and SEASON.md's shared
  // expression, verbatim (manager.mjs:348 · postmatch.mjs:200).
  const consumerHave = (bench) => ((bench.haves || []).length ? bench.haves.join(" · ") : null);
  assert("WIRE — haves[] carries the credit half onto the bus: skills WITH reps, chapters covered, Building%",
    Array.isArray(b.haves)
    && b.haves.some((h) => /^skills: 1\/3 with reps — anthropic_api 🔴 learning/.test(h))
    && b.haves.some((h) => /course "Anthropic API Fundamentals": 1\/3 chapters covered/.test(h))
    && b.haves.some((h) => /Building time \(single-day snapshot 2026-08-07\): 0\.7% of active/.test(h)));
  assert("WIRE — the five ROADMAP buckets' cold-re-proof lane reaches a surface at last (the differentiators' groupLine shipped this morning; the buckets' did not)",
    /2-rag: locked 1\/2 · cold re-proof 1\/1/.test(consumerHave(b)));
  // THE POINT OF THE WHOLE REPAIR, stated as arithmetic: these three facts exist
  // in NO other field on the bus. If a later pass moves one into projection or
  // needs, this assertion is the thing that says so out loud instead of leaving
  // the same string on two surfaces.
  assert("WIRE — projection + needs genuinely cannot carry these: the counted forms appear nowhere else on the bus",
    (() => {
      const elsewhere = `${consumerLine(b)} · ${b.needs.join(" · ")}`;
      return !/skills: 1\/3 with reps/.test(elsewhere)
        && !/chapters covered/.test(elsewhere)
        && !/single-day snapshot/.test(elsewhere)
        && !/cold re-proof \d+\/\d+/.test(elsewhere);
    })());
  assert("WIRE — rows are buildBucket's have[] VERBATIM (one have-grammar: `report` and the sheet can never word the same fact differently)",
    b.buckets.every((bk) => bk.have.every((h) => b.haves.includes(h))));
  // The shared group is the one place where haves and needs legitimately differ.
  // A need is `${bucket}: unlock …` — no note — so B1's and B2's collide and
  // dedupe to one row. A have is groupLine, which carries the NOTE, and the two
  // notes are different sentences by design ("shared with B2" / "shared with B1",
  // :127/:130). Both rows therefore survive, and that is correct: each says which
  // sibling it is shared with. What must never differ is the arithmetic — the same
  // group measured twice on one surface is only safe while the numbers are equal.
  assert("WIRE — the shared 1-fundamentals group rides once per owning bucket, each naming its sharer, with IDENTICAL counts (never two readings of one group)",
    (() => {
      const rows = b.haves.filter((h) => /^1-fundamentals \(neenv/.test(h));
      return rows.length === 2
        && rows.some((h) => /shared with B2/.test(h)) && rows.some((h) => /shared with B1/.test(h))
        && new Set(rows.map((h) => h.replace(/ \(neenv[^)]*\)/, ""))).size === 1;
    })());
  assert("WIRE — ROADMAP order, no ranking and no cap: B1's rows precede B2's, and every row survives",
    b.haves.findIndex((h) => /^1-fundamentals/.test(h)) < b.haves.findIndex((h) => /^2-rag/.test(h))
    && b.haves.length === new Set(b.buckets.flatMap((bk) => bk.have)).size);
  assert("WIRE — the differentiators are NOT re-listed here (differentiators_line already ships them; twice on one sheet is noise)",
    !b.haves.some((h) => /^6-cross-cut|^7-domain/.test(h)));
  assert("WIRE — a GATED run ships no haves (Ruling 6: a half-lie never rides a surface)",
    gated.haves === undefined);
  assert("WIRE — an old benchmark.json (no haves field) renders NOTHING, never an empty row (absence, not a zero)",
    consumerHave({ buckets: [{ id: "B1", have: ["x"] }] }) === null && consumerHave({ haves: [] }) === null);

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
  // THE COLD-RE-PROOF LANE (dead-wire sweep, 11 Aug 2026 — these are the assertions
  // that fail if THIS wire is cut again). Pre-11-Aug `held_cold` rode rejirah_log.jsonl
  // and nothing else; that file has never existed on this machine, so every locked
  // capsule read "cold re-proof 0", two of the fifteen live needs were arithmetic on a
  // missing file, and NOTHING in the output named the absence.
  const capsWithRounds = { concepts: [
    // capsule_bridge's own shape (capsule_map.json, rejirah.rounds_done) and his own
    // live numbers: tokenization carries reJirahDone ["2026-06-18","2026-06-29"].
    { concept: "tokenization", locked_on: "2026-06-15", rejirah: { rounds_done: 2 } },
    { concept: "embeddings", locked_on: "2026-06-21", rejirah: { rounds_done: 0 } },
  ] };
  const noLog = computeBenchmark({ ...base, rejirahRead: false, capsuleMap: capsWithRounds, missions: missionsOpen }, now, null);
  const n1 = noLog.buckets.find((x) => x.id === "B1"), n2 = noLog.buckets.find((x) => x.id === "B2");
  assert("ABSENCE IS NOT A ZERO — no rejirah_log.jsonl ⇒ cold re-proof UNMEASURED, counts null, and not one 'cold re-proof pending' need",
    n1.have.some((h) => /cold re-proof UNMEASURED \(rejirah_log\.jsonl absent — rejirah\.mjs/.test(h))
    && !JSON.stringify(noLog.buckets).includes("cold re-proof 0")
    && n1.counts.held_cold === null && n1.counts.cold_read === false
    && !noLog.needs.some((n) => /cold re-proof pending/.test(n)));
  assert("WIRE — the re-proof question is answered from capsule_map's reJirahDone projection instead, and tokenization (2 rounds sat) is NO LONGER sent back to Re-Jirah",
    n1.have.some((h) => /1-fundamentals[^:]*: locked 1\/2 · cold re-proof UNMEASURED[^·]+· Re-Jirah rounds sat 1\/1 \(capsule reJirahDone\)/.test(h))
    && n1.counts.rounds_sat === 1 && n1.counts.rounds_read === true
    && !JSON.stringify(noLog.needs).includes("never sat on tokenization")
    && noLog.needs.some((n) => n === "2-rag: Re-Jirah never sat on embeddings (1 of 1 locked)")
    // the group line, not B2's counts: B2 sums 2-rag (0 sat) AND the shared
    // 1-fundamentals neenv (1 sat) — the ROADMAP's own sharing, :64/:67.
    && n2.have.some((h) => /2-rag: locked 1\/2 · cold re-proof UNMEASURED[^·]+· Re-Jirah rounds sat 0\/1/.test(h)));
  assert("UNKNOWN IS NOT ZERO EITHER — a capsule_map with no rejirah block unreads the rounds lane, claims no count and files no need",
    (() => {
      const u = computeBenchmark({ ...base, rejirahRead: false, missions: missionsOpen }, now, null);
      const u2 = u.buckets.find((x) => x.id === "B2");
      return u2.have.some((h) => /rounds sat UNREAD \(capsule_map carries no rejirah block — capsule_bridge\.mjs/.test(h))
        && u2.counts.rounds_sat === null && u2.counts.rounds_read === false
        && !JSON.stringify(u.needs).includes("Re-Jirah never sat");
    })());
  assert("REGRESSION GUARD — an unmeasured cold lane is never a loss claim (`null < 1` is TRUE in JS: the frozen engine says 'cold-held 1 → null', the guard drops exactly that line)",
    (() => {
      const prevCold = computeBenchmark({ ...base, capsuleMap: capsWithRounds, missions: missionsOpen }, now, null);
      const gone = computeBenchmark({ ...base, rejirahRead: false, capsuleMap: capsWithRounds, missions: missionsOpen }, now, prevCold);
      return findRegressionsLegacy(prevCold, gone.buckets, gone.course_covered).some((r) => /cold-held 1 → null/.test(r))
        && !JSON.stringify(gone.regressions).includes("cold-held");
    })());
  assert("REGRESSION — the half of this engine that CAN fire now does: a reJirahDone date vanishing from the mirror is named (any decrease, no threshold)",
    (() => {
      const prevSat = computeBenchmark({ ...base, capsuleMap: capsWithRounds, missions: missionsOpen }, now, null);
      const lost = { concepts: capsWithRounds.concepts.map((c) => ({ ...c, rejirah: { rounds_done: 0 } })) };
      const r = computeBenchmark({ ...base, capsuleMap: lost, missions: missionsOpen }, now, prevSat);
      return r.regressions.some((x) => /^B1 .*: Re-Jirah rounds sat 1 → 0$/.test(x))
        && !r.regressions.some((x) => /rounds sat 0 → 0/.test(x));
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
  // THE COLD LANE'S DISK SEAM (11 Aug 2026). Same reason as the two above: the wire is
  // IN gatherInputs — it is an existsSync question, and no fixture can ask it. Delete
  // the `rejirahRead:` line and the first half fails; stop passing it into
  // computeBenchmark and the second half fails; both halves are the defect verbatim.
  assert("WIRE (end-to-end) — gatherInputs asks disk whether rejirah_log.jsonl IS THERE, and the answer reaches the have-line both ways",
    (() => {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-bench-cold-"));
      try {
        writeFileSync(join(tmp, "concepts.json"), JSON.stringify(registry));
        writeFileSync(join(tmp, "capsule_map.json"), JSON.stringify({ date: "2026-08-11", status: "ok", capsules_complete: true, concepts: capsWithRounds.concepts }));
        const absent = gatherInputs(tmp);                       // the machine as it stands today
        writeFileSync(join(tmp, "rejirah_log.jsonl"), JSON.stringify({ concept: "tokenization", axis: "a", result: "held", gut: "shaky", cold: true, ts: "2026-08-07T10:00:00Z" }) + "\n");
        const present = gatherInputs(tmp);                      // the day he first runs `rejirah.mjs grade`
        const b1Have = (got) => buildBucket(ROADMAP_BUCKETS.find((s) => s.id === "B1"),
          { ...base, ...got, heldMap: heldColdByConcept(got.rejirahRows), coldRead: !!got.rejirahRead }).have;
        // null-safe reads, same house reason as the learning_state seam above: a CUT
        // wire must print a named ✗, not a TypeError the next reader misattributes.
        return absent.rejirahRead === false && present.rejirahRead === true
          && b1Have(absent).some((h) => /1-fundamentals[^:]*: locked 1\/2 · cold re-proof UNMEASURED[^·]+· Re-Jirah rounds sat 1\/1/.test(h))
          && b1Have(present).some((h) => /1-fundamentals[^:]*: locked 1\/2 · cold re-proof 1\/1 · Re-Jirah rounds sat 1\/1/.test(h));
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
  // THE LOCK-CHAIN DOOR (dead-wire sweep, 11 Aug 2026 — fails the moment this wire
  // is cut again). Source-read, following scout.mjs:626 / dugout.mjs:2589: the thing
  // under test is a console.log template in main(), which no pure function returns.
  // The door is forge_session.mjs's chainReport — "keep every line the organ SELF-NAMES,
  // else line 1" — so a fault line that does not start `benchmark:` is dropped at step 10
  // of every lock and he is told `benchmark: ok` over a stale count. Both halves asserted:
  // the template self-names, and a door-shaped filter (chainReport's exact predicate,
  // re-stated here so this file needs no import of another organ) keeps it.
  {
    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const softLog = (SRC.match(/console\.log\(`[^`]*MALFORMED \(non-blocking[^`]*`\)/) || [])[0] || "";
    assert("LOCK-CHAIN DOOR — the NON-blocking fault line SELF-NAMES, so chainReport cannot drop it (it did, silently, 10-11 Aug)",
      /console\.log\(`benchmark: /.test(softLog));
    const emitted = [
      `benchmark: ok · 5 buckets · regressions 0 · run #12 → x`,
      `benchmark: ⚠ capsule_map.json MALFORMED (non-blocking — display only, owner mirror.mjs): capsule_bridge refused to ship a short count`,
    ];
    const doorKeeps = emitted.map((l) => l.trim()).filter((l) => l.toLowerCase().startsWith("benchmark:"));
    assert("LOCK-CHAIN DOOR — both lines reach his terminal: the summary AND the stale-count warning beneath it",
      doorKeeps.length === 2 && /stale|short count|MALFORMED/.test(doorKeeps[1]));
  }

  // OUR OWN PRIOR RECORD (dead-wire sweep, 11 Aug 2026). Two halves, because the wire
  // has two ends: the pure half proves a benchmark.json fault behaves like every other
  // blocking one, and the CLI half proves main() actually GENERATES that fault — which
  // is where it was cut. Fixtures alone could never catch this: computeBenchmark was
  // always innocent, main() simply never told it the file was broken (precedent for
  // spawning THIS file to prove a main()-only guard: manager.mjs:1447, examiner.mjs:40).
  assert("PREV — a malformed benchmark.json is BLOCKING, named with its owner, and claims no loss",
    (() => {
      const f = computeBenchmark({ ...base, faults: [{ file: "benchmark.json", why: "Unexpected end of JSON input", blocking: BLOCKING_INPUTS.has("benchmark.json") }], missions: missionsOpen }, now, null);
      return f.blocking_faults.join() === "benchmark.json" && f.regressions.length === 0
        && /benchmark\.json \(BLOCKING[\s\S]*benchmark\.mjs \(this file/.test(renderBenchmark(f));
    })());
  assert("PREV (end-to-end, real CLI) — a half-written benchmark.json does NOT restart runs[], does NOT swallow a real locked-drop in silence, and `report` never calls it 'never run'",
    (() => {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-bench-prev-"));
      const env = { ...process.env, ARSENAL_BENCH_STATE_DIR: tmp };
      const self = fileURLToPath(import.meta.url);
      const run = (mode) => { try { return String(execFileSync(process.execPath, [self, mode], { env, stdio: "pipe" })); } catch (e) { return String((e && e.stdout) || ""); } };
      try {
        writeFileSync(join(tmp, "missions.json"), JSON.stringify({ missions: [], syllabus_audit: { closed_at: "2026-08-10T00:00:00.000Z", note: "selftest fixture — not his word" } }));
        writeFileSync(join(tmp, "concepts.json"), JSON.stringify({ concepts: [{ id: "tokenization", bucket: "1-fundamentals" }, { id: "embeddings", bucket: "2-rag" }] }));
        const twoLocks = { date: "2026-08-10", status: "ok", capsules_complete: true, concepts: [{ concept: "tokenization", locked_on: "2026-06-15" }, { concept: "embeddings", locked_on: "2026-06-20" }] };
        writeFileSync(join(tmp, "capsule_map.json"), JSON.stringify(twoLocks));
        run("run"); run("run");
        const out = join(tmp, "benchmark.json");
        const before = readFileSync(out, "utf8");
        if (JSON.parse(before).runs.length !== 2) return false; // the ledger this defect wiped
        // half-write it, and drop a REAL lock in the same breath: the swallowed regression
        // is what made the wipe dangerous rather than merely untidy.
        writeFileSync(out, before.slice(0, Math.floor(before.length / 2)));
        writeFileSync(join(tmp, "capsule_map.json"), JSON.stringify({ ...twoLocks, date: "2026-08-11", concepts: [twoLocks.concepts[0]] }));
        const ran = run("run");
        const after = readFileSync(out, "utf8");
        const rep = run("report");
        return after === before.slice(0, Math.floor(before.length / 2))       // untouched — no wipe, no overwrite of the bytes
          && /^benchmark: WARN/m.test(ran) && /benchmark\.json/.test(ran)     // self-named, so chainReport carries it at step 10
          && !/benchmark: ok/.test(ran) && !/run #1/.test(ran)                // never the cheerful lie this defect printed
          // anchored, not a substring search: the honest line QUOTES the old lie
          // (`… NOT "never run" …`), so a loose /never run/ fails on the repair itself.
          // What must never come back is the whole-output claim `benchmark: never run`.
          && !/^benchmark: never run/m.test(rep) && /MALFORMED/.test(rep);     // report tells the truth about an unreadable file
      } finally { rmSync(tmp, { recursive: true, force: true }); }
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
    // THE READ-STATE, not the rows (11 Aug 2026 dead-wire sweep). readJsonl above hands
    // back [] whether the file is missing or merely empty, and that [] became a zero on
    // every have-line and two needs. existsSync is the only thing that can separate the
    // two — the same seam fsrs.mjs:190 already uses on this exact file, for this exact
    // reason. rejirah.mjs is its single writer; today it has never run, so this is false.
    rejirahRead: existsSync(join(dir, "rejirah_log.jsonl")),
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
  // OUR OWN PRIOR STATE READS THROUGH THE TRACKER TOO (dead-wire sweep, 11 Aug 2026).
  // See BLOCKING_INPUTS' benchmark.json note for the proof and the derivation. Both
  // call sites below used the bare readJson(), which cannot tell "never run" from
  // "half-written" — the single standard this file applies to every other input and
  // not to itself.
  const prevFaults = [];
  const prev = readJsonTracked(STATE_DIR, "benchmark.json", prevFaults);
  const prevUnreadable = prevFaults.length > 0;
  if (mode === "report") {
    // "never run" was a LIE on a malformed file, and the quietest kind: the reader
    // goes and runs it, which is precisely the run that restarts the ledger.
    if (prev) console.log(renderBenchmark(prev));
    else if (prevUnreadable) console.log(`benchmark: WARN benchmark.json MALFORMED (unreadable JSON, not absent — NOT "never run"): ${prevFaults[0].why}. Owner ${FAULT_OWNER["benchmark.json"]}; runs[] and the last true counts are inside it, so restore it before the next run rather than after.`);
    else console.log("benchmark: never run — node scripts/benchmark.mjs run");
    return;
  }
  // the prev fault joins the input faults on the SAME array gatherInputs built, so it
  // reaches computeBenchmark's input_faults/blocking_faults with no second channel.
  const inputs = gatherInputs();
  inputs.faults.push(...prevFaults);
  const b = computeBenchmark(inputs, now, prev);
  if (mode === "preview") {
    if (b.status === "gated_pre_audit") {
      // preview computes what run refuses to ship — same inputs, forced open,
      // console-only, loudly labelled. The bus never sees it. (11 Aug 2026: reuses
      // `inputs` instead of re-gathering, so the prev fault above is still named in
      // the preview render — a re-gather dropped it and re-read ten files for nothing.)
      const forced = computeBenchmark({ ...inputs, missions: { missions: [], syllabus_audit: { closed_at: "preview", note: "PREVIEW — not his word" } } }, now, null);
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
    } else if (prevUnreadable) console.log(`  benchmark.json IS the unreadable one — left byte-for-byte untouched (an overwrite here is the exact wipe this branch exists to prevent: it would restart runs[] at 1 and bury whatever counts are still recoverable in those bytes). Recovers by itself on the next run once the file is valid JSON or gone.`);
    else console.log(`  no prior benchmark to keep — nothing written (absence, not a zero).`);
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
  // non-blocking faults still get said out loud, below the summary line. Named on
  // the console AND on the bus (input_faults) — a fault nobody can see is the defect
  // we just fixed.
  // …except it WAS still invisible where it matters most (dead-wire sweep, 11 Aug 2026).
  // This line was written indented and unnamed on purpose, to protect a first-line-only
  // door that no longer exists: the SAME 10 Aug pass repaired forge_session's chainReport
  // to keep every line an organ SELF-NAMES (`<name>: …`) and fall back to line 1 only for
  // organs that name none. So the lock chain — the one place a fault is read seconds after
  // he locks a capsule — dropped this line and printed a clean `benchmark: ok`, while the
  // warning survived only on a bus field with no reader. Self-naming is the whole fix; the
  // door needs no change, and its "believe all of it" rule now carries this through.
  // The BLOCKING branch above stays as it is: its headline (`benchmark: WARN …`) already
  // self-names AND already lists every broken file with its owner, so the door carries the
  // finding; only the per-file parse-error detail stays indented, which is detail, not news.
  for (const f of b.input_faults) console.log(`benchmark: ⚠ ${f.file} MALFORMED (non-blocking — display only, owner ${FAULT_OWNER[f.file] || "?"}): ${f.why}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeBenchmark, renderBenchmark, roundsLine, conceptGroup, heldColdByConcept, findRegressions, flattenNeeds, gateState, ROADMAP_BUCKETS };
