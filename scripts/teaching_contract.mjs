#!/usr/bin/env node
// TEACHING CONTRACT — the per-turn re-injection of HOW he must be taught.
//
// WHY THIS EXISTS (31 Jul 2026, his own words: "why are you drifting so fuckin much??
// how to absolutely stop it for every new sessions as well? wtf is going wrong in the
// organism?").
//
// The organism already had two injectors:
//   SessionStart     -> learnstate.mjs brief      = the 17 HOW_HE_LEARNS rules, ONCE.
//   UserPromptSubmit -> forge_session.mjs contract = the METHOD (steps/axes/moments), EVERY TURN.
//
// So the pacing rules came back every turn and the TEACHING rules did not. Over a
// 5-hour session with compaction the 17 rules faded, and the observed result was
// exactly that asymmetry: ZERO method-drifts, FOUR teaching-drifts (scope, role,
// language, terminology). What comes back every turn is what holds.
//
// This organ closes that gap WITHOUT breaking the anti-wall law. forge_session.mjs
// asserts its contract can never exceed 9 lines, on purpose — a wall of text read
// every turn is a wall of text ignored every turn. So this is a SEPARATE, hard-bounded
// block (<= 5 lines), printed by its own hook.
//
// IT MUTATES WITH THE JOURNEY (his explicit requirement — "do it in a manner that
// mutates as per our learning journey and no [not] hardcoded"):
//   1. RULES LIVE IN STATE, not in this file. `add` grows the set as new drifts are
//      caught; nothing here needs editing again.
//   2. DRIFT-RANKED. `hit <id>` records a real violation. The rule with the most hits
//      is the one that gets re-injected first — the contract sharpens itself against
//      whatever is actually going wrong, instead of nagging uniformly forever.
//   3. ROTATION. Slot 1 = the worst offender (stable). Slot 2 rotates through the rest
//      by turn number, so a quiet rule still resurfaces and nothing goes stale-invisible.
//   4. THE LINK-BACK LINE IS DERIVED, NEVER TYPED. Already-closed concepts are read
//      live from sprint.json `progress.done`, so the moment he closes 1-04 the contract
//      starts demanding that 1-05 be tied back to it. Zero maintenance.
//
// CONTEXT WARNING (his second requirement — "explicitly tell me beforehand everytime
// when you are about to loose the context"): a turn counter is kept per CLAUDE CODE
// SESSION and a loud line fires at `context_warn_at`, so the warning is a MEASURED
// signal the machine raises, not a promise the model has to remember to keep.
//   CORRECTED 2 Aug 2026 (audit #38). This line used to read "per forge session", and
//   the code did exactly that — which is why the organ could pass its own selftest
//   18/18 while asserting something untrue to him. Context is a property of the CLAUDE
//   CODE session, not the study session, so the spec contradicted the purpose four
//   lines above it. Both were wrong together; both are fixed together. See THE ANCHOR
//   below for the precedence and for UNKNOWN NEVER RESETS.
//
// OWNER DISCIPLINE: this file is the sole writer of state/teaching_contract.json.
// `print` is HOOK-SAFE — it fails silent and always exits 0. A broken teaching contract
// must never be able to block his prompt.
//
// CLI: print | list | add <id> <line...> | hit <id> | drop <id> | reset-turns | selftest

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state", "teaching_contract.json");
const SPRINT = join(ROOT, "dressing-room", "state", "sprint.json");
const FORGE = join(ROOT, "dressing-room", "state", "forge_session.json");
const CAPSULE_DIR = join(ROOT, "dressing-room", "state", "capsules");

const MAX_BLOCK_LINES = 5;      // the anti-wall law, this organ's own copy
const DEFAULT_WARN_AT = 40;

// ── THE FILL GAUGE (audit #107, 5 Aug 2026) ──────────────────────────────────
// MEASURED, not assumed. Audit #38 moved the clock off the forge session and onto
// the Claude Code session id, and that was right about the NOUN and wrong about the
// IDENTIFIER. Measured live on 5 Aug across three consecutive turns of ONE
// conversation: the session id changed mid-conversation (bd2d46c2… -> fa94c375…)
// and the counter went 1 -> 1 -> 2. So the clock zeroed at exactly the moment the
// context was LARGEST — a resume/fork. #38's failure mode was "always fires"; this
// is its mirror, "never fires", and it is the worse of the two because it is silent.
//
// transcript_path is not the fix either: the fork minted a NEW transcript file. But
// the new file INHERITED the history (710,280 -> 958,257 bytes), so while the
// transcript's IDENTITY breaks across a fork, its SIZE carries forward. Size is
// therefore the only resume-surviving proxy for context fill that we can read.
//
// THE CONSTANT IS DERIVED FROM HIS OWN HISTORY, never chosen: across 3,780
// transcripts in this project's Claude Code store — p50 28,197 · p90 63,367 ·
// p95 99,557 · p99 2,263,929 · max 12,171,532 bytes; only 49 (1.3%) ever pass 1 MB.
// A warn at 1.5 MB therefore fires on ~1% of sessions — the long study ones, which
// is precisely the population the warning exists for — and stays silent on the 99%,
// so it can never become the always-fires line he learns to ignore.
// It is still a v0 HYPOTHESIS (transcript bytes are not context tokens) and it lives
// in state, so it can be retuned from observation without editing this file.
const DEFAULT_TRANSCRIPT_WARN_BYTES = 1_500_000;
const SOFT_FRACTION = 0.6;      // a heads-up BEFORE the hard line — he asked to be warned beforehand

// ── SEED ──────────────────────────────────────────────────────────────────────
// These four are not invented: each is a drift that actually happened on 31 Jul and
// that he named himself. Everything after this comes in through `add`.
function seed(now = new Date()) {
  const ts = now.toISOString();
  const r = (id, line) => ({ id, line, hits: 0, last_hit: null, born: ts });
  return {
    version: 1,
    show_n: 2,
    context_warn_at: DEFAULT_WARN_AT,
    // Lives in STATE so the fill gauge can be retuned from observation without
    // editing this file — same discipline as `context_warn_at`. Absent in pre-#107
    // state files, and absent falls back to the derived default (never to silence).
    transcript_warn_bytes: DEFAULT_TRANSCRIPT_WARN_BYTES,
    turns: { session_started_at: null, count: 0 },
    rules: [
      r("his-word", "Uska saaf bola hua instruction > meri samajh. Scope kaatna/badalna ho to PEHLE poochho, khud mat kaato."),
      r("hinglish", "HINGLISH — shuddh Hindi nahi. Technical shabd ANGREZI mein hi rehne dena."),
      r("terminology", "Asli terminology bolo (token · vocabulary · next-token · sampling · groundedness). Hindi anuvaad se naam mat badlo — analogy alag cheez hai, naam alag."),
      r("link-back", "Naya concept hamesha pehle band ho chuke concepts se NAAM le kar jodo."),
      r("decided", "Jo faisla wo pehle le chuka hai wo zinda hai — har naye message se intent dobara mat nikaalo."),
    ],
  };
}

