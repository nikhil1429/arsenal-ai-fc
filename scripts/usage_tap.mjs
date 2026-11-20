#!/usr/bin/env node
// scripts/usage_tap.mjs — THE USAGE TAP (unit mpool · forks rows 1045 / 1052 / 1062 / 1066).
//
// WHAT IT IS. The pool reads itself. Claude Code hands both usage percents and both reset times, every turn, to the
// statusLine command's stdin (`rate_limits.five_hour` / `rate_limits.seven_day`: `used_percentage` + `resets_at`,
// epoch seconds; spec ci/mpool/MPOOL_SPEC.md M8). This tap IS that statusLine command: it turns the block into ONE
// reading file, so no cloud window waits on him typing two numbers (his words 240 and 245).
//
// THE CONTRACT (header = contract; every line below is a code path in this file):
//   · SOLE WRITER of `usage_reading.json` and `usage_readings.jsonl` — and of nothing else (unit mguard, row 1176 G1 A /
//     G4 A). Both live in the CAMPAIGN ROOT (row 1062 F1 A), outside this public repository: code public, data private.
//     The reading's write is atomic (tmp + rename) and the tmp sits beside it. THE WRITE LAW NAMES EXACTLY THREE WRITES:
//     that tmp, that rename, and the history's one-line append.
//   · THE READING HISTORY (row 1176 G1 A): statusline and panel also append the reading to `usage_readings.jsonl`, only
//     when it differs from the history's last row in a pct or a reset (dedupe by value: no typed count, no typed
//     interval) — or when the row records what the line SHOWED (below).
//   · THE SPAN READER `spanSpend(readings, span, rule)` — PURE (row 1176 G2/G3): r0 = the last row at or before the span's
//     start, r1 = the first at or after its end; each edge gap under the age bound from its law home, else UNREAD
//     (unbracketed). A window whose reset falls inside [r0, r1], or whose reset is unknown, is UNREAD (rolled / reset
//     unknown — G3 A: an unread is never a green). Else spent = r1 − r0 and left = 100 − r1, over the bracket — a COVER
//     of the span, stated as such, never claimed to be the span exactly.
//   · THE AWAY REPORT (row 1176 G5 A read and show only · G6 A · G7 A): on a render, the CLOSED away spans presence's
//     latest focus row records (its read-only reader `awaySpans`, a bounded tail read) that end after the last span the
//     history SHOWED become the line `back · away <span> · spent … · left …` (or `spend unread (<why>)`), and the
//     appended row carries `shown: [{ span, read, why, five, week }]` — so what he saw is on disk. It never throttles,
//     never stops a launch, never files a card. G6 B (the learn-start note) is the named fallback, not built here.
//   · ENV DOOR `ARSENAL_CAMPAIGN_ROOT` — the one way the tap finds the campaign root. DEFAULT ABSENT. Absent (or not a
//     directory) ⇒ every verb writes NOTHING and says so in its one line (row 1062 ADDED (ii)).
//   · NO SILENT DROP (row 1176 (3)): with no root, a status-line reading is never dropped into nothing — the statusline
//     line (and a stderr line) reads RED by the door's name and says the reading was DROPPED; `status`, `verdict` and
//     `need` read RED by the same name. Fail open keeps its meaning (exit 0, one line, inside the bound); what it never
//     does is fail open into a line that looks like a reading. A write that throws reads RED the same way.
//   · THE AGE BOUND is NEVER typed here (row 1062 F4 A). Its law home is the campaign's `tools/model_law.mjs` under the
//     root, read as TEXT for ONE contract line `POOL_READING_MAX_AGE_MIN` (= or :) <whole minutes>; never imported,
//     never executed. No such line ⇒ every verdict is WAIT · rule unreadable (never a default number).
//   · RULE 4 (row 1062 F4 "plus rule 4"): `now ≥ resets_at` of a window ⇒ the window the reading measured has rolled
//     ⇒ WAIT. A reading with no reset time (his panel, F9 A) is judged by the age bound alone.
//   · NO PERCENT LINE (row 1062 F5 B): the tap REPORTS, the gate decides. A 99 % reading that is fresh and whole is GO.
//   · THE VERDICT is computed at READ time and NEVER stored (spec P3). `verdict` exits 0 = GO, 3 = WAIT (F6 B).
//   · NO CREDENTIAL, EVER (row 1062 F2 A): no code here reads his login credential or any OAuth file.
//   · NOT A POOL SOURCE: the organism's own spend gauge (spec M5) — an estimate of the organism's spend, blind to a
//     runner session and to his study. This tap never opens it and never imports its owner.
//   · FAILS OPEN (row 1062 ADDED (i)): the statusline verb always exits 0 with one line on stdout, and returns inside the
//     ruled one second — a guard fires one measured boot before the bound if stdin never closes. It can never block or
//     blank his terminal.
//   · THE FALLBACK CARD (row 1062 F7 B, F8, F10 A): `need` files ONE keyed card through the owner's door
//     (captains_call.mjs file --key usage:panel:<IST day>) only on a WAIT for want of a source; his spoken numbers
//     become a reading only by the SESSION running `panel`. The card line names no command.
//
// VERBS
//   node scripts/usage_tap.mjs statusline     the statusLine command: stdin JSON → the reading; prints one line
//   node scripts/usage_tap.mjs panel --five <pct> --week <pct> [--five-reset <iso>] [--week-reset <iso>]
//                                             run BY THE SESSION when he SPEAKS his panel; source "his-panel"
//   node scripts/usage_tap.mjs verdict        read-only: GO | WAIT · why, one line, exit 0 / 3
//   node scripts/usage_tap.mjs need           read-only on the reading; on WAIT-for-no-source files ONE keyed card
//   node scripts/usage_tap.mjs status         the reading and its verdict, one line each, exit 0
//   node scripts/usage_tap.mjs selftest       hermetic: every plant under os.tmpdir()
//
// EXPORTS  readReading(path) — parse only, never throws · readRule(root) · verdict(reading, now, rule) — PURE ·
//          parseStatusline(text, now) · readingPath(root) · historyPath(root) · readHistory(path) ·
//          spanSpend(readings, span, rule) — PURE · awayReport(history, reading, away, rule) — PURE

