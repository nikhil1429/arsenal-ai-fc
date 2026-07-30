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
// READS:     dressing-room/state/capsules/*.json (read-only) · forge_profile.json
//            (rejirah_intervals_days — the genome owns the schedule, not this file)
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
  const fsrsSet = new Set((fsrsDue || []).map(x => String(x).toLowerCase()));
  const capsuleDue = new Set(overdue.map(e => e.concept));
  const disagreement = {
    capsule_says_due_fsrs_quiet: [...capsuleDue].filter(c => !fsrsSet.has(c)),
    fsrs_says_due_capsule_quiet: [...fsrsSet].filter(c => !capsuleDue.has(c)),
  };

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
    scheduler_disagreement: disagreement,
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

function fsrsDueConcepts() {
  const cards = readJson(join(STATE_DIR, "cards.json"));
  const pick = (arr) => (Array.isArray(arr) ? arr : []).map(c => String(c && (c.concept ?? c.id ?? c) || "").toLowerCase()).filter(Boolean);
  return cards ? [...new Set([...pick(cards.due_today), ...pick(cards.overdue)])] : [];
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
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { build, mapCapsule, rejirahRounds, strikeBank, loadIntervals };