// ── PURE CORE (no disk — the selftest never needs a file) ─────────────────────

function rank(rules) {
  // Worst offender first. Ties break on recency, then on birth order (stable).
  return [...rules].sort((a, b) =>
    (b.hits - a.hits)
    || String(b.last_hit || "").localeCompare(String(a.last_hit || ""))
    || String(a.born || "").localeCompare(String(b.born || "")));
}

function pick(rules, turn, showN) {
  const ranked = rank(rules);
  if (!ranked.length) return [];
  const n = Math.max(1, Math.min(showN || 2, ranked.length));
  const out = [ranked[0]];                                  // slot 1: stable, the worst
  const rest = ranked.slice(1);
  for (let k = 0; k < n - 1 && rest.length; k++) {          // slot 2+: rotates by turn
    out.push(rest[(turn + k) % rest.length]);
  }
  return out;
}

function addRule(state, id, line, now = new Date()) {
  if (!id || !line) return { ok: false, why: "id and line are both required", state };
  if (state.rules.some((x) => x.id === id)) return { ok: false, why: `rule "${id}" already exists — use \`hit\` or \`drop\``, state };
  return {
    ok: true,
    state: { ...state, rules: [...state.rules, { id, line, hits: 0, last_hit: null, born: now.toISOString() }] },
  };
}

function hitRule(state, id, now = new Date()) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return {
    ok: true,
    state: { ...state, rules: state.rules.map((x) => x.id === id ? { ...x, hits: x.hits + 1, last_hit: now.toISOString() } : x) },
  };
}

function dropRule(state, id) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return { ok: true, state: { ...state, rules: state.rules.filter((x) => x.id !== id) } };
}

// ── FROZEN ENGINES (layering law, CLAUDE.md) ─────────────────────────────────
// Both of these are the 31 Jul originals, kept BYTE-FOR-BYTE. They are no longer
// the plan of record — the engines below them are — but they stay so the audit's
// two findings remain reproducible from inside this file, and so the selftest can
// assert what the OLD engine actually did rather than describing it in a comment.
// Neither is called by any live path; both are called by the selftest.

// A new forge session resets the turn clock; the same one keeps counting.
function bumpTurnLegacy(state, sessionStartedAt) {
  const t = state.turns || { session_started_at: null, count: 0 };
  const fresh = t.session_started_at !== (sessionStartedAt || null);
  return { ...state, turns: { session_started_at: sessionStartedAt || null, count: fresh ? 1 : t.count + 1 } };
}

