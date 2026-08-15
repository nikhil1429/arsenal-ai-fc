#!/usr/bin/env node
// ============================================================================
// gaffer_brain.mjs · ARSENAL AI FC — THE WATCHER: the Gaffer's judgment organ
// ----------------------------------------------------------------------------
// SOLE WRITER of: dressing-room/state/gaffer_brain.jsonl   (every judgment, append-only)
//                 dressing-room/state/gaffer_blocks.json    (the memory blocks + the cursor)
// Nothing else may write either file. Read them from anywhere.
//
// WHY THIS EXISTS — his ruling, 15 Aug 2026, after the Gaffer's Day-One sitting
// produced ZERO study in 13m42s:
//     "It should be agnostic. Session agnostic, vocab agnostic."
//     "why do you guys create the code in such a way that it is just based
//      [on the last incident]"
//     "All I wanted was gaffer to have a real working brain twenty four seven
//      working so it can think and answer me and change his behavior on the spot."
// THE FAULT HE IS NAMING: the Gaffer was governed by TEXT and by WORD LISTS.
// Text cannot hold state, cannot judge meaning, and cannot check itself. A word
// list cannot do any of those either — it can only ask "did he happen to use one
// of these words".
//
// ── THE MEASUREMENT THAT DECIDED THE BUILD (run 15 Aug 2026, live files) ─────
// Two failures, in OPPOSITE directions, from the same cause:
//
//   UNDER-FIRE. On 15 Aug he corrected the Gaffer's memory FIVE times while calm
//   — "you don't remember it" · "that is a bit weird" · "we were talking about
//   something else... why is it happening?" · "what did I ask you just" · "I told
//   you something about 15th of August. Do you remember anything about it?" —
//   and gaffer_state's FORGOT regex matched ZERO of them. Measured: forgot_flags
//   sat at 0 across all 24 of his turns, so the highest-priority intervention in
//   the whole surface (the one that says do NOT guess, USE A TOOL) never fired,
//   in the exact sitting it was built for. Reproduce:
//     grep -n "LEGACY forgot_flags" scripts/gaffer_brain.mjs   (the selftest below runs it)
//
//   OVER-FIRE, and this half was NOT in the work order — it was found by reading
//   the live file rather than the plan. gaffer_standing.json held THIRTEEN
//   "standing instructions" and at least six of them are not instructions at all:
//     · "I want you to explain it in detail. I don't know what we are talking about"
//     · "So what are these papers actually? I I I don't remember it."
//     · "Jaffo, sorry to interrupt you but my dearest and my lovable friend
//        Adhikari is watching you for the first time."
//     · "I don't want to know it right now."
//   Every one of them passed the 3-gate word list the same way: DIRECTIVE via
//   "i want you to", PERMANENCE/PROHIBITION via the "don't" inside "I don't know".
//   And renderBrief injects the last twelve into his LIVE context window every
//   sitting — so the Gaffer opened every day believing "what are these papers
//   actually?" was one of his permanent laws.
//
// A gate that decides by vocabulary fails BOTH ways at once, and no amount of
// tuning the list fixes it, because the list was never the thing that decides
// whether a man meant a rule. MEANING decides that, and only a model can read
// meaning. So: THE WATCHER JUDGES, the word lists stay frozen as the degraded-
// mode fallback (LAYERING law — they are what runs when the free pool is dry).
//
// ── LAWS THIS ORGAN OBEYS ────────────────────────────────────────────────────
//  1. THE BRAIN NEVER BLOCKS THE MOUTH. `judge` is spawned detached from the
//     /transcript door and its output is collected by the 3s /deep poll. Every
//     path out of `judge` exits 0; a dead pool, a bad key, a malformed model
//     reply and a missing file all degrade to the legacy verdict, never to an
//     error the captain can feel. Same law as hooks/afferent-post.mjs.
//  2. VOCAB-AGNOSTIC, SESSION-AGNOSTIC (his ruling, above). There is not one
//     regex in this file that tests HIS words. The only patterns here parse the
//     transcript's own machine-written `CAPTAIN:`/`GAFFER:` prefixes and the
//     model's JSON. A fixture from 15 Aug is used to TEST this organ; it is
//     never used to steer it.
//  3. NEVER TRUST THE MODEL'S SHAPE. Everything that comes back is validated
//     field by field by `normalizeJudgment`, which is pure and total: any shape
//     at all goes in, a legal judgment or null comes out.
//  4. THE AUDIT TRAIL IS THE PRODUCT. Every judgment — including the ones that
//     concluded nothing, and including the fallbacks — lands in
//     gaffer_brain.jsonl with its engine, model, latency and input size. His own
//     words: "Every single thing has to be created in such a way that it can be
//     analyzed, and it can be triggered."
//  5. IT WORKS WITH THE GAFFER CLOSED. The input is the transcript on disk and
//     the afferent bus tail, never a socket — so a correction he types into
//     Claude Code is judged by the same organ that judges what he says out loud.
//  6. ZERO CLAUDE TOKENS on the per-turn path. The Watcher is Gemini Flash on
//     the same free 9-key pool the chalkboard and read_url already ride
//     (grep -n "function loadKeys" scripts/dugout.mjs). Opus is woken by MEANING
//     and by the deep lane that already exists — never from inside this loop.
//  7. NO NUMBER IS GUESSED. Every threshold here is either derived from a law he
//     already stated, or inherited from an organ that measured it. Each one says
//     which, in place.
//
// ── THE CACHE ORDER IS PART OF THE CONTRACT ─────────────────────────────────
// Gemini implicit caching discounts a shared PREFIX. A sitting transcript is
// append-only, which is exactly the right shape, so the prompt is built
//   [stable: rules + blocks + who-he-is + the sitting so far] → [volatile: the new turns]
// and buildWatcherPrompt is the only place that order lives. Reordering it does
// not break correctness — it breaks the bill, silently, which is worse.
//
// MODES: node scripts/gaffer_brain.mjs judge [--dry]   → judge whatever is new since the cursor
//        node scripts/gaffer_brain.mjs note             → the freshest live note as JSON (what /deep reads)
//        node scripts/gaffer_brain.mjs blocks [--raw]   → the memory blocks
//        node scripts/gaffer_brain.mjs status           → counts, engines, last judgment
//        node scripts/gaffer_brain.mjs probe            → ONE live Flash call (the free-pool probe)
//        node scripts/gaffer_brain.mjs grade <concept> <axis>  → the Cerebras lane
//        node scripts/gaffer_brain.mjs selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, renameSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";
// The legacy engine, imported rather than re-implemented: when the Watcher is
// unavailable this organ returns the SAME verdict the surface had yesterday, so a
// dry key pool is a degradation and never a regression. gaffer_state.mjs imports
// nothing from here — the dependency is one-way by design, because its own
// selftest proves it can reach neither the network nor a subprocess.
import { observe as observeLegacy, supervise as superviseLegacy, emptyState, isStanding as isStandingLegacy, MONOLOGUE_WORDS } from "./gaffer_state.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const HIPPO_DIR = join(ROOT, "dressing-room", "hippocampus");
// Every path a sink can reach is a module-level constant. That is not style: it
// is what keeps this organ legible to xray's static analyser, whose per-organ
// unresolved-sink ratchet is a real budget (scripts/xray.mjs, "NON-INCREASING
// PER ORGAN"). A path assembled inside a function is an Unknown to it.
const JOURNAL = join(STATE_DIR, "gaffer_brain.jsonl");
const BLOCKS = join(STATE_DIR, "gaffer_blocks.json");
const GSTATE = join(STATE_DIR, "gaffer_state.json");
const GSTANDING = join(STATE_DIR, "gaffer_standing.json");
const WHO = join(HIPPO_DIR, "who_he_is.json");
const AFFERENT = join(STATE_DIR, "afferent.jsonl");
const DUGOUT_DIR = join(STATE_DIR, "brain_out", "dugout");
const CAPSULE_DIR = join(STATE_DIR, "capsules");
const CEREBRAS_ENV = join(os.homedir(), ".cerebras", ".env");
const GEMINI_ENV = join(os.homedir(), ".gemini", ".env");

const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
// gemini-flash-latest, the same alias the chalkboard and read_url already ride on
// the free pool. Overridable so a model rename is one env var, never an edit.
const WATCHER_MODEL = process.env.GAFFER_WATCHER_MODEL || "gemini-flash-latest";
// 20s. NOT a guess and NOT a latency target: it is the ceiling past which a
// judgment is worthless rather than late, because the /deep poll drops any note
// older than 60s (dugout.mjs's own recall-lane freshness) and the spawn + node
// boot already spends ~1s of that. A Flash call that has not answered in 20s has
// lost the turn it was about.
const WATCHER_DEADLINE_MS = Number(process.env.GAFFER_WATCHER_MS) || 20000;
// 60s, inherited verbatim from the /deep hint contract (dugout.mjs: "a correction
// that arrives two minutes after the turn it is about would land on a different
// conversation and read as a non-sequitur"). Not a new number.
export const NOTE_FRESH_MS = 60000;
// The sitting so far is the cache prefix. 40,000 chars ≈ 10k tokens ≈ 1% of
// Flash's 1M window; his longest sitting to date (13 Aug, 125 lines) is 25k.
// The bound exists so a pathological day cannot turn one turn into a huge bill,
// not because the window is tight.
const PREFIX_MAX = 40000;
// The volatile half: at most this many new turns are judged in one call. Six is
// the /transcript door's own flush size (dugout.mjs: `if(txBuf.length>=6)flush()`),
// so this is the door's batch, not a number invented here.
const DELTA_MAX_TURNS = 6;

const readJson = (p, d = null) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const clip = (s, n) => { const t = String(s == null ? "" : s); return t.length > n ? t.slice(0, n) : t; };
// tmp+rename, the house writeAtomic. The pid suffix is the same guard archivist
// and watchman use: two processes must never share a temp name.
function writeAtomic(p, obj) {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = p + ".tmp" + process.pid;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, p);
}

