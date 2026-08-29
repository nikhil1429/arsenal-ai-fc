#!/usr/bin/env node
// ============================================================================
// daykey.mjs · ARSENAL AI FC — THE DAY-KEY LAW (OVERHAUL Block 6, 18 Aug 2026)
//   Writes NOTHING. Owns no state file. Pure functions + one read of the
//   schedule snapshot (dressing-room/state/tasks_expected.json, the watchman's
//   contract — READ-ONLY here).
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR IS LIVE, NOT HYPOTHETICAL (herd.mjs names the class):
//   every ArsenalFC-* task is StartWhenAvailable, so a slot the laptop slept
//   through fires ONCE, at wake, at the wrong hour. Every organ then computes
//   its "today" from now() and files last night's work under this morning's key.
//   Measured off scripts/conductor.log, not imagined:
//     12 Aug 2026 02:36  — the EVENING chain (slot 22:00) ran 4.5 h late, after
//                          midnight: 11 steps keyed 2026-08-12 for 11 Aug's evening.
//     15 Aug 2026 02:04  — the MORNING chain (slot 09:15) ran 17 h late: keyed
//                          15 Aug for the 14 Aug slot; the real 15 Aug run at 09:45
//                          then found "today" already used.
//     17 Aug 2026 23:56  — Evening-Conductor · TimeAuditor-Full · ArchiveVitals all
//                          fired at 23:56:08 (a wake burst); same day, so lucky.
//
// THE LAW (§10 of ORGANISM_OVERHAUL__2026-08-18.md): a scheduled organ takes its
// day from the SCHEDULED SLOT it is running for, never from now(), when it runs
// inside a catch-up. On time, slot day == calendar day, so on-time behaviour is
// byte-identical to before. Timestamps (`ts`) stay real wall-clock; only the DAY
// KEY (which file, which bucket, which "today") follows the slot.
//
// THREE SOURCES, in precedence — every one of them named in launchContext():
//   1. TOKEN   — a chain parent (conductor.mjs / groundsman.mjs) computed its
//                slot day and handed it to every one-shot child in the env:
//                ARSENAL_DAY_KEY = "<YYYY-MM-DD>|<issued ISO>". A token older
//                than TOKEN_TTL_MS is REFUSED (a daemon that inherited one must
//                never key its whole life to a stale day; launchDetached strips
//                it anyway — this is the second belt).
//   2. SLOT    — the process was launched by Task Scheduler (setup/hidden_task.vbs
//                sets ARSENAL_SCHEDULED=1 — the cloak EVERY scheduled row runs
//                through; hidden_run.vbs, the daemon cloak, does not) AND
//                (organ, verb) of process.argv matches an ENABLED, ONCE-A-SLOT,
//                NON-DAEMON task in tasks_expected.json `slots` → slotDate(at, now).
//                An interval task (every N min) is NOT re-pointed: its catch-up is
//                one interval late and its work is "now"-shaped by design. A WEEKLY
//                row carries `dow` and keys the most recent matching weekday (the
//                Sunday 20:00 Boot Room woken on Monday keys Sunday).
//   3. CLOCK   — localDate(now). Hand runs, tests, chains without a slot,
//                daemons, CI: exactly what every organ did before this file.
//
// WHY A SNAPSHOT AND NOT A LIVE schtasks READ: the live read is a PowerShell
// spawn (2–5 s) and Presence runs every minute. tasks_expected.json is ALREADY
// the schedule's contract (the watchman diffs it against live nightly and REDs
// drift); Block 6 adds the slot times to that same contract, and the watchman
// now WARNs `task-slot-drift` when a live trigger moves — a stale slot is caught,
// never silent. `node scripts/herd.mjs slots` prints the live map to paste in.
//
// LAWS: pure · read-only · never guesses a slot (no match ⇒ clock, and says so)
//   · every number below is derived and its derivation is written next to it.
// CLI: node scripts/daykey.mjs [context|selftest]
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SNAPSHOT = join(ROOT, "dressing-room", "state", "tasks_expected.json");   // READ-ONLY (the watchman's contract)

