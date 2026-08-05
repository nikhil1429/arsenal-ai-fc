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
// WHAT DEPENDS ON `reJirahDone` (why the pending-nag is not pedantry): fsrs.mjs:143
// builds a concept's entire review history from lockedOn + these dates, deep.mjs:82
// counts them for the round number, capsule_bridge.mjs:75 derives done/overdue/due from
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
// CLI: grade <concept> <axis> held|cracked [--gut w] [--cold false]
//    | close <concept> [--anyway] | pending | state [concept] | due | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = join(HERE, "..", "dressing-room", "state");
const CAPSULES = join(STATE, "capsules");
const LOG = join(STATE, "rejirah_log.jsonl");
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
const ROUND_MODE = ["R-early (gentle cold)", "R-mid (adversarial + traps + counterfactual)", "R-late (timed mini-mock, axes mixed, cross-concept)"];

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
export function readLog(path = LOG) {
  const out = [];
  try {
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.concept && (j.axis || j.kind)) out.push(j); } catch {}
    }
  } catch {}
  return out;
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
  return { ok: true, rounds, locked };
}

// The round he is closing is the FIRST one not yet in `reJirahDone` — never the most
// overdue. Three rounds overdue means R1 is the one being sat, and jumping to R3 would
// silently mark two rounds served that never were.
export function openRound(capsule, intervals) {
  const s = roundSchedule(capsule, intervals);
  if (!s.ok) return { ok: false, why: s.why };
  const open = s.rounds.find((r) => !r.done);
  if (!open) return { ok: false, why: `every scheduled round is already in reJirahDone (${s.rounds.length}/${s.rounds.length} served) — FORGE_SPEC schedules ${intervals.join("d / ")}d and no more.`, complete: true };
  return { ok: true, ...open, total: s.rounds.length };
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
  const anchor = last ? new Date(last.ts) : new Date(String(capsule.lockedOn || "") + "T00:00:00Z");
  let nextDue = null, overdueDays = null;
  if (!Number.isNaN(anchor.getTime())) {
    const step = (last && last.result === "cracked") ? intervals[0] : intervals[idx];
    const d = new Date(anchor.getTime() + step * 86400000);
    nextDue = d.toISOString().slice(0, 10);
    overdueDays = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
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
  assert("KNOB 4 — the round mode escalates R-early -> R-mid -> R-late with rounds done",
    axisState(cap, "a", [], IV, NOW).mode.startsWith("R-early")
    && axisState(cap, "a", clean2, IV, NOW).mode.startsWith("R-late"));
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
  assert("OPEN ROUND — the FIRST unserved round, never the most overdue (R1 before R3)",
    (() => { const o = openRound(cap, IV); return o.ok && o.round === 1 && o.due === "2026-06-24"; })());
  assert("OPEN ROUND — with two served, the next one is R3, not R1 again",
    (() => { const o = openRound(TOK, IV); return o.ok && o.round === 3 && o.due === "2026-07-27" && o.total === 3; })());
  assert("OPEN ROUND — all three served reports COMPLETE, and refuses to invent a fourth",
    (() => { const o = openRound({ ...TOK, reJirahDone: ["2026-06-18", "2026-06-29", "2026-07-27"] }, IV);
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
    (() => { const o = openRound(cap, IV);                       // mirror still shows reJirahDone: []
      const p = pendingCloses([cap], [closeRow]);
      return o.ok && o.round === 1 && o.due === "2026-06-24"
        && !!p.find((x) => x.concept === "embeddings" && x.due === o.due); })());
  assert("DOUBLE-CLOSE — once the paste lands, the same pair opens R2 cleanly and flags nothing",
    (() => { const landed = { ...cap, reJirahDone: ["2026-06-24"] };
      const o = openRound(landed, IV);
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

  if (mode === "close") {
    const want = String(rest[0] || "").toLowerCase().trim();
    const anyway = rest.includes("--anyway");
    if (!want) { console.error("rejirah: close <concept> [--anyway]"); process.exit(1); }
    const cap = caps.find((c) => c.id === want);
    if (!cap) {
      console.error(`rejirah: "${want}" is not a locked capsule in the mirror. Locked: ${caps.map((c) => c.id).join(" · ") || "(none — run \`node scripts/mirror.mjs\`)"}`);
      process.exit(1);
    }
    const open = openRound(cap, intervals);
    if (!open.ok) { console.error(`rejirah: ${open.why}`); process.exit(1); }

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
    const rep = dueReport(caps, rows, intervals, readJson(CARDS), now);
    if (!rep.length) { console.log("\nrejirah: kuch due nahi.\n"); return; }
    console.log(`\n== RE-JIRAH — AXES DUE ==   (FSRS says WHEN · this says WHICH AXES + HOW HARD)\n`);
    for (const r of rep) {
      console.log(`${r.concept}${r.fsrs_rank >= 0 ? `  [FSRS hardest #${r.fsrs_rank + 1}]` : ""}`);
      for (const a of r.axes.slice(0, 4)) {
        console.log(`   ${a.axis} · ${a.axisType} · ${a.mode} · ${a.overdueDays}d overdue${a.escalate ? "  ⛔ confident-crack" : ""}`);
      }
      console.log("");
    }
    console.log(`  Cold sawaal: \`node scripts/deep.mjs due\`   ·   Result likho: \`node scripts/rejirah.mjs grade <concept> <axis> held|cracked --gut <word>\``);
    console.log(`  Round khatam: \`node scripts/rejirah.mjs close <concept>\` → gist patch milega (paste tera, §2 2b).\n`);
    return;
  }
  console.log(`rejirah: grade <concept> <axis> held|cracked [--gut knew|shaky|guessed] [--cold false]
         | close <concept> [--anyway]   (round khatam → gist patch)
         | pending   (closed par gist mein abhi tak nahi)
         | state [concept] | due | selftest`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { selftest, intervalsOf };
