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
//     AMENDED (audit #108, 6 Aug 2026): "never touches" is now exactly NEVER WRITES.
//     `close` READS reps_log.jsonl, one direction only, to say whether this session
//     banked a single rep — because for two whole sessions it banked none and the
//     report said nothing at all. capture.mjs remains its sole writer. See repsBanked().
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
// READS:     its own forge_sessions.jsonl (`boot` only) AND, at `close` only,
//            teaching_contract.json STRICTLY READ-ONLY — an afferent nerve, never a
//            write (teaching_contract.mjs is that file's sole writer). It still
//            never reads reps_log (capture.mjs owns it).  ← TRUE UNTIL audit #108,
//            6 Aug 2026: `close` now reads reps_log.jsonl on the SAME terms — one
//            direction, capture.mjs still the sole writer, a bad file costs nothing.
// MODES: start <concept> [--force] · step <0-11> · axis <a-i> [done|defer]
//        · moment <kind> · status · contract · boot · close · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, rmSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";   // LOCK-chain + topic-open spawns (outward loop, 8 Aug 2026)

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SESSION   = join(STATE_DIR, "forge_session.json");
const HISTORY   = join(STATE_DIR, "forge_sessions.jsonl");
const TEACHING  = join(STATE_DIR, "teaching_contract.json");   // READ-ONLY here; owned by teaching_contract.mjs
const AUDIT_LAST = join(STATE_DIR, "teaching_audit_last.json"); // READ-ONLY here; owned by teaching_audit.mjs (checked_rules stamp)
const REPS      = join(STATE_DIR, "reps_log.jsonl");           // READ-ONLY here; owned by capture.mjs (audit #108)

// THE METHOD — PER-CONCEPT PIPELINE, verbatim order (PROJECT_OS.md).
const STEPS = [
  "TIME-BOX",       // 0  core concept ≈ max 1 din; budget khatam → bache axes DEFER
  // AUDIT #4 (4 Aug 2026) — THE NAME IS USED AT TWO DIFFERENT MOMENTS.
  // At step 1 NOTHING is cracked yet: these are the 9 ANGLES TO COVER, shown
  // upfront as a visible finish line (an ADHD-PI accommodation, not decoration).
  // The real cracks -- capsule `faultLines` -- only exist AFTER step 9 JIRAH,
  // where an axis is graded held or cracked. Same word, two moments; reading
  // step 1 as "the crack map" makes a session hunt for damage that has not
  // happened yet. The canonical name stays (PROJECT_OS.md + forge_sessions.jsonl
  // history both carry this exact string) -- what changes is that the ambiguity
  // is now written down instead of being rediscovered every few weeks.
  "DARAAR-MAP",     // 1  COVERAGE map: 9 axes dikhao = visible finish line (cracks come at 9 JIRAH)
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
  current_axis: null,
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
  // Marking an axis (either way) ends its turn as the CURRENT axis — see setCurrentAxis.
  const cur = s.current_axis === a ? null : (s.current_axis ?? null);
  return { ok: true, session: { ...s, axes_done: done.sort(), axes_deferred: def.sort(), axes_marked_at: marked, current_axis: cur, updated_at: nowISO(now) } };
}