export const ENV_TOKEN = "ARSENAL_DAY_KEY";
export const ENV_SCHEDULED = "ARSENAL_SCHEDULED";

// TOKEN_TTL_MS — DERIVED, not guessed: the longest chain a token can legally
// live inside is the MORNING chain at every step's ceiling: heartbeat 420 s +
// mirror 300 s + 14 one-shots × 180 s = 3,240 s ≈ 54 min (conductor.mjs
// STEP_BUDGET / STEP_TIMEOUT_MS). Six hours is that ceiling ×~6.7 — wide enough
// that no honest chain ever loses its key, narrow enough that a daemon which
// somehow inherited one is back on the clock the same day.
export const TOKEN_TTL_MS = 6 * 3600 * 1000;

// SLOT_TOLERANCE_MIN — DERIVED: Task Scheduler never fires EARLY; the only
// "before the slot" reads are clock skew. Measured launch latency is +1 to +13 s
// (BrainTick slot 03:44:00 → first ledger row 03:45:13). Five minutes covers any
// skew this laptop has ever shown and cannot swallow a real previous-day slot
// (the closest two daily slots are 10 min apart: Consolidate 02:10 / HippoStore 02:20).
export const SLOT_TOLERANCE_MIN = 5;

export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isDayKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

// noon-anchored so a ±86400000 can never land on a DST seam (brain.mjs prevShiftDate's rule)
export function addDays(key, n) {
  if (!isDayKey(key)) throw new Error(`addDays: not a day key: ${key}`);
  return localDate(new Date(new Date(`${key}T12:00:00`).getTime() + n * 86400000));
}

// ── S11 · THE RECENCY GATE (29 Aug 2026) ────────────────────────────────────
// §9 SHAPE 4, stated by the lawpack's own rule: "the last N rows are not the RECENT
// rows — they are the last N rows, and if the lane stopped writing a month ago they
// are a month old while every reader treats them as now." Three READ sites were doing
// exactly that (the wall's kal-lines · the season form strip · the weak-foot streak),
// so after a quiet fortnight each showed three-week-old data as current.
// THE GATE LIVES HERE, ONCE, because daykey is already the organism's single owner of
// what a calendar day is — three private copies of this arithmetic would be the
// twin-copy disease the lawpack exists to catch.
// A row whose date will not parse is NOT recent: an unreadable stamp must never buy
// its way into a window of NOW by defaulting to true.
export function withinDays(key, anchor, n) {
  if (!isDayKey(key) || !isDayKey(anchor) || !Number.isFinite(n) || n < 0) return false;
  const ms = new Date(`${anchor}T12:00:00`).getTime() - new Date(`${key}T12:00:00`).getTime();
  return ms >= 0 ? ms <= n * 86400000 : true;   // a FUTURE-dated row is not stale; it is tomorrow's, and its own writer owns that
}
/**
 * recentRows — the shape every caller actually wants: filter to the window FIRST,
 * then take the last N. Returns {rows, dropped, span} so a caller can SAY what it cut.
 * @param {any[]} rows
 * @param {{anchor?: string, days?: number, cap?: number|null, dateOf?: (r: any) => any}} [opts]
 */
export function recentRows(rows, { anchor, days, cap = null, dateOf = (r) => r && r.date } = {}) {
  const all = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const inWindow = all.filter((r) => withinDays(dateOf(r), anchor, days));
  const kept = cap == null ? inWindow : inWindow.slice(-cap);
  const dates = kept.map(dateOf).filter(isDayKey).sort();
  return { rows: kept, dropped: all.length - kept.length, span: dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null };
}

const parseHHMM = (s) => {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(s || "").trim());
  return m ? { h: +m[1], m: +m[2], s: +(m[3] || 0) } : null;
};

