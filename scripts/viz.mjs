#!/usr/bin/env node
// ============================================================================
// viz.mjs · ARSENAL AI FC — THE ORGANISM: THE CLUB WALL (visualization organ)
// ----------------------------------------------------------------------------
// WHAT:  Visualization as a first-class organ (ORGANISM_ANATOMY §6). One
//        self-contained dark HTML file — inline SVG only, zero network, opens
//        offline from disk — rendering the whole body as living pictures: the
//        Maidan pitch, the season arc, calibration, the derby table,
//        doubts_retired, the wall trend, the body strip, the brain meter,
//        and ≤3 validated brain insights. He is ADHD-PI and thinks in
//        pictures; the wall is the daily-consumption surface OPS_STATE always
//        intended.
// CONSTITUTIONAL (each selftested):
//   · NEVER FAKE DATA — empty states render as honest, handsome "awaiting
//     blood" panels; no NaN/null/undefined ever leaks into the HTML.
//   · NO STREAKS — weekly-consistency % only; the word "streak" never renders.
//   · NO RAW BIOMETRICS — the body strip shows verdict + tier only; no
//     hrv/rhr/temp numbers on a rendered surface.
//   · WALL TREND is weekly-only and hidden entirely on RED days; RED days
//     render the minimal wall (KAL-line + floor) — his own wall never shows
//     him a loss before he's chosen to look.
//   · Brain insights render only if EVERY number in them exists in wall_data
//     (the ONE validator, scripts/validators.mjs — never a local copy), and a
//     REJECTED read is SHOWN, never silently omitted: a hallucinating night and
//     a night the brain never ran must not produce the same blank shelf.
//   · NO STALE MEDIA. Every media flag rides on a DATE-STAMPED artifact
//     (posterFlag, geminiFlag). The wall may never present an old render as
//     current, and it may never render an undated link to an undated file.
//   · ABSENT ≠ ZERO. A file that has never been written is not a counter that
//     measured nothing. Every panel says which one it is looking at.
//   · EVERY GATE IS A COUNTER. No panel is withheld behind a producer's status
//     word; it speaks from rep 1 with its have/need shown.
//
// INPUT (read-only): the whole bus, plus brain_config.json's `overnight` block
//   and calibration_config.json's `min_reps` — two numbers this file needs and
//   must never invent, read from the organs that own them.
// OUTPUT: wall_data.json + dressing-room/club/wall.html (sole writer of both).
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync, openSync, readSync, closeSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// #59/#60 (4 Aug 2026 audit): viz kept its OWN copy of the zero-hallucination
// validator and it was the un-fixed copy — see allowedNumbersLegacy below. There
// is now exactly one, in validators.mjs, and this file imports it. Do not add a
// third.
import { allowedNumbers, noNewNumbers } from "./validators.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CLUB_DIR  = join(__dirname, "..", "dressing-room", "club");
const WALL_DATA = join(STATE_DIR, "wall_data.json");
const WALL_HTML = join(CLUB_DIR, "wall.html");

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
// E2E audit 25 Jul 2026: every ledger/reps row is stamped `now.toISOString()`
// — UTC, with the Z (brain.mjs, capture.mjs). Slicing that string and comparing
// it to a LOCAL date silently dates an IST 00:00–05:29 call to YESTERDAY, so
// the brain panel dropped exactly the overnight calls it exists to celebrate,
// and reps logged before 05:30 vanished from "reps today". Bucket by PARSED
// local day (brain.mjs's pulsesToday idiom); fall back to the raw slice only
// when the ts refuses to parse, so a malformed row behaves as it always did.
const tsLocalDay = (ts) => { const d = new Date(ts); return Number.isNaN(d.getTime()) ? String(ts || "").slice(0, 10) : localDate(d); };
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const parseLines = (text) => {
  const out = [];
  for (const l of String(text || "").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} }
  return out;
};
// FROZEN (CLAUDE.md layering law): the whole-file reader every caller used before
// the 4 Aug 2026 audit. Still the right tool for the small, bounded files
// (pitch_read_history.jsonl = 1,797 bytes / 16 rows on 4 Aug). The unbounded ones
// now go through readLinesSince().
const readLines = (p) => { try { if (existsSync(p)) return parseLines(readFileSync(p, "utf8")); } catch {} return []; };

// ---------------------------------------------------------------------------
// #51 (reader side) — BOUNDED, ROLL-TOLERANT JSONL READING
// ---------------------------------------------------------------------------
// Every .jsonl on the bus is unbounded. brain_ledger.jsonl measured 1,244,313
// bytes / 2,882 rows on 4 Aug 2026, and viz re-read ALL of it three times a day
// to answer a question about roughly ten hours of it. readLinesSince() reads the
// TAIL first and widens only if the tail did not reach far enough back.
//
// THIS IS NOT A GUESSED BUDGET (captain's standing order). TAIL_PROBE_BYTES is a
// first probe, never a cap: the coverage check below re-reads the whole file, and
// then any rolled/archived siblings, whenever the probe fell short — so a probe
// that is too small costs one extra read and can NEVER silently drop a row.
// Arithmetic for the probe size, from the live ledger:
//   1,244,313 bytes / 2,882 rows = 431.7 bytes/row   (measured, not assumed)
//   busiest single day in the file = 987 rows        (26 Jul, audit appendix #53)
//   987 x 432 = 426,384 bytes  ->  probe 512 KiB = 1.23 busiest-days of headroom.
const TAIL_PROBE_BYTES = 512 * 1024;

function readTailText(p, bytes) {
  const size = statSync(p).size;
  if (size <= bytes) return { text: readFileSync(p, "utf8"), whole: true, size, read: size };
  const fd = openSync(p, "r");
  try {
    const buf = Buffer.allocUnsafe(bytes);
    readSync(fd, buf, 0, bytes, size - bytes);
    const text = buf.toString("utf8");
    const nl = text.indexOf("\n");
    // the first line of a byte-offset read is almost certainly cut in half.
    // Drop it — never guess at half a row.
    return { text: nl < 0 ? "" : text.slice(nl + 1), whole: false, size, read: bytes };
  } finally { closeSync(fd); }
}

// A monthly roll (#51's producer-side fix, presence.mjs / brain.mjs) will leave
// the older rows in a sibling file. viz must survive that on the morning of the
// 1st, when "last night" lives in last month's file. Both conventions in the
// plan are accepted: <base>.<stamp>.jsonl beside the live file, and an archive/
// sub-directory one level down.
function rolledSiblings(p) {
  const dir = dirname(p), base = basename(p, ".jsonl"), live = basename(p);
  const out = [];
  const scan = (d) => { try { for (const f of readdirSync(d)) if (f !== live && f.startsWith(base) && f.endsWith(".jsonl")) out.push(join(d, f)); } catch {} };
  scan(dir); scan(join(dir, "archive"));
  return out.sort().reverse();                       // newest stamp first
}

/**
 * Rows at/after `sinceMs`, read tail-first, widening until the window is provably
 * covered. Returns the rows AND an honest coverage report — an uncovered read is
 * never rendered as a measured zero (audit law: honesty over green).
 */
function readLinesSince(p, sinceMs, tsOf = (r) => Date.parse(r && r.ts)) {
  const rep = { rows: [], covered: false, bytes_read: 0, bytes_total: 0, files: [], reason: "file absent" };
  if (!existsSync(p)) return rep;
  const oldestReaches = (rows) => rows.some(r => { const t = tsOf(r); return Number.isFinite(t) && t < sinceMs; });
  const keep = (rows) => rows.filter(r => { const t = tsOf(r); return Number.isFinite(t) && t >= sinceMs; });
  try {
    rep.bytes_total = statSync(p).size;
    let probe = readTailText(p, TAIL_PROBE_BYTES);
    let rows = parseLines(probe.text);
    rep.bytes_read = probe.read; rep.files.push(basename(p));
    // Covered when we can SEE a row older than the window start (proof we did not
    // stop short), or when we have the whole file in hand.
    if (!probe.whole && !oldestReaches(rows)) {
      probe = { text: readFileSync(p, "utf8"), whole: true, size: rep.bytes_total, read: rep.bytes_total };
      rows = parseLines(probe.text);
      rep.bytes_read = probe.read;
    }
    rep.rows = keep(rows);
    rep.covered = oldestReaches(rows);
    rep.reason = rep.covered ? "window covered by the live file" : "live file starts inside the window";
    if (!rep.covered) {
      for (const sib of rolledSiblings(p)) {
        const s = readTailText(sib, TAIL_PROBE_BYTES);
        const srows = parseLines(s.text);
        rep.bytes_read += s.read; rep.files.push(basename(sib));
        rep.rows = keep(srows).concat(rep.rows);
        if (oldestReaches(srows)) { rep.covered = true; rep.reason = "window covered with a rolled sibling"; break; }
      }
      if (!rep.covered) rep.reason = `no row older than the window exists (${rep.files.length} file(s) read) — the ledger may simply be younger than the window`;
    }
  } catch (e) { rep.reason = `read failed: ${e && e.code ? e.code : "unknown"}`; }
  rep.rows.sort((a, b) => (tsOf(a) || 0) - (tsOf(b) || 0));
  return rep;
}
function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof text === "string" ? text : JSON.stringify(text, null, 2) + "\n");
  renameSync(tmp, path);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const safe = (v, fallback = "—") => (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) ? fallback : v;

