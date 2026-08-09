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
// single writer). It never touches teaching_contract.json itself — auto-counting
// and the checked_at heartbeat both go through teaching_contract.mjs's own CLI
// (`autohit` / `checked`), exactly as the owners-only law requires.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdtempSync, cpSync, rmSync, readdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

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
export const CHECKED_RULES = [
  "one-idea", "dheema-not-lamba", "hinglish", "his-level",
  "no-system-mid-concept", "confusion-is-literal", "his-word",
  "coverage", "neev-pehle", "link-back", "terminology", "decided",
];

// COVERAGE HONESTY, PER RULE (full-organism audit P1.1-P1.2, 7 Aug 2026). A rule
// id in CHECKED_RULES means "a check EXISTS", never "the whole rule is machine-
// visible". This map states, for every partially-checkable rule, exactly which
// slice the machine sees and which slice stays HIS to catch — so "no drift caught"
// can never quietly widen into "taught correctly". `report` prints it verbatim.
export const RULE_NOTES = {
  "neev-pehle": "machine sees the LEXICAL slice only: a listed term-of-art used in the teaching body before any definitional line for it, this concept. The SEMANTIC form (a conclusion resting on an un-opened idea that has no listed name) is not machine-checkable without an LLM judge — that slice stays his to flag.",
  "link-back": "machine sees NAME-presence only: by the time SAMJHAO ends (first turn past step 3) some closed concept must have been NAMED in this session. Whether the link was a real weld or a name-drop is not machine-visible.",
  "terminology": "machine sees a fixed translation-pair floor (shabdkosh/bhram/prasang-class replacements — 0 false positives across 4,270 live rows because they never occur in his register). Softer paraphrase-drift is not machine-visible; the pair list under-counts by design.",
  "decided": "machine sees TWO fingerprints only (re-opening the selfknowledge freeze; re-opening the tool-less/guest surface — both PERMANENT rulings, 7 Aug 2026). The general form (re-litigating any settled decision) has no decision registry to check against and stays his to catch.",
  "his-word": "machine sees ONE fingerprint: an axis marked done with zero Jirah before it. Every other his-word violation is semantic and stays his.",
  "coverage": "machine sees ONE fingerprint: a CORE axis landing in axes_deferred. The half-answer/scope-cut class is semantic and stays his.",
};

