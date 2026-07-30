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
//
// WRITER OF: dressing-room/state/forge_session.json
// READS:     nothing else (self-contained by design — the pacer has no deps)
// MODES: start <concept> [--force] · step <0-11> · axis <a-i> [done|defer]
//        · moment <kind> · status · contract · close · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SESSION   = join(STATE_DIR, "forge_session.json");

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
  return { ok: true, session: { ...s, axes_done: done.sort(), axes_deferred: def.sort(), updated_at: nowISO(now) } };
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
  const L = [];
  L.push(`FORGE CONTRACT · ${s.concept} · STEP ${n}/${STEPS.length - 1} = ${STEPS[n]}`);
  L.push(`  THE METHOD order: ${STEPS.map((t, i) => (i === n ? `[${i} ${t}]` : `${i} ${t}`)).join(" · ")}`);
  if (skipped.length) L.push(`  ⚠ SKIPPED so far: ${skipped.map((i) => `${i} ${STEPS[i]}`).join(" · ")} — say so out loud, or go back.`);
  L.push(`  axes: done ${s.axes_done.join("") || "—"} · deferred ${s.axes_deferred.join("") || "—"} · left ${AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a)).join("") || "—"}`);
  L.push(`  question-moments used: ${MOMENTS.map((m) => `${m} ${s.question_moments[m] || 0}`).join(" · ")} (only these four are legal — no quiz-dump)`);
  if (SOFT_PHASE(n)) {
    L.push((s.check_q_this_pass || 0) >= 1
      ? `  ⛔ ONE check-question already spent this pass. TEACH or advance the step — do NOT ask another.`
      : `  phase 3-6: max ONE sharp check-question this pass, and only on what you JUST taught.`);
  }
  if (n === 4) L.push(`  step 4 owes a WIDGET (Visualization Contract): stepper, no autoplay, guess-gates, his own FinOps data.`);
  if (n === 7) L.push(`  step 7 BOLO is voice-first: he speaks it, THEN types the transcript. Non-negotiable.`);
  return L;
}

// COVERAGE — the thing that was invisible before: what actually ran.
function coverage(s) {
  const ran = STEPS.map((_, i) => i).filter((i) => s.steps_done.includes(i));
  const missed = STEPS.map((_, i) => i).filter((i) => !s.steps_done.includes(i));
  const untouched = AXES.filter((a) => !s.axes_done.includes(a) && !s.axes_deferred.includes(a));
  return {
    concept: s.concept,
    steps_ran: ran,
    steps_missed: missed,
    steps_pct: Math.round((100 * ran.length) / STEPS.length),
    axes_done: [...s.axes_done],
    axes_deferred: [...s.axes_deferred],
    axes_untouched: untouched,
    question_moments: { ...s.question_moments },
    check_q_refused: s.check_q_refused || 0,     // quiz-dump attempts, kept legible at close
    honest: missed.length === 0 && untouched.length === 0,
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
    const prev = load();
    if (prev && !prev.closed_at && hoursSince(prev.started_at) <= STALE_HOURS && !force) {
      console.error(`forge_session: '${prev.concept}' is still open (STEP ${prev.step} ${STEPS[prev.step]}, axes done ${prev.axes_done.join("") || "—"}).`);
      console.error("  → `close` it first (that emits the coverage report), or re-run with --force to discard it.");
      process.exit(1);
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
  case "close": {
    const s = need(load());
    console.log(JSON.stringify(coverage(s), null, 2));
    save({ ...s, closed_at: nowISO() });
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log("forge_session: start <concept> [--force] | step <0-11> | axis <a-i> [done|defer] | moment <" + MOMENTS.join("|") + "> | status | contract | close | selftest");
}