// ---------------------------------------------------------------------------
// data assembly (pure)
// ---------------------------------------------------------------------------
// THE OVERNIGHT WINDOW (#88, 4 Aug 2026 audit) ------------------------------
// The old bucket filtered the ledger to TODAY's local day and only then asked
// "was the hour >= 22 or < 8?" — so the h>=22 clause was structurally unreachable
// for last night. Hour 22 is the single busiest hour in the whole ledger (674
// rows) and 22:00-23:59 holds 987 of 2,833 rows; on 26 Jul the 08:50 wall showed
// 221 of 478 real overnight calls under the banner "got sharper while you slept".
// The window must CROSS MIDNIGHT: [yesterday start, today end).
//
// The two clock times are NOT invented here — they are read from
// brain_config.json's own `overnight` block ({"start":"22:00","end":"07:30"}),
// the same block brain.mjs schedules the night shift with. The literals below are
// only the fallback for an unreadable config, and they are copied from that file,
// not chosen. `overnight_window_source` says which one was used, on the surface.
const OVERNIGHT_FALLBACK = { start: "22:00", end: "07:30" };   // mirrors brain_config.json
const parseHM = (s, dh, dm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
  return m ? [Number(m[1]), Number(m[2])] : [dh, dm];
};
function overnightWindow(now, cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : OVERNIGHT_FALLBACK;
  const [sh, sm] = parseHM(c.start, 22, 0);
  const [eh, em] = parseHM(c.end, 7, 30);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0, 0);
  const start = new Date(end.getTime());
  start.setDate(start.getDate() - 1);
  start.setHours(sh, sm, 0, 0);
  return { start, end, label: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}→${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}` };
}

// WEEKLY CONSISTENCY (#85, 4 Aug 2026 audit) ---------------------------------
// The old line was `history.slice(-7)` filtered on `struggle !== "no_data"`, and
// it was wrong on BOTH halves:
//   · DENOMINATOR — the last 7 ROWS are not the last 7 DAYS. On 2 Aug those 7 rows
//     spanned NINE calendar days; 07-24, 07-27 and 07-28 had no row at all and
//     silently left the denominator, inflating the percentage.
//   · NUMERATOR — `struggle` is only ever a verdict at >= 6 reps/day
//     (touchline.mjs:186); below that pitch_read writes "no_data". So the 60-min
//     and 75-min days scored ZERO and the single day that counted, 07-31, was the
//     day the organism labelled him SPINNING. 14% for a week holding 225
//     wall-minutes across 5 worked days; a flat 0% on every film kit 17-31 Jul.
// The club's own law (ORGANISM_ANATOMY.md:199-200) defines a won day as
// "floor-attempt or conscious-rest" — SHOWED UP, not WON — and `wall_minutes > 0`
// is exactly that test (6/7 on 2 Aug). Spinning days still COUNT: misses are data
// (ORGANISM_ANATOMY.md:87, no streak-shaming). A day with no row is a day he did
// not show up: it stays in the denominator, it does not vanish from it.
// The 7 is not a tuned limit — it is the word "weekly" on the panel.
function weeklyConsistency(history, now) {
  const DAYS = 7;
  const wanted = [];
  for (let i = DAYS - 1; i >= 0; i--) wanted.push(localDate(new Date(now.getTime() - i * 86400000)));
  const rows = (history || []).filter(r => r && r.date);
  // HONESTY OVER GREEN: if not one row carries a date we have measured NOTHING.
  // Render "—", never a 0% he did not earn.
  if (!rows.length) return { pct: null, worked: 0, days: DAYS, minutes: 0, measured: false };
  const byDate = new Map();
  for (const r of rows) byDate.set(String(r.date), r);
  const inWindow = wanted.map(d => byDate.get(d) || null);
  const worked = inWindow.filter(r => r && (r.wall_minutes || 0) > 0).length;
  const minutes = inWindow.reduce((a, r) => a + (r && r.wall_minutes ? r.wall_minutes : 0), 0);
  return { pct: Math.round(100 * worked / DAYS), worked, days: DAYS, minutes, measured: true };
}

function assembleWallData(bus, now = new Date()) {
  const { learning_state, season, calibration, tape_room, history, readiness, brainLedger, vitals, drills, twin } = bus;
  const verdict = readiness && readiness.verdict ? String(readiness.verdict).toUpperCase() : "GREEN";

  // weekly consistency + the wall trend now share ONE real 7-calendar-day window
  // (#85). The old wall trend summed the last 7 ROWS and carried the same
  // rows-are-not-days defect one line below the consistency bug.
  const wc = weeklyConsistency(history, now);
  const wall_week_minutes = wc.measured ? wc.minutes : (history || []).slice(-7).reduce((a, d) => a + (d.wall_minutes || 0), 0);

  // brain meter from ledger
  const today = localDate(now);
  const todayCalls = (brainLedger || []).filter(l => tsLocalDay(l.ts) === today);   // local day, not the UTC slice (E2E audit 25 Jul 2026)
  // #88: computed from the FULL ledger slice against a midnight-crossing window,
  // never from todayCalls — that nesting is what made last night unreachable.
  const ow = overnightWindow(now, bus.brain_overnight);
  const inWindow = (l) => { const t = Date.parse(l && l.ts); return Number.isFinite(t) && t >= ow.start.getTime() && t < ow.end.getTime(); };
  const overnight = (brainLedger || []).filter(inWindow);

  // CALIBRATION FROM REP 1 (#106/#99): the old gate was `status === "ok"`, which
  // calibration.mjs:254 only issues at >= min_reps — so on 4 Aug, with 9 real reps
  // and a real 0.2111 gap on disk, the wall printed "awaiting blood" and threw the
  // measurement away. The panel now speaks whenever there is an n, and carries a
  // have/need counter instead of the word "warming_up". Danger topics stay
  // suppressed below the threshold because the PRODUCER suppresses them.
  const calBuckets = calibration && calibration.buckets ? calibration.buckets : null;
  const calN = calibration && typeof calibration.total_reps === "number" ? calibration.total_reps
    : calBuckets ? Object.values(calBuckets).reduce((a, b) => a + (b && b.n ? b.n : 0), 0) : 0;
  const calNeed = typeof bus.calibration_min_reps === "number" ? bus.calibration_min_reps : null;   // read from calibration_config.json, never guessed

  return {
    date: today, generated_at: now.toISOString(), verdict,
    maidan: learning_state && learning_state.maidan ? learning_state.maidan : null,
    weak_connection: learning_state ? learning_state.weak_connection : null,
    season: {
      // #84: "the file has never existed" and "the counter measured zero" used to
      // collapse to the SAME value here, and renderSeason was the only data panel
      // with no awaiting() branch — so the wall and the desktop asserted
      // "matches 0 · cabinet locked" as a counted fact. The numeric keys keep their
      // old shape (setup/WALLPAPER.ps1 reads them positionally); `ledger_open` is
      // the fact that was missing, and the render branches on it.
      ledger_open: !!season,
      matches_played: season ? safe(season.matches_played, 0) : 0,
      trophy_state: season ? safe(season.trophy_state, "unlit") : "unlit",
      weekly_consistency_pct: wc.pct,
      weekly_consistency_days: wc.worked,      // have  ─┐ #106: a counter, not a word
      weekly_consistency_window: wc.days,      // need  ─┘
      weekly_consistency_basis: wc.measured ? "days with wall_minutes > 0, over a real 7-calendar-day window" : "no dated history row — unmeasured",
    },
    calibration: calBuckets && calN > 0 ? {
      gap: calibration.calibration_gap, trend: calibration.trend,
      buckets: calBuckets, danger: (calibration.danger_zone || []).map(d => d.topic),
      reps_have: calN, reps_need: calNeed,
      low_confidence: calibration.low_confidence !== false,
      status: calibration.status || null,
    } : null,
    // THE OUTWARD LANE (outward loop, 8 Aug 2026 — Ruling 5: benchmark + missions
    // reach the wall). Pre-composed one-liners; absent files ⇒ null ⇒ no panel.
    outward: (() => {
      const mj = bus.missions, bj = bus.benchmark;
      if (!mj && !bj) return null;
      const lines = [];
      if (mj && Array.isArray(mj.missions) && mj.missions.length) {
        const audit = mj.missions.filter(r => r.type === "audit");
        const closed = !!(mj.syllabus_audit && mj.syllabus_audit.closed_at);
        if (audit.length && !closed) {
          const done = audit.filter(r => r.ingested_at).length;
          lines.push(done < 4 ? `full-syllabus audit ${done}/4 returned — next fire: ${(audit.find(r => !r.ingested_at) || {}).id || "?"}`
            : `all 4 audit returns in — awaiting audit-close (his word)`);
        }
        const gen = mj.missions.filter(r => r.type !== "audit" && !r.ingested_at);
        if (gen.length) lines.push(`${gen[0].id} staged — fire on Gemini when he sits`);
      }
      // Same pass — the bucket string is the OWNER's now (benchmark.mjs
      // `projection`), not rebuilt here. This line composed `${locked}/
      // ${core_total}` itself and so printed "B5 0/0" for the one bucket with
      // concept_buckets: [] by design — its evidence is the shipped product, and
      // it read on the wall as literally nothing. Identical output for B1-B4.
      // Fallback = the old expression verbatim, for a pre-wire benchmark.json.
      if (bj) lines.push(bj.status === "gated_pre_audit" ? `benchmark GATED (pre-audit)`
        : `benchmark: ${(bj.buckets || []).map(b => b.projection || `${b.id} ${b.counts.locked}/${b.counts.core_total}`).join(" · ")}${(bj.regressions || []).length ? ` · ⚠ ${bj.regressions.length} regression(s)` : ""}`);
      // 10 Aug 2026 wiring pass — the NEED names reach the wall. The counts line
      // above shipped since 8 Aug; the names it is measured against never left
      // benchmark.mjs, so the desk showed where he stands and never what to do
      // next. benchmark.mjs owns needs[]; its own line, so the counts line keeps
      // its shape. Absent/empty ⇒ no line (absence, not a zero — house rule).
      // DEAD-WIRE SWEEP 11 Aug 2026 — the differentiators reach the desk. The counts
      // line above maps over `buckets` and always has, so 6-cross-cut (#1 senior signal)
      // and 7-domain (the fintech moat) — written to benchmark.json since 8 Aug, riding
      // 46.7% and 44.5% of the interview — appeared on this wall as nothing at all.
      // Their own line, above the needs, because they are counts and not a 6th bucket.
      // benchmark.mjs composes the string (differentiators_line); absent ⇒ no line.
      if (bj && bj.status === "ok" && bj.differentiators_line) lines.push(bj.differentiators_line);
      if (bj && Array.isArray(bj.needs) && bj.needs.length) lines.push(`benchmark need: ${bj.needs.join(" · ")}`);
      return lines.length ? { lines } : null;
    })(),
    derby: learning_state && Array.isArray(learning_state.confusion_pairs) ? learning_state.confusion_pairs.slice(0, 5) : [],
    // same absent-vs-zero distinction as the season ledger (#84)
    tape_open: !!tape_room,
    doubts_retired: tape_room ? safe(tape_room.doubts_retired, 0) : 0,
    tape_queue: tape_room && Array.isArray(tape_room.queue) ? tape_room.queue.length : 0,
    wall_week_minutes,
    // KAAM 1 (10 Aug 2026) — THE BODY PANEL NOW KNOWS HOW OLD IT IS.
    // The renderer had no freshness gate of ANY kind, so on 10 Aug the wall was
    // showing a verdict computed from the night of 4 Aug — 6 days and 126+ hours
    // old — with nothing on screen to say so, while the Goalkeeper task sat
    // Disabled and the ring data had not refreshed. The organism already knew:
    // loop_vitals.json carries the bleed. The wall was the last surface that
    // didn't.
    // verdict ONLY — never raw biometrics. The day and the age are PROVENANCE,
    // not physiology: they say when the sensor last spoke, which is the opposite
    // of a medical claim and is exactly what "a blind sensor reports blindness"
    // asks for.
    // NO THRESHOLD IS INTRODUCED. `age_days >= 1` is not a tuned number — it is
    // the question "is this reading for today?", which has a yes/no answer. His
    // no-guessed-numbers law is untouched; nothing here waits on 30-45-60 days.
    body: (() => {
      const day = readiness && readiness.day && /^\d{4}-\d{2}-\d{2}$/.test(String(readiness.day)) ? String(readiness.day) : null;
      const age_days = day ? Math.round((Date.parse(today + "T00:00:00Z") - Date.parse(day + "T00:00:00Z")) / 86400000) : null;
      return { verdict, day, age_days, present: !!(readiness && readiness.verdict) };
    })(),
    bleeds: vitals && Array.isArray(vitals.bleeds) ? vitals.bleeds.map(b => b.kind) : [],
    brain: {
      calls_today: todayCalls.length,
      tokens_today: todayCalls.reduce((a, l) => a + (l.total_tokens || 0), 0),
      overnight_calls: overnight.length,
      overnight_tokens: overnight.reduce((a, l) => a + (l.total_tokens || 0), 0),
      overnight_window: ow.label,                                        // #88 — say WHICH night
      overnight_window_source: bus.brain_overnight ? "brain_config.json" : "fallback (brain_config unreadable)",
      // HONESTY OVER GREEN: if the bounded read could not prove it reached back
      // past the window start, the panel says so instead of printing a zero.
      coverage: bus.ledger_coverage || null,
    },
    kal_line: bus.kal_line || null,
    // #87: the packet used to be flattened to {kind, emoji}, so wall.html rendered
    // the literal string "🔵 recall" — a drill with no content. concepts[] is what
    // makes it a drill; carry it to every surface that reads this file.
    drills_tomorrow: drills && Array.isArray(drills.drills) ? drills.drills.map(d => ({
      kind: d.kind, emoji: d.probe_type_emoji,
      concepts: Array.isArray(d.concepts) ? d.concepts.filter(Boolean).map(String) : [],
      mode: d.mode || null,
    })) : [],
    twin_voice: twin ? twin.voice : null,
    media: bus.media || null,   // {teamtalk_am,teamtalk_pm,poster,filmkit} — presence flags only
    commitments: Array.isArray(bus.commitments) ? bus.commitments.slice(-7) : [],   // kal-lines, kept (U4)
    // THE NOW STRIP (captain's call, high-dopamine): live odometers that only
    // count UP + the struggle verdict in forge-framing. No quota bars, no
    // wall-minutes daily meter (that law stands), hidden entirely on RED.
    now: {
      // guarded read: a pitch_read.json written mid-run without a struggle block
      // used to throw a TypeError here and kill the whole render.
      struggle: bus.pitch_read && bus.pitch_read.date === today && bus.pitch_read.struggle && bus.pitch_read.struggle.verdict ? bus.pitch_read.struggle.verdict : "no_data",
      learning_min: bus.timeaudit && bus.timeaudit.buckets && bus.timeaudit.buckets.Learning ? Math.round(bus.timeaudit.buckets.Learning.minutes || 0) : 0,
      building_min: bus.timeaudit && bus.timeaudit.buckets && bus.timeaudit.buckets.Building ? Math.round(bus.timeaudit.buckets.Building.minutes || 0) : 0,
      reps_today: bus.repsToday || 0,
    },
  };
}

// ---------------------------------------------------------------------------
// INSIGHT VALIDATION (#59, #60)
// ---------------------------------------------------------------------------
// FROZEN VERBATIM (CLAUDE.md layering law) — viz's own copy of the whitelist, as
// it stood until 4 Aug 2026. It is kept, and it is NEUTERED: nothing calls it any
// more. It is here as the witness to what it did, because it is the reason the
// wall could carry an invented number:
//   · `for (let i = 0; i <= 31; i++)` whitelisted EVERY integer 0-31 — exactly the
//     range a hallucinating model fabricates (rep counts, card counts, small
//     percentages), so "9 doubts retired" passed on a wall showing 0.
//   · the caller then blanket-stripped every date and every clock time before the
//     check, so an INVENTED deadline ("we ship by 2026-08-01") or an invented
//     window ("lights out by 22:45") could never be caught at all.
//   · it also split comma-grouped thousands: "10,000" extracted as ["10","000"]
//     and bounced on "000", a number the model was handed, not one it invented (#60).
// The plan of record is scripts/validators.mjs, imported at the top of this file.
// Re-enabling this one means re-opening all three holes.
function allowedNumbersLegacy(data) {
  const s = new Set();
  (function walk(v) {
    if (typeof v === "number" && Number.isFinite(v)) { s.add(String(v)); s.add(String(Math.round(v))); }
    else if (typeof v === "string") for (const m of v.match(/\d+(\.\d+)?/g) || []) s.add(m);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(data);
  for (let i = 0; i <= 31; i++) s.add(String(i));
  return s;
}

// brain_config.json's banned_phrases, the three that apply to a motivational
// surface. Kept as a named constant so the reason for a rejection can be shown.
const HYPE_RE = /10x|exponential|on steroids/i;

/**
 * THE READ — the plan of record. Returns a RESULT, not a silence.
 *
 * #59's second half: the old validateInsights was reject-and-omit — it returned
 * `null` and renderWall simply emitted no panel. On the wall, a night the brain
 * never ran and a night the brain hallucinated looked IDENTICAL: a blank shelf.
 * That is the audit's own failure mode (an unmeasured silence rendered as a
 * measured nothing). A rejection is now a first-class, visible outcome.
 *
 * @param {string} text   the model's ≤3 lines
 * @param {*} data        wall_data — the only numbers that exist
 * @param {string} shown  the assembled prompt, if the caller has it (validators.mjs
 *                        eats it: a digit the wrapper itself handed the model is by
 *                        definition not invented)
 * @returns {{lines: string[]|null, rejected: boolean, reason?: string}}
 */
// KAAM 1 (10 Aug 2026) — THE MODEL'S OWN FURNITURE IS NOT ONE OF HIS THREE LINES.
// Measured over the 4 nights with evidence: on one of them the model opened with
// its own dated title ("## 09 AUGUST 2026"), which (a) ate slot 1 of 3, so the
// third real bullet was sliced away unread, and (b) carried "09", the ONLY token
// in the whole file that failed the gate — so a title line killed three good
// sentences. Dropping furniture BEFORE the slice fixes both at once, and it is
// the cheap half: the other 3 of 4 deaths were a derived count and a quoted
// session date, which only the allowed-set snapshot fixes. Ship both or the
// panel is not back.
// Conservative by construction: a heading must LOOK like a heading, and a title
// line must carry no lowercase letter AND be short. A real insight is a Hinglish
// sentence about his week — it has lowercase letters and it runs long — so the
// filter cannot eat one. If it ever does, the panel loses a line rather than
// showing furniture, and that is the right way round.
// THE SHAPE WAS READ OFF THE ARTEFACT, NOT OFF THE AUDIT NOTE. The note called it
// a "self-dated header" and the obvious guess is `## 09 AUGUST 2026`. The live
// file for 10 Aug actually opens:
//     **Wall Insights — 2026-08-09**
// — a whole-line BOLD span, not a heading, and carrying lowercase letters, so a
// heading-or-shouting filter sails straight past it. Built against the guess, this
// filter would have passed its own tests and changed nothing on the wall. It was
// caught by rendering the wall and reading the panel back, which is the only
// reason this line is right.
// (Note what that title also proves, in passing: the file NAMED 2026-08-10.md
// says 2026-08-09 inside. That is the provenance defect above, caught live.)
const MD_HEADING = /^#{1,6}\s/;
const MD_RULE = /^([-*_=])\1{2,}$/;
const TITLE_ONLY = /^[^a-z]+$/;
// A whole line wrapped in one emphasis span is a title. A real insight is a
// sentence about his week — it is never entirely bold, and it is never entirely
// italic — so this cannot eat one.
const WHOLE_LINE_EMPHASIS = /^(\*\*|__|\*|_)(?!\s)([\s\S]+?)(?<!\s)\1$/;
const isFurniture = (l) => MD_HEADING.test(l) || MD_RULE.test(l)
  || (TITLE_ONLY.test(l) && l.length <= 60)
  || (WHOLE_LINE_EMPHASIS.test(l) && !/[.!?](\s|$)/.test(l.replace(/^(\*\*|__|\*|_)|(\*\*|__|\*|_)$/g, "")));
// The model writes its three lines as markdown bullets. The bullet is furniture
// too — just furniture that lives at the front of a real line rather than on a
// line of its own — so it is stripped for display, never used to drop the line.
const stripBullet = (l) => l.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, "");

function readInsights(text, data, shown = "") {
  if (!text || !text.trim()) return { lines: null, rejected: false };
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean).filter(l => !isFurniture(l)).map(stripBullet).slice(0, 3);
  if (!lines.length) return { lines: null, rejected: false };
  const joined = lines.join(" ");
  const num = noNewNumbers(joined, data, shown);
  if (!num.ok) return { lines: null, rejected: true, reason: `invented number ${num.bad}` };
  const hype = HYPE_RE.exec(joined);
  if (hype) return { lines: null, rejected: true, reason: `banned hype phrase "${hype[0]}"` };
  return { lines, rejected: false };
}

// Contract-preserving wrapper: array-or-null, the shape every existing caller and
// fixture expects. New callers should use readInsights and render the rejection.
function validateInsights(text, data, shown = "") { return readInsights(text, data, shown).lines; }

// ---------------------------------------------------------------------------
// render (pure) — cold steel, warm core
// ---------------------------------------------------------------------------
const C = { bg: "#0c0e13", panel: "#12151d", amber: "#e8915a", body: "#e9e7e2", gold: "#c9a06a", dim: "#5a6070", green: "#7fb069", red: "#c05a5a", yellow: "#d9b45a" };

