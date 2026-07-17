#!/usr/bin/env node
/*
 * THE TIME-AUDITOR  (Arsenal AI FC — Agent 2)
 * Deterministic. Zero LLM tokens. Reads ActivityWatch locally, splits your
 * active time into Learning / Building / Meta, tells you if you're on track.
 *
 * Modes:
 *   node timeaudit.mjs pulse     -> quick "am I on track so far today" (12/15/18)
 *   node timeaudit.mjs full      -> full end-of-day audit (21:00 shutdown)
 *   node timeaudit.mjs selftest  -> runs on built-in mock data, no AW needed
 *
 * Never fabricates. If a bucket is empty or AW is unreachable, it says so.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AW = process.env.AW_API_BASE || "http://localhost:5600";
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const BUCKETS_PATH = join(STATE_DIR, "buckets.json");
const OUT_PATH = join(STATE_DIR, "timeaudit.json");

const MODE = (process.argv[2] || "pulse").toLowerCase();

// ---------- config ----------
function loadConfig() {
  if (!existsSync(BUCKETS_PATH)) {
    throw new Error(`buckets.json not found at ${BUCKETS_PATH}`);
  }
  return JSON.parse(readFileSync(BUCKETS_PATH, "utf8"));
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

async function fetchEvents(bucketId, startISO, endISO) {
  if (!bucketId) return [];
  const q = `?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&limit=-1`;
  try {
    return await awGet(`/api/0/buckets/${encodeURIComponent(bucketId)}/events${q}`);
  } catch {
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
function matchBucket(hay, rules, kind) {
  const h = (hay || "").toLowerCase();
  for (const [bucket, def] of Object.entries(rules)) {
    const list = def[kind] || [];
    if (list.some((p) => h.includes(p.toLowerCase()))) return bucket;
  }
  return null;
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

  // 1) non-browser window time -> classify by app
  for (const ev of windowEvents) {
    const app = (ev.data?.app || "").toLowerCase();
    const isBrowser = browsers.some((b) => app.includes(b));
    if (isBrowser) continue; // browser time comes from web watcher (avoid double count)
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
  for (const ev of webEventsArr) {
    const url = ev.data?.url || "";
    const dom = domainOf(url);
    const sec = activeOverlapSec(evStart(ev), evEnd(ev), active);
    if (sec <= 0) continue;
    let bucket =
      matchBucket(url, cfg.rules, "domains") ||
      matchBucket(dom, cfg.rules, "domains") ||
      cfg.default ||
      "Meta";
    add(bucket, dom || "browser", sec);
  }

  return { totals, detail };
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

function maybeNtfy(cfg, r) {
  if (!cfg.ntfy?.enabled) return;
  const status = r.onTrack ? "ON TRACK" : "OFF TRACK";
  const body = `${r.mode.toUpperCase()} ${status} | B ${r.buckets.Building.pct}% L ${r.buckets.Learning.pct}% M ${r.buckets.Meta.pct}% | ${r.productiveMinutes}m productive`;
  try {
    execSync(`curl -s -H "Title: Time-Auditor" -d "${body.replace(/"/g, "'")}" ntfy.sh/${cfg.ntfy.topic}`, { stdio: "ignore" });
  } catch {}
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
    ev(at(13, 30), 60 * 60, { url: "https://www.youtube.com/watch?v=abc" }),   // youtube.com/watch -> Learning per rules
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
      writeFileSync(OUT_PATH, JSON.stringify(r, null, 2));
      printReport(r);
      return;
    }
    const ids = pickBuckets(bucketMap);
    if (!ids.afk || !ids.window) { dataOk = false; note = "window/afk bucket missing — check watchers."; }
    const s = iso(dayStart), e = iso(now);
    afkEvents = await fetchEvents(ids.afk, s, e);
    windowEvents = await fetchEvents(ids.window, s, e);
    webEvents = [];
    for (const wb of ids.web) webEvents.push(...(await fetchEvents(wb, s, e)));
  }

  const active = activeIntervals(afkEvents);
  const cls = classify(cfg, active, windowEvents, webEvents);
  const r = buildReport(cfg, cls, MODE, { date: dateStr, dataOk, note });

  // selftest proves the classification math on MOCK data — it must never
  // overwrite the LIVE bus file (physio/viz/scorer read it as truth) or push.
  if (MODE !== "selftest") {
    writeFileSync(OUT_PATH, JSON.stringify(r, null, 2));
    maybeNtfy(cfg, r);
  }
  printReport(r);
}

// run only when invoked directly (Windows-safe entry check)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((e) => { console.error("Time-Auditor error:", e.message); process.exit(1); });
}
export default run;
