#!/usr/bin/env node
// ============================================================================
// teaching_bar.mjs · ARSENAL AI FC — THE PER-TURN TEACHING BAR (7 Sep 2026)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. His teaching laws lived in markdown that a session read ONLY
// if it opened /learn or /forge. Three holes were MEASURED the day this landed:
//
//   (a) THERE IS A LIVE ROUTE INTO A TEACHING TURN THAT OPENS NEITHER SKILL —
//       a fresh session continuing an already-open concept without typing
//       /learn. Not a hypothetical: dressing-room/state/forge_session.json was
//       open on `tokenization` with THREE recorded resumes (3 Sep, 5 Sep, 7 Sep,
//       each after a 22-27 h gap). On that route the message grammar and the
//       four per-turn carries reached the turn NOT AT ALL.
//   (b) AFTER TURN 1 NOTHING RE-INJECTED THEM. `forge_session.mjs contract`
//       prints THE METHOD, the axes and the question-moments — and ZERO bytes of
//       message grammar (read contractLines(): there is no shape, no cap, no
//       ban in it). `teaching_contract.mjs print` rotates 2 rules of 36, so a
//       given rule reaches a turn roughly once in 35.
//   (c) THREE OF HIS FOUR PER-TURN CARRIES HAVE NO CHECKER AT ALL, and the
//       fourth (link-back) has one that is gated `step > 3` and therefore can
//       never fire during step 3 SAMJHAO — the entire teaching phase. Live
//       proof the same day: teaching_contract's own ledger shows link-back,
//       max-intensity-check, adhd_intensity and act-mt2kgbt7 (three-layer) at
//       hits 0 / auto 0, while dheema-not-lamba sits at 297 auto.
//   PROOF THAT IT MATTERS, from the session that ordered this organ: the
//   assistant broke TWO standing rulings in one sitting — it sent him a markdown
//   table (banned 22 Aug, rul-mtdep06gy4) and wrote "idea 2 of 4" into a skill
//   file (banned 22 Aug, rul-mtdep0iye1). Both were caught by review agents.
//   NO CODE CAUGHT EITHER. His own L4: a law is a code path or it does not exist.
//
// WHAT IT IS. A four-line block on stdout, printed on EVERY UserPromptSubmit
// while a concept is open, carrying the MESSAGE GRAMMAR — the half neither of
// the other two per-turn organs has ever carried. It is the third injector on
// the same anchor and it deliberately overlaps NEITHER:
//   forge_session contract = WHERE you are in THE METHOD (pacing)
//   teaching_contract print = WHICH rule he is failed on most (drift-ranked)
//   teaching_bar print      = HOW the message itself is built (grammar + carries)
//
// THE SHAPE, and every part of it is his ruling, not a design choice:
//   · ONE hard-stop line EVERY TURN, never on rotation. It carries exactly the
//     three that ACTUALLY BROKE — table, blockquote, a count. A rotating hard
//     stop is a hard stop that is absent on the turn it was needed.
//   · TWO rotating lines out of SEVEN, so nothing goes stale-invisible and
//     nothing costs the turn more than four lines. Seven items, two slots,
//     stride 2: every item reaches him at least once every four turns (asserted).
//     Same discipline as teaching_contract's pick(), for the same reason.
//   · THREE shapes and no more — HIS WORD, 7 Sep 2026 ("done" to: backtick =
//     real name, bold = one load-bearing word, one diff block = right-vs-wrong;
//     three is enough). A fourth shape fails this organ's own case list, so the
//     cap is a code path and not a paragraph.
//   · EMOJI ARE ALLOWED as fixed meaning-markers ALONGSIDE the diff block, never
//     instead of it — his word the same day, answering "emoji chahiye, ya diff
//     se kaam chal jaayega" with "both". It rides shape 3's line because it is a
//     modifier on that shape, not a fourth shape.
//
// LAWS.
//   SOLE WRITER OF NOTHING. This organ writes no state file, ever, and creates
//     none. It reads two files owned by other organs, read-only:
//     forge_session.json (is a concept open) and teaching_contract.json (the
//     turn number, for rotation). Both through their own owners' on-disk shape;
//     neither is hand-edited here or anywhere else.
//   SILENT WHEN NO CONCEPT IS OPEN. The predicate is exactly turn_hook's own A5
//     predicate — `concept && !closed_at` — and STALENESS DOES NOT SILENCE IT.
//     That is deliberate and it is the whole point of hole (a): all three
//     recorded resumes happened after 22-27 h, i.e. at moments when the pacer
//     had gone stale-silent, which is precisely when the grammar was reaching
//     nobody. A5's law, already in turn_hook: an OPEN, unclosed session is a
//     session he is in the middle of; staleness silences the pacer, not this.
//   SILENT FOR HEADLESS ORGANS (ARSENAL_ORGAN=1) — same scar as forge_session's
//     `contract` and hooks/afferent-post.mjs: every `claude -p` the organism
//     spawns inherits .claude/settings.json and fires UserPromptSubmit. An organ
//     prompt must never be handed the captain's teaching grammar.
//   HOOK-SAFE. Never throws, never exits on the print path, never blocks his
//     prompt: a broken bar costs zero bytes, not a turn.
//   BYTE-BUDGETED. This rides EVERY prompt, so the block is capped in bytes and
//     in lines, both asserted over a thousand consecutive turns.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? Claude Code, through
//   .claude/settings.json UserPromptSubmit -> scripts/turn_hook.mjs prompt ->
//   runOrgan("teaching_bar.mjs", "print"). THAT WIRING IS THE FIX FOR HOLE (a):
//   the UserPromptSubmit entry carries NO `matcher` (PreToolUse is the only hook
//   in that file that does), so it fires on every prompt regardless of which
//   skill — if any — was invoked. turn_hook's case list pins it.
//
// ⚠ WHY THIS ORGAN HAS NO `self`-test VERB OF ITS OWN, and read this before
//   adding one. package.json's membership list (_selftest_coverage_law) was
//   outside this build's file ownership, and organism_test's COVERAGE LAW fails
//   any scripts/*.mjs that has a case-runner verb and is in no suite. So the
//   cases live WITH the organ — `barSelfCheck()` below, exported — and are RUN
//   by turn_hook.mjs's own suite entry, which is already in organism:selftest.
//   Nothing is uncovered; only the CLI verb is absent. IF YOU GIVE THIS ORGAN
//   ITS OWN VERB, add this to package.json organism:selftest IN THE SAME COMMIT
//   or the coverage law goes red:  && node scripts/teaching_bar.mjs selftest
//
// CLI: node scripts/teaching_bar.mjs print   (the hook path — silence is default)
//      node scripts/teaching_bar.mjs show    (same block, ignores ARSENAL_ORGAN;
//                                             for reading it by hand)
// ============================================================================
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// 7 Sep 2026 — the NEEV line reads the shared derivation from the LEAF, never
// from teaching_audit.mjs directly. Importing that sibling would trip
// organism_test's NO SHIM CALLEE law: both are turn_hook callees on the same
// anchor, and a callee already loaded by an earlier one becomes a silent no-op
// the dispatcher still counts as ran. teaching_terms.mjs is nobody's callee.
import { requiredTerms, conceptOwnTerms, closedDerive } from "./teaching_terms.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(HERE, "..", "dressing-room", "state");

