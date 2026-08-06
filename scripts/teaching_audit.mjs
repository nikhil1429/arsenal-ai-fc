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
// THE ASYMMETRY THIS CLOSES: the hooks INJECT the rules every turn (they do, and
// that part is real). Nothing ever CHECKED whether the turn obeyed them.
// `grep` for callers of the drift ranking returned exactly one file: itself.
//
// WHY IT CAN BE TRUSTED WHERE `flag` CANNOT: `flag` is the model grading the
// model, so canon correctly forces it to STAGE and never rank. This organ is
// CODE measuring the model's output — the repo's own "AI proposes · code
// validates · human approves" principle, in that order. A regex does not have a
// motive to protect its own reputation.
//
// THE EVIDENCE WAS ALWAYS THERE. The Stop hook has filed every assistant message
// as a `claude-code-teaching` afferent for weeks — 382 of them. Nobody wrote the
// reader. (Those rows were also truncated at 2000 chars until his 6 Aug "there
// should be no limit" ruling, which mattered enormously here: a cap removes the
// END of a message, which is precisely where the check-question lives. So this
// organ reads the FULL text from the hook payload, never the stored row.)
//
// EVERY CHECK HERE IS THRESHOLD-FREE. Not one number is guessed — each rule is
// binary and its own definition:
//   · more than ONE check-question           → counting, not a threshold
//   · ZERO Hindi function words              → zero is not a chosen number
//   · a banned phrase is present             → presence, not a score
//   · a scripts/ command mid-concept         → presence
//   · the step advanced after "samajh nahi aaya" → a state comparison
// Anything needing a real number (message length, Hinglish RATIO, dheema-vs-lamba)
// is deliberately NOT judged here — it is recorded under `measured` and judged by
// nobody until there is real data. See the note on his 1 Aug standing rule at the
// bottom of this header.
//
// SCOPE — WHEN IT RUNS: only while a FORGE SESSION IS OPEN. That is the exact
// window in which THE METHOD's rules apply. Running it over ops conversations
// (repo work, audits, planning) would fire constantly on turns the rules were
// never written for, and a checker that cries wolf gets ignored — which would
// leave him worse off than no checker at all.
//
// IT NEVER BLOCKS. Fail-silent, no stdout on the hook path, no throw. A checker
// that can break his session is a worse defect than the drift it catches.
//
// WRITES: dressing-room/state/teaching_audit.jsonl (append-only, this organ is
// its single writer) and STAGES into teaching_contract's queue via its public
// `flag` path. It never touches `hits` — his word still promotes, exactly as the
// contract's Law 4 requires. What changes is that the catching is now automatic;
// the ruling stays his.
//
// HIS 1 AUG STANDING RULE, and why it is quoted rather than assumed: "why are we
// setting numerical limits in the entire organism when we are starting it from
// the scratch? shouldn't everything in the organism be fully opened and then we
// analyze the data in 30-45-60 days and then think what should be the numerical
// limits??" On 6 Aug he said that was about his syllabus, not the organism. That
// ruling is open. This file is built so the answer does not matter: it uses no
// thresholds at all, so it is correct under either reading.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const LOG = join(STATE_DIR, "teaching_audit.jsonl");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

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
const CONFUSION_MARKERS = [
  "samajh nahi aaya", "samajh nhi aaya", "samjha nahi", "nahi samjha",
  "i don't understand", "i dont understand", "didn't get it", "didnt get it",
  "confused", "lost", "kuch samajh nahi",
];

const norm = (s) => String(s || "").toLowerCase();