// THE MISSING DECLARATION (7 Aug 2026, full-organism audit P4.1). What a teacher
// needs every turn is "I am NOW on axis x" — a statement that completes nothing.
// Until today that command did not exist, and the nearest-looking one (`axis <x>`,
// argument optional, DEFAULT DONE) meant "axis x is COMPLETE": on 7 Aug that trap
// bit twice in twenty minutes, recording axes b and then another as done-but-
// UNGRADED before any Jirah had happened. `now` is pure declaration: it moves no
// axis between lists, touches no marks, and is cleared by the axis's own
// done/defer. The trap itself is closed at the CLI (the bare form now refuses).
function setCurrentAxis(s, axis, now = new Date()) {
  const a = String(axis || "").trim().toLowerCase();
  if (!AXES.includes(a)) return { ok: false, error: `axis not a..i (${axis})`, session: s };
  return { ok: true, session: { ...s, current_axis: a, updated_at: nowISO(now) } };
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
// ONE line, emitted only when the sprint says a CONCEPT is in motion and no forge
// session is carrying it. Reads sprint.json read-only; any failure = silence (this
// runs on a hook, and a hook that throws costs him a turn).
export function nudgeLine(deps = {}) {
  try {
    const sprint = deps.sprint !== undefined ? deps.sprint
      : JSON.parse(readFileSync(join(STATE_DIR, "sprint.json"), "utf8"));
    const cur = sprint && sprint.progress && sprint.progress.current;
    if (!cur || String(cur.track || "").toLowerCase() !== "concept") return "";
    const task = cur.task || cur.id || "the current concept";
    return `FORGE: koi session KHULI nahi hai, aur sprint pe "${task}" (concept) chal raha hai.`
      + ` Agar is turn mein padhana hai to PEHLE \`node scripts/forge_session.mjs start <concept>\` —`
      + ` warna THE METHOD ka 12-step order, chaar-legal-question-moments law aur META-FREEZE is turn tak pahunchte hi nahi.`;
  } catch { return ""; }
}

// ---------------------------------------------------------------------------
// DOSSIER → TEACHING CALIBRATION (7 Aug 2026 audit, deliverable 2 — class H).
// Measured before today: EVERY dossier_weights.json reader was a testing organ
// (setpiece probe grammar + weighting · scout edge split · nightshift probe bank
// + scoutPack · dugout scrimmage instruction) and NO teaching organ read it at
// all — the interview's own time-weights shaped every drill he was TESTED with
// and never once the session he was TAUGHT in. This is the projection of that
// same file onto the teaching surface: which rounds buy this concept's bucket
// (weights are OPPONENT_SCOUT §1's, read-only, never invented here) and which
// probe TYPES will hit the axes still left open — so the teacher teaching axis d
// can see, every turn, the exact interview shapes that will test it.
// PURE: all data injected, [] on any missing/corrupt piece — the contract hook
// must stay fail-silent. Bucket fallback mirrors setpiece.mjs:419 (concepts.json
// bucket, else registry.skills → "skills") so the two sides read ONE law.
export function dossierLines(concept, s, { dossier, registry } = {}) {
  try {
    if (!concept || !s || !dossier || !Array.isArray(dossier.rounds)) return [];
    const reg = registry || {};
    const c = (reg.concepts || {})[concept];
    const bucket = c && c.bucket ? c.bucket : ((reg.skills && reg.skills[concept]) ? "skills" : null);
    if (!bucket) return [];
    const roundIds = (dossier.bucket_round_map || {})[bucket] || [];
    if (!roundIds.length) return [];
    const rounds = roundIds.map((id) => dossier.rounds.find((r) => r.id === id)).filter(Boolean);
    if (!rounds.length) return [];
    const pct = (w) => `${Math.round(w * 1000) / 10}%`;
    const total = rounds.reduce((a, r) => a + (Number(r.weight) || 0), 0);
    const L = [];
    L.push(`  DOSSIER: ${bucket} → ${rounds.map((r) => `${r.id} ${pct(Number(r.weight) || 0)}`).join(" · ")} (interview ka ${pct(total)} is bucket pe — OPPONENT_SCOUT §1, read-only)`);
    const left = AXES.filter((a) => !(s.axes_done || []).includes(a) && !(s.axes_deferred || []).includes(a));
    if (left.length && dossier.probe_types) {
      const map = left
        .map((a) => {
          const types = Object.entries(dossier.probe_types).filter(([, v]) => Array.isArray(v.axis_types) && v.axis_types.includes(a)).map(([k]) => k);
          return types.length ? `${a}←${types.join(",")}` : null;
        })
        .filter(Boolean);
      if (map.length) L.push(`  bache axes ke interview-probes: ${map.join(" · ")}`);
    }
    return L;
  } catch { return []; }
}

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
  L.push(`  axes:${s.current_axis && !s.axes_done.includes(s.current_axis) && !s.axes_deferred.includes(s.current_axis) ? ` ON ${s.current_axis} ·` : ""} done ${s.axes_done.join("") || "—"} · deferred ${s.axes_deferred.join("") || "—"} · left ${AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a)).join("") || "—"}`
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
// THE TEACHER'S OWN DRIFTS (W3, 1 Aug 2026). Every close already reported how the
// SESSION went and nothing reported how the TEACHER went. teaching_contract.mjs has
// counted real observed teaching-drifts since 31 Jul, but that count only surfaced
// when a human thought to run `list` — i.e. never, at the one moment it matters.
// Now the close report says it unasked, every session.
//
// WHAT CANNOT BE KNOWN AND IS THEREFORE NOT CLAIMED: `hits` is CUMULATIVE across
// every session ever, and `last_hit` is ONE timestamp. So "his-word drifted twice
// tonight" is unknowable from that file — a rule with hits:5 whose last_hit lands
// inside this session may have drifted once tonight or five times. The only
// attributable fact is WHICH rules were hit at or after started_at, and that is all
// the line says. Printing "×2" here would be the same class of lie as marking an
// axis done without its own jirah, in the one report built to expose that lie.
//
// NO ANCHOR, NO CLAIM: an unparseable started_at returns null (say nothing) rather
// than defaulting to epoch and reporting every drift the machine has ever seen as
// "this session" — the failure mode that would be loudest and most wrong.
// ---------------------------------------------------------------------------
function teachingDrifts(tc, started_at) {
  const t0 = Date.parse(started_at || "");
  if (!tc || !Array.isArray(tc.rules) || !Number.isFinite(t0)) return null;
  const ids = tc.rules
    .filter((r) => r && typeof r.id === "string" && r.id)
    .filter((r) => { const h = Date.parse(r.last_hit || ""); return Number.isFinite(h) && h >= t0; })
    .map((r) => r.id)
    .sort();                       // sorted so the report never moves when the ranking does
  // THE INSTRUMENT, MEASURED (audit #40 — see the block above teachingDriftLine).
  // These ride into forge_sessions.jsonl too, so a `"rules_drifted":0` row on disk is
  // never readable as a measured zero either.
  let everHit = 0, newest = null;
  for (const r of tc.rules) {
    const h = Date.parse((r && r.last_hit) || "");
    if (Number.isFinite(h)) { everHit++; if (newest === null || h > newest) newest = h; }
  }
  // FORWARD PATH, named so this guard can retire itself: if a real drift recorder is
  // ever wired (a `hit` obligation in /forge and /learn, or a nightly transcript pass),
  // it should stamp `checked_at` (ISO) into teaching_contract.json on EVERY run — a
  // heartbeat that says "I looked", which is the one fact that turns a zero into a
  // measurement. When that stamp lands at or after started_at, the line below may
  // honestly say "none" again. Until then it must not.
  const checked = Date.parse((tc.checked_at) || "");
  return {
    since: started_at,
    rule_ids: ids,
    rules_drifted: ids.length,
    rules_total: tc.rules.length,
    rules_hit_ever: everHit,
    newest_hit: newest === null ? null : new Date(newest).toISOString(),
    checked_at: Number.isFinite(checked) ? tc.checked_at : null,
    recorder_ran_in_window: Number.isFinite(checked) && checked >= t0,
  };
}

// THE OTHER TWO LANES + COVERAGE (7 Aug 2026, self-sustaining repair). The drift
// line below reads only HIS lane (confirmed `hits`). Under the 6 Aug two-lane
// ruling two more facts now exist at close time, and a close that cannot see them
// can mint a clean sheet by lane-blindness — the exact lie teachingDriftLine's own
// header condemns, upgraded to affirmative once checked_at started landing:
//   · the AUTO lane — rules whose last_auto_hit landed inside this session's window
//     (code-measured, auto-counted, reversible; evidence in teaching_audit.jsonl);
//   · the STAGED queue — self-reports filed in-window still awaiting his word;
//   · COVERAGE — which contract rules the audit has NO check for, read from the
//     checked_rules stamp teaching_audit.mjs writes into teaching_audit_last.json
//     every turn. DERIVED both sides, typed nowhere, so it cannot rot on the next
//     `add` (the exact hardcode-rot CLAUDE.md documents three times).
// Pure; every failure path returns [] and the close report prints exactly what it
// printed before this function existed — a neighbour organ going bad must never
// cost him his coverage report.
function auditLaneLines(tc, started_at, auditLast) {
  const L = [];
  try {
    const t0 = Date.parse(started_at || "");
    if (tc && Array.isArray(tc.rules) && Number.isFinite(t0)) {
      const auto = tc.rules
        .filter((r) => { const h = Date.parse((r && r.last_auto_hit) || ""); return Number.isFinite(h) && h >= t0; })
        .map((r) => r.id).sort();
      if (auto.length) {
        L.push(`AUTO-COUNTED THIS SESSION (code-measured, nobody asked — his 6 Aug ruling): ${auto.length} rule${auto.length === 1 ? "" : "s"} · ${auto.join(" · ")}`
          + ` — evidence rows in teaching_audit.jsonl; revert: \`teaching_contract.mjs unhit-auto <id>\``);
      }
      const staged = (Array.isArray(tc.staged) ? tc.staged : [])
        .filter((x) => { const h = Date.parse((x && x.at) || ""); return Number.isFinite(h) && h >= t0; });
      if (staged.length) {
        L.push(`SELF-REPORTED, STILL STAGED: ${staged.length} filed this session, awaiting his word — \`teaching_contract.mjs staged\` shows the evidence; a close does not clear them`);
      }
      const checked = auditLast && Array.isArray(auditLast.checked_rules) ? auditLast.checked_rules : null;
      if (checked) {
        const unchecked = tc.rules.map((r) => r.id).filter((id) => !checked.includes(id));
        if (unchecked.length) {
          L.push(`COVERAGE: the audit has NO check for ${unchecked.length} of ${tc.rules.length} rules (${unchecked.join(" · ")}) — "no drift caught" is NOT "taught correctly"`);
        }
      }
    }
  } catch { /* lane lines are a courtesy, never a blocker */ }
  return L;
}

// FROZEN VERBATIM (1 Aug semantics — layering law, CLAUDE.md). This is what shipped
// and what the audit caught: with rule_ids empty it says "none", full stop. Kept so
// the finding stays reproducible from inside this file, and pinned by the selftest.
// NOT on any live path.
function teachingDriftLineLegacy(d) {
  if (!d) return null;
  if (!d.rule_ids.length) return "TEACHING DRIFTS THIS SESSION: none";
  return `TEACHING DRIFTS THIS SESSION: ${d.rules_drifted} rule${d.rules_drifted === 1 ? "" : "s"} since session start`
    + ` · ${d.rule_ids.join(" · ")}`
    + ` (rule ids only — teaching_contract hits are CUMULATIVE, so how many times each drifted tonight is not knowable)`;
}

// ---------------------------------------------------------------------------
// THE HONESTY GUARD ON ZERO (audit #40, 2 Aug 2026).
//
// WHAT WAS WRONG: nothing in this machine writes a teaching-drift `hit`. A repo-wide
// grep for `teaching_contract.mjs (hit|add)` returns ZERO callers — no hook, no brain
// job, no skill, no scheduled task. All five `last_hit` stamps in the live file are a
// 402-millisecond scripted seeding burst on 31 Jul (born 18:21:03.887Z, hits at
// .993 / :04.109 / :04.191 / :04.289 / :04.395). So `last_hit` can never advance, and
// from the currently-open session onward the legacy line above prints
// "TEACHING DRIFTS THIS SESSION: none" at every close, forever, however badly the
// teaching drifts. The live proof is already on disk: the last row of
// forge_sessions.jsonl (closed 2026-08-02T09:00:19.555Z) carries
// "teaching_drifts":{"rule_ids":[],"rules_drifted":0} — a false clean sheet, already
// written down.
//
// WHY THAT IS THE WORST PLACE FOR IT: an UNMEASURED SILENCE rendered as a MEASURED
// ZERO, inside the one report built specifically to refuse that class of lie — its own
// comment above calls printing an unknowable number "the same class of lie as marking
// an axis done without its own jirah".
//
// WHAT IS AND IS NOT BROKEN: the ranking in teaching_contract.mjs IS computed live
// from state — the code is not a static list, and every rule still rotates into the
// block. It is the DATA that is frozen, and this line says exactly that rather than
// implying the organ is dead.
//
// WHO MAY RECORD A DRIFT IS THE CAPTAIN'S CALL, not this file's — it is reported to
// him, not invented here. Until he makes it, zero says "not measured".
// ---------------------------------------------------------------------------
function teachingDriftLine(d) {
  if (!d) return null;
  if (d.rule_ids.length) {
    return `TEACHING DRIFTS THIS SESSION: ${d.rules_drifted} rule${d.rules_drifted === 1 ? "" : "s"} since session start`
      + ` · ${d.rule_ids.join(" · ")}`
      + ` (rule ids only — teaching_contract hits are CUMULATIVE, so how many times each drifted tonight is not knowable)`;
  }
  if (d.recorder_ran_in_window) {
    // A recorder looked and found nothing. THAT is a measured zero, and it may say so.
    return `TEACHING DRIFTS THIS SESSION: none — MEASURED (the drift recorder stamped checked_at ${d.checked_at}, inside this session)`;
  }
  const last = d.newest_hit ? d.newest_hit.slice(0, 10) : "never";
  return `TEACHING DRIFTS THIS SESSION: NOT MEASURED — 0 recorded, and 0 here is not a measurement.`
    + ` A drift is only ever written by a human running \`node scripts/teaching_contract.mjs hit <id>\`, and NOTHING in the machine calls it;`
    + ` newest stamp ${last} (${d.rules_hit_ever}/${d.rules_total} rules ever hit, none since this session started).`
    + ` The drift-RANKING is computed live from those hits, so it is the DATA that is frozen, not the code.`
    + ` Read this as an unmeasured silence, not a clean sheet — and decide who is allowed to record a drift.`;
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

// The one cross-organ read this file has ever made, and it is one-way. Anything at
// all wrong with the file — absent, truncated, an array, rules missing — is null, and
// null means the close report stays exactly as it was before today. A neighbour organ
// going bad must never cost the captain his coverage report.
function loadTeaching(path = TEACHING) {
  try {
    if (!existsSync(path)) return null;
    const j = JSON.parse(readFileSync(path, "utf8"));
    return (j && typeof j === "object" && !Array.isArray(j) && Array.isArray(j.rules)) ? j : null;
  } catch { return null; }
}

// Same one-way, anything-wrong-is-null read as loadTeaching, for the audit's
// last-run stamp (checked_rules feeds the close report's coverage line).
function loadAuditLast(path = AUDIT_LAST) {
  try {
    if (!existsSync(path)) return null;
    const j = JSON.parse(readFileSync(path, "utf8"));
    return (j && typeof j === "object" && !Array.isArray(j)) ? j : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// DID A SINGLE REP ACTUALLY LAND? (audit #108, 6 Aug 2026)
//
// WHAT WAS WRONG: the close report graded the SESSION (steps · axes · gates · the two
// clocks) and the TEACHER (drifts), and never once asked whether the one durable thing
// a study session is supposed to leave behind — a rep — reached disk. So a session could
// close reading clean and bank NOTHING, and the report was silent about the only loss
// that is total.
//
// THE EVIDENCE, ON DISK TODAY: reps_log.jsonl holds NINE rows, newest
// 2026-07-31T17:48:00.000Z. forge_sessions.jsonl holds FOUR sessions on `hallucinations`,
// two of which BOTH opened and closed after that stamp (2026-07-31T22:55 → 2026-08-02T09:00
// and 2026-08-02T09:04 → 2026-08-04T16:24). Every rep of those two sessions is simply gone,
// and both close reports printed their coverage without a word about it. That is the same
// class of lie this file already refuses elsewhere — an unmeasured silence read as a clean
// sheet — sitting in the one report built to expose it.
//
// WHAT IT CLAIMS AND WHAT IT CANNOT: it counts ROWS whose `ts` is at or after started_at.
// It cannot know whether a row belongs to this concept, this session or this human —
// capture.mjs owns that file and this is a one-way read. A count is evidence that
// something was banked; it is NEVER a grade, and the line says so out loud.
// NO ANCHOR, NO CLAIM: an unparseable started_at returns null and the report says nothing,
// rather than defaulting to epoch and reporting every rep ever written as "this session" —
// the same rule teachingDrifts() follows, for the same reason.
// DEFENSIVE BY DESIGN: an absent file is a MEASURED zero (nothing has ever been banked),
// a half-written JSONL line is skipped and counted, and any read failure is null — a
// neighbour organ going bad must never cost the captain his coverage report.
// ---------------------------------------------------------------------------
function repsBanked(started_at, path = REPS) {
  const t0 = Date.parse(started_at || "");
  if (!Number.isFinite(t0)) return null;
  try {
    if (!existsSync(path)) return { since: started_at, present: false, reps: 0, total: 0, malformed: 0, undated: 0, newest: null };
    let reps = 0, total = 0, malformed = 0, undated = 0, newest = null;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      let o = null;
      try { o = JSON.parse(line); } catch { malformed++; continue; }
      if (!o || typeof o !== "object" || Array.isArray(o)) { malformed++; continue; }
      total++;
      const t = Date.parse(o.ts || "");
      if (!Number.isFinite(t)) { undated++; continue; }   // a rep with no clock cannot be attributed to a window
      if (newest === null || t > newest) newest = t;
      if (t >= t0) reps++;
    }
    return { since: started_at, present: true, reps, total, malformed, undated,
             newest: newest === null ? null : new Date(newest).toISOString() };
  } catch { return null; }
}

// ONE line, LOUD on zero. The bad-news voice here is the one already established by
// teachingDriftLine's NOT-MEASURED branch: name the number, name the evidence behind it,
// name the command that fixes it. Zero is the whole reason this line exists, so zero is
// the branch that shouts; a healthy count still prints, unconditionally, for the same
// reason the two clocks do — a report that only speaks when it has bad news makes
// "have no bad news" the cheapest move for a tired session.
function repsBankedLine(r) {
  if (!r) return null;
  const junk = (r.malformed || r.undated)
    ? ` (${r.malformed} unparseable line${r.malformed === 1 ? "" : "s"} + ${r.undated} undated row${r.undated === 1 ? "" : "s"} skipped)` : "";
  if (r.reps > 0) {
    return `REPS BANKED SINCE SESSION START: ${r.reps} of ${r.total} rows in reps_log.jsonl${junk}`
      + ` — a COUNT, not a grade: capture.mjs owns that file and this read cannot tell whose rep it is.`;
  }
  return `⛔ REPS BANKED SINCE SESSION START: ZERO — `
    + (r.present
        ? `reps_log.jsonl holds ${r.total} row${r.total === 1 ? "" : "s"}, newest ${r.newest ? r.newest.slice(0, 10) : "undated"}, and NOT ONE lands at or after ${r.since}.`
        : `reps_log.jsonl does not exist — nothing has ever been banked.`)
    + `${junk} This session is closing with no durable trace: every gut-word he said out loud tonight dies with this terminal.`
    + ` Bank them NOW, one per rep — \`node scripts/capture.mjs rep …\` (same validator as \`paste\`) — before anything else.`;
}

// ---------------------------------------------------------------------------
// JIRAH HAS NEVER RUN — NOT ONCE, IN THIS MACHINE'S WHOLE HISTORY (audit #108, 6 Aug 2026).
//
// EVIDENCE: all four rows in forge_sessions.jsonl carry "question_moments":{"jirah":0},
// and the first of them also carries "axes_done":["a","b","c","e","f"] — five axes declared
// done on a concept that has never been cross-examined once. coverage() ALREADY HELD that
// fact (that same row names axes_ungraded abcef), and the close report printed the
// CONSEQUENCE while never naming the CAUSE: step 9 was skipped in every session on record.
// A reader sees "axes marked done without their OWN jirah" and hears a grading-hygiene nit;
// the true reading is that the grading step itself has never happened at all.
//
// HIS FRAMING, 31 Jul, verbatim in spirit: a "done" axis without a Jirah is a CLAIM, not a
// grade. It is printed in his words because that sentence is what makes the line land.
// SILENT the moment one jirah runs, so it can never become the always-fires warning that
// trains him to ignore it (the audit's #38 failure mode).
// A MISSING counter is not a measured zero: if question_moments has no `jirah` at all we
// say nothing, rather than reporting an absence as a finding.
//
// REVIEW CORRECTION, same day (audit #108 review, 6 Aug 2026) — SCOPE.
// The line as first written said `NEVER RAN — … so NO axis on <concept> has been GRADED`.
// That sentence is a claim about the concept's WHOLE HISTORY, but the only number behind
// it is `cov.question_moments.jirah`, which coverage() computes from THIS session's
// counters alone — `close` never opens forge_sessions.jsonl (only `boot` does). Today the
// two readings coincide, because all four rows on disk carry jirah:0; the first session
// that does run a Jirah makes the wider claim false while the counter still reads 0 on the
// next one, and this file's whole argument is that an unmeasured silence must never be
// printed as a measured fact. So the wording now says exactly what was measured — this
// session — and nothing more. Making it history-wide is a real option, but it means
// reading the history file at close, which is a different organ's worth of behaviour.
// The volume, the ⛔, and his CLAIM-not-a-grade sentence are untouched.
// ---------------------------------------------------------------------------
function jirahNeverRanLine(cov) {
  if (!cov || !cov.question_moments) return null;
  const j = cov.question_moments.jirah;
  if (!Number.isFinite(j) || j > 0) return null;
  const done = Array.isArray(cov.axes_done) ? cov.axes_done : [];
  return `⛔ JIRAH (step 9) NEVER RAN IN THIS SESSION — 0 jirah moments, so NO axis on ${cov.concept} was GRADED tonight`
    + (done.length ? `, including the ${done.length} marked done (${done.join("")})` : "")
    + `. A "done" axis without a Jirah is a CLAIM, not a grade.`;
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
const oneLine = (s) => `forge_session: ${s.concept} · STEP ${s.step}/${STEPS.length - 1} ${STEPS[s.step]}${s.current_axis ? ` · ON axis ${s.current_axis}` : ""} · axes done ${s.axes_done.join("") || "—"} · check-Q this pass ${s.check_q_this_pass || 0}`
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
// FROZEN VERBATIM (31 Jul semantics — layering law, CLAUDE.md). This is the engine
// the audit caught at #30: the open-session branch RETURNS, so the `if (h.last)`
// history branch below it is unreachable while any session is open — and because a
// stale session stays open indefinitely, that suppression is permanent, not
// transient. Kept so the finding stays reproducible from inside this file, and pinned
// by the selftest. NOT on any live path.
function bootLinesLegacy(s, hist, now = new Date()) {
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

// THE SWALLOWED FACT, GIVEN AN ADDRESS (audit #30, 2 Aug 2026).
// The last recorded session's verdict is the most decision-relevant thing at kickoff
// and it reached NO boot line: the open-session branch returned before the history
// branch, and the history branch never read the verdict fields anyway (it printed
// steps/axes/elapsed/ended_by only, never method_clean or core_missing — both of which
// are sitting in every forge_sessions.jsonl row).
//
// THE CAP IS NOT THE ENEMY AND IS NOT TOUCHED. `:811` asserts BOOT IS BOUNDED — never
// more than 2 lines in any branch — and the HARD CAP comment above says the same. So
// this is a SUFFIX on line 1, not a third line: the fact is surfaced, the anti-wall
// law is intact, and the selftest that guards it still guards it.
// It names its own concept, so "2 recorded runs of that concept" can never be misread
// as being about the session currently open when the two differ.
function historyDigest(h) {
  const L = h && h.last;
  if (!L || !L.concept) return "";
  const day = String(L.ended_at || "").slice(0, 10) || "date unknown";
  const bits = [`steps ${(L.steps_ran || []).length}/${STEPS.length}`,
                `axes ${(L.axes_done || []).length}/${AXES.length}`];          // have/need, never a bare word
  if (typeof L.method_clean === "boolean") bits.push(`method_clean ${L.method_clean}`);
  if (Array.isArray(L.core_missing) && L.core_missing.length) bits.push(`CORE ${L.core_missing.join("")} never closed`);
  if (h.same_concept > 1) bits.push(`${h.same_concept} recorded runs of that concept`);
  return ` ‖ LAST RECORDED ${day} · ${L.concept} · ${bits.join(" · ")}`;
}

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
        + ` · axes done ${s.axes_done.join("") || "—"} ${s.axes_done.length}/${AXES.length} · ungraded ${ungraded.join("") || "—"}`
        + ` · deferred ${s.axes_deferred.join("") || "—"} · left ${left.join("") || "—"} · ${when}`
        + historyDigest(h),                      // #30 — no longer swallowed, and still ONE line
      stale
        ? "Do NOT re-teach those axes and do NOT start this concept from step 0. Run `node scripts/forge_session.mjs close` FIRST (that is the only thing that saves the coverage report), then `start <concept>`."
        : `Resume it — do NOT re-teach those axes and do NOT run \`start\` again (it will refuse). Continue at STEP ${s.step}.`,
    ];
  }
  if (h.last) {
    const L = h.last;
    const day = String(L.ended_at || "").slice(0, 10) || "date unknown";
    return [`LAST FORGE SESSION · ${L.concept} · ${day} · steps ${(L.steps_ran || []).length}/${STEPS.length}`
      + ` · axes done ${(L.axes_done || []).join("") || "—"} ${(L.axes_done || []).length}/${AXES.length}`
      + ` · ungraded ${(L.axes_ungraded || []).join("") || "—"}`
      + ` · elapsed ${L.elapsed_min === null || L.elapsed_min === undefined ? "?" : L.elapsed_min}m · ${L.ended_by || "?"}`
      // THE VERDICT, which this branch never carried either (audit #30, verifier's
      // correction 1): method_clean and core_missing sit in every row on disk and were
      // read by nothing. They are the reason a "last session" line is worth printing.
      + (typeof L.method_clean === "boolean" ? ` · method_clean ${L.method_clean}` : "")
      + (Array.isArray(L.core_missing) && L.core_missing.length ? ` · CORE ${L.core_missing.join("")} never closed` : "")
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

  // ── THE SILENCE GAP (4 Aug 2026) — the nudge that closes it ────────────────
  // Measured before this fix: `contract` printed ZERO bytes for a whole session
  // while sprint.json's current task was a concept mid-flight. The 12-step block
  // staying silent is correct; the METHOD reaching the turn NOT AT ALL is not.
  assert("SILENCE GAP — a concept in the sprint with NO open session gets ONE nudge line",
    /forge_session\.mjs start/.test(nudgeLine({ sprint: { progress: { current: { task: "Hallucinations", track: "concept" } } } })));
  assert("SILENCE GAP — the nudge names the CONCEPT, so it is never a generic nag",
    /Hallucinations/.test(nudgeLine({ sprint: { progress: { current: { task: "Hallucinations", track: "concept" } } } })));
  assert("SILENCE GAP — it names WHAT IS LOST, not just what to run",
    /META-FREEZE/.test(nudgeLine({ sprint: { progress: { current: { task: "X", track: "concept" } } } })));
  assert("SILENCE GAP — a NON-concept track stays SILENT (never the always-fires warning, audit #38)",
    nudgeLine({ sprint: { progress: { current: { task: "Python basics", track: "skill" } } } }) === ""
    && nudgeLine({ sprint: { progress: { current: { task: "API", track: "course" } } } }) === ""
    && nudgeLine({ sprint: { progress: { current: { task: "resume", track: "career" } } } }) === "");
  assert("SILENCE GAP — it is ONE line, so it can never become a wall",
    nudgeLine({ sprint: { progress: { current: { task: "X", track: "concept" } } } }).split("\n").length === 1);
  assert("SILENCE GAP — a missing/junk sprint degrades to silence, never to a thrown hook",
    nudgeLine({ sprint: null }) === "" && nudgeLine({ sprint: {} }) === "");
  assert("SILENCE GAP — an OPEN session suppresses the nudge (the block speaks instead)",
    contractLines(s4, T0).length > 0);
  assert("step 7 contract demands voice-first Bolo",
    contractLines(setStep(s4, 7, T0).session, T0).some((l) => /voice-first/.test(l)));

  const ax = markAxis(s4, "A", "done", T0).session;
  assert("axis marking is case-insensitive", ax.axes_done.join() === "a");
  const ax2 = markAxis(ax, "a", "defer", T0).session;
  assert("re-marking an axis MOVES it, never duplicates", ax2.axes_done.length === 0 && ax2.axes_deferred.join() === "a");
  assert("axis rejects a letter past i", !markAxis(ax, "z", "done").ok);
  assert("axis rejects an unknown disposition", !markAxis(ax, "b", "maybe").ok);

  // P4.1 (7 Aug 2026) — the current-axis declaration, and the trap's pure-side contract
  assert("axis NOW declares without completing anything",
    (() => { const r = setCurrentAxis(s4, "B", T0); return r.ok && r.session.current_axis === "b" && r.session.axes_done.length === s4.axes_done.length && r.session.axes_deferred.length === s4.axes_deferred.length; })());
  assert("axis NOW rejects a letter past i", !setCurrentAxis(s4, "z").ok);
  assert("marking the CURRENT axis done|defer clears the declaration",
    (() => { const c = setCurrentAxis(s4, "b", T0).session; return markAxis(c, "b", "done", T0).session.current_axis === null && markAxis(c, "b", "defer", T0).session.current_axis === null; })());
  assert("marking a DIFFERENT axis leaves the declaration standing",
    (() => { const c = setCurrentAxis(s4, "b", T0).session; return markAxis(c, "c", "done", T0).session.current_axis === "b"; })());
  assert("the contract block names the ON axis while it is undecided, and drops it once marked",
    (() => { const c = setCurrentAxis(s4, "b", T0).session;
      return contractLines(c, T0).some((l) => /ON b ·/.test(l))
        && !contractLines(markAxis(c, "b", "done", T0).session, T0).some((l) => /ON b ·/.test(l)); })());

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

  // ---- DELIVERABLE 2 (7 Aug 2026) — the dossier reaches the TEACHING side ----
  {
    const dz = {
      rounds: [
        { id: "fundamentals", label: "F", minutes: 40, weight: 0.178 },
        { id: "system_design", label: "S", minutes: 60, weight: 0.267 },
      ],
      bucket_round_map: { "1-fundamentals": ["fundamentals", "system_design"], skills: ["system_design"] },
      probe_types: { recall: { axis_types: ["a", "c", "d"] }, defend: { axis_types: ["e"] } },
    };
    const rz = { concepts: { hallu: { bucket: "1-fundamentals" } }, skills: { gitx: true } };
    const sz = { ...blank("hallu", T0), axes_done: ["a"], axes_deferred: ["e"] };
    const out = dossierLines("hallu", sz, { dossier: dz, registry: rz });
    assert("DOSSIER LINE — bucket + per-round weights + the bucket total, all straight from the injected file",
      out.length === 2 && /1-fundamentals → fundamentals 17\.8% · system_design 26\.7%/.test(out[0]) && /44\.5%/.test(out[0]));
    assert("DOSSIER LINE — probe map covers ONLY axes still left (done 'a' and deferred 'e' excluded; 'c' and 'd' present)",
      /c←recall/.test(out[1]) && /d←recall/.test(out[1]) && !/a←/.test(out[1]) && !/e←/.test(out[1]));
    assert("DOSSIER LINE — a skills entry falls back to the 'skills' bucket (setpiece.mjs:419's own law, mirrored)",
      /skills → system_design/.test((dossierLines("gitx", sz, { dossier: dz, registry: rz })[0]) || ""));
    assert("DOSSIER LINE — fail-silent: no dossier, no registry, unknown concept, or corrupt rounds each yield [] and never throw",
      dossierLines("hallu", sz, { registry: rz }).length === 0
      && dossierLines("hallu", sz, { dossier: dz }).length === 0
      && dossierLines("nope", sz, { dossier: dz, registry: rz }).length === 0
      && dossierLines("hallu", sz, { dossier: { rounds: "x" }, registry: rz }).length === 0);
  }
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
  // ---- audit #30 — the open-session branch used to swallow the history entirely.
  // Every pre-existing fixture above pairs an OPEN session with {last:null} and
  // non-null history only with a CLOSED session, so the open-beats-history
  // precedence was never asserted anywhere — it was incidental, not designed.
  // These are the assertions that were missing.
  const HH = lastHistory(hp);
  const bStaleHist = bootLines(staleSession, HH, new Date(T0.getTime() + 19 * 3600000));
  assert("BOOT NO LONGER SWALLOWS THE LAST SESSION — an OPEN session now surfaces the last recorded verdict TOO",
    bStaleHist.length === 2 && /FORGE SESSION OPEN ON DISK/.test(bStaleHist[0])
    && /LAST RECORDED/.test(bStaleHist[0]) && /method_clean false/.test(bStaleHist[0])
    && /CORE d never closed/.test(bStaleHist[0]) && /2 recorded runs of that concept/.test(bStaleHist[0]));
  assert("…INSIDE THE SAME TWO LINES — the surfaced fact is a suffix on line 1, so the selftested cap is untouched",
    bStaleHist.length === bStale.length && bStale.length === 2
    && bootLines(staleSession, HH, T(30)).length === 2);
  assert("REGRESSION PIN — the FROZEN engine really did drop it: same inputs, no LAST RECORDED anywhere",
    !bootLinesLegacy(staleSession, HH, new Date(T0.getTime() + 19 * 3600000)).join(" ").includes("LAST RECORDED")
    && !bootLinesLegacy(staleSession, HH, new Date(T0.getTime() + 19 * 3600000)).join(" ").includes("method_clean"));
  assert("the digest is SILENT with no history, so a first-ever session is not given a phantom last one",
    historyDigest({ last: null, same_concept: 0 }) === "" && historyDigest(null) === ""
    && !bStale[0].includes("LAST RECORDED"));
  assert("the digest NAMES ITS OWN CONCEPT, so a run count can never be misread as being about the open session",
    /LAST RECORDED [\d-]+ · hallucinations/.test(historyDigest(HH)));
  assert("HAVE/NEED — the boot lines count axes as done/total, never a bare letter list",
    /axes done abcef 5\/9/.test(bStale[0]) && /axes done abcef 5\/9/.test(bHist[0]));
  assert("THE VERDICT REACHES THE HISTORY BRANCH TOO — method_clean and core_missing were in every row and read by nothing",
    /method_clean false/.test(bHist[0]) && /CORE d never closed/.test(bHist[0]));

  assert("BOOT IS BOUNDED — never more than 2 lines in any branch, and never writes",
    Math.max(bStale.length, bFresh.length, bHist.length, bStaleHist.length) <= 2
    && !existsSync(join(tmpdir(), "forge_boot_wrote_something")));
  rmSync(hp, { force: true });

  // =========================================================================
  // 1 Aug 2026 — THE TEACHER'S OWN DRIFTS AT CLOSE (W3)
  // Fixture only; the live teaching_contract.json is never read by the selftest.
  // =========================================================================
  const TC = { version: 1, rules: [
    { id: "his-word",    hits: 5, last_hit: nowISO(T(10)),  born: nowISO(T0) },   // hit DURING the session
    { id: "terminology", hits: 1, last_hit: nowISO(T(-90)), born: nowISO(T0) },   // hit BEFORE it started
    { id: "hinglish",    hits: 0, last_hit: null,           born: nowISO(T0) },   // never hit
    { id: "link-back",   hits: 2, last_hit: nowISO(T0),     born: nowISO(T0) },   // hit exactly AT started_at
    { id: 7,             hits: 9, last_hit: nowISO(T(10)) },                      // malformed id, dropped
  ] };
  const dr = teachingDrifts(TC, nowISO(T0));
  assert("DRIFT ATTRIBUTION — only last_hit >= started_at counts; earlier hits, null and junk ids never do",
    dr.rule_ids.join() === "his-word,link-back" && dr.rules_drifted === 2 && dr.since === nowISO(T0));
  assert("NO FABRICATED PRECISION — the line names rule IDS and never a per-rule count (hits are cumulative)",
    /^TEACHING DRIFTS THIS SESSION: 2 rules since session start · his-word · link-back/.test(teachingDriftLine(dr))
    && !/[x×]\s*\d/.test(teachingDriftLine(dr)) && /CUMULATIVE/.test(teachingDriftLine(dr))
    && teachingDriftLine(dr).split("\n").length === 1);
  assert("ZERO IS SAID OUT LOUD — a drift-free session still prints a line, never silence",
    typeof teachingDriftLine(teachingDrifts({ rules: [{ id: "a", hits: 3, last_hit: nowISO(T(-90)) }] }, nowISO(T0))) === "string");
  assert("NO ANCHOR, NO CLAIM — an unparseable/absent started_at attributes nothing and prints NOTHING",
    teachingDrifts(TC, "nonsense") === null && teachingDrifts(TC, undefined) === null
    && teachingDriftLine(null) === null && teachingDriftLine(teachingDrifts(null, nowISO(T0))) === null);

  // ---- audit #40 — the honesty guard on zero.
  const quiet = teachingDrifts({ rules: [{ id: "a", hits: 3, last_hit: nowISO(T(-90)) }, { id: "b", hits: 0, last_hit: null }] }, nowISO(T0));
  const quietLine = teachingDriftLine(quiet);
  assert("REGRESSION PIN — the FROZEN engine really did render an unmeasured silence as the measured word 'none'",
    teachingDriftLineLegacy(quiet) === "TEACHING DRIFTS THIS SESSION: none");
  assert("AN UNMEASURED ZERO SAYS SO — 'NOT MEASURED', never 'none', and it names WHY",
    /NOT MEASURED/.test(quietLine) && !/^TEACHING DRIFTS THIS SESSION: none/.test(quietLine)
    && /teaching_contract\.mjs hit <id>/.test(quietLine) && /NOTHING in the machine calls it/.test(quietLine));
  assert("…and it carries the MEASURED instrument facts: newest stamp date + a have/need over the rules",
    quietLine.includes(nowISO(T(-90)).slice(0, 10)) && /1\/2 rules ever hit/.test(quietLine)
    && quiet.rules_total === 2 && quiet.rules_hit_ever === 1 && quiet.newest_hit === nowISO(T(-90)));
  assert("…and it is ACCURATE about what is frozen: the DATA, not the code (the ranking is computed live)",
    /DATA that is frozen, not the code/.test(quietLine));
  assert("NEVER HIT AT ALL reads as 'never', not as a date and not as a zero-that-looks-measured",
    /newest stamp never/.test(teachingDriftLine(teachingDrifts({ rules: [{ id: "a", hits: 0, last_hit: null }] }, nowISO(T0))))
    && teachingDrifts({ rules: [{ id: "a", hits: 0, last_hit: null }] }, nowISO(T0)).newest_hit === null);
  assert("THE GUARD CAN RETIRE ITSELF — a recorder that stamps checked_at INSIDE the window earns the word 'none' back",
    /^TEACHING DRIFTS THIS SESSION: none — MEASURED/.test(
      teachingDriftLine(teachingDrifts({ checked_at: nowISO(T(10)), rules: [{ id: "a", hits: 3, last_hit: nowISO(T(-90)) }] }, nowISO(T0))))
    && /NOT MEASURED/.test(
      teachingDriftLine(teachingDrifts({ checked_at: nowISO(T(-10)), rules: [{ id: "a", hits: 3, last_hit: nowISO(T(-90)) }] }, nowISO(T0)))));
  assert("A REAL DRIFT IS UNAFFECTED — the measured branch is byte-identical to the frozen engine's",
    teachingDriftLine(dr) === teachingDriftLineLegacy(dr));
  // ---- 7 Aug 2026 — the other two lanes + coverage (auditLaneLines). Each can fail.
  {
    const tcLanes = {
      rules: [
        { id: "hinglish", hits: 0, last_hit: null, auto_hits: 2, last_auto_hit: nowISO(T(10)) },
        { id: "his-word", hits: 1, last_hit: nowISO(T(-90)), auto_hits: 0 },
        { id: "unchecked-rule", hits: 0, last_hit: null },
      ],
      staged: [{ id: "his-word", why: "x", at: nowISO(T(20)) }, { id: "his-word", why: "old", at: nowISO(T(-90)) }],
    };
    const lastStamp = { checked_rules: ["hinglish", "his-word"] };
    const L = auditLaneLines(tcLanes, nowISO(T0), lastStamp);
    assert("AUTO LANE AT CLOSE — an in-window last_auto_hit is named, with the revert command (a clean sheet can no longer be minted by lane-blindness)",
      L.some((l) => /AUTO-COUNTED THIS SESSION.*hinglish/.test(l) && /unhit-auto/.test(l)));
    assert("STAGED AT CLOSE — only IN-WINDOW self-reports are counted (1, not 2), and the close does not clear them",
      L.some((l) => /SELF-REPORTED, STILL STAGED: 1 /.test(l)));
    assert("COVERAGE AT CLOSE — the unchecked rule is named, derived from the checked_rules stamp, typed nowhere",
      L.some((l) => /NO check for 1 of 3 rules \(unchecked-rule\)/.test(l)));
    assert("LANES ARE SILENT WHEN EMPTY — no auto, no staged, full coverage ⇒ zero lines (the close report is unchanged from before this function existed)",
      auditLaneLines({ rules: [{ id: "hinglish", hits: 0 }], staged: [] }, nowISO(T0), { checked_rules: ["hinglish"] }).length === 0);
    assert("LANES FAIL SAFE — null contract, garbage anchor, missing stamp all yield [] and never throw",
      auditLaneLines(null, nowISO(T0), null).length === 0
      && auditLaneLines(tcLanes, "nonsense", lastStamp).length === 0
      && auditLaneLines(tcLanes, nowISO(T0), null).length > 0);
  }
  assert("THE LINE IS STILL ONE LINE in every branch (the close report is not a wall)",
    [teachingDriftLine(dr), quietLine, teachingDriftLine(teachingDrifts({ checked_at: nowISO(T(10)), rules: [] }, nowISO(T0)))]
      .every((l) => typeof l === "string" && l.split("\n").length === 1));

  const tcProbe = join(tmpdir(), `forge_teaching_selftest_${process.pid}.json`);
  rmSync(tcProbe, { force: true });
  const tcMissing = loadTeaching(tcProbe) === null;
  writeFileSync(tcProbe, "{ this is not json");
  const tcBroken = loadTeaching(tcProbe) === null;
  writeFileSync(tcProbe, JSON.stringify([1, 2, 3]));
  const tcArray = loadTeaching(tcProbe) === null;
  writeFileSync(tcProbe, JSON.stringify({ version: 1 }));
  const tcNoRules = loadTeaching(tcProbe) === null;
  writeFileSync(tcProbe, JSON.stringify(TC));
  const tcBytes = readFileSync(tcProbe, "utf8");
  const tcGood = loadTeaching(tcProbe);
  assert("HOOK-SAFE — missing / truncated / array / rule-less teaching_contract.json all load as null, never throw",
    tcMissing && tcBroken && tcArray && tcNoRules && tcGood.rules.length === 5);
  assert("READ-ONLY — teaching_contract.mjs is that file's sole writer; a read leaves it byte-identical",
    readFileSync(tcProbe, "utf8") === tcBytes);
  rmSync(tcProbe, { force: true });

  const hp2 = join(tmpdir(), `forge_hist_drift_selftest_${process.pid}.jsonl`);
  rmSync(hp2, { force: true });
  appendCoverage(clean, "close", { teaching_drifts: dr }, hp2, T(30));
  const row2 = JSON.parse(readFileSync(hp2, "utf8").trim());
  assert("HISTORY KEEPS IT — the JSONL row carries teaching_drifts with the same ids, count and anchor",
    row2.teaching_drifts && row2.teaching_drifts.rule_ids.join() === "his-word,link-back"
    && row2.teaching_drifts.rules_drifted === 2 && row2.teaching_drifts.since === nowISO(T0)
    && row2.method_clean === true);
  rmSync(hp2, { force: true });

  // =========================================================================
  // 6 Aug 2026 — audit #108: DID ANY REP LAND · DID JIRAH EVER RUN
  // Every fixture below lives under tmpdir(); the live reps_log.jsonl is never read.
  // =========================================================================
  const rp = join(tmpdir(), `forge_reps_selftest_${process.pid}.jsonl`);
  rmSync(rp, { force: true });
  const rMissing = repsBanked(nowISO(T0), rp);
  assert("REPS — an ABSENT reps_log is a measured zero (present:false, reps:0), never a throw",
    rMissing && rMissing.present === false && rMissing.reps === 0 && rMissing.total === 0);
  assert("…and it says the file does not exist rather than implying rows were checked",
    /does not exist/.test(repsBankedLine(rMissing)) && /ZERO/.test(repsBankedLine(rMissing)));
  writeFileSync(rp, [
    JSON.stringify({ ts: nowISO(T(-90)), concept: "embeddings" }),      // banked BEFORE this session
    JSON.stringify({ ts: nowISO(T0), concept: "hallucinations" }),      // exactly AT started_at — counts
    JSON.stringify({ ts: nowISO(T(20)), concept: "hallucinations" }),   // during
    "{ this is not json",                                              // half-written line
    JSON.stringify({ concept: "no ts at all" }),                        // undated row
  ].join("\n") + "\n");
  const rBytes = readFileSync(rp, "utf8");
  const rb = repsBanked(nowISO(T0), rp);
  assert("REPS — counts only rows at or after started_at; an earlier rep is never borrowed",
    rb.reps === 2 && rb.total === 4 && rb.newest === nowISO(T(20)));
  assert("REPS — a half-written line and an undated row are SKIPPED and COUNTED, never fatal",
    rb.malformed === 1 && rb.undated === 1);
  assert("READ-ONLY — capture.mjs stays reps_log's sole writer; the read leaves it byte-identical",
    readFileSync(rp, "utf8") === rBytes);
  assert("NO ANCHOR, NO CLAIM — an unparseable/absent started_at counts nothing and prints nothing",
    repsBanked("nonsense", rp) === null && repsBanked(undefined, rp) === null && repsBankedLine(null) === null);
  const rZero = repsBanked(nowISO(T(600)), rp);
  const zeroLine = repsBankedLine(rZero);
  assert("THE 31 JUL → 4 AUG HOLE — a session whose whole window is after the newest rep reports ZERO",
    rZero.reps === 0 && rZero.total === 4 && /ZERO/.test(zeroLine));
  assert("ZERO IS LOUD — it names the newest stamp, the window, and the command that fixes it",
    zeroLine.includes(nowISO(T(20)).slice(0, 10)) && zeroLine.includes(nowISO(T(600)))
    && /capture\.mjs rep/.test(zeroLine) && /⛔/.test(zeroLine));
  assert("A BANKED SESSION still prints, and refuses to call the count a grade",
    /^REPS BANKED SINCE SESSION START: 2 of 4 rows/.test(repsBankedLine(rb))
    && /COUNT, not a grade/.test(repsBankedLine(rb)));
  assert("THE REPS LINE IS ONE LINE in every branch (the close report is not a wall)",
    [zeroLine, repsBankedLine(rb), repsBankedLine(rMissing)].every((l) => typeof l === "string" && l.split("\n").length === 1));
  rmSync(rp, { force: true });

  // ---- JIRAH: 0 in all four rows on disk, and the report never said so.
  const jLive = jirahNeverRanLine(coverage(legacy, T0));       // the live row-1 shape: abcef done, jirah 0
  assert("JIRAH NEVER RAN — the live-row shape prints the line, names the concept and the marks",
    /JIRAH \(step 9\) NEVER RAN/.test(jLive) && /hallucinations/.test(jLive) && /\(abcef\)/.test(jLive));
  assert("…in HIS framing — a 'done' axis without a Jirah is a CLAIM, not a grade",
    /A "done" axis without a Jirah is a CLAIM, not a grade\./.test(jLive) && jLive.split("\n").length === 1);
  assert("JIRAH — it speaks with NO axes marked too (three of the four live rows are exactly that)",
    /NEVER RAN/.test(jirahNeverRanLine(coverage(blank("hallucinations", T0), T0))));
  assert("JIRAH — SILENT the moment one actually runs (never the always-fires warning, audit #38)",
    jirahNeverRanLine(coverage(mAj, T0)) === null && jirahNeverRanLine(coverage(clean, T0)) === null);
  assert("JIRAH — a missing counter is NOT a measured zero, and junk input never throws",
    jirahNeverRanLine(null) === null && jirahNeverRanLine({}) === null
    && jirahNeverRanLine({ concept: "x", question_moments: {} }) === null);
  // Review correction (6 Aug 2026): the counter behind this line is THIS session's, and
  // `close` never opens the history file — so the sentence may not claim the concept's
  // whole past. Pinned here so the wider wording cannot come back unnoticed.
  assert("JIRAH — the claim is SCOPED to this session, never to the concept's whole history",
    /NEVER RAN IN THIS SESSION/.test(jLive) && /was GRADED tonight/.test(jLive)
    && !/has been GRADED/.test(jLive));

  // THE LOCK-CHAIN (outward loop, 8 Aug 2026) — pure pieces only; a selftest
  // never spawns another organ, so the spawn argv itself is what gets asserted.
  {
    const cmds = chainCommands("hallucinations");
    assert("lock-chain: exact spawn argv (mission stage-lock + benchmark run)",
      cmds.length === 2
      && /scout\.mjs$/.test(cmds[0].args[0]) && cmds[0].args.slice(1).join(" ") === "mission stage-lock hallucinations"
      && /benchmark\.mjs$/.test(cmds[1].args[0]) && cmds[1].args[1] === "run");
    const cm3 = { concepts: [
      { concept: "a1", locked_on: "2026-06-01", counts: { doubts: 20 } },
      { concept: "a2", locked_on: "2026-06-02", counts: { doubts: 25 } },
      { concept: "a3", locked_on: "2026-06-03", counts: { doubts: 10 } },
      { concept: "open1", locked_on: null, counts: { doubts: 99 } },
    ] };
    const gl = gateLines(cm3, []);
    assert("data-gates: decoy counts LOCKED capsules + their doubts; unlocked never counted",
      /decoy-drills — capsules 3\/4 · doubts 55\/60/.test(gl[0]) && /gate closed/.test(gl[0]));
    const cm4 = { concepts: [...cm3.concepts.filter((c) => c.locked_on), { concept: "a4", locked_on: "2026-06-04", counts: { doubts: 5 } }] };
    const rows = [
      { concept: "e", axis: "a", result: "cracked", cold: true },
      { concept: "e", axis: "b", result: "cracked", cold: true },
      { concept: "e", kind: "round-close" },
    ];
    const gl2 = gateLines(cm4, rows);
    assert("data-gates: decoy OPENS at 4 capsules + 60 doubts (his ruled counts, verbatim)",
      /gate OPEN · decoy-drills — capsules 4\/4 · doubts 60\/60/.test(gl2[0]));
    assert("data-gates: R1 opens on the FIRST round-close row (an event, never a date)",
      /gate OPEN · R1-constants — Re-Jirah rounds closed 1\/1/.test(gl2[1]));
    assert("data-gates: confusion-pairs counts cracked grades only (close rows invisible to it)",
      /confusion-pairs — cracked cold grades 2\/6/.test(gl2[2]) && /gate closed/.test(gl2[2]));
    assert("data-gates: bloodless world reports 0s, never crashes",
      gateLines(null, [])[0].includes("capsules 0/4"));
  }

  console.log(`\nforge_session selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// THE LOCK-CHAIN (outward loop, his Rulings 2+3+6 · 8 Aug 2026)
// ---------------------------------------------------------------------------
// At step 10 the outward checks ride the lock: stage the L-mission (harvest),
// re-run the benchmark, report the data-gates, name the widget + gist moves.
// Every lane is fail-silent and runs AFTER the step change is saved — no
// outward failure can touch the LOCK itself or block his study moment.
// The dossier/probe refresh is deliberately NOT automated here: it rides the
// L-mission's return → diff card → HIS word (canon never auto-edits).
function chainCommands(concept) {
  return [
    { name: "mission",   args: [join(__dirname, "scout.mjs"), "mission", "stage-lock", concept], timeout: 15000 },
    { name: "benchmark", args: [join(__dirname, "benchmark.mjs"), "run"], timeout: 20000 },
  ];
}

// THE DATA-GATES (Ruling 3 — COUNT/EVENT gates per his 1 Aug rule; the counts
// 4/60/6 are HIS ruled numbers, verbatim from the sealed rulings, not guesses).
// Report-only: a gate line never blocks anything.
function gateLines(capsuleMap, rejirahRows) {
  const caps = ((capsuleMap && capsuleMap.concepts) || []).filter((c) => c.locked_on);
  const doubts = caps.reduce((a, c) => a + ((c.counts && c.counts.doubts) || 0), 0);
  const rounds = (rejirahRows || []).filter((r) => r && r.kind === "round-close").length;
  const cracked = (rejirahRows || []).filter((r) => r && r.axis && !r.kind && r.result === "cracked").length;
  const g = (name, open, have) => `gate ${open ? "OPEN" : "closed"} · ${name} — ${have}`;
  return [
    g("decoy-drills", caps.length >= 4 && doubts >= 60, `capsules ${caps.length}/4 · doubts ${doubts}/60`),
    g("R1-constants", rounds >= 1, `Re-Jirah rounds closed ${rounds}/1`),
    g("confusion-pairs", cracked >= 6, `cracked cold grades ${cracked}/6`),
  ];
}

function lockChain(s, { dry = false } = {}) {
  const safeJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
  const safeJsonl = (p) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
  console.log(`\n== LOCK-CHAIN (outward, Ruling 2)${dry ? " — PREVIEW: spawns named, not fired" : ""} ==`);
  for (const cmd of chainCommands(s.concept)) {
    if (dry) { console.log(`  would run: node scripts/${cmd.args[0].replace(/^.*[\\/]/, "")} ${cmd.args.slice(1).join(" ")}`); continue; }
    try {
      const out = execFileSync(process.execPath, cmd.args, { encoding: "utf8", timeout: cmd.timeout });
      console.log(`  ${cmd.name}: ${out.trim().split("\n")[0] || "ran"}`);
    } catch (e) { console.log(`  ${cmd.name}: skipped (${String(e.message || e).slice(0, 70)}) — non-blocking`); }
  }
  for (const l of gateLines(safeJson(join(STATE_DIR, "capsule_map.json")), safeJsonl(join(STATE_DIR, "rejirah_log.jsonl")))) console.log(`  ${l}`);
  const w = safeJson(join(STATE_DIR, "widgets.json"));
  const reg = w && w.widgets && w.widgets[s.concept];
  console.log(reg
    ? `  widget: registered (${reg.gates_driven} gate(s) driven)${reg.gates_driven >= WIDGET_GATES_MIN ? "" : " — drive the gates (built ≠ driven)"}`
    : `  widget: NOT registered for ${s.concept} — node scripts/widget.mjs register ${s.concept} <file> --gates <n>`);
  console.log("  gist: capsule paste is HIS move (FORGE_SPEC §2 2b) — mirror.mjs fetches it back 06:55; till then the lock reads PENDING");
  console.log("  dossier: probe refresh rides the L-mission return → diff card → his word (canon never auto-edits)");
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
      // The discarded session's teaching drifts ride along too: a --force row is a
      // session ending WITHOUT a close report, so this row is the only trace it leaves.
      const d = teachingDrifts(loadTeaching(), prev.started_at);
      appendCoverage(prev, "force", {
        ...(prev.concept === String(concept).trim().toLowerCase() ? { continues: prev.started_at || null } : {}),
        ...(d ? { teaching_drifts: d } : {}),
      });
    }
    const s = blank(concept);
    save(s);
    console.log(oneLine(s));
    // TOPIC-OPEN SCOUTING (Ruling 6 layer 2, 8 Aug 2026): stage the T-mission
    // the moment a concept opens — prevent at open, validate at lock. Fail-silent:
    // scouting must never block the study from starting. EMPHASIS only; the
    // syllabus stays canon (the guard is baked into the mission prompt itself).
    try {
      const out = execFileSync(process.execPath, [join(__dirname, "scout.mjs"), "mission", "stage-topic", s.concept], { encoding: "utf8", timeout: 15000 });
      console.log((out.trim().split("\n")[0] || "").replace(/^MISSIONS DESK · /, "scout: "));
    } catch { console.log("scout: topic mission not staged (scout unavailable) — non-blocking"); }
    break;
  }
  case "step": {
    const before = load();
    const wasAtLock = !!(before && before.step === 10);
    const s = apply(setStep(live(need(before)), rest[0]));
    console.log(oneLine(s));
    // THE LOCK-CHAIN fires exactly on ARRIVAL at step 10 (never on a re-type),
    // after the step change is already saved — outward work can fail without
    // touching the LOCK (Ruling 2, 8 Aug 2026).
    if (s.step === 10 && !wasAtLock) lockChain(s);
    break;
  }
  case "axis": {
    // FROZEN 7 Aug 2026 (full-organism audit P4.1) — the original dispatch, verbatim:
    //   case "axis":   console.log(oneLine(apply(markAxis(live(need(load())), rest[0], rest[1] || "done")))); break;
    // `rest[1] || "done"` made the argument optional and the default "COMPLETE" — so
    // "axis b", typed on 7 Aug to mean "I am now on axis b", recorded "axis b is
    // DONE" twice in twenty minutes, both before any Jirah. A no-argument form that
    // silently marks work complete is a trap. It now refuses and names the three
    // explicit forms; `now` is the declaration that was missing entirely.
    const how = String(rest[1] || "").trim().toLowerCase();
    if (!how) {
      console.error(`forge_session: axis ${rest[0] || "<x>"} — KYA karna hai? Bina bole kuch nahi hota (purana default 'done' 7 Aug ko do baar kaat gaya):`);
      console.error(`  axis ${rest[0] || "<x>"} now    → ab is axis par kaam chal raha hai (sirf declare — kuch COMPLETE nahi hota)`);
      console.error(`  axis ${rest[0] || "<x>"} done   → axis COMPLETE (sirf uske apne Jirah ke BAAD)`);
      console.error(`  axis ${rest[0] || "<x>"} defer  → aaj nahi — deferred list mein (core axis d kabhi nahi)`);
      process.exit(1);
    }
    if (how === "now" || how === "on" || how === "current") {
      console.log(oneLine(apply(setCurrentAxis(live(need(load())), rest[0]))));
    } else {
      console.log(oneLine(apply(markAxis(live(need(load())), rest[0], how))));
    }
    break;
  }
  case "moment": console.log(oneLine(apply(addMoment(live(need(load())), rest[0])))); break;
  case "lockchain": {
    // Read-only PREVIEW of what arrival at step 10 will run — proves the wiring
    // live without staging a premature L-mission or advancing any state.
    const s = load();
    if (!s || !s.concept) { console.error("forge_session: no session on disk"); process.exit(1); }
    lockChain(s, { dry: true });
    break;
  }
  case "status": { const s = load(); if (s) console.log(oneLine(s)); break; }
  case "contract": {                      // HOOK PATH — silence is the default
    // SELF-INJECTION GUARD (same scar as hooks/afferent-post.mjs): every headless
    // `claude -p` the organism spawns runs inside this project, inherits
    // .claude/settings.json and fires UserPromptSubmit. An organ prompt must never
    // be handed the captain's forge contract.
    if (process.env.ARSENAL_ORGAN === "1") break;
    const sNow = load();
    const lines = contractLines(sNow);
    if (lines.length) {
      // Deliverable 2 (7 Aug 2026): the dossier calibration rides the SAME block,
      // loaded here (not inside the pure renderer) so fixtures stay disk-free and
      // a missing/corrupt dossier or registry costs nothing but the line itself.
      const rj = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
      const dossier = rj(join(STATE_DIR, "dossier_weights.json"));
      const registry = rj(join(STATE_DIR, "concepts.json"));
      console.log(lines.concat(dossierLines(sNow.concept, sNow, { dossier, registry })).join("\n"));
      break;
    }
    // ── THE SILENCE GAP (4 Aug 2026) ────────────────────────────────────────
    // contractLines() is silent on three conditions — no session · closed · stale.
    // That is correct FOR THE 12-STEP BLOCK: a full pacer block on a non-study
    // turn is noise. But the consequence was never stated anywhere: with no open
    // session, THE METHOD's step order, the four-legal-question-moments law and
    // META-FREEZE **reach the turn not at all**, and nothing notices. Measured
    // today: `contract` printed ZERO bytes for this entire session while the
    // sprint's current task was a concept mid-flight.
    // His own law (HOW_HE_LEARNS / CLAUDE.md): *anything he has to remember is a
    // design defect, not a discipline problem.* Opening the session was a thing he
    // had to remember, and the whole METHOD hung off it.
    // So: ONE line — never the block — and only when the sprint itself says a
    // CONCEPT is in motion. On a Python/course/build/career day this stays silent,
    // which is why it cannot become the always-fires warning that trains him to
    // ignore it (the audit's #38 failure mode).
    console.log(nudgeLine());
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
    // Computed BEFORE the append so the history row carries the same thing stdout
    // says — a number read once in a terminal and never written down is not a record.
    const drifts = teachingDrifts(loadTeaching(), s.started_at);
    // audit #108 — read BEFORE the append too, and for the same reason as the drifts:
    // whatever stdout is about to say about this session must be computed off one
    // snapshot of disk, not re-read after the close has already moved things.
    const reps = repsBanked(s.started_at);
    console.log(JSON.stringify(cov, null, 2));
    if (shouldRecordClose(s)) {           // RECORD BEFORE REFUSE · double-close appends once
      appendCoverage(s, "close", drifts ? { teaching_drifts: drifts } : {});
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
    // #108 — the CAUSE under that line, which nothing had ever named (see jirahNeverRanLine).
    const jl = jirahNeverRanLine(cov);
    if (jl) R.push(`  ${jl}`);
    if (cov.core_missing.length) R.push(`  CORE axis ${cov.core_missing.join("")} never closed (CORE-NEVER-DEFERRED — canon forbids deferring it)`);
    if (cov.widget_gates < WIDGET_GATES_MIN) R.push(`  widget guess-gates driven ${cov.widget_gates}/${WIDGET_GATES_MIN} — built is not driven`);
    if (cov.check_q_refused) R.push(`  check-questions REFUSED: ${cov.check_q_refused} (quiz-dump attempts)`);
    // The session graded itself above; this grades the TEACHER. Unconditional, same
    // reason the two clocks are: a report that only speaks when it has bad news makes
    // "have no bad news" the cheapest move. Silent only when the file cannot be read.
    const dl = teachingDriftLine(drifts);
    if (dl) R.push(`  ${dl}`);
    // 7 Aug 2026 — the other two lanes + coverage, same disk snapshot as `drifts`.
    for (const al of auditLaneLines(loadTeaching(), s.started_at, loadAuditLast())) R.push(`  ${al}`);
    // #108 — and this grades neither the session nor the teacher: it asks whether the
    // night left anything behind at all. Unconditional, loudest at zero.
    const rl = repsBankedLine(reps);
    if (rl) R.push(`  ${rl}`);
    R.push("  → say all of this out loud to him, verbatim, before the delta.");
    R.push(`forge_session: recorded to ${HISTORY}`);
    console.log(R.join("\n"));
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log("forge_session: start <concept> [--force] | step <0-11> | axis <a-i> now|done|defer (arg REQUIRED — bare form refuses) | moment <" + MOMENTS.join("|") + "> | status | contract | boot | close | selftest");
}
