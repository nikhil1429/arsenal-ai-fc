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
function focusRead(events, now = new Date(), matcher = null, opts = FOCUS) {
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

async function fetchWindowEvents(deps = {}) {
  const fetchFn = deps.fetchFn || fetch;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);
    const buckets = await (await fetchFn(`${AW}/api/0/buckets`, { signal: ctrl.signal })).json();
    clearTimeout(t);
    const win = Object.keys(buckets).find(b => b.startsWith("aw-watcher-window"));
    if (!win) return null;
    return await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(win)}/events?limit=200`)).json();
  } catch { return null; }                          // AW down → silent no-op (never guess)
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
  const row = { ts: now.toISOString(), day: localDate(now), switches: t.switches, rate: Math.round(t.rate_per_min * 10) / 10, span_min: Math.round(t.span_min * 10) / 10, edge, tone: tone.arousal, posted: false };
  if (edge && tone.arousal !== "conserve") {
    row.posted = await post({ modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: `tab-thrash forming: ${t.switches} switches in ${Math.round(t.span_min)}min`, concept_tokens: t.top_words });
  }
  append(row);
  // THE FOCUS LEDGER rides the same pass — zero extra fetches, zero tokens.
  // Break-onset dedupe: only the moment the thread SNAPS fires an afferent;
  // an ongoing break never re-fires (a nag is not a whisper).
  const f = focusRead(events, now, deps.matcher || null);
  const prevFocus = deps.prevFocus !== undefined ? deps.prevFocus
    : readLines(PLOG).filter(r => r.kind === "focus").slice(-1)[0] || null;
  const frow = { ts: now.toISOString(), day: localDate(now), kind: "focus", ...f, tone: tone.arousal, posted: false };
  if (f.break_live && !(prevFocus && prevFocus.break_live) && tone.arousal !== "conserve") {
    frow.posted = await post({ modality: "bus", source: "presence", event_key: "focus:break", stall: false, text: `the thread snapped: ${f.break_run_min}min off after ${f.focus_min}min of work${f.pull ? " — pulled by " + f.pull : ""}`, concept_tokens: f.pull_words });
  }
  append(frow);
  return { ok: true, edge, posted: row.posted, telemetry: t, focus: frow, muted: edge && tone.arousal === "conserve" };
}

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
  {
    const logs = []; let posted = null;
    const r = await sense({ now, events: mkEvents(40, 8), tone: { arousal: "open", effects: {} }, signature: SIGNATURE, post: async (e) => { posted = e; return true; }, append: (x) => logs.push(x) });
    assert("leading edge + open tone → ONE afferent at the thalamus", r.edge && r.posted && posted.event_key === "stall:leading-edge");
    assert("the afferent carries the concept hint for the precache match", Array.isArray(posted.concept_tokens) && posted.concept_tokens.includes("attention"));
    assert("every pass logs telemetry (the season's stall dataset)", logs.length === 2 && logs[0].edge === true && logs[1].kind === "focus");
    let posted2 = null;
    const r2 = await sense({ now, events: mkEvents(40, 8), tone: { arousal: "conserve", effects: {} }, signature: SIGNATURE, post: async () => { posted2 = true; return true; }, append: () => {} });
    assert("CONSERVE day: it senses but stays OFF the wire (rest is the agenda)", r2.edge && r2.muted && posted2 === null);
    const r3 = await sense({ now, events: mkEvents(5, 8), tone: { arousal: "open", effects: {} }, signature: SIGNATURE, post: async () => { throw new Error("must not post"); }, append: () => {} });
    assert("no edge → no afferent (a false whisper costs trust)", r3.edge === false && r3.posted === false);
    const r4 = await sense({ now, events: null, tone: { arousal: "open", effects: {} }, append: () => { throw new Error("no log without telemetry"); } });
    assert("AW unreachable → honest skip, never a guess", r4.ok === false && r4.skipped.includes("unreachable"));
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
    const rF = await sense({ now, events: evts, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher, prevFocus: null, post: async (e) => { fposted = e; return true; }, append: () => {} });
    assert("SENTINEL: break ONSET fires ONE focus:break afferent with the pull words", rF.focus.posted === true && fposted && fposted.event_key === "focus:break" && fposted.concept_tokens.includes("youtube"));
    let fposted2 = null;
    const rF2 = await sense({ now, events: evts, tone: { arousal: "open", effects: {} }, signature: SIGNATURE, matcher, prevFocus: { break_live: true }, post: async (e) => { fposted2 = e; return true; }, append: () => {} });
    assert("SENTINEL: an ONGOING break never re-fires (a nag is not a whisper)", rF2.focus.break_live === true && rF2.focus.posted === false && fposted2 === null);
    const rF3 = await sense({ now, events: evts, tone: { arousal: "conserve", effects: {} }, signature: SIGNATURE, matcher, prevFocus: null, post: async () => { throw new Error("must not post"); }, append: () => {} });
    assert("SENTINEL: conserve day — it watches, it never speaks", rF3.focus.break_live === true && rF3.focus.posted === false);
    assert("SENTINEL: empty telemetry = calm zeros, never an accusation", focusRead([], now, matcher).break_live === false && focusRead(null, now, matcher).focus_min === 0);
    const real = bucketsMatcher(undefined);
    assert("SENTINEL: classification rides the Time-Auditor's own buckets.json truth", typeof real === "function" && real("Code.exe", "x") === true && real("chrome.exe", "colab.research.google.com — notebook") === true);
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
    console.log(`presence: ${rows.length} sense pass(es) today · ${edges.length} leading edge(s) · ${edges.filter(r => r.posted).length} posted to the thalamus`);
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

export { thrashTelemetry, isLeadingEdge, sense, calibrate, loadSignature, SIGNATURE, focusRead, bucketsMatcher, FOCUS };
