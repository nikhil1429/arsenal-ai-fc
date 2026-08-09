#!/usr/bin/env node
// ============================================================================
// distiller.mjs · ARSENAL AI FC — THE WORKING SET (Phase 1, the ADHD-tax remover)
// ----------------------------------------------------------------------------
// WHAT: a cheap continuous pass that keeps a ~1KB externalized 4-slot working
//   memory ALWAYS current, so the captain's prefrontal cortex never carries
//   context across a surface switch. The 4 slots (his measured limit):
//     · concept_in_motion  — what he's actually working/learning right now
//     · open_loop          — the unfinished thread / the doubt still hanging
//     · where_left_off     — the last concrete thing, so re-entry is a READ
//     · next_step          — the obvious next move (never invented; from drills)
// ENGINE: the FREE Gemini-flash pool (hippocampus.generatePool) — ZERO Max budget
//   — with a DETERMINISTIC FLOOR built from the raw stream so the set is never
//   empty or broken even when the pool is dry. (Registered as fuelboard tank T8.)
// LAWS: SINGLE WRITER of working_set.json. Reads afferent.jsonl + workspace.json
//   + presence_log.jsonl + drills.json READ-ONLY (single-writer law intact).
//   Never invents a next_step — it comes from drills.json or stays empty.
// MODES: run (default) · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// #51 — the shared, archive-tolerant tail reader owned by presence.mjs (the ledger's
// sole writer). presence_log.jsonl now rolls monthly, so a reader that only ever
// opened `presence_log.jsonl` would silently read a rolled month as an empty history.
import { presenceTail } from "./presence.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WORKING_SET = join(STATE_DIR, "working_set.json");

// ---------------------------------------------------------------------------
// #21 — HIS WORDS, NOT HIS WINDOW CAPTIONS (audit 2 Aug 2026, findings 14 & 15)
// ---------------------------------------------------------------------------
// working_set.json is the captain's RE-ENTRY CARD: spliced into get_context, read
// by learnstate's SessionStart brief, named in CLAUDE.md. Measured on the live
// stream: context.mjs emits ~145 window-change afferents a day against ~40 typed
// prompts, so the 25-row window ran 84% window CAPTIONS (21 of 25), and 87 of 553
// historical windows were 100% captions. The deterministic floor then took
// stream[last] for BOTH concept_in_motion and where_left_off — a window title in
// 344 of 553 windows (62.2%). Live value at the time of the audit, in the file the
// session reads to remember him: "claude.exe · Claude".
//
// THE TRAP (ORGANISM_ISSUES.md): do NOT budget the window without repairing the
// floor — the floor is the part that fails, and it fails deterministically. All
// three cuts land together below.
//
// CUT 1 (here): `context` leaves INTERACTIVE. It is NOT deleted and NOT unread —
// rule 3, every organ keeps an address: the newest context row is now carried as
// the CURRENT-WINDOW line (`currentWindow` below), one line, in the prompt preamble
// and in working_set.current_window. Corroboration, never a his-words slot.
// brain.mjs:366 keeps "context" in its own liveSignal list — that consumer wants
// exactly this signal and is explicitly out of scope.
const INTERACTIVE_LEGACY = ["voice", "code", "desktop-study", "note", "context", "throwin"];   // FROZEN: the pre-audit window
// "gemini" joined 9 Aug 2026 (P7 harvest lane, his 'data flows everywhere' word):
// his harvested Gemini sittings are interactive study, same class as "code".
const INTERACTIVE = ["voice", "code", "desktop-study", "note", "throwin", "gemini"];
const AMBIENT = ["context"];                     // sensed, carried, but never a his-words slot
const DOUBT_RE = /\?|kyun|kyu|samajh|confus|doubt|nahi aa|stuck|matlab|difference|kaise|why|how does/i;
// A window caption, measured shapes from the live afferent log: "claude.exe · Claude",
// "WindowsTerminal.exe · Terminal", "explorer.exe ·", "SearchHost.exe · Search".
// Deliberately narrow — it anchors on an executable/app name at the START of the
// string, so nothing he actually types can be mistaken for one.
const CAPTION_RE = /^\s*[^\s·|]+\.(exe|app|dmg|lnk)\b/i;
const looksLikeWindowCaption = (s) => CAPTION_RE.test(String(s || ""));

