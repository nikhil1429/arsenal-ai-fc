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
//        (11 Aug 2026 — that "resolves silently into the reps" clause was a claim
//        with no wire: reps_log.jsonl held 21 rows and ZERO carrying the voice
//        mock's tag "scrimmage-voice", so no rep from this drill has ever existed
//        and nothing distinguished "played" from "dropped". The clause stands as
//        the DESIGN; what is now true in code is the receipt lane below —
//        markServed stamps `served:[{by,at}]` on the drill when a surface actually
//        embeds it, and `stage` reports an outgoing drill that carries none.)
// MODES: node scripts/examiner.mjs stage · status · served · unserve · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";                 // selftest only — the traced reader is proved on a REAL corrupt file, never inside dressing-room/state
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";  // selftest only — the mode guard is proved on the REAL CLI, not on the resolver alone
import { dayKey, addDays } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const DRILL     = join(STATE_DIR, "examiner_drill.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
// ---------------------------------------------------------------------------
// 11 Aug 2026, wiring audit — THE SILENT-FAILURE WIRE.
// `readJson` above returns the SAME null for "the file is not there" and for "the file
// is there and did not parse (or was locked)". pickConcept then fell through to the
// floor and stamped  picked_because: "capsule floor (no live signal yet)"  — the drill
// asserting there is NO signal at the exact moment the signal was read and found
// unreadable. Live proof of the collapse, this run:
//     pickConcept({ ls: null, cards: null }) → {"concept":"tokenization","why":"capsule floor (no live signal yet)"}
// and a corrupt learning_state.json produced byte-identical output. A rotting input
// would have pinned every night's drill to tokenization forever, and the one line that
// could have told him said the opposite.
//
// `readJson` stays VERBATIM and is still the reader for the ENRICHMENT lane: readNight's
// coach file is absent on most nights by design (the LLM job may simply not have run),
// so there "missing" and "malformed" really are the same non-event, and the drill is
// byte-identical either way — the selftest below says so out loud.
// This traced reader is ADDED alongside, for the two inputs that DECIDE the pick plus
// the canon that decides the family. Nothing is replaced.
function readJsonTraced(p) {
  if (!existsSync(p)) return { value: null, status: "absent", error: null };
  try { return { value: JSON.parse(readFileSync(p, "utf8")), status: "ok", error: null }; }
  // EBUSY/EACCES land here too — a file we could not read is not a file that is not there
  catch (e) { return { value: null, status: "unreadable", error: String((e && e.message) || e).replace(/\s+/g, " ").slice(0, 140) }; }
}
// deps injection, two shapes: `ls`/`cards`/`concepts` inject a VALUE (what every test
// since 2 Aug does — null there means ABSENT, unchanged); `lsRead`/`cardsRead`/
// `conceptsRead` inject the traced shape, which is the only way to test the unreadable
// branch without corrupting a live state file.
function traced(injectedRead, injectedValue, path) {
  if (injectedRead !== undefined) return injectedRead;
  if (injectedValue !== undefined) return { value: injectedValue, status: injectedValue === null ? "absent" : "ok", error: null };
  return readJsonTraced(path);
}
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
  const canonRead = traced(deps.conceptsRead, deps.concepts, join(STATE_DIR, "concepts.json"));
  const canon = canonRead.value;
  const entry = canon && canon.concepts && canon.concepts[key];
  if (entry && typeof entry.drill_shape === "string" && FAMILY[entry.drill_shape]) {
    return { shape: entry.drill_shape, verified: true, source: "concepts.json canon" };
  }
  if (CONCEPT_SHAPE[key]) return { shape: CONCEPT_SHAPE[key], verified: true, source: "examiner registry" };
  // 11 Aug 2026 — same silent-failure class one level down: an UNREADABLE concepts.json
  // used to render as "default (unclassified)", i.e. "the captain never classified this",
  // when in fact his classification was there and we could not read it. The guess still
  // announces itself (shape_unverified), but now it names the RIGHT cause.
  if (canonRead.status === "unreadable") {
    return { shape: SHAPE.MECHANISM, verified: false, source: `default — concepts.json UNREADABLE (${canonRead.error})`, canonUnreadable: canonRead.error };
  }
  return { shape: SHAPE.MECHANISM, verified: false, source: "default (unclassified)" };
}

