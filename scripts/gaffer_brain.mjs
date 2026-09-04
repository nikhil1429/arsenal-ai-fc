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
//        node scripts/gaffer_brain.mjs judge-night        → the night lane: judge what the day left unjudged
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
// THE REGISTER CHECK (18 Aug 2026, OVERHAUL Block 4 §9.4) — a PURE module (reads
// nothing, writes nothing, spends nothing): the scrimmage's hedge meter, the five
// interview-facing types, and the validator that keeps the judge's `register` honest
// against the ground it was given. It lives in its own file, not here, because its
// hedge regex DOES test his words — a measurement he designed, never a gate — and
// this file's own law (selftest: "not one regex here tests HIS words") stays whole.
import { subjectsOf } from "./registry.mjs";   // A3 (4 Sep 2026) — the probe/register vocabularies are ROWS, never literals (his 11-Aug jugad law)
import { countHedges, REGISTER_TYPES, validateRegister, registerLine } from "./register.mjs";
import { generate as modelsGenerate, loadKeys as modelsLoadKeys, resolveSync as modelsResolve } from "./models.mjs";   // MODELS + ACTS Block 1 (18 Aug 2026): LAW M — the Watcher names the ROLE `text`; the resolver picks the live model + key and says why (models.mjs imports no organ — the import graph stays tiny)

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
const SITTING = join(STATE_DIR, "sitting.json");   // READ ONLY (sitting.mjs is its sole writer) — §11 Block 5.2: THE WATCHER runs only while a sitting is open
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
// THE FOURTH STANDARD'S SOURCE (18 Aug 2026, OVERHAUL Block 4 §9.1) — the SOURCED
// field bank nightshift's JOB 1c writes: real interview questions, every one carrying
// the http(s) URL of the page it was read from (nightshift.mjs `validateFieldItems`
// drops anything without one). The plan named `ns_probe_bank` here; the code says
// otherwise — the probe bank is the INVENTED one (his own 11 Aug ruling: "andaaze,
// asli sawaal nahi"), so it is deliberately NOT ground. A module constant, same
// reason as every path above (xray's per-organ sink ratchet).
const FIELD_PROBES = join(STATE_DIR, "brain_out", "nightshift", "field_probes.json");
const GEMINI_ENV = join(os.homedir(), ".gemini", ".env");
// the FROZEN Cerebras reader's path — a module constant so the analyser can fold it
// (built inside the function it cost two unresolved sinks, and the ratchet said so)
const CEREBRAS_ENV_LEGACY = join(os.homedir(), ".cerebras", ".env");

