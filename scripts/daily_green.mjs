#!/usr/bin/env node
// ============================================================================
// daily_green.mjs · ARSENAL AI FC — THE GREEN LINE (the done-line witness, 24 Sep 2026)
//   SOLE WRITER of dressing-room/state/daily_green.jsonl (SOLE WRITER: scripts/daily_green.mjs)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. His done-line for the whole organism: it is "working" when ONE
// deterministic witness prints a green line THREE study days in a row with him
// actually studying. Until today that sentence had no code path, so "is it working?"
// was answered by whichever session was asked, from memory. His own law (L4): a law
// is a code path or it does not exist. This is that code path.
//
// WHAT IT IS. TIER 0 — no model call, no network, no key. ONE line a day, eleven
// clauses, each GREEN / RED / N-A with a short reason:
//    1 reps       reps >= 1 on a study day           reps_log.jsonl through capture.mjs supersedeReps
//    2 pointer    the study pointer moved            forge_session.json + forge_sessions.jsonl resume_pointer(.at)
//    3 notes      the day's note block extracted     registry.json emit_contract row "note_blocks" (registry.mjs emitRows)
//    4 examiner   the full-time retrieval test ran   gaffer_grade_queue.jsonl `settled` rows (gaffer_brain.mjs judge-round)
//    5 rejirah    the Re-Jirah log is born, and written when a round was due
//                                                    rejirah.mjs readLog + loadCapsules + openRound + intervalsOf
//    6 cards      cards dealt <= 1 per anchor        captains_call.json dealt[] stamps
//    7 readiness  the readiness verdict delivered    readiness.json through oura_coach.mjs readingFor
//    8 fulltime   full-time closed (HIT/MISS + KAL)  post_match/<date>.md, postmatch.mjs KAL_RE
//    9 daemons    6/6 up, or each down one explained by its input gate
//                                                    daemon_watchdog.json through state.mjs daemonFacts
//   10 suite      the suite runnable                 watchman_last.json through state.mjs suiteFacts
//   11 pushed     nothing committed-but-unpushed     git, through state.mjs gitFacts
//
// THE RULES IT HOLDS (each asserted both ways in the selftest):
//   · READ-ONLY on every file but its own ledger. Every clause reads its OWNER's file or
//     the owner's exported reader; nothing here re-derives what an organ already exports.
//   · NOT BORN IS RED. A clause whose input does not exist yet prints RED "not born" —
//     never GREEN, never a silent N-A. N-A is legal ONLY for clauses 1-5 on a real
//     non-study day.
//   · FAIL CLOSED. Unknown or unreadable = RED "unreadable: <which>". It never throws.
//   · A STUDY DAY is a day that holds an open or closed sitting (sitting.json + the
//     sitting organ's close rows in sitting_reviews.jsonl). The streak counts STUDY days,
//     not calendar days: a non-study day is skipped, a RED study day breaks it, and a day
//     with no row at all breaks it too (an unwitnessed day is not evidence of anything).
//   · ONE ROW PER DATE, IDEMPOTENT. Re-running the same date appends nothing when the row
//     is identical; when the facts changed, a new row is appended and the LATEST row for a
//     date is the one that counts (append-only, never rewritten — L9).
//   · THE GOALKEEPER'S BOUNDARY. Clause 7 says only whether a reading exists for the day.
//     It never prints the verdict's content, a biometric, or any medication or diagnosis
//     wording — the payload is not read past its `ok` and `day`.
//   · ONE ROOT OVERRIDE, IN-PROCESS ONLY. witness() takes a `fixture` argument that only
//     this file's selftest passes; there is no env var and no CLI flag that re-points it.
// HONEST GAPS, named rather than hidden:
//   · clause 3: the note extraction organ is not built (learn/SKILL.md: notes are
//     EXTRACTED by code at the week's end). The day a lane is declared in the registry as
//     emit_contract subject "note_blocks", this clause reads it with no code change.
//   · clause 6: a dealt[] stamp carries no anchor name. captains_call.mjs `deal` pushes
//     exactly ONE card per invocation, and every card dealt today rests for the rest of
//     the day (pickCard). So the only way an anchor can be dealt twice is the same card
//     re-dealt the same day — that is what this clause measures.
//   · clause 9: the only daemon with an input gate on disk is the sitting brain
//     (watchman.mjs probeSitting: down with no sitting open is INFO, not RED). Any other
//     daemon down is unexplained and RED.
//   · clauses 9-11 read the machine NOW; on a past --date they say so.
// WHO ELSE COULD ACT ON THIS OUTPUT? state.mjs (a future field) · /full-time · the runner.
// MODES: line (default) | --json | --date YYYY-MM-DD | selftest
// CLI:   node scripts/daily_green.mjs [--json] [--date YYYY-MM-DD] | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gitFacts, daemonFacts, suiteFacts, sittingFacts } from "./state.mjs";
import { supersedeReps } from "./capture.mjs";                     // reps_log's owner defines what a correction means
import { readLog as rejirahRows, loadCapsules, openRound, relockIndexFrom, intervalsOf } from "./rejirah.mjs";
import { readingFor } from "./oura_coach.mjs";
import { KAL_RE } from "./postmatch.mjs";
import { emitRows } from "./registry.mjs";
import { DAEMONS } from "./daemon_watchdog.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LEDGER = join(ROOT, "dressing-room", "state", "daily_green.jsonl");   // this organ's ONE write

