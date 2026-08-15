#!/usr/bin/env node
// ============================================================================
// gaffer_brain.mjs · ARSENAL AI FC — THE WATCHER: the Gaffer's judgment organ
// ----------------------------------------------------------------------------
// SOLE WRITER of: dressing-room/state/gaffer_brain.jsonl        (every judgment, append-only)
//                 dressing-room/state/gaffer_blocks.json         (the memory blocks + the cursor)
//                 dressing-room/state/gaffer_grade_queue.jsonl   (captured spoken answers, append-only)
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
//        node scripts/gaffer_brain.mjs capture <concept> <axis> --gut <word>  → bank ONE spoken answer (no model, instant)
//        node scripts/gaffer_brain.mjs judge-round        → grade the whole round in ONE Opus call
//        node scripts/gaffer_brain.mjs queue              → what is captured and not yet judged
//        node scripts/gaffer_brain.mjs selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, renameSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";
// execFileSync: the JUDGE hands each verdict to rejirah.mjs through its own CLI,
// because that organ is the sole writer of rejirah_log.jsonl and derives nextDue,
// fluency and the calibration gap from the row it writes itself.
import { execFileSync } from "node:child_process";
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
// THE TWO STANDARDS THIS ORGAN JUDGES AGAINST, as module constants for the same
// reason as every path above. Both were on disk and unread by this organ until
// 16 Aug: `grep -c dossier scripts/gaffer_brain.mjs` returned 0 while 17 other
// organs read the projection, and FORGE_SPEC's cold-reader bar — the declared
// standard for doubt_quality — reached the judge exactly never.
const DOSSIER_WEIGHTS = join(STATE_DIR, "dossier_weights.json");
const OPPONENT_SCOUT = join(ROOT, "learning-layer", "OPPONENT_SCOUT.md");
const GEMINI_ENV = join(os.homedir(), ".gemini", ".env");
// the FROZEN Cerebras reader's path — a module constant so the analyser can fold it
// (built inside the function it cost two unresolved sinks, and the ratchet said so)
const CEREBRAS_ENV_LEGACY = join(os.homedir(), ".cerebras", ".env");

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

// ONE TEXT-FILE DOOR for every read whose path is only known at runtime. Not style:
// each such pair (existsSync + readFileSync) is two unresolved sinks in xray's IR,
// and this organ has three of them — the day-file, the frozen env reader, and the
// queue. Routed through one function they cost ONE pair between them, and the
// per-organ ratchet stays satisfied by the organ being genuinely more legible rather
// than by the budget being widened.
const readTextFile = (p) => { try { return existsSync(p) ? readFileSync(p, "utf8") : ""; } catch { return ""; } };
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
  // ONE DOOR TO A DAY-FILE, shared with the night read below — see readDugoutDay.
  const whole = deps.transcript !== undefined ? String(deps.transcript) : readDugoutDay(day);
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
// THE JUDGE — CAPTURE, then TWO JUDGING PASSES (his spec, 15 Aug 2026 evening)
// ---------------------------------------------------------------------------
// THE DESIGN ERROR THIS REPLACES was not the transport. The first version assumed
// grading means "his answer vs his weld" — one comparison, one answer key — and
// therefore that any fast model could do it. Read against the live state files, the
// Gaffer has EIGHT things to judge and exactly ONE of them has a key:
//
//   1 axis_weld     capsule.faultLines[9].weld                    ← THE ONLY KEY
//   2 tape_doubt    tape_room.json queue (112 of his own old confusions, verbatim)
//   3 hidden_test   examiner_drill.json hidden_tests — open design probes
//   4 adversarial   drills.json modality voice — "I think that's wrong. Defend it."
//   5 scrimmage     a score out of 25 + the two weakest cracks
//   6 interview     capsule.interviewLines[10] — is the answer interview-grade?
//   7 trap          capsule.traps[7] — did he fall into a known pit?
//   8 doubt_quality FORGE_SPEC Gate 1/Gate 2 — is a new doubt cold-readable?
//
// Seven of those have NOTHING TO COMPARE AGAINST. No amount of speed helps a model
// that cannot form the judgement at all. So Opus is not the better option here, it
// is the ONLY option — and that is a fact about the WORK, not a preference.
//
// NO KEY IS NOT NO GROUND, and this is the part that keeps it honest. Every keyless
// verdict still rides HIS material into the prompt: the capsule's mechanism, its
// traps, its interview lines, the doubt in his own words. The judge is never asked
// what IT thinks a good answer is; it is asked whether what he said holds against
// what he already wrote.
//
// THREE MOMENTS, and each one is placed where its cost is affordable:
//   CAPTURE  in the gap between his answer and the next question. NO model, NO
//            network, NO subprocess. This is also the 11 Aug law: a connection that
//            drops mid-round must not cost him the axes he already defended.
//   PASS 1   the moment he closes the round. ONE Opus call for the WHOLE round.
//   PASS 2   at night, over the whole day at once — because the pattern he needs is
//            invisible inside any single round. "tokenization axis d cracked AND
//            embeddings axis d cracked" is ONE finding, not two events.

const GRADE_QUEUE = join(STATE_DIR, "gaffer_grade_queue.jsonl");
const TAPE_ROOM = join(STATE_DIR, "tape_room.json");
const EXAMINER_DRILL = join(STATE_DIR, "examiner_drill.json");
const DRILLS = join(STATE_DIR, "drills.json");

// THE EIGHT, declared once. Three fields, three separate questions, and keeping
// them separate is LAW 1 of the truth layer — ONE JUDGE, ONE STANDARD, BOTH NAMED:
//   `key`      — is there a RIGHT ANSWER on disk for an item of this type?
//   `standard` — the DECLARED yardstick the judgement is made against. Never null:
//                a verdict with no named standard is the thing this layer exists to
//                abolish. See STANDARDS below for what each one quotes.
//   `owner`    — the organ that RECORDS the verdict, because none of them may be
//                written from here.
// `verdicts` is a closed set — a model returning anything else is discarded, never
// coerced into the nearest legal word.
//
// ⚠ `key` WAS WRONG ON FOUR OF THE EIGHT UNTIL 16 Aug 2026, and it was wrong in the
// expensive direction: it said false where the answer was sitting on disk the whole
// time. `doubts[].a` (26 of 26 on tokenization, 15/15 · 35/35 · 36/36 on the other
// three), `traps[].truth`, and `interviewLines[]` are all HIS OWN prose, and all
// three were being judged with `key: null` — i.e. the judge was asked to decide what
// a good answer looks like on material where he had already written it down.
// THE TWO STANDARDS DO NOT MERGE, deliberately (the work order says so in as many
// words): recall verdicts are graded against HIS capsule, interview-facing ones
// against the DOSSIER. `interview` carries both — his line is the key, the dossier
// is the bar — and that is not a contradiction, it is the whole point of naming them
// separately.
export const VERDICT_TYPES = {
  axis_weld: { key: true, standard: "capsule", owner: "rejirah", verdicts: ["held", "cracked"], asks: "Did the load-bearing mechanism of HIS OWN weld come back, in any words at all?" },
  tape_doubt: { key: true, standard: "capsule", owner: "doubtminer", verdicts: ["broken", "standing"], asks: "Did he cleanly dismantle his OWN past confusion — not merely restate the right answer beside it?" },
  hidden_test: { key: false, standard: "dossier", owner: "capture", verdicts: ["passed", "failed"], asks: "Did he actually satisfy this design probe? It is open-ended on purpose; judge the engineering, not the wording." },
  adversarial: { key: false, standard: "dossier", owner: "capture", verdicts: ["defended", "conceded", "collapsed"], asks: "He was told his position was wrong. Did he DEFEND it on the mechanism, CONCEDE the exact place it breaks (also a win), or COLLAPSE without either?" },
  scrimmage: { key: false, standard: "dossier", owner: "capture", verdicts: ["passed", "failed"], asks: "Under adversarial time pressure, did this probe hold?" },
  interview: { key: true, standard: "dossier", owner: "capture", verdicts: ["interview_grade", "not_yet"], asks: "Would this answer survive a staff engineer asking it in a real loop — mechanism named, trade-off named, limit named?" },
  trap: { key: true, standard: "capsule", owner: "capture", verdicts: ["avoided", "fell_in"], asks: "Did he fall into this KNOWN pit, the one his own capsule warns about?" },
  doubt_quality: { key: false, standard: "cold_reader", owner: "none", verdicts: ["cold_readable", "not_cold_readable"], asks: "FORGE_SPEC Gate 1/2: would a cold reader six months from now understand this doubt without the conversation around it?" },
};
export const STANDARD_NAMES = ["capsule", "dossier", "cold_reader"];

// ── THE STANDARDS, QUOTED FROM THEIR OWN SOURCE ──────────────────────────────
// Every one of these is read from the file that OWNS it rather than restated here,
// because a standard copied into code is a standard that rots the first time he
// edits the doc — the failure this repo has paid for in prose 954 times. The
// DOSSIER's weights come from its live projection, its red-flags from the doc the
// projection itself names as source of truth (`_source.file`), and the cold-reader
// bar from FORGE_SPEC, which is final on it.
//
// A SOURCE THAT DOES NOT PARSE SAYS SO, LOUDLY, IN THE PROMPT. It does not return
// an empty string: an empty standard reads to a judge exactly like a permissive one,
// and "he wrote no traps for himself" is precisely the lie the bug below was telling.
const SPEC_FILE = join(ROOT, "learning-layer", "FORGE_SPEC.md");

function sectionOf(text, startRe, stopRe = /^#{2,3} /m) {
  const s = String(text || "");
  const m = startRe.exec(s);
  if (!m) return "";
  const rest = s.slice(m.index + m[0].length);
  const stop = stopRe.exec(rest);
  return (m[0] + (stop ? rest.slice(0, stop.index) : rest)).trim();
}

// The §7 table's first column is "what NOT to become"; the second maps it onto his
// own named risk. Both ride, because the red-flag alone is generic interview advice
// and the pairing is what makes it about him.
// THE HEADER ROW IS FOUND BY STRUCTURE, NEVER BY ITS WORDS. An earlier pass here
// dropped the header with `/Red flag/i` — which is a regex testing English prose in
// a document, exactly the shape his VOCAB-AGNOSTIC ruling forbids, and it would also
// have silently started emitting the column titles as a red-flag the day he retitles
// that column. A markdown table's header is whatever sits above its `|---|` divider;
// that is a fact about the format, not about the wording.
function dossierRedFlags(deps = {}) {
  const md = deps.scoutMd !== undefined ? deps.scoutMd : readTextFile(OPPONENT_SCOUT);
  const lines = sectionOf(md, /^## 7\. .*$/m).split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  const divider = lines.findIndex((l) => /^\|[\s|:-]+\|$/.test(l));
  const rows = (divider < 0 ? [] : lines.slice(divider + 1))
    .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean))
    .filter((c) => c.length >= 2)
    .map((c) => `  · ${c[0].replace(/\*\*/g, "")}  →  HIS RISK: ${c[1].replace(/\*\*/g, "")}`);
  return rows.length ? rows.join("\n") : null;
}

