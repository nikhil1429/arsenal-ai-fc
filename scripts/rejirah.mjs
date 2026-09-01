#!/usr/bin/env node
// ============================================================================
// rejirah.mjs · ARSENAL AI FC — THE RE-JIRAH CONTROLLER (v0, audit #107)
// ----------------------------------------------------------------------------
// WHAT WAS BROKEN. `deep.mjs due` opened the Re-Jirah queue perfectly and nothing
// could ever close it. Measured 5 Aug 2026: four locked capsules, 36/36 axes carrying
// 80,511 characters of his own defended prose, and THREE of the four with
// `reJirahDone: []` — never re-tempered once, 34-42 days overdue. A cold round could
// be run but its RESULT had nowhere to land, so the loop had no back edge.
//
// WHY THE CONTROLLER FIELDS ARE DERIVED. FORGE_SPEC reserves per-axis `axisType` /
// `nextDue` / `lastResult` / `calibrationGap` / `fluencyState` and capsule-level
// `edgeMap` / `confusionPairs`, and §6 says their FINAL shape + constants get spec'd at
// the first R1 run — "un-run = hypothesis; run se hi real values + tuned constants aate".
// Before a single round has been sat there is nothing honest to freeze, so they are
// computed here from the append-only log instead. Recompute is lossless and a wrong
// constant costs a re-run rather than a rewrite. This is a DEFERRAL until R1 closes,
// which is exactly what the spec asks for — not a refusal.
//
// CORRECTION (5 Aug 2026, second pass — the first pass had this WRONG and it is worth
// saying plainly). This header used to claim the capsule may never be written at all,
// citing the immutability law. It read that law backwards. FORGE_SPEC §5's actual text
// is "Claude purane locked capsules KABHI RE-EMIT nahi karta" and, in the same sentence,
// "existing file SIRF APNE Re-Jirah/doubt pe edit hoti" — never REGENERATE, and the one
// occasion it does name for an edit is this very organ's. §6 even names the mechanism:
// "re-emit nahi, TARGETED UPDATE". So a Re-Jirah round IS supposed to land in the
// capsule, in one field: `reJirahDone`.
//
// WHY THIS FILE STILL DOES NOT WRITE IT. Not the immutability law — OWNERSHIP. The gist
// is the master store (§1) and `dressing-room/state/capsules/` is a READ-ONLY MIRROR
// whose single writer is mirror.mjs, which re-fetches verbatim gist bytes every morning.
// A local edit here would be a single-writer violation that the 06:55 mirror silently
// erased by breakfast. The captain's Option-A write path (§2 step 2b) is his paste into
// the gist, and "nothing auto-saves — Nikhil decides" is the rule right beside it.
// So `close` does the three things a machine legitimately can:
//   1. record the round in this organ's OWN append-only log (real timestamps),
//   2. emit the exact `reJirahDone` patch for his one-file gist replace, and
//   3. keep the round PENDING until the mirror brings the gist back down carrying it —
//      which is a real proof his paste landed, not an assumption that it did.
// That is the back edge closed through the master store, with no ownership broken.
//
// WHAT DEPENDS ON `reJirahDone` (why the pending-nag is not pedantry): fsrs.mjs
// (capsuleSeedReps) builds a concept's entire review history from lockedOn + these
// dates, deep.mjs (rejirahStatus) counts them for the round number, capsule_bridge.mjs
// derives done/overdue/due from
// them, dugout.mjs reports them and shipped.mjs:165 emits `rejirah_served` from them.
// Until the date reaches the gist, all five believe the round never happened.
//
// THE ARBITER (captain's ruling D4). Two schedulers used to emit dates and
// capsule_bridge could only report the disagreement. They were answering different
// questions:
//     FSRS (cards.json)  = WHEN a concept comes back.        <- scheduler of record
//     THIS FILE          = WHICH AXES, and HOW HARD.         <- never emits a concept date
// So there is no conflict left to resolve, only a division of labour to honour.
//
// LAWS: single writer of rejirah_log.jsonl · reads capsules READ-ONLY (mirror.mjs owns
//   them) · no LLM · no network · every threshold below is a v0 HYPOTHESIS and is either
//   taken from an organ that already owns it or derived from canon in the comment beside
//   it — none is invented.
// CLI: node scripts/rejirah.mjs [grade <concept> <axis> held|cracked [--gut w] [--cold false]|correct <concept> <axis> held|cracked --of <ts> --why "…"|close <concept> [--anyway]|pending|state [concept]|due|selftest]
//   (correct = a NEW row naming the old one — every verdict has a way back; due is the default)
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { preCyborg } from "./registry.mjs";   // W0-B — THE GAME-ON EPOCH: one reader, one predicate, no organ keeps its own copy

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = join(HERE, "..", "dressing-room", "state");
const CAPSULES = join(STATE, "capsules");
const LOG = join(STATE, "rejirah_log.jsonl");
const SESSIONS_LOG = join(STATE, "forge_sessions.jsonl");   // read-only here — forge_session.mjs owns it
const PROFILE = join(STATE, "forge_profile.json");
const CARDS = join(STATE, "cards.json");

const AXES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const RESULTS = ["held", "cracked"];
const GUTS = ["knew", "shaky", "guessed"];

// AXIS-TYPING (controller-v0 knob 2). NOT invented: each type is read straight off
// that axis's own definition in PROJECT_OS §THE 9 AXES. "kya hai" is a cold fact →
// recall. "kyun / reinvent the need from scratch", "mechanism", "math + RANGE" are all
// derive-live → reconstruct. "tradeoffs X-vs-Y", "one DEFENDABLE decision" and
// "explain 3 ways to a skeptical senior" are judgment under pressure → defend.
export const AXIS_TYPE = {
  a: "recall", b: "reconstruct", c: "reconstruct", d: "reconstruct",
  e: "recall", f: "defend", g: "defend", h: "recall", i: "defend",
};

// ROUND-MODE ESCALATION (knob 4) — the three modes canon already names.
//
// RE-WRITTEN 11 Aug 2026 ON HIS RULING. He read the old ladder — R1 "gentle cold",
// hard only by R3 — and called it what it was: "this is too pathetic, intensity
// increase karo pure revision process mein har ek cheez ki ... i am creating this
// organism to dominate the market."
//
// He is right, and the old wording had a specific defect: "gentle" is an
// INSTRUCTION. These strings are not labels for a dashboard — they ride into the
// Gaffer's round and into deep.mjs, and they tell the examiner how hard to press.
// A round-one probe described as gentle produces a gentle probe, which measures a
// gentle thing. Nobody interviews him gently.
//
// What did NOT change, because it is the measurement and not the intensity: the
// axes stay HIS nine, cold, gut-word first. Pressure is raised on the ASKING, never
// on the yardstick. And the count is unchanged at three entries: axisState clamps
// with min(roundsDone, len-1), so his 8-round genome runs R3's mode from round 3
// onward — the hardest mode becomes the standing mode, which is the point.
const ROUND_MODE = [
  "R1 (cold, no warm-up: the question as an interviewer would ask it — no scaffolding, no hints, no restating it easier; silence after the question until he answers)",
  "R-mid (adversarial: traps, counterfactuals, one interruption mid-answer, and 'why not the other way?' on every claim he makes)",
  "R-late (interview conditions: timed, axes mixed and out of order, cross-concept, follow-ups until he either defends it or concedes — the room does not move on because he sounded confident)",
];

// CALIBRATION TARGETS — borrowed verbatim from calibration.mjs, which owns them.
// Duplicating a number is how two organs drift; naming its owner is how they don't.
const GUT_TARGET = { knew: 0.95, shaky: 0.65, guessed: 0.30 };

// FLUENCY LADDER — the same rule learning_state.mjs applies to reps: 2 consecutive
// clean → held, 3 → fluent. Latency is not observable on a spoken cold round, so the
// 🟢 rung here is CONSECUTIVE-CLEAN only and says so; it never claims speed it did not
// measure.
const HELD_AT = 2, FLUENT_AT = 3;

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const nowIso = (d = new Date()) => d.toISOString();

// The log carries TWO row kinds in one append-only file, because they are one history:
// an axis GRADE (has `axis`) and a round CLOSE (has `kind:"round-close"`). Every derive
// below filters on the field it needs — `axisState` on `r.axis`, `confusionPairs` on
// `r.result` — so a close row is structurally invisible to the axis maths and can never
// be mistaken for a graded round.
// ── A CORRECTION IS A NEW ROW THAT NAMES THE OLD ONE (17 Aug 2026, BLOCK 4) ──
// Every judgement must have a way back, or one wrong verdict compounds through
// nemesis → FSRS → what he studies, forever. The log stays STRICTLY APPEND-ONLY:
// the original row survives on disk with its timestamp and is readable forever;
// a correction carries `corrects: "<the ts of the row it replaces>"`, and readers
// see the corrected truth. Same shape judge-night already uses for a Pass-1
// verdict, and the same shape doubtminer's un-retire uses — one law, three organs.
// Applied INSIDE readLog because that is the single door every consumer of this
// log already comes through (axisState, the edge map, the calibration gap, the due
// queue): a correction cannot be honoured in one derivation and missed in another.
export function supersede(rows) {
  const corrected = new Set((rows || []).map((r) => r && r.corrects).filter(Boolean));
  return (rows || []).filter((r) => !(r && r.ts && corrected.has(r.ts)));
}
export function readLog(path = LOG, opts = {}) {
  const out = [];
  try {
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.concept && (j.axis || j.kind)) out.push(j); } catch {}
    }
  } catch {}
  // `raw: true` is for anything that must SHOW the history rather than act on it —
  // the correction is only auditable if something can still see what was corrected.
  return opts.raw ? out : supersede(out);
}

export const isGrade = (r) => !!(r && r.axis && !r.kind);
export const isClose = (r) => !!(r && r.kind === "round-close");

export function loadCapsules(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f))).filter((c) => c && c.id)
    .sort((a, b) => String(a.num || "").localeCompare(String(b.num || "")));
}

// ── THE WRITE PATH ───────────────────────────────────────────────────────────
// VALIDATED BEFORE IT IS WRITTEN, in capture.mjs's spirit: a malformed row is
// refused loudly rather than appended and discovered months later. `cold` defaults
// true because controller-v0 knob 1 is ALWAYS-COLD — a warm round is the exception
// and must be declared, never assumed.
export function buildRow(input = {}, deps = {}) {
  const concept = String(input.concept || "").toLowerCase().trim();
  const axis = String(input.axis || "").toLowerCase().trim();
  const result = String(input.result || "").toLowerCase().trim();
  const gut = input.gut === undefined || input.gut === null ? null : String(input.gut).toLowerCase().trim();
  if (!concept) return { ok: false, why: "concept is required" };
  if (!AXES.includes(axis)) return { ok: false, why: `axis must be a single letter a-i (got "${input.axis}")` };
  if (!RESULTS.includes(result)) return { ok: false, why: `result must be held|cracked (got "${input.result}")` };
  if (gut !== null && !GUTS.includes(gut)) return { ok: false, why: `gut must be knew|shaky|guessed (got "${input.gut}")` };
  const known = deps.capsuleIds || loadCapsules().map((c) => c.id);
  const row = {
    ts: nowIso(deps.now ? new Date(deps.now) : new Date()),
    concept, axis, result,
    gut,                                   // null = no gut-word was committed. NEVER inferred from the result:
    cold: input.cold === false ? false : true,   // deriving it would force gut==result and kill the overconfidence signal.
    round: Number.isInteger(input.round) ? input.round : null,
    source: input.source || "deep",
  };
  return { ok: true, row, unregistered: !known.includes(concept) };
}