// THE LOCAL CALENDAR DAY OF THE MOST RECENT OCCURRENCE OF `slot` AT OR BEFORE
// `now` (+ tolerance). One or many slots (TimeAuditor-Pulse has three triggers).
//   slotDate("22:00", 2026-08-12 02:36) → 2026-08-11   (the 12 Aug incident)
//   slotDate("09:15", 2026-08-15 02:04) → 2026-08-14   (the 15 Aug incident)
//   slotDate("22:00", 2026-08-17 22:00:02) → 2026-08-17 (on time — unchanged)
export function slotDate(slot, now = new Date(), opts = {}) {
  const tol = Number.isFinite(opts.toleranceMin) ? opts.toleranceMin : SLOT_TOLERANCE_MIN;
  const slots = (Array.isArray(slot) ? slot : [slot]).map(parseHHMM).filter(Boolean);
  if (!slots.length) return localDate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  // any slot already reached today (with tolerance) ⇒ today; else the latest slot is yesterday's
  const reachedToday = slots.some((s) => nowMin + tol >= s.h * 60 + s.m + s.s / 60);
  let day = reachedToday ? localDate(now) : addDays(localDate(now), -1);
  // a WEEKLY slot (opts.dow = ["sun"] …): walk back to the most recent matching weekday
  // (a Sunday 20:00 Boot Room woken on Monday keys Sunday; a >7 d sleep still lands on a Sunday)
  const dow = Array.isArray(opts.dow) && opts.dow.length ? opts.dow.map((d) => String(d).slice(0, 3).toLowerCase()) : null;
  if (dow) {
    const names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    for (let i = 0; i < 7; i++) {
      const cand = addDays(day, -i);
      if (dow.includes(names[new Date(`${cand}T12:00:00`).getDay()])) return cand;
    }
  }
  return day;
}

// ── the token a chain hands its children ─────────────────────────────────────
export function issueDayKeyToken(day, now = new Date()) {
  if (!isDayKey(day)) throw new Error(`issueDayKeyToken: not a day key: ${day}`);
  return `${day}|${now.toISOString()}`;
}
export function parseDayKeyToken(tok, now = new Date()) {
  const s = String(tok || "");
  if (!s) return { day: null, valid: false, why: "no token" };
  const [day, issued] = s.split("|");
  if (!isDayKey(day)) return { day: null, valid: false, why: `malformed token '${s.slice(0, 40)}'` };
  const t = Date.parse(issued || "");
  if (!Number.isFinite(t)) return { day, issued: null, valid: false, why: "token has no issue time" };
  const age = now.getTime() - t;
  if (age > TOKEN_TTL_MS) return { day, issued, valid: false, why: `token expired (${Math.round(age / 60000)} min old > ${TOKEN_TTL_MS / 60000})` };
  if (age < -TOKEN_TTL_MS) return { day, issued, valid: false, why: "token from the future" };
  return { day, issued, valid: true, why: "chain token" };
}
// what a DAEMON launch must receive: neither the day nor the scheduled marker
export function stripDayKeyEnv(env = process.env) {
  const out = { ...env };
  delete out[ENV_TOKEN];
  delete out[ENV_SCHEDULED];
  return out;
}

// ── the schedule snapshot (READ-ONLY) ────────────────────────────────────────
let _snap;   // one read per process; slots do not move mid-run
export function readSlots(path = SNAPSHOT) {
  if (_snap !== undefined && path === SNAPSHOT) return _snap;
  let slots = null;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      slots = j && j.slots && typeof j.slots === "object" ? j.slots : null;
    }
  } catch { slots = null; }
  if (path === SNAPSHOT) _snap = slots;
  return slots;
}
export function _resetSlotCache() { _snap = undefined; }