// ---------------------------------------------------------------------------
// THE KEY POOL — read, never stored, never logged
// ---------------------------------------------------------------------------
// Deliberately duplicated from dugout.mjs loadKeys() rather than imported:
// importing dugout.mjs pulls brain.mjs, hippocampus.mjs, talk.mjs, thalamus.mjs
// and six more into a process that must boot in milliseconds and must never have
// a reason to touch the bridge's own state. Nine lines are cheaper than that
// graph, and the shape is asserted against the original in the selftest.
export function loadGeminiKeys(envText = null) {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  const text = envText !== null ? envText : (existsSync(GEMINI_ENV) ? readFileSync(GEMINI_ENV, "utf8") : "");
  for (const line of text.split("\n")) {
    const m = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
    if (m && m[2].trim() && !keys.includes(m[2].trim())) keys.push(m[2].trim());
  }
  return keys;
}

// ---------------------------------------------------------------------------
// THE MEMORY BLOCKS — what text could not hold
// ---------------------------------------------------------------------------
// A block is a small, NAMED, REWRITABLE paragraph the Gaffer reads every turn.
// The difference from a standing-instruction LIST is the whole point of this
// build: a list only ever grows, so the sixth thing he said competes with the
// first, and nothing can ever be superseded without an axis rule guessing at
// which two lines were about the same subject. A block is REPLACED. When he
// changes his mind about pace, the pace block becomes what he said today, and
// what he said last week is in the journal where it belongs — readable, but no
// longer being obeyed.
//
// The five names are the five questions the 15 Aug sitting actually failed, in
// his own words, and they are FIXED: a block set that can grow a new name on the
// model's say-so is a list again, wearing a dictionary's clothes.
export const BLOCK_NAMES = ["how_to_speak", "what_he_asked_for", "what_not_to_do", "where_we_are", "about_him"];
const BLOCK_TITLES = {
  how_to_speak: "HOW TO SPEAK TO HIM",
  what_he_asked_for: "WHAT HE ASKED FOR — and has not been given yet",
  what_not_to_do: "WHAT HE HAS TOLD YOU NOT TO DO",
  where_we_are: "WHERE THIS SITTING ACTUALLY IS",
  about_him: "WHAT YOU LEARNED ABOUT HIM",
};
// 600 chars ≈ 150 tokens per block. Derived from the surface it rides: the whole
// block set must stay small enough to sit inside a live system instruction that
// already carries the constitution, the fingerprint and the capsule digest —
// five blocks × 600 is 3,000, about a fifth of what buildOpeningBriefing alone
// used to cost when it re-fired every turn.
const BLOCK_MAX = 600;

export function emptyBlocks(now = new Date()) {
  const blocks = {};
  for (const k of BLOCK_NAMES) blocks[k] = { text: "", sources: [], updated_at: null };
  return {
    v: 1, _writer: "gaffer_brain.mjs", updated_at: now.toISOString(), day: istDay(now),
    blocks,
    // THE CURSOR lives here, in the file this organ owns, for the same reason the
    // archivist's checkpoint lives in _writer/ and not in data/: a reader must
    // never have to guess where a writer keeps its place, and a second file is a
    // second thing that can rot out of sync with the first.
    cursor: { dugout_day: null, dugout_bytes: 0, afferent_bytes: 0 },
    // DELIVERY — the half of the loop that did not exist. A note that was sent and
    // then ignored is indistinguishable, in every log this repo had, from a note
    // that was never sent. See deliveryCheck().
    delivery: { last_note: null, sent_at: null, verdict: null, checked_at: null },
  };
}
export function loadBlocks(path = BLOCKS, now = new Date()) {
  const b = readJson(path, null);
  if (!b || !b.blocks) return emptyBlocks(now);
  const out = emptyBlocks(now);
  for (const k of BLOCK_NAMES) if (b.blocks[k]) out.blocks[k] = { text: clip(b.blocks[k].text, BLOCK_MAX), sources: Array.isArray(b.blocks[k].sources) ? b.blocks[k].sources.slice(-6) : [], updated_at: b.blocks[k].updated_at || null };
  if (b.cursor) out.cursor = { dugout_day: b.cursor.dugout_day || null, dugout_bytes: Number(b.cursor.dugout_bytes) || 0, afferent_bytes: Number(b.cursor.afferent_bytes) || 0 };
  if (b.delivery) out.delivery = b.delivery;
  out.updated_at = b.updated_at || out.updated_at;
  return out;
}

// renderBlocks — the blocks as the Gaffer reads them. Empty blocks render as
// NOTHING, never as an empty heading: an organ with nothing to say must say
// nothing (C3 principle 4), and a heading with no body under it in a live system
// instruction reads to a model as "this was supposed to have content" and invites
// it to fill the gap — which is the exact improvisation failure B15 forbids.
export function renderBlocks(bl) {
  const b = (bl && bl.blocks) || {};
  const L = [];
  for (const k of BLOCK_NAMES) {
    const t = String((b[k] || {}).text || "").trim();
    if (t) L.push(`[${BLOCK_TITLES[k]}]\n${t}`);
  }
  if (!L.length) return "";
  return "THE GAFFER'S OWN MEMORY BLOCKS — these are what HE has told you, held as state rather than\n"
    + "as sentences in a prompt. They are not suggestions and they do not expire when the tab closes.\n"
    + "They were written by the Watcher from his own words; the quotes behind each are in the journal.\n\n"
    + L.join("\n\n");
}

// ---------------------------------------------------------------------------
// THE JUDGMENT — the schema, and the total function that enforces it
// ---------------------------------------------------------------------------
// The model returns JSON; this turns ANY shape into either a legal judgment or
// null. It is pure, it never throws, and it is the only door the model's output
// comes through. Law 3: never trust the model's shape.
export const SIGNALS = ["forgot", "unresolved", "correction", "repeat", "monologue", "ungrounded", "standing_broken"];
// PRIORITY — the order in which two simultaneous signals are resolved into the ONE
// note per turn. It is gaffer_state's own ladder (forgot 100 → unresolved 90 →
// repeat 80 → monologue 70 → standing 60), with the two new signals slotted by the
// same rule that built it: how loudly he complained. `correction` sits with
// `forgot` because on 15 Aug it WAS the forgot signal — he said it five times
// calmly and the word list heard none of them. `ungrounded` sits below the
// monologue because a claim he has not caught yet is cheaper than a turn he is
// already sitting through.
const PRIORITY = { forgot: 100, correction: 95, unresolved: 90, repeat: 80, monologue: 70, standing_broken: 60, ungrounded: 50 };

export function normalizeJudgment(raw) {
  if (!raw || typeof raw !== "object") return null;
  const j = { signals: [], standing: [], blocks: {}, where: null, summary: "" };
  const sigs = Array.isArray(raw.signals) ? raw.signals : [];
  for (const s of sigs) {
    if (!s || typeof s !== "object") continue;
    const kind = String(s.kind || "").trim().toLowerCase();
    if (!SIGNALS.includes(kind)) continue;                 // an invented signal is discarded, never acted on
    const why = clip(s.why, 400).trim();
    if (!why) continue;                                    // a signal with no reason is a guess
    if (j.signals.some((x) => x.kind === kind)) continue;   // one of each kind, at most
    j.signals.push({ kind, why, quote: clip(s.quote, 240).trim() || null });
  }
  const st = Array.isArray(raw.standing) ? raw.standing : [];
  for (const s of st) {
    if (!s || typeof s !== "object") continue;
    const text = clip(s.text, 400).trim();
    if (!text) continue;
    const block = BLOCK_NAMES.includes(String(s.block || "")) ? String(s.block) : "what_he_asked_for";
    j.standing.push({ text, block, durable: s.durable !== false, quote: clip(s.quote, 240).trim() || null });
  }
  if (raw.blocks && typeof raw.blocks === "object") {
    for (const k of BLOCK_NAMES) {
      if (typeof raw.blocks[k] !== "string") continue;
      const t = clip(raw.blocks[k], BLOCK_MAX).trim();
      if (t) j.blocks[k] = t;
    }
  }
  j.where = clip(raw.where, 300).trim() || null;
  j.summary = clip(raw.summary, 300).trim();
  // A judgment that concluded NOTHING is still a judgment and is still recorded —
  // that is how "the Watcher ran and saw nothing" stays distinguishable from "the
  // Watcher never ran", which is the distinction watchman's gaffer-brain-silent
  // check depends on.
  return j;
}

// noteFromJudgment — the ONE note per turn, the same law gaffer_state's supervisor
// obeys ("a stack of corrections injected mid-sitting is the quiz-dump failure
// wearing a new coat"). What changes here is only WHICH signals can fire and how
// they were detected — never how many are delivered.
export function noteFromJudgment(j, ctx = {}) {
  if (!j || !j.signals.length) return null;
  const ranked = [...j.signals].sort((a, b) => (PRIORITY[b.kind] || 0) - (PRIORITY[a.kind] || 0));
  const top = ranked[0];
  const turn = Number(ctx.turn) || 0;
  const plan = ctx.plan ? clip(ctx.plan, 200) : null;
  const head = {
    forgot: "[HE HAS JUST TOLD YOU — IN HIS OWN WAY, WHATEVER WORDS HE USED — THAT YOU LOST SOMETHING HE SAID. Do NOT apologise and do NOT guess. Say plainly that you are checking, then USE A TOOL to find it.",
    correction: "[HE IS CORRECTING YOU ABOUT SOMETHING YOU SAID, AND HE IS CALM ABOUT IT — which is exactly why it is easy to walk past. Take the correction, do not defend the earlier answer, and go and get the real thing with a tool.",
    unresolved: "[HE SAID HE DID NOT FOLLOW IT AND YOU MOVED ON. Go back to it NOW, smaller, from zero — do not re-say it in the same words.",
    repeat: "[HE HAS RAISED THIS BEFORE — the earlier answer did not land. Do NOT repeat it in the same shape. Change the approach: smaller, or a different everyday analogy, or ask him which part broke.",
    monologue: "[THAT TURN WAS TOO LONG. His law is forty seconds — past that it is two turns, not one. Stop, hand him the turn, wait for his word. DHEEMA IS NOT CHHOTA: keep the depth, cut the speed.",
    standing_broken: "[YOU ARE BREAKING SOMETHING HE ALREADY TOLD YOU OUT LOUD. He should not have to say it again.",
    ungrounded: "[YOU JUST ASSERTED SOMETHING YOU DID NOT LOOK UP. \"I don't know, ruk, dekhta hoon\" is a legal answer and a confident guess is not — he can and does check the files.",
  }[top.kind];
  const tail = plan && (top.kind === "forgot" || top.kind === "correction")
    ? ` What the state says you were doing: ${plan}]`
    : "]";
  return {
    kind: top.kind,
    priority: PRIORITY[top.kind] || 0,
    id: `${top.kind}:${turn}:${(j.summary || top.why).length}`,   // stable per turn, so the poll dedupes
    note: `${head} WHAT THE WATCHER SAW: ${top.why}${top.quote ? ` — his words: "${top.quote}"` : ""}${tail}`,
    also: ranked.slice(1).map((s) => s.kind),                     // recorded, never delivered
  };
}

