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
//        node scripts/context.mjs once     → one delta check — the manual probe and the
//                                            fallback (its per-minute schtask was DELETED
//                                            9 Aug 2026; see D7 below)
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
//
// D7 (LADDER, 9 Aug 2026) — THE SWAP HAPPENED. `ArsenalFC-Context` was DELETED and
//   the bridge became the 5th resident daemon: `ArsenalFC-Brain.bat` (the live logon
//   persistence) and `setup/START_DAEMONS.vbs:30` (the manual restart verb) both start
//   `node scripts\context.mjs daemon` through the hidden_run cloak. The installer keeps
//   its retired row as history (INSTALL_CYBORG_TASKS.ps1:65) and tasks_expected.json
//   lists the task designed-ABSENT, so the watchman REDs its resurrection.
//   `status` therefore no longer describes a swap to perform — it READS the live lane.
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
// D7 — the process-table probe daemon_watchdog.mjs already uses for its four port-locked
// daemons. This bridge holds NO port (it is a poll, not a server), so the command line in
// the process table is the only place "is it up?" is answerable.
import { processStartMs } from "./conductor.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONTEXT_STATE = join(STATE_DIR, "context_state.json");        // own file (gitignored)
const AFFERENT = join(STATE_DIR, "afferent.jsonl");                 // READ-ONLY here (the thalamus owns it)
const LEDGER = join(STATE_DIR, "salience_ledger.jsonl");            // READ-ONLY here (the thalamus owns it) — see fate()
const TASKS_EXPECTED = join(STATE_DIR, "tasks_expected.json");      // READ-ONLY (the watchman's snapshot)
const DAEMONS_VBS = join(__dirname, "..", "setup", "START_DAEMONS.vbs"); // READ-ONLY (the manual restart verb)
const RESIDENT_MATCH = "context.mjs daemon";                        // the full command line, so a `status` run can't detect itself
const AW = process.env.ARSENAL_AW || "http://localhost:5600";
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const FLOOR_MS = 60000;                                             // resident poll cadence (~60s floor)

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, obj) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + "." + process.pid + ".tmp"; writeFileSync(tmp, JSON.stringify(obj, null, 2)); renameSync(tmp, p); }
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// ---------------------------------------------------------------------------
// D8 (WIRING AUDIT, 10 Aug 2026) — A CUT MUST NAME ITSELF AT THE DOOR
// ---------------------------------------------------------------------------
// MEASURED on the live bus, not inferred: of 3,000 `context` rows in afferent.jsonl,
// 19 sit at EXACTLY 200 characters of `title` and 16 at exactly 240 of `text` — and
// the longest title in the whole file is 200, the longest text 240. That is the CAP
// speaking, not the data. Not one of those rows carries a field saying so. One of
// them is a real question of his, sheared mid-word:
//   "…i can buy helium 10 platinum as well and want to first work w"
// Every receiver read that stub as the whole title: the thalamus tokenizes `evt.text`
// for concept/capsule matching (thalamus.mjs:530/867/934) and binds it into
// bound_context (:837); the distiller renders the window line from `last.title`
// (distiller.mjs:106). None of them could know a word was missing.
//
// THE CAPS THEMSELVES DO NOT MOVE. 200/240 are what this door has always shipped, the
// distiller re-clamps to 120 of its own accord, and picking a bigger number here would
// be a guessed number — his standing rule. What was missing was never ROOM, it was
// HONESTY. clipNamed returns the identical string clip() has always produced, plus the
// raw length and whether anything was lost, so the cut travels WITH the row.
// (No engine is replaced, so nothing is frozen *Legacy: clip() is untouched and still
// serves the display path in status().)
const TITLE_CAP = 200;   // verbatim, the value this door has shipped since the bridge was built
const TEXT_CAP = 240;    // ditto — measured above as the live ceiling, not a new choice
const clipNamed = (s, n) => {
  const raw = String(s || "").replace(/\s+/g, " ").trim();   // same normalisation clip() does
  return { value: raw.slice(0, n), len: raw.length, truncated: raw.length > n };
};

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
  const concept = conceptOfTitle(win.title, deps);     // #22 — still on the RAW title, BEFORE any cut
  const t = clipNamed(win.title, TITLE_CAP);
  const x = clipNamed(`${win.app} · ${win.title}`, TEXT_CAP);
  const evt = {
    modality: "context", source: "activitywatch",
    app: win.app, title: t.value,
    text: x.value,
    // D8 — the cut, NAMED, and ALWAYS emitted both ways. `false` here is a MEASURED
    // "nothing was lost"; a row from before 10 Aug 2026 has no such field at all and
    // the honest answer there is UNKNOWN. Three states, never two — the same law
    // setpiece.mjs:1199 keeps ("UNKNOWN is a real THIRD producer state"). The lengths
    // are the raw, pre-cut char counts, so a receiver can see HOW MUCH it is missing.
    title_len: t.len, title_truncated: t.truncated,
    text_len: x.len, text_truncated: x.truncated,
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

// ---------------------------------------------------------------------------
// D7 — THE LANE IS READ LIVE, NEVER ASSERTED IN PROSE (10 Aug 2026)
// ---------------------------------------------------------------------------
// Until today `status` printed, on EVERY run, "The scheduler still runs the legacy
// lane" plus a `schtasks /Change /TN ArsenalFC-Context …` line for him to type. Both
// had been false since 9 Aug: the task was deleted (verified — `schtasks /Query /TN
// ArsenalFC-Context` → "ERROR: The system cannot find the file specified.") and the
// resident daemon had been the live lane for a day (PID 21308, `node scripts\context.mjs
// daemon`). So the organ's ONLY health surface stated a false fact about his running
// system and handed him a command that errors — a command-to-remember for a task that
// no longer exists, which the anchor law forbids.
// The repair is not fresher prose (prose rots on the next schedule change, which is how
// this line died). The lane is DERIVED from the authorities that already exist:
//   · the PROCESS TABLE via conductor.mjs's exported processStartMs — is the bridge up;
//   · setup/START_DAEMONS.vbs — would a restart bring it back;
//   · tasks_expected.json `designed_absent` — the same snapshot watchman.mjs:826 REDs
//     the task's resurrection from. Read-only in all three; this organ owns only
//     context_state.json.
// Facts only, never an imperative: selftest asserts the printed lines carry no command.
function lane(deps = {}) {
  const expected = deps.expected !== undefined ? deps.expected : readJson(TASKS_EXPECTED);
  const note = (expected && expected.designed_absent && expected.designed_absent["ArsenalFC-Context"]) || null;
  // The probe shells PowerShell (Win32_Process). On a non-Windows checkout — the away-day
  // CI shape — there is no process table to read, and "I could not look" must never print
  // as "it is down". null = UNKNOWN, and it says so.
  let startedMs = null, probed = process.platform === "win32";
  if (deps.residentStartMs !== undefined) { startedMs = deps.residentStartMs; probed = true; }
  else if (probed) { try { startedMs = processStartMs(RESIDENT_MATCH); } catch { startedMs = null; } }
  const vbs = deps.vbs !== undefined ? deps.vbs
    : (existsSync(DAEMONS_VBS) ? (() => { try { return readFileSync(DAEMONS_VBS, "utf8"); } catch { return null; } })() : null);
  return {
    platform: process.platform,
    resident_running: probed ? startedMs != null : null,
    resident_since: startedMs != null ? new Date(startedMs).toISOString() : null,
    restart_verb_wired: vbs == null ? null : vbs.includes(RESIDENT_MATCH),
    per_minute_task_designed_absent: !!note,
    designed_absent_note: note,
  };
}

// ---------------------------------------------------------------------------
// WIRING AUDIT (10 Aug 2026) — THE COUNTER MUST BE ABLE TO SEE ITS OWN DEAD WIRE
// ---------------------------------------------------------------------------
// Everything `status` counted was about whether this bridge SPEAKS — emits/day, concept
// coverage, distinct habituation keys, last emit. Nothing about whether anything HEARD.
// So it read healthy for weeks over a wire that never reached its stated target: MEASURED
// this run, salience_ledger.jsonl holds 2,999 moments whose modalities include `context`
// and ALL 2,999 came back outcome:"reflex" (highest S ever 0.244, against a tau1_eff that
// never fell below 0.40); of the 48 moments in the ledger that DID leave reflex, not one
// carries `context`, so wake_queue.jsonl's 38 rows hold zero. A producer health-read that
// cannot say "0 of N crossed" is exactly how a dead wire keeps its green light — the same
// shape as the recital audit that was written every turn and read by nobody.
// READ-ONLY on salience_ledger.jsonl: the thalamus is its sole writer and stays it.
// NO THRESHOLD and NO VERDICT is added here — the ceiling actually reached and the bar
// actually faced are both counters, and a "healthy/unhealthy" line would be a guessed
// number. The reader draws the conclusion; this only makes it visible.
function fate(deps = {}) {
  const rep = deps.ledgerRep !== undefined ? deps.ledgerRep : jsonlTailReport(SCAN_ROWS, { file: LEDGER });
  // the ledger keys the modality LIST (thalamus.mjs:843 `modalities`), not `modality` —
  // a bound moment can carry several, and context rides as one of them.
  const ctx = rep.rows.filter(r => r && Array.isArray(r.modalities) && r.modalities.includes("context"));
  const crossed = ctx.filter(r => r.outcome && r.outcome !== "reflex");
  const sVals = ctx.map(r => Number(r.S)).filter(Number.isFinite);
  const tVals = ctx.map(r => Number(r.tau1_eff)).filter(Number.isFinite);
  return {
    scored_moments: ctx.length,
    left_reflex: crossed.length,
    outcomes: [...new Set(crossed.map(r => String(r.outcome)))],
    max_S: sVals.length ? Math.max(...sVals) : null,
    min_tau1_eff: tVals.length ? Math.min(...tVals) : null,
    ledger_scan_complete: rep.complete,
  };
}

function status(deps = {}) {
  const rep = deps.rep || jsonlTailReport(SCAN_ROWS, { file: AFFERENT });
  const ctx = rep.rows.filter(r => r && r.modality === "context");
  const keys = new Set(ctx.map(r => String(r.event_key || "")));
  const conceptKeys = [...keys].filter(k => k.split(":").length > 2);
  const withConcept = ctx.filter(r => Array.isArray(r.concept_tokens) && r.concept_tokens.length).length;
  // D8 — THE FLAG HAS A READER FROM THE HOUR IT WAS BORN. A producer with no consumer is
  // a black box, which is the exact defect this repair exists to end: the cut is counted
  // here, on the organ's own health surface, so a door that starts shearing his titles
  // shows up as a number instead of as silence. Rows with no flag are the pre-D8 history
  // and are counted SEPARATELY as unknown — never folded into "clean".
  const cutRows = ctx.filter(r => r.title_truncated === true || r.text_truncated === true).length;
  const unknownCut = ctx.filter(r => r.title_truncated === undefined).length;
  const longestRaw = ctx.reduce((m, r) => (Number.isFinite(r.title_len) && r.title_len > m ? r.title_len : m), 0);
  const days = new Set(ctx.map(r => String(r.ts || "").slice(0, 10)).filter(Boolean));
  const st = deps.state !== undefined ? deps.state : readJson(CONTEXT_STATE);
  const nowMs = (deps.now ? new Date(deps.now) : new Date()).getTime();
  const emitMs = st && st.emit_ts ? Date.parse(st.emit_ts) : NaN;
  return {
    scanned_rows: rep.rows.length, scan_complete: rep.complete,
    context_rows: ctx.length, active_days: days.size,
    emits_per_day: days.size ? Math.round(ctx.length / days.size) : 0,
    distinct_keys: keys.size, concept_bearing_keys: conceptKeys.length,
    rows_with_concept: withConcept, rows_total: ctx.length,
    rows_title_or_text_cut: cutRows, rows_cut_unknown: unknownCut, longest_raw_title_len: longestRaw,
    title_cap: TITLE_CAP, text_cap: TEXT_CAP,
    // its OWN file — the last window it actually shipped, as a stamp and a raw age.
    // No freshness threshold lives here: an age is a counter, a verdict would be a
    // guessed number (his standing rule).
    last_emit: st && st.emit_ts ? st.emit_ts : null,
    last_emit_age_min: Number.isFinite(emitMs) ? Math.round((nowMs - emitMs) / 60000) : null,
    last_window: st && st.app ? `${st.app} · ${clip(st.title, 60)}` : null,
    lane: deps.lane !== undefined ? deps.lane : lane(deps),
    // what the stream's emits actually BECAME downstream (see fate() above)
    fate: deps.fate !== undefined ? deps.fate : fate(deps),
  };
}

// The printed surface, as a pure function, so the selftest can assert what it SAYS —
// the old rot was in a console.log nothing could reach.
function statusLines(s) {
  const ln = s.lane || {};
  const l = [];
  l.push(`context: ${s.context_rows} emit(s) across ${s.active_days} day(s) = ~${s.emits_per_day}/day, from the last ${s.scanned_rows} afferent row(s)` +
    (s.scan_complete ? "" : " (the scan reached the start of the log)"));
  l.push(`  ${s.rows_with_concept}/${s.rows_total} emit(s) carry a canon concept · ${s.concept_bearing_keys}/${s.distinct_keys} distinct habituation key(s) name a concept`);
  l.push(`  ${s.rows_title_or_text_cut} emit(s) shipped a CUT title/text (cap ${s.title_cap}/${s.text_cap}, longest raw title seen ${s.longest_raw_title_len || "—"})` +
    (s.rows_cut_unknown ? ` · ${s.rows_cut_unknown} older row(s) predate the flag — whether they were cut is UNKNOWN` : ""));
  l.push(`  LANE: the resident daemon is the live path (\`node scripts/context.mjs daemon\`); \`once\` is the manual probe + fallback.`);
  l.push(`    resident process: ` + (ln.resident_running === null
    ? `UNKNOWN — the process probe is Windows-only (platform=${ln.platform})`
    : ln.resident_running ? `UP since ${ln.resident_since}`
      : `NOT IN THE PROCESS TABLE — the bridge is dark, nothing is emitting ambient context`));
  l.push(`    restart verb: ` + (ln.restart_verb_wired === null
    ? `setup/START_DAEMONS.vbs not readable from here`
    : ln.restart_verb_wired ? `setup/START_DAEMONS.vbs carries the \`${RESIDENT_MATCH}\` line`
      : `setup/START_DAEMONS.vbs has NO \`${RESIDENT_MATCH}\` line — a restart would not bring the bridge back`));
  l.push(`    per-minute task: ` + (ln.per_minute_task_designed_absent
    ? `retired by design — tasks_expected.json: ${ln.designed_absent_note}`
    : `tasks_expected.json does not list ArsenalFC-Context as designed-absent — the retirement is unrecorded where the watchman reads it`));
  l.push(`    last emit: ` + (s.last_emit ? `${s.last_emit} (${s.last_emit_age_min} min ago) · ${s.last_window}` : `context_state.json holds no emit stamp yet`));
  // WHERE THE EMITS LANDED — the half this surface could not see until 10 Aug 2026.
  const f = s.fate || {};
  l.push(`  DOWNSTREAM: ${f.left_reflex}/${f.scored_moments} scored moment(s) carrying context left reflex` +
    (f.left_reflex ? ` (${f.outcomes.join(", ")})` : ``) +
    (f.max_S == null ? `` : ` · highest S reached ${f.max_S} against a lowest tau1_eff of ${f.min_tau1_eff}`) +
    (f.ledger_scan_complete ? `` : ` (the ledger scan reached the start of the log)`));
  l.push(`    the cortex reads this stream as the ambient WHERE-HE-WAS line on every wake (cortex.mjs ambientWindow),`);
  l.push(`    which is corroboration — it is NOT a wake trigger, and crossing tau1 is not what this stream is for.`);
  return l;
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
  const REP = { rows: [
    { modality: "context", ts: "2026-08-01T10:00:00Z", event_key: "context:chrome.exe", concept_tokens: [] },
    { modality: "context", ts: "2026-08-01T11:00:00Z", event_key: "context:chrome.exe:embeddings", concept_tokens: ["embeddings"] },
    { modality: "voice", ts: "2026-08-02T11:00:00Z", event_key: "voice:x" },
  ], complete: true };
  // the downstream fixture, injected for the same FIXTURE-law reason as REG above: without
  // it every status() below would tail the LIVE salience_ledger and the verdict would move
  // with whatever the thalamus scored this afternoon.
  const LEDGER_REP = { rows: [
    { modalities: ["context"], S: 0.244, tau1_eff: 0.4, outcome: "reflex" },
    { modalities: ["context"], S: 0.0, tau1_eff: 0.75, outcome: "reflex" },
    { modalities: ["voice", "context"], S: 0.7, tau1_eff: 0.4, outcome: "wake" },
    { modalities: ["code"], S: 0.6, tau1_eff: 0.4, outcome: "wake" },
  ], complete: true };
  const FATE = fate({ ledgerRep: LEDGER_REP });
  const st = status({ rep: REP, lane: {}, state: null, fate: FATE });
  assert("#22/#106 status reports have/need counters, not a status word",
    st.context_rows === 2 && st.rows_with_concept === 1 && st.concept_bearing_keys === 1 && st.distinct_keys === 2 && st.active_days === 1);

  // ------------------------------------------------------------------------
  // D8 REGRESSION (WIRING AUDIT, 10 Aug 2026) — THE CUT MUST NAME ITSELF, AND
  // SOMETHING MUST READ THE NAME.
  // Live before this fix: 19 of 3,000 context rows at EXACTLY 200 chars of title,
  // 16 at exactly 240 of text, longest-in-file = the cap, and ZERO rows carrying any
  // field that said so — one of them a real question of his sheared at "first work w".
  // These fail if the flag is dropped, if it ever LIES about the string beside it, if
  // the quiet case stops emitting a measured `false`, or if `status` stops counting it.
  // ------------------------------------------------------------------------
  const LONG = "i sell products on amazon usa from india so which AI platform is the best to understand how to do marketing and how to run amazon PPC ads, i can buy helium 10 platinum as well and want to first work without it so search deep on";
  let pl = null;
  await sense({ now, registry: REG, window: { app: "chrome.exe", title: LONG }, prev: null, post: async (e) => { pl = e; return true; }, save: () => {} });
  assert("D8 an over-length title ships its cut NAMED — title_truncated + the raw length it was cut from",
    pl.title_truncated === true && pl.title_len === LONG.length && pl.title_len === 227 && pl.title.length === 200);
  // THE BOUNDARY, and it is not a nicety: this very row's `text` is 240 chars — EXACTLY
  // the cap — because `chrome.exe · ` + 227 = 240. Nothing was lost, so the honest answer
  // is false. A cheaper flag written as `length >= cap` would have called this a cut and
  // taught every receiver to distrust a complete string. (Found by this assertion failing
  // on its first run, 10 Aug 2026 — the fixture is the real sheared row from the live bus.)
  assert("D8 a string landing EXACTLY on the cap is NOT a cut — nothing lost, so the flag says false",
    pl.text.length === 240 && pl.text_len === 240 && pl.text_truncated === false &&
    pl.text === `chrome.exe · ${LONG}`);
  let px = null;
  await sense({ now, registry: REG, window: { app: "WindowsTerminal.exe", title: LONG }, prev: null, post: async (e) => { px = e; return true; }, save: () => {} });
  assert("D8 one char past the cap IS a cut, and the text side names it too",
    px.text_len === `WindowsTerminal.exe · ${LONG}`.length && px.text_len > 240 &&
    px.text_truncated === true && px.text.length === 240);
  assert("D8 the flag cannot LIE — the shipped string is exactly min(raw length, cap) in both fields",
    pl.title.length === Math.min(pl.title_len, 200) && pl.text.length === Math.min(pl.text_len, 240) &&
    pl.title === LONG.slice(0, 200) && pl.text === `chrome.exe · ${LONG}`.slice(0, 240));
  let ps = null;
  await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: null, post: async (e) => { ps = e; return true; }, save: () => {} });
  assert("D8 a short title emits a MEASURED false, never an absent field (absent = the pre-D8 UNKNOWN, a different fact)",
    ps.title_truncated === false && ps.text_truncated === false && ps.title_len === 8 &&
    ps.text_len === "Code.exe · drill.py".length && ps.title === "drill.py");
  assert("D8 the cut never touches the concept wire — conceptOfTitle still reads the RAW title, before the clip",
    pl.event_key === "context:chrome.exe" && pl.title_truncated === true &&
    conceptOfTitle(LONG + " embeddings", { registry: REG }) === "embeddings");
  // THE CONSUMER — a flag no organ reads is the very defect this repair ends.
  const CUTREP = { rows: [
    { modality: "context", ts: "2026-08-10T10:00:00Z", event_key: "context:chrome.exe", concept_tokens: [], title_truncated: true, title_len: 236, text_truncated: true },
    { modality: "context", ts: "2026-08-10T11:00:00Z", event_key: "context:Code.exe", concept_tokens: [], title_truncated: false, title_len: 8, text_truncated: false },
    { modality: "context", ts: "2026-07-20T11:00:00Z", event_key: "context:chrome.exe", concept_tokens: [] },   // pre-D8: no flag at all
  ], complete: true };
  const cs = status({ rep: CUTREP, lane: {}, state: null });
  assert("D8 status COUNTS the cut and keeps pre-flag rows as a separate UNKNOWN, never folded into clean",
    cs.rows_title_or_text_cut === 1 && cs.rows_cut_unknown === 1 && cs.longest_raw_title_len === 236 &&
    cs.title_cap === 200 && cs.text_cap === 240);
  assert("D8 the health surface SAYS it — the cut reaches the printed lines, with the cap and the raw length",
    statusLines(cs).some(l => /1 emit\(s\) shipped a CUT title\/text \(cap 200\/240, longest raw title seen 236\)/.test(l)) &&
    statusLines(cs).some(l => /1 older row\(s\) predate the flag — whether they were cut is UNKNOWN/.test(l)));

  // ------------------------------------------------------------------------
  // D7 REGRESSION (10 Aug 2026) — THE HEALTH SURFACE MUST NOT NAME A DEAD TASK.
  // Before this fix `status` printed "The scheduler still runs the legacy lane" and a
  // `schtasks /Change /TN ArsenalFC-Context` line — a false fact plus a command that
  // errors, weeks after that task was deleted. These fail if either comes back, and if
  // the lane ever stops being DERIVED from the process table / restart verb /
  // tasks_expected.json.
  // ------------------------------------------------------------------------
  const laneUp = lane({ expected: { designed_absent: { "ArsenalFC-Context": "the bridge rides the resident daemon now" } },
    residentStartMs: Date.parse("2026-08-10T04:00:00Z"), vbs: 'sh.Run "…hidden_run.vbs"" node scripts\\context.mjs daemon", 0, False' });
  assert("D7 the lane is DERIVED — process table + restart verb + tasks_expected, never prose",
    laneUp.resident_running === true && laneUp.resident_since === "2026-08-10T04:00:00.000Z" &&
    laneUp.restart_verb_wired === true && laneUp.per_minute_task_designed_absent === true);
  const laneDark = lane({ expected: { designed_absent: {} }, residentStartMs: null, vbs: "' this restart verb forgot the bridge" });
  assert("D7 a dark bridge is NAMED, not silent (no process · unwired restart verb · unrecorded retirement)",
    laneDark.resident_running === false && laneDark.restart_verb_wired === false && laneDark.per_minute_task_designed_absent === false);
  const upLines = statusLines(status({ rep: REP, lane: laneUp, now: "2026-08-10T05:00:00Z", fate: FATE,
    state: { app: "chrome.exe", title: "Embeddings 101", emit_ts: "2026-08-10T04:45:00Z" } }));
  assert("D7 status hands him NO command and names NO dead task — the anchor law",
    upLines.every(l => !/schtasks/i.test(l)) && upLines.every(l => !/scheduler still runs|legacy lane|ArsenalFC-Context\s/i.test(l)));
  assert("D7 status states the LIVE lane: the resident daemon, with its start stamp and last emit",
    upLines.some(l => /resident process: UP since 2026-08-10T04:00:00\.000Z/.test(l)) &&
    upLines.some(l => /last emit: 2026-08-10T04:45:00Z \(15 min ago\) · chrome\.exe · Embeddings 101/.test(l)));
  const darkLines = statusLines(status({ rep: REP, lane: laneDark, state: null, fate: FATE }));
  // ------------------------------------------------------------------------
  // WIRING AUDIT REGRESSION (10 Aug 2026) — THE BLIND COUNTER, HELD OPEN.
  // Before this fix `status` counted only emits and knew nothing of their fate, so it
  // read healthy across 2,999 consecutive reflex outcomes. These fail if the downstream
  // read is dropped, if it stops keying on the ledger's `modalities` LIST, or if the
  // printed surface stops naming "N of M left reflex".
  // ------------------------------------------------------------------------
  assert("#wire fate() reads the ledger's modalities LIST and separates crossed from reflex",
    FATE.scored_moments === 3 && FATE.left_reflex === 1 && FATE.outcomes.join() === "wake");
  assert("#wire it reports the ceiling REACHED against the bar FACED — counters, never a verdict word",
    FATE.max_S === 0.7 && FATE.min_tau1_eff === 0.4 && !/ok|healthy|fine/i.test(JSON.stringify(FATE)));
  assert("#wire the printed surface names the downstream count, so a dead wire can never show a green light again",
    upLines.some(l => /DOWNSTREAM: 1\/3 scored moment\(s\) carrying context left reflex/.test(l)) &&
    upLines.some(l => /highest S reached 0\.7 against a lowest tau1_eff of 0\.4/.test(l)));
  assert("#wire the surface names its CONSUMER — the cortex's ambient line — and says crossing tau1 is not the point",
    upLines.some(l => /cortex\.mjs ambientWindow/.test(l)) && upLines.some(l => /NOT a wake trigger/.test(l)));
  assert("#wire an EMPTY ledger reports zero honestly, never null-crashes the surface",
    fate({ ledgerRep: { rows: [], complete: true } }).scored_moments === 0 &&
    fate({ ledgerRep: { rows: [], complete: true } }).max_S === null &&
    statusLines(status({ rep: REP, lane: laneDark, state: null, fate: fate({ ledgerRep: { rows: [], complete: true } }) }))
      .some(l => /DOWNSTREAM: 0\/0/.test(l)));
  assert("D7 the dark case speaks in full — bridge down, restart verb unwired, no emit stamp",
    darkLines.some(l => /NOT IN THE PROCESS TABLE/.test(l)) &&
    darkLines.some(l => /has NO `context\.mjs daemon` line/.test(l)) &&
    darkLines.some(l => /holds no emit stamp yet/.test(l)));
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "once").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    for (const l of statusLines(status())) console.log(l);
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

export { sense, currentWindow, conceptOfTitle, status, lane, statusLines };
