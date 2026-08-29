#!/usr/bin/env node
// ---------------------------------------------------------------------------
// GAFFER_STATE — THE ROLLING STATE (B2) + THE STANDING INSTRUCTIONS (B8)
// ---------------------------------------------------------------------------
// SOLE WRITER of: dressing-room/state/gaffer_state.json      (rolling, per-sitting)
//                 dressing-room/state/gaffer_standing.json    (durable, survives all)
// Nothing else may write either file. Read them from anywhere.
//
// WHY THIS EXISTS — measured, from his own transcript of 12 Aug 2026
// (dressing-room/state/brain_out/dugout/2026-08-12.md, 93 CAPTAIN lines):
//   "Have you changed your key? Because you forgot what we were doing."
//   "you forgot completely what you were doing earlier"
//   "Oh my fucking god, you forgot that we were... telling me the structure"
//   "It was so frustrating you keep on forgetting every time."
//   "I am literally about to cry now because it's so frustrating"
// He said a variant of "you forgot" NINE times in one sitting. The Gaffer's
// memory is not breaking; its LIFE is. A tab opens, an instance is born, it
// talks, the tab closes, it dies — and a key rotation kills it mid-sentence.
//
// THE FAULT, EXACTLY (dugout.mjs). On quota, the page runs
//   reportFault(keyIdx) → nextKey() → dropResume('key rotation') → connect()
// and the fresh socket re-seeds from `CFG.rehydrate` — which was built ONCE, at
// PAGE LOAD, by buildConfig. Forty minutes into a sitting that snapshot is forty
// minutes stale, so the Gaffer wakes up believing the conversation is where it
// was when the tab opened. He diagnosed this himself before I found it.
//
// THE TWO LAWS THIS FILE OBEYS
//   · O(1) PER TURN. Never re-read the transcript. `observe` is handed the turn
//     DELTA the /transcript door already has in its hands, and touches only the
//     small state object. Cost is independent of how long he has been talking.
//   · SILENCE IS FREE (C3 principle 4). There is NO model call anywhere in the
//     per-turn path — every extraction here is deterministic pattern work. An
//     organ that spends tokens to conclude "nothing changed" is a defect.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? (the standing design question, D)
//   · dugout.mjs   — /rehydrate re-seeds a rotated session from it (B1); the
//                    opening briefing (B4) and the live injection channel read it
//   · the supervisor (B3) — its whole input is this state + the last turn
//   · learnstate.mjs brief / captains_call — a sitting left mid-plan is a real
//                    open loop and belongs at the next anchor
//   · scoreboard / bootroom — a sitting that drifted is evidence
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const STATE = join(STATE_DIR, "gaffer_state.json");
const STANDING = join(STATE_DIR, "gaffer_standing.json");
// THE FROZEN RECORD (overhaul 18 Aug 2026 §9.2): every standing row the word gate ever
// promoted, moved here by `standing purge` — appended, never overwritten. This organ
// is its sole writer too.
const LEGACY_STANDING = join(STATE_DIR, "gaffer_standing.legacy.json");

const readJson = (p, d = null) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const writeJson = (p, o) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(o, null, 2)); };
// purgeStanding — pure on the in-memory shapes (the CLI does the two writes). Returns
// the emptied live store, the legacy store to write, and the counts.
export function purgeStanding(standing, now = new Date(), legacy = readJson(LEGACY_STANDING, null)) {
  const live = standing || { instructions: [], _writer: "gaffer_state.mjs" };
  const rows = Array.isArray(live.instructions) ? live.instructions : [];
  const leg = legacy && typeof legacy === "object" ? JSON.parse(JSON.stringify(legacy)) : { _writer: "gaffer_state.mjs", _why: "FROZEN RECORD (overhaul 18 Aug 2026 §9.2): standing rows the word gate promoted before laws entered only by judgment. Appended by `gaffer_state.mjs standing purge`; never read as law.", purges: [] };
  leg.purges = Array.isArray(leg.purges) ? leg.purges : [];
  if (rows.length) leg.purges.push({ at: now.toISOString(), count: rows.length, instructions: rows });
  const out = { ...live, instructions: [], _purged: { at: now.toISOString(), count: rows.length, to: "gaffer_standing.legacy.json" } };
  return { standing: out, legacy: leg, moved: rows.length, legacy_total: leg.purges.reduce((a, p) => a + (p.count || 0), 0) };
}
// IST is his timeline — he put it in the ledger himself on 12 Aug ("I live in New
// Delhi so my time line is IST"). A sitting that crosses UTC midnight is still
// one evening to him.
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

