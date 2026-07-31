#!/usr/bin/env node
// ============================================================================
// scripts/forge_session.mjs · ARSENAL AI FC — THE FORGE STEP-STATE (the pacer)
// ----------------------------------------------------------------------------
// WHAT:  Makes THE METHOD's 12-step per-concept pipeline (PROJECT_OS.md §THE
//   METHOD, steps 0-11) a piece of STATE instead of a piece of prose. Claude
//   declares the step it is on; this organ holds it, counts the four legal
//   question-moments, tracks which of the 9 axes were covered vs DEFERRED, and
//   at close emits an honest COVERAGE report. Deterministic; no LLM; no key.
//
//   ROOT CAUSE it exists for (30 Jul 2026, captain's first live session):
//   `.claude/skills/forge/SKILL.md` was a LOSSY render of THE METHOD — 8 of the
//   12 steps were absent from it, including step 1 (DARAAR-MAP = the ADHD-PI
//   "visible finish line"), step 4 (the widget), steps 5-6 (saath/akele karo),
//   step 8 (CALIBRATE) and step 9 (JIRAH). Perfect compliance with that file
//   still could not produce a learning-layer session. Worse, the two anti-quiz-
//   dump laws ("max EK sharp check-question during phases 3-6" · "only 4
//   question-moments by design") live in the OS and were in NO file Claude read
//   per turn — so a 3-step session and a 12-step session looked IDENTICAL on
//   disk. Prose read once at skill-load drowns after 40 turns. State does not.
//
// LAWS:
//   · SOLE WRITER of dressing-room/state/forge_session.json. Nothing else writes it.
//   · NEVER teaches, never grades, never touches reps_log — capture.mjs owns reps.
//   · `contract` and `status` are HOOK-SAFE: fail-silent, exit 0, print NOTHING
//     when there is no fresh session (a pacer must never bite the editor).
//   · STALE = SILENT. A session older than STALE_HOURS is not a live session.
//   · Deferred is not dropped: axes marked `defer` are reported at close so
//     Re-Jirah can pick them up (THE METHOD step 0 — "deferred ≠ dropped").
//   · The step number is a CLAIM Claude makes, not a proof. This organ makes the
//     claim VISIBLE and the skipping COUNTABLE — it cannot make it impossible.
//   · HISTORY IS APPEND-ONLY AND A COURTESY — a failed append never changes an
//     exit code and never blocks `start`.
//   · METHOD_CLEAN IS A FLOOR, NOT A CERTIFICATE. A session that never ran
//     `start` is INVISIBLE here, and a trail replayed in one shell line at close
//     is indistinguishable from a paced session EXCEPT BY ITS CLOCK — which is
//     why elapsed_min and axis_marks_span_min are REPORTED and never thresholded.
//     `check_q` is self-reported: an agent that never runs `moment check_q` is not
//     counted at all. This organ makes drift COUNTABLE, not impossible.
//
// WRITER OF: dressing-room/state/forge_session.json (live pacer state) AND
//            dressing-room/state/forge_sessions.jsonl (append-only session history)
// READS:     its own forge_sessions.jsonl, `boot` mode only — still no cross-organ
//            deps; it never reads reps_log (capture.mjs owns it)
// MODES: start <concept> [--force] · step <0-11> · axis <a-i> [done|defer]
//        · moment <kind> · status · contract · boot · close · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, rmSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SESSION   = join(STATE_DIR, "forge_session.json");
const HISTORY   = join(STATE_DIR, "forge_sessions.jsonl");

// THE METHOD — PER-CONCEPT PIPELINE, verbatim order (PROJECT_OS.md).
const STEPS = [
  "TIME-BOX",       // 0  core concept ≈ max 1 din; budget khatam → bache axes DEFER
  "DARAAR-MAP",     // 1  9 axes dikhao = visible finish line
  "PEHLE-GUESS",    // 2  teaching se PEHLE 2-3 axis Q ka cold guess
  "SAMJHAO",        // 3  analogy, zero assumed knowledge
  "DIKHAO",         // 4  concrete example + concept ka WIDGET (Visualization Contract)
  "SAATH-KARO",     // 5  saath mil ke work through
  "AKELE-KARO",     // 6  woh akela kare, galtiyan kare
  "BOLO",           // 7  pehle BOL ke, phir transcript — NON-NEGOTIABLE
  "CALIBRATE",      // 8  Jirah se pehle per-axis confidence self-rate
  "JIRAH",          // 9  skeptical interviewer: sharp Q + traps + reinvent-from-scratch
  "LOCK",           // 10 capsule + GATE 1 cold-reader standard on doubts[]
  "RE-JIRAH",       // 11 ~3 din / ~2 hafte / ~6 hafte
];
// The FOUR legal question-moments (PROJECT_OS: "yeh quiz-dump nahi hai").
const MOMENTS = ["pehle_guess", "widget_gate", "check_q", "jirah"];
const AXES = "abcdefghi".split("");
// CORE-NEVER-DEFERRED, finally in code (audit 31 Jul 2026). Canon, verbatim:
//   PROJECT_OS.md:316 — "CORE-NEVER-DEFERRED: core measure/formula/range MAIN
//     explanation mein, kabhi side-section ya 'baad mein' nahi."
//   PROJECT_OS.md:302 — "d) math + value RANGE + high/low ka MATLAB"
// Before today `grep -rn CORE-NEVER-DEFERRED scripts hooks` returned ZERO hits —
// canon's one hard axis rule had no representation anywhere in the machine, so a
// concept could close with its measure never taught and nothing could object.
// ONE global rule about ONE axis; canon has no per-concept core table and this
// file will not invent one. If per-concept overrides are ever wanted, the correct
// home is a hand-curated `core_axes` array under each concept in concepts.json
// (provably invisible to capture.mjs loadRegistry, which reads only
// .concepts/.skills/.aliases) — NOT forge_profile.json, whose own _comment names
// bootroom.mjs sole writer through the mutation pipeline.
const CORE_AXES = ["d"];
// Visualization Contract: "2-3 guess-gates" (.claude/skills/forge/SKILL.md:57).
// Counted, never asserted as a boolean — a built widget is not a driven one.
const WIDGET_GATES_MIN = 2;
// Phases 3-6 carry the one-check-question-at-a-time law.
const SOFT_PHASE = (n) => n >= 3 && n <= 6;
const STALE_HOURS = 18;   // a study session does not span a night

const nowISO = (now = new Date()) => now.toISOString();
const hoursSince = (iso, now = new Date()) => {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (now.getTime() - t) / 3600000 : Infinity;
};

// ---------------------------------------------------------------------------
// PURE CORE — every mutation is a pure function so the selftest never needs disk
// ---------------------------------------------------------------------------
const blank = (concept, now = new Date()) => ({
  concept: String(concept || "").trim().toLowerCase(),
  started_at: nowISO(now),
  updated_at: nowISO(now),
  step: 0,
  steps_done: [0],
  axes_done: [],
  axes_deferred: [],
  axes_marked_at: {},
  question_moments: MOMENTS.reduce((o, m) => ((o[m] = 0), o), {}),
  check_q_this_pass: 0,
});

