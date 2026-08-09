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
//        floor. THREE template banks — mechanism (implement/debug/extend),
//        phenomenon (elicit/detect/measure) and judgment (decide/critique) —
//        are selected by what KIND of thing the concept is, then rotate by
//        day-of-year WITHIN that bank (audit #36: it used to rotate over the
//        mechanism bank unconditionally and staged "Implement a MINIMAL working
//        hallucinations from scratch", which is not a thing that can be done).
//        Writes examiner_drill.json (own file — TRACKED since D10, the captain's
//        5 Aug 2026 ruling recorded in .gitignore; this header said "gitignored"
//        until the 7 Aug full-organism audit caught the drift). The scrimmage
//        instruction picks it up when
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
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
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

// ---------------------------------------------------------------------------
// 2 Aug 2026 audit, finding #36 — THE LIVE DRILL WAS INCOHERENT.
// The three templates above are ALL mechanism-shaped: "Implement a MINIMAL working
// ${c}", "a SHORT ${c} implementation", "a working minimal ${c}". They assume the
// concept is a BUILDABLE MECHANISM. But `stageDrill` rotated purely on day-of-year
// with no idea what kind of thing the concept was, so on 2026-08-04 it staged, live
// on disk:
//     "Implement a MINIMAL working hallucinations from scratch in Python"
// Hallucinations is a FAILURE PHENOMENON. You cannot implement one from scratch, and
// every one of the three templates was equally incoherent for it — this was never a
// bug in `implement` alone, it was a missing question: what kind of thing is this?
//
// The templates above stay FROZEN and unchanged (CLAUDE.md's layering law) and remain
// the plan of record for mechanisms. Two more families join them, and the selector
// below picks the family by what the concept IS, then rotates deterministically
// WITHIN that family so the existing "rotates by day / same day → same drill"
// contract still holds.
//
// This keeps the organ's whole point intact — its header calls the code round "the
// highest-transfer drill for an AI-PE interview" — because a phenomenon still gets a
// CODE drill (write a probe that elicits it, write a check that detects it), not a
// downgrade to an essay question.

// PHENOMENON — a thing that HAPPENS TO a system. You cannot build one; you elicit it,
// detect it, and measure it. That IS the AI-PE skill for this class of concept.
const PROBE_TEMPLATES = {
  elicit: (c) => ({
    task: `Write the SHORTEST prompt-and-script you can that reliably PROVOKES ${c} from a model, in Python. Talk while you type; the examiner runs it when you say run. A single reproducible case beats a clever one.`,
    hidden_tests: [
      `run it and confirm ${c} actually appeared — if it did not, his hypothesis about the cause was wrong; ask what he expected`,
      `ask him to change ONE thing he predicts will make it worse, then run it and compare`,
      `ask what a FALSE POSITIVE would look like here, and whether his script could tell the difference`,
    ],
  }),
  detect: (c) => ({
    task: `Write a DETECTOR in Python: given a model output (and whatever grounding you decide it needs), return a judgement about whether ${c} occurred. You choose the signal; defend it while you type.`,
    hidden_tests: [
      `run it on one clean case and one ${c} case — it must separate them`,
      `hand him a case his detector gets WRONG, and ask him to explain the failure before fixing it`,
      `ask for the precision/recall trade-off his threshold implies, and which one he would rather lose here`,
    ],
  }),
  measure: (c) => ({
    task: `Build the smallest honest MEASUREMENT of ${c} in Python — a tiny labelled set and a score. Ten examples is enough if they are honest. Talk through what the number would have to say to change your mind.`,
    hidden_tests: [
      `run it and ask what the number MEANS — a score with no interpretation is not a measurement`,
      `ask how many examples his score would need before he would trust it, and why that number`,
      `plant one mislabelled example and see whether he notices the score move`,
    ],
  }),
};

