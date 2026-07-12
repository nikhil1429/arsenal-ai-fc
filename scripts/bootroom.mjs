#!/usr/bin/env node
// ============================================================================
// bootroom.mjs · ARSENAL AI FC — THE ORGANISM: THE BOOT ROOM (the genome)
// ----------------------------------------------------------------------------
// WHAT:  Self-evolution as a first-class organ (THE_ORGANISM §VI). The FORGE
//        method lives as versioned DATA (forge_profile.json); it mutates one
//        pre-registered, evidence-gated, auto-reverting, captain-approved gene
//        at a time, and writes its own SEASON_CHANGELOG — progress-discounting
//        medicine you can read.
// PIPELINE (strictly AI-proposes · code-validates · human-approves):
//   propose  — deterministic evidence assembly ONLY (per-axis lapse counts at
//              checkpoint ages from reps_log + fsrs_store); emits a mutation
//              iff the metric's min_events volume exists TODAY, else the
//              honest no-op line. LLM may WORD a proposal overnight; it never
//              originates evidence.
//   validate — schema + bounds + WHITELIST: target must resolve into
//              forge_profile.json. Medical rules, ladder_config, the
//              Goalkeeper, and the honest frame are constitutionally OUTSIDE
//              the genome — hard reject.
//   approve  — the captain's mouth, via CLI ("haan, chalao"). SERIAL LAW:
//              one live mutation at a time, no exceptions. Old value moves
//              into legacy{} verbatim (layering, never replace).
//   score    — at review_after_days: metric recomputed; if event volume <
//              min_events the window AUTO-EXTENDS (a mutation judged on five
//              events is a coin flip); else KEPT or AUTO-REVERTED by its own
//              revert_diff.
//   record   — one human-readable line in SEASON_CHANGELOG.md.
//
// INPUT:  forge_profile.json (canon, THIS organ's sole write target) ·
//         mutations.jsonl (own ledger) · reps_log.jsonl · fsrs_store.json ·
//         loop_vitals.json (speak-gate)
// OUTPUT: forge_profile.json · mutations.jsonl · SEASON_CHANGELOG.md (root)
// MODES:  run (default: propose-if-Sunday + score-matured) · propose ·
//         validate <id> · approve <id> · score · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const STATE_DIR = join(REPO_ROOT, "dressing-room", "state");
const PROFILE   = join(STATE_DIR, "forge_profile.json");
const MUTS      = join(STATE_DIR, "mutations.jsonl");
const CHANGELOG = join(REPO_ROOT, "SEASON_CHANGELOG.md");

// the genome's whitelist is the profile itself; these are FOREVER OUTSIDE it.
const FORBIDDEN = /medical|ladder|goalkeeper|governor|oura|readiness|honest|doctor|verdict/i;

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// dot-path resolution inside the profile (the whitelist IS the profile keys)
function resolvePath(profile, target) {
  const parts = String(target || "").split(".");
  let node = profile;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node || typeof node !== "object" || !(parts[i] in node)) return null;
    node = node[parts[i]];
  }
  const leaf = parts[parts.length - 1];
  if (!node || typeof node !== "object" || !(leaf in node)) return null;
  return { node, leaf };
}

// ---------------------------------------------------------------------------
// VALIDATE — schema + bounds + whitelist
// ---------------------------------------------------------------------------
function validateMutation(m, profile) {
  const errs = [];
  for (const f of ["id", "target", "diff", "evidence", "predicted_effect", "metric", "review_after_days", "revert_diff"])
    if (m[f] === undefined || m[f] === null) errs.push(`missing field: ${f}`);
  if (errs.length) return { ok: false, errs };
  if (FORBIDDEN.test(m.target) || FORBIDDEN.test(JSON.stringify(m.diff)))
    errs.push("FORBIDDEN — medical rules, the ladder, the Goalkeeper, and the honest frame are constitutionally outside the genome");
  if (!resolvePath(profile, m.target)) errs.push(`target does not resolve into forge_profile.json: ${m.target}`);
  if (!Array.isArray(m.evidence) || m.evidence.length === 0) errs.push("evidence must be non-empty (rep-refs, not vibes)");
  if (!m.metric || typeof m.metric.name !== "string" || typeof m.metric.min_events !== "number")
    errs.push("metric must carry {name, min_events, window_days}");
  if (typeof m.review_after_days !== "number" || m.review_after_days < 7) errs.push("review_after_days must be ≥7");
  return { ok: errs.length === 0, errs };
}