function panel(title, inner) {
  return `<section style="background:${C.panel};border:1px solid #1c2030;border-radius:10px;padding:16px 18px;margin:10px;flex:1;min-width:280px">
  <h2 style="font-size:11px;letter-spacing:2px;color:${C.gold};margin:0 0 10px;text-transform:uppercase">${esc(title)}</h2>${inner}</section>`;
}
const awaiting = (what) => `<div style="color:${C.dim};font-size:13px;padding:8px 0">awaiting blood — ${esc(what)} flows in with your first reps</div>`;
// same voice, different trigger: some ledgers open on a ritual, not on reps (#84)
const awaitingOn = (what, when) => `<div style="color:${C.dim};font-size:13px;padding:8px 0">awaiting blood — ${esc(what)} opens with ${esc(when)}</div>`;
const fluColor = (f) => String(f).includes("🟢") ? C.green : String(f).includes("🟡") ? C.yellow : C.red;

function renderMaidan(d) {
  if (!d.maidan || !Array.isArray(d.maidan.stages) || !d.maidan.stages.length) return panel("The Maidan — your field", awaiting("the fluency map"));
  const stages = d.maidan.stages;
  const W = 640, H = 180, gap = W / (stages.length + 1);
  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;background:#0e1410;border-radius:8px">
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="#1e3325" stroke-width="2" rx="6"/>
    <line x1="${W / 2}" y1="4" x2="${W / 2}" y2="${H - 4}" stroke="#1e3325"/>
    <circle cx="${W / 2}" cy="${H / 2}" r="26" fill="none" stroke="#1e3325"/>`;
  stages.forEach((s, i) => {
    const x = gap * (i + 1), y = H / 2 + (i % 2 ? -34 : 34);
    const col = s.status === "runnable" ? C.green : s.status === "building" ? C.yellow : C.dim;
    svg += `<circle cx="${x}" cy="${y}" r="14" fill="${col}" opacity="0.85"/>
      <text x="${x}" y="${y + 30}" text-anchor="middle" font-size="10" fill="${C.body}">${esc(s.label || s.id)}</text>`;
    if (i > 0) {
      const px = gap * i, py = H / 2 + ((i - 1) % 2 ? -34 : 34);
      const frayed = d.weak_connection && d.weak_connection.includes(String(s.id));
      svg += `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" stroke="${frayed ? C.red : "#2c4434"}" stroke-width="2" ${frayed ? 'stroke-dasharray="4 4"' : ""}/>`;
    }
  });
  svg += "</svg>";
  const weak = d.weak_connection ? `<div style="color:${C.red};font-size:12px;margin-top:8px">frayed pass: ${esc(d.weak_connection)}</div>` : "";
  return panel("The Maidan — your field", svg + weak);
}

// #84 — renderSeason was the ONLY data panel with no awaiting() branch, so on a
// bus where season.json has never been written it printed "0 matches played" and
// "🔒 the cabinet unlit" in the same weight and colour as a counted number. The
// numbers are all accurate TODAY (matches_played 0 really is 0 until the first
// full-time closes), so this is not a live lie — it is the missing signal that
// would tell him the ledger DIED rather than read zero. Note the shape: an absent
// season ledger does not blank the whole panel, because doubts_retired and the
// consistency window beside it are genuinely measured and must keep their address
// (audit rule: never take away a surface, give the missing thing one).
function renderSeason(d) {
  const s = d.season;
  const cons = s.weekly_consistency_pct === null ? "—" : s.weekly_consistency_pct + "%";
  // every source dark → the sibling-panel treatment, verbatim
  if (!s.ledger_open && !d.tape_open && s.weekly_consistency_pct === null) {
    return panel("Season", awaitingOn("the season ledger", "your first full-time"));
  }
  const cell = (big, small, col = C.amber, size = 34) =>
    `<div><span style="font-size:${size}px;color:${col};font-weight:700">${big}</span>
        <div style="font-size:11px;color:${C.dim}">${small}</div></div>`;
  const dark = (small) =>
    `<div><span style="font-size:22px;color:${C.dim}">—</span>
        <div style="font-size:11px;color:${C.dim}">${small}</div></div>`;
  const parts = [];
  parts.push(s.ledger_open ? cell(safe(s.matches_played, 0), "matches played") : dark("matches played · ledger opens at your first full-time"));
  parts.push(d.tape_open ? cell(d.doubts_retired, `doubts retired · ${d.tape_queue} rematches waiting`) : dark("doubts retired · the tape room has not opened"));
  // have/need beside the percentage (#106) — the number can no longer be read as
  // a verdict without its denominator.
  parts.push(cell(esc(cons), `weekly consistency · ${s.weekly_consistency_days}/${s.weekly_consistency_window} days you showed up`, C.body, 22));
  parts.push(s.ledger_open
    ? `<div><span style="font-size:22px">${s.trophy_state === "lit" ? "🏆" : "🔒"}</span>
        <div style="font-size:11px;color:${C.dim}">the cabinet ${esc(s.trophy_state)}</div></div>`
    : dark("the cabinet · unknown until the ledger opens"));
  return panel("Season", `<div style="display:flex;gap:24px;align-items:baseline;flex-wrap:wrap">${parts.join("")}</div>`);
}

// THE SCOUT'S DESK (outward loop, 8 Aug 2026) — missions in flight + the
// benchmark line. Absent ⇒ no panel (absence, not a zero).
function renderOutward(d) {
  if (!d.outward || !d.outward.lines || !d.outward.lines.length) return "";
  return panel("The scout's desk",
    d.outward.lines.map(l => `<div style="font-size:13px;color:${C.body};margin:3px 0">· ${esc(l)}</div>`).join(""));
}

function renderCalibration(d) {
  if (!d.calibration) return panel("Calibration — the book on your knowing", awaiting("calibration"));
  const c = d.calibration;
  const bucket = (name, b, target) => {
    const acc = b && b.accuracy !== null && b.n ? Math.round(b.accuracy * 100) : null;
    return `<div style="margin:4px 0;font-size:12px;color:${C.body}">${name}: ${acc === null ? "—" : acc + "%"} <span style="color:${C.dim}">(target ${Math.round(target * 100)}%, n=${b ? b.n : 0})</span></div>`;
  };
  // #106 — the have/need counter replaces the word "warming_up". The panel used
  // to disappear entirely below the producer's min_reps gate, throwing away a real
  // measurement (9 reps, gap 0.2111 on 4 Aug) and telling him "awaiting blood"
  // when blood had in fact been drawn. It speaks from rep 1, with its n shown, and
  // says plainly what it is not yet allowed to conclude.
  const need = typeof c.reps_need === "number" ? c.reps_need : null;
  const warming = c.low_confidence !== false;
  const counter = warming
    ? `<div style="font-size:11px;color:${C.yellow};margin-bottom:8px">reading from ${c.reps_have} rep(s)${need === null ? " — the confidence threshold is unreadable right now" : ` of the ${need} this book wants`} · a direction, not a verdict${c.danger && c.danger.length ? "" : " · danger topics stay suppressed until then"}</div>`
    : `<div style="font-size:11px;color:${C.dim};margin-bottom:8px">reading from ${c.reps_have} rep(s)${need === null ? "" : ` · past the ${need}-rep confidence threshold`}</div>`;
  return panel("Calibration — the book on your knowing",
    `<div style="font-size:26px;color:${C.amber};font-weight:700">${safe(c.gap)}</div>
     <div style="font-size:11px;color:${C.dim};margin-bottom:2px">${esc(safe(c.trend, ""))}</div>` + counter +
    bucket("knew", c.buckets && c.buckets.knew, 0.95) + bucket("shaky", c.buckets && c.buckets.shaky, 0.65) + bucket("guessed", c.buckets && c.buckets.guessed, 0.30) +
    (c.danger && c.danger.length ? `<div style="color:${C.red};font-size:12px;margin-top:8px">danger: ${esc(c.danger.join(", "))}</div>` : ""));
}

function renderDerby(d) {
  if (!d.derby.length) return panel("Derby table — confusions", awaiting("confusion pairs"));
  return panel("Derby table — confusions", d.derby.map(p =>
    `<div style="font-size:13px;color:${C.body};margin:4px 0">${esc(p.from)} <span style="color:${C.amber}">vs</span> ${esc(p.to)} <span style="color:${C.dim}">×${p.count}</span></div>`).join(""));
}

function renderBody(d) {
  const col = d.verdict === "GREEN" ? C.green : d.verdict === "AMBER" ? C.yellow : C.red;
  const bleeds = d.bleeds.length ? `<div style="color:${C.yellow};font-size:12px;margin-top:6px">physio: ${esc(d.bleeds.join(", "))}</div>` : "";
  // KAAM 1 — the freshness line. Three honest states, no fourth:
  //   · today's reading      → say the day, quietly
  //   · an older reading     → say the day AND the age, in the warning colour,
  //                            and say plainly that it is not today's body
  //   · no reading at all    → name the default AS a default (the GREEN fallback
  //                            above is a policy, not a measurement, and the wall
  //                            must never let a policy wear a sensor's clothes)
  // The verdict is still SHOWN in every case. Hiding it would trade one silent
  // lie for another, and "unmeasured is not zero" cuts both ways.
  // DELIBERATELY NOT DONE HERE: the RED minimal-wall collapse still keys on the
  // verdict alone, so a stale RED would keep collapsing the wall. Gating that on
  // age is a BEHAVIOURAL change to a safety surface and it needs either his word
  // or measured data — it is named here rather than slipped in.
  const b = d.body || {};
  const fresh = !b.present
    ? `<div style="font-size:11px;color:${C.yellow};margin-top:6px">no reading on disk — this GREEN is the default, not a measurement.</div>`
    : Number.isFinite(b.age_days) && b.age_days >= 1
      ? `<div style="font-size:11px;color:${C.yellow};margin-top:6px">this reading is from ${esc(b.day)} — ${b.age_days} day(s) old. It is not today's body.</div>`
      : b.day ? `<div style="font-size:11px;color:${C.dim};margin-top:6px">reading: ${esc(b.day)}</div>` : "";
  return panel("The body", `<div style="display:flex;align-items:center;gap:10px">
    <div style="width:16px;height:16px;border-radius:50%;background:${col}"></div>
    <div style="font-size:18px;color:${C.body}">${esc(d.verdict)}</div>
    <div style="font-size:11px;color:${C.dim}">verdict only — the numbers stay with the Goalkeeper</div></div>${fresh}${bleeds}`);
}

function renderBrain(d) {
  const b = d.brain;
  // #88: say WHICH night. The old line read "N overnight" from a window that
  // structurally could not contain last night's 22:00-23:59 — and on the 22:00
  // wall it labelled the evening's OWN calls as work done "while you slept",
  // before he had slept. Naming the window is what makes the number checkable.
  const win = b.overnight_window ? ` (${esc(b.overnight_window)}, last night)` : "";
  const cov = b.coverage && b.coverage.covered === false
    ? `<div style="font-size:11px;color:${C.yellow};margin-top:4px">the ledger read could not reach back past the window start — ${esc(b.coverage.reason || "reason unrecorded")}. Read this as at-least, not as a total.</div>` : "";
  return panel("The brain — got sharper while you slept",
    `<div style="font-size:13px;color:${C.body}">${b.calls_today} call(s) today · ${b.overnight_calls} overnight${win}</div>
     <div style="font-size:11px;color:${C.dim};margin-top:4px">${b.tokens_today.toLocaleString()} tokens metabolized today · ${(b.overnight_tokens || 0).toLocaleString()} across last night's shift</div>${cov}`);
}

function renderWallTrend(d) {
  if (d.verdict === "RED") return "";                                  // hidden entirely on RED
  return panel("The wall — weekly trend only",
    `<div style="font-size:13px;color:${C.body}">${d.wall_week_minutes} wall-minutes this week</div>
     <div style="font-size:11px;color:${C.dim};margin-top:4px">a stat you watch shrink — never a daily meter</div>`);
}

// #87 — the packet reached this surface stripped of content: wall.html literally
// rendered "🔵 recall", a drill with no subject. concepts[] is the drill; without
// it the panel is decoration. An empty concepts[] is now SAID, not hidden, because
// a drill with no concept is a real defect upstream and he should see it.
function renderDrills(d) {
  if (!d.drills_tomorrow.length) return panel("Tomorrow's set pieces", awaiting("compiled drills"));
  return panel("Tomorrow's set pieces", d.drills_tomorrow.map(x => {
    const what = x.concepts && x.concepts.length
      ? `<span style="color:${C.amber}">${esc(x.concepts.join(" · "))}</span>`
      : `<span style="color:${C.dim}">no concept named — the packet came through empty</span>`;
    const mode = x.mode ? `<span style="color:${C.dim};font-size:11px"> · ${esc(x.mode)}</span>` : "";
    return `<div style="font-size:14px;color:${C.body};margin:5px 0">${esc(x.emoji || "")} ${esc(x.kind)} — ${what}${mode}</div>`;
  }).join(""));
}

const FORGE_FRAME = {
  productive: ["the forge is working", "#7fb069"],
  spinning: ["same crack — a different door is queued", "#d9b45a"],
  cruising: ["cruising — room to interleave harder", "#7fb069"],
  no_data: ["quiet pitch", "#5a6070"],
};
function renderNow(d) {
  const [label, col] = FORGE_FRAME[d.now.struggle] || FORGE_FRAME.no_data;
  return panel("Right now", `
    <div style="display:flex;gap:26px;align-items:baseline;flex-wrap:wrap">
      <div><span style="font-size:28px;color:${C.amber};font-weight:700">${d.now.reps_today}</span>
        <div style="font-size:11px;color:${C.dim}">reps today</div></div>
      <div><span style="font-size:28px;color:${C.body};font-weight:700">${d.now.learning_min}</span>
        <div style="font-size:11px;color:${C.dim}">learning min</div></div>
      <div><span style="font-size:28px;color:${C.body};font-weight:700">${d.now.building_min}</span>
        <div style="font-size:11px;color:${C.dim}">building min</div></div>
      <div><span style="font-size:14px;color:${col}">● ${esc(label)}</span>
        <div style="font-size:11px;color:${C.dim}">odometers only — they count up, never against you</div></div>
    </div>`);
}