// STRICT — Number("") and Number(" ") are 0, and Number(true) is 1, so a bare
// Number() cast silently turns `step ""` into "you are on TIME-BOX". Only a plain
// run of digits is a step. (audit 30 Jul 2026)
// Only a string or a number may even be considered: String([3]) === "3", so an
// array would otherwise pass the digit test and become a valid step.
const parseStep = (n) => {
  if (typeof n !== "string" && typeof n !== "number") return NaN;
  const t = String(n).trim();
  return /^\d+$/.test(t) ? Number(t) : NaN;
};

function setStep(s, n, now = new Date()) {
  const k = parseStep(n);
  if (!Number.isInteger(k) || k < 0 || k >= STEPS.length) {
    return { ok: false, error: `step out of range 0-${STEPS.length - 1} (${n})`, session: s };
  }
  const next = {
    ...s,
    step: k,
    steps_done: s.steps_done.includes(k) ? s.steps_done : [...s.steps_done, k].sort((a, b) => a - b),
    // A NEW pass earns a fresh check-question — RE-DECLARING the step you are already on
    // does not. The unconditional reset was a one-command bypass of the very law this organ
    // exists to enforce, and it left no trace on disk (`step` and `steps_done` unchanged),
    // so the coverage report could not see the law had been re-armed. (regression audit 30 Jul)
    check_q_this_pass: k === s.step ? (s.check_q_this_pass || 0) : 0,
    updated_at: nowISO(now),
  };
  return { ok: true, session: next };
}

function markAxis(s, axis, how = "done", now = new Date()) {
  const a = String(axis || "").trim().toLowerCase();
  if (!AXES.includes(a)) return { ok: false, error: `axis not a..i (${axis})`, session: s };
  if (how !== "done" && how !== "defer") return { ok: false, error: `how not done|defer (${how})`, session: s };
  // an axis lives in exactly ONE list — re-marking moves it, never duplicates it
  const done = s.axes_done.filter((x) => x !== a);
  const def  = s.axes_deferred.filter((x) => x !== a);
  if (how === "done") done.push(a); else def.push(a);
  // GRADING PROVENANCE (audit 31 Jul 2026). Five axes were marked done off the
  // captain saying "samajh aaya" while question_moments.jirah stayed 0, and
  // coverage() called that session honest because its verdict never consulted the
  // moments. This does not make the claim TRUE — nothing in this file can (see
  // LAWS) — it makes an UNGRADED claim permanent, countable and visible at close.
  // Re-marking OVERWRITES, so an axis re-marked after its Jirah correctly upgrades.
  // The `at` stamp is also the only unforgeable thing here: the CLI passes no clock
  // from argv, so wall-time cannot be typed in.
  const marked = { ...(s.axes_marked_at || {}) };
  marked[a] = { at: nowISO(now), step: s.step, jirah_before: (s.question_moments && s.question_moments.jirah) || 0 };
  return { ok: true, session: { ...s, axes_done: done.sort(), axes_deferred: def.sort(), axes_marked_at: marked, updated_at: nowISO(now) } };
}

function addMoment(s, kind, now = new Date()) {
  const m = String(kind || "").trim().toLowerCase();
  if (!MOMENTS.includes(m)) return { ok: false, error: `moment not ${MOMENTS.join("|")} (${kind})`, session: s };
  // THE ONE-CHECK-QUESTION LAW, ENFORCED (audit 30 Jul 2026): the contract used to
  // only WARN here while SKILL.md claimed "the pacer hard-stops the second one" —
  // a claim the code did not honour. It does now: in phases 3-6 the second
  // check-question is refused, so the teacher must TEACH or advance the step.
  if (m === "check_q" && SOFT_PHASE(s.step) && (s.check_q_this_pass || 0) >= 1) {
    // A REFUSAL IS EVIDENCE, NOT A NON-EVENT (regression audit 30 Jul 2026). The old
    // warn-only behaviour still counted the attempt, so a quiz-dump was legible at close;
    // enforcing it without recording made the coverage report UNDER-count the exact
    // behaviour this organ exists to expose. The attempt is logged, the question refused.
    return {
      ok: false,
      error: `ONE check-question already spent on STEP ${s.step} ${STEPS[s.step]} — teach, or advance the step. (canon: max EK sharp check-question during phases 3-6)`,
      session: { ...s, check_q_refused: (s.check_q_refused || 0) + 1, updated_at: nowISO(now) },
      record: true,
    };
  }
  const qm = { ...s.question_moments, [m]: (s.question_moments[m] || 0) + 1 };
  return {
    ok: true,
    session: {
      ...s,
      question_moments: qm,
      check_q_this_pass: m === "check_q" ? (s.check_q_this_pass || 0) + 1 : (s.check_q_this_pass || 0),
      updated_at: nowISO(now),
    },
  };
}

// THE CONTRACT — what the hook injects on every turn. Short by design: a wall of
// text read every turn is a wall of text ignored every turn.
function contractLines(s, now = new Date()) {
  if (!s || !s.concept) return [];
  if (s.closed_at) return [];                                    // a closed session pacts nothing
  if (hoursSince(s.started_at, now) > STALE_HOURS) return [];
  const n = s.step;
  const skipped = STEPS.map((_, i) => i).filter((i) => i < n && !s.steps_done.includes(i));
  // Per-turn additions (31 Jul 2026) ride on EXISTING lines wherever possible —
  // net zero in the common case. The one genuinely new line is the CORE-axis line,
  // and it only appears once the core axis is actually at risk. No clock readings
  // here: elapsed time injected every turn is noise, and mid-session it is
  // meaningless (a legitimately slow session and a fast one read the same until
  // the end). Durations belong at close, where a human is reading.
  const marks = s.axes_marked_at || {};
  const jbc = (a) => { const m = marks[a]; return m && Number.isInteger(m.jirah_before) ? m.jirah_before : 0; };
  const ungraded = s.axes_done.filter((a) => !(jbc(a) >= 1 && !s.axes_done.some((b) => b !== a && jbc(b) === jbc(a))));
  const coreDeferred = CORE_AXES.filter((a) => s.axes_deferred.includes(a));
  const coreOpen = CORE_AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a));
  const gates = (s.question_moments && s.question_moments.widget_gate) || 0;

  const L = [];
  // META-FREEZE binds exactly while a concept is in motion (steps 1-9): canon puts
  // process/system/repo work at the LOCK boundary only. A REMINDER, not a guard —
  // this organ cannot see other tool calls, and the header says so rather than
  // pretending a printed line is enforcement.
  L.push(`FORGE CONTRACT · ${s.concept} · STEP ${n}/${STEPS.length - 1} = ${STEPS[n]}`
    + (n >= 1 && n < 10 ? ` · META-FREEZE ON (concept open — no process/system/repo work until step 10 LOCK)` : ""));
  L.push(`  THE METHOD order: ${STEPS.map((t, i) => (i === n ? `[${i} ${t}]` : `${i} ${t}`)).join(" · ")}`);
  if (skipped.length) L.push(`  ⚠ SKIPPED so far: ${skipped.map((i) => `${i} ${STEPS[i]}`).join(" · ")} — say so out loud, or go back.`);
  L.push(`  axes: done ${s.axes_done.join("") || "—"} · deferred ${s.axes_deferred.join("") || "—"} · left ${AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a)).join("") || "—"}`
    + (ungraded.length ? ` · ungraded ${ungraded.join("")}` : ""));
  L.push(`  question-moments used: ${MOMENTS.map((m) => `${m} ${s.question_moments[m] || 0}`).join(" · ")} (only these four are legal — no quiz-dump)`);
  if (SOFT_PHASE(n)) {
    L.push((s.check_q_this_pass || 0) >= 1
      ? `  ⛔ ONE check-question already spent this pass. TEACH or advance the step — do NOT ask another.`
      : `  phase 3-6: max ONE sharp check-question this pass, and only on what you JUST taught. ONE idea per message — after each pass ask only "samajh aaya — haan ya nahi?" and WAIT.`);
  }
  // The 30 Jul assertion pins the literal substring "owes a WIDGET"; it stays until
  // the gates are actually driven. "Built" was never the obligation — DRIVEN was.
  if (n === 4) L.push(gates >= WIDGET_GATES_MIN
    ? `  step 4 widget: ${gates} guess-gates driven.`
    : `  step 4 owes a WIDGET, DRIVEN not just delivered (Visualization Contract): stepper, no autoplay, his own FinOps data, 2-3 guess-gates. Gates driven so far: ${gates} — log each one with \`moment widget_gate\`.`);
  if (n === 7) L.push(`  step 7 BOLO is voice-first: he speaks it, THEN types the transcript. Non-negotiable.`);
  if (coreDeferred.length) L.push(`  ⛔ CORE-NEVER-DEFERRED VIOLATED: axis ${coreDeferred.join("")} is DEFERRED. Canon forbids it (PROJECT_OS.md:316). Undo it — \`axis ${coreDeferred[0]} done\` only after you actually teach it.`);
  else if (coreOpen.length && n >= 3) L.push(`  CORE axis ${coreOpen.join("")} (math + value RANGE + high/low ka MATLAB) still open — it can never be deferred or dropped.`);
  return L;
}