import { readFileSync, writeFileSync, renameSync, statSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DOOR = "ARSENAL_CAMPAIGN_ROOT";
const READING_NAME = "usage_reading.json";
const HISTORY_NAME = "usage_readings.jsonl";
const LAW_HOME = ["tools", "model_law.mjs"];
const LAW_LINE = /^\s*(?:export\s+const\s+)?POOL_READING_MAX_AGE_MIN\s*[:=]\s*(\d+)\s*[;,]?\s*(?:\/\/.*)?$/m;
const CALL = join(__dirname, "captains_call.mjs");
// THE RULED BOUND (row 1062 ADDED (i), his architect's words: "returns inside one second"). A ruling's value, not ours.
const RULED_STATUSLINE_BOUND_S = 1;
const MS_PER_S = 1000;                       // unit conversion
const MS_PER_MIN = 60 * MS_PER_S;            // unit conversion
const PCT_SCALE = 100;                       // the CLI's own scale: used_percentage is 0..100
const EXIT_GO = 0, EXIT_WAIT = 3, EXIT_REFUSED = 2;

// ── where things live ───────────────────────────────────────────────────────────────────────────────────────────────
/** the campaign root from its env door, or null (absent, empty or not a directory) */
export function campaignRoot(env = process.env) {
  const r = env[ROOT_DOOR];
  if (!r) return null;
  try { return statSync(r).isDirectory() ? r : null; } catch { return null; }
}
/** @param {string} root */
export const readingPath = (root) => join(root, READING_NAME);
/** the history's one home (row 1176 G1 A); every other reader derives it from here @param {string} root */
export const historyPath = (root) => join(root, HISTORY_NAME);

// ── reading ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** parse only — never throws; null when absent or unreadable @param {string} path */
export function readReading(path) {
  try { const j = JSON.parse(readFileSync(path, "utf8")); return j && typeof j === "object" ? j : null; } catch { return null; }
}
/** the age bound from its law home, as TEXT; null when unreadable @param {string|null} root */
export function readRule(root) {
  if (!root) return null;
  let t; try { t = readFileSync(join(root, ...LAW_HOME), "utf8"); } catch { return null; }
  const m = LAW_LINE.exec(t);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n > 0 ? { maxAgeMin: n } : null;
}

/** the history, oldest first — parse only, never throws; a torn or foreign line is skipped @param {string} path */
export function readHistory(path) {
  let t; try { t = readFileSync(path, "utf8"); } catch { return []; }
  const rows = [];
  for (const l of t.split(/\r?\n/)) { if (!l.trim()) continue; try { const j = JSON.parse(l); if (j && typeof j === "object") rows.push(j); } catch { /* a torn line is not a row */ } }
  return rows;
}

const pctOk = (p) => typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= PCT_SCALE;
const isoOrNull = (s) => { if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) return null; const d = new Date(s * MS_PER_S); return Number.isNaN(d.getTime()) ? null : d.toISOString(); };

/**
 * The statusLine stdin → a reading, or a refusal. PURE.
 * @param {string} text  @param {Date} now
 * @returns {{ reading: object|null, why: string }}
 */