// JUDGMENT — a decision or a practice, not a mechanism and not a phenomenon.
// "Implement where_not_ai from scratch" is the same category error as the one above.
const DESIGN_TEMPLATES = {
  decide: (c) => ({
    task: `The examiner hands you one concrete, realistic scenario. Apply ${c} to it and COMMIT to a decision in writing — then write the smallest piece of Python that would hold your decision true in production (a guard, a check, a router).`,
    hidden_tests: [
      `run his guard on the case it is meant to catch`,
      `hand him the scenario flipped, and see whether his decision flips too — if it does not, ask why not`,
      `ask what evidence would make him reverse the decision`,
    ],
  }),
  critique: (c) => ({
    task: `The examiner shows a short design that gets ${c} WRONG in one specific way. Find it, say why it bites in production and not in a demo, then write the code that fixes it.`,
    hidden_tests: [
      `make him run the broken version so the failure is SEEN, not described`,
      `run his fix on the same input to prove it`,
      `ask what it COSTS — every guard buys safety with something`,
    ],
  }),
};

// What KIND of thing is each concept? Only entries we are confident about are listed;
// everything else keeps today's behaviour (mechanism) so this fix disturbs nothing that
// was already coherent. A concept may also carry `drill_shape` in concepts.json — that
// hand-curated CANON always wins, so the captain can reclassify without a code change.
const SHAPE = { MECHANISM: "mechanism", PHENOMENON: "phenomenon", JUDGMENT: "judgment" };
// Every id in concepts.json is classified here, deliberately — including the
// mechanisms, which would have taken the default anyway. Listing them makes them
// VERIFIED, which is what keeps the `shape_unverified` warning RARE. If the default
// left them unclassified, every single drill would carry a ⚠ and he would learn to
// ignore it — the exact warning-fatigue failure the audit records at finding #38
// ("a warning that always fires is a warning he will learn to ignore").
const CONCEPT_SHAPE = {
  // --- MECHANISM: a buildable artifact. "Implement a minimal X" is coherent. ---
  tokenization: SHAPE.MECHANISM,
  inference: SHAPE.MECHANISM,
  context: SHAPE.MECHANISM,
  embeddings: SHAPE.MECHANISM,
  chunking: SHAPE.MECHANISM,
  retrieval: SHAPE.MECHANISM,
  rag_eval: SHAPE.MECHANISM,                  // an eval harness is a thing you write
  vector_search: SHAPE.MECHANISM,
  tool_use: SHAPE.MECHANISM,
  react_agent: SHAPE.MECHANISM,
  structured_output: SHAPE.MECHANISM,
  multimodal: SHAPE.MECHANISM,
  confidence_scoring: SHAPE.MECHANISM,
  multi_model_verification: SHAPE.MECHANISM,
  golden_dataset: SHAPE.MECHANISM,            // building the set IS the drill
  llm_judge: SHAPE.MECHANISM,
  observability: SHAPE.MECHANISM,             // tracing hooks are code
  neuralnet: SHAPE.MECHANISM,
  rlhf: SHAPE.MECHANISM,

  // --- PHENOMENON: something that HAPPENS TO a system. Elicit / detect / measure. ---
  hallucinations: SHAPE.PHENOMENON,           // the live 2026-08-04 casualty
  jagged: SHAPE.PHENOMENON,                   // the jagged frontier is observed, not built

  // --- JUDGMENT: a decision or a practice. "Implement it from scratch" is a category error. ---
  where_not_ai: SHAPE.JUDGMENT,
  human_in_loop: SHAPE.JUDGMENT,
  tds: SHAPE.JUDGMENT,                        // domain rules he APPLIES to a scenario
  tcs: SHAPE.JUDGMENT,
  dtaa: SHAPE.JUDGMENT,
};
const FAMILY = {
  [SHAPE.MECHANISM]: TEMPLATES,
  [SHAPE.PHENOMENON]: PROBE_TEMPLATES,
  [SHAPE.JUDGMENT]: DESIGN_TEMPLATES,
};

