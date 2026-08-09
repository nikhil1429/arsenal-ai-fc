#!/usr/bin/env node
/*
 * THE TIME-AUDITOR  (Arsenal AI FC — Agent 2)
 * Deterministic. Zero LLM tokens. Reads ActivityWatch locally, splits your
 * active time into Learning / Building / Meta, tells you if you're on track.
 *
 * Modes:
 *   node timeaudit.mjs pulse     -> quick "am I on track so far today" (12/15/18)
 *   node timeaudit.mjs full      -> full end-of-day audit (21:00 shutdown)
 *   node timeaudit.mjs selftest  -> runs on built-in mock data, no AW needed;
 *                                  ASSERTS the classification math and exits 1
 *                                  on mismatch (E2E audit 25 Jul 2026 found the
 *                                  old selftest printed a report and nothing else)
 *
 * Never fabricates. If a bucket is empty or AW is unreachable, it says so.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AW = process.env.AW_API_BASE || "http://localhost:5600";
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const BUCKETS_PATH = join(STATE_DIR, "buckets.json");
const OUT_PATH = join(STATE_DIR, "timeaudit.json");
// ntfy topic is a SECRET and buckets.json is COMMITTED in a PUBLIC repo, so the
// topic resolves the way throwin.mjs resolves it: env -> gitignored file -> dormant.
const NTFY_TOPIC_ENV = "ARSENAL_NTFY_TOPIC";
const NTFY_TOPIC_FILE = join(STATE_DIR, "throwin_topic.txt");

const MODE = (process.argv[2] || "pulse").toLowerCase();
// C5 (9 Aug 2026): "pulse" was the default for EVERY unknown argv — a typo'd
// "fulll" silently ran a live pulse instead of refusing. Three modes exist; say so.
if (!["pulse", "full", "selftest"].includes(MODE)) {
  console.error(`timeaudit: unknown mode "${MODE}" — pulse | full | selftest`);
  process.exit(1);
}

// ---------- config ----------
function loadConfig() {
  if (!existsSync(BUCKETS_PATH)) {
    throw new Error(`buckets.json not found at ${BUCKETS_PATH}`);
  }
  return JSON.parse(readFileSync(BUCKETS_PATH, "utf8"));
}

// E2E audit 25 Jul 2026: timeaudit.json was written with a bare writeFileSync while
// TWO independent triggers exist for this same writer (the schtasks pulse and a
// manual/heartbeat sensory pass) and physio/viz/scorer/manager read the file as
// truth. A reader landing mid-write got a truncated JSON and treated the whole
// organ as absent. Every other organ (throwin.mjs, capture.mjs) already writes
// temp->rename; this one now does too.
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

// ---------- AW REST ----------
async function awGet(path) {
  const res = await fetch(`${AW}${path}`);
  if (!res.ok) throw new Error(`AW ${path} -> HTTP ${res.status}`);
  return res.json();
}

function pickBuckets(bucketMap) {
  const ids = Object.keys(bucketMap);
  const find = (prefix) => ids.filter((b) => b.startsWith(prefix));
  return {
    window: find("aw-watcher-window")[0] || null,
    afk: find("aw-watcher-afk")[0] || null,
    // web watcher bucket id varies by browser + can have duplicates
    web: ids.filter((b) => b.startsWith("aw-watcher-web")),
  };
}

async function fetchEvents(bucketId, startISO, endISO, errs = null) {
  if (!bucketId) return [];
  const q = `?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&limit=-1`;
  try {
    return await awGet(`/api/0/buckets/${encodeURIComponent(bucketId)}/events${q}`);
  } catch (e) {
    // E2E audit 25 Jul 2026: this catch swallowed a per-bucket HTTP/network failure
    // as a legitimately EMPTY day — a 500 on the window bucket was indistinguishable
    // from "he did nothing", and the report still went out dataOk:true. The failure
    // is collected now so run() can mark the day incomplete instead of inventing a
    // clean zero. (Return stays [] — behaviour of the happy path is untouched.)
    if (errs) errs.push(`${bucketId}: ${e.message}`);
    return [];
  }
}

// ---------- time helpers ----------
function localDayStart(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}
const iso = (d) => new Date(d).toISOString();
const evStart = (e) => new Date(e.timestamp).getTime();
const evEnd = (e) => new Date(e.timestamp).getTime() + (e.duration || 0) * 1000;

// merge not-afk events into clean intervals [{s,e}]
function activeIntervals(afkEvents) {
  const on = afkEvents
    .filter((e) => (e.data?.status || "").toLowerCase() === "not-afk")
    .map((e) => ({ s: evStart(e), e: evEnd(e) }))
    .sort((a, b) => a.s - b.s);
  const merged = [];
  for (const iv of on) {
    const last = merged[merged.length - 1];
    if (last && iv.s <= last.e) last.e = Math.max(last.e, iv.e);
    else merged.push({ ...iv });
  }
  return merged;
}

// merge arbitrary [{s,e}] ranges (same algorithm activeIntervals uses on its
// filtered afk list — kept separate so that engine stays untouched).
function mergeRanges(ranges) {
  const sorted = ranges.slice().sort((a, b) => a.s - b.s);
  const merged = [];
  for (const iv of sorted) {
    const last = merged[merged.length - 1];
    if (last && iv.s <= last.e) last.e = Math.max(last.e, iv.e);
    else merged.push({ ...iv });
  }
  return merged;
}

// intersection of two merged (non-overlapping, sorted) interval lists
function intersectIntervals(a, b) {
  const out = [];
  for (const x of a) {
    for (const y of b) {
      const lo = Math.max(x.s, y.s);
      const hi = Math.min(x.e, y.e);
      if (hi > lo) out.push({ s: lo, e: hi });
    }
  }
  return out.sort((p, q) => p.s - q.s);
}

// seconds of [s,e] that overlap the active intervals
function activeOverlapSec(s, e, intervals) {
  let sec = 0;
  for (const iv of intervals) {
    const lo = Math.max(s, iv.s);
    const hi = Math.min(e, iv.e);
    if (hi > lo) sec += (hi - lo) / 1000;
  }
  return sec;
}

// ---------- classification ----------
function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
// FROZEN (layering law): the original matcher, verbatim. It walked buckets in
// object order, so the FIRST bucket holding ANY matching substring won regardless
// of how specific that substring was. E2E audit 25 Jul 2026 caught the live
// collision: Learning's "preview" (for the macOS/PDF previewers) shadowed
// Building's "windowsterminalpreview", so 3h of terminal work booked as Learning
// and buildPct fell under target on a heavy build day. Kept for reference + a
// selftest check that pins the old behaviour.
function matchBucketLegacy(hay, rules, kind) {
  const h = (hay || "").toLowerCase();
  for (const [bucket, def] of Object.entries(rules)) {
    const list = def[kind] || [];
    if (list.some((p) => h.includes(p.toLowerCase()))) return bucket;
  }
  return null;
}

// Plan of record: most-SPECIFIC (longest) pattern wins, across all buckets.
// Ties keep the old bucket order (Array#sort is stable), so nothing else moves.
function matchBucket(hay, rules, kind) {
  const h = (hay || "").toLowerCase();
  const pairs = [];
  for (const [bucket, def] of Object.entries(rules)) {
    for (const p of def[kind] || []) pairs.push([bucket, String(p).toLowerCase()]);
  }
  pairs.sort((a, b) => b[1].length - a[1].length);
  for (const [bucket, p] of pairs) if (p && h.includes(p)) return bucket;
  return null;
}

// E2E audit 25 Jul 2026: buckets.json lists "edge" as a browser, and the substring
// matcher therefore treated msedgewebview2.exe — the WebView2 host that runs new
// Outlook, Teams and a pile of desktop apps — as a browser. That time was skipped
// in step 1 on the promise that the web watcher covers it, but no aw-watcher-web
// bucket has ever covered WebView2, so the hours simply vanished from every bucket.
// The exception list lives in code because buckets.json is the captain's data file.
const NOT_BROWSERS = ["msedgewebview2", "webview2"];
function isBrowserApp(app, browsers) {
  const a = (app || "").toLowerCase();
  if (NOT_BROWSERS.some((x) => a.includes(x))) return false;
  return browsers.some((b) => a.includes(b));
}

function classify(cfg, active, windowEvents, webEventsArr) {
  const browsers = (cfg.browsers || []).map((b) => b.toLowerCase());
  const totals = { Learning: 0, Building: 0, Meta: 0 };
  const detail = {}; // key -> seconds, for transparency

  const add = (bucket, key, sec) => {
    totals[bucket] += sec;
    detail[bucket] = detail[bucket] || {};
    detail[bucket][key] = (detail[bucket][key] || 0) + sec;
  };

  // browser FOCUS windows + how much active browser time step 1 handed over to
  // the web watcher — both added by the E2E audit 25 Jul 2026 (see step 2 and
  // webGapNote: the handover used to be a blind promise with no accounting).
  const browserRanges = [];
  let browserSkippedSec = 0;

  // 1) non-browser window time -> classify by app
  for (const ev of windowEvents) {
    const app = (ev.data?.app || "").toLowerCase();
    const isBrowser = isBrowserApp(app, browsers);
    if (isBrowser) {
      // browser time comes from web watcher (avoid double count) — but remember
      // WHEN the browser held focus and HOW MUCH we handed over, so step 2 can
      // clip to it and run() can flag a day the web watcher never reported.
      browserRanges.push({ s: evStart(ev), e: evEnd(ev) });
      browserSkippedSec += activeOverlapSec(evStart(ev), evEnd(ev), active);
      continue;
    }
    const sec = activeOverlapSec(evStart(ev), evEnd(ev), active);
    if (sec <= 0) continue;

    let bucket = null;
    // Claude Desktop special-case
    if (app.includes("claude")) bucket = cfg.claudeDesktop?.bucket || "Learning";
    if (!bucket) bucket = matchBucket(app, cfg.rules, "apps");
    if (!bucket) bucket = matchBucket(ev.data?.title, cfg.rules, "domains"); // titles sometimes hold url-ish text
    if (!bucket) bucket = cfg.default || "Meta";
    add(bucket, ev.data?.app || "unknown", sec);
  }

  // 2) browser time -> classify by domain from web watcher
  // E2E audit 25 Jul 2026: web events were intersected with AFK only. But
  // aw-watcher-web heartbeats the ACTIVE TAB whenever the browser is merely
  // RUNNING — including while VS Code holds focus — which is exactly why AW's own
  // canonical query runs filter_period_intersect against the browser's window
  // events first. Without that clip, a minimised YouTube tab double-booked every
  // focused coding hour as Meta too (3h of building read as 6h active, 50% Meta).
  // Clip to active ∩ browser-focused. If there are NO window events at all (window
  // watcher down) there is nothing to clip against, so fall back to active —
  // degraded, but never silently zeroed.
  const webActive = windowEvents.length
    ? intersectIntervals(active, mergeRanges(browserRanges))
    : active;
  for (const ev of webEventsArr) {
    const url = ev.data?.url || "";
    const dom = domainOf(url);
    const sec = activeOverlapSec(evStart(ev), evEnd(ev), webActive);
    if (sec <= 0) continue;
    let bucket =
      matchBucket(url, cfg.rules, "domains") ||
      matchBucket(dom, cfg.rules, "domains") ||
      cfg.default ||
      "Meta";
    add(bucket, dom || "browser", sec);
  }

  return { totals, detail, browserSkippedSec };
}

// E2E audit 25 Jul 2026: if pickBuckets found no aw-watcher-web bucket (extension
// disabled by a browser auto-update — it happens silently) every browser hour was
// skipped in step 1 and landed in NO bucket, yet dataOk only ever flagged a missing
// window/afk bucket. A four-hour Colab morning simply disappeared and the day still
// reported "Building 100%, ON TRACK". Same for a bucket read that errored out.
// This never fabricates the missing time — it names it and kills dataOk.
function webGapNote(browserSkippedSec, webEventCount, fetchErrors = []) {
  const parts = [];
  if (browserSkippedSec >= 60 && webEventCount === 0) {
    parts.push(`web watcher silent — ${mins(browserSkippedSec)}m of browser time is in NO bucket (extension disabled?)`);
  }
  if (fetchErrors.length) parts.push(`bucket read failed: ${fetchErrors.join("; ")}`);
  return parts.join(" | ");
}

// ---------- reporting ----------
function pct(x, total) {
  return total > 0 ? Math.round((x / total) * 1000) / 10 : 0;
}
function mins(sec) {
  return Math.round(sec / 60);
}
function topKeys(detailBucket, n = 3) {
  return Object.entries(detailBucket || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k} ${mins(v)}m`)
    .join(", ");
}

function buildReport(cfg, cls, mode, meta) {
  const t = cls.totals;
  const activeSec = t.Learning + t.Building + t.Meta;
  const productive = t.Learning + t.Building;
  const buildPct = pct(t.Building, activeSec);
  const metaPct = pct(t.Meta, activeSec);
  const target = cfg.targets?.buildingPctMin ?? 60;
  const metaMax = cfg.targets?.metaPctMax ?? 25;

  const onTrack = buildPct >= target && metaPct <= metaMax;
  const flags = [];
  if (buildPct < target) flags.push(`Building ${buildPct}% < target ${target}%`);
  if (metaPct > metaMax) flags.push(`Meta ${metaPct}% > cap ${metaMax}% (procrastination signal)`);
  if (activeSec < 60) flags.push("almost no active time captured yet");

  return {
    date: meta.date,
    mode,
    generatedAt: new Date().toISOString(),
    activeMinutes: mins(activeSec),
    buckets: {
      Learning: { minutes: mins(t.Learning), pct: pct(t.Learning, activeSec), top: topKeys(cls.detail.Learning) },
      Building: { minutes: mins(t.Building), pct: buildPct, top: topKeys(cls.detail.Building) },
      Meta: { minutes: mins(t.Meta), pct: metaPct, top: topKeys(cls.detail.Meta) },
    },
    productiveMinutes: mins(productive),
    onTrack,
    flags,
    dataOk: meta.dataOk,
    note: meta.note || "",
  };
}

function printReport(r) {
  const bar = (p) => "#".repeat(Math.round(p / 5)).padEnd(20, ".");
  const head = r.mode === "full" ? "THE TIME-AUDITOR — FULL DAY" : "THE TIME-AUDITOR — PULSE";
  console.log(`\n== ${head}  [${r.date}] ==`);
  if (!r.dataOk) console.log("!! " + (r.note || "ActivityWatch data missing/unreachable — numbers may be incomplete"));
  console.log(`active: ${r.activeMinutes}m   productive(L+B): ${r.productiveMinutes}m`);
  for (const [name, b] of Object.entries(r.buckets)) {
    console.log(`  ${name.padEnd(9)} ${String(b.minutes).padStart(4)}m  ${String(b.pct).padStart(5)}%  ${bar(b.pct)}  ${b.top || "-"}`);
  }
  console.log(r.onTrack ? "\nSTATUS: ON TRACK ✔" : "\nSTATUS: OFF TRACK ✗");
  for (const f of r.flags) console.log("  - " + f);
  console.log(MODE === "selftest" ? `\n(selftest: mock report NOT written — the live bus file is untouched)\n` : `\n(written -> ${OUT_PATH})\n`);
}

// E2E audit 25 Jul 2026: maybeNtfy interpolated cfg.ntfy.topic straight out of
// buckets.json — a COMMITTED file in a PUBLIC repo — while buckets.json's own _note
// promised "the secret resolves at runtime from gitignored throwin_topic.txt / env,
// never committed". That resolution did not exist anywhere in this file, so the only
// way to turn pulses on was to paste the private topic into a tracked file and push
// it (the previous topic was already burned once, 12 Jul). Now it resolves exactly
// like throwin.mjs: env -> gitignored file -> committed config (legacy, loud warning)
// -> dormant. The topic itself is NEVER printed.
function resolveNtfyTopic(cfg, env = process.env, topicFile = NTFY_TOPIC_FILE) {
  const fromEnv = env[NTFY_TOPIC_ENV];
  if (fromEnv && String(fromEnv).trim()) return { topic: String(fromEnv).trim(), source: "env" };
  try {
    if (existsSync(topicFile)) {
      const t = readFileSync(topicFile, "utf8").trim();
      if (t) return { topic: t, source: "file" };
    }
  } catch { /* unreadable -> keep looking */ }
  const legacy = (cfg.ntfy?.topic || "").trim();
  if (legacy) return { topic: legacy, source: "committed-config" };
  return { topic: null, source: null };
}

