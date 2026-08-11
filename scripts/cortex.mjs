#!/usr/bin/env node
// ============================================================================
// cortex.mjs · ARSENAL AI FC — THE CORTEX (the deep brain's waker)
// ----------------------------------------------------------------------------
// WHAT:  The prefrontal half of the two-speed brain (CYBORG_BRAIN.md §4.6).
//        M14 — THE OVERLAP: serves the thalamus's wake QUEUE (wake_queue.jsonl,
//        event-sourced; wake.json remains the legacy single-slot fallback) and
//        runs up to deep.concurrency (2) profound reads CONCURRENTLY on Claude
//        Opus with extended thinking (`claude -p`, Max subscription, NEVER an
//        API key) — one deep thought no longer blocks the next. Each read is
//        fed the bound moment + the relevant bus slice (twin · calibration ·
//        learning-state · the matching capsule). Answers are POSTed back to
//        the thalamus at :4113/deep-answer — the cortex NEVER writes a state
//        file the thalamus owns (single-writer preserved); its only files are
//        its own runtime (cortex_runtime.json) and the SHARED brain ledger
//        row it appends so the Opus spend counts against the real window
//        (same shape brain.mjs writes; windowUsage() sees every token).
//        A wake stuck in the queue past deep.queue_ttl_min is DECLINED as
//        expired-in-queue — nothing dangles, ever.
// GUARDS: refuses to run if ANTHROPIC_API_KEY is set (the $100 law, same as
//        brain.mjs) · declines the wake when window headroom is under the
//        floor (the budget-coupled thalamus already raised the bar; this is
//        the second lock) · at most 2 attempts per moment · the answer passes
//        the banned-phrase validator (honest frame) or it is DECLINED, never
//        softened. A declined wake is still reported back — nothing dangles.
// MODES: node scripts/cortex.mjs             → daemon (watch + 5s poll)
//        node scripts/cortex.mjs consolidate → OVERNIGHT DEEPENING (P5): one nightly
//                                              Opus pass → concept_graph.json (its only
//                                              reader is setpiece.mjs). THE ONLY MODE A
//                                              SCHEDULER FIRES — ArsenalFC-ConceptGraph,
//                                              Enabled, DAILY 03:00. Its exit code is the
//                                              whole surface: 0 iff the graph on disk is
//                                              today's (#71).
//        node scripts/cortex.mjs tick        → serve one pending wake, exit. A HAND POKE:
//                                              no scheduler, script or skill invokes it
//                                              (verified 11 Aug 2026 — the only repo-wide
//                                              hit for "cortex.mjs tick" is this line).
//        node scripts/cortex.mjs restart     → THE RESTART DOOR (11 Aug 2026): knock on the
//                                              live daemon so it RETIRES ITSELF once no deep
//                                              lane is in flight, freeing :4112 for a build
//                                              that actually holds the repairs. Fired by
//                                              captains_call.mjs when he answers haan on the
//                                              STALE BUILD card — never by a scheduler, never
//                                              on its own. See THE RESTART DOOR below.
//        node scripts/cortex.mjs selftest
// (wiring audit, 11 Aug 2026 — INVERSE DEAD COMMAND: this block advertised daemon/tick/
//  selftest and did NOT name `consolidate`, while the daemon's own task ArsenalFC-Cortex
//  sits Disabled. Skills learn an organ's surface by grepping its header — see
//  .claude/skills/full-time/SKILL.md's `grep -n "^// MODES"` — so a session reading this
//  file's OWN contract concluded the nightly Opus consolidation did not exist and would
//  not think to ask whether it had run. The header is a wire; it is now held answerable
//  to main()'s dispatcher by a selftest, see "THE CONTRACT HEADER IS A WIRE" below.)
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync, watch, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync, execFile } from "node:child_process";
// ledgerShiftSummary joined this import 11 Aug 2026 (wiring audit): it is the ONE
// consumer of the bench census stamped below, and the selftest runs the real rows
// through it so the producer goes red the day the reader is deleted. brain.mjs does
// not import this file, so the edge stays one-way.
import { headroom, loadConfig as loadBrainConfig, bannedPhraseCheck, maxThinkingFor, ledgerShiftSummary } from "./brain.mjs";
import { loadConfig as loadThalamusConfig, pendingWakes } from "./thalamus.mjs";
// M8 — the Back Room: three cheap adversarial drafts before the one deep call
import { convene, councilSection } from "./council.mjs";
// WIRING AUDIT (10 Aug 2026) — the ambient window's engine is IMPORTED, never copied.
// `currentWindow`/`AMBIENT` are the distiller's own definition of "where he is"
// (distiller.mjs:98-107); `presenceTailReport` is presence.mjs's file-GENERIC jsonl
// tail reader, already borrowed the same way by context.mjs:42. See ambientWindow().
import { currentWindow, AMBIENT } from "./distiller.mjs";
import { presenceTailReport as jsonlTailReport } from "./presence.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WAKE      = join(STATE_DIR, "wake.json");
const WQUEUE    = join(STATE_DIR, "wake_queue.jsonl");   // M14 — read-only here; the thalamus is its sole writer
const RUNTIME   = join(STATE_DIR, "cortex_runtime.json");
// the paid-answer lifeboat: answers that could not be reported back (thalamus
// down / restarting) wait here instead of evaporating. Drained on the next serve.
const UNSENT    = join(STATE_DIR, "cortex_unsent.jsonl");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");
const THALAMUS  = "http://127.0.0.1:4113";
const LIMIT_RE  = /limit|overloaded|rate.?limit|resets \d/i;
// E2E audit 25 Jul 2026: this used to be an unguarded fetch. If the thalamus was
// down or slow, the POST threw, the exception escaped serveOne, and the Opus
// answer the captain had ALREADY PAID FOR was discarded — the wake stayed pending
// and the same expensive question was bought again on the next attempt, until it
// finally died as "gave-up". An answer that cost money must never be lost to a
// transport hiccup: report failures now come back as a value, and the caller
// SPOOLS the text to disk (see UNSENT) so it can be delivered later.
const defaultPost = async (path, body) => {
  try {
    const r = await fetch(THALAMUS + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return { ok: false, error: `thalamus ${r.status}` };
    try { return { ok: true, ...(await r.json()) }; } catch { return { ok: true }; }
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 160) }; }
};

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// THE PROMPT — laws travel with every wake; the moment is the question
// ---------------------------------------------------------------------------
// ─────────────────────────────────────────────────────────────────────────────
// THE CAPSULE DOOR (11 Aug 2026) — the THIRD door found cut to the same shape.
//
// WHAT WAS BROKEN. This door read the capsule file as RAW BYTES and cut it at
// 1,500 characters, then handed the stump to a prompt that calls it "his own
// locked knowledge on this concept — build on HIS words". Measured live across
// all four capsules on 11 Aug 2026: embeddings.json 57,984 chars → 1,500 (2.6%),
// inference 2.4%, context 3.0%, tokenization 3.6%. The cut lands mid-string
// inside an unterminated JSON value (embeddings ends "...call karta, k"), so
// even the 2.6% arrives as broken JSON. Because a capsule's key order puts the
// short header fields first, EVERY layer that carries his actual thinking —
// bolo, the nine welds, traps, threeWays, interviewLines, doubts, deep — fell
// entirely outside the 1,500 in all four capsules, and NO field named the drop.
// That is byte-for-byte the defect dugout.mjs:880-929 fixed on 10 Aug (its 220-
// char per-axis cut) and the same silent-omission sin found in the recital lane.
// The 1500 shipped with no comment justifying it — a guessed number, which his
// standing rule forbids.
//
// WHY THE FIX IS NOT dugout's capsuleProjection(). That engine is built for a
// VOICE reader: it pages (one weld per call, priced in spoken seconds) because
// he must be able to interrupt. The cortex is a ONE-SHOT prompt — it cannot ask
// for page two — so paging here would be the silent drop wearing a new hat.
// What travels across from dugout is its RULING, not its code: nothing is
// truncated, and the read unit is the WELD, with `deep` a separate layer opened
// only on request (dugout.mjs:896-908).
//
// SO: parse the capsule, emit his prose VERBATIM AND UNCUT, and name the one
// layer deliberately left out. NO NEW CAP REPLACES THE OLD CAP. Measured cost
// of the whole projection, 11 Aug 2026: context 19,241 · embeddings 25,009 ·
// inference 20,155 · tokenization 23,476 chars — worst case ~6.3k tokens against
// a lane that already reserves est_tokens_per_wake (40k) and gates on a 50k
// floor. That is a measurement, not a limit: it caps nothing.
//
// THE ONE OMISSION, AND IT IS NAMED IN THE PAYLOAD: the `deep` re-learn layer
// (9,333–29,427 chars per capsule). It is his scratch-from-zero re-teach, which
// dugout's ruling already made an explicitly-asked-for layer rather than part of
// the read unit — and the cortex's job is to give a fresh mechanism-level read,
// not to replay a re-teach. Its exact character count rides in the prompt, so
// the deep brain knows the layer exists and knows it is not holding it. Whether
// it should ride too is HIS call, not this file's (see the report).
// ─────────────────────────────────────────────────────────────────────────────

// Frozen verbatim (LAYERING law — the old engine never leaves the file). This is
// the door as it shipped until 11 Aug 2026; kept so the truncation it caused
// stays auditable, and so the fallback below can still use it when a capsule on
// disk will not parse (a broken file must still yield something, as it did).
function findCapsuleLegacy(tokens = [], dir = join(STATE_DIR, "capsules")) {
  try {
    const files = readdirSync(dir).filter(f => f.endsWith(".json"));
    for (const t of tokens.map(x => String(x).toLowerCase())) {
      const f = files.find(f => f.toLowerCase().includes(t));
      if (f) return { name: f, text: readFileSync(join(dir, f), "utf8").slice(0, 1500) };
    }
  } catch { }
  return null;
}

// His prose, whole. READ-ONLY: capsules/ belongs to mirror.mjs and this file
// never writes there, never rewords a line, and never re-emits one as its own.
function capsuleText(src, id) {
  const S = (v) => String(v == null ? "" : v);
  const axes = Array.isArray(src.faultLines) ? src.faultLines : [];
  const doubts = Array.isArray(src.doubts) ? src.doubts : [];
  const traps = Array.isArray(src.traps) ? src.traps : [];
  const lines = Array.isArray(src.interviewLines) ? src.interviewLines : [];
  const w = src.threeWays || {};
  const out = [];
  out.push(`${id} · ${S(src.title || id)}${src.status ? ` · ${S(src.status)}` : ""}${src.lockedOn ? ` · locked ${S(src.lockedOn)}` : ""}${Array.isArray(src.reJirahDone) ? ` · ${src.reJirahDone.length} Re-Jirah round(s)` : ""}`);
  if (S(src.bolo).trim()) out.push(`BOLO (how HE says it out loud — his voice, not yours):\n${S(src.bolo)}`);
  if (S(src.hook).trim()) out.push(`HOOK:\n${S(src.hook)}`);
  if (S(src.mechanism).trim()) out.push(`MECHANISM:\n${S(src.mechanism)}`);
  if (axes.length) out.push("THE NINE AXES — his own strike + weld, VERBATIM:\n" + axes.map((a) => {
    const o = (a && typeof a === "object") ? a : {};
    return `[${S(o.axis)}] ${S(o.title)}${o.status ? ` (${S(o.status)})` : ""}\n  STRIKE: ${S(o.strike)}\n  WELD:   ${S(o.weld)}`;
  }).join("\n"));
  if (traps.length) out.push("TRAPS he has already walked into:\n" + traps.map(t => "- " + (typeof t === "string" ? t : JSON.stringify(t))).join("\n"));
  if (w.ceo || w.junior || w.skeptic) out.push(`THREE WAYS he explains it:\n  CEO:     ${S(w.ceo)}\n  JUNIOR:  ${S(w.junior)}\n  SKEPTIC: ${S(w.skeptic)}`);
  if (lines.length) out.push("INTERVIEW LINES (his own):\n" + lines.map(x => "- " + S(x)).join("\n"));
  if (doubts.length) out.push(`DOUBTS HE ALREADY FOUGHT (${doubts.length}) — never answer one of these back to him as if it were new ground:\n`
    + doubts.map((d, i) => `${i + 1}. Q: ${S(d.q || d.question)}\n   A: ${S(d.a || d.answer)}`).join("\n"));
  // ABSENCE IS NAMED — the silent drop is the defect being removed, so the one
  // omitted layer says its own size, and an EMPTY deep says that too.
  const deepAxes = axes.filter(a => a && S(a.deep).trim());
  const deepChars = deepAxes.reduce((s, a) => s + S(a.deep).length, 0) + S(src.deep).length;
  out.push(deepChars
    ? `NOT INCLUDED, and named so you know what you are not holding: his \`deep\` re-learn layer — ${deepAxes.length} axis deep(s)${S(src.deep).trim() ? " plus the capsule-level deep" : ""}, ${deepChars} characters in all. That is his scratch-from-zero re-teach; everything above is his COMPRESSED truth and every word of it above is VERBATIM and UNCUT.`
    : `His \`deep\` re-learn layer is EMPTY in this capsule — nothing was dropped. Everything above is VERBATIM and UNCUT.`);
  return out.join("\n\n");
}

function findCapsule(tokens = [], dir = join(STATE_DIR, "capsules")) {
  try {
    const files = readdirSync(dir).filter(f => f.endsWith(".json"));
    const toks = tokens.map(x => String(x).toLowerCase()).filter(Boolean);
    // EXACT id first — dugout.mjs:1398 resolves a capsule as `id + ".json"`, and the
    // old substring-only scan let short tokens open the wrong book ("context.json"
    // contains "on", "text", "one"). The substring pass is kept UNCHANGED beneath it,
    // so nothing that resolved before stops resolving; exactness only wins ties.
    let hit = files.find(f => toks.includes(f.slice(0, -5).toLowerCase())) || null;
    if (!hit) for (const t of toks) { const f = files.find(f => f.toLowerCase().includes(t)); if (f) { hit = f; break; } }
    if (!hit) return null;
    const id = hit.slice(0, -5);
    const raw = readFileSync(join(dir, hit), "utf8");
    let src = null;
    try { src = JSON.parse(raw); } catch { }
    // a capsule that will not parse still yields what it always yielded (layering)
    if (!src || typeof src !== "object") return { name: hit, id, text: raw.slice(0, 1500), unparsed: true };
    return { name: hit, id, text: capsuleText(src, id) };
  } catch { }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CAPSULE SLOT NAMES ITS ABSENCE (dead-wire sweep, 11 Aug 2026)
//
// WHAT WAS BROKEN. The 11-Aug repair above holds the door OPEN, but the slot
// that renders it was still `${capsule ? … : ""}` — so every miss came out as
// the empty string and the prompt simply had no capsule section. Four different
// facts collapsed into that one silence: (1) no locked capsule matches these
// tokens, (2) the thalamus bound the moment with NO concept_tokens so the door
// was never asked anything, (3) capsules/ could not be read at all — mirror.mjs
// owns it and a fresh clone has none — and (4) a capsule that would not parse,
// served as the legacy 1,500-char raw stump under a header calling it "his own
// locked knowledge". MEASURED on the live queue, 11 Aug 2026: of the 38 rows in
// wake_queue.jsonl, 19 carry a spotlight and findCapsule returns null on 19 of
// 19 — one of them for reason (2), the other 18 for reason (1) — so the flagship
// capsule repair has never opened on a real wake and nothing in the prompt said
// so. Built. Present. Not wired.
//
// WHY IT MATTERS MORE THAN A MISSING SECTION: "he has locked nothing here" is a
// teaching instruction (lay the ground from zero), while "the door failed" is an
// UNKNOWN. Handing the deep brain the same silence for both lets it answer as if
// it had checked his knowledge when it never did.
//
// THE SHAPE IS BORROWED, NOT INVENTED: the ambient window prints
// `{ window: null, reason: … }` (:397) and the moment door prints
// `text_truncated` (:342) — this slot was the last door in the prompt that named
// nothing. No threshold, no budget, no new number: the shelf listing is whatever
// mirror.mjs put on disk, and the reason is derived, never guessed.
//
// READ-ONLY, like everything else that touches capsules/: this lists filenames
// and never opens, rewords or re-emits a line of his prose.
// ─────────────────────────────────────────────────────────────────────────────
function capsuleAbsence(tokens = [], dir = join(STATE_DIR, "capsules"), deps = {}) {
  const toks = (Array.isArray(tokens) ? tokens : []).map(x => String(x).toLowerCase()).filter(Boolean);
  // injectable for the same FIXTURE reason every other reader here is (:828) — the
  // suite must not swing on whatever mirror.mjs last fetched to the captain's disk
  const list = deps.list || (() => readdirSync(dir).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5)));
  let shelf = null, failure = null;
  try { shelf = list(); } catch (e) { failure = String((e && e.code) || (e && e.message) || e).slice(0, 120); }
  if (failure !== null) return { capsule: null, why: "door_failed",
    reason: `THE DOOR FAILED — his capsules/ shelf could not be read (${failure}). mirror.mjs owns that folder. This is UNKNOWN, NOT a statement that he has locked nothing here: do not tell him he has no ground on this.`,
    his_locked_capsules: null, moment_concept_tokens: toks };
  if (!shelf.length) return { capsule: null, why: "shelf_empty",
    reason: "his capsules/ shelf is EMPTY on this machine — mirror.mjs has fetched nothing here. UNKNOWN, not evidence about his knowledge.",
    his_locked_capsules: [], moment_concept_tokens: toks };
  if (!toks.length) return { capsule: null, why: "no_concept_tokens",
    reason: "the thalamus bound this moment with NO concept_tokens, so the capsule door was never asked a question. This says nothing about what he has locked — the capsules he DOES hold are listed below.",
    his_locked_capsules: shelf, moment_concept_tokens: [] };
  return { capsule: null, why: "no_match",
    reason: `none of his ${shelf.length} locked capsules matches these concept tokens — he has locked NOTHING on this concept yet. Teach it from the ground up; do not build on ground he has not laid.`,
    his_locked_capsules: shelf, moment_concept_tokens: toks };
}

