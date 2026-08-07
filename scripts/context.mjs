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
// MODES: node scripts/context.mjs daemon   → THE SANCTIONED PATH: one resident ~60s poll
//        node scripts/context.mjs once     → one delta check (the legacy 1-min schtasks lane)
//        node scripts/context.mjs status   → what this bridge is buying, as counters
//        node scripts/context.mjs selftest → baked-mock checks (no AW, no net)
//
// #22 (audit 2 Aug 2026, finding 14) — WHY `daemon` IS NOW THE SANCTIONED PATH.
//   Measured: `ArsenalFC-Context` runs `cmd /c cd /d ... && node scripts\context.mjs
//   once` EVERY MINUTE, indefinitely = 1,440 cold cmd+node starts a day, for a
//   measured mean of ~145 actual emits (1,743 over 12 active days). ~1,296 of those
//   spawns are pure no-ops. `daemon` has the identical delta-only semantics, the
//   identical ~60s floor and the identical single-writer law, in ONE process.
//   `once` is NOT deleted — it stays the fallback and the manual probe (layering
//   law), and the scheduler change is a captain/schtasks action, not a code one.
//   See `status` for the exact task-definition swap.
// ============================================================================
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// #22/#6 — the ONE concept canon (concepts.json via capture.mjs's registry), reused
// from presence.mjs rather than copied a third time. A window TITLE is the only place
// the concept he is on ever appears in this stream; a window title word is not a
// concept until the canon says so.
// (presenceTailReport is a FILE-GENERIC jsonl tail reader that happens to live in
// presence.mjs, the organ that needed it first — `status` uses it on afferent.jsonl
// so a health read never parses an unbounded log whole.)
import { canonToken, conceptRegistry, presenceTailReport as jsonlTailReport } from "./presence.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONTEXT_STATE = join(STATE_DIR, "context_state.json");        // own file (gitignored)
const AFFERENT = join(STATE_DIR, "afferent.jsonl");                 // READ-ONLY here (the thalamus owns it)
const AW = process.env.ARSENAL_AW || "http://localhost:5600";
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const FLOOR_MS = 60000;                                             // resident poll cadence (~60s floor)

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, obj) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + "." + process.pid + ".tmp"; writeFileSync(tmp, JSON.stringify(obj, null, 2)); renameSync(tmp, p); }
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

