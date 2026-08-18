#!/usr/bin/env node
// ============================================================================
// presence.mjs · ARSENAL AI FC — PREDICTIVE PRESENCE (the stall sensor)
// ----------------------------------------------------------------------------
// WHAT:  The crown's sensor half (CYBORG_BRAIN.md §7e). ADHD-PI doesn't fail
//        from not-knowing; it fails in the gap between "stuck" and "gone".
//        This organ watches the LEADING EDGE of that gap: tab-thrash (window
//        switch rate) measured from ActivityWatch's window watcher. When the
//        last 10 minutes match the stall signature, it fires ONE afferent
//        at the thalamus ("stall:leading-edge" + a hint of what he was in),
//        where the M6 precache may already hold the exact reframe — so the
//        whisper is INSTANT, zero model latency, landing inside the 3-second
//        window where it can still catch him.
// LAWS:  sensing ≠ speaking: this organ NEVER voices anything — the whisper
//        still passes the earned-voice gate (shadow ratification) + the RED/
//        conserve mute at the mouth. On a conserve day it senses but stays
//        OFF the wire (rest is the agenda). AW unreachable → silent no-op.
//        Sole writer of presence_log.jsonl (gitignored). Zero LLM.
// MODES: node scripts/presence.mjs sense [--demo] · calibrate · status · roll · selftest
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync,
         statSync, openSync, closeSync, readSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { currentTone } from "./tone.mjs";
// #6 (producer side): the ONE canonical concept vocabulary. capture.mjs owns it and
// thalamus.mjs:90 already imports the same two functions — presence joins that lane
// rather than growing a third private copy of the canon (the drift the audit killed
// in validators.mjs). Pure functions over dressing-room/state/concepts.json; no writes.
import { loadRegistry, canonicalize } from "./capture.mjs";
import { dayKey } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW (sense is an interval lane → clock by design; calibrate has no day key; uniform resolver)

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PLOG      = join(STATE_DIR, "presence_log.jsonl");
const CONCEPTS  = join(STATE_DIR, "concepts.json");
const SPRINT    = join(STATE_DIR, "sprint.json");
const AW = "http://localhost:5600";
const THALAMUS = "http://127.0.0.1:4113";

// the stall signature (leading edge, conservative — a false whisper costs trust).
// These are the FACTORY defaults; after ≥5 days of telemetry, `calibrate`
// fits the thresholds to HIS OWN baselines (presence_thresholds.json) — the
// sensor learns what THIS captain's normal looks like, then flags departures.
const SIGNATURE = { window_min: 10, min_switch_rate_per_min: 5, min_total_switches: 30, min_span_min: 6 };
const THRESHOLDS = join(STATE_DIR, "presence_thresholds.json");
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function loadSignature(deps = {}) {
  const fitted = deps.fitted !== undefined ? deps.fitted : readJson(THRESHOLDS);
  return fitted && fitted.min_switch_rate_per_min ? { ...SIGNATURE, ...fitted } : SIGNATURE;
}
const pctl = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0; };

// ---------------------------------------------------------------------------
// #50 — THE MONOTONE RATCHET (audit 2 Aug 2026, finding 23). URGENT: it refits
// 03:30 every Sunday and it has ALREADY fired twice.
// ---------------------------------------------------------------------------
// The old fit built its "calm work" reference population from rows whose `edge`
// label was FROZEN INTO THE ROW at write time (:281) by the PREVIOUS fit. Raise
// the bar → more rows get written `edge:false` → those newly-"calm" rows carry
// HIGHER rates → the next p95 is higher → the bar rises again. A positive
// feedback loop with the sensor's own output on both sides.
//
// The audit's leave-one-out proof: 28 post-fit rows entered the calm pool ONLY
// because the bar had risen (factory would label them edge). Refit WITHOUT those
// 28 = 6.1 — unchanged. WITH them = 7.4. So 100% of the climb was feedback and
// 0% was his behaviour. Live confirmation on this machine: presence_thresholds
// .json now reads {"min_switch_rate_per_min":7.4,"min_total_switches":59,
// "fitted_at":"2026-08-02"} — the predicted ratchet landed.
//
// Measured on the live 1,613-row ledger while writing this fix:
//   legacy (frozen labels, whole log) → 7.3 / 59   ← the climb, still climbing
//   factory relabel, whole log        → 6.0 / 55
//   factory relabel, last  5 days     → 6.0 / 58
//   factory relabel, last 10 days     → 6.0 / 56
//   factory relabel, last 14 days     → 6.0 / 56
// A stable reference population holds the bar flat across every window width.
//
// TRAP (named in ORGANISM_ISSUES.md): "cap the fitted bar at 1.5x factory" is
// WRONG — 1.5 x 30 = 45 switches, BELOW the already-fitted 53/59, so that guard
// would silently LOWER the switch bar instead of arresting the drift. Not used.
//
// TWO REPAIRS, both required (the second is the co-defect the scanner missed):
//   1. RELABEL from the factory SIGNATURE, never from the frozen `edge` field.
//      The reference population then depends only on his telemetry, so a fit can
//      go DOWN as well as up — a ratchet is a ratchet because it cannot fall.
//   2. A RECENCY WINDOW. The old read took the ENTIRE log (`readLines(PLOG)`),
//      so the calm pool only ever grew (621 rows at 16 days, ~2,457 by week 8)
//      and "his normal" was increasingly set by months-old behaviour.
//
// NO GUESSED WINDOW WIDTH (captain's standing order). The window is DERIVED from
// the two minimums this function already enforced before the audit and which are
// preserved verbatim below: take the FEWEST most-recent days that still satisfy
// them. Nothing new was chosen; the smallest sufficient window is the one that
// dilutes least. `days_available` vs `window_days` is reported as a have/need
// counter (#106) so the width is visible instead of assumed.
const CALIBRATE = {
  min_days: 5,             // verbatim from the pre-audit `if (days.size < 5)`
  min_calm_samples: 20,    // verbatim from the pre-audit `if (calm.length < 20)`
};
// the STABLE label: what the FACTORY signature says about a row, computed from the
// row's own telemetry. Never `r.edge` — that field is the previous fit's opinion.
const factoryEdge = (r) => isLeadingEdge({
  span_min: Number(r.span_min) || 0, switches: Number(r.switches) || 0, rate_per_min: Number(r.rate) || 0,
}, SIGNATURE);
const hasTelemetry = (r) => r && Number.isFinite(Number(r.rate)) && Number.isFinite(Number(r.switches));

// the fewest most-recent days that clear BOTH minimums; the whole span if they never do.
function calmWindow(passRows, cfg = CALIBRATE) {
  const days = [...new Set(passRows.map(r => r.day).filter(Boolean))].sort();
  const calmIn = (set) => passRows.filter(r => set.has(r.day) && Number(r.rate) > 0 && !factoryEdge(r));
  for (let k = Math.min(cfg.min_days, days.length); k <= days.length; k++) {
    const win = days.slice(-k);
    const calm = calmIn(new Set(win));
    if (calm.length >= cfg.min_calm_samples) return { window: win, calm, enough: true, days_available: days.length };
  }
  return { window: days, calm: calmIn(new Set(days)), enough: false, days_available: days.length };
}

// Grow the tail read until it holds enough history to satisfy the minimums, or
// until it has reached the start of recorded history. FIRST-READ SIZE, NOT A CAP:
// the loop doubles, and `complete:false` (fewer rows returned than asked for) is
// the only stop condition other than sufficiency.
const CALIBRATE_FIRST_ROWS = 1024;
function calibrationRows(deps = {}) {
  let want = CALIBRATE_FIRST_ROWS;
  for (;;) {
    const rep = presenceTailReport(want, deps);
    const pass = sensePassRows(rep.rows).filter(hasTelemetry);
    const days = new Set(pass.map(r => r.day));
    const enough = days.size >= CALIBRATE.min_days && calmWindow(pass).enough;
    if (enough || !rep.complete) return rep;      // sufficient, or history exhausted
    want *= 2;
  }
}

// calibrateLegacy — the pre-audit fit, FROZEN VERBATIM (layering law, CLAUDE.md).
// It is the record of the ratchet: frozen `edge` labels + the whole-log read. Kept
// so the delta is provable, and the selftest asserts the two engines diverge on
// contaminated data. NOT the plan of record; nothing calls it but the selftest.
function calibrateLegacy(deps = {}) {
  const rows = deps.rows || readLines(PLOG);
  const days = new Set(rows.map(r => r.day));
  if (days.size < 5) return { ok: false, skipped: `${days.size} day(s) of telemetry — the sensor fits to HIM only after 5 (factory defaults hold)` };
  const calm = rows.filter(r => !r.edge && r.rate > 0);
  if (calm.length < 20) return { ok: false, skipped: "not enough calm-work samples yet" };
  const fitted = {
    fitted_at: new Date().toISOString(), days: days.size, samples: calm.length,
    min_switch_rate_per_min: Math.max(SIGNATURE.min_switch_rate_per_min, Math.round(pctl(calm.map(r => r.rate), 0.95) * 1.25 * 10) / 10),
    min_total_switches: Math.max(SIGNATURE.min_total_switches, Math.round(pctl(calm.map(r => r.switches), 0.95) * 1.25)),
  };
  (deps.write || ((o) => { mkdirSync(dirname(THRESHOLDS), { recursive: true }); const tmp = THRESHOLDS + ".tmp"; writeFileSync(tmp, JSON.stringify(o, null, 2) + "\n"); renameSync(tmp, THRESHOLDS); }))(fitted);
  return { ok: true, ...fitted };
}