// COVERAGE — the thing that was invisible before: what actually ran.
function coverage(s, now = new Date()) {
  const ran = STEPS.map((_, i) => i).filter((i) => s.steps_done.includes(i));
  const missed = STEPS.map((_, i) => i).filter((i) => !s.steps_done.includes(i));
  const untouched = AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a));

  // --- grading provenance (added 31 Jul 2026; `honest` below is untouched) ------
  const marks = s.axes_marked_at || {};
  const jb = (a) => { const m = marks[a]; return m && Number.isInteger(m.jirah_before) ? m.jirah_before : 0; };
  // PER-AXIS, per canon: "Per axis: one sharp Q + a trap" (forge/SKILL.md:71) and
  // "Capsule status comes from JIRAH — never from self-rating" (:75). An axis needs
  // a jirah BEFORE its mark, and it may not SHARE that jirah with another axis —
  // nine axes marked after one `moment jirah` are nine ungraded claims, not nine grades.
  const graded = s.axes_done.filter((a) => jb(a) >= 1 && !s.axes_done.some((b) => b !== a && jb(b) === jb(a)));
  const ungraded = s.axes_done.filter((a) => !graded.includes(a));
  const coreMissing = CORE_AXES.filter((a) => !s.axes_done.includes(a));
  const gates = (s.question_moments && s.question_moments.widget_gate) || 0;
  const t0 = Date.parse(s.started_at || "");
  const elapsed_min = Number.isFinite(t0) ? Math.round((now.getTime() - t0) / 6000) / 10 : null;
  const stamps = Object.values(marks).map((m) => Date.parse((m && m.at) || "")).filter(Number.isFinite);
  const span_min = stamps.length >= 2 ? Math.round((Math.max(...stamps) - Math.min(...stamps)) / 6000) / 10 : null;

  return {
    concept: s.concept,
    steps_ran: ran,
    steps_missed: missed,
    steps_pct: Math.round((100 * ran.length) / STEPS.length),
    axes_done: [...s.axes_done],
    axes_deferred: [...s.axes_deferred],
    axes_untouched: untouched,
    axes_graded: graded,
    axes_ungraded: ungraded,
    axes_marked_at: { ...marks },
    core_axes: [...CORE_AXES],
    core_missing: coreMissing,
    widget_gates: gates,
    // THE TWO CLOCKS (red team, 31 Jul 2026). A whole method trail can be replayed
    // in one `;`-joined shell line at close — every counter forged, every axis
    // "graded" — and it reads identical to a real session. What cannot be typed is
    // TIME: `at`/`started_at` are stamped here, never passed from argv. A twelve-step
    // session in 1.4 minutes with every axis marked in the same second is theatre.
    // REPORTED, NEVER THRESHOLDED — there is no closed-session data to calibrate a
    // fair cutoff, and inventing one is the exact over-build this repo keeps doing.
    elapsed_min,
    axis_marks_span_min: span_min,
    question_moments: { ...s.question_moments },
    check_q_refused: s.check_q_refused || 0,     // quiz-dump attempts, kept legible at close
    // FROZEN VERBATIM (30 Jul semantics — layering, never replace). `honest` answers
    // exactly one question: did every step run and was every axis touched. It stays
    // byte-for-byte what it was, so a comparison across old and new rows is valid.
    honest: missed.length === 0 && untouched.length === 0,
    // The new verdict layers ON TOP: coverage AND grading AND the core axis AND a
    // driven widget AND no quiz-dump attempt.
    method_clean: missed.length === 0 && untouched.length === 0 && ungraded.length === 0
      && coreMissing.length === 0 && gates >= WIDGET_GATES_MIN && (s.check_q_refused || 0) === 0,
  };
}

// ---------------------------------------------------------------------------
// DISK — thin, atomic, and never throws at a hook
// ---------------------------------------------------------------------------
function load(path = SESSION) {
  try {
    if (!existsSync(path)) return null;
    const j = JSON.parse(readFileSync(path, "utf8"));
    if (!j || typeof j !== "object" || Array.isArray(j) || !j.concept) return null;
    // shape-repair: an older/partial/hand-mangled file must never crash the pacer —
    // and must never make it LIE. `step` used to pass through unrepaired, so a file
    // holding step:99 injected `STEP 99/11 = undefined` plus a fabricated SKIPPED
    // list into every turn, exit 0, forever. (audit 30 Jul 2026)
    const step = Number.isInteger(j.step) && j.step >= 0 && j.step < STEPS.length ? j.step : 0;
    return {
      ...blank(j.concept),
      ...j,
      step,
      // REPAIR TOWARD SILENCE, NEVER TOWARD SPEECH (regression audit 30 Jul 2026):
      // blank() stamps started_at = NOW, and it is evaluated on every load — so a file
      // missing started_at read as "started this second" forever. STALE-means-silent could
      // never fire, the hook injected that contract on every turn, and `start` stayed
      // blocked. Left undefined, hoursSince() is Infinity → stale → silent → safe.
      started_at: typeof j.started_at === "string" ? j.started_at : undefined,
      steps_done: (Array.isArray(j.steps_done) ? j.steps_done : [])
        .filter((n) => Number.isInteger(n) && n >= 0 && n < STEPS.length)
        .sort((a, b) => a - b),
      axes_done: (Array.isArray(j.axes_done) ? j.axes_done : []).filter((a) => AXES.includes(a)),
      axes_deferred: (Array.isArray(j.axes_deferred) ? j.axes_deferred : []).filter((a) => AXES.includes(a)),
      // anything malformed is DROPPED, which downgrades that axis to UNGRADED — the
      // safe direction. A default that laundered a self-rating into a grade would
      // destroy the point of this change on its very first run, against the live
      // file, which predates provenance entirely.
      axes_marked_at: (j.axes_marked_at && typeof j.axes_marked_at === "object" && !Array.isArray(j.axes_marked_at))
        ? Object.fromEntries(Object.entries(j.axes_marked_at)
            .filter(([k, v]) => AXES.includes(k) && v && typeof v === "object" && !Array.isArray(v))
            .map(([k, v]) => [k, {
              at: typeof v.at === "string" ? v.at : null,
              step: Number.isInteger(v.step) && v.step >= 0 && v.step < STEPS.length ? v.step : null,
              jirah_before: Number.isInteger(v.jirah_before) && v.jirah_before >= 0 ? v.jirah_before : 0,
            }]))
        : {},
      question_moments: { ...blank(j.concept).question_moments, ...(j.question_moments || {}) },
    };
  } catch { return null; }
}