export function append(row, path = LOG) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(row) + "\n");
  return true;
}

// ── THE ROUND CLOSE (captain's ruling A, 5 Aug 2026) ─────────────────────────
// A round's due-dates are NOT stored anywhere — FORGE_SPEC §4 says "engine new Date() se
// compute, no stored countdown". This helper is a deliberate line-for-line mirror of
// capsule_bridge.mjs's rejirahRounds(): same ISO_DAY guard, same `done` SET keyed on the
// due-date, same ordering. Two organs computing one schedule two ways is the exact drift
// class this repo keeps finding, so the rule here is copy the owner, never re-derive.
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (isoDay, n) => new Date(Date.parse(`${isoDay}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function roundSchedule(capsule, intervals) {
  const locked = ISO_DAY.test(String(capsule && capsule.lockedOn || "")) ? capsule.lockedOn : null;
  if (!locked) return { ok: false, why: `"${capsule && capsule.id}" has no valid lockedOn — its Re-Jirah schedule cannot be computed, and inventing one would be a fabricated date.`, rounds: [] };
  const done = new Set((Array.isArray(capsule.reJirahDone) ? capsule.reJirahDone : []).filter((d) => ISO_DAY.test(String(d))));
  const rounds = intervals.map((n, i) => {
    const due = addDays(locked, n);
    return { round: i + 1, interval_days: n, due, done: done.has(due) };
  });
  // W0-B (2 Sep 2026) — THE SCHEDULE STILL COMPUTES; ONLY THE QUEUE STOPS.
  // roundSchedule stays pure arithmetic and still returns every round, because the
  // record must remain readable (L9: a pre-cyborg round is KEPT and LABELLED, never
  // dropped). The flag is what openRound below acts on.
  let pre = false;
  try { pre = preCyborg(capsule); } catch (e) { throw e; }   // an unreadable epoch must be LOUD, never a silent "no floor"
  return { ok: true, rounds, locked, pre_cyborg: pre };
}

// The round he is closing is the FIRST one not yet in `reJirahDone` — never the most
// overdue. Three rounds overdue means R1 is the one being sat, and jumping to R3 would
// silently mark two rounds served that never were.
export function openRound(capsule, intervals, opts = {}) {
  const s = roundSchedule(capsule, intervals);
  if (!s.ok) return { ok: false, why: s.why };
  // W0-B (2 Sep 2026) — GAME ON IS A CODE PATH NOW (LR-02/SD-02, his own L4).
  // A Re-Jirah is a COLD TEST OF A PROOF. On 30 Aug he withdrew the proof for every
  // pre-epoch lock, so a round scheduled off one tests something that no longer exists
  // — and it was WINNING: `deep.mjs due` read "Tokenization · R2 · 71d overdue" and the
  // arbiter carried "R2 tokenization 71d ripe (+3 more)" as its next claim.
  // ⚠ THE NOTES ARE NOT WITHDRAWN, ONLY THE PROOF IS (his correction, canon b40e585d):
  // the capsule stays IMMUTABLE and stays the teaching resource. This closes the QUEUE,
  // it does not close the capsule, and it deletes nothing — the rounds are still returned
  // by roundSchedule and still printable as record.
  // HIS WORD REOPENS IT: `opts.anyway` (the CLI's existing --anyway door). A schedule
  // that cannot be overridden by the captain is a schedule that owns him.
  if (s.pre_cyborg && !opts.anyway) {
    return { ok: false, pre_cyborg: true, complete: false, rounds: s.rounds,
      why: `'${capsule && capsule.id}' ka lock ${s.locked} ka hai — GAME ON (30 Aug) se pehle. Us proof ko tumne khud withdraw kiya tha, to yeh round ek aise saboot ko test karega jo ab hai hi nahi. Notes poore rakhe hain — sirf saboot hata hai. Concept dobara lock hoga to schedule khud se restart ho jayega.` };
  }
  const open = s.rounds.find((r) => !r.done);
  if (!open) return { ok: false, why: `every scheduled round is already in reJirahDone (${s.rounds.length}/${s.rounds.length} served) — FORGE_SPEC schedules ${intervals.join("d / ")}d and no more.`, complete: true };
  return { ok: true, ...open, total: s.rounds.length, pre_cyborg: !!s.pre_cyborg };
}

// VALIDATED BEFORE IT IS WRITTEN, like buildRow. A close row records the round, the
// canonical DUE-date it closes, and which axes were actually graded into it — so a year
// from now the log alone answers "what did that round consist of".
export function buildCloseRow(input = {}, deps = {}) {
  const concept = String(input.concept || "").toLowerCase().trim();
  if (!concept) return { ok: false, why: "concept is required" };
  if (!ISO_DAY.test(String(input.due || ""))) return { ok: false, why: `due must be an ISO day (got "${input.due}")` };
  if (!Number.isInteger(input.round) || input.round < 1) return { ok: false, why: `round must be a positive integer (got "${input.round}")` };
  return {
    ok: true,
    row: {
      ts: nowIso(deps.now ? new Date(deps.now) : new Date()),
      concept, kind: "round-close",
      round: input.round,
      // CANON SEMANTICS: the DUE-date, not the day he sat it (FORGE_SPEC §4 write path:
      // "Claude reJirahDone mein woh DUE-DATE add karta"). This is not cosmetic —
      // capsule_bridge tests `done.has(due)`, so recording today's date on an overdue
      // round would leave that round reading "overdue" forever. The real sitting time is
      // never lost: it is this row's own `ts` and every grade row's `ts`.
      due: input.due,
      axes_graded: Array.isArray(input.axes) ? [...new Set(input.axes)].sort() : [],
      forced: !!input.forced,
    },
  };
}

// ── THE PENDING LEDGER (the proof, not the assumption) ───────────────────────
// A close he ran is only HALF the write. The other half is his paste into the gist, and
// the machine can VERIFY it rather than trust it: mirror.mjs re-fetches the gist every
// morning, so once the date appears in the local mirror's `reJirahDone`, the paste
// provably landed. Until then the round is PENDING and says so — the whole failure mode
// this repo keeps hitting is work that happened but never reached the state everything
// else reads.
export function pendingCloses(caps, rows) {
  const byId = new Map(caps.map((c) => [c.id, c]));
  const out = [];
  for (const r of rows.filter(isClose)) {
    const cap = byId.get(r.concept);
    const landed = !!(cap && Array.isArray(cap.reJirahDone) && cap.reJirahDone.includes(r.due));
    if (!landed) out.push({ concept: r.concept, round: r.round, due: r.due, closed_at: r.ts, known_capsule: !!cap });
  }
  return out.sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at)));
}

// ── SUCCESSIVE-RELEARNING (canon's own criterion for "this round is done") ───
// PROJECT_OS.md §LEARNING EXECUTION LAYER, Ceiling-additions: "SUCCESSIVE-RELEARNING
// criterion (har round har due-axis 'cold ek baar sahi' zaroori = us session done)".
// Not a threshold I chose — canon's, quoted. An axis counts as satisfied when it was HELD
// at least once in this round; a crack does NOT satisfy it (the whole point of the
// criterion is one clean cold retrieval, not one attempt). Axes that were not due are not
// owed anything, so they are never listed — a criterion that nags about ground that was
// never scheduled is just noise.
export function successiveRelearning(capsule, rows, intervals, since = "", now = new Date()) {
  const mine = rows.filter((r) => isGrade(r) && r.concept === capsule.id);
  // DUE-NESS IS MEASURED BEFORE THIS ROUND, NOT AFTER — found by its own selftest, 5 Aug.
  // Deriving it from ALL rows lets this round's own grades answer the question: a crack
  // resets the interval to +3d, so the axis reads "not due", drops out of `owed`, and the
  // criterion silently forgives exactly the axis that just failed. Same trap with a hold.
  // The question is "was this axis owed COMING IN", so only prior grades may answer it.
  const prior = mine.filter((r) => String(r.ts) <= since);
  const thisRound = mine.filter((r) => String(r.ts) > since);
  const owed = [], missing = [];
  for (const axis of AXES) {
    const st = axisState(capsule, axis, prior, intervals, now);
    if (!(st.overdueDays !== null && st.overdueDays > 0)) continue;   // not due → not owed
    owed.push(axis);
    if (!thisRound.some((r) => r.axis === axis && r.result === "held")) missing.push(axis);
  }
  return { met: owed.length > 0 && missing.length === 0, owed, missing };
}

// The patch is the WHOLE `reJirahDone` array, because that is what he replaces in the
// one file (FORGE_SPEC §2 step 2b). Sorted + de-duplicated: fsrs.mjs:144-154 carries a
// scar from exactly this — a duplicated gist entry replayed as two reviews at the same
// instant and pushed the card's due date past what his history earned.
export function gistPatch(capsule, dueDates) {
  const merged = [...new Set([...(Array.isArray(capsule.reJirahDone) ? capsule.reJirahDone : []), ...dueDates])]
    .filter((d) => ISO_DAY.test(String(d))).sort();
  return { field: "reJirahDone", value: merged, json: `  "reJirahDone": ${JSON.stringify(merged)},` };
}

// ── THE DERIVED STATE (the reserved fields, computed not stored) ─────────────
// PER-AXIS ADAPTIVE INTERVAL (knob 3, SM-2-lite): a clean hold EXPANDS to the next
// interval in the profile's ladder; a crack RESETS to the first. Global +3d/+2wk/+6wk
// is replaced per axis, which is the whole point of the knob. With no history at all
// the axis inherits the capsule's own lockedOn schedule, so a never-graded axis is
// never silently treated as fresh.
export function axisState(capsule, axis, rows, intervals, now = new Date()) {
  // isGrade() is belt-and-braces beside `r.axis === axis`: a close row has no axis and is
  // already excluded, but stating the row KIND means a future row shape can never drift
  // into the ladder maths by accident.
  const hist = rows.filter((r) => isGrade(r) && r.concept === capsule.id && r.axis === axis)
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const last = hist.length ? hist[hist.length - 1] : null;

  let streak = 0;
  for (let i = hist.length - 1; i >= 0; i--) { if (hist[i].result === "held") streak++; else break; }
  const fluencyState = streak >= FLUENT_AT ? "🟢 fluent (consecutive-clean only — speed not measured here)"
    : streak >= HELD_AT ? "🟡 held" : "🔴 learning";

  // CALIBRATION-GAP as a control signal (controller-v0 mechanic 2): confident AND
  // cracked is the dangerous illusion, so it tightens the interval and bumps the mode.
  let calibrationGap = null;
  if (last && last.gut) {
    const gap = +(GUT_TARGET[last.gut] - (last.result === "held" ? 1 : 0)).toFixed(2);
    calibrationGap = { gut: last.gut, result: last.result, gap,
      flag: last.gut === "knew" && last.result === "cracked" ? "OVERCONFIDENT — tighten + bump mode"
        : last.gut === "guessed" && last.result === "held" ? "underconfident — he knows more than he claims"
        : "aligned" };
  }

  // The rung is the CONSECUTIVE-hold streak, not the lifetime hold count: an axis that
  // held twice, cracked, then held once is on rung 1 — the crack really did cost the
  // ground it had gained, which is the point of a reset.
  const idx = Math.min(Math.max(0, streak - 1), intervals.length - 1);
  let nextDue = null, overdueDays = null;
  if (last) {
    // GRADED AXIS — the per-axis ladder owns it, anchored on its own last round. Unchanged.
    const anchor = new Date(last.ts);
    if (!Number.isNaN(anchor.getTime())) {
      const step = last.result === "cracked" ? intervals[0] : intervals[idx];
      const d = new Date(anchor.getTime() + step * 86400000);
      nextDue = d.toISOString().slice(0, 10);
      overdueDays = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
    }
  } else {
    // UNGRADED AXIS — THE CAPSULE'S OWN ROUND SCHEDULE OWNS IT (audit #108, 6 Aug 2026).
    //
    // WHAT WAS WRONG. This branch used to be `new Date(String(capsule.lockedOn || "") +
    // "T00:00:00Z")` + intervals[0] — lockedOn + the FIRST interval, forever, with
    // `reJirahDone` never read at all. MEASURED on his live mirror today: tokenization is
    // locked 2026-06-15 carrying reJirahDone ["2026-06-18","2026-06-29"], and all nine of
    // its axes printed "due 2026-06-18 (49d overdue)" — R1's date — three lines above the
    // SAME screen's own "rounds → R1 2026-06-18 ✓ · R2 2026-06-29 ✓". One screen, two
    // answers, and the louder one nagged him to re-sit two rounds he had already served.
    // capsule_map.json (next_due 2026-07-27, overdue 9) and `deep.mjs due` (R3) both said
    // R3 at the same instant, so this file was the odd one out, not the other two.
    //
    // WHY THE FIX IS A DELEGATION, NOT A NEW SUM. An axis with no history of its own has
    // no per-axis ladder to stand on — its schedule IS the capsule's, and roundSchedule()
    // above is this file's deliberate line-for-line mirror of capsule_bridge.mjs, which
    // owns that schedule. Copy the owner, never re-derive (the rule stated at the top of
    // the ROUND CLOSE block). Its ISO_DAY filter is also the guard on junk: an unparseable
    // entry in reJirahDone is dropped, never parsed into a moved anchor.
    //
    // THE EMPTY-ARRAY CASE IS BYTE-IDENTICAL to the old line: with reJirahDone [] the first
    // unserved round IS R1 = lockedOn + intervals[0]. Only capsules that have actually
    // served a round move, which is the whole bug.
    //
    // ALL ROUNDS SERVED + NEVER GRADED = NO DATE, deliberately. Canon schedules three
    // rounds and openRound() "refuses to invent a fourth"; a fabricated 4th due-date would
    // be exactly the invented number this repo forbids. The axis comes back the moment a
    // real grade lands and the ladder above takes over.
    const sch = roundSchedule(capsule, intervals);
    const open = sch.ok ? sch.rounds.find((r) => !r.done) : null;
    if (open) {
      nextDue = open.due;
      overdueDays = Math.max(0, Math.floor((now.getTime() - Date.parse(`${open.due}T00:00:00Z`)) / 86400000));
    }
  }
  const roundsDone = hist.length;
  return {
    axis,
    axisType: AXIS_TYPE[axis],
    rounds: roundsDone,
    lastResult: last ? last.result : null,
    lastAt: last ? last.ts : null,
    streak,
    fluencyState,
    calibrationGap,
    nextDue,
    overdueDays,
    mode: ROUND_MODE[Math.min(roundsDone, ROUND_MODE.length - 1)],
    // A confident crack is the one case canon says to escalate immediately.
    escalate: !!(calibrationGap && calibrationGap.flag.startsWith("OVERCONFIDENT")),
  };
}

export function conceptState(capsule, rows, intervals, now = new Date()) {
  const axes = AXES.map((a) => axisState(capsule, a, rows, intervals, now));
  // EDGE-MAP — the honest knowledge boundary, DERIVED: an axis he has held cold is one
  // he can defend; one never graded is not a weakness, it is simply unmeasured, and
  // saying so is the difference between an edge-map and a shame-list.
  const edgeMap = {
    can_defend: axes.filter((x) => x.lastResult === "held").map((x) => x.axis),
    cracked: axes.filter((x) => x.lastResult === "cracked").map((x) => x.axis),
    unmeasured: axes.filter((x) => x.rounds === 0).map((x) => x.axis),
  };
  // CONFUSION-PAIRS stay null until there is real cross-concept error data. Bias to
  // silence: one false alarm is worse than one missed alarm (the repo's own rule).
  const cracked = rows.filter((r) => isGrade(r) && r.result === "cracked");
  const distinct = new Set(cracked.map((r) => r.concept));
  const confusionPairs = (cracked.length >= 6 && distinct.size >= 2)
    ? [...distinct].slice(0, 4).map((c) => ({ with: c, seen: cracked.filter((r) => r.concept === c).length }))
    : null;
  return {
    concept: capsule.id, lockedOn: capsule.lockedOn || null, axes, edgeMap, confusionPairs,
    confusion_gate: confusionPairs ? null : `needs >=6 cracked rows across >=2 concepts (have ${cracked.length} / ${distinct.size})`,
  };
}

// ── THE ARBITER (D4) ─────────────────────────────────────────────────────────
// FSRS says WHEN. This says WHICH AXES and HOW HARD. It reads cards.json but never
// writes a concept-level date of its own, so the two worlds can no longer disagree —
// they answer different questions by construction.
export function dueReport(caps, rows, intervals, cards, now = new Date()) {
  const byConcept = new Map();
  const hardest = (cards && Array.isArray(cards.hardest_due)) ? cards.hardest_due : [];
  for (const c of caps) {
    const st = conceptState(c, rows, intervals, now);
    const axes = st.axes.filter((a) => a.overdueDays !== null && a.overdueDays > 0)
      .sort((a, b) => (b.escalate - a.escalate) || (b.overdueDays - a.overdueDays));
    if (axes.length) byConcept.set(c.id, { concept: c.id, axes, fsrs_rank: hardest.indexOf(c.id) });
  }
  // Order by FSRS's opinion when it has one (it owns WHEN), else by depth of overdue.
  return [...byConcept.values()].sort((a, b) => {
    const ar = a.fsrs_rank < 0 ? 99 : a.fsrs_rank, br = b.fsrs_rank < 0 ? 99 : b.fsrs_rank;
    return ar - br || (b.axes[0].overdueDays - a.axes[0].overdueDays);
  });
}

// THE AXES PAST THE CAP ARE COUNTED AND NAMED (audit #108, 6 Aug 2026).
// WHAT WAS WRONG: the `due` renderer printed `r.axes.slice(0, 4)` and then nothing — no
// remainder, no count. MEASURED today on all four locked capsules: 9 axes due on each, 4
// rendered, so the one screen that calls itself the authority on WHICH AXES under-reported
// by 56% and read as "four things to do". The cut is not even random TODAY — every axis is
// ungraded and ties on overdue, so dueReport's sort is stable and a-d render first, which
// hides exactly e f g h i, and f/g/i are the ENTIRE `defend` tier in AXIS_TYPE above: the
// cap was hiding precisely the hardest axes. (Review pass, audit #108: that "a-d first" is a
// property of today's all-ungraded state, NOT an invariant — the sort is
// `escalate desc, overdueDays desc`, so one confident-crack on g reorders it to g a b c and
// the hidden five become d e f h i. Which is why the line below reads the real sorted array
// rather than assuming letters; do not re-derive the remainder from the alphabet.)
// THE CAP ITSELF STAYS (deep.mjs's rule 17 — "DEEPER, NEVER LONGER"; this screen is a
// triage list, not a 36-axis dump, and picking a bigger cap would be inventing a number).
// What changes is that the remainder is stated out loud, with the command that opens it.
// Returns null when nothing is hidden, so a short list prints exactly as it always did.
export function moreAxesLine(axes, concept, shown) {
  const hidden = (Array.isArray(axes) ? axes : []).slice(shown);
  if (!hidden.length) return null;
  return `   … +${hidden.length} more due: ${hidden.map((a) => `${a.axis}·${a.axisType}`).join(" ")}`
    + `   → poori list: \`node scripts/rejirah.mjs state ${concept}\``;
}

// ── THE DEFERRED CARRY (dead-wire repair, 11 Aug 2026) ───────────────────────
// WHAT WAS DEAD. forge_session.mjs's LAWS say, verbatim: "Deferred is not dropped: axes
// marked `defer` are reported at close so Re-Jirah can pick them up (THE METHOD step 0 —
// 'deferred ≠ dropped')". This organ IS Re-Jirah, and it had never read the field once.
// MEASURED 11 Aug 2026: `grep -rn axes_deferred scripts/` returned brain.mjs,
// forge_session.mjs, learning_state.mjs, teaching_audit.mjs — four organs that RENDER the
// field, not one that QUEUES it — and this file was absent from that list entirely. Its
// axis universe is the fixed a-i of a LOCKED capsule (dueReport iterates loadCapsules()),
// so on a concept that never locks a deferred axis entered no queue anywhere: BEFORE lock,
// `defer` was functionally `drop`, which is the one thing the law says it is not. All 8
// rows in forge_sessions.jsonl today are `hallucinations`, and hallucinations has no
// capsule — so the only concept he has actually worked is exactly the uncovered case.
//
// WHY THIS IS A BACKLOG AND NOT A DUE-DATE. An interval schedule is earned at LOCK —
// roundSchedule() refuses without `lockedOn` and says so, because inventing a lock day
// would be a fabricated date. A deferred axis on an unlocked concept has no day to count
// from. So the carry reports only what the data already says: which axis, its type (from
// AXIS_TYPE above, which is read off PROJECT_OS), the moment it was deferred, and how long
// ago that was. No due-date, no interval, no age cutoff, no threshold of any kind.
//
// WHAT CLEARS AN AXIS OFF THE CARRY — both are real pick-ups, nothing else counts:
//   1. it is re-marked `done` in a later forge session (markAxis MOVES it between the two
//      lists, so the newest event for that axis simply stops being a defer), or
//   2. it is graded cold here — a rejirah grade row for that concept+axis AFTER the defer.
// A defer never expires on its own. Age is reported; age is not a clearing rule.
export function readSessions(path = SESSIONS_LOG) {
  const out = [];
  try {
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.concept) out.push(j); } catch {}
    }
  } catch {}
  return out;
}