const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
// THE WATCHER'S MODEL IS A ROLE (LAW M, 18 Aug 2026). This line read
// `process.env.GAFFER_WATCHER_MODEL || "gemini-flash-latest"` — and on 18 Aug the alias moved
// onto a paid tier (429 on all 9 keys while gemini-3.5-flash answered on all 9), so the Watcher
// died at 13:42 IST reading "flash pool dry" and the Gaffer forgot Hinglish, greeting-first,
// Day 1. The role is `text`; GAFFER_WATCHER_MODEL still leads when set (LEGACY_ENV).
const WATCHER_ROLE = "text";
const WATCHER_ENV = "GAFFER_WATCHER_MODEL";
const watcherModel = () => modelsResolve(WATCHER_ROLE, { env: WATCHER_ENV }).model;   // for display: the model the next call will try FIRST
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
// §9.3 (18 Aug 2026, OVERHAUL Block 4) — WHO HE IS, read for the Watcher and the judge
// ---------------------------------------------------------------------------
// ⚠ A LIVE DEFECT, found while layering: both readers below asked the file for
// `text` / `who_he_is` — keys the consolidator has NEVER written. hippocampus.mjs
// writes `fingerprint` (+ open_threads · recent_wins · recent_cracks · voice_tuning ·
// do_not). So the judge's head has said "nothing consolidated about him is on disk
// yet" on every judgement since 15 Aug, and the Watcher fell through to
// JSON.stringify(whole file). Measured 18 Aug on the live file: fingerprint present,
// head rendered the absence line. This reader takes the consolidator's own keys, and
// — now that the file is LAYERED (hippocampus §9.3: top-level = the newest layer,
// `layers[]` newest first, contradictions kept) — names the earlier layers by date
// only, so a 8-layer file does not ride whole into a cached head.
export function whoHeIsText(w) {
  if (!w) return "";
  if (typeof w === "string") return w;
  if (typeof w.text === "string" && w.text.trim()) return w.text;                 // legacy shapes, kept readable
  if (typeof w.who_he_is === "string" && w.who_he_is.trim()) return w.who_he_is;
  if (typeof w.fingerprint !== "string" || !w.fingerprint.trim()) return "";
  const L = [`(as of ${w.date || "?"}) ${w.fingerprint.trim()}`];
  if (Array.isArray(w.open_threads) && w.open_threads.length) L.push(`Open threads: ${w.open_threads.slice(0, 5).join(" · ")}`);
  if (Array.isArray(w.recent_cracks) && w.recent_cracks.length) L.push(`Recent cracks (as data, never shame): ${w.recent_cracks.slice(0, 5).join(" · ")}`);
  const older = (Array.isArray(w.layers) ? w.layers.slice(1) : []).filter((l) => l && l.as_of);
  if (older.length) L.push(`Earlier layers on disk (dated, kept as written, not merged): ${older.slice(0, 4).map((l) => l.as_of).join(" · ")}${older.length > 4 ? ` +${older.length - 4} more` : ""}`);
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// THE KEY POOL — read, never stored, never logged
// ---------------------------------------------------------------------------
// Deliberately duplicated from dugout.mjs loadKeys() rather than imported:
// importing dugout.mjs pulls brain.mjs, hippocampus.mjs, talk.mjs, thalamus.mjs
// and six more into a process that must boot in milliseconds and must never have
// a reason to touch the bridge's own state. Nine lines are cheaper than that
// graph, and the shape is asserted against the original in the selftest.
export function loadGeminiKeys(envText = null) { return modelsLoadKeys(envText); }   // LAW M (18 Aug 2026): ONE key reader for the organism (models.mjs); this name stays for its callers

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
  // LAW M (18 Aug 2026): the walk (candidates × keys), the classes (model-gone · quota · key-bad ·
  // demand · net · schema) and the receipt live in models.mjs. This site keeps its body — JSON on
  // the wire, temperature 0, THINKING ON (measured 15 Aug: 4-12 s dynamic vs 1-2 s off; identical
  // verdict on the easy case; his standing ruling: highest thinking on) — and its parse.
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingBudget: -1 } },
  };
  const r = await modelsGenerate(WATCHER_ROLE, body, { keys, fetchFn, env: WATCHER_ENV, timeoutMs: deps.deadlineMs || WATCHER_DEADLINE_MS });
  if (!r.ok) return { ok: false, engine: "none", error: r.why, tried: r.tried, latency_ms: Date.now() - t0 };   // `why` names each candidate's class×count — "pool dry" is retired
  const text = String(r.text || "").trim();
  if (!text) return { ok: false, engine: "none", error: `${r.model} answered with no text (schema)`, model: r.model, latency_ms: Date.now() - t0 };
  let parsed = null;
  try { parsed = JSON.parse(text); } catch {
    // A fenced or prefixed reply still carries a valid object; take the outermost
    // braces rather than discarding a good judgment over punctuation.
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a >= 0 && b > a) { try { parsed = JSON.parse(text.slice(a, b + 1)); } catch { } }
  }
  const receipt = { model: r.model, key_index: r.key_index, fell_back_from: r.fell_back_from, fell_back_role: r.fell_back_role };
  // `deps.raw` (17 Aug 2026, BLOCK 5) — hand back the reply UNSHAPED. This lane
  // exists for the Watcher and coerces every answer into the Watcher's own
  // judgment schema, which is exactly right for that caller and destroys any
  // other. The second judge asks a completely different question and needs its
  // own shape; it reuses this door for the parts that are proven — key rotation,
  // the 20s deadline, thinking on, the free pool — rather than opening a second
  // one that would drift. Measured: without this the live probe came back
  // "unparseable" on a reply that was perfectly good JSON.
  if (deps.raw) return { ok: true, text, engine: "gemini-flash", ...receipt, latency_ms: Date.now() - t0 };
  const norm = normalizeJudgment(parsed);
  if (!norm) return { ok: false, engine: "none", error: `${r.model} answered but the judgment did not normalize`, ...receipt, latency_ms: Date.now() - t0 };
  return { ok: true, judgment: norm, engine: "flash", ...receipt, latency_ms: Date.now() - t0 };
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
// §11 (OVERHAUL Block 5.2, 18 Aug 2026): THE WATCHER RUNS ONLY WHILE A SITTING IS OPEN. A
// sitting has the brain in-conversation and the mouth under the SPEAK law — that is what the
// second pair of eyes watches. Outside a sitting the coach talks as before and nothing is
// spent here. Read off sitting.json (owner: sitting.mjs), never a flag; `--force` (his hand)
// or deps.force judges anyway. A skipped pass MOVES THE CURSOR past what it did not judge —
// the next sitting's first pass must read the sitting, not a day of coach chatter.
export function sittingIsOpen(deps = {}) {
  const s = deps.sitting !== undefined ? deps.sitting : readJson(SITTING, null);
  return !!(s && s.id && !s.closed_at);
}
export async function judgePass(deps = {}) {
  const now = deps.now || new Date();
  const bl = deps.blocks || loadBlocks(BLOCKS, now);
  const tx = readSince(bl.cursor, deps);
  const bus = deps.skipBus ? { lines: [], bytes: bl.cursor.afferent_bytes } : readBusSince(bl.cursor, deps);
  const delta = [...tx.delta, ...bus.lines];
  if (!delta.length) return { ok: true, skipped: "nothing new since the cursor", engine: "none" };
  if (!deps.force && !sittingIsOpen(deps)) {
    const next = { ...bl, cursor: { dugout_day: tx.day, dugout_bytes: tx.bytes, afferent_bytes: bus.bytes } };
    if (!deps.dry) { try { writeAtomic(BLOCKS, next); } catch { } }
    return { ok: true, skipped: `no open sitting — THE WATCHER watches sittings (§11 Block 5.2); ${delta.length} line(s) passed unjudged, cursor moved, nothing spent`, engine: "none", blocks: next, unjudged: delta.length };
  }

  const state = deps.state !== undefined ? deps.state : readJson(GSTATE, emptyState(now));
  const standing = deps.standing !== undefined ? deps.standing : (readJson(GSTANDING, null) || { instructions: [] });
  const who = deps.who !== undefined ? deps.who : whoHeIsText(readJson(WHO, null));   // §9.3 (18 Aug 2026): the layered reader — see whoHeIsText

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
// ── A3 (4 Sep 2026) · THE BANK ROW LEARNS THREE WORDS ────────────────────────
// The study loop's gates ask three questions of a banked answer that this row could
// not answer before, so each gets a field rather than a guess:
//   surface  — WHERE it was banked. A Claude Code lesson banks "code"; the older
//              doors keep their own defaults, so nothing that banked yesterday moves.
//   probe    — WHICH KIND of question it was, in the dossier's own vocabulary. The
//              one that matters most is `negative_space` ("what does this NOT do") —
//              OPPONENT_SCOUT calls it the #1 senior signal, and step 10 now refuses
//              a LOCK without one.
//   register — WHICH LANGUAGE the answer was given in. An axis is not closed until he
//              can say it twice: once in Hinglish (understanding) and once in cold
//              interview English (the room he is training for). Two different skills,
//              and only one of them was ever measured.
// EXPORTED because forge_session.mjs's axis gate reads these rows and must not
// hand-roll this organ's path or its row shape (owners-only, read side).
// ROWS, NOT LITERALS (his 11-Aug jugad law; the law pack ratchets every literal subject
// list in the repo). Read once at module load and LOUD on failure: `subjectsOf` throws when
// the row is missing, which is the house behaviour — a vocabulary that silently read as
// empty would make every `--probe` and `--register` value illegal and say nothing useful.
export const PROBE_KINDS = subjectsOf("probe_kinds");
export const REGISTERS = subjectsOf("registers");
/** bankRows — the capture rows this organ has banked, filtered the way a gate asks.
 *  READ-ONLY, and it is this organ's own file: one reader, so a gate can never drift
 *  from the door that wrote the row. `since` is an ISO string or null (no floor). */
export function outstandingBank(path = GRADE_QUEUE) {
  // ⚠ WHY THIS EXISTS AND WHY IT IS NOT `outstandingGrades(bankRows({}))`. That
  // composition is wrong and it fails OPEN: bankRows filters the queue to
  // `kind === "capture"`, which strips the very `settled` rows outstandingGrades
  // subtracts — so every judged answer reads as still outstanding, forever. Caught
  // by the A3 dry run the hour it was written, on a queue that was fully settled.
  // The owner answers the question with its own whole file; no caller composes it.
  return outstandingGrades(readJournal(path, 4000));
}
export function bankRows({ concept = null, axis = null, since = null, probe = null, register = null, surface = null } = {}, path = GRADE_QUEUE) {
  const t0 = since ? Date.parse(since) : NaN;
  const norm = (x) => String(x || "").trim().toLowerCase();
  return readJournal(path, 4000).filter((r) => {
    if (!r || r.kind !== "capture") return false;
    if (concept && norm(r.concept) !== norm(concept)) return false;
    if (axis && norm(r.axis) !== norm(axis)) return false;
    if (probe && norm(r.probe) !== norm(probe)) return false;
    if (register && norm(r.register) !== norm(register)) return false;
    if (surface && norm(r.surface) !== norm(surface)) return false;
    if (Number.isFinite(t0)) { const t = Date.parse(r.ts || ""); if (!Number.isFinite(t) || t < t0) return false; }
    return true;
  });
}
// THE SHARED APPEND LANE — brain.mjs owns the SCHEMA, six organs append (CLAUDE.md
// declares this by name). The judge becomes the seventh, because a lane whose spend
// the governor cannot see is a lane that can be starved without anyone knowing why —
// which is exactly how gaffer_claim_audit, the organ that checks whether the Gaffer
// lied to him, went 3 beats unpaid on 13 Aug.
const BRAIN_LEDGER = join(STATE_DIR, "brain_ledger.jsonl");
// The job label, declared once so the ledger row, `brain spend`'s board and
// brain_config.json cannot drift apart by a typo.
export const JUDGE_JOB = "gaffer_judge";
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
  // THE NINTH, added 17 Aug 2026 with BLOCK 2, and it exists because of what BLOCK 2
  // takes away. The Gaffer used to ask a question mid-conversation and DECIDE the
  // answer itself — `log_reps` took a `correct: BOOLEAN` straight from a fast
  // conversational model, and that boolean entered reps_log, which nemesis.mjs calls
  // its SOLE truth source. Those questions are not on disk (he is mid-concept, the
  // capsule is not locked yet), so without a type for them the honest choice would
  // have been to stop capturing them at all — which would have deleted the lane he
  // uses most. The question comes from the Gaffer, the GROUND comes from his capsule
  // when one exists, and the verdict comes from the judge like every other.
  voice_rep: { key: false, standard: "capsule", owner: "capture", verdicts: ["landed", "missed"], asks: "This was asked out loud, mid-conversation, and it is NOT one of his locked axes — the question is given with the item. Did the answer hold up against his own ground? If there is no ground for this concept, say so rather than grading him against your own idea of the topic." },
};
// THE FOURTH NAME (18 Aug 2026, OVERHAUL Block 4 §9.1): `external` is not a type's
// standard — no VERDICT_TYPES row points at it — it is the GROUND RULE for the five
// keyless types, and it rides the head so the rule about outside facts is stated once,
// beside the three yardsticks, and cached with them. What it names as source is read
// per concept into the BODY by externalGround(), and per item by verifyCitedFacts().
export const STANDARD_NAMES = ["capsule", "dossier", "cold_reader", "external"];

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
    // COVERS BOTH HALVES DELIBERATELY (17 Aug 2026). Some capsule-standard items
    // carry a key he wrote and some carry only his ground — and the third case,
    // a concept with NO capsule at all, is the one that matters most: he is mid-way
    // through hallucinations right now and nothing about it is locked. Saying "judge
    // it anyway" there is how a fast model's taste became a permanent fact about him.
    return `THE STANDARD FOR THIS TYPE: HIS OWN CAPSULE — never your own view of the topic.
· If an ANSWER KEY is given with the item, it is prose HE wrote and locked, and it is authoritative. Grade whether the load-bearing mechanism came back, in ANY words; never whether he matched the phrasing.
· If no key is given, judge against HIS OWN GROUND below — his mechanism, his pits, his interview lines for that concept.
· If there is NO ground for the concept either, that concept is not locked yet. Say so in "why" and return NO verdict for that item. An ungraded item is honest and is asked again; a verdict invented from your own sense of the subject becomes a permanent fact about him and cannot be undone from here.`;
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
    // §9.4 (18 Aug 2026) — THE DOSSIER'S GRAMMAR rides too: the probe types the room
    // uses, in its own templates. It is one of the register's legal sources of
    // "expected" vocabulary, and it was on disk (dossier_weights.json probe_types)
    // and never handed to the judge.
    const grammar = Object.entries((d && d.probe_types) || {})
      .map(([k, v]) => `  · ${k}${v && v.template ? ` — "${clip(String(v.template), 140)}"` : ""}`).join("\n");
    if (!rounds && !flags) {
      return `THE STANDARD FOR THIS TYPE: THE DOSSIER — AND IT COULD NOT BE READ, neither half (dressing-room/state/dossier_weights.json nor learning-layer/OPPONENT_SCOUT.md). Do NOT invent an interview bar: return no grade for these items and say the standard was unavailable.`;
    }
    return `THE STANDARD FOR THIS TYPE: THE DOSSIER — the real 4-hour onsite he is training for, distilled from candidate-reported loops (learning-layer/OPPONENT_SCOUT.md; live projection dressing-room/state/dossier_weights.json). Judge as that panel would, not as a teacher would.
${rounds ? `THE ROUNDS AND WHAT THEY ARE WORTH (§1 — weight is how much of the loop rides on it):\n${rounds}` : "  (the round weights could not be read — do not weight, and say so)"}
${flags ? `WHAT SINKS A CANDIDATE (§7 red-flags — each one already mapped onto his own risk):\n${flags}` : "  (the red-flags could not be read — do not invent them, and say so)"}
${grammar ? `THE PROBE GRAMMAR the room uses (the club's own projection — the words a panel asks in):\n${grammar}` : "  (the probe grammar could not be read)"}
THE BAR: mechanism named · trade-off named · limit named · and a claim about reliability backed by how it was MEASURED, never by "the prompt is good".`;
  }
  if (name === "external") {
    // §9.1 — EXTERNAL GROUND. Two sources, both named by file, and the rule that
    // matters more than either: it is GROUND for judging HIS answer, never a licence
    // for the judge's own reading of the field. A source that is unreadable says so.
    const fp = deps.fieldProbes !== undefined ? deps.fieldProbes : readJson(FIELD_PROBES, null);
    const n = fp && fp.concepts ? Object.values(fp.concepts).reduce((a, c) => a + ((c && c.questions) || []).length, 0) : 0;
    const bank = n
      ? `(a) THE SOURCED FIELD BANK — dressing-room/state/brain_out/nightshift/field_probes.json (${n} question(s) the room has ACTUALLY asked, each with the URL it was read from; written nightly by nightshift's field-probes lane, never invented). The questions for this round's concepts ride in the body under "EXTERNAL GROUND". They tell you what a real panel probes and in which words; they are questions, not answers.`
      : `(a) THE SOURCED FIELD BANK — dressing-room/state/brain_out/nightshift/field_probes.json — COULD NOT BE READ or holds nothing yet. Do NOT stand in for it from memory: judge on his ground and the other standards, and say the field bank was unavailable if it would have mattered.`;
    return `EXTERNAL GROUND (for the keyless types — hidden_test · adversarial · scrimmage · voice_rep · doubt_quality — beside their declared standard, never instead of it):
${bank}
(b) THE EXTERNAL CHECK — when a hidden_test or adversarial answer CITES a checkable fact (a number, a date, a named system's behaviour, a paper, a limit), ONE web-search verification is run BEFORE you read the round and its result is quoted under that item as "EXTERNAL CHECK", with its sources. Judge HIS answer against that quoted result — a claim the check refutes is a miss on the mechanism the source names, and you say which source. Where no check was run or the check came back "unverifiable", the fact is NEITHER confirmed nor refuted: say so, and do not fill the gap from your own knowledge.
THE RULE: external ground is something to judge AGAINST, never a reason to grade what you yourself believe about the topic. If neither his ground nor the external ground settles an item, return nothing for it (LAW 5).`;
  }
  return "";
}

// externalGround — §9.1, THE BODY HALF: the sourced field questions for ONE concept,
// each with the first URL it was read from. Read per concept into the round body
// (like capsuleGround), never into the head — the head is byte-identical by contract
// and this changes the night a concept is re-fetched. Empty when the bank holds
// nothing for the concept; the head's standard block already says what silence means.
export const EXTERNAL_MAX_QS = 8;
export function externalGround(concept, deps = {}) {
  if (!concept) return "";
  const fp = deps.fieldProbes !== undefined ? deps.fieldProbes : readJson(FIELD_PROBES, null);
  const entry = fp && fp.concepts ? fp.concepts[String(concept).toLowerCase()] : null;
  const qs = ((entry && entry.questions) || [])
    .filter((q) => q && typeof q.q === "string" && q.q.trim())
    .slice(0, EXTERNAL_MAX_QS)
    .map((q) => `  · ${clip(q.q.trim(), 240)}${Array.isArray(q.sources) && q.sources[0] ? `  [${clip(q.sources[0], 160)}]` : ""}`);
  if (!qs.length) return "";
  return `\nEXTERNAL GROUND FOR "${concept}" — questions a real panel has ASKED about it (sourced, fetched ${String(entry.fetched || "?").slice(0, 10)}; the words are the room's, the answers are not here):\n${qs.join("\n")}`;
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
  if (type === "voice_rep") {
    // THE QUESTION COMES FROM THE CALLER, because this is the one type whose
    // question is not on disk — the Gaffer asked it live. It is still REQUIRED:
    // a rep whose question nobody recorded cannot be judged by anyone, now or in
    // six months, so it is refused at the door rather than banked as a mystery.
    const asked = String(deps.asked || "").trim();
    const concept = String(ref || "").split(":")[0].trim();
    if (!asked || !concept) return null;
    return { concept, label: `voice rep${deps.axis ? ` · axis ${deps.axis}` : ""}`, asked, key: null, standard: std };
  }
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
  // ── A3 · THE SAME LAW AT EVERY DOOR ──────────────────────────────────────────
  // capture.mjs refuses a `code` rep with no axis (CODE_STRICT). If this door banked
  // one anyway, the answer would sit in the queue looking captured and then be thrown
  // away hours later at judge-dispatch, with his words as the thing that got lost.
  // A refusal a typist can act on NOW beats a silent drop at close. Same reasoning as
  // the gut-word law above: the loosest door would otherwise become the real rule.
  const surf = String(deps.surface || "").trim().toLowerCase();
  if (surf === "code" && !/^[a-i]$/.test(String(deps.axis || ""))) {
    return { ok: false, reason: "code-no-axis", say: "gaffer_brain: a `--surface code` rep MUST carry `--axis <a-i>` — the forge gate counts these per axis, and capture.mjs would refuse it at dispatch anyway (his answer would be the thing that got lost)." };
  }
  // …and the QUESTION rule, mirrored from the same place (capture.mjs CODE_STRICT). Both
  // halves or neither: a bank door that holds one of the owner's two rules still lets a row
  // through that the owner will reject hours later, at dispatch, silently — and `capture.mjs
  // rep` exits 0 even when it appends nothing, so the judge would mark it SETTLED with
  // nothing on disk. Found by the rung's own verifier, reproduced end to end.
  if (surf === "code" && String(deps.asked || "").trim().length < 8) {
    return { ok: false, reason: "code-short-q", say: "gaffer_brain: a `--surface code` rep MUST carry the question he was actually asked (≥8 chars, not a label) — capture.mjs refuses it at dispatch and exits 0 doing so, so a short question here becomes a rep that was judged and never written." };
  }
  const probeRaw = String(deps.probe === undefined || deps.probe === null ? "" : deps.probe).trim();
  if (probeRaw && !PROBE_KINDS.includes(probeRaw.toLowerCase())) {
    return { ok: false, reason: "bad-probe", say: `gaffer_brain: --probe must be one of ${PROBE_KINDS.join("|")} (got "${clip(probeRaw, 40)}"). A probe kind nobody recognises would count as "some probe" at the LOCK gate and prove nothing.` };
  }
  const regRaw = String(deps.register === undefined || deps.register === null ? "" : deps.register).trim();
  if (regRaw && !REGISTERS.includes(regRaw.toLowerCase())) {
    return { ok: false, reason: "bad-register", say: `gaffer_brain: --register must be ${REGISTERS.join("|")} (got "${clip(regRaw, 40)}"). The axis gate asks for the INTERVIEW line by name; an unrecognised word could never satisfy it and would never say why.` };
  }
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
    // ── WHAT THE OLD DOOR MEASURED MUST SURVIVE THE NEW ONE (BLOCK 2, 17 Aug) ──
    // dugout's log_reps carried three things into reps_log that no other lane
    // produces: the AXIS, the free-text NOTE that shadow.mjs regexes for /scrimmage/i,
    // and latency_ms — the measured gap between the Gaffer's audio ending and his
    // voice starting. THREE gates read latency_ms (learning_state's isColdFast,
    // touchline's latRising and allFastKnew) and every one of them treats null as
    // "no objection", so routing reps through the judge without carrying it would
    // have silently un-measured the one number the organism actually measures — and
    // nothing would have gone red, because null is the shape it already tolerates.
    // Carried here, handed to capture.mjs by ownerCommand at dispatch.
    axis: /^[a-i]$/.test(String(deps.axis || "")) ? String(deps.axis) : null,
    latency_ms: Number.isInteger(deps.latencyMs) && deps.latencyMs >= 0 ? deps.latencyMs : null,
    note: deps.note ? clip(String(deps.note), 300) : null,
    // A3 — the three new words. Each is null when not declared and is NEVER guessed:
    // a gate that counts these rows must be able to tell "he did not do it" from
    // "nobody wrote it down", and a default would erase that difference forever.
    surface: deps.surface ? String(deps.surface).trim().toLowerCase() : null,
    probe: PROBE_KINDS.includes(String(deps.probe || "").trim().toLowerCase()) ? String(deps.probe).trim().toLowerCase() : null,
    register: REGISTERS.includes(String(deps.register || "").trim().toLowerCase()) ? String(deps.register).trim().toLowerCase() : null,
    spoken: clip(said, 4000),
    // §9.4 — HEDGES ARE COUNTED HERE, at the moment of capture, by code (register.mjs's
    // meter — the scrimmage's own). Every banked answer, every surface, no model. The
    // judge is later told this number exists and is not its to produce.
    hedges: countHedges(said),
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
// ── THE JUDGE CARTRIDGE — the stable head (BLOCK 1, 16 Aug 2026) ─────────────
// THE WHOLE MECHANISM IS THAT THIS DOES NOT CHANGE. It is byte-identical across
// every judgement in a round, so the second call inside the 5-minute TTL READS the
// head at 0.1x instead of WRITING it at 1.25x. Anything that varies per item or per
// round lives in the BODY — his ground, the items, his answers.
//
// WHY THIS LANE AND NOT THE OTHERS. Measured post-unleash (530 calls, 41.6h): haiku
// reuses its cache 8.8x, sonnet 1.0x, and OPUS 0.005x — effectively zero. Not
// because opus cannot cache: because every opus lane in this organism fires ONCE A
// DAY, outside the TTL, so its head is written and never read. The existing lanes'
// split never paid for a second reason too — their heads are ~406 tokens, under
// sonnet's 1024-token minimum, so the block is not cached at all.
// A JUDGING HEAD IS THE ONE SHAPE THAT FITS: it is naturally large (eight verdict
// types + three standards + his fingerprint), and a round fires several judgements
// WITHIN MINUTES. This is what the split was built for and never got.
//
// ⚠ MEASURED A/B, 17 Aug 2026 — SAME head, SAME two bodies, both ways, 4 opus calls.
// The work order's acceptance asked for "cache_creation far below the first" and
// THAT DID NOT HAPPEN; what happened is smaller and still worth having:
//     SPLIT   call 1  cw 29,438  cr     0   ·  call 2  cw 24,803  cr 4,633
//     INLINE  call 1  cw 29,534  cr     0   ·  call 2  cw 29,532  cr     0
//     pair totals — split 74,769 weighted · inline 81,397 · SPLIT 8.1% cheaper
// Two things follow, and both correct the plan rather than confirming it:
//   1. THE SPLIT IS THE ONLY THING PRODUCING ANY CACHE READ AT ALL. Inlining the
//      identical head scores a flat ZERO on the second call. So the door being open
//      is what buys the reuse, and it stays.
//   2. THE WIN IS 8%, NOT AN ORDER OF MAGNITUDE, because ~25,000 tokens of
//      cache_creation happen on EVERY call regardless — the CLI's own context, which
//      no caller here controls. The head is ~2,600 tokens of a ~29,000-token write.
// AND THE PLAN'S COST FIGURE WAS 2x OPTIMISTIC: it estimated "a cached opus
// judgement ~15,000-20,000 weighted". Measured: 35,000-40,000. The conclusion it
// drew still holds — one judgement grades a WHOLE ROUND, and ~13,00,000 freed from
// the DMN buys ~36 rounds a day, not the ~70-85 it claimed, which is still far more
// than he can sit through. Read the live figure, never this comment:
// `node scripts/brain.mjs status` prints the truth lane's reuse beside its spend.
//
// ALL EIGHT TYPES ALWAYS RIDE, even when the round contains one. That is not
// waste — it is the invariance. A head that carried "the types in THIS round" would
// change shape between rounds and never be read twice.
export function judgeCartridge(deps = {}) {
  const who = deps.who !== undefined ? deps.who : whoHeIsText(readJson(WHO, null));   // §9.3 (18 Aug 2026): the layered reader — see whoHeIsText
  const types = Object.entries(VERDICT_TYPES).map(([t, d]) =>
    `  ${t}\n      asks: ${d.asks}\n      legal verdicts: ${d.verdicts.join(" | ")}\n      standard: ${d.standard}${d.key ? " · an answer key HE wrote rides with each item and is authoritative" : " · no answer key exists — judge against the standard and his ground"}`).join("\n");
  const standards = STANDARD_NAMES.map((s) => standardBlock(s, deps)).filter(Boolean).join("\n\n");
  return `You are the judge of ONE learner's study record. He is training for AI-engineering interviews and he answers OUT LOUD, cold, from memory, in Hinglish. Every verdict you return becomes a permanent fact about him: it feeds what he is made to drill for weeks. A wrong verdict is not a bad grade, it is weeks of the wrong work.

THE LAWS OF THIS LANE, and they outrank anything in the round below.

1. GRADE THE MECHANISM, NEVER THE WORDING. His speech is transcribed, so it arrives broken, repetitive and unpunctuated. None of that is an error and none of it is evidence about what he knows. He is not reciting; he is reconstructing.
2. JUDGE AGAINST THE DECLARED STANDARD, NEVER AGAINST YOUR OWN TASTE. Every type below names the standard it is judged against, and the standards themselves are quoted in full further down. Where an answer key is given, it is prose HE wrote and locked; it is authoritative and your reading of the topic is not.
3. HINGLISH IS NOT AN ERROR. He thinks in a mix of Hindi and English and his own material is written that way. An answer that names the mechanism in Hindi words is a correct answer.
4. HE COMMITS A GUT-WORD BEFORE ANSWERING — knew, shaky, or guessed. It is given with each item. It is NOT part of the grade: it is his prediction, recorded so the gap between his confidence and his accuracy can be measured. Never let it move the verdict in either direction.
5. A MISSING GRADE IS HONEST; A GUESSED ONE IS NOT. If the standard and his ground do not settle an item, return NOTHING for it and say why. It stays in the queue and is judged again. Nothing is lost by declining; a fabricated verdict is not recoverable.
6. NAME WHAT IS MISSING IN HIS OWN TERMS. When something load-bearing did not come back, say which mechanism, using the vocabulary of his own material — not a generic textbook phrase.

THE EIGHT VERDICT TYPES. Each is a closed set: a word outside it is discarded, never rounded to the nearest legal one.
${types}

${standards}

WHO YOU ARE JUDGING${who ? `:\n${clip(who, 900)}` : " — nothing consolidated about him is on disk yet, so judge on the material alone and do not infer a person."}

THE OUTPUT CONTRACT. 7. IF HIS OWN ANSWER KEY LOOKS FACTUALLY WRONG, SAY SO — in "key_doubt", on that item, and nowhere else. This is NOT a verdict on his recall: if he reproduced what the key says, the recall HELD and you grade it that way. It is a doubt about the page itself. He wrote those pages and only he edits them, so your doubt becomes a question put to him, never a correction applied behind him. Use it rarely and only for something you believe is factually false — not for wording you would have chosen differently.
8. THE REGISTER — on the interview-facing types ONLY (${REGISTER_TYPES.join(" · ")}), return "register": {"used": [...], "expected": [...]}. "expected" = the industry terms a real panel would want to hear in THIS answer, taken ONLY from the ground you were given — his own interview lines, the DOSSIER's red-flags and probe grammar, the sourced field questions — never from your own vocabulary: code drops any term that is not in that ground. "used" = which of those, and which other key terms, he actually said. Do NOT return "missing" or "hedges": both are computed by code from his transcript. The register never moves the verdict; it is a second, separate reading of the same answer.

Return STRICT JSON, no fences, no prose outside it:
{"grades":[{"id":"<the item id, copied EXACTLY>","verdict":"<one legal verdict for THAT item's type>","missing":["<what he did not say that his own material has>"],"why":"<one sentence, plain, addressed to him>","key_doubt":"<omit unless his own key looks factually wrong>","register":{"used":["<term he said>"],"expected":["<term the panel wants, from the ground>"]}}]}
One entry per item at most. The id is how each grade is matched back to an item — grades are matched BY ID and never by position, so a copied-wrong id is a dropped grade.`;
}

// buildJudgePrompt — THE BODY. What varies: his ground for the concepts in this
// round, and the items themselves. The invariant half moved to judgeCartridge()
// above, and `deps.inlineHead` puts it back at the front for the lanes where a
// system prompt cannot ride argv (see systemPromptRides in claudegen.mjs) — losing
// the caching but never the standard.
export function buildJudgePrompt(items, deps = {}) {
  const head = deps.inlineHead ? judgeCartridge(deps) + "\n\n" : "";
  // §9.1 — HIS ground first, the room's ground after, per concept. Both are BODY:
  // his capsule changes when he locks, the field bank changes when it refreshes.
  const grounds = [...new Set(items.map((i) => i.concept).filter(Boolean))]
    .map((c) => [capsuleGround(c, deps), externalGround(c, deps)].filter(Boolean).join("\n")).filter(Boolean).join("\n");
  return `${head}THE ROUND HE JUST CLOSED. His answers follow; grade them against the laws and standards you were given.
${grounds}

=== THE ROUND ===
${items.map((it, i) => `
--- ITEM ${i + 1} · id ${it.id} · type ${it.type} · ${it.label || it.ref}${it.concept ? ` · concept "${it.concept}"` : ""} · his gut-word before answering: ${it.gut}
${it.asked ? `WHAT HE WAS ASKED / THE THING UNDER TEST:\n${it.asked}` : ""}
${it.extra ? `${it.extra}` : ""}
${it.key ? `ANSWER KEY (his own words, authoritative):\n${it.key}` : "(NO ANSWER KEY EXISTS FOR THIS ONE — judge against the declared standard and his ground above.)"}
${renderExternalCheck(it.external_check)}
WHAT HE SAID OUT LOUD, COLD:
${it.spoken}`).join("\n")}

Return the JSON now — one entry per item, ids copied exactly, and nothing for an item you cannot judge.`;
}

// ---------------------------------------------------------------------------
// §9.1 · THE EXTERNAL CHECK — one web-search verification per round, BEFORE the judge
// ---------------------------------------------------------------------------
// WHAT IT IS. A hidden_test or adversarial answer sometimes leans on a fact from the
// world — "GPT-4's window is 8k", "top-p was introduced in 2019", "the paper found
// 40%". His capsule cannot ground those and the DOSSIER does not try to; until today
// the judge either graded them from its own memory (LAW 2 forbids exactly that) or
// declined. So: ONE sonnet call with `--allowedTools WebSearch` — the lane proven on
// 11 Aug by nightshift's field probes — reads the eligible items, decides itself
// whether anything checkable was said (NO regex over his words: law 2 of this file),
// searches, and returns each claim with a verdict and the URLs it read. The result is
// quoted under the item as ground; the judge still judges HIM against it.
//
// THE THREE LIMITS, each deliberate:
//   · ONE call per round, whatever the round holds — the same invariance argument as
//     the head. Rounds are small (≤ a dozen items) and the checkable claims in one are
//     fewer still.
//   · ONLY hidden_test and adversarial (VERIFY_TYPES): the two open-ended, keyless
//     types where a cited fact can decide the verdict. A voice_rep is judged against
//     his own capsule; a scrimmage under time pressure is judged on the mechanism.
//   · FAIL-OPEN ON THE LANE, NEVER ON THE VERDICT: a dead search lane means the round
//     is judged as it was yesterday — without external ground — and the row SAYS so
//     (`external_check: null`, `external_check_note`). It never blocks the round and
//     it never invents a "true".
// THE VALIDATOR IS THE PRODUCT (nightshift's `validateFieldItems` law): a claim
// marked true/false with no http(s) source is DROPPED — a sourceless verdict is the
// model's prior wearing the word "checked". `unverifiable` needs no source, and is
// quoted as exactly that.
// MEASURED LIVE, 18 Aug 2026 (one fixture item, the planted "GPT-4 = 2M tokens"):
//   34.6 s · REFUTED with two real sources · ledger: cc 46,856 · cr 90,347 · out 671 ·
//   137,880 total ≈ 71k weighted — about TWO judge calls. The search loop is the cost,
//   which is why this runs once per round and only when the round holds a checked type.
export const VERIFY_TYPES = ["hidden_test", "adversarial"];
export const VERIFY_JOB = "gaffer_verify";
export const VERIFY_MAX_CLAIMS = 3;
const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\/\S+$/i.test(s.trim());

export function buildVerifyPrompt(items) {
  return `You are a fact-checker for ONE learner's spoken interview-practice answers. He answers out loud, in Hinglish, from memory. For EACH item below, decide whether his answer CITES a checkable fact about the world — a number, a date, a limit, a named model's or paper's behaviour, a benchmark result. Vocabulary, opinion, mechanism-in-his-own-words and hedged guesses are NOT facts to check.
If an item cites nothing checkable, return it with an empty "claims" array — do NOT search for it.
For each checkable claim (at most ${VERIFY_MAX_CLAIMS} per item), SEARCH THE WEB and return the claim in your words, a verdict, one sentence of evidence, and the URL(s) you actually read. A verdict of "true" or "false" MUST carry at least one URL; if you could not find a source, the verdict is "unverifiable" — never guess from memory.

Return STRICT JSON only, no fences, no prose outside it:
{"items":[{"id":"<the item id, copied EXACTLY>","claims":[{"claim":"<what he asserted, one line>","verdict":"true|false|unverifiable","evidence":"<one sentence>","sources":["<https url>"]}]}]}

=== THE ITEMS ===
${items.map((it, i) => `--- ITEM ${i + 1} · id ${it.id} · type ${it.type}${it.concept ? ` · concept "${it.concept}"` : ""}
${it.asked ? `WHAT HE WAS ASKED:\n${clip(it.asked, 800)}` : ""}
WHAT HE SAID:\n${clip(it.spoken, 2500)}`).join("\n\n")}

Return the JSON now.`;
}

// PURE AND TOTAL — any shape in, a map of id → validated claims out (ids not in the
// round are dropped; claims with an illegal verdict are dropped; a true/false with no
// http source is dropped and COUNTED, so the row can say how many the validator ate).
export function parseVerify(text, items) {
  let parsed = null;
  try { const t = String(text || ""); const a = t.indexOf("{"), b = t.lastIndexOf("}"); parsed = JSON.parse(a >= 0 ? t.slice(a, b + 1) : t); } catch { }
  const known = new Set((items || []).map((i) => i.id));
  const out = {}, droppedById = {}; let dropped = 0;
  for (const row of (parsed && Array.isArray(parsed.items) ? parsed.items : [])) {
    if (!row || !known.has(String(row.id))) continue;
    const id = String(row.id);
    const claims = [];
    for (const c of (Array.isArray(row.claims) ? row.claims : []).slice(0, VERIFY_MAX_CLAIMS)) {
      if (!c || typeof c.claim !== "string" || !c.claim.trim()) continue;
      const v = String(c.verdict || "").trim().toLowerCase();
      const sources = (Array.isArray(c.sources) ? c.sources : []).filter(isHttpUrl).map((s) => clip(s.trim(), 200)).slice(0, 3);
      if (!["true", "false", "unverifiable"].includes(v) || (v !== "unverifiable" && !sources.length)) {
        dropped++; droppedById[id] = (droppedById[id] || 0) + 1; continue;
      }
      claims.push({ claim: clip(c.claim.trim(), 240), verdict: v, evidence: clip(String(c.evidence || "").trim(), 300), sources });
    }
    out[id] = claims;
  }
  return { ok: !!parsed, checks: out, dropped, droppedById };
}

export function renderExternalCheck(check) {
  if (!Array.isArray(check) || !check.length) return "";
  return `EXTERNAL CHECK of what he cited (web-searched before this round was judged — ground, not your opinion):\n${check.map((c) => `  · "${c.claim}" → ${c.verdict.toUpperCase()}${c.evidence ? ` — ${c.evidence}` : ""}${c.sources.length ? ` [${c.sources.join(" · ")}]` : " [no source — neither confirmed nor refuted]"}`).join("\n")}\n`;
}

export async function verifyCitedFacts(items, deps = {}) {
  const eligible = (items || []).filter((i) => i && VERIFY_TYPES.includes(i.type));
  if (!eligible.length) return { ran: false, why: "no hidden_test/adversarial item in the round", checks: {}, calls: 0 };
  const gen = deps.verifyGenerate || (async (p) => {
    const { claudeGen, ledgerForensics } = await import("./claudegen.mjs");
    // 180 s: a search call is slower than a judge call and nothing waits on it but the
    // round close, which is already the slow moment by design.
    const r = await claudeGen(p, "sonnet", 180000, ["--allowedTools", "WebSearch"]);
    try {
      appendFileSync(BRAIN_LEDGER, JSON.stringify({
        ts: new Date().toISOString(), job: VERIFY_JOB, engine: "claude", model: "sonnet",
        input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null,
        cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
        total_tokens: r.total_tokens || 0,
        tokens_estimated: r.tokens_estimated !== false && !(r.input_tokens || r.output_tokens),
        duration_ms: r.duration_ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit,
        items: eligible.length, ...ledgerForensics(r),
      }) + "\n");
    } catch { /* an unmetered call is still a made call — never fail the round on the meter */ }
    return r;
  });
  const r = await gen(buildVerifyPrompt(eligible));
  if (!r || !r.ok) return { ran: true, ok: false, why: `search lane did not answer (${(r && r.error) || "no reply"})`, checks: {}, calls: 1 };
  const p = parseVerify(r.text, eligible);
  if (!p.ok) return { ran: true, ok: false, why: "search lane answered in a shape this organ will not act on", checks: {}, calls: 1 };
  return { ran: true, ok: true, checks: p.checks, dropped: p.dropped, droppedById: p.droppedById, calls: 1,
    claims: Object.values(p.checks).reduce((a, c) => a + c.length, 0),
    refuted: Object.values(p.checks).reduce((a, c) => a + c.filter((x) => x.verdict === "false").length, 0) };
}

// FROZEN VERBATIM (layering law) — the single-prompt judge, 15 Aug to 16 Aug 2026.
// It is not dead history: it is the shape the CACHE ARGUMENT is measured against.
// Everything it says is inside the new cartridge; what changed is WHERE it is sent,
// so if the split is ever reverted this is what to revert to.
export function buildJudgePromptLegacy(items, deps = {}) {
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

// ===========================================================================
// BLOCK 5 — THE SECOND JUDGE, AND THE 💎
// ===========================================================================
// MASTERPLAN §9's Dual-Judge Jury, finally built for the STUDY layer: "Both AGREE
// weak → real weakness. Both DISAGREE → 💎 the highest-value signal… The models
// NEVER resolve disagreements between themselves. Nikhil resolves them. That IS
// the learning."
//
// ONLY WHERE TASTE DECIDES. `axis_weld`, `tape_doubt`, `trap` and `interview` carry
// an answer HE wrote; a second opinion there buys nothing and doubles the cost, and
// the work order forbids it in as many words. These three have no key on disk:
// whether the engineering satisfied the probe, whether the defence held, whether it
// would survive the room — that is judgement, and a single LLM judge is documented
// to carry position, verbosity and self-enhancement bias.
// A DIFFERENT MODEL FAMILY is the whole point: the second read is the Gemini Flash
// REST lane the Watcher already uses — free, already proven live at 4-12s — so this
// costs nothing but latency, and it is latency at ROUND CLOSE where nothing waits.
export const SECOND_JUDGE_TYPES = ["hidden_test", "adversarial", "scrimmage"];

export function buildSecondJudgePrompt(item, deps = {}) {
  const t = VERDICT_TYPES[item.type] || {};
  return `You are grading ONE answer a learner gave OUT LOUD, cold, from memory, in Hinglish. He is training for AI-engineering interviews.

You are the SECOND, INDEPENDENT reader. You are deliberately NOT told what anyone else concluded — an opinion anchored on another opinion is not a second opinion.

GRADE THE MECHANISM, NEVER THE WORDING. Speech is transcribed: it arrives broken, repetitive and unpunctuated, and none of that is evidence about what he knows. Hinglish is not an error.

THE QUESTION THIS TYPE ASKS: ${t.asks || "did this hold?"}
LEGAL VERDICTS (return exactly one of these words): ${(t.verdicts || []).join(" | ")}

${standardBlock(t.standard || "dossier", deps)}
${capsuleGround(item.concept, deps)}

=== THE ITEM ===
${item.asked ? `WHAT HE WAS ASKED:\n${item.asked}` : ""}
${item.extra ? `${item.extra}` : ""}

WHAT HE SAID OUT LOUD, COLD:
${item.spoken}

Return STRICT JSON, no fences, no prose outside it:
{"verdict":"<one legal verdict>","why":"<one sentence, plain>"}
If the standard and his ground do not settle it, return {"verdict":null,"why":"…"} — declining is honest, guessing is not.`;
}

export async function secondOpinion(item, deps = {}) {
  // DRY = NO WIRE (18 Aug 2026, LAW M rewire): with `dry:true` and no injected callWatcher this used
  // to reach the REAL free pool — the selftest's PASS 1 ran a live second judge every time; the dead
  // alias masked it (9×429 in ~2 s → lane-down → fail-open) and the moment the resolver found a
  // live model the selftest asked Gemini for verdicts and 💎-carded its own fixture. A dry run is
  // lane-down, honestly recorded as one judge.
  if (deps.dry && !deps.callWatcher) return { ok: false, reason: "lane-down", error: "dry run — no wire" };
  const call = deps.callWatcher || callWatcher;
  const r = await call(buildSecondJudgePrompt(item, deps), { ...deps, raw: true });
  if (!r || !r.ok) return { ok: false, reason: "lane-down", error: (r && r.error) || "no reply" };
  let parsed = null;
  try { const t = String(r.text); const a = t.indexOf("{"), b = t.lastIndexOf("}"); parsed = JSON.parse(a >= 0 ? t.slice(a, b + 1) : t); } catch { }
  if (!parsed) return { ok: false, reason: "unparseable" };
  const v = isVerdict(item.type, parsed.verdict) ? String(parsed.verdict).trim().toLowerCase() : null;
  return { ok: true, verdict: v, why: clip(parsed.why, 300), engine: r.engine || "gemini-flash" };
}

// ── THE 💎 CARD — identities masked, order randomized ────────────────────────
// The design names the bias it fights, so the masking is not decoration. HE is the
// one resolving this, and "Opus said held, Flash said cracked" resolves itself for
// him before he has read a word of the reasoning. So the two readings arrive as
// JUDGE A and JUDGE B, and which is which flips per item.
// THE ORDER IS DERIVED FROM THE ITEM ID, NOT FROM Math.random: same disagreement,
// same card, every time it is rendered — a card that reshuffles on every read is
// unciteable, and a test cannot pin it.
export function disagreementCard(item, first, second) {
  const id = String(item.id || item.ref || "");
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const flip = (h & 1) === 1;
  const A = flip ? second : first, B = flip ? first : second;
  return `💎 DO judge alag-alag bole — ${item.concept || item.ref} (${item.type}). JUDGE A: ${A.verdict} — ${A.why || "no reason given"} · JUDGE B: ${B.verdict} — ${B.why || "no reason given"}. Tera answer tha: "${clip(item.spoken, 220)}". Kaun sahi hai? Ye faisla tera hai, machine ka nahi — aur yahi sabse keemti signal hai.`;
}

// ── key_doubt — when the judge thinks HIS OWN answer key looks wrong ──────────
// This is NOT a verdict on his recall, which still stands: he reproduced what he
// wrote. It is a doubt about the page itself, and only he edits a capsule — the
// mirror is read-only and the gist is the master. So it is a card, never an edit.
export function keyDoubtCard(item, doubt) {
  return `📄 Capsule check — "${item.concept}" ${item.label || item.ref}: judge ko tera apna answer-key hi galat lag raha. Uski wajah: ${clip(doubt, 220)}. Tera recall theek tha, ye page ke baare mein sawaal hai — gist tere haath se hi badalta hai.`;
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
    const won = { passed: true, failed: false, defended: true, conceded: true, collapsed: false, interview_grade: true, not_yet: false, avoided: true, fell_in: false, landed: true, missed: false }[s.verdict];
    if (won === undefined) return null;
    // THE QUESTION HE WAS ACTUALLY ASKED, not a label. For a voice_rep the label is
    // the generic "voice rep"; reps_log is a lifelong bank and a row reading
    // "voice rep · knew · true" is unreadable six months from now. `asked` is the
    // question the Gaffer really put to him, so it is what the rep records.
    const argv = ["rep", "--concept", s.concept || String(s.ref).split(":")[0],
      "--q", clip(s.asked || s.label || s.ref, 160), "--gut", s.gut, "--correct", String(won)];
    // Everything the old direct door carried, carried here too — see gradeCapture's
    // row: the axis feeds the fluency ladder, latency_ms feeds three gates that read
    // null as "no objection", and the note is what shadow.mjs scans for /scrimmage/i.
    if (s.axis) argv.push("--axis", s.axis);
    // A3 — the SURFACE rides to reps_log. Passed ONLY when the bank row declared one,
    // so every older lane keeps capture.mjs's own default ("gem" for a concept rep)
    // and no row already on disk changes meaning. A rep whose surface is erased at
    // dispatch is a rep the study loop cannot count, which is how the Code lane came
    // to bank nothing at all.
    if (s.surface) argv.push("--surface", String(s.surface));
    if (Number.isInteger(s.latency_ms) && s.latency_ms >= 0) argv.push("--latency", String(s.latency_ms));
    if (s.note) argv.push("--note", s.note);
    // §9.4 — the register rides the rep through the OWNER's own door (capture.mjs
    // `rep --register`), because reps_log is where nemesis reads. An axis-free miss
    // kind: it never touches `correct`; it is a second reading beside it.
    if (s.register && typeof s.register === "object") {
      argv.push("--register", JSON.stringify({ used: s.register.used || [], expected: s.register.expected || [], missing: s.register.missing || [], hedges: Number.isInteger(s.register.hedges) ? s.register.hedges : 0 }));
    }
    return { organ: "capture.mjs", argv };
  }
  // doubt_quality has no owner organ today — the verdict lives in this organ's own
  // journal and is read by the forge's Gate 1/Gate 2 review. Named, not pretended.
  return { organ: null, note: "no owner organ for this type — the verdict stays in gaffer_brain.jsonl for the Gate 1/2 review" };
}

export async function gradeJudge(deps = {}) {
  const now = deps.now || new Date();
  const rows = deps.rows !== undefined ? deps.rows : readJournal(GRADE_QUEUE, 800);
  const queued = outstandingGrades(rows);
  if (!queued.length) return { ok: true, skipped: "nothing captured since the last judge — the round is already settled", graded: 0 };

  // §9.1 — THE EXTERNAL CHECK runs FIRST, so its result is ground the judge reads,
  // never a second opinion it hears afterwards. One search call per round at most;
  // none at all when the round holds no hidden_test/adversarial item. Its outcome
  // rides each item as `external_check` (null = not run / lane down / nothing cited).
  const ext = deps.verify !== undefined
    ? await deps.verify(queued, deps)
    : (deps.dry && !deps.verifyGenerate ? { ran: false, why: "DRY RUN — the search lane was not called", checks: {}, calls: 0 } : await verifyCitedFacts(queued, deps));
  const items = queued.map((it) => ({ ...it, external_check: (ext && ext.checks && ext.checks[it.id] && ext.checks[it.id].length) ? ext.checks[it.id] : null }));

  // THE SPLIT, decided before the prompt is built (BLOCK 1). If the head cannot
  // ride argv on this box — over the 26,000-char cap, or a full-CLI lane where the
  // SHIM GUARD refuses a spaced system prompt — it is INLINED at the front of the
  // body instead. That trade is deliberate and one-directional: the caching is an
  // optimisation and may be lost, the standard is the point and may never be.
  const head = deps.cartridge !== undefined ? deps.cartridge : judgeCartridge(deps);
  const rides = deps.headRides !== undefined ? deps.headRides
    : await (async () => { try { const { systemPromptRides } = await import("./claudegen.mjs"); return systemPromptRides(head); } catch { return false; } })();
  const prompt = buildJudgePrompt(items, { ...deps, inlineHead: !rides });
  // claudeGen is the house door: it REFUSES when ANTHROPIC_API_KEY is set (his
  // standing law), and it is the same lane every other Opus job rides. effort max is
  // his 14 Aug ruling, and unlike the Watcher's per-turn path nothing is waiting on
  // this call, so the ruling costs nothing here.
  //
  // AND IT RIDES THE LEDGER NOW. Until today this called claudeGen directly, so the
  // one lane deciding what is TRUE about him was the only lane whose spend the
  // governor could not see — invisible to `brain status`, to the window, and to
  // `brain spend`. The row shape is nightshift's nsLedgerRow, field for field, with
  // ledgerForensics spread the same way, because brain_ledger.jsonl is a DOCUMENTED
  // shared append lane whose SCHEMA belongs to brain.mjs and to no appender.
  const gen = deps.generate || (async (p) => {
    const { claudeGen, ledgerForensics } = await import("./claudegen.mjs");
    const r = await claudeGen(p, "opus", 300000, ["--effort", "max"], rides ? head : null);
    try {
      appendFileSync(BRAIN_LEDGER, JSON.stringify({
        ts: new Date().toISOString(), job: JUDGE_JOB, engine: "claude", model: "opus",
        input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null,
        cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
        total_tokens: r.total_tokens || 0,
        tokens_estimated: r.tokens_estimated !== false && !(r.input_tokens || r.output_tokens),
        duration_ms: r.duration_ms || 0,
        ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit,
        // WHETHER THE HEAD ACTUALLY RODE IS PART OF THE RECORD. Without it, a row
        // with no cache_read is unreadable after the fact: it could be a cold first
        // call, or it could be a box where the split silently never applied.
        head_cached: !!rides, head_chars: head.length, items: items.length,
        ...ledgerForensics(r),
      }) + "\n");
    } catch { /* an unmetered call is still a made call — never fail the round on the meter */ }
    return r;
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
  // §9.4 — THE CORPUS the judge was given is the only legal source of "expected":
  // head + body (the head rides again inside the body when inlined; a substring
  // test does not mind the repeat).
  const corpus = head + "\n" + prompt;
  for (const it of items) {
    const g = grades.find((x) => x && String(x.id) === it.id);
    const verdict = g && isVerdict(it.type, g.verdict) ? String(g.verdict).trim().toLowerCase() : null;
    if (!verdict) { missed.push(`${it.type}:${it.ref}`); continue; }
    settled.push({
      v: 2, kind: "settled", of: it.id, ts: now.toISOString(), day: istDay(now),
      type: it.type, ref: it.ref, concept: it.concept, label: it.label, gut: it.gut, verdict,
      // carried from the CAPTURE row, unchanged, so the owner receives everything the
      // old direct-to-capture door used to hand it (see the note on gradeCapture's row)
      axis: it.axis || null, latency_ms: Number.isInteger(it.latency_ms) ? it.latency_ms : null, note: it.note || null,
      // ⚠ A3 FIX (4 Sep 2026, found by the rung's own verifier). `surface` was stamped on the
      // CAPTURE row and ownerCommand pushed `--surface` — but ownerCommand is only ever
      // called with a SETTLED row, and this constructor rebuilds from a FIXED FIELD LIST, so
      // an undeclared field is silently dropped. The push was dead code: every study rep
      // dispatched to capture.mjs would have carried capture's own default ("gem"), his
      // stated verification (`tail -3 reps_log.jsonl` shows surface "code") would have shown
      // nothing, CODE_STRICT would have been unreachable in production, and every Code rep
      // would have entered the GEM-ONLY quality ledger as if it came from a Gem sitting.
      // Same class as `corrects` in capture.mjs's own validator, one organ over.
      surface: it.surface || null, probe: it.probe || null, register_of: it.register || null,
      asked: it.asked ? clip(it.asked, 300) : null,
      standard: it.standard || (VERDICT_TYPES[it.type] || {}).standard || null,
      missing: Array.isArray(g.missing) ? g.missing.slice(0, 8) : [],
      why: clip(g.why, 300), engine: "opus", pass: 1,
      // §9.1 — WHAT GROUND THE VERDICT STOOD ON is part of the record: the checked
      // claims with their verdicts and sources, or null with the reason (not run,
      // lane down, nothing cited). Six months from now this is how a reader tells
      // "the judge knew" from "the judge searched".
      external_check: it.external_check || null,
      external_check_note: it.external_check ? null
        : !VERIFY_TYPES.includes(it.type) ? "not a checked type"
          : (ext && ext.why) ? ext.why
            : (ext && ext.droppedById && ext.droppedById[it.id]) ? `${ext.droppedById[it.id]} sourceless verdict(s) dropped by the validator — neither confirmed nor refuted`
              : (ext && ext.ran ? "nothing checkable cited" : "not run"),
      // §9.4 — THE REGISTER, on the interview-facing types only. The judge proposes
      // used/expected; register.mjs holds them against his transcript and the corpus
      // (invented terms dropped and NAMED in `dropped`), recomputes `missing`, and the
      // hedge count is the capture row's own (code, at bank time) — never the model's.
      register: REGISTER_TYPES.includes(it.type)
        ? { ...validateRegister(g.register, { spoken: it.spoken, corpus }), hedges: Number.isInteger(it.hedges) ? it.hedges : countHedges(it.spoken) }
        : null,
    });
  }

  // ── BLOCK 5 · THE SECOND JUDGE, AND THE 💎 ──────────────────────────────
  // Runs BEFORE dispatch, because a disagreement must never reach an owner. A
  // verdict two families disagree about is not a fact about him; it is the single
  // highest-value signal the design names, and it is HIS to resolve.
  // FAIL-OPEN ON THE LANE, NEVER ON THE VERDICT: if the free pool is dry the first
  // judgement stands, recorded honestly as one judge. A dead second reader must not
  // silently discard a real verdict — that would be the truth layer eating truth.
  const second = deps.secondOpinion || ((it) => secondOpinion(it, deps));
  const cardFile = deps.fileCard || ((line, key) => {
    try { execFileSync(process.execPath, [join(HERE, "captains_call.mjs"), "file", "--line", line, "--key", key], { encoding: "utf8", timeout: 30000, windowsHide: true }); return { ok: true }; }
    catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
  });
  const diamonds = [], keyDoubts = [];
  const confirmed = [];
  for (const s of settled) {
    // key_doubt rides ANY type and never changes the verdict — see keyDoubtCard.
    const kd = (grades.find((x) => x && String(x.id) === s.of) || {}).key_doubt;
    if (kd && String(kd).trim() && !deps.dry) {
      const c = cardFile(keyDoubtCard(s, String(kd).trim()), `key_doubt:${s.type}:${s.ref}`);
      keyDoubts.push({ ref: `${s.type}:${s.ref}`, filed: !!c.ok });
    } else if (kd && String(kd).trim()) keyDoubts.push({ ref: `${s.type}:${s.ref}`, filed: false, dry: true });

    if (!SECOND_JUDGE_TYPES.includes(s.type)) { confirmed.push(s); continue; }
    const item = items.find((i) => i.id === s.of) || s;
    const two = await second(item);
    if (!two || !two.ok || !two.verdict) {
      // named on the row, never hidden: "one judge" is a fact about this verdict
      confirmed.push({ ...s, judges: 1, agreed: null, judge2: null, judge2_note: (two && two.reason) || "no second reading" });
      continue;
    }
    if (two.verdict === s.verdict) { confirmed.push({ ...s, judges: 2, agreed: true, judge2: two.engine, judge2_why: two.why }); continue; }
    // 💎 — NOT recorded as fact. It becomes his card.
    const line = disagreementCard(item, { verdict: s.verdict, why: s.why }, { verdict: two.verdict, why: two.why });
    const c = deps.dry ? { ok: true, dry: true } : cardFile(line, `diamond:${s.type}:${s.ref}`);
    diamonds.push({ ref: `${s.type}:${s.ref}`, first: s.verdict, second: two.verdict, filed: !!c.ok, dry: !!deps.dry, line });
  }
  settled.length = 0; settled.push(...confirmed);

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
  return { ok: true, graded: dispatched.length, types: [...new Set(dispatched.map((s) => s.type))], settled, dispatched, refused, missed,
    // A DISAGREEMENT IS OUTSTANDING, NOT GRADED. It stays in the queue, so if he
    // resolves it the round can be judged again — and until then nothing about it
    // has entered his record.
    diamonds, key_doubts: keyDoubts,
    // §9.1 — the external check's own receipt: whether it ran, how many claims it
    // returned, how many it refuted, how many the validator dropped as sourceless.
    external: { ran: !!(ext && ext.ran), ok: ext ? ext.ok !== false : false, why: (ext && ext.why) || null, claims: (ext && ext.claims) || 0, refuted: (ext && ext.refuted) || 0, dropped: (ext && ext.dropped) || 0, calls: (ext && ext.calls) || 0 },
    // §9.4 — THE ONE SPOKEN LINE for the round (null when nothing was missing): the
    // two terms the room most wanted and did not hear, and the hedge count. Read back
    // by whichever mouth closed the round; never a card, never a second line.
    register_line: registerLine(dispatched.map((s) => s.register).filter(Boolean)),
    outstanding: items.length - dispatched.length, calls: 1 + ((ext && ext.calls) || 0) };
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
      // --rewind[=N] (LAW M live proof, 18 Aug 2026): re-judge the LAST N bytes of today's transcript
      // (default 40000) — the cursor had walked past his Day-1 turns under the LEGACY engine while the
      // Watcher was dead on the retired alias, so nothing "new" was left for the live Watcher to prove
      // itself on. Owner-side, explicit, one flag; the pass re-bills nothing but this one call.
      const rw = process.argv.find((a) => /^--rewind(=\d+)?$/.test(a));
      let blocks;
      if (rw) { const n = Number((rw.split("=")[1]) || 40000); blocks = loadBlocks(BLOCKS, new Date()); blocks.cursor = { ...blocks.cursor, dugout_bytes: Math.max(0, (Number(blocks.cursor.dugout_bytes) || 0) - n) }; console.log(`gaffer_brain: cursor rewound ${n} B → ${blocks.cursor.dugout_bytes} B`); }
      const r = await judgePass({ dry: process.argv.includes("--dry"), force: process.argv.includes("--force"), ...(blocks ? { blocks } : {}) });
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
    console.log(`  watcher: role text → ${watcherModel()} first (LAW M — models.mjs status for the board) · keys: gemini pool ${loadGeminiKeys().length} · grade queue ${outstandingGrades(readJournal(GRADE_QUEUE, 500)).length} axis/axes waiting for judge-round`);
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
    // BLOCK 5 · THE SECOND JUDGE RIDES THE SAME PROBE. It is a different QUESTION on
    // the same free lane, and it takes a different shape back (`raw`), so proving the
    // Watcher answers proves nothing about it — that gap is how a lane ships dead.
    // Measured the day it landed: 5.3s, verdict "conceded", legal for its type.
    const s = await secondOpinion({
      id: "probe:1", type: "adversarial", ref: "0", concept: "tokenization",
      asked: "You said subword tokenization exists mainly so you can reuse pieces to build new words. I think that is wrong. Defend it, or concede exactly where it breaks.",
      spoken: "nahi bhai main maanta hoon ki main galat tha — primary faayda OOV solve karna hai aur vocab ko kaabu mein rakhna, reuse to bas ek bonus hai",
    });
    console.log("second judge (BLOCK 5): " + JSON.stringify({ ok: s.ok, engine: s.engine, verdict: s.verdict, legal: isVerdict("adversarial", s.verdict), why: s.why, reason: s.reason }, null, 1));
    if (!r.ok || !s.ok || !s.verdict) process.exit(1);
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
    // --asked is REQUIRED for voice_rep and ignored elsewhere (every other type's
    // question is on disk). --axis / --latency / --note carry what the old
    // dugout->capture.mjs door carried, so nothing measured is lost by the reroute.
    // A3 — `--said "<his words>"` beside the stdin door. The teacher banks mid-lesson
    // from a Claude Code session, where a heredoc on stdin is a second moving part in
    // the one command that must never be the reason a rep is lost. stdin still works
    // and is still what the voice lane uses; when both are offered --said is the one
    // read, by declaration, so the other can never look banked when it was not.
    // `--latency_ms` is accepted as a spelling of `--latency`: the study order writes
    // it that way, and a flag ignored for its spelling is a measurement thrown away.
    const lat = flag("latency") !== undefined ? flag("latency") : flag("latency_ms");
    const said = flag("said");
    const spoken = said !== undefined ? String(said) : readFileSync(0, "utf8");
    const r = gradeCapture({ type: process.argv[3], ref: process.argv[4], gut: flag("gut"), spoken }, {
      asked: flag("asked"), axis: flag("axis"), note: flag("note"),
      surface: flag("surface"), probe: flag("probe"), register: flag("register"),
      latencyMs: lat !== undefined && Number.isFinite(Number(lat)) ? Math.trunc(Number(lat)) : undefined,
    });
    if (!r.ok) { console.log(r.say); process.exit(1); }
    const ground = r.has_key ? "against his own weld" : "NO answer key exists for this type — it is judged against his own capsule ground";
    console.log(`gaffer_brain: captured ${r.row.type} · ${r.row.label} · gut ${r.row.gut}`
      + `${r.row.surface ? ` · surface ${r.row.surface}` : ""}${r.row.probe ? ` · probe ${r.row.probe}` : ""}${r.row.register ? ` · register ${r.row.register}` : ""}`
      + `${Number.isInteger(r.row.latency_ms) ? ` · ${r.row.latency_ms} ms` : " · latency UNMEASURED (null — never invented)"}`
      + ` · ${ground}. Nothing was judged and nothing was spent.`);
    return;
  }
  // PASS 1 — ROUND CLOSE. One Opus call, the whole round, whatever types are in it.
  if (mode === "judge-round") {
    const r = await gradeJudge({ dry: process.argv.includes("--dry") });
    if (r.skipped) { console.log("gaffer_brain: " + r.skipped); return; }
    if (!r.ok) { console.log(r.say); process.exit(1); }
    console.log(`gaffer_brain: ${r.graded} item(s) graded in ONE Opus call · types: ${r.types.join(", ") || "—"}${r.outstanding ? ` · ${r.outstanding} still outstanding` : ""}`);
    // §9.1 — the external check's receipt is said out loud with the round: ran or
    // not, and why; what it refuted is printed under the item it belongs to.
    if (r.external) console.log(`  external check: ${r.external.ran ? (r.external.ok ? `${r.external.claims} claim(s) checked · ${r.external.refuted} refuted${r.external.dropped ? ` · ${r.external.dropped} sourceless verdict(s) dropped by the validator` : ""}` : `LANE DOWN — ${r.external.why}; the round was judged without external ground and every row says so`) : `not run — ${r.external.why}`}`);
    for (const s of r.dispatched) {
      console.log(`  ${String(s.type).padEnd(13)} ${s.verdict.toUpperCase().padEnd(16)} (gut ${s.gut})  ${s.why}`);
      if (s.owner_note) console.log(`      ${s.owner_note}`);
      if (s.missing.length) console.log(`      missed: ${s.missing.join(" · ")}`);
      for (const c of (s.external_check || [])) console.log(`      ${c.verdict === "false" ? "✗ REFUTED" : c.verdict === "true" ? "✓ confirmed" : "? unverifiable"}: "${c.claim}"${c.sources.length ? ` — ${c.sources[0]}` : ""}`);
      if (s.register) console.log(`      register: said ${s.register.used.length ? s.register.used.map((t) => `"${t}"`).join(" ") : "—"} · room wanted ${s.register.expected.length ? s.register.expected.map((t) => `"${t}"`).join(" ") : "—"}${s.register.missing.length ? ` · MISSING ${s.register.missing.map((t) => `"${t}"`).join(" ")}` : ""} · hedges ${s.register.hedges}${s.register.dropped.length ? ` · ${s.register.dropped.length} term(s) the judge offered were dropped as ungrounded` : ""}`);
    }
    // §9.4 — THE ONE SPOKEN LINE, last, so the mouth that reads this back ends on it.
    if (r.register_line) console.log(`  🗣 ${r.register_line}`);
    for (const m of r.refused) console.log(`  ${m.ref}  NOT RECORDED — the owner refused it: ${m.error}`);
    if (r.missed.length) console.log(`  ${r.missed.join(", ")} — no legal verdict came back for these; they stay in the queue and are judged again (never coerced).`);
    // THE 💎 IS THE POINT, SO IT IS SAID OUT LOUD. A disagreement that only exists
    // as a card he might be dealt later is a signal this lane produced and buried.
    for (const d of (r.diamonds || [])) {
      console.log(`  💎 ${d.ref}  TWO FAMILIES DISAGREED (${d.first} vs ${d.second}) — NOTHING was recorded about him.`);
      console.log(`      ${d.filed ? "filed as a captain's-call card" : d.dry ? "DRY RUN — no card filed" : "⚠ the card could NOT be filed"}: he resolves it, and that IS the learning.`);
    }
    for (const k of (r.key_doubts || [])) {
      console.log(`  📄 ${k.ref}  the judge doubts HIS OWN answer key — ${k.filed ? "filed as a card" : k.dry ? "DRY RUN — no card filed" : "⚠ card NOT filed"}. His recall verdict above stands; only he edits a capsule.`);
    }
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
        dry: true, now: T0, sitting: { id: "fixture-sitting", closed_at: null }, transcript, bus: "", skipBus: true,
        blocks: emptyBlocks(T0), state: { ...emptyState(T0), turns: 12, declared_plan: { text: "all four covered topics, samjhao mode", at: "x" } },
        standing: { instructions: [] }, who: "he is the captain, 31, building a cyborg organism",
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
        dry: true, now: T0, sitting: { id: "fixture-sitting", closed_at: null }, transcript: "CAPTAIN: " + FIVE[0] + "\n", bus: "", skipBus: true,
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

      // ── 4b · §11 (OVERHAUL Block 5.2): THE WATCHER RUNS ONLY WHILE A SITTING IS OPEN
      {
        let called = 0;
        const stubCount = async (p, d) => { called++; return stub(p, d); };
        const tx2 = "CAPTAIN: " + FIVE[0] + "\nGAFFER: theek.\n";
        const closed = await judgePass({ dry: true, now: T0, sitting: { id: "s1", closed_at: "2026-08-15T10:00:00Z" }, transcript: tx2, bus: "", skipBus: true, blocks: emptyBlocks(T0), state: emptyState(T0), standing: { instructions: [] }, who: "", callWatcher: stubCount });
        const none = await judgePass({ dry: true, now: T0, sitting: null, transcript: tx2, bus: "", skipBus: true, blocks: emptyBlocks(T0), state: emptyState(T0), standing: { instructions: [] }, who: "", callWatcher: stubCount });
        assert("§11 SITTING GATE · no open sitting (closed, or none on disk) ⇒ the pass is SKIPPED before the model — nothing spent, the reason names the law, the unjudged count is reported",
          closed.skipped && /no open sitting/.test(closed.skipped) && none.skipped && called === 0 && closed.unjudged === 2 && closed.engine === "none");
        assert("§11 SITTING GATE · a skipped pass MOVES THE CURSOR past what it did not judge (the next sitting's first pass reads the sitting, not a day of coach chatter)",
          closed.blocks && closed.blocks.cursor.dugout_bytes === Buffer.byteLength(tx2, "utf8"));
        const forced = await judgePass({ dry: true, now: T0, force: true, sitting: null, transcript: tx2, bus: "", skipBus: true, blocks: emptyBlocks(T0), state: emptyState(T0), standing: { instructions: [] }, who: "", callWatcher: stubCount });
        assert("§11 SITTING GATE · `--force` (his hand) judges anyway; an open sitting judges as before (the fixture above ran with one open)",
          !forced.skipped && called === 1 && sittingIsOpen({ sitting: { id: "x", closed_at: null } }) === true && sittingIsOpen({ sitting: { id: "x", closed_at: "t" } }) === false && sittingIsOpen({ sitting: null }) === false);
      }

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
          // BLOCK 2, 17 Aug 2026 — the axis letter. a-i are the NINE FIXED SLOTS of the
          // capsule schema (FORGE_SPEC's fault-lines), not words of his; the identical
          // literal already lives in capture.mjs, rejirah.mjs and dugout.mjs for the same
          // reason. It validates a slot name the MACHINE assigns and cannot test his
          // phrasing, which is what the ruling is about.
          "^[a-i]$",
          // OVERHAUL Block 4 §9.1, 18 Aug 2026 — the http(s) URL shape. It validates
          // the SOURCES the search lane returns in its own JSON (nightshift.mjs carries
          // the identical literal for the identical reason: a verdict with no source is
          // dropped). A URL is the machine's citation, never his phrasing. NB: the fact
          // to CHECK is chosen by the search model reading the item, not by any regex
          // over his words — that is why there is no "digit/date" literal here at all.
          "^https?:\\/\\/\\S+$",
          // LAW M live proof, 18 Aug 2026 — the `--rewind[=N]` CLI flag on `judge`. An argv
          // switch the OPERATOR types, parsed by the machine; never his words.
          "^--rewind(=\\d+)?$",
        ]);
        const suspect = rx.filter((p) => !MACHINE_ONLY.has(p));
        assert(`HIS RULING · VOCAB-AGNOSTIC, held by source: all ${rx.length} regex literals in the production half parse the MACHINE's own markers — not one tests HIS words`,
          suspect.length === 0, `these test something else: ${suspect.map((p) => "/" + p + "/").join(" · ")}`);
        assert("HIS RULING · SESSION-AGNOSTIC: the 15 Aug sitting appears as EVIDENCE in the header and as a FIXTURE in the selftest, and nowhere in the production code",
          !prodCode.includes("15th of August") && !prodCode.includes("Adhikari") && !prodCode.includes("that is a bit weird") && !prodCode.includes("बिफोर"),
          "one of his 15 Aug lines has leaked into executable code");
        assert("THE BRAIN NEVER BLOCKS THE MOUTH · every path out of `judge` exits 0 — a failure lands in the journal, never on the hot path",
          /if \(mode === "judge"\)[\s\S]{0,2400}?journalRow\(\{ engine: "none", error/.test(src) && !/if \(mode === "judge"\)[\s\S]{0,2400}?process\.exit\(1\)/.test(src));
        // SOLE WRITER of three files, plus ONE documented shared lane. The judge's
        // meter row goes onto brain_ledger.jsonl, which CLAUDE.md declares by name
        // as a shared append lane whose SCHEMA belongs to brain.mjs — six appenders
        // before this one. Adding it here is deliberate and enumerated: the alternative
        // is a lane deciding what is TRUE about him whose spend the governor cannot see.
        assert("SOLE WRITER · this organ writes exactly three files of its own, and appends to exactly ONE documented shared lane",
          src.indexOf("gaffer_grade_queue.jsonl   (captured") > 0
          && [...src.matchAll(/(?:writeAtomic|appendFileSync)\(([A-Z_]+)/g)].every((m) => ["JOURNAL", "BLOCKS", "GRADE_QUEUE", "BRAIN_LEDGER"].includes(m[1])));
        assert("SOLE WRITER · …and the shared lane is written in brain.mjs's OWN row schema, field for field with nightshift's — no appender owns that shape",
          (() => {
            const ns = readFileSync(join(HERE, "nightshift.mjs"), "utf8");
            const nsRow = ns.slice(ns.indexOf("function nsLedgerRow"), ns.indexOf("const genLedgered"));
            // `f:` OR `f,` — nightshift writes `model` in shorthand, and a matcher
            // that only accepted the long form would have failed on a row that is
            // byte-for-byte correct. The check is about the FIELD SET, not the syntax.
            const has = (s, f) => new RegExp("\\b" + f + "\\s*[:,]").test(s);
            const fields = ["ts", "job", "engine", "model", "input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens", "total_tokens", "tokens_estimated", "duration_ms", "ok", "error", "limit_hit"];
            const mine = src.slice(src.indexOf("appendFileSync(BRAIN_LEDGER"), src.indexOf("appendFileSync(BRAIN_LEDGER") + 1600);
            return fields.every((f) => has(nsRow, f) && has(mine, f)) && /ledgerForensics\(r\)/.test(mine);
          })());
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
        // LAW M (18 Aug 2026): the duplicated reader is GONE — both organs delegate to models.mjs
        // loadKeys, the ONE key reader (models.mjs imports no organ, so the import graph stays tiny).
        // The assertion keeps its job: the two readers must be PROVABLY the same code, and now that
        // means both are the same one-line delegation.
        assert("THE POOL · the key reader is the ONE in models.mjs — this organ and dugout.mjs both delegate to it (byte-identical delegation bodies), never a private copy",
          !!mine && !!theirs && /modelsLoadKeys\(envText\)/.test(mine) && mine === theirs,
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
        assert("THE NINE · four have an answer key of his own on disk — and the other five are keyless because nothing is written, not because nobody looked",
          Object.keys(VERDICT_TYPES).length === 9
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
            // the ninth (BLOCK 2): its question is not on disk — the Gaffer asked it
            // live — so the caller supplies it, and a capture without one is refused.
            voice_rep: ["hallucinations", { asked: "Hallucination kya hai, ek line mein?" }],
          };
          const wrong = Object.entries(VERDICT_TYPES).map(([t, decl]) => {
            const [ref, d] = FIX[t] || [];
            const mat = ref === undefined ? null : gradeMaterial(t, ref, d);
            if (!mat) return `${t}: NO MATERIAL`;
            const has = mat.key != null && String(mat.key).trim().length > 0;
            return has === !!decl.key ? null : `${t}: declared key=${!!decl.key} but got ${has}`;
          }).filter(Boolean);
          assert("ACCEPTANCE 3 · every type DECLARED keyed really arrives with a key, and every keyless one really has none — all nine branches driven, none described",
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
        assert("STANDARD · all three reach the judge in ONE head, whatever the round contains — the invariance is what makes them cacheable",
          (() => {
            const h = judgeCartridge({ who: "" });
            return /standard: capsule/.test(h) && /standard: dossier/.test(h) && /standard: cold_reader/.test(h)
              && /THE STANDARD FOR THIS TYPE: HIS OWN CAPSULE/.test(h)
              && /THE ROUNDS AND WHAT THEY ARE WORTH/.test(h)
              && /COLD-READER STANDARD/.test(h);
          })());

        // ── §9.1 · EXTERNAL GROUND (18 Aug 2026, OVERHAUL Block 4) ───────────
        // The fourth standard rides the head; the sourced field bank rides the body
        // per concept; and a cited fact is web-checked BEFORE the judge reads the
        // round. Everything below is hermetic: the bank, the search lane and the
        // judge are all injected. The plan named the probe bank as the source — the
        // code says the sourced bank is field_probes.json (nightshift JOB 1c) and the
        // probe bank is invented by his own 11 Aug ruling; asserted as such.
        {
          const FP = { concepts: { context: { fetched: "2026-08-11T22:29:28.089Z", why: "locked", questions: [
            { q: "How does lost-in-the-middle change where you place retrieved chunks?", sources: ["https://example.org/ai-engineer-interview-guide"] },
            { q: "What actually happens when the context window overflows?", sources: ["https://example.org/qa-bank"] },
          ] } } };
          assert("§9.1 · `external` is the FOURTH standard name — and no verdict TYPE points at it: it is the ground rule for the keyless five, not a new yardstick",
            STANDARD_NAMES.length === 4 && STANDARD_NAMES.includes("external") && Object.values(VERDICT_TYPES).every((t) => t.standard !== "external"));
          assert("§9.1 · the external standard NAMES its source by file and by lane, and counts what the bank holds — never a bare 'use external knowledge'",
            (() => { const b = standardBlock("external", { fieldProbes: FP }); return /field_probes\.json/.test(b) && /2 question\(s\)/.test(b) && /THE EXTERNAL CHECK/.test(b) && /never a reason to grade what you yourself believe/.test(b); })());
          assert("§9.1 · an unreadable bank SAYS SO and forbids standing in for it from memory (an empty external standard reads like a licence)",
            /COULD NOT BE READ/.test(standardBlock("external", { fieldProbes: null })) && /Do NOT stand in/.test(standardBlock("external", { fieldProbes: null })));
          assert("§9.1 · the sourced questions for a concept ride the BODY with their URL, and a concept the bank has nothing on renders NOTHING (the head already says what silence means)",
            /lost-in-the-middle/.test(externalGround("context", { fieldProbes: FP })) && /https:\/\/example\.org\/ai-engineer-interview-guide/.test(externalGround("context", { fieldProbes: FP }))
            && externalGround("nope", { fieldProbes: FP }) === "" && externalGround("context", { fieldProbes: null }) === "");
          assert("§9.1 · the head carries the rule, the body carries the questions — never the other way round (the head is byte-identical by contract)",
            (() => { const h = judgeCartridge({ who: "", fieldProbes: FP }); const b = buildJudgePrompt([{ id: "x:1", type: "voice_rep", ref: "context", concept: "context", gut: "shaky", spoken: "kuch bola", asked: "q?" }], { fieldProbes: FP, readJson: () => null });
              return /EXTERNAL GROUND \(for the keyless types/.test(h) && !/lost-in-the-middle/.test(h) && /EXTERNAL GROUND FOR "context"/.test(b) && /lost-in-the-middle/.test(b); })());
          // (the source-level halves of §9.1 — "field_probes, never probe_bank_" and the
          // TOOL GRANT argv — sit in the BILLING + LAYERING block below, beside the one
          // existing read of this file's own source: a second read would be a second
          // unresolved sink and xray's per-organ ratchet is a real budget.)

          // THE PLANTED FALSE FACT — the acceptance the plan asks for. His answer leans
          // on a number that is wrong; the (fixture) search lane refutes it with a
          // source; the judge is shown the refutation as GROUND, under the item, before
          // it grades; and the record carries the check beside the verdict.
          const PLANT = { v: 2, kind: "capture", id: "ext:1", ts: T0.toISOString(), day: "2026-08-18", type: "hidden_test", ref: "0", concept: "context", label: "hidden test #0", gut: "knew",
            asked: "run your detector on a 40-message thread — why did it miss the fact from message 3?", key: null, standard: "dossier",
            spoken: "kyunki GPT-4 ka context window 2 million tokens hai to lost-in-the-middle ka issue hi nahi aata, detector ne bas retrieval galat kiya" };
          const OTHER = { ...PLANT, id: "ext:2", type: "voice_rep", ref: "context", label: "voice rep", spoken: "context window matlab ek baar mein kitne tokens" };
          let verifyPrompt = null, judgePrompt = null;
          const verifyFx = async (p) => { verifyPrompt = p; return { ok: true, text: JSON.stringify({ items: [
            { id: "ext:1", claims: [{ claim: "GPT-4's context window is 2 million tokens", verdict: "false", evidence: "GPT-4 shipped at 8k/32k and GPT-4 Turbo at 128k; no GPT-4 model has a 2M window", sources: ["https://platform.openai.com/docs/models"] }] },
            { id: "ext:2", claims: [] },
            { id: "not-in-round", claims: [{ claim: "x", verdict: "true", sources: ["https://a.b"] }] },
          ] }) }; };
          const judgeFx = async (p) => { judgePrompt = p; return { ok: true, text: JSON.stringify({ grades: [
            { id: "ext:1", verdict: "failed", missing: ["the real window size, and that lost-in-the-middle is about POSITION not size"], why: "the number you leaned on is refuted by the check — see the source" },
            { id: "ext:2", verdict: "landed", missing: [], why: "theek" }] }) }; };
          const pl = await gradeJudge({ dry: true, rows: [PLANT, OTHER], verifyGenerate: verifyFx, generate: judgeFx, dispatch: () => ({ ok: true }), now: T0, fieldProbes: FP, readJson: () => null });
          assert("§9.1 · THE PLANTED FALSE FACT — the search lane is asked ONLY about the checked types (the voice_rep is not in the verify prompt), and told to return nothing rather than guess",
            !!verifyPrompt && /ext:1/.test(verifyPrompt) && !/ext:2/.test(verifyPrompt) && /never guess from memory/.test(verifyPrompt) && /SEARCH THE WEB/.test(verifyPrompt));
          assert("§9.1 · …the refutation reaches the JUDGE as ground UNDER THAT ITEM, verdict and source quoted, before it grades",
            !!judgePrompt && /EXTERNAL CHECK of what he cited/.test(judgePrompt) && /→ FALSE/.test(judgePrompt) && /platform\.openai\.com/.test(judgePrompt)
            && judgePrompt.indexOf("EXTERNAL CHECK of what he cited") < judgePrompt.indexOf("kyunki GPT-4 ka context window") && judgePrompt.indexOf("EXTERNAL CHECK of what he cited") > judgePrompt.indexOf("id ext:1"));
          assert("§9.1 · …and the planted fact is REFUTED on the record: the verdict is failed, the check rides the settled row with its source, and the round's receipt counts one refutation",
            pl.ok && pl.graded === 2 && pl.settled.find((s) => s.of === "ext:1").verdict === "failed"
            && pl.settled.find((s) => s.of === "ext:1").external_check[0].verdict === "false"
            && /platform\.openai\.com/.test(pl.settled.find((s) => s.of === "ext:1").external_check[0].sources[0])
            && pl.external.ran && pl.external.claims === 1 && pl.external.refuted === 1 && pl.calls === 2);
          assert("§9.1 · an item the check had nothing on says so on its row ('nothing checkable cited' / 'not a checked type') — null is never silent",
            pl.settled.find((s) => s.of === "ext:2").external_check === null && pl.settled.find((s) => s.of === "ext:2").external_check_note === "not a checked type");
          assert("§9.1 · an id the round does not contain is IGNORED — the search lane cannot plant a claim on an item nobody captured",
            !("not-in-round" in (parseVerify(JSON.stringify({ items: [{ id: "not-in-round", claims: [{ claim: "x", verdict: "true", sources: ["https://a.b"] }] }] }), [PLANT]).checks)));
          // THE VALIDATOR IS THE PRODUCT: a true/false with no http source is the model's
          // prior wearing the word "checked" — dropped, counted, and named on the row.
          const sourceless = await gradeJudge({ dry: true, rows: [PLANT], now: T0, fieldProbes: FP, readJson: () => null, dispatch: () => ({ ok: true }),
            verifyGenerate: async () => ({ ok: true, text: JSON.stringify({ items: [{ id: "ext:1", claims: [{ claim: "2M window", verdict: "false", evidence: "trust me", sources: [] }, { claim: "some paper", verdict: "maybe", sources: ["https://x.y"] }, { claim: "unknown thing", verdict: "unverifiable", evidence: "no page found", sources: [] }] }] }) }),
            generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: "ext:1", verdict: "failed", missing: [], why: "x" }] }) }) });
          assert("§9.1 · a SOURCELESS true/false and an illegal verdict are DROPPED and counted; 'unverifiable' needs no source and is kept as exactly that",
            sourceless.external.dropped === 2 && sourceless.settled[0].external_check.length === 1 && sourceless.settled[0].external_check[0].verdict === "unverifiable"
            && /no source — neither confirmed nor refuted/.test(renderExternalCheck(sourceless.settled[0].external_check)));
          const allDropped = await gradeJudge({ dry: true, rows: [PLANT], now: T0, fieldProbes: FP, readJson: () => null, dispatch: () => ({ ok: true }),
            verifyGenerate: async () => ({ ok: true, text: JSON.stringify({ items: [{ id: "ext:1", claims: [{ claim: "2M window", verdict: "false", sources: [] }] }] }) }),
            generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: "ext:1", verdict: "failed", missing: [], why: "x" }] }) }) });
          assert("§9.1 · …and when the validator ate every claim the row says THAT, not 'nothing cited'",
            allDropped.settled[0].external_check === null && /sourceless verdict\(s\) dropped/.test(allDropped.settled[0].external_check_note));
          // FAIL-OPEN ON THE LANE, NEVER ON THE VERDICT.
          const down = await gradeJudge({ dry: true, rows: [PLANT], now: T0, fieldProbes: FP, readJson: () => null, dispatch: () => ({ ok: true }),
            verifyGenerate: async () => ({ ok: false, error: "plan wall" }),
            generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: "ext:1", verdict: "failed", missing: [], why: "x" }] }) }) });
          assert("§9.1 · a DEAD search lane never blocks the round — it is judged without external ground and every row SAYS so",
            down.ok && down.graded === 1 && down.external.ran && down.external.ok === false && /did not answer/.test(down.settled[0].external_check_note));
          let verifyCalls = 0;
          const noneEligible = await gradeJudge({ dry: true, rows: [OTHER], now: T0, fieldProbes: FP, readJson: () => null, dispatch: () => ({ ok: true }),
            verifyGenerate: async () => { verifyCalls++; return { ok: true, text: "{}" }; },
            generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: "ext:2", verdict: "landed", missing: [], why: "x" }] }) }) });
          assert("§9.1 · a round with no hidden_test/adversarial item makes NO search call at all — no spend, and the receipt says why",
            verifyCalls === 0 && noneEligible.external.ran === false && /no hidden_test\/adversarial/.test(noneEligible.external.why) && noneEligible.calls === 1);
          assert("§9.1 · the search lane is metered on the shared ledger under its own job name and covers exactly the two open-ended keyless types",
            VERIFY_JOB === "gaffer_verify" && VERIFY_TYPES.join(",") === "hidden_test,adversarial");
        }

        // ── §9.4 · THE REGISTER CHECK (18 Aug 2026, OVERHAUL Block 4 — his ask:
        // "my vocab checked against real-world used vocab") ────────────────────
        // hedges are CODE's, at capture; expected/used are the JUDGE's but held by
        // register.mjs against the ground it was given and his transcript; missing is
        // recomputed; the rep carries it through capture's own door; ONE line closes
        // the round. All hermetic; the DoD fixture (3 hedges + 1 missing term) is
        // driven end to end through gradeJudge here, not only in register.mjs.
        {
          const H = judgeCartridge({ who: "" });
          assert("§9.4 · the head carries the register contract for the five interview-facing types — expected ONLY from the ground, and missing/hedges explicitly NOT the model's to return",
            /8\. THE REGISTER/.test(H) && REGISTER_TYPES.every((t) => H.includes(t)) && /Do NOT return "missing" or "hedges"/.test(H) && /"register":\{"used"/.test(H));
          assert("§9.4 · the DOSSIER's probe GRAMMAR now reaches the judge (one of the register's legal sources — it was on disk and never handed over)",
            /THE PROBE GRAMMAR/.test(standardBlock("dossier", { dossier: { rounds: [{ label: "x", minutes: 1, weight: 1 }], probe_types: { defend: { template: "You said {claim}. I think that's wrong." } } }, scoutMd: "" }))
            && /defend — "You said \{claim\}/.test(standardBlock("dossier", { dossier: { rounds: [{ label: "x", minutes: 1, weight: 1 }], probe_types: { defend: { template: "You said {claim}. I think that's wrong." } } }, scoutMd: "" })));
          const SP = "shayad model ne bina source ke bola, matlab woh guess kar raha tha, i think hallucination rate naapna padega ek held-out set pe";
          const capR = gradeCapture({ type: "voice_rep", ref: "hallucinations", gut: "shaky", spoken: SP }, { dry: true, asked: "hallucination rate kaise naapte?", now: T0 });
          // an axis_weld beside it (a recall type — must get NO register); built here because
          // the shared `cap` fixture is declared further down this selftest
          const capW = gradeCapture({ type: "axis_weld", ref: "context:a", gut: "shaky", spoken: "matlab jo model ek time pe padh sakta hai uski limit hai" }, { dry: true, material: gradeMaterial("axis_weld", "context:a", { answerKey: K }), now: T0 });
          assert("§9.4 · HEDGES are counted at CAPTURE, by code, on the row itself — three hedges (shayad · matlab · i think) before any model has seen the answer",
            capR.ok && capR.row.hedges === 3);
          const CAPS = { mechanism: "grounding beats scale", interviewLines: ["measure hallucination rate on a held-out set", "a retrieval-augmented answer cites its source"] };
          let regPrompt = null;
          const regGen = async (p) => { regPrompt = p; return { ok: true, text: JSON.stringify({ grades: [
            { id: capR.row.id, verdict: "landed", missing: [], why: "theek", register: { used: ["hallucination rate", "held-out set", "chain-of-thought"], expected: ["hallucination rate", "held-out set", "grounding", "constitutional ai"] } },
            { id: capW.row.id, verdict: "held", missing: [], why: "aa gaya", register: { used: ["x"], expected: ["y"] } }] }) }; };
          const regCmds = [];
          const rj = await gradeJudge({ dry: true, rows: [capR.row, capW.row], generate: regGen, dispatch: (c) => { regCmds.push(c); return { ok: true }; }, now: T0, readJson: (f) => (String(f).includes("hallucinations") ? CAPS : null), fieldProbes: null });
          const reg = rj.settled.find((s) => s.of === capR.row.id).register;
          assert("§9.4 · THE DoD FIXTURE, end to end — three hedges + one missing term yields EXACTLY {hedges:3, missing:['grounding']}: the invented 'constitutional ai' was dropped (not in the ground), the unsaid 'chain-of-thought' was dropped (never said), and missing was recomputed from his transcript",
            !!reg && reg.hedges === 3 && JSON.stringify(reg.missing) === JSON.stringify(["grounding"])
            && JSON.stringify(reg.expected) === JSON.stringify(["hallucination rate", "held-out set", "grounding"])
            && JSON.stringify(reg.used) === JSON.stringify(["hallucination rate", "held-out set"])
            && reg.dropped.some((d) => d.term === "constitutional ai") && reg.dropped.some((d) => d.term === "chain-of-thought"),
            JSON.stringify(reg));
          assert("§9.4 · the register rides the rep through the OWNER's door — capture.mjs `rep … --register <json>` — and never touches --correct",
            (() => { const c = regCmds.find((c) => c.organ === "capture.mjs"); const i = c.argv.indexOf("--register"); const j = JSON.parse(c.argv[i + 1]);
              return i > 0 && j.hedges === 3 && JSON.stringify(j.missing) === JSON.stringify(["grounding"]) && c.argv.join(" ").includes("--correct true"); })());
          assert("§9.4 · a recall type (axis_weld) gets NO register — its row says null and its argv carries no --register (the room does not hear a Re-Jirah recital)",
            rj.settled.find((s) => s.of === capW.row.id).register === null && !regCmds.find((c) => c.organ === "rejirah.mjs").argv.includes("--register"));
          assert("§9.4 · THE ONE SPOKEN LINE closes the round — the term the room wanted and did not hear, and the hedge count",
            rj.register_line === `interviewer yeh shabd sunna chahega: "grounding" — aur 3 hedges (shayad/maybe/i think) kaate ja sakte hain`, rj.register_line);
          assert("§9.4 · …and a round where nothing was missing speaks NO line (silence over a fabricated ask)",
            (await gradeJudge({ dry: true, rows: [capR.row], generate: async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: capR.row.id, verdict: "landed", missing: [], why: "x", register: { used: ["hallucination rate"], expected: ["hallucination rate"] } }] }) }), dispatch: () => ({ ok: true }), now: T0, readJson: () => CAPS, fieldProbes: null })).register_line === null);
          assert("§9.4 · a judge that returns NO register block still yields a register on the row — hedges are code's and always present, the lists empty",
            (() => { const r = validateRegister(undefined, { spoken: SP, corpus: "" }); return r.hedges === 3 && r.expected.length === 0 && r.missing.length === 0; })());
        }

        // ── §9.3 · WHO HE IS reaches the judge (18 Aug 2026) — the LIVE DEFECT and the layers ──
        // Both readers asked the file for `text`/`who_he_is`; the consolidator writes
        // `fingerprint`. So the head said "nothing consolidated about him" on every
        // judgement since 15 Aug. Held on a fixture in the consolidator's REAL shape, on
        // the layered shape, and — dormant-safe — on his live file.
        {
          const W = { date: "2026-08-17", fingerprint: "Hallucinations axis d is the whole focus.", open_threads: ["grounding vs scale"], recent_wins: [], recent_cracks: ["calibration gap widened"], voice_tuning: "slow", do_not: [],
            layers: [{ as_of: "2026-08-17", fingerprint: "Hallucinations axis d is the whole focus." }, { as_of: "2026-08-10", fingerprint: "Deep in attention." }, { as_of: "2026-08-03", fingerprint: "x" }] };
          assert("§9.3 · whoHeIsText reads the consolidator's OWN keys (fingerprint · open threads · cracks), dated 'as of', and names the earlier layers by date only — never the whole layered file into a cached head",
            (() => { const t = whoHeIsText(W); return /^\(as of 2026-08-17\) Hallucinations axis d/.test(t) && /Open threads: grounding vs scale/.test(t) && /Recent cracks/.test(t) && /Earlier layers on disk .*: 2026-08-10 · 2026-08-03/.test(t) && !t.includes("Deep in attention"); })());
          assert("§9.3 · …the legacy shapes still read (a string · {text} · {who_he_is}) and nothing/garbage reads as EMPTY, never as a person",
            whoHeIsText("plain") === "plain" && whoHeIsText({ text: "t" }) === "t" && whoHeIsText({ who_he_is: "w" }) === "w" && whoHeIsText(null) === "" && whoHeIsText({ date: "x" }) === "");
          assert("§9.3 · the head carries him when a fingerprint exists — 'WHO YOU ARE JUDGING:' followed by the dated fingerprint, not the absence line",
            (() => { const h = judgeCartridge({ who: whoHeIsText(W) }); return /WHO YOU ARE JUDGING:\n\(as of 2026-08-17\) Hallucinations/.test(h) && !/nothing consolidated about him/.test(h); })());
          const liveWho = readJson(WHO, null);
          if (liveWho && liveWho.fingerprint) {
            assert("§9.3 · LIVE: his real who_he_is.json reaches the judge's head (this was FALSE on every judgement before today — the reader asked for keys the file never had)",
              /WHO YOU ARE JUDGING:\n\(as of \d{4}-\d{2}-\d{2}\) /.test(judgeCartridge()));
          } else console.log("  ..  §9.3 · LIVE who_he_is check NOT RUN — no consolidated file on this checkout (dressing-room/hippocampus is gitignored)");
        }
        // THE HEAD MUST CLEAR THE BAR OR THE WHOLE BLOCK IS WORTHLESS — this is the
        // measurement the work order asks to be PRINTED, not claimed. A system block
        // under the model's minimum is not cached at all, and that (heads of ~406
        // tokens against sonnet's 1024) is exactly why the existing lanes' split
        // never paid. The upper bound is ARGS's own: past 26,000 chars it drops the
        // head silently, which would leave the judge running with no standard.
        {
          const h = judgeCartridge();
          const est = Math.round(h.length / 4);
          console.log(`  ..  CARTRIDGE · ${h.length} chars ≈ ${est} tokens (opus caches at ≥512 · ARGS drops a head past 26,000 chars)`);
          assert(`CARTRIDGE · the head clears opus's 512-token minimum with room to spare (${est} tokens) and fits the argv cap (${h.length} chars)`,
            est > 512 && h.length <= 26000);
        }

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

        // ── BLOCK 5 · THE SECOND JUDGE, AND THE 💎 (17 Aug 2026) ─────────────
        // MASTERPLAN §9's Dual-Judge Jury, for the three verdicts where taste
        // decides. Everything below is driven through gradeJudge with BOTH judges
        // injected — no network, no spend, and the assertions are about what
        // reaches HIS RECORD, which is the only thing that matters here.
        {
          const cap = (over = {}) => ({ v: 2, kind: "capture", id: "b5:1", ts: T0.toISOString(), day: "2026-08-17",
            type: "adversarial", ref: "0", concept: "hallucinations", label: "drill", gut: "shaky",
            asked: "you chose that read; defend it", key: null, standard: "dossier",
            spoken: "main iske saath khada hoon kyunki detector precision pe tune kiya tha, recall pe nahi", ...over });
          const grade = (v, extra = {}) => async () => ({ ok: true, text: JSON.stringify({ grades: [{ id: "b5:1", verdict: v, missing: [], why: "held on the mechanism", ...extra }] }) });

          // AGREE → the verdict stands, and it SAYS both families read it.
          const agree = await gradeJudge({ dry: true, rows: [cap()], generate: grade("defended"),
            secondOpinion: async () => ({ ok: true, verdict: "defended", why: "same read", engine: "gemini-flash" }) });
          assert("BLOCK 5 · AGREE — one verdict, recorded, carrying BOTH judges' names (a claim about him that two model families reached separately)",
            agree.graded === 1 && agree.settled[0].judges === 2 && agree.settled[0].agreed === true
            && agree.settled[0].engine === "opus" && agree.settled[0].judge2 === "gemini-flash" && agree.diamonds.length === 0);

          // DISAGREE → 💎. NOT a fact about him. A card, and nothing settled.
          const dis = await gradeJudge({ dry: true, rows: [cap()], generate: grade("defended"),
            secondOpinion: async () => ({ ok: true, verdict: "collapsed", why: "he never named where it breaks", engine: "gemini-flash" }) });
          assert("BLOCK 5 · DISAGREE — the 💎: NOTHING is recorded, nothing reaches an owner, and the item stays outstanding to be judged again",
            dis.graded === 0 && dis.settled.length === 0 && dis.dispatched.length === 0 && dis.outstanding === 1);
          assert("BLOCK 5 · …and it becomes HIS card, carrying both readings and his own answer — 'the models NEVER resolve disagreements between themselves'",
            dis.diamonds.length === 1 && dis.diamonds[0].first === "defended" && dis.diamonds[0].second === "collapsed"
            && /💎/.test(dis.diamonds[0].line) && /JUDGE A/.test(dis.diamonds[0].line) && /JUDGE B/.test(dis.diamonds[0].line)
            && dis.diamonds[0].line.includes("precision pe tune"));
          // IDENTITIES MASKED — the design names the bias it fights, so this is not
          // decoration: "Opus said held, Flash said cracked" resolves itself for him
          // before he has read a word of the reasoning.
          assert("BLOCK 5 · IDENTITIES MASKED — neither model is named on the card, and the order is DERIVED from the item id, so the same disagreement renders the same way every time",
            !/opus|gemini|flash|claude/i.test(dis.diamonds[0].line)
            && disagreementCard({ id: "x1", spoken: "s" }, { verdict: "a" }, { verdict: "b" }) === disagreementCard({ id: "x1", spoken: "s" }, { verdict: "a" }, { verdict: "b" }));
          assert("BLOCK 5 · …and the masking really SWAPS — two different items put the same judge in different slots, or the mask is a label and not a mask",
            (() => {
              const seen = new Set();
              for (const id of ["a", "b", "c", "d", "e", "f"]) seen.add(disagreementCard({ id, spoken: "s" }, { verdict: "FIRST" }, { verdict: "SECOND" }).indexOf("FIRST") < disagreementCard({ id, spoken: "s" }, { verdict: "FIRST" }, { verdict: "SECOND" }).indexOf("SECOND"));
              return seen.size === 2;
            })());

          // A KEYED verdict is never double-judged: his own answer is on disk, a
          // second opinion buys nothing there and doubles the cost.
          let asked2 = 0;
          const keyed = await gradeJudge({ dry: true, rows: [cap({ type: "axis_weld", ref: "tokenization:a", key: "his weld", standard: "capsule" })],
            generate: grade("held"), secondOpinion: async () => { asked2++; return { ok: true, verdict: "cracked" }; } });
          assert("BLOCK 5 · a KEYED verdict is NOT second-judged — his own answer is on disk, so a second opinion buys nothing and doubles the cost",
            asked2 === 0 && keyed.graded === 1 && keyed.settled[0].judges === undefined);

          // FAIL-OPEN ON THE LANE. A dry free pool must not silently eat a verdict.
          const dry = await gradeJudge({ dry: true, rows: [cap()], generate: grade("defended"),
            secondOpinion: async () => ({ ok: false, reason: "lane-down" }) });
          assert("BLOCK 5 · a DEAD second reader leaves the first verdict standing, recorded honestly as ONE judge — a broken second opinion must never discard a real one",
            dry.graded === 1 && dry.settled[0].judges === 1 && dry.settled[0].agreed === null && /lane-down/.test(dry.settled[0].judge2_note));

          // key_doubt — a card about the PAGE, never a change to the verdict.
          const kd = await gradeJudge({ dry: true, rows: [cap({ type: "axis_weld", ref: "tokenization:a", key: "his weld", standard: "capsule" })],
            generate: grade("held", { key_doubt: "the weld says BPE merges letters one at a time; it merges the most frequent PAIR" }),
            secondOpinion: async () => ({ ok: false }) });
          assert("BLOCK 5 · key_doubt — his recall verdict STILL STANDS and is recorded; the doubt about his own page becomes a card, because only he edits a capsule",
            kd.graded === 1 && kd.settled[0].verdict === "held" && kd.key_doubts.length === 1
            && /Capsule check/.test(keyDoubtCard({ concept: "tokenization", label: "axis a" }, "x")));
          assert("BLOCK 5 · the second-judge prompt is a genuinely INDEPENDENT read — it is never told what the first judge concluded",
            (() => { const p = buildSecondJudgePrompt(cap()); return /SECOND, INDEPENDENT reader/.test(p) && !/defended|collapsed|conceded/.test(p.split("LEGAL VERDICTS")[0]); })());
          assert("BLOCK 5 · …and it is a DIFFERENT MODEL FAMILY: the free Flash lane the Watcher already proves live, so a second opinion costs latency and nothing else",
            SECOND_JUDGE_TYPES.join(",") === "hidden_test,adversarial,scrimmage");
        }

        // THE PROMPT — keyless items get HIS ground, never the model's taste
        {
          const p = buildJudgePrompt(items, { readJson: (f) => (String(f).includes("context") ? { mechanism: "har call pe poora folder dobara bheja jata hai", traps: ["size ko memory samajh lena"], interviewLines: ["name the statelessness first"] } : null) });
          // ⚠ THESE FIVE MOVED FROM THE PROMPT TO THE CARTRIDGE (BLOCK 1, 16 Aug
          // 2026) and every claim they make is unchanged — what changed is WHERE it
          // is sent. The rubric is now the cached head and the body carries only
          // what varies. Asserted on the head where the head holds them, and on the
          // BODY where they must NOT appear, because a rule living in both places
          // is the same rule paid for twice on every call.
          const HEAD = judgeCartridge({ who: "" });
          assert("CARTRIDGE · the whole rubric is in the head, and the head is the INVARIANT half — all eight types, their legal verdicts, and the standard beside each",
            /GRADE THE MECHANISM, NEVER THE WORDING/.test(HEAD)
            && Object.keys(VERDICT_TYPES).every((t) => HEAD.includes(t))
            && /legal verdicts: held \| cracked/.test(HEAD) && /standard: dossier/.test(HEAD));
          assert("CARTRIDGE · it forbids a guessed grade outright, and says plainly that a declined item is honest",
            /A MISSING GRADE IS HONEST; A GUESSED ONE IS NOT/.test(HEAD) && /judged again/.test(HEAD));
          assert("CARTRIDGE · his gut-word is given to the judge and explicitly excluded from the grade — it is a prediction being measured, not evidence",
            /gut-word/i.test(HEAD) && /Never let it move the verdict/.test(HEAD));
          assert("CARTRIDGE · it is BYTE-IDENTICAL on repeat, which is the entire caching mechanism — anything varying per round would silently disable it",
            judgeCartridge({ who: "" }) === HEAD && judgeCartridge({ who: "" }) === HEAD);
          assert("CARTRIDGE · nothing about a specific round leaks into it — no item id, no concept, no answer of his",
            !HEAD.includes("context:a") && !HEAD.includes("=== THE ROUND ===") && !HEAD.includes("WHAT HE SAID OUT LOUD"));
          assert("BODY · carries what VARIES and nothing else — his ground for this round's concepts, and his answers",
            /HIS OWN GROUND FOR "context"/.test(p) && /har call pe poora folder/.test(p)
            && /=== THE ROUND ===/.test(p) && !/GRADE THE MECHANISM, NEVER THE WORDING/.test(p));
          // THE HEAD IS NEVER LOST, ONLY THE CACHING. On a box where a system prompt
          // cannot ride argv the rubric is inlined at the front of the body instead —
          // slower, never standardless.
          assert("BODY · on a lane where the head cannot ride argv it is INLINED instead, so the standard is never silently dropped",
            buildJudgePrompt(items, { inlineHead: true }).indexOf("You are the judge of ONE learner") === 0);
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
            (src2.match(/claudeGen\(p, "opus", \d+, \["--effort", "max"\](?:, [^)]*)?\)/g) || []).length === 2
            && /if \(process\.env\.ANTHROPIC_API_KEY\) return refuse\(\);/.test(readFileSync(join(HERE, "claudegen.mjs"), "utf8")));
          // …and PASS 1 is the one that hands over a head, which is the whole of BLOCK 1.
          assert("PASS 1 rides the SPLIT — the head is handed to claudeGen's fifth parameter, and only when this box can actually carry it",
            /claudeGen\(p, "opus", 300000, \["--effort", "max"\], rides \? head : null\)/.test(src2));
          // §9.1 (18 Aug 2026) — the two source-level halves of the external check, held
          // on the SAME read of this file (see the note in the §9.1 block above).
          assert("§9.1 · the search lane is claudeGen with the TOOL GRANT (the 11 Aug proof) — same door, same API-key refusal, never a new vendor",
            /claudeGen\(p, "sonnet", 180000, \["--allowedTools", "WebSearch"\]\)/.test(src2));
          assert("§9.1 · the plan-vs-code correction is HELD, not just written: the source is the SOURCED bank (field_probes.json), and the invented probe_bank_ files are not read here at all",
            /field_probes\.json/.test(src2.split("function selftest()")[0]) && !/probe_bank_/.test(src2.split("function selftest()")[0]));
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
          dry: true, now: T0, sitting: { id: "fixture-sitting", closed_at: null }, transcript: "CAPTAIN: haan theek hai\nGAFFER: chalo.\n", bus: "", skipBus: true,
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