// ── THE ANTI-WALL LAW, this organ's own copy ─────────────────────────────────
// teaching_contract caps itself at 5 lines and forge_session at 9, each for the
// same measured reason: a wall of text read every turn is a wall of text ignored
// every turn. This block is the THIRD on the anchor, so it takes the smallest
// share: one header, one hard-stop line, two rotating lines.
// 7 Sep 2026 — one more, conditional: the NEEV line (see barLines). It is the
// whole point of that repair, so it is counted in the budget rather than being
// allowed to overflow it.
const MAX_BAR_LINES = 5;

// How many un-opened names the NEEV line may print. A reminder that scrolls is a
// reminder that is skipped — the same anti-wall law this file already runs on.
const NEEV_SHOWN = 4;

// THE BYTE BUDGET. Derived, never chosen: measured across turns 0..999 on a live
// -shaped session the day this landed, the widest block this organ can emit is
// ~~864 bytes, at turn 106~~ (header + the hard stops + the two longest rotating
// lines that can share a turn — the three-layer carry and the diff-block shape).
// RE-MEASURED 7 Sep 2026 after the NEEV line landed: 1107 bytes at turn 101, with
// the line carrying its longest legal payload (four of the longest names on the
// syllabus). Raised DELIBERATELY, on his order to stop the un-opened-name defect,
// and with the new number written here as this comment demands. The extra ~243 B
// buys the one thing the Stop-hook checker structurally cannot: the warning
// arrives BEFORE the message instead of after it.
// For scale, on the same anchor: teaching_contract caps itself at 5 lines and
// the forge contract printed 6-9. The budget is that worst case plus a guard, so
// it fails the moment a line grows past what was reviewed — and NOT whatever
// today happened to print. Raising it is a decision to spend more of his every
// prompt; take it deliberately, with the new measurement written beside it.
const BAR_BUDGET_BYTES = 1120;