// execFileSync + argv array: the old execSync built ONE shell string, so the report
// body (which contains | and %) and the topic were both parsed by cmd.exe.
function curlNtfy(server, topic, body) {
  execFileSync("curl", ["-s", "-H", "Title: Time-Auditor", "-d", body, `${server}/${topic}`],
    { stdio: "ignore", timeout: 10000 });
}

function maybeNtfy(cfg, r, opts = {}) {
  if (!cfg.ntfy?.enabled) return false;
  const { env = process.env, topicFile = NTFY_TOPIC_FILE, send = curlNtfy } = opts;
  const { topic, source } = resolveNtfyTopic(cfg, env, topicFile);
  if (!topic) {
    console.log(`(ntfy enabled but no topic resolved — set ${NTFY_TOPIC_ENV} or ${topicFile}; staying dormant)`);
    return false;
  }
  if (source === "committed-config") {
    console.log("!! ntfy topic came from the COMMITTED buckets.json and this repo is PUBLIC — move it to " +
      `${NTFY_TOPIC_ENV} or the gitignored throwin_topic.txt, and blank it there.`);
  }
  const status = r.onTrack ? "ON TRACK" : "OFF TRACK";
  const body = `${r.mode.toUpperCase()} ${status} | B ${r.buckets.Building.pct}% L ${r.buckets.Learning.pct}% M ${r.buckets.Meta.pct}% | ${r.productiveMinutes}m productive`;
  try {
    send(cfg.ntfy?.server || "https://ntfy.sh", topic, body);
    return true;
  } catch { return false; }
}