// (organ, verb) of a process — the shape every hidden_task.vbs row has:
//   node scripts\watchman.mjs run   → { organ: "watchman.mjs", verb: "run" }
//   node scripts\viz.mjs            → { organ: "viz.mjs", verb: null }
export function organVerbOf(argv = process.argv) {
  const script = argv[1] ? basename(String(argv[1])).toLowerCase() : null;
  if (!script || !script.endsWith(".mjs")) return { organ: null, verb: null };
  const v = argv[2] && /^[a-z][a-z0-9_-]*$/i.test(String(argv[2])) ? String(argv[2]).toLowerCase() : null;
  return { organ: script, verb: v };
}
// the ONE snapshot row for this (organ, verb) — or null and the reason
export function slotOfArgv(argv = process.argv, slots = readSlots()) {
  const { organ, verb } = organVerbOf(argv);
  if (!organ) return { row: null, why: "not a node organ" };
  if (!slots) return { row: null, why: "no slots snapshot (tasks_expected.json has no `slots`)" };
  const hits = Object.entries(slots).filter(([, r]) => r && String(r.organ || "").toLowerCase() === organ && (r.verb || null) === verb);
  if (!hits.length) return { row: null, why: `no task for ${organ}${verb ? " " + verb : ""}` };
  const enabled = hits.filter(([, r]) => r.enabled !== false);
  if (!enabled.length) return { row: null, why: `${hits.map(([n]) => n).join(",")} disabled` };
  const [name, row] = enabled[0];
  return { row: { name, ...row }, why: enabled.length > 1 ? `${enabled.length} enabled rows; took ${name}` : name };
}