function capsuleSection(capsule, tokens, dir = join(STATE_DIR, "capsules"), deps = {}) {
  if (capsule && String(capsule.text || "").trim()) {
    // the fourth silence: findCapsule's unparsed fallback (:214) hands back the LEGACY
    // raw head-cut, and until today it rode under the same header as his real prose.
    const degraded = capsule.unparsed
      ? `\n(THE DOOR IS DEGRADED AND SAYS SO: ${capsule.name || "this capsule"} would not JSON.parse, so what follows is the frozen legacy fallback — the first 1,500 raw characters of the file, severed mid-string. It is a DAMAGED FRAGMENT, not his prose laid out. Never quote it back to him as his own line.)`
      : "";
    return `\nTHE CAPSULE (his own locked knowledge on this concept — build on HIS words):${degraded}\n${capsule.text}\n`;
  }
  return `\nNO CAPSULE — and the reason is NAMED, never a silent gap. Read why before you assume anything about what he knows:\n${JSON.stringify(capsuleAbsence(tokens, dir, deps), null, 1)}\n`;
}
// ---------------------------------------------------------------------------
// WIRING AUDIT (10 Aug 2026) — THE CONTEXT RIVER FINALLY REACHES THE CORTEX
// ---------------------------------------------------------------------------
// context.mjs's own header (its lines 8-9) says the ambient bridge exists to be "the
// multi-surface RIVER that finally gives the never-fired cortex something to reason
// over ... so every bound moment carries what-app / what-concept he was on." It never
// arrived here. MEASURED this run: salience_ledger.jsonl holds 2,999 moments whose
// `modalities` include `context` and ALL 2,999 are outcome:"reflex" (highest S ever
// 0.244, against a tau1_eff that never fell below 0.40); of the 48 moments in the whole
// ledger that DID leave reflex, not one carries `context` at all — so wake_queue.jsonl's
// 38 rows contain zero context, and this file, the stated destination, had read exactly
// none of the stream built to feed it. Built, present, emitting, unwired.
//
// WHY it never arrived, and why the repair belongs HERE and not in the scorer: binding is
// co-temporal inside thalamus_config.binding_ms = 900ms (thalamus.mjs bindGroups), while
// context.mjs emits at most once per FLOOR_MS ~60s and only on a window CHANGE. For the
// ambient stream to bind, he must type his doubt inside the same 900ms as an app switch.
// Widening that window, or giving `context` a salience weight, moves the wake bar for
// EVERY lane at once — an approval-gated, curriculum-shaping number that is the captain's
// to set (thalamus_config.json's own _doc says so, and his standing rule is that no number
// is chosen before the data is in). So the stream arrives the way the DISTILLER already
// solved this exact problem for itself: as ONE labelled line of corroboration — never the
// spotlight, never evidence, never a substitute for the question.
//
// IT CARRIES ITS OWN AGE, and no staleness cut-off is invented: a cut-off would be a
// guessed number. The age rides in the prompt and the deep read judges it — a 3-minute-old
// window is where he is, a 3-hour-old one plainly is not, and the model is told which one
// it is holding instead of being handed a bare app name that always reads as "now".
// ABSENCE IS NAMED, never silently omitted: when the tail holds no context row the field
// is null WITH its reason. (That is the exact sin the capsule-door defect was made of —
// a layer that simply did not appear, with no field saying it was missing.)
//
// TAIL DEPTH is MEASURED, not chosen, and twice over: across the whole live afferent.jsonl
// (5,223 rows) the deepest gap between two consecutive `context` rows is exactly 40 rows
// (median 1, p95 4), and brain.mjs:625's liveSignal already tails this same file at 40 for
// the same "freshest trace" job. Deeper is waste; a miss is reported, never guessed.
const AMBIENT_TAIL_ROWS = 40;
function ambientWindow(deps = {}) {
  const now = deps.now !== undefined ? deps.now : Date.now();
  const rows = deps.rows !== undefined ? deps.rows
    : jsonlTailReport(AMBIENT_TAIL_ROWS, { file: join(STATE_DIR, "afferent.jsonl") }).rows;
  const w = currentWindow("", rows);                      // the distiller's engine — one definition, two organs
  if (!w) return null;
  // what-CONCEPT, the other half of the header's promise: context.mjs admits a window title
  // only through concepts.json's canon (its conceptOfTitle), so this is a registered concept
  // id or nothing — a raw window word can never reach the deep brain through this door.
  const last = rows.filter(r => r && AMBIENT.includes(r.modality)).pop() || {};
  const t = Date.parse(w.ts);
  return {
    text: w.text,
    concept: (Array.isArray(last.concept_tokens) && last.concept_tokens[0]) || null,
    age_min: Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 60000)) : null,
    // #WIRE (dead-wire sweep, 11 Aug 2026) — WHETHER THE READING IS WHOLE.
    // context.mjs cuts a window title at 200 chars and text at 240 and has NAMED
    // that cut on the row since D8 (title_truncated / text_truncated); until today
    // no organ that RENDERS the title read the flag, so a sheared title reached
    // this file — the deep brain — reading as the whole thing. The distiller's
    // currentWindow is now the reader; the verdict rides here and is printed by
    // name in the prompt below. Tri-state, never boolean: null means the row
    // predates D8 and the honest answer is UNKNOWN, which is a different fact from
    // "not cut" — the same three-state law this file keeps for an absent window.
    door_cut: w.door_cut !== undefined ? w.door_cut : null,
  };
}
// ---------------------------------------------------------------------------
// WIRING AUDIT (11 Aug 2026) — THE MOMENT'S SKELETON SURVIVES THE DOOR
// ---------------------------------------------------------------------------
// The bound moment was JSON.stringify'd whole and then head-cut at 2,500 chars
// (the one-liner frozen below as momentBlockLegacy). `text` is the SECOND key in
// the envelope and it is the only field that can be huge, so on any long paste
// the cut landed inside it and everything after it — event_key, concept_tokens,
// salience, components, and the ENTIRE bound_context — never reached the deep
// brain. Nothing said so; the block did not even arrive as parseable JSON.
// MEASURED on the live queue this run (38 rows, 19 carrying a spotlight): the two
// biggest moments serialise to 72,091 and 49,483 chars and delivered 3.5% / 5.1%.
// On both, `concept_tokens`, `salience`, `components` and `bound_context` were all
// absent from the served block, and JSON.parse of the slice fails with
// "Unterminated string in JSON at position 2500". The thalamus's 900ms binding and
// its salience score — the whole reason the wake fired — were computed, attached,
// and dropped at the door. Built. Present. Not wired.
//
// THE FIX IS AN ALLOCATION, NOT A NEW BUDGET. 2,500 stays exactly what it was —
// the file's own pre-existing door budget, unchanged, no new number invented (the
// bus slice's 1,500 and the capsule's 1,500 are its siblings). What changes is WHO
// pays for it: the SKELETON (every short structural field) is never cut, and only
// the free-text fields are trimmed, sharing whatever the skeleton leaves over. The
// shares are water-filled — equal split, and a text shorter than its share hands
// the unused chars back to the others — so no constant is chosen anywhere in here.
// How much of a 71k paste SHOULD reach Opus is a token-spend question with his name
// on it; this repair does not answer it and does not move the budget to fake one.
//
// ABSENCE IS NAMED, never silently omitted — the same law the ambient-window repair
// above obeys, and the exact sin the capsule-door defect (weld cut at 220 chars, no
// field saying so) was made of: a trimmed text carries a sibling `text_truncated`
// saying how many characters were dropped, so the deep read knows it is holding a
// fragment instead of mistaking the first 5% for the whole question.
const MOMENT_BUDGET_CHARS = 2500;   // NOT a new number — the pre-11-Aug door's own .slice(0, 2500)

// frozen verbatim (LAYERING, never replace) — the pre-11-Aug-2026 door: one blind
// head-cut across the whole envelope. Kept so the old behaviour stays readable in
// the same file next to the reason it was retired.
function momentBlockLegacy(wake) {
  const spot = wake.spotlight || {};
  return JSON.stringify({ spotlight: { modality: spot.modality, text: spot.text, event_key: spot.event_key, concept_tokens: spot.concept_tokens, salience: spot.S, components: spot.comps }, bound_context: (wake.bound_context || []).map(c => ({ modality: c.modality, text: c.text, event_key: c.event_key })) }, null, 1).slice(0, 2500);
}

function momentBlock(wake, budget = MOMENT_BUDGET_CHARS) {
  const spot = wake.spotlight || {};
  const out = {
    spotlight: { modality: spot.modality, text: spot.text, event_key: spot.event_key, concept_tokens: spot.concept_tokens, salience: spot.S, components: spot.comps },
    bound_context: (wake.bound_context || []).map(c => ({ modality: c.modality, text: c.text, event_key: c.event_key })),
  };
  const render = () => JSON.stringify(out, null, 1);
  const whole = render();
  // the short-moment path — 17 of the live 19 — comes out BYTE-IDENTICAL to the legacy door
  if (whole.length <= budget) return whole;

  // the free-text slots: the only fields that can be long, and the only ones cuttable
  const slots = [];
  if (typeof out.spotlight.text === "string") slots.push({ own: out.spotlight, full: out.spotlight.text });
  for (const c of out.bound_context) if (typeof c.text === "string") slots.push({ own: c, full: c.text });
  if (!slots.length) return whole;   // nothing prose-shaped to trim → the skeleton rides whole, over budget or not

  const note = (kept, full) => `${kept} of ${full} chars — ${full - kept} DROPPED at the cortex door (moment budget ${budget}); you are holding a FRAGMENT of his paste, not the whole of it`;
  const apply = (keep) => slots.forEach((s, i) => {
    s.own.text = s.full.slice(0, keep[i]);
    if (keep[i] < s.full.length) s.own.text_truncated = note(keep[i], s.full.length); else delete s.own.text_truncated;
  });

  // skeleton cost = the envelope with every long text emptied but its absence-note in
  // place (the note is part of the structure, so it is paid for before the prose is)
  const keep = slots.map(() => 0);
  apply(keep);
  let pool = Math.max(0, budget - render().length);
  // water-filling: equal shares, and whoever needs less than its share returns the rest
  const order = slots.map((s, i) => i).sort((a, b) => slots[a].full.length - slots[b].full.length);
  let left = order.length;
  for (const i of order) {
    const share = Math.floor(pool / left);
    keep[i] = Math.min(slots[i].full.length, share);
    pool -= keep[i]; left--;
  }
  apply(keep);
  // the notes' own digits shift by a char or two once the real kept-lengths land; give the
  // overflow back from the biggest slot. Removing characters can never lengthen the JSON,
  // so this converges — and it stops when no slot has anything left to give, at which point
  // the SKELETON rides over budget on purpose. Structure over prose: a blind cut is the
  // defect being repaired here, never the fallback.
  for (let guard = 0; guard < 8; guard++) {
    const over = render().length - budget;
    if (over <= 0) break;
    const biggest = keep.indexOf(Math.max(...keep));
    if (keep[biggest] <= 0) break;
    keep[biggest] = Math.max(0, keep[biggest] - over);
    apply(keep);
  }
  return render();
}

function buildDeepPrompt(wake, bus = {}, extraSection = "") {
  const spot = wake.spotlight || {};
  const win = bus.current_window !== undefined ? bus.current_window : ambientWindow();
  const capsule = bus.capsule !== undefined ? bus.capsule : findCapsule(spot.concept_tokens);
  const twin = bus.twin !== undefined ? bus.twin : readJson(join(STATE_DIR, "twin.json"));
  const cal = bus.calibration !== undefined ? bus.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const ls = bus.learning_state !== undefined ? bus.learning_state : readJson(join(STATE_DIR, "learning_state.json"));
  // WIRING AUDIT (10 Aug 2026): the bus slice below sent `danger_topics` as bare names
  // (`.map(d => d.topic)`). calibration stamps every entry with its TRACK, and — concept track
  // only — the AXIS that keeps breaking (calibration.mjs:189-224). The deep brain got neither,
  // so it could not tell a Python skill miss from a concept miss and would answer a `pydantic`
  // danger with 9-axis concept teaching, the grammar GEMINI_LOOP.md §11.3 refuses on Python.
  // Both fields ride through VERBATIM — nothing computed here — and `track || "concept"` leaves
  // pre-25-Jul entries reading exactly as they did.
  return `You are THE BRIDGE — the deep brain of Arsenal AI FC, woken by the thalamus for the ~5% of moments that need real reasoning. Your captain is Nikhil (#14), ADHD-PI, training for an AI Product Engineer interview. The reflex brain already answered fast; you now give the PROFOUND read the moment deserves.

THE MOMENT (bound by the thalamus — the spotlight is why you were woken):
${momentBlock(wake)}

WHERE HE WAS (the ambient window stream — CORROBORATION ONLY. Never the question, never evidence, and never a reason to answer about the app instead of the moment. Judge it by its age: minutes_old says how old this reading is, and nothing here claims it is still true. truncated_at_door: true means the sensor cut this title and a word IS missing — read it as a fragment, never quote it back as a whole title; false means it arrived complete; null means the reading is older than the flag and nobody knows):
${JSON.stringify(win ? { window: win.text, concept: win.concept, minutes_old: win.age_min, truncated_at_door: win.door_cut === undefined ? null : win.door_cut }
  : { window: null, reason: `no context afferent in the last ${AMBIENT_TAIL_ROWS} afferent rows` }, null, 1)}

THE BUS SLICE (his real, live state — never invent beyond it):
${JSON.stringify({ twin_markets: ((twin || {}).markets || []).map(m => ({ id: m.id, p: m.p })), calibration_gap: (cal || {}).calibration_gap ?? null, danger_topics: ((cal || {}).danger_zone || []).slice(0, 5).map(d => ({ topic: d.topic, track: d.track || "concept", axis: d.axis || null })), learning_state_status: (ls || {}).status || null }, null, 1).slice(0, 1500)}
${capsuleSection(capsule, spot.concept_tokens)}${extraSection}
YOUR JOB: one deep, mechanism-level read. If it is a concept doubt: the real mechanism, a worked example, where it breaks, and the one reframe that dissolves HIS specific confusion. If it is a pattern/strategy moment: what is REALLY going on underneath, and the single next move that changes his next ten minutes. Think hard first; then answer.

THE LAWS (inviolable): speakable Gaffer voice, Hinglish welds welcome, ≤250 words. Honest frame only — never "10x", "exponential", "on steroids"; no shame, no streaks, no countdowns; never a number that is not in the data above; medical territory = one sentence, "show your doctor". A crack is data, never a verdict.`;
}

// ---------------------------------------------------------------------------
// THE CALL — claude -p, Max plan, extended thinking via MAX_THINKING_TOKENS
// ---------------------------------------------------------------------------
// LADDER G0 (9 Aug 2026): the lean flags brain.mjs proved 6 Aug (88.5% off a
// bare probe, 57.5% off real jobs — brain.mjs:867-880) ride the cortex too.
// Every wake was paying the full-CLI boot tax for a pure stdin→stdout
// transform. Prompt mirrored from brain's ORGAN_SYSTEM_PROMPT (one law, two
// engines); ARSENAL_CLAUDEGEN_FULL=1 reverts every non-brain engine at once.
// Spawned bare ("claude", no shell) — spaced args are safe here.
const CORTEX_LEAN = process.env.ARSENAL_CLAUDEGEN_FULL === "1" ? [] : [
  "--system-prompt",
  "You are a deterministic text transformer inside a personal accountability system. "
  + "Everything you need is in the prompt: data is embedded, never fetched. "
  + "Return ONLY what the prompt asks for — no preamble, no commentary, no apology, "
  + "and no markdown fences unless the prompt explicitly asks for them.",
  "--tools", "", "--strict-mcp-config",
];
function claudeDeep(prompt, cfg, deps = {}) {
  const exec = deps.exec || ((args, opts) => execFileSync("claude", args, opts));
  const t0 = Date.now();
  try {
    const raw = exec(["-p", "--output-format", "json", "--model", "opus", ...CORTEX_LEAN], {
      input: prompt, timeout: cfg.deep.timeout_ms, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
      env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens), ARSENAL_ORGAN: "1" },   // extended thinking
    });
    const j = JSON.parse(raw);
    const text = String(j.result || "");
    // G1 (9 Aug 2026): the cache pair joins the meter — in+out alone saw ~1.7%
    // of a CLI call's real spend (cache-blind rows are why the wake economy's
    // est_tokens_per_wake cannot be trusted until re-measured — G15).
    const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
    const cc = (j.usage && j.usage.cache_creation_input_tokens) || 0, cr = (j.usage && j.usage.cache_read_input_tokens) || 0;
    // E2E audit 25 Jul 2026: limit_hit was hardcoded `false` on every response the
    // CLI managed to serialise — but a Max plan-limit is NOT a thrown exception: the
    // CLI exits 0 with {is_error:true, result:"You've hit your session limit · resets
    // 7am"}. So the single most common failure of the whole $100 law was ledgered as
    // an ordinary error, the window never learned it was locked, and the wake burned
    // both its attempts inside the lockout. brain.mjs:507 has always read the
    // envelope (`isErr && LIMIT_RE.test(text)`); the cortex now reads it the same way.
    return { ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, cache_creation_tokens: cc, cache_read_tokens: cr, total_tokens: (inTok + outTok + cc + cr) || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: j.is_error === true && LIMIT_RE.test(text), error: j.is_error ? String(j.result).slice(0, 200) : null };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 200);
    return { ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: Math.ceil(prompt.length / 4), duration_ms: Date.now() - t0, limit_hit: /limit|overloaded|rate.?limit|resets \d/i.test(msg), error: msg };
  }
}

// M14 — the ASYNC deep call: same contract as claudeDeep (frozen above), but
// non-blocking so two wakes can think at once. execFile + manual stdin.
function claudeDeepAsync(prompt, cfg, deps = {}) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const fail = (msg) => resolve({ ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: Math.ceil(prompt.length / 4), duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200) });
    try {
      const execFn = deps.execAsync || execFile;
      const child = execFn("claude", ["-p", "--output-format", "json", "--model", "opus", ...CORTEX_LEAN], {   // G0 — same lean flags as the sync lane
        timeout: cfg.deep.timeout_ms, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens), ARSENAL_ORGAN: "1" },   // extended thinking
      }, (err, stdout) => {
        if (err && !stdout) return fail(String((err && err.message) || err));
        try {
          const j = JSON.parse(stdout);
          const text = String(j.result || "");
          const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
          const cc = (j.usage && j.usage.cache_creation_input_tokens) || 0, cr = (j.usage && j.usage.cache_read_input_tokens) || 0;   // G1
          // E2E audit 25 Jul 2026: same envelope blindness as claudeDeep above — the
          // async lane is the one the daemon actually uses, so THIS is where a plan
          // limit was being ledgered as limit_hit:false and killing queued wakes.
          resolve({ ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, cache_creation_tokens: cc, cache_read_tokens: cr, total_tokens: (inTok + outTok + cc + cr) || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: j.is_error === true && LIMIT_RE.test(text), error: j.is_error ? String(j.result).slice(0, 200) : null });
        } catch (e) { fail(String((e && e.message) || e)); }
      });
      if (child && child.stdin) { child.stdin.on("error", () => {}); child.stdin.write(prompt); child.stdin.end(); }
    } catch (e) { fail(String((e && e.message) || e)); }
  });
}

