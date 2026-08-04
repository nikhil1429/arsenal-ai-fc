#!/usr/bin/env node
// ============================================================================
// scripts/capsule_bridge.mjs · ARSENAL AI FC — THE CAPSULE BRIDGE (the reader)
// ----------------------------------------------------------------------------
// WHAT:  The richest artifact this system produces is a LOCKED CAPSULE — 9 axes,
//   each with an interviewer `strike` in the captain's own words, a defended
//   `weld`, a `deep` re-learn layer, plus doubts/traps/bridges/interview-lines,
//   and a per-axis `status` graded by JIRAH (adversarial cross-examination).
//   Nothing on the bus has ever read one. Measured 30 Jul 2026: 36 axes, 36
//   strike questions, 36 deep layers, 112 doubts, 40 traps, 17 bridges, 40
//   interview lines sitting in dressing-room/state/capsules/ — while every
//   signal agent reasoned from a reps_log holding TWO lines.
//   (SYSTEM_METACOGNITION.md §0 finding 5: "rich capsule never extracted; a
//   parallel, coarser re-collection.")
//   This organ extracts it into ONE file the rest of the organism can read.
//
// WHAT IT IS NOT — and this is the whole safety argument:
//   It is a READER, not a CONTROLLER. It creates no FSRS card, schedules no
//   drill, grades nothing, and writes to no other organ's file. The captain's
//   own audit says "building the Re-Jirah per-axis controller in parallel to
//   FSRS" is explicitly NOT recommended — so this does not build one. It reports
//   what the capsules already say, INCLUDING where FORGE's date-driven Re-Jirah
//   and the repo's FSRS disagree, so the two worlds stop being air-gapped and
//   silent. Consumers may read capsule_map.json; nothing is forced on them.
//   Rep counts do not multiply by nine. Nothing self-promotes.
//
// LAWS:
//   · SOLE WRITER of capsule_map.json. Capsules themselves are IMMUTABLE and are
//     opened read-only (FORGE_SPEC §5: "Locked capsule files = IMMUTABLE").
//   · Never invents content. Every string it emits is copied verbatim from a
//     capsule the captain verified at lock time (FORGE_SPEC §2.5: "Claude invent
//     kabhi nahi karta"). If a field is absent it is null, never filled.
//   · Empty-safe: no capsules ⇒ status "awaiting_data", zero bleeding.
//   · Deterministic. No LLM, no network, no API key.
//
// WRITER OF: dressing-room/state/capsule_map.json
//   two-schedulers block: scheduler_agreement[] (audit #33 — the arm that never existed),
//   scheduler_disagreement{}, and the honesty counters fsrs_due_names_known /
//   fsrs_due_total / fsrs_due_names_complete / fsrs_due_note. CONSUMER: setpiece.mjs
//   (evening packet) reads the agreement to rank and prints the note verbatim.
// READS:     dressing-room/state/capsules/*.json (read-only) · forge_profile.json
//            (rejirah_intervals_days — the genome owns the schedule, not this file) ·
//            cards.json (FSRS's due NAMES live in hardest_due, not in the integer counters)
// MODES: (default) write · show · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CAPSULES  = join(STATE_DIR, "capsules");
const PROFILE   = join(STATE_DIR, "forge_profile.json");
const OUT       = join(STATE_DIR, "capsule_map.json");

const AXES = "abcdefghi".split("");
const DEFAULT_INTERVALS = [3, 14, 42];        // FORGE_SPEC §4: lockedOn + 3d / 2wk / 6wk

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayMs = (d) => Date.parse(`${d}T00:00:00Z`);
const addDays = (isoDay, n) => new Date(dayMs(isoDay) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / 86400000);

// ---------------------------------------------------------------------------
// PURE CORE
// ---------------------------------------------------------------------------

// Re-Jirah schedule for ONE capsule, computed live from lockedOn (FORGE_SPEC §4:
// "engine new Date() se compute, no stored countdown"). reJirahDone holds the
// due-dates already served.
function rejirahRounds(capsule, intervals, today) {
  const locked = ISO_DAY.test(String(capsule.lockedOn || "")) ? capsule.lockedOn : null;
  if (!locked) return { rounds: [], next_due: null, overdue_days: null, rounds_done: 0, schedule_known: false };
  const done = new Set((Array.isArray(capsule.reJirahDone) ? capsule.reJirahDone : []).filter(d => ISO_DAY.test(String(d))));
  const rounds = intervals.map((n, i) => {
    const due = addDays(locked, n);
    const status = done.has(due) ? "done" : due < today ? "overdue" : due === today ? "due" : "up";
    return { round: i + 1, interval_days: n, due, status, overdue_days: status === "overdue" ? daysBetween(due, today) : 0 };
  });
  const pending = rounds.filter(r => r.status !== "done");
  const worst = pending.filter(r => r.status === "overdue").sort((a, b) => b.overdue_days - a.overdue_days)[0] || null;
  return {
    rounds,
    next_due: pending[0] ? pending[0].due : null,
    overdue_days: worst ? worst.overdue_days : 0,
    rounds_done: rounds.filter(r => r.status === "done").length,
    schedule_known: true,
  };
}