// ---------------------------------------------------------------------------
// THE WATCHER PROMPT — cache-ordered, and about MEANING, never about words
// ---------------------------------------------------------------------------
// THE RULES half is the same bytes on every call, forever, so it is first. Then
// the blocks, then who-he-is, then the sitting so far — each one changing more
// often than the last — and the new turns go LAST. That gradient IS the cache
// (see the header note). The rules deliberately contain no example of his
// vocabulary: an example is a word list with better manners, and his ruling was
// that the code must not be built around the words of the last incident.
const WATCHER_RULES = `You are THE WATCHER. You are not talking to anyone. You read a live conversation between a
man (CAPTAIN) and his voice assistant (GAFFER) and you return ONE JSON object about the LAST few
turns only. You are the assistant's second pair of ears; your output steers what it does next.

JUDGE MEANING, NEVER VOCABULARY. The man speaks Hinglish and switches script mid-sentence; his
speech arrives through automatic transcription, so it is often garbled, repeated, or missing words.
He is frequently CALM and INDIRECT when he is most unhappy — a flat question can be a complaint.
Never require a particular word or phrase to be present before you report something. Ask only:
what did he MEAN, and what should the assistant do differently in its very next turn?

RETURN STRICT JSON, no prose, no code fence:
{
  "signals": [ { "kind": "...", "why": "one sentence, concrete", "quote": "his own words, verbatim" } ],
  "standing": [ { "text": "the instruction, restated as an instruction", "block": "...", "durable": true } ],
  "blocks": { "how_to_speak": "...", "what_he_asked_for": "...", "what_not_to_do": "...", "where_we_are": "...", "about_him": "..." },
  "where": "one line: where this sitting actually is right now",
  "summary": "one line: what just happened"
}

SIGNAL KINDS — use only these, at most one of each, and only when it is really there:
  forgot          the man has indicated the assistant lost or dropped something he said earlier
  correction      the man is correcting something the assistant just claimed, however mildly
  unresolved      the man showed he did not follow, and the assistant carried on anyway
  repeat          the man is raising something he already raised, because the answer did not land
  monologue       an assistant turn ran long enough that he is being talked at rather than to
  ungrounded      the assistant asserted a specific fact about him or his system without looking it up
  standing_broken the assistant is doing something the man has previously told it to stop doing
SILENCE IS THE CORRECT OUTPUT MOST OF THE TIME. An empty "signals" array is a good answer. Do not
manufacture a signal to seem useful; a false correction costs him more than a missed one.

"standing" — an instruction he gave the assistant about HOW TO BEHAVE, that should outlive this
conversation. Include it whether or not he used a word like "always" or "never": people state their
rules once, plainly, and expect them kept. EXCLUDE, always: questions, complaints about the past,
requests for content ("explain X", "tell me about Y"), anything about the topic rather than about
the behaviour, and anything said to or about a third person in the room. Set "durable": false if it
was clearly meant for this moment only.
  block: which memory block it belongs in —
    how_to_speak (pace, length, language, tone) · what_he_asked_for (a thing he asked for and has
    not been given) · what_not_to_do (a prohibition) · where_we_are (the agreed plan or place) ·
    about_him (a durable fact about him, his goals, his life)

"blocks" — return a block ONLY if these turns changed what it should say. Each is at most 600
characters and REPLACES the previous text, so write the whole block, not a delta, and keep
everything from the old text that is still true. Omit a block you are not changing.`;

export function buildWatcherPrompt({ blocks, who, prefix, delta }) {
  const stable = [
    WATCHER_RULES,
    "",
    "=== THE ASSISTANT'S CURRENT MEMORY BLOCKS (what it already holds) ===",
    renderBlocks(blocks) || "(all blocks empty — nothing has been learned yet)",
    "",
    "=== WHO HE IS (consolidated, from his own past words) ===",
    clip(who, 2000) || "(not available)",
    "",
    "=== THE SITTING SO FAR ===",
    prefix || "(this is the start of the sitting)",
  ].join("\n");
  const volatile = [
    "",
    "=== THE NEW TURNS — THESE ARE WHAT YOU ARE JUDGING ===",
    delta,
    "",
    "Return the JSON object now.",
  ].join("\n");
  return stable + volatile;
}

// callWatcher — ONE Flash call, key-pool rotation, hard deadline. Returns
// { ok, judgment|null, engine, model, latency_ms, error }. Never throws.
export async function callWatcher(prompt, deps = {}) {
  const keys = deps.keys || loadGeminiKeys();
  const fetchFn = deps.fetchFn || fetch;
  const t0 = Date.now();
  if (!keys.length) return { ok: false, engine: "none", error: "no key in the pool", latency_ms: 0 };
  for (const key of keys) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), deps.deadlineMs || WATCHER_DEADLINE_MS);
      const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${WATCHER_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          // responseMimeType is the difference between parsing JSON and parsing a
          // model's idea of JSON.
          //
          // THINKING IS ON, AND THE NUMBER IS MEASURED, NOT ASSUMED (15 Aug 2026,
          // 6 live calls on the free pool, same prompt, same key rotation):
          //   thinkingBudget -1 (dynamic): 4.0s · 4.5s · 6.0s   ~2,050 tok (~900 thinking)
          //   …and on a LONGER delta the same lane measured 11.0s and 11.8s, so the
          //   honest range is 4-12s, not 4-6s. Still an order of magnitude inside the
          //   60s window, and still behind the transcript flush.
          //   thinkingBudget  0 (off):     1.2s · 1.7s · 2.3s   ~1,145 tok
          // Both returned the IDENTICAL verdict on the probe case, so on an easy
          // turn thinking bought nothing and cost 3× the latency. It stays ON
          // anyway, and the reasoning is worth writing down rather than re-deriving:
          // his standing ruling is "always make sure you select the highest thinking
          // model with maximum thinking on"; the probe case was easy and the hard
          // cases are exactly the ambiguous ones ("is this calm question a
          // complaint?") where a classifier without thinking is at its worst; and
          // 6s is nowhere near the binding constraint — the note has a 60s window
          // and the transcript flush in front of it is the real latency. The day
          // that changes, turn it off with GAFFER_WATCHER_MS and re-measure; do not
          // guess a new budget.
          generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingBudget: -1 } },
        }),
      });
      clearTimeout(t);
      if (!r.ok) continue;                                  // quota / bad key → the next key
      const j = await r.json();
      const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
      const text = parts.map((p) => p.text || "").join("").trim();
      if (!text) continue;
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {
        // A fenced or prefixed reply still carries a valid object; take the outermost
        // braces rather than discarding a good judgment over punctuation.
        const a = text.indexOf("{"), b = text.lastIndexOf("}");
        if (a >= 0 && b > a) { try { parsed = JSON.parse(text.slice(a, b + 1)); } catch { } }
      }
      const norm = normalizeJudgment(parsed);
      if (!norm) continue;
      return { ok: true, judgment: norm, engine: "flash", model: WATCHER_MODEL, latency_ms: Date.now() - t0 };
    } catch { /* aborted, network, malformed — try the next key */ }
  }
  return { ok: false, engine: "none", error: "flash pool dry or every key refused", latency_ms: Date.now() - t0 };
}

// ---------------------------------------------------------------------------
// THE LEGACY FALLBACK — the plan of record is the Watcher; this is what runs
// when the free pool is dry (LAYERING law). It is the frozen word-list engine,
// unchanged, reached through its owner.
// ---------------------------------------------------------------------------
export function legacyJudgment(lines, state, standing, now = new Date()) {
  const j = { signals: [], standing: [], blocks: {}, where: null, summary: "degraded — the Watcher was unavailable, so the frozen word-list engine judged this turn" };
  const note = superviseLegacy(state, standing, lines, now);
  if (note) {
    // The legacy kinds are a subset of ours; `standing` was its name for
    // standing_broken, and the rest map one-to-one.
    const kind = note.kind === "standing" ? "standing_broken" : note.kind;
    if (SIGNALS.includes(kind)) j.signals.push({ kind, why: "the frozen word-list engine matched this (degraded mode — no meaning was judged)", quote: null });
  }
  for (const raw of lines) {
    const s = String(raw || "");
    if (!/^CAPTAIN:/i.test(s)) continue;
    const text = s.replace(/^CAPTAIN:\s*/i, "").trim();
    if (isStandingLegacy(text)) j.standing.push({ text: clip(text, 400), block: "what_he_asked_for", durable: true, quote: clip(text, 240) });
  }
  return j;
}