// ---------------------------------------------------------------------------
// SERVE — guard → budget → attempts → think → validate → report back.
// serveOne handles ONE wake; serveWake keeps the legacy single-slot contract
// verbatim; serveWakes (M14) drains the queue up to deep.concurrency at once.
// ---------------------------------------------------------------------------
// E2E audit 25 Jul 2026 — THE CONCURRENT-LANE OVERSHOOT. Every lane computed its
// headroom gate from the LEDGER, and the ledger only learns about a deep read
// AFTER it returns. With deep.concurrency lanes opening back-to-back (serveWakes'
// Promise.all, and the daemon's fire() loop), lane 2 read the same "allowed" that
// lane 1 had already committed to spend: two 48k-thinking reads could both clear a
// floor sized for ONE and land together inside his protected study reserve. This
// counter is the missing in-flight book: a lane reserves its estimated spend the
// instant it clears the gate and releases it when the call returns, so the next
// lane gates against what is REALLY left. Module-level on purpose — the daemon and
// serveWakes dispatch from different places into the same window.
let inflightReserve = 0;

// E2E audit 25 Jul 2026: the daemon's fire() re-entered itself from `.finally`, i.e.
// after EVERY lane outcome. When a serve did not actually close the wake (deep call
// failed, answer spooled because the thalamus was down, API-key refusal) the wake was
// still pending, so the immediate re-entry re-dispatched the same moment with zero
// delay — a tight loop that burned the 2-attempt cap, and real Opus tokens, in
// milliseconds. Re-enter ONLY when the thalamus has ACKNOWLEDGED a close (served /
// gave-up / declined, and the report-back itself got through): that is the only state
// in which the wake is guaranteed gone from the next queue read. Everything else waits
// for the 5s poll, which is the natural backoff.
const laneResolved = (r) => !!(r && (r.served || r.gave_up || r.declined) && r.reported !== false);

// E2E audit 25 Jul 2026: cortex_runtime.json's attempts map was append-only — no code
// path ever deleted a key, not on success, not on give-up, not on decline. Every
// moment_id ever woken lived there forever, and every single serve paid a full-file
// parse + rewrite of an ever-growing JSON. A moment that is no longer pending can
// never be served again, so its bookkeeping is dead weight: prune to the live queue.
// The unsent flags are pruned FIRST so a still-undelivered paid answer keeps its
// attempt row (it is the one thing that must survive a closed-looking queue).
function pruneRuntime(runtime, liveIds = []) {
  const live = new Set(liveIds);
  let removed = 0;
  if (runtime.unsent) for (const k of Object.keys(runtime.unsent)) if (!live.has(k)) { delete runtime.unsent[k]; removed++; }
  if (runtime.attempts) for (const k of Object.keys(runtime.attempts)) {
    if (!live.has(k) && !(runtime.unsent && runtime.unsent[k])) { delete runtime.attempts[k]; removed++; }
  }
  return removed;
}

async function serveOne(wake, deps = {}) {
  const cfg = deps.cfg || loadThalamusConfig();
  const brainCfg = deps.brainCfg || loadBrainConfig();
  const env = deps.env || process.env;
  const now = deps.now || new Date();
  const post = deps.post || defaultPost;
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const runtime = deps.runtime !== undefined ? deps.runtime : (readJson(RUNTIME) || { attempts: {} });
  const saveRuntime = deps.saveRuntime || ((o) => writeAtomic(RUNTIME, o));
  const log = deps.log || (() => {});

  // the $100 law — same refusal as brain.mjs
  if (brainCfg.guards && brainCfg.guards.refuse_if_api_key_env && env.ANTHROPIC_API_KEY) {
    log("cortex: ANTHROPIC_API_KEY set — REFUSING (Max plan only, never metered)");
    return { served: false, refused: true };
  }
  if (!wake || !wake.moment_id || wake.consumed || wake.status !== "pending") return { served: false, idle: true };

  // E2E audit 25 Jul 2026 — THE RE-BUY. The lifeboat below spools an answer whose
  // report-back failed, but ONLY the thalamus can close a queue row: with the
  // thalamus still down the wake is STILL pending, and the very next pass walked
  // straight back into a fresh Opus read of the same question — paying twice for one
  // thought, which is exactly what the lifeboat exists to prevent. A moment whose
  // answer is already bought and waiting on the wire is RE-DELIVERED (free), never
  // re-thought. This sits ahead of the attempts cap on purpose: a paid answer must
  // reach him even if the wake has otherwise run out of attempts.
  runtime.unsent = runtime.unsent || {};
  if (runtime.unsent[wake.moment_id]) {
    // WIRING AUDIT (11 Aug 2026) — THE PHANTOM DELIVERY. Delivery used to be inferred from
    // the ABSENCE of a held row, and drainUnsent returns held_ids:[] on an EMPTY spool — so
    // a spool that never received the write (the append below was wrapped in a bare `catch
    // {}`) read back as a clean handover. PROBED on the pre-repair file: pass 1 returned
    // spooled:true AFTER the spool threw; pass 2 returned served:true, redelivered:true,
    // reported:true with ZERO POSTs and the paid text nowhere. Nothing posted means the
    // thalamus never closes the wake, so the daemon re-fires and buys the same thought
    // again — precisely the re-buy this lifeboat exists to prevent, now wearing a success
    // log. DELIVERY IS POSITIVE EVIDENCE ONLY: this moment's id must come back in
    // delivered_ids from a POST that actually got through.
    // The pre-drain's receipt counts as that evidence too: serveWakes drains the spool
    // BEFORE dispatching, so on that path the row is legitimately gone by the time this
    // guard looks. Its delivered_ids now ride down in deps.preDrain — that result used to
    // be discarded, which is why absence had to be guessed at in the first place.
    const pre = deps.preDrain || {};
    const d = await drainUnsent({ ...deps, log });
    const stillHeld = (d.held_ids || []).includes(wake.moment_id);
    const delivered = (d.delivered_ids || []).includes(wake.moment_id) || (pre.delivered_ids || []).includes(wake.moment_id);
    if (!stillHeld) { delete runtime.unsent[wake.moment_id]; saveRuntime(runtime); }
    if (!stillHeld && !delivered) {
      // neither on the wire nor on disk: the paid text is GONE (a lost spool write, or the
      // file truncated under us). Say so — never report a close nobody made. The wake stays
      // pending and the attempts cap below governs the honest re-think.
      log(`cortex: ${wake.moment_id} was flagged ALREADY PAID FOR but the spool holds no such answer — the paid text is LOST, not delivered (flag cleared, wake stays pending, nothing reported)`);
      return { served: false, spool_lost: true, reported: false, moment_id: wake.moment_id };
    }
    log(`cortex: ${wake.moment_id} is ALREADY PAID FOR — ${stillHeld ? "thalamus still unreachable, holding the spooled answer" : "spooled answer delivered"} (no second Opus read)`);
    return { served: !stillHeld, redelivered: !stillHeld, reported: !stillHeld, moment_id: wake.moment_id };
  }

  // E2E audit 25 Jul 2026 — THE LOCKOUT HOLD. A plan-limit is the WINDOW's state, not
  // this wake's fault, and it lasts until the window resets. Without a hold the daemon
  // re-fired `claude -p` every 5s inside the lockout and each wake spent both its
  // attempts within seconds, so a 03:00 session limit permanently killed every queued
  // doubt as "gave-up-after-2-attempts" for reads that were never actually attempted.
  if (runtime.limit_hold_until && now < new Date(runtime.limit_hold_until)) {
    log(`cortex: plan-limit hold until ${runtime.limit_hold_until} — ${wake.moment_id} waits (no call, no attempt burned)`);
    return { served: false, limit_held: true };
  }

  // attempts cap — a poisoned wake never loops the window dry
  runtime.attempts = runtime.attempts || {};
  const tries = runtime.attempts[wake.moment_id] || 0;
  if (tries >= 2) {
    // E2E audit 25 Jul 2026: the report-back result is now carried out as `reported`
    // so the daemon only re-enters its dispatch loop on a close the thalamus actually
    // ACKNOWLEDGED — an unacknowledged decline leaves the wake pending, and re-firing
    // on it is the busy-loop (see laneResolved).
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "gave-up-after-2-attempts", provenance: "cortex" });
    return { served: false, gave_up: true, reported: !(s && s.ok === false) };
  }
  runtime.attempts[wake.moment_id] = tries + 1;
  saveRuntime(runtime);

  // second budget lock — the thalamus raised the bar; the cortex checks the vault.
  // P3 — thinking depth rides the moment (16k live / 48k overnight, capped to the
  // window) and the gate floor scales WITH it, so the deepest read never overshoots.
  const hr = deps.headroom || headroom(brainCfg, readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, now);
  const mtf = maxThinkingFor(hr.phase, hr.allowed);
  // the decline floor must cover the FULL call (input context + thinking + output), NOT just
  // 1.6x thinking — so NEVER drop below the config's conservative flat floor; only ever RAISE
  // it for the deep overnight reads (where think*1.6 overtakes it). Guards against a low-band
  // read firing with too little headroom and overshooting into his protected study/live reserve.
  const minHeadroom = Math.max((cfg.deep && cfg.deep.min_headroom_tokens) || 50000, mtf.min_headroom_tokens);
  const deepCfg = { ...cfg, deep: { ...cfg.deep, max_thinking_tokens: mtf.max_thinking_tokens, min_headroom_tokens: minHeadroom } };
  const call = deps.call || ((prompt) => claudeDeepAsync(prompt, deepCfg));
  // E2E audit 25 Jul 2026: gate against what is left AFTER the lanes already in flight
  // (see inflightReserve above) — the ledger cannot see a read that has not returned yet.
  const est = Math.max(0, (cfg.deep && cfg.deep.est_tokens_per_wake) || 40000);
  const freeNow = hr.allowed - inflightReserve;
  if (freeNow < deepCfg.deep.min_headroom_tokens) {
    log(`cortex: window too low (${freeNow}${inflightReserve ? ` = ${hr.allowed} - ${inflightReserve} in flight` : ""} < ${deepCfg.deep.min_headroom_tokens}) — declining, not draining`);
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "no-headroom", provenance: "cortex" });
    return { served: false, declined: "no-headroom", reported: !(s && s.ok === false) };
  }

  // M8 — THE COUNCIL sits first (three free adversarial drafts), then ONE
  // Opus integration adjudicates. Council dry/failed → the old cold path.
  let council = null, r;
  // WIRING AUDIT (11 Aug 2026) — THE DRY COUNCIL LEFT NO TRACE. convene() has
  // always returned a `note` when every chair came back empty ("every chair
  // empty (pool dry/late) — the Bridge proceeds cold", council.mjs:457) and
  // NOTHING ever read it: councilSection() renders drafts/split/cross_split
  // only, and this block dropped the object on the floor once the prompt was
  // built. So a sitting where all three free chairs AND the cross-examiner came
  // back empty left evidence IDENTICAL to a healthy four-chair council — one
  // cortex_wake row, no log line, no field anywhere — and an Opus read that ran
  // cold could never be told apart afterwards from one that had breadth. The
  // inner `catch {}` made it worse: "council off", "convene threw" and "chairs
  // sat and brought nothing" were one indistinguishable silence.
  // The census rides the LOG (the daemon's lane, line ~1574 passes console.log)
  // and the cortex_wake ledger row, which is the durable record of the sitting.
  // The PROMPT is deliberately UNTOUCHED — a dry council must stay the
  // byte-identical cold path (selftest: "council dry → the old cold path,
  // byte-identical shape (layering)"). Recording an absence must not become
  // buying context for it.
  let councilNote = null, councilSeats = null;
  inflightReserve += est;                       // the lane is committed from here
  try {
    if (deps.council !== undefined) council = deps.council;
    else if (cfg.council === false) councilNote = "council off (thalamus_config.council=false)";
    else {
      try { council = await convene(String((wake.spotlight || {}).text || (wake.spotlight || {}).event_key || ""), {}); }
      catch (e) { council = null; councilNote = `convene threw: ${String((e && e.message) || e).slice(0, 160)}`; }
    }
    // convene's own word rides VERBATIM when it gave one — this file never
    // re-phrases another organ's honest note (same rule as the capsule prose).
    if (!councilNote && council && council.note) councilNote = council.note;
    // `null`, never 0, when no council object came back at all: an UNMEASURED
    // bench written down as a measured zero is the exact lie the `?? null` law
    // in council.mjs's councilLedgerRow forbids one file over. 0 means chairs
    // actually sat and every one of them came back empty.
    councilSeats = council && Array.isArray(council.drafts) ? council.drafts.length : null;
    if (!councilSeats) log(`cortex: THE COUNCIL BROUGHT NOTHING for ${wake.moment_id} — the Bridge proceeds cold${councilNote ? ` (${councilNote})` : ""}`);
    const prompt = buildDeepPrompt(wake, deps.bus || {}, councilSection(council));
    r = await call(prompt);
  } finally { inflightReserve = Math.max(0, inflightReserve - est); }
  // G1 — the cache pair rides; G15's re-fit reads ONLY rows that carry it.
  // council_seats / council_note added 11 Aug 2026 (wiring audit, above): the
  // row is the only durable record of a sitting, so it must say what breadth
  // the Opus read was actually given. Purely additive — every reader of this
  // lane keys off `job`/`total_tokens`/the cache pair (watchman.mjs:890's
  // honest-row filter, brain.mjs windowUsage) and none of them enumerate fields.
  ledger({ ts: new Date().toISOString(), job: "cortex_wake", engine: "claude", model: "opus", input_tokens: r.input_tokens, output_tokens: r.output_tokens, cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null, total_tokens: r.total_tokens, duration_ms: r.duration_ms, ok: r.ok, error: r.error, limit_hit: r.limit_hit, council_seats: councilSeats, council_note: councilNote || null });
  if (!r.ok) {
    if (r.limit_hit) {
      // E2E audit 25 Jul 2026: give the attempt BACK and hold the lane. A read that the
      // plan refused to even start must not count against the poison-guard's 2-attempt
      // cap — otherwise one locked window silently kills the whole night's queue. With
      // the attempt refunded the TTL (expired-in-queue), not the lockout, decides.
      runtime.attempts[wake.moment_id] = tries;
      const holdMin = (cfg.deep && cfg.deep.limit_backoff_min) || 15;
      runtime.limit_hold_until = new Date(now.getTime() + holdMin * 60000).toISOString();
      saveRuntime(runtime);
      log(`cortex: PLAN LIMIT (${r.error}) — attempt refunded, lane held ${holdMin}min (until ${runtime.limit_hold_until})`);
      return { served: false, error: r.error, limit_hit: true };
    }
    log(`cortex: deep call failed (${r.error}) — wake stays pending (attempt ${tries + 1}/2)`);
    return { served: false, error: r.error };
  }

  // honest-frame validator — a law-breaking answer is DECLINED, never softened
  const banned = bannedPhraseCheck(r.text, (brainCfg.guards && brainCfg.guards.banned_phrases) || []);
  if (banned.length) {
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: `banned-phrase:${banned.join(",")}`, provenance: "cortex" });
    return { served: false, declined: "banned-phrase", reported: !(s && s.ok === false) };
  }
  const payload = { moment_id: wake.moment_id, text: r.text, provenance: "opus-extended", tokens: r.total_tokens };
  const sent = await post("/deep-answer", payload);
  if (sent && sent.ok === false) {
    // the answer is BOUGHT AND GOOD — the wire failed, not the thought. Spool it.
    // WIRING AUDIT (11 Aug 2026): this catch was BARE. A failed append (a Windows file
    // lock on cortex_unsent.jsonl, a full or read-only disk) vanished without a word, and
    // the unsent flag below — whose entire meaning is "a paid answer is ON DISK, waiting"
    // — was written anyway. The next pass then found an empty spool and read that empty
    // file as a delivery (see the phantom-delivery guard at the top of serveOne). The
    // write either LANDS or it is NAMED; the flag rides only on a spool that took the text.
    let spoolErr = null;
    try { (deps.spool || spoolUnsent)(payload); } catch (e) { spoolErr = String((e && e.message) || e).slice(0, 160); }
    if (spoolErr) {
      log(`cortex: deep answer for ${wake.moment_id} could NOT be reported (${sent.error}) AND the spool write FAILED (${spoolErr}) — the paid text is LOST; no paid-and-waiting flag is set (attempt ${tries + 1}/2, wake stays pending)`);
      return { served: false, spooled: false, spool_failed: spoolErr, moment_id: wake.moment_id, error: sent.error };
    }
    // E2E audit 25 Jul 2026: remember, in the runtime, that this moment is ALREADY PAID
    // FOR. The wake stays pending (only the thalamus closes rows), so without this flag
    // the next pass re-read the same question on Opus — the spool saved the text but not
    // the money. The re-buy guard at the top of serveOne reads exactly this.
    runtime.unsent[wake.moment_id] = (now instanceof Date ? now : new Date()).toISOString();
    saveRuntime(runtime);
    log(`cortex: deep answer for ${wake.moment_id} could NOT be reported (${sent.error}) — SPOOLED to cortex_unsent.jsonl, will deliver on the next pass (never re-bought)`);
    return { served: false, spooled: true, moment_id: wake.moment_id, error: sent.error };
  }
  log(`cortex: deep answer served for ${wake.moment_id} (${r.total_tokens} tok, ${Math.round(r.duration_ms / 1000)}s)`);
  return { served: true, moment_id: wake.moment_id, tokens: r.total_tokens, reported: true };
}

