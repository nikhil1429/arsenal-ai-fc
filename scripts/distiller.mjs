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
// LAWS: SINGLE WRITER of working_set.json AND distiller_latency.jsonl (the G16
//   switch-to-read counter, 10 Aug 2026). Reads afferent.jsonl + workspace.json
//   + presence_log.jsonl + drills.json READ-ONLY (single-writer law intact).
//   Never invents a next_step — it comes from drills.json or stays empty.
// MODES: run (default) · latency (the G16 counter's read-only report) · selftest
// ============================================================================
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// #WIRE (11 Aug 2026) — read-only, selftest-only: the voice-has-an-address check
// below asks the live Task Scheduler what THIS organ's action actually is.
import { spawnSync } from "node:child_process";
// #51 — the shared, archive-tolerant tail reader owned by presence.mjs (the ledger's
// sole writer). presence_log.jsonl now rolls monthly, so a reader that only ever
// opened `presence_log.jsonl` would silently read a rolled month as an empty history.
import { presenceTail } from "./presence.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WORKING_SET = join(STATE_DIR, "working_set.json");
const LATENCY_LOG = join(STATE_DIR, "distiller_latency.jsonl");   // G16 — this file's second owned lane (gitignored)

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
// #WIRE (dead-wire sweep, 11 Aug 2026) — TWO NAMES IN THIS LIST HAD NO PRODUCER,
// and they were two DIFFERENT problems, so they got two different answers:
//   · "throwin" was genuinely dead. throwin.mjs appended loose_balls.jsonl and
//     posted nothing, so 0 of 5,252 live afferent rows carried the modality while
//     this window waited for it — and a throw-in is the purest open_loop material
//     the organism has. FIXED AT THE PRODUCER, not here: throwin.mjs now relays
//     every ball through the thalamus door (see its #WIRE block).
//   · "note" is a vestigial ALIAS, not a gap. The MCP note tool is live and his
//     notes DO arrive — mcp-memory.mjs:182 posts them as "desktop-study", which is
//     already in this list. It stays anyway: keeping it costs one string compare
//     and it catches a future producer that uses the obvious name; deleting it
//     would be a replace with no defect behind it (LAYERING).
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
// #WIRE (11 Aug 2026) — NORMALISE and CUT are two different jobs and they had been
// welded into one. `normStr` collapses whitespace and stops there; `clampStr` is
// normStr + a cut, and every caller of it below is a caller that owns a real budget
// (a 4-slot card the captain reads, a 120-char window line). The evidence rows are
// NOT such a caller — see recentStream.
const normStr = (s) => String(s || "").replace(/\s+/g, " ").trim();
// ---------------------------------------------------------------------------
// THE CUT THAT SAID NOTHING (wiring pass, 11 Aug 2026) — TRUNCATED_AT_DOOR.
// ---------------------------------------------------------------------------
// The line above fixed WHERE the evidence is cut. This one fixes what the cut
// SAYS. Every slot below is capped — concept_in_motion 80 · open_loop 160 ·
// where_left_off 200 · next_step 120 · the window line 120 · the LLM's own
// parseSet 200 — and every one of those caps was a bare .slice(): his sentence
// stopped mid-word and not one character anywhere downstream said more had
// existed. Measured on the live afferent log the hour this was found: 449 of his
// 677 doubt rows are longer than open_loop's 160 (66%), 510 of 1,147 interactive
// rows exceed where_left_off's 200 (44%), 796 exceed concept_in_motion's 80
// (69%). Not an edge case — the normal path, and MORE normal since the evidence
// rows stopped being pre-cut at 400 directly above.
// WHY IT MATTERS AT THIS DOOR: working_set.json is his RE-ENTRY CARD, and
// mcp-memory.mjs:234 prints open_loop RAW into get_context. So every session read
// his open question stopping mid-sentence, with nothing saying it had been cut,
// and answered the half it could see. Same shape as the 220-char capsule cut
// found the day before: a thing that EXISTS is not a thing that ARRIVES.
// THE FIX IS THE MARKER, NOT A BIGGER CAP. No number is invented (his standing
// law): every cap stays the exact integer it already was, and the marker is spent
// from INSIDE it — n-1 chars + "…" — so nothing downstream that budgeted on these
// caps moves by a byte. A reader that sees "…" knows to open the source; a reader
// that saw a bare cut could not know a source existed.
const TRUNC_MARK = "…";                                  // ONE char, spent inside the cap — the cap itself is unchanged
// FROZEN verbatim (LAYERING law; siblings mergeLegacy / mergeV2Legacy /
// recentStreamLegacy). The bare cut, kept so the delta stays visible and the
// selftest can show what it used to hand him. Reference only; clampStr is record.
const clampStrLegacy = (s, n) => normStr(s).slice(0, n);
function clampStr(s, n) {
  const t = normStr(s);
  if (t.length <= n) return t;
  return n <= 1 ? t.slice(0, n) : t.slice(0, n - 1) + TRUNC_MARK;   // n<=1 has no room for a marker; a silly cap must never crash the card
}
// A slot ending in the marker was CUT. KNOWN FALSE POSITIVE, stated where the
// counter is read: if HE himself ends a line in "…", that slot counts as cut.
// That direction OVERSTATES how much the machine admits losing and can never
// understate it — the same safe-direction rule the G16 biases below follow.
const wasTruncated = (s) => String(s || "").endsWith(TRUNC_MARK);