export function parseStatusline(text, now) {
  let j; try { j = JSON.parse(text); } catch { return { reading: null, why: "stdin is not JSON" }; }
  if (!j || typeof j !== "object") return { reading: null, why: "stdin is not a JSON object" };
  const rl = j.rate_limits;
  if (!rl || typeof rl !== "object") return { reading: null, why: "no rate_limits block (before the first API response, or not reported)" };
  const win = (w) => {
    if (w === undefined || w === null) return { ok: true, v: null };
    if (typeof w !== "object" || !pctOk(w.used_percentage)) return { ok: false };
    if (w.resets_at !== undefined && w.resets_at !== null && isoOrNull(w.resets_at) === null) return { ok: false };
    return { ok: true, v: { pct: w.used_percentage, resets_at: isoOrNull(w.resets_at) } };
  };
  const five = win(rl.five_hour), week = win(rl.seven_day);
  if (!five.ok || !week.ok) return { reading: null, why: "a rate_limits window is malformed (percent outside the CLI's scale, or not a number)" };
  if (!five.v && !week.v) return { reading: null, why: "the rate_limits block carries no window" };
  return {
    reading: {
      v: 1, source: "statusline", read_at: now.toISOString(), five: five.v, week: week.v,
      cli_version: typeof j.version === "string" ? j.version : null,
      session_id: typeof j.session_id === "string" ? j.session_id : null,
    },
    why: "read",
  };
}

/** the one write this organ makes @param {string} root @param {object} reading */
function writeReading(root, reading) {
  const path = readingPath(root), tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(reading, null, 2) + "\n");
  renameSync(tmp, path);
}

const winKey = (w) => w ? `${w.pct}@${w.resets_at ?? ""}` : "none";
/** same pcts and same resets, both windows @param {object|null} a @param {object|null} b */
const sameValue = (a, b) => !!a && !!b && winKey(a.five) === winKey(b.five) && winKey(a.week) === winKey(b.week);
/** the history's one write: a single appended line @param {string} root @param {object} row */
function appendHistory(root, row) {
  appendFileSync(historyPath(root), JSON.stringify(row) + "\n");
}

// ── the span reader — PURE (row 1176 G2 A / G3 A) ────────────────────────────────────────────────────────────────
const tOf = (r) => Date.parse(r && r.read_at);
/**
 * What the pool spent across one away span, from the reading history.
 * @param {object[]} readings  @param {{start:string,end:string}} span  @param {{maxAgeMin:number}|null} rule
 * @returns {{ read: boolean, why: string, bracket: string[]|null, five: object|null, week: object|null }}
 */