// ── THE RESOLVER ─────────────────────────────────────────────────────────────
// launchContext() says WHERE this process's day comes from; dayKey() is the day.
export function launchContext(deps = {}) {
  const env = deps.env || process.env;
  const now = deps.now || new Date();
  const argv = deps.argv || process.argv;
  // THE HISTORICAL BELT: an organ that passes a `now` far from the real clock is
  // replaying/backfilling a past day (organs thread `deps.now` everywhere). A
  // token or a slot may re-key THE PRESENT only — never a date somebody chose.
  const real = deps.realNow || new Date();
  if (Math.abs(real.getTime() - now.getTime()) > TOKEN_TTL_MS) {
    return { source: "clock", day: localDate(now), scheduled: false, chain: false, why: "historical `now` (not the present) — clock" };
  }
  const tok = parseDayKeyToken(env[ENV_TOKEN], now);
  const scheduled = String(env[ENV_SCHEDULED] || "") === "1";
  if (tok.valid) return { source: "token", day: tok.day, scheduled, chain: true, why: tok.why, token: tok };
  if (scheduled) {
    const { row, why } = slotOfArgv(argv, deps.slots !== undefined ? deps.slots : readSlots());
    if (row && !row.daemon && !row.interval && row.at) {
      return { source: "slot", day: slotDate(row.at, now, { dow: row.dow || null }), scheduled, chain: false, task: row.name, at: row.at, why: `scheduled ${row.name} @ ${Array.isArray(row.at) ? row.at.join("/") : row.at}` };
    }
    const reason = row ? (row.daemon ? `${row.name} is a daemon` : row.interval ? `${row.name} is an interval task (${row.interval})` : `${row.name} has no slot`) : why;
    return { source: "clock", day: localDate(now), scheduled, chain: false, task: row ? row.name : null, why: `${reason} — clock` };
  }
  return { source: "clock", day: localDate(now), scheduled: false, chain: false, why: tok.why === "no token" ? "not scheduled, no token — clock" : `${tok.why} — clock` };
}
export function dayKey(now = new Date(), deps = {}) {
  return launchContext({ ...deps, now }).day;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0; const fails = [];
  const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };
  console.log("=== daykey.mjs selftest — THE DAY-KEY LAW ===\n");
  const L = (y, mo, d, h, mi, s = 0) => new Date(y, mo - 1, d, h, mi, s);

  // the two measured incidents (scripts/conductor.log)
  ok("12 Aug 02:36 evening chain (slot 22:00) keys 2026-08-11, not 12", slotDate("22:00", L(2026, 8, 12, 2, 36, 5)) === "2026-08-11");
  ok("15 Aug 02:04 morning chain (slot 09:15) keys 2026-08-14 — the 09:15 that was missed", slotDate("09:15", L(2026, 8, 15, 2, 4, 8)) === "2026-08-14");
  ok("17 Aug 23:56 wake burst: the 22:00 slot the same evening keys 2026-08-17 (unchanged)", slotDate("22:00", L(2026, 8, 17, 23, 56, 8)) === "2026-08-17");
  // on-time = byte-identical to localDate
  ok("on time (22:00:02) = localDate", slotDate("22:00", L(2026, 8, 17, 22, 0, 2)) === localDate(L(2026, 8, 17, 22, 0, 2)));
  ok("02:10 slot fired at 09:00 the same morning (laptop woke) = today, unchanged", slotDate("02:10", L(2026, 8, 19, 9, 0)) === "2026-08-19");
  ok("02:10 slot caught up at 01:00 the NEXT day (a >24 h sleep) = yesterday's slot", slotDate("02:10", L(2026, 8, 20, 1, 0)) === "2026-08-19");
  ok(`tolerance: ${SLOT_TOLERANCE_MIN} min before the slot still counts as today (clock skew, never a real early fire)`, slotDate("22:00", L(2026, 8, 17, 21, 57)) === "2026-08-17");
  ok("beyond tolerance before the slot = yesterday (a hand run at 15:00 of a 23:55 organ would key yesterday — which is why hand runs are CLOCK, never SLOT)", slotDate("23:55", L(2026, 8, 18, 15, 0)) === "2026-08-17");
  ok("three triggers (12:00/15:00/18:00): 09:00 next day → yesterday; 15:30 → today", slotDate(["12:00", "15:00", "18:00"], L(2026, 8, 19, 9, 0)) === "2026-08-18" && slotDate(["12:00", "15:00", "18:00"], L(2026, 8, 19, 15, 30)) === "2026-08-19");
  ok("an unparseable slot falls back to the clock, never throws", slotDate("nope", L(2026, 8, 19, 9, 0)) === "2026-08-19");
  ok("a WEEKLY slot: the Sunday 20:00 Boot Room woken Monday 09:00 keys SUNDAY (16 Aug), on-time Sunday 20:00:03 keys the same Sunday", slotDate("20:00", L(2026, 8, 17, 9, 0), { dow: ["sun"] }) === "2026-08-16" && slotDate("20:00", L(2026, 8, 16, 20, 0, 3), { dow: ["sun"] }) === "2026-08-16");
  ok("a WEEKLY slot missed for 9 days still lands on the most recent matching weekday", slotDate("09:20", L(2026, 8, 25, 10, 0), { dow: ["sat"] }) === "2026-08-22");
  ok("addDays is noon-anchored and reversible", addDays("2026-08-01", -1) === "2026-07-31" && addDays("2026-12-31", 1) === "2027-01-01" && addDays(addDays("2026-03-29", 1), -1) === "2026-03-29");

  // the token
  const T0 = L(2026, 8, 12, 2, 36);
  const tok = issueDayKeyToken("2026-08-11", T0);
  ok("token round-trips (day|issued)", parseDayKeyToken(tok, T0).valid && parseDayKeyToken(tok, T0).day === "2026-08-11");
  ok(`token is REFUSED after ${TOKEN_TTL_MS / 3600000} h (a daemon that inherited it is back on the clock)`, !parseDayKeyToken(tok, new Date(T0.getTime() + TOKEN_TTL_MS + 1)).valid);
  ok("token still honoured 54 min later (the longest legal chain)", parseDayKeyToken(tok, new Date(T0.getTime() + 54 * 60000)).valid);
  ok("a bare date without an issue time is refused (no silent forever-key)", !parseDayKeyToken("2026-08-11", T0).valid);
  ok("stripDayKeyEnv removes both the token and the scheduled marker", (() => { const e = stripDayKeyEnv({ A: "1", [ENV_TOKEN]: tok, [ENV_SCHEDULED]: "1" }); return e.A === "1" && !(ENV_TOKEN in e) && !(ENV_SCHEDULED in e); })());

  // the resolver — three sources, each named
  const slots = {
    "ArsenalFC-Watchman": { organ: "watchman.mjs", verb: "run", at: "23:55", interval: null, daemon: false, enabled: true },
    "ArsenalFC-Presence": { organ: "presence.mjs", verb: "sense", at: "23:17", interval: "PT1M", daemon: false, enabled: true },
    "ArsenalFC-BrainDaemon": { organ: "brain.mjs", verb: "daemon", at: "07:06", interval: null, daemon: true, enabled: true },
    "ArsenalFC-Examiner": { organ: "examiner.mjs", verb: "stage", at: "21:55", interval: null, daemon: false, enabled: false },
    "ArsenalFC-TimeAuditor-Pulse": { organ: "timeaudit.mjs", verb: "pulse", at: ["12:00", "15:00", "18:00"], interval: null, daemon: false, enabled: true },
  };
  const at = L(2026, 8, 19, 9, 0);   // a 09:00 wake burst
  const ctx = (env, argv) => launchContext({ env, argv, now: at, realNow: at, slots });
  let c = ctx({}, ["node", "scripts/watchman.mjs", "run"]);
  ok("hand run (no marker, no token) → CLOCK, today", c.source === "clock" && c.day === "2026-08-19");
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\watchman.mjs", "run"]);
  ok("scheduled Watchman (23:55) caught up at 09:00 → SLOT, yesterday", c.source === "slot" && c.day === "2026-08-18" && c.task === "ArsenalFC-Watchman");
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\presence.mjs", "sense"]);
  ok("scheduled Presence (every minute) → CLOCK by design, says 'interval'", c.source === "clock" && /interval/.test(c.why));
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\brain.mjs", "daemon"]);
  ok("a scheduled DAEMON row → CLOCK, says 'daemon'", c.source === "clock" && /daemon/.test(c.why));
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\examiner.mjs", "stage"]);
  ok("a DISABLED row (chain owns it) → CLOCK, says 'disabled'", c.source === "clock" && /disabled/.test(c.why));
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\scorer.mjs"]);
  ok("an organ with no task at all → CLOCK, says so", c.source === "clock" && /no task/.test(c.why));
  c = ctx({ [ENV_SCHEDULED]: "1" }, ["node", "scripts\\timeaudit.mjs", "pulse"]);
  ok("three-trigger Pulse at 09:00 → SLOT, yesterday's 18:00", c.source === "slot" && c.day === "2026-08-18");
  const chainTok = issueDayKeyToken("2026-08-18", new Date(at.getTime() - 60000));
  c = ctx({ [ENV_SCHEDULED]: "1", [ENV_TOKEN]: chainTok }, ["node", "scripts\\scorer.mjs"]);
  ok("a chain child (token + inherited marker) → TOKEN wins, the chain's day", c.source === "token" && c.day === "2026-08-18" && c.chain === true);
  c = ctx({ [ENV_TOKEN]: issueDayKeyToken("2026-08-11", new Date(at.getTime() - TOKEN_TTL_MS - 5000)) }, ["node", "scripts\\scorer.mjs"]);
  ok("an EXPIRED token → CLOCK and the reason names the expiry", c.source === "clock" && /expired/.test(c.why));
  ok("dayKey(now) with no env == localDate(now) — every organ's on-time behaviour is unchanged", dayKey(at, { env: {}, argv: ["node", "x.mjs"], slots }) === localDate(at));
  ok("THE HISTORICAL BELT: a token cannot re-key a `now` far from the real clock (a backfill stays on its own day)", launchContext({ env: { [ENV_TOKEN]: chainTok }, argv: ["node", "x.mjs"], now: new Date(at.getTime() - 3 * 86400000), realNow: at, slots }).source === "clock" && launchContext({ env: { [ENV_TOKEN]: chainTok }, argv: ["node", "x.mjs"], now: at, realNow: at, slots }).source === "token");
  ok("no snapshot at all → CLOCK, names the missing snapshot", (() => { const r = launchContext({ env: { [ENV_SCHEDULED]: "1" }, argv: ["node", "scripts\\watchman.mjs", "run"], now: at, realNow: at, slots: null }); return r.source === "clock" && /snapshot/.test(r.why); })());

  // the LIVE snapshot must carry slots once Block 6 lands (this file's own contract)
  const live = readSlots();
  ok("the live tasks_expected.json carries a `slots` map (Block 6 wrote it from the live schedule)", !!live && Object.keys(live).length > 0, live ? "" : "no slots — run `node scripts/herd.mjs slots` and paste into tasks_expected.json");
  if (live) {
    const bad = Object.entries(live).filter(([, r]) => !r.organ || (r.at && ![].concat(r.at).every(parseHHMM)));
    ok("every live slot row names its organ and parses its trigger time(s)", bad.length === 0, bad.map(([n]) => n).join(","));
    ok("the live snapshot marks the four daemon rows (Thalamus/Cortex/Turnstile/BrainDaemon) daemon:true", ["ArsenalFC-BrainDaemon", "ArsenalFC-Thalamus", "ArsenalFC-Cortex", "ArsenalFC-Turnstile"].every((n) => !live[n] || live[n].daemon === true));
  }

  // ── S11 · THE RECENCY GATE, bitten (an unrun gate is a hypothesis) ────────
  ok("S11 RECENCY · withinDays — inside the window is true, one day past it is false, and the boundary day itself counts",
    withinDays("2026-08-25", "2026-08-29", 7) && withinDays("2026-08-22", "2026-08-29", 7)
    && !withinDays("2026-08-21", "2026-08-29", 7));
  ok("S11 RECENCY · a date that will not parse is NOT recent — an unreadable stamp may never buy its way into a window of NOW",
    !withinDays("", "2026-08-29", 7) && !withinDays(undefined, "2026-08-29", 7)
    && !withinDays("last tuesday", "2026-08-29", 7) && !withinDays("2026-08-25", "not-a-day", 7));
  ok("S11 RECENCY · a FUTURE-dated row is not stale (it is tomorrow's, and its own writer owns that)",
    withinDays("2026-09-05", "2026-08-29", 7));
  ok("S11 RECENCY · recentRows windows FIRST and caps SECOND — the bug was the other way round: seven ROWS spanning a month read as seven DAYS",
    (() => {
      const rows = [{ date: "2026-07-01" }, { date: "2026-07-15" }, { date: "2026-08-26" }, { date: "2026-08-28" }, { date: "2026-08-29" }];
      const r = recentRows(rows, { anchor: "2026-08-29", days: 7, cap: 7 });
      const capped = recentRows(rows, { anchor: "2026-08-29", days: 7, cap: 2 });
      return r.rows.length === 3 && r.dropped === 2 && r.span.from === "2026-08-26" && r.span.to === "2026-08-29"
        && capped.rows.length === 2 && capped.rows[0].date === "2026-08-28";
    })());
  ok("S11 RECENCY · a lane that stopped writing a month ago returns EMPTY, so a caller must say the record is old instead of drawing stale rows as now",
    recentRows([{ date: "2026-07-01" }, { date: "2026-07-02" }], { anchor: "2026-08-29", days: 14, cap: 7 }).rows.length === 0);
  ok("S11 RECENCY · junk in, nothing claimed: a null list, a non-array and rowless input all answer with an empty window and a null span",
    recentRows(null, { anchor: "2026-08-29", days: 7 }).rows.length === 0
    && recentRows("nope", { anchor: "2026-08-29", days: 7 }).span === null
    && recentRows([{ nodate: 1 }], { anchor: "2026-08-29", days: 7 }).rows.length === 0);

  console.log(`\ndaykey: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

function main() {
  const mode = (process.argv[2] || "context").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "context") {
    const c = launchContext();
    console.log(`day-key: ${c.day} · source ${c.source} · ${c.why}${c.scheduled ? " · launched by Task Scheduler" : ""}`);
    return;
  }
  console.log("daykey: context | selftest");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