function blockLinesLegacy(state, done, now = new Date()) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const turn = (state.turns && state.turns.count) || 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`);
  for (const r of pick(state.rules, turn, state.show_n)) {
    L.push(`  ⚠ ${r.line}${r.hits ? `  [drifted ${r.hits}×]` : ""}`);
  }
  if (done && done.length) L.push(`  link back BY NAME to what is already closed: ${done.join(" · ")}`);
  if (turn >= warnAt) {
    L.push(`  ⛔ CONTEXT WARNING — turn ${turn}. TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`);
  }
  return L.slice(0, MAX_BLOCK_LINES);
}

// ── THE ANCHOR — what counts as "a session" for the turn clock (audit #38) ────
// THE DEFECT, measured on the live bus 2 Aug 2026:
//   · bumpTurnLegacy treats "the anchor string changed" as the ONLY reset, and the
//     anchor was the FORGE session's started_at. Live state today: forge_session.json
//     started_at 2026-08-02T09:04:09.246Z, teaching_contract.json turns.count 28 —
//     i.e. the counter rides a study session, not a Claude Code session.
//   · With NO forge session, forgeStartedAt() returns null, and after ONE bump the
//     stored anchor is already null, so `null !== null` is FALSE FOREVER. The count
//     rises monotonically across every future session with no reset path. Past
//     context_warn_at it then fires the CONTEXT WARNING on turn 1 of every fresh,
//     empty session — and a warning that always fires is one he learns to ignore.
//
// THE LAW THAT FIXES IT — **UNKNOWN NEVER RESETS.** Only a KNOWN anchor that DIFFERS
// from the stored one resets the count. A null/absent anchor means "I do not know
// which session this is", and not-knowing must never be read as a new session. This
// is the audit's named trap: making a null anchor reset would pin the counter at 1
// on exactly the non-forge days the warning matters most.
//
// ANCHOR CLASSES, in precedence order:
//   1. cc:<session_id>   — the Claude Code session id, read from the hook payload on
//      stdin. This is the boundary that actually governs CONTEXT, which is the thing
//      the warning is about. Same read hooks/afferent-post.mjs:44 has performed live
//      in this same UserPromptSubmit array since 25 Jul.
//   2. cc:local-<iso>    — minted by `reset-turns`. Wire `reset-turns` into
//      .claude/settings.json's SessionStart array and the clock has a real per-session
//      boundary with NO stdin dependency at all. (That wiring is the sanctioned fix;
//      class 1 is belt-and-braces so the counter is right even before it lands.)
//   3. forge:<started_at> — the ORIGINAL anchor, kept as the secondary reset trigger
//      the header at :36 has always described: a new `forge start` still resets.
//   4. null              — unknown. Held, never reset, and SAID OUT LOUD in the block
//      header, because "turn 28/40" is only true of a session we can actually name.
const CC_PREFIX = "cc:";
const FORGE_PREFIX = "forge:";
const TX_PREFIX = "tx:";        // audit #107 — the transcript, which survives a resume

// MIGRATION (one-shot, layered). Pre-fix state carried ONLY turns.session_started_at
// = the forge session's started_at ISO. Read that as a forge-class anchor so the
// upgrade itself does not silently reset his live counter on its first turn.
function storedAnchorOf(t) {
  if (!t || typeof t !== "object") return null;
  if (typeof t.anchor === "string" && t.anchor) return t.anchor;
  if (typeof t.session_started_at === "string" && t.session_started_at) return FORGE_PREFIX + t.session_started_at;
  return null;
}

function anchorKindOf(t) {
  if (t && typeof t.anchor_kind === "string" && t.anchor_kind) return t.anchor_kind;
  return storedAnchorOf(t) ? "forge" : "none";   // pre-fix state: a non-null anchor WAS a live forge anchor
}

// obs = { cc: <claude code session id|null>, forge: <forge started_at|null> }
// FROZEN 5 Aug 2026 (audit #107), byte-for-byte. No longer the plan of record — the
// engine below adds a transcript-class anchor above `cc` — but it stays so the #38
// invariants remain reproducible from inside this file and the selftest can assert
// what the OLD precedence actually did rather than describing it in a comment.
function resolveAnchorLegacy(stored, obs = {}) {
  const held = typeof stored === "string" && stored ? stored : null;
  const cc = obs.cc ? CC_PREFIX + String(obs.cc) : null;
  const forge = obs.forge ? FORGE_PREFIX + String(obs.forge) : null;
  if (cc) return { id: cc, kind: "cc" };
  // No session id THIS turn. If the stored anchor is session-class we cannot tell
  // whether we are still inside it — UNKNOWN NEVER RESETS, so hold it rather than
  // demote to the forge anchor (a demotion would look like "the anchor changed" and
  // would reset the clock on a turn where nothing actually changed).
  if (held && held.startsWith(CC_PREFIX)) return { id: held, kind: "cc_held" };
  if (forge) return { id: forge, kind: "forge" };
  return { id: held, kind: "none" };
}

// PLAN OF RECORD (audit #107). Same law — UNKNOWN NEVER RESETS — with one class
// added ABOVE `cc`: the transcript. A transcript survives what a session id does not
// (a plain resume keeps writing the same file), so anchoring on it removes the most
// common spurious reset. A FORK still mints a new transcript, which is why the
// context WARNING no longer rides this anchor at all — it rides the fill gauge, which
// carries forward across both. The anchor's remaining job is rule ROTATION, where a
// reset costs nothing.
// obs = { tx, cc, forge }
function resolveAnchor(stored, obs = {}) {
  const held = typeof stored === "string" && stored ? stored : null;
  const tx = obs.tx ? TX_PREFIX + String(obs.tx) : null;
  const cc = obs.cc ? CC_PREFIX + String(obs.cc) : null;
  const forge = obs.forge ? FORGE_PREFIX + String(obs.forge) : null;
  if (tx) return { id: tx, kind: "tx" };
  if (cc) return { id: cc, kind: "cc" };
  // No live identifier THIS turn. A held session-class anchor (tx or cc) cannot be
  // proven stale, so it is HELD rather than demoted — a demotion would read as "the
  // anchor changed" and would reset a clock on a turn where nothing changed.
  // The held KIND keeps the class it was held from — `cc_held` is the label #38's
  // invariant was written against, so it must survive verbatim; `tx_held` is its
  // transcript-class twin. A held anchor is never relabelled, only carried.
  if (held && held.startsWith(TX_PREFIX)) return { id: held, kind: "tx_held" };
  if (held && held.startsWith(CC_PREFIX)) return { id: held, kind: "cc_held" };
  if (forge) return { id: forge, kind: "forge" };
  return { id: held, kind: "none" };
}

// ── THE FILL GAUGE ───────────────────────────────────────────────────────────
// Pure read. Every failure path returns null, and a null fill means the block falls
// back to the turn counter — never to silence, and never to a fabricated number.
function transcriptFill(path, warnBytes = DEFAULT_TRANSCRIPT_WARN_BYTES) {
  try {
    if (!path || typeof path !== "string" || !existsSync(path)) return null;
    const bytes = statSync(path).size;
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    const limit = Number.isFinite(warnBytes) && warnBytes > 0 ? warnBytes : DEFAULT_TRANSCRIPT_WARN_BYTES;
    return { bytes, limit, pct: bytes / limit };
  } catch { return null; }
}

// PLAN OF RECORD. `anchor` may be the {id, kind} object from resolveAnchor, or a bare
// string (legacy call shape — read as a forge anchor, so the three original selftest
// invariants still hold verbatim against this engine).
function bumpTurn(state, anchor, now = new Date()) {
  const t = (state && state.turns) || {};
  const a = (anchor && typeof anchor === "object")
    ? anchor
    : { id: anchor ? FORGE_PREFIX + String(anchor) : null, kind: anchor ? "forge" : "none" };
  const prev = storedAnchorOf(t);
  const known = a.kind !== "none" && !!a.id;
  // Adopting an anchor where NONE was stored is "we learned which session this is",
  // not "a new session started" — so it does not reset either. Only known != known.
  const fresh = known && prev !== null && a.id !== prev;
  const count = fresh ? 1 : (Number.isInteger(t.count) ? t.count : 0) + 1;
  return {
    ...state,
    turns: {
      anchor: a.id,
      anchor_kind: a.kind,
      count,
      // FROZEN KEY: this is what pre-fix state and any human reading the file already
      // know to look for. It carries the forge ISO when the anchor is forge-class and
      // null otherwise — never a `cc:` string, so nothing that ever parsed it as a
      // timestamp can be handed a non-timestamp.
      session_started_at: a.id && a.id.startsWith(FORGE_PREFIX) ? a.id.slice(FORGE_PREFIX.length) : null,
      // WHEN this count started. Makes "28 prompts since <date>" a measured fact
      // rather than an unlabelled number when the clock is unanchored.
      since: (fresh || typeof t.since !== "string" || !t.since) ? now.toISOString() : t.since,
    },
  };
}

// ── THE BLOCK — non-droppable lines first (audit #39) ────────────────────────
// THE DEFECT: blockLinesLegacy ended `L.slice(0, MAX_BLOCK_LINES)`, which truncates
// from the TAIL — and the tail is exactly the CONTEXT WARNING, then the link-back.
// Reproduced by the audit against live state: show_n=3 loses the warning, show_n=4
// loses the link-back too. Both are the things the header calls the point of the
// organ; the rules are by design re-injected on later turns and the warning fires
// once. The truncation order sacrificed the one thing he asked for by name.
//
// THE FIX: the budget is spent on the non-droppables FIRST (header · link-back ·
// warning = at most 3), and the ROTATING RULES take whatever is left. Slot 1 (the
// worst offender) is index 0 of pick(), so truncation always eats a rotating rule
// and never the top-ranked one. The block is bounded BY CONSTRUCTION now, not by a
// slice — which is what finally makes the ANTI-WALL assertion falsifiable.
// ARITHMETIC (no guessed number anywhere): reserved is at most 1+1+1 = 3, so
// MAX_BLOCK_LINES - reserved is at least 5-3 = 2 rule slots in every reachable state.
// FROZEN 5 Aug 2026 (audit #107), byte-for-byte. Superseded by the engine below,
// which adds the fill gauge; kept so the #39 non-droppable-ordering invariant stays
// assertable against the engine that first satisfied it.
function blockLinesV2(state, done, now = new Date()) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const t = (state.turns && typeof state.turns === "object") ? state.turns : {};
  const turn = Number.isInteger(t.count) ? t.count : 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const anchored = anchorKindOf(t) !== "none";
  const total = state.rules.length;

  const link = (done && done.length)
    ? `  link back BY NAME to what is already closed: ${done.join(" · ")}`
    : null;
  // HONESTY (audit #38 + #106): an unanchored clock has counted prompts across
  // sessions, so it is NOT this session's turn count. It still fires — suppressing
  // it is the named trap — but it says which kind of number it is.
  const warn = turn >= warnAt
    ? `  ⛔ CONTEXT WARNING — turn ${turn}${anchored ? "" : " counted ACROSS sessions (clock unanchored)"}.`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`
    : null;

  const reserved = 1 + (link ? 1 : 0) + (warn ? 1 : 0);        // header + the two non-droppables
  const room = Math.max(0, MAX_BLOCK_LINES - reserved);
  const shown = pick(state.rules, turn, state.show_n).slice(0, room);

  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`
    + (anchored ? "" : " · CLOCK UNANCHORED (no session boundary recorded — see reset-turns)")
    + ` · rules ${shown.length}/${total}`);                     // have/need, never the bare word
  for (const r of shown) L.push(`  ⚠ ${r.line}${r.hits ? `  [drifted ${r.hits}×]` : ""}`);
  if (link) L.push(link);
  if (warn) L.push(warn);
  return L;
}

const mb = (b) => (b / 1048576).toFixed(2) + " MB";

// PLAN OF RECORD (audit #107). Identical to V2 except for WHICH SIGNAL RAISES THE
// WARNING. The turn counter measures prompts; what he asked to be warned about is
// CONTEXT. Those two came apart the moment a fork reset the counter to 1 while the
// context kept everything — so the counter is now the FALLBACK and the transcript's
// size is the signal. Fill wins whenever it is readable: a 60-turn session with a
// small transcript is genuinely nowhere near compaction, and firing there is how a
// warning becomes noise.
// The line budget arithmetic is UNCHANGED (header + link + warn ≤ 3 reserved, so at
// least 2 rule slots survive in every reachable state), which keeps the #39
// non-droppable-ordering assertion true of this engine too.
function blockLines(state, done, now = new Date(), fill = null) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const t = (state.turns && typeof state.turns === "object") ? state.turns : {};
  const turn = Number.isInteger(t.count) ? t.count : 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const anchored = anchorKindOf(t) !== "none";
  const total = state.rules.length;

  const link = (done && done.length)
    ? `  link back BY NAME to what is already closed: ${done.join(" · ")}`
    : null;

  let warn = null;
  if (fill && fill.pct >= 1) {
    warn = `  ⛔ CONTEXT WARNING — transcript ${mb(fill.bytes)} (${Math.round(fill.pct * 100)}% of the ${mb(fill.limit)} warn budget).`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`;
  } else if (fill && fill.pct >= SOFT_FRACTION) {
    warn = `  ⚠ context filling — transcript ${mb(fill.bytes)} (${Math.round(fill.pct * 100)}% of the ${mb(fill.limit)} warn budget). Say it out loud at the next natural break, not mid-idea.`;
  } else if (!fill && turn >= warnAt) {
    // FALLBACK ONLY — the transcript was unreadable. Say which number this is: an
    // unanchored counter has counted prompts across sessions and is not this
    // session's turn count. Suppressing it is the named #38 trap; mislabelling it
    // is the #106 one.
    warn = `  ⛔ CONTEXT WARNING — turn ${turn}${anchored ? "" : " counted ACROSS sessions (clock unanchored)"}, transcript unreadable so this is a PROMPT count, not a context measure.`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`;
  }

  const reserved = 1 + (link ? 1 : 0) + (warn ? 1 : 0);
  const room = Math.max(0, MAX_BLOCK_LINES - reserved);
  const shown = pick(state.rules, turn, state.show_n).slice(0, room);

  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`
    + (anchored ? "" : " · CLOCK UNANCHORED (no session boundary recorded — see reset-turns)")
    + (fill ? ` · context ${Math.round(fill.pct * 100)}%` : "")
    + ` · rules ${shown.length}/${total}`);
  for (const r of shown) L.push(`  ⚠ ${r.line}${r.hits ? `  [drifted ${r.hits}×]` : ""}`);
  if (link) L.push(link);
  if (warn) L.push(warn);
  return L;
}

