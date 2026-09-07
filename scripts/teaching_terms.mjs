#!/usr/bin/env node
// ============================================================================
// teaching_terms.mjs · ARSENAL AI FC — THE TEACHING VOCABULARY (7 Sep 2026)
// ----------------------------------------------------------------------------
// WHY THIS FILE EXISTS, and it is not tidiness. On 7 Sep 2026 he stopped a lesson
// mid-axis because a real name ("sequence") reached him un-opened and HE had to
// catch it — which his own canon forbids: "COVERAGE + RETENTION IS THE TEACHER'S
// JOB … unknown-unknowns Nikhil pe kabhi leak nahi honge." The repair needed the
// SAME vocabulary derivation in two organs: teaching_audit.mjs, which checks a
// message AFTER it was sent, and teaching_bar.mjs, which warns BEFORE it is
// written.
//
// The first cut had teaching_bar import teaching_audit directly, and the suite
// caught what that costs within the hour — organism_test's NO SHIM CALLEE law:
// turn_hook reaches its callees in-process by rewriting process.argv[1], a module
// body runs ONCE per process, so a callee ALREADY IMPORTED by an earlier callee
// in the same sequence becomes a silent no-op that "ran" still counts as a
// success. That exact mechanism killed "outbox brief" and "captains_call deal"
// for three weeks in August. The import would have killed "teaching_audit hook"
// on the prompt anchor the same way — the recording of HIS prompt.
//
// So the shared half lives HERE, in a leaf that is nobody's hook callee. Both
// organs import it; neither imports the other. teaching_audit re-exports every
// name below, so its own API and every existing caller are untouched.
//
// LAWS. Pure derivation: reads concepts.json and the capsule mirror, writes
// NOTHING, owns no state, has no CLI verb. Every failure is soft — an absent
// registry returns the floor, never a throw, because this rides his every prompt.
// ============================================================================
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Same seam, same default, as teaching_audit.mjs — the selftest spawns against a
// temp dir and both halves of the derivation must land in the same place.
const STATE_DIR = process.env.ARSENAL_AUDIT_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

export { TERMS_OF_ART, CLOSED_EXTRA_VOCAB };

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

// ── THE OPEN CONCEPT'S OWN REAL NAMES (7 Sep 2026 — his order, mid-lesson) ───
// THE DEFECT, measured the hour he stopped the lesson for it. TERMS_OF_ART above
// is 23 words and every one of them comes from the 7 Aug evaluation/RAG failure
// that created the check. NOT ONE tokenization word is on it. So while
// tokenization was being taught, "sequence" went to him unopened and the machine
// could not fire — HE caught it, which his own canon forbids in as many words:
// "COVERAGE + RETENTION IS THE TEACHER'S JOB … unknown-unknowns Nikhil pe kabhi
// leak nahi honge." The live state showed the second half of the same defect: for
// tokenization the FLAGGED set was precision / recall / f1 / rag / chunking —
// another topic's vocabulary firing as noise while this topic's names were
// invisible. A checker that is loud about the wrong words and silent about the
// right ones is worse than none, because its silence reads as a pass.
//
// THE REPAIR IS THE POLARITY AND THE SOURCE, and it is TOPIC-AGNOSTIC BY HIS
// ORDER, given mid-build on 7 Sep 2026 when a first draft of this repair seeded a
// per-topic tokenization list: "make sure this is topic agnostic". That order is
// his standing law of 15 Aug 2026 applied here — every organ SESSION-AGNOSTIC and
// VOCAB-AGNOSTIC, never pattern-matched to the last incident's words. A
// hand-written tokenization list would have been the same defect at a new
// address: correct for one topic, silent on the next twenty-four.
//
// So NOTHING below names a topic. The watched set is derived from three sources
// that grow on their own:
//   1. TERMS_OF_ART — the frozen 7 Aug floor, kept byte-for-byte (layering law).
//   2. THE WHOLE SYLLABUS, read live out of concepts.json: every concept id and
//      every alias of every concept. New concept in the registry = watched the
//      same day, with nobody editing this file.
//   3. THE TEACHER'S OWN BACKTICKS, accumulated per concept in this organ's own
//      state. His grammar law already marks every real name with a backtick, so
//      the corpus writes itself out of the teaching that already happened.
// And 8b below needs no list at all: a name declared by backtick must be opened
// in the same message, whatever the concept, forever.
//
// WHAT IS STILL NOT CAUGHT, stated rather than hidden: a real name used with no
// backtick, absent from the registry, on its FIRST appearance — nothing lexical
// can know it is a name yet. It becomes watched the moment it is ever backticked
// once. That residue is the semantic slice RULE_NOTES already declares is not
// machine-checkable without a judge.