// deterministic concept pick: stalling > learning (worst first) > FSRS hardest > floor
function pickConcept(deps = {}) {
  // 11 Aug 2026 — both deciding inputs are read TRACED, so a file that exists and did
  // not parse can never be reported as "no signal yet". The errors ride EVERY branch,
  // not just the floor: an unreadable learning_state that silently demotes the pick to
  // FSRS-hardest is the same lie, one rung quieter.
  const lsRead    = traced(deps.lsRead, deps.ls, join(STATE_DIR, "learning_state.json"));
  const cardsRead = traced(deps.cardsRead, deps.cards, join(STATE_DIR, "cards.json"));
  const input_errors = [
    lsRead.status === "unreadable" ? { file: "learning_state.json", error: lsRead.error } : null,
    cardsRead.status === "unreadable" ? { file: "cards.json", error: cardsRead.error } : null,
  ].filter(Boolean);
  const ls = lsRead.value;
  const concepts = (ls && (ls.concepts || ls.ladder || [])) || [];
  const arr = Array.isArray(concepts) ? concepts : Object.entries(concepts).map(([name, v]) => ({ name, ...(typeof v === "object" ? v : {}) }));
  // learning_state.mjs writes { id, fluency: "🔴 learning", velocity: { slope } } —
  // those keys read FIRST; the legacy trend/name/stage shapes stay as fallbacks.
  const nameOf = (c) => c.id || c.name || c.concept;
  const byTrend = (t) => arr.filter(c => ((c.velocity && c.velocity.slope) || c.trend || c.trajectory || "") === t).map(nameOf).filter(Boolean);
  const stalling = byTrend("stalling").concat(byTrend("regressing"));
  if (stalling.length) return { concept: stalling[0], why: "stalling/regressing in learning_state", input_errors };
  const learning = arr.filter(c => /learning|red/i.test(String(c.fluency || c.stage || c.state || ""))).map(nameOf).filter(Boolean);
  if (learning.length) return { concept: learning[0], why: "earliest ladder stage", input_errors };
  // ── W0-B (2 Sep 2026) · A DRILL MAY NOT BE PICKED BY DATA CANON DISQUALIFIED (LR-03) ──
  // On 1 Sep this picker staged a drill on `hallucinations` with picked_because
  // "stalling/regressing in learning_state" — a verdict computed entirely from pre-cyborg
  // reps. The floor in learning_state.mjs empties the trend lanes above, but FSRS's
  // hardest-due is fed by the SAME reps, so without this the picker just cites the same
  // disqualified evidence through a different door. When learning_state says it is still
  // awaiting post-floor data, every rep-derived lane is pre-floor by construction, and the
  // capsule floor — where the syllabus actually restarted — is the only honest pick.
  const preFloor = !!(ls && ls.pre_cyborg && ls.status === "awaiting_data");
  const cards = cardsRead.value;
  const hard = preFloor ? [] : ((cards && cards.hardest_due) || []);
  if (hard.length) return { concept: typeof hard[0] === "string" ? hard[0] : (hard[0].concept || hard[0].topic), why: "FSRS hardest due", input_errors };
  if (preFloor) return { concept: "tokenization", why: `capsule floor — GAME ON (${String(ls.pre_cyborg.floor).slice(0, 10)}): ${ls.pre_cyborg.reps} pre-restart rep(s) are record, not evidence, and no post-restart rep exists yet`, input_errors };
  // THE FLOOR — and the line that used to lie. "no live signal yet" is only true when
  // every input was genuinely ABSENT. If one was present and unreadable, say THAT.
  if (input_errors.length) {
    return {
      concept: "tokenization",
      why: `capsule floor — INPUT UNREADABLE, not silent: ${input_errors.map(e => `${e.file} (${e.error})`).join(" · ")}`,
      input_errors,
    };
  }
  return { concept: "tokenization", why: "capsule floor (no live signal yet)", input_errors };
}

// P2 (9 Aug 2026, his unleash word) — the night coach's machine sibling,
// brain_out/night_coach/<date>.json, served under the morning it teaches
// (producer declares serve:next_morning) → calendar lookback [today, yesterday],
// shape-checked because an LLM-written file is exactly the class that arrives
// half-valid. Enrichment only: it may annotate the staged drill, never pick the
// concept, never perturb the family or the day rotation.
function readNight(now = new Date(), dir = join(STATE_DIR, "brain_out/night_coach")) {
  const ms = now instanceof Date ? now.getTime() : now;
  for (const d of [dayKey(new Date(ms)), addDays(dayKey(new Date(ms)), -1)]) {   // Block 6 — day-key
    const nc = readJson(join(dir, d + ".json"));
    if (nc && Array.isArray(nc.misconceptions)) return { ...nc, _resolved_date: d };
  }
  return null;
}

// THE CRACK ARRIVES WHOLE — the night coach's read, UNCUT (11 Aug 2026, wiring sweep).
//
// The old builder (frozen below as nightNoteLegacy) shipped in P2 with
// `.slice(0, 240)` and NO field naming the cut. The note is
// `<what he thinks> · sach: <what's true>` — belief FIRST, correction SECOND — so the
// cap can only ever eat the CORRECTION. MEASURED on the live map the morning this was
// found, brain_out/night_coach/2026-08-11.json, all four misconceptions overflowed:
// 384 / 294 / 343 / 401 chars → 144 / 54 / 103 / 161 chars dropped, every one of them
// mid-sentence inside `whats_true` ("...menu par; strong training prior weak-pla"). A
// slightly longer belief moves the cut BEFORE the `sach:` and the truth vanishes whole,
// leaving the examiner probing him with his own error as if it were the syllabus. The
// 240 shipped with no comment justifying it — a guessed number, which his standing rule
// forbids. Same defect and same ruling as the capsule-weld cut (dugout.mjs
// capsuleProjectionLegacy, 8df28ba) and the Gaffer's 1200-char night read
// (dugout.mjs loadNightCoachLegacy, this same sweep).
//
// NO CAP REPLACES THE OLD CAP. Nothing here truncates prose, and no number of mine
// replaces the 240: the producer bounds the page it writes ("≤ 80 lines before the json
// block" — grep -n "80 lines" scripts/brain.mjs) and the misconception rows are two
// short fields off that same bounded page (measured span above: 294-401 chars whole).
// `adapt_note` five lines up is 380+ chars and has ridden UNCUT since audit #36, so
// uncut is this drill's own established size, not a new limit I invented.
// What IS new is that a HALF-note now says so by name: a map entry carrying a belief
// with no `whats_true` used to render as a bare accusation the examiner could not
// distinguish from a verified correction.
function nightNote(m) {
  const thinks = m && m.what_he_thinks ? String(m.what_he_thinks).trim() : "";
  const truth  = m && m.whats_true ? String(m.whats_true).trim() : "";
  if (!thinks && !truth) return null;
  const parts = [];
  if (thinks) parts.push(`raat ke coach ne pakda — woh soch raha hai: ${thinks}`);
  if (truth) parts.push(`sach: ${truth}`);
  // the absence is DECLARED, never left to look like a correction that simply ended
  else parts.push(`sach: RAAT KE MAP NE CORRECTION NAHI LIKHI — belief bina sach ke aaya hai, ise verified truth mat maano; usse khud nikalwao`);
  return parts.join(" · ");
}
// Frozen verbatim (LAYERING law — the old engine never leaves the file). This is what
// shipped from P2 (9 Aug 2026) until 11 Aug 2026; kept so the 240-cut it caused stays
// auditable in code rather than recalled. The selftest still runs it, on purpose.
function nightNoteLegacy(m) {
  const note = [
    m.what_he_thinks ? `raat ke coach ne pakda — woh soch raha hai: ${m.what_he_thinks}` : null,
    m.whats_true ? `sach: ${m.whats_true}` : null,
  ].filter(Boolean).join(" · ");
  return note ? note.slice(0, 240) : null;
}