export function deferredCarry(history, live, caps, rows, now = new Date()) {
  const capIds = new Set((caps || []).map((c) => c && c.id).filter(Boolean));
  const grades = (rows || []).filter(isGrade);
  // ONE EVENT PER (concept, axis) MARK, timestamped. The per-axis stamp is the honest
  // clock — forge's markAxis writes `axes_marked_at[axis].at` and the CLI passes no time
  // from argv, so it cannot be typed in. `ended_at`/`updated_at` is the fallback for the
  // older rows written before that stamp existed (the first history row's map is `{}`).
  const events = [];
  const collect = (row, fallbackTs, isLive) => {
    if (!row || !row.concept) return;
    const marks = row.axes_marked_at || {};
    const at = (a) => (marks[a] && marks[a].at) || fallbackTs || "";
    for (const a of (Array.isArray(row.axes_done) ? row.axes_done : [])) {
      if (AXES.includes(a)) events.push({ concept: row.concept, axis: a, kind: "done", at: at(a), live: !!isLive });
    }
    for (const a of (Array.isArray(row.axes_deferred) ? row.axes_deferred : [])) {
      if (AXES.includes(a)) events.push({ concept: row.concept, axis: a, kind: "defer", at: at(a), live: !!isLive });
    }
  };
  for (const r of (history || [])) collect(r, r.ended_at || r.updated_at || r.started_at, false);
  // THE LIVE SESSION COUNTS THE MOMENT IT IS FILED, same rule the teaching-contract runs on:
  // a session that is abandoned instead of closed never reaches the history file at all, and
  // that is precisely the run whose defers would otherwise vanish. It is marked LIVE on the
  // screen so nobody reads an open claim as a closed one.
  if (live && live.concept) collect(live, live.updated_at || live.started_at, true);

  const last = new Map();
  for (const e of events) {
    const k = `${e.concept} ${e.axis}`;
    const prev = last.get(k);
    if (!prev || String(e.at) >= String(prev.at)) last.set(k, e);   // ISO strings sort as time
  }

  const byConcept = new Map();
  for (const e of last.values()) {
    if (e.kind !== "defer") continue;
    // Graded cold since the defer = Re-Jirah DID pick it up. That is the wire working, and
    // a carry that kept nagging afterwards would be teaching him to ignore the screen.
    const pickedUp = grades.some((g) => g.concept === e.concept && g.axis === e.axis && String(g.ts) > String(e.at));
    if (pickedUp) continue;
    const ms = Date.parse(e.at);
    const ageDays = Number.isFinite(ms) ? Math.floor((now.getTime() - ms) / 86400000) : null;
    const entry = { axis: e.axis, axisType: AXIS_TYPE[e.axis], at: e.at || null, ageDays, live: e.live };
    if (!byConcept.has(e.concept)) byConcept.set(e.concept, { concept: e.concept, locked: capIds.has(e.concept), axes: [] });
    byConcept.get(e.concept).axes.push(entry);
  }
  // Oldest defer first — derived from the rows themselves, not from a ranking constant.
  for (const c of byConcept.values()) c.axes.sort((a, b) => String(a.at).localeCompare(String(b.at)) || a.axis.localeCompare(b.axis));
  return [...byConcept.values()].sort((a, b) => String(a.axes[0].at).localeCompare(String(b.axes[0].at)));
}