// ---------- selftest mock ----------
function mockData() {
  const base = localDayStart().getTime();
  const at = (h, m = 0) => new Date(base + (h * 3600 + m * 60) * 1000).toISOString();
  const ev = (ts, durSec, data) => ({ timestamp: ts, duration: durSec, data });
  const afk = [
    ev(at(9), 3 * 3600, { status: "not-afk" }),   // 9-12 active
    ev(at(12), 30 * 60, { status: "afk" }),         // lunch
    ev(at(12, 30), 2 * 3600, { status: "not-afk" }),// 12:30-14:30 active
  ];
  const win = [
    ev(at(9), 90 * 60, { app: "Code.exe", title: "timeaudit.mjs" }),         // Building 90m
    ev(at(10, 30), 30 * 60, { app: "Claude.exe", title: "Claude" }),         // Learning 30m
    ev(at(11), 60 * 60, { app: "chrome.exe", title: "Colab" }),              // browser -> web
    ev(at(12, 30), 60 * 60, { app: "WindowsTerminal.exe", title: "node" }),  // Building 60m
    ev(at(13, 30), 60 * 60, { app: "chrome.exe", title: "YouTube" }),        // browser -> web
  ];
  const web = [
    ev(at(11), 60 * 60, { url: "https://colab.research.google.com/drive/x" }), // Building 60m
    // E2E audit 25 Jul 2026: this line's comment used to claim "-> Learning per
    // rules". It never was: youtube.com lives in Meta.domains and appears nowhere
    // in Learning. A stale expectation in a selftest that asserted nothing.
    ev(at(13, 30), 60 * 60, { url: "https://www.youtube.com/watch?v=abc" }),   // youtube.com -> Meta 60m
  ];
  return { afk, win, web };
}