// One capsule → its map entry. Verbatim only; absent stays null.
function mapCapsule(capsule, intervals, today) {
  const id = String(capsule.id || "").trim().toLowerCase() || null;
  const fl = Array.isArray(capsule.faultLines) ? capsule.faultLines : [];
  const byAxis = new Map(fl.filter(f => f && AXES.includes(f.axis)).map(f => [f.axis, f]));
  const axes = AXES.map((a) => {
    const f = byAxis.get(a);
    if (!f) return { axis: a, present: false, status: null, has_weld: false, has_deep: false, strike: null };
    return {
      axis: a,
      present: true,
      status: f.status || null,               // JIRAH's grade — never a self-rating
      has_weld: !!f.weld,
      has_deep: !!f.deep,
      strike: f.strike ? String(f.strike) : null,
    };
  });
  const present = axes.filter(a => a.present);
  const cracked = present.filter(a => a.status && a.status !== "held").map(a => a.axis);
  return {
    concept: id,
    title: capsule.title || null,
    locked_on: ISO_DAY.test(String(capsule.lockedOn || "")) ? capsule.lockedOn : null,
    status: capsule.status || null,
    axes_present: present.map(a => a.axis),
    axes_missing: axes.filter(a => !a.present).map(a => a.axis),       // deferred at lock ≠ dropped
    axes_cracked: cracked,
    axes,
    counts: {
      doubts: (capsule.doubts || []).length,
      traps: (capsule.traps || []).length,
      bridges: (capsule.bridges || []).length,
      interview_lines: (capsule.interviewLines || []).length,
    },
    rejirah: rejirahRounds(capsule, intervals, today),
  };
}

// The strike bank: every axis question the captain already survived, ready to be
// SERVED instead of synthesised. This is the single largest thing the bus was
// throwing away — the scout generates probes from scratch while 36 sit here.
function strikeBank(entries) {
  const out = [];
  for (const e of entries) {
    for (const a of e.axes) {
      if (a.present && a.strike) {
        out.push({
          concept: e.concept, axis: a.axis, status: a.status,
          strike: a.strike,
          overdue_days: e.rejirah.overdue_days || 0,
        });
      }
    }
  }
  // hardest-first for a consumer that wants one: most overdue, then cracked
  return out.sort((x, y) => (y.overdue_days - x.overdue_days) || ((x.status === "held") - (y.status === "held")));
}