// ── THE THREE SHAPES · HIS WORD, 7 Sep 2026 ("done") ────────────────────────
// Canon: learning-layer/VISUAL_CONTRACT.md §8.1. THREE, and a fourth is refused
// by this organ's own case list — his reason, in his own law's words: a legend
// of six colours is a memory tax levied on the same few slots the lesson needs,
// and "jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE hai".
export const SHAPES = [
  { id: "shape-backtick", line: "`backtick` = THE REAL NAME he must say in an interview. Nothing else is ever backticked. Cap: 3 per message, 1 per paragraph." },
  { id: "shape-bold", line: "**bold** = the ONE load-bearing word of that paragraph — delete it and the idea dies. Cap: 1 per paragraph; zero is a good number." },
  { id: "shape-diff", line: "ONE ```diff block per message, only at the moment of correction: + sahi, - galat (2 lines normal, 4 max; a bullet line inside it goes red). Fixed meaning-emoji are ALLOWED alongside it, never instead of it (his word, 7 Sep)." },
];

// ── THE FOUR PER-TURN CARRIES · /learn SKILL.md §0a-T ───────────────────────
// Three of these four had no checker of any kind when this organ was built, and
// the fourth could not fire during the teaching step. Until a checker exists for
// each, THIS is their code path — which is exactly what §0a-T says of itself.
export const CARRIES = [
  { id: "carry-three-layers", line: "THREE LAYERS per idea: DUKAAN (the everyday analogy) -> ASLI NAAM (the real term, opened in one line) -> TECHNICAL LINE (the interview-ready English sentence). The third one went missing for a whole sitting — it is never optional and never deferred to Bolo." },
  { id: "carry-one-idea", line: "ONE idea this turn, and name the NEXT step by name. Never more than about 4 new units in the air at once." },
  { id: "carry-intensity", line: "MAX-INTENSITY CHECK at every axis close and at day close: were depth, breadth and interaction at maximum? Anything below standard is named to him in the NEXT turn — never a silent pass." },
  { id: "carry-link-back", line: "LINK-BACK: tie this to an already-taught concept BY NAME — never \"as we saw earlier\", never an unnamed gesture backwards." },
  // Added 7 Sep 2026 after the build's own verifier caught it: the bar was telling a
  // session emoji were legal and never telling it WHICH four, what each means, or the
  // cap — so on the very route this organ exists for (no skill opened) his ruling 2
  // arrived half-injected. The set is CLOSED at four and lives in VISUAL_CONTRACT §8.1c.
  { id: "carry-emoji-set", line: "MEANING-EMOJI, closed set of four, each meaning that and nothing else: ✅ the true model · ❌ the wrong model · ⚠ a trap or caveat · ⭐ the one thing to carry away. Cap 2 per message. Any other emoji, and any decorative use, is out (his rulings 1 and 2, 7 Sep)." },
];

// The rotating pool. Shapes first so the grammar lands before the carries on a
// fresh session's opening turns — a message built wrong cannot be repaired by a
// carry, but a carry can be added to a well-built message.
export const ROTATION = [...SHAPES, ...CARRIES];
const ROTATION_SLOTS = 2;

// ── THE HARD STOPS — EVERY TURN, NEVER ON ROTATION ──────────────────────────
// These three are here and not in the pool for one measured reason: they are the
// three that ACTUALLY BROKE. A rotating hard stop is absent on 5 turns out of 7,
// and the turn it is absent is the turn it was needed. Each names the ruling that
// made it, so a session can check it rather than take this line's word.
export const HARD_STOPS = "ALWAYS — no TABLE on any surface he reads (rul-mtdep06gy4) · a > blockquote never carries anything he must absorb · position BY NAME (CONCEPT > AXIS > IDEA), NEVER a count (\"idea 2 of 4\" is banned, rul-mtdep0iye1)";

// ── PURE CORE (no disk, no clock of its own) ────────────────────────────────

/** Is a concept open? EXACTLY turn_hook's A5 predicate, and staleness is not in
 *  it on purpose — see the header. Anything unreadable reads as "not open". */