function save(s, path = SESSION) {
  mkdirSync(dirname(path), { recursive: true });
  // per-process tmp name: two concurrent writers sharing one ".tmp" can leave an
  // orphan or lose an update on Windows (rename over a busy file). (audit 30 Jul 2026)
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(s, null, 2) + "\n");
    renameSync(tmp, path);
  } catch (e) {
    try { if (existsSync(tmp)) rmSync(tmp, { force: true }); } catch {}
    throw e;
  }
}

// ---------------------------------------------------------------------------
// HISTORY — the first durable trace this organ has ever had (31 Jul 2026).
// Before today `close` printed the coverage to stdout and wrote only closed_at,
// and the next `start` blanked the file: the report died with the terminal, and
// nothing outside this script had ever read forge_session.json. A record that
// only one process can see is not a record.
//
// RECORD BEFORE REFUSE: the row is appended BEFORE any exit-code decision, which
// is what makes hard-failing safe anywhere in this system.
//
// APPEND, never rewrite: appendFileSync does not rename, so a concurrent reader
// cannot make it throw the way an atomic rewrite does on Windows. And a failed
// append is a COURTESY, never a blocker — same rule as capture.mjs's quarantine.
// ---------------------------------------------------------------------------
function appendCoverage(s, ended_by, extra = {}, path = HISTORY, now = new Date()) {
  try {
    const row = {
      ...coverage(s, now),
      started_at: s.started_at || null,
      updated_at: s.updated_at || null,
      ended_at: nowISO(now),
      ended_by,                                   // "close" | "force"
      ...extra,
    };
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, JSON.stringify(row) + "\n", "utf8");
    return true;
  } catch { return false; }
}

// Reads the history once and answers the only two questions `boot` asks: what was
// the last recorded session, and how many recorded runs share its concept. The
// COUNT is reported, never judged — a threshold on "re-ran after a dirty close"
// needs closed rows to calibrate, and there are zero on disk today.
function lastHistory(path = HISTORY) {
  try {
    if (!existsSync(path)) return { last: null, same_concept: 0 };
    const rows = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o && o.concept) rows.push(o); } catch { /* a mangled line is skipped, never fatal */ }
    }
    if (!rows.length) return { last: null, same_concept: 0 };
    const last = rows[rows.length - 1];
    return { last, same_concept: rows.filter((r) => r.concept === last.concept).length };
  } catch { return { last: null, same_concept: 0 }; }
}

// Two pure predicates so the guards are unit-testable without disk.
// startBlocked: UNCLOSED is the whole test. Staleness is deliberately NOT part of
// it — the old fall-through let a stale-but-real session be blanked with no record,
// which is exactly how the 30 Jul hallucinations session came within one plain
// `start` of erasure.
const startBlocked = (prev, force) => !!(prev && !prev.closed_at && !force);
const shouldRecordClose = (s) => !s.closed_at;

const need = (s) => { if (!s) { console.error("forge_session: no active session — run `start <concept>` first."); process.exit(1); } return s; };
// A closed session is finished. Writing to it used to print success while the
// contract stayed permanently silent — a session that looked paced and was not.
const live = (s) => {
  if (s.closed_at) {
    console.error(`forge_session: session '${s.concept}' was closed at ${s.closed_at} — start a new one (\`start <concept>\`).`);
    process.exit(1);
  }
  // Staleness is the COMMON abandonment (a session left open overnight); closed was the rare
  // one. contractLines() already goes silent past STALE_HOURS, so without this the writes
  // reported success into a session the hook had stopped pacing. (regression audit 30 Jul)
  if (hoursSince(s.started_at) > STALE_HOURS) {
    console.error(`forge_session: session '${s.concept}' is stale (started ${s.started_at || "unknown"}) — the pacer already stopped. \`close\` it for the coverage report, or \`start <concept> --force\`.`);
    process.exit(1);
  }
  return s;
};
const apply = (r) => {
  if (!r.ok) {
    if (r.record) save(r.session);      // a refused attempt is still evidence — persist it
    console.error("forge_session: " + r.error);
    process.exit(1);
  }
  save(r.session);
  return r.session;
};
const oneLine = (s) => `forge_session: ${s.concept} · STEP ${s.step}/${STEPS.length - 1} ${STEPS[s.step]} · axes done ${s.axes_done.join("") || "—"} · check-Q this pass ${s.check_q_this_pass || 0}`
  + (s.check_q_refused ? ` · refused ${s.check_q_refused}` : "")
  + (s.closed_at ? ` · CLOSED ${s.closed_at}` : (hoursSince(s.started_at) > STALE_HOURS ? " · STALE (pacer silent)" : ""));