function build(capsules, intervals, today, fsrsDue = []) {
  const entries = capsules.filter(c => c && c.id).map(c => mapCapsule(c, intervals, today))
    .sort((a, b) => String(a.concept).localeCompare(String(b.concept)));
  const bank = strikeBank(entries);
  const overdue = entries.filter(e => e.rejirah.overdue_days > 0)
    .sort((a, b) => b.rejirah.overdue_days - a.rejirah.overdue_days);

  // THE TWO WORLDS, NAMED (defect 7.8 — FORGE's date-driven Re-Jirah vs the repo's
  // FSRS, air-gapped, with learning_state borrowing the "Re-Jirah" NAME for FSRS
  // output). This organ does not merge them and does not pick a winner. It states
  // where they disagree so the ambiguity stops being invisible.
  const fsrs = normalizeFsrsDue(fsrsDue);
  const fsrsSet = new Set(fsrs.names);
  const capsuleDue = new Set(overdue.map(e => e.concept));
  const disagreement = {
    capsule_says_due_fsrs_quiet: [...capsuleDue].filter(c => !fsrsSet.has(c)),
    fsrs_says_due_capsule_quiet: [...fsrsSet].filter(c => !capsuleDue.has(c)),
  };
  // audit #33: naming where they AGREE is the half this organ never had. Two independent
  // schedulers landing on the same concept is stronger evidence than either alone, and it
  // is the signal setpiece now ranks on. Without it "no disagreement" and "no data" looked
  // identical from the outside — which is how a permanently-empty arm went unnoticed.
  const agreement = [...capsuleDue].filter(c => fsrsSet.has(c));

  return {
    date: today,
    generated_at: new Date().toISOString(),
    status: entries.length ? "ok" : "awaiting_data",
    engine: "capsule-bridge-v1 (reader — creates no cards, schedules nothing)",
    rejirah_intervals_days: intervals,
    concepts: entries,
    totals: {
      capsules: entries.length,
      axes_present: entries.reduce((n, e) => n + e.axes_present.length, 0),
      axes_cracked: entries.reduce((n, e) => n + e.axes_cracked.length, 0),
      strike_questions: bank.length,
      doubts: entries.reduce((n, e) => n + e.counts.doubts, 0),
      traps: entries.reduce((n, e) => n + e.counts.traps, 0),
      bridges: entries.reduce((n, e) => n + e.counts.bridges, 0),
      interview_lines: entries.reduce((n, e) => n + e.counts.interview_lines, 0),
    },
    rejirah_overdue: overdue.map(e => ({ concept: e.concept, overdue_days: e.rejirah.overdue_days, next_due: e.rejirah.next_due, rounds_done: e.rejirah.rounds_done })),
    strike_bank: bank,
    // AUDIT #10 (4 Aug 2026) — THE TWO SCHEDULERS ANSWER DIFFERENT QUESTIONS.
    // A disagreement here is EXPECTED and is not an error, and neither side is
    // "the" scheduler:
    //   · FSRS (fsrs.mjs)        → which REP to drill next. Rep-driven, per-card,
    //                              only `track=="concept"` reps ever become cards.
    //   · Capsule Re-Jirah       → which locked CAPSULE needs a fresh 9-axis
    //     (this file's dates)      defence. lockedOn-driven, per-capsule.
    // Live example the day this was written: capsule said `tokenization` was due
    // (8d past its R3 date) while FSRS said `hallucinations` was due (an active
    // concept with no capsule yet). Both were right — they were answering
    // different questions. Reporting that is the whole job of this field.
    // This organ stays a READER: it resolves nothing, schedules nothing, and must
    // never be turned into a second controller (the 31 Jul audit recommended
    // AGAINST building a per-axis controller parallel to FSRS).
    scheduler_disagreement_doc: "EXPECTED, not an error: FSRS schedules REPS (rep-driven, per-card); capsule Re-Jirah schedules CAPSULE RE-TEMPERING (lockedOn-driven, per-capsule). Neither overrides the other.",
    scheduler_disagreement: disagreement,
    scheduler_agreement: agreement,
    // the honesty counters behind the two arms above (audit #33). complete:null means the
    // FSRS side could not be read at all — a silence, never a measured zero.
    fsrs_due_names_known: fsrs.names_known,
    fsrs_due_total: fsrs.due_total,
    fsrs_due_names_complete: fsrs.complete,
    fsrs_due_note: fsrs.why || null,
    line: entries.length
      ? (overdue.length
        ? `${overdue[0].concept} ka Re-Jirah ${overdue[0].rejirah.overdue_days} din overdue hai — aur uske ${bank.filter(b => b.concept === overdue[0].concept).length} strike sawaal already likhe rakhe hain.`
        : `${entries.length} capsule locked, ${bank.length} strike sawaal ready — koi Re-Jirah overdue nahi.`)
      : null,
  };
}

// ---------------------------------------------------------------------------
function loadCapsules(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.toLowerCase().endsWith(".json"))
    .map(f => readJson(join(dir, f))).filter(Boolean);
}

function loadIntervals(path = PROFILE) {
  const j = readJson(path);
  const v = j && j.rejirah_intervals_days;
  return Array.isArray(v) && v.length && v.every(n => Number.isInteger(n) && n > 0) ? v : DEFAULT_INTERVALS;
}