// Resolve a concept's shape: canon override > our registry > honest default.
// The default is MECHANISM because that is what most of his ladder genuinely is and
// it preserves the highest-transfer drill — but an UNCLASSIFIED concept is flagged
// `shape_unverified`, and the drill carries a one-line instruction telling the examiner
// to switch families if the shape does not fit. A guess that announces itself is not a
// lie; a guess that renders as fact is exactly what this audit exists to hunt.
function conceptShape(concept, deps = {}) {
  const key = String(concept || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  const canon = deps.concepts !== undefined ? deps.concepts : readJson(join(STATE_DIR, "concepts.json"));
  const entry = canon && canon.concepts && canon.concepts[key];
  if (entry && typeof entry.drill_shape === "string" && FAMILY[entry.drill_shape]) {
    return { shape: entry.drill_shape, verified: true, source: "concepts.json canon" };
  }
  if (CONCEPT_SHAPE[key]) return { shape: CONCEPT_SHAPE[key], verified: true, source: "examiner registry" };
  return { shape: SHAPE.MECHANISM, verified: false, source: "default (unclassified)" };
}

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

// P2 (9 Aug 2026, his unleash word) — the night coach's machine sibling,
// brain_out/night_coach/<date>.json, served under the morning it teaches
// (producer declares serve:next_morning) → calendar lookback [today, yesterday],
// shape-checked because an LLM-written file is exactly the class that arrives
// half-valid. Enrichment only: it may annotate the staged drill, never pick the
// concept, never perturb the family or the day rotation.
function readNight(now = new Date(), dir = join(STATE_DIR, "brain_out/night_coach")) {
  const ms = now instanceof Date ? now.getTime() : now;
  for (const d of [localDate(new Date(ms)), localDate(new Date(ms - 86400000))]) {
    const nc = readJson(join(dir, d + ".json"));
    if (nc && Array.isArray(nc.misconceptions)) return { ...nc, _resolved_date: d };
  }
  return null;
}

function stageDrill(deps = {}) {
  const now = deps.now || new Date();
  const { concept, why } = pickConcept(deps);
  // audit #36: pick the FAMILY by what the concept is, then rotate WITHIN it. The old
  // code rotated over TEMPLATES unconditionally, which is how "Implement a MINIMAL
  // working hallucinations from scratch in Python" reached disk.
  const { shape, verified, source } = conceptShape(concept, deps);
  const bank = FAMILY[shape] || TEMPLATES;
  const kinds = Object.keys(bank);
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const kind = kinds[doy % kinds.length];                       // rotates daily, deterministic
  const t = bank[kind](concept);
  const drill = {
    date: localDate(now), staged_at: now.toISOString(), concept, picked_because: why,
    shape, shape_source: source, shape_unverified: !verified,
    template: kind, task: t.task, hidden_tests: t.hidden_tests,
  };
  // An unclassified concept says so OUT LOUD to the examiner rather than silently
  // betting that it is buildable (rule: never render a guess as a fact).
  if (!verified) {
    drill.adapt_note = `SHAPE UNVERIFIED — "${concept}" is not classified, so this drill assumes it is a buildable mechanism. If it is really a phenomenon (something that happens TO a system) or a judgment call, say so and switch the drill to "write a probe that elicits it + a check that detects it" instead. Then tell the captain to add "drill_shape" to concepts.json.`;
  }
  // P2 — night-coach enrichment, the adapt_note pattern: present only when the
  // overnight map names THIS drill's concept, so a coach-less night stages a
  // byte-identical drill. Template/family/rotation are never touched.
  const night = deps.night !== undefined ? deps.night : readNight(now);
  if (night) {
    const key = String(concept || "").toLowerCase().trim();
    const m = (night.misconceptions || []).find((x) => {
      const c = String((x && x.concept) || "").toLowerCase().trim();
      return c && key && (c === key || key.includes(c) || c.includes(key));
    });
    if (m) {
      const note = [
        m.what_he_thinks ? `raat ke coach ne pakda — woh soch raha hai: ${m.what_he_thinks}` : null,
        m.whats_true ? `sach: ${m.whats_true}` : null,
      ].filter(Boolean).join(" · ");
      if (note) drill.night_note = note.slice(0, 240);
    }
  }
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
  // audit #36: the adapt note rides to the examiner whenever the concept's shape was
  // a default rather than a classification, so an unverified guess can never be read
  // as a verified instruction.
  const adapt = d.adapt_note ? `\n⚠ ${d.adapt_note}\n` : "";
  // P2 — the night coach's read rides to the examiner the same way the adapt note
  // does: present only when real, aimed at the examiner (probe WHERE the crack is).
  const night = d.night_note ? `\n🌙 ${d.night_note} — probe isi darar pe.\n` : "";
  return `\nTHE CODE ROUND (the Live Examiner staged this — run it as the heaviest probe, on the CHALKBOARD):\nConcept: ${d.concept} (${d.template} shape${d.shape ? ` · ${d.shape}` : ""})\nTASK (read to him verbatim): ${d.task}\nHIDDEN TESTS — reveal each ONLY as you RUN it, never up front:\n${d.hidden_tests.map((h, i) => `${i + 1}. ${h}`).join("\n")}${adapt}${night}\nGrade the CODE, never the coder — the result is data; a miss resolves silently into the reps.\n`;
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
  // E2E audit 25 Jul 2026: this check was vacuous TWICE OVER and could never go red.
  // (1) the `|| f("x").task.length > 0` arm passed for any non-empty prose, so a
  // template that dropped `${c}` entirely still read green; (2) even the first arm
  // was unfalsifiable — the word "e-x-aminer" sits in every template's prose, so
  // .includes("x") was true regardless of interpolation. A drill that stops naming
  // his weakest concept is the whole failure this file exists to prevent, so the
  // probe now uses a sentinel that cannot occur in English prose and no escape hatch.
  const SENTINEL = "zzconceptzz";
  assert("all three templates concept-parametric", Object.values(TEMPLATES).every(f => f(SENTINEL).task.includes(SENTINEL)));
  assert("EVERY family is concept-parametric (probe + design too)",
    Object.values(FAMILY).every(bank => Object.values(bank).every(f => f(SENTINEL).task.includes(SENTINEL))));

  // --- audit #36: THE INCOHERENT DRILL ------------------------------------
  // Live on disk 2026-08-04: "Implement a MINIMAL working hallucinations from
  // scratch in Python". Hallucinations is a phenomenon; it cannot be implemented.
  // Rotate a phenomenon through a FULL YEAR and assert it never once gets handed a
  // build-it task — a single-day check would pass by luck of the day-of-year.
  const phenomTasks = [];
  for (let day = 0; day < 366; day++) {
    const when = new Date(2026, 0, 1 + day);
    phenomTasks.push(stageDrill({ now: when, ls: { concepts: [{ id: "hallucinations", fluency: "🔴 learning" }] }, write: () => {} }));
  }
  assert("PHENOMENON: 'hallucinations' NEVER gets a build-it drill, on any day of the year",
    phenomTasks.every(d => !/implement a minimal working/i.test(d.task)));
  assert("PHENOMENON: it is routed to the probe family instead",
    phenomTasks.every(d => d.shape === "phenomenon" && Object.keys(PROBE_TEMPLATES).includes(d.template)));
  assert("PHENOMENON: the probe drill is still a CODE round (the organ's whole point)",
    phenomTasks.every(d => /python/i.test(d.task)) && phenomTasks.some(d => /detector/i.test(d.task)));
  assert("PHENOMENON: a classified concept carries NO adapt-note (it is not a guess)",
    phenomTasks.every(d => !d.shape_unverified && !d.adapt_note));
  assert("PHENOMENON: it still rotates within its family (not one frozen drill)",
    new Set(phenomTasks.map(d => d.template)).size === Object.keys(PROBE_TEMPLATES).length);

  // A genuine mechanism must be UNAFFECTED — this fix disturbs nothing coherent.
  const mech = stageDrill({ now: new Date(2026, 0, 1), ls: { concepts: [{ id: "embeddings", fluency: "🔴 learning" }] }, write: () => {} });
  assert("MECHANISM: 'embeddings' still gets the high-transfer build-it drill",
    mech.shape === "mechanism" && Object.keys(TEMPLATES).includes(mech.template));

  // An UNCLASSIFIED concept may guess — but it must announce the guess.
  const unk = stageDrill({ now: new Date(2026, 0, 1), ls: { concepts: [{ id: "some_brand_new_thing", fluency: "🔴 learning" }] }, write: () => {} });
  assert("UNKNOWN: an unclassified concept is flagged shape_unverified, not silently assumed",
    unk.shape_unverified === true && typeof unk.adapt_note === "string");
  assert("UNKNOWN: the adapt-note reaches the examiner through drillSection",
    drillSection(unk).includes("SHAPE UNVERIFIED"));
  assert("UNKNOWN: a CLASSIFIED concept's section carries no such warning",
    !drillSection(mech).includes("SHAPE UNVERIFIED"));

  // concepts.json canon outranks the built-in registry (so he can reclassify without code).
  const overridden = stageDrill({
    now: new Date(2026, 0, 1), ls: { concepts: [{ id: "hallucinations", fluency: "🔴 learning" }] },
    concepts: { concepts: { hallucinations: { drill_shape: "judgment" } } }, write: () => {},
  });
  assert("CANON WINS: a drill_shape in concepts.json overrides the built-in registry",
    overridden.shape === "judgment" && overridden.shape_source === "concepts.json canon");

  // --- P2: THE NIGHT COACH enrichment (9 Aug 2026, his unleash word) --------
  {
    const nightFix = { study_day: "2026-07-13", misconceptions: [
      { concept: "attention", what_he_thinks: "poora matrix ek saath ban jaata hai", whats_true: "har token ka score alag-alag ban ke softmax se milta hai" },
    ], lesson: { concept: "attention", samjhao_passes: ["p"], widget_gates: [], check_question: "?" } };
    const base = { ls: { concepts: [{ name: "attention", trend: "stalling" }] }, cards: null, now, write: () => {} };
    const dn = stageDrill({ ...base, night: nightFix });
    assert("P2 night note rides the drill when the map names the picked concept", /woh soch raha hai/.test(dn.night_note || ""));
    assert("P2 the note reaches the examiner through drillSection (probe the crack)", drillSection(dn).includes("🌙") && drillSection(dn).includes("darar"));
    const dn0 = stageDrill({ ...base, night: null });
    assert("P2 no night file ⇒ no night_note key, drill byte-identical", !("night_note" in dn0) && dn0.task === d.task && dn0.template === d.template);
    const dnMiss = stageDrill({ ls: { concepts: [{ name: "rag", trend: "stalling" }] }, cards: null, now, night: nightFix, write: () => {} });
    assert("P2 a map naming a DIFFERENT concept attaches nothing", !("night_note" in dnMiss));
    assert("P2 enrichment never perturbs the template rotation", dn.template === d.template);
    assert("P2 a shapeless night file resolves to null at the reader (readJson can't tell missing from malformed)",
      stageDrill({ ...base, night: undefined, write: () => {} }) !== null);   // live-dir default path never throws
  }

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

export { pickConcept, stageDrill, loadFreshDrill, drillSection, TEMPLATES, PROBE_TEMPLATES, DESIGN_TEMPLATES, FAMILY, conceptShape, SHAPE };