// THE PLAN OF RECORD — fit to his own normal against a STABLE, RECENT population.
function calibrate(deps = {}) {
  // injected rows ARE the whole history by definition, hence complete:false — the
  // flag means "the tail read asked for more than existed", i.e. history exhausted.
  const src = deps.rows
    ? { rows: deps.rows, complete: false, have: deps.rows.length, need: deps.rows.length, scanned: ["(injected)"], archives: 0 }
    : calibrationRows(deps);
  const pass = sensePassRows(src.rows).filter(hasTelemetry);
  const days = new Set(pass.map(r => r.day).filter(Boolean));
  const scanned = { rows_scanned: src.rows.length, pass_rows: pass.length, files: src.scanned.length, history_complete: !src.complete };
  if (days.size < CALIBRATE.min_days) {
    return { ok: false, have_days: days.size, need_days: CALIBRATE.min_days, ...scanned,
      skipped: `${days.size}/${CALIBRATE.min_days} day(s) of telemetry — the sensor fits to HIM only after ${CALIBRATE.min_days} (factory defaults hold)` };
  }
  const w = calmWindow(pass);
  if (!w.enough) {
    return { ok: false, have_samples: w.calm.length, need_samples: CALIBRATE.min_calm_samples, window_days: w.window.length, days_available: w.days_available, ...scanned,
      skipped: `${w.calm.length}/${CALIBRATE.min_calm_samples} calm-work samples across all ${w.days_available} recorded day(s) — factory defaults hold` };
  }
  const inWindow = new Set(w.window);
  // the counter that makes the ratchet visible: how many rows the FROZEN label
  // would have called calm that the FACTORY signature calls a stall. Every one of
  // those is a row the old fit used to raise its own bar with.
  const windowPass = pass.filter(r => inWindow.has(r.day));
  const frozenCalm = windowPass.filter(r => !r.edge && Number(r.rate) > 0).length;
  const prev = deps.previous !== undefined ? deps.previous : readJson(THRESHOLDS);
  const fitted = {
    fitted_at: new Date().toISOString(),
    // `days`/`samples` keep their pre-audit key names — presence_thresholds.json is
    // read by loadSignature (spread over SIGNATURE) and by the status line.
    days: w.window.length, samples: w.calm.length,
    labelled_by: "factory-signature",          // NOT the frozen per-row `edge` (that is what ratcheted)
    window_days: w.window.length, days_available: w.days_available,
    window_from: w.window[0], window_to: w.window[w.window.length - 1],
    frozen_label_calm: frozenCalm, factory_label_calm: w.calm.length,
    ratchet_rows_excluded: Math.max(0, frozenCalm - w.calm.length),
    min_switch_rate_per_min: Math.max(SIGNATURE.min_switch_rate_per_min, Math.round(pctl(w.calm.map(r => Number(r.rate)), 0.95) * 1.25 * 10) / 10),
    min_total_switches: Math.max(SIGNATURE.min_total_switches, Math.round(pctl(w.calm.map(r => Number(r.switches)), 0.95) * 1.25)),
  };
  fitted.previous = prev ? { min_switch_rate_per_min: prev.min_switch_rate_per_min, min_total_switches: prev.min_total_switches, fitted_at: prev.fitted_at || null } : null;
  fitted.direction = !prev ? "first fit"
    : fitted.min_switch_rate_per_min > prev.min_switch_rate_per_min ? "UP"
    : fitted.min_switch_rate_per_min < prev.min_switch_rate_per_min ? "down (a ratchet cannot do this)" : "flat";
  (deps.write || ((o) => { mkdirSync(dirname(THRESHOLDS), { recursive: true }); const tmp = THRESHOLDS + ".tmp"; writeFileSync(tmp, JSON.stringify(o, null, 2) + "\n"); renameSync(tmp, THRESHOLDS); }))(fitted);
  return { ok: true, ...fitted, ...scanned };
}

// E2E audit 25 Jul 2026 (b831d29c): every sense pass appends TWO rows — the
// thrash row and the kind:"focus" ledger row — so `status` printed rows.length
// and reported exactly 2× the real pass count ("48 sense passes today" for 24
// runs). A cosmetic lie is still a lie in the one organ whose whole job is
// honest interoception. A pass = a thrash row = a row with no `kind`.
// (dugout.mjs:1056 `presence_passes_today` carries the same double-count and is
// NOT this file's to fix — reported to the audit instead.)
const sensePassRows = (rows) => (rows || []).filter(r => r && !r.kind);

// One day's rows, read from the tail and PROVEN complete (#4/#51). It widens until
// a row OLDER than `day` is inside the window — that is what proves midnight was
// crossed — or until history runs out. 256 is a first-read row count, not a cap.
function presenceDayReport(day, deps = {}) {
  let n = 256;
  for (;;) {
    const rep = presenceTailReport(n, deps);
    const sawOlder = rep.rows.some(r => r && r.day && r.day < day);
    if (sawOlder || !rep.complete) {
      return { rows: rep.rows.filter(r => r && r.day === day), covers_boundary: sawOlder || !rep.complete,
        scanned_rows: rep.rows.length, files: rep.scanned.length, archives: rep.archives };
    }
    n *= 2;
  }
}

const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// #51 — THE UNBOUNDED LEDGER: A MONTHLY ROLL, AND A TAIL READER THE OTHERS SHARE
// ---------------------------------------------------------------------------
// presence_log.jsonl is append-only with NO rotation: 285,369 bytes / 1,613 rows
// after 19 calendar days (measured 4 Aug 2026) => ~6.7 MB/yr, and it has FIVE
// whole-file readers repo-wide (presence calibrate, brain liveSignal, brain
// gatherInputs, distiller, dugout's boardroom briefing) that between them keep
// ~1% of what they parse.
//
// presence.mjs is the SOLE WRITER of this ledger, so the roll belongs here.
// Rolled rows go to `presence_log.<YYYY-MM>.jsonl` beside the live file — the
// exact sibling shape brain.mjs's archiveSiblings() and dugout.mjs's
// readPresenceDay() already glob for, so the three organs agree on the layout.
//
// EVERY reader below tolerates BOTH layouts. Before the first roll there are no
// siblings and the live file answers everything; after a roll the live file is
// short and the tail read walks back into the archives. Nothing is ever deleted:
// a roll MOVES rows, it never drops them, and re-running a roll that already
// happened appends nothing (the archive is de-duplicated on write).
//
// NO GUESSED BYTE BUDGET. TAIL_CHUNK is a FIRST-READ SIZE, not a cap: the read
// doubles from the end of the file until it holds n+1 newlines or reaches byte 0.
// 64 KiB is one filesystem read-ahead unit and already spans ~370 rows at this
// ledger's own measured mean row size (285,369 B / 1,613 rows = 177 B/row), so
// every caller in this repo (n = 4, 6, 12, 200) is answered by the first syscall.
const TAIL_CHUNK = 65536;
const HEAD_CHUNK = 8192;                     // enough for the ledger's first row; same doubling law would apply

function tailText(p, n, chunk = TAIL_CHUNK) {
  let fd = null;
  try {
    const size = statSync(p).size;
    if (!size) return "";
    fd = openSync(p, "r");
    let want = Math.min(size, chunk);
    for (;;) {
      const buf = Buffer.alloc(want);
      readSync(fd, buf, 0, want, size - want);
      const text = buf.toString("utf8");
      if (want >= size) return text;                                   // whole file: nothing was cut
      if ((text.match(/\n/g) || []).length > n) return text.slice(text.indexOf("\n") + 1);   // drop the sliced fragment
      want = Math.min(size, want * 2);
    }
  } catch { return ""; } finally { if (fd !== null) { try { closeSync(fd); } catch {} } }
}
function headText(p, bytes = HEAD_CHUNK) {
  let fd = null;
  try {
    const size = statSync(p).size;
    if (!size) return "";
    const want = Math.min(size, bytes);
    const buf = Buffer.alloc(want);
    fd = openSync(p, "r");
    readSync(fd, buf, 0, want, 0);
    const text = buf.toString("utf8");
    return want >= size ? text : text.slice(0, text.lastIndexOf("\n") + 1);
  } catch { return ""; } finally { if (fd !== null) { try { closeSync(fd); } catch {} } }
}
const parseLines = (text) => { const o = []; for (const l of String(text || "").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } return o; };