// Count the check-questions in a message. Only a `?` that ENDS a sentence counts:
// a rhetorical mid-sentence question mark is not a question put TO him. Fenced
// code blocks are stripped first — a `?` inside code is syntax, not a question.
export function countQuestions(text) {
  const stripped = String(text || "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const m = stripped.match(/\?(?=\s|$)/g);
  return m ? m.length : 0;
}

export function hindiMarkerCount(text) {
  const words = norm(text).replace(/```[\s\S]*?```/g, " ").split(/[^a-zऀ-ॿ]+/).filter(Boolean);
  if (/[ऀ-ॿ]/.test(String(text || ""))) return 999;   // Devanagari is unambiguously Hindi
  return words.filter((w) => HINDI_MARKERS.includes(w)).length;
}

// A shell/tool instruction aimed at the organism itself, mid-concept.
// HOW_HE_LEARNS #12 — the OTHER of the two that break him most.
export function mentionsSystemWork(text) {
  const t = String(text || "");
  return /node\s+scripts[\\/]|npm\s+(test|run)\b|git\s+(commit|push|add|status)\b|schtasks\b/.test(t);
}

/**
 * Audit ONE completed turn. Pure — no I/O, fully injectable, so the selftest
 * exercises the same function the hook calls.
 *
 *  assistantText  the FULL assistant message (never the truncated stored row)
 *  userText       his prompt that opened this turn
 *  session        forge_session.json's session object, or null when none is open
 *  prevStep       the step number BEFORE this turn (to see an advance)
 */
export function auditTurn({ assistantText = "", userText = "", session = null, prevStep = null } = {}) {
  const drifts = [];
  const open = !!(session && !session.closed_at);

  // SCOPE GATE. Outside an open forge session THE METHOD does not apply, and a
  // checker that fires on ops turns would be noise he learns to ignore.
  if (!open) {
    return { audited: false, why: "no open forge session — THE METHOD does not apply to this turn", drifts: [], measured: null };
  }

  const step = Number(session.step);
  const quote = (s, n = 120) => String(s || "").replace(/\s+/g, " ").slice(0, n);

  // ---- 1) ONE check-question per message (HOW_HE_LEARNS #1) ---------------
  // His #1 rule and the one he has been failed on most. Canon allows exactly
  // four question-moments by design; anything else is a quiz-dump.
  const qs = countQuestions(assistantText);
  if (qs > 1) {
    drifts.push({
      rule: "one-idea",
      evidence: `${qs} question marks ended a sentence in one teaching message (canon allows ONE check-question)`,
      excerpt: quote(String(assistantText).split(/(?<=\?)\s+/).filter((s) => s.includes("?")).join(" … "), 200),
    });
  }

  // ---- 2) Hinglish, not English (his explicit, twice-stated instruction) ---
  if (hindiMarkerCount(assistantText) === 0 && String(assistantText).trim().length > 0) {
    drifts.push({
      rule: "hinglish",
      evidence: "ZERO Hindi function words in a teaching turn — this was English, and he asked twice for Hinglish",
      excerpt: quote(assistantText),
    });
  }

  // ---- 3) never place his level above his own (HOW_HE_LEARNS #10) ---------
  const found = ABOVE_HIS_LEVEL.filter((p) => norm(assistantText).includes(p));
  if (found.length) {
    drifts.push({
      rule: "his-level",
      evidence: `phrase(s) that put his level above his own word: ${found.map((f) => `"${f}"`).join(", ")}`,
      excerpt: quote(assistantText, 160),
    });
  }

  // ---- 4) no system/tool work mid-concept (HOW_HE_LEARNS #12) -------------
  // Steps 3-6 are the teaching body. Naming a repo command there pulls him out
  // of the concept and into the machine — canon says name it, park it, hand back
  // the micro-question.
  if (Number.isFinite(step) && step >= 3 && step <= 6 && mentionsSystemWork(assistantText)) {
    drifts.push({
      rule: "no-system-mid-concept",
      evidence: `a repo command appeared inside the teaching body (step ${step}) — park it in one line, hand back the micro-question`,
      excerpt: quote(assistantText, 160),
    });
  }

  // ---- 5) "samajh nahi aaya" is literal (HOW_HE_LEARNS #9) ----------------
  // If he said he did not understand and the very next turn ADVANCED the step,
  // the rule was broken by definition — no judgement call involved.
  const saidConfused = CONFUSION_MARKERS.some((m) => norm(userText).includes(m));
  if (saidConfused && Number.isFinite(prevStep) && Number.isFinite(step) && step > prevStep) {
    drifts.push({
      rule: "confusion-is-literal",
      evidence: `he said he did not understand, and the step still advanced ${prevStep} → ${step} (canon: stop there, restart from zero)`,
      excerpt: quote(userText),
    });
  }

  // ---- MEASURED ONLY, NEVER JUDGED ---------------------------------------
  // These are the ones that would need a real number. No verdict is derived from
  // them here and none should be until there is real data to derive it from.
  const measured = {
    chars: String(assistantText).length,
    questions: qs,
    hindi_markers: hindiMarkerCount(assistantText),
    code_fences: (String(assistantText).match(/```/g) || []).length / 2,
    step,
  };

  return { audited: true, why: null, drifts, measured };
}

// ---------------------------------------------------------------------------
// THE HOOK PATH. Reads the Stop payload on stdin, audits, stages any drift.
// Never prints on success, never throws, never blocks.
// ---------------------------------------------------------------------------
function stageDrift(d) {
  // Goes through teaching_contract's PUBLIC `flag` — which stages and never ranks.
  // Shelling out (rather than importing) keeps that file the single writer of its
  // own state, exactly as the owners-only law requires.
  try {
    spawnSync(process.execPath, [
      join(__dirname, "teaching_contract.mjs"), "flag", d.rule,
      "--why", `[auto] ${d.evidence}`,
    ], { timeout: 5000, stdio: "ignore" });
  } catch { /* a checker must never break the session */ }
}

async function hookMain() {
  let raw = "";
  try {
    for await (const c of process.stdin) raw += c;
  } catch { return; }
  let hook = {};
  try { hook = JSON.parse(raw || "{}"); } catch { return; }
  if ((hook.hook_event_name || "") !== "Stop") return;

  const session = (readJson(join(STATE_DIR, "forge_session.json")) || {}).session || null;
  const prev = readJson(join(STATE_DIR, "teaching_audit_last.json"));
  const res = auditTurn({
    assistantText: String(hook.last_assistant_message || ""),
    userText: String(prev && prev.last_user_text || ""),
    session,
    prevStep: prev && Number.isFinite(prev.step) ? prev.step : null,
  });

  try {
    writeFileSync(join(STATE_DIR, "teaching_audit_last.json"),
      JSON.stringify({ step: session ? Number(session.step) : null, at: new Date().toISOString() }, null, 1));
  } catch { /* never block */ }

  if (!res.audited) return;
  try {
    appendFileSync(LOG, JSON.stringify({
      ts: new Date().toISOString(),
      concept: session.concept, step: res.measured.step,
      drifts: res.drifts.map((d) => d.rule),
      measured: res.measured,
      evidence: res.drifts.map((d) => d.evidence),
    }) + "\n", "utf8");
  } catch { /* never block */ }
  for (const d of res.drifts) stageDrift(d);
}

// ---------------------------------------------------------------------------
function report() {
  if (!existsSync(LOG)) { console.log("teaching_audit: no turns audited yet (it runs only while a forge session is open)."); return; }
  const rows = readFileSync(LOG, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!rows.length) { console.log("teaching_audit: no turns audited yet."); return; }
  const withDrift = rows.filter((r) => r.drifts.length);
  const byRule = {};
  for (const r of rows) for (const d of r.drifts) byRule[d] = (byRule[d] || 0) + 1;
  console.log(`\n== TEACHING AUDIT ==  ${rows.length} turn(s) audited · ${withDrift.length} with drift`);
  if (!withDrift.length) { console.log("  no drift caught. (Absence of a caught drift is not proof of clean teaching — only the CHECKED rules are checked.)\n"); return; }
  for (const [k, v] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}×  ${k}`);
  console.log("\n  last 3:");
  for (const r of withDrift.slice(-3)) console.log(`   · ${String(r.ts).slice(0, 16)} step ${r.step} — ${r.evidence.join(" | ")}`);
  console.log("");
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const OPEN = { concept: "hallucinations", step: 4, closed_at: null };

  console.log("\n== teaching_audit selftest ==\n");

  // --- the scope gate ------------------------------------------------------
  assert("no open forge session ⇒ NOT audited (ops turns are not teaching turns)",
    auditTurn({ assistantText: "Pure English, many? questions? here?", session: null }).audited === false);
  assert("a CLOSED session is not audited either",
    auditTurn({ assistantText: "x", session: { ...OPEN, closed_at: "2026-08-04T00:00:00Z" } }).audited === false);

  // --- 1) one check-question ----------------------------------------------
  assert("TWO check-questions in one message is caught (his #1 rule, threshold-free counting)",
    auditTurn({ assistantText: "Token kya hota hai? Aur vocabulary kya hai?", session: OPEN })
      .drifts.some((d) => d.rule === "one-idea"));
  assert("ONE check-question is clean",
    !auditTurn({ assistantText: "Ab bolo — token kya hota hai?", session: OPEN })
      .drifts.some((d) => d.rule === "one-idea"));
  assert("a `?` inside a fenced code block is NOT a question put to him",
    countQuestions("dekho ye code:\n```\nx = a ? b : c;\ny = d ? e : f;\n```\nsamajh aaya?") === 1);

  // --- 2) Hinglish ---------------------------------------------------------
  assert("a fully English teaching turn is caught",
    auditTurn({ assistantText: "A token is the smallest unit the model reads.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("Hinglish passes",
    !auditTurn({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("TECHNICAL TERMS STAY ENGLISH — a Hinglish sentence full of them is still clean (canon: never translate the name)",
    !auditTurn({ assistantText: "Yahan tokenizer vocabulary se next-token prediction karta hai, phir sampling hoti hai.", session: OPEN })
      .drifts.some((d) => d.rule === "hinglish"));
  assert("Devanagari counts as Hindi, never flagged as English",
    hindiMarkerCount("टोकन सबसे छोटी इकाई होती है") === 999);
  // THE BUG THIS FILE'S OWN SELFTEST CAUGHT ON ITS FIRST RUN. The marker list
  // contained "the", "to", "me", "hi", "par" — Hindi words spelled identically to
  // the commonest English ones — so plain English scored as Hinglish and the whole
  // check was inert. These are the exact sentences that were silently passing.
  assert("HOMOGRAPH GUARD — 'the'/'to'/'me' do not make an English sentence read as Hinglish",
    hindiMarkerCount("A token is the smallest unit the model reads, so it has to map to me.") === 0);
  assert("HOMOGRAPH GUARD — nor does 'hi' or 'par'",
    hindiMarkerCount("Hi, this is on par with what we discussed.") === 0);

  // --- 3) his level --------------------------------------------------------
  assert('"you already know this" is caught (HOW_HE_LEARNS #10)',
    auditTurn({ assistantText: "Ye to tumhe pata hai — you already know this concept.", session: OPEN })
      .drifts.some((d) => d.rule === "his-level"));
  assert("a clean turn does not trip the level rule",
    !auditTurn({ assistantText: "Chalo shuru se dekhte hain, ekdum zero se.", session: OPEN })
      .drifts.some((d) => d.rule === "his-level"));

  // --- 4) no system work mid-concept --------------------------------------
  assert("a repo command inside the teaching body (step 4) is caught (HOW_HE_LEARNS #12)",
    auditTurn({ assistantText: "Ruko, pehle `node scripts/capture.mjs rep` chala lo.", session: OPEN })
      .drifts.some((d) => d.rule === "no-system-mid-concept"));
  assert("the SAME command outside steps 3-6 is NOT a drift (close/setup steps legitimately name commands)",
    !auditTurn({ assistantText: "Ab `node scripts/capture.mjs rep` chalao.", session: { ...OPEN, step: 10 } })
      .drifts.some((d) => d.rule === "no-system-mid-concept"));

  // --- 5) confusion is literal --------------------------------------------
  assert('"samajh nahi aaya" + the step still advanced is caught (HOW_HE_LEARNS #9)',
    auditTurn({ assistantText: "Theek hai, aage badhte hain.", userText: "yaar samajh nahi aaya", session: OPEN, prevStep: 3 })
      .drifts.some((d) => d.rule === "confusion-is-literal"));
  assert("confusion + STAYING on the step is clean — that is obeying the rule",
    !auditTurn({ assistantText: "Theek hai, wapas zero se.", userText: "samajh nahi aaya", session: { ...OPEN, step: 3 }, prevStep: 3 })
      .drifts.some((d) => d.rule === "confusion-is-literal"));

  // --- the measure-only lane ----------------------------------------------
  {
    const r = auditTurn({ assistantText: "Token wo chhoti unit hai jo model padhta hai.", session: OPEN });
    assert("length / ratio are MEASURED but never judged (no number is guessed anywhere in this file)",
      r.measured && typeof r.measured.chars === "number" && typeof r.measured.hindi_markers === "number"
      && !r.drifts.some((d) => /length|ratio|too long|too short/i.test(d.rule + d.evidence)));
  }

  // --- the honest limits ---------------------------------------------------
  assert("a clean Hinglish turn with one question produces NO drift at all",
    auditTurn({ assistantText: "Token wo sabse chhoti unit hai jo model padhta hai. Ab bolo — tumhare hisaab se 'khaana' kitne token banega?", session: OPEN }).drifts.length === 0);
  assert("every drift carries QUOTED evidence, never a bare verdict",
    auditTurn({ assistantText: "A token is the smallest unit.", session: OPEN })
      .drifts.every((d) => typeof d.evidence === "string" && d.evidence.length > 10 && typeof d.excerpt === "string"));

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)\n`);
  if (fail) process.exit(1);
}

const cmd = process.argv[2];
if (cmd === "selftest") selftest();
else if (cmd === "report") report();
else if (cmd === "hook") await hookMain();
else console.log("teaching_audit: hook | report | selftest");