// ---------------------------------------------------------------------------
// APPROVE — serial law + legacy{} preservation
// ---------------------------------------------------------------------------
function approveMutation(m, profile, muts, now = new Date()) {
  if (muts.some(x => x.status === "live" && x.id !== m.id))
    return { ok: false, err: "SERIAL LAW — one live mutation at a time; score the live one first" };
  const v = validateMutation(m, profile);
  if (!v.ok) return { ok: false, err: v.errs.join("; ") };
  const spot = resolvePath(profile, m.target);
  const oldValue = spot.node[spot.leaf];
  profile.legacy = profile.legacy || {};
  profile.legacy[`${m.target}@${localDate(now)}`] = JSON.parse(JSON.stringify(oldValue));  // verbatim, layering law
  spot.node[spot.leaf] = m.diff.new;
  profile.version = String(profile.version || "1.0") + "+" + m.id;
  return { ok: true, profile, mutation: { ...m, status: "live", approved_on: localDate(now), old_value: oldValue } };
}

// ---------------------------------------------------------------------------
// SCORE — volume-gated; KEPT or AUTO-REVERTED
// ---------------------------------------------------------------------------
function scoreMutation(m, profile, metricValue, eventCount, now = new Date()) {
  const age = Math.round((now - new Date(m.approved_on)) / 86400000);
  if (age < m.review_after_days) return { action: "waiting", m };
  if (eventCount < m.metric.min_events)
    return { action: "extended", m: { ...m, review_after_days: m.review_after_days + 7, extended: (m.extended || 0) + 1 } };
  const improved = typeof m.metric.improves_when_below === "number"
    ? metricValue < m.metric.improves_when_below
    : metricValue === true;
  if (improved) return { action: "kept", m: { ...m, status: "kept", scored_on: localDate(now), outcome: metricValue } };
  // AUTO-REVERT by its own revert_diff
  const spot = resolvePath(profile, m.target);
  if (spot) spot.node[spot.leaf] = m.revert_diff.new;
  return { action: "reverted", m: { ...m, status: "reverted", scored_on: localDate(now), outcome: metricValue }, profile };
}

// ---------------------------------------------------------------------------
// PROPOSE — deterministic evidence assembly (Sunday's filing)
// ---------------------------------------------------------------------------
function proposeFromEvidence(reps, profile, gateOpen, now = new Date()) {
  if (!gateOpen) return { proposal: null, reason: "speak-gate closed (volume) — no proposal, honestly" };
  // Evidence: per-axis lapse counts at the late checkpoint (post 14d). This is
  // the APNI GHADI seed: his own clock replacing [3d/2wk/6wk].
  const lapsesByAxis = {};
  const seen = {};
  for (const r of reps) {
    if (r.track !== "concept" || !r.axis) continue;
    const k = r.concept;
    if (seen[k] && !r.correct && (r.confidence === "knew" || r.confidence === "shaky")) {
      const ageDays = (new Date(r.ts) - new Date(seen[k])) / 86400000;
      if (ageDays >= 14) lapsesByAxis[r.axis] = (lapsesByAxis[r.axis] || 0) + 1;
    }
    if (r.correct && !seen[k]) seen[k] = r.ts;
  }
  const worst = Object.entries(lapsesByAxis).sort((a, b) => b[1] - a[1])[0];
  if (!worst || worst[1] < 5) return { proposal: null, reason: "no axis shows ≥5 late-checkpoint lapses — nothing to propose" };
  const [axis, n] = worst;
  const cur = profile.rejirah_intervals_days || [3, 14, 42];
  return {
    proposal: {
      id: `mut-${localDate(now)}-axis${axis}`,
      target: "rejirah_intervals_days",
      diff: { old: cur, new: [cur[0], Math.max(7, Math.round(cur[1] * 0.75)), Math.max(21, Math.round(cur[2] * 0.66))] },
      evidence: [`${n} late-checkpoint lapses on axis-${axis} (≥14d after first correct)`],
      predicted_effect: `axis-${axis} late-lapse rate falls`,
      metric: { name: `axis_${axis}_late_lapse_count`, min_events: 20, window_days: 21, improves_when_below: Math.ceil(n / 2) },
      review_after_days: 21,
      revert_diff: { new: cur },
      status: "proposed", proposed_on: localDate(now),
    },
    reason: null,
  };
}