export function spanSpend(readings, span, rule) {
  const U = (why, bracket = null, five = null, week = null) => ({ read: false, why, bracket, five, week });
  if (!rule || !Number.isInteger(rule.maxAgeMin) || rule.maxAgeMin <= 0) return U("rule unreadable");
  const s = Date.parse(span && span.start), e = Date.parse(span && span.end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return U("span unreadable");
  const rows = (Array.isArray(readings) ? readings : []).filter((r) => r && Number.isFinite(tOf(r))).sort((a, b) => tOf(a) - tOf(b));
  let r0 = null;
  for (const r of rows) if (tOf(r) <= s) r0 = r;
  const r1 = rows.find((r) => tOf(r) >= e) || null;
  const bound = rule.maxAgeMin * MS_PER_MIN;
  if (!r0 || !r1) return U("unbracketed");
  const bracket = [r0.read_at, r1.read_at];
  if (s - tOf(r0) >= bound || tOf(r1) - e >= bound) return U("unbracketed", bracket);
  const between = rows.filter((r) => tOf(r) >= tOf(r0) && tOf(r) <= tOf(r1));
  const win = (k) => {
    const a = r0[k], b = r1[k];
    if (!a || !b || !pctOk(a.pct) || !pctOk(b.pct)) return { read: false, why: "half" };
    for (const r of between) {
      const rs = r[k] && r[k].resets_at;
      if (rs == null) return { read: false, why: "reset unknown" };
      const rt = Date.parse(rs);
      if (!Number.isFinite(rt)) return { read: false, why: "reset unknown" };
      if (rt > tOf(r0) && rt <= tOf(r1)) return { read: false, why: "rolled" };
    }
    if (b.pct < a.pct) return { read: false, why: "rolled" };
    return { read: true, spent: b.pct - a.pct, left: PCT_SCALE - b.pct };
  };
  const five = win("five"), week = win("week");
  const read = five.read && week.read;
  return { read, why: read ? "read" : /** @type {string} */ ((five.read ? week : five).why), bracket, five, week };
}

/**
 * The away report for one render — PURE. The closed spans that end after the last span the history showed (and after
 * the history's first row: before it there is nothing to bracket), each read by spanSpend over the history plus this
 * render's reading.
 * @param {object[]} history  @param {object} reading  @param {{spans:{start:string,end:string}[]}|null} away  @param {{maxAgeMin:number}|null} rule
 * @returns {object[]} the `shown` entries, oldest span first ([] when there is nothing new)
 */
export function awayReport(history, reading, away, rule) {
  if (!away || !Array.isArray(away.spans) || !history.length) return [];
  const shownEnds = history.flatMap((r) => Array.isArray(r.shown) ? r.shown.map((x) => Date.parse(x && x.span && x.span[1])) : []).filter(Number.isFinite);
  const after = Math.max(tOf(history[0]), ...shownEnds);
  const rows = [...history, reading];
  return away.spans.filter((sp) => Date.parse(sp.end) > after).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((sp) => { const r = spanSpend(rows, sp, rule); return { span: [sp.start, sp.end], read: r.read, why: r.why, bracket: r.bracket, five: r.five, week: r.week }; });
}
const hm = (iso) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const signed = (n) => `${n < 0 ? "" : "+"}${Math.round(n)}%`;
/** the line he sees for the newest shown span @param {object[]} shown */
function awayLine(shown) {
  const x = shown[shown.length - 1], more = shown.length > 1 ? ` (+${shown.length - 1} earlier span(s) recorded)` : "";
  const sp = `${hm(x.span[0])}–${hm(x.span[1])} IST`;
  if (!x.read) return `back · away ${sp} · spend unread (${x.why})${more}`;
  return `back · away ${sp} · spent five-hour ${signed(x.five.spent)} weekly ${signed(x.week.spent)} · left five-hour ${Math.round(x.five.left)}% weekly ${Math.round(x.week.left)}%${more}`;
}
const PRESENCE_DOOR = "ARSENAL_PRESENCE_LOG";   // a READ door (default absent ⇒ presence's own ledger); a plant points it under tmp
/** the presence reader, imported only on a render that has a root (read-only; absent or throwing ⇒ no report) */
async function presenceAway() {
  try {
    const m = await import("./presence.mjs");
    const file = process.env[PRESENCE_DOOR];
    return typeof m.awaySpans === "function" ? m.awaySpans(file ? { file } : {}) : null;
  } catch { return null; }
}
/** one render's history act: append when the value moved or when the line showed a span; returns the line's tail
 *  @param {string} root @param {object} reading */
async function recordRender(root, reading) {
  const history = readHistory(historyPath(root));
  const shown = awayReport(history, reading, await presenceAway(), readRule(root));
  if (shown.length) { appendHistory(root, { ...reading, shown }); return awayLine(shown); }
  if (!sameValue(history[history.length - 1] || null, reading)) appendHistory(root, reading);
  return "read now";
}

// ── the verdict — PURE, computed at read time, never stored ───────────────────────────────────────────────────────
/**
 * @param {object|null} reading  @param {Date} now  @param {{maxAgeMin:number}|null} rule
 * @returns {{ go: boolean, why: string, no_source: boolean, age_min: number|null, five: number|null, week: number|null, source: string|null }}
 */
export function verdict(reading, now, rule) {
  const base = { go: false, no_source: false, age_min: null, five: reading?.five?.pct ?? null, week: reading?.week?.pct ?? null, source: reading?.source ?? null };
  const W = (why, extra = {}) => ({ ...base, ...extra, why });
  if (!rule || !Number.isInteger(rule.maxAgeMin) || rule.maxAgeMin <= 0) return W("rule unreadable — no age bound at its law home (never a default number)");
  if (!reading) return W("no reading", { no_source: true });
  const at = Date.parse(reading.read_at);
  if (!Number.isFinite(at)) return W("reading carries no read_at", { no_source: true });
  if (at > now.getTime()) return W("future stamp — read_at is after now (clock skew is never vintage)", { no_source: true });
  const age = (now.getTime() - at) / MS_PER_MIN;          // the PAYLOAD's stamp, never the file's mtime
  const age_min = Math.floor(age);
  if (age >= rule.maxAgeMin) return W(`stale — the reading is ${age_min} min old, the bound is ${rule.maxAgeMin} min`, { no_source: true, age_min });
  if (!reading.five || !reading.week || !pctOk(reading.five.pct) || !pctOk(reading.week.pct)) return W("half reading — a window is missing", { age_min });
  for (const [name, w] of [["five-hour", reading.five], ["weekly", reading.week]]) {
    if (w.resets_at == null) continue;                        // F9 A: no reset time ⇒ judged by age alone
    const r = Date.parse(w.resets_at);
    if (!Number.isFinite(r)) return W(`the ${name} reset is unreadable`, { age_min });
    if (now.getTime() >= r) return W(`window rolled — the ${name} window reset at ${w.resets_at}`, { age_min });
  }
  return { ...base, go: true, age_min, why: "fresh and whole" };
}

const line = (v) => `${v.go ? "GO" : v.red ? "RED" : "WAIT"} · ${v.why} · five-hour ${v.five ?? "?"}% · weekly ${v.week ?? "?"}% · age ${v.age_min ?? "?"} min · source ${v.source ?? "none"}`;
const istDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
export const CARD_LINE = "Pool ka panel: five-hour aur weekly kitna percent dikh raha hai? Bas do number bol do.";
/** row 1176 (3): the no-root line names the door and the reading it drops — RED, never a reading-shaped line @param {string} shown */
const noRootRed = (shown) => `RED · usage tap · no campaign root (${ROOT_DOOR} unset) — this reading (${shown}) is DROPPED, nothing written`;
const NO_ROOT_WHY = `no campaign root (${ROOT_DOOR} unset) — every status-line reading is DROPPED until the door is set`;
const CARD_WHY = "his plan's usage meter is on his screen only, and no statusLine reading reached the campaign root inside the age bound";

// ── verbs ───────────────────────────────────────────────────────────────────────────────────────────────────────────
function statusline() {
  const chunks = [];
  let done = false;
  // the exit waits for the line to flush (a pipe is asynchronous on Windows): exit 0, always
  const finish = (msg) => { if (done) return; done = true; process.stdout.write(msg + "\n", () => process.exit(EXIT_GO)); };
  // FAIL OPEN inside the ruled bound: the guard fires one measured boot early, so the exit itself has room.
  const bootMs = process.uptime() * MS_PER_S;
  setTimeout(() => finish("usage tap · stdin did not close inside the bound — nothing written"),
    Math.max(0, RULED_STATUSLINE_BOUND_S * MS_PER_S - bootMs - bootMs)).unref();
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("error", () => finish("usage tap · stdin unreadable — nothing written"));
  process.stdin.on("end", async () => {
    try {
      const { reading, why } = parseStatusline(Buffer.concat(chunks).toString("utf8"), new Date());
      if (!reading) { process.stderr.write(`usage tap: ${why} — nothing written\n`); return finish(`usage tap · ${why} — nothing written`); }
      const shown = `five-hour ${reading.five ? Math.round(reading.five.pct) + "%" : "?"} · weekly ${reading.week ? Math.round(reading.week.pct) + "%" : "?"}`;
      const root = campaignRoot();
      if (!root) { process.stderr.write(`usage tap: ${noRootRed(shown)}\n`); return finish(noRootRed(shown)); }
      writeReading(root, reading);
      finish(`${shown} · ${await recordRender(root, reading)}`);
    } catch (e) {
      const why = String(e && e.message || e).split("\n")[0];
      process.stderr.write(`usage tap: ${why}\n`);
      finish(`RED · usage tap · the write failed (${why}) — this reading is DROPPED, failed open`);
    }
  });
  process.stdin.resume();
}

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }

function panel() {
  const five = Number(arg("--five")), week = Number(arg("--week"));
  if (!pctOk(five) || !pctOk(week)) { console.error("usage tap: panel needs --five <pct> and --week <pct>, each on the CLI's scale — nothing written"); process.exit(EXIT_REFUSED); }
  const reset = (n) => { const s = arg(n); if (s === undefined) return null; const t = Date.parse(s); return Number.isFinite(t) ? new Date(t).toISOString() : undefined; };
  const fr = reset("--five-reset"), wr = reset("--week-reset");
  if (fr === undefined || wr === undefined) { console.error("usage tap: a reset time is not a date — nothing written"); process.exit(EXIT_REFUSED); }
  const root = campaignRoot();
  if (!root) { console.log(`usage tap · no campaign root (${ROOT_DOOR} unset) — nothing written`); process.exit(EXIT_REFUSED); }
  const reading = { v: 1, source: "his-panel", read_at: new Date().toISOString(), five: { pct: five, resets_at: fr }, week: { pct: week, resets_at: wr }, cli_version: null, session_id: null };
  writeReading(root, reading);
  const history = readHistory(historyPath(root));
  if (!sameValue(history[history.length - 1] || null, reading)) appendHistory(root, reading);
  console.log(`usage tap · his panel recorded — five-hour ${five}% · weekly ${week}%`);
}

function judge() {
  const root = campaignRoot();
  if (!root) return { root, v: { go: false, red: true, no_source: false, why: NO_ROOT_WHY, age_min: null, five: null, week: null, source: null } };
  return { root, v: verdict(readReading(readingPath(root)), new Date(), readRule(root)) };
}

function need() {
  const { root, v } = judge();
  if (!root) { console.log(`usage tap · need: RED · ${v.why} — nothing filed`); return; }
  if (v.go || !v.no_source) { console.log(`usage tap · need: ${v.go ? "GO" : `WAIT for a reason his panel cannot change (${v.why})`} — nothing filed`); return; }
  const r = spawnSync(process.execPath, [CALL, "file", "--line", CARD_LINE, "--key", `usage:panel:${istDay(new Date())}`, "--why-code-cannot-decide", CARD_WHY], { encoding: "utf8", env: process.env });
  console.log(`usage tap · need: WAIT · ${v.why} → ${String(r.stdout || r.stderr || "").trim().split("\n")[0] || `captains_call exit ${r.status}`}`);
}