// ===========================================================================
// ⚠ FROZEN 15 Aug 2026 — EVERYTHING FROM HERE TO `looksLikePlan` IS THE LEGACY
//   WORD-LIST ENGINE. It is kept verbatim (LAYERING law; precedents in this repo:
//   analyzeLegacy · identityCartridgeLegacy · capsuleProjectionLegacy · the
//   pendingFactsBlockLegacy door), it still runs, and it is the DEGRADED-MODE
//   FALLBACK — what answers when the free Gemini pool is dry. THE PLAN OF RECORD
//   IS scripts/gaffer_brain.mjs, THE WATCHER, which judges MEANING.
//
//   WHY IT WAS RETIRED, measured on live files the day it was frozen — it failed
//   in BOTH directions at once, from the same cause:
//     UNDER-FIRE  · his five CALM memory corrections on 15 Aug scored
//                   forgot_flags = 0, so the highest-priority intervention below
//                   never fired in the sitting it was built for.
//     OVER-FIRE   · gaffer_standing.json held 13 "standing instructions" and at
//                   least six were plain conversation ("So what are these papers
//                   actually?"), each passing via a DIRECTIVE marker plus the
//                   "don't" inside "I don't know" — and renderBrief injects the
//                   last twelve into his LIVE window every sitting.
//   Both are held as assertions in gaffer_brain.mjs's selftest, RUN rather than
//   restated, so this file's fault can never quietly stop being reproducible.
//
//   HIS RULING, 15 Aug 2026, is why the replacement is a model and not a bigger
//   list: "It should be agnostic. Session agnostic, vocab agnostic." No amount of
//   tuning a vocabulary fixes a gate that decides by vocabulary.
//
//   DO NOT EDIT THE PATTERNS BELOW. If the fallback is wrong, that is evidence
//   about the fallback; the fix belongs in the Watcher.
// ===========================================================================
// STANDING INSTRUCTIONS (B8) — what survives the session
// ---------------------------------------------------------------------------
// Today `set_depth` persists and an explicit "remember that…" persists (verified
// 12 Aug — all three facts he dictated to the Gaffer landed in the ledger).
// EVERYTHING ELSE DIES WITH THE SESSION: "dheere bolo", "ye mat karo", "pehle
// mujhse poocho". Those are the ones he had to repeat, and repeating himself is
// the thing he called frustrating.
//
// THE MARKERS ARE HIS OWN WORDS, taken from the transcript — not invented
// grammar. Each pattern below is followed by the line it was lifted from.
const PERMANENCE_LEGACY = [
  /\bhamesha\b/i,                    // "स्पीड हमेशा ही आपकी बोलने की धीरे होनी चाहिए"
  /हमेशा/,                            // same, in Devanagari — he switches script mid-sentence
  /\bpermanent(ly)?\b/i,             // "I want you to permanently remember this thing"
  /\balways\b/i,                     // "Every time you should use opus or sonnet"
  /\bevery ?time\b/i,
  /\bfrom now on(wards)?\b/i,        // "for all of the topics which we are going to cover from now onwards"
  /\bfor the rest of my life\b/i,    // "from the entire gapper from now onwards for the rest of my life"
  /\bnote (karo|kar lo|kar lena)\b/i,// "मेरे को हमेशा के लिए नोट करो"
  /\byaad rakh/i,
  /\bremember (this|that|it)\b/i,
  /के लिए नोट/,
  /\bnever\b/i,
  /\bkabhi (mat|nahi)\b/i,
];
// A prohibition is a standing instruction even without a permanence marker — he
// should not have to say "never do X, permanently". "mat karo" is enough.
const PROHIBITION_LEGACY = [/\bmat karo\b/i, /\bmat\b\s*\w+o\b/i, / मत /, /\bdo ?n[o']?t\b/i, /\bnahi chahiye\b/i, /\bnahi karna\b/i];

// The AXES a standing instruction can land on. Keeping them named (rather than
// storing free text alone) is what lets a LATER instruction on the same axis
// REPLACE an earlier one instead of piling up — he changes his mind out loud and
// a store that only ever appends would hand the Gaffer two contradictory laws.
const AXES_LEGACY = [
  { id: "pace",      test: /\b(dheere|dheere|slow|speed)\b|धीरे|स्पीड/i,                       label: "speaking pace" },
  { id: "intensity", test: /\bintensit|\bdepth\b|\bbreadth\b|\bbreath\b|इंटेंसिटी|डेप्थ/i,        label: "depth / intensity" },
  { id: "language",  test: /\b(hinglish|english|hindi|accent|british|bihari)\b|एक्सेंट|इंग्लिश/i, label: "language / accent" },
  { id: "verbatim",  test: /\bverbatim\b|word (by|to) word|वर्बेटिम|वर्ड बाय वर्ड/i,               label: "verbatim vs samjhao" },
  { id: "interact",  test: /\binteractiv|\bquestion|\bpoochh?o\b|इंटरेक्टिव/i,                    label: "interactivity" },
  { id: "brain",     test: /\buse brain\b|\bopus\b|\bsonnet\b|\bcall brain\b/i,                 label: "which brain to use" },
  { id: "map",       test: /\bstrategy\b|\bstructure\b|\bplan\b|स्ट्रेटजी|स्ट्रक्चर/i,             label: "declare the map first" },
];
const axisOf = (text) => (AXES_LEGACY.find(a => a.test.test(text)) || { id: "general", label: "general" });

// A DIRECTIVE marker — the line must actually TELL THE GAFFER to do something.
// MEASURED, not assumed (12 Aug 2026): permanence-or-prohibition ALONE was run over
// his real 228-line transcript and returned 10 laws, of which FOUR were noise —
//   "Ja, vor, ja, vor… we don't need to do it anymore."      (garbled, matched "don't")
//   "You got my point? … from now onwards for the rest of my life?"  (a question)
//   "It was so frustrating you keep on forgetting every time."       (a complaint)
//   "We never talked about 104 hallucination…"                       (matched "never")
// A 40% false-positive rate matters here in a way it would not in a log: this text
// is INJECTED into his live context window, so noise costs tokens AND dilutes the
// six real laws sitting beside it. Requiring a directive drops all four.
const DIRECTIVE_LEGACY = [
  /\bi want you to\b/i,                     // "I want you to permanently remember this thing"
  /\bnote (it down|karo|kar lo|kar lena)\b/i,// "I want you to note it down permanently"
  /नोट कर/, /\byaad rakh/i, /\bremember (this|that|it)\b/i,
  /\byou should\b/i, /\bevery ?time you\b/i, // "Every time you should use opus or sonnet"
  /\bkeep (the|your|it|yourself)\b/i,        // "keep the intensity as much as possible"
  /\bchahiye\b/i, /चाहिए/,                   // "स्पीड … धीरे होनी चाहिए"
  /\b(karo|karna|rakho|rakhna|bolo|bolna|batao|padho)\b/i,
  /रखना|रखो|करो|करना|बोलिए|बोलो|बताओ/,
  /\bmat\b/i, / मत /,                         // "Mere ko rejeera mat batao"
  /\bdo ?n[o']?t\b/i,
];
// …and lines that carry a marker but are plainly NOT laws. Each entry is here
// because it fired on a real line above, not because it might.
const NOT_A_LAW_LEGACY = [
  /\bwe do ?n[o']?t (need|have to)\b/i,   // "we don't need to do it anymore" — momentary, and "we", not "you"
  /\bit was\b/i,                          // "It was so frustrating…" — a report about the past
  /\byou keep on forgetting\b/i,
];

// isStanding — does this captain line create a law that must outlive the session?
export function isStandingLegacy(text) {
  const t = String(text || "").trim();
  if (t.length < 8) return false;                       // "Hello." is not a law
  if (/^(hello|haan|yes|ok|okay|no|nope)\b[.!? ]*$/i.test(t)) return false;
  if (NOT_A_LAW_LEGACY.some(r => r.test(t))) return false;
  if (!DIRECTIVE_LEGACY.some(r => r.test(t))) return false;    // it must TELL him something
  return PERMANENCE_LEGACY.some(r => r.test(t)) || PROHIBITION_LEGACY.some(r => r.test(t));
}

// A DECLARED PLAN is him naming the SHAPE of the sitting. B7 is the Gaffer owing
// him one; this is the machine noticing when one has been agreed, so a rotation
// cannot lose it. His, verbatim: "टोकेनाइजेशन से स्टार्ट करना ऑब्वियसली टोकेनाइजेशन
// देन एम्बेडिंग देन इन्फरेंस सैंपलिंग देन कॉन्टेक्स्ट विंडो।"
const PLAN_MARKERS_LEGACY = [/\bthen\b.*\bthen\b/i, /देन.*देन/, /\bphir\b.*\bphir\b/i, /→/, /\bstart karna\b/i, /\bstart (with|karenge)\b/i, /\bfirst\b.*\bthen\b/i];
export const looksLikePlan = (t) => PLAN_MARKERS_LEGACY.some(r => r.test(String(t || "")));
// ===========================================================================
// END OF THE FROZEN ENGINE. Everything below is live.
// ===========================================================================

// ---------------------------------------------------------------------------
// THE HAND-OFF FROM THE WATCHER (15 Aug 2026)
// ---------------------------------------------------------------------------
// This file may NOT import gaffer_brain.mjs, and that is not tidiness — it is a
// property its own selftest proves: this organ can reach neither the network nor
// a subprocess, so it can never cost a token or block a turn. The Watcher's
// verdict therefore arrives as a PLAIN OBJECT handed in by the caller (the
// /transcript door, which reads it off gaffer_brain.jsonl), and the direction of
// the dependency stays one-way.
//
// FRESHNESS IS CHECKED HERE, NOT TRUSTED FROM THE CALLER: a judgment about a turn
// two minutes ago lands on a different conversation and reads as a non-sequitur —
// the same 60s window every hint on the /deep poll obeys, and the same number.
export const JUDGMENT_FRESH_MS = 60000;
// The Watcher names a memory BLOCK for each standing instruction; this store has
// always named an AXIS. They are the same idea under two names, and the mapping is
// declared HERE — in the store that owns the axes — rather than in the Watcher,
// so that adding an axis is one edit in the file that defines what an axis is.
// `general` is the honest answer for the two blocks that are not about behaviour.
const BLOCK_AXIS = {
  how_to_speak: { id: "pace", label: "speaking pace" },
  what_not_to_do: { id: "prohibition", label: "a standing prohibition" },
  where_we_are: { id: "map", label: "declare the map first" },
  what_he_asked_for: { id: "general", label: "general" },
  about_him: { id: "general", label: "general" },
};
export function judgmentIsFresh(j, now = new Date()) {
  if (!j || typeof j !== "object") return false;
  const t = Date.parse(j.ts || j.at || "");
  if (!Number.isFinite(t)) return false;
  return (now.getTime() - t) >= 0 && (now.getTime() - t) <= JUDGMENT_FRESH_MS;
}

// isStanding — THE PLAN OF RECORD. When the Watcher has judged this turn, its
// judgment decides; otherwise the frozen word list answers, exactly as before.
// The signature is backward-compatible on purpose: every existing caller keeps
// working and simply gets the legacy behaviour until a judgment is passed.
export function isStanding(text, judgment = null, now = new Date()) {
  if (judgmentIsFresh(judgment, now) && Array.isArray(judgment.standing)) {
    const t = String(text || "").trim();
    // THE WATCHER'S LIST IS AUTHORITATIVE IN BOTH DIRECTIONS. A line it did not
    // name is NOT a law, even if the word list would have called it one — that is
    // the whole point: six of the thirteen "laws" in his live store were plain
    // conversation the word list waved through, and this is what stops the
    // fourteenth. Silence from a judging organ is a verdict, not an absence.
    return judgment.standing.some((s) => s && (s.quote === t || (s.quote && t.includes(s.quote)) || (s.text && t.includes(s.text))));
  }
  return isStandingLegacy(text);
}

// ---------------------------------------------------------------------------
// THE ROLLING STATE
// ---------------------------------------------------------------------------
export function emptyState(now = new Date()) {
  return {
    day: istDay(now), opened_at: now.toISOString(), last_turn_at: null,
    turns: 0, captain_turns: 0,
    declared_plan: null,        // { text, at } — the SHAPE he was promised (B7)
    where: null,                // the "you are here" marker
    covered: [],                // what this sitting has actually closed
    open_question: null,        // his last unanswered question
    last_captain_line: null,
    repeats: [],                // { text, count } — an idea he has raised more than once
    forgot_flags: 0,            // how many times he has had to say "you forgot"
    reseeds: 0,                 // how many times this sitting was re-seeded (rotation/reload)
    _writer: "gaffer_state.mjs",
  };
}

// HE SAID IT TWICE — the single strongest signal in the whole transcript. A2/A3:
// escalation rides HIS WORDS, not a score. Normalised hard so "what were we
// talking about?" and "Bhai, what were we talking about?" are the same idea.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-zऀ-ॿ ]+/g, " ").replace(/\s+/g, " ").trim();
const FORGOT_LEGACY = /\bforgot|\bforget|bhul (gaye|gaya)|भूल गए|\bdrifting\b|\byaad nahi\b|keep on forgetting/i;
const CONFUSED_LEGACY = /samajh nahi aaya|समझ नहीं आया|\bnot understanding\b|\bdidn.?t (get|understand)\b|\brepeat\b/i;

// observe — THE PER-TURN CALL. O(state), never O(transcript).
// `lines` is the delta the /transcript door already holds: ["CAPTAIN: …", "GAFFER: …"].
// B10 — SELF-SCORING. The organism measures HIM constantly and never measured
// ITSELF in conversation; without a score there is no "evolving according to me",
// which is exactly what he asked for and was told no. The score costs NOTHING to
// compute because B2 is already counting the two things that matter — how often he
// had to say "you forgot", and how often he had to repeat himself. Those are not
// proxies for a bad sitting; on 12 Aug they WERE the bad sitting.
export function scoreSitting(s) {
  if (!s || !s.captain_turns) return null;
  const repeats = (s.repeats || []).filter(r => r.count > 1).length;
  // per-100-turns, so a long sitting is not punished for being long
  const per100 = (n) => Math.round((n / s.captain_turns) * 1000) / 10;
  const worst = s.forgot_flags >= repeats
    ? (s.forgot_flags ? `he had to say "you forgot" ${s.forgot_flags}×` : null)
    : `he had to repeat himself on ${repeats} idea(s)`;
  return {
    day: s.day, captain_turns: s.captain_turns,
    forgot_flags: s.forgot_flags, repeated_ideas: repeats,
    forgot_per_100: per100(s.forgot_flags), repeat_per_100: per100(repeats),
    clean: s.forgot_flags === 0 && repeats === 0,
    worst_failure: worst,
  };
}

// observe — THE PER-TURN CALL. `judgment`, when a fresh one is handed in, decides
// which lines are standing instructions AND which axis each lands on; without it
// the frozen word list decides, exactly as before. Everything else in this
// function — the turn counters, the plan, the repeat detector, the day roll — is
// unchanged and still deterministic, because none of it was ever the fault.
export function observe(state, lines, now = new Date(), standing = null, judgment = null) {
  const fresh = judgmentIsFresh(judgment, now);
  const rolled = !!(state && state.day && state.day !== istDay(now));
  const s = state && state.day === istDay(now) ? { ...state } : emptyState(now);
  const st = standing || readJson(STANDING, { instructions: [], _writer: "gaffer_state.mjs" });
  // B10 — ON THE DAY ROLL, BANK THE SCORE RATHER THAN DISCARDING IT. A sitting
  // state that simply resets is how "a bad sitting changes the next one" stays
  // impossible: yesterday's evidence is gone before anyone can read it. The score
  // lives in the DURABLE file (gaffer_standing.json), because the whole point is
  // that it outlives the sitting it describes.
  if (rolled) {
    const sc = scoreSitting(state);
    if (sc) { st.last_sitting = sc; st.sitting_history = [...(st.sitting_history || []), sc].slice(-30); }
  }
  const newStanding = [];
  for (const raw of (lines || [])) {
    const line = String(raw || "");
    s.turns++;
    s.last_turn_at = now.toISOString();
    if (!/^CAPTAIN:/i.test(line)) continue;
    const text = line.replace(/^CAPTAIN:\s*/i, "").trim();
    if (!text) continue;
    s.captain_turns++;
    s.last_captain_line = text.slice(0, 400);
    // WHEN THE WATCHER HAS SPOKEN IT COUNTS THESE, because this is the exact
    // measurement that retired the word list: on 15 Aug his five CALM corrections
    // produced forgot_flags = 0, and every downstream reader — the brief, the
    // score, B10's "your last sitting was not clean" line — believed the sitting
    // had gone fine. A `correction` is counted here too: for this counter's
    // purpose ("how many times did he have to tell you that you lost something")
    // a calm correction and an angry one are the same event, which is the whole
    // finding.
    const sig = fresh ? (judgment.signals || []).map((x) => x && x.kind) : [];
    if (fresh ? (sig.includes("forgot") || sig.includes("correction")) : FORGOT_LEGACY.test(text)) s.forgot_flags++;
    // the turn it was raised on is recorded WITH it — B3 needs to fire its
    // "you moved on" note ONCE, on the next turn, not forever after. Measured:
    // without this stamp the supervisor fired on 86% of his real sitting, because
    // an open question that is never cleared re-triggers on every later turn.
    if (fresh ? sig.includes("unresolved") : CONFUSED_LEGACY.test(text)) s.open_question = text.slice(0, 300), s.open_question_turn = s.turns;
    if (looksLikePlan(text) && text.length > 25) s.declared_plan = { text: text.slice(0, 600), at: now.toISOString() };
    // repeats — the second time an idea appears, it is a FLAG, not a coincidence
    const k = norm(text).split(" ").slice(0, 12).join(" ");
    if (k.length > 12) {
      const hit = s.repeats.find(r => r.key === k);
      if (hit) { hit.count++; hit.last_at = now.toISOString(); }
      else s.repeats.push({ key: k, text: text.slice(0, 200), count: 1, last_at: now.toISOString() });
    }
    // A LAW ENTERS ONLY BY JUDGMENT (ORGANISM_OVERHAUL 18 Aug 2026 §9.2 — his R5).
    // Until today this read `isStanding(text, judgment, now)`, whose ELSE branch is
    // the frozen word list — so whenever the Watcher's verdict was stale or absent
    // (the common case: it runs DETACHED after the turn, so on the very turn a line
    // arrives there is never a fresh judgment for it), a vocabulary match promoted
    // the line to permanent law. Measured on the live store the day this landed:
    // 14 rows, 13 stamped by no judge, six of them plain conversation ("So what are
    // these papers actually?", "I don't want to know it right now") — injected into
    // BOTH mouths as standing law every sitting. The word list stays FROZEN in this
    // file (isStandingLegacy: exported, selftested, the layering law) — it no longer
    // makes law. What the Watcher judges as standing lands in gaffer_blocks.json
    // (its own store) and reaches the constitution through renderBlocks; the
    // sitting review (overhaul §8, Block 4) is the second and last door.
    if (fresh && isStanding(text, judgment, now)) {
      // THE AXIS COMES FROM THE WATCHER TOO when it judged this line: it returns
      // which memory BLOCK the instruction belongs in, and the block names map
      // one-to-one onto the axes this store already had. Falling back to the word
      // list's axisOf() here would put a meaning-judged instruction on a
      // vocabulary-guessed axis, and the axis is what decides which EARLIER law it
      // replaces — a wrong axis silently keeps two contradictory laws alive.
      const named = fresh ? (judgment.standing || []).find((x) => x && ((x.quote && text.includes(x.quote)) || (x.text && text.includes(x.text)))) : null;
      const ax = (named && BLOCK_AXIS[named.block]) || axisOf(text);
      const rec = { axis: ax.id, label: ax.label, text: (named && named.text ? named.text : text).slice(0, 400), at: now.toISOString(), day: istDay(now), by: fresh ? "watcher" : "legacy" };
      // LATER WINS ON THE SAME AXIS (see AXES above) — but a general instruction
      // never silently swallows another general one; those accumulate.
      if (ax.id !== "general") st.instructions = st.instructions.filter(i => i.axis !== ax.id);
      st.instructions.push(rec);
      newStanding.push(rec);
    }
  }
  // keep the repeat list bounded — a sitting is a few hundred turns, not a database
  // law-waiver:trailing-n a WRITE-SIDE CAP, not a read. This keeps the NEWEST 200 and
  // discards the older ones, which is the opposite of §9 SHAPE 4 (treating an old window
  // as current). Nothing downstream reads this slice as "recent"; it is the trim that
  // stops one sitting's repeat list from growing without bound.
  if (s.repeats.length > 200) s.repeats = s.repeats.slice(-200);
  return { state: s, standing: st, newStanding };
}

// ===========================================================================
// B3 — THE SUPERVISOR: A SECOND PAIR OF EARS, NOT A DEEP THINKER
// ===========================================================================
// His complaints on 12 Aug were about ATTENTION, not depth:
//   "you forgot what we were doing" · "did you forget the intensity thing?"
//   "why are you talking to me in a different accent all of a sudden?"
//   — and saying "samajh nahi aaya" and being walked past.
// None of that needs a smarter model. It needs SOMETHING WATCHING.
//
// THE ARCHITECTURE SAID FLASH; THE MEASUREMENT SAYS NOTHING AT ALL.
// The worklist's A2 cascade puts the watching on free Gemini Flash. Built that
// way it would cost a tank, add a round-trip to every turn, and — the part that
// matters — it could still MISS, because a model asked "did he repeat himself?"
// is guessing at something the rolling state already KNOWS. Every one of the
// three notes A2 asks for is deterministic:
//   "he asked this twice"        → B2's repeat counter
//   "he said samajh nahi aaya"   → B2's open_question
//   "you have gone soft"         → B8's standing instructions vs the last turns
// So this tier is FREE, INSTANT, and cannot hallucinate a drift that did not
// happen. Flash stays available for the judgement calls that are genuinely
// semantic; it is not needed to notice that a man said the same thing twice.
//
// TWO LAWS, both of which are about him rather than about cost:
//   · ONE NOTE PER TURN, EVER. A stack of corrections injected mid-sitting is
//     the quiz-dump failure wearing a new coat. Highest priority wins, the rest
//     wait for their own turn.
//   · SILENCE IS THE DEFAULT. Most turns produce nothing. A supervisor that
//     always has something to say is noise, and noise is what he already gets.

// THE MONOLOGUE THRESHOLD — DERIVED FROM HIS OWN LAW, NOT CHOSEN.
// The SAMJHAO rules already say: "If you would need more than about forty
// seconds to say it, it is two turns, not one." Conversational speech runs
// ~150 words/minute, so forty seconds is ~100 words. That is the whole
// derivation; no threshold is invented here.
// MEASURED against his real 12 Aug sitting: 13 of 133 Gaffer turns (10%) broke
// it, and the longest ran 254 words = 102 SECONDS of continuous speech. That is
// the turn behind "you are speaking so fastly... Feels like you are talking to
// yourself." A 10% alarm rate is the right shape — it fires on the real ones and
// stays quiet on the other 120.
export const MONOLOGUE_WORDS = 100;
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;

// supervise — the whole watcher. PURE: state in, at most one note out.
// `lines` is the same turn delta the /transcript door already holds, so this
// costs one pass over two or three strings.
// `brainNote` — THE WATCHER'S NOTE, when there is a fresh one. It WINS, whole:
// this function does not merge it with a word-list note, does not second-guess it,
// and does not add a second note beside it, because ONE NOTE PER TURN is the law
// that survives the change of engine. When there is no fresh note the frozen
// detectors below run exactly as they always did — that is the degraded mode, and
// it is the only reason they are still in the file.
export function supervise(state, standing, lines = [], now = new Date(), brainNote = null) {
  if (judgmentIsFresh(brainNote, now) && brainNote.note) {
    return { kind: brainNote.kind, priority: brainNote.priority || 100, note: brainNote.note, id: brainNote.id, by: "watcher" };
  }
  const s = state || emptyState(now);
  const st = standing || { instructions: [] };
  const cap = [], gaf = [];
  for (const raw of lines) {
    const l = String(raw || "");
    if (/^CAPTAIN:/i.test(l)) cap.push(l.replace(/^CAPTAIN:\s*/i, "").trim());
    else if (/^GAFFER:/i.test(l)) gaf.push(l.replace(/^GAFFER(\([a-z]+\))?:\s*/i, "").trim());
  }
  const mk = (kind, priority, note) => ({ kind, priority, note, id: `${kind}:${s.turns}` });
  const found = [];

  // 1 — HE SAID YOU FORGOT. The loudest signal there is; nothing outranks it.
  if (cap.some(t => FORGOT_LEGACY.test(t))) {
    found.push(mk("forgot", 100,
      `[HE JUST TOLD YOU THAT YOU FORGOT — that is the ${s.forgot_flags || 1}${(s.forgot_flags || 1) === 1 ? "st" : "th"} time today. Do NOT apologise and do NOT guess. Say plainly that you are checking, then USE A TOOL to find it. What the state says you were doing: ${s.declared_plan ? s.declared_plan.text.slice(0, 200) : "no agreed plan recorded — say so honestly rather than inventing one"}]`));
  }

  // 2 — HE SAID SAMAJH NAHI AAYA AND YOU MOVED ON. Canon's own law is that this
  // is taken literally: stop, restart from zero. Being walked past is the single
  // failure that ends a sitting.
  // FIRES ONCE, ON THE NEXT TURN — not forever after. An open question that is
  // never cleared re-triggers on every later turn; measured against his real
  // sitting that was 93 notes across 123 turns, i.e. the supervisor becoming the
  // noise it exists to remove. If he is STILL lost he says so again, and the
  // repeat detector below is what catches that. The window is one turn-pair
  // (a CAPTAIN line and the GAFFER line answering it), not a tuned number.
  const justMovedOn = s.open_question && typeof s.open_question_turn === "number" && (s.turns - s.open_question_turn) <= 2;
  if (justMovedOn && gaf.length && !cap.some(t => CONFUSED_LEGACY.test(t))) {
    found.push(mk("unresolved", 90,
      `[HE SAID HE DID NOT UNDERSTAND AND YOU MOVED ON. Go back to it NOW, smaller, from zero — do not re-say it in the same words. His words were: "${String(s.open_question).slice(0, 180)}"]`));
  }

  // 3 — HE HAS SAID THIS BEFORE. The second time is the signal (A3: escalation
  // by his WORDS, never by a score), and it means the first answer did not land.
  {
    const rep = (s.repeats || []).filter(r => r.count > 1).sort((a, b) => b.count - a.count)[0];
    if (rep && cap.length && norm(cap[cap.length - 1]).startsWith(rep.key.slice(0, 20))) {
      found.push(mk("repeat", 80,
        `[HE HAS ASKED THIS ${rep.count}× NOW — the earlier answer did not land. Do NOT repeat it in the same shape. Change the approach: smaller, or a different everyday analogy, or ask him which part broke.]`));
    }
  }

  // 4 — YOU ARE MONOLOGUING. His #1 complaint, and the one thing here that is
  // about YOUR turn rather than his.
  {
    const longest = gaf.map(words).sort((a, b) => b - a)[0] || 0;
    if (longest > MONOLOGUE_WORDS) {
      found.push(mk("monologue", 70,
        `[THAT TURN RAN ~${Math.round(longest / 150 * 60)} SECONDS OF CONTINUOUS SPEECH (${longest} words). His law is forty seconds — past that it is two turns, not one. Stop, hand him the turn, wait for his word. DHEEMA IS NOT CHHOTA: keep the depth, cut the speed.]`));
    }
  }

  // 5 — A STANDING INSTRUCTION IS BEING IGNORED. B8 holds what he said out loud;
  // this is the only thing that makes those instructions cost anything to break.
  {
    const pace = (st.instructions || []).find(i => i.axis === "pace");
    if (pace && found.some(f => f.kind === "monologue")) {
      found.push(mk("standing", 60,
        `[AND HE ALREADY TOLD YOU THIS OUT LOUD: "${String(pace.text).slice(0, 160)}" — he should not have to say it again.]`));
    }
  }

  if (!found.length) return null;                       // SILENCE IS THE DEFAULT
  found.sort((a, b) => b.priority - a.priority);
  return found[0];                                      // ONE NOTE PER TURN, EVER
}

// brief — the state rendered for a MACHINE mouth. This is what a rotated session
// is re-seeded with (B1) and what the supervisor (B3) reads. Deliberately terse:
// it rides INTO a live context window, so every line must earn its tokens.
export function renderBrief(state, standing, { forRotation = false } = {}) {
  const s = state || emptyState();
  const st = standing || { instructions: [] };
  const L = [];
  L.push(forRotation
    ? "[CONTINUITY — the line dropped and reconnected. You did NOT lose the conversation. Do NOT recap, do NOT greet, do NOT ask where you were. Carry on from exactly here:]"
    : "[SITTING STATE]");
  if (s.declared_plan) L.push(`AGREED PLAN (you promised him this shape): ${s.declared_plan.text}`);
  if (s.where) L.push(`YOU ARE HERE: ${s.where}`);
  if (s.covered && s.covered.length) L.push(`ALREADY COVERED this sitting (do NOT redo): ${s.covered.join(" · ")}`);
  if (s.open_question) L.push(`HIS LAST UNRESOLVED POINT — go back to it: ${s.open_question}`);
  if (s.last_captain_line) L.push(`HIS LAST WORDS: ${s.last_captain_line}`);
  const rep = (s.repeats || []).filter(r => r.count > 1).sort((a, b) => b.count - a.count).slice(0, 3);
  if (rep.length) L.push(`HE HAS SAID THESE MORE THAN ONCE (the first answer did not land): ${rep.map(r => `"${r.text}" ×${r.count}`).join(" · ")}`);
  if (st.instructions && st.instructions.length) {
    L.push("STANDING INSTRUCTIONS — he gave these out loud and they do NOT expire:");
    // law-waiver:trailing-n STANDING INSTRUCTIONS DO NOT EXPIRE — the line three above
    // says so in his own frame ("he gave these out loud and they do NOT expire"). Age is
    // deliberately not a gate here; the 12 is a PROMPT-BUDGET cap on how many fit in the
    // head, not a window of now. Gating these by recency would silently drop a standing
    // instruction he never withdrew — the one thing this block exists to prevent.
    for (const i of st.instructions.slice(-12)) L.push(`  · [${i.label}] ${i.text}`);
  }
  if (s.forgot_flags > 0) L.push(`⚠ He has had to tell you "you forgot" ${s.forgot_flags}× today. Do not make it ${s.forgot_flags + 1}.`);
  // B10 — YOUR OWN LAST SITTING, scored. This is the whole "evolving according to
  // me" wire: he says nothing, and the next sitting still starts knowing how the
  // last one went. Only shown when the last one was NOT clean — a scoreboard that
  // reports a good day every day teaches nothing and costs tokens forever.
  if (st.last_sitting && !st.last_sitting.clean) {
    const ls = st.last_sitting;
    L.push(`YOUR LAST SITTING (${ls.day}) WAS SCORED AND IT WAS NOT CLEAN: ${ls.worst_failure} across ${ls.captain_turns} of his turns. He did not report this — the machine measured it. Fix THAT today; do not apologise for it.`);
  }
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function load() { return { state: readJson(STATE, null), standing: readJson(STANDING, { instructions: [], _writer: "gaffer_state.mjs" }) }; }
function save(state, standing) { writeJson(STATE, state); if (standing) writeJson(STANDING, standing); }
// THE OWNER'S TURN DOOR (overhaul Block 1, 18 Aug 2026; xray Q2/Q5). The Dugout's
// /transcript route used to call observe() and then writeFileSync the two files
// itself — a second writer of gaffer_state.json and gaffer_standing.json, named a law
// breach nightly. Now the bridge hands the delta HERE and this organ does the two
// writes it declares itself sole writer of. Same reads, same observe(), same write
// shape (the standing file only when a law entered), one owner. Returns observe()'s
// result so the caller's supervisor step is unchanged.
export function observeAndSave(lines, now = new Date(), judgment = null) {
  const prev = readJson(STATE, null);
  const stand = readJson(STANDING, { instructions: [], _writer: "gaffer_state.mjs" });
  const r = observe(prev, lines, now, stand, judgment);
  writeJson(STATE, r.state);
  if (r.newStanding.length) writeJson(STANDING, r.standing);
  return r;
}

async function main() {
  const cmd = (process.argv[2] || "brief").toLowerCase();
  const { state, standing } = load();

  if (cmd === "observe") {
    // lines arrive on argv or stdin — the bridge calls the in-process export, not this
    const lines = process.argv.slice(3);
    const r = observe(state, lines, new Date(), standing);
    save(r.state, r.standing);
    console.log(`gaffer_state: ${r.state.turns} turns · ${r.state.captain_turns} his · plan ${r.state.declared_plan ? "SET" : "none"} · standing ${r.standing.instructions.length}${r.newStanding.length ? ` (+${r.newStanding.length} new: ${r.newStanding.map(i => i.label).join(", ")})` : ""}`);
    return;
  }
  if (cmd === "brief") { console.log(renderBrief(state, standing, { forRotation: process.argv.includes("--rotation") })); return; }
  if (cmd === "where") {
    const where = process.argv.slice(3).join(" ");
    const s = state || emptyState();
    if (!where) { console.log(s.where || "(no marker set)"); return; }
    s.where = where.slice(0, 300);
    if (!s.covered.includes(where)) s.covered.push(where.slice(0, 120));
    save(s, standing); console.log(`gaffer_state: you-are-here → ${s.where}`); return;
  }
  if (cmd === "reseed") { const s = state || emptyState(); s.reseeds++; save(s, standing); console.log(`gaffer_state: reseed #${s.reseeds} recorded`); return; }
  if (cmd === "standing" && (process.argv[3] || "").toLowerCase() === "add") {
    // THE ACT LANE'S PREF DOOR (MODELS + ACTS Block 2, 18 Aug 2026 — LAW A): his explicit standing
    // preference ("Hinglish bolo", "greeting pehle") lands as a standing row through the OWNER, by
    // `acts.mjs` (verb pref) — the word gate that used to mint these was purged (§9.2); this row is
    // by:"captain" (his word, in the same turn, with a receipt), never a keyword's guess. Same
    // shape observe() writes; `forget <axis>` is its declared reverse.
    const flag = (n) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : undefined; };
    const axis = String(flag("axis") || "how_to_speak").slice(0, 40), text = String(flag("text") || "").trim().slice(0, 400);
    if (!text) { console.error("usage: gaffer_state.mjs standing add --axis <axis> --text \"…\""); process.exit(1); }
    const st = standing || { instructions: [], _writer: "gaffer_state.mjs" };
    const now = new Date();
    st.instructions = st.instructions.filter((i) => !(i.axis === axis && i.by === "captain" && i.text === text));   // idempotent on the same word
    st.instructions.push({ axis, label: axis, text, at: now.toISOString(), day: istDay(now), by: "captain" });
    save(state || emptyState(), st);
    console.log(`gaffer_state: standing add [${axis}] by captain — ${text.slice(0, 120)} (${st.instructions.length} standing row(s))`); return;
  }
  if (cmd === "standing") {
    // THE PURGE (overhaul 18 Aug 2026 §9.2, Block 0). `standing purge` moves EVERY row to
    // gaffer_standing.legacy.json — appended, never overwritten: the layering law, and
    // the record of what the word gate was injecting into his ear as law. The live file
    // keeps its shape (instructions: []) so every reader (renderBrief, supervise, the
    // Dugout's constitution) keeps working; a `_purged` stamp names when and where.
    if ((process.argv[3] || "").toLowerCase() === "purge") {
      const r = purgeStanding(standing, new Date());
      writeJson(LEGACY_STANDING, r.legacy);   // the frozen record FIRST — a crash between the two writes must never lose a row
      save(state || emptyState(), r.standing);
      console.log(`gaffer_state: standing PURGED — ${r.moved} row(s) → ${LEGACY_STANDING} (frozen record; ${r.legacy_total} row(s) there now). Live file holds 0 laws; new ones enter ONLY by the Watcher's judgment or the sitting review — never by the word list.`);
      return;
    }
    if (!standing.instructions.length) { console.log(`gaffer_state: no standing instructions${standing._purged ? ` — purged ${standing._purged.at} (${standing._purged.count} row(s) → gaffer_standing.legacy.json)` : " yet — he has not given one out loud since this store was built."}`); return; }
    for (const i of standing.instructions) console.log(`  [${i.axis}] ${i.day} — ${i.text}`);
    return;
  }
  if (cmd === "forget") {
    const axis = process.argv[3];
    if (!axis) { console.error("usage: gaffer_state.mjs forget <axis>"); process.exit(1); }
    const before = standing.instructions.length;
    standing.instructions = standing.instructions.filter(i => i.axis !== axis);
    save(state || emptyState(), standing);
    console.log(`gaffer_state: dropped ${before - standing.instructions.length} standing instruction(s) on axis "${axis}"`); return;
  }
  if (cmd === "selftest") return selftest();
  console.error("usage: gaffer_state.mjs [observe <lines…>|brief [--rotation]|where <text>|reseed|standing|forget <axis>|selftest]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SELFTEST — in the SAME commit as the organ (C3 principle 7). Zero live calls.
// Every fixture below is a REAL line from his 12 Aug transcript.
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } };
  const T0 = new Date("2026-08-12T06:30:00.000Z");

  // --- standing detection, on his own words
  assert("HIS WORDS — 'हमेशा' makes a line standing (speed, said 4× because it never stuck)",
    isStanding("भाई स्पीड हमेशा ही आपकी बोलने की धीरे होनी चाहिए। हर चीज में जब समझाओ चले"));
  assert("HIS WORDS — 'permanently remember this thing' is standing",
    isStanding("I want you to permanently remember this thing. I am not preparing for this field to compete in the market."));
  assert("HIS WORDS — 'मेरे को हमेशा के लिए नोट करो' is standing",
    isStanding("हां, ठीक है। मेरे को हमेशा के लिए नोट करो। ब्रेन में जाना चाहिए दैट अ रिवीजन में भी इंटेंसिटी शुड बी हाई।"));
  assert("a bare greeting is NOT a law", !isStanding("Hello.") && !isStanding("Hello hello.") && !isStanding("haan"));
  assert("a one-off question is NOT a law", !isStanding("So what time is it right now?"));

  // THE FOUR FALSE POSITIVES, held by source. Permanence-or-prohibition alone
  // returned 10 laws over his real 228-line transcript and FOUR were noise. This
  // text is injected into his live window, so each one cost tokens and diluted the
  // six real laws beside it. Any loosening of DIRECTIVE/NOT_A_LAW brings them back.
  assert("NOISE — garbled audio carrying a stray 'don't' is not a law",
    !isStanding("Ja, vor, ja, vor, ja, vor, ja, vor. Äh, we don't need to do it anymore."));
  assert("NOISE — a QUESTION carrying 'from now onwards' is not a law",
    !isStanding("You You got my point? Like what what is my aim from the entire organism and from the entire gapper from now onwards for the rest of my life?"));
  assert("NOISE — a complaint about the past carrying 'every time' is not a law",
    !isStanding("It was so frustrating you keep on forgetting every time."));
  assert("NOISE — 'we never talked about X' is a correction, not a standing law",
    !isStanding("We never talked about 104 hallucination. What were we talking about? Go and find it out."));
  // …and the six REAL ones still stand, so the tightening was precision, not recall loss.
  assert("KEPT — 'Every time you should use opus or sonnet' survives the tightening",
    isStanding("By go into the brain and find out everything. Go into the brain use opus now. Every time you should use opus or sonnet. Do not rely on your semantic things it's pathetic."));
  assert("KEPT — 'mat batao' (a Hinglish prohibition) survives",
    isStanding("Mere ko rejeera mat batao. I am saying the your strategy for revising all of the topics"));

  // --- the axis rule: later wins, so two contradictory laws can never both stand
  // (18 Aug 2026, overhaul §9.2: a law enters ONLY by a fresh Watcher judgment, so
  // the fixture hands one in — the same lines, now JUDGED standing. Without it,
  // nothing is promoted; that is the second assertion, and it is the whole repair.)
  {
    const J = (quote, block) => ({ ts: T0.toISOString(), signals: [], standing: [{ quote, block, text: quote }] });
    let { state, standing } = observe(emptyState(T0), ["CAPTAIN: धीरे बोलो भाई, स्पीड हमेशा धीरे रखो"], T0, { instructions: [] }, J("धीरे बोलो भाई, स्पीड हमेशा धीरे रखो", "how_to_speak"));
    ({ state, standing } = observe(state, ["CAPTAIN: ab thoda normal speed pe bolo, hamesha"], T0, standing, J("ab thoda normal speed pe bolo, hamesha", "how_to_speak")));
    const paceLaws = standing.instructions.filter(i => i.axis === "pace");
    assert("LATER WINS on one axis — he changes his mind out loud and the store never holds two contradictory laws", paceLaws.length === 1 && /normal speed/.test(paceLaws[0].text) && paceLaws[0].by === "watcher");
    // THE REPAIR ITSELF: the identical line, no fresh judgment ⇒ NOT law. The word list
    // still RECOGNISES it (isStandingLegacy stays green above); it no longer promotes.
    const unjudged = observe(emptyState(T0), ["CAPTAIN: धीरे बोलो भाई, स्पीड हमेशा धीरे रखो"], T0, { instructions: [] });
    const staleJ = observe(emptyState(T0), ["CAPTAIN: धीरे बोलो भाई, स्पीड हमेशा धीरे रखो"], T0, { instructions: [] }, { ts: new Date(T0.getTime() - 3600000 * 24).toISOString(), signals: [], standing: [{ quote: "धीरे बोलो भाई", block: "how_to_speak" }] });
    assert("§9.2 — the SAME line with NO fresh judgment promotes NOTHING (the word gate is frozen; 13 of the live store's 14 rows entered this way, six of them plain conversation)",
      unjudged.standing.instructions.length === 0 && unjudged.newStanding.length === 0 && isStandingLegacy("धीरे बोलो भाई, स्पीड हमेशा धीरे रखो")
      && staleJ.standing.instructions.length === 0);
    // the purge — pure, appended, never overwritten
    const live = { instructions: [{ axis: "general", text: "So what are these papers actually?", day: "2026-08-13" }, { axis: "pace", text: "dheere", day: "2026-08-15" }], _writer: "gaffer_state.mjs" };
    const p1 = purgeStanding(live, T0, null);
    const p2 = purgeStanding({ instructions: [{ axis: "brain", text: "use opus", day: "2026-08-16" }] }, T0, p1.legacy);
    assert("PURGE — every live row moves to the legacy record (appended per purge, never overwritten), the live file is emptied but keeps its shape and a _purged stamp",
      p1.moved === 2 && p1.standing.instructions.length === 0 && p1.standing._writer === "gaffer_state.mjs" && p1.standing._purged.count === 2
      && p1.legacy.purges.length === 1 && p1.legacy.purges[0].instructions[0].text === "So what are these papers actually?"
      && p2.legacy.purges.length === 2 && p2.legacy_total === 3);
    assert("PURGE — an already-empty store purges to zero moved and adds no empty purge record",
      purgeStanding({ instructions: [] }, T0, p2.legacy).moved === 0 && purgeStanding({ instructions: [] }, T0, p2.legacy).legacy.purges.length === 2);
    assert("PURGE — renderBrief on the purged store injects NO 'STANDING INSTRUCTIONS' block (the junk stops reaching his ear)",
      !renderBrief(emptyState(T0), p1.standing).includes("STANDING INSTRUCTIONS"));
  }

  // --- the plan survives, which is the whole of B1
  {
    const plan = "CAPTAIN: टोकेनाइजेशन से स्टार्ट करना ऑब्वियसली टोकेनाइजेशन देन एम्बेडिंग देन इन्फरेंस सैंपलिंग देन कॉन्टेक्स्ट विंडो।";
    const { state, standing } = observe(emptyState(T0), [plan], T0, { instructions: [] });
    assert("A DECLARED PLAN IS CAPTURED — the exact line he had to repeat three times", !!state.declared_plan && /टोकेनाइजेशन/.test(state.declared_plan.text));
    const brief = renderBrief(state, standing, { forRotation: true });
    assert("B1 — the rotation brief carries the plan and forbids a recap", brief.includes("AGREED PLAN") && brief.includes("Do NOT recap") && /टोकेनाइजेशन/.test(brief));
  }

  // --- "you forgot" is counted, because he said it nine times in one sitting
  {
    const lines = ["CAPTAIN: Have you changed your key? Because you forgot what we were doing.",
                   "CAPTAIN: are you drifting? because you forgot completely what you were doing earlier.",
                   "CAPTAIN: It was so frustrating you keep on forgetting every time."];
    const { state } = observe(emptyState(T0), lines, T0, { instructions: [] });
    assert("HE SAID 'YOU FORGOT' — every instance is counted, not just noticed", state.forgot_flags === 3);
    assert("the brief SAYS the count back, so the next turn knows the cost of a fourth", renderBrief(state, null).includes("3×"));
  }

  // --- A3: escalation by HIS WORDS. The second time is the signal.
  {
    const l = "CAPTAIN: Bhai, what were we talking about? Do you have that in mind?";
    let r = observe(emptyState(T0), [l], T0, { instructions: [] });
    r = observe(r.state, [l], T0, r.standing);
    const rep = r.state.repeats.find(x => x.count > 1);
    assert("A3 — a REPEATED idea is flagged the second time, deterministically (never a score)", !!rep && rep.count === 2);
    assert("and the brief names it as 'the first answer did not land'", renderBrief(r.state, null).includes("MORE THAN ONCE"));
  }

  // --- "samajh nahi aaya" must never be walked past
  {
    const { state } = observe(emptyState(T0), ["CAPTAIN: bhai samajh nahi aaya, phir se batao"], T0, { instructions: [] });
    assert("B3 — 'samajh nahi aaya' becomes the OPEN point, so the next turn goes back to it", !!state.open_question);
  }

  // --- the two hard laws of this file
  {
    const big = Array.from({ length: 500 }, (_, i) => `CAPTAIN: line number ${i} of a very long sitting indeed`);
    const t0 = process.hrtime.bigint();
    const { state } = observe(emptyState(T0), big, T0, { instructions: [] });
    const t1 = process.hrtime.bigint();
    assert("O(1)-PER-TURN — 500 turns of state work stays trivial (never re-reads a transcript)", Number(t1 - t0) / 1e6 < 250 && state.repeats.length <= 200);
    // SILENCE IS FREE, held STRUCTURALLY. A text search for "claude -p" fails here
    // for a funny reason — the search string is itself in the file, so the assertion
    // matches its own source and can never go green. The real property is narrower
    // and stronger anyway: this organ cannot reach a model because it cannot reach
    // the network or a subprocess. The needles are built by concatenation so this
    // check does not trip over its own text the same way.
    const src = readFileSync(new URL(import.meta.url), "utf8");
    const imports = src.split(/\r?\n/).filter(l => /^import /.test(l)).join(" ");
    const forbidden = ["child" + "_process", "node:" + "http", "claude" + "gen.mjs", "brain" + ".mjs"];
    assert("SILENCE IS FREE — no model call is even REACHABLE: no subprocess, no network, no brain import",
      forbidden.every(n => !imports.includes(n)) && !src.includes("fetch" + "("));
    // …AND NOT THE WATCHER EITHER (15 Aug 2026). The judgment arrives as a plain
    // object handed in by the caller, precisely so this stays provable: importing
    // an organ that talks to a model would put a network call one hop away and the
    // assertion above would be true while the property was gone. Checked against
    // the IMPORT LINES, never the whole file — this file NAMES the Watcher in prose
    // a dozen times now, and a whole-file substring search reports its own
    // documentation as a violation. (It did, on the first run of this assertion.)
    assert("SILENCE IS FREE — …and the WATCHER is not imported either: its verdict arrives as a plain object, so the one-way dependency is a fact about the code and not a convention",
      !imports.includes("gaffer_" + "brain.mjs"));
  }

  // --- B3 · THE SUPERVISOR — a second pair of ears. Every fixture is a REAL line.
  {
    const S = (st, lines, stand) => supervise(st, stand || { instructions: [] }, lines, T0);
    // 1 — the loudest signal there is
    const withPlan = { ...emptyState(T0), forgot_flags: 3, declared_plan: { text: "tokenization → embeddings → inference → context window", at: "x" } };
    const f = S(withPlan, ["CAPTAIN: Have you changed your key? Because you forgot what we were doing."]);
    assert("B3 — 'you forgot' is caught, and the note hands back the AGREED PLAN rather than an apology",
      f && f.kind === "forgot" && /tokenization/.test(f.note) && !/sorry/i.test(f.note));
    assert("B3 — and it forbids the guess: say you are checking, then USE A TOOL", /USE A TOOL/.test(f.note));
    const noPlan = S(emptyState(T0), ["CAPTAIN: bhai you forgot again"]);
    assert("B3 — with NO agreed plan on record it says so honestly instead of inventing one", /no agreed plan recorded/.test(noPlan.note));

    // 2 — walked past. Canon's own law: take it literally, restart from zero.
    const open = { ...emptyState(T0), open_question: "samajh nahi aaya, phir se batao", open_question_turn: 0, turns: 1 };
    const u = S(open, ["GAFFER: chalo aage badhte hain, ab embeddings dekhte hain"]);
    assert("B3 — 'samajh nahi aaya' + the Gaffer moving on = the note that sends it BACK", u && u.kind === "unresolved" && /Go back to it NOW/.test(u.note));
    assert("B3 — and it bans re-saying it in the same words (canon: restart from zero)", /same words/.test(u.note));
    const stillAsking = S(open, ["CAPTAIN: abhi bhi samajh nahi aaya"]);
    assert("B3 — but while he is STILL saying it, no note fires: he is being heard right now, not walked past",
      !stillAsking || stillAsking.kind !== "unresolved");
    // THE NOISE BUG, held by source. Without the turn-stamp this note re-fired on
    // every later turn: measured against his real sitting, 93 notes across 123
    // turns — the supervisor becoming the noise it exists to remove.
    const stale = S({ ...open, turns: 40 }, ["GAFFER: aur is tarah embeddings kaam karte hain"]);
    assert("B3 — an OLD open question does NOT re-fire forever (93 notes in 123 turns before this was fixed)",
      !stale || stale.kind !== "unresolved");

    // 3 — the second time is the signal (A3), never a score
    const rep = { ...emptyState(T0), repeats: [{ key: norm("what were we talking about bhai"), text: "what were we talking about", count: 3, last_at: "x" }] };
    const r = S(rep, ["CAPTAIN: what were we talking about bhai"]);
    assert("B3 — a REPEATED question is caught on his words alone, and the note says the earlier answer did not land",
      r && r.kind === "repeat" && /3×/.test(r.note) && /did not land/.test(r.note));
    assert("B3 — and it forbids repeating the same shape, which is what made him repeat it", /different everyday analogy/.test(r.note));

    // 4 — the monologue. THIS is the turn behind "Feels like you are talking to yourself."
    const long = "GAFFER: " + Array.from({ length: 254 }, (_, i) => `shabd${i}`).join(" ");
    const m = S(emptyState(T0), [long]);
    assert("B3 — a 254-word turn (his real worst, 102 seconds of continuous speech) is caught",
      m && m.kind === "monologue" && /102 SECONDS/.test(m.note));
    assert("B3 — and the note carries the fence, so 'fix it' can never be read as 'say less'", /DHEEMA IS NOT CHHOTA/.test(m.note));
    assert("B3 — the threshold is DERIVED from his own forty-second law at ~150 wpm, not chosen", MONOLOGUE_WORDS === 100);
    const short = S(emptyState(T0), ["GAFFER: " + Array.from({ length: 42 }, () => "shabd").join(" ")]);
    assert("B3 — a median-length turn (42 words, his real median) is SILENT", short === null);

    // 5 — a standing instruction being broken costs something, at last
    const stand = { instructions: [{ axis: "pace", label: "speaking pace", text: "भाई स्पीड हमेशा ही आपकी बोलने की धीरे होनी चाहिए", day: "2026-08-12" }] };
    const withStanding = supervise(emptyState(T0), stand, [long], T0);
    assert("B3 — when he has ALREADY said it out loud, the monologue still wins the turn (one note, highest priority)",
      withStanding.kind === "monologue");

    // THE TWO LAWS
    const noisy = S({ ...withPlan, open_question: "samajh nahi aaya", repeats: [{ key: norm("what were we talking about"), text: "x", count: 2, last_at: "x" }] },
      ["CAPTAIN: what were we talking about, you forgot again", long]);
    assert("B3 — ONE NOTE PER TURN, EVER: four detectors fire at once and exactly one is returned",
      noisy && typeof noisy.note === "string" && noisy.kind === "forgot");
    assert("B3 — SILENCE IS THE DEFAULT: an ordinary exchange produces nothing at all",
      supervise(emptyState(T0), { instructions: [] }, ["CAPTAIN: haan theek hai", "GAFFER: chalo shuru karte hain"], T0) === null);
  }

  // --- B10 · SELF-SCORING: a bad sitting must change the next one, unprompted
  {
    const yday = { ...emptyState(new Date("2026-08-11T06:00:00Z")), day: "2026-08-11", captain_turns: 95, forgot_flags: 9, repeats: [{ key: "k", text: "what were we talking about", count: 4 }] };
    const sc = scoreSitting(yday);
    assert("B10 — a sitting is SCORED on the two things that actually went wrong on 12 Aug (he forgot / he repeated)",
      sc && sc.forgot_flags === 9 && sc.repeated_ideas === 1 && sc.clean === false);
    assert("B10 — the score is per-100-turns, so a LONG sitting is not punished for being long", sc.forgot_per_100 === 9.5);
    assert("B10 — and it names the WORST failure, not a number he would have to interpret", /you forgot/.test(sc.worst_failure));
    // the roll: yesterday's score must survive into today, or nothing can learn
    const { standing } = observe(yday, ["CAPTAIN: subah ho gayi bhai"], new Date("2026-08-12T06:00:00Z"), { instructions: [] });
    assert("B10 — on the day roll the score is BANKED, not discarded (a state that just resets can never teach)",
      standing.last_sitting && standing.last_sitting.day === "2026-08-11" && standing.last_sitting.forgot_flags === 9);
    const brief = renderBrief(emptyState(new Date("2026-08-12T06:00:00Z")), standing);
    assert("B10 — and the NEXT sitting opens knowing it, with no word from him ('evolving according to me')",
      brief.includes("WAS SCORED AND IT WAS NOT CLEAN") && brief.includes("He did not report this"));
    const clean = observe({ ...yday, forgot_flags: 0, repeats: [] }, ["CAPTAIN: subah ho gayi bhai"], new Date("2026-08-12T06:00:00Z"), { instructions: [] });
    assert("B10 — a CLEAN sitting says nothing next time (a scoreboard that reports a good day every day teaches nothing and costs tokens forever)",
      !renderBrief(emptyState(new Date("2026-08-12T06:00:00Z")), clean.standing).includes("WAS SCORED"));
  }

  // --- LAYERING (15 Aug 2026): the Watcher is the plan of record, this file is
  // the degraded-mode fallback. Both halves are asserted, because a fallback that
  // is never exercised is a hypothesis, and a plan of record that is never
  // preferred is a decoration.
  {
    const fresh = (o) => ({ ...o, ts: new Date(T0.getTime() - 5000).toISOString() });
    const stale = (o) => ({ ...o, ts: new Date(T0.getTime() - 300000).toISOString() });
    const GREET = "¿Greet वगैरह करा करो? आई थिंक यू शुड स्टार्ट ग्रीटिंग एंड एवरीथिंग फर्स्ट बिफोर यू जस्ट डंप योर वर्ड्स।";
    const j = fresh({ signals: [{ kind: "forgot", why: "he checked whether it remembered and it did not" }], standing: [{ text: "Greet him and orient yourself before delivering content.", block: "how_to_speak", quote: GREET }] });

    // 1 — the line the word gate DROPPED is now stored, and on the right axis
    assert("LAYERING — the 13 Aug greeting instruction dies the FROZEN word gate (this is the fault, still reproducible)",
      isStandingLegacy(GREET) === false);
    assert("LAYERING — …and the WATCHER's judgment stores it, which is the whole point of the replacement",
      isStanding(GREET, j, T0) === true);
    {
      const { standing } = observe(emptyState(T0), ["CAPTAIN: " + GREET], T0, { instructions: [] }, j);
      assert("LAYERING — the stored record carries the WATCHER's axis (how_to_speak → pace), never the word list's guess, because the axis decides what it replaces",
        standing.instructions.length === 1 && standing.instructions[0].axis === "pace" && standing.instructions[0].by === "watcher");
    }
    // 2 — and it is authoritative in BOTH directions: a line the Watcher did NOT
    // name is not a law, even when the word list would have waved it through.
    // This is the OVER-fire half, and it is six of his thirteen live "laws".
    const NOISE = "I want you to explain it in detail. I don't know what we are talking about to be honest.";
    assert("LAYERING — the frozen gate calls plain conversation a permanent law (the over-fire half of the fault)",
      isStandingLegacy(NOISE) === true);
    assert("LAYERING — …and the Watcher's silence about that line is a VERDICT, so it is no longer stored",
      isStanding(NOISE, j, T0) === false);
    // 3 — the calm corrections finally COUNT
    {
      const calm = "No no no no no. I told you something about 15th of August. Do you remember anything about it?";
      const legacyRun = observe(emptyState(T0), ["CAPTAIN: " + calm], T0, { instructions: [] });
      const watchedRun = observe(emptyState(T0), ["CAPTAIN: " + calm], T0, { instructions: [] }, j);
      assert("LAYERING — a CALM correction scores forgot_flags 0 on the frozen engine and 1 under the Watcher (the measurement that retired the word list)",
        legacyRun.state.forgot_flags === 0 && watchedRun.state.forgot_flags === 1);
    }
    // 4 — the note: the Watcher's wins whole, ONE per turn, and staleness is checked HERE
    const bn = fresh({ kind: "correction", priority: 95, id: "correction:7", note: "[HE IS CORRECTING YOU…]" });
    const long = "GAFFER: " + Array.from({ length: 254 }, (_, i) => `shabd${i}`).join(" ");
    const withBoth = supervise(emptyState(T0), { instructions: [] }, [long], T0, bn);
    assert("LAYERING — a fresh Watcher note WINS WHOLE: it is not merged with the word list's, and it does not arrive alongside a second note",
      withBoth.kind === "correction" && withBoth.by === "watcher" && withBoth.note === bn.note);
    assert("LAYERING — with NO judgment the frozen detectors answer exactly as before (the fallback is exercised, not merely described)",
      supervise(emptyState(T0), { instructions: [] }, [long], T0).kind === "monologue");
    assert("LAYERING — a STALE judgment is refused and the fallback answers: a correction two minutes late lands on a different conversation",
      supervise(emptyState(T0), { instructions: [] }, [long], T0, stale(bn)).kind === "monologue"
      && isStanding(GREET, stale(j), T0) === false
      && JUDGMENT_FRESH_MS === 60000);
    assert("LAYERING — a MALFORMED judgment can never crash the per-turn path; it simply is not fresh",
      judgmentIsFresh(null) === false && judgmentIsFresh({}) === false && judgmentIsFresh("x") === false
      && judgmentIsFresh({ ts: "not a date" }) === false && judgmentIsFresh({ ts: new Date(T0.getTime() + 600000).toISOString() }, T0) === false);
    // 5 — THE ONE-WAY DEPENDENCY is asserted up in the "SILENCE IS FREE" block,
    // which already reads this file's own source once. It is stated there and not
    // here for two measured reasons: a second `readFileSync(new URL(import.meta
    // .url))` costs three unresolved sinks in xray's IR for a string this suite
    // already holds, and the two properties are the same property — this organ
    // cannot reach a model, and importing the Watcher would put one a hop away.
  }

  // --- a new day is a new sitting, but the standing store is NOT reset
  {
    const old = { ...emptyState(new Date("2026-08-11T06:00:00Z")), turns: 40, forgot_flags: 5 };
    const { state, standing } = observe(old, ["CAPTAIN: hello"], T0, { instructions: [{ axis: "pace", label: "speaking pace", text: "dheere bolo", at: "x", day: "2026-08-11" }] });
    assert("a NEW DAY starts a clean sitting", state.turns === 1 && state.forgot_flags === 0 && state.day === istDay(T0));
    assert("B8 — but a standing instruction SURVIVES the day, the reconnect and the rotation", standing.instructions.length === 1);
  }

  console.log(`\ngaffer_state selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// The house pattern (captains_call.mjs, mirror.mjs), and it is guarded for a real
// reason: argv[1] is UNDEFINED under `node -e` / `node --input-type=module`, and an
// unguarded .replace() there throws before a single export can be imported. The
// bridge imports this module — a crash here would take the whole dugout down.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