const archivePath = (file, month) => String(file).replace(/\.jsonl$/, `.${month}.jsonl`);
// newest archive first — `presence_log.2026-08.jsonl` sorts after `presence_log.2026-07.jsonl`
function archiveSiblings(file) {
  try {
    const dir = dirname(file), base = basename(file, ".jsonl");
    const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.[0-9][0-9A-Za-z_-]*\\.jsonl$`);
    return readdirSync(dir).filter(f => re.test(f)).sort().reverse().map(f => join(dir, f));
  } catch { return []; }
}

// THE SHARED TAIL READER — the helper brain.mjs / distiller.mjs / dugout.mjs can
// import instead of re-parsing the whole ledger. Returns rows OLDEST-LAST, exactly
// like readLines(...).slice(-n) did, so it is a drop-in for every existing call.
//   presenceTailReport(n, { file }) -> { rows, have, need, complete, scanned, archives }
// `complete` is the honesty flag (#4): false means history ran out before n rows
// were found — a short answer, never a measured zero. Callers that only want rows
// use presenceTail(n, { file }).
function presenceTailReport(n, deps = {}) {
  const file = deps.file || PLOG;
  const readT = deps.tailText || tailText;
  const want = Math.max(0, Number(n) || 0);
  let rows = existsSync(file) ? parseLines(readT(file, want)) : [];
  const scanned = [file];
  const archives = deps.archives !== undefined ? deps.archives : archiveSiblings(file);
  for (const a of archives) {
    if (rows.length >= want) break;
    const short = want - rows.length;
    const older = parseLines(readT(a, short));
    rows = older.slice(-short).concat(rows);
    scanned.push(a);
  }
  rows = rows.slice(-want);
  return { rows, have: rows.length, need: want, complete: rows.length >= want, scanned, archives: archives.length };
}
const presenceTail = (n, deps = {}) => presenceTailReport(n, deps).rows;

const monthOf = (r) => String((r && (r.day || r.ts)) || "").slice(0, 7);
// Cheap check: is the ledger's FIRST row older than the current month? One bounded
// head read (8 KiB), not a whole-file parse — this runs on every 10-minute pass.
function rollDue(now = new Date(), deps = {}) {
  const file = deps.file || PLOG;
  const head = deps.head !== undefined ? deps.head : (existsSync(file) ? parseLines(headText(file)) : []);
  const first = head[0];
  const current_month = dayKey(now).slice(0, 7);
  if (!first) return { due: false, current_month, reason: "ledger empty — nothing to roll" };
  const m = monthOf(first);
  if (!m) return { due: false, current_month, reason: "first row carries no date — never guess one" };
  return { due: m < current_month, first_month: m, current_month, reason: m < current_month ? `oldest row is ${m}, we are in ${current_month}` : `oldest row is already ${m}` };
}

// THE ROLL. Moves every row from a PAST month into its own archive and rewrites the
// live ledger with the current month only. Idempotent: an archive is read before it
// is written and identical rows are not appended twice, so a crash between the two
// writes costs a re-run, never a duplicate or a loss.
function rollPresenceLog(now = new Date(), deps = {}) {
  const file = deps.file || PLOG;
  const current_month = dayKey(now).slice(0, 7);
  const rows = deps.rows || (existsSync(file) ? readLines(file) : []);
  if (!rows.length) return { rolled: false, moved: 0, kept: 0, months: [], reason: "ledger empty — nothing to roll" };
  const older = new Map(); const keep = [];
  for (const r of rows) { const m = monthOf(r); if (m && m < current_month) { if (!older.has(m)) older.set(m, []); older.get(m).push(r); } else keep.push(r); }
  const months = [...older.keys()].sort();
  if (!months.length) return { rolled: false, moved: 0, kept: keep.length, months: [], reason: `all ${rows.length} row(s) are in ${current_month}` };
  const write = deps.write || ((p, text) => { mkdirSync(dirname(p), { recursive: true }); const tmp = p + "." + process.pid + ".tmp"; writeFileSync(tmp, text); renameSync(tmp, p); });
  const readArchive = deps.readArchive || ((p) => (existsSync(p) ? readLines(p) : []));
  const archives = []; let moved = 0, appended = 0;
  for (const m of months) {
    const ap = archivePath(file, m);
    const have = readArchive(ap);
    const seen = new Set(have.map(r => JSON.stringify(r)));
    const add = older.get(m).filter(r => !seen.has(JSON.stringify(r)));
    write(ap, [...have, ...add].map(r => JSON.stringify(r)).join("\n") + "\n");
    archives.push({ file: ap, month: m, rows: have.length + add.length, appended: add.length, already_there: older.get(m).length - add.length });
    moved += older.get(m).length; appended += add.length;
  }
  // RE-READ BEFORE THE REWRITE. presence has a documented overlapping-instance scar
  // (:241-252) and the ledger is append-only: a pass that appended a row while the
  // archive was being written would be erased by a rewrite built from the stale read.
  // Recomputing `keep` from the file as it stands NOW costs one read a month and
  // closes the only path by which this roll could lose a row.
  const fresh = deps.rows ? rows : (deps.reread ? deps.reread(file) : (existsSync(file) ? readLines(file) : rows));
  const archivedKeys = new Set();
  for (const m of months) for (const r of older.get(m)) archivedKeys.add(JSON.stringify(r));
  const keepNow = fresh.filter(r => !archivedKeys.has(JSON.stringify(r)));
  write(file, keepNow.length ? keepNow.map(r => JSON.stringify(r)).join("\n") + "\n" : "");
  return { rolled: true, moved, appended, kept: keepNow.length, late_rows_preserved: Math.max(0, keepNow.length - keep.length), months, archives, current_month };
}
// SECRETS GUARD (CLAUDE.md: "the repo is PUBLIC · glance before every push").
// .gitignore:181 names `dressing-room/state/presence_log.jsonl` LITERALLY — it does
// not cover the `presence_log.<YYYY-MM>.jsonl` siblings this roll creates, and those
// carry window titles and tone. presence.mjs cannot fix .gitignore (not its file, and
// not its business), so it does the next honest thing: it SAYS SO, every time an
// archive exists and the pattern is missing. An unmeasured silence is not a clean bill.
const IGNORE_LINE = "dressing-room/state/presence_log.*.jsonl";
function archiveIgnoreGap(deps = {}) {
  const archives = deps.archives || archiveSiblings(deps.file || PLOG);
  if (!archives.length) return { gap: false, archives: 0, needed_line: IGNORE_LINE };
  let gi = deps.gitignore;
  if (gi === undefined) { try { gi = readFileSync(join(__dirname, "..", ".gitignore"), "utf8"); } catch { gi = ""; } }
  // any line that globs the month suffix counts; a literal `presence_log.jsonl` does not
  const covered = String(gi || "").split("\n").some(l => {
    const s = l.trim();
    if (!s || s.startsWith("#")) return false;
    return /presence_log/.test(s) && /\*/.test(s);
  });
  return { gap: !covered, archives: archives.length, needed_line: IGNORE_LINE };
}

// the pass-time guard: only pay for the whole-file read on the day a roll is actually due
function maybeRoll(now = new Date(), deps = {}) {
  const due = rollDue(now, deps);
  if (!due.due) return { rolled: false, ...due };
  return { ...rollPresenceLog(now, deps), ...due };
}

// ---------------------------------------------------------------------------
// THE READ — window events (last 10 min) → thrash telemetry
// ---------------------------------------------------------------------------
function thrashTelemetry(events, now = new Date()) {
  const cutoff = now.getTime() - SIGNATURE.window_min * 60000;
  const recent = (events || []).filter(e => new Date(e.timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (recent.length < 2) return { switches: 0, rate_per_min: 0, span_min: 0, top_words: [] };
  let switches = 0;
  const wordCount = new Map();
  for (let i = 0; i < recent.length; i++) {
    const d = recent[i].data || {};
    if (i > 0) {
      const prev = recent[i - 1].data || {};
      if ((d.app || "") !== (prev.app || "") || (d.title || "") !== (prev.title || "")) switches++;
    }
    for (const w of String(d.title || "").toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 3) wordCount.set(w, (wordCount.get(w) || 0) + 1);
    }
  }
  const spanMin = (new Date(recent[recent.length - 1].timestamp) - new Date(recent[0].timestamp)) / 60000;
  const top_words = [...wordCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);
  return { switches, rate_per_min: spanMin > 0 ? switches / spanMin : 0, span_min: spanMin, top_words };
}
function isLeadingEdge(t, sig = loadSignature()) {
  return t.span_min >= sig.min_span_min && t.switches >= sig.min_total_switches && t.rate_per_min >= sig.min_switch_rate_per_min;
}

// ---------------------------------------------------------------------------
// THE FOCUS SENTINEL (17 Jul — the captain's own order: full-power watching):
// the same AW eyes now keep the FOCUS LEDGER — how long he was truly in the
// work, when the thread snapped, and what pulled him. Deterministic, ZERO
// tokens. Classification reuses the Time-Auditor's buckets.json truth.
// A BREAK = ≥break_min of continuous non-focus SCREEN time; being away/AFK is
// NOT a break (rest is never an accusation). The afferent fires ONCE per break
// onset; the shadow-gate still owns whether anything is ever said aloud.
// ---------------------------------------------------------------------------
const FOCUS = { window_min: 30, break_min: 5 };
function bucketsMatcher(cfg) {
  const b = cfg !== undefined ? cfg : readJson(join(STATE_DIR, "buckets.json"));
  const rules = (b && b.rules) || {}; const browsers = ((b && b.browsers) || []).map(s => String(s).toLowerCase());
  const sets = ["Learning", "Building"].map(k => ({
    apps: ((rules[k] || {}).apps || []).map(s => String(s).toLowerCase()),
    domains: ((rules[k] || {}).domains || []).map(s => String(s).toLowerCase()),
  }));
  return (app, title) => {
    const a = String(app || "").toLowerCase(), t = String(title || "").toLowerCase();
    const isBrowser = browsers.some(x => a.includes(x));
    for (const s of sets) {
      if (!isBrowser && s.apps.some(x => a.includes(x))) return true;
      if (isBrowser && s.domains.some(x => t.includes(x))) return true;
    }
    return false;
  };
}
// --- AW AFK truth (E2E audit 25 Jul 2026, finding 4c520ce9) -----------------
// The law declared in the sentinel header above ("being away/AFK is NOT a
// break — rest is never an accusation") was written
// but NEVER implemented: focusRead only ever saw aw-watcher-window, and that
// watcher keeps accruing duration on whatever window was left focused. Walk away
// for chai with a YouTube tab up — or let the machine lock onto LockApp.exe —
// and the next 10-min pass computed offRunSec ≥ 300 and fired "the thread
// snapped: 5min off", i.e. it accused him of quitting while he was resting. That
// is the one thing this organ promised never to do. Presence now subtracts the
// KNOWN-AWAY spans (aw-watcher-afk, status "afk") from every window event, the
// same intersect trick timeaudit.mjs uses. Only KNOWN away time is subtracted,
// so a missing / short / unreachable AFK bucket degrades to the old reading
// instead of inventing absence (never guess).
function awayIntervals(afkEvents) {
  if (!Array.isArray(afkEvents)) return null;              // no AFK truth → clip nothing
  const raw = [];
  for (const e of afkEvents) {
    if (!e || !e.timestamp) continue;
    if (String((e.data || {}).status || "").toLowerCase() !== "afk") continue;
    const s = new Date(e.timestamp).getTime();
    if (!Number.isFinite(s)) continue;
    const dur = Math.max(0, Number(e.duration) || 0);
    if (dur > 0) raw.push([s, s + dur * 1000]);
  }
  raw.sort((a, b) => a[0] - b[0]);
  const merged = [];                                       // merge first: overlapping afk spans must never double-subtract
  for (const iv of raw) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([iv[0], iv[1]]);
  }
  return merged;
}
// seconds of [startMs,endMs] he was actually AT the machine (away spans removed)
function presentSec(startMs, endMs, away) {
  let ms = Math.max(0, endMs - startMs);
  if (away) for (const [s, e] of away) { const ov = Math.min(endMs, e) - Math.max(startMs, s); if (ov > 0) ms -= ov; }
  return Math.max(0, ms) / 1000;
}

// focusReadLegacy — the pre-audit engine, FROZEN VERBATIM (layering, never
// replace). Kept as the record of what the sentinel used to see: whole-event
// durations, start-timestamp windowing, no AFK truth.
function focusReadLegacy(events, now = new Date(), matcher = null, opts = FOCUS) {
  const isFocus = matcher || bucketsMatcher();
  const cutoff = now.getTime() - opts.window_min * 60000;
  const recent = (events || []).filter(e => e && e.timestamp && new Date(e.timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let focusSec = 0, offSec = 0, offRunSec = 0, lastPull = null;
  const offWords = new Map();
  for (const e of recent) {
    const d = e.data || {}; const dur = Math.max(0, Math.min(Number(e.duration) || 0, 1800));
    if (isFocus(d.app, d.title)) { focusSec += dur; offRunSec = 0; }
    else {
      offSec += dur; offRunSec += dur; if (d.app) lastPull = d.app;
      for (const w of String(d.title || "").toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 3) offWords.set(w, (offWords.get(w) || 0) + 1);
    }
  }
  return {
    focus_min: Math.round(focusSec / 60), off_min: Math.round(offSec / 60),
    break_live: offRunSec >= opts.break_min * 60, break_run_min: Math.round(offRunSec / 60),
    pull: lastPull, pull_words: [...offWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w),
  };
}

// The plan of record. Two audit repairs ride here (E2E audit 25 Jul 2026):
//  · 4c520ce9 — window seconds are clipped against the AFK truth (above).
//  · cc7f9b1f — events are CLIPPED to [cutoff, now] instead of being dropped by
//    their start timestamp. AW heartbeat-merges an unbroken stretch into ONE
//    event stamped at the episode START, so the old filter threw away exactly
//    his deepest work: 40 unbroken minutes in one paper = one event older than
//    the 30-min cutoff = focus_min 0, while the 5 minutes of cricket that
//    followed survived — the ledger read "0 min of work, 5 min off" at the end
//    of his best hour. Now each event contributes only its overlap with the
//    window. The old Math.min(dur,1800) sanity cap is gone with it: the clip
//    already bounds every event to window_min, and the cap was actively
//    truncating long merged sessions from their tail.
function focusRead(events, now = new Date(), matcher = null, opts = FOCUS, afk = null) {
  const isFocus = matcher || bucketsMatcher();
  const nowMs = now.getTime();
  const cutoff = nowMs - opts.window_min * 60000;
  const away = awayIntervals(afk);
  const recent = (events || []).filter(e => {
    if (!e || !e.timestamp) return false;
    const s = new Date(e.timestamp).getTime();
    if (!Number.isFinite(s)) return false;
    return s + Math.max(0, Number(e.duration) || 0) * 1000 > cutoff && s < nowMs;   // straddlers stay in
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let focusSec = 0, offSec = 0, offRunSec = 0, lastPull = null;
  const offWords = new Map();
  for (const e of recent) {
    const d = e.data || {};
    const s = new Date(e.timestamp).getTime();
    const start = Math.max(s, cutoff), end = Math.min(s + Math.max(0, Number(e.duration) || 0) * 1000, nowMs);
    const dur = presentSec(start, end, away);
    if (isFocus(d.app, d.title)) { focusSec += dur; offRunSec = 0; }
    else {
      offSec += dur; offRunSec += dur; if (d.app) lastPull = d.app;
      for (const w of String(d.title || "").toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 3) offWords.set(w, (offWords.get(w) || 0) + 1);
    }
  }
  return {
    focus_min: Math.round(focusSec / 60), off_min: Math.round(offSec / 60),
    break_live: offRunSec >= opts.break_min * 60, break_run_min: Math.round(offRunSec / 60),
    pull: lastPull, pull_words: [...offWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w),
  };
}

// E2E audit 25 Jul 2026 (a7262423): the buckets call was guarded by a 4s abort
// but the follow-up EVENTS call was a bare fetch with no signal. A half-alive AW
// — one that accepts the socket after a wake-from-sleep but never answers — hung
// the whole sense pass on undici's ~300s header timeout instead of the intended
// 4s silent no-op. At /SC MINUTE /MO 10 that lets a second scheduled pass start
// on top of the first, and two instances then append rows to presence_log.jsonl.
// Both legs now carry their own controller and both timers clear in `finally`.
async function fetchAwEvents(prefix, deps = {}) {
  const fetchFn = deps.fetchFn || fetch;
  let t1 = null, t2 = null;
  try {
    const c1 = new AbortController(); t1 = setTimeout(() => c1.abort(), 4000);
    const buckets = await (await fetchFn(`${AW}/api/0/buckets`, { signal: c1.signal })).json();
    clearTimeout(t1); t1 = null;
    const b = Object.keys(buckets).find(k => k.startsWith(prefix));
    if (!b) return null;
    const c2 = new AbortController(); t2 = setTimeout(() => c2.abort(), 4000);
    return await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(b)}/events?limit=200`, { signal: c2.signal })).json();
  } catch { return null; }                          // AW down → silent no-op (never guess)
  finally { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); }
}
const fetchWindowEvents = (deps = {}) => fetchAwEvents("aw-watcher-window", deps);
// the presence half of the truth: known-away spans, so rest is never an accusation
const fetchAfkEvents = (deps = {}) => fetchAwEvents("aw-watcher-afk", deps);

