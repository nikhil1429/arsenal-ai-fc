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
//   (evening packet) reads the agreement to rank, the have/need counter when the FSRS
//   name list is TRUNCATED, and — only since the dead-wire sweep of 10 Aug 2026 —
//   fsrs_due_note verbatim when the FSRS side is UNKNOWN. That last field had ZERO
//   readers repo-wide until then (`grep -n fsrs_due_note scripts/*.mjs` returned this
//   file alone): it existed only on main()'s console at :415, and this organ's ONE
//   automated invoker — heartbeat_config.json:6, run by heartbeat.mjs:146 with
//   stdio:"pipe" from conductor.mjs:71 at 08:39 — discards stdout. So on every
//   scheduled run the WARN was printed to nobody, which is the same silence that let
//   audit #33's wrong output stand for weeks. The console lines below are now a
//   SECOND, human-facing copy of a fact that reaches the packet through the file;
//   they are not the wire. Do not delete them, and do not rely on them either.
//   locked-count block (dead-wire sweep, 11 Aug 2026): locked_dated / locked_undated_names /
//   locked_count_complete / locked_count_note — CONSUMER: manager.mjs, which relays the note
//   verbatim onto the sheet's capsule line. It exists because `rejirah.schedule_known` — the
//   ONLY field in the organism that can name a capsule with no readable lockedOn — had zero
//   readers repo-wide, while that capsule silently split the locked count three ways (:196).
// READS:     dressing-room/state/capsules/*.json (read-only) · forge_profile.json
//            (rejirah_intervals_days — the genome owns the schedule, not this file) ·
//            cards.json (FSRS's due NAMES live in hardest_due, not in the integer counters)
//            ALL THREE now have a fault channel — capsules/ since 10 Aug (:248),
//            cards.json since audit #33 (:326), forge_profile.json since 11 Aug (:295).
// MODES: (default) write · show · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";                      // selftest only — the disk exercise (mirror.mjs:315 precedent)
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

function build(capsules, intervals, today, fsrsDue = [], faults = []) {
  const iv = normalizeIntervals(intervals);
  // THE GENOME'S FAULT RIDES THE EXISTING LANE (dead-wire sweep, 11 Aug 2026 — see
  // loadIntervals below for the proof — `grep -n "THE THIRD INPUT, TRACKED" this file; the
  // line numbers in this organ moved twice on 11 Aug alone, so anchor on the heading).
  // It is merged into `input_faults[]` and it must
  // NOT touch `capsules_complete`, which means ONE thing only: "this attempt could not
  // read every file in capsules/". An unreadable genome leaves totals.capsules exactly
  // right; flipping the flag would make postmatch.mjs:253 write "capsule_map incomplete
  // … unreadable, owner mirror.mjs" into SEASON.md — the permanent logbook — about a file
  // mirror.mjs does not own, and would send benchmark.mjs:1227 down the same wrong owner.
  const allFaults = iv.fault ? [...faults, iv.fault] : faults;
  const entries = capsules.filter(c => c && c.id).map(c => mapCapsule(c, iv.days, today))
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

  // -------------------------------------------------------------------------
  // DEAD-WIRE SWEEP (11 Aug 2026) — ORPHAN_FIELD: `rejirah.schedule_known`.
  // -------------------------------------------------------------------------
  // It has been emitted per capsule since day one and `grep -rn schedule_known` found
  // exactly three hits: this file, the map it writes, and the repo bundle. NOTHING read
  // it — and it is the only field in the organism that can name a capsule whose lockedOn
  // is absent or not ISO. That capsule does not fault (the file parses, it has an id, so
  // loadCapsules stays clean and `capsules_complete` reads true) and it does not vanish
  // (build maps it) — it SPLITS THE LOCKED COUNT, because the three organs that state
  // that count do not read the same field:
  //   · manager.mjs:290    locked      = totals.capsules      ⇒ counts it
  //   · benchmark.mjs:216  lockedSet   = concepts[].locked_on ⇒ does NOT (mapCapsule
  //                                      nulls a non-ISO date rather than fake one)
  //   · postmatch.mjs:236  lockedCount = concepts[].locked_on ⇒ does NOT
  // PROVEN 11 Aug 2026 on this build(), two capsules, one with lockedOn "21 June 2026":
  // totals.capsules 2 · lockedSet 1 · lockedCount 1 · capsules_complete true ·
  // input_faults []. So the team sheet says 2 locked while SEASON.md — the PERMANENT
  // logbook — writes 1, and benchmark's findRegressions can read the same gap on the
  // next lock as "locked 2 → 1", a regression that never happened.
  // The map is the only place that knows both numbers, so it states both, in this file's
  // own honesty grammar (fsrs_due_names_known/_total/_complete/_note, :235): a count, the
  // NAMES behind the gap, a boolean, and ONE owner-composed sentence a consumer relays
  // verbatim (no-invented-number law — the reader must not re-word what only the writer
  // can know). Nothing here decides WHICH count is the true one: this organ is a READER
  // and resolves nothing (:17). It only makes the disagreement sayable.
  const undated = entries.filter(e => e.rejirah.schedule_known === false).map(e => e.concept);
  const lockedDated = entries.length - undated.length;

  return {
    date: today,
    generated_at: new Date().toISOString(),
    status: entries.length ? "ok" : "awaiting_data",
    // wiring pass 10 Aug 2026 — the fault fields. `capsules_complete:false` means THIS
    // attempt could not read every file in capsules/, so `totals` and `concepts` below
    // are SHORT. main() therefore never ships them (see REFUSE TO SHIP A SHORT COUNT):
    // a map on disk carrying complete:false is always a PRESERVED last-true record with
    // these three keys stamped on top — which is why a consumer's whole test is
    // "complete === false ⇒ these numbers are `date`'s, not today's".
    // status stays "ok": the entries that DID read are true, and status is the gate five
    // organs use to decide whether to speak at all (manager.mjs:260) — degrading it would
    // silence four good capsules to report one broken file, which is a worse lie.
    capsules_complete: faults.length === 0,
    input_faults: allFaults,
    blocking_faults: allFaults.filter(f => f.blocking).map(f => f.file),
    engine: "capsule-bridge-v1 (reader — creates no cards, schedules nothing)",
    rejirah_intervals_days: iv.days,
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
    // THE LOCKED COUNT, BOTH WAYS (dead-wire sweep 11 Aug 2026 — see :196). Same honesty
    // grammar as the four fields directly above. `locked_count_complete:true` (today's
    // live map: 4 capsules, 4 ISO dates) means the two counts are the same number and a
    // consumer can stop thinking about it; false means they are NOT, and the note names
    // the gap. CONSUMER: manager.mjs relays `locked_count_note` verbatim onto the team
    // sheet's capsule line — the sheet is MACHINE-face, so this is never dealt as a card
    // (THE ANCHOR LAW): the date lives in the gist and mirror.mjs owns the copy of it.
    locked_dated: lockedDated,
    locked_undated_names: undated,
    locked_count_complete: undated.length === 0,
    locked_count_note: undated.length
      ? `${undated.length} locked capsule(s) carry no readable lockedOn (${undated.join(", ")}) — this map counts ${entries.length} in totals.capsules (manager's \`locked\`) and ${lockedDated} in concepts[].locked_on (benchmark's ROADMAP have · SEASON.md), so those two numbers disagree until the gist date is ISO; owner mirror.mjs`
      : null,
    line: entries.length
      ? (overdue.length
        ? `${overdue[0].concept} ka Re-Jirah ${overdue[0].rejirah.overdue_days} din overdue hai — aur uske ${bank.filter(b => b.concept === overdue[0].concept).length} strike sawaal already likhe rakhe hain.`
        : `${entries.length} capsule locked, ${bank.length} strike sawaal ready — koi Re-Jirah overdue nahi.`)
      : null,
  };
}