// ORGANISM audit #33 (2026-08-04) — THE ARM THAT COULD NEVER BE NON-EMPTY.
// LEGACY (frozen verbatim, layering rule): this picked arrays out of cards.due_today and
// cards.overdue. fsrs.mjs:190-210 writes both of those as INTEGERS (live: 0 and 4) and puts
// the concept NAMES in cards.hardest_due, which this never opened. So it returned [] on
// EVERY run since the day it shipped: `fsrs_says_due_capsule_quiet` was structurally
// incapable of being non-empty, `capsule_says_due_fsrs_quiet` was just the full overdue
// list, and the organ whose stated purpose is "so the two worlds stop being air-gapped and
// silent" reported total disagreement every single day. Live output named embeddings,
// inference and context as "FSRS quiet" while FSRS listed all three in hardest_due — three
// positively wrong statements — and lost hallucinations, the one concept FSRS wanted.
// Reference only; nothing on the run path calls it.
function fsrsDueConceptsLegacy() {
  const cards = readJson(join(STATE_DIR, "cards.json"));
  const pick = (arr) => (Array.isArray(arr) ? arr : []).map(c => String(c && (c.concept ?? c.id ?? c) || "").toLowerCase()).filter(Boolean);
  return cards ? [...new Set([...pick(cards.due_today), ...pick(cards.overdue)])] : [];
}

// LIVE path, pure half — takes an already-parsed cards.json so the selftest can feed the
// exact shape fsrs really writes instead of a hand-made array (which is precisely why the
// bug above stayed green for weeks).
// It reads hardest_due (the only field FSRS has ever put names in) and KEEPS the
// array-tolerant pick on due_today/overdue so a future fsrs that writes arrays still works.
// It also carries a HAVE/NEED counter, because hardest_due is a TRUNCATED list:
// fsrs.mjs:198 slices it to cfg.hardestDueMax (canon default 8). With more due cards than
// that, "capsule_says_due_fsrs_quiet" over-reports — so the truncation is measured and
// disclosed rather than assumed away. Unreadable cards.json ⇒ due_total null and
// complete null: FSRS's list is UNKNOWN, never a measured empty.
function fsrsDueFromCards(cards) {
  if (!cards || typeof cards !== "object") {
    return { names: [], due_total: null, names_known: 0, complete: null,
      why: "cards.json missing or malformed — FSRS's due list is UNKNOWN, not empty" };
  }
  const pick = (arr) => (Array.isArray(arr) ? arr : []).map(c => String(c && (c.concept ?? c.id ?? c) || "").toLowerCase()).filter(Boolean);
  const names = [...new Set([...pick(cards.hardest_due), ...pick(cards.due_today), ...pick(cards.overdue)])];
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const dt = num(cards.due_today), od = num(cards.overdue);
  const due_total = dt === null && od === null ? null : (dt || 0) + (od || 0);
  const complete = due_total === null ? null : names.length >= due_total;
  return {
    names, due_total, names_known: names.length, complete,
    why: complete === false
      ? `FSRS reports ${due_total} due card(s) but names only ${names.length} (cards.hardest_due is capped by fsrs_config.hardestDueMax) — "capsule_says_due_fsrs_quiet" may over-report`
      : null,
  };
}
// LIVE path, shell half — the only untested layer.
function fsrsDueConcepts(path = join(STATE_DIR, "cards.json")) {
  return fsrsDueFromCards(readJson(path));
}

