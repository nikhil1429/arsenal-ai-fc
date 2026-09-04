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
//   · SOLE WRITER of dressing-room/state/relocks.jsonl (A8, 4 Sep 2026) — the re-lock
//     SIDECAR, append-only. His default: a re-lock never edits a capsule (immutable,
//     mirror.mjs is their sole writer), so the fact lives beside them and rejirah.mjs's
//     loadCapsules layers it in memory for every reader of a capsule.
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
// THE LIST BELOW IS DERIVED FROM THE DISPATCH BY THE SELFTEST — do not hand-edit it
// out of step with the switch (DEAD_COMMAND repair, 10 Aug 2026). It advertised
// `axis <a-i> [done|defer]` — the OPTIONAL-argument form the dispatch has REFUSED
// since 7 Aug (P4.1: bare `axis b` prints a 4-line refusal and exits 1, state
// untouched) — and named neither `now`, the declaration that replaced the old silent
// default, nor `lockchain`, dispatched since the outward loop landed 8 Aug. Both cost
// something real: the forge skill sends a session HERE to grep the contract
// (`grep -n "WRITER OF" scripts/forge_session.mjs`, .claude/skills/forge/SKILL.md:29),
// so a session mid-teaching typed the advertised bare form and ate an exit 1, and the
// read-only lock-chain preview was invisible to anyone who read this header or ran the
// script bare. The two docs now fail the selftest the moment either drops a verb.
// MODES: start <concept> [--force] · step <0-11> · axis <a-i> now|done|defer
//        · moment <kind> · lockchain · resume · status · contract · boot · close · selftest
// A3 (4 Sep 2026): `step 10`, `axis <x> done` and `close` are EVIDENCE-GATED — each
//        refuses unless the bank (gaffer_brain.mjs, read-only from here) holds the row
//        it names, and each takes `--no-rep-why "<reason>"` as a recorded, counted
//        override that costs the session its method_clean.
// HIS RULING, 4 Sep 2026 (row 45): the GRILLING is a CONCEPT-level act, not a per-axis
//        one — THE METHOD's own numbering (7 BOLO · 8 CALIBRATE · 9 JIRAH). So the axis
//        gate no longer asks for that axis's own jirah moment, and the LOCK gate asks
//        for a JUDGED `--probe jirah` row per done axis, plus one cross_axis row,
//        beside the negative-space probe it already asked for.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, rmSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";   // W0-D: pathToFileURL for the import guard at the dispatch
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";   // LOCK-chain + topic-open spawns (outward loop, 8 Aug 2026)
import { coreAxes } from "./registry.mjs";   // S10 #12 — per-concept core axes, ONE reader (twin literal died)

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SESSION   = join(STATE_DIR, "forge_session.json");
const HISTORY   = join(STATE_DIR, "forge_sessions.jsonl");
const TEACHING  = join(STATE_DIR, "teaching_contract.json");   // READ-ONLY here; owned by teaching_contract.mjs
const AUDIT_LAST = join(STATE_DIR, "teaching_audit_last.json"); // READ-ONLY here; owned by teaching_audit.mjs (checked_rules stamp)
const REPS      = join(STATE_DIR, "reps_log.jsonl");           // READ-ONLY here; owned by capture.mjs (audit #108)
// A8 (4 Sep 2026) — SOLE WRITER of dressing-room/state/relocks.jsonl, the re-lock
// SIDECAR. His default, 4 Sep: a re-lock never edits a capsule (they are immutable and
// mirror.mjs is their only writer), so the fact is recorded beside them and layered in
// memory by rejirah.mjs's loadCapsules. Append-only, one row per proven re-lock.
const RELOCKS   = join(STATE_DIR, "relocks.jsonl");

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
// S10 migration #12: the global CORE_AXES literal and its hand-mirrored twin
// (teaching_audit.mjs:135) died together. The per-concept home this comment
// always named — a hand-curated `core_axes` array under the concept's entry in
// concepts.json — is now REAL, read through registry.mjs coreAxes(concept)
// (ONE reader, two callers), with the registry row `core_axes_default` as the
// default for every concept without an override.
// Visualization Contract: "2-3 guess-gates" (.claude/skills/forge/SKILL.md:57).
// Counted, never asserted as a boolean — a built widget is not a driven one.
const WIDGET_GATES_MIN = 2;
// Phases 3-6 carry the one-check-question-at-a-time law.
const SOFT_PHASE = (n) => n >= 3 && n <= 6;
export const STALE_HOURS = 18;   // a study session does not span a night

const nowISO = (now = new Date()) => now.toISOString();
const hoursSince = (iso, now = new Date()) => {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (now.getTime() - t) / 3600000 : Infinity;
};

// ---------------------------------------------------------------------------
// STALENESS RUNS FROM THE LAST TOUCH, NEVER FROM BIRTH (W0-D, 2 Sep 2026 — SD-04).
// The number does NOT move: 18 hours is still "a study session does not span a
// night". What moves is the ANCHOR. Measured before this change: every staleness
// read in the organism ran off `started_at`, so a concept that legitimately spans
// two sittings was declared abandoned at hour 19 — his own ratified RESUME MID-AXIS
// was mechanically impossible, and the only way back into a real session was to
// `close` it (ending it) or `start --force` (discarding it). Every mutation in this
// file already stamps `updated_at`, so an actively-worked session can never go stale
// under this anchor, and a genuinely abandoned one still sleeps 18 h after the last
// real touch — which is the behaviour the 31 Jul rule was reaching for.
//
// REPAIR TOWARD SILENCE, UNCHANGED (30 Jul 2026's law, and it is why the fallback
// chain ends in `undefined`): no readable anchor at all ⇒ hoursSince() is Infinity
// ⇒ stale ⇒ the pacer is SILENT. A missing clock must never read as "touched this
// second"; see load(), which repairs BOTH stamps for exactly this reason.
//
// EXPORTED because this predicate had SIX independent derivations on 2 Sep 2026
// (this file · captains_call.mjs:84 · watchman.mjs:151 · learning_state.mjs:240 ·
// learnstate.mjs:575 · sitting.mjs:280), every one of them off `started_at` and two
// of them a bare `18` with no name. Patching the owner alone would have left five
// organs telling him the opposite of what the pacer had just decided. Same collapse
// the S10 CORE_AXES twins and W0-B's three schedule twins got: the owner derives it,
// everyone else imports it, and the old bodies freeze as *Legacy (L9).
export const lastTouchISO = (s) => (
  s && typeof s.updated_at === "string" ? s.updated_at
    : s && typeof s.started_at === "string" ? s.started_at
      : undefined);
export const staleHours = (s, now = new Date()) => hoursSince(lastTouchISO(s), now);
export const isStale = (s, now = new Date()) => staleHours(s, now) > STALE_HOURS;

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
  // ── A3 (4 Sep 2026) · THE THREE FIELDS THE ZERO-TAX GATE NEEDS ──────────────
  // All three default to empty and every reader below tolerates their absence, so a
  // session already on disk when this landed keeps working and simply has no marks.
  //   axes_now_at     — WHEN `axis x now` was declared. The floor a bank row must
  //                     land after to count toward closing that axis: a row banked
  //                     before the axis was even opened is evidence about some other
  //                     axis, and counting it would let one answer close nine.
  //   moments_by_axis — WHICH axis was current when a question-moment fired. The
  //                     global `question_moments.jirah` counter could never answer
  //                     "was THIS axis cross-examined", which is why nine axes could
  //                     be marked done off one jirah (coverage() already names that
  //                     as ungraded; now the mark itself is refused).
  //   bypasses        — every gate a teacher overrode, with HIS OWN reason. A bypass
  //                     is legal and is never blocked — it is COUNTED, and a session
  //                     with one is not method_clean. An escape hatch that left no
  //                     trace would make itself the fastest path through the method.
  axes_now_at: {},
  moments_by_axis: {},
  bypasses: [],
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
  // A3 — the declaration now STAMPS A CLOCK, and that clock is the floor the axis
  // gate measures bank rows against. RE-DECLARING an axis does NOT move the stamp:
  // an axis worked across two sittings would otherwise disqualify every rep banked
  // in the first one, and "re-declare to reset the evidence floor" would be a
  // one-command way to make an already-satisfied gate unsatisfiable (or the reverse,
  // if the arithmetic were the other way round). First `now` wins, always.
  const marks = { ...(s.axes_now_at || {}) };
  if (!marks[a]) marks[a] = nowISO(now);
  return { ok: true, session: { ...s, current_axis: a, axes_now_at: marks, updated_at: nowISO(now) } };
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
  // A3 — A MOMENT NOW REMEMBERS WHICH AXIS IT WAS ABOUT. The global counter cannot
  // answer the only question the axis gate asks ("was THIS axis cross-examined?"),
  // and that gap is exactly how five axes were marked done on 31 Jul with
  // question_moments.jirah sitting at 0. Recorded only when an axis is CURRENT: a
  // moment fired with no axis declared belongs to the concept, not to a letter, and
  // attributing it to whichever axis happened to be last would be an invention.
  const mba = { ...(s.moments_by_axis || {}) };
  if (s.current_axis && AXES.includes(s.current_axis)) {
    mba[s.current_axis] = { ...(mba[s.current_axis] || {}), [m]: ((mba[s.current_axis] || {})[m] || 0) + 1 };
  }
  return {
    ok: true,
    session: {
      ...s,
      question_moments: qm,
      moments_by_axis: mba,
      check_q_this_pass: m === "check_q" ? (s.check_q_this_pass || 0) + 1 : (s.check_q_this_pass || 0),
      updated_at: nowISO(now),
    },
  };
}

// ---------------------------------------------------------------------------
// RESUME — the door back IN (W0-D, 2 Sep 2026 · SD-04). Canon ratified "RESUME
// MID-AXIS" (SAMJHAO_MERGED / his taught-state pointer, committed at W0-B) and this
// organ had no verb for it: the three doors were `start` (blanks the session),
// `start --force` (records a discard row, then blanks it) and `close` (ends it and
// files the coverage report). All three END the concept. So the ratified behaviour
// was not merely unimplemented — it was unreachable, and the boot line's own
// instruction ("do NOT re-teach those axes, do NOT start from step 0") had no
// command behind it after hour 18.
//
// WHAT IT DOES AND, MORE IMPORTANTLY, WHAT IT DOES NOT. It stamps the last-touch
// clock and records the re-entry. It moves no step, marks no axis, counts no
// question-moment, touches no history row, and cannot create a session — `need()`
// still refuses when there is nothing on disk, and a CLOSED session is finished
// (start is that door). Nothing is blanked and nothing is deleted, so the worst a
// mistaken `resume` can do is wake a pacer.
//
// AND IT CANNOT BECOME A LAUNDROMAT. `elapsed_min` still runs from `started_at`, so
// a three-day trail still reports three days — the anti-theatre clock does not move.
// The re-entries are appended, counted, printed at status/boot and carried into the
// history row, so "12 steps in 40 minutes across 3 resumes" reads as exactly that.
function resumeSession(s, now = new Date()) {
  if (s.closed_at) return { ok: false, error: `session '${s.concept}' was closed at ${s.closed_at} — resume cannot re-open a finished session (\`start <concept>\` opens a new one).`, session: s };
  const h = staleHours(s, now);
  if (!isStale(s, now)) return { ok: false, error: `session '${s.concept}' is already LIVE (last touched ${Number.isFinite(h) ? h.toFixed(1) + "h" : "unknown"} ago, stale at ${STALE_HOURS}h) — the pacer is speaking; nothing to wake. Just continue at STEP ${s.step} ${STEPS[s.step] || "?"}.`, session: s };
  return {
    ok: true,
    session: {
      ...s,
      resumes: [...(Array.isArray(s.resumes) ? s.resumes : []),
        { at: nowISO(now), after_h: Number.isFinite(h) ? Math.round(h * 10) / 10 : null, at_step: s.step, at_axis: s.current_axis ?? null }],
      updated_at: nowISO(now),
    },
  };
}