export function standardBlock(name, deps = {}) {
  if (name === "capsule") {
    return `THE STANDARD FOR THIS TYPE: HIS OWN CAPSULE. The answer key given with the item is prose HE wrote and locked; it is authoritative and your own view of the topic is not. Grade whether the load-bearing mechanism came back, in ANY words — never whether he matched the phrasing.`;
  }
  if (name === "cold_reader") {
    const sec = sectionOf(deps.specMd !== undefined ? deps.specMd : readTextFile(SPEC_FILE), /^### COLD-READER STANDARD.*$/m);
    return sec
      ? `THE STANDARD FOR THIS TYPE: THE COLD-READER STANDARD, quoted verbatim from learning-layer/FORGE_SPEC.md §3, which is final on it. Judge the doubt against THIS bar and nothing else:\n${clip(sec, 4000)}`
      : `THE STANDARD FOR THIS TYPE: the COLD-READER STANDARD — AND IT COULD NOT BE READ off learning-layer/FORGE_SPEC.md. Do NOT substitute your own quality bar: return no grade for doubt_quality items and say the standard was unavailable.`;
  }
  if (name === "dossier") {
    const d = deps.dossier !== undefined ? deps.dossier : readJson(DOSSIER_WEIGHTS, null);
    const rounds = ((d && d.rounds) || []).map((r) => `  · ${r.label} — ${r.minutes} min, weight ${r.weight}`).join("\n");
    const flags = dossierRedFlags(deps);
    if (!rounds && !flags) {
      return `THE STANDARD FOR THIS TYPE: THE DOSSIER — AND IT COULD NOT BE READ, neither half (dressing-room/state/dossier_weights.json nor learning-layer/OPPONENT_SCOUT.md). Do NOT invent an interview bar: return no grade for these items and say the standard was unavailable.`;
    }
    return `THE STANDARD FOR THIS TYPE: THE DOSSIER — the real 4-hour onsite he is training for, distilled from candidate-reported loops (learning-layer/OPPONENT_SCOUT.md; live projection dressing-room/state/dossier_weights.json). Judge as that panel would, not as a teacher would.
${rounds ? `THE ROUNDS AND WHAT THEY ARE WORTH (§1 — weight is how much of the loop rides on it):\n${rounds}` : "  (the round weights could not be read — do not weight, and say so)"}
${flags ? `WHAT SINKS A CANDIDATE (§7 red-flags — each one already mapped onto his own risk):\n${flags}` : "  (the red-flags could not be read — do not invent them, and say so)"}
THE BAR: mechanism named · trade-off named · limit named · and a claim about reliability backed by how it was MEASURED, never by "the prompt is good".`;
  }
  return "";
}
export const isVerdict = (type, v) => !!VERDICT_TYPES[type] && VERDICT_TYPES[type].verdicts.includes(String(v || "").trim().toLowerCase());

// ONE DOOR TO A CAPSULE, ONE DOOR TO A DAY. Three call sites read a capsule and two
// read a day-file; each one built its path inside its own function, which is an
// Unknown to xray and cost this organ four sinks the moment it landed (the per-organ
// ratchet caught it in the next run: 11 -> 15). Same lesson watchman.mjs paid for
// this morning: a path assembled in a function is invisible in the static graph.
// `deps.capsule` short-circuits the read so the four branches that need a capsule
// are all injectable through ONE door (16 Aug 2026). Before this only
// capsuleAnswerKey took an injection, and it took its own — which is why the
// tape_doubt, trap and interview branches had no hermetic test at all, and why the
// missing keys below could sit there for a full commit without anything going red.
function readCapsule(concept, deps = {}) {
  if (deps.capsule !== undefined) return deps.capsule;
  const read = deps.readJson || readJson;
  return read(join(CAPSULE_DIR, String(concept).toLowerCase().replace(/[^a-z0-9_-]/g, "") + ".json"), null);
}
function readDugoutDay(day) { return readTextFile(join(DUGOUT_DIR, String(day) + ".md")); }

// ⚠ READ THE FIELD, DO NOT GUESS ITS NAME — and this function is the scar, not the
// warning. It shipped on 15 Aug reading `capsule.axes[axis].weld`, and a capsule has
// no `axes` key at all: the nine axes live in `faultLines`, an ARRAY of
// {axis, title, strike, weld, status, deep} (the owner's own reader is
// `for (const a of c.faultLines || [])` — grep -n "of c.faultLines" scripts/deep.mjs).
// So it returned "no weld on disk" for every concept and every axis, forever, while
// its selftest stayed green because the only path exercised was the REFUSAL. The
// live-capsule assertions below are the fix that matters.
export function capsuleAnswerKey(concept, axis, deps = {}) {
  const c = deps.capsule !== undefined ? deps.capsule : readCapsule(concept, deps);
  if (!c) return null;
  const want = String(axis || "").trim().toLowerCase();
  const a = (Array.isArray(c.faultLines) ? c.faultLines : []).find((x) => x && String(x.axis || "").trim().toLowerCase() === want);
  if (!a) return null;
  // The KEY is his own weld — the prose he will defend in an interview. `strike` (the
  // cold question) and `title` ride along so a grader knows what was ASKED; `deep`
  // deliberately does NOT — grading a forty-second spoken answer against a
  // four-thousand-word page fails every honest recall.
  const weld = String(a.weld || "").trim();
  return weld ? { concept, axis: a.axis, title: a.title || null, strike: a.strike || null, weld: clip(weld, 4000) } : null;
}

// THE SEAL — the judge is NEVER shown the answer as part of the question.
// This is not defensive coding, it is the repair of a shipped bug: on 15 Aug the
// trap branch below did `JSON.stringify(item)` into `asked`, which put the trap's
// own `truth` inside the question with `key: null`. Every trap verdict produced
// that way was meaningless — the model was marking an answer it had just been
// handed. A leak is refused at the MATERIAL door rather than caught downstream,
// because by the time a prompt is built the item has already been queued against
// his name.
//
// ⚠ THE TEST IS WHOLE-KEY CONTAINMENT, AND THE FIRST VERSION OF IT WAS WRONG.
// It compared the key's first 40 characters, and MEASURED ON HIS LIVE FILES that
// refused a real doubt — tokenization:19, "BPE ek round mein kya karti — …ek saath
// count karke sabse frequent EK merge, YA ek-ek letter pick karke…". A two-option
// question necessarily contains one of its own options; FORGE_SPEC's own ✅ example
// for the FRAGMENT pattern is exactly that shape, so the standard ASKS for questions
// this guard was refusing.
//
// The measurement that settled it, over all 188 live keyed refs on the four locked
// capsules (longest common contiguous run between `asked` and `key`):
//     legitimate overlap — max 52 chars (tokenization:19), median 10
//     shortest WHOLE key the shipped bug could leak — trap truth 53, doubt answer 21
// The two ranges OVERLAP, so no contiguous-run threshold can separate a leak from a
// legitimate two-option question. There is no number to tune here and inventing one
// would trade a loud bug for a quiet one — it would start silently dropping his real
// doubts out of the queue, which is worse than the leak it replaced, because a
// refused item looks exactly like an item nobody asked.
// Whole-key containment has no such ambiguity: a question that contains the ENTIRE
// answer verbatim is a leak at any length, and that is precisely the shape
// JSON.stringify produced.
function sealed(mat) {
  if (!mat || !mat.key || !mat.asked) return mat;
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
  return norm(mat.asked).includes(norm(mat.key)) ? null : mat;
}

// gradeMaterial — WHAT the judge is given for one captured item. Every branch reads
// a real file and returns null when it cannot find the thing, so a probe with no
// material is REFUSED at capture rather than judged against nothing.
//
// FOUR OF THESE BRANCHES HANDED BACK `key: null` WHILE THE ANSWER SAT ON DISK
// (repaired 16 Aug 2026, the truth layer's BLOCK 0). Verified live on all four
// locked capsules before the change: `doubts[].a` present on 112 of 112 rows across
// tokenization · embeddings · inference · context; `traps[].truth` on every trap;
// `interviewLines[]` a plain string array. None of it reached the judge.
export function gradeMaterial(type, ref, deps = {}) {
  const read = deps.readJson || readJson;
  const std = (VERDICT_TYPES[type] || {}).standard || null;
  if (type === "axis_weld") {
    const [concept, axis] = String(ref).split(":");
    const k = deps.answerKey !== undefined ? deps.answerKey : capsuleAnswerKey(concept, axis, deps);
    return k ? sealed({ concept, label: `axis ${k.axis}${k.title ? ` (${k.title})` : ""}`, asked: k.strike, key: k.weld, standard: std }) : null;
  }
  if (type === "tape_doubt") {
    // THE QUESTION IS THE TAPE ROOM'S, THE ANSWER IS THE CAPSULE'S. The queue row
    // carries `q_verbatim` and a `doubt_index` pointing INTO the capsule — and the
    // answer this whole type is graded against, `doubts[idx].a`, was one array
    // lookup away and never taken. `asked` stays q_verbatim only: the row has no
    // other field and must never grow one, because the doubt's answer living beside
    // the doubt's question is the trap branch's bug in a different coat.
    const [capsule, idxRaw] = String(ref).split(":");
    const idx = Number(idxRaw);
    const tr = deps.tapeRoom !== undefined ? deps.tapeRoom : read(TAPE_ROOM, null);
    const row = ((tr && tr.queue) || []).find((q) => q && q.capsule === capsule && Number(q.doubt_index) === idx);
    if (!row) return null;
    const c = readCapsule(capsule, deps);
    const d = (c && Array.isArray(c.doubts) ? c.doubts : [])[idx];
    const a = d && typeof d.a === "string" ? d.a.trim() : "";
    return sealed({ concept: capsule, label: `tape-room doubt #${idx}`, asked: row.q_verbatim, key: a ? clip(a, 4000) : null, standard: std });
  }
  if (type === "hidden_test") {
    const ex = deps.examiner !== undefined ? deps.examiner : read(EXAMINER_DRILL, null);
    const tests = (ex && ex.hidden_tests) || [];
    const t = tests[Number(ref)];
    return t ? { concept: (ex && ex.concept) || null, label: `hidden test #${ref}`, asked: t, key: null, standard: std, extra: ex && ex.task ? `THE TASK IT SITS ON: ${ex.task}` : null } : null;
  }
  if (type === "adversarial" || type === "scrimmage") {
    const dr = deps.drills !== undefined ? deps.drills : read(DRILLS, null);
    const d = ((dr && dr.drills) || [])[Number(ref)];
    return d ? { concept: (d.concepts || [])[0] || null, label: `${d.kind || "drill"} (${d.modality || "?"})`, asked: d.prompt, key: null, standard: std } : null;
  }
  if (type === "trap") {
    // THE BAIT IS THE QUESTION, THE TRUTH IS THE KEY, AND `wrong` IS NEITHER —
    // it is his note to himself about WHY the bait is tempting, so it belongs on
    // the judge's side, never in the ask.
    const [concept, idxRaw] = String(ref).split(":");
    const c = readCapsule(concept, deps);
    const t = (c && Array.isArray(c.traps) ? c.traps : [])[Number(idxRaw)];
    if (!t) return null;
    const bait = typeof t === "string" ? t : String(t.bait || "").trim();
    const truth = typeof t === "string" ? "" : String(t.truth || "").trim();
    const wrong = typeof t === "string" ? "" : String(t.wrong || "").trim();
    if (!bait) return null;
    return sealed({
      concept, label: `trap #${idxRaw}`, asked: bait,
      key: truth ? clip(truth, 4000) : null, standard: std,
      extra: wrong ? `WHY THE BAIT IS TEMPTING, in his own words: ${clip(wrong, 400)}` : null,
    });
  }
  if (type === "interview") {
    // THE INDEX SELECTS THE BAR, NOT THE QUESTION. His interviewLines are ANSWERS,
    // so showing one as `asked` was the trap leak again — the item handed the model
    // the very sentence it was grading. The probe is therefore built from the
    // concept and the DOSSIER's grammar, and his other lines ride as context so an
    // answer that reaches a DIFFERENT line of his own is never marked as a miss.
    const [concept, idxRaw] = String(ref).split(":");
    const c = readCapsule(concept, deps);
    const lines = (c && Array.isArray(c.interviewLines) ? c.interviewLines : [])
      .map((l) => (typeof l === "string" ? l : String((l && l.line) || ""))).map((s) => s.trim()).filter(Boolean);
    const line = lines[Number(idxRaw)];
    if (!line) return null;
    const others = lines.filter((_, i) => i !== Number(idxRaw)).slice(0, 6);
    return sealed({
      concept, label: `interview line #${idxRaw}`,
      asked: `A staff engineer asks him about "${concept}" in a real loop. He answers from memory, out loud, with no notes: name the mechanism, the trade-off, and the limit.`,
      key: clip(line, 4000), standard: std,
      extra: others.length ? `HIS OTHER INTERVIEW-GRADE LINES FOR THIS CONCEPT — an answer that reaches ANY of these is not a miss:\n${others.map((l) => `  · ${clip(l, 300)}`).join("\n")}` : null,
    });
  }
  if (type === "doubt_quality") return { concept: String(ref).split(":")[0] || null, label: "a new doubt he just wrote", asked: null, key: null, standard: std };
  return null;
}

// capsuleGround — HIS material, for the seven verdicts that have no key. This is the
// difference between "judge it" and "judge it against what he already wrote".
export function capsuleGround(concept, deps = {}) {
  if (!concept) return "";
  const c = readCapsule(concept, deps);
  if (!c) return "";
  const L = [];
  if (c.mechanism) L.push(`MECHANISM (his own): ${clip(c.mechanism, 900)}`);
  // ⚠ THE FIFTEENTH INSTANCE OF THE SAME DISEASE, found 16 Aug 2026 while wiring
  // BLOCK 0 and worth more than the branch it sits in. This read `t.trap` — a field
  // NO CAPSULE HAS. The real shape is `{bait, wrong, truth}` (verified on all four
  // locked capsules). So the map produced an array of empty strings, `filter(Boolean)`
  // emptied it, and the line rendered as the bare header
  //     "KNOWN TRAPS he wrote for himself: "
  // in every ground block this organ has ever built. Not absent — WORSE than absent:
  // a judge reading it is told, in his own capsule's voice, that he wrote no traps
  // for himself. Same class as capsuleAnswerKey's `capsule.axes[axis]`, one function
  // over, and it survived that repair because nothing asserted the CONTENT of a
  // ground block, only that one could be built.
  // THE TRUTH DELIBERATELY DOES NOT RIDE HERE. A round is judged in ONE prompt with
  // ONE shared ground, so a trap's `truth` in the ground is that trap item's answer
  // key leaking back in by the side door — the exact bug BLOCK 0 exists to close.
  // The pit and why it tempts him are ground; the way out is a key, and keys travel
  // per item.
  const traps = (Array.isArray(c.traps) ? c.traps : [])
    .map((t) => (typeof t === "string" ? t : [String((t && t.bait) || "").trim(), String((t && t.wrong) || "").trim()].filter(Boolean).join(" — ")))
    .map((s) => s.trim()).filter(Boolean).slice(0, 7);
  if (traps.length) L.push(`KNOWN PITS he wrote for himself (the bait, and why it tempts him — the way OUT is deliberately not here):\n${traps.map((t) => `  · ${clip(t, 300)}`).join("\n")}`);
  if (Array.isArray(c.interviewLines) && c.interviewLines.length) L.push(`WHAT HE CALLS INTERVIEW-GRADE here: ${c.interviewLines.map((l) => (typeof l === "string" ? l : l.line || "")).filter(Boolean).slice(0, 4).join(" · ")}`);
  return L.length ? `\nHIS OWN GROUND FOR "${concept}" (judge against THIS, never against your own idea of a good answer):\n${L.join("\n")}` : "";
}

// ---------------------------------------------------------------------------
// CAPTURE — the fast half. NO MODEL, NO NETWORK, NO SUBPROCESS.
// ---------------------------------------------------------------------------
// THE GUT-WORD LAW IS HELD AT THIS DOOR TOO. capture.mjs refuses a rep without one
// and rejirah.mjs refuses a round without one; this is the third writer of the same
// law and it must give the same answer, or the loosest door becomes the real rule.
export function gradeCapture({ type = "axis_weld", ref, spoken, gut }, deps = {}) {
  const now = deps.now || new Date();
  if (!VERDICT_TYPES[type]) return { ok: false, reason: "unknown-type", say: `gaffer_brain: unknown verdict type "${type}". Legal: ${Object.keys(VERDICT_TYPES).join(", ")}.` };
  const word = String(gut || "").trim().toLowerCase();
  if (!["knew", "shaky", "guessed"].includes(word)) return { ok: false, reason: "no-gut", say: "gaffer_brain: --gut is required and must be knew|shaky|guessed, committed BEFORE the answer. GUT-WORD LAW: no gut-word, no rep." };
  const said = String(spoken || "").trim();
  if (said.length < 10) return { ok: false, reason: "empty", say: "gaffer_brain: nothing was said — an empty answer is not a failed one, and guessing which it was is exactly what this lane must never do." };
  const mat = deps.material !== undefined ? deps.material : gradeMaterial(type, ref, deps);
  if (!mat) return { ok: false, reason: "no-material", say: `gaffer_brain: nothing on disk for ${type} "${ref}" — grading needs HIS page, and inventing one is the single thing this lane must never do.` };
  const row = {
    v: 2, kind: "capture",
    id: `${type}:${ref}:${now.toISOString()}`,
    ts: now.toISOString(), day: istDay(now),
    type, ref, concept: mat.concept, label: mat.label,
    gut: word,
    asked: mat.asked ? clip(mat.asked, 1200) : null,
    // THE STANDARD IS ON THE ROW, not only in the prompt — LAW 1 of the truth layer
    // says every judgement about him names the yardstick it was made against, and a
    // yardstick that exists only inside a prompt string is unreadable six months from
    // now, which is exactly when someone will ask why a verdict said what it said.
    standard: mat.standard || null,
    key: mat.key ? clip(mat.key, 4000) : null,     // now non-null for four of the eight — see VERDICT_TYPES
    extra: mat.extra || null,
    spoken: clip(said, 4000),
  };
  if (!deps.dry) { try { mkdirSync(dirname(GRADE_QUEUE), { recursive: true }); appendFileSync(GRADE_QUEUE, JSON.stringify(row) + "\n"); } catch { } }
  return { ok: true, row, captured: row.id, type, has_key: !!mat.key };
}

// outstandingGrades — captures with no settlement row after them. Derived, never
// stored, so a crash between judging and recording cannot lose his spoken answer.
export function outstandingGrades(rows) {
  const settled = new Set((rows || []).filter((r) => r && r.kind === "settled").map((r) => r.of));
  return (rows || []).filter((r) => r && r.kind === "capture" && !settled.has(r.id));
}

// ---------------------------------------------------------------------------
// PASS 1 — ROUND CLOSE. One Opus call, the whole round, whatever types are in it.
// ---------------------------------------------------------------------------
export function buildJudgePrompt(items, deps = {}) {
  const types = [...new Set(items.map((i) => i.type))];
  const grounds = [...new Set(items.map((i) => i.concept).filter(Boolean))]
    .map((c) => capsuleGround(c, deps)).filter(Boolean).join("\n");
  return `You are grading a live study round for ONE learner. He answered every item below OUT LOUD, cold, from memory.

GRADE THE MECHANISM, NEVER THE WORDING. Speech is transcribed, so it arrives broken, repetitive and unpunctuated — none of that is an error, and none of it is evidence about what he knows. He is not reciting; he is reconstructing.

SOME ITEMS CARRY AN ANSWER KEY AND SOME DO NOT, DELIBERATELY. Where a key is given, it is prose HE wrote himself and it is authoritative — your own view of the topic is not. Where there is none, judge against the DECLARED STANDARD for that type and against HIS OWN GROUND below — his mechanism, his pits, his interview lines. If neither settles it, say so in "why" rather than inventing a standard.

THE VERDICT TYPES IN THIS ROUND, the question each one asks, and the standard it is judged against:
${types.map((t) => `  ${t} → ${VERDICT_TYPES[t].asks}\n      legal verdicts: ${VERDICT_TYPES[t].verdicts.join(" | ")}\n      standard: ${VERDICT_TYPES[t].standard}${VERDICT_TYPES[t].key ? " · an answer key of his own rides with each item" : " · no answer key exists for this type"}`).join("\n")}

${[...new Set(types.map((t) => VERDICT_TYPES[t].standard))].map((s) => standardBlock(s, deps)).filter(Boolean).join("\n\n")}
${grounds}

Return STRICT JSON, no fences, no prose outside it:
{"grades":[{"id":"<the item id, copied exactly>","verdict":"<one legal verdict for THAT item's type>","missing":["<what he did not say that his own material has>"],"why":"<one sentence, plain, addressed to him>"}]}
One entry per item. Copy the id EXACTLY — it is how each grade is matched back. Return NOTHING for an item you cannot judge; a missing grade is honest, a guessed one is not.

=== THE ROUND ===
${items.map((it, i) => `
--- ITEM ${i + 1} · id ${it.id} · type ${it.type} · ${it.label || it.ref}${it.concept ? ` · concept "${it.concept}"` : ""} · his gut-word before answering: ${it.gut}
${it.asked ? `WHAT HE WAS ASKED / THE THING UNDER TEST:\n${it.asked}` : ""}
${it.extra ? `${it.extra}` : ""}
${it.key ? `ANSWER KEY (his own words, authoritative):\n${it.key}` : "(NO ANSWER KEY EXISTS FOR THIS ONE — judge against his ground above.)"}

WHAT HE SAID OUT LOUD, COLD:
${it.spoken}`).join("\n")}

Return the JSON now.`;
}

// THE OWNER TABLE. Nothing here writes another organ's file: each verdict is
// DISPATCHED through the owner's own CLI, because those organs derive real state
// from the row they write (rejirah derives nextDue, fluency and the calibration gap;
// doubtminer guards against phantom retires; capture holds the rep contract).
export function ownerCommand(s) {
  const t = VERDICT_TYPES[s.type];
  if (!t) return null;
  if (t.owner === "rejirah") {
    const [concept, axis] = String(s.ref).split(":");
    return { organ: "rejirah.mjs", argv: ["grade", concept, axis, s.verdict, "--gut", s.gut] };
  }
  if (t.owner === "doubtminer") {
    // ONLY a clean break retires the doubt. "standing" means it survived, and
    // retiring a doubt he did not dismantle would delete the evidence that he
    // still holds it — the one thing the tape room exists to remember.
    if (s.verdict !== "broken") return { organ: null, note: "the doubt still stands — nothing is retired, which is the record staying true" };
    const [capsule, idx] = String(s.ref).split(":");
    return { organ: "doubtminer.mjs", argv: ["retire", capsule, String(idx)] };
  }
  if (t.owner === "capture") {
    // A rep is the organism's unit of studied work, and capture.mjs is its only
    // door. The pass/fail mapping is declared per type rather than inferred, so a
    // new verdict word can never silently become a "miss he never made".
    const won = { passed: true, failed: false, defended: true, conceded: true, collapsed: false, interview_grade: true, not_yet: false, avoided: true, fell_in: false }[s.verdict];
    if (won === undefined) return null;
    return { organ: "capture.mjs", argv: ["rep", "--concept", s.concept || String(s.ref).split(":")[0], "--q", clip(s.label || s.ref, 160), "--gut", s.gut, "--correct", String(won)] };
  }
  // doubt_quality has no owner organ today — the verdict lives in this organ's own
  // journal and is read by the forge's Gate 1/Gate 2 review. Named, not pretended.
  return { organ: null, note: "no owner organ for this type — the verdict stays in gaffer_brain.jsonl for the Gate 1/2 review" };
}

export async function gradeJudge(deps = {}) {
  const now = deps.now || new Date();
  const rows = deps.rows !== undefined ? deps.rows : readJournal(GRADE_QUEUE, 800);
  const items = outstandingGrades(rows);
  if (!items.length) return { ok: true, skipped: "nothing captured since the last judge — the round is already settled", graded: 0 };

  const prompt = buildJudgePrompt(items, deps);
  // claudeGen is the house door: it REFUSES when ANTHROPIC_API_KEY is set (his
  // standing law), and it is the same lane every other Opus job rides. effort max is
  // his 14 Aug ruling, and unlike the Watcher's per-turn path nothing is waiting on
  // this call, so the ruling costs nothing here.
  const gen = deps.generate || (async (p) => {
    const { claudeGen } = await import("./claudegen.mjs");
    return claudeGen(p, "opus", 300000, ["--effort", "max"]);
  });
  const r = await gen(prompt);
  if (!r || !r.ok) return { ok: false, reason: "lane-down", say: `gaffer_brain: the judge lane did not answer (${(r && r.error) || "no reply"}) — the round STAYS in the queue and nothing was invented. Run judge-round again.`, outstanding: items.length };

  let parsed = null;
  try { const t = String(r.text); const a = t.indexOf("{"), b = t.lastIndexOf("}"); parsed = JSON.parse(a >= 0 ? t.slice(a, b + 1) : t); } catch { }
  const grades = (parsed && Array.isArray(parsed.grades)) ? parsed.grades : null;
  if (!grades) return { ok: false, reason: "unparseable", say: "gaffer_brain: the judge answered in a shape this organ will not act on — the round STAYS in the queue.", outstanding: items.length };

  // MATCHED BY ID, NEVER BY POSITION. A model returning eight grades for nine items
  // would otherwise shift every verdict by one and mark the wrong things — plausible,
  // silent, and completely wrong. An item with no grade, or with a verdict outside
  // its type's legal set, stays OUTSTANDING and is judged again; it is never coerced.
  const settled = [], missed = [];
  for (const it of items) {
    const g = grades.find((x) => x && String(x.id) === it.id);
    const verdict = g && isVerdict(it.type, g.verdict) ? String(g.verdict).trim().toLowerCase() : null;
    if (!verdict) { missed.push(`${it.type}:${it.ref}`); continue; }
    settled.push({
      v: 2, kind: "settled", of: it.id, ts: now.toISOString(), day: istDay(now),
      type: it.type, ref: it.ref, concept: it.concept, label: it.label, gut: it.gut, verdict,
      missing: Array.isArray(g.missing) ? g.missing.slice(0, 8) : [],
      why: clip(g.why, 300), engine: "opus", pass: 1,
    });
  }

  // THREE NAMED SPAWNS, NOT ONE DYNAMIC ONE. `execFileSync(…, [join(HERE, cmd.organ)])`
  // is one line and it is an Unknown to the static analyser — the organ→organ edge
  // simply vanishes from the graph, and the per-organ sink ratchet charges for it.
  // Written out, each edge is visible to xray, mutagen and blackbox, which is the
  // whole point of that budget existing.
  const dispatch = deps.dispatch || ((cmd) => {
    if (!cmd || !cmd.organ) return { ok: true, noop: true, note: cmd && cmd.note };
    const fail = (e) => ({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
    const opt = { encoding: "utf8", timeout: 30000, windowsHide: true };
    if (cmd.organ === "rejirah.mjs") {
      try { execFileSync(process.execPath, [join(HERE, "rejirah.mjs"), ...cmd.argv], opt); return { ok: true }; } catch (e) { return fail(e); }
    }
    if (cmd.organ === "doubtminer.mjs") {
      try { execFileSync(process.execPath, [join(HERE, "doubtminer.mjs"), ...cmd.argv], opt); return { ok: true }; } catch (e) { return fail(e); }
    }
    if (cmd.organ === "capture.mjs") {
      try { execFileSync(process.execPath, [join(HERE, "capture.mjs"), ...cmd.argv], opt); return { ok: true }; } catch (e) { return fail(e); }
    }
    return { ok: false, error: `no such owner organ: ${cmd.organ}` };
  });
  // ⚠ --dry MEANS TOUCH NOTHING, AND IT DID NOT. Until this line `dry` only skipped
  // the settlement append while STILL dispatching every verdict to rejirah,
  // doubtminer and capture — so a rehearsal wrote into his real study record. Found
  // the way these things always are: the acceptance run for this very build put three
  // fabricated rows into his own rejirah_log, reps_log and tape_room. A flag whose
  // name promises safety and delivers half of it is worse than no flag at all.
  // An INJECTED dispatch still runs under dry — that is the selftest's own stub, and
  // it is the thing being tested.
  const dispatched = [], refused = [];
  for (const s of settled) {
    const d = (deps.dry && !deps.dispatch)
      ? { ok: true, noop: true, note: "DRY RUN — the owner was NOT called and nothing was recorded" }
      : dispatch(ownerCommand(s));
    if (d.ok) dispatched.push({ ...s, owner_noop: !!d.noop, owner_note: d.note || null });
    else refused.push({ ref: `${s.type}:${s.ref}`, error: d.error });
  }
  // ONLY WHAT THE OWNER ACCEPTED IS MARKED SETTLED. A verdict an owner refused is not
  // a graded item, and writing a settlement row for it would lose his spoken answer.
  if (!deps.dry) {
    try { mkdirSync(dirname(GRADE_QUEUE), { recursive: true }); for (const s of dispatched) appendFileSync(GRADE_QUEUE, JSON.stringify(s) + "\n"); } catch { }
  }
  return { ok: true, graded: dispatched.length, types: [...new Set(dispatched.map((s) => s.type))], settled, dispatched, refused, missed, outstanding: items.length - dispatched.length, calls: 1 };
}

// ---------------------------------------------------------------------------
// PASS 2 — THE NIGHT READ. The whole day at once, because a pattern is invisible
// inside a single round.
// ---------------------------------------------------------------------------
// His words: "tokenization axis d cracked AND embeddings axis d cracked" is ONE
// pattern, not two events — and no round-close pass can ever see it, because each
// round only holds its own items. This pass also CROSS-CHECKS Pass 1: it is allowed
// to say a verdict was wrong, and it says so with its reason rather than silently
// rewriting it (Pass 1's row stays; a correction is a NEW row that names the old one).
// It rides the night shift's existing lane — no new scheduler.
export function buildNightPrompt(settled, transcript) {
  return `You are reading ONE learner's whole day of study at once, at night, after every round is closed. You are looking for what no single round could show.

You are given every verdict recorded today, across every type of probe, plus the day's conversation. Find the PATTERNS THAT CROSS ROUNDS. Examples of the shape (not of the content): the same AXIS failing on two different concepts is one finding about that axis, not two failures. A trap avoided in one concept and fallen into in another is one finding about transfer. A gut-word of "knew" on things that then cracked is one finding about calibration, and it is the most important kind.

You may also CORRECT a verdict from earlier today if the day's whole record shows it was wrong — say which, and why. Do not correct one merely because you would have worded it differently.

Return STRICT JSON, no fences:
{"patterns":[{"finding":"<one sentence, plain, addressed to him>","evidence":["<the specific items this rests on>"],"kind":"axis"|"transfer"|"calibration"|"pace"|"other","acts_on":"nemesis"|"calibration"|"edgemap"|"none"}],
 "corrections":[{"of":"<type:ref>","was":"<verdict>","should_be":"<verdict>","why":"<one sentence>"}]}
Return an EMPTY patterns array if the day genuinely holds no cross-round pattern. A manufactured pattern is worse than none — he will act on it.

=== TODAY'S VERDICTS ===
${settled.map((s) => `- ${s.type} · ${s.label || s.ref}${s.concept ? ` · concept "${s.concept}"` : ""} · gut ${s.gut} → ${s.verdict}${s.missing && s.missing.length ? ` · missed: ${s.missing.join(" · ")}` : ""}${s.why ? ` · "${s.why}"` : ""}`).join("\n") || "(none)"}

=== TODAY'S CONVERSATION ===
${clip(transcript || "(no transcript on disk for today)", 30000)}

Return the JSON now.`;
}

export async function gradeNight(deps = {}) {
  const now = deps.now || new Date();
  const day = istDay(now);
  const rows = deps.rows !== undefined ? deps.rows : readJournal(GRADE_QUEUE, 800);
  const settled = rows.filter((r) => r && r.kind === "settled" && r.day === day);
  // TWO IS THE FLOOR AND IT IS NOT A TUNED NUMBER: a cross-round pattern needs at
  // least two rounds to cross. One verdict cannot hold one.
  if (settled.length < 2) return { ok: true, skipped: `only ${settled.length} verdict(s) today — a cross-round pattern needs at least two rounds to cross`, patterns: 0 };

  const transcript = deps.transcript !== undefined ? deps.transcript
    : readDugoutDay(day);
  const gen = deps.generate || (async (p) => {
    const { claudeGen } = await import("./claudegen.mjs");
    return claudeGen(p, "opus", 300000, ["--effort", "max"]);
  });
  const r = await gen(buildNightPrompt(settled, transcript));
  if (!r || !r.ok) return { ok: false, reason: "lane-down", say: `gaffer_brain: the night read did not answer (${(r && r.error) || "no reply"}) — nothing was written and nothing was invented.` };
  let parsed = null;
  try { const t = String(r.text); const a = t.indexOf("{"), b = t.lastIndexOf("}"); parsed = JSON.parse(a >= 0 ? t.slice(a, b + 1) : t); } catch { }
  if (!parsed || !Array.isArray(parsed.patterns)) return { ok: false, reason: "unparseable", say: "gaffer_brain: the night read answered in a shape this organ will not act on — nothing was written." };

  const patterns = parsed.patterns.filter((p) => p && p.finding).map((p) => ({
    finding: clip(p.finding, 400), evidence: Array.isArray(p.evidence) ? p.evidence.slice(0, 8) : [],
    kind: ["axis", "transfer", "calibration", "pace", "other"].includes(p.kind) ? p.kind : "other",
    acts_on: ["nemesis", "calibration", "edgemap", "none"].includes(p.acts_on) ? p.acts_on : "none",
  }));
  // A CORRECTION IS A NEW ROW, NEVER A REWRITE. Pass 1's verdict stays on disk with
  // its timestamp; the night's disagreement sits beside it and names it. That is the
  // only way a reader can ever tell "the judge changed its mind" from "the judge was
  // always right", and the second pass is not automatically the better one.
  const corrections = (Array.isArray(parsed.corrections) ? parsed.corrections : [])
    .filter((c) => c && c.of && c.should_be)
    .map((c) => ({ of: String(c.of), was: String(c.was || ""), should_be: String(c.should_be), why: clip(c.why, 300) }));

  const row = { v: 2, kind: "night", ts: now.toISOString(), day, pass: 2, verdicts_read: settled.length, patterns, corrections, engine: "opus" };
  // Written to THIS organ's own journal. nemesis.mjs, calibration.mjs and rejirah's
  // edgeMap are the declared consumers — they READ it; nothing is written into their
  // files from here.
  if (!deps.dry) { try { mkdirSync(dirname(JOURNAL), { recursive: true }); appendFileSync(JOURNAL, JSON.stringify(row) + "\n"); } catch { } }
  return { ok: true, row, patterns: patterns.length, corrections: corrections.length, read: settled.length };
}

// ---------------------------------------------------------------------------
// FROZEN 15 Aug 2026 — THE CEREBRAS KEY READER (LAYERING law, his instruction:
// "loadCerebrasKey() ko *Legacy bana ke FREEZE karo, delete nahi").
// ---------------------------------------------------------------------------
// NO CALLER POINTS HERE. It survives as the record of a lane that was specced,
// built, keyed, and never once returned a verdict — every model its account could
// list answered 402 payment_required, and Cerebras's own notice ends the free tier
// on 17 Aug 2026. Kept because the layering law is about being able to read what was
// tried, not about keeping it reachable; and because the NEXT time a fast third-party
// grader looks obvious, this is the evidence that the speed was never the constraint.
// The csk-/gsk_ scrubber patterns in hooks/afferent-post.mjs are NOT part of this and
// stay live — those are about the next key anyone pastes.
export function loadCerebrasKeyLegacy(envText = null) {
  if (envText === null && (process.env.CEREBRAS_API_KEY || process.env.CEREBRAS_KEY)) {
    return String(process.env.CEREBRAS_API_KEY || process.env.CEREBRAS_KEY).trim();
  }
  const text = envText !== null ? envText : readTextFile(CEREBRAS_ENV_LEGACY);
  for (const line of String(text).split("\n")) {
    const m = line.match(/^\s*(?:CEREBRAS_API_KEY|CEREBRAS_KEY)\s*=\s*(.+)$/);
    if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
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
    console.log(`  keys: gemini pool ${loadGeminiKeys().length} · grade queue ${outstandingGrades(readJournal(GRADE_QUEUE, 500)).length} axis/axes waiting for judge-round`);
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
  // CAPTURE — the fast half. Runs in the gap between his answer and the next
  // question, so it does exactly one thing and does it without a model.
  //   capture <type> <ref> --gut <word>      (his spoken answer on stdin)
  //   ref shapes: axis_weld            concept:axis      · interview/trap  concept:index
  //               tape_doubt           capsule:doubt_index
  //               hidden_test          test index        · adversarial/scrimmage  drill index
  if (mode === "capture") {
    const flag = (n) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : undefined; };
    const r = gradeCapture({ type: process.argv[3], ref: process.argv[4], gut: flag("gut"), spoken: readFileSync(0, "utf8") });
    if (!r.ok) { console.log(r.say); process.exit(1); }
    const ground = r.has_key ? "against his own weld" : "NO answer key exists for this type — it is judged against his own capsule ground";
    console.log(`gaffer_brain: captured ${r.row.type} · ${r.row.label} · gut ${r.row.gut} · ${ground}. Nothing was judged and nothing was spent.`);
    return;
  }
  // PASS 1 — ROUND CLOSE. One Opus call, the whole round, whatever types are in it.
  if (mode === "judge-round") {
    const r = await gradeJudge({ dry: process.argv.includes("--dry") });
    if (r.skipped) { console.log("gaffer_brain: " + r.skipped); return; }
    if (!r.ok) { console.log(r.say); process.exit(1); }
    console.log(`gaffer_brain: ${r.graded} item(s) graded in ONE Opus call · types: ${r.types.join(", ") || "—"}${r.outstanding ? ` · ${r.outstanding} still outstanding` : ""}`);
    for (const s of r.dispatched) {
      console.log(`  ${String(s.type).padEnd(13)} ${s.verdict.toUpperCase().padEnd(16)} (gut ${s.gut})  ${s.why}`);
      if (s.owner_note) console.log(`      ${s.owner_note}`);
      if (s.missing.length) console.log(`      missed: ${s.missing.join(" · ")}`);
    }
    for (const m of r.refused) console.log(`  ${m.ref}  NOT RECORDED — the owner refused it: ${m.error}`);
    if (r.missed.length) console.log(`  ${r.missed.join(", ")} — no legal verdict came back for these; they stay in the queue and are judged again (never coerced).`);
    return;
  }
  // PASS 2 — THE NIGHT READ. Rides the night shift's existing lane; no new scheduler.
  if (mode === "judge-night") {
    const r = await gradeNight({ dry: process.argv.includes("--dry") });
    if (r.skipped) { console.log("gaffer_brain: " + r.skipped); return; }
    if (!r.ok) { console.log(r.say); process.exit(1); }
    console.log(`gaffer_brain: read ${r.read} verdict(s) across today's rounds in ONE Opus call · ${r.patterns} cross-round pattern(s) · ${r.corrections} correction(s)`);
    for (const pt of r.row.patterns) {
      console.log(`  [${pt.kind} → ${pt.acts_on}] ${pt.finding}`);
      if (pt.evidence.length) console.log(`      on: ${pt.evidence.join(" · ")}`);
    }
    for (const c of r.row.corrections) console.log(`  CORRECTS ${c.of}: ${c.was} → ${c.should_be} — ${c.why}`);
    return;
  }
  if (mode === "queue") {
    const out = outstandingGrades(readJournal(GRADE_QUEUE, 800));
    if (!out.length) { console.log("gaffer_brain: nothing outstanding — every captured item has been judged and recorded."); return; }
    console.log(`gaffer_brain: ${out.length} captured item(s) waiting for judge-round:`);
    for (const it of out) console.log(`  ${String(it.type).padEnd(13)} ${it.label || it.ref} · gut ${it.gut} · ${String(it.spoken).length} chars said · ${it.key ? "has a key" : "no key"}`);
    return;
  }
  if (mode === "selftest") return selftest();
  console.error("usage: gaffer_brain.mjs [judge [--dry]|note|blocks [--raw]|status|probe|capture <type> <ref> --gut <word>|judge-round|judge-night|queue|selftest]");
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
          "^CAPTAIN:", "^CAPTAIN:\\s*", "^GAFFER", "^GAFFER\\([a-z_]+\\)",  // the bridge's own prefixes
          "\\s+", "\\r?\\n",                                          // whitespace, line splits
          "^[\"']|[\"']$",                                            // strip quotes off an env value
          "[^a-z0-9_-]",                                              // capsule filename slug
          "\\.json$",                                                 // a capsule FILENAME extension
          "^\\s*(?:CEREBRAS_API_KEY|CEREBRAS_KEY)\\s*=\\s*(.+)$",      // the FROZEN legacy env reader — no live caller
          // ── added 16 Aug 2026 with BLOCK 0, deliberately and in the same commit ──
          // The two STANDARDS are quoted from the documents that own them rather than
          // restated in code, so this organ now parses markdown STRUCTURE: a heading,
          // two section anchors, a table divider, and bold markers. Every one of them
          // is a fact about the file FORMAT — none can test his phrasing, which is
          // what the ruling is about. The header row of the §7 table is found by its
          // divider rather than by its column title for exactly this reason.
          "^#{2,3} ",                                                 // any markdown heading — where a section stops
          "^## 7\\. .*$",                                             // OPPONENT_SCOUT §7, the red-flags table
          "^### COLD-READER STANDARD.*$",                             // FORGE_SPEC §3, the doubt-quality bar
          "^\\|[\\s|:-]+\\|$",                                        // a markdown table's divider row
          "\\*\\*",                                                   // bold markers, stripped out of a quoted cell
        ]);
        const suspect = rx.filter((p) => !MACHINE_ONLY.has(p));
        assert(`HIS RULING · VOCAB-AGNOSTIC, held by source: all ${rx.length} regex literals in the production half parse the MACHINE's own markers — not one tests HIS words`,
          suspect.length === 0, `these test something else: ${suspect.map((p) => "/" + p + "/").join(" · ")}`);
        assert("HIS RULING · SESSION-AGNOSTIC: the 15 Aug sitting appears as EVIDENCE in the header and as a FIXTURE in the selftest, and nowhere in the production code",
          !prodCode.includes("15th of August") && !prodCode.includes("Adhikari") && !prodCode.includes("that is a bit weird") && !prodCode.includes("बिफोर"),
          "one of his 15 Aug lines has leaked into executable code");
        assert("THE BRAIN NEVER BLOCKS THE MOUTH · every path out of `judge` exits 0 — a failure lands in the journal, never on the hot path",
          /if \(mode === "judge"\)[\s\S]{0,1400}?journalRow\(\{ engine: "none", error/.test(src) && !/if \(mode === "judge"\)[\s\S]{0,1400}?process\.exit\(1\)/.test(src));
        assert("SOLE WRITER · this organ writes exactly three files, and its header declares all three",
          src.indexOf("gaffer_grade_queue.jsonl   (captured") > 0
          && [...src.matchAll(/(?:writeAtomic|appendFileSync)\(([A-Z_]+)/g)].every((m) => ["JOURNAL", "BLOCKS", "GRADE_QUEUE"].includes(m[1])));
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

      // ── 9 · THE JUDGE — EIGHT VERDICT TYPES, FOUR WITH A KEY ─────────────
      // ⚠ THIS ASSERTION USED TO PIN THE OPPOSITE, AND IT WAS PINNING A DEFECT.
      // Until 16 Aug 2026 it read "exactly ONE of the eight has an answer key",
      // green, while `doubts[].a` · `traps[].truth` · `interviewLines[]` sat on disk
      // on all four locked capsules and were passed to the judge as `key: null`. A
      // test can only ever hold the claim it was written to hold; this one held
      // "one", so the day someone found the other three it was the test that had to
      // change. The claim now is the one worth holding: whatever `VERDICT_TYPES`
      // DECLARES keyed must actually arrive with a key, on his real files.
      {
        const KEYED = Object.entries(VERDICT_TYPES).filter(([, t]) => t.key).map(([k]) => k).sort();
        assert("THE EIGHT · four of the eight have an answer key of his own on disk — and the other four are keyless because nothing is written, not because nobody looked",
          Object.keys(VERDICT_TYPES).length === 8
          && KEYED.join(",") === "axis_weld,interview,tape_doubt,trap",
          `keyed: ${KEYED.join(",")}`);
        assert("THE EIGHT · every type declares a CLOSED verdict set and the organ that RECORDS it — nothing here writes another organ's file",
          Object.values(VERDICT_TYPES).every((t) => Array.isArray(t.verdicts) && t.verdicts.length >= 2 && typeof t.owner === "string" && t.asks));
        // LAW 1 of the truth layer: one judge, one standard, BOTH NAMED. A type with
        // no declared standard is a judgement made against whatever the model felt
        // like that day, which is what this whole layer exists to end.
        assert("THE EIGHT · every type NAMES the standard it is judged against — no verdict is made against an unnamed yardstick",
          Object.values(VERDICT_TYPES).every((t) => STANDARD_NAMES.includes(t.standard)),
          Object.entries(VERDICT_TYPES).map(([k, t]) => `${k}:${t.standard}`).join(" "));
        assert("THE EIGHT · the two standards do NOT merge — recall rides his capsule, interview-facing rides the DOSSIER, and that asymmetry is deliberate",
          VERDICT_TYPES.axis_weld.standard === "capsule" && VERDICT_TYPES.tape_doubt.standard === "capsule"
          && VERDICT_TYPES.interview.standard === "dossier" && VERDICT_TYPES.scrimmage.standard === "dossier"
          && VERDICT_TYPES.doubt_quality.standard === "cold_reader");
        assert("THE EIGHT · a verdict outside a type's set is refused, never coerced to the nearest legal word",
          isVerdict("axis_weld", "held") && !isVerdict("axis_weld", "passed") && !isVerdict("tape_doubt", "held") && isVerdict("adversarial", "conceded"));

        // MATERIAL — every branch reads a REAL file, and every one is exercised.
        const TR = { queue: [{ capsule: "tokenization", doubt_index: 0, q_verbatim: "strawberry common fruit hai, phir split kyun hota hai?" }] };
        const EX = { concept: "hallucinations", task: "build a detector", hidden_tests: ["run it on one clean case and one hallucinations case — it must separate them", "hand him a case his detector gets WRONG"] };
        const DR = { drills: [{ kind: "rejirah", modality: "voice", concepts: ["hallucinations"], prompt: "You chose your read. I think that's wrong. Defend it — or concede exactly where it breaks." }] };
        const K = { concept: "context", axis: "a", title: "Kya hai", strike: "context window kya hai?", weld: "Context window matlab model ek baar mein kitne tokens dekh sakta hai." };
        assert("MATERIAL · axis_weld is the one that carries a KEY, and it is HIS weld",
          gradeMaterial("axis_weld", "context:a", { answerKey: K }).key === K.weld);
        // THE DOUBT'S ANSWER WAS ONE ARRAY LOOKUP AWAY AND NEVER TAKEN. The queue row
        // carries the question and a doubt_index; the capsule carries `a`. Injected
        // here so the branch is exercised without live files; the live-data assertion
        // below walks all 112 of his real rows.
        const CAP_D = { doubts: [{ q: "strawberry common fruit hai, phir split kyun hota hai?", a: "common-FRUIT =/= common-STRING. Tokenizer ko meaning nahi, string-frequency dikhti." }] };
        assert("MATERIAL · tape_doubt carries his OWN past confusion verbatim, AND the answer he wrote for it — that key was on disk the whole time",
          gradeMaterial("tape_doubt", "tokenization:0", { tapeRoom: TR, capsule: CAP_D }).asked.includes("strawberry")
          && gradeMaterial("tape_doubt", "tokenization:0", { tapeRoom: TR, capsule: CAP_D }).key === CAP_D.doubts[0].a);
        assert("MATERIAL · hidden_test carries the open design probe AND the task it sits on — this is the path that used to fall over on 'no key'",
          gradeMaterial("hidden_test", "0", { examiner: EX }).asked.includes("must separate them")
          && /THE TASK IT SITS ON/.test(gradeMaterial("hidden_test", "0", { examiner: EX }).extra || ""));
        assert("MATERIAL · adversarial carries the drill that tells him he is wrong and asks him to defend or concede",
          /Defend it/.test(gradeMaterial("adversarial", "0", { drills: DR }).asked));
        assert("MATERIAL · a ref with nothing behind it returns null, so it is REFUSED at capture rather than judged against nothing",
          gradeMaterial("tape_doubt", "nope:99", { tapeRoom: TR, capsule: CAP_D }) === null && gradeMaterial("hidden_test", "7", { examiner: EX }) === null);

        // ── THE LEAK, AND THE SHAPE THAT CAUSED IT (BLOCK 0, 16 Aug 2026) ────
        // The 15 Aug trap branch did `JSON.stringify(item)` into `asked`, so the
        // trap's own `truth` was inside the question with `key: null`. The judge was
        // marking an answer it had just been handed, and every trap verdict produced
        // that way was meaningless. Asserted on the three things that were wrong:
        // the ask is the BAIT alone, the key is the TRUTH, and neither `truth` nor
        // `wrong` may appear in what he is shown.
        const CAP_T = { traps: [{ bait: "Subword ka primary faayda = ek tukde se bahut naye words bana sakte.", wrong: "Reuse ek bonus hai, headline nahi.", truth: "Primary = OOV solve + vocab kaabu." }] };
        const mt = gradeMaterial("trap", "tokenization:0", { capsule: CAP_T });
        assert("MATERIAL · trap — the BAIT is the question and the TRUTH is the key, which is the exact inversion of what shipped on 15 Aug",
          mt.asked === CAP_T.traps[0].bait && mt.key === CAP_T.traps[0].truth);
        assert("MATERIAL · trap — neither the truth nor the 'wrong' note appears in what he is shown; `wrong` rides the judge's side as WHY the bait tempts him",
          !mt.asked.includes("OOV") && !mt.asked.includes("bonus") && /WHY THE BAIT IS TEMPTING/.test(mt.extra || "") && mt.extra.includes("bonus"));
        // THE SEAL, driven through the REAL door rather than restated: a fixture
        // whose bait already contains its own truth must be refused outright.
        assert("MATERIAL · THE SEAL — material whose question contains the whole answer is REFUSED, not queued against his name",
          gradeMaterial("trap", "x:0", { capsule: { traps: [{ bait: "kya subword ka faayda yeh hai: Primary = OOV solve + vocab kaabu.", truth: "Primary = OOV solve + vocab kaabu." }] } }) === null);
        // …and the measured false positive it must NOT fire on: a two-option question
        // necessarily quotes one of its options, and FORGE_SPEC's own ✅ example for
        // the FRAGMENT pattern is exactly that shape. Measured on his live files: the
        // longest legitimate overlap is 52 chars, the shortest whole key is 21, so the
        // ranges overlap and only whole-key containment can tell them apart.
        assert("MATERIAL · THE SEAL does NOT bite a two-option question that quotes one of its own options — the standard ASKS for those",
          !!gradeMaterial("tape_doubt", "t:0", {
            tapeRoom: { queue: [{ capsule: "t", doubt_index: 0, q_verbatim: "BPE ek round mein saare pairs ek saath count karti, ya ek-ek letter pick karke?" }] },
            capsule: { doubts: [{ a: "Saare pairs ek saath count → sabse frequent EK merge → repeat → freeze." }] },
          }));

        // ── interview — the index selects the BAR, never the question ────────
        const CAP_I = { interviewLines: ["Tokenization is the bridge: text to vocabulary pieces, each with an ID.", "Subword beats word-level, which explodes the vocabulary."] };
        const mi = gradeMaterial("interview", "tokenization:0", { capsule: CAP_I });
        assert("MATERIAL · interview — his own line is the KEY and is never shown as the question; showing it was the trap leak in a second coat",
          mi.key === CAP_I.interviewLines[0] && !mi.asked.includes("bridge") && /staff engineer/.test(mi.asked));
        assert("MATERIAL · interview — his OTHER lines ride as context, so an answer that reaches a different line of his own is not marked a miss",
          (mi.extra || "").includes("Subword beats word-level"));

        // ── ACCEPTANCE 3 · A DECLARED KEY MUST ACTUALLY ARRIVE ───────────────
        // The check the work order asks for, driven through the real door on every
        // branch: if VERDICT_TYPES says a type is keyed, gradeMaterial must not hand
        // back key:null for it. This is the guard that would have caught the whole of
        // BLOCK 0 on the day it shipped.
        {
          const FIX = {
            axis_weld: ["context:a", { answerKey: K }],
            tape_doubt: ["tokenization:0", { tapeRoom: TR, capsule: CAP_D }],
            trap: ["tokenization:0", { capsule: CAP_T }],
            interview: ["tokenization:0", { capsule: CAP_I }],
            hidden_test: ["0", { examiner: EX }],
            adversarial: ["0", { drills: DR }],
            scrimmage: ["0", { drills: DR }],
            doubt_quality: ["tokenization:new", {}],
          };
          const wrong = Object.entries(VERDICT_TYPES).map(([t, decl]) => {
            const [ref, d] = FIX[t] || [];
            const mat = ref === undefined ? null : gradeMaterial(t, ref, d);
            if (!mat) return `${t}: NO MATERIAL`;
            const has = mat.key != null && String(mat.key).trim().length > 0;
            return has === !!decl.key ? null : `${t}: declared key=${!!decl.key} but got ${has}`;
          }).filter(Boolean);
          assert("ACCEPTANCE 3 · every type DECLARED keyed really arrives with a key, and every keyless one really has none — all eight branches driven, none described",
            wrong.length === 0, wrong.join(" | "));
          assert("ACCEPTANCE 3 · …and every branch stamps the standard it will be judged against onto the material itself",
            Object.entries(FIX).every(([t, [ref, d]]) => {
              const mat = gradeMaterial(t, ref, d);
              return mat && mat.standard === VERDICT_TYPES[t].standard;
            }));
        }

        // ── THE STANDARDS REACH THE JUDGE (they never did) ───────────────────
        // `grep -c dossier scripts/gaffer_brain.mjs` returned 0 on 15 Aug while 17
        // other organs read the projection. The DOSSIER shaped WHICH questions were
        // asked and never HOW an answer was judged.
        assert("STANDARD · the DOSSIER reaches the judge — round weights from the live projection AND the §7 red-flags from the doc it names as source",
          (() => { const b = standardBlock("dossier"); return /THE ROUNDS AND WHAT THEY ARE WORTH/.test(b) && /WHAT SINKS A CANDIDATE/.test(b) && /HIS RISK/.test(b); })());
        assert("STANDARD · the COLD-READER bar is quoted from FORGE_SPEC, which is final on it — not restated in this file where it would rot",
          (() => { const b = standardBlock("cold_reader"); return /COLD-READER STANDARD/.test(b) && /ANSWER-HIDDEN/.test(b) && /CRYPTIC/.test(b); })());
        assert("STANDARD · a source that will not parse SAYS SO and forbids substituting a private bar — an empty standard reads to a judge exactly like a permissive one",
          /could not be read/i.test(standardBlock("dossier", { dossier: null, scoutMd: "" }))
          && /Do NOT invent/i.test(standardBlock("dossier", { dossier: null, scoutMd: "" }))
          && /could not be read/i.test(standardBlock("cold_reader", { specMd: "" })));
        assert("STANDARD · a round's prompt carries the standard for every type in it, once, and names the yardstick beside each type",
          (() => {
            const p = buildJudgePrompt([
              { id: "a", type: "trap", ref: "t:0", gut: "knew", asked: "bait", key: "truth", spoken: "kuch bola" },
              { id: "b", type: "scrimmage", ref: "0", gut: "shaky", asked: "probe", key: null, spoken: "kuch aur bola" },
            ]);
            return /standard: capsule/.test(p) && /standard: dossier/.test(p)
              && /THE STANDARD FOR THIS TYPE: HIS OWN CAPSULE/.test(p) && /THE ROUNDS AND WHAT THEY ARE WORTH/.test(p);
          })());

        // CAPTURE — fast, model-free, and it refuses the same things every other door does
        const SAID = "matlab jo model ek time pe padh sakta hai uski limit hai, jagah khatam to purana nikalta hai";
        const cap = gradeCapture({ type: "axis_weld", ref: "context:a", gut: "shaky", spoken: SAID }, { dry: true, material: gradeMaterial("axis_weld", "context:a", { answerKey: K }), now: T0 });
        assert("CAPTURE · it banks his answer with the material beside it and returns a row — no model, no network, no subprocess in this path",
          cap.ok && cap.row.spoken === SAID && cap.row.key === K.weld && cap.row.kind === "capture" && cap.has_key === true);
        const capNoKey = gradeCapture({ type: "hidden_test", ref: "0", gut: "knew", spoken: "maine dono cases pe chalaya, clean wala 0.1 pe aaya aur hallucinated 0.8 pe, to separate ho gaye" }, { dry: true, material: gradeMaterial("hidden_test", "0", { examiner: EX }), now: T0 });
        assert("CAPTURE · a KEYLESS type captures perfectly well and says so — the old lane could not even represent this",
          capNoKey.ok && capNoKey.row.key === null && capNoKey.has_key === false);
        assert("CAPTURE · THE GUT-WORD LAW is held at this door too — third writer of the same law, same answer as capture.mjs and rejirah.mjs",
          gradeCapture({ type: "axis_weld", ref: "context:a", spoken: SAID }, { dry: true, material: { concept: "c", label: "l" } }).reason === "no-gut"
          && gradeCapture({ type: "axis_weld", ref: "context:a", gut: "confident", spoken: SAID }, { dry: true, material: { concept: "c", label: "l" } }).reason === "no-gut");
        assert("CAPTURE · an EMPTY answer is refused, never banked as a failure — 'he said nothing' and 'he said the wrong thing' are different facts",
          gradeCapture({ type: "axis_weld", ref: "context:a", gut: "guessed", spoken: "" }, { dry: true, material: { concept: "c" } }).reason === "empty");
        assert("CAPTURE · an unknown verdict type is refused at the door", gradeCapture({ type: "vibes", ref: "x", gut: "knew", spoken: SAID }, { dry: true }).reason === "unknown-type");
        {
          const t0 = process.hrtime.bigint();
          for (let i = 0; i < 200; i++) gradeCapture({ type: "axis_weld", ref: "context:a", gut: "knew", spoken: SAID }, { dry: true, material: { concept: "context", label: "a", key: K.weld } });
          assert("CAPTURE · 200 captures stay trivial — this runs in the ONLY latency budget the round has",
            Number(process.hrtime.bigint() - t0) / 1e6 < 250);
        }

        // THE 11 AUG LAW — a dropped connection must not cost him what he defended
        {
          const banked = [cap.row, capNoKey.row];
          assert("CAPTURE · THE 11 AUG LAW: the round is on disk item by item, so a connection that drops mid-round costs him NOTHING he already defended",
            outstandingGrades(banked).length === 2
            && outstandingGrades([...banked, { kind: "settled", of: cap.row.id }]).length === 1);
        }

        // PASS 1 — one call, mixed types, matched BY ID
        const items = [cap.row, capNoKey.row, { ...cap.row, id: "tape_doubt:tokenization:0:x", type: "tape_doubt", ref: "tokenization:0", concept: "tokenization", label: "tape-room doubt #0", key: null, gut: "knew" }];
        const genOK = async () => ({ ok: true, text: JSON.stringify({ grades: [
          { id: items[2].id, verdict: "broken", missing: [], why: "purana bhram saaf toda" },
          { id: items[1].id, verdict: "passed", missing: ["the failure case"], why: "separation dikhayi" },
          { id: items[0].id, verdict: "held", missing: [], why: "mechanism aa gaya" }] }) });
        const cmds = [];
        const jr = await gradeJudge({ dry: true, rows: items, generate: genOK, dispatch: (c) => { cmds.push(c); return { ok: true }; }, now: T0 });
        assert("PASS 1 · THREE DIFFERENT VERDICT TYPES graded in ONE Opus call — not three calls (this is the acceptance his spec asks for)",
          jr.ok && jr.graded === 3 && jr.calls === 1 && jr.types.length === 3);
        assert("PASS 1 · the keyless hidden_test really is GRADED — the old lane could not judge it at all, so this is the path that had to work",
          jr.dispatched.find((s) => s.type === "hidden_test").verdict === "passed");
        assert("PASS 1 · grades are matched BY ID, never by position — the reply above is deliberately in the WRONG order and every verdict still lands on its own item",
          jr.dispatched.find((s) => s.type === "axis_weld").verdict === "held"
          && jr.dispatched.find((s) => s.type === "tape_doubt").verdict === "broken");
        assert("PASS 1 · each verdict is dispatched through its OWN owner's CLI — rejirah for an axis, doubtminer for a broken doubt, capture for a rep",
          cmds.find((c) => c.organ === "rejirah.mjs") && cmds.find((c) => c.organ === "doubtminer.mjs") && cmds.find((c) => c.organ === "capture.mjs"));
        assert("PASS 1 · …and every dispatched argv is the owner's REAL contract, not an invented one",
          JSON.stringify(cmds.find((c) => c.organ === "rejirah.mjs").argv) === JSON.stringify(["grade", "context", "a", "held", "--gut", "shaky"])
          && JSON.stringify(cmds.find((c) => c.organ === "doubtminer.mjs").argv) === JSON.stringify(["retire", "tokenization", "0"])
          && cmds.find((c) => c.organ === "capture.mjs").argv.join(" ").includes("--correct true"));
        assert("PASS 1 · a doubt that STILL STANDS is never retired — deleting it would erase the evidence he still holds it, which is the one thing the tape room is for",
          ownerCommand({ type: "tape_doubt", ref: "tokenization:0", verdict: "standing", gut: "knew" }).organ === null);
        {
          const bad = await gradeJudge({ dry: true, rows: items, generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: items[0].id, verdict: "passed", why: "x" }] }) }), dispatch: () => ({ ok: true }), now: T0 });
          assert("PASS 1 · a verdict ILLEGAL for its type is refused and the item stays outstanding — 'passed' is not a legal answer for an axis weld",
            bad.graded === 0 && bad.missed.some((m) => m.startsWith("axis_weld")));
        }
        {
          const ref2 = await gradeJudge({ dry: true, rows: items, generate: genOK, dispatch: () => ({ ok: false, error: "capture: --gut required" }), now: T0 });
          assert("PASS 1 · a verdict the OWNER refuses is NOT marked settled and says why — his spoken answer is the one thing here that cannot be reproduced",
            ref2.graded === 0 && ref2.refused.length === 3 && ref2.outstanding === 3);
        }
        assert("PASS 1 · a dead lane keeps the whole round in the queue and invents nothing",
          (await gradeJudge({ dry: true, rows: items, generate: async () => ({ ok: false, error: "plan wall" }) })).reason === "lane-down");
        assert("PASS 1 · an unparseable answer keeps the round too — junk never becomes a verdict",
          (await gradeJudge({ dry: true, rows: items, generate: async () => ({ ok: true, text: "sure!" }) })).reason === "unparseable");
        assert("PASS 1 · with nothing captured it does nothing at all — no call, no spend",
          (await gradeJudge({ dry: true, rows: [], generate: async () => { throw new Error("must not be called"); } })).skipped !== undefined);

        // THE PROMPT — keyless items get HIS ground, never the model's taste
        {
          const p = buildJudgePrompt(items, { readJson: (f) => (String(f).includes("context") ? { mechanism: "har call pe poora folder dobara bheja jata hai", traps: ["size ko memory samajh lena"], interviewLines: ["name the statelessness first"] } : null) });
          assert("JUDGE PROMPT · the invariant rubric comes FIRST and his answers LAST (the cache law every prompt in this organ obeys)",
            p.indexOf("You are grading a live study round") === 0 && p.indexOf("=== THE ROUND ===") > p.length * 0.25);
          assert("JUDGE PROMPT · it says plainly which items carry a key and which do not, and points the judge at the DECLARED standard plus HIS ground — never at its own taste",
            /SOME ITEMS CARRY AN ANSWER KEY AND SOME DO NOT/.test(p) && /never against your own idea of a good answer/.test(p)
            && /HIS OWN GROUND FOR "context"/.test(p) && /har call pe poora folder/.test(p));
          assert("JUDGE PROMPT · every type in the round declares the question it asks and its legal verdicts",
            /axis_weld →/.test(p) && /tape_doubt →/.test(p) && /hidden_test →/.test(p) && /legal verdicts: held \| cracked/.test(p));
          assert("JUDGE PROMPT · it forbids marking him down for how speech arrives, and forbids a guessed grade outright",
            /GRADE THE MECHANISM, NEVER THE WORDING/.test(p) && /a missing grade is honest, a guessed one is not/.test(p));
          assert("JUDGE PROMPT · a keyless item SAYS it has no key rather than silently looking like one that failed",
            /NO ANSWER KEY EXISTS FOR THIS ONE/.test(p));
        }

        // ── PASS 2 · THE NIGHT READ — the pattern no single round can show ──
        {
          const dayRows = [
            { kind: "settled", day: istDay(T0), type: "axis_weld", ref: "tokenization:d", concept: "tokenization", label: "axis d", gut: "knew", verdict: "cracked", missing: ["the boundary rule"], why: "d fir se toota" },
            { kind: "settled", day: istDay(T0), type: "axis_weld", ref: "embeddings:d", concept: "embeddings", label: "axis d", gut: "knew", verdict: "cracked", missing: ["the boundary rule"], why: "wahi d" },
          ];
          const nightGen = async (p) => {
            assert("PASS 2 · the night prompt carries EVERY verdict of the day plus the day's conversation, in one call",
              /tokenization:d|axis d/.test(p) && /embeddings/.test(p) && /TODAY'S CONVERSATION/.test(p));
            return { ok: true, text: JSON.stringify({ patterns: [{ finding: "axis d dono concepts pe toota — ye ek axis ka pattern hai, do alag ghatnaayein nahi", evidence: ["tokenization:d", "embeddings:d"], kind: "axis", acts_on: "nemesis" }], corrections: [{ of: "axis_weld:embeddings:d", was: "cracked", should_be: "held", why: "poori baat-cheet padhne pe wo defend kar chuka tha" }] }) };
          };
          const nr = await gradeNight({ dry: true, rows: dayRows, transcript: "CAPTAIN: axis d phir se nahi aaya", generate: nightGen, now: T0 });
          assert("PASS 2 · it finds the CROSS-ROUND pattern by name — the same axis failing on two concepts is ONE finding, and no round-close pass can ever see it",
            nr.ok && nr.patterns === 1 && /axis d/.test(nr.row.patterns[0].finding) && nr.row.patterns[0].kind === "axis" && nr.row.patterns[0].acts_on === "nemesis");
          assert("PASS 2 · it may CORRECT Pass 1, and the correction is a NEW row that names the old verdict — never a rewrite, so a reader can always tell a changed mind from a right one",
            nr.corrections === 1 && nr.row.corrections[0].was === "cracked" && nr.row.corrections[0].should_be === "held" && nr.row.pass === 2);
          assert("PASS 2 · one verdict is not a pattern — under two it does nothing at all, and says why rather than calling a single event a trend",
            (await gradeNight({ dry: true, rows: [dayRows[0]], generate: async () => { throw new Error("must not be called"); }, now: T0 })).skipped !== undefined);
          assert("PASS 2 · a dead lane or a junk answer writes NOTHING — a manufactured pattern is worse than none, because he acts on it",
            (await gradeNight({ dry: true, rows: dayRows, generate: async () => ({ ok: false, error: "wall" }), now: T0 })).reason === "lane-down"
            && (await gradeNight({ dry: true, rows: dayRows, generate: async () => ({ ok: true, text: "hmm" }), now: T0 })).reason === "unparseable");
        }

        // BILLING + LAYERING, held by source
        {
          const src2 = readFileSync(new URL(import.meta.url), "utf8");
          assert("BOTH PASSES ride claudeGen, which REFUSES outright when ANTHROPIC_API_KEY is set — Max subscription, never an API key, and no new vendor anywhere",
            (src2.match(/claudeGen\(p, "opus", \d+, \["--effort", "max"\]\)/g) || []).length === 2
            && /if \(process\.env\.ANTHROPIC_API_KEY\) return refuse\(\);/.test(readFileSync(join(HERE, "claudegen.mjs"), "utf8")));
          // LAYERING (his instruction): the Cerebras reader is FROZEN, not deleted —
          // and frozen means NO LIVE CALLER, which is the half a comment cannot hold.
          const liveCallers = (src2.match(/loadCerebrasKeyLegacy\(/g) || []).length;
          assert("LAYERING · the Cerebras key reader is FROZEN as *Legacy, not deleted — and it still parses exactly as it did",
            typeof loadCerebrasKeyLegacy === "function"
            && loadCerebrasKeyLegacy("CEREBRAS_API_KEY=csk-abc123\n") === "csk-abc123"
            && loadCerebrasKeyLegacy("GEMINI_API_KEY=nope\n") === null);
          assert(`LAYERING · …and it is genuinely FROZEN: no production caller anywhere in the file (${liveCallers} reference(s), all in this selftest)`,
            liveCallers <= 3 && !/loadCerebrasKeyLegacy/.test(src2.slice(0, src2.indexOf("function selftest()"))
              .replace(/export function loadCerebrasKeyLegacy[\s\S]*$/, "")));
          const goneNames = ["api." + "cerebras.ai", "INSTALL_" + "CEREBRAS.ps1"];
          assert("LAYERING · no LIVE Cerebras lane survives anywhere — the endpoint is gone from the tree and the installer is retired",
            goneNames.every((n) => !src2.includes(n)) && !existsSync(join(ROOT, "setup", "INSTALL_" + "CEREBRAS.ps1")));
          assert("…and the csk-/gsk_ scrubber patterns STAY, because those are about the NEXT key anyone pastes and were never part of this lane",
            /csk-\[A-Za-z0-9\]\{20,\}/.test(readFileSync(join(ROOT, "hooks", "afferent-post.mjs"), "utf8")));
        }
      }

      // ── 9b · THE LIVE WIRE — every material branch against the REAL files ──
      // DORMANT-SAFE: these state files are gitignored, so a clean checkout reports
      // the check skipped rather than reddening the away-day lane.
      {
        const haveCapsule = (() => { try { return readdirSync(CAPSULE_DIR).filter((f) => f.endsWith(".json")); } catch { return []; } })();
        if (!haveCapsule.length) {
          console.log("  ..  JUDGE · LIVE check NOT RUN — clean checkout (dressing-room/state/ is gitignored)");
        } else {
          const name = haveCapsule[0].replace(/\.json$/, "");
          const c = readJson(join(CAPSULE_DIR, haveCapsule[0]), {});
          const ax = (c.faultLines || []).find((a) => a && a.weld);
          assert(`JUDGE · LIVE: the axis key really comes off capsule.faultLines[].weld (${name})`,
            !!ax && capsuleAnswerKey(name, ax.axis).weld === String(ax.weld).trim());
          assert("JUDGE · LIVE: an axis that does not exist still refuses, so a typo can never grade against the wrong page",
            capsuleAnswerKey(name, "zzz") === null);
          const ground = capsuleGround(name);
          assert("JUDGE · LIVE: capsuleGround gives the keyless verdicts HIS material — mechanism, pits, interview lines",
            ground.includes("HIS OWN GROUND") && (!c.mechanism || /MECHANISM/.test(ground)) && (!(c.traps || []).length || /KNOWN PITS/.test(ground)));
          // ⚠ THE HEADER IS NOT THE CONTENT, and that gap hid a live bug for the whole
          // life of this organ: the traps line read `t.trap`, a field no capsule has,
          // so it rendered as a bare "KNOWN TRAPS he wrote for himself: " — telling the
          // judge, in his own capsule's voice, that he wrote none. The old assertion
          // passed on the header. This one requires a real trap's real words.
          assert("JUDGE · LIVE: the pits line carries his ACTUAL trap text — a header with an empty list is worse than no line at all",
            !(c.traps || []).length
            || (() => { const t = (c.traps || []).find((x) => x && x.bait); return !!t && ground.includes(String(t.bait).slice(0, 30)); })());
          assert("JUDGE · LIVE: …and NO trap's `truth` rides in the shared ground — a round is one prompt, so that would leak the trap items' own key back in",
            (c.traps || []).every((t) => !t || !t.truth || !ground.includes(String(t.truth).slice(0, 30))));
          const live = gradeCapture({ type: "axis_weld", ref: `${name}:${ax.axis}`, gut: "knew", spoken: "kuch to bola hi hoga isne yahan par theek se" }, { dry: true });
          assert("JUDGE · LIVE: CAPTURE composes with the live capsule end to end — nothing injected in this one",
            live.ok && live.row.key === String(ax.weld).trim());
          // …and the lanes that used to be impossible. THE WHOLE QUEUE IS WALKED, not
          // its first row: the missing keys were uniform, so any single-row check
          // would have passed on the day the bug shipped and again on the day it was
          // fixed. Every one of his real doubts must resolve to the answer he wrote.
          const tr = readJson(TAPE_ROOM, null), ex = readJson(EXAMINER_DRILL, null);
          if (tr && (tr.queue || []).length) {
            const q = tr.queue[0];
            const m = gradeMaterial("tape_doubt", `${q.capsule}:${q.doubt_index}`);
            assert(`JUDGE · LIVE: a tape-room doubt loads his OWN past confusion verbatim (${(tr.queue || []).length} queued) — and now carries the answer HE wrote for it`,
              !!m && m.asked === q.q_verbatim && typeof m.key === "string" && m.key.length > 0);
            const walked = (tr.queue || []).map((row) => {
              const mm = gradeMaterial("tape_doubt", `${row.capsule}:${row.doubt_index}`);
              const cap = readJson(join(CAPSULE_DIR, String(row.capsule).toLowerCase().replace(/[^a-z0-9_-]/g, "") + ".json"), null);
              const d = cap && Array.isArray(cap.doubts) ? cap.doubts[Number(row.doubt_index)] : null;
              if (!d || typeof d.a !== "string" || !d.a.trim()) return null;   // no answer written = not this organ's failure
              return mm && mm.key ? null : `${row.capsule}:${row.doubt_index}`;
            }).filter(Boolean);
            assert(`JUDGE · LIVE: EVERY tape-room doubt with an answer on disk resolves to it — all ${(tr.queue || []).length} walked, not just the first`,
              walked.length === 0, `no key for: ${walked.slice(0, 6).join(", ")}`);
            // The other two keyed lanes, over every locked capsule on disk.
            const missing = [];
            for (const f of haveCapsule) {
              const cc = readJson(join(CAPSULE_DIR, f), {});
              const id = f.replace(/\.json$/, "");
              (cc.traps || []).forEach((t, i) => { if (t && t.truth && !(gradeMaterial("trap", `${id}:${i}`) || {}).key) missing.push(`trap ${id}:${i}`); });
              (cc.interviewLines || []).forEach((l, i) => { if (l && !(gradeMaterial("interview", `${id}:${i}`) || {}).key) missing.push(`interview ${id}:${i}`); });
            }
            assert(`JUDGE · LIVE: every trap truth and every interview line on every locked capsule arrives as a key (${haveCapsule.length} capsule(s) walked)`,
              missing.length === 0, missing.slice(0, 6).join(", "));
          }
          if (ex && (ex.hidden_tests || []).length) {
            const m = gradeMaterial("hidden_test", "0");
            assert(`JUDGE · LIVE: today's examiner hidden_test loads and is judgeable with no key at all (${ex.hidden_tests.length} staged)`,
              !!m && m.asked === ex.hidden_tests[0] && m.key === null && !!m.concept);
          }
        }
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