// MEDIA — the club's channel (media engine): today's team talks as playable
// audio, the daily poster, the film kit. Renders nothing when nothing exists.
function renderMedia(d) {
  if (d.verdict === "RED") return "";   // minimal-wall law: a rest day shows no channel at all
  const m = d.media || {};
  // THE SHELF — always rendered (an empty shelf says WHO stocks it and WHEN;
  // a vanished panel reads as broken). Poster shows as a real preview, the
  // talks as clean players, the lanes as buttons. Numbers still live elsewhere.
  const card = (inner, grow = 1) => `<div style="flex:${grow};min-width:180px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px">${inner}</div>`;
  const label = (t) => `<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${C.dim};margin-bottom:8px">${esc(t)}</div>`;
  const btn = (href, text, col) => `<a href="${esc(href)}" style="display:inline-block;padding:6px 12px;margin:4px 8px 0 0;border:1px solid ${col};border-radius:999px;color:${col};font-size:12px;text-decoration:none">${text}</a>`;
  const cards = [];
  // KAAM 1 — "today's poster" was a caption that could not be wrong, because it
  // asserted nothing checkable. It now states the artefact's own record, so the
  // card and the page it opens can be compared by eye in one glance.
  if (m.poster) cards.push(card(label(m.poster_prov ? "the poster" : "today's poster")
    + `<a href="poster.svg"><img src="poster.svg" alt="match poster" style="width:100%;border-radius:8px;display:block"></a>`
    + (m.poster_prov ? `<div style="font-size:10px;color:${C.dim};margin-top:6px">${esc(provLine(m.poster_prov))}</div>` : ""), 2));
  if (m.teamtalk_am) cards.push(card(label("🎙 morning team talk — 90s") + `<audio controls preload="none" style="width:100%;height:32px" src="media/teamtalk_${esc(d.date)}_am.mp3"></audio>`));
  if (m.teamtalk_pm) cards.push(card(label("🌙 evening team talk — 90s") + `<audio controls preload="none" style="width:100%;height:32px" src="media/teamtalk_${esc(d.date)}_pm.mp3"></audio>`));
  const shelf = cards.length
    ? `<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:stretch">${cards.join("")}</div>`
    : `<div style="font-size:13px;color:${C.dim};padding:10px 2px">the shelf is empty right now — the night shift stocks it while you sleep: tonight's poster and two spoken team talks land here 🌙</div>`;
  // ONE-CLICK LANES — a click copies the ready-made source AND opens the right
  // account: land, paste, Generate. No raw markdown in the captain's face.
  const jsSafe = (s) => JSON.stringify(String(s || "")).replace(/</g, "\\u003c");
  const act = (fn, label, col) => `<button onclick="${fn}" style="cursor:pointer;background:none;display:inline-block;padding:6px 12px;margin:4px 8px 0 0;border:1px solid ${col};border-radius:999px;color:${col};font-size:12px">${label}</button>`;
  // #89 — ship() used to be:
  //     try{navigator.clipboard.writeText(t)}catch(e){};window.open(u,'_blank')
  //   writeText returns a PROMISE. A synchronous try/catch cannot catch a promise
  //   rejection, so a denied write (NotAllowedError: "Document is not focused" —
  //   reproduced live from file://) was swallowed in total silence while the tab
  //   opened anyway and the button's own label told him in writing "source already
  //   copied". He then pastes whatever was on his clipboard before.
  //   THE FIX IS NOT `.then(() => window.open(...))` — moving the open out of the
  //   user-gesture window hands it to the popup blocker and trades a rare silent
  //   copy failure for a reliable "nothing opened at all". So: window.open stays
  //   SYNCHRONOUS inside the click, .catch() is attached to the write, and the
  //   outcome — success, failure, or no clipboard API at all — is written into the
  //   page next to the raw-kit link that is already the fallback.
  const shipJs = `<script>
function shipnote(msg,col){var n=document.getElementById('shipnote');if(n){n.textContent=msg;n.style.color=col}}
function ship(t,u){
  var w=window.open(u,'_blank');                       /* synchronous: keeps the user gesture */
  if(!w){shipnote('\\u26a0 the browser blocked the new tab \\u2014 allow popups for this page, or use the raw kit link below','${C.yellow}')}
  var p=null;
  try{p=(navigator.clipboard&&navigator.clipboard.writeText)?navigator.clipboard.writeText(t):null}
  catch(e){p=null}
  if(p&&p.then){
    p.then(function(){shipnote('\\u2713 copied \\u2014 paste it there (Ctrl+V)','${C.green}')})
     .catch(function(e){shipnote('\\u26a0 copy FAILED ('+(e&&e.name?e.name:'unknown')+') \\u2014 your clipboard still holds whatever it held. Use the raw kit link below.','${C.red}')});
  } else {
    shipnote('\\u26a0 no clipboard API on this origin \\u2014 nothing was copied. Use the raw kit link below.','${C.red}');
  }
}
const KIT=${jsSafe(m.filmkit_text)};const VEO=${jsSafe(m.veo_text)};</script>`;
  // the labels no longer PROMISE a copy that has not happened yet
  let lanes = shipJs
    + act("ship(KIT,'https://notebooklm.google.com')", "🎬 season film — opens NotebookLM + copies the source: paste → Video Overview", C.amber)
    + act("ship(VEO,'https://gemini.google.com')", "📽 poster/film prompt — opens Gemini + copies the prompt: paste → send", C.gold);
  // #86 — the button used to ride a bare existsSync on a fixed, undated filename
  // nothing ever unlinks, so it stayed lit forever from the first successful fold
  // and on 2 Aug pointed at a 21 Jul artifact. The flag now rides on a
  // date-stamped twin (see geminiFlag / posterFlag) and the date is PRINTED, so an
  // undated link to an undated file can never be rendered again.
  if (m.gemini_render) lanes += btn("wall_gemini.html", `🎨 the Gemini render · ${esc(m.gemini_prov ? m.gemini_prov.for_morning : (m.gemini_render_date || d.date))}`, C.dim);
  lanes += `<a href="filmkit_${esc(d.date)}.md" style="margin-left:6px;font-size:11px;color:${C.dim}">raw kit</a>`;
  lanes += `<div id="shipnote" style="margin-top:8px;font-size:11px;color:${C.dim}">nothing copied yet — the buttons above report success or failure here</div>`;
  return panel("Media — the club's channel", shelf + `<div style="margin-top:10px">${lanes}</div>`);
}

// THE FILM KIT — one-click season film: a NotebookLM-ready source doc in true
// numbers (his single tap on their side = Generate Video Overview). Veo API
// stays money-gated; this is the honest ceiling, automated to one click.
function buildFilmKit(d, notebook) {
  const L = [];
  L.push(`# Arsenal AI FC — Season Film Source · ${d.date}`);
  L.push("");
  L.push("Source document for a NotebookLM **Video Overview**. Upload this file (or point NotebookLM at the Drive copy), choose Video Overview, generate. That's the whole ritual.");
  L.push("");
  L.push(`## The season, in true numbers (as of ${d.date})`);
  // #84 — the kit is a source document for a film about his life; an unopened
  // ledger must not be narrated as a counted zero any more than the wall may.
  L.push(d.season.ledger_open
    ? `- Matches played: ${safe(d.season.matches_played, 0)}`
    : `- Matches played: not yet counted — the season ledger opens at his first full-time. Do not narrate this as zero.`);
  L.push(d.tape_open
    ? `- Doubts retired: ${d.doubts_retired} · rematches still waiting: ${d.tape_queue}`
    : `- Doubts retired: not yet counted — the tape room has not opened. Do not narrate this as zero.`);
  // #85 — and it must say what the percentage is OF (this printed a flat "0%" on
  // every kit from 17 to 31 Jul, over weeks he showed up four and five times).
  if (d.season.weekly_consistency_pct !== null) L.push(`- Weekly consistency: ${d.season.weekly_consistency_pct}% — he showed up on ${d.season.weekly_consistency_days} of the last ${d.season.weekly_consistency_window} days`);
  else L.push(`- Weekly consistency: unmeasured (${d.season.weekly_consistency_basis})`);
  if (d.calibration) L.push(`- Calibration gap: ${safe(d.calibration.gap)} (${d.calibration.trend || "—"})`);
  if (d.maidan && Array.isArray(d.maidan.stages)) L.push(`- Maidan stages runnable: ${d.maidan.stages.filter(s => s.status === "runnable").length} of ${d.maidan.stages.length}`);
  if (d.kal_line) L.push(`- Tomorrow's first move, in his own words: "${d.kal_line}"`);
  const moments = notebook && Array.isArray(notebook.moments) ? notebook.moments.slice(-10) : [];
  if (moments.length) {
    L.push("");
    L.push("## Real moments from the season notebook");
    for (const mo of moments) L.push(`- ${mo.date}: ${mo.line}${mo.result ? ` (${mo.result})` : ""}`);
  }
  L.push("");
  L.push("## Tone laws (constitutional — the film obeys the club)");
  L.push("Quiet, earned, no triumphalism. Honest frame: compounding, never hype. No countdowns, no deadlines. Cracks are data, not verdicts. A lone footballer training under floodlights is the recurring image. End on the crest and the words \"kal phir\".");
  return L.join("\n") + "\n";
}

// POSTER FRESHNESS — E2E audit 25 Jul 2026: the old gate was
// `posterOk || existsSync(club/poster.svg)`, but poster.svg is a FIXED, undated
// filename that nothing ever cleans up. On any day the poster job didn't run,
// posterOk was false yet the old file was still on disk, so the shelf kept
// serving last week's image under the fixed caption "today's poster" — the one
// thing the wall may never do, present stale media as current. Each accepted
// poster now also drops a date-stamped twin (poster_<date>.svg) and the flag
// rides ONLY on today's stamp, the same way the team-talk mp3 filenames already
// carry their date. poster.svg stays as the served path (the render, the
// Antigravity brief and the club's relative links all point at it) — it is now
// only ever *shown* on a day it was actually written.
function posterFlag(posterOkToday, exists, dir, today) {
  return !!(posterOkToday || exists(join(dir, `poster_${today}.svg`)));
}

// GEMINI-RENDER FRESHNESS (#86, 4 Aug 2026 audit) — the identical bug, left
// uncured one line away from its own cure. `data.media.gemini_render =
// existsSync(club/wall_gemini.html)` was a bare existence check on a FIXED,
// undated filename; repo-wide grep finds no unlink anywhere, so the flag was
// permanently true from the first successful fold onward and the wall offered a
// 21 Jul snapshot of his life as "the Gemini render" on 2 Aug. Worse, the
// assignment ran BEFORE the fold that writes the file, so even on a night a fresh
// render DID land the flag described the PREVIOUS render's state — a one-render
// lag with no relationship to today at all. Same shape as posterFlag: the served
// path stays wall_gemini.html (the club's relative links point at it), the flag
// rides only on a date-stamped twin, and main() now sets it AFTER the fold.
// NOT a lookback (see THE TRAPS, #65): today's stamp or nothing.
function geminiFlag(foldedToday, exists, dir, today) {
  return !!(foldedToday || exists(join(dir, `wall_gemini_${today}.html`)));
}

// KAAM 1 (10 Aug 2026) — PROVENANCE, and only where it is actually wrong.
// The audit line was "every artefact is one day behind its own filename". That is
// TRUE of the three MODEL-AUTHORED artefacts (poster.svg, wall_gemini*.html,
// wall_insights/*.md) and FALSE of the deterministic ones — wall.html, filmkit_*
// and wall_data.json all render the right day already. Two defensible conventions
// were colliding: the FILENAME carries the service date (the morning the artefact
// is FOR) while the model stamps its own GENERATION date inside the content. So
// the caption read one date off the filename and the page showed another, and
// there was no third thing either of them could be checked against.
//
// This is that third thing: a code-authored record of who made it, when, and for
// which morning. Captions read THIS, never the filename.
//
// THE GUARD THAT MADE THIS THE SHAPE IT IS: the obvious alternative — "just tell
// the painter which morning it is painting" — routes the date through the PROMPT,
// and the prompt is the exact channel that tells the invented-number checker
// which digits are legal (`shown`). Handing the model today's date would put its
// digits in the allowed set of the one organ whose entire job is stopping
// invented numbers, and it would go slack silently. So the model is never told
// the date at all: provenance is written by CODE, after the fact, next to the
// artefact. AI proposes, code validates — a date is not a proposal.
//
// WHAT THIS DOES NOT FIX, said out loud: the poster is stale in DATA, not only in
// its date line — on 10 Aug it printed 86% / 6-of-7 days against a live 71% /
// 5-of-7. Provenance makes the staleness VISIBLE and dateable. It does not make
// the numbers current, and no label ever will.
function artefactProvenance(madeBy, forMorning, now) {
  return { made_by: madeBy, made_at: new Date(now).toISOString(), for_morning: forMorning };
}
function writeProvenance(writeFn, dir, base, madeBy, forMorning, now) {
  const p = artefactProvenance(madeBy, forMorning, now);
  writeFn(join(dir, `${base}.prov.json`), JSON.stringify({ artefact: base, ...p }, null, 2));
  return p;
}
// The caption a human reads. Never the filename — that is the whole point.
function provLine(prov) {
  if (!prov || !prov.made_at) return "provenance unrecorded — this artefact predates the provenance line";
  const when = String(prov.made_at).replace("T", " ").slice(0, 16) + "Z";
  return `${prov.made_by || "unknown"} · made ${when} · for the morning of ${prov.for_morning || "?"}`;
}

// COMMITMENTS — his own kal-lines and what happened next. Won days get the
// tick; a miss reads "went again" (no-shame law); the newest waits unjudged.
function renderCommitments(d) {
  if (!d.commitments || !d.commitments.length) return "";
  const WON = new Set(["HIT", "PARTIAL", "LOAD-MANAGED"]);
  const rows = d.commitments.map(c => {
    const mark = c.next_result === null || c.next_result === undefined ? `<span style="color:${C.dim}">·</span>`
      : WON.has(String(c.next_result).toUpperCase()) ? `<span style="color:${C.green}">✓</span>`
      : `<span style="color:${C.dim}">↻ went again</span>`;
    return `<div style="font-size:12px;color:${C.body};margin:4px 0">${mark} <span style="color:${C.dim}">${esc(c.date)}</span> "${esc(c.kal)}"</div>`;
  }).join("");
  return panel("Commitments — your own words", rows);
}

// THE READ, AND THE REJECTED READ (#59) --------------------------------------
// The old wall emitted no panel at all when validateInsights returned null, so a
// night the brain never ran and a night the brain hallucinated a number produced
// the IDENTICAL surface: nothing. That is the audit's central failure mode —
// silence rendered as a measured nothing — sitting on the one panel whose whole
// job is to be trustworthy. A rejection is now shown, named, and framed: the gate
// working is good news about the wall, not a blank shelf.
// Accepts either the legacy array|null or readInsights' result object.
function insightShelf(insights, prov = null) {
  const r = Array.isArray(insights) ? { lines: insights, rejected: false }
    : (insights && typeof insights === "object") ? insights : { lines: null, rejected: false };
  // KAAM 1 — the third model-authored artefact gets the same treatment as the
  // other two. It needs no new sidecar: the allowed-set snapshot the brain writes
  // beside the .md already records who wrote it, when, and for which morning.
  const provHtml = prov ? `<div style="font-size:10px;color:${C.dim};margin-top:8px">${esc(provLine(prov))}</div>` : "";
  if (r.lines && r.lines.length) {
    return panel("The read", r.lines.map(l => `<div style="font-size:13px;color:${C.body};margin:4px 0">${esc(l)}</div>`).join("") + provHtml);
  }
  if (r.rejected) {
    return panel("The read — held at the gate", `
      <div style="font-size:13px;color:${C.yellow};margin:4px 0">last night's read was written, then REJECTED before it reached this wall: ${esc(r.reason || "reason unrecorded")}.</div>
      <div style="font-size:11px;color:${C.dim};margin-top:6px">Nothing that cannot be traced to a real number gets a place here. The panels above are deterministic and stand on their own.</div>`);
  }
  return "";
}