// ---------------------------------------------------------------------------
// #6 (PRODUCER SIDE) — `concept_tokens` MUST CARRY CONCEPTS
// ---------------------------------------------------------------------------
// The field name is a contract. thalamus.mjs joins it against the DMN's precached
// concept names, adds every token to the novelty vocabulary (`N.seen`), and fuses
// co-temporal moments that share one. This organ was filling it with WINDOW-TITLE
// WORDS: over all 95 stall afferents ever posted the histogram was google 83,
// chrome 78, claude 37, youtube 19, gmail 12, windows 10, amazon 9 — browser
// chrome, not one concept. Measured result: 0 of 95 stalls matched the precache,
// so ~49 DMN rollouts a night produced zero whispers in 16 days, and dossier.json
// still reads "concepts":{} after 90 stall moments.
//
// So: canonicalize through capture.mjs's registry (the same canon thalamus.mjs
// imports) and emit ONLY what resolves to a registered concept or skill id. When
// nothing in the title is canon — the everyday case — fall back to sprint.json's
// CURRENT task, because "he stalled while he was supposed to be on today's ground"
// is a defensible prior. It is said OUT LOUD in `concept_source` rather than
// smuggled: window-title-canon | sprint-current | none. The raw title words are
// NOT thrown away — they move to `title_words`, which is what they always were.
//
// DIVERGENCE FROM thalamus.dossierKey(), on purpose: with no registry loaded that
// helper passes the raw token through (capture's law — a missing registry may
// never block a WRITE). Here a missing registry means emit NOTHING, because
// passing raw window words through is precisely the defect being repaired.
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };
let _regCache = { key: "", reg: EMPTY_REG };
function conceptRegistry(path = CONCEPTS) {
  // mtime+size keyed: the canon is hand-edited, and a 10-minute job must not need
  // a restart to see a newly registered concept — nor re-parse the file per token.
  try {
    const st = statSync(path);
    const key = `${st.mtimeMs}:${st.size}`;
    if (key !== _regCache.key) _regCache = { key, reg: loadRegistry(path) };
    return _regCache.reg;
  } catch { return EMPTY_REG; }
}
function canonToken(word, reg) {
  if (!reg || !reg.loaded) return null;
  const w = String(word || "").trim();
  if (!w) return null;
  const c = canonicalize(w, "concept", reg);
  if (!c.unregistered) return c.canonical;
  const s = canonicalize(w, "skill", reg);          // a hands-on skill id is as real a concept as a theory one
  return s.unregistered ? null : s.canonical;
}
const conceptTokens = (words, reg) => {
  const out = [];
  for (const w of words || []) { const id = canonToken(w, reg); if (id && !out.includes(id)) out.push(id); }
  return out;
};
function sprintConcept(deps = {}) {
  const j = deps.sprint !== undefined ? deps.sprint : readJson(SPRINT);
  const cur = j && j.progress && j.progress.current;
  const task = cur && cur.task ? String(cur.task) : "";
  return task.trim() || null;
}
// title words -> { concept_tokens, concept_source }. Honest by construction: an
// empty array is an empty array, never a browser name dressed up as a concept.
function stallConcepts(titleWords, deps = {}) {
  const reg = deps.registry !== undefined ? deps.registry : conceptRegistry();
  const fromTitle = conceptTokens(titleWords, reg);
  if (fromTitle.length) return { concept_tokens: fromTitle, concept_source: "window-title-canon" };
  const sc = sprintConcept(deps);
  const id = sc ? canonToken(sc, reg) : null;
  if (id) return { concept_tokens: [id], concept_source: "sprint-current" };
  return { concept_tokens: [], concept_source: "none" };
}