export function conceptOpen(session) {
  return !!(session && typeof session === "object" && session.concept && !session.closed_at);
}

/** Which pool items ride this turn. Stride ROTATION_SLOTS so a turn never
 *  repeats an item, and the whole pool is walked before any item repeats. */
export function picked(turn, pool = ROTATION, slots = ROTATION_SLOTS) {
  if (!pool.length) return [];
  const n = Math.min(slots, pool.length);
  const t = Number.isFinite(turn) ? Math.abs(Math.trunc(turn)) : 0;
  const out = [];
  for (let k = 0; k < n; k++) out.push(pool[(t * n + k) % pool.length]);
  return out;
}

/** The block. Returns [] whenever it must be silent — no session, no concept,
 *  closed. `turn` drives rotation only; an unreadable turn is 0, not a crash. */
/** `unopened` (7 Sep 2026 — HIS ORDER, given mid-lesson: "why are these things
 *  constantly getting skipped?"). The neev-pehle checker runs on the Stop hook,
 *  i.e. AFTER the message is already on his screen — so even a correct hit was a
 *  report, never a gate, and the harness has no pre-assistant-message hook to
 *  make it one. This anchor is the earliest point the organism can speak: it
 *  fires on UserPromptSubmit, BEFORE the answer is written. So the names this
 *  concept has not opened yet ride the bar into the turn that is about to use
 *  them. Stated honestly and not oversold: this is an INJECTOR, not a hard gate.
 *  It cannot refuse a message; it can only make sure the writer was told first. */
export function barLines(session, turn = 0, unopened = []) {
  if (!conceptOpen(session)) return [];
  const t = Number.isFinite(turn) ? Math.abs(Math.trunc(turn)) : 0;
  const step = Number.isInteger(session.step) ? session.step : "?";
  const L = [];
  L.push(`TEACHING BAR · ${session.concept} step ${step} · turn ${t} — binds EVERY teaching message, skill opened or not (VISUAL_CONTRACT §8.1 · /learn §0a-T)`);
  L.push(`  ⛔ ${HARD_STOPS}`);
  for (const r of picked(t)) L.push(`  ⚠ ${r.line}`);
  const names = (Array.isArray(unopened) ? unopened : []).map((n) => String(n || "").trim()).filter(Boolean);
  if (names.length) {
    L.push(`  ⚠ NEEV — not opened yet on this concept: ${names.slice(0, NEEV_SHOWN).join(" · ")}. Every real name you use: backtick AND its one-line opening, SAME message — never left for him to ask.`);
  }
  return L;
}

// ── DISK (read-only, both files owned elsewhere) ────────────────────────────
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

/** The live forge session — owner: forge_session.mjs. Read-only here. */
export function loadSession(dir = STATE_DIR) { return readJson(join(dir, "forge_session.json")); }

/** The names this concept has NOT opened yet, for the NEEV line. Read-only, and
 *  fail-soft in every direction: an unreadable state file, an absent registry or
 *  a concept with nothing left un-opened all return [] and the line is simply not
 *  printed. Ordering is deliberate — the concept's OWN names first (they are the
 *  ones about to be used), then the rest of the syllabus.
 *  Owner of teaching_audit_last.json is teaching_audit.mjs; this only reads it. */
