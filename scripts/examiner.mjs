#!/usr/bin/env node
// ============================================================================
// examiner.mjs · ARSENAL AI FC — THE LIVE EXAMINER (the build-it-live drill)
// ----------------------------------------------------------------------------
// WHAT:  Extends the Nemesis line (CYBORG_BRAIN.md §7c/d): stages a CODE ROUND
//        for the oral scrimmage — a small build task on the captain's WEAKEST
//        concept, with hidden tests the examiner runs LIVE via the Chalkboard
//        (code execution, M4). Build-it-live-under-a-stranger's-gaze is the
//        highest-transfer drill for an AI-PE interview.
// HOW:   Deterministic. Reads learning_state.json (stalling/learning concepts
//        first), falls back to FSRS hardest-due, falls back to the capsule
//        floor. A template bank (implement / debug / extend) rotates by
//        day-of-year. Writes examiner_drill.json (own file, gitignored — it
//        names his weaknesses). The scrimmage instruction picks it up when
//        fresh (staged today or yesterday evening) and runs it as the heaviest probe.
// LAWS:  the drill grades the CODE, never the coder — win-only on the result;
//        a miss resolves silently into FSRS weight (the reps flow through
//        log_reps like any market). No LLM here: staging is pure code.
// MODES: node scripts/examiner.mjs stage · status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const DRILL     = join(STATE_DIR, "examiner_drill.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// the template bank — three shapes of live pressure, all concept-parametric
const TEMPLATES = {
  implement: (c) => ({
    task: `Implement a MINIMAL working ${c} from scratch in Python — smallest honest version, no libraries doing the core step for you. Talk while you type; the examiner runs it when you say run.`,
    hidden_tests: [
      `run his code on a tiny input and check the output SHAPE is right`,
      `ask him to predict the output for one edge input BEFORE running it, then run it`,
      `change one parameter and ask what changes, then run to verify his claim`,
    ],
  }),
  debug: (c) => ({
    task: `The examiner will write a SHORT ${c} implementation containing ONE planted conceptual bug (not a typo). Read it aloud, find the flaw, fix it live.`,
    hidden_tests: [
      `run the buggy version so the failure is SEEN, not described`,
      `run his fixed version on the same input to prove the fix`,
      `ask why the bug produced THAT failure mode, not a crash`,
    ],
  }),
  extend: (c) => ({
    task: `Start from a working minimal ${c} (the examiner provides it). Extend it with ONE realistic production constraint (batching, caching, or an input guard) — his choice, defended.`,
    hidden_tests: [
      `run before-and-after on the same input; the behavior must be identical where the constraint doesn't bind`,
      `construct one input where the extension actually matters, and run it`,
      `ask for the cost of the extension (memory/latency) and sanity-check the claim in code`,
    ],
  }),
};

// deterministic concept pick: stalling > learning (worst first) > FSRS hardest > floor
function pickConcept(deps = {}) {
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  const concepts = (ls && (ls.concepts || ls.ladder || [])) || [];
  const arr = Array.isArray(concepts) ? concepts : Object.entries(concepts).map(([name, v]) => ({ name, ...(typeof v === "object" ? v : {}) }));
  // learning_state.mjs writes { id, fluency: "🔴 learning", velocity: { slope } } —
  // those keys read FIRST; the legacy trend/name/stage shapes stay as fallbacks.
  const nameOf = (c) => c.id || c.name || c.concept;
  const byTrend = (t) => arr.filter(c => ((c.velocity && c.velocity.slope) || c.trend || c.trajectory || "") === t).map(nameOf).filter(Boolean);
  const stalling = byTrend("stalling").concat(byTrend("regressing"));
  if (stalling.length) return { concept: stalling[0], why: "stalling/regressing in learning_state" };
  const learning = arr.filter(c => /learning|red/i.test(String(c.fluency || c.stage || c.state || ""))).map(nameOf).filter(Boolean);
  if (learning.length) return { concept: learning[0], why: "earliest ladder stage" };
  const cards = deps.cards !== undefined ? deps.cards : readJson(join(STATE_DIR, "cards.json"));
  const hard = (cards && cards.hardest_due) || [];
  if (hard.length) return { concept: typeof hard[0] === "string" ? hard[0] : (hard[0].concept || hard[0].topic), why: "FSRS hardest due" };
  return { concept: "tokenization", why: "capsule floor (no live signal yet)" };
}