// ── SMALL READERS — every one returns a stated outcome, never throws ─────────
const IST_MS = 5.5 * 3600000;
const istDay = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? new Date(t + IST_MS).toISOString().slice(0, 10) : null; };
const todayIst = (now = new Date()) => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const clip = (s, n) => { const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

/** A whole file: { born:false } when absent, { born:true, text } when read, { born:true, error } when unreadable. */
function readFile(p) {
  if (!existsSync(p)) return { born: false };
  try { return { born: true, text: readFileSync(p, "utf8").replace(/^﻿/, "") }; }
  catch (e) { return { born: true, error: e && e.code ? e.code : "read failed" }; }
}
function readJsonFile(p) {
  const f = readFile(p);
  if (!f.born || f.error) return f;
  try { return { born: true, json: JSON.parse(f.text) }; }
  catch (e) { return { born: true, error: "unparseable JSON" }; }
}
/** JSONL: an unparseable line is COUNTED, never silently dropped. */
function readJsonl(p) {
  const f = readFile(p);
  if (!f.born || f.error) return f;
  const rows = []; let bad = 0;
  for (const line of f.text.split(/\r?\n/)) {
    const s = line.trim(); if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch (e) { bad++; }
  }
  return { born: true, rows, bad };
}

const G = (why) => ({ status: "GREEN", why });
const R = (why) => ({ status: "RED", why });
const NA = (why) => ({ status: "N-A", why });
const NOT_BORN = (what) => R(`not born: ${what}`);
const UNREADABLE = (what) => R(`unreadable: ${what}`);

// ── THE STUDY DAY (the sitting organ's files) ────────────────────────────────
// A study day holds a sitting that was open at some moment of that IST day: the one in
// sitting.json (open or closed), or any close row the sitting organ appended to
// sitting_reviews.jsonl. sitting.json unreadable = UNKNOWN, which fails clauses 1-5 closed.
function studyDay(st, day, now) {
  const s = readJsonFile(join(st, "sitting.json"));
  if (!s.born) return { known: false, why: "sitting.json not born" };
  if (s.error) return { known: false, why: `sitting.json ${s.error}` };
  const hits = [];
  const cur = s.json;
  if (cur && typeof cur === "object" && cur.id && cur.opened_at) {
    const from = istDay(cur.opened_at);
    const to = cur.closed_at ? istDay(cur.closed_at) : todayIst(now);
    if (from && to && from <= day && day <= to) hits.push(`${cur.closed_at ? "closed" : "open"} sitting ${cur.id}`);
  }
  const rv = readJsonl(join(st, "sitting_reviews.jsonl"));
  if (rv.born && rv.error) return { known: false, why: `sitting_reviews.jsonl ${rv.error}` };
  for (const r of (rv.rows || [])) {
    if (r && r.kind === "sitting_review" && istDay(r.closed_at) === day && !hits.some((h) => h.endsWith(` ${r.sitting_id}`))) hits.push(`closed sitting ${r.sitting_id}`);
  }
  return { known: true, study: hits.length > 0, why: hits.length ? hits.join(", ") : "no sitting open or closed on this day" };
}

// ── THE ELEVEN CLAUSES. Each: (ctx) → { status, why }. ctx = { st, root, day, now, today, study, fixture } ─
// 1 · reps_log.jsonl — capture.mjs owns it; supersedeReps is its definition of a correction.
function cReps({ st, day }) {
  const f = readJsonl(join(st, "reps_log.jsonl"));
  if (!f.born) return NOT_BORN("reps_log.jsonl");
  if (f.error) return UNREADABLE(`reps_log.jsonl (${f.error})`);
  const n = supersedeReps(f.rows).filter((r) => r && istDay(r.ts) === day).length;
  return n >= 1 ? G(`${n} rep(s)`) : R(`0 reps on ${day}`);
}
// 2 · the resume pointer — forge_session.mjs stamps resume_pointer {text, step, at} on
// forge_session.json (and keeps resume_pointer_history); its close rows land in
// forge_sessions.jsonl. "Moved" = a pointer stamped (`at`) on this day.
function cPointer({ st, day }) {
  const live = readJsonFile(join(st, "forge_session.json"));
  const past = readJsonl(join(st, "forge_sessions.jsonl"));
  if (!live.born && !past.born) return NOT_BORN("forge_session.json + forge_sessions.jsonl");
  if (live.error) return UNREADABLE(`forge_session.json (${live.error})`);
  if (past.born && past.error) return UNREADABLE(`forge_sessions.jsonl (${past.error})`);
  const pointers = [];
  const take = (s) => {
    if (!s || typeof s !== "object") return;
    if (s.resume_pointer && s.resume_pointer.at) pointers.push(s.resume_pointer.at);
    for (const p of (Array.isArray(s.resume_pointer_history) ? s.resume_pointer_history : [])) if (p && p.at) pointers.push(p.at);
  };
  take(live.json);
  for (const r of (past.rows || [])) take(r);
  if (!pointers.length) return NOT_BORN("no resume_pointer ever stamped");
  const today = pointers.filter((at) => istDay(at) === day).length;
  if (today) return G(`moved ${today}×`);
  const last = pointers.map(istDay).filter(Boolean).sort().pop();
  return R(`did not move (last ${last || "?"})`);
}
// 3 · the note block — no organ extracts it yet. The registry is the one place a lane is
// declared; the day registry.json carries an emit_contract row "note_blocks" with a
// writes_to file, this clause reads that file's rows for the day. Until then: not born.
const NOTE_SUBJECT = "note_blocks";
function cNotes({ st, day }) {
  const reg = join(st, "registry.json");
  if (!existsSync(reg)) return UNREADABLE("registry.json");
  let rows;
  try { rows = emitRows(reg); } catch (e) { return UNREADABLE(`registry.json (${clip(e && e.message, 40)})`); }
  const row = (rows || []).find((r) => r && r.subject === NOTE_SUBJECT && r.writes_to);
  if (!row) return NOT_BORN(`no note-extraction organ (registry emit_contract has no "${NOTE_SUBJECT}" lane)`);
  const f = readJsonl(join(st, row.writes_to));
  if (!f.born) return NOT_BORN(`${row.writes_to}`);
  if (f.error) return UNREADABLE(`${row.writes_to} (${f.error})`);
  const n = f.rows.filter((r) => r && istDay(r.ts || r.at) === day).length;
  return n ? G(`${n} block(s) extracted`) : R(`no block extracted on ${day}`);
}
// 4 · the examiner — the full-time retrieval test is gaffer_brain.mjs `judge-round`: ONE
// judge over the day's banked answers, whose every verdict is a `settled` row (with the IST
// `day` stamped by the owner) in gaffer_grade_queue.jsonl.
function cExaminer({ st, day }) {
  const f = readJsonl(join(st, "gaffer_grade_queue.jsonl"));
  if (!f.born) return NOT_BORN("gaffer_grade_queue.jsonl");
  if (f.error) return UNREADABLE(`gaffer_grade_queue.jsonl (${f.error})`);
  const n = f.rows.filter((r) => r && r.kind === "settled" && (r.day || istDay(r.ts)) === day).length;
  return n ? G(`judge-round settled ${n}`) : R(`judge-round did not run on ${day}`);
}
// 5 · the Re-Jirah — rejirah.mjs owns the log AND the schedule (openRound honours GAME ON:
// a pre-cyborg lock opens no round). "Due" = a capsule whose open round's due date is on or
// before this day. The log itself must exist: a log never born is RED whatever is due.
function cRejirah({ st, day, fixture }) {
  const logPath = join(st, "rejirah_log.jsonl");
  if (!existsSync(logPath)) return NOT_BORN("rejirah_log.jsonl");
  const capDir = join(st, "capsules");
  if (!existsSync(capDir)) return UNREADABLE("capsules/ (the mirror)");
  let due = [];
  try {
    const rl = readFile(join(st, "relocks.jsonl"));
    const caps = loadCapsules(capDir, rl.born && !rl.error ? relockIndexFrom(rl.text) : {});
    const intervals = fixture ? fixture.intervals : intervalsOf();
    for (const c of caps) { const o = openRound(c, intervals); if (o && o.ok && o.due <= day) due.push(`${c.id} R${o.round}`); }
  } catch (e) { return UNREADABLE(`Re-Jirah schedule (${clip(e && e.message, 40)})`); }
  const written = rejirahRows(logPath, { raw: true }).filter((r) => istDay(r.ts) === day).length;
  if (!due.length) return G(`born · none due${written ? ` · ${written} row(s)` : ""}`);
  return written ? G(`due ${due[0]} · ${written} row(s)`) : R(`due ${due[0]}${due.length > 1 ? ` (+${due.length - 1})` : ""} · no row on ${day}`);
}
// 6 · the Captain's Call — captains_call.json dealt[] (see HONEST GAPS for the measurement).
function cCards({ st, day }) {
  const f = readJsonFile(join(st, "captains_call.json"));
  if (!f.born) return NOT_BORN("captains_call.json");
  if (f.error) return UNREADABLE(`captains_call.json (${f.error})`);
  if (!f.json || !Array.isArray(f.json.cards)) return UNREADABLE("captains_call.json (no cards[])");
  let total = 0; const twice = [];
  for (const c of f.json.cards) {
    const n = (Array.isArray(c && c.dealt) ? c.dealt : []).filter((t) => istDay(t) === day).length;
    total += n;
    if (n > 1) twice.push(`${c.id} ${n}×`);
  }
  return twice.length ? R(`re-dealt same day: ${twice.join(", ")}`) : G(`${total} dealt, ≤1 each`);
}
// 7 · the readiness verdict — oura_coach.mjs readingFor(day, readiness) is the owner's own
// freshness judge. Nothing past `ok` and `day` is ever printed (the Goalkeeper's boundary).
function cReadiness({ st, day }) {
  const f = readJsonFile(join(st, "readiness.json"));
  if (!f.born) return NOT_BORN("readiness.json");
  if (f.error) return UNREADABLE(`readiness.json (${f.error})`);
  const r = readingFor(day, f.json);
  if (r.fresh) return G(`verdict on file for ${r.day}`);
  return R(r.day ? `no reading for ${day} (newest ${r.day})` : "no reading on file");
}
// 8 · full-time — postmatch.mjs writes post_match/<date>.md: a RESULT line (its four legal
// results; REST renders as LOAD-MANAGED) and the KAL-line in the exact form KAL_RE parses.
function cFulltime({ st, day }) {
  const dir = join(st, "post_match");
  if (!existsSync(dir)) return NOT_BORN("post_match/");
  const f = readFile(join(dir, `${day}.md`));
  if (!f.born) return R(`not closed (no post_match/${day}.md)`);
  if (f.error) return UNREADABLE(`post_match/${day}.md (${f.error})`);
  const result = (f.text.match(/^RESULT:\s*(HIT|MISS|PARTIAL|LOAD-MANAGED)/m) || [])[1];
  const kal = KAL_RE.test(f.text);
  if (result && kal) return G(`${result} + KAL`);
  return R(`${result ? result : "no RESULT"}${kal ? "" : " · no KAL-line"}`);
}
// 9 · the daemons — the watchdog's own last pass (state.mjs daemonFacts), never a probe of
// our own. The roster is daemon_watchdog.mjs DAEMONS. The one input gate on disk is the
// sitting brain's (watchman.mjs probeSitting): down with no sitting open is not a fault.
const INPUT_GATES = Object.freeze({
  sitting: (st) => { const s = sittingFacts({ stateDir: st }); return s.open ? null : "no sitting open (watchman probeSitting: INFO)"; },
});
function cDaemons({ st, day, now, today }) {
  const w = readJsonFile(join(st, "daemon_watchdog.json"));
  if (!w.born) return NOT_BORN("daemon_watchdog.json (no watchdog pass)");
  if (w.error) return UNREADABLE(`daemon_watchdog.json (${w.error})`);
  const d = daemonFacts({ stateDir: st, now });
  if (!d.known) return UNREADABLE("daemon_watchdog.json (no ports{})");
  const passDay = d.age_min === null ? null : istDay(new Date(now.getTime() - d.age_min * 60000).toISOString());
  if (day === today && passDay !== day) return R(`stale pass (${passDay || "?"})`);
  const missing = DAEMONS.map((x) => x.name).filter((n) => !(n in (w.json.ports || {})));
  const down = [...d.down, ...missing];
  const unexplained = down.filter((n) => !(INPUT_GATES[n] && INPUT_GATES[n](st)));
  const asOf = day === today ? "" : " (as of now)";
  if (!unexplained.length) return G(`${d.up}/${DAEMONS.length} up${down.length ? ` · gated: ${down.join(",")}` : ""}${asOf}`);
  return R(`down: ${unexplained.join(",")}${asOf}`);
}
// 10 · the suite — the watchman's nightly sweep (state.mjs suiteFacts). RUNNABLE, not green:
// only its `suite-unrunnable` finding reds this clause. A sweep older than the night before
// this day is stale (the watchman's cadence is nightly).
function cSuite({ st, day, now, today }) {
  if (!existsSync(join(st, "watchman_last.json"))) return NOT_BORN("watchman_last.json (no sweep)");
  const s = suiteFacts({ stateDir: st, now });
  if (!s.known) return UNREADABLE("watchman_last.json");
  const sweepDay = s.age_min === null ? null : istDay(new Date(now.getTime() - s.age_min * 60000).toISOString());
  const asOf = day === today ? "" : " (as of now)";
  if ((s.reds || []).includes("suite-unrunnable")) return R(`unrunnable (sweep ${sweepDay || "?"})${asOf}`);
  if (!sweepDay || sweepDay < addDays(day, -1)) return R(`stale sweep (${sweepDay || "?"})`);
  return G(`runnable (sweep ${sweepDay})${asOf}`);
}
// 11 · pushed — state.mjs gitFacts: `ahead` is commits on HEAD not on its upstream. Dirty
// files are not committed, so they never count against this clause — and their count is
// kept OUT of the row, or this organ's own untracked ledger would change the row it writes.
function cPushed({ root, day, today, fixture }) {
  const g = gitFacts(fixture && fixture.gitExec ? { cwd: root, exec: fixture.gitExec } : { cwd: root });
  const asOf = day === today ? "" : " (as of now)";
  if (!g.known) return UNREADABLE("git");
  if (g.ahead === null) return UNREADABLE("git upstream (no @{u})");
  return g.ahead === 0 ? G(`0 unpushed${asOf}`) : R(`${g.ahead} unpushed${asOf}`);
}

const CLAUSES = Object.freeze([
  { n: 1, key: "reps", study: true, fn: cReps },
  { n: 2, key: "pointer", study: true, fn: cPointer },
  { n: 3, key: "notes", study: true, fn: cNotes },
  { n: 4, key: "examiner", study: true, fn: cExaminer },
  { n: 5, key: "rejirah", study: true, fn: cRejirah },
  { n: 6, key: "cards", study: false, fn: cCards },
  { n: 7, key: "readiness", study: false, fn: cReadiness },
  { n: 8, key: "fulltime", study: false, fn: cFulltime },
  { n: 9, key: "daemons", study: false, fn: cDaemons },
  { n: 10, key: "suite", study: false, fn: cSuite },
  { n: 11, key: "pushed", study: false, fn: cPushed },
]);

// ── THE LEDGER (this organ's ONE file) ───────────────────────────────────────
const identity = (row) => JSON.stringify({ date: row.date, study: row.study, clauses: row.clauses });
function latestByDate(rows) {
  const m = new Map();
  for (const r of rows) if (r && /^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) m.set(r.date, r);   // append order: the last row for a date wins
  return m;
}
/** The streak, from the ledger: walk back from `day`. A non-study row is skipped; a green
 *  study row counts; a red study row or a day with no row at all ends the walk. */
export function streakFrom(rows, day) {
  const by = latestByDate(rows);
  const dates = [...by.keys()].sort();
  if (!dates.length) return 0;
  const first = dates[0];
  let k = 0;
  for (let d = day; d >= first; d = addDays(d, -1)) {
    const r = by.get(d);
    if (!r) break;
    if (!r.study) continue;
    if (!r.green) break;
    k++;
  }
  return k;
}

/** THE WITNESS. `fixture` is the ONE root override, passed in-process by selftest() only:
 *  { root, intervals, gitExec }. Production callers pass nothing and read the live tree. */
async function witness({ date = null, now = new Date(), write = true } = {}, fixture = null) {
  const root = fixture ? fixture.root : ROOT;
  const st = join(root, "dressing-room", "state");
  const ledger = fixture ? join(st, "daily_green.jsonl") : LEDGER;
  const today = todayIst(now);
  const day = date || today;
  const sd = studyDay(st, day, now);
  const ctx = { st, root, day, now, today, fixture };
  const clauses = CLAUSES.map((c) => {
    let v;
    if (c.study && !sd.known) v = UNREADABLE(`sitting organ (${sd.why})`);
    else if (c.study && !sd.study) v = NA("not a study day");
    else {
      try { v = c.fn(ctx); } catch (e) { v = UNREADABLE(`${c.key} (${clip(e && e.message, 40)})`); }
    }
    return { n: c.n, key: c.key, status: v.status, why: v.why };
  });
  const reds = clauses.filter((c) => c.status === "RED").length;
  const greens = clauses.filter((c) => c.status === "GREEN").length;
  const row = { date: day, study: sd.known ? sd.study : null, study_why: sd.why, green: reds === 0 && sd.known === true, greens, reds, clauses };

  const prior = readJsonl(ledger);
  if (prior.born && prior.error) return { ok: false, why: `unreadable: daily_green.jsonl (${prior.error})`, row };
  const rows = prior.rows || [];
  const last = latestByDate(rows).get(day);
  let appended = false;
  if (write && (!last || identity(last) !== identity(row))) {
    mkdirSync(dirname(ledger), { recursive: true });
    appendFileSync(ledger, JSON.stringify({ at: now.toISOString(), ...row }) + "\n");
    rows.push(row);
    appended = true;
  }
  const streak = streakFrom(write ? rows : [...rows, row], day);
  const token = (c) => `${c.n}.${c.key} ${c.status === "GREEN" ? "G" : c.status === "RED" ? `R(${clip(c.why, 44)})` : "N-A"}`;
  const line = `DAILY GREEN ${day} IST · ${greens}/11 · streak ${streak} study day(s) · ${clauses.map(token).join(" · ")}`;
  return { ok: true, line, row, streak, appended };
}

// ── SELFTEST — fixture state dirs under the OS temp dir, never the live tree ─
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  const base = mkdtempSync(join(tmpdir(), "daily-green-"));
  const liveLedgerBefore = readFile(LEDGER);
  const DAY = "2026-09-24";
  const NOW = new Date("2026-09-24T16:00:00Z");        // 21:30 IST
  const at = (day, hhmm = "10:00") => new Date(Date.parse(`${day}T${hhmm}:00+05:30`)).toISOString();
  const gitOk = (ahead) => (cmd, args) => (args[0] === "status" ? " M x\n" : String(ahead));
  const gitNoUpstream = (cmd, args) => { if (args[0] === "status") return ""; throw new Error("no upstream"); };
  let seq = 0;
  // build ONE fixture root. `over` replaces or deletes (null) any file by its state-relative name.
  const mk = (over = {}) => {
    const root = join(base, `r${++seq}`);
    const st = join(root, "dressing-room", "state");
    mkdirSync(join(st, "capsules"), { recursive: true });
    mkdirSync(join(st, "post_match"), { recursive: true });
    const jl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
    const files = {
      "sitting.json": JSON.stringify({ id: "s1", task: "t", route: "FORGE", opened_at: at(DAY, "09:00"), closed_at: at(DAY, "11:00") }),
      "sitting_reviews.jsonl": "",
      "reps_log.jsonl": jl([{ ts: at(DAY), concept: "tokenization", correct: true }]),
      "forge_session.json": JSON.stringify({ concept: "tokenization", resume_pointer: { text: "q", step: 3, at: at(DAY) } }),
      "registry.json": JSON.stringify({ version: 1, tables: { emit_contract: [{ subject: "note_blocks", writes_to: "note_blocks.jsonl" }] } }),
      "note_blocks.jsonl": jl([{ ts: at(DAY), axis: "a" }]),
      "gaffer_grade_queue.jsonl": jl([{ v: 2, kind: "settled", of: "x", ts: at(DAY), day: DAY }]),
      "rejirah_log.jsonl": jl([{ ts: at(DAY), concept: "tokenization", axis: "a", result: "held" }]),
      "capsules/tokenization.json": JSON.stringify({ id: "tokenization", num: "01", lockedOn: "2026-09-10", reJirahDone: [] }),
      "captains_call.json": JSON.stringify({ cards: [{ id: "c1", dealt: [at(DAY, "09:00")] }, { id: "c2", dealt: [at(DAY, "20:00")] }] }),
      "readiness.json": JSON.stringify({ ok: true, day: DAY, verdict: "GREEN" }),
      [`post_match/${DAY}.md`]: `POST-MATCH · ${DAY}\n\nRESULT: HIT.\n\nKAL-LINE → start with axis b\n`,
      "daemon_watchdog.json": JSON.stringify({ at: NOW.toISOString(), ports: Object.fromEntries(DAEMONS.map((d) => [d.name, true])), unknown: [] }),
      "watchman_last.json": JSON.stringify({ at: NOW.toISOString(), findings: [] }),
    };
    for (const [k, v] of Object.entries({ ...files, ...over })) {
      if (v === null) continue;
      mkdirSync(dirname(join(st, k)), { recursive: true });
      writeFileSync(join(st, k), v);
    }
    return { root, st };
  };
  const fx = (root, extra = {}) => ({ root, intervals: [3, 14, 42], gitExec: gitOk(0), ...extra });
  const run = async (over, { date = DAY, now = NOW, write = true, extra = {} } = {}, r = null) => {
    const f = r || mk(over);
    const out = await witness({ date, now, write }, fx(f.root, extra));
    return { ...out, f, by: Object.fromEntries((out.row ? out.row.clauses : []).map((c) => [c.key, c])) };
  };

  // ── ALL GREEN — every clause planted GREEN at once ──
  const g = await run({});
  assert("ALL GREEN — a fully-fed study day is 11/11, study:true, green:true", g.ok && g.row.greens === 11 && g.row.study === true && g.row.green === true, g.line);
  assert("the line is ONE line, and it opens with the contract: DAILY GREEN <date> IST · n/11 · streak k", !g.line.includes("\n") && /^DAILY GREEN 2026-09-24 IST · 11\/11 · streak 1 study day\(s\) · 1\.reps G/.test(g.line), g.line);
  for (const c of CLAUSES) assert(`clause ${c.n} (${c.key}) planted GREEN`, g.by[c.key] && g.by[c.key].status === "GREEN", JSON.stringify(g.by[c.key]));

  // ── EACH CLAUSE RED (at least once), and NOT BORN wherever an input can be absent ──
  const redCases = [
    ["reps", { "reps_log.jsonl": JSON.stringify({ ts: at("2026-09-23"), concept: "x" }) + "\n" }, /0 reps/],
    ["reps", { "reps_log.jsonl": null }, /^not born/],
    ["pointer", { "forge_session.json": JSON.stringify({ resume_pointer: { text: "q", at: at("2026-09-20") } }) }, /did not move \(last 2026-09-20\)/],
    ["pointer", { "forge_session.json": null }, /^not born/],
    ["pointer", { "forge_session.json": JSON.stringify({ concept: "x" }) }, /^not born: no resume_pointer/],
    ["notes", { "registry.json": JSON.stringify({ version: 1, tables: { emit_contract: [] } }) }, /^not born: no note-extraction organ/],
    ["notes", { "note_blocks.jsonl": JSON.stringify({ ts: at("2026-09-22") }) + "\n" }, /no block extracted/],
    ["examiner", { "gaffer_grade_queue.jsonl": JSON.stringify({ kind: "capture", ts: at(DAY) }) + "\n" }, /did not run/],
    ["examiner", { "gaffer_grade_queue.jsonl": null }, /^not born/],
    ["rejirah", { "rejirah_log.jsonl": null }, /^not born: rejirah_log/],
    ["rejirah", { "rejirah_log.jsonl": JSON.stringify({ ts: at("2026-09-20"), concept: "tokenization", axis: "a" }) + "\n" }, /^due tokenization R1 · no row/],
    ["cards", { "captains_call.json": JSON.stringify({ cards: [{ id: "c1", dealt: [at(DAY, "09:00"), at(DAY, "20:00")] }] }) }, /re-dealt same day: c1 2×/],
    ["cards", { "captains_call.json": null }, /^not born/],
    ["readiness", { "readiness.json": JSON.stringify({ ok: true, day: "2026-09-22", verdict: "RED", medication: "x" }) }, /no reading for 2026-09-24 \(newest 2026-09-22\)/],
    ["readiness", { "readiness.json": "{not json" }, /^unreadable: readiness\.json/],
    ["fulltime", { [`post_match/${DAY}.md`]: null }, /not closed/],
    ["fulltime", { [`post_match/${DAY}.md`]: "RESULT: MISS — data.\n" }, /MISS · no KAL-line/],
    ["daemons", { "daemon_watchdog.json": JSON.stringify({ at: NOW.toISOString(), ports: { ...Object.fromEntries(DAEMONS.map((d) => [d.name, true])), cortex: false } }) }, /down: cortex/],
    ["daemons", { "daemon_watchdog.json": null }, /^not born/],
    ["daemons", { "daemon_watchdog.json": JSON.stringify({ at: at("2026-09-20"), ports: Object.fromEntries(DAEMONS.map((d) => [d.name, true])) }) }, /stale pass/],
    ["suite", { "watchman_last.json": JSON.stringify({ at: NOW.toISOString(), findings: [{ id: "suite-unrunnable", level: "RED" }] }) }, /unrunnable/],
    ["suite", { "watchman_last.json": null }, /^not born/],
    ["suite", { "watchman_last.json": JSON.stringify({ at: at("2026-09-20"), findings: [] }) }, /stale sweep/],
  ];
  for (const [key, over, re] of redCases) {
    const r = await run(over);
    assert(`clause ${key} RED — ${re}`, r.by[key] && r.by[key].status === "RED" && re.test(r.by[key].why) && r.row.green === false, JSON.stringify(r.by[key]));
  }
  const unp = await run({}, { extra: { gitExec: gitOk(2) } });
  assert("clause pushed RED — 2 committed-but-unpushed", unp.by.pushed.status === "RED" && /2 unpushed/.test(unp.by.pushed.why), JSON.stringify(unp.by.pushed));
  const noUp = await run({}, { extra: { gitExec: gitNoUpstream } });
  assert("clause pushed RED — no upstream is UNREADABLE, never zero", noUp.by.pushed.status === "RED" && /^unreadable: git upstream/.test(noUp.by.pushed.why), JSON.stringify(noUp.by.pushed));
  const dirtyOnly = await run({}, { extra: { gitExec: gitOk(0) } });
  assert("clause pushed GREEN with a dirty tree — dirt is not committed, and its count stays out of the row (idempotency)", dirtyOnly.by.pushed.status === "GREEN" && !/dirty/.test(dirtyOnly.by.pushed.why));

  // the one input gate: the sitting daemon down with no sitting open is explained; open, it is not
  const sitDown = { "daemon_watchdog.json": JSON.stringify({ at: NOW.toISOString(), ports: { ...Object.fromEntries(DAEMONS.map((d) => [d.name, true])), sitting: false } }) };
  const gated = await run(sitDown);
  assert("daemons GREEN — sitting brain down with NO sitting open is explained by its input gate", gated.by.daemons.status === "GREEN" && /gated: sitting/.test(gated.by.daemons.why), JSON.stringify(gated.by.daemons));
  const openSit = await run({ ...sitDown, "sitting.json": JSON.stringify({ id: "s2", opened_at: at(DAY, "20:00"), closed_at: null }) });
  assert("daemons RED — the same down sitting brain WHILE a sitting is open is not explained", openSit.by.daemons.status === "RED" && /down: sitting/.test(openSit.by.daemons.why), JSON.stringify(openSit.by.daemons));
  assert("…and an open sitting is itself a study day", openSit.row.study === true);
  const rosterShort = await run({ "daemon_watchdog.json": JSON.stringify({ at: NOW.toISOString(), ports: { thalamus: true } }) });
  assert("daemons RED — a daemon the pass never named is counted DOWN against the roster, not skipped", rosterShort.by.daemons.status === "RED" && /turnstile/.test(rosterShort.by.daemons.why));

  // rejirah: a pre-cyborg lock opens no round (GAME ON), so a born log with nothing due is GREEN
  const pre = await run({ "capsules/tokenization.json": JSON.stringify({ id: "tokenization", num: "01", lockedOn: "2026-06-10", reJirahDone: [] }), "rejirah_log.jsonl": JSON.stringify({ ts: at("2026-09-01"), concept: "tokenization", axis: "a" }) + "\n" });
  assert("rejirah GREEN — born, and a pre-cyborg lock is never 'due' (rejirah.mjs openRound owns GAME ON)", pre.by.rejirah.status === "GREEN" && /none due/.test(pre.by.rejirah.why), JSON.stringify(pre.by.rejirah));

  // the Goalkeeper's boundary: no payload content crosses into the line or the row
  const med = await run({ "readiness.json": JSON.stringify({ ok: true, day: DAY, verdict: "RED", medication: "dose-word", safety: "diagnosis-word" }) });
  const medText = med.line + JSON.stringify(med.row);
  assert("READINESS — the verdict's content, and any medication/diagnosis field, never reaches the line or the ledger", !/dose-word|diagnosis-word|medicat|verdict":"RED/i.test(medText) && med.by.readiness.status === "GREEN", med.line);

  // ── NON-STUDY DAY: clauses 1-5 are N-A, and ONLY those ──
  const nonStudy = await run({ "sitting.json": JSON.stringify({ id: "s0", opened_at: at("2026-09-20"), closed_at: at("2026-09-20", "11:00") }) });
  assert("NON-STUDY DAY — clauses 1-5 are N-A 'not a study day'", [1, 2, 3, 4, 5].every((n) => nonStudy.row.clauses[n - 1].status === "N-A"), JSON.stringify(nonStudy.row.clauses.slice(0, 5)));
  assert("NON-STUDY DAY — clauses 6-11 still judge (N-A is legal nowhere else)", nonStudy.row.clauses.slice(5).every((c) => c.status !== "N-A") && nonStudy.row.study === false);
  const reviewDay = await run({ "sitting.json": JSON.stringify({ id: "s0", opened_at: at("2026-09-20"), closed_at: at("2026-09-20", "11:00") }), "sitting_reviews.jsonl": JSON.stringify({ kind: "sitting_review", sitting_id: "s9", closed_at: at(DAY, "12:00") }) + "\n" });
  assert("STUDY DAY — a sitting CLOSED on the day (the sitting organ's close row) makes it a study day", reviewDay.row.study === true && /closed sitting s9/.test(reviewDay.row.study_why));
  const noSit = await run({ "sitting.json": null });
  assert("UNKNOWN STUDY DAY — sitting.json not born fails clauses 1-5 CLOSED (RED), never N-A", noSit.row.clauses.slice(0, 5).every((c) => c.status === "RED" && /^unreadable: sitting organ/.test(c.why)) && noSit.row.green === false);
  const badSit = await run({ "sitting.json": "{oops" });
  assert("UNREADABLE sitting.json — RED 'unreadable', never a throw", badSit.ok && badSit.row.clauses[0].status === "RED");

  // ── A CLAUSE THAT THROWS is caught, RED, and the line still prints ──
  const thrower = await run({ "capsules/tokenization.json": JSON.stringify({ id: "tokenization", num: "01", lockedOn: "2026-09-10" }) }, { extra: { intervals: null } });
  assert("FAIL CLOSED — a clause whose reader throws prints RED unreadable, the witness never throws", thrower.ok && thrower.by.rejirah.status === "RED" && /^unreadable/.test(thrower.by.rejirah.why), JSON.stringify(thrower.by.rejirah));

  // ── LEDGER: idempotent, one row per date, latest row wins ──
  const L = mk({});
  const ledgerOf = () => readJsonl(join(L.st, "daily_green.jsonl")).rows || [];
  await run(null, {}, L); await run(null, {}, L);
  assert("IDEMPOTENT — re-running the same date with identical facts appends nothing", ledgerOf().length === 1, `${ledgerOf().length} rows`);
  writeFileSync(join(L.st, "reps_log.jsonl"), "");
  const changed = await run(null, {}, L);
  assert("CHANGED FACTS — a different row for the same date is APPENDED (never rewritten), and it is the one that counts", ledgerOf().length === 2 && changed.appended && changed.streak === 0);
  const dry = await run(null, { write: false }, L);
  assert("write:false (the selftest's own lever) appends nothing", ledgerOf().length === 2 && !dry.appended);

  // ── STREAK: three green study days in a row, a non-study day skipped between; then broken ──
  const S = mk({});
  const days = [0, 1, 2, 3].map((i) => addDays("2026-09-21", i));   // built, not a literal name list (the jugad law pack reads the shape)
  const feed = (day, { study = true, green = true } = {}) => {
    const st = S.st;
    writeFileSync(join(st, "sitting.json"), JSON.stringify(study ? { id: `s-${day}`, opened_at: at(day, "09:00"), closed_at: at(day, "11:00") } : { id: "old", opened_at: at("2026-09-01"), closed_at: at("2026-09-01", "11:00") }));
    writeFileSync(join(st, "reps_log.jsonl"), green ? JSON.stringify({ ts: at(day), concept: "x" }) + "\n" : "");
    writeFileSync(join(st, "forge_session.json"), JSON.stringify({ resume_pointer: { text: "q", at: at(day) } }));
    writeFileSync(join(st, "note_blocks.jsonl"), JSON.stringify({ ts: at(day) }) + "\n");
    writeFileSync(join(st, "gaffer_grade_queue.jsonl"), JSON.stringify({ kind: "settled", day }) + "\n");
    writeFileSync(join(st, "rejirah_log.jsonl"), JSON.stringify({ ts: at(day), concept: "tokenization", axis: "a" }) + "\n");
    writeFileSync(join(st, "readiness.json"), JSON.stringify({ ok: true, day }));
    writeFileSync(join(st, "post_match", `${day}.md`), "RESULT: HIT.\nKAL-LINE → go\n");
    writeFileSync(join(st, "captains_call.json"), JSON.stringify({ cards: [] }));
  };
  const nowFor = (day) => new Date(Date.parse(`${day}T21:00:00+05:30`));
  const sRun = async (day, o) => { feed(day, o); const n = nowFor(day); writeFileSync(join(S.st, "daemon_watchdog.json"), JSON.stringify({ at: n.toISOString(), ports: Object.fromEntries(DAEMONS.map((d) => [d.name, true])) })); writeFileSync(join(S.st, "watchman_last.json"), JSON.stringify({ at: n.toISOString(), findings: [] })); return run(null, { date: day, now: n }, S); };
  const d1 = await sRun(days[0]);
  const d2 = await sRun(days[1], { study: false });
  const d3 = await sRun(days[2]);
  const d4 = await sRun(days[3]);
  assert("STREAK — green study day 1 → streak 1", d1.streak === 1 && d1.row.green, d1.line);
  assert("STREAK — a NON-study day in between is skipped (counts study days, not calendar days)", d2.row.study === false && d2.streak === 1, d2.line);
  assert("STREAK — three green study days in a row → streak 3 (the done-line)", d3.streak === 2 && d4.streak === 3 && /streak 3 study day\(s\)/.test(d4.line), `${d3.streak} ${d4.line}`);
  const d5 = await sRun("2026-09-25", { green: false });
  assert("BROKEN STREAK — a RED study day resets the streak to 0", d5.streak === 0 && d5.row.green === false, d5.line);
  const d7 = await sRun("2026-09-27");
  assert("BROKEN STREAK — a day with NO ledger row (unwitnessed) ends the walk: streak 1, not carried across the gap", d7.streak === 1, d7.line);
  assert("streakFrom is pure over rows — [green, (no row), green] = 1; [green, non-study, green] = 2",
    streakFrom([{ date: "2026-09-01", study: true, green: true }, { date: "2026-09-03", study: true, green: true }], "2026-09-03") === 1
    && streakFrom([{ date: "2026-09-01", study: true, green: true }, { date: "2026-09-02", study: false, green: false }, { date: "2026-09-03", study: true, green: true }], "2026-09-03") === 2);

  // ── HERMETIC + ONE WRITE ──
  const liveLedgerAfter = readFile(LEDGER);
  assert("HERMETIC — the live ledger is byte-identical after the whole selftest", JSON.stringify(liveLedgerBefore) === JSON.stringify(liveLedgerAfter));
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const body = src.slice(0, src.indexOf("// ── SELFTEST"));
  assert("ONE WRITE — outside the selftest the only write call is the ledger append", (body.match(/\b(writeFileSync|appendFileSync|renameSync|rmSync|unlinkSync)\(/g) || []).length === 1 && /appendFileSync\(ledger,/.test(body));
  assert("NO MODEL, NO NETWORK, NO ENV OVERRIDE — no claude/gemini call, no fetch, no process.env read in the witness", !/claude -p|claudegen|fetch\(|process\.env/.test(body.replace(/^\s*\/\/.*$/gm, "")));
  assert("the root override is not exported — only this file's selftest can pass it", !/export\s+(async\s+)?function\s+witness/.test(src));

  rmSync(base, { recursive: true, force: true });
  console.log(`\ndaily_green selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "line";
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const di = args.indexOf("--date");
  const date = di >= 0 ? args[di + 1] : null;
  if (di >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) { console.log("daily_green: --date needs YYYY-MM-DD (IST)"); process.exit(1); }
  const out = await witness({ date });
  if (!out.ok) { console.log(`DAILY GREEN · ${out.why}`); process.exit(1); }
  if (args.includes("--json")) console.log(JSON.stringify({ line: out.line, streak: out.streak, appended: out.appended, ...out.row }, null, 2));
  else console.log(out.line);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