function stageDrill(deps = {}) {
  const now = deps.now || new Date();
  const pick = pickConcept(deps);
  const { concept, why } = pick;
  // audit #36: pick the FAMILY by what the concept is, then rotate WITHIN it. The old
  // code rotated over TEMPLATES unconditionally, which is how "Implement a MINIMAL
  // working hallucinations from scratch in Python" reached disk.
  const { shape, verified, source, canonUnreadable } = conceptShape(concept, deps);
  const bank = FAMILY[shape] || TEMPLATES;
  const kinds = Object.keys(bank);
  // Block 6 — day-key: the rotation follows the day the stage is FOR (noon-anchored key), never the wall clock of a catch-up
  const dk = new Date(`${dayKey(now)}T12:00:00`);
  const doy = Math.floor((dk - new Date(dk.getFullYear(), 0, 0)) / 86400000);
  const kind = kinds[doy % kinds.length];                       // rotates daily, deterministic
  const t = bank[kind](concept);
  const drill = {
    date: dayKey(now), staged_at: now.toISOString(), concept, picked_because: why,   // Block 6 — day-key
    shape, shape_source: source, shape_unverified: !verified,
    template: kind, task: t.task, hidden_tests: t.hidden_tests,
  };
  // An unclassified concept says so OUT LOUD to the examiner rather than silently
  // betting that it is buildable (rule: never render a guess as a fact).
  if (!verified) {
    drill.adapt_note = `SHAPE UNVERIFIED — "${concept}" is not classified, so this drill assumes it is a buildable mechanism. If it is really a phenomenon (something that happens TO a system) or a judgment call, say so and switch the drill to "write a probe that elicits it + a check that detects it" instead. Then tell the captain to add "drill_shape" to concepts.json.`;
  }
  // 11 Aug 2026 — THE DEGRADED-PICK WIRE. Same pattern as adapt_note above: the failure
  // travels ON the drill so the one organ that reads this file (dugout.mjs imports
  // loadFreshDrill + drillSection into the scrimmage system prompt) is TOLD, at the
  // anchor he already hits, that tonight's concept was chosen with a broken input.
  // A producer whose failures nobody reads is a black box, not a signal.
  const inputErrors = (pick.input_errors || []).slice();
  if (canonUnreadable) inputErrors.push({ file: "concepts.json", error: canonUnreadable });
  if (inputErrors.length) {
    drill.input_errors = inputErrors;
    drill.input_note = `INPUT UNREADABLE — ${inputErrors.map(e => `${e.file}: ${e.error}`).join(" · ")}. This concept was NOT picked from a clean read; the file is on disk and did not parse. Say so in one line before the round, treat tonight's pick as provisional, and the state file needs repairing before it pins the drill.`;
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
      const note = nightNote(m);
      if (note) drill.night_note = note;
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
  const today = dayKey(new Date(nowMs));   // Block 6 — day-key
  return (d.date === today || d.date === addDays(today, -1)) ? d : null;
}
// the section the scrimmage instruction embeds
function drillSection(d, now = new Date()) {
  if (!d) return "";
  // audit #36: the adapt note rides to the examiner whenever the concept's shape was
  // a default rather than a classification, so an unverified guess can never be read
  // as a verified instruction.
  const adapt = d.adapt_note ? `\n⚠ ${d.adapt_note}\n` : "";
  // P2 — the night coach's read rides to the examiner the same way the adapt note
  // does: present only when real, aimed at the examiner (probe WHERE the crack is).
  // 11 Aug 2026 — the read DECLARES its own length now (same receipt dugout.mjs's
  // composeCartridgeSection carries). The note used to arrive cut at 240 with nothing
  // saying so; if anything ever cuts it again, this shows up as a shrinking number in
  // the examiner's own instruction instead of a correction dying mid-sentence.
  const night = d.night_note
    ? `\n🌙 RAAT KA COACH (his crack — the belief AND the correction, ${String(d.night_note).length} chars, UNCUT): ${d.night_note} — probe isi darar pe.\n`
    : "";
  // 11 Aug 2026 — the degraded-pick warning takes the SAME road out (dugout.mjs embeds
  // this section in the scrimmage prompt). Without this leg the drill knew its input was
  // rotten and no reader was ever told.
  const broken = d.input_note ? `\n⛔ ${d.input_note}\n` : "";
  // 11 Aug 2026, DEAD-WIRE SWEEP — THE DRILL'S PROVENANCE, written since day one and
  // read by NOBODY. stageDrill stamps staged_at · picked_because · shape_source on every
  // drill (see the object two screens up); measured this run: `grep -rn staged_at scripts/
  // .claude/` returns ZERO readers of the drill's stamp (the only hits are scout/mission
  // rows, a different file), `shape_source` appears only inside this file's own selftest,
  // and `picked_because` only in `stage`'s console.log — a line that scrolls past at 22:55
  // and is gone by morning. So the examiner ran the heaviest probe of the night without
  // ever being told WHY this concept, WHERE its family came from, or HOW OLD the pick is.
  // It bites hardest in the QUIET case: "capsule floor (no live signal yet)" is a DEFAULT,
  // not his measured weakest — input_note covers an input that was unreadable, nothing
  // covered an input that was merely empty, and the examiner read both as "his weakness".
  // Same road as adapt_note / night_note / input_note above: provenance travels ON the
  // drill to the one organ that reads this file (dugout.mjs embeds this section in the
  // scrimmage prompt). Age is DERIVED and rendered, never gated — no threshold is invented
  // here; freshness stays loadFreshDrill's alone (today-or-yesterday, the owner's own).
  // An untimestamped drill SAYS SO instead of rendering NaN, following learnstate's
  // working-set rule: an unknown age is called out, never assumed fresh.
  const nowMs   = now instanceof Date ? now.getTime() : now;
  const stamped = d.staged_at ? Date.parse(d.staged_at) : NaN;
  const ageLine = Number.isFinite(stamped)
    ? `staged ${d.staged_at} · ${Math.round((nowMs - stamped) / 3600000)}h old`
    : "staging time UNKNOWN (this drill carries no staged_at)";
  const prov = `PROVENANCE (${ageLine}) — picked because: ${d.picked_because || "unrecorded"} · shape from: ${d.shape_source || "unrecorded"}. Agar woh reason ek FLOOR/default hai, measured weakness nahi, to yeh concept sirf wahan hai jahan drill gir gaya — round wahi tarah se chalao aur ek line mein bol do.\n`;
  return `\nTHE CODE ROUND (the Live Examiner staged this — run it as the heaviest probe, on the CHALKBOARD):\nConcept: ${d.concept} (${d.template} shape${d.shape ? ` · ${d.shape}` : ""})\n${prov}TASK (read to him verbatim): ${d.task}\nHIDDEN TESTS — reveal each ONLY as you RUN it, never up front:\n${d.hidden_tests.map((h, i) => `${i + 1}. ${h}`).join("\n")}${adapt}${night}${broken}\nGrade the CODE, never the coder — the result is data; a miss resolves silently into the reps.\n`;
}

// ---------------------------------------------------------------------------
// 11 Aug 2026, wiring sweep — THE MODE THAT ONLY WORKED BY ACCIDENT.
// The header above has advertised `stage · status · selftest` since this file was
// written, and `status` is a NAMED, CONSUMED command: .claude/skills/scrimmage/SKILL.md
// step 1 tells the scrimmage to run `node scripts/examiner.mjs status` (read-only) and
// quotes the two lines it expects back. But main() only ever CASED selftest and stage —
// `status` printed the right line purely because every unrecognised argv fell off the
// end into the read branch. Measured this run, before the fix:
//     examiner.mjs status       → 'examiner: fresh drill staged — elicit on "hallucinations"'  exit 0
//     examiner.mjs zzznotamode  → BYTE-IDENTICAL, exit 0
//     examiner.mjs stgae        → BYTE-IDENTICAL, exit 0 — and nothing staged
// The conductor's evening spine runs `stage` at 22:55 (conductor.mjs:113) and the
// scheduled task runs `examiner.mjs stage` (setup/INSTALL_CYBORG_TASKS.ps1:73); a
// fat-fingered verb in either, or a launcher carrying a renamed one, reported a
// success-SHAPED line, exited 0, and left the drill from two nights ago on disk for the
// mock to run. Same defect and same ruling as doubtminer.mjs GUARD 3 (E2E audit, 25 Jul
// 2026) and timeaudit.mjs C5 (9 Aug 2026): modes are an ALLOWLIST, unknown → usage on
// stderr + exit 1, before anything is read or written.
// Bare argv stays `status` — that is exactly what it has always done (read-only, no
// writes), and both live callers pass their verb explicitly.
// `served` joins the allowlist 11 Aug 2026 (the serve-receipt wire below). It takes the
// surface's name as argv[3]; the allowlist only ever screens the VERB, so the extra
// argument changes nothing about the guard above.
const MODES = new Set(["stage", "status", "served", "unserve", "selftest"]);
const USAGE = "usage: node scripts/examiner.mjs [stage | status | served <surface> | unserve <surface> | selftest]   (bare = status, read-only)";
const resolveMode = (argv2) => {
  const m = String(argv2 ?? "").toLowerCase().trim();
  if (m === "") return "status";
  return MODES.has(m) ? m : null;
};

// ---------------------------------------------------------------------------
// 11 Aug 2026, dead-wire sweep — THE SERVE RECEIPT (a producer nobody could audit).
// This organ staged a drill EVERY night (conductor_evening.json, 10 Aug: step
// "examiner" ok:true, 263ms — same ok:true whether the drill was played or dropped)
// and NOTHING on disk ever recorded that a surface picked it up. Served and ignored
// were byte-identical states, so the header's LAWS clause — "a miss resolves silently
// into FSRS weight (the reps flow through log_reps)" — could not be checked by anyone:
// reps_log.jsonl held 21 rows and ZERO carrying the voice mock's own tag
// "scrimmage-voice" (dugout.mjs:1506 is the only writer of that tag). A drill that is
// never embedded produces no reps, and a drill that IS embedded produced no trace
// either — one silence covering two very different worlds.
//
// The fix is the smallest thing that separates them: a receipt lane on the drill's OWN
// file, written by its OWN owner. Nothing is scored, nothing is thresholded, nothing
// acts on the captain's behalf — the receipt only records that the drill's text
// actually rode out to a surface, and WHICH surface.
//
// SINGLE-WRITER: this function lives in examiner.mjs, the sole writer of
// examiner_drill.json, exactly like loadFreshDrill/drillSection are its sole readers'
// entry points. A consumer in another process (the /scrimmage skill) reaches it through
// `examiner.mjs served <surface>`; a consumer already importing this module
// (dugout.mjs) calls it directly. Either way there is one writer, and the drill is
// RE-READ from disk here rather than taken from the caller — a consumer can add a
// receipt, never a word of the drill's prose.
//
// FRESHNESS: the gate is loadFreshDrill's, not a new one — a stale drill cannot be
// served today, so an out-of-window call stamps nothing and says so by returning null.
// REVERSIBILITY, the same guard `teaching_contract.mjs unhit-auto` gives its auto-lane:
// a receipt that can be stamped by accident and never walked back is a new way to lie.
// This is not hypothetical — it is why the mode exists. The first draft of this repair
// stamped from dugout.mjs's buildConfig, which the suite calls four times in scrimmage
// mode, and a single `dugout.mjs selftest` wrote a real receipt into the live drill at
// 2026-08-10T20:37:06.702Z claiming a voice mock that never happened. The stamp moved to
// the /config route; this door removed the false receipt. Never automated, never on a
// schedule — a human runs it when a human knows the receipt is wrong.
function unserve(surface, deps = {}) {
  const now = deps.now instanceof Date ? deps.now : new Date();
  const by = String(surface || "").trim();
  if (!by) return null;
  const d = (deps.read || (() => readJson(DRILL)))();
  if (!d || !Array.isArray(d.served)) return null;
  const kept = d.served.filter((r) => !(r && r.by === by));
  if (kept.length === d.served.length) return null;          // nothing of that name was ever stamped
  const next = { ...d, served: kept };
  (deps.write || ((o) => writeAtomic(DRILL, o)))(next);
  return next;
}
function markServed(surface, deps = {}) {
  const now = deps.now instanceof Date ? deps.now : new Date();
  const by = String(surface || "").trim();
  if (!by) return null;                                    // an unnamed surface is not a receipt
  const d = loadFreshDrill(now, deps.read ? { read: deps.read } : {});
  if (!d) return null;                                     // nothing fresh on disk = nothing was served
  const served = Array.isArray(d.served) ? d.served.slice() : [];
  // ONE receipt per surface per drill: a scrimmage prompt can be rebuilt mid-session
  // (dugout.mjs:2027 builds it on every session start) and a re-render is not a second
  // serve. Counting renders would invent a number; naming surfaces does not.
  if (served.some((r) => r && r.by === by)) return d;
  served.push({ by, at: now.toISOString() });
  const next = { ...d, served };
  (deps.write || ((o) => writeAtomic(DRILL, o)))(next);
  return next;
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

    // --- 11 Aug 2026, wiring sweep: THE CRACK ARRIVES WHOLE ------------------
    // The shape that broke it: a belief long enough to eat the whole 240 budget, so the
    // CORRECTION is the half that dies. Both halves are 200 chars here — deterministic,
    // and the same order as the live 2026-08-11 map (whole notes 294-401 chars).
    const longThinks = "A".repeat(200), longTruth = "B".repeat(200);
    const heavy = { concept: "attention", what_he_thinks: longThinks, whats_true: longTruth };
    const dnHeavy = stageDrill({ ...base, night: { misconceptions: [heavy] } });
    assert("WIRE: the night coach's CORRECTION reaches the drill whole — no cut at the door",
      dnHeavy.night_note.includes(longTruth) && dnHeavy.night_note.includes(longThinks) && dnHeavy.night_note.length > 240);
    assert("WIRE: and it reaches the EXAMINER whole through drillSection, length declared",
      drillSection(dnHeavy).includes(longTruth) && drillSection(dnHeavy).includes(`${dnHeavy.night_note.length} chars, UNCUT`));
    // the frozen engine is RUN, so the scar it caused stays provable, not recalled
    assert("LAYERING: nightNoteLegacy still cuts at 240 and still loses the correction",
      nightNoteLegacy(heavy).length === 240 && !nightNoteLegacy(heavy).includes("sach:"));
    assert("WIRE: a half-map (belief, no whats_true) says the correction is MISSING by name",
      /CORRECTION NAHI LIKHI/.test(nightNote({ concept: "attention", what_he_thinks: "x" }) || "")
      && nightNote({ concept: "attention" }) === null);
  }

  // --- 11 Aug 2026 wiring audit: SILENT FAILURE — "unreadable" must never render
  // as "no signal". Every check below goes RED if the traced read is unwired again.
  {
    // the primitive, proved on a REAL file (not a mock): a corrupt file and a missing
    // file must NOT return the same thing. This is the whole defect in one assertion.
    const probe = join(tmpdir(), `examiner_traced_probe.${process.pid}.json`);
    writeFileSync(probe, "{ this is not json ");
    const bad = readJsonTraced(probe);
    const gone = readJsonTraced(probe + ".nope");
    try { unlinkSync(probe); } catch {}
    assert("TRACED: a corrupt file reads 'unreadable' with the parser's own reason",
      bad.status === "unreadable" && bad.value === null && typeof bad.error === "string" && bad.error.length > 0);
    assert("TRACED: an ABSENT file reads 'absent' — the two are distinguishable",
      gone.status === "absent" && gone.error === null && gone.status !== bad.status);

    const corrupt = { value: null, status: "unreadable", error: "Unexpected token h in JSON at position 2" };
    const pBroken = pickConcept({ lsRead: corrupt, cards: null });
    assert("SILENT FAILURE: a corrupt learning_state NEVER says 'no live signal yet'",
      !pBroken.why.includes("no live signal yet"));
    assert("SILENT FAILURE: the floor names the file AND the parser's reason",
      pBroken.why.includes("learning_state.json") && pBroken.why.includes("UNREADABLE") && pBroken.why.includes("Unexpected token"));
    assert("SILENT FAILURE: a genuinely ABSENT input still says 'no live signal yet' (honest both ways)",
      p4.why.includes("no live signal yet") && (p4.input_errors || []).length === 0);
    assert("SILENT FAILURE: absent and unreadable produce DIFFERENT picked_because lines",
      pBroken.why !== p4.why);
    // the quieter version of the same lie: a broken top input demoted the pick to FSRS
    // and nothing said so. The errors ride EVERY branch, not just the floor.
    const pDemoted = pickConcept({ lsRead: corrupt, cards: { hardest_due: ["context-windows"] } });
    assert("SILENT FAILURE: a demoted pick still carries the broken input",
      pDemoted.concept === "context-windows" && pDemoted.input_errors.length === 1 && pDemoted.input_errors[0].file === "learning_state.json");

    // THE WIRE: the failure must reach the only reader of this file (dugout.mjs embeds
    // drillSection in the scrimmage prompt). A producer nobody reads is a black box.
    const dBroken = stageDrill({ lsRead: corrupt, cards: null, now, write: () => {} });
    assert("WIRE: the drill carries input_errors + a one-line input_note",
      Array.isArray(dBroken.input_errors) && dBroken.input_errors.length === 1 && /INPUT UNREADABLE/.test(dBroken.input_note || ""));
    assert("WIRE: it reaches the examiner through drillSection (⛔ + the file name)",
      drillSection(dBroken).includes("⛔") && drillSection(dBroken).includes("INPUT UNREADABLE") && drillSection(dBroken).includes("learning_state.json"));
    assert("WIRE: a CLEAN read stages a byte-identical drill — no key, no noise",
      !("input_errors" in d) && !("input_note" in d) && !drillSection(d).includes("⛔"));

    // one level down: an unreadable canon must not masquerade as "he never classified it"
    const cShape = conceptShape("some_brand_new_thing", { conceptsRead: corrupt });
    assert("SILENT FAILURE: an unreadable concepts.json is NOT reported as 'unclassified'",
      cShape.verified === false && /UNREADABLE/.test(cShape.source) && !/\(unclassified\)/.test(cShape.source));
    const dCanon = stageDrill({ ls: { concepts: [{ id: "some_brand_new_thing", fluency: "🔴 learning" }] }, cards: null, conceptsRead: corrupt, now, write: () => {} });
    assert("WIRE: the unreadable canon rides the drill too",
      (dCanon.input_errors || []).some(e => e.file === "concepts.json"));
    assert("SILENT FAILURE: a READABLE canon that simply lacks the concept still says 'unclassified'",
      conceptShape("some_brand_new_thing", { concepts: { concepts: {} } }).source === "default (unclassified)");

    // --- DEAD-WIRE SWEEP (11 Aug 2026): THE ORPHANED PROVENANCE -------------
    // staged_at / picked_because / shape_source were stamped on every drill and read by
    // nobody. These four fail the moment that door closes again.
    const secBase = drillSection(d, new Date(2026, 6, 14, 21, 0, 0));      // d staged 2026-07-14 09:00
    assert("PROVENANCE: staged_at reaches the examiner — the stamp AND a derived age",
      secBase.includes("PROVENANCE") && secBase.includes(d.staged_at) && /\d+h old/.test(secBase));
    assert("PROVENANCE: the age is computed off the CALLER'S clock (12h, not the wall clock)",
      secBase.includes("12h old"));
    assert("PROVENANCE: picked_because rides it — a stalling pick names its evidence",
      secBase.includes("picked because:") && secBase.includes("stalling/regressing in learning_state"));
    // the quiet lie this wire exists to stop: a FLOOR pick must never read as measured weakness
    const secFloor = drillSection(stageDrill({ ls: null, cards: null, now, write: () => {} }), now);
    assert("PROVENANCE: a FLOOR/default pick SAYS SO inside the instruction that runs it",
      secFloor.includes("capsule floor") && secFloor.includes("FLOOR/default"));
    assert("PROVENANCE: shape_source rides it — canon vs registry vs default is legible",
      drillSection(overridden, now).includes("shape from: concepts.json canon") &&
      drillSection(unk, now).includes("shape from: default (unclassified)"));
    assert("PROVENANCE: an untimestamped drill says UNKNOWN, never a NaN age",
      /staging time UNKNOWN/.test(drillSection({ ...d, staged_at: undefined }, now)) &&
      !/NaN/.test(drillSection({ ...d, staged_at: undefined }, now)));
  }

  // --- 11 Aug 2026 wiring sweep: THE MODE THAT ONLY WORKED BY ACCIDENT ------
  // Every check here goes RED if the dispatch ever falls back to "anything unknown
  // is a read" again, which is how `status` survived for weeks as an accident and how
  // a mistyped `stage` reported success.
  {
    assert("MODE: the three advertised verbs each resolve to themselves",
      resolveMode("stage") === "stage" && resolveMode("status") === "status" && resolveMode("selftest") === "selftest");
    assert("MODE: bare argv is still the read-only status (behaviour unchanged)",
      resolveMode(undefined) === "status" && resolveMode("") === "status" && resolveMode("  ") === "status");
    assert("MODE: a fat-fingered stage is REFUSED, never silently read as status",
      resolveMode("stgae") === null && resolveMode("zzznotamode") === null && resolveMode("stage --now") === null);

    // The header's MODES line is the contract the scrimmage skill quotes. Drift between
    // it and the dispatch table is the whole defect, so read it out of THIS file and
    // compare — a verb documented but not wired (or wired but not documented) goes red.
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const advertised = ((src.match(/^\/\/ MODES:(.*)$/m) || [, ""])[1])
      .split("·").map(s => s.trim().replace(/^node\s+scripts\/examiner\.mjs\s*/, "")).filter(Boolean);
    assert("MODE: every verb the header advertises is actually DISPATCHED (the accident that started this)",
      advertised.length === MODES.size && advertised.every(m => MODES.has(m)));

    // ...and proved on the REAL CLI, not just the resolver: the child process is what
    // the conductor and the skill actually run.
    const run = (args) => {
      try { return { code: 0, out: execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...args], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }) }; }
      catch (e) { return { code: e.status ?? 1, out: String(e.stdout || ""), err: String(e.stderr || "") }; }
    };
    const typo = run(["stgae"]);
    assert("CLI: a mistyped stage exits NON-ZERO with usage on stderr (it exited 0 with a success-shaped line before today)",
      typo.code !== 0 && /unknown mode "stgae"/.test(typo.err || "") && /usage: node scripts\/examiner\.mjs/.test(typo.err || "") && typo.out === "");
    const st = run(["status"]);
    assert("CLI: status is a REAL case now — exits 0 and prints one of the two lines the scrimmage skill quotes",
      st.code === 0 && /(fresh drill staged — |nothing staged today)/.test(st.out));
  }

  // --- 11 Aug 2026 dead-wire sweep: THE SERVE RECEIPT -----------------------
  // Every check here goes RED if the receipt lane is unwired again — i.e. if the
  // organism goes back to a night where "played" and "dropped" leave the same trace.
  // All of it runs on INJECTED reads/writes; the live examiner_drill.json is never
  // touched by the suite (same rule the traced-reader block above follows).
  {
    const staged = { date: localDate(now), staged_at: now.toISOString(), concept: "attention", template: "implement", task: "t", hidden_tests: ["a"] };   // day-key: fixture
    let disk = staged; const write = (o) => { disk = o; }; const read = () => disk;

    assert("RECEIPT: an unserved fresh drill carries NO served lane — the silence is the honest default",
      !("served" in staged));
    const s1 = markServed("scrimmage-voice", { now, read, write });
    assert("RECEIPT: a served drill names the surface AND the moment, on its own file",
      Array.isArray(disk.served) && disk.served.length === 1 && disk.served[0].by === "scrimmage-voice" && !Number.isNaN(Date.parse(disk.served[0].at)) && s1 === disk);
    assert("RECEIPT: the drill's prose is untouched by a receipt (owner re-reads from disk; a consumer adds a receipt, never a word)",
      disk.task === staged.task && disk.concept === staged.concept && disk.template === staged.template && JSON.stringify(disk.hidden_tests) === JSON.stringify(staged.hidden_tests));
    markServed("scrimmage-voice", { now, read, write });
    assert("RECEIPT: re-rendering the same prompt is NOT a second serve (one receipt per surface — a render count would be an invented number)",
      disk.served.length === 1);
    markServed("scrimmage-skill", { now, read, write });
    assert("RECEIPT: a SECOND surface stamps its own receipt — the laptop mock and the voice mock are distinguishable",
      disk.served.length === 2 && disk.served.map(r => r.by).join(",") === "scrimmage-voice,scrimmage-skill");

    // the gates: nothing fresh, and nothing named, must stamp nothing at all
    const stale = { ...staged, date: "2026-01-04" };
    let staleDisk = stale;
    assert("RECEIPT: a STALE drill cannot be served today (the gate is loadFreshDrill's, not a new one)",
      markServed("scrimmage-voice", { now, read: () => stale, write: (o) => { staleDisk = o; } }) === null && staleDisk === stale);
    let untouched = staged;
    assert("RECEIPT: an unnamed surface is refused — an anonymous receipt would be worse than none",
      markServed("", { now, read, write: (o) => { untouched = o; } }) === null && markServed(null, { now, read, write: (o) => { untouched = o; } }) === null && untouched === staged);
    assert("RECEIPT: an ABSENT drill file stamps nothing and does not throw",
      markServed("scrimmage-voice", { now, read: () => null, write: () => { throw new Error("wrote with no drill on disk"); } }) === null);

    // REVERSIBILITY — proved on the same injected disk, because this is the door that
    // cleaned up a REAL false receipt (see unserve's comment) and it must keep working.
    const back = unserve("scrimmage-voice", { now, read, write });
    assert("RECEIPT: a wrong receipt can be walked back by name, and only that one",
      back && disk.served.length === 1 && disk.served[0].by === "scrimmage-skill");
    assert("RECEIPT: walking back a name that was never stamped changes nothing",
      unserve("never-existed", { now, read, write }) === null && disk.served.length === 1);

    // THE CONSUMER — a receipt nobody reads is the same black box we started with.
    // `served` is exported for dugout.mjs's scrimmage builder, the CLI serves the
    // laptop skill, and the nightly `stage` branch reads the OUTGOING drill's lane.
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    assert("RECEIPT WIRE: the nightly stage reads the outgoing drill's receipt and says out loud when it has none",
      /const outgoing = readJson\(DRILL\);/.test(src) && /carries NO serve receipt/.test(src) && /outgoing\.served/.test(src));
    // ── W0-B · A DRILL IS NEVER PICKED BY DISQUALIFIED DATA (2 Sep 2026 — LR-03) ──────
    // Reproduced from the live file: on 1 Sep this picker staged a drill on
    // `hallucinations` with picked_because "stalling/regressing in learning_state",
    // a trend computed entirely from pre-restart reps. Both doors are closed now.
    {
      const preFloorLs = { status: "awaiting_data", pre_cyborg: { reps: 22, floor: "2026-08-30T02:00:00.000Z" }, concepts: [] };
      const p1 = pickConcept({ ls: preFloorLs, cards: { hardest_due: ["inference"] } });
      assert("W0-B: with only pre-restart data, the pick is the capsule floor and it NAMES the epoch — never FSRS-hardest, which is fed by the same reps",
        p1.concept === "tokenization" && /GAME ON/.test(p1.why) && !/FSRS/.test(p1.why));
      const stale = { status: "ok", concepts: [{ id: "hallucinations", velocity: { slope: "regressing" } }] };
      assert("W0-B: a 'regressing' verdict still drives the pick ONCE post-restart data exists — the floor withholds evidence, it does not disable the picker",
        pickConcept({ ls: stale, cards: {} }).concept === "hallucinations");
    }
    assert("RECEIPT WIRE: markServed is EXPORTED (dugout.mjs's in-process door) and dispatched as `served` (the skill's out-of-process door)",
      /export \{[^}]*\bmarkServed\b/.test(src) && MODES.has("served"));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = resolveMode(process.argv[2]);
  if (mode === null) {
    console.error(`examiner: unknown mode "${process.argv[2]}" — nothing staged, nothing read.\n${USAGE}`);
    process.exit(1);
  }
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "stage") {
    // 11 Aug 2026 — READ THE OUTGOING DRILL BEFORE OVERWRITING IT. This is the receipt
    // lane's consumer: the nightly stage is the one moment a drill's life ends, and the
    // only moment the answer to "was it ever played?" is final. No threshold, no score,
    // no card — one line into the stdout the evening conductor already captures.
    const outgoing = readJson(DRILL);
    const d = stageDrill();
    console.log(`examiner: staged a ${d.template} drill on "${d.concept}" (${d.picked_because}) — the scrimmage will run it on the Chalkboard`);
    if (outgoing && outgoing.concept && outgoing.date !== d.date) {
      const rec = Array.isArray(outgoing.served) ? outgoing.served : [];
      console.log(rec.length
        ? `examiner: outgoing drill (${outgoing.template || "?"} on "${outgoing.concept}", ${outgoing.date || "?"}) WAS served — ${rec.map(r => `${r.by} @ ${r.at}`).join(" · ")}`
        : `examiner: ⚠ outgoing drill (${outgoing.template || "?"} on "${outgoing.concept}", ${outgoing.date || "?"}) carries NO serve receipt — no surface embedded it, so its reps were never going to exist`);
    }
    // 22:55 runs headless under the evening conductor, which captures stdout — so the
    // broken input lands in the chain's own log the night it happens, not weeks later.
    if (d.input_note) console.log(`examiner: ⛔ ${d.input_note}`);
    return;
  }
  if (mode === "served") {
    // the OUT-OF-PROCESS door, for the laptop /scrimmage skill (it has no import of this
    // module — it runs the CLI). Same owner, same file, same freshness gate.
    const next = markServed(process.argv[3]);
    if (!next) {
      console.error(`examiner: no receipt stamped — ${String(process.argv[3] || "").trim() ? "nothing fresh is staged (a stale drill cannot be served today)" : "name the surface, e.g. `served scrimmage-skill`"}`);
      process.exit(1);
    }
    console.log(`examiner: serve receipt stamped — "${next.concept}" served by ${next.served.map(r => r.by).join(", ")}`);
    return;
  }
  if (mode === "unserve") {
    const next = unserve(process.argv[3]);
    if (!next) {
      console.error(`examiner: nothing removed — no receipt named "${String(process.argv[3] || "").trim() || "(unnamed)"}" is on the drill`);
      process.exit(1);
    }
    console.log(`examiner: receipt for "${process.argv[3]}" removed — "${next.concept}" now reads ${next.served.length ? next.served.map(r => r.by).join(", ") : "NOT SERVED"}`);
    return;
  }
  // status — READ-ONLY. Both output shapes are quoted verbatim in
  // .claude/skills/scrimmage/SKILL.md; do not reword them without fixing the skill.
  const d = loadFreshDrill();
  console.log(d ? `examiner: fresh drill staged — ${d.template} on "${d.concept}"` : "examiner: nothing staged today (run: examiner.mjs stage)");
  // 11 Aug 2026, same sweep — THE DEGRADED-PICK WIRE'S SECOND ROAD. `input_note` already
  // rode to the dugout's voice scrimmage through drillSection, but the LAPTOP scrimmage
  // (the skill above) reads this stdout and nothing else — so a drill picked off a
  // learning_state.json that was on disk and unparseable ran as tonight's heaviest probe
  // with no reader ever told. Same line the stage branch prints; the only difference was
  // which surface got it.
  if (d && d.input_note) console.log(`examiner: ⛔ ${d.input_note}`);
  // 11 Aug 2026 — the receipt reads back on the SAME surface that asks the question, as a
  // SECOND line: the first line's two shapes are quoted verbatim in the scrimmage skill
  // and must not move. "played" vs "waiting" was unanswerable from this file until today.
  if (d) console.log(Array.isArray(d.served) && d.served.length
    ? `examiner: already served today — ${d.served.map(r => `${r.by} @ ${r.at}`).join(" · ")}`
    : "examiner: no serve receipt yet — no surface has embedded this drill");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { pickConcept, stageDrill, loadFreshDrill, drillSection, markServed, TEMPLATES, PROBE_TEMPLATES, DESIGN_TEMPLATES, FAMILY, conceptShape, SHAPE };