function changelogLine(m, beat) {
  return `Beat ${beat}: ${m.target} ${JSON.stringify(m.diff.old ?? m.old_value)} → ${JSON.stringify(m.diff.new)}. ` +
    `Evidence: ${m.evidence.join("; ")}. ` +
    (m.status === "kept" ? `Day-${m.review_after_days} outcome: ${JSON.stringify(m.outcome)}. KEPT.` :
     m.status === "reverted" ? `Day-${m.review_after_days} outcome: ${JSON.stringify(m.outcome)}. AUTO-REVERTED.` :
     `Status: ${m.status.toUpperCase()}.`);
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 12, 22, 0, 0);
  const profile = () => ({ version: "1.0", rejirah_intervals_days: [3, 14, 42], axis_weights: { a: 1, e: 1 }, interleave_confusables: true, legacy: {} });
  const mut = () => ({
    id: "mut-1", target: "rejirah_intervals_days",
    diff: { old: [3, 14, 42], new: [3, 10, 28] },
    evidence: ["9/11 lapses axis-f at 6wk"], predicted_effect: "axis-f lapse falls",
    metric: { name: "axis_f_late_lapse_count", min_events: 20, window_days: 21, improves_when_below: 5 },
    review_after_days: 21, revert_diff: { new: [3, 14, 42] }, status: "proposed",
  });

  // VALIDATE
  assert("valid mutation validates", validateMutation(mut(), profile()).ok);
  assert("WHITELIST — medical/ladder targets hard-rejected", !validateMutation({ ...mut(), target: "medical.red_threshold" }, profile()).ok);
  assert("WHITELIST — diff smuggling forbidden words rejected", !validateMutation({ ...mut(), diff: { new: "loosen goalkeeper RED" } }, profile()).ok);
  assert("unknown target rejected (must resolve into profile)", !validateMutation({ ...mut(), target: "no.such.key" }, profile()).ok);
  assert("empty evidence rejected (rep-refs, not vibes)", !validateMutation({ ...mut(), evidence: [] }, profile()).ok);

  // APPROVE + serial law + legacy
  const p1 = profile();
  const a1 = approveMutation(mut(), p1, [], now);
  assert("approve applies diff", a1.ok && p1.rejirah_intervals_days[1] === 10);
  assert("LAYERING — old value preserved verbatim in legacy{}", JSON.stringify(Object.values(p1.legacy)[0]) === JSON.stringify([3, 14, 42]));
  const a2 = approveMutation({ ...mut(), id: "mut-2" }, p1, [a1.mutation], now);
  assert("SERIAL LAW — second live mutation rejected", a2.ok === false && /SERIAL/.test(a2.err));

  // SCORE: waiting / extended / kept / reverted
  const live = { ...a1.mutation, approved_on: "2026-06-15" };
  assert("young mutation waits", scoreMutation({ ...live, approved_on: localDate(now) }, p1, 3, 100, now).action === "waiting");
  const ext = scoreMutation(live, p1, 3, 5, now);
  assert("VOLUME GATE — thin events auto-extends window", ext.action === "extended" && ext.m.review_after_days === 28);
  const kept = scoreMutation(live, p1, 3, 100, now);
  assert("metric improved ⇒ KEPT", kept.action === "kept");
  const p2 = profile();
  const a3 = approveMutation(mut(), p2, [], new Date(2026, 5, 15));
  const rev = scoreMutation({ ...a3.mutation, approved_on: "2026-06-15" }, p2, 9, 100, now);
  assert("metric failed ⇒ AUTO-REVERTED by its own revert_diff", rev.action === "reverted" && p2.rejirah_intervals_days[1] === 14);

  // PROPOSE: gated + evidence-driven
  const gateClosed = proposeFromEvidence([], profile(), false, now);
  assert("speak-gate closed ⇒ honest no-proposal line", gateClosed.proposal === null && /gate/.test(gateClosed.reason));
  const reps = [];
  for (let i = 0; i < 8; i++) {
    reps.push({ ts: "2026-05-01T10:00:00Z", track: "concept", concept: "c" + i, axis: "e", correct: true, confidence: "knew" });
    reps.push({ ts: "2026-06-01T10:00:00Z", track: "concept", concept: "c" + i, axis: "e", correct: false, confidence: "knew" });
  }
  const prop = proposeFromEvidence(reps, profile(), true, now);
  assert("evidence-driven proposal emitted (axis-e late lapses)", prop.proposal && prop.proposal.evidence[0].includes("axis-e"));
  assert("proposal carries revert_diff + volume-gated metric", Array.isArray(prop.proposal.revert_diff.new) && prop.proposal.metric.min_events >= 20);
  assert("proposal validates against its own profile", validateMutation(prop.proposal, profile()).ok);
  const thin = proposeFromEvidence(reps.slice(0, 6), profile(), true, now);
  assert("thin evidence ⇒ no proposal", thin.proposal === null);

  // changelog line
  const line = changelogLine(kept.m, 1);
  assert("changelog line human-readable with outcome", /Beat 1:/.test(line) && /KEPT/.test(line));

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
  const now = new Date();
  const profile = readJson(PROFILE);
  if (!profile) { console.log(`bootroom: forge_profile.json missing — genome absent, nothing to do → ${PROFILE}`); return; }
  const muts = readLines(MUTS);
  const vitals = readJson(join(STATE_DIR, "loop_vitals.json"));
  const gateOpen = !!(vitals && vitals.speak_gates && vitals.speak_gates.bootroom_mutation);
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));

  if (mode === "propose" || (mode === "run" && now.getDay() === 0)) {
    const { proposal, reason } = proposeFromEvidence(reps, profile, gateOpen, now);
    if (proposal) {
      if (!muts.some(m => m.id === proposal.id)) {
        appendFileSync(MUTS, JSON.stringify(proposal) + "\n");
        console.log(`bootroom: proposal ${proposal.id} filed — awaiting the captain's "haan, chalao" → ${MUTS}`);
      } else console.log(`bootroom: proposal ${proposal.id} already filed`);
    } else console.log(`bootroom: ${reason}`);
    if (mode === "propose") return;
  }

  if (mode === "approve") {
    const id = process.argv[3];
    const m = muts.find(x => x.id === id && x.status === "proposed");
    if (!m) { console.log(`bootroom: no proposed mutation with id ${id}`); process.exit(1); }
    const res = approveMutation(m, profile, muts, now);
    if (!res.ok) { console.log(`bootroom: REJECTED — ${res.err}`); process.exit(1); }
    writeAtomic(PROFILE, res.profile);
    writeAtomic(MUTS, muts.map(x => JSON.stringify(x.id === id ? res.mutation : x)).join("\n") + "\n");
    appendFileSync(CHANGELOG, changelogLine(res.mutation, muts.filter(x => x.status !== "proposed").length + 1) + "\n");
    console.log(`bootroom: ${id} LIVE — old value frozen in legacy{}, review in ${m.review_after_days}d → ${PROFILE}`);
    return;
  }

  if (mode === "validate") {
    const id = process.argv[3];
    const m = muts.find(x => x.id === id);
    if (!m) { console.log(`bootroom: no mutation ${id}`); process.exit(1); }
    const v = validateMutation(m, profile);
    console.log(v.ok ? `bootroom: ${id} valid` : `bootroom: ${id} INVALID — ${v.errs.join("; ")}`);
    process.exit(v.ok ? 0 : 1);
  }

  // score matured live mutations (run + score modes)
  const live = muts.find(m => m.status === "live");
  if (live) {
    // metric v0: late-lapse count on the named axis within the window
    const axis = (live.metric.name.match(/axis_(\w)_/) || [])[1] || null;
    let count = 0, events = 0;
    if (axis) {
      const seen = {};
      for (const r of reps) {
        if (r.track !== "concept" || r.axis !== axis) continue;
        events++;
        if (seen[r.concept] && !r.correct && (r.confidence === "knew" || r.confidence === "shaky")) {
          if ((new Date(r.ts) - new Date(seen[r.concept])) / 86400000 >= 14) count++;
        }
        if (r.correct && !seen[r.concept]) seen[r.concept] = r.ts;
      }
    }
    const res = scoreMutation(live, profile, count, events, now);
    if (res.action !== "waiting") {
      if (res.action === "reverted") writeAtomic(PROFILE, profile);
      writeAtomic(MUTS, muts.map(x => JSON.stringify(x.id === live.id ? res.m : x)).join("\n") + "\n");
      if (res.action !== "extended") appendFileSync(CHANGELOG, changelogLine(res.m, muts.filter(x => ["kept", "reverted"].includes(x.status)).length + 1) + "\n");
      console.log(`bootroom: ${live.id} ${res.action.toUpperCase()}`);
    } else console.log(`bootroom: ${live.id} live, review pending`);
  } else if (mode === "score") console.log("bootroom: no live mutation to score");
  if (mode === "run" && now.getDay() !== 0 && !live) console.log("bootroom: quiet day — no live mutation, proposals file on Sundays");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateMutation, approveMutation, scoreMutation, proposeFromEvidence, changelogLine, resolvePath };