export function unopenedNames(dir = STATE_DIR, session = null) {
  try {
    const concept = session && session.concept ? String(session.concept) : "";
    if (!concept) return [];
    // NO STATE, NO CLAIM. With the opened-set unreadable we do not know what has
    // been opened, and listing the whole floor as "not opened" would be a wall of
    // wrong on his very first prompt. Silence is the honest answer, not a guess.
    const last = readJson(join(dir, "teaching_audit_last.json"));
    if (!last || typeof last !== "object") return [];
    const byC = (last.terms_by_concept && typeof last.terms_by_concept === "object") ? last.terms_by_concept : {};
    const st = byC[concept] || ((last.terms && last.terms.concept === concept) ? last.terms : null);
    if (!st) return [];
    const opened = new Set([...(st.opened || []), ...(st.flagged || [])].map((t) => String(t).toLowerCase()));
    for (const v of (closedDerive(dir, concept).vocab || [])) opened.add(String(v).toLowerCase());
    const watched = requiredTerms(concept, dir, st.names || []);
    // ORDER IS THE WHOLE VALUE OF THIS LINE. Only four names are printed, so the
    // four must be the ones about to be used: this concept's own registry names
    // and the names its own teaching has already declared in backticks. A first
    // cut ranked by substring-match on the concept id, which matched almost
    // nothing and led the line with another topic's eval vocabulary — noise in
    // the exact slot the repair exists to fill.
    const own = new Set([
      ...conceptOwnTerms(concept, dir),
      ...((st.names || []).map((t) => String(t).toLowerCase())),
    ]);
    // The concept's own id is not a name he must be told to open — it is the
    // title of the lesson, and printing it every turn is the always-fires noise
    // this line exists to avoid.
    const self = concept.toLowerCase();
    // ONLY THIS CONCEPT'S OWN NAMES ARE SHOWN. The WATCHED set is deliberately
    // wide — the whole syllabus, so a stray name from any topic still fires after
    // the fact — but the pre-write nudge is four slots on his every prompt, and
    // filling them with another topic's vocabulary is exactly the noise he named
    // on 7 Sep: "wo list poori ki poori evaluation aur RAG ki duniya se hai …
    // tokenization ka ek bhi shabd us list par nahi hai." Nothing relevant left
    // to name means the line goes silent, which is the correct answer, not a
    // reason to print something.
    return watched.filter((t) => own.has(t) && !opened.has(t) && t !== self);
  } catch { return []; }
}

/** The turn number, for rotation only — owner: teaching_contract.mjs, which
 *  increments it on THIS SAME ANCHOR in the callee immediately before this one,
 *  so the number printed here is the number printed on the line above it on his
 *  screen — the same turn, not an off-by-one. Never written here.
 *  FALLBACK, and it is a real one rather than a silent zero: with the counter
 *  unreadable the rotation would freeze on items 0 and 1 forever, which is the
 *  stale-invisible failure this organ exists to avoid. So it falls back to the
 *  session's own last-touch minute — deterministic given `now`, still moving. */
export function turnNumber(dir = STATE_DIR, session = null, now = new Date()) {
  const tc = readJson(join(dir, "teaching_contract.json"));
  const n = tc && tc.turns && tc.turns.count;
  if (Number.isInteger(n)) return n;
  const t = Date.parse((session && (session.updated_at || session.started_at)) || "");
  if (Number.isFinite(t)) return Math.max(0, Math.floor((now.getTime() - t) / 60000));
  return 0;
}

