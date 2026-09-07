#!/usr/bin/env node
// ---------------------------------------------------------------------------
// teaching_audit.mjs · ARSENAL AI FC — THE COMPLIANCE CHECKER
//
// WHY THIS EXISTS (his ruling, 6 Aug 2026, in his own words):
//   "bruh i have adhd pi, my brain can not keep on checking it everytime if you
//    are studying correctly, how can we make sure it works 100% correctly"
//
// He was right and the previous design was wrong FOR HIM. Until today the only
// path from "Claude broke a teaching rule" to "the ranking knows" was
// `teaching_contract.mjs flag` — which the MODEL runs on itself, or which HE
// runs after catching it. That makes the person with ADHD-PI the compliance
// monitor of his own tutor. It is exactly the executive-function load this whole
// organism exists to remove, and it was load-bearing.
//
// ---------------------------------------------------------------------------
// THE RESURRECTION (6-7 Aug 2026, self-sustaining brief §5.1-§5.3 — read
// BRIEF__self_sustaining_organism.md and PROBLEM_STATEMENT__teaching_compliance.md
// for the full evidence). This organ shipped on 6 Aug, passed 25/25 selftests,
// and had AUDITED ZERO TURNS when the captain caught it the same day:
//
//   1. THE DEAD READER. The hook read `(readJson(forge_session.json)).session` —
//      but the file has NO `session` wrapper; forge_session.mjs save() writes the
//      session object at TOP LEVEL and always has. So `session` was null on every
//      firing, the scope gate read every turn as a non-teaching turn, and the organ
//      was silent in exactly the way a healthy organ is silent. Live proof at the
//      moment of discovery: teaching_audit_last.json = {"step": null} written at
//      17:34 while forge_session.json sat OPEN at step 3; teaching_audit.jsonl did
//      not exist. The defective line is FROZEN below (readForgeSessionLegacy) and
//      pinned by a selftest that runs it against the REAL live file.
//   2. THE BLIND SELFTEST. All 25 assertions handed a hand-built session object to
//      the pure auditTurn() — the disk path was exercised by nothing, so the suite
//      was green while the organ was dead. "Unrun system = hypothesis" is the law
//      this violated. The selftest now (a) asserts the reader against the REAL
//      on-disk file whenever one exists, and (b) SPAWNS this file as a child with a
//      piped hook payload against a temp state dir and asserts the log row lands —
//      the whole chain, stdin to disk, not the pure core alone.
//   3. THE DOUBLY-DEAD CHECK. confusion-is-literal read `prev.last_user_text` from
//      a file whose only writer wrote {step, at} — AND the Stop payload carries no
//      user text at all (hooks/afferent-post.mjs:59-62 is the field map). So the
//      check could never fire even after fix 1. This file is now wired into
//      UserPromptSubmit as well: the prompt is recorded there, consumed at Stop,
//      and every audit row states its userText source (fresh / session-mismatch /
//      missing) — degraded is visible, never silent.
//
// THE RULINGS THIS FILE NOW IMPLEMENTS (his words, 6 Aug 2026):
//   · "keep me out of the picture" (on the exact question of who counts a
//     code-measured drift): a measured drift AUTO-COUNTS into the ranking via
//     teaching_contract.mjs `autohit` — a separate `auto_hits` lane, provenance
//     preserved, reversible with `unhit-auto` (§7.1 reversibility law). The model's
//     own self-reports still only STAGE (`flag`) — the thing being ranked still
//     cannot rank itself; a regex has no reputation to protect, a model does.
//   · "sab audit, no gates": while a forge session is open on disk, EVERY
//     interactive Stop in this project is audited — no staleness gate, no
//     session-identity gate. Every row carries session_id + step + evidence, so a
//     mis-attributed hit is findable and reversible, and the nightly watchman
//     reviews the day's auto-hits. The ONE gate kept is ARSENAL_ORGAN: headless
//     organ output is the machine talking to itself, not him being taught —
//     auditing it would measure the wrong population entirely (the same measured
//     scar — 72.7% self-talk — that forced afferent-post.mjs's guard).
//   · Tables: his word, twice ("tables confuse him", "it was the same in previous
//     time") — ONE comparison table in a teaching-body message is now a drift.
//     The old check needed breaks > 1, so the exact shape he complained about (one
//     table per message) passed clean.
//
// EVERY CHECK REMAINS THRESHOLD-FREE — counting, presence, and state comparison
// only; anything needing a real number is recorded under `measured` and judged by
// nobody until there is real data. And the checks are now STEP-SCOPED to canon's
// own scoping (PROJECT_OS.md: the one-check-question law is a phases-3-6 law;
// Pehle-Guess asks 2-3 questions BY DESIGN; step 7 BOLO is English BY CANON;
// Jirah voices interviewer traps) — an unscoped check fired on canon-correct
// teaching, and a checker that cries wolf gets ignored.
//
// COVERAGE HONESTY: CHECKED_RULES below is exported and written into every
// teaching_audit_last.json, so `report` and the forge close report can always say
// which rules have NO check. "No drift caught" must never read as "taught
// correctly" — only the checked rules are checked.
//
// IT NEVER BLOCKS. Fail-silent, no stdout on the hook path, no throw. A checker
// that can break his session is a worse defect than the drift it catches.
//
// WRITES: teaching_audit.jsonl + teaching_audit_last.json (this organ is their
// single writer). It never touches the contract file itself
// (teaching_contract.json belongs to teaching_contract.mjs) — auto-counting
// and the checked_at heartbeat both go through teaching_contract.mjs's own CLI
// (`autohit` / `checked`), exactly as the owners-only law requires.
// ---------------------------------------------------------------------------

// cpSync dropped 10 Aug 2026 with the E2E hermeticity scar below — the seed is
// now written, not copied, so the one scope-deciding field can be normalised.
// readdirSync left with closedDerive when the vocabulary moved to teaching_terms.mjs (7 Sep 2026).
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { subjectsOf, coreAxes } from "./registry.mjs";   // S10 #10 sources + #12 core axes — rows, never literals

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_AUDIT_STATE_DIR is the selftest's seam and NOTHING else's: it lets the
// integration test spawn this exact file against a temp dir instead of his live
// state. Unset (the only configuration that exists outside the selftest) this is
// the same path it always was.
const STATE_DIR = process.env.ARSENAL_AUDIT_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const LOG = join(STATE_DIR, "teaching_audit.jsonl");
const LAST = join(STATE_DIR, "teaching_audit_last.json");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

// The rules this file can actually measure. EXPORTED and stamped into every
// teaching_audit_last.json so no surface ever has to hardcode (and rot) the list.
// W0-D (2 Sep 2026 · LR-04) adds `uncaptured-rep`. His 30-Aug order — "an uncaptured
// rep did not happen" — had no code path anywhere, and the cost was measured: two
// post-restart forge sessions produced ZERO reps while the whole study-derived spine —
// calibration, nemesis, fluency, night_coach — sat waiting on data that was never
// banked. The capture step lived only in /forge's prose, and prose read once at
// skill-load drowns after forty turns: the exact failure this organ exists for.
// ⚠ AND THIS COMMENT SITS *OUTSIDE* THE ARRAY ON PURPOSE. Written inside it, its
// parentheses made lawpack's jugad rule skip the whole literal (`judgeJugad` drops any
// array whose inner text holds a brace or paren), so the LAW PACK count fell 92 → 91
// and the gate went GREEN — not because anything improved, but because a finding had
// been hidden by punctuation in a comment. A gate may only get stricter (§10-D rule 6);
// it may never be quieted by accident. Keep prose out of literal arrays here.
// 7 Sep 2026 adds his three UNCHECKED per-turn carries — `act-mt2kgbt7`
// (three-layer delivery), `act-mt2kgn09` (C7 one-idea, position BY NAME) and
// `max-intensity-check`. Until this build all three read hits=0 auto=0 for the
// same reason: nothing measured them. See the detector block below countTables.
export const CHECKED_RULES = [
  "one-idea", "dheema-not-lamba", "hinglish", "his-level",
  "no-system-mid-concept", "confusion-is-literal", "his-word",
  "coverage", "neev-pehle", "link-back", "terminology", "decided",
  "uncaptured-rep",
  "act-mt2kgbt7", "act-mt2kgn09", "max-intensity-check",
];

// THE SEED GAP, DECLARED IN CODE RATHER THAN DISCOVERED LATER (7 Sep 2026).
// teaching_contract.mjs's own header names this trap twice (C1, and again at
// W0-D · LR-04): `dressing-room/state/teaching_contract.json` is GITIGNORED, so
// a rule row added through its CLI does not travel with the commit that teaches
// this file to emit that id. These three ids are LIVE on his laptop (added
// through the act lane on 19 and 21 Aug) but are NOT in teaching_contract.mjs's
// `seed()`. On any other machine, or after a reset, every autohit against them
// exits 1 and the measured drift is dropped — silently, in a jsonl field.
// CLOSED 7 Sep 2026 — the three `r(...)` rows landed in teaching_contract.mjs seed(),
// so this declared gap is now EMPTY and the selftest tripwire below keeps it empty.
// law-waiver:jugad — a DECLARED GAP LIST, never a subject list: it names rule ids this
// file emits that its OWNER has not yet seeded, and its whole purpose is to shrink to [].
export const SEED_GAP = [];

// COVERAGE HONESTY, PER RULE (full-organism audit P1.1-P1.2, 7 Aug 2026). A rule
// id in CHECKED_RULES means "a check EXISTS", never "the whole rule is machine-
// visible". This map states, for every partially-checkable rule, exactly which
// slice the machine sees and which slice stays HIS to catch — so "no drift caught"
// can never quietly widen into "taught correctly". `report` prints it verbatim.
export const RULE_NOTES = {
  "neev-pehle": "machine sees the LEXICAL slice only: a listed term-of-art used in the teaching body before any definitional line for it, this concept. The SEMANTIC form (a conclusion resting on an un-opened idea that has no listed name) is not machine-checkable without an LLM judge — that slice stays his to flag.",
  "link-back": "machine sees NAME-presence only: some ALREADY-CLOSED concept must have been NAMED in this session. Whether the link was a real weld or a name-drop is not machine-visible. WIDENED 7 Sep 2026 on his word ('kardo'): it now also fires DURING step 3 SAMJHAO, which is where the teaching actually happens (826 of the 907 audited rows on disk that day were step 3, and the old `step > 3` gate made this rule structurally silent on every one of them). Inside step 3 the condition is narrowed so the widening cannot flood: it waits until the concept has LANDED something — an axis closed, or the teaching has moved past its first axis — which is once per forge session at most, and the flag latches. Two holes were closed in the same pass, both in the STRICTER direction: the OPEN concept's own name no longer satisfies its own link-back (live proof: tokenization sat in its own closed-names list and latched `seen` on turn 1, so the check could never fire), and names now match on word boundaries instead of substrings (the name 'context' was being satisfied by 'in this context').",
  "act-mt2kgbt7": "machine sees ONE conditional, and it is deliberately narrow: a turn that performs the ASLI NAAM act — the real name put on the page in an emphasised term, the middle layer — and carries NO technical line. It CANNOT see an idea delivered with no naming act at all, and it cannot see a missing DUKAAN analogy; layer 3's presence is read generously (the house label OR any substantial English sentence), so a labelled-but-empty line reads as present. MEASURED over 519 live rows of 1-7 Sep: 5 anchors, 0 false fires. It is precise and SPARSE — a whole engineering week produces almost no anchors, which is correct (those are not teaching turns) but means silence here is never evidence the layer was delivered.",
  "act-mt2kgn09": "TWO halves with very different reach. (1) THE COUNT — 'idea 2 of 4', 'STEP 3/11', 'axis 3/9' — his ruling rul-mtdep0iye1 struck the abstract counter and only the LABEL, never C7's pacing law. This half is strict and near-zero false positive (0 hits across 519 live rows after the quote-guard and the numeral-list guard) and fires on any teaching-band turn. A BARE 'n/m' with no unit noun is deliberately NOT caught: it hit 60 of those 519 rows, all engineering. (2) NO POSITION AT ALL — fires only on a turn already anchored as idea-delivery (the same asli-naam act, or a check_q moment declared to the pacer in this turn's window), because firing it on every teaching-band turn would flag several hundred engineering turns that ride an open forge session. What it cannot see: an idea delivered with neither a naming act nor a declared moment.",
  "max-intensity-check": "machine sees the AXIS-CLOSE half only, and it is a state comparison, not a judgement: an axis newly lands in axes_done and neither that turn nor the next one names his three axes (depth · breadth · interaction) with a verdict on them. The latch is PER AXIS, so nine axis closes can produce at most nine drifts and a standing closed axis produces none. It CANNOT see the DAY-CLOSE half of the same rule — a day close leaves no mark in forge_session.json, so there is no pair of ends to compare and this organ says nothing rather than inventing a proxy. It also cannot judge whether the check was HONEST; presence of the check is all a regex can see. Its twin rule `adhd_intensity` is deliberately NOT emitted against: the same measured miss counted twice would inflate the ranking, and the drift ledger already names both rulings in its evidence.",
  "terminology": "machine sees a fixed translation-pair floor (shabdkosh/bhram/prasang-class replacements — 0 false positives across 4,270 live rows because they never occur in his register). Softer paraphrase-drift is not machine-visible; the pair list under-counts by design.",
  "decided": "machine sees TWO fingerprints only (re-opening the selfknowledge freeze; re-opening the tool-less/guest surface — both PERMANENT rulings, 7 Aug 2026). The general form (re-litigating any settled decision) has no decision registry to check against and stays his to catch.",
  "his-word": "machine sees ONE fingerprint: an axis marked done with zero Jirah before it. Every other his-word violation is semantic and stays his.",
  "coverage": "machine sees ONE fingerprint: a CORE axis landing in axes_deferred. The half-answer/scope-cut class is semantic and stays his.",
  "uncaptured-rep": "machine sees ONE fingerprint, and it is a COUNT, not a judgement: a legal question-moment was declared to the pacer during this turn and reps_log.jsonl grew by zero rows in the same window. It cannot see whether the moment DESERVED a rep (a widget_gate he waved through is not a bankable answer), and it cannot see a rep banked late, in a later turn — that one closes itself the moment the row lands. WHAT IT CANNOT SEE AT ALL is the session that never declares a moment: an untracked teaching turn banks nothing and is measured as nothing. That slice stays his.",
};

// CORE-NEVER-DEFERRED's axis set, mirrored from the owner (forge_session.mjs:109;
// canon PROJECT_OS.md:316). Mirrored, not imported — this hook must stay
// dependency-light and fail-silent, and the owner's constant is one letter that
// has never moved. If it ever grows, the parity selftest here and the owner's
// close report will disagree out loud.
// S10 migration #12: the hand-mirrored CORE_AXES twin died — per-concept core
// axes come from registry.mjs coreAxes(concept) (concepts.json's own lane first,
// the registry default row second). ONE reader, two callers.

// ---------------------------------------------------------------------------
// THE RULES. Each one is (a) a rule-id that already exists in the teaching
// contract, (b) a binary test on the turn, (c) the evidence to quote back.
// The `why` on each is HIS observed evidence, not my invention — the numbering
// follows learning-layer/HOW_HE_LEARNS.md's COLD-START CARD.
// ---------------------------------------------------------------------------

// Hindi function words. This list is a VOCABULARY, not a threshold — the test is
// "did ZERO of these appear", which needs no tuning. Deliberately function words
// only (never technical terms), because canon requires technical terms to STAY in
// English: "token", "sampling", "groundedness" are not translated, and a message
// full of them is still correct Hinglish.
// HOMOGRAPHS ARE EXCLUDED ON PURPOSE. The first draft of this list contained
// "the", "to", "me", "hi" and "par" — Hindi words that are spelled exactly like
// some of the commonest words in English. Its own selftest caught it immediately:
// "A token is the smallest unit the model reads." scored TWO Hindi markers and
// read as clean Hinglish. A detector that cannot fail is not a detector. Every
// word below is one that effectively never appears as standalone English, so a
// count of zero means English with no judgement call in it.
const HINDI_MARKERS = [
  "hai", "hain", "tha", "thi", "ka", "ki", "ke", "ko", "mein",
  "nahi", "nhi", "kya", "kyun", "kyu", "yeh", "wo", "woh", "se", "aur",
  "bhi", "pe", "jo", "toh", "ab", "phir", "abhi", "matlab", "kaise", "kaisa",
  "samajh", "dekho", "chalo", "raha", "rahi", "rahe", "hota", "hoti", "hote",
  "karo", "karta", "karti", "karte", "gaya", "gayi", "liye", "wala", "wali",
  "sirf", "koi", "kuch", "iska", "uska", "isme", "usme", "tumhe", "tumhara",
];

// Phrases that put his level above his own word. HOW_HE_LEARNS #10, and one of
// the two he has been failed on most. Presence is the test.
const ABOVE_HIS_LEVEL = [
  "dormant", "you already know", "you already understand", "as you know",
  "obviously", "of course you", "this should be easy", "simply put",
  "trivially", "needless to say", "goes without saying", "you'll recall",
];

// He says this literally. HOW_HE_LEARNS #9: stop there, restart from zero.
// FROZEN 6 Aug — the original list, kept for the frozen engine below.
const CONFUSION_MARKERS = [
  "samajh nahi aaya", "samajh nhi aaya", "samjha nahi", "nahi samjha",
  "i don't understand", "i dont understand", "didn't get it", "didnt get it",
  "confused", "lost", "kuch samajh nahi",
];
// PLAN OF RECORD (7 Aug 2026). The live variant he actually types most —
// present-continuous "samajh nahi aa raha" — was missing from the frozen list, so
// the commonest way he says it would not have fired. Superset, still literal.
const CONFUSION_MARKERS_V2 = [
  ...CONFUSION_MARKERS,
  "samajh nahi aa raha", "samajh nhi aa raha", "samajh nai aa raha",
  "samajh nahi aa rha", "nahi aa raha samajh", "clear nahi hua", "clear nahi hai",
];

const norm = (s) => String(s || "").toLowerCase();
const stripCode = (s) => String(s || "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");

// ── THE BACKTICK BLINDNESS (7 Sep 2026 — he stopped the lesson to have it fixed)
// stripCode above deletes INLINE backticks along with their contents, and every
// term check ran through it. His own message grammar (VISUAL_CONTRACT §8.1, his
// word "done" the same day) says a real name — the ASLI NAAM layer — MUST be
// written `like this`. So the one syntax his law mandates for a real name was the
// one syntax the checker could not see, in BOTH directions:
//   termUsed("Us list ka naam `sequence` hai", "sequence")  -> false (measured)
//   opensTerm("uska asli naam `precision` hai", "precision") -> false (measured)
// i.e. a correctly-written opening did not count as an opening, and a correctly
// written use did not count as a use. The live state proves the damage: for
// tokenization, `opened` held exactly ONE term while `flagged` held nine.
// stripCode is NOT changed — eight other checks are calibrated on it and the
// layering law says freeze, never replace. This is the term lane's own stripper:
// fenced blocks still go (a diff block is not teaching prose), inline backticks
// are UNWRAPPED so the name inside them is read as the word it is.
const stripFencesKeepInline = (s) => String(s || "")
  .replace(/```[\s\S]*?```/g, " ")
  .replace(/`([^`\n]*)`/g, " $1 ");

// FROZEN 6 Aug 2026 (layering law) — the original counter, byte-for-byte. Its
// defect, measured against his real teaching rows: /\?(?=\s|$)/ misses a question
// mark followed by closing markdown — and BOLD questions are the house style
// ("**A ya B?**" scored ZERO). 33 of the last 60 real teaching messages ended a
// question with `?**`.
export function countQuestionsLegacy(text) {
  const stripped = String(text || "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const m = stripped.match(/\?(?=\s|$)/g);
  return m ? m.length : 0;
}

// PLAN OF RECORD (7 Aug 2026). Ending-aware: a `?` may be followed by closing
// bold/italic/brackets and still end the sentence. QUOTES ARE DELIBERATELY NOT
// closers: measured on the live afferent stream, `?"` is overwhelmingly this
// teacher QUOTING a question (his words, an interviewer line) rather than asking
// one — counting those would inflate the count on canon-correct turns.
export function countQuestions(text) {
  const stripped = stripCode(text);
  const m = stripped.match(/\?[\*_\)\]]*(?=\s|$)/g);
  return m ? m.length : 0;
}