// ---------------------------------------------------------------------------
// #22 — THE CONCEPT IN THE TITLE MUST REACH THE SCORER
// ---------------------------------------------------------------------------
// Measured over 1,743 live context afferents: 17 distinct event_keys, ALL app-only
// (`context:chrome.exe` 663, `context:WindowsTerminal.exe` 542, `context:claude.exe`
// 342), because the key was built from `win.app` alone. Habituation (thalamus
// signalKey) therefore saturated per-APP: hours on one concept and hours of idle
// tab-flipping in the same browser were the same signal, and the concept sitting in
// the title never reached the scorer at all.
//
// THE TRAP, from the audit's own verifier (CORRECTION 3), which this deliberately
// avoids: putting the RAW title into the key/tokens would push `system32`, `cmd`,
// `Terminal` into the thalamus's `seen` vocabulary — permanently poisoning the
// concept namespace used by novelty and by capsule/pre-answer matching — and would
// explode the habituation map to thousands of keys. So the title is admitted ONLY
// through the canon: a registered concept/skill id, or nothing at all.
//   · title canonicalizes  → `context:<app>:<concept>` + concept_tokens [<concept>]
//   · title is just chrome → `context:<app>` VERBATIM, concept_tokens [] — today's
//     behaviour, byte for byte, so nothing about the quiet case changes.
// Honest by construction: an empty array is an empty array (#4).
function conceptOfTitle(title, deps = {}) {
  const reg = deps.registry !== undefined ? deps.registry : conceptRegistry();
  for (const w of String(title || "").toLowerCase().split(/[^a-z0-9_]+/)) {
    if (w.length <= 3) continue;                       // same >3-char floor the rest of the organism uses
    const id = canonToken(w, reg);
    if (id) return id;
  }
  return null;
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
  const concept = conceptOfTitle(win.title, deps);
  const evt = {
    modality: "context", source: "activitywatch",
    app: win.app, title: clip(win.title, 200),
    text: clip(`${win.app} · ${win.title}`, 240),
    concept_tokens: concept ? [concept] : [],          // canon ids only — never a raw window word
    concept_source: concept ? "window-title-canon" : "none",
    event_key: concept ? `context:${win.app}:${concept}` : `context:${win.app}`, ts: now.toISOString(),
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

// ---------------------------------------------------------------------------
// #22/#106 — WHAT THIS BRIDGE IS BUYING, AS COUNTERS (never the word "ok")
// ---------------------------------------------------------------------------
// SCAN_ROWS is a scan WINDOW, not a budget: `complete:false` says out loud when the
// history ran deeper than the scan, so a short look is never reported as a total.
const SCAN_ROWS = 2000;
function status(deps = {}) {
  const rep = deps.rep || jsonlTailReport(SCAN_ROWS, { file: AFFERENT });
  const ctx = rep.rows.filter(r => r && r.modality === "context");
  const keys = new Set(ctx.map(r => String(r.event_key || "")));
  const conceptKeys = [...keys].filter(k => k.split(":").length > 2);
  const withConcept = ctx.filter(r => Array.isArray(r.concept_tokens) && r.concept_tokens.length).length;
  const days = new Set(ctx.map(r => String(r.ts || "").slice(0, 10)).filter(Boolean));
  return {
    scanned_rows: rep.rows.length, scan_complete: rep.complete,
    context_rows: ctx.length, active_days: days.size,
    emits_per_day: days.size ? Math.round(ctx.length / days.size) : 0,
    distinct_keys: keys.size, concept_bearing_keys: conceptKeys.length,
    rows_with_concept: withConcept, rows_total: ctx.length,
  };
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const now = new Date("2026-07-18T10:00:00Z");
  // A FIXTURE of capture.mjs's registry shape. Every sense() below injects it, so the
  // verdict can never depend on what the captain happens to have in concepts.json
  // (the same law presence.mjs's FIXTURE_BUCKETS follows — adding a concept to his
  // own canon must not turn this file red).
  const REG = { loaded: true,
    conceptAlias: new Map([["hallucinations", "hallucinations"], ["hallucination", "hallucinations"], ["embeddings", "embeddings"]]),
    skillAlias: new Map([["fastapi", "fastapi"]]) };
  const EMPTY_REG = { loaded: false, conceptAlias: new Map(), skillAlias: new Map() };
  let saved = null, posted = null;
  const r1 = await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:58:00Z" }, post: async (e) => { posted = e; return true; }, save: (o) => { saved = o; } });
  assert("emit on window CHANGE → modality 'context', app+title carried", r1.emitted && r1.evt.modality === "context" && r1.evt.app === "Code.exe" && /drill\.py/.test(r1.evt.text));
  assert("emit routes to the thalamus door + records the new state", posted && posted.event_key === "context:Code.exe" && saved.app === "Code.exe" && saved.emit_ts === now.toISOString());
  const r2 = await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "Code.exe", title: "drill.py", emit_ts: "2026-07-18T09:59:00Z" }, post: async () => { throw new Error("must not post on no-change"); }, save: () => { throw new Error("must not write on no-change"); } });
  assert("no emit when the window is unchanged (delta-only, never a firehose)", r2.emitted === false && r2.reason === "no-change");
  const r3 = await sense({ now, registry: REG, window: { app: "Obsidian.exe", title: "notes" }, prev: null, post: async () => true, save: () => {} });
  assert("first-ever window (no prior state) → emits", r3.emitted === true);
  const r4 = await sense({ now, registry: REG, window: null, prev: null, post: async () => { throw new Error("no post without a window"); }, save: () => {} });
  assert("AW down / no window → no emit, no crash", r4.emitted === false && r4.reason === "no-window");
  const r5 = await sense({ now, registry: REG, window: { app: "chrome.exe", title: "attention paper" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:50:00Z" }, post: async () => true, save: () => {} });
  assert("title-only change still emits (the title carries the concept)", r5.emitted === true);
  let s6 = "unset";
  const r6 = await sense({ now, registry: REG, window: { app: "x.exe", title: "t" }, prev: null, post: async () => false, save: (o) => { s6 = o; } });
  assert("thalamus down → NOT emitted + state NOT advanced (retries next poll, no afferent dropped)", r6.posted === false && r6.emitted === false && s6 === "unset" && r6.reason === "post-failed-will-retry");

  // ------------------------------------------------------------------------
  // #22 REGRESSIONS (audit 2 Aug 2026, finding 14). Live before this fix: 17
  // distinct event_keys, ALL app-only, so habituation saturated per-app and the
  // concept in the title reached the scorer in 0 of 1,743 emits.
  // ------------------------------------------------------------------------
  let pc = null;
  const rc = await sense({ now, registry: REG, window: { app: "chrome.exe", title: "Hallucinations in LLMs — grounding" }, prev: null, post: async (e) => { pc = e; return true; }, save: () => {} });
  assert("#22 a canon concept in the title reaches the SCORER — it is in the hab key and in concept_tokens",
    rc.emitted && pc.event_key === "context:chrome.exe:hallucinations" && pc.concept_tokens.length === 1 &&
    pc.concept_tokens[0] === "hallucinations" && pc.concept_source === "window-title-canon");
  let pd = null;
  await sense({ now, registry: REG, window: { app: "chrome.exe", title: "Embeddings 101" }, prev: null, post: async (e) => { pd = e; return true; }, save: () => {} });
  assert("#22 two concepts in ONE app are now two habituation keys — hours of one concept no longer read like tab-churn",
    pd.event_key === "context:chrome.exe:embeddings" && pd.event_key !== pc.event_key);
  let pn = null;
  await sense({ now, registry: REG, window: { app: "WindowsTerminal.exe", title: "C:\\WINDOWS\\system32\\cmd.EXE" }, prev: null, post: async (e) => { pn = e; return true; }, save: () => {} });
  assert("#22 TRAP AVOIDED — raw window words never enter the key or the vocabulary: `system32`/`cmd` canonicalize to NOTHING",
    pn.event_key === "context:WindowsTerminal.exe" && Array.isArray(pn.concept_tokens) && pn.concept_tokens.length === 0 && pn.concept_source === "none");
  assert("#22 the quiet case is byte-identical to the pre-fix behaviour (no habituation churn introduced)",
    posted.event_key === "context:Code.exe" && Array.isArray(posted.concept_tokens) && posted.concept_tokens.length === 0);
  let pe = null;
  await sense({ now, registry: EMPTY_REG, window: { app: "chrome.exe", title: "Hallucinations in LLMs" }, prev: null, post: async (e) => { pe = e; return true; }, save: () => {} });
  assert("#22 NO registry on disk → app-only key and no tokens (a missing canon is never a licence to ship titles)",
    pe.event_key === "context:chrome.exe" && pe.concept_tokens.length === 0);
  assert("#22 the canon filter itself: a registered alias resolves, chrome does not",
    conceptOfTitle("hallucination detection notes", { registry: REG }) === "hallucinations" &&
    conceptOfTitle("Google Chrome — new tab", { registry: REG }) === null &&
    conceptOfTitle("fastapi routing", { registry: REG }) === "fastapi");
  // #106 — status is a set of counters, never the word "ok"
  const st = status({ rep: { rows: [
    { modality: "context", ts: "2026-08-01T10:00:00Z", event_key: "context:chrome.exe", concept_tokens: [] },
    { modality: "context", ts: "2026-08-01T11:00:00Z", event_key: "context:chrome.exe:embeddings", concept_tokens: ["embeddings"] },
    { modality: "voice", ts: "2026-08-02T11:00:00Z", event_key: "voice:x" },
  ], complete: true } });
  assert("#22/#106 status reports have/need counters, not a status word",
    st.context_rows === 2 && st.rows_with_concept === 1 && st.concept_bearing_keys === 1 && st.distinct_keys === 2 && st.active_days === 1);
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "once").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const s = status();
    console.log(`context: ${s.context_rows} emit(s) across ${s.active_days} day(s) = ~${s.emits_per_day}/day, from the last ${s.scanned_rows} afferent row(s)` +
      (s.scan_complete ? "" : " (the scan reached the start of the log)"));
    console.log(`  ${s.rows_with_concept}/${s.rows_total} emit(s) carry a canon concept · ${s.concept_bearing_keys}/${s.distinct_keys} distinct habituation key(s) name a concept`);
    console.log(`  SANCTIONED PATH: \`node scripts/context.mjs daemon\` — one resident process instead of 1,440 cold cmd+node starts a day.`);
    console.log(`  The scheduler still runs the legacy lane. The task-definition swap is a captain action (NOT done by code):`);
    console.log(`    schtasks /Change /TN ArsenalFC-Context  → run \`...\\setup\\hidden_run.vbs node scripts\\context.mjs daemon\` ONLOGON, no repeat`);
    console.log(`    (or delete the repeat and start the daemon from the same cloak the thalamus uses).`);
    return;
  }
  if (mode === "daemon" || mode === "--daemon") {
    let stop = false, emits = 0;
    const onSig = () => { stop = true; };
    process.on("SIGINT", onSig); process.on("SIGTERM", onSig);
    console.log(`context: --daemon up (poll ~${FLOOR_MS / 1000}s) — ambient AW → :4113 on window change. Ctrl-C to stop.`);
    while (!stop) {
      try { const r = await sense(); if (r.emitted) { emits++; console.log(`context: → ${r.evt.text}${r.evt.concept_tokens.length ? ` [${r.evt.concept_tokens.join(", ")}]` : ""}`); } } catch { /* never taxes */ }
      await new Promise((res) => { const step = 500; let el = 0; const iv = setInterval(() => { el += step; if (stop || el >= FLOOR_MS) { clearInterval(iv); res(); } }, step); });
    }
    console.log(`context: --daemon stopped (${emits} emit(s)).`);
    return;
  }
  const r = await sense();
  // sense() returns emitted === posted, so an emitted-but-not-posted arm can never
  // print — the two "(thalamus down…)" clauses that used to sit here were dead code,
  // and the `once` one claimed "state updated" when a failed post deliberately does
  // NOT advance state (retry law above). A failed post speaks through the honest
  // branch: "no emit (post-failed-will-retry)". (Audit, 7 Aug 2026.)
  console.log(r.emitted
    ? `context: emitted → ${r.evt.text}${r.evt.concept_tokens.length ? ` [concept: ${r.evt.concept_tokens.join(", ")}]` : ""}`
    : `context: no emit (${r.reason})`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { sense, currentWindow, conceptOfTitle, status };