// ── DISK ──────────────────────────────────────────────────────────────────────

function load() {
  try {
    if (!existsSync(STATE)) return seed();
    const s = JSON.parse(readFileSync(STATE, "utf8"));
    if (!s || !Array.isArray(s.rules)) return seed();
    return s;
  } catch { return seed(); }
}

function save(s) {
  try {
    mkdirSync(dirname(STATE), { recursive: true });
    writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n");
    return true;
  } catch { return false; }
}

// AUDIT #107 — CLOSED MEANS LOCKED, NOT JUST TICKED ON THE SHEET.
// This read only sprint.progress.done, and the live Sheet lists 1-01 Embeddings ·
// 1-02 Inference · 1-03 Context — while `tokenization` has been a LOCKED, TEMPERED
// capsule since 15 Jun 2026 and appears nowhere in it. So the one rule whose whole job
// is "link the new concept back BY NAME to what is already closed" was structurally
// unable to name a quarter of what he has actually closed. A locked capsule is the
// harder evidence of the two — the Sheet is hand-maintained, a capsule is not — so
// both sources feed the line, de-duplicated, Sheet wording first.
function doneConcepts() {
  const out = [], seen = new Set();
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
  // The two sources word the same concept differently — the Sheet says "Context window",
  // the capsule id is "context". An exact-key dedupe would print BOTH, which is worse
  // than the bug it was fixing: the rule would tell him to link back to one concept
  // twice. So a capsule matches if any Sheet entry CONTAINS its id.
  const push = (label, key) => {
    const k = norm(key || label);
    if (!k) return;
    for (const s of seen) if (s === k || s.includes(k) || k.includes(s)) return;
    seen.add(k); out.push(label);
  };
  try {
    const sp = JSON.parse(readFileSync(SPRINT, "utf8"));
    const d = sp && sp.progress && Array.isArray(sp.progress.done) ? sp.progress.done : [];
    for (const x of d) {
      const label = String(x).replace(/\s*\(finish\)\s*$/i, "").trim();
      if (label) push(label, label.replace(/^\d+-\d+\s*/, ""));   // "1-01 Embeddings" keys on "embeddings"
    }
  } catch {}
  try {
    for (const f of readdirSync(CAPSULE_DIR)) {
      if (!f.endsWith(".json")) continue;
      const c = JSON.parse(readFileSync(join(CAPSULE_DIR, f), "utf8"));
      if (c && c.id) push(`${c.title || c.id} (capsule locked)`, c.id);
    }
  } catch { /* no capsule mirror on this machine — the Sheet alone still works */ }
  return out;
}