// The carry's own screen block, shared by `due` and `state` so the two can never drift.
export function carryLines(carry) {
  const L = [];
  if (!carry.length) return L;
  L.push(`\n== DEFERRED, NOT DROPPED ==   (forge ne \`defer\` kiya — ab Re-Jirah tak pahunchta hai · koi due-date nahi: lock ke bina woh gadha hua number hota)\n`);
  for (const c of carry) {
    L.push(`${c.concept}${c.locked ? "" : "   [NOT LOCKED — iska koi interval schedule nahi; yeh line hi iska poora queue hai]"}`);
    for (const a of c.axes) {
      L.push(`   ${a.axis} · ${String(a.axisType).padEnd(11)} deferred ${String(a.at || "?").slice(0, 10)}`
        + (a.ageDays === null ? "" : ` (${a.ageDays}d ago)`)
        + (a.live ? "   · LIVE session, abhi khuli hui" : ""));
    }
    L.push(`   → padhake band karo: \`node scripts/forge_session.mjs axis <axis> done\`   ·   ya cold uthao: \`node scripts/rejirah.mjs grade ${c.concept} <axis> held|cracked --gut <word>\``);
    L.push("");
  }
  return L;
}

function intervalsOf() {
  const p = readJson(PROFILE) || {};
  return Array.isArray(p.rejirah_intervals_days) && p.rejirah_intervals_days.length
    ? p.rejirah_intervals_days : [3, 14, 42];
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };
  const IV = [3, 14, 42];
  const NOW = new Date("2026-08-05T12:00:00Z");
  const cap = { id: "embeddings", lockedOn: "2026-06-21" };
  const row = (axis, result, gut, ts) => ({ concept: "embeddings", axis, result, gut, cold: true, ts });

  assert("VALIDATION — a good row is built and stamped",
    buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"] }).ok);
  assert("VALIDATION — axis must be ONE letter a-i; the literal 'a-i' is refused (capture.mjs's own scar)",
    !buildRow({ concept: "e", axis: "a-i", result: "held" }).ok && !buildRow({ concept: "e", axis: "z", result: "held" }).ok);
  assert("VALIDATION — result must be held|cracked, gut must be a real gut-word",
    !buildRow({ concept: "e", axis: "a", result: "ok" }).ok
    && !buildRow({ concept: "e", axis: "a", result: "held", gut: "fine" }).ok);
  assert("ALWAYS-COLD is the DEFAULT (knob 1) and a warm round must be declared",
    buildRow({ concept: "e", axis: "a", result: "held" }).row.cold === true
    && buildRow({ concept: "e", axis: "a", result: "held", cold: false }).row.cold === false);
  assert("GUT IS NEVER INFERRED — no gut-word stays null, it is not back-filled from the result",
    buildRow({ concept: "e", axis: "a", result: "held" }).row.gut === null);
  assert("UNREGISTERED IS FLAGGED, never silently accepted",
    buildRow({ concept: "ghost", axis: "a", result: "held" }, { capsuleIds: ["embeddings"] }).unregistered === true);

  const clean2 = [row("a", "held", "shaky", "2026-07-01T00:00:00Z"), row("a", "held", "knew", "2026-07-20T00:00:00Z")];
  const s2 = axisState(cap, "a", clean2, IV, NOW);
  assert("LADDER — two consecutive holds reach 🟡, three reach 🟢",
    s2.fluencyState.startsWith("🟡")
    && axisState(cap, "a", [...clean2, row("a", "held", "knew", "2026-07-30T00:00:00Z")], IV, NOW).fluencyState.startsWith("🟢"));
  assert("LADDER — a crack breaks the streak back to 🔴",
    axisState(cap, "a", [...clean2, row("a", "cracked", "knew", "2026-08-01T00:00:00Z")], IV, NOW).fluencyState.startsWith("🔴"));
  assert("KNOB 3 — a clean hold EXPANDS the interval, a crack RESETS it to the first rung",
    (() => {
      const held = axisState(cap, "a", clean2, IV, NOW).nextDue;
      const crk = axisState(cap, "a", [...clean2, row("a", "cracked", "shaky", "2026-08-01T00:00:00Z")], IV, NOW).nextDue;
      return held === "2026-08-03" && crk === "2026-08-04";   // 20 Jul +14 vs 1 Aug +3
    })());
  assert("KNOB 2 — axis typing comes off the axis definitions (d reconstructs, f defends, a recalls)",
    AXIS_TYPE.d === "reconstruct" && AXIS_TYPE.f === "defend" && AXIS_TYPE.a === "recall");
  assert("MECHANIC 2 — confident-and-cracked is flagged OVERCONFIDENT and escalates",
    (() => { const s = axisState(cap, "a", [row("a", "cracked", "knew", "2026-08-01T00:00:00Z")], IV, NOW);
      return s.calibrationGap.flag.startsWith("OVERCONFIDENT") && s.escalate === true; })());
  assert("MECHANIC 2 — guessed-and-held reads as UNDER-confident, not as a win to inflate",
    axisState(cap, "a", [row("a", "held", "guessed", "2026-08-01T00:00:00Z")], IV, NOW).calibrationGap.flag.startsWith("underconfident"));
  assert("NO GUT-WORD -> NO GAP (never fabricated)",
    axisState(cap, "a", [row("a", "held", null, "2026-08-01T00:00:00Z")], IV, NOW).calibrationGap === null);
  // Pinned on the ESCALATION and on ROUND_MODE itself, not on the label text: the
  // 11 Aug intensity rewrite broke this assertion precisely because it matched the
  // string "R-early", which was wording, not behaviour. Wording will change again.
  assert("KNOB 4 — the round mode escalates with rounds done, and lands on the LAST (hardest) mode",
    axisState(cap, "a", [], IV, NOW).mode === ROUND_MODE[0]
    && axisState(cap, "a", clean2, IV, NOW).mode === ROUND_MODE[ROUND_MODE.length - 1]);
  // His 8-round genome runs past the mode array on purpose — the hardest mode must
  // become the STANDING mode, never an index error or a silent drop to gentle.
  assert("KNOB 4 — past the last mode it CLAMPS to the hardest, never wraps back to round one",
    axisState(cap, "a", clean2, IV, NOW).mode === ROUND_MODE[2]);
  // Narrowed to the word he actually objected to. The first draft of this check
  // banned "warm-up" too and failed on the new text's own "no warm-up" — a
  // substring cannot tell a promise from its negation, and a check that fires on
  // the fix it is meant to protect is worse than no check.
  assert("INTENSITY (his 11 Aug ruling) — no round is described as gentle, and round one asks it as an interviewer would",
    !/gentle/i.test(ROUND_MODE.join(" ")) && /interviewer would ask/i.test(ROUND_MODE[0]));
  assert("NEVER-GRADED — an ungraded axis inherits the capsule's own lockedOn schedule, never 'fresh'",
    (() => { const s = axisState(cap, "b", [], IV, NOW); return s.rounds === 0 && s.nextDue === "2026-06-24" && s.overdueDays > 40; })());

  const cs = conceptState(cap, clean2, IV, NOW);
  assert("EDGE-MAP — derived: what he can defend, what cracked, what is simply UNMEASURED",
    cs.edgeMap.can_defend.includes("a") && cs.edgeMap.unmeasured.includes("b") && !cs.edgeMap.unmeasured.includes("a"));
  assert("CONFUSION-PAIRS stay null behind their gate, and the gate says have/need",
    cs.confusionPairs === null && /have 0 \/ 0/.test(cs.confusion_gate));
  assert("THE CAPSULE IS NEVER MUTATED — the input object is byte-identical after a full derive",
    JSON.stringify(cap) === JSON.stringify({ id: "embeddings", lockedOn: "2026-06-21" }));

  const caps = [cap, { id: "inference", lockedOn: "2026-06-24" }];
  const rep = dueReport(caps, clean2, IV, { hardest_due: ["inference", "embeddings"] }, NOW);
  assert("ARBITER — FSRS owns the ORDER of concepts; this organ only supplies axes + mode",
    rep[0].concept === "inference" && rep.every((r) => !("nextDue" in r)));
  assert("A FRESH CRACK IS NOT INSTANTLY OVERDUE — the reset schedules it TIGHT (3d), it does not nag today",
    (() => { const s = axisState(cap, "c", [row("c", "cracked", "knew", "2026-08-04T00:00:00Z")], IV, NOW);
      return s.nextDue === "2026-08-07" && s.overdueDays === 0 && s.escalate === true; })());
  assert("ARBITER — within a concept, an escalated (confident-crack) axis outranks a MORE overdue but unmeasured one",
    (() => { const rows = [row("c", "cracked", "knew", "2026-07-01T00:00:00Z")];
      const r = dueReport([cap], rows, IV, {}, NOW);           // axis b is 42d overdue, axis c is 32d + escalated
      const b = r[0].axes.find((x) => x.axis === "b");
      return r[0].axes[0].axis === "c" && b && b.overdueDays > r[0].axes[0].overdueDays; })());
  assert("EMPTY LOG — no rows means every axis falls back to the capsule schedule, never a crash",
    dueReport(caps, [], IV, null, NOW).length === 2);
  // audit #108 — the `due` screen renders only 4 axes; the other 5 must be COUNTED and NAMED.
  assert("DUE SCREEN — the axes past the 4-line cap are counted and named, never silently dropped",
    (() => { const r = dueReport([cap], [], IV, {}, NOW)[0];
      const line = moreAxesLine(r.axes, r.concept, 4);
      return r.axes.length === 9 && /\+5 more due/.test(line)
        && ["e", "f", "g", "h", "i"].every((x) => line.includes(`${x}·`))
        && line.includes("rejirah.mjs state embeddings"); })());
  assert("DUE SCREEN — nothing hidden means NO extra line (a short list prints exactly as before)",
    moreAxesLine([{ axis: "a", axisType: "recall" }], "embeddings", 4) === null && moreAxesLine(null, "x", 4) === null);
  assert("READER IS SAFE — a missing log file reads as zero rows",
    readLog(join(HERE, "__no_such_log__.jsonl")).length === 0);
  // UNRUN = HYPOTHESIS. The write path is exercised for real, against a temp file, so
  // "the loop now has a back edge" is a demonstrated fact and not a claim in a comment.
  assert("THE BACK EDGE — a graded round is appended, read back, and CHANGES the derived state",
    (() => {
      const p = join(mkdtempSync(join(tmpdir(), "rejirah-")), "log.jsonl");
      const before = axisState(cap, "a", readLog(p), IV, NOW);
      const b1 = buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"], now: "2026-08-05T10:00:00Z" });
      append(b1.row, p);
      const after = axisState(cap, "a", readLog(p), IV, NOW);
      return before.rounds === 0 && before.lastResult === null
        && after.rounds === 1 && after.lastResult === "held" && after.nextDue === "2026-08-08"
        && readLog(p).length === 1;
    })());
  assert("APPEND-ONLY — a second grade adds a row and never rewrites the first",
    (() => {
      const p = join(mkdtempSync(join(tmpdir(), "rejirah2-")), "log.jsonl");
      append(buildRow({ concept: "embeddings", axis: "a", result: "cracked", gut: "knew", now: "2026-07-01T00:00:00Z" }, { capsuleIds: ["embeddings"], now: "2026-07-01T00:00:00Z" }).row, p);
      append(buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"], now: "2026-08-05T10:00:00Z" }).row, p);
      const rows = readLog(p);
      return rows.length === 2 && rows[0].result === "cracked" && rows[1].result === "held";
    })());

  // ── THE ROUND CLOSE (ruling A) ─────────────────────────────────────────────
  // REAL DATA, not a fixture: tokenization is locked 2026-06-15 and its gist carries
  // reJirahDone ["2026-06-18","2026-06-29"]. lockedOn+3 and lockedOn+14 are exactly those
  // two dates, which is the live proof that canon stores the DUE-date and that this
  // schedule agrees with capsule_bridge.mjs's on his actual capsule.
  const TOK = { id: "tokenization", lockedOn: "2026-06-15", reJirahDone: ["2026-06-18", "2026-06-29"] };
  const sch = roundSchedule(TOK, IV);
  assert("SCHEDULE — computed off lockedOn, and it reproduces his REAL tokenization dates",
    sch.ok && sch.rounds.map((r) => r.due).join(",") === "2026-06-18,2026-06-29,2026-07-27"
    && sch.rounds[0].done && sch.rounds[1].done && !sch.rounds[2].done);
  assert("SCHEDULE — no valid lockedOn means NO schedule, never a fabricated date",
    !roundSchedule({ id: "x" }, IV).ok && !roundSchedule({ id: "x", lockedOn: "soon" }, IV).ok);
  // ANCHOR (audit #108) — the ungraded-axis schedule must agree with the capsule's own
  // round line on the SAME screen. Pinned on the real tokenization capsule, because that is
  // the one that contradicted itself in production.
  assert("ANCHOR — an ungraded axis on a capsule with SERVED rounds schedules the open round (R3), not R1 all over again",
    (() => { const s = axisState(TOK, "a", [], IV, NOW);
      return s.rounds === 0 && s.nextDue === "2026-07-27" && s.overdueDays === 9; })());   // capsule_map.json says 9 too
  assert("ANCHOR — reJirahDone [] is UNCHANGED: still R1 = lockedOn + the first interval",
    axisState({ id: "x", lockedOn: "2026-06-21", reJirahDone: [] }, "a", [], IV, NOW).nextDue === "2026-06-24");
  assert("ANCHOR — junk dates cannot move it (ISO_DAY guard), and a real grade still outranks the capsule schedule",
    axisState({ ...TOK, reJirahDone: ["kal", "", "2026-13-45"] }, "a", [], IV, NOW).nextDue === "2026-06-18"
    && axisState(TOK, "a", [{ concept: "tokenization", axis: "a", result: "held", gut: "shaky", cold: true, ts: "2026-07-20T00:00:00Z" }], IV, NOW).nextDue === "2026-07-23");
  assert("ANCHOR — all three rounds served and never graded = NO date, never a fabricated 4th round",
    (() => { const s = axisState({ ...TOK, reJirahDone: ["2026-06-18", "2026-06-29", "2026-07-27"] }, "a", [], IV, NOW);
      return s.nextDue === null && s.overdueDays === null; })());

  // W0-B (2 Sep 2026): these five ask about the SCHEDULE ARITHMETIC, and every fixture
  // below is deliberately pre-epoch (June dates, chosen when they were written). The
  // GAME-ON gate now closes the queue on such a capsule, so they pass `{ anyway: true }`
  // — his own override door — to keep asking the arithmetic question. The gate itself is
  // asserted separately, right below them.
  assert("OPEN ROUND — the FIRST unserved round, never the most overdue (R1 before R3)",
    (() => { const o = openRound(cap, IV, { anyway: true }); return o.ok && o.round === 1 && o.due === "2026-06-24"; })());
  assert("OPEN ROUND — with two served, the next one is R3, not R1 again",
    (() => { const o = openRound(TOK, IV, { anyway: true }); return o.ok && o.round === 3 && o.due === "2026-07-27" && o.total === 3; })());
  assert("OPEN ROUND — all three served reports COMPLETE, and refuses to invent a fourth",
    (() => { const o = openRound({ ...TOK, reJirahDone: ["2026-06-18", "2026-06-29", "2026-07-27"] }, IV, { anyway: true });
      return !o.ok && o.complete === true; })());

  assert("CLOSE ROW — validated: concept, an ISO due-day, and a positive round are all required",
    !buildCloseRow({ due: "2026-06-24", round: 1 }).ok
    && !buildCloseRow({ concept: "e", due: "soon", round: 1 }).ok
    && !buildCloseRow({ concept: "e", due: "2026-06-24", round: 0 }).ok
    && buildCloseRow({ concept: "e", due: "2026-06-24", round: 1 }).ok);
  assert("CLOSE ROW — records the canonical DUE-date while its own ts keeps the real sitting time",
    (() => { const b = buildCloseRow({ concept: "embeddings", due: "2026-06-24", round: 1, axes: ["c", "a", "a"] }, { now: "2026-08-05T10:00:00Z" });
      return b.row.due === "2026-06-24" && b.row.ts.startsWith("2026-08-05")
        && b.row.kind === "round-close" && b.row.axes_graded.join("") === "ac"; })());   // deduped + sorted

  const closeRow = buildCloseRow({ concept: "embeddings", due: "2026-06-24", round: 1, axes: ["a"] }, { now: "2026-08-05T10:00:00Z" }).row;
  assert("ROW KINDS — a grade is a grade, a close is a close, and neither answers for the other",
    isGrade(clean2[0]) && !isClose(clean2[0]) && isClose(closeRow) && !isGrade(closeRow));
  assert("CLOSE ROWS ARE INVISIBLE TO THE LADDER — a close never counts as a graded round",
    (() => { const withClose = axisState(cap, "a", [...clean2, closeRow], IV, NOW);
      const without = axisState(cap, "a", clean2, IV, NOW);
      return JSON.stringify(withClose) === JSON.stringify(without); })());
  assert("CLOSE ROWS ARE INVISIBLE TO CONFUSION-PAIRS (no `result` to be mistaken for a crack)",
    JSON.stringify(conceptState(cap, [...clean2, closeRow], IV, NOW).edgeMap)
    === JSON.stringify(conceptState(cap, clean2, IV, NOW).edgeMap));
  assert("LOG READER — both kinds survive a round-trip through the file, in order",
    (() => {
      const p = join(mkdtempSync(join(tmpdir(), "rejirah3-")), "log.jsonl");
      append(buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"] }).row, p);
      append(closeRow, p);
      const back = readLog(p);
      return back.length === 2 && isGrade(back[0]) && isClose(back[1]) && back[1].due === "2026-06-24";
    })());

  // THE PROOF, not the assumption.
  // ── W0-B · THE GAME-ON EPOCH (2 Sep 2026 — LR-02, SD-02) ────────────────────────────
  // His 30-Aug ruling had ZERO code paths until this rung: `grep -i "pre-cyborg|GAME ON"
  // scripts/*.mjs` returned nothing, while `deep.mjs due` read "Tokenization · R2 · 71d
  // overdue" off a proof he had withdrawn. L4: a law is a code path or it does not exist.
  {
    const pre = { id: "tokenization", lockedOn: "2026-06-15", reJirahDone: [] };
    const post = { id: "fresh", lockedOn: "2026-09-05", reJirahDone: [] };
    const relocked = { id: "again", lockedOn: "2026-06-15", relockedOn: "2026-09-01", reJirahDone: [] };
    const g = openRound(pre, IV);
    assert("GAME ON — a capsule locked before the epoch is NOT due: the queue closes on a proof he withdrew",
      g.ok === false && g.pre_cyborg === true && /withdraw|GAME ON/i.test(g.why));
    assert("GAME ON — and it says so in HIS words: the notes are kept, only the proof is gone, and a re-lock restarts the schedule",
      /[Nn]otes poore rakhe hain/.test(g.why) && /restart/i.test(g.why));
    assert("GAME ON — NOTHING IS DELETED (L9): every round is still returned as record, and the arithmetic is untouched",
      Array.isArray(g.rounds) && g.rounds.length === IV.length && g.rounds[0].due === "2026-06-18"
      && roundSchedule(pre, IV).ok === true && roundSchedule(pre, IV).rounds.length === IV.length);
    assert("GAME ON — HIS WORD REOPENS IT: --anyway carries the captain through his own gate",
      openRound(pre, IV, { anyway: true }).ok === true);
    assert("GAME ON — a capsule locked AFTER the epoch is untouched, and so is one that was RE-LOCKED after it",
      openRound(post, IV).ok === true && openRound(relocked, IV).ok === true);
    assert("GAME ON — the epoch is a DATE, never a list of concept names: `fresh` and `tokenization` differ only by their lock day",
      openRound({ ...pre, id: "fresh" }, IV).ok === false && openRound({ ...post, id: "tokenization" }, IV).ok === true);
  }

  assert("PENDING — a closed round whose date is NOT in the capsule reads PENDING",
    (() => { const p = pendingCloses([cap], [closeRow]);
      return p.length === 1 && p[0].round === 1 && p[0].due === "2026-06-24" && p[0].known_capsule === true; })());
  assert("PENDING — once the mirror brings the date back down, the round stops being pending",
    pendingCloses([{ ...cap, reJirahDone: ["2026-06-24"] }], [closeRow]).length === 0);
  assert("PENDING — a close for a concept the mirror does not carry is surfaced, not swallowed",
    (() => { const p = pendingCloses([], [closeRow]); return p.length === 1 && p[0].known_capsule === false; })());

  // The double-close trap, found by running the CLI for real (5 Aug): the mirror does not
  // know about a close until the paste lands, so openRound legitimately still says R1 —
  // and a naive second `close` would append a duplicate row for the same due-date.
  assert("DOUBLE-CLOSE — a pending round is still 'open' in the mirror, and the pair detects it",
    (() => { const o = openRound(cap, IV, { anyway: true });     // mirror still shows reJirahDone: []
      const p = pendingCloses([cap], [closeRow]);
      return o.ok && o.round === 1 && o.due === "2026-06-24"
        && !!p.find((x) => x.concept === "embeddings" && x.due === o.due); })());
  assert("DOUBLE-CLOSE — once the paste lands, the same pair opens R2 cleanly and flags nothing",
    (() => { const landed = { ...cap, reJirahDone: ["2026-06-24"] };
      const o = openRound(landed, IV, { anyway: true });
      return o.ok && o.round === 2 && o.due === "2026-07-05"
        && pendingCloses([landed], [closeRow]).length === 0; })());

  // SUCCESSIVE-RELEARNING — canon's criterion, not a threshold of mine.
  const SINCE = "2026-08-05T00:00:00Z";
  const rnd = (axis, result) => row(axis, result, "shaky", "2026-08-05T09:00:00Z");
  assert("SUCCESSIVE-RELEARNING — every one of the 9 axes is overdue here, so all 9 are OWED",
    successiveRelearning(cap, [], IV, SINCE, NOW).owed.length === 9);
  assert("SUCCESSIVE-RELEARNING — an axis HELD cold this round satisfies its debt",
    !successiveRelearning(cap, [rnd("a", "held")], IV, SINCE, NOW).missing.includes("a"));
  assert("SUCCESSIVE-RELEARNING — a CRACK does not satisfy it (the criterion is one CLEAN retrieval)",
    successiveRelearning(cap, [rnd("b", "cracked")], IV, SINCE, NOW).missing.includes("b"));
  assert("SUCCESSIVE-RELEARNING — a hold from BEFORE this round does not pay this round's debt",
    successiveRelearning(cap, clean2, IV, SINCE, NOW).missing.includes("a"));   // clean2 is July
  assert("SUCCESSIVE-RELEARNING — MET only when every owed axis held clean, never partially",
    (() => { const all = AXES.map((x) => rnd(x, "held"));
      const one = AXES.slice(0, 8).map((x) => rnd(x, "held"));
      return successiveRelearning(cap, all, IV, SINCE, NOW).met === true
        && successiveRelearning(cap, one, IV, SINCE, NOW).met === false
        && successiveRelearning(cap, one, IV, SINCE, NOW).missing.join("") === "i"; })());
  assert("SUCCESSIVE-RELEARNING — an axis that was never DUE is never listed as owed (no noise)",
    (() => { const fresh = { id: "embeddings", lockedOn: "2026-08-04" };   // locked yesterday, nothing due
      const s = successiveRelearning(fresh, [], IV, SINCE, NOW);
      return s.owed.length === 0 && s.met === false; })());

  assert("GIST PATCH — merges into the EXISTING array, sorted, and never drops a served round",
    (() => { const g = gistPatch(TOK, ["2026-07-27"]);
      return g.value.join(",") === "2026-06-18,2026-06-29,2026-07-27" && g.field === "reJirahDone"; })());
  assert("GIST PATCH — de-duplicates (fsrs.mjs:144's scar: a repeated date replays as two reviews)",
    gistPatch(TOK, ["2026-06-29", "2026-06-29"]).value.length === 2);
  assert("GIST PATCH — junk dates are dropped rather than pasted into his master store",
    gistPatch({ reJirahDone: ["2026-06-18", "kal", ""] }, ["2026-07-27"]).value.join(",") === "2026-06-18,2026-07-27");
  assert("GIST PATCH — emits a paste-ready JSON line for the one-file replace (§2 2b)",
    /^ {2}"reJirahDone": \["2026-06-18","2026-06-29","2026-07-27"\],$/.test(gistPatch(TOK, ["2026-07-27"]).json));
  assert("THE CAPSULE IS STILL NEVER MUTATED — patching derives a NEW array, it does not touch his",
    (() => { const before = JSON.stringify(TOK); gistPatch(TOK, ["2026-07-27"]); return JSON.stringify(TOK) === before; })());

  // ── THE DEFERRED CARRY (dead-wire repair, 11 Aug 2026) ─────────────────────
  // The first assertion is the WIRE ITSELF: it fails the instant this organ stops reading
  // forge's axes_deferred, which is the state it shipped in for weeks.
  const sess = (o) => ({ concept: "hallucinations", ended_at: "2026-08-04T10:00:00Z", axes_done: [], axes_deferred: [], axes_marked_at: {}, ...o });
  const CARRY_NOW = new Date("2026-08-11T12:00:00Z");
  assert("DEFERRED CARRY — an axis deferred on an UNLOCKED concept REACHES Re-Jirah (forge LAWS:32 — 'deferred ≠ dropped'; before this it entered no queue at all)",
    (() => { const c = deferredCarry([sess({ axes_deferred: ["g"] })], null, [{ id: "embeddings" }], [], CARRY_NOW);
      return c.length === 1 && c[0].concept === "hallucinations" && c[0].locked === false
        && c[0].axes.length === 1 && c[0].axes[0].axis === "g" && c[0].axes[0].axisType === "defend"; })());
  assert("DEFERRED CARRY — the age is DERIVED from the row's own stamp, and no due-date is ever emitted (no lock day ⇒ no honest schedule)",
    (() => { const a = deferredCarry([sess({ axes_deferred: ["g"] })], null, [], [], CARRY_NOW)[0].axes[0];
      return a.ageDays === 7 && a.at === "2026-08-04T10:00:00Z" && !("nextDue" in a) && !("due" in a); })());
  assert("DEFERRED CARRY — the per-axis mark stamp wins over the session's ended_at (the unforgeable clock)",
    deferredCarry([sess({ axes_deferred: ["g"], axes_marked_at: { g: { at: "2026-08-01T00:00:00Z" } } })], null, [], [], CARRY_NOW)[0].axes[0].ageDays === 10);
  assert("DEFERRED CARRY — re-marking the axis DONE in a later session clears it (markAxis moves it; the newest event wins)",
    deferredCarry([sess({ axes_deferred: ["g"] }), sess({ ended_at: "2026-08-06T10:00:00Z", axes_done: ["g"] })], null, [], [], CARRY_NOW).length === 0);
  assert("DEFERRED CARRY — a COLD GRADE after the defer clears it: that is the pick-up the law asks for",
    deferredCarry([sess({ axes_deferred: ["g"] })], null, [],
      [{ concept: "hallucinations", axis: "g", result: "held", ts: "2026-08-05T10:00:00Z" }], CARRY_NOW).length === 0);
  assert("DEFERRED CARRY — a grade from BEFORE the defer does NOT clear it (he deferred it after, so it is still owed)",
    deferredCarry([sess({ axes_deferred: ["g"] })], null, [],
      [{ concept: "hallucinations", axis: "g", result: "held", ts: "2026-08-01T10:00:00Z" }], CARRY_NOW).length === 1);
  assert("DEFERRED CARRY — the LIVE open session counts the moment it is filed, flagged as live (an abandoned session never reaches the history file)",
    (() => { const c = deferredCarry([], { concept: "zzq_live", updated_at: "2026-08-11T09:00:00Z", axes_deferred: ["d"] }, [], [], CARRY_NOW);
      return c.length === 1 && c[0].axes[0].live === true && c[0].axes[0].axis === "d"; })());
  assert("DEFERRED CARRY — a locked concept is carried too, but MARKED locked (its 9 axes already have an interval queue)",
    deferredCarry([sess({ concept: "embeddings", axes_deferred: ["b"] })], null, [{ id: "embeddings" }], [], CARRY_NOW)[0].locked === true);
  assert("DEFERRED CARRY — the screen block names the axis, the concept and the two ways to pick it up",
    (() => { const t = carryLines(deferredCarry([sess({ axes_deferred: ["g"] })], null, [], [], CARRY_NOW)).join("\n");
      return /DEFERRED, NOT DROPPED/.test(t) && /hallucinations/.test(t) && /\bg · defend/.test(t)
        && /forge_session\.mjs axis <axis> done/.test(t) && /rejirah\.mjs grade hallucinations/.test(t); })());
  assert("DEFERRED CARRY — junk in, silence out: a garbage axis letter and a missing field never fabricate a row",
    deferredCarry([sess({ axes_deferred: ["zz", 7, null] }), { concept: "x" }], null, [], [], CARRY_NOW).length === 0);

  // ── BLOCK 4 · A CORRECTION IS A NEW ROW THAT NAMES THE OLD ONE ────────────
  // (17 Aug 2026.) A wrong `cracked` makes him re-drill for weeks something he
  // already knows; a wrong `held` lets a real crack go quiet. Neither had a way
  // back, and a verdict that cannot be taken back compounds through nemesis and
  // FSRS forever. Driven on fixtures through the real functions.
  {
    const T1 = "2026-08-10T09:00:00.000Z", T2 = "2026-08-17T09:00:00.000Z";
    const wrong = { ts: T1, concept: "tokenization", axis: "a", result: "cracked", gut: "knew", cold: true, source: "deep" };
    const fix = { ts: T2, concept: "tokenization", axis: "a", result: "held", gut: "knew", cold: true, source: "correction", corrects: T1, why: "he named the mechanism; the judge marked the wording" };
    assert("BLOCK 4 — a corrected round is GONE from what every reader derives from (supersede lives inside the one door they all use)",
      supersede([wrong, fix]).length === 1 && supersede([wrong, fix])[0].result === "held");
    // DRIVEN THROUGH THE REAL DOOR ON A REAL FILE, because the claim is about what
    // survives ON DISK — asserting it on two in-memory objects would prove nothing.
    assert("BLOCK 4 — …and the ORIGINAL survives on disk, readable, with its own timestamp: the log is append-only and the history is the point",
      (() => {
        const d = mkdtempSync(join(tmpdir(), "rejirah-b4-"));
        const p = join(d, "log.jsonl");
        append(wrong, p); append(fix, p);
        const raw = readLog(p, { raw: true }), cooked = readLog(p);
        return raw.length === 2 && raw[0].ts === T1 && raw[0].result === "cracked" && raw[1].why.length > 0
          && cooked.length === 1 && cooked[0].result === "held";
      })());
    assert("BLOCK 4 — the gut-word is CARRIED from the round being corrected, never re-asked: it was his pre-commitment in a moment that has passed, and inventing one now would fabricate the calibration signal",
      fix.gut === wrong.gut);
    assert("BLOCK 4 — an uncorrected log is byte-for-byte what it always was (strictly additive; nothing changes for a history with no corrections)",
      supersede([wrong]).length === 1 && supersede([]).length === 0 && supersede(null).length === 0);
    assert("BLOCK 4 — a correction of a correction supersedes the correction, so the chain stays readable rather than branching",
      supersede([wrong, fix, { ts: "2026-08-18T09:00:00.000Z", concept: "tokenization", axis: "a", result: "cracked", corrects: T2 }]).length === 1);
    // A DOOR NOBODY IS TOLD ABOUT IS A DEAD DOOR. Read off this file's own source,
    // needle built by concatenation so the guard cannot pass on itself.
    assert("BLOCK 4 — the verb is WIRED and DISCOVERABLE: a real mode in main(), and named in the usage the CLI prints",
      (() => {
        let src = ""; try { src = readFileSync(fileURLToPath(import.meta.url), "utf8"); } catch { }
        return src.includes('mode === "cor' + 'rect"') && src.includes("| cor" + "rect <concept> <axis>");
      })());
  }

  console.log(`\nrejirah selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const mode = String(cmd || "").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);

  const intervals = intervalsOf();
  const caps = loadCapsules();
  const rows = readLog();
  const now = new Date();

  if (mode === "grade") {
    const flag = (n) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : undefined; };
    // THE GUT-WORD LAW, HELD AT THE DOOR (audit 6 Aug 2026). buildRow deliberately
    // ACCEPTS gut:null and must keep doing so — never inferring a gut-word from the
    // result is what keeps the overconfidence signal honest, and the log's existing
    // rows are read back through it. But the CLI was letting a NEW round in without
    // one, while capture.mjs refused the identical omission on a rep. One law, two
    // writers, two answers — and the lenient side was the worse one: the round still
    // counted toward rounds/nextDue and into FSRS's review history while producing
    // ZERO calibration signal (calibrationGap below is skipped when gut is null), so
    // the axis looked rehearsed and its overconfidence stayed invisible.
    // Refused HERE, not in buildRow, so history stays readable and the non-inference
    // property is untouched. Canon: CLAUDE.md + LEARNING_LAYER_MAP.md §424 —
    // "Gut-word nahi → rep nahi."
    if (flag("gut") === undefined) {
      console.error("rejirah: --gut is required. GUT-WORD LAW: knew|shaky|guessed, committed BEFORE the answer, never re-graded after. No gut-word, no rep.");
      console.error(`  node scripts/rejirah.mjs grade ${rest[0] || "<concept>"} ${rest[1] || "<axis>"} ${rest[2] || "held|cracked"} --gut shaky`);
      process.exit(1);
    }
    const built = buildRow({
      concept: rest[0], axis: rest[1], result: rest[2],
      gut: flag("gut"), cold: flag("cold") === "false" ? false : true,
    }, { capsuleIds: caps.map((c) => c.id) });
    if (!built.ok) { console.error(`rejirah: ${built.why}`); process.exit(1); }
    append(built.row);
    const st = axisState(caps.find((c) => c.id === built.row.concept) || { id: built.row.concept }, built.row.axis, [...rows, built.row], intervals, now);
    console.log(`rejirah: ${built.row.concept} ${built.row.axis} ${built.row.result}`
      + (built.row.gut ? ` (gut ${built.row.gut})` : " (no gut-word committed)")
      + ` → ${st.fluencyState} · round ${st.rounds} · next due ${st.nextDue || "?"}`
      + (st.escalate ? "  ⛔ OVERCONFIDENT — tighten the interval and bump the mode" : ""));
    if (built.unregistered) console.log(`  ⚠ "${built.row.concept}" is not a locked capsule — say so; concepts.json is hand-curated canon.`);
    return;
  }

  // ── THE WAY BACK (BLOCK 4, 17 Aug 2026) ─────────────────────────────────
  // A wrong `cracked` schedules him to re-drill something he already knows, for
  // weeks; a wrong `held` lets a real crack go quiet. Neither had a way back.
  // This APPENDS — the corrected row stays on disk, readable, with its own date —
  // and every reader honours the correction because supersede() lives inside the
  // one door they all come through.
  if (mode === "correct") {
    const flag = (n) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : undefined; };
    const ofTs = flag("of");
    const why = String(flag("why") || "").trim();
    if (!ofTs || !why) {
      console.error('rejirah: correct <concept> <axis> <held|cracked> --of "<ts of the round being corrected>" --why "<what was wrong about it>"');
      console.error("  --of names the exact row this replaces (copy its ts). --why is REQUIRED: this row is the only record that a verdict about him was walked back.");
      console.error("  the rounds on record for that axis:");
      for (const r of readLog(undefined, { raw: true }).filter((x) => isGrade(x) && x.concept === String(rest[0] || "").toLowerCase().trim() && x.axis === String(rest[1] || "").toLowerCase().trim())) {
        console.error(`    ${r.ts}  ${r.result}${r.gut ? ` (gut ${r.gut})` : ""}${r.corrects ? `  [already a correction of ${r.corrects}]` : ""}`);
      }
      process.exit(1);
    }
    // THE GUT-WORD IS CARRIED FROM THE ROUND BEING CORRECTED, NEVER RE-ASKED.
    // It is his pre-commitment from a moment that has passed; inventing a new one
    // now would fabricate the exact signal the calibration gap is measured from.
    const raw = readLog(undefined, { raw: true });
    const orig = raw.find((r) => r && r.ts === ofTs);
    if (!orig) { console.error(`rejirah: no round on record with ts "${ofTs}" — nothing written. Copy the ts exactly from the list above.`); process.exit(1); }
    if (raw.some((r) => r && r.corrects === ofTs)) { console.error(`rejirah: ${ofTs} has already been corrected — correct the CORRECTION instead, so the chain stays readable. Nothing written.`); process.exit(1); }
    const built = buildRow({
      concept: rest[0] || orig.concept, axis: rest[1] || orig.axis, result: rest[2],
      gut: orig.gut, cold: orig.cold === false ? false : true, round: orig.round, source: "correction",
    }, { capsuleIds: caps.map((c) => c.id) });
    if (!built.ok) { console.error(`rejirah: ${built.why}`); process.exit(1); }
    if (built.row.concept !== orig.concept || built.row.axis !== orig.axis) {
      console.error(`rejirah: a correction must name the SAME axis it corrects (${orig.concept} ${orig.axis}). Nothing written.`);
      process.exit(1);
    }
    append({ ...built.row, corrects: ofTs, why: why.slice(0, 300) });
    const st = axisState(caps.find((c) => c.id === built.row.concept) || { id: built.row.concept }, built.row.axis, readLog(), intervals, now);
    console.log(`rejirah: CORRECTED ${orig.concept} ${orig.axis} — ${orig.result} → ${built.row.result} (was recorded ${orig.ts})`);
    console.log(`  why: ${why.slice(0, 300)}`);
    console.log(`  the original row is untouched on disk; every reader now sees the correction → ${st.fluencyState} · round ${st.rounds} · next due ${st.nextDue || "?"}`);
    return;
  }

  if (mode === "close") {
    const want = String(rest[0] || "").toLowerCase().trim();
    const anyway = rest.includes("--anyway");
    if (!want) { console.error("rejirah: close <concept> [--anyway]"); process.exit(1); }
    const cap = caps.find((c) => c.id === want);
    if (!cap) {
      console.error(`rejirah: "${want}" is not a locked capsule in the mirror. Locked: ${caps.map((c) => c.id).join(" · ") || "(none — run \`node scripts/mirror.mjs\`)"}`);
      process.exit(1);
    }
    const open = openRound(cap, intervals, { anyway });
    if (!open.ok) {
      console.error(`rejirah: ${open.why}`);
      if (open.pre_cyborg) console.error(`  phir bhi baithna hai? \`node scripts/rejirah.mjs close ${want} --anyway\` — tumhara word hi isse khol sakta hai.`);
      process.exit(1);
    }

    // ALREADY CLOSED, STILL PENDING. openRound reads the MIRROR, and the mirror only
    // learns about a close after the gist paste + the next mirror run — so a round he
    // closed an hour ago is legitimately still "open" here. Without this guard the second
    // `close` would append a DUPLICATE close row for the same due-date and the message
    // would blame him for not grading. The blocker is the un-pasted patch, so say that
    // and hand him the patch again.
    const already = pendingCloses(caps, rows).find((p) => p.concept === want && p.due === open.due);
    if (already) {
      console.error(`rejirah: R${already.round} (${already.due}) is ALREADY closed — you closed it ${String(already.closed_at).slice(0, 16).replace("T", " ")}. It is waiting on the gist, not on you.`);
      console.error(`  ${want}.json:${gistPatch(cap, [already.due]).json.trim()}`);
      console.error(`  Paste that, then \`node scripts/mirror.mjs\` — R${already.round + 1} opens by itself once it lands.`);
      process.exit(1);
    }

    // A round with nothing graded into it did not happen. This is not a threshold — it is
    // the difference between an event and a no-op, and canon's own "un-run = hypothesis".
    // `--anyway` exists because a round sat away from the keyboard is still a real round;
    // it is RECORDED as forced so the log never pretends otherwise.
    const lastClose = rows.filter((r) => isClose(r) && r.concept === want).sort((a, b) => String(a.ts).localeCompare(String(b.ts))).pop();
    const since = lastClose ? lastClose.ts : "";
    const graded = rows.filter((r) => isGrade(r) && r.concept === want && String(r.ts) > since);
    const axesGraded = [...new Set(graded.map((r) => r.axis))].sort();
    if (!graded.length && !anyway) {
      console.error(`rejirah: nothing has been graded on "${want}" since ${lastClose ? `round ${lastClose.round} closed (${lastClose.ts.slice(0, 10)})` : "it was locked"} — closing R${open.round} now would record a round that never ran.`);
      console.error(`  Grade the axes first:  node scripts/deep.mjs due   then   node scripts/rejirah.mjs grade ${want} <axis> held|cracked --gut <word>`);
      console.error(`  Sat it away from the keyboard? \`--anyway\` records it, flagged as forced.`);
      process.exit(1);
    }

    const built = buildCloseRow({ concept: want, due: open.due, round: open.round, axes: axesGraded, forced: !graded.length }, {});
    if (!built.ok) { console.error(`rejirah: ${built.why}`); process.exit(1); }
    append(built.row);

    const pend = pendingCloses(caps, [...rows, built.row]).filter((p) => p.concept === want);
    const patch = gistPatch(cap, pend.map((p) => p.due));
    console.log(`\n🏁 RE-JIRAH R${open.round}/${open.total} CLOSED — ${want}   (due-date ${open.due})`);
    console.log(`   axes graded into this round: ${axesGraded.length ? axesGraded.join(" ") : "(none — FORCED, recorded as such)"}`);
    // Canon's criterion, reported honestly at the one moment it means something. It does not
    // block: an interrupted round is a real round, and a machine that refuses to let him
    // close one teaches him to stop closing them.
    const sr = successiveRelearning(cap, [...rows, ...graded], intervals, since, now);
    if (sr.owed.length) {
      console.log(sr.met
        ? `   ✅ successive-relearning MET — every due axis (${sr.owed.join(" ")}) held cold at least once.`
        : `   ⚠ successive-relearning NOT met — due but never held clean this round: ${sr.missing.join(" ")}`
          + `\n     (PROJECT_OS §LEARNING EXECUTION LAYER: "har round har due-axis cold ek baar sahi". They stay overdue and come back — that is the criterion working, not a failure.)`);
    }
    console.log(`\n── THE OTHER HALF IS YOURS (FORGE_SPEC §2 step 2b — nothing auto-saves) ──`);
    console.log(`   Gist file: ${want}.json   ·   replace ONE line, nothing else:\n`);
    console.log(patch.json);
    console.log(`\n   Then \`node scripts/mirror.mjs\` pulls it back and this round stops reading PENDING.`);
    console.log(`   Until it lands, fsrs / deep / capsule_bridge / dugout / shipped all still believe R${open.round} never happened.\n`);
    return;
  }

  if (mode === "pending") {
    const pend = pendingCloses(caps, rows);
    // AN UNMEASURED ZERO SAYS SO (audit #108, 6 Aug 2026) — the same guard forge_session.mjs
    // put on teaching-drift in audit #40: "Read this as an unmeasured silence, not a clean
    // sheet." MEASURED TODAY: dressing-room/state/rejirah_log.jsonl DOES NOT EXIST. Not one
    // axis has ever been graded and not one round has ever been closed, while four locked
    // capsules sit 10-43 days overdue. The legacy line below claims "har closed round mirror
    // mein land kar chuka" — every closed round landed — which is vacuously true of an EMPTY
    // SET and reads as an all-clear on a loop that has never once run. That is the worst
    // possible place for it: `pending` is the organ whose ONLY job is to prove his gist paste
    // landed, so a false all-clear here is indistinguishable from a working back edge.
    // WHAT IS NOT BROKEN: pendingCloses() is computed live off the log and the mirror — it is
    // the DATA that is absent, not the code, and this line says that rather than implying the
    // organ is dead. A real close still earns the original line back, verbatim.
    if (!pend.length && !rows.some(isClose)) {
      console.log(`\nrejirah: PENDING NOT MEASURED — 0 pending, and 0 here is not a measurement.`);
      console.log(`  ${existsSync(LOG) ? `rejirah_log.jsonl has ${rows.length} row(s) but not one round-close` : "rejirah_log.jsonl does not exist"}`
        + ` — ${rows.filter(isGrade).length} axis grade(s), 0 rounds EVER closed, on ${caps.length} locked capsule(s).`);
      console.log(`  Nothing has ever been closed, so nothing CAN be pending. Yeh clean sheet nahi hai — yeh un-run hai.`);
      console.log(`  A round becomes pending only after \`node scripts/rejirah.mjs close <concept>\`; until one runs, this screen stays quiet however overdue the queue gets.`);
      console.log(`  Kya due hai: \`node scripts/rejirah.mjs due\`\n`);
      return;
    }
    if (!pend.length) { console.log("\nrejirah: koi gist-write pending nahi — har closed round mirror mein land kar chuka.\n"); return; }
    console.log(`\n⚠ ${pend.length} RE-JIRAH ROUND(S) CLOSED BUT NOT IN THE GIST YET\n`);
    for (const p of pend) {
      const cap = caps.find((c) => c.id === p.concept);
      const patch = cap ? gistPatch(cap, pend.filter((x) => x.concept === p.concept).map((x) => x.due)) : null;
      console.log(`  ${p.concept}  R${p.round}  due ${p.due}   (closed ${String(p.closed_at).slice(0, 16).replace("T", " ")})`);
      if (patch) console.log(`     → ${p.concept}.json:${patch.json.trim()}`);
      if (!p.known_capsule) console.log(`     ⚠ no capsule named "${p.concept}" in the mirror — check the id.`);
    }
    console.log(`\n  Paste into the gist, then \`node scripts/mirror.mjs\` to confirm it landed.\n`);
    return;
  }

  if (mode === "state") {
    const want = String(rest[0] || "").toLowerCase();
    if (want && !caps.some((c) => c.id === want)) {   // F3a (9 Aug): silence looked like death
      console.log(`
rejirah: no capsule named "${want}" in the mirror — maujood: ${caps.map((c) => c.id).join(", ") || "(koi nahi)"}
`);
      // …but "no capsule" is not "nothing owed" (dead-wire repair, 11 Aug 2026). An UNLOCKED
      // concept is exactly the case where a deferred axis has no other queue, and `due`'s own
      // carry block points the reader here — so this branch had to stop being a dead end.
      const carryHere = deferredCarry(readSessions(), readJson(join(STATE, "forge_session.json")), caps, rows, now)
        .filter((c) => c.concept === want);
      for (const l of carryLines(carryHere)) console.log(l);
      return;
    }
    for (const c of caps) {
      if (want && c.id !== want) continue;
      const st = conceptState(c, rows, intervals, now);
      console.log(`\n${c.id}  (locked ${st.lockedOn})`);
      for (const a of st.axes) {
        console.log(`  ${a.axis} ${String(a.axisType).padEnd(11)} rounds ${a.rounds} · ${a.lastResult || "ungraded"}`
          + ` · ${a.fluencyState.split(" ")[0]} · due ${a.nextDue || "?"}${a.overdueDays ? ` (${a.overdueDays}d overdue)` : ""}`
          + (a.escalate ? "  ⛔" : ""));
      }
      console.log(`  edge-map → defend ${st.edgeMap.can_defend.join("") || "—"} · cracked ${st.edgeMap.cracked.join("") || "—"} · unmeasured ${st.edgeMap.unmeasured.join("") || "—"}`);
      if (!st.confusionPairs) console.log(`  confusion-pairs: ${st.confusion_gate}`);
      const sch = roundSchedule(c, intervals);
      if (sch.ok) console.log(`  rounds → ${sch.rounds.map((r) => `R${r.round} ${r.due}${r.done ? " ✓" : ""}`).join(" · ")}`);
      const pend = pendingCloses([c], rows);
      for (const p of pend) console.log(`  ⚠ R${p.round} (${p.due}) closed ${String(p.closed_at).slice(0, 10)} but NOT in the gist yet — \`node scripts/rejirah.mjs pending\``);
    }
    return;
  }

  if (mode === "due" || !mode) {
    // The pending line goes FIRST and unconditionally: a round he already sat but never
    // pasted is more urgent than the next round to sit, and it is the one thing that
    // silently makes every other number on this screen wrong.
    const pend = pendingCloses(caps, rows);
    if (pend.length) console.log(`\n⚠ ${pend.length} closed round(s) NOT in the gist yet — \`node scripts/rejirah.mjs pending\` for the patch. Until then five organs still read them as never-served.`);
    // THE DEFERRED CARRY, printed BEFORE the empty-queue return below (dead-wire repair,
    // 11 Aug 2026). That return used to fire on an unlocked concept with open deferred axes
    // and print "kuch due nahi" — a clean sheet laid straight over a backlog, which is the
    // exact reading that let `defer` mean `drop` for weeks.
    const carry = deferredCarry(readSessions(), readJson(join(STATE, "forge_session.json")), caps, rows, now);
    for (const l of carryLines(carry)) console.log(l);
    const rep = dueReport(caps, rows, intervals, readJson(CARDS), now);
    if (!rep.length) {
      console.log(carry.length
        ? "\nrejirah: locked capsules pe kuch due nahi — par upar ka deferred carry khaali nahi hai.\n"
        : "\nrejirah: kuch due nahi.\n");
      return;
    }
    console.log(`\n== RE-JIRAH — AXES DUE ==   (FSRS says WHEN · this says WHICH AXES + HOW HARD)\n`);
    for (const r of rep) {
      console.log(`${r.concept}${r.fsrs_rank >= 0 ? `  [FSRS hardest #${r.fsrs_rank + 1}]` : ""}`);
      for (const a of r.axes.slice(0, 4)) {
        console.log(`   ${a.axis} · ${a.axisType} · ${a.mode} · ${a.overdueDays}d overdue${a.escalate ? "  ⛔ confident-crack" : ""}`);
      }
      // The 5 axes the cap hides are named, not swallowed — see moreAxesLine (audit #108).
      const more = moreAxesLine(r.axes, r.concept, 4);
      if (more) console.log(more);
      console.log("");
    }
    console.log(`  Cold sawaal: \`node scripts/deep.mjs due\`   ·   Result likho: \`node scripts/rejirah.mjs grade <concept> <axis> held|cracked --gut <word>\``);
    console.log(`  Round khatam: \`node scripts/rejirah.mjs close <concept>\` → gist patch milega (paste tera, §2 2b).\n`);
    return;
  }
  if (mode === "held") {
    // P7.A (full-organism audit, 7 Aug 2026): "Which concepts do I actually hold
    // right now, and how do you know?" — answered from EVIDENCE, in code. Proof =
    // a cold Jirah survived: the lock-day Jirah (capsule status "tempered"), or a
    // cold Re-Jirah grade since. Sessions sat, hours spent and axes "taught" are
    // NOT proof and are never counted here — that distinction is the whole reason
    // this command exists (six hallucinations sessions, zero graded axes).
    console.log(`\n== KYA ACTUALLY HELD HAI — aur kaise pata ==   (proof = cold Jirah · taught ≠ held)\n`);
    for (const c of caps) {
      const st = conceptState(c, rows, intervals, now);
      const coldRows = rows.filter((r) => isGrade(r) && r.concept === c.id);
      const lockDays = c.lockedOn ? Math.floor((now.getTime() - Date.parse(c.lockedOn)) / 86400000) : null;
      const proof = c.lockedOn
        ? `Jirah-tempered at LOCK (${c.lockedOn}${lockDays !== null ? `, ${lockDays}d ago` : ""})`
        : "lock date missing — no dated proof at all";
      const since = coldRows.length
        ? `cold since lock: ${st.edgeMap.can_defend.join("") || "—"} held · ${st.edgeMap.cracked.join("") || "—"} cracked · ${st.edgeMap.unmeasured.join("") || "—"} unmeasured`
        : `cold re-proof since lock: NEVER — 0 of 9 axes ever re-graded`;
      console.log(`  ${c.id.padEnd(14)} ${proof}\n  ${" ".repeat(14)} ${since}`);
    }
    // In-flight concepts (no capsule yet) — the evidence is the session history,
    // and the honest reading of it, out loud.
    try {
      const hist = existsSync(SESSIONS_LOG)
        ? readFileSync(SESSIONS_LOG, "utf8").trim().split(/\r?\n/).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
        : [];
      const liveS = readJson(join(STATE, "forge_session.json"));
      const inflight = new Map();
      for (const r of hist) { if (!caps.some((cp) => cp.id === r.concept)) inflight.set(r.concept, [...(inflight.get(r.concept) || []), r]); }
      if (liveS && liveS.concept && !caps.some((cp) => cp.id === liveS.concept) && !inflight.has(liveS.concept)) inflight.set(liveS.concept, []);
      for (const [concept, runs] of inflight) {
        const graded = new Set(runs.flatMap((r) => r.axes_graded || []));
        const jirahs = runs.reduce((n, r) => n + (((r.question_moments || {}).jirah) || 0), 0)
          + (liveS && liveS.concept === concept ? ((liveS.question_moments || {}).jirah || 0) : 0);
        const nRuns = runs.length + (liveS && liveS.concept === concept && !liveS.closed_at ? 1 : 0);
        console.log(`  ${concept.padEnd(14)} NOT LOCKED — ${nRuns} session(s) on record, axes cold-graded ${graded.size}/9, Jirah moments ${jirahs}`);
        console.log(`  ${" ".repeat(14)} → koi machine-proof NAHI ki isme se kuch bhi bacha hai. Session ≠ evidence; Jirah = evidence.`);
      }
    } catch { /* history optional */ }
    console.log(`\n  Unmeasured ≠ lost — par proof purana hota jaata hai. Agla cold check: \`node scripts/rejirah.mjs due\`\n`);
    return;
  }

  console.log(`rejirah: grade <concept> <axis> held|cracked [--gut knew|shaky|guessed] [--cold false]
         | correct <concept> <axis> held|cracked --of "<ts>" --why "<reason>"   (galat verdict wapas — purana row zinda rehta hai)
         | close <concept> [--anyway]   (round khatam → gist patch)
         | pending   (closed par gist mein abhi tak nahi)
         | held      (kya PROVEN hai — P7.A ka jawab, evidence se)
         | state [concept] | due | selftest`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { selftest, intervalsOf };