// ── THE CASES — run by turn_hook.mjs's suite entry (see the header note) ────
/** @returns {{pass:number, fail:number, cases:{name:string, ok:boolean, detail:string}[]}} */
export function barSelfCheck() {
  const cases = [];
  const check = (name, cond, detail = "") => cases.push({ name, ok: !!cond, detail: cond ? "" : String(detail) });

  const OPEN = { concept: "tokenization", step: 3, closed_at: null, updated_at: "2026-09-07T02:39:24.234Z" };

  // 1. FIRES with a concept open — the whole reason this organ exists.
  // The NEEV line is conditional, so the floor is MAX_BAR_LINES - 1 and the
  // ceiling is MAX_BAR_LINES. Both are asserted; neither is assumed.
  // A CASE FIXTURE, not a subject list. The jugad law bans a PRODUCTION subject
  // set shipped as a literal array ("do not create jugad, do permanent stuff") —
  // and the entire point of this build is that the real set is DERIVED and names
  // no topic anywhere. These five strings exist only so the cases can assert the
  // NEEV line's shape and its cap against known input; nothing reads them at
  // runtime. Declared rather than left to spend the ratchet: measured 7 Sep 2026,
  // without the marker the frozen count went 91 -> 92 on a test fixture alone.
  // law-waiver:jugad
  const NEEV = ["sequence", "subword", "embedding", "token id", "oov"];
  const open = barLines(OPEN, 23);
  check("bar · FIRES with a concept open (the route that opens neither skill)", open.length === MAX_BAR_LINES - 1 && /^TEACHING BAR · tokenization step 3 · turn 23/.test(open[0]), JSON.stringify(open.slice(0, 1)));

  // 2. SILENT in every shape of "no concept". A bar that spams a non-teaching
  //    session is a bar he learns to skip, and then it is worth nothing.
  check("bar · SILENT with no session at all", barLines(null, 5).length === 0);
  check("bar · SILENT with an empty session object", barLines({}, 5).length === 0);
  check("bar · SILENT with a session that has no concept", barLines({ step: 3 }, 5).length === 0);
  check("bar · SILENT once the concept is CLOSED", barLines({ ...OPEN, closed_at: "2026-09-07T05:00:00.000Z" }, 5).length === 0);
  check("bar · a garbage session is silence, never a crash", barLines("not-an-object", 5).length === 0 && barLines(42, 5).length === 0);

  // 3. STALENESS DOES NOT SILENCE IT — hole (a) in one assertion. All three
  //    recorded resumes came after 22-27 h, i.e. when the pacer was stale-silent.
  check("bar · a STALE but unclosed concept still gets the bar (A5: staleness silences the pacer, not this)",
    barLines({ ...OPEN, updated_at: "2026-08-01T00:00:00.000Z" }, 7).length === MAX_BAR_LINES - 1);

  // 3b. THE NEEV LINE — his order of 7 Sep, the whole reason the checker stops
  //     being a report card. It must arrive BEFORE the message, carry real names,
  //     cap what it prints, and vanish entirely when there is nothing to say.
  {
    const withNeev = barLines(OPEN, 23, NEEV);
    const line = withNeev.find((l) => /NEEV/.test(l)) || "";
    check("bar · the NEEV line RIDES the pre-write anchor when this concept has un-opened names",
      withNeev.length === MAX_BAR_LINES && /NEEV — not opened yet on this concept:/.test(line), JSON.stringify(withNeev.slice(-1)));
    check("bar · it names the actual terms, and CAPS what it prints (a reminder that scrolls is a reminder skipped)",
      line.includes("sequence") && line.includes("subword") && !line.includes("oov")
        && line.split(" · ").length <= NEEV_SHOWN + 1, line);
    check("bar · it orders the ASK: backtick AND the one-line opening, in the SAME message, never left for him",
      /backtick AND its one-line opening/i.test(line) && /SAME message/.test(line) && /never left for him/.test(line), line);
    check("bar · with nothing un-opened it is SILENT — a line that always fires is a line he learns to skip",
      barLines(OPEN, 23, []).length === MAX_BAR_LINES - 1
        && barLines(OPEN, 23, ["", "  "]).length === MAX_BAR_LINES - 1
        && barLines(OPEN, 23, "not-an-array").length === MAX_BAR_LINES - 1);
    check("bar · the NEEV line never resurrects a CLOSED concept's bar (silence still wins over any input)",
      barLines({ ...OPEN, closed_at: "2026-09-07T05:00:00.000Z" }, 23, NEEV).length === 0);
  }

  // 3c. THE READER behind that line: read-only, fail-soft, and it must return []
  //     rather than throwing on every shape of missing state.
  {
    const nowhere = join(HERE, "..", "no-such-dir-for-cases");
    check("bar · unopenedNames is fail-soft in every direction (no dir, no session, no concept, garbage)",
      Array.isArray(unopenedNames(nowhere, OPEN)) && unopenedNames(nowhere, OPEN).length === 0
      && unopenedNames(STATE_DIR, null).length === 0
      && unopenedNames(STATE_DIR, {}).length === 0
      && unopenedNames(STATE_DIR, "garbage").length === 0);
    check("bar · against the REAL state dir it returns names, and never the concept's own id as a name to open",
      (() => {
        const n = unopenedNames(STATE_DIR, OPEN);
        return Array.isArray(n) && !n.includes("tokenization");
      })(), JSON.stringify(unopenedNames(STATE_DIR, OPEN).slice(0, 6)));
    // HIS COMPLAINT, 7 Sep, made a case: the nudge must never spend his four
    // slots on another topic's vocabulary. The watched set stays wide; only what
    // is SHOWN is narrowed to this concept's own names.
    check("bar · the NEEV line never shows another topic's vocabulary (eval/RAG words are watched, never nudged)",
      (() => {
        const n = unopenedNames(STATE_DIR, OPEN).map((x) => String(x).toLowerCase());
        return !["eval set", "evaluation set", "test set", "ground truth", "rag", "chunking", "precision", "recall"].some((w) => n.includes(w));
      })(), JSON.stringify(unopenedNames(STATE_DIR, OPEN).slice(0, 8)));
  }

  // 4. THE HARD STOPS ARE ON EVERY TURN — the three that actually broke.
  {
    let missing = [];
    for (let t = 0; t < 200; t++) {
      const b = barLines(OPEN, t).join("\n");
      if (!b.includes(HARD_STOPS)) { missing.push(`turn ${t}: hard-stop line absent`); break; }
      if (!/no TABLE/.test(b)) { missing.push(`turn ${t}: TABLE stop absent`); break; }
      if (!/blockquote/.test(b)) { missing.push(`turn ${t}: blockquote stop absent`); break; }
      if (!/NEVER a count/.test(b)) { missing.push(`turn ${t}: never-a-count stop absent`); break; }
    }
    check("bar · the THREE HARD STOPS (table · blockquote · never-a-count) are present on EVERY one of 200 turns, never on rotation", missing.length === 0, missing.join(" · "));
  }

  // 5. THE BYTE AND LINE BUDGET — it rides every prompt he types.
  {
    let worstBytes = 0, worstTurn = -1, overLines = [];
    for (let t = 0; t < 1000; t++) {
      // WORST CASE means WITH the NEEV line and its longest legal payload —
      // measuring the budget on the narrow path is how a budget becomes a lie.
      const L = barLines(OPEN, t, ["out-of-vocabulary", "next-token prediction", "probability distribution", "chain of thought", "byte pair encoding"]);
      if (L.length > MAX_BAR_LINES) overLines.push(t);
      const b = Buffer.byteLength(L.join("\n") + "\n", "utf8");
      if (b > worstBytes) { worstBytes = b; worstTurn = t; }
    }
    check(`bar · never more than ${MAX_BAR_LINES} lines, across 1000 turns`, overLines.length === 0, `over at turns ${overLines.slice(0, 5).join(",")}`);
    check(`bar · the widest block over 1000 turns is ${worstBytes} B (turn ${worstTurn}) — budget ${BAR_BUDGET_BYTES} B`, worstBytes <= BAR_BUDGET_BYTES, `worst ${worstBytes} B at turn ${worstTurn}`);
    // …and the budget is not slack a later edit can quietly spend: it must stay
    // within a guard of the measured worst case, or it is not a budget.
    check("bar · the byte budget still tracks the MEASURED worst case (guard <= 120 B), so it cannot rot into a licence", BAR_BUDGET_BYTES - worstBytes <= 120, `budget ${BAR_BUDGET_BYTES} - measured ${worstBytes} = ${BAR_BUDGET_BYTES - worstBytes}`);
  }

  // 6. ROTATION REACHES EVERYTHING, and soon. A pool item that waits ten turns
  //    is a rule that is absent when it is needed — measured, not reasoned.
  {
    const seenAt = new Map(ROTATION.map((r) => [r.id, []]));
    for (let t = 0; t < 100; t++) for (const r of picked(t)) seenAt.get(r.id).push(t);
    const never = [...seenAt].filter(([, ts]) => !ts.length).map(([id]) => id);
    let worstGap = 0;
    for (const [, ts] of seenAt) for (let i = 1; i < ts.length; i++) worstGap = Math.max(worstGap, ts[i] - ts[i - 1]);
    check("bar · every rotating item reaches a turn (none is stale-invisible)", never.length === 0, never.join(","));
    check(`bar · and it comes back at least every 4 turns (worst gap measured: ${worstGap})`, worstGap <= 4, `worst gap ${worstGap}`);
    check("bar · a single turn never repeats the same item", (() => { for (let t = 0; t < 100; t++) { const p = picked(t); if (new Set(p.map((x) => x.id)).size !== p.length) return false; } return true; })());
  }

  // 7. HIS DECISION 3 IS A CODE PATH, not a paragraph: THREE shapes, and a
  //    fourth fails here rather than reaching him.
  check("bar · exactly THREE shapes, his word 7 Sep (\"three is enough — do not add a fourth\")", SHAPES.length === 3, `${SHAPES.length} shapes`);
  check("bar · the three shapes are backtick=real name · bold=one load-bearing word · one diff block",
    /^`backtick` = THE REAL NAME/.test(SHAPES[0].line) && /^\*\*bold\*\* = the ONE load-bearing word/.test(SHAPES[1].line) && /^ONE ```diff block per message/.test(SHAPES[2].line));
  check("bar · every shape carries its CAP (a shape with no cap is decoration, and decoration is banned)",
    SHAPES.every((s) => /Cap:|per message/.test(s.line)));
  check("bar · his decision 2 rides shape 3 — emoji ALLOWED alongside the diff block, never instead of it",
    /emoji are ALLOWED alongside it, never instead of it/i.test(SHAPES[2].line));
  check("bar · all FOUR per-turn carries are in the pool (three layers · one idea · max-intensity · link-back)",
    ["carry-three-layers", "carry-one-idea", "carry-intensity", "carry-link-back"].every((id) => ROTATION.some((r) => r.id === id)), ROTATION.map((r) => r.id).join(","));
  check("bar · the three-layer carry names the TECHNICAL LINE, the layer that was delivered zero times",
    /TECHNICAL LINE/.test(CARRIES[0].line) && /DUKAAN/.test(CARRIES[0].line) && /ASLI NAAM/.test(CARRIES[0].line));
  check("bar · the simultaneous-units cap (~4, his word 7 Sep) rides the one-idea carry", /about 4 new units/.test(CARRIES[1].line));

  // 8. THE READERS ARE READ-ONLY AND FAIL SOFT. This organ writes nothing, ever.
  // The SUBJECT is the production half — everything above these cases. Checking the
  // whole file would only ever be checking this line's own regex literal, which is
  // the vacuous shape the suite's own "not vacuously true" guards exist to refuse.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const production = src.slice(0, src.indexOf("export function barSelfCheck"));
    check("bar · the production half of this organ contains no write call of any kind (sole writer of nothing)",
      production.length > 2000 && !/\b(writeFileSync|appendFileSync|mkdirSync|renameSync|rmSync|unlinkSync)\b/.test(production),
      `production half is ${production.length} B`);
    // 7 Sep — BOTH CLI paths must pass the un-opened names. Measured the day it
    // landed: an edit updated `print` and left `show` on the two-argument call,
    // so reading the bar by hand showed a bar the hook does not emit — the exact
    // way a fix gets believed while being half-wired. Pinned as source, because
    // there is no other way to assert "these two call sites agree".
    // The subject is main(), which lives BELOW the cases — `production` stops at
    // this function, so scanning that half would have found nothing and passed
    // vacuously in the other direction. Scanned to end of line, because the inner
    // turnNumber(...) call makes a balanced-paren regex a trap.
    const cli = src.slice(src.indexOf("function main()"));
    const calls = cli.match(/barLines\(s,[^\n]*/g) || [];
    check("bar · EVERY CLI path (print and show) hands barLines the un-opened names — the two can never drift apart again",
      calls.length === 2 && calls.every((c) => /unopenedNames\(/.test(c)), JSON.stringify(calls));
  }
  check("bar · an unreadable state dir costs the turn nothing (no session, no turn, no throw)",
    loadSession(join(HERE, "..", "no-such-dir-for-cases")) === null && turnNumber(join(HERE, "..", "no-such-dir-for-cases"), null, new Date()) === 0);
  check("bar · with the turn counter unreadable the rotation still MOVES (it falls back to the session's own minute, never a frozen 0)",
    turnNumber(join(HERE, "..", "no-such-dir-for-cases"), { updated_at: "2026-09-07T02:39:24.234Z" }, new Date("2026-09-07T03:39:24.234Z")) === 60);

  return { pass: cases.filter((c) => c.ok).length, fail: cases.filter((c) => !c.ok).length, cases };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  switch (mode) {
    case "print": {                       // HOOK PATH — silence is the default
      // SELF-INJECTION GUARD (the same scar as forge_session's `contract`): every
      // headless `claude -p` the organism spawns runs inside this project,
      // inherits .claude/settings.json and fires UserPromptSubmit. An organ
      // prompt must never be handed the captain's teaching grammar.
      if (process.env.ARSENAL_ORGAN === "1") break;
      try {
        const s = loadSession();
        const lines = barLines(s, turnNumber(STATE_DIR, s), unopenedNames(STATE_DIR, s));
        if (lines.length) console.log(lines.join("\n"));
      } catch { /* a grammar reminder is never a reason to bite his prompt */ }
      break;                              // no process.exit on the hook path (turn_hook contract 2)
    }
    case "show": {                        // by hand — same block, no organ guard
      const s = loadSession();
      const lines = barLines(s, turnNumber(STATE_DIR, s), unopenedNames(STATE_DIR, s));
      console.log(lines.length ? lines.join("\n") : "teaching_bar: silent — no concept is open (forge_session.json has no concept, or it is closed).");
      break;
    }
    default:
      console.log("teaching_bar: print | show   (the per-turn message grammar — three shapes, three hard stops, four carries; silent when no concept is open. Its cases are exported as barSelfCheck() and run by: node scripts/turn_hook.mjs selftest)");
      break;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