function readLines(p) {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const clampStr = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// the freshest slice of what he's been doing, newest last — HIS surfaces only.
// `rows` is injectable so one parse of afferent.jsonl serves both readers below.
function recentStream(dir = STATE_DIR, n = 25, modalities = INTERACTIVE, rows = null) {
  return (rows || readLines(join(dir, "afferent.jsonl")))
    .filter(a => modalities.includes(a.modality) && String(a.text || "").trim().length > 2)
    .slice(-n)
    // `source` is CARRIED, not dropped (audit #108 verify pass, 6 Aug 2026). The
    // his-words deny-list added below screens on source, and this projection was
    // silently deleting the field on every production row — so isHisSource() read
    // undefined, "" was not in the deny Set, and NOTHING was ever denied. The fix
    // tested green only because its assertions injected `deps.stream` by hand, a
    // shape no real caller produces. A filter is worth exactly as much as the field
    // it filters on surviving the hop before it.
    .map(a => ({ ts: a.ts, modality: a.modality, source: a.source, text: clampStr(a.text, 400) }));
}
// THE ADDRESS FOR THE AMBIENT STREAM (rule 3: never delete an organ because nobody
// reads its output — give it a surface). context.mjs's ~145 emits/day are no longer
// allowed to consume 21 of his 25 evidence rows; they arrive as ONE line of
// corroboration: where the machine currently is, plainly labelled as such.
function currentWindow(dir = STATE_DIR, rows = null) {
  const amb = (rows || readLines(join(dir, "afferent.jsonl"))).filter(a => AMBIENT.includes(a.modality));
  const last = amb[amb.length - 1];
  if (!last) return null;
  return { ts: last.ts, app: last.app || "", title: last.title || "", text: clampStr(last.text || `${last.app || ""} · ${last.title || ""}`, 120) };
}

// DETERMINISTIC FLOOR — honest, never fabricated. Fills every slot from real data
// so the working set is always usable even with no LLM.
//
// CUT 2 (#21). This function's header promise — "so the set is never empty or
// broken even when the pool is dry" — failed deterministically 62% of the time,
// because `stream[stream.length - 1]` was a WINDOW CAPTION in 344 of 553 measured
// windows and it fed BOTH concept_in_motion and where_left_off. Two repairs:
//   · CUT 1 removed `context` from the stream, so `last` is now his last utterance;
//   · this belt-and-braces guard rejects a caption even if a caller hands one in
//     (a stale afferent row, a future modality, an injected fixture). where_left_off
//     means "the last concrete thing HE did" — "claude.exe · Claude" is not that.
// If every candidate row is a caption the slot stays EMPTY. An empty slot is a
// truthful "nothing recorded"; a caption is a lie that reads like an answer.
// CUT 3 — THE SELF-CAPTURE LEAK, REOPENED ON A NEW KEY (audit #108, 6 Aug 2026).
// The 25 Jul leak was closed on `modality`; this one walked back in on `source`.
// The Stop hook captures the ASSISTANT'S last message as `source:"claude-code-teaching"`
// with `modality:"code"` — deliberately, so what he was TAUGHT reaches the one working
// memory. But that modality is identical to his own typed prompts (`source:"claude-code"`),
// so a modality-only screen cannot tell the two apart, and 377 rows of my own prose were
// counting as HIS words. Measured cost: working_set.json reported `his_words: 25 /
// sources_scanned: 25` — a perfect 100%-his score — while roughly 11 of those 25 rows fed
// to the LLM were mine, which is how the brief came to print MY audit task as his
// LAST SESSION and OPEN LOOP. An organism that reads its own output back as his words
// starts predicting itself.
// Three sibling organs already had this exact deny-list and distiller was the only one
// without it: nightshift.mjs NOT_HIS_SOURCES, thalamus.mjs self_deny_sources (also in
// thalamus_config.json), hippocampus.mjs. We copy them EXACTLY rather than inventing a
// broader rule: `claude-code` is HIS 538 typed prompts and must keep passing — a prefix
// match on /^claude-code/ would have silently deleted his single largest written source.
const NOT_HIS_SOURCES = new Set(["claude-code-teaching", "gemini-study-teaching"]);   // gemini pair added 9 Aug 2026 (P7)
const isHisSource = (s) => !NOT_HIS_SOURCES.has(String((s && s.source) || "").toLowerCase());
const hisWords = (stream) => (stream || []).filter(s => s && !AMBIENT.includes(s.modality) && !looksLikeWindowCaption(s.text) && isHisSource(s));

function deterministicSet(stream, presence, drills) {
  const own = hisWords(stream);
  const last = own[own.length - 1];
  const lastDoubt = [...own].reverse().find(s => DOUBT_RE.test(s.text));
  const pull = (presence || []).slice().reverse().find(r => Array.isArray(r.pull_words) && r.pull_words.length);
  // E2E audit (25 Jul 2026): this read `drills[0].concept || drills[0].title` and
  // NEITHER KEY EXISTS. setpiece.mjs is the sole writer of drills.json and stamps
  // every row as { kind, probe_type_emoji, concepts: [...], prompt, source, ... } —
  // `concepts` is an ARRAY, and there is no `concept`/`title` anywhere. So next_step
  // was silently "" on every real 15-min run (confirmed live: drills[0].concepts =
  // ["embeddings"], floor next_step = ""), which handed the slot to whatever the
  // LLM felt like inventing — the exact thing the header LAW forbids. Read the real
  // schema: first string concept, else the drill's own prompt (floor_touch rows are
  // written with concepts: [] and carry the whole instruction in `prompt`).
  // Still never invented: verbatim from drills.json, or empty.
  const d0 = drills && Array.isArray(drills.drills) ? drills.drills[0] : null;
  const c0 = d0 && Array.isArray(d0.concepts) ? d0.concepts.find(c => typeof c === "string" && c.trim()) : "";
  const nextDrill = c0 || (d0 && typeof d0.prompt === "string" ? d0.prompt : "");
  return {
    concept_in_motion: last ? clampStr(last.text, 80) : (pull ? clampStr(pull.pull_words.join(" "), 60) : ""),
    open_loop: lastDoubt ? clampStr(lastDoubt.text, 160) : "",
    where_left_off: last ? clampStr(last.text, 200) : "",
    next_step: clampStr(nextDrill, 120),
  };
}

function buildPrompt(stream, workspace, window = null) {
  const lines = stream.map(s => `[${String(s.ts).slice(11, 16)} ${s.modality}] ${s.text}`).join("\n");
  const moment = workspace && workspace.moment ? JSON.stringify(workspace.moment).slice(0, 600) : "(none)";
  // The ambient window is CORROBORATION, labelled as such, and the model is told in
  // as many words that a window caption is not an answer (#21: 21 of the old 25
  // evidence rows were captions and the model was asked to describe his working
  // memory from a list of them).
  const win = window ? `${window.app || ""}${window.title ? " · " + window.title : ""}`.trim() : "";
  return `You maintain a captain's WORKING MEMORY — 4 slots, his measured limit. Read his recent activity and return ONLY a JSON object with exactly these string keys, each <= 160 chars, in HIS register (Hinglish ok), grounded ONLY in the activity below (never invent facts or numbers):
{"concept_in_motion":"what he is actually working on / learning right now","open_loop":"the unfinished thread or the doubt still hanging (empty string if none)","where_left_off":"the last concrete thing he did, so re-entry is a glance","next_step":"the obvious next move IF one is clearly implied, else empty string"}
No preamble, no markdown, JSON only.
NEVER put an app or window name (anything like "chrome.exe · Google") in a slot — that is where his machine is, not what he is doing. If a slot has no grounded answer, return "" for it.

CURRENT MOMENT: ${moment}
HE IS CURRENTLY IN (context only, never an answer): ${win || "(unknown)"}

RECENT ACTIVITY (oldest first):
${lines || "(quiet — no recent interactive activity)"}`;
}

// Truncation-proof: extract each field on its own so a response cut off mid-JSON
// (maxOutputTokens) still yields every slot that finished, instead of parsing to
// nothing. Returns null only when NOTHING parsed (then the deterministic floor stands).
function parseSet(text) {
  const s = String(text || "");
  const field = (k) => {
    const m = s.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    return m ? clampStr(m[1].replace(/\\"/g, '"').replace(/\\[nrt]/g, " "), 200) : "";
  };
  const set = {
    concept_in_motion: field("concept_in_motion"), open_loop: field("open_loop"),
    where_left_off: field("where_left_off"), next_step: field("next_step"),
  };
  return (set.concept_in_motion || set.open_loop || set.where_left_off || set.next_step) ? set : null;
}

// FROZEN — the original merge, kept verbatim (layering law). It let the LLM win on
// EVERY slot, next_step included, which is why the invented-next_step leak below was
// possible. Reference only; `merge` is the plan of record.
function mergeLegacy(llm, floor) {
  const out = {};
  for (const k of ["concept_in_motion", "open_loop", "where_left_off", "next_step"]) out[k] = (llm && llm[k]) || floor[k] || "";
  return out;
}

// LLM value wins where present; the deterministic floor fills every gap.
// EXCEPT next_step. E2E audit (25 Jul 2026): this file's own header LAW is "Never
// invents a next_step — it comes from drills.json or stays empty", but mergeLegacy
// took the LLM's next_step whenever the floor was blank — and thanks to the schema
// bug above the floor was ALWAYS blank, so the captain's re-entry card was being
// handed a next move Gemini made up, with a drills.json sitting right there. Now
// next_step is floor-only: drills.json or "", full stop. The other three slots keep
// the old behaviour (LLM phrasing is the point there — it is grounded in the stream).
// FROZEN — the post-25-Jul merge, kept verbatim (layering law). next_step was already
// floor-only here; what it still did was splice the floor into ANY slot the LLM left
// blank, with no check on what the floor held. Reference only; `merge` is the record.
function mergeV2Legacy(llm, floor) {
  const out = {};
  for (const k of ["concept_in_motion", "open_loop", "where_left_off"]) out[k] = (llm && llm[k]) || (floor && floor[k]) || "";
  out.next_step = (floor && floor.next_step) || "";
  return out;
}

// CUT 3 (#21). The audit's sharpest point: the floor was NOT confined to pool-dry
// runs. `(llm && llm[k]) || (floor && floor[k])` falls back PER SLOT, so a perfectly
// healthy gemini-flash run that returned where_left_off:"" — the exact case this
// file's own selftest exercises — spliced "claude.exe · Claude" into his re-entry
// card on the NORMAL path. Two changes, both about honesty rather than taste:
//   1. The caption guard applies to BOTH sides. Neither an LLM echoing the prompt's
//      window line nor a floor built from a stale row may put a caption in a slot.
//   2. Every slot records WHERE it came from (`slot_sources`: llm | floor | empty).
//      A blank slot is now legible as "nothing recorded" instead of being
//      indistinguishable from "the LLM chose not to answer".
function merge(llm, floor) {
  const out = {}, sources = {};
  const clean = (v) => { const s = String(v || "").trim(); return s && !looksLikeWindowCaption(s) ? s : ""; };
  for (const k of ["concept_in_motion", "open_loop", "where_left_off"]) {
    const fromLlm = clean(llm && llm[k]);
    const fromFloor = clean(floor && floor[k]);
    out[k] = fromLlm || fromFloor || "";
    sources[k] = fromLlm ? "llm" : fromFloor ? "floor" : "empty";
  }
  // next_step stays drills-only (the header LAW) — an LLM-invented next move never wins.
  out.next_step = (floor && floor.next_step) || "";
  sources.next_step = out.next_step ? "floor" : "empty";
  out.slot_sources = sources;
  return out;
}

async function distill(deps = {}) {
  const dir = deps.dir || STATE_DIR;
  // ONE parse of afferent.jsonl serves both the his-words stream and the ambient line.
  const afferent = deps.afferent !== undefined ? deps.afferent : (deps.stream ? [] : readLines(join(dir, "afferent.jsonl")));
  const stream = deps.stream || recentStream(dir, 25, INTERACTIVE, afferent);
  const window = deps.window !== undefined ? deps.window : currentWindow(dir, afferent);
  // #51: tail read, archive-tolerant. The old `readLines(...).slice(-12)` parsed the
  // whole 285 KB ledger to keep 12 rows, and would read a rolled month as empty.
  const presence = deps.presence || presenceTail(12, { file: join(dir, "presence_log.jsonl") });
  const drills = deps.drills !== undefined ? deps.drills : readJson(join(dir, "drills.json"));
  const workspace = deps.workspace !== undefined ? deps.workspace : readJson(join(dir, "workspace.json"));
  const floor = deterministicSet(stream, presence, drills);
  let llm = null, engine = "deterministic";
  if (stream.length && deps.gen !== null) {
    try {
      const r = await (deps.gen || defaultGen)(buildPrompt(stream, workspace, window));
      const text = typeof r === "string" ? r : (r && r.text);
      if (text) { llm = parseSet(text); if (llm) engine = "gemini-flash"; }
    } catch { /* pool dry → floor stands */ }
  }
  const slots = merge(llm, floor);
  const own = hisWords(stream);
  return {
    ...slots, engine,
    sources: stream.length, last_surface: stream.length ? stream[stream.length - 1].modality : null,
    // #106 / #4 — have/need counters instead of a status word. `his_words` vs
    // `sources` is exactly the ratio the audit measured at 4 of 25; if it ever
    // collapses again it is visible in the file he reads, not buried in a prompt.
    have_need: {
      his_words: own.length, sources_scanned: stream.length,
      slots_filled: ["concept_in_motion", "open_loop", "where_left_off", "next_step"].filter(k => slots[k]).length, slots_total: 4,
      captions_rejected: stream.length - own.length,
    },
    current_window: window ? window.text : null,     // the ambient stream's ADDRESS (rule 3)
  };
}

async function defaultGen(prompt) {
  const { generatePool } = await import("./hippocampus.mjs");
  // NOT json-mode: it returned empty on the flash model live; the prompt asks for
  // JSON and parseSet extracts the {…} block from whatever comes back (robust).
  const r = await generatePool(prompt, { models: ["gemini-flash-latest"], maxOutputTokens: 2048, temperature: 0.2 });
  // T8 billing — the header's "registered as fuelboard tank T8" was a claim with
  // no caller until 7 Aug 2026: nothing anywhere recordUse()'d T8, so this organ's
  // daily flash spend was invisible to the gauge (the exact "fuelboard read
  // fiction" scar nightshift documents). One unit per pool call; naive-shadow 0
  // because under-reporting a saving beats inventing a token count. Billing lives
  // HERE (the live default), not in distill() — selftests inject deps.gen and
  // must never touch the real board.
  try {
    const { recordUse, record429 } = await import("./fuelboard.mjs");
    if (r && r.ok) recordUse("T8", 1, 0);
    else if (r && r.status === 429) record429("T8");
  } catch { /* the gauge must never block the working set */ }
  return r;
}

function summaryLine(set) {
  const bits = [];
  if (set.concept_in_motion) bits.push(`on: ${set.concept_in_motion}`);
  if (set.open_loop) bits.push(`open: ${set.open_loop}`);
  if (set.next_step) bits.push(`next: ${set.next_step}`);
  return bits.join(" · ") || "(quiet)";
}

async function run(now = new Date()) {
  const set = await distill({});
  const out = { ts: now.toISOString(), ...set, summary: summaryLine(set) };
  writeAtomic(WORKING_SET, out);
  const h = set.have_need || {};
  console.log(`distiller: working_set updated (${set.engine}, ${set.sources} sources) — ${out.summary}`);
  // #106: the counters, out loud. "4/4 slots" is a measurement; "ok" would not be.
  console.log(`  ${h.slots_filled}/${h.slots_total} slot(s) filled · ${h.his_words}/${h.sources_scanned} row(s) are HIS words` +
    (h.captions_rejected ? ` (${h.captions_rejected} window caption(s) rejected)` : "") +
    ` · slots from ${Object.entries(set.slot_sources || {}).map(([k, v]) => k.split("_")[0] + ":" + v).join(", ")}` +
    (set.current_window ? ` · he is in: ${set.current_window}` : ""));
  return out;
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const stream = [
    { ts: "2026-07-18T10:00:00Z", modality: "code", text: "explain embeddings vs tokenization" },
    { ts: "2026-07-18T10:05:00Z", modality: "voice", text: "cosine similarity samajh nahi aaya, kyun use karte hain?" },
  ];
  // E2E audit (25 Jul 2026): this fixture used to be `{ concept: "attention mechanism" }`
  // — a key setpiece.mjs has NEVER written. The fake fixture is exactly why the dead
  // next_step slot survived every green selftest. This is now a real setpiece row.
  const drills = { drills: [{ kind: "recall", probe_type_emoji: "🔵", concepts: ["attention mechanism"], prompt: "one cold guess on attention mechanism", source: "due" }] };

  // deterministic floor — honest, never empty when data exists
  const floor = deterministicSet(stream, [], drills);
  assert("FLOOR — where_left_off = the last concrete thing", floor.where_left_off.includes("cosine similarity"));
  assert("FLOOR — open_loop catches the hanging doubt", DOUBT_RE.test(floor.open_loop) && floor.open_loop.includes("cosine"));
  assert("FLOOR — next_step comes from drills, never invented", floor.next_step === "attention mechanism");
  assert("FLOOR — empty stream yields empty slots, never a crash", deterministicSet([], [], null).where_left_off === "");
  // REGRESSION (E2E audit 25 Jul 2026): reads setpiece's real concepts[] array, not
  // the phantom .concept/.title keys. Fails on the old code — it returned "".
  assert("FLOOR — next_step reads setpiece's real concepts[] schema (not .concept/.title)",
    deterministicSet(stream, [], { drills: [{ kind: "derby", concepts: ["chunking", "retrieval"], prompt: "contrast them" }] }).next_step === "chunking");
  // REGRESSION: floor_touch rows carry concepts: [] — fall back to the drill's own
  // prompt rather than leaving the slot dead. Old code returned "" here too.
  assert("FLOOR — a concepts:[] row (floor_touch) falls back to the drill prompt",
    deterministicSet(stream, [], { drills: [{ kind: "floor_touch", concepts: [], prompt: "One 10-minute touch: open the field, one green concept" }] }).next_step.startsWith("One 10-minute touch"));
  // REGRESSION: a non-string concept (defensive) must not leak "[object Object]".
  assert("FLOOR — non-string concepts are skipped, never stringified into the slot",
    deterministicSet(stream, [], { drills: [{ concepts: [{ id: "x" }], prompt: "the real instruction" }] }).next_step === "the real instruction");

  // parse + merge
  const good = parseSet('{"concept_in_motion":"embeddings","open_loop":"why cosine","where_left_off":"asked about cosine","next_step":""}');
  assert("PARSE — clean JSON parses to the 4 slots", good && good.concept_in_motion === "embeddings");
  assert("PARSE — junk text returns null (floor takes over)", parseSet("sorry I can't do that") === null);
  const merged = merge(good, floor);
  assert("MERGE — LLM wins where present, floor fills the gap (next_step)", merged.concept_in_motion === "embeddings" && merged.next_step === "attention mechanism");
  // REGRESSION (E2E audit 25 Jul 2026): the header LAW — next_step is drills-only.
  // Old merge handed the LLM's invented step straight to the captain; fails on it.
  assert("MERGE — an LLM-invented next_step never beats drills.json (header law)",
    merge({ concept_in_motion: "embeddings", next_step: "go read chapter 7" }, floor).next_step === "attention mechanism");
  assert("MERGE — with no drills staged, an invented next_step is DROPPED, not shown",
    merge({ next_step: "go read chapter 7" }, { concept_in_motion: "", open_loop: "", where_left_off: "", next_step: "" }).next_step === "");
  // the frozen legacy path, kept so the delta is visible: it is what leaked.
  assert("MERGE — mergeLegacy still shows the old leak (why it was superseded)",
    mergeLegacy({ next_step: "go read chapter 7" }, floor).next_step === "go read chapter 7");

  // ------------------------------------------------------------------------
  // #21 REGRESSIONS (audit 2 Aug 2026, findings 14 & 15) — HIS WORDS, NOT CAPTIONS.
  // Live value in working_set.json when this was found: concept_in_motion and
  // where_left_off both read "claude.exe · Claude".
  // ------------------------------------------------------------------------
  const captionAfferent = [
    { ts: "2026-08-02T10:00:00Z", modality: "code", text: "chalo hallucinations wale grounding step pe wapas aate hain" },
    { ts: "2026-08-02T10:02:00Z", modality: "context", app: "WindowsTerminal.exe", title: "Terminal", text: "WindowsTerminal.exe · Terminal" },
    { ts: "2026-08-02T10:04:00Z", modality: "context", app: "claude.exe", title: "Claude", text: "claude.exe · Claude" },
  ];
  assert("#21 CUT 1 — `context` is out of the his-words window (and the legacy list is frozen beside it)",
    !INTERACTIVE.includes("context") && INTERACTIVE_LEGACY.includes("context") && AMBIENT.includes("context"));
  const cleanStream = recentStream("no-dir", 25, INTERACTIVE, captionAfferent);
  assert("#21 CUT 1 — the stream now holds only HIS surfaces; the window churn is gone",
    cleanStream.length === 1 && cleanStream[0].modality === "code");
  assert("#21 CUT 1 — the ambient stream is NOT deleted, it gets an address: the current-window line",
    currentWindow("no-dir", captionAfferent).text === "claude.exe · Claude" &&
    buildPrompt(cleanStream, null, currentWindow("no-dir", captionAfferent)).includes("HE IS CURRENTLY IN"));
  const captionFloor = deterministicSet(recentStream("no-dir", 25, INTERACTIVE_LEGACY, captionAfferent), [], null);
  assert("#21 CUT 2 — even on the LEGACY window the floor refuses a caption: it takes his last real utterance",
    captionFloor.where_left_off.includes("grounding") && captionFloor.concept_in_motion.includes("hallucinations") &&
    !/\.exe/.test(captionFloor.where_left_off) && !/\.exe/.test(captionFloor.concept_in_motion));
  assert("#21 CUT 2 — nothing but captions → EMPTY slots, never a caption dressed as an answer",
    deterministicSet([{ ts: "t", modality: "code", text: "explorer.exe · " }], [], null).where_left_off === "");
  assert("#21 CUT 3 — a healthy LLM run that leaves a slot blank can no longer splice a caption in",
    merge({ concept_in_motion: "grounding", open_loop: "", where_left_off: "" },
          { concept_in_motion: "", open_loop: "", where_left_off: "claude.exe · Claude", next_step: "" }).where_left_off === "" &&
    mergeV2Legacy({ concept_in_motion: "grounding", where_left_off: "" },
          { where_left_off: "claude.exe · Claude", next_step: "" }).where_left_off === "claude.exe · Claude");
  assert("#21 CUT 3 — an LLM that echoes the window line back is rejected too (both sides are guarded)",
    merge({ where_left_off: "chrome.exe · Google Search" }, { where_left_off: "asked about cosine", next_step: "" }).where_left_off === "asked about cosine");
  assert("#21 CUT 3 — every slot says where it came from (#4: an empty slot is legible, not ambiguous)",
    merge(good, floor).slot_sources.concept_in_motion === "llm" && merge(null, floor).slot_sources.where_left_off === "floor" &&
    merge(null, { next_step: "" }).slot_sources.open_loop === "empty");
  assert("#21 the caption guard is narrow — his own words are never mistaken for a window title",
    looksLikeWindowCaption("claude.exe · Claude") && looksLikeWindowCaption("explorer.exe ·") &&
    !looksLikeWindowCaption("run drill.py and check the output") && !looksLikeWindowCaption("kya main .exe file bana sakta hoon?"));
  const wsSet = await distill({ dir: "no-dir", afferent: captionAfferent, presence: [], drills, workspace: null, gen: null });
  assert("#21 the re-entry card counts what it stood on (#106): his-words vs rows scanned, slots filled",
    wsSet.have_need.his_words === 1 && wsSet.have_need.sources_scanned === 1 && wsSet.have_need.slots_total === 4 &&
    wsSet.current_window === "claude.exe · Claude" && !/\.exe/.test(wsSet.where_left_off));

  // --- CUT 3 / audit #108: THE SELF-CAPTURE LEAK ON `source` -----------------
  // The Stop hook writes MY last message as source:"claude-code-teaching" with the
  // SAME modality:"code" his own prompts carry, so a modality-only screen counted my
  // prose as his. The pair below is the whole point: identical modality, opposite
  // provenance. `claude-code` must survive — it is his 538 typed prompts.
  const selfStream = [
    { ts: "2026-08-06T01:00:00Z", modality: "code", source: "claude-code", text: "embeddings mein cosine kyun?" },
    { ts: "2026-08-06T01:01:00Z", modality: "code", source: "claude-code-teaching", text: "Both pushed. Working tree clean. ## Done — everything is on main" },
  ];
  assert("#108 my own teaching output is NOT his words — same modality, denied on source",
    hisWords(selfStream).length === 1 && hisWords(selfStream)[0].source === "claude-code");
  assert("#108 his typed prompts still pass — the deny-list is exact, not a claude-code* prefix",
    hisWords([selfStream[0]]).length === 1);
  assert("#108 a legacy row with NO source field still passes (voice afferents carry none)",
    hisWords([{ ts: "2026-08-06T01:02:00Z", modality: "voice", text: "gaffer suno" }]).length === 1);
  const leaked = await distill({ dir: "no-dir", stream: selfStream, presence: [], drills: null, workspace: null, gen: null });
  assert("#108 the have/need counter stops reporting 100%-his when half the rows are mine",
    leaked.have_need.his_words === 1 && leaked.have_need.sources_scanned === 2);
  assert("#108 where_left_off can never be my own sign-off line",
    !/Working tree clean|everything is on main/.test(String(leaked.where_left_off || "")));
  // THE ASSERTION THAT WOULD HAVE CAUGHT THE DEAD FIX (verify pass, 6 Aug 2026).
  // Every assertion above injects `deps.stream` by hand — a shape no production
  // caller ever builds. main() goes through recentStream(), which projected rows to
  // {ts, modality, text} and DROPPED source, so the deny-list above was inert in
  // production while the suite stayed green. This one runs the REAL path: raw
  // afferent rows in, recentStream's own projection, deny-list out.
  {
    const rawAfferent = [
      { ts: "2026-08-06T02:00:00Z", modality: "code", source: "claude-code", text: "tokenization ke baad embeddings kyun aate hain, wahi samajh nahi aaya" },
      { ts: "2026-08-06T02:01:00Z", modality: "code", source: "claude-code-teaching", text: "Both pushed. Working tree clean. ## Done — everything is on main" },
    ];
    const viaReal = recentStream("no-dir", 25, INTERACTIVE, rawAfferent);
    assert("#108 recentStream CARRIES source through its projection (the field the filter needs)",
      viaReal.length === 2 && viaReal.every(r => typeof r.source === "string"));
    assert("#108 …so the deny-list actually bites on the PRODUCTION path, not just injected fixtures",
      hisWords(viaReal).length === 1 && hisWords(viaReal)[0].source === "claude-code");
  }

  // distill — mocked LLM, no network
  const set = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => '{"concept_in_motion":"embeddings","open_loop":"why cosine similarity","where_left_off":"","next_step":""}' });
  assert("DISTILL — LLM path fills slots + floor covers where_left_off", set.engine === "gemini-flash" && set.concept_in_motion === "embeddings" && set.where_left_off.includes("cosine"));
  const setDry = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => { throw new Error("pool dry"); } });
  assert("DISTILL — pool dry → deterministic floor stands, never breaks", setDry.engine === "deterministic" && setDry.where_left_off.includes("cosine"));
  const setEmpty = await distill({ dir: "no-dir", stream: [], presence: [], drills: null, workspace: null, gen: null });
  assert("DISTILL — no activity → empty but valid set", setEmpty.sources === 0 && typeof setEmpty.concept_in_motion === "string");

  assert("SUMMARY — reads as one glanceable line", summaryLine(set).includes("on:") && summaryLine(set).includes("open:"));

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  await run();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { distill, deterministicSet, parseSet, merge, mergeLegacy, mergeV2Legacy, recentStream, currentWindow,
         hisWords, looksLikeWindowCaption, buildPrompt, summaryLine, run, INTERACTIVE, INTERACTIVE_LEGACY, AMBIENT };
