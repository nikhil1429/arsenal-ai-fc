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
// MODES: node scripts/presence.mjs sense [--demo] · calibrate · status · selftest
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { currentTone } from "./tone.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PLOG      = join(STATE_DIR, "presence_log.jsonl");
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
// fit to his own normal: p95 of calm-work rates becomes the bar (floored at factory)
function calibrate(deps = {}) {
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

// E2E audit 25 Jul 2026 (b831d29c): every sense pass appends TWO rows — the
// thrash row and the kind:"focus" ledger row — so `status` printed rows.length
// and reported exactly 2× the real pass count ("48 sense passes today" for 24
// runs). A cosmetic lie is still a lie in the one organ whose whole job is
// honest interoception. A pass = a thrash row = a row with no `kind`.
// (dugout.mjs:1056 `presence_passes_today` carries the same double-count and is
// NOT this file's to fix — reported to the audit instead.)
const sensePassRows = (rows) => (rows || []).filter(r => r && !r.kind);

const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
  let _log = null; const log = () => (_log || (_log = readLines(PLOG)));   // read the ledger at most once per pass
  const row = { ts: now.toISOString(), day: localDate(now), switches: t.switches, rate: Math.round(t.rate_per_min * 10) / 10, span_min: Math.round(t.span_min * 10) / 10, edge, tone: tone.arousal, posted: false };
  // E2E audit 25 Jul 2026 (b6e6a127): the focus lane deduped on onset but this
  // one fired on EVERY matching pass. One continuous 25-min thrash spell spans 3
  // scheduled passes → 3 identical afferents → dossier.stalls_today = 3 off a
  // SINGLE episode, and capacity_nudge went "lower" for the rest of the day on
  // an inflated count. Same law as the focus lane now: only the false→true edge
  // (episode onset) speaks; every pass still LOGS edge rows so the calibrate
  // dataset and the telemetry season are untouched.
  const prevEdge = deps.prevEdge !== undefined ? deps.prevEdge
    : log().filter(r => !r.kind).slice(-1)[0] || null;
  if (edge && !(prevEdge && prevEdge.edge) && tone.arousal !== "conserve") {
    row.posted = await post({ modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: `tab-thrash forming: ${t.switches} switches in ${Math.round(t.span_min)}min`, concept_tokens: t.top_words });
  }
  append(row);
  // THE FOCUS LEDGER rides the same pass — zero extra fetches, zero tokens.
  // Break-onset dedupe: only the moment the thread SNAPS fires an afferent;
  // an ongoing break never re-fires (a nag is not a whisper).
  // AFK truth rides along (E2E audit 25 Jul 2026, 4c520ce9) — only fetched when
  // the window events were fetched too, so injected-events callers stay offline.
  const afk = deps.afk !== undefined ? deps.afk : (deps.events !== undefined ? null : await fetchAfkEvents(deps));
  const f = focusRead(events, now, deps.matcher || null, FOCUS, afk);
  const prevFocus = deps.prevFocus !== undefined ? deps.prevFocus
    : log().filter(r => r.kind === "focus").slice(-1)[0] || null;
  const frow = { ts: now.toISOString(), day: localDate(now), kind: "focus", ...f, tone: tone.arousal, posted: false };
  if (f.break_live && !(prevFocus && prevFocus.break_live) && tone.arousal !== "conserve") {
    frow.posted = await post({ modality: "bus", source: "presence", event_key: "focus:break", stall: false, text: `the thread snapped: ${f.break_run_min}min off after ${f.focus_min}min of work${f.pull ? " — pulled by " + f.pull : ""}`, concept_tokens: f.pull_words });
  }
  append(frow);
  return { ok: true, edge, posted: row.posted, telemetry: t, focus: frow, muted: edge && tone.arousal === "conserve" };
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
    const base = { now, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher: fx, prevEdge: { edge: false }, prevFocus: null, afk: null };
    const logs = []; let posted = null;
    const r = await sense({ ...base, events: mkEvents(40, 8), post: async (e) => { posted = e; return true; }, append: (x) => logs.push(x) });
    assert("leading edge + open tone → ONE afferent at the thalamus", r.edge && r.posted && posted.event_key === "stall:leading-edge");
    assert("the afferent carries the concept hint for the precache match", Array.isArray(posted.concept_tokens) && posted.concept_tokens.includes("attention"));
    assert("every pass logs telemetry (the season's stall dataset)", logs.length === 2 && logs[0].edge === true && logs[1].kind === "focus");
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
    const fbase = { now, events: evts, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher, prevFocus: null, prevEdge: null, afk: null };
    const rF = await sense({ ...fbase, post: async (e) => { fposted = e; return true; }, append: () => {} });
    assert("SENTINEL: break ONSET fires ONE focus:break afferent with the pull words", rF.focus.posted === true && fposted && fposted.event_key === "focus:break" && fposted.concept_tokens.includes("youtube"));
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
    let fitted = null;
    const c = calibrate({ rows: mkRows(6, 6), write: (o) => { fitted = o; } });
    assert("5+ days → thresholds fit to HIS p95 calm-work baseline (never below factory)", c.ok && fitted.min_switch_rate_per_min >= SIGNATURE.min_switch_rate_per_min && fitted.days === 6);
    const sigF = loadSignature({ fitted });
    assert("the fitted signature raises the bar for a high-baseline captain", sigF.min_switch_rate_per_min > SIGNATURE.min_switch_rate_per_min);
    const calmForHim = { span_min: 8, switches: 40, rate_per_min: 5.5 };
    assert("what was an 'edge' on factory becomes CALM once his normal is known", isLeadingEdge(calmForHim, SIGNATURE) === true && isLeadingEdge(calmForHim, sigF) === false);
    assert("no fitted file → factory signature, never crashes", loadSignature({ fitted: null }).min_switch_rate_per_min === 5);
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

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const rows = readLines(PLOG).filter(r => r.day === localDate());
    const edges = rows.filter(r => r.edge);
    console.log(`presence: ${sensePassRows(rows).length} sense pass(es) today · ${edges.length} leading edge(s) · ${edges.filter(r => r.posted).length} posted to the thalamus`);
    return;
  }
  if (mode === "calibrate") { const c = calibrate(); console.log(c.ok ? `presence: fitted to HIS baselines — rate bar ${c.min_switch_rate_per_min}/min, switches ${c.min_total_switches} (${c.days} days, ${c.samples} samples)` : `presence: ${c.skipped}`); return; }
  if (mode === "sense") {
    const demo = process.argv.includes("--demo");
    const t0 = Date.now();                          // hoisted once — a mid-build clock tick shaved the rate under the bar (scar)
    const r = await sense(demo ? { events: Array.from({ length: 48 }, (_, i) => ({ timestamp: new Date(t0 - 8 * 60000 + i * 10000).toISOString(), data: { app: i % 2 ? "chrome.exe" : "Code.exe", title: i % 2 ? "attention scaling doubt - search" : "drill.py - editor" } })) } : {});
    console.log(r.ok ? `presence: ${r.edge ? (r.posted ? "LEADING EDGE — afferent posted" : r.muted ? "leading edge, MUTED (conserve)" : "leading edge, thalamus asleep") : "calm"} (${r.telemetry.switches} switches / ${Math.round(r.telemetry.span_min)}min)` : `presence: ${r.skipped}`);
    return;
  }
  console.log("presence.mjs — sense [--demo] | status | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { thrashTelemetry, isLeadingEdge, sense, calibrate, loadSignature, SIGNATURE, focusRead, focusReadLegacy, awayIntervals, bucketsMatcher, sensePassRows, fetchAwEvents, fetchWindowEvents, fetchAfkEvents, FOCUS };