// ---------------------------------------------------------------------------
// THE PRIMARY INPUT, TRACKED (wiring pass, 10 Aug 2026)
// ---------------------------------------------------------------------------
// readJson()'s empty catch (:59) feeding .filter(Boolean) meant a truncated or
// half-written capsule VANISHED: no name, no counter, no stderr, exit 0. PROVEN
// on a copy of the real bytes — 2 files in capsules/, one a truncated write ⇒
// totals.capsules=1, concepts=["alpha"], and not one of the 17 emitted keys
// named the second file.
// That silence is not cosmetic, because three organs then state the short number
// as FACT:
//   benchmark.mjs:152  lockedSet   ⇒ a ROADMAP bucket loses a "have", and
//                                    findRegressions turns it into "locked 3 → 2",
//                                    which captains_call deals to him at an anchor
//   postmatch.mjs:214  lockedCount ⇒ written into SEASON.md, the permanent logbook
//   manager.mjs:261    locked      ⇒ rides the team sheet
// This file already refuses exactly this silence on its OTHER input (:266 —
// "cards.json missing or malformed ⇒ UNKNOWN, never a measured zero"); it now
// applies its own rule to its primary one. Grammar and field names are copied
// from benchmark.mjs:80-88 / :801-810 on purpose, so the two organs fault alike
// and manager.mjs's existing reader (its `inputFault` prefix, which only wants
// `blocking_faults` + `date`) works on this file with no new vocabulary.
// LEGACY (frozen verbatim, layering rule): the silent reader. Nothing on the run
// path calls it; it stands as the shape of the defect.
function loadCapsulesLegacy(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.toLowerCase().endsWith(".json"))
    .map(f => readJson(join(dir, f))).filter(Boolean);
}