function forgeStartedAt() {
  try {
    const f = JSON.parse(readFileSync(FORGE, "utf8"));
    return f && !f.closed_at ? (f.started_at || null) : null;
  } catch { return null; }
}

// THE CLAUDE CODE SESSION ID, straight from the hook payload (audit #38, class 1).
// Claude Code pipes the same JSON payload to every command in a hooks array, and
// hooks/afferent-post.mjs:44 has read fd 0 exactly this way in THIS SAME
// UserPromptSubmit array since 25 Jul — the read is proven in this hook position,
// not assumed. The repo's own rig guide documents the payload shape
// (learning-layer/Tier-2_Accountability_Rig_on_Windows…md:373 reads transcript_path
// off it), and session_id rides alongside it.
//
// NEVER BLOCKS: a TTY stdin is not read at all (a human at a terminal would hang on
// a pipe that never ends), and every failure path — no stdin, drained stdin because
// an earlier hook consumed it, junk JSON, no session_id — returns null. Under
// UNKNOWN NEVER RESETS, null is the safe direction: the clock holds, it does not
// jump. So the worst case of this read failing is exactly the behaviour we would
// have had without it.
// CACHED — fd 0 is a ONE-SHOT stream. Before audit #107 there was a single reader,
// so a plain `readFileSync(0)` per call was safe. Now two facts are needed off the
// same payload (session_id AND transcript_path) and a second read would return "" and
// silently blank the anchor. One read, memoised, is the only correct shape here.
let _payload;
function hookPayload() {
  if (_payload !== undefined) return _payload;
  _payload = null;
  try {
    if (process.stdin.isTTY) return _payload;
    const raw = readFileSync(0, "utf8");
    if (!raw || !raw.trim()) return _payload;
    const j = JSON.parse(raw);
    if (j && typeof j === "object") _payload = j;
  } catch { _payload = null; }
  return _payload;
}

function hookSessionId() {
  const j = hookPayload();
  const id = j && typeof j.session_id === "string" ? j.session_id.trim() : "";
  return id || null;
}

// The transcript is the container context actually lives in, and the repo's own rig
// guide documents this field on the payload
// (learning-layer/Tier-2_Accountability_Rig_on_Windows…md:373 reads transcript_path
// off it) — so this is a documented read, not a guess.
function hookTranscriptPath() {
  const j = hookPayload();
  const p = j && typeof j.transcript_path === "string" ? j.transcript_path.trim() : "";
  return p || null;
}

// The three numbers `list` and the close report both need: how many rules exist,
// how many have EVER been hit, and when the newest hit landed. Pure; no disk.
// (audit #40 — a zero here is only meaningful next to the date the recorder last ran.)
function hitStats(rules) {
  const arr = Array.isArray(rules) ? rules : [];
  let everHit = 0, newest = null;
  for (const r of arr) {
    const h = Date.parse((r && r.last_hit) || "");
    if (Number.isFinite(h)) { everHit++; if (!newest || h > Date.parse(newest)) newest = r.last_hit; }
  }
  return { total: arr.length, ever_hit: everHit, newest_hit: newest };
}

// ── SELFTEST ──────────────────────────────────────────────────────────────────