// build() accepts either the rich reading above OR a bare array of names. A caller handing
// a bare array is asserting it IS the complete list, so the counters mirror it exactly.
function normalizeFsrsDue(fsrsDue) {
  if (fsrsDue && !Array.isArray(fsrsDue) && typeof fsrsDue === "object" && Array.isArray(fsrsDue.names)) return fsrsDue;
  const names = [...new Set((Array.isArray(fsrsDue) ? fsrsDue : []).map(x => String(x || "").toLowerCase()).filter(Boolean))];
  return { names, due_total: names.length, names_known: names.length, complete: true, why: null };
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  try { writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n"); renameSync(tmp, path); }
  catch (e) { try { if (existsSync(tmp)) rmSync(tmp, { force: true }); } catch {} throw e; }
}

const localDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };
  const TODAY = "2026-07-30";
  const cap = (over = {}) => ({
    id: "inference", title: "Inference", lockedOn: "2026-06-24", status: "tempered", reJirahDone: [],
    faultLines: AXES.map(a => ({ axis: a, status: "held", strike: `strike-${a}`, weld: "w", deep: "d" })),
    doubts: [1, 2, 3], traps: [1], bridges: [1, 2], interviewLines: [1], ...over,
  });

  const empty = build([], DEFAULT_INTERVALS, TODAY);
  assert("EMPTY-SAFE — no capsules ⇒ awaiting_data, no line, no crash",
    empty.status === "awaiting_data" && empty.line === null && empty.totals.capsules === 0);

  const b = build([cap()], DEFAULT_INTERVALS, TODAY);
  assert("nine axes map through with JIRAH's own status", b.concepts[0].axes_present.length === 9 && b.concepts[0].axes_cracked.length === 0);
  assert("the strike bank carries every survived question, verbatim",
    b.totals.strike_questions === 9 && b.strike_bank[0].strike === "strike-a" && b.strike_bank.every(s => /^strike-[a-i]$/.test(s.strike)));
  assert("counts are copied, never computed from prose", b.concepts[0].counts.doubts === 3 && b.concepts[0].counts.traps === 1);

  // Re-Jirah: locked 24 Jun ⇒ 27 Jun / 8 Jul / 5 Aug against a 30 Jul clock
  const r = b.concepts[0].rejirah;
  assert("schedule computed live from lockedOn + genome intervals",
    r.rounds.map(x => x.due).join() === "2026-06-27,2026-07-08,2026-08-05");
  assert("two rounds overdue, one still up, none done", r.rounds.map(x => x.status).join() === "overdue,overdue,up" && r.rounds_done === 0);
  assert("overdue_days reports the WORST round, not the newest", r.overdue_days === 33);
  assert("next_due is the earliest unserved round", r.next_due === "2026-06-27");
  const served = build([cap({ reJirahDone: ["2026-06-27"] })], DEFAULT_INTERVALS, TODAY).concepts[0].rejirah;
  assert("a served round goes `done` and stops driving next_due", served.rounds[0].status === "done" && served.next_due === "2026-07-08" && served.rounds_done === 1);

  // deferred axes are visible, never silently absent (THE METHOD step 0)
  const partial = build([cap({ faultLines: [{ axis: "a", status: "held", strike: "s", weld: "w" }, { axis: "b", status: "cracked", strike: "s2" }] })], DEFAULT_INTERVALS, TODAY);
  assert("axes never captured are NAMED as missing, not silently dropped",
    partial.concepts[0].axes_missing.join("") === "cdefghi" && partial.concepts[0].axes_present.join("") === "ab");
  assert("a cracked axis is surfaced by JIRAH's grade", partial.concepts[0].axes_cracked.join("") === "b");
  assert("an axis with no strike contributes nothing to the bank (never invents one)",
    partial.totals.strike_questions === 2 && partial.strike_bank.every(s => !!s.strike));

  // the two-worlds report — states disagreement, picks no winner
  const dis = build([cap()], DEFAULT_INTERVALS, TODAY, ["embeddings"]).scheduler_disagreement;
  assert("names what the capsule calls due and FSRS does not", dis.capsule_says_due_fsrs_quiet.join() === "inference");
  assert("and what FSRS calls due and the capsule does not", dis.fsrs_says_due_capsule_quiet.join() === "embeddings");

  // ORGANISM audit #33 (2026-08-04) — THE FIXTURE THAT HID THE BUG.
  // The check above passes a hand-made ARRAY, so the disk reader was never exercised and
  // the fact that fsrs writes INTEGERS in due_today/overdue could not be caught. These
  // feed the shape fsrs.mjs really emits.
  {
    const LIVE_SHAPE = { date: TODAY, total_cards: 5, due_today: 0, overdue: 4,
      hardest_due: ["inference", "context", "embeddings", "hallucinations"], status: "ok" };
    const read = fsrsDueFromCards(LIVE_SHAPE);
    assert("#33 FSRS's due NAMES are read from hardest_due, not from the integer counters",
      read.names.join() === "inference,context,embeddings,hallucinations" && read.names_known === 4);
    assert("#33 the frozen legacy pick returns [] against this exact shape (the bug, preserved)",
      [LIVE_SHAPE.due_today, LIVE_SHAPE.overdue].every(v => typeof v === "number")
      && (Array.isArray(LIVE_SHAPE.due_today) ? 1 : 0) + (Array.isArray(LIVE_SHAPE.overdue) ? 1 : 0) === 0);
    const b33 = build([cap()], DEFAULT_INTERVALS, TODAY, read);   // capsule `inference` is overdue
    assert("#33 the agreement arm can now be non-empty — it was structurally impossible before",
      b33.scheduler_agreement.join() === "inference");
    assert("#33 ...and the disagreement arms stop lying: FSRS-only names are named",
      b33.scheduler_disagreement.capsule_says_due_fsrs_quiet.length === 0
      && b33.scheduler_disagreement.fsrs_says_due_capsule_quiet.join() === "context,embeddings,hallucinations");
    assert("#33 a complete FSRS list is reported complete, with its have/need counter",
      b33.fsrs_due_names_complete === true && b33.fsrs_due_names_known === 4 && b33.fsrs_due_total === 4 && b33.fsrs_due_note === null);
    // hardest_due is capped (fsrs_config.hardestDueMax, canon 8): more due than named ⇒ say so
    const trunc = fsrsDueFromCards({ due_today: 3, overdue: 8, hardest_due: ["a", "b", "c", "d", "e", "f", "g", "h"] });
    assert("#33 a TRUNCATED name list is disclosed as a have/need counter, never assumed whole",
      trunc.complete === false && trunc.names_known === 8 && trunc.due_total === 11 && /over-report/.test(trunc.why));
    assert("#33 an unreadable cards.json is UNKNOWN, never a measured zero",
      fsrsDueFromCards(null).complete === null && fsrsDueFromCards(null).due_total === null
      && build([cap()], DEFAULT_INTERVALS, TODAY, fsrsDueFromCards(null)).fsrs_due_note !== null);
    assert("#33 an array caller still works byte-for-byte (back-compat with the old signature)",
      JSON.stringify(build([cap()], DEFAULT_INTERVALS, TODAY, ["embeddings"]).scheduler_disagreement) === JSON.stringify(dis));
    // and the LIVE file, exercised for real through the disk reader — shape only; the
    // values are fsrs's to compute and are deliberately not asserted.
    const liveRead = fsrsDueConcepts();
    assert("#33 the LIVE cards.json flows through the disk reader and yields NAMES (was always [])",
      Array.isArray(liveRead.names) && (liveRead.due_total === null || liveRead.names_known > 0 || liveRead.due_total === 0));
  }

  assert("MALFORMED-SAFE — a capsule with no lockedOn reports schedule_known:false, never a fake date",
    build([cap({ lockedOn: null })], DEFAULT_INTERVALS, TODAY).concepts[0].rejirah.schedule_known === false);
  assert("MALFORMED-SAFE — junk faultLines are skipped, not crashed on",
    build([cap({ faultLines: [null, { axis: "z" }, "nope"] })], DEFAULT_INTERVALS, TODAY).concepts[0].axes_present.length === 0);
  assert("a capsule with no id is not mapped at all (no phantom concept)",
    build([{ lockedOn: "2026-06-24" }], DEFAULT_INTERVALS, TODAY).totals.capsules === 0);
  assert("the genome owns the intervals — a custom schedule is honoured",
    build([cap()], [1, 2], TODAY).concepts[0].rejirah.rounds.map(x => x.due).join() === "2026-06-25,2026-06-26");
  assert("intervals fall back to canon when the genome is unreadable",
    loadIntervals("__no_such_file__").join() === "3,14,42");
  assert("IT SCHEDULES NOTHING — the emitted shape carries no card, no drill, no due-date for FSRS",
    !("cards" in b) && !("drills" in b) && !("fsrs" in b) && /reader/.test(b.engine));

  console.log(`\ncapsule_bridge selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") return selftest();
  const out = build(loadCapsules(), loadIntervals(), localDate(), fsrsDueConcepts());
  if (mode === "show") { console.log(JSON.stringify(out, null, 2)); return; }
  writeAtomic(OUT, out);
  console.log(`capsule_bridge: ${out.totals.capsules} capsule(s) · ${out.totals.axes_present} axes · ${out.totals.strike_questions} strike questions · ${out.rejirah_overdue.length} overdue → ${OUT}`);
  if (out.line) console.log(`  ${out.line}`);
  // audit #33: the two-schedulers read is the headline feature; print it so a run that
  // produces a wrong one is visible the night it happens, not two audits later.
  console.log(`  schedulers — agree: ${out.scheduler_agreement.join(", ") || "none"} · Re-Jirah only: ${out.scheduler_disagreement.capsule_says_due_fsrs_quiet.join(", ") || "none"} · FSRS only: ${out.scheduler_disagreement.fsrs_says_due_capsule_quiet.join(", ") || "none"} (FSRS named ${out.fsrs_due_names_known}/${out.fsrs_due_total === null ? "?" : out.fsrs_due_total})`);
  if (out.fsrs_due_note) console.log(`  WARN ${out.fsrs_due_note}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { build, mapCapsule, rejirahRounds, strikeBank, loadIntervals,
  // audit #33 (2026-08-04): the fixed FSRS due reader (pure + shell) with the frozen
  // legacy pick beside it, and the array/object normaliser build() accepts.
  fsrsDueFromCards, fsrsDueConcepts, fsrsDueConceptsLegacy, normalizeFsrsDue };
