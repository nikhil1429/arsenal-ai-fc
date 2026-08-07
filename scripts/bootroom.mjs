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
// ORGANISM AUDIT #98 — the Boot Room's entire weekly output was a console.log
// into a `cmd /c` window that closes. \ArsenalFC-BootRoom has no `>> …log 2>&1`
// redirect (unlike Calibration/FSRS/Nemesis/LearningState/Goalkeeper), so "did
// the genome run this week?" was unanswerable, and /organism-doctor read
// `Last Result: 0` and called it green. Every run now leaves one line here.
// This does NOT duplicate loop_vitals: the gate STATE is already there, but
// these two branches exist nowhere else once the window closes —
//   · proposeFromEvidence's gate-OPEN-but-no-evidence reason (the only record
//     that the genome looked and found nothing), and
//   · `extended` (mutations.jsonl keeps the bumped review_after_days, but the
//     ANNOUNCEMENT that a window was extended, and why, had no home).
// Address: physio.mjs reads the last line into loop_vitals.genome, which the
// matchday skill and the brain's job inputs already open.
const RUNLOG    = join(STATE_DIR, "bootroom_log.jsonl");

// THE EVIDENCE BAR — pre-existing value, UNCHANGED (it was the bare literal `5`
// at the old line 151). Named so it can be surfaced as a have/need counter
// instead of hiding inside a sentence, per the captain's standing order that a
// threshold must be visible next to the number it is judging.
const MIN_LATE_LAPSES = 5;