function renderWall(data, insights) {
  const red = data.verdict === "RED";
  const head = `<meta http-equiv="refresh" content="300"><header style="padding:18px 22px 4px;display:flex;justify-content:space-between;align-items:baseline">
    <div style="font-size:20px;color:${C.body};font-weight:700">⚪🔴 THE CLUB WALL <span style="font-size:10px;color:${C.dim}">· living — refreshes itself</span></div>
    <div style="font-size:12px;color:${C.dim}">${esc(data.date)}</div></header>`;
  const kal = data.kal_line ? `<div style="margin:6px 22px;padding:12px 16px;background:#161a24;border-left:3px solid ${C.amber};color:${C.body};font-size:15px">${esc(data.kal_line)}</div>` : "";
  let body;
  if (red) {
    // minimal wall: KAL-line + floor only — never a loss before he chooses to look
    body = kal + panel("Today", `<div style="font-size:15px;color:${C.body}">Rotation day. One five-minute floor-touch is the whole match. The rest of the wall waits for you.</div>`);
  } else {
    const insightHtml = insightShelf(insights, data.insight_prov || null);
    const voice = data.twin_voice ? panel("The book", `<div style="font-size:14px;color:${C.amber}">${esc(data.twin_voice)}</div>`) : "";
    body = kal + `<div style="display:flex;flex-wrap:wrap">` +
      renderNow(data) + renderMaidan(data) + renderSeason(data) + renderOutward(data) + renderCalibration(data) + renderDerby(data) +
      renderDrills(data) + renderMedia(data) + renderCommitments(data) + renderBody(data) + renderBrain(data) + renderWallTrend(data) + `</div>` + voice + insightHtml;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>THE CLUB WALL</title></head>
<body style="margin:0;background:${C.bg};font-family:'Segoe UI',system-ui,sans-serif;padding-bottom:30px">${head}${body}
<footer style="padding:14px 22px;color:${C.dim};font-size:11px">the loop wastes nothing you generate, loses nothing you are · COYG</footer></body></html>`;
}

// ---------------------------------------------------------------------------
// THE GEMINI LANE — the organism writes his Gemini prompts every render, and
// folds Gemini's answer back in ONLY through a sanitizer (superpower pass).
// ---------------------------------------------------------------------------
const PROMPT_LAWS = `LAWS (constitutional, travel with every render): every number must come from the JSON below — invent nothing; no hype words (10x/exponential/on steroids); no streak counts (weekly consistency only); no raw biometrics (verdict color only); no dates-as-deadlines; SELF-CONTAINED single file — NO external references of ANY kind (no @import, no web fonts/googleapis, no external images or links; system fonts only: 'Segoe UI', system-ui, sans-serif) or the club's gate will reject the render; cold steel warm core palette — deep charcoal #0c0e13 base, warm amber #e8915a accents, off-white #e9e7e2 text, muted gold #c9a06a secondary; football register welcome (the Maidan is a pitch, confusions are derbies, healed weaknesses are trophies); ONE glance = ONE story; output ONLY the artifact, no commentary.`;

function promptPack(data, renderNotes = null) {
  const json = JSON.stringify(data, null, 1);
  const notes = renderNotes && renderNotes.trim()
    ? `\n\nRENDER NOTES from the design coach (last night's critique — apply them):\n${renderNotes.trim().slice(0, 1500)}\n` : "";
  return {
    "wall_painter.md": `# Wall-Painter — tonight's render (auto-written by the organism)\n\nCreate ONE dense, beautiful, dark single-file HTML dashboard (inline SVG, no external anything) from this state. Sections: the Maidan as a real pitch diagram (stages = zones, fluency colors, the weak connection drawn as a frayed pass) · season strip (matches, doubts retired, weekly consistency) · calibration curve vs targets · derby table · tomorrow's set pieces · body verdict band · brain meter ("got sharper while you slept").${notes}\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "match_poster.md": `# Match Poster — this week (auto-written by the organism)\n\nCreate ONE portrait SVG poster (print-worthy, 3:4) of this week as a football match: headline = the biggest true number in the data (doubts retired, matches played, or a derby settled); sub-line = the weekly consistency; one visual motif from the Maidan. Understated, premium, cold-steel-warm-core.\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "season_film.md": `# Season Film — Veo prompt (auto-written; paste into the Gemini app's video tool)\n\nWrite me a 30-second cinematic video-generation prompt: a lone footballer training under floodlights at dawn, ONE scene per true milestone in the JSON (matches played, doubts retired, stages runnable) — rendered as scoreboard glimpses and pitch markings, never text-heavy. Tone: quiet, earned, no triumphalism. End on the crest ⚪🔴 and the words "kal phir".\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "voice_brief.md": voiceBrief(data),
  };
}

// THE VOICE BRIEF — the daily context capsule for the Voice Gaffer Gem
// (setup/VOICE_SETUP.md): he pastes this once, then TALKS to the organism —
// Gemini Live carries the conversation, this carries today's truth. Spoken
// register, ≤20 short lines, numbers only from the wall data.
function voiceBrief(d) {
  const L = [];
  L.push("# Voice Brief — paste me into the Voice Gaffer Gem, then just talk");
  L.push("");
  L.push(`Today: ${d.date}. Body verdict: ${d.verdict}.`);
  if (d.kal_line) L.push(`His KAL-line (his own words, the day starts here): "${d.kal_line}"`);
  // #84 — the spoken brief is the surface with the least room to be corrected, so
  // an unopened ledger is named as unopened, not spoken as a zero.
  L.push(d.season.ledger_open
    ? `Season: ${d.season.matches_played} matches played · ${d.doubts_retired} doubts retired · ${d.tape_queue} rematches waiting.`
    : `Season: the ledger has not opened yet — no match has been closed with a full-time, so there is no matches-played number to say. ${d.tape_open ? `${d.doubts_retired} doubts retired · ${d.tape_queue} rematches waiting.` : "The tape room has not opened either."}`);
  if (d.season.weekly_consistency_pct !== null) L.push(`Weekly consistency: ${d.season.weekly_consistency_pct}% — ${d.season.weekly_consistency_days} of the last ${d.season.weekly_consistency_window} days he touched the wall.`);
  // #106 — say the n, and say what it does not yet license
  if (d.calibration) L.push(`Calibration gap ${d.calibration.gap} (${d.calibration.trend || "—"}), from ${d.calibration.reps_have} rep(s)${d.calibration.low_confidence !== false ? (typeof d.calibration.reps_need === "number" ? ` of the ${d.calibration.reps_need} it wants — a direction, not a verdict` : " — still low-confidence, a direction not a verdict") : ""}.${d.calibration.danger && d.calibration.danger.length ? " Danger topic: " + d.calibration.danger[0] + "." : ""}`);
  // #87 — a set piece without its concept is not a set piece
  if (d.drills_tomorrow.length) L.push(`Tomorrow's set pieces: ${d.drills_tomorrow.map(x => x.concepts && x.concepts.length ? `${x.kind} on ${x.concepts.join(" and ")}` : `${x.kind} (no concept named)`).join(", ")}.`);
  if (d.derby.length) L.push(`Hot derby: ${d.derby[0].from} vs ${d.derby[0].to} (×${d.derby[0].count}).`);
  if (d.twin_voice) L.push(`The book's earned line: ${d.twin_voice}`);
  if (d.bleeds.length) L.push(`Physio note: ${d.bleeds.join(", ")}.`);
  L.push("");
  L.push("Rules for this conversation: spoken register, one idea at a time, honest frame (compounding, never hype), no calendar pressure, cracks are data never verdicts, rivalry only vs kal-wala-Nikhil. If he Bolos a concept, listen fully, then probe ONE crack, warmly.");
  return L.join("\n") + "\n";
}

// safety gate for Gemini output entering the club: inline SVG/HTML only —
// no scripts of any kind, no external refs. Reject = null (deterministic wall
// is always the surface of record).
function sanitizeGemini(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim().replace(/^```(html|svg|xml)?/i, "").replace(/```$/,"").trim();
  const looksRight = /^<!doctype html/i.test(t) || /^<html/i.test(t) || /^<svg/i.test(t);
  if (!looksRight) return null;
  // W3C namespace URIs are mandatory in inline SVG — exempt them, then hunt
  // real network refs. \b on the handler check ("content=" is not "onload=").
  const scan = t.replace(/https?:\/\/www\.w3\.org\/[^"'\s>]*/gi, "W3C_NS");
  if (/<script|javascript:|\bon\w+\s*=|https?:\/\/|@import|<iframe|<object|<embed|<link/i.test(scan)) return null;
  return t;
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 12, 22, 0, 0);

  // bloodless world
  const empty = assembleWallData({ history: [] }, now);
  const emptyHtml = renderWall(empty, null);
  assert("bloodless wall renders honest awaiting-blood panels", emptyHtml.includes("awaiting blood"));
  assert("NEVER-FAKE — no NaN/undefined/null leaks", !/NaN|undefined|null</.test(emptyHtml));
  assert("NO-STREAK LAW — the word streak never renders", !/streak/i.test(emptyHtml));

  // full world
  const bus = {
    learning_state: {
      maidan: { stages: [{ id: "fundamentals", label: "fundamentals", status: "runnable" }, { id: "rag_pipeline", label: "rag pipeline", status: "building" }, { id: "agents", label: "agents", status: "awaiting_data" }] },
      weak_connection: "tokenization → embeddings (edge cold)",
      confusion_pairs: [{ from: "tokenization", to: "embeddings", count: 4 }],
    },
    season: { matches_played: 12, trophy_state: "unlit" },
    calibration: { status: "ok", total_reps: 47, low_confidence: false, calibration_gap: 0.14, trend: "narrowing (0.19 → 0.14)", buckets: { knew: { n: 30, accuracy: 0.9 }, shaky: { n: 12, accuracy: 0.6 }, guessed: { n: 5, accuracy: 0.4 } }, danger_zone: [{ topic: "context" }] },
    calibration_min_reps: 20,
    tape_room: { doubts_retired: 24, queue: Array(88).fill({}) },
    // FIXTURE CORRECTED (#85, 4 Aug 2026): the old rows carried no `date` at all,
    // which the producer (touchline.mjs:435) always writes — so every assertion
    // about the weekly window was exercising a schema that does not exist on disk.
    // `now` is 2026-07-12 22:00, so the 7-day window is 07-06..07-12: two worked
    // days (07-11: 24 min, 07-12: 10 min), one zero-minute day inside the window,
    // and one 999-minute row OUTSIDE it that must not leak into the total.
    history: [
      { date: "2026-07-04", wall_minutes: 999, struggle: "productive" },   // outside the 7-day window
      { date: "2026-07-09", wall_minutes: 0,   struggle: "spinning"   },   // showed up? no. counted? no.
      { date: "2026-07-11", wall_minutes: 24,  struggle: "no_data"    },   // 24 min, <6 reps — the day the OLD code threw away
      { date: "2026-07-12", wall_minutes: 10,  struggle: "productive" },
    ],
    readiness: { verdict: "GREEN", hrv: 22.7, rhr: 76.4 },
    // ts EXACTLY as brain.mjs writes it — `now.toISOString()`, UTC, with the Z.
    // E2E audit 25 Jul 2026: the old fixture was timezone-naive
    // ("2026-07-12T02:10:00"), which JS parses as LOCAL time, so it agreed with
    // the buggy UTC string-slice and hid the very bug this panel suffers from.
    // 02:10 local is the overnight call; in IST it serialises to the PREVIOUS
    // UTC day, which is precisely what used to make it disappear.
    brainLedger: [{ ts: new Date(2026, 6, 12, 2, 10, 0).toISOString(), total_tokens: 52000 }, { ts: new Date(2026, 6, 12, 13, 30, 0).toISOString(), total_tokens: 8000 }],
    vitals: { bleeds: [{ kind: "effort_uncaptured" }] },
    // FIXTURE CORRECTED (#87): drills.json carries `concepts: []` on every drill
    // (dressing-room/state/drills.json, 4 Aug) and the fixture omitted it — which
    // is exactly why the "🟣 tape_room"-with-no-subject bug survived the suite.
    drills: { drills: [{ kind: "tape_room", probe_type_emoji: "🟣", concepts: ["tokenization"], mode: "defend" }] },
    twin: { voice: null },
    kal_line: "pehla move: context Re-Jirah",
    // THE SCOUT'S DESK fixture (outward loop, 8 Aug 2026)
    missions: { missions: [
      { id: "M01", type: "audit", ingested_at: "2026-07-12T10:00:00Z" },
      { id: "M02", type: "audit", ingested_at: null },
      { id: "M03", type: "audit", ingested_at: null },
      { id: "M04", type: "audit", ingested_at: null },
    ], syllabus_audit: { closed_at: null } },
    benchmark: { status: "gated_pre_audit", gate: { missions_line: "x" } },
  };
  const data = assembleWallData(bus, now);
  const html = renderWall(data, null);
  assert("THE SCOUT'S DESK — audit progress + gated benchmark reach the wall (Ruling 5)",
    html.includes("The scout&#39;s desk") || html.includes("The scout's desk")
      ? (html.includes("full-syllabus audit 1/4 returned") && html.includes("benchmark GATED (pre-audit)"))
      : false);
  assert("THE SCOUT'S DESK — absent outward files ⇒ no panel (absence, not a zero)",
    !renderWall(assembleWallData({ history: [] }, now), null).includes("scout"));
  // 10 Aug 2026 wiring pass — the desk carried the benchmark's COUNTS from 8 Aug
  // and its NAMES never left benchmark.mjs, so the wall said where he stands and
  // never what to do next. Fails if the wire is cut again.
  const wallNeeds = renderWall(assembleWallData({ history: [], benchmark: { status: "ok",
    buckets: [{ id: "B2", counts: { locked: 1, core_total: 5 } }], regressions: [],
    needs: ["2-rag: unlock chunking, retrieval", "course: 6 chapters remain"] } }, now), null);
  assert("THE SCOUT'S DESK — the benchmark's NEED NAMES reach the wall, not only its counts",
    wallNeeds.includes("benchmark need: 2-rag: unlock chunking, retrieval · course: 6 chapters remain"));
  assert("THE SCOUT'S DESK — a benchmark with no needs[] shows no need line (absence, not a zero)",
    !renderWall(assembleWallData({ history: [], benchmark: { status: "ok", buckets: [], regressions: [] } }, now), null).includes("benchmark need"));
  // DEAD-WIRE SWEEP 11 Aug 2026 — the counts line maps over buckets[] and always did,
  // so the two lanes that ride BESIDE the five (46.7% and 44.5% of the interview by the
  // DOSSIER's own weights) reached this wall as nothing. Fails if the line is cut again.
  const wallDx = renderWall(assembleWallData({ history: [], benchmark: { status: "ok",
    buckets: [{ id: "B2", counts: { locked: 1, core_total: 5 } }], regressions: [],
    differentiators_line: "differentiators (not a 6th bucket — the #1 senior signal + the fintech moat): 6-cross-cut: locked 0/1 (rides: system_design 26.7% + production_eval 20% = 46.7% of the interview)" } }, now), null);
  assert("THE SCOUT'S DESK — the benchmark's DIFFERENTIATORS reach the wall with their interview weight, on their own line",
    wallDx.includes("differentiators (not a 6th bucket") && wallDx.includes("6-cross-cut: locked 0/1") && wallDx.includes("46.7% of the interview")
    && !/benchmark: B2 1\/5[^<]*cross-cut/.test(wallDx));
  assert("THE SCOUT'S DESK — a pre-wire benchmark (no differentiators_line) shows no differentiators line (absence, not a zero)",
    !renderWall(assembleWallData({ history: [], benchmark: { status: "ok", buckets: [], regressions: [] } }, now), null).includes("differentiators"));
  assert("Maidan pitch SVG renders with frayed pass", html.includes("<svg") && html.includes("frayed pass"));
  assert("doubts_retired + matches_played render big", html.includes(">24<") && html.includes(">12<"));
  assert("NO RAW BIOMETRICS — hrv/rhr numbers never render", !html.includes("22.7") && !html.includes("76.4"));
  assert("body strip carries verdict only", html.includes("GREEN") && html.includes("verdict only"));
  // E2E audit 25 Jul 2026: `html.includes("overnight")` could never fail —
  // renderBrain always prints the literal label — so the overnight half of this
  // check was vacuous. Assert the RENDERED COUNTS instead.
  assert("brain meter shows overnight sharpening (exact counts, not just the label)", html.includes("2 call(s) today · 1 overnight") && html.includes("60,000"));
  // REGRESSION (E2E audit 25 Jul 2026): a 03:00-local brain tick is written by
  // brain.mjs as a UTC ts whose DATE is yesterday. It must still count as
  // today's overnight sharpening. Under the old `String(l.ts).slice(0,10)`
  // filter this row was dropped and every counter read 0.
  const utcBleed = assembleWallData({ history: [], brainLedger: [{ ts: new Date(2026, 6, 12, 3, 0, 0).toISOString(), total_tokens: 1234 }] }, now);
  assert("brain ledger buckets by LOCAL day, never the raw UTC ts slice",
    utcBleed.brain.calls_today === 1 && utcBleed.brain.overnight_calls === 1 && utcBleed.brain.tokens_today === 1234);
  assert("an unparseable ts still can't fake a call into today", assembleWallData({ history: [], brainLedger: [{ ts: "garbage" }, {}] }, now).brain.calls_today === 0);
  assert("KAL-line front and center", html.includes("pehla move: context Re-Jirah"));
  assert("wall trend weekly-only wording", html.includes("wall-minutes this week") && html.includes("never a daily meter"));

  // === #88 — THE OVERNIGHT WINDOW MUST CROSS MIDNIGHT ======================
  // The old bucket filtered to today's local day FIRST, so the `h >= 22` clause
  // was unreachable for last night — and 22:00-23:59 is the busiest band in the
  // real ledger (987 of 2,833 rows). Every pre-existing overnight fixture was
  // post-midnight only (02:10, 03:00), which is why the suite never saw it.
  const nightBus = { history: [], brain_overnight: { start: "22:00", end: "07:30" }, brainLedger: [
    { ts: new Date(2026, 6, 11, 23, 0, 0).toISOString(), total_tokens: 5000 },   // LAST NIGHT 23:00 — the row the old code could never see
    { ts: new Date(2026, 6, 12, 3, 0, 0).toISOString(),  total_tokens: 3000 },   // last night, after midnight
    { ts: new Date(2026, 6, 12, 13, 0, 0).toISOString(), total_tokens: 100 },    // daytime
    { ts: new Date(2026, 6, 12, 22, 30, 0).toISOString(), total_tokens: 700 },   // TONIGHT — not slept through yet
  ] };
  const night = assembleWallData(nightBus, now).brain;
  assert("#88 last night's 22:00-23:59 now reaches the morning wall (2 overnight, not 1)", night.overnight_calls === 2);
  assert("#88 overnight tokens span the midnight boundary (5000+3000)", night.overnight_tokens === 8000);
  // the PM wall (22:00) used to label the evening's OWN calls as work done while
  // he slept — before he had slept. Tonight's 22:30 row must count as ZERO here.
  assert("#88 TONIGHT's 22:30 call is NOT reported as 'while you slept'",
    assembleWallData({ history: [], brain_overnight: { start: "22:00", end: "07:30" },
      brainLedger: [{ ts: new Date(2026, 6, 12, 22, 30, 0).toISOString(), total_tokens: 700 }] }, now).brain.overnight_calls === 0);
  assert("#88 calendar-day counters stay calendar-day (3 today, last night's 23:00 excluded)", night.calls_today === 3);
  assert("#88 the window is named on the surface, so the number is checkable",
    night.overnight_window === "22:00→07:30" && renderWall(assembleWallData(nightBus, now), null).includes("22:00→07:30"));
  assert("#88 the window comes from brain_config, and says so when it does not",
    assembleWallData({ history: [] }, now).brain.overnight_window_source.startsWith("fallback"));

  // === #85 — WEEKLY CONSISTENCY: 7 CALENDAR DAYS, wall_minutes > 0 =========
  // Window 2026-07-06..07-12. Worked days in the fixture: 07-11 (24 min) and
  // 07-12 (10 min) = 2/7 = 29%. The OLD code returned 100% here (3 of the 4 rows
  // carry a non-no_data struggle over a 4-row denominator) — a number invented by
  // a denominator that silently dropped the days he never showed up.
  assert("#85 consistency is worked-days over a REAL 7-day window (2/7 = 29%)",
    data.season.weekly_consistency_pct === 29 && data.season.weekly_consistency_days === 2 && data.season.weekly_consistency_window === 7);
  assert("#85 a day with NO row stays in the denominator (7, not the 4 rows present)",
    weeklyConsistency(bus.history, now).days === 7);
  assert("#85 a SPINNING day still counts if he showed up (no streak-shaming law)",
    weeklyConsistency([{ date: "2026-07-12", wall_minutes: 40, struggle: "spinning" }], now).worked === 1);
  assert("#85 a <6-rep 'no_data' day with real minutes COUNTS (the 60-min days the old code threw away)",
    weeklyConsistency([{ date: "2026-07-12", wall_minutes: 60, struggle: "no_data" }], now).worked === 1);
  assert("#85 a zero-minute day does NOT count, whatever its struggle verdict",
    weeklyConsistency([{ date: "2026-07-12", wall_minutes: 0, struggle: "productive" }], now).worked === 0);
  assert("#85 an UNDATED history measures nothing and renders '—', never 0%",
    weeklyConsistency([{ wall_minutes: 30 }], now).pct === null
    && renderWall(assembleWallData({ ...bus, history: [{ wall_minutes: 30 }] }, now), null).includes(">—</span>"));
  assert("#85 the wall trend shares the same 7-day window (34 min, not the 1033 of all rows)",
    data.wall_week_minutes === 34);
  assert("#85 the percentage carries its denominator on the wall (have/need, #106)",
    html.includes("2/7 days you showed up"));

  // NOW strip (captain's call) + living refresh
  const nowData = assembleWallData({ ...bus, pitch_read: { date: "2026-07-12", struggle: { verdict: "productive" } }, timeaudit: { buckets: { Learning: { minutes: 95 }, Building: { minutes: 40 } } }, repsToday: 7 }, now);
  const nowHtml = renderWall(nowData, null);
  assert("NOW strip renders odometers + forge-framed verdict", nowHtml.includes("reps today") && nowHtml.includes(">7<") && nowHtml.includes("the forge is working"));
  assert("NOW strip has no quota/target bars (odometers only)", !/target|quota|%\s*of/i.test(nowHtml.split("Right now")[1].split("</section>")[0]));
  assert("wall is LIVING — meta refresh present", nowHtml.includes('http-equiv="refresh"'));

  // RED-day minimal wall
  const redData = assembleWallData({ ...bus, readiness: { verdict: "RED" } }, now);
  const redHtml = renderWall(redData, null);
  assert("RED wall = KAL-line + floor only", redHtml.includes("Rotation day") && !redHtml.includes("Calibration"));
  assert("RED wall hides the wall trend entirely", !redHtml.includes("wall-minutes"));
  assert("RED wall hides the NOW strip too (never a loss before he looks)", !redHtml.includes("Right now"));

  // insights validation
  assert("insight with real numbers passes", validateInsights("24 doubts retired and the gap sits at 0.14 — the book is honest.", data) !== null);
  assert("insight with INVENTED number rejected (omitted)", validateInsights("Your recall jumped 97% this week.", data) === null);
  // STRENGTHENED (4 Aug 2026): the old fixture was "on a 10x trajectory", whose
  // "10" the number gate now catches on its own — so the assertion passed without
  // ever exercising the hype guard. A digit-free hype phrase tests what it claims.
  assert("hype in insights rejected", validateInsights("You are on an exponential trajectory.", data) === null);
  assert("...and the rejection NAMES the hype phrase, not a generic failure",
    readInsights("You are on an exponential trajectory.", data).reason.includes("exponential"));
  assert("insights capped at 3 lines", (validateInsights("a\nb\nc\nd", data) || []).length <= 3);

  // === KAAM 1 (10 Aug 2026) — WHY "The read" WAS DEAD EVERY NIGHT ===========
  // Two defects, one panel. Each is asserted on its own so a future pass cannot
  // ship half of it and claim the panel is back.
  // (1) THE MODEL'S OWN FURNITURE. Reproduced exactly as measured on the night
  //     of 9 Aug: a dated title line ate slot 1 of 3, the third real bullet was
  //     sliced off unread, and the title's own "09" was the ONLY token that
  //     failed the gate — so furniture killed three good sentences.
  const FURNITURE = "## 09 AUGUST 2026\n24 doubts retired.\nthe gap sits at 0.14.\nthe book is honest.";
  assert("KAAM1 — a self-dated title line no longer eats a slot NOR kills the panel (all three real bullets survive)",
    (validateInsights(FURNITURE, data) || []).length === 3
    && !(validateInsights(FURNITURE, data) || []).some(l => /AUGUST/.test(l)));
  assert("KAAM1 — the frozen behaviour is pinned: WITHOUT the furniture filter that same file dies on its own header",
    readInsights("## 09 AUGUST 2026\n24 doubts retired.\nthe gap sits at 0.14.", data, "").rejected === false
    && (() => { const l = "## 09 AUGUST 2026".trim(); return isFurniture(l); })());
  assert("KAAM1 — the filter is CONSERVATIVE: a real lowercase sentence carrying a date is never furniture",
    !isFurniture("on 2026-08-04 the gap sits at 0.14 and the book is honest")
    && isFurniture("### The read") && isFurniture("-----") && !isFurniture("HE HELD IT COLD THIS WEEK AND THE CALIBRATION BOOK FINALLY AGREES WITH HIM"));
  // THE REAL ARTEFACT, byte for byte off disk on 10 Aug 2026. This is the fixture
  // that matters: the audit note's guessed shape (`## 09 AUGUST 2026`) passed the
  // filter above while the LIVE file sailed through untouched and the panel stayed
  // dead. Pinned here so the filter can never again be right about a shape the
  // organism does not actually produce.
  assert("KAAM1 — THE LIVE 10 AUG TITLE is furniture: a whole-line BOLD span, not a heading, with lowercase in it",
    isFurniture("**Wall Insights — 2026-08-09**")
    && !isFurniture("- Reps sit at 17 of 20 needed before calibration reads as anything but \"warming_up\" — thin data."));
  assert("KAAM1 — the bullet marker is stripped for display but NEVER used to drop the line",
    stripBullet("- The weak link is still the frayed pass.") === "The weak link is still the frayed pass."
    && stripBullet("1. a numbered one") === "a numbered one" && stripBullet("no marker here") === "no marker here");
  assert("KAAM1 — a bold-wrapped SENTENCE is not furniture (emphasis is not a title)",
    !isFurniture("**he held it cold this week, and that is the whole story.**"));

  // (2) THE ALLOWED-SET SNAPSHOT — the half that actually matters. The other 3
  //     of 4 measured deaths were a derived count and a quoted session date,
  //     neither of which the furniture filter touches. A number the brain was
  //     HANDED in its prompt is legal where it was written; without the snapshot
  //     it is "invented" where it is read, on the same bytes, hours later.
  const HANDED = "he sat 47 minutes on it.";
  assert("KAAM1 — a number the brain was handed in its prompt is REJECTED by the wall with no snapshot (the defect, pinned)",
    readInsights(HANDED, { matchday: 7 }, "").rejected === true);
  assert("KAAM1 — ...and PASSES once the wall judges by the producer's own recorded set",
    (validateInsights(HANDED, { matchday: 7 }, ["47"].join(" ")) || []).length === 1);
  assert("KAAM1 — the snapshot is not a loosening: a genuinely invented number still bounces WITH a snapshot present",
    readInsights("he sat 47 minutes and retired 97 doubts.", { matchday: 7 }, ["47"].join(" ")).rejected === true);
  assert("KAAM1 — an ABSENT snapshot fails CLOSED (old behaviour, strict), never open",
    readInsights(HANDED, { matchday: 7 }, "").rejected === true);

  // === KAAM 1 — THE BODY PANEL KNOWS ITS OWN AGE ===========================
  const bodyToday = assembleWallData({ ...bus, readiness: { verdict: "AMBER", day: localDate(now) } }, now);
  const bodyStale = assembleWallData({ ...bus, readiness: { verdict: "AMBER", day: "2026-08-04" } }, new Date("2026-08-10T12:00:00+05:30"));
  const bodyNone = assembleWallData({ ...bus, readiness: null }, now);
  assert("KAAM1 — a same-day reading is age 0 and the panel does not cry stale",
    bodyToday.body.age_days === 0 && !renderBody(bodyToday).includes("not today's body"));
  assert("KAAM1 — THE 10 AUG DEFECT: a 4 Aug reading read on 10 Aug is 6 days old and SAYS SO on the wall",
    bodyStale.body.age_days === 6 && renderBody(bodyStale).includes("2026-08-04")
    && renderBody(bodyStale).includes("6 day(s) old") && renderBody(bodyStale).includes("not today's body"));
  assert("KAAM1 — the verdict is still SHOWN when stale (hiding it trades one silent lie for another)",
    renderBody(bodyStale).includes("AMBER"));
  assert("KAAM1 — no reading at all names the GREEN as a DEFAULT, never as a measurement",
    bodyNone.body.present === false && bodyNone.verdict === "GREEN"
    && renderBody(bodyNone).includes("not a measurement"));
  assert("KAAM1 — the panel still leaks no biometric: only verdict, day and age ever reach data.body",
    Object.keys(bodyStale.body).sort().join(",") === "age_days,day,present,verdict");

  // === KAAM 1 — PROVENANCE, on the three MODEL-AUTHORED artefacts only =======
  const PROV = { made_by: "maidan_poster (brain, model-authored)", made_at: "2026-08-09T21:30:00.000Z", for_morning: "2026-08-10" };
  assert("KAAM1 — a provenance line names the maker, the make-time AND the morning it is for",
    /maidan_poster/.test(provLine(PROV)) && /2026-08-09 21:30/.test(provLine(PROV)) && /for the morning of 2026-08-10/.test(provLine(PROV)));
  assert("KAAM1 — an artefact with NO record says so; it never invents a date to fill the gap",
    /provenance unrecorded/.test(provLine(null)) && !/\d{4}-\d{2}-\d{2}/.test(provLine(null)));
  {
    const written = {};
    const p = writeProvenance((f, t) => { written[f] = t; }, "DIR", "poster.svg", "maidan_poster (brain, model-authored)", "2026-08-10", new Date("2026-08-09T21:30:00Z"));
    const rec = JSON.parse(written[join("DIR", "poster.svg.prov.json")]);
    assert("KAAM1 — the record is written BY CODE beside the artefact, carrying all three fields",
      rec.artefact === "poster.svg" && rec.for_morning === "2026-08-10"
      && rec.made_at === "2026-08-09T21:30:00.000Z" && /model-authored/.test(rec.made_by) && p.for_morning === "2026-08-10");
  }
  {
    const withProv = renderWall(assembleWallData({ ...bus, media: { poster: true, poster_prov: PROV } }, now), null);
    const noProv = renderWall(assembleWallData({ ...bus, media: { poster: true } }, now), null);
    assert("KAAM1 — the poster caption reads the RECORD, not the filename",
      withProv.includes("for the morning of 2026-08-10") && withProv.includes("maidan_poster"));
    assert("KAAM1 — an artefact written before this pass renders exactly as it did (no regression, no fake stamp)",
      noProv.includes("today's poster") && !noProv.includes("provenance unrecorded"));
    const gem = renderWall(assembleWallData({ ...bus, media: { gemini_render: true, gemini_render_date: "2026-08-10", gemini_prov: { ...PROV, for_morning: "2026-08-09" } } }, now), null);
    assert("KAAM1 — THE W7 DEFECT: the render button stops saying 'today' off the filename and says the morning the file is actually for",
      gem.includes("the Gemini render · 2026-08-09") && !gem.includes("the Gemini render · 2026-08-10"));
  }
  assert("KAAM1 — the read panel carries its own provenance, derived from the snapshot (one record, one writer)",
    renderWall({ ...assembleWallData(bus, now), insight_prov: { made_by: "wall_insights (brain, model-authored)", made_at: "2026-08-10T02:00:00.000Z", for_morning: "2026-08-10" } },
      { lines: ["the book is honest."], rejected: false }).includes("wall_insights (brain, model-authored)"));

  // === #59/#60 — ONE VALIDATOR, AND A VISIBLE REJECTION ====================
  // The frozen legacy whitelist is kept as the witness; these two assertions are
  // what it USED to do, so a re-introduction can never pass silently.
  assert("#59 the frozen legacy whitelist really did allow every integer 0-31",
    allowedNumbersLegacy({ x: 1 }).has("12") && allowedNumbersLegacy({ x: 1 }).has("31"));
  assert("#59 the live validator does NOT — an invented 'cards due: 12' bounces",
    validateInsights("cards due: 12 (+9 overdue)", { matchday: 7 }) === null);
  assert("#59 an INVENTED deadline bounces (dates are no longer blanket-stripped)",
    validateInsights("we ship by 2026-08-01", { matchday: 7 }) === null);
  assert("#59 an INVENTED clock time bounces (times are no longer blanket-stripped)",
    validateInsights("lights out by 22:45", { matchday: 7 }) === null);
  assert("#60 a comma-grouped thousand is ONE number and no longer bounces on '000'",
    validateInsights("the brain metabolized 60,000 tokens", data) !== null);
  // the rejection is a SURFACE, not a silence: a hallucinating night and a night
  // the brain never ran used to render the identical blank shelf.
  const rejected = readInsights("Your recall jumped 97% this week.", data);
  assert("#59 a rejection is reported, named, and carries the invented token",
    rejected.rejected === true && rejected.lines === null && rejected.reason === "invented number 97");
  const rejHtml = renderWall(data, rejected);
  assert("#59 the wall SHOWS the rejection instead of losing the panel",
    rejHtml.includes("held at the gate") && rejHtml.includes("invented number 97"));
  assert("#59 a genuinely absent read still renders no shelf at all (silence ≠ rejection)",
    !renderWall(data, readInsights("", data)).includes("held at the gate") && !renderWall(data, readInsights("", data)).includes("The read"));
  assert("#59 the legacy array contract still renders the accepted read",
    renderWall(data, ["24 doubts retired"]).includes("24 doubts retired"));

  // GEMINI LANE
  const pack = promptPack(data);
  assert("prompt pack: four prompts auto-written", Object.keys(pack).length === 4 && pack["wall_painter.md"].includes("frayed pass"));
  assert("voice brief speaks his day (KAL + counters + spoken rules)", pack["voice_brief.md"].includes("pehla move: context Re-Jirah") && pack["voice_brief.md"].includes("24 doubts retired") && pack["voice_brief.md"].includes("spoken register"));
  assert("voice brief carries no hype/streak/countdown", !/10x|exponential|streak|days left/i.test(pack["voice_brief.md"]));
  const packNoted = promptPack(data, "1. The derby table drowned the Maidan — shrink it.\n2. More whitespace at the top.");
  assert("CLAUDE↔GEMINI LOOP — render notes feed the next night's prompt", packNoted["wall_painter.md"].includes("RENDER NOTES") && packNoted["wall_painter.md"].includes("derby table drowned"));
  assert("no notes → clean prompt (no empty section)", !pack["wall_painter.md"].includes("RENDER NOTES"));
  assert("prompt pack embeds the real numbers", pack["match_poster.md"].includes('"doubts_retired": 24'));
  assert("visual prompts carry the render laws", ["wall_painter.md", "match_poster.md", "season_film.md"].every(k => pack[k].includes("invent nothing") && pack[k].includes("#0c0e13")));
  assert("render laws forbid external refs (sanitizer-reject loop closed)", ["wall_painter.md", "match_poster.md"].every(k => pack[k].includes("SELF-CONTAINED") && pack[k].includes("no @import")));
  assert("sanitizer accepts clean inline SVG", sanitizeGemini("<svg viewBox='0 0 10 10'><rect/></svg>") !== null);
  assert("sanitizer allows the W3C svg namespace (not a network ref)", sanitizeGemini('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>') !== null);
  assert("sanitizer allows content= (no false handler match)", sanitizeGemini('<html><meta name="viewport" content="width=device-width"><body>x</body></html>') !== null);
  assert("sanitizer strips code fences", sanitizeGemini("```html\n<html><body>ok</body></html>\n```") !== null);
  assert("sanitizer rejects scripts", sanitizeGemini("<html><script>alert(1)</script></html>") === null);
  assert("sanitizer rejects external refs", sanitizeGemini("<svg><image href='https://x.test/a.png'/></svg>") === null);
  assert("sanitizer rejects event handlers", sanitizeGemini("<svg onload=alert(1)></svg>") === null);
  assert("sanitizer rejects non-artifacts", sanitizeGemini("Here is your dashboard, captain!") === null);

  // MEDIA ENGINE — the club's channel
  const mediaData = assembleWallData({ ...bus, media: { teamtalk_am: true, teamtalk_pm: false, poster: true, filmkit: true } }, now);
  const mediaHtml = renderWall(mediaData, null);
  assert("MEDIA panel: team talk playable + poster + film kit links", mediaHtml.includes("<audio") && mediaHtml.includes("teamtalk_2026-07-12_am.mp3") && mediaHtml.includes("poster.svg") && mediaHtml.includes("filmkit_2026-07-12.md"));
  // LAW UPDATED (captain, 17 Jul): an empty shelf EXPLAINS itself (who stocks
  // it, when) — a vanished panel reads as broken. RED-day hiding still wins.
  assert("MEDIA shelf: empty state says the night shift stocks it (never a dead shell)", renderWall(assembleWallData(bus, now), null).includes("night shift stocks"));
  assert("MEDIA panel hidden on RED (minimal wall law wins)", !renderWall(assembleWallData({ ...bus, readiness: { verdict: "RED" }, media: { teamtalk_am: true } }, now), null).includes("<audio"));
  // REGRESSION (E2E audit 25 Jul 2026): the poster flag used to read
  // `posterOk || exists(club/poster.svg)` — an undated file nothing cleans up —
  // so last week's poster kept rendering under the caption "today's poster".
  // The flag now rides only on a date-stamped twin. Fake fs, no disk touched.
  const staleUndatedOnly = (p) => /poster\.svg$/.test(p);                    // yesterday's file still lying around
  const datedTwinToo     = (p) => staleUndatedOnly(p) || p.endsWith(`poster_2026-07-12.svg`);
  assert("a stale undated poster.svg no longer counts as today's poster", posterFlag(false, staleUndatedOnly, CLUB_DIR, "2026-07-12") === false);
  assert("a poster stamped with today's date does count", posterFlag(false, datedTwinToo, CLUB_DIR, "2026-07-12") === true);
  assert("today's freshly-sanitized poster counts even before the stamp lands", posterFlag(true, () => false, CLUB_DIR, "2026-07-12") === true);
  const kit = buildFilmKit(mediaData, { moments: [{ date: "2026-07-10", line: "the Tuesday you thought you'd break and didn't", result: "HIT" }] });
  assert("film kit: NotebookLM source doc in true numbers", kit.includes("Video Overview") && kit.includes("Doubts retired: 24") && kit.includes("Matches played: 12"));
  assert("film kit folds real notebook moments", kit.includes("the Tuesday you thought"));
  assert("film kit carries the tone laws, zero hype", kit.includes("kal phir") && !/10x|exponential|on steroids|countdown to/i.test(kit));

  // === #86 — THE GEMINI RENDER NEEDS THE SAME FRESHNESS GATE AS THE POSTER ==
  const staleGeminiOnly = (p) => /wall_gemini\.html$/.test(p);                 // the 21 Jul file nothing unlinks
  const geminiTwinToo   = (p) => staleGeminiOnly(p) || p.endsWith(`wall_gemini_2026-07-12.html`);
  assert("#86 a stale undated wall_gemini.html no longer lights the button",
    geminiFlag(false, staleGeminiOnly, CLUB_DIR, "2026-07-12") === false);
  assert("#86 a render stamped with today's date does light it",
    geminiFlag(false, geminiTwinToo, CLUB_DIR, "2026-07-12") === true);
  assert("#86 tonight's fresh fold counts even before the stamp is re-read",
    geminiFlag(true, () => false, CLUB_DIR, "2026-07-12") === true);
  assert("#86 the button prints the date, so an undated link can never render again",
    renderWall(assembleWallData({ ...bus, media: { gemini_render: true, gemini_render_date: "2026-07-12" } }, now), null).includes("the Gemini render · 2026-07-12"));

  // === #84 — THE SEASON PANEL FINALLY HAS AN AWAITING-BLOOD BRANCH ==========
  // season.json has never been written; the panel used to print "0 matches
  // played · 🔒 the cabinet unlit" in counted-number weight, and viz.mjs:89-90
  // gave a reader no way to tell an absent ledger from a measured zero.
  const noSeason = assembleWallData({ ...bus, season: null }, now);
  assert("#84 absent ≠ zero is now IN THE DATA (ledger_open false)", noSeason.season.ledger_open === false && data.season.ledger_open === true);
  const noSeasonHtml = renderWall(noSeason, null);
  // scoped to the Season SECTION — the NOW strip legitimately renders a 0 for a
  // measured, un-started day, and that zero is honest.
  const seasonPanel = (h) => h.split(">Season<")[1].split("</section>")[0];
  assert("#84 the wall says the ledger has not opened instead of asserting 0 matches",
    noSeasonHtml.includes("ledger opens at your first full-time") && !seasonPanel(noSeasonHtml).includes(">0</span>"));
  assert("#84 the cabinet is 'unknown', never a locked padlock it did not measure",
    noSeasonHtml.includes("unknown until the ledger opens") && !noSeasonHtml.includes("🔒"));
  assert("#84 measured siblings KEEP their address (doubts retired still renders)",
    noSeasonHtml.includes(">24<") && noSeasonHtml.includes("doubts retired"));
  const blindBus = { ...bus, season: null, tape_room: null, history: [] };
  assert("#84 with every season source dark, the panel takes the sibling awaiting() treatment",
    renderWall(assembleWallData(blindBus, now), null).includes("the season ledger opens with your first full-time"));
  assert("#84 an absent tape room is not a measured zero either",
    assembleWallData(blindBus, now).tape_open === false
    && renderWall(assembleWallData({ ...bus, tape_room: null }, now), null).includes("the tape room has not opened"));
  const blindKit = buildFilmKit(assembleWallData(blindBus, now), null);
  assert("#84 the film kit refuses to narrate an unopened ledger as zero",
    blindKit.includes("Do not narrate this as zero") && !blindKit.includes("Matches played: 0"));
  assert("#84 the spoken brief refuses too",
    promptPack(assembleWallData(blindBus, now))["voice_brief.md"].includes("the ledger has not opened yet"));

  // === #87 — THE DRILL PACKET REACHES THE WALL WITH ITS CONCEPTS ============
  assert("#87 concepts survive assembly (they used to be dropped at viz.mjs:106)",
    data.drills_tomorrow[0].concepts.length === 1 && data.drills_tomorrow[0].concepts[0] === "tokenization");
  assert("#87 the wall renders the SUBJECT, not the bare '🟣 tape_room'",
    html.includes("tape_room — <span") && html.includes("tokenization"));
  assert("#87 a packet that really does arrive empty SAYS so (never a silent blank)",
    renderWall(assembleWallData({ ...bus, drills: { drills: [{ kind: "recall", probe_type_emoji: "🔵" }] } }, now), null).includes("no concept named"));
  assert("#87 the spoken brief names the concept too",
    pack["voice_brief.md"].includes("tape_room on tokenization"));

  // === #89 — THE ONE-CLICK LANES REPORT WHAT THEY ACTUALLY DID ==============
  const shipHtml = renderMedia(mediaData);
  assert("#89 window.open stays SYNCHRONOUS inside the click (popup blockers)",
    /function ship\(t,u\)\{\s*var w=window\.open\(u,'_blank'\);/.test(shipHtml));
  assert("#89 the async clipboard write now has a .catch (a Promise rejection can't be caught by try/catch)",
    shipHtml.includes(".catch(function(e){") && shipHtml.includes("copy FAILED"));
  assert("#89 a blocked popup and a missing clipboard API are BOTH reported",
    shipHtml.includes("blocked the new tab") && shipHtml.includes("no clipboard API"));
  assert("#89 there is a place on the page for the report to land",
    shipHtml.includes('id="shipnote"'));
  assert("#89 the labels no longer PROMISE a copy that has not resolved yet",
    !shipHtml.includes("already copied") && shipHtml.includes("+ copies the source"));

  // === #106 — HAVE/NEED COUNTERS INSTEAD OF STATUS WORDS ====================
  // calibration.mjs writes status "warming_up" below min_reps; the wall used to
  // gate on status === "ok" and throw a real 9-rep measurement away.
  const warmBus = { ...bus, calibration: { status: "warming_up", low_confidence: true, total_reps: 9, calibration_gap: 0.2111, trend: "establishing baseline (9 reps)", buckets: { knew: { n: 2, accuracy: 1 }, shaky: { n: 2, accuracy: 0.5 }, guessed: { n: 5, accuracy: 0 } }, danger_zone: [] }, calibration_min_reps: 20 };
  const warm = assembleWallData(warmBus, now);
  assert("#106 calibration speaks from rep 1 — a warming_up book is no longer thrown away",
    warm.calibration !== null && warm.calibration.reps_have === 9 && warm.calibration.reps_need === 20);
  const warmHtml = renderWall(warm, null);
  assert("#106 the panel prints have/need, not the word 'warming_up'",
    warmHtml.includes("reading from 9 rep(s) of the 20 this book wants") && !warmHtml.includes("warming_up"));
  assert("#106 ...and says plainly what 9 reps does not yet license",
    warmHtml.includes("a direction, not a verdict") && warmHtml.includes("0.2111"));
  assert("#106 the 'need' is READ from calibration_config, never invented when absent",
    assembleWallData({ ...warmBus, calibration_min_reps: null }, now).calibration.reps_need === null
    && renderWall(assembleWallData({ ...warmBus, calibration_min_reps: null }, now), null).includes("threshold is unreadable"));
  assert("#106 a book with zero reps still degrades to awaiting-blood, not to a fake gap",
    assembleWallData({ ...bus, calibration: { status: "awaiting_data", buckets: { knew: { n: 0, accuracy: null } }, total_reps: 0 } }, now).calibration === null);

  // === #51 (reader side) — BOUNDED, ROLL-TOLERANT, HONEST ABOUT COVERAGE ====
  // No disk is touched: readLinesSince is exercised against the repo's own state
  // dir, which is read-only from here.
  const ledgerPath = join(STATE_DIR, "brain_ledger.jsonl");
  if (existsSync(ledgerPath)) {
    const win = overnightWindow(new Date(), null);
    const r = readLinesSince(ledgerPath, win.start.getTime());
    assert("#51 the ledger read is BOUNDED (bytes_read ≤ bytes_total, and it says both)",
      r.bytes_read <= r.bytes_total && r.bytes_total > 0);
    assert("#51 every row returned really is inside the window (no pre-window leakage)",
      r.rows.every(x => Date.parse(x.ts) >= win.start.getTime()));
    assert("#51 coverage is REPORTED, never assumed — the reason is always a sentence",
      typeof r.covered === "boolean" && typeof r.reason === "string" && r.reason.length > 0);
  } else {
    assert("#51 an absent ledger reports absence, it does not throw or fake a zero",
      readLinesSince(ledgerPath, 0).reason === "file absent");
  }
  assert("#51 an absent file is absence, not an empty measurement",
    readLinesSince(join(STATE_DIR, "__no_such_ledger__.jsonl"), 0).covered === false);
  assert("#51 uncovered coverage reaches the surface as a warning, never as a silent total",
    renderWall(assembleWallData({ ...bus, ledger_coverage: { covered: false, reason: "live file starts inside the window" } }, now), null).includes("could not reach back past the window start"));

  // === #90 — wall_data.json MUST NOT EMBED A COPY OF ITSELF =================
  // main() writes WALL_DATA before attaching the blobs; this asserts the property
  // that ordering exists to guarantee, on the same object main() serialises.
  const persisted = assembleWallData(bus, now);
  const persistedJson = JSON.stringify(persisted);
  assert("#90 the persisted snapshot carries no veo_text/filmkit_text self-copy",
    !persistedJson.includes("veo_text") && !persistedJson.includes("filmkit_text"));
  assert("#90 ...and therefore no nested second copy of its own numbers",
    (persistedJson.match(/"doubts_retired"/g) || []).length === 1);
  const withBlobs = assembleWallData({ ...bus, media: { poster: true } }, now);
  withBlobs.media.filmkit_text = kit; withBlobs.media.veo_text = pack["season_film.md"];
  assert("#90 the WALL still receives the blobs it needs (same object, after the write)",
    renderMedia(withBlobs).includes("const KIT=") && renderMedia(withBlobs).includes("const VEO="));

  // COMMITMENTS VIEW (U4) — kal-lines, kept; no shame ever
  const cData = assembleWallData({ ...bus, commitments: [
    { date: "2026-07-09", kal: "pehla move: parser test", next_result: "HIT" },
    { date: "2026-07-10", kal: "context Re-Jirah first", next_result: "MISS" },
    { date: "2026-07-11", kal: "one green ball at 09:00", next_result: null },
  ] }, now);
  const cHtml = renderWall(cData, null);
  assert("commitments panel: his words + won-day tick", cHtml.includes("Commitments") && cHtml.includes("parser test") && cHtml.includes("✓"));
  assert("NO-SHAME — a missed kal-line reads 'went again', never failure", cHtml.includes("went again") && !/fail|broke your|streak/i.test(cHtml.split("Commitments")[1].split("</section>")[0]));
  assert("newest commitment waits unjudged", cHtml.split("Commitments")[1].split("</section>")[0].includes("·"));
  assert("no commitments → no panel", !renderWall(assembleWallData(bus, now), null).includes("Commitments"));

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
  const today = localDate(now);
  // KAL-line from yesterday's post-match (the sheet's first-touch law, on the wall too)
  let kal = null;
  for (let i = 0; i <= 1; i++) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "post_match", d + ".md");
    if (existsSync(p)) { const m = readFileSync(p, "utf8").match(/KAL-?LINE\s*→\s*(.+)/i); if (m) { kal = m[1].trim(); break; } }
  }
  // CONFIG READS (read-only, single-writer law intact). Two numbers this file
  // needs but must never invent: the night-shift window and the calibration
  // confidence threshold. Both are read from the organs that own them.
  const brainCfg = readJson(join(STATE_DIR, "brain_config.json"));
  const calCfg   = readJson(join(STATE_DIR, "calibration_config.json"));
  // #88/#51: the ledger window starts at the overnight window's own start, so ONE
  // bounded read serves both the calendar-day counters and the midnight-crossing
  // overnight bucket.
  const ow = overnightWindow(now, brainCfg && brainCfg.overnight);
  const ledger = readLinesSince(join(STATE_DIR, "brain_ledger.jsonl"), ow.start.getTime());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const reps = readLinesSince(join(STATE_DIR, "reps_log.jsonl"), startOfToday);
  const bus = {
    learning_state: readJson(join(STATE_DIR, "learning_state.json")),
    season: readJson(join(STATE_DIR, "season.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    calibration_min_reps: calCfg && typeof calCfg.min_reps === "number" ? calCfg.min_reps : null,   // #106 — the "need", read not guessed
    tape_room: readJson(join(STATE_DIR, "tape_room.json")),
    // pitch_read_history.jsonl is one row per day and 1,797 bytes on 4 Aug — the
    // whole-file read is the right tool and the 7-day window is applied in
    // weeklyConsistency(). It gets the bounded reader the day it needs one.
    history: readLines(join(STATE_DIR, "pitch_read_history.jsonl")),
    readiness: readJson(join(STATE_DIR, "readiness.json")),
    brain_overnight: brainCfg && brainCfg.overnight ? brainCfg.overnight : null,
    brainLedger: ledger.rows,                                   // #51 — tail-bounded, roll-tolerant
    ledger_coverage: { covered: ledger.covered, reason: ledger.reason, rows: ledger.rows.length, bytes_read: ledger.bytes_read, bytes_total: ledger.bytes_total, files: ledger.files },
    vitals: readJson(join(STATE_DIR, "loop_vitals.json")),
    drills: readJson(join(STATE_DIR, "drills.json")),
    twin: readJson(join(STATE_DIR, "twin.json")),
    kal_line: kal,
    pitch_read: readJson(join(STATE_DIR, "pitch_read.json")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    repsToday: reps.rows.filter(r => tsLocalDay(r.ts) === today).length,   // local day, not the UTC slice (E2E audit 25 Jul 2026)
    // the outward loop (8 Aug 2026) — scout.mjs owns missions.json, benchmark.mjs owns benchmark.json
    missions: readJson(join(STATE_DIR, "missions.json")),
    benchmark: readJson(join(STATE_DIR, "benchmark.json")),
  };
  // COMMITMENTS (U4): last week of kal-lines + what the next day said
  const commitments = [];
  for (let i = 7; i >= 0; i--) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "post_match", d + ".md");
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    const km = txt.match(/KAL-?LINE\s*→\s*(.+)/i);
    if (!km) continue;
    const np = join(STATE_DIR, "post_match", localDate(new Date(now.getTime() - (i - 1) * 86400000)) + ".md");
    let next_result = null;
    if (i > 0 && existsSync(np)) { const rm = readFileSync(np, "utf8").match(/RESULT:\s*(LOAD-MANAGED|HIT|MISS|PARTIAL)/i); if (rm) next_result = rm[1].toUpperCase(); }
    commitments.push({ date: d, kal: km[1].trim(), next_result });
  }
  bus.commitments = commitments;
  // MEDIA ENGINE: poster fold (through the sanitizer, always) + film kit + presence flags
  let posterOk = false;
  const posterPath = join(STATE_DIR, "brain_out", "poster", today + ".md");
  if (existsSync(posterPath)) {
    const cleanPoster = sanitizeGemini(readFileSync(posterPath, "utf8"));
    // served path + a date-stamped twin: the twin is the PROOF that today's
    // poster exists (E2E audit 25 Jul 2026 — see posterFlag).
    if (cleanPoster && /^<svg/i.test(cleanPoster)) {
      writeAtomic(join(CLUB_DIR, "poster.svg"), cleanPoster);
      writeAtomic(join(CLUB_DIR, `poster_${today}.svg`), cleanPoster);
      // KAAM 1 — stamped by CODE, in the same breath as the write, so the record
      // cannot disagree with the file it describes. `maidan_poster (brain, model)`
      // names the author honestly: the SVG is the model's, the stamp is not.
      writeProvenance(writeAtomic, CLUB_DIR, "poster.svg", "maidan_poster (brain, model-authored)", today, now);
      posterOk = true;
    }
  }
  bus.media = {
    teamtalk_am: existsSync(join(CLUB_DIR, "media", `teamtalk_${today}_am.mp3`)),
    teamtalk_pm: existsSync(join(CLUB_DIR, "media", `teamtalk_${today}_pm.mp3`)),
    poster: posterFlag(posterOk, existsSync, CLUB_DIR, today),
    filmkit: true,   // written below, every render
  };
  const data = assembleWallData(bus, now);
  // film kit: club copy + Drive copy (one-click NotebookLM lane; G: optional)
  const kit = buildFilmKit(data, readJson(join(STATE_DIR, "notebook.json")));
  writeAtomic(join(CLUB_DIR, `filmkit_${today}.md`), kit);
  try {
    const gdir = "G:\\My Drive\\arsenal";
    // writeAtomic, not a bare writeFileSync (E2E audit 25 Jul 2026): every other
    // output in this file is tmp+rename, and this one is read by an EXTERNAL
    // process — Drive's sync uploader / a NotebookLM ingest — which can open the
    // file mid-write and ship a truncated source. Same tmp+rename discipline.
    if (existsSync(gdir)) writeAtomic(join(gdir, `filmkit_${today}.md`), kit);
  } catch { }
  const insightPath = join(STATE_DIR, "brain_out", "wall_insights", today + ".md");
  // #59 — readInsights, not validateInsights: a rejection is a result the wall
  // shows, not a silence it swallows.
  // KAAM 1 (10 Aug 2026) — `shown` IS NO LONGER EMPTY. The comment that stood
  // here said viz "does not hold the prompt brain.mjs assembled", and treated
  // that as a fact of life; it was the defect. Two validators judging one text
  // against two different allowed-sets means the text can be legal where it was
  // written and invented where it is read, which is exactly what happened on
  // every night with evidence. brain.mjs now records the set it judged by beside
  // the output (`<date>.allowed.json`); viz judges by THAT set.
  //   · Absent sidecar ⇒ we fall back to the old behaviour rather than trusting
  //     the file blind. An older .md, or a night the brain wrote before this
  //     shipped, keeps being validated exactly as it is today — strictly, and
  //     possibly rejected. Fail closed: a missing snapshot never widens the gate.
  //   · Numbers are joined into a string because that is the `shown` contract
  //     (validators.eat runs NUM_RE over it) — the round-trip is exact for every
  //     token the set can hold.
  const allowedSnap = readJson(join(STATE_DIR, "brain_out", "wall_insights", today + ".allowed.json"));
  const shownSnap = allowedSnap && Array.isArray(allowedSnap.allowed) ? allowedSnap.allowed.join(" ") : "";
  const insightRead = existsSync(insightPath) ? readInsights(readFileSync(insightPath, "utf8"), data, shownSnap) : { lines: null, rejected: false };
  // KAAM 1 — the read's provenance, derived from the snapshot rather than from a
  // second sidecar: one record, one writer, no chance of the two disagreeing.
  data.insight_prov = allowedSnap && allowedSnap.written_at
    ? { made_by: "wall_insights (brain, model-authored)", made_at: allowedSnap.written_at, for_morning: allowedSnap.out_day } : null;
  const insights = insightRead.lines;
  // the Gemini lane: tonight's ready-made prompts (with last night's design-
  // coach critique folded in) — built BEFORE the render so the shelf's
  // one-click lanes can carry the kit + prompt straight to the clipboard.
  let renderNotes = null;
  for (let i = 0; i <= 2; i++) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "brain_out", "wall_review", d + ".md");
    if (existsSync(p)) { renderNotes = readFileSync(p, "utf8"); break; }
  }
  const pack = promptPack(data, renderNotes);
  for (const [name, text] of Object.entries(pack)) writeAtomic(join(CLUB_DIR, "prompts", name), text);

  // GEMINI FOLD — moved ABOVE the flag and the state write (#86). It used to run
  // last, so `gemini_render` described the state of the previous render. Now the
  // fold happens, then the flag is computed from what the fold actually wrote.
  let geminiNote = "", geminiFoldedToday = false;
  const gPath = join(STATE_DIR, "brain_out", "gemini_wall", today + ".md");
  if (existsSync(gPath)) {
    const clean = sanitizeGemini(readFileSync(gPath, "utf8"));
    if (clean) {
      writeAtomic(join(CLUB_DIR, "wall_gemini.html"), clean);                     // the served path (club links point here)
      writeAtomic(join(CLUB_DIR, `wall_gemini_${today}.html`), clean);            // the date-stamped PROOF the flag rides on
      writeProvenance(writeAtomic, CLUB_DIR, "wall_gemini.html", "gemini_render (model-authored, sanitized fold)", today, now);   // KAAM 1
      geminiFoldedToday = true;
      geminiNote = " + gemini render folded in";
    } else geminiNote = " (gemini render REJECTED by sanitizer — deterministic wall stands)";
  }
  data.media.gemini_render = geminiFlag(geminiFoldedToday, existsSync, CLUB_DIR, today);
  data.media.gemini_render_date = data.media.gemini_render ? today : null;
  // KAAM 1 — the caption stops reading the FILENAME. `gemini_render_date` above is
  // literally "today if the file exists", which is how the wall came to label a
  // render "· 2026-08-10" while the page it opened said "09 AUGUST 2026". These
  // two reads are the artefacts' own code-written records; where one is present
  // the caption uses it, and where it is absent the old filename behaviour stands
  // so that artefacts written before this pass still render exactly as they did.
  data.media.poster_prov = readJson(join(CLUB_DIR, "poster.svg.prov.json"));
  data.media.gemini_prov = readJson(join(CLUB_DIR, "wall_gemini.html.prov.json"));

  // #90 — THE STATE SNAPSHOT IS TAKEN HERE, BEFORE THE SELF-COPY. veo_text and
  // filmkit_text are ~4.7KB of text the wall's inline <script> needs and NO state
  // reader ever reads back (repo-wide grep: two hits, both in this file, both in
  // this process). Written after `data` was serialised, wall_data.json carried a
  // full nested JSON dump of itself — 6,714 bytes for ~2KB of state — and that
  // whole duplicate was then inlined into TWO nightly LLM prompts (wall_insights,
  // wall_review), halving their headroom under brain.mjs's 14,000-char clip with
  // pure anchoring noise. Same object, same process: the HTML still gets the blobs.
  writeAtomic(WALL_DATA, data);
  data.media.filmkit_text = kit;                                   // in-memory only, for the wall's <script>
  data.media.veo_text = pack["season_film.md"] || Object.values(pack)[0] || "";
  writeAtomic(WALL_HTML, renderWall(data, insightRead));

  // #106 — have/need counters, not status words, on the line he actually reads.
  const cal = data.calibration;
  const parts = [
    `wall rendered (${data.verdict})`,
    insights ? `${insights.length} insight line(s)` : insightRead.rejected ? `insights REJECTED at the gate: ${insightRead.reason}` : "no insights on disk",
    `season ledger ${data.season.ledger_open ? "open" : "NOT YET OPEN (matches/cabinet shown as unmeasured)"}`,
    `consistency ${data.season.weekly_consistency_days}/${data.season.weekly_consistency_window} days`,
    cal ? `calibration ${cal.reps_have}/${cal.reps_need === null ? "?" : cal.reps_need} reps` : "calibration awaiting its first rep",
    `brain ${data.brain.calls_today} today · ${data.brain.overnight_calls} overnight ${data.brain.overnight_window}${data.brain.coverage && data.brain.coverage.covered === false ? " (COVERAGE UNPROVEN: " + data.brain.coverage.reason + ")" : ""}`,
    `ledger read ${ledger.bytes_read.toLocaleString()}/${ledger.bytes_total.toLocaleString()} bytes`,
    `gemini render ${data.media.gemini_render ? "fresh (" + today + ")" : "none for today"}`,
  ];
  console.log(`viz: ${parts.join(" · ")}${geminiNote} · 3 Gemini prompts refreshed → ${WALL_HTML}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export {
  assembleWallData, renderWall, promptPack, sanitizeGemini, renderMedia, buildFilmKit,
  // #59: `allowedNumbers` is re-exported from validators.mjs — every importer that
  // already asked viz for it now transparently gets the ONE fixed implementation.
  // allowedNumbersLegacy is the frozen witness, exported so a reader can diff them.
  allowedNumbers, allowedNumbersLegacy,
  validateInsights,     // legacy contract: string[] | null
  readInsights,         // plan of record: {lines, rejected, reason}
  insightShelf, posterFlag, geminiFlag, weeklyConsistency, overnightWindow, readLinesSince,
};