function loadCapsules(dir = CAPSULES) {
  const faults = [];
  if (!existsSync(dir)) return { capsules: [], faults };   // absent dir = honest absence, never a fault
  const capsules = [];
  for (const f of readdirSync(dir).filter(n => n.toLowerCase().endsWith(".json")).sort()) {
    let j;
    try { j = JSON.parse(readFileSync(join(dir, f), "utf8")); }
    catch (e) { faults.push({ file: `capsules/${f}`, why: String((e && e.message) || e).slice(0, 140), blocking: true }); continue; }
    // Parsed, but build() drops an id-less capsule (and must — a phantom concept is
    // worse than a named gap). Same vanish, same damage, so it is named here too.
    if (!j || typeof j !== "object" || !String(j.id || "").trim()) {
      faults.push({ file: `capsules/${f}`, why: "parsed, but carries no id — cannot be mapped to a concept", blocking: true });
      continue;
    }
    capsules.push(j);
  }
  return { capsules, faults };
}

// ---------------------------------------------------------------------------
// THE THIRD INPUT, TRACKED (dead-wire sweep, 11 Aug 2026)
// ---------------------------------------------------------------------------
// This organ has three inputs, and until today only two could say they were broken:
// capsules/ got a fault channel on 10 Aug ("THE PRIMARY INPUT, TRACKED" above),
// cards.json has had an UNKNOWN channel since audit #33 ("unreadable ⇒ UNKNOWN, never a
// measured empty" — fsrsDueFromCards). The GENOME had neither. loadIntervals read
// forge_profile.json through readJson's empty catch (the one-liner at the top of this
// file), so a half-written file reverted the WHOLE Re-Jirah schedule to canon
// [3, 14, 42] with nothing said anywhere.
// PROVEN on the real bytes, 11 Aug 2026 — the live genome with its R2 moved to 10 days
// (exactly the mutation bootroom.mjs:298-302 files, and only ever on the captain's
// word), then that same file truncated mid-write:
//     intact    → rounds 2026-06-27 / 2026-07-04 / 2026-08-05
//     truncated → rounds 2026-06-27 / 2026-07-08 / 2026-08-05
// and the second map came out carrying capsules_complete:true, input_faults:[],
// rejirah_intervals_days:[3,14,42] — byte-indistinguishable from a healthy read. So a
// corrupted genome silently CANCELS an approved mutation: every next_due and
// overdue_days moves, and learnstate.mjs:65-69 ("embeddings 42d"), setpiece's ranking
// and the team sheet all restate the shifted number as this morning's fact.
// NON-BLOCKING, deliberately. benchmark.mjs:101's BLOCKING_INPUTS rule is "a file whose
// loss makes a COUNT short"; the genome makes no count short — totals.capsules and the
// strike bank are untouched — it moves DATES. Marking it blocking would take main()'s
// refuse-to-ship path ("REFUSE TO SHIP A SHORT COUNT") and freeze four good capsules'
// counts over three integers,
// a bigger lie than the one being fixed. So it rides `input_faults[{blocking:false}]`,
// which manager.mjs:196 already reads and renders VERBATIM onto the team sheet. No new
// field on the map, no new vocabulary, no new organ — the wire was the only thing
// missing.
// AN ABSENT KEY IS NOT A FAULT: bootroom.mjs:298 (`profile.rejirah_intervals_days ||
// [3, 14, 42]`) tolerates a genome that never carried the key, and so does this — canon
// is then the honest baseline, not a fallback FROM something. Same rule loadCapsules
// applies to an absent capsules/ dir. Only a file that EXISTS and cannot be
// parsed, or a key that exists and is junk, is named.
// LEGACY (frozen verbatim, layering rule): the silent reader. Nothing on the run path
// calls it; it stands as the shape of the defect.
function loadIntervalsLegacy(path = PROFILE) {
  const j = readJson(path);
  const v = j && j.rejirah_intervals_days;
  return Array.isArray(v) && v.length && v.every(n => Number.isInteger(n) && n > 0) ? v : DEFAULT_INTERVALS;
}

// the validity test, lifted verbatim out of the legacy reader above so the two agree by
// construction and cannot drift apart
const validIntervals = (v) => Array.isArray(v) && v.length && v.every(n => Number.isInteger(n) && n > 0);
const OWNER_HINT = "Owner: bootroom.mjs (the genome's sole writer — `node scripts/bootroom.mjs`)";

function loadIntervals(path = PROFILE) {
  const canon = { days: DEFAULT_INTERVALS, source: "canon-default", fault: null };
  if (!existsSync(path)) return canon;                 // no genome yet = honest absence
  let j;
  try { j = JSON.parse(readFileSync(path, "utf8")); }
  catch (e) {
    return { days: DEFAULT_INTERVALS, source: "canon-default-genome-unreadable", fault: {
      file: "forge_profile.json", blocking: false,
      why: `forge_profile.json UNREADABLE (${String((e && e.message) || e).slice(0, 80)}) — the Re-Jirah schedule fell back to canon [${DEFAULT_INTERVALS.join(", ")}], so if the genome carried an approved mutation, every next_due/overdue_days here is that mutation CANCELLED, not today's schedule. ${OWNER_HINT}` } };
  }
  const v = j && j.rejirah_intervals_days;
  if (v === undefined || v === null) return canon;     // key never written — the owner tolerates it, so do we
  if (!validIntervals(v)) {
    return { days: DEFAULT_INTERVALS, source: "canon-default-genome-unreadable", fault: {
      file: "forge_profile.json", blocking: false,
      why: `forge_profile.json parsed, but rejirah_intervals_days is not a list of positive whole days (${JSON.stringify(v).slice(0, 60)}) — the Re-Jirah schedule fell back to canon [${DEFAULT_INTERVALS.join(", ")}], so every next_due/overdue_days here is canon's, not the genome's. ${OWNER_HINT}` } };
  }
  return { days: v, source: "genome", fault: null };
}

