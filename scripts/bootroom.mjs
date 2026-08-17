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
//              originates evidence. SECOND LANE (10 Aug 2026): a persistent
//              RECITAL failure files a RULING REQUEST in this same grammar —
//              same ledger, same idempotence, same day-gate — but carrying no
//              genome key, because that law lives in dugout.mjs's code. See
//              THE RECITAL ESCALATION below.
//   validate — schema + bounds + WHITELIST: target must resolve into
//              forge_profile.json. Medical rules, ladder_config, the
//              Goalkeeper, and the honest frame are constitutionally OUTSIDE
//              the genome — hard reject.
//   approve  — the captain's mouth, via CLI ("haan, chalao"). SERIAL LAW:
//              one live mutation at a time, no exceptions. Old value moves
//              into legacy{} verbatim (layering, never replace). On a RULING
//              REQUEST his word applies nothing and writes no canon — it is
//              RECORDED (status "ruled" + one changelog line) and the change
//              itself stays his, by hand, in a revertable commit.
//   score    — at review_after_days: metric recomputed; if event volume <
//              min_events the window AUTO-EXTENDS (a mutation judged on five
//              events is a coin flip); else KEPT or AUTO-REVERTED by its own
//              revert_diff.
//   record   — one human-readable line in SEASON_CHANGELOG.md.
//
// INPUT:  forge_profile.json (canon, THIS organ's sole write target) ·
//         mutations.jsonl (own ledger) · reps_log.jsonl · fsrs_store.json ·
//         loop_vitals.json (speak-gate) · recital_audit.jsonl (READ-ONLY —
//         dugout.mjs is its single writer)
// OUTPUT: forge_profile.json · mutations.jsonl · SEASON_CHANGELOG.md (root)
// MODES:  run (default: propose-if-Sunday + score-matured) · propose ·
//         validate <id> · approve <id> · score · recital (read-only lane
//         counter, files nothing) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { supersedeReps } from "./capture.mjs";   // BLOCK 4 — a corrected verdict must stop counting HERE too; the sole writer of reps_log owns what supersession means

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
// THE RECITAL AUDIT — dugout.mjs's file, READ-ONLY here, forever. Its single
// writer is the /recital endpoint (dugout.mjs:4020), fed by the machine's own
// grading of every verbatim recital (dugout.mjs:3456 recitalGrade). This organ
// opens it to ESCALATE a pattern; it never appends a byte (single-writer law).
const RECITAL   = join(STATE_DIR, "recital_audit.jsonl");

// THE EVIDENCE BAR — pre-existing value, UNCHANGED (it was the bare literal `5`
// at the old line 151). Named so it can be surfaced as a have/need counter
// instead of hiding inside a sentence, per the captain's standing order that a
// threshold must be visible next to the number it is judging.
const MIN_LATE_LAPSES = 5;