/** Every name the SYLLABUS knows: concept ids + all aliases, live from the
 *  registry. Topic-agnostic by construction — it is the whole registry, not any
 *  chosen part of it. */
export function syllabusVocab(stateDir = STATE_DIR) {
  const out = new Set();
  try {
    const reg = readJson(join(stateDir, "concepts.json"));
    // Both number-forms are added, because termUsed()'s tolerance only runs one
    // way: watching "embeddings" does NOT match the text "embedding", so the
    // registry's plural ids would have been half-blind. Measured before this line.
    const add = (s) => {
      const v = String(s || "").toLowerCase().trim().replace(/_/g, " ");
      if (!v) return;
      out.add(v);
      if (v.length > 4 && v.endsWith("s") && !v.endsWith("ss")) out.add(v.replace(/e?s$/, ""));
    };
    for (const [id, c] of Object.entries(((reg || {}).concepts) || {})) {
      add(id);
      for (const a of (Array.isArray(c && c.aliases) ? c.aliases : [])) add(a);
    }
  } catch { /* registry optional — the floor still stands without it */ }
  return [...out];
}

/** The concept's OWN names — used with BOTH polarities: what must be opened while
 *  it is being taught, and what a CLOSED concept has already opened. Registry
 *  aliases + the closed-vocab map + the id itself. Never includes TERMS_OF_ART or
 *  the rest of the syllabus: those belong to no single concept, and folding them
 *  in would wrongly un-pre-open vocabulary a genuinely closed concept owns. */
export function conceptOwnTerms(concept, stateDir = STATE_DIR) {
  const c = String(concept || "").toLowerCase().trim();
  if (!c) return [];
  const out = new Set([c]);
  for (const t of (CLOSED_EXTRA_VOCAB[c] || [])) out.add(String(t).toLowerCase());
  try {
    const reg = readJson(join(stateDir, "concepts.json"));
    const hit = ((reg || {}).concepts || {})[c];
    if (hit && Array.isArray(hit.aliases)) for (const a of hit.aliases) out.add(String(a).toLowerCase());
  } catch { /* registry optional */ }
  return [...out];
}

/** What neev-pehle WATCHES this turn: frozen floor + whole syllabus + the names
 *  this concept has already been seen to declare in backticks. `learned` is
 *  passed in by the caller that owns the state, so the pure engine stays pure. */
export function requiredTerms(concept, stateDir = STATE_DIR, learned = []) {
  return [...new Set([
    ...TERMS_OF_ART,
    ...syllabusVocab(stateDir),
    ...conceptOwnTerms(concept, stateDir),
    ...(Array.isArray(learned) ? learned.map((t) => String(t).toLowerCase()) : []),
  ])].filter(Boolean);
}

// `openConcept` (7 Sep 2026): the INVERTED-POLARITY defect. This function reads
// the capsule mirror and calls every capsule a closed concept — so tokenization,
// which HAS a capsule (locked June, and re-opened as UNLEARNED by GAME ON on
// 30 Aug), was in the closed set WHILE IT WAS THE CONCEPT BEING TAUGHT. Measured:
// closedDerive().vocab pre-opened "token", "vocabulary" and "tokenization"
// itself, so on the open concept the check was not merely blind, it was actively
// SUPPRESSED. A concept cannot be simultaneously the thing being taught and the
// thing already known. Its own names are removed from the pre-opened set here.
// Scope kept deliberately narrow: `names` is untouched, because link-back's
// question ("was an already-studied concept named?") is a different question and
// widening it here would silently break that check. Whether the OTHER three
// pre-GAME-ON capsules should still count as closed is HIS call or the
// architect's, and is named to him rather than decided in this line.
export function closedDerive(stateDir = STATE_DIR, openConcept = null) {
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
  let vocabOut = [...new Set(vocab.map((v) => String(v).toLowerCase()))];
  const openC = String(openConcept || "").toLowerCase().trim();
  if (openC) {
    const own = new Set(conceptOwnTerms(openC, stateDir));
    vocabOut = vocabOut.filter((v) => !own.has(v));
  }
  return { names: uniqNames, vocab: vocabOut };
}