// ---------------------------------------------------------------------------
// THE SENSE PASS — telemetry → (maybe) one afferent · always the log
// ---------------------------------------------------------------------------
async function sense(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  const events = deps.events !== undefined ? deps.events : await fetchWindowEvents(deps);
  if (events === null) return { ok: false, skipped: "ActivityWatch unreachable — no telemetry, no guess" };
  const t = thrashTelemetry(events, now);
  const edge = isLeadingEdge(t, deps.signature || loadSignature(deps));
  const post = deps.post || (async (evt) => {
    try {
      const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 1500);
      await fetch(THALAMUS + "/afferent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
      clearTimeout(tm);
      return true;
    } catch { return false; }
  });
  const append = deps.append || ((r) => { mkdirSync(dirname(PLOG), { recursive: true }); appendFileSync(PLOG, JSON.stringify(r) + "\n"); });
  // #51: the monthly roll rides the sense pass, because this organ is the ledger's
  // sole writer. It costs ONE bounded head read on 30 days out of 31; on the day a
  // roll is due it pays for one full read and one rewrite. Pass `roll: null` to keep
  // an injected-events caller (the selftest) entirely off the filesystem.
  const rolled = deps.roll !== undefined ? deps.roll : maybeRoll(now);
  // #51: the ledger is read from its TAIL, not whole. Every pass appends exactly TWO
  // rows (the thrash row and the kind:"focus" row — documented at :61-68 and a perfect
  // 2:1 on every single day of the ledger), so two full passes is strictly more than
  // the one-of-each these lookups need. It is NOT a cap: findPrev widens the window
  // and walks into the archives until the row is found or history genuinely runs out.
  // "I did not look far enough" must never be rendered as "there is no previous row".
  const ROWS_PER_PASS = 2, PREV_TAIL_ROWS = ROWS_PER_PASS * 2;
  const readTail = deps.readTail || ((n) => presenceTailReport(n, { file: deps.plog || PLOG }));
  let _rep = null;
  const findPrev = (pred) => {
    let n = PREV_TAIL_ROWS;
    for (;;) {
      const rep = (_rep && _rep.need >= n) ? _rep : (_rep = readTail(n));
      const hit = rep.rows.filter(pred).slice(-1)[0] || null;
      if (hit || !rep.complete) return hit;                 // found it, or that is all the history there is
      n = rep.need * 2;
    }
  };
  const row = { ts: now.toISOString(), day: dayKey(now), switches: t.switches, rate: Math.round(t.rate_per_min * 10) / 10, span_min: Math.round(t.span_min * 10) / 10, edge, tone: tone.arousal, posted: false };
  // E2E audit 25 Jul 2026 (b6e6a127): the focus lane deduped on onset but this
  // one fired on EVERY matching pass. One continuous 25-min thrash spell spans 3
  // scheduled passes → 3 identical afferents → dossier.stalls_today = 3 off a
  // SINGLE episode, and capacity_nudge went "lower" for the rest of the day on
  // an inflated count. Same law as the focus lane now: only the false→true edge
  // (episode onset) speaks; every pass still LOGS edge rows so the calibrate
  // dataset and the telemetry season are untouched.
  const prevEdge = deps.prevEdge !== undefined ? deps.prevEdge : findPrev(r => r && !r.kind);
  // #6: real concept tokens, or an honest empty array — never browser chrome.
  const cw = stallConcepts(t.top_words, deps);
  if (edge) { row.concept_source = cw.concept_source; row.concepts = cw.concept_tokens; }
  if (edge && !(prevEdge && prevEdge.edge) && tone.arousal !== "conserve") {
    row.posted = await post({
      modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true,
      text: `tab-thrash forming: ${t.switches} switches in ${Math.round(t.span_min)}min`,
      concept_tokens: cw.concept_tokens,        // canon ids only (may be []) — the field name is a contract
      concept_source: cw.concept_source,        // window-title-canon | sprint-current | none
      title_words: t.top_words,                 // the raw window words, kept, under their real name
    });
  }
  append(row);
  // THE FOCUS LEDGER rides the same pass — zero extra fetches, zero tokens.
  // Break-onset dedupe: only the moment the thread SNAPS fires an afferent;
  // an ongoing break never re-fires (a nag is not a whisper).
  // AFK truth rides along (E2E audit 25 Jul 2026, 4c520ce9) — only fetched when
  // the window events were fetched too, so injected-events callers stay offline.
  const afk = deps.afk !== undefined ? deps.afk : (deps.events !== undefined ? null : await fetchAfkEvents(deps));
  const f = focusRead(events, now, deps.matcher || null, FOCUS, afk);
  const prevFocus = deps.prevFocus !== undefined ? deps.prevFocus : findPrev(r => r && r.kind === "focus");
  const frow = { ts: now.toISOString(), day: dayKey(now), kind: "focus", ...f, tone: tone.arousal, posted: false };
  if (f.break_live && !(prevFocus && prevFocus.break_live) && tone.arousal !== "conserve") {
    // #6, same law on this lane — but NO sprint fallback here. The pull words name
    // what dragged him AWAY ("youtube", "cricket"); calling today's study ground the
    // concept of a distraction would be a fabrication, not a prior.
    const pullCanon = conceptTokens(f.pull_words, deps.registry !== undefined ? deps.registry : conceptRegistry());
    frow.posted = await post({
      modality: "bus", source: "presence", event_key: "focus:break", stall: false,
      text: `the thread snapped: ${f.break_run_min}min off after ${f.focus_min}min of work${f.pull ? " — pulled by " + f.pull : ""}`,
      concept_tokens: pullCanon, concept_source: pullCanon.length ? "pull-title-canon" : "none",
      pull_words: f.pull_words,                 // the raw distraction words, kept, under their real name
    });
  }
  append(frow);
  return { ok: true, edge, posted: row.posted, telemetry: t, focus: frow, concepts: cw, rolled, muted: edge && tone.arousal === "conserve" };
}

