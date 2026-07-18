#!/usr/bin/env node
// ============================================================================
// context.mjs · ARSENAL AI FC — THE AMBIENT CONTEXT BRIDGE (working-memory P3)
// ----------------------------------------------------------------------------
// WHAT: graduates ambient sight from presence.mjs's STALL-only reads to a
//   DELTA-only stream: on every app/title CHANGE it POSTs one 'context' afferent
//   to the thalamus (:4113), so every bound moment carries what-app / what-concept
//   he was on. This is the multi-surface RIVER that finally gives the never-fired
//   cortex something to reason over. Metadata only (AW app+title) — NO pixels,
//   never the screen's contents.
// FLOOR: ~60s. "delta-only" = emit iff the window changed since the last emit;
//   the ~60s floor is the poll/scheduler cadence (a resident --daemon poll or a
//   1-min schtasks), so a flapping title can't become a firehose.
// LAWS: single-writer — owns ONLY context_state.json (last window + emit stamp).
//   The thalamus stays the SOLE writer of afferent (context.mjs only POSTs the
//   door). Fail-silent: AW down or thalamus down → no emit, no crash, no tax.
// MODES: node scripts/context.mjs once     → one delta check (for a 1-min schtasks)
//        node scripts/context.mjs daemon   → resident ~60s poll
//        node scripts/context.mjs selftest → baked-mock checks (no AW, no net)
// ============================================================================
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONTEXT_STATE = join(STATE_DIR, "context_state.json");        // own file (gitignored)
const AW = process.env.ARSENAL_AW || "http://localhost:5600";
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const FLOOR_MS = 60000;                                             // resident poll cadence (~60s floor)

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, obj) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + ".tmp"; writeFileSync(tmp, JSON.stringify(obj, null, 2)); renameSync(tmp, p); }
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// pull the CURRENT window (app + title) from ActivityWatch — metadata, never pixels
async function currentWindow(deps = {}) {
  const fetchFn = deps.fetch || fetch;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 1500);
    const buckets = await (await fetchFn(`${AW}/api/0/buckets`, { signal: ctrl.signal })).json();
    const win = Object.keys(buckets || {}).find(b => b.startsWith("aw-watcher-window"));
    if (!win) { clearTimeout(to); return null; }
    const events = await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(win)}/events?limit=1`, { signal: ctrl.signal })).json();
    clearTimeout(to);
    const e = Array.isArray(events) && events[0];
    if (!e || !e.data) return null;
    return { app: String(e.data.app || ""), title: String(e.data.title || "") };
  } catch { return null; }
}

async function defaultPost(evt, deps = {}) {
  const fetchFn = deps.fetch || fetch;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 400);
    const r = await fetchFn(THALAMUS + "/afferent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    clearTimeout(to); return !!(r && r.ok);
  } catch { return false; }
}

// THE DELTA DECISION (deps-injected for tests) — emit iff the window CHANGED since the
// last emit. On emit: POST a 'context' afferent + record the new state. Returns
// { emitted, posted?, evt?, state, reason? }.
async function sense(deps = {}) {
  const now = deps.now || new Date();
  const win = deps.window !== undefined ? deps.window : await currentWindow(deps);
  const prev = deps.prev !== undefined ? deps.prev : readJson(CONTEXT_STATE);
  if (!win || !win.app) return { emitted: false, reason: "no-window", state: prev };
  const changed = !prev || prev.app !== win.app || prev.title !== win.title;
  if (!changed) return { emitted: false, reason: "no-change", state: prev };
  const evt = {
    modality: "context", source: "activitywatch",
    app: win.app, title: clip(win.title, 200),
    text: clip(`${win.app} · ${win.title}`, 240),
    event_key: `context:${win.app}`, ts: now.toISOString(),
  };
  const posted = await (deps.post || ((e) => defaultPost(e, deps)))(evt);
  // ONLY advance state when the afferent actually LANDED. If the thalamus was momentarily
  // down (posted === false), leave prev untouched so the NEXT poll re-detects this same
  // change and retries — self-healing (e.g. a daemon that booted before the thalamus).
  // Advancing on a failed post would drop that window's context afferent forever.
  const state = { app: win.app, title: win.title, emit_ts: now.toISOString() };
  if (posted) (deps.save || ((o) => writeAtomic(CONTEXT_STATE, o)))(state);
  return { emitted: posted, posted, evt, state, reason: posted ? undefined : "post-failed-will-retry" };
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const now = new Date("2026-07-18T10:00:00Z");
  let saved = null, posted = null;
  const r1 = await sense({ now, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:58:00Z" }, post: async (e) => { posted = e; return true; }, save: (o) => { saved = o; } });
  assert("emit on window CHANGE → modality 'context', app+title carried", r1.emitted && r1.evt.modality === "context" && r1.evt.app === "Code.exe" && /drill\.py/.test(r1.evt.text));
  assert("emit routes to the thalamus door + records the new state", posted && posted.event_key === "context:Code.exe" && saved.app === "Code.exe" && saved.emit_ts === now.toISOString());
  const r2 = await sense({ now, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "Code.exe", title: "drill.py", emit_ts: "2026-07-18T09:59:00Z" }, post: async () => { throw new Error("must not post on no-change"); }, save: () => { throw new Error("must not write on no-change"); } });
  assert("no emit when the window is unchanged (delta-only, never a firehose)", r2.emitted === false && r2.reason === "no-change");
  const r3 = await sense({ now, window: { app: "Obsidian.exe", title: "notes" }, prev: null, post: async () => true, save: () => {} });
  assert("first-ever window (no prior state) → emits", r3.emitted === true);
  const r4 = await sense({ now, window: null, prev: null, post: async () => { throw new Error("no post without a window"); }, save: () => {} });
  assert("AW down / no window → no emit, no crash", r4.emitted === false && r4.reason === "no-window");
  const r5 = await sense({ now, window: { app: "chrome.exe", title: "attention paper" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:50:00Z" }, post: async () => true, save: () => {} });
  assert("title-only change still emits (the title carries the concept)", r5.emitted === true);
  let s6 = "unset";
  const r6 = await sense({ now, window: { app: "x.exe", title: "t" }, prev: null, post: async () => false, save: (o) => { s6 = o; } });
  assert("thalamus down → NOT emitted + state NOT advanced (retries next poll, no afferent dropped)", r6.posted === false && r6.emitted === false && s6 === "unset" && r6.reason === "post-failed-will-retry");
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "once").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "daemon" || mode === "--daemon") {
    let stop = false, emits = 0;
    const onSig = () => { stop = true; };
    process.on("SIGINT", onSig); process.on("SIGTERM", onSig);
    console.log(`context: --daemon up (poll ~${FLOOR_MS / 1000}s) — ambient AW → :4113 on window change. Ctrl-C to stop.`);
    while (!stop) {
      try { const r = await sense(); if (r.emitted) { emits++; console.log(`context: → ${r.evt.text}${r.posted ? "" : " (thalamus down)"}`); } } catch { /* never taxes */ }
      await new Promise((res) => { const step = 500; let el = 0; const iv = setInterval(() => { el += step; if (stop || el >= FLOOR_MS) { clearInterval(iv); res(); } }, step); });
    }
    console.log(`context: --daemon stopped (${emits} emit(s)).`);
    return;
  }
  const r = await sense();
  console.log(r.emitted ? `context: emitted → ${r.evt.text}${r.posted ? "" : " (thalamus down; state updated)"}` : `context: no emit (${r.reason})`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { sense, currentWindow };