function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}`); } };
  const T0 = new Date("2026-07-31T18:00:00Z");
  const base = seed(T0);

  assert("seed carries the five drifts he actually named", base.rules.length === 5);

  const hit = hitRule(hitRule(base, "hinglish", T0).state, "hinglish", T0).state;
  assert("hit increments and stamps", hit.rules.find((r) => r.id === "hinglish").hits === 2);
  assert("DRIFT-RANKED — the worst offender takes slot 1", rank(hit.rules)[0].id === "hinglish");
  assert("slot 1 is stable across turns",
    pick(hit.rules, 1, 2)[0].id === "hinglish" && pick(hit.rules, 7, 2)[0].id === "hinglish");

  const secondSlots = new Set();
  for (let t = 0; t < 12; t++) secondSlots.add(pick(hit.rules, t, 2)[1].id);
  assert("ROTATION — every other rule resurfaces in slot 2 (nothing goes stale-invisible)",
    secondSlots.size === hit.rules.length - 1);

  const grown = addRule(base, "no-praise", "Praise sirf jab kamayi ho, aur specific ho.", T0);
  assert("add grows the set without touching this file", grown.ok && grown.state.rules.length === 6);
  assert("add refuses a duplicate id", addRule(grown.state, "no-praise", "x", T0).ok === false);
  assert("hit refuses an unknown id", hitRule(base, "nope", T0).ok === false);
  assert("drop removes", dropRule(base, "hinglish").state.rules.length === 4);

  // ---- the turn clock: the three ORIGINAL invariants, asserted against BOTH engines
  const t1L = bumpTurnLegacy(base, "S1");
  assert("FROZEN ENGINE — legacy turn clock starts at 1, keeps counting, resets on a new forge session",
    t1L.turns.count === 1 && bumpTurnLegacy(t1L, "S1").turns.count === 2
    && bumpTurnLegacy(bumpTurnLegacy(t1L, "S1"), "S2").turns.count === 1);

  const t1 = bumpTurn(base, "S1", T0);
  assert("turn clock starts at 1 for a new session", t1.turns.count === 1);
  assert("same session keeps counting", bumpTurn(t1, "S1", T0).turns.count === 2);
  assert("a NEW forge session resets the clock", bumpTurn(bumpTurn(t1, "S1", T0), "S2", T0).turns.count === 1);

  // ---- audit #38 — the anchor. Each of these can fail; none is a tautology.
  const nullAnchored = bumpTurn(bumpTurn(base, null, T0), null, T0);
  assert("THE TRAP — a NULL anchor never resets the clock (that would pin it at 1 on exactly the non-forge days the warning matters)",
    bumpTurn(base, null, T0).turns.count === 1 && nullAnchored.turns.count === 2
    && bumpTurn(nullAnchored, null, T0).turns.count === 3);
  assert("UNKNOWN NEVER RESETS — adopting an anchor where none was stored keeps counting, it does not restart",
    bumpTurn(nullAnchored, { id: "cc:A", kind: "cc" }, T0).turns.count === 3);
  const ccA = bumpTurn(base, { id: "cc:A", kind: "cc" }, T0);
  assert("A KNOWN, DIFFERENT session id DOES reset — this is the reset path the forge anchor never gave a non-forge day",
    bumpTurn(ccA, { id: "cc:A", kind: "cc" }, T0).turns.count === 2
    && bumpTurn(ccA, { id: "cc:B", kind: "cc" }, T0).turns.count === 1);
  assert("PRECEDENCE — the Claude Code session id beats the forge session; the forge session is only the fallback",
    resolveAnchor(null, { cc: "A", forge: "2026-08-02T09:04:09.246Z" }).id === "cc:A"
    && resolveAnchor(null, { cc: null, forge: "2026-08-02T09:04:09.246Z" }).id === "forge:2026-08-02T09:04:09.246Z"
    && resolveAnchor(null, {}).kind === "none");
  assert("A SESSION ANCHOR IS HELD when no session id is readable that turn — never demoted to the forge anchor (a demotion would read as a reset)",
    resolveAnchor("cc:A", { cc: null, forge: "2026-08-02T09:04:09.246Z" }).id === "cc:A"
    && resolveAnchor("cc:A", { cc: null, forge: "2026-08-02T09:04:09.246Z" }).kind === "cc_held"
    && bumpTurn({ ...base, turns: { anchor: "cc:A", anchor_kind: "cc", count: 9 } },
                resolveAnchor("cc:A", { cc: null, forge: "X" }), T0).turns.count === 10);
  assert("MIGRATION — pre-fix state (turns.session_started_at only) reads as a FORGE anchor, so the upgrade does not reset his live count",
    storedAnchorOf({ session_started_at: "2026-08-02T09:04:09.246Z", count: 28 }) === "forge:2026-08-02T09:04:09.246Z"
    && anchorKindOf({ session_started_at: "2026-08-02T09:04:09.246Z", count: 28 }) === "forge"
    && bumpTurn({ ...base, turns: { session_started_at: "2026-08-02T09:04:09.246Z", count: 28 } },
                { id: "forge:2026-08-02T09:04:09.246Z", kind: "forge" }, T0).turns.count === 29);
  assert("the frozen key survives: session_started_at still carries the forge ISO for a forge anchor, and null for a session anchor",
    bumpTurn(base, "S1", T0).turns.session_started_at === "S1"
    && bumpTurn(base, { id: "cc:A", kind: "cc" }, T0).turns.session_started_at === null);

  const done = ["1-01 Embeddings", "1-02 Inference & sampling"];
  const lines = blockLines(t1, done, T0);
  assert("block names the closed concepts, derived from sprint.json — never typed here",
    lines.some((l) => l.includes("1-02 Inference & sampling")));

  // ---- audit #39 — the block's budget. The old assertion here checked the length of
  // a value it had just sliced to that length and COULD NOT FAIL. blockLines no longer
  // slices — it is bounded by construction — so this same sentence is now falsifiable,
  // and the three below it are the ones that actually protect the two derived lines.
  const atShowN = (n, turn) => blockLines({ ...base, show_n: n, turns: { anchor: "cc:S", anchor_kind: "cc", count: turn } }, done, T0);
  assert("ANTI-WALL LAW — the block is never more than 5 lines, in any reachable state",
    (() => {
      let worst = 0;
      for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++) worst = Math.max(worst, atShowN(n, t).length);
      return worst <= MAX_BLOCK_LINES;
    })());
  assert("THE CONTEXT WARNING IS NON-DROPPABLE — it survives at EVERY show_n 1..6 (the legacy slice ate it from show_n 3)",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => /CONTEXT WARNING/.test(l))));
  assert("THE LINK-BACK IS NON-DROPPABLE — it survives at every show_n 1..6 whenever sprint progress.done is non-empty",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => /link back BY NAME/.test(l))));
  assert("TRUNCATION EATS A ROTATING RULE, NEVER SLOT 1 — the worst offender is shown at every show_n",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => l.includes(rank(base.rules)[0].line))));
  // ARITHMETIC, so the numbers below are read not guessed. show_n=4, done non-empty:
  //   before the warning — reserved = header 1 + link 1 = 2 → room 3 → "rules 3/5"
  //   after  the warning — reserved = header 1 + link 1 + warn 1 = 3 → room 2 → "rules 2/5"
  // i.e. the warning costs a ROTATING RULE, which is exactly the trade the audit asked
  // for and the reverse of what the slice used to do.
  assert("HAVE/NEED — the header says how many rules are actually shown out of how many exist, so a truncation is visible",
    /rules 2\/5/.test(atShowN(4, 40)[0]) && /rules 3\/5/.test(atShowN(4, 1)[0]));
  assert("NO REGRESSION AT THE LIVE VALUE — at show_n 2 he still gets both rules, the link-back AND the warning, in 5 lines",
    atShowN(2, 40).length === 5 && /rules 2\/5/.test(atShowN(2, 40)[0])
    && atShowN(2, 40).filter((l) => /^ {2}⚠/.test(l)).length === 2
    && atShowN(2, 40).some((l) => /link back BY NAME/.test(l))
    && atShowN(2, 40).some((l) => /CONTEXT WARNING/.test(l)));
  assert("REGRESSION PIN — the FROZEN engine really did drop the warning at show_n 3 and the link-back at show_n 4 (why this file now has two)",
    !blockLinesLegacy({ ...base, show_n: 3, turns: { session_started_at: "S", count: 40 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l))
    && !blockLinesLegacy({ ...base, show_n: 4, turns: { session_started_at: "S", count: 40 } }, done, T0).some((l) => /link back BY NAME/.test(l)));

  const warned = { ...base, turns: { session_started_at: "S", count: 40 } };
  assert("CONTEXT WARNING fires at the threshold, loudly",
    blockLines(warned, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("…and stays quiet before it",
    !blockLines({ ...base, turns: { session_started_at: "S", count: 39 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("HONESTY — an UNANCHORED clock still warns (never suppressed) but says the count is across sessions, and an anchored one does not",
    blockLines({ ...base, turns: { anchor: null, anchor_kind: "none", count: 40 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l) && /across sessions/i.test(l))
    && blockLines({ ...base, turns: { anchor: null, anchor_kind: "none", count: 40 } }, done, T0)[0].includes("CLOCK UNANCHORED")
    && !blockLines(warned, done, T0)[0].includes("CLOCK UNANCHORED"));
  assert("HOOK-SAFE — no rules injects nothing", blockLines({ rules: [] }, done, T0).length === 0);
  assert("HOOK-SAFE — garbage state injects nothing", blockLines(null, done, T0).length === 0);
  assert("HOOK-SAFE — a state with no turns block at all still renders turn 0 and never throws",
    blockLines({ ...base, turns: undefined }, done, T0)[0].includes("turn 0/40"));

  // ---- audit #107 — THE FILL GAUGE. Every assertion below can fail; none is a
  // tautology. The real file on disk is used as the transcript fixture so the gauge is
  // exercised against a genuine stat() rather than a mock that can drift from it.
  const SELF = join(HERE, "teaching_contract.mjs");
  const selfBytes = statSync(SELF).size;
  const fHard = transcriptFill(SELF, Math.floor(selfBytes / 2));       // pct ≈ 2.0
  const fSoft = transcriptFill(SELF, Math.floor(selfBytes / 0.8));     // pct = 0.8
  const fQuiet = transcriptFill(SELF, selfBytes * 100);                // pct = 0.01
  const quietState = { ...base, turns: { anchor: "tx:/t.jsonl", anchor_kind: "tx", count: 1 } };
  const busyState = { ...base, turns: { anchor: "tx:/t.jsonl", anchor_kind: "tx", count: 60 } };

  assert("FILL GAUGE — reads a real file and reports bytes/limit/pct",
    fHard && fHard.bytes === selfBytes && fHard.pct > 1.9 && fHard.pct < 2.1);
  assert("FILL GAUGE — a missing path, a non-string and a directory all yield null, never a throw",
    transcriptFill(join(HERE, "__nope__.mjs")) === null && transcriptFill(null) === null
    && transcriptFill(123) === null && transcriptFill(HERE) === null);
  assert("HARD TIER — at/over the budget the warning names the TRANSCRIPT and still says TELL HIM NOW",
    blockLines(quietState, done, T0, fHard).some((l) => /CONTEXT WARNING/.test(l) && /transcript/.test(l) && /TELL HIM NOW/.test(l)));
  assert("SOFT TIER — past 60% he is warned BEFOREHAND, and it is NOT the loud line",
    (() => { const L = blockLines(quietState, done, T0, fSoft);
      return L.some((l) => /context filling/.test(l)) && !L.some((l) => /CONTEXT WARNING/.test(l)); })());
  assert("QUIET — well under the budget nothing fires at all (the 99% of sessions stay silent)",
    !blockLines(quietState, done, T0, fQuiet).some((l) => /CONTEXT WARNING|context filling/.test(l)));
  assert("THE POINT OF #107 — a 60-turn session with a SMALL transcript does NOT warn; fill beats the prompt counter",
    !blockLines(busyState, done, T0, fQuiet).some((l) => /CONTEXT WARNING|context filling/.test(l))
    && blockLines(busyState, done, T0, null).some((l) => /CONTEXT WARNING/.test(l)));
  assert("FALLBACK IS LABELLED — with no readable transcript the turn-count warning says it is a PROMPT count",
    blockLines(busyState, done, T0, null).some((l) => /PROMPT count, not a context measure/.test(l)));
  assert("HEADER — the fill percentage is visible whenever it is known, and absent when it is not",
    /context 80%/.test(blockLines(quietState, done, T0, fSoft)[0])
    && !/context \d+%/.test(blockLines(quietState, done, T0, null)[0]));
  assert("ANTI-WALL HOLDS WITH THE GAUGE ON — still never more than 5 lines, at every show_n and both tiers",
    (() => { let worst = 0;
      for (const f of [fHard, fSoft, fQuiet, null]) for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++)
        worst = Math.max(worst, blockLines({ ...base, show_n: n, turns: { anchor: "tx:/t", anchor_kind: "tx", count: t } }, done, T0, f).length);
      return worst <= MAX_BLOCK_LINES; })());

  // ---- audit #107 — THE ANCHOR. This is the measured defect, pinned.
  const TX = { tx: "/p/t.jsonl" };
  assert("ANCHOR — the transcript outranks the session id",
    resolveAnchor(null, { ...TX, cc: "S1" }).kind === "tx" && resolveAnchor(null, { ...TX, cc: "S1" }).id === "tx:/p/t.jsonl");
  assert("THE MEASURED DEFECT — a NEW session id on the SAME transcript no longer resets the clock",
    (() => { const a = bumpTurn(base, resolveAnchor(null, { ...TX, cc: "S1" }), T0);
      const b = bumpTurn(a, resolveAnchor(storedAnchorOf(a.turns), { ...TX, cc: "S2-forked" }), T0);
      return a.turns.count === 1 && b.turns.count === 2; })());
  assert("…and the FROZEN engine really did reset there (why this file now has two)",
    (() => { const a = bumpTurn(base, resolveAnchorLegacy(null, { cc: "S1" }), T0);
      const b = bumpTurn(a, resolveAnchorLegacy(storedAnchorOf(a.turns), { cc: "S2-forked" }), T0);
      return a.turns.count === 1 && b.turns.count === 1; })());
  assert("UNKNOWN NEVER RESETS — with nothing observable, a held transcript anchor is HELD, not demoted to forge",
    resolveAnchor("tx:/p/t.jsonl", { forge: "2026-08-02T09:04:09Z" }).id === "tx:/p/t.jsonl"
    && resolveAnchor("tx:/p/t.jsonl", { forge: "2026-08-02T09:04:09Z" }).kind === "tx_held");
  assert("FROZEN ENGINE — resolveAnchorLegacy has no concept of a transcript and still puts cc first",
    resolveAnchorLegacy(null, { tx: "/p/t.jsonl", cc: "S1" }).kind === "cc");
  assert("SEED — the fill budget lives in STATE so it is retunable without editing this file",
    seed(T0).transcript_warn_bytes === DEFAULT_TRANSCRIPT_WARN_BYTES);
  assert("BACKWARD-COMPATIBLE — pre-#107 state has no transcript_warn_bytes and falls back to the derived default",
    transcriptFill(SELF, undefined).limit === DEFAULT_TRANSCRIPT_WARN_BYTES);

  // ---- audit #40's numbers, computed here so the close report never has to guess
  assert("HIT STATS — total / ever-hit / newest are measured from the rules, and 'never hit' is null, never 0",
    hitStats(base.rules).ever_hit === 0 && hitStats(base.rules).newest_hit === null && hitStats(base.rules).total === 5
    && hitStats(hit.rules).ever_hit === 1 && hitStats(hit.rules).newest_hit === T0.toISOString());

  console.log(`\nteaching_contract selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const arg = process.argv[3];