// A FIXTURE of the Time-Auditor's config shape — the selftest asserts the
// matcher's LOGIC against this, never against the captain's live buckets.json
// (E2E audit 25 Jul 2026, 2509d6fc: renaming a bucket in his own config used to
// turn this file red and send organism-doctor hunting a bug that wasn't there).
const FIXTURE_BUCKETS = {
  browsers: ["chrome", "msedge", "firefox"],
  rules: {
    Learning: { apps: ["obsidian.exe"], domains: ["colab.research.google.com"] },
    Building: { apps: ["code.exe"], domains: ["github.com"] },
  },
};
// A FIXTURE of capture.mjs's registry shape (same reason as FIXTURE_BUCKETS: the
// selftest must test the LOGIC, never the captain's live concepts.json — adding a
// concept to his canon may not turn this file red).
const FIXTURE_REG = {
  loaded: true,
  conceptAlias: new Map([["attention", "attention"], ["attention mechanism", "attention"], ["hallucinations", "hallucinations"], ["hallucination", "hallucinations"]]),
  skillAlias: new Map([["python basics", "python_basics"], ["python", "python_basics"]]),
};

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date("2026-07-14T15:00:00");
  const mkEvents = (n, spanMin, title = "attention is all you need - Google Docs") => Array.from({ length: n }, (_, i) => ({
    timestamp: new Date(now.getTime() - spanMin * 60000 + i * (spanMin * 60000 / n)).toISOString(),
    data: { app: i % 2 ? "chrome.exe" : "Code.exe", title: i % 2 ? title : "editor " + i },
  }));

  // telemetry
  {
    const t = thrashTelemetry(mkEvents(40, 8), now);
    assert("telemetry: switches counted across app/title changes", t.switches === 39 && t.span_min > 6);
    assert("telemetry: the working surface leaks a concept hint (top words)", t.top_words.includes("attention"));
    assert("thrash at 5+/min over 6+ min = the leading edge", isLeadingEdge(t, SIGNATURE) === true);
    const calm = thrashTelemetry(mkEvents(6, 9), now);
    assert("calm work (few switches) is NOT a stall — silence", isLeadingEdge(calm, SIGNATURE) === false);
    const burst = thrashTelemetry(mkEvents(35, 3), now);
    assert("a 3-minute burst alone is NOT enough (span guard — no hair trigger)", isLeadingEdge(burst, SIGNATURE) === false);
    assert("stale events outside the 10-min window ignored", thrashTelemetry(mkEvents(40, 60), now).switches < 39);
    assert("empty/short telemetry never crashes", thrashTelemetry([], now).switches === 0 && thrashTelemetry(null, now).switches === 0);
  }
  // the sense pass
  // Every sense() call below injects matcher + prevEdge + prevFocus (E2E audit
  // 25 Jul 2026, 2509d6fc): without them the pass reaches for the LIVE
  // buckets.json and the LIVE presence_log.jsonl, so the selftest's verdict
  // depended on the captain's config and on whether he happened to be thrashing
  // an hour ago. A selftest that reads live state tests the day, not the code.
  {
    const fx = bucketsMatcher(FIXTURE_BUCKETS);
    // `roll: null` and an injected registry/sprint keep the pass entirely off the
    // filesystem — a selftest that reads live state tests the day, not the code.
    const base = { now, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher: fx, prevEdge: { edge: false }, prevFocus: null, afk: null, roll: null, registry: FIXTURE_REG, sprint: null };
    const logs = []; let posted = null;
    const r = await sense({ ...base, events: mkEvents(40, 8), post: async (e) => { posted = e; return true; }, append: (x) => logs.push(x) });
    assert("leading edge + open tone → ONE afferent at the thalamus", r.edge && r.posted && posted.event_key === "stall:leading-edge");
    // #6 REGRESSION (audit 2 Aug 2026, finding 13). The OLD assertion here read
    // `posted.concept_tokens.includes("attention")` against a fixture title that
    // happened to contain a concept — it encoded the very assumption that failed in
    // production (real titles read "google", "chrome", "claude"; 0 of 95 stalls ever
    // matched the DMN precache). It could not fail, so it protected nothing. The
    // three assertions below test the actual contract: canon in, chrome out.
    assert("#6 the afferent's concept_tokens are CANON ids (title word → registered concept)",
      Array.isArray(posted.concept_tokens) && posted.concept_tokens.includes("attention") && posted.concept_source === "window-title-canon");
    assert("#6 browser chrome NEVER reaches concept_tokens — it stays in title_words under its real name",
      !posted.concept_tokens.some(w => ["google", "chrome", "docs", "editor"].includes(w)) && Array.isArray(posted.title_words) && posted.title_words.includes("google"));
    assert("every pass logs telemetry (the season's stall dataset)", logs.length === 2 && logs[0].edge === true && logs[1].kind === "focus");
    // no canon in the title → the sprint's CURRENT task, said out loud in concept_source
    let postedS = null;
    await sense({ ...base, events: mkEvents(40, 8, "youtube - cricket highlights"), sprint: { progress: { current: { task: "Hallucinations" } } }, post: async (e) => { postedS = e; return true; }, append: () => {} });
    assert("#6 no canon in the title → fall back to sprint's current concept, and SAY so",
      postedS.concept_tokens.length === 1 && postedS.concept_tokens[0] === "hallucinations" && postedS.concept_source === "sprint-current");
    let postedN = null;
    await sense({ ...base, events: mkEvents(40, 8, "youtube - cricket highlights"), sprint: null, post: async (e) => { postedN = e; return true; }, append: () => {} });
    assert("#6 nothing canon anywhere → an HONEST empty array, never a window word dressed as a concept",
      Array.isArray(postedN.concept_tokens) && postedN.concept_tokens.length === 0 && postedN.concept_source === "none");
    let postedE = null;
    await sense({ ...base, events: mkEvents(40, 8), registry: EMPTY_REG, sprint: { progress: { current: { task: "Hallucinations" } } }, post: async (e) => { postedE = e; return true; }, append: () => {} });
    assert("#6 NO registry on disk → emit nothing (a missing canon may not become a licence to ship titles)",
      postedE.concept_tokens.length === 0 && postedE.concept_source === "none");
    let posted2 = null;
    const r2 = await sense({ ...base, events: mkEvents(40, 8), tone: { arousal: "conserve", effects: {} }, post: async () => { posted2 = true; return true; }, append: () => {} });
    assert("CONSERVE day: it senses but stays OFF the wire (rest is the agenda)", r2.edge && r2.muted && posted2 === null);
    const r3 = await sense({ ...base, events: mkEvents(5, 8), post: async () => { throw new Error("must not post"); }, append: () => {} });
    assert("no edge → no afferent (a false whisper costs trust)", r3.edge === false && r3.posted === false);
    const r4 = await sense({ now, events: null, tone: { arousal: "open", effects: {} }, append: () => { throw new Error("no log without telemetry"); } });
    assert("AW unreachable → honest skip, never a guess", r4.ok === false && r4.skipped.includes("unreachable"));
    // E2E audit 25 Jul 2026 regression (b6e6a127): the stall lane fired on EVERY
    // pass. A single 25-min thrash spell spans 3 scheduled passes → 3 afferents
    // → stalls_today = 3 off one episode. Onset only, now.
    let posted5 = null;
    const r5 = await sense({ ...base, events: mkEvents(40, 8), prevEdge: { edge: true }, post: async (e) => { posted5 = e; return true; }, append: () => {} });
    assert("an ONGOING thrash episode never re-fires — one afferent per onset, not per pass", r5.edge === true && r5.posted === false && posted5 === null);
    const logs6 = [];
    await sense({ ...base, events: mkEvents(40, 8), prevEdge: { edge: true }, post: async () => true, append: (x) => logs6.push(x) });
    assert("...but the muted pass STILL logs its edge row (calibrate's dataset stays whole)", logs6.length === 2 && logs6[0].edge === true && logs6[0].posted === false);
  }
  // the focus sentinel — the ledger of where his attention actually lived
  {
    const evts = [
      ...Array.from({ length: 20 }, (_, i) => ({ timestamp: new Date(now.getTime() - (26 - i) * 60000).toISOString(), duration: 60, data: { app: "Code.exe", title: "drill.py" } })),
      ...Array.from({ length: 6 }, (_, i) => ({ timestamp: new Date(now.getTime() - (6 - i) * 60000).toISOString(), duration: 60, data: { app: "chrome.exe", title: "cricket highlights youtube" } })),
    ];
    const matcher = (app) => String(app).includes("Code");
    const f1 = focusRead(evts, now, matcher);
    assert("SENTINEL: focus minutes counted, the live break seen with its pull", f1.focus_min >= 18 && f1.break_live === true && f1.pull === "chrome.exe" && f1.pull_words.includes("youtube"));
    let fposted = null;
    const fbase = { now, events: evts, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher, prevFocus: null, prevEdge: null, afk: null, roll: null, registry: FIXTURE_REG, sprint: null };
    const rF = await sense({ ...fbase, post: async (e) => { fposted = e; return true; }, append: () => {} });
    // #6 on the break lane: the words that pulled him are carried as pull_words. They
    // are NOT concepts ("youtube", "cricket"), so concept_tokens is honestly empty —
    // and there is deliberately NO sprint fallback here (see the emit site).
    assert("SENTINEL: break ONSET fires ONE focus:break afferent with the pull words", rF.focus.posted === true && fposted && fposted.event_key === "focus:break" && fposted.pull_words.includes("youtube"));
    assert("#6 a distraction is never relabelled as today's concept — concept_tokens stays empty on a break",
      Array.isArray(fposted.concept_tokens) && fposted.concept_tokens.length === 0 && fposted.concept_source === "none");
    let fposted2 = null;
    const rF2 = await sense({ ...fbase, prevFocus: { break_live: true }, post: async (e) => { fposted2 = e; return true; }, append: () => {} });
    assert("SENTINEL: an ONGOING break never re-fires (a nag is not a whisper)", rF2.focus.break_live === true && rF2.focus.posted === false && fposted2 === null);
    const rF3 = await sense({ ...fbase, tone: { arousal: "conserve", effects: {} }, post: async () => { throw new Error("must not post"); }, append: () => {} });
    assert("SENTINEL: conserve day — it watches, it never speaks", rF3.focus.break_live === true && rF3.focus.posted === false);
    assert("SENTINEL: empty telemetry = calm zeros, never an accusation", focusRead([], now, matcher).break_live === false && focusRead(null, now, matcher).focus_min === 0);

    // E2E audit 25 Jul 2026 regression (4c520ce9): the stated AFK law was never
    // implemented. He walks away for chai leaving cricket on screen — the window
    // watcher keeps billing those minutes, and the old read called it a snapped
    // thread. With the AFK truth those seconds belong to nobody.
    const afkAway = [{ timestamp: new Date(now.getTime() - 7 * 60000).toISOString(), duration: 7 * 60, data: { status: "afk" } }];
    const fAway = focusRead(evts, now, matcher, FOCUS, afkAway);
    assert("SENTINEL: away-from-keyboard is NOT a break — chai with a tab left open never accuses", f1.break_live === true && fAway.break_live === false && fAway.off_min === 0);
    const afkHere = [{ timestamp: new Date(now.getTime() - 40 * 60000).toISOString(), duration: 40 * 60, data: { status: "not-afk" } }];
    assert("SENTINEL: not-afk spans subtract nothing — at the machine, the break is still a break", focusRead(evts, now, matcher, FOCUS, afkHere).break_live === true);
    assert("SENTINEL: no AFK bucket → the old un-clipped read, never invented absence", focusRead(evts, now, matcher, FOCUS, null).break_live === true);
    assert("SENTINEL: the pre-audit engine stays frozen beside it (layering, never replace)", focusReadLegacy(evts, now, matcher).break_live === true);

    // E2E audit 25 Jul 2026 regression (cc7f9b1f): AW heartbeat-merges an
    // unbroken stretch into ONE event stamped at its START, so the old
    // timestamp>=cutoff filter deleted exactly his deepest work — 40 unbroken
    // minutes read as focus_min 0. Clip to the window instead of dropping.
    const merged = [{ timestamp: new Date(now.getTime() - 40 * 60000).toISOString(), duration: 40 * 60, data: { app: "Code.exe", title: "drill.py" } }];
    const fm = focusRead(merged, now, matcher);
    assert("SENTINEL: a merged deep-work event straddling the window edge counts its overlap (his best hour read 0 before)", fm.focus_min === FOCUS.window_min && focusReadLegacy(merged, now, matcher).focus_min === 0);
    assert("SENTINEL: a merged event that ENDED before the window is still ignored (no time travel)", focusRead([{ timestamp: new Date(now.getTime() - 90 * 60000).toISOString(), duration: 30 * 60, data: { app: "Code.exe", title: "drill.py" } }], now, matcher).focus_min === 0);

    // classification LOGIC against a fixture — his buckets.json is config, not a test
    const fx = bucketsMatcher(FIXTURE_BUCKETS);
    assert("SENTINEL: classification logic — app match, browser+domain match, and a domain never classifies a non-browser",
      fx("Code.exe", "x") === true && fx("chrome.exe", "colab.research.google.com — notebook") === true &&
      fx("chrome.exe", "cricket highlights youtube") === false && fx("notepad.exe", "github.com") === false);
  }

  // self-calibration: the sensor learns HIS normal
  {
    const mkRows = (days, rate) => Array.from({ length: days * 6 }, (_, i) => ({ day: `2026-07-${String(1 + (i % days)).padStart(2, "0")}`, rate: rate + (i % 3), switches: 20 + (i % 10), edge: false }));
    assert("under 5 days of telemetry → factory defaults hold (honest skip)", calibrate({ rows: mkRows(3, 2), write: () => { throw new Error("no"); } }).ok === false);
    assert("...and the honest skip is a have/need COUNTER, not a word (#106)",
      calibrate({ rows: mkRows(3, 2), write: () => {} }).have_days === 3 && calibrate({ rows: mkRows(3, 2), write: () => {} }).need_days === CALIBRATE.min_days);
    let fitted = null;
    const c = calibrate({ rows: mkRows(6, 6), write: (o) => { fitted = o; }, previous: null });
    assert("5+ days → thresholds fit to HIS p95 calm-work baseline (never below factory)", c.ok && fitted.min_switch_rate_per_min >= SIGNATURE.min_switch_rate_per_min);
    assert("the fit states its own population: the recency window and the days available (#106)",
      fitted.window_days === CALIBRATE.min_days && fitted.days_available === 6 && fitted.samples >= CALIBRATE.min_calm_samples && fitted.labelled_by === "factory-signature");
    const sigF = loadSignature({ fitted });
    assert("the fitted signature raises the bar for a high-baseline captain", sigF.min_switch_rate_per_min > SIGNATURE.min_switch_rate_per_min);
    const calmForHim = { span_min: 8, switches: 40, rate_per_min: 5.5 };
    assert("what was an 'edge' on factory becomes CALM once his normal is known", isLeadingEdge(calmForHim, SIGNATURE) === true && isLeadingEdge(calmForHim, sigF) === false);
    assert("no fitted file → factory signature, never crashes", loadSignature({ fitted: null }).min_switch_rate_per_min === 5);

    // ------------------------------------------------------------------
    // #50 REGRESSION (audit 2 Aug 2026, finding 23) — THE MONOTONE RATCHET.
    // The contaminated population, built exactly as the live ledger built it:
    // 40 genuinely calm rows, plus 20 rows that ARE stalls by the factory
    // signature (rate 7, 50 switches, 8-min span) but were written `edge:false`
    // because a previously-raised bar was in force. Those 20 are the feedback.
    // ------------------------------------------------------------------
    const calmRows = Array.from({ length: 40 }, (_, i) => ({ day: `2026-07-${String(10 + (i % 5)).padStart(2, "0")}`, rate: 2, switches: 10, span_min: 8, edge: false }));
    const feedbackRows = Array.from({ length: 20 }, (_, i) => ({ day: `2026-07-${String(10 + (i % 5)).padStart(2, "0")}`, rate: 7, switches: 50, span_min: 8, edge: false }));
    const contaminated = [...calmRows, ...feedbackRows];
    let fRatchet = null, fFixed = null;
    calibrateLegacy({ rows: contaminated, write: (o) => { fRatchet = o; } });
    const cFixed = calibrate({ rows: contaminated, write: (o) => { fFixed = o; }, previous: null });
    assert("#50 the FROZEN-label fit swallows its own output and climbs (the legacy engine, kept as the record)",
      fRatchet.min_switch_rate_per_min > SIGNATURE.min_switch_rate_per_min);
    assert("#50 relabelling from the FACTORY signature excludes every feedback row and holds the bar flat",
      fFixed.min_switch_rate_per_min === SIGNATURE.min_switch_rate_per_min && fFixed.min_total_switches === SIGNATURE.min_total_switches &&
      fFixed.min_switch_rate_per_min < fRatchet.min_switch_rate_per_min);
    assert("#50 the excluded feedback rows are COUNTED and reported, not silently dropped (#4)",
      cFixed.frozen_label_calm === 60 && cFixed.factory_label_calm === 40 && cFixed.ratchet_rows_excluded === 20);
    // A ratchet is a ratchet because it cannot fall. Prove this one can.
    const quiet = Array.from({ length: 40 }, (_, i) => ({ day: `2026-07-${String(10 + (i % 5)).padStart(2, "0")}`, rate: 1, switches: 5, span_min: 8, edge: true }));
    assert("#50 a calmer week can LOWER the bar again — the fit is no longer one-way",
      calibrate({ rows: quiet, write: () => {}, previous: { min_switch_rate_per_min: 7.4, min_total_switches: 59 } }).direction.startsWith("down"));
    // THE RECENCY WINDOW (the co-defect): old, wilder days must not set today's normal.
    const oldWild = Array.from({ length: 60 }, (_, i) => ({ day: `2026-06-${String(1 + (i % 10)).padStart(2, "0")}`, rate: 4.9, switches: 29, span_min: 8, edge: false }));
    const recentCalm = Array.from({ length: 40 }, (_, i) => ({ day: `2026-07-${String(20 + (i % 5)).padStart(2, "0")}`, rate: 1, switches: 5, span_min: 8, edge: false }));
    const win = calibrate({ rows: [...oldWild, ...recentCalm], write: () => {}, previous: null });
    assert("#50 the recency window fits the FEWEST recent days that clear the minimums — ancient behaviour no longer dilutes his normal",
      win.window_days === CALIBRATE.min_days && win.days_available === 15 && win.window_from === "2026-07-20" && win.samples === 40);
    assert("#50 the window is DERIVED from the function's own pre-existing minimums, never a chosen number",
      CALIBRATE.min_days === 5 && CALIBRATE.min_calm_samples === 20);
    // the trap, asserted so nobody re-proposes it: 1.5 x factory is BELOW the live fit
    assert("#50 TRAP: a '1.5x factory' cap would LOWER the switch bar (1.5x30=45 < the fitted 53/59) — not used",
      Math.round(SIGNATURE.min_total_switches * 1.5) === 45);
    // focus rows carry no rate/switches and must never enter the calm pool
    assert("#50 focus-ledger rows are not sense passes and never reach the fit",
      calibrate({ rows: [...contaminated, ...Array.from({ length: 50 }, () => ({ day: "2026-07-11", kind: "focus", focus_min: 9 }))], write: () => {}, previous: null }).factory_label_calm === 40);
  }

  // the wire and the vitals — E2E audit 25 Jul 2026 regressions
  {
    // a7262423: the events leg used to be a bare fetch with no abort signal, so
    // a wedged-but-listening AW hung the pass for ~5 min instead of 4 seconds.
    const seen = [];
    const fakeFetch = async (url, opts) => {
      seen.push({ url: String(url), signal: !!(opts && opts.signal) });
      return { json: async () => (String(url).includes("/events") ? [{ timestamp: now.toISOString(), duration: 1, data: {} }] : { "aw-watcher-window_pc": {}, "aw-watcher-afk_pc": {} }) };
    };
    const evs = await fetchWindowEvents({ fetchFn: fakeFetch });
    assert("BOTH AW legs carry an abort signal — a half-alive watcher can never hang the pass", seen.length === 2 && seen.every(s => s.signal) && Array.isArray(evs));
    seen.length = 0;
    const afkEvs = await fetchAfkEvents({ fetchFn: fakeFetch });
    assert("the AFK bucket is fetched under the same 4s guard (presence truth, same rules)", Array.isArray(afkEvs) && seen.length === 2 && seen[1].url.includes("aw-watcher-afk"));
    assert("a missing bucket is an honest null, not an empty guess", await fetchAwEvents("aw-watcher-nothing", { fetchFn: fakeFetch }) === null);

    // b831d29c: each pass appends TWO rows (thrash + focus), so `status` read
    // rows.length and reported double the real number of passes.
    const day = [{ edge: false, posted: false }, { kind: "focus" }, { edge: true, posted: true }, { kind: "focus" }];
    assert("status counts sense PASSES, not rows — the focus ledger row is not a second pass", sensePassRows(day).length === 2 && day.length === 4);
  }

  // ------------------------------------------------------------------------
  // #51 — THE MONTHLY ROLL + THE SHARED TAIL READER, on REAL files in a temp dir.
  // An unrun rotation is a hypothesis; this one actually moves bytes on disk.
  // ------------------------------------------------------------------------
  {
    const dir = mkdtempSync(join(tmpdir(), "arsenal-presence-"));
    const file = join(dir, "presence_log.jsonl");
    const mk = (day, i, kind) => (kind
      ? { ts: `${day}T0${i % 10}:00:00.000Z`, day, kind, focus_min: i, posted: false }
      : { ts: `${day}T0${i % 10}:00:00.000Z`, day, switches: 10 + i, rate: 1, span_min: 8, edge: false, posted: false });
    const july = [], aug = [];
    for (let i = 0; i < 30; i++) { july.push(mk("2026-07-20", i)); july.push(mk("2026-07-20", i, "focus")); }
    for (let i = 0; i < 6; i++) { aug.push(mk("2026-08-02", i)); aug.push(mk("2026-08-02", i, "focus")); }
    const writeAll = (rows) => writeFileSync(file, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
    try {
      writeAll([...july, ...aug]);
      const aug4 = new Date("2026-08-04T09:00:00");
      // the un-rolled layout must work exactly as before — nothing may break mid-flight
      assert("#51 UN-ROLLED layout: the tail reader answers from the live file alone",
        presenceTailReport(6, { file }).rows.length === 6 && presenceTailReport(6, { file }).archives === 0 &&
        presenceTailReport(6, { file }).rows.every(r => r.day === "2026-08-02"));
      assert("#51 asking for more rows than exist is an honest SHORT answer, never a padded one",
        presenceTailReport(500, { file }).complete === false && presenceTailReport(500, { file }).rows.length === 72);
      const due = rollDue(aug4, { file });
      assert("#51 the roll is DUE when the ledger's oldest row predates the current month (one bounded head read)",
        due.due === true && due.first_month === "2026-07" && due.current_month === "2026-08");
      const r1 = rollPresenceLog(aug4, { file });
      const arch = archivePath(file, "2026-07");
      assert("#51 the roll MOVES the past month into presence_log.<YYYY-MM>.jsonl and keeps the current month live",
        r1.rolled === true && r1.moved === 60 && r1.kept === 12 && existsSync(arch) &&
        readLines(arch).length === 60 && readLines(file).length === 12);
      assert("#51 the archive filename is the sibling shape brain.mjs/dugout.mjs already glob for",
        archiveSiblings(file).length === 1 && basename(archiveSiblings(file)[0]) === "presence_log.2026-07.jsonl");
      assert("#51 nothing is ever LOST by a roll — every archived row is byte-identical to what left the ledger",
        JSON.stringify(readLines(arch)) === JSON.stringify(july));
      assert("#51 a second roll is a no-op with an honest reason (idempotent)",
        rollPresenceLog(aug4, { file }).rolled === false && maybeRoll(aug4, { file }).rolled === false);
      // a concurrent sense pass appending mid-roll must survive the rewrite
      writeAll([...july, ...aug]);
      const late = mk("2026-08-04", 9);
      const rLate = rollPresenceLog(aug4, { file, reread: () => [...july, ...aug, late] });
      assert("#51 a row appended DURING the roll survives the rewrite (the append-only law holds through rotation)",
        rLate.kept === 13 && rLate.late_rows_preserved === 1 && readLines(file).length === 13 &&
        readLines(file).slice(-1)[0].ts === late.ts);
      // crash simulation: the archive landed, the live rewrite did not. Re-running
      // must not duplicate a single row.
      writeAll([...july, ...aug]);
      const r2 = rollPresenceLog(aug4, { file });
      assert("#51 a crash BETWEEN the archive write and the live rewrite costs a re-run, never a duplicate",
        r2.rolled === true && readLines(arch).length === 60 && r2.archives[0].appended === 0 && r2.archives[0].already_there === 60);
      // after the roll the tail reader must walk back into the archive
      const across = presenceTailReport(20, { file });
      assert("#51 ROLLED layout: the tail read walks back into the archive and returns rows OLDEST-LAST",
        across.rows.length === 20 && across.complete === true && across.archives === 1 &&
        across.rows.slice(0, 8).every(r => r.day === "2026-07-20") && across.rows.slice(-12).every(r => r.day === "2026-08-02"));
      const dayRep = presenceDayReport("2026-08-02", { file });
      assert("#51 a day count PROVES it reached past midnight before reporting a total (#4)",
        dayRep.rows.length === 12 && dayRep.covers_boundary === true && sensePassRows(dayRep.rows).length === 6);
      // the pass-time lookups: found from the tail, and widened when the tail is short
      const rPrev = await sense({ now, events: mkEvents(5, 8), tone: { arousal: "open", effects: {} }, signature: SIGNATURE,
        matcher: bucketsMatcher(FIXTURE_BUCKETS), afk: null, roll: null, registry: EMPTY_REG, sprint: null, plog: file,
        post: async () => true, append: () => {} });
      assert("#51 the sense pass finds its previous rows from the ledger TAIL (no whole-file parse)", rPrev.ok === true);
      writeAll([mk("2026-08-02", 0), ...Array.from({ length: 10 }, (_, i) => mk("2026-08-02", i, "focus"))]);
      assert("#51 when the tail holds no matching row the window WIDENS — 'I did not look far enough' is never 'there is none'",
        presenceTailReport(4, { file }).rows.filter(r => !r.kind).length === 0 &&
        presenceTailReport(16, { file }).rows.filter(r => !r.kind).length >= 1);
      // the repo is PUBLIC: a roll must never create an un-ignored file in silence
      assert("#51 SECRETS: a literal `presence_log.jsonl` ignore line does NOT cover the archives — and the organ says so",
        archiveIgnoreGap({ file, gitignore: "dressing-room/state/presence_log.jsonl\n" }).gap === true &&
        archiveIgnoreGap({ file, gitignore: "dressing-room/state/presence_log.*.jsonl\n" }).gap === false &&
        archiveIgnoreGap({ file: join(dir, "no_such_log.jsonl"), gitignore: "" }).gap === false);
    } finally { try { rmSync(dir, { recursive: true, force: true }); } catch {} }
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    // #106: have/need counters, never a status word — and the fit is stated with the
    // population it was fitted on, so a ratcheted bar can be SEEN rather than trusted.
    const day = dayKey();
    const d = presenceDayReport(day);
    const rows = d.rows, passes = sensePassRows(rows), edges = passes.filter(r => r.edge);
    const sig = loadSignature(), fitted = readJson(THRESHOLDS);
    console.log(`presence: ${passes.length} sense pass(es) today · ${edges.length} leading edge(s) · ${edges.filter(r => r.posted).length} posted to the thalamus`);
    console.log(`  bar in force: ${sig.min_switch_rate_per_min}/min + ${sig.min_total_switches} switches over ${sig.min_span_min}min` +
      (fitted ? ` — fitted ${String(fitted.fitted_at).slice(0, 10)} on ${fitted.samples || "?"} calm sample(s) across ${fitted.window_days || fitted.days || "?"} day(s), labelled by ${fitted.labelled_by || "the FROZEN edge field (pre-#50 fit — refit to clear the ratchet)"}`
              : ` — FACTORY (no fit on disk yet)`));
    const recent = presenceTailReport(CALIBRATE_FIRST_ROWS, {});
    const recentPass = sensePassRows(recent.rows).filter(hasTelemetry);
    const w = calmWindow(recentPass);
    console.log(`  calibration readiness: ${new Set(recentPass.map(r => r.day).filter(Boolean)).size}/${CALIBRATE.min_days} day(s) · ${w.calm.length}/${CALIBRATE.min_calm_samples} calm sample(s) in the last ${recent.rows.length} ledger row(s)` +
      (w.enough ? ` — the Sunday fit will run on the last ${w.window.length} day(s)` : " — the Sunday fit will SKIP and the factory signature holds"));
    console.log(`  ledger: read ${d.scanned_rows} row(s) from ${d.files} file(s) (${d.archives} archive(s))` +
      (d.covers_boundary ? " — the window reached past midnight, today's count is complete" : " — WINDOW DID NOT REACH MIDNIGHT: today's count is a floor, not a total"));
    const g = archiveIgnoreGap();
    if (g.gap) console.log(`  ⚠ SECRETS: ${g.archives} rolled archive(s) are NOT covered by .gitignore (it names presence_log.jsonl literally). The repo is PUBLIC. Add:  ${g.needed_line}`);
    return;
  }
  if (mode === "roll") {
    const r = maybeRoll(new Date());
    console.log(r.rolled
      ? `presence: rolled ${r.moved} row(s) into ${r.months.join(", ")} (${r.appended} newly archived, ${r.kept} kept live) — ${r.archives.map(a => basename(a.file) + ":" + a.rows).join(" · ")}`
      : `presence: no roll — ${r.reason}`);
    const g = archiveIgnoreGap();
    if (g.gap) console.log(`  ⚠ SECRETS: ${g.archives} rolled archive(s) are NOT covered by .gitignore (it names presence_log.jsonl literally). The repo is PUBLIC. Add:  ${g.needed_line}`);
    return;
  }
  if (mode === "calibrate") {
    const c = calibrate();
    if (!c.ok) { console.log(`presence: ${c.skipped}`); return; }
    console.log(`presence: fitted to HIS baselines — rate bar ${c.min_switch_rate_per_min}/min, switches ${c.min_total_switches}`);
    console.log(`  population: ${c.samples} calm sample(s) over ${c.window_days}/${c.days_available} day(s) (${c.window_from} → ${c.window_to}), labelled by ${c.labelled_by}`);
    console.log(`  ratchet check: the frozen edge field would have called ${c.frozen_label_calm} row(s) calm; the factory signature calls ${c.factory_label_calm}. ${c.ratchet_rows_excluded} feedback row(s) excluded.`);
    console.log(`  direction vs previous: ${c.direction}${c.previous ? ` (was ${c.previous.min_switch_rate_per_min}/min, ${c.previous.min_total_switches} switches)` : ""}`);
    return;
  }
  if (mode === "sense") {
    const demo = process.argv.includes("--demo");
    const t0 = Date.now();                          // hoisted once — a mid-build clock tick shaved the rate under the bar (scar)
    const r = await sense(demo ? { events: Array.from({ length: 48 }, (_, i) => ({ timestamp: new Date(t0 - 8 * 60000 + i * 10000).toISOString(), data: { app: i % 2 ? "chrome.exe" : "Code.exe", title: i % 2 ? "attention scaling doubt - search" : "drill.py - editor" } })) } : {});
    console.log(r.ok ? `presence: ${r.edge ? (r.posted ? "LEADING EDGE — afferent posted" : r.muted ? "leading edge, MUTED (conserve)" : "leading edge, thalamus asleep") : "calm"} (${r.telemetry.switches} switches / ${Math.round(r.telemetry.span_min)}min)` : `presence: ${r.skipped}`);
    return;
  }
  console.log("presence.mjs — sense [--demo] | status | calibrate | roll | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { thrashTelemetry, isLeadingEdge, sense, calibrate, calibrateLegacy, calmWindow, factoryEdge, CALIBRATE,
         loadSignature, SIGNATURE, focusRead, focusReadLegacy, awayIntervals, bucketsMatcher, sensePassRows,
         fetchAwEvents, fetchWindowEvents, fetchAfkEvents, FOCUS,
         // #51 — the shared, archive-tolerant readers the other four call sites can import
         presenceTail, presenceTailReport, presenceDayReport, rollPresenceLog, rollDue, maybeRoll, archiveSiblings, archivePath,
         // #6 — the producer-side concept canon
         stallConcepts, conceptTokens, canonToken, conceptRegistry, sprintConcept };