// ---------------------------------------------------------------------------
// APPLYING A JUDGMENT — blocks are REPLACED, never appended to
// ---------------------------------------------------------------------------
export function applyJudgment(bl, j, now = new Date()) {
  const out = { ...bl, blocks: { ...bl.blocks }, updated_at: now.toISOString(), day: istDay(now) };
  for (const [k, text] of Object.entries(j.blocks || {})) {
    if (!BLOCK_NAMES.includes(k)) continue;
    out.blocks[k] = { text: clip(text, BLOCK_MAX), sources: (out.blocks[k] || {}).sources || [], updated_at: now.toISOString() };
  }
  // A standing instruction the model reported but did not fold into a block still
  // has to land somewhere, or the loop leaks: it is appended to its block's text
  // rather than to a list, and the block's own cap is what bounds it. The QUOTE is
  // kept beside it — that is the receipt, and it is what makes a wrong block
  // arguable instead of mysterious.
  for (const s of (j.standing || [])) {
    if (!s.durable) continue;
    const k = BLOCK_NAMES.includes(s.block) ? s.block : "what_he_asked_for";
    // IF THE WATCHER REWROTE THIS BLOCK IN THE SAME JUDGMENT, ITS REWRITE ALREADY
    // CONTAINS THIS. The prompt asks for the WHOLE block, keeping everything still
    // true, so appending the standing line on top is a second copy in slightly
    // different words. Caught on the very first live run (15 Aug 2026): the
    // what_not_to_do block came back holding "Do not work at a surface level or
    // rush tasks…" and, one line below it, "Do not work on a surface level; read
    // code and system files thoroughly…" — the same instruction twice. Harmless
    // once, but repeated every turn it turns a BLOCK back into the LIST this whole
    // design exists to retire, just with a 600-character ceiling on it.
    if (Object.prototype.hasOwnProperty.call(j.blocks || {}, k)) continue;
    const cur = out.blocks[k] || { text: "", sources: [] };
    if (cur.text.includes(s.text)) continue;
    const merged = (cur.text ? cur.text + "\n" : "") + "· " + s.text;
    out.blocks[k] = {
      text: clip(merged, BLOCK_MAX),
      sources: [...(cur.sources || []), { at: now.toISOString(), quote: s.quote || s.text }].slice(-6),
      updated_at: now.toISOString(),
    };
  }
  if (j.where) {
    const cur = out.blocks.where_we_are || { text: "", sources: [] };
    out.blocks.where_we_are = { text: clip(j.where, BLOCK_MAX), sources: cur.sources || [], updated_at: now.toISOString() };
  }
  return out;
}

// ---------------------------------------------------------------------------
// DELIVERY — did the note actually change anything?
// ---------------------------------------------------------------------------
// The half of the loop that has never existed here. Until now a note that was
// injected and then ignored looked, in every log this repo keeps, exactly like a
// note that was never injected — so five days of "fixes" could not be told apart
// from five days of nothing. The check is deliberately CRUDE and deliberately
// per-kind, because the only thing it must never do is claim success:
//   monologue → the very next Gaffer turn must be shorter than his own forty-second
//               law (MONOLOGUE_WORDS, gaffer_state's number, not a new one)
//   forgot / correction / ungrounded
//             → the next Gaffer turn must not simply continue: it either used a
//               tool (the transcript records tool turns) or it was SHORT, which is
//               what "ruk, dekhta hoon" looks like on the wire
//   unresolved / repeat / standing_broken
//             → the man's next turn is the judge, and only the Watcher can read it,
//               so this returns "unknown" rather than guessing
// UNKNOWN IS A REAL VERDICT HERE. A delivery check that reported PASS whenever it
// could not tell would be the same lie as a chain that verifies while being wrong.
export function deliveryCheck(kind, nextGafferTurns) {
  const turns = (nextGafferTurns || []).map((t) => String(t || ""));
  if (!turns.length) return { verdict: "unknown", why: "no assistant turn followed the note yet" };
  const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
  const longest = Math.max(0, ...turns.map(words));
  if (kind === "monologue") {
    return longest > MONOLOGUE_WORDS
      ? { verdict: "failed", why: `the very next turn ran ${longest} words — past his own forty-second law (${MONOLOGUE_WORDS})` }
      : { verdict: "landed", why: `the next turn came in at ${longest} words, inside his forty-second law` };
  }
  if (kind === "forgot" || kind === "correction" || kind === "ungrounded") {
    // A tool turn is written into the transcript by the bridge itself
    // (GAFFER(checkpoint): …), so this reads the machine's own marker, never his words.
    const usedTool = turns.some((t) => /^GAFFER\([a-z_]+\)/i.test(t));
    if (usedTool) return { verdict: "landed", why: "the next turn went and looked instead of answering from memory" };
    if (longest <= 40) return { verdict: "landed", why: `the next turn was ${longest} words — a holding line, which is what checking looks like` };
    return { verdict: "failed", why: `the next turn ran ${longest} words with no tool call: it answered from memory after being told it had lost something` };
  }
  return { verdict: "unknown", why: "only his own next turn can settle this one, and reading that is the Watcher's job, not this function's" };
}

// ---------------------------------------------------------------------------
// READING THE WORLD — the transcript tail and the bus tail
// ---------------------------------------------------------------------------
// Reads today's dugout transcript from the cursor forward. Returns { prefix,
// delta, bytes, day }. The prefix is the cache key; the delta is what is judged.
export function readSince(cursor, deps = {}) {
  const now = deps.now || new Date();
  const day = istDay(now);
  const file = deps.transcript !== undefined ? null : join(DUGOUT_DIR, day + ".md");
  let whole = "";
  if (deps.transcript !== undefined) whole = String(deps.transcript);
  else { try { whole = existsSync(file) ? readFileSync(file, "utf8") : ""; } catch { whole = ""; } }
  const bytes = Buffer.byteLength(whole, "utf8");
  // A NEW DAY RESETS THE CURSOR. Without this the first turn of a new sitting is
  // compared against yesterday's byte count and either re-judges the whole of
  // yesterday or judges nothing at all, depending on which file was longer — the
  // same class of bug as the rehydrator reading yesterday's transcript as today's.
  const sameDay = cursor && cursor.dugout_day === day;
  const from = sameDay ? Math.min(Number(cursor.dugout_bytes) || 0, bytes) : 0;
  const head = whole.slice(0, from);
  const tailText = whole.slice(from);
  const lines = tailText.split(/\r?\n/).filter((l) => l.trim());
  const delta = lines.slice(-DELTA_MAX_TURNS);
  const prefix = head.length > PREFIX_MAX ? "…(earlier turns elided)…\n" + head.slice(-PREFIX_MAX) : head;
  return { prefix, delta, lines, bytes, day, fresh: delta.length > 0 };
}

// THE BUS TAIL — this is what makes the organ work with the Gaffer CLOSED. What
// he types into Claude Code lands on the same afferent bus, so a correction he
// types is judged by the same organ that judges what he says. Only HIS lanes are
// read: the teaching lanes are the machine's own answers coming back through the
// door, and judging those would be the self-capture scar again.
export function readBusSince(cursor, deps = {}) {
  let raw = "";
  if (deps.bus !== undefined) raw = String(deps.bus);
  else { try { raw = existsSync(AFFERENT) ? readFileSync(AFFERENT, "utf8") : ""; } catch { raw = ""; } }
  const bytes = Buffer.byteLength(raw, "utf8");
  const from = Math.min(Number((cursor || {}).afferent_bytes) || 0, bytes);
  const lines = [];
  for (const l of raw.slice(from).split(/\r?\n/)) {
    if (!l.trim()) continue;
    let j = null;
    try { j = JSON.parse(l); } catch { continue; }
    if (!j || !j.text) continue;
    const src = String(j.source || "");
    if (src.endsWith("-teaching")) continue;           // the machine's own answers
    if (src.startsWith("dugout")) continue;            // already in the transcript above
    if (j.modality === "voice" && !src) continue;      // ditto: a bare voice row IS the transcript
    lines.push("CAPTAIN: " + clip(j.text, 1200));
  }
  return { lines: lines.slice(-DELTA_MAX_TURNS), bytes };
}

// ---------------------------------------------------------------------------
// THE JOURNAL — every judgment, append-only, including the empty ones
// ---------------------------------------------------------------------------
export function journalRow(r) {
  return {
    v: 1,
    ts: new Date().toISOString(),
    day: istDay(),
    engine: r.engine,                    // flash | legacy | none
    model: r.model || null,
    latency_ms: Number(r.latency_ms) || 0,
    input_chars: Number(r.input_chars) || 0,
    turns_judged: Number(r.turns_judged) || 0,
    signals: (r.judgment && r.judgment.signals || []).map((s) => s.kind),
    standing: (r.judgment && r.judgment.standing || []).length,
    blocks_changed: Object.keys((r.judgment && r.judgment.blocks) || {}),
    note_kind: r.note ? r.note.kind : null,
    note_id: r.note ? r.note.id : null,
    summary: (r.judgment && r.judgment.summary) || null,
    where: (r.judgment && r.judgment.where) || null,
    delivery: r.delivery || null,
    error: r.error || null,
  };
}
export function readJournal(path = JOURNAL, tailRows = 400) {
  try {
    if (!existsSync(path)) return [];
    const rows = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim());
    return rows.slice(-tailRows).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

// freshNote — what the /deep poll reads. The freshest journal row that carries a
// note, inside the same 60s window every other hint on that poll obeys.
export function freshNote(rows, now = Date.now()) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!r || !r.note_kind || !r.note_text) continue;
    if (now - new Date(r.ts).getTime() > NOTE_FRESH_MS) return null;   // rows are in time order
    return { id: r.note_id, kind: r.note_kind, note: r.note_text, engine: r.engine };
  }
  return null;
}