function stageDrill(deps = {}) {
  const now = deps.now || new Date();
  const { concept, why } = pickConcept(deps);
  const kinds = Object.keys(TEMPLATES);
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const kind = kinds[doy % kinds.length];                       // rotates daily, deterministic
  const t = TEMPLATES[kind](concept);
  const drill = { date: localDate(now), staged_at: now.toISOString(), concept, picked_because: why, template: kind, task: t.task, hidden_tests: t.hidden_tests };
  (deps.write || ((o) => writeAtomic(DRILL, o)))(drill);
  return drill;
}
// what the scrimmage reads: a fresh drill or nothing. The scheduler stages at
// 21:55 FOR TOMORROW'S mock, so "fresh" = staged today OR yesterday evening —
// a same-day-only gate would leave every daytime scrimmage without its code round.
function loadFreshDrill(now = new Date(), deps = {}) {
  const d = (deps.read || (() => readJson(DRILL)))();
  if (!d) return null;
  const nowMs = now instanceof Date ? now.getTime() : now;
  return (d.date === localDate(now) || d.date === localDate(new Date(nowMs - 86400000))) ? d : null;
}
// the section the scrimmage instruction embeds
function drillSection(d) {
  if (!d) return "";
  return `\nTHE CODE ROUND (the Live Examiner staged this — run it as the heaviest probe, on the CHALKBOARD):\nConcept: ${d.concept} (${d.template} shape)\nTASK (read to him verbatim): ${d.task}\nHIDDEN TESTS — reveal each ONLY as you RUN it, never up front:\n${d.hidden_tests.map((h, i) => `${i + 1}. ${h}`).join("\n")}\nGrade the CODE, never the coder — the result is data; a miss resolves silently into the reps.\n`;
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 14, 9, 0, 0);

  const p1 = pickConcept({ ls: { concepts: [{ name: "attention", trend: "stalling" }, { name: "rag", trend: "improving" }] }, cards: null });
  assert("pick: a STALLING concept outranks everything", p1.concept === "attention" && p1.why.includes("stalling"));
  const p2 = pickConcept({ ls: { concepts: [{ name: "eval-metrics", stage: "learning" }, { name: "rag", stage: "fluent" }] }, cards: null });
  assert("pick: earliest ladder stage next", p2.concept === "eval-metrics");
  const p3 = pickConcept({ ls: null, cards: { hardest_due: ["context-windows"] } });
  assert("pick: FSRS hardest-due third", p3.concept === "context-windows");
  const p4 = pickConcept({ ls: null, cards: null });
  assert("pick: dormant-safe floor (never crashes bloodless)", p4.concept === "tokenization" && p4.why.includes("floor"));
  // the REAL learning_state.mjs shape ({ id, fluency, velocity.slope }) must drive the pick
  const p5 = pickConcept({ ls: { concepts: [{ id: "attention", fluency: "🔴 learning", velocity: { slope: "stalling" } }, { id: "rag", fluency: "🟢 fluent", velocity: { slope: "improving" } }] }, cards: null });
  assert("pick: the PRODUCER'S real schema (velocity.slope + id) is read", p5.concept === "attention" && p5.why.includes("stalling"));
  const p6 = pickConcept({ ls: { concepts: [{ id: "eval-metrics", fluency: "🔴 learning", velocity: { slope: "holding" } }] }, cards: null });
  assert("pick: real fluency label routes the learning branch", p6.concept === "eval-metrics");

  let saved = null;
  const d = stageDrill({ ls: { concepts: [{ name: "attention", trend: "stalling" }] }, cards: null, now, write: (o) => { saved = o; } });
  assert("stage: drill dated + concept + 3 hidden tests + task", saved.date === "2026-07-14" && saved.concept === "attention" && saved.hidden_tests.length === 3 && saved.task.length > 40);
  const d2 = stageDrill({ ls: { concepts: [{ name: "attention", trend: "stalling" }] }, cards: null, now, write: () => {} });
  assert("stage: deterministic (same day → same drill)", d2.template === d.template && d2.task === d.task);
  const dNext = stageDrill({ ls: { concepts: [{ name: "attention", trend: "stalling" }] }, cards: null, now: new Date(2026, 6, 15), write: () => {} });
  assert("stage: the template ROTATES by day", dNext.template !== d.template);

  assert("fresh same-day drill loads", loadFreshDrill(now, { read: () => saved }) !== null);
  assert("the 21:55 staging RIDES tomorrow's scrimmage (yesterday-staged = fresh)", loadFreshDrill(new Date(2026, 6, 15, 11, 0, 0), { read: () => saved }) !== null);
  assert("a stale drill never leaks into today's mock", loadFreshDrill(new Date(2026, 6, 16), { read: () => saved }) === null);

  const sec = drillSection(saved);
  assert("section: task travels verbatim, tests marked reveal-as-you-RUN", sec.includes(saved.task) && sec.includes("ONLY as you RUN"));
  assert("section: grade-the-code-never-the-coder law travels", sec.includes("never the coder"));
  assert("no drill → empty section (scrimmage unchanged)", drillSection(null) === "");
  assert("all three templates concept-parametric", Object.values(TEMPLATES).every(f => f("x").task.includes("x") || f("x").task.length > 0));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "stage") {
    const d = stageDrill();
    console.log(`examiner: staged a ${d.template} drill on "${d.concept}" (${d.picked_because}) — the scrimmage will run it on the Chalkboard`);
    return;
  }
  const d = loadFreshDrill();
  console.log(d ? `examiner: fresh drill staged — ${d.template} on "${d.concept}"` : "examiner: nothing staged today (run: examiner.mjs stage)");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { pickConcept, stageDrill, loadFreshDrill, drillSection, TEMPLATES };