// THE RECITAL BAR — BORROWED FROM THIS FILE, NOT MINTED (10 Aug 2026). The organ
// already answers "how many times must a thing repeat before it counts as
// evidence?" once, with MIN_LATE_LAPSES above; the recital lane reuses that exact
// constant rather than inventing a second answer to the same question. The
// sittings bar is not a threshold at all — it is the literal reading of
// "recurring across sittings, not one bad night": more than one day.
// PROVISIONAL, and it says so out loud: recital_audit.jsonl did not exist on disk
// on 10 Aug 2026 (the recital wire shipped that same day), so there is not one
// graded row to calibrate against. Both numbers are awaiting his standing rule —
// open everything, gather 30-45-60 days of real data, THEN set the threshold.
const RECITAL_MIN_HITS     = MIN_LATE_LAPSES;
const RECITAL_MIN_SITTINGS = 2;
// the marker every door in this file reads to know a row carries no genome key
const RECITAL_KIND = "recital_law_ruling";

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
// FROZEN VERBATIM 10 Aug 2026 (LAYERING law — the old engine never leaves the
// file). This IS the genome's constitution for a profile diff and not one line
// of it changed: the recital lane needed a second, stricter door, so
// validateMutation below became a two-line router and the original body lives on
// here, untouched. Every profile-diff mutation still passes through exactly these
// checks — the selftest asserts router and legacy agree on the same fixtures, so
// the claim is measured rather than promised.
function validateMutationLegacy(m, profile) {
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

// THE ROUTER (10 Aug 2026). One kind of row, and only one, does not describe a
// profile diff: the recital lane's RULING REQUEST. It gets its own door because
// the legacy door would reject it for the right reason with the wrong effect —
// "target does not resolve into forge_profile.json" fires at APPROVE, i.e. at the
// exact moment he says haan, and he would read a REJECTED line for answering a
// question the organ asked him. Everything else is delegated, unchanged.
function validateMutation(m, profile) {
  if (m && m.kind === RECITAL_KIND) return validateRecitalRuling(m, profile);
  return validateMutationLegacy(m, profile);
}

// THE ONE-WAY DOOR. Stricter than the legacy validator on purpose: a ruling
// request must prove it CANNOT touch canon. Same required fields (so /genome
// presents it identically), the same FORBIDDEN constitution, plus two refusals
// that exist only here — it must carry applies:false, and its target must NOT
// resolve inside forge_profile.json. A row that resolves is not a ruling; it is a
// mutation wearing a ruling's coat, and it goes back through the legacy door or
// nowhere.
function validateRecitalRuling(m, profile) {
  const errs = [];
  for (const f of ["id", "target", "diff", "evidence", "predicted_effect", "metric", "review_after_days", "revert_diff", "pattern_key"])
    if (m[f] === undefined || m[f] === null) errs.push(`missing field: ${f}`);
  if (errs.length) return { ok: false, errs };
  if (FORBIDDEN.test(m.target) || FORBIDDEN.test(JSON.stringify(m.diff)))
    errs.push("FORBIDDEN — medical rules, the ladder, the Goalkeeper, and the honest frame are constitutionally outside the genome");
  if (m.applies !== false) errs.push("a ruling request must carry applies:false — it proposes a law change it can never perform");
  if (resolvePath(profile, m.target))
    errs.push(`a ruling request must NOT resolve into forge_profile.json (${m.target}) — a row that can move canon belongs in the mutation lane, not this one`);
  if (!Array.isArray(m.evidence) || m.evidence.length === 0) errs.push("evidence must be non-empty (real graded rows, not vibes)");
  if (!m.metric || typeof m.metric.name !== "string" || typeof m.metric.min_events !== "number")
    errs.push("metric must carry {name, min_events, window_days}");
  if (typeof m.review_after_days !== "number" || m.review_after_days < 7) errs.push("review_after_days must be ≥7");
  return { ok: errs.length === 0, errs };
}

// ---------------------------------------------------------------------------
// THE CAPTAIN'S ORDER (11 Aug 2026 — HIS RULING: "i want each topic to be
// revised max number of times ... do not create jugad, do permanent stuff").
//
// WHY THE SPEAK-GATE DID NOT APPLY, AND WHY IT STAYS. proposeFromEvidence refuses
// below 200 reps ("the genome is listening, not proposing yet"). That gate is
// aimed at THE MACHINE: it must not rewrite his method off thin evidence of its
// own reading. It was never aimed at the captain deciding how often he wants to
// revise his own material — a study schedule is his call, and 21/200 reps is a
// statement about the machine's standing to speak, not about his.
//
// WHAT IS NOT WAIVED — everything that makes a mutation safe:
//   · the row still goes in as status "proposed" and still needs `approve <id>`
//   · validateMutation still runs at approve: FORBIDDEN still bars the medical
//     rules / ladder / Goalkeeper / honest frame, and the target must still
//     resolve inside forge_profile.json
//   · the SERIAL LAW still holds — one live mutation at a time
//   · legacy{} still preserves the old value, so the revert is real
// Only the VOLUME gate is bypassed, and the row says so in its own evidence
// rather than dressing his order up as a measurement it does not have.
function captainProposal(target, value, why, profile, now = new Date()) {
  const spot = resolvePath(profile, target);
  if (!spot) return { proposal: null, err: `target does not resolve into forge_profile.json: ${target}` };
  const oldValue = spot.node[spot.leaf];
  const slug = String(target).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return {
    proposal: {
      id: `mut-${localDate(now)}-captain-${slug}`,
      kind: "captain_order",
      status: "proposed",
      proposed_at: now.toISOString(),
      target,
      diff: { old: oldValue, new: value },
      // Honest by construction: a captain order has no rep evidence and must not
      // pretend to. The ruling IS the warrant, quoted, and the row says the gate
      // was bypassed so no later reader mistakes this for a measured proposal.
      evidence: [
        `CAPTAIN'S ORDER — not derived from reps. His words: "${String(why).slice(0, 400)}"`,
        `the volume speak-gate was BYPASSED on his ruling: that gate governs the MACHINE proposing from thin evidence, not the captain setting his own study schedule`,
        `old value, read live off forge_profile.json at filing: ${JSON.stringify(oldValue)}`,
      ],
      predicted_effect: `the captain's stated intent, measured the same way every other mutation is: this organ predicts nothing on his behalf. If the change does not serve him he says so and it reverts — the revert_diff below is the exact old value.`,
      metric: { name: `captain_${slug}`, min_events: 20, window_days: 42, improves_when_below: null },
      review_after_days: 42,
      scoring_note: "a captain order is not auto-scored against a threshold — he rules on whether it served him. The metric exists so the row is judgeable, not so the machine can overrule him.",
      revert_diff: { new: oldValue },
    },
    err: null,
  };
}

// ---------------------------------------------------------------------------
// APPROVE — serial law + legacy{} preservation
// ---------------------------------------------------------------------------
// FROZEN VERBATIM 10 Aug 2026 (LAYERING law). Unchanged body; approveMutation
// below routes to it for every row that carries a profile diff, which is every
// row this organ has ever filed until today.
function approveMutationLegacy(m, profile, muts, now = new Date()) {
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

// THE ROUTER (10 Aug 2026). His word on a ruling request RECORDS and applies
// NOTHING: the profile object comes back byte-identical (main also skips the
// write, so canon is not even re-serialised), status becomes "ruled", and the
// changelog gets its one line. The law itself is a code change he makes by hand
// in a commit he can revert — the Boot Room escalates and remembers, it does not
// legislate. Deliberately BEFORE the serial law: that law protects ONE value from
// two simultaneous mutations, and a ruling moves no value, so a live method
// mutation must not be able to gag him on an unrelated question.
function approveMutation(m, profile, muts, now = new Date()) {
  if (m && m.kind === RECITAL_KIND) {
    const v = validateMutation(m, profile);
    if (!v.ok) return { ok: false, err: v.errs.join("; ") };
    return { ok: true, ruling: true, profile, mutation: { ...m, status: "ruled", ruled_on: localDate(now) } };
  }
  return approveMutationLegacy(m, profile, muts, now);
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

// ---------------------------------------------------------------------------
// THE RECITAL ESCALATION — when the scar stops working, the LAW goes to him
// ---------------------------------------------------------------------------
// 10 Aug 2026. dugout.mjs now grades every verbatim recital the Gaffer gives him
// (dugout.mjs:3456 recitalGrade → dugout.mjs:4020 the /recital endpoint, its sole
// writer) and feeds the Gaffer's own worst failures back into his constitution
// every single turn, ranked worst-first (dugout.mjs:1066 recitalScar). That scar
// is an INSTRUCTION, and instruction is the only lever the machine owns.
//
// THE GAP THIS CLOSES: if the instruction is re-issued every turn and the SAME
// failure keeps landing anyway — week after week — then the thing that is broken
// is not the mouth, it is THE LAW, and a law is the captain's to change. Nothing
// escalated that. Now it does, through the one organ built for exactly this:
// evidence, a predicted effect, a revert plan, and his word via /genome.
//
// WHAT THIS LANE CAN AND CANNOT DO — plainly, because the difference is the whole
// point. THE RECITAL LAW LIVES IN CODE: the read-it-verbatim instruction in the
// Gaffer's constitution, and recitalGrade's own 85%-in-order cut (dugout.mjs:3467).
// It is NOT a key in forge_profile.json, and validateMutation's whitelist IS the
// profile's keys (line 109 of the frozen legacy validator). So this proposal
// carries no diff into canon and structurally cannot grow one — `kind` marks it,
// validateRecitalRuling refuses it a resolving target, and approve records his
// RULING instead of writing the profile. Precedent for a proposal in this exact
// grammar whose target sits outside the genome: nightshift's wind tunnel, which
// died on disk until B5 gave it an owner (gate_tune.mjs:5-16). This lane's owner
// is HIM — that is not a gap, it is the design.
//
// NOT GATED ON THE REP SPEAK-GATE, and this lowers nothing: `bootroom_mutation`
// counts REPS (physio.mjs:529, `world.reps.length >= cfg.gates.bootroom_min_reps`)
// because it guards MUTATIONS OF THE METHOD — a method rewritten on nine reps is
// noise. This lane mutates no method, and rep volume says nothing about whether
// the Gaffer read his prose straight; its evidence is graded recitals and its bar
// is counted in those. The rep gate on the rep lane is untouched, and the selftest
// holds it there.

// A "sitting" is a local calendar day — his own clock, the same localDate() every
// other date in this organ uses. No gap-threshold is invented to slice a night.
const recitalDay = (r) => { const t = r && r.ts ? new Date(r.ts) : null; return t && !isNaN(t) ? localDate(t) : null; };

// His last word on THIS lane is a line in the sand: everything before it was
// answered, so the next escalation may only count what happened AFTER it. One
// floor for the lane rather than one per failure-mode — a law change he makes for
// DRIFT can plausibly move NO-PRICE too, and crediting it for that is the honest
// direction to err in (it under-counts, it can never manufacture a pattern).
function recitalFloor(muts) {
  let floor = null;
  for (const m of muts || []) {
    if (!m || !m.ruled_on || typeof m.pattern_key !== "string" || !m.pattern_key.startsWith("recital:")) continue;
    if (!floor || m.ruled_on > floor) floor = m.ruled_on;
  }
  return floor;
}

// IDEMPOTENCE, the real kind: not "same id twice" (the day-stamp in the id would
// make a new one every Sunday) but "he already has this question in front of him".
// Last row per id, exactly as physio.mjs:735-738 reads the same ledger, because
// approve/score REWRITE mutations.jsonl whole.
function recitalPending(muts, key) {
  const last = {};
  for (const m of muts || []) if (m && m.id) last[m.id] = m;
  return Object.values(last).some(m => m.pattern_key === key && m.status === "proposed");
}

// The pattern read. Pure, fixture-testable, and it never sees the disk.
function recitalPattern(rows, floor = null) {
  const kept = [], byVerdict = {};
  let unverified = 0;
  for (const r of rows || []) {
    if (!r || typeof r.verdict !== "string" || !r.verdict) continue;
    const day = recitalDay(r);
    if (!day) continue;                       // an undateable row cannot be placed in a sitting
    if (floor && day <= floor) continue;      // answered already — his word closed it
    // UNVERIFIED CAN NEVER COUNT — in any organ. It is the absence of a
    // transcript (dugout.mjs:3467), not a reading. It is not a pass, and it is
    // not a failure either; it is counted only so the evidence can SAY how much
    // of the record was unreadable.
    if (r.verdict === "UNVERIFIED") { unverified++; continue; }
    kept.push(r);
    if (r.verdict === "PASS") continue;
    const b = byVerdict[r.verdict] || (byVerdict[r.verdict] = { verdict: r.verdict, rows: [], days: new Set() });
    b.rows.push(r); b.days.add(day);
  }
  // worst-first, then most-spread, then by name — deterministic on a tie, because
  // two runs of the same ledger must file the same proposal or idempotence is a lie
  const ranked = Object.values(byVerdict).sort((a, b) =>
    b.rows.length - a.rows.length || b.days.size - a.days.size || a.verdict.localeCompare(b.verdict));
  const worst = ranked[0] || null;
  const have = worst ? worst.rows.length : 0;
  const sittings = worst ? worst.days.size : 0;
  const counter = {
    kind: "recital_pattern", have, need: RECITAL_MIN_HITS,
    sittings, sittings_need: RECITAL_MIN_SITTINGS,
    verdict: worst ? worst.verdict : null, graded: kept.length, unverified, since: floor || null,
  };
  // THE UNGATE (#102/#106) applies here too: never a verdict with the count filed
  // off. Both bars are named in the line, in the order they are judged.
  if (!worst || have < RECITAL_MIN_HITS)
    return { pattern: null, counter,
      reason: `${worst ? `worst recital failure (${worst.verdict})` : "no failing recital"} shows ${have}/${RECITAL_MIN_HITS} across ${sittings} sitting(s) of ${kept.length} graded — nothing to escalate${unverified ? ` (${unverified} UNVERIFIED excluded)` : ""}` };
  if (sittings < RECITAL_MIN_SITTINGS)
    return { pattern: null, counter,
      reason: `${worst.verdict} ×${have} but all in ${sittings} sitting(s)/${RECITAL_MIN_SITTINGS} — one bad night is not a pattern, the law stays his to leave alone` };
  return { pattern: { ...worst, days: [...worst.days].sort(), graded: kept.length, unverified, floor: floor || null }, counter, reason: null };
}

// The proposal, in this organ's own grammar (every required field of the frozen
// validator, plus the two this lane must prove). Evidence QUOTES the rows — real
// counts, the real coverage numbers, the real words of HIS that were dropped —
// because a summary here would be the machine grading itself on its own say-so.
function recitalProposal(p, now = new Date()) {
  const v = p.verdict, n = p.rows.length;
  const cov = p.rows.map(r => `${Number(r.coverage) || 0}%`);
  const dropped = [...new Set(p.rows.flatMap(r => Array.isArray(r.missing) ? r.missing : []))];
  const where = [...new Set(p.rows.map(r => `${r.capsule || "?"} · ${r.page || "?"}`))];
  const evidence = [
    `${v} ×${n} across ${p.days.length} sittings (${p.days.join(", ")}) of ${p.graded} graded recital(s)${p.floor ? ` since your last word on this lane (${p.floor})` : ""}`,
    `coverage on those ${n}, verbatim from the rows: ${cov.join(", ")} — the machine's own in-order match of your words against its mouth (dugout.mjs:3462)`,
    `where it happened: ${where.join(" | ")}`,
    dropped.length
      ? `words of YOURS it dropped, exactly as banked: ${dropped.slice(0, 24).join(", ")}`
      : `the rows banked no dropped-word list for this failure — the count stands, the words do not`,
    `${p.unverified} UNVERIFIED row(s) in the same window were EXCLUDED — no transcript is not a pass, in any organ (dugout.mjs:3467)`,
    `the scar was already loaded the whole time: dugout.mjs:1066 recitalScar() puts this failure at the TOP of the Gaffer's constitution every turn, worst-first, and it kept landing anyway`,
  ];
  // the failure's own numbers, from its own rows — not a template
  if (v === "OVERRUN") evidence.push(`page handed → words spoken on those rows: ${p.rows.map(r => `${Number(r.payload_words) || 0}→${Number(r.spoken_words) || 0}`).join(", ")}`);
  if (v === "NO-PRICE") evidence.push(`priced flag on those rows: ${p.rows.map(r => (r.priced ? "priced" : "unpriced")).join(", ")} — the seconds never landed before your prose began (dugout.mjs:3465)`);
  return {
    id: `mut-${localDate(now)}-recital-${v.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
    kind: RECITAL_KIND,
    applies: false,
    pattern_key: `recital:${v}`,
    // deliberately unresolvable inside forge_profile.json — the whitelist's own
    // refusal is what proves this row can never move canon
    target: "THE RECITAL LAW — dugout.mjs, code you rule on (NOT a forge_profile key)",
    diff: {
      old: "instruction only — the machine grades each recital and re-injects the worst failure into the Gaffer's constitution every turn",
      new: "YOUR ruling on the law itself — the Boot Room files no key, writes no words, and changes nothing on its own",
    },
    evidence,
    predicted_effect: `whatever you rule, the same reader measures it: ${v} falls below ${Math.ceil(n / 2)} over the next ${p.graded} graded recital(s). If the law does not change, this organ predicts nothing improves — the instruction has already been re-issued every turn and this is the result.`,
    // metric grammar is this file's own (the axis proposal's window_days:21 and
    // improves_when_below: half the observed count). min_events is DERIVED, not
    // picked: judge it on at least as many graded recitals as filed it — the same
    // instinct as scoreMutation's volume gate, "a mutation judged on five events
    // is a coin flip".
    metric: { name: `recital_${v.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_count`, min_events: p.graded, window_days: 21, improves_when_below: Math.ceil(n / 2) },
    review_after_days: 21,
    // AUTO-SCORING DOES NOT REACH HERE, and pretending otherwise would be the lie
    // this organ exists to prevent: scoreMutation only ever looks at status "live"
    // and a ruling never goes live. Re-read the lane by hand after the change.
    scoring_note: "not auto-scored — a ruling never goes live. Re-read it with `node scripts/bootroom.mjs recital`.",
    revert_diff: {
      new: "THE RECITAL LAW exactly as it stands today — the read-it-verbatim instruction plus recitalGrade's 85% in-order cut (dugout.mjs:3467). Nothing in forge_profile.json moves, so there is nothing here to roll back; the plan is to revert the ONE commit your change rides in, and the Boot Room cannot do that for you.",
    },
    status: "proposed", proposed_on: localDate(now),
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

  // THE RECITAL ESCALATION (10 Aug 2026) — fixtures shaped exactly like the rows
  // dugout.mjs:4025 writes. ts is built from a LOCAL Date on purpose: a "Z" string
  // would slide across midnight in his timezone and silently re-bucket a sitting.
  const rts = (d, h = 21) => new Date(2026, 7, d, h, 0, 0).toISOString();
  const rrow = (d, verdict, coverage, extra = {}) => ({
    ts: rts(d), capsule: "embeddings", page: "weld", verdict, coverage,
    priced: verdict !== "NO-PRICE", overrun: verdict === "OVERRUN",
    payload_words: 120, spoken_words: 96, missing: [], ...extra,
  });
  const driftLedger = [
    rrow(4, "DRIFT", 41, { missing: ["ghadi", "apni", "bhoolna"] }),
    rrow(4, "DRIFT", 52, { missing: ["weld"], page: "deep" }),
    rrow(4, "PASS", 97),
    rrow(6, "DRIFT", 63, { missing: ["jirah"], capsule: "inference" }),
    rrow(6, "UNVERIFIED", 0),
    rrow(9, "DRIFT", 58, { missing: ["bolo", "ghadi"] }),
    rrow(9, "DRIFT", 44, { missing: ["traps"], page: "mechanism" }),
    rrow(9, "PASS", 91),
    rrow(9, "UNVERIFIED", 0),
  ];
  const rp = recitalPattern(driftLedger);
  assert("a persistent recital failure is FOUND (5 DRIFT across 3 sittings)",
    rp.pattern && rp.pattern.verdict === "DRIFT" && rp.pattern.rows.length === 5 && rp.pattern.days.length === 3);
  assert("UNVERIFIED never counts toward a pattern, and never toward the graded denominator",
    rp.counter.unverified === 2 && rp.counter.graded === 7 && rp.pattern.rows.every(r => r.verdict !== "UNVERIFIED"));
  assert("a wall of UNVERIFIED can never fire — no transcript is not a failure either",
    recitalPattern(Array.from({ length: 12 }, (_, i) => rrow(1 + (i % 9), "UNVERIFIED", 0))).pattern === null);
  assert("a clean record fires nothing and still says its count",
    (() => { const c = recitalPattern([rrow(4, "PASS", 99), rrow(6, "PASS", 96)]); return c.pattern === null && c.counter.have === 0 && c.counter.graded === 2; })());

  // ONE BAD NIGHT IS NOT A PATTERN — the whole reason the lane counts sittings
  const oneNight = recitalPattern([rrow(4, "DRIFT", 40), rrow(4, "DRIFT", 41), rrow(4, "DRIFT", 42), rrow(4, "DRIFT", 43), rrow(4, "DRIFT", 44)]);
  assert("5 failures in ONE sitting do NOT escalate (persistence, not a bad night)",
    oneNight.pattern === null && oneNight.counter.have === 5 && oneNight.counter.sittings === 1 && /one bad night/.test(oneNight.reason));
  const under = recitalPattern([rrow(4, "DRIFT", 40), rrow(6, "DRIFT", 41), rrow(9, "DRIFT", 42), rrow(11, "DRIFT", 43)]);
  assert("under the bar ⇒ a have/need counter, never a bare silence (the UNGATE law)",
    under.pattern === null && /\b4\/5\b/.test(under.reason) && under.counter.have === 4 && under.counter.need === RECITAL_MIN_HITS);
  assert("the recital bar is BORROWED from this file's own evidence bar, not minted",
    RECITAL_MIN_HITS === MIN_LATE_LAPSES && RECITAL_MIN_SITTINGS === 2);

  // THE PROPOSAL — real rows quoted, never a summary
  const rprop = recitalProposal(rp.pattern, now);
  assert("evidence quotes the REAL counts and sittings",
    /DRIFT ×5 across 3 sittings \(2026-08-04, 2026-08-06, 2026-08-09\)/.test(rprop.evidence[0]) && /of 7 graded/.test(rprop.evidence[0]));
  assert("evidence quotes the REAL coverage numbers, not an average",
    /41%, 52%, 63%, 58%, 44%/.test(rprop.evidence[1]) && !/average|mean/i.test(rprop.evidence[1]));
  assert("evidence quotes the ACTUAL words of HIS that were dropped",
    /ghadi/.test(rprop.evidence[3]) && /apni/.test(rprop.evidence[3]) && /traps/.test(rprop.evidence[3]));
  assert("evidence says how much of the record was unreadable, and that it was excluded",
    /2 UNVERIFIED row\(s\).*EXCLUDED/.test(rprop.evidence[4]));
  assert("evidence names the scar that was already running — that is what makes it an ESCALATION",
    rprop.evidence.some(e => /recitalScar\(\).*every turn/.test(e)));
  assert("the proposal carries a predicted effect and a revert plan, in this organ's grammar",
    /falls below 3/.test(rprop.predicted_effect) && /revert the ONE commit/.test(rprop.revert_diff.new) && rprop.review_after_days === 21);
  assert("min_events is DERIVED from the evidence that filed it, never picked",
    rprop.metric.min_events === rp.pattern.graded && rprop.metric.improves_when_below === 3);

  // PROPOSE ONLY — the row must be structurally incapable of moving canon
  assert("the ruling request VALIDATES on its own door", validateMutation(rprop, profile()).ok);
  assert("...and its target deliberately does NOT resolve into forge_profile.json",
    resolvePath(profile(), rprop.target) === null && rprop.applies === false);
  assert("a ruling request wearing a resolving target is HARD-REJECTED (no coat trick)",
    !validateMutation({ ...rprop, target: "rejirah_intervals_days" }, profile()).ok);
  assert("a ruling request without applies:false is rejected",
    !validateMutation({ ...rprop, applies: true }, profile()).ok);
  assert("the FORBIDDEN constitution still applies to this lane",
    !validateMutation({ ...rprop, target: "the goalkeeper's RED rule" }, profile()).ok
    && !validateMutation({ ...rprop, diff: { old: "x", new: "loosen the medical block" } }, profile()).ok);
  const pR = profile(), beforeR = JSON.stringify(pR);
  const okR = approveMutation(rprop, pR, [], now);
  assert("HIS WORD records a RULING and mutates NOTHING — canon comes back byte-identical",
    okR.ok === true && okR.ruling === true && okR.mutation.status === "ruled" && okR.mutation.ruled_on === "2026-07-12"
    && JSON.stringify(pR) === beforeR);
  assert("a live method mutation cannot gag him on an unrelated ruling (serial law is for values)",
    approveMutation(rprop, profile(), [{ ...mut(), id: "mut-live", status: "live" }], now).ok === true);
  assert("a ruling never enters the scoring lane — it never goes 'live'", okR.mutation.status !== "live");
  const rline = changelogLine(okR.mutation, 2);
  assert("the ruling reaches SEASON_CHANGELOG in the same human line", /Beat 2:/.test(rline) && /RULED/.test(rline));

  // IDEMPOTENCE — the question is asked once, not every Sunday
  assert("an unanswered recital proposal blocks a duplicate for the same pattern",
    recitalPending([rprop], "recital:DRIFT") === true && recitalPending([rprop], "recital:NO-PRICE") === false);
  assert("...and his answer un-blocks the lane (last row per id, as physio reads it)",
    recitalPending([rprop, okR.mutation], "recital:DRIFT") === false);
  assert("his ruling is a line in the sand — only evidence AFTER it can escalate again",
    recitalFloor([okR.mutation]) === "2026-07-12"
    && recitalPattern(driftLedger, "2026-08-09").pattern === null
    && recitalPattern(driftLedger, "2026-08-04").counter.have === 3);

  // NO-PRICE / OVERRUN carry their own numbers, from their own rows
  const npp = recitalProposal(recitalPattern([rrow(4, "NO-PRICE", 99), rrow(4, "NO-PRICE", 98), rrow(6, "NO-PRICE", 97), rrow(6, "NO-PRICE", 96), rrow(9, "NO-PRICE", 95)]).pattern, now);
  assert("a NO-PRICE pattern files its own failure's evidence, not DRIFT's",
    npp.pattern_key === "recital:NO-PRICE" && npp.metric.name === "recital_no_price_count"
    && npp.evidence.some(e => /priced flag on those rows: unpriced/.test(e)));
  const ovp = recitalProposal(recitalPattern([rrow(4, "OVERRUN", 99, { spoken_words: 700 }), rrow(4, "OVERRUN", 99, { spoken_words: 640 }), rrow(6, "OVERRUN", 99, { spoken_words: 655 }), rrow(6, "OVERRUN", 99, { spoken_words: 690 }), rrow(9, "OVERRUN", 99, { spoken_words: 710 })]).pattern, now);
  assert("an OVERRUN pattern quotes page-handed → words-spoken from the rows",
    ovp.evidence.some(e => /120→700, 120→640/.test(e)));

  // LAYERING — the frozen engines still run the profile-diff path, unchanged
  assert("LAYERING — validateMutation delegates a profile diff to the frozen legacy engine, verbatim",
    JSON.stringify(validateMutation(mut(), profile())) === JSON.stringify(validateMutationLegacy(mut(), profile()))
    && JSON.stringify(validateMutation({ ...mut(), target: "no.such.key" }, profile())) === JSON.stringify(validateMutationLegacy({ ...mut(), target: "no.such.key" }, profile())));
  const pNew = profile(), pOld = profile();
  assert("LAYERING — approveMutation delegates a profile diff to the frozen legacy engine, verbatim",
    JSON.stringify(approveMutation(mut(), pNew, [], now)) === JSON.stringify(approveMutationLegacy(mut(), pOld, [], now))
    && JSON.stringify(pNew) === JSON.stringify(pOld));
  assert("the REP lane is untouched — its speak-gate still shuts it (no gate lowered anywhere)",
    proposeFromEvidence(reps, profile(), false, now, { have: 17, need: 200 }).proposal === null);

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
  const reps = supersedeReps(readLines(join(STATE_DIR, "reps_log.jsonl")));
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

  // LADDER G12 (9 Aug 2026) — THE CALENDAR-DAY GATE (the refuter's double-fire
  // fix, chosen over `serve` which only changes the filename, never the cap):
  // a Sunday with both a catch-up run AND the scheduled run must file at most
  // ONE proposal. The mutation rows' own proposed_on field is the gate.
  const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const filedToday = muts.some(m => m && m.proposed_on === localDay);

  // READ-ONLY LANE COUNTER — `bootroom.mjs recital` files nothing, ever. It exists
  // so /genome (and he) can read the escalation lane LIVE instead of from a doc,
  // which is the standing rule for every number in this repo.
  if (mode === "recital") {
    const r = recitalPattern(readLines(RECITAL), recitalFloor(muts));
    console.log(r.pattern
      ? `bootroom: ${r.pattern.verdict} ×${r.pattern.rows.length} across ${r.pattern.days.length} sittings (${r.pattern.days.join(", ")}) of ${r.pattern.graded} graded — ESCALATABLE${recitalPending(muts, `recital:${r.pattern.verdict}`) ? ", but already filed and awaiting your word" : ""}`
      : `bootroom: ${r.reason}`);
    logRun(runLogRow(now, mode, r.pattern ? "recital_pattern" : "recital_no_pattern", { counter: r.counter }));
    return;
  }

  // THE CAPTAIN'S ORDER — checked BEFORE the evidence lane, because it answers to
  // his word and not to the rep counter. Everything downstream (validate, approve,
  // serial law, legacy{}, revert) is the same door every other mutation walks.
  if (mode === "propose" && process.argv.includes("--captain")) {
    const flag = (n) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : undefined; };
    const target = flag("target"), rawValue = flag("value"), why = flag("why");
    if (!target || rawValue === undefined || !why) {
      console.log(`bootroom: captain order needs --target <key> --value <json> --why "<your words>"`);
      console.log(`  e.g. node scripts/bootroom.mjs propose --captain --target rejirah_intervals_days --value "[3,7,14,30,60,120,240]" --why "max revisions"`);
      process.exit(1);
    }
    let value; try { value = JSON.parse(rawValue); } catch { console.log(`bootroom: --value must be JSON (got: ${rawValue})`); process.exit(1); }
    const { proposal, err } = captainProposal(target, value, why, profile, now);
    if (err) { console.log(`bootroom: ${err}`); logRun(runLogRow(now, mode, "captain_bad_target", { target, err })); process.exit(1); }
    // Validate AT FILING as well as at approve: a row he cannot approve must never
    // reach his card in the first place.
    const v = validateMutation(proposal, profile);
    if (!v.ok) { console.log(`bootroom: REFUSED — ${v.errs.join("; ")}`); logRun(runLogRow(now, mode, "captain_invalid", { target, errs: v.errs })); process.exit(1); }
    if (muts.some(x => x.id === proposal.id && x.status === "proposed")) {
      console.log(`bootroom: ${proposal.id} already filed and awaiting your word — not re-asking (THE ANCHOR LAW)`);
      process.exit(0);
    }
    appendFileSync(MUTS, JSON.stringify(proposal) + "\n");
    console.log(`bootroom: CAPTAIN ORDER ${proposal.id} filed`);
    console.log(`  ${target}: ${JSON.stringify(proposal.diff.old)}  →  ${JSON.stringify(proposal.diff.new)}`);
    console.log(`  approve: node scripts/bootroom.mjs approve ${proposal.id}`);
    logRun(runLogRow(now, mode, "captain_order_filed", { id: proposal.id, target, old: proposal.diff.old, new: proposal.diff.new }));
    return;
  }

  if (mode === "propose" || (mode === "run" && now.getDay() === 0 && !filedToday)) {
    // THE RECITAL ESCALATION runs FIRST inside this branch, and its run-log row is
    // written BEFORE the rep lane's — deliberately. physio.mjs:702 publishes the
    // LAST row of bootroom_log.jsonl as `loop_vitals.genome`, which matchday and
    // the brain already open; keeping the rep lane's row last means an existing
    // surface reads exactly what it read yesterday. The escalation still reaches
    // him regardless: a filed row makes physio.mjs:735 genomePending true, and
    // that bleeds "a proposed mutation sits unreviewed" at every kickoff.
    const recitalRead = recitalPattern(readLines(RECITAL), recitalFloor(muts));
    const recKey = recitalRead.pattern ? `recital:${recitalRead.pattern.verdict}` : null;
    if (recitalRead.pattern && recitalPending(muts, recKey)) {
      // IDEMPOTENCE — he already has this exact question in front of him. Asking a
      // second time is not escalation, it is nagging, and THE ANCHOR LAW forbids it.
      console.log(`bootroom: recital escalation for ${recKey} already filed — awaiting your word, not re-asking`);
      logRun(runLogRow(now, mode, "recital_already_filed", { pattern_key: recKey, counter: recitalRead.counter }));
    } else if (recitalRead.pattern) {
      const rprop = recitalProposal(recitalRead.pattern, now);
      if (!muts.some(m => m.id === rprop.id)) {
        appendFileSync(MUTS, JSON.stringify(rprop) + "\n");
        console.log(`bootroom: RECITAL ESCALATION ${rprop.id} filed — ${recitalRead.pattern.verdict} ×${recitalRead.pattern.rows.length} across ${recitalRead.pattern.days.length} sittings; /genome for your word → ${MUTS}`);
        logRun(runLogRow(now, mode, "recital_escalation_filed", { id: rprop.id, pattern_key: rprop.pattern_key, counter: recitalRead.counter, evidence: rprop.evidence }));
      } else {
        console.log(`bootroom: recital escalation ${rprop.id} already filed`);
        logRun(runLogRow(now, mode, "recital_already_filed", { id: rprop.id, pattern_key: rprop.pattern_key }));
      }
    } else {
      // the UNGATE law: a quiet lane publishes its climb, never a bare silence
      logRun(runLogRow(now, mode, "recital_no_pattern", { reason: recitalRead.reason, counter: recitalRead.counter }));
    }

    // Ruling 5 reader: teaching_contract.json is teaching_contract.mjs's file — read-only here.
    const { proposal, reason, counter } = proposeFromEvidence(reps, profile, gateOpen, now, gate,
      topDrift(readJson(join(STATE_DIR, "teaching_contract.json"))));
    // G12 — the SEASON READ, wording only: the newest season file (season_review's
    // out, lookback across the dir) may COLOR the human_note — never a target,
    // never a number; the constitution's validateMutation still hard-rejects any
    // LLM-sourced target, and this field never reaches diff/evidence/metric.
    if (proposal) {
      try {
        const sdir = join(STATE_DIR, "brain_out", "season");
        const sfiles = readdirSync(sdir).filter(f => f.endsWith(".md")).sort();
        if (sfiles.length) {
          const seasonLine = readFileSync(join(sdir, sfiles[sfiles.length - 1]), "utf8").split("\n").find(l => l.trim());
          if (seasonLine) proposal.human_note = `${proposal.human_note || ""} · season's own read (wording only, ${sfiles[sfiles.length - 1]}): ${seasonLine.slice(0, 140)}`.trim();
        }
      } catch { /* no season file yet — his first /full-time births it */ }
    }
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
    // A RULING WRITES NO CANON — and does not even re-serialise it. res.profile
    // comes back byte-identical from the ruling branch, but writeAtomic would
    // still reformat forge_profile.json (its arrays are hand-written inline), and
    // a file whose mtime moved for a change that never happened is the kind of
    // small lie this organ exists to refuse.
    if (!res.ruling) writeAtomic(PROFILE, res.profile);
    writeAtomic(MUTS, muts.map(x => JSON.stringify(x.id === id ? res.mutation : x)).join("\n") + "\n");
    appendFileSync(CHANGELOG, changelogLine(res.mutation, muts.filter(x => x.status !== "proposed").length + 1) + "\n");
    if (res.ruling) {
      console.log(`bootroom: ${id} RULED — your word is banked and the lane reopens.\n` +
        `  This organ changed NOTHING: ${m.target}.\n` +
        // the revert plan prints WHOLE — a receipt cut off mid-word is how a plan
        // stops being read, and this one is the only rollback he has here
        `  The change is yours to make in code, in one commit you can revert.\n  REVERT PLAN: ${m.revert_diff && m.revert_diff.new ? m.revert_diff.new : "(none filed — refuse the row)"}\n` +
        `  Recorded in ${CHANGELOG}`);
      logRun(runLogRow(now, mode, "ruled", { id, pattern_key: m.pattern_key, target: m.target, applied: false }));
      return;
    }
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
// the frozen engines are exported too — a layering claim nobody can check is a story
export { validateMutationLegacy, approveMutationLegacy };
export { recitalPattern, recitalProposal, recitalPending, recitalFloor, RECITAL, RECITAL_KIND, RECITAL_MIN_HITS, RECITAL_MIN_SITTINGS };