// ── THE PAID-ANSWER LIFEBOAT (E2E audit 25 Jul 2026) ────────────────────────
// A deep answer costs real Opus tokens. If the report-back POST fails, the text
// is spooled here and re-delivered on the next serve pass, so a thalamus restart
// costs a few seconds of latency instead of the answer plus a second purchase.
function spoolUnsent(payload) {
  mkdirSync(dirname(UNSENT), { recursive: true });
  appendFileSync(UNSENT, JSON.stringify({ ...payload, spooled_at: new Date().toISOString() }) + "\n");
}
async function drainUnsent(deps = {}) {
  const post = deps.post || defaultPost;
  const rows = deps.readUnsent ? deps.readUnsent() : readLines(UNSENT);
  // E2E audit 25 Jul 2026: held_ids added so serveOne's re-buy guard can tell whether
  // THIS moment's paid answer got through, rather than guessing from a global count.
  // WIRING AUDIT (11 Aug 2026): held_ids alone could only ever answer "is it STILL held",
  // and its empty-file early return answers that with "no" for a spool that never held the
  // row at all — which the guard read as a delivery. delivered_ids is the positive half:
  // an id lands there only after a POST for that exact row came back not-failed. The two
  // together let a caller tell handed-over from never-arrived from still-waiting.
  if (!rows.length) return { delivered: 0, still_held: 0, held_ids: [], delivered_ids: [] };
  const held = [], deliveredIds = [];
  for (const row of rows) {
    const { spooled_at, ...payload } = row;
    const r = await post("/deep-answer", payload);
    if (r && r.ok === false) held.push(row); else deliveredIds.push(row && row.moment_id);
  }
  const delivered = deliveredIds.length;
  const write = deps.writeUnsent || ((lines) => { if (lines.length) writeFileSync(UNSENT, lines.map(l => JSON.stringify(l)).join("\n") + "\n"); else if (existsSync(UNSENT)) writeFileSync(UNSENT, ""); });
  write(held);
  // E2E audit 25 Jul 2026: this said `(deps.log || log)` — there is no module-level
  // `log`, so the ONE line that fires on a successful recovery threw a ReferenceError.
  // serveWakes swallows it in its try/catch, but the daemon's re-buy guard now calls
  // drainUnsent on every held moment, so the throw would have masked the recovery.
  if (delivered) (deps.log || (() => {}))(`cortex: delivered ${delivered} spooled deep answer(s) that would otherwise have been lost`);
  return { delivered, still_held: held.length, held_ids: held.map(h => h && h.moment_id).filter(Boolean), delivered_ids: deliveredIds.filter(Boolean) };
}

// the legacy single-slot contract, byte-compatible (layering — never replace)
async function serveWake(deps = {}) {
  const wake = (deps.readWake || (() => readJson(WAKE)))();
  return serveOne(wake, deps);
}

// M14 — THE OVERLAP: drain the queue, up to deep.concurrency wakes AT ONCE.
// Queue empty → the single-slot wake.json fallback (a pre-queue thalamus
// still gets served). Stale wakes are DECLINED as expired-in-queue.
async function serveWakes(deps = {}) {
  const cfg = deps.cfg || loadThalamusConfig();
  const now = deps.now || new Date();
  const post = deps.post || defaultPost;
  // deliver anything a previous pass paid for but could not hand over.
  // WIRING AUDIT (11 Aug 2026): this drain's RECEIPT used to be discarded — a producer
  // whose only consumer threw the result away. serveOne's re-buy guard therefore had no
  // way to tell "the pre-drain, seconds ago, already handed this answer over" from "the
  // spool never held it", so it inferred delivery from an empty file (the phantom
  // delivery). The receipt now rides down to the guard as deps.preDrain.
  let preDrain = deps.preDrain || null;
  if (deps.drain !== false) { try { preDrain = await drainUnsent(deps); } catch { } }
  const rows = deps.readQueue ? deps.readQueue() : readLines(WQUEUE);
  let pending = pendingWakes(rows);
  if (!pending.length) {
    const wake = (deps.readWake || (() => readJson(WAKE)))();
    if (wake && wake.moment_id && !wake.consumed && wake.status === "pending") pending = [wake];
  }
  if (!pending.length) return { served: 0, idle: true };
  const ttlMs = ((cfg.deep && cfg.deep.queue_ttl_min) || 30) * 60000;
  const live = [];
  let expired = 0;
  for (const w of pending) {
    if (w.ts && now - new Date(w.ts) > ttlMs) {
      expired++;
      await post("/deep-answer", { moment_id: w.moment_id, declined: true, reason: "expired-in-queue", provenance: "cortex" });
    } else live.push(w);
  }
  if (!live.length) return { served: 0, expired, idle: true };
  const k = Math.max(1, (cfg.deep && cfg.deep.concurrency) || 2);
  const batch = live.slice(0, k);
  // ONE shared runtime object across the batch — concurrent saves merge instead
  // of last-write-wins clobbering the poison-guard's attempt counts
  const runtime = deps.runtime !== undefined ? deps.runtime : (readJson(RUNTIME) || { attempts: {} });
  // E2E audit 25 Jul 2026: prune the dead bookkeeping BEFORE the batch writes it back,
  // so cortex_runtime.json stays the size of the live queue instead of the size of his
  // whole history (see pruneRuntime). Pending — not `live` — is the survival set: a
  // wake awaiting its expiry decline still owns its attempt row.
  if (pruneRuntime(runtime, pending.map(w => w.moment_id))) (deps.saveRuntime || ((o) => writeAtomic(RUNTIME, o)))(runtime);
  const results = await Promise.all(batch.map(w => serveOne(w, { ...deps, cfg, now, post, runtime, preDrain })));
  return { served: results.filter(r => r.served).length, results, expired, queued: live.length - batch.length };
}