// DHEEMA vs LAMBA, MADE COUNTABLE (his ruling, 6 Aug 2026: "ye dheema vs lamba
// merko thodi pata chal paega yar" — he cannot be the one to notice it, which is
// the whole point of this file).
//
// It was previously written off as unmechanizable. That was wrong, and the error
// was reading it as a LENGTH rule. In his own words it is not:
//   "dheema = EK cheez, poori tarah kholi hui, chhote-chhote kadam, har kadam pe
//    ruk ke. Lamba = ek message mein bahut saari cheezein."
// So the axis is HOW MANY THINGS, not how many characters. A long message that
// opens ONE thing all the way down is dheema and is exactly what he asked for;
// a short message carrying four things is lamba. Length cannot tell them apart —
// structure can.
//
// A message covering one idea does not need section breaks. Headers and horizontal
// rules exist precisely TO separate different things, so their count is a direct
// count of the things. This is the same threshold-free shape as the check-question
// rule: not "how long", but "more than ONE".
//
// DELIBERATELY NOT COUNTED: plain numbered lists. Canon asks for the mechanism in
// text plus a NUMBERED TRACE (HOW_HE_LEARNS #3) — a trace is one idea walked step
// by step, which is the definition of dheema. Counting it would punish the exact
// format he asked for.
export function countSectionBreaks(text) {
  const stripped = String(text || "").replace(/```[\s\S]*?```/g, "");
  const headers = (stripped.match(/^#{1,6}\s+\S/gm) || []).length;
  const rules = (stripped.match(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm) || []).length;
  const tables = (stripped.match(/^\s*\|[\s:|-]+\|\s*$/gm) || []).length;   // a comparison grid is many things at once
  return headers + rules + tables;
}

// TABLES, COUNTED ALONE (7 Aug 2026 — his word, given twice). On 6 Aug he said
// tables confuse him AND that he had said so before. The combined counter above
// needs breaks > 1, so the exact shape he reported — ONE table per message —
// passed clean. One separator row = one table = the drift. Presence, no number.
//
// ⛔ DO NOT WIDEN THIS CHECK — HIS DELIBERATE SKIP, 7 Sep 2026, one word: "skip it".
// The widening that was put to him and DECLINED, so the next session does not
// re-propose it as if it were an oversight:
//   · step-10 LOCK reports (the `at(10)` exemption in the selftest below stays),
//   · fenced csv/tsv grids (the fence strip above stays — a grid inside ``` is not read),
//   · the postmatch SEASON.md surface (out of this organ's scope entirely).
// His 22-Aug ruling rul-mtdep06gy4 ("never never use tables… table is something
// which irritates my mind") does name "every teaching surface", and the three
// shapes above are inside that scope on the letter of it — he was told that and
// still said skip. Recorded as a DECISION, not a gap: this is a captain's call
// under the same law that lets him keep biometric files public. Behaviour here is
// unchanged by the 7 Sep build; only this comment was added.
export function countTables(text) {
  const stripped = String(text || "").replace(/```[\s\S]*?```/g, "");
  return (stripped.match(/^\s*\|[\s:|-]+\|\s*$/gm) || []).length;
}

// ===========================================================================
// HIS FOUR PER-TURN CARRIES (7 Sep 2026 — the build his haan ordered).
//
// Measured that morning: `teaching_contract.mjs list` showed hits=0 auto=0 on
// all four. For THREE of them the zero meant nothing measures them at all —
// this organ auto-counted 13 rules and none was three-layer, position-by-name
// or the intensity check. The fourth, link-back, HAD a checker (check 9 below)
// gated `step > 3`, so it was structurally silent through step 3 SAMJHAO, which
// is where the teaching happens: 826 of the 907 rows on disk that day were step 3.
// His own L4 — a law is a code path or it does not exist — was failing on four
// laws at once, and the proof arrived in the same sitting that ordered the fix:
// the assistant sent him a markdown table (banned 22 Aug, rul-mtdep06gy4) and
// wrote "idea 2 of 4" into a skill file (banned 22 Aug, rul-mtdep0iye1). Review
// agents caught both. No code caught either.
//
// ── THE CASE-FOLDING TRAP, MEASURED, BECAUSE IT ALMOST SHIPPED A WOLF-CRIER ──
// Under the /i flag a class like [A-Z] matches lowercase. The first cut of the
// naming-act detector below carried /i so that "Asli naam" and "ASLI NAAM" would
// both match — and its ALL-CAPS-term branch then matched ANY word. Replayed over
// 519 real teaching-lane rows it scored 19 hits, of which four were engineering
// prose ("path ka asli naam resolve karega", "asli naam kabhi reject nahi honge").
// Case-sensitive, the same corpus gives 5 hits and every one is a real naming act.
// So: no regex below that carries an ALL-CAPS branch may carry /i, and the words
// that must tolerate case spell their letters out through `ci()`.
// ===========================================================================

// A case-insensitive literal that does NOT need the /i flag (see above).
const ci = (w) => w.split("").map((c) => (/[a-zA-Z]/.test(c)
  ? `[${c.toLowerCase()}${c.toUpperCase()}]`
  : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("");

// An EMPHASISED TERM — the house's way of putting a real name on the page:
// **bold**, `backticked`, a <SPECIAL> token, or an ALL-CAPS word. Case-sensitive.
const EMPH_TERM = "(?:\\*\\*[^*\\n]{2,40}\\*\\*|`[^`\\n]{1,40}`|<[A-Za-z_]{2,12}>|\\b[A-Z][A-Z0-9_]{2,}\\b)";

// ---------------------------------------------------------------------------
// LAYER 2 — THE ASLI NAAM ACT. This is the ANCHOR for the two idea-delivery
// checks below, and the choice is deliberate: it is the ONE layer of his
// three-layer law that leaves an unambiguous mark on the page. When the teacher
// performs it, an idea is being opened BY THE TEACHER'S OWN HAND — no guessing,
// no "does this look like teaching", no negative gate on engineering vocabulary.
//
// The connector between the phrase and its term is punctuation-only (at most 8
// chars, plus an optional copula). That is what separates the ACT — "uska asli
// naam **VOCABULARY** hai", "**Uska asli naam:** `<UNK>`" — from the same two
// words used as ordinary prose ("asli naam resolve karega", "asli naam nahi").
// MEASURED over the 519 live rows of 1-7 Sep: 5 hits, all 5 genuine naming acts,
// 0 engineering prose. `(?!\s+nahi)` kills the negation form explicitly.
const ASLI_NAAM_ACT = new RegExp(
  `\\b${ci("asli")}\\s+(?:${ci("naam")}|${ci("term")})\\b(?!\\s+${ci("nahi")})` +
  `(?:\\s+(?:${ci("hai")}|${ci("hain")}|${ci("is")}))?[\\s:.,;—–*_"'()\\[\\]-]{0,8}${EMPH_TERM}`);
export function asliNaamAct(text) { return ASLI_NAAM_ACT.test(String(text || "").replace(/```[\s\S]*?```/g, " ")); }

// ---------------------------------------------------------------------------
// LAYER 3 — THE TECHNICAL LINE. His R1 ruling's third layer: "woh sentence jo
// tum interview mein bologe". Two independent ways of seeing it, OR'd, because
// the register carries both and a drift needs BOTH absent:
//   · the house LABEL — "**Technical line:** …", "yeh woh line hai jo tum
//     interview mein bologe" (measured live 09-01 and 09-05); the labelled line
//     is sometimes itself Hinglish, so the label alone must count;
//   · an ENGLISH SENTENCE of substance — >= 7 words, zero Hindi function words,
//     which is what an interview line looks like when it is delivered unlabelled
//     (measured live 09-04: "The vocabulary is a fixed, finite list of text
//     pieces, built once before…").
// The OR makes this detector generous, and that direction is chosen on purpose:
// a generous "layer 3 is present" test makes the CHECK quieter, never louder.
const TECH_LINE_LABEL = /(technical\s+line|interview\s+line|english\s+line|interview\s*-?\s*ready|interview\s+mein\s+(?:bol|keh|kehna|bologe|bolni|bolna|bolo)|jo\s+(?:tum|aap|tu)\s+interview\s+mein)/i;
export function technicalLine(text) {
  const t = stripCode(text);
  if (TECH_LINE_LABEL.test(t)) return { via: "label", excerpt: String(t.match(TECH_LINE_LABEL)[0]).slice(0, 80) };
  // full text, fences dropped but inline code KEPT — a technical line routinely
  // carries a backticked token and stripping it would shorten the sentence below
  // the word floor.
  for (const raw of String(text || "").replace(/```[\s\S]*?```/g, " ").split(/\n/)) {
    const line = raw.replace(/^[\s>*_#-]+/, "").replace(/[*_`"“”]/g, "").trim();
    for (const sent of line.split(/(?<=[.!])\s+/)) {
      const w = sent.toLowerCase().split(/[^a-z0-9'-]+/).filter(Boolean);
      if (w.length < 7) continue;
      if (w.some((x) => HINDI_MARKERS.includes(x))) continue;
      return { via: "english-sentence", excerpt: sent.slice(0, 120) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// POSITION, BY NAME (C7 + his 22-Aug ruling rul-mtdep0iye1). The lawful shape is
// a NAMED path — `TOKENIZATION › AXIS b (sequence length) › OOV ka asli dard`
// (that exact line is on disk, 09-05 21:48) — or an explicit locator, "Tum yahan
// ho: axis a" (on disk, 09-01 01:22). Both live shapes are covered.
// The caps branch uses [ \t]* and NOT \s*, so a capitalised word followed by a
// markdown blockquote on the next line cannot pass as a chevron path.
const NAMED_POSITION = new RegExp(
  `(?:\\b[A-Z][A-Z0-9 _'-]{2,40}[ \\t]*[\u203a\u00bb>\u2192]` +
  `|\\b${ci("axis")}\\s+[a-i]\\b` +
  `|${ci("tum yahan ho")}|${ci("aap yahan ho")}|${ci("you are here")})`);
export function namedPosition(text) { return NAMED_POSITION.test(stripCode(text)); }

// ---------------------------------------------------------------------------
// THE BANNED COUNT (his ruling rul-mtdep0iye1, 22 Aug 2026, verbatim: "please
// drop this vague things like idea x out of y, i want to see the real terms and
// concept names… i have adhd pi bro, don't forget it"). The pacing law C7 is
// untouched by that ruling — only the LABEL died.
//
// STRICT BY MEASUREMENT, not by intention. Replayed over the 519 live rows:
//   · a UNIT NOUN must carry the count ("idea 2 of 4", "STEP 3/11", "axis 3/9").
//     A bare n/m is NOT caught and that is a decision, not an omission — bare
//     n/m hit 60 of 519 rows, every one of them engineering ("gate selftest
//     57/0", "0/9 axes", "6/12 steps"). A checker that fires on those is a
//     checker he learns to ignore.
//   · `(?![\s]*[/\d])` kills the numeral-LIST form: "step 0/1/10 par woh khud
//     fail hota hai" is three step numbers, not "step 0 of 1". 2 of the 3 raw
//     hits in the corpus were this shape.
//   · QUOTED spans are dropped first. The third raw hit was the teacher quoting
//     the banned form while apologising for it ("Maine likh diya tha ki har turn
//     \"idea 2 of 4\" carry karega. Wo tumne khud ban kiya tha."). Naming the
//     banned thing is not doing it.
// After all three guards: 0 hits in 519 real rows. That is the near-zero-false-
// positive floor this half was asked for.
const COUNT_UNIT = "(?:idea|ideas|point|points|concept|concepts|step|steps|part|parts|axis|axes|topic|topics|chunk|chunks|piece|pieces|section|sections|beat|beats|sawaal|padav|kadam)";
const COUNT_OF = new RegExp(`\\b${COUNT_UNIT}\\s*#?\\s*(\\d{1,2})\\s*(?:of|out\\s+of|mein\\s+se|me\\s+se)\\s*(\\d{1,2})\\b`, "i");
const COUNT_SLASH = new RegExp(`\\b${COUNT_UNIT}\\s*#?\\s*(\\d{1,2})\\s*/\\s*(\\d{1,2})(?![\\s]*[/\\d])`, "i");
// Citation forms, dropped before the count is looked for — the register's ways of
// naming a thing rather than using it.
// SHORT BY ABLATION, not by taste. The first cut of this list also stripped
// '\u2026', *italic* and blockquote lines. Each rule was then ablated against the same
// 519 live rows: the DOUBLE-QUOTE rule alone accounts for the one real false
// positive in the corpus (the teacher quoting the banned form while apologising
// for it \u2014 09-07 06:27), and the other three catch nothing at all while each one
// opens a hole a counter can hide in: `*idea 2 of 4*` and a blockquoted
// `> idea 2 of 4` both went UNDETECTED until they came out. The single-quote rule
// was the worst of the three \u2014 apostrophes are unpaired in this register, so two
// of them bracket and delete everything between, counter included. A guard that
// buys zero and costs coverage is not a guard, and a gate may only get stricter.
// ~~struck~~ stays: canon marks the retired header exactly that way
// (`~~STEP n/11~~` \u2192 the named path), so a strikethrough really is the dead form
// being shown. BOLD is deliberately never stripped \u2014 it is the house's ordinary
// emphasis, and `**idea 2 of 4**` is caught (asserted in the selftest).
const dequote = (s) => String(s || "")
  .replace(/"[^"\n]{0,400}"/g, " ")
  .replace(/\u201c[^\u201d\n]{0,400}\u201d/g, " ")
  .replace(/~~[^~\n]{0,300}~~/g, " ");
export function countForm(text) {
  const t = dequote(stripCode(text));
  for (const [form, rx] of [["k of n", COUNT_OF], ["k/n", COUNT_SLASH]]) {
    const m = t.match(rx);
    if (!m) continue;
    const k = Number(m[1]), n = Number(m[2]);
    if (!(n >= k && n >= 2 && n <= 50)) continue;   // "57/0" and "1 of 1" are not progress counters
    return { form, match: String(m[0]).replace(/\s+/g, " ").trim() };
  }
  return null;
}

// ---------------------------------------------------------------------------
// THE MAX-INTENSITY CHECK (`max-intensity-check` + `adhd_intensity`, his rulings
// 19 Aug 2026): "Har topic ke samjhao ke baad explicitly check karo ki intensity
// aur depth maximum thi ya nahi… Agar kuch bhi standard se niche hai toh next
// turn mein mujhe explicitly batao." Three named axes — depth, breadth,
// interaction — and a verdict on them.
// The test is his own shape: either the word INTENSITY itself, or at least TWO
// of his three axes named, AND a verdict word alongside. One axis word alone is
// ordinary prose ("depth" appears in engineering turns constantly); two of three
// plus a verdict is somebody answering his question.
const INT_AXES = [/\b(?:depth|gehra?ai|gehrai|gahrai)\b/i, /\b(?:breadth|chaudai|chaudaai|daayra|dayra|scope)\b/i, /\b(?:interaction|involvement|baat-?cheet|aadan-?pradan)\b/i];
const INT_WORD = /\b(?:intensity|inten?sity|teevrata)\b/i;
const INT_VERDICT = /\b(?:maximum|max|poori|poora|full|standard|domination|dominate|niche|below|kam|adhoori|adhura|kamzor|theek)\b/i;
export function intensityCheck(text) {
  const t = stripCode(text);
  const axes = INT_AXES.filter((rx) => rx.test(t)).length;
  return (INT_WORD.test(t) || axes >= 2) && INT_VERDICT.test(t);
}

// FROZEN 6 Aug 2026 — the original, byte-for-byte. Kept exported because the
// Devanagari 999 sentinel is part of the frozen engine's contract and its
// homograph-guard assertions still pin the marker list.
export function hindiMarkerCount(text) {
  const words = norm(text).replace(/```[\s\S]*?```/g, " ").split(/[^a-zऀ-ॿ]+/).filter(Boolean);
  if (/[ऀ-ॿ]/.test(String(text || ""))) return 999;   // Devanagari is unambiguously Hindi
  return words.filter((w) => HINDI_MARKERS.includes(w)).length;
}

// PLAN OF RECORD (7 Aug 2026). Three repairs over the frozen counter:
//   · the 999 sentinel leaked IN-BAND into `measured` — a real Hinglish row with a
//     single stray matra ("chaudा", a typo) recorded 999 markers into the lane that
//     is supposed to hold clean 30-45-day data. Devanagari is now an out-of-band
//     boolean; the count stays a count.
//   · the sentinel tested the UNSTRIPPED text, so Devanagari inside a code fence
//     (a tokenizer example) made a pure-English turn immune to the hinglish check.
//   · `words` is exposed so a message that is ALL code fence (the Visualization
//     Contract's widget-delivery turns) is visibly "nothing to judge" rather than
//     "English".
export function hindiSignal(text) {
  const stripped = stripCode(text);
  const devanagari = /[ऀ-ॿ]/.test(stripped);
  const words = norm(stripped).split(/[^a-zऀ-ॿ]+/).filter(Boolean);
  return { devanagari, words: words.length, markers: words.filter((w) => HINDI_MARKERS.includes(w)).length };
}

// FROZEN 6 Aug 2026 — byte-for-byte. Its defect, measured: it tested RAW text, and
// in the last 60 real teaching rows every single command mention (16/16) sat inside
// backticks — which is the COMPLIANT form (canon: "naam lo, park karo"). The check
// could not tell naming from doing, so it flagged 100% obedience as 100% drift.
export function mentionsSystemWorkLegacy(text) {
  const t = String(text || "");
  return /node\s+scripts[\\/]|npm\s+(test|run)\b|git\s+(commit|push|add|status)\b|schtasks\b/.test(t);
}

// PLAN OF RECORD (7 Aug 2026). Fences and inline code are stripped first: a
// backticked command is a NAMED-AND-PARKED command, which is exactly what canon
// asks for mid-concept. Bare, runnable system-work prose is what pulls him out of
// the concept, and that is what remains after the strip.
export function mentionsSystemWork(text) {
  return /node\s+scripts[\\/]|npm\s+(test|run)\b|git\s+(commit|push|add|status)\b|schtasks\b/.test(stripCode(text));
}

// ---------------------------------------------------------------------------
// NEEV-PEHLE (full-organism audit P1.2, 7 Aug 2026) — the sequencing defect that
// finally got a name. Its shape, in the captain's evidence: the teacher delivers a
// CONCLUSION before the thing that conclusion rests on. Both live 7 Aug instances
// share one lexical fingerprint: a TERM-OF-ART was USED (inside a formula or an
// instruction) before any definitional line for it had ever appeared —
//   · the groundedness FORMULA arrived before "ground truth" was opened as an
//     object (he had to ask three times);
//   · "apne invoices se eval set banao" arrived before "eval set ek FILE hai" had
//     ever been said (he worked it out himself and corrected the teacher).
// HOW_HE_LEARNS #8 is the canon this projects onto: "Open every new name or label
// in one line, the first time."
//
// WHAT IS CHECKABLE AND WHAT IS NOT, stated plainly (see RULE_NOTES): the machine
// can see LISTED terms used-before-opened. It cannot see a conclusion resting on
// an un-opened IDEA that has no listed name — that is semantic, needs a judge, and
// stays his to flag. This list is therefore a FLOOR, like Gate 2's regexes: grown
// from observed failures + the near-syllabus term space, never claimed complete.
// MOVED 7 Sep 2026 to scripts/teaching_terms.mjs and RE-EXPORTED unchanged.
// Not tidiness: teaching_bar.mjs needs the same derivation to warn BEFORE a
// message is written, and importing THIS file from a sibling hook callee trips
// organism_test NO SHIM CALLEE (the ES-module cache turns the later SHIM into a
// silent no-op — the mechanism that killed outbox brief for three weeks). A leaf
// both organs import, importing neither, is the only shape that is safe here.
export { TERMS_OF_ART, CLOSED_EXTRA_VOCAB, syllabusVocab, conceptOwnTerms, requiredTerms, closedDerive } from "./teaching_terms.mjs";
// The re-export line above carries the whole API onward without creating local
// bindings; this line imports ONLY what this file's own body still calls, so the
// no-unused-vars gate stays where it was.
import { TERMS_OF_ART, requiredTerms, closedDerive } from "./teaching_terms.mjs";

// Hyphen/space-flexible, word-bounded presence. "closed-book" matches "closed book";
// plural s/es tolerated; substrings never match ("rag" does not fire inside "storage").
const flexTerm = (t) => String(t).trim().split(/[\s-]+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]+");
export function termUsed(text, term) {
  return new RegExp(`(^|[^a-z0-9])${flexTerm(term)}(e?s)?([^a-z0-9]|$)`, "i").test(stripFencesKeepInline(text));
}

// Did this text OPEN the term — a one-line definitional act, in the house style
// measured off the real repair turns in afferent.jsonl (6 Aug 16:49): "ka asli
// naam: EVALUATION SET", "Yahi tera ground truth hai", "eval set ek FILE hai",
// "X matlab/yaani …", "X (gloss…)", "X = …".
export function opensTerm(text, term) {
  const s = stripFencesKeepInline(text);
  const T = `[*_"'«»]*${flexTerm(term)}(e?s)?[*_"'«»]*`;
  const pats = [
    `${T}\\s*(=|ka matlab|matlab|yaani)`,                                  // eval set = / matlab
    `${T}\\s*\\(`,                                                          // EVALUATION SET *(chhota naam…)*
    `${T}\\s+ek\\s+[^.\\n]{1,60}(hai|hota|hoti)`,                           // "eval set ek FILE hai"
    `${T}\\s+(is|means)\\s+(a|an|the)?\\b`,                                 // English definitional
    `(asli naam|naam|kehte hain|bolte hain|kehlata|kehlati)[^.\\n]{0,30}[:\\-—]?\\s*${T}`,
    `(yahi|yeh|ye)\\s+(tera|tumhara|hamara)?\\s*${T}\\s+(hai|hota|hoti)`,   // "Yahi tera ground truth hai"
  ];
  return pats.some((p) => new RegExp(p, "i").test(s));
}

// TERMINOLOGY (P1.1) — the checkable floor of the rule "Hindi anuvaad se naam mat
// badlo". A pair fires only when the Hindi NAME-replacement is present AND the
// English term is absent from the same message — both present is a gloss/analogy,
// which canon explicitly allows ("analogy alag cheez hai, naam alag"). Ordinary
// Hinglish words that live in his analogy register (tukda, sambhavna — 11 clean
// live occurrences) are EXCLUDED on evidence; every pair below has ZERO occurrences
// in 4,270 live afferent rows, so a hit is near-certain drift and the list is an
// honest under-count, never a wolf-crier.
const TERM_TRANSLATIONS = [
  ["shabdkosh", "vocabulary"],
  ["bhram", "hallucination"],
  ["prasang khidki", "context window"],
  ["prasang", "context"],
  ["antargat", "embedding"],
  ["nishkarsh", "inference"],
];

// DECIDED (P1.1) — the two PERMANENT rulings with unambiguous fingerprints
// (7 Aug 2026, hippocampus: selfknowledge frozen + no tool-less guest surface,
// "yeh thread dobara mat kholo"). Anything matching these is re-litigation.
const DECIDED_RULINGS = [
  { rx: /selfknowledge[^.\n]{0,60}(enable|wapas|re-?open|chal(u|a)o|un-?freeze|revive|zinda)/i,
    ruling: "selfknowledge.mjs PERMANENTLY frozen — his word, 7 Aug 2026; do not re-open" },
  { rx: /tool-?less\s+(guest\s+)?surface|guest\/keynote\s+surface/i,
    ruling: "the tool-less guest/keynote surface is NOT to be built — his word, 7 Aug 2026" },
];

// The closed-concept world, derived LIVE (never hardcoded): sprint.json
// progress.done + the locked capsule mirror. Returns { names, vocab } — names for
// the link-back check, vocab (ids + aliases + extra) pre-opened for neev-pehle.
// SEED FROM HISTORY (P1.2, 7 Aug 2026). The cross-turn term/link state was born
// mid-concept — six hallucinations sessions predate it, and their teaching turns
// are all on disk in afferent.jsonl (claude-code-teaching lane). Claiming "never
// opened" without having watched would be a guess; replaying the recorded turns
// through the SAME opensTerm/termUsed the live check uses is a measurement.
// This is the owner writing its own state file — single-writer law intact.
export function seedTerms({ concept = null, sinceSession = null } = {}) {
  const fs = readForgeSession();
  const c = concept || (fs.session && fs.session.concept) || null;
  if (!c) return { ok: false, why: "no concept — none open on disk, none given" };
  const afferents = join(STATE_DIR, "afferent.jsonl");
  if (!existsSync(afferents)) return { ok: false, why: "no afferent.jsonl — nothing recorded to replay" };
  const opened = new Set(), used = new Set();
  let rows = 0, teachRows = 0, linkSeen = false;
  const closed = closedDerive(STATE_DIR, c);   // 7 Sep: the replayed concept is the OPEN one — never its own pre-opened vocabulary
  const startISO = sinceSession || (fs.session && fs.session.started_at) || null;
  const lines = readFileSync(afferents, "utf8").split("\n");
  // S10 migration #10: the audited-source set is the registry row `audit_sources`
  // (695 of his prompts over 6 days produced 0 audit rows because ONE source was
  // nailed here). A new teaching source joins by ROW ADD, never by editing this line.
  const AUDIT_SOURCES = subjectsOf("audit_sources");
  for (const l of lines) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }
    rows++;
    if (!AUDIT_SOURCES.includes(r.source) || typeof r.text !== "string") continue;
    teachRows++;
    for (const t of TERMS_OF_ART) {
      if (!termUsed(r.text, t)) continue;
      used.add(t);
      if (opensTerm(r.text, t)) opened.add(t);
    }
    if (startISO && r.ts && r.ts >= startISO) {
      if (closed.names.some((n) => norm(r.text).includes(n.toLowerCase()) || norm(r.text).includes(n.toLowerCase().replace(/s$/, "")))) linkSeen = true;
    }
  }
  const last = readLast() || {};
  const seededTerms = { concept: c, opened: [...opened].sort(), flagged: (last.terms && last.terms.concept === c ? last.terms.flagged : []) || [], seeded_from_history_at: new Date().toISOString() };
  writeLastReal({
    ...last,
    terms: seededTerms,
    terms_by_concept: { ...((last.terms_by_concept && typeof last.terms_by_concept === "object") ? last.terms_by_concept : {}), [c]: seededTerms },   // C4
    linkback: { concept: c, session: startISO, seen: linkSeen, flagged: false, seeded_from_history_at: new Date().toISOString() },
    checked_rules: CHECKED_RULES,
  });
  return { ok: true, concept: c, rows, teachRows, opened: [...opened].sort(), used_never_opened: [...used].filter((t) => !opened.has(t)).sort(), linkSeen };
}

// ---------------------------------------------------------------------------
// FROZEN 6 Aug 2026 (layering law) — the original audit engine, kept whole. Its
// helper calls are re-pointed at the frozen twins (countQuestionsLegacy etc.) so
// the OLD behaviour stays reproducible verbatim; everything else is byte-for-byte.
// Defects this engine carries, all pinned by the selftest and repaired in the plan
// of record below it:
//   · every text check ran UNSCOPED across all 12 METHOD steps, while canon scopes
//     them sharply (one-check-question is a phases-3-6 law; step 7 BOLO is English
//     BY CANON; Pehle-Guess and Jirah are multi-question BY DESIGN) — so it flagged
//     canon-correct teaching at steps 2, 7, 8 and 9;
//   · one table per message passed the dheema check (needs breaks > 1) — the exact
//     shape of his 6 Aug tables complaint;
//   · a backticked (compliant) command flagged no-system-mid-concept;
//   · the state evidence for "axis marked done before Jirah" (the drift that
//     opened this whole audit) sat unread in the session object it receives.
// ---------------------------------------------------------------------------
export function auditTurnLegacy({ assistantText = "", userText = "", session = null, prevStep = null } = {}) {
  const drifts = [];
  const open = !!(session && !session.closed_at);

  if (!open) {
    return { audited: false, why: "no open forge session — THE METHOD does not apply to this turn", drifts: [], measured: null };
  }

  const step = Number(session.step);
  const quote = (s, n = 120) => String(s || "").replace(/\s+/g, " ").slice(0, n);

  const qs = countQuestionsLegacy(assistantText);
  if (qs > 1) {
    drifts.push({
      rule: "one-idea",
      evidence: `${qs} question marks ended a sentence in one teaching message (canon allows ONE check-question)`,
      excerpt: quote(String(assistantText).split(/(?<=\?)\s+/).filter((s) => s.includes("?")).join(" … "), 200),
    });
  }

  const breaks = countSectionBreaks(assistantText);
  if (breaks > 1) {
    drifts.push({
      rule: "dheema-not-lamba",
      evidence: `${breaks} section break(s) in one teaching message — headers/rules/tables separate DIFFERENT things, and canon is ONE thing opened all the way down. Never make it longer; make it deeper.`,
      excerpt: quote(String(assistantText).match(/^#{1,6}\s+.*$/gm)?.join(" | ") || "", 200),
    });
  }

  if (hindiMarkerCount(assistantText) === 0 && String(assistantText).trim().length > 0) {
    drifts.push({
      rule: "hinglish",
      evidence: "ZERO Hindi function words in a teaching turn — this was English, and he asked twice for Hinglish",
      excerpt: quote(assistantText),
    });
  }

  const found = ABOVE_HIS_LEVEL.filter((p) => norm(assistantText).includes(p));
  if (found.length) {
    drifts.push({
      rule: "his-level",
      evidence: `phrase(s) that put his level above his own word: ${found.map((f) => `"${f}"`).join(", ")}`,
      excerpt: quote(assistantText, 160),
    });
  }

  if (Number.isFinite(step) && step >= 3 && step <= 6 && mentionsSystemWorkLegacy(assistantText)) {
    drifts.push({
      rule: "no-system-mid-concept",
      evidence: `a repo command appeared inside the teaching body (step ${step}) — park it in one line, hand back the micro-question`,
      excerpt: quote(assistantText, 160),
    });
  }

  const saidConfused = CONFUSION_MARKERS.some((m) => norm(userText).includes(m));
  if (saidConfused && Number.isFinite(prevStep) && Number.isFinite(step) && step > prevStep) {
    drifts.push({
      rule: "confusion-is-literal",
      evidence: `he said he did not understand, and the step still advanced ${prevStep} → ${step} (canon: stop there, restart from zero)`,
      excerpt: quote(userText),
    });
  }

  const measured = {
    chars: String(assistantText).length,
    questions: qs,
    hindi_markers: hindiMarkerCount(assistantText),
    code_fences: (String(assistantText).match(/```/g) || []).length / 2,
    step,
  };

  return { audited: true, why: null, drifts, measured };
}

/**
 * PLAN OF RECORD (7 Aug 2026). Audit ONE completed turn. Pure — no I/O, fully
 * injectable, so the selftest exercises the same function the hook calls.
 *
 *  assistantText  the FULL assistant message (never a truncated stored row)
 *  userText       his prompt that opened THIS turn (recorded at UserPromptSubmit,
 *                 "" when unavailable — the caller records WHY it was unavailable)
 *  session        forge_session.json read TOP-LEVEL (the file IS the session)
 *  prevStep       the step before this turn (from the prompt-time record)
 *  prevAxesDone   axes_done at the previous Stop — lets the ungraded-axis check
 *                 fire once per NEW mark instead of every turn forever
 *
 * STEP SCOPING is canon's own, not invented here (PROJECT_OS.md):
 *   one-idea            steps 3-6  ("Phases 3-6 ke dauraan max EK sharp check-question";
 *                                   Pehle-Guess = 2-3 Qs BY DESIGN, Jirah/Calibrate are multi-Q)
 *   dheema/tables       steps 3-9  (the teaching body; step 1 DARAAR-MAP shows 9 axes BY DESIGN)
 *   hinglish            steps 2-9 EXCEPT 7 (BOLO: "English only for the interview rep")
 *   his-level           all steps EXCEPT 9 (Jirah voices interviewer traps — a quoted
 *                                   "obviously" is the trap being modelled, not the crime)
 *   no-system           steps 3-6  (unchanged; now code-stripped)
 *   confusion/ungraded  state comparisons, step-agnostic by construction
 */
export function auditTurn({ assistantText = "", userText = "", session = null, prevStep = null, prevAxesDone = null, prevAxesDeferred = null, termState = null, linkState = null, closed = null,
  prevMoments = null, prevReps = null, repsNow = null,
  // 7 Sep 2026 — the two ends the three new carries need.
  //  prevMomentsByKind  question_moments BY KIND at this turn's opening (the
  //                     prompt-time snapshot). Only `check_q` growth is read: it
  //                     is the teacher's OWN declaration to the pacer that this
  //                     turn served an idea and asked its one check-question,
  //                     which is the C7 turn shape exactly. null = no anchor,
  //                     and this file's standing law is NO ANCHOR, NO CLAIM.
  //  intensityState     the max-intensity latch, carried across turns the way
  //                     linkState is: an axis close ARMS it, the next audited
  //                     turn either satisfies it or fires it, once.
  prevMomentsByKind = null, intensityState = null } = {}) {
  const drifts = [];
  const open = !!(session && session.concept && !session.closed_at);

  // SCOPE GATE. Outside an open forge session THE METHOD does not apply. Per his
  // 6 Aug "sab audit, no gates" ruling there is deliberately NO staleness gate and
  // NO session-identity gate here — an open session on disk means every interactive
  // turn in this project is measured, and mis-attribution is handled by evidence
  // rows + reversibility, not by silence.
  if (!open) {
    return { audited: false, why: "no open forge session — THE METHOD does not apply to this turn", drifts: [], measured: null };
  }

  const step = Number(session.step);
  const quote = (s, n = 120) => String(s || "").replace(/\s+/g, " ").slice(0, n);
  const inBody = Number.isFinite(step) && step >= 3 && step <= 6;
  const inTeaching = Number.isFinite(step) && step >= 3 && step <= 9;

  // ---- 1) ONE check-question per message (HOW_HE_LEARNS #1) — steps 3-6 ----
  const qs = countQuestions(assistantText);
  if (inBody && qs > 1) {
    drifts.push({
      rule: "one-idea",
      evidence: `${qs} question marks ended a sentence in one teaching message at step ${step} (canon: max EK sharp check-question across phases 3-6)`,
      excerpt: quote(String(assistantText).split(/(?<=\?)\s+/).filter((s) => s.includes("?")).join(" … "), 200),
    });
  }

  // ---- 1b) DHEEMA, NOT LAMBA + TABLES (HOW_HE_LEARNS #17 + his 6 Aug word) --
  const breaks = countSectionBreaks(assistantText);
  const tables = countTables(assistantText);
  if (inTeaching && (breaks > 1 || tables >= 1)) {
    const parts = [];
    if (breaks > 1) parts.push(`${breaks} section break(s) — headers/rules/tables separate DIFFERENT things, and canon is ONE thing opened all the way down`);
    if (tables >= 1) parts.push(`${tables} comparison table(s) — his own word, twice: tables confuse him; mechanism in TEXT + a numbered trace is the format`);
    drifts.push({
      rule: "dheema-not-lamba",
      evidence: parts.join("; ") + ". Never make it longer; make it deeper.",
      excerpt: quote(String(assistantText).match(/^#{1,6}\s+.*$|^\s*\|.*\|\s*$/gm)?.join(" | ") || "", 200),
    });
  }

  // ---- 2) Hinglish, not English — steps 2-9 except BOLO -------------------
  const h = hindiSignal(assistantText);
  if (Number.isFinite(step) && step >= 2 && step <= 9 && step !== 7
      && h.words > 0 && !h.devanagari && h.markers === 0) {
    drifts.push({
      rule: "hinglish",
      evidence: `ZERO Hindi function words in a teaching turn at step ${step} — this was English, and he asked twice for Hinglish (step 7 interview-rep English is exempt by canon)`,
      excerpt: quote(assistantText),
    });
  }

  // ---- 3) never place his level above his own (HOW_HE_LEARNS #10) ---------
  if (step !== 9) {
    const found = ABOVE_HIS_LEVEL.filter((p) => norm(assistantText).includes(p));
    if (found.length) {
      drifts.push({
        rule: "his-level",
        evidence: `phrase(s) that put his level above his own word: ${found.map((f) => `"${f}"`).join(", ")}`,
        excerpt: quote(assistantText, 160),
      });
    }
  }

  // ---- 4) no system/tool work mid-concept (HOW_HE_LEARNS #12) -------------
  if (inBody && mentionsSystemWork(assistantText)) {
    drifts.push({
      rule: "no-system-mid-concept",
      evidence: `a BARE repo command appeared inside the teaching body (step ${step}) — a backticked name-and-park is compliant, runnable prose is the drift`,
      excerpt: quote(assistantText, 160),
    });
  }

  // ---- 5) "samajh nahi aaya" is literal (HOW_HE_LEARNS #9) ----------------
  const saidConfused = CONFUSION_MARKERS_V2.some((m) => norm(userText).includes(m));
  if (saidConfused && Number.isFinite(prevStep) && Number.isFinite(step) && step > prevStep) {
    drifts.push({
      rule: "confusion-is-literal",
      evidence: `he said he did not understand, and the step still advanced ${prevStep} → ${step} (canon: stop there, restart from zero)`,
      excerpt: quote(userText),
    });
  }

  // ---- 6) AXIS MARKED DONE BEFORE JIRAH (the drift that opened this audit) --
  // Pure state comparison, threshold-free. axes_marked_at[x].jirah_before === 0
  // with the mark landing before step 9 is the EXACT fingerprint of the 6 Aug
  // drifts #1/#2 (axes a and b, both marked at step 3 with zero Jirah rounds) —
  // evidence that sat unread in the very object the old engine received. Fires
  // only for axes NEWLY marked since the previous Stop, so a standing condition
  // is one drift, not one per turn forever.
  if (Array.isArray(prevAxesDone) && session.axes_marked_at && Number.isFinite(step) && step < 9) {
    const done = Array.isArray(session.axes_done) ? session.axes_done : [];
    for (const ax of done) {
      if (prevAxesDone.includes(ax)) continue;
      const m = session.axes_marked_at[ax];
      if (m && typeof m === "object" && Number(m.jirah_before) === 0) {
        drifts.push({
          rule: "his-word",
          evidence: `axis "${ax}" marked done at step ${step} with ZERO Jirah rounds before it — the grade is a claim, not a grade (canon: an axis is done when it survives its own Jirah)`,
          excerpt: `axes_marked_at.${ax} = ${JSON.stringify(m)}`,
        });
      }
    }
  }

  // ---- 6b) AN UNCAPTURED REP DID NOT HAPPEN (his 30 Aug order · LR-04) -------
  // Pure state comparison, threshold-free, exactly the shape of check 6 above: two
  // counts taken at this turn's two ends, and a drift only when the pair disagrees.
  // WHY A COUNT AND NOT A JUDGEMENT: nothing here can tell whether an answer was worth
  // banking — that is the teacher's call and it stays the teacher's. What a machine CAN
  // see is that a legal question-moment was declared to the pacer and reps_log.jsonl
  // did not grow, which is the exact shape of the two post-restart sessions that banked
  // nothing at all while every downstream organ waited on their data.
  // NO ANCHOR, NO CLAIM — this file's standing law: without both ends of the window
  // (the prompt-time snapshot AND a readable rep count) it says NOTHING, rather than
  // treating a missing number as a zero. A fabricated zero here would auto-count a
  // drift against the teacher off no evidence, which is worse than silence.
  // capture.mjs remains the SOLE WRITER of reps_log.jsonl; both numbers are reads.
  const momentsNow = session.question_moments && typeof session.question_moments === "object"
    ? Object.values(session.question_moments).reduce((a, b) => a + (Number.isFinite(Number(b)) ? Number(b) : 0), 0)
    : null;
  if (Number.isFinite(prevMoments) && Number.isFinite(momentsNow) && momentsNow > prevMoments
      && Number.isFinite(prevReps) && Number.isFinite(repsNow) && repsNow <= prevReps) {
    drifts.push({
      rule: "uncaptured-rep",
      evidence: `${momentsNow - prevMoments} question-moment(s) declared this turn (${prevMoments} → ${momentsNow}) and reps_log grew by ${repsNow - prevReps} — his 30 Aug order: an uncaptured rep did not happen. Bank it now (\`node scripts/capture.mjs\`), or the answer is gone.`,
      excerpt: `question_moments total ${prevMoments} → ${momentsNow} · reps ${prevReps} → ${repsNow}`,
    });
  }

  // ---- 7) COVERAGE — core axis deferred (the half-answer class, 7 Aug 2026) --
  // The captain's worst miss finally gets a machine check. His staged evidence
  // (three of the six 6 Aug self-reports) is one class: the axis got its
  // convenient half — "wahi number jo tere kaam ka hai" — and the universal half
  // never came. Most of that class is semantic and stays HIS to flag; the ONE
  // state fingerprint a machine can read is a CORE axis landing in axes_deferred.
  // The owner PERMITS it (markAxis refuses nothing — deferral is legal for a-c,
  // e-i) and only reports it at close; canon says the core axis can NEVER be
  // deferred (CORE-NEVER-DEFERRED, PROJECT_OS.md:316). Same new-mark-only shape
  // as check 6, so a standing deferral is one drift, not one per turn forever.
  if (Array.isArray(prevAxesDeferred) && Array.isArray(session.axes_deferred)) {
    const CORE_AXES = coreAxes(session.concept);   // S10 #12 — per-concept, one reader
    for (const ax of session.axes_deferred) {
      if (prevAxesDeferred.includes(ax)) continue;
      if (CORE_AXES.includes(ax)) {
        drifts.push({
          rule: "coverage",
          evidence: `core axis "${ax}" was DEFERRED — canon: CORE-NEVER-DEFERRED (core measure/formula/range is the concept). Scope kaatna ho to PEHLE poochho; defer is for the outer axes only.`,
          excerpt: `axes_deferred = ${JSON.stringify(session.axes_deferred)}`,
        });
      }
    }
  }

  // ---- 8) NEEV-PEHLE — a term-of-art used before it was ever opened --------
  // (P1.2, 7 Aug 2026 — the sequencing defect, lexical slice; RULE_NOTES states
  // the semantic slice stays his.) Fires only in the teaching body, only when the
  // caller supplies cross-turn state (termState) — a stateless call never guesses.
  // A term this turn OPENS is clean and becomes opened; a term already flagged
  // never re-fires; closed-concept vocabulary is pre-opened.
  // 7 Sep 2026 — the watched set is now requiredTerms(THIS CONCEPT), not the
  // frozen 23. See CONCEPT_TERMS for the measurement that forced it.
  const termResult = { used: [], opened_now: [], fired: [], names_now: [] };
  if (inBody && termState && Array.isArray(termState.opened)) {
    const preOpened = new Set([...(termState.opened || []), ...(((closed || {}).vocab) || [])].map((t) => String(t).toLowerCase()));
    const flagged = new Set((termState.flagged || []).map((t) => String(t).toLowerCase()));
    const watched = requiredTerms(
      (session && session.concept) || (termState && termState.concept) || "",
      STATE_DIR,
      termState.names || [],
    );
    for (const t of watched) {
      if (!termUsed(assistantText, t)) continue;
      termResult.used.push(t);
      if (opensTerm(assistantText, t)) { termResult.opened_now.push(t); continue; }
      if (preOpened.has(t) || flagged.has(t)) continue;
      // aliases of each other ("eval set" / "evaluation set" / "test set") — one
      // opening covers the cluster
      const cluster = { "eval set": ["evaluation set", "test set"], "evaluation set": ["eval set", "test set"], "test set": ["eval set", "evaluation set"] }[t] || [];
      if (cluster.some((c) => preOpened.has(c) || termResult.opened_now.includes(c))) continue;
      termResult.fired.push(t);
      drifts.push({
        rule: "neev-pehle",
        evidence: `term-of-art "${t}" USED at step ${step} but never OPENED — no definitional line for it this concept, this turn or any before (canon HOW_HE_LEARNS #8: naya naam pehli baar aate hi EK line mein kholo; conclusion-before-foundation is the 7 Aug class)`,
        excerpt: quote(String(stripFencesKeepInline(assistantText)).split(/\n/).find((l) => termUsed(l, t)) || assistantText, 160),
      });
    }

    // ---- 8b) THE BACKTICKED NAME — list-free, and it never rots ------------
    // Every list above is a floor somebody has to remember to grow, which is the
    // failure mode that produced 8) in the first place. This half needs no list
    // at all, because HIS OWN GRAMMAR already marks the real names for us:
    // VISUAL_CONTRACT §8.1, his word "done" on 7 Sep 2026 — "`backtick` = THE
    // REAL NAME he must say in an interview. Nothing else is ever backticked."
    // So a backticked span in the teaching body IS a declared real name, and the
    // three-layer law (ASLI NAAM, opened in one line) applies to it whatever the
    // concept, forever, with nobody maintaining anything.
    // Deliberately narrow so it cannot cry wolf: prose-shaped spans only — no
    // path, no flag, no command, no code punctuation, at most three words. A span
    // that fails those tests is a code reference, not a name he must say.
    const NAME_SPAN = /^[a-z][a-z0-9 .+-]{1,38}$/i;
    const looksLikeCode = (s) => /[\\/_(){}[\]<>=|$*#@:;,"']/.test(s) || /--/.test(s)
      || /\.(mjs|js|json|jsonl|md|ts|py|html|ps1)\b/i.test(s) || s.trim().split(/\s+/).length > 3;
    const seenSpan = new Set();
    for (const m of String(assistantText || "").replace(/```[\s\S]*?```/g, " ").matchAll(/`([^`\n]{2,40})`/g)) {
      const raw = m[1].trim();
      const t = raw.toLowerCase();
      if (seenSpan.has(t)) continue;
      seenSpan.add(t);
      if (!NAME_SPAN.test(raw) || looksLikeCode(raw)) continue;
      // Source 3: whatever survives those tests is a DECLARED real name, so it
      // joins this concept's watched corpus from now on — this is the lane that
      // makes the whole check topic-agnostic and self-growing (his order, 7 Sep).
      termResult.names_now.push(t);
      if (termResult.opened_now.includes(t) || termResult.fired.includes(t)) continue;
      if (opensTerm(assistantText, t)) { termResult.opened_now.push(t); continue; }
      if (preOpened.has(t) || flagged.has(t)) continue;
      termResult.fired.push(t);
      drifts.push({
        rule: "neev-pehle",
        evidence: `backticked REAL NAME "${raw}" used at step ${step} but never OPENED — his own grammar says a backtick marks the name he must say in an interview (VISUAL_CONTRACT §8.1), and HOW_HE_LEARNS #8 says every new name is opened in ONE line the first time`,
        excerpt: quote(String(stripFencesKeepInline(assistantText)).split(/\n/).find((l) => termUsed(l, t)) || assistantText, 160),
      });
    }
  }

  // ---- 9) LINK-BACK — no closed concept was ever named this session ---------
  // (P1.1, WIDENED 7 Sep 2026 on his one word, "kardo".) Presence-of-name only
  // (RULE_NOTES). Fires ONCE per session; the latch is `flagged`.
  //
  // WHY IT WAS WIDENED. The gate was `step > 3`, written when "SAMJHAO is over"
  // was the natural moment to ask whether anything had been linked. The cost was
  // measured on 7 Sep: 826 of the 907 rows in teaching_audit.jsonl are step 3, so
  // the rule was silent across the entire teaching phase — a law with a code path
  // that could not run is L4's failure wearing a green badge.
  //
  // WHY IT DOES NOT FLOOD. A widened gate that fired on the first step-3 turn
  // would be unfair and useless — the teacher is allowed to link back later in
  // SAMJHAO. So inside step 3 the CONDITION is narrowed (never the coverage): it
  // waits until the concept has LANDED something — an axis closed, or the
  // teaching has moved past its first axis (axes_now_at holds two or more). By
  // then a session that has never named a closed concept is not "not yet", it is
  // "not going to". Past step 3 the old condition is unchanged.
  //
  // TWO HOLES CLOSED IN THE SAME PASS, both STRICTER (a gate may only tighten):
  //   · THE OPEN CONCEPT NO LONGER SATISFIES ITS OWN LINK-BACK. Live proof at the
  //     moment of the build: closedDerive() returned ["Embeddings","Inference",
  //     "sampling","Context window","context","tokenization"] while `tokenization`
  //     was the OPEN concept, so the first turn that said its own name latched
  //     `seen` and the check could never fire again. Linking a concept to itself
  //     is not a link.
  //   · WORD BOUNDARIES, NOT SUBSTRINGS. The closed name "context" was satisfied
  //     by "in this context" in ordinary prose. Same tolerance as before for the
  //     singular/plural pair ("embedding" still names "Embeddings").
  let linkbackNamedNow = false, linkbackFired = false;
  const openConcept = String((session && session.concept) || "").toLowerCase().trim();
  const linkTargets = (closed && Array.isArray(closed.names) ? closed.names : [])
    .filter((n) => String(n).toLowerCase().trim() !== openConcept);
  if (linkState && linkTargets.length) {
    const body = stripCode(assistantText);
    // termUsed() word-bounds and tolerates a trailing s/es on the TEXT side; the
    // singular of a plural NAME ("embedding" for the closed concept "Embeddings")
    // is the other direction and is tried explicitly, exactly as the substring
    // form did before this pass — the tightening is boundaries, never tolerance.
    const namesAny = (n) => {
      const s = String(n);
      return termUsed(body, s) || (s.length > 3 && /s$/i.test(s) && termUsed(body, s.slice(0, -1)));
    };
    linkbackNamedNow = linkTargets.some(namesAny);
    // Has this concept LANDED anything yet? The step-3 arming condition.
    const axesDoneN = Array.isArray(session.axes_done) ? session.axes_done.length : 0;
    const axesSeenN = session.axes_now_at && typeof session.axes_now_at === "object"
      ? Object.keys(session.axes_now_at).length : 0;
    const landed = axesDoneN >= 1 || axesSeenN >= 2;
    const inWindow = Number.isFinite(step)
      && step <= 9
      && (step > 3 || (step === 3 && landed));
    if (inWindow && !linkState.seen && !linkState.flagged && !linkbackNamedNow) {
      linkbackFired = true;
      const where = step === 3
        ? `SAMJHAO is under way (step 3) and this concept has already landed an axis`
        : `SAMJHAO is over (step ${step})`;
      drifts.push({
        rule: "link-back",
        evidence: `${where}, and NO already-closed concept has been named this session — canon: naya concept hamesha band ho chuke concepts se NAAM le kar jodo (closed, excluding the open concept itself: ${linkTargets.join(" · ")})`,
        excerpt: quote(assistantText, 120),
      });
    }
  }

  // ---- 10) TERMINOLOGY — Hindi name-replacement with the English term absent --
  // (P1.1, floor pairs only — RULE_NOTES.) Both-present is a gloss and is clean.
  if (inTeaching && step !== 7) {
    for (const [hindi, english] of TERM_TRANSLATIONS) {
      if (termUsed(assistantText, hindi) && !termUsed(assistantText, english)) {
        drifts.push({
          rule: "terminology",
          evidence: `"${hindi}" used as the NAME with "${english}" absent from the message — Hindi anuvaad se naam mat badlo (analogy alag cheez hai, naam alag); both together is a legal gloss`,
          excerpt: quote(String(stripCode(assistantText)).split(/\n/).find((l) => termUsed(l, hindi)) || assistantText, 140),
        });
      }
    }
  }

  // ---- 11) DECIDED — re-opening a PERMANENT ruling -------------------------
  // (P1.1, two fingerprints only — RULE_NOTES.)
  for (const d of DECIDED_RULINGS) {
    if (d.rx.test(stripCode(assistantText))) {
      drifts.push({
        rule: "decided",
        evidence: `re-litigates a settled ruling: ${d.ruling}`,
        excerpt: quote(String(stripCode(assistantText)).match(d.rx)?.[0] || assistantText, 140),
      });
    }
  }

  // ═══ HIS FOUR PER-TURN CARRIES — checks 12-14 (7 Sep 2026) ═══════════════
  // The detectors, their measurements and the traps they were tuned against all
  // live in the block above countTables. Everything below is scope + wiring.

  // THE IDEA-DELIVERY ANCHOR, shared by checks 12 and 13(ii). Two independent
  // ways of knowing this turn served an idea, and BOTH are the teacher's own act,
  // never an inference about "does this look like teaching":
  //   · the ASLI NAAM act — the real name put on the page in an emphasised term;
  //   · a check_q moment DECLARED to the pacer inside this turn's window — the
  //     C7 turn shape by the teacher's own hand (the same anchor check 6b trusts).
  // WHY AN ANCHOR AT ALL, stated plainly: under his "sab audit, no gates" ruling
  // every interactive Stop in this project is audited while a forge session sits
  // open on disk, and the session HAS sat open for days at a time — 826 of the 907
  // rows on disk at build time were step 3, and a replay of the 519 live rows of
  // 1-7 Sep found them overwhelmingly to be ENGINEERING turns, not teaching. An
  // idea-delivery law fired on those would produce hundreds of false auto-hits
  // against his teaching contract, which is worse than no checker at all.
  const kindNow = (session.question_moments && typeof session.question_moments === "object")
    ? session.question_moments : null;
  const checkQNow = kindNow && Number.isFinite(Number(kindNow.check_q)) ? Number(kindNow.check_q) : null;
  const checkQPrev = prevMomentsByKind && typeof prevMomentsByKind === "object"
    && Number.isFinite(Number(prevMomentsByKind.check_q)) ? Number(prevMomentsByKind.check_q) : null;
  const momentAnchor = Number.isFinite(checkQPrev) && Number.isFinite(checkQNow) && checkQNow > checkQPrev;
  const namingAct = asliNaamAct(assistantText);
  const ideaDelivery = inBody && (namingAct || momentAnchor);
  const anchorVia = !ideaDelivery ? null : (namingAct ? "asli-naam act" : "check_q moment declared to the pacer");

  // ---- 12) THREE-LAYER DELIVERY (act-mt2kgbt7, his ruling 21 Aug 2026) ------
  // "har idea teen layer mein — DUKAAN (everyday analogy) then ASLI NAAM (the
  // real term) then TECHNICAL LINE (how it is actually said in AI language).
  // Analogy akela kaafi nahi: analogy interview mein bol nahi sakte."
  // Measured 7 Sep across a whole tokenization sitting: layer 3 landed ZERO times.
  // The check is a conditional on the layer that leaves a mark: layer 2 present,
  // layer 3 absent. It never claims the reverse — RULE_NOTES says what it misses.
  const techLine = technicalLine(assistantText);
  if (ideaDelivery && !techLine) {
    drifts.push({
      rule: "act-mt2kgbt7",
      evidence: `an idea was opened at step ${step} (${anchorVia}) with NO TECHNICAL LINE — layer 3 of three. R1, his ruling 21 Aug 2026: DUKAAN → ASLI NAAM → TECHNICAL LINE, "woh sentence jo tum interview mein bologe". Analogy plus term is TWO layers, and the missing one is the one he has to say out loud in an interview.`,
      excerpt: quote(assistantText, 160),
    });
  }

  // ---- 13) POSITION BY NAME (act-mt2kgn09 · C7) — two failures -------------
  // (i) THE BANNED COUNT, his ruling rul-mtdep0iye1, 22 Aug 2026 — the higher-
  //     value half and the strict one. It fires across the teaching band on any
  //     turn, anchored or not, because the counter is banned on every surface he
  //     reads; it does not need to know whether an idea was being served.
  //     0 false positives across 519 live rows (see the detector's own note).
  const cf = (Number.isFinite(step) && step >= 2 && step <= 9) ? countForm(assistantText) : null;
  if (cf) {
    drifts.push({
      rule: "act-mt2kgn09",
      evidence: `an ABSTRACT PROGRESS COUNTER reached him at step ${step}: "${cf.match}" (${cf.form} form). His ruling rul-mtdep0iye1, 22 Aug 2026, verbatim: "please drop this vague things like idea x out of y, i want to see the real terms and concept names… i have adhd pi bro, don't forget it." The lawful shape is a NAMED position — TOKENIZATION › AXIS b (sequence length) › the named micro-step. C7's pacing law is untouched; only the LABEL died.`,
      excerpt: quote(String(stripCode(assistantText)).split(/\n/).find((l) => countForm(l)) || assistantText, 160),
    });
  }
  // (ii) NO POSITION AT ALL — anchored, because an unanchored version would flag
  //      every engineering turn riding the open session (see the anchor's note).
  if (ideaDelivery && !cf && !namedPosition(assistantText)) {
    drifts.push({
      rule: "act-mt2kgn09",
      evidence: `an idea was served at step ${step} (${anchorVia}) carrying NO POSITION at all — C7, architect ruling 21 Aug 2026: har turn apni jagah NAAM se carry kare. He must be able to see where he is without asking: TOKENIZATION › AXIS b (sequence length) › the named micro-step, and the next step named too. Not a count — a name.`,
      excerpt: quote(assistantText, 160),
    });
  }

  // ---- 14) MAX-INTENSITY CHECK (max-intensity-check + adhd_intensity) ------
  // His 19-Aug rulings: after each axis closes, check EXPLICITLY whether depth,
  // breadth and interaction were at maximum, and name anything below standard in
  // the NEXT turn. Pure state comparison at the front — the same new-mark-only
  // shape as checks 6 and 7 — with a one-turn latch behind it, because his own
  // words put the report in the NEXT turn: an axis close ARMS, and the check
  // fires only if neither the closing turn nor the one after it carried it.
  // WHAT IS NOT OBSERVABLE, said plainly rather than proxied: the DAY-CLOSE half
  // of the same rule. A day close leaves no mark in forge_session.json, so there
  // is no pair of ends to compare and this organ stays silent on it (RULE_NOTES).
  // THE LATCH IS PER AXIS, NOT PER SESSION. His rule is "har topic ke samjhao ke
  // baad" — after EACH axis — so a session-wide flag would report the first miss
  // and go quiet for the other eight. Checks 6 and 7 are the precedent: one drift
  // per NEW mark, never one per turn. `flagged_axes` holds the axes already
  // reported, so nine axis closes can produce at most nine drifts and a standing
  // condition still produces none.
  const intensityNow = intensityCheck(assistantText);
  const intensityRes = { check_now: intensityNow, armed: null, fired: null, cleared: false };
  if (intensityState && typeof intensityState === "object") {
    const pending = intensityState.pending_axis || null;
    const already = Array.isArray(intensityState.flagged_axes) ? intensityState.flagged_axes : [];
    if (intensityNow) intensityRes.cleared = true;
    else if (pending && !already.includes(pending)) {
      intensityRes.fired = pending;
      drifts.push({
        rule: "max-intensity-check",
        evidence: `axis "${pending}" closed and the intensity check never came — not on the closing turn, not on this one. His rulings (19 Aug 2026): "Har topic ke samjhao ke baad explicitly check karo ki intensity aur depth maximum thi ya nahi… Agar kuch bhi standard se niche hai toh next turn mein mujhe explicitly batao" + "depth, breadth, aur interaction maximum". Name all three and give the verdict — a silent pass is the drift.`,
        excerpt: quote(assistantText, 160),
      });
    }
  }
  // Arm on a NEWLY closed axis, and only when the closing turn did not already
  // carry the check. Same new-mark-only discipline as check 6: a standing closed
  // axis arms nothing, so this can never become one drift per turn forever.
  if (Array.isArray(prevAxesDone) && Array.isArray(session.axes_done)) {
    const fresh = session.axes_done.filter((ax) => !prevAxesDone.includes(ax));
    if (fresh.length && !intensityNow) intensityRes.armed = fresh[fresh.length - 1];
  }

  // ---- MEASURED ONLY, NEVER JUDGED ---------------------------------------
  const measured = {
    chars: String(assistantText).length,
    questions: qs,
    hindi_markers: h.markers,          // a real count — the 999 sentinel stays in the frozen engine
    devanagari: h.devanagari,
    words: h.words,
    code_fences: (String(assistantText).match(/```/g) || []).length / 2,
    section_breaks: breaks,
    tables,
    step: Number.isFinite(step) ? step : null,
    // 7 Sep 2026 — the four carries, MEASURED on every audited turn whether or
    // not they fired. This is the lane that answers "how often is layer 3
    // actually delivered", which nothing could answer before today; it is data,
    // judged by nobody, exactly like `chars` and `hindi_markers`.
    idea_delivery: ideaDelivery,
    idea_anchor: anchorVia,
    technical_line: techLine ? techLine.via : null,
    named_position: namedPosition(assistantText),
    count_form: cf ? cf.form : null,
    intensity_check: intensityNow,
  };

  return {
    audited: true, why: null, drifts, measured, terms: termResult,
    linkback: { named_now: linkbackNamedNow, fired: linkbackFired },
    intensity: intensityRes,
  };
}

// ---------------------------------------------------------------------------
// THE HOOK PATH. UserPromptSubmit records his prompt; Stop audits the turn,
// auto-counts measured drifts, stamps the heartbeat. Never prints, never throws.
// ---------------------------------------------------------------------------

// FROZEN 6 Aug 2026 — THE DEAD READER, byte-for-byte, pinned by the selftest
// against the real live file. `.session` does not exist; the file IS the session.
export function readForgeSessionLegacy() {
  return (readJson(join(STATE_DIR, "forge_session.json")) || {}).session || null;
}

// PLAN OF RECORD (7 Aug 2026). Top-level read, mirroring the owner's own load()
// contract (forge_session.mjs:459-463: object, not array, `concept` required;
// absence of `closed_at` means open — close() writes it top-level, verified at
// forge_session.mjs:1392). Returns {session, why} so a null is never silent about
// WHICH null it is — "no file", "unreadable/shapeless", and "closed" are three
// different facts, and collapsing them is how the first death went unnoticed.
export function readForgeSession() {
  const p = join(STATE_DIR, "forge_session.json");
  if (!existsSync(p)) return { session: null, why: "no forge_session.json on disk" };
  const j = readJson(p);
  if (!j || typeof j !== "object" || Array.isArray(j) || !j.concept) {
    return { session: null, why: "forge_session.json exists but is unreadable or shapeless — PROBLEM-1 class, investigate (the reader and the writer disagree)" };
  }
  return { session: j, why: null };
}

// FROZEN 6 Aug 2026 — the original staging shell-out. No longer on any live path:
// under the two-lane ruling the audit's lane is `autohit` (counts, nobody asked),
// not `flag` (stages for his word). Kept whole for the record.
function stageDrift(d) {
  try {
    spawnSync(process.execPath, [
      join(__dirname, "teaching_contract.mjs"), "flag", d.rule,
      "--why", `[auto] ${d.evidence}`,
    ], { timeout: 5000, stdio: "ignore" });
  } catch { /* a checker must never break the session */ }
}

// PLAN OF RECORD (7 Aug 2026). Auto-count through teaching_contract's own CLI
// (single-writer law) — and READ THE RESULT. The old path ignored spawnSync's
// return entirely, so an unknown rule id or a dead child vanished without trace;
// now every audit row records whether each drift actually landed.
// ARSENAL_AUDIT_NO_SPAWN is the selftest's seam: the integration test must not
// touch his live teaching_contract.json.
function contractCall(args) {
  if (process.env.ARSENAL_AUDIT_NO_SPAWN === "1") return { ok: null, skipped: true };
  try {
    const r = spawnSync(process.execPath, [join(__dirname, "teaching_contract.mjs"), ...args],
      { timeout: 5000, stdio: "ignore" });
    if (r.error) return { ok: false, error: String(r.error && r.error.code || r.error) };
    return { ok: r.status === 0, status: r.status };
  } catch (e) { return { ok: false, error: String(e && e.code || e) }; }
}
const autoHit = (d) => contractCall(["autohit", d.rule, "--why", `[auto] ${d.evidence}`]);
const stampChecked = () => contractCall(["checked"]);

function readLast() { return readJson(LAST); }
function writeLastReal(obj) {
  // C2 (9 Aug 2026): was a bare truncate-then-write firing on EVERY prompt AND Stop —
  // the exact torn-read window teaching_contract.mjs documents repairing on 6 Aug.
  // Per-pid tmp + rename: a parallel session sees old bytes or new, never half.
  try {
    const tmp = `${LAST}.tmp${process.pid}`;
    writeFileSync(tmp, JSON.stringify(obj, null, 1));
    renameSync(tmp, LAST);
  } catch { /* never block */ }
}
function appendLogReal(row) {
  try { appendFileSync(LOG, JSON.stringify(row) + "\n", "utf8"); } catch { /* never block */ }
}

const liveIO = () => ({ writeLast: writeLastReal, appendLog: appendLogReal, autoHit, stampChecked });

// His prompt, recorded the moment it exists. The Stop payload carries NO user text
// (hooks/afferent-post.mjs:59-62 is the field map) — this write is the only reason
// confusion-is-literal can ever fire. step is captured HERE because prompt-time
// step IS "the step before this turn", exactly the prevStep the check needs.
// LR-04 (W0-D, 2 Sep 2026): the two ends of the rep window. Both are READS —
// capture.mjs is and stays the sole writer of reps_log.jsonl. A missing or unreadable
// file returns null, never 0: "I could not count" and "there are none" are different
// facts, and collapsing them would auto-count a drift against the teacher off nothing.
function repsCount(path = join(STATE_DIR, "reps_log.jsonl")) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).length;
  } catch { return null; }
}
const momentsTotal = (session) => (session && session.question_moments && typeof session.question_moments === "object"
  ? Object.values(session.question_moments).reduce((a, b) => a + (Number.isFinite(Number(b)) ? Number(b) : 0), 0)
  : null);
// 7 Sep 2026 — the same window, kept BY KIND. LR-04's total answers "was anything
// declared"; the C7 checks need "was a CHECK-QUESTION declared", because a
// pehle_guess turn legitimately serves no idea and a jirah turn is grilling, not
// teaching. A plain object copy, never a reference into the live session.
const momentsByKind = (session) => (session && session.question_moments && typeof session.question_moments === "object"
  ? { ...session.question_moments } : null);

function promptHook(hook) {
  const { session } = readForgeSession();
  const last = readLast() || {};
  writeLastReal({
    ...last,
    prompt: {
      text: String(hook.prompt || ""),
      step: session && Number.isFinite(Number(session.step)) ? Number(session.step) : null,
      // LR-04 — the OPENING end of this turn's window, captured for the same reason
      // `step` is: prompt-time IS "before this turn", and it is the only moment at
      // which that number can be taken honestly.
      moments: momentsTotal(session),
      moments_by_kind: momentsByKind(session),   // 7 Sep — the C7 anchor's opening end
      reps: repsCount(),
      session_id: typeof hook.session_id === "string" ? hook.session_id : null,
      at: new Date().toISOString(),
    },
    checked_rules: CHECKED_RULES,
  });
}

// Audit the completed turn. Every write goes through `io` so the probe and the
// selftest run THIS function — the real path, not a parallel one.
export function stopHook(hook, io) {
  const { session, why: readWhy } = readForgeSession();
  const last = readLast() || {};
  const sid = typeof hook.session_id === "string" ? hook.session_id : null;
  const now = new Date().toISOString();

  // Pair this Stop with ITS OWN prompt — same Claude Code session, not yet
  // consumed. A different session's prompt (parallel-session interleave) is
  // discarded, never silently reused; the row says which happened.
  const p = last.prompt || null;
  const paired = !!(p && sid && p.session_id === sid && !p.consumed_at);
  const userText = paired ? String(p.text || "") : "";
  const userTextSource = paired ? "fresh" : (p ? "session-mismatch (parallel session's prompt discarded)" : "missing (no prompt recorded)");
  const prevStep = paired && Number.isFinite(p.step) ? p.step
    : (last.stop && Number.isFinite(last.stop.step) ? last.stop.step : null);
  const prevAxesDone = last.stop && Array.isArray(last.stop.axes_done) ? last.stop.axes_done : null;
  const prevAxesDeferred = last.stop && Array.isArray(last.stop.axes_deferred) ? last.stop.axes_deferred : null;
  // LR-04 — the window's two ends, resolved exactly the way prevStep is: this turn's
  // OWN prompt when it paired, otherwise the previous Stop. A parallel session's prompt
  // is discarded there and is discarded here, for the same reason: a window whose ends
  // come from two different conversations measures nothing.
  const prevMoments = paired && Number.isFinite(p.moments) ? p.moments
    : (last.stop && Number.isFinite(last.stop.moments) ? last.stop.moments : null);
  const prevReps = paired && Number.isFinite(p.reps) ? p.reps
    : (last.stop && Number.isFinite(last.stop.reps) ? last.stop.reps : null);
  const repsNow = repsCount();
  // 7 Sep — resolved exactly the way prevMoments is, and for the same reason: a
  // window whose ends come from two different conversations measures nothing.
  const prevMomentsByKind = (paired && p.moments_by_kind && typeof p.moments_by_kind === "object") ? p.moments_by_kind
    : ((last.stop && last.stop.moments_by_kind && typeof last.stop.moments_by_kind === "object") ? last.stop.moments_by_kind : null);

  // Cross-turn state for neev-pehle + link-back (P1.1/P1.2), keyed by CONCEPT —
  // a term opened in yesterday's session of the same concept stays opened (canon
  // is "pehli baar", first time EVER for this concept, not first time today).
  // This file is teaching_audit's own (single-writer law), so the state rides it.
  const concept = session ? String(session.concept || "") : "";
  // C4 (9 Aug 2026): terms state is now a per-concept MAP — the old single slot
  // meant switching concepts discarded the previous concept's opened-set, so a
  // later re-forge could re-fire neev-pehle on terms he already owns (canon is
  // "pehli baar EVER for this concept"). The legacy `terms` slot still reads as
  // a fallback so live state migrates without a manual step.
  const termsByConcept = (last.terms_by_concept && typeof last.terms_by_concept === "object") ? last.terms_by_concept : {};
  const terms0 = termsByConcept[concept]
    || ((last.terms && last.terms.concept === concept) ? last.terms : { concept, opened: [], flagged: [], names: [] });
  const link0 = (last.linkback && last.linkback.concept === concept && last.linkback.session === (session && session.started_at))
    ? last.linkback : { concept, session: session && session.started_at, seen: false, flagged: false };
  const closed = closedDerive(STATE_DIR, concept);   // 7 Sep: never pre-open the concept being taught
  // 7 Sep — the max-intensity latch, keyed the same way link-back is: per CONCEPT
  // and per forge SESSION, so a new session never inherits a stale armed axis.
  const int0 = (last.intensity && last.intensity.concept === concept && last.intensity.session === (session && session.started_at))
    ? last.intensity : { concept, session: session && session.started_at, pending_axis: null, flagged_axes: [] };

  const res = auditTurn({
    assistantText: String(hook.last_assistant_message || ""),
    userText, session, prevStep, prevAxesDone, prevAxesDeferred,
    termState: terms0, linkState: link0, closed,
    prevMoments, prevReps, repsNow,
    prevMomentsByKind, intensityState: int0,
  });

  const why = res.audited ? null : (readWhy || res.why);

  // Roll the state forward off what the engine measured (opened accumulates for
  // the concept's lifetime; a fired term goes to flagged so it never re-fires;
  // link-back is per-SESSION and latches on first naming or first flag).
  const terms1 = res.audited ? {
    concept,
    opened: [...new Set([...(terms0.opened || []), ...(res.terms?.opened_now || [])])],
    flagged: [...new Set([...(terms0.flagged || []), ...(res.terms?.fired || [])])],
    // 7 Sep — the self-growing, topic-agnostic corpus: every real name this
    // concept's teaching has ever DECLARED in backticks. Nobody maintains it.
    names: [...new Set([...(terms0.names || []), ...(res.terms?.names_now || [])])],
  } : terms0;
  const link1 = res.audited ? {
    ...link0,
    seen: !!(link0.seen || res.linkback?.named_now),
    flagged: !!(link0.flagged || res.linkback?.fired),
  } : link0;
  // The intensity latch rolls forward: a check delivered CLEARS the pending axis,
  // a fire latches `flagged` so one axis close is one drift and never a per-turn
  // repeat, and a newly-closed axis arms the next turn.
  const int1 = res.audited ? {
    ...int0,
    pending_axis: res.intensity?.armed
      || (res.intensity?.cleared || res.intensity?.fired ? null : int0.pending_axis),
    flagged_axes: [...new Set([
      ...(Array.isArray(int0.flagged_axes) ? int0.flagged_axes : []),
      ...(res.intensity?.fired ? [res.intensity.fired] : []),
    ])],
  } : int0;

  // Auto-count first, so the log row can record what actually landed.
  const staged = [];
  if (res.audited) {
    for (const d of res.drifts) staged.push({ rule: d.rule, ...io.autoHit(d) });
  }

  // The last-run record is the organ's proof-of-life AND its honesty surface:
  // audited/why on disk is what separates "correctly quiet" from "dead" — the
  // two states whose indistinguishability let the first death survive.
  io.writeLast({
    prompt: p ? { ...p, consumed_at: paired ? now : (p.consumed_at || null) } : null,
    stop: {
      at: now,
      session_id: sid,
      step: session && Number.isFinite(Number(session.step)) ? Number(session.step) : null,
      audited: res.audited,
      why,
      drifts: res.drifts.length,
      axes_done: session && Array.isArray(session.axes_done) ? session.axes_done : [],
      axes_deferred: session && Array.isArray(session.axes_deferred) ? session.axes_deferred : [],
      // LR-04 — the CLOSING end, which is also the next turn's opening end when no
      // prompt pairs (an assistant-only turn, or a UserPromptSubmit that never fired).
      // Without it the rule would go permanently silent on exactly the sessions that
      // skip the prompt hook, which is the wrong direction for a capture law.
      moments: momentsTotal(session),
      moments_by_kind: momentsByKind(session),   // 7 Sep — the closing end, = the next turn's opening end when no prompt pairs
      reps: repsNow,
    },
    terms: terms1,
    terms_by_concept: { ...termsByConcept, [concept]: terms1 },   // C4: no concept's opened-set is ever displaced again
    linkback: link1,
    intensity: int1,
    checked_rules: CHECKED_RULES,
  });

  if (!res.audited) return { res, staged, userTextSource };

  io.appendLog({
    ts: now,
    session_id: sid,
    concept: session.concept,
    step: res.measured.step,
    drifts: res.drifts.map((d) => d.rule),
    evidence: res.drifts.map((d) => d.evidence),
    excerpts: res.drifts.map((d) => d.excerpt),
    measured: res.measured,
    user_text_source: userTextSource,
    staged,
  });

  // The heartbeat — "I looked". forge_session.mjs:378-393 has read this stamp off
  // teaching_contract.json since audit #40; nothing ever wrote it until now. This
  // is what lets a clean close finally say "none — MEASURED", and what makes the
  // NEXT silent death of this organ self-announcing at every close.
  io.stampChecked();
  return { res, staged, userTextSource };
}

async function readStdinText() {
  // THE STDIN HANDOFF (18 Aug 2026, Block 1 — scripts/turn_hook.mjs contract 1).
  // Under the one-process dispatcher fd 0 has ALREADY been read once; the payload
  // is parked on this named global. Standalone (its own process): unset ⇒ read fd 0.
  const handed = globalThis.__ARSENAL_HOOK_STDIN__;
  if (typeof handed === "string") return handed;
  // A human at a terminal would hang on a pipe that never ends — same guard and
  // same reason as teaching_contract.mjs:629. Under the hook, stdin is a pipe.
  if (process.stdin.isTTY) return null;
  // setEncoding BEFORE iterating: bare `raw += chunk` on Buffers decodes each
  // chunk separately, so a multibyte (Devanagari) char straddling a 64KB chunk
  // boundary would decode to U+FFFD and corrupt the very text being measured.
  process.stdin.setEncoding("utf8");
  let raw = "";
  try { for await (const c of process.stdin) raw += c; } catch { return null; }
  return raw;
}

async function hookMain() {
  // SELF-INJECTION GUARD — the one gate his "sab audit" ruling keeps, and the same
  // scar every sibling hook organ already carries (afferent-post.mjs:36-39,
  // teaching_contract.mjs print, forge_session.mjs contract/boot): headless organ
  // output is the machine talking to itself, not him being taught. Auditing it
  // would measure the wrong population — 72.7% of afferents were self-talk before
  // afferent-post grew this exact guard.
  if (process.env.ARSENAL_ORGAN === "1") return;
  const raw = await readStdinText();
  if (raw === null) return;
  let hook = {};
  try { hook = JSON.parse(raw || "{}"); } catch { return; }
  const ev = hook.hook_event_name || "";
  if (ev === "UserPromptSubmit") return promptHook(hook);
  if (ev === "Stop") { stopHook(hook, liveIO()); return; }
}

// ---------------------------------------------------------------------------
// PROBE — the real path, run on demand, against LIVE state, writing NOTHING.
// "Unrun system = hypothesis": this is how the hypothesis gets run in daylight.
// It calls the SAME stopHook the hook calls; only the io is a collector, so what
// you see is what a real Stop would have done — including the scope verdict and
// exactly which drifts would auto-count.
// ---------------------------------------------------------------------------
const SAMPLE_DIRTY = "## Token\nA token is the smallest unit. What do you think it is? And how does the vocabulary map it?\n\n## Sampling\n| a | b |\n|---|---|\n| 1 | 2 |\nRun node scripts/capture.mjs rep now.";
const SAMPLE_CLEAN = "Token wo sabse chhoti unit hai jo model padhta hai. Ab bolo — tumhare hisaab se 'khaana' kitne token banega?";

function probe(argv) {
  const clean = argv.includes("--clean");
  const ti = argv.indexOf("--text");
  const text = ti >= 0 ? String(argv[ti + 1] || "") : (clean ? SAMPLE_CLEAN : SAMPLE_DIRTY);
  const io = {
    writeLast: () => {},
    appendLog: () => {},
    autoHit: (d) => ({ ok: null, skipped: "probe — dry run, nothing counted" }),
    stampChecked: () => {},
  };
  const { res, userTextSource } = stopHook({ hook_event_name: "Stop", session_id: "probe", last_assistant_message: text }, io);
  console.log("\n== TEACHING AUDIT — PROBE (dry run · live state read · nothing written) ==\n");
  if (!res.audited) {
    console.log(`  NOT AUDITED — ${readForgeSession().why || res.why}`);
    console.log("  (This is the scope verdict a real Stop would get right now.)\n");
    return;
  }
  const s = readForgeSession().session;
  console.log(`  scope: OPEN forge session '${s.concept}' at step ${s.step} — this turn WOULD be audited`);
  console.log(`  userText source: ${userTextSource}`);
  console.log(`  probe text: ${JSON.stringify(text.slice(0, 80))}${text.length > 80 ? "…" : ""}`);
  if (!res.drifts.length) console.log("\n  CLEAN — zero drifts. Nothing would be counted. (The detector CAN say clean.)");
  else {
    console.log(`\n  ${res.drifts.length} drift(s) WOULD auto-count:`);
    for (const d of res.drifts) console.log(`   · [${d.rule}] ${d.evidence}`);
  }
  console.log(`\n  measured: ${JSON.stringify(res.measured)}\n`);
}

// ---------------------------------------------------------------------------
function report() {
  const last = readLast();
  console.log("\n== TEACHING AUDIT ==");
  if (last && last.stop) {
    console.log(`  last hook run: ${last.stop.at} · audited=${last.stop.audited}${last.stop.why ? ` · why: ${last.stop.why}` : ""} · session ${String(last.stop.session_id || "?").slice(0, 8)}`);
  } else {
    console.log("  last hook run: never recorded (if hooks are firing, this line itself is a finding)");
  }
  // COVERAGE, derived live — never hardcoded, so it cannot rot on the next `add`.
  const tc = readJson(join(STATE_DIR, "teaching_contract.json"));
  if (tc && Array.isArray(tc.rules)) {
    const unchecked = tc.rules.map((r) => r.id).filter((id) => !CHECKED_RULES.includes(id));
    console.log(`  coverage: checks exist for ${tc.rules.length - unchecked.length} of ${tc.rules.length} contract rules`
      + (unchecked.length ? ` — UNCHECKED: ${unchecked.join(" · ")}` : ""));
    // W0-D (2 Sep 2026) — THE OTHER DIRECTION, which nothing said until today. The line
    // above answers "which of his rules has no check". The failure that actually costs
    // something is the reverse: a check that EMITS a rule id the contract has no row
    // for. Then every autohit for it exits 1 and the drift is measured, staged and
    // dropped — silently, because the auto-count's failure lives in a jsonl field and
    // not on any screen. It is a live risk, not a hypothetical: teaching_contract.json
    // is gitignored, so a rule added through its CLI does not travel with the commit
    // that taught this file to emit it (the seed carries it now — this is the tripwire
    // for the day the seed and CHECKED_RULES drift apart again).
    const unwired = CHECKED_RULES.filter((id) => !tc.rules.some((r) => r.id === id));
    if (unwired.length) {
      console.log(`  ⚠ UNWIRED: ${unwired.join(" · ")} — a check exists and emits this id, but the contract has NO row for it,`);
      console.log("    so every auto-count against it fails and the drift is measured and then dropped. Fix: `node scripts/teaching_contract.mjs add <id> \"<line>\"`.");
    }
    console.log("  ('no drift caught' is NOT 'taught correctly' — only the checked rules are checked,");
    console.log("   and for these, only the stated slice:)");
    for (const [r, note] of Object.entries(RULE_NOTES)) {
      if (CHECKED_RULES.includes(r) && tc.rules.some((x) => x.id === r)) console.log(`   · ${r} — ${note}`);
    }
  }
  if (!existsSync(LOG)) { console.log("  no turns audited yet (it runs only while a forge session is open).\n"); return; }
  const rows = readFileSync(LOG, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!rows.length) { console.log("  no turns audited yet.\n"); return; }
  const withDrift = rows.filter((r) => Array.isArray(r.drifts) && r.drifts.length);
  const byRule = {};
  for (const r of rows) for (const d of (r.drifts || [])) byRule[d] = (byRule[d] || 0) + 1;
  console.log(`  ${rows.length} turn(s) audited · ${withDrift.length} with drift`);
  if (!withDrift.length) { console.log("  no drift caught in the audited turns.\n"); return; }
  for (const [k, v] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}×  ${k}`);
  console.log("\n  last 3 with drift:");
  for (const r of withDrift.slice(-3)) console.log(`   · ${String(r.ts).slice(0, 16)} step ${r.step} — ${(r.evidence || []).join(" | ")}`);
  console.log("");
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const skip = (name, why) => console.log(`  ~ SKIP ${name} — ${why}`);
  const OPEN = { concept: "hallucinations", step: 4, closed_at: null };

  console.log("\n== teaching_audit selftest ==\n");

  // ========================================================================
  // PART 1 — THE FROZEN ENGINE, pinned byte-for-byte behaviour (6 Aug). These
  // are the original 25 assertions, pointed at auditTurnLegacy and its frozen
  // helpers, so the old behaviour stays reproducible from inside this file.
  // ========================================================================
  assert("no open forge session ⇒ NOT audited (ops turns are not teaching turns)",
    auditTurnLegacy({ assistantText: "Pure English, many? questions? here?", session: null }).audited === false);
  assert("a CLOSED session is not audited either",
    auditTurnLegacy({ assistantText: "x", session: { ...OPEN, closed_at: "2026-08-04T00:00:00Z" } }).audited === false);
  assert("FROZEN — two check-questions caught",
    auditTurnLegacy({ assistantText: "Token kya hota hai? Aur vocabulary kya hai?", session: OPEN })
      .drifts.some((d) => d.rule === "one-idea"));
  assert("FROZEN — one check-question clean",
    !auditTurnLegacy({ assistantText: "Ab bolo — token kya hota hai?", session: OPEN })
      .drifts.some((d) => d.rule === "one-idea"));
  assert("FROZEN — a `?` inside a fenced code block is NOT a question put to him",
    countQuestionsLegacy("dekho ye code:\n```\nx = a ? b : c;\ny = d ? e : f;\n```\nsamajh aaya?") === 1);
  assert("FROZEN — three headers caught",
    auditTurnLegacy({ assistantText: "## Token\nkuch text hai\n## Vocabulary\naur text hai\n## Sampling\nphir text hai", session: OPEN })
      .drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("FROZEN — a LONG message opening ONE thing is clean (length is not the rule)",
    !auditTurnLegacy({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai. ".repeat(60) + "Ab bolo — tumhare hisaab se kya hoga?", session: OPEN })
      .drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("FROZEN — a NUMBERED TRACE is dheema, never lamba (HOW_HE_LEARNS #3)",
    !auditTurnLegacy({ assistantText: "Chalo trace karte hain:\n1. pehle tokenizer chalta hai\n2. phir vocabulary lookup\n3. phir next-token prediction\n4. phir sampling\nSamajh aaya?", session: OPEN })
      .drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("FROZEN — a comparison TABLE counts as many-things-at-once",
    countSectionBreaks("| a | b |\n|---|---|\n| 1 | 2 |") >= 1);
  assert("FROZEN — a `---` inside a fenced code block is not a section break",
    countSectionBreaks("dekho:\n```\n---\n---\n```\nbas") === 0);
  assert("FROZEN — a fully English teaching turn is caught",
    auditTurnLegacy({ assistantText: "A token is the smallest unit the model reads.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("FROZEN — Hinglish passes",
    !auditTurnLegacy({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("FROZEN — technical terms stay English and are still clean Hinglish",
    !auditTurnLegacy({ assistantText: "Yahan tokenizer vocabulary se next-token prediction karta hai, phir sampling hoti hai.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("FROZEN — Devanagari counts as Hindi via the 999 sentinel (the sentinel stays in THIS engine only)",
    hindiMarkerCount("टोकन सबसे छोटी इकाई होती है") === 999);
  assert("HOMOGRAPH GUARD — 'the'/'to'/'me' do not make an English sentence read as Hinglish",
    hindiMarkerCount("A token is the smallest unit the model reads, so it has to map to me.") === 0);
  assert("HOMOGRAPH GUARD — nor does 'hi' or 'par'",
    hindiMarkerCount("Hi, this is on par with what we discussed.") === 0);
  assert('FROZEN — "you already know this" is caught (HOW_HE_LEARNS #10)',
    auditTurnLegacy({ assistantText: "Ye to tumhe pata hai — you already know this concept.", session: OPEN })
      .drifts.some((d) => d.rule === "his-level"));
  assert("FROZEN — a clean turn does not trip the level rule",
    !auditTurnLegacy({ assistantText: "Chalo shuru se dekhte hain, ekdum zero se.", session: OPEN })
      .drifts.some((d) => d.rule === "his-level"));
  assert("FROZEN — a repo command inside the teaching body flagged EVEN IN BACKTICKS (the defect the new engine repairs)",
    auditTurnLegacy({ assistantText: "Ruko, pehle `node scripts/capture.mjs rep` chala lo.", session: OPEN })
      .drifts.some((d) => d.rule === "no-system-mid-concept"));
  assert("FROZEN — the same command outside steps 3-6 is not a drift",
    !auditTurnLegacy({ assistantText: "Ab `node scripts/capture.mjs rep` chalao.", session: { ...OPEN, step: 10 } })
      .drifts.some((d) => d.rule === "no-system-mid-concept"));
  assert('FROZEN — "samajh nahi aaya" + step advance caught (HOW_HE_LEARNS #9)',
    auditTurnLegacy({ assistantText: "Theek hai, aage badhte hain.", userText: "yaar samajh nahi aaya", session: OPEN, prevStep: 3 })
      .drifts.some((d) => d.rule === "confusion-is-literal"));
  assert("FROZEN — confusion + STAYING on the step is clean",
    !auditTurnLegacy({ assistantText: "Theek hai, wapas zero se.", userText: "samajh nahi aaya", session: { ...OPEN, step: 3 }, prevStep: 3 })
      .drifts.some((d) => d.rule === "confusion-is-literal"));
  {
    const r = auditTurnLegacy({ assistantText: "Token wo chhoti unit hai jo model padhta hai.", session: OPEN });
    assert("FROZEN — length/ratio measured, never judged",
      r.measured && typeof r.measured.chars === "number" && typeof r.measured.hindi_markers === "number"
      && !r.drifts.some((d) => /length|ratio|too long|too short/i.test(d.rule + d.evidence)));
  }
  assert("FROZEN — a clean Hinglish turn with one question produces NO drift at all",
    auditTurnLegacy({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai. Ab bolo — tumhare hisaab se 'khaana' kitne token banega?", session: OPEN }).drifts.length === 0);
  assert("FROZEN — every drift carries QUOTED evidence, never a bare verdict",
    auditTurnLegacy({ assistantText: "A token is the smallest unit.", session: OPEN })
      .drifts.every((d) => typeof d.evidence === "string" && d.evidence.length > 10 && typeof d.excerpt === "string"));

  // ========================================================================
  // PART 2 — THE PLAN OF RECORD (7 Aug). Step-scoping per canon, tables as his
  // word, code-stripped system check, ending-aware questions, ungraded-axis.
  // Every pair below has a CAUGHT case and a CLEAN case — a detector that
  // cannot fail is not a detector.
  // ========================================================================
  const at = (step) => ({ ...OPEN, step });
  assert("V2 — two questions at step 4 caught; the SAME message at step 2 (Pehle-Guess, 2-3 Qs BY DESIGN) is clean",
    auditTurn({ assistantText: "Token kya hota hai? Aur vocabulary kya hai?", session: at(4) }).drifts.some((d) => d.rule === "one-idea")
    && !auditTurn({ assistantText: "Token kya hota hai? Aur vocabulary kya hai?", session: at(2) }).drifts.some((d) => d.rule === "one-idea"));
  assert("V2 — multi-question Jirah (step 9) is clean: canon designed it multi-question",
    !auditTurn({ assistantText: "Pehla sawaal? Doosra sawaal? Teesra sawaal?", session: at(9) }).drifts.some((d) => d.rule === "one-idea"));
  assert("V2 — BOLD questions count: '**A ya B?**' is one question, two of them are a drift at step 4",
    countQuestions("**A ya B?** aur **C ya D?**") === 2
    && auditTurn({ assistantText: "**A ya B?** socho. **C ya D?** batao.", session: at(4) }).drifts.some((d) => d.rule === "one-idea"));
  assert("V2 — a quoted question ('?\"') is NOT counted (measured: quotes are citations, not questions to him)",
    countQuestions('Usne poochha tha "kya hoga?" aur hum aage badhe.') === 0);
  assert("V2 — ONE comparison table at step 4 is now a drift (his word, twice) — the frozen engine passed it",
    auditTurn({ assistantText: "Dekho:\n| a | b |\n|---|---|\n| 1 | 2 |\nSamajh aaya?", session: at(4) }).drifts.some((d) => d.rule === "dheema-not-lamba")
    && !auditTurnLegacy({ assistantText: "Dekho:\n| a | b |\n|---|---|\n| 1 | 2 |\nSamajh aaya?", session: at(4) }).drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("V2 — the same table at step 10 (LOCK — reports, not teaching) is clean",
    !auditTurn({ assistantText: "| a | b |\n|---|---|\n| 1 | 2 |", session: at(10) }).drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("V2 — step 1 DARAAR-MAP with many headers is clean (canon MANDATES showing 9 axes at once there)",
    !auditTurn({ assistantText: "## a\nx\n## b\ny\n## c\nz", session: at(1) }).drifts.some((d) => d.rule === "dheema-not-lamba"));
  assert("V2 — English at step 7 BOLO is clean (canon: English only for the interview rep); English at step 4 is caught",
    !auditTurn({ assistantText: "Say it cold: a hallucination is a confident, ungrounded claim.", session: at(7) }).drifts.some((d) => d.rule === "hinglish")
    && auditTurn({ assistantText: "A hallucination is a confident, ungrounded claim.", session: at(4) }).drifts.some((d) => d.rule === "hinglish"));
  assert("V2 — a message that is ALL code fence has nothing to judge: no hinglish drift (the widget-delivery turn)",
    !auditTurn({ assistantText: "```html\n<div>widget</div>\n```", session: at(4) }).drifts.some((d) => d.rule === "hinglish"));
  assert("V2 — Devanagari is out-of-band: measured.devanagari true, hindi_markers stays a REAL count, no hinglish drift",
    (() => { const r = auditTurn({ assistantText: "टोकन sabse chhoti unit hai", session: at(4) });
      return r.measured.devanagari === true && r.measured.hindi_markers !== 999 && !r.drifts.some((d) => d.rule === "hinglish"); })());
  assert("V2 — a backticked (named-and-parked) command at step 4 is COMPLIANT; a bare runnable one is the drift",
    !auditTurn({ assistantText: "Ruko, pehle `node scripts/capture.mjs rep` chala lo — park kar diya, wapas concept pe.", session: at(4) }).drifts.some((d) => d.rule === "no-system-mid-concept")
    && auditTurn({ assistantText: "Ruko. Ab chalao: node scripts/capture.mjs rep — abhi.", session: at(4) }).drifts.some((d) => d.rule === "no-system-mid-concept"));
  assert("V2 — 'obviously' inside a step-9 Jirah trap is the trap being modelled, not the crime; at step 4 it is the crime",
    !auditTurn({ assistantText: "Jirah trap: interviewer bolega 'obviously small models hallucinate more'. Kya jawab dega?", session: at(9) }).drifts.some((d) => d.rule === "his-level")
    && auditTurn({ assistantText: "Ye obviously simple hai, chalo aage.", session: at(4) }).drifts.some((d) => d.rule === "his-level"));
  assert("V2 — the live variant 'samajh nahi aa raha' + advance is caught (missing from the frozen list)",
    auditTurn({ assistantText: "Aage badhte hain.", userText: "yaar samajh nahi aa raha kuch", session: at(4), prevStep: 3 })
      .drifts.some((d) => d.rule === "confusion-is-literal"));
  assert("V2 — UNGRADED AXIS MARK: a NEW axis in axes_done with jirah_before 0 before step 9 → his-word drift (the exact 6 Aug drift #1/#2 fingerprint, read from state)",
    auditTurn({
      assistantText: "Theek hai.", session: { ...at(3), axes_done: ["a"], axes_marked_at: { a: { at: "x", step: 3, jirah_before: 0 } } },
      prevAxesDone: [],
    }).drifts.some((d) => d.rule === "his-word" && /ZERO Jirah/.test(d.evidence)));
  assert("V2 — the SAME standing condition does not re-fire every turn (prevAxesDone already contains it), and a Jirah-backed mark is clean",
    !auditTurn({
      assistantText: "Theek hai.", session: { ...at(3), axes_done: ["a"], axes_marked_at: { a: { at: "x", step: 3, jirah_before: 0 } } },
      prevAxesDone: ["a"],
    }).drifts.some((d) => d.rule === "his-word")
    && !auditTurn({
      assistantText: "Theek hai.", session: { ...at(9), axes_done: ["a"], axes_marked_at: { a: { at: "x", step: 9, jirah_before: 2 } } },
      prevAxesDone: [],
    }).drifts.some((d) => d.rule === "his-word"));
  assert("V2 — a clean Hinglish teaching turn still produces ZERO drifts (the detector can say clean)",
    auditTurn({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai. Ab bolo — 'khaana' kitne token banega?", session: at(4) }).drifts.length === 0);
  assert("V2 — a session object with no concept is NOT audited (mirrors the owner's load() contract)",
    auditTurn({ assistantText: "x", session: { step: 3 } }).audited === false);
  assert("V2 — COVERAGE: core axis d NEWLY deferred → coverage drift (the half-answer class's one machine-readable fingerprint)",
    auditTurn({
      assistantText: "Theek hai, d baad mein.", session: { ...at(3), axes_deferred: ["d"] },
      prevAxesDeferred: [],
    }).drifts.some((d) => d.rule === "coverage" && /CORE-NEVER-DEFERRED/.test(d.evidence)));
  assert("V2 — COVERAGE: a non-core deferral is LEGAL (no drift), and a standing core deferral does not re-fire every turn",
    !auditTurn({
      assistantText: "g defer kar diya.", session: { ...at(3), axes_deferred: ["g"] },
      prevAxesDeferred: [],
    }).drifts.some((d) => d.rule === "coverage")
    && !auditTurn({
      assistantText: "Theek hai.", session: { ...at(3), axes_deferred: ["d"] },
      prevAxesDeferred: ["d"],
    }).drifts.some((d) => d.rule === "coverage"));
  assert("V2 — COVERAGE: no prompt-time deferral record (prevAxesDeferred null) → the check stays silent, never guesses",
    !auditTurn({
      assistantText: "x", session: { ...at(3), axes_deferred: ["d"] },
    }).drifts.some((d) => d.rule === "coverage"));
  assert("CHECKED_RULES names every rule id this engine can emit, and nothing else",
    (() => {
      // law-waiver:jugad — a SELFTEST ORACLE, deliberately literal: this list is the independent truth the
      // assertion holds CHECKED_RULES against; deriving it from the code under test would make the check
      // tautological. It ships in no lane and reaches no runtime (row 68 (g), 6 Sep 2026).
      const emitted = ["one-idea", "dheema-not-lamba", "hinglish", "his-level", "no-system-mid-concept", "confusion-is-literal", "his-word", "coverage", "neev-pehle", "link-back", "terminology", "decided",
        "uncaptured-rep",   // W0-D · LR-04 — grown deliberately: this mirror is the ratchet, and it may only ever be widened alongside a real emitter
        "act-mt2kgbt7", "act-mt2kgn09", "max-intensity-check"];   // 7 Sep 2026 — checks 12, 13 and 14, each with a real emitter above
      return emitted.every((r) => CHECKED_RULES.includes(r)) && CHECKED_RULES.every((r) => emitted.includes(r));
    })());
  assert("W0-D · LR-04 — every CHECKED_RULE that is only PARTIALLY machine-visible carries its RULE_NOTES slice, so 'no drift caught' can never widen into 'taught correctly'",
    typeof RULE_NOTES["uncaptured-rep"] === "string" && RULE_NOTES["uncaptured-rep"].length > 80);

  // ── LR-04 (W0-D, 2 Sep 2026) — "AN UNCAPTURED REP DID NOT HAPPEN" ──────────
  // His 30-Aug order, finally a code path. Measured before this rule existed:
  // reps_log.jsonl's newest row was 2026-08-23 and two post-restart forge sessions had
  // closed with steps [0,1,2,3] and no reps at all — the capture step lived only in
  // /forge's prose, and nothing in the machine objected even once.
  {
    const M = (n) => ({ ...at(4), question_moments: { pehle_guess: n, widget_gate: 0, check_q: 0, jirah: 0 } });
    const fired = (o) => auditTurn({ assistantText: "x", ...o }).drifts.some((d) => d.rule === "uncaptured-rep");
    assert("LR-04 — a question-moment declared with NO rep banked in the same window is a drift",
      fired({ session: M(2), prevMoments: 1, prevReps: 5, repsNow: 5 }));
    assert("LR-04 — SILENT when the rep landed (the honest turn costs the teacher nothing)",
      !fired({ session: M(2), prevMoments: 1, prevReps: 5, repsNow: 6 }));
    assert("LR-04 — SILENT when no moment was declared, however many turns pass (this rule never fires on a turn that asked nothing)",
      !fired({ session: M(1), prevMoments: 1, prevReps: 5, repsNow: 5 }));
    assert("LR-04 — NO ANCHOR, NO CLAIM: a missing snapshot or an unreadable reps_log says NOTHING rather than treating absence as zero",
      !fired({ session: M(2), prevMoments: null, prevReps: 5, repsNow: 5 })
      && !fired({ session: M(2), prevMoments: 1, prevReps: null, repsNow: 5 })
      && !fired({ session: M(2), prevMoments: 1, prevReps: 5, repsNow: null }));
    assert("LR-04 — the evidence carries BOTH counts and names his order, so the auto-count is auditable and reversible",
      (() => { const d = auditTurn({ assistantText: "x", session: M(3), prevMoments: 1, prevReps: 5, repsNow: 5 }).drifts.find((x) => x.rule === "uncaptured-rep");
        return /2 question-moment/.test(d.evidence) && /an uncaptured rep did not happen/.test(d.evidence)
          && /question_moments total 1 → 3/.test(d.excerpt) && /reps 5 → 5/.test(d.excerpt); })());
    assert("LR-04 — it is step-agnostic by construction (a state comparison, like the ungraded-axis check) and never fires outside an open session",
      fired({ session: { ...M(2), step: 9 }, prevMoments: 1, prevReps: 0, repsNow: 0 })
      && !auditTurn({ assistantText: "x", session: { ...M(2), closed_at: "2026-08-06T12:00:00Z" }, prevMoments: 1, prevReps: 0, repsNow: 0 }).audited);
    assert("LR-04 — a rep count that somehow SHRANK (a roll, a truncation) is still 'nothing banked', never a negative that reads as growth",
      fired({ session: M(2), prevMoments: 1, prevReps: 9, repsNow: 4 }));
  }

  // ========================================================================
  // PART 2b — P1.1/P1.2 (7 Aug 2026): neev-pehle, link-back, terminology,
  // decided. The neev-pehle cases are the REAL 6-7 Aug failures, reconstructed
  // from the staged drift reports and the live afferent rows — the captain's
  // own test set, per the brief.
  // ========================================================================
  const T0STATE = { opened: [], flagged: [] };
  const NOCLOSED = { names: [], vocab: [] };
  assert("NEEV-PEHLE — drift #7's real shape ('apne invoices se eval set banao', never opened) FIRES at step 4",
    auditTurn({
      assistantText: "Ab agla kadam: apne invoices se **eval set** banao — 50 sawaal kaafi hain shuru ke liye.",
      session: at(4), termState: T0STATE, closed: NOCLOSED,
    }).drifts.some((d) => d.rule === "neev-pehle" && /eval set/.test(d.evidence)));
  assert("NEEV-PEHLE — drift #5's real shape (formula with 'closed-book' + 'ground truth' unopened) fires for BOTH",
    (() => {
      const r = auditTurn({
        assistantText: "Groundedness ka formula: supported claims / total claims. Isko **closed-book** mode mein chalao aur **ground truth** se compare karo.",
        session: at(4), termState: T0STATE, closed: NOCLOSED,
      });
      const fired = r.drifts.filter((d) => d.rule === "neev-pehle").map((d) => d.evidence).join(" ");
      return /closed-book/.test(fired) && /ground truth/.test(fired);
    })());
  // law-waiver:tum — the fixture below quotes the teacher's REAL 6 Aug 2026 turn verbatim, in the register of that day;
  // the detector under test needs the text as it was said (row 68 (e): prose TO him is "tum" everywhere else).
  assert("NEEV-PEHLE — the REAL 6 Aug repair turn (asli naam: EVALUATION SET … Yahi tera ground truth hai) OPENS and stays clean",
    (() => {
      const real = "Us test track ka asli naam: **EVALUATION SET** *(chhota naam: **eval set**, ya **test set**)*. Yeh hai: sawaalon ki ek fixed list, aur har sawaal ka verified sahi jawab. Yahi tera **ground truth** hai.";
      const r = auditTurn({ assistantText: real, session: at(4), termState: T0STATE, closed: NOCLOSED });
      return !r.drifts.some((d) => d.rule === "neev-pehle")
        && r.terms.opened_now.includes("evaluation set") && r.terms.opened_now.includes("ground truth");
    })());
  assert("NEEV-PEHLE — an OPENED term never fires again, and the eval-set cluster shares one opening",
    (() => {
      const st = { opened: ["eval set"], flagged: [] };
      const r = auditTurn({ assistantText: "Apne **test set** pe accuracy nikaal.", session: at(5), termState: st, closed: NOCLOSED });
      return !r.drifts.some((d) => d.rule === "neev-pehle");
    })());
  assert("NEEV-PEHLE — closed-concept vocabulary is pre-opened (sampling never fires, inference is closed)",
    !auditTurn({ assistantText: "Isme **sampling** wahi kaam karti hai jo pehle dekhi thi.", session: at(4), termState: T0STATE, closed: { names: ["Inference & sampling"], vocab: ["sampling"] } })
      .drifts.some((d) => d.rule === "neev-pehle"));
  assert("NEEV-PEHLE — a FLAGGED term does not re-fire every turn, and a stateless call stays silent (never guesses)",
    !auditTurn({ assistantText: "eval set yaad hai na.", session: at(4), termState: { opened: [], flagged: ["eval set"] }, closed: NOCLOSED })
      .drifts.some((d) => d.rule === "neev-pehle")
    && !auditTurn({ assistantText: "eval set banao abhi.", session: at(4) }).drifts.some((d) => d.rule === "neev-pehle"));
  assert("LINK-BACK — step 4 with zero closed-concept names ever seen FIRES once; naming 'embedding' (singular) counts as seen",
    (() => {
      const closed = { names: ["Embeddings", "Context window"], vocab: [] };
      const fired = auditTurn({ assistantText: "Aaj naya concept shuru karte hain.", session: at(4), linkState: { seen: false, flagged: false }, closed });
      const named = auditTurn({ assistantText: "Yeh wahi baat hai jo embedding mein dekhi thi.", session: at(4), linkState: { seen: false, flagged: false }, closed });
      return fired.drifts.some((d) => d.rule === "link-back") && fired.linkback.fired
        && !named.drifts.some((d) => d.rule === "link-back") && named.linkback.named_now;
    })());
  assert("LINK-BACK — silent during SAMJHAO (step 3), silent once seen/flagged, silent with no closed concepts",
    !auditTurn({ assistantText: "x", session: at(3), linkState: { seen: false, flagged: false }, closed: { names: ["Embeddings"], vocab: [] } }).drifts.some((d) => d.rule === "link-back")
    && !auditTurn({ assistantText: "x", session: at(4), linkState: { seen: true, flagged: false }, closed: { names: ["Embeddings"], vocab: [] } }).drifts.some((d) => d.rule === "link-back")
    && !auditTurn({ assistantText: "x", session: at(4), linkState: { seen: false, flagged: false }, closed: NOCLOSED }).drifts.some((d) => d.rule === "link-back"));
  assert("TERMINOLOGY — 'shabdkosh' with 'vocabulary' absent fires; BOTH together is a legal gloss; step 7 exempt",
    auditTurn({ assistantText: "Model ka **shabdkosh** 50,000 ka hota hai.", session: at(4) }).drifts.some((d) => d.rule === "terminology")
    && !auditTurn({ assistantText: "Vocabulary — matlab model ka shabdkosh — 50,000 ki hoti hai.", session: at(4) }).drifts.some((d) => d.rule === "terminology")
    && !auditTurn({ assistantText: "Model ka shabdkosh bada hai.", session: at(7) }).drifts.some((d) => d.rule === "terminology"));
  assert("DECIDED — proposing to re-enable selfknowledge fires; the tool-less surface fingerprint fires; clean teaching does not",
    auditTurn({ assistantText: "Ek idea: selfknowledge wapas enable kar dein?", session: at(4) }).drifts.some((d) => d.rule === "decided")
    && auditTurn({ assistantText: "Hum ek tool-less surface bana sakte hain guests ke liye.", session: at(4) }).drifts.some((d) => d.rule === "decided")
    && !auditTurn({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai.", session: at(4) }).drifts.some((d) => d.rule === "decided"));

  // ========================================================================
  // PART 2c — HIS FOUR PER-TURN CARRIES (7 Sep 2026). Three of them had no
  // checker anywhere in the organism; the fourth had one that could not run
  // during the phase it was written for. Every fixture below has a PASS twin
  // and a FAIL twin, and the false-positive pins are the REAL corpus strings
  // that broke the first cut of each detector (519 live rows, 1-7 Sep).
  // ========================================================================
  {
    const DUKAAN = "**Dukaan wali baat.** Socho ek dhaba, menu deewar pe tanga hai, har dish ke aage uska number likha hai.";
    const NAAM = "Us chhapi hui list ka asli naam **VOCABULARY** hai, aur us number ka naam token ID hai.";
    const TECH_LABELLED = "**Technical line:** yahi woh line hai jo tum interview mein bologe.";
    const TECH_ENGLISH = "The tokenizer does not compute the IDs, it looks them up in a fixed vocabulary table.";
    const POSN = "**TOKENIZATION › AXIS b (vocab ka darwaza) › lookup, calculation nahi**";
    const fires = (rule, o) => auditTurn({ ...o }).drifts.some((d) => d.rule === rule);

    // ── A · THREE-LAYER DELIVERY (act-mt2kgbt7) ─────────────────────────────
    assert("R1 THREE-LAYER — an idea OPENED by name with NO technical line FIRES (his 7 Sep measurement: layer 3 landed zero times in a whole sitting)",
      fires("act-mt2kgbt7", { assistantText: `${POSN}\n\n${DUKAAN}\n\n${NAAM}`, session: at(4) }));
    assert("R1 THREE-LAYER — the SAME turn with the labelled technical line is CLEAN, and so is the unlabelled English one (both live shapes count)",
      !fires("act-mt2kgbt7", { assistantText: `${POSN}\n\n${DUKAAN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) })
      && !fires("act-mt2kgbt7", { assistantText: `${POSN}\n\n${DUKAAN}\n\n${NAAM}\n\n> ${TECH_ENGLISH}`, session: at(4) }));
    assert("R1 THREE-LAYER — the CASE-FOLDING TRAP, pinned: under /i the ALL-CAPS branch matched any word and 'path ka asli naam resolve karega' (real engineering prose, 09-03) scored as a naming act",
      asliNaamAct("Rule: har walker pehle path ka asli naam resolve karega, phir koi predicate.") === false
      && asliNaamAct("asli naam kabhi reject nahi honge, haath se list kabhi nahi badlegi.") === false
      && asliNaamAct(NAAM) === true);
    assert("R1 THREE-LAYER — the NEGATION form is not a naming act ('catalog mera banaya hua shabd tha, asli naam nahi', live 09-01)",
      asliNaamAct("\"catalog\" mera banaya hua shabd tha, asli naam nahi.") === false);
    assert("R1 THREE-LAYER — UNANCHORED turns stay silent: no naming act and no declared check_q means this rule says NOTHING, however English the turn is",
      !fires("act-mt2kgbt7", { assistantText: "Fleet returned and the four seats landed. Nothing depends on the runner now.", session: at(4) })
      && !fires("act-mt2kgbt7", { assistantText: DUKAAN, session: at(4) }));
    assert("R1 THREE-LAYER — the OTHER anchor is the teacher's OWN declaration: a check_q moment declared in this window anchors the turn, and no growth does not",
      fires("act-mt2kgbt7", { assistantText: "Toh yahi baat hai. Ab bolo, tumhare hisaab se kya hoga?", session: { ...at(4), question_moments: { check_q: 2 } }, prevMomentsByKind: { check_q: 1 } })
      && !fires("act-mt2kgbt7", { assistantText: "Toh yahi baat hai. Ab bolo, tumhare hisaab se kya hoga?", session: { ...at(4), question_moments: { check_q: 1 } }, prevMomentsByKind: { check_q: 1 } })
      && !fires("act-mt2kgbt7", { assistantText: "Toh yahi baat hai. Ab bolo, tumhare hisaab se kya hoga?", session: { ...at(4), question_moments: { check_q: 2 } }, prevMomentsByKind: null }));
    assert("R1 THREE-LAYER — step-scoped to the teaching body: the same layer-2-only turn at step 10 (LOCK, a report) is clean",
      !fires("act-mt2kgbt7", { assistantText: `${DUKAAN}\n\n${NAAM}`, session: at(10) }));

    // ── B · POSITION BY NAME (act-mt2kgn09) — the COUNT half, strict ────────
    assert("C7 COUNT — 'idea 2 of 4' FIRES, and so does the struck 'STEP 3/11' header (his ruling rul-mtdep0iye1, 22 Aug 2026)",
      fires("act-mt2kgn09", { assistantText: "Chalo aage badhte hain — idea 2 of 4. Token wo chhoti unit hai.", session: at(4) })
      && fires("act-mt2kgn09", { assistantText: "STEP 3/11 · SAMJHAO · axis b — chalo shuru karte hain.", session: at(4) }));
    assert("C7 COUNT — the LAWFUL named position is clean, at every step in the band",
      !fires("act-mt2kgn09", { assistantText: `${POSN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) })
      && !fires("act-mt2kgn09", { assistantText: `${POSN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(3) }));
    assert("C7 COUNT — QUOTING the banned form while apologising for it is not USING it (the real 09-07 turn: 'Maine likh diya tha ki har turn \"idea 2 of 4\" carry karega')",
      !fires("act-mt2kgn09", { assistantText: `${POSN}\n${TECH_LABELLED}\nMaine likh diya tha ki har turn \"idea 2 of 4\" carry karega. Wo tumne khud ban kiya tha.`, session: at(4) }));
    assert("C7 COUNT — the NUMERAL-LIST and the unit-less ratio are NOT counters: 'step 0/1/10 par woh khud fail hota hai' and 'gate selftest 57/0' are both real live rows and both clean",
      countForm("teaching-audit ka test step 0/1/10 par woh khud fail hota hai.") === null
      && countForm("Rung A ka owed sign-off ho gaya (gate selftest 57/0 — locks hold).") === null
      && countForm("tumhare do forge sessions dono step-3 pe mare, 0/9 axes.") === null);
    assert("C7 COUNT — out of the teaching band (step 10 LOCK reports) the counter check does not fire",
      !fires("act-mt2kgn09", { assistantText: "Coverage: idea 2 of 4 axes closed.", session: at(10) }));
    assert("C7 COUNT — THE ABLATION, pinned: the quote-guard is the ONLY citation rule that earns its place. Bold, ITALIC and BLOCKQUOTE counters are all caught — the first cut stripped the last two and they went undetected, which is a hole, not a guard",
      countForm("**idea 2 of 4**") !== null
      && countForm("*idea 2 of 4*") !== null
      && countForm("> idea 2 of 4") !== null
      && countForm("## step 2 of 5 par ho tum") !== null);
    assert("C7 COUNT — apostrophes never bracket-and-delete a counter (the dropped single-quote rule did exactly that: two unpaired apostrophes swallowed everything between them)",
      countForm("Don't bhoolna — idea 2 of 4 — doesn't matter abhi.") !== null);
    assert("C7 COUNT — the struck canon header stays a citation: ~~STEP n/11~~ shown as the DEAD form is not the form being used",
      countForm("~~STEP 3/11 · SAMJHAO~~ → TOKENIZATION › AXIS b › lookup") === null
      && countForm("STEP 3/11 · SAMJHAO") !== null);
    assert("C7 COUNT — every unit noun in his own vocabulary is covered, in both the 'of' and the slash form",
      countForm("Tum abhi axis 3 of 9 par ho.") !== null
      && countForm("Chalo — concept 1/4 shuru.") !== null
      && countForm("part 2 of 3 baaki hai.") !== null);

    // ── B · POSITION BY NAME — the NO-POSITION half, anchored ──────────────
    assert("C7 POSITION — an idea served with NO position at all FIRES; the same turn with the named path, or with 'Tum yahan ho: axis a', is clean",
      fires("act-mt2kgn09", { assistantText: `${DUKAAN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) })
      && !fires("act-mt2kgn09", { assistantText: `${POSN}\n\n${DUKAAN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) })
      && !fires("act-mt2kgn09", { assistantText: `**Tum yahan ho: axis a.**\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) }));
    assert("C7 POSITION — UNANCHORED turns stay silent (the several hundred engineering turns that ride an open forge session are not idea deliveries)",
      !fires("act-mt2kgn09", { assistantText: "Belt 0 fleet: four seats running since 11:27, none returned yet. Main yahin hoon.", session: at(4) }));
    assert("C7 POSITION — a counted turn fires ONCE, not twice: the count drift replaces the no-position drift rather than double-counting the same rule",
      auditTurn({ assistantText: `${DUKAAN}\n\n${NAAM}\n\n${TECH_LABELLED}\n\nidea 2 of 4`, session: at(4) })
        .drifts.filter((d) => d.rule === "act-mt2kgn09").length === 1);

    // ── C · MAX-INTENSITY CHECK (max-intensity-check) ──────────────────────
    const INT_OK = "Axis a band. Depth aur breadth dono maximum thi, interaction bhi poori rahi.";
    const ST0 = { pending_axis: null, flagged_axes: [] };
    assert("MAX-INTENSITY — a NEWLY closed axis with no check on the closing turn ARMS (it does not fire yet: his rule puts the report in the NEXT turn)",
      (() => { const r = auditTurn({ assistantText: "Theek hai, axis a band. Aage badhte hain.", session: { ...at(3), axes_done: ["a"] }, prevAxesDone: [], intensityState: ST0 });
        return r.intensity.armed === "a" && !r.drifts.some((d) => d.rule === "max-intensity-check"); })());
    assert("MAX-INTENSITY — and the NEXT turn, still silent on depth/breadth/interaction, FIRES and names the axis it is about",
      (() => { const r = auditTurn({ assistantText: "Chalo agla axis shuru karte hain.", session: { ...at(3), axes_done: ["a"] }, prevAxesDone: ["a"], intensityState: { pending_axis: "a", flagged_axes: [] } });
        return r.intensity.fired === "a" && r.drifts.some((d) => d.rule === "max-intensity-check" && /axis "a"/.test(d.evidence)); })());
    assert("MAX-INTENSITY — the check delivered ON the closing turn arms nothing, and delivered on the NEXT turn clears the pending axis: both are clean",
      (() => { const r = auditTurn({ assistantText: INT_OK, session: { ...at(3), axes_done: ["a"] }, prevAxesDone: [], intensityState: ST0 });
        const r2 = auditTurn({ assistantText: INT_OK, session: { ...at(3), axes_done: ["a"] }, prevAxesDone: ["a"], intensityState: { pending_axis: "a", flagged_axes: [] } });
        return r.intensity.armed === null && r.intensity.cleared === true && !r.drifts.some((d) => d.rule === "max-intensity-check")
          && r2.intensity.cleared === true && !r2.drifts.some((d) => d.rule === "max-intensity-check"); })());
    assert("MAX-INTENSITY — one axis close is ONE drift: an axis already reported never re-fires, and a STANDING closed axis arms nothing (same discipline as the ungraded-axis check)",
      !fires("max-intensity-check", { assistantText: "Chalo aage.", session: { ...at(3), axes_done: ["a"] }, prevAxesDone: ["a"], intensityState: { pending_axis: "a", flagged_axes: ["a"] } })
      && auditTurn({ assistantText: "Chalo aage.", session: { ...at(3), axes_done: ["a"] }, prevAxesDone: ["a"], intensityState: ST0 }).intensity.armed === null);
    assert("MAX-INTENSITY — the latch is PER AXIS, not per session: axis 'a' already reported does not silence axis 'b' (his rule is 'har topic ke samjhao ke baad', every axis, not the first one only)",
      (() => { const r = auditTurn({ assistantText: "Chalo aage.", session: { ...at(3), axes_done: ["a", "b"] }, prevAxesDone: ["a", "b"], intensityState: { pending_axis: "b", flagged_axes: ["a"] } });
        return r.intensity.fired === "b" && r.drifts.some((d) => d.rule === "max-intensity-check" && /axis "b"/.test(d.evidence)); })());
    assert("MAX-INTENSITY — NO ANCHOR, NO CLAIM: with no prompt-time axes_done record it arms nothing, and with no latch state it never fires",
      auditTurn({ assistantText: "Theek hai.", session: { ...at(3), axes_done: ["a"] }, intensityState: ST0 }).intensity.armed === null
      && !fires("max-intensity-check", { assistantText: "Chalo aage.", session: { ...at(3), axes_done: ["a"] }, prevAxesDone: ["a"] }));
    assert("MAX-INTENSITY — the detector needs his OWN shape: one axis word alone is ordinary prose, two of three plus a verdict is an answer",
      intensityCheck("Depth kaafi zyada hai is packet mein.") === false
      && intensityCheck("Depth aur interaction dono maximum the.") === true
      && intensityCheck("Intensity standard se niche thi, agle turn mein revise karenge.") === true);

    // ── D · LINK-BACK, WIDENED INTO STEP 3 (his word: "kardo") ─────────────
    const CLOSED2 = { names: ["Embeddings", "Context window", "tokenization"], vocab: [] };
    const LINK0 = { seen: false, flagged: false };
    const s3 = (extra) => ({ ...at(3), concept: "tokenization", ...extra });
    assert("LINK-BACK WIDENED — step 3 with an axis already closed and NO closed concept named FIRES (the old `step > 3` gate made this rule silent on 826 of the 907 rows on disk)",
      fires("link-back", { assistantText: "Chalo char-level ki doosri daraar dekhte hain.", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: CLOSED2 }));
    assert("LINK-BACK WIDENED — but NOT on turn one: at step 3 with nothing landed yet the condition is narrowed, not the coverage, so the widening cannot flood",
      !fires("link-back", { assistantText: "Chalo shuru karte hain.", session: s3({ axes_done: [], axes_now_at: { a: "x" } }), linkState: LINK0, closed: CLOSED2 })
      && fires("link-back", { assistantText: "Chalo aage.", session: s3({ axes_done: [], axes_now_at: { a: "x", b: "y" } }), linkState: LINK0, closed: CLOSED2 }));
    assert("LINK-BACK WIDENED — naming a closed concept at step 3 is clean and latches `seen` (singular of a plural name still counts)",
      (() => { const r = auditTurn({ assistantText: "Yeh wahi baat hai jo embedding mein dekhi thi.", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: CLOSED2 });
        return !r.drifts.some((d) => d.rule === "link-back") && r.linkback.named_now === true; })());
    assert("LINK-BACK STRICTER — the OPEN concept cannot satisfy its OWN link-back: naming 'tokenization' while teaching tokenization still fires (live proof: it sat in its own closed-names list and latched `seen` on turn one)",
      (() => { const r = auditTurn({ assistantText: "Aaj tokenization ka agla hissa. Tokenization mein subword aata hai.", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: CLOSED2 });
        return r.drifts.some((d) => d.rule === "link-back") && r.linkback.named_now === false; })());
    assert("LINK-BACK STRICTER — names match on WORD BOUNDARIES, not substrings: 'contextual' no longer satisfies the closed concept 'context' (the old includes() did)",
      (() => { const closed1 = { names: ["context"], vocab: [] };
        const r = auditTurn({ assistantText: "Yeh contextual baat hai, aage dekhenge.", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: closed1 });
        const r2 = auditTurn({ assistantText: "Yeh wahi context wali baat hai.", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: closed1 });
        return r.drifts.some((d) => d.rule === "link-back") && !r2.drifts.some((d) => d.rule === "link-back"); })());
    assert("LINK-BACK — everything the old gate guaranteed still holds: silent once seen, silent once flagged, silent past step 9, silent with no closed concept but the open one",
      !fires("link-back", { assistantText: "x", session: s3({ axes_done: ["a"] }), linkState: { seen: true, flagged: false }, closed: CLOSED2 })
      && !fires("link-back", { assistantText: "x", session: s3({ axes_done: ["a"] }), linkState: { seen: false, flagged: true }, closed: CLOSED2 })
      && !fires("link-back", { assistantText: "x", session: { ...at(10), concept: "tokenization", axes_done: ["a"] }, linkState: LINK0, closed: CLOSED2 })
      && !fires("link-back", { assistantText: "x", session: s3({ axes_done: ["a"] }), linkState: LINK0, closed: { names: ["tokenization"], vocab: [] } }));

    // ── THE MEASURED LANE — data before verdicts, on every audited turn ─────
    assert("ALL FOUR — every audited turn now records the four carries under `measured`, judged by nobody (the lane that can finally answer 'how often does layer 3 arrive')",
      (() => { const m = auditTurn({ assistantText: `${POSN}\n\n${NAAM}\n\n${TECH_LABELLED}`, session: at(4) }).measured;
        return m.idea_delivery === true && m.idea_anchor === "asli-naam act" && m.technical_line === "label"
          && m.named_position === true && m.count_form === null && m.intensity_check === false; })());
  }

  // THE SEED-GAP RATCHET (7 Sep 2026). teaching_contract.json is gitignored, so
  // a rule row added through its CLI does not travel with the commit that teaches
  // THIS file to emit that id — and then every autohit exits 1 and the measured
  // drift is dropped in silence. teaching_contract.mjs has another owner and is
  // not edited from here, so the gap is DECLARED in SEED_GAP and pinned both ways:
  // an emitter with neither a seed row nor a declaration goes red, and a declared
  // gap that has since been closed goes red too, so the list cannot rot.
  {
    const seedSrc = join(__dirname, "teaching_contract.mjs");
    if (existsSync(seedSrc)) {
      const src = readFileSync(seedSrc, "utf8");
      const seeded = (id) => src.includes(`r("${id}"`);
      assert("SEED GAP — every rule id this file emits is either in teaching_contract.mjs's seed() or DECLARED in SEED_GAP (no emitter is ever silently unwired)",
        CHECKED_RULES.every((id) => seeded(id) || SEED_GAP.includes(id)));
      assert("SEED GAP — and every DECLARED gap is still a real gap: the day the three seed rows land, this assertion goes red and forces SEED_GAP to shrink",
        SEED_GAP.every((id) => !seeded(id)) && SEED_GAP.every((id) => CHECKED_RULES.includes(id)));
    } else {
      skip("SEED GAP assertions", "teaching_contract.mjs not on this machine");
    }
  }

  // ========================================================================
  // PART 3 — THE DISK PATH. This is what 25 green assertions never touched
  // while the organ lay dead (§5.2): the reader against the REAL file, and the
  // WHOLE chain — spawned child, piped payload, rows on disk.
  // ========================================================================
  {
    const livePath = join(__dirname, "..", "dressing-room", "state", "forge_session.json");
    if (existsSync(livePath)) {
      const raw = readJson(livePath);
      const viaNew = raw && typeof raw === "object" && !Array.isArray(raw) && raw.concept ? raw : null;
      assert("LIVE SHAPE — the REAL on-disk forge_session.json parses top-level with a concept (the shape the fix reads)",
        viaNew !== null && typeof viaNew.concept === "string");
      assert("LIVE SHAPE — the FROZEN reader returns null against the REAL file (the defect, pinned against reality — this assertion is the one 25 green tests never made)",
        ((raw || {}).session || null) === null);
    } else {
      skip("LIVE SHAPE assertions", "no live forge_session.json on this machine — shape pinned by the integration fixture below instead");
    }
  }
  {
    // END-TO-END: spawn THIS FILE as a child, exactly as the Stop hook does, with
    // a piped payload, against a temp state dir seeded with the LIVE file's real
    // bytes (or a byte-faithful fixture). Asserts the row lands ON DISK. The
    // NO_SPAWN env keeps the child's hands off the live teaching_contract.json.
    const tmp = mkdtempSync(join(tmpdir(), "teach-audit-"));
    try {
      // HERMETICITY SCAR (10 Aug 2026, KAAM-0 pass). This block used to `cpSync`
      // the live forge_session.json in VERBATIM, which coupled a selftest to his
      // study state: THE METHOD only applies to an OPEN session, so the moment he
      // closed `hallucinations` at 06:40:49 IST the auditor correctly answered "no
      // open forge session", wrote no row, and three asserts went red on a suite
      // that had been 32/32 green at 02:07 the same night. The organ was never
      // broken — the test was reading his day. Proven both ways before this edit:
      // live bytes AS-IS ⇒ audited:false / 0 drifts / no jsonl; the SAME bytes with
      // `closed_at` removed ⇒ status 0 / 1 row / 3 drifts.
      // The live bytes are still the seed — that is deliberate, it is what makes
      // this an end-to-end test of the REAL shape rather than of a hand-written
      // idea of it. Only the ONE field that decides scope is normalised, and the
      // seeded session is then asserted OPEN, so a future shape change fails as a
      // named red line instead of as a confusing ENOENT four asserts later.
      // (The reader-vs-reality pinning lives in the LIVE SHAPE block above; it
      // reads the live file untouched and must keep doing so.)
      const livePath = join(__dirname, "..", "dressing-room", "state", "forge_session.json");
      const seed = existsSync(livePath) ? readJson(livePath) : null;
      const openSeed = seed && typeof seed === "object" && !Array.isArray(seed) && seed.concept ? { ...seed } : {
        concept: "fixture", started_at: "2026-08-06T12:00:00Z", updated_at: "2026-08-06T12:00:00Z",
        step: 4, steps_done: [0, 1, 2, 3, 4], axes_done: [], axes_deferred: [], axes_marked_at: {},
        question_moments: { pehle_guess: 0, widget_gate: 0, check_q: 0, jirah: 0 }, check_q_this_pass: 0,
      };
      delete openSeed.closed_at;
      // ── LR-01 (W0-D, 2 Sep 2026) — THE SECOND SCOPE FIELD, NORMALISED TOO ──────
      // The 10-Aug repair above normalised ONE field, `closed_at`, because that was the
      // field that had bitten. It is not the only field that decides scope: `step`
      // decides which RULES APPLY (see the STEP SCOPING block at auditTurn's contract —
      // one-idea and no-system are steps 3-6, dheema 3-9, hinglish 2-9 except 7). So
      // this selftest still read HIS STUDY DAY, one field over, and the assert below
      // ("the row carries at least one drift") was really an assertion about which step
      // Nikhil happened to be on when the suite ran.
      // MEASURED with a step-sweep harness against this exact probe message:
      //     step 0 → 0 drifts · step 1 → 0 · step 2 → 1 · step 3 → 3 · step 4 → 3
      //     step 9 → 2 · step 10 → 0
      // — so his live steps 0, 1 and 10 turn this member RED and steps 2-4/9 turn it
      // green, which is exactly the 10-day 62/1 red and today's 63/0 green: ONE defect,
      // two faces. Step 4 is chosen because it sits in the widest band (every text rule
      // in scope) and is nowhere near an edge.
      // The live bytes are STILL the seed — that is what keeps this an end-to-end test
      // of the REAL shape. Only the fields that decide SCOPE are normalised, and each
      // one is now asserted, so a third scope field arriving fails as a named line.
      openSeed.step = 4;
      openSeed.steps_done = [0, 1, 2, 3, 4];
      writeFileSync(join(tmp, "forge_session.json"), JSON.stringify(openSeed, null, 2));
      assert("END-TO-END — the seeded session is OPEN before the chain is driven (a closed seed makes the next three asserts meaningless, not failing)",
        openSeed.closed_at === undefined && typeof openSeed.concept === "string" && Number.isInteger(openSeed.step));
      assert("END-TO-END — and its STEP is pinned inside the measured green band, so this member can never again be decided by which step HIS session is on (LR-01)",
        openSeed.step === 4 && openSeed.step >= 2 && openSeed.step <= 9
        && openSeed.steps_done.includes(openSeed.step));
      const env = { ...process.env, ARSENAL_AUDIT_STATE_DIR: tmp, ARSENAL_AUDIT_NO_SPAWN: "1" };
      delete env.ARSENAL_ORGAN;
      const payload = JSON.stringify({
        hook_event_name: "Stop", session_id: "selftest-e2e",
        last_assistant_message: "## One\nA thing.\n## Two\nAnother thing. What is it? And why? And how?",
      });
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "hook"], { input: payload, env, timeout: 15000 });
      const logRows = existsSync(join(tmp, "teaching_audit.jsonl"))
        ? readFileSync(join(tmp, "teaching_audit.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
      const lastJ = readJson(join(tmp, "teaching_audit_last.json"));
      // LR-01: SPLIT. These were one assert, and the conflation is what made the
      // diagnosis take ten days — "the chain is dead" and "the chain ran and measured
      // nothing on this step" are different failures with different repairs, and they
      // arrived as a single red line. The chain's liveness is asserted first, on its
      // own, because it is the thing this block exists to prove.
      assert("END-TO-END — a spawned child with a piped Stop payload runs the WHOLE chain and the row lands ON DISK (stdin → reader → engine → jsonl, the chain §5.2 never ran)",
        r.status === 0 && logRows.length === 1 && logRows[0].session_id === "selftest-e2e");
      assert("END-TO-END — and that row carries at least one measured drift (the engine did WORK, not just I/O — a green chain writing empty rows is the silent death this file was built after)",
        logRows.length === 1 && logRows[0].drifts.length >= 1);
      assert("END-TO-END — teaching_audit_last.json records audited:true with the why field null (quiet-vs-dead is now readable off disk)",
        lastJ && lastJ.stop && lastJ.stop.audited === true && lastJ.stop.why === null
        && Array.isArray(lastJ.checked_rules) && lastJ.checked_rules.length === CHECKED_RULES.length);
      assert("END-TO-END — every staged entry records its outcome (skipped under the test seam, never silently dropped)",
        logRows.length === 1 && Array.isArray(logRows[0].staged) && logRows[0].staged.length === logRows[0].drifts.length
        && logRows[0].staged.every((s) => s.skipped === true));
      // And the UserPromptSubmit side: prompt recorded, then consumed by the Stop.
      const p1 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "hook"],
        { input: JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: "selftest-e2e", prompt: "yaar samajh nahi aa raha" }), env, timeout: 15000 });
      const s2 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "hook"],
        { input: JSON.stringify({ hook_event_name: "Stop", session_id: "selftest-e2e", last_assistant_message: "Aage badhte hain. Theek hai na?" }), env, timeout: 15000 });
      const lastJ2 = readJson(join(tmp, "teaching_audit_last.json"));
      // Same 10 Aug scar, second half: this was a BARE readFileSync, so the first
      // time the chain legitimately wrote no row the whole selftest died on an
      // ENOENT stack — one red assert became a crashed process and every later
      // check in this file was lost, which is how a one-line diagnosis arrived
      // looking like a suite-wide collapse. Read defensively; let the assert be
      // the thing that reports.
      const rows2 = existsSync(join(tmp, "teaching_audit.jsonl"))
        ? readFileSync(join(tmp, "teaching_audit.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      assert("END-TO-END — the prompt recorded at UserPromptSubmit is consumed by ITS OWN session's Stop with user_text_source 'fresh' (§5.3's wire, live)",
        p1.status === 0 && s2.status === 0 && rows2.length === 2 && rows2[1].user_text_source === "fresh"
        && lastJ2 && lastJ2.prompt && typeof lastJ2.prompt.consumed_at === "string");
    } finally {
      try { rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
  }

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)\n`);
  if (fail) process.exit(1);
}

// IMPORT GUARD (7 Sep 2026). Until today this dispatch ran on IMPORT as well as
// on spawn — `import("./teaching_audit.mjs")` from any other module printed the
// usage banner (measured), and under a different argv would have run a COMMAND.
// That is why nothing had ever imported this organ: it could not be imported
// safely. teaching_bar.mjs now does, to read the very derivation this file owns
// rather than keeping a second copy of it. Same one-line pattern teaching_bar
// already uses. Every existing caller spawns this file as main, so all of them
// still dispatch exactly as before.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  if (cmd === "selftest") selftest();
  else if (cmd === "report") report();
  else if (cmd === "probe") probe(process.argv.slice(3));
  else if (cmd === "seed-terms") {
    const ci = process.argv.indexOf("--concept");
    const r = seedTerms({ concept: ci >= 0 ? process.argv[ci + 1] : null });
    if (!r.ok) { console.log(`seed-terms: ${r.why}`); process.exit(1); }
    console.log(`seed-terms · ${r.concept} · replayed ${r.teachRows} teaching rows (of ${r.rows} afferents)`);
    console.log(`  OPENED (definitional line found on record): ${r.opened.join(" · ") || "—"}`);
    console.log(`  used but NEVER opened (these will fire if used bare again): ${r.used_never_opened.join(" · ") || "—"}`);
    console.log(`  link-back this session: ${r.linkSeen ? "a closed concept HAS been named" : "no closed concept named yet"}`);
  }
  else if (cmd === "hook") await hookMain();
  else console.log("teaching_audit: hook | report | probe [--clean|--text \"...\"] | seed-terms [--concept <c>] | selftest");
}