// the genome's whitelist is the profile itself; these are FOREVER OUTSIDE it.
const FORBIDDEN = /medical|ladder|goalkeeper|governor|oura|readiness|honest|doctor|verdict/i;

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
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
// ORGANISM AUDIT #102/#106 — THE UNGATE. The two silent branches below used to
// publish a verdict with the count filed off: "speak-gate closed (volume)" and
// "no axis shows ≥5 late-checkpoint lapses". Both now carry have/need, so the
// captain reads the climb instead of a wall. `gate` is optional and defaults to
// null — main() supplies {have, need} from the SAME physio_config.json key that
// physio.mjs:375 used to decide `gateOpen`, so there is exactly one number and
// nobody guesses a second one. NO GATE IS LOWERED by any of this.
// RULING 5 (outward loop, 8 Aug 2026): teaching evidence feeds method mutations.
// The teaching contract's top drift-ranked rule rides a proposal as CONTEXT
// evidence — it informs the captain's haan/na; it never ORIGINATES a mutation
// (the lapse-count metric stays the only basis; AI-proposes law intact).
function topDrift(contract) {
  const rules = contract && Array.isArray(contract.rules) ? contract.rules : [];
  const ranked = rules
    .map((r) => ({ id: r.id, n: (Number(r.hits) || 0) + (Number(r.auto_hits) || 0) }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  return ranked[0] || null;
}

function proposeFromEvidence(reps, profile, gateOpen, now = new Date(), gate = null, teaching = null) {
  if (!gateOpen) {
    const counter = (gate && Number.isFinite(gate.have) && Number.isFinite(gate.need))
      ? `${gate.have}/${gate.need} reps` : `${reps.length} rep(s) — threshold unreadable`;
    return { proposal: null, reason: `${counter} — the genome is listening, not proposing yet (speak-gate on volume)`,
      counter: { have: gate && Number.isFinite(gate.have) ? gate.have : reps.length, need: gate ? gate.need : null, kind: "volume_gate" } };
  }
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
  if (!worst || worst[1] < MIN_LATE_LAPSES) {
    // THE GATE-OPEN-BUT-NO-EVIDENCE BRANCH (#98). This is one of exactly two
    // states whose information existed nowhere but the vanished console — the
    // genome looked, and found nothing worth mutating. It is persisted now.
    const have = worst ? worst[1] : 0;
    const where = worst ? `worst axis (${worst[0]})` : "no axis has any";
    return { proposal: null,
      reason: `${where} shows ${have}/${MIN_LATE_LAPSES} late-checkpoint lapses — the genome looked and found nothing to propose`,
      counter: { have, need: MIN_LATE_LAPSES, kind: "evidence_bar", axis: worst ? worst[0] : null } };
  }
  const [axis, n] = worst;
  const cur = profile.rejirah_intervals_days || [3, 14, 42];
  return {
    proposal: {
      id: `mut-${localDate(now)}-axis${axis}`,
      target: "rejirah_intervals_days",
      diff: { old: cur, new: [cur[0], Math.max(7, Math.round(cur[1] * 0.75)), Math.max(21, Math.round(cur[2] * 0.66))] },
      evidence: [`${n} late-checkpoint lapses on axis-${axis} (≥14d after first correct)`,
        ...(teaching ? [`teaching-drift CONTEXT (Ruling 5): rule "${teaching.id}" drifted ${teaching.n}× — context for his haan/na, never the basis`] : [])],
      predicted_effect: `axis-${axis} late-lapse rate falls`,
      metric: { name: `axis_${axis}_late_lapse_count`, min_events: 20, window_days: 21, improves_when_below: Math.ceil(n / 2) },
      review_after_days: 21,
      revert_diff: { new: cur },
      status: "proposed", proposed_on: localDate(now),
    },
    reason: null,
  };
}

// ORGANISM AUDIT #98 — one line per run, so "did the genome run?" has an answer
// that survives the closing cmd window. Pure builder (selftestable); the append
// is done by logRun so the fixture path never touches disk.
function runLogRow(now, mode, outcome, detail = {}) {
  return { at: now.toISOString(), day: localDate(now), mode, outcome, ...detail };
}
function logRun(row, appendFn = appendFileSync, path = RUNLOG) {
  // a health ledger must never be the reason the organ dies
  try { appendFn(path, JSON.stringify(row) + "\n"); } catch { /* unwritable state dir — the run still stands */ }
  return row;
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

  // THE UNGATE — ORGANISM AUDIT #102/#106. "speak-gate closed (volume)" told the
  // captain he would never see a proposal and hid the fact that he was 9 reps
  // into a 200-rep climb. The counter is now in the line itself.
  const nine = Array.from({ length: 9 }, () => ({ track: "concept", axis: "e", concept: "c", ts: "2026-07-01T00:00:00Z" }));
  const gc = proposeFromEvidence(nine, profile(), false, now, { have: 9, need: 200 });
  assert("#102 the gate-closed line SHOWS its n (9/200 reps), not just the verdict",
    gc.proposal === null && gc.reason.startsWith("9/200 reps") && gc.counter.have === 9 && gc.counter.need === 200);
  assert("...and an unreadable threshold says so rather than inventing a denominator",
    /threshold unreadable/.test(proposeFromEvidence(nine, profile(), false, now, null).reason));
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
  // #98/#106 — the GATE-OPEN-BUT-NO-EVIDENCE branch. This is one of the two
  // states whose only record was a console line in a window that closes.
  assert("#106 the no-evidence line is a have/need counter, never a bare 'nothing to propose'",
    /\b3\/5 late-checkpoint lapses\b/.test(thin.reason) && thin.counter.have === 3 && thin.counter.need === MIN_LATE_LAPSES);
  const nothing = proposeFromEvidence([], profile(), true, now);
  assert("...and zero evidence reads 0/5, not silence", /0\/5 late-checkpoint lapses/.test(nothing.reason) && nothing.counter.have === 0);
  assert("the evidence bar is UNCHANGED at 5 — surfaced, not lowered", MIN_LATE_LAPSES === 5 && thin.proposal === null);

  // RULING 5 (8 Aug 2026) — teaching drift-rates reach the genome as CONTEXT
  assert("topDrift ranks by hits+auto_hits and stays null on a silent contract",
    topDrift({ rules: [{ id: "hinglish", hits: 2, auto_hits: 7 }, { id: "dheema", hits: 0, auto_hits: 30 }] }).id === "dheema"
    && topDrift({ rules: [{ id: "x", hits: 0, auto_hits: 0 }] }) === null && topDrift(null) === null);
  const propT = proposeFromEvidence(reps, profile(), true, now, null, { id: "dheema", n: 30 });
  assert("a proposal carries the teaching-drift line as CONTEXT, never the basis (metric/diff unchanged)",
    propT.proposal.evidence.some((e) => /teaching-drift CONTEXT.*dheema.*30×/.test(e))
    && propT.proposal.evidence.some((e) => /never the basis/.test(e))
    && JSON.stringify(propT.proposal.diff) === JSON.stringify(prop.proposal.diff)
    && propT.proposal.metric.name === prop.proposal.metric.name);
  assert("no teaching context ⇒ no context line (absence, not a fabricated zero)",
    !prop.proposal.evidence.some((e) => /teaching-drift/.test(e)));
  assert("teaching context still validates against the profile whitelist",
    validateMutation(propT.proposal, profile()).ok);

  // changelog line
  const line = changelogLine(kept.m, 1);
  assert("changelog line human-readable with outcome", /Beat 1:/.test(line) && /KEPT/.test(line));

  // THE RUN LOG — ORGANISM AUDIT #98. \ArsenalFC-BootRoom is `cmd /c … node
  // scripts\bootroom.mjs` with NO log redirect, so every console line above died
  // with the window and "did the genome run?" had no answer. Verified in the
  // audit: mutations.jsonl, SEASON_CHANGELOG.md and scripts\bootroom.log all
  // did not exist, and a full before/after diff of dressing-room\state showed
  // ZERO writes from a real run. One line per run now survives.
  const rows = [];
  const memAppend = (_p, s) => rows.push(JSON.parse(s));
  logRun(runLogRow(now, "run", "gate_closed", { reason: gc.reason, gate_open: false, counter: gc.counter }), memAppend, "(memory)");
  assert("every run leaves one auditable row (day, mode, outcome)",
    rows.length === 1 && rows[0].day === "2026-07-12" && rows[0].mode === "run" && rows[0].outcome === "gate_closed");
  assert("...carrying the have/need that caused it, so a silent week is auditable",
    rows[0].counter.have === 9 && rows[0].counter.need === 200);
  logRun(runLogRow(now, "run", "extended", { id: "mut-1", counter: { have: 5, need: 20, kind: "metric_events" }, review_after_days: 28, extended: 1, changelog_written: false }), memAppend, "(memory)");
  assert("EXTENDED is persisted — mutations.jsonl keeps the new window, but the WHY had no home",
    rows[1].outcome === "extended" && rows[1].counter.have === 5 && rows[1].counter.need === 20 && rows[1].changelog_written === false);
  // the ledger must never be the reason the organ dies
  let threw = false;
  try { logRun(runLogRow(now, "run", "quiet_day"), () => { throw new Error("disk full"); }, "(memory)"); } catch { threw = true; }
  assert("an unwritable run log never aborts the genome", threw === false);

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
  if (!profile) {
    console.log(`bootroom: forge_profile.json missing — genome absent, nothing to do → ${PROFILE}`);
    logRun(runLogRow(now, mode, "no_genome", { note: "forge_profile.json missing" }));
    return;
  }
  const muts = readLines(MUTS);
  const vitals = readJson(join(STATE_DIR, "loop_vitals.json"));
  const gateOpen = !!(vitals && vitals.speak_gates && vitals.speak_gates.bootroom_mutation);
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
  // ONE number, read from the file that already owns it. physio.mjs:375 decides
  // `bootroom_mutation` with physio_config.json gates.bootroom_min_reps; the
  // counter must be judged against that exact value, never a copy. If the config
  // is unreadable the counter says so rather than inventing a denominator —
  // physio's own published counter is preferred when present.
  const physioCfg = readJson(join(STATE_DIR, "physio_config.json"));
  const publishedCounter = vitals && vitals.speak_gate_counters && vitals.speak_gate_counters.bootroom_mutation;
  const gateNeed = publishedCounter && Number.isFinite(publishedCounter.need) ? publishedCounter.need
    : (physioCfg && physioCfg.gates && Number.isFinite(physioCfg.gates.bootroom_min_reps) ? physioCfg.gates.bootroom_min_reps : null);
  const gate = gateNeed === null ? null : { have: reps.length, need: gateNeed };

  if (mode === "propose" || (mode === "run" && now.getDay() === 0)) {
    // Ruling 5 reader: teaching_contract.json is teaching_contract.mjs's file — read-only here.
    const { proposal, reason, counter } = proposeFromEvidence(reps, profile, gateOpen, now, gate,
      topDrift(readJson(join(STATE_DIR, "teaching_contract.json"))));
    if (proposal) {
      if (!muts.some(m => m.id === proposal.id)) {
        appendFileSync(MUTS, JSON.stringify(proposal) + "\n");
        console.log(`bootroom: proposal ${proposal.id} filed — awaiting the captain's "haan, chalao" → ${MUTS}`);
        logRun(runLogRow(now, mode, "proposal_filed", { id: proposal.id, target: proposal.target, evidence: proposal.evidence }));
      } else {
        console.log(`bootroom: proposal ${proposal.id} already filed`);
        logRun(runLogRow(now, mode, "proposal_already_filed", { id: proposal.id }));
      }
    } else {
      console.log(`bootroom: ${reason}`);
      // #98 — THIS is the line that used to die with the window. Persisted with
      // its have/need so a week of silence is auditable, not assumed.
      logRun(runLogRow(now, mode, counter && counter.kind === "volume_gate" ? "gate_closed" : "no_evidence",
        { reason, gate_open: gateOpen, counter: counter || null }));
    }
    if (mode === "propose") return;
  }

  if (mode === "approve") {
    const id = process.argv[3];
    const m = muts.find(x => x.id === id && x.status === "proposed");
    if (!m) {
      console.log(`bootroom: no proposed mutation with id ${id}`);
      logRun(runLogRow(now, mode, "approve_no_such_mutation", { id }));
      process.exit(1);
    }
    const res = approveMutation(m, profile, muts, now);
    if (!res.ok) {
      console.log(`bootroom: REJECTED — ${res.err}`);
      // #98 — a REJECTED approval writes nothing to SEASON_CHANGELOG (only
      // kept/reverted go there), so without this row the refusal and its reason
      // existed only in the console.
      logRun(runLogRow(now, mode, "approve_rejected", { id, err: res.err }));
      process.exit(1);
    }
    writeAtomic(PROFILE, res.profile);
    writeAtomic(MUTS, muts.map(x => JSON.stringify(x.id === id ? res.mutation : x)).join("\n") + "\n");
    appendFileSync(CHANGELOG, changelogLine(res.mutation, muts.filter(x => x.status !== "proposed").length + 1) + "\n");
    console.log(`bootroom: ${id} LIVE — old value frozen in legacy{}, review in ${m.review_after_days}d → ${PROFILE}`);
    logRun(runLogRow(now, mode, "approved", { id, target: m.target, review_after_days: m.review_after_days }));
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
      console.log(`bootroom: ${live.id} ${res.action.toUpperCase()}${res.action === "extended" ? ` — ${events}/${live.metric.min_events} events, window now ${res.m.review_after_days}d (extension #${res.m.extended})` : ""}`);
      // #98 — `extended` deliberately skips the changelog (line above: the
      // changelog is the KEPT/REVERTED medicine, and an extension is neither).
      // mutations.jsonl does keep the bumped review_after_days, so the DATA
      // survived — but the announcement, and the event count that caused it, did
      // not. Both are persisted here, with the metric's own min_events as need.
      logRun(runLogRow(now, mode, res.action, {
        id: live.id, metric: live.metric && live.metric.name,
        counter: { have: events, need: live.metric ? live.metric.min_events : null, kind: "metric_events" },
        outcome: res.m.outcome !== undefined ? res.m.outcome : count,
        review_after_days: res.m.review_after_days, extended: res.m.extended || 0,
        changelog_written: res.action !== "extended",
      }));
    } else {
      console.log(`bootroom: ${live.id} live, review pending`);
      logRun(runLogRow(now, mode, "waiting", { id: live.id, review_after_days: live.review_after_days }));
    }
  } else if (mode === "score") {
    console.log("bootroom: no live mutation to score");
    logRun(runLogRow(now, mode, "nothing_to_score"));
  }
  if (mode === "run" && now.getDay() !== 0 && !live) {
    console.log("bootroom: quiet day — no live mutation, proposals file on Sundays");
    logRun(runLogRow(now, mode, "quiet_day", { gate_open: gateOpen, counter: gate ? { ...gate, kind: "volume_gate" } : null }));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateMutation, approveMutation, scoreMutation, proposeFromEvidence, changelogLine, resolvePath, runLogRow, logRun, RUNLOG, MIN_LATE_LAPSES, topDrift };