// ═══ SELFTEST — every plant under os.tmpdir(); nothing above this line is a test ═══════════════════════════════════
async function selftest() {
  const { mkdtempSync, rmSync, mkdirSync, utimesSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const tmp = mkdtempSync(join(tmpdir(), "usage-tap-st-"));
  let ok = 0, n = 0;
  const t = (name, cond) => { n++; if (cond) ok++; console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`); };
  try {
    const now = new Date("2026-11-18T10:00:00.000Z"), at = (m) => new Date(now.getTime() + m * 60000);
    const rule = { maxAgeMin: 300 };
    const block = (o) => JSON.stringify({ version: "2.1.327", session_id: "s", rate_limits: o });
    const resetIn = (m) => Math.floor(at(m).getTime() / 1000);
    // P1
    const p = parseStatusline(block({ five_hour: { used_percentage: 40, resets_at: resetIn(120) }, seven_day: { used_percentage: 60, resets_at: resetIn(3000) } }), now);
    t("W1.1 both windows → both pcts, ISO resets, source statusline, read_at = the clock", p.reading && p.reading.five.pct === 40 && p.reading.week.pct === 60 && p.reading.five.resets_at === at(120).toISOString() && p.reading.source === "statusline" && p.reading.read_at === now.toISOString());
    t("W1.2 rate_limits absent → no reading", parseStatusline(JSON.stringify({ version: "x" }), now).reading === null);
    const only5 = parseStatusline(block({ five_hour: { used_percentage: 10, resets_at: resetIn(60) } }), now).reading;
    t("W1.3 only five_hour → week null, never a zero", only5 && only5.week === null && only5.five.pct === 10);
    t("W1.4 malformed / out of scale / not a number → no reading", ["{", block({ five_hour: { used_percentage: 101 } }), block({ five_hour: { used_percentage: "40" } }), block({ five_hour: { used_percentage: -1 } })].every((s) => parseStatusline(s, now).reading === null));
    // P2
    const good = { v: 1, source: "statusline", read_at: now.toISOString(), five: { pct: 40, resets_at: at(120).toISOString() }, week: { pct: 60, resets_at: at(3000).toISOString() } };
    t("W2.1 fresh and whole → GO", verdict(good, at(10), rule).go === true);
    t("W2.2 at the bound exactly → WAIT · stale (the edge is WAIT)", verdict({ ...good, five: { pct: 40, resets_at: null } }, at(300), rule).go === false && /stale/.test(verdict({ ...good, five: { pct: 40, resets_at: null } }, at(300), rule).why));
    t("W2.2 one minute inside the bound (no reset) → GO", verdict({ ...good, five: { pct: 40, resets_at: null } }, at(299), rule).go === true);
    t("W2.4 read_at in the future → WAIT · future stamp", /future/.test(verdict(good, at(-5), rule).why));
    t("W2.5 past five.resets_at inside the bound → WAIT · window rolled", /rolled/.test(verdict(good, at(121), rule).why));
    t("W2.6 week null → WAIT · half reading", /half/.test(verdict({ ...good, week: null }, at(1), rule).why));
    t("W2.7 no rule → WAIT · rule unreadable", /rule unreadable/.test(verdict(good, at(1), null).why));
    t("F5 B a fresh 99% reading is GO — the tap reports, the gate decides", verdict({ ...good, five: { pct: 99, resets_at: null }, week: { pct: 99, resets_at: null } }, at(1), rule).go === true);
    t("F9 A a panel reading with no resets → judged by age alone", verdict({ ...good, source: "his-panel", five: { pct: 1, resets_at: null }, week: { pct: 1, resets_at: null } }, at(200), rule).go === true);
    t("P4 no-source marks: no reading and stale are no_source; rolled is not", verdict(null, now, rule).no_source && verdict(good, at(400), rule).no_source && !verdict(good, at(121), rule).no_source);
    // the law home, read as TEXT
    mkdirSync(join(tmp, "root", "tools"), { recursive: true });
    const lawP = join(tmp, "root", "tools", "model_law.mjs");
    writeFileSync(lawP, "// law\nexport const POOL_READING_MAX_AGE_MIN = 300; // row 1062 F4\n");
    t("F4 A the bound is read from its law home", readRule(join(tmp, "root"))?.maxAgeMin === 300);
    writeFileSync(lawP, "// no bound here\n");
    t("W2.7 a law home with no bound line → null (never a default)", readRule(join(tmp, "root")) === null);
    t("readReading never throws on garbage", (writeFileSync(join(tmp, "g.json"), "{"), readReading(join(tmp, "g.json"))) === null && readReading(join(tmp, "nope.json")) === null);
    // W2.3 — the payload decides, not the mtime: a file re-written NOW carrying an old read_at
    const rp = join(tmp, "old.json");
    writeFileSync(rp, JSON.stringify({ ...good, read_at: at(-400).toISOString() }));
    utimesSync(rp, now, now);
    t("W2.3 fresh mtime, old read_at → WAIT · stale", /stale/.test(verdict(readReading(rp), now, rule).why));
    // the static laws, on this file's code above the selftest line, comments stripped
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const code = src.slice(0, src.indexOf("// ═══ SELFTEST")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
    t("W1.5 never reads the organism's spend gauge, never imports its owner", !/token_vitals|brain\.mjs/.test(code));
    t("F2 A no credential / OAuth file is named in code", !/credential|oauth|\.credentials|keychain/i.test(code));
    const lits = [...code.matchAll(/(?<![\w.$])\d+(?:\.\d+)?(?![\w.])/g)].map((m) => Number(m[0]));
    t("W2.8 no typed age, percent line or duration — every numeric literal is a unit, an exit code or the ruled bound", lits.every((x) => [0, 1, 2, 3, 60, 100, 1000].includes(x)));
    const writes = [...code.matchAll(/\b(writeFileSync|renameSync|appendFileSync|createWriteStream|unlinkSync|rmSync|mkdirSync)\(([^,)]*)/g)].map((m) => `${m[1]}(${m[2].trim()}`);
    // row 1176 G4 A (ruled stricter): the write law names EXACTLY THREE writes — the reading's tmp, its rename, the history's append
    t("W3.1 (G4 A) exactly three writes: the reading's tmp, its rename, and the history's one append", writes.length === 3 && writes.filter((w) => w === "writeFileSync(tmp").length === 1 && writes.filter((w) => w === "renameSync(tmp").length === 1 && writes.filter((w) => w === "appendFileSync(historyPath(root").length === 1);
    t("W3.3 (G4 A) the history's name has ONE home in code, and nothing else names it", (code.match(/usage_readings/g) || []).length === 1);
    // P3 — spanSpend, PURE (row 1176 G2 A / G3 A)
    const R = (m, f, w, fr = 300, wr = 9000) => ({ v: 1, source: "statusline", read_at: at(m).toISOString(), five: { pct: f, resets_at: at(fr).toISOString() }, week: { pct: w, resets_at: at(wr).toISOString() } });
    const span = { start: at(10).toISOString(), end: at(70).toISOString() };
    const hist = [R(-100, 20, 50), R(5, 40, 60), R(40, 43, 60), R(75, 45, 61)];
    const ss = spanSpend(hist, span, rule);
    t("G2 a bracketed span → read, spent = r1 − r0 (the span's edges, not the day's), left = 100 − r1, the bracket named", ss.read && ss.five.spent === 5 && ss.week.spent === 1 && ss.five.left === 55 && ss.week.left === 39 && ss.bracket[0] === at(5).toISOString() && ss.bracket[1] === at(75).toISOString());
    t("G2 an edge row older than the age bound → UNREAD (unbracketed)", spanSpend([R(-400, 40, 60, 900), R(75, 45, 61, 900)], { start: at(-50).toISOString(), end: at(70).toISOString() }, rule).why === "unbracketed");
    t("G2 no row after the span → UNREAD (unbracketed), never a zero", spanSpend(hist.slice(0, 3), { start: at(10).toISOString(), end: at(80).toISOString() }, rule).read === false);
    t("G3 A a reset inside the bracket → that window UNREAD (rolled)", spanSpend([R(5, 40, 60, 30), R(75, 3, 61, 330)], span, rule).why === "rolled");
    t("G3 A a reset unknown (a panel row) → UNREAD (reset unknown), never counted", spanSpend([{ ...R(5, 40, 60), five: { pct: 40, resets_at: null } }, R(75, 45, 61)], span, rule).why === "reset unknown");
    t("G2 no rule → UNREAD (rule unreadable), never a default bound", spanSpend(hist, span, null).why === "rule unreadable");
    // P4 — awayReport, PURE
    const aw = { spans: [{ start: span.start, end: span.end }] };
    const rep1 = awayReport(hist.slice(0, 3), R(75, 45, 61), aw, rule);
    t("G4 a closed span not yet shown → one shown entry with spanSpend's figures", rep1.length === 1 && rep1[0].read && rep1[0].five.spent === 5 && rep1[0].span[1] === span.end);
    t("G4 a span already shown → nothing new", awayReport([...hist.slice(0, 3), { ...R(75, 45, 61), shown: rep1 }], R(80, 46, 61), aw, rule).length === 0);
    t("G4 an empty history → nothing to bracket, no report", awayReport([], R(75, 45, 61), aw, rule).length === 0);
    t("G4 no away record (null) → no report", awayReport(hist, R(80, 45, 61), null, rule).length === 0);
    t("W3.2 a reading holds no go / verdict / status / launch key", !Object.keys(p.reading).some((k) => /^(go|verdict|status|launch)$/.test(k)));
    t("W4.6 the card line names no command, path or flag", !/node |--|\.mjs|\//.test(CARD_LINE));
    // the CLI legs, hermetic: root and card state under tmp
    const root = join(tmp, "root");
    writeFileSync(lawP, "export const POOL_READING_MAX_AGE_MIN = 300;\n");
    const env = { ...process.env, ARSENAL_CAMPAIGN_ROOT: root, ARSENAL_CALL_STATE_DIR: join(tmp, "call") };
    mkdirSync(join(tmp, "call"), { recursive: true });
    const me = fileURLToPath(import.meta.url);
    const cli = (args, input, e = env) => spawnSync(process.execPath, [me, ...args], { encoding: "utf8", env: e, input });
    const sl = cli(["statusline"], block({ five_hour: { used_percentage: 12, resets_at: Math.floor(Date.now() / 1000) + 3600 }, seven_day: { used_percentage: 34, resets_at: Math.floor(Date.now() / 1000) + 86400 } }));
    t("statusline writes the reading, exit 0, one line", sl.status === 0 && readReading(readingPath(root))?.five?.pct === 12 && /read now/.test(sl.stdout));
    t("verdict on it → GO, exit 0", cli(["verdict"]).status === 0);
    const before = readFileSync(readingPath(root), "utf8"), mt = statSync(readingPath(root)).mtimeMs;
    cli(["statusline"], JSON.stringify({ version: "x" }));
    t("W1.2 CLI: no block → the previous reading is untouched (bytes and mtime)", readFileSync(readingPath(root), "utf8") === before && statSync(readingPath(root)).mtimeMs === mt);
    const noRoot = { ...env }; delete noRoot.ARSENAL_CAMPAIGN_ROOT;
    const nr = cli(["statusline"], block({ five_hour: { used_percentage: 1 }, seven_day: { used_percentage: 2 } }), noRoot);
    t("ADDED (ii) root absent → nothing written, and it says so, exit 0", nr.status === 0 && /no campaign root/.test(nr.stdout));
    t("R1176.3 root absent → the statusline line reads RED by the door's name and says the reading is DROPPED (stdout and stderr)", /^RED · .*ARSENAL_CAMPAIGN_ROOT unset.*DROPPED/.test(nr.stdout) && /five-hour 1%/.test(nr.stdout) && /ARSENAL_CAMPAIGN_ROOT unset.*DROPPED/.test(nr.stderr));
    const nst = cli(["status"], undefined, noRoot), nvd = cli(["verdict"], undefined, noRoot), nnd = cli(["need"], undefined, noRoot);
    t("R1176.3 root absent → status, verdict and need read RED by the door's name; verdict still refuses by exit (3)", nst.stdout.split(/\r?\n/).filter(Boolean).every((l) => /^RED · .*ARSENAL_CAMPAIGN_ROOT unset/.test(l)) && /^RED · .*ARSENAL_CAMPAIGN_ROOT unset/.test(nvd.stdout) && nvd.status === 3 && /RED · .*ARSENAL_CAMPAIGN_ROOT unset/.test(nnd.stdout));
    t("W4.3 a fresh statusline reading → need files nothing", /nothing filed/.test(cli(["need"]).stdout) && !existsSync(join(tmp, "call", "captains_call.json")));
    rmSync(readingPath(root));
    const n1 = cli(["need"]), n2 = cli(["need"]);
    const cards = (readReading(join(tmp, "call", "captains_call.json"))?.cards || []).filter((c) => String(c.key).startsWith("usage:panel:"));
    t("W4.1 + W4.2 no reading → need twice → exactly ONE keyed card", n1.status === 0 && n2.status === 0 && cards.length === 1 && cards[0].line === CARD_LINE);
    // P1 — the history: appended on a moved value, deduped on the same value (env: a presence door to an absent file)
    const env2 = { ...env, ARSENAL_PRESENCE_LOG: join(tmp, "no-presence.jsonl") };
    const hb = (f, w) => block({ five_hour: { used_percentage: f, resets_at: Math.floor(Date.now() / 1000) + 3600 }, seven_day: { used_percentage: w, resets_at: Math.floor(Date.now() / 1000) + 86400 } });
    rmSync(historyPath(root), { force: true });
    const fixed = hb(12, 34);
    cli(["statusline"], fixed, env2); cli(["statusline"], fixed, env2); cli(["statusline"], hb(13, 34), env2);
    const H = readHistory(historyPath(root));
    t("G1 A the history appends a moved value and dedupes the same value (2 rows from 3 renders)", H.length === 2 && H[0].five.pct === 12 && H[1].five.pct === 13);
    const pn = cli(["panel", "--five", "40", "--week", "60"]);
    t("W4.5 panel → source his-panel, and the verdict reads it GO under the same age law", pn.status === 0 && readReading(readingPath(root))?.source === "his-panel" && cli(["verdict"]).status === 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  console.log(`usage_tap selftest ${ok}/${n}` + (ok === n ? " — all clauses hold" : " — RED"));
  process.exit(ok === n ? 0 : 1);
}

// ── dispatch ────────────────────────────────────────────────────────────────────────────────────────────────────────
const isMain = (() => { try { return fileURLToPath(import.meta.url) === (process.argv[1] && join(process.argv[1])); } catch { return false; } })();
if (isMain) {
  const mode = process.argv[2];
  if (mode === "statusline") statusline();
  else if (mode === "panel") panel();
  else if (mode === "verdict") { const { v } = judge(); console.log(line(v)); process.exit(v.go ? EXIT_GO : EXIT_WAIT); }
  else if (mode === "need") need();
  else if (mode === "status") {
    const { root, v } = judge();
    const r = root ? readReading(readingPath(root)) : null;
    console.log(r ? `usage tap · reading ${r.source} at ${r.read_at}` : root ? "usage tap · no reading" : `RED · usage tap · no reading — ${NO_ROOT_WHY}`);
    console.log(line(v));
  }
  else if (mode === "selftest") selftest();
  else { console.error("usage: node scripts/usage_tap.mjs statusline|panel|verdict|need|status|selftest"); process.exit(EXIT_REFUSED); }
}