switch (cmd) {
  case "print": {                               // HOOK PATH — never throws, never blocks
    // SELF-INJECTION GUARD — same scar as forge_session.mjs:808. Headless organs run
    // `claude -p` inside this repo; without this they would be handed (and would bump
    // the turn clock of) the captain's teaching contract.
    if (process.env.ARSENAL_ORGAN === "1") process.exit(0);
    try {
      const st = load();
      // PRECEDENCE, resolved once per turn: transcript > Claude Code session id >
      // a held session anchor > the forge session > unknown (held, never reset).
      const tx = hookTranscriptPath();
      const anchor = resolveAnchor(storedAnchorOf(st.turns), { tx, cc: hookSessionId(), forge: forgeStartedAt() });
      const s = bumpTurn(st, anchor);
      save(s);
      // The warning rides the FILL GAUGE, not the anchor — a fork resets the anchor
      // at exactly the moment the context is fullest (audit #107).
      const fill = transcriptFill(tx, st.transcript_warn_bytes);
      const lines = blockLines(s, doneConcepts(), new Date(), fill);
      if (lines.length) console.log(lines.join("\n"));
    } catch { /* silence is the contract */ }
    process.exit(0);
  }
  case "list": {
    const s = load();
    const t = s.turns || {};
    const hs = hitStats(s.rules);
    // HAVE/NEED, never a bare status word (audit #106) — and the drift recorder's
    // last run is printed next to the hit counts, because a hit count with no date
    // beside it reads as a live measurement when it is a two-day-old seeding burst.
    console.log(`teaching_contract · rules ${s.rules.length} · turn ${t.count || 0}/${s.context_warn_at || DEFAULT_WARN_AT}`
      + ` · clock anchor ${anchorKindOf(t)} ${storedAnchorOf(t) || "(none)"}`
      + ` · drift hits recorded ${hs.ever_hit}/${hs.total} rules, last ${hs.newest_hit ? hs.newest_hit.slice(0, 10) : "never"}`
      + ` (only \`teaching_contract.mjs hit <id>\` writes those — nothing in the machine calls it)`);
    for (const r of rank(s.rules)) console.log(`  ${r.id.padEnd(12)} hits=${String(r.hits).padStart(2)}  ${r.line}`);
    break;
  }
  case "add": {
    const line = process.argv.slice(4).join(" ");
    const res = addRule(load(), arg, line);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: added "${arg}" (${res.state.rules.length} rules)`);
    break;
  }
  case "hit": {
    const res = hitRule(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" now ${r.hits}× — it moves up the injection order`);
    break;
  }
  case "drop": {
    const res = dropRule(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: dropped "${arg}"`);
    break;
  }
  case "reset-turns": {
    // THE SESSION BOUNDARY (audit #38). Wire this into .claude/settings.json's
    // SessionStart hooks array and the clock is anchored to the Claude Code session
    // — the boundary that actually governs context. It mints a SESSION-CLASS anchor
    // (never a forge one), so the next `print` sees an unchanged anchor and lands on
    // turn 1, not turn 2. When SessionStart's payload is readable the anchor IS the
    // real session id; otherwise `local-<iso>` is unique per invocation, which is all
    // the reset needs. SessionStart also fires on resume/compact — resetting right
    // after a compaction is correct, the context was just freed.
    // Mint the STRONGEST anchor available, so the very next `print` sees an unchanged
    // anchor and lands on turn 1 rather than 2. Transcript first (it survives a plain
    // resume), then the session id, then a local mint — which is unique per invocation,
    // and uniqueness is all a reset needs.
    const tx = hookTranscriptPath();
    const cc = hookSessionId();
    const id = tx ? TX_PREFIX + tx : CC_PREFIX + (cc || `local-${new Date().toISOString()}`);
    save({ ...load(), turns: { anchor: id, anchor_kind: tx ? "tx" : "cc", count: 0, session_started_at: null, since: new Date().toISOString() } });
    // SILENT IN HOOK MODE. A SessionStart hook's stdout is injected as context, and
    // "turn clock reset" is bookkeeping, not orientation — the same law
    // hooks/afferent-post.mjs:12-13 states for its own hook. A human running this by
    // hand (TTY) still gets the confirmation, and the anchor is on disk either way.
    if (process.stdin.isTTY) {
      console.log(`teaching_contract: turn clock reset · anchor ${id}${(tx || cc) ? "" : " (no transcript_path or session_id on stdin — minted a local one)"}`);
    }
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log("teaching_contract: print | list | add <id> <line...> | hit <id> | drop <id> | reset-turns | selftest");
}