// THE CONTRACT — what the hook injects on every turn. Short by design: a wall of
// text read every turn is a wall of text ignored every turn.
// ONE line, emitted only when the sprint says a CONCEPT is in motion and no forge
// session is carrying it. Reads sprint.json read-only; any failure = silence (this
// runs on a hook, and a hook that throws costs him a turn).
// ── THE NUDGE MUST NOT LIE (W0-D, 2 Sep 2026 — SD-03) ──────────────────────
// Measured live, in the very session that wrote this: with `tokenization` OPEN on
// disk at STEP 3 and stale, this function printed *"koi session KHULI nahi hai, aur
// sprint pe 'Hallucinations' (concept) chal raha hai … PEHLE `start <concept>`"* —
// three falsehoods in one line, on the hook that fires every turn: a session DOES
// exist, its concept is not the one named, and the command it orders is the one
// `startBlocked` refuses (`start` on an unclosed session exits 1). A per-turn line
// that is wrong about the state is worse than the silence it was built to end: it
// trains him to ignore the one surface that speaks every turn.
// It read ONLY sprint.json — the roster of what he SHOULD be studying — and never
// the pacer's own file, which is the thing it is nudging about. So it now reads the
// session FIRST and describes what is actually on disk.
// STILL ONE LINE, still silent on any failure, still silent on a non-concept day —
// those three laws are what keep it from becoming the always-fires warning (#38).
// `session` is INJECTABLE and the selftest passes it: a checker that falls through
// to load() would read HIS live study state, which is the exact 10-Aug scar
// teaching_audit.mjs carries (a test that reads his day is not a test).
export function nudgeLine(deps = {}) {
  try {
    const now = deps.now !== undefined ? deps.now : new Date();
    const s = deps.session !== undefined ? deps.session : load();
    if (s && s.concept && !s.closed_at) {
      // FRESH: contractLines() is already printing the whole 12-step block this turn.
      // Two voices about one session is a wall, and the block is the better one.
      if (!isStale(s, now)) return "";
      const h = staleHours(s, now);
      const since = Number.isFinite(h) ? `${h.toFixed(0)}h se koi touch nahi` : "kab se, pata nahi";
      // The sprint's own idea of today is named ONLY when it disagrees — that
      // disagreement IS the decision in front of him, and staying quiet about it is
      // how he ends up studying one thing while the machine records another.
      let other = "";
      try {
        const sprint = deps.sprint !== undefined ? deps.sprint
          : JSON.parse(readFileSync(join(STATE_DIR, "sprint.json"), "utf8"));
        const cur = sprint && sprint.progress && sprint.progress.current;
        const task = cur && String(cur.track || "").toLowerCase() === "concept" ? String(cur.task || cur.id || "") : "";
        if (task && task.trim().toLowerCase() !== s.concept) other = ` (sprint "${task}" bol raha hai — pehle yeh nipta lo)`;
      } catch { /* the sprint is a courtesy here; the session is the fact */ }
      return `FORGE: "${s.concept}" ki session KHULI hai par STALE`
        + ` (STEP ${s.step}/${STEPS.length - 1} ${STEPS[s.step] || "?"}, ${since})${other} —`
        + ` \`node scripts/forge_session.mjs resume\` se wahin se continue karo (kuch delete nahi hota),`
        + ` ya \`close\` karo (coverage report bachta hai), phir \`start <concept>\`.`;
    }
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

// ── A3 (4 Sep 2026) · THE LATENCY THE TEACHER IS ASKED TO BANK ───────────────
// `--latency_ms` is the Stop→prompt clock: the gap between the teacher's last message
// ENDING and his answer arriving. Three gates already read `latency_ms` (learning_state's
// isColdFast, touchline's latRising and allFastKnew) and every one treats null as "no
// objection" — so an un-measured lane is a silently un-gated one.
// ⚠ THE SKILL DOCUMENTED THIS AS PRINTED BEFORE IT WAS (verifier finding, 4 Sep). Nothing
// in this file emitted a clock; a teacher following the skill would have found no number,
// and — correctly, under the never-invent law — banked null every time.
// The anchor is `stop.at` from the teaching audit's own last row (stamped by the Stop
// hook), else teaching_contract.json's `checked_at` (stamped by the same anchor). NEVER
// invented: with no readable anchor the line SAYS the number could not be read and tells
// the teacher to leave the flag off, which is a different fact from "he answered fast".
export function stopToPromptMs(auditLast, teaching, now = new Date()) {
  const iso = (auditLast && auditLast.stop && auditLast.stop.at) || (teaching && teaching.checked_at) || null;
  const t = Date.parse(String(iso || ""));
  if (!Number.isFinite(t)) return null;
  const ms = now.getTime() - t;
  // A negative gap means the clocks disagree, and an implausibly long one means he walked
  // away — neither is a measurement of how fast he answered. Both read as unmeasured.
  return ms >= 0 && ms <= 30 * 60000 ? Math.round(ms) : null;
}
function contractLines(s, now = new Date(), clock = undefined) {
  if (!s || !s.concept) return [];
  if (s.closed_at) return [];                                    // a closed session pacts nothing
  if (isStale(s, now)) return [];                                // W0-D: last touch, not birth
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
  const CORE_AXES = coreAxes(s.concept);   // S10 #12 — per-concept, one reader
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
  if (clock !== undefined) {
    L.push(clock === null
      ? `  latency: UNMEASURABLE this turn — leave \`--latency_ms\` OFF when you bank. A null latency is a measurement nobody made; an invented one corrupts the fluency ladder permanently.`
      : `  latency: ${clock} ms since your last message ended — pass it VERBATIM as \`--latency_ms ${clock}\` on the next bank.`);
  }
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

// ---------------------------------------------------------------------------
// THE ZERO-TAX GATES (A3, 4 Sep 2026) — an uncaptured rep did not happen
// ---------------------------------------------------------------------------
// WHAT WAS MEASURED, the morning this landed: reps_log.jsonl held 37 rows, NOT ONE of
// them banked since the GAME-ON epoch; all eleven recorded forge sessions carried
// `method_clean:false`; `question_moments.jirah` was 0 across every one of them. The
// capture step existed only as a SENTENCE at the end of a skill file — the pacer wrote
// nothing, so a session that ended the way his sessions actually end (tired, mid-axis,
// with the terminal closed) lost the whole day. His own law: an uncaptured rep did not
// happen, and anything he has to remember to do is a design defect.
//
// SO THE PACER STOPS ASKING AND STARTS REFUSING. Three gates, and every one of them is
// a COUNT of rows another organ already owns — this file writes no rep, judges nothing,
// and spends nothing. Rows are passed IN (never read here) so the whole core stays pure
// and the selftest needs no disk and no import.
//
// EVERY GATE HAS A WAY OUT, and the way out is `--no-rep-why "<his words>"`: it is
// recorded, counted, and it costs the session its method_clean. A gate with no escape
// gets disabled by the first tired evening; a gate whose escape leaves no trace becomes
// the normal path by the third. This one leaves a row.
const GATE_BYPASS_FLAG = "--no-rep-why";
/** axisDoneGate — may axis `a` be marked DONE? Three questions, each about evidence
 *  that exists on disk, none of them about how the teacher feels the session went.
 *  @param rows bank rows for THIS CONCEPT (gaffer_brain.bankRows), newest-inclusive */
export function axisDoneGate(s, axis, rows = []) {
  const a = String(axis || "").trim().toLowerCase();
  if (!AXES.includes(a)) return { ok: false, missing: [], error: `axis not a..i (${axis})` };
  // THE FLOOR: the axis's own `now` mark, else the session's start. Never epoch —
  // a missing floor that admitted every row ever banked would turn the gate into
  // a formality on exactly the sessions that skipped the declaration.
  const floor = (s.axes_now_at || {})[a] || s.started_at || null;
  const t0 = Date.parse(floor || "");
  const inWindow = (r) => { const t = Date.parse((r && r.ts) || ""); return Number.isFinite(t) && (!Number.isFinite(t0) || t >= t0); };
  const mine = (rows || []).filter((r) => r && String(r.axis || "").toLowerCase() === a && inWindow(r));
  // A row with no register declared IS the Hinglish one: that is the default register of the
  // whole lesson, and the flag exists to mark the exception, not the rule.
  const hinglish = mine.filter((r) => String(r.register || "").toLowerCase() !== "interview");
  const jirah = ((s.moments_by_axis || {})[a] || {}).jirah || 0;
  const missing = [];
  if (!mine.length) missing.push(`no banked answer for axis ${a} since ${floor ? `it was opened (${String(floor).slice(0, 16)})` : "this session began"} — bank his words: \`node scripts/gaffer_brain.mjs capture voice_rep <concept>:${a} --axis ${a} --gut <knew|shaky|guessed> --asked "<q>" --said "<his words>" --surface code\``);
  // ── HIS RULING, 4 Sep 2026 (row 45): THE GRILLING MOVED OFF THIS GATE ────────
  // The third requirement used to be "this axis has had its OWN `moment jirah`", and
  // it is GONE from here — not softened, moved. His words, after closing axis a that
  // morning: "questions and grilling as much as you want with full intensity and
  // quality should be done after the entire topic is taught… right now after every
  // axis it is not the right strategy for domination". That is THE METHOD's own
  // numbering — 7 BOLO · 8 CALIBRATE · 9 JIRAH all sit at the CONCEPT level — so the
  // per-axis Jirah (the 30 Aug 48-hour practice ruling, re-installed by Fork-1) is
  // withdrawn. NOTHING IS UNGUARDED BY THE MOVE: the grilling is now counted at the
  // LOCK, per axis, and it is counted harder there (a JUDGED row, not a declared
  // moment). `jirah` stays on this gate's return shape — it is read, reported and
  // never gated on, and dropping the field would blind every reader of it (L9).
  if (!mine.some((r) => String(r.register || "").toLowerCase() === "interview")) missing.push(`no INTERVIEW-register line for axis ${a} — he has said it in Hinglish, not yet in the room's English: bank one more with \`--register interview\``);
  // …AND THE OTHER HALF (4 Sep 2026, verifier finding, reproduced). This gate's own words
  // are "he can say it twice: once in Hinglish and once in cold interview English — two
  // different skills". The first draft asked for `mine.length >= 1` AND `some(interview)`,
  // which ONE interview row satisfies both of — so an axis could close having never been
  // said in his own language, which is the half that means he understood it.
  else if (!hinglish.length) missing.push(`axis ${a} has ONLY the interview line — he has not said it in his OWN words yet, and that is the half that means he understood it. Bank the Hinglish one too (no \`--register\` flag needed; that is the default).`);
  return { ok: missing.length === 0, missing, floor, rows_seen: mine.length, jirah };
}
/** lockGate — may this concept reach STEP 10 (LOCK)? THREE questions since his 4 Sep
 *  2026 ruling (row 45), and all three are about the GRILLING that used to be spread
 *  thin across nine axis gates:
 *    · has he been asked what this thing does NOT do (OPPONENT_SCOUT's #1 senior
 *      signal — a concept locked without it locks a definition, not a judgement),
 *    · has EVERY axis he marked done been grilled at the round and GRADED for it —
 *      one banked `--probe jirah` row per axis, carrying a verdict, and
 *    · has anything asked him to cross the axes at all (`--probe cross_axis`) — nine
 *      axes answered one at a time is nine facts, not one concept.
 *  `outstanding` is gaffer_brain's own unjudged set, read the way `close` reads it:
 *  a row is JUDGED when nothing in that set still carries its id. Handed IN, never
 *  read here — this organ stays pure, model-free and disk-free.
 *  ⚠ THE JIRAH TERM IS A VERDICT, NOT A DECLARATION. The old per-axis requirement was
 *  `moment jirah`, a counter a tired evening could tap nine times; this one needs his
 *  answer on disk and a grade against it, which is the thing that could never be
 *  faked. So the ruling did not loosen the method — it moved the check to where he
 *  said it belongs and made it harder there. */
const JIRAH_PROBE = "jirah";
export function lockGate(s, rows = [], outstanding = []) {
  const t0 = Date.parse(s.started_at || "");
  const inWindow = (r) => { const t = Date.parse((r && r.ts) || ""); return Number.isFinite(t) && (!Number.isFinite(t0) || t >= t0); };
  const mine = (rows || []).filter((r) => r && inWindow(r));
  const probeIs = (r, p) => String((r && r.probe) || "").toLowerCase() === p;
  // A row with an id nobody has settled is a question ASKED, not a grade. Same reader
  // `close` uses (outstandingBank), so the two gates can never drift on what "judged"
  // means — the drift that would let a concept lock on ungraded answers.
  const judged = (r) => !(outstanding || []).some((o) => o && r && o.id === r.id);
  const done = (Array.isArray(s.axes_done) ? s.axes_done : []).map((a) => String(a || "").toLowerCase());
  const ungrilled = done.filter((a) => !mine.some((r) => String(r.axis || "").toLowerCase() === a && probeIs(r, JIRAH_PROBE) && judged(r)));
  const missing = [];
  if (!mine.some((r) => probeIs(r, "negative_space"))) missing.push(`STEP 10 is the LOCK and nothing has asked him what ${s.concept} does NOT do — the negative-space probe is the single strongest senior signal in the dossier. Ask it, bank it with \`--probe negative_space\`, then lock.`);
  if (ungrilled.length) missing.push(`axis ${ungrilled.join("")} ${ungrilled.length === 1 ? "was" : "were"} taught and closed but never GRILLED — the Jirah round (STEP 9) runs on the WHOLE concept now, and the LOCK is where it is counted. Per axis: one sharp question + his own capsule's traps + "reinvent it from scratch", then \`node scripts/gaffer_brain.mjs capture voice_rep ${s.concept}:<axis> --axis <axis> --gut <knew|shaky|guessed> --asked "<q>" --said "<his words>" --surface code --probe ${JIRAH_PROBE}\` — and \`node scripts/gaffer_brain.mjs judge-round\` after, because a jirah row nobody judged is a question asked, not a grade.`);
  if (!mine.some((r) => probeIs(r, "cross_axis"))) missing.push(`nothing has made him CROSS the axes on ${s.concept} — nine axes answered one at a time are nine facts, not one concept. Ask the question that needs two of them at once, bank it with \`--probe cross_axis\`, then lock.`);
  return { ok: missing.length === 0, missing, axes_ungrilled: ungrilled, axes_done_seen: done.length };
}
/** closeGate — may the session close? A close is the ONLY durable record a session
 *  leaves, so this gate is deliberately the mildest of the three: it refuses only
 *  when the session banked nothing at all, or banked answers that nobody ever judged.
 *  Both are the same defect wearing different clothes — his words on disk with no
 *  verdict attached to them, which is what "37 reps and 11 sessions" looked like. */
export function closeGate(s, rows = [], outstanding = []) {
  const t0 = Date.parse(s.started_at || "");
  const mine = (rows || []).filter((r) => { const t = Date.parse((r && r.ts) || ""); return Number.isFinite(t) && (!Number.isFinite(t0) || t >= t0); });
  const unjudged = (outstanding || []).filter((r) => mine.some((m) => m && r && m.id === r.id));
  const missing = [];
  if (!mine.length) missing.push("this session banked NOTHING — every gut-word he said tonight dies with this terminal. Bank them first (`gaffer_brain.mjs capture …`), then close.");
  else if (unjudged.length) missing.push(`${unjudged.length} banked answer(s) have no verdict — run the round's ONE judge call first: \`node scripts/gaffer_brain.mjs judge-round\`. capture.mjs writes the reps, not this organ.`);
  return { ok: missing.length === 0, missing, banked: mine.length, unjudged: unjudged.length };
}
/** relockRow — PURE: is this session a proven re-lock, and what row says so?
 *  Two conditions, both about EVIDENCE and neither about how the session felt:
 *    · every CORE axis is not merely marked done but GRADED (its own jirah before its
 *      own mark — coverage()'s existing definition, not a second one), and
 *    · at least one banked answer of this session carries a verdict.
 *  Anything less is a session that reached step 10, which is not the same thing as a
 *  concept that is proven again — and a re-lock is exactly the claim "his proof is
 *  current", the claim his 30-August ruling withdrew from all four capsules. */
export function relockRow(s, cov, judgedReps, now = new Date()) {
  const core = Array.isArray(cov.core_axes) ? cov.core_axes : [];
  const graded = new Set(Array.isArray(cov.axes_graded) ? cov.axes_graded : []);
  const coreGraded = core.length > 0 && core.every((a) => graded.has(a));
  const why = [];
  if (!core.length) why.push("this concept declares no core axis, so nothing here can testify that its measure was taught");
  if (core.length && !coreGraded) why.push(`core axis ${core.filter((a) => !graded.has(a)).join("") || "?"} is not GRADED (marked done is not the same as cross-examined)`);
  if (!(judgedReps >= 1)) why.push("no banked answer of this session carries a verdict yet");
  if (why.length) return { ok: false, why };
  return { ok: true, row: { ts: nowISO(now), concept: s.concept, relockedOn: nowISO(now).slice(0, 10),
    by: "forge_session.mjs step 10", core_axes: core, judged_reps: judgedReps, session_started_at: s.started_at || null } };
}

/** recordBypass — the escape hatch, as a row. PURE; the caller saves. */
export function recordBypass(s, gate, why, now = new Date()) {
  const row = { at: nowISO(now), gate: String(gate), step: s.step, axis: s.current_axis || null, why: String(why || "").trim().slice(0, 400) };
  return { ...s, bypasses: [...(s.bypasses || []), row], updated_at: nowISO(now) };
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
  const CORE_AXES = coreAxes(s.concept);   // S10 #12 — per-concept, one reader
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
    // W0-D: the re-entries ride the report, so elapsed_min is readable. A session
    // with elapsed_min 2900 and resumes 0 is abandoned-then-closed; the same number
    // with 3 resumes is a concept that legitimately spanned three sittings. Before
    // `resume` existed the first reading was the only one available, which is why the
    // clock had to mean "one sitting" and a two-day concept looked like theatre.
    resumes: (s.resumes || []).length,
    resumed_at: (s.resumes || []).map((r) => (r && typeof r.at === "string" ? r.at : null)).filter(Boolean),
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
    // A3 — every gate the teacher overrode, with his own reason, in the row that
    // outlives the terminal. Reported unconditionally like the two clocks: a number
    // that only appears when it is bad makes "have nothing bad" the cheapest move.
    bypasses: [...(s.bypasses || [])],
    bypass_count: (s.bypasses || []).length,
    moments_by_axis: { ...(s.moments_by_axis || {}) },
    axes_now_at: { ...(s.axes_now_at || {}) },
    // FROZEN VERBATIM (30 Jul semantics — layering, never replace). `honest` answers
    // exactly one question: did every step run and was every axis touched. It stays
    // byte-for-byte what it was, so a comparison across old and new rows is valid.
    honest: missed.length === 0 && untouched.length === 0,
    // The new verdict layers ON TOP: coverage AND grading AND the core axis AND a
    // driven widget AND no quiz-dump attempt.
    // A3 adds ONE term: zero bypasses. A session that talked its way past an
    // evidence gate is not a clean one, however good the teaching felt.
    method_clean: missed.length === 0 && untouched.length === 0 && ungraded.length === 0
      && coreMissing.length === 0 && gates >= WIDGET_GATES_MIN && (s.check_q_refused || 0) === 0
      && (s.bypasses || []).length === 0,
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
      // THE SAME REPAIR, FOR THE STAMP THAT NOW DECIDES STALENESS (W0-D, 2 Sep 2026).
      // Without this line the last-touch anchor would be strictly WORSE than the birth
      // anchor it replaces: blank() stamps updated_at = NOW and the `...j` spread only
      // overwrites it when the file actually carries one — so a session file written
      // before this field existed (or hand-mangled since) would have read "touched this
      // second" on every load, forever, and STALE-means-silent could never fire. That is
      // repair toward SPEECH, the exact bug the started_at comment above was written for.
      // Left undefined, the fallback chain in lastTouchISO() drops to started_at, and if
      // that is gone too the session reads stale — silent, which is the safe direction.
      updated_at: typeof j.updated_at === "string" ? j.updated_at : undefined,
      // Same drop-the-malformed rule as axes_marked_at: a junk entry downgrades to
      // "this re-entry was not recorded", never to a fabricated one.
      resumes: (Array.isArray(j.resumes) ? j.resumes : []).filter((r) => r && typeof r === "object" && !Array.isArray(r)),
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

// THE DISCARD REPORT (dead-wire repair, 10 Aug 2026). `start --force` called
// appendCoverage and THREW THE RETURN VALUE AWAY, then blanked + saved on the very
// next line. appendCoverage returns false on failure and never throws (:649), so a
// failed append silently erased the discarded session's entire record: no row, no
// line on screen, no non-zero exit. The :1619 promise — "a --force overwrite still
// leaves a row behind" — was true only on the happy path, and the one moment it
// mattered was the one moment nothing said anything.
//
// `close` already had the answer: it prints the whole coverage BEFORE the append,
// so a failed append there still leaves the captain a copy on screen ("the coverage
// above is the ONLY copy", F5). `--force` prints nothing of its own, so on failure
// this hands back the coverage itself — the record it could not file.
//
// It stays a COURTESY, never a blocker (the same law stated at :634 and the same
// one `close` follows): a failed append does not stop the new session from opening,
// and does not change the exit code. It only stops being SILENT.
function forceDiscardLines(prev, recorded, cov) {
  if (recorded !== false) return [`forge_session: '${prev.concept}' discarded — force row recorded to ${HISTORY}`];
  return [
    `forge_session: history append FAILED — '${prev.concept}' was discarded and its row could NOT be written.`,
    "  the coverage below is the ONLY copy of that session; save it before you type anything else (F5)",
    JSON.stringify(cov, null, 2),
  ];
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
  // W0-D (2 Sep 2026): measured from the LAST TOUCH, and the refusal finally names a
  // way back IN. Before today the only two doors out of a stale session both ENDED it
  // — `close` (finish it) or `start --force` (discard it) — so a concept spanning two
  // sittings had no lawful continuation at all. `resume` is that door; it blanks
  // nothing and it is offered FIRST because continuing is what he is usually doing.
  if (isStale(s)) {
    console.error(`forge_session: session '${s.concept}' is stale (last touched ${lastTouchISO(s) || "unknown"}) — the pacer stopped after ${STALE_HOURS}h. \`resume\` it (wahin se continue, kuch delete nahi hota), or \`close\` it for the coverage report, or \`start <concept> --force\`.`);
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
  // RESUMES ARE SAID OUT LOUD, ALWAYS (W0-D): a session re-entered across days has a
  // legitimately huge elapsed_min, and a reader who cannot see the re-entries would
  // read that clock as theatre — or, worse, a session could LAUNDER a three-day trail
  // as one sitting. The two clocks at close are unchanged; this is the third fact that
  // makes them honest.
  + ((s.resumes || []).length ? ` · resumed ${(s.resumes || []).length}×` : "")
  + (s.closed_at ? ` · CLOSED ${s.closed_at}` : (isStale(s) ? " · STALE (pacer silent — `resume` wakes it)" : ""));

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
    // W0-D: `age` still reports from BIRTH — that is the number a human wants at boot
    // ("started 40h ago") — while STALENESS is judged on the last touch, because that
    // is what decides whether the pacer is speaking. Two different questions, and
    // collapsing them is how a two-sitting concept got called abandoned.
    const age = hoursSince(s.started_at, now);
    const stale = isStale(s, now);
    const marks = s.axes_marked_at || {};
    const jb = (a) => { const m = marks[a]; return m && Number.isInteger(m.jirah_before) ? m.jirah_before : 0; };
    const ungraded = s.axes_done.filter((a) => !(jb(a) >= 1 && !s.axes_done.some((b) => b !== a && jb(b) === jb(a))));
    const left = AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a));
    const when = Number.isFinite(age) ? `started ${age.toFixed(1)}h ago${stale ? " (STALE — the pacer is silent)" : ""}` : "age unknown";
    return [
      `FORGE SESSION OPEN ON DISK · ${s.concept} · STEP ${s.step}/${STEPS.length - 1} ${STEPS[s.step] || "?"}`
        + ` · axes done ${s.axes_done.join("") || "—"} ${s.axes_done.length}/${AXES.length} · ungraded ${ungraded.join("") || "—"}`
        + ` · deferred ${s.axes_deferred.join("") || "—"} · left ${left.join("") || "—"} · ${when}`
        + ((s.resumes || []).length ? ` · resumed ${(s.resumes || []).length}×` : "")
        + historyDigest(h),                      // #30 — no longer swallowed, and still ONE line
      // W0-D (2 Sep 2026): the stale branch used to name ONE door, and it was the door
      // that ENDS the session. So the only mechanically possible answer to "he came
      // back the next morning" was to close a concept he was mid-way through, or to
      // re-teach it from step 0 — the two things the line above forbids in its own
      // words. `resume` goes first because continuing is the common case; `close`
      // stays named, because a session he is genuinely done with still owes a report.
      stale
        ? `Do NOT re-teach those axes and do NOT start this concept from step 0. Two doors: \`node scripts/forge_session.mjs resume\` (wahin se continue — kuch delete nahi hota, STEP ${s.step} se aage), or \`close\` if that concept is finished (that is the only thing that saves the coverage report).`
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
  // HOISTED from the 31 Jul block below (W0-D, 2 Sep 2026): the SD-03/SD-04 asserts
  // added up-file need a clock too, and a `const` used above its own declaration is a
  // TDZ ReferenceError that would have taken the whole selftest down, not one line.
  const T = (min) => new Date(T0.getTime() + min * 60000);

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
  // W0-D (2 Sep 2026): every one of these now injects `session` explicitly. Without it
  // nudgeLine() falls through to load() and READS HIS LIVE STUDY FILE — the same
  // "a test that reads his day is not a test" scar teaching_audit.mjs carries from
  // 10 Aug, and these asserts would silently start measuring his morning instead of
  // this function.
  const NO_SESSION = { session: null };
  assert("SILENCE GAP — a concept in the sprint with NO open session gets ONE nudge line",
    /forge_session\.mjs start/.test(nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "Hallucinations", track: "concept" } } } })));
  assert("SILENCE GAP — the nudge names the CONCEPT, so it is never a generic nag",
    /Hallucinations/.test(nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "Hallucinations", track: "concept" } } } })));
  assert("SILENCE GAP — it names WHAT IS LOST, not just what to run",
    /META-FREEZE/.test(nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "X", track: "concept" } } } })));
  assert("SILENCE GAP — a NON-concept track stays SILENT (never the always-fires warning, audit #38)",
    nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "Python basics", track: "skill" } } } }) === ""
    && nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "API", track: "course" } } } }) === ""
    && nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "resume", track: "career" } } } }) === "");
  assert("SILENCE GAP — it is ONE line, so it can never become a wall",
    nudgeLine({ ...NO_SESSION, sprint: { progress: { current: { task: "X", track: "concept" } } } }).split("\n").length === 1);
  assert("SILENCE GAP — a missing/junk sprint degrades to silence, never to a thrown hook",
    nudgeLine({ ...NO_SESSION, sprint: null }) === "" && nudgeLine({ ...NO_SESSION, sprint: {} }) === "");
  assert("SILENCE GAP — an OPEN session suppresses the nudge (the block speaks instead)",
    contractLines(s4, T0).length > 0);
  assert("W0-D INJECTION LAW — nudgeLine takes its session as a dependency, so no test of it can ever read his live forge_session.json",
    nudgeLine({ session: null, sprint: null }) === ""
    && nudgeLine({ session: { concept: "z", started_at: nowISO(T0), updated_at: nowISO(T0), step: 3, axes_done: [], axes_deferred: [] }, sprint: null, now: T0 }) === "");

  // ── SD-03 · THE NUDGE MUST NOT LIE ────────────────────────────────────────
  // Reproduced from the live 2 Sep state: `tokenization` open at STEP 3 and stale,
  // sprint saying "Hallucinations". The old line asserted all three of: no session
  // exists · the concept is Hallucinations · run `start`. All three were false.
  {
    const staleOpen = { concept: "tokenization", started_at: nowISO(T0), updated_at: nowISO(T0), step: 3,
      steps_done: [0, 1, 2, 3], axes_done: [], axes_deferred: [], axes_marked_at: {}, current_axis: "a",
      question_moments: { pehle_guess: 1, widget_gate: 0, check_q: 0, jirah: 0 } };
    const sprintOther = { progress: { current: { task: "Hallucinations", track: "concept" } } };
    const line = nudgeLine({ session: staleOpen, sprint: sprintOther, now: T(19 * 60) });
    assert("SD-03 — with a STALE session open the nudge NEVER says 'koi session KHULI nahi hai'",
      line !== "" && !/koi session KHULI nahi hai/.test(line));
    assert("SD-03 — it names the OPEN session's real concept and step, not the sprint's",
      /tokenization/.test(line) && /STEP 3\/11/.test(line));
    assert("SD-03 — it orders the commands that WORK (resume | close), never the `start` that startBlocked refuses",
      /resume/.test(line) && /close/.test(line) && !/mjs start\b/.test(line));
    assert("SD-03 — a DISAGREEING sprint is named as the decision it is, and an agreeing one adds nothing",
      /sprint "Hallucinations"/.test(line)
      && !/sprint "/.test(nudgeLine({ session: staleOpen, now: T(19 * 60), sprint: { progress: { current: { task: "tokenization", track: "concept" } } } })));
    assert("SD-03 — still ONE line, and still silent when the whole read throws",
      line.split("\n").length === 1 && nudgeLine({ session: staleOpen, now: T(19 * 60), sprint: { get progress() { throw new Error("boom"); } } }).split("\n").length === 1);
    assert("SD-03 — a FRESH open session stays silent here (contractLines owns that turn — two voices is a wall)",
      nudgeLine({ session: staleOpen, sprint: sprintOther, now: T(60) }) === "");
  }

  // ── SD-04 · STALENESS RUNS FROM THE LAST TOUCH, AND `resume` IS THE DOOR ───
  {
    const born = { ...blank("multiday", T0), step: 5, steps_done: [0, 1, 2, 3, 4, 5], current_axis: "c" };
    const touched = { ...born, updated_at: nowISO(T(19 * 60)) };          // born T0, touched 19h later
    assert("SD-04 — a session BORN 20h ago but TOUCHED 1h ago is LIVE (the two-sitting concept the old anchor called abandoned)",
      isStale(born, T(20 * 60)) === true && isStale(touched, T(20 * 60)) === false
      && contractLines(touched, T(20 * 60)).length > 0);
    assert("SD-04 — the NUMBER did not move: 18h from the last touch is still stale",
      STALE_HOURS === 18 && isStale(touched, T(19 * 60 + 18 * 60 + 1)) === true);
    assert("SD-04 — REPAIR TOWARD SILENCE survives the new anchor: no readable stamp at all reads STALE, never fresh",
      lastTouchISO({ concept: "x" }) === undefined
      && isStale({ concept: "x" }, T0) === true
      && contractLines({ ...born, started_at: undefined, updated_at: undefined }, T0).length === 0);
    assert("SD-04 — updated_at falls back to started_at, so a session file written before this field existed still ages correctly",
      lastTouchISO({ started_at: nowISO(T0) }) === nowISO(T0)
      && isStale({ concept: "x", started_at: nowISO(T0) }, T(19 * 60)) === true);
    const r1 = resumeSession(born, T(20 * 60));
    assert("SD-04 — `resume` on a stale session wakes the pacer and BLANKS NOTHING",
      r1.ok && contractLines(r1.session, T(20 * 60)).length > 0
      && r1.session.step === 5 && r1.session.current_axis === "c"
      && r1.session.started_at === born.started_at
      && JSON.stringify(r1.session.steps_done) === JSON.stringify(born.steps_done));
    assert("SD-04 — the re-entry is RECORDED (a resumed session can never read as one sitting)",
      r1.session.resumes.length === 1 && r1.session.resumes[0].at_step === 5 && r1.session.resumes[0].after_h === 20
      && coverage(r1.session, T(20 * 60)).resumes === 1
      && /resumed 1×/.test(oneLine(r1.session)));
    assert("SD-04 — elapsed_min still runs from BIRTH after a resume: the anti-theatre clock does not move",
      coverage(r1.session, T(20 * 60)).elapsed_min === coverage(born, T(20 * 60)).elapsed_min);
    assert("SD-04 — `resume` REFUSES a live session (nothing to wake) and a CLOSED one (start is that door)",
      !resumeSession(touched, T(20 * 60)).ok && /already LIVE/.test(resumeSession(touched, T(20 * 60)).error)
      && !resumeSession({ ...born, closed_at: nowISO(T0) }, T(20 * 60)).ok);
    assert("SD-04 — a second resume appends, never replaces (the count is the honesty)",
      resumeSession({ ...r1.session, updated_at: nowISO(T(20 * 60)) }, T(48 * 60)).session.resumes.length === 2);
    assert("SD-04 — the boot line's stale branch now names a door that CONTINUES, not only the two that end it",
      bootLines(born, null, T(20 * 60))[1].includes("resume") && bootLines(born, null, T(20 * 60))[1].includes("close"));
  }
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
  // W0-D (2 Sep 2026) — THE LAW IS UNCHANGED; THE FIELD THAT CARRIES IT MOVED. This
  // assert used to drop `started_at` alone, because `started_at` WAS the clock. Under
  // the last-touch anchor that fixture no longer describes "a file with no clock" — it
  // describes a file with a perfectly good one (`updated_at`), so reading it as LIVE is
  // correct, not a regression. The law itself — NO READABLE STAMP ⇒ STALE ⇒ SILENT — is
  // asserted below on the case that actually expresses it, plus the direction that
  // matters: dropping a stamp may never make a session look FRESHER than it is.
  assert("REPAIR TOWARD SILENCE — a session file with NO readable stamp at all reads as stale, not fresh",
    contractLines({ ...s4, started_at: undefined, updated_at: undefined }, T0).length === 0
    && contractLines({ ...s4, started_at: 12345, updated_at: null }, T0).length === 0);
  assert("REPAIR TOWARD SILENCE — losing a stamp can only ever make a session look OLDER, never younger",
    staleHours({ ...s4, updated_at: undefined }, T0) >= staleHours(s4, T0)
    && staleHours({ ...s4, started_at: undefined, updated_at: undefined }, T0) === Infinity);
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
  // (`T` now lives beside T0 at the top of this selftest — W0-D.)
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

  // THE DROPPED RETURN VALUE (dead-wire repair, 10 Aug 2026). `start --force` used to
  // discard the return of appendCoverage, so a failed append erased the session with
  // ZERO output. Its own path is a temp file so the asserts above keep their counts.
  const hpF = join(tmpdir(), `forge_force_selftest_${process.pid}.jsonl`);
  rmSync(hpF, { force: true });
  assert("FORCE DISCARD SPEAKS ON SUCCESS — one line, and it names the history file the row went to",
    (() => { const L = forceDiscardLines(clean, appendCoverage(clean, "force", {}, hpF, T(30)), coverage(clean, T(30)));
      return L.length === 1 && /force row recorded/.test(L[0]) && L[0].includes(HISTORY); })());
  assert("FORCE DISCARD IS NEVER SILENT — a FAILED append prints the loud warning AND the discarded session's whole coverage, so the only record survives on screen",
    (() => { const L = forceDiscardLines(clean, appendCoverage(clean, "force", {}, join(hpF, "nope", "x.jsonl"), T0), coverage(clean, T(30)));
      return L.length === 3 && /append FAILED/.test(L[0]) && /hallucinations/.test(L[0]) && /ONLY copy/.test(L[1])
        && JSON.parse(L[2]).concept === "hallucinations" && Array.isArray(JSON.parse(L[2]).axes_ungraded); })());
  // …and the WIRE itself, not just the renderer (precedent: scoreboard.mjs:599). The two
  // asserts above would stay green if the CLI dropped the return value all over again —
  // which is EXACTLY the defect. This reads the `start --force` block out of this file's
  // own source and fails if the value stops being taken or stops being printed.
  assert("FORCE DISCARD WIRE — `start --force` takes appendCoverage's return and prints it (the dropped-return defect cannot come back silently)",
    (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
      // The needles are BUILT, never written whole: a literal here sits earlier in this
      // same file than the block it hunts, so a plain indexOf matched the assert's own
      // string and sliced 41 characters of itself (caught on the first run, 10 Aug 2026).
      const from = src.indexOf("// RECORD BEFORE " + "DISCARD");
      const blk = from < 0 ? "" : src.slice(from, src.indexOf("const s = blank(" + "concept)", from));
      return blk.length > 0 && /const\s+recorded\s*=\s*appendCoverage\(prev,\s*"force"/.test(blk)
        && /forceDiscardLines\(prev,\s*recorded,\s*cov\)/.test(blk); })());
  rmSync(hpF, { force: true });
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
    // W0-D: the second line named ONE door and it was the door that ENDS the session,
    // so the only mechanically possible answer to "he came back the next morning" was
    // to close a concept he was mid-way through. Both doors are now asserted, and so is
    // the instruction they serve — never re-teach, never restart from step 0.
    && /resume/.test(bStale[1]) && /`close`/.test(bStale[1])
    && /Do NOT re-teach/.test(bStale[1]) && /from step 0/.test(bStale[1]));
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
    assert("lock-chain: exact spawn argv (mission stage-lock + G16's event-driven mirror + capsule_bridge + benchmark run + E8's widget list)",
      cmds.length === 5
      && /scout\.mjs$/.test(cmds[0].args[0]) && cmds[0].args.slice(1).join(" ") === "mission stage-lock hallucinations"
      && /mirror\.mjs$/.test(cmds[1].args[0])
      && /capsule_bridge\.mjs$/.test(cmds[2].args[0]) && cmds[2].args.length === 1
      && /benchmark\.mjs$/.test(cmds[3].args[0]) && cmds[3].args[1] === "run"
      && /widget\.mjs$/.test(cmds[4].args[0]) && cmds[4].args[1] === "list");
    // E8 — the widget leg is REPORT-ONLY and must stay that way: `list` reads and
    // prints. If a future edit points it at `register`, this lock-chain would start
    // WRITING the registry from a fail-silent lane, and the widget nobody drove would
    // become a widget nobody chose. The verb is the whole guarantee.
    assert("E8 — the widget leg can only ever READ (a lock must never write the registry)",
      cmds[4].args[1] === "list" && cmds[4].args.length === 2);

    // THE DERIVED-MAP WIRE (dead-wire sweep, 11 Aug 2026 — CONSUMER_NO_PRODUCER, live
    // 8→11 Aug). gateLines() below is handed capsule_map.json, and benchmark opens the
    // same file; its SOLE WRITER is capsule_bridge.mjs, which this chain never ran. The
    // producer is asserted from the SOURCE of lockChain — not from a name typed here — so
    // the check follows the file that is actually read even if that read is re-pointed.
    // Both halves fail loudly if the wire is cut again: absence, and wrong order.
    {
      const at = (n) => cmds.findIndex((c) => c.name === n);
      const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
      const start = src.indexOf("function lock" + "Chain(s,");
      const body = src.slice(start, src.indexOf("const [mode, ...rest]", start));   // lockChain ends at the dispatch
      const readsMap = body.includes("capsule_map.json");
      assert("DERIVED-MAP WIRE — lockChain still reads capsule_map.json, and the chain now carries its SOLE WRITER (capsule_bridge.mjs) instead of leaving that morning's 08:39 heartbeat map on his lock line",
        readsMap && at("capsule_bridge") >= 0);
      assert("DERIVED-MAP WIRE — the ORDER is the data-flow: mirror lands capsules/ BEFORE capsule_bridge derives the map, and both land before benchmark reads it",
        at("mirror") < at("capsule_bridge") && at("capsule_bridge") < at("benchmark"));
    }
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

  // THE LOCK-CHAIN DOOR — the 10 Aug 2026 TRUNCATED_AT_DOOR scar. These strings are
  // the REAL stdout shapes of the spawned organs, copied from their console.log
  // templates: mirror.mjs:354 + :360, benchmark.mjs:866 + :870, scout.mjs:721.
  {
    const MIRROR_OUT = [
      "mirror: backup — 4 capsule(s) snapshotted to capsule_backups/2026-08-10/",
      "mirror: 3/4 · SHORT (inference) → C:\\repo\\dressing-room\\state\\mirror_manifest.json",
    ].join("\n");
    const mr = chainReport("mirror", MIRROR_OUT);
    assert("LOCK-CHAIN DOOR — the mirror's RESULT survives its backup line (the scar: line 1 was all that got through)",
      mr.length === 2 && /3\/4 · SHORT/.test(mr[1]));
    assert("LOCK-CHAIN DOOR — a mirror SHORTFALL can never be swallowed by a successful backup",
      mr.join(" ").includes("SHORT (inference)"));
    assert("LOCK-CHAIN DOOR — a backup FAILURE is kept too (a 'last line' fix would have hidden exactly this)",
      chainReport("mirror", "mirror: backup FAILED (EPERM) — the mirror itself is untouched\nmirror: 4/4 · ok (all ok) → x").length === 2);
    assert("LOCK-CHAIN DOOR — benchmark's documented first-line contract is untouched; a line that names NO organ still stays below",
      (() => { const b = chainReport("benchmark", "benchmark: ok · 7 buckets · regressions 0 · run #12 → x\n  ⚠ dossier.json MALFORMED (non-blocking): bad JSON");
        return b.length === 1 && b[0].startsWith("benchmark: ok ·"); })());
    // 11 Aug 2026 dead-wire sweep — the shape benchmark.mjs ACTUALLY emits now. Its soft
    // fault line self-names, so the warning rides through with the summary instead of the
    // chain printing a clean "ok" over a stale locked count. Fails if either side regresses.
    assert("LOCK-CHAIN DOOR — a benchmark soft fault reaches his terminal at step 10, alongside the summary it contradicts",
      (() => { const b = chainReport("benchmark", "benchmark: ok · 5 buckets · regressions 0 · run #12 → x\nbenchmark: ⚠ capsule_map.json MALFORMED (non-blocking — display only, owner mirror.mjs): locked counts below are 2026-08-10's");
        return b.length === 2 && /capsule_map\.json MALFORMED/.test(b[1]) && !/^benchmark: benchmark:/.test(b[1]); })());
    // 11 Aug 2026 dead-wire sweep — capsule_bridge's REAL stdout, pasted from a live run
    // this session (`node scripts/capsule_bridge.mjs`). It self-names on the summary and
    // indents the rest, so the count he is shown at lock-close is the one that rides
    // through. The chain name must stay `capsule_bridge` for that to happen: rename the
    // lane and the door silently falls back to line 1, which here would still be the
    // summary — so this pins the SELF-NAMED path explicitly rather than the text.
    assert("LOCK-CHAIN DOOR — capsule_bridge's freshly-derived count self-names and reaches him at step 10",
      (() => { const c = chainReport("capsule_bridge",
        "capsule_bridge: 4 capsule(s) · 36 axes · 36 strike questions · 4 overdue → C:\\repo\\dressing-room\\state\\capsule_map.json\n  embeddings ka Re-Jirah 48 din overdue hai\n  schedulers — agree: embeddings, inference, context");
        return c.length === 1 && /^capsule_bridge: 4 capsule\(s\)/.test(c[0]); })());
    assert("LOCK-CHAIN DOOR — and its REFUSAL (a malformed capsule leaves the last true map in place) is never printed as a success",
      chainReport("capsule_bridge", "capsule_bridge: WARN capsules/inference.json UNREADABLE (malformed JSON, not an empty file) — refusing to overwrite the last true map with a short count. Owner: mirror.mjs.\n  capsules/inference.json: Unexpected end of JSON input")
        .join(" ").includes("WARN capsules/inference.json UNREADABLE"));
    assert("LOCK-CHAIN DOOR — an organ that never self-names (scout speaks as 'MISSIONS DESK ·') still reports line 1, prefixed once",
      chainReport("mission", "MISSIONS DESK · staged L-embeddings → dressing-room/missions/L-embeddings.md\n  more").join() ===
      "mission: MISSIONS DESK · staged L-embeddings → dressing-room/missions/L-embeddings.md");
    assert("LOCK-CHAIN DOOR — no line is ever double-prefixed with the organ's name",
      chainReport("mirror", MIRROR_OUT).every((l) => !/^mirror: mirror:/.test(l)));
    assert("LOCK-CHAIN DOOR — a silent organ reports 'ran', never throws",
      chainReport("mirror", "").join() === "mirror: ran" && chainReport("mirror", null).join() === "mirror: ran");
  }

  // THE DISPATCH DOC WIRE — the 10 Aug 2026 DEAD_COMMAND scar. This file's header
  // MODES block and its bare-invocation usage line are the ONLY two places a session
  // learns what this organ accepts, and the forge skill sends it here to read them
  // (.claude/skills/forge/SKILL.md:29). Both had drifted off the switch: the header
  // still sold `axis <a-i> [done|defer]`, refused since 7 Aug, and neither named
  // `lockchain`, dispatched since 8 Aug. Prose does not stay in step with code on its
  // own, so this derives the verb list FROM THE DISPATCH and fails the moment either
  // doc drops one — the same self-source technique as the FORCE DISCARD WIRE assert
  // above, for the same reason: the renderer can be green while the wire is cut.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    // Needles are BUILT, never written whole — a literal written here sits EARLIER in
    // this same file than the block it hunts, so a plain indexOf matches the assert's
    // own string (that scar was paid for once already, two asserts up).
    const dispatch = src.slice(src.indexOf("switch (mode" + ") {"));
    // W0-C (2 Sep 2026): the indent widened from 2 to 2-or-4 because the dispatch moved
    // inside `hookMain()` (R-01 — the SHIM shape cannot reach a cached module, so the
    // hook needs a named export). What this asserts is UNCHANGED: every verb the switch
    // accepts must be named in both docs. The pattern matches a superset of positions,
    // so no case can hide from it — and the assert below still fails on an empty set.
    const verbs = [...dispatch.matchAll(/^ {2,4}case "([a-z]+)":/gm)].map((m) => m[1]);
    const hAt = src.indexOf("// MODES:");   // first hit IS the header block — no line address, addresses rot
    const header = hAt < 0 ? "" : src.slice(hAt, src.indexOf("\n// " + "=".repeat(12), hAt));
    const uAt = src.indexOf("forge_session: start <" + "concept> [--force] |");
    const usage = uAt < 0 ? "" : src.slice(uAt, src.indexOf("\n", uAt));
    // No count is asserted — a hardcoded verb count is exactly the kind of number that
    // rots on the next `case`. Presence of the two verbs the scar was about is the
    // emptiness guard: an empty `verbs` would make `.every` vacuously true.
    assert("DISPATCH DOC WIRE — the dispatch still parses, and carries the two verbs the 10 Aug scar was about",
      verbs.includes("axis") && verbs.includes("lockchain"));
    assert("DISPATCH DOC WIRE — every verb the switch accepts is named in the header MODES block (a verb the header hides does not exist to a session that greps it)",
      header.length > 0 && verbs.every((v) => header.includes(v)));
    assert("DISPATCH DOC WIRE — every verb the switch accepts is named in the bare-invocation usage line too",
      usage.length > 0 && verbs.every((v) => usage.includes(v)));
    assert("DISPATCH DOC WIRE — neither doc re-advertises the OPTIONAL axis argument refused since 7 Aug; both name all three explicit forms",
      !/\[done\|defer\]/.test(header) && !/\[done\|defer\]/.test(usage)
      && /now\|done\|defer/.test(header) && /now\|done\|defer/.test(usage));
  }

  // ── A3 (4 Sep 2026) · THE ZERO-TAX GATES, ON FIXTURES ──────────────────────
  // Pure functions, rows handed in, no disk and no import — the whole reason the
  // gates take `rows` as a parameter. Each check plants exactly ONE violation and
  // requires the gate to bite on it, so a gate that quietly stops biting fails here.
  {
    const T = "2026-09-04T05:00:00.000Z";
    const later = (min) => new Date(Date.parse(T) + min * 60000).toISOString();
    const base = { concept: "tokenization", started_at: T, updated_at: T, step: 3,
      axes_now_at: { a: later(1) }, moments_by_axis: { a: { jirah: 1 } }, bypasses: [] };
    const row = (over = {}) => ({ kind: "capture", id: `x:${Math.abs(Object.keys(over).length)}`, ts: later(5), concept: "tokenization", axis: "a", surface: "code", probe: "recall", register: null, ...over });
    const HINGLISH = row();
    const INTERVIEW = row({ id: "x:iv", register: "interview" });

    assert("A3 AXIS GATE — axis a closes on the Bolo row + the interview line, and NO jirah is required for it (his 4 Sep ruling: grilling is a CONCEPT-level act, STEP 9)",
      axisDoneGate(base, "a", [HINGLISH, INTERVIEW]).ok === true);
    assert("A3 AXIS GATE — ZERO bank rows: refused, and the refusal hands over the exact bank command (never 'try harder')",
      (() => { const g = axisDoneGate(base, "a", []); return g.ok === false && g.missing.some((m) => /no banked answer/.test(m) && /gaffer_brain\.mjs capture/.test(m)); })());
    assert("A3 AXIS GATE — the axis's own jirah moment is NO LONGER a requirement (row 45, 4 Sep 2026): the same two rows with NO jirah moment at all still close the axis, and nothing in the refusal set mentions cross-examination",
      (() => { const g = axisDoneGate({ ...base, moments_by_axis: {} }, "a", [HINGLISH, INTERVIEW]); return g.ok === true && g.missing.length === 0; })());
    assert("A3 AXIS GATE — the INTERVIEW-register line is required: Hinglish alone does not close an axis (two skills, only one of them was ever measured)",
      (() => { const g = axisDoneGate(base, "a", [HINGLISH]); return g.ok === false && g.missing.length === 1 && /INTERVIEW-register/.test(g.missing[0]); })());
    assert("A3 AXIS GATE — a row banked BEFORE the axis was opened does not count for it (one answer may not close nine axes)",
      axisDoneGate(base, "a", [row({ ts: T }), row({ ts: T, id: "x:iv2", register: "interview" })]).ok === false);
    assert("A3 AXIS GATE — another axis's rows never count for this one",
      axisDoneGate(base, "a", [row({ axis: "b" }), row({ axis: "b", id: "x:iv3", register: "interview" })]).ok === false);
    assert("A3 AXIS GATE — a jirah declared while NO axis was current is attributed to no axis at all, never to a guess",
      (() => { const m = addMoment({ ...base, current_axis: null, moments_by_axis: {}, question_moments: { jirah: 0 } }, "jirah"); return m.ok && m.session.question_moments.jirah === 1 && Object.keys(m.session.moments_by_axis || {}).length === 0; })());
    assert("A3 AXIS GATE — `axis x now` stamps the evidence floor, and RE-declaring never moves it (re-declare would reset the floor and void real work)",
      (() => { const one = setCurrentAxis({ ...base, axes_now_at: {} }, "b", new Date(T));
               const two = setCurrentAxis(one.session, "b", new Date(later(90)));
               return one.session.axes_now_at.b === T && two.session.axes_now_at.b === T; })());

    // ── THE LOCK GATE, after his 4 Sep ruling (row 45) ────────────────────────
    // Three terms now, and the fixtures below plant exactly one violation each.
    const NEG = row({ id: "x:neg", probe: "negative_space" });
    const CROSS = row({ id: "x:cross", probe: "cross_axis" });
    const JIR = (a, id) => row({ id, axis: a, probe: "jirah" });
    assert("A3 LOCK GATE — STEP 10 refuses without a negative-space probe (the dossier's #1 senior signal), and passes with one once the other two terms are satisfied",
      lockGate(base, [HINGLISH, INTERVIEW]).ok === false
      && /does NOT do/.test(lockGate(base, []).missing[0])
      && lockGate(base, [NEG, CROSS]).ok === true);
    assert("A3 LOCK GATE — LOCK is REFUSED while any axis marked done lacks a judged jirah row, and the refusal NAMES the missing axes and hands over the exact bank command",
      (() => { const s = { ...base, axes_done: ["a", "b", "c"] };
               const g = lockGate(s, [NEG, CROSS, JIR("a", "x:ja")]);
               return g.ok === false && g.axes_ungrilled.join("") === "bc"
                 && g.missing.some((m) => /axis bc /.test(m) && /--probe jirah/.test(m) && /judge-round/.test(m)); })());
    assert("A3 LOCK GATE — a jirah row nobody JUDGED is a question asked, not a grade: the same rows with that row still outstanding are refused, and the LOCK opens the moment it is settled",
      (() => { const s = { ...base, axes_done: ["a"] }; const ja = JIR("a", "x:ja");
               return lockGate(s, [NEG, CROSS, ja], [ja]).ok === false
                 && lockGate(s, [NEG, CROSS, ja], []).ok === true; })());
    assert("A3 LOCK GATE — nine axes answered one at a time are nine facts, not one concept: with every jirah row judged and a negative-space probe, the LOCK still refuses until ONE cross_axis row exists",
      (() => { const s = { ...base, axes_done: ["a"] };
               const g = lockGate(s, [NEG, JIR("a", "x:ja")]);
               return g.ok === false && g.missing.length === 1 && /CROSS the axes/.test(g.missing[0])
                 && lockGate(s, [NEG, JIR("a", "x:ja"), CROSS]).ok === true; })());
    assert("A3 LOCK GATE — another axis's jirah row never grades this one, and a jirah row banked BEFORE the session started does not count either",
      lockGate({ ...base, axes_done: ["a"] }, [NEG, CROSS, JIR("b", "x:jb")]).ok === false
      && lockGate({ ...base, axes_done: ["a"] }, [NEG, CROSS, row({ id: "x:old", axis: "a", probe: "jirah", ts: "2026-09-03T00:00:00.000Z" })]).ok === false);

    assert("A3 CLOSE GATE — a session that banked NOTHING is refused, and the refusal says what dies with the terminal",
      (() => { const g = closeGate(base, [], []); return g.ok === false && /banked NOTHING/.test(g.missing[0]); })());
    assert("A3 CLOSE GATE — banked answers with no verdict are refused and named (the round's ONE judge call is what is missing)",
      (() => { const g = closeGate(base, [HINGLISH], [HINGLISH]); return g.ok === false && g.unjudged === 1 && /judge-round/.test(g.missing[0]); })());
    assert("A3 CLOSE GATE — banked AND judged closes; an outstanding row belonging to ANOTHER session is not this session's problem",
      closeGate(base, [HINGLISH], []).ok === true
      && closeGate(base, [HINGLISH], [row({ id: "someone-else", ts: "2026-08-01T00:00:00.000Z" })]).ok === true);

    assert("A3 BYPASS — the escape hatch is a ROW with his own reason, and one bypass costs the session its method_clean",
      (() => { const b = recordBypass({ ...base, axes_done: [], axes_deferred: [], steps_done: [0], question_moments: {}, axes_marked_at: {} }, "axis_done:a", "aaj sirf samajh ban rahi hai, bolne ka time nahi tha");
               const cov = coverage({ ...b, axes_done: [], axes_deferred: [], steps_done: STEPS.map((_, i) => i), axes_marked_at: {}, question_moments: { widget_gate: 9 } });
               return b.bypasses.length === 1 && b.bypasses[0].gate === "axis_done:a" && /bolne ka time/.test(b.bypasses[0].why)
                 && cov.bypass_count === 1 && cov.method_clean === false; })());
    assert("A3 · a session written before these fields existed still gates: a missing now-mark falls back to the session's own start, so rows banked before it are absent evidence, never a pass",
      axisDoneGate({ concept: "x", started_at: T }, "a", [row({ id: "x:pre", ts: "2026-09-03T00:00:00.000Z" }), row({ id: "x:pre2", ts: "2026-09-03T00:00:00.000Z", register: "interview" })]).ok === false
      && lockGate({ concept: "x", started_at: T }, []).ok === false);
    assert("A3 · reps_log is NEVER touched by any gate — the three of them read gaffer_brain's bank and nothing else (capture.mjs stays its sole writer)",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const blk = src.slice(src.indexOf("export function axisDoneGate"), src.indexOf("// COVERAGE — the thing that was invisible"));
               return !/REPS|reps_log|writeFileSync|appendFileSync/.test(blk); })());
  }

  // ── A3 · THE STOP→PROMPT CLOCK (4 Sep 2026) ────────────────────────────────
  {
    const T = new Date("2026-09-04T05:00:00.000Z");
    const at = (ms) => new Date(T.getTime() - ms).toISOString();
    assert("A3 LATENCY — measured off the Stop hook's own stamp, in milliseconds, so the teacher never has to guess",
      stopToPromptMs({ stop: { at: at(4200) } }, null, T) === 4200);
    assert("A3 LATENCY — teaching_contract's checked_at is the fallback anchor (same hook, same instant)",
      stopToPromptMs(null, { checked_at: at(9000) }, T) === 9000 && stopToPromptMs({ stop: {} }, { checked_at: at(150) }, T) === 150);
    assert("A3 LATENCY — NO readable anchor ⇒ null, never a number. A missing measurement and a fast answer must never look alike",
      stopToPromptMs(null, null, T) === null && stopToPromptMs({ stop: { at: "yesterday" } }, null, T) === null);
    assert("A3 LATENCY — a negative gap (clocks disagreeing) and a half-hour gap (he walked away) both read UNMEASURED rather than as a reaction time",
      stopToPromptMs({ stop: { at: at(-5000) } }, null, T) === null && stopToPromptMs({ stop: { at: at(45 * 60000) } }, null, T) === null);
    assert("A3 LATENCY — the contract PRINTS it, and when it cannot it says so and tells the teacher to leave the flag off (the skill documented this line before it existed)",
      (() => { const S0 = blank("tokenization", T); const s3 = setStep(S0, 3).session;
               const withClock = contractLines(s3, T, 4200).join("\n");
               const without = contractLines(s3, T, null).join("\n");
               const absent = contractLines(s3, T).join("\n");
               return /latency: 4200 ms/.test(withClock) && /--latency_ms 4200/.test(withClock)
                 && /latency: UNMEASURABLE/.test(without) && /leave .*--latency_ms.* OFF/.test(without)
                 && !/latency/.test(absent); })());
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
// ORDER IS THE WIRE HERE — the list is a data-flow, not a menu. Each lane below
// consumes what the lane above it wrote: mirror lands capsules/ → capsule_bridge
// derives capsule_map.json from them → benchmark and gateLines() read that map.
function chainCommands(concept) {
  return [
    { name: "mission",   args: [join(__dirname, "scout.mjs"), "mission", "stage-lock", concept], timeout: 15000 },
    // LADDER G16 (9 Aug 2026): the mirror goes EVENT-DRIVEN on the lock-close —
    // a capsule locked at 15:00 used to stay invisible to every reader until the
    // next 06:55 morning pull. No number introduced: the event IS the schedule.
    { name: "mirror",    args: [join(__dirname, "mirror.mjs")], timeout: 30000 },
    // DEAD-WIRE SWEEP, 11 Aug 2026 — a CONSUMER_NO_PRODUCER live since 8 Aug.
    // G16 above refreshes `capsules/`, but almost nobody reads capsules/: they read
    // the DERIVED capsule_map.json, whose SOLE WRITER is capsule_bridge.mjs — and this
    // chain never ran it (`grep -c capsule_bridge scripts/forge_session.mjs` returned 0).
    // Its only automated invoker is the 08:39 heartbeat (heartbeat_config.json `order`),
    // so at every lock the map stayed at that morning's version while the capsule under
    // it had just changed. Two unsynchronised paths, provable off disk: capsules/*
    // 2026-08-10T16:09:35Z vs capsule_map.json 20:49:39Z. G16's stated goal was therefore
    // met for capsules/ and UNMET for every capsule_map reader — the gate line printed to
    // him seconds later at lock-close (gateLines below, :1708), benchmark's locked count,
    // manager's sheet (manager.mjs:290), postmatch's SEASON.md row (postmatch.mjs:241),
    // learnstate's brief (learnstate.mjs:62).
    // The ORDER moved too, and that half matters as much: benchmark used to sit ABOVE the
    // mirror, so it read the map before the newly locked capsule had even landed on disk.
    // SINGLE-WRITER is honoured, not bent — this SHELLS the owner (dugout.mjs → doubtminer.mjs
    // precedent); nothing here opens capsule_map.json for writing.
    // No new number: 15000 is the mission lane's own local-only budget, copied because
    // capsule_bridge is disk-only in exactly the same way — the 30000 above buys mirror's
    // network round-trip, and this lane has none.
    { name: "capsule_bridge", args: [join(__dirname, "capsule_bridge.mjs")], timeout: 15000 },
    { name: "benchmark", args: [join(__dirname, "benchmark.mjs"), "run"], timeout: 20000 },
    // E8 (12 Aug 2026) — WIDGET GETS A DRIVER. Measured across all 75 scripts, four
    // organs were reachable only by him typing their name: python_state · shipped ·
    // widget · course. `shipped` turned out to be a MISREAD — heartbeat's own chain
    // runs it daily (heartbeat.mjs DEFAULTS order), so it has had an owner all along.
    // Of the true three, `widget` is the only one with a live trigger TODAY: the
    // Visualization Contract is in force by his own 1 Aug ruling ("11 point yes
    // visuals are important for my adhd pi brain"), and a capsule reaching LOCK is
    // exactly the moment to ask whether its ONE widget exists. python_state and
    // course stay honestly dormant — he has not started either track — and their
    // un-dormanting event is him starting it, not a driver invented today.
    // REPORT-ONLY by construction: `list` reads and prints, it can neither register
    // nor generate, so a lock can never be blocked or altered by this lane. Same
    // fail-silent contract as every other leg, and it runs AFTER the step is saved.
    // 15000 is the disk-only budget copied from the mission/capsule_bridge lanes
    // above — `list` makes no network call, exactly like them.
    { name: "widget", args: [join(__dirname, "widget.mjs"), "list"], timeout: 15000 },
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

// THE DOOR (repaired 10 Aug 2026 — a TRUNCATED_AT_DOOR defect, live since 9 Aug).
// This loop printed `out.trim().split("\n")[0]` — line 1 of a spawned organ and
// nothing else. benchmark.mjs and scout.mjs were BUILT around that contract and say
// so in their own comments (`grep -n "forge_session" scripts/benchmark.mjs`), so
// line 1 stays the fallback and their output is unchanged by this repair.
// mirror.mjs is the one that broke it: it joined the chain on 9 Aug (LADDER G16)
// already printing LADDER E9's backup line FIRST — `mirror: backup — N capsule(s)
// snapshotted …` (mirror.mjs:354) — and its actual answer SECOND —
// `mirror: <counter> · <status> (<shortfall>)` (mirror.mjs:360). capsules/ is never
// empty, so the backup line always fired first and the ONE question the mirror was
// spawned to answer at step 10 — did the capsule he just locked land, what is short —
// never reached his terminal. A backup line read as success.
// THE RULE NOW: every line an organ SELF-NAMES (`<name>: …`) is kept, in order. No
// line is chosen on the organ's behalf, no failure is guessed away — including
// `mirror: backup FAILED …`, which under the old door was the only line that showed
// and under a naive "take the last line" fix would have been the only one hidden.
// Live shapes today (11 Aug 2026): mirror 2 self-named lines · benchmark 1 or 2
// (`benchmark: ok` / `benchmark: WARN`, plus one `benchmark: ⚠ <file> MALFORMED
// (non-blocking …)` per soft fault) · scout 0 — it speaks as "MISSIONS DESK ·", so it
// takes the line-1 fallback, byte-identical to what it printed before.
// (Corrected 11 Aug 2026: this read "its indented ⚠ fault lines do not self-name and stay
// below, as benchmark.mjs intends". True when written, and it named a real dead wire as an
// intention: benchmark's soft-fault line was written unnamed to protect the OLD first-line-
// only door, so the same pass that opened this door left that line locked outside it — a
// stale locked count shipped under a clean `benchmark: ok` at every step-10 lock. Fixed in
// benchmark.mjs, which now self-names it; this door needed no change, which is the point.)
function chainReport(name, out) {
  const lines = String(out || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const own = lines.filter((l) => l.toLowerCase().startsWith(name.toLowerCase() + ":"));
  if (own.length) return own;                       // the organ named itself — believe all of it
  return [`${name}: ${lines[0] || "ran"}`];         // it didn't — the old contract, unchanged
}

function lockChain(s, { dry = false } = {}) {
  const safeJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
  const safeJsonl = (p) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
  console.log(`\n== LOCK-CHAIN (outward, Ruling 2)${dry ? " — PREVIEW: spawns named, not fired" : ""} ==`);
  for (const cmd of chainCommands(s.concept)) {
    if (dry) { console.log(`  would run: node scripts/${cmd.args[0].replace(/^.*[\\/]/, "")} ${cmd.args.slice(1).join(" ")}`); continue; }
    try {
      const out = execFileSync(process.execPath, cmd.args, { encoding: "utf8", timeout: cmd.timeout });
      for (const l of chainReport(cmd.name, out)) console.log(`  ${l}`);
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
// THE HOOK DOOR (W0-C, 2 Sep 2026 · R-01) — and it exists because W0-D BROKE THIS LINE
// EARLIER TODAY. W0-D made this organ importable (five organs now read its staleness
// predicate) and gave it the argv guard below. What it did not notice is that
// `turn_hook` reaches `boot` through the SHIM shape, which works by rewriting
// process.argv[1] so that guard evaluates true — and an ES module body runs ONCE per
// process. `turn_hook:124` runs learnstate, learnstate now imports THIS FILE, so by
// line 125 the body was already cached and `boot` printed nothing at SessionStart.
// Proven by running the real sequence, and the same shape that killed the outbox brief
// and the captain's call on 18 Aug. So the dispatch gets a name and turn_hook rides the
// CALL shape, which the module cache cannot swallow. The suite now ratchets the class:
// see "NO SHIM CALLEE" in organism_test.mjs.
// Direct invocation is unchanged: `node scripts/forge_session.mjs <verb>` runs exactly
// what it always ran.
const INVOKED_DIRECTLY = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

// ── A3 · THE BANK IS READ THROUGH ITS OWNER, AND ONLY ON THE GATE PATHS ──────
// gaffer_brain.mjs owns the capture rows, so `bankRows` comes from there rather than
// a second reader of gaffer_grade_queue.jsonl living in this file (owners-only, read
// side — one reader means a gate can never drift from the door that wrote the row).
// DYNAMIC, and that is the whole point: this file is imported by learnstate.mjs and
// reached by the SessionStart and per-turn hooks, while gaffer_brain pulls register,
// models and gaffer_state behind it. A static import would put ~3,000 lines and three
// organs into every hook turn to serve three CLI verbs. Failure is NOT silent and it
// is NOT a pass: an unreadable bank returns null, and every gate below treats null as
// "cannot testify" and REFUSES rather than waving the axis through.
async function readBank(concept) {
  try {
    const g = await import("./gaffer_brain.mjs");
    return { rows: g.bankRows({ concept }), outstanding: g.outstandingBank() };
  } catch (e) {
    return { rows: null, outstanding: null, why: String((e && e.message) || e).slice(0, 160) };
  }
}
// The gate's voice, in one place so all three sound the same: what is missing, and
// the exact command that fixes it. Never a scolding, never a score.
function gateRefusal(title, missing, bypassHint) {
  const L = [`forge_session: ${title}`];
  for (const m of missing) L.push(`  · ${m}`);
  L.push(`  → ya phir, agar aaj yeh sach mein nahi ho sakta: ${bypassHint}  (yeh row par darj hota hai aur session method_clean nahi rehta — chhupta kuch nahi)`);
  return L.join("\n");
}

export async function hookMain() {
  const [mode, ...rest] = process.argv.slice(2);
  // `--no-rep-why "<his words>"` — the one escape hatch, shared by all three gates.
  const bypassWhy = (() => { const i = rest.indexOf(GATE_BYPASS_FLAG); return i >= 0 ? String(rest[i + 1] || "").trim() : null; })();
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
        const when = Number.isFinite(age) ? `started ${age.toFixed(1)}h ago${isStale(prev) ? ", STALE" : ""}` : "age unknown";
        console.error(`forge_session: '${prev.concept}' is still open (STEP ${prev.step} ${STEPS[prev.step] || "?"}, axes done ${prev.axes_done.join("") || "—"}, ${when}).`);
        // W0-D: `resume` is offered ONLY when he is re-typing THIS concept. Offering it
        // for a different concept would be the same trap the --force omission avoids —
        // it would look like the way forward and would silently continue the OLD topic.
        // `--force` still stays unnamed here, deliberately (31 Jul: never offer the
        // discard at the moment the command is being retyped).
        if (isStale(prev) && prev.concept === String(concept).trim().toLowerCase()) {
          console.error("  → `node scripts/forge_session.mjs resume` — wahi concept, wahin se aage. Nothing is blanked, nothing re-taught.");
        }
        console.error("  → `node scripts/forge_session.mjs close` first — that is the only thing that saves the coverage report. Then re-run start.");
        process.exit(1);
      }
      // RECORD BEFORE DISCARD: a --force overwrite still leaves a row behind.
      if (prev && !prev.closed_at && force) {
        // The discarded session's teaching drifts ride along too: a --force row is a
        // session ending WITHOUT a close report, so this row is the only trace it leaves.
        const d = teachingDrifts(loadTeaching(), prev.started_at);
        // Computed BEFORE the append and off the SAME disk snapshot the row carries —
        // `close`'s rule, and it is what lets the failure branch print the record
        // instead of losing it (the return value used to be dropped right here).
        const cov = coverage(prev);
        const recorded = appendCoverage(prev, "force", {
          ...(prev.concept === String(concept).trim().toLowerCase() ? { continues: prev.started_at || null } : {}),
          ...(d ? { teaching_drifts: d } : {}),
        });
        for (const l of forceDiscardLines(prev, recorded, cov)) console.log(l);
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
      } catch (e) {
        // W0-A (1 Sep 2026): scout now REFUSES a concept the syllabus does not know, and this
        // is the door that concept came through — on 19 Aug his whole kickoff sentence reached
        // `forge start` and became a mission id, a row and a 195-char filename. Printing
        // "scout unavailable" over a refusal would hide the one message worth reading.
        const said = String((e && (e.stderr || e.stdout)) || "").trim().split("\n").find(l => l.trim());
        console.log(said ? `scout: ${said.replace(/^MISSIONS DESK · /, "")} — non-blocking` : "scout: topic mission not staged (scout unavailable) — non-blocking");
      }
      break;
    }
    case "step": {
      const before = load();
      // ── A3 · THE LOCK GATE (step 10) ────────────────────────────────────────
      // Checked BEFORE the step moves, so a refusal leaves the session exactly where
      // it stood and the lock-chain below never fires on a concept that has not been
      // asked the one question a senior room always asks.
      // THE GATE GUARDS THE CROSSING, NOT THE NUMBER 10 (4 Sep 2026, verifier finding).
      // `setStep` permits any jump, so `step 11` walked straight past a refused `step 10`:
      // RE-JIRAH became reachable with no lock, and because `wasAtLock` stayed false the
      // re-lock sidecar and the lock-chain never fired at all on a 9→11 path.
      const crossingLock = (() => { const k = parseStep(rest[0]); return Number.isInteger(k) && k >= 10 && !(before && Number(before.step) >= 10); })();
      if (crossingLock && before && before.concept) {
        const bank = await readBank(before.concept);
        const g = bank.rows === null
          ? { ok: false, missing: [`the bank could not be read (${bank.why}), so nothing can testify that the Jirah round or the negative-space probe happened — a gate that cannot see must refuse, not wave through`] }
          : lockGate(before, bank.rows, bank.outstanding);
        if (!g.ok) {
          // The bypass ROW KEEPS ITS NAME (L9): `lock_negative_space` is what four
          // months of history rows say, and renaming it would silently split the one
          // series anybody would ever count. The gate behind the name grew; the label
          // is an id, not a description.
          if (bypassWhy) { save(recordBypass(before, "lock_negative_space", bypassWhy)); console.log(`forge_session: LOCK gate bypassed — "${bypassWhy}" (recorded; method_clean is now false for this session)`); }
          else { console.error(gateRefusal(`STEP 10 abhi nahi — LOCK se pehle ${g.missing.length === 1 ? "ek cheez" : `${g.missing.length} cheezein`} baaki ${g.missing.length === 1 ? "hai" : "hain"}:`, g.missing, `\`node scripts/forge_session.mjs step 10 ${GATE_BYPASS_FLAG} "<kyun>"\``)); process.exit(1); }
        }
      }
      const s = apply(setStep(live(need(load())), rest[0]));
      console.log(oneLine(s));
      // ── A8 (4 Sep 2026) · THE RE-LOCK SIDECAR, ON ARRIVAL AT STEP 10 ────────
      // Written BEFORE the lock-chain, because the chain shells mirror.mjs — the
      // capsules' sole writer — and this row must not depend on outward work
      // succeeding (Ruling 2's own reasoning, one layer down). Refused loudly and
      // NON-BLOCKINGLY when the evidence is not there: reaching step 10 is not the
      // same claim as "this concept is proven again", and only the second one may
      // restart a Re-Jirah schedule.
      if (s.step >= 10 && crossingLock) {
        try {
          const bank = await readBank(s.concept);
          const judged = bank.rows === null ? 0
            : bank.rows.filter((r) => { const t = Date.parse(r.ts || ""); const t0 = Date.parse(s.started_at || "");
                return Number.isFinite(t) && (!Number.isFinite(t0) || t >= t0) && !(bank.outstanding || []).some((o) => o && o.id === r.id); }).length;
          const rl = relockRow(s, coverage(s), judged);
          if (rl.ok) {
            mkdirSync(dirname(RELOCKS), { recursive: true });
            appendFileSync(RELOCKS, JSON.stringify(rl.row) + "\n");
            console.log(`forge_session: RE-LOCK recorded — '${s.concept}' proven again on ${rl.row.relockedOn} (sidecar; the capsule file is byte-identical, mirror.mjs is still its only writer).`);
            console.log(`  Re-Jirah restarts from TODAY: R1 in 3 days. \`node scripts/deep.mjs due\``);
          } else {
            console.log(`forge_session: no re-lock recorded — ${rl.why.join(" · ")}. STEP 10 still stands; the topic simply keeps the proof status it had.`);
          }
        } catch (e) { console.log(`forge_session: re-lock sidecar skipped (${String((e && e.message) || e).slice(0, 100)}) — the LOCK itself is unaffected`); }
      }
      // THE LOCK-CHAIN fires exactly on ARRIVAL at step 10 (never on a re-type),
      // after the step change is already saved — outward work can fail without
      // touching the LOCK (Ruling 2, 8 Aug 2026).
      if (s.step >= 10 && crossingLock) lockChain(s);
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
        console.error(`  axis ${rest[0] || "<x>"} done   → axis COMPLETE (uska Bolo + ek INTERVIEW line bank ho chuki ho; grilling ab STEP 9 ke round mein hoti hai)`);
        console.error(`  axis ${rest[0] || "<x>"} defer  → aaj nahi — deferred list mein (core axis d kabhi nahi)`);
        process.exit(1);
      }
      if (how === "now" || how === "on" || how === "current") {
        console.log(oneLine(apply(setCurrentAxis(live(need(load())), rest[0]))));
      } else {
        // ── A3 · THE AXIS GATE ────────────────────────────────────────────────
        // `defer` is NOT gated: deferring is an honest "not today", and gating it
        // would push a tired evening toward `done` — the exact opposite of what this
        // whole block exists to prevent. Only the CLAIM is gated.
        if (how === "done") {
          const cur = live(need(load()));
          const bank = await readBank(cur.concept);
          const g = bank.rows === null
            ? { ok: false, missing: [`the bank could not be read (${bank.why}) — a gate that cannot see the evidence must refuse, never assume it is there`] }
            : axisDoneGate(cur, rest[0], bank.rows);
          if (g.error) { console.error(`forge_session: ${g.error}`); process.exit(1); }
          if (!g.ok) {
            if (bypassWhy) { save(recordBypass(cur, `axis_done:${String(rest[0]).toLowerCase()}`, bypassWhy)); console.log(`forge_session: axis ${rest[0]} gate bypassed — "${bypassWhy}" (recorded; method_clean is now false for this session)`); }
            else { console.error(gateRefusal(`axis ${rest[0]} abhi CLOSE nahi ho sakta — uska apna saboot disk par nahi hai:`, g.missing, `\`node scripts/forge_session.mjs axis ${rest[0]} done ${GATE_BYPASS_FLAG} "<kyun>"\``)); process.exit(1); }
          }
        }
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
    case "resume": {
      // need(), NOT live() — live() REFUSES a stale session, and a stale session is the
      // only thing this verb exists for. Same reasoning `close` states one case down.
      const before = need(load());
      const r = resumeSession(before);
      if (!r.ok) { console.error("forge_session: " + r.error); process.exit(1); }
      save(r.session);
      const last = r.session.resumes[r.session.resumes.length - 1];
      console.log(oneLine(r.session));
      console.log(`forge_session: RESUMED '${r.session.concept}' after ${last.after_h === null ? "an unmeasurable gap" : last.after_h + "h"} — the pacer is speaking again.`);
      // The pointer is the whole point of the verb: it says where he was, in the
      // language the boot line uses, so nothing gets re-taught.
      const left = AXES.filter((a) => !r.session.axes_done.includes(a) && !r.session.axes_deferred.includes(a));
      console.log(`  continue at STEP ${r.session.step} ${STEPS[r.session.step] || "?"}`
        + (r.session.current_axis ? ` · ON axis ${r.session.current_axis}` : "")
        + ` · left ${left.join("") || "—"} — do NOT re-teach ${r.session.axes_done.join("") || "the done axes"}.`);
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
      // The clock is read HERE (not inside the pure renderer) for the same reason the
      // dossier line is: fixtures stay disk-free, and an unreadable audit file costs
      // nothing but the line itself.
      const lines = contractLines(sNow, new Date(), stopToPromptMs(loadAuditLast(), loadTeaching()));
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
      { const n = nudgeLine(); if (n) console.log(n); }   // F5 (9 Aug): the silence law means ZERO bytes, not one newline
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
      // ── A3 · THE CLOSE GATE ────────────────────────────────────────────────
      // VERIFIES the round's one judge call; it does not RUN it. Deliberate, and it
      // is the safer half of the order's "runs/verifies": this organ stays model-free
      // and token-free, `judge-round` keeps its single home in the evening close
      // (/full-time runs it, then this), and the whole gate is a count of rows — so
      // it behaves identically in a sandbox, in CI and on his laptop with the window
      // shut. The refusal happens BEFORE anything is recorded and leaves the session
      // OPEN: the coverage report is a session's only durable trace, so this gate may
      // never be the reason one is unreachable.
      // HOISTED out of the gate block (4 Sep 2026, his row-45 ruling): the close
      // REPORT now names the axes that reached the LOCK with no judged jirah row, and
      // that answer lives in the bank, not in the session file. Read ONCE, so the gate
      // and the report can never disagree about the same disk.
      const bank = await readBank(s.concept);
      {
        // ⚠ FAILS CLOSED, like the other two (4 Sep 2026, found by the rung's own verifier).
        // The first draft returned `{ok:true}` on an unreadable bank, reasoning that a gate
        // must not strand a real session's report. That reasoning is right about the REPORT
        // and wrong about the GATE: it contradicted this file's own declared law one screen
        // up ("every gate below treats null as 'cannot testify' and REFUSES"), and it meant
        // any import-time failure anywhere in gaffer_brain — or in register, models or
        // gaffer_state behind it — silently turned A3's evidence law off for `close`, with
        // no bypass row and no method_clean penalty. Proven by appending a syntax error to
        // the sandbox's gaffer_brain: axis and step refused, close sailed through.
        // The report is NOT stranded: `--no-rep-why` still closes, and now it leaves a row
        // saying the bank could not be read — which is the fact worth keeping.
        const g = bank.rows === null
          ? { ok: false, missing: [`the bank could not be read (${bank.why}) — nothing can testify that tonight's answers were judged, and a gate that cannot see must refuse rather than assume`] }
          : closeGate(s, bank.rows, bank.outstanding);
        if (!g.ok) {
          if (bypassWhy) { save(recordBypass(s, "close_unjudged", bypassWhy)); console.log(`forge_session: close gate bypassed — "${bypassWhy}" (recorded; method_clean is now false for this session)`); }
          else {
            console.error(gateRefusal(`session abhi band nahi ho sakti — jo bola gaya woh abhi tak record par nahi hai:`, g.missing, `\`node scripts/forge_session.mjs close ${GATE_BYPASS_FLAG} "<kyun>"\``));
            console.error(`  (session KHULI hai — kuch blank nahi hua, kuch re-teach nahi hoga: \`node scripts/forge_session.mjs resume\`)`);
            process.exit(1);
          }
        }
      }
      const cov = coverage(load());
      // Computed BEFORE the append so the history row carries the same thing stdout
      // says — a number read once in a terminal and never written down is not a record.
      const drifts = teachingDrifts(loadTeaching(), s.started_at);
      // audit #108 — read BEFORE the append too, and for the same reason as the drifts:
      // whatever stdout is about to say about this session must be computed off one
      // snapshot of disk, not re-read after the close has already moved things.
      const reps = repsBanked(s.started_at);
      console.log(JSON.stringify(cov, null, 2));
      let recorded = null;                  // F5 (9 Aug): the "recorded" line stops asserting what it never checked
      if (shouldRecordClose(s)) {           // RECORD BEFORE REFUSE · double-close appends once
        // LR-04 (W0-D, 2 Sep 2026): the rep count was computed right here and printed to
        // a terminal, and that was the whole of it — forge_sessions.jsonl carried no rep
        // field, so "this session banked NOTHING" died with the scrollback. Two
        // post-restart tokenization sessions closed exactly that way and nothing
        // downstream could see it. His order ("an uncaptured rep did not happen") needs
        // the fact to OUTLIVE the terminal, and this row is the organ's only durable
        // record of a session. Same disk snapshot as the drifts, same read-only terms:
        // capture.mjs remains the sole writer of reps_log.jsonl.
        recorded = appendCoverage(s, "close", {
          ...(drifts ? { teaching_drifts: drifts } : {}),
          reps_banked: reps && reps.present ? reps.reps : 0,
          reps_log_present: !!(reps && reps.present),
        });
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
      // REWORDED 4 Sep 2026 on his ruling (row 45), and re-SOURCED with it. The old
      // line read "axes marked done without their OWN jirah" off cov.axes_ungraded —
      // a session-state counter that, now the per-axis jirah is gone, would fire on
      // EVERY axis of EVERY honest session and become the always-fires warning this
      // file already names as a failure mode (see jirahNeverRanLine). The question
      // worth printing is the one the LOCK now asks, so it is answered by the LOCK's
      // own function against the same bank snapshot. cov.axes_ungraded and
      // cov.axes_graded stay ON THE HISTORY ROW, unchanged and unrenamed (L9) — a
      // four-month series nobody may silently redefine.
      const ung = bank.rows === null ? null : lockGate(s, bank.rows, bank.outstanding).axes_ungrilled;
      if (ung === null) R.push(`  axes without a judged jirah row at lock: UNKNOWN — the bank could not be read (${bank.why})`);
      else if (ung.length) R.push(`  axes without a judged jirah row at lock (taught and closed, never grilled at STEP 9): ${ung.join("")}`);
      // #108 — the CAUSE under that line, which nothing had ever named (see jirahNeverRanLine).
      const jl = jirahNeverRanLine(cov);
      if (jl) R.push(`  ${jl}`);
      if (cov.core_missing.length) R.push(`  CORE axis ${cov.core_missing.join("")} never closed (CORE-NEVER-DEFERRED — canon forbids deferring it)`);
      if (cov.widget_gates < WIDGET_GATES_MIN) R.push(`  widget guess-gates driven ${cov.widget_gates}/${WIDGET_GATES_MIN} — built is not driven`);
      if (cov.check_q_refused) R.push(`  check-questions REFUSED: ${cov.check_q_refused} (quiz-dump attempts)`);
      // A3 — said out loud, with HIS reason, every time. A bypass is legal; a silent
      // one would make itself the normal path by the third tired evening.
      if (cov.bypass_count) R.push(`  EVIDENCE GATES BYPASSED: ${cov.bypass_count} — ${cov.bypasses.map((b) => `${b.gate} ("${b.why}")`).join(" · ")}`);
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
      R.push(recorded === false
        ? `forge_session: history append FAILED — the coverage above is the ONLY copy; save it (F5)`
        : recorded === null
          ? `forge_session: already closed earlier — nothing re-recorded (the history line exists)`
          : `forge_session: recorded to ${HISTORY}`);
      console.log(R.join("\n"));
      break;
    }
    case "selftest": selftest(); break;
    default:
      // `lockchain` was missing here too until the 10 Aug DEAD_COMMAND repair — a verb
      // dispatched at the `case` below but named by neither doc is a command only its
      // author knows exists. Keep this line and the header MODES block in step with the
      // switch; the selftest reads all three out of this file's own source and fails if
      // they diverge (grep -n "DISPATCH DOC WIRE").
      console.log("forge_session: start <concept> [--force] | step <0-11> | axis <a-i> now|done|defer (arg REQUIRED — bare form refuses) | moment <" + MOMENTS.join("|") + "> | lockchain (read-only preview of the step-10 chain) | resume (wake a STALE session where it stands — nothing blanked) | status | contract | boot | close | selftest"
        + `\n  evidence gates (A3): \`step 10\` needs a judged \`--probe ${JIRAH_PROBE}\` row for EVERY done axis + a negative-space probe + one cross_axis row · \`axis <x> done\` needs his banked Bolo + an interview-register line (NO jirah — that moved to the STEP 9 round, his ruling 4 Sep 2026) · \`close\` needs every banked answer judged. Each takes ${GATE_BYPASS_FLAG} "<reason>" — recorded, counted, method_clean false.`);
  }
}
if (INVOKED_DIRECTLY) await hookMain();