// CORE-NEVER-DEFERRED's axis set, mirrored from the owner (forge_session.mjs:109;
// canon PROJECT_OS.md:316). Mirrored, not imported — this hook must stay
// dependency-light and fail-silent, and the owner's constant is one letter that
// has never moved. If it ever grows, the parity selftest here and the owner's
// close report will disagree out loud.
const CORE_AXES = ["d"];

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
export function countTables(text) {
  const stripped = String(text || "").replace(/```[\s\S]*?```/g, "");
  return (stripped.match(/^\s*\|[\s:|-]+\|\s*$/gm) || []).length;
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
const TERMS_OF_ART = [
  // the two observed failures and their cluster
  "ground truth", "eval set", "evaluation set", "test set", "closed-book", "open-book",
  "groundedness", "factuality", "hallucination rate",
  // near-syllabus terms a teacher could plausibly conclude-with before opening
  "benchmark", "precision", "recall", "f1", "rag", "retrieval", "chunking", "reranking",
  "system prompt", "few-shot", "zero-shot", "chain of thought", "fine-tuning", "rlhf",
];

// Vocabulary already OPENED by closed concepts — a term the syllabus already
// taught never fires. concepts.json aliases carry most of it; this map adds the
// core words of each CLOSED concept that its alias list does not spell out.
const CLOSED_EXTRA_VOCAB = {
  tokenization: ["token", "tokens", "vocabulary", "next-token", "next-token prediction"],
  inference: ["probability", "probability distribution"],
};

// Hyphen/space-flexible, word-bounded presence. "closed-book" matches "closed book";
// plural s/es tolerated; substrings never match ("rag" does not fire inside "storage").
const flexTerm = (t) => String(t).trim().split(/[\s-]+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]+");
export function termUsed(text, term) {
  return new RegExp(`(^|[^a-z0-9])${flexTerm(term)}(e?s)?([^a-z0-9]|$)`, "i").test(stripCode(text));
}

// Did this text OPEN the term — a one-line definitional act, in the house style
// measured off the real repair turns in afferent.jsonl (6 Aug 16:49): "ka asli
// naam: EVALUATION SET", "Yahi tera ground truth hai", "eval set ek FILE hai",
// "X matlab/yaani …", "X (gloss…)", "X = …".
export function opensTerm(text, term) {
  const s = stripCode(text);
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
export function closedDerive(stateDir = STATE_DIR) {
  const names = [], vocab = [];
  try {
    const sprint = readJson(join(stateDir, "sprint.json"));
    for (const d of ((sprint || {}).progress || {}).done || []) {
      const clean = String(d).replace(/^\d+-\d+\s+/, "").replace(/\s*\(.*\)$/, "");
      for (const part of clean.split(/[&,]/)) { const p = part.trim(); if (p) names.push(p); }
    }
  } catch { /* absent sprint = empty world, never a throw */ }
  try {
    for (const f of readdirSync(join(stateDir, "capsules"))) {
      if (f.endsWith(".json")) names.push(f.replace(/\.json$/, ""));
    }
  } catch { /* no mirror on this machine */ }
  try {
    const reg = readJson(join(stateDir, "concepts.json"));
    const byId = (reg || {}).concepts || {};
    for (const n of names) {
      const id = n.toLowerCase().replace(/\s+/g, "_");
      const hit = byId[n.toLowerCase()] || byId[id] || Object.entries(byId).find(([k]) => n.toLowerCase().includes(k))?.[1];
      if (hit && Array.isArray(hit.aliases)) vocab.push(...hit.aliases);
    }
  } catch { /* registry optional */ }
  for (const n of names) {
    vocab.push(n.toLowerCase());
    const extra = CLOSED_EXTRA_VOCAB[n.toLowerCase()];
    if (extra) vocab.push(...extra);
  }
  const seen = new Set();
  const uniqNames = names.filter((n) => { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return { names: uniqNames, vocab: [...new Set(vocab.map((v) => String(v).toLowerCase()))] };
}

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
  const closed = closedDerive();
  const startISO = sinceSession || (fs.session && fs.session.started_at) || null;
  const lines = readFileSync(afferents, "utf8").split("\n");
  for (const l of lines) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }
    rows++;
    if (r.source !== "claude-code-teaching" || typeof r.text !== "string") continue;
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
export function auditTurn({ assistantText = "", userText = "", session = null, prevStep = null, prevAxesDone = null, prevAxesDeferred = null, termState = null, linkState = null, closed = null } = {}) {
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
  const termResult = { used: [], opened_now: [], fired: [] };
  if (inBody && termState && Array.isArray(termState.opened)) {
    const preOpened = new Set([...(termState.opened || []), ...(((closed || {}).vocab) || [])].map((t) => String(t).toLowerCase()));
    const flagged = new Set((termState.flagged || []).map((t) => String(t).toLowerCase()));
    for (const t of TERMS_OF_ART) {
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
        excerpt: quote(String(stripCode(assistantText)).split(/\n/).find((l) => termUsed(l, t)) || assistantText, 160),
      });
    }
  }

  // ---- 9) LINK-BACK — SAMJHAO ended and no closed concept was ever named ----
  // (P1.1.) Presence-of-name only (RULE_NOTES). Fires ONCE per session, at the
  // first audited turn past step 3, when no closed-concept name has appeared in
  // any audited turn of this session including this one.
  let linkbackNamedNow = false, linkbackFired = false;
  if (linkState && closed && Array.isArray(closed.names) && closed.names.length) {
    linkbackNamedNow = closed.names.some((n) => {
      const key = n.toLowerCase();
      const t = norm(stripCode(assistantText));
      return t.includes(key) || t.includes(key.replace(/s$/, ""));
    });
    if (Number.isFinite(step) && step > 3 && step <= 9 && !linkState.seen && !linkState.flagged && !linkbackNamedNow) {
      linkbackFired = true;
      drifts.push({
        rule: "link-back",
        evidence: `SAMJHAO is over (step ${step}) and NO closed concept has been named this session — canon: naya concept hamesha band ho chuke concepts se NAAM le kar jodo (closed: ${closed.names.join(" · ")})`,
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
  };

  return { audited: true, why: null, drifts, measured, terms: termResult, linkback: { named_now: linkbackNamedNow, fired: linkbackFired } };
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
function promptHook(hook) {
  const { session } = readForgeSession();
  const last = readLast() || {};
  writeLastReal({
    ...last,
    prompt: {
      text: String(hook.prompt || ""),
      step: session && Number.isFinite(Number(session.step)) ? Number(session.step) : null,
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
    || ((last.terms && last.terms.concept === concept) ? last.terms : { concept, opened: [], flagged: [] });
  const link0 = (last.linkback && last.linkback.concept === concept && last.linkback.session === (session && session.started_at))
    ? last.linkback : { concept, session: session && session.started_at, seen: false, flagged: false };
  const closed = closedDerive();

  const res = auditTurn({
    assistantText: String(hook.last_assistant_message || ""),
    userText, session, prevStep, prevAxesDone, prevAxesDeferred,
    termState: terms0, linkState: link0, closed,
  });

  const why = res.audited ? null : (readWhy || res.why);

  // Roll the state forward off what the engine measured (opened accumulates for
  // the concept's lifetime; a fired term goes to flagged so it never re-fires;
  // link-back is per-SESSION and latches on first naming or first flag).
  const terms1 = res.audited ? {
    concept,
    opened: [...new Set([...(terms0.opened || []), ...(res.terms?.opened_now || [])])],
    flagged: [...new Set([...(terms0.flagged || []), ...(res.terms?.fired || [])])],
  } : terms0;
  const link1 = res.audited ? {
    ...link0,
    seen: !!(link0.seen || res.linkback?.named_now),
    flagged: !!(link0.flagged || res.linkback?.fired),
  } : link0;

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
    },
    terms: terms1,
    terms_by_concept: { ...termsByConcept, [concept]: terms1 },   // C4: no concept's opened-set is ever displaced again
    linkback: link1,
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
      const emitted = ["one-idea", "dheema-not-lamba", "hinglish", "his-level", "no-system-mid-concept", "confusion-is-literal", "his-word", "coverage", "neev-pehle", "link-back", "terminology", "decided"];
      return emitted.every((r) => CHECKED_RULES.includes(r)) && CHECKED_RULES.every((r) => emitted.includes(r));
    })());

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
      const livePath = join(__dirname, "..", "dressing-room", "state", "forge_session.json");
      if (existsSync(livePath)) cpSync(livePath, join(tmp, "forge_session.json"));
      else writeFileSync(join(tmp, "forge_session.json"), JSON.stringify({
        concept: "fixture", started_at: "2026-08-06T12:00:00Z", updated_at: "2026-08-06T12:00:00Z",
        step: 4, steps_done: [0, 1, 2, 3, 4], axes_done: [], axes_deferred: [], axes_marked_at: {},
        question_moments: { pehle_guess: 0, widget_gate: 0, check_q: 0, jirah: 0 }, check_q_this_pass: 0,
      }, null, 2));
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
      assert("END-TO-END — a spawned child with a piped Stop payload AUDITS and the row lands ON DISK (stdin → reader → engine → jsonl, the whole chain §5.2 never ran)",
        r.status === 0 && logRows.length === 1 && logRows[0].drifts.length >= 1 && logRows[0].session_id === "selftest-e2e");
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
      const rows2 = readFileSync(join(tmp, "teaching_audit.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
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