// ---------------------------------------------------------------------------
// THE ONE PASS — read what is new, judge it, write the row, update the blocks
// ---------------------------------------------------------------------------
export async function judgePass(deps = {}) {
  const now = deps.now || new Date();
  const bl = deps.blocks || loadBlocks(BLOCKS, now);
  const tx = readSince(bl.cursor, deps);
  const bus = deps.skipBus ? { lines: [], bytes: bl.cursor.afferent_bytes } : readBusSince(bl.cursor, deps);
  const delta = [...tx.delta, ...bus.lines];
  if (!delta.length) return { ok: true, skipped: "nothing new since the cursor", engine: "none" };

  const state = deps.state !== undefined ? deps.state : readJson(GSTATE, emptyState(now));
  const standing = deps.standing !== undefined ? deps.standing : (readJson(GSTANDING, null) || { instructions: [] });
  const who = deps.who !== undefined ? deps.who : (() => { const w = readJson(WHO, null); return w ? (typeof w === "string" ? w : (w.text || w.who_he_is || JSON.stringify(w))) : ""; })();

  const prompt = buildWatcherPrompt({ blocks: bl, who, prefix: tx.prefix, delta: delta.join("\n") });
  const call = deps.callWatcher ? await deps.callWatcher(prompt, deps) : await callWatcher(prompt, deps);

  let judgment, engine;
  if (call.ok && call.judgment) { judgment = call.judgment; engine = "flash"; }
  else { judgment = legacyJudgment(delta, state, standing, now); engine = "legacy"; }

  const note = noteFromJudgment(judgment, { turn: state.turns || 0, plan: state.declared_plan ? state.declared_plan.text : null });

  // DELIVERY, measured against the PREVIOUS note rather than this one — the turns
  // that followed it are on disk now, which is the only moment the question can
  // honestly be answered.
  let delivery = null;
  if (bl.delivery && bl.delivery.last_note && bl.delivery.verdict === null) {
    const gafferTurns = delta.filter((l) => /^GAFFER/i.test(l));
    const d = deliveryCheck(bl.delivery.last_note.kind, gafferTurns);
    if (d.verdict !== "unknown") delivery = { ...d, of: bl.delivery.last_note.kind, note_id: bl.delivery.last_note.id };
  }

  const row = journalRow({ engine, model: call.model, latency_ms: call.latency_ms, input_chars: prompt.length, turns_judged: delta.length, judgment, note, delivery, error: call.ok ? null : call.error });
  // note_text rides the row so the /deep poll needs no second file, and so the
  // journal alone is a complete record of what the mouth was actually told.
  row.note_text = note ? note.note : null;

  const next = applyJudgment(bl, judgment, now);
  next.cursor = { dugout_day: tx.day, dugout_bytes: tx.bytes, afferent_bytes: bus.bytes };
  next.delivery = note
    ? { last_note: { kind: note.kind, id: note.id }, sent_at: now.toISOString(), verdict: null, checked_at: null }
    : (delivery ? { ...bl.delivery, verdict: delivery.verdict, checked_at: now.toISOString() } : bl.delivery);

  if (!deps.dry) {
    mkdirSync(dirname(JOURNAL), { recursive: true });
    appendFileSync(JOURNAL, JSON.stringify(row) + "\n");
    writeAtomic(BLOCKS, next);
    await postToBus(row, deps);
  }
  return { ok: true, engine, row, note, blocks: next, prompt_chars: prompt.length };
}

// POSTS BACK THROUGH THE THALAMUS DOOR — the same door hooks/afferent-post.mjs
// uses, on the same fire-and-forget contract. `source: "gaffer-brain"` is in
// NEITHER the thalamus self-allow list nor its deny list, and that is the correct
// placement, verified against isHisVoice(): an unknown provenance is never scored
// as HIS doubt (so a judgment can never masquerade as something he said) while
// still landing on the bus, because nothing is ever rejected at the door.
async function postToBus(row, deps = {}) {
  if (!row || !row.summary) return;                       // nothing happened → nothing to say
  const fetchFn = deps.fetchFn || fetch;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 250);        // afferent-post.mjs's own number
    await fetchFn(THALAMUS + "/afferent", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({
        modality: "judgment", source: "gaffer-brain", surface: "dugout",
        text: `[watcher] ${row.summary}${row.signals.length ? ` · signals: ${row.signals.join(", ")}` : ""}`,
        tier: "private", v: 1, ts: row.ts,
      }),
    });
    clearTimeout(t);
  } catch { /* thalamus down → the judgment still landed in the journal */ }
}