// build() accepts either the rich reading above OR a bare array of days — the same
// two-shape contract normalizeFsrsDue (:369) gives the FSRS input, so every existing
// caller keeps working byte-for-byte (setpiece.mjs:1381 hands a bare [3, 14, 42], and
// this file's own suite hands [1, 2]). A bare array is the caller ASSERTING the
// schedule, so it carries no fault — there is nothing it failed to read.
function normalizeIntervals(intervals) {
  if (intervals && !Array.isArray(intervals) && typeof intervals === "object" && Array.isArray(intervals.days)) return intervals;
  return { days: Array.isArray(intervals) ? intervals : DEFAULT_INTERVALS, source: "caller", fault: null };
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
// fsrs.mjs slices it to cfg.hardestDueMax (canon default 8). With more due cards than
// that, "capsule_says_due_fsrs_quiet" over-reports — so the truncation is measured and
// disclosed rather than assumed away. Unreadable cards.json ⇒ due_total null and
// complete null: FSRS's list is UNKNOWN, never a measured empty.
//
// WIRING AUDIT 10 Aug 2026 — READ THE DECLARATION, STOP INFERRING IT.
// fsrs.mjs now writes cards.naming {named,due_total,cap,complete,unnamed,line}: the
// producer names its own cut. This organ was the ONLY place in the body that knew the
// list was capped, and it knew by arithmetic on a neighbour's counters — right, but the
// wrong organ's job, and it could not see a cut fsrs made for any reason other than the
// two counters. So the declaration wins when present. The arithmetic stays live
// underneath (not frozen — it is still the answer for a cards.json written before this
// pass, and it stays the cross-check when both are readable).
function fsrsDueFromCards(cards) {
  if (!cards || typeof cards !== "object") {
    return { names: [], due_total: null, names_known: 0, complete: null, naming_source: null,
      why: "cards.json missing or malformed — FSRS's due list is UNKNOWN, not empty" };
  }
  const pick = (arr) => (Array.isArray(arr) ? arr : []).map(c => String(c && (c.concept ?? c.id ?? c) || "").toLowerCase()).filter(Boolean);
  const names = [...new Set([...pick(cards.hardest_due), ...pick(cards.due_today), ...pick(cards.overdue)])];
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const dt = num(cards.due_today), od = num(cards.overdue);
  const derived_total = dt === null && od === null ? null : (dt || 0) + (od || 0);
  const derived_complete = derived_total === null ? null : names.length >= derived_total;

  const d = cards.naming && typeof cards.naming === "object" ? cards.naming : null;
  const declared = d && typeof d.complete === "boolean";
  const due_total = declared && num(d.due_total) !== null ? num(d.due_total) : derived_total;
  const complete = declared ? d.complete : derived_complete;
  const naming_source = declared ? "declared" : (derived_complete === null ? null : "derived");
  const cap = declared && num(d.cap) !== null ? d.cap : "fsrs_config.hardestDueMax";
  return {
    names, due_total, names_known: names.length, complete, naming_source,
    why: complete === false
      ? `FSRS reports ${due_total} due card(s) but names only ${names.length} (cards.hardest_due is capped at ${cap}${declared ? ", per fsrs's own cards.naming" : ""}) — "capsule_says_due_fsrs_quiet" may over-report`
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
      trunc.complete === false && trunc.names_known === 8 && trunc.due_total === 11 && /over-report/.test(trunc.why)
      && trunc.naming_source === "derived");
    // WIRING AUDIT 10 Aug 2026 — fsrs now DECLARES the cut in cards.naming; this reads it.
    // Would fail again if this organ went back to inferring, or if fsrs stopped declaring.
    const declTrunc = fsrsDueFromCards({ due_today: 3, overdue: 8, hardest_due: ["a", "b", "c", "d", "e", "f", "g", "h"],
      naming: { named: 8, due_total: 11, cap: 8, complete: false, unnamed: 3, line: "8/11 due cards named — 3 CUT by hardestDueMax=8" } });
    assert("WIRING: the producer's own cards.naming is READ, not re-derived (source: declared, cap named)",
      declTrunc.naming_source === "declared" && declTrunc.complete === false && declTrunc.due_total === 11
      && /capped at 8/.test(declTrunc.why) && /cards\.naming/.test(declTrunc.why));
    assert("WIRING: a cards.json with NO naming block still works — the arithmetic stays live underneath",
      fsrsDueFromCards({ due_today: 3, overdue: 8, hardest_due: ["a"] }).complete === false);
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

  // -------------------------------------------------------------------------
  // DEAD-WIRE SWEEP (11 Aug 2026) — THE ORPHANED `schedule_known`, producer half.
  // The assertion directly above has passed since day one and proved nothing about
  // the DAMAGE: schedule_known had no reader anywhere, so a capsule with a human-typed
  // date ("21 June 2026") was counted 2 by manager and 1 by benchmark/postmatch with
  // capsules_complete:true and input_faults:[] — a clean bill of health over two
  // organs stating different numbers as fact. These fail if the derived block goes
  // away, if it stops deriving FROM schedule_known, or if the note stops naming both
  // sides of the split (manager relays that sentence verbatim, so its content IS the
  // wire, not decoration).
  // -------------------------------------------------------------------------
  {
    const split = build([cap(), cap({ id: "context", lockedOn: "21 June 2026" })], DEFAULT_INTERVALS, TODAY);
    const lockedOnCount = split.concepts.filter(c => c.locked_on).length;   // benchmark:216 / postmatch:236
    assert("WIRE — a human-typed lockedOn splits the count (2 vs 1) and the map now STATES both numbers",
      split.totals.capsules === 2 && lockedOnCount === 1
      && split.locked_dated === 1 && split.locked_count_complete === false);
    assert("WIRE — the gap is NAMED (which capsule), derived from the once-orphaned schedule_known",
      split.locked_undated_names.join() === "context"
      && split.concepts.find(c => c.concept === "context").rejirah.schedule_known === false);
    assert("WIRE — the note names BOTH counts and both consumer groups, verbatim for the relay",
      /totals\.capsules/.test(split.locked_count_note) && /locked_on/.test(split.locked_count_note)
      && /SEASON\.md/.test(split.locked_count_note) && /mirror\.mjs/.test(split.locked_count_note));
    assert("WIRE — it is NOT an input fault: nothing was unreadable, so the short-count refusal stays out of it",
      split.capsules_complete === true && split.input_faults.length === 0 && split.blocking_faults.length === 0);
    const agreeing = build([cap()], DEFAULT_INTERVALS, TODAY);
    assert("WIRE — when every lockedOn is ISO the two counts agree, complete:true, note null (bias-to-silence)",
      agreeing.locked_dated === agreeing.totals.capsules
      && agreeing.locked_count_complete === true && agreeing.locked_count_note === null);
    // and the LIVE capsules/ — shape only; the count is mirror.mjs's to own.
    const liveSplit = build(loadCapsules().capsules, DEFAULT_INTERVALS, TODAY);
    assert("WIRE — the LIVE capsules/ carries the block (today: every date ISO ⇒ complete, no note)",
      typeof liveSplit.locked_dated === "number" && Array.isArray(liveSplit.locked_undated_names)
      && liveSplit.locked_count_complete === (liveSplit.locked_undated_names.length === 0));
  }
  assert("MALFORMED-SAFE — junk faultLines are skipped, not crashed on",
    build([cap({ faultLines: [null, { axis: "z" }, "nope"] })], DEFAULT_INTERVALS, TODAY).concepts[0].axes_present.length === 0);
  assert("a capsule with no id is not mapped at all (no phantom concept)",
    build([{ lockedOn: "2026-06-24" }], DEFAULT_INTERVALS, TODAY).totals.capsules === 0);
  assert("the genome owns the intervals — a custom schedule is honoured",
    build([cap()], [1, 2], TODAY).concepts[0].rejirah.rounds.map(x => x.due).join() === "2026-06-25,2026-06-26");
  // (11 Aug 2026: `.join()` here until today — loadIntervals now returns the tracked
  // reading, and an ABSENT genome is still canon with no fault, which is what this asserts)
  assert("intervals fall back to canon when there is no genome at all",
    loadIntervals("__no_such_file__").days.join() === "3,14,42");
  assert("IT SCHEDULES NOTHING — the emitted shape carries no card, no drill, no due-date for FSRS",
    !("cards" in b) && !("drills" in b) && !("fsrs" in b) && /reader/.test(b.engine));

  // -------------------------------------------------------------------------
  // WIRING PASS (2026-08-10) — THE VANISHING CAPSULE.
  // Exercised THROUGH THE DISK READER on real files, never through a fixture: the
  // whole defect was that readJson's empty catch + .filter(Boolean) turned a
  // half-written capsule into nothing, and a hand-made array of objects can never
  // reproduce a JSON.parse failure (the same fixture blindness that kept audit
  // #33's FSRS bug green for weeks — see that block above).
  // -------------------------------------------------------------------------
  {
    const dir = join(tmpdir(), `capsule-bridge-selftest-${process.pid}-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const good = { id: "alpha", title: "Alpha", lockedOn: "2026-06-24", status: "tempered",
      faultLines: [{ axis: "a", status: "held", strike: "s", weld: "w" }] };
    writeFileSync(join(dir, "alpha.json"), JSON.stringify(good));
    writeFileSync(join(dir, "beta.json"), JSON.stringify({ ...good, id: "beta" }).slice(0, 120));  // a truncated write, mid-mirror
    writeFileSync(join(dir, "gamma.json"), JSON.stringify({ title: "no id here", faultLines: [] }));
    const { capsules, faults } = loadCapsules(dir);
    assert("WIRE — a truncated capsule is NAMED by file, not silently filtered away",
      capsules.length === 1 && faults.length === 2
      && faults.some(f => f.file === "capsules/beta.json" && /JSON/i.test(f.why) && f.blocking === true));
    assert("WIRE — a parseable capsule with no id is named too (build() would drop it just as quietly)",
      faults.some(f => f.file === "capsules/gamma.json" && /no id/.test(f.why)));
    const short = build(capsules, DEFAULT_INTERVALS, TODAY, [], faults);
    assert("WIRE — the map declares the count SHORT: capsules_complete false + blocking_faults named",
      short.capsules_complete === false && short.totals.capsules === 1
      && short.blocking_faults.join() === "capsules/beta.json,capsules/gamma.json");
    // The defect, preserved and PROVEN on the same three files: legacy hands back a bare
    // array (2 of 3 — the truncated one gone, the id-less one still to be dropped later by
    // build), no fault channel of any kind, and the map it produces then claims a clean
    // bill of health — 1 capsule, complete:true — over a directory with two broken files.
    const lg = loadCapsulesLegacy(dir);
    const lgMap = build(lg, DEFAULT_INTERVALS, TODAY);
    assert("WIRE — the frozen legacy reader still vanishes it, and its map claims complete",
      lg.length === 2 && !("faults" in lg)
      && lgMap.totals.capsules === 1 && lgMap.capsules_complete === true);
    // clean dir ⇒ byte-identical behaviour to before this pass, and complete:true
    rmSync(join(dir, "beta.json"), { force: true }); rmSync(join(dir, "gamma.json"), { force: true });
    const clean = loadCapsules(dir);
    const okMap = build(clean.capsules, DEFAULT_INTERVALS, TODAY, [], clean.faults);
    assert("WIRE — a clean capsules/ reads complete, with no fault noise on the bus",
      okMap.capsules_complete === true && okMap.input_faults.length === 0
      && okMap.blocking_faults.length === 0 && okMap.totals.capsules === 1);
    assert("WIRE — a missing capsules/ dir is an honest ABSENCE, never a fault",
      loadCapsules(join(dir, "__nope__")).faults.length === 0);
    rmSync(dir, { recursive: true, force: true });
    // and the LIVE capsules/ flows through the tracked reader — shape only; the count is
    // mirror.mjs's to own and is deliberately not asserted here.
    const live = loadCapsules();
    assert("WIRE — the LIVE capsules/ reads through the tracked reader (names anything it cannot parse)",
      Array.isArray(live.capsules) && Array.isArray(live.faults)
      && live.faults.every(f => typeof f.file === "string" && typeof f.why === "string"));
  }

  // -------------------------------------------------------------------------
  // DEAD-WIRE SWEEP (2026-08-11) — THE GENOME THAT COULD NOT SAY IT WAS UNREADABLE.
  // Exercised THROUGH THE DISK READER on real bytes, for the same reason the two blocks
  // above are: readJson's empty catch IS the defect, and no in-memory fixture can
  // reproduce a JSON.parse failure. The bytes are the LIVE forge_profile.json with its
  // R2 moved to 10 days — the exact shape bootroom.mjs:298-302 mutates on his word — so
  // a fallback to canon is visible as a real date shift, not just a flag.
  // -------------------------------------------------------------------------
  {
    const dir = join(tmpdir(), `capsule-bridge-genome-${process.pid}-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const mutated = { version: "1.0", rejirah_intervals_days: [3, 10, 42], axis_weights: { a: 1 } };
    const good = join(dir, "good.json"), bad = join(dir, "bad.json"), junk = join(dir, "junk.json"), nokey = join(dir, "nokey.json");
    writeFileSync(good, JSON.stringify(mutated, null, 2));
    writeFileSync(bad, JSON.stringify(mutated, null, 2).slice(0, 40));      // a truncated write, mid-save
    writeFileSync(junk, JSON.stringify({ ...mutated, rejirah_intervals_days: [3, "ten", -42] }));
    writeFileSync(nokey, JSON.stringify({ version: "1.0", axis_weights: { a: 1 } }));

    const okRead = loadIntervals(good);
    assert("GENOME — an intact genome is honoured and files no fault",
      okRead.days.join() === "3,10,42" && okRead.source === "genome" && okRead.fault === null);

    const badRead = loadIntervals(bad);
    assert("GENOME WIRE — a truncated genome is NAMED, not silently reverted to canon",
      badRead.days.join() === "3,14,42" && badRead.source === "canon-default-genome-unreadable"
      && badRead.fault && badRead.fault.file === "forge_profile.json" && badRead.fault.blocking === false
      && /UNREADABLE/.test(badRead.fault.why) && /bootroom\.mjs/.test(badRead.fault.why));
    assert("GENOME WIRE — a parseable genome with a junk interval list is named too",
      loadIntervals(junk).fault !== null && /not a list of positive whole days/.test(loadIntervals(junk).fault.why));
    assert("GENOME — an ABSENT key is an honest canon baseline, never a fault (bootroom.mjs:298 tolerates it)",
      loadIntervals(nokey).fault === null && loadIntervals(nokey).source === "canon-default"
      && loadIntervals(nokey).days.join() === "3,14,42");

    // the whole point: the map must SAY the schedule below is canon's, not the genome's
    const capG = cap({ lockedOn: "2026-06-24" });
    const mGood = build([capG], okRead, TODAY), mBad = build([capG], badRead, TODAY);
    assert("GENOME WIRE — the approved mutation really does move the dates (so a silent revert is a real lie)",
      mGood.concepts[0].rejirah.rounds.map(r => r.due).join() === "2026-06-27,2026-07-04,2026-08-05"
      && mBad.concepts[0].rejirah.rounds.map(r => r.due).join() === "2026-06-27,2026-07-08,2026-08-05");
    assert("GENOME WIRE — the shifted map carries the fault on the bus (this was [] before 11 Aug 2026)",
      mBad.input_faults.length === 1 && mBad.input_faults[0].file === "forge_profile.json"
      && mBad.rejirah_intervals_days.join() === "3,14,42" && mGood.input_faults.length === 0);
    // ...and it must NOT lie in the OTHER direction: the capsule count is not short, so
    // capsules_complete stays true and main() still ships (postmatch/benchmark read that
    // flag to blame mirror.mjs, which does not own the genome).
    assert("GENOME WIRE — a bad genome never flips capsules_complete and never blocks the ship",
      mBad.capsules_complete === true && mBad.blocking_faults.length === 0 && mBad.totals.capsules === 1);
    // both faults on one map, both named, and only the capsule one blocks
    const both = build([capG], badRead, TODAY, [], [{ file: "capsules/beta.json", why: "Unexpected end of JSON input", blocking: true }]);
    assert("GENOME WIRE — a capsule fault and a genome fault coexist; only the capsule one blocks",
      both.input_faults.length === 2 && both.blocking_faults.join() === "capsules/beta.json"
      && both.capsules_complete === false);

    // THE CONSUMER HALF. manager.mjs:193-199 `inputFault()` is the organism's only reader
    // of this vocabulary, and its soft branch is what carries the genome onto the team
    // sheet. Asserted the way forge_session.mjs:1556 asserts its chain reader: on the
    // consumer's own source, so deleting the branch turns this RED instead of quietly
    // orphaning the field again.
    const mgr = readFileSync(join(__dirname, "manager.mjs"), "utf8");
    assert("GENOME WIRE (consumer) — manager.mjs still reads the NON-blocking half of input_faults[] onto the sheet",
      /input_faults\s*\)\s*\|\|\s*\[\]\)\.filter\(\(f\) => f && !f\.blocking && f\.file\)/.test(mgr));
    // and the render the sheet would produce, replayed with manager's own expression
    const soft = ((mBad && mBad.input_faults) || []).filter((f) => f && !f.blocking && f.file);
    const rendered = `⚠ ${soft.map((f) => f.file).join(", ")} — ${soft[0].why}`;
    assert("GENOME WIRE (consumer) — the sheet line names the file, the canon fallback and the owner",
      /forge_profile\.json/.test(rendered) && /\[3, 14, 42\]/.test(rendered) && /bootroom\.mjs/.test(rendered));

    // the defect, preserved and PROVEN on the same bytes: legacy hands back a bare array,
    // canon and mutation are indistinguishable, and there is no fault channel of any kind.
    const lg = loadIntervalsLegacy(bad);
    assert("GENOME — the frozen legacy reader still reverts silently (the defect, preserved)",
      Array.isArray(lg) && lg.join() === "3,14,42" && lg.join() === loadIntervalsLegacy("__no_such_file__").join());
    // BACK-COMPAT: a bare-array caller (setpiece.mjs:1381 hands [3, 14, 42]; :483 above
    // hands [1, 2]) must be byte-unchanged and must never have a fault invented for it —
    // an array is the caller ASSERTING the schedule, and it read nothing that could fail.
    const bare = build([capG], [1, 2], TODAY);
    const rich = build([capG], { days: [1, 2], source: "caller", fault: null }, TODAY);
    assert("GENOME — a bare-array caller is byte-identical to the rich reading, with no fault invented",
      bare.rejirah_intervals_days.join() === "1,2" && bare.input_faults.length === 0
      && JSON.stringify({ ...bare, generated_at: "" }) === JSON.stringify({ ...rich, generated_at: "" }));
    rmSync(dir, { recursive: true, force: true });
    // and the LIVE genome flows through the tracked reader — shape only; the VALUES are
    // bootroom.mjs's to own and are deliberately not asserted here.
    const live = loadIntervals();
    assert("GENOME — the LIVE forge_profile.json reads through the tracked reader (names it if unreadable)",
      Array.isArray(live.days) && live.days.length > 0 && typeof live.source === "string"
      && (live.fault === null || (typeof live.fault.why === "string" && live.fault.blocking === false)));
  }

  console.log(`\ncapsule_bridge selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") return selftest();
  const { capsules, faults } = loadCapsules();
  const out = build(capsules, loadIntervals(), localDate(), fsrsDueConcepts(), faults);
  if (mode === "show") { console.log(JSON.stringify(out, null, 2)); return; }
  // REFUSE TO SHIP A SHORT COUNT (10 Aug 2026 wiring pass; benchmark.mjs:785-810 is the
  // house precedent, word for word). An unreadable capsule does not make the map wrong in
  // some abstract way — it makes `totals.capsules` and `concepts[]` SMALLER, and three
  // organs restate that number as evidence. So the short map never reaches the bus: the
  // LAST TRUE record is kept verbatim — its own date, generated_at, totals, concepts — and
  // only the fault fields are stamped on top. Nothing is fabricated, nothing true is lost.
  // Consequences that are deliberate:
  //   · `generated_at` stays yesterday's, so learnstate.mjs:69-72 ("MAP Nd purana") starts
  //     saying so at the next SessionStart — an existing reader notices, no new organ.
  //   · no prior map ⇒ NOTHING is written. Absence is already handled honestly downstream
  //     (manager.mjs:260 gates on status "ok"; postmatch.mjs:214 renders "—").
  // Exit stays 0: heartbeat.mjs:146 shells this with stdio "pipe" and turns any non-zero
  // into `ran:false` in pulse.json — which would relabel a NAMED fault as an anonymous
  // "capsule_bridge never ran". The fault rides the bus and stdout instead.
  if (out.blocking_faults.length) {
    const prev = readJson(OUT);
    console.log(`capsule_bridge: WARN ${out.blocking_faults.join(", ")} UNREADABLE (malformed JSON, not an empty file) — refusing to overwrite ${prev ? "the last true map" : "anything"} with a short count. Owner: mirror.mjs (\`node scripts/mirror.mjs\`).`);
    for (const f of out.input_faults) console.log(`  ${f.file}: ${f.why}`);
    if (prev && Array.isArray(prev.concepts)) {
      writeAtomic(OUT, { ...prev, capsules_complete: false, input_faults: out.input_faults,
        blocking_faults: out.blocking_faults, last_attempt_at: new Date().toISOString() });
      console.log(`  kept: ${prev.date || "?"}'s map verbatim (${(prev.totals && prev.totals.capsules) ?? "?"} capsule(s)) → ${OUT}`);
    } else console.log(`  no prior map to keep — nothing written (absence, not a zero).`);
    return;
  }
  writeAtomic(OUT, out);
  console.log(`capsule_bridge: ${out.totals.capsules} capsule(s) · ${out.totals.axes_present} axes · ${out.totals.strike_questions} strike questions · ${out.rejirah_overdue.length} overdue → ${OUT}`);
  if (out.line) console.log(`  ${out.line}`);
  // audit #33: the two-schedulers read is the headline feature; print it so a run that
  // produces a wrong one is visible the night it happens, not two audits later.
  console.log(`  schedulers — agree: ${out.scheduler_agreement.join(", ") || "none"} · Re-Jirah only: ${out.scheduler_disagreement.capsule_says_due_fsrs_quiet.join(", ") || "none"} · FSRS only: ${out.scheduler_disagreement.fsrs_says_due_capsule_quiet.join(", ") || "none"} (FSRS named ${out.fsrs_due_names_known}/${out.fsrs_due_total === null ? "?" : out.fsrs_due_total})`);
  if (out.fsrs_due_note) console.log(`  WARN ${out.fsrs_due_note}`);
  // same standing as the WARN above (see the header): a SECOND, human-facing copy. The
  // wire is the field — manager.mjs reads locked_count_note off the file; this line is
  // for whoever is watching a run, and heartbeat's stdio:"pipe" throws it away.
  if (out.locked_count_note) console.log(`  WARN ${out.locked_count_note}`);
  // dead-wire sweep 11 Aug 2026 — the non-blocking faults (today: the genome) never reach
  // the refuse-to-ship branch above, so this is their only console surface. Same standing:
  // a SECOND, human-facing copy of a fact that reaches the sheet through the file (see the
  // header note at :44-50). The wire is input_faults[]; this is not the wire.
  for (const f of out.input_faults.filter(f => !f.blocking)) console.log(`  WARN ${f.file}: ${f.why}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { build, mapCapsule, rejirahRounds, strikeBank,
  // dead-wire sweep (2026-08-11): the tracked genome reader that NAMES an unreadable
  // forge_profile.json instead of silently reverting the schedule to canon, with the
  // silent one frozen beside it and the array/object normaliser build() accepts.
  loadIntervals, loadIntervalsLegacy, normalizeIntervals,
  // wiring pass (2026-08-10): the tracked capsule reader that NAMES what it could not
  // read, with the silent one frozen beside it.
  loadCapsules, loadCapsulesLegacy,
  // audit #33 (2026-08-04): the fixed FSRS due reader (pure + shell) with the frozen
  // legacy pick beside it, and the array/object normaliser build() accepts.
  fsrsDueFromCards, fsrsDueConcepts, fsrsDueConceptsLegacy, normalizeFsrsDue };