// FROZEN — the pre-11-Aug-2026 projection, verbatim (LAYERING law; siblings
// mergeLegacy / mergeV2Legacy / INTERACTIVE_LEGACY above). It cut every evidence row
// at 400 chars, which is the defect `recentStream` now fixes. Reference only.
// It calls clampStrLegacy, not clampStr: a frozen function that silently inherits
// a later engine change is no longer frozen, and the delta it exists to show would
// quietly shrink by one marker char every time the helper moves under it.
function recentStreamLegacy(dir = STATE_DIR, n = 25, modalities = INTERACTIVE, rows = null) {
  return (rows || readLines(join(dir, "afferent.jsonl")))
    .filter(a => modalities.includes(a.modality) && String(a.text || "").trim().length > 2)
    .slice(-n)
    .map(a => ({ ts: a.ts, modality: a.modality, source: a.source, text: clampStrLegacy(a.text, 400) }));
}

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
    //
    // #WIRE — TRUNCATED AT THE DOOR (wiring pass, 11 Aug 2026). The same projection
    // also did `clampStr(a.text, 400)`, silently, with no marker and no field naming
    // the cut. Measured on the live 25-row window the hour this was found: 15 of 25
    // rows exceed 400 chars (longest 3,635), 22,397 of 29,653 characters dropped —
    // 75.5%. That cut ran BEFORE every consumer in this file: DOUBT_RE could not see
    // a doubt stated past char 400, hisWords()/the caption guard judged a quarter of
    // a row, and the floor built his re-entry card from it.
    // THE CUT WAS IN THE WRONG PLACE, not the wrong size. Nothing about the EVIDENCE
    // needs bounding — the slots it feeds already carry their own budgets right here
    // in this file (concept_in_motion 80 · open_loop 160 · where_left_off 200 · the
    // window line 120), and those are the numbers the captain actually reads. The one
    // consumer with a genuine size constraint is the LLM prompt, because the afferent
    // door caps nothing (live afferent.jsonl holds a 105,011-char row), so the bound
    // moved there — buildPrompt, marked and counted. Detection now reads all of it.
    .map(a => ({ ts: a.ts, modality: a.modality, source: a.source, text: normStr(a.text) }));
}
// THE ADDRESS FOR THE AMBIENT STREAM (rule 3: never delete an organ because nobody
// reads its output — give it a surface). context.mjs's ~145 emits/day are no longer
// allowed to consume 21 of his 25 evidence rows; they arrive as ONE line of
// corroboration: where the machine currently is, plainly labelled as such.
// FROZEN verbatim (LAYERING law; siblings mergeLegacy / mergeV2Legacy /
// recentStreamLegacy / clampStrLegacy). The pre-11-Aug-2026 projection: it read
// `title`/`text` straight off the row and never asked whether the row it was
// reading was ALREADY a stub. Reference only; currentWindow is record.
function currentWindowLegacy(dir = STATE_DIR, rows = null) {
  const amb = (rows || readLines(join(dir, "afferent.jsonl"))).filter(a => AMBIENT.includes(a.modality));
  const last = amb[amb.length - 1];
  if (!last) return null;
  return { ts: last.ts, app: last.app || "", title: last.title || "", text: clampStr(last.text || `${last.app || ""} · ${last.title || ""}`, 120) };
}
// ---------------------------------------------------------------------------
// #WIRE (dead-wire sweep, 11 Aug 2026) — THE DOOR'S CUT FINALLY HAS A READER
// ---------------------------------------------------------------------------
// context.mjs:186 has shipped `title_truncated` / `text_truncated` / the raw
// pre-cut lengths since D8 (10 Aug 2026), for the stated reason that "the cut
// travels WITH the row", and the bus keeps them: thalamus.mjs's sanitizeAfferent
// has no whitelist (it strips affect and adds tokens, nothing else) and appends
// the event whole. VERIFIED this run — `grep -rn 'title_truncated|text_len'
// scripts/*.mjs` returns context.mjs and NOTHING else. Its own status() counter
// was the only reader in the organism; a flag no consumer reads is the same black
// box as a file nobody opens.
// WHERE IT BIT, and why the repair belongs in THIS function: this is the one
// engine for "where he is" — buildPrompt below pastes `window.title` RAW into the
// HE IS CURRENTLY IN line, and cortex.mjs imports this same function for the deep
// brain's WHERE HE WAS block. A title sheared at the door's 200 arrived at both
// reading as the whole title, with no character anywhere saying a word was gone.
// (Live afferent.jsonl today holds 35 context rows and NONE carries the flag —
// the resident daemon is running a build older than context.mjs on disk, which
// its own status() line already reports. So this is the wire that must be live
// BEFORE the next restart, not after: the flags begin arriving the moment the
// daemon is bounced, and today nothing downstream would notice.)
// NO NEW NUMBER, NO NEW CAP: the 120 here is untouched and the door's 200/240 are
// untouched. The marker is this file's own TRUNC_MARK, spent from INSIDE the
// string exactly as clampStr spends it, so nothing that budgeted on these lengths
// moves by a byte.
// THREE STATES, never two — the same law context.mjs:181 keeps at the emit and in
// its status(): true = measured cut, false = measured clean, null = the row
// predates D8 and the honest answer is UNKNOWN. A pre-flag row is never folded
// into "clean" (#4, honest by construction).
const markCut = (s, cut) => (cut && s && !wasTruncated(s) ? (s.length > 1 ? s.slice(0, -1) + TRUNC_MARK : TRUNC_MARK) : s);
function currentWindow(dir = STATE_DIR, rows = null) {
  const amb = (rows || readLines(join(dir, "afferent.jsonl"))).filter(a => AMBIENT.includes(a.modality));
  const last = amb[amb.length - 1];
  if (!last) return null;
  const tCut = last.title_truncated, xCut = last.text_truncated;
  // door_cut is the ROW's verdict, not this function's: either side cut = cut.
  const door_cut = (tCut === undefined && xCut === undefined) ? null : (tCut === true || xCut === true);
  return {
    ts: last.ts, app: last.app || "",
    title: markCut(last.title || "", tCut === true),
    // clampStr already marks its OWN 120-char cut; markCut only fires in the case
    // clampStr cannot see — a row short enough to pass 120 that the door had
    // already sheared. wasTruncated() keeps the two from double-marking.
    text: markCut(clampStr(last.text || `${last.app || ""} · ${last.title || ""}`, 120), door_cut === true),
    // the fact itself, machine-legible beside the marker, for a reader that wants
    // more than a "…" (cortex.mjs's WHERE HE WAS block prints it by name).
    door_cut, title_len: Number.isFinite(last.title_len) ? last.title_len : null,
  };
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

// #WIRE (dead-wire sweep, 11 Aug 2026) — WHY a row was not counted, not just HOW MANY.
// `captions_rejected` was computed as `stream.length - own.length` and printed as
// "N window caption(s) rejected". Measured on the live 25-row window the hour this was
// found (last 25 INTERACTIVE rows of afferent.jsonl): 0 captions, 13 rows of MY OWN
// teaching — sources were {claude-code: 12, claude-code-teaching: 13}. So the file and
// the console both named the wrong disease. The two are not interchangeable:
//   · captions climbing = context.mjs leaking back into his surfaces (the #21 scar)
//   · self rows climbing = the #108 self-capture leak returning — the organism reading
//     its own output back as his words, which is how the brief once printed MY audit
//     task as his LAST SESSION.
// The old aggregate is NOT lost, it is derived: captions_rejected + self_rows_excluded
// === sources_scanned − his_words (asserted in the selftest). Classification is
// exclusive and caption-first, matching hisWords()' own order of guards. A falsy row —
// which recentStream cannot produce — lands in neither bucket, the safe direction for a
// counter (undercount, never fabricate), same rule the G16 biases are stated under.
function notHisBreakdown(stream) {
  let captions = 0, self = 0;
  for (const s of (stream || [])) {
    if (!s) continue;
    if (AMBIENT.includes(s.modality) || looksLikeWindowCaption(s.text)) captions++;
    else if (!isHisSource(s)) self++;
  }
  return { captions_rejected: captions, self_rows_excluded: self };
}

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

// THE PROMPT BUDGET — the only place in this file a bound on his words belongs
// (#WIRE, 11 Aug 2026). NOT A NEW NUMBER: it is the SAME 400 that recentStream used
// to apply to every consumer, relocated to the single consumer that has a real
// constraint. It stays because the afferent door caps nothing — a 105,011-char row
// exists in the live log today, and 25 of those would be a 2.6 MB prompt.
// Two things it now does that the silent slice did not:
//   · the cut is MARKED, so the model is told the row continues instead of reading a
//     sentence that stops mid-clause as a finished thought;
//   · it is COUNTED (evidenceChars → working_set.have_need), so how much of his own
//     words reach the model is a measured number in the file he reads, not a guess.
// Whether 400 is the RIGHT bound stays open — his standing law: counters first, the
// number is ruled on when there is real data (same pattern as the G16 counter below).
const PROMPT_ROW_CHARS = 400;
function promptRow(s) {
  const t = String(s.text || "");
  const head = t.slice(0, PROMPT_ROW_CHARS);
  const cut = t.length - head.length;
  return `[${String(s.ts).slice(11, 16)} ${s.modality}] ${head}${cut ? ` … [+${cut} chars cut]` : ""}`;
}
// have/need for the evidence itself: chars he wrote vs chars the model was shown.
function evidenceChars(stream) {
  let total = 0, shown = 0;
  for (const s of (stream || [])) { const n = String(s.text || "").length; total += n; shown += Math.min(n, PROMPT_ROW_CHARS); }
  return { evidence_chars: total, evidence_chars_to_llm: shown };
}

function buildPrompt(stream, workspace, window = null) {
  const lines = stream.map(promptRow).join("\n");
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

// ---------------------------------------------------------------------------
// #WIRE (dead-wire sweep, 11 Aug 2026) — A CODE BUG AND A DRY POOL WERE THE SAME EVENT.
// ---------------------------------------------------------------------------
// distill()'s LLM leg ended in `catch { /* pool dry → floor stands */ }` — the error
// was never even BOUND. So a genuinely dry free pool, a 429'd lane, junk text, and a
// TypeError from a renamed import all left exactly ONE trace: engine === "deterministic".
// That word is also what a perfectly healthy quiet stream writes, so no reader could
// tell a working organ from a dead one. The floor standing is CORRECT and is unchanged
// here; the silence about WHY was the defect.
// THE SHARPEST PART, which the console line hid: hippocampus.generatePool does NOT
// throw on failure — it returns { ok:false, text:null, error:"every key dry on every
// model", status:<last HTTP status> } (hippocampus.mjs:196). So a 429'd lane never
// reached the catch at all; it fell through `if (text)` and looked identical to a quiet
// day, carrying its own diagnosis in a field this file discarded. A producer whose error
// string reaches a consumer that throws it away is the same dead wire as a producer with
// no consumer — the shape this sweep exists to find.
// NAMES ONLY, NO VERDICT — the house rule the counters beside it already follow (his
// standing law: numbers are ruled on after 30-45-60 days of real data). `llm_status`
// records WHICH of the five real code paths ran and stays NULL on the healthy path, so
// the card is silent when there is nothing to say. No threshold, no gate, no card dealt
// to him: the floor still stands byte-for-byte as before and nothing acts on his behalf.
// NO ENGINE IS REPLACED, so nothing is frozen *Legacy here (context.mjs:92 precedent):
// `engine` keeps its exact two values and its exact meaning; a field is ADDED beside it.
// ITS READER: learnstate.mjs wsEvidenceLine — the same SessionStart line that already
// prints `engine`, which is where "deterministic" was reading healthy every session.
const STATUS_CHARS = 160;   // NOT a new number: open_loop's existing cap (deterministicSet), borrowed — this string rides the same brief line those slots ride
// The pool's own words, not ours. Falls back only when the generator returned something
// shapeless (a bare string, null) — then all that is honestly known is "no text".
function poolStatus(r) {
  if (r && typeof r === "object") {
    const bits = [];
    if (r.error) bits.push(String(r.error));
    if (r.status !== undefined && r.status !== null) bits.push(`status ${r.status}`);
    if (bits.length) return `pool-failed: ${bits.join(" · ")}`;
  }
  return "pool-failed: no text returned";
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
  let llm = null, engine = "deterministic", llmStatus = null;
  // #WIRE — the five paths, each named. Same control flow as before (empty stream or
  // gen:null → no call; anything else → try), so the floor stands exactly where it did.
  if (!stream.length) llmStatus = "not-called: no interactive activity in the window";
  else if (deps.gen === null) llmStatus = "not-called: generator disabled by the caller";
  else {
    try {
      const r = await (deps.gen || defaultGen)(buildPrompt(stream, workspace, window));
      const text = typeof r === "string" ? r : (r && r.text);
      if (!text) llmStatus = poolStatus(r);                       // the NON-throwing failure — a 429 never reached the old catch
      else if (!(llm = parseSet(text))) llmStatus = `unparsed: ${String(text).length} char(s) back, no slot matched`;
      else engine = "gemini-flash";
    } catch (e) {
      // BOUND, not swallowed — this is the whole repair. `${e.name}: ${e.message}` on a
      // renamed export reads "TypeError: generatePool is not a function": the exact
      // shape that used to vanish into a comment and leave the card reading healthy.
      llmStatus = `threw: ${e && e.message ? `${e.name || "Error"}: ${e.message}` : String(e)}`;
    }
  }
  const slots = merge(llm, floor);
  const own = hisWords(stream);
  return {
    ...slots, engine,
    // #WIRE (11 Aug 2026) — WHY the floor is standing, or null when it is not standing
    // at all. Clamped with the marked cut every other string in this card uses, so a
    // long provider error is bounded and SAYS it was bounded.
    llm_status: llmStatus ? clampStr(llmStatus, STATUS_CHARS) : null,
    sources: stream.length, last_surface: stream.length ? stream[stream.length - 1].modality : null,
    // #106 / #4 — have/need counters instead of a status word. `his_words` vs
    // `sources` is exactly the ratio the audit measured at 4 of 25; if it ever
    // collapses again it is visible in the file he reads, not buried in a prompt.
    have_need: {
      his_words: own.length, sources_scanned: stream.length,
      slots_filled: ["concept_in_motion", "open_loop", "where_left_off", "next_step"].filter(k => slots[k]).length, slots_total: 4,
      // #WIRE (11 Aug 2026): the same total, split by CAUSE — see notHisBreakdown above.
      // Both keys are read by learnstate.mjs's brief (wsEvidenceLine), which is the
      // consumer these counters lacked for the five weeks they had been written.
      ...notHisBreakdown(stream),
      // #WIRE (11 Aug 2026) — how many of the 4 slots the cap actually bit. The
      // marker already tells HIM ("…" travels raw into get_context via
      // mcp-memory.mjs:234); this is the same fact made machine-legible, in the
      // counter block that already made the self-capture leak visible. Counter
      // only — no threshold, no verdict. If it sits at 4/4 for weeks, that is the
      // data on which he rules whether these caps are still the right numbers.
      slots_truncated: ["concept_in_motion", "open_loop", "where_left_off", "next_step"].filter(k => wasTruncated(slots[k])).length,
      // #WIRE (11 Aug 2026) — the truncation is no longer silent. Detection reads
      // 100% of his words; these two say how much of them the LLM was shown. If the
      // gap ever gets wide enough to matter, it is visible HERE, in the card, the
      // same way his_words/sources_scanned made the self-capture leak visible.
      ...evidenceChars(stream),
    },
    current_window: window ? window.text : null,     // the ambient stream's ADDRESS (rule 3)
  };
}

async function defaultGen(prompt) {
  const { generatePool } = await import("./hippocampus.mjs");
  // NOT json-mode: it returned empty on the flash model live; the prompt asks for
  // JSON and parseSet extracts the {…} block from whatever comes back (robust).
  const r = await generatePool(prompt, { role: "text", maxOutputTokens: 2048, temperature: 0.2 });   // LAW M (18 Aug 2026): a ROLE, never a model name
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

// ---------------------------------------------------------------------------
// LADDER G16 sliver — THE SWITCH-TO-READ LATENCY COUNTER (10 Aug 2026)
// ---------------------------------------------------------------------------
// The 15-min cadence is a GUESSED number — limits.mjs CADENCES records it as
// origin:"guessed" — and the cadence's whole justification is switch-to-read
// latency: he switches surfaces, and working_set should already hold the
// post-switch picture by the time he next reads it. Nothing ever MEASURED that
// gap, so the next cadence decision would have been another hunch. This window
// measures it — COUNTER ONLY: no threshold, no gate, no verdict (his 1 Aug law:
// numbers come from 30-45-60 days of real data, never from a vibe).
// What one run records:
//   · a context-switch = the ambient stream's `app` CHANGING between
//     consecutive `context` rows (title churn inside one app is not a surface
//     switch; the first-ever row has no prior, so it is an appearance, not a
//     switch)
//   · attribution: a switch belongs to the FIRST working_set write at/after it
//     — prev_write_ts < switch_ts <= this_write_ts — so every switch is
//     counted exactly once, by the write that first caught it. The journal's
//     own last row is the SECOND WITNESS on that claim (refuter pass, same
//     day): the window's left edge is clipped to the last counted ts, so a
//     racing concurrent run (the writeAtomic per-pid scar class above) or a
//     backward clock step can never re-count an already-journaled switch.
//   · lag_ms = this_write_ts − switch_ts, raw, per switch
// KNOWN BIASES, stated where the data will be read (all UNDERCOUNT or
// understate; none fabricate — the safe direction for a counter that will one
// day argue for a faster cadence):
//   · a context row still in flight (sensed before this write's ts, landed on
//     disk after the snapshot read) is missed by this run and excluded by the
//     next one's left edge — edge rows near a run boundary undercount
//   · afferent.jsonl rolls monthly (thalamus.mjs) — rows archived unseen are
//     missed, and the roll-boundary pair reads as an appearance, not a switch
//   · this_write_ts binds at run() START, so lag omits the distill call's own
//     seconds — the true switch-to-READABLE latency is slightly larger
// Journal: distiller_latency.jsonl (gitignored — app names + his activity
// timing, same class as presence_log). THIS FILE is its sole writer, and the
// one appendFileSync sits inside run() — no selftest path can reach it (that
// static fact is the hermeticity proof organism_test.mjs records for it).
// A quiet window measures nothing: rows land only when >= 1 switch was caught.
// The very first run (no previous working_set ts) measures nothing at all —
// an unbounded since-forever window would be a fake lag, not a measurement.
function detectSwitches(rows) {
  const amb = (rows || []).filter(a => a && AMBIENT.includes(a.modality) && a.ts);
  const out = [];
  for (let i = 1; i < amb.length; i++) {
    const from = String(amb[i - 1].app || ""), to = String(amb[i].app || "");
    if (to && to !== from) out.push({ ts: amb[i].ts, app: to, from });
  }
  return out;
}
// the second witness — the window may never start before the journal's own
// last counted edge (exactly-once under racing runs + backward clock steps).
// ISO-8601 strings compare lexicographically = chronologically.
function latencyLeftEdge(prevTs, lastRowTs) {
  const c = [prevTs, lastRowTs].filter(Boolean).map(String);
  return c.length ? c.sort()[c.length - 1] : null;
}
function measureLatency(prevTs, nowTs, switches) {
  if (!prevTs) return null;                              // first run ever: no window, nothing measured
  const p = new Date(prevTs).getTime(), n = new Date(nowTs).getTime();
  if (!Number.isFinite(p) || !Number.isFinite(n)) return null;
  const caught = (switches || [])
    .filter(s => { const t = new Date(s.ts).getTime(); return Number.isFinite(t) && t > p && t <= n; })
    .map(s => ({ ts: s.ts, app: s.app, lag_ms: n - new Date(s.ts).getTime() }));
  if (!caught.length) return { n: 0 };                   // quiet window: measured, empty — no row
  const lags = caught.map(c => c.lag_ms);
  return {
    n: caught.length,
    min_ms: Math.min(...lags),
    max_ms: Math.max(...lags),
    mean_ms: Math.round(lags.reduce((a, b) => a + b, 0) / lags.length),
    switches: caught,
  };
}
// the read side — counts + names, never a verdict. The cadence row in
// limits.mjs stays "15min / guessed" until the captain reads this and rules.
function latencyReport(file = LATENCY_LOG) {
  const rows = readLines(file);
  const all = rows.flatMap(r => (r.switches || []).map(s => s.lag_ms)).filter(Number.isFinite).sort((a, b) => a - b);
  return {
    runs: rows.length, switches: all.length,
    min_ms: all.length ? all[0] : null,
    median_ms: all.length ? all[(all.length - 1) >> 1] : null,   // lower median — a counter, not a statistic dressed up
    mean_ms: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null,
    max_ms: all.length ? all[all.length - 1] : null,
    span: rows.length ? `${String(rows[0].ts).slice(0, 10)} → ${String(rows[rows.length - 1].ts).slice(0, 10)}` : null,
  };
}

async function run(now = new Date()) {
  // G16: the PREVIOUS write's ts is the left edge of this run's latency
  // window — read it before the overwrite below destroys it.
  const prevWS = readJson(WORKING_SET);
  // one parse of afferent.jsonl serves the his-words stream, the ambient
  // current-window line, AND the G16 switch detection.
  const afferent = readLines(join(STATE_DIR, "afferent.jsonl"));
  const set = await distill({ afferent });
  const out = { ts: now.toISOString(), ...set, summary: summaryLine(set) };
  writeAtomic(WORKING_SET, out);
  const h = set.have_need || {};
  console.log(`distiller: working_set updated (${set.engine}, ${set.sources} sources) — ${out.summary}`);
  // #106: the counters, out loud. "4/4 slots" is a measurement; "ok" would not be.
  console.log(`  ${h.slots_filled}/${h.slots_total} slot(s) filled · ${h.his_words}/${h.sources_scanned} row(s) are HIS words` +
    // #WIRE (11 Aug 2026): two clauses, because they mean two different failures.
    // The old single clause called 13 rows of my own teaching "window captions".
    (h.captions_rejected ? ` (${h.captions_rejected} window caption(s) rejected)` : "") +
    (h.self_rows_excluded ? ` (${h.self_rows_excluded} row(s) were MY OWN teaching, not his)` : "") +
    // #WIRE — and say it out loud when a slot hit its cap. The card carries the "…";
    // the run that wrote it says how many. A counter, no verdict, silent when zero.
    (h.slots_truncated ? ` · ${h.slots_truncated} slot(s) cut at the cap (marked "…")` : "") +
    // #WIRE — say it out loud when the prompt saw less than he wrote. A counter, no verdict.
    (h.evidence_chars > h.evidence_chars_to_llm
      ? ` · LLM saw ${h.evidence_chars_to_llm}/${h.evidence_chars} char(s) of his words (detection read all)` : "") +
    ` · slots from ${Object.entries(set.slot_sources || {}).map(([k, v]) => k.split("_")[0] + ":" + v).join(", ")}` +
    (set.current_window ? ` · he is in: ${set.current_window}` : ""));
  // #WIRE — and say WHY the LLM leg produced nothing. Silent on the healthy path (the
  // same silent-when-zero rule as the counters above). The console is not the wire —
  // learnstate's brief is — but a 15-min task that fails on every run should not need
  // a file read to be diagnosed.
  if (set.llm_status) console.log(`  LLM path: ${set.llm_status} (deterministic floor stands)`);
  // G16 — which context-switches did THIS write catch first, and how late?
  // Append-only journal; a row lands only when something was actually measured.
  // The left edge is prev write ⊔ the journal's own last row (second witness —
  // see the block comment above), and the row records the edge ACTUALLY used.
  const lastRow = readLines(LATENCY_LOG).slice(-1)[0];
  const leftEdge = latencyLeftEdge(prevWS && prevWS.ts, lastRow && lastRow.ts);
  const m = measureLatency(leftEdge, out.ts, detectSwitches(afferent));
  if (m && m.n) {
    try { appendFileSync(LATENCY_LOG, JSON.stringify({ ts: out.ts, prev_ts: leftEdge, ...m }) + "\n"); } catch { /* the counter must never block the working set */ }
    console.log(`  G16 latency: caught ${m.n} switch(es) — mean ${Math.round(m.mean_ms / 1000)}s · max ${Math.round(m.max_ms / 1000)}s after the switch`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// #WIRE (11 Aug 2026) — THIS ORGAN'S VOICE HAD NO ADDRESS.
// ---------------------------------------------------------------------------
// Audit #98 (2 Aug) ended the "spoke into a cmd window that closed" defect for
// ~35 organs by routing every scheduled task through setup\run_logged.cmd, and
// finding #108 (6 Aug) brought INSTALL_CYBORG_TASKS.ps1's Mk() along. But that
// installer's own comment says the quiet part out loud: "Already-registered
// tasks keep their old bare command until this file is RE-RUN". ArsenalFC-
// Distiller was registered 2026-08-06T03:44 and never re-registered, so it was
// STILL running the bare form — read live off the scheduler on 11 Aug 2026:
//     cmd /c cd /d <repo> && node scripts\distiller.mjs
// no redirect, 96 runs a day. Corroboration: `ls scripts/*.log` listed 30 organ
// logs that morning and distiller.log was not one of them.
//
// WHAT WAS ACTUALLY LOST — stated honestly, because the first draft of this
// finding overstated it: run()'s two console lines MIRROR state that is already
// persisted (engine · sources · have_need land in working_set.json; the G16 row
// lands in distiller_latency.jsonl), so none of THAT was unrecoverable. What had
// nowhere to land was the OTHER stream — an exception out of distill(), a bad
// import, a writeAtomic failure. Those go to stderr, and on the bare form stderr
// died with the window. The one organ that owns his re-entry card could crash
// every 15 minutes and leave no trace anywhere in the organism.
//
// THE FIX WAS THE REGISTRATION, NOT THE CODE: the live action was re-pointed at
// setup\run_logged.cmd IN PLACE, via Set-ScheduledTask on the fetched task
// object, so the 15-min repetition, StartWhenAvailable and the cleared battery
// flags all survived. A `schtasks /Create /F` would have re-created it with
// DisallowStartIfOnBatteries back at its default TRUE — on a laptop that is a
// worse defect than the one being repaired, which is why the whole installer
// was not re-run either (it would also re-ENABLE the rows tasks_expected.json
// lists as designed-disabled, e.g. Examiner → a double-run against its chain).
//
// WHY THE GUARD LIVES HERE: nothing in the organism reads a task's ACTION.
// watchman.mjs probeExpectedTasks diffs live schtasks against
// tasks_expected.json on NAME and STATE only — its PowerShell emits
// `"$($_.TaskName)|$($_.State)"` — so a task silently reverted to the bare form
// is invisible to every organ. The selftest below is this organ asking, out
// loud, whether its own voice still has an address; the suite (organism_test
// runs every script's selftest) is its consumer. It follows watchman's own rule
// for a box that cannot answer — no snapshot = NO CLAIM, never a false red.
const WRAPPED_RE = /run_logged\.cmd/i;
// null = unanswerable (not this box's business); true/false = a real answer.
function voiceIsWired(action) {
  return action == null ? null : WRAPPED_RE.test(String(action));
}
function registeredAction(name = "ArsenalFC-Distiller", deps = {}) {
  if (deps.action !== undefined) return deps.action;              // fixtures never touch the scheduler
  if (process.platform !== "win32") return null;                  // no Task Scheduler = no claim
  if (!/^[A-Za-z0-9-]+$/.test(name)) return null;                 // the name is interpolated into PS — keep it a name
  try {
    const ps = spawnSync("powershell", ["-NoProfile", "-Command",
      `$t = Get-ScheduledTask -TaskName '${name}' -ErrorAction SilentlyContinue; if ($t) { $t.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" } }`],
      { encoding: "utf8", timeout: 30000, windowsHide: true });
    if (ps.status !== 0) return null;
    return String(ps.stdout || "").trim() || null;                // task absent on this box = no claim
  } catch { return null; }
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

  // ---------------------------------------------------------------------
  // #WIRE (dead-wire sweep, 11 Aug 2026) — THE DOOR'S CUT, HELD OPEN.
  // These four go red the moment currentWindow goes back to reading title/text
  // without asking whether the row it read was already a stub: drop the marker,
  // drop door_cut, double-mark, or fold a pre-D8 row into "clean". The fixture
  // title is the real sheared one context.mjs's own D8 header quotes off the live
  // bus, so the regression is tested against the sentence it actually happened to.
  const SHEARED = "i can buy helium 10 platinum as well and want to first work w";
  const cutRow = [{ ts: "2026-08-11T05:00:00Z", modality: "context", app: "chrome.exe",
    title: SHEARED, text: `chrome.exe · ${SHEARED}`,
    title_len: 227, title_truncated: true, text_len: 260, text_truncated: true }];
  const cw = currentWindow("no-dir", cutRow);
  assert("#wire: a title the DOOR sheared arrives MARKED — D8's flag finally has a reader downstream of context.mjs",
    cw.door_cut === true && wasTruncated(cw.title) && cw.title_len === 227 &&
    !wasTruncated(currentWindowLegacy("no-dir", cutRow).title));       // the frozen engine still shows the silent cut
  assert("#wire: the marker is spent INSIDE the string — no cap moves by a byte, and it reaches the LLM prompt",
    cw.title.length === SHEARED.length && wasTruncated(cw.text) &&
    buildPrompt([], null, cw).includes(cw.title));
  // a door-cut row LONGER than the 120 clamp: clampStr marks it, markCut must not mark it again
  const longCut = [{ ts: "2026-08-11T05:01:00Z", modality: "context", app: "chrome.exe", title: "x".repeat(200),
    text: "y".repeat(240), title_len: 300, title_truncated: true, text_len: 400, text_truncated: true }];
  const lw = currentWindow("no-dir", longCut);
  assert("#wire: one cut, one marker — clampStr's own 120 cut and the door's cut never double-mark the same string",
    lw.text.length === 120 && wasTruncated(lw.text) && !lw.text.endsWith(TRUNC_MARK + TRUNC_MARK));
  const cleanRow = [{ ts: "2026-08-11T05:02:00Z", modality: "context", app: "Code.exe", title: "drill.py",
    text: "Code.exe · drill.py", title_len: 8, title_truncated: false, text_len: 19, text_truncated: false }];
  const preD8Row = [{ ts: "2026-07-20T11:00:00Z", modality: "context", app: "Code.exe", title: "drill.py", text: "Code.exe · drill.py" }];
  assert("#wire: THREE states, never two — measured-clean is false, a pre-D8 row is null (UNKNOWN), neither dressed as the other",
    currentWindow("no-dir", cleanRow).door_cut === false && currentWindow("no-dir", preD8Row).door_cut === null &&
    !wasTruncated(currentWindow("no-dir", cleanRow).title) && currentWindow("no-dir", preD8Row).title === "drill.py");

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
  // #WIRE (11 Aug 2026) — THE COUNTER NAMES THE RIGHT DISEASE.
  // `leaked` is one his row + one claude-code-teaching row: the OLD code reported that
  // as `captions_rejected: 1` and run() printed "1 window caption(s) rejected", the
  // exact mislabel measured live at 13. Second half of the assertion is the frozen
  // aggregate identity — the number the old key carried is still derivable, so nothing
  // that ever read it lost information.
  assert("#WIRE the not-his counter splits by CAUSE (my teaching ≠ a window caption)",
    leaked.have_need.self_rows_excluded === 1 && leaked.have_need.captions_rejected === 0);
  {
    const mixed = [
      { ts: "2026-08-11T04:00:00Z", modality: "code", source: "claude-code", text: "grounding aur retrieval alag kaise hain?" },
      { ts: "2026-08-11T04:01:00Z", modality: "code", source: "claude-code-teaching", text: "Both pushed. Working tree clean." },
      { ts: "2026-08-11T04:02:00Z", modality: "code", source: "claude-code", text: "chrome.exe · Google Search" },
    ];
    const b = notHisBreakdown(mixed);
    assert("#WIRE captions + self rows == the aggregate the single old counter carried",
      b.captions_rejected === 1 && b.self_rows_excluded === 1 &&
      b.captions_rejected + b.self_rows_excluded === mixed.length - hisWords(mixed).length);
  }
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

  // ------------------------------------------------------------------------
  // #WIRE — TRUNCATED AT THE DOOR (wiring pass, 11 Aug 2026). recentStream cut
  // every evidence row at 400 chars before ANY consumer saw it, silently. The
  // fixture below is the exact live shape that broke: he opens a long message with
  // the topic, works through it, and states the doubt at the END — past char 400.
  // Under the frozen legacy projection that doubt is invisible and open_loop falls
  // back to an OLDER, already-answered one. Run through the PRODUCTION path (raw
  // afferent rows → recentStream → deterministicSet), which is the lesson the #108
  // block above paid for: an assertion on an injected `deps.stream` proves nothing.
  // ------------------------------------------------------------------------
  {
    const pad = "grounding step ke baad retrieval wala part likha, phir index rebuild kiya, ".repeat(7);
    const longRow = "cosine similarity wala part likh raha hoon, " + pad + " par yeh kyun use karte hain?";
    const rawLong = [
      { ts: "2026-08-11T03:00:00Z", modality: "code", source: "claude-code", text: "tokenization ka doubt tha" },
      { ts: "2026-08-11T03:01:00Z", modality: "code", source: "claude-code", text: longRow },
    ];
    // guards the fixture itself: if padding ever grows a doubt word, the test below
    // would pass for the wrong reason and this repair would rot back in unnoticed.
    assert("#WIRE fixture is honest — the long row's first 400 chars carry NO doubt marker, the doubt is past the old cut",
      longRow.length > 400 && !DOUBT_RE.test(longRow.slice(0, 400)) && DOUBT_RE.test(longRow));
    // the invariant is "normalised, never cut" — so it is stated against normStr(),
    // not against the raw fixture: whitespace collapsing is the projection's job and
    // asserting on raw length would make this test fail for the wrong reason.
    assert("#WIRE recentStream no longer cuts the evidence — the row arrives whole",
      recentStream("no-dir", 25, INTERACTIVE, rawLong)[1].text === normStr(longRow) && normStr(longRow).length > 400);
    assert("#WIRE the frozen legacy projection still shows the defect (why it was superseded)",
      recentStreamLegacy("no-dir", 25, INTERACTIVE, rawLong)[1].text.length === 400);
    const floorNow = deterministicSet(recentStream("no-dir", 25, INTERACTIVE, rawLong), [], null);
    const floorOld = deterministicSet(recentStreamLegacy("no-dir", 25, INTERACTIVE, rawLong), [], null);
    assert("#WIRE THE WIRE — a doubt stated past char 400 now reaches open_loop; the legacy cut fell back to an older one",
      floorNow.open_loop.includes("cosine") && floorOld.open_loop === "tokenization ka doubt tha");
    // the bound did not vanish, it MOVED to the only consumer with a real constraint
    // (the afferent door caps nothing — live max row is 105,011 chars) and it is marked.
    const promptLong = buildPrompt(recentStream("no-dir", 25, INTERACTIVE, rawLong), null, null);
    assert("#WIRE the prompt still bounds each row — the cut moved to buildPrompt, it was not deleted",
      !promptLong.includes(" par yeh kyun use karte hain?") && promptLong.includes("cosine similarity wala part"));
    assert("#WIRE …and the cut is MARKED, never silent — the model is told the row continues",
      /… \[\+\d+ chars cut\]/.test(promptLong) && !/\[\+\d+ chars cut\]/.test(buildPrompt(stream, null, null)));
    const wired = await distill({ dir: "no-dir", afferent: rawLong, presence: [], drills: null, workspace: null, gen: null });
    assert("#WIRE the card COUNTS the gap: detection read every char, the LLM was shown fewer (a counter, no verdict)",
      wired.have_need.evidence_chars === normStr(longRow).length + "tokenization ka doubt tha".length &&
      wired.have_need.evidence_chars_to_llm === PROMPT_ROW_CHARS + "tokenization ka doubt tha".length &&
      wired.have_need.evidence_chars > wired.have_need.evidence_chars_to_llm);
    assert("#WIRE a stream that fits shows NO gap — the counters read equal, not a fake shortfall",
      (() => { const e = evidenceChars(stream); return e.evidence_chars === e.evidence_chars_to_llm && e.evidence_chars > 0; })());
  }

  // ------------------------------------------------------------------------
  // #WIRE — THE CUT THAT SAID NOTHING (wiring pass, 11 Aug 2026). The slot caps
  // were bare .slice()s: his question stopped mid-word in the one file every
  // session reads, and mcp-memory.mjs:234 prints open_loop RAW into get_context,
  // so the cut arrived at the captain with nothing naming it. These run the
  // PRODUCTION path — raw afferent rows → recentStream → deterministicSet →
  // distill — because the #108 block above paid for the lesson that an assertion
  // on an injected `deps.stream` proves nothing about what he actually reads.
  // ------------------------------------------------------------------------
  {
    // his real shape: one long doubt, stated fully. 66% of his live doubt rows
    // are longer than open_loop's 160-char cap; this is one of them.
    const longDoubt = "cosine similarity ka doubt hai — dot product bhi to similarity deta hai na, phir normalize karke angle nikalne ka faayda kya hai jab dono vectors already same scale pe hain, aur euclidean distance kyun nahi chalega yahan pe?";
    const rawCut = [{ ts: "2026-08-11T04:00:00Z", modality: "code", source: "claude-code", text: longDoubt }];
    const cutStream = recentStream("no-dir", 25, INTERACTIVE, rawCut);
    const cutFloor = deterministicSet(cutStream, [], null);
    assert("#WIRE fixture is honest — the row really does overrun open_loop's 160 and where_left_off's 200 caps",
      longDoubt.length > 200 && DOUBT_RE.test(longDoubt));
    // THE ASSERTION THAT FAILS IF THIS WIRE BREAKS AGAIN: a cut slot must SAY it
    // was cut, and must not spend a byte more than the cap it always had.
    assert("#WIRE a slot cut at the cap SAYS SO — the marker is there and the cap is not exceeded",
      cutFloor.open_loop.endsWith(TRUNC_MARK) && cutFloor.open_loop.length === 160 &&
      cutFloor.where_left_off.endsWith(TRUNC_MARK) && cutFloor.where_left_off.length === 200 &&
      cutFloor.concept_in_motion.endsWith(TRUNC_MARK) && cutFloor.concept_in_motion.length === 80);
    assert("#WIRE the frozen bare cut still shows the defect (why it was superseded): 160 chars, mid-word, silent",
      clampStrLegacy(longDoubt, 160).length === 160 && !clampStrLegacy(longDoubt, 160).endsWith(TRUNC_MARK) &&
      clampStr(longDoubt, 160).slice(0, 159) === clampStrLegacy(longDoubt, 159));
    assert("#WIRE a slot that FITS is never marked — no fake cut on a short answer",
      !wasTruncated(clampStr("why cosine", 160)) && clampStr("why cosine", 160) === "why cosine");
    // the marker must survive into the file, because that file is read RAW by
    // get_context (mcp-memory.mjs:234) — that hop is the whole point of the wire.
    const cutSet = await distill({ dir: "no-dir", afferent: rawCut, presence: [], drills: null, workspace: null, gen: null });
    assert("#WIRE the marker reaches the written card — get_context prints open_loop raw, so this is what he reads",
      wasTruncated(cutSet.open_loop) && wasTruncated(cutSet.where_left_off));
    assert("#WIRE the card COUNTS how many slots the cap bit (counter only — no threshold, no verdict)",
      cutSet.have_need.slots_truncated === 3 && !("verdict" in cutSet.have_need) && !("threshold" in cutSet.have_need));
    assert("#WIRE a card with nothing cut counts ZERO — the counter never invents a shortfall",
      (await distill({ dir: "no-dir", afferent: [{ ts: "2026-08-11T04:00:00Z", modality: "code", source: "claude-code", text: "why cosine?" }], presence: [], drills: null, workspace: null, gen: null })).have_need.slots_truncated === 0);
    // the OTHER two doors that cut: the LLM's own slots (parseSet, 200) and the
    // ambient window line (120). Both were bare slices too; both are the same card.
    assert("#WIRE the LLM path is marked as well — parseSet's 200-char cap no longer cuts silently",
      wasTruncated(parseSet(JSON.stringify({ concept_in_motion: longDoubt + " " + longDoubt })).concept_in_motion));
    assert("#WIRE a silly cap (n<=1) degrades to a bare cut instead of crashing the card",
      clampStr("abc", 1) === "a" && clampStr("abc", 0) === "");
  }

  // distill — mocked LLM, no network
  const set = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => '{"concept_in_motion":"embeddings","open_loop":"why cosine similarity","where_left_off":"","next_step":""}' });
  assert("DISTILL — LLM path fills slots + floor covers where_left_off", set.engine === "gemini-flash" && set.concept_in_motion === "embeddings" && set.where_left_off.includes("cosine"));
  const setDry = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => { throw new Error("pool dry"); } });
  assert("DISTILL — pool dry → deterministic floor stands, never breaks", setDry.engine === "deterministic" && setDry.where_left_off.includes("cosine"));
  const setEmpty = await distill({ dir: "no-dir", stream: [], presence: [], drills: null, workspace: null, gen: null });
  assert("DISTILL — no activity → empty but valid set", setEmpty.sources === 0 && typeof setEmpty.concept_in_motion === "string");

  // ------------------------------------------------------------------------
  // #WIRE — SILENT_FAILURE (dead-wire sweep, 11 Aug 2026). The catch above used to be
  // `catch { /* pool dry → floor stands */ }` with the error UNBOUND, so the four
  // failure paths below all wrote the same word a healthy quiet morning writes. These
  // assertions fail the moment that silence returns: each path must be DISTINCT and
  // each must be NAMED. The floor's behaviour is asserted unchanged alongside — the
  // repair is about what the card SAYS, never about what it serves him.
  // ------------------------------------------------------------------------
  {
    // 1. THE ONE THAT WOULD HAVE CAUGHT THE REAL BUG. defaultGen does
    //    `const { generatePool } = await import("./hippocampus.mjs")` — rename that
    //    export and this is the exact error, which used to vanish into a comment.
    const threw = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null,
      gen: async () => { throw new TypeError("generatePool is not a function"); } });
    assert("#WIRE a THROWN generator is NAMED, not swallowed — a code bug no longer reads as a dry pool",
      threw.engine === "deterministic" && threw.llm_status === "threw: TypeError: generatePool is not a function"
      && threw.where_left_off.includes("cosine"));
    // 2. The failure the old catch could never even see: generatePool RETURNS
    //    { ok:false, text:null, error:"every key dry on every model", status } and does
    //    not throw (hippocampus.mjs:196). This is the real 429 shape, verbatim.
    const dry = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null,
      gen: async () => ({ ok: false, text: null, error: "every key dry on every model", status: 429 }) });
    assert("#WIRE the pool's OWN error + status reach the card — a 429 never threw, so the catch never saw it",
      dry.engine === "deterministic" && dry.llm_status === "pool-failed: every key dry on every model · status 429");
    // 3. Text came back and parsed to nothing — a prompt/model problem, not a dry lane.
    const junk = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => "sorry I can't do that" });
    assert("#WIRE junk text is 'unparsed' with its size — NOT the same event as a dry pool",
      junk.engine === "deterministic" && junk.llm_status === "unparsed: 21 char(s) back, no slot matched");
    // 4. The two not-called paths, which are the ones that legitimately read healthy.
    assert("#WIRE a quiet window says so — and can never be confused with any of the three failures",
      setEmpty.llm_status === "not-called: no interactive activity in the window"
      && new Set([threw.llm_status, dry.llm_status, junk.llm_status, setEmpty.llm_status]).size === 4);
    // 5. THE POINT OF THE WHOLE REPAIR: healthy is silent, so a reader that sees a
    //    string knows something happened. Before this, "deterministic" meant all five.
    assert("#WIRE the healthy path says NOTHING — llm_status is null only when the pool actually answered",
      set.engine === "gemini-flash" && set.llm_status === null && setDry.llm_status === "threw: Error: pool dry");
    // 6. Names only. No verdict, no threshold, no card — the house rule these counters
    //    ride under (his standing law: numbers get ruled on after real data).
    assert("#WIRE NAMES ONLY — no verdict, no threshold, no ok/fail flag rides this field",
      typeof threw.llm_status === "string" && !("verdict" in threw) && !("threshold" in threw)
      && !("healthy" in threw) && !("llm_ok" in threw));
    // 7. A shapeless return degrades honestly instead of inventing a cause.
    assert("#WIRE a generator returning nothing at all reports what is honestly known, never a guessed reason",
      (await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => null })).llm_status === "pool-failed: no text returned");
    // 8. A provider error longer than the borrowed 160 cap is cut AND says it was cut —
    //    the same marked-cut law every other string in this card follows.
    const longErr = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null,
      gen: async () => ({ ok: false, error: "x".repeat(400) }) });
    assert("#WIRE a huge provider error is bounded at open_loop's borrowed 160 and MARKED, never a silent cut",
      longErr.llm_status.length === STATUS_CHARS && wasTruncated(longErr.llm_status));
  }

  assert("SUMMARY — reads as one glanceable line", summaryLine(set).includes("on:") && summaryLine(set).includes("open:"));

  // ------------------------------------------------------------------------
  // LADDER G16 sliver (10 Aug 2026) — THE SWITCH-TO-READ LATENCY COUNTER.
  // Pure functions on fixtures only: the one append lives in run(), which this
  // selftest never calls — that static fact is the hermeticity proof
  // organism_test.mjs records for distiller_latency.jsonl.
  // ------------------------------------------------------------------------
  {
    const amb = [
      { ts: "2026-08-10T10:00:00.000Z", modality: "context", app: "chrome.exe", title: "Docs" },
      { ts: "2026-08-10T10:01:00.000Z", modality: "context", app: "chrome.exe", title: "Gmail" },       // title churn, same app
      { ts: "2026-08-10T10:04:00.000Z", modality: "context", app: "claude.exe", title: "Claude" },      // SWITCH
      { ts: "2026-08-10T10:06:00.000Z", modality: "code", source: "claude-code", text: "not ambient" }, // not the ambient stream
      { ts: "2026-08-10T10:09:00.000Z", modality: "context", app: "WindowsTerminal.exe", title: "T" },  // SWITCH
    ];
    const sw = detectSwitches(amb);
    assert("G16 — a switch is the ambient app CHANGING; title churn and non-ambient rows are not switches",
      sw.length === 2 && sw[0].app === "claude.exe" && sw[1].app === "WindowsTerminal.exe");
    assert("G16 — the first-ever ambient row is an appearance, never a switch", detectSwitches([amb[0]]).length === 0);
    const m = measureLatency("2026-08-10T10:02:00.000Z", "2026-08-10T10:15:00.000Z", sw);
    assert("G16 — lag is write_ts minus switch_ts, raw per switch",
      m && m.n === 2 && m.switches[0].lag_ms === 11 * 60000 && m.switches[1].lag_ms === 6 * 60000);
    assert("G16 — aggregates are computed, never guessed (min/mean/max over the caught lags)",
      m.min_ms === 6 * 60000 && m.max_ms === 11 * 60000 && m.mean_ms === Math.round((11 + 6) * 60000 / 2));
    assert("G16 — a switch BEFORE the previous write belongs to that earlier write, never double-counted",
      measureLatency("2026-08-10T10:05:00.000Z", "2026-08-10T10:15:00.000Z", sw).n === 1);
    assert("G16 — a switch after this write (clock skew / future row) is not caught by it",
      measureLatency("2026-08-10T10:02:00.000Z", "2026-08-10T10:05:00.000Z", sw).n === 1);
    assert("G16 — first run ever (no previous write) measures NOTHING — null, not a fake since-forever lag",
      measureLatency(null, "2026-08-10T10:15:00.000Z", sw) === null);
    assert("G16 — a quiet window is {n:0}: measured-and-empty, distinct from unmeasured; run() appends no row for it",
      measureLatency("2026-08-10T10:10:00.000Z", "2026-08-10T10:12:00.000Z", sw).n === 0);
    assert("G16 — the report on an absent journal answers honestly: zero counts, null lags, no verdict anywhere",
      (() => { const r = latencyReport(join("no-dir", "nothing.jsonl")); return r.runs === 0 && r.switches === 0 && r.median_ms === null && !("verdict" in r) && !("threshold" in r); })());
    // the second witness (refuter pass, 10 Aug 2026): a racing concurrent run
    // and a backward clock step both try to re-open an already-counted window —
    // the journal's last row clips the left edge and exactly-once holds.
    assert("G16 — the journal's last row clips the window: a racing run can never re-count a switch",
      latencyLeftEdge("2026-08-10T10:02:00.000Z", "2026-08-10T10:08:00.000Z") === "2026-08-10T10:08:00.000Z" &&
      measureLatency(latencyLeftEdge("2026-08-10T10:02:00.000Z", "2026-08-10T10:08:00.000Z"), "2026-08-10T10:15:00.000Z", sw).n === 1);
    assert("G16 — a backward clock step (prev write ts regressed below the journal edge) is disarmed the same way",
      latencyLeftEdge("2026-08-10T09:00:00.000Z", "2026-08-10T10:10:00.000Z") === "2026-08-10T10:10:00.000Z" &&
      measureLatency(latencyLeftEdge("2026-08-10T09:00:00.000Z", "2026-08-10T10:10:00.000Z"), "2026-08-10T10:15:00.000Z", sw).n === 0);
    assert("G16 — no previous write AND no journal → still nothing measured (never a since-forever lag)",
      latencyLeftEdge(null, undefined) === null && measureLatency(latencyLeftEdge(null, undefined), "2026-08-10T10:15:00.000Z", sw) === null);
  }

  // ------------------------------------------------------------------------
  // #WIRE (11 Aug 2026) — THE VOICE-HAS-AN-ADDRESS CHECK. See the block above
  // registeredAction() for the whole finding. The last assertion here is the
  // one that fails loudly if ArsenalFC-Distiller is ever re-registered bare.
  // ------------------------------------------------------------------------
  {
    assert("#WIRE the bare form is recognised as VOICELESS — the exact action string that was live on 11 Aug 2026",
      voiceIsWired("cmd /c cd /d C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc && node scripts\\distiller.mjs") === false);
    assert("#WIRE the wrapper form is recognised as WIRED — the shape INSTALL_CYBORG_TASKS.ps1's Mk() writes",
      voiceIsWired("cmd /c C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\setup\\run_logged.cmd scripts\\distiller.mjs") === true);
    assert("#WIRE an unanswerable box makes NO CLAIM — watchman's own rule, never a false red on a fresh clone",
      voiceIsWired(null) === null && registeredAction("ArsenalFC-Distiller", { action: null }) === null &&
      registeredAction("not a task name", {}) === null);
    // THE LIVE ONE. On the captain's box the task exists, so this is a real
    // assertion about the real scheduler; anywhere else it abstains out loud.
    const liveAction = registeredAction();
    assert(liveAction === null
      ? "#WIRE (no claim — ArsenalFC-Distiller is not registered on this box, so there is nothing to check)"
      : `#WIRE THE LIVE TASK ROUTES THROUGH run_logged.cmd, so stdout AND stderr reach scripts/distiller.log — action: ${liveAction}`,
      liveAction === null || voiceIsWired(liveAction) === true);
  }

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "latency") {
    // G16 — the measurement window, read out loud. Counts + names only; the
    // cadence decision itself stays HIS, made on this data when it has aged.
    const r = latencyReport();
    if (!r.runs) { console.log("distiller latency: nothing measured yet — the window opens on the first run that catches a context-switch."); return; }
    console.log("distiller switch-to-read latency — MEASUREMENT WINDOW (counter only; the 15-min cadence stays guessed until this data rules):");
    console.log(`  ${r.runs} run(s) recorded · ${r.switches} switch(es) caught · ${r.span}`);
    if (r.switches) console.log(`  lag: min ${Math.round(r.min_ms / 1000)}s · median ${Math.round(r.median_ms / 1000)}s · mean ${Math.round(r.mean_ms / 1000)}s · max ${Math.round(r.max_ms / 1000)}s`);
    return;
  }
  await run();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { distill, deterministicSet, parseSet, merge, mergeLegacy, mergeV2Legacy, recentStream, recentStreamLegacy,
         currentWindow, currentWindowLegacy, hisWords, looksLikeWindowCaption, buildPrompt, promptRow, evidenceChars, summaryLine, run,
         INTERACTIVE, INTERACTIVE_LEGACY, AMBIENT, PROMPT_ROW_CHARS,
         clampStr, clampStrLegacy, wasTruncated, TRUNC_MARK,
         voiceIsWired, registeredAction,
         detectSwitches, measureLatency, latencyReport, latencyLeftEdge };