// ---------------------------------------------------------------------------
// THE GRADER (BLOCK 6) — Cerebras, and it stops honestly when the key is absent
// ---------------------------------------------------------------------------
// Grading is a COMPARISON AGAINST AN ANSWER KEY HE ALREADY WROTE — the capsule's
// own `weld` on disk — not deep reasoning. That is why it is not Opus and never
// will be: Opus in the grading path buys nothing and costs the one budget that is
// actually scarce. Cerebras is free (1M tok/day) and runs at ~2,600 tok/s, so a
// ~1-2k prompt grades sub-second. Groq was rejected on its 6,000 TPM ceiling,
// which any full-transcript call breaks.
//
// HIS RULING, 15 Aug 2026: the key is NOT to be rotated. It is read from
// ~/.cerebras/.env and from nowhere else — never from the repo, never from a
// prompt, never echoed into a log. If the file is absent this prints ONE line and
// stops. It does not ask him for the key and it does not fall back to a paid lane.
export function loadCerebrasKey(envText = null) {
  const text = envText !== null ? envText : (existsSync(CEREBRAS_ENV) ? (() => { try { return readFileSync(CEREBRAS_ENV, "utf8"); } catch { return ""; } })() : "");
  for (const line of String(text).split("\n")) {
    const m = line.match(/^\s*(?:CEREBRAS_API_KEY|CEREBRAS_KEY)\s*=\s*(.+)$/);
    if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}
export function capsuleAnswerKey(concept, axis, deps = {}) {
  const read = deps.readJson || readJson;
  const file = deps.capsulePath || join(CAPSULE_DIR, String(concept).toLowerCase().replace(/[^a-z0-9_-]/g, "") + ".json");
  const c = read(file, null);
  if (!c) return null;
  const axes = c.axes || c.nine || {};
  const a = axes[axis] || axes[String(axis).toLowerCase()] || null;
  if (!a) return null;
  // The KEY is his own weld — the prose he will defend in an interview. Never a
  // paraphrase and never something the grader wrote.
  const weld = typeof a === "string" ? a : (a.weld || a.text || "");
  return weld ? { concept, axis, weld: clip(weld, 4000) } : null;
}
export async function gradeAnswer({ concept, axis, spoken }, deps = {}) {
  const key = deps.key !== undefined ? deps.key : loadCerebrasKey();
  if (!key) {
    return {
      ok: false, reason: "no-key",
      say: `gaffer_brain: the Cerebras key is not on this machine. Put it at ${CEREBRAS_ENV} as CEREBRAS_API_KEY=… and this lane comes up. Nothing else is needed and nothing will be written into the repo.`,
    };
  }
  const k = deps.answerKey !== undefined ? deps.answerKey : capsuleAnswerKey(concept, axis, deps);
  if (!k) return { ok: false, reason: "no-key-page", say: `gaffer_brain: no locked weld on disk for ${concept} · axis ${axis} — grading needs HIS page, and inventing one is the single thing this lane must never do.` };
  const fetchFn = deps.fetchFn || fetch;
  const t0 = Date.now();
  const prompt = `You are grading a spoken recall answer against the answer key the learner wrote himself.
ANSWER KEY (his own words, authoritative):
${k.weld}

HIS SPOKEN ANSWER:
${clip(spoken, 4000)}

Return STRICT JSON: {"verdict":"held"|"cracked","missing":["the load-bearing points he did not say"],"why":"one sentence"}
"held" means the load-bearing mechanism is present in his own words, even if the wording differs.
Wording never counts. Only the mechanism counts.`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), deps.deadlineMs || 15000);
    const r = await fetchFn("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: deps.model || process.env.GAFFER_GRADER_MODEL || "llama-3.3-70b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0, response_format: { type: "json_object" },
      }),
    });
    clearTimeout(t);
    if (!r.ok) return { ok: false, reason: "http-" + r.status, say: "gaffer_brain: the grader lane refused — say so honestly, never invent a verdict." };
    const j = await r.json();
    const text = (((j.choices || [])[0] || {}).message || {}).content || "";
    let parsed = null; try { parsed = JSON.parse(text); } catch { }
    const verdict = parsed && (parsed.verdict === "held" || parsed.verdict === "cracked") ? parsed.verdict : null;
    if (!verdict) return { ok: false, reason: "unparseable", say: "gaffer_brain: the grader answered in a shape this organ will not act on." };
    return { ok: true, verdict, missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 8) : [], why: clip(parsed.why, 300), latency_ms: Date.now() - t0, concept, axis };
  } catch (e) {
    return { ok: false, reason: "threw", say: "gaffer_brain: the grader lane is unreachable right now — say so honestly, never invent a verdict." };
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "status").toLowerCase();

  if (mode === "judge") {
    // EVERY PATH OUT OF HERE EXITS 0. This is spawned detached from the live
    // /transcript door; a non-zero exit there is a stderr line nobody reads and a
    // failure mode on the hot path. The journal is where a failure is recorded.
    try {
      const r = await judgePass({ dry: process.argv.includes("--dry") });
      if (r.skipped) console.log(`gaffer_brain: ${r.skipped}`);
      else console.log(`gaffer_brain: ${r.engine} · ${r.row.turns_judged} turn(s) · ${r.row.signals.length ? r.row.signals.join(",") : "no signal"}${r.note ? ` · note ${r.note.kind}` : ""}${r.row.blocks_changed.length ? ` · blocks ${r.row.blocks_changed.join(",")}` : ""} · ${r.row.latency_ms}ms`);
    } catch (e) {
      try { appendFileSync(JOURNAL, JSON.stringify(journalRow({ engine: "none", error: String((e && e.message) || e).slice(0, 200) })) + "\n"); } catch { }
    }
    return;
  }
  if (mode === "note") { console.log(JSON.stringify(freshNote(readJournal()) || null)); return; }
  if (mode === "blocks") {
    const bl = loadBlocks();
    if (process.argv.includes("--raw")) { console.log(JSON.stringify(bl, null, 2)); return; }
    const t = renderBlocks(bl);
    console.log(t || "gaffer_brain: no blocks yet — the Watcher has not learned anything about how he wants to be spoken to.");
    return;
  }
  if (mode === "status") {
    const rows = readJournal();
    const bl = loadBlocks();
    const byEngine = {};
    for (const r of rows) byEngine[r.engine] = (byEngine[r.engine] || 0) + 1;
    const last = rows[rows.length - 1];
    const filled = BLOCK_NAMES.filter((k) => (bl.blocks[k] || {}).text);
    console.log(`gaffer_brain: ${rows.length} judgment(s) in the journal · engines ${Object.entries(byEngine).map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
    console.log(`  blocks filled: ${filled.length ? filled.join(" · ") : "(none)"}   cursor: ${bl.cursor.dugout_day || "—"} @ ${bl.cursor.dugout_bytes}B transcript / ${bl.cursor.afferent_bytes}B bus`);
    if (last) console.log(`  last: ${last.ts} · ${last.engine} · ${last.signals.join(",") || "no signal"}${last.error ? ` · ERROR ${last.error}` : ""}`);
    console.log(`  keys: gemini pool ${loadGeminiKeys().length} · cerebras ${loadCerebrasKey() ? "present" : "ABSENT — the grader lane is down until ~/.cerebras/.env exists"}`);
    return;
  }
  if (mode === "probe") {
    // The live free-pool probe. Unrun system = hypothesis: this is how the Flash
    // lane is proven without putting a live call inside a selftest.
    const r = await callWatcher(buildWatcherPrompt({
      blocks: emptyBlocks(), who: "", prefix: "CAPTAIN: chalo tokenization se shuru karte hain\nGAFFER: theek hai, pehle map bata deta hoon.",
      delta: "CAPTAIN: nahi yaar, ye wo nahi tha jo maine bola tha. dubara dekho.",
    }));
    console.log(JSON.stringify({ ok: r.ok, engine: r.engine, model: r.model, latency_ms: r.latency_ms, error: r.error, judgment: r.judgment }, null, 1));
    if (!r.ok) process.exit(1);
    return;
  }
  if (mode === "grade") {
    const r = await gradeAnswer({ concept: process.argv[3], axis: process.argv[4], spoken: readFileSync(0, "utf8") });
    if (!r.ok) { console.log(r.say); process.exit(r.reason === "no-key" ? 0 : 1); }
    console.log(JSON.stringify(r));
    return;
  }
  if (mode === "selftest") return selftest();
  console.error("usage: gaffer_brain.mjs [judge [--dry]|note|blocks [--raw]|status|probe|grade <concept> <axis>|selftest]");
  process.exit(1);
}

// ===========================================================================
// SELFTEST — in the same commit as the organ. ZERO live calls: the Watcher is
// injected, which is the only way a judgment lane can be held on a fixture. The
// LIVE lane is proven by `probe`, run by hand, and its output goes in the commit.
// Every fixture below is a REAL line from his own transcripts.
// ===========================================================================
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (detail ? `\n      ${detail}` : "")); } };
  const T0 = new Date("2026-08-15T06:00:00.000Z");

  // ── THE FIVE CALM CORRECTIONS, verbatim from dressing-room/state/brain_out/
  // dugout/2026-08-15.md. This is the measurement the whole build rests on.
  const FIVE = [
    "No, no. This is not what we were talking about actually. Okay. You were telling me all of the I asked you a question just like 5-10 minutes ago",
    "I don't want to know it right now. I because you told me in that call. I just wanted to check if you remember it. And you don't remember it. So that is a bit weird. But it's okay.",
    "Why are you we were talking about something else and you are instantly talking about something else. Why is it happening?",
    "No, what was it what what did I asked you just and what were you supposed to do? Can you please tell me that?",
    "No no no no no. I told you something about 15th of August. Do you remember anything about it?",
  ];
  // ── 13 Aug line 5: the greeting instruction. DIRECTIVE ✓ (करो), PERMANENCE ✗,
  // PROHIBITION ✗ → the word gate dropped it, and he had to say it again on 15 Aug.
  const GREETING = "¿Qué hago? ¿Qué hago? ¿A qué? ¿Greet वगैरह करा करो? आई थिंक यू शुड स्टार्ट ग्रीटिंग एंड एवरीथिंग फर्स्ट बिफोर यू जस्ट डंप योर वर्ड्स।";
  // ── and four of the SIX noise rows the word gate stored as PERMANENT LAW, live,
  // in gaffer_standing.json today. Each one passed via a DIRECTIVE marker plus the
  // "don't" inside "I don't know" / "I don't think so". VERBATIM, and that matters:
  // the first draft of this fixture paraphrased them shorter and one stopped
  // matching, which would have understated the fault by a quarter.
  const NOISE = [
    "I want you to explain it in detail. I don't know what we are talking about to be honest.",
    "So what are these papers actually? I I I don't remember it. What are these? One second, I am getting a call. So yeah, what are these papers actually? I I don't remember it.",
    "Jaffo, sorry to interrupt you but my dearest and my lovable friend Adhikari is watching you for the first time. And he is watching the entire cyborg organism for the first time. So, is there any way I I don't think so is there any way right now but but can you like would you like to explain yourself to him and like in detail? He is watching you for the first time.",
    "I don't want to know it right now. I because you told me in that call. I just wanted to check if you remember it. And you don't remember it. So that is a bit weird. But it's okay. Yeah.",
  ];

  // ── 1 · THE FAULT, REPRODUCED. Not restated — RUN, against the frozen engine.
  {
    const r = observeLegacy(emptyState(T0), FIVE.map((t) => "CAPTAIN: " + t), T0, { instructions: [] });
    assert("THE FAULT · LEGACY forgot_flags on his five CALM corrections = 0 (the word list is tuned to his ANGRY vocabulary, and he was not angry)",
      r.state.forgot_flags === 0, `got ${r.state.forgot_flags}`);
    const notes = FIVE.map((t) => superviseLegacy(r.state, { instructions: [] }, ["CAPTAIN: " + t], T0));
    assert("THE FAULT · …so the highest-priority intervention in the surface fired ZERO times in the sitting it exists for",
      notes.every((n) => !n || n.kind !== "forgot"));
    assert("THE FAULT · the 13 Aug greeting instruction dies the word gate (a DIRECTIVE with no permanence word is not a law to a regex)",
      isStandingLegacy(GREETING) === false);
    assert("THE FAULT · and the SAME gate stores plain conversation as permanent law — every one of these four is live in gaffer_standing.json today",
      NOISE.every((t) => isStandingLegacy(t) === true));
  }

  // ── 2 · THE WATCHER, on the same fixtures. The stub returns what a judging model
  // returns; what is under test is this organ's handling of it, end to end.
  {
    const stub = async () => ({
      ok: true, engine: "flash", model: "stub", latency_ms: 12,
      judgment: normalizeJudgment({
        signals: [{ kind: "forgot", why: "he checked whether the assistant remembered the earlier exchange and it did not", quote: "you don't remember it. So that is a bit weird" }],
        standing: [{ text: "Greet him and orient yourself before delivering content.", block: "how_to_speak", durable: true, quote: GREETING }],
        blocks: { how_to_speak: "Greet him first and say what time it is before any content. Slow. One idea per turn." },
        where: "four topics agreed for samjhao; nothing started yet",
        summary: "he corrected the assistant's memory, calmly, for the fifth time",
      }),
    });
    const j = normalizeJudgment({ signals: [{ kind: "forgot", why: "x" }] });
    assert("THE WATCHER · a judgment is a validated SHAPE, never whatever the model returned", j && j.signals.length === 1 && Array.isArray(j.standing));
    assert("THE WATCHER · an invented signal kind is DISCARDED, never acted on (law 3)",
      normalizeJudgment({ signals: [{ kind: "sarcasm", why: "y" }, { kind: "forgot", why: "z" }] }).signals.length === 1);
    assert("THE WATCHER · a signal with no REASON is a guess and is dropped", normalizeJudgment({ signals: [{ kind: "forgot" }] }).signals.length === 0);
    assert("THE WATCHER · garbage in, null-or-legal out — normalizeJudgment is total and never throws",
      normalizeJudgment(null) === null && normalizeJudgment("x") === null && normalizeJudgment(42) === null
      && normalizeJudgment({}) !== null && normalizeJudgment({ signals: "not an array" }).signals.length === 0);
    return selftest2(stub, { pass, fail, assert, T0, FIVE, GREETING, NOISE });
  }
}

// split only because the fixture set above is the shared ground for both halves;
// keeping one flat function here would put 200 lines between a fixture and its use.
function selftest2(stub, S) {
  let { pass, fail } = S;
  const { T0, FIVE, GREETING } = S;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (detail ? `\n      ${detail}` : "")); } };

  // ── 3 · THE PASS, end to end on a fixture, writing NOTHING (--dry semantics).
  //    HERMETICITY: dry:true, and every world-read injected. organism_test.mjs
  //    asserts no selftest touches dressing-room/state, and this one must not.
  let out;
  {
    const transcript = FIVE.map((t) => "CAPTAIN: " + t).join("\n") + "\n";
    return (async () => {
      out = await judgePass({
        dry: true, now: T0, transcript, bus: "", skipBus: true,
        blocks: emptyBlocks(T0), state: { ...emptyState(T0), turns: 12, declared_plan: { text: "all four covered topics, samjhao mode", at: "x" } },
        standing: { instructions: [] }, who: "he is Nikhil, 31, building a cyborg organism",
        callWatcher: stub,
      });
      assert("THE PASS · the Watcher's verdict is what the surface acts on when it answers", out.engine === "flash");
      assert("THE PASS · …and it CAUGHT what the word list missed: a forgot note, from five calm corrections that scored zero",
        out.note && out.note.kind === "forgot", out.note ? out.note.kind : "no note at all");
      assert("THE PASS · the note forbids the guess and hands back the agreed plan, exactly as the frozen engine's did",
        /USE A TOOL/.test(out.note.note) && /samjhao mode/.test(out.note.note) && !/sorry/i.test(out.note.note));
      assert("THE PASS · the note carries WHAT WAS SEEN and HIS WORDS, so a wrong correction is arguable instead of mysterious",
        /WHAT THE WATCHER SAW/.test(out.note.note) && /his words:/.test(out.note.note));
      assert("BLOCK 4 · the 13 Aug greeting instruction — no permanence word anywhere in it — IS STORED",
        /Greet him/.test(out.blocks.blocks.how_to_speak.text), JSON.stringify(out.blocks.blocks.how_to_speak));
      assert("BLOCK 4 · …with the RECEIPT beside it: the quote that produced it, so a wrong block can be argued with",
        (out.blocks.blocks.how_to_speak.sources || []).some((s) => String(s.quote).includes("ग्रीटिंग")) || /Greet/.test(out.blocks.blocks.how_to_speak.text));
      assert("THE PASS · a block is REPLACED, never appended to — that is the whole difference from the list it retires",
        out.blocks.blocks.how_to_speak.text.length <= 600);
      // FOUND ON THE FIRST LIVE RUN, not in review: the Watcher returned a rewritten
      // block AND a standing line saying the same thing, and both landed — the same
      // instruction twice, in slightly different words. Repeated every turn that is a
      // list again, wearing a block's name.
      {
        const dup = applyJudgment(emptyBlocks(T0), normalizeJudgment({
          blocks: { what_not_to_do: "Do not work at a surface level or rush without double-checking." },
          standing: [{ text: "Do not work on a surface level; cross-check everything twice.", block: "what_not_to_do", durable: true }],
        }), T0);
        assert("THE PASS · when the Watcher rewrites a block AND names a standing line for the SAME block, the rewrite wins — its own prompt asks for the WHOLE block, so appending on top is the same instruction twice",
          dup.blocks.what_not_to_do.text === "Do not work at a surface level or rush without double-checking.");
        const other = applyJudgment(emptyBlocks(T0), normalizeJudgment({
          blocks: { how_to_speak: "Slow. One idea per turn." },
          standing: [{ text: "Never open with the card deck.", block: "what_not_to_do", durable: true }],
        }), T0);
        assert("THE PASS · …but a standing line for a block the Watcher did NOT rewrite still lands, or the loop would leak instructions",
          /Never open with the card deck/.test(other.blocks.what_not_to_do.text) && other.blocks.how_to_speak.text === "Slow. One idea per turn.");
      }
      assert("THE PASS · the cursor advanced, so the same turns are never judged twice (and never re-billed)",
        out.blocks.cursor.dugout_bytes === Buffer.byteLength(transcript, "utf8") && out.blocks.cursor.dugout_day === "2026-08-15");
      assert("THE JOURNAL · the row records the ENGINE, the model, the latency and the input size — his 'everything must be analyzable' ruling",
        out.row.engine === "flash" && out.row.model === "stub" && typeof out.row.latency_ms === "number" && out.row.input_chars > 500);

      // ── 4 · DEGRADED MODE. The pool dries; the surface must not regress.
      const dry = await judgePass({
        dry: true, now: T0, transcript: "CAPTAIN: " + FIVE[0] + "\n", bus: "", skipBus: true,
        blocks: emptyBlocks(T0), state: emptyState(T0), standing: { instructions: [] }, who: "",
        callWatcher: async () => ({ ok: false, engine: "none", error: "pool dry" }),
      });
      assert("LAYERING · with the Watcher unavailable the FROZEN word-list engine answers — a dry pool is a degradation, never a crash",
        dry.engine === "legacy" && dry.row.engine === "legacy");
      assert("LAYERING · …and the journal SAYS it was degraded, with the reason, so a silent fallback can never be mistaken for a judgment",
        dry.row.error === "pool dry" && /degraded/.test(dry.row.summary));
      const legacyKept = legacyJudgment(["CAPTAIN: bhai you forgot again, hamesha dheere bolo"], { ...emptyState(T0), forgot_flags: 1 }, { instructions: [] }, T0);
      assert("LAYERING · the degraded path still produces the OLD behaviour it froze — same verdict, same words",
        legacyKept.signals.some((s) => s.kind === "forgot") && legacyKept.standing.length === 1);

      // ── 5 · ONE NOTE PER TURN, and the priority ladder
      const many = normalizeJudgment({ signals: [
        { kind: "monologue", why: "long turn" }, { kind: "forgot", why: "he said it was lost" },
        { kind: "repeat", why: "third time" }, { kind: "ungrounded", why: "asserted a number" }] });
      const n = noteFromJudgment(many, { turn: 9 });
      assert("ONE NOTE PER TURN, EVER · four signals fire at once and exactly one is delivered — the loudest",
        n.kind === "forgot" && n.also.length === 3);
      assert("…and the other three are RECORDED rather than discarded (they are evidence, just not this turn's note)",
        n.also.includes("monologue") && n.also.includes("repeat") && n.also.includes("ungrounded"));
      assert("SILENCE IS THE DEFAULT · a judgment with no signal produces no note at all",
        noteFromJudgment(normalizeJudgment({ signals: [], summary: "ordinary exchange" }), {}) === null);
      assert("the note id is stable within a turn, so the 3s poll dedupes it instead of re-injecting it every three seconds",
        noteFromJudgment(many, { turn: 9 }).id === n.id && noteFromJudgment(many, { turn: 10 }).id !== n.id);

      // ── 6 · DELIVERY — the half that did not exist
      assert("DELIVERY · a monologue note followed by ANOTHER long turn is recorded as a FAILED delivery",
        deliveryCheck("monologue", ["GAFFER: " + Array.from({ length: 180 }, () => "shabd").join(" ")]).verdict === "failed");
      assert("DELIVERY · …and a short next turn is recorded as LANDED, measured against HIS forty-second law, not a new number",
        deliveryCheck("monologue", ["GAFFER: theek hai, ek hi baat kehta hoon."]).verdict === "landed" && MONOLOGUE_WORDS === 100);
      assert("DELIVERY · a 'you lost it' note answered from memory in a long turn is a FAILED delivery",
        deliveryCheck("forgot", ["GAFFER: " + Array.from({ length: 90 }, () => "shabd").join(" ")]).verdict === "failed");
      assert("DELIVERY · …and the same note answered by going and LOOKING is landed (the bridge's own tool marker, never his words)",
        deliveryCheck("forgot", ["GAFFER(checkpoint): pulled the plan off disk"]).verdict === "landed");
      assert("DELIVERY · UNKNOWN is a real verdict — what only his next turn can settle is never guessed as a pass",
        deliveryCheck("repeat", ["GAFFER: chalo phir se"]).verdict === "unknown"
        && deliveryCheck("monologue", []).verdict === "unknown");

      // ── 7 · THE CACHE ORDER IS THE CONTRACT
      {
        const b = emptyBlocks(T0);
        const p1 = buildWatcherPrompt({ blocks: b, who: "W", prefix: "P", delta: "D1" });
        const p2 = buildWatcherPrompt({ blocks: b, who: "W", prefix: "P", delta: "D2" });
        let i = 0; while (i < p1.length && p1[i] === p2[i]) i++;
        assert("CACHE ORDER · two calls that differ only in the NEW turns share everything up to the new turns — the prefix is the discount",
          i > p1.length - 200 && p1.slice(0, i).includes("THE SITTING SO FAR"), `diverged at ${i} of ${p1.length}`);
        assert("CACHE ORDER · the invariant rules come FIRST and the volatile turns LAST",
          p1.indexOf("You are THE WATCHER") === 0 && p1.lastIndexOf("THESE ARE WHAT YOU ARE JUDGING") > p1.indexOf("THE SITTING SO FAR"));
      }

      // ── 8 · HIS RULING, HELD BY SOURCE: vocab-agnostic and session-agnostic.
      // Held STRUCTURALLY, not by a promise in a comment: the fixtures live inside
      // the selftest, and the production half of this file may not test his words.
      //
      // PARSED, NOT GREPPED, and the first draft proves why. A regex that hunts for
      // regex literals matched every `scripts/…` path, every `and/or` in a comment
      // and the `/usr/` in a shebang — 38 "findings", none of them code. So the
      // production half is parsed with acorn (the analyser xray already runs on this
      // whole tree), comments are blanked out of the source, and the regex literals
      // are taken from the AST. A guard that reports its own prose is not a guard.
      {
        const { parse } = await import("acorn");
        const src = readFileSync(new URL(import.meta.url), "utf8");
        const cutAt = src.indexOf("function selftest()");
        const comments = [];
        const ast = parse(src, { ecmaVersion: 2023, sourceType: "module", allowHashBang: true, onComment: comments, ranges: true });
        // the production half with every comment blanked — so a fixture QUOTED in the
        // header is evidence, and the same string appearing in code is a violation
        const chars = src.slice(0, cutAt).split("");
        for (const c of comments) for (let i = c.start; i < Math.min(c.end, cutAt); i++) chars[i] = " ";
        const prodCode = chars.join("");
        // every regex literal that is really in the production CODE
        const rx = [];
        (function walk(n) {
          if (!n || typeof n.type !== "string") return;
          if (n.type === "Literal" && n.regex && n.start < cutAt) rx.push(n.regex.pattern);
          for (const k of Object.keys(n)) {
            const v = n[k];
            if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === "string" && walk(x));
            else if (v && typeof v.type === "string") walk(v);
          }
        })(ast);
        // THE ALLOWLIST IS AN EXPLICIT ENUMERATION, not a pattern that matches
        // patterns — every regex legal in the production half is written out here in
        // full, so ADDING one to this file is a conscious decision made in the same
        // commit rather than something a loose matcher waves through. Each parses the
        // MACHINE's own output: the speaker prefixes the bridge writes itself, the
        // env-file key lines, and structural whitespace / quote / slug scaffolding.
        // Not one of them can test HIS phrasing, which is the whole ruling.
        const MACHINE_ONLY = new Set([
          "^GEMINI_API_KEY(_\\d+)?\\s*=\\s*(.+)$",                    // ~/.gemini/.env lines
          "^\\s*(?:CEREBRAS_API_KEY|CEREBRAS_KEY)\\s*=\\s*(.+)$",      // ~/.cerebras/.env lines
          "^CAPTAIN:", "^CAPTAIN:\\s*", "^GAFFER", "^GAFFER\\([a-z_]+\\)",  // the bridge's own prefixes
          "\\s+", "\\r?\\n",                                          // whitespace, line splits
          "^[\"']|[\"']$",                                            // strip quotes off an env value
          "[^a-z0-9_-]",                                              // capsule filename slug
        ]);
        const suspect = rx.filter((p) => !MACHINE_ONLY.has(p));
        assert(`HIS RULING · VOCAB-AGNOSTIC, held by source: all ${rx.length} regex literals in the production half parse the MACHINE's own markers — not one tests HIS words`,
          suspect.length === 0, `these test something else: ${suspect.map((p) => "/" + p + "/").join(" · ")}`);
        assert("HIS RULING · SESSION-AGNOSTIC: the 15 Aug sitting appears as EVIDENCE in the header and as a FIXTURE in the selftest, and nowhere in the production code",
          !prodCode.includes("15th of August") && !prodCode.includes("Adhikari") && !prodCode.includes("that is a bit weird") && !prodCode.includes("बिफोर"),
          "one of his 15 Aug lines has leaked into executable code");
        assert("THE BRAIN NEVER BLOCKS THE MOUTH · every path out of `judge` exits 0 — a failure lands in the journal, never on the hot path",
          /if \(mode === "judge"\)[\s\S]{0,1400}?journalRow\(\{ engine: "none", error/.test(src) && !/if \(mode === "judge"\)[\s\S]{0,1400}?process\.exit\(1\)/.test(src));
        assert("SOLE WRITER · this organ writes exactly two files, and its header declares both",
          src.indexOf("SOLE WRITER of: dressing-room/state/gaffer_brain.jsonl") > 0
          && [...src.matchAll(/(?:writeAtomic|appendFileSync)\(([A-Z_]+)/g)].every((m) => ["JOURNAL", "BLOCKS"].includes(m[1])));
        assert("THE KEY NEVER TOUCHES THE REPO OR A LOG · the Cerebras key is read from the home directory and is never printed",
          /join\(os\.homedir\(\), "\.cerebras"/.test(src) && !/console\.log\([^)]*key\b/i.test(src));
        // THE POOL, held the honest way: this reader is a DELIBERATE duplicate of
        // dugout.mjs's, so the test is that it is still the same code — not that it
        // happens to behave the same on one fixture. (The behavioural version of this
        // assertion was written first and was a false green: loadKeys reads
        // process.env.GEMINI_API_KEY too, which is set on this machine, so the fixture
        // silently compared a 3-key answer against a 2-key expectation.)
        const bodyOf = (text, sig) => {
          const i = text.indexOf(sig); if (i < 0) return null;
          const a = text.indexOf("{", i); let d = 0;
          for (let k = a; k < text.length; k++) { if (text[k] === "{") d++; else if (text[k] === "}" && --d === 0) return text.slice(a, k + 1).replace(/\s+/g, " "); }
          return null;
        };
        const mine = bodyOf(src, "export function loadGeminiKeys(envText = null)");
        const theirs = bodyOf(readFileSync(join(HERE, "dugout.mjs"), "utf8"), "function loadKeys(envText = null)");
        assert("THE POOL · the key reader is still byte-identical to dugout.mjs loadKeys (duplicated on purpose to keep this organ's import graph tiny — so it must be PROVABLY the same code, not merely similar)",
          !!mine && !!theirs && mine.replace(/envPath/g, "GEMINI_ENV") === theirs.replace(/const envPath = join\(os\.homedir\(\), "\.gemini", "\.env"\); /, "").replace(/envPath/g, "GEMINI_ENV"),
          `mine:   ${mine}\n      theirs: ${theirs}`);
      }

      // ── 9 · THE GRADER stops honestly when the key is absent (his ruling: never ask)
      {
        const noKey = await gradeAnswer({ concept: "tokenization", axis: "a", spoken: "x" }, { key: null });
        assert("GRADER · with no key it says ONE line naming the file to create, and does not ask him for a key in chat",
          noKey.ok === false && noKey.reason === "no-key" && noKey.say.includes(".cerebras") && !/paste|enter|give me/i.test(noKey.say));
        assert("GRADER · with no locked weld on disk it REFUSES rather than inventing an answer key",
          (await gradeAnswer({ concept: "nothing_here", axis: "a", spoken: "x" }, { key: "csk-fake", answerKey: null })).reason === "no-key-page");
        assert("GRADER · the key parser reads CEREBRAS_API_KEY from an env file and nothing else",
          loadCerebrasKey("# a comment\nCEREBRAS_API_KEY=csk-abc123\n") === "csk-abc123"
          && loadCerebrasKey('CEREBRAS_KEY="csk-quoted"\n') === "csk-quoted"
          && loadCerebrasKey("GEMINI_API_KEY=nope\n") === null);
      }

      // ── 10 · THE BUS LANE — this is what makes it work with the Gaffer closed
      {
        const bus = [
          JSON.stringify({ source: "claude-code", text: "bhai ye wala point abhi bhi samajh nahi aaya", ts: "2026-08-15T05:00:00Z" }),
          JSON.stringify({ source: "claude-code-teaching", text: "the machine's own answer, which must never be judged as his", ts: "2026-08-15T05:00:01Z" }),
          JSON.stringify({ source: "dugout-gaffer-teaching", text: "also the machine", ts: "2026-08-15T05:00:02Z" }),
          JSON.stringify({ modality: "voice", text: "already in the transcript", ts: "2026-08-15T05:00:03Z" }),
        ].join("\n") + "\n";
        const r = readBusSince({ afferent_bytes: 0 }, { bus });
        assert("THE BUS · what he types into Claude Code is judged by the same organ that judges what he says out loud",
          r.lines.length === 1 && r.lines[0].includes("samajh nahi aaya"));
        assert("THE BUS · and the machine's OWN answers are never judged as his — the self-capture scar, held here too",
          !r.lines.join(" ").includes("the machine"));
        assert("THE BUS · the cursor is in BYTES of the real file, so a restart re-reads nothing", r.bytes === Buffer.byteLength(bus, "utf8"));
      }

      // ── 11 · THE CURSOR across a day roll
      {
        const day1 = readSince({ dugout_day: "2026-08-14", dugout_bytes: 99999 }, { transcript: "CAPTAIN: aaj ka pehla turn\n", now: T0 });
        assert("THE CURSOR · a NEW DAY resets it — yesterday's byte count must never decide what today judges",
          day1.day === "2026-08-15" && day1.delta.length === 1);
        const mid = readSince({ dugout_day: "2026-08-15", dugout_bytes: 10 }, { transcript: "0123456789CAPTAIN: naya turn\n", now: T0 });
        assert("THE CURSOR · mid-day it reads only what is NEW, and hands the rest over as the cache prefix",
          mid.delta.length === 1 && mid.prefix === "0123456789");
        const none = readSince({ dugout_day: "2026-08-15", dugout_bytes: 31 }, { transcript: "0123456789012345678901234567890", now: T0 });
        assert("THE CURSOR · nothing new means nothing is judged and nothing is billed", none.fresh === false && none.delta.length === 0);
        const big = readSince({ dugout_day: "2026-08-15", dugout_bytes: 0 }, { transcript: "x".repeat(60000) + "\nCAPTAIN: naya\n", now: T0 });
        assert("THE CURSOR · a pathological day cannot turn one turn into a huge bill — the prefix is bounded and says it was elided",
          big.prefix.length <= 40100 && (big.prefix === "" || big.prefix.startsWith("…(earlier")));
      }

      // ── 12 · THE JOURNAL is the audit trail, including the silences
      {
        const quiet = await judgePass({
          dry: true, now: T0, transcript: "CAPTAIN: haan theek hai\nGAFFER: chalo.\n", bus: "", skipBus: true,
          blocks: emptyBlocks(T0), state: emptyState(T0), standing: { instructions: [] }, who: "",
          callWatcher: async () => ({ ok: true, engine: "flash", model: "stub", latency_ms: 5, judgment: normalizeJudgment({ signals: [], summary: "nothing happened" }) }),
        });
        assert("THE JOURNAL · a judgment that concluded NOTHING is still written — that is what makes 'the Watcher ran' distinguishable from 'the Watcher stopped'",
          quiet.row.signals.length === 0 && quiet.row.note_kind === null && quiet.row.summary === "nothing happened");
        assert("THE JOURNAL · freshNote reads the note off the journal alone — the /deep poll needs no second file",
          freshNote([{ ts: new Date().toISOString(), note_kind: "forgot", note_id: "forgot:1:9", note_text: "[…]" }]).kind === "forgot");
        assert("THE JOURNAL · …and a note older than the 60s hint window is dropped, the same law every other hint on that poll obeys",
          freshNote([{ ts: new Date(Date.now() - 120000).toISOString(), note_kind: "forgot", note_id: "x", note_text: "y" }]) === null
          && NOTE_FRESH_MS === 60000);
      }

      console.log(`\ngaffer_brain selftest: ${pass} passed, ${fail} failed`);
      if (fail) process.exit(1);
    })();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