// ---------------------------------------------------------------------------
// BOOT — the ONE deliberate exception to STALE = SILENT (31 Jul 2026).
// Staleness silences the PACER, never the MEMORY. The >18h next-morning
// "continue" is the only case this line exists for: `contract` correctly prints
// nothing then, while the SessionStart brief signs off "you are oriented — do NOT
// ask him to re-explain where he is". Without this, a fresh session was oriented
// about everything EXCEPT the half-finished concept sitting on disk.
// HARD CAP: two lines, read-only, never a per-turn injection, and it never tells
// a stale session to resume pacing — it tells it to `close` first, so the loop
// ends in ONE command.
// ---------------------------------------------------------------------------
function bootLines(s, hist, now = new Date()) {
  const h = hist || { last: null, same_concept: 0 };
  if (s && s.concept && !s.closed_at) {
    const age = hoursSince(s.started_at, now);
    const stale = age > STALE_HOURS;
    const marks = s.axes_marked_at || {};
    const jb = (a) => { const m = marks[a]; return m && Number.isInteger(m.jirah_before) ? m.jirah_before : 0; };
    const ungraded = s.axes_done.filter((a) => !(jb(a) >= 1 && !s.axes_done.some((b) => b !== a && jb(b) === jb(a))));
    const left = AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a));
    const when = Number.isFinite(age) ? `started ${age.toFixed(1)}h ago${stale ? " (STALE — the pacer is silent)" : ""}` : "age unknown";
    return [
      `FORGE SESSION OPEN ON DISK · ${s.concept} · STEP ${s.step}/${STEPS.length - 1} ${STEPS[s.step] || "?"}`
        + ` · axes done ${s.axes_done.join("") || "—"} · ungraded ${ungraded.join("") || "—"}`
        + ` · deferred ${s.axes_deferred.join("") || "—"} · left ${left.join("") || "—"} · ${when}`,
      stale
        ? "Do NOT re-teach those axes and do NOT start this concept from step 0. Run `node scripts/forge_session.mjs close` FIRST (that is the only thing that saves the coverage report), then `start <concept>`."
        : `Resume it — do NOT re-teach those axes and do NOT run \`start\` again (it will refuse). Continue at STEP ${s.step}.`,
    ];
  }
  if (h.last) {
    const L = h.last;
    const day = String(L.ended_at || "").slice(0, 10) || "date unknown";
    return [`LAST FORGE SESSION · ${L.concept} · ${day} · steps ${(L.steps_ran || []).length}/${STEPS.length}`
      + ` · axes done ${(L.axes_done || []).join("") || "—"} · ungraded ${(L.axes_ungraded || []).join("") || "—"}`
      + ` · elapsed ${L.elapsed_min === null || L.elapsed_min === undefined ? "?" : L.elapsed_min}m · ${L.ended_by || "?"}`
      + (h.same_concept > 1 ? ` · ${h.same_concept} recorded runs for this concept` : "")];
  }
  return [];
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };
  const T0 = new Date("2026-07-30T10:00:00Z");

  const s0 = blank("Hallucinations", T0);
  assert("start lowercases + trims the concept", s0.concept === "hallucinations");
  assert("start begins at step 0 (TIME-BOX), already recorded", s0.step === 0 && s0.steps_done.join() === "0");
  assert("start zeroes all four question-moments", MOMENTS.every((m) => s0.question_moments[m] === 0));

  assert("step rejects out-of-range (12)", !setStep(s0, 12).ok);
  assert("step rejects non-integer", !setStep(s0, "x").ok);
  const s3 = setStep(s0, 3, T0).session;
  assert("step records into steps_done, sorted", s3.step === 3 && s3.steps_done.join() === "0,3");

  const withQ = addMoment(s3, "check_q", T0).session;
  assert("check_q increments both the total and this-pass counter", withQ.question_moments.check_q === 1 && withQ.check_q_this_pass === 1);
  assert("QUIZ-DUMP LAW — a spent check-Q in phase 3-6 hard-stops the next one",
    contractLines(withQ, T0).some((l) => /ONE check-question already spent/.test(l)));
  const s4 = setStep(withQ, 4, T0).session;
  assert("a new pass restores the one check-question allowance", s4.check_q_this_pass === 0);
  assert("total check_q survives the pass change (audit trail intact)", s4.question_moments.check_q === 1);
  assert("moment rejects an unknown kind", !addMoment(s3, "vibes").ok);

  assert("SKIP DETECTION — steps jumped over are named in the contract",
    contractLines(s4, T0).some((l) => /SKIPPED so far.*1 DARAAR-MAP/.test(l)));
  assert("step 4 contract demands the widget", contractLines(s4, T0).some((l) => /owes a WIDGET/.test(l)));
  assert("step 7 contract demands voice-first Bolo",
    contractLines(setStep(s4, 7, T0).session, T0).some((l) => /voice-first/.test(l)));

  const ax = markAxis(s4, "A", "done", T0).session;
  assert("axis marking is case-insensitive", ax.axes_done.join() === "a");
  const ax2 = markAxis(ax, "a", "defer", T0).session;
  assert("re-marking an axis MOVES it, never duplicates", ax2.axes_done.length === 0 && ax2.axes_deferred.join() === "a");
  assert("axis rejects a letter past i", !markAxis(ax, "z", "done").ok);
  assert("axis rejects an unknown disposition", !markAxis(ax, "b", "maybe").ok);

  const cov = coverage(ax2);
  assert("coverage counts what RAN, not what was claimed", cov.steps_ran.join() === "0,3,4" && cov.steps_pct === 25);
  assert("coverage names every missed step", cov.steps_missed.includes(1) && cov.steps_missed.includes(9));
  assert("coverage separates deferred from untouched (deferred ≠ dropped)",
    cov.axes_deferred.join() === "a" && cov.axes_untouched.length === 8);
  assert("coverage is honest only when nothing was skipped", cov.honest === false);

  assert("STALE = SILENT — yesterday's session injects nothing",
    contractLines(s0, new Date("2026-07-31T18:00:00Z")).length === 0);
  assert("CLOSED = SILENT — a closed session stops pacing", contractLines({ ...s4, closed_at: nowISO(T0) }, T0).length === 0);

  // ---- audit 30 Jul 2026 — the holes the first selftest could not see ----
  assert("STRICT STEP — empty string is NOT step 0", !setStep(s0, "").ok && !setStep(s0, "  ").ok);
  assert("STRICT STEP — booleans/arrays/'3.5' are rejected", !setStep(s0, true).ok && !setStep(s0, [3]).ok && !setStep(s0, "3.5").ok);
  assert("STRICT STEP — plain digit runs work, with or without padding/space",
    setStep(s0, "7").ok && setStep(s0, "07").ok && setStep(s0, " 5 ").ok && setStep(s0, 3).ok
    && setStep(s0, "7").session.step === 7 && setStep(s0, "07").session.step === 7);
  assert("STRICT STEP — signed / exponent / hex / non-Latin digits are all rejected",
    ["+3", "-1", "1e1", "0x3", "٣", "3 4"].every((v) => !setStep(s0, v).ok));
  assert("ENFORCED — the 2nd check-Q in phase 3-6 is REFUSED, not merely warned", !addMoment(withQ, "check_q").ok);
  assert("ENFORCED — refusal names the step so the teacher knows what to do",
    /already spent on STEP 3 SAMJHAO/.test(addMoment(withQ, "check_q").error));
  assert("the law is phase-scoped — outside 3-6 a second check-Q is allowed",
    addMoment({ ...withQ, step: 9 }, "check_q").ok);
  assert("NO BYPASS — re-declaring the step you are already on does NOT re-arm the allowance",
    setStep(withQ, 3, T0).session.check_q_this_pass === 1 && !addMoment(setStep(withQ, 3, T0).session, "check_q").ok);
  assert("a genuinely new step still re-arms it", setStep(withQ, 5, T0).session.check_q_this_pass === 0);
  assert("a REFUSED check-Q is recorded, so coverage can still see the quiz-dump attempt",
    addMoment(withQ, "check_q").session.check_q_refused === 1 && addMoment(withQ, "check_q").record === true
    && coverage(addMoment(withQ, "check_q").session).check_q_refused === 1);
  assert("REPAIR TOWARD SILENCE — a session file with no started_at reads as stale, not fresh",
    contractLines({ ...s4, started_at: undefined }, T0).length === 0);
  assert("pehle_guess/jirah are never rate-limited by the check-Q law",
    addMoment(withQ, "pehle_guess").ok && addMoment(withQ, "jirah").ok);

  // shape-repair needs a real file; use the OS temp dir, never the live bus
  const probe = join(tmpdir(), `forge_session_selftest_${process.pid}.json`);
  writeFileSync(probe, JSON.stringify({
    concept: "x", started_at: nowISO(T0), step: 99,
    steps_done: [1, "two", 47, 3], axes_done: ["a", "zz", 7], axes_deferred: null,
  }));
  const repaired = load(probe);
  assert("SHAPE-REPAIR — an out-of-range step can never be injected as 'STEP 99/11'", repaired.step === 0);
  assert("SHAPE-REPAIR — junk steps_done entries are dropped, rest sorted", repaired.steps_done.join() === "1,3");
  assert("SHAPE-REPAIR — junk axes are dropped, null arrays survive as []",
    repaired.axes_done.join() === "a" && Array.isArray(repaired.axes_deferred));
  writeFileSync(probe, "{ this is not json");
  assert("HOOK-SAFE — truncated JSON loads as null", load(probe) === null);
  writeFileSync(probe, JSON.stringify([1, 2, 3]));
  assert("HOOK-SAFE — a JSON array is not a session", load(probe) === null);
  save({ ...s0, concept: "tmpcheck" }, probe);
  assert("ATOMIC WRITE — the round trip survives and leaves no orphan .tmp",
    load(probe).concept === "tmpcheck" && !existsSync(`${probe}.${process.pid}.tmp`));
  rmSync(probe, { force: true });
  assert("HOOK-SAFE — no session injects nothing", contractLines(null, T0).length === 0);
  assert("HOOK-SAFE — a corrupt/absent file loads as null, never throws", load("__no_such_file__") === null);

  // =========================================================================
  // 31 Jul 2026 — GRADING PROVENANCE · THE TWO CLOCKS · HISTORY · BOOT
  // Every disk path below lives under tmpdir(), never dressing-room/state.
  // =========================================================================
  const T = (min) => new Date(T0.getTime() + min * 60000);
  const at5 = setStep(blank("hallucinations", T0), 5, T0).session;
  const mA = markAxis(at5, "a", "done", T0).session;
  assert("PROVENANCE — a mark stamps at (ISO) + step + jirah_before",
    typeof mA.axes_marked_at.a.at === "string" && !Number.isNaN(Date.parse(mA.axes_marked_at.a.at))
    && mA.axes_marked_at.a.step === 5 && mA.axes_marked_at.a.jirah_before === 0);
  assert("UNGRADED — an axis marked with jirah 0 is ungraded, never graded",
    coverage(mA, T0).axes_ungraded.join() === "a" && coverage(mA, T0).axes_graded.length === 0);

  const jr = addMoment(at5, "jirah", T0).session;
  const mAj = markAxis(jr, "a", "done", T0).session;
  assert("GRADED — an axis marked AFTER its own jirah is graded",
    coverage(mAj, T0).axes_graded.join() === "a" && coverage(mAj, T0).axes_ungraded.length === 0);
  const mAjDef = markAxis(mAj, "a", "defer", T0).session;
  assert("ONE-LIST INVARIANT holds with provenance attached (defer removes it from both)",
    mAjDef.axes_done.length === 0 && mAjDef.axes_deferred.join() === "a"
    && coverage(mAjDef, T0).axes_graded.length === 0 && coverage(mAjDef, T0).axes_ungraded.length === 0);
  const upgraded = markAxis(addMoment(mA, "jirah", T0).session, "a", "done", T0).session;
  assert("UPGRADE — re-marking after a jirah moves an axis from ungraded to graded",
    coverage(upgraded, T0).axes_graded.join() === "a" && coverage(upgraded, T0).axes_ungraded.length === 0);

  let oneJirah = addMoment(at5, "jirah", T0).session;
  for (const a of AXES) oneJirah = markAxis(oneJirah, a, "done", T0).session;
  assert("ONE JIRAH CANNOT GRADE NINE AXES — nine marks behind one jirah are ALL ungraded",
    coverage(oneJirah, T0).axes_graded.length === 0 && coverage(oneJirah, T0).axes_ungraded.length === 9);
  let nineJirah = at5;
  for (const a of AXES) { nineJirah = addMoment(nineJirah, "jirah", T0).session; nineJirah = markAxis(nineJirah, a, "done", T0).session; }
  assert("NINE DISTINCT JIRAHS grade nine axes", coverage(nineJirah, T0).axes_graded.length === 9);

  const legacy = { ...blank("hallucinations", T0), axes_done: ["a", "b", "c", "e", "f"] };
  assert("LIVE-FILE MIGRATION — axes_done with NO provenance reports all ungraded (a self-rating is never laundered)",
    coverage(legacy, T0).axes_ungraded.join("") === "abcef" && coverage(legacy, T0).axes_graded.length === 0);

  const junkProbe = join(tmpdir(), `forge_marks_selftest_${process.pid}.json`);
  writeFileSync(junkProbe, JSON.stringify({ concept: "x", started_at: nowISO(T0), step: 2, axes_done: ["a"],
    axes_marked_at: { zz: { at: "x" }, a: { at: nowISO(T0), step: 2, jirah_before: "many" }, b: null, c: [1, 2] } }));
  const jl = load(junkProbe);
  assert("SHAPE-REPAIR — junk provenance entries are dropped and the survivor downgrades to ungraded",
    Object.keys(jl.axes_marked_at).join() === "a" && jl.axes_marked_at.a.jirah_before === 0
    && coverage(jl, T0).axes_ungraded.join() === "a");
  rmSync(junkProbe, { force: true });

  let perfect = blank("hallucinations", T0);
  STEPS.forEach((_, i) => { perfect = setStep(perfect, i, T0).session; });
  for (const a of AXES) perfect = markAxis(perfect, a, "done", T0).session;
  assert("`honest` IS FROZEN — every step run + every axis touched is still honest:true with jirah 0",
    coverage(perfect, T0).honest === true);
  assert("`method_clean` SEES WHAT `honest` CANNOT — same session is method_clean:false, and names why",
    coverage(perfect, T0).method_clean === false && coverage(perfect, T0).axes_ungraded.length === 9);

  let clean = blank("hallucinations", T0);
  STEPS.forEach((_, i) => { clean = setStep(clean, i, T0).session; });
  clean = addMoment(addMoment(clean, "widget_gate", T0).session, "widget_gate", T0).session;
  for (const a of AXES) { clean = addMoment(clean, "jirah", T0).session; clean = markAxis(clean, a, "done", T0).session; }
  assert("A GENUINELY CLEAN SESSION reports method_clean:true", coverage(clean, T0).method_clean === true);
  const noCore = markAxis(clean, "d", "defer", T0).session;
  assert("CORE-NEVER-DEFERRED — method_clean false and core_missing names 'd' when d is not done",
    coverage(noCore, T0).method_clean === false && coverage(noCore, T0).core_missing.join() === "d");
  let oneGate = blank("hallucinations", T0);
  STEPS.forEach((_, i) => { oneGate = setStep(oneGate, i, T0).session; });
  oneGate = addMoment(oneGate, "widget_gate", T0).session;
  for (const a of AXES) { oneGate = addMoment(oneGate, "jirah", T0).session; oneGate = markAxis(oneGate, a, "done", T0).session; }
  assert("WIDGET GATES — false at 1 gate, true at 2, and there is NO widget_driven boolean",
    coverage(oneGate, T0).method_clean === false && coverage(clean, T0).method_clean === true
    && !("widget_driven" in coverage(clean, T0)));
  assert("QUIZ-DUMP COUNTS AGAINST THE VERDICT — check_q_refused 1 makes an otherwise perfect session dirty",
    coverage({ ...clean, check_q_refused: 1 }, T0).method_clean === false);

  assert("elapsed_min is REPORTED, never judged — 90 min elapsed, verdict unchanged",
    coverage(clean, T(90)).elapsed_min === 90 && coverage(clean, T(90)).method_clean === coverage(clean, T0).method_clean);
  assert("elapsed_min is null on an unparseable started_at, and the verdict is identical",
    coverage({ ...clean, started_at: "nonsense" }, T0).elapsed_min === null
    && coverage({ ...clean, started_at: "nonsense" }, T0).method_clean === coverage(clean, T0).method_clean);
  assert("THE REPLAY SIGNATURE — nine marks in the same second span 0 min; marks spread T0..T0+45 span 45",
    coverage(oneJirah, T0).axis_marks_span_min === 0
    && coverage(markAxis(mA, "b", "done", T(45)).session, T0).axis_marks_span_min === 45);
  assert("axis_marks_span_min is null below two parseable marks", coverage(mA, T0).axis_marks_span_min === null);

  const coreDef = markAxis(setStep(blank("x", T0), 5, T0).session, "d", "defer", T0).session;
  assert("CONTRACT — a DEFERRED core axis prints the ⛔ violation line",
    contractLines(coreDef, T0).some((l) => /CORE-NEVER-DEFERRED VIOLATED/.test(l)));
  assert("CONTRACT — the softer core-still-open line appears from step 3, and is silent at steps 0-2",
    contractLines(setStep(blank("x", T0), 3, T0).session, T0).some((l) => /CORE axis d .* still open/.test(l))
    && !contractLines(setStep(blank("x", T0), 2, T0).session, T0).some((l) => /still open/.test(l)));
  const ungradedContract = markAxis(markAxis(setStep(blank("x", T0), 5, T0).session, "a", "done", T0).session, "b", "done", T0).session;
  let gradedContract = setStep(blank("x", T0), 5, T0).session;
  for (const a of ["a", "b"]) { gradedContract = addMoment(gradedContract, "jirah", T0).session; gradedContract = markAxis(gradedContract, a, "done", T0).session; }
  assert("PER-TURN UNGRADED — the axes line gains ' · ungraded ab', and the LINE COUNT is identical (net zero)",
    contractLines(ungradedContract, T0).some((l) => /ungraded ab/.test(l))
    && !contractLines(gradedContract, T0).some((l) => /ungraded/.test(l))
    && contractLines(ungradedContract, T0).length === contractLines(gradedContract, T0).length);
  const step4 = setStep(blank("x", T0), 4, T0).session;
  assert("REGRESSION PIN — step 4 still says 'owes a WIDGET' at 0 gates, and names the count",
    contractLines(step4, T0).some((l) => /owes a WIDGET/.test(l) && /Gates driven so far: 0/.test(l)));
  assert("step 4 drops 'owes a WIDGET' only once the gates are actually driven",
    !contractLines(addMoment(addMoment(step4, "widget_gate", T0).session, "widget_gate", T0).session, T0)
      .some((l) => /owes a WIDGET/.test(l)));
  assert("CONTRACT — META-FREEZE ON at steps 1-9, absent at step 0 and step 10",
    contractLines(setStep(blank("x", T0), 1, T0).session, T0)[0].includes("META-FREEZE ON")
    && contractLines(setStep(blank("x", T0), 9, T0).session, T0)[0].includes("META-FREEZE ON")
    && !contractLines(blank("x", T0), T0)[0].includes("META-FREEZE ON")
    && !contractLines(setStep(blank("x", T0), 10, T0).session, T0)[0].includes("META-FREEZE ON"));
  let worst = 0;
  for (let i = 0; i < STEPS.length; i++) {
    let c = setStep(blank("x", T0), i, T0).session;
    c = addMoment(c, "check_q", T0).ok ? addMoment(c, "check_q", T0).session : c;
    c = markAxis(c, "d", "defer", T0).session;
    c = { ...c, steps_done: [i] };                       // force the SKIPPED line too
    worst = Math.max(worst, contractLines(c, T0).length);
  }
  assert("CONTRACT LENGTH BOUND — never more than 9 lines in any reachable state (pins the anti-wall law)", worst <= 9);
  assert("STALE = SILENT still holds for the contract with every new line added",
    contractLines(coreDef, new Date(T0.getTime() + 19 * 3600000)).length === 0);

  // ---- history + boot (tmpdir only) ---------------------------------------
  const hp = join(tmpdir(), `forge_hist_selftest_${process.pid}.jsonl`);
  rmSync(hp, { force: true });
  assert("appendCoverage writes exactly ONE parseable line carrying the verdict + both clocks",
    appendCoverage(clean, "close", {}, hp, T(30)) === true
    && readFileSync(hp, "utf8").trim().split("\n").length === 1
    && (() => { const r = JSON.parse(readFileSync(hp, "utf8").trim());
      return r.concept === "hallucinations" && r.method_clean === true && r.honest === true
        && r.elapsed_min === 30 && r.axis_marks_span_min === 0 && r.ended_by === "close" && typeof r.ended_at === "string"; })());
  assert("appendCoverage is a COURTESY — an unwritable path returns false and never throws",
    appendCoverage(clean, "close", {}, join(hp, "nope", "deep.jsonl"), T0) === false);
  appendCoverage({ ...legacy, started_at: nowISO(T0) }, "force", { continues: nowISO(T0) }, hp, T(60));
  assert("a --force start of the SAME concept records `continues`, so a clock-split is not read as a violation",
    JSON.parse(readFileSync(hp, "utf8").trim().split("\n")[1]).continues === nowISO(T0));
  appendFileSync(hp, "{ this is not json\n");
  const H = lastHistory(hp);
  assert("lastHistory returns the LAST valid row, skips a mangled line, and counts same-concept runs",
    H.last && H.last.ended_by === "force" && H.same_concept === 2);
  assert("lastHistory on a missing file returns a null row and count 0",
    lastHistory(join(tmpdir(), "forge_no_such_history.jsonl")).last === null);
  assert("DOUBLE-CLOSE GUARD — shouldRecordClose is true once, false after closed_at is set",
    shouldRecordClose(clean) === true && shouldRecordClose({ ...clean, closed_at: nowISO(T0) }) === false);
  assert("THE DELETED FALL-THROUGH — startBlocked is TRUE for a STALE unclosed prev (the 30 Jul erasure path)",
    startBlocked({ ...clean, started_at: nowISO(T0) }, false) === true
    && startBlocked(clean, false) === true
    && startBlocked(clean, true) === false
    && startBlocked({ ...clean, closed_at: nowISO(T0) }, false) === false
    && startBlocked(null, false) === false);

  const staleSession = { ...legacy, started_at: nowISO(T0), step: 5 };
  const bStale = bootLines(staleSession, { last: null, same_concept: 0 }, new Date(T0.getTime() + 19 * 3600000));
  assert("BOOT SPEAKS on a stale unclosed session — the exact case `contract` is silent for",
    bStale.length === 2 && /hallucinations/.test(bStale[0]) && /STEP 5/.test(bStale[0])
    && /axes done abcef/.test(bStale[0]) && /ungraded abcef/.test(bStale[0]) && /STALE/.test(bStale[0])
    && /close` FIRST/.test(bStale[1]));
  const bFresh = bootLines(staleSession, { last: null, same_concept: 0 }, T(30));
  assert("BOOT on a FRESH session says 'Resume it', never 'close FIRST'",
    /Resume it/.test(bFresh[1]) && !/close` FIRST/.test(bFresh[1]));
  assert("BOOT returns ZERO lines with no session and no history, and with a closed session and empty history",
    bootLines(null, { last: null, same_concept: 0 }, T0).length === 0
    && bootLines({ ...clean, closed_at: nowISO(T0) }, { last: null, same_concept: 0 }, T0).length === 0);
  const bHist = bootLines({ ...clean, closed_at: nowISO(T0) }, lastHistory(hp), T0);
  assert("BOOT falls back to the ONE-line history branch naming concept, date, axes, elapsed and ended_by",
    bHist.length === 1 && /LAST FORGE SESSION/.test(bHist[0]) && /hallucinations/.test(bHist[0])
    && /2026-07-30/.test(bHist[0]) && /force/.test(bHist[0]));
  assert("BOOT names the run count only above one recorded row",
    /2 recorded runs/.test(bHist[0])
    && !/recorded runs/.test(bootLines({ ...clean, closed_at: nowISO(T0) }, { last: JSON.parse(readFileSync(hp, "utf8").trim().split("\n")[0]), same_concept: 1 }, T0)[0]));
  assert("BOOT IS BOUNDED — never more than 2 lines in any branch, and never writes",
    Math.max(bStale.length, bFresh.length, bHist.length) <= 2 && !existsSync(join(tmpdir(), "forge_boot_wrote_something")));
  rmSync(hp, { force: true });

  console.log(`\nforge_session selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
const [mode, ...rest] = process.argv.slice(2);
switch (mode) {
  case "start": {
    const force = rest.includes("--force");
    const concept = rest.filter((a) => a !== "--force").join(" ");
    if (!concept) { console.error("forge_session: start needs a concept"); process.exit(1); }
    // A live session is WORK — its coverage report is the only record that the
    // session happened at all. `start` used to silently overwrite it, so a stray
    // re-start erased which axes were deferred. (audit 30 Jul 2026)
    // UNCLOSED is the whole test now (31 Jul 2026). The old guard also required the
    // session to be FRESH, so a stale-but-real session fell straight through and was
    // blanked with no record — the live hallucinations session was one plain `start`
    // from erasure. The refusal deliberately names ONLY `close`: the draft ended with
    // "or re-run with --force to discard it", offering the escape at the exact moment
    // the command is being retyped. --force still works and is still in the usage
    // string, where someone who genuinely needs it will look.
    const prev = load();
    if (startBlocked(prev, force)) {
      const age = hoursSince(prev.started_at);
      const when = Number.isFinite(age) ? `started ${age.toFixed(1)}h ago${age > STALE_HOURS ? ", STALE" : ""}` : "age unknown";
      console.error(`forge_session: '${prev.concept}' is still open (STEP ${prev.step} ${STEPS[prev.step] || "?"}, axes done ${prev.axes_done.join("") || "—"}, ${when}).`);
      console.error("  → `node scripts/forge_session.mjs close` first — that is the only thing that saves the coverage report. Then re-run start.");
      process.exit(1);
    }
    // RECORD BEFORE DISCARD: a --force overwrite still leaves a row behind.
    if (prev && !prev.closed_at && force) {
      appendCoverage(prev, "force",
        prev.concept === String(concept).trim().toLowerCase() ? { continues: prev.started_at || null } : {});
    }
    const s = blank(concept);
    save(s);
    console.log(oneLine(s));
    break;
  }
  case "step":   console.log(oneLine(apply(setStep(live(need(load())), rest[0])))); break;
  case "axis":   console.log(oneLine(apply(markAxis(live(need(load())), rest[0], rest[1] || "done")))); break;
  case "moment": console.log(oneLine(apply(addMoment(live(need(load())), rest[0])))); break;
  case "status": { const s = load(); if (s) console.log(oneLine(s)); break; }
  case "contract": {                      // HOOK PATH — silence is the default
    // SELF-INJECTION GUARD (same scar as hooks/afferent-post.mjs): every headless
    // `claude -p` the organism spawns runs inside this project, inherits
    // .claude/settings.json and fires UserPromptSubmit. An organ prompt must never
    // be handed the captain's forge contract.
    if (process.env.ARSENAL_ORGAN === "1") break;
    const lines = contractLines(load());
    if (lines.length) console.log(lines.join("\n"));
    break;
  }
  case "boot": {                          // HOOK PATH — read-only, at most two lines
    // SELF-INJECTION GUARD (same scar as `contract` above, learnstate.mjs and
    // hooks/afferent-post.mjs): every headless `claude -p` the organism spawns runs
    // inside this project and fires SessionStart. An organ prompt must never be
    // handed the captain's open-session state.
    if (process.env.ARSENAL_ORGAN === "1") break;
    try {
      const lines = bootLines(load(), lastHistory());
      if (lines.length) console.log(lines.join("\n"));
    } catch { /* a boot line is orientation, never a reason to bite the session */ }
    break;
  }
  case "close": {
    // need(), NOT live() — a stale session MUST stay closable, or the coverage
    // report is unreachable for exactly the sessions that most need one.
    const s = need(load());
    const cov = coverage(s);
    console.log(JSON.stringify(cov, null, 2));
    if (shouldRecordClose(s)) {           // RECORD BEFORE REFUSE · double-close appends once
      appendCoverage(s, "close");
      save({ ...s, closed_at: nowISO() });
    }
    // ALWAYS printed — never gated on failure. The draft printed this block only
    // when something was wrong, which quietly made "make the report say clean" the
    // smartest move for a tired session. That incentive is deleted.
    const R = [];
    R.push(`FORGE METHOD CHECK · ${cov.concept} · method_clean: ${cov.method_clean}`);
    R.push(`  elapsed ${cov.elapsed_min === null ? "unknown" : cov.elapsed_min} min · axis marks spread over ${cov.axis_marks_span_min === null ? "span unknown" : cov.axis_marks_span_min + " min"}`);
    R.push("  (a 12-step session in 1.4 min is theatre — read these two numbers out loud)");
    if (cov.steps_missed.length) R.push(`  steps never run: ${cov.steps_missed.map((i) => `${i} ${STEPS[i]}`).join(" · ")}`);
    if (cov.axes_untouched.length) R.push(`  axes never touched: ${cov.axes_untouched.join("")}`);
    if (cov.axes_ungraded.length) R.push(`  axes marked done without their OWN jirah (self-rated or batch-graded, not per-axis graded): ${cov.axes_ungraded.join("")}`);
    if (cov.core_missing.length) R.push(`  CORE axis ${cov.core_missing.join("")} never closed (CORE-NEVER-DEFERRED — canon forbids deferring it)`);
    if (cov.widget_gates < WIDGET_GATES_MIN) R.push(`  widget guess-gates driven ${cov.widget_gates}/${WIDGET_GATES_MIN} — built is not driven`);
    if (cov.check_q_refused) R.push(`  check-questions REFUSED: ${cov.check_q_refused} (quiz-dump attempts)`);
    R.push("  → say all of this out loud to him, verbatim, before the delta.");
    R.push(`forge_session: recorded to ${HISTORY}`);
    console.log(R.join("\n"));
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log("forge_session: start <concept> [--force] | step <0-11> | axis <a-i> [done|defer] | moment <" + MOMENTS.join("|") + "> | status | contract | boot | close | selftest");
}