// ---------- main ----------
async function run() {
  const cfg = loadConfig();
  const now = new Date();
  const dayStart = localDayStart(now);
  // IST fix (organism U4, captain-approved): local components, never
  // toISOString — UTC+5:30 made local midnight stamp YESTERDAY's date.
  const dateStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`;

  let afkEvents, windowEvents, webEvents, dataOk = true, note = "";
  const fetchErrors = []; // per-bucket read failures (E2E audit 25 Jul 2026)

  if (MODE === "selftest") {
    const m = mockData();
    afkEvents = m.afk; windowEvents = m.win; webEvents = m.web;
    note = "SELFTEST (mock data, AW not queried)";
  } else {
    let bucketMap;
    try {
      bucketMap = await awGet("/api/0/buckets/");
    } catch (e) {
      dataOk = false; note = `ActivityWatch unreachable at ${AW} (${e.message}). Is aw-qt running?`;
      const r = buildReport(cfg, { totals: { Learning: 0, Building: 0, Meta: 0 }, detail: {} }, MODE, { date: dateStr, dataOk, note });
      writeAtomic(OUT_PATH, r);
      printReport(r);
      return;
    }
    const ids = pickBuckets(bucketMap);
    if (!ids.afk || !ids.window) { dataOk = false; note = "window/afk bucket missing — check watchers."; }
    const s = iso(dayStart), e = iso(now);
    afkEvents = await fetchEvents(ids.afk, s, e, fetchErrors);
    windowEvents = await fetchEvents(ids.window, s, e, fetchErrors);
    webEvents = [];
    for (const wb of ids.web) webEvents.push(...(await fetchEvents(wb, s, e, fetchErrors)));
  }

  const active = activeIntervals(afkEvents);
  const cls = classify(cfg, active, windowEvents, webEvents);
  // browser time handed to a web watcher that never answered = uncounted hours.
  // Say so instead of reporting a suspiciously tidy Building-100% day.
  if (MODE !== "selftest") {
    const gap = webGapNote(cls.browserSkippedSec, webEvents.length, fetchErrors);
    if (gap) { dataOk = false; note = note ? `${note} | ${gap}` : gap; }
  }
  const r = buildReport(cfg, cls, MODE, { date: dateStr, dataOk, note });

  // selftest proves the classification math on MOCK data — it must never
  // overwrite the LIVE bus file (physio/viz/scorer read it as truth) or push.
  if (MODE !== "selftest") {
    writeAtomic(OUT_PATH, r);
    maybeNtfy(cfg, r);
  }
  printReport(r);
}

// ---------- selftest (E2E audit 25 Jul 2026) ----------
// The old selftest mode ran the mock day through the pipeline, printed the report
// and exited 0 — ALWAYS. Zero assertions: inverting the browser skip, breaking the
// AFK intersection, or losing a whole bucket all still "passed", while the header
// sold it as proof of the classification math and the doctor/heartbeat suites
// counted it as the Time-Auditor's health check. Every assert below is written to
// FAIL against the pre-audit code.
const checks = [];
function assert(name, cond) { checks.push([name, !!cond]); console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); }

async function selftest() {
  await run(); // prints the mock-day report; writes nothing, pushes nothing
  console.log("");
  const cfg = loadConfig();
  const m = mockData();
  const T = (h, mi = 0) => localDayStart().getTime() + (h * 3600 + mi * 60) * 1000;
  const evAt = (h, mi, durSec, data) => ({ timestamp: new Date(T(h, mi)).toISOString(), duration: durSec, data });

  // the mock-day expectations below encode the COMMITTED buckets.json rules; if the
  // captain re-tunes those lists this guard tells him which rule moved the numbers.
  assert("buckets.json still holds the rules the mock day assumes",
    (cfg.rules.Building.apps || []).includes("code") &&
    (cfg.rules.Building.domains || []).includes("colab.research.google.com") &&
    (cfg.rules.Meta.domains || []).includes("youtube.com"));

  const active = activeIntervals(m.afk);
  assert("AFK merge: 9-12 and 12:30-14:30 active, lunch excluded",
    active.length === 2 && active[0].s === T(9) && active[0].e === T(12) && active[1].e === T(14, 30));

  const cls = classify(cfg, active, m.win, m.web);
  // Code 90m + WindowsTerminal 60m + colab 60m = 210 Building; Claude 30m Learning;
  // youtube 60m Meta. 300m active total -> B 70%, M 20% -> ON TRACK.
  assert("mock day: Building 210m (Code + Terminal + Colab)", mins(cls.totals.Building) === 210);
  assert("mock day: Learning 30m (Claude Desktop special-case)", mins(cls.totals.Learning) === 30);
  assert("mock day: Meta 60m (youtube.com -> Meta, NOT Learning)", mins(cls.totals.Meta) === 60);
  const rep = buildReport(cfg, cls, "selftest", { date: "2026-07-25", dataOk: true, note: "" });
  assert("mock day: 300m active, B 70% / M 20%, ON TRACK",
    rep.activeMinutes === 300 && rep.buckets.Building.pct === 70 && rep.buckets.Meta.pct === 20 && rep.onTrack === true);
  assert("browser window time is accounted for, not silently dropped", mins(cls.browserSkippedSec) === 120);

  // f071ae8c — background tab: Code focused 14:00-17:00, Chrome NEVER focused, web
  // watcher still heartbeating YouTube the whole time. Pre-fix this booked 180m
  // Building AND 180m Meta (360m of an 180m afternoon).
  const bgAfk = [{ timestamp: new Date(T(14)).toISOString(), duration: 3 * 3600, data: { status: "not-afk" } }];
  const bgCls = classify(cfg, activeIntervals(bgAfk),
    [evAt(14, 0, 3 * 3600, { app: "Code.exe", title: "x" })],
    [evAt(14, 0, 3 * 3600, { url: "https://www.youtube.com/watch?v=abc" })]);
  assert("background tab does NOT double-count: web time clipped to browser FOCUS",
    mins(bgCls.totals.Building) === 180 && mins(bgCls.totals.Meta) === 0);
  // and the clip must not zero a day where the window watcher itself is down
  const noWinCls = classify(cfg, activeIntervals(bgAfk), [],
    [evAt(14, 0, 3 * 3600, { url: "https://www.youtube.com/watch?v=abc" })]);
  assert("no window events at all -> web time still counted (degraded, not zeroed)", mins(noWinCls.totals.Meta) === 180);

  // d1d280e4 — specificity + the WebView2 false browser
  const shadow = { Learning: { apps: ["preview"] }, Building: { apps: ["windowsterminalpreview", "code"] } };
  assert("longest pattern wins: windowsterminalpreview -> Building",
    matchBucket("WindowsTerminalPreview.exe", shadow, "apps") === "Building");
  assert("frozen legacy matcher still shows the shadowing it had (Learning's 'preview' won)",
    matchBucketLegacy("WindowsTerminalPreview.exe", shadow, "apps") === "Learning");
  assert("msedgewebview2 is NOT a browser (no web watcher ever covers WebView2)",
    isBrowserApp("msedgewebview2.exe", ["chrome", "edge"]) === false && isBrowserApp("msedge.exe", ["chrome", "edge"]) === true);
  const wvCls = classify(cfg, activeIntervals(bgAfk), [evAt(14, 0, 3600, { app: "msedgewebview2.exe", title: "Outlook" })], []);
  assert("WebView2 hour lands in a bucket instead of vanishing",
    wvCls.totals.Learning + wvCls.totals.Building + wvCls.totals.Meta === 3600 && wvCls.browserSkippedSec === 0);

  // b9756502 — the missing web watcher / swallowed bucket error must be SAID
  assert("browser time with zero web events -> note naming the uncounted minutes",
    webGapNote(4 * 3600, 0, []).includes("240m"));
  assert("web events present -> no gap note", webGapNote(4 * 3600, 7, []) === "");
  assert("a per-bucket HTTP error is surfaced, not swallowed as an empty day",
    webGapNote(0, 3, ["aw-watcher-window_x: AW /events -> HTTP 500"]).includes("HTTP 500"));

  // 229738fa — topic never comes from the committed public file by default
  assert("ntfy topic: env wins", resolveNtfyTopic({ ntfy: {} }, { [NTFY_TOPIC_ENV]: "  sekrit-x  " }, "__none__").topic === "sekrit-x");
  assert("ntfy topic: nothing anywhere -> dormant null",
    resolveNtfyTopic({ ntfy: { enabled: true, topic: "" } }, {}, "__no_such_topic_file__").topic === null);
  assert("ntfy topic: a topic left in committed buckets.json is flagged as such",
    resolveNtfyTopic({ ntfy: { topic: "legacy-t" } }, {}, "__none__").source === "committed-config");
  let sent = 0;
  const spy = () => { sent++; };
  const dummyReport = { onTrack: true, mode: "pulse", productiveMinutes: 1, buckets: { Building: { pct: 1 }, Learning: { pct: 1 }, Meta: { pct: 1 } } };
  const sentNone = maybeNtfy({ ntfy: { enabled: true, topic: "" } }, dummyReport, { env: {}, topicFile: "__none__", send: spy });
  assert("enabled + unresolvable topic -> sends NOTHING (dormant, no network)", sentNone === false && sent === 0);
  assert("enabled + env topic -> exactly one send, body carries the status",
    maybeNtfy({ ntfy: { enabled: true } }, dummyReport, { env: { [NTFY_TOPIC_ENV]: "t" }, topicFile: "__none__", send: spy }) === true && sent === 1);
  assert("disabled ntfy never sends", maybeNtfy({ ntfy: { enabled: false } }, dummyReport, { env: { [NTFY_TOPIC_ENV]: "t" }, send: spy }) === false && sent === 1);

  // 63486015 / 9eef2ae3 — structural guards a future refactor cannot quietly undo
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert("timeaudit.json is ONLY ever written atomically (temp->rename), both sites",
    !/writeFileSync\(\s*OUT_PATH/.test(src) && (src.match(/writeAtomic\(OUT_PATH/g) || []).length === 2);
  assert("entry guard null-guards process.argv[1] (import-safe, like throwin/capture)",
    /process\.argv\[1\]\s*&&\s*import\.meta\.url/.test(src));
  const tmp = join(tmpdir(), "timeaudit-selftest-" + Date.now(), "timeaudit.json");
  writeAtomic(tmp, { ok: true });
  assert("writeAtomic lands a complete, parseable file", existsSync(tmp) && JSON.parse(readFileSync(tmp, "utf8")).ok === true);

  const passed = checks.every((c) => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : `\nSELFTEST FAILED (${checks.filter((c) => !c[1]).length} of ${checks.length})`);
  return passed;
}

// run only when invoked directly (Windows-safe entry check)
// E2E audit 25 Jul 2026: pathToFileURL(undefined) throws ERR_INVALID_ARG_TYPE at
// module evaluation, so `await import("./timeaudit.mjs")` from a REPL or `node -e`
// (no argv[1]) crashed before the exported run() could even be reached. Siblings
// throwin.mjs / capture.mjs already null-guard argv[1]; this now matches them.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const main = MODE === "selftest" ? selftest : run;
  main()
    .then((ok) => { if (ok === false) process.exit(1); })
    .catch((e) => { console.error("Time-Auditor error:", e.message); process.exit(1); });
}
export default run;
export { classify, matchBucket, matchBucketLegacy, isBrowserApp, webGapNote, resolveNtfyTopic, writeAtomic, selftest };