// ---------------------------------------------------------------------------
// selftest — guards, prompt, ledger shape, report-back contract; no network
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const wake = { moment_id: "m_1", status: "pending", spotlight: { modality: "voice", text: "i don't get attention scaling", concept_tokens: ["attention"], S: 0.7, comps: { self: 1 } }, bound_context: [{ modality: "vision", event_key: "frame" }] };
  // `current_window` is INJECTED here for the same reason every other bus slot is: without
  // it buildDeepPrompt would fall through to the live ambient read and the suite's verdict
  // would depend on whichever window the captain happened to have open (the FIXTURE law —
  // context.mjs's FIXTURE registry, presence.mjs's FIXTURE_BUCKETS).
  const bus = { capsule: null, twin: { markets: [{ id: "session_happened", p: 0.5 }] }, calibration: { calibration_gap: 0.12, danger_zone: [{ topic: "eval metrics" }] }, learning_state: { status: "ok" }, current_window: { text: "chrome.exe · Attention Is All You Need", concept: "attention", age_min: 3 } };
  const brainCfg = { guards: { refuse_if_api_key_env: true, banned_phrases: ["10x", "exponential", "on steroids"] }, budget: {} };
  // E2E audit 25 Jul 2026: the suite used to build its cfg with loadThalamusConfig(),
  // i.e. it read the LIVE, approval-gated dressing-room/state/thalamus_config.json —
  // and several checks silently depended on its values (the overlap check needs
  // deep.concurrency === 2, the expiry check needs queue_ttl_min < 120). Halving
  // concurrency to calm the window — a documented, supported knob — turned the suite
  // red for a regression that did not exist. Every other dep here is injected; the
  // config is a frozen fixture now too, mirroring thalamus.mjs's DEFAULT_CONFIG.deep.
  const CFG_FIX = Object.freeze({
    council: false,   // the live council never convenes inside a selftest
    deep: Object.freeze({ deadline_ms: 45000, min_headroom_tokens: 50000, max_thinking_tokens: 16000, timeout_ms: 300000, concurrency: 2, est_tokens_per_wake: 40000, queue_ttl_min: 30, limit_backoff_min: 15 }),
  });
  const mkDeps = (over = {}) => {
    const out = { posts: [], rows: [], runtime: { attempts: {} }, saved: [] };
    return {
      out,
      deps: {
        cfg: CFG_FIX, brainCfg, env: {}, readWake: () => wake, bus,
        council: null,                               // hermetic — the live council never convenes inside a selftest
        post: async (p, b) => { out.posts.push({ p, b }); return { ok: true }; },
        appendLedger: (r) => out.rows.push(r),
        runtime: over.runtime || { attempts: {} }, saveRuntime: (o) => out.saved.push(JSON.parse(JSON.stringify(o))),
        headroom: over.headroom || { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
        call: over.call || (() => ({ ok: true, text: "Attention scales quadratically kyunki har token har token se milta hai — n tokens, n² handshakes.", input_tokens: 1200, output_tokens: 240, total_tokens: 1440, duration_ms: 9000, limit_hit: false, error: null })),
        ...over.deps,
      },
    };
  };

  // the $100 law
  {
    const { deps } = mkDeps({ deps: { env: { ANTHROPIC_API_KEY: "sk-nope" } } });
    const r = await serveWake(deps);
    assert("ANTHROPIC_API_KEY set → REFUSES before anything runs", r.refused === true);
  }
  // the happy arc
  {
    const { deps, out } = mkDeps({});
    const r = await serveWake(deps);
    assert("pending wake → deep answer POSTed back to :4113 (never a file write)", r.served && out.posts.length === 1 && out.posts[0].p === "/deep-answer" && out.posts[0].b.text.includes("n²"));
    assert("provenance says opus-extended", out.posts[0].b.provenance === "opus-extended");
    const row = out.rows[0];
    assert("ledger row is brain-shaped (engine claude — the window SEES the spend)", row.job === "cortex_wake" && row.engine === "claude" && row.model === "opus" && row.total_tokens === 1440 && row.ok === true && "limit_hit" in row);
    assert("attempts recorded (poisoned wakes can't loop)", out.saved[0].attempts.m_1 === 1);
  }
  // budget lock
  {
    const { deps, out } = mkDeps({ headroom: { allowed: 10000, used: 790000, cap: 800000, phase: "study" } });
    const r = await serveWake(deps);
    assert("window under the floor → DECLINES (reported, never dangling)", r.declined === "no-headroom" && out.posts[0].b.declined === true && out.posts[0].b.reason === "no-headroom");
    assert("a declined wake spends ZERO Opus tokens", out.rows.length === 0);
  }
  // give-up cap
  {
    const { deps, out } = mkDeps({ runtime: { attempts: { m_1: 2 } } });
    const r = await serveWake(deps);
    assert("two failed attempts → gives up loudly (declined, reason named)", r.gave_up === true && out.posts[0].b.reason === "gave-up-after-2-attempts");
  }
  // honest-frame validator
  {
    const { deps, out } = mkDeps({ call: () => ({ ok: true, text: "This will 10x your learning, exponential gains!", input_tokens: 10, output_tokens: 10, total_tokens: 20, duration_ms: 100, limit_hit: false, error: null }) });
    const r = await serveWake(deps);
    assert("banned-phrase answer is DECLINED, never softened or served", r.declined === "banned-phrase" && out.posts[0].b.declined === true && out.posts[0].b.reason.includes("10x"));
  }
  // failed call leaves the wake pending
  {
    const { deps, out } = mkDeps({ call: () => ({ ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: 500, duration_ms: 100, limit_hit: true, error: "rate limit" }) });
    const r = await serveWake(deps);
    assert("failed call → NO post (wake stays pending for retry), ledger records limit", !r.served && out.posts.length === 0 && out.rows[0].limit_hit === true);
    // E2E audit 25 Jul 2026 — THE LOCKOUT. A plan limit used to be charged to the WAKE:
    // the attempt stayed spent, so two failures inside one locked window killed the
    // doubt as "gave-up-after-2-attempts" for reads Opus never even started.
    const refund = out.saved[1] || {};
    assert("PLAN LIMIT: the burnt attempt is given BACK (a locked window must not kill the wake)", out.saved.length === 2 && out.saved[0].attempts.m_1 === 1 && (refund.attempts || {}).m_1 === 0);
    assert("PLAN LIMIT: the lane is HELD until the window can pay again (no 5s hammering)", typeof refund.limit_hold_until === "string" && new Date(refund.limit_hold_until) > new Date());
  }
  // ...and while that hold stands, a wake waits instead of spending
  {
    let called = 0;
    const { deps, out } = mkDeps({
      runtime: { attempts: {}, limit_hold_until: new Date(Date.now() + 60000).toISOString() },
      call: () => { called++; return { ok: true, text: "should never be bought during a lockout", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; },
    });
    const r = await serveWake(deps);
    assert("PLAN LIMIT: while the hold stands the wake waits — zero Opus calls, zero ledger rows, zero posts", r.limit_held === true && called === 0 && out.rows.length === 0 && out.posts.length === 0);
  }
  // the CLI's plan-limit envelope: exit 0, is_error:true, limit text in `result`
  {
    const tinyCfg = { deep: { timeout_ms: 1000, max_thinking_tokens: 1000 } };
    const limitJson = JSON.stringify({ is_error: true, result: "You've hit your session limit · resets 7am" });
    const rl = claudeDeep("p", tinyCfg, { exec: () => limitJson });
    assert("ENVELOPE: a plan limit reported as exit-0 JSON is read as limit_hit (sync lane)", rl.ok === false && rl.limit_hit === true);
    const rh = claudeDeep("p", tinyCfg, { exec: () => JSON.stringify({ result: "a real deep read", usage: { input_tokens: 5, output_tokens: 5 } }) });
    assert("ENVELOPE: a healthy answer is never mislabelled a limit", rh.ok === true && rh.limit_hit === false);
    const ra = await claudeDeepAsync("p", tinyCfg, { execAsync: (_f, _a, _o, cb) => { cb(null, JSON.stringify({ is_error: true, result: "5-hour limit reached · resets 3am" })); return null; } });
    assert("ENVELOPE: the ASYNC lane (the one the daemon uses) reads it too", ra.ok === false && ra.limit_hit === true);
  }
  // consumed / absent wakes are idle
  {
    const { deps } = mkDeps({ deps: { readWake: () => ({ consumed: { moment_id: "m_0" } }) } });
    assert("consumed wake → idle (consumed-on-success honored)", (await serveWake(deps)).idle === true);
    const { deps: d2 } = mkDeps({ deps: { readWake: () => null } });
    assert("no wake file → idle, never crashes", (await serveWake(d2)).idle === true);
  }
  // M8 — the Council sits before the deep call
  {
    const councilFix = { drafts: [{ seat: "steelman", text: "the cache saves recompute" }, { seat: "prosecutor", text: "memory vs compute conflation" }], disagreement: 0.9, split: true };
    let seenPrompt = null;
    const { deps } = mkDeps({ deps: { council: councilFix }, call: undefined });
    deps.call = (p) => { seenPrompt = p; return { ok: true, text: "integrated read", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
    await serveWake(deps);
    assert("COUNCIL: three drafts ride the ONE Opus integration prompt", seenPrompt.includes("[STEELMAN]") && seenPrompt.includes("[PROSECUTOR]") && seenPrompt.includes("integrate, don't average"));
    assert("a hard split is surfaced to the deep brain as the crux", seenPrompt.includes("SPLIT HARD"));
    const { deps: dCold } = mkDeps({ deps: { council: null } });
    let coldPrompt = null;
    dCold.call = (p) => { coldPrompt = p; return { ok: true, text: "cold read", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
    await serveWake(dCold);
    assert("council dry → the old cold path, byte-identical shape (layering)", coldPrompt && !coldPrompt.includes("[STEELMAN]") && coldPrompt.includes("YOUR JOB"));
    // WIRING AUDIT (11 Aug 2026) — THE DRY COUNCIL'S TRACE. convene() returns a
    // `note` when every chair came back empty; until today nothing read it, so a
    // cold Bridge and a four-chair one left the same evidence. These three guard
    // the wire end-to-end: the note reaches the ledger VERBATIM, it reaches the
    // log, and a healthy sitting is still recorded as healthy (a note that fires
    // always is the same blindness wearing the opposite mask).
    {
      const dryFix = { drafts: [], disagreement: 0, note: "every chair empty (pool dry/late) — the Bridge proceeds cold" };
      const lines = [];
      const { deps: dDry, out: oDry } = mkDeps({ deps: { council: dryFix, log: (s) => lines.push(s) } });
      let dryPrompt = null;
      dDry.call = (p) => { dryPrompt = p; return { ok: true, text: "cold read", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
      await serveWake(dDry);
      assert("DRY COUNCIL: convene's note reaches the cortex_wake ledger row VERBATIM (seats 0, never null)",
        oDry.rows[0].council_note === dryFix.note && oDry.rows[0].council_seats === 0);
      assert("DRY COUNCIL: the cold Bridge says so in the log, and the prompt is STILL the untouched cold path",
        lines.some((l) => l.includes("THE COUNCIL BROUGHT NOTHING") && l.includes("proceeds cold")) && dryPrompt && !dryPrompt.includes("THE COUNCIL SAT FIRST"));
      const { deps: dOk, out: oOk } = mkDeps({ deps: { council: councilFix } });
      await serveWake(dOk);
      assert("HEALTHY COUNCIL: the same row records the bench that actually sat (2 seats, no note)",
        oOk.rows[0].council_seats === 2 && oOk.rows[0].council_note === null);
      // WIRING AUDIT (11 Aug 2026, second pass) — AND SOMEONE READS IT. The three
      // assertions above only prove the row is WRITTEN; a tracing pass this morning
      // found the pair read by nothing in the repo, which is the same blindness with
      // an extra step. The reader is brain.mjs's ledgerShiftSummary().council — the
      // DIARY's own ledger input — and this runs THE REAL ROWS produced above through
      // it, so the wire goes red from THIS end if the consumer is ever deleted or
      // stops counting. Only `ts` is rewritten (the rows carry a live clock; the
      // summary is shift-windowed) — every census field rides verbatim.
      {
        const { mkdtempSync, rmSync } = await import("node:fs");
        const oss = await import("node:os");
        const wd = mkdtempSync(join(oss.tmpdir(), "cortex-council-wire-"));
        writeFileSync(join(wd, "brain_ledger.jsonl"),
          [{ ...oDry.rows[0], ts: "2026-07-12T23:10:00+05:30" },
           { ...oOk.rows[0], ts: "2026-07-13T00:10:00+05:30" }]
            .map((r) => JSON.stringify(r)).join("\n") + "\n");
        const cs = ledgerShiftSummary("2026-07-12", wd).council;
        assert("BENCH CENSUS IS CONSUMED: brain.mjs ledgerShiftSummary().council reads THESE rows back — 1 cold, 1 benched, convene's note verbatim",
          !!cs && cs.reads === 2 && cs.cold === 1 && cs.with_bench === 1 && cs.seats === 2
          && cs.unmeasured === 0 && cs.notes[dryFix.note] === 1);
        rmSync(wd, { recursive: true, force: true });
      }
    }
  }

  // THE PAID-ANSWER LIFEBOAT (E2E audit 25 Jul 2026) — a report-back failure must
  // never destroy an answer the captain already paid Opus for. Before the fix the
  // unguarded fetch THREW here: the text was dropped, the wake stayed pending, and
  // the same question was bought a second time.
  {
    const spooled = [];
    const { deps } = mkDeps({});
    deps.call = () => ({ ok: true, text: "the expensive read", input_tokens: 10, output_tokens: 90, total_tokens: 100, duration_ms: 5, limit_hit: false, error: null });
    deps.post = async () => ({ ok: false, error: "connect ECONNREFUSED 127.0.0.1:4113" });
    deps.spool = (p) => spooled.push(p);
    const out = await serveWake(deps);
    assert("THALAMUS DOWN: serving does not throw and reports honestly", out && out.served === false && out.spooled === true);
    assert("THALAMUS DOWN: the paid answer is SPOOLED verbatim, never lost", spooled.length === 1 && spooled[0].text === "the expensive read" && spooled[0].tokens === 100);
    // and it is delivered on the next pass, without re-buying it
    const held = spooled.map(p => ({ ...p, spooled_at: "2026-07-25T00:00:00.000Z" }));
    const sent = []; let written = null;
    const drained = await drainUnsent({
      post: async (path, body) => { sent.push(body); return { ok: true }; },
      readUnsent: () => held, writeUnsent: (l) => { written = l; }, log: () => {},
    });
    assert("RECOVERY: the spooled answer is delivered on the next pass", drained.delivered === 1 && sent.length === 1 && sent[0].text === "the expensive read");
    assert("RECOVERY: the spool is emptied once delivered (never replayed forever)", Array.isArray(written) && written.length === 0);
    // E2E audit 25 Jul 2026 — THE RE-BUY. The spool saved the TEXT but not the MONEY:
    // only the thalamus can close a queue row, so the wake was still pending and the
    // very next pass walked back into a fresh Opus read of the same doubt.
    let bought = 0;
    deps.call = () => { bought++; return { ok: true, text: "a SECOND paid read of the same doubt", input_tokens: 10, output_tokens: 90, total_tokens: 100, duration_ms: 5, limit_hit: false, error: null }; };
    const redeliver = [];
    deps.post = async (p, b) => { redeliver.push(b); return { ok: true }; };
    deps.readUnsent = () => spooled.map(p => ({ ...p, spooled_at: "2026-07-25T00:00:00.000Z" }));
    deps.writeUnsent = () => {};
    const second = await serveWake(deps);
    assert("NO RE-BUY: the still-pending wake is re-DELIVERED from the spool, Opus is never called twice", second.redelivered === true && bought === 0 && redeliver.length === 1 && redeliver[0].text === "the expensive read");
  }

  // ── WIRING AUDIT (11 Aug 2026) · THE PHANTOM DELIVERY ──────────────────────
  // The lifeboat's own hole, and the reason these three are here: a failed spool
  // write was swallowed by a bare `catch {}`, and drainUnsent's empty-file early
  // return was then read as proof the paid answer had been handed over. PROBED on
  // the pre-repair file: pass 1 returned spooled:true AFTER the spool threw; pass 2
  // returned served:true, redelivered:true, reported:true with ZERO POSTs and the
  // text nowhere. Nothing posted = the thalamus never closes the wake = the daemon
  // re-fires and buys the same thought again, wearing a success log.
  {
    // (a) the spool write itself fails → NAMED, and never flagged paid-and-waiting
    const { deps, out } = mkDeps({});
    deps.call = () => ({ ok: true, text: "the expensive read", input_tokens: 10, output_tokens: 90, total_tokens: 100, duration_ms: 5, limit_hit: false, error: null });
    deps.post = async () => ({ ok: false, error: "connect ECONNREFUSED 127.0.0.1:4113" });
    deps.spool = () => { throw new Error("EPERM: cortex_unsent.jsonl busy"); };
    const rFail = await serveWake(deps);
    assert("#wire: a FAILED spool write is never silent, and never sets the paid-and-waiting flag",
      rFail.served === false && rFail.spooled === false && /EPERM/.test(rFail.spool_failed || "")
      && !out.saved.some(s => s.unsent && s.unsent.m_1));

    // (b) the flag is set but the spool holds NOTHING → the answer is LOST, never
    // "delivered": no served, no reported close, no second Opus read claimed either way
    let bought = 0;
    const { deps: dLost, out: oLost } = mkDeps({ runtime: { attempts: { m_1: 1 }, unsent: { m_1: "2026-08-11T00:00:00.000Z" } } });
    dLost.call = () => { bought++; return { ok: true, text: "a SECOND paid read of the same doubt", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
    dLost.readUnsent = () => [];          // the append never landed — the spool is empty
    dLost.writeUnsent = () => {};
    const rLost = await serveWake(dLost);
    assert("#wire: an EMPTY spool is NEVER read as a delivery — reported LOST, nothing served, nothing closed",
      rLost.served === false && rLost.spool_lost === true && rLost.reported === false
      && oLost.posts.length === 0 && bought === 0 && laneResolved(rLost) === false);

    // (c) the receipt that makes (b) safe: serveWakes drains the spool BEFORE dispatch,
    // so on that path the row is legitimately gone by the time the guard looks. Its
    // delivered_ids must REACH serveOne, or a real handover reads as the loss in (b).
    const spoolRow = { moment_id: "m_p", text: "the expensive read", provenance: "opus-extended", tokens: 100, spooled_at: "2026-08-11T00:00:00.000Z" };
    let reads = 0, boughtP = 0;
    const postsP = [];
    const rPre = await serveWakes({
      cfg: CFG_FIX, brainCfg, env: {}, now: new Date("2026-07-15T03:00:00Z"), council: null, bus,
      readQueue: () => [{ moment_id: "m_p", ts: "2026-07-15T02:59:00Z", status: "pending", spotlight: { modality: "voice", text: "doubt", concept_tokens: [], S: 0.7, comps: {} }, bound_context: [] }],
      readWake: () => null,
      runtime: { attempts: { m_p: 1 }, unsent: { m_p: "2026-08-11T00:00:00.000Z" } }, saveRuntime: () => {},
      headroom: { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
      appendLedger: () => {},
      call: () => { boughtP++; return { ok: true, text: "a SECOND paid read of the same doubt", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; },
      post: async (p, b) => { postsP.push(b); return { ok: true }; },
      readUnsent: () => (reads++ === 0 ? [spoolRow] : []),   // the pre-drain empties it
      writeUnsent: () => {},
    });
    assert("#wire: the PRE-DRAIN's receipt reaches the re-buy guard — a real handover is served, not mourned as lost",
      rPre.served === 1 && postsP.length === 1 && postsP[0].text === "the expensive read"
      && boughtP === 0 && rPre.results[0].redelivered === true);
  }

  // M14 — THE OVERLAP: the queue serves TWO at once; expiry declines; legacy floor
  {
    const mkWake = (id, ts) => ({ moment_id: id, ts, status: "pending", spotlight: { modality: "voice", text: `doubt ${id}`, concept_tokens: [id], S: 0.7, comps: { self: 1 } }, bound_context: [] });
    const nowT = new Date("2026-07-15T03:00:00Z");
    const qRows = [
      mkWake("m_a", "2026-07-15T02:58:00Z"),
      mkWake("m_b", "2026-07-15T02:59:00Z"),
    ];
    let inflight = 0, peak = 0;
    const out = { posts: [], rows: [] };
    const slowCall = async () => {
      inflight++; peak = Math.max(peak, inflight);
      await new Promise(res => setTimeout(res, 25));
      inflight--;
      return { ok: true, text: "parallel deep read", input_tokens: 10, output_tokens: 10, total_tokens: 20, duration_ms: 25, limit_hit: false, error: null };
    };
    const mk = (rows) => ({
      cfg: CFG_FIX, brainCfg, env: {}, now: nowT, council: null, bus,
      readQueue: () => rows, readWake: () => null,
      post: async (p, b) => { out.posts.push({ p, b }); return { ok: true }; },
      appendLedger: (r) => out.rows.push(r), runtime: { attempts: {} }, saveRuntime: () => {},
      headroom: { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
      call: slowCall,
    });
    const K = CFG_FIX.deep.concurrency;   // derived, not hardcoded — the fixture IS the contract
    const r = await serveWakes(mk(qRows));
    assert("TWO queued wakes are served CONCURRENTLY (the overlap is real)", r.served === K && peak === K && out.posts.length === K);
    assert("each spend rides the shared brain ledger (two rows, both opus)", out.rows.length === K && out.rows.every(x => x.engine === "claude"));
    // three queued, concurrency 2 → one waits its turn (never dropped)
    out.posts.length = 0; out.rows.length = 0; peak = 0;
    const r3 = await serveWakes(mk([mkWake("m_1", "2026-07-15T02:58:00Z"), mkWake("m_2", "2026-07-15T02:58:30Z"), mkWake("m_3", "2026-07-15T02:59:00Z")]));
    assert("THREE queued, two lanes → 2 served now, 1 stays queued (never clobbered)", r3.served === K && r3.queued === 3 - K && peak === K);
    // E2E audit 25 Jul 2026 — THE CONCURRENT-LANE OVERSHOOT. allowed=100k, overnight →
    // the floor for ONE 48k-thinking read is 76.8k. Both lanes used to read the SAME
    // 100k (the ledger cannot see a call that has not returned), both cleared the floor,
    // and their JOINT spend landed inside the reserve the floor exists to protect.
    // Lane 2 must now gate against 100k MINUS lane 1's in-flight estimate.
    out.posts.length = 0; out.rows.length = 0; peak = 0;
    const rTight = await serveWakes({ ...mk([mkWake("m_t1", "2026-07-15T02:58:00Z"), mkWake("m_t2", "2026-07-15T02:58:30Z")]), headroom: { allowed: 100000, used: 700000, cap: 800000, phase: "overnight" } });
    assert("TIGHT WINDOW: lane 2 gates against lane 1's IN-FLIGHT spend — one read fires, one is declined", rTight.served === 1 && out.rows.length === 1 && out.posts.filter(p => p.b.reason === "no-headroom").length === 1);
    assert("TIGHT WINDOW: the reserve is released again (a lane never leaks headroom)", inflightReserve === 0);
    // E2E audit 25 Jul 2026 — the attempts map was append-only and grew forever.
    out.posts.length = 0; out.rows.length = 0;
    const savedR = [];
    const rP = await serveWakes({
      ...mk([mkWake("m_live", "2026-07-15T02:59:00Z")]),
      runtime: { attempts: { m_live: 0, m_dead_1: 1, m_dead_2: 2 }, unsent: { m_gone: "2026-07-01T00:00:00.000Z" } },
      saveRuntime: (o) => savedR.push(JSON.parse(JSON.stringify(o))),
    });
    const lastSave = savedR[savedR.length - 1];
    assert("PRUNE: bookkeeping for wakes that are no longer pending is dropped (the runtime can't grow forever)", rP.served === 1 && lastSave && !("m_dead_1" in lastSave.attempts) && !("m_dead_2" in lastSave.attempts) && lastSave.attempts.m_live === 1 && !(lastSave.unsent && lastSave.unsent.m_gone));
    // a stale wake is declined, never dangles
    out.posts.length = 0;
    const rOld = await serveWakes(mk([mkWake("m_old", "2026-07-15T01:00:00Z")]));
    assert("a wake stuck past the TTL is DECLINED as expired-in-queue", rOld.expired === 1 && out.posts[0].b.reason === "expired-in-queue");
    // a served resolution row closes the wake — the reducer sees it
    const closed = pendingWakes([...qRows, { moment_id: "m_a", status: "served", at: "x" }]);
    assert("the event-sourced reducer: a served row closes ONLY its wake", closed.length === 1 && closed[0].moment_id === "m_b");
    // legacy floor: no queue → the single-slot wake.json still serves
    out.posts.length = 0;
    const rLeg = await serveWakes({ ...mk([]), readWake: () => mkWake("m_legacy", "2026-07-15T02:59:30Z") });
    assert("LAYERING: queue empty → the pre-M14 single-slot contract still serves", rLeg.served === 1 && out.posts[0].b.moment_id === "m_legacy");
    // E2E audit 25 Jul 2026 — THE BUSY-LOOP. The daemon's fire() re-entered itself from
    // `.finally`, i.e. after every outcome. Only the thalamus closes a queue row, so an
    // outcome that did NOT get an acknowledged close left the moment pending and the
    // instant re-entry re-dispatched the SAME wake with zero delay. laneResolved is the
    // predicate that gate now uses (fire() itself lives in main() and cannot be tested
    // without opening the :4112 lock, so the contract is asserted here).
    assert("DAEMON LANE: only an ACKNOWLEDGED close re-opens the dispatcher (no busy-loop)",
      laneResolved({ served: true, reported: true }) === true && laneResolved({ gave_up: true, reported: true }) === true && laneResolved({ declined: "no-headroom", reported: true }) === true
      && laneResolved({ served: false, spooled: true }) === false && laneResolved({ served: false, error: "boom" }) === false
      && laneResolved({ limit_held: true }) === false && laneResolved({ refused: true }) === false
      && laneResolved({ declined: "no-headroom", reported: false }) === false && laneResolved(null) === false);
  }

  // the prompt itself
  {
    const p = buildDeepPrompt(wake, bus);
    assert("prompt carries the bound moment (spotlight + context)", p.includes("attention scaling") && p.includes("bound_context"));
    assert("prompt carries the bus slice, and the no-invented-numbers law", p.includes("calibration_gap") && p.includes("never a number that is not in the data"));
    assert("prompt carries the honest-frame law + speakable contract", p.includes('never "10x"') && p.includes("250 words"));
    assert("prompt itself breaks no banned-phrase law", bannedPhraseCheck(p.replace(/never "10x", "exponential", "on steroids"/, ""), ["on steroids"]).length === 0);
    // WIRING AUDIT (10 Aug 2026) — a danger topic reaches the deep brain WITH the domain it
    // belongs to. Live shape: `pydantic` (skill) sorts above `chunking` (concept, axis f),
    // and the old slice made them indistinguishable names in a list.
    const pTrack = buildDeepPrompt(wake, { ...bus, calibration: { calibration_gap: 0.12, danger_zone: [
      { topic: "pydantic", track: "skill", confidence: "high", accuracy: "low" },
      { topic: "chunking", track: "concept", confidence: "high", accuracy: "low", axis: "f" },
    ] } });
    assert("#wire: danger topics arrive TRACK-stamped (skill ≠ concept) and carry their axis",
      /"topic": "pydantic"/.test(pTrack) && /"track": "skill"/.test(pTrack) && /"track": "concept"/.test(pTrack) && /"axis": "f"/.test(pTrack));

    // ---------------------------------------------------------------------
    // WIRING AUDIT (10 Aug 2026) — THE DEAD WIRE, HELD OPEN.
    // These four fail the moment the context river stops reaching the deep brain:
    // drop the prompt block, drop the age, silently omit the absent case, or let
    // ambientWindow stop reading the newest context row, and the suite goes red.
    // Before this repair, 2,999 of 2,999 scored context moments died at reflex and
    // this file had consumed none of them.
    // ---------------------------------------------------------------------
    assert("#wire: the ambient window REACHES the deep brain — what-app AND what-concept, the header's whole promise",
      /"window": "chrome\.exe · Attention Is All You Need"/.test(p) && /"concept": "attention"/.test(p));
    assert("#wire: it carries its own AGE and is framed as corroboration, never as the question",
      /"minutes_old": 3/.test(p) && /CORROBORATION ONLY/.test(p));
    const pNoWin = buildDeepPrompt(wake, { ...bus, current_window: null });
    assert("#wire: ABSENCE IS NAMED — no ambient row prints a null window WITH its reason, never a silent omission",
      /"window": null/.test(pNoWin) && /no context afferent in the last 40/.test(pNoWin));
    // the reader itself, on a fixture shaped like the live afferent tail
    const aw = ambientWindow({ now: Date.parse("2026-08-10T18:07:00Z"), rows: [
      { modality: "code", text: "typed something", ts: "2026-08-10T17:00:00Z" },
      { modality: "context", app: "chrome.exe", title: "old tab", text: "chrome.exe · old tab", concept_tokens: [], ts: "2026-08-10T17:30:00Z" },
      { modality: "context", app: "Code.exe", title: "attention.py", text: "Code.exe · attention.py", concept_tokens: ["attention"], ts: "2026-08-10T18:00:00Z" },
    ] });
    assert("#wire: ambientWindow reads the NEWEST context row, keeps its canon concept, and derives age from ITS ts",
      aw.text === "Code.exe · attention.py" && aw.concept === "attention" && aw.age_min === 7 &&
      ambientWindow({ rows: [{ modality: "code", text: "no ambient here" }] }) === null);
    // #WIRE (dead-wire sweep, 11 Aug 2026) — A SHEARED READING MUST SAY SO HERE.
    // context.mjs has named its 200/240-char cut on the row since D8 and no organ
    // that RENDERS the title read it, so the deep brain took a stub for the whole
    // title. These two go red if the flag stops travelling (distiller currentWindow)
    // or stops being printed by name (the WHERE HE WAS block).
    const awCut = ambientWindow({ now: Date.parse("2026-08-11T05:07:00Z"), rows: [
      { modality: "context", app: "chrome.exe", title: "i can buy helium 10 platinum as well and want to first work w",
        text: "chrome.exe · i can buy helium 10 platinum as well and want to first work w",
        title_len: 227, title_truncated: true, text_len: 260, text_truncated: true,
        concept_tokens: [], ts: "2026-08-11T05:00:00Z" },
    ] });
    assert("#wire: a DOOR-SHEARED window reaches the deep brain flagged, not disguised as a whole title",
      awCut.door_cut === true && /…$/.test(awCut.text) &&
      /"truncated_at_door": true/.test(buildDeepPrompt(wake, { ...bus, current_window: awCut })));
    assert("#wire: THREE states in the prompt too — an unflagged (pre-D8) reading prints null, never a silent 'complete'",
      ambientWindow({ rows: [{ modality: "context", app: "Code.exe", title: "drill.py", text: "Code.exe · drill.py", concept_tokens: [], ts: "2026-08-11T05:00:00Z" }] }).door_cut === null &&
      /"truncated_at_door": null/.test(buildDeepPrompt(wake, { ...bus, current_window: { text: "x", concept: null, age_min: 1 } })) &&
      /truncated_at_door: true means the sensor cut this title/.test(buildDeepPrompt(wake, bus)));

    // ---------------------------------------------------------------------
    // WIRING AUDIT (11 Aug 2026) — THE MOMENT DOOR, HELD OPEN.
    // The old door head-cut the whole envelope at 2,500 chars, so a long paste
    // delivered its first 3.5–5% and NOTHING else: no event_key, no
    // concept_tokens, no salience, no components, no bound_context, and not even
    // parseable JSON. The fixture below is shaped like the live wake that proved
    // it (m_1786360829154…, 71,417-char spotlight text, 8 components, 4 tokens) —
    // the old suite could never trip, because its only fixture was 28 chars long.
    // Re-introduce a blind slice and every one of these goes red.
    // ---------------------------------------------------------------------
    const longWake = { moment_id: "m_long", status: "pending",
      spotlight: { modality: "code", text: "x".repeat(71417), event_key: "paste:gemini", concept_tokens: ["first", "analyze", "gemini", "result"], S: 0.65,
        comps: { pe: 0.4, nov: 0.9, gov: 0, err: 0, self: 1, dead: 0, hab: 0.2, pulse: 0.1 } },
      bound_context: [{ modality: "voice", text: "y".repeat(4000), event_key: "voice:doubt" }] };
    const mb = momentBlock(longWake);
    // parsed defensively on purpose: with the blind slice back the block is NOT JSON
    // (verified 11 Aug 2026 — "Unterminated string in JSON at position 2500", the same
    // error the live queue throws), and a bare JSON.parse here would kill the whole
    // suite mid-run instead of showing every wire that broke.
    const mbj = (() => { try { return JSON.parse(mb); } catch { return null; } })();
    const at = (path, dflt) => { try { return path(); } catch { return dflt; } };
    assert("#wire: a LONG moment still arrives as VALID JSON (the old door cut mid-string)", mbj !== null);
    assert("#wire: the SKELETON survives — event_key, concept_tokens, salience and ALL 8 components reach the deep brain",
      at(() => mbj.spotlight.event_key === "paste:gemini" && mbj.spotlight.concept_tokens.length === 4
        && mbj.spotlight.salience === 0.65 && Object.keys(mbj.spotlight.components).length === 8, false));
    assert("#wire: bound_context is never sacrificed to a long spotlight (why he was woken outlives his prose)",
      at(() => mbj.bound_context.length === 1 && mbj.bound_context[0].event_key === "voice:doubt" && mbj.bound_context[0].modality === "voice", false));
    assert("#wire: ABSENCE IS NAMED — a trimmed text says how many chars were dropped, on BOTH slots",
      at(() => /71417 chars/.test(mbj.spotlight.text_truncated) && /DROPPED at the cortex door/.test(mbj.spotlight.text_truncated)
        && /4000 chars/.test(mbj.bound_context[0].text_truncated), false));
    assert("#wire: the door's own budget is unchanged and still honoured (no new number invented)",
      at(() => MOMENT_BUDGET_CHARS === 2500 && mb.length <= MOMENT_BUDGET_CHARS && mbj.spotlight.text.length > 0, false));
    assert("#wire: the long moment reaches the PROMPT itself, skeleton intact (buildDeepPrompt is the caller under test)",
      (() => { const pl = buildDeepPrompt(longWake, bus); return pl.includes('"salience": 0.65') && pl.includes("paste:gemini") && pl.includes("bound_context") && pl.includes("DROPPED at the cortex door"); })());
    // LAYERING: the short path must stay byte-identical to the frozen legacy door
    assert("#wire/LAYERING: a moment inside budget is byte-identical to the pre-repair door",
      momentBlock(wake) === momentBlockLegacy(wake) && momentBlock(longWake) !== momentBlockLegacy(longWake));
  }

  // ---------------------------------------------------------------------------
  // WIRING AUDIT (11 Aug 2026) — THE CAPSULE DOOR, HELD OPEN.
  // The old door cut the RAW capsule JSON at 1,500 chars: 2.4–3.6% of each of his
  // four capsules, severed mid-string, and EVERY layer carrying his actual thinking
  // (bolo, the nine welds, traps, threeWays, interviewLines, doubts, deep) fell
  // entirely outside it with no field naming the drop. The fixture weld below is
  // 1,973 chars on its own — longer than the ENTIRE old budget — so re-introducing
  // any head-cut at this door turns these red on the next run.
  // ---------------------------------------------------------------------------
  {
    const WELD_A = "weld-a ".repeat(280) + "END-OF-WELD-A";     // 1,973 chars — the old door carried 0 of it
    const capFix = {
      id: "fixture", title: "Fixture Concept", status: "tempered", lockedOn: "2026-06-28", reJirahDone: [{ at: "x" }],
      bolo: "bolo-verbatim", hook: "hook-verbatim", mechanism: "mechanism-verbatim",
      faultLines: [
        { axis: "a", title: "Axis A", status: "held", strike: "strike-a", weld: WELD_A, deep: "d".repeat(1200) },
        { axis: "b", title: "Axis B", status: "cracked", strike: "strike-b", weld: "weld-b-verbatim", deep: "" },
      ],
      traps: ["trap-one"], threeWays: { ceo: "ceo-line", junior: "junior-line", skeptic: "skeptic-line" },
      interviewLines: ["interview-line-one"], doubts: [{ q: "doubt-q-one", a: "doubt-a-one" }],
      deep: "D".repeat(800),
    };
    const cText = capsuleText(capFix, "fixture");
    assert("#wire: HIS WELD ARRIVES WHOLE — a 1,973-char weld reaches the deep brain uncut (the old 1,500 door carried none of it)",
      cText.includes(WELD_A) && cText.includes("END-OF-WELD-A") && cText.length > 1500);
    assert("#wire: EVERY prose layer reaches it verbatim — bolo, hook, mechanism, both welds, traps, threeWays, lines, doubts",
      ["bolo-verbatim", "hook-verbatim", "mechanism-verbatim", "strike-a", "weld-b-verbatim", "trap-one", "ceo-line", "skeptic-line", "interview-line-one", "doubt-q-one", "doubt-a-one"].every(s => cText.includes(s)));
    assert("#wire: ABSENCE IS NAMED — the one omitted layer (`deep`) states its EXACT size, never a silent drop",
      /NOT INCLUDED/.test(cText) && /1 axis deep\(s\) plus the capsule-level deep/.test(cText) && cText.includes(String(1200 + 800)));
    assert("#wire: an EMPTY deep says so too (absence is named in BOTH directions)",
      /`deep` re-learn layer is EMPTY/.test(capsuleText({ faultLines: [{ axis: "a", weld: "w" }], bolo: "b" }, "bare")));
    assert("#wire: capsule prose is SACRED — nothing reworded, nothing elided with an ellipsis",
      cText.includes("BOLO (how HE says it out loud") && !/\.\.\.|\[truncated\]/.test(cText));
    // end to end: the door's output must actually reach the ONE Opus prompt
    assert("#wire: the whole weld survives all the way into buildDeepPrompt (door → prompt, the wire under repair)",
      buildDeepPrompt(wake, { ...bus, capsule: { name: "fixture.json", id: "fixture", text: cText } }).includes(WELD_A));

    // the door itself, against his REAL locked capsules — the strongest proof there is.
    // GUARDED: capsules/ is a mirror.mjs artefact and is NOT git-tracked, so a fresh
    // clone has none and must not go red for their absence.
    const liveDir = join(STATE_DIR, "capsules");
    const liveFiles = existsSync(liveDir) ? readdirSync(liveDir).filter(f => f.endsWith(".json")) : [];
    if (liveFiles.length) {
      const id = liveFiles[0].slice(0, -5);
      const got = findCapsule([id]);
      const live = JSON.parse(readFileSync(join(liveDir, liveFiles[0]), "utf8"));
      const welds = (live.faultLines || []).map(a => String((a && a.weld) || "")).filter(x => x.trim());
      assert(`#wire LIVE: all ${welds.length} welds in his real "${id}" capsule reach the prompt whole (raw-JSON door served 2.6%)`,
        !!got && got.id === id && welds.length > 0 && welds.every(w => got.text.includes(w)) && got.text.length > 1500);
    }
    // EXACT id beats an accidental substring — "context.json" contains "on", "text" and
    // "one", so a stopword could open the wrong book. The substring pass is kept intact
    // beneath it (LAYERING): a token that resolved before still resolves the same way.
    if (liveFiles.includes("context.json") && liveFiles.includes("embeddings.json")) {
      assert("#wire: an EXACT capsule id beats a short accidental substring, and the old substring pass still resolves",
        (findCapsule(["on", "embeddings"]) || {}).id === "embeddings" && (findCapsule(["on"]) || {}).id === "context");
    }

    // -------------------------------------------------------------------
    // WIRING AUDIT (11 Aug 2026, dead-wire sweep) — THE SLOT NAMES ITS MISS.
    // Held open by the door repair above, the slot itself still rendered
    // `${capsule ? … : ""}`: on the live queue findCapsule returns null for
    // 19 of 19 spotlit wakes (18 no-match, 1 with no concept_tokens at all)
    // and the prompt carried no capsule section and no reason. Put the empty
    // string back and every one of these goes red. The shelf reader is
    // INJECTED (the FIXTURE law, :828) so the verdict never swings on what
    // mirror.mjs last fetched to his disk.
    // -------------------------------------------------------------------
    const shelfFix = { list: () => ["context", "embeddings", "inference", "tokenization"] };
    const aNoMatch = capsuleAbsence(["attention"], liveDir, shelfFix);
    const aNoToks  = capsuleAbsence([], liveDir, shelfFix);
    const aFailed  = capsuleAbsence(["attention"], liveDir, { list: () => { const e = new Error("no shelf"); e.code = "ENOENT"; throw e; } });
    const aEmpty   = capsuleAbsence(["attention"], liveDir, { list: () => [] });
    assert("#wire: FOUR distinct misses, four distinct reasons — the slot can no longer render them all as one silence",
      new Set([aNoMatch.why, aNoToks.why, aFailed.why, aEmpty.why]).size === 4 &&
      aNoMatch.why === "no_match" && aNoToks.why === "no_concept_tokens" && aFailed.why === "door_failed" && aEmpty.why === "shelf_empty");
    assert("#wire: a DOOR FAILURE is never reported as 'he has locked nothing' — it says UNKNOWN and refuses the inference",
      /UNKNOWN/.test(aFailed.reason) && /ENOENT/.test(aFailed.reason) && aFailed.his_locked_capsules === null &&
      /locked NOTHING on this concept/.test(aNoMatch.reason) && aNoMatch.his_locked_capsules.length === 4);
    assert("#wire: a moment with NO concept_tokens says the door was never asked, and still lists what he DOES hold",
      /never asked a question/.test(aNoToks.reason) && aNoToks.moment_concept_tokens.length === 0 && aNoToks.his_locked_capsules.includes("embeddings"));
    // the wire under repair: door → SLOT → the one Opus prompt
    const pNoCap = buildDeepPrompt(wake, { ...bus, capsule: null });
    assert("#wire: ABSENCE REACHES THE PROMPT — a miss prints NO CAPSULE with its reason, never the empty string (19/19 live wakes hit this path)",
      /NO CAPSULE — and the reason is NAMED/.test(pNoCap) && /"why":/.test(pNoCap) && /"reason":/.test(pNoCap) &&
      !/THE CAPSULE \(his own locked knowledge/.test(pNoCap));
    assert("#wire: an UNPARSED capsule is flagged as a damaged fragment, not served as his prose under the same header",
      /DAMAGED FRAGMENT/.test(capsuleSection({ name: "broken.json", unparsed: true, text: "{\"id\":\"broken\",\"bolo\":\"cut mid-str" }, ["broken"])) &&
      !/DEGRADED/.test(capsuleSection({ name: "ok.json", text: "his whole prose" }, ["ok"])));
    // -------------------------------------------------------------------
    // THE HALF-TESTED WIRE (dead-wire sweep, 11 Aug 2026 — second pass).
    // The assertion directly above hands capsuleSection a capsule object
    // BUILT BY HAND with `unparsed: true`. That proves the CONSUMER reads
    // the flag; it proves nothing about the PRODUCER. findCapsule (:214) is
    // the only thing that stamps it, and a tracing pass this same day filed
    // this exact wire as dead because `grep -n unparsed` looked like a lone
    // writer — the failure mode is real and it is a NAME. Rename the field
    // there, or drop the stamp in a refactor, and the hand-built assertion
    // above stays GREEN while a severed capsule goes back to riding under
    // "his own locked knowledge on this concept — build on HIS words".
    // So: no hand-built object here. A genuinely unparseable file on disk
    // goes in one end and the prompt comes out the other — producer, slot,
    // and prompt in one line. The parseable sibling in the SAME fixture dir
    // is the control: it proves the flag discriminates rather than always
    // firing. Fixture dir, never his capsules/ — mirror.mjs owns that folder
    // and this file is read-only there (mkdtemp idiom borrowed from
    // brain.mjs:3237, which dynamic-imports it for the same reason: the top
    // of this file has no need of it outside the suite).
    // -------------------------------------------------------------------
    {
      const { mkdtempSync, rmSync } = await import("node:fs");
      const os = await import("node:os");
      const fixDir = mkdtempSync(join(os.tmpdir(), "cortex-unparsed-"));
      try {
        // severed mid-string, exactly the shape a half-written mirror fetch leaves
        writeFileSync(join(fixDir, "brokenfix.json"), '{"id":"brokenfix","bolo":"his line cut mid-str');
        writeFileSync(join(fixDir, "goodfix.json"), JSON.stringify({ id: "goodfix", bolo: "good-bolo-verbatim" }));
        const gotBad = findCapsule(["brokenfix"], fixDir);
        const gotOk = findCapsule(["goodfix"], fixDir);
        assert("#wire END-TO-END: a REAL unparseable capsule on disk arrives at the Opus prompt named a DAMAGED FRAGMENT — findCapsule stamps it, the slot reads it (rename the flag and this goes red, the hand-built assertion above does not)",
          !!gotBad && gotBad.unparsed === true &&
          /DAMAGED FRAGMENT/.test(buildDeepPrompt(wake, { ...bus, capsule: gotBad })) &&
          /would not JSON.parse/.test(buildDeepPrompt(wake, { ...bus, capsule: gotBad })));
        assert("#wire: the flag DISCRIMINATES — a parseable capsule from the same shelf carries no flag and no degraded note",
          !!gotOk && gotOk.unparsed === undefined && gotOk.text.includes("good-bolo-verbatim") &&
          !/DEGRADED|DAMAGED FRAGMENT/.test(buildDeepPrompt(wake, { ...bus, capsule: gotOk })));
      } finally { rmSync(fixDir, { recursive: true, force: true }); }
    }
    // LAYERING: the HIT path is byte-identical to the pre-slot-repair render
    assert("#wire/LAYERING: a resolved capsule renders byte-identical to the pre-repair slot",
      capsuleSection({ name: "fixture.json", id: "fixture", text: cText }, ["fixture"])
        === `\nTHE CAPSULE (his own locked knowledge on this concept — build on HIS words):\n${cText}\n`);
  }

  // OVERNIGHT DEEPENING (P5) — the concept graph, deps-injected (no live Opus)
  {
    const concepts = ["embeddings", "vector-search", "attention", "hallucinations"];
    const lstate = { concepts: [{ id: "embeddings", fluency: "🟢 fluent" }, { id: "attention", fluency: "🔴 learning" }] };
    const goodGraph = JSON.stringify({ nodes: [{ id: "embeddings", fluency: "fluent" }, { id: "attention", fluency: "expert" }, { id: "attention", fluency: "learning" }, { id: "not-a-real-concept", fluency: "fluent" }], edges: [{ from: "embeddings", to: "vector-search", kind: "prereq" }, { from: "attention", to: "ghost", kind: "related" }], clusters: [{ name: "rag", concepts: ["embeddings", "ghost-concept"] }, { name: "all-ghost", concepts: ["nope"] }], next_unlocks: ["vector-search", "ghost"] });
    const okHr = { allowed: 400000, phase: "overnight" };
    const base = { concepts, lstate, headroom: okHr, now: new Date("2026-07-18T03:00:00Z"), env: {}, brainCfg: { guards: {} }, cfg: { deep: { min_headroom_tokens: 50000 } } };
    let wrote = null, metered = [];
    const r = await runConsolidation({ ...base, appendLedger: (o) => metered.push(o), write: (o) => { wrote = o; }, call: async () => ({ ok: true, text: goodGraph, total_tokens: 12000, input_tokens: 8000, output_tokens: 4000, duration_ms: 30000 }) });
    assert("CONSOLIDATE — writes a concept graph, metered as cortex_consolidate", r.ok && wrote && metered.length === 1 && metered[0].job === "cortex_consolidate");
    assert("CONSOLIDATE — grounds it: nodes/edges/unlocks NOT in the concept set are dropped (no ghosts)", wrote && wrote.nodes.length === 2 && wrote.edges.length === 1 && wrote.next_unlocks.length === 1 && wrote.next_unlocks[0] === "vector-search");
    assert("CONSOLIDATE — clusters grounded (ghost concepts dropped, all-ghost cluster removed) + nodes deduped + fluency clamped to enum", wrote.clusters.length === 1 && wrote.clusters[0].concepts.length === 1 && wrote.clusters[0].concepts[0] === "embeddings" && wrote.node_count === 2 && wrote.nodes.find(n => n.id === "attention").fluency === "unknown");
    const skip = await runConsolidation({ ...base, headroom: { allowed: 10000, phase: "study" }, call: async () => { throw new Error("must not call with no headroom"); }, write: () => { throw new Error("no write"); }, appendLedger: () => {} });
    assert("CONSOLIDATE — no headroom → skip, no Opus call, no write (never overshoots the meter)", skip.ok === false && /headroom/.test(skip.skipped));
    let m2 = [];
    const bad = await runConsolidation({ ...base, appendLedger: (o) => m2.push(o), write: () => { throw new Error("no write on malformed"); }, call: async () => ({ ok: true, text: "not json at all", total_tokens: 500 }) });
    assert("CONSOLIDATE — malformed graph → metered but NOT written (a bad graph never lands)", bad.ok === false && m2.length === 1);
    const realShape = gatherCorpus({ concepts: { version: 1, _comment: "x", axes: { a: "..." }, concepts: { tokenization: {}, embeddings: {} }, skills: { pydantic: {} } }, lstate: null });
    assert("CONSOLIDATE — reads the REAL concepts.json shape (concepts+skills objects), NOT its metadata keys", realShape.concepts.includes("tokenization") && realShape.concepts.includes("pydantic") && !realShape.concepts.includes("_comment") && !realShape.concepts.includes("axes"));

    // ── #71 · THE SILENT NO-OP ─────────────────────────────────────────────
    // Measured over the live ledger on 4 Aug 2026: 11 cortex_consolidate rows on
    // 8 distinct days for a DAILY job registered 18 Jul — 10 of 18 days left NO
    // trace at all, because every early return happened before the first append.
    // Task Scheduler read that as success, indefinitely. Each gate now bills a
    // row that says it did not run, and why.
    {
      const rowsOf = async (over) => { const m = []; const res = await runConsolidation({ ...base, appendLedger: (o) => m.push(o), write: () => { throw new Error("no write"); }, call: async () => { throw new Error("no call"); }, ...over }); return { m, res }; };
      const noHead = await rowsOf({ headroom: { allowed: 10000, phase: "study" } });
      assert("#71: a no-headroom skip LEAVES A ROW (it used to leave nothing at all)",
        noHead.m.length === 1 && noHead.m[0].job === "cortex_consolidate" && noHead.m[0].ran === false && noHead.m[0].ok === false && noHead.m[0].total_tokens === 0);
      assert("#71: the row NAMES the gate, as a have/need counter (#106)",
        /no-headroom \(10000\/\d+ needed/.test(noHead.m[0].skipped) && noHead.m[0].headroom_needed > 0);
      const thin = await rowsOf({ concepts: ["only", "two"] });
      assert("#71: a too-few-concepts skip leaves a row too (every gate, not just this one)",
        thin.m.length === 1 && thin.m[0].ran === false && thin.m[0].skipped.includes("2/3 needed"));
      const refused = await rowsOf({ brainCfg: { guards: { refuse_if_api_key_env: true } }, env: { ANTHROPIC_API_KEY: "sk-no" } });
      assert("#71: the API-key refusal is recorded too (the $100 law leaves a receipt)",
        refused.res.refused === true && refused.m.length === 1 && refused.m[0].ran === false);
      // a successful pass is marked ran:true so the two are never confused
      let mOK = [];
      const okRun = await runConsolidation({ ...base, appendLedger: (o) => mOK.push(o), write: () => {}, call: async () => ({ ok: true, text: goodGraph, total_tokens: 12000, input_tokens: 8000, output_tokens: 4000, duration_ms: 3 }) });
      assert("#71: a real pass is marked ran:true — a skip can never be read as a run", okRun.ok && mOK.length === 1 && mOK[0].ran === true && mOK[0].total_tokens === 12000);
      // and a ledger fault must not kill the pass (telemetry ≠ the work)
      const survive = await runConsolidation({ ...base, appendLedger: () => { throw new Error("EPERM: brain_ledger.jsonl busy"); }, write: () => {}, call: async () => ({ ok: true, text: goodGraph, total_tokens: 10, duration_ms: 1 }) });
      assert("#71: a ledger write fault never kills the consolidation (telemetry ≠ the work)", survive.ok === true);
      // THE EXIT-CODE STANDARD: the job is daily, so 'today' is its own contract
      const today = new Date("2026-07-18T03:00:00Z");
      assert("#71: freshness is measured against the job's OWN daily cadence, no invented threshold",
        graphFreshness(today, { graph: { generated_at: "2026-07-18T02:00:00Z" } }).fresh === true
        && graphFreshness(today, { graph: { generated_at: "2026-07-16T02:00:00Z" } }).age_days === 2
        && graphFreshness(today, { graph: { generated_at: "2026-07-16T02:00:00Z" } }).fresh === false
        && graphFreshness(today, { graph: null }).exists === false);
    }

    // ── #72 · THE READER'S CONTRACT ────────────────────────────────────────
    // setpiece.mjs is being wired as the first reader this file has ever had.
    // These assertions ARE the contract; break one and the reader breaks.
    {
      let g = null;
      await runConsolidation({ ...base, appendLedger: () => {}, write: (o) => { g = o; }, call: async () => ({ ok: true, text: goodGraph, total_tokens: 1, duration_ms: 1 }) });
      assert("#72: the written shape carries every field the reader is promised",
        g.schema_version === 1 && typeof g.generated_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(g.date)
        && g.node_count === g.nodes.length && g.edge_count === g.edges.length
        && Array.isArray(g.clusters) && Array.isArray(g.next_unlocks));
      assert("#72: next_unlocks are BARE STRINGS (a reader must not have to guess)",
        g.next_unlocks.every(x => typeof x === "string"));
      assert("#72: nodes/edges/clusters/next_unlocks are ALL grounded in the concept set",
        g.nodes.every(n => concepts.includes(n.id)) && g.edges.every(e => concepts.includes(e.from) && concepts.includes(e.to))
        && g.clusters.every(c => c.concepts.every(x => concepts.includes(x))) && g.next_unlocks.every(x => concepts.includes(x)));
      assert("#72/#106: the graph ships its own have/need counter — fluency measured for N of M",
        g.concepts_considered === 4 && g.fluency_known === 2);
    }
  }

  // ── THE CONTRACT HEADER IS A WIRE (wiring audit, 11 Aug 2026) ───────────────
  // `consolidate` — the only mode any scheduler fires (ArsenalFC-ConceptGraph,
  // Enabled, DAILY 03:00, `node scripts\cortex.mjs consolidate`) — was missing from
  // the MODES header for as long as the mode has existed, so this organ's own
  // contract denied the nightly Opus pass. Skills read a surface by grepping
  // `^// MODES` (.claude/skills/full-time/SKILL.md), which is why a doc-only defect
  // is a dead wire and not a typo. From here the header answers to the dispatcher:
  // every mode main() branches on must be NAMED above, or this suite goes red.
  // Scoped to main() on purpose — a `mode === "…"` in a comment or a fixture is
  // not a surface, and must never be able to fail this check.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const header = (src.match(/^\/\/ MODES:[\s\S]*?(?=^\/\/ ={10,})/m) || [""])[0];
    const mainSrc = src.slice(src.indexOf("async function main()"));
    const dispatched = [...new Set([...mainSrc.matchAll(/\bmode === "([a-z_-]+)"/g)].map(m => m[1]))].sort();
    const undocumented = dispatched.filter(m => !header.includes(m));
    assert(`MODES header names every mode main() dispatches (${dispatched.join(", ")}) — none undocumented${undocumented.length ? `: ${undocumented.join(", ")}` : ""}`,
      header.length > 0 && dispatched.length >= 3 && undocumented.length === 0);
    assert("MODES header names `consolidate` — the ONE mode a scheduler fires (ArsenalFC-ConceptGraph, DAILY 03:00)",
      dispatched.includes("consolidate") && /consolidate/.test(header));
  }

  // ── THE RESTART DOOR IS A WIRE (dead-wire repair, 11 Aug 2026) ─────────────
  // These fail the moment a stale build loses its way out again: drop the route,
  // let it exit on a live lane, stop consulting it where the lane count changes,
  // or let captains_call stop naming this mode — and the suite goes red. Before
  // this repair the live daemon (PID 13272, booted 09-08-2026 01:17:29) had been
  // serving deep reads from two-day-old code with a green suite above it.
  {
    const ok = lockRoute("POST", "/restart");
    assert("#wire: POST /restart ARMS the door and answers 200 (the lock is no longer a black hole)",
      ok.arm === true && ok.status === 200 && ok.body.armed === true);
    assert("#wire: every other request arms NOTHING and 404s — a stray probe can never retire the deep brain",
      lockRoute("GET", "/restart").arm === false && lockRoute("POST", "/status").arm === false
      && lockRoute("GET", "/").status === 404 && lockRoute(undefined, undefined).arm === false);
    assert("#wire: an armed restart NEVER lands on a lane in flight (the paid Opus answer is not destroyed)",
      restartReady({ armed: true, inflight: 0 }) === true && restartReady({ armed: true, inflight: 1 }) === false
      && restartReady({ armed: false, inflight: 0 }) === false);

    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const mainSrc = src.slice(src.indexOf("async function main()"));
    // The door must be REACHED, not merely present: the lock server routes through
    // lockRoute, and retireIfArmed is consulted at all FOUR points the lane count
    // can change (arm · a served lane closing · an expired-in-queue lane closing ·
    // the 5s poll). A count, because losing any one of them is a restart that
    // silently never happens.
    assert("#wire: main() actually routes the lock through lockRoute and re-checks retirement at all 4 lane-count changes",
      /createServer\(\(req, res\) => \{[\s\S]{0,200}lockRoute\(req\.method, req\.url\)/.test(mainSrc)
      && (mainSrc.match(/retireIfArmed\(\)/g) || []).length >= 5);   // 1 declaration + 4 call sites

    // THE CROSS-ORGAN HALF. The door is only alive while something HIS word
    // reaches can fire it. captains_call.mjs owns that end (RESTART_DOOR); read
    // its source rather than importing it, so this check costs no module load and
    // cannot be satisfied by a dead re-export.
    const ccSrc = readFileSync(join(__dirname, "captains_call.mjs"), "utf8");
    const door = /export const RESTART_DOOR = \{([^}]*)\}/.exec(ccSrc);
    assert("#wire: captains_call's RESTART_DOOR still dispatches cortex to THIS mode — his haan on the STALE BUILD card has somewhere to land",
      !!door && /cortex:\s*\["cortex\.mjs",\s*"restart"\]/.test(door[1])
      && [...new Set([...mainSrc.matchAll(/\bmode === "([a-z_-]+)"/g)].map((m) => m[1]))].includes("restart"));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// OVERNIGHT DEEPENING (P5) — THE CONCEPT GRAPH. A nightly consolidation routed
// through the ONE Opus path (cortex), NEVER grafted onto dmn.mjs (dmn stays the
// FREE Gemini dreamer — a second unmetered Opus path would breach Law 2). Reads
// his concept list + fluency, asks Opus to synthesise a prereq/relation graph,
// writes concept_graph.json. Gated on headroom + metered like every deep read.
// DESIGN NOTE: the architecture suggested a thalamus-enqueued 'consolidation'
// WAKE; this direct `cortex consolidate` mode is the SAME single Opus path with
// less surgery (no new afferent-recognition path, thalamus stays sole wake
// writer untouched), and a scheduled nightly batch fits a mode better than a
// reactive wake. Same law kept: one metered Opus path, dmn free.
// ---------------------------------------------------------------------------
const CONCEPTS      = join(STATE_DIR, "concepts.json");
const LSTATE        = join(STATE_DIR, "learning_state.json");
const CONCEPT_GRAPH = join(STATE_DIR, "concept_graph.json");

// ── #72 · THE concept_graph.json CONTRACT (organism audit, 4 Aug 2026) ───────
// This file had a writer and, for its whole life, ZERO readers. setpiece.mjs is
// now being wired as the reader, so the shape below is a CONTRACT, not an
// implementation detail. Nothing here may be renamed or reordered without
// updating the reader in the same change.
//
//   {
//     schema_version : 1                       // bump only on a breaking change
//     generated_at   : ISO-8601 string         // when THIS graph was synthesised
//     date           : "YYYY-MM-DD" (local)    // the day it belongs to
//     source         : "cortex-consolidate (opus)"
//     node_count     : int  (=== nodes.length)
//     edge_count     : int  (=== edges.length)
//     nodes          : [{ id: <concept id from concepts.json>,
//                         fluency: "learning"|"holding"|"fluent"|"unknown" }]
//     edges          : [{ from: <id>, to: <id>, kind: "prereq"|"related"|"confused-with" }]
//     clusters       : [{ name: <short theme>, concepts: [<id>, …] }]
//     next_unlocks   : [<id>, …]               // BARE STRINGS, not objects
//     concepts_considered : int                // the size of the grounding set
//     fluency_known  : int                     // how many of those have a MEASURED fluency
//   }
//
// GROUNDING GUARANTEE the reader may rely on: every id in nodes/edges/clusters/
// next_unlocks is a member of concepts.json's concept ∪ skill id set. Anything
// the model invented is dropped before the write. Arrays are always present
// (possibly empty) — a reader never has to null-check them.
//
// HONESTY the reader MUST carry through (#106): `fluency_known / concepts_considered`
// is a have/need counter. Live on 4 Aug 2026 it reads 2/38 — 36 nodes say
// "unknown" because learning_state.json has only ever seen two concepts. A
// surface that presents `next_unlocks` as a ready plan without showing that
// ratio is reporting a 2-datapoint inference as a 38-datapoint one.
const CONCEPT_GRAPH_SCHEMA = 1;

function buildConsolidationPrompt(concepts, fluency) {
  const cList = concepts.slice(0, 120).join(", ");
  const fLines = fluency.slice(0, 60).map(f => `${f.id}: ${f.fluency}`).join(" · ");
  return `You build a CONCEPT GRAPH for a personal AI-learning system — a map of how the learner's concepts connect, so his overnight brain can see the terrain. Use ONLY the concepts listed; invent no fluency he hasn't shown. Reply with STRICT JSON, no prose, no code fence:
{"nodes":[{"id":"<concept from the list>","fluency":"learning|holding|fluent|unknown"}],"edges":[{"from":"<concept>","to":"<concept>","kind":"prereq|related|confused-with"}],"clusters":[{"name":"<short theme>","concepts":["<concept>"]}],"next_unlocks":["<concept he is ready to learn next: its prereqs are fluent/holding>"]}
Every node id and every edge endpoint MUST be one of the listed concepts. Ground edges in real dependency (e.g. embeddings -> vector-search is a prereq).
CONCEPTS: ${cList}
CURRENT FLUENCY: ${fLines || "(none logged yet)"}`;
}

function gatherCorpus(deps = {}) {
  const cj = deps.concepts !== undefined ? deps.concepts : readJson(CONCEPTS);
  const idOf = (c) => typeof c === "string" ? c : (c && (c.id || c.concept || c.name));
  const idsOf = (coll) => Array.isArray(coll) ? coll.map(idOf).filter(Boolean) : (coll && typeof coll === "object" ? Object.keys(coll) : []);
  let concepts = [];
  if (Array.isArray(cj)) concepts = cj.map(idOf).filter(Boolean);
  // canonical concepts.json = { concepts: {id:{...}}, skills: {id:{...}}, version, _comment, axes }
  else if (cj && typeof cj === "object" && (cj.concepts || cj.skills)) concepts = [...idsOf(cj.concepts), ...idsOf(cj.skills)];
  else if (cj && typeof cj === "object") concepts = Object.keys(cj).filter(k => !k.startsWith("_"));   // last-resort flat map
  const lj = deps.lstate !== undefined ? deps.lstate : readJson(LSTATE);
  const arr = lj && (lj.concepts || lj.ladder);
  const fluency = Array.isArray(arr)
    ? arr.map(c => ({ id: idOf(c), fluency: String(c.fluency || c.stage || "unknown").replace(/[^a-z]/gi, "") || "unknown" })).filter(c => c.id)
    : [];
  return { concepts: [...new Set(concepts)], fluency };
}

// ── #71 · THE SILENT NO-OP ──────────────────────────────────────────────────
// MEASURED 4 Aug 2026 over the live brain_ledger.jsonl: `cortex_consolidate` has
// 11 rows on 8 DISTINCT DAYS (18, 19, 20, 22, 23, 25, 29 Jul · 2 Aug) — for a
// task that fires DAILY at 03:00 and has been registered since 18 Jul. 18
// calendar days, 8 with a trace: on the other 10 the pass returned before the
// FIRST ledger append, printed a line into a wscript window with no redirect,
// and exited 0. Task Scheduler recorded "Last Result 0" — clean success — for a
// nightly Opus consolidation that never ran. dressing-room/club/
// ORGANISM_RESEARCH_2026-07-31.md:203 named this on 31 Jul; it was still true
// today (concept_graph.json's generated_at was 2 days stale).
// The fix is not to force the pass through the gate — the gate is correct. It is
// that EVERY outcome now leaves a row. A skip is a fact about the organism's
// budget; an unrecorded skip is an unmeasured silence rendered as success.
function consolidationLedgerRow(now, extra = {}) {
  return {
    ts: now.toISOString(), job: "cortex_consolidate", engine: "claude", model: "opus",
    input_tokens: null, output_tokens: null, total_tokens: 0, duration_ms: 0,
    ok: false, error: null, limit_hit: false, ran: false, ...extra,
  };
}
async function runConsolidation(deps = {}) {
  const now = deps.now || new Date();
  const brainCfg = deps.brainCfg || loadBrainConfig();
  const cfg = deps.cfg || loadThalamusConfig();
  const env = deps.env || process.env;
  const log = deps.log || (() => {});
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  // a ledger write is telemetry: it must never be able to kill the pass it measures
  const meter = (row) => { try { ledger(row); } catch { } };
  // every early return goes through here — that is the whole point of #71
  const bail = (skipped, extra = {}) => {
    meter(consolidationLedgerRow(now, { skipped, error: `did not run: ${skipped}`, ...extra }));
    log(`cortex: consolidate did NOT run — ${skipped}`);
    return { ok: false, skipped, ...extra };
  };
  if (brainCfg.guards && brainCfg.guards.refuse_if_api_key_env && env.ANTHROPIC_API_KEY) {
    return { ...bail("API-key refusal (Max plan only, never metered)"), refused: true };
  }
  const { concepts, fluency } = gatherCorpus(deps);
  if (concepts.length < 3) return bail(`too few concepts (${concepts.length}/3 needed)`);
  // budget gate — the SAME conservative floor as a deep read (never overshoot the meter)
  const hr = deps.headroom || headroom(brainCfg, readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, now);
  const mtf = maxThinkingFor(hr.phase, hr.allowed);
  const minHeadroom = Math.max((cfg.deep && cfg.deep.min_headroom_tokens) || 50000, mtf.min_headroom_tokens);
  if (hr.allowed < minHeadroom) return bail(`no-headroom (${hr.allowed}/${minHeadroom} needed, phase ${hr.phase})`, { headroom_allowed: hr.allowed, headroom_needed: minHeadroom });
  const deepCfg = { ...cfg, deep: { ...cfg.deep, max_thinking_tokens: mtf.max_thinking_tokens } };
  const call = deps.call || ((p) => claudeDeep(p, deepCfg));
  const r = await call(buildConsolidationPrompt(concepts, fluency));
  meter({ ts: now.toISOString(), job: "cortex_consolidate", engine: "claude", model: "opus", input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null, total_tokens: r.total_tokens || 0, duration_ms: r.duration_ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit, ran: true });
  if (!r.ok) return { ok: false, error: r.error, tokens: r.total_tokens || 0 };
  let graph;
  try { graph = JSON.parse(String(r.text || "").replace(/^```json\s*|\s*```$/g, "").trim()); } catch { return { ok: false, error: "unparseable graph", tokens: r.total_tokens }; }
  // GROUND it — ONLY concepts from the real set survive (no hallucinated ids in ANY lane),
  // nodes deduped, fluency clamped to the enum. Every concept-bearing field is filtered.
  const set = new Set(concepts);
  const FLU = new Set(["learning", "holding", "fluent", "unknown"]);
  const seen = new Set();
  const nodes = (Array.isArray(graph.nodes) ? graph.nodes : [])
    .filter(n => n && set.has(n.id) && !seen.has(n.id) && seen.add(n.id))
    .map(n => ({ id: n.id, fluency: FLU.has(String(n.fluency)) ? n.fluency : "unknown" }));
  const edges = (Array.isArray(graph.edges) ? graph.edges : []).filter(e => e && set.has(e.from) && set.has(e.to) && e.from !== e.to);
  if (!nodes.length) return { ok: false, error: "no valid nodes", tokens: r.total_tokens };
  const clusters = (Array.isArray(graph.clusters) ? graph.clusters : [])
    .map(c => ({ name: c && c.name, concepts: Array.isArray(c && c.concepts) ? c.concepts.filter(x => set.has(x)) : [] }))
    .filter(c => c.concepts.length);
  // #72 — THE FILE THE READER RELIES ON. Field names and types are the contract
  // documented at CONCEPT_GRAPH_SCHEMA above; every array is always present.
  // fluency_known/concepts_considered is the have/need counter (#106) that stops
  // a downstream surface from presenting a 2-datapoint inference as a 38-datapoint
  // one — `fluency` here is only as good as learning_state.json's coverage.
  const measuredFluency = (fluency || []).filter(f => f && f.fluency && f.fluency !== "unknown" && set.has(f.id));
  const out = {
    schema_version: CONCEPT_GRAPH_SCHEMA,
    generated_at: now.toISOString(),
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    source: "cortex-consolidate (opus)",
    node_count: nodes.length, edge_count: edges.length,
    nodes, edges, clusters,
    next_unlocks: Array.isArray(graph.next_unlocks) ? graph.next_unlocks.filter(x => set.has(x)) : [],
    concepts_considered: concepts.length,
    fluency_known: measuredFluency.length,
  };
  (deps.write || ((o) => writeAtomic(CONCEPT_GRAPH, o)))(out);
  return { ok: true, nodes: nodes.length, edges: edges.length, tokens: r.total_tokens, next_unlocks: out.next_unlocks, concepts_considered: out.concepts_considered, fluency_known: out.fluency_known };
}

// #71 — how stale is the artifact on disk? A DAILY job's own contract is that
// the graph is today's; anything else means one or more nightly passes did not
// land. No threshold is invented here — the cadence IS the standard.
function graphFreshness(now = new Date(), deps = {}) {
  const g = deps.graph !== undefined ? deps.graph : readJson(CONCEPT_GRAPH);
  if (!g) return { exists: false, fresh: false, age_days: null, generated_at: null };
  const gen = g.generated_at ? new Date(g.generated_at) : null;
  if (!gen || isNaN(gen)) return { exists: true, fresh: false, age_days: null, generated_at: g.generated_at || null };
  const dayOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const age = Math.floor((new Date(dayOf(now)) - new Date(dayOf(gen))) / 86400000);
  return { exists: true, fresh: age <= 0, age_days: age, generated_at: g.generated_at };
}

// ---------------------------------------------------------------------------
// THE RESTART DOOR (dead-wire repair, 11 Aug 2026) — A REPAIR NOBODY LOADS IS NOT A REPAIR
// ---------------------------------------------------------------------------
// WHAT WAS DEAD. Node caches a module at load, so the process serving wakes is
// whatever code existed when it BOOTED. Measured on his box the hour this was
// written: PID 13272 `node scripts\cortex.mjs`, CreationDate 09-08-2026
// 01:17:29 — older than every repair in this file, including the two the header
// above describes as fixed (the capsule door at :102, the moment door at :266).
// So the live deep brain was still cutting his capsule at 1,500 raw chars and
// head-cutting the bound moment at 2,500 while this file's suite ran green.
//
// THE ORGANISM ALREADY KNEW, AND THE CHAIN DIED ON THE LAST INCH. conductor.mjs
// :558-567 catches it ("STALE BUILD — running code older than its module
// graph"); daemon_watchdog.mjs:541 turns that verdict into a captain's card;
// card c34 `daemon:stale:cortex:2026-08-10` has sat on the deck since 10 Aug
// 18:04 asking "Restart karun?". And it carried dispatch {kind:"none"} — his
// haan would have RETIRED the ask and restarted nothing, because NO ORGAN IN
// THE REPO COULD RESTART A RESIDENT DAEMON. The only kill anywhere is
// setup/open_dugout.ps1:12, and that is his own voice surface
// (`grep -rn "taskkill\|Stop-Process" scripts setup`).
//
// WHY THE DOOR IS HERE AND NOT A KILL SOMEWHERE ELSE. daemon_watchdog.mjs's own
// LAWS line reads "never kills anything (relaunch only)" and conductor.mjs says
// "a stale daemon is still never auto-relaunched". Both stand untouched. This
// is not a kill: the daemon retires ITSELF and releases :4112, and the
// watchdog's EXISTING dead-port arm (decidePass → launchDetached, port-locked
// daemons relaunch on the first false probe) brings the fresh build up on its
// own 10-minute cadence — proven live, not assumed: last pass 2026-08-11
// T00:51:43Z written into daemon_watchdog.json, schtasks "Last Run Time
// 11-08-2026 06:21:01 / Next 06:31, Repeat every 10 minutes". No new launcher,
// no new scheduler, and no second relauncher to race the first.
//
// NOTHING HERE FIRES ITSELF. The trigger is his haan on the card
// (captains_call.mjs RESTART_DOOR → `node scripts/cortex.mjs restart`).
// Auto-retiring on a source change would be the machine killing a live daemon
// without his word, which is exactly what both files above refuse.
//
// NO /status ROUTE, DELIBERATELY. conductor's build check is two-tier: WITH a
// /status stamp it compares only the ENTRY file's mtime (conductor.mjs:584);
// WITHOUT one it falls through to the whole import GRAPH via the process table
// (:558). Cortex's 10 Aug stale verdict came from `scripts/brain.mjs`, not from
// cortex.mjs — so answering /status would have retired the wider instrument and
// the detection would have MISSED. Silence is the more honest answer here until
// conductor's tier 1 learns to read the graph too.
//
// THE PAID ANSWER IS NEVER DESTROYED. An armed restart waits for every lane to
// close (restartReady) — the same money this file already spools to
// cortex_unsent.jsonl rather than lose. There is no timeout and no forced exit:
// a lane that never resolves keeps the OLD build alive, which is precisely
// today's status quo and is strictly safer than dropping an Opus read in flight.
// ---------------------------------------------------------------------------

// Pure router for the :4112 lock server, which until today was
// `createServer(() => {})` — a socket that accepts and answers nothing. Pure so
// the suite can hold the contract without binding the port (the same reason
// laneResolved lives outside main()).
function lockRoute(method, url) {
  if (String(method || "").toUpperCase() === "POST" && String(url || "") === "/restart") {
    return { arm: true, status: 200, body: { ok: true, armed: true,
      note: "cortex retires when no deep lane is in flight; daemon_watchdog's next pass launches the fresh build" } };
  }
  return { arm: false, status: 404, body: { ok: false,
    error: "cortex holds :4112 as a singleton lock — the only door is POST /restart" } };
}

// An armed restart may only land on an IDLE daemon. Exported (at the foot of the
// file, with its siblings) and explicit, so a future lane counter cannot quietly
// stop being consulted.
function restartReady({ armed, inflight }) {
  return armed === true && inflight === 0;
}

// The knock is bounded by the ONE localhost-probe timeout this organism has
// already MEASURED — conductor.mjs's PROBE_TIMEOUT_MS (400ms; its own header
// records /status round-trips of 21-30ms on this box, i.e. 13x the worst case).
// No number is invented here; it is copied with its source named, rather than
// imported, so `restart` costs no extra module load on a hand poke. If conductor
// ever re-tunes it: `grep -n PROBE_TIMEOUT_MS scripts/conductor.mjs`.
// It matters because the port can also be held for a heartbeat by `tick`'s
// no-response probe server — an unbounded fetch there would hang the anchor that
// dealt him the card.
const RESTART_KNOCK_MS = 400;

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "tick") {
    // E2E audit 25 Jul 2026: tick used to return BEFORE the :4112 singleton lock below,
    // whose whole reason for existing is "two cortexes racing one wake = double Opus
    // spend". A queue row only closes when an answer posts back, so a manual poke while
    // the daemon was 40s into an extended read served the SAME moment a second time —
    // the attempt counter lives in a file and gives no cross-process protection. tick now
    // takes the same lock, and stands down if the daemon already holds it (the daemon is
    // already serving that queue, within 5s). The lock is released before we exit.
    const { createServer: mkSrv } = await import("node:http");
    const held = await new Promise((resolve) => {
      const s = mkSrv(() => {});
      s.on("error", () => resolve(null));
      s.listen(4112, "127.0.0.1", () => resolve(s));
    });
    if (!held) { console.log("cortex: the daemon holds the lock (:4112) and is already serving the queue — tick stands down."); return; }
    try {
      const r = await serveWakes({ log: console.log });
      console.log(`cortex: ${r.served ? `served ${r.served} wake(s)${r.queued ? `, ${r.queued} still queued` : ""}` : r.idle ? "no pending wake" : (r.results || []).some(x => x.refused) ? "refused (API key)" : JSON.stringify(r)}`);
    } finally { try { held.close(); } catch { } }
    return;
  }
  if (mode === "restart") {
    // HIS WORD IS THE ONLY TRIGGER — captains_call.mjs dispatches this when he
    // answers haan on the STALE BUILD card (RESTART_DOOR there names exactly
    // this argv). It kills nothing: it knocks, and reports what the daemon said.
    let said = null, err = null;
    try {
      const r = await fetch("http://127.0.0.1:4112/restart", { method: "POST", signal: AbortSignal.timeout(RESTART_KNOCK_MS) });
      said = await r.json().catch(() => ({ ok: r.ok }));
    } catch (e) { err = String((e && e.message) || e); }
    if (err) {
      // Nothing answered. Either no cortex is running (the watchdog's next pass
      // starts one) or a `tick` holds the lock without a router — say which is
      // possible, never guess which it was.
      console.log(`cortex: :4112 did not answer the restart knock (${err.slice(0, 80)}) — either no daemon is up (daemon_watchdog's next pass launches one) or a tick holds the lock; nothing was changed.`);
      return;
    }
    console.log(said && said.armed
      ? "cortex: RESTART ARMED — the daemon retires as soon as no deep lane is in flight, then daemon_watchdog's next pass (its own 10-minute cadence) launches the build that HAS the repairs. Manual verb if you will not wait: wscript setup\\START_DAEMONS.vbs"
      : `cortex: :4112 answered but did NOT arm — ${JSON.stringify(said).slice(0, 160)}`);
    return;
  }
  if (mode === "consolidate") {
    // OVERNIGHT DEEPENING (P5) — one nightly Opus pass → concept_graph.json
    const r = await runConsolidation({ log: console.log });
    console.log(r.ok
      ? `cortex: concept graph → ${r.nodes} nodes, ${r.edges} edges${r.next_unlocks && r.next_unlocks.length ? " · next: " + r.next_unlocks.slice(0, 3).join(", ") : ""} (${(r.tokens || 0).toLocaleString()} tok) · fluency measured for ${r.fluency_known}/${r.concepts_considered} concepts`
      : `cortex: consolidate DID NOT RUN — ${r.skipped || r.error || (r.refused ? "API-key refusal" : "unknown")}`);
    // #71 — THE EXIT CODE IS THE ONLY THING THE CAPTAIN EVER SEES. This job runs
    // under wscript with no redirect (see finding #16), so the line above dies in
    // a closing window; Task Scheduler's "Last Result" is the whole surface. It
    // read 0 — clean success — on the 10 of 18 days this pass never ran at all.
    // The standard is the job's OWN daily cadence, not an invented threshold:
    // green iff the graph on disk is today's.
    const f = graphFreshness(new Date());
    if (!f.exists) console.log("cortex: concept_graph.json does NOT exist — no consolidation has ever landed");
    else if (!f.fresh) console.log(`cortex: concept_graph.json on disk is ${f.age_days === null ? "undated" : `${f.age_days} day(s) old`} (generated_at ${f.generated_at}) — a DAILY pass that leaves a stale artifact is not a success`);
    process.exitCode = f.fresh ? 0 : 1;
    return;
  }
  // SINGLETON LOCK — two cortexes racing one wake = double Opus spend. The
  // lock is a localhost port (4112, one below the thalamus), same pattern as
  // every daemon in the club: second instance stands down silently.
  const { createServer } = await import("node:http");
  // M14 — PER-LANE dispatch (see below). DECLARED BEFORE THE LOCK since 11 Aug
  // 2026: the restart door answers requests the instant the port binds, and it
  // reads this set to decide whether a paid lane is in flight.
  const inflight = new Set();
  let restartArmed = false;
  // THE RESTART DOOR (see its header above) — the lock is no longer a black hole.
  const lock = createServer((req, res) => {
    const r = lockRoute(req.method, req.url);
    if (r.arm) restartArmed = true;
    res.writeHead(r.status, { "Content-Type": "application/json", "Connection": "close" });
    res.end(JSON.stringify(r.body));
    if (r.arm) {
      console.log(`cortex: RESTART REQUESTED (his word, via captains_call) — ${inflight.size ? `${inflight.size} lane(s) in flight, retiring the moment they close` : "no lane in flight"}.`);
      retireIfArmed();
    }
  });
  await new Promise((resolve) => {
    lock.on("error", (e) => { if (e.code === "EADDRINUSE") { console.log("cortex: another cortex holds the lock (:4112) — standing down."); process.exit(0); } throw e; });
    lock.listen(4112, "127.0.0.1", resolve);
  });
  // Consulted at EVERY point the lane count can change — on arm, when a lane
  // closes, and on the existing 5s poll — so an armed restart can never sit
  // waiting on an event that already happened. Hoisted (function declaration) so
  // the lock's handler above can call it.
  function retireIfArmed() {
    if (!restartReady({ armed: restartArmed, inflight: inflight.size })) return;
    console.log("cortex: every lane idle — releasing :4112 and exiting. daemon_watchdog's next pass launches the fresh build (manual verb: wscript setup\\START_DAEMONS.vbs).");
    // The OS frees the port on exit regardless; these two are tidiness, and
    // closeAllConnections is what stops a keep-alive socket from holding close()
    // open. No wait, no timeout — an exit that needs a deadline is a hang.
    try { lock.closeAllConnections && lock.closeAllConnections(); } catch { }
    try { lock.close(); } catch { }
    process.exit(0);
  }
  console.log("cortex: deep-brain daemon — watching wake_queue.jsonl (fs.watch + 5s poll, up to 2 concurrent lanes)");
  // M14 — PER-LANE dispatch: a wake arriving while another is being served
  // starts IMMEDIATELY in a free lane (a batch-wide busy flag would serialize
  // bursts). One shared runtime object so concurrent attempt-saves merge.
  const cfgT = loadThalamusConfig();
  const K = Math.max(1, (cfgT.deep && cfgT.deep.concurrency) || 2);
  const ttlMs = ((cfgT.deep && cfgT.deep.queue_ttl_min) || 30) * 60000;
  const runtime = readJson(RUNTIME) || { attempts: {} };
  const fire = () => {
    try {
      let pending = pendingWakes(readLines(WQUEUE));
      if (!pending.length) {
        const w = readJson(WAKE);
        if (w && w.status === "pending" && w.moment_id && !w.consumed) pending = [w];
      }
      const now = new Date();
      // E2E audit 25 Jul 2026: the daemon rewrote cortex_runtime.json on every attempt
      // but never dropped a closed moment, so the file grew for the life of the system.
      pruneRuntime(runtime, pending.map(w => w.moment_id).concat([...inflight]));
      for (const w of pending) {
        if (inflight.has(w.moment_id)) continue;
        if (inflight.size >= K) break;
        inflight.add(w.moment_id);
        if (w.ts && now - new Date(w.ts) > ttlMs) {
          defaultPost("/deep-answer", { moment_id: w.moment_id, declined: true, reason: "expired-in-queue", provenance: "cortex" })
            .catch(() => {}).finally(() => { inflight.delete(w.moment_id); retireIfArmed(); });
          continue;
        }
        console.log(`cortex: lane open for ${w.moment_id} (${inflight.size}/${K})`);
        // E2E audit 25 Jul 2026: the re-entry used to be unconditional (`.finally(… fire())`).
        // A lane that did NOT close its wake — failed call, spooled answer, plan-limit hold,
        // API-key refusal — left the moment pending, so re-entering immediately re-dispatched
        // the SAME wake with no delay: a hot loop that ate the attempt cap (and, before the
        // lifeboat, real Opus spend) in milliseconds. Only an acknowledged close re-opens the
        // dispatcher; anything else waits for the 5s poll. See laneResolved.
        let resolved = false;
        serveOne(w, { log: console.log, runtime })
          .then(r => { resolved = laneResolved(r); })
          .catch(e => console.log("cortex: " + String(e.message).slice(0, 120)))
          // retireIfArmed BEFORE the re-entry: an armed restart that waited for
          // this lane must not be overtaken by the next dispatch (11 Aug 2026).
          .finally(() => { inflight.delete(w.moment_id); retireIfArmed(); if (resolved) fire(); });
      }
    } catch (e) { console.log("cortex: " + String(e.message).slice(0, 120)); }
  };
  let deb = null;
  try { watch(STATE_DIR, (ev, f) => { if (f === "wake_queue.jsonl" || f === "wake.json") { clearTimeout(deb); deb = setTimeout(fire, 400); } }); } catch { }
  // The third and last place the lane count is re-read: a restart armed while
  // the queue was empty has no lane close to ride, so the poll is its floor.
  setInterval(() => { retireIfArmed(); fire(); }, 5000);
  fire();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { serveWake, serveWakes, serveOne, buildDeepPrompt, claudeDeep, claudeDeepAsync, findCapsule, runConsolidation, buildConsolidationPrompt, gatherCorpus,
  // WIRING AUDIT 11 Aug 2026 — the moment door and the engine it replaced, exported
  // for the same reason graphFreshness below is: an auditor must be able to assert
  // what actually reaches the deep brain without re-implementing the door and
  // measuring its own copy (which is how the 220-char capsule cut stayed invisible).
  momentBlock, momentBlockLegacy, MOMENT_BUDGET_CHARS,
  // dead-wire repair 11 Aug 2026 — the restart door's two decisions, exported for
  // the same reason: an auditor must be able to assert that a stale build has a
  // way out without binding :4112 and killing the live deep brain to find out.
  lockRoute, restartReady,
  // audit 4 Aug 2026 — #71/#72 seams: the staleness standard and the reader's
  // schema version, exported so a consumer can assert the contract it relies on
  graphFreshness, CONCEPT_GRAPH_SCHEMA, CONCEPT_GRAPH };
